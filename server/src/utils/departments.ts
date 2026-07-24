/**
 * Department Reference Data
 *
 * SmartAlert stores `department` as a plain string on the User and Course
 * documents (Chapter Three, Section 3.3.2) rather than as a foreign key. The
 * canonical list of allowed names now lives in a `Departments` collection and
 * is mutable through the admin panel, but the guards and serializers that need
 * a department name resolved cannot afford a database round-trip on every call.
 *
 * So this module keeps a module-level in-memory cache. It is seeded
 * synchronously from `unibenFaculties` at import time — so any code path that
 * runs before the DB has been read (unit tests that never seed, a request that
 * lands during a cold boot) behaves exactly as it did when departments were
 * hard-coded — and refreshed from the `Department` collection by
 * `loadDepartmentsFromDb()` once a connection is available. The public read
 * functions stay synchronous and simply read the cache.
 *
 * Launch scope is the Department of Computer Science, University of Benin.
 * The wider map is kept here so a second department can be switched on without
 * a schema change, and it doubles as the seed source for the collection.
 */

import Department from '../model/department.model';

export interface DepartmentRef {
  name: string;
  /**
   * The short code the admin panel lists departments by, and the prefix its
   * courses carry (CSC 401). It is display and reference data only: the value
   * persisted on a User or Course is always the full `name`, so that a code
   * being reassigned cannot silently repoint existing records.
   */
  code: string;
}

export type FacultyMap = {
  [key: string]: DepartmentRef[];
};

export const unibenFaculties: FacultyMap = {
  'Faculty of Physical Sciences': [
    { name: 'Department of Chemistry', code: 'CHM' },
    { name: 'Department of Computer Science', code: 'CSC' },
    { name: 'Department of Geology', code: 'GLY' },
    { name: 'Department of Mathematics', code: 'MTH' },
    { name: 'Department of Physics', code: 'PHY' },
    { name: 'Department of Statistics', code: 'STA' },
  ],
  'Faculty of Engineering': [
    { name: 'Department of Chemical Engineering', code: 'CHE' },
    { name: 'Department of Civil Engineering', code: 'CVE' },
    { name: 'Department of Computer Engineering', code: 'CPE' },
    { name: 'Department of Electrical/Electronics', code: 'EEE' },
    { name: 'Department of Industrial Engineering', code: 'IPE' },
    { name: 'Department of Marine Engineering', code: 'MRE' },
    { name: 'Department of Materials & Metallurgical Engineering', code: 'MME' },
    { name: 'Department of Mechanical Engineering', code: 'MEE' },
    { name: 'Department of Petroleum Engineering', code: 'PEE' },
    { name: 'Department of Production Engineering', code: 'PRE' },
    { name: 'Department of Structural Engineering', code: 'STE' },
    { name: 'Department of Surveying & Geoinformatics', code: 'SVG' },
  ],
  'Faculty of Life Sciences': [
    { name: 'Department of Animal and Environmental Biology', code: 'AEB' },
    { name: 'Department of Environmental Management and Toxicology', code: 'EMT' },
    { name: 'Department of Microbiology', code: 'MCB' },
    { name: 'Department of Optometry', code: 'OPT' },
    { name: 'Department of Plant Biology and Biotechnology', code: 'PBB' },
    { name: 'Department of Science Laboratory Technology', code: 'SLT' },
  ],
};

/**
 * The department SmartAlert is deployed for in this phase. Registration is
 * open to any department in the map, but seed data and testing target this one.
 */
export const LAUNCH_DEPARTMENT = 'Department of Computer Science';

/**
 * A single flat department row, the shape the cache and the admin panel hold.
 *
 * `id` is the Mongo `_id` string once a row has been loaded from the
 * collection. Before the first DB load it falls back to the code, so a client
 * that reads the pre-seed cache still gets a stable key per department.
 */
export interface DepartmentRow {
  id: string;
  name: string;
  code: string;
  faculty: string;
}

/**
 * Flattens the seed faculty map into cache rows, using the code as the id
 * fallback for the pre-DB-load state.
 */
const seedRows = (): DepartmentRow[] =>
  Object.entries(unibenFaculties).flatMap(([faculty, departments]) =>
    departments.map((department) => ({
      id: department.code,
      name: department.name,
      code: department.code,
      faculty,
    }))
  );

/**
 * Module-level source of truth for the synchronous read functions. Seeded from
 * the hard-coded map so reads work before any DB load, then replaced wholesale
 * by `setDepartmentCache` once the collection has been read.
 */
let departmentCache: DepartmentRow[] = seedRows();

/**
 * Replace the in-memory cache. Called by `loadDepartmentsFromDb` and, in tests,
 * directly to prime the cache without a database.
 */
export const setDepartmentCache = (rows: DepartmentRow[]): void => {
  departmentCache = rows;
};

/**
 * Read the `Department` collection and refresh the cache from it. Call this
 * after any create/update/delete so the synchronous readers see the change.
 */
export const loadDepartmentsFromDb = async (): Promise<void> => {
  const docs = await Department.find().lean();
  setDepartmentCache(
    docs.map((doc) => ({
      id: String(doc._id),
      name: doc.name,
      code: doc.code,
      faculty: doc.faculty,
    }))
  );
};

/**
 * Idempotently upsert every entry of `unibenFaculties` into the collection,
 * then warm the cache from it. Safe to run on every startup: the upsert is
 * keyed on the unique `name`, so re-running it never creates duplicates and
 * simply reconciles code/faculty back to the seed values.
 */
export const seedDepartments = async (): Promise<void> => {
  const operations = Object.entries(unibenFaculties).flatMap(
    ([faculty, departments]) =>
      departments.map((department) => ({
        updateOne: {
          filter: { name: department.name },
          update: {
            $set: { code: department.code, faculty },
            $setOnInsert: { name: department.name },
          },
          upsert: true,
        },
      }))
  );

  if (operations.length > 0) {
    await Department.bulkWrite(operations);
  }

  await loadDepartmentsFromDb();
};

/**
 * Returns the raw faculty and department data for UI purposes, rebuilt from the
 * cache by grouping rows under their faculty.
 */
export const getFacultyDepartmentData = (): FacultyMap => {
  return departmentCache
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .reduce<FacultyMap>((map, row) => {
      (map[row.faculty] ??= []).push({ name: row.name, code: row.code });
      return map;
    }, {});
};

/**
 * Flat, alphabetically sorted list of every department name.
 */
export const getAllDepartments = (): string[] => {
  return departmentCache.map((row) => row.name).sort();
};

/**
 * Every department as a flat row, for the admin panel's Departments tab, sorted
 * by name. `id` is the Mongo `_id` string once the cache has been loaded from
 * the collection (see `DepartmentRow`).
 */
export const getDepartmentDirectory = (): DepartmentRow[] => {
  return departmentCache
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Faculty a department belongs to, or undefined if the name is unknown.
 */
export const getFacultyForDepartment = (
  department: string
): string | undefined => {
  return departmentCache.find((row) => row.name === department)?.faculty;
};

/**
 * Guard used by the registration and course-creation validators.
 */
export const isValidDepartment = (department: string): boolean => {
  return departmentCache.some((row) => row.name === department);
};

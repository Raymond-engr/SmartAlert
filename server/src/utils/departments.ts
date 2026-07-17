/**
 * Department Reference Data
 *
 * SmartAlert stores `department` as a plain string on the User and Course
 * documents (Chapter Three, Section 3.3.2) rather than as its own collection.
 * This module is the single source of truth for the department names that
 * string is allowed to hold, and it backs the Departments tab of the admin
 * panel.
 *
 * Launch scope is the Department of Computer Science, University of Benin.
 * The wider map is kept here so a second department can be switched on without
 * a schema change.
 */

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
 * Returns the raw faculty and department data for UI purposes.
 */
export const getFacultyDepartmentData = (): FacultyMap => {
  return unibenFaculties;
};

/**
 * Flat, alphabetically sorted list of every department name.
 */
export const getAllDepartments = (): string[] => {
  return Object.values(unibenFaculties)
    .flat()
    .map((department) => department.name)
    .sort();
};

/**
 * Every department as a flat row, for the admin panel's Departments tab.
 *
 * `id` is the code rather than a generated value: departments are reference
 * data with no collection of their own, so the code is the only stable key a
 * client can hold onto across requests.
 */
export const getDepartmentDirectory = (): Array<
  DepartmentRef & { id: string; faculty: string }
> => {
  return Object.entries(unibenFaculties)
    .flatMap(([faculty, departments]) =>
      departments.map((department) => ({
        id: department.code,
        name: department.name,
        code: department.code,
        faculty,
      }))
    )
    .sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Faculty a department belongs to, or undefined if the name is unknown.
 */
export const getFacultyForDepartment = (
  department: string
): string | undefined => {
  return Object.keys(unibenFaculties).find((faculty) =>
    unibenFaculties[faculty].some((entry) => entry.name === department)
  );
};

/**
 * Guard used by the registration and course-creation validators.
 */
export const isValidDepartment = (department: string): boolean => {
  return getAllDepartments().includes(department);
};

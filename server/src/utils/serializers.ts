import { Types } from 'mongoose';
import {
  SessionStatus,
  WEEK_DAYS,
  WeekDay,
  ITimetableSession,
} from '../Timetable/models/timetableSession.model';
import { ICourse } from '../Timetable/models/course.model';
import { INotification, NotificationType } from '../Notifications/models/notification.model';
import { IUser } from '../model/user.model';
import { getDepartmentDirectory } from './departments';

/**
 * API Serializers
 *
 * Mongoose documents are not the API's contract. Every response the client
 * reads is flattened here first: `_id` becomes `id`, a populated `course` ref
 * collapses into `courseCode`/`courseName`/`lecturer`, and a session's
 * time-derived status is resolved against the clock.
 *
 * Keeping this in one module means the shape the React pages consume is
 * defined in a single place rather than re-derived in each controller.
 */

/**
 * UNIBEN sits in WAT. The server may well run in UTC (or on a laptop in any
 * zone), so "is this class on now?" is answered against a fixed campus clock
 * rather than the host's local time.
 */
const CAMPUS_TIMEZONE = process.env.CAMPUS_TIMEZONE || 'Africa/Lagos';

interface CampusNow {
  day: string;
  /** 'HH:mm' on a 24-hour clock, directly comparable to a session's times. */
  time: string;
}

export const campusNow = (at: Date = new Date()): CampusNow => ({
  day: new Intl.DateTimeFormat('en-US', {
    timeZone: CAMPUS_TIMEZONE,
    weekday: 'long',
  }).format(at),
  time: new Intl.DateTimeFormat('en-GB', {
    timeZone: CAMPUS_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(at),
});

const dayIndex = (day: string): number => WEEK_DAYS.indexOf(day as WeekDay);

/**
 * Resolves the status the client should display for a session.
 *
 * `ongoing` and `completed` are never written to the database: a weekly
 * session becomes live and then finishes purely by the clock passing, and
 * persisting that would need a scheduler whose only job is to race the
 * timetable. They are derived on read instead.
 *
 * `cancelled` and `rescheduled` are the opposite: they are deliberate lecturer
 * actions, so they are stored and always win over whatever the clock says.
 */
export const effectiveStatus = (
  session: Pick<ITimetableSession, 'day' | 'startTime' | 'endTime' | 'status'>,
  at: Date = new Date()
): SessionStatus => {
  if (
    session.status === SessionStatus.CANCELLED ||
    session.status === SessionStatus.RESCHEDULED
  ) {
    return session.status;
  }

  const now = campusNow(at);
  const todayIndex = dayIndex(now.day);

  // Sunday is not a teaching day, so nothing has started yet: the whole of the
  // coming week reads as scheduled.
  if (todayIndex === -1) return SessionStatus.SCHEDULED;

  const sessionIndex = dayIndex(session.day);
  if (sessionIndex < todayIndex) return SessionStatus.COMPLETED;
  if (sessionIndex > todayIndex) return SessionStatus.SCHEDULED;

  // Today. Zero-padded 'HH:mm' compares correctly as a string.
  if (now.time < session.startTime) return SessionStatus.SCHEDULED;
  if (now.time < session.endTime) return SessionStatus.ONGOING;
  return SessionStatus.COMPLETED;
};

export interface SerializedSession {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  day: string;
  startTime: string;
  endTime: string;
  venue: string;
  status: SessionStatus;
  lecturer?: string;
  canAct: boolean;
}

interface SessionViewer {
  _id: Types.ObjectId | string;
  role: string;
}

/**
 * @param session  A session with `course` populated, and `course.lecturer`
 *                 populated in turn.
 * @param viewer   The logged-in user, used to decide `canAct`.
 */
export const toSession = (
  session: any,
  viewer?: SessionViewer,
  at: Date = new Date()
): SerializedSession => {
  const course = (session.course ?? {}) as any;
  const lecturer = course.lecturer as any;
  const status = effectiveStatus(session, at);

  // Only the lecturer who teaches the course may cancel or reschedule it, and
  // only while there is still something to act on. This mirrors the ownership
  // check in the session controller so the UI cannot offer a button the API
  // would reject.
  const lecturerId = lecturer?._id ?? lecturer;
  const isOwner =
    viewer?.role === 'lecturer' &&
    lecturerId != null &&
    String(lecturerId) === String(viewer._id);

  const canAct =
    isOwner &&
    status !== SessionStatus.CANCELLED &&
    status !== SessionStatus.COMPLETED;

  return {
    id: String(session._id),
    courseId: String(course._id ?? course),
    courseCode: course.code ?? '',
    courseName: course.name ?? '',
    day: session.day,
    startTime: session.startTime,
    endTime: session.endTime,
    venue: session.venue,
    status,
    lecturer: lecturer?.name,
    canAct,
  };
};

/**
 * Timetable order: Monday first, then by start time.
 *
 * This cannot be done in the Mongo sort, because `day` is stored as its name
 * and would come back alphabetically (Friday, Monday, Saturday...). Ordering
 * is applied here, after the day has been mapped back to its index.
 */
export const byWeekOrder = (
  a: Pick<SerializedSession, 'day' | 'startTime'>,
  b: Pick<SerializedSession, 'day' | 'startTime'>
): number =>
  dayIndex(a.day) - dayIndex(b.day) || a.startTime.localeCompare(b.startTime);

export const toSessions = (
  sessions: any[],
  viewer?: SessionViewer,
  at: Date = new Date()
): SerializedSession[] =>
  sessions.map((s) => toSession(s, viewer, at)).sort(byWeekOrder);

export interface SerializedAlert {
  id: string;
  courseCode: string;
  courseName: string;
  status: SessionStatus;
  message: string;
  createdAt: string;
  unread: boolean;
}

/**
 * A notification's `type` is the two events that raise an alert; the client
 * colours it with the same status vocabulary it uses for a session, so the
 * two map onto each other here.
 */
const alertStatus = (type: NotificationType): SessionStatus =>
  type === NotificationType.CANCELLED
    ? SessionStatus.CANCELLED
    : SessionStatus.RESCHEDULED;

/**
 * `createdAt` goes out as a raw ISO string rather than a formatted time
 * because the dashboard renders it as '12:35' while the alerts screen renders
 * the same field as 'Today · 12:35'. Formatting is the client's business.
 *
 * @param viewerId  Omit for a non-recipient (a lecturer reading a course's
 *                  history), and every alert serializes as read.
 */
export const toAlert = (
  notification: any,
  viewerId?: Types.ObjectId | string
): SerializedAlert => {
  const course = (notification.course ?? {}) as any;

  const unread = viewerId
    ? !(notification.readBy ?? []).some(
        (id: Types.ObjectId) => String(id) === String(viewerId)
      )
    : false;

  return {
    id: String(notification._id),
    courseCode: course.code ?? '',
    courseName: course.name ?? '',
    status: alertStatus(notification.type),
    message: notification.message,
    createdAt: new Date(notification.createdAt).toISOString(),
    unread,
  };
};

export const toAlerts = (
  notifications: any[],
  viewerId?: Types.ObjectId | string
): SerializedAlert[] => notifications.map((n) => toAlert(n, viewerId));

export interface SerializedCourse {
  id: string;
  code: string;
  title: string;
  lecturer: string;
  department: string;
  units: number;
  enrolled: boolean;
}

/**
 * @param enrolledIds  The calling student's enrolled course ids, so the
 *                     enrolment screen can render each row's button without a
 *                     second request per course.
 */
export const toCourse = (
  course: any,
  enrolledIds?: Set<string>
): SerializedCourse => {
  const lecturer = course.lecturer as any;

  return {
    id: String(course._id),
    code: course.code,
    title: course.name,
    lecturer: lecturer?.name ?? '',
    department: course.department,
    units: course.units,
    enrolled: enrolledIds ? enrolledIds.has(String(course._id)) : false,
  };
};

export const toCourses = (
  courses: any[],
  enrolledIds?: Set<string>
): SerializedCourse[] => courses.map((c) => toCourse(c, enrolledIds));

export interface SerializedUser {
  id: string;
  name: string;
  firstName: string;
  initials: string;
  email: string;
  role: string;
  department: string;
  /** The department's short code (CSC), for UI too narrow for the full name. */
  departmentCode: string;
  matricNumber?: string;
  isActive: boolean;
}

/**
 * A department is persisted by its full name, but the sidebar and the profile
 * card have room for a code. Falls back to the stored name so a department
 * that predates the reference list still renders something truthful.
 */
const departmentCodeFor = (department: string): string =>
  getDepartmentDirectory().find((entry) => entry.name === department)?.code ??
  department;

/**
 * `firstName` and `initials` are derived rather than stored: the sidebar and
 * the dashboard greeting need them on every render, and deriving them here
 * keeps that logic out of each page.
 */
export const toUser = (user: IUser | any): SerializedUser => {
  const parts = String(user.name ?? '').trim().split(/\s+/).filter(Boolean);

  const initials =
    parts.length === 0
      ? '?'
      : parts.length === 1
        ? parts[0].slice(0, 2).toUpperCase()
        : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();

  return {
    id: String(user._id),
    name: user.name,
    firstName: parts[0] ?? user.name,
    initials,
    email: user.email,
    role: user.role,
    department: user.department,
    departmentCode: departmentCodeFor(user.department),
    matricNumber: user.matricNumber,
    isActive: user.isActive,
  };
};

export const toUsers = (users: any[]): SerializedUser[] => users.map(toUser);

export type UserRole = "student" | "lecturer" | "admin";

export type SessionStatus = "scheduled" | "live" | "moved" | "cancelled" | "done";

export interface AppUser {
  id: string;
  name: string;
  firstName: string;
  email: string;
  role: UserRole;
  department: string;
  initials: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  lecturer: string;
  units: number;
  enrolled?: boolean;
}

export interface Session {
  id: string;
  courseCode: string;
  courseName: string;
  day: string;
  startTime: string;
  endTime: string;
  venue: string;
  status: SessionStatus;
  lecturer?: string;
  note?: string;
  canAct?: boolean;
}

export interface Alert {
  id: string;
  courseCode: string;
  courseName: string;
  status: SessionStatus;
  message: string;
  timestamp: string;
  unread: boolean;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  courses: number;
  students: number;
}

export interface AdminUser {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: UserRole;
  active: boolean;
}

export interface ScheduleEntry {
  id: string;
  courseCode: string;
  courseName: string;
  day: string;
  time: string;
  venue: string;
  status: SessionStatus;
}

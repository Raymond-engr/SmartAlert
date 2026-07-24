export type UserRole = "student" | "lecturer" | "admin";

export type SessionStatus =
  | "scheduled"
  | "ongoing"
  | "rescheduled"
  | "cancelled"
  | "completed";

export interface AppUser {
  id: string;
  name: string;
  firstName: string;
  initials: string;
  email: string;
  role: UserRole;
  department: string;
  departmentCode: string;
  matricNumber?: string;
  isActive: boolean;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  lecturer: string;
  department: string;
  units: number;
  enrolled: boolean;
}

export interface Session {
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

export interface Alert {
  id: string;
  courseCode: string;
  courseName: string;
  status: SessionStatus;
  message: string;
  createdAt: string;
  unread: boolean;
}

export interface Enrolment {
  id: string;
  course: Course;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  faculty: string;
  courses: number;
  students: number;
}

import { Types } from 'mongoose';
import {
  effectiveStatus,
  byWeekOrder,
  toSession,
  toAlert,
  toUser,
} from '../src/utils/serializers';
import { SessionStatus } from '../src/Timetable/models/timetableSession.model';
import { NotificationType } from '../src/Notifications/models/notification.model';

/**
 * Campus time is Africa/Lagos (UTC+1, no DST), so a UTC instant maps to a
 * campus wall clock one hour later. 2026-07-13 is a Monday.
 */
const mondayAt = (utcTime: string) => new Date(`2026-07-13T${utcTime}Z`);

const scheduledMonday = {
  day: 'Monday' as const,
  startTime: '10:00',
  endTime: '12:00',
  status: SessionStatus.SCHEDULED,
};

describe('effectiveStatus', () => {
  it('reads as scheduled before the class starts', () => {
    // 09:00 Lagos
    expect(effectiveStatus(scheduledMonday, mondayAt('08:00:00'))).toBe(
      SessionStatus.SCHEDULED
    );
  });

  it('reads as ongoing while the class is running', () => {
    // 10:30 Lagos
    expect(effectiveStatus(scheduledMonday, mondayAt('09:30:00'))).toBe(
      SessionStatus.ONGOING
    );
  });

  it('reads as completed once the class has finished', () => {
    // 13:00 Lagos
    expect(effectiveStatus(scheduledMonday, mondayAt('12:00:00'))).toBe(
      SessionStatus.COMPLETED
    );
  });

  it('turns ongoing exactly on the start time', () => {
    // 10:00 Lagos
    expect(effectiveStatus(scheduledMonday, mondayAt('09:00:00'))).toBe(
      SessionStatus.ONGOING
    );
  });

  it('is no longer ongoing exactly on the end time', () => {
    // 12:00 Lagos
    expect(effectiveStatus(scheduledMonday, mondayAt('11:00:00'))).toBe(
      SessionStatus.COMPLETED
    );
  });

  it('resolves against campus time, not the host clock', () => {
    // 23:30 UTC on Sunday is already 00:30 Monday in Lagos, so a Monday
    // session is scheduled rather than belonging to a day that has not come.
    const sundayNight = new Date('2026-07-12T23:30:00Z');
    expect(effectiveStatus(scheduledMonday, sundayNight)).toBe(
      SessionStatus.SCHEDULED
    );
  });

  it('leaves a later day in the week as scheduled', () => {
    const wednesday = { ...scheduledMonday, day: 'Wednesday' as const };
    expect(effectiveStatus(wednesday, mondayAt('09:30:00'))).toBe(
      SessionStatus.SCHEDULED
    );
  });

  it('treats an earlier day in the week as completed', () => {
    // Wednesday 10:30 Lagos, looking at Monday's session.
    const onWednesday = new Date('2026-07-15T09:30:00Z');
    expect(effectiveStatus(scheduledMonday, onWednesday)).toBe(
      SessionStatus.COMPLETED
    );
  });

  it('reads the whole coming week as scheduled on a Sunday', () => {
    // Sunday 12:00 Lagos: no teaching day has started yet.
    const sunday = new Date('2026-07-19T11:00:00Z');
    expect(effectiveStatus(scheduledMonday, sunday)).toBe(
      SessionStatus.SCHEDULED
    );
  });

  it('keeps a cancellation regardless of the clock', () => {
    const cancelled = { ...scheduledMonday, status: SessionStatus.CANCELLED };
    // Mid-slot, when the clock alone would say ongoing.
    expect(effectiveStatus(cancelled, mondayAt('09:30:00'))).toBe(
      SessionStatus.CANCELLED
    );
  });

  it('keeps a reschedule regardless of the clock', () => {
    const moved = { ...scheduledMonday, status: SessionStatus.RESCHEDULED };
    expect(effectiveStatus(moved, mondayAt('09:30:00'))).toBe(
      SessionStatus.RESCHEDULED
    );
  });
});

describe('byWeekOrder', () => {
  it('orders by teaching day and then by start time', () => {
    const rows = [
      { day: 'Wednesday', startTime: '14:00' },
      { day: 'Monday', startTime: '14:00' },
      { day: 'Monday', startTime: '08:00' },
      { day: 'Friday', startTime: '10:00' },
    ];

    expect([...rows].sort(byWeekOrder)).toEqual([
      { day: 'Monday', startTime: '08:00' },
      { day: 'Monday', startTime: '14:00' },
      { day: 'Wednesday', startTime: '14:00' },
      { day: 'Friday', startTime: '10:00' },
    ]);
  });
});

describe('toSession', () => {
  const lecturerId = new Types.ObjectId();

  const build = () => ({
    _id: new Types.ObjectId(),
    day: 'Monday',
    startTime: '10:00',
    endTime: '12:00',
    venue: 'LT1',
    status: SessionStatus.SCHEDULED,
    course: {
      _id: new Types.ObjectId(),
      code: 'CSC 401',
      name: 'Software Engineering',
      lecturer: { _id: lecturerId, name: 'Dr. Emmanuel Okoro' },
    },
  });

  it('flattens the populated course onto the session', () => {
    const result = toSession(build(), undefined, mondayAt('08:00:00'));

    expect(result.courseCode).toBe('CSC 401');
    expect(result.courseName).toBe('Software Engineering');
    expect(result.lecturer).toBe('Dr. Emmanuel Okoro');
    expect(typeof result.id).toBe('string');
  });

  it('lets the lecturer who teaches the course act on it', () => {
    const viewer = { _id: lecturerId, role: 'lecturer' };
    expect(toSession(build(), viewer, mondayAt('08:00:00')).canAct).toBe(true);
  });

  it('does not let a different lecturer act on it', () => {
    const viewer = { _id: new Types.ObjectId(), role: 'lecturer' };
    expect(toSession(build(), viewer, mondayAt('08:00:00')).canAct).toBe(false);
  });

  it('does not let a student act on it', () => {
    const viewer = { _id: new Types.ObjectId(), role: 'student' };
    expect(toSession(build(), viewer, mondayAt('08:00:00')).canAct).toBe(false);
  });

  it('closes off acting once the class is over', () => {
    const viewer = { _id: lecturerId, role: 'lecturer' };
    // 13:00 Lagos, after the 12:00 end.
    expect(toSession(build(), viewer, mondayAt('12:00:00')).canAct).toBe(false);
  });

  it('closes off acting on an already cancelled session', () => {
    const viewer = { _id: lecturerId, role: 'lecturer' };
    const session = { ...build(), status: SessionStatus.CANCELLED };
    expect(toSession(session, viewer, mondayAt('08:00:00')).canAct).toBe(false);
  });
});

describe('toAlert', () => {
  const studentId = new Types.ObjectId();

  const build = (readBy: Types.ObjectId[] = []) => ({
    _id: new Types.ObjectId(),
    type: NotificationType.CANCELLED,
    message: 'Your CSC 401 class on Monday, 10:00 has been cancelled.',
    createdAt: new Date('2026-07-13T11:35:00Z'),
    readBy,
    course: { _id: new Types.ObjectId(), code: 'CSC 401', name: 'Software Engineering' },
  });

  it('is unread for a student who has not read it', () => {
    expect(toAlert(build(), studentId).unread).toBe(true);
  });

  it('is read once the student id is in readBy', () => {
    expect(toAlert(build([studentId]), studentId).unread).toBe(false);
  });

  it('is unread when another student has read it but this one has not', () => {
    expect(toAlert(build([new Types.ObjectId()]), studentId).unread).toBe(true);
  });

  it('is never unread without a viewer', () => {
    expect(toAlert(build()).unread).toBe(false);
  });

  it('maps the notification type onto the session status vocabulary', () => {
    expect(toAlert(build()).status).toBe(SessionStatus.CANCELLED);
    const moved = { ...build(), type: NotificationType.RESCHEDULED };
    expect(toAlert(moved).status).toBe(SessionStatus.RESCHEDULED);
  });

  it('emits createdAt as an ISO string for the client to format', () => {
    expect(toAlert(build()).createdAt).toBe('2026-07-13T11:35:00.000Z');
  });
});

describe('toUser', () => {
  const build = (name: string) => ({
    _id: new Types.ObjectId(),
    name,
    email: 'harriet@student.uniben.edu.ng',
    role: 'student',
    department: 'Department of Computer Science',
    isActive: true,
  });

  it('derives first name and initials from a full name', () => {
    const result = toUser(build('Harriet Samuel'));
    expect(result.firstName).toBe('Harriet');
    expect(result.initials).toBe('HS');
  });

  it('takes the first and last initial when there is a middle name', () => {
    expect(toUser(build('Harriet Ada Samuel')).initials).toBe('HS');
  });

  it('falls back to two letters for a single name', () => {
    const result = toUser(build('Harriet'));
    expect(result.firstName).toBe('Harriet');
    expect(result.initials).toBe('HA');
  });

  it('tolerates a name with extra whitespace', () => {
    expect(toUser(build('  Harriet   Samuel  ')).initials).toBe('HS');
  });

  it('never leaks the password field', () => {
    const withPassword = { ...build('Harriet Samuel'), password: 'hashed' };
    expect(toUser(withPassword)).not.toHaveProperty('password');
  });
});

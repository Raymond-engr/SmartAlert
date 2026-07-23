import { commonStyles, commonFooter } from './styles';

export interface SessionSlot {
  day: string;
  startTime: string;
  endTime: string;
  venue: string;
}

export const sessionRescheduledTemplate = (
  name: string,
  courseCode: string,
  courseName: string,
  previous: SessionSlot,
  updated: SessionSlot
): string => {
  const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;

  return `
<html>
<head>
    <style type="text/css">
        ${commonStyles}
    </style>
</head>
<body>
    <div class="header">
        <h1>Class Rescheduled</h1>
    </div>

    <div class="content">
        <p>Hello ${name},</p>

        <p>Your lecturer has moved the class below to a new slot.</p>

        <div class="session-card rescheduled">
            <div class="course-code">${courseCode}</div>
            <div class="detail">${courseName}</div>
            <div class="detail">
                Was: <span class="struck">${previous.day}, ${previous.startTime} &ndash; ${previous.endTime} &middot; ${previous.venue}</span>
            </div>
            <div class="detail">
                Now: <span class="value">${updated.day}, ${updated.startTime} &ndash; ${updated.endTime} &middot; ${updated.venue}</span>
            </div>
            <span class="badge rescheduled">Rescheduled</span>
        </div>

        <p>Your timetable has already been updated with the new time.</p>

        <a href="${dashboardUrl}" class="button">Open my timetable</a>
    </div>

    ${commonFooter}
</body>
</html>
`;
};

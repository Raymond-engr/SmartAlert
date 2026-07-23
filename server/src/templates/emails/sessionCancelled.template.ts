import { commonStyles, commonFooter } from './styles';

export const sessionCancelledTemplate = (
  name: string,
  courseCode: string,
  courseName: string,
  day: string,
  startTime: string,
  endTime: string,
  venue: string
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
        <h1>Class Cancelled</h1>
    </div>

    <div class="content">
        <p>Hello ${name},</p>

        <p>Your lecturer has cancelled the class below. It will not hold this week.</p>

        <div class="session-card cancelled">
            <div class="course-code">${courseCode}</div>
            <div class="detail">${courseName}</div>
            <div class="detail struck">${day}, ${startTime} &ndash; ${endTime} &middot; ${venue}</div>
            <span class="badge cancelled">Cancelled</span>
        </div>

        <p>No action is needed from you. Your timetable has already been updated.</p>

        <a href="${dashboardUrl}" class="button">Open my timetable</a>
    </div>

    ${commonFooter}
</body>
</html>
`;
};

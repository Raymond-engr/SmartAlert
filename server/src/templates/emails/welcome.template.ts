import { commonStyles, commonFooter } from './styles';

export const welcomeTemplate = (
  name: string,
  role: string,
  department: string
): string => {
  const loginUrl = `${process.env.FRONTEND_URL}/login`;

  let nextStep =
    'Your assigned courses and their sessions are already on your dashboard, ready to cancel or reschedule in one click.';
  if (role === 'student') {
    nextStep =
      'Enrol in the courses you are taking this semester, and every cancellation or reschedule on those courses will reach you here and in the app.';
  }

  return `
<html>
<head>
    <style type="text/css">
        ${commonStyles}
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to SmartAlert</h1>
    </div>

    <div class="content">
        <p>Hello ${name},</p>

        <p>Your SmartAlert account for the ${department} has been created.</p>

        <p>${nextStep}</p>

        <a href="${loginUrl}" class="button">Log in to SmartAlert</a>
    </div>

    ${commonFooter}
</body>
</html>
`;
};

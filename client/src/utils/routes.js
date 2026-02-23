export function getHomeRoute(role) {
  if (role === 'reviewer') {
    return '/reviewer';
  }

  return '/applicant';
}

export const USER_ROLES = {
  APPLICANT: 'applicant',
  REVIEWER: 'reviewer',
};

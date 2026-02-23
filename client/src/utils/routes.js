export function getHomeRoute(role) {
  if (role === 'admin') {
    return '/admin';
  }

  if (role === 'reviewer') {
    return '/reviewer';
  }

  return '/applicant';
}

import { useEffect, useMemo, useState } from 'react';
import api from '../api/http';
import DashboardShell from '../components/layout/DashboardShell';
import LoadingState from '../components/common/LoadingState';
import StatusBadge from '../components/ui/StatusBadge';
import { formatDate } from '../utils/format';

function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [criteriaDrafts, setCriteriaDrafts] = useState({});

  const [criteriaForm, setCriteriaForm] = useState({
    type: 'MUST_HAVE',
    label: '',
    weight: '',
  });

  const [reviewerForm, setReviewerForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const groupedCriteria = useMemo(
    () => ({
      mustHave: criteria.filter((item) => item.type === 'MUST_HAVE'),
      niceToHave: criteria.filter((item) => item.type === 'NICE_TO_HAVE'),
    }),
    [criteria],
  );

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [statsResponse, criteriaResponse, usersResponse, logsResponse] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/criteria'),
        api.get('/admin/users'),
        api.get('/admin/audit-logs'),
      ]);

      setStats(statsResponse.data.stats);
      setCriteria(criteriaResponse.data.criteria || []);
      setUsers(usersResponse.data.users || []);
      setLogs(logsResponse.data.logs || []);

      const drafts = {};
      (criteriaResponse.data.criteria || []).forEach((item) => {
        drafts[item.id] = {
          type: item.type,
          label: item.label,
          weight: item.weight ?? '',
        };
      });
      setCriteriaDrafts(drafts);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createCriteria = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      await api.post('/admin/criteria', {
        type: criteriaForm.type,
        label: criteriaForm.label,
        weight:
          criteriaForm.type === 'NICE_TO_HAVE'
            ? Number(criteriaForm.weight)
            : null,
      });

      setCriteriaForm({ type: 'MUST_HAVE', label: '', weight: '' });
      setMessage('Criteria created');
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create criteria');
    }
  };

  const updateCriteria = async (criteriaId) => {
    const draft = criteriaDrafts[criteriaId];
    if (!draft) {
      return;
    }

    setMessage('');
    setError('');

    try {
      await api.put(`/admin/criteria/${criteriaId}`, {
        type: draft.type,
        label: draft.label,
        weight: draft.type === 'NICE_TO_HAVE' ? Number(draft.weight) : null,
      });
      setMessage('Criteria updated');
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update criteria');
    }
  };

  const deleteCriteria = async (criteriaId) => {
    setMessage('');
    setError('');

    try {
      await api.delete(`/admin/criteria/${criteriaId}`);
      setMessage('Criteria deleted');
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete criteria');
    }
  };

  const createReviewer = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      await api.post('/admin/users/reviewer', reviewerForm);
      setReviewerForm({ name: '', email: '', password: '' });
      setMessage('Reviewer account created');
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create reviewer');
    }
  };

  if (loading) {
    return (
      <DashboardShell title="Admin Console" subtitle="Manage criteria, reviewers, and audit visibility">
        <LoadingState message="Loading admin dashboard..." />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Admin Console" subtitle="Configure scoring and run recruiting operations">
      <div className="space-y-4">
        {message && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <article className="card-surface p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Applicants</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats?.totalApplicants || 0}</p>
          </article>
          <article className="card-surface p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Shortlisted</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats?.shortlisted || 0}</p>
          </article>
          <article className="card-surface p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Rejected</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats?.rejected || 0}</p>
          </article>
          <article className="card-surface p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Interviews Scheduled</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats?.interviewsScheduled || 0}</p>
          </article>
          <article className="card-surface p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Reviewers</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats?.reviewers || 0}</p>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="card-surface p-4">
            <h3 className="text-lg font-semibold text-slate-900">Criteria Configuration</h3>
            <form className="mt-3 grid gap-2 sm:grid-cols-4" onSubmit={createCriteria}>
              <select
                className="input"
                value={criteriaForm.type}
                onChange={(event) =>
                  setCriteriaForm((prev) => ({
                    ...prev,
                    type: event.target.value,
                  }))
                }
              >
                <option value="MUST_HAVE">Must Have</option>
                <option value="NICE_TO_HAVE">Nice to Have</option>
              </select>
              <input
                className="input sm:col-span-2"
                placeholder="Criteria label"
                value={criteriaForm.label}
                onChange={(event) =>
                  setCriteriaForm((prev) => ({
                    ...prev,
                    label: event.target.value,
                  }))
                }
                required
              />
              <input
                className="input"
                type="number"
                step="0.1"
                min={0}
                placeholder="Weight"
                value={criteriaForm.weight}
                disabled={criteriaForm.type !== 'NICE_TO_HAVE'}
                onChange={(event) =>
                  setCriteriaForm((prev) => ({
                    ...prev,
                    weight: event.target.value,
                  }))
                }
              />
              <button type="submit" className="btn-primary sm:col-span-4">
                Add Criteria
              </button>
            </form>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <h4 className="text-sm font-semibold text-slate-600">Must-Have Criteria</h4>
                <div className="mt-2 space-y-2">
                  {groupedCriteria.mustHave.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                      <input
                        className="input"
                        value={criteriaDrafts[item.id]?.label || ''}
                        onChange={(event) =>
                          setCriteriaDrafts((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...prev[item.id],
                              label: event.target.value,
                            },
                          }))
                        }
                      />
                      <div className="mt-2 flex gap-2">
                        <button type="button" className="btn-secondary" onClick={() => updateCriteria(item.id)}>
                          Save
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => deleteCriteria(item.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-600">Nice-to-Have Criteria + Weight</h4>
                <div className="mt-2 space-y-2">
                  {groupedCriteria.niceToHave.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                      <input
                        className="input"
                        value={criteriaDrafts[item.id]?.label || ''}
                        onChange={(event) =>
                          setCriteriaDrafts((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...prev[item.id],
                              label: event.target.value,
                            },
                          }))
                        }
                      />
                      <input
                        className="input mt-2"
                        type="number"
                        min={0}
                        step="0.1"
                        value={criteriaDrafts[item.id]?.weight ?? ''}
                        onChange={(event) =>
                          setCriteriaDrafts((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...prev[item.id],
                              weight: event.target.value,
                            },
                          }))
                        }
                      />
                      <div className="mt-2 flex gap-2">
                        <button type="button" className="btn-secondary" onClick={() => updateCriteria(item.id)}>
                          Save
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => deleteCriteria(item.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <section className="card-surface p-4">
              <h3 className="text-lg font-semibold text-slate-900">User Management</h3>
              <form className="mt-3 space-y-2" onSubmit={createReviewer}>
                <input
                  className="input"
                  placeholder="Reviewer name"
                  value={reviewerForm.name}
                  onChange={(event) =>
                    setReviewerForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  required
                />
                <input
                  className="input"
                  type="email"
                  placeholder="Reviewer email"
                  value={reviewerForm.email}
                  onChange={(event) =>
                    setReviewerForm((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  required
                />
                <input
                  className="input"
                  type="password"
                  minLength={4}
                  placeholder="Temporary password"
                  value={reviewerForm.password}
                  onChange={(event) =>
                    setReviewerForm((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  required
                />
                <button type="submit" className="btn-primary w-full">
                  Create Reviewer
                </button>
              </form>

              <div className="mt-4 space-y-2">
                {users.map((account) => (
                  <div key={account.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-800">{account.name}</p>
                      {account.role === 'applicant' ? null : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                          {account.role}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{account.email}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>

        <section className="card-surface p-4">
          <h3 className="text-lg font-semibold text-slate-900">Audit Log</h3>
          <div className="mt-3 space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800">{log.action}</p>
                  {log.application?.status && <StatusBadge status={log.application.status} />}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  App #{log.application?.id} {log.application?.fullName ? `(${log.application.fullName})` : ''}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Actor: {log.actor?.name || 'System'} • {formatDate(log.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

export default AdminPage;

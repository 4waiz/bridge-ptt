import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/http';
import DashboardShell from '../components/layout/DashboardShell';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import { formatDate } from '../utils/format';
import useAuth from '../context/useAuth';

function buildInitialPreferred(criteria, existingSelections = []) {
  const map = {};

  criteria.forEach((item) => {
    map[item.id] = {
      selected: false,
      yearsExperience: 0,
    };
  });

  existingSelections.forEach((item) => {
    if (map[item.criteriaId]) {
      map[item.criteriaId] = {
        selected: true,
        yearsExperience: Number(item.yearsExperience) || 0,
      };
    }
  });

  return map;
}

function ApplicantPage() {
  const { user } = useAuth();

  const [criteria, setCriteria] = useState({ mustHave: [], niceToHave: [] });
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    location: '',
    experienceText: '',
  });
  const [mandatorySelections, setMandatorySelections] = useState([]);
  const [preferredMap, setPreferredMap] = useState({});
  const [cvFile, setCvFile] = useState(null);

  const selectedPreferred = useMemo(
    () =>
      Object.entries(preferredMap)
        .filter(([, value]) => value.selected)
        .map(([criteriaId, value]) => ({
          criteriaId: Number(criteriaId),
          yearsExperience: Number(value.yearsExperience) || 0,
        })),
    [preferredMap],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [criteriaResponse, applicationResponse] = await Promise.all([
        api.get('/applicant/criteria'),
        api
          .get('/applicant/application')
          .then((res) => res)
          .catch((requestError) => {
            if (requestError.response?.status === 404) {
              return { data: { application: null } };
            }
            throw requestError;
          }),
      ]);

      const nextCriteria = criteriaResponse.data.criteria;
      const nextApplication = applicationResponse.data.application;

      setCriteria(nextCriteria);
      setApplication(nextApplication);

      if (nextApplication) {
        setForm({
          fullName: nextApplication.fullName,
          email: nextApplication.email,
          phone: nextApplication.phone,
          location: nextApplication.location,
          experienceText: nextApplication.experienceText,
        });
        setMandatorySelections(nextApplication.mandatorySelections || []);
        setPreferredMap(
          buildInitialPreferred(nextCriteria.niceToHave, nextApplication.preferredSelections || []),
        );
      } else {
        setForm((prev) => ({
          ...prev,
          fullName: user?.name || prev.fullName,
          email: user?.email || prev.email,
        }));
        setMandatorySelections([]);
        setPreferredMap(buildInitialPreferred(nextCriteria.niceToHave));
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load applicant workspace');
    } finally {
      setLoading(false);
    }
  }, [user?.name, user?.email]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onMandatoryToggle = (criteriaId) => {
    setMandatorySelections((prev) =>
      prev.includes(criteriaId) ? prev.filter((id) => id !== criteriaId) : [...prev, criteriaId],
    );
  };

  const onPreferredToggle = (criteriaId) => {
    setPreferredMap((prev) => ({
      ...prev,
      [criteriaId]: {
        ...prev[criteriaId],
        selected: !prev[criteriaId]?.selected,
      },
    }));
  };

  const onPreferredYearsChange = (criteriaId, value) => {
    setPreferredMap((prev) => ({
      ...prev,
      [criteriaId]: {
        ...prev[criteriaId],
        yearsExperience: value,
      },
    }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      const body = new FormData();
      body.append('fullName', form.fullName);
      body.append('email', form.email);
      body.append('phone', form.phone);
      body.append('location', form.location);
      body.append('experienceText', form.experienceText);
      body.append('mandatoryCriteria', JSON.stringify(mandatorySelections));
      body.append('preferredCriteria', JSON.stringify(selectedPreferred));

      if (cvFile) {
        body.append('cv', cvFile);
      }

      const response = await api.post('/applicant/application', body, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage(response.data.message || 'Application saved');
      setCvFile(null);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const openCv = async () => {
    if (!application) {
      return;
    }

    try {
      const response = await api.get(`/applications/${application.id}/cv`, {
        responseType: 'blob',
      });

      const url = URL.createObjectURL(response.data);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load CV file');
    }
  };

  if (loading) {
    return (
      <DashboardShell title="Applicant Workspace" subtitle="Submit and track your application">
        <LoadingState message="Loading your application..." />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Applicant Workspace" subtitle="Submit and track your recruiting application">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="card-surface p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900">Application Form</h3>
          <p className="mt-1 text-sm text-slate-500">
            Mandatory criteria control eligibility. Preferred criteria contribute weighted score.
          </p>

          <form className="mt-5 space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="fullName">
                  Full Name
                </label>
                <input
                  id="fullName"
                  className="input"
                  value={form.fullName}
                  onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  className="input"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="location">
                  Location
                </label>
                <input
                  id="location"
                  className="input"
                  value={form.location}
                  onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <p className="label">Mandatory Criteria</p>
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                {criteria.mustHave.map((item) => (
                  <label key={item.id} className="flex items-start gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={mandatorySelections.includes(item.id)}
                      onChange={() => onMandatoryToggle(item.id)}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="label">Preferred Criteria</p>
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                {criteria.niceToHave.map((item) => {
                  const value = preferredMap[item.id] || { selected: false, yearsExperience: 0 };
                  return (
                    <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={value.selected}
                          onChange={() => onPreferredToggle(item.id)}
                        />
                        <span>{item.label}</span>
                        <span className="ml-auto text-xs text-slate-400">Weight: {item.weight}</span>
                      </label>

                      <div className="mt-2">
                        <label className="label mb-1">Years Experience</label>
                        <input
                          type="number"
                          min={0}
                          step="0.5"
                          className="input"
                          value={value.yearsExperience}
                          onChange={(event) => onPreferredYearsChange(item.id, event.target.value)}
                          disabled={!value.selected}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="experienceText">
                Experience Description
              </label>
              <textarea
                id="experienceText"
                rows={5}
                className="input"
                value={form.experienceText}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    experienceText: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="cv">
                CV Upload (PDF/DOC/DOCX)
              </label>
              <input
                id="cv"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(event) => setCvFile(event.target.files?.[0] || null)}
                className="input"
              />
              <p className="mt-1 text-xs text-slate-500">
                {application ? 'Leave empty to keep your current CV.' : 'CV is required for first submission.'}
              </p>
            </div>

            {message && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
            {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : application ? 'Update Application' : 'Submit Application'}
            </button>
          </form>
        </section>

        <aside className="space-y-4">
          <section className="card-surface p-4">
            <h3 className="text-base font-semibold text-slate-900">Application Status</h3>
            {!application && <p className="mt-2 text-sm text-slate-500">No application submitted yet.</p>}
            {application && (
              <div className="mt-3 space-y-3 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <StatusBadge status={application.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Computed Score</span>
                  <strong>{application.score}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mandatory Match</span>
                  <strong>{application.mandatoryMet ? 'Yes' : 'No'}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Submitted</span>
                  <strong>{formatDate(application.createdAt)}</strong>
                </div>
                <button type="button" className="btn-secondary w-full" onClick={openCv}>
                  View CV
                </button>
              </div>
            )}
          </section>

          <section className="card-surface p-4">
            <h3 className="text-base font-semibold text-slate-900">Timeline</h3>
            <div className="mt-3 space-y-3">
              {application?.events?.length ? (
                application.events.map((event) => (
                  <div key={event.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-sm font-medium text-slate-800">{event.action}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(event.createdAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No timeline events yet.</p>
              )}
            </div>
          </section>

          <section className="card-surface p-4">
            <h3 className="text-base font-semibold text-slate-900">Reviewer Notes</h3>
            <div className="mt-3 space-y-3">
              {application?.notes?.length ? (
                application.notes.map((note) => (
                  <div key={note.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-sm text-slate-700">{note.content}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {note.reviewer?.name || 'Reviewer'} • {formatDate(note.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No reviewer notes yet.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </DashboardShell>
  );
}

export default ApplicantPage;



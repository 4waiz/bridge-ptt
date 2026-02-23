import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/http';
import DashboardShell from '../components/layout/DashboardShell';
import StatusBadge from '../components/ui/StatusBadge';
import Tabs from '../components/ui/Tabs';
import LoadingState from '../components/common/LoadingState';
import { STATUS_LABELS, STATUS_OPTIONS } from '../utils/status';
import { formatDate } from '../utils/format';
import useAuth from '../context/useAuth';

const REVIEWER_TABS = [
  { value: 'profile', label: 'Profile' },
  { value: 'interviews', label: 'Interviews' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'analytics', label: 'Analytics' },
];

const SCORE_CATEGORIES = ['technical', 'communication', 'culture_fit'];

function ReviewerPage() {
  const { user } = useAuth();

  const [applications, setApplications] = useState([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [activeTab, setActiveTab] = useState('profile');
  const [noteText, setNoteText] = useState('');
  const [scoreForm, setScoreForm] = useState({
    technical: 3,
    communication: 3,
    culture_fit: 3,
  });

  const [filters, setFilters] = useState({
    status: '',
    minScore: '',
    mustHaveMatch: '',
    sort: 'score_desc',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeError, setResumeError] = useState('');
  const [loadingResume, setLoadingResume] = useState(false);

  const selectedReviewerScores = useMemo(() => {
    if (!selectedApplication?.scores?.length) {
      return [];
    }

    return selectedApplication.scores.filter((score) => score.reviewerId === user.id);
  }, [selectedApplication, user?.id]);

  const loadApplications = useCallback(async () => {
    setLoadingList(true);
    setError('');

    try {
      const params = {};
      if (filters.status) {
        params.status = filters.status;
      }
      if (filters.minScore) {
        params.minScore = filters.minScore;
      }
      if (filters.mustHaveMatch) {
        params.mustHaveMatch = filters.mustHaveMatch;
      }
      if (filters.sort) {
        params.sort = filters.sort;
      }

      const { data } = await api.get('/reviewer/applications', { params });
      setApplications(data.applications || []);

      if (!data.applications?.length) {
        setSelectedApplicationId(null);
        setSelectedApplication(null);
        return;
      }

      const selectedStillExists = data.applications.some(
        (application) => application.id === selectedApplicationId,
      );

      if (!selectedApplicationId || !selectedStillExists) {
        setSelectedApplicationId(data.applications[0].id);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load applicants');
    } finally {
      setLoadingList(false);
    }
  }, [filters, selectedApplicationId]);

  const loadApplicationDetail = useCallback(async (applicationId) => {
    if (!applicationId) {
      return;
    }

    setLoadingDetail(true);
    setError('');

    try {
      const { data } = await api.get(`/reviewer/applications/${applicationId}`);
      setSelectedApplication(data.application);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load applicant profile');
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const loadResume = useCallback(async (applicationId) => {
    if (!applicationId) {
      return;
    }

    setLoadingResume(true);
    setResumeError('');

    try {
      const response = await api.get(`/applications/${applicationId}/cv`, {
        responseType: 'blob',
      });

      const url = URL.createObjectURL(response.data);
      setResumeUrl((previous) => {
        if (previous) {
          URL.revokeObjectURL(previous);
        }
        return url;
      });
    } catch (requestError) {
      setResumeError(requestError.response?.data?.message || 'Unable to load CV preview');
      setResumeUrl((previous) => {
        if (previous) {
          URL.revokeObjectURL(previous);
        }
        return '';
      });
    } finally {
      setLoadingResume(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    loadApplicationDetail(selectedApplicationId);
    loadResume(selectedApplicationId);
  }, [selectedApplicationId, loadApplicationDetail, loadResume]);

  useEffect(() => {
    if (!selectedApplication) {
      return;
    }

    const reviewerScoreMap = Object.fromEntries(
      SCORE_CATEGORIES.map((category) => {
        const match = selectedReviewerScores.find((score) => score.category === category);
        return [category, match?.value || 3];
      }),
    );

    setScoreForm(reviewerScoreMap);
  }, [selectedApplication, selectedReviewerScores]);

  useEffect(
    () => () => {
      if (resumeUrl) {
        URL.revokeObjectURL(resumeUrl);
      }
    },
    [resumeUrl],
  );

  const refreshSelected = useCallback(async () => {
    await loadApplications();
    if (selectedApplicationId) {
      await loadApplicationDetail(selectedApplicationId);
      await loadResume(selectedApplicationId);
    }
  }, [loadApplications, selectedApplicationId, loadApplicationDetail, loadResume]);

  const saveScores = async () => {
    if (!selectedApplicationId) {
      return;
    }

    setMessage('');
    setError('');

    try {
      await api.post(`/reviewer/applications/${selectedApplicationId}/scores`, {
        scores: SCORE_CATEGORIES.map((category) => ({
          category,
          value: Number(scoreForm[category]),
        })),
      });
      setMessage('Scores saved');
      await refreshSelected();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save scores');
    }
  };

  const addNote = async () => {
    if (!selectedApplicationId || !noteText.trim()) {
      return;
    }

    setMessage('');
    setError('');

    try {
      await api.post(`/reviewer/applications/${selectedApplicationId}/notes`, {
        content: noteText,
      });
      setNoteText('');
      setMessage('Note added');
      await refreshSelected();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to add note');
    }
  };

  const updateStatus = async (status) => {
    if (!selectedApplicationId) {
      return;
    }

    setMessage('');
    setError('');

    try {
      await api.patch(`/reviewer/applications/${selectedApplicationId}/status`, { status });
      setMessage(`Status updated to ${STATUS_LABELS[status]}`);
      await refreshSelected();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update status');
    }
  };

  const statusButtons = ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'HIRED', 'REJECTED'];

  return (
    <DashboardShell
      title="Reviewer Board"
      subtitle="Evaluate applicants, apply ATS filters, score profiles, and move stages"
    >
      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <aside className="card-surface flex min-h-[560px] flex-col p-4">
          <h3 className="text-lg font-semibold text-slate-900">Applicants</h3>

          <div className="mt-3 grid gap-2">
            <select
              className="input"
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>

            <input
              className="input"
              placeholder="Minimum score"
              type="number"
              min={0}
              step="0.1"
              value={filters.minScore}
              onChange={(event) => setFilters((prev) => ({ ...prev, minScore: event.target.value }))}
            />

            <select
              className="input"
              value={filters.mustHaveMatch}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  mustHaveMatch: event.target.value,
                }))
              }
            >
              <option value="">Mandatory match: Any</option>
              <option value="true">Mandatory match: Yes</option>
              <option value="false">Mandatory match: No</option>
            </select>

            <select
              className="input"
              value={filters.sort}
              onChange={(event) => setFilters((prev) => ({ ...prev, sort: event.target.value }))}
            >
              <option value="score_desc">Sort: Score High to Low</option>
              <option value="score_asc">Sort: Score Low to High</option>
              <option value="created_desc">Sort: Newest</option>
              <option value="created_asc">Sort: Oldest</option>
            </select>
          </div>

          <div className="mt-4 space-y-2 overflow-y-auto pr-1">
            {loadingList && <LoadingState message="Loading applicants..." />}
            {!loadingList && !applications.length && (
              <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                No applicants match current filters.
              </p>
            )}
            {!loadingList &&
              applications.map((application) => (
                <button
                  key={application.id}
                  type="button"
                  onClick={() => setSelectedApplicationId(application.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selectedApplicationId === application.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{application.fullName}</p>
                    <span className="text-xs">{application.score}</span>
                  </div>
                  <p className="mt-1 text-xs opacity-80">{application.location}</p>
                  <div className="mt-2">
                    <StatusBadge
                      status={application.status}
                      className={selectedApplicationId === application.id ? 'bg-white/20 text-white border-white/30' : ''}
                    />
                  </div>
                </button>
              ))}
          </div>
        </aside>

        <section className="card-surface min-h-[560px] p-4 sm:p-5">
          {loadingDetail && <LoadingState message="Loading applicant details..." />}
          {!loadingDetail && !selectedApplication && (
            <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              Select an applicant from the left panel.
            </p>
          )}

          {!loadingDetail && selectedApplication && (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedApplication.fullName}</h3>
                  <p className="text-sm text-slate-500">
                    {selectedApplication.email} • {selectedApplication.location}
                  </p>
                </div>
                <StatusBadge status={selectedApplication.status} className="ml-auto" />
              </div>

              {message && <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
              {error && <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

              <Tabs tabs={REVIEWER_TABS} activeTab={activeTab} onChange={setActiveTab} />

              <div className="mt-4">
                {activeTab === 'profile' && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-4">
                      <div className="rounded-xl border border-slate-200 p-4">
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Profile</h4>
                        <dl className="mt-3 space-y-2 text-sm text-slate-700">
                          <div className="flex justify-between gap-2">
                            <dt>Phone</dt>
                            <dd>{selectedApplication.phone}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt>Mandatory Match</dt>
                            <dd>{selectedApplication.mandatoryMet ? 'Yes' : 'No'}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt>Computed Score</dt>
                            <dd>{selectedApplication.score}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt>Submitted</dt>
                            <dd>{formatDate(selectedApplication.createdAt)}</dd>
                          </div>
                        </dl>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4">
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                          Experience Summary
                        </h4>
                        <p className="mt-3 text-sm text-slate-700">{selectedApplication.experienceText}</p>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4">
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Notes</h4>
                        <div className="mt-3 space-y-2">
                          {selectedApplication.notes.length ? (
                            selectedApplication.notes.map((note) => (
                              <div key={note.id} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                                <p>{note.content}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {note.reviewer?.name || 'Reviewer'} • {formatDate(note.createdAt)}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-slate-500">No notes yet.</p>
                          )}
                        </div>

                        <textarea
                          className="input mt-3"
                          rows={3}
                          value={noteText}
                          onChange={(event) => setNoteText(event.target.value)}
                          placeholder="Add internal note"
                        />
                        <button type="button" className="btn-secondary mt-2" onClick={addNote}>
                          Add Note
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-xl border border-slate-200 p-4">
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Resume Preview</h4>
                        {loadingResume && <p className="mt-2 text-sm text-slate-500">Loading resume...</p>}
                        {resumeError && <p className="mt-2 text-sm text-rose-600">{resumeError}</p>}
                        {!loadingResume && resumeUrl && (
                          <iframe
                            src={resumeUrl}
                            title="Resume Preview"
                            className="mt-3 h-80 w-full rounded-lg border border-slate-200"
                          />
                        )}
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4">
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Change Stage</h4>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {statusButtons.map((status) => (
                            <button
                              type="button"
                              key={status}
                              className="btn-secondary"
                              onClick={() => updateStatus(status)}
                            >
                              {STATUS_LABELS[status]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'interviews' && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Interview Stage</h4>
                      <p className="mt-2 text-sm text-slate-700">
                        Move applicants to interview workflow when shortlisted and evaluations are complete.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => updateStatus('INTERVIEW_SCHEDULED')}
                        >
                          Mark Interview Scheduled
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => updateStatus('SHORTLISTED')}>
                          Back to Shortlisted
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent Notes</h4>
                      <div className="mt-3 space-y-2">
                        {selectedApplication.notes.length ? (
                          selectedApplication.notes.slice(0, 5).map((note) => (
                            <div key={note.id} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                              <p>{note.content}</p>
                              <p className="mt-1 text-xs text-slate-500">{formatDate(note.createdAt)}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">No notes recorded yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <div className="space-y-3">
                    {selectedApplication.events.length ? (
                      selectedApplication.events.map((event) => (
                        <div key={event.id} className="rounded-xl border border-slate-200 p-3">
                          <p className="text-sm text-slate-800">{event.action}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {event.actor?.name || 'System'} • {formatDate(event.createdAt)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No timeline entries for this applicant yet.</p>
                    )}
                  </div>
                )}

                {activeTab === 'analytics' && (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-xl border border-slate-200 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Computed Score</p>
                        <p className="mt-2 text-xl font-bold text-slate-900">{selectedApplication.score}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Reviewer Average</p>
                        <p className="mt-2 text-xl font-bold text-slate-900">
                          {selectedApplication.reviewerAverage ?? '-'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Must-Have Match</p>
                        <p className="mt-2 text-xl font-bold text-slate-900">
                          {selectedApplication.mandatoryMet ? 'Yes' : 'No'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Current Status</p>
                        <p className="mt-2 text-xl font-bold text-slate-900">
                          {STATUS_LABELS[selectedApplication.status]}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                        Category Scoring (1-5)
                      </h4>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        {SCORE_CATEGORIES.map((category) => (
                          <div key={category}>
                            <label className="label">{category.replaceAll('_', ' ')}</label>
                            <input
                              className="input"
                              type="number"
                              min={1}
                              max={5}
                              value={scoreForm[category]}
                              onChange={(event) =>
                                setScoreForm((prev) => ({
                                  ...prev,
                                  [category]: event.target.value,
                                }))
                              }
                            />
                          </div>
                        ))}
                      </div>

                      <button type="button" className="btn-primary mt-3" onClick={saveScores}>
                        Save Scores
                      </button>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Submitted Scores</h4>
                      <div className="mt-3 space-y-2">
                        {selectedApplication.scores.length ? (
                          selectedApplication.scores.map((score) => (
                            <div key={score.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                              <div>
                                <p className="text-sm font-medium text-slate-800">{score.category}</p>
                                <p className="text-xs text-slate-500">{score.reviewer?.name || 'Reviewer'}</p>
                              </div>
                              <p className="text-lg font-bold text-slate-900">{score.value}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">No reviewer scores yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

export default ReviewerPage;



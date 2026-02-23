import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

const STATUS_OPTIONS = ['submitted', 'reviewing', 'shortlisted', 'rejected', 'hired'];

const STATUS_STYLE = {
  submitted: 'bg-sky-100 text-sky-700',
  reviewing: 'bg-amber-100 text-amber-700',
  shortlisted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  hired: 'bg-violet-100 text-violet-700',
};

function ReviewerPage() {
  const [applications, setApplications] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [status, setStatus] = useState('submitted');
  const [reviewerNote, setReviewerNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const applicationsRef = collection(db, 'applications');
    const q = query(applicationsRef, orderBy('updatedAt', 'desc'));

    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      setApplications(docs);

      if (!docs.length) {
        setSelectedId('');
        return;
      }

      if (!selectedId || !docs.some((item) => item.id === selectedId)) {
        setSelectedId(docs[0].id);
      }
    });

    return () => unsub();
  }, [selectedId]);

  const selectedApplication = useMemo(
    () => applications.find((item) => item.id === selectedId) || null,
    [applications, selectedId],
  );

  useEffect(() => {
    if (!selectedApplication) {
      return;
    }

    setStatus(selectedApplication.status || 'submitted');
    setReviewerNote(selectedApplication.reviewerNote || '');
  }, [selectedApplication]);

  const saveReview = async () => {
    if (!selectedApplication) {
      return;
    }

    setSaving(true);

    try {
      await updateDoc(doc(db, 'applications', selectedApplication.id), {
        status,
        reviewerNote,
        updatedAt: serverTimestamp(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <aside className="card-playful p-6">
        <h1 className="text-2xl font-black text-slate-900">Reviewer Desk</h1>
        <p className="mt-1 text-sm text-slate-600">Manage part-time applications for BRIDGE.</p>

        <div className="mt-4 space-y-2">
          {applications.map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => setSelectedId(app.id)}
              className={`w-full rounded-2xl border p-3 text-left transition ${
                app.id === selectedId
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold">{app.fullName || 'Unnamed Applicant'}</p>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-bold ${
                    app.id === selectedId
                      ? 'bg-white/20 text-white'
                      : STATUS_STYLE[app.status || 'submitted'] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {(app.status || 'submitted').toUpperCase()}
                </span>
              </div>
              <p className="mt-1 text-xs opacity-80">{app.email}</p>
            </button>
          ))}

          {!applications.length && (
            <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
              No applications yet.
            </p>
          )}
        </div>
      </aside>

      <section className="card-playful p-6">
        {!selectedApplication && <p className="text-sm text-slate-600">Select an applicant from the left.</p>}

        {selectedApplication && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={selectedApplication.profilePicUrl || '/bridge-logo.png'}
                alt={selectedApplication.fullName || 'Applicant'}
                className="h-16 w-16 rounded-full border-4 border-white object-cover"
              />
              <div>
                <h2 className="text-2xl font-black text-slate-900">{selectedApplication.fullName}</h2>
                <p className="text-sm text-slate-600">{selectedApplication.email}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-2xl bg-white p-3 shadow">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Phone</p>
                <p className="mt-1 text-sm text-slate-800">{selectedApplication.phone || '-'}</p>
              </article>
              <article className="rounded-2xl bg-white p-3 shadow">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Location</p>
                <p className="mt-1 text-sm text-slate-800">{selectedApplication.location || '-'}</p>
              </article>
              <article className="rounded-2xl bg-white p-3 shadow">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Availability</p>
                <p className="mt-1 text-sm text-slate-800">{selectedApplication.availability || '-'}</p>
              </article>
              <article className="rounded-2xl bg-white p-3 shadow">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Skills</p>
                <p className="mt-1 text-sm text-slate-800">{selectedApplication.skills || '-'}</p>
              </article>
            </div>

            <article className="rounded-2xl bg-white p-3 shadow">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">What They Offer</p>
              <p className="mt-1 text-sm text-slate-800">{selectedApplication.whatYouOffer || '-'}</p>
            </article>

            <article className="rounded-2xl bg-white p-3 shadow">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Experience</p>
              <p className="mt-1 text-sm text-slate-800">{selectedApplication.experience || '-'}</p>
            </article>

            <div className="rounded-2xl bg-white p-3 shadow">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Documents</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedApplication.resumeUrl && (
                  <a
                    href={selectedApplication.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary"
                  >
                    View Resume
                  </a>
                )}
                {(selectedApplication.certificateUrls || []).map((cert) => (
                  <a
                    key={cert.url}
                    href={cert.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary"
                  >
                    {cert.name}
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow">
              <label className="label">Status</label>
              <select className="input" value={status} onChange={(event) => setStatus(event.target.value)}>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.toUpperCase()}
                  </option>
                ))}
              </select>

              <label className="label mt-3">Reviewer Note</label>
              <textarea
                className="input"
                rows={3}
                value={reviewerNote}
                onChange={(event) => setReviewerNote(event.target.value)}
              />

              <button type="button" className="btn-primary mt-3" onClick={saveReview} disabled={saving}>
                {saving ? 'Saving...' : 'Save Review Update'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default ReviewerPage;

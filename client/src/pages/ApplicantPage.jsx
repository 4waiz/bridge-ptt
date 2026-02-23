import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import useAuth from '../context/useAuth';
import { db, storage } from '../firebase';

const STATUS_STYLE = {
  submitted: 'bg-sky-100 text-sky-700',
  reviewing: 'bg-amber-100 text-amber-700',
  shortlisted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  hired: 'bg-violet-100 text-violet-700',
};

async function uploadFile(path, file) {
  if (!file) {
    return '';
  }

  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

function ApplicantPage() {
  const { user, refreshUser } = useAuth();

  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: '',
    location: '',
    availability: '',
    whatYouOffer: '',
    skills: '',
    experience: '',
    portfolio: '',
  });

  const [application, setApplication] = useState(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [profileFile, setProfileFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [certificateFiles, setCertificateFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadApplication = useCallback(async () => {
    if (!user?.uid) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const appRef = doc(db, 'applications', user.uid);
      const appSnap = await getDoc(appRef);

      if (!appSnap.exists()) {
        setApplication(null);
        setForm((prev) => ({
          ...prev,
          fullName: user.name || prev.fullName,
        }));
        setProfilePreview(user.profilePicUrl || '');
        return;
      }

      const data = appSnap.data();
      setApplication(data);
      setForm({
        fullName: data.fullName || user.name || '',
        phone: data.phone || '',
        location: data.location || '',
        availability: data.availability || '',
        whatYouOffer: data.whatYouOffer || '',
        skills: data.skills || '',
        experience: data.experience || '',
        portfolio: data.portfolio || '',
      });
      setProfilePreview(data.profilePicUrl || user.profilePicUrl || '');
    } catch {
      setError('Could not load your application right now.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, user?.name, user?.profilePicUrl]);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!user?.uid) {
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const timestamp = Date.now();

      const profilePicUrl = profileFile
        ? await uploadFile(`profile-pictures/${user.uid}/${timestamp}-${profileFile.name}`, profileFile)
        : application?.profilePicUrl || user.profilePicUrl || '';

      const resumeUrl = resumeFile
        ? await uploadFile(`resumes/${user.uid}/${timestamp}-${resumeFile.name}`, resumeFile)
        : application?.resumeUrl || '';

      let certificateUrls = application?.certificateUrls || [];
      if (certificateFiles.length) {
        const uploadedCertificates = [];
        for (const file of certificateFiles) {
          const url = await uploadFile(`certificates/${user.uid}/${timestamp}-${file.name}`, file);
          uploadedCertificates.push({
            name: file.name,
            url,
          });
        }
        certificateUrls = uploadedCertificates;
      }

      const payload = {
        userId: user.uid,
        email: user.email,
        fullName: form.fullName,
        phone: form.phone,
        location: form.location,
        availability: form.availability,
        whatYouOffer: form.whatYouOffer,
        skills: form.skills,
        experience: form.experience,
        portfolio: form.portfolio,
        profilePicUrl,
        resumeUrl,
        certificateUrls,
        status: application?.status || 'submitted',
        updatedAt: serverTimestamp(),
        createdAt: application?.createdAt || serverTimestamp(),
      };

      await setDoc(doc(db, 'applications', user.uid), payload, { merge: true });
      await setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          email: user.email,
          name: form.fullName,
          role: user.role,
          profilePicUrl,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      await refreshUser();
      setProfileFile(null);
      setResumeFile(null);
      setCertificateFiles([]);
      setMessage('Application saved successfully.');
      await loadApplication();
    } catch {
      setError('Unable to save right now. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-3xl bg-white/80 p-8 text-center">Loading your application...</div>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="card-playful p-6 sm:p-8">
        <h1 className="text-3xl font-black text-slate-900">Part-Time Application</h1>
        <p className="mt-2 text-sm text-slate-600">
          Fill once, update anytime. Add your profile pic, resume, certificates, and what you offer.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Full Name</label>
              <input
                className="input"
                value={form.fullName}
                onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" value={user?.email || ''} readOnly />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                className="input"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Location</label>
              <input
                className="input"
                value={form.location}
                onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Part-Time Availability</label>
            <input
              className="input"
              placeholder="Example: 20 hours/week, evenings, weekends"
              value={form.availability}
              onChange={(event) => setForm((prev) => ({ ...prev, availability: event.target.value }))}
              required
            />
          </div>

          <div>
            <label className="label">What You Offer</label>
            <textarea
              className="input"
              rows={4}
              placeholder="Tell BRIDGE what value you bring."
              value={form.whatYouOffer}
              onChange={(event) => setForm((prev) => ({ ...prev, whatYouOffer: event.target.value }))}
              required
            />
          </div>

          <div>
            <label className="label">Skills / Tools</label>
            <input
              className="input"
              placeholder="React, Figma, Content Writing, Data Analysis..."
              value={form.skills}
              onChange={(event) => setForm((prev) => ({ ...prev, skills: event.target.value }))}
              required
            />
          </div>

          <div>
            <label className="label">Experience Summary</label>
            <textarea
              className="input"
              rows={4}
              value={form.experience}
              onChange={(event) => setForm((prev) => ({ ...prev, experience: event.target.value }))}
              required
            />
          </div>

          <div>
            <label className="label">Portfolio / LinkedIn (optional)</label>
            <input
              className="input"
              placeholder="https://..."
              value={form.portfolio}
              onChange={(event) => setForm((prev) => ({ ...prev, portfolio: event.target.value }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Profile Picture</label>
              <input
                className="input"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  setProfileFile(file);
                  if (file) {
                    setProfilePreview(URL.createObjectURL(file));
                  }
                }}
              />
            </div>

            <div>
              <label className="label">Resume (PDF/DOC)</label>
              <input
                className="input"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div>
            <label className="label">Certificates (multiple)</label>
            <input
              className="input"
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(event) => setCertificateFiles(Array.from(event.target.files || []))}
            />
          </div>

          {message && <p className="rounded-xl bg-emerald-100 px-3 py-2 text-sm text-emerald-700">{message}</p>}
          {error && <p className="rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Application'}
          </button>
        </form>
      </section>

      <aside className="space-y-4">
        <section className="card-playful p-6">
          <h2 className="text-xl font-black text-slate-900">Your Profile</h2>
          <div className="mt-4 flex items-center gap-3">
            <img
              src={profilePreview || '/bridge-logo.png'}
              alt="Profile"
              className="h-20 w-20 rounded-full border-4 border-white object-cover shadow"
            />
            <div>
              <p className="font-bold text-slate-900">{form.fullName || 'Your name'}</p>
              <p className="text-sm text-slate-600">{user?.email}</p>
            </div>
          </div>
        </section>

        <section className="card-playful p-6">
          <h2 className="text-xl font-black text-slate-900">Application Status</h2>
          <div className="mt-3">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${
                STATUS_STYLE[application?.status || 'submitted'] || 'bg-slate-100 text-slate-700'
              }`}
            >
              {(application?.status || 'submitted').toUpperCase()}
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Resume: {application?.resumeUrl ? 'Uploaded' : 'Not uploaded yet'}
          </p>
          {application?.resumeUrl && (
            <a
              href={application.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex text-sm font-bold text-slate-900 underline"
            >
              View Resume
            </a>
          )}

          <p className="mt-4 text-sm text-slate-600">
            Certificates: {application?.certificateUrls?.length || 0}
          </p>
          <div className="mt-2 space-y-1">
            {(application?.certificateUrls || []).map((cert) => (
              <a
                key={cert.url}
                href={cert.url}
                target="_blank"
                rel="noreferrer"
                className="block text-xs font-semibold text-slate-700 underline"
              >
                {cert.name}
              </a>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

export default ApplicantPage;

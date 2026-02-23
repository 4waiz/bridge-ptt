import { useEffect, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import useAuth from '../context/useAuth';
import { db, storage } from '../firebase';

function AccountPage() {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [photoPreview, setPhotoPreview] = useState(user?.profilePicUrl || '');
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setName(user?.name || '');
    setPhotoPreview(user?.profilePicUrl || '');
  }, [user?.name, user?.profilePicUrl]);

  const onPhotoChange = (event) => {
    const file = event.target.files?.[0] || null;
    setPhotoFile(file);

    if (!file) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview((previous) => {
      if (previous?.startsWith('blob:')) {
        URL.revokeObjectURL(previous);
      }
      return objectUrl;
    });
  };

  const saveChanges = async (event) => {
    event.preventDefault();

    if (!user?.uid) {
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');

    try {
      let profilePicUrl = user.profilePicUrl || '';

      if (photoFile) {
        const filePath = `profile-pictures/${user.uid}/${Date.now()}-${photoFile.name}`;
        const fileRef = ref(storage, filePath);
        await uploadBytes(fileRef, photoFile);
        profilePicUrl = await getDownloadURL(fileRef);
      }

      await setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          email: user.email,
          role: user.role,
          name,
          profilePicUrl,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      const applicationRef = doc(db, 'applications', user.uid);
      const existingApplication = await getDoc(applicationRef);
      if (existingApplication.exists()) {
        await setDoc(
          applicationRef,
          {
            fullName: name,
            profilePicUrl,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }

      await refreshUser();
      setPhotoFile(null);
      setMessage('Account updated successfully.');
    } catch {
      setError('Unable to update account right now. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card-surface mx-auto max-w-3xl p-6 sm:p-8">
      <h1 className="text-3xl font-black text-slate-900">Account Settings</h1>
      <p className="mt-2 text-sm text-slate-700">Update your profile details and photo.</p>

      <form className="mt-6 space-y-6" onSubmit={saveChanges}>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <img
            src={photoPreview || '/bridge-logo.png'}
            alt="Profile"
            className="h-24 w-24 rounded-full border-4 border-white object-cover shadow"
          />

          <div className="w-full space-y-2 sm:max-w-sm">
            <label htmlFor="photo" className="label">
              Profile Picture
            </label>
            <input id="photo" type="file" accept="image/*" className="input" onChange={onPhotoChange} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="label">
              Full Name
            </label>
            <input
              id="name"
              className="input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input id="email" className="input" value={user?.email || ''} readOnly />
          </div>
        </div>

        <div>
          <label htmlFor="role" className="label">
            Role
          </label>
          <input id="role" className="input" value={user?.role || ''} readOnly />
        </div>

        {message && <p className="rounded-uiSm bg-emerald-100 px-4 py-3 text-sm text-emerald-700">{message}</p>}
        {error && <p className="rounded-uiSm bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <button type="submit" className="btn-primary" disabled={saving} aria-busy={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </section>
  );
}

export default AccountPage;

function FirebaseSetupPage({ missingKeys = [], initError }) {
  return (
    <section className="card-surface mx-auto max-w-3xl p-6 sm:p-8">
      <h1 className="text-3xl font-black text-slate-900">Firebase Setup Needed</h1>
      <p className="mt-2 text-sm text-slate-700">
        The app is running, but Firebase is not configured yet, so data and auth cannot load.
      </p>

      {missingKeys.length > 0 && (
        <div className="mt-6 rounded-uiMd border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-slate-900">Missing keys in `client/.env`:</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
            {missingKeys.map((key) => (
              <li key={key}>{key}</li>
            ))}
          </ul>
        </div>
      )}

      {initError && (
        <div className="mt-4 rounded-uiMd bg-rose-100 p-4 text-sm text-rose-800">
          Firebase init error: {initError.message}
        </div>
      )}

      <div className="mt-6 rounded-uiMd border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <p className="font-bold">Fix in 3 steps:</p>
        <ol className="mt-2 list-decimal pl-5">
          <li>Create `client/.env` from `client/.env.example`.</li>
          <li>Paste Firebase Web App config values from Firebase Console.</li>
          <li>Stop and restart `npm run dev:client`.</li>
        </ol>
      </div>
    </section>
  );
}

export default FirebaseSetupPage;

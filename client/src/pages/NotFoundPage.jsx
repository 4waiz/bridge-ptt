import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-8">
      <div className="card-surface w-full p-8 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">404</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Page Not Found</h1>
        <p className="mt-2 text-sm text-slate-600">The requested route does not exist.</p>
        <Link to="/" className="btn-primary mt-5 inline-flex">
          Go Home
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;

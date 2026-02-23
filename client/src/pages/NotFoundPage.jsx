import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/85 p-8 text-center shadow-xl">
      <h1 className="text-4xl font-black text-slate-900">404</h1>
      <p className="mt-2 text-slate-600">This page does not exist.</p>
      <Link to="/" className="btn-primary mt-4 inline-flex">
        Go Home
      </Link>
    </div>
  );
}

export default NotFoundPage;

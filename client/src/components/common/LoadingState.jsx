function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-sm font-medium text-slate-500">
      {message}
    </div>
  );
}

export default LoadingState;

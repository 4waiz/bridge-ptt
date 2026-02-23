import clsx from 'clsx';

function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl bg-slate-100 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={clsx(
            'rounded-lg px-3 py-2 text-sm font-semibold transition',
            activeTab === tab.value
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default Tabs;

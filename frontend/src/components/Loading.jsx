const Loading = ({ label = 'Loading…', className = '' }) => (
  <div className={`flex items-center justify-center gap-3 py-12 text-slate-600 ${className}`} role="status">
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
    <span>{label}</span>
  </div>
)

export default Loading

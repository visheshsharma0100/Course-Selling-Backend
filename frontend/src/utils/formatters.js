export const formatPrice = (price) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(Number(price || 0))

export const formatDate = (date) => date ? new Intl.DateTimeFormat('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric',
}).format(new Date(date)) : '—'

export const initials = (name = 'SkillStack learner') => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()

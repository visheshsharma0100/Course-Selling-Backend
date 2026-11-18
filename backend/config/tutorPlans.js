export const tutorPlans = Object.freeze({
    monthly: Object.freeze({ key: "monthly", name: "One month", amount: 100, months: 1 }),
    quarterly: Object.freeze({ key: "quarterly", name: "Three months", amount: 300, months: 3 }),
    yearly: Object.freeze({ key: "yearly", name: "Full year", amount: 1000, months: 12 }),
});

export const getTutorPlan = (planKey) => tutorPlans[planKey] || null;
export const publicTutorPlans = () => Object.values(tutorPlans).map(({ key, name, amount, months }) => ({ key, name, amount, months }));

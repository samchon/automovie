/** The number of gates whose exit status was not zero. */

export const auditStatuses = (statuses: readonly number[]): number => statuses.reduce((failures, status) => failures + (status === 0 ? 0 : 1), 0);

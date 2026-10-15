
/** Whether two lengths agree within a micrometre. */
export const same = (a: number, b: number): boolean => Math.abs(a - b) < 1e-6;

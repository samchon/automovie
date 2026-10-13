/** Admits meaningful discrete sampling counts for procedural geometry. */
export const countAtLeast = (
  value: number,
  least: number,
  label: string,
): void => {
  if (!Number.isSafeInteger(value) || value < least)
    throw new Error(`${label} must be a safe integer >= ${least}`);
};

/*
 * Refuse a discrete sampling count that is not a safe integer of at least
 * `least`, such as the segment count of a revolved profile.
 *
 * `label` names the count in the thrown message, which reads `<label> must be a
 * safe integer >= <least>`. The check runs before the builder allocates any
 * buffer sized by the count.
 * Parameter value: Count the author supplied.
 * Parameter least: Smallest count the operation can build from.
 * Parameter label: Name of the count in the diagnostic.
 */
export const countAtLeast = (
  value: number,
  least: number,
  label: string,
): void => {
  if (value < least)
    throw new Error(`${label} must be a safe integer >= ${least}`);
};

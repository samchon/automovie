/**
 * Return the exact Date.toISOString UTC spelling after a valid Date roundtrip. Alternative timezone/precision spellings refuse even when they denote the same instant; no chronology or observation truth is checked.
 *
 * @evidence contracts/common.md#principled-implementation Date parsing must produce a valid time and its canonical ISO UTC string must exactly equal the supplied retention text.
 * @evidence contracts/common.md#clear-and-simple-design One raw-family instant policy serves planning and stored-receipt boolean checks without another timestamp representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equivalent noncanonical timestamps are refused rather than normalized, and a canonical instant proves neither actual retention time nor ordering.
 * @evidence contracts/common.md#meaningful-documentation Prose gives exact roundtrip/UTC meaning and the absent chronology guarantee.
 * @evidence contracts/performance.md#efficient-algorithms One Date parse and canonical formatting process the supplied time text with fixed Date state; no attempt population is visited.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The scalar validator owns no timestamp cache or request coordinator.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Date/formatted text expire after return/throw and only the original string escapes; no timer or clock task is acquired.
 */
export const productionRepaintRawExactInstant: (value: string) => string = (value: string): string => {
  const instant: Date = new Date(value);
  if (Number.isNaN(instant.getTime()) || instant.toISOString() !== value)
    throw new Error("Repaint raw output requires an exact UTC instant.");
  return value;
};

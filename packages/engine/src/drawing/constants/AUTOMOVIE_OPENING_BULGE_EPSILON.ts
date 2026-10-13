/**
 * Largest bulge magnitude an opening edge may carry and still be straight.
 *
 * A bulge is `tan(sweep / 4)`, so `1e-12` is an arc whose sagitta is a
 * trillionth of its chord: no drafted chord and no measured area can show it,
 * and treating it as an arc would only divide by a vanishing number.
 */
export const AUTOMOVIE_OPENING_BULGE_EPSILON: number = 1e-12;

import { hingedArmSwivel } from "./hingedArmSwivel";

/** The original articulation's fixed swivel step, degrees. */
const STEP: number = hingedArmSwivel.STEP;

/** The original golden-section contraction factor. */
const GOLDEN: number = hingedArmSwivel.GOLDEN;

/**
 * Refine one swivel bracket by the articulation's original golden-section
 * search (Kiefer 1953), preserving the caller's complete candidate ordering. A
 * tie closes onto both probes so mirrored equal probes keep mirrored brackets.
 * The returned candidate is one of the last two actual probes. If both finite
 * probe angles become bit-identical, their next tie collapses both ends to that
 * number and every later probe is identical. Return their original final
 * comparison instead of repeating guaranteed-identical work.
 *
 * @param probe Actual scorer at a swivel angle, degrees.
 * @param better Whether the first candidate is strictly ahead of the second.
 * @param angle Centre of the two-step bracket, degrees.
 * @param passes Original refinement count, including a near fit's
 *   tolerance-derived count.
 * @returns The strictly better final probe, or the first on a complete tie.
 */
export function refineHingedSwivel<T>(
  probe: (angle: number) => T,
  better: (a: T, b: T) => boolean,
  angle: number,
  passes: number,
): T {
  let low: number = angle - STEP;
  let high: number = angle + STEP;
  let inner: number = high - GOLDEN * (high - low);
  let outer: number = low + GOLDEN * (high - low);
  let atInner: T = probe(inner);
  let atOuter: T = probe(outer);
  for (let pass: number = 0; pass < passes; ++pass) {
    if (Object.is(inner, outer))
      return better(atOuter, atInner) ? atOuter : atInner;
    if (better(atInner, atOuter)) {
      high = outer;
      outer = inner;
      atOuter = atInner;
      inner = high - GOLDEN * (high - low);
      atInner = probe(inner);
    } else if (better(atOuter, atInner)) {
      low = inner;
      inner = outer;
      atInner = atOuter;
      outer = low + GOLDEN * (high - low);
      atOuter = probe(outer);
    } else {
      low = inner;
      high = outer;
      inner = high - GOLDEN * (high - low);
      outer = low + GOLDEN * (high - low);
      atInner = probe(inner);
      atOuter = probe(outer);
    }
  }
  return better(atOuter, atInner) ? atOuter : atInner;
}

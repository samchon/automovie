import { hingedArmSwivel } from "./hingedArmSwivel";

/** The original articulation's fixed swivel step, degrees. */
const STEP: number = hingedArmSwivel.STEP;

/** The original golden-section contraction factor. */
const GOLDEN: number = hingedArmSwivel.GOLDEN;

/**
 * Refine one swivel bracket by the articulation's original golden-section
 * search (Kiefer 1953), preserving the caller's complete candidate ordering.
 * A tie closes onto both probes so mirrored equal probes keep mirrored
 * brackets. The returned candidate is one of the last two actual probes.
 * If both finite probe angles become bit-identical, their next tie collapses
 * both ends to that number and every later probe is identical. Return their
 * original final comparison instead of repeating guaranteed-identical work.
 *
 * @param probe Actual scorer at a swivel angle, degrees.
 * @param better Whether the first candidate is strictly ahead of the second.
 * @param angle Centre of the two-step bracket, degrees.
 * @param passes Original refinement count, including a near fit's tolerance-derived count.
 * @returns The strictly better final probe, or the first on a complete tie.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines degree-valued brackets, caller-owned ordering, tied-probe symmetry and actual returned-probe policy.
 * @evidence contracts/development/implementation.md#principled-implementation Golden-section search reuses one interior probe when one bracket side is discarded; equal probes close both ends under the existing symmetric refinement convention.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This helper owns the same bracket law used by both coarse-minimum and near-seed refinement; hingedArmArticulation owns candidates, legality and score/tie policy.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps original step/ratio/count and tie updates until finite probes become Object.is-identical. Their next tie collapses both bounds to that number, so all remaining values/objectives match. This exact representability stop uses no epsilon, guessed convergence or arbitrary sample reduction and distinguishes signed zero.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two initial probes and one new probe per ordinary pass, two on a tie, cost O(P) scoring. Bit-identical finite probes omit guaranteed-identical remaining work. Retained state is constant-size; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A surviving actual candidate remains shared. At bit-identical finite probes the original final comparison suffices because every further value/objective would match under the same unchanged scorer; no score crosses refinement calls or targets.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Two current candidates and scalar bracket state are local until return; only the selected actual candidate escapes, with no history, global state or handles.
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
    if (Number.isFinite(inner) && Object.is(inner, outer))
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

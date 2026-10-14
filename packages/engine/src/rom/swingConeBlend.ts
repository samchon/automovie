import { swingConeAngle } from "./swingConeAngle";

/**
 * Bisect forty times from a feasible anchor toward an outside endpoint and return the retained feasible lower parameter. The largest-boundary interpretation requires monotonic swing on that segment, a premise current admission does not prove for unrestricted multi-turn overrides. An already admitted endpoint returns one.
 *
 * @evidence contracts/common.md#principled-implementation For an outside endpoint, bisect forty times from an inside-cone anchor and return the retained feasible lower parameter; largest-boundary meaning requires monotonic swing along that segment.
 * @evidence contracts/common.md#clear-and-simple-design A box-nearest-neutral anchor preserves convex axis intervals while this owner supplies scalar cone search.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Forty iterations are numerical precision policy; unrestricted multi-turn overrides can violate monotonicity, which current admission does not generally prove, leaving global largest-t behavior unsupported.
 * @evidence contracts/common.md#meaningful-documentation Docs state anchor feasibility, monotonic-segment premise, lower-bound return and fixed precision without universal cone/box optimality.
 * @evidence contracts/performance.md#efficient-algorithms At most forty angular evaluations take constant work/space and about 2^-40 parameter resolution under the stated premise.
 * @evidence contracts/performance.md#reuse-equivalent-work Endpoint acceptance reuses its metric; changed angles/anchor/cone require a fresh search without mutable-constraint caching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a scalar escapes; closure/temporaries release with the call and no pose population, solver handle or task is held.
 */
export const swingConeBlend: (
  flexion: number,
  abduction: number,
  anchorFlexion: number,
  anchorAbduction: number,
  swingDeg: number,
) => number = (
  flexion: number,
  abduction: number,
  anchorFlexion: number,
  anchorAbduction: number,
  swingDeg: number,
): number => {
  if (swingConeAngle(flexion, abduction) <= swingDeg) return 1;
  const at: (t: number) => number = (t: number): number =>
    swingConeAngle(
      anchorFlexion + (flexion - anchorFlexion) * t,
      anchorAbduction + (abduction - anchorAbduction) * t,
    );
  let lo: number = 0;
  let hi: number = 1;
  // Fixed bisection precision. Under a feasible anchor and monotonic segment,
  // retaining the lower side preserves an admitted cone value.
  for (let i: number = 0; i < 40; ++i) {
    const mid: number = (lo + hi) / 2;
    if (at(mid) > swingDeg) hi = mid;
    else lo = mid;
  }
  return lo;
};

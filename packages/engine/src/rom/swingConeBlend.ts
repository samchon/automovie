import { bracketedCrossing } from "../math/bracketedCrossing";
import { swingConeAngle } from "./swingConeAngle";

/**
 * From a feasible anchor toward an outside endpoint, the greatest parameter read whose swing stays inside the cone, to the width forty bisections leave (`HALVINGS`). The swing along the segment is continuous, so the bracket is closed by false position and whatever width that leaves by bisection (`bracketedCrossing`); the retained lower end is a parameter actually read inside the cone. The largest-boundary interpretation requires monotonic swing on that segment, a premise current admission does not prove for unrestricted multi-turn overrides. An already admitted endpoint returns one.
 *
 * @evidence contracts/development/implementation.md#principled-implementation For an outside endpoint, close the bracket from an inside-cone anchor onto the cone's crossing and return the retained feasible lower parameter; largest-boundary meaning requires monotonic swing along that segment. The search is the Illinois false position on the continuous swing, completed by bisection to the stated width.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A box-nearest-neutral anchor preserves convex axis intervals while this owner supplies scalar cone search through the shared bracketed crossing.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The width of forty halvings is numerical precision policy; unrestricted multi-turn overrides can violate monotonicity, which current admission does not generally prove, leaving global largest-t behavior unsupported. An anchor that is itself outside the cone is halved toward as before.
 * @evidence contracts/development/common.md#meaningful-documentation Docs state anchor feasibility, monotonic-segment premise, lower-bound return and fixed precision without universal cone/box optimality.
 * @evidence contracts/development/implementation.md#efficient-algorithms One angular evaluation a step at superlinear order on a smooth swing, in place of forty; the same about 2^-40 parameter resolution under the stated premise. Unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Endpoint acceptance reuses its metric and its reading is not taken again; changed angles/anchor/cone require a fresh search without mutable-constraint caching.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only a scalar escapes; closure/temporaries release with the call and no pose population, solver handle or task is held.
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
  const end: number = swingConeAngle(flexion, abduction);
  if (end <= swingDeg) return 1;
  const at: (t: number) => number = (t: number): number =>
    swingConeAngle(
      anchorFlexion + (flexion - anchorFlexion) * t,
      anchorAbduction + (abduction - anchorAbduction) * t,
    );

  // Under a feasible anchor and monotonic segment, the retained lower end is
  // an admitted cone value.
  return bracketedCrossing({
    f: (t: number): number => at(t) - swingDeg,
    past: (excess: number): boolean => excess > 0,
    low: 0,
    high: 1,
    known: { low: at(0) - swingDeg, high: end - swingDeg },
    tolerance: 2 ** -HALVINGS,
  }).low;
};

/** The bisections whose final bracket width the search closes to: about 1e-12 of the segment. */
const HALVINGS: number = 40;

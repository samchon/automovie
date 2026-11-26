import { bracketedCrossing } from "../math/bracketedCrossing";
import { swingConeAngle } from "./swingConeAngle";

/**
 * From a feasible anchor toward an outside endpoint, the greatest parameter
 * read whose swing stays inside the cone, to the width forty bisections leave
 * (`HALVINGS`). The swing along the segment is continuous, so the bracket is
 * closed by false position and whatever width that leaves by bisection
 * (`bracketedCrossing`); the retained lower end is a parameter actually read
 * inside the cone. The largest-boundary interpretation requires monotonic swing
 * on that segment, a premise current admission does not prove for unrestricted
 * multi-turn overrides. An already admitted endpoint returns one.
 */
export function swingConeBlend(
  flexion: number,
  abduction: number,
  anchorFlexion: number,
  anchorAbduction: number,
  swingDeg: number,
): number {
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
}

/**
 * The bisections whose final bracket width the search closes to: about 1e-12 of
 * the segment.
 */
const HALVINGS: number = 40;

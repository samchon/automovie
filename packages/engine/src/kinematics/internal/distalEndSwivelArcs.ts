import type { IAutoMovieSwivelArcs } from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { distalEndSwivelReadings } from "../distalEndSwivelReadings";
import { swivelArcs } from "../swivelArcs";

/**
 * The swivels at which the end joint of a chain whose mid segment twists
 * distally (a wrist beyond a forearm) cannot take a requested rotation inside
 * its range, as arcs in closed form.
 *
 * The end joint's two free angles are read off where the mid segment points in
 * the requested rotation's frame (`distalEndSwivelReadings` states the
 * derivation): the abduction by its sine `-d_flexion`, the flexion by the
 * vector `(d_abduction, d_twist)`, every component a sinusoid of the swivel.
 * Each bound of the joint's box therefore refuses the arc where its sinusoid
 * exceeds the margin (`swivelArcs`), as `boxExcludedSwivels` reads a root
 * joint's box.
 *
 * The arcs say nothing of the mid segment's own twist range: the twist the
 * request leaves it is not a sinusoid of the swivel, though where it meets an
 * end of its range is (`distalTwistSwivelRange`), and the swivel chosen is the
 * caller's to verify.
 *
 * @param props The end joint, the mid segment's direction by swivel and the
 *   margin.
 * @returns The refused arcs merged over a turn, every swivel, or null when the
 *   analysis does not apply (`distalEndSwivelReadings.of`).
 */
export function distalEndSwivelArcs(
  props: distalEndSwivelReadings.IProps & {
    /**
     * How far past a bound, in sine or projected units, a reading must lie to
     * be refused; negative keeps the result strictly inside.
     */
    margin: number;
  },
): IAutoMovieSwivelArcs.IArc[] | "all" | null {
  const read: distalEndSwivelReadings.IReadings | null =
    distalEndSwivelReadings.of(props);
  if (read === null) return null;
  const { onFlexion, onAbduction, onTwist }: distalEndSwivelReadings.IReadings =
    read;

  const arcs: IAutoMovieSwivelArcs.IArc[] = [];
  const refuse = (f: IAutoMovieSwivelArcs.ISinusoid): boolean => {
    const arc: IAutoMovieSwivelArcs.IArc | "all" | null = swivelArcs.above(
      f,
      props.margin,
    );
    if (arc === "all") return true;
    if (arc !== null) arcs.push(arc);
    return false;
  };

  // Abduction, the middle angle: sin a = -d_flexion, inside [lo, hi] within
  // a quarter turn either way.
  if (read.abduction !== null) {
    const [lo, hi]: readonly [number, number] = read.abduction;
    const sine: IAutoMovieSwivelArcs.ISinusoid = swivelArcs.scaled(
      onFlexion,
      -1,
    );
    if (
      hi < 90 &&
      refuse({ ...sine, a: sine.a - Math.sin(hi * Quaternion.DEG2RAD) })
    )
      return "all";
    if (
      lo > -90 &&
      refuse(
        swivelArcs.scaled(
          { ...sine, a: sine.a - Math.sin(lo * Quaternion.DEG2RAD) },
          -1,
        ),
      )
    )
      return "all";
  }

  // Flexion, an outer angle: atan2(d_abduction, d_twist), past the upper end
  // where y cos β - x sin β is positive and past the lower where
  // x sin α - y cos α is, for an interval no wider than a half turn.
  if (read.flexion !== null) {
    const alpha: number = read.flexion[0] * Quaternion.DEG2RAD;
    const beta: number = read.flexion[1] * Quaternion.DEG2RAD;
    if (
      refuse(
        swivelArcs.combined(
          onAbduction,
          Math.cos(beta),
          onTwist,
          -Math.sin(beta),
        ),
      )
    )
      return "all";
    if (
      refuse(
        swivelArcs.combined(
          onTwist,
          Math.sin(alpha),
          onAbduction,
          -Math.cos(alpha),
        ),
      )
    )
      return "all";
  }
  return swivelArcs.union(arcs);
}

import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanEventJoinPlace } from "./AutoMovieHumanEventJoinPlace";
import { AutoMovieHumanEventJoinRing } from "./AutoMovieHumanEventJoinRing";
import { AutoMovieHumanEventJoinSlope } from "./AutoMovieHumanEventJoinSlope";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Position and tangent-plane continuity across branch events.
 *
 * At an event the child's mesh inherits the parent's contact ring, while
 * the child's own end layer is evaluated from its coefficients. The fitter
 * makes the two agree, but the shape law maps parent and child through
 * their own morph displacements and warp maps, which differ at the ring:
 * measured on m1 the child's end ring lay 0.2 mm (median) and 0.8 mm (90th
 * percentile) off the parent's ring at 1502 mm, and up to 2.8 mm at the
 * eye-height ring. The mesh closes that gap inside the child's first band,
 * which shades as a line round the face. The first rule moves the child's
 * end ring onto the parent's: each end point goes to the nearest point of
 * the parent's ring, and the move fades out over the child's layers within
 * {@link AutoMovieHumanEventJoinPlace.REACH} mm of the ring (at least two layers), with the station
 * slopes the fade implies, so the child closes the gap over a few
 * millimetres instead of one band. Points off the parent's arcs (the bridge
 * across a pinch) keep their place, and a point leaves the move as it leaves
 * the parent's ring, by the same fade the slopes below use: a hard gate at a
 * distance moved the chord of an ear's lobe, which lies near a ring it is not
 * on, and printed waves along it.
 *
 * Each chain's end layer also carries its own fitted station slopes. Where those slopes put the child's surface at
 * an angle to the parent's, the shared ring prints a crease: measured on
 * the f1 calibration it reached 4 degrees at the 90th percentile and 20
 * degrees at worst along the 1595.5 mm head ring (from the outer eye
 * corner to the ear), 12 degrees at the 1543.2 mm ring and 11 degrees at
 * the axillae.
 *
 * The rule makes the child's end derivative lie in the parent's tangent
 * plane. At a child section point p with parent phase tau on an inherited
 * arc, the parent surface normal is `N = dP/dt x dP/ds` and the child's
 * station derivative D_c is moved within the child's section plane along
 * the section's in-plane normal m by
 *
 * ```text
 * alpha = N . (D_p - D_c) / (N . m)
 * ```
 *
 * the smallest in-plane change giving `N . D_c' = N . D_p`. The component
 * along the ring, which carries each chain's own sliding correspondence,
 * and the out-of-plane station advance are kept. The changes at four
 * uniform phases per control point are projected on the child's own
 * spline by plain least squares and added to the end layer's slopes; the
 * layer's coefficients, and so every shared position, are unchanged. A
 * smoothing cutoff of N/8 cycles left the worst creases almost as they
 * were, since they are a few control points wide.
 *
 * Measured after this rule, the 90th-percentile crease fell from 1.3 to
 * 0.6 degrees at the 1543.2 mm ring and from 4.3 to 3.2 degrees at the
 * 1595.5 mm ring; the points beside the canthus stay near 20 degrees
 * because there the skin lies almost in the section plane, where an
 * in-plane slope cannot turn it (the `|N . m|` guard below).
 *
 * Only points on the parent's surface are constrained: the bridge a child
 * section draws across a pinch has no parent surface, so the change fades
 * to zero over the last 6 mm of arc before each pinch phase, and fades out
 * past 0.5 mm from the parent ring and as `|N . m|` falls to 0.3 (the plane
 * almost tangent to the parent).
 *
 * An end slope acts across the child's whole last interval, a cubic Hermite
 * span. A slope m past the span's secant over a span h stands `4/27 m h` off the
 * chord, so a long span turning sharply to reach the parent's tangent trades a
 * crease across the seam for a lump beside it. At the crotch, where the trunk
 * opens at 60 degrees from a thigh that arrives upright, that lump stood 7 mm
 * off the thigh. The change therefore stops at {@link AutoMovieHumanEventJoinSlope.BULGE}; a short span may
 * turn as sharply as its parent asks.
 *
 * Turned inside one span, the tangent planes agree at the ring and nowhere
 * else: the skin's normals part again by 5 to 8 degrees 4 mm either side of the
 * armpit joint and 20 to 30 degrees round the arm's root, which shades as a line
 * across the back and notches the outline. An event with a fillet therefore
 * spreads the turn over the child's layers within that many radii of its end
 * ring: the cubic `m s (1 - s / R)^2` leaves the ring with slope m and meets the
 * layer at R with neither place nor slope, standing the same `4/27 m R` off at
 * most, so {@link AutoMovieHumanEventJoinSlope.BULGE} bounds it too. What the bound leaves stays in the end
 * span.
 *
 * A child built to leave its contact in the parent's tangent plane, as the leg
 * now leaves the crotch ring, declares the event `shared` and is left as built.
 * Re-sloping it inside a pinch's taper bent its rounded corner back into a
 * crease of 42 to 64 degrees per 2 mm, which the leg alone kept under 13.
 */
export namespace AutoMovieHumanEventJoin {
  /**
   * Calibration whose children meet their parents tangent-continuously.
   *
   * @param calibration Merged calibration; not modified.
   * @returns A copy with the children's adjacent end-layer slopes changed.
   */
  export function reconcile(
    calibration: IAutoMovieHumanBodyCalibration,
  ): IAutoMovieHumanBodyCalibration {
    const chains: Map<string, IAutoMovieHumanLoftChain> = new Map(
      calibration.chains.map(
        (c: IAutoMovieHumanLoftChain): [string, IAutoMovieHumanLoftChain] => [
          c.name,
          c,
        ],
      ),
    );
    const replaced: Map<string, IAutoMovieHumanLoftChain> = new Map();
    for (const event of calibration.events) {
      // Children built in the parent's tangent plane are left as built: a
      // re-slope inside a rounded pinch bent it back into a crease.
      if (event.shared === true) continue;
      const parent: IAutoMovieHumanLoftChain = chains.get(event.parent)!;
      for (const split of event.splits) {
        if (split.shared === true) continue;
        const fitted: IAutoMovieHumanLoftChain | undefined = chains.get(
          split.child,
        );
        if (fitted === undefined)
          throw new Error(`Calibration lacks the ${split.child} chain`);
        const child: IAutoMovieHumanLoftChain =
          replaced.get(split.child) ?? fitted;
        replaced.set(
          split.child,
          join(parent, child, event.direction, split.arcs, event.fillet ?? 0),
        );
      }
    }
    return {
      ...calibration,
      chains: calibration.chains.map(
        (c: IAutoMovieHumanLoftChain): IAutoMovieHumanLoftChain =>
          replaced.get(c.name) ?? c,
      ),
    };
  }
}

/** Child chain moved onto the parent's ring and re-sloped. */
function join(
  parent: IAutoMovieHumanLoftChain,
  child: IAutoMovieHumanLoftChain,
  direction: "down" | "up",
  arcs: [number, number][],
  fillet: number,
): IAutoMovieHumanLoftChain {
  if (child.basis !== "spline") return child;
  const ring: AutoMovieHumanEventJoinRing.IRing = AutoMovieHumanEventJoinRing.parentRing(parent, direction, arcs);
  return AutoMovieHumanEventJoinSlope.slope(parent, ring, AutoMovieHumanEventJoinPlace.place(ring, child, direction), direction, fillet);
}
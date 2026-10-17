import {
  IAutoMovieSweepSection,
  IAutoMovieSweepSurface,
  compileAutoMovieSweep,
} from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { measureAutoMovieHumanAnkleCollar } from "../../junction/measureAutoMovieHumanAnkleCollar";
import { IAutoMovieHumanFootPlan } from "./IAutoMovieHumanFootPlan";

/**
 * The ankle column of the foot solid: the shared ankle ring's section carried down from its pinned collar into the heel, widening to the malleoli.
 *
 * At and above the collar the column is the ring's own B-spline section, read by the engine's polar section reader as the foot sweep reads it. Below the collar the section's four semi-axes, taken along the transmalleolar line (medial landmark to lateral landmark in plan) and across it, are scaled by quintic steps with zero first and second derivatives at both ends: sideways from 1 at the collar to each malleolus landmark at its own height, the medial higher and further forward (Gray 1918, "Surface Anatomy of the Lower Extremity"), then to the heel's side at the heel's side rim; behind to the heel's back at its back rim; in front by a conventional deepening over the talus, reached at the lateral malleolus height. These bony landmark projections and targets at unequal heights do not establish the maximum horizontal uncompressed skin breadth at one plane. Each quadrant scale describes a conventional quarter-ellipse transform of the sampled ring; this does not certify exact calipers, posterior monotonicity or smooth assembled skin.
 *
 * Malleoli as ellipsoids smooth-joined onto a column of the minimum section were rejected: they rose out of the column as a closed band, and the column's rounded end above the heel's rim left a waist and hollows under them.
 *
 * Distances are millimetres in the foot's local frame, `x` lateral, `y` up, `z` forward.
 *
 * @param props The plan, the ankle ring, the inset of the heel targets inside the heel, and the column end's rounding radius
 * @returns The column's radial distance, its floor, collar and the higher malleolus's height
 * @throws {Error} When the collar is not above both malleoli or the malleoli are not above the heel's rim
 */
export function columnAutoMovieHumanFoot(props: {
  plan: IAutoMovieHumanFootPlan;
  ring: { origin: IAutoMovieVector3; section: IAutoMovieSweepSection.IBSpline };
  inset: number;
  round: number;
}): columnAutoMovieHumanFoot.IOutput {
  const plan: IAutoMovieHumanFootPlan = props.plan;
  const arc: IAutoMovieHumanFootPlan.IHeel = plan.heelArc;
  const origin: IAutoMovieVector3 = props.ring.origin;
  const collar: number =
    origin.y - measureAutoMovieHumanAnkleCollar(plan.length);
  const lateral: IAutoMovieVector3 = plan.lateralMalleolus;
  const medial: IAutoMovieVector3 = plan.medialMalleolus;
  // below the heel's side rim the slab carries the heel, so the column's rounded end lies inside it
  const floor: number = arc.rim[1] - props.round;
  const full: number = Math.max(lateral.y, medial.y);
  if (!(collar > full))
    throw new Error("foot collar is not above the malleoli");
  if (
    !(
      Math.min(lateral.y, medial.y) > arc.rim[1] &&
      plan.ankleHeight > floor &&
      arc.rim[0] > floor &&
      arc.rim[1] > floor
    )
  )
    throw new Error("foot malleoli are not above the heel's rim");
  const surface: IAutoMovieSweepSurface = compileAutoMovieSweep({
    spine: {
      points: [
        { x: origin.x / 1000, y: origin.y / 1000, z: origin.z / 1000 },
        { x: origin.x / 1000, y: floor / 1000, z: origin.z / 1000 },
      ],
      normal: { x: 0, y: 0, z: 1 },
    },
    stations: [{ at: 0, section: props.ring.section }],
  });
  const ringRadius: (x: number, z: number) => number = (
    x: number,
    z: number,
  ): number => surface.radius(0, Math.atan2(-x, z) / (2 * Math.PI)) * 1000;
  // the transmalleolar line in plan, medial to lateral, and the forward direction across it
  const n: number = Math.hypot(lateral.x - medial.x, lateral.z - medial.z);
  const across: IPlanar = {
    x: (lateral.x - medial.x) / n,
    z: (lateral.z - medial.z) / n,
  };
  const forward: IPlanar = { x: -across.z, z: across.x };
  const along: (p: IAutoMovieVector3, d: IPlanar) => number = (
    p: IAutoMovieVector3,
    d: IPlanar,
  ): number => (p.x - origin.x) * d.x + (p.z - origin.z) * d.z;
  // each semi-axis's scale of the ring at the malleoli and at the heel
  const inset: number = props.inset;
  const lateralPeak: number =
    along(lateral, across) / ringRadius(across.x, across.z);
  const medialPeak: number =
    -along(medial, across) / ringRadius(-across.x, -across.z);
  const lateralHeel: number =
    (arc.x + arc.width - origin.x - inset) /
    across.x /
    ringRadius(across.x, across.z);
  const medialHeel: number =
    (origin.x - arc.x + arc.width - inset) /
    across.x /
    ringRadius(-across.x, -across.z);
  const posteriorHeel: number =
    (origin.z - plan.heel - inset) /
    forward.z /
    ringRadius(-forward.x, -forward.z);
  const semi: (y: number, at: number, peak: number, heel: number) => number = (
    y: number,
    at: number,
    peak: number,
    heel: number,
  ): number =>
    y >= at
      ? 1 + (peak - 1) * step(y, collar, at)
      : peak + (heel - peak) * step(y, at, arc.rim[1]);
  return {
    radial: (p: IAutoMovieVector3): number => {
      const a: number = along(p, across);
      const b: number = along(p, forward);
      const sa: number =
        a >= 0
          ? semi(p.y, lateral.y, lateralPeak, lateralHeel)
          : semi(p.y, medial.y, medialPeak, medialHeel);
      const sb: number =
        b >= 0
          ? 1 + DEEPEN * step(p.y, collar, plan.ankleHeight)
          : 1 + (posteriorHeel - 1) * step(p.y, collar, arc.rim[0]);
      const qa: number = a / sa;
      const qb: number = b / sb;
      const q: number = Math.hypot(qa, qb);
      if (q === 0) return -ringRadius(0, 1);
      const r: number = ringRadius(
        qa * across.x + qb * forward.x,
        qa * across.z + qb * forward.z,
      );
      // the ring's distance scaled back to the point's own direction
      return Math.hypot(a, b) * (1 - r / q);
    },
    floor,
    collar,
    full,
  };
}
/** Output type of {@link columnAutoMovieHumanFoot}. */
export namespace columnAutoMovieHumanFoot {
  /**
   * The ankle column.
   *
   * @author Samchon
   */
  export interface IOutput {
    /**
     * Signed distance from the column's side, measured along the horizontal ray from its axis, negative inside.
     *
     * @param p Point, local frame, millimetres
     * @returns Millimetres
     */
    radial(p: IAutoMovieVector3): number;

    /** Height of the column's flat end, inside the heel. */
    floor: number;

    /** Height of the pinned collar, below which the column departs from the ring. */
    collar: number;

    /** Height of the higher malleolus landmark. */
    full: number;
  }
}

/** A direction in plan, `x` lateral and `z` forward. */
interface IPlanar {
  x: number;
  z: number;
}

/** Growth of the column's depth in front, over the talus, from the collar down to the lateral malleolus height, as a share of the ring's anterior radius. Conventional, set against renders. */
const DEEPEN: number = 0.15;

/** A C2 step between two heights: 0 at `from`, 1 at `to`, a quintic with zero first and second derivatives at both ends, so a scale leaves the pinned collar and turns at each malleolus without a crease. */
const step: (y: number, from: number, to: number) => number = (
  y: number,
  from: number,
  to: number,
): number => {
  const t: number = Math.min(1, Math.max(0, (from - y) / (from - to)));
  return t * t * t * (10 - 15 * t + 6 * t * t);
};

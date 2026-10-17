import {
  IAutoMovieSweep,
  IAutoMovieSweepFrame,
  IAutoMovieSweepPath,
  IAutoMovieSweepSection,
  frameAutoMovieSweepSpine,
} from "@automovie/engine";
import { quaternionFromAutoMovieBasis } from "@automovie/engine/math/quaternionFromAutoMovieBasis";
import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { measureAutoMovieHumanAnkleCollar } from "../../junction/measureAutoMovieHumanAnkleCollar";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanFootPlan } from "./IAutoMovieHumanFootPlan";
import { solidAutoMovieHumanFoot } from "./solidAutoMovieHumanFoot";

/**
 * Sweep the foot from the ankle ring down the column, round the heel and forward to the toes' roots, in the foot's local frame.
 *
 * The spine drops from the ring's centre down the leg's axis and turns forward through the middle of the foot to the toes' roots, so its sections turn from the ankle's level sections to the forefoot's upright ones: the outside of the turn is the back of the heel, the inside the instep. The turn is a quarter circle wider than the instep is deep, so the section planes fanning round it never cross inside the foot. The ring and its collar take the ring's own limit curve, the closed B-spline of its control points, so the sweep leaves the collar on the surface the subdivision makes there rather than on the control polygon outside it. Every later section is the solid cut by its plane, read by ray from the spine at even angles, so the sweep is one section family from the ring to the toes; the last two planes turn to the shared metatarsophalangeal boundary. Free-toe valleys belong to the branching web curves beyond this boundary, rather than to one radial body section.
 *
 * @param props The foot's plan and source solid in local millimetres, with its shared ankle origin in millimetres and section in metres
 * @returns The sweep in metres, its spine's path, the collar's `u`, the end's frame and the roots' line
 */
export function sweepAutoMovieHumanFoot(props: {
  plan: IAutoMovieHumanFootPlan;
  solid: solidAutoMovieHumanFoot.ISolid;
  ring: {
    origin: IAutoMovieVector3;
    section: IAutoMovieSweepSection.IBSpline;
  };
}): sweepAutoMovieHumanFoot.IOutput {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const {
    plan,
    solid: base,
  }: {
    plan: IAutoMovieHumanFootPlan;
    solid: solidAutoMovieHumanFoot.ISolid;
    ring: {
      origin: IAutoMovieVector3;
      section: IAutoMovieSweepSection.IBSpline;
    };
  } = props;
  const L: number = plan.length;
  const origin: IAutoMovieVector3 = props.ring.origin;
  const root: (toe: IAutoMovieHumanFootPlan.IToe) => IAutoMovieVector3 = (
    toe: IAutoMovieHumanFootPlan.IToe,
  ): IAutoMovieVector3 => ({ ...toe.joint });

  // the toes' roots: the plane through the hallux's and fifth toe's roots, upright
  const hallux: IAutoMovieVector3 = root(plan.toes[0]!);
  const fifth: IAutoMovieVector3 = root(plan.toes[4]!);
  const line: IAutoMovieVector3 = V.normalize(
    V.of(fifth.x - hallux.x, 0, fifth.z - hallux.z),
  );
  const endNormal: IAutoMovieVector3 = V.of(-line.z, 0, line.x);
  const endMiddle: IAutoMovieVector3 = V.of(
    (hallux.x + fifth.x) / 2,
    0,
    (hallux.z + fifth.z) / 2,
  );
  const endCentre: IAutoMovieVector3 = V.of(
    endMiddle.x,
    (base.top(endMiddle.x, endMiddle.z) +
      base.bottom(endMiddle.x, endMiddle.z)) /
      2,
    endMiddle.z,
  );
  const z: number = plan.heel + SPINE.mid * L;
  const middle: number = base.across(z).centre;
  const forefoot: IAutoMovieVector3 = V.of(
    middle,
    (base.top(middle, z) + base.bottom(middle, z)) / 2,
    z,
  );

  // the spine: down the leg's axis, round the heel, through the foot's middle to the roots
  const radius: number = SPINE.radius * L;
  const top: number = forefoot.y + radius;
  const arc: (angle: number) => IAutoMovieVector3 = (
    angle: number,
  ): IAutoMovieVector3 =>
    V.of(
      origin.x + (forefoot.x - origin.x) * (1 - Math.cos(angle)),
      top - radius * Math.sin(angle),
      origin.z + radius * (1 - Math.cos(angle)),
    );
  const spinePoints: IAutoMovieVector3[] = [
    origin,
    ...[0, Math.PI / 6, Math.PI / 3, Math.PI / 2].map(arc),
    forefoot,
    endCentre,
  ];
  const path: IAutoMovieSweepPath = frameAutoMovieSweepSpine({
    points: spinePoints,
    normal: V.of(0, 0, 1),
  });
  const collar: number = measureAutoMovieHumanAnkleCollar(L) / path.length;

  // the sections: the ring's at the ring and its collar, then cuts of the solid at even spine parameters, the last two turned to the roots' plane
  const sectionOf: (
    frame: IAutoMovieSweepFrame,
  ) => IAutoMovieSweepSection.IRadial = (
    frame: IAutoMovieSweepFrame,
  ): IAutoMovieSweepSection.IRadial => ({
    type: "radial",
    radii: Array.from({ length: RAYS }, (_: unknown, k: number): number => {
      const a: number = (2 * Math.PI * k) / RAYS;
      return (
        base.ray(
          frame.origin,
          V.offset(
            V.of(0, 0, 0),
            [frame.x, Math.cos(a)],
            [frame.y, Math.sin(a)],
          ),
        ) / 1000
      );
    }),
  });
  const ringFrame: IAutoMovieSweepFrame = {
    origin,
    x: V.of(0, 0, 1),
    y: V.cross(V.of(0, -1, 0), V.of(0, 0, 1)),
    normal: V.of(0, -1, 0),
  };
  const ringSection: IAutoMovieSweepSection.IBSpline = props.ring.section;
  const ringRotation: IAutoMovieQuaternion = quaternionFromAutoMovieBasis(
    ringFrame.x,
    ringFrame.y,
    ringFrame.normal,
  );
  const endFrame: (
    u: number,
    turn: number,
  ) => { frame: IAutoMovieSweepFrame; rotation: IAutoMovieQuaternion } = (
    u: number,
    turn: number,
  ): { frame: IAutoMovieSweepFrame; rotation: IAutoMovieQuaternion } => {
    const carried: IAutoMovieSweepFrame = path.frame(u);
    const n: IAutoMovieVector3 = V.normalize(
      V.offset(carried.normal, [
        V.offset(endNormal, [carried.normal, -1]),
        turn,
      ]),
    );
    const up: IAutoMovieVector3 = V.normalize(
      V.offset(carried.x, [n, -V.dot(carried.x, n)]),
    );
    const side: IAutoMovieVector3 = V.cross(n, up);
    return {
      frame: { origin: carried.origin, x: up, y: side, normal: n },
      rotation: quaternionFromAutoMovieBasis(up, side, n),
    };
  };
  const ats: number[] = Array.from(
    { length: CUTS },
    (_: unknown, k: number): number =>
      k === CUTS - 1 ? 1 : FIRST_CUT + ((1 - FIRST_CUT) * k) / (CUTS - 1),
  );
  const sweep: IAutoMovieSweep = {
    spine: { points: spinePoints.map(metres), normal: V.of(0, 0, 1) },
    stations: [
      { at: 0, section: ringSection, rotation: ringRotation },
      { at: collar, section: ringSection, rotation: ringRotation },
      ...ats.map((u: number, k: number): IAutoMovieSweep.IStation => {
        const turn: number = Math.max(0, (k - (CUTS - 3)) / 2);
        if (turn === 0) return { at: u, section: sectionOf(path.frame(u)) };
        const e: {
          frame: IAutoMovieSweepFrame;
          rotation: IAutoMovieQuaternion;
        } = endFrame(u, turn);
        return { at: u, section: sectionOf(e.frame), rotation: e.rotation };
      }),
    ],
  };
  return {
    sweep,
    path,
    collar,
    end: endFrame(1, 1).frame,
    root,
    line,
    endMiddle,
    endCentre,
  };
}
/** Output type of {@link sweepAutoMovieHumanFoot}. */
export namespace sweepAutoMovieHumanFoot {
  /**
   * The foot's sweep.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** The sweep, local frame, metres. */
    sweep: IAutoMovieSweep;

    /** Its spine's path, millimetres. */
    path: IAutoMovieSweepPath;

    /** `u` of the collar. */
    collar: number;

    /** Frame of the end section at the toes' roots, millimetres. */
    end: IAutoMovieSweepFrame;

    /**
     * A toe's root on its axis.
     *
     * @param toe The toe
     * @returns Its root, millimetres
     */
    root(toe: IAutoMovieHumanFootPlan.IToe): IAutoMovieVector3;

    /** Unit direction of the roots' line, from the hallux's root toward the fifth toe's. */
    line: IAutoMovieVector3;

    /** Middle of the hallux's and fifth toe's roots on the ground, millimetres. */
    endMiddle: IAutoMovieVector3;

    /** Middle of the end section between the dorsum and the sole over `endMiddle`, millimetres. */
    endCentre: IAutoMovieVector3;
  }
}

/** Rays per section. */
const RAYS: number = 96;

/** Cuts of the solid along the spine after the collar. */
const CUTS: number = 14;

/** `u` of the first cut, where the transition bands are well below the ankle. */
const FIRST_CUT: number = 0.1;

/** The spine: the radius of its turn from the leg's axis into the foot, of foot length, and where along the foot it reaches the foot's middle line. Conventional. */
const SPINE: { readonly radius: 0.27; readonly mid: 0.6 } = {
  radius: 0.27,
  mid: 0.6,
} as const;

const metres: (p: IAutoMovieVector3) => IAutoMovieVector3 = (
  p: IAutoMovieVector3,
): IAutoMovieVector3 => ({
  x: p.x / 1000,
  y: p.y / 1000,
  z: p.z / 1000,
});

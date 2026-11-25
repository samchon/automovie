import { Vector3, bracketedCrossing } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAudit } from "../audit/AutoMovieMotionHumanAudit";
import { HumanSignature } from "../audit/HumanSignature";
import { HumanFoot } from "../posture/HumanFoot";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { jumpGroundPosture } from "./jumpGroundPosture";
import type { jumpLanding } from "./jumpLanding";
import { jumpPath } from "./jumpPath";
import { jumpState } from "./jumpState";

/**
 * Fit a rotating floor landing's absorption to its planted soles.
 *
 * The incoming downward speed can drive the knee and ankle through more flexion
 * than a flat sole allows. Test the authored course and find a shallower
 * supported endpoint when needed. If the incoming speed makes even the shallow
 * course dip too far, test stronger braking at impact with the same incoming
 * velocity, duration and footprint frame.
 *
 * @param body The jumping body used for ground fitting.
 * @param landing The unchanged footprints and nominal world-root endpoints.
 * @param velocity The ballistic world velocity at touchdown, metres per second.
 * @param seconds The absorption phase's duration in seconds.
 * @param demand The current lowered posture at a candidate world root and
 *   seconds since touchdown.
 * @returns The tested absorption endpoint and its initial vertical
 *   acceleration.
 */
export function fitJumpAbsorption(
  body: IAutoMovieMotionHumanBody,
  landing: jumpLanding.ILanding,
  velocity: IAutoMovieVector3,
  seconds: number,
  demand: (
    root: IAutoMovieVector3,
    elapsed: number,
    read: ReturnType<typeof prepareHumanPoseResolution>,
  ) => IAutoMovieMotionHumanPosture,
): fitJumpAbsorption.IPath {
  const limit: number = AutoMovieMotionHumanAudit.LIMITS.jump;
  const { absorbed, stood }: jumpLanding.ILanding = landing;
  const span: number = stood.y - absorbed.y;
  const authored: fitJumpAbsorption.IPath = { root: absorbed, acceleration: 0 };
  if (!(span > 0) || !(seconds > 0))
    return authored;

  const read: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const projection: ReturnType<typeof prepareHumanPostureProjection> =
    prepareHumanPostureProjection(body);
  const legs: ReturnType<typeof jumpState.prepareLegs> =
    jumpState.prepareLegs(body);
  const bones: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    new Set(["leftFoot", "leftToes", "rightFoot", "rightToes"]),
  );
  const targets: Record<AutoMovieHumanSide, IAutoMovieVector3[]> = {
    left: HumanFoot.SOCKETS.map(
      (point): IAutoMovieVector3 =>
        HumanFoot.point(body, "left", point, landing.feet.left),
    ),
    right: HumanFoot.SOCKETS.map(
      (point): IAutoMovieVector3 =>
        HumanFoot.point(body, "right", point, landing.feet.right),
    ),
  };
  const times: number[] = HumanSignature.times(0, seconds).filter(
    (t: number): boolean => t < seconds,
  );
  times.push(seconds);

  /** Maximum sampled sole residual minus the existing metre budget. */
  const excess = (depth: number, acceleration: number): number => {
    const root: IAutoMovieVector3 = { ...absorbed, y: stood.y - depth };
    const path: ReturnType<typeof jumpPath.prepare> = jumpPath.prepare(
      landing.touched,
      velocity,
      root,
      { x: 0, y: 0, z: 0 },
      seconds,
      { x: 0, y: acceleration, z: 0 },
    );
    let miss: number = 0;
    for (const t of times) {
      const posed: jumpState.IState = jumpState(
        body,
        jumpGroundPosture(body, demand(path(t), t, read), "landing", read),
        legs,
        read,
        projection,
      );
      const placed: ReturnType<typeof bones> = bones(posed.pose, read());
      for (const side of ["left", "right"] as const) {
        const sole: ReturnType<typeof HumanFoot.sockets> = HumanFoot.sockets(
          body,
          placed,
          side,
        );
        for (let i: number = 0; i < sole.length; ++i) {
          const point: IAutoMovieVector3 = sole[i]!.point;
          miss = Math.max(
            miss,
            Math.abs(point.y),
            Vector3.distance(point, targets[side][i]!),
          );
        }
      }
    }
    return miss - limit;
  };
  /** At one acceleration, return the deepest verified endpoint in the bracket. */
  const fit = (acceleration: number): fitJumpAbsorption.IPath | undefined => {
    const deep: number = excess(span, acceleration);
    if (deep <= 0) return { root: absorbed, acceleration };
    const shallow: number = excess(0, acceleration);
    if (!(shallow <= 0)) return undefined;

    const depth: number = bracketedCrossing({
      f: (value: number): number => excess(value, acceleration),
      past: (value: number): boolean => !(value <= 0),
      low: 0,
      high: span,
      known: { low: shallow, high: deep },
      tolerance: limit,
    }).low;
    return { root: { ...absorbed, y: stood.y - depth }, acceleration };
  };
  const preferred: fitJumpAbsorption.IPath | undefined = fit(0);
  if (preferred !== undefined || !(velocity.y < 0))
    return preferred ?? authored;

  // A quintic's acceleration weight at mid-absorption is one tenth of
  // its velocity weight times the duration. Early braking offsets two
  // fifths of the incoming vertical motion there with the same onset speed.
  return fit((-4 * velocity.y) / seconds) ?? authored;
}

/** Boundary values for the jump's grounded absorption path. */
export namespace fitJumpAbsorption {
  /** Grounded endpoint in world metres and initial vertical acceleration. */
  export interface IPath {
    /** The world root at the end of absorption, metres. */
    root: IAutoMovieVector3;
    /**
     * Upward acceleration at the start of absorption, metres per second
     * squared.
     */
    acceleration: number;
  }
}

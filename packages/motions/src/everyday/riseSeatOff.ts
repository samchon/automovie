import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPhysics,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { HumanPhysics } from "../law/HumanPhysics";
import { HumanRefusal } from "../law/HumanRefusal";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanBalance } from "./HumanBalance";
import { HumanTrunk } from "./HumanTrunk";
import { seated } from "./seated";
import { seatedCourse } from "./seatedCourse";

/**
 * Select a rise's foot draw, trunk peak and first stable seat-off frame:
 * for each shank angle in order, the peak is raised from `seatedCourse.flexion` in
 * `PEAK.step`s, and each frame of the seat-off window at 24 Hz is probed until
 * the extrapolated centre of mass enters the feet's base.
 *
 * @param props Fixed body/seat/standing geometry, original candidate shank angles,
 *   rising seconds, seated height ratio and native pitch/foot-course builders.
 * @returns Selected ankle points in world metres, peak flexion in degrees and
 *   seat-off seconds from the start of rising.
 * @throws {HumanRefusal} When every original foot/peak/time candidate remains unstable.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed input geometry, candidate order, angle/time/world units, selected numeric outputs and the unchanged refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Retains the original fixed-angle foot draw, same pelvis limit per draw, native inclined socket/root/raw hip lowering and extrapolated whole-body mass margin. Every margin still observes the original three actual posture times and feet's support hull.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One synchronous search owns candidate construction and the same nested angle/peak/frame loops; its native prepared observation and FK/ROM metadata are acquired only at the first actual margin probe, and only selection data return.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The peak starts at `seatedCourse.flexion` and rises by the named steps; every angle, peak and frame in the window is tried in order with a full fit, a draw is computed once per angle, and no candidate is skipped or relaxed. Raw hip lowering borrows FK only and reads the raw authored angles.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fixed-body native extrapolated observer prepares name/support metadata once across Q candidate probes. One synchronous exact FK source and genuine ROM index share checked prerequisites across all original three-pose observations; every changing posture, complete fit, finite difference, mass placement and hull margin remains evaluated, with unmeasured speedup.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only unchanged body/rig/profile, seated socket, candidate schedule and genuine static ROM metadata share; every current candidate's inclination, goal geometry and stability verdict remain independent. No sampled pose or previous margin substitutes for a query.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources This call owns at most one native observer, exact FK getter and ROM projector until return or throw. Only the original selected ankle vectors and two scalar values return; no callback, posture fit, reader, projector or candidate history escapes into the rise plan.
 */
export function riseSeatOff(props: {
  /** Unchanged body of the rise. */
  body: IAutoMovieMotionHumanBody;
  /** Seat socket after edging, world metres. */
  begin: IAutoMovieVector3;
  /** Upright root under that socket, world metres. */
  level: IAutoMovieVector3;
  /** Fixed entry heading, degrees. */
  yaw: number;
  /** Original relaxed authored joint angles. */
  relaxed: IAutoMovieMotionHumanPosture["joints"];
  /** Original ordered, nonempty shank-angle candidates in degrees. */
  angles: readonly number[];
  /** Original rise duration, seconds. */
  rising: number;
  /** Entry socket height divided by popliteal height. */
  ratio: number;
  /** Fixed-yaw native standing leg-goal writer. */
  legged: ReturnType<typeof stand.prepareLegs>;
  /** Actual candidate feet for one original shank angle. */
  drawAt: (angle: number) => Record<"left" | "right", IAutoMovieVector3>;
  /** Seconds from the start of rising at which the trunk reaches its peak flexion. */
  flexed: number;

  /** Original current trunk flexion at a second and peak, degrees. */
  pitchAt: (seconds: number, peak: number) => number;
  /** The physical terms asked (`IAutoMovieMotionHumanPhysics`): absent, the feet are drawn to the first shank angle, the trunk peaks at the seat's own flexion and the seat leaves at `SEAT_OFF` of the rise, with no centre of mass read. */
  physics?: IAutoMovieMotionHumanPhysics;
}): {
  drawn: Record<"left" | "right", IAutoMovieVector3>;
  peak: number;
  off: number;
} {
  // Without the physics option the rise takes the study's own seat-off and
  // the seat's own trunk peak: no extrapolated centre of mass is searched.
  if (!HumanPhysics.balanced(props))
    return {
      drawn: props.drawAt(props.angles[0]!),
      peak: seatedCourse.flexion(props.ratio),
      off: SEAT_OFF * props.rising,
    };
  let resolution: ReturnType<typeof prepareHumanPoseResolution> | undefined;
  let projection: ReturnType<typeof prepareHumanPostureProjection> | undefined;
  let observe: ReturnType<typeof HumanBalance.prepareExtrapolated> | undefined;
  /** One actual candidate, borrowing metadata only at its original observed second. */
  type Candidate = (
    seconds: number,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
  ) => IAutoMovieMotionHumanPosture;
  function seatedAt(
    peak: number,
    feet: Record<"left" | "right", IAutoMovieVector3>,
    limit: number,
  ): Candidate {
    return (
      seconds: number,
      source?: Parameters<typeof prepareHumanPoseResolution>[0],
    ): IAutoMovieMotionHumanPosture => {
      const tilt: ReturnType<typeof HumanTrunk.incline> = HumanTrunk.incline(
        props.relaxed,
        props.pitchAt(seconds, peak),
        limit,
      );
      const root: IAutoMovieVector3 = seated.root(props.body, props.begin, {
        yaw: props.yaw,
        pitch: tilt.pitch,
        roll: 0,
      });
      return resolveHumanPosture.lower(
        props.body,
        {
          root,
          yaw: props.yaw,
          pitch: tilt.pitch,
          roll: 0,
          joints: tilt.joints,
          limbs: props.legged(root, feet),
        },
        undefined,
        source,
      );
    };
  }
  let drawn: Record<"left" | "right", IAutoMovieVector3> | undefined;
  let peak: number = 0;
  let off: number | undefined;
  for (const angle of props.angles) {
    drawn = props.drawAt(angle);
    const limit: number = HumanTrunk.pelvisLimit(
      props.body,
      props.level,
      props.yaw,
      drawn,
    );
    for (
      peak = seatedCourse.flexion(props.ratio);
      peak <= PEAK.most + 1e-9 && off === undefined;
      peak += PEAK.step
    ) {
      const candidate: Candidate = seatedAt(peak, drawn, limit);
      for (
        let t: number = SEAT_OFF * props.rising;
        t <= props.flexed + 1e-9;
        t += PROBE
      ) {
        resolution ??= prepareHumanPoseResolution();
        projection ??= prepareHumanPostureProjection(props.body);
        observe ??= HumanBalance.prepareExtrapolated(props.body);
        if (observe(candidate, t, resolution, projection) >= 0) {
          off = t;
          break;
        }
      }
    }
    if (off !== undefined) break;
  }
  if (off === undefined || drawn === undefined)
    throw new HumanRefusal({
      kind: "base",
      axis: "base",
      value: null,
      reason:
        "the feet stand too far ahead to rise over them; place the ankles nearer the seat",
      fix: "place the ankles nearer the seat before rising",
    });
  peak -= PEAK.step;
  return { drawn, peak, off };
}

/** The raised trunk peaks tried for seat-off: up to `most` degrees in `step`s (provisional, as rise states). */
const PEAK: Readonly<Record<"most" | "step", number>> = { most: 70, step: 5 };

/**
 * The earliest seat-off, as a share of the rise: the end of the flexion phase
 * at 36 % of sit-to-stand in healthy adults (McDonald, Villarejo Mayor and
 * Lennon 2025, Front Bioeng Biotechnol 13:1605524). The search runs from
 * there to the trunk's peak, since peak trunk flexion closely follows
 * seat-off (Schenkman et al. 1990).
 */
const SEAT_OFF: number = 0.36;

/**
 * Seconds between seat-off probes: one film frame at 24 frames per second.
 * The 1e-9 s added to each loop bound only admits a bound that accumulated
 * round-off leaves a hair short.
 */
const PROBE: number = 1 / 24;

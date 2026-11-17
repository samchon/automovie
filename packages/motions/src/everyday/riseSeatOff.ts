import type { IAutoMovieVector3 } from "@automovie/interface";

import type { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanBalance } from "./HumanBalance";
import { HumanTrunk } from "./HumanTrunk";
import { seated } from "./seated";

/**
 * Select the original rising foot draw, trunk peak and first stable seat-off
 * frame. All candidate angles, peak increments and 24 Hz probes retain their
 * original order; only fixed observation prerequisites share this scope.
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
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original first draw call, peak initialization/increment/decrement, all angle/frame bounds and tolerances, 1/24-second sampling, full current fits and refusal text. Raw hip lowering borrows FK only and retains its original use of raw authored angles.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fixed-body native extrapolated observer prepares name/support metadata once across Q candidate probes. One synchronous exact FK source and genuine ROM index share checked prerequisites across all original three-pose observations; every changing posture, complete fit, finite difference, mass placement and hull margin remains evaluated, with unmeasured speedup.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only unchanged body/rig/profile, seated socket, candidate schedule and genuine static ROM metadata share; every current candidate's inclination, goal geometry and stability verdict remain independent. No sampled pose or previous margin substitutes for a query.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources This call owns at most one native observer, exact FK getter and ROM projector until return or throw. Only the original selected ankle vectors and two scalar values return; no callback, posture fit, reader, projector or candidate history escapes into the rise plan.
 */
export function riseSeatOff(props: {
  /** Unchanged body of the rise. */
  body: IHumanBody;
  /** Seat socket after edging, world metres. */
  begin: IAutoMovieVector3;
  /** Upright root under that socket, world metres. */
  level: IAutoMovieVector3;
  /** Fixed entry heading, degrees. */
  yaw: number;
  /** Original relaxed authored joint angles. */
  relaxed: IHumanPosture["joints"];
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
  /** Original current trunk flexion at a second and peak, degrees. */
  pitchAt: (seconds: number, peak: number) => number;
}): {
  drawn: Record<"left" | "right", IAutoMovieVector3>;
  peak: number;
  off: number;
} {
  let resolution: ReturnType<typeof prepareHumanPoseResolution> | undefined;
  let projection: ReturnType<typeof prepareHumanPostureProjection> | undefined;
  let observe: ReturnType<typeof HumanBalance.prepareExtrapolated> | undefined;
  /** One actual candidate, borrowing metadata only at its original observed second. */
  type Candidate = (
    seconds: number,
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
  ) => IHumanPosture;
  function seatedAt(
    peak: number,
    feet: Record<"left" | "right", IAutoMovieVector3>,
    limit: number,
  ): Candidate {
    return (
      seconds: number,
      source?: Parameters<typeof prepareHumanPoseResolution>[0],
    ): IHumanPosture => {
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
  let drawn: Record<"left" | "right", IAutoMovieVector3> = props.drawAt(
    props.angles[0]!,
  );
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
      peak = 35 + 50 * (1 - props.ratio);
      peak <= 70 + 1e-9 && off === undefined;
      peak += 5
    ) {
      const candidate: Candidate = seatedAt(peak, drawn, limit);
      for (
        let t: number = 0.4 * props.rising;
        t <= 0.45 * props.rising + 1e-9;
        t += 1 / 24
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
  if (off === undefined)
    throw new HumanRefusal({
      kind: "base",
      axis: "base",
      value: null,
      reason:
        "the feet stand too far ahead to rise over them; place the ankles nearer the seat",
      fix: "place the ankles nearer the seat before rising",
    });
  peak -= 5;
  return { drawn, peak, off };
}

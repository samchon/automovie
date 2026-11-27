import { Vector3, AutoMovieEngineMotionSampling, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanArmAngles, IAutoMovieMotionHumanArmTarget, IAutoMovieMotionHumanArmTrajectory, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanBrace, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanPosture, IAutoMoviePose, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { HumanSupportFrame } from "../../carrier/HumanSupportFrame";
import { AutoMovieMotionHumanArm } from "../../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../../compose/AutoMovieMotionHumanBend";
import { HumanPhysics } from "../../law/HumanPhysics";
import { HumanHand } from "../../posture/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import type { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import type { braceBody } from "./braceBody";
import { gestureHands } from "./gestureHands";

/**
 * A brace's arms and its plan (`brace.plan`): each palm's goal ahead of the
 * sternum along the force, out to the shoulder, facing the force or turned up
 * to receive a body, the arms rising from the entry's to hold the palms there
 * as one trajectory planned clear of the body (`gestureHands.planned`), the
 * feet's plants, and the plan writing the arms on the body posture. Read from
 * the plan's context, body, force line, stepping foot, timing and body
 * posture.
 *
 * @param scope What the plan's arms are planned from.
 * @returns The planned arms and the plan.
 */
export function braceArms(scope: braceArms.IScope): braceArms.IArms {
  const {
    context,
    body,
    m,
    p,
    duration,
    toward,
    left,
    back,
    swing,
    events,
    window,
    bodyAt,
    SET,
    AHEAD,
    SPREAD,
    RECEIVE,
    ELBOW_OUT,
  }: braceArms.IScope = scope;
  // Each palm's goal at a second: ahead of the sternum along the force by
  // the reach share of the arm, out to the shoulder, at the sternum's
  // height (lower to receive a body), so the goal stands clear of the
  // chest's surface however far the trunk leans.
  const catching: boolean = p.kind === "catchBody";
  const reach: number = (m.upperArm + m.forearm) * AHEAD;
  const rotations: Record<AutoMovieHumanSide, IAutoMovieQuaternion> = {
    left: HumanHand.rotation(
      "left",
      catching
        ? { fingers: toward, palm: { x: 0, y: 1, z: 0 } }
        : { fingers: { x: 0, y: 1, z: 0 }, palm: toward },
    ),
    right: HumanHand.rotation(
      "right",
      catching
        ? { fingers: toward, palm: { x: 0, y: 1, z: 0 } }
        : { fingers: { x: 0, y: 1, z: 0 }, palm: toward },
    ),
  };
  const region: IAutoMovieMotionHumanBody["surfaces"]["regions"]["sternum"] =
    body.surfaces.regions.sternum;
  const sternumBones: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>([region.bone]);
  const readSternum: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    sternumBones,
  );
  const leftOffsets: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: Vector3.scale(left, m.shoulderHalfWidth * SPREAD),
    right: Vector3.scale(left, -1 * m.shoulderHalfWidth * SPREAD),
  };
  const aheadOffset: IAutoMovieVector3 = Vector3.add(
    Vector3.scale(toward, reach),
    {
      x: 0,
      y: catching ? -RECEIVE * m.stature : 0,
      z: 0,
    },
  );
  const requests: (
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ) => IAutoMovieMotionHumanArmTarget.ISided[] = (
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanArmTarget.ISided[] => {
    // Canonical demand selection keeps admission intact and omits limb
    // fits only when it proves they cannot move the sternum's ancestry.
    const readResolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const pose: IAutoMoviePose = resolveHumanPosture.seeded(
      body,
      posture,
      undefined,
      {},
      readResolution,
      sternumBones,
      projection,
    ).pose;
    const bones: ReturnType<typeof poseBones> = readSternum(
      pose,
      readResolution(),
    );
    const sternum: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
      region,
      bones.get(region.bone)!,
    ).point;
    return (["left", "right"] as const).map(
      (side: AutoMovieHumanSide): IAutoMovieMotionHumanArmTarget.ISided => ({
        side,
        surface: "palm",
        shape: "flat",
        point: Vector3.add(
          Vector3.add(sternum, leftOffsets[side]),
          aheadOffset,
        ),
        rotation: rotations[side],
        bend: AutoMovieMotionHumanBend.hang(body, posture, side, ELBOW_OUT),
      }),
    );
  };
  const entryArms: Record<
    AutoMovieHumanSide,
    IAutoMovieMotionHumanArmAngles.IAngles
  > = {
    left: AutoMovieMotionHumanArm.angles(context.entry.pose, "left"),
    right: AutoMovieMotionHumanArm.angles(context.entry.pose, "right"),
  };
  const envelope: (at: number) => number = (at: number): number =>
    AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, Math.max(0, at) / SET));
  const arms: Map<
    AutoMovieHumanSide,
    IAutoMovieMotionHumanArmTrajectory.Played
  > = gestureHands.planned(
    body,
    { start: 0, ready: SET, relax: duration, end: duration },
    ["left", "right"],
    entryArms,
    entryArms,
    (
      at: number,
      _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): gestureHands.IPrior => {
      const posture: IAutoMovieMotionHumanPosture = bodyAt(at, resolution);
      return {
        posture,
        requests: requests(posture, resolution, projection),
        envelope: envelope(at),
      };
    },
    envelope,
  );

  const contacts: IAutoMovieMotionHumanContactWindow[] = [
    {
      part: back === "left" ? "rightFoot" : "leftFoot",
      kind: "plant",
      from: 0,
      to: 1,
      support: HumanSupportFrame.contact(
        context,
        back === "left" ? "rightFoot" : "leftFoot",
      ),
    },
    {
      part: back === "left" ? "leftFoot" : "rightFoot",
      kind: "plant",
      from: 0,
      to: swing[0] / duration,
      support: HumanSupportFrame.contact(
        context,
        back === "left" ? "leftFoot" : "rightFoot",
      ),
    },
    {
      part: back === "left" ? "leftFoot" : "rightFoot",
      kind: "plant",
      from: swing[1] / duration,
      to: 1,
      support: HumanSupportFrame.contact(
        context,
        back === "left" ? "leftFoot" : "rightFoot",
      ),
    },
  ];
  const planned: IAutoMovieMotionHumanActionPlan = {
    duration,
    events,
    ...HumanPhysics.declared(context.params, window),
    contacts,
    posture: (
      seconds: number,
      _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    ): IAutoMovieMotionHumanPosture =>
      gestureHands.written(bodyAt(seconds, resolution), arms, seconds),
  };

  return { arms, planned };
}

/** What a brace's arms read and what they are. */
export namespace braceArms {
  /** What a brace plan plans its arms from. */
  export interface IScope {
    /** The action's context. */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBrace.IParams>;

    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The body's measure. */
    m: IAutoMovieMotionHumanBody["measure"];

    /** The action's parameters. */
    p: IAutoMovieMotionHumanBrace.IParams;

    /** The brace's seconds. */
    duration: number;

    /** The force's line toward its source, on the floor. */
    toward: IAutoMovieVector3;

    /** The body's left, on the floor. */
    left: IAutoMovieVector3;

    /** The foot that steps back. */
    back: AutoMovieHumanSide;

    /** When the stepping foot leaves and lands, seconds. */
    swing: readonly [number, number];

    /** The plan's events. */
    events: IAutoMovieMotionHumanActionPlan["events"];

    /** The physical window. */
    window: HumanPhysics.Window;

    /** The posture without its arms (`braceBody`). */
    bodyAt: braceBody.BodyAt;

    /** The lead time to the set posture, seconds (`brace.SET`). */
    SET: number;

    /** How far ahead of the sternum the palms come (`brace.AHEAD`). */
    AHEAD: number;

    /** How far out from the sternum each palm stands (`brace.SPREAD`). */
    SPREAD: number;

    /** How far below the sternum the palms receive a body (`brace.RECEIVE`). */
    RECEIVE: number;

    /** The elbows' outward hint (`brace.ELBOW_OUT`). */
    ELBOW_OUT: number;
  }

  /** The planned arms and the plan. */
  export interface IArms {
    /** Each arm's planned trajectory. */
    arms: Map<AutoMovieHumanSide, IAutoMovieMotionHumanArmTrajectory.Played>;

    /** The plan. */
    planned: IAutoMovieMotionHumanActionPlan;
  }
}

import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingAim } from "./StrikingAim";
import { StrikingBody } from "./StrikingBody";
import { StrikingQuality } from "./StrikingQuality";
import { StrikingReach } from "./StrikingReach";
import { StrikingRoom } from "./StrikingRoom";
import { StrikingSkill } from "./StrikingSkill";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";
import { StrikingTwist } from "./StrikingTwist";
import type { punch } from "./punch";
import { punchFootwork } from "./punchFootwork";
import type { punchGeometry } from "./punchGeometry";

/**
 * A punch at its contact: the line to the target, the trunk's turn, the
 * fist's rotation, the tracked aim, the step-in and the arm's solution.
 *
 * Techniques (IBA coaching manual pp. 42 to 45 and the kickboxing research
 * of #3201): `straight` lands nearly extended along the line, palm down;
 * `hook` lands with the elbow near a right angle, arriving across the line,
 * palm down; `uppercut` rises from below, palm toward the puncher. A body
 * punch lowers the shoulder through the knees so the fist meets a low target
 * from about its own level. When the arm's band falls short, the lead foot
 * steps in by up to one stance length, never past the room in front of the
 * arms ({@link StrikingRoom}) and never toward a target that no place on the
 * line brings within the band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the techniques, the body shot's dip and the step-in rule with their source, with provisional values marked.
 * @evidence contracts/development/design.md#principled-representation One solution in world metres and degrees, solved once from the launch's aim and read by the punch's footwork and stroke.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the two contact constants, the solution and its solver, which the punch's geometry reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the tracker, reach solution and resolved bone types; every length comes from the punching body's measure.
 */
export namespace punchContact {
  /** Elbow flexion band at contact by technique, degrees (IBA drawings read; hook and uppercut near a right angle). */
  export const FLEXION: Readonly<
    Record<punch.IParams["technique"], readonly [number, number]>
  > = {
    straight: [5, 25],
    hook: [70, 100],
    uppercut: [60, 100],
  };

  /**
   * Trunk turn at contact by technique and hand, degrees toward bringing the
   * rear shoulder forward (negative turns the lead shoulder through, as the
   * lead hook does). Provisional readings of the coached rotations: the rear
   * straight squares the hips and shoulders past the line (twice the 30 degree
   * stance turn), the jab barely turns, the lead hook turns the lead shoulder
   * through by more than the stance turn. Skill scales the turn's share
   * ({@link StrikingSkill.amplitude}).
   */
  export const TURN: Readonly<
    Record<
      punch.IParams["technique"],
      Readonly<Record<"lead" | "rear", number>>
    >
  > = {
    straight: { lead: 8, rear: 60 },
    hook: { lead: -40, rear: 50 },
    uppercut: { lead: -20, rear: 40 },
  };

  /**
   * A punch solved at its contact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation World points and unit directions in metres, angles in degrees, the tracker and the arm's solution as their owners' types.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the punch's footwork, stroke and record read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the tracker, reach solution and resolved bone types.
   */
  export interface IContact {
    /** The point aimed at when the punch is launched. */
    first: IAutoMovieVector3;

    /** The horizontal unit line to the target. */
    line: IAutoMovieVector3;

    /** The trunk turn at contact, degrees. */
    turn: number;

    /** How far the root lowers at contact, metres. */
    dip: number;

    /** The fist's unit travel direction at contact. */
    direction: IAutoMovieVector3;

    /** The hand's rotation at contact. */
    rotation: IAutoMovieQuaternion;

    /** The fist socket's offset from the wrist at contact. */
    socket: IAutoMovieVector3;

    /** The seeded miss added to the aim. */
    offset: IAutoMovieVector3;

    /** The online tracker of the target. */
    tracker: StrikingAim.ITracker;

    /** How far the tracker's goal at the contact lies from its launch plan, world metres: what its corrections add over the delivery. */
    drift: IAutoMovieVector3;

    /** The bones of the displayed entry pose. */
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /** The lead foot's step along the line, metres. */
    advance: number;

    /** The punching shoulder at contact. */
    shoulder: IAutoMovieVector3;

    /** The direction the elbow bends toward. */
    bend: IAutoMovieVector3;

    /** The arm's solution at contact. */
    solved: StrikingReach.ISolution;
  }

  /**
   * Solve a punch at its contact.
   *
   * @param context The action's context.
   * @param timing The punch's timing.
   * @param tangent The varied point within a person's region, when the punch varies.
   * @returns The contact's solution.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States its inputs and result; the namespace states the method.
   * @evidence contracts/development/implementation.md#principled-implementation The wrist goal is the tracked fist point less the hand-rotated socket, the step-in closes the line to the band's mid reach, and the two-segment reach solves the arm within the technique's flexion band.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The aim, the turned and lowered shoulder, the fist, the tracking, then the step-in and the arm.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A wrist no place on the line brings within the band is not stepped toward; a feint does not step.
   * @evidence contracts/development/implementation.md#efficient-algorithms One pose resolution and constant work beside the tracker's samples.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per built geometry, which the plan keeps.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the entry pose's bones and the tracker, released with the geometry.
   */
  export function solve(
    context: IHumanActionContext<punch.IParams>,
    timing: punchGeometry.ITiming,
    tangent: resolveAutoMovieHumanoidSurfaces.ITangent | undefined,
  ): IContact {
    const p: punch.IParams = context.params;
    const { side, lead, which, delivery } = timing;
    const body = context.body;
    const m = body.measure;
    const t0: number = context.start;
    const entry: IHumanPosture = context.entry.posture;
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const fist: "fistLeft" | "fistRight" =
      side === "left" ? "fistLeft" : "fistRight";
    const at: AutoMovieMotionTarget = p.at;
    const aim = (seconds: number): IAutoMovieVector3 => {
      if (tangent !== undefined && at.kind === "person") {
        const other: IHumanActionContext.IPerformer = context.performer(
          at.subject,
        );
        return StrikingBody.region(
          other.body,
          other.bones(seconds),
          at.region,
          tangent,
        ).point;
      }
      return StrikingTarget.aim(
        context,
        at,
        seconds,
        (): number =>
          0.9 * (m.upperArm + m.forearm) + 0.5 * m.shoulderHalfWidth,
      );
    };

    // The line to the target at the launch and the trunk turn it calls for.
    const first: IAutoMovieVector3 = aim(t0 - StrikingTarget.LOOK);
    const line: IAutoMovieVector3 = StrikingTarget.line(
      entry.root,
      first,
      entry.yaw,
    );
    const turn: number =
      (lead === "left" ? 1 : -1) *
      TURN[p.technique][which] *
      StrikingSkill.amplitude(context.skill);
    const outward: IAutoMovieVector3 = Vector3.scale(
      Vector3.cross(up, line),
      side === "left" ? 1 : -1,
    );

    // The shoulder at contact: the entry turned, lowered for a body shot so
    // the fist meets a low target from about its own level.
    const shoulder0: IAutoMovieVector3 = StrikingBody.trunk(body, {
      ...entry,
      yaw: entry.yaw + 0.4 * turn,
      joints: {
        ...entry.joints,
        ...StrikingTwist.trunk(entry.joints, 0.3 * turn),
      },
    }).get(`${side}UpperArm` as AutoMovieHumanoidBone)!.worldPosition;
    const dip: number = Math.min(
      0.15 * m.hipHeight,
      Math.max(
        0,
        0.5 * (shoulder0.y - first.y - 0.25 * (m.upperArm + m.forearm)),
      ),
    );
    const lowered: IAutoMovieVector3 = { ...shoulder0, y: shoulder0.y - dip };

    // The fist's rotation and its travel at contact by technique.
    const straight: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(first, lowered),
    );
    const direction: IAutoMovieVector3 =
      p.technique === "straight"
        ? straight
        : p.technique === "hook"
          ? Vector3.normalize(
              Vector3.add(
                Vector3.scale(outward, -0.8),
                Vector3.scale(line, 0.6),
              ),
            )
          : Vector3.normalize(
              Vector3.add(Vector3.scale(up, 0.8), Vector3.scale(line, 0.6)),
            );
    const rotation: IAutoMovieQuaternion =
      p.technique === "uppercut"
        ? StrikingBody.fist(body, side, direction, Vector3.scale(line, -1))
        : StrikingBody.fist(body, side, straight, Vector3.scale(up, -1));
    const socket: IAutoMovieVector3 = StrikingBody.socket(body, fist, rotation);

    // Tracking with the declared accuracy and the seeded scatter.
    const offset: IAutoMovieVector3 = StrikingQuality.offset({
      skill: context.skill,
      random: context.random("scatter"),
      ...(p.accuracy === undefined ? {} : { accuracy: p.accuracy }),
      direction,
      radius: StrikingQuality.fist(m.hand),
      distance: Vector3.length(Vector3.subtract(first, lowered)),
      seconds: delivery,
    });
    const tracker: StrikingAim.ITracker = StrikingAim.track(
      aim,
      {
        launch: t0 - StrikingTarget.LOOK,
        impact: t0 + delivery,
        latency: StrikingSkill.CORRECTION_LATENCY,
        step: 1 / 24,
        shortest: 0.04,
      },
      offset,
    );

    // Reach: the step along the line that brings the wrist the fist needs
    // within the arm's comfortable reach, then the arm's goals at contact.
    // Both are planned against where the fist lands, the tracker's goal at
    // the contact, not its launch plan: the launch extrapolates the target's
    // motion over the whole delivery, and the corrections land the fist on
    // the target itself. Planned against the launch, a jab from a guard
    // facing a settling guard planned 15 degrees at the elbow and landed
    // with 37 to 55, the face 5 to 6 cm nearer than planned.
    const band: readonly [number, number] = FLEXION[p.technique];
    const landing: IAutoMovieVector3 = tracker.goal(t0 + delivery);
    const wristAt: IAutoMovieVector3 = Vector3.subtract(landing, socket);
    const comfortable: number = StrikingReach.reach(
      m.upperArm,
      m.forearm,
      (band[0] + band[1]) / 2,
    );
    const relative: IAutoMovieVector3 = Vector3.subtract(wristAt, lowered);
    const along: number = Vector3.dot(relative, line);
    const across: number = Math.sqrt(
      Math.max(0, Vector3.dot(relative, relative) - along * along),
    );
    const needed: number = Math.sqrt(
      Math.max(0, comfortable * comfortable - across * across),
    );

    // By the contact the root has carried the shoulder only a share of the
    // step, as the rear foot is still dragging ({@link punchFootwork}).
    const carried: number = punchFootwork.carried(timing);

    // The arms at the launch, read from the displayed entry pose.
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
      resolvePose(
        context.entry.pose,
        body.skeleton,
        HUMANOID_JOINT_AXES,
        HUMANOID_REST_FRAME,
      ).map(
        (
          r: IAutoMovieResolvedBone,
        ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r],
      ),
    );

    // The punch returns to the guard where the step ends, so the step never
    // closes past the room in front of the arms ({@link StrikingRoom}). A
    // target nearer than the band's reach is backed away from by the same
    // step along the line, so the arm still lands within its band. A wrist
    // off the line by more than the band's longest reach (a target above the
    // arm) is out of reach from every place on the line, so it is not
    // stepped toward: the nearest place is under it, the other's own.
    const longest: number = StrikingReach.reach(m.upperArm, m.forearm, band[0]);
    const advance: number =
      p.feint === undefined && across <= longest
        ? Math.min(
            StrikingReach.advance(
              along,
              needed,
              carried * StrikingStance.length(body),
            ) / carried,
            StrikingRoom.ahead(context, at, bones, line, t0),
          )
        : 0;
    const shoulder: IAutoMovieVector3 = Vector3.add(
      lowered,
      Vector3.scale(line, carried * advance),
    );
    const bend: IAutoMovieVector3 =
      p.technique === "hook"
        ? Vector3.add(outward, Vector3.scale(up, 0.1))
        : Vector3.add(Vector3.scale(up, -1), Vector3.scale(outward, 0.3));
    const solved: StrikingReach.ISolution = StrikingReach.chain({
      root: shoulder,
      point: wristAt,
      upper: m.upperArm,
      along: m.forearm,
      lower: m.forearm,
      bend,
      flexion: band,
      slide: false,
    });

    return {
      first,
      line,
      turn,
      dip,
      direction,
      rotation,
      socket,
      offset,
      tracker,
      drift: Vector3.subtract(landing, tracker.planned),
      bones,
      advance,
      shoulder,
      bend,
      solved,
    };
  }
}

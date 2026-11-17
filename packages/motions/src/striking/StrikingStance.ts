import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingStance,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { StrikingBody } from "./StrikingBody";
import { StrikingGuard } from "./StrikingGuard";
import { StrikingGuardBones } from "./StrikingGuardBones";
import { StrikingLegGoals } from "./StrikingLegGoals";
import { StrikingReach } from "./StrikingReach";

/**
 * The fighting stance uses separate tracks, soft knees, a leading shoulder and glove goals measured from the performer's own head.
 *
 * IBA coaching manual pp. 34 to 39 and the kickboxing/Muay Thai guides in
 * #3201 give these relations; the numbers are named readings:
 *
 * - stance length along the line 1.2 shoulder widths (guides: 1.0 to 1.3);
 * - feet on their own hip tracks, spaced by the hip joints;
 * - 30 degree body turn with lead shoulder forward, lead toe 15 degrees
 *   toward that heading and rear toe 45 degrees out (IBA p.34 readings);
 * - a sunk root flexes both knees 32 degrees, within the 25 to 45 degree band;
 * - both gloves at ear height the same short distance ahead of their jaw, the
 *   rear one outside its ear and the lead one before its own shoulder, chin
 *   tucked and eyes on the opponent (IABA, A Beginner's Guide: "tuck your
 *   chin down and look forward"; the boxing and MMA guard as coached: the
 *   rear hand "as if holding a phone to your ear and then pushed forward just
 *   in front of your face", the front hand "at the same height"; the Muay
 *   Thai guard: "arms projected out further", "nearly vertical forearms").
 *   The resting arms leave the ribs to be defended by an action: a body kick
 *   is checked with the raised shin and the elbow brought down to the knee.
 *
 * Orthodox leads left and southpaw right; distances read the body's measure.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each stance relation with its coaching source and which numbers are readings or provisional.
 * @evidence contracts/development/design.md#principled-representation The stance as a lead side and a line heading in degrees; feet, root sink and limb goals in world metres measured on the body.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The named constants, the stance type and the queries the guard, footwork, strikes and reactions read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the foot placement, frame and posture-goal types; no stature is special-cased.
 */
export namespace StrikingStance {
  /** Stance length along the line in shoulder widths (coaching 1.0 to 1.3). */
  export const LENGTH_SHARE: number = 1.2;

  /** Body turn from the line, degrees, lead shoulder forward (IBA p.34 reading). */
  export const TURN: number = 30;

  /** Stance knee flexion, degrees (translated range 25 to 45). */
  export const KNEE_FLEXION: number = 32;

  /** Lead foot heading off the line toward the body's turn, degrees (provisional reading of IBA p.34). */
  export const LEAD_TOE: number = 15;

  /** Rear foot heading off the line, degrees (provisional reading of IBA p.34). */
  export const REAR_TOE: number = 45;

  /**
   * The rear side of a stance.
   *
   * @param stance The stance.
   * @returns The rear side.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result.
   * @evidence contracts/development/implementation.md#principled-implementation The side opposite the lead.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function rear(stance: Pick<IAutoMovieMotionHumanStrikingStance.IStance, "lead">): "left" | "right" {
    return stance.lead === "left" ? "right" : "left";
  }

  /**
   * The body's heading in a stance: turned from the line so the lead
   * shoulder comes forward (a turn to the right for an orthodox stance).
   *
   * @param stance The stance.
   * @returns Degrees about +Y.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the turn's direction for each lead and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation The line turned by the stance turn toward the rear side.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function heading(stance: IAutoMovieMotionHumanStrikingStance.IStance): number {
    return stance.line + (stance.lead === "left" ? -TURN : TURN);
  }

  /**
   * Stance length along the line, metres.
   *
   * @param body The body.
   * @returns Metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit; the constant states the share and its range.
   * @evidence contracts/development/implementation.md#principled-implementation The coached share of the body's shoulder width.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One product.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function length(body: IAutoMovieMotionHumanBody): number {
    return LENGTH_SHARE * 2 * body.measure.shoulderHalfWidth;
  }

  /**
   * The feet of a stance about its centre on the floor.
   *
   * @param body The body.
   * @param stance The stance.
   * @param centre The stance centre on the floor, world metres.
   * @returns Each foot's placement, flat on the floor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame and that the feet are flat.
   * @evidence contracts/development/implementation.md#principled-implementation Each ankle on its hip's track, half a stance length ahead or behind along the line, at ankle height, the toes turned by the coached lead and rear angles.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One stance frame and one placement per foot.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None; the toe angles are named provisional readings.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function feet(
    body: IAutoMovieMotionHumanBody,
    stance: IAutoMovieMotionHumanStrikingStance.IStance,
    centre: IAutoMovieVector3,
  ): Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement> {
    const frame: IAutoMovieMotionHumanFrame = {
      origin: { x: centre.x, y: 0, z: centre.z },
      yaw: stance.line,
    };
    const half: number = length(body) / 2;
    const out = {} as Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement>;
    for (const side of ["left", "right"] as const) {
      const lead: boolean = side === stance.lead;
      const x: number = (side === "left" ? 1 : -1) * body.measure.hipHalfWidth;
      const ankle: IAutoMovieVector3 = HumanFrame.point(frame, {
        x,
        y: body.measure.ankleHeight,
        z: lead ? half : -half,
      });
      const outward: number = side === "left" ? 1 : -1;
      const toe: number =
        stance.line +
        (lead
          ? stance.lead === "left"
            ? -LEAD_TOE
            : LEAD_TOE
          : outward * REAR_TOE);
      out[side] = { ankle, rotation: HumanFoot.rotation(toe, 0) };
    }
    return out;
  }

  /**
   * The root height that flexes both knees at least {@link KNEE_FLEXION}
   * over given feet: each leg's hip-to-ankle distance at that flexion (law
   * of cosines on the thigh and shank), its vertical part over the feet's
   * horizontal offset, and the lower of the two legs.
   *
   * @param body The body.
   * @param root The root's floor position, world metres (its height ignored).
   * @param yaw The body heading, degrees.
   * @param ankles The ankle points, world metres.
   * @param flexion The knee flexion, degrees.
   * @returns The root's height offset, metres (negative: sunk).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the derivation, the ignored root height and the sign.
   * @evidence contracts/development/implementation.md#principled-implementation Each leg's hip-to-ankle span at the flexion by the law of cosines, its vertical part over the horizontal offset from the rest hip, and the lower of the two legs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One span and one pass over the legs.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A foot farther than the span gives a zero vertical part rather than a complex root; the offset never raises the root above zero.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function sink(
    body: IAutoMovieMotionHumanBody,
    root: IAutoMovieVector3,
    yaw: number,
    ankles: Record<"left" | "right", IAutoMovieVector3>,
    flexion: number = KNEE_FLEXION,
  ): number {
    const span: number = StrikingReach.reach(
      body.measure.thigh,
      body.measure.shank,
      flexion,
    );
    let lowest: number = 0;
    for (const side of ["left", "right"] as const) {
      const hip: IAutoMovieVector3 = HumanFrame.point(
        { origin: { ...root, y: 0 }, yaw },
        body.rest.get(`${side}UpperLeg`)!,
      );
      const dx: number = hip.x - ankles[side].x;
      const dz: number = hip.z - ankles[side].z;
      const vertical: number = Math.sqrt(
        Math.max(0, span * span - dx * dx - dz * dz),
      );
      lowest = Math.min(lowest, ankles[side].y + vertical - hip.y);
    }
    return lowest;
  }

  /**
   * The guard's glove goals for a posture: both fists at ear height the same
   * short distance ahead of their jaw, the rear one outside its ear and the
   * lead one before its own shoulder, both vertical fists (knuckles up and forward, palms in),
   * elbows bending down under them. Placed on
   * the posture's own head, so the guard follows every root, turn and lean.
   *
   * @param body The body.
   * @param posture The posture whose trunk carries the head.
   * @param stance The stance.
   * @param drop How far each glove sags below its guard, metres.
   * @param posed The same body's trunk bones on this exact posture, borrowed within the current synchronous evaluation.
   * @param resolution Optional exact FK reader borrowed from the same synchronous person evaluation.
   * @returns The two arm goals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each glove's place, the fists' orientation, the elbows and that the guard follows the posture's head.
   * @evidence contracts/development/implementation.md#principled-implementation The gloves placed from the posture's own chin, jaw and face regions in forearm lengths and radii, the elbows bent toward a point below and ahead of each shoulder, each turned into a knuckle goal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One trunk resolution, then one goal per side.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The offsets are measured on the body; the comment states why the gloves sit where the elbow stays in range.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trunk resolution when not supplied by the caller, then constant rigid-frame work for two goals.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A supplied trunk map is borrowed only for the exact same body/posture in one synchronous evaluation; no result or map is retained.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function guard(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    stance: Pick<IAutoMovieMotionHumanStrikingStance.IStance, "lead">,
    drop: Partial<Record<"left" | "right", number>> = {},
    posed?: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): Pick<IAutoMovieMotionHumanPosture["limbs"], "leftArm" | "rightArm"> {
    return StrikingGuard(body, posture, stance, drop, posed, resolution);
  }

  /**
   * Prepare the fixed guard's actual head/shoulder demand for an action.
   * Each posture still computes both original glove goals from its own trunk.
   *
   * @param body The unchanged canonical body.
   * @param stance The captured leading-side reader inputs.
   * @param drop The captured per-side glove sag inputs, metres; empty by default.
   * @returns The guard at an actual posture and optional operation-local FK source.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines body-owned fixed FK demand, captured guard inputs, actual changing posture and optional synchronous source.
   * @evidence contracts/development/implementation.md#principled-implementation The canonical guard metadata supplies every actual chin/face/jaw/shoulder output to prepareTrunk once; each query retains the original seeded admission/digit path and StrikingGuard's coached geometry.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One fixed-demand trunk producer feeds the same guard owner used by the one-shot guard entry; no second glove formula or physical fit exists.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both glove goals, shoulder withdrawal, canonical wrist offsets, authored joint admission and digit solves remain. Each query uses its actual posture; no pose, goal, time or contact outcome is retained.
   * @evidence contracts/development/implementation.md#efficient-algorithms Head/shoulder name sorting and reachable-demand preparation run once per action. Each actual guard still pays original admission/digit work, required FK ancestry and two side computations; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the unchanged body's canonical guard-name metadata is prepared. Captured stance/drop feed each actual glove calculation, while optional same-body FK/ROM suppliers share only exact dependencies and current unchanged-table metadata inside that synchronous evaluation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The action owns fixed body/demand and guard inputs until release. Each query owns fresh frames/goals and optional exact FK/genuine unchanged-table ROM loans only until return or throw; the fixed-demand producer retains no reader, projector, posture or time history.
   */
  export function prepareGuard(
    body: IAutoMovieMotionHumanBody,
    stance: Pick<IAutoMovieMotionHumanStrikingStance.IStance, "lead">,
    drop: Partial<Record<"left" | "right", number>> = {},
  ): (posture: IAutoMovieMotionHumanPosture, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: ReturnType<typeof prepareHumanPostureProjection>) => Pick<IAutoMovieMotionHumanPosture["limbs"], "leftArm" | "rightArm"> {
    const trunk: ReturnType<typeof StrikingBody.prepareTrunk> = StrikingBody.prepareTrunk(body, StrikingGuardBones(body));
    return (posture: IAutoMovieMotionHumanPosture, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: ReturnType<typeof prepareHumanPostureProjection>): Pick<IAutoMovieMotionHumanPosture["limbs"], "leftArm" | "rightArm"> =>
      StrikingGuard(body, posture, stance, drop, trunk(posture, resolution, projection));
  }

  /**
   * An arm goal that puts the fist's knuckles on a point with the elbow
   * bending toward a hint, the fist continuing the forearm: no wrist
   * rotation is imposed, so the limb fit keeps the elbow on its hint and the
   * hand follows the forearm, and the wrist lies the fist socket's distance
   * back along the line from the hint to the point.
   *
   * @param body The body.
   * @param side The arm.
   * @param fist Where the knuckles go, world metres.
   * @param elbow Where the elbow bends toward, world metres.
   * @returns The arm goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States why no wrist rotation is set and where the wrist lies.
   * @evidence contracts/development/implementation.md#principled-implementation The wrist one fist-socket distance back from the knuckles along the hint-to-fist line, the hint passed through as the bend.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One direction and one offset.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function glove(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    fist: IAutoMovieVector3,
    elbow: IAutoMovieVector3,
  ): IAutoMovieHumanLimbGoal {
    const along: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(fist, elbow),
    );
    const reach: number = Vector3.length(
      body.surfaces.sockets[side === "left" ? "fistLeft" : "fistRight"].point,
    );
    return {
      point: Vector3.subtract(fist, Vector3.scale(along, reach)),
      bend: elbow,
    };
  }

  /**
   * Planted leg goals on placed feet: the knee's bend hint lies up the leg
   * from the ankle and out along the foot's own three-dimensional forward
   * (its heading and its pitch, so a heel raised on a ball pivot tips the
   * hint with it), which under the engine's hinged knee fit decides the knee's
   * side; the foot's rotation itself goes through as the effector rotation,
   * which the fit carries with the hip's swivel. A planted foot's contact is
   * the ball of the foot, the sole point the stance's pivots turn about and
   * the support audits read.
   *
   * @param body The body.
   * @param feet The feet.
   * @param planted Which feet bear on the floor.
   * @returns The leg goals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the hint's construction and why, and that the foot's rotation passes through.
   * @evidence contracts/development/implementation.md#principled-implementation The ankle goal at each foot with a knee hint one shank up and half a shank along the foot's forward, which picks the hinged knee's side in the engine's fit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One goal per side.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function legs(
    body: IAutoMovieMotionHumanBody,
    feet: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement>,
    planted: Record<"left" | "right", boolean> = { left: true, right: true },
  ): Pick<IAutoMovieMotionHumanPosture["limbs"], "leftLeg" | "rightLeg"> {
    return StrikingLegGoals.read(body, feet, planted);
  }

  /**
   * Prepare authored leg goals for a plan's unchanged feet and planted selection.
   *
   * @param body The unchanged canonical body.
   * @param feet The unchanged world ankle placements and rotations.
   * @param planted The unchanged planted selection, both feet by default.
   * @returns A lazy reader issuing fresh safe authored goal records and vectors.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines fixed inputs, world placements and separate prepared-output ownership; legs preserves its original borrowed cold references.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to the same original toe-axis/knee-hint and conditional MTP goal owner as legs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure StrikingLegGoals owns fixed-foot preparation and fresh field assembly once for both actual entry points.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every goal, field order, planted condition and MTP point remains; no pose, native fit, ROM projection or physical acceptance is skipped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed geometric hints and contacts prepare once instead of per repeated callback; every read still allocates fresh authored data and actual downstream fits remain unchanged.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Actual damped-balance and defence consumers keep body, entry feet and support selection unchanged throughout their plan/geometry; varying-foot callers retain the original legs entry point.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The owner retains two private immutable geometric snapshots until plan release; each output is independent and captures no reader, pose, time or fit history.
   */
  export function prepareLegs(
    body: IAutoMovieMotionHumanBody,
    feet: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement>,
    planted: Record<"left" | "right", boolean> = { left: true, right: true },
  ): () => Pick<IAutoMovieMotionHumanPosture["limbs"], "leftLeg" | "rightLeg"> {
    return StrikingLegGoals.prepare(body, feet, planted);
  }

  /**
   * The stance's trunk and hand angles that no effector goal expresses: the
   * chin tucked 12 degrees (cervical flexion, the lower third of its range)
   * and both fists closed. The tuck is the neck's flexion alone: its turn
   * toward the opponent (`facing`) and any side bend the entry holds are
   * kept, so an action entered from a guard keeps the eyes where the guard
   * had them.
   *
   * @param entry The clinical angles the action is entered with; a neck with no turn when absent.
   * @returns Clinical angles by bone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the chin tuck, its range basis, what of the entry's neck is kept and the closed fists.
   * @evidence contracts/development/implementation.md#principled-implementation The neck's flexion set inside its range with the entry's own side bend and turn, and the fist curl of both hands.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One object.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A constant table built per call.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function joints(
    entry?: IAutoMovieMotionHumanPosture["joints"],
  ): Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> {
    return {
      neck: [12, entry?.neck?.[1] ?? 0, entry?.neck?.[2] ?? 0],
      ...StrikingBody.curl("left"),
      ...StrikingBody.curl("right"),
    };
  }

  /** The most the neck and the head each turn back under a turning trunk, degrees (inside their 70 degree twist range). */
  export const FACING: number = 60;

  /**
   * Joint angles with the face kept where it looked while the trunk turns:
   * the neck and the head each turn back by half of the trunk's turn, so a
   * strike that turns the pelvis and the spine keeps its eyes on the opponent
   * (coaching: the chin stays tucked and the eyes stay on the target through
   * the punch or the kick) instead of swinging the head with the shoulders.
   *
   * @param joints The posture's clinical angles by bone.
   * @param turned How far the trunk has turned about the vertical since the entry, degrees, in the sign of the posture's yaw.
   * @returns The angles with the neck's and the head's twist turned back.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the relation, its coaching basis, the unit and the sign.
   * @evidence contracts/development/implementation.md#principled-implementation Twists about the same axis add along the neck and the head, so two equal shares cancel the trunk's turn inside each joint's range.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One share applied to two joints.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Each share is held inside the named bound; flexion and abduction are kept.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function facing(
    joints: IAutoMovieMotionHumanPosture["joints"],
    turned: number,
  ): IAutoMovieMotionHumanPosture["joints"] {
    const share: number = Math.max(-FACING, Math.min(FACING, 0.5 * turned));
    const neck: readonly [number, number, number] = joints.neck ?? [0, 0, 0];
    const head: readonly [number, number, number] = joints.head ?? [0, 0, 0];
    return {
      ...joints,
      neck: [neck[0], neck[1], neck[2] - share],
      head: [head[0], head[1], head[2] - share],
    };
  }
}


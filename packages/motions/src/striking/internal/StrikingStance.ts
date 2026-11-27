import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanGuard,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingStance,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { StrikingBody } from "./StrikingBody";
import { StrikingGuard } from "./StrikingGuard";
import { StrikingGuardBones } from "./StrikingGuardBones";
import { StrikingLegGoals } from "./StrikingLegGoals";
import { StrikingReach } from "./StrikingReach";

/** The alternatives of `PrepareLegsResult`'s site. */
type PrepareLegsResult = "leftLeg" | "rightLeg";

/** The alternatives of `LegsResult`'s site. */
type LegsResult = "leftLeg" | "rightLeg";

/** The alternatives of `PrepareGuardResult2`'s site. */
type PrepareGuardResult2 = "leftArm" | "rightArm";

/** The alternatives of `PrepareGuardResult`'s site. */
type PrepareGuardResult = "leftArm" | "rightArm";

/** The alternatives of `GuardResult`'s site. */
type GuardResult = "leftArm" | "rightArm";

/**
 * The fighting stance uses separate tracks, soft knees, a leading shoulder and
 * glove goals measured from the performer's own head.
 *
 * IBA coaching manual pp. 34 to 39 and the kickboxing/Muay Thai guides in the
 * kickboxing research give these relations; the numbers are named readings:
 *
 * - Stance length along the line 1.2 shoulder widths (guides: 1.0 to 1.3);
 * - Feet on their own hip tracks, spaced by the hip joints;
 * - 30 degree body turn with lead shoulder forward, lead toe 15 degrees toward
 *   that heading and rear toe 45 degrees out (IBA p.34 readings);
 * - A sunk root flexes both knees 32 degrees, within the 25 to 45 degree band;
 * - Both gloves at ear height the same short distance ahead of their jaw, the
 *   rear one outside its ear and the lead one before its own shoulder, chin
 *   tucked and eyes on the opponent (IABA, A Beginner's Guide: "tuck your chin
 *   down and look forward"; the boxing and MMA guard as coached: the rear hand
 *   "as if holding a phone to your ear and then pushed forward just in front of
 *   your face", the front hand "at the same height"; the Muay Thai guard: "arms
 *   projected out further", "nearly vertical forearms"). The resting arms leave
 *   the ribs to be defended by an action: a body kick is checked with the
 *   raised shin and the elbow brought down to the knee.
 *
 * Orthodox leads left and southpaw right; distances read the body's measure.
 */
export namespace StrikingStance {
  /** Stance length along the line in shoulder widths (coaching 1.0 to 1.3). */
  export const LENGTH_SHARE: number = 1.2;

  /** Body turn from the line, degrees, lead shoulder forward (IBA p.34 reading). */
  export const TURN: number = 30;

  /** Stance knee flexion, degrees (translated range 25 to 45). */
  export const KNEE_FLEXION: number = 32;

  /**
   * Lead foot heading off the line toward the body's turn, degrees (provisional
   * reading of IBA p.34).
   */
  export const LEAD_TOE: number = 15;

  /** Rear foot heading off the line, degrees (provisional reading of IBA p.34). */
  export const REAR_TOE: number = 45;

  /**
   * The rear side of a stance.
   *
   * @param stance The stance.
   * @returns The rear side.
   */
  export function rear(
    stance: Pick<IAutoMovieMotionHumanStrikingStance.IStance, "lead">,
  ): AutoMovieHumanSide {
    return stance.lead === "left" ? "right" : "left";
  }

  /**
   * The body's heading in a stance: turned from the line so the lead shoulder
   * comes forward (a turn to the right for an orthodox stance).
   *
   * @param stance The stance.
   * @returns Degrees about +Y.
   */
  export function heading(
    stance: IAutoMovieMotionHumanStrikingStance.IStance,
  ): number {
    return stance.line + (stance.lead === "left" ? -TURN : TURN);
  }

  /**
   * Stance length along the line, metres.
   *
   * @param body The body.
   * @returns Metres.
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
   */
  export function feet(
    body: IAutoMovieMotionHumanBody,
    stance: IAutoMovieMotionHumanStrikingStance.IStance,
    centre: IAutoMovieVector3,
  ): Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement> {
    const frame: IAutoMovieMotionHumanFrame = {
      origin: { x: centre.x, y: 0, z: centre.z },
      yaw: stance.line,
    };
    const half: number = length(body) / 2;
    const out = {} as Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    >;
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
   * The root height that flexes both knees at least {@link KNEE_FLEXION} over
   * given feet: each leg's hip-to-ankle distance at that flexion (law of
   * cosines on the thigh and shank), its vertical part over the feet's
   * horizontal offset, and the lower of the two legs.
   *
   * @param body The body.
   * @param root The root's floor position, world metres (its height ignored).
   * @param yaw The body heading, degrees.
   * @param ankles The ankle points, world metres.
   * @param flexion The knee flexion, degrees.
   * @returns The root's height offset, metres (negative: sunk).
   */
  export function sink(
    body: Pick<IAutoMovieMotionHumanBody, "rest"> & {
      measure: Pick<IAutoMovieMotionHumanBody["measure"], "thigh" | "shank">;
    },
    root: IAutoMovieVector3,
    yaw: number,
    ankles: Record<AutoMovieHumanSide, IAutoMovieVector3>,
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
   * lead one before its own shoulder, both vertical fists (knuckles up and
   * forward, palms in), elbows bending down under them. Placed on the posture's
   * own head, so the guard follows every root, turn and lean.
   *
   * @param body The body.
   * @param posture The posture whose trunk carries the head.
   * @param stance The stance.
   * @param drop How far each glove sags below its guard, metres.
   * @param posed The same body's trunk bones on this exact posture, borrowed
   *   within the current synchronous evaluation.
   * @param resolution Optional exact FK reader borrowed from the same
   *   synchronous person evaluation.
   * @returns The two arm goals.
   */
  export function guard(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    stance: Pick<IAutoMovieMotionHumanStrikingStance.IStance, "lead">,
    drop: Partial<Record<AutoMovieHumanSide, number>> = {},
    posed?: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): Pick<IAutoMovieMotionHumanPosture["limbs"], GuardResult> {
    return StrikingGuard(body, posture, stance, drop, posed, resolution);
  }

  /**
   * Prepare the fixed guard's actual head/shoulder demand for an action. Each
   * posture still computes both original glove goals from its own trunk.
   *
   * @param body The unchanged canonical body.
   * @param stance The captured leading-side reader inputs.
   * @param drop The captured per-side glove sag inputs, metres; empty by
   *   default.
   * @param style The authored sporting carriage. Absent uses the original open
   *   guard.
   * @returns The guard at an actual posture and optional operation-local FK
   *   source.
   */
  export function prepareGuard(
    body: IAutoMovieMotionHumanBody,
    stance: Pick<IAutoMovieMotionHumanStrikingStance.IStance, "lead">,
    drop: Partial<Record<AutoMovieHumanSide, number>> = {},
    style?: IAutoMovieMotionHumanGuard.Style,
  ): (
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ) => Pick<IAutoMovieMotionHumanPosture["limbs"], PrepareGuardResult> {
    const trunk: ReturnType<typeof StrikingBody.prepareTrunk> =
      StrikingBody.prepareTrunk(body, StrikingGuardBones(body));
    return (
      posture: IAutoMovieMotionHumanPosture,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): Pick<IAutoMovieMotionHumanPosture["limbs"], PrepareGuardResult2> =>
      StrikingGuard(
        body,
        posture,
        stance,
        drop,
        trunk(posture, resolution, projection),
        undefined,
        style,
      );
  }

  /**
   * An arm goal that puts the fist's knuckles on a point with the elbow bending
   * toward a hint, the fist continuing the forearm: no wrist rotation is
   * imposed, so the limb fit keeps the elbow on its hint and the hand follows
   * the forearm, and the wrist lies the fist socket's distance back along the
   * line from the hint to the point.
   *
   * @param body The body.
   * @param side The arm.
   * @param fist Where the knuckles go, world metres.
   * @param elbow Where the elbow bends toward, world metres.
   * @returns The arm goal.
   */
  export function glove(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
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
   * Planted leg goals on placed feet: the knee's bend hint lies up the leg from
   * the ankle and out along the foot's own three-dimensional forward (its
   * heading and its pitch, so a heel raised on a ball pivot tips the hint with
   * it), which under the engine's hinged knee fit decides the knee's side; the
   * foot's rotation itself goes through as the effector rotation, which the fit
   * carries with the hip's swivel. A planted foot's contact is the ball of the
   * foot, the sole point the stance's pivots turn about and the support audits
   * read.
   *
   * @param body The body.
   * @param feet The feet.
   * @param planted Which feet bear on the floor.
   * @returns The leg goals.
   */
  export function legs(
    body: IAutoMovieMotionHumanBody,
    feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
    planted: Record<AutoMovieHumanSide, boolean> = { left: true, right: true },
  ): Pick<IAutoMovieMotionHumanPosture["limbs"], LegsResult> {
    return StrikingLegGoals.read(body, feet, planted);
  }

  /**
   * Prepare authored leg goals for a plan's unchanged feet and planted
   * selection.
   *
   * @param body The unchanged canonical body.
   * @param feet The unchanged world ankle placements and rotations.
   * @param planted The unchanged planted selection, both feet by default.
   * @returns A lazy reader issuing fresh safe authored goal records and
   *   vectors.
   */
  export function prepareLegs(
    body: IAutoMovieMotionHumanBody,
    feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
    planted: Record<AutoMovieHumanSide, boolean> = { left: true, right: true },
  ): () => Pick<IAutoMovieMotionHumanPosture["limbs"], PrepareLegsResult> {
    return StrikingLegGoals.prepare(body, feet, planted);
  }

  /**
   * The stance's trunk and hand angles that no effector goal expresses: the
   * chin tucked 12 degrees (cervical flexion, the lower third of its range) and
   * both fists closed. The tuck is the neck's flexion alone: its turn toward
   * the opponent (`facing`) and any side bend the entry holds are kept, so an
   * action entered from a guard keeps the eyes where the guard had them.
   *
   * @param entry The clinical angles the action is entered with; a neck with no
   *   turn when absent.
   * @returns Clinical angles by bone.
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

  /**
   * The most the neck and the head each turn back under a turning trunk,
   * degrees (inside their 70 degree twist range).
   */
  export const FACING: number = 60;

  /**
   * Joint angles with the face kept where it looked while the trunk turns: the
   * neck and the head each turn back by half of the trunk's turn, so a strike
   * that turns the pelvis and the spine keeps its eyes on the opponent
   * (coaching: the chin stays tucked and the eyes stay on the target through
   * the punch or the kick) instead of swinging the head with the shoulders.
   *
   * @param joints The posture's clinical angles by bone.
   * @param turned How far the trunk has turned about the vertical since the
   *   entry, degrees, in the sign of the posture's yaw.
   * @returns The angles with the neck's and the head's twist turned back.
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

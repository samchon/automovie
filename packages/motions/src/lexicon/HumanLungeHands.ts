import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanMountRider,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { HumanLungePivot } from "./HumanLungePivot";
import type { HumanRideHands } from "./HumanRideHands";

/** Up. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** The displayed line hand's largest distance from the line while fully held, metres: the rider attachment contract's 10 mm budget. */
const CONTACT: number = 0.01;

/** The whip hand's place and aim. */
interface IWhip {
  /** Forward of the hips, a share of the hip height. */
  forward: number;

  /** Out to the whip's side, a share of the hip height. */
  out: number;

  /** Above the floor, a share of the hip height. */
  height: number;

  /** The shaft's turn from the bearing toward the whip's side, degrees. */
  turn: number;

  /** The shaft's pitch below level, degrees. */
  down: number;
}

/**
 * The whip hand's place and aim, provisional: at the hips' height, a little forward and out to its side, the shaft turned toward a circling horse's quarters and below level (a lunging handler holds the whip low behind the horse, the line and whip framing it).
 */
const WHIP: IWhip = {
  forward: 0.3,
  out: 0.35,
  height: 1,
  turn: 45,
  down: 20,
};

/**
 * The lunge's hands and feet records (`HumanLunge`): the feet's plant windows between their pivot swings, the whip hand's grip and the line hand's contact check.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the three records and their owner.
 * @evidence contracts/development/design.md#principled-representation Three functions of the schedule, the posture and the fitted hand.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `HumanLunge`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The whip's aim is a named provisional value; the contact budget is the attachment contract's.
 */
export namespace HumanLungeHands {
  /**
   * The feet's plant windows: each foot on the ground from the action's start to its first swing, between its swings, and from its last to the end.
   *
   * @param schedule The pivot steps.
   * @param seconds The action's length.
   * @returns The windows, shares of the action.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the windows.
   * @evidence contracts/development/implementation.md#principled-implementation Each step's leading foot swings over its first swing and the other over its second; the windows are the complements.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass per foot.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the steps.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh windows.
   */
  export function plants(
    schedule: HumanLungePivot.ISchedule,
    seconds: number,
  ): IAutoMovieMotionHumanContactWindow[] {
    const windows: IAutoMovieMotionHumanContactWindow[] = [];
    for (const side of SIDES) {
      let from: number = 0;
      for (const pivot of schedule.steps) {
        const lift: number =
          pivot.start + (side === pivot.lead ? 0 : schedule.swing);
        windows.push(plant(side, from / seconds, lift / seconds));
        from = lift + schedule.swing;
      }
      windows.push(plant(side, from / seconds, 1));
    }
    return windows;
  }

  /**
   * The whip hand's grip: at the hips' side and front, its shaft aimed down toward the quarters.
   *
   * @param body The body.
   * @param posture The stance, facing the horse.
   * @param side The whip hand.
   * @returns The grip the hand closes on.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States where the hand goes and where the shaft points.
   * @evidence contracts/development/implementation.md#principled-implementation The hips' heading gives forward and out; the hand stands `WHIP` shares of the hip height out from the root, the shaft turned from forward toward the side and pitched down, the palm facing the body's middle across the shaft.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One point, one axis, one normal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function whip(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanMountRider.IHoldGrip {
    const sign: number = side === "left" ? 1 : -1;
    const yaw: number = (posture.yaw * Math.PI) / 180;
    const forward: IAutoMovieVector3 = {
      x: Math.sin(yaw),
      y: 0,
      z: Math.cos(yaw),
    };
    const out: IAutoMovieVector3 = {
      x: sign * forward.z,
      y: 0,
      z: -sign * forward.x,
    };
    const hip: number = body.measure.hipHeight;
    const point: IAutoMovieVector3 = {
      x: posture.root.x + (forward.x * WHIP.forward + out.x * WHIP.out) * hip,
      y: WHIP.height * hip,
      z: posture.root.z + (forward.z * WHIP.forward + out.z * WHIP.out) * hip,
    };
    const level: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.fromAxisAngle(UP, sign * WHIP.turn),
      forward,
    );
    const down: number = (WHIP.down * Math.PI) / 180;
    const axis: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(level, Math.cos(down)),
      Vector3.scale(UP, -Math.sin(down)),
    );
    const inward: IAutoMovieVector3 = Vector3.scale(out, -1);
    return {
      point,
      axis,
      normal: Vector3.normalize(
        Vector3.addScaled(inward, axis, -Vector3.dot(inward, axis)),
      ),
    };
  }

  /**
   * Refuse a fully held line hand that misses the line.
   *
   * @param body The body.
   * @param side The line hand.
   * @param posture The displayed posture.
   * @param grip The line's grip.
   * @param name The line's name for the refusal.
   * @param film The film second.
   * @param resolution The borrowed forward-kinematics reader, if any.
   * @param projection The borrowed range-of-motion projector, if any.
   * @throws {HumanRefusal} When the displayed palm lies more than `CONTACT` from the line's surface.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the measure and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Resolve the displayed posture, carry the body's measured palm (`HumanHand.offset`) by the wrist's world frame, and measure to the line's surface, as the lead overlay measures its hand.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One resolve, one measure.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A miss refuses; nothing is snapped.
   * @evidence contracts/development/implementation.md#efficient-algorithms One selected-bone resolve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the posture resolver and bone reader.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function verify(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    posture: IAutoMovieMotionHumanPosture,
    grip: HumanRideHands.IMaterialGrip,
    name: string,
    film: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
  ): void {
    const wrist: AutoMovieHumanoidBone = `${side}Hand`;
    const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set([wrist]);
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const pose: ReturnType<typeof resolveHumanPosture.seeded> =
      resolveHumanPosture.seeded(
        body,
        posture,
        undefined,
        undefined,
        read,
        prepareHumanPoseResolution.isNativeSource(resolution)
          ? requested
          : undefined,
        projection,
      );
    const actual: IAutoMovieResolvedBone = poseBones(
      body,
      pose.pose,
      read(),
      requested,
    ).get(wrist)!;
    const effector: IAutoMovieVector3 = Vector3.add(
      actual.worldPosition,
      Quaternion.rotateVector(
        actual.worldRotation,
        HumanHand.offset(body, side, "palm").point,
      ),
    );
    const skin: IAutoMovieVector3 = Vector3.addScaled(
      grip.point,
      grip.normal,
      grip.radius ?? 0,
    );
    const distance: number = Vector3.distance(effector, skin);
    if (!(distance <= CONTACT))
      throw new HumanRefusal({
        kind: "affordance",
        axis: "lineReach",
        value: distance,
        feasible: { kind: "range", minimum: 0, maximum: CONTACT, unit: "m" },
        reason: `the displayed ${side} hand misses ${name} by ${distance} m at film second ${film}`,
        fix: "Lay the line's held run within the handler's reach from the circle's centre.",
      });
  }

  /** The two feet. */
  const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

  /** One foot's plant window, shares of the action. */
  function plant(
    side: AutoMovieHumanSide,
    from: number,
    to: number,
  ): IAutoMovieMotionHumanContactWindow {
    return {
      part: `${side}Foot`,
      kind: "plant",
      from,
      to: Math.max(from, to),
      support: { kind: "ground" },
    };
  }
}

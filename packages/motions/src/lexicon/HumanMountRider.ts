import {
  Quaternion,
  Vector3,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanMountRider,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanGrip } from "../handling/HumanGrip";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanMountReach } from "./HumanMountReach";
import type { HumanRideHands } from "./HumanRideHands";
import { ankleRidePedalFoot } from "./ankleRidePedalFoot";
import { placeRideReinPalm } from "./placeRideReinPalm";

/**
 * What a seated rider's own body gives to stay on a mount's parts: the
 * ankle that points a foot down to a pedal the leg would not reach, and
 * the trunk that leans forward to a bar the arms would not reach.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two adjustments and when each acts.
 * @evidence contracts/development/design.md#principled-representation Each is a pure function of the body, a posture or a goal and world points, returning the same kind of record it was given.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two functions `HumanRide.ride` calls, the one that applies a lean, and their bounds.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every bound is named and marked provisional or cited; no mount is named.
 */
export namespace HumanMountRider {
  /** A mounted hand's exact wrist goal and the axis the fingers follow. */
  interface IWrist {
    point: IAutoMovieVector3;
    fingers: IAutoMovieVector3;
    /** The material-aligned wrist rotation, if the point came from a rein. */
    rotation?: IAutoMovieQuaternion;
    /** The rein's actual palm offset, preserved by the arm fit. */
    contact?: IAutoMovieVector3;
  }

  /** The knee flexion a pedalling leg keeps at the bottom of the stroke, degrees: the low end of the 25 to 35 a saddle is set for (Bini, Hume and Croft 2011, Sports Med 41:463, as the bicycle archetype cites it; not re-read here, so provisional). */
  export const KNEE: number = 25;

  /** The furthest a pedalling foot points down from the pitch it mounted with, degrees (provisional, inside the ankle's 50 of plantar flexion). */
  export const ANKLING: number = 35;

  /** The share of the arm's length, shoulder to wrist, a rider's shoulder is brought within of what the hand holds (provisional: the elbows stay a little bent). */
  export const ARM: number = 0.9;

  /** The most a rider's spine flexes forward to reach what the hands hold, degrees (provisional, inside the spine's 80 of flexion). */
  export const LEAN: number = 60;

  /**
   * A foot goal turned toes-down about its contact until its ankle is
   * within the leg's reach of the hip with the knee `KNEE` bent, no
   * further than `ANKLING`: a cyclist's ankle through the bottom of the
   * stroke.
   *
   * @param body The body.
   * @param side The foot.
   * @param goal The foot's goal on its pedal.
   * @param hip The hip joint, world metres.
   * @param level The rotation a foot whose goal leaves its turn free stands with: level, facing as the body does.
   * @returns The goal, turned about the ball of the foot where the leg would run short; the goal itself where it reaches.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what turns, about what, how far and when nothing changes.
   * @evidence contracts/development/implementation.md#principled-implementation The ball stays where the goal puts it and the ankle moves on its circle about the ball's lateral axis; the least turn that reaches is found by bisection, the distance being monotonic in the turn up to `ANKLING`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The rider's bounds handed to the search, which `ankleRidePedalFoot` owns so this file stays within its size.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A pedal beyond even `ANKLING` leaves the foot short of it, which the contact audit reports; a refusal with the saddle height that fits is owed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four distance trials (none, the two signs and `ANKLING`) and twenty-four bisections, which narrow the `ANKLING` span to about two millionths of a degree; each trial is one rotation about the ball's prepared axis.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The ball, the axis and the contact are read once per call and shared by every trial; the returned goal is placed by the same function the trials measure.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; it returns the goal given or a new one.
   */
  export function ankled(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    goal: IAutoMovieHumanLimbGoal,
    hip: IAutoMovieVector3,
    level: IAutoMovieQuaternion,
  ): IAutoMovieHumanLimbGoal {
    return ankleRidePedalFoot(body, side, goal, hip, level, KNEE, ANKLING);
  }

  /** How far the wrist's centre lies off the palm's skin, hand lengths: half the hand's thickness (provisional, about 14 mm of a 190 mm hand). The wrist stays this plus the grip's own radius off a held point along its outward normal, so the palm's skin lies on the grip and the fingers wrap it. */
  export const PALM: number = 0.075;

  /** How far ahead of the wrist the middle of the palm lies, hand lengths (provisional: the palm is about half the hand and its middle a little short of that). */
  export const CENTRE: number = 0.35;

  /** Place the wrist by the grip's displayed palm normal and crossbar. */
  export function wrist(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    grip: IAutoMovieMotionHumanMountRider.IHoldGrip,
  ): IWrist {
    const material: HumanRideHands.IMaterialGrip = grip;
    const across: IAutoMovieVector3 =
      grip.axis === undefined
        ? { x: 0, y: 0, z: 0 }
        : Vector3.cross(grip.axis, grip.normal);
    let fingers: IAutoMovieVector3;
    if (Vector3.length(across) < 1e-6) fingers = forward(posture);
    else {
      const side: number =
        grip.across ?? (Vector3.dot(across, forward(posture)) < 0 ? -1 : 1);
      fingers = Vector3.scale(Vector3.normalize(across), side);
    }
    if (material.reinPalm !== undefined)
      return {
        ...placeRideReinPalm(material.reinPalm, grip, fingers),
        fingers,
        contact: material.reinPalm.point,
      };
    return {
      point: Vector3.add(
        grip.point,
        Vector3.add(
          Vector3.scale(
            grip.normal,
            (material.palmDepth ?? PALM * body.measure.hand) +
              (grip.radius ?? 0),
          ),
          Vector3.scale(fingers, -CENTRE * body.measure.hand),
        ),
      ),
      fingers,
    };
  }

  /**
   * A hand holding a grip, a rein or a rim: where its wrist goes, how the
   * hand turns and how its fingers close, a share of the way from where
   * the posture shows the hand: its joints, or the arm goal it already
   * gives, so a hand taken from rest leaves the place it rested.
   *
   * An articulated round handle uses the measured depth of the gripping palm.
   * On other supports the wrist stays `PALM` of the hand's length plus the grip's radius
   * (half the width the object states across it; none when it states none)
   * off the point along the point's outward normal and `CENTRE` behind it along the fingers, so
   * the grip lies across the middle of the palm, the palm faces the point, and the fingers lie
   * across the grip's own axis on the side the body faces, so they wrap
   * a bar that runs across the hand; with no axis they point the way the
   * body faces. The fingers close from the relaxed hand to the closure
   * given, which `closed` curls on the support's own colliders.
   *
   * @param body The body.
   * @param side The hand.
   * @param posture The rider's posture at the instant.
   * @param grip The held point and its outward unit normal, world, the unit axis the grip runs along when it has one, its radius, metres, when the object states one, and the side of the axis the fingers lie on (the sign of the axis crossed with the normal) when a hold keeps the side it was taken from; the side the body faces when absent.
   * @param share 0 where the joints hold the hand to 1 holding.
   * @param closed The finger joints of the hand closed on the grip; none leaves the fingers as they are.
   * @param resolution Optional exact FK reader or lazy supplier borrowed only for this synchronous partial hold.
   * @param projection Optional genuine same-body ROM metadata projector borrowed from this same operation.
   * @returns The arm's goal and the hand's finger joints.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States where the wrist goes, how the hand turns, how the fingers close and what the first pass leaves out.
   * @evidence contracts/development/implementation.md#principled-implementation The hand's frame is built from the grip's own normal and axis, so it turns with the part at every instant; the way there is a straight line and the shortest turn from the hand the posture shows, so the hand leaves the place it held.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The target, the turn, the blend from the joints' hand, the fingers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A grip out of the arm's reach is not checked here: the limb fit leaves the hand short of it, which the contact audit reports. The closure is the caller's, curled on the real colliders.
   * @evidence contracts/development/implementation.md#efficient-algorithms Holding fully needs no resolution; a partial hold observes the free wrist and its ancestors. A native read omits unrelated simple leg fits through the canonical goal selector; an incoming custom reader keeps the full fit. The fingers blend linearly over the closed joints given.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller's forward-kinematics reader and range-of-motion projector serve the resolution; the relaxed hand is `HumanHand.shape`'s table.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader and the projector are used only during the call; the returned goal and joints hold numbers alone.
   */
  export function hold(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    posture: IAutoMovieMotionHumanPosture,
    grip: IAutoMovieMotionHumanMountRider.IHoldGrip,
    share: number,
    closed: IAutoMovieMotionHumanPosture["joints"],
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanMountRider.IHoldResult {
    return held(
      body,
      side,
      posture,
      grip,
      share,
      closed,
      () =>
        freeHands(body, posture, FREE_HAND[side], resolution, projection).get(
          `${side}Hand`,
        )!,
    );
  }

  /**
   * Start both acquiring hands from the same unoccupied posture for one query.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the shared pre-grip pose and the query lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation Both approaching hands start from the seated posture as shown, before either arm is guided by a grip.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read both origins together at first demand and use the ordinary grip interpolator for each hand.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The current seat, legs and other direct channels still enter forward resolution. Each actual grip supplies its own current position and turn.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most one seated fit for both approaching wrists, and none after acquisition.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Sharing is local to one authored posture and never uses a free wrist from another second.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller holds the acquiring reader only while building its current two goals.
   */
  export function taking(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    share: number,
  ): Taking {
    let free:
      | ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieRigidTransform>
      | undefined;
    return (side, grip, closed) =>
      held(body, side, posture, grip, share, closed, () => {
        free ??= freeHands(body, posture, BOTH_HANDS);
        return free.get(`${side}Hand`)!;
      });
  }

  /** Acquire the selected hand using this query's relaxed origin and current grip. */
  type Taking = (
    side: AutoMovieHumanSide,
    grip: IAutoMovieMotionHumanMountRider.IHoldGrip,
    closed: IAutoMovieMotionHumanPosture["joints"],
  ) => IAutoMovieMotionHumanMountRider.IHoldResult;

  /** A held grip requires its free origin only before acquisition finishes. */
  function held(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    posture: IAutoMovieMotionHumanPosture,
    grip: IAutoMovieMotionHumanMountRider.IHoldGrip,
    share: number,
    closed: IAutoMovieMotionHumanPosture["joints"],
    free: () => IAutoMovieRigidTransform,
  ): IAutoMovieMotionHumanMountRider.IHoldResult {
    const s: number = Math.min(1, Math.max(0, share));
    const {
      point: target,
      fingers,
      contact,
      rotation: rein,
    }: IWrist = wrist(body, posture, grip);
    const turned: IAutoMovieQuaternion =
      rein ??
      HumanHand.rotation(side, {
        fingers,
        palm: Vector3.scale(grip.normal, -1),
      });
    let point: IAutoMovieVector3 = target;
    let rotation: IAutoMovieQuaternion = turned;
    if (s < 1) {
      const hand: IAutoMovieRigidTransform = free();
      point = Vector3.lerp(hand.position, target, s);
      rotation = Quaternion.slerp(hand.rotation, turned, s);
    }
    const relaxed: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
      side,
      "relaxed",
    );
    const closing: IAutoMovieMotionHumanPosture["joints"] = {};
    for (const bone of Object.keys(closed) as AutoMovieHumanoidBone[]) {
      // The fingers start as the posture shows them, so a hold that begins
      // mid-motion does not snap the hand to its relaxed shape.
      const from: readonly [number, number, number] = posture.joints[bone] ??
        relaxed[bone] ?? [0, 0, 0];
      const to: readonly [number, number, number] = closed[bone]!;
      closing[bone] = [
        from[0] + (to[0] - from[0]) * s,
        from[1] + (to[1] - from[1]) * s,
        from[2] + (to[2] - from[2]) * s,
      ];
    }
    return {
      arm: {
        point,
        rotation,
        bend: AutoMovieMotionHumanBend.hang(body, posture, side, 0.2),
        ...(contact === undefined ? {} : { contact }),
        planted: s >= 1,
      },
      fingers: closing,
    };
  }

  /**
   * The wrists as the posture shows them, before either grip is assigned: an
   * arm the posture already places, such as a hand resting on a thigh,
   * starts from there. A hand whose arm goal the posture gives in the world,
   * turned, is where that goal puts it, the wrist on its point turned to its
   * rotation, the arm fit's own closed-form answer, so no read fits that arm
   * again; the others are read off the posture resolved without those arms.
   */
  function freeHands(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    requested: ReadonlySet<AutoMovieHumanoidBone>,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieRigidTransform> {
    const out: Map<AutoMovieHumanoidBone, IAutoMovieRigidTransform> = new Map();
    const rest: Set<AutoMovieHumanoidBone> = new Set();
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    for (const bone of requested) {
      const arm: "leftArm" | "rightArm" = bone.startsWith("left")
        ? "leftArm"
        : "rightArm";
      const goal: IAutoMovieHumanLimbGoal | undefined = posture.limbs[arm];
      if (
        goal !== undefined &&
        goal.on === undefined &&
        goal.rotation !== undefined
      ) {
        out.set(bone, { position: goal.point, rotation: goal.rotation });
        delete limbs[arm];
      } else rest.add(bone);
    }
    if (rest.size === 0) return out;
    const read = prepareHumanPoseResolution(resolution);
    const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(
        body,
        resolveHumanPosture.seeded(
          body,
          { ...posture, limbs },
          undefined,
          undefined,
          read,
          prepareHumanPoseResolution.isNativeSource(resolution)
            ? rest
            : undefined,
          projection,
        ).pose,
        read(),
        rest,
      );
    for (const bone of rest) {
      const found: IAutoMovieResolvedBone = bones.get(bone)!;
      out.set(bone, {
        position: found.worldPosition,
        rotation: found.worldRotation,
      });
    }
    return out;
  }

  /**
   * The finger joints of a hand closed on a grip of the support: each
   * digit curled from the relaxed hand until its phalanges meet the
   * handle (`HumanGrip.close`, a power grip), the support's collider
   * nearest the held point, as `HumanGrasp` picks a prop's handle, with the
   * hand where `hold` puts it.
   *
   * The closure is solved once, where the support stands with the rider
   * seated so, and kept: the hand and the grip move together afterwards.
   * First pass: the colliders are the support's at rest under its frame,
   * so a bar that steers within the frame is closed on where it rests.
   *
   * @param body The body.
   * @param side The hand.
   * @param posture The rider's posture holding.
   * @param grip The held point, its normal and its axis, world.
   * @param shapes The support's colliders in its own frame.
   * @param frame The support's world frame.
   * @returns The closed finger joints, clinical degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is closed on what, when it is solved and what the first pass leaves out.
   * @evidence contracts/development/implementation.md#principled-implementation The grasp laws' own closure on the prop's own colliders, placed by the prop's frame as `HumanGrasp` places them, with the hand's frame taken from `hold`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The hand's frame, the placed colliders, one call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No named hand shape stands in for the closure.
   * @evidence contracts/development/implementation.md#efficient-algorithms One ordered O(S) distance scan selects the nearest of S support shapes, then one closure solve per hand per plan; each shape's distance is evaluated once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Solved once and blended to at every instant, since the hand and the grip do not move against each other.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function closed(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    posture: IAutoMovieMotionHumanPosture,
    grip: IAutoMovieMotionHumanMountRider.IHoldGrip,
    shapes: readonly IAutoMoviePhysicalShape[],
    frame: IAutoMovieRigidTransform,
  ): IAutoMovieMotionHumanPosture["joints"] {
    const arm: IAutoMovieHumanLimbGoal = hold(
      body,
      side,
      posture,
      grip,
      1,
      {},
    ).arm;

    // The handle is the collider nearest the held point, as a grasp takes a mug by its handle and not its body: the fingers close on it, not on the leaf or the frame behind it.
    const near = (shape: IAutoMoviePhysicalShape): number =>
      physicalShapeSegmentDistance(frame, shape, grip.point, grip.point);
    let handle: IAutoMoviePhysicalShape | undefined;
    let distance: number = Infinity;
    for (const shape of shapes) {
      const candidate: number = near(shape);
      if (handle === undefined || candidate < distance) {
        handle = shape;
        distance = candidate;
      }
    }
    if (handle === undefined) return {};
    const material: HumanRideHands.IMaterialGrip = grip;
    return HumanGrip.close(
      body,
      side,
      "power",
      { point: arm.point, rotation: arm.rotation! },
      [{ shape: handle, frame }],
      HumanHand.shape(
        side,
        material.palmDepth === undefined ? "relaxed" : "flat",
      ),
    ).joints;
  }

  /**
   * A posture with its spine flexed further forward.
   *
   * @param posture The posture.
   * @param degrees The flexion added, degrees.
   * @returns The posture leant.
   *
   * @evidenceExclude contracts/development/common.md#meaningful-documentation One joint's flexion added.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation One sum.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function leant(
    posture: IAutoMovieMotionHumanPosture,
    degrees: number,
  ): IAutoMovieMotionHumanPosture {
    const spine: readonly [number, number, number] = posture.joints.spine ?? [
      0, 0, 0,
    ];
    return {
      ...posture,
      joints: {
        ...posture.joints,
        spine: [spine[0] + degrees, spine[1], spine[2]],
      },
    };
  }

  /**
   * How far a seated rider leans the trunk forward to reach what the hands
   * hold, the support standing where it does with the rider seated so
   * (`reach`).
   *
   * @param body The body.
   * @param seated The seated posture.
   * @param points What each hand holds, world metres.
   * @returns Degrees of spine flexion to add; 0 when the arms reach as seated, `LEAN` when they do not even then.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is solved and both ends of the result.
   * @evidence contracts/development/implementation.md#principled-implementation `reach` for the hands that hold.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts As `reach`.
   * @evidence contracts/development/implementation.md#efficient-algorithms As `reach`, once.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function lean(
    body: IAutoMovieMotionHumanBody,
    seated: IAutoMovieMotionHumanPosture,
    points: Partial<Record<"left" | "right", IAutoMovieVector3>>,
  ): number {
    const sides: ("left" | "right")[] = (["left", "right"] as const).filter(
      (side: "left" | "right"): boolean => points[side] !== undefined,
    );
    return sides.length === 0
      ? 0
      : HumanMountReach.reach(body, seated, sides)(points);
  }
}

/** The rider's forward direction when the grip has yet to establish its finger side. */
function forward(posture: IAutoMovieMotionHumanPosture): IAutoMovieVector3 {
  return Quaternion.rotateVector(resolveHumanPosture.heading(posture), {
    x: 0,
    y: 0,
    z: 1,
  });
}

/** Both free wrists observed from one unoccupied upper-body fit. */
const BOTH_HANDS: ReadonlySet<AutoMovieHumanoidBone> = new Set([
  "leftHand",
  "rightHand",
]);
/** A single free wrist only needs its own ancestor chain. */
const FREE_HAND: Record<
  AutoMovieHumanSide,
  ReadonlySet<AutoMovieHumanoidBone>
> = {
  left: new Set(["leftHand"]),
  right: new Set(["rightHand"]),
};

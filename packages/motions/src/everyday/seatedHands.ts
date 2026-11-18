import { Quaternion, Vector3, physicalShapeSpan } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { handReach } from "./handReach";
import { prepareThighSkin } from "./prepareThighSkin";
import type { prepareSeatedPalms } from "./prepareSeatedPalms";

/** Profile-local thigh intersections and hand extents for this seated phase. */
type PalmRests = ReturnType<typeof prepareSeatedPalms>;

/**
 * Seated hand placements on the thighs and armrests. A placement invocation
 * owns its resolved bones so its target and hanging origin share one solve.
 * Optional FK/ROM sources are borrowed only for the synchronous placement;
 * every current joint and relevant goal is still admitted and fitted.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the target surfaces and the lifetime of shared resolved bones; members give world-metre and degree inputs.
 * @evidence contracts/development/design.md#principled-representation Existing posture goals, body surfaces and resolved bones describe both resting targets.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The seated facade delegates its four hand operations here: thigh goals, thigh rests, mixed rests and the armrest goal.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the canonical arm goal and posture resolver without a parallel fit or stored target pose.
 */
export namespace seatedHands {
  /**
   * Lay both palms on their own front thighs, fingers toward the knees.
   * The input's leg goals are solved before the surface is measured.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the surface, direction and solved-leg premise.
   * @evidence contracts/development/implementation.md#principled-implementation Transforms each body's thigh-front surface through its resolved bone and uses its lower leg to orient a flat palm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One canonical solve feeds the shared thigh-goal builder.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains the existing provisional hanging-elbow out share of 0.2 and canonical palm goal construction.
   * @evidence contracts/development/implementation.md#efficient-algorithms One canonical observational resolution and demanded FK, then constant work for the requested targets; independent world arm goals that cannot change thigh observations need no fit, under the resolver's existing guard.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both targets read the same completed bone map; it is never shared across different input postures.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Bones and goals are invocation-local and no cache or handle is retained.
   */
  export function hands(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side?: AutoMovieHumanSide,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture["limbs"] {
    const sides: readonly AutoMovieHumanSide[] =
      side === undefined ? SIDES : [side];
    return thighs(
      body,
      posture,
      resolved(
        body,
        posture,
        thighBones(body, sides, false),
        resolution,
        projection,
      ),
      sides,
    );
  }

  /**
   * Move the hands from their posed hanging origins to their thighs by a
   * caller-eased share, clamped by the endpoint branches at zero and one.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two endpoints and the caller's eased progress convention.
   * @evidence contracts/development/implementation.md#principled-implementation The free wrist travels from hanging to bearing with spherical wrist rotation. Where the straight route would cross the thigh, the two current solid support extents determine its radial displacement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates the two active hands to the shared partial-placement operation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original hanging and fully resting branches and elbow hints remain unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms At positive share one pose resolution and FK supplies origins and targets instead of resolving that same posture twice.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses one invocation's exact bone map for target surfaces and hanging wrist frames.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the returned posture and its goals survive the call.
   */
  export function arms(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    share: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
    skin?: PalmRests,
  ): IAutoMovieMotionHumanPosture {
    return towardThighs(
      body,
      posture,
      share,
      SIDES,
      undefined,
      resolution,
      projection,
      skin,
    );
  }

  /**
   * Rest each hand on its armrest when supplied, otherwise on its thigh.
   * Inputs contain placed legs and directly authored hanging arms; share is
   * zero hanging to one bearing, and armrest coordinates are world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States target precedence, input pose and progress, and world-metre rests.
   * @evidence contracts/development/implementation.md#principled-implementation Each hand retains the same independently defined thigh or armrest interpolation from the posed hanging origin.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Selects only the thighs that remain visible, then writes supplied armrests with their existing owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Armrest goals still replace thigh goals on that side and become planted only at full share; no reach refusal is added.
   * @evidence contracts/development/implementation.md#efficient-algorithms Avoids overwritten thigh targets and, when the input has no arm goals, shares one canonical solve between the actual thigh and armrest consumers instead of repeating its identical leg solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Absence of both input arm goals makes the original posture exactly the legs-only posture armrest origins require; those matching inputs share one call-local map. Inputs with arm goals retain separate full and legs-only readings, borrowing one synchronous parent FK/ROM source only for exact prerequisites.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The active-side list and resolved maps end with the invocation; no retained state is added.
   */
  export function rested(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    rests: Partial<Record<"left" | "right", IAutoMovieVector3>> | undefined,
    yaw: number,
    share: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture {
    if (share <= 0) return posture;
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const project: ReturnType<typeof prepareHumanPostureProjection> =
      projection ?? prepareHumanPostureProjection(body);
    if (
      rests === undefined ||
      (rests.left === undefined && rests.right === undefined)
    )
      return arms(body, posture, share, read, project);
    const sides: AutoMovieHumanSide[] = SIDES.filter(
      (side: AutoMovieHumanSide): boolean => rests[side] === undefined,
    );
    if (
      posture.limbs.leftArm === undefined &&
      posture.limbs.rightArm === undefined
    ) {
      const requested: Set<AutoMovieHumanoidBone> = new Set(
        thighBones(body, sides, share < 1),
      );
      for (const side of SIDES)
        if (rests[side] !== undefined) requested.add(`${side}Hand`);
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        resolved(body, posture, requested, read, project);
      return restGoals(
        body,
        towardThighs(body, posture, share, sides, bones),
        rests,
        yaw,
        share,
        bones,
      );
    }
    return onArmrests(
      body,
      towardThighs(body, posture, share, sides, undefined, read, project),
      rests,
      yaw,
      share,
      read,
      project,
    );
  }

  /**
   * Move supplied hands from their directly posed frames onto world-metre
   * armrest points, palms down, fingers along yaw in degrees. Other hand
   * goals remain; a hand bears when share reaches one. The hanging origins
   * are read with the leg goals alone, then each point is interpolated
   * linearly and each palm-down goal slerped; a nonpositive share returns the
   * posture as given, and out-of-reach armrests are left to the contact
   * audit.
   */
  function onArmrests(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    rests: Partial<Record<"left" | "right", IAutoMovieVector3>>,
    yaw: number,
    share: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture {
    if (share <= 0) return posture;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = resolved(
      body,
      { ...posture, limbs: legsOnly(posture) },
      undefined,
      resolution,
      projection,
    );
    return restGoals(body, posture, rests, yaw, share, bones);
  }

  /** Preserve the public spread-then-leg-read order and its original present-goal observations. */
  function legsOnly(posture: IAutoMovieMotionHumanPosture): IAutoMovieMotionHumanPosture["limbs"] {
    return {
      ...(posture.limbs.leftLeg === undefined
        ? {}
        : { leftLeg: posture.limbs.leftLeg }),
      ...(posture.limbs.rightLeg === undefined
        ? {}
        : { rightLeg: posture.limbs.rightLeg }),
    };
  }

  /** Write armrest goals from the exact hanging-origin map owned by this call. */
  function restGoals(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    rests: Partial<Record<"left" | "right", IAutoMovieVector3>>,
    yaw: number,
    share: number,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IAutoMovieMotionHumanPosture {
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    const s: number = Math.min(1, share);
    for (const side of SIDES) {
      const rest: IAutoMovieVector3 | undefined = rests[side];
      if (rest === undefined) continue;
      const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
      const goal: IAutoMovieHumanLimbGoal = armrest(body, posture, side, rest, yaw);
      limbs[`${side}Arm`] = s >= 1 ? goal : {
        point: Vector3.lerp(hand.worldPosition, goal.point, s),
        rotation: Quaternion.slerp(hand.worldRotation, goal.rotation!, s),
        bend: goal.bend,
      };
    }
    return flattened({ ...posture, limbs }, SIDES.filter((side: AutoMovieHumanSide): boolean => rests[side] !== undefined), s);
  }

  /**
   * The bearing wrist that puts the body's flat palm on an armrest,
   * palm down and fingers along the seat's yaw, in world metres and degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the offset, frame, orientation and bearing state.
   * @evidence contracts/development/implementation.md#principled-implementation Places the exact flat palm surface, with the canonical hand orientation and hanging-elbow preset.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Constructs one world arm goal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the existing elbow share and uses the body's measured palm instead of assuming a wrist height.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work without pose resolution.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Independent point and posture inputs require their own goal.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state or resources.
   */
  export function armrest(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    rest: IAutoMovieVector3,
    yaw: number,
  ): IAutoMovieHumanLimbGoal {
    const rotation: IAutoMovieQuaternion = HumanHand.rotation(side, {
        fingers: HumanFrame.point(
          { origin: { x: 0, y: 0, z: 0 }, yaw },
          { x: 0, y: 0, z: 1 },
        ),
        palm: { x: 0, y: -1, z: 0 },
    });
    // The stated rest is beneath the wrist. The palm plane extends from
    // its centre back under the carpus to the bearing heel of the hand.
    const palm: IAutoMovieVector3 = Quaternion.rotateVector(rotation, HumanHand.offset(body, side, "palm", "flat").point);
    const underside: IAutoMovieVector3 = { x: 0, y: Math.min(0, palm.y), z: 0 };
    return {
      point: Vector3.subtract(rest, underside),
      contact: Quaternion.rotateVector(Quaternion.inverse(rotation), underside),
      rotation,
      bend: AutoMovieMotionHumanBend.hang(body, posture, side, 0.2),
      planted: true,
    };
  }

  /** Share the input's resolved wrist frames and thigh surfaces in this call. */
  function towardThighs(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    share: number,
    sides: readonly AutoMovieHumanSide[],
    prepared?: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
    skin?: PalmRests,
  ): IAutoMovieMotionHumanPosture {
    if (share <= 0 || sides.length === 0) return posture;
    const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      prepared ??
      resolved(
        body,
        posture,
        thighBones(body, sides, share < 1),
        resolution,
        projection,
      );
    const goals: IAutoMovieMotionHumanPosture["limbs"] = thighs(body, posture, bones, sides, skin);
    if (share >= 1)
      return flattened({ ...posture, limbs: { ...posture.limbs, ...goals } }, sides, 1);
    const shaped: IAutoMovieMotionHumanPosture = flattened(posture, sides, share);
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    for (const side of sides) {
      const goal: IAutoMovieHumanLimbGoal = goals[`${side}Arm`]!;
      const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
      const point: IAutoMovieVector3 = Vector3.lerp(hand.worldPosition, goal.point, share);
      const rotation: IAutoMovieQuaternion = Quaternion.slerp(hand.worldRotation, goal.rotation!, share);
      limbs[`${side}Arm`] = {
        point: clearThigh(body, shaped, side, bones, point, rotation),
        rotation,
        bend: goal.bend,
      };
    }
    return { ...shaped, limbs };
  }

  /** Separate the moving hand from the current thigh along the wrist's radial direction. The two convex support extents give the least outward translation on that ray, in metres. */
  function clearThigh(
    body: IAutoMovieMotionHumanBody,
    shaped: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    point: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
  ): IAutoMovieVector3 {
    const bone: AutoMovieHumanoidBone = `${side}UpperLeg`;
    const thigh: IAutoMovieResolvedBone = bones.get(bone)!;
    const axis: IAutoMovieVector3 = Vector3.normalize(Vector3.subtract(
      bones.get(`${side}LowerLeg`)!.worldPosition, thigh.worldPosition,
    ));
    const arm: IAutoMovieVector3 = Vector3.subtract(point, thigh.worldPosition);
    const radial: IAutoMovieVector3 = Vector3.addScaled(arm, axis, -Vector3.dot(arm, axis));
    if (Vector3.length(radial) === 0) return point;
    const normal: IAutoMovieVector3 = Vector3.normalize(radial);
    const only: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map([[bone, thigh]]);
    let surface: number = -Infinity;
    for (const placed of HumanColliders.placed(body, only))
      for (const shape of placed.shapes)
        surface = Math.max(surface, physicalShapeSpan(placed.pose, shape, normal)[1]);
    if (surface === -Infinity) return point;
    const depth: number = handReach(body, { ...shaped, limbs: {} }, side, rotation, "wrist")(Vector3.scale(normal, -1));
    return Vector3.addScaled(point, normal, Math.max(0, surface + depth - Vector3.dot(point, normal)));
  }

  /** Actuate the fingers of each placed hand along with its wrist. */
  function flattened(
    posture: IAutoMovieMotionHumanPosture,
    sides: readonly AutoMovieHumanSide[],
    share: number,
  ): IAutoMovieMotionHumanPosture {
    if (sides.length === 0) return posture;
    const joints: IAutoMovieMotionHumanPosture["joints"] = { ...posture.joints };
    for (const side of sides) {
      const flat: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(side, "flat");
      for (const bone of Object.keys(flat) as AutoMovieHumanoidBone[]) {
        const from = joints[bone] ?? [0, 0, 0];
        const to = flat[bone]!;
        joints[bone] = [
          from[0] + share * (to[0] - from[0]),
          from[1] + share * (to[1] - from[1]),
          from[2] + share * (to[2] - from[2]),
        ];
      }
    }
    return { ...posture, joints };
  }

  /** Measure only target surfaces this invocation will return. */
  function thighs(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    sides: readonly AutoMovieHumanSide[],
    skin?: PalmRests,
  ): IAutoMovieMotionHumanPosture["limbs"] {
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
    for (const side of sides) {
      const frame: IAutoMovieMotionHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
        body.surfaces.regions[
          `thighFront${side === "left" ? "Left" : "Right"}` as AutoMovieHumanoidRegion
        ];
      const thigh: IAutoMovieResolvedBone = bones.get(frame.bone)!;
      const point: IAutoMovieVector3 = Vector3.add(
        thigh.worldPosition,
        Quaternion.rotateVector(thigh.worldRotation, frame.point),
      );
      const normal: IAutoMovieVector3 = Quaternion.rotateVector(
        thigh.worldRotation,
        frame.normal,
      );
      const along: IAutoMovieVector3 = Vector3.subtract(
        bones.get(`${side}LowerLeg`)!.worldPosition,
        thigh.worldPosition,
      );
      const rotation: IAutoMovieQuaternion = HumanHand.rotation(side, {
        fingers: along,
        palm: Vector3.scale(normal, -1),
      });
      limbs[`${side}Arm`] = AutoMovieMotionHumanArm.goal(body, side, {
        surface: "palm",
        shape: "flat",
        point: laid(body, posture, side, rotation, frame.bone, thigh, point, normal, skin?.[side]),
        rotation,
        bend: AutoMovieMotionHumanBend.hang(body, posture, side, 0.2),
      });
    }
    return limbs;
  }

  /**
   * The palm's place on a thigh: the thigh's own collider met along the
   * surface's normal, by a ray from outside the thigh's bounding ball, then
   * the flat hand's colliders kept clear of it by how far they reach past
   * the palm toward the thigh (`handReach`), so the resting hand touches the
   * thigh without entering it. The surface region's point stands in where
   * the ray finds no collider.
   */
  function laid(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    rotation: IAutoMovieQuaternion,
    bone: AutoMovieHumanoidBone,
    thigh: IAutoMovieResolvedBone,
    point: IAutoMovieVector3,
    normal: IAutoMovieVector3,
    prepared?: PalmRests[AutoMovieHumanSide],
  ): IAutoMovieVector3 {
    const inward: IAutoMovieVector3 = Vector3.scale(normal, -1);
    const skin: IAutoMovieVector3 = prepared === undefined
      ? prepareThighSkin.cast(body, new Map([[bone, thigh]]), point, normal)
      : prepared.skin(thigh);
    const depth: number = prepared === undefined
      ? handReach(body, { ...posture, limbs: {} }, side, rotation, "palm", "flat")(inward)
      : prepared.reach(Quaternion.rotateVector(Quaternion.inverse(rotation), inward));
    return Vector3.addScaled(skin, normal, depth);
  }

  /** Resolve this call's observed frames under the canonical demand guards. */
  function resolved(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    requested: ReadonlySet<AutoMovieHumanoidBone> | undefined,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    return poseBones(
      body,
      resolveHumanPosture.seeded(
        body,
        posture,
        undefined,
        undefined,
        read,
        requested,
        projection,
      ).pose,
      read(),
      requested,
    );
  }

  /** Surface bones and knees determine targets; hanging origins also need wrists. */
  function thighBones(
    body: IAutoMovieMotionHumanBody,
    sides: readonly AutoMovieHumanSide[],
    wrists: boolean,
  ): ReadonlySet<AutoMovieHumanoidBone> {
    const requested: Set<AutoMovieHumanoidBone> = new Set();
    for (const side of sides) {
      requested.add(
        body.surfaces.regions[`thighFront${side === "left" ? "Left" : "Right"}`]
          .bone,
      );
      requested.add(`${side}LowerLeg`);
      if (wrists) requested.add(`${side}Hand`);
    }
    return requested;
  }

  /** The body's fixed bilateral ordering, shared by every placement. */
  const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];
}

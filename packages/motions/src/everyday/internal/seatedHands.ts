import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { writtenHumanSeeds } from "../../posture/internal/writtenHumanSeeds";
import { seatedFlatHand } from "./seatedFlatHand";
import { seatedHandsThighs } from "./seatedHandsThighs";

/**
 * Seated hand placements on the thighs and armrests. A placement invocation
 * owns its resolved bones so its target and hanging origin share one solve.
 * Optional FK/ROM sources are borrowed only for the synchronous placement;
 * every current joint and relevant goal is still admitted and fitted.
 */
export namespace seatedHands {
  /**
   * Lay both palms on their own front thighs, fingers toward the knees. The
   * input's leg goals are solved before the surface is measured.
   */
  export function hands(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side?: AutoMovieHumanSide,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
    skin?: PalmRests,
  ): IAutoMovieMotionHumanPosture["limbs"] {
    const sides: readonly AutoMovieHumanSide[] =
      side === undefined ? SIDES : [side];
    return seatedHandsThighs.thighs(
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
      skin,
    );
  }

  /**
   * Move the hands from their posed hanging origins to their thighs by a
   * caller-eased share, clamped by the endpoint branches at zero and one.
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
   * Rest each hand on its armrest when supplied, otherwise on its thigh. Inputs
   * contain placed legs and directly authored hanging arms; share is zero
   * hanging to one bearing, and armrest coordinates are world metres.
   */
  export function rested(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    rests: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> | undefined,
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
   * The bearing wrist that puts the body's flat palm on an armrest, palm down
   * and fingers along the seat's yaw, in world metres and degrees.
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
    const palm: IAutoMovieVector3 = Quaternion.rotateVector(
      rotation,
      HumanHand.offset(body, side, "palm", "flat").point,
    );
    const underside: IAutoMovieVector3 = { x: 0, y: Math.min(0, palm.y), z: 0 };
    return {
      point: Vector3.subtract(rest, underside),
      contact: Quaternion.rotateVector(Quaternion.inverse(rotation), underside),
      rotation,
      bend: AutoMovieMotionHumanBend.hang(body, posture, side, 0.2),
      planted: true,
    };
  }

  /**
   * Move supplied hands from their directly posed frames onto world-metre
   * armrest points, palms down, fingers along yaw in degrees. Other hand goals
   * remain; a hand bears when share reaches one. The hanging origins are read
   * with the leg goals alone, then each point is interpolated linearly and each
   * palm-down goal slerped; a nonpositive share returns the posture as given,
   * and out-of-reach armrests are left to the contact audit.
   */
  function onArmrests(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    rests: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>,
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

  /**
   * Preserve the public spread-then-leg-read order and its original
   * present-goal observations.
   */
  function legsOnly(
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanPosture["limbs"] {
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
    rests: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>,
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
      const goal: IAutoMovieHumanLimbGoal = armrest(
        body,
        posture,
        side,
        rest,
        yaw,
      );
      limbs[`${side}Arm`] =
        s >= 1
          ? goal
          : {
              point: Vector3.lerp(hand.worldPosition, goal.point, s),
              rotation: Quaternion.slerp(hand.worldRotation, goal.rotation!, s),
              bend: goal.bend,
            };
    }
    return flattened(
      body,
      { ...posture, limbs },
      SIDES.filter(
        (side: AutoMovieHumanSide): boolean => rests[side] !== undefined,
      ),
      s,
    );
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
    const goals: IAutoMovieMotionHumanPosture["limbs"] =
      seatedHandsThighs.thighs(body, posture, bones, sides, skin);
    if (share >= 1)
      return flattened(
        body,
        { ...posture, limbs: { ...posture.limbs, ...goals } },
        sides,
        1,
      );
    const shaped: IAutoMovieMotionHumanPosture = flattened(
      body,
      posture,
      sides,
      share,
    );
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    for (const side of sides) {
      const goal: IAutoMovieHumanLimbGoal = goals[`${side}Arm`]!;
      const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
      const point: IAutoMovieVector3 = Vector3.lerp(
        hand.worldPosition,
        goal.point,
        share,
      );
      const rotation: IAutoMovieQuaternion = Quaternion.slerp(
        hand.worldRotation,
        goal.rotation!,
        share,
      );
      limbs[`${side}Arm`] = {
        point: seatedHandsThighs.clearThigh(
          body,
          shaped,
          side,
          bones,
          point,
          rotation,
        ),
        rotation,
        bend: goal.bend,
      };
    }
    return { ...shaped, limbs };
  }

  /**
   * Actuate the fingers of each placed hand along with its wrist: the flat hand
   * with its thumb's metacarpal twisted until the thumb clears the palmar plane
   * (`bendFloorHand`), so a palm laid on a thigh or an armrest does not drive
   * its thumb into it.
   */
  function flattened(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    sides: readonly AutoMovieHumanSide[],
    share: number,
  ): IAutoMovieMotionHumanPosture {
    let out: IAutoMovieMotionHumanPosture = posture;
    for (const side of sides) {
      out = seatedFlatHand(body, out, side, share);
    }
    return out;
  }

  /**
   * Resolve this call's observed frames under the canonical demand guards, each
   * goal limb placed at the swivel its written joints give it
   * (`writtenHumanSeeds`), never swept cold at every read.
   */
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
        writtenHumanSeeds(body, posture),
        read,
        requested,
        projection,
      ).pose,
      read(),
      requested,
    );
  }

  /**
   * Surface bones and knees determine targets; hanging origins also need
   * wrists.
   */
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
      requested.add(`${side}UpperArm`);
      if (wrists) requested.add(`${side}Hand`);
    }
    return requested;
  }

  /** The body's fixed bilateral ordering, shared by every placement. */
  const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];
}

/** Profile-local thigh intersections and hand extents for this seated phase. */
type PalmRests = seatedHandsThighs.PalmRests;

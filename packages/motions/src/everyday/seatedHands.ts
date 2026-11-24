import {
  DEFAULT_HUMANOID_ROM,
  Quaternion,
  Vector3,
  physicalShapeSpan,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieAngleRange,
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
import { writtenHumanSeeds } from "../posture/writtenHumanSeeds";
import { handReach } from "./handReach";
import type { prepareSeatedPalms } from "./prepareSeatedPalms";
import { prepareThighSkin } from "./prepareThighSkin";
import { seatedFlatHand } from "./seatedFlatHand";

/**
 * A hand's breadth across the palm as a share of its length (provisional
 * anthropometric ratio).
 */
const PALM_BREADTH: number = 0.45;

/** Profile-local thigh intersections and hand extents for this seated phase. */
type PalmRests = ReturnType<typeof prepareSeatedPalms>;

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
    const goals: IAutoMovieMotionHumanPosture["limbs"] = thighs(
      body,
      posture,
      bones,
      sides,
      skin,
    );
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
        point: clearThigh(body, shaped, side, bones, point, rotation),
        rotation,
        bend: goal.bend,
      };
    }
    return { ...shaped, limbs };
  }

  /**
   * Separate the moving hand from the current thigh along the wrist's radial
   * direction. The two convex support extents give the least outward
   * translation on that ray, in metres.
   */
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
    const axis: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(
        bones.get(`${side}LowerLeg`)!.worldPosition,
        thigh.worldPosition,
      ),
    );
    const arm: IAutoMovieVector3 = Vector3.subtract(point, thigh.worldPosition);
    const radial: IAutoMovieVector3 = Vector3.addScaled(
      arm,
      axis,
      -Vector3.dot(arm, axis),
    );
    if (Vector3.length(radial) === 0) return point;
    const normal: IAutoMovieVector3 = Vector3.normalize(radial);
    const only: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      new Map([[bone, thigh]]);
    let surface: number = -Infinity;
    for (const placed of HumanColliders.placed(body, only))
      for (const shape of placed.shapes)
        surface = Math.max(
          surface,
          physicalShapeSpan(placed.pose, shape, normal)[1],
        );
    if (surface === -Infinity) return point;
    const depth: number = handReach(
      body,
      { ...shaped, limbs: {} },
      side,
      rotation,
      "wrist",
    )(Vector3.scale(normal, -1));
    return Vector3.addScaled(
      point,
      normal,
      Math.max(0, surface + depth - Vector3.dot(point, normal)),
    );
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
      // The palm lies on the thigh at any heading about its normal: the
      // fingers point along the thigh where the arm's own line from the
      // shoulder to the contact allows it, and within the wrist's deviation
      // of that line otherwise (`heading`). Along an astride rider's splayed
      // thigh the fingers asked the forearm for a twist beyond its range,
      // which the fit met at the range's end with the forearm folded into
      // the trunk.
      const along: IAutoMovieVector3 = Vector3.subtract(
        bones.get(`${side}LowerLeg`)!.worldPosition,
        thigh.worldPosition,
      );
      const reach: IAutoMovieVector3 = Vector3.subtract(
        point,
        bones.get(`${side}UpperArm`)!.worldPosition,
      );
      const laidReach: IAutoMovieVector3 = Vector3.addScaled(
        reach,
        normal,
        -Vector3.dot(reach, normal),
      );
      const rotation: IAutoMovieQuaternion = HumanHand.rotation(side, {
        fingers: heading(
          side,
          along,
          laidReach,
          normal,
          Vector3.subtract(thigh.worldPosition, posture.root),
        ),
        palm: Vector3.scale(normal, -1),
      });
      limbs[`${side}Arm`] = AutoMovieMotionHumanArm.goal(body, side, {
        surface: "palm",
        shape: "flat",
        point: laid(
          body,
          posture,
          side,
          rotation,
          frame.bone,
          thigh,
          point,
          normal,
          skin?.[side],
        ),
        rotation,
        bend: AutoMovieMotionHumanBend.hang(body, posture, side, 0.2),
      });
    }
    return limbs;
  }

  /**
   * The palm's place on a thigh: the thigh's own collider met along the
   * surface's normal, by a ray from outside the thigh's bounding ball, then the
   * flat hand's colliders kept clear of it by how far they reach past the palm
   * toward the thigh (`handReach`) and by the thigh's curve under the palm's
   * sides, so the resting hand touches the thigh without entering it. The
   * surface region's point stands in where the ray finds no collider.
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
    const skin: IAutoMovieVector3 =
      prepared === undefined
        ? prepareThighSkin.cast(body, new Map([[bone, thigh]]), point, normal)
        : prepared.skin(thigh);
    const depth: number =
      prepared === undefined
        ? handReach(
            body,
            { ...posture, limbs: {} },
            side,
            rotation,
            "palm",
            "flat",
          )(inward)
        : prepared.reach(
            Quaternion.rotateVector(Quaternion.inverse(rotation), inward),
          );
    // The thigh curves away under the palm's sides, which the reach along
    // the normal at its middle does not see: the flat hand is lifted by the
    // sagitta of its half breadth on the thigh's radius, so its thumb and
    // little finger clear the curve too.
    const half: number = (PALM_BREADTH * body.measure.hand) / 2;
    const sagitta: number = (half * half) / (2 * body.measure.thighRadius);
    return Vector3.addScaled(skin, normal, depth + sagitta);
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

/**
 * The fingers' direction for a palm laid on a surface: the surface's own
 * direction (along the thigh) where it lies within the wrist's deviation of the
 * arm's line laid into the surface, else that line turned by the deviation
 * toward it. The deviation is the side of the rig's wrist deviation range
 * (`DEFAULT_HUMANOID_ROM`, the hand's abduction) the turn goes to: for a palm
 * laid down, fingers turned away from the body's midline turn toward the little
 * finger, ulnar deviation, the wider side of the range, and fingers turned
 * toward the midline radially, the narrower (the table's -30 and 20 degrees;
 * the American Academy of Orthopaedic Surgeons' norms, Greene and Heckman 1994,
 * give ulnar 30 and radial 20).
 */
function heading(
  side: AutoMovieHumanSide,
  along: IAutoMovieVector3,
  reach: IAutoMovieVector3,
  normal: IAutoMovieVector3,
  lateral: IAutoMovieVector3,
): IAutoMovieVector3 {
  const laid: IAutoMovieVector3 = Vector3.addScaled(
    along,
    normal,
    -Vector3.dot(along, normal),
  );
  if (Vector3.length(reach) <= 1e-9 || Vector3.length(laid) <= 1e-9)
    return along;
  const range: IAutoMovieAngleRange =
    DEFAULT_HUMANOID_ROM[`${side}Hand`]!.abduction!;
  const n: IAutoMovieVector3 = Vector3.normalize(normal);
  const r: IAutoMovieVector3 = Vector3.normalize(reach);
  const a: IAutoMovieVector3 = Vector3.normalize(laid);
  const ulnar: boolean = Vector3.dot(Vector3.subtract(a, r), lateral) > 0;
  const deviation: number = ulnar
    ? Math.max(Math.abs(range.min), Math.abs(range.max))
    : Math.min(Math.abs(range.min), Math.abs(range.max));
  const turn: number =
    (Math.atan2(Vector3.dot(Vector3.cross(r, a), n), Vector3.dot(r, a)) * 180) /
    Math.PI;
  if (Math.abs(turn) <= deviation) return along;
  return Quaternion.rotateVector(
    Quaternion.fromAxisAngle(n, Math.sign(turn) * deviation),
    r,
  );
}

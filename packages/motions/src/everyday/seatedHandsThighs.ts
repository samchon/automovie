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
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanHand } from "../posture/HumanHand";
import { handReach } from "./handReach";
import type { prepareSeatedPalms } from "./prepareSeatedPalms";
import { prepareThighSkin } from "./prepareThighSkin";
import { seatedFlatHand } from "./seatedFlatHand";

/**
 * A hand's breadth across the palm as a share of its length (provisional
 * anthropometric ratio).
 */
const PALM_BREADTH: number = 0.45;
/**
 * Seated palms on the thighs (`seatedHands`): each palm's goal laid on its own
 * front thigh, fingers along the thigh within the wrist's deviation of the
 * arm's line, met on the thigh's own collider and kept clear of it by the flat
 * hand's reach and the thigh's curve, and a moving hand separated from the
 * thigh along the wrist's radial direction.
 */
export namespace seatedHandsThighs {
  /** Profile-local thigh intersections and hand extents for a seated phase. */
  export type PalmRests = ReturnType<typeof prepareSeatedPalms>;
  /**
   * Separate the moving hand from the current thigh along the wrist's radial
   * direction. The two convex support extents give the least outward
   * translation on that ray, in metres.
   */
  export function clearThigh(
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

  /** Measure only target surfaces this invocation will return. */
  export function thighs(
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
            seatedFlatHand(body, { ...posture, limbs: {} }, side, 1),
            side,
            rotation,
            "palm",
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

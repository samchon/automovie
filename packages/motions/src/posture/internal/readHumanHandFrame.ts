import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, AutoMovieHumanoidRegion, IAutoMovieHumanoidSurfaces, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanHand, IAutoMovieQuaternion, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

/*
 * Read a hand surface using its actual body-declared digit region bone.
 * HumanHand owns surface classification and local offset construction.
 */
export function readHumanHandFrame(
  body: IAutoMovieMotionHumanBody,
  bones: Bones,
  side: AutoMovieHumanSide,
  surface: IAutoMovieMotionHumanHand.Surface,
  offset: () => IAutoMovieMotionHumanHand.IFrame,
  digital: boolean,
): IAutoMovieMotionHumanHand.IFrame {
  const hand: WorldBone = bones.get(`${side}Hand`)!;
  const local: IAutoMovieMotionHumanHand.IFrame = offset();
  const turn: (v: IAutoMovieVector3) => IAutoMovieVector3 = (
    v: IAutoMovieVector3,
  ): IAutoMovieVector3 => AutoMovieEngineQuaternion.rotateVector(hand.worldRotation, v);
  if (!digital)
    return {
      point: worldPoint(hand.worldPosition, local.point, hand.worldRotation),
      normal: turn(local.normal),
      forward: turn(local.forward),
    };
  const actual: IAutoMovieHumanoidSurfaces.IFrame = region(body, side, surface);
  const placed: ReturnType<typeof AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace> =
    AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(actual, bones.get(actual.bone)!);
  return {
    point: placed.point,
    normal: placed.normal,
    forward: turn(local.forward),
  };
}

/*
 * Exact world-bone demand and fixed point geometry of a hand-surface read.
 */
export namespace readHumanHandFrame {
  /*
   * Prepare a point-only read for fixed admitted body/side/surface/form
   * geometry. The first non-digit read looks up the hand before
   * acquiring/copying its offset, then each actual bones map produces one fresh
   * world point through the same cold numerical owner. No normal/forward world
   * rotations run. Digital surfaces retain the complete original frame path,
   * including current actual region/custom-bone lookup, offset order and
   * hand-forward behavior. Release this fixed local-point reader with its
   * owner; it keeps no pose, bones map, queried time, world point or result
   * history.
   */
  export function preparePoint(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    surface: IAutoMovieMotionHumanHand.Surface,
    offset: () => IAutoMovieMotionHumanHand.IFrame,
    digital: boolean,
  ): (bones: Bones) => IAutoMovieVector3 {
    if (digital)
      return (bones: Bones): IAutoMovieVector3 =>
        readHumanHandFrame(body, bones, side, surface, offset, true).point;
    let local: IAutoMovieVector3 | undefined;
    return (bones: Bones): IAutoMovieVector3 => {
      const hand: WorldBone = bones.get(`${side}Hand`)!;
      if (local === undefined) {
        const point: IAutoMovieVector3 = offset().point;
        local = { x: point.x, y: point.y, z: point.z };
      }
      return worldPoint(hand.worldPosition, local, hand.worldRotation);
    };
  }

  /*
   * Request precisely the frames the same surface read consumes.
   *
   * The boolean is HumanHand.digital's result for this surface; output is a
   * fresh set containing hand and any actual digital-region bone. The returned
   * dependency names mirror the numerical frame reader's actual map lookups.
   * One hand insertion and the same optional region lookup avoid duplicating
   * region-bone policy in consumers. No pose, guessed distal bone, default
   * region or unrelated body frame substitutes for declared geometry. Constant
   * lookup and at most two set entries without FK or a body traversal. The
   * query coordinates no retained work. Returns a fresh caller-owned set and
   * retains no body or metadata.
   */
  export function bones(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    surface: IAutoMovieMotionHumanHand.Surface,
    digital: boolean,
  ): ReadonlySet<AutoMovieHumanoidBone> {
    const requested: Set<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([`${side}Hand`]);
    if (digital) requested.add(region(body, side, surface).bone);
    return requested;
  }
}

/*
 * Current rigid world frames read by both complete and point-only hand queries.
 */
type Bones = ReadonlyMap<AutoMovieHumanoidBone, WorldBone>;
/*
 * The alternatives of `WorldBone2`'s site.
 */
type WorldBone2 = "worldPosition" | "worldRotation";

/*
 * The two current world transform values used by hand-surface seating.
 */
type WorldBone = Pick<IAutoMovieResolvedBone, WorldBone2>;

/*
 * Preserve cold point arithmetic and its position/local-point/rotation argument
 * order.
 */
function worldPoint(
  position: IAutoMovieVector3,
  point: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
): IAutoMovieVector3 {
  return AutoMovieEngineVector3.add(position, AutoMovieEngineQuaternion.rotateVector(rotation, point));
}

/*
 * Preserve the original body-owned digital surface key and its actual bone.
 */
function region(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  surface: IAutoMovieMotionHumanHand.Surface,
): IAutoMovieHumanoidSurfaces.IFrame {
  return body.surfaces.regions[
    `${surface}${side === "left" ? "Left" : "Right"}` as AutoMovieHumanoidRegion
  ];
}

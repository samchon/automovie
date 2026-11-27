import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  AutoMovieHumanoidSocket,
  IAutoMovieHumanoidSurfaceRays,
  IAutoMovieHumanoidSurfaceRegions,
  IAutoMovieHumanoidSurfaces,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { AutoMovieHumanoidSurfaceRays } from "../AutoMovieHumanoidSurfaceRays";
import { AutoMovieHumanoidSurfaceRegions } from "../AutoMovieHumanoidSurfaceRegions";
import { AutoMovieHumanoidDigitSurfaces } from "./AutoMovieHumanoidDigitSurfaces";
import type { AutoMovieHumanoidNeutralBounds } from "./AutoMovieHumanoidNeutralBounds";
import { AutoMovieHumanoidSurfaceExtents } from "./AutoMovieHumanoidSurfaceExtents";
import { AutoMovieHumanoidSurfacePlacement } from "./AutoMovieHumanoidSurfacePlacement";

/**
 * Resolve every anatomical region and contact socket of a canonical humanoid
 * onto its collision shapes, as bone-local frames that follow any pose.
 *
 * The rig must rest in the canonical VRM T-pose frame (+Y up, facing +Z, the
 * left toward +X). A region is defined by its bone, a station on the bone's
 * segment (a share of the way from the bone's joint toward a child joint, or
 * the centre of the bone's colliders) and an outward direction in the rest
 * frame; its point is where a ray from the station along the direction leaves
 * the bone's colliders (exact ray exits of spheres, capsules and boxes; the
 * colliders are convex and closed, so the union's exit is the largest and a
 * station on a face counts as inside), and its normal is the outward normal of
 * the collider it leaves there (surfaceNormal): the authored direction only
 * finds the point, as a contact frame's normal is the collision geometry's. A
 * normal read from the direction instead stood up to 44 degrees off the surface
 * (the nape's 24), so a palm laid flat on it sank its heel 14.8 mm into the
 * neck. This is how authored hit and touch locations are placed on character
 * physics bodies in game engines (a bone plus a local offset on its collider),
 * generalised so the offset comes from the body's own shapes and fits any size.
 * The palm, sole, heel and seat regions share their sockets' points, and every
 * digit's tip and pad ride its distal phalanx
 * (`AutoMovieHumanoidDigitSurfaces`): the tip the exit of a ray along the
 * phalanx, the pad that of a ray from its middle toward the palm. Sockets of
 * the foot, seat and back are read from the exact axis bounds of their
 * segment's colliders at rest (heel at the back of the sole, ball under the toe
 * joint, toe at the front, sole at the middle, seat under the pelvis, back
 * behind the thorax; when the profile gives the toes their own segment, the toe
 * socket is the front of the toes' colliders on the sole's plane and rides the
 * toes bone, so it bends at the ball and bears when the heel rises about the
 * toes' joint); the palm is the ray exit below the palm's middle, the grip lies
 * 0.025 m out from it, the radius of a 50 mm handle, the power grip's optimal
 * handle size (Grant, Habes and Steward 1992), and the fist lies 0.012 m ahead
 * of the middle knuckle, the metacarpal head's radius.
 *
 * A frame is bone-local: `point` and `normal` (and a socket's `forward`) are
 * expressed in the bone's rest frame relative to its joint, so its world frame
 * under any pose is the bone's world position plus its world rotation applied
 * to them.
 *
 * The left side is the mirror of the right: a left region or socket (and the
 * spleen, the liver's twin) is its right twin's frame mirrored in the median
 * plane (`mirrored`), on the opposite bone, so a left act reads a frame that is
 * the mirror of the right one to the bit, as the rig's own rest is.
 *
 * @param skeleton The canonical rig.
 * @param profile Its physical profile, segments keyed by rig bones.
 * @param neutral Optional genuine internal unchanged-profile bounds epoch,
 *   owned and released by measureAutoMovieHumanoidBody.withSurfaces.
 * @returns Every region and socket.
 * @throws {Error} When a bone or segment a definition needs is missing, or a
 *   ray misses its colliders.
 */
function resolveAutoMovieHumanoidSurfacesRun(
  skeleton: IAutoMovieSkeleton,
  profile: IAutoMoviePhysicalProfile,
  neutral?: AutoMovieHumanoidNeutralBounds.IPrepared,
): IAutoMovieHumanoidSurfaces.ISurfaces {
  const { at, bounds, local, station, exit, surface } =
    AutoMovieHumanoidSurfaceRays.tools(skeleton, profile, neutral);

  const regions = {} as Record<
    AutoMovieHumanoidRegion,
    IAutoMovieHumanoidSurfaces.IFrame
  >;
  for (const [name, def] of Object.entries(
    AutoMovieHumanoidSurfaceRegions.TABLE,
  ) as [
    AutoMovieHumanoidRegion,
    IAutoMovieHumanoidSurfaceRegions.IDefinition,
  ][]) {
    const origin: IAutoMovieVector3 = station(def.station);
    const hit: IAutoMovieHumanoidSurfaceRays.ISurfacePoint = surface(
      def.station.bone,
      origin,
      def.direction,
    );
    regions[name] = local(def.station.bone, hit.point, hit.normal);
  }

  const sockets = {} as Record<
    AutoMovieHumanoidSocket,
    IAutoMovieHumanoidSurfaces.IFrame
  >;
  const down: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };
  const forward: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  for (const Side of ["Left", "Right"] as const) {
    const side: string = Side.toLowerCase();
    const bone = (name: string): AutoMovieHumanoidBone =>
      `${side}${name}` as AutoMovieHumanoidBone;
    const fingers: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(
        at(bone("MiddleProximal")).worldPosition,
        at(bone("Hand")).worldPosition,
      ),
    );
    const palmOrigin: IAutoMovieVector3 = Vector3.lerp(
      at(bone("Hand")).worldPosition,
      at(bone("MiddleProximal")).worldPosition,
      0.5,
    );
    const palm: IAutoMovieVector3 = exit(bone("Hand"), palmOrigin, down);
    sockets[`palm${Side}` as AutoMovieHumanoidSocket] = local(
      bone("Hand"),
      palm,
      down,
      fingers,
    );
    const knuckle: IAutoMovieVector3 = at(bone("MiddleProximal")).worldPosition;
    sockets[`grip${Side}` as AutoMovieHumanoidSocket] = local(
      bone("Hand"),
      Vector3.add(
        exit(bone("Hand"), knuckle, down),
        Vector3.scale(down, GRIP_RADIUS),
      ),
      down,
      forward,
    );
    sockets[`fist${Side}` as AutoMovieHumanoidSocket] = local(
      bone("Hand"),
      Vector3.add(knuckle, Vector3.scale(fingers, KNUCKLE_RADIUS)),
      fingers,
      down,
    );
    const foot = bounds(bone("Foot"));
    const ankle: IAutoMovieVector3 = at(bone("Foot")).worldPosition;
    const toes: IAutoMovieVector3 = at(bone("Toes")).worldPosition;
    const jointed: boolean = profile.segments.some(
      (x: IAutoMoviePhysicalSegment): boolean => x.bone === bone("Toes"),
    );
    const front = jointed ? bounds(bone("Toes")) : foot;
    const sole = (z: number): IAutoMovieVector3 => ({
      x: ankle.x,
      y: foot.min.y,
      z,
    });
    sockets[`heel${Side}` as AutoMovieHumanoidSocket] = local(
      bone("Foot"),
      sole(foot.min.z),
      down,
      forward,
    );
    sockets[`ball${Side}` as AutoMovieHumanoidSocket] = local(
      bone("Foot"),
      { x: toes.x, y: foot.min.y, z: toes.z },
      down,
      forward,
    );
    sockets[`toe${Side}` as AutoMovieHumanoidSocket] = local(
      jointed ? bone("Toes") : bone("Foot"),
      { x: ankle.x, y: foot.min.y, z: front.max.z },
      down,
      forward,
    );
    sockets[`sole${Side}` as AutoMovieHumanoidSocket] = local(
      bone("Foot"),
      sole((foot.min.z + front.max.z) / 2),
      down,
      forward,
    );
  }
  const pelvis = bounds("hips");
  sockets.seat = local(
    "hips",
    { x: 0, y: pelvis.min.y, z: (pelvis.min.z + pelvis.max.z) / 2 },
    down,
    forward,
  );

  // Contact points the body presents are regions too: the palm, the sole,
  // the heel and the seat take their sockets' points, and each digit's tip
  // and pad ride its distal phalanx.
  regions.seat = { ...sockets.seat };
  for (const Side of ["Left", "Right"] as const) {
    regions[`palm${Side}` as AutoMovieHumanoidRegion] = {
      ...sockets[`palm${Side}` as AutoMovieHumanoidSocket],
    };
    regions[`sole${Side}` as AutoMovieHumanoidRegion] = {
      ...sockets[`sole${Side}` as AutoMovieHumanoidSocket],
    };
    regions[`heel${Side}` as AutoMovieHumanoidRegion] = {
      ...sockets[`heel${Side}` as AutoMovieHumanoidSocket],
    };
  }
  Object.assign(
    regions,
    AutoMovieHumanoidDigitSurfaces({ at, local, surface }, profile),
  );
  const thorax = bounds("chest");
  sockets.back = local(
    "chest",
    { x: 0, y: (thorax.min.y + thorax.max.y) / 2, z: thorax.min.z },
    { x: 0, y: 0, z: -1 },
    { x: 0, y: 1, z: 0 },
  );
  // Each region's extent about its point.
  const radii: Record<AutoMovieHumanoidRegion, number> =
    AutoMovieHumanoidSurfaceExtents(regions, at, bounds);
  for (const name of Object.keys(regions) as AutoMovieHumanoidRegion[])
    regions[name] = { ...regions[name], radius: radii[name] };
  // The body's left is the mirror of its right: each left region and socket
  // is its right twin's frame mirrored, so the two sides are mirror images
  // to the bit, whatever the rounding of the rays that placed the right.
  for (const name of Object.keys(regions) as AutoMovieHumanoidRegion[]) {
    const right: AutoMovieHumanoidRegion | undefined =
      resolveAutoMovieHumanoidSurfaces.twin(name);
    if (right !== undefined)
      regions[name] = resolveAutoMovieHumanoidSurfaces.mirrored(regions[right]);
  }
  for (const name of Object.keys(sockets) as AutoMovieHumanoidSocket[])
    if (name.endsWith("Left"))
      sockets[name] = resolveAutoMovieHumanoidSurfaces.mirrored(
        sockets[name.replace(/Left$/, "Right") as AutoMovieHumanoidSocket],
      );
  // A median frame is its own mirror image, so its lateral components are
  // nought to the bit: a left act mirrored to the right reads the very
  // frame a right act does, whatever the rounding of the rays.
  for (const name of Object.keys(regions) as AutoMovieHumanoidRegion[])
    if (resolveAutoMovieHumanoidSurfaces.median(name))
      regions[name] = resolveAutoMovieHumanoidSurfaces.centred(regions[name]);
  for (const name of Object.keys(sockets) as AutoMovieHumanoidSocket[])
    if (!name.endsWith("Left") && !name.endsWith("Right"))
      sockets[name] = resolveAutoMovieHumanoidSurfaces.centred(sockets[name]);
  return { regions, sockets };
}

/** Companion types and helpers of {@link resolveAutoMovieHumanoidSurfaces}. */
export namespace resolveAutoMovieHumanoidSurfaces {
  /** Execute the operation without merging a callable with this namespace. */
  export const run = resolveAutoMovieHumanoidSurfacesRun;
  /**
   * Fresh world point, metres, without normal/forward reads or rotations. Uses
   * place's original local-to-world expression; inputs are admitted.
   */
  export const point: typeof AutoMovieHumanoidSurfacePlacement.point =
    AutoMovieHumanoidSurfacePlacement.point;

  /** Fresh world normal without observing point, parent position or forward. */
  export const normal: typeof AutoMovieHumanoidSurfacePlacement.normal =
    AutoMovieHumanoidSurfacePlacement.normal;

  /**
   * Fresh world point and normal, without observing an unused forward
   * direction.
   */
  export const pointNormal: typeof AutoMovieHumanoidSurfacePlacement.pointNormal =
    AutoMovieHumanoidSurfacePlacement.pointNormal;

  /**
   * A surface frame's world point and normal under a posed bone.
   *
   * @param frame The bone-local frame.
   * @param bone The bone's resolved world placement.
   * @returns World point (metres) and unit normal.
   */
  export function place(
    frame: IAutoMovieHumanoidSurfaces.IFrame,
    bone: Parameters<typeof AutoMovieHumanoidSurfacePlacement.run>[1],
  ): ReturnType<typeof AutoMovieHumanoidSurfacePlacement.run> {
    return AutoMovieHumanoidSurfacePlacement.run(frame, bone);
  }

  /**
   * Whether a region is placed by a ray, so `offset` accepts it.
   *
   * @param region The region.
   * @returns False for the palms, soles, heels, seat and the digits' tips and
   *   pads, which take a socket's point or a phalanx's line.
   */
  export function rayed(region: AutoMovieHumanoidRegion): boolean {
    return AutoMovieHumanoidSurfaceRegions.TABLE[region] !== undefined;
  }

  /**
   * A point of a region's surface beside the region's own point.
   *
   * The region's ray leaves its station along its direction and meets the
   * colliders at the region's point. The offset names a point of the plane
   * through that point, perpendicular to the direction. The result is where the
   * ray from the same station through the offset point leaves the colliders,
   * with the colliders' outward normal there, so it lies on the body's surface
   * for any offset and equals the region's frame at zero.
   *
   * @param skeleton The canonical rig.
   * @param profile Its physical profile, segments keyed by rig bones.
   * @param region A region placed by a ray: every region but the palms, soles,
   *   heels, seat and the digits' tips and pads.
   * @param tangent The offset on the region's tangent plane.
   * @returns The bone-local frame of the surface point.
   * @throws {Error} When the region is not placed by a ray, or a bone or
   *   segment it needs is missing.
   */
  export function offset(
    skeleton: IAutoMovieSkeleton,
    profile: IAutoMoviePhysicalProfile,
    region: AutoMovieHumanoidRegion,
    tangent: IAutoMovieHumanoidSurfaces.ITangent,
  ): IAutoMovieHumanoidSurfaces.IFrame {
    const def: IAutoMovieHumanoidSurfaceRegions.IDefinition | undefined =
      AutoMovieHumanoidSurfaceRegions.TABLE[region];
    if (def === undefined)
      throw new Error(`The region ${region} is not placed by a ray`);
    // A left region's surface point is its right twin's mirrored, the twin's
    // `out` the mirror of this one's, so the two sides stay mirror images.
    const right: AutoMovieHumanoidRegion | undefined = twin(region);
    if (right !== undefined)
      return mirrored(
        offset(skeleton, profile, right, { up: tangent.up, out: -tangent.out }),
      );
    const { local, station, exit, surface } =
      AutoMovieHumanoidSurfaceRays.tools(skeleton, profile);
    const origin: IAutoMovieVector3 = station(def.station);
    const d: IAutoMovieVector3 = Vector3.normalize(def.direction);
    const reference: IAutoMovieVector3 =
      Math.abs(d.y) > 0.9 ? { x: 0, y: 0, z: 1 } : { x: 0, y: 1, z: 0 };
    const up: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(reference, Vector3.scale(d, Vector3.dot(reference, d))),
    );
    const out: IAutoMovieVector3 = Vector3.cross(up, d);
    const ray: IAutoMovieVector3 = Vector3.subtract(
      Vector3.add(
        exit(def.station.bone, origin, d),
        Vector3.add(
          Vector3.scale(up, tangent.up),
          Vector3.scale(out, tangent.out),
        ),
      ),
      origin,
    );
    const toward: IAutoMovieVector3 = Vector3.length(ray) > BOUNDARY ? ray : d;
    const hit: IAutoMovieHumanoidSurfaceRays.ISurfacePoint = surface(
      def.station.bone,
      origin,
      toward,
    );
    return local(def.station.bone, hit.point, hit.normal);
  }

  /**
   * The right twin a left region is the mirror of: the same name on the right,
   * and the liver for the spleen; none for a right or median region.
   *
   * @param region The region.
   * @returns Its right twin, when it is a left region.
   */
  export function twin(
    region: AutoMovieHumanoidRegion,
  ): AutoMovieHumanoidRegion | undefined {
    if (region === "spleen") return "liver";
    return region.endsWith("Left")
      ? (region.replace(/Left$/, "Right") as AutoMovieHumanoidRegion)
      : undefined;
  }

  /**
   * Whether a region lies on the median plane, its own mirror image: neither
   * sided nor one of the liver and spleen pair.
   *
   * @param region The region.
   * @returns Whether it is median.
   */
  export function median(region: AutoMovieHumanoidRegion): boolean {
    return (
      !region.endsWith("Left") &&
      !region.endsWith("Right") &&
      region !== "liver" &&
      region !== "spleen"
    );
  }

  /**
   * A median frame on the median plane to the bit: its point's, normal's and
   * forward's lateral components nought, the frame and its mirror image
   * averaged.
   *
   * @param frame The frame.
   * @returns The frame, its own mirror image.
   */
  export function centred(
    frame: IAutoMovieHumanoidSurfaces.IFrame,
  ): IAutoMovieHumanoidSurfaces.IFrame {
    const plane = (v: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: 0,
      y: v.y,
      z: v.z,
    });
    return {
      ...frame,
      point: plane(frame.point),
      normal: plane(frame.normal),
      ...(frame.forward === undefined ? {} : { forward: plane(frame.forward) }),
    };
  }

  /**
   * A frame's mirror image in the median plane: on the other side's bone, its
   * point, normal and forward with their lateral component negated. A rest
   * frame mirrored across the median plane (`M R M`) maps a bone-local vector
   * to the same vector with its lateral component negated, so the mirror is
   * exact.
   *
   * @param frame The frame.
   * @returns Its mirror image.
   */
  export function mirrored(
    frame: IAutoMovieHumanoidSurfaces.IFrame,
  ): IAutoMovieHumanoidSurfaces.IFrame {
    const flip = (v: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: -v.x,
      y: v.y,
      z: v.z,
    });
    return {
      ...frame,
      bone: (frame.bone.startsWith("left")
        ? `right${frame.bone.slice(4)}`
        : frame.bone.startsWith("right")
          ? `left${frame.bone.slice(5)}`
          : frame.bone) as AutoMovieHumanoidBone,
      point: flip(frame.point),
      normal: flip(frame.normal),
      ...(frame.forward === undefined ? {} : { forward: flip(frame.forward) }),
    };
  }
}

/**
 * Radius of a 50 mm handle, the optimal power-grip size (Grant, Habes and
 * Steward 1992), metres.
 */
const GRIP_RADIUS: number = 0.025;

/**
 * Radius of the third metacarpal head, the fist's striking surface ahead of the
 * knuckle joint, metres.
 */
const KNUCKLE_RADIUS: number = 0.012;

/**
 * Metres a station may sit outside a collider and still count as on it: the
 * colliders are closed sets, so a station on a face or a cap must not miss by
 * rounding.
 */
const BOUNDARY: number = 1e-9;

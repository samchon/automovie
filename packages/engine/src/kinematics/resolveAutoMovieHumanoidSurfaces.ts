import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  AutoMovieHumanoidSocket,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AutoMovieHumanoidSurfaceRays } from "./AutoMovieHumanoidSurfaceRays";
import { AutoMovieHumanoidSurfaceRegions } from "./AutoMovieHumanoidSurfaceRegions";
import type { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";

/**
 * Resolve every anatomical region and contact socket of a canonical humanoid
 * onto its collision shapes, as bone-local frames that follow any pose.
 *
 * The rig must rest in the canonical VRM T-pose frame (+Y up, facing +Z, the
 * left toward +X). A region is defined by its bone, a station on the bone's
 * segment (a share of the way from the bone's joint toward a child joint, or
 * the centre of the bone's colliders) and an outward direction in the rest
 * frame; its point is where a ray from the station along the direction
 * leaves the bone's colliders (exact ray exits of spheres, capsules and boxes;
 * the colliders are convex and closed, so the union's exit is the largest and
 * a station on a face counts as inside), and its normal is the outward normal
 * of the collider it leaves there (surfaceNormal): the authored direction
 * only finds the point, as a contact frame's normal is the collision
 * geometry's. A normal read from the direction instead stood up to 44 degrees
 * off the surface (the nape's 24), so a palm laid flat on it sank its heel
 * 14.8 mm into the neck. This is how authored hit and touch locations are
 * placed on character physics bodies in game engines (a bone plus a local
 * offset on its collider), generalised so the offset comes from the body's
 * own shapes and fits any size. The palm, sole, heel and seat regions share
 * their sockets' points, and the index fingertip region is the exit of a ray
 * along the finger through the distal phalanx's colliders (the hand's when the
 * profile has no phalanx segment), riding the distal phalanx.
 * Sockets of the foot, seat and back are read
 * from the exact axis bounds of their segment's colliders at rest (heel at
 * the back of the sole, ball under the toe joint, toe at the front, sole at
 * the middle, seat under the pelvis, back behind the thorax; when the profile
 * gives the toes their own segment, the toe socket is the front of the toes'
 * colliders on the sole's plane and rides the toes bone, so it bends at the
 * ball and bears when the heel rises about the toes' joint); the palm is the
 * ray exit below the palm's middle, the grip lies 0.025 m out from it, the
 * radius of a 50 mm handle, the power grip's optimal handle size (Grant,
 * Habes and Steward 1992), and the fist lies 0.012 m ahead of the middle
 * knuckle, the metacarpal head's radius.
 *
 * A frame is bone-local: `point` and `normal` (and a socket's `forward`)
 * are expressed in the bone's rest frame relative to its joint, so its world
 * frame under any pose is the bone's world position plus its world rotation
 * applied to them.
 *
 * @param skeleton The canonical rig.
 * @param profile Its physical profile, segments keyed by rig bones.
 * @returns Every region and socket.
 * @throws {Error} When a bone or segment a definition needs is missing, or a ray misses its colliders.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame premise, how each kind of surface is placed and its normal read, the measured defect, the cited grip size and the local frame of the result.
 * @evidence contracts/development/implementation.md#principled-implementation Exact ray exits through convex colliders from anatomical stations and directions, each region's normal the exited collider's outward normal there (smoothed across a box's or a hull's edges), and exact collider bounds for the sole, seat and back.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two definition tables, one ray routine and one bounds routine.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing bone, segment or hit throws rather than inventing a point.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in definitions times colliders per bone.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of the body; callers resolve once per body.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh records and retains nothing.
 */
export function resolveAutoMovieHumanoidSurfaces(
  skeleton: IAutoMovieSkeleton,
  profile: P,
): resolveAutoMovieHumanoidSurfaces.ISurfaces {
  const { at, bounds, local, station, exit, surface } =
    AutoMovieHumanoidSurfaceRays.tools(skeleton, profile);

  const regions = {} as Record<
    AutoMovieHumanoidRegion,
    resolveAutoMovieHumanoidSurfaces.IFrame
  >;
  for (const [name, def] of Object.entries(
    AutoMovieHumanoidSurfaceRegions.TABLE,
  ) as [
    AutoMovieHumanoidRegion,
    AutoMovieHumanoidSurfaceRegions.IDefinition,
  ][]) {
    const origin: IAutoMovieVector3 = station(def.station);
    const hit: AutoMovieHumanoidSurfaceRays.ISurfacePoint = surface(
      def.station.bone,
      origin,
      def.direction,
    );
    regions[name] = local(def.station.bone, hit.point, hit.normal);
  }

  const sockets = {} as Record<
    AutoMovieHumanoidSocket,
    resolveAutoMovieHumanoidSurfaces.IFrame
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
      (x: P.ISegment): boolean => x.bone === bone("Toes"),
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
  // the heel and the seat take their sockets' points, and the index
  // fingertip is where a ray along the finger leaves the hand's colliders,
  // riding the distal phalanx.
  regions.seat = { ...sockets.seat };
  for (const Side of ["Left", "Right"] as const) {
    const side: string = Side.toLowerCase();
    const bone = (name: string): AutoMovieHumanoidBone =>
      `${side}${name}` as AutoMovieHumanoidBone;
    regions[`palm${Side}` as AutoMovieHumanoidRegion] = {
      ...sockets[`palm${Side}` as AutoMovieHumanoidSocket],
    };
    regions[`sole${Side}` as AutoMovieHumanoidRegion] = {
      ...sockets[`sole${Side}` as AutoMovieHumanoidSocket],
    };
    regions[`heel${Side}` as AutoMovieHumanoidRegion] = {
      ...sockets[`heel${Side}` as AutoMovieHumanoidSocket],
    };
    const distal: IAutoMovieVector3 = at(bone("IndexDistal")).worldPosition;
    const along: IAutoMovieVector3 = Vector3.subtract(
      distal,
      at(bone("IndexIntermediate")).worldPosition,
    );
    const phalanx: AutoMovieHumanoidBone = profile.segments.some(
      (x: P.ISegment): boolean => x.bone === bone("IndexDistal"),
    )
      ? bone("IndexDistal")
      : bone("Hand");
    const tip: AutoMovieHumanoidSurfaceRays.ISurfacePoint = surface(
      phalanx,
      distal,
      along,
    );
    regions[`indexTip${Side}` as AutoMovieHumanoidRegion] = local(
      bone("IndexDistal"),
      tip.point,
      tip.normal,
    );
  }
  const thorax = bounds("chest");
  sockets.back = local(
    "chest",
    { x: 0, y: (thorax.min.y + thorax.max.y) / 2, z: thorax.min.z },
    { x: 0, y: 0, z: -1 },
    { x: 0, y: 1, z: 0 },
  );
  return { regions, sockets };
}

/**
 * Companion types and helpers of {@link resolveAutoMovieHumanoidSurfaces}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's frame.
 * @evidence contracts/development/design.md#principled-representation Bone-local points and unit directions keyed by the closed region and socket unions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two maps, the posing helper and the tangent offset motion laws read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Keys are the interface's closed unions, not strings.
 */
export namespace resolveAutoMovieHumanoidSurfaces {
  /** A bone-local surface frame. */
  export interface IFrame {
    /** The bone it rides. */
    bone: AutoMovieHumanoidBone;

    /** Point relative to the bone's joint, in its rest frame, metres. */
    point: IAutoMovieVector3;

    /** Outward unit normal in the bone's rest frame. */
    normal: IAutoMovieVector3;

    /** A socket's forward unit direction in the bone's rest frame. */
    forward?: IAutoMovieVector3;
  }

  /** Every region and socket of one body. */
  export interface ISurfaces {
    /** Regions by name. */
    regions: Record<AutoMovieHumanoidRegion, IFrame>;

    /** Sockets by name. */
    sockets: Record<AutoMovieHumanoidSocket, IFrame>;
  }

  /**
   * A surface frame's world point and normal under a posed bone.
   *
   * @param frame The bone-local frame.
   * @param bone The bone's resolved world placement.
   * @returns World point (metres) and unit normal.
   */
  export function place(
    frame: IFrame,
    bone: Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation">,
  ): {
    point: IAutoMovieVector3;
    normal: IAutoMovieVector3;
    forward?: IAutoMovieVector3;
  } {
    return {
      point: Vector3.add(
        bone.worldPosition,
        Quaternion.rotateVector(bone.worldRotation, frame.point),
      ),
      normal: Quaternion.rotateVector(bone.worldRotation, frame.normal),
      ...(frame.forward === undefined
        ? {}
        : {
            forward: Quaternion.rotateVector(bone.worldRotation, frame.forward),
          }),
    };
  }

  /** A point of a region's tangent plane, measured from the region's own point. */
  export interface ITangent {
    /** Toward the head, metres: the rest frame's +Y made perpendicular to the region's direction, or +Z when that direction is within 26 degrees of vertical. */
    up: number;

    /** Across `up` and the region's direction, metres: toward the body's left for a region that faces forward. */
    out: number;
  }

  /**
   * Whether a region is placed by a ray, so `offset` accepts it.
   *
   * @param region The region.
   * @returns False for the palms, soles, heels, seat and index fingertips, which take a socket's point or a finger's line.
   */
  export function rayed(region: AutoMovieHumanoidRegion): boolean {
    return AutoMovieHumanoidSurfaceRegions.TABLE[region] !== undefined;
  }

  /**
   * A point of a region's surface beside the region's own point.
   *
   * The region's ray leaves its station along its direction and meets the
   * colliders at the region's point. The offset names a point of the plane
   * through that point, perpendicular to the direction. The result is where
   * the ray from the same station through the offset point leaves the
   * colliders, with the colliders' outward normal there, so it lies on the
   * body's surface for any offset and equals the region's frame at zero.
   *
   * @param skeleton The canonical rig.
   * @param profile Its physical profile, segments keyed by rig bones.
   * @param region A region placed by a ray: every region but the palms, soles, heels, seat and index fingertips.
   * @param tangent The offset on the region's tangent plane.
   * @returns The bone-local frame of the surface point.
   * @throws {Error} When the region is not placed by a ray, or a bone or segment it needs is missing.
   */
  export function offset(
    skeleton: IAutoMovieSkeleton,
    profile: P,
    region: AutoMovieHumanoidRegion,
    tangent: ITangent,
  ): IFrame {
    const def: AutoMovieHumanoidSurfaceRegions.IDefinition | undefined =
      AutoMovieHumanoidSurfaceRegions.TABLE[region];
    if (def === undefined)
      throw new Error(`The region ${region} is not placed by a ray`);
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
    const hit: AutoMovieHumanoidSurfaceRays.ISurfacePoint = surface(
      def.station.bone,
      origin,
      toward,
    );
    return local(def.station.bone, hit.point, hit.normal);
  }
}

/** Radius of a 50 mm handle, the optimal power-grip size (Grant, Habes and Steward 1992), metres. */
const GRIP_RADIUS: number = 0.025;

/** Radius of the third metacarpal head, the fist's striking surface ahead of the knuckle joint, metres. */
const KNUCKLE_RADIUS: number = 0.012;

/** Metres a station may sit outside a collider and still count as on it: the colliders are closed sets, so a station on a face or a cap must not miss by rounding. */
const BOUNDARY: number = 1e-9;

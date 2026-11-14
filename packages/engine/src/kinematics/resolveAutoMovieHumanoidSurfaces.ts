import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  AutoMovieHumanoidSocket,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { physicalHullFaces } from "../physics/physicalHullFaces";
import { physicalShapeBounds } from "../physics/physicalShapeBounds";
import { physicalShapeNormal } from "../physics/physicalShapeNormal";
import { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";
import { resolvePose } from "./resolvePose";

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
  const { at, bounds, local, station, exit, surface } = tools(
    skeleton,
    profile,
  );

  const regions = {} as Record<
    AutoMovieHumanoidRegion,
    resolveAutoMovieHumanoidSurfaces.IFrame
  >;
  for (const [name, def] of Object.entries(REGIONS) as [
    AutoMovieHumanoidRegion,
    IRegionDef,
  ][]) {
    const origin: IAutoMovieVector3 = station(def.station);
    const hit: ISurfacePoint = surface(def.station.bone, origin, def.direction);
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
    const tip: ISurfacePoint = surface(phalanx, distal, along);
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
    return REGIONS[region] !== undefined;
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
    const def: IRegionDef | undefined = REGIONS[region];
    if (def === undefined)
      throw new Error(`The region ${region} is not placed by a ray`);
    const { local, station, exit, surface } = tools(skeleton, profile);
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
    const hit: ISurfacePoint = surface(def.station.bone, origin, toward);
    return local(def.station.bone, hit.point, hit.normal);
  }
}

/** A bone-local frame under construction. */
type IFrameLocal = resolveAutoMovieHumanoidSurfaces.IFrame;

/** Where on a segment a region's ray starts. */
interface IStation {
  /** The bone. */
  bone: AutoMovieHumanoidBone;

  /** A child joint to interpolate toward, or the colliders' bounds centre. */
  toward: AutoMovieHumanoidBone | "centre";

  /** Share of the way toward the child joint. */
  share: number;
}

/** A region's station and rest-frame outward direction. */
interface IRegionDef {
  /** Ray origin. */
  station: IStation;

  /** Outward direction in the T-pose rest frame. */
  direction: IAutoMovieVector3;
}

/** Radius of a 50 mm handle, the optimal power-grip size (Grant, Habes and Steward 1992), metres. */
const GRIP_RADIUS: number = 0.025;

/** Radius of the third metacarpal head, the fist's striking surface ahead of the knuckle joint, metres. */
const KNUCKLE_RADIUS: number = 0.012;

/** Metres a station may sit outside a collider and still count as on it: the colliders are closed sets, so a station on a face or a cap must not miss by rounding. */
const BOUNDARY: number = 1e-9;

/** Every region's definition, both sides from one table: +X is the body's left. */
const REGIONS: Readonly<Partial<Record<AutoMovieHumanoidRegion, IRegionDef>>> =
  (() => {
    const v = (x: number, y: number, z: number): IAutoMovieVector3 => ({
      x,
      y,
      z,
    });
    const head: IStation = { bone: "head", toward: "centre", share: 0 };
    const neck: IStation = { bone: "neck", toward: "head", share: 0.5 };
    const chest = (share: number): IStation => ({
      bone: "chest",
      toward: "neck",
      share,
    });
    const spine = (share: number): IStation => ({
      bone: "spine",
      toward: "chest",
      share,
    });
    const table: Partial<Record<AutoMovieHumanoidRegion, IRegionDef>> = {
      crown: { station: head, direction: v(0, 1, 0) },
      forehead: { station: head, direction: v(0, 0.45, 1) },
      face: { station: head, direction: v(0, 0, 1) },
      noseBridge: { station: head, direction: v(0, 0.1, 1) },
      nose: { station: head, direction: v(0, -0.15, 1) },
      mouth: { station: head, direction: v(0, -0.4, 1) },
      chin: { station: head, direction: v(0, -0.75, 0.65) },
      headBack: { station: head, direction: v(0, 0, -1) },
      throat: { station: neck, direction: v(0, 0, 1) },
      nape: { station: neck, direction: v(0, 0, -1) },
      sternum: { station: chest(0.5), direction: v(0, 0, 1) },
      solarPlexus: { station: chest(0), direction: v(0, 0, 1) },
      liver: { station: chest(0.1), direction: v(-0.8, 0, 0.6) },
      spleen: { station: chest(0.1), direction: v(0.8, 0, 0.6) },
      upperBack: { station: chest(0.5), direction: v(0, 0, -1) },
      abdomen: { station: spine(0.4), direction: v(0, 0, 1) },
      lowerBack: { station: spine(0.4), direction: v(0, 0, -1) },
      groin: {
        station: { bone: "hips", toward: "centre", share: 0 },
        direction: v(0, -0.6, 0.8),
      },
    };
    for (const [Side, x] of [
      ["Left", 1],
      ["Right", -1],
    ] as const) {
      const s = (name: string): AutoMovieHumanoidBone =>
        `${Side.toLowerCase()}${name}` as AutoMovieHumanoidBone;
      const set = (name: string, def: IRegionDef): void => {
        table[`${name}${Side}` as AutoMovieHumanoidRegion] = def;
      };
      set("jaw", { station: head, direction: v(0.7 * x, -0.55, 0.45) });
      // The cheek: the zygomatic prominence over the buccal area, at the
      // nose's height (its ray's -0.15) and 40 degrees out from the face's
      // forward ray, tan 40 = 0.84 (provisional).
      set("cheek", { station: head, direction: v(0.84 * x, -0.15, 1) });
      set("temple", { station: head, direction: v(x, 0.25, 0.3) });
      set("ear", { station: head, direction: v(x, 0, 0) });
      set("neck", { station: neck, direction: v(x, 0, 0) });
      set("chest", { station: chest(0.55), direction: v(0.45 * x, 0, 1) });
      set("ribs", { station: chest(0.25), direction: v(x, 0, 0.15) });
      set("kidney", { station: spine(0.8), direction: v(0.6 * x, 0, -0.8) });
      set("hip", {
        station: { bone: s("UpperLeg"), toward: s("LowerLeg"), share: 0 },
        direction: v(x, 0, 0),
      });
      // The top of the shoulder over the acromion, on the thorax's collider
      // at nine tenths of the way from the chest's joint to the shoulder's,
      // facing up and a little out along the trapezius' slope
      // (provisional). It rode the upper arm's capsule before; with the arm
      // hanging, that point and its normal turned to the arm's outer side.
      set("shoulder", {
        station: { bone: "chest", toward: s("UpperArm"), share: 0.9 },
        direction: v(0.3 * x, 1, 0),
      });
      set("upperArm", {
        station: { bone: s("UpperArm"), toward: s("LowerArm"), share: 0.5 },
        direction: v(0, 1, 0),
      });
      set("elbow", {
        station: { bone: s("LowerArm"), toward: s("Hand"), share: 0 },
        direction: v(0, 0, -1),
      });
      set("forearm", {
        station: { bone: s("LowerArm"), toward: s("Hand"), share: 0.5 },
        direction: v(0, 1, 0),
      });
      set("wrist", {
        station: { bone: s("LowerArm"), toward: s("Hand"), share: 0.95 },
        direction: v(0, 1, 0),
      });
      set("pocketFront", {
        station: { bone: s("UpperLeg"), toward: s("LowerLeg"), share: 0.15 },
        direction: v(0.35 * x, 0, 1),
      });
      set("handBack", {
        station: { bone: s("Hand"), toward: s("MiddleProximal"), share: 0.5 },
        direction: v(0, 1, 0),
      });
      set("thighFront", {
        station: { bone: s("UpperLeg"), toward: s("LowerLeg"), share: 0.5 },
        direction: v(0, 0, 1),
      });
      set("thighOuter", {
        station: { bone: s("UpperLeg"), toward: s("LowerLeg"), share: 0.5 },
        direction: v(x, 0, 0),
      });
      set("thighInner", {
        station: { bone: s("UpperLeg"), toward: s("LowerLeg"), share: 0.5 },
        direction: v(-x, 0, 0),
      });
      set("knee", {
        station: { bone: s("LowerLeg"), toward: s("Foot"), share: 0 },
        direction: v(0, 0, 1),
      });
      set("shin", {
        station: { bone: s("LowerLeg"), toward: s("Foot"), share: 0.5 },
        direction: v(0, 0, 1),
      });
      set("calf", {
        station: { bone: s("LowerLeg"), toward: s("Foot"), share: 0.35 },
        direction: v(0, 0, -1),
      });
      set("footTop", {
        station: { bone: s("Foot"), toward: s("Toes"), share: 0.5 },
        direction: v(0, 1, 0),
      });
    }
    return table;
  })();

/** The farthest distance along a unit ray at which it is still inside a shape, or -Infinity on a miss. */
function shapeExit(
  frame: P.ITransform,
  shape: P.IShape,
  origin: IAutoMovieVector3,
  d: IAutoMovieVector3,
): number {
  const centre: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, shape.transform.position),
  );
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    frame.rotation,
    shape.transform.rotation,
  );
  const sphere = (c: IAutoMovieVector3, r: number): number => {
    const oc: IAutoMovieVector3 = Vector3.subtract(origin, c);
    const b: number = Vector3.dot(oc, d);
    const disc: number = b * b - (Vector3.dot(oc, oc) - r * r);
    return disc < -BOUNDARY * r ? -Infinity : -b + Math.sqrt(Math.max(0, disc));
  };
  if (shape.kind === "sphere") return sphere(centre, shape.radius);
  if (shape.kind === "capsule") {
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
    const a: IAutoMovieVector3 = Vector3.subtract(
      centre,
      Vector3.scale(axis, shape.halfLength),
    );
    let far: number = Math.max(
      sphere(a, shape.radius),
      sphere(
        Vector3.add(centre, Vector3.scale(axis, shape.halfLength)),
        shape.radius,
      ),
    );
    // The cylinder: the ray's component across the axis meets the radius.
    const oc: IAutoMovieVector3 = Vector3.subtract(origin, a);
    const dp: IAutoMovieVector3 = Vector3.subtract(
      d,
      Vector3.scale(axis, Vector3.dot(d, axis)),
    );
    const op: IAutoMovieVector3 = Vector3.subtract(
      oc,
      Vector3.scale(axis, Vector3.dot(oc, axis)),
    );
    const qa: number = Vector3.dot(dp, dp);
    if (qa > 1e-12) {
      const qb: number = Vector3.dot(op, dp);
      const disc: number =
        qb * qb - qa * (Vector3.dot(op, op) - shape.radius * shape.radius);
      if (disc >= 0) {
        const t: number = (-qb + Math.sqrt(disc)) / qa;
        const along: number = Vector3.dot(
          Vector3.add(oc, Vector3.scale(d, t)),
          axis,
        );
        if (along >= 0 && along <= 2 * shape.halfLength) far = Math.max(far, t);
      }
    }
    return far;
  }
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(rotation);
  const o: IAutoMovieVector3 = Quaternion.rotateVector(
    inverse,
    Vector3.subtract(origin, centre),
  );
  const dir: IAutoMovieVector3 = Quaternion.rotateVector(inverse, d);
  let near: number = -Infinity;
  let far: number = Infinity;
  if (shape.kind === "hull") {
    // Clip the ray against every face plane: it enters through the planes
    // it runs against and leaves through the ones it runs with.
    for (const face of physicalHullFaces(shape.points).faces) {
      const speed: number = Vector3.dot(face.normal, dir);
      const height: number = Vector3.dot(face.normal, o) - face.offset;
      if (Math.abs(speed) < 1e-12) {
        if (height > BOUNDARY) return -Infinity;
        continue;
      }
      if (speed < 0) near = Math.max(near, -height / speed);
      else far = Math.min(far, -height / speed);
    }
    return near <= far ? far : -Infinity;
  }
  if (shape.kind !== "box") {
    shape satisfies never;
    throw new Error("Unknown physical shape kind");
  }
  for (const k of ["x", "y", "z"] as const) {
    const h: number = shape.halfExtents[k];
    if (Math.abs(dir[k]) < 1e-12) {
      if (Math.abs(o[k]) > h + BOUNDARY) return -Infinity;
      continue;
    }
    const t1: number = (-h - o[k]) / dir[k];
    const t2: number = (h - o[k]) / dir[k];
    near = Math.max(near, Math.min(t1, t2));
    far = Math.min(far, Math.max(t1, t2));
  }
  return near <= far ? far : -Infinity;
}

/** A point where a ray leaves a segment's colliders, with their outward normal there. */
interface ISurfacePoint {
  /** The point, world metres in the rest pose. */
  point: IAutoMovieVector3;

  /** The outward unit normal there. */
  normal: IAutoMovieVector3;
}

/** The rest pose readers every surface is resolved with: bones, segments, collider bounds, bone-local frames, stations and ray exits of one body. */
function tools(skeleton: IAutoMovieSkeleton, profile: P) {
  const rest: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
    resolvePose(
      { skeleton: skeleton.id, root: null, joints: [] },
      skeleton,
    ).map(
      (
        r: IAutoMovieResolvedBone,
      ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r],
    ),
  );
  const at = (bone: AutoMovieHumanoidBone): IAutoMovieResolvedBone => {
    const r: IAutoMovieResolvedBone | undefined = rest.get(bone);
    if (r === undefined) throw new Error(`Surfaces need the rig bone ${bone}`);
    return r;
  };
  const segment = (bone: AutoMovieHumanoidBone): P.ISegment => {
    const s: P.ISegment | undefined = profile.segments.find(
      (x: P.ISegment): boolean => x.bone === bone,
    );
    if (s === undefined)
      throw new Error(`Surfaces need the profile segment ${bone}`);
    return s;
  };
  const bounds = (
    bone: AutoMovieHumanoidBone,
  ): { min: IAutoMovieVector3; max: IAutoMovieVector3 } => {
    const s: P.ISegment = segment(bone);
    const min: IAutoMovieVector3 = { x: Infinity, y: Infinity, z: Infinity };
    const max: IAutoMovieVector3 = { x: -Infinity, y: -Infinity, z: -Infinity };
    for (const shape of s.shapes) {
      const b: { min: IAutoMovieVector3; max: IAutoMovieVector3 } =
        physicalShapeBounds(s.neutral, shape);
      for (const k of ["x", "y", "z"] as const) {
        min[k] = Math.min(min[k], b.min[k]);
        max[k] = Math.max(max[k], b.max[k]);
      }
    }
    return { min, max };
  };
  const local = (
    bone: AutoMovieHumanoidBone,
    world: IAutoMovieVector3,
    direction: IAutoMovieVector3,
    forward?: IAutoMovieVector3,
  ): IFrameLocal => {
    const r: IAutoMovieResolvedBone = at(bone);
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(r.worldRotation);
    return {
      bone,
      point: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(world, r.worldPosition),
      ),
      normal: Quaternion.rotateVector(inverse, Vector3.normalize(direction)),
      ...(forward === undefined
        ? {}
        : {
            forward: Quaternion.rotateVector(
              inverse,
              Vector3.normalize(forward),
            ),
          }),
    };
  };
  const station = (s: IStation): IAutoMovieVector3 => {
    if (s.toward === "centre") {
      const b = bounds(s.bone);
      return Vector3.scale(Vector3.add(b.min, b.max), 0.5);
    }
    return Vector3.lerp(
      at(s.bone).worldPosition,
      at(s.toward).worldPosition,
      s.share,
    );
  };
  const surface = (
    bone: AutoMovieHumanoidBone,
    origin: IAutoMovieVector3,
    direction: IAutoMovieVector3,
  ): ISurfacePoint => {
    const d: IAutoMovieVector3 = Vector3.normalize(direction);
    const s: P.ISegment = segment(bone);
    let far: number = -Infinity;
    let left: P.IShape | undefined;
    for (const shape of s.shapes) {
      const t: number = shapeExit(s.neutral, shape, origin, d);
      if (t > far) {
        far = t;
        left = shape;
      }
    }
    if (!(far > -Infinity) || left === undefined)
      throw new Error(`A surface ray from ${bone} misses its colliders`);
    const point: IAutoMovieVector3 = Vector3.add(origin, Vector3.scale(d, far));
    return { point, normal: physicalShapeNormal(s.neutral, left, point, d) };
  };
  const exit = (
    bone: AutoMovieHumanoidBone,
    origin: IAutoMovieVector3,
    direction: IAutoMovieVector3,
  ): IAutoMovieVector3 => surface(bone, origin, direction).point;
  return { at, bounds, local, station, exit, surface };
}

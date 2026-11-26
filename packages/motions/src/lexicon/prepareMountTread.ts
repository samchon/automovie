import { Quaternion, Vector3, physicalPlanarPolygon, physicalShapeBounds, physicalShapeContactManifold, physicalShapeGjk, physicalShapePairDistance, resolveAutoMovieHumanoidSurfaces, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalShapeBounds,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPropFrame } from "../perform/HumanPropFrame";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanFoot } from "../posture/HumanFoot";
import { poseBones } from "../posture/poseBones";
import { mountCastObstruction } from "./mountCastObstruction";
import type { prepareMountSeat } from "./prepareMountSeat";

/** A lateral interval in tread-native metres. */
type Span = readonly [number, number];

/** The physical box whose exposed upper face is the named tread. */
type PlateShape = Extract<IAutoMoviePhysicalShape, { kind: "box" }>;

/** A placed profile cell and its actual axis projections. */
interface ICell extends prepareMountSeat.ISolid {
  /** The bone the actual cell follows. */
  bone: AutoMovieHumanoidBone;

  /** Its bounds in the tread's own frame. */
  bounds: IAutoMoviePhysicalShapeBounds.IResult;
}

/** Translation across the named tread. */
const ACROSS: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };

/** From the riding foot towards the plate. */
const DOWN: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };

/**
 * Prepare supported placements of a posed foot within a named stirrup. Carry
 * its actual foot and toe shapes about its anatomical ball; their relative
 * articulation stays as displayed. Keep the requested rotation and fixed
 * depth, and subtract each iron obstruction from the finite tread width with
 * `mountCastObstruction`'s continuous convex cast. Each surviving interval
 * supplies its midpoint, maximising the margin to its certified boundaries.
 * A supplied abscissa instead checks the exact placed foot once against the
 * finite metal. A heel below the plane can clear when it is outside the plate.
 * Both paths require the actual plate and an actual foot or toe collider to
 * share a positive face patch within the existing `HumanFoot.BEARING` band.
 *
 * @param input The posed foot and the matched physical parts in tread axes.
 * @returns The admitted ankle, anatomical ball, paired patch witness and
 *   certified iron clearance range for each supported choice.
 */
export function prepareMountTread(
  input: prepareMountTread.IInput,
): readonly prepareMountTread.ICandidate[] {
  const { body, side, pose, plate, iron, rotation, depth } = input;
  const bounds: IAutoMoviePhysicalShapeBounds.IResult = physicalShapeBounds(
    plate.pose,
    plate.shape,
  );
  // Bound only transform and projection roundoff in the local material.
  const precision: number =
    64 *
    Number.EPSILON *
    Math.max(1, Vector3.length(bounds.min), Vector3.length(bounds.max));
  const top: IAutoMovieRigidTransform = HumanPropFrame.compose(
    plate.pose,
    plate.shape.transform,
  );
  const across: IAutoMovieVector3 = Quaternion.rotateVector(top.rotation, ACROSS);
  if (
    Math.abs(bounds.max.y) > precision ||
    Vector3.distance(Quaternion.rotateVector(top.rotation, DOWN), DOWN) >
      precision ||
    Math.min(Math.abs(across.x), Math.abs(across.z)) > precision ||
    depth < bounds.min.z ||
    depth > bounds.max.z
  )
    return [];

  const socket: IAutoMovieHumanoidSurfaces.IFrame =
    body.surfaces.sockets[side === "left" ? "ballLeft" : "ballRight"];
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(
      body,
      pose,
      undefined,
      new Set<AutoMovieHumanoidBone>([socket.bone, `${side}Toes`]),
    );
  const foot: IAutoMovieResolvedBone = bones.get(socket.bone)!;
  const reference: IAutoMovieRigidTransform = {
    position: resolveAutoMovieHumanoidSurfaces.point(socket, foot),
    rotation: foot.worldRotation,
  };
  const x: number | undefined = input.x;
  if (x !== undefined && !(x >= bounds.min.x && x <= bounds.max.x)) return [];
  const ball: IAutoMovieVector3 = {
    x: x ?? 0,
    y: x === undefined ? 0 : (input.y ?? 0),
    z: depth,
  };
  const proposed: IAutoMovieRigidTransform = { position: ball, rotation };
  const actors: ICell[] = HumanColliders.placed(body, bones).flatMap(
    (part: IAutoMovieMotionHumanColliders.IPlaced): ICell[] => {
      const pose: IAutoMovieRigidTransform = HumanPropFrame.compose(
        proposed,
        HumanPropFrame.relative(reference, part.pose),
      );
      return part.shapes.map((shape: IAutoMoviePhysicalShape): ICell => ({
        bone: part.bone,
        pose,
        shape,
        bounds: physicalShapeBounds(pose, shape),
      }));
    },
  );
  if (actors.length === 0) return [];
  const offset: IAutoMovieVector3 = Quaternion.rotateVector(rotation, socket.point);
  const placement = (
    ball: IAutoMovieVector3,
    range: Span,
    shift: number,
  ): prepareMountTread.ICandidate[] => {
    for (const actor of actors) {
      const witness: physicalShapeContactManifold.IPoint | undefined = onPlate(
        actor,
        plate,
        ball,
        shift,
        precision,
      );
      if (witness === undefined) continue;

      const owner: IAutoMovieRigidTransform = HumanPropFrame.compose(
        { position: ball, rotation },
        HumanPropFrame.relative(
          reference,
          HumanPropFrame.bone(bones.get(actor.bone)!),
        ),
      );
      return [
        {
          ball,
          range,
          contact: socket.point,
          ankle: { position: Vector3.subtract(ball, offset), rotation },
          anchor: {
            bone: actor.bone,
            point: Quaternion.rotateVector(
              Quaternion.inverse(owner.rotation),
              Vector3.subtract(witness.pointA, owner.position),
            ),
            material: witness.pointB,
          },
        },
      ];
    }
    return [];
  };
  if (x !== undefined)
    return clearsPlaced(actors, plate, iron, precision)
      ? placement(ball, [x, x], 0)
      : [];

  if (actors.some((actor: ICell): boolean => actor.bounds.min.y < -precision))
    return [];
  let open: Span[] = [[bounds.min.x, bounds.max.x]];
  for (const hardware of iron) {
    const host: physicalShapeGjk.ISolid = physicalShapeGjk.solid(
      hardware.pose,
      hardware.shape,
    );
    const limits: IAutoMoviePhysicalShapeBounds.IResult = physicalShapeBounds(
      hardware.pose,
      hardware.shape,
    );
    for (const actor of actors) {
      if (
        actor.bounds.max.y <= limits.min.y ||
        actor.bounds.min.y >= limits.max.y ||
        actor.bounds.max.z <= limits.min.z ||
        actor.bounds.min.z >= limits.max.z
      )
        continue;
      const from: number = Math.max(
        bounds.min.x,
        limits.min.x - actor.bounds.max.x,
      );
      const to: number = Math.min(
        bounds.max.x,
        limits.max.x - actor.bounds.min.x,
      );
      if (
        !(from < to) ||
        !open.some((range: Span): boolean => range[0] < to && range[1] > from)
      )
        continue;
      const blocked: Span | undefined = mountCastObstruction(
        physicalShapeGjk.solid(actor.pose, actor.shape),
        host,
        ACROSS,
        [from, to],
        precision,
      );
      if (blocked === undefined) continue;
      open = open.flatMap((range: Span): Span[] => {
        if (blocked[0] >= range[1] || blocked[1] <= range[0]) return [range];
        const rest: Span[] = [];
        if (blocked[0] > range[0]) rest.push([range[0], blocked[0]]);
        if (blocked[1] < range[1]) rest.push([blocked[1], range[1]]);
        return rest;
      });
      if (open.length === 0) return [];
    }
  }

  return open.flatMap((range: Span): prepareMountTread.ICandidate[] => {
    const x: number = AutoMovieEngineMath.midpoint(range[0], range[1]);
    return range[0] < x && x < range[1]
      ? placement({ x, y: 0, z: depth }, range, x)
      : [];
  });
}

/** Exact placed pairs, with native GJK separating the easy ones first. */
function clearsPlaced(
  actors: readonly ICell[],
  plate: prepareMountTread.IPlate,
  iron: readonly prepareMountSeat.ISolid[],
  precision: number,
): boolean {
  for (const obstacle of [plate, ...iron]) {
    const other: IAutoMoviePhysicalShapeBounds.IResult = physicalShapeBounds(
      obstacle.pose,
      obstacle.shape,
    );
    const near: ICell[] = actors.filter(
      ({ bounds }: ICell): boolean =>
        bounds.max.x > other.min.x &&
        bounds.min.x < other.max.x &&
        bounds.max.y > other.min.y &&
        bounds.min.y < other.max.y &&
        bounds.max.z > other.min.z &&
        bounds.min.z < other.max.z,
    );
    if (near.length === 0) continue;
    const host: physicalShapeGjk.ISolid = physicalShapeGjk.solid(
      obstacle.pose,
      obstacle.shape,
    );
    for (const actor of near) {
      const gap: physicalShapeGjk.IBound = physicalShapeGjk(
        physicalShapeGjk.solid(actor.pose, actor.shape),
        host,
        precision,
      );
      if (gap.lower >= 0) continue;
      if (
        gap.upper < -precision ||
        physicalShapePairDistance(
          actor.pose,
          actor.shape,
          obstacle.pose,
          obstacle.shape,
        ) < -precision
      )
        return false;
    }
  }
  return true;
}

/** The paired witness nearest the ball in this cell's positive top patch. */
function onPlate(
  actor: prepareMountSeat.ISolid,
  plate: prepareMountTread.IPlate,
  ball: IAutoMovieVector3,
  shift: number,
  precision: number,
): physicalShapeContactManifold.IPoint | undefined {
  const pose: IAutoMovieRigidTransform = {
    ...actor.pose,
    position: { ...actor.pose.position, x: actor.pose.position.x + shift },
  };
  const patch: physicalPlanarPolygon.IPoint[] = [];
  let selected: physicalShapeContactManifold.IPoint | undefined;
  let nearest: number = Infinity;
  for (const witness of physicalShapeContactManifold(
    pose,
    actor.shape,
    plate.pose,
    plate.shape,
    DOWN,
    HumanFoot.BEARING,
  )) {
    const { pointA, pointB } = witness;
    if (
      !(
        Math.abs(pointB.y) <= precision &&
        Vector3.distance(pointA, pointB) <= HumanFoot.BEARING
      )
    )
      continue;

    patch.push({ x: pointB.x, y: pointB.z });
    const delta: IAutoMovieVector3 = Vector3.subtract(pointB, ball);
    const squared: number = Vector3.dot(delta, delta);
    if (squared >= nearest) continue;
    nearest = squared;
    selected = witness;
  }
  return physicalPlanarPolygon.area(physicalPlanarPolygon.hull(patch)) > 0
    ? selected
    : undefined;
}

/** Material, source pose and the retained local placement. */
export namespace prepareMountTread {
  /** The actual plate, already associated with its named contact. */
  export interface IPlate extends prepareMountSeat.ISolid {
    /** The finite box in the named tread's axes. */
    shape: PlateShape;
  }

  /** The footprint and hardware observed once during preparation. */
  export interface IInput {
    /** The rider's canonical profile. */
    body: IAutoMovieMotionHumanBody;

    /** The side that will bear. */
    side: AutoMovieHumanSide;

    /** The displayed key supplying the foot and toes' relative geometry. */
    pose: IAutoMoviePose;

    /** The physical plate in the named tread's local axes. */
    plate: IPlate;

    /** All other iron pieces in those same axes, excluding the tread. */
    iron: readonly prepareMountSeat.ISolid[];

    /** The exact desired ankle rotation in the named tread's axes. */
    rotation: IAutoMovieQuaternion;

    /** The ball's authored fore/aft coordinate in the named tread, metres. */
    depth: number;

    /** Test this exact lateral abscissa in the legal interval when given. */
    x?: number;

    /** Actual local height of the verified ball, zero when omitted. */
    y?: number;
  }

  /** One physically supported local ankle placement. */
  export interface ICandidate {
    /** The anatomical ball on the finite tread, local metres. */
    ball: IAutoMovieVector3;

    /** The ankle pose in the same material axes. */
    ankle: IAutoMovieRigidTransform;

    /** The ball as carried by the ankle, bone-local metres. */
    contact: IAutoMovieVector3;

    /** The corresponding actor and material points of the bearing patch. */
    anchor: IAnchor;

    /** Clear lateral interval, or the singleton for a verified placed foot. */
    range: Span;
  }

  /** One paired witness on the cell that bears the foot. */
  export interface IAnchor {
    /** The foot or toe bone owning the actor witness. */
    bone: AutoMovieHumanoidBone;

    /** The actor witness in its owner's bone-local axes, metres. */
    point: IAutoMovieVector3;

    /** The other witness on the named tread's top, tread-local metres. */
    material: IAutoMovieVector3;
  }
}

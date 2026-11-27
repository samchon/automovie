import { AutoMoviePhysicalProjectile, Quaternion, Vector3, AutoMovieEnginePhysics, AutoMovieAir } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanPerformanceState,
  IAutoMoviePhysicalShape,
  IAutoMovieProjectile,
  IAutoMovieProjectileFirstContact,
  IAutoMovieProjectileState,
  IAutoMovieResolveContactEvents,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPropOutcome } from "./HumanPropOutcome";

/**
 * The colliders a prop's flight sweep reads (`HumanPropSweep`): how far a prop
 * reaches, a collider read only where its distance bound allows a contact, a
 * separating start contact, a carried point's velocity, and the thinnest
 * collider the sweep may meet.
 */
export namespace HumanPropSweepColliders {
  /**
   * How far a prop's shapes reach from its frame's origin, metres: the largest
   * over its shapes of the shape's offset and its own bounding radius.
   */
  export function reach(shapes: readonly IAutoMoviePhysicalShape[]): number {
    let far: number = 0;
    for (const shape of shapes) {
      const own: number =
        shape.kind === "sphere"
          ? shape.radius
          : shape.kind === "capsule"
            ? shape.halfLength + shape.radius
            : shape.kind === "box"
              ? Vector3.length(shape.halfExtents)
              : Math.max(
                  0,
                  ...shape.points.map((point: IAutoMovieVector3): number =>
                    Vector3.length(point),
                  ),
                );
      far = Math.max(far, Vector3.length(shape.transform.position) + own);
    }
    return far;
  }

  /**
   * A collider read only where a cheap lower bound on its distance allows a
   * contact: farther than the projectile's radius by the bound, the bound
   * stands for the distance, as the person's root reject does.
   */
  export function culled(
    collider: IAutoMovieProjectileFirstContact.ICollider,
    bound: Bound,
    radius: number,
  ): IAutoMovieProjectileFirstContact.ICollider {
    return {
      ...collider,
      distance: (
        a: IAutoMovieVector3,
        b: IAutoMovieVector3,
        t: number,
      ): number => {
        const far: number = bound(a, b, t);
        return far > radius
          ? far
          : collider.distance === undefined
            ? collider.nearest(a, b, t).distance
            : collider.distance(a, b, t);
      },
      nearest: (
        a: IAutoMovieVector3,
        b: IAutoMovieVector3,
        t: number,
      ): IAutoMovieProjectileFirstContact.INearest => {
        const far: number = bound(a, b, t);
        return far > radius
          ? { distance: far, point: a, normal: { x: 0, y: 1, z: 0 } }
          : collider.nearest(a, b, t);
      },
    };
  }

  /**
   * A contact at the sweep's start that the flight leaves, classified by the
   * surface's own motion: the flight's velocity relative to the surface's at
   * its nearest point points out along the normal (a separating contact, Baraff
   * 1989), and the pair's gap reads positive at the scan's next grid second,
   * where the pair is clear. Undefined for a colliding or resting contact, or
   * one still closed a step on, which stays a contact.
   */
  export function separating(
    projectile: IAutoMovieProjectile,
    options: IAutoMovieProjectileFirstContact.IOptions,
    contact: IAutoMovieResolveContactEvents.IInitialContact,
    surface: Surface,
  ): IAutoMovieResolveContactEvents.Departure | undefined {
    const state: IAutoMovieProjectileState = AutoMovieAir.projectileAt(
      projectile,
      contact.from,
    );
    const end: IAutoMovieVector3 =
      options.tail === undefined || state.rotation === undefined
        ? state.position
        : Vector3.add(
            state.position,
            Quaternion.rotateVector(state.rotation, options.tail),
          );
    const at: ISurface = surface(state.position, end, contact.from);
    if (
      !(
        Vector3.dot(Vector3.subtract(state.velocity, at.velocity), at.normal) >
        0
      )
    )
      return undefined;
    const seconds: number =
      contact.from +
      AutoMoviePhysicalProjectile.contactStep(
        projectile,
        { from: contact.from, to: contact.to },
        options,
      );
    if (!(seconds > contact.from && seconds <= contact.to)) return undefined;
    const gap: number = contact.at(seconds);
    return gap > 0 && gap < Infinity
      ? { kind: "clearance", seconds }
      : undefined;
  }

  /**
   * The velocity of a point a moving frame carries, world metres per second:
   * the point fixed in the frame where it lies at a second, its central
   * difference over a contact's time resolution.
   */
  export function pointVelocity(
    frame: (seconds: number) => IAutoMovieRigidTransform,
    point: IAutoMovieVector3,
    seconds: number,
  ): IAutoMovieVector3 {
    const now: IAutoMovieRigidTransform = frame(seconds);
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(now.rotation),
      Vector3.subtract(point, now.position),
    );
    const placed: (at: number) => IAutoMovieVector3 = (
      at: number,
    ): IAutoMovieVector3 => {
      const carried: IAutoMovieRigidTransform = frame(at);
      return Vector3.add(
        carried.position,
        Quaternion.rotateVector(carried.rotation, local),
      );
    };
    const h: number = HumanPropOutcome.CONTACT_SECOND;
    return Vector3.scale(
      Vector3.subtract(placed(seconds + h), placed(seconds - h)),
      1 / (2 * h),
    );
  }

  /**
   * The thinnest collider a flight may meet, metres: the least diameter of a
   * round shape, least full extent of a box or inscribed width of a hull among
   * the people but the launcher, finger bones aside, and the props that do not
   * fly.
   */
  export function thinnest(
    self: IAutoMovieMotionHumanPerformanceState,
    launcher: string,
    props: readonly IAutoMoviePhysicalShape[],
  ): number {
    let least: number = Infinity;
    for (const shape of props) least = Math.min(least, size(shape));
    for (const person of self.people.values()) {
      if (person.performer.subject === launcher) continue;
      for (const segment of person.performer.body.profile.segments) {
        if (FINGER.test(segment.bone)) continue;
        for (const shape of segment.shapes ?? [])
          least = Math.min(least, size(shape));
      }
    }

    // With no thin collider, the floor permits a whole-span scan. A resolved
    // departure's engine certificate still exposes its later plane entry.
    return least === Infinity ? Number.MAX_VALUE : least;
  }

  /**
   * A shape's least thickness, metres: a round shape's diameter, a box's least
   * full extent, a hull's inscribed width (`width`).
   */
  export function size(shape: IAutoMoviePhysicalShape): number {
    return shape.kind === "sphere" || shape.kind === "capsule"
      ? 2 * shape.radius
      : shape.kind === "box"
        ? 2 *
          Math.min(
            shape.halfExtents.x,
            shape.halfExtents.y,
            shape.halfExtents.z,
          )
        : width(shape);
  }

  /**
   * A hull's least width bound, metres: twice its vertices' centroid's depth
   * inside it, the diameter of the largest ball about that point within the
   * hull, which no width of the hull is less than. A flat hull, whose centroid
   * lies on its surface, is not counted, as a finger is not. Read once per
   * sweep (`thinnest`).
   */
  export function width(shape: IAutoMoviePhysicalShape): number {
    let found: number = Infinity;
    if (shape.kind === "hull" && shape.points.length !== 0) {
      let sum: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
      for (const point of shape.points) sum = Vector3.add(sum, point);
      const centre: IAutoMovieVector3 = Vector3.add(
        shape.transform.position,
        Quaternion.rotateVector(
          shape.transform.rotation,
          Vector3.scale(sum, 1 / shape.points.length),
        ),
      );
      const depth: number = -AutoMovieEnginePhysics.physicalShapeNearest(ORIGIN, shape, centre, centre)
        .distance;
      if (depth > 0) found = 2 * depth;
    }
    return found;
  }

  /** A surface's outward normal and velocity at its point nearest a segment. */
  export interface ISurface {
    /** The outward unit normal there, world. */
    normal: IAutoMovieVector3;

    /** The surface point's velocity, world metres per second. */
    velocity: IAutoMovieVector3;
  }

  /**
   * A lower bound on a collider's distance from a flight segment at seconds
   * since the sweep's zero, metres; minus infinity where none is known.
   */
  export type Bound = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    seconds: number,
  ) => number;

  /**
   * Read a collider's surface at its point nearest a flight segment, at seconds
   * since the sweep's zero.
   */
  export type Surface = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    seconds: number,
  ) => ISurface;

  /** The world frame, a shape's parent placed at the origin unturned. */
  const ORIGIN: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };

  /** The finger bones, whose colliders a fast flight may pass. */
  const FINGER: RegExp = /(Thumb|Index|Middle|Ring|Little)/;
}

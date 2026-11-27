import { Quaternion, Vector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPropReader,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalShapeBounds,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * A moving car's front as a struck or diving pedestrian meets it, read in the
 * car's own frame (its front toward `+Z`, `+Y` up): the leading face, the top
 * of its leading edge, the bumper's lower face, the half width and the bonnet's
 * length and the roof's height, and the car's course read off the prop's frame
 * at a film second.
 *
 * The front is the collider that reaches furthest forward together with every
 * collider whose front lies within `BAND` of it: the leading edge is the
 * highest top among them, the bumper the lowest bottom, the width the widest. A
 * named affordance, when the scene gives one, places the leading edge instead.
 */
export namespace vehicleFront {
  /*
   * Colliders whose front lies this far behind the foremost one still form the
   * front face, metres (provisional: a bumper's depth).
   */
  export const BAND: number = 0.15;

  /*
   * The step the course is searched at for the contact, seconds: a 120 Hz scan,
   * refined by bisection.
   */
  export const STEP: number = 1 / 120;

  /*
   * The half span of the central difference a velocity is read over, seconds.
   */
  export const DT: number = 1e-3;

  /*
   * A car's front in its own frame, metres.
   */
  export interface IFront {
    /*
     * The leading face along `+Z`.
     */
    front: number;

    /*
     * The top of the leading edge, the bonnet's front, above the car's origin.
     */
    top: number;

    /*
     * The bumper's lower face above the car's origin.
     */
    bottom: number;

    /*
     * Half the front's width across `X`.
     */
    half: number;

    /*
     * The bonnet's length back from the leading face.
     */
    length: number;

    /*
     * The highest top of all the car's colliders, its roof, above its origin.
     */
    roof: number;
  }

  /*
   * Where the pedestrian's legs stand, for the contact search.
   */
  export interface ILegs {
    /*
     * The hips joint, world metres.
     */
    hips: IAutoMovieVector3;

    /*
     * The legs' half depth along the car's travel, metres.
     */
    depth: number;

    /*
     * The legs' half spread across it, metres.
     */
    spread: number;
  }

  /*
   * Read a car's front.
   * Parameter context: The action's context.
   * Parameter vehicle: The car's subject id.
   * Parameter edge: The affordance at the top of its leading edge, when named.
   * Returns: The front.
   * When the car has no colliders, no course, or no
   * affordance of that name.
   */
  export function read(
    context: IAutoMovieMotionHumanActionContext,
    vehicle: string,
    edge?: string,
  ): IFront {
    const reader: IAutoMovieMotionHumanPropReader = context.prop(vehicle);
    if (reader.prop.motion === undefined)
      throw refusal(vehicle, `${vehicle} has no course; it never moves`);
    const shapes: readonly IAutoMoviePhysicalShape[] | undefined =
      reader.prop.shapes;
    if (shapes === undefined || shapes.length === 0)
      throw refusal(
        vehicle,
        `${vehicle} has no colliders to read a front from`,
      );
    const still: IAutoMovieRigidTransform = {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    };
    const bounds: IAutoMoviePhysicalShapeBounds.IResult[] = shapes.map(
      (shape: IAutoMoviePhysicalShape): IAutoMoviePhysicalShapeBounds.IResult =>
        AutoMovieEnginePhysics.physicalShapeBounds(still, shape),
    );
    const foremost: number = Math.max(
      ...bounds.map(
        (b: IAutoMoviePhysicalShapeBounds.IResult): number => b.max.z,
      ),
    );
    const face: IAutoMoviePhysicalShapeBounds.IResult[] = bounds.filter(
      (b: IAutoMoviePhysicalShapeBounds.IResult): boolean =>
        b.max.z >= foremost - BAND,
    );
    let top: number = Math.max(
      ...face.map(
        (b: IAutoMoviePhysicalShapeBounds.IResult): number => b.max.y,
      ),
    );
    let front: number = foremost;
    if (edge !== undefined) {
      const named: IAutoMovieAffordance | undefined =
        reader.prop.affordances?.find(
          (item: IAutoMovieAffordance): boolean => item.id === edge,
        );
      if (named === undefined)
        throw refusal(vehicle, `${vehicle} has no affordance ${edge}`);
      top = named.frame.translation.y;
      front = named.frame.translation.z;
    }
    // The bonnet: the face collider whose top is the leading edge.
    const bonnet: IAutoMoviePhysicalShapeBounds.IResult = face.reduce(
      (
        a: IAutoMoviePhysicalShapeBounds.IResult,
        b: IAutoMoviePhysicalShapeBounds.IResult,
      ): IAutoMoviePhysicalShapeBounds.IResult => (b.max.y > a.max.y ? b : a),
    );
    return {
      front,
      top,
      bottom: Math.min(
        ...face.map(
          (b: IAutoMoviePhysicalShapeBounds.IResult): number => b.min.y,
        ),
      ),
      half: Math.max(
        ...face.map((b: IAutoMoviePhysicalShapeBounds.IResult): number =>
          Math.max(-b.min.x, b.max.x),
        ),
      ),
      length: bonnet.max.z - bonnet.min.z,
      roof: Math.max(
        ...bounds.map(
          (b: IAutoMoviePhysicalShapeBounds.IResult): number => b.max.y,
        ),
      ),
    };
  }

  /*
   * A world point in a car frame.
   * Parameter frame: The car's world frame.
   * Parameter point: World metres.
   * Returns: Car-frame metres.
   */
  export function local(
    frame: IAutoMovieRigidTransform,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(
      Quaternion.inverse(frame.rotation),
      Vector3.subtract(point, frame.position),
    );
  }

  /*
   * A car-frame point in the world.
   * Parameter frame: The car's world frame.
   * Parameter point: Car-frame metres.
   * Returns: World metres.
   */
  export function world(
    frame: IAutoMovieRigidTransform,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, point),
    );
  }

  /*
   * The car's velocity at a film second.
   * Parameter reader: The car.
   * Parameter seconds: Film seconds.
   * Returns: World metres per second.
   */
  export function velocity(
    reader: IAutoMovieMotionHumanPropReader,
    seconds: number,
  ): IAutoMovieVector3 {
    return Vector3.scale(
      Vector3.subtract(
        reader.frame(seconds + DT).position,
        reader.frame(seconds - DT).position,
      ),
      1 / (2 * DT),
    );
  }

  /*
   * The first film second the car's leading face reaches the legs, within its
   * width, on its course.
   * Parameter reader: The car.
   * Parameter front: The car's front.
   * Parameter legs: Where the legs stand.
   * Parameter from: The first film second searched.
   * Parameter to: The last film second searched.
   * Returns: The contact's film second, or undefined when the course never
   * meets the legs.
   */
  export function contact(
    reader: IAutoMovieMotionHumanPropReader,
    front: IFront,
    legs: ILegs,
    from: number,
    to: number,
  ): number | undefined {
    const met: (seconds: number) => boolean = (seconds: number): boolean => {
      const q: IAutoMovieVector3 = local(reader.frame(seconds), legs.hips);
      return (
        q.z - legs.depth <= front.front &&
        q.z + legs.depth >= front.front - front.length &&
        Math.abs(q.x) <= front.half + legs.spread
      );
    };
    if (met(from)) return from;
    let before: number = from;
    for (let t: number = from + STEP; t <= to + 1e-9; t += STEP) {
      if (!met(t)) {
        before = t;
        continue;
      }
      let lo: number = before;
      let hi: number = t;
      for (let k: number = 0; k < 40; k++) {
        const mid: number = (lo + hi) / 2;
        if (met(mid)) hi = mid;
        else lo = mid;
      }
      return hi;
    }
    return undefined;
  }

  /*
   * The vehicle laws' refusal of a car.
   * Parameter vehicle: The car's subject id.
   * Parameter reason: Why.
   * Returns: The refusal.
   */
  export function refusal(vehicle: string, reason: string): AutoMovieMotionHumanRefusal {
    return new AutoMovieMotionHumanRefusal({
      kind: "reach",
      axis: "vehicle",
      value: vehicle,
      reason,
      fix: "drive the car's course through the pedestrian within the horizon, and brake it after the hit",
    });
  }
}

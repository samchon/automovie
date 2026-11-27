import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeRefusal } from "../../core";

/*
 * Degrees per radian.
 */
const DEGREES: number = 180 / Math.PI;

/*
 * The neck and head turns that face a target or bring the muzzle onto it, in
 * closed form.
 *
 * The neck is one bar from its root on the trunk to the poll and the head one
 * bar from the poll to the nose, the shared quadruped's rig. Both are turned in
 * the trunk's own frame by a yaw about its vertical and a pitch in the turned
 * vertical plane, so the head never rolls. A reach is the two-link triangle
 * from the neck's root to the target with the poll bent upward (law of
 * cosines), the head's link running from the poll through the nose to the
 * muzzle's surface plus the held clearance; a target outside the triangle's
 * band is refused with that band, never clamped (the motion skill's reach
 * rule).
 */
export namespace EquineHeadReach {
  /*
   * The current neck and head bars and the trunk's turn, in model space.
   */
  export interface IBars {
    /*
     * The neck's root, its bar's origin.
     */
    root: IAutoMovieVector3;

    /*
     * The neck bar's rotation.
     */
    neck: IAutoMovieQuaternion;

    /*
     * The poll, the head bar's origin.
     */
    poll: IAutoMovieVector3;

    /*
     * The head bar's rotation.
     */
    head: IAutoMovieQuaternion;

    /*
     * The head's link from the poll to the muzzle's surface, metres: the head
     * bar's length plus its radius.
     */
    muzzle: number;

    /*
     * The trunk's rotation from its rest.
     */
    body: IAutoMovieQuaternion;
  }

  /*
   * Rotation deltas, in model space, to pre-multiply the neck's and head's
   * current rotations by.
   */
  export interface ITurn {
    /*
     * The neck bar's delta, about the neck's root.
     */
    neck: IAutoMovieQuaternion;

    /*
     * The head bar's delta, about the moved poll.
     */
    head: IAutoMovieQuaternion;
  }

  /*
   * Turn the neck about the vertical so the head faces a target, keeping both
   * bars' elevations.
   * Parameter bars: The current bars.
   * Parameter target: The target, model space.
   * Returns: The neck's yaw, which the head shares.
   */
  export function face(bars: IBars, target: IAutoMovieVector3): ITurn {
    const local: IAutoMovieVector3 = toBody(
      bars,
      Vector3.subtract(target, bars.root),
    );
    const current: IAutoMovieVector3 = toBody(bars, axis(bars.neck));
    const yaw: number =
      Math.atan2(local.x, local.z) - Math.atan2(current.x, current.z);
    const turn: IAutoMovieQuaternion = toModel(
      bars,
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw * DEGREES),
    );
    return { neck: turn, head: turn };
  }

  /*
   * Bring the muzzle's surface to a target, short of it by a clearance.
   * Parameter bars: The current bars.
   * Parameter target: The target, model space.
   * Parameter gap: The held clearance, metres, nonnegative.
   * Parameter archetype: The animal's producer name, for a refusal.
   * Parameter under: Whether the poll bends down under the line from the root to
   * the target, as a foal reaches up to an udder; it bends up otherwise.
   * Returns: The neck's and head's turns.
   * When the target lies outside the two
   * links' band from the neck's root.
   */
  export function reach(
    bars: IBars,
    target: IAutoMovieVector3,
    gap: number,
    archetype: string,
    under: boolean = false,
  ): ITurn {
    const local: IAutoMovieVector3 = toBody(
      bars,
      Vector3.subtract(target, bars.root),
    );
    const a: number = Vector3.distance(bars.poll, bars.root);
    const b: number = bars.muzzle + gap;
    const horizontal: number = Math.hypot(local.x, local.z);
    const distance: number = Math.hypot(horizontal, local.y);
    const minimum: number = Math.abs(a - b);
    const maximum: number = a + b;
    if (!(distance >= minimum && distance <= maximum))
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: "target",
        value: distance,
        feasible: { kind: "range", minimum, maximum, unit: "m" },
        reason: `the target lies ${distance} m from the neck's root, outside the neck and head's reach`,
        fix: "Place the target within the neck and head's reach of the standing horse, or move the horse.",
      });
    const bearing: number = Math.atan2(local.x, local.z);
    const elevation: number =
      Math.atan2(local.y, horizontal) +
      (under ? -1 : 1) *
        Math.acos(
          Math.max(
            -1,
            Math.min(
              1,
              (a * a + distance * distance - b * b) / (2 * a * distance),
            ),
          ),
        );
    const forward: IAutoMovieVector3 = {
      x: Math.sin(bearing),
      y: 0,
      z: Math.cos(bearing),
    };
    const poll: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(forward, a * Math.cos(elevation)),
      { x: 0, y: a * Math.sin(elevation), z: 0 },
    );
    const towards: IAutoMovieVector3 = Vector3.subtract(local, poll);
    return {
      neck: turn(bars, bars.neck, bearing, elevation),
      head: turn(
        bars,
        bars.head,
        Math.atan2(towards.x, towards.z),
        Math.atan2(towards.y, Math.hypot(towards.x, towards.z)),
      ),
    };
  }

  /*
   * Pitch the neck and the head in the trunk's sagittal plane by held angles, a
   * carriage rather than a target.
   * Parameter bars: The current bars.
   * Parameter neck: Degrees the neck turns about the trunk's lateral axis at its
   * root, positive lowering it.
   * Parameter head: Degrees the head turns further about the same axis at the moved
   * poll, positive lowering the muzzle.
   * Returns: The turns.
   */
  export function pitched(bars: IBars, neck: number, head: number): ITurn {
    const lateral: IAutoMovieVector3 = Quaternion.rotateVector(bars.body, {
      x: 1,
      y: 0,
      z: 0,
    });
    return {
      neck: Quaternion.fromAxisAngle(lateral, neck),
      head: Quaternion.fromAxisAngle(lateral, neck + head),
    };
  }

  /*
   * A bar's +Y axis.
   */
  function axis(rotation: IAutoMovieQuaternion): IAutoMovieVector3 {
    return Quaternion.rotateVector(rotation, { x: 0, y: 1, z: 0 });
  }

  /*
   * A model-space vector in the trunk's frame.
   */
  function toBody(bars: IBars, vector: IAutoMovieVector3): IAutoMovieVector3 {
    return Quaternion.rotateVector(Quaternion.inverse(bars.body), vector);
  }

  /*
   * A trunk-frame rotation in model space.
   */
  function toModel(
    bars: IBars,
    rotation: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion {
    return Quaternion.multiply(
      Quaternion.multiply(bars.body, rotation),
      Quaternion.inverse(bars.body),
    );
  }

  /*
   * The delta taking a bar from its bearing and elevation to new ones: unturn
   * its bearing, pitch in the forward plane, turn to the new bearing.
   */
  function turn(
    bars: IBars,
    rotation: IAutoMovieQuaternion,
    bearing: number,
    elevation: number,
  ): IAutoMovieQuaternion {
    const current: IAutoMovieVector3 = toBody(bars, axis(rotation));
    const from: number = Math.atan2(current.x, current.z);
    const rise: number = Math.atan2(
      current.y,
      Math.hypot(current.x, current.z),
    );

    // A turn of +theta about +X lowers a forward-pointing bar's elevation by theta.
    return toModel(
      bars,
      Quaternion.multiply(
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, bearing * DEGREES),
        Quaternion.multiply(
          Quaternion.fromAxisAngle(
            { x: 1, y: 0, z: 0 },
            (rise - elevation) * DEGREES,
          ),
          Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, -from * DEGREES),
        ),
      ),
    );
  }
}

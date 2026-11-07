import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieFramingGoal } from "./IAutoMovieFramingGoal";

/**
 * A camera pose meeting a framing goal from the subjects' actual bounding
 * spheres: the target is the centre of the smallest sphere about their
 * centroid that contains every subject sphere, and the camera stands on the
 * goal's bearing and elevation at the distance where that sphere's diameter
 * fills the declared share of the vertical field of view,
 * `d = r / (fill tan(fov / 2))`.
 *
 * @param goal The framing goal.
 * @param state Each subject's bounding sphere at the instant.
 * @returns The camera position, its look-at target and field of view.
 */
export function resolveAutoMovieFraming(
  goal: IAutoMovieFramingGoal,
  state: Readonly<
    Record<string, { center: IAutoMovieVector3; radius: number }>
  >,
): resolveAutoMovieFraming.ICamera {
  if (
    goal.subjects.length === 0 ||
    !(goal.fill > 0 && goal.fill <= 1) ||
    !(goal.fieldOfView > 0 && goal.fieldOfView < Math.PI) ||
    !(Math.abs(goal.elevation) < Math.PI / 2)
  )
    throw new Error("Invalid AutoMovie framing goal");
  const spheres: { center: IAutoMovieVector3; radius: number }[] =
    goal.subjects.map(
      (id: string): { center: IAutoMovieVector3; radius: number } => {
        const sphere:
          | { center: IAutoMovieVector3; radius: number }
          | undefined = state[id];
        if (!sphere) throw new Error(`Unknown framed subject ${id}`);
        return sphere;
      },
    );
  const n: number = spheres.length;
  const target: IAutoMovieVector3 = {
    x:
      spheres.reduce(
        (s: number, c: { center: IAutoMovieVector3 }): number => s + c.center.x,
        0,
      ) / n,
    y:
      spheres.reduce(
        (s: number, c: { center: IAutoMovieVector3 }): number => s + c.center.y,
        0,
      ) / n,
    z:
      spheres.reduce(
        (s: number, c: { center: IAutoMovieVector3 }): number => s + c.center.z,
        0,
      ) / n,
  };
  const radius: number = Math.max(
    ...spheres.map(
      (c: { center: IAutoMovieVector3; radius: number }): number =>
        Math.hypot(
          c.center.x - target.x,
          c.center.y - target.y,
          c.center.z - target.z,
        ) + c.radius,
    ),
  );
  const distance: number =
    radius / (goal.fill * Math.tan(goal.fieldOfView / 2));
  const horizontal: number = distance * Math.cos(goal.elevation);
  return {
    position: {
      x: target.x + horizontal * Math.sin(goal.bearing),
      y: target.y + distance * Math.sin(goal.elevation),
      z: target.z + horizontal * Math.cos(goal.bearing),
    },
    target,
    fieldOfView: goal.fieldOfView,
    radius,
  };
}
/** Companion types of {@link resolveAutoMovieFraming}. */
export namespace resolveAutoMovieFraming {
  /** A resolved camera. */
  export interface ICamera {
    /** Camera position, world metres. */
    position: IAutoMovieVector3;

    /** Look-at target, world metres. */
    target: IAutoMovieVector3;

    /** Vertical field of view, radians. */
    fieldOfView: number;

    /** Radius of the framed bounding sphere, metres. */
    radius: number;
  }
}

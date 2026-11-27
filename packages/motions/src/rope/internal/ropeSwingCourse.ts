import { AutoMovieGravity, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Prepare the small-angle pendulum already used by the staged rope swing. The
 * direction is the unit horizontal stage axis toward the landing. Positions and
 * tangents use the approximation's angle, with a constant distance to the
 * anchor. See MIT 8.01, Chapter 23, equations 23.3.20–23
 * (https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/mit8_01scs22_chapter23.pdf).
 */
export function ropeSwingCourse(
  anchor: IAutoMovieVector3,
  direction: IAutoMovieVector3,
  start: IAutoMovieVector3,
): ropeSwingCourse.ICourse {
  const offset: IAutoMovieVector3 = Vector3.subtract(start, anchor);
  const radius: number = Vector3.length(offset);
  const theta0: number = Math.atan2(Vector3.dot(offset, direction), -offset.y);
  const omega: number = Math.sqrt(AutoMovieGravity.STANDARD / radius);
  const point = (horizontal: number, vertical: number): IAutoMovieVector3 => ({
    x: direction.x * horizontal,
    y: vertical,
    z: direction.z * horizontal,
  });
  return {
    half: Math.PI / omega,
    at: (seconds: number): IAutoMovieVector3 => {
      const theta: number = theta0 * Math.cos(omega * seconds);
      return Vector3.add(
        anchor,
        point(radius * Math.sin(theta), -radius * Math.cos(theta)),
      );
    },
    velocity: (seconds: number): IAutoMovieVector3 => {
      const theta: number = theta0 * Math.cos(omega * seconds);
      const rate: number = -theta0 * omega * Math.sin(omega * seconds);
      return point(
        radius * rate * Math.cos(theta),
        radius * rate * Math.sin(theta),
      );
    },
  };
}

/** The prepared world-space film course. */
export namespace ropeSwingCourse {
  /** An unforced oscillation with an analytic first half. */
  export interface ICourse {
    /** Time from a stationary release to the opposite extreme, seconds. */
    half: number;

    /** The hanging point, world metres at the requested course instant. */
    at(seconds: number): IAutoMovieVector3;

    /** Its analytic tangent, world metres per second at the same instant. */
    velocity(seconds: number): IAutoMovieVector3;
  }
}

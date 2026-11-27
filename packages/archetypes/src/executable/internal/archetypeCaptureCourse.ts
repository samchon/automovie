import { type AutoMovieArchetypeCourse } from "../../core";

/**
 * A course for the moving subjects: a short straight, a quarter turn to the
 * left, a short straight.
 */
export const archetypeCaptureCourse: AutoMovieArchetypeCourse.ICourse = {
  start: { x: 0, z: 0, heading: 0 },
  legs: [
    { kind: "straight", length: 8 },
    { kind: "turn", radius: 8, angle: 90 },
    { kind: "straight", length: 6 },
  ],
  cruise: 4,
  acceleration: 2,
  deceleration: 2,
};

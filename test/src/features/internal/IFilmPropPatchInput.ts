/** Original square support patch inputs in metres. */
export interface IFilmPropPatchInput {
  /** Half width of the square. */
  half: number;

  /** Plane height at its origin. */
  originHeight: number;

  /** Optional change in height per metre of Z. */
  slopeZ?: number;

  /** Optional X coordinate of the square centre. */
  atX?: number;
}

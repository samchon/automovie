/**
 * A floor rectangle a furnished piece keeps clear beside one of its faces.
 *
 * The rectangle reaches `depth` metres out from the chosen face of the piece's
 * turned rest box and runs `width` metres along that face, centred on it. Every
 * other piece, every `keepClear` rectangle and every grid group of the room
 * stays out of it, and it lies inside the room. The furnishing producer checks
 * that `depth` and `width` are finite and positive.
 */
export interface IAutoMovieFurnishingClearance {
  /**
   * The face the rectangle reaches out from: `"front"`, the piece's local +Z
   * face, by default; `"left"`, its local -X face; or `"right"`, its local +X
   * face. Left and right are as seen by a person standing in front of the piece
   * and facing it.
   */
  readonly side?: "front" | "left" | "right";

  /** Distance in metres from the face out to the rectangle's far edge. */
  readonly depth: number;

  /**
   * Length in metres along the face, centred on it. The default is the face's
   * box length or the room's aisle, whichever is longer.
   */
  readonly width?: number;
}

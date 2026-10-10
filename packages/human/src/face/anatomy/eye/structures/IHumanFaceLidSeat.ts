/**
 * Seating dimensions of the lid margin on the ocular exterior, in metres.
 * `HUMAN_FACE_LID_SEAT` holds the authored values and their grounds.
 *
 * @author Samchon
 */
export interface IHumanFaceLidSeat {
  /** Height of the seated posterior lid margin above the ocular exterior. */
  posteriorClearanceMetres: number;

  /** Height of the innermost generated tissue face above the ocular exterior. */
  tearFilmMetres: number;

  /** Arc length from the medial commissure over which the margin leaves the globe. */
  medialBedMetres: number;
}

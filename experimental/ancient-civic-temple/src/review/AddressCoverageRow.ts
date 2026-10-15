
/** Address coverage counts of one wall face. */
export interface AddressCoverageRow {
  /** Wall identity. */
  wall: string;
  /** Index of the face within the wall's emitted faces. */
  face: number;
  /** Samples landing on emitted geometry. */
  emitted: number;
  /** Samples on a published boundary face. */
  covered: number;
  /** Samples on no boundary face. */
  uncovered: number;
  /** Uncovered samples open to the sky. */
  skyOpen: number;
  /** Uncovered samples visible from the exterior. */
  exposed: number;
  /** Exposed samples inside a named exception. */
  excepted: number;
  /** Exposed samples outside every exception. */
  unexpected: number;
  /** Sorted surface identities of the uncovered samples. */
  surfaces: string[];
}

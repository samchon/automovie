/**
 * A head landmark vertex chosen by reading rendered frames of the neutral
 * skin, with the neighbours the reading compared it against.
 *
 * @author Samchon
 */
export interface IHumanSourceReadLandmark {
  /** Base-mesh (hm08) vertex the reading chose. */
  vertex: number;

  /** Neighbouring vertices the reading compared, nearest alternative first. */
  neighbours: number[];

  /** Metres within which the reading cannot separate the choice from a neighbour. */
  ambiguityMetres: number;

  /** Local frames the reading was made on (never published). */
  frames: string;
}

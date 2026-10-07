/**
 * One vertex a head landmark selection compared: its index, neutral position
 * and the value the definition ranks it by.
 *
 * @author Samchon
 */
export interface IHumanSourceLandmarkCandidate {
  /** Base-mesh (hm08) vertex, which is also its source sample. */
  vertex: number;

  /** Neutral position in the generation frame, metres. */
  position: number[];

  /** The ranked coordinate, metres. */
  value: number;
}

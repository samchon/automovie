import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Nose. `bridge` is the East-Asian-defining radix-height control.
 *
 * @author Samchon
 */
export interface IAutoMovieHeadNose {
  /** Alar/overall width: `+` wider, `-` narrower. */
  width?: AutoMovieFaceWeight;

  /** Length down the face: `+` longer, `-` shorter. */
  length?: AutoMovieFaceWeight;

  /** Forward projection of the whole nose. */
  projection?: AutoMovieFaceWeight;

  /** Dorsal hump: `+` convex/humped, `-` scooped. */
  hump?: AutoMovieFaceWeight;

  /** Tip vertical angle: `+` upturned, `-` drooping. */
  tipAngle?: AutoMovieFaceWeight;

  /** Nostril width. */
  nostrilWidth?: AutoMovieFaceWeight;

  /** Nasal base height (sub-nasal). */
  baseHeight?: AutoMovieFaceWeight;

  /**
   * Bridge/radix height: `+` higher straight bridge, `-` flatter (East-Asian).
   */
  bridge?: AutoMovieFaceWeight;
}

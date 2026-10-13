import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Nose traits of an {@link IAutoMovieHead}: signed weights in `[-2, 2]`,
 * omitted meaning unchanged. `bridge` is the East-Asian-defining radix-height
 * control. `flattenHead` projects `projection`, `tipAngle` and `baseHeight`
 * onto `noseProject`, `nosePoint` and `noseBaseH`, and the other fields onto
 * same-stem names (`noseWidth`, `noseLength`, `noseHump`, `nostrilWidth`,
 * `noseBridge`).
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

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
  width?: number;

  /** Length down the face: `+` longer, `-` shorter. */
  length?: number;

  /** Forward projection of the whole nose. */
  projection?: number;

  /** Dorsal hump: `+` convex/humped, `-` scooped. */
  hump?: number;

  /** Tip vertical angle: `+` upturned, `-` drooping. */
  tipAngle?: number;

  /** Nostril width. */
  nostrilWidth?: number;

  /** Nasal base height (sub-nasal). */
  baseHeight?: number;

  /**
   * Bridge/radix height: `+` higher straight bridge, `-` flatter (East-Asian).
   */
  bridge?: number;
}

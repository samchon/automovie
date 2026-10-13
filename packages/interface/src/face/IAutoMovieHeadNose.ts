import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Nose traits of an {@link IAutoMovieHead}: signed weights in `[-2, 2]`,
 * omitted meaning unchanged. `bridge` is the East-Asian-defining radix-height
 * control. `flattenHead` projects `projection`, `tipAngle` and `baseHeight`
 * onto `noseProject`, `nosePoint` and `noseBaseH`, and the other fields onto
 * same-stem names (`noseWidth`, `noseLength`, `noseHump`, `nostrilWidth`,
 * `noseBridge`).
 *
 * @evidence contracts/common.md#principled-implementation Eight leaves mapped by `flattenHead` onto nose morph names, with projection, tip angle and base height landing on `noseProject`, `nosePoint` and `noseBaseH`, each an additive delta of the caller's template.
 * @evidence contracts/common.md#clear-and-simple-design All nasal controls in one flat record, including the radix-height `bridge` and the dorsal `hump` that the face vocabulary's nose lacks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The three renamed nose fields are fixed entries in the `flattenHead` map; no value is scaled, clamped or derived from another on the way.
 * @evidence contracts/common.md#meaningful-documentation Adds the owning document, the range, neutral omission and the renamed morph names; members give direction for width, length, hump, tip and bridge.
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

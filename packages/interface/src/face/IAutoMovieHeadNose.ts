/**
 * Nose traits of an {@link IAutoMovieHead}: signed weights in `[-2, 2]`, with
 * omission leaving the template unchanged.
 *
 * `bridge` sets the height of the nasal root between the eyes. `flattenHead`
 * renames `projection`, `tipAngle` and `baseHeight` to `noseProject`,
 * `nosePoint` and `noseBaseH`, and the other fields to same-stem names
 * (`noseWidth`, `noseLength`, `noseHump`, `nostrilWidth`, `noseBridge`).
 *
 * @evidence contracts/common.md#principled-implementation `HEAD_PARAMETERS.nose` in `flattenHead` renames all eight leaves one-to-one, three of them to names that differ from the field, which the documentation lists for template authors.
 * @evidence contracts/common.md#clear-and-simple-design One unsided record separates the bony profile (`bridge`, `hump`, `projection`) from the soft base (`nostrilWidth`, `baseHeight`, `tipAngle`) as distinct leaves rather than one composite nose-shape weight.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `nostrilWidth` is its own target and is not derived from the overall `width`; every leaf is copied unchanged.
 * @evidence contracts/common.md#meaningful-documentation States the range and neutral meaning, what `bridge` measures, and every morph name including the renamed ones; members give each sign's direction.
 * @author Samchon
 */
export interface IAutoMovieHeadNose {
  /** Overall and alar width: `+` wider, `-` narrower. */
  width?: number;

  /** Length down the face: `+` longer, `-` shorter. */
  length?: number;

  /** Forward projection of the whole nose: `+` more, `-` flatter to the face. */
  projection?: number;

  /** Dorsal hump: `+` convex and humped, `-` scooped. */
  hump?: number;

  /** Tip angle: `+` upturned, `-` drooping. */
  tipAngle?: number;

  /** Nostril width: `+` wider, `-` narrower. */
  nostrilWidth?: number;

  /** Height of the nasal base above the lip: `+` taller, `-` shorter. */
  baseHeight?: number;

  /** Height of the nasal root: `+` a higher straight bridge, `-` flatter. */
  bridge?: number;
}

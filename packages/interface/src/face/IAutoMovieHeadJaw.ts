import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Jaw and chin traits of an {@link IAutoMovieHead}: signed weights in
 * `[-2, 2]`, omitted meaning unchanged. The chin is flattened into this group
 * rather than nested. `flattenHead` projects the fields onto `jawWidth`,
 * `jawDrop`, `chinLength`, `chinWidth` and `chinProject`.
 *
 * @evidence contracts/common.md#principled-implementation Five leaves mapped by `flattenHead` onto `jawWidth`, `jawDrop`, `chinLength`, `chinWidth` and `chinProject`, each an additive delta of the caller's template.
 * @evidence contracts/common.md#clear-and-simple-design Jaw and chin share one flat record, unlike the nested `IAutoMovieFaceJaw`, because every head group is one level deep.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `chinProjection` is the only field whose morph name is shortened, to `chinProject`; it is a fixed table entry and no jaw value is derived from another.
 * @evidence contracts/common.md#meaningful-documentation Adds the owning document, the range, neutral omission, the flattened chin and every morph name; members give each direction except `drop`, whose direction the template decides.
 * @author Samchon
 */
export interface IAutoMovieHeadJaw {
  /** Gonial/jaw width: `+` wider/squarer, `-` softer/tapered (feminine). */
  width?: AutoMovieFaceWeight;

  /** Jaw drop / lower-face length at the angle. */
  drop?: AutoMovieFaceWeight;

  /** Chin vertical length: `+` longer, `-` shorter (feminine/childlike). */
  chinLength?: AutoMovieFaceWeight;

  /** Chin width: `+` broader, `-` narrower/pointed. */
  chinWidth?: AutoMovieFaceWeight;

  /** Chin forward projection: `+` prominent, `-` recessive (East-Asian). */
  chinProjection?: AutoMovieFaceWeight;
}

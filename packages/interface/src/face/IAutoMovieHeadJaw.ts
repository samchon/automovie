/**
 * Jaw and chin traits of an {@link IAutoMovieHead}: signed weights in
 * `[-2, 2]`, with omission leaving the template unchanged.
 *
 * The chin is flattened into this group rather than nested. `flattenHead`
 * renames the fields to `jawWidth`, `jawDrop`, `chinLength`, `chinWidth` and
 * `chinProject`.
 *
 * @evidence contracts/common.md#principled-implementation `HEAD_PARAMETERS.jaw` in `flattenHead` renames the two jaw leaves and three chin leaves one-to-one, `chinProjection` being the one whose name shortens to `chinProject`.
 * @evidence contracts/common.md#clear-and-simple-design Prefixing the chin leaves with `chin` keeps the lower face in one flat group, consistent with every other head group having no nesting, while the face vocabulary keeps its nested chin.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No chin trait is inferred from jaw width or drop; each of the five leaves is copied as written.
 * @evidence contracts/common.md#meaningful-documentation States the range and neutral meaning, that the chin is flattened here, and all five morph names; members give each sign's direction.
 * @author Samchon
 */
export interface IAutoMovieHeadJaw {
  /** Width at the jaw angle: `+` wider and squarer, `-` softer and tapered. */
  width?: number;

  /** Lower-face length at the jaw angle: `+` longer, `-` shorter. */
  drop?: number;

  /** Vertical chin length: `+` longer, `-` shorter. */
  chinLength?: number;

  /** Chin width: `+` broader, `-` narrower and pointed. */
  chinWidth?: number;

  /** Forward chin projection: `+` prominent, `-` recessive. */
  chinProjection?: number;
}

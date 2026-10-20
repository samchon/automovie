/**
 * What a `scene` node of the screenplay tree carries: the screenplay slug of where and when the scene happens, plus optional scene-setting prose.
 *
 * `screenplaySceneSlug` formats it as `INT. LOCATION - TIMEOFDAY`, with location and time upper-cased; the plain-text screenplay prints that slug and the description, and the caption sidecar labels every beat under the scene with it. The production store refuses a stored payload whose flag is not `INT` or `EXT`, whose location or time of day is blank, or whose description is blank rather than `null`.
 *
 * @evidence contracts/common.md#principled-implementation Follows the screenplay slug convention of interior or exterior, location and time of day, so one formatter produces the heading every reader of the tree shows.
 * @evidence contracts/common.md#clear-and-simple-design Three slug fields and one optional prose line; the staged set the scene plays on is a separate record, so this payload stays authoring text.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Location and time of day are free text with no vocabulary the engine interprets; nothing derives lighting or a set from them.
 * @evidence contracts/common.md#meaningful-documentation States the slug format, its three readers, and the stored-record refusals; members give each field's role and the meaning of `null`.
 */
export interface IAutoMovieScenePayload {
  /** Interior or exterior, the slug's first word. */
  interiorExterior: "INT" | "EXT";

  /** Non-blank location name, such as `hotel lobby`. */
  location: string;

  /** Non-blank time of day, such as `dawn` or `night`. */
  timeOfDay: string;

  /** Non-blank scene-setting prose, or `null` when the slug says enough. */
  description: string | null;
}

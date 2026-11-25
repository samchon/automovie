/**
 * What a `scene` node of the screenplay tree carries: the screenplay slug of
 * where and when the scene happens, plus optional scene-setting prose.
 *
 * `screenplaySceneSlug` formats it as `INT. LOCATION - TIMEOFDAY`, with
 * location and time upper-cased; the plain-text screenplay prints that slug and
 * the description, and the caption sidecar labels every beat under the scene
 * with it. The production store refuses a stored payload whose flag is not
 * `INT` or `EXT`, whose location or time of day is blank, or whose description
 * is blank rather than `null`.
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

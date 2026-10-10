/**
 * A face channel that a source generation no longer defines separately,
 * because the one skin defines that quantity once through a body channel.
 *
 * The age, sex, adiposity and muscularity macros of the source are one
 * upstream field each over the whole skin; the generation keeps the body
 * channel as their single owner and records the face channel id it replaced.
 * A person document's face subtree states neither id: the person's value
 * lives in the body subtree. The face view keeps a driver-only channel of the
 * body id (no rows of its own) so face correctives driven by the quantity read
 * the body's value.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonChannelAlias {
  /** The face channel id the generation no longer defines. */
  face: string;

  /** The body channel id that owns the quantity on the whole skin. */
  body: string;
}

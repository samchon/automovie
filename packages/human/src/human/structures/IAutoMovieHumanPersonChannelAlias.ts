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
 * @evidence contracts/common.md#principled-implementation One quantity has one owner; the alias records which face control the owner replaced so a stale document is refused by name.
 * @evidence contracts/common.md#clear-and-simple-design Two channel ids.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias does not translate values; a document naming the face channel is refused instead of silently remapped.
 * @evidence contracts/common.md#meaningful-documentation States what the alias means and how documents are admitted.
 * @evidence contracts/modeling.md#parameter-channels Names the single owning channel of a quantity the face and body once both carried.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The alias defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The alias emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Channel ids carry no frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The alias builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The alias is not observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The alias carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The body channel's owner admits the value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The alias adds no input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonChannelAlias {
  /** The face channel id the generation no longer defines. */
  face: string;

  /** The body channel id that owns the quantity on the whole skin. */
  body: string;
}

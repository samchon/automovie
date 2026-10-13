/**
 * A signed face-shape morph weight: the leaf value type of every
 * {@link IAutoMovieFace} trait.
 *
 * The value is a plain `number` in `[-2, 2]`: `0` is the neutral template (the
 * balanced average face), `±1` is one nameable trait step away from it, and
 * `±2` is the believable-human edge, beyond which reads as caricature. Per the
 * interface package's rough-types rule the range is documented here and
 * enforced at runtime by the engine's `validateFace` (Tier-1), not encoded as
 * `typia` tag constraints: face types reach no `typia.llm.*` schema surface, so
 * tags would have no structured-output effect and would only duplicate the
 * validator that already owns the range.
 *
 * {@link IAutoMovieHead} leaves reuse this type, but no engine validator checks
 * a head document, so the range is only documented there.
 *
 * @evidence contracts/common.md#principled-implementation A plain `number` alias whose range is checked by `validateFace` against `FACE_PARAMETER_LIMIT` (2) at each leaf's document path, after which `morphFace` multiplies it linearly into the matching target delta.
 * @evidence contracts/common.md#clear-and-simple-design An alias rather than a tagged or branded type, because no `typia.llm` schema reaches face documents and the range already has one owner in the engine validator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The same alias types every `IAutoMovieHead` leaf, yet no head validator exists, so the documented range binds face documents only and head magnitudes pass to a template unchecked.
 * @evidence contracts/common.md#meaningful-documentation Gives the neutral value, what one and two units mean, the caricature edge, where the range is enforced, why it is not a type tag, and that head documents are not range-checked.
 * @author Samchon
 */
export type AutoMovieFaceWeight = number;

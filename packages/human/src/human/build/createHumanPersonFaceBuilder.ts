import type { IAutoMovieHumanFaceBasis } from "../../face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../../face/structures/IAutoMovieHumanFaceBasisDocument";
import { createHumanFaceBasisBuilder } from "../../face/basis/createHumanFaceBasisBuilder";
import type { IAutoMovieHumanFaceOcclusionOptions } from "../../face/structures/IAutoMovieHumanFaceOcclusionOptions";

/**
 * Pair a person's admitted face with its actual generated hair identities.
 *
 * The face producer reports copied IDs at its successful exit. Initialize the
 * observation before constructing it because its neutral check also reports an
 * empty population. Each synchronous call returns its own ID set beside its
 * model, so a later mouth-closure reference build cannot replace the current
 * face's selection. A refused face returns neither model nor identities.
 * No geometry, input document, source basis or hair naming rule is changed.
 *
 * @evidence contracts/common.md#principled-implementation The synchronous face producer publishes actual admitted hair IDs before returning its model, so each call snapshots that same emission into an owned set. A thrown build never reaches the paired return.
 * @evidence contracts/common.md#clear-and-simple-design One closure owns the observer state and its per-call snapshot; person assembly consumes the paired result rather than reconstructing hair identities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Identities come from the actual hair emission without prefixes, region complements, naming copies or model metadata flags.
 * @evidence contracts/common.md#meaningful-documentation States bootstrap observation, synchronous ownership, reference-build isolation and failure effects.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The adapter observes identities owned by the hair producer and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The adapter forwards the admitted face document without defining or converting a form channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The face producer owns geometry emission; this adapter forwards its model unchanged.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The adapter constructs no surface or contact boundary.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The adapter moves no coordinate and preserves the producer's frame and units.
 * @evidenceExclude contracts/modeling.md#rendered-observation The adapter owns no displayed part or motion.
 * @evidenceExclude contracts/anatomy.md#anatomical-source No anatomical value or shape is introduced.
 * @evidenceExclude contracts/anatomy.md#permitted-range Input admission remains with the face producer.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The adapter introduces no numerical authoring input.
 */
export function createHumanPersonFaceBuilder(
  basis: IAutoMovieHumanFaceBasis,
  occlusion?: IAutoMovieHumanFaceOcclusionOptions,
) {
  let emitted: readonly string[] = [];
  const build = createHumanFaceBasisBuilder(basis, {
    occlusion,
    observeHairParts: (ids) => {
      emitted = ids;
    },
  });
  return (document: IAutoMovieHumanFaceBasisDocument) => {
    const model = build(document);
    return { model, hairPartIds: new Set(emitted) };
  };
}

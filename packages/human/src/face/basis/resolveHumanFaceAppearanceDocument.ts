import { resolveHumanFaceBrows } from "../anatomy/brow/resolveHumanFaceBrows";
import { expandHumanFaceHairTraits } from "../anatomy/hair/expandHumanFaceHairTraits";
import { expandHumanFaceScalpHair } from "../anatomy/hair/expandHumanFaceScalpHair";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";

/**
 * Resolve named appearance authoring into the established connected consumer.
 *
 * Whole brow omission takes its population owner's registered-side defaults.
 * Explicit brows retain sparse selection. A complete named scalp style and
 * the legacy full hair document are alternative inputs; sparse named traits
 * then edit the selected population without changing untouched fields. The
 * caller's document remains the saved authority and is never modified.
 *
 * @evidence contracts/common.md#principled-implementation Resolves each owned input once before pose, appearance caches and generation; both hair routes reach the same existing admitted generator.
 * @evidence contracts/common.md#clear-and-simple-design One document expansion keeps alternative and sparse authoring out of geometry owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Conflicting complete hair inputs refuse instead of choosing one silently; supplied counts and unselected traits remain unchanged.
 * @evidence contracts/common.md#meaningful-documentation States omission, sparse selection, conflict and saved-document ownership.
 * @evidence contracts/modeling.md#parameter-channels Expander owners retain named trait meanings, units and intentional coupling.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Existing populations own identities.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Unit conversion stays with each expansion owner.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Existing skin and growth hosts own attachment.
 * @evidenceExclude contracts/modeling.md#rendered-observation The face builder observes the generated result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The population and traits owners qualify their inputs.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing admission judges expanded dimensions and geometry.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no authoring trait.
 */
export function resolveHumanFaceAppearanceDocument(
  basis: IAutoMovieHumanFaceBasis,
  input: IAutoMovieHumanFaceBasisDocument,
): IAutoMovieHumanFaceBasisDocument {
  if (input.scalpHair !== undefined && input.hair !== undefined)
    throw new Error(
      "Named scalp styling and a complete legacy hairstyle are alternative inputs.",
    );
  const shape = { ...input.shape };
  for (const side of ["left", "right"] as const) {
    const profile = input.eyelidPhenotypes?.[side];
    if (profile === undefined) continue;
    if (input.eyelids?.[side] !== undefined)
      throw new Error(
        "Named lid morphology and source-row displacement are alternative inputs for one side: " +
          side,
      );
    if (profile.epicanthalFold !== undefined) {
      const id = side + "EpicanthalFold";
      if (Object.hasOwn(input.shape, id))
        throw new Error(
          "Named epicanthal morphology and its raw source channel duplicate one authoring trait: " +
            id,
        );
      const channel = basis.channels.find(
        (entry) => entry.id === id && entry.kind === "shape",
      );
      if (channel === undefined)
        throw new Error(
          "Named epicanthal morphology needs its source endpoint: " + side,
        );
      shape[id] =
        profile.epicanthalFold === "retracted"
          ? channel.minimum
          : channel.maximum;
    }
    if (
      profile.creaseHeightMm !== undefined &&
      Object.hasOwn(input.shape, side + "EyeFoldHeight")
    )
      throw new Error(
        "Named crease height and its raw source fold-height channel duplicate one authoring trait: " +
          side,
      );
  }
  let hair =
    input.scalpHair === undefined
      ? input.hair
      : expandHumanFaceScalpHair(basis, input.scalpHair);
  if (input.hairTraits !== undefined)
    hair = expandHumanFaceHairTraits(basis, hair, input.hairTraits);
  return {
    ...input,
    shape,
    hair,
    brows: resolveHumanFaceBrows(basis, input.brows),
  };
}

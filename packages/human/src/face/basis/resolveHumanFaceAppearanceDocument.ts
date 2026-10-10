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

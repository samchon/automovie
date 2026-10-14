import type {
  IAutoMovieHumanFaceBasisChannel as IAutoMovieHumanFaceBasisChannelImported,
  IAutoMovieHumanFaceEyelidPhenotype as IAutoMovieHumanFaceEyelidPhenotypeImported,
  IAutoMovieHumanFaceHair as IAutoMovieHumanFaceHairImported,
} from "../../index";
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
 * @evidence contracts/common.md#principled-implementation Named scalp/traits, brow populations and lid phenotypes expand through their owning source catalogues; raw epicanthal shape channels receive the admitted shape endpoint minimum/maximum. Copying shape preserves saved authored input while conflicting named/raw representations refuse.
 * @evidence contracts/common.md#clear-and-simple-design This adapter coordinates current named authoring with existing connected consumers; scalp, facial population and brow expansion remain with their source-specific owners instead of duplicating geometry rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Named scalp plus legacy hairstyle, named lid plus source displacement and duplicate raw epicanthal/fold-height traits refuse. Registered-side brow defaults are authored population behavior, not guessed anatomy; absent source endpoints are not synthesized.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes omission defaults, sparse named edits, alternative inputs and saved authority; output is shallow except copied shape and expansions, so unchanged nested input records remain borrowed.
 * @evidence contracts/performance.md#efficient-algorithms Shape copying is O(C) authored keys and source channel lookup is linear per active named lid trait; scalp/trait/brow expansion costs follow their actual stations/populations, not constant adapter overhead alone.
 * @evidence contracts/performance.md#reuse-equivalent-work Expansion reads the fixed admitted basis and preserves untouched fields; the builder's later pose/hair owners decide equivalent geometry reuse. This effect-free adapter does not retain cross-document state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned shape and expanded profiles belong to the resolved request while untouched nested records are shared by value contract; temporary lookups are local and no handles or asynchronous work exist.
 */
export function resolveHumanFaceAppearanceDocument(
  basis: IAutoMovieHumanFaceBasis,
  input: IAutoMovieHumanFaceBasisDocument,
): IAutoMovieHumanFaceBasisDocument {
  if (input.scalpHair !== undefined && input.hair !== undefined)
    throw new Error(
      "Named scalp styling and a complete legacy hairstyle are alternative inputs.",
    );
  const shape: { [x: string]: number } = { ...input.shape };
  for (const side of ["left", "right"] as const) {
    const profile: IAutoMovieHumanFaceEyelidPhenotypeImported | undefined =
      input.eyelidPhenotypes?.[side];
    if (profile === undefined) continue;
    if (input.eyelids?.[side] !== undefined)
      throw new Error(
        "Named lid morphology and source-row displacement are alternative inputs for one side: " +
          side,
      );
    if (profile.epicanthalFold !== undefined) {
      const id: string = side + "EpicanthalFold";
      if (Object.hasOwn(input.shape, id))
        throw new Error(
          "Named epicanthal morphology and its raw source channel duplicate one authoring trait: " +
            id,
        );
      const channel: IAutoMovieHumanFaceBasisChannelImported | undefined =
        basis.channels.find(
          (entry: IAutoMovieHumanFaceBasisChannelImported): boolean =>
            entry.id === id && entry.kind === "shape",
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
  let hair: IAutoMovieHumanFaceHairImported | null | undefined =
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

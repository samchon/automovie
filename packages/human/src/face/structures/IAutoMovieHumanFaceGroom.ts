import type { IAutoMovieMaterial } from "@automovie/interface";
import type { IPortraitHairShape } from "../anatomy/hair/IPortraitHairShape";
import { IAutoMovieHumanFaceGroomCard } from "./IAutoMovieHumanFaceGroomCard";

/**
 * A complete groom expressed against one facial basis, plus its finish.
 *
 * The profile carries every control a procedural groom carries except the cards
 * themselves, so the same taper, fibre and curl authoring applies unchanged;
 * only where the locks live differs. The finish travels with the groom because
 * a connected facial basis has no hair material of its own to name, and a groom
 * that could not state its own finish would be unusable without editing the
 * basis it was authored against.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Keeps authored lock arrays replaceable as one independent numerical profile.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Separates complete card replacement from width, taper and tessellation controls.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceGroom {
  /** Stable identity of this authored groom. */
  id: string;

  /** Identity of the facial basis whose surfaces the seats name. */
  basis: string;

  /** Base finish the generated card material derives from. */
  finish: IAutoMovieMaterial;

  /** Every authored control a procedural groom carries except the locks. */
  profile: Omit<IPortraitHairShape, "cards" | "material">;

  /** Zero through 1024 surface-seated locks. */
  cards: readonly IAutoMovieHumanFaceGroomCard[];
}

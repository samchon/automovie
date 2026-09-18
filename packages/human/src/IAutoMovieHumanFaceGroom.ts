import type { IAutoMovieMaterial } from "@automovie/interface";

import type { IPortraitHairShape } from "./components/hairCards";

/**
 * One authored lock seated on a facial surface rather than placed in space.
 *
 * A lock that holds its own coordinates is only correct for the face it was
 * authored against: the first shape edit moves the skin and leaves the hair
 * behind. Naming the triangle the lock grows from, and writing the lock in that
 * triangle's own frame, makes the placement a property of the surface, so a
 * widened head or an opened jaw carries its hair without anything recomputing.
 *
 * The stations are metres relative to the seat, not to the model origin, and
 * the frame is the seating triangle's first edge, its surface normal, and their
 * cross product. Binding is not simulation: nothing here moves under force, and
 * a lock that intersects the scalp when seated still intersects it afterwards.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Names the rooted guide, width and transverse orientation of one surface-based hair lock.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines head-space guide stations that emit a continuous UV-bearing strip.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceGroomCard {
  /** Identity of the resident model part the lock is seated on. */
  part: string;
  /** Ordinal of the seating triangle within that part's own index buffer. */
  triangle: number;
  /** Barycentric weights of the seat inside that triangle, first u then v. */
  weights: readonly [number, number];
  /** Two through 32 root-to-tip stations in the seat frame, in metres. */
  guide: readonly (readonly [number, number, number])[];
  /** Width directions paired with the stations, in the same frame. */
  across: readonly (readonly [number, number, number])[];
  /** Positive full root width in metres, no greater than 0.04. */
  width: number;
}

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
  /** Compact groom schema, separate from the basis and document schemas. */
  version: "human-face-groom/1";
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

import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import type { IHumanSourceCut } from "./IHumanSourceCut.ts";
import type { IHumanSourceAuthoredSkin } from "./IHumanSourceAuthoredSkin.ts";
import type { IHumanSourceSample } from "./IHumanSourceSample.ts";
import type { IHumanSourceDeltaReader } from "./IHumanSourceDeltaReader.ts";
import type { IHumanSourceCompactedTopology } from "./IHumanSourceCompactedTopology.ts";
import type { IHumanSourceAuthoredPacket } from "./IHumanSourceAuthoredPacket.ts";

/** Original recipe recovery and verified current replay for pre-binding seal.
 * @author Samchon
 */
export interface IHumanSourceLipClosurePreparation {
  /** Original published contact metadata and closure endpoint. */
  original: IAutoMovieHumanFaceBasis;

  /** Exact original extraction cut used for recipe comparison and residual carry. */
  originalCut: IHumanSourceCut;

  /** Current neutral head/root correspondence before closure authoring. */
  skin: IHumanSourceAuthoredSkin;

  /** Immutable original state/recipe population. */
  sample: IHumanSourceSample;

  /** Original sampled differences in the published canonical frame. */
  originalReader: IHumanSourceDeltaReader;

  /** Verified current provider differences in the same frame. */
  currentReader: IHumanSourceDeltaReader;

  /** Dense current source and original-native index correspondence. */
  root: IHumanSourceCompactedTopology;

  /** Provider support for appended native points. */
  packet: IHumanSourceAuthoredPacket;
}

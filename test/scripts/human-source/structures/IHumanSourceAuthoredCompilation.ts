import type { IHumanSourceAuthoredPacket } from "./IHumanSourceAuthoredPacket.ts";
import type { IHumanSourceAuthoredSkin } from "./IHumanSourceAuthoredSkin.ts";
import type { IHumanSourceCompactedTopology } from "./IHumanSourceCompactedTopology.ts";
import type { IHumanSourceDeltaReader } from "./IHumanSourceDeltaReader.ts";
import type { IHumanSourceEditReceipt } from "./IHumanSourceEditReceipt.ts";
import type { IHumanSourceExcludedRegionReceipt } from "./IHumanSourceExcludedRegionReceipt.ts";
import type { IHumanSourceGenerationInput } from "./IHumanSourceGenerationInput.ts";
import type { IHumanSourceHeadGuide } from "./IHumanSourceHeadGuide.ts";
import type { IHumanSourceLidSeatReceipt } from "./IHumanSourceLidSeatReceipt.ts";
import type { IHumanSourceLipSealReceipt } from "./IHumanSourceLipSealReceipt.ts";
import type { IHumanSourceNasalAxisReceipt } from "./IHumanSourceNasalAxisReceipt.ts";
import type { IHumanSourceOrbitalSkinReceipt } from "./IHumanSourceOrbitalSkinReceipt.ts";

/** Same-run root and endpoint reader consumed by the main generation
 * assembler. Historical metadata crosses its retired-aware lineage boundary
 * separately; this intermediate result grants no anatomical acceptance.
 * @author Samchon
 */
export interface IHumanSourceAuthoredCompilation {
  root: IHumanSourceCompactedTopology;
  skin: IHumanSourceAuthoredSkin;
  packet: IHumanSourceAuthoredPacket;
  reader: IHumanSourceDeltaReader;
  inputs: IHumanSourceGenerationInput[];
  /** SHA-256 of the head authoring `source-inputs.json` the replay was verified against. */
  authoringInputsSha256: string;
  nasalAxis: IHumanSourceNasalAxisReceipt;
  headGuide: IHumanSourceHeadGuide;
  /** Actual source-neutral contact authoring on this same root and frame. */
  bodyNeutralReceipt: Record<string, unknown>;
  /** Neutral lid cage authoring on this same root and frame. */
  lidSeatReceipt: IHumanSourceLidSeatReceipt;
  /** Hidden neutral skin inside the posterior loops, on this same root. */
  orbitalSkinReceipt: IHumanSourceOrbitalSkinReceipt;
  /** Neutral lip closure authored through the actual mapped closure rule. */
  lipSealReceipt?: IHumanSourceLipSealReceipt;
  /** Only explicit completed-eye checkpoint reads carry this unsatisfied gate. */
  inspectionRefusal?: string;
  /** Product-excluded skin regions filled on this same root. */
  excludedRegionReceipts: IHumanSourceExcludedRegionReceipt[];
  /** Published addresses of everything these stages moved over the sampled source. */
  editReceipt: IHumanSourceEditReceipt;
  /** Canonical source vertices whose neutral position these stages moved, ascending. */
  movedSourceVertices: number[];
}

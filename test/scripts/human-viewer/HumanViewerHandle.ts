import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human";
import type { IAutoMovieHumanFacePeriocularMappingReport } from "@automovie/human/face/structures/IAutoMovieHumanFacePeriocularMappingReport";
import type { IConnectedBodyConstructionExportResult } from "@automovie/playground/src/human/body/IConnectedBodyConstructionExportResult";

import type { HumanViewerAddress } from "./HumanViewerAddress";

/**
 * Read-only browser observation protocol, shared by the page host and server.
 * Numerical document editing is absent. A PNG may contain a
 * composed local photograph, but photographs and their paths never enter
 * numerical cache persistence.
 *
 * @evidence contracts/common.md#principled-implementation The protocol separates display selection from numerical authoring and private reference resources.
 * @evidence contracts/common.md#clear-and-simple-design A single browser contract serves resident HTTP and human navigation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Operations never address anatomical vertices or fitted subject constants.
 * @evidence contracts/common.md#meaningful-documentation Defines read-only ownership, provenance and canvas capture.
 * @author Samchon
 */
export interface HumanViewerHandle {
  /** Apply display state and finish the GPU frame. */
  show(address: HumanViewerAddress): Promise<void>;

  /** Exact displayed mesh names from the product observation hook. */
  parts(): string[];

  /** Unmasked WebGL device string. */
  renderer(): string;

  /** Source digest against which the current resident was built. */
  revision(): string;

  /** Actual numerical worker builds, excluding disk and GPU cache hits. */
  builds(): number;

  /** Milliseconds the numerical worker took for the last build, zero before the first. */
  buildMs(): number;

  /** Page milliseconds per named stage of the last show, empty for a pure cache hit. */
  spans(): Record<string, number>;

  /** Last committed display selection; refuses before any model is displayed. */
  address(): HumanViewerAddress;

  /** Actual construction checks, null when no construction is displayed. */
  admission(): IAutoMovieHumanConstructionAdmission | null;

  /** Encode the displayed Person construction, preserving rejected admission. */
  exportConstruction(): Promise<IConnectedBodyConstructionExportResult>;

  /** Owner mapping readings from the constructed face; absence reports no reading. */
  periocularMappings?():
    | IAutoMovieHumanFacePeriocularMappingReport[]
    | undefined;

  /** Finished PNG; refuses before display, and includes a shown local reference photograph. */
  png(): string;

  /** Release the least recently used resident other than the one shown; false when none is left. */
  evict(): boolean;
}

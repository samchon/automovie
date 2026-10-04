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

  /** Last committed display selection. */
  address(): HumanViewerAddress;

  /** Finished PNG: the canvas, composed with the reference photograph when one is shown. */
  png(): string;

  /**
   * Admit one document JSON with its domain owner's admission; null when
   * admitted, else the owner's reason. Pure: draws and caches nothing.
   */
  admit(domain: string, text: string): string | null;
}

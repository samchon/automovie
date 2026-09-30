import type { HumanViewerAddress } from "./HumanViewerAddress";

/**
 * Read-only browser observation protocol, shared by the page host and server.
 * Numerical document editing is absent. PNGs contain the GPU canvas alone:
 * local photographs and their paths never enter numerical cache persistence.
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

  /** Last committed display selection. */
  address(): HumanViewerAddress;

  /** Finished raw canvas PNG, excluding local reference display layers. */
  png(): string;
}

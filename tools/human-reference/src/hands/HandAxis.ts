import type { V3 } from "../geometry/V3.ts";

/**
 * Identifies a registered digit chain used to distinguish isolated and merged sections.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Uses registered joint chains only to label geometric observations; joint centres remain rig markers.
 * @evidence contracts/common.md#clear-and-simple-design One named chain supplies all plane-crossing classification for that digit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no mesh topology or fixed source indices.
 * @evidence contracts/common.md#meaningful-documentation Names the chain's purpose, units and nonclinical status.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data interface coordinates no requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data interface acquires no resources.
 */
export interface HandAxis {
  /** Registered digit name, used only to label source-axis crossings. */
  name: string;

  /** Ordered registered joints and observed axial tip, in world millimetres. */
  chain: V3[];
}

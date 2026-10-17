import type { V3 } from "../geometry/V3.ts";
import type { BranchDefinition } from "./BranchDefinition.ts";
import type { BranchSection } from "./BranchSection.ts";

/**
 * Records native source branch sections and local height-function surgery.
 * Source point coordinates are private observations, never shipped body coefficients.
 *
 * @evidence contracts/common.md#principled-implementation Retains lower and upper link component counts plus incident contours on both sides of a physical critical level, including changes with constant total loop count.
 * @evidence contracts/common.md#clear-and-simple-design Holds the region definition, its observations and unresolved conditions together; geometric surgery is not relabelled as a clinical attachment.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Serializes no source vertex, edge or triangle address and claims no generated-surface acceptance.
 * @evidence contracts/common.md#meaningful-documentation Defines the event bracket, source frame, nonmanifold and equal-level flags, and observation-only status.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This data declaration selects no processing algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This data declaration owns no computation or cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This data declaration owns no acquired resource.
 * @author Samchon
 */
export interface BranchObservation {
  /** Artifact schema; this is not a product Human input. */
  schema: "reference-branch-observation-v1";

  /** Fixed source rig window and physical section family. */
  definition: BranchDefinition;

  /** Ordinary source cuts and full incident contours around each local saddle. */
  sections: BranchSection[];

  /** Local surgery, preserving uncertainty and simultaneous physical levels. */
  events: {
    id: string;
    point: V3;
    stationMm: number;
    bracketMm: [number, number];
    lowerLinkComponents: number;
    upperLinkComponents: number;
    manifoldLink: boolean;
    equalHeightNeighbour: boolean;
    below: string;
    above: string;
  }[];

  /** Conditions that prevent interpreting the observations as validated anatomy. */
  limits: string[];
}

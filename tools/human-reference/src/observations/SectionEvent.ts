import { V3 } from "../geometry/V3.ts";
import { EventContour } from "./EventContour.ts";

/**
 * Physical PL-height event and exact incident saved contour identities, without source mesh addresses.
 *
 * @evidence contracts/common.md#principled-implementation A structural SectionEvent declaration exposes its documented geometric or observation quantities without runtime conversion.
 * @evidence contracts/common.md#clear-and-simple-design This file owns only the named data boundary; computation remains in its explicit producers and consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is erased and contains no specimen-specific geometry or executable fallback.
 * @evidence contracts/common.md#meaningful-documentation Describes the quantity, private-data boundary or physical frame needed to interpret its members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 *
 * @author Samchon
 */
export interface SectionEvent {
  /** Native-root event height in millimetres. */
  y: number;
  /** Physical source location, retained as an observation rather than a product control. */
  point: V3;
  /** Connected lower-link components at the source critical vertex. */
  lowerLinkComponents: number;
  /** Connected upper-link components at the source critical vertex. */
  upperLinkComponents: number;
  /** Records that classification needed an equal-height symbolic tie. */
  equalHeightNeighbour: boolean;
  /** Records whether the welded source link is one topological cycle. */
  manifoldLink: boolean;
  /** Exact saved lower-bracket plane height in millimetres. */
  y0: number;
  /** Exact saved upper-bracket plane height in millimetres. */
  y1: number;
  /** Lower-slice contours with source-edge support incident to this event. */
  below: EventContour[];
  /** Upper-slice contours with source-edge support incident to this event. */
  above: EventContour[];
  /** Source protocol used to derive the incidence relation. */
  method: string;
}

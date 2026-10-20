import type { Building } from "../Building";
import type { TourView } from "../TourView";

/**
 * Build-time envelope around a production's unchanged native payload and usable authored camera choices.
 *
 * @evidence contracts/common.md#principled-implementation Building identity selects the native uploader while a nonempty views array contains the initial camera id; readTourData checks these envelope facts but does not deeply validate native geometry or numeric camera fields.
 * @evidence contracts/common.md#clear-and-simple-design Portable navigation fields surround one opaque native payload, leaving the production responsible for geometry and material semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The native object remains producer-owned rather than being replaced by website-authored model data.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish navigation copy, source destination, initial camera and opaque uploader input.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased envelope performs no traversal or decoding.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type defines no request cache or effect-sharing policy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This type acquires no renderer resources or transport tasks.
 */
export interface TourData {
  /** Production identity checked when the network payload is read. */
  building: Building;

  /** Collection title displayed by the tour. */
  title: string;

  /** Historical context displayed beside the title. */
  era: string;

  /** Production repository URL shown by the source link. */
  source: string;

  /** Authored view id used on first mount and reset. */
  initial: string;

  /** Usable authored perspective views, with the initial view first and remaining views in source order. */
  views: TourView[];

  /** Unchanged production payload passed to that production's scene uploader. */
  native: unknown;
}

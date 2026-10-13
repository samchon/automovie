import type { Building } from "../Building";
import type { TourView } from "../TourView";

/**
 * Build-time envelope around a production's unchanged native payload and usable authored camera choices.
 *
 * @author Samchon
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

  /** Usable authored perspective views in source order. */
  views: TourView[];

  /** Unchanged production payload passed to that production's scene uploader. */
  native: unknown;
}

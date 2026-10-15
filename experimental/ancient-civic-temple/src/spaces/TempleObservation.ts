import type { IAutoMovieVector3 } from "@automovie/interface";
import { TempleView } from "./TempleView";

/**
 * One authored or derived observation station of the temple; an unavailable station keeps a null
 * pose and a note.
 */
export interface TempleObservation {
  /** Station identity. */
  id: string;
  /** Population the station belongs to. */
  group: "exterior" | "space" | "site" | "junction" | "section" | "reference";
  /** Space the station observes, or null for exterior and site views. */
  space: string | null;
  /** Question the station answers, such as `opening-facing` or `setting`. */
  role: string;
  /** Human-readable station name. */
  label: string;
  /** World eye position, or null when unavailable. */
  position: IAutoMovieVector3 | null;
  /** World look-at point, or null when unavailable. */
  target: IAutoMovieVector3 | null;
  /** Why the station is unavailable or how it was placed; null when nothing needs saying. */
  note: string | null;
  /** Inspection view the viewer enables with the station. */
  view?: TempleView;
}

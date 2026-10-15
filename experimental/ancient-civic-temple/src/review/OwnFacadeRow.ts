import { OwnFacadeSide } from "./OwnFacadeSide";

/** Visibility of one single-space facade from its own observation station. */
export interface OwnFacadeRow {
  /** Boundary identity of the facade. */
  id: string;
  /** Counts for each emitted side of the facade. */
  sides: OwnFacadeSide[];
}

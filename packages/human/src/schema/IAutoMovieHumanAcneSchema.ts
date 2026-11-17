import type { IAutoMovieHumanAcne } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanAcne. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanAcneSchema = IAutoMovieHumanAcne & {
  /** Expected spots per square centimetre of rest surface on the face, 0 to 10. */
  density: number & tags.Minimum<0> & tags.Maximum<10>;

  /** Maximum inflamed spot diameter in rest-surface millimetres, 3 to 10. */
  diameterMm: number & tags.Minimum<3> & tags.Maximum<10>;

  /** Redness coverage, 0 to 1; spots are drawn as colour only, without papule relief or a silhouette-shape control. */
  severity: number & tags.Minimum<0> & tags.Maximum<1>;
};

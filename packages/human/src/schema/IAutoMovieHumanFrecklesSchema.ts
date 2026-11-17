import type { IAutoMovieHumanFreckles } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanFreckles. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanFrecklesSchema = IAutoMovieHumanFreckles & {
  /** Expected marks per square centimetre of rest surface where freckling is strongest (face, shoulders, upper chest and back), 0 to 40; less exposed skin takes a fraction of it. */
  density: number & tags.Minimum<0> & tags.Maximum<40>;

  /** Largest spot diameter in rest-surface millimetres, 2 to 6; diameters spread down to a third of it, and the finite mark image softens spots near its texel size. */
  diameterMm: number & tags.Minimum<2> & tags.Maximum<6>;

  /** Pigment coverage from invisible (0) to full local pigment replacement (1). */
  contrast: number & tags.Minimum<0> & tags.Maximum<1>;
};

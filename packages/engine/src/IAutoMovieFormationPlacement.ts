import { IAutoMovieFormationDesign } from "@automovie/interface";
import { IAutoMovieFormationGrounding } from "./IAutoMovieFormationGrounding";

/**
 * What a formation needs to say where one of its slots stands.
 *
 * @evidence requirements/formations/layouts-and-slots.md#formation-local-frame Collects identity, layout, anchor, facing, seed, and ground needed to derive a slot from the unit-local frame.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Defines the compact placement input shared by every slot derivation.
 */
export type IAutoMovieFormationPlacement = Pick<
  IAutoMovieFormationDesign,
  "id" | "count" | "layout" | "anchor" | "facingDeg" | "seed"
> &
  IAutoMovieFormationGrounding;

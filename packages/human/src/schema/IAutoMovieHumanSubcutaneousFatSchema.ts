import type { IAutoMovieHumanSubcutaneousFat } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanSubcutaneousFat. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanSubcutaneousFatSchema =
  IAutoMovieHumanSubcutaneousFat & {
    /** Over the rectus abdominis, beside and below the navel. */
    abdomen: number & tags.Minimum<0> & tags.Maximum<150>;

    /** Over the external oblique, above the iliac crest at the side. */
    flank: number & tags.Minimum<0> & tags.Maximum<150>;

    /** Over the pectoralis major, above any breast. */
    chest: number & tags.Minimum<0> & tags.Maximum<150>;

    /** Over the back below the scapula. */
    back: number & tags.Minimum<0> & tags.Maximum<150>;

    /** Over the biceps brachii at mid upper arm. */
    upperArmFront: number & tags.Minimum<0> & tags.Maximum<100>;

    /** Over the triceps brachii at mid upper arm. */
    upperArmBack: number & tags.Minimum<0> & tags.Maximum<100>;

    /** Over the forearm's muscle bellies below the elbow. */
    forearm: number & tags.Minimum<0> & tags.Maximum<100>;

    /** Over the quadriceps at mid thigh. */
    thighFront: number & tags.Minimum<0> & tags.Maximum<150>;

    /** Over the hamstrings at mid thigh. */
    thighBack: number & tags.Minimum<0> & tags.Maximum<150>;

    /** Over the gastrocnemius at the calf's greatest girth. */
    calf: number & tags.Minimum<0> & tags.Maximum<100>;
  };

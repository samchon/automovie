import type {
  IAutoMovieHumanLipExpression,
  IAutoMovieHumanPair,
} from "@automovie/interface";
import type { tags } from "typia";


/** Typia admission/schema metadata for IAutoMovieHumanLipExpression. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanLipExpressionSchema =
  IAutoMovieHumanLipExpression & {
    /** AU10, levator labii superioris: the upper lip rises. */
    upperLipRaiser?: IAutoMovieHumanPair<
      number & tags.Minimum<0> & tags.Maximum<1>
    >;

    /** AU12, zygomaticus major: the mouth corner pulls up and back. */
    lipCornerPuller?: IAutoMovieHumanPair<
      number & tags.Minimum<0> & tags.Maximum<1>
    >;

    /** AU15, depressor anguli oris: the mouth corner lowers. */
    lipCornerDepressor?: IAutoMovieHumanPair<
      number & tags.Minimum<0> & tags.Maximum<1>
    >;

    /** AU20, risorius with platysma: the mouth corner stretches sideways. */
    lipStretcher?: IAutoMovieHumanPair<
      number & tags.Minimum<0> & tags.Maximum<1>
    >;

    /** AU16, depressor labii inferioris: the lower lip lowers. */
    lowerLipDepressor?: IAutoMovieHumanPair<
      number & tags.Minimum<0> & tags.Maximum<1>
    >;

    /** AU17, mentalis: the chin's skin and the lower lip push up, as when the lower lip meets the upper teeth for /f/. */
    chinRaiser?: number & tags.Minimum<0> & tags.Maximum<1>;

    /** AU18, incisivus labii: the lips push forward and gather (pucker). */
    lipPucker?: number & tags.Minimum<0> & tags.Maximum<1>;

    /** AU22, orbicularis oris: the lips funnel outward. */
    lipFunneler?: number & tags.Minimum<0> & tags.Maximum<1>;

    /** AU23, orbicularis oris: the lips tighten and thin. */
    lipTightener?: number & tags.Minimum<0> & tags.Maximum<1>;

    /** AU24, orbicularis oris: the lips press together. */
    lipPressor?: number & tags.Minimum<0> & tags.Maximum<1>;

    /** AU25: the lips part, without requiring the jaw to drop. */
    lipsPart?: number & tags.Minimum<0> & tags.Maximum<1>;

    /** AU28, orbicularis oris: the lips are sucked in over the teeth. */
    lipSuck?: number & tags.Minimum<0> & tags.Maximum<1>;

    /** AU34, cheek puff: air inflates the cheeks with the lips closed. */
    cheekPuff?: number & tags.Minimum<0> & tags.Maximum<1>;
  };

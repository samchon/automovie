/**
 * An exterior metric target or an observed scalar with acquisition context.
 *
 * The owning landmark field decides whether this is a girth or a straight
 * distance. A fictional target has no invented measurement device or scan.
 * Observation uncertainty is omitted when unknown rather than set to zero.
 * @author Samchon
 */
export type AutoMovieHumanBodySurfaceDimension<
  Method extends string,
  Posture extends "standing" | "seated" | "supine" =
    | "standing"
    | "seated"
    | "supine",
> =
  | { readonly kind: "target"; readonly metres: number }
  | {
      readonly kind: "observed";
      readonly metres: number;
      readonly method: Method;
      readonly acquisitionPosture: Posture;
      readonly uncertaintyMetres?: number;
    };

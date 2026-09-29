/**
 * Crown-to-floor stature desired or measured in an erect standing posture.
 *
 * This is the ordinary body-editor height input, not a body-mesh Y bound or
 * the length of a vertebral chain. A supine CT table length is not the same
 * measurement. Missing uncertainty remains unknown.
 * @author Samchon
 */
export type IAutoMovieHumanBodyStandingStature =
  | { readonly kind: "target"; readonly metres: number }
  | {
      readonly kind: "observed";
      readonly metres: number;
      readonly method: "stadiometer" | "surface-scan";
      readonly uncertaintyMetres?: number;
    };

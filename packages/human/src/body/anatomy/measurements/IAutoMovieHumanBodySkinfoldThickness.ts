/**
 * A target or observed double-layer skinfold at a named body site.
 *
 * Calipers pinch two layers of skin and underlying subcutaneous adipose;
 * this millimetre reading is not one-sided fat thickness, a regional 3D fat
 * volume, or a muscle boundary. NHANES Body Measures Manual §3.4.10 defines
 * the triceps and subscapular observation procedure and its failure cases.
 * The owning field supplies the anatomical site and body side.
 * @author Samchon
 */
export type IAutoMovieHumanBodySkinfoldThickness =
  | { readonly kind: "target"; readonly millimetres: number }
  | {
      readonly kind: "observed";
      readonly millimetres: number;
      readonly method: "skinfold-caliper";
      readonly acquisitionPosture: "standing";
      readonly uncertaintyMillimetres?: number;
    };

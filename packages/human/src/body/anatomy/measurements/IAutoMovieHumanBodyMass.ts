/**
 * Target body mass or an actual scale reading in kilograms.
 *
 * Mass alone does not determine the proportions of bone, muscle and adipose
 * tissue or the exterior volume, so the generator must resolve composition
 * separately with an evaluated population model.
 * @author Samchon
 */
export type IAutoMovieHumanBodyMass =
  | { readonly kind: "target"; readonly kilograms: number }
  | {
      readonly kind: "observed";
      readonly kilograms: number;
      readonly method: "scale";
      readonly uncertaintyKilograms?: number;
    };

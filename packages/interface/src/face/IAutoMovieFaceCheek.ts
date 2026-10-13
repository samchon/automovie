import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Traits of ONE cheek: signed morph weights in `[-2, 2]`, `0`/omitted meaning
 * unchanged. Lives under {@link IAutoMovieFaceCheekSet.left} / `right`; when it
 * is the only side defined, it applies to BOTH cheeks. `fullness` projects onto
 * the `cheekFullnessR` / `cheekFullnessL` morph targets.
 *
 * @author Samchon
 */
export interface IAutoMovieFaceCheek {
  /**
   * Volume of the cheek around the cheekbone: `+` full and round, `-` gaunt.
   */
  fullness?: AutoMovieFaceWeight;
}

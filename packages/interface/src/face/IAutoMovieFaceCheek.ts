import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Traits of ONE cheek: signed morph weights in `[-2, 2]`, `0`/omitted meaning
 * unchanged. Lives under {@link IAutoMovieFaceCheekSet.left} / `right`; when it
 * is the only side defined, it applies to BOTH cheeks. `fullness` projects onto
 * the `cheekFullnessR` / `cheekFullnessL` morph targets.
 *
 * @evidence contracts/common.md#principled-implementation One optional `fullness` leaf that `flattenFace` reads into `cheekFullnessR` and `cheekFullnessL`, sourcing both targets from a lone defined cheek, applied as an additive template delta.
 * @evidence contracts/common.md#clear-and-simple-design A per-cheek record holding only soft-tissue volume around the cheekbone, leaving side resolution to `IAutoMovieFaceCheekSet`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The cheeks row of the `PAIRED` table reuses the shared side loop; there is no cheek-specific branch in projection, validation or morphing.
 * @evidence contracts/common.md#meaningful-documentation Gives the range, that omission leaves the cheek unchanged, the lone-side rule, the target names, and that positive fullness rounds the cheek while negative makes it gaunt.
 * @author Samchon
 */
export interface IAutoMovieFaceCheek {
  /**
   * Volume of the cheek around the cheekbone: `+` full and round, `-` gaunt.
   */
  fullness?: AutoMovieFaceWeight;
}

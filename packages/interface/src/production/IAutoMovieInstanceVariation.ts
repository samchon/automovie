import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Seed-derived per-instance visual and semantic variation.
 *
 * @evidence requirements/production-design/art-direction-and-visual-language.md#production-design-consistency-variation Exposes `IAutoMovieInstanceVariation` as the portable data boundary for the production design consistency variation requirement.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-visual-language-variation Types `IAutoMovieInstanceVariation` for the narrative intent visual language variation system contract.
 */
export interface IAutoMovieInstanceVariation {
  /**
   * Inclusive uniform scale range, both strictly above zero.
   *
   * @evidence requirements/production-design/art-direction-and-visual-language.md#production-design-consistency-variation Exposes `scale` as the portable data boundary for the production design consistency variation requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-visual-language-variation Types `scale` for the narrative intent visual language variation system contract.
   */
  scale: { min: number; max: number };
  /**
   * Optional independent scale ranges per local axis.
   *
   * @evidence requirements/production-design/art-direction-and-visual-language.md#production-design-consistency-variation Exposes `scale3` as the portable data boundary for the production design consistency variation requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-visual-language-variation Types `scale3` for the narrative intent visual language variation system contract.
   */
  scale3?: { min: IAutoMovieVector3; max: IAutoMovieVector3 };
  /**
   * Optional seeded XYZ Euler offsets in degrees, applied after facing.
   *
   * @evidence requirements/production-design/art-direction-and-visual-language.md#production-design-consistency-variation Exposes `rotationDeg` as the portable data boundary for the production design consistency variation requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-visual-language-variation Types `rotationDeg` for the narrative intent visual language variation system contract.
   */
  rotationDeg?: {
    x: { min: number; max: number };
    y: { min: number; max: number };
    z: { min: number; max: number };
  };
  /**
   * Seeded probability that a procedural slot is visible.
   *
   * @evidence requirements/production-design/art-direction-and-visual-language.md#production-design-consistency-variation Exposes `visibleProbability` as the portable data boundary for the production design consistency variation requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-visual-language-variation Types `visibleProbability` for the narrative intent visual language variation system contract.
   */
  visibleProbability?: number;
  /**
   * Non-empty exact `#RRGGBB` palette choices applied per instance.
   *
   * An entry is the color itself rather than a label for one, so the viewer
   * decodes it from sRGB to linear with `srgbHexToLinearColor` before it
   * reaches the instance. A model recipe palette is decoded by that same
   * function on its way into `baseColor`, so the identical swatch authored
   * either way now renders the identical color.
   *
   * `IAutoMovieColor` holds the opposite convention: its components are
   * authored linear and its `hex` is a derived label the renderer never
   * decodes. Reach for `srgbHexToLinearColor` when carrying a swatch across
   * that boundary. Pasting the digits straight into a triple renders about
   * 2.3x too bright at midtones, and instanced slots covering the same surface
   * as such a material is how one production ended up drawing one roof in two
   * colors.
   *
   * @evidence requirements/production-design/art-direction-and-visual-language.md#production-design-consistency-variation Exposes `palette` as the portable data boundary for the production design consistency variation requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-visual-language-variation Types `palette` for the narrative intent visual language variation system contract.
   */
  palette: string[];
  /**
   * Named bounded numeric traits regenerated from seed and slot.
   *
   * @evidence requirements/production-design/art-direction-and-visual-language.md#production-design-consistency-variation Exposes `traits` as the portable data boundary for the production design consistency variation requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-visual-language-variation Types `traits` for the narrative intent visual language variation system contract.
   */
  traits: Array<{
    /** Stable trait name unique in this set. */
    name: string;
    /** Inclusive minimum. */
    min: number;
    /** Inclusive maximum. */
    max: number;
  }>;
}

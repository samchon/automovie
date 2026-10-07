import type { IAutoMovieHumanFaceMaterialRgb } from "./IAutoMovieHumanFaceMaterialRgb";

/**
 * Appearance edits to one existing facial source material.
 *
 * Base colour and roughness retain their normalized source-material meaning.
 * Fibre pigment and density require source coverage registration: the card
 * consumer paints their alpha texture, while numerical shafts use the same
 * pigment and an explicitly qualified opacity-gain conversion. Density is
 * neither a shaft count nor a geometric growth control. Omission retains the
 * corresponding source value; no mean complexion or pigment is supplied.
 *
 * @evidence contracts/common.md#principled-implementation Separates source finish controls from generated population geometry and keeps linear colour distinct from coverage gain.
 * @evidence contracts/common.md#clear-and-simple-design One named material-edit record owns the source finish fields previously nested in the document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing material identity and fibre eligibility are admitted by the consumers, without a subject preset or silently inferred pigment.
 * @evidence contracts/common.md#meaningful-documentation States omission, coverage eligibility and the distinct card/shaft density conversions.
 * @evidence contracts/modeling.md#spatial-conventions Colours and roughness are dimensionless; density is a dimensionless gain, not an anatomical length or count.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines appearance edits without changing geometric form.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Material identity belongs to the source; this record names no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Constructs no geometric join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The finished surface's material consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Authored finish values do not reconstruct skin or fibre biology.
 * @evidenceExclude contracts/anatomy.md#permitted-range Finish admission establishes no physiological interval.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no shaping input.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceMaterialOverride {
  /** Complete linear RGB override, each channel in [0,1]. */
  color?: IAutoMovieHumanFaceMaterialRgb;

  /** Surface roughness in [0,1], independent from base colour. */
  roughness?: number;

  /** Fibre linear RGB pigment in [0,1], requiring registered source coverage. */
  pigment?: [number, number, number];

  /** Coverage gain in [0,4], distinct from explicit numerical shaft count. */
  density?: number;
}

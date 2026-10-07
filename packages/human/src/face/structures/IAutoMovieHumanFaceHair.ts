/**
 * Numerical instructions for generating scalp locks on a shared facial basis.
 * The basis owns anatomical growth regions and neutral correspondence. This
 * document owns lengths, fields and appearance; it contains no strand positions,
 * images or identity-dependent resource key. Empty layers mean no scalp hair.
 * Coordinates are metres in the neutral head frame: +Y superior, +Z anterior,
 * and +X anatomical left. Fields describe static styling, not follicle biology,
 * elastic-rod dynamics, hair-to-hair contact or a biological density calibration.
 *
 * Existing qualified member names are declared beside this owner and refer
 * to independently owned canonical interfaces.
 * The aliases add no runtime value or second field definition.
 *
 * @evidence contracts/common.md#principled-implementation The document groups the canonical layer records while type-only aliases retain the existing public qualification.
 * @evidence contracts/common.md#clear-and-simple-design Each member interface owns its fields in one named file; qualified aliases preserve the existing type API.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing fields and namespace syntax are preserved without duplicated definitions or runtime mutation.
 * @evidence contracts/common.md#meaningful-documentation States metric styling ownership, source-growth responsibility and the qualified type boundary.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceHair {
  /** Independently generated named populations, at most eight. */
  layers: IAutoMovieHumanFaceHair.Layer[];
}

/** Qualified compatibility names share the canonical records and emit no runtime values. */
export namespace IAutoMovieHumanFaceHair {
  /**
   * Retain IAutoMovieHumanFaceHair.Layer as the qualified name of its canonical record.
   *
   * @evidence contracts/common.md#principled-implementation The Layer alias names its existing canonical interface without changing structural assignability.
   * @evidence contracts/common.md#clear-and-simple-design The Layer field record remains owned by one canonical interface rather than copied into this namespace.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The Layer alias preserves the existing public qualification and creates no runtime forwarding or replacement.
   * @evidence contracts/common.md#meaningful-documentation Names the canonical Layer record that owns field meaning and admission.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The Layer alias preserves a type name; the canonical record and its consuming producer own this responsibility.
   * @evidenceExclude contracts/modeling.md#parameter-channels The Layer alias preserves a type name; the canonical record and its consuming producer own this responsibility.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The Layer alias preserves a type name; the canonical record and its consuming producer own this responsibility.
   * @evidenceExclude contracts/modeling.md#spatial-conventions The Layer alias preserves a type name; the canonical record and its consuming producer own this responsibility.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The Layer alias preserves a type name; the canonical record and its consuming producer own this responsibility.
   * @evidenceExclude contracts/modeling.md#rendered-observation The Layer alias preserves a type name; the canonical record and its consuming producer own this responsibility.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The Layer alias defines no physiological value or admission; those remain with the canonical record and producer.
   * @evidenceExclude contracts/anatomy.md#permitted-range The Layer alias defines no physiological value or admission; those remain with the canonical record and producer.
   * @evidenceExclude contracts/anatomy.md#parametric-authority The Layer alias defines no physiological value or admission; those remain with the canonical record and producer.
   */
  export type Layer = import("./IAutoMovieHumanFaceHair/Layer").Layer;

  /**
   * Retain IAutoMovieHumanFaceHair.Region as the qualified name of its canonical record.
   *
   * @evidence contracts/common.md#principled-implementation The Region alias names its existing canonical interface without changing structural assignability.
   * @evidence contracts/common.md#clear-and-simple-design The Region field record remains owned by one canonical interface rather than copied into this namespace.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The Region alias preserves the existing public qualification and creates no runtime forwarding or replacement.
   * @evidence contracts/common.md#meaningful-documentation Names the canonical Region record that owns field meaning and admission.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The Region alias preserves a type name; the canonical record and its consuming producer own this responsibility.
   * @evidenceExclude contracts/modeling.md#parameter-channels The Region alias preserves a type name; the canonical record and its consuming producer own this responsibility.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The Region alias preserves a type name; the canonical record and its consuming producer own this responsibility.
   * @evidenceExclude contracts/modeling.md#spatial-conventions The Region alias preserves a type name; the canonical record and its consuming producer own this responsibility.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The Region alias preserves a type name; the canonical record and its consuming producer own this responsibility.
   * @evidenceExclude contracts/modeling.md#rendered-observation The Region alias preserves a type name; the canonical record and its consuming producer own this responsibility.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The Region alias defines no physiological value or admission; those remain with the canonical record and producer.
   * @evidenceExclude contracts/anatomy.md#permitted-range The Region alias defines no physiological value or admission; those remain with the canonical record and producer.
   * @evidenceExclude contracts/anatomy.md#parametric-authority The Region alias defines no physiological value or admission; those remain with the canonical record and producer.
   */
  export type Region = import("./IAutoMovieHumanFaceHair/Region").Region;
}

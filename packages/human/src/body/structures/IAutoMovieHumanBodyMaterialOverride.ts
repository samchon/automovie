import type { IAutoMovieHumanBodyLinearRgb } from "./IAutoMovieHumanBodyLinearRgb";

/**
 * The existing colour and roughness overrides for one source material.
 * Omitted properties retain that material's value; the document keys this
 * record by an existing material ID and admission retains that ownership.
 *
 * @evidence contracts/common.md#principled-implementation Retains the existing independently optional linear RGB and roughness fields without changing source material selection.
 * @evidence contracts/common.md#clear-and-simple-design One material record supplies two optional authored appearance values.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional colour and roughness remain independent overrides of the named existing material; omission retains the source finish.
 * @evidence contracts/common.md#meaningful-documentation States omission and the source-material ID authority.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It overrides a finish and defines no anatomical part.
 * @evidence contracts/modeling.md#parameter-channels Colour and roughness retain independent values; omission retains the source finish.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Colour is dimensionless linear RGB and roughness dimensionless in [0,1]; neither field is a tissue measurement.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Appearance owns material application.
 * @evidenceExclude contracts/modeling.md#rendered-observation The appearance consumer observes the finish.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It carries authored renderer values rather than physiological measurements.
 * @evidenceExclude contracts/anatomy.md#permitted-range Appearance admission owns valid material overrides.
 * @evidenceExclude contracts/anatomy.md#parametric-authority These fields override the finish of an existing material by its source ID, without defining an anatomical measurement, physiological motion or personal geometry control.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyMaterialOverride {
  /** Optional linear RGB colour, each component in [0,1]. */
  color?: IAutoMovieHumanBodyLinearRgb;

  /** Optional surface roughness, dimensionless in [0,1]. */
  roughness?: number;
}

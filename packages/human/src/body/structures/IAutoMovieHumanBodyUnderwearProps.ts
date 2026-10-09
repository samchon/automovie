import type { IAutoMovieHumanBodyUnderwear } from "./IAutoMovieHumanBodyUnderwear";
import type { IAutoMovieHumanBodyUnderwearRest } from "./IAutoMovieHumanBodyUnderwearRest";

/**
 * One admitted garment choice and the body's shaped rest coverage authority.
 * @evidence contracts/common.md#principled-implementation Same-body rest coordinates supply the admitted garment coverage.
 * @evidence contracts/common.md#clear-and-simple-design Choice and geometry have separate named fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No independent garment mesh enters.
 * @evidence contracts/common.md#meaningful-documentation States choice and source alignment.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Final producers name parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels The document defines the controls.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Rest positions remain basis-frame metres.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The partition owner builds the contour.
 * @evidenceExclude contracts/modeling.md#rendered-observation Final consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Transports source geometry only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing document and coverage owners admit values.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyUnderwearProps {
  /** Closed style and optional linear fabric colour. */
  underwear: IAutoMovieHumanBodyUnderwear;

  /** Source-aligned shaped rest positions and landmarks. */
  rest: IAutoMovieHumanBodyUnderwearRest;
}

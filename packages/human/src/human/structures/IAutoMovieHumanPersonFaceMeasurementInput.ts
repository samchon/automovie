import type { IAutoMovieModel } from "@automovie/interface";
import type { IHumanFaceOralMeasurementRegistration } from "../../face/anatomy/oral/IHumanFaceOralMeasurementRegistration";
import type { IHumanFaceResidentSourceRegion } from "../../face/basis/IHumanFaceResidentSourceRegion";

import type { IAutoMovieHumanPersonDocument } from "./IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonHeadTransform } from "./IAutoMovieHumanPersonHeadTransform";

/**
 * One person's constructed model and the canonical head carry that placed
 * its face. The reader consumes the model's actual Float32 positions, not a
 * separately evaluated face subtree. The document supplies requested values
 * only; the carry supplies the inverse measurement frame. The reader returns
 * the final observational readout without certifying physical or clinical
 * acceptance or adding another admission decision.
 *
 * @evidence contracts/common.md#principled-implementation Model and carry come from the same one-skin geometry evaluation; physical acceptance is a separate result.
 * @evidence contracts/common.md#clear-and-simple-design The evaluated model, document, head carry and optional homologous reference.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No body gain or geometry is reconstructed from the document.
 * @evidence contracts/common.md#meaningful-documentation States the model, request and inverse-frame responsibilities.
 * @evidence contracts/modeling.md#spatial-conventions The model is posed person-frame metres; the carry identifies its head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping This record owns no anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Existing document owners admit all values.
 * @evidenceExclude contracts/modeling.md#emitted-geometry This record emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The one-skin evaluator owns shared samples.
 * @evidenceExclude contracts/modeling.md#rendered-observation The actual model's consumers observe its output.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The registry owns every anatomical or conventional quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range This record admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This record introduces no authored channel.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonFaceMeasurementInput {
  /** Constructed person model, including its actual source-registered face parts. */
  model: IAutoMovieModel;

  /** Document evaluated to produce this model; targets remain requests. */
  document: IAutoMovieHumanPersonDocument;

  /** Canonical head carry used by that evaluation. */
  head: IAutoMovieHumanPersonHeadTransform;

  /** Actual native region source tables transported from the same face construction. */
  sourceRegions: readonly IHumanFaceResidentSourceRegion[];

  /** Retired source-card vertices of the same generated brow populations. */
  browReplacements: ReadonlyMap<string, ReadonlySet<number>>;

  /**
   * Source-neutral shape reference carried through the same body's current
   * pose into person-frame metres, when the face producer supplies one.
   * This is independent of the mouthClose-zero normal-transport reference.
   */
  reference?: ReadonlyMap<string, readonly number[]>;

  /** Source-owned oral correspondence of this same construction. */
  oral?: IHumanFaceOralMeasurementRegistration;
}

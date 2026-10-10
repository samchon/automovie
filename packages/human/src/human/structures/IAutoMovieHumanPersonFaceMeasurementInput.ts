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

import type { IAutoMovieModel } from "@automovie/interface";

import type { IHumanFaceOralMeasurementRegistration } from "../../face/anatomy/oral/IHumanFaceOralMeasurementRegistration";
import type { IHumanFaceResidentSourceRegion } from "../../face/basis/IHumanFaceResidentSourceRegion";
import type { IAutoMovieHumanPersonDocument } from "./IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonHeadTransform } from "./IAutoMovieHumanPersonHeadTransform";

/**
 * Same-construction person model/document, actual head carry, retained source-region tables, retired brow-card set and optional source-neutral/oral correspondence. The reader rounds actual performed world positions to Float32, undoes this carry and quantizes canonical coordinates; document targets remain requests. Unrepresented native samples and missing references/crowns retain named unavailable acquisition. Source-neutral reference is independent of the mouthClose-zero normal-transport reference.
 *
 * Inputs must match the actual compiled/evaluated source context; basis/document identity checks do not authenticate raw clinical acquisition. Readout adds no physical acceptance decision or current GPU observation. Geometry remains borrowed during reading and returned observations belong to the instrument consumer.
 *
 * @evidence contracts/common.md#principled-implementation Actual final model and emitted source correspondence locate measured performed points in the same inverse head frame as registry instruments.
 * @evidence contracts/common.md#clear-and-simple-design Canonical model/document/carry and specialised region/brow/oral records separate acquisition from protocol calculation and normal transport.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Target requests or source-rest/reference maps do not fill absent performed geometry, and metadata/readout is not promoted into clinical or visual certification.
 * @evidence contracts/common.md#meaningful-documentation Prose states Float32 carry/precision, matching evaluation, explicit acquisition gaps and distinct reference purposes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input carrier runs no coordinate scatter or instrument traversal; person acquisition/face registry owners perform that work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Sharing one final model/context across instruments is reader behavior rather than caching implemented by these fields.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no renderer, clinical source stream or task; actual caller/reader contexts own borrowed geometry and optional reference lifetime.
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
   * Source-neutral shape reference carried through this body's actual pose into person-frame metres, when supplied; independent of the mouthClose-zero normal-transport reference.
   */
  reference?: ReadonlyMap<string, readonly number[]>;

  /** Source-owned oral correspondence of this same construction. */
  oral?: IHumanFaceOralMeasurementRegistration;
}

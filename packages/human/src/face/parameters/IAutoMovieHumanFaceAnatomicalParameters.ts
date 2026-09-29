import type { IAutoMovieHumanFaceAppearanceParameters } from "./IAutoMovieHumanFaceAppearanceParameters";
import type { IAutoMovieHumanFaceBrowParameters } from "./IAutoMovieHumanFaceBrowParameters";
import type { IAutoMovieHumanFaceCheekParameters } from "./IAutoMovieHumanFaceCheekParameters";
import type { IAutoMovieHumanFaceCraniofacialParameters } from "./IAutoMovieHumanFaceCraniofacialParameters";
import type { IAutoMovieHumanFaceDentalParameters } from "./IAutoMovieHumanFaceDentalParameters";
import type { IAutoMovieHumanFaceEarParameters } from "./IAutoMovieHumanFaceEarParameters";
import type { IAutoMovieHumanFaceEyeParameters } from "./IAutoMovieHumanFaceEyeParameters";
import type { IAutoMovieHumanFaceEyelashParameters } from "./IAutoMovieHumanFaceEyelashParameters";
import type { IAutoMovieHumanFaceFacialHairParameters } from "./IAutoMovieHumanFaceFacialHairParameters";
import type { IAutoMovieHumanFaceHairParameters } from "./IAutoMovieHumanFaceHairParameters";
import type { IAutoMovieHumanFaceMouthParameters } from "./IAutoMovieHumanFaceMouthParameters";
import type { IAutoMovieHumanFaceNeckParameters } from "./IAutoMovieHumanFaceNeckParameters";
import type { IAutoMovieHumanFaceNoseParameters } from "./IAutoMovieHumanFaceNoseParameters";
import type { IAutoMovieHumanFacePerformanceParameters } from "./IAutoMovieHumanFacePerformanceParameters";
import type { IAutoMovieHumanFaceSkinColourParameters } from "./IAutoMovieHumanFaceSkinColourParameters";
import type { IAutoMovieHumanFaceSkinConditionParameters } from "./IAutoMovieHumanFaceSkinConditionParameters";
import type { IAutoMovieHumanFaceSoftTissueParameters } from "./IAutoMovieHumanFaceSoftTissueParameters";
import type { IAutoMovieHumanFaceTongueParameters } from "./IAutoMovieHumanFaceTongueParameters";

/**
 * Anatomically named numerical input, independent of any artist morph basis.
 * Surface measurements refer to an eyes-open, forward-gazing face with the
 * lips apposed. A dentate jaw uses maximum intercuspation; an edentulous jaw
 * needs its documented habitual closed position instead. A photographed smile
 * or an open mouth is an observed performance, never this neutral identity.
 * Every optional value is unknown until authored or measured; omission means
 * neither zero nor a population mean. The source basis and a future resolver
 * must establish landmark correspondence and coupled validity before these
 * values can drive the editor. This type contains no vertex, section, guide,
 * free curve, bitmap or per-person mesh input. Its nested owners state units,
 * landmarks, signs and observation limits beside each field.
 * Signed projections use a derived head frame: +X runs from right to left
 * exocanthion, +Y runs from subnasale to nasion after removing its X component,
 * and +Z is X cross Y toward the anterior face. A missing or degenerate
 * landmark frame refuses measurement; the user never authors its XYZ axes.
 *
 * The 3D Facial Norms cohort's 2,454 participants aged 3 to 40 supply named
 * surface measurements within its recruitment population, not a universal
 * admission interval or a mapping into this project's 151 authored shape
 * endpoints (Weinberg et al., 2016,
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC4841760/). Curvature and traditional
 * landmark definitions can differ by millimetres (Katina et al., 2016,
 * https://onlinelibrary.wiley.com/doi/full/10.1111/joa.12407); one protocol
 * must own a measurement and a source landmark before inversion.
 *
 * @publicUnconsumed createHumanFaceAnatomicalResolver: User-directed type-first contract; the current basis has no validated anatomical landmark inverse, so accepting these values as supported edits would silently ignore or misinterpret them.
 * @author Samchon
 */
export type IAutoMovieHumanFaceAnatomicalParameters =
  AutoMovieHumanFaceAnatomicalFields &
    (
      | {
          /** A dentate jaw closes at maximum intercuspation. */
          jawReference: "maximum-intercuspation";
          /** Omitted stage remains unknown; an observed edentulous jaw is excluded. */
          dentition?: IAutoMovieHumanFaceDentalParameters & {
            stage: "primary" | "mixed" | "permanent";
          };
        }
      | {
          /** An edentulous jaw uses its documented habitual closure. */
          jawReference: "habitual-closure";
          /** Omitted stage remains unknown; observed natural dentition is excluded. */
          dentition?: IAutoMovieHumanFaceDentalParameters & {
            stage: "edentulous";
          };
        }
    );

/** Shared observed fields; the exported union owns dental-reference coupling. */
interface AutoMovieHumanFaceAnatomicalFields {
  /** Fixed acquisition state for the surface measurements below. */
  referencePose: "eyes-open-forward-gaze-lips-apposed";

  /** Optional age of the observed person, in completed years; never a shape dial. */
  ageYears?: number;

  /** Optional cohort descriptor for interpreting studies; never a morph preset. */
  referenceSex?: "female" | "male" | "unclassified";

  /** Cranial and facial landmark distances in the declared neutral state. */
  craniofacial?: IAutoMovieHumanFaceCraniofacialParameters;

  /** Calibrated neck-section and cervicomental observations in neutral posture. */
  neck?: IAutoMovieHumanFaceNeckParameters;

  /** Eye aperture and optical measurements, with independently owned sides. */
  eyes?: IAutoMovieHumanFaceEyeParameters;

  /** Paired eyebrow envelopes and positions in the neutral expression. */
  brows?: { left?: IAutoMovieHumanFaceBrowParameters; right?: IAutoMovieHumanFaceBrowParameters };

  /** Paired upper/lower lash populations attached to their eyelid margins. */
  eyelashes?: { left?: IAutoMovieHumanFaceEyelashParameters; right?: IAutoMovieHumanFaceEyelashParameters };

  /** External nasal landmark distances. */
  nose?: IAutoMovieHumanFaceNoseParameters;

  /** Ultrasound-observed skin and soft tissue by anatomical site. */
  softTissue?: IAutoMovieHumanFaceSoftTissueParameters;

  /** Protocol-specific observed regional skin lines, hollows and jawline sagging. */
  skinCondition?: IAutoMovieHumanFaceSkinConditionParameters;

  /** Internal cheek-fat compartments, independently measured by side. */
  cheeks?: { left?: IAutoMovieHumanFaceCheekParameters; right?: IAutoMovieHumanFaceCheekParameters };

  /** External lips and oral aperture in the declared neutral state. */
  mouth?: IAutoMovieHumanFaceMouthParameters;

  /** MRI-observed internal tongue identity; a face photo leaves it unknown. */
  tongue?: IAutoMovieHumanFaceTongueParameters;

  /** External auricles, with independently owned sides. */
  ears?: { left?: IAutoMovieHumanFaceEarParameters; right?: IAutoMovieHumanFaceEarParameters };

  /** Biological scalp population and numerical grooming; null emits no visible layer. */
  scalpHair?: IAutoMovieHumanFaceHairParameters | null;

  /** Visible terminal moustache and beard populations; null emits no visible layer. */
  facialHair?: IAutoMovieHumanFaceFacialHairParameters | null;

  /** Calibrated observed skin colour, not the renderer's intrinsic albedo. */
  skinColour?: IAutoMovieHumanFaceSkinColourParameters;

  /** Optical surface properties, separately from measured geometry. */
  appearance?: IAutoMovieHumanFaceAppearanceParameters;

  /** Posed motion relative to the neutral identity above. */
  performance?: IAutoMovieHumanFacePerformanceParameters;
}

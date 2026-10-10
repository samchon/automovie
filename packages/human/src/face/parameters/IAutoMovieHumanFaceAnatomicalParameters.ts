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
import type { IAutoMovieHumanFaceMotionCapacityParameters } from "./IAutoMovieHumanFaceMotionCapacityParameters";
import type { IAutoMovieHumanFaceMouthParameters } from "./IAutoMovieHumanFaceMouthParameters";
import type { IAutoMovieHumanFaceNeckParameters } from "./IAutoMovieHumanFaceNeckParameters";
import type { IAutoMovieHumanFaceNoseParameters } from "./IAutoMovieHumanFaceNoseParameters";
import type { IAutoMovieHumanFaceOralCavityParameters } from "./IAutoMovieHumanFaceOralCavityParameters";
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
 * neither zero nor a population mean. A face document carries it as
 * `anatomical.observations`; the face resolver admits every supplied field
 * before evaluation, keeping it as an observation compared with its
 * registered measurement or refusing it by name, and only a measurement
 * target moves shape, through the channels its measurement lists. A field
 * whose landmark the basis lacks is compared with a named gap until the
 * landmark is registered. This type contains no vertex, section, guide,
 * free curve, bitmap or per-person mesh input. Its nested owners state units,
 * landmarks, signs and observation limits beside each field.
 * Signed projections use a derived head frame: +X runs from right to left
 * exocanthion, +Y runs from subnasale to nasion after removing its X component,
 * and +Z is X cross Y toward the anterior face. A missing or degenerate
 * landmark frame refuses measurement; the user never authors its XYZ axes.
 * Until the basis registers exocanthion, subnasale and nasion, the incisal
 * readings use the oral contact frame instead (basis Y-up made perpendicular
 * to the mandibular axis), a stated model convention.
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
 * @author Samchon
 */
export type IAutoMovieHumanFaceAnatomicalParameters =
  | IAutoMovieHumanFaceAnatomicalParameters.Dentate
  | IAutoMovieHumanFaceAnatomicalParameters.Edentulous;

export namespace IAutoMovieHumanFaceAnatomicalParameters {
  /**
   * Observed fields shared by both jaw references; the exported union owns
   * the dental-reference coupling.
   *
   * @author Samchon
   */
  export interface Fields {
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
    brows?: IAutoMovieHumanFaceAnatomicalParameters.BrowPair;

    /** Paired upper/lower lash populations attached to their eyelid margins. */
    eyelashes?: IAutoMovieHumanFaceAnatomicalParameters.EyelashPair;

    /** External nasal landmark distances. */
    nose?: IAutoMovieHumanFaceNoseParameters;

    /** Ultrasound-observed skin and soft tissue by anatomical site. */
    softTissue?: IAutoMovieHumanFaceSoftTissueParameters;

    /** Protocol-specific observed regional skin lines, hollows and jawline sagging. */
    skinCondition?: IAutoMovieHumanFaceSkinConditionParameters;

    /** Internal cheek-fat compartments, independently measured by side. */
    cheeks?: IAutoMovieHumanFaceAnatomicalParameters.CheekPair;

    /** External lips and oral aperture in the declared neutral state. */
    mouth?: IAutoMovieHumanFaceMouthParameters;

    /** Observed oral cavity proper space at the stated tongue and dental pose. */
    oralCavity?: IAutoMovieHumanFaceOralCavityParameters;

    /** MRI-observed internal tongue identity; a face photo leaves it unknown. */
    tongue?: IAutoMovieHumanFaceTongueParameters;

    /** External auricles, with independently owned sides. */
    ears?: IAutoMovieHumanFaceAnatomicalParameters.EarPair;

    /** Observed scalp population and grooming; null records observed absence and does not command the numerical hair producer. */
    scalpHair?: IAutoMovieHumanFaceHairParameters | null;

    /** Observed terminal moustache and beard populations; null records absence, independently of any authored emitted layer. */
    facialHair?: IAutoMovieHumanFaceFacialHairParameters | null;

    /** Calibrated observed skin colour, not the renderer's intrinsic albedo. */
    skinColour?: IAutoMovieHumanFaceSkinColourParameters;

    /** Optical surface properties, separately from measured geometry. */
    appearance?: IAutoMovieHumanFaceAppearanceParameters;

    /** Individually observed active motion endpoints, distinct from a pose. */
    motionCapacity?: IAutoMovieHumanFaceMotionCapacityParameters;

    /** Posed motion relative to the neutral identity above. */
    performance?: IAutoMovieHumanFacePerformanceParameters;
  }

  /**
   * A dentate jaw, closed at maximum intercuspation.
   *
   * @author Samchon
   */
  export interface Dentate extends Fields {
    /** A dentate jaw closes at maximum intercuspation. */
    jawReference: "maximum-intercuspation";

    /** Omitted stage remains unknown; an observed edentulous jaw is excluded. */
    dentition?: DentateDentition;
  }

  /**
   * An edentulous jaw, closed at its documented habitual closure.
   *
   * @author Samchon
   */
  export interface Edentulous extends Fields {
    /** An edentulous jaw uses its documented habitual closure. */
    jawReference: "habitual-closure";

    /** Omitted stage remains unknown; observed natural dentition is excluded. */
    dentition?: EdentulousDentition;

    /** This oral-space protocol requires contact at the lower incisors. */
    oralCavity?: never;
  }

  /**
   * Dental observations of a primary, mixed or permanent dentition.
   *
   * @author Samchon
   */
  export interface DentateDentition extends IAutoMovieHumanFaceDentalParameters {
    /** Natural dentition stage at the reference pose. */
    stage: "primary" | "mixed" | "permanent";
  }

  /**
   * Dental observations of an edentulous jaw.
   *
   * @author Samchon
   */
  export interface EdentulousDentition extends IAutoMovieHumanFaceDentalParameters {
    /** No natural dentition at the reference pose. */
    stage: "edentulous";
  }

  /**
   * Paired eyebrow envelopes and positions in the neutral expression, each side independently owned.
   *
   * @author Samchon
   */
  export interface BrowPair {
    /** Anatomical-left side. */
    left?: IAutoMovieHumanFaceBrowParameters;

    /** Anatomical-right side. */
    right?: IAutoMovieHumanFaceBrowParameters;
  }

  /**
   * Paired upper/lower lash populations attached to their eyelid margins, each side independently owned.
   *
   * @author Samchon
   */
  export interface EyelashPair {
    /** Anatomical-left side. */
    left?: IAutoMovieHumanFaceEyelashParameters;

    /** Anatomical-right side. */
    right?: IAutoMovieHumanFaceEyelashParameters;
  }

  /**
   * Internal cheek-fat compartments, independently measured by side, each side independently owned.
   *
   * @author Samchon
   */
  export interface CheekPair {
    /** Anatomical-left side. */
    left?: IAutoMovieHumanFaceCheekParameters;

    /** Anatomical-right side. */
    right?: IAutoMovieHumanFaceCheekParameters;
  }

  /**
   * External auricles, each side independently owned.
   *
   * @author Samchon
   */
  export interface EarPair {
    /** Anatomical-left side. */
    left?: IAutoMovieHumanFaceEarParameters;

    /** Anatomical-right side. */
    right?: IAutoMovieHumanFaceEarParameters;
  }
}

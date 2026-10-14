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
 * @evidence contracts/common.md#principled-implementation A jawReference-discriminated union keeps dentate and edentulous records structurally consistent while all nested optional values remain neutral observations. Admission keeps supported observations unchanged or refuses named gaps; current permanent-dentition basis refuses habitual closure and primary/mixed/edentulous stages despite their representable type shapes.
 * @evidence contracts/common.md#clear-and-simple-design Shared Fields groups independently owned anatomical subrecords, with two jaw-reference variants expressing dental coupling once rather than duplicating the full observation hierarchy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No missing observation becomes zero, a population mean, a photograph-derived hidden dimension or a morph weight; only separately registered measurement targets may move existing channels, and unsupported reference states refuse.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes neutral acquisition, optional unknowns, observations versus targets, named measurement gaps, frame derivation and the oral-frame convention, retaining population/protocol limitations beside these public inputs.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This discriminated observation type computes no geometry, derived frame, measurement inversion or schema at runtime.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The union defines no request coordinator or cached measurement result; the actual resolver owns evaluation and dependency identity.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no source mesh, imaging data or task; the personal document owns its optional observation records.
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
   * @evidence contracts/common.md#principled-implementation A fixed neutral reference pose and independently optional clinical subrecords distinguish observation metadata, shape measurements, optical properties and performance; undefined remains unknown and explicit absent hair remains null.
   * @evidence contracts/common.md#clear-and-simple-design Fields is the shared structural base of both jaw-reference variants, while named nested owners hold their own units and protocols.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Age/reference sex is descriptive rather than a preset, and the record contains no personal mesh or free control curve; keeping a supplied observation does not lower it into numerical geometry.
   * @evidence contracts/common.md#meaningful-documentation Each member identifies acquisition state, anatomical site, independent side, optical versus geometric role, absent-hair meaning or observed capacity versus posed performance.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The shared field layout executes no observation traversal or biological conversion.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This base interface owns no repeated evaluation or source-equivalence cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration acquires no imaging resource or renderer task; record allocation belongs to document authors/loaders.
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
   * @evidence contracts/common.md#principled-implementation The maximum-intercuspation discriminator permits only DentateDentition alongside the shared neutral fields; current admission supports the basis's permanent stage, not every stage the observation type can describe.
   * @evidence contracts/common.md#clear-and-simple-design This variant adds only its jaw reference and compatible dental record to Fields, keeping the coupled choice explicit.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No edentulous jaw is represented by a dentate default or proxy, and optional dentition does not invent an observed stage.
   * @evidence contracts/common.md#meaningful-documentation The comment and fields state the closed reference, unknown omitted stage and exclusion of an observed edentulous record.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This jaw-reference interface performs no contact or occlusion calculation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A dentate record defines no repeated jaw evaluation or shared result cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The variant acquires no teeth mesh or jaw handle; the document owns its shared fields and optional dental observations.
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
   * @evidence contracts/common.md#principled-implementation The habitual-closure discriminator couples an optional EdentulousDentition and excludes the incisor-contact oralCavity protocol with never. Current observation admission refuses this closure because the supplied basis has no edentulous representation.
   * @evidence contracts/common.md#clear-and-simple-design This variant states its incompatible oral-space protocol locally while inheriting the remaining neutral fields.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Structural availability does not manufacture missing incisors, use maximum intercuspation for an edentulous person or certify an unsupported runtime closure.
   * @evidence contracts/common.md#meaningful-documentation Fields specify habitual closure, unknown omitted dental stage and the incisor-dependent oral-space prohibition.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This variant executes no habitual-closure measurement or oral-space solver.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The interface coordinates no cached edentulous solve or request.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No prosthetic geometry, scan bytes or task is acquired by this type; the personal record owns its values.
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
   * @evidence contracts/common.md#principled-implementation Extends the dental observation owner with a required natural-dentition stage, excluding edentulous while preserving tooth measurements; current basis admission accepts permanent only and reports unsupported primary/mixed stages.
   * @evidence contracts/common.md#clear-and-simple-design The shared dental vocabulary is inherited once and only the compatible stage discriminator is narrowed here.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A primary or mixed label is not converted to adult permanent teeth or a numerical tooth-count proxy.
   * @evidence contracts/common.md#meaningful-documentation The comment and stage member identify compatible natural stages at the reference pose without declaring their runtime realization complete.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This dental subtype performs no tooth registration or age/stage inference.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no shared dental measurement or morph-result cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration acquires no tooth geometry or radiograph resources; observations live in their document owner.
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
   * @evidence contracts/common.md#principled-implementation The dental observation subtype requires stage edentulous so it can pair only with habitual closure in the public union; the current permanent-tooth basis refuses this observed stage.
   * @evidence contracts/common.md#clear-and-simple-design One literal stage narrowing reuses the dental record rather than duplicating its fields or adding a prosthetic solver.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The label invents neither natural dentition nor a permanent-tooth fallback for missing biological support.
   * @evidence contracts/common.md#meaningful-documentation The comment and member explicitly identify absence of natural dentition at the reference pose.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This subtype runs no tooth-state or prosthetic acquisition algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No edentulous request coordinator or computed result is owned by this shape.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type retains no jaw asset or fitting handle; its containing observation document owns the stage label.
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
   * @evidence contracts/common.md#principled-implementation Independently optional left/right brow records preserve measured envelope asymmetry and unknown omissions without generating fibre roots or shape offsets.
   * @evidence contracts/common.md#clear-and-simple-design This pair owns anatomical side assignment while IAutoMovieHumanFaceBrowParameters owns the one-brow distances and protocols.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No absent side is mirrored or averaged from the other and no scalar observation supplies a drawn arch.
   * @evidence contracts/common.md#meaningful-documentation The comment states neutral envelopes and independence, and each member names its anatomical side.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This pair performs no brow computation or traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Side assignment defines no shared measured-brow result or cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The pair acquires no hair buffers or measurement tasks; optional side records belong to the document.
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
   * @evidence contracts/common.md#principled-implementation Left/right lash observation records keep upper/lower populations in their existing owner and preserve independent acquired sides rather than imposing equal counts.
   * @evidence contracts/common.md#clear-and-simple-design This pair assigns anatomical eyes; IAutoMovieHumanFaceEyelashParameters assigns each lid-row protocol and unit.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing lash observations do not become numerical emitted shaft counts or a mirrored contralateral measurement.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies lid-margin populations and independent sides, with side labels beside the members.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This type runs no shaft generation or clinical counting window.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work It owns no repeated lash evaluation or population cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The observation pair allocates no lash meshes or scan resources; the document owns its optional records.
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
   * @evidence contracts/common.md#principled-implementation Two optional cheek records keep superficial/deep MRI volumes independent by anatomical side; current observation admission stores them without fat-compartment shape lowering.
   * @evidence contracts/common.md#clear-and-simple-design Side assignment belongs here and volume units/protocol limits remain in IAutoMovieHumanFaceCheekParameters.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No contralateral copy, facial-width estimate or age preset fills an unknown internal volume.
   * @evidence contracts/common.md#meaningful-documentation The comment states internal compartment measurement and independent sides, while members identify left/right.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This pair computes no MRI segmentation or compartment volume.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no shared imaging or shape solve.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration owns no MRI buffers, compartment meshes or imaging handles; optional scalar records belong to the document.
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
   * @evidence contracts/common.md#principled-implementation Independently optional auricle records preserve separate acquired left/right dimensions and categories; omission provides no anatomy on the missing side.
   * @evidence contracts/common.md#clear-and-simple-design EarPair owns side assignment and the ear parameter owner retains measurement protocols and units.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No mirrored ear, photograph-derived hidden thickness or default category is constructed by this pair.
   * @evidence contracts/common.md#meaningful-documentation The comment names external auricles and independence, with anatomical side labels on both fields.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This pair executes no pinna construction or measurement algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shape defines no repeated auricle evaluation or cached correspondence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This record acquires no temporal mesh or scan; its document owns the optional observations.
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

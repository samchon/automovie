import type * as ReferenceAnatomy from "../reference-anatomy/model";
import type * as Anatomy from "./anatomy";
import type * as Configuration from "./configuration";
import type * as ControlNet from "./controlNet";
import type * as ControlPositions from "./controlPositions";
import type * as Fitted from "./fittedModel";
import type * as Hair from "./hairProxy";
import type * as Model from "./model";
import type * as NasalReference from "./nasalReference";

/**
 * Frozen measurements, recipes, fitted construction and attributed alternatives.
 * The frozen study root retains this domain through the native evidence graph.
 * Existing source inspections and historical capture limitations are preserved
 * verbatim. This carrier neither changes geometry nor accepts current likeness;
 * artifact observations and identities remain in review.md and the root record.
 *
 * @evidence {@link Fitted.attachFittedPortraitContext} Attaches the target's dental, brow and coarse hair context to an already admitted fitted anatomical skin.
 * @evidence {@link NasalReference.admitPortraitNasalPatch} Checks exact fitted skin and target bytes before copying the selected numerical nasal patch.
 * @evidence {@link Anatomy.portraitOrbitalRelief} Supplies the subject's named orbital support regions consumed by the shared surface layer.
 * @evidence {@link Anatomy.portraitPerioralRelief} Supplies the subject's named perioral transition regions consumed by the shared surface layer.
 * @evidence {@link Anatomy.portraitPhiltralCurves} Supplies paired continuous controls from subnasale to the Cupid peaks for the upper cutaneous lip surface.
 * @evidence {@link Configuration.portraitEyeShape} Selects the active eye's optional skin attachment, lower-lid profile and optical/material controls.
 * @evidence {@link Configuration.portraitHairShape} Selects the subject's continuous frontal hair-cap boundary fit.
 * @evidence {@link Configuration.portraitNoseShape} Selects the active nose's fitted aperture dimensions and restrained alar projection.
 * @evidence {@link Configuration.portraitMouthShape} Selects the active mouth's corner, section, and grouped crown controls.
 * @evidence {@link Configuration.portraitCheekShape} Selects paired medial and buccal cheek support radii and transition controls.
 * @evidence {@link Configuration.portraitOrbitalSupportShapes} Selects the station-wise brow and sulcus support values for the active orbital layer.
 * @evidence {@link Configuration.portraitEyeSockets} Binds the active eye aperture, iris and brow boundary identities.
 * @evidence {@link Configuration.alternatePortraitEye} Supplies an independently replaceable eye profile for component-assembly scenarios.
 * @evidence {@link Configuration.portraitNoseSocket} Binds the active nose's cut, aperture and lining anchors.
 * @evidence {@link Configuration.alternatePortraitNose} Supplies an independently replaceable nose profile for component-assembly scenarios.
 * @evidence {@link Configuration.portraitMouthSocket} Binds the active mouth opening, lip and dental attachment identities.
 * @evidence {@link Configuration.portraitDentalRow} Selects the ordered upper dental profiles, arch dimensions and contact policy.
 * @evidence {@link Configuration.portraitDentalSocket} Binds the dental row to the refined oral anchors.
 * @evidence {@link Configuration.portraitDentalPlacement} Selects grouped dental lift and recess in millimetres.
 * @evidence {@link Configuration.portraitCheekSockets} Binds paired cheek support regions to resident refined-surface anchors.
 * @evidence {@link Configuration.portraitCheekLayersFor} Builds paired cheek surface layers from independently supplied shape controls.
 * @evidence {@link Configuration.portraitComponentsFor} Composes replaceable eye, nose and mouth owners with shared sockets.
 * @evidence {@link Configuration.portraitNasalSupportDetail} Holds the optional nasal-control replacement selected by an assembly.
 * @evidence {@link Configuration.measuredPortraitAssembly} Supplies the active component and surface-layer assembly.
 * @evidence {@link Configuration.portraitAssembly} Supplies the complete default assembly input.
 * @evidence {@link Anatomy.portraitNasalRelief} Supplies the retained basic nasal surface envelopes when no optional replacement detail is selected.
 * @evidence {@link ControlNet.referenceControlNet} Supplies the frozen measured control positions, camera basis and triangle topology for this subject.
 * @evidence {@link ControlPositions.referenceControlPositions} Retains the exact frozen observation coordinates used by the study's control net after responsibility-based separation.
 * @evidence {@link Hair.buildPortraitHairProxy} Builds the coarse scalp cap and side curtain used for face silhouette inspection.
 * @evidence {@link Hair.IPortraitHairShape} Describes the optional subject-owned angular bias for the connected frontal cap boundary.
 * @evidence {@link Model.buildReferencePortrait} Assembles the selected foundation, components, shared skin layers, ears, hair and oral contacts into the inspectable portrait model.
 * @evidence {@link ReferenceAnatomy.IAnatomicalStudyShape} Declares the endpoint, expression, optical and refinement inputs of the optional anatomical study.
 * @evidence {@link ReferenceAnatomy.IAnatomicalStudyShape.youth} Selects the child contribution and complementary young contribution of the recorded prior.
 * @evidence {@link ReferenceAnatomy.IAnatomicalStudyShape.smile} Weights the recorded mouth-corner-puller target in the same source frame.
 * @evidence {@link ReferenceAnatomy.IAnatomicalStudyShape.jawOpen} Weights the stored opening deformation before normalization and neck attachment.
 * @evidence {@link ReferenceAnatomy.IAnatomicalStudyShape.eyeDistance} Sets the physical eye separation used to normalize the entire prior.
 * @evidence {@link ReferenceAnatomy.IAnatomicalStudyShape.eyeHeight} Positions the common normalized eye midpoint along head Y.
 * @evidence {@link ReferenceAnatomy.IAnatomicalStudyShape.eyeDepth} Positions the common normalized eye midpoint along head Z.
 * @evidence {@link ReferenceAnatomy.IAnatomicalStudyShape.eyeRadius} Defines each rigid optical sphere independently of the prior's skin coordinates.
 * @evidence {@link ReferenceAnatomy.IAnatomicalStudyShape.irisRadius} Determines the sampled pigment-cap disk on the study globe.
 * @evidence {@link ReferenceAnatomy.IAnatomicalStudyShape.pupilRadius} Controls the separate pupil-cap extent inside the iris.
 * @evidence {@link ReferenceAnatomy.IAnatomicalStudyShape.subdivisionRounds} Selects common skin and neck tessellation after their shared attachment.
 * @evidence {@link ReferenceAnatomy.anatomicalStudyShape} Supplies the explicitly unaccepted starting preset for the anatomical-prior path.
 * @evidence {@link ReferenceAnatomy.buildAnatomicalStudy} Builds the resident attributed prior, shared skin/neck surface and separate optical parts.
 * @evidence {@link NasalReference.buildPortraitNasalReference} Reconstructs and admits the exact existing CC0 fitted nasal source before its boundary is consumed.
 * @evidence {@link Fitted.buildFittedReferencePortrait} Applies the recorded anatomical fit only after checking its captured source and current target dependencies.
 * @evidence {@link Anatomy.IPortraitNasalDetail} Groups a complete optional nasal control field in place of basic support amplitudes.
 * @evidence {@link Anatomy.IPortraitNasalDetail.radius} Establishes one millimetre support extent for the coupled nasal group.
 * @evidence {@link Anatomy.IPortraitNasalDetail.controls} Supplies the complete named nasal target population, including stationary anchors.
 * @evidence {@link Anatomy.portraitNasalLayerFor} Selects exactly one basic or coupled nasal surface authority.
 * @evidence {@link Anatomy.portraitNasalDetail} Records the rejected coupled nasal fitting hypothesis for explicit replacement experiments.
 */
export const portraitStudyReview = { scope: "study construction inspection" };

import type * as Human from "@automovie/human";
import type { createHumanBodySurfaceParts } from "@automovie/human/body/basis/createHumanBodySurfaceParts";
import type { createHumanBodySurfaceRegionParts } from "@automovie/human/body/basis/createHumanBodySurfaceRegionParts";

import type { IHumanBodyStudyProvenance } from "./IHumanBodyStudyProvenance";

/**
 * Public carrier for inspected physical candidates and static interchange.
 * It records no anatomical or clinical acceptance of the complete body.
 *
 * @evidenceExclude requirements/actors/body-authoring/README.md#body-requirements This family index spans complete body authoring and browser workflow; this carrier records bounded source-rest exterior and static candidate interchange without accepting complete anatomy.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-export Carries inspected source identity and candidate-qualified static readback.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/README.md#body-specifications The specification index groups complete generation, joints, documents and editing; this carrier inspects one source-rest physical candidate and candidate export, while full anatomy remains unavailable.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-export Carries the inspected source-to-primitive identity boundary without claiming rig or clinical document reconstruction.
 * @author Samchon
 */
export interface humanBodyStudyReview {
  /**
   * Inspected candidate asset identity, independent of whole-body qualification.
   *
   * The real writer/readback scenarios and current numerical request export
   * carry source IDs and actual primitive intervals, with reference-only target
   * provenance. Clinical registration, complete bones and skin remain unavailable.
   *
   * @evidence {@link Human.IAutoMovieHumanBodyArticularAssetCorrespondence} Read the separate source partition and candidate-only qualification through actual GLB/glTF readback; this describes a target sphere rather than a validated bone or person.
   * @evidence {@link Human.IAutoMovieHumanBodyArticularAssetCorrespondence.geometry} Read the common constructor's actual prepared populations and the reader's accessor/index partition admission; source IDs are not material-derived anatomy.
   * @evidence {@link Human.IAutoMovieHumanBodyArticularAssetCorrespondence.qualification} Read supported revision/reference, target/reference-rig-only and unavailable whole skin/parts, with no clinical certificate or editable document inferred.
   * @evidence {@link Human.readHumanBodyArticularAssetCorrespondence} Read legacy absence, malformed/unsupported namespace refusal, common interval delegation and exact candidate-ID join, with owned output and recovery scenarios.
   * @evidence {@link Human.IAutoMovieHumanBodyArticularQualification} Read the named qualification record the exporter writes beside the common source partition, adding no interval formula of its own.
   * @evidence {@link Human.IAutoMovieHumanBodyArticularQualification.version} Read the literal body metadata version 1, kept distinct from the common partition's version.
   * @evidence {@link Human.IAutoMovieHumanBodyArticularQualification.generatorRevision} Read the literal "articular-head-inspection/1" inspector revision, never a clinical validation revision.
   * @evidence {@link Human.IAutoMovieHumanBodyArticularQualification.reference} Read the neutral reference basis copied from the inspection report, not a registered personal centre.
   * @evidence {@link Human.IAutoMovieHumanBodyArticularQualification.skin} Read the unavailable whole skin the export repeats rather than certifies.
   * @evidence {@link Human.IAutoMovieHumanBodyArticularQualification.parts} Read one qualification per carrying primitive source member, in that member order.
   * @evidence {@link Human.IAutoMovieHumanBodyArticularPartQualification} Read the per-member qualification joined to exactly one source part by candidate ID.
   * @evidence {@link Human.IAutoMovieHumanBodyArticularPartQualification.id} Read the `${part}/head-candidate` template that names the candidate, distinct from its complete bone.
   * @evidence {@link Human.IAutoMovieHumanBodyArticularPartQualification.source} Read the literal "target" source copied from the candidate, never an imaging acquisition.
   * @evidence {@link Human.IAutoMovieHumanBodyArticularPartQualification.registration} Read the literal "reference-rig-only" placement copied from the candidate, certifying no personal registration.
   * @evidence {@link Human.IAutoMovieHumanBodyArticularPartQualification.partResolution} Read the exported unavailable complete-part resolution of each candidate sphere.
   * @evidence {@link Human.IAutoMovieHumanBodyUnvalidatedGeometry} Read the shared unavailable-geometry status that inspection skin, candidate parts and exported qualification all carry instead of a resolved surface.
   * @evidence {@link Human.IAutoMovieHumanBodyUnvalidatedGeometry.status} Read the literal "unavailable" status that keeps a candidate from standing in for generated anatomy.
   * @evidence {@link Human.IAutoMovieHumanBodyUnvalidatedGeometry.reason} Read the literal "geometry-not-validated" reason, one member of the anatomical resolution reason union.
   * @evidence {@link Human.IAutoMovieHumanBodyAnatomicalReference} Read the inspection's reference provenance, copied verbatim into exported qualification.
   * @evidence {@link Human.IAutoMovieHumanBodyAnatomicalReference.basis} Read the reference basis identity the exporter refuses when blank.
   * @evidence {@link Human.IAutoMovieHumanBodyAnatomicalReference.evaluation} Read the literal "neutral-reference" evaluation, which is not the requested person's skin.
   * @evidence {@link Human.IAutoMovieHumanBodyArticularCandidate} Read the explicit target-radius sphere record: one per explicit target, at the carrying joint's reference rig centre.
   * @evidence {@link Human.IAutoMovieHumanBodyArticularCandidate.part} Read the humerus/femur name the candidate concerns and the export ID is built from.
   * @evidence {@link Human.IAutoMovieHumanBodyArticularCandidate.bone} Read the upper-arm/upper-leg rig joint whose reference centre carries the sphere.
   * @evidence {@link Human.IAutoMovieHumanBodyArticularCandidate.center} Read the sphere centre in reference-frame metres that the candidate model places once with null part transforms.
   * @evidence {@link Human.IAutoMovieHumanBodyArticularCandidate.radiusMetres} Read the requested sphere-fitted radius in metres that sets the tessellated sphere size.
   * @evidence {@link Human.IAutoMovieHumanBodyArticularCandidate.source} Read the literal "target" source the exporter copies into each part qualification.
   * @evidence {@link Human.IAutoMovieHumanBodyArticularCandidate.registration} Read the literal "reference-rig-only" registration the exporter copies into each part qualification.
   * @evidence {@link Human.IAutoMovieHumanBodyArticularCandidate.partResolution} Read the candidate's unavailable complete-bone resolution, copied rather than shared by the exporter.
   * @evidence {@link Human.IAutoMovieHumanBodyArticularCandidateModelProps} Read the candidate model adapter's inputs: model labels plus the generated inspection report, with no skin or personal mesh accepted.
   * @evidence {@link Human.IAutoMovieHumanBodyArticularCandidateModelProps.id} Read the static model identity the adapter writes to the produced model.
   * @evidence {@link Human.IAutoMovieHumanBodyArticularCandidateModelProps.name} Read the static model display name the adapter writes to the produced model.
   * @evidence {@link Human.IAutoMovieHumanBodyArticularCandidateModelProps.inspection} Read the report whose candidates the adapter tessellates as spheres, one mesh per candidate.
   * @evidence {@link Human.IAutoMovieHumanBodyAnatomicalRequestIdentity} Read the request identity and reference selection the anatomical document intersects with the complete parametric request.
   * @evidence {@link Human.IAutoMovieHumanBodyAnatomicalRequestIdentity.id} Read the stable request identity carried through parse and serialize.
   * @evidence {@link Human.IAutoMovieHumanBodyAnatomicalRequestIdentity.name} Read the display label, independent of generator selection.
   * @evidence {@link Human.IAutoMovieHumanBodyAnatomicalRequestIdentity.basis} Read the neutral reference rig identity the inspector evaluates, not a skin generated from the targets.
   * @evidence {@link Human.exportHumanBody} Read optional same-Document qualification before the existing writer and metadata-free face/body/person defaults through actual byte and geometry comparisons.
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-export Inspects static candidate identity at the actual exporter while preserving the numerical document and anatomical limitations.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-export Inspects primitive source correspondence at Float32 output without claiming a rig or clinical edit roundtrip.
   */
  readonly articularAssetIdentity: "candidate-only";
  /**
   * Inspected fictional source-rest exterior, independent of clinical anatomy.
   * The tiny authored source and actual r16 producer use the same compiled
   * builder, final Float32 instrument and bounded inverse. Complete context
   * survives; unregistered observed girths refuse and every clinical part
   * remains unavailable. This records a physical candidate, not GeneratedSkin.
   *
   * @evidence {@link Human.IAutoMovieHumanBodyExteriorReference} Read one constructor-owned source binding without adding morph controls to the numerical document.
   * @evidence {@link Human.IAutoMovieHumanBodyExteriorReference.basis} Read exact source identity and mismatch refusal against immutable compiled geometry.
   * @evidence {@link Human.IAutoMovieHumanBodyExteriorReference.channel} Read the source response and its existing envelope through the same final-surface inverse.
   * @evidence {@link Human.IAutoMovieHumanBodyExteriorReference.incidence} Read explicit native indexed or actual canonical source registration while the ordinary body constructor retains absent metadata.
   * @evidence {@link Human.IAutoMovieHumanBodyExteriorReference.evaluation} Read the explicit source-rest recipe rather than registered personal posture.
   * @evidence {@link Human.IAutoMovieHumanBodyExteriorReference.protocol} Read bare source nipple-level convention and the distinct observed posture/plane/site refusal.
   * @evidence {@link Human.IAutoMovieHumanBodyExteriorReference.measurement} Read the source-owned witness rule through the single extracted instrument and unavailable sections.
   * @evidence {@link Human.IAutoMovieHumanBodyExteriorCandidateBuild} Read the actual static exterior beside clinical unavailable output and preserved complete context.
   * @evidence {@link Human.IAutoMovieHumanBodyExteriorCandidateBuild.model} Read real resident admission, source partition and original writer/readback at Float32 precision.
   * @evidence {@link Human.IAutoMovieHumanBodyExteriorCandidateBuild.exterior} Read fulfilled girth/residual/source section, exact unfulfilled paths and candidate-only anatomical availability.
   * @evidence {@link Human.createHumanBodyExteriorTargetBuilder} Read actual compiled final-surface inversion, source endpoints, refusal/recovery and default-neutral preservation.
   * @evidence {@link Human.readHumanBodyShapedMeasurement} Read the cohesive legacy instrument extraction and its observed final Float32 plane/seed without a duplicated formula.
   * @evidence {@link Human.createHumanBodyBasisBuilder} Read explicit physicalSource compilation from actual native content or canonical samples, preserving default body output and independent geometry admission.
   * @evidence {@link createHumanBodySurfaceParts} Read preUV source identity and actual document instance through the sole domain helper without changing posed coordinates or normals.
   * @evidence {@link createHumanBodySurfaceRegionParts} Read the same authoritative UV gather for XYZ and physical samples, preserving source incidence across material/UV aliases.
   * @evidence {@link Human.measureHumanBodySection} Read optional engine-resolved source-pair/null edge incidence in the existing cut, retaining omitted-argument raw-index behavior and unchanged plane/hull/seed calculations.
   * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Inspects the first physical exterior request consumer while preserving unsupported context and unavailable anatomy.
   * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Inspects exactly one candidate report with transactional request/frame history.
   */
  readonly sourceConditionedExterior: "candidate-only";
}

/**
 * Current construction-source inspection for the portable body studies.
 *
 * Every public declaration of the body folder was read against the basis it
 * evaluates (`connected-basis/basis.json.gz`), the analytic scenarios under
 * `test/src/features/human-body`, and its consumers. Deterministic replay and
 * source correctness do not accept a body's physiological range or likeness;
 * the census and render observations live beside the payload. Native-issued
 * fingerprints are added only after those inspections.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis The study supplies a licensed neutral body prior and independent compact edits to the evaluator this review reads.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-joints The study's joints, landmarks and skin weights are what the inspected skeleton and skinning code evaluate.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-measurements The study's measure channels are the ones the inspected rules price in metres.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-document The study's documents are loaded and saved through the inspected boundary.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis The selected single-surface asset exercises immutable basis compilation, common normals and revision-bound edits.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints The selected fifty-two joints exercise the frame rule, sign frames, pose validation and rigid skinning.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements The selected twenty measure channels exercise the girth, distance, height and breadth rules.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-document The study documents exercise the parse and serialize admission and envelope.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-export The study's built body is what the inspected exporter writes to GLB and glTF.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-export The exported study body exercises the shared Float32 writer without a rig.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape The study's basis is what the simple tier's stature and body mass index are solved against.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape The study's ring and skin volume are the measurements the expansion's inversions read.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-underwear The study's landmarks, skin weights and nipple vertex are what the inspected underwear rules are read on.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-underwear The study body exercises the underwear's landmark rules, the clip at their zero and the lift along the posed normals.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-editor The browser editor is the playground's; the study review inspects the package sources it calls, not the screen.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view The study review owns no inputs, presets or display state.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor The study review owns no transaction history or worker.
 * @evidenceExclude requirements/actors/body-authoring/README.md#body-requirements This index spans the editing screen and census review as well; the study review records source inspection, not the complete workflow.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/README.md#body-specifications This index joins evaluation, measurement, document and later editor boundaries; the study review does not own the browser adapter.
 *
 * @evidence {@link Human.IAutoMovieHumanBodyBasis} Read the schema and admission against the shipped CC0 asset: sparse endpoints, shared topology, one exact material partition, landmarks, joints and four-influence skin, and the frame shared with the face at the neck ring.
 * @evidence {@link Human.IAutoMovieHumanBodyBasis.id} Read nonblank identity admission and the builder's exact document-to-basis binding.
 * @evidence {@link Human.IAutoMovieHumanBodyBasis.channels} Read finite neutral-containing ranges, reciprocal same-group mirrors, distinct signed endpoint selection and ordered accumulation.
 * @evidence {@link Human.IAutoMovieHumanBodyBasis.correctives} Read driver-side admission, the (0,1] gain and the product activation the shipped macro pair residuals fire under.
 * @evidence {@link Human.IAutoMovieHumanBodyBasis.landmarks} Read the named point set, its finite positions and the sparse rows that move a joint with the shape it sits in.
 * @evidence {@link Human.IAutoMovieHumanBodyBasis.joints} Read the rooted parent-first tree, landmark ends, unit flexion reference, measured signs on exactly the mobile axes and rest-containing ranges.
 * @evidence {@link Human.IAutoMovieHumanBodyBasis.surfaces} Read topology admission, sparse vertex ordering, nonzero differences, oriented triangle partition, unit-sum skin and common normals before UV separation.
 * @evidence {@link Human.IAutoMovieHumanBodyBasis.materials} Read unique resident identities, copied overrides and final model admission.
 * @evidence {@link Human.IAutoMovieHumanBodyBasisDocument} Read the compact schema admission for named shape, pose and material edits over one exact basis revision, with omissions meaning neutral or rest.
 * @evidence {@link Human.IAutoMovieHumanBodyShoulderPose} Read the complete thorax-relative humeral goal, its plane period, total elevation, independent axial rotation and the two non-unique poles.
 * @evidence {@link Human.IAutoMovieHumanBodyShoulderPose.bone} Read explicit left/right humerus ownership rather than inferring a side from an angle sign.
 * @evidence {@link Human.IAutoMovieHumanBodyShoulderPose.plane} Read the side-relative lateral zero, anterior positive plane and [-180,180) period.
 * @evidence {@link Human.IAutoMovieHumanBodyShoulderPose.elevation} Read total humerothoracic elevation from the anatomical hanging zero, independent of the coupled girdle.
 * @evidence {@link Human.IAutoMovieHumanBodyShoulderPose.axialRotation} Read positive external rotation about the final humeral axis and its distinction from the plane choice.
 * @evidence {@link Human.IAutoMovieHumanBodyBasisDocument.id} Read nonblank identity admission and preservation into the resident model.
 * @evidence {@link Human.IAutoMovieHumanBodyBasisDocument.name} Read nonblank display identity admission and preservation into the model.
 * @evidence {@link Human.IAutoMovieHumanBodyBasisDocument.basis} Read exact compiled-basis matching without implicit conversion or migration.
 * @evidence {@link Human.IAutoMovieHumanBodyBasisDocument.shape} Read channel-membership and envelope validation, neutral omission and signed endpoint weights without clamping.
 * @evidence {@link Human.IAutoMovieHumanBodyBasisDocument.pose} Read the sparse unique-bone clinical pose, its validation against each joint's range and rest as omission.
 * @evidence {@link Human.IAutoMovieHumanBodyBasisDocument.materials} Read resident-ID validation, optional RGB/roughness boundaries and material copying.
 * @evidence {@link Human.IAutoMovieHumanBodyBuild} Read the posed static model beside the rest skeleton, per-bone rest and posed transforms and shaped landmarks the verification tools consume.
 * @evidence {@link Human.IAutoMovieHumanBodyBuild.model} Read the skinless, skeletonless posed model that the static exporter admits unchanged.
 * @evidence {@link Human.IAutoMovieHumanBodyBuild.skeleton} Read the rest skeleton of the shaped body, before the document's pose.
 * @evidence {@link Human.IAutoMovieHumanBodyBuild.bones} Read the per-joint rest and posed world transforms in basis order, which the arc scenarios compare against hand rotations.
 * @evidence {@link Human.IAutoMovieHumanBodyBuild.landmarks} Read the shaped landmark positions after channels and correctives, before any pose.
 * @evidence {@link Human.IAutoMovieHumanBodyChannelScale} Read the per-endpoint RMS, peak and count beside the optional measurement record and its null-valued unmeasurable case.
 * @evidence {@link Human.IAutoMovieHumanBodyChannelScale.id} Read the channel identity the scale reports for.
 * @evidence {@link Human.IAutoMovieHumanBodyChannelScale.group} Read the source group copied for grouping without a second lookup.
 * @evidence {@link Human.IAutoMovieHumanBodyChannelScale.positive} Read the positive endpoint's whole-surface RMS, peak and moved count.
 * @evidence {@link Human.IAutoMovieHumanBodyChannelScale.negative} Read the negative endpoint's figures or null for a nonnegative control.
 * @evidence {@link Human.IAutoMovieHumanBodyChannelScale.measurement} Read the rule identity, kind and neutral, positive and negative metre values, null when no rule is bound or the surface cannot answer.
 * @evidence {@link Human.IAutoMovieHumanBodyMeasurement} Read the three rule kinds and the landmark, plane, sampling and extremum parameters each carries.
 * @evidence {@link Human.HUMAN_BODY_MEASUREMENTS} Read each rule against the shipped landmarks and the public measurement definition it approximates, and the neck channels left without a rule.
 * @evidence {@link Human.assertHumanBodyBasis} Read identity, envelope, mirror, corrective, topology, sparse-row, partition and endpoint-population admission, then the rig hand-off.
 * @evidence {@link Human.assertHumanBodyRig} Read landmark, tree-order, reference, sign-versus-constraint, range and skin admission against the shipped rig and the analytic negatives.
 * @evidence {@link Human.assertSparseRows} Read the one row format every endpoint and landmark payload shares and the labelled refusals.
 * @evidence {@link Human.createHumanBodyBasisBuilder} Read schema admission, immutable compilation, the fixed evaluation order, pose validation through the engine, rigid skinning, normal reconstruction and final model validation.
 * @evidence {@link Human.evaluateHumanBodyShape} Read `|weight| x endpoint`, then activation-scaled correctives, applied to surfaces and landmarks by endpoint name on fresh copies.
 * @evidence {@link Human.humanBodyBasisWeights} Read envelope and membership refusals and the product corrective activation shared by builder and measurement.
 * @evidence {@link Human.resolveHumanBodySkeleton} Read the `Y x F` frame, the Shepperd quaternion, the parent-relative rest transform and the sign rest frames, against the analytic frame scenarios.
 * @evidence {@link Human.createHumanBodySkinColour} Read the site weights off the skin (hand bones split by the normal along their flexion reference, feet by the normal against up, forearm, shank, neck and the protected rest), their diffusion, the clamped fits, the collar smoothstep from the open ring, and the base-and-multiplier split.
 * @evidence {@link Human.HUMAN_BODY_SKIN_SITES} Read each site's power fits against the skin-sites receipt's group-mean fits of the archive and the site assignment's weights.
 * @evidence {@link Human.IAutoMovieHumanBodySkinSites} Read the table form: the coloured material, per-site channel power fits, facing ramps, exposure, sweeps and collar.
 * @evidence {@link Human.createHumanBodySkinDetailTexture} Read the tileable height field (line families with integer directions and periodic warps, pores on a wrapped jittered grid), the normal from wrapped differences and the linear encoding.
 * @evidence {@link Human.humanBodySkinMetresPerUv} Read the per-triangle square root of surface over UV area and its area-weighted median over the material's textured regions, and the refusal of a layout without area.
 * @evidence {@link Human.HUMAN_BODY_SKIN_DETAIL} Read the tile, line families, pores and age curve against their sources.
 * @evidence {@link Human.IAutoMovieHumanBodySkinDetail} Read the table form: seed, tile resolution and size, line families, pores and the age curve.
 * @evidence {@link Human.createHumanBodySkinToneTexture} Read the two chromophore fields (integer-frequency sinusoids drawn log-uniformly in each band, amplitude one over frequency, unit variance), the optical density per primary, the exp(-density) multiplier over its largest, the sRGB encoding and the mean compensation.
 * @evidence {@link Human.HUMAN_BODY_SKIN_TONE} Read the tile, each chromophore's band, spread and absorbance at the sRGB primaries' dominant wavelengths against Jacques 2013 and Prahl's haemoglobin tabulation, and the authored spread and age curve.
 * @evidence {@link Human.IAutoMovieHumanBodySkinTone} Read the table form: seed, tile resolution and size, the two chromophores and the age curve.
 * @evidence {@link Human.IAutoMovieHumanBodySkinTone.IChromophore} Read one chromophore's band of wavelengths, its number of waves, its spread and its absorbance at the three primaries.
 * @evidence {@link Human.HUMAN_BODY_SKIN_SCATTERING} Read the skin's diffuse mean free path per primary against Jensen et al. 2001's measured skin.
 * @evidence {@link Human.createHumanBodySurfaceSag} Read the tissue thickness against the lean body along the rest normal, the compliance with gain and softness, gravity's change in the skin's frame, the smoothing with the open boundary held, and zero at an unturned skin.
 * @evidence {@link Human.skinHumanBodySurface} Read the per-bone unit dual quaternion of `posed ∘ rest⁻¹`, the hemisphere alignment to the first influence, the normalization by the real part's norm, the exact rigidity of unit-weight vertices and the missing-transform refusal.
 * @evidence {@link Human.resolveHumanBodyCouplings} Read the clinical-angle swing-cone elevation (rest angles standing in for absent ones), the piecewise-linear curve that is zero at and below its first knot within a nanodegree, the addition onto the document's or rest angle, and the unjudged sum left to the pose validator.
 * @evidence {@link Human.humanBodyShoulderTtRotation} Read direct plane tilt and final-axis torsion against hand-derived left/right quaternion and direction oracles at the hanging, forward, lateral and overhead poles.
 * @evidence {@link Human.humanBodyShoulderOrientationDistance} Read the shortest SO(3) distance of TT poses using the absolute quaternion dot so equivalent pole triples share a corrective activation.
 * @evidence {@link Human.humanBodyShoulderPoseFromDirection} Read the shared shaped-rest unit-direction readout used by the actual shoulder resolver and fractional corrective sampler: explicit humerus side, side-aware atan2 plane and clamped acos elevation in degrees. One direction cannot measure torsion, so zero axial rotation preserves the prior rest convention; this readout neither registers an anatomical humeral frame nor admits physiological reach. Source inspection does not stand for the pending sampler scenarios or actual body render acceptance.
 * @evidence {@link Human.humanBodyShoulderElevationLimit} Read the periodic piecewise-linear plane envelope, including the seam segment before the first knot, against hand-interpolated knot, mid-segment and wrapped-plane oracles.
 * @evidence {@link Human.humanBodyShoulderReaches} Read the elevation and axial ranges, the plane maximum and the direction-based overhead pole against extension, cross-body and functional-position oracles.
 * @evidence {@link Human.assertHumanBodyPelvifemoral} Read the root-child chain, open flexion, second-driver refusal and zero-at-rest nondecreasing curve inside the lumbar range against the admission scenario's one-property negatives.
 * @evidence {@link Human.resolveHumanBodyPelvifemoralRhythm} Read the shared tilt from the larger trunk-relative leg flexion and its root, lumbar and hip additions against hand-derived one-fifth and bilateral oracles.
 * @evidence {@link Human.solveHumanBodyArmsDown} Read the per-arm lateral-plane bisection against the chain-versus-body crossing reading charged only beyond the rest reading, with straight elbows and the document's other joints kept.
 * @evidence {@link Human.stepHumanBodyArmsDown} Read the chain walk, the rest baseline, the bottom check and the one-degree bisection with a pause after each build and crossing read, and the solved joints it returns.
 * @evidence {@link Human.resolveHumanBodyShoulders} Read the coupled girdle frame, measured A-pose subtraction, thorax-relative world goal and rigid transport of each humeral descendant about the moved joint centre.
 * @evidence {@link Human.measureHumanBodySection} Read the plane cut, edge-keyed crossings, closed-loop chaining, open-chain discard and seed-nearest selection against the analytic box.
 * @evidence {@link Human.IAutoMovieHumanBodySectionPlane} Read the caller-chosen point-normal cutting plane whose positive side includes on-plane vertices.
 * @evidence {@link Human.IAutoMovieHumanBodySectionPlane.point} Read the metre point the signed vertex distance is measured from.
 * @evidence {@link Human.IAutoMovieHumanBodySectionPlane.normal} Read the direction that signs vertex distance and seeds the orthonormal hull frame.
 * @evidence {@link Human.IAutoMovieHumanBodySectionReading} Read the seed-nearest closed loop's readings, or null when no closed loop exists.
 * @evidence {@link Human.IAutoMovieHumanBodySectionReading.perimeter} Read the contour length summed through every concavity of the loop.
 * @evidence {@link Human.IAutoMovieHumanBodySectionReading.girth} Read the convex-hull perimeter in the plane, the tape girth that bridges concavities.
 * @evidence {@link Human.IAutoMovieHumanBodySectionReading.breadth} Read the loop's X extent, maximum minus minimum crossing X.
 * @evidence {@link Human.IAutoMovieHumanBodySectionReading.back} Read the loop's minimum crossing Z, rearmost because the body faces +Z.
 * @evidence {@link Human.IAutoMovieHumanBodySectionReading.centroid} Read the mean crossing point that ranks loops by distance to the seed.
 * @evidence {@link Human.IAutoMovieHumanBodyShapeRowState} Read the admitted weights and corrective activations the row sum reads in channel order, then activation order.
 * @evidence {@link Human.IAutoMovieHumanBodyShapeRowState.weights} Read the signed channel weight map whose sign selects the endpoint and whose magnitude is the gain.
 * @evidence {@link Human.IAutoMovieHumanBodyShapeRowState.activations} Read the ordered corrective list applied after every channel endpoint.
 * @evidence {@link Human.IAutoMovieHumanBodyCorrectiveActivation} Read the corrective target and activation pair produced by the weight owner and skipped at zero.
 * @evidence {@link Human.IAutoMovieHumanBodyCorrectiveActivation.target} Read the corrective row-target name looked up among the evaluated row targets.
 * @evidence {@link Human.IAutoMovieHumanBodyCorrectiveActivation.activation} Read the multiplier applied to every offset of the target when positive.
 * @evidence {@link Human.createHumanBodyUnderwear} Read the coverage field on the body at rest: the waistband height, the leg line from the crotch within the gusset out to the outer hip's depth blended from back to front, the bra band blended from back to front by depth with the straps, and the uncovered arm skin at a metre per unit of weight; the clip at the field's zero with crossings held 5% inside an edge and shared by its two triangles, the lift along the posed normals, the refusals, and the part and material it emits after the skin.
 * @evidence {@link Human.closeHumanBodyUnderwearCreases} Read the closing of the skin by a ball of half the span against two blocks with a slit: the wall points of a narrow slit reach the ball's arc, a wider slit keeps its walls, a mid slit stays within the arc's sag, and a flat top, a hollow cell, an empty garment and an oversized grid behave as stated.
 * @evidence {@link Human.measureHumanBodyDistanceField} Read the exact squared distance and nearest site against a brute-force minimum on a scattered grid, the corner case, and the empty-site convention.
 * @evidence {@link Human.voxelizeHumanBodySkin} Read the distance to a flat sheet in cells, the centres of a ball only in the air side and only in the shell, the nearest sample, the clamped voxel of a point, the refusal of an oversized grid and the dense sampling that grows the buffers.
 * @evidence {@link Human.clusterHumanBodyPoints} Read the chains, pairs, loner and diagonal pair against the cube binning counted by hand.
 * @evidence {@link Human.createHumanBodyUnderwearCoverage} Read the field through the garment tests on flat panels: the boxer hem and waistband heights, the briefs' leg line at the crotch, a third out and at the outer hip, the bra band and straps, and the bare arm.
 * @evidence {@link Human.cutHumanBodyUnderwearSurface} Read the kept band, the exact crossing heights, the shared crossings and the winding through the garment tests on flat panels.
 * @evidence {@link Human.IAutoMovieHumanBodySkinVoxels} Read the voxel queries through the voxel test.
 * @evidence {@link Human.HUMAN_BODY_UNDERWEAR} Read the landmark names against the basis's MPFB joint cubes and the nipple vertex the bust girth uses, and each fraction against the rendered neutral, female, male, child and heavy bodies at rest and in the editor's presets; a costume table, not a garment standard.
 * @evidence {@link Human.IAutoMovieHumanBodyUnderwear} Read the two styles and the optional colour a document puts on the body.
 * @evidence {@link Human.IAutoMovieHumanBodyUnderwear.style} Read the boxer briefs and the sports bra with briefs the style picks.
 * @evidence {@link Human.IAutoMovieHumanBodyUnderwear.color} Read the optional linear RGB in [0,1] that replaces the table's colour.
 * @evidence {@link Human.IAutoMovieHumanBodyUnderwear.ITable} Read the table form the rules are evaluated from, every height and width a fraction between shaped landmarks.
 * @evidence {@link Human.IAutoMovieHumanBodyUnderwear.ITable.material} Read the garment's material id, refused when the basis uses it.
 * @evidence {@link Human.IAutoMovieHumanBodyUnderwear.ITable.color} Read the default linear fabric colour.
 * @evidence {@link Human.IAutoMovieHumanBodyUnderwear.ITable.roughness} Read the fabric roughness.
 * @evidence {@link Human.IAutoMovieHumanBodyUnderwear.ITable.offsetMetres} Read the lift of the fabric along the posed normal in metres.
 * @evidence {@link Human.IAutoMovieHumanBodyUnderwear.ITable.uncovered} Read the bones whose skin, with every bone below them, is never covered past half a vertex's weight.
 * @evidence {@link Human.IAutoMovieHumanBodyUnderwear.ITable.landmarks} Read the landmark ids the waist, legs, bra band and straps are measured on.
 * @evidence {@link Human.IAutoMovieHumanBodyUnderwear.ITable.briefs} Read each style's waist fraction, the leg line's crotch, front and back depths, and its gusset and outer distances.
 * @evidence {@link Human.IAutoMovieHumanBodyUnderwear.ITable.bra} Read the nipple skin landmark and the band's bottom, front and back fractions and the strap's centre and half width.
 * @evidence {@link Human.segmentHumanBodyModel} Read the dominant-bone partition against the census: one part per bone in joint order, majority and first-corner tie rules, the UV-seam vertex walk, and the population check that refuses a mismatched build.
 * @evidence {@link Human.exportHumanBody} Read the static model-only writer and optional candidate-report qualification in the same constructed Document, preserving legacy bytes and unavailable whole anatomy without writing a rig or restoring clinical document controls.
 * @evidence {@link Human.measureHumanBodyBasisChannels} Read the whole-surface RMS accumulation, the empty-population refusal and the rule evaluation through the same shape path the builder uses.
 * @evidence {@link Human.humanBodySurfaceBoundary} Read the directed-edge census: an edge whose reverse no triangle owns is a boundary edge, and its endpoints are the ring.
 * @evidence {@link Human.measureHumanBodyVolume} Read the tetrahedron sum, the boundary cap fanned to the loop centroid with the reversed winding, and the absolute value, against the closed and the opened box.
 * @evidence {@link Human.evaluateHumanBodyMeasurement} Read the one-rule evaluation: landmark distance, and the station walk that keeps the picked closed section, null where the surface cannot answer.
 * @evidence {@link Human.humanBodySimpleShapeDirection} Read the channel-alone and mass directions over their ranges, the envelope-holding wear, the five-fraction sampling that refuses an unmeasurable rule, and the linear solve that refuses beyond the reach it names.
 * @evidence {@link Human.humanBodySimpleShapeMath} Read the flat-ended curve, the refusing inversion, the clamped curve inverse, Deurenberg's fat and excess, the parameter record with the body mass index from mass and stature, the term product and Siri's density.
 * @evidence {@link Human.measureHumanBodySimpleShape} Read the mass as the whole person's closed volume at a density and the channel rule reading.
 * @evidence {@link Human.projectHumanBodySimpleShape} Read the whole person's stature and volume, the mass fixed point over the fat density, the inverse-first-row identity readings with the other muscle rows removed, and the named tape measurements read back.
 * @evidence {@link Human.expandHumanBodySimpleShape} Read the envelope and missing-value refusals, the product-of-curves rows with envelope saturation and skipped channels, the three-sample inversions for stature, mass and each named tape measurement that refuse beyond their reach or on a channel that does not grow, and the residual composition over an existing shape.
 * @evidence {@link Human.HUMAN_BODY_SIMPLE_SHAPE} Read every row against its pinned source: the age nodes, the sarcopenia gain, the ptosis, apron, android and gynoid curves, the definition gates over excess fat, and the firmness fall.
 * @evidence {@link Human.HUMAN_BODY_SIMPLE_POSTURE} Read the kyphosis table against its sources.
 * @evidence {@link Human.IAutoMovieHumanBodySimplePosture} Read the posture table form.
 * @evidence {@link Human.IAutoMovieHumanBodySimplePosture.kyphosis} Read the kyphosis entry.
 * @evidence {@link Human.IAutoMovieHumanBodySimplePosture.thoracic} Read the thoracic shares.
 * @evidence {@link Human.IAutoMovieHumanBodySimplePosture.compensation} Read the compensating joint.
 * @evidence {@link Human.humanBodySimplePosture} Read the posture rows a body's age and sex give.
 * @evidence {@link Human.HUMAN_BODY_SKIN_RELIEF_POSE} Read the relief-pose table.
 * @evidence {@link Human.IAutoMovieHumanBodySkinReliefPose} Read the relief-pose table form.
 * @evidence {@link Human.IAutoMovieHumanBodySkinReliefPose.IJoint} Read one joint's reach.
 * @evidence {@link Human.IAutoMovieHumanBodySkinReliefPose.IJoint.bone} Read the bone name.
 * @evidence {@link Human.IAutoMovieHumanBodySkinReliefPose.IJoint.sigmaMetres} Read the axial width.
 * @evidence {@link Human.IAutoMovieHumanBodySkinReliefPose.IJoint.reachMetres} Read the reach.
 * @evidence {@link Human.IAutoMovieHumanBodySkinReliefPose.deepen} Read the deepening share.
 * @evidence {@link Human.IAutoMovieHumanBodySkinReliefPose.flatten} Read the flattening share.
 * @evidence {@link Human.IAutoMovieHumanBodySkinReliefPose.joints} Read the joints list.
 * @evidence {@link Human.humanBodyReliefWeights} Read the relief weights a pose gives.
 * @evidence {@link Human.IAutoMovieHumanBodySimpleShape} Read the five physical parameters and their units.
 * @evidence {@link Human.IAutoMovieHumanBodySimpleShapeTable} Read the table form: envelope, head allowance, mass model, fat estimate and product-of-curves rows.
 * @evidence {@link Human.AutoMovieHumanBodySimpleParameter} Read the five parameters and the derived excess fat and developed muscle a curve may be read over.
 * @evidence {@link Human.admitHumanBodyBasisDocument} Read exact schema admission, finiteness over named weights, angles and material scalars, nonblank identities and the duplicate-bone refusal.
 * @evidence {@link Human.parseHumanBodyBasisDocument} Read the shared UTF-16 envelope, JSON parsing and the admission hand-off.
 * @evidence {@link Human.serializeHumanBodyBasisDocument} Read admission before serialization and the envelope check on the escaped, formatted text.
 */
export const humanBodyStudyReview: humanBodyStudyReview & IHumanBodyStudyProvenance = {
  basis: "connected-basis/README.md",
  receipt: "connected-basis/extraction-receipt.json",
  likeness: "unaccepted",
  articularAssetIdentity: "candidate-only",
  sourceConditionedExterior: "candidate-only",
};

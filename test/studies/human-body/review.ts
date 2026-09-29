import type * as Human from "@automovie/human";

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
 * @evidence {@link Human.humanBodySkinMetresPerUv} Read the per-triangle square root of surface over UV area and its median over the material's textured regions, and the refusal of a layout without area.
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
 * @evidence {@link Human.humanBodyShoulderElevationLimit} Read the periodic piecewise-linear plane envelope, including the seam segment before the first knot, against hand-interpolated knot, mid-segment and wrapped-plane oracles.
 * @evidence {@link Human.humanBodyShoulderReaches} Read the elevation and axial ranges, the plane maximum and the direction-based overhead pole against extension, cross-body and functional-position oracles.
 * @evidence {@link Human.assertHumanBodyPelvifemoral} Read the root-child chain, open flexion, second-driver refusal and zero-at-rest nondecreasing curve inside the lumbar range against the admission scenario's one-property negatives.
 * @evidence {@link Human.resolveHumanBodyPelvifemoralRhythm} Read the shared tilt from the larger trunk-relative leg flexion and its root, lumbar and hip additions against hand-derived one-fifth and bilateral oracles.
 * @evidence {@link Human.solveHumanBodyArmsDown} Read the per-arm lateral-plane bisection against the chain-versus-body crossing reading charged only beyond the rest reading, with straight elbows and the document's other joints kept.
 * @evidence {@link Human.stepHumanBodyArmsDown} Read the chain walk, the rest baseline, the bottom check and the one-degree bisection with a pause after each build and crossing read, and the solved joints it returns.
 * @evidence {@link Human.resolveHumanBodyShoulders} Read the coupled girdle frame, measured A-pose subtraction, thorax-relative world goal and rigid transport of each humeral descendant about the moved joint centre.
 * @evidence {@link Human.measureHumanBodySection} Read the plane cut, edge-keyed crossings, closed-loop chaining, open-chain discard and seed-nearest selection against the analytic box.
 * @evidence {@link Human.createHumanBodyUnderwear} Read the coverage field on the body at rest: the waistband height, the leg line from the crotch within the gusset out to the outer hip's depth blended from back to front, the bra band blended from back to front by depth with the straps, and the uncovered arm skin at a metre per unit of weight; the clip at the field's zero with crossings held 5% inside an edge and shared by its two triangles, the lift along the posed normals, the refusals, and the part and material it emits after the skin.
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
 * @evidence {@link Human.exportHumanBody} Read the static export: the face's portrait document and writer applied to the built body model, no rig written.
 * @evidence {@link Human.measureHumanBodyBasisChannels} Read the whole-surface RMS accumulation, the empty-population refusal and the rule evaluation through the same shape path the builder uses.
 * @evidence {@link Human.humanBodySurfaceBoundary} Read the directed-edge census: an edge whose reverse no triangle owns is a boundary edge, and its endpoints are the ring.
 * @evidence {@link Human.humanBodyClipRing} Read the boundary-first ring with the highest-vertex fallback the closed analytic box needs.
 * @evidence {@link Human.measureHumanBodyVolume} Read the tetrahedron sum, the boundary cap fanned to the loop centroid with the reversed winding, and the absolute value, against the closed and the opened box.
 * @evidence {@link Human.evaluateHumanBodyMeasurement} Read the one-rule evaluation: height to the clip ring, landmark distance, and the station walk that keeps the picked closed section, null where the surface cannot answer.
 * @evidence {@link Human.humanBodySimpleShapeDirection} Read the channel-alone and mass directions over their ranges, the envelope-holding wear, the five-fraction sampling that refuses an unmeasurable rule, and the linear solve that refuses beyond the reach it names.
 * @evidence {@link Human.humanBodySimpleShapeMath} Read the flat-ended curve, the refusing inversion, the clamped curve inverse, Deurenberg's fat and excess, the parameter record with the body mass index from mass and stature, the term product and Siri's density.
 * @evidence {@link Human.measureHumanBodySimpleShape} Read the stature (height rule plus head allowance, refused without a rule), the skin volume through the builder's shape path, the mass over the head-and-neck share and the channel rule reading.
 * @evidence {@link Human.projectHumanBodySimpleShape} Read the measured stature, the mass fixed point over the fat density, the inverse-first-row identity readings with the other muscle rows removed, and the named tape measurements read back.
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
export const humanBodyStudyReview = {
  basis: "connected-basis/README.md",
  receipt: "connected-basis/extraction-receipt.json",
  likeness: "unaccepted",
};

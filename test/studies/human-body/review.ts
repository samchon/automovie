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
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-editor The browser editor is the playground's; the study review inspects the package sources it calls, not the screen.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view The study review owns no inputs, presets or display state.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor The study review owns no transaction history or worker.
 * @evidenceExclude requirements/actors/body-authoring/README.md#body-requirements This index spans the editing screen and census review as well; the study review records source inspection, not the complete workflow.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/README.md#body-specifications This index joins evaluation, measurement, document and later editor boundaries; the study review does not own the browser adapter.
 *
 * @evidence {@link Human.IAutoMovieHumanBodyBasis} Read the schema and admission against the shipped CC0 asset: sparse endpoints, shared topology, one exact material partition, landmarks, joints and four-influence skin, and the frame shared with the face at the neck ring.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasis} #dd4f7c8 Read the full schema and admission against the shipped connected asset: collar correspondence, endpoints, material partition, landmarks, skin and the new shoulder contract. The published r4 lacks that shoulder metadata and is explicitly refused until a new basis is issued.
 * @evidence {@link Human.IAutoMovieHumanBodyBasis.id} Read nonblank identity admission and the builder's exact document-to-basis binding.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasis.id} #b74616d Read nonblank identity admission and the builder's exact document-to-basis binding.
 * @evidence {@link Human.IAutoMovieHumanBodyBasis.channels} Read finite neutral-containing ranges, reciprocal same-group mirrors, distinct signed endpoint selection and ordered accumulation.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasis.channels} #f250ee5 Read finite neutral-containing ranges, reciprocal same-group mirrors, distinct signed endpoint selection and ordered accumulation.
 * @evidence {@link Human.IAutoMovieHumanBodyBasis.correctives} Read driver-side admission, the (0,1] gain and the product activation the shipped macro pair residuals fire under.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasis.correctives} #6d51fa8 Read the channel, generic joint and shoulder-orientation kernel drivers, including the total elevation ramp and SO(3) angular window whose activity is invariant under equivalent TT pole coordinates.
 * @evidence {@link Human.IAutoMovieHumanBodyBasis.landmarks} Read the named point set, its finite positions and the sparse rows that move a joint with the shape it sits in.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasis.landmarks} #1043e03 Read the named point set, its finite positions and the sparse rows that move a joint with the shape it sits in.
 * @evidence {@link Human.IAutoMovieHumanBodyBasis.joints} Read the rooted parent-first tree, landmark ends, unit flexion reference, measured signs on exactly the mobile axes and rest-containing ranges.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasis.joints} #bdb68c3 Read the rooted tree, landmark pivots, held generic upper-arm axes, measured bilateral thorax-TT rest and ranges, and four-influence skin binding.
 * @evidence {@link Human.IAutoMovieHumanBodyBasis.surfaces} Read topology admission, sparse vertex ordering, nonzero differences, oriented triangle partition, unit-sum skin and common normals before UV separation.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasis.surfaces} #ad5e441 Read topology admission, sparse vertex ordering, nonzero differences, oriented triangle partition, unit-sum skin and common normals before UV separation.
 * @evidence {@link Human.IAutoMovieHumanBodyBasis.materials} Read unique resident identities, copied overrides and final model admission.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasis.materials} #fe91223 Read unique resident identities, copied overrides and final model admission.
 * @evidence {@link Human.IAutoMovieHumanBodyBasisDocument} Read the compact schema admission for named shape, pose and material edits over one exact basis revision, with omissions meaning neutral or rest.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasisDocument} #93455d6 Read exact compact schema admission for named shape, non-humeral clinical pose, separate thorax-relative shoulder goals and materials under one basis revision.
 * @evidence {@link Human.IAutoMovieHumanBodyShoulderPose} Read the complete thorax-relative humeral goal, its plane period, total elevation, independent axial rotation and the two non-unique poles.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyShoulderPose} #f9193d6 Read its four exact fields, the builder's separate shoulder admission and the analytic left/right pole tests; the published r4 basis remains deliberately incompatible.
 * @evidence {@link Human.IAutoMovieHumanBodyShoulderPose.bone} Read explicit left/right humerus ownership rather than inferring a side from an angle sign.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyShoulderPose.bone} #9f44a49 Read the two allowed upper-arm names and the document's duplicate-bone refusal.
 * @evidence {@link Human.IAutoMovieHumanBodyShoulderPose.plane} Read the side-relative lateral zero, anterior positive plane and [-180,180) period.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyShoulderPose.plane} #c8da648 Read the side-relative sign in the TT quaternion and the parse boundary's excluded 180 endpoint against bilateral direction tests.
 * @evidence {@link Human.IAutoMovieHumanBodyShoulderPose.elevation} Read total humerothoracic elevation from the anatomical hanging zero, independent of the coupled girdle.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyShoulderPose.elevation} #5128dd2 Read the direct 0/90/180 direction oracles and the goal test where the girdle moves but the authored overhead direction remains overhead.
 * @evidence {@link Human.IAutoMovieHumanBodyShoulderPose.axialRotation} Read positive external rotation about the final humeral axis and its distinction from the plane choice.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyShoulderPose.axialRotation} #2bac298 Read the final-axis torsion in both arms, the hanging-pole orientation test and the equivalent 180-pole coordinates.
 * @evidence {@link Human.IAutoMovieHumanBodyBasisDocument.id} Read nonblank identity admission and preservation into the resident model.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasisDocument.id} #0c127d8 Read nonblank identity admission and preservation into the resident model.
 * @evidence {@link Human.IAutoMovieHumanBodyBasisDocument.name} Read nonblank display identity admission and preservation into the model.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasisDocument.name} #fa29c9c Read nonblank display identity admission and preservation into the model.
 * @evidence {@link Human.IAutoMovieHumanBodyBasisDocument.basis} Read exact compiled-basis matching without implicit conversion or migration.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasisDocument.basis} #774c47e Read exact compiled-basis matching without implicit conversion or migration.
 * @evidence {@link Human.IAutoMovieHumanBodyBasisDocument.shape} Read channel-membership and envelope validation, neutral omission and signed endpoint weights without clamping.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasisDocument.shape} #5bb3094 Read channel-membership and envelope validation, neutral omission and signed endpoint weights without clamping.
 * @evidence {@link Human.IAutoMovieHumanBodyBasisDocument.pose} Read the sparse unique-bone clinical pose, its validation against each joint's range and rest as omission.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasisDocument.pose} #17d7b3e Read the sparse unique-bone clinical pose, its validation against each joint's range and rest as omission.
 * @evidence {@link Human.IAutoMovieHumanBodyBasisDocument.materials} Read resident-ID validation, optional RGB/roughness boundaries and material copying.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasisDocument.materials} #8fd4fc3 Read resident-ID validation, optional RGB/roughness boundaries and material copying.
 * @evidence {@link Human.IAutoMovieHumanBodyBuild} Read the posed static model beside the rest skeleton, per-bone rest and posed transforms and shaped landmarks the verification tools consume.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBuild} #c0b12c5 Read the posed static model beside the rest skeleton, per-bone rest and posed transforms and shaped landmarks the verification tools consume.
 * @evidence {@link Human.IAutoMovieHumanBodyBuild.model} Read the skinless, skeletonless posed model that the static exporter admits unchanged.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBuild.model} #d02fb66 Read the skinless, skeletonless posed model that the static exporter admits unchanged.
 * @evidence {@link Human.IAutoMovieHumanBodyBuild.skeleton} Read the rest skeleton of the shaped body, before the document's pose.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBuild.skeleton} #146537e Read the rest skeleton of the shaped body, before the document's pose.
 * @evidence {@link Human.IAutoMovieHumanBodyBuild.bones} Read the per-joint rest and posed world transforms in basis order, which the arc scenarios compare against hand rotations.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBuild.bones} #5ebd862 Read the per-joint rest and posed world transforms in basis order, which the arc scenarios compare against hand rotations.
 * @evidence {@link Human.IAutoMovieHumanBodyBuild.landmarks} Read the shaped landmark positions after channels and correctives, before any pose.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBuild.landmarks} #a046ade Read the shaped landmark positions after channels and correctives, before any pose.
 * @evidence {@link Human.IAutoMovieHumanBodyChannelScale} Read the per-endpoint RMS, peak and count beside the optional measurement record and its null-valued unmeasurable case.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyChannelScale} #e14f3ad Read the per-endpoint RMS, peak and count beside the optional measurement record and its null-valued unmeasurable case.
 * @evidence {@link Human.IAutoMovieHumanBodyChannelScale.id} Read the channel identity the scale reports for.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyChannelScale.id} #1edafd4 Read the channel identity the scale reports for.
 * @evidence {@link Human.IAutoMovieHumanBodyChannelScale.group} Read the source group copied for grouping without a second lookup.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyChannelScale.group} #28e2634 Read the source group copied for grouping without a second lookup.
 * @evidence {@link Human.IAutoMovieHumanBodyChannelScale.positive} Read the positive endpoint's whole-surface RMS, peak and moved count.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyChannelScale.positive} #90c399f Read the positive endpoint's whole-surface RMS, peak and moved count.
 * @evidence {@link Human.IAutoMovieHumanBodyChannelScale.negative} Read the negative endpoint's figures or null for a nonnegative control.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyChannelScale.negative} #2a8fe79 Read the negative endpoint's figures or null for a nonnegative control.
 * @evidence {@link Human.IAutoMovieHumanBodyChannelScale.measurement} Read the rule identity, kind and neutral, positive and negative metre values, null when no rule is bound or the surface cannot answer.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyChannelScale.measurement} #c91b7c5 Read the rule identity, kind and neutral, positive and negative metre values, null when no rule is bound or the surface cannot answer.
 * @evidence {@link Human.IAutoMovieHumanBodyMeasurement} Read the three rule kinds and the landmark, plane, sampling and extremum parameters each carries.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyMeasurement} #59f0bc2 Read the three rule kinds and the landmark, plane, sampling and extremum parameters each carries.
 * @evidence {@link Human.HUMAN_BODY_MEASUREMENTS} Read each rule against the shipped landmarks and the public measurement definition it approximates, and the neck channels left without a rule.
 * @evidenceReview {@link Human.HUMAN_BODY_MEASUREMENTS} #1c9dde2 Read each rule against the shipped landmarks and the public measurement definition it approximates, and the neck channels left without a rule.
 * @evidence {@link Human.assertHumanBodyBasis} Read identity, envelope, mirror, corrective, topology, sparse-row, partition and endpoint-population admission, then the rig hand-off.
 * @evidenceReview {@link Human.assertHumanBodyBasis} #4c4a615 Read identity/envelope/corrective admission, oriented surface and endpoint population, independent boundary caps and disjoint capped interiors, then the rig hand-off.
 * @evidence {@link Human.assertHumanBodyRig} Read landmark, tree-order, reference, sign-versus-constraint, range and skin admission against the shipped rig and the analytic negatives.
 * @evidenceReview {@link Human.assertHumanBodyRig} #fe015b4 Read tree, measured bilateral thorax-TT rest, held old upper-arm axes, source-relative corrective ramps and orientation kernels, coupling limits, and unit-sum skin.
 * @evidence {@link Human.assertSparseRows} Read the one row format every endpoint and landmark payload shares and the labelled refusals.
 * @evidenceReview {@link Human.assertSparseRows} #13a6ac2 Read the one row format every endpoint and landmark payload shares and the labelled refusals.
 * @evidence {@link Human.createHumanBodyBasisBuilder} Read schema admission, immutable compilation, the fixed evaluation order, pose validation through the engine, rigid skinning, normal reconstruction and final model validation.
 * @evidenceReview {@link Human.createHumanBodyBasisBuilder} #d61a915 Read schema/revision admission, named shape and corrective evaluation, coupled generic pose, thorax-relative shoulder goal resolved after girdle motion, rigid skinning and final model validation.
 * @evidence {@link Human.evaluateHumanBodyShape} Read `|weight| x endpoint`, then activation-scaled correctives, applied to surfaces and landmarks by endpoint name on fresh copies.
 * @evidenceReview {@link Human.evaluateHumanBodyShape} #a72f452 Read named `|weight| x endpoint` rows then activation-scaled correctives on fresh surface and landmark copies; the independent per-vertex document displacement is gone.
 * @evidence {@link Human.humanBodyBasisWeights} Read envelope and membership refusals and the product corrective activation shared by builder and measurement.
 * @evidenceReview {@link Human.humanBodyBasisWeights} #83993c1 Read channel envelopes, coupled generic pose, total TT elevation ramp and SO(3) geodesic shoulder kernel that agrees for equivalent 0/180 pole triples.
 * @evidence {@link Human.resolveHumanBodySkeleton} Read the `Y x F` frame, the Shepperd quaternion, the parent-relative rest transform and the sign rest frames, against the analytic frame scenarios.
 * @evidenceReview {@link Human.resolveHumanBodySkeleton} #44d21bf Read the `Y x F` frame, the Shepperd quaternion, the parent-relative rest transform and the sign rest frames, against the analytic frame scenarios. Reread after the rest angle: every axis frame now carries `{sign, neutral}` so the engine turns the rig by `(clinical - neutral) / sign`, checked by the offset scenario (a spine resting at 30 degrees stays put at 30 and swings back at 0).
 * @evidence {@link Human.skinHumanBodySurface} Read the per-bone unit dual quaternion of `posed ∘ rest⁻¹`, the hemisphere alignment to the first influence, the normalization by the real part's norm, the exact rigidity of unit-weight vertices and the missing-transform refusal.
 * @evidenceReview {@link Human.skinHumanBodySurface} #a7b6797 Read the per-bone unit dual quaternion of `posed ∘ rest⁻¹`, the hemisphere alignment to the first influence, the normalization by the real part's norm, the exact rigidity of unit-weight vertices and the missing-transform refusal. Reread after the dual quaternion blend: the 50/50 vertex lands on the half-angle rotation about the pivot at flexion 90 and 180 and keeps its radius under a twist, checked by the skinning scenario.
 * @evidence {@link Human.resolveHumanBodyCouplings} Read the clinical-angle swing-cone elevation (rest angles standing in for absent ones), the piecewise-linear curve that is zero at and below its first knot within a nanodegree, the addition onto the document's or rest angle, and the unjudged sum left to the pose validator.
 * @evidenceReview {@link Human.resolveHumanBodyCouplings} #a923efb Read TT total elevation for a shoulder input, swing-cone elevation for other inputs, zero-at-rest bounded curves, and additions validated before the builder's pose.
 * @evidence {@link Human.humanBodyShoulderTtRotation} Read direct plane tilt and final-axis torsion against hand-derived left/right quaternion and direction oracles at the hanging, forward, lateral and overhead poles.
 * @evidenceReview {@link Human.humanBodyShoulderTtRotation} #f43f791 Read its tilt-axis and torsion order against independent half-angle quaternions for bilateral lateral, forward, posterior and mixed directions and both poles.
 * @evidence {@link Human.humanBodyShoulderOrientationDistance} Read the shortest SO(3) distance of TT poses using the absolute quaternion dot so equivalent pole triples share a corrective activation.
 * @evidenceReview {@link Human.humanBodyShoulderOrientationDistance} #e333fcc Read the absolute dot, same-bone refusal, clamp and near-identity tolerance against the orientation-distance and corrective activation scenarios.
 * @evidence {@link Human.resolveHumanBodyShoulders} Read the coupled girdle frame, measured A-pose subtraction, thorax-relative world goal and rigid transport of each humeral descendant about the moved joint centre.
 * @evidenceReview {@link Human.resolveHumanBodyShoulders} #904ec3d Read the thorax transform, A-pose relative quaternion and subtree pivot walk against analytic left/right humerus, elbow and coupled-girdle goal tests.
 * @evidence {@link Human.measureHumanBodySection} Read the plane cut, edge-keyed crossings, closed-loop chaining, open-chain discard and seed-nearest selection against the analytic box.
 * @evidenceReview {@link Human.measureHumanBodySection} #f5595e4 Read the plane cut, edge-keyed crossings, closed-loop chaining, open-chain discard and seed-nearest selection against the analytic box. Reread after the tape girth: the loop is projected onto an orthonormal frame of the plane and its convex hull perimeter is reported beside the contour perimeter, equal on the convex box and shorter across the notch of the concave prism.
 * @evidence {@link Human.segmentHumanBodyModel} Read the dominant-bone partition against the census: one part per bone in joint order, majority and first-corner tie rules, the UV-seam vertex walk, and the population check that refuses a mismatched build.
 * @evidenceReview {@link Human.segmentHumanBodyModel} #96e3b95 Read every surface and material region in built order, preserving UV seam source walks, dominant-bone triangle assignment, region-qualified part IDs and global source ordinals.
 * @evidence {@link Human.exportHumanBody} Read the static export: the face's portrait document and writer applied to the built body model, no rig written.
 * @evidenceReview {@link Human.exportHumanBody} #804228c Read the static export: the face's portrait document and writer applied to the built body model, no rig written.
 * @evidence {@link Human.measureHumanBodyBasisChannels} Read the whole-surface RMS accumulation, the empty-population refusal and the rule evaluation through the same shape path the builder uses.
 * @evidenceReview {@link Human.measureHumanBodyBasisChannels} #36b752d Read the whole-surface RMS accumulation, the empty-population refusal and the rule evaluation through the same shape path the builder uses. Reread after the topological ring: the height rule now measures to the surface's open boundary rather than to a remembered clip plane, so the neck-complement revision measures to its own cut.
 * @evidence {@link Human.humanBodySurfaceBoundary} Read the directed-edge census: an edge whose reverse no triangle owns is a boundary edge, and its endpoints are the ring.
 * @evidenceReview {@link Human.humanBodySurfaceBoundary} #7a042ce Read directed boundary edges grouped into separate closed ordered loops, rejecting forks or open chains; the ordinary call still returns sorted boundary vertex IDs.
 * @evidence {@link Human.humanBodyClipRing} Read the boundary-first ring with the highest-vertex fallback the closed analytic box needs.
 * @evidenceReview {@link Human.humanBodyClipRing} #4445e43 Read the highest ordered open boundary loop in the shaped surface and the highest-vertex fallback for a closed analytic fixture.
 * @evidence {@link Human.measureHumanBodyVolume} Read the tetrahedron sum, the boundary cap fanned to the loop centroid with the reversed winding, and the absolute value, against the closed and the opened box.
 * @evidenceReview {@link Human.measureHumanBodyVolume} #8bd0f4c Read signed tetrahedral volume over the same independently capped loops validated by basis admission; the top-and-bottom-open box retains its analytical volume.
 * @evidence {@link Human.evaluateHumanBodyMeasurement} Read the one-rule evaluation: height to the clip ring, landmark distance, and the station walk that keeps the picked closed section, null where the surface cannot answer.
 * @evidenceReview {@link Human.evaluateHumanBodyMeasurement} #1aa2ba1 Read the height across all shaped surfaces using each upper clip ring, landmark distance, and nearest valid section chosen across all surfaces at each station.
 * @evidence {@link Human.humanBodySimpleShapeDirection} Read the channel-alone and mass directions over their ranges, the envelope-holding wear, the five-fraction sampling that refuses an unmeasurable rule, and the linear solve that refuses beyond the reach it names.
 * @evidenceReview {@link Human.humanBodySimpleShapeDirection} #49b40c0 Read the channel-alone and mass directions over their ranges, the envelope-holding wear, the five-fraction sampling that refuses an unmeasurable rule, and the linear solve that refuses beyond the reach it names.
 * @evidence {@link Human.humanBodySimpleShapeMath} Read the flat-ended curve, the refusing inversion, the clamped curve inverse, Deurenberg's fat and excess, the parameter record with the body mass index from mass and stature, the term product and Siri's density.
 * @evidenceReview {@link Human.humanBodySimpleShapeMath} #dea1817 Read the flat-ended curve and inverse, the distinct Deurenberg child/adult fits and fractional-age bridge, Jensen's 1989 polynomial child head share and adult bridge, term product, and Siri density.
 * @evidence {@link Human.measureHumanBodySimpleShape} Read the stature (height rule plus head allowance, refused without a rule), the skin volume through the builder's shape path, the mass over the head-and-neck share and the channel rule reading.
 * @evidenceReview {@link Human.measureHumanBodySimpleShape} #6128418 Read stature, every shaped surface's validated independent cap and nonoverlapping total volume, age-specific head/neck mass share, and named tape rules.
 * @evidence {@link Human.projectHumanBodySimpleShape} Read the measured stature, the mass fixed point over the fat density, the inverse-first-row identity readings with the other muscle rows removed, and the named tape measurements read back.
 * @evidenceReview {@link Human.projectHumanBodySimpleShape} #9cb39da Read stature, the mass fixed point using the age-specific density and head share, inverse first-row demographic readings and tape measurements.
 * @evidence {@link Human.expandHumanBodySimpleShape} Read the envelope and missing-value refusals, the product-of-curves rows with envelope saturation and skipped channels, the three-sample inversions for stature, mass and each named tape measurement that refuse beyond their reach or on a channel that does not grow, and the residual composition over an existing shape.
 * @evidenceReview {@link Human.expandHumanBodySimpleShape} #af61df1 Read age-specific fat parameters and mass inversion using the matching head and neck share, plus envelope saturation, named tape inversions and residual composition over an existing shape.
 * @evidence {@link Human.HUMAN_BODY_SIMPLE_SHAPE} Read every row against its pinned source: the age nodes, the sarcopenia gain, the ptosis, apron, android and gynoid curves, the definition gates over excess fat, and the firmness fall.
 * @evidenceReview {@link Human.HUMAN_BODY_SIMPLE_SHAPE} #9c26f4f Read the pinned table including separate Deurenberg child/adult regressions, the authored 15–16 continuity bridge, Jensen's 1989 boy-child polynomial head and neck share, adult share, and the unchanged population term rows.
 * @evidence {@link Human.IAutoMovieHumanBodySimpleShape} Read the five physical parameters and their units.
 * @evidenceReview {@link Human.IAutoMovieHumanBodySimpleShape} #39c7889 Read the five physical parameters and their units.
 * @evidence {@link Human.IAutoMovieHumanBodySimpleShapeTable} Read the table form: envelope, head allowance, mass model, fat estimate and product-of-curves rows.
 * @evidenceReview {@link Human.IAutoMovieHumanBodySimpleShapeTable} #c5d0650 Read the age-specific fat coefficients and quadratic child head and neck mass-share form, both transition ages, the envelope, head allowance and product-of-curves rows.
 * @evidence {@link Human.AutoMovieHumanBodySimpleParameter} Read the five parameters and the derived excess fat a curve may be read over.
 * @evidenceReview {@link Human.AutoMovieHumanBodySimpleParameter} #168510a Read the five parameters and the derived excess fat a curve may be read over.
 * @evidence {@link Human.admitHumanBodyBasisDocument} Read exact schema admission, finiteness over named weights, angles and material scalars, nonblank identities and the duplicate-bone refusal.
 * @evidenceReview {@link Human.admitHumanBodyBasisDocument} #ee38fce Read exact schema and finite admission of weights, generic angles, complete TT shoulder triples and materials, unique bones, and refusal of legacy identity and upper-arm Euler pose.
 * @evidence {@link Human.parseHumanBodyBasisDocument} Read the shared UTF-16 envelope, JSON parsing and the admission hand-off.
 * @evidenceReview {@link Human.parseHumanBodyBasisDocument} #b9f437d Read the shared UTF-16 envelope, JSON parsing and the admission hand-off.
 * @evidence {@link Human.serializeHumanBodyBasisDocument} Read admission before serialization and the envelope check on the escaped, formatted text.
 * @evidenceReview {@link Human.serializeHumanBodyBasisDocument} #e13d2dc Read admission before serialization and the envelope check on the escaped, formatted text.
 */
export const humanBodyStudyReview = {
  basis: "connected-basis/README.md",
  receipt: "connected-basis/extraction-receipt.json",
  likeness: "unaccepted",
};

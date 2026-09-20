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
 * @evidenceExclude requirements/actors/body-authoring/README.md#body-requirements This index spans the editing screen and census review as well; the study review records source inspection, not the complete workflow.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/README.md#body-specifications This index joins evaluation, measurement, document and later editor boundaries; the study review does not own the browser adapter.
 *
 * @evidence {@link Human.IAutoMovieHumanBodyBasis} Read the schema and admission against the shipped CC0 asset: sparse endpoints, shared topology, one exact material partition, landmarks, joints and four-influence skin, and the frame shared with the face at the neck ring.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasis} #db4bb7d Read the schema and admission against the shipped CC0 asset: sparse endpoints, shared topology, one exact material partition, landmarks, joints and four-influence skin, and the frame shared with the face at the neck ring. Reread after the rest angle joined the joint record; nothing else in the schema moved. Reread again after correctives gained the joint-angle ramp driver: every corrective endpoint is still a rest-space row applied before skinning.
 * @evidence {@link Human.IAutoMovieHumanBodyBasis.id} Read nonblank identity admission and the builder's exact document-to-basis binding.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasis.id} #b74616d Read nonblank identity admission and the builder's exact document-to-basis binding.
 * @evidence {@link Human.IAutoMovieHumanBodyBasis.channels} Read finite neutral-containing ranges, reciprocal same-group mirrors, distinct signed endpoint selection and ordered accumulation.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasis.channels} #f250ee5 Read finite neutral-containing ranges, reciprocal same-group mirrors, distinct signed endpoint selection and ordered accumulation.
 * @evidence {@link Human.IAutoMovieHumanBodyBasis.correctives} Read driver-side admission, the (0,1] gain and the product activation the shipped macro pair residuals fire under.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasis.correctives} #dd288b7 Read driver-side admission, the (0,1] gain and the product activation the shipped macro pair residuals fire under. Reread after the joint driver: a ramp `{bone, axis, side, onset, full}` in clinical degrees from the rest, multiplied with the channel drivers, which is how a pose corrective fires only past the angle where the census found the crossing.
 * @evidence {@link Human.IAutoMovieHumanBodyBasis.landmarks} Read the named point set, its finite positions and the sparse rows that move a joint with the shape it sits in.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasis.landmarks} #1043e03 Read the named point set, its finite positions and the sparse rows that move a joint with the shape it sits in.
 * @evidence {@link Human.IAutoMovieHumanBodyBasis.joints} Read the rooted parent-first tree, landmark ends, unit flexion reference, measured signs on exactly the mobile axes and rest-containing ranges.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasis.joints} #6093fab Read the rooted parent-first tree, landmark ends, unit flexion reference, measured signs on exactly the mobile axes and rest-containing ranges. Reread after the rest angle was added: each joint now carries the clinical angle its A-pose rest sits at per axis, zero on a held axis and inside the range on a mobile one, because a clinical range read from the A-pose would mean a different arc on every rest.
 * @evidence {@link Human.IAutoMovieHumanBodyBasis.surfaces} Read topology admission, sparse vertex ordering, nonzero differences, oriented triangle partition, unit-sum skin and common normals before UV separation.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasis.surfaces} #ad5e441 Read topology admission, sparse vertex ordering, nonzero differences, oriented triangle partition, unit-sum skin and common normals before UV separation.
 * @evidence {@link Human.IAutoMovieHumanBodyBasis.materials} Read unique resident identities, copied overrides and final model admission.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasis.materials} #fe91223 Read unique resident identities, copied overrides and final model admission.
 * @evidence {@link Human.IAutoMovieHumanBodyBasisDocument} Read exact compact schema admission and the separate ownership of shape, identity, pose and materials, with every omission meaning the neutral or rest.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasisDocument} #da1be14 Read exact compact schema admission and the separate ownership of shape, identity, pose and materials, with every omission meaning the neutral or rest.
 * @evidence {@link Human.IAutoMovieHumanBodyBasisDocument.id} Read nonblank identity admission and preservation into the resident model.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasisDocument.id} #0c127d8 Read nonblank identity admission and preservation into the resident model.
 * @evidence {@link Human.IAutoMovieHumanBodyBasisDocument.name} Read nonblank display identity admission and preservation into the model.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasisDocument.name} #fa29c9c Read nonblank display identity admission and preservation into the model.
 * @evidence {@link Human.IAutoMovieHumanBodyBasisDocument.basis} Read exact compiled-basis matching without implicit conversion or migration.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasisDocument.basis} #774c47e Read exact compiled-basis matching without implicit conversion or migration.
 * @evidence {@link Human.IAutoMovieHumanBodyBasisDocument.shape} Read channel-membership and envelope validation, neutral omission and signed endpoint weights without clamping.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasisDocument.shape} #5bb3094 Read channel-membership and envelope validation, neutral omission and signed endpoint weights without clamping.
 * @evidence {@link Human.IAutoMovieHumanBodyBasisDocument.identity} Read surface-membership and sparse-row admission, application before any channel and the landmarks it deliberately leaves alone.
 * @evidenceReview {@link Human.IAutoMovieHumanBodyBasisDocument.identity} #bacbc12 Read surface-membership and sparse-row admission, application before any channel and the landmarks it deliberately leaves alone.
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
 * @evidenceReview {@link Human.assertHumanBodyBasis} #df2d2ff Read identity, envelope, mirror, corrective, topology, sparse-row, partition and endpoint-population admission, then the rig hand-off. Reread after the joint driver: a corrective input on a bone is left to the rig admission, and duplicates are keyed by bone, axis and side.
 * @evidence {@link Human.assertHumanBodyRig} Read landmark, tree-order, reference, sign-versus-constraint, range and skin admission against the shipped rig and the analytic negatives.
 * @evidenceReview {@link Human.assertHumanBodyRig} #a18d337 Read landmark, tree-order, reference, sign-versus-constraint, range and skin admission against the shipped rig and the analytic negatives. Reread after the rest angle: it is refused when nonfinite, nonzero on a held axis, or outside its range, so the empty document is never a refused pose; the unconstrained root declares every sign. Reread after the joint driver: it must name a mobile constrained axis and a ramp with `0 <= onset < full <= reach`, the reach being the range on its side of the rest, so a driver can never wait for an angle the pose validator refuses.
 * @evidence {@link Human.assertSparseRows} Read the one row format every endpoint, landmark and identity payload shares and the labelled refusals.
 * @evidenceReview {@link Human.assertSparseRows} #13a6ac2 Read the one row format every endpoint, landmark and identity payload shares and the labelled refusals.
 * @evidence {@link Human.createHumanBodyBasisBuilder} Read schema admission, immutable compilation, the fixed evaluation order, pose validation through the engine, rigid skinning, normal reconstruction and final model validation.
 * @evidenceReview {@link Human.createHumanBodyBasisBuilder} #df8c38c Read schema admission, immutable compilation, the fixed evaluation order, pose validation through the engine, rigid skinning, normal reconstruction and final model validation.
 * @evidence {@link Human.evaluateHumanBodyShape} Read identity first, `|weight| x endpoint`, then activation-scaled correctives, applied to surfaces and landmarks by endpoint name on fresh copies.
 * @evidenceReview {@link Human.evaluateHumanBodyShape} #d997f27 Read identity first, `|weight| x endpoint`, then activation-scaled correctives, applied to surfaces and landmarks by endpoint name on fresh copies.
 * @evidence {@link Human.humanBodyBasisWeights} Read envelope and membership refusals, identity row admission and the product corrective activation shared by builder and measurement.
 * @evidenceReview {@link Human.humanBodyBasisWeights} #5360070 Read envelope and membership refusals, identity row admission and the product corrective activation shared by builder and measurement. Reread after the joint driver: the ramp reads the document pose, a null or absent angle standing for the rest, and the measurement path passes no pose so channel measurements never see a pose corrective.
 * @evidence {@link Human.resolveHumanBodySkeleton} Read the `Y x F` frame, the Shepperd quaternion, the parent-relative rest transform and the sign rest frames, against the analytic frame scenarios.
 * @evidenceReview {@link Human.resolveHumanBodySkeleton} #44d21bf Read the `Y x F` frame, the Shepperd quaternion, the parent-relative rest transform and the sign rest frames, against the analytic frame scenarios. Reread after the rest angle: every axis frame now carries `{sign, neutral}` so the engine turns the rig by `(clinical - neutral) / sign`, checked by the offset scenario (a spine resting at 30 degrees stays put at 30 and swings back at 0).
 * @evidence {@link Human.skinHumanBodySurface} Read the weighted sum of `posed ∘ rest⁻¹` images, the exact rigidity of unit-weight vertices and the missing-transform refusal.
 * @evidenceReview {@link Human.skinHumanBodySurface} #051d9b7 Read the weighted sum of `posed ∘ rest⁻¹` images, the exact rigidity of unit-weight vertices and the missing-transform refusal.
 * @evidence {@link Human.measureHumanBodySection} Read the plane cut, edge-keyed crossings, closed-loop chaining, open-chain discard and seed-nearest selection against the analytic box.
 * @evidenceReview {@link Human.measureHumanBodySection} #f6d3308 Read the plane cut, edge-keyed crossings, closed-loop chaining, open-chain discard and seed-nearest selection against the analytic box.
 * @evidence {@link Human.measureHumanBodyBasisChannels} Read the whole-surface RMS accumulation, the empty-population refusal and the rule evaluation through the same shape path the builder uses.
 * @evidenceReview {@link Human.measureHumanBodyBasisChannels} #43441bf Read the whole-surface RMS accumulation, the empty-population refusal and the rule evaluation through the same shape path the builder uses.
 * @evidence {@link Human.admitHumanBodyBasisDocument} Read exact schema admission, finiteness over weights, rows, angles and material scalars, nonblank identities and the duplicate-bone refusal.
 * @evidenceReview {@link Human.admitHumanBodyBasisDocument} #4bd1406 Read exact schema admission, finiteness over weights, rows, angles and material scalars, nonblank identities and the duplicate-bone refusal.
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

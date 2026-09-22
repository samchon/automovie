/**
 * Viewer package boundaries for actors and asset representation.
 *
 * The package's lint.config.ts selects this declaration as an exclusion
 * carrier within its complete public-source population. It has no runtime
 * state and is not re-exported by the package barrel. Each declared
 * target/reason pair below owns one intentional negative relationship;
 * requirement and specification boundaries for this domain stay together.
 * Positive implementation citations remain on the actual public exports.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-connected-basis The viewer displays evaluated geometry and does not interpret reusable facial bases or compact editing documents.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis GPU display consumes completed mesh parts; sparse endpoint evaluation and normals before material separation happen in the human builder.
 * An exclusion neither implements a feature nor approves a rendered asset.
 * Add a boundary at its semantic owner and retain native graph validation.
 *
 * @evidenceExclude requirements/actors/body-authoring/README.md#body-requirements The viewer draws the posed model the human body builder emits; it evaluates no basis, joint, measurement or document.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-connected-basis The viewer consumes the evaluated static body model and holds no basis endpoints or correctives.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-joints The viewer draws already skinned positions; landmark-defined joints and skinning belong to the human package.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-measurements The viewer displays no girth or length; measurement belongs to the human package.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-document The viewer never reads a compact body document.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/README.md#body-specifications The viewer projects the body builder's result and owns none of the body basis, measurement or document contracts.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis The viewer consumes the evaluated static body model and holds no basis endpoints or correctives.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints The viewer draws already skinned positions; landmark-defined joints and skinning belong to the human package.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements The viewer displays no girth or length; measurement belongs to the human package.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-document The viewer never reads a compact body document.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-editor The viewer hosts no body editing screen; the playground page does.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-export The viewer does not serialize a built body; the human package's exporter does.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view The viewer owns no body editor inputs or display state.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor The viewer owns no body editor transaction or worker boundary.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-export The viewer does not write a built body to glTF through the human package.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-simple-shape The viewer does not expand simple body parameters; the human package's expansion does.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape The viewer evaluates no simple-tier table or measured inversion.
 * @evidenceExclude requirements/actors/facial-authoring/README.md#face-requirements The general viewer displays compiled scene state; it does not own detailed facial authoring across document, editor and study review.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-document The general viewer displays compiled scene state; it does not own the standalone human-face recipe, basis and version interpreter.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components The general viewer displays compiled scene state; it does not own named craniofacial components, cavities and attached tissues.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-skin-condition The render loop displays resolved skin geometry; it does not author persistent tissue morphology or choose expression crease strengths.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-skin-colour The GPU lifecycle displays supplied vertex colours; it does not define pigment envelopes or pair facial component assemblies.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement The general viewer displays compiled scene state; it does not own anatomical detail overrides and side-specific part replacement.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-expression The general viewer displays compiled scene state; it does not own observed-relative eyelid, oral, dental and gaze performance.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-editor The general viewer displays compiled scene state; it does not own the interactive face editor, camera and file controls.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-editor-state The general viewer displays compiled scene state; it does not own transactional face-document history and asynchronous last-valid publication.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-export The general viewer displays compiled scene state; it does not own validated anatomical face GLTF/GLB serialization.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-provenance The general viewer displays compiled scene state; it does not own non-executable selected-portrait facts in the face document.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-review The general viewer displays compiled scene state; it does not own per-person source inventories, direct render inspection and likeness decisions.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/README.md#face-specifications The general viewer displays compiled scene state; it does not own the complete face construction, application and review boundary.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document The general viewer displays compiled scene state; it does not own human-face version admission and photo-independent basis interpretation.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components The general viewer displays compiled scene state; it does not own cranial, cervical, ocular, nasal, oral and auricular surface assembly.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair GPU display consumes completed hair strips and materials; it does not sample scalp roots or integrate numerical styling fields.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-skin-condition This GPU lifecycle consumes constructed meshes and owns neither anatomical field synthesis nor portrait-local conforming subdivision.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-skin-colour The GPU lifecycle displays supplied vertex colours; it does not define pigment envelopes or pair facial component assemblies.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls The general viewer displays compiled scene state; it does not own ordered face defaults, trait offsets, array replacement and asymmetric detail.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments The general viewer displays compiled scene state; it does not own face-part cut ownership and final-surface attachment correspondence.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-expression The general viewer displays compiled scene state; it does not own the neutral/observed/current face solve and fixed optical identity.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor The general viewer displays compiled scene state; it does not own request-generation isolation and committed face history.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view The general viewer displays compiled scene state; it does not own DOM face controls, camera/clay state and last-valid downloads.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-export The general viewer displays compiled scene state; it does not own face-specific Float32, optical-material and GLTF serialization admission.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-provenance The general viewer displays compiled scene state; it does not own nullable portrait provenance that does not execute during face replay.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review The general viewer displays compiled scene state; it does not own input/output review receipts, required portrait views and subjective acceptance.
 * @evidenceExclude requirements/actors/appearance-costume-and-attachments.md The viewer performs compiled actor state; casting, identity, costume, and performance-authoring decisions remain upstream.
 * @evidenceExclude requirements/actors/body-scale-and-landmarks.md The viewer performs compiled actor state; casting, identity, costume, and performance-authoring decisions remain upstream.
 * @evidenceExclude requirements/actors/inputs-selection-and-replacement.md The viewer performs compiled actor state; casting, identity, costume, and performance-authoring decisions remain upstream.
 * @evidenceExclude requirements/actors/performance-and-story-binding.md The viewer performs compiled actor state; casting, identity, costume, and performance-authoring decisions remain upstream.
 * @evidenceExclude requirements/actors/populations-and-doubles.md The viewer performs compiled actor state; casting, identity, costume, and performance-authoring decisions remain upstream.
 * @evidenceExclude requirements/actors/pose-expression-and-gaze.md The viewer performs compiled actor state; casting, identity, costume, and performance-authoring decisions remain upstream.
 * @evidenceExclude requirements/actors/README.md The viewer performs compiled actor state; casting, identity, costume, and performance-authoring decisions remain upstream.
 * @evidenceExclude requirements/actors/representation-tiers-and-fidelity-boundary.md The viewer performs compiled actor state; casting, identity, costume, and performance-authoring decisions remain upstream.
 * @evidenceExclude requirements/actors/scope-and-identity.md The viewer performs compiled actor state; casting, identity, costume, and performance-authoring decisions remain upstream.
 * @evidenceExclude requirements/actors/skeleton-rig-and-retargeting.md The viewer performs compiled actor state; casting, identity, costume, and performance-authoring decisions remain upstream.
 * @evidenceExclude requirements/actors/state-and-continuity.md The viewer performs compiled actor state; casting, identity, costume, and performance-authoring decisions remain upstream.
 * @evidenceExclude requirements/actors/validation.md The viewer performs compiled actor state; casting, identity, costume, and performance-authoring decisions remain upstream.
 * @evidenceExclude requirements/actors/voice-and-utterance-identity.md The viewer performs compiled actor state; casting, identity, costume, and performance-authoring decisions remain upstream.
 * @evidenceExclude requirements/asset-authoring/era-and-style.md The viewer materializes compiled assets; authoring, validation, provenance, and refusal remain upstream.
 * @evidenceExclude requirements/asset-authoring/external-assets.md#asset-bounded-decoder The viewer materializes compiled assets; authoring, validation, provenance, and refusal remain upstream.
 * @evidenceExclude requirements/asset-authoring/external-assets.md#asset-external-adoption-mode The viewer materializes compiled assets; authoring, validation, provenance, and refusal remain upstream.
 * @evidenceExclude requirements/asset-authoring/external-assets.md#asset-external-conversion-receipt The viewer materializes compiled assets; authoring, validation, provenance, and refusal remain upstream.
 * @evidenceExclude requirements/asset-authoring/external-assets.md#asset-external-gltf-scene The viewer materializes compiled assets; authoring, validation, provenance, and refusal remain upstream.
 * @evidenceExclude requirements/asset-authoring/external-assets.md#asset-external-group-composition The viewer materializes compiled assets; authoring, validation, provenance, and refusal remain upstream.
 * @evidenceExclude requirements/asset-authoring/external-assets.md#asset-external-provenance-digest The viewer materializes compiled assets; authoring, validation, provenance, and refusal remain upstream.
 * @evidenceExclude requirements/asset-authoring/external-assets.md#asset-external-replacement The viewer materializes compiled assets; authoring, validation, provenance, and refusal remain upstream.
 * @evidenceExclude requirements/asset-authoring/external-assets.md#asset-external-resource-closure The viewer materializes compiled assets; authoring, validation, provenance, and refusal remain upstream.
 * @evidenceExclude requirements/asset-authoring/external-assets.md#asset-external-secret-boundary The viewer materializes compiled assets; authoring, validation, provenance, and refusal remain upstream.
 * @evidenceExclude requirements/asset-authoring/generated-assets.md The viewer materializes compiled assets; authoring, validation, provenance, and refusal remain upstream.
 * @evidenceExclude requirements/asset-authoring/geometry.md The viewer materializes compiled assets; authoring, validation, provenance, and refusal remain upstream.
 * @evidenceExclude requirements/asset-authoring/identity-and-instances.md The viewer materializes compiled assets; authoring, validation, provenance, and refusal remain upstream.
 * @evidenceExclude requirements/asset-authoring/materials-and-textures.md The viewer materializes compiled assets; authoring, validation, provenance, and refusal remain upstream.
 * @evidenceExclude requirements/asset-authoring/patterns-and-procedural-composition.md The viewer materializes compiled assets; authoring, validation, provenance, and refusal remain upstream.
 * @evidenceExclude requirements/asset-authoring/README.md The viewer materializes compiled assets; authoring, validation, provenance, and refusal remain upstream.
 * @evidenceExclude requirements/asset-authoring/representations-bounds-and-lod.md The viewer materializes compiled assets; authoring, validation, provenance, and refusal remain upstream.
 * @evidenceExclude requirements/asset-authoring/rig-and-state.md The viewer materializes compiled assets; authoring, validation, provenance, and refusal remain upstream.
 * @evidenceExclude requirements/asset-authoring/validation.md The viewer materializes compiled assets; authoring, validation, provenance, and refusal remain upstream.
 * @evidenceExclude requirements/external-inputs/adoption-modes-and-composition.md#external-adoption-group-composition The viewer consumes adopted runtime assets; ingestion, identity mapping, trust, and refusal remain in ingest and compilation.
 * @evidenceExclude requirements/external-inputs/adoption-modes-and-composition.md#external-adoption-intent-persistence The viewer consumes adopted runtime assets; ingestion, identity mapping, trust, and refusal remain in ingest and compilation.
 * @evidenceExclude requirements/external-inputs/adoption-modes-and-composition.md#external-adoption-native-reinterpretation The viewer consumes adopted runtime assets; ingestion, identity mapping, trust, and refusal remain in ingest and compilation.
 * @evidenceExclude requirements/external-inputs/adoption-modes-and-composition.md#external-adoption-selection-overrides The viewer consumes adopted runtime assets; ingestion, identity mapping, trust, and refusal remain in ingest and compilation.
 * @evidenceExclude requirements/external-inputs/conversion-receipts-and-determinism.md The viewer consumes adopted runtime assets; ingestion, identity mapping, trust, and refusal remain in ingest and compilation.
 * @evidenceExclude requirements/external-inputs/credentials-rights-and-provenance.md The viewer consumes adopted runtime assets; ingestion, identity mapping, trust, and refusal remain in ingest and compilation.
 * @evidenceExclude requirements/external-inputs/identity-coordinates-and-units.md The viewer consumes adopted runtime assets; ingestion, identity mapping, trust, and refusal remain in ingest and compilation.
 * @evidenceExclude requirements/external-inputs/media-families-and-declared-facts.md The viewer consumes adopted runtime assets; ingestion, identity mapping, trust, and refusal remain in ingest and compilation.
 * @evidenceExclude requirements/external-inputs/README.md The viewer consumes adopted runtime assets; ingestion, identity mapping, trust, and refusal remain in ingest and compilation.
 * @evidenceExclude requirements/external-inputs/refresh-version-pinning-and-offline.md The viewer consumes adopted runtime assets; ingestion, identity mapping, trust, and refusal remain in ingest and compilation.
 * @evidenceExclude requirements/external-inputs/resource-closure-and-acquisition.md The viewer consumes adopted runtime assets; ingestion, identity mapping, trust, and refusal remain in ingest and compilation.
 * @evidenceExclude requirements/external-inputs/source-selection-and-provider-neutrality.md The viewer consumes adopted runtime assets; ingestion, identity mapping, trust, and refusal remain in ingest and compilation.
 * @evidenceExclude requirements/external-inputs/unsupported-and-degradation.md The viewer consumes adopted runtime assets; ingestion, identity mapping, trust, and refusal remain in ingest and compilation.
 * @evidenceExclude requirements/external-inputs/validation-and-quarantine.md The viewer consumes adopted runtime assets; ingestion, identity mapping, trust, and refusal remain in ingest and compilation.
 * @evidenceExclude specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-alternative-failure-compatibility The viewer materializes resolved representations; asset authority, authoring, validation, and compatibility refusal remain upstream.
 * @evidenceExclude specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-alternative-selection-output The viewer materializes resolved representations; asset authority, authoring, validation, and compatibility refusal remain upstream.
 * @evidenceExclude specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-deterministic-instance-generation The viewer materializes resolved representations; asset authority, authoring, validation, and compatibility refusal remain upstream.
 * @evidenceExclude specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality The viewer materializes resolved representations; asset authority, authoring, validation, and compatibility refusal remain upstream.
 * @evidenceExclude specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-instance-override-resolution The viewer materializes resolved representations; asset authority, authoring, validation, and compatibility refusal remain upstream.
 * @evidenceExclude specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-prototype-instance The viewer materializes resolved representations; asset authority, authoring, validation, and compatibility refusal remain upstream.
 * @evidenceExclude specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-variant-inheritance The viewer materializes resolved representations; asset authority, authoring, validation, and compatibility refusal remain upstream.
 * @evidenceExclude specifications/asset-and-representation/bounds-proxies-and-lod.md The viewer materializes resolved representations; asset authority, authoring, validation, and compatibility refusal remain upstream.
 * @evidenceExclude specifications/asset-and-representation/fidelity-and-validation.md The viewer materializes resolved representations; asset authority, authoring, validation, and compatibility refusal remain upstream.
 * @evidenceExclude specifications/asset-and-representation/generated-assets-and-repaint-handoff.md The viewer materializes resolved representations; asset authority, authoring, validation, and compatibility refusal remain upstream.
 * @evidenceExclude specifications/asset-and-representation/identity-resources-and-lifecycle.md The viewer materializes resolved representations; asset authority, authoring, validation, and compatibility refusal remain upstream.
 * @evidenceExclude specifications/asset-and-representation/model-geometry-and-surface-facts.md The viewer materializes resolved representations; asset authority, authoring, validation, and compatibility refusal remain upstream.
 * @evidenceExclude specifications/asset-and-representation/README.md The viewer materializes resolved representations; asset authority, authoring, validation, and compatibility refusal remain upstream.
 * @evidenceExclude specifications/asset-and-representation/rig-deformation-and-state.md The viewer materializes resolved representations; asset authority, authoring, validation, and compatibility refusal remain upstream.
 * @evidenceExclude specifications/interchange-and-adoption/adoption-decisions-and-composition.md#interchange-adoption-intent-replay The viewer consumes adopted assets; parsing, identity mapping, trust, retargeting policy, and refusal remain upstream.
 * @evidenceExclude specifications/interchange-and-adoption/adoption-decisions-and-composition.md#interchange-group-composition-boundary The viewer consumes adopted assets; parsing, identity mapping, trust, retargeting policy, and refusal remain upstream.
 * @evidenceExclude specifications/interchange-and-adoption/adoption-decisions-and-composition.md#interchange-native-reinterpretation-boundary The viewer consumes adopted assets; parsing, identity mapping, trust, retargeting policy, and refusal remain upstream.
 * @evidenceExclude specifications/interchange-and-adoption/adoption-decisions-and-composition.md#interchange-selection-override-resolution The viewer consumes adopted assets; parsing, identity mapping, trust, retargeting policy, and refusal remain upstream.
 * @evidenceExclude specifications/interchange-and-adoption/conversion-receipts-and-determinism.md The viewer consumes adopted assets; parsing, identity mapping, trust, retargeting policy, and refusal remain upstream.
 * @evidenceExclude specifications/interchange-and-adoption/identity-coordinates-and-units.md The viewer consumes adopted assets; parsing, identity mapping, trust, retargeting policy, and refusal remain upstream.
 * @evidenceExclude specifications/interchange-and-adoption/intake-authority-and-routing.md The viewer consumes adopted assets; parsing, identity mapping, trust, retargeting policy, and refusal remain upstream.
 * @evidenceExclude specifications/interchange-and-adoption/media-inspection-boundaries.md The viewer consumes adopted assets; parsing, identity mapping, trust, retargeting policy, and refusal remain upstream.
 * @evidenceExclude specifications/interchange-and-adoption/provenance-rights-and-secrets.md The viewer consumes adopted assets; parsing, identity mapping, trust, retargeting policy, and refusal remain upstream.
 * @evidenceExclude specifications/interchange-and-adoption/README.md The viewer consumes adopted assets; parsing, identity mapping, trust, retargeting policy, and refusal remain upstream.
 * @evidenceExclude specifications/interchange-and-adoption/resource-closure-and-acquisition.md The viewer consumes adopted assets; parsing, identity mapping, trust, retargeting policy, and refusal remain upstream.
 * @evidenceExclude specifications/interchange-and-adoption/revision-refresh-and-offline-cache.md The viewer consumes adopted assets; parsing, identity mapping, trust, retargeting policy, and refusal remain upstream.
 * @evidenceExclude specifications/interchange-and-adoption/support-degradation-and-refusal.md The viewer consumes adopted assets; parsing, identity mapping, trust, retargeting policy, and refusal remain upstream.
 * @evidenceExclude specifications/interchange-and-adoption/validation-and-quarantine.md The viewer consumes adopted assets; parsing, identity mapping, trust, retargeting policy, and refusal remain upstream.
 */
export type AutoMovieViewerEvidenceExclusions = never;

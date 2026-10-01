import type * as Human from "@automovie/human";

import type { humanFaceAnatomySchemaReview } from "./anatomy-schema-review";
import type { humanFaceConnectedReview } from "./connected-review";
import type { humanFaceDetailReview } from "./detail-review";
import type { humanFaceFibreReview } from "./fibre-review";
import type { humanFaceInteriorReview } from "./interior-review";
import type { humanFaceIrisReview } from "./iris-review";
import type { humanFaceNumericalHairReview } from "./numerical-hair-review";
import type { humanFaceOcularReview } from "./ocular-review";
import type { humanFaceStudyDocuments } from "./studies";

/**
 * @evidence {@link humanFaceNumericalHairReview} Retains inspection of the numerical scalp, guide and gathered-tail construction path separately from photographic likeness.
 * @evidence {@link Human.IPortraitColourField} Read the complete five-field numerical reflectance envelope and both consumers. It stores a centre, positive support radii, linear attenuation and strength, with no image or vertex payload. Units follow the caller; connected documents use metres.
 * @evidence {@link Human.IPortraitColourField.name} Read nonblank unique-name admission and lexical composition order. Renaming can change multiplication order at floating precision, but insertion order cannot.
 * @evidence {@link Human.IPortraitColourField.center} Read finite XYZ admission and reference-space sampling. Connected coordinates are neutral basis metres and do not follow the current expression before evaluation.
 * @evidence {@link Human.IPortraitColourField.radius} Read strictly positive finite support radii in the same unit as the centre. They bound the compact ellipsoid without changing geometry.
 * @evidence {@link Human.IPortraitColourField.gain} Read three finite linear RGB attenuation values in [0,1]. White preserves reflectance; this field does not encode illumination or pigment concentrations.
 * @evidence {@link Human.IPortraitColourField.strength} Read finite inclusive [0,1] strength. Zero is the identity and one applies the full bounded support kernel.
 * @evidence {@link Human.createPortraitColourField} Read cloned fields, unique names, finite tuple and range admission, lexical composition, bounded C2 support and sample refusal. The procedural adapter and connected builder use this one formula; source vertex sampling does not establish subvertex detail.
 * @evidence {@link humanFaceAnatomySchemaReview} Retains the anatomical parameter types' existing source inspections in a cohesive carrier.
 * Current construction-source inspection for the portable face studies.
 * Ocular declarations keep their existing inspections in ocular-review.ts.
 * The source functions, types and component lifecycles were read literally;
 * the per-person image observations remain separately identified in review.md.
 * Deterministic replay and source correctness do not accept photographic likeness.
 * No review fingerprints are authored for these inspections.
 * Retired nasal section, station, lobule and envelope experiments remain in
 * the historical observations; they do not claim current source exports.
 * @evidence {@link humanFaceConnectedReview} Retains the connected-prior schema, numerical evaluation and real consumer inspection as a domain of the complete source population.
 *
 * @evidence {@link humanFaceInteriorReview} Retains the native interior preparation inspection within the whole construction population.
 * @evidence {@link Human.portraitNasalCavityOffset} Read the common X-axis rotation of the millimetre displacement consumed by appendPortraitNostrils; the current component rotates its aperture in the same frame. The removed envelope alternative is no longer a consumer, and this arithmetic inspection claims neither airway measurements nor rendered acceptance.
 * @evidence {@link humanFaceDetailReview} Retains numerical editor and domain inventory inspections in the complete construction review.
 * @evidence {@link humanFaceOcularReview} Retains all ocular source inspections as part of the complete construction review.
 *
 * @evidence {@link Human.createPortraitSkinColour} Inspects owned name-ordered compact colour multiplication after reference refinement.
 * @evidence {@link Human.assertPortraitOralLining} Admits the selected enclosure dimensions.
 * @evidence {@link Human.tracePortraitOralBoundary} Inspects the seeded actual skin attachment consumed by the lining.
 * @evidence {@link Human.buildPortraitOralLining} Joins a cavity to the final lip boundary.
 * @evidence {@link Human.attachPortraitOralMesh} Shares dental and lingual placement arithmetic.
 * @evidence {@link Human.portraitTongueParameters} Shares tongue shape editing envelopes.
 * @evidence {@link Human.assertPortraitTongueShape} Admits the complete lingual profile.
 * @evidence {@link Human.buildPortraitTongue} Builds the closed local lingual surface.
 * @evidence {@link Human.createPortraitTongueComponent} Connects lingual shape to the real face component protocol.
 * @evidence {@link Human.portraitJawSkinWeight} Shares the observed oral-band attachment field.
 * @evidence {@link Human.createPortraitJawContinuation} Connects mandibular motion to reference-formed head and neck.
 * @evidence {@link Human.portraitSkinParameters} Defines the shared skin defaults, units and scalar editing envelopes.
 * @evidence {@link Human.resolvePortraitSkinShape} Admits owned complete settings without turning invalid values into defaults.
 * @evidence {@link Human.createPortraitSkinLayer} Shapes live skin through anatomical crease and tissue fields rather than photo paint.
 * @evidence {@link Human.refinePortraitSurfaceSampling} Supplies connected local samples for narrow skin folds and their neighbouring curvature.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review Keeps the full original inventory, selected documents and artifact-specific direct observations separate from the unaccepted likeness verdicts.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review Identifies each input, output and capture digest and preserves independent construction, replay, output, capture and direct-inspection outcomes in the linked per-person account.
 * @evidenceExclude requirements/actors/facial-authoring/README.md#face-requirements This study account owns identified observations and verdicts, not the domain index's complete numerical construction and interactive authoring workflow.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/README.md#face-specifications This record covers the inspection boundary; the domain index also includes runtime interpretation, topology and browser transactions implemented by their separate consumers.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-skin-colour This source inspection observes numerical colour without authoring pigmentation or performing its tissue transport.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-skin-colour The account records inspections; paired anatomical assembly and colour evaluation belong to the human builder, not study metadata.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-document Saved documents are observed inputs here; the human document parser and builder own versioned independent reconstruction, not this source-review account.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components This account inspects actual anatomical components but does not implement their shapes or numerical controls; those definitions live in human.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement This account records results of edits; the public resolver and replacement operations, rather than review metadata, own override precedence and preservation.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-expression The study observes named expressions and their limitations, while anatomical tissue and optics builders implement performance and its supported domains.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-editor The private playground panel owns subject selection and interaction; this record supplies studied inputs and observations, not a second editor.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-editor-state Transaction cancellation, atomic publication and history belong to the editor state machine and panel; the static study account has no pending-request state.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-export This account identifies inspected output bytes; the human exporter owns static conversion and unsupported-resource refusal.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-provenance The versioned face-document schema owns optional non-executable provenance fields; this account instead preserves the selected study inventory and review outcomes.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document The human document interpreter owns supported versions, basis admission and deterministic reconstruction; this static account records the inputs and observed results.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Numerical anatomical factories own common topology and the millimetre-to-metre boundary; their inspection here is not an alternate geometry implementation.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls The public controls and merge/replace functions own default interpretation and coupled admission; this record cannot substitute for those executable checks.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Shared component fitting, skin constraints and closed seams are implemented by the human assembler, while this account records their inspected consequence.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-expression Eye, oral and mandibular performance functions own observed-relative kinematics and refusal; this study account records only the inspected pose population.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor The editor state machine owns committed pairs, request generations and validated history; no executable transaction state belongs in this review record.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-export The human export path owns actual Float32/optical conversion; this account identifies its outputs without reimplementing conversion or file download.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view The playground panel and viewport own controls, camera and display; the registry is their data source, not a replacement interaction implementation.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-provenance The public document schema and resolver define optional provenance's non-execution; this account instead records the concrete originals and inspection decisions.
 *
 * @evidence {@link Human.assertPortraitHairFibreCurl} Inspects shared finite inclusive curl admission used by empty-groom geometry and both texture constructors.
 * @evidence {@link Human.buildPortraitHairGroom} Connects independent card populations and owned materials to the actual face builder.
 * @evidence {@link Human.buildPortraitHairCards} Emits merged UV-bearing hair strips from numerical guides.
 * @evidence {@link Human.createPortraitHairTexture} Builds a resident deterministic fibre mask without external images.
 * @evidence {@link Human.createPortraitHairMaterial} Derives the builder's independent masked hair finish without replacing its base.
 * @evidence {@link Human.createPortraitHairNormalTexture} Encodes the card mask's shared fibre widths as resident transverse shading detail.
 * @evidence {@link Human.refinePortraitSkinBridge} Retains original-surface interior witnesses inside the attachment boundary.
 * @evidence {@link Human.appendPortraitCranium} Appends the cranial continuation to the shared control cage.
 * @evidence {@link Human.appendPortraitNeck} Appends the authored neck continuation and its crop to the cranial cage.
 * @evidence {@link Human.appendPortraitNostrils} Builds support rings and closed cavity floors from the fitted shared aperture.
 * @evidence {@link Human.applyHumanFaceControls} Applies the trait layer to an owned recipe before exact detailed overrides.
 * @evidence {@link Human.applyPortraitFinalSurfaces} Applies compatible final positions after every provider has observed the same basis.
 * @evidence {@link Human.applyPortraitOralContact} Resolves one optional named lip/enamel/cavity relationship on assembled head parts.
 * @evidence {@link Human.applyPortraitRegionReplacements} Collects reserved boundaries before mutating an owned replacement mesh.
 * @evidence {@link Human.applyPortraitSurfaceLayers} Applies the composed surface displacement with open-rim protection before common normals and material extraction.
 * @evidence {@link Human.assertPortraitDentalCrown} Admits usable enamel profiles before their width influences arch clearance.
 * @evidence {@link Human.assertPortraitSkinTopology} Audits the declared openings and stitches of the complete control cage before refinement.
 * @evidence {@link Human.attachPortraitDentalRow} Places every crown vertex and normal through one orthonormal oral frame.
 * @evidence {@link Human.AutoMovieHumanFaceOverride} Preserves whole-array replacement while permitting recursive object-field overrides in each stored face document.
 * @evidence {@link Human.blendPortraitSkin} Adapts neighbouring skin to exact component attachments on one unchanged host.
 * @evidence {@link Human.buildHumanFace} Constructs the actual selected face and performance from the versioned document without a photo service.
 * @evidence {@link Human.buildPortraitDentalCrown} Builds each closed local crown before the row arranges it along one arch.
 * @evidence {@link Human.buildPortraitDentalRow} Composes the owned crowns on a nominal arch and resolves optional proximal contact before merging the group.
 * @evidence {@link Human.buildPortraitEars} Samples and attaches both authored ear shells to the final cranial surface.
 * @evidence {@link Human.preparePortraitHead} Prepares shared skin and retains component finishers for the actual head consumer.
 * @evidence {@link Human.buildPortraitHead} Consumes prepared shared skin before contact sealing, common normals, material separation and attached interiors.
 * @evidence {@link Human.buildPortraitMouth} Builds the recessed cavity and, when requested, the legacy upper crowns from final lip curves.
 * @evidence {@link Human.createHumanFaceEditor} Owns atomic face-document/model publication, cancellation and undoable history for the application.
 * @evidence {@link Human.createPortraitCheekLayer} Derives owned cheek and fold fields from live refined skin attachments.
 * @evidence {@link Human.createPortraitDentalArc} Samples the supplied dental guide by cumulative XZ distance rather than projected width or spline progress.
 * @evidence {@link Human.createPortraitDentalComponent} Attaches the complete dental row to live refined oral anchors without cutting or deforming skin.
 * @evidence {@link Human.createPortraitDirectionalIntersection} Intersects the foremost resident triangle from either side while preserving the original transverse projection; the canthal consumer uses its actual emitted surface.
 * @evidence {@link Human.createPortraitDirectionalContact} Resolves a contact target from resident triangles along a declared projection direction.
 * @evidence {@link Human.createPortraitFacePerformanceComponent} Binds brow motion and lower facial skin to the same host used by the anatomical parts.
 * @evidence {@link Human.createPortraitFacialFrame} Transforms one shared host and its metric hinge attachment through compact anatomical supports.
 * @evidence {@link Human.createPortraitLipBandSampler} Supplies normalized lip coordinates and their authoritative inner/outer heights together.
 * @evidence {@link Human.createPortraitLipBandScale} Resolves omitted, scalar or ordered optional band profiles for mouth fitting.
 * @evidence {@link Human.createPortraitLipCoordinates} Binds outer and inner lip curves to the section's normalized coordinates.
 * @evidence {@link Human.createPortraitLipSection} Evaluates owned vermilion relief with exactly zero contribution at both band edges and corners.
 * @evidence {@link Human.createPortraitMandibularDentition} Attaches independently authored lower crowns to the observed jaw and moves the intact row.
 * @evidence {@link Human.createPortraitMaterials} Produces owned reusable skin, dental and optical material defaults for a caller's face.
 * @evidence {@link Human.createPortraitMouthComponent} Fits the curved lip bands and declares their shared skin border, oral opening and interior finisher.
 * @evidence {@link Human.createPortraitMouthPerformance} Poses the actual paired oral margins while retaining the surrounding vermilion volume.
 * @evidence {@link Human.createPortraitNasalSupport} Resolves nasal projection from one subject-bound facial support plane.
 * @evidence {@link Human.createPortraitNoseComponent} Fits procedural exterior and shared nasal openings before constructing their lining.
 * @evidence {@link Human.exportHumanFace} Carries the actual static face as GLB and glTF/resources through a module-independent byte boundary.
 * @evidence {@link Human.fitPortraitNostrilRim} Regularizes an authored nasal cut boundary while preserving cyclic vertex ownership and centroid.
 * @evidence {@link Human.fitPortraitOralContact} Places the rigid enamel group behind its lip and then fits the cavity behind that placed group.
 * @evidence {@link Human.humanFaceControlDefinitions} Defines the fifteen intermediate trait controls shown and admitted by the editor.
 * @evidence {@link Human.humanFaceExpressionDefinitions} Provides the editor with the declared neutral values, paired ownership, units and bounds for performance.
 * @evidence {@link Human.humanFaceRegions} Names the actual whole-profile owners available in the face editor.
 * @evidence {@link Human.humanFaceRegionValue} Returns a copied resolved profile rather than raw or pending override data.
 * @evidence {@link Human.IAutoMovieHumanFaceBindings} Identifies each eye, nose, oral loop, cheek support and dental or mandibular attachment on the document's host.
 * @evidence {@link Human.IAutoMovieHumanFaceControls} Records intermediate identity offsets independently of exact profile overrides and expression.
 * @evidence {@link Human.IAutoMovieHumanFaceDocument} Keeps each selected numerical face, immutable basis, explicit changes and non-executable provenance in one versioned artifact.
 * @evidence {@link Human.IAutoMovieHumanFaceEditorSnapshot} Exposes the last committed numerical face with current request status and history availability.
 * @evidence {@link Human.IAutoMovieHumanFaceExpression} Keeps current performance separate from the expression already present in each recorded basis.
 * @evidence {@link Human.IAutoMovieHumanFaceRecipe} Collects the individual part profiles and optional shared supports replayed by the face builder.
 * @evidence {@link Human.IControlMesh} Carries the shared triangular control positions, connectivity and one material label per face.
 * @evidence {@link Human.IPortraitComponent} Separates an anatomical instance's identity, finishes and host-fitting operation.
 * @evidence {@link Human.IPortraitComponentHost} Carries the original geometry and recorded view ray into every fitted part.
 * @evidence {@link Human.IPortraitComponentPlan} Splits a fitted part into exact host requests and shared-topology attachment.
 * @evidence {@link Human.IPortraitFinalSurface} Specifies a callback returning resident vertex targets rather than a detached mesh.
 * @evidence {@link Human.IPortraitFinalSurfaceHost} Exposes the common post-layer geometry seen by final component proposals.
 * @evidence {@link Human.IPortraitRegionReplacement} Describes a reserved group and its later appender against the refined socket.
 * @evidence {@link Human.IPortraitSurfaceHost} Gives anatomical layers the shared post-subdivision coordinates, topology and normal field.
 * @evidence {@link Human.IPortraitSurfaceLayer} Separates a surface layer's identity from its derivation of metric engine fields on live attachments.
 * @evidence {@link Human.mergeHumanFaceSettings} Composes basis, detail and side settings without retaining mutable input objects.
 * @evidence {@link Human.parseHumanFaceDocument} Admits a complete selected document before a numerical preview or replay begins.
 * @evidence {@link Human.placeMeshPreservingFaces} Protects each part's actual placement before its final precision conversion.
 * @evidence {@link Human.portraitCranialChinHeight} Derives the cranial continuation's chin datum from the retained facial oval.
 * @evidence {@link Human.orderCutPatchBoundary} Orders the exposed edges of a selected triangle patch.
 * @evidence {@link Human.portraitDirectionalSurfaceTargets} Converts complete engine face-clearance deficits into shared metric vertex targets.
 * @evidence {@link Human.portraitMinimumDirectionalSurfaceTargets} Projects both resident meshes through the existing contact frame, requests bounded area-weighted engine displacements and maps those metric travels back to original vertex identities. The retained twelve current-basis eye queries converge with no advance beyond their conservative caps; whole-face propagation and Float32 output require their separate renewed checks.
 * @evidence {@link Human.createGltfDocument} Converts the complete static study into resident GLTF material groups and attributes.
 * @evidence {@link Human.portraitEarShape} Supplies the default authored ear profile when no replacement is selected.
 * @evidence {@link Human.selectHostFacesInsideLoop} Delegates anatomical-loop face selection to the engine's connectivity owner.
 * @evidence {@link Human.gltfMaterialExtensions} Declares the optical extension classes registered on this study's GLTF readers and writers.
 * @evidence {@link Human.portraitLipTriangles} Selects the connected lip band bounded by the two authored anatomical loops.
 * @evidence {@link Human.float32MeshBuffers} Materializes and validates the actual Float32/Uint32 geometry delivered to glTF.
 * @evidence {@link Human.linearInterpolate} Interpolates scalar coordinates and dimensions within the authored surface sections.
 * @evidence {@link Human.portraitNeckShape} Selects the active cranial/neck section dimensions and crop.
 * @evidence {@link Human.areaWeightedNormals} Computes the shared skin/lining normal field before material regions are separated.
 * @evidence {@link Human.portraitNoseDepth} Evaluates the basic central-tip and paired-alar relief in the socket frame.
 * @evidence {@link Human.portraitNostrilContains} Classifies points strictly inside an authored elliptical footprint during binding.
 * @evidence {@link Human.createMetricMeshPart} Converts completed construction meshes into static metre-space AutoMovie parts.
 * @evidence {@link Human.triangulateSurfaceLattice} Produces the shared rectangular sampling lattice used by authored parametric surfaces.
 * @evidence {@link Human.millimetrePoint} Supplies the common XYZ value used by the study's construction-space curves and component frames.
 * @evidence {@link Human.intersectRayWithHeightField} Provides a bracketed camera-ray intersection for a caller-owned finite height surface.
 * @evidence {@link Human.extractTriangleRegion} Extracts named material geometry while preserving the common field and original vertex identity.
 * @evidence {@link Human.portraitSkinAnnulus} Bridges a reserved outer host boundary to the component's inner boundary with the existing planar region triangulator.
 * @evidence {@link Human.catmullRomPoint} Interpolates ordered spatial landmarks for lid, dental and other study curves.
 * @evidence {@link Human.sweepEightSidedTube} Sweeps the coarse lash/brow strands in their construction frame.
 * @evidence {@link Human.posePortraitJawPoint} Applies one bounded weighted mandibular rotation about the authored transverse hinge.
 * @evidence {@link Human.replaceHumanFaceRegion} Replaces one current-basis anatomical override while preserving all unrelated settings.
 * @evidence {@link Human.reservePortraitSkin} Selects a connected host-skin reservation that contains a component's proposed outer seam before the component removes its original faces.
 * @evidence {@link Human.resizePortraitNostrilRim} Changes aperture dimensions inside its fitted plane without independently flattening the rim.
 * @evidence {@link Human.resolveHumanFaceDocument} Resolves the saved identity, independent side profiles and observed/current performance into one immutable construction input.
 * @evidence {@link Human.resolveHumanFaceExpression} Expands each requested expression into explicit independently admitted right/left and scalar values.
 * @evidence {@link Human.resolvePortraitCraniumShape} Resolves copied cranial defaults and admits complete caller-owned sagittal sections.
 * @evidence {@link Human.resolvePortraitEarSampling} Validates pinna dimensions separately from bounded mesh sampling.
 * @evidence {@link Human.resolvePortraitNoseShape} Read copied scalar admission, lining fractions in (0,1), roundness in [0,1] and nonnegative adaptation reach. This establishes numerical construction premises and preserves caller ownership; living-body ranges remain unimplemented.
 * @evidence {@link Human.resolvePortraitFacialFrameShape} Supplies owned neutral frame dimensions and refuses unsupported numerical combinations.
 * @evidence {@link Human.sealPortraitContactSeams} Closes only declared coincident free-boundary tissue contacts after refinement.
 * @evidence {@link Human.serializeHumanFaceDocument} Publishes only the numerical document through the same admission contract used on load.
 * @evidence {@link Human.subdivideControlMesh} Refines the connected triangular cage before its shared normals and interiors are finalized.
 * @evidence {@link humanFaceStudyDocuments} Binds the actual eighteen editor-consumed numerical documents to the per-person image and construction account.
 * @evidence {@link Human.admitHumanFaceBasisDocument} Shares one finite-scalar admission between loading and saving the flat basis document.
 * @evidence {@link Human.advancePoint} Steps a directional surface walk one sample along the recorded ray.
 * @evidence {@link Human.assertDetailValue} Refuses a detail edit outside the channel's own declared range before it is written.
 * @evidence {@link Human.assertDirection} Refuses a degenerate placement direction before a static part is oriented for export.
 * @evidence {@link Human.assertFinite} Refuses a non-finite scalar in the independent face document, on load and on save alike.
 * @evidence {@link Human.assertHumanFaceBasis} Admits immutable connectivity, endpoint correspondence and triangle partitions once, before the builder compiles.
 * @evidence {@link Human.assertRegion} Names the editor's replaceable anatomical regions and refuses one it does not own.
 * @evidence {@link Human.assertTextSize} Holds a saved document inside the UTF-16 envelope the loader accepts, JSON whitespace included.
 * @evidence {@link Human.buildPortraitCanthalMesh} Builds the canthal tissue that joins the lid margins at both corners.
 * @evidence {@link Human.buildPortraitEyeContactBasis} Combines the cornea and, when resident, the optical globe into the volume lid attachment is constrained against.
 * @evidence {@link Human.buildPortraitEyeCornea} Builds one closed corneal shell, used for drawing and for optical contact alike.
 * @evidence {@link Human.portraitDirectionalContactFrame} Fixes the frame a directional surface contact is measured in.
 * @evidence {@link Human.createHumanFaceDetailChannel} Constructs one documented scalar channel with its unit, range and anatomical profile, admitting no geometry.
 * @evidence {@link Human.createPortraitCanthalIntersection} Intersects an emitted support from either side along the recorded camera ray.
 * @evidence {@link Human.createPortraitEyeSupport} Establishes one eye's fixed optical identity before any lid performance is applied.
 * @evidence {@link Human.createPortraitEyeSurfaceContact} Resolves the shared skin against this eye's actual optical volume.
 * @evidence {@link Human.createPortraitHairFibreTexture} Builds the hair texture both the colour and normal maps are generated from.
 * @evidence {@link Human.humanFaceDetailDefinition} Resolves a named detail channel to its declared definition for the editor.
 * @evidence {@link Human.portraitFacialOvalVertices} Resolves the chin-relative cranial envelope the cranium and chin height are both measured against.
 * @evidence {@link Human.fitPortraitCanthalSphere} Fits the optical body independently of the canthal aperture width.
 * @evidence {@link Human.frontWeight} States how much of the tongue's forward shaping reaches a given station.
 * @evidence {@link Human.humanFaceBasisRegion} Emits one material region from an already evaluated connected surface.
 * @evidence {@link Human.humanFaceCavityChannels} Declares the oral cavity's scalar controls for the common document editor.
 * @evidence {@link Human.humanFaceCheekChannels} Declares the cheek's scalar controls for the common document editor.
 * @evidence {@link Human.humanFaceEarChannels} Declares the ear's scalar controls for the common document editor.
 * @evidence {@link Human.humanFaceFrameChannels} Declares the facial frame's scalar controls for the common document editor.
 * @evidence {@link Human.humanFaceHairChannels} Declares the hair's scalar controls for the common document editor.
 * @evidence {@link Human.humanFaceLashChannels} Declares the eyelash scalar controls for the common document editor.
 * @evidence {@link Human.humanFaceLipChannels} Declares the lip scalar controls for the common document editor.
 * @evidence {@link Human.humanFaceLowerDentalChannels} Declares the mandibular arch scalar controls for the common document editor.
 * @evidence {@link Human.humanFaceNasalChannels} Declares the nose's scalar controls for the common document editor.
 * @evidence {@link Human.humanFaceNeckChannels} Declares the neck's scalar controls for the common document editor.
 * @evidence {@link Human.humanFaceOcularChannels} Declares the eye's scalar controls for the common document editor.
 * @evidence {@link Human.humanFaceSkinChannels} Declares the skin's scalar controls for the common document editor.
 * @evidence {@link Human.humanFaceTongueChannels} Declares the tongue's scalar controls for the common document editor.
 * @evidence {@link Human.humanFaceUpperDentalChannels} Declares the maxillary arch scalar controls for the common document editor.
 * @evidence {@link Human.portraitMouthInnerLoop} Binds the replaceable mouth aperture loop the lip triangles and the component both read.
 * @evidence {@link Human.meanPoint} Averages the sample set the optical globe is fitted from.
 * @evidence {@link Human.normalizedRim} Normalises a nostril rim so width and height can be changed independently.
 * @evidence {@link Human.Point} Names the head-frame point every facial construction is written in.
 * @evidence {@link Human.portraitEyeLidRows} Produces the lid sample rows both profiles are built from.
 * @evidence {@link Human.portraitEyeLoop} Orders the socket's aperture identities counterclockwise, sharing both canthi exactly once.
 * @evidence {@link Human.projectMeshOntoFrame} Projects a point onto the surface a directional contact is measured against.
 * @evidence {@link Human.resolvePortraitEyeInputs} Owns and validates one eye's numerical inputs before any host is fitted.
 * @evidence {@link Human.portraitNostrilRimNormal} Gives the nostril rim its outward normal for independent width and height edits.
 * @evidence {@link Human.portraitLowerLidRoles} Names the lower-lid tissue offsets separately from the profile that applies them.
 * @evidence {@link Human.portraitTongueRows} States how many rings the lingual surface is sampled along, root to tip.
 * @evidence {@link Human.solvePortraitSkinSystem} Solves the sparse Dirichlet system the skin relief is relaxed on.
 * @evidence {@link Human.triangleAreaVector} Measures a triangle so a degenerate face is not carried into an export.
 * @evidence {@link Human.writeHumanFaceDetail} Writes one admitted detail edit into the document the editor owns.
 * @evidence {@link humanFaceFibreReview} Retains inspection of the connected fibre pigment path separately from photographic likeness.
 * @evidence {@link humanFaceIrisReview} Retains inspection of the connected iris pigment path separately from photographic likeness.
 */
export const humanFaceStudyReview = {
  inputs: "inputs.md",
  observations: "review.md",
  likeness: "unaccepted",
};

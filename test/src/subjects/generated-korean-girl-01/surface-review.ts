import type * as Human from "@automovie/human";
import type {
  buildHumanFaceHairMesh,
  closeHumanFaceHairContact,
  createHumanFaceHairBuilder,
  createHumanFaceHairGatherField,
  createHumanFaceHairRoots,
  createHumanFaceHairTailSpread,
  createHumanFaceScalpTint,
  evaluateHumanFaceHairDirection,
  growHumanFaceHairStrand,
  humanFaceHairClosureLoops,
  humanFaceHairContact,
  humanFaceHairDensity,
  humanFaceHairEmergence,
  humanFaceHairFrame,
  humanFaceHairLength,
  humanFaceHairSequence,
  humanFaceHairlineBoundary,
  humanFaceHairlineCoverage,
  integrateHumanFaceHairCurve,
  interpolateHumanFaceHairStrands,
  resolveHumanFaceHairGatherAnchor,
} from "@automovie/human";

/**
 * The new numerical scalp path is inspected as shared construction source.
 * This frozen procedural subject has not migrated to it and receives no new
 * visual or anatomical acceptance from the following source observations.
 * @evidence {@link Human.assertHumanFaceHair} Read strict schema equality, finite/range checks, unique layer names and combined interval budget. Shared domain lookup and actual contact remain builder responsibilities.
 * @evidence {@link createHumanFaceHairRoots} Read neutral area-CDF sampling, square-root barycentric seats, polar masking and retained candidate identities. Failed budgets refuse; no personal guide is selected.
 * @evidence {@link humanFaceHairDensity} Read the ribbon width taken from the population's own local density: the k-nearest-neighbour estimator over the seated roots, the side of the scalp area one root is responsible for, and the measured-area fallback for a population too small to have neighbours.
 * @evidence {@link humanFaceHairSequence} Read the radical inverse shared by deterministic roots, length variation and phase. Inputs come from admitted integer seeds/candidate ordinals.
 * @evidence {@link humanFaceHairFrame} Read finite direction admission and least-aligned-axis transverse conditioning. This convention chooses a ribbon frame without replacing a cancelled growth field.
 * @evidence {@link evaluateHumanFaceHairDirection} Read projected parting, optional Gaussian influence, outward lift and wave/helix modulation. Static kinematic styling is not a physical rod solve.
 * @evidence {@link humanFaceHairEmergence} Read the exit angle from the scalp: the surface normal tilted toward the field's tangential part, by the hairline's own ramp between the mid-scalp and hairline figures.
 * @evidence {@link humanFaceHairContact} Read the clearance (half width, half step, requested clearance and a scale-derived allowance) and the nearest-feature projection shared by guides and interpolated strands.
 * @evidence {@link humanFaceHairLength} Read the six axial lengths combined by absolute chart components and the seeded variation, shared by guides and strands.
 * @evidence {@link resolveHumanFaceHairGatherAnchor} Read the shared polar scalp ray and barycentric attachment; this frozen subject declares no gather field.
 * @evidence {@link createHumanFaceHairGatherField} Read the connected current-scalp distance descent and its domain refusal; the frozen subject does not call it.
 * @evidence {@link createHumanFaceHairTailSpread} Read the deterministic radial tube fill after tie; the frozen subject has no tail.
 * @evidence {@link interpolateHumanFaceHairStrands} Read the guide interpolation: nearest same-side guides by scalp distance, exponential weights against the guides' mean spacing, equal arc-length blending and scaling to the strand's own length.
 * @evidence {@link createHumanFaceScalpTint} Read the scalp tint: coverage from the hairline transition ramp and the root region envelope on the neutral, the densest layer's colour, and the clamped gain toward the hair colour over the skin finish.
 * @evidence {@link humanFaceHairlineCoverage} Read the hairline transition: the zone's depth read as the polar angle it subtends at a direction's own distance, and the smoothstep both the population and the scalp colour take from it.
 * @evidence {@link humanFaceHairlineBoundary} Read the hairline boundary blended from the four authored angles by the squared horizontal chart components, shared by root sampling and scalp coverage.
 * @evidence {@link growHumanFaceHairStrand} Read the placement of one interpolated strand: every station after the root projected by the guides' contact rule, and the strand grown by the integrator when that projection refuses.
 * @evidence {@link integrateHumanFaceHairCurve} Read metric emergence, signed-distance projection, bounded chords and exact terminal length. The free-strip bound does not accept root fans or hair-to-hair intersection.
 * @evidence {@link buildHumanFaceHairMesh} Read actual-station meshing, minimal transverse transport, root fan, arc-length taper and finite-area refusal. No spline refit changes the measured curve.
 * @evidence {@link humanFaceHairClosureLoops} Read the closure rim: edges used by one closure triangle, directed as wound, chained into loops, with branching and open rims refused.
 * @evidence {@link closeHumanFaceHairContact} Read the per-evaluation cap: each rim loop's current centroid appended and fanned over its directed rim edges.
 * @evidence {@link createHumanFaceHairBuilder} Read shared source/domain ownership, barycentric current roots, closed contact queries and procedural finishes. The connected editor consumes it; this frozen subject remains on its separately recorded path.
 * @evidence {@link Human.IPortraitColourField} Read the complete five-field numerical reflectance envelope and both consumers. It stores a centre, positive support radii, linear attenuation and strength, with no image or vertex payload. Units follow the caller; connected documents use metres.
 * @evidence {@link Human.IPortraitColourField.name} Read nonblank unique-name admission and lexical composition order. Renaming can change multiplication order at floating precision, but insertion order cannot.
 * @evidence {@link Human.IPortraitColourField.center} Read finite XYZ admission and reference-space sampling. Connected coordinates are neutral basis metres and do not follow the current expression before evaluation.
 * @evidence {@link Human.IPortraitColourField.radius} Read strictly positive finite support radii in the same unit as the centre. They bound the compact ellipsoid without changing geometry.
 * @evidence {@link Human.IPortraitColourField.gain} Read three finite linear RGB attenuation values in [0,1]. White preserves reflectance; this field does not encode illumination or pigment concentrations.
 * @evidence {@link Human.IPortraitColourField.strength} Read finite inclusive [0,1] strength. Zero is the identity and one applies the full bounded support kernel.
 * @evidence {@link Human.createPortraitColourField} Read cloned fields, unique names, finite tuple and range admission, lexical composition, bounded C2 support and sample refusal. The procedural adapter and connected builder use this one formula; source vertex sampling does not establish subvertex detail.
 * Shared topology, skin, cranium, materials and model export.
 * The frozen study root retains this domain through the native evidence graph.
 * Existing source inspections and historical capture limitations are preserved
 * verbatim. This carrier neither changes geometry nor accepts current likeness;
 * artifact observations and identities remain in review.md and the root record.
 *
 * @evidence {@link Human.IPortraitSkinColourRegion} Inspects all six fields against reference binding, finite admission and the document consumer.
 * @evidence {@link Human.createPortraitSkinColour} Inspects owned name-ordered compact colour multiplication after reference refinement.
 * @evidence {@link Human.IPortraitHeadPerformance} Separates reference continuation from resident performed components.
 * @evidence {@link Human.IPortraitHeadPerformance.reference} Provides reference coordinates for continuation formation.
 * @evidence {@link Human.IPortraitHeadPerformance.pose} Moves newly appended reference tissue before common refinement.
 * @evidence {@link Human.IPortraitSkinShape} Describes optional skin condition without changing the frozen subject's omitted profile.
 * @evidence {@link Human.portraitSkinParameters} Supplies authoring defaults whose zero condition leaves the historical face unchanged.
 * @evidence {@link Human.resolvePortraitSkinShape} Resolves omission to taut skin with no transient crease driver.
 * @evidence {@link Human.createPortraitSkinLayer} Separates live surface detail from the frozen historical mesh and its time-capped fit.
 * @evidence {@link Human.refinePortraitSurfaceSampling} Refines only requested field neighbourhoods, leaving an omitted skin condition without additional sampling.
 * @evidence {@link Human.IPortraitCranialStation} Describes one sagittal section of the superior, inferior and transverse cranial envelopes.
 * @evidence {@link Human.IPortraitCraniumShape} Carries whole-station replacement, posterior cap depth and independent transition correspondence.
 * @evidence {@link Human.IPortraitFacialFrameShape} Names the common-host facial proportions and anatomical support displacements.
 * @evidence {@link Human.createPortraitFacePerformanceComponent} Binds brow motion and lower facial skin to the same host used by the anatomical parts.
 * @evidence {@link Human.createPortraitFacialFrame} Transforms one shared host and its metric hinge attachment through compact anatomical supports.
 * @evidence {@link Human.portraitCranialChinHeight} Derives the cranial continuation's chin datum from the retained facial oval.
 * @evidence {@link Human.resolvePortraitCraniumShape} Resolves copied cranial defaults and admits complete caller-owned sagittal sections.
 * @evidence {@link Human.resolvePortraitEarSampling} Validates pinna dimensions separately from bounded mesh sampling.
 * @evidence {@link Human.resolvePortraitFacialFrameShape} Supplies owned neutral frame dimensions and refuses unsupported numerical combinations.
 * @evidence {@link Human.sealPortraitContactSeams} Closes only declared coincident free-boundary tissue contacts after refinement.
 * @evidence {@link Human.reservePortraitSkin} Selects a connected host-skin reservation that contains a component's proposed outer seam before the component removes its original faces.
 * @evidence {@link Human.portraitSkinAnnulus} Bridges a reserved outer host boundary to the component's inner boundary with the existing planar region triangulator.
 * @evidence {@link Human.portraitNeckShape} Selects the active cranial/neck section dimensions and crop.
 * @evidence {@link Human.createPortraitMaterials} Produces owned reusable skin, dental and optical material defaults for a caller's face.
 * @evidence {@link Human.IPortraitEarShape} Groups the resident ear datum, scale, projection and embedding controls.
 * @evidence {@link Human.IPortraitEarShape.centerY} Locates the ear datum along the construction Y axis.
 * @evidence {@link Human.IPortraitEarShape.centerZ} Locates the ear datum along the construction Z axis.
 * @evidence {@link Human.IPortraitEarShape.heightScale} Scales the ear's vertical extent around its resident datum.
 * @evidence {@link Human.IPortraitEarShape.depthScale} Scales the ear's depth extent around its resident datum.
 * @evidence {@link Human.IPortraitEarShape.projection} Controls the ear's anterior placement relative to the sampled head surface.
 * @evidence {@link Human.IPortraitEarShape.embedding} Controls lateral embedding of the ear shell into its host surface.
 * @evidence {@link Human.buildPortraitEars} Samples and attaches both authored ear shells to the final cranial surface.
 * @evidence {@link Human.portraitEarShape} Supplies the default authored ear profile when no replacement is selected.
 * @evidence {@link Human.IPortraitNeckSection} Describes one cross-section of the authored neck continuation.
 * @evidence {@link Human.IPortraitNeckSection.y} Locates a neck section along the construction Y axis.
 * @evidence {@link Human.IPortraitNeckSection.width} Sets the lateral half-width of one neck section.
 * @evidence {@link Human.IPortraitNeckSection.front} Sets the anterior depth of one neck section.
 * @evidence {@link Human.IPortraitNeckSection.centre} Sets the central depth of one neck section.
 * @evidence {@link Human.IPortraitNeckSection.back} Sets the posterior depth of one neck section.
 * @evidence {@link Human.IPortraitNeckShape} Groups upper/lower neck sections and the crop policy for the cranial continuation.
 * @evidence {@link Human.IPortraitNeckShape.upper} Supplies the upper neck section at the cranial attachment.
 * @evidence {@link Human.IPortraitNeckShape.lower} Supplies the lower neck section at the crop boundary.
 * @evidence {@link Human.IPortraitNeckShape.crop} Selects the authored lower crop applied during neck construction.
 * @evidence {@link Human.IPortraitHairCard} Names a caller-authored numerical surface lock.
 * @evidence {@link Human.assertPortraitHairFibreCurl} Inspects shared finite inclusive curl admission used by empty-groom geometry and both texture constructors.
 * @evidence {@link Human.IPortraitHairShape} Separates card geometry, painted fibres and material ownership.
 * @evidence {@link Human.IPortraitHairLayer} Owns an additional named static guide and finish profile without changing the frozen face.
 * @evidence {@link Human.buildPortraitHairGroom} Assembles independent additional card populations while retaining legacy hair output.
 * @evidence {@link Human.buildPortraitHairCards} Emits merged UV-bearing hair strips from numerical guides.
 * @evidence {@link Human.createPortraitHairTexture} Builds a resident deterministic fibre mask without external images.
 * @evidence {@link Human.createPortraitHairMaterial} Derives the builder's independent masked hair finish without replacing its base.
 * @evidence {@link Human.createPortraitHairNormalTexture} Supplies the independently selected card material's resident fibre shading capability without reauthoring the first study.
 * @evidence {@link Human.refinePortraitSkinBridge} Retains original-surface interior witnesses inside the attachment boundary.
 * @evidence {@link Human.appendPortraitCranium} Appends the cranial continuation to the shared control cage.
 * @evidence {@link Human.appendPortraitNeck} Appends the authored neck continuation and its crop to the cranial cage.
 * @evidence {@link Human.portraitDirectionalSurfaceTargets} Converts complete engine face-clearance deficits into shared metric vertex targets.
 * @evidence {@link Human.portraitMinimumDirectionalSurfaceTargets} Read the shared frame projection, engine-owned bounded contact solve and copied target reconstruction. The ocular consumer keeps subsequent skin propagation and closed-rim correspondence. This source review neither changes the frozen first-girl document nor claims a renewed whole-face render or likeness assessment.
 * @evidence {@link Human.IPortraitCheekSocket} Names the live skin attachments for one side's four cheek envelopes and fold path.
 * @evidence {@link Human.IPortraitCheekSocket.side} Selects the anatomical instance name and outward-offset handedness.
 * @evidence {@link Human.IPortraitCheekSocket.malar} Binds upper-cheek support beneath the lateral orbit.
 * @evidence {@link Human.IPortraitCheekSocket.medial} Binds the medial cheek envelope beside the nasal region.
 * @evidence {@link Human.IPortraitCheekSocket.buccal} Supplies the lower/lateral cheek's own retained support datum.
 * @evidence {@link Human.IPortraitCheekSocket.modiolus} Binds local support outside the oral commissure.
 * @evidence {@link Human.IPortraitCheekSocket.nasolabial} Supplies the ordered retained skin path used by the fold integration.
 * @evidence {@link Human.IPortraitCheekVolume} Separates support placement and extent from signed surface movement.
 * @evidence {@link Human.IPortraitCheekVolume.offset} Positions an envelope relative to its current skin anchor.
 * @evidence {@link Human.IPortraitCheekVolume.width} Sets the field's horizontal support radius in millimetres.
 * @evidence {@link Human.IPortraitCheekVolume.height} Sets vertical support independently of horizontal spread.
 * @evidence {@link Human.IPortraitCheekVolume.reach} Limits the envelope through the depth of the head.
 * @evidence {@link Human.IPortraitCheekVolume.projection} Supplies signed anterior displacement at the envelope centre.
 * @evidence {@link Human.IPortraitCheekVolume.lift} Supplies signed vertical movement independently of anterior projection.
 * @evidence {@link Human.IPortraitCheekShape} Groups four support envelopes and a separately controlled nasolabial fold.
 * @evidence {@link Human.IPortraitCheekShape.malar} Supplies the upper-cheek envelope's own dimensions and motion.
 * @evidence {@link Human.IPortraitCheekShape.medial} Supplies independent medial fullness and centre placement.
 * @evidence {@link Human.IPortraitCheekShape.buccal} Supplies the lower/lateral support envelope separately from the high cheek.
 * @evidence {@link Human.IPortraitCheekShape.modiolus} Controls the local cheek-side support around the mouth corner.
 * @evidence {@link Human.IPortraitCheekShape.foldWidth} Sets the fold's planar support and sampling density.
 * @evidence {@link Human.IPortraitCheekShape.foldDepth} Controls nonnegative groove magnitude before the negative-Z field sign.
 * @evidence {@link Human.IPortraitCheekShape.foldReach} Sets the fold's depth support and its normalized path metric.
 * @evidence {@link Human.createPortraitCheekLayer} Derives owned cheek and fold fields from live refined skin attachments.
 * @evidence {@link Human.orderCutPatchBoundary} Orders the exposed edges of a selected triangle patch.
 * @evidence {@link Human.IPortraitSkinConstraint} Carries one exact resident skin target and its surrounding adaptation reach.
 * @evidence {@link Human.IPortraitSkinConstraint.vertex} Identifies the existing attachment point rather than appending another seam sample.
 * @evidence {@link Human.IPortraitSkinConstraint.target} Supplies absolute construction-space XYZ for the pinned skin sample.
 * @evidence {@link Human.IPortraitSkinConstraint.reach} Limits adaptation by distance travelled along connected skin edges.
 * @evidence {@link Human.selectHostFacesInsideLoop} Delegates anatomical-loop face selection to the engine's connectivity owner.
 * @evidence {@link Human.IPortraitRegionReplacement} Describes a reserved group and its later appender against the refined socket.
 * @evidence {@link Human.IPortraitRegionReplacement.group} Names the reserved face population inherited through subdivision.
 * @evidence {@link Human.IPortraitRegionReplacement.append} Installs a sampled source after the shared host has refined its socket.
 * @evidence {@link Human.applyPortraitRegionReplacements} Collects reserved boundaries before mutating an owned replacement mesh.
 * @evidence {@link Human.IPortraitFinalSurfaceHost} Exposes the common post-layer geometry seen by final component proposals.
 * @evidence {@link Human.IPortraitFinalSurfaceHost.positions} Supplies immutable construction-millimetre coordinates to final shaping.
 * @evidence {@link Human.IPortraitFinalSurfaceHost.indices} Retains shared triangle identities during positional proposals.
 * @evidence {@link Human.IPortraitFinalSurfaceHost.groups} Preserves per-triangle anatomical/material-region labels for target selection.
 * @evidence {@link Human.IPortraitFinalSurfaceHost.normals} Supplies directions computed on the common unmodified proposal basis.
 * @evidence {@link Human.IPortraitFinalSurface} Specifies a callback returning resident vertex targets rather than a detached mesh.
 * @evidence {@link Human.applyPortraitFinalSurfaces} Applies compatible final positions after every provider has observed the same basis.
 * @evidence {@link Human.IControlMesh.positions} Preserves construction-space vertex identities during shared refinement.
 * @evidence {@link Human.IControlMesh.indices} Carries oriented triangles over the common vertex population.
 * @evidence {@link Human.IControlMesh.groups} Retains each triangle's material-region ownership through subdivision.
 * @evidence {@link Human.createPortraitDirectionalIntersection} Intersects the foremost resident triangle from either side while preserving the original transverse projection; the canthal consumer uses its actual emitted surface.
 * @evidence {@link Human.createPortraitDirectionalContact} Resolves a contact target from resident triangles along a declared projection direction.
 * @evidence {@link Human.IPortraitSurfaceControl} Describes a named requested movement on the common refined surface.
 * @evidence {@link Human.IPortraitSurfaceControl.name} Names each anatomical handle and fixes deterministic elimination order.
 * @evidence {@link Human.IPortraitSurfaceControl.anchor} Supplies the retained host vertex from which a control is located.
 * @evidence {@link Human.IPortraitSurfaceControl.offset} Places an intermediate control relative to its live anatomical datum.
 * @evidence {@link Human.IPortraitSurfaceControl.displacement} Prescribes the combined XYZ movement at one control position.
 * @evidence {@link Human.createPortraitControlLayer} Solves coupled anatomical targets into fields consumed by the shared surface assembler.
 * @evidence {@link Human.IPortraitComponent} Separates an anatomical instance's identity, finishes and host-fitting operation.
 * @evidence {@link Human.IPortraitComponent.id} Names the fitting owner used to reject duplicate component instances.
 * @evidence {@link Human.IPortraitComponent.fit} Produces original-host constraints, cuts and the later attachment procedure.
 * @evidence {@link Human.IPortraitComponent.materials} Carries optional instance-owned finishes into the assembled palette.
 * @evidence {@link Human.IPortraitComponentHost} Carries the original geometry and recorded view ray into every fitted part.
 * @evidence {@link Human.IPortraitComponentHost.positions} Retains original skin identities and the non-skin gaze markers.
 * @evidence {@link Human.IPortraitComponentHost.indices} Establishes original triangle ordinals for component cuts.
 * @evidence {@link Human.IPortraitComponentHost.viewRay} Supplies the measured projection direction for ocular placement and optional nasal body depth.
 * @evidence {@link Human.IPortraitComponentPlan} Splits a fitted part into exact host requests and shared-topology attachment.
 * @evidence {@link Human.IPortraitComponentPlan.constraints} Defines the complete exact attachment requests collected before skin blending.
 * @evidence {@link Human.IPortraitComponentPlan.cutFaces} Identifies original faces replaced by component topology.
 * @evidence {@link Human.IPortraitComponentPlan.attach} Appends shared geometry and returns the actual final-surface consumers.
 * @evidence {@link Human.millimetrePoint} Supplies the common XYZ value used by the study's construction-space curves and component frames.
 * @evidence {@link Human.linearInterpolate} Interpolates scalar coordinates and dimensions within the authored surface sections.
 * @evidence {@link Human.intersectRayWithHeightField} Provides a bracketed camera-ray intersection for a caller-owned finite height surface.
 * @evidence {@link Human.areaWeightedNormals} Computes the shared skin/lining normal field before material regions are separated.
 * @evidence {@link Human.extractTriangleRegion} Extracts named material geometry while preserving the common field and original vertex identity.
 * @evidence {@link Human.createMetricMeshPart} Converts completed construction meshes into static metre-space AutoMovie parts.
 * @evidence {@link Human.triangulateSurfaceLattice} Produces the shared rectangular sampling lattice used by authored parametric surfaces.
 * @evidence {@link Human.catmullRomPoint} Interpolates ordered spatial landmarks for lid, dental and other study curves.
 * @evidence {@link Human.sweepEightSidedTube} Sweeps the coarse lash/brow strands in their construction frame.
 * @evidence {@link Human.placeMeshPreservingFaces} Protects each part's actual placement before its final precision conversion.
 * @evidence {@link Human.float32MeshBuffers} Materializes and validates the actual Float32/Uint32 geometry delivered to glTF.
 * @evidence {@link Human.gltfMaterialExtensions} Declares the optical extension classes registered on this study's GLTF readers and writers.
 * @evidence {@link Human.createGltfDocument} Converts the complete static study into resident GLTF material groups and attributes.
 * @evidence {@link Human.IControlMesh} Carries the shared triangular control positions, connectivity and one material label per face.
 * @evidence {@link Human.subdivideControlMesh} Refines the connected triangular cage before its shared normals and interiors are finalized.
 * @evidence {@link Human.assertPortraitSkinTopology} Audits the declared openings and stitches of the complete control cage before refinement.
 * @evidence {@link Human.blendPortraitSkin} Adapts neighbouring skin to exact component attachments on one unchanged host.
 * @evidence {@link Human.IPortraitReliefRegion} Separates each support's live vertex binding and offset from its metric support radii and signed displacement.
 * @evidence {@link Human.createPortraitReliefLayer} Converts owned anatomical support settings into engine deformation fields on the live skin.
 * @evidence {@link Human.IPortraitReliefCurvePoint} Declares one resident attachment, offset, support and displacement control for a continuous anatomical surface curve.
 * @evidence {@link Human.IPortraitReliefCurve} Groups ordered curve controls under one named surface responsibility.
 * @evidence {@link Human.createPortraitReliefCurveLayer} Samples adjacent controls into overlapping metric fields while preserving live endpoints and boundary ownership.
 * @evidence {@link Human.IPortraitSurfaceHost} Gives anatomical layers the shared post-subdivision coordinates, topology and normal field.
 * @evidence {@link Human.IPortraitSurfaceLayer} Separates a surface layer's identity from its derivation of metric engine fields on live attachments.
 * @evidence {@link Human.applyPortraitSurfaceLayers} Applies the composed surface displacement with open-rim protection before common normals and material extraction.
 * @evidence {@link Human.IPortraitHeadFormation} Carries the shared cranial, cervical, performance and colour preparation input.
 * @evidence {@link Human.IPortraitHeadFormation.cranium} Selects the reference cranial continuation during shared preparation.
 * @evidence {@link Human.IPortraitHeadFormation.neck} Selects the cervical continuation before final materialization.
 * @evidence {@link Human.IPortraitHeadFormation.performance} Separates current facial vertices from newly performed continuation tissue.
 * @evidence {@link Human.IPortraitHeadFormation.appearance} Pairs observed colour coordinates with current component geometry.
 * @evidence {@link Human.preparePortraitHead} Prepares shared skin and retains component finishers for the actual head consumer.
 * @evidence {@link Human.buildPortraitHead} Consumes prepared shared skin before contact sealing, common normals, material separation and attached interiors.
 * @evidence {@link Human.advancePoint} Steps a directional surface walk one sample along the recorded ray.
 * @evidence {@link Human.assertDirection} Refuses a degenerate placement direction before a static part is oriented for export.
 * @evidence {@link Human.buildPortraitCanthalMesh} Builds the canthal tissue that joins the lid margins at both corners.
 * @evidence {@link Human.buildPortraitEyeContactBasis} Combines the cornea and, when resident, the optical globe into the volume lid attachment is constrained against.
 * @evidence {@link Human.buildPortraitEyeCornea} Builds one closed corneal shell, used for drawing and for optical contact alike.
 * @evidence {@link Human.portraitDirectionalContactFrame} Fixes the frame a directional surface contact is measured in.
 * @evidence {@link Human.createPortraitCanthalIntersection} Intersects an emitted support from either side along the recorded camera ray.
 * @evidence {@link Human.createPortraitEyeSupport} Establishes one eye's fixed optical identity before any lid performance is applied.
 * @evidence {@link Human.createPortraitEyeSurfaceContact} Resolves the shared skin against this eye's actual optical volume.
 * @evidence {@link Human.createPortraitHairFibreTexture} Builds the hair texture both the colour and normal maps are generated from.
 * @evidence {@link Human.portraitFacialOvalVertices} Resolves the chin-relative cranial envelope the cranium and chin height are both measured against.
 * @evidence {@link Human.fitPortraitCanthalSphere} Fits the optical body independently of the canthal aperture width.
 * @evidence {@link Human.frontWeight} States how much of the tongue's forward shaping reaches a given station.
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
 */
export const portraitSurfaceReview = {
  scope: "surface construction inspection",
};

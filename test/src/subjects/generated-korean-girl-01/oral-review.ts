import type * as Human from "@automovie/human";

/**
 * Lips, oral enclosure, tongue, teeth and mandibular performance.
 * The frozen study root retains this domain through the native evidence graph.
 * Existing source inspections and historical capture limitations are preserved
 * verbatim. This carrier neither changes geometry nor accepts current likeness;
 * artifact observations and identities remain in review.md and the root record.
 *
 * @evidence {@link Human.IPortraitOralChamber} Inspects complete internal-room dimensions separately from the aperture and tooth placement.
 * @evidence {@link Human.IPortraitOralChamber.horizontalExpansion} Inspects the independent transverse half-extent increment.
 * @evidence {@link Human.IPortraitOralChamber.verticalExpansion} Inspects the independent vertical half-extent increment.
 * @evidence {@link Human.IPortraitOralChamber.transitionDepth} Inspects the vestibular depth controlling smooth expansion.
 * @evidence {@link Human.assertPortraitOralLining} Admits the selected enclosure dimensions.
 * @evidence {@link Human.tracePortraitOralBoundary} Inspects the seeded actual skin attachment consumed by the lining.
 * @evidence {@link Human.buildPortraitOralLining} Joins a cavity to the final lip boundary.
 * @evidence {@link Human.IPortraitOralAttachment} Defines one shared interior attachment.
 * @evidence {@link Human.IPortraitOralAttachment.rightCorner} Supplies the anatomical right endpoint.
 * @evidence {@link Human.IPortraitOralAttachment.leftCorner} Supplies the anatomical left endpoint.
 * @evidence {@link Human.IPortraitOralAttachment.origin} Supplies the independent oral anchor.
 * @evidence {@link Human.IPortraitOralAttachment.up} Defines superior orientation independently.
 * @evidence {@link Human.IPortraitOralAttachment.lift} Places the interior along superior Y.
 * @evidence {@link Human.IPortraitOralAttachment.recess} Places the interior posteriorly.
 * @evidence {@link Human.attachPortraitOralMesh} Shares dental and lingual placement arithmetic.
 * @evidence {@link Human.IPortraitTongueShape} Owns optional lingual dimensions and finish.
 * @evidence {@link Human.IPortraitTongueShape.halfWidth} Controls transverse body extent.
 * @evidence {@link Human.IPortraitTongueShape.length} Controls posterior body extent.
 * @evidence {@link Human.IPortraitTongueShape.halfThickness} Controls both vertical half-sections.
 * @evidence {@link Human.IPortraitTongueShape.dorsumRise} Stores the observed centreline rise.
 * @evidence {@link Human.IPortraitTongueShape.grooveDepth} Controls upper median depression.
 * @evidence {@link Human.IPortraitTongueShape.grooveWidth} Sets the Gaussian transverse scale.
 * @evidence {@link Human.IPortraitTongueShape.drop} Sets inferior observed placement.
 * @evidence {@link Human.IPortraitTongueShape.recess} Sets posterior observed placement.
 * @evidence {@link Human.IPortraitTongueShape.material} Selects an existing lingual finish.
 * @evidence {@link Human.portraitTongueParameters} Shares tongue shape editing envelopes.
 * @evidence {@link Human.assertPortraitTongueShape} Admits the complete lingual profile.
 * @evidence {@link Human.buildPortraitTongue} Builds the closed local lingual surface.
 * @evidence {@link Human.createPortraitTongueComponent} Connects lingual shape to the real face component protocol.
 * @evidence {@link Human.portraitJawSkinWeight} Shares the observed oral-band attachment field.
 * @evidence {@link Human.createPortraitJawContinuation} Connects mandibular motion to reference-formed head and neck.
 * @evidence {@link Human.IPortraitMouthPerformance} Records observed/current separation, mandibular angles and optional commissure/protrusion changes.
 * @evidence {@link Human.createPortraitMandibularDentition} Attaches independently authored lower crowns to the observed jaw and moves the intact row.
 * @evidence {@link Human.createPortraitMouthPerformance} Poses the actual paired oral margins while retaining the surrounding vermilion volume.
 * @evidence {@link Human.posePortraitJawPoint} Applies one bounded weighted mandibular rotation about the authored transverse hinge.
 * @evidence {@link Human.IPortraitDentalSideContour} Supplies optional mesial/distal detail within one crown's basic profile.
 * @evidence {@link Human.IPortraitDentalSideContour.contactHeight} Locates the proximal breadth crest along the normalized loft height.
 * @evidence {@link Human.IPortraitDentalSideContour.cervicalWidth} Overrides one side's cervical-to-maximum half-width ratio.
 * @evidence {@link Human.IPortraitDentalSideContour.incisalRise} Overrides one proximal cutting-edge corner's rise from the central edge.
 * @evidence {@link Human.applyPortraitOralContact} Resolves one optional named lip/enamel/cavity relationship on assembled head parts.
 * @evidence {@link Human.fitPortraitOralContact} Places the rigid enamel group behind its lip and then fits the cavity behind that placed group.
 * @evidence {@link Human.IPortraitMouthSocket} Binds the oral opening and surrounding vermilion to subject-owned vertex identities.
 * @evidence {@link Human.IPortraitMouthSocket.outer} Defines the cutaneous-vermilion boundary shared with surrounding skin.
 * @evidence {@link Human.IPortraitMouthSocket.upper} Supplies the upper inner lip in increasing head-X order.
 * @evidence {@link Human.IPortraitMouthSocket.lower} Supplies the lower inner lip in the same longitudinal direction.
 * @evidence {@link Human.IPortraitMouthSocket.lipSeed} Identifies the connected vermilion region for material assignment.
 * @evidence {@link Human.IPortraitMouthShape} Declares lip fitting and the separate legacy cavity/crown settings.
 * @evidence {@link Human.IPortraitMouthShape.widthScale} Scales band and opening X positions about the measured oral midpoint.
 * @evidence {@link Human.IPortraitMouthShape.openingScale} Scales fitted Y positions about the measured inner opening centre.
 * @evidence {@link Human.IPortraitMouthShape.cornerLift} Applies a signed smile-corner Y adjustment with a quadratic lateral weight.
 * @evidence {@link Human.IPortraitMouthShape.upperLipProjection} Adds the basic upper-band Z projection.
 * @evidence {@link Human.IPortraitMouthShape.lowerLipProjection} Adds basic lower-band projection independently of the upper value.
 * @evidence {@link Human.IPortraitMouthShape.section} Supplies optional body, tubercle and pad relief inside the retained lip bands.
 * @evidence {@link Human.IPortraitMouthShape.band} Selects independent scalar or knot-array thickness ratios for the two curved bands.
 * @evidence {@link Human.IPortraitMouthShape.blendReach} Limits original-skin adaptation around the fitted lip targets.
 * @evidence {@link Human.IPortraitMouthShape.cavityDepth} Recesses the cavity behind the actual refined oral opening.
 * @evidence {@link Human.IPortraitMouthShape.dentalOffset} Shifts the legacy crown row along the sampled dental arch.
 * @evidence {@link Human.IPortraitMouthShape.dentalRecess} Moves legacy crown placement posterior to the sampled upper-lip guide.
 * @evidence {@link Human.IPortraitMouthShape.dentalDrop} Places legacy crowns below their sampled arch Y coordinate.
 * @evidence {@link Human.IPortraitMouthShape.dentalDepth} Supplies the common local half-depth of legacy crowns.
 * @evidence {@link Human.IPortraitMouthShape.toothGap} Adds longitudinal clearance between legacy crown widths.
 * @evidence {@link Human.IPortraitMouthShape.crowns} Supplies owned individual enamel profiles for the optional legacy row.
 * @evidence {@link Human.buildPortraitMouth} Builds the recessed cavity and, when requested, the legacy upper crowns from final lip curves.
 * @evidence {@link Human.IPortraitMouthShape.borderRefinement} Selects the outer vermilion's surface or independent closed-curve refinement rule.
 * @evidence {@link Human.createPortraitMouthComponent} Fits the curved lip bands and declares their shared skin border, oral opening and interior finisher.
 * @evidence {@link Human.portraitLipTriangles} Selects the connected lip band bounded by the two authored anatomical loops.
 * @evidence {@link Human.IPortraitLipBandKnot} Defines one thickness-ratio witness along the curved oral span.
 * @evidence {@link Human.IPortraitLipBandKnot.at} Locates a thickness witness from anatomical right to left.
 * @evidence {@link Human.IPortraitLipBandKnot.scale} Sets a positive local ratio of vertical vermilion thickness.
 * @evidence {@link Human.createPortraitLipBandSampler} Supplies normalized lip coordinates and their authoritative inner/outer heights together.
 * @evidence {@link Human.createPortraitLipBandScale} Resolves omitted, scalar or ordered optional band profiles for mouth fitting.
 * @evidence {@link Human.IPortraitDentalCrown} Separates enamel width, height, half-depth, cervical narrowing and cutting-edge rise from arch placement.
 * @evidence {@link Human.assertPortraitDentalCrown} Admits usable enamel profiles before their width influences arch clearance.
 * @evidence {@link Human.buildPortraitDentalCrown} Builds each closed local crown before the row arranges it along one arch.
 * @evidence {@link Human.IPortraitDentalArc} Exposes physical horizontal arc distance and tangent to the dental-row arrangement.
 * @evidence {@link Human.createPortraitDentalArc} Samples the supplied dental guide by cumulative XZ distance rather than projected width or spline progress.
 * @evidence {@link Human.IPortraitDentalRow} Supplies one local arch and its ordered crown profiles to the grouped dentition builder.
 * @evidence {@link Human.IPortraitDentalAttachment} Defines the complete row's oral datum, orientation guides and metric offsets.
 * @evidence {@link Human.attachPortraitDentalRow} Places every crown vertex and normal through one orthonormal oral frame.
 * @evidence {@link Human.IPortraitLipSection} Gives upper body/tubercle and lower body/pads independent signed relief controls.
 * @evidence {@link Human.IPortraitLipCoordinate} Locates a sample inside one curved vermilion band without subject-specific vertex identities.
 * @evidence {@link Human.createPortraitLipSection} Evaluates owned vermilion relief with exactly zero contribution at both band edges and corners.
 * @evidence {@link Human.createPortraitLipCoordinates} Binds outer and inner lip curves to the section's normalized coordinates.
 * @evidence {@link Human.buildPortraitDentalRow} Composes the owned crowns on a nominal arch and separates their complete proximal surfaces before merging the group.
 * @evidence {@link Human.createPortraitDentalComponent} Attaches the complete dental row to live refined oral anchors without cutting or deforming skin.
 * @evidence {@link Human.IPortraitInterior} Inspects the owned pre-packing anatomical descriptor.
 * @evidence {@link Human.IPortraitInterior.id} Carries the existing part identity through preparation.
 * @evidence {@link Human.IPortraitInterior.material} Carries the resident palette identity.
 * @evidence {@link Human.IPortraitInterior.mesh} Retains native geometry before the metric boundary.
 * @evidence {@link Human.createPortraitInteriorFinisher} Shares one producer between native and direct compatibility consumers.
 * @evidence {@link Human.preparePortraitMouth} Inspects the native cavity and legacy crown producer used by the actual mouth component.
 * @evidence {@link Human.assertPortraitInteriorBindings} Admits the declared native identities in the actual head path.
 * @evidence {@link Human.preparePortraitDentalCrown} Owns enamel construction and its cervical attachment cycle together.
 * @evidence {@link Human.preparePortraitDentalRow} Carries crown-owned identities through the actual row merge.
 * @evidence {@link Human.preparePortraitOralLining} Retains the traced skin IDs beside the native oral mesh.
 * @evidence {@link Human.IPortraitInterior.loops} Declares named directed anatomical cycles in native vertex space.
 * @evidence {@link Human.IPortraitInterior.attachments} Declares explicit skin or interior correspondences.
 * @evidence {@link Human.separatePortraitDentalCrowns} Shifts ordered crowns along X until their complete proximal surfaces stop overlapping.
 * @evidence {@link Human.resolvePortraitDentalCrown} Completes an omitted cervical ratio and edge rise with the basic crown profile in one place.
 * @evidence {@link Human.portraitTongueColumns} States how many samples go round each lingual ring, read by the builder and the station function.
 * @evidence {@link Human.portraitTongueStation} Reads the builder's vertex layout as a station from tip to root for the jaw weighting.
 * @evidence {@link Human.portraitTongueWidthEnvelope} Gives the tongue a rounded plan outline as an ellipse of the station.
 */
export const portraitOralReview = { scope: "oral construction inspection" };

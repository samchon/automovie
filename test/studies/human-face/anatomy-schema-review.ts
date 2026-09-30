import type * as Human from "@automovie/human";

/**
 * Anatomical schema inspections retained from the complete face source review.
 * This carrier groups anatomical parameter types by their source ownership and
 * preserves the prior observations and their limits. It is not a new anatomical
 * or likeness acceptance of the current connected population.
 * @evidence {@link Human.IPortraitNasalEnvelopeSection} Inspected the five fields and constructor admission: phase is original edge-ordinal progress, width/crest are millimetres, crestPosition is interior to the width, and roll is a signed section-plane angle. This is an authored surface section, not a measured cartilage cross-section.
 * @evidence {@link Human.IPortraitNasalEnvelopeSection.at} Inspected zero-origin strictly increasing unit phases, cyclic wrap and original/refined seed ordering. This parameter is not physical arc length.
 * @evidence {@link Human.IPortraitNasalEnvelopeSection.width} Inspected finite positive admission, non-overshooting station interpolation and the actual outward attachment displacement. A too-small representable displacement refuses.
 * @evidence {@link Human.IPortraitNasalEnvelopeSection.crest} Inspected signed finite relief along the aperture section normal and the shared Hermite crest jet. Zero and negative values remain authored geometric choices.
 * @evidence {@link Human.IPortraitNasalEnvelopeSection.crestPosition} Inspected strict zero/one boundaries and its split of the physical width between the two exterior Hermite intervals.
 * @evidence {@link Human.IPortraitNasalEnvelopeSection.roll} Inspected finite signed degrees, full-turn reduction and the orthonormal cavity-axis aperture frame. Exterior skin normals own attachment, not the rolled rim; the exterior end and vestibular beginning use the same reversed jet.
 * @evidence {@link Human.IPortraitNasalEnvelope} Inspected the complete cyclic profile, separate tessellation control, positive bounded interpolation and array ownership. A profile adds expression space without accepting likeness or certifying tissue clearance.
 * @evidence {@link Human.IPortraitNasalEnvelope.sections} Inspected copied nonempty ordered stations, single-station uniform behavior, periodic last-to-first interpolation and complete-array document replacement.
 * @evidence {@link Human.IPortraitNasalEnvelope.segments} Inspected integer 2..64 admission and actual exterior/vestibular row sampling. The limit is a tessellation budget, not an anatomical range.
 * @evidence {@link Human.IPortraitSkinColourRegion} Inspects all six fields against reference binding, finite admission and the document consumer.
 * @evidence {@link Human.IPortraitOralChamber} Inspects complete internal-room dimensions separately from the aperture and tooth placement.
 * @evidence {@link Human.IPortraitOralChamber.horizontalExpansion} Inspects the independent transverse half-extent increment.
 * @evidence {@link Human.IPortraitOralChamber.verticalExpansion} Inspects the independent vertical half-extent increment.
 * @evidence {@link Human.IPortraitOralChamber.transitionDepth} Inspects the vestibular depth controlling smooth expansion.
 * @evidence {@link Human.IPortraitOralAttachment} Defines one shared interior attachment.
 * @evidence {@link Human.IPortraitOralAttachment.rightCorner} Supplies the anatomical right endpoint.
 * @evidence {@link Human.IPortraitOralAttachment.leftCorner} Supplies the anatomical left endpoint.
 * @evidence {@link Human.IPortraitOralAttachment.origin} Supplies the independent oral anchor.
 * @evidence {@link Human.IPortraitOralAttachment.up} Defines superior orientation independently.
 * @evidence {@link Human.IPortraitOralAttachment.lift} Places the interior along superior Y.
 * @evidence {@link Human.IPortraitOralAttachment.recess} Places the interior posteriorly.
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
 * @evidence {@link Human.IPortraitHeadPerformance} Separates reference continuation from resident performed components.
 * @evidence {@link Human.IPortraitHeadPerformance.reference} Provides reference coordinates for continuation formation.
 * @evidence {@link Human.IPortraitHeadPerformance.pose} Moves newly appended reference tissue before common refinement.
 * @evidence {@link Human.IPortraitSkinShape} Carries separately authored resting condition and expression crease strength.
 * @evidence {@link Human.IPortraitHairCard} Names a caller-authored numerical surface lock.
 * @evidence {@link Human.IPortraitHairShape} Separates card geometry, painted fibres and material ownership.
 * @evidence {@link Human.IPortraitHairLayer} Owns additional named static guide and finish profiles independently of the legacy groom.
 * @evidence {@link Human.IPortraitHeadFormation} Carries the shared cranial, cervical, performance and colour preparation input.
 * @evidence {@link Human.IPortraitHeadFormation.cranium} Selects the reference cranial continuation during shared preparation.
 * @evidence {@link Human.IPortraitHeadFormation.neck} Selects the cervical continuation before final materialization.
 * @evidence {@link Human.IPortraitHeadFormation.performance} Separates current facial vertices from newly performed continuation tissue.
 * @evidence {@link Human.IPortraitHeadFormation.appearance} Pairs observed colour coordinates with current component geometry.
 * @evidence {@link Human.IPortraitAegyoSalShape} Groups the optional pretarsal roll's crest, shoulder and longitudinal weights under one eye-owned surface responsibility.
 * @evidence {@link Human.IPortraitCheekShape} Groups four support envelopes and a separately controlled nasolabial fold.
 * @evidence {@link Human.IPortraitCheekSocket} Names the live skin attachments for one side's four cheek envelopes and fold path.
 * @evidence {@link Human.IPortraitCheekVolume} Separates support placement and extent from signed surface movement.
 * @evidence {@link Human.IPortraitCranialStation} Describes one sagittal section of the superior, inferior and transverse cranial envelopes.
 * @evidence {@link Human.IPortraitCraniumShape} Carries whole-station replacement, posterior cap depth and independent transition correspondence.
 * @evidence {@link Human.IPortraitDentalArc} Exposes physical horizontal arc distance and tangent to the dental-row arrangement.
 * @evidence {@link Human.IPortraitDentalAttachment} Defines the complete row's oral datum, orientation guides and metric offsets.
 * @evidence {@link Human.IPortraitDentalCrown} Separates enamel width, height, half-depth, cervical narrowing and cutting-edge rise from arch placement.
 * @evidence {@link Human.IPortraitDentalRow} Supplies one local arch and its ordered crown profiles to the grouped dentition builder.
 * @evidence {@link Human.IPortraitDentalSideContour} Supplies optional mesial/distal detail within one crown's basic profile.
 * @evidence {@link Human.IPortraitEarShape} Groups the resident ear datum, scale, projection and embedding controls.
 * @evidence {@link Human.IPortraitFacialFrameShape} Names the common-host facial proportions and anatomical support displacements.
 * @evidence {@link Human.IPortraitLipBandKnot} Defines one thickness-ratio witness along the curved oral span.
 * @evidence {@link Human.IPortraitLipCoordinate} Locates a sample inside one curved vermilion band without subject-specific vertex identities.
 * @evidence {@link Human.IPortraitLipSection} Gives upper body/tubercle and lower body/pads independent signed relief controls.
 * @evidence {@link Human.IPortraitMouthPerformance} Records observed/current separation, mandibular angles and optional commissure/protrusion changes.
 * @evidence {@link Human.IPortraitMouthShape} Declares lip fitting and the separate legacy cavity/crown settings.
 * @evidence {@link Human.IPortraitMouthSocket} Binds the oral opening and surrounding vermilion to subject-owned vertex identities.
 * @evidence {@link Human.IPortraitNasalApertureFrame} Groups the origin and inward axis of one fitted nasal aperture plane.
 * @evidence {@link Human.IPortraitNasalBodyShape} Groups the ordered lower-nasal stations and independent midline, shoulder, alar and crease controls.
 * @evidence {@link Human.IPortraitNasalBodyStation} Defines one ordered lower-nasal station and its midline, shoulder and alar extents.
 * @evidence {@link Human.IPortraitNasalJet} Groups one sampled nasal-section point and its derivative.
 * @evidence {@link Human.IPortraitNasalLobule} Declares a resident datum, apex offset, three physical radii and normalized inner section extent for each local nasal body.
 * @evidence {@link Human.IPortraitNasalRimJet} Groups one nasal rim point with its tangent and transverse directions.
 * @evidence {@link Human.IPortraitNasalRimSection} Separates exterior tissue width from the fitted aperture and its crest relief.
 * @evidence {@link Human.IPortraitNasalSection} Groups transverse poles, station rows and bounded identity-transition controls.
 * @evidence {@link Human.IPortraitNasalSectionStation} Defines one transverse depth-control row of the optional nasal loft.
 * @evidence {@link Human.IPortraitNeckSection} Describes one cross-section of the authored neck continuation.
 * @evidence {@link Human.IPortraitNeckShape} Groups upper/lower neck sections and the crop policy for the cranial continuation.
 * @evidence {@link Human.IPortraitNoseShape} Separates exterior, opening, lining and optional complete-basis controls.
 * @evidence {@link Human.IPortraitNoseSocket} Binds procedural nasal controls and original opening faces to the measured host.
 * @evidence {@link Human.IPortraitSkinConstraint} Carries one exact resident skin target and its surrounding adaptation reach.
 */
export const humanFaceAnatomySchemaReview = true;

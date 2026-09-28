import type * as Human from "@automovie/human";

/**
 * Anatomical schema inspections retained from the complete face source review.
 * This carrier groups anatomical parameter types by their source ownership and
 * preserves the prior observations and their limits. It is not a new anatomical
 * or likeness acceptance of the current connected population.
 * @evidence {@link Human.IPortraitNasalEnvelopeSection} Inspected the five fields and constructor admission: phase is original edge-ordinal progress, width/crest are millimetres, crestPosition is interior to the width, and roll is a signed section-plane angle. This is an authored surface section, not a measured cartilage cross-section.
 * @evidenceReview {@link Human.IPortraitNasalEnvelopeSection} #a084689 Inspected the five fields and constructor admission: phase is original edge-ordinal progress, width/crest are millimetres, crestPosition is interior to the width, and roll is a signed section-plane angle. This is an authored surface section, not a measured cartilage cross-section.
 * @evidence {@link Human.IPortraitNasalEnvelopeSection.at} Inspected zero-origin strictly increasing unit phases, cyclic wrap and original/refined seed ordering. This parameter is not physical arc length.
 * @evidenceReview {@link Human.IPortraitNasalEnvelopeSection.at} #24d3d45 Inspected zero-origin strictly increasing unit phases, cyclic wrap and original/refined seed ordering. This parameter is not physical arc length.
 * @evidence {@link Human.IPortraitNasalEnvelopeSection.width} Inspected finite positive admission, non-overshooting station interpolation and the actual outward attachment displacement. A too-small representable displacement refuses.
 * @evidenceReview {@link Human.IPortraitNasalEnvelopeSection.width} #79c800e Inspected finite positive admission, non-overshooting station interpolation and the actual outward attachment displacement. A too-small representable displacement refuses.
 * @evidence {@link Human.IPortraitNasalEnvelopeSection.crest} Inspected signed finite relief along the aperture section normal and the shared Hermite crest jet. Zero and negative values remain authored geometric choices.
 * @evidenceReview {@link Human.IPortraitNasalEnvelopeSection.crest} #03d72d3 Inspected signed finite relief along the aperture section normal and the shared Hermite crest jet. Zero and negative values remain authored geometric choices.
 * @evidence {@link Human.IPortraitNasalEnvelopeSection.crestPosition} Inspected strict zero/one boundaries and its split of the physical width between the two exterior Hermite intervals.
 * @evidenceReview {@link Human.IPortraitNasalEnvelopeSection.crestPosition} #83250d2 Inspected strict zero/one boundaries and its split of the physical width between the two exterior Hermite intervals.
 * @evidence {@link Human.IPortraitNasalEnvelopeSection.roll} Inspected finite signed degrees, full-turn reduction and the orthonormal cavity-axis aperture frame. Exterior skin normals own attachment, not the rolled rim; the exterior end and vestibular beginning use the same reversed jet.
 * @evidenceReview {@link Human.IPortraitNasalEnvelopeSection.roll} #0aa23e1 Inspected finite signed degrees, full-turn reduction and the orthonormal cavity-axis aperture frame. Exterior skin normals own attachment, not the rolled rim; the exterior end and vestibular beginning use the same reversed jet.
 * @evidence {@link Human.IPortraitNasalEnvelope} Inspected the complete cyclic profile, separate tessellation control, positive bounded interpolation and array ownership. A profile adds expression space without accepting likeness or certifying tissue clearance.
 * @evidenceReview {@link Human.IPortraitNasalEnvelope} #aa8d844 Inspected the complete cyclic profile, separate tessellation control, positive bounded interpolation and array ownership. A profile adds expression space without accepting likeness or certifying tissue clearance.
 * @evidence {@link Human.IPortraitNasalEnvelope.sections} Inspected copied nonempty ordered stations, single-station uniform behavior, periodic last-to-first interpolation and complete-array document replacement.
 * @evidenceReview {@link Human.IPortraitNasalEnvelope.sections} #b1e2d44 Inspected copied nonempty ordered stations, single-station uniform behavior, periodic last-to-first interpolation and complete-array document replacement.
 * @evidence {@link Human.IPortraitNasalEnvelope.segments} Inspected integer 2..64 admission and actual exterior/vestibular row sampling. The limit is a tessellation budget, not an anatomical range.
 * @evidenceReview {@link Human.IPortraitNasalEnvelope.segments} #12d69b2 Inspected integer 2..64 admission and actual exterior/vestibular row sampling. The limit is a tessellation budget, not an anatomical range.
 * @evidence {@link Human.IPortraitSkinColourRegion} Inspects all six fields against reference binding, finite admission and the document consumer.
 * @evidenceReview {@link Human.IPortraitSkinColourRegion} #08e7c87 Read the six fields and their constructor admission: a unique nonblank name, resident anchor, finite millimetre offset, positive support radii, bounded linear RGB attenuation and strength. It is numerical authoring data, not a biological pigment estimate or a photograph texture.
 * @evidence {@link Human.IPortraitOralChamber} Inspects complete internal-room dimensions separately from the aperture and tooth placement.
 * @evidenceReview {@link Human.IPortraitOralChamber} #34f99a3 Read the three millimetre fields and their actual lining and mouth consumers; they are authored enclosure dimensions, not measured hidden tissue.
 * @evidence {@link Human.IPortraitOralChamber.horizontalExpansion} Inspects the independent transverse half-extent increment.
 * @evidenceReview {@link Human.IPortraitOralChamber.horizontalExpansion} #3b48034 Read finite nonnegative admission and its normalized head-X contribution behind the unchanged lip rim.
 * @evidence {@link Human.IPortraitOralChamber.verticalExpansion} Inspects the independent vertical half-extent increment.
 * @evidenceReview {@link Human.IPortraitOralChamber.verticalExpansion} #2a0bda8 Read finite nonnegative admission and its normalized head-Y contribution, with no lip opening or tooth translation.
 * @evidence {@link Human.IPortraitOralChamber.transitionDepth} Inspects the vestibular depth controlling smooth expansion.
 * @evidenceReview {@link Human.IPortraitOralChamber.transitionDepth} #835bfe2 Read positive finite admission and the clamped depth ratio used by cubic smoothstep, independent of the posterior taper and cavity depth.
 * @evidence {@link Human.IPortraitOralAttachment} Defines one shared interior attachment.
 * @evidenceReview {@link Human.IPortraitOralAttachment} #d232196 Read the chord, independent up guide, origin and signed millimetre offsets. The frame orients complete interiors and never scales their local dimensions.
 * @evidence {@link Human.IPortraitOralAttachment.rightCorner} Supplies the anatomical right endpoint.
 * @evidenceReview {@link Human.IPortraitOralAttachment.rightCorner} #a170bb2 Read its role as the origin of the right-to-left transverse chord. It is not a tooth or tongue vertex placement.
 * @evidence {@link Human.IPortraitOralAttachment.leftCorner} Supplies the anatomical left endpoint.
 * @evidenceReview {@link Human.IPortraitOralAttachment.leftCorner} #c8d2fcd Read the subtraction from rightCorner and the zero-length refusal. Positive X remains anatomical left.
 * @evidence {@link Human.IPortraitOralAttachment.origin} Supplies the independent oral anchor.
 * @evidenceReview {@link Human.IPortraitOralAttachment.origin} #a16ea94 Read the single lift/recess translation. Dental callers supply the upper lip; the tongue supplies the observed lower midpoint.
 * @evidence {@link Human.IPortraitOralAttachment.up} Defines superior orientation independently.
 * @evidenceReview {@link Human.IPortraitOralAttachment.up} #5a0eae3 Read removal of its chord projection and the degenerate independent-axis refusal before the shared transform.
 * @evidence {@link Human.IPortraitOralAttachment.lift} Places the interior along superior Y.
 * @evidenceReview {@link Human.IPortraitOralAttachment.lift} #0001cae Read signed translation after orthogonalization. The tongue uses negative drop, while the dental adapter retains its original signed lift.
 * @evidence {@link Human.IPortraitOralAttachment.recess} Places the interior posteriorly.
 * @evidenceReview {@link Human.IPortraitOralAttachment.recess} #e830871 Read subtraction along X cross Y. This is rigid placement and does not change the cavity wall or guarantee tissue clearance.
 * @evidence {@link Human.IPortraitTongueShape} Owns optional lingual dimensions and finish.
 * @evidenceReview {@link Human.IPortraitTongueShape} #a4272a4 Read every required dimension and the independent observed oral placement. Omission does not invent a body; the complete selected profile requires a hinge in document resolution.
 * @evidence {@link Human.IPortraitTongueShape.halfWidth} Controls transverse body extent.
 * @evidenceReview {@link Human.IPortraitTongueShape.halfWidth} #1aa4e73 Read the sine envelope multiplying the transverse cosine. Endpoints remain fixed and it does not resize teeth.
 * @evidence {@link Human.IPortraitTongueShape.length} Controls posterior body extent.
 * @evidenceReview {@link Human.IPortraitTongueShape.length} #76cc93a Read negative longitudinal progress and the separate retraction-monotonicity guard. This length is an authoring value, not a recovered anatomical measurement.
 * @evidence {@link Human.IPortraitTongueShape.halfThickness} Controls both vertical half-sections.
 * @evidenceReview {@link Human.IPortraitTongueShape.halfThickness} #810b921 Read the radial sine term before centreline elevation and the strict groove-depth comparison.
 * @evidence {@link Human.IPortraitTongueShape.dorsumRise} Stores the observed centreline rise.
 * @evidenceReview {@link Human.IPortraitTongueShape.dorsumRise} #516ed31 Read its sine-squared envelope and observed-relative performance addition. It changes neither endpoint.
 * @evidence {@link Human.IPortraitTongueShape.grooveDepth} Controls upper median depression.
 * @evidenceReview {@link Human.IPortraitTongueShape.grooveDepth} #0930e33 Read the Gaussian transverse field multiplied by nonnegative radial sine. The inferior surface receives no groove depression.
 * @evidence {@link Human.IPortraitTongueShape.grooveWidth} Sets the Gaussian transverse scale.
 * @evidenceReview {@link Human.IPortraitTongueShape.grooveWidth} #664f265 Read division of X by this strictly positive scale before squaring; increasing spreads depression without changing its central amplitude.
 * @evidence {@link Human.IPortraitTongueShape.drop} Sets inferior observed placement.
 * @evidenceReview {@link Human.IPortraitTongueShape.drop} #b44d5ab Read negative lift in the shared oral frame. Jaw motion acts afterward, and lip performance cannot translate this captured body.
 * @evidence {@link Human.IPortraitTongueShape.recess} Sets posterior observed placement.
 * @evidenceReview {@link Human.IPortraitTongueShape.recess} #4b1b661 Read its use in the shared frame before weighted mandibular motion. The cavity wall remains an independently authored surface.
 * @evidence {@link Human.IPortraitTongueShape.material} Selects an existing lingual finish.
 * @evidenceReview {@link Human.IPortraitTongueShape.material} #efa56e4 Read the nonempty identity check and unchanged propagation to the resident part. It adds no implicit palette entry; complete model validation still requires that finish.
 * @evidence {@link Human.IPortraitHeadPerformance} Separates reference continuation from resident performed components.
 * @evidenceReview {@link Human.IPortraitHeadPerformance} #70fcd9a Read both callbacks and their assembler consumer. Only appended cranium and neck vertices receive the pose; shared facial IDs remain current. This protocol alone promises no anatomical realism.
 * @evidence {@link Human.IPortraitHeadPerformance.reference} Provides reference coordinates for continuation formation.
 * @evidenceReview {@link Human.IPortraitHeadPerformance.reference} #3052bea Read the copied-point and vertex-ID invocation before cranial construction. Finite XYZ is checked and resident performed coordinates are not replaced by the returned reference.
 * @evidence {@link Human.IPortraitHeadPerformance.pose} Moves newly appended reference tissue before common refinement.
 * @evidenceReview {@link Human.IPortraitHeadPerformance.pose} #ff6d472 Read the appended-vertex loop and finite result copying before topology, subdivision and normals. Existing oral and facial vertices are not passed through this callback.
 * @evidence {@link Human.IPortraitSkinShape} Carries separately authored resting condition and expression crease strength.
 * @evidenceReview {@link Human.IPortraitSkinShape} #5ac437c Read the partial scalar record and every metadata default. Bilateral visible condition and expression strength are independently authored; omission is zero condition and does not estimate biological age. Geometry admission and direct render inspection remain separate.
 * @evidence {@link Human.IPortraitHairCard} Names a caller-authored numerical surface lock.
 * @evidenceReview {@link Human.IPortraitHairCard} #16495c6 Read 2..32 root-to-tip XYZ stations, paired transverse directions and positive width. Head-millimetre attachment guides are authored rather than recovered from a photograph; the consumer refuses incomplete and collapsed frames.
 * @evidence {@link Human.IPortraitHairShape} Separates card geometry, painted fibres and material ownership.
 * @evidenceReview {@link Human.IPortraitHairShape} #e3f572a Read the complete shape and its geometry/material consumers. Optional fibreShadeStrength controls encoded RGB modulation independently of coverage, normal relief and card sampling; omission or one retains the original texture. It is not a biological pigment concentration.
 * @evidence {@link Human.IPortraitHairLayer} Owns additional named static guide and finish profiles independently of the legacy groom.
 * @evidenceReview {@link Human.IPortraitHairLayer} #e02466d Read the complete type and groom consumer. Each layer owns a complete profile and nonblank identity; this is static numerical authoring, not a subject catalogue or strand simulation.
 * @evidence {@link Human.IPortraitHeadFormation} Carries the shared cranial, cervical, performance and colour preparation input.
 * @evidenceReview {@link Human.IPortraitHeadFormation} #bcc0744 Read all four optional fields and both assembly consumers. The extracted input retains existing defaults; its appearance basis is material coordinates rather than physical rest geometry.
 * @evidence {@link Human.IPortraitHeadFormation.cranium} Selects the reference cranial continuation during shared preparation.
 * @evidenceReview {@link Human.IPortraitHeadFormation.cranium} #484d37f Traced the unchanged optional profile to appendPortraitCranium for current and paired-reference cages before refinement.
 * @evidence {@link Human.IPortraitHeadFormation.neck} Selects the cervical continuation before final materialization.
 * @evidenceReview {@link Human.IPortraitHeadFormation.neck} #c427894 Traced the same optional neck profile to both paired assemblies; its existing ordering and finite-value admission remain in appendPortraitNeck.
 * @evidence {@link Human.IPortraitHeadFormation.performance} Separates current facial vertices from newly performed continuation tissue.
 * @evidenceReview {@link Human.IPortraitHeadFormation.performance} #959d621 Read copied reference construction and the appended-only pose loop. Existing component IDs retain their performed positions and invalid callback coordinates still refuse.
 * @evidence {@link Human.IPortraitHeadFormation.appearance} Pairs observed colour coordinates with current component geometry.
 * @evidenceReview {@link Human.IPortraitHeadFormation.appearance} #255115d Read component order, topology, region, curve and replacement correspondence checks plus finite linear RGB admission. Current final proposals do not replace reference coordinates.
 * @evidence {@link Human.IPortraitAegyoSalShape} Groups the optional pretarsal roll's crest, shoulder and longitudinal weights under one eye-owned surface responsibility.
 * @evidenceReview {@link Human.IPortraitAegyoSalShape} #73d926b Read the copied optional object and its finite dimensions beside the lower-row replacement branch; omission retains the eyelid-only path and supplied values are not a detached overlay.
 * @evidence {@link Human.IPortraitCheekShape} Groups four support envelopes and a separately controlled nasolabial fold.
 * @evidenceReview {@link Human.IPortraitCheekShape} #9111264 Read the four named support volumes and independent fold radius/projection/depth against the copied layer factory. Their summed surface envelopes remain separate controls; their anatomical names do not imply recovered fat-compartment volume.
 * @evidence {@link Human.IPortraitCheekSocket} Names the live skin attachments for one side's four cheek envelopes and fold path.
 * @evidenceReview {@link Human.IPortraitCheekSocket} #25f27ab Read the six bindings with constructor and fields(host) admission. The layer copies the socket but resolves positions on each supplied refined host, so a changed mouth or nose can move an attachment without an independently frozen cheek origin.
 * @evidence {@link Human.IPortraitCheekVolume} Separates support placement and extent from signed surface movement.
 * @evidenceReview {@link Human.IPortraitCheekVolume} #6152713 Compared offset and three radii with projection/lift in the field emitter. Both amplitudes zero omit the envelope, but the constructor still validates its declared dimensions. The type describes one axis-aligned deformation envelope, not a reconstructed fat compartment.
 * @evidence {@link Human.IPortraitCranialStation} Describes one sagittal section of the superior, inferior and transverse cranial envelopes.
 * @evidenceReview {@link Human.IPortraitCranialStation} #ed1b920 Read posterior z ordering, separate crownZ, positive width, superior crown and either absolute or explicitly chin-relative floor. The resolver converts chin-relative values once and the cranial appender shares the resulting ring with neighbouring sections.
 * @evidence {@link Human.IPortraitCraniumShape} Carries whole-station replacement, posterior cap depth and independent transition correspondence.
 * @evidenceReview {@link Human.IPortraitCraniumShape} #53276c4 Read the optional five-to-sixty-four station array, cap and transition bounds and separate angular frame. These parameters define a provisional continuation behind the observed facial oval; no hidden skull measurement is inferred.
 * @evidence {@link Human.IPortraitDentalArc} Exposes physical horizontal arc distance and tangent to the dental-row arrangement.
 * @evidenceReview {@link Human.IPortraitDentalArc} #bf977bd Read length, central distance and the sample result in the same millimetre frame. Position and horizontal unit tangent are returned together; the guide's inferred posterior continuation is not a source-image measurement.
 * @evidence {@link Human.IPortraitDentalAttachment} Defines the complete row's oral datum, orientation guides and metric offsets.
 * @evidenceReview {@link Human.IPortraitDentalAttachment} #1c94f92 Read both corner points, upper-lip centre, up guide, lift and recess against rigid attachment. The corner chord supplies X, orthogonalized up supplies Y, and their cross supplies anterior Z; lengths remain millimetres and no per-tooth transform is introduced.
 * @evidence {@link Human.IPortraitDentalCrown} Separates enamel width, height, half-depth, cervical narrowing and cutting-edge rise from arch placement.
 * @evidenceReview {@link Human.IPortraitDentalCrown} #8e72229 Read the local gingival +Y/anterior +Z frame, five numeric dimensions and optional paired side contours. Cervical width is a ratio and edge rise a millimetre length; neither places the crown on the arch. Side detail inherits omitted values independently, while row contact now measures the rotated result rather than trusting nominal width alone.
 * @evidence {@link Human.IPortraitDentalRow} Supplies one local arch and its ordered crown profiles to the grouped dentition builder.
 * @evidenceReview {@link Human.IPortraitDentalRow} #bfb2647 Compared halfWidth/depth with the nominal ellipse, gap with arc-distance centre placement and optional contactGap with actual rotated-mesh separation. Crown profiles remain independently shaped data in right-to-left order. Contact can shift centres away from the guide without changing crown Y/Z or orientation; omission preserves nominal placement.
 * @evidence {@link Human.IPortraitDentalSideContour} Supplies optional mesial/distal detail within one crown's basic profile.
 * @evidenceReview {@link Human.IPortraitDentalSideContour} #9395cb4 Read the three independently optional overrides and their nullish defaults in admission and loft construction. Empty side objects reproduce the basic mesh exactly. Mesial direction comes from the row, so a side profile does not carry an independently guessed world orientation.
 * @evidence {@link Human.IPortraitEarShape} Groups the resident ear datum, scale, projection and embedding controls.
 * @evidenceReview {@link Human.IPortraitEarShape} #64ebbf0 Read the complete placement, independent scales, projection/embedding and optional angular/front/back sampling group beside resolution and construction. Anatomical dimensions and tessellation have separate ownership; hidden pinna anatomy is provisional.
 * @evidence {@link Human.IPortraitFacialFrameShape} Names the common-host facial proportions and anatomical support displacements.
 * @evidenceReview {@link Human.IPortraitFacialFrameShape} #cd960ac Read the complete nasion scale and signed support fields, including bilateral browProjection in [-8,8] mm. Its zero default leaves the source foundation unchanged; nonzero depth belongs to identity before eyelid fitting, not expression brow elevation or a finished-eye transform. The first time-capped document does not opt into this added control.
 * @evidence {@link Human.IPortraitLipBandKnot} Defines one thickness-ratio witness along the curved oral span.
 * @evidenceReview {@link Human.IPortraitLipBandKnot} #a4f2ada Read at and scale with the scalar/array resolver. Witness order belongs to the supplied profile, and fixed endpoint ratios preserve corner positions rather than introducing a separate mouth frame.
 * @evidence {@link Human.IPortraitLipCoordinate} Locates a sample inside one curved vermilion band without subject-specific vertex identities.
 * @evidenceReview {@link Human.IPortraitLipCoordinate} #0f58804 Compared upper/lower classification, signed lateral progress and cutaneous-to-aperture across progress with the coordinate binder. These are normalized band coordinates, not head-Y labels or a new dental frame.
 * @evidence {@link Human.IPortraitLipSection} Gives upper body/tubercle and lower body/pads independent signed relief controls.
 * @evidenceReview {@link Human.IPortraitLipSection} #ec42600 Read millimetre projections separately from half-width fractions for tubercle width, pad width and offset. Zero projections retain the prior band, so a small measured final effect does not make these controls inactive.
 * @evidence {@link Human.IPortraitMouthPerformance} Records observed/current separation, mandibular angles and optional commissure/protrusion changes.
 * @evidenceReview {@link Human.IPortraitMouthPerformance} #d246a56 Read each channel's physical units and limits, explicit hinge ownership, signed smile differences and pucker narrowing. The observed seam is an input calibration; these fields do not replace identity vermilion sections or dental dimensions.
 * @evidence {@link Human.IPortraitMouthShape} Declares lip fitting and the separate legacy cavity/crown settings.
 * @evidenceReview {@link Human.IPortraitMouthShape} #644ef4f Read the complete oral shape and the new optional cavityChamber profile beside cavityWall. The selected complete profile separates internal transverse/vertical room and transition depth from lip aperture and dental placement. Omission retains the former path; the frozen study document is not changed.
 * @evidence {@link Human.IPortraitMouthSocket} Binds the oral opening and surrounding vermilion to subject-owned vertex identities.
 * @evidenceReview {@link Human.IPortraitMouthSocket} #fd28022 Read the closed outer loop, two equally directed inner paths and interior seed beside band flooding and coordinate construction. The mouth copies all three arrays; their anatomical ownership is supplied by the subject rather than inferred from arbitrary point height.
 * @evidence {@link Human.IPortraitNasalApertureFrame} Groups the origin and inward axis of one fitted nasal aperture plane.
 * @evidenceReview {@link Human.IPortraitNasalApertureFrame} #308170b Read copied origin/inward values beside aperture sizing and tilt. The frame is local to the authored rim and does not replace the nose's shared skin support.
 * @evidence {@link Human.IPortraitNasalBodyShape} Groups the ordered lower-nasal stations and independent midline, shoulder, alar and crease controls.
 * @evidenceReview {@link Human.IPortraitNasalBodyShape} #b8092fb Read copied stations and all transverse controls beside the connected lower-nose evaluator. The profile owns one shared surface field and leaves aperture pose to its separate owner.
 * @evidence {@link Human.IPortraitNasalBodyStation} Defines one ordered lower-nasal station and its midline, shoulder and alar extents.
 * @evidenceReview {@link Human.IPortraitNasalBodyStation} #d614402 Read the four station fields beside the C1 longitudinal interpolator; endpoint extents and ordering remain explicit profile invariants.
 * @evidence {@link Human.IPortraitNasalJet} Groups one sampled nasal-section point and its derivative.
 * @evidenceReview {@link Human.IPortraitNasalJet} #c776965 Read the point and derivative pair beside nasal-section sampling. The jet is a local parametric witness and does not independently place the finished nose.
 * @evidence {@link Human.IPortraitNasalLobule} Declares a resident datum, apex offset, three physical radii and normalized inner section extent for each local nasal body.
 * @evidenceReview {@link Human.IPortraitNasalLobule} #8de79e8 Read the head XYZ/millimetre frame, physical half-extents, core [0,1) domain and optional dz/dx,dz/dy tangent. Separate array members allow asymmetric alae; the section pole is not necessarily the maximum head-Z point when its tangent is inclined. None of these inputs is asserted as a measured cartilage value.
 * @evidence {@link Human.IPortraitNasalRimJet} Groups one nasal rim point with its tangent and transverse directions.
 * @evidenceReview {@link Human.IPortraitNasalRimJet} #5febf4d Read the three rim-vector fields beside rim-section fitting. Their shared local frame preserves aperture ownership and does not create an additional detached rim.
 * @evidence {@link Human.IPortraitNasalRimSection} Separates exterior tissue width from the fitted aperture and its crest relief.
 * @evidenceReview {@link Human.IPortraitNasalRimSection} #9761008 Read positive physical width and signed normal projection in millimetres. These describe the new skin band, while aperture scaling/pose and vestibular depth remain with their existing owners. Omission selects the original direct attachment.
 * @evidence {@link Human.IPortraitNasalSection} Groups transverse poles, station rows and bounded identity-transition controls.
 * @evidenceReview {@link Human.IPortraitNasalSection} #285c27c Read copied axes, station rows, join width and influence beside the loft evaluator. The optional field is a single connected depth authority and leaves aperture pose to its separate owner.
 * @evidence {@link Human.IPortraitNasalSectionStation} Defines one transverse depth-control row of the optional nasal loft.
 * @evidenceReview {@link Human.IPortraitNasalSectionStation} #e2d459b Read station height and ordered depth poles beside the cubic loft's axis mapping. The row supplies authored controls rather than sampled source vertices.
 * @evidence {@link Human.IPortraitNeckSection} Describes one cross-section of the authored neck continuation.
 * @evidenceReview {@link Human.IPortraitNeckSection} #9f21ae5 Read the section's Y coordinate, width, front, centre and back depths beside appendPortraitNeck. These values define one closed continuation sample and do not claim measured cervical anatomy.
 * @evidence {@link Human.IPortraitNeckShape} Groups upper/lower neck sections and the crop policy for the cranial continuation.
 * @evidenceReview {@link Human.IPortraitNeckShape} #1c12991 Read all three section groups and optional submentalProjection beside the neck builder. Projection defaults to zero only at construction and leaves section dimensions independent. The documented peak and angular/end fades match the actual field; this is authored surface fullness, not recovered fat thickness.
 * @evidence {@link Human.IPortraitNoseShape} Separates exterior, opening, lining and optional complete-basis controls.
 * @evidenceReview {@link Human.IPortraitNoseShape} #ca3e376 Read the complete nasal shape contract, including independent post-refinement envelopes per socket opening. Empty/omitted arrays retain legacy construction; a selected envelope replaces legacy rim and final-body authorities. Local final-lobule and depth-scale admission remain unchanged. Capability is separate from photographic acceptance.
 * @evidence {@link Human.IPortraitNoseSocket} Binds procedural nasal controls and original opening faces to the measured host.
 * @evidenceReview {@link Human.IPortraitNoseSocket} #f8ffe94 Read all ten binding members with exterior depth, target collection and opening extraction. Coordinates and influence radii belong to the subject frame; surface vertex IDs and nostril face ordinals have different meanings. The factory copies its arrays before fitting rather than retaining a mutable preset binding.
 * @evidence {@link Human.IPortraitOrbitalSupportShape} Groups bounded upper-orbit sections under one interpolation support.
 * @evidenceReview {@link Human.IPortraitOrbitalSupportShape} #ebef7b1 Read copied nested inputs, one-to-32 station admission and the three-target-per-station mapping into the solver's 96-control domain. The section group remains optional in assembly and is not a complete anatomical reconstruction.
 * @evidence {@link Human.IPortraitOrbitalSupportStation} Owns one forehead/brow/sulcus section on a subject-bound upper orbit.
 * @evidenceReview {@link Human.IPortraitOrbitalSupportStation} #adfbb28 Read every station member with the actual skin query and coupled field consumer. Signed projection changes section form, while positive height/descent locates its neighbours; these do not represent measured bone or fat thickness.
 * @evidence {@link Human.IPortraitReliefCurve} Groups ordered curve controls under one named surface responsibility.
 * @evidenceReview {@link Human.IPortraitReliefCurve} #77e3c95 Read the unique name and bounded ordered control population beside the curve factory; the group is independently optional and shares the existing host.
 * @evidence {@link Human.IPortraitReliefCurvePoint} Declares one resident attachment, offset, support and displacement control for a continuous anatomical surface curve.
 * @evidenceReview {@link Human.IPortraitReliefCurvePoint} #886f2fe Read the four finite millimetre fields and resident anchor contract beside the curve layer; each control follows the live skin without creating a detached section.
 * @evidence {@link Human.IPortraitReliefRegion} Separates each support's live vertex binding and offset from its metric support radii and signed displacement.
 * @evidenceReview {@link Human.IPortraitReliefRegion} #9908253 Read the named anchor, XYZ offset, three positive radii and displacement fields against the layer adapter. All use head-space millimetres; the anchor follows replacement, while these envelopes remain visible-surface controls rather than reconstructed internal tissue.
 * @evidence {@link Human.IPortraitSkinConstraint} Carries one exact resident skin target and its surrounding adaptation reach.
 * @evidenceReview {@link Human.IPortraitSkinConstraint} #4f67019 Read vertex, XYZ target and reach together in blendPortraitSkin. The fixed map retains requested coordinates while the graph field affects only reachable neighbours; duplicate contradictory targets refuse rather than selecting a component by order.
 */
export const humanFaceAnatomySchemaReview = true;

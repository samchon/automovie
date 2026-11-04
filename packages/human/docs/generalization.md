# Human generalization

## Independent verification

Source-relative fold checks compare complete sections normal to a fixed source locator's tangent. Keep the raw source's normal anatomical concavity as the expected profile, retain every intersected component, and register a component only when the same fixed source point lies strictly inside exactly one component on each surface. Component-count differences are coverage discrepancies. Total excess turning cannot locate a matched source defect or exclude compensating folds, longitudinal ripples or bad loft joins. Side classification and edge-interpolation uncertainty must propagate into the turning screen; unsupported sections remain unavailable. Independent re-triangulation of the actual source and known-angle V insertions in actual generated buffers establish the tested geometric contract, not clinical wrinkle limits or whole-body approval.

The raw-array observers read saved emitted coordinates and indices without importing the Human construction, interpolation, measurements or rig. Their successful controls establish the observer's stated mathematical contract; they do not establish that a generated person is anatomically correct. Keep correct-output, actual-buffer defect and known-input-change controls on the same observer path.

- Measure the indexed surface. The saved f1 skin contains 289,042 buffer vertices but only 286,021 referenced vertices; its 3,021 unused vertices cannot establish a crown, a sole or a skin spike. Correct indexed geometry with unused extreme coordinates must remain green, and short floating geometry with unused answer coordinates must remain red. Check referenced narrow spikes directly so an area-weighted percentile cannot hide them.
- Gate finite normal-line separation separately from nearest Euclidean separation. The oblique control has normal separation `31/3` mm and nearest separation `31/(3 sqrt(2))` mm; the latter is below its independently fixed 8 mm control contract while the former must fail. That fixture allowance supplies no clinical tolerance, and missing normal support remains unavailable.
- Establish arithmetic support for the closest point as well as its distance. Fourth-order Voronoi products can underflow while triangle area remains finite, and finite determinant terms can overflow when summed. The resulting wrong edge witness can have the same rounded distance as the correct interior witness. Retry unsupported arithmetic in a triangle-local unit chart; if that chart still lacks support, retain an addressed refusal. Check all seven Voronoi regions at independently prescribed scales: the current controls cover twelve scales from `1e-100` to `1e100`, with 84 correct witnesses and scaled distances. An extreme-aspect case still refuses both queried memberships.
- Fix source-region coverage from the original raw source parts before examining the candidate. Candidate labels or cropping cannot redefine the answer's support. Missing or duplicate original head/body parts and unassigned original source samples must refuse acceptance. Nearest-distance diagnostics cannot stand in for a complete normal-distance score or genuine held-out improvement.
- Establish feature lineage from original source coordinates and topology before candidate inspection. For f1, f2, m1 and m2, the raw head inventory retains 76 native features, 1,366 memberships and 13 unsupported features; its 24,049 canonical vertices have indexed carrier support, with no missing lineage among the retained memberships. This does not establish full triangle correspondence: only 21,582 of the carrier's 64,094 head faces match canonical triangles in the source-only comparison. Native feature names establish neither clinical landmarks nor anatomical left/right, and JSON membership order establishes no curve order. Preserve canonical/carrier addresses and missing support. Sparse point agreement cannot exclude a defect between those points, replace two-way surface coverage or supply an absent independent clinical limit.
- Keep native source courses distinct from independently registered clinical sites. In f1, the original `Chest`, `Waist` and `Hip` courses have maximum separation from the original raw source skin of 18.655, 10.863 and 19.326 mm respectively. This rejects treating those courses as exact skin-bound clinical answers. Retain the source residual and candidate residual separately; the source residual is neither a free candidate tolerance nor a reason to alter the original dimensions.
- Preserve the public stature's identity. `body.anatomy.stature` is stature by ISO 7250-1 6.1.2, explicitly distinct from exported bbox extent. The `stature-only` comparison selects a different whole source person and scales it by configured height courses only, so it is no clinical-stature baseline. Keep that diagnostic and its original receipt filenames qualified; it is not an independently certified clinical-stature baseline. Observed crown/course alignment is conditional, and floor `Y=0` belongs to the registered untransformed inspection bind, not every caller's placement. Matching either diagnostic cannot certify stature or held-out generalization.
- Check numerical support before reporting material strain. Positive finite triangle area does not establish a usable tangent basis. In the saved `tall` test output, bind-mesh `head.upper` faces 316430, 317065 and 329242 have basis conditions from approximately `2.43e13` to `8.62e14`; their readings in `neutral`, `demo` and `limit` remain unavailable, nine readings in total. These triangle addresses belong to that person's mesh. Preserve bind/posed corners, altitude ratio, conditioning, world-coordinate resolution and orthogonalization residual with the refusal. An arithmetic screen is an engineering guard, not a certified error bound or an anatomical allowance.
- Assess thin faces by their actual numerical support rather than rejecting every thin triangle. In the saved `wide` test output, bind-mesh `ear.lobe.left` face 383720 has a basis condition of approximately 1129.95. Eighteen identity, right-angle rotation and uniform-scale controls across its six vertex permutations pass, as do six permutations of its actual `demo` posed map. The observed maximum principal stretch, approximately 140.862398820536 to 140.862398820538, belongs to that person's particular material face and pose; it supplies neither a universal clinical threshold nor a whole-body stretch claim.

The following sections describe construction rules by part. A better construction replaces any of them.

## Whole body

`AutoMovieHumanBodyLaw` generates every chain in world millimetres from the top down: the head's rise sets where the neck ends, the neck carries the shoulders, the column runs to the crotch's height, and the limbs start from the column. `AutoMovieHumanSkeletonLaw` places the skeleton first, and the limbs loft on it.

- Drive dense sections from sparse dimensions: a per-section centre, frame and in-plane affine, interpolated between a dozen anchors, carries most of the difference between people.
- Separate sex from length with people at the ends of height, fat, muscularity and masculine-feminine, and judge a law on people reserved from every fit.
- Fit slopes on every person and levels on the people inside the domain.
- Fit against a control's achieved value.
- Bound the stated domain by tape ratios as well as tapes, so every test person is a whole person.

## Tapes

- Locate each tape's site on the part's own sections by its published definition, square to the bone on a limb, and solve the section's hull there with no ratio.
- Close a girth through a shared scale of width and depth, in which a girth is linear.
- Let width follow the tapes at about 0.8 and front depth from about 0.6 at the waist to 0.1 near the neck, as measured over 67 people.
- Solve a tape against the hull of the section it wraps.

## Leg

Both legs come from one construction and a reflection in `AutoMovieHumanLegConstruction`, lofted on the femur and tibia.

- Place the leg's axis by a line per station in a constant, leg length, hip tape and the masculine-feminine control.
- Place the crotch by a line in stature, inseam, thigh and the masculine-feminine control, counting the neck and face stretches in the stature's share.
- Take the leg's sections square to its bone, and let only its last interval reach the tilted crotch ring.
- Give the thigh and the trunk one shared direction where they meet.

The leg is divided into pieces under `src/generation/leg/` (values in [anatomy/leg.md](anatomy/leg.md)); what the division taught:

- Every landmark was a fraction of the distance between the two rings, so the foot's ring height and the crotch height moved the knee, the calf and the thigh tape, and the crotch handover reach. Landmarks are now shares of the thigh and the shank from the joints, and the joints stand at their definitions: the hip by Hara 2016 (10 mm medial of the former rig), the knee on the hip-to-ankle line, the ankle at the lateral malleolus height with a stance of 136.6 mm, the crotch at the inseam plus the malleolus height (ISO 8559-1 5.7.6).
- Fading a mismatch between two owners' rings (the ankle's 12 %, the crotch's 8 % of the length) is a seam done wrong: the ring is the neighbour's layer, read with its jets, and the spans between landmark rows absorb the difference.
- The skin is a Gordon network: eight longitudinal profile curves (guides at 0, 45, ..., 315 degrees, each with its radius, tangent and curvature along the leg) and the sections that pass through them, each section eight chord arcs (the quintic Hermite arc of two guides' jets plus one fullness) of 33 knot spans. A guide is estimable alone from one silhouette, a sector from one compartment, a relief in its own frame with its own centre and axis (the patella and the gastrocnemius heads push along their own axes).
- The reference pack holds 72 horizontal curves per leg and about 57 spans per curve; the former leg chain held 31 to 33 layers. A rule that fits the references must keep at least their counts, so the layer density is set by the reference step (9.5 mm), not by the finest knot pitch of a prior.
- A tape is solved on the hull of the emitted section at its published site, with no ratio to a prior shape.

## Foot

Both feet come from `AutoMovieHumanFootConstruction`, built from the centres outward: the ankle at the lateral malleolus height, the metatarsal heads (the first at ANSUR II's ball-of-foot length, the others by Maestro's cascade), each toe's line from its head to its tip, the toes as tubes on those lines, one web ring, and the body between five guides.

- The earlier foot was a fitted average: about 2,500 Fourier numbers of a mean foot carried onto the reference people, stretched by three scales, with toes split off a cascade of pinched sections closed by chords, and three patches (a padded ball, an adopted end row, a dome cap) over the consequences. The chords crossed: on every person the fifth toe's wall passed through the forefoot's and the second toe's through the third's, and sharp folds crowded every web. Toes on their own lines joined only through the web surface cannot share a wall.
- Cut the body by planes that meet only outside it. One fan of planes about a horizontal axis over the oblique web line turned the heel's sections by the line's 20 to 25 degrees, which put the heel's back beyond the lateral border in the plane's across coordinate. Two fans meeting in one square plane keep every plane square to the foot behind the forefoot: from the oblique web ring a yaw about a vertical line beyond the lateral border, then a turn about the square horizontal axis through that line's top.
- Give every guide the section's tangent and curvature at its point, and join neighbouring pieces by the quintic Hermite of both ends' jets. A superellipse quarter with an exponent above 2 has zero curvature at its axis points, which flattens the dorsum's crest and turns the borders into walls; keep flat pieces only where the anatomy is flat, the plantar contact on the floor.
- Bound the plantar contact by two guides, its medial and lateral edges on the floor, which close behind the heel's contact into the narrow plantar sector round the heel's own posterior corner (a quarter ellipse from the contact's end to the rearmost point) and up the Achilles. The medial arch is the piece from the contact's medial edge up to the medial border.
- Put the malleoli on the column as relief windows centred at their heights, so the malleolus height is read at its site and the windows' edges stay C2.
- Hold the guides' knots as one median per landmark over the four references, read by exact plane cuts in foot lengths and breadths; the medians and their spread are in `anatomy/foot.md`.
- Mix normalisations only where a landmark's own scale changes: a crest knot at the malleolus height fell below the instep's knot (in foot lengths) on a person with a low malleolus over a long foot, and the guide ran back within the planes it had passed; the column's knots start above the instep's.
- Start a toe's own section half a margin radius past its webs' crests, not the hand's whole radius: the hand's rule left the fourth and fifth toes no shaft before their caps, and their webs then crumpled into the caps. Let neighbouring toes' breadths come from the spacing of their lines, so they touch.
- Hand an edge's curvature from the floor's zero to the heel corner's over the corner's own height: handed over within 6 mm, all three plantar pieces turned within two planes and constant-phase lines kinked there by up to 900 degrees per radius.
- Hand the yaw fan over to the turn fan by their rates, not by a switch: switched at the square plane, the planes' rotation axis turned through a right angle there and every constant-phase line kinked. The rates trade by the quintic smoothstep over a window either side of the square plane, so the plane is C2 in the station; the window's rotation axis points up and medially from the fans' shared point, above the foot, so the planes still meet only outside it.
- Parametrise a guide by the fan's own station, not by chord length: read each knot as its plane's station and its place in that plane and join them by the natural C2 spline. Over chord length, a side guide that joined a vertical cut's low extreme to a horizontal cut's high one climbed within a few planes and kinked the dorsal-lateral piece, and a guide that ran back within planes it had passed needed holds.
- Turn a contact edge's tangent, not only its curvature, from the floor's level to its neighbours' chord round the heel's corner: held level above the floor, the medial edge folded every section up the back of the heel, a crease from the heel's bottom toward the medial malleolus.
- Solve every place a toe's construction searches for (where the tip closes, where the first own section clears the webs) to a root, and give a toe a fixed count of shaft sections: searches stepped to a grid and counts stepped by a spacing flip with the inputs, and one foot's toe then differs from the other's reflection by more than their inputs explain.
- Divide the foot into pieces each of which is one estimable rule, one file each under `src/generation/foot/` (frame, heads, toe lines, web line, fan, one file per guide with its own knots, heel corner, junction curvature, arc, edge hand-over, section jets, the four section pieces, body, chains, malleolus and its bump, web ring and crest, the toe's breadth, cap, root, section and stations, reflection), with `AutoMovieHumanFootConstruction` only composing them. A piece takes typed data from the pieces before it and never recomputes them, so it builds alone from one person's three dimensions in seconds and can be looked at and tested alone; a guide's knots belong to the guide that reads them, not to a shared prior. The whole foot built at once hid which piece a defect came from: a foot built only from its own chains, with no skeleton or leg, is the entry that shows it.
- Make a landmark function total: a malleolus's centre read from a guide's `column` threw on a guide whose knots are read in the fan's own planes (an empty column); read it from the guide's knots by a bracketing search with its ends held, so every person and every height gives a point.

## Trunk

The trunk and shoulders come from one column in `AutoMovieHumanTrunkConstruction`, a closed-form section whose measures run from the crotch to the neck.

- Carry the front and back as places.
- Start a settle above a shared ring, and keep a layer's height when a ring settles.
- Join a neighbour by a fillet over one radius of the child's layers; an end slope m over a span h stands `4/27 m h` off the chord.
- Keep a shoulder's ring convex.
- Let the rear fall under the buttock's crest as the square of the height.
- Hold the front midline, the widest point and the rear midline at fixed phases, and space the rest by arclength.
- Set the crotch fold's softness at 1.25 times the larger of the ring's pitch and the row spacing.
- The neck chain's bottom ring is the trapezius' flare, not a neck circle: on f1 its half width is 157.8 mm at 1405.9 mm and falls 3.3 mm per mm of height to 101 mm at 1427, so the shoulder line must arrive at it with that width, slope and curvature. A monotone cubic through the keys (zero slope at its end keys) put a 160 mm plateau under it and a disc rim with a stepped collar.
- A shoulder cap that is an ellipsoid with a flat apex (radius 47 mm over 34 mm of height) drops the ring's width 11 mm in 3 mm under the shoulder point. The frontal outline turns some 40 degrees from the trapezius line (about 17 degrees below horizontal) to the arm's outer edge (33 degrees from the vertical): a fillet, not a dome.
- An input that follows another definition cannot be honoured: f1's `acrossShoulder` is 296.7 mm, shorter than the straight biacromial breadth (355 mm), so built to ISO 8559-1 5.4.3 (over the back neck point) it puts the shoulder point at 148 mm, inside the arm's root (252.7 mm at the axilla). The input is corrected at the input.
- The reference pack's trunk holds 105, 104, 114 and 133 closed sections (mean gap 5.85, 5.89, 6.07 and 5.25 mm, about 100 Hermite spans per loop), so rows 15 mm apart were fewer curves than the reference. Hold rows at most 5 mm apart and 256 controls on each.
- Divide a feature that has its own centre (the breast, the gluteal mass, the umbilicus, the spinal furrow) from the trunk's ring: build it in its own frame as a height over its footprint, and merge it by a relief window whose net samples that height at the base surface, so the seam is C2 by the window's three zero rings.

## Arm and hand

The arm and digits loft in their own bone frames: sections square to each bone, frames carried by least rotation, each child starting from a round section that clears its arc.

- Size the arm's root from the shoulder ring's area times the cosine of the bone's tilt.
- Hand the forearm's tube to the hand only from the wrist crease to the branch, with its long axis on the hand's breadth, so the least girth sits at the crease.
- Solve the scale across the hand so the section through knuckles II and V spans the breadth input.
- Scale the shared hand form by three scales, each solved at its measure's site: along it so the middle finger's webs stand the palm length from stylion, across it for the breadth, through it so the knuckle section's hull measures the hand tape. Fitted per-axis ratios left hand length 12 to 16 mm long, palm 7 mm long and girth 4 % short on all four references.
- Stand the hand's form with the centre of its crease section on the forearm's wrist, and solve the wrist's circle so the section at stylion, square to the forearm, measures the wrist tape. A hand offset common to all fingers came from the forearm 40 mm above stylion, not from the hand.
- Stand each finger on its bones. The middle finger's knuckle-to-tip length is what the hand length leaves past its knuckle; every finger runs its measured web-to-tip length (a source measured from the web, not from the palmar crease) past its own web, the more distal of its webs' crests, with its PIP and DIP at their measured shares of that length from the web. Placing the joints by shares from the knuckle instead put the PIP turn 5 mm from where the posture is read, and the turn leaked into the proximal chord.
- Pass each proximal phalanx through its finger's root at the web, and move the knuckle onto that line at its metacarpal's station. A bone that misses its root kinks the web surface between the palm's ring and the finger's first section: a 10-degree kink cancelled most of a 24-degree PIP bend on the skin while the bones held it.
- Read the bind's finger posture as a capture convention: one angle per joint, measured on the references at the same stations it is built at, holding out each person in turn.
- Scale the elbow's turn with the elbow's radius, and each finger joint's turn with that joint's radius.
- Build the hand from pieces in `src/generation/hand/`, each in its own file with a typed fixed-input interface and one rule: the digit's line, the four-guide section and its sectors, the phalanx spans, the stations, the joint swellings and creases, the nail plate and folds, the fingertip pulp and cap, the metacarpal arches and valleys, the palmar sector, the thenar and hypothenar masses, the wrist heel and the webs. A composition file only calls them in dependency order. A piece's constants are marked as observed, conventional or fitted where they stand.
- Keep every digit's section count at or above the reference's. f1's bone-normal planes stand every 1.9 mm along each digit (39 to 52 per finger, 51 on the thumb), of which about 32 to 42 hold the finger alone (read from the first station of each finger in the station table, not counted by program); the stations rule (`AutoMovieHumanDigitStations`) takes one section per 2 mm from the first section past the web, one per millimetre within 4 mm of each interphalangeal joint, and three tip rings, which gave 36, 41, 43 and 35 sections for f1's index, middle, ring and little fingers with the first section at a fifth of the finger's length (one run of the station rule against f1's bones). The old 5 mm rule gave 13 to 16.
- Divide a section into four guides (the radial and ulnar side lines, the palmar and dorsal midlines) and four sectors (`AutoMovieHumanDigitRing`); each guide owns its point, tangent and curvature, so the sectors meet C2. Read against f1's loops the two-half section reproduces them to 0.1 to 0.6 mm RMS and 1.6 % in girth.
- Build each web as one patch over four owners' published jets (`AutoMovieHumanWebPatch`, G2 sides) and not as a smoothed blend; the finger webs and the toe webs take the same patch through `IAutoMovieHumanWebBoundary`. A patch of G2 sides must reproduce any polynomial surface of degree five or less that the owners publish, which is its identity check.
- The wrist heel (crease to thumb branch) is the hand's: it starts from the bone tube the arm publishes at the crease (`AutoMovieHumanWristSpan.end`) and publishes the crease layer's jet for the forearm to copy.

## Webs

A web is a saddle: above its crest the two children are one sheet, the parent continued, and below it two walls leave sideways. Mesh it even in `w = sqrt(z)` about its crest, with level rows and a translational chart near the pinches.

- A web's crest is where neighbouring fingers part, the site of the palm length and the datum of a finger's own length; keep each child's line through its root there, or the web surface bends between the parent and the child.

## Neck and head

- Hand the neck to the head as a quintic Hermite span from the ring's own place and slope to nothing, level in slope and curvature where it ends; the neck's chain publishes no station curvature, so the seam is G1 there and C2 above. A cubic span stepped in curvature where it ended under the chin.
- Keep midline rays a millionth of a radian off the midline.
- Solve each head measure against the construction's own surface at its Farkas landmark, with every ratio at its definition.
- Place the landmarks first, by their definitions and published relations, and draw every curve through them: the vertex at stature and the menton the head height under it; the nasion the 3D face height from the gnathion; the fissures' centre half their height under the nasion (FaceBase puts the nasion at the upper lid creases); the subnasale the nasal height under the nasion, 6 mm ahead of the glabella's vertical and the pogonion on it (Legan and Burstone, scaled by the face height over the 3D Facial Norms' 118.6 mm); the pronasale the protrusion from the subnasale, closing the nasal triangle whose bridge is 0.875 of the nasal height (3D Facial Norms); the stomion a third of the way from the subnasale to the menton; the lips 3 and 2 mm ahead of the sn-pg line, the mentolabial sulcus 4 mm behind li-pg; the tragion the upper facial depth, 0.637 head lengths, behind the nasion at the cranial base's half width, 0.962 of the head breadth.
- Then solve the measures an input names on the generated skin, each moving the one key that owns it: n-gn the nasion's height, n-sn the subnasale's, sn-prn the tip's lead, v-me the jaw's border, zy-zy the face's width at the zygion, go-go the jaw arch's. Three passes close them within a millimetre.
- The ratios that replaced the definitions had been fitted when several inputs were the reference source's proxies (a 2.8 to 10.2 mm nasal protrusion). Read against Farkas inputs they put n-gn at 1.19 face heights, n-sn at 1.37 nasal heights and the tip 36 mm out for a 21.8 mm protrusion; a ratio fitted to an input does not survive a change of the input's definition.
- Build the head from separate pieces, each in its landmark span, joined at the landmarks' heights by a quintic Hermite span between the owners' jets: the midline profile (the vault's ellipse plus a natural spline of the landmarks' departures from it), the cranium's front (the vault over the glabella, falling a clearance behind the face by the nasion and back to the zygion by the arch's height), its back (the opisthocranion at the nasion's height), its width (the cranial base's at the tragion), the face's widest place and its half width (frontal width at the brow, face width at the zygion, mandibular width at the gonion). In each section the cranium is a super-ellipse whose exponent closes the head circumference and the face one of exponent 2.5 from the profile to its widest place; the two join along each ray by a smooth maximum 6 mm wide, which swells the skin 1.5 mm at most. A power-mean union of two bodies of similar size swelled their meeting by up to a tenth of their radius.
- Read the glabella and the nasion on the skin by their definitions, each in its own window: the glabella is the most prominent midline point over the eye level, the nasion the deepest between 6 mm under the eye level and the glabella. A glabella search that began 8 mm under the eye level found the nasal bridge growing forward again and put the glabella 10 mm below the eye line on every person, with the nasion collapsing onto it. On the skin the nasion then stands 1.3 to 2.1 mm over the globe centres (3.5 mm over the fissure centre on f1, against the definition's half the fissure height) and the glabella 18 to 20 mm over it and 3 mm ahead.
- Read a head surface by its half width at fixed forward places per height, not by its sections one at a time: a cranium whose front apex retreats down the forehead sweeps its wide flank across each forward place within a few millimetres of height, and the base surface showed a 15 mm cliff (79 to 63 at x = 40 over 8 mm) that the clay render showed as a dark groove from the eye to the ear. The reference meshes fall smoothly there (73, 72, 71, 68, 66 from the brow to the cheek).
- Give the face only its front half. A face super-ellipse symmetric about its widest place reaches as far behind it as the lips stand in front, 85 to 95 mm, out through the nape under the ears: it drew a ring round the back of the head at the lobes' height. Behind the face's widest place Z the side sector owns the skin up to the cranium's eurion line E (`AutoMovieHumanHeadSideSector`), the quintic in the ray angle between the two owners' jets, so the temple, the cheek behind the zygion and the jaw's side are G2 to both; where E does not stand behind Z the sector runs on to the back midline. A smooth maximum 6 mm wide there had turned the skin within a few millimetres along the temple, a faceted ridge from the eye to the ear.
- Draw the back profile as its own piece (`AutoMovieHumanHeadBackProfile`): the vault's ellipse over the opisthocranion, and under it one quintic span to the neck ring's own back place and slope. It puts the nape 25 mm in front of the opisthocranion 107 mm under the nasion on f1, against 27.5 mm about 85 mm under it on the reference mesh, with no corner; a vault share held at a floor had left one.
- Weigh every hand-over along the height by a quintic smoothstep and join bodies by a cubic smooth maximum or minimum: the cubic smoothstep's and the quadratic union's curvature steps at both ends of every blend, a line in the skin at each.
- Zygion is the arch's most lateral point, not the widest skin of its band: the cheek widens behind it to the tragion, so the cranium's front must lie behind the zygion at the arch's height or it sets the face width.
- The references disagree with several of their own inputs: their skin is 145 to 148 mm wide at the zygomatic level on f1 and f2 against zy-zy inputs of 126.6 and 130.2, m1's and m2's noses are 10 to 18 mm taller than theirs, and m2's head is 20 mm taller than its 210.1 mm head height. Built to the inputs, those regions stand off the references.

## Nose

- Build the base from its anatomy: a surface rising from the lip at the columella's angle, the tip lobule reaching down to it, rounded alar lobules with their crease, and two teardrop nostrils split by the columella. Keep the base edge under the nose.
- Give every rounding a floor set by the sampling.
- Round a nostril's pocket toward a circle as it deepens.
- Keep a meridian's handle within half the rim's distance from the opening's axis, and step a meridian evenly in its length plus its turning.
- Shade only skin that faces into a pocket, from the rim inward, by the share of sky a wall at depth h of a tube w half wide sees, about `1 - h / hypot(h, 2w)`.
- Start the dorsum at the soft-tissue nasion: the ridge's relief falls to nothing there over the root's last third, so the midline profile alone draws the nasion's hollow. A ridge still 0.2 tip leads high at the nasion filled the hollow on every feminine face, whose fitted glabella bumps were also near nothing, and the profile rose straight from the tip to the forehead.
- Give the tip its lead from the protrusion's definition, the pronasale's place less the face's profile there, divided by the ridge-and-ball union's own swell at the tip.
- Raise the columella by the nasolabial angle less a right angle plus the upper lip's own forward lean from the subnasale to labrale superius, which the profile's landmarks give; an assumed 10 degree lean on a lip the Legan and Burstone landmarks stand nearly upright read the angle 122 degrees.

## Lower face

- Make the mandible a volume joined to the head along each ray by a smooth minimum.
- Draw its arch in plan as a round chin joined by straight sides to an ellipse about the gonions; the chin turns with the curvature of the parabola through the chin's front and both gonions.
- Lean the jaw's side in from the cheek's own width at the zygomatic arch down to the gonion, as the masseter runs.
- Read the skin under the jaw along rays from a point on the midline behind the gonions.
- Turn the skin under the border on an ellipse sized to the underside the neck leaves.
- Solve the jaw's border height so the skin's lowest chin point is the menton the head height puts under the vertex, and its arch's width so the skin's go-go is the input: the soft tissue's roundings put the skin's menton 6 mm under a border laid at the landmark.
- Let the skin under the chin leave the gnathion at the lower face-throat angle, 100 degrees from the line up to the subnasale (Legan and Burstone): with the subnasale over the pogonion that line is about level, and an underside falling 22 degrees inward put the skin 40 mm behind the gnathion 14 mm under the menton, which every reading of the menton as the chin's lowest point near the gnathion then took.
- Keep the neck's tube at its ring's front and back until the skull's sizes take over: a tube centred on an axis leaning forward to the skull's put the throat 22 mm behind the chin at the menton's height. The skin under the chin still falls 34 degrees from the gnathion into the throat, 18 mm under the menton, so a menton read as the chin's lowest point within 40 mm of the gnathion stands 14 mm low; the submental piece between the menton and the cervical point, owned with the neck's top boundary, is the next construction.
- Draw the face back into its widest place as it fades into the neck under the chin, and fade it into the cranium over the forehead: a face that kept the profile's length while only its width faded stood out of the neck as a fin 25 mm long and 3 mm thick.

## Ear

Sample the ear's sections at uniform indices, and fade a join's correction with distance from the parent's ring.

## Rig

`AutoMovieHumanRig` gives every part a binding, and a pose moves the prepared skin without generating it again.

- Weight a vertex by its place alone, so every copy of a seam point moves together.
- Pass skin down the skeleton as a tree of cuts: each joint holds a plane and a ramp.
- Take pose zero as anatomical neutral; the generated A-pose stays the skin's bind, and one rotation per bone reaches neutral.
- Blend by dual quaternions, and evaluate the same blend in every consumer of a posed skin.
- Size each ramp for its joint. Two bones blended as dual quaternions about their joint turn a point by phi(w) with `dphi/dw = 4 tan(theta / 4)` at an even share, so skin rho from the joint stretches by `1 + rho dphi/dw |grad w|` on the opening side and turns over on the closing side once that term passes 1. Keep `|grad w| <= 1 / (4 tan(theta / 4) rho)` (stretch 2, [Ní Annaidh 2012](sources/ni-annaidh-2012-skin-failure.md)), theta the joint's largest turn from the bind over its pose channels' ranges and rho the farthest skin square to the joint's plane. The formula predicted the old elbow (2.40 against 2.39 measured) and knee (3.25 against 3.23) from their fixed `1.5 depth` ramps.
- Read rho per sector round the joint (12 sectors, carried as two harmonics of the angle), so a thin side turns on a short ramp and only the thick side gets the length its stretch needs.
- Step a share on a level slope with eased ends: the quintic's peak slope is 15/8 of its mean, a level middle with cubic quarters 4/3, so the same bound fits in 29 percent less length.
- A capsule comparison's argument is a difference of two distances, with gradient up to 2, so its half is twice a plane's for the same turn. Never let it reach past the limb's girth radius, nor an arm's past the bind's gap between the arm and the trunk from the elbow's ramp down. Wider arm bands lowered the raised axilla's stretch from 6.6 to about 4, but trunk skin turned round the glenohumeral centre swelled the side of the chest into a ball, and a band read past the forearm alone left trunk weight on the elbow, which tore 2.5 to 5 times with the arm raised.
- Let a ramp span at most half its segment: the muscles crossing a joint attach within the near half of the next bone (deltoid at mid-humerus, gluteals and iliopsoas on the femur's upper third), and past that the skin rides the bone. Ramps reaching the next joint's bent the raised upper arm and swelled a flexed thigh into a sack.
- Narrowing the arm's band below the axilla's apex (the arm root's lowest point) did not remove the wing of skin beside a raised arm and raised the axilla's stretch from 6.5 to 7.5 with more folds: the wing is the upper arm's proximal skin, held between the girdle (turned 28 degrees) and the arm (146) across the shoulder's ramp. It needs a scapular carrier, not a band.
- Let the pelvis carry 7/24 of a clinical hip flexion (Bohannon 1985), handed back by the lumbar spine and both thighs: the bilateral full flexion's groin fell from 3.7 to 4.0 times to 2.6 to 2.8, the one-sided limit pose's from 3.7 to 4.0 to 3.2 to 3.4, the other hip's extension bounding the pelvis's turn.
- Release a leg's fall to the midline from the crotch down and end the release before the knee's ramp: reaching above the crotch puts leg weight on the midline, reaching the knee leaves the inner knee on the pelvis.
- Limits of a rotation-only skin, with the reason: the arm raised 146 degrees from the 33 degree bind must open the axilla's arc, about 38 degrees seen from the glenohumeral centre, to about 184; every point keeps its distance from that centre, so the arc stretches unless the turn spreads far into the trunk and arm. Bilateral hip flexion of 132 degrees must cross between the midline, which holds no leg weight, and the hip centre about 97 mm away, at the pubis about 104 mm from the flexion axis. Both need another carrier (a scapular bone, a lumbopelvic share of hip flexion) or a bind nearer the middle of the range, not a weight field.

## Mouth

- Open the skin along the lips' contact line, and give the jaw a point's share by its side of that line, fading toward the corners.
- Press the lining's inner faces together across the slit, so the lips meet at rest.
- Close the cut rim itself on the contact line, each side 0.02 mm off it, so the opening is a seam: a slit cut one station tall left the lips 1 mm apart with the teeth showing, and a thinner cut let skin edges step over it.
- Put the upper vermilion's border at the input at the midline, where labrale superius is, and raise the Cupid's bow's peaks above it; a dip below the input read 0.82 of it.

## Eye

- End the lid's conjunctival tuck straight behind the margin, never outside its projection, so the skin's opening runs canthus to canthus. A tuck pulled onto the globe's 24 mm silhouette cut every 28 to 33 mm fissure to 23.28 mm whatever the input, and one reaching under the lid widened its height by twice its reach.
- Solve the margin's lateral harmonic so its canthi stand the fissure length apart in 3D, and centre it so the medial canthus is half the intercanthal width off the midline.
- Stand the teeth on a standard arch placed from the head, and check that they lie under the skin.
- Map each viseme to FACS units, tongue controls and a jaw opening by place of articulation; the jaw opening belongs to the pose.

## Publication

Write mesh numbers as the shortest decimal that reads back to the same float32, to stay well under the viewer page's 256 MiB publication cap.

## Ruled out, with the reason

- A predetermined sparse polynomial or primitive family: boundaries and named measurements agreed while the anatomy was lost, and five keys on the head converged into a cone.
- Full profiles for a local feature: a full section carries no feature location or depth, so the navel disappeared. Carry a local feature by its own location and depth.
- Features as residuals against a coarse surface: a broad difference is not a feature, and the extractor carved deep flank and lumbar grooves.
- Square collocation at arbitrary phases: it amplified foot section spans about 2,800 times. Use a standard periodic interpolant.
- Forcing fine source derivatives across sparse keys: a 509 mm coefficient excursion appeared inside an 82 mm interval. Let a family generate its own derivatives.
- Choosing counts or smoothing by held-out rows of one mesh: neighbouring rows predict each other, so the score improves until the model reproduces the mesh. Hold out whole people.
- Closing a girth through depth alone: a girth barely responds to depth, so a small disagreement became 18 mm of chest depth.
- Carrying the trunk's front and back as depths from the widest point: that point wandered 50 mm between layers, and smoothing one side printed stripes at the same heights on every person.
- Taking a tilted crotch ring's horizontal projection as a thigh section: it threw the thigh 8 mm back and 5 mm wide.
- A web floor as a straight chord across the parent's section: it leaves each pinch 83–88° out of the parent's tangent plane, so the skin meets the parent at a right angle.
- A mean foot under anisotropic scales: the heel's posterior corner kept the mean's radius in every person, so feet whose height scale left their heel scale turned that corner by up to 289 degrees per radius.
- A fan of foot sections about one oblique axis: its planes crossed the heel at the web line's obliquity, and the heel's plantar point passed the lateral border's in the plane.
- A level jaw cut for the mouth: it puts the jaw's whole turn into a few millimetres round each corner, stretching that skin more than three times under a 20 mm opening.

## Rules to reuse

- Take each frame anchor from a joint's bind affine by polar decomposition, name its axes as the ISB coordinate systems do, and carry in-plane axes by rotation-minimising transport.
- Start a cap where the section's equivalent radius `sqrt(A / pi)` reaches the pole's height over the section's plane.
- Carry only attachment translation into a child's sizing.
- Under a reflection, reverse phase; under an affine change of station, rescale first and second derivatives by its first and second powers.
- Construct positive progress directly in a length law.
- Check what an existing landmark selects before reusing it.

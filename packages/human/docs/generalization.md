# Human generalization

The rules the construction follows, by part. A better construction replaces any of them.

## Whole body

`AutoMovieHumanBodyLaw` generates every chain in world millimetres from the top down: the head's rise sets where the neck ends, the neck carries the shoulders, the column runs to the crotch's height, and the limbs start from the column. `AutoMovieHumanSkeletonLaw` places the skeleton first, and the limbs loft on it.

- Drive dense sections from sparse dimensions: a per-section centre, frame and in-plane affine, interpolated between a dozen anchors, carries most of the difference between people.
- Separate sex from length with people at the ends of height, fat, muscularity and masculine-feminine, and judge a law on people reserved from every fit.
- Fit slopes on every person and levels on the people inside the domain.
- Fit against a control's achieved value.
- Bound the stated domain by tape ratios as well as tapes, so every test person is a whole person.

## Tapes

- Locate each tape by its published definition: an upper-arm tape is square to its bone; the thigh, knee and calf audits use horizontal planes. A construction's bone-normal section is not a substitute for the declared measurement plane.
- Close a girth through a shared scale of width and depth, in which a girth is linear.
- Let width follow the tapes at about 0.8 and front depth from about 0.6 at the waist to 0.1 near the neck, as measured over 67 people.
- Solve a tape against the hull of the section it wraps.
- Normalize an elliptical section by its own hull perimeter; an equivalent-area circle is a different tape.
- Close the assembled surface, including root handovers and event joins. A tape closed on a bare section can change when its neighbours are composed.
- Preserve every closure constraint through fairing. In the 2026-11-02 trunk survey, the existing fairing operator retained only 62.6–93.6% of a unit correction at its own tape key and transferred corrections into adjacent keys.

## Leg

Both legs come from one construction and a reflection in `AutoMovieHumanLegConstruction`, lofted on the femur and tibia.

- Place the leg's axis by a line per station in a constant, leg length, hip tape and the masculine-feminine control.
- Place the crotch by a line in stature, inseam, thigh and the masculine-feminine control, counting the neck and face stretches in the stature's share.
- Take the leg's sections square to its bone, and let only its last interval reach the tilted crotch ring.
- Give the thigh and the trunk one shared direction where they meet.

## Foot

Both feet come from `AutoMovieHumanFootConstruction`: a mean foot as a sparse section field, harmonics per chain carried between anchor stations by natural splines.

- Scale the toe and the heel separately about the ankle.
- Smooth the field by the inverse of the knot filter.
- Make the ball of the foot one padded surface that the plantar skin near each web follows, and close each toe by its own tangent cap.

## Trunk

The trunk and shoulders come from one column in `AutoMovieHumanTrunkConstruction`, a closed-form section whose measures run from the crotch to the neck.

- Carry the front and back as places.
- Start a settle above a shared ring, and keep a layer's height when a ring settles.
- Join a neighbour by a fillet over one radius of the child's layers; an end slope m over a span h stands `4/27 m h` off the chord.
- Keep a shoulder's ring convex.
- Let the rear fall under the buttock's crest as the square of the height.
- Hold the front midline, the widest point and the rear midline at fixed phases, and space the rest by arclength.
- Set the crotch fold's softness at 1.25 times the larger of the ring's pitch and the row spacing.

## Arm and hand

The arm and digits loft in their own bone frames: sections square to each bone, frames carried by least rotation, each child starting from a round section that clears its arc.

- Size the arm's root from the shoulder ring's area times the cosine of the bone's tilt.
- Hand the forearm's tube to the hand only from the wrist crease to the branch, with its long axis on the hand's breadth, so the least girth sits at the crease.
- Solve the scale across the hand so the section through knuckles II and V spans the breadth input.
- Scale the elbow's turn with the elbow's radius.
- Derive both event arcs from one canonical boundary and reflect them exactly. Use a phase sample set closed under that reflection; midpoint samples avoid exchanging a missing endpoint. On wide, fixing both reduced the reflected shoulder-ring error from 0.412578 mm to 6.83e-13 mm in a controlled comparison.
- Include the parent's skin where a clinical plane crosses a shared boundary. The arm plus `upper` selection reproduces the complete skin's closed cut on all nine people; arm-only opens the m1 and masculine biceps cuts.
- Include an exact measured landmark among the candidates when comparing it with a sampled minimum. A 1 mm wrist scan skipped stylion and falsely reported six negative minimum differences of 0.0011–0.0080 mm.
- Next: build each web junction's palm side as one blended surface over its four boundaries, sample the palm finely enough for the metacarpal-head grooves, then derive the knuckle grooves from the heads' gap.

## Webs

A web is a saddle: above its crest the two children are one sheet, the parent continued, and below it two walls leave sideways. Mesh it even in `w = sqrt(z)` about its crest, with level rows and a translational chart near the pinches.

## Neck and head

- Hand the neck to the head as a cubic Hermite span from the ring's own place and slope to nothing.
- Keep midline rays a millionth of a radian off the midline.
- Solve each head measure against the construction's own surface at its Farkas landmark, with every ratio at its definition.

## Nose

- Build the base from its anatomy: a surface rising from the lip at the columella's angle, the tip lobule reaching down to it, rounded alar lobules with their crease, and two teardrop nostrils split by the columella. Keep the base edge under the nose.
- Give every rounding a floor set by the sampling.
- Round a nostril's pocket toward a circle as it deepens.
- Keep a meridian's handle within half the rim's distance from the opening's axis, and step a meridian evenly in its length plus its turning.
- Shade only skin that faces into a pocket, from the rim inward, by the share of sky a wall at depth h of a tube w half wide sees, about `1 - h / hypot(h, 2w)`.

## Lower face

- Make the mandible a volume joined to the head along each ray by a smooth minimum.
- Draw its arch in plan as a round chin joined by straight sides to an ellipse about the gonions; the chin turns with the curvature of the parabola through the chin's front and both gonions.
- Lean the jaw's side in from the cheek's own width at the zygomatic arch down to the gonion, as the masseter runs.
- Read the skin under the jaw along rays from a point on the midline behind the gonions.
- Turn the skin under the border on an ellipse sized to the underside the neck leaves.
- Next: make the face's sides below the cheek follow the mandible.

## Ear

Sample the ear's sections at uniform indices, and fade a join's correction with distance from the parent's ring.

## Rig

`AutoMovieHumanRig` gives every part a binding, and a pose moves the prepared skin without generating it again.

- Weight a vertex by its place alone, so every copy of a seam point moves together.
- Pass skin down the skeleton as a tree of cuts: each joint holds a plane and a ramp.
- Take pose zero as anatomical neutral; the generated A-pose stays the skin's bind, and one rotation per bone reaches neutral.
- Blend by dual quaternions, and evaluate the same blend in every consumer of a posed skin.
- Size each ramp for its joint: stretch is about `1 + theta rho |grad w|`, for the joint's turn theta from the bind, the skin's distance rho from the joint centre and the weight gradient, so the ramp widens with the joint's range and the stretching side's radius.
- Let the side of the chest share the arm's raise on the shoulder girdle's bone.

## Mouth

- Open the skin along the lips' contact line, and give the jaw a point's share by its side of that line, fading toward the corners.
- Press the lining's inner faces together across the slit, so the lips meet at rest.
- Stand the teeth on a standard arch placed from the head, and check that they lie under the skin.
- Map each viseme to FACS units, tongue controls and a jaw opening by place of articulation; the jaw opening belongs to the pose.
- Next: bind the lining round the tongue's base to the jaw as the tongue is, then open the mouth.

## Publication

Write mesh numbers as the shortest decimal that reads back to the same float32, to stay well under the viewer page's 256 MiB publication cap.

## Ruled out, with the reason

- Changing `AutoMovieHumanBodyGirth` to repair the current figure's tape errors: the 2026-11-02 source survey found zero production callers. The live closures are the fitted station/ratio keys in `ArmConstruction`, `LegConstruction` and `TrunkConstruction`, with separate neck size regressions. The unchanged nine-person baseline reports 55 trunk, 105 arm and 54 leg failures; see `campaign-baseline.md`.
- Treating the baseline leg errors as ellipse-to-circle normalization: the leg already normalizes the convex-hull perimeter with `PolarSection.girth`. Its thigh and knee ratios contribute less than 0.7 and 0.05 mm, respectively, against observed errors of 37.3–118.5 and 22.8–52.3 mm. Private sites and the final handover must be measured instead. The calf ratio explains most of eight people's errors, but removing its contribution still leaves narrow 8.45 mm too large.
- Attributing the leg's crotch handover to the generic event fillet: `TrunkConstruction.apply` declares that event `shared`, so `EventJoin.reconcile` skips it. Its shape must be traced through the leg's own handover and the trunk-owned ring.
- Bypassing the arm's event fillet to fix its residual root crease: on wide the unjoined crease is 44.141/43.873 degrees, the normal join reduces it to 24.932/25.009, and removing the fillet spread worsens it to 32.827/33.418. The collar needs a construction satisfying continuity and the tape together, rather than disabling continuity.
- Blaming a missing parent triangle for every residual biceps error: seven people's arm-only and full-skin cuts agree. Narrow has no parent triangle at that plane and its fixed root lies wholly proximal; its bare cut is 215.545 mm against 215 mm, while the shoulder blend and join produce 228.240 mm. Conversely, masculine needs the parent and changes from 257.871 to 260.928 mm with the complete region.
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
- A level jaw cut for the mouth: it puts the jaw's whole turn into a few millimetres round each corner, stretching that skin more than three times under a 20 mm opening.

## Rules to reuse

- Take each frame anchor from a joint's bind affine by polar decomposition, name its axes as the ISB coordinate systems do, and carry in-plane axes by rotation-minimising transport.
- Start a cap where the section's equivalent radius `sqrt(A / pi)` reaches the pole's height over the section's plane.
- Carry only attachment translation into a child's sizing.
- Under a reflection, reverse phase; under an affine change of station, rescale first and second derivatives by its first and second powers.
- Construct positive progress directly in a length law.
- Check what an existing landmark selects before reusing it.

# Human generalization

## Recovery after the rejected campaign candidate

The Human runtime and its engine, interface and ingest changes from PR #3038 were restored to commit `681f8a7774618eedf708d817d6ba3d5562c87495`. The candidate lacked an independent whole-person acceptance result and its actual renders regressed. Its anatomical, measurement-site, rig and path-refinement changes therefore establish no accepted construction rule. Restoring the original source preserves its curve and section density; this recovery does not simplify the lofts or claim that the original defects are solved.

The dedicated development viewer already exists in that baseline through PR #3041, with capture completion fixed by PR #3042. The retained component page displays supplied mesh vertices, original normals and generating curves without generating or repairing anatomy. Its successful captures establish display behavior only. The removed candidate measurements and provisional protocol are not an anatomical oracle; replacement tests must read the emitted skin independently and derive expectations from public inputs, reference observations or cited anatomy.

## Independent verification

The raw-array observers read saved emitted coordinates and indices without importing the Human construction, interpolation, measurements or rig. Their successful controls establish the observer's stated mathematical contract; they do not establish that a generated person is anatomically correct. Keep correct-output, actual-buffer defect and known-input-change controls on the same observer path.

- Measure the indexed surface. The saved f1 skin contains 289,042 buffer vertices but only 286,021 referenced vertices; its 3,021 unused vertices cannot establish a crown, a sole or a skin spike. Correct indexed geometry with unused extreme coordinates must remain green, and short floating geometry with unused answer coordinates must remain red. Check referenced narrow spikes directly so an area-weighted percentile cannot hide them.
- Gate finite normal-line separation separately from nearest Euclidean separation. The oblique control has normal separation `31/3` mm and nearest separation `31/(3 sqrt(2))` mm; the latter is below its independently fixed 8 mm control contract while the former must fail. That fixture allowance supplies no clinical tolerance, and missing normal support remains unavailable.
- Fix source-region coverage from the original raw source parts before examining the candidate. Candidate labels or cropping cannot redefine the answer's support. Missing or duplicate original head/body parts and unassigned original source samples must refuse acceptance. Nearest-distance diagnostics cannot stand in for a complete normal-distance score or genuine held-out improvement. Correspondence between the source head carrier and the native canonical topology remains under investigation; current head distances cannot be presented as errors of the external face alone.
- Keep native source courses distinct from independently registered clinical sites. In f1, the original `Chest`, `Waist` and `Hip` courses have maximum separation from the original raw source skin of 18.655, 10.863 and 19.326 mm respectively. This rejects treating those courses as exact skin-bound clinical answers. Retain the source residual and candidate residual separately; the source residual is neither a free candidate tolerance nor a reason to alter the original dimensions.
- Check numerical support before reporting material strain. Positive finite triangle area does not establish a usable tangent basis. In the saved `tall` test output, bind-mesh `head.upper` faces 316430, 317065 and 329242 have basis conditions from approximately `2.43e13` to `8.62e14`; their readings in `neutral`, `demo` and `limit` remain unavailable, nine readings in total. These triangle addresses belong to that person's mesh. Preserve bind/posed corners, altitude ratio, conditioning, world-coordinate resolution and orthogonalization residual with the refusal. An arithmetic screen is an engineering guard, not a certified error bound or an anatomical allowance.
- Assess thin faces by their actual numerical support rather than rejecting every thin triangle. In the saved `wide` test output, bind-mesh `ear.lobe.left` face 383720 has a basis condition of approximately 1129.95. Eighteen identity, right-angle rotation and uniform-scale controls across its six vertex permutations pass, as do six permutations of its actual `demo` posed map. The observed maximum principal stretch, approximately 140.862398820536 to 140.862398820538, belongs to that person's particular material face and pose; it supplies neither a universal clinical threshold nor a whole-body stretch claim.

The maintained controls are [raw reference comparison](../../../test/src/features/human/test_human_raw_reference_oracle.ts), [indexed placement](../../../test/src/features/human/test_human_raw_placement.ts) and [material deformation](../../../test/src/features/human/test_human_raw_deformation.ts). The recovery's seven acceptance gaps remain:

1. Independently registered clinical sites and fine anatomical regions on the raw source.
2. Every public control at both declared range ends and combined extremes.
3. Actual public model refinements and every subsystem, including oral geometry.
4. Forbidden skin-inside-skin and global self-intersection.
5. Every supported pose and each independently defined clinical joint endpoint.
6. Genuine whole-person training exclusion and held-out normal-distance improvement over the stature-only baseline.
7. Complete whole-model appearance and clay acceptance; the fresh f1 public-consumer captures establish that its appearance displays, not acceptance across people, parts or poses.

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

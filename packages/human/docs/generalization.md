# Human generalization

What the construction taught, by part. Each finding is a cause found on a generated figure and the rule that answers it. A better construction replaces any of them.

## Whole body

`AutoMovieHumanBodyLaw` generates every chain in world millimetres from the top down: the head's rise sets where the neck ends, the neck carries the shoulders, the column runs to the crotch's height, and the limbs start from the column. `AutoMovieHumanSkeletonLaw` places the skeleton first, and the limbs loft on it.

- Sparse dimensions can drive dense sections. Interpolating a section law between a dozen anchors cost at most 14 percent against fitting every section, while a per-section centre, frame and in-plane affine explained most of the difference between people.
- Four people cannot separate sex from length. People at the ends of height, fat, muscularity and masculine-feminine separate them, and people reserved from every fit judge the law.
- Fit slopes on every person and levels on the people inside the domain. A level fitted across acquired people carries their shared starting body.
- Fit against a control's achieved value, not its request: an end can fall far short of what was asked.
- People at the ends of a test are whole people. A chest of 1300 mm over an underbust of 742 mm is no body, so the stated domain bounds tape ratios as well as tapes.

## Tapes

A tape is exact only where the construction solved it. The trunk closes each tape at a fixed station of its column, the leg at fixed leg fractions and the arm at fixed shares of its walk, each with a fitted ratio, so the skin misses the same tape at its published site: on f1 the knee was solved 66 mm below the joint and reads 359 mm at mid-patella against 327, and the thigh was solved 96 mm under the crotch and then flares into the crotch ring.

- Locate each site on the part's own sections by its published definition, square to the bone on a limb, and solve the section's hull there with no ratio.
- Girth is insensitive to depth, so closing a girth through depth alone turns a small disagreement into a large change of depth. A shared scale of width and depth works, because a girth is linear in it.
- Width follows the tapes at about 0.8 and front depth from about 0.6 at the waist to 0.1 near the neck, over 67 people.
- Solve a tape against the hull of the section it wraps, never an extent approximation.

## Leg

Both legs come from one construction and a reflection in `AutoMovieHumanLegConstruction`, lofted on the femur and tibia.

- The leg's axis is a line per station in a constant, leg length, hip tape and the masculine-feminine control. A fixed stance explained four people and failed held out; an axis in leg lengths alone failed the extremes by up to 54 mm.
- Crotch height is a line in stature, inseam, thigh and the masculine-feminine control. Inseam alone misses by 20 mm. The neck and face stretches change the stature after the leg scale is chosen, so the crotch's share must count them.
- A crotch ring is tilted, so its horizontal projection is not a section. Only the leg's last interval reaches the ring.
- The line across the thighs at the crotch ring comes from the two chains leaving in different directions: the thigh arrives rising forward while the trunk leaves receding. The chains must share a direction where they meet.

## Foot

Both feet come from `AutoMovieHumanFootConstruction`: a mean foot as a sparse section field, harmonics per chain carried between anchor stations by natural splines.

- People share their foot closely under a separate toe and heel scale, because the ankle's place along the foot differs between people.
- A smooth field needs only the inverse of the knot filter, which is linear in the section size; a square projection per section costs more than the whole foot.
- The ball of the foot is one padded surface. Plantar skin near each web follows one pad, and each toe closes by its own tangent cap.

## Trunk

The trunk and shoulders come from one column in `AutoMovieHumanTrunkConstruction`, a closed-form section whose measures run from the crotch to the neck.

- Carry the front and back as places, not depths from the widest point. That point wanders between layers, and smoothing one side prints the wander as stripes.
- Start a settle above a shared ring, not at it, and keep a layer's height when a ring settles.
- Do not carry a neighbour's tangent into a ring by a local bump; it prints a collar.
- An end slope m over a span h stands `4/27 m h` off the chord. Agreeing on a ring is not agreeing beside it: normals matched on a shared ring can part by 20 to 30 degrees a few millimetres away, so a fillet over one radius of the child's layers follows the join.
- A shoulder's ring is convex. A deltopectoral valley running to the top of the shoulder reads as a sleeve seam.
- Under the buttock's crest the rear falls as the square of the height.
- Hold the front midline, the widest point and the rear midline at fixed phases and space the rest by arclength, or a section crowds at the crotch's tip or slides on the widest people.
- At the crotch the fold's softness comes from the sampling, 1.25 times the larger of the ring's pitch and the row spacing. A fold narrower than the control pitch prints teeth.

## Arm and hand

The arm and digits loft in their own bone frames: sections square to each bone, frames carried by least rotation, each child starting from a round section that clears its arc.

- A shoulder ring is a level cut of an arm that leaves it at an angle. The root's square section comes from the ring's area times the cosine of the bone's tilt; taken as is, it inflates the root and reads as a deltoid cap.
- The wrist reads as a mitten when the tube hands over to the heel's skin across the crease. Handing over only from the crease to the branch puts the least girth at the crease, and the tube's long axis lies on the hand's breadth.
- The scale across the hand is solved so that the section through knuckles II and V spans the breadth input. A ratio from an input to a fitted measure hides a broken definition.
- The elbow's turn scales with the elbow's radius; a turn of fixed length pinches harder on a thicker arm.
- Open: the palm side of each web junction crumples, with its sharp edges inside the web surface past the palm's end. The knuckle grooves are still a hand-set valley, because a groove derived from the metacarpal heads' gap is tighter than the palm's sampling resolves.

## Webs

A web is a saddle: above its crest the two children are one sheet, the parent continued, and below it two walls leave sideways. It is meshed even in `w = sqrt(z)` about its crest, with level rows and a translational chart near the pinches.

- A web floor cannot be a straight chord across the parent's section: the chord leaves its pinch nearly at a right angle to the parent's tangent plane.
- Columns hanging from each child's arc fail, and so does a crest centred in the slot.

## Neck and head

- The neck hands over to the head as a cubic Hermite span from the ring's own place and slope to nothing. A weight whose slope disagrees with the neck's throat prints a ridge that reads as a notch.
- A ray cast exactly along the midline can pass through a ring's own vertices and drop the crossing; rays keep a millionth of a radian off it.
- Head ratios fitted to stand-in inputs inflate every head dimension once the inputs are measured by their definitions. Each head measure must be solved against the construction's own surface at its Farkas landmark.

## Nose

- The base is built from its anatomy: a surface rising from the lip at the columella's angle, the tip lobule reaching down to it, rounded alar lobules with their crease, and two teardrop nostrils split by the columella. Carried past the wing, the base edge cuts the lobes into a ledge.
- Every rounding needs a floor set by the sampling: a rounding finer than the control pitch aliases into a zigzag.
- A nostril's pocket rounds toward a circle as it deepens. A pocket made by shrinking the rim keeps the rim's sharp ends at every depth.
- A meridian's handle is at most half the rim's distance from the opening's axis, and a meridian is stepped evenly in its length plus its turning.
- A pocket shades only skin that faces into it, from the rim inward, by the share of sky a wall at depth h of a tube w half wide sees, about `1 - h / hypot(h, 2w)`.

## Lower face

- The mandible is a volume joined to the head along each ray by a smooth minimum. Without it the turn under the jaw is a bag's.
- The arch in plan is a round chin joined by straight sides to an ellipse about the gonions; the chin turns with the curvature of the parabola through the chin's front and both gonions. A flat-fronted superellipse makes the lower face a box.
- Above the border the jaw's side leans in from the cheek's own width at the zygomatic arch down to the gonion, as the masseter runs.
- The skin under the jaw is read along rays from a point on the midline behind the gonions. The exact distance to a hull creases where two pieces are equally near.
- A crisp border at the mandibular plane slices the skin into a flange when the sections run near that plane; the turn under the border is elliptic, sized to the underside a thick neck leaves.
- Open: below the cheek the face's sides do not yet follow the mandible, so heavy jaws read square.

## Ear

The ear's sawtooth came from resampling sections by arclength, which slid every phase as a section's length changed. Keeping uniform indices fixed it with no new numbers. A join's correction fades with distance from the parent's ring.

## Rig

`AutoMovieHumanRig` gives every part a binding, and a pose moves the prepared skin without generating it again.

- A vertex's weights depend on its place alone, because a seam holds copies of one point in separately tessellated parts.
- Skin passes down the skeleton as a tree of cuts: each joint holds a plane and a ramp as wide as the skin is deep there. Capsules compared along a limb carry a shell far past the next joint.
- Pose zero is anatomical neutral. The generated A-pose stays the skin's bind, and one rotation per bone reaches neutral.
- Dual quaternions keep a bent limb's volume where a linear blend thins it. Every consumer of a posed skin must evaluate the same blend as the shader.
- Stretch at a joint is about `1 + theta rho |grad w|`, for the joint's turn theta from the bind, the skin's distance rho from the joint centre and the weight gradient. A ramp sized by the nearest skin rather than the stretching side and the joint's range tears the knee, elbow, groin and axilla at their range ends.
- The axilla cannot stay under twice its length by a blend about the shoulder alone: the side of the chest must share the motion, on the shoulder girdle's bone.

## Mouth

- The skin opens along the lips' contact line, and the jaw's share is read by a point's side of that line, fading toward the corners. A level jaw cut puts the jaw's whole turn into a few millimetres round each corner.
- The lining's inner faces meet across the slit, so the lips meet at rest.
- Teeth stand on a standard arch placed from the head and are not scaled with it, since adult crowns vary little; that they fit under the skin is measured, not assumed.
- Visemes map to FACS units, tongue controls and a jaw opening by place of articulation; the jaw opening belongs to the pose.
- Open: the tongue's base follows the jaw while the lining round it follows partly the jaw, so the tongue passes through the lining at a wide opening. Until that holds on every person the mouth stays sealed.

## Publication

The viewer page's publication has a 256 MiB cap. Mesh numbers written as full float64 text take most of it although the viewer reads them as float32, so any new part can push a person past the cap.

## Disproven strategies

- A predetermined sparse polynomial or primitive family: boundaries and named measurements agreed while the anatomy was lost.
- Few keys on a complex part: the head converged into a cone.
- Full profiles for a local feature: the navel disappeared, because a full section carries no feature location or depth.
- Features as residuals against a coarse surface: a broad difference is not a feature.
- Square collocation at arbitrary phases: it amplified section spans thousands of times. Use a standard periodic interpolant.
- Forcing fine source derivatives across sparse keys: coefficients swung far outside the interval. Let a family generate its own derivatives.
- Choosing counts or smoothing by held-out rows of one mesh: neighbouring rows predict each other, so the score improves until the model reproduces the mesh.

## Rules to reuse

- Frames: take each anchor from a joint's bind affine by polar decomposition, name its axes as the ISB coordinate systems do, and carry in-plane axes by rotation-minimising transport.
- Caps: start a cap where the section's equivalent radius `sqrt(A / pi)` reaches the pole's height over the section's plane.
- Placement: carry only attachment translation into a child's sizing.
- Maps: a reflection reverses phase, and an affine change of station rescales first and second derivatives by its first and second powers.
- Length laws: construct positive progress directly; zero-jet interpolation of endpoint displacement can reverse a contraction.
- Landmarks: check what an existing landmark selects before reusing it.

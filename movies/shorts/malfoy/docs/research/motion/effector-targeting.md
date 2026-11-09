# Effector targeting

How every action in the four films is authored as a body part brought to a target, with the rest of the body solved from the contacts, as the [motion instruction](../../instructions/motion.md#effectors-to-targets) requires. The study records the established techniques, the laws a contact follows, what the installed packages can and cannot do, and the measurable targets a contact must meet on screen. Source keys refer to the [research index](../index.md).

## The principle

An action is defined by its contacts, not by its joint angles. Each contact names an **effector** (a hand's palm, a pinch between thumb and index finger, a sole, the seat), a **target** (a point or surface on a person, an object or the set), a **time window** in which the effector travels to the target, and a **hold** during which it stays there. The body is then solved so the effectors meet their targets while the supports carry the weight. This is the common premise of three established techniques:

- **Inverse kinematics (IK)** solves joint rotations from an end-effector goal. For a two-segment limb (upper arm and forearm, thigh and shin) the solution is closed-form: the elbow or knee angle follows from the law of cosines over the two segment lengths and the shoulder-to-target distance, "θ₂ = arccos[(x² + y² − d₁² − d₂²) / (2 d₁ d₂)]", and the limb then aims at the target (juckett-2008, "Math review"). The same distance has two solutions bending in opposite directions, so the bend direction (elbow down and out, knee forward) is a stated choice, not a computed one (juckett-2008). A target beyond reach makes the cosine leave [−1, 1]; clamping it gives "the best non-valid solution" — the limb points straight at the target and stops short (juckett-2008). Longer chains (spine to hand, several end effectors at once) use iterative solvers; FABRIK "starts from the last joint of the chain and works forwards, adjusting each joint along the way. Thereafter, it works backward in the same way" (aristidou-2011, p. 245, §4), handles several end effectors by placing a shared sub-base at "the centroid of all these positions" (p. 247, §4.1), and joint limits by re-orienting the target into the allowed cone (p. 248, §4.3).
- **Foot planting** keeps a foot fixed on the ground while it supports. A footplant is a period "when a foot or part thereof remains in a fixed position on the ground", and its violation is the artefact called footskate (kovar-2002, p. 1, §1). A plant is declared over frames as "either the heel or the ball … planted" (p. 2, §2); the root is translated so the planted foot can reach its spot, and the legs are solved by limb IK (pp. 5–6, §§4.3–4.4). Adjustments are blended in and out with the C1 curve α(t) = 2t³ − 3t² + 1 over short windows, "5 to 10 frames (a sixth to a third of a second)" at 30 fps (p. 4, §4.2; p. 7, §5).
- **Motion warping** bends a whole movement toward a target inside a window instead of rebuilding it. Unreal Engine's version names a **warp target** and adapts root translation and rotation only inside a "Motion Warping" notify window — "customizable areas with start and end times that you can align to areas of the animation where warping is best applied" — so the movement's shape stays while its end lands on the target (epic-motion-warping, "Animation Montage", "Details"). Witkin and Popović's original paper (SIGGRAPH 95, pp. 105–108) is named here but was not retained (witkin-1995 is only the project page), so nothing below relies on it.

## Laws of a contact

Each law is the production's adoption of the techniques above.

1. **Shape prior in the performer's body frame.** Each action keeps a characteristic shape relative to the performer's own pelvis and chest (a reach leads with the hand and lets the shoulder follow; a step lifts the heel before the toe). The target bends that shape; it never replaces it with an absolute pose.
2. **Approach, contact, hold, release.** Every contact has four phases. *Approach*: the effector travels inside a warp window that ends at contact. *Contact*: the effector arrives at the target surface with its approach direction (a palm arrives on the side of a wrist, a sole arrives from above). *Hold*: the effector stays on the target, following it if the target moves. *Release*: the effector leaves inside its own blend window.
3. **Supports first.** At every moment the solver knows which effectors carry weight (feet on the floor, seat on a bench or broom). Supports are solved before free effectors, and a reach never moves a planted support.
4. **Reach before step.** A target within the arm's reach from the current stance is met by the arm, then the spine; a target beyond it requires the root to move — a lean within balance, or a step whose foot is itself planted on a new target. No limb stretches: unlike kovar-2002, which allows leg length changes up to 2.6 % (p. 7, §5), the Human figure's segment lengths are its identity and stay fixed.
5. **Track or freeze.** A moving target (the crane in flight, the Snitch, a falling person's wrist) is tracked through the approach window; at contact the hold either follows the target (a grip that pulls with it) or the target is frozen to the effector (a caught object becomes attached to the hand).
6. **Bend direction is declared.** Elbows bend down and outward and knees forward over the toes unless an action states otherwise, because the two-bone solution is otherwise ambiguous (juckett-2008).

## Outcome table {#outcome-table}

The outcome class is decided by the screenplay; geometry realizes it and an audit confirms it.

| Intent | Geometric condition at contact time | Outcome |
| --- | --- | --- |
| Reach to a static target | Target within the reach shell from the stance | Contact by arm and spine |
| Reach to a static target | Target beyond the reach shell | Step or lean first, then contact; if neither is staged, a stated miss |
| Reach to a moving target | Effector and target meet inside the approach window | Contact, then hold follows or freezes the target |
| Reach to a moving target | Target leaves the window before the effector arrives | Miss: the hand closes on air and the audit records the gap |
| Two hands to one object | Both reach their grip points | Shared hold; the object follows the stronger pull or tears, as the screenplay decides |
| Foot to floor or step | Sole reaches the surface inside its swing window | Plant; the foot stays fixed until lift-off |
| Seat to bench or broom | Pelvis lowered until the seat surface carries the weight | Seated support; the feet stay planted or move to stirrups |

## Contact inventory {#contact-inventory}

| Contact | Effector and target | Support during it | Notes |
| --- | --- | --- | --- |
| Wrist grip | Palm, fingers and thumb around the other person's forearm just above the wrist crease | Both feet planted | An adult female hand measures about 181 mm from wrist to fingertip and the wrist circumference about 1.98 × hand breadth (about 155 mm for a 78 mm hand) (automovie-human, `packages/human/docs/anatomy/hand.md` lines 11–17), so a closed hand encircles a teenager's wrist with the thumb overlapping the fingers |
| Pinch on paper | Thumb pad against index pad on an edge, a fold or a wing | Feet planted or seated | Paper is held at its edge, never through its face |
| Handover | The giver's pinch on one end, the receiver's on the other | Both planted | See the [handover study](../movement/teen-bodies-and-everyday-movement.md#handover) |
| Foot to floor | Heel then ball onto the floor; ball then toe leave | Alternating | See the [gait study](../movement/teen-bodies-and-everyday-movement.md#gait) |
| Foot to step | As above, onto the step's top surface | Alternating | The step's height raises the planted foot; the root rises with the supporting leg |
| Seat to bench | Both buttocks onto the bench top; thighs on the seat edge | Feet planted in front | See [sitting](../movement/teen-bodies-and-everyday-movement.md#sit-and-stand) |
| Seat to broom | Inner thighs and seat astride the shaft | Feet in the stirrups, hands on the handle | See the [riding study](../flight/broom-riding-and-snitch-catch.md#riding-astride) |
| Hands to broom handle | Both hands in a power grip, one ahead of the other on the shaft | Seat on the broom | The handle steers; the hands stay on it except to catch or reach |
| Hands to a rider's waist | Pillion's hands on the front rider's waist at the hip bones | Seat behind, feet in the rear stirrups | See [riding pillion](../flight/broom-riding-and-snitch-catch.md#riding-pillion) |
| Catch | The catching hand's palm to the Snitch, fingers closing around it | Seat on the broom, other hand on the handle | See [the catch](../flight/broom-riding-and-snitch-catch.md#catching) |

## Chaining and spatial strategy

A beat is a chain of contacts. Each contact's release overlaps the next contact's approach, so the body never waits in a neutral pose between them (a step's foot plant starts the next reach). Locomotion is itself a chain of foot targets along a path: the walk is "placing each foot onto the floor", with each foot target set on the path at the step length the gait study gives, and turns made by rotating each new foot target. Staging names targets by landmark (the bench's seat, the platform's edge, the Snitch) rather than by coordinates; the set or object supplies the target's position at each time.

## Tempo

Approach windows follow the reach timing of the [reach-to-grasp study](../movement/teen-bodies-and-everyday-movement.md#reach-to-grasp) (0.68–0.97 s for an unhurried reach, faster when urgent). Blend windows in and out of a hold are 4–8 frames at 24 fps (0.17–0.33 s), the same durations kovar-2002 used at 30 fps (p. 7, §5). A hold lasts as long as the screenplay's beat; a planted foot's hold is its stance time.

## Installed capabilities

The workspace packages already provide target-driven solvers; this production uses them rather than hand-set joint angles. Line numbers refer to the installed sources.

| Need | Installed API | What it does | Limit stated by the source |
| --- | --- | --- | --- |
| Hand or ankle to a world point on a Human figure | `AutoMovieHumanLimbIk.prepare(evaluate)(request)` (`packages/human/src/skeleton/AutoMovieHumanLimbIk.ts` lines 10–53) | Solves arms and legs toward world-space hand and ankle goals from a root placement; `handOffset` extends the effector to a held object's tip | Goals are met within limits; residual reported |
| Several weighted targets at once | `AutoMovieHumanClinicalIk.solve(evaluate, seed, {channels or chain, targets})` (`packages/human/src/skeleton/AutoMovieHumanClinicalIk.ts` lines 33–58) | Damped Gauss-Newton over the clinical pose channels toward bone targets with weights | "Singular and unreachable poses terminate with their residual" |
| Feet on the floor without penetration | `AutoMovieHumanGrounding.prepare(evaluate, footVertices)` (`packages/human/src/skeleton/AutoMovieHumanGrounding.ts` lines 16–43) | Fits targets while keeping the whole foot above the floor; reports `admitted` or `unresolved` | Status must be read |
| A body resting on a support plane | `AutoMovieHumanSupportFrame.prepare(reference, contacts)` (`packages/human/src/skeleton/AutoMovieHumanSupportFrame.ts` lines 33–48) | Plants a contact triangle on a support plane, producing IK targets | Three contacts |
| Root height from supporting legs | `AutoMovieHumanLegIk.supportHeight` (`packages/human/src/skeleton/AutoMovieHumanLegIk.ts` lines 116–128) | Lowers or raises the root so supporting feet reach their plane | Seed, not a support certificate |
| World joint positions of a pose | `AutoMovieHumanSkeleton.prepare(params).evaluate(pose)` (`packages/human/src/skeleton/AutoMovieHumanSkeleton.ts` lines 44–52) | Forward kinematics: every bone's world placement | — |
| Closed-form limb bend | `solveTwoBoneIK(upper, lower, distance)` (`packages/engine/src/kinematics/solveTwoBoneIK.ts` lines 6–43) | Law-of-cosines bend and lift, clamped and flagged when out of reach | Caller orients the chain and chooses the bend plane |
| Prop riding a hand | `resolveAttachment` (`packages/engine/src/kinematics/resolveAttachment.ts` lines 16–67) | Places a rigid child on a parent bone by FK | Parent bone must be in the engine's humanoid vocabulary; not a dynamic joint |
| Walk along a path with planted feet | `followPathMotion` then `plantStanceFeet` (`packages/engine/src/motion/followPathMotion.ts` lines 48–66; `plantStanceFeet.ts` lines 43–72) | Bakes a gait along waypoints, then pins stance feet and refits legs | Engine humanoid skeletons; "does not guarantee exact no-skate contact" |

Two boundaries matter. First, the engine's planting and path solvers work on engine humanoid skeletons, and no installed converter turns a solved engine pose back into a Human pose (`AutoMovieHumanEnginePose` converts only from Human to engine, `packages/human/src/instance/AutoMovieHumanEnginePose.ts` lines 13–30); for the Human figures, the Human-side solvers above carry the contacts. Second, the Human facade controller itself has no "foot-contact solving, balance, physics" (`packages/human/docs/stickman-control.md` line 35), so every plant and hold is solved by the production's own behaviour code through those solvers, not assumed from playback.

## How it is shot

A contact is legible only when the camera sees the effector and the target together at the contact frame. The [coverage study](../cinematography/vertical-short-coverage.md) gives inserts and two-shots for that purpose; a contact hidden behind a body or cut away from at the contact frame is not established on screen.

## Level markers {#level-markers}

What separates a convincing hint from a beginner's: planted feet that do not slide; hands that arrive on a surface rather than through it; a body that leans and steps because a target asks it to, not because a pose was keyed; holds that follow their target; and releases that start the next contact. A beginner's hint shows sliding feet, hands floating near but not on objects, limbs stretched to targets and bodies frozen between actions.

## Measurable targets {#measurable-targets}

The thresholds are the production's own choices, set so that a contact reads as made at the delivered 720 × 1280 raster, where one pixel spans roughly 2–4 mm on a full-height figure. No retained source gives contact thresholds; kovar-2002 hands contact detection to hand editing (p. 2, §2).

| Quantity | Target | Method |
| --- | --- | --- |
| Planted foot drift during stance | ≤ 1 cm | Foot sole position over the stance frames |
| Foot penetration below its support | ≤ 0.5 cm | Lowest sole vertex against the support plane |
| Hand-to-target distance at the contact frame | ≤ 1.5 cm | Effector point against the target surface |
| Hold drift relative to the target | ≤ 1 cm | Effector point in the target's local frame over the hold |
| Segment length change | 0 | Fixed by the figure |
| Blend window into and out of a hold | 4–8 frames at 24 fps | Frame count |
| Unreachable target | Refused and reported, never stretched | Solver residual and status |

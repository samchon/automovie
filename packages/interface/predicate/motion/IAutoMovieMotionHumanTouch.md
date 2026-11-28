# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.IParams

## @evidence contracts/development/common.md#meaningful-documentation

The tracking setting names a prop target, one bare hand, the initial site, the sampled site, and the played end whose displayed miss may refuse. It gives the position bound in metres and the ordinary planner as its omitted behavior.

## @evidence contracts/development/design.md#principled-representation

The author chooses an observed prop target through the same ID and affordance as an ordinary touch. The written site is used to start the reach, observed displacement guides the existing arm follower, and the displayed effector must meet the actual requested site at the played end.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One optional choice selects the target observation behavior. The scene owns prop animation, the touch owns effector admission, and the performance owns its played interval.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch

## @evidence contracts/development/common.md#meaningful-documentation

The perceived region is the initial planner's input. The live site remains the target used by the prepared follower during reach and hold.

## @evidence contracts/development/design.md#principled-representation

The initial snapshot and sampled region share the same frame format. The follower derives the correction from their difference. A person can also supply the colliders needed for its touch.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One perceived region reader serves person and prop observation. Each target supplies only the geometry its touch needs.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.IParams.balance

## @evidence contracts/development/common.md#meaningful-documentation

The optional part shift runs between its named cue instants. The law uses its own kinematic posture when no balancing shift is given.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.IParams.target

## @evidence contracts/development/common.md#meaningful-documentation

The target identifies the region or site in its declared frame. The chosen target's reader supplies its world position and outward normal.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.IParams.tracking

## @evidence contracts/development/common.md#meaningful-documentation

The observed mode takes one bare hand and a prop site. The placed stroke end checks the displayed hand within 0.01 metres of its requested position.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

The stroke form selects the reach and stroke geometry. A pat is used when this field is absent.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.IParams.effector

## @evidence contracts/development/common.md#meaningful-documentation

The named hand surface selects the physical touch point. The palm is the default. The forefinger uses an end-on layout.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.IParams.hand

## @evidence contracts/development/common.md#meaningful-documentation

An explicit hand selects the side. The default chooses an admitted fit, or the hand already carrying the named tool.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.IParams.site

## @evidence contracts/development/common.md#meaningful-documentation

The optional offset, seeded draw or rule moves the first hand's touch point within the region. Its own point is used when omitted.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.IParams.prop

## @evidence contracts/development/common.md#meaningful-documentation

The optional subject identifies a tool already held by the touching hand. Its named point substitutes for the hand surface.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.IParams.point

## @evidence contracts/development/common.md#meaningful-documentation

This affordance names the working point of the held tool and is required with its subject.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.IParams.grasp

## @evidence contracts/development/common.md#meaningful-documentation

The specified use grip preserves the held tool's presentation against a self target while the tool's working point moves.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.IParams.clear

## @evidence contracts/development/common.md#meaningful-documentation

The positive clearance offsets the stroke along the surface normal in hand lengths and chooses a staged pass with no contact.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.IParams.elbow

## @evidence contracts/development/common.md#meaningful-documentation

The default natural placement minimizes strain. The level choice raises the elbow to shoulder height.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.IParams.arms

## @evidence contracts/development/common.md#meaningful-documentation

The relaxed choice retains bend and is the default. Straight uses the full arm extent to bear on the region.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.IParams.other

## @evidence contracts/development/common.md#meaningful-documentation

An optional second target gives the other hand a concurrent touch. An absent target keeps the action one-handed.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.IParams.rests

## @evidence contracts/development/common.md#meaningful-documentation

The declarations identify the arm segments that bear against the performer's own body during the stroke.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.IParams.count

## @evidence contracts/development/common.md#meaningful-documentation

The positive whole count repeats the stroke. Press, squeeze, hold and stroke default to one repetition. Other repeated forms default to three.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.IParams.hold

## @evidence contracts/development/common.md#meaningful-documentation

The nonnegative hold lasts after repetitions in seconds. It defaults to 1.2 for a press, squeeze or hold and 0.4 for the other forms.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.IParams.tangent

## @evidence contracts/development/common.md#meaningful-documentation

The direction lies in the touched surface. The usual default is up. A self touch may travel across to preserve clearance.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.IParams.manner

## @evidence contracts/development/common.md#meaningful-documentation

The optional performance manner supplies the standard pace and extent controls consumed by the touch clock and stroke.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.body

## @evidence contracts/development/common.md#meaningful-documentation

The body supplies the actor's rig, rest frames, anatomical surfaces and measured reach used for the solve.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.clock

## @evidence contracts/development/common.md#meaningful-documentation

The phrase clock supplies arrival, start and end of the repetitions, and release on the action's local seconds.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.side

## @evidence contracts/development/common.md#meaningful-documentation

The side identifies the hand and arm written by this primitive.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.rest

## @evidence contracts/development/common.md#meaningful-documentation

These entry joint angles give the starting arm and the return target for the transport.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.effector

## @evidence contracts/development/common.md#meaningful-documentation

The contact's hand shape and physical surface choose the moving effector and its skin pad.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.region

## @evidence contracts/development/common.md#meaningful-documentation

The reader takes the current prefix posture and action-local seconds, and gives the site's world point and outward unit normal. Optional FK and ROM metadata remain within that read.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.kind

## @evidence contracts/development/common.md#meaningful-documentation

The stroke form supplies the repeated path, lift and travel of the acting hand.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.count

## @evidence contracts/development/common.md#meaningful-documentation

This positive whole number sets how often the selected stroke is repeated in its clock window.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.tangent

## @evidence contracts/development/common.md#meaningful-documentation

The tangent selects the direction of travel across the region, with up as the default.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.standoff

## @evidence contracts/development/common.md#meaningful-documentation

This metre offset increases the clearance along the outward normal beyond the effector's skin pad.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.extent

## @evidence contracts/development/common.md#meaningful-documentation

The multiplier scales the free lift and travel measured from the entered region. One is the default.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.bend

## @evidence contracts/development/common.md#meaningful-documentation

The world-space elbow hint is written for the entry posture and moves with the root.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.reference

## @evidence contracts/development/common.md#meaningful-documentation

The optional placed arm gives the chosen entry branch for subsequent fits to use.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.lay

## @evidence contracts/development/common.md#meaningful-documentation

The layout chooses alignment to the surface tangent, arm, reach direction, world upright or limb axis. The tangent is the default.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.held

## @evidence contracts/development/common.md#meaningful-documentation

The optional entered world rotation keeps the tool's presentation as the actor changes heading. The layout supplies rotation when omitted.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.facing

## @evidence contracts/development/common.md#meaningful-documentation

This direction is a level world direction for an upright tool or the touched limb's long axis for a limb-aligned contact.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.lean

## @evidence contracts/development/common.md#meaningful-documentation

The angle in degrees tips the vessel toward the region near arrival and rights it near release. Omitted means zero lean.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.elbow

## @evidence contracts/development/common.md#meaningful-documentation

Natural is the least-strain elbow placement used by default. Level raises it to the shoulder's height.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.from

## @evidence contracts/development/common.md#meaningful-documentation

An end-on reach can name its entered elbow world point. Otherwise the law derives it from the body's measurements.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.entry

## @evidence contracts/development/common.md#meaningful-documentation

The supplied root and yaw identify the posture on which the world-space hint was authored.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.contact

## @evidence contracts/development/common.md#meaningful-documentation

This optional support identifies the bearing hand window. A tool tip touching another person leaves the hand's own contact window unset.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.fingers

## @evidence contracts/development/common.md#meaningful-documentation

Keep retains the base finger pose. The effector supplies the shape when keep is absent.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.rests

## @evidence contracts/development/common.md#meaningful-documentation

Each named rest places an arm segment on the specified person segment between ready and relax.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.together

## @evidence contracts/development/common.md#meaningful-documentation

The optional shared arm group plans both touch trajectories together. Its absence leaves this arm in its own solve.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.disc

## @evidence contracts/development/common.md#meaningful-documentation

The allowed radius in metres bounds where the touch may land around its site. The audit skin supplies the bound when absent.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.skinDistance

## @evidence contracts/development/common.md#meaningful-documentation

This metre bound limits the allowed distance from hand skin to the held material site.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.perceived

## @evidence contracts/development/common.md#meaningful-documentation

The initial target reader starts the reach. The follower observes the live region for a person or an opted-in prop.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.on

## @evidence contracts/development/common.md#meaningful-documentation

This optional bone declares the performer frame that carries a self target.

# src/motion/IAutoMovieMotionHumanTouch.ts#IAutoMovieMotionHumanTouch.ITouch.others

## @evidence contracts/development/common.md#meaningful-documentation

The reader supplies world-space clearing and bearing colliders for the given prefix posture and action second. Borrowed solver inputs apply only to that call.

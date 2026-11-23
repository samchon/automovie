# src/motion/human/sport/IAutoMovieMotionHumanBallPlay.ts#IAutoMovieMotionHumanBallPlay

## @evidence contracts/development/common.md#meaningful-documentation

States the ball identity, the event kinds, film-second clocks and that contacts end with custody.

## @evidence contracts/development/design.md#principled-representation

A closed discriminated event union keeps the facts each kind carries; times are film seconds and points world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by HumanPerformance.play and read by the sport tests that credit plays; gates are read by HumanBallPlay.crossing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the flight's struck and outcome records instead of restating them; no score or rule of a particular sport is encoded.

# src/motion/human/sport/IAutoMovieMotionHumanBallPlay.ts#IAutoMovieMotionHumanBallPlay.Event

## @evidence contracts/development/common.md#meaningful-documentation

Names the three event variants.

## @evidence contracts/development/design.md#principled-representation

A closed union discriminated by kind.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The element type of IAutoMovieMotionHumanBallPlay.events.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each variant keeps only its own facts.

# src/motion/human/sport/IAutoMovieMotionHumanBallPlay.ts#IAutoMovieMotionHumanBallPlay.IHold

## @evidence contracts/development/common.md#meaningful-documentation

Names the holder, hands, span in film seconds and whether the possession starts by catching a flight.

## @evidence contracts/development/design.md#principled-representation

The union of that performer's overlapping or touching grip spans; `caught` is true only when the first grip captures a launch.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Possession reads of the consuming sports.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Worn and mounted spans are not holds and are left out.

# src/motion/human/sport/IAutoMovieMotionHumanBallPlay.ts#IAutoMovieMotionHumanBallPlay.ILaunch

## @evidence contracts/development/common.md#meaningful-documentation

Names the launching performer and action, the film second and the flight's start point and velocity.

## @evidence contracts/development/design.md#principled-representation

The point and velocity are the engine projectile's initial state, world metres and m/s.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exchange reads of the consuming sports: who played the ball, when and how hard.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The action is named by its placed segment, not inferred from the trajectory.

# src/motion/human/sport/IAutoMovieMotionHumanBallPlay.ts#IAutoMovieMotionHumanBallPlay.IContact

## @evidence contracts/development/common.md#meaningful-documentation

Names the film second, what was struck, the world contact point and the declared outcome.

## @evidence contracts/development/design.md#principled-representation

Reuses the flight's struck union and outcome literal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Bounce, net, wall, rim and floor reads of the consuming sports.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Contacts after a catch or a later launch are never recorded.

# src/motion/human/sport/IAutoMovieMotionHumanBallPlay.ts#IAutoMovieMotionHumanBallPlay.Gate

## @evidence contracts/development/common.md#meaningful-documentation

Names the two gate shapes.

## @evidence contracts/development/design.md#principled-representation

A closed union discriminated by kind.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The gate HumanBallPlay.crossing reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shapes are separate variants rather than optional dimensions.

# src/motion/human/sport/IAutoMovieMotionHumanBallPlay.ts#IAutoMovieMotionHumanBallPlay.IDisc

## @evidence contracts/development/common.md#meaningful-documentation

World centre and unit normal toward the credited side, radius in metres.

## @evidence contracts/development/design.md#principled-representation

The tested point crosses the plane toward the normal within the radius.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by HumanBallPlay.crossing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A caller that credits only a whole ball through shrinks the radius by the ball's own.

# src/motion/human/sport/IAutoMovieMotionHumanBallPlay.ts#IAutoMovieMotionHumanBallPlay.IRectangle

## @evidence contracts/development/common.md#meaningful-documentation

World centre, unit normal toward the credited side, unit up in the plane and half extents in metres.

## @evidence contracts/development/design.md#principled-representation

The across axis is up cross normal; the tested point must lie within both half extents.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by HumanBallPlay.crossing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `up` must be perpendicular to `normal`; the reader refuses otherwise.

# src/motion/human/sport/IAutoMovieMotionHumanBallPlay.ts#IAutoMovieMotionHumanBallPlay.ICrossing

## @evidence contracts/development/common.md#meaningful-documentation

Film second and world point where the tested point meets the gate plane.

## @evidence contracts/development/design.md#principled-representation

The point lies on the plane to the bisection's resolution.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by HumanBallPlay.crossing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Absence of a crossing is an undefined result, not a sentinel time.

# src/motion/human/perform/IAutoMovieMotionHumanImpulse.ts#IAutoMovieMotionHumanImpulse

## @evidence contracts/development/common.md#meaningful-documentation

An impulse delivered to a performer at a film instant, in world newton seconds. Hit conversion and reaction laws exchange this record without changing its force application site.

## @evidence contracts/development/design.md#principled-representation

seconds: Film seconds. impulse: World newton seconds, on the body.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanForce.ofHit converts a hit to one impulse, and perturb reads that same impulse representation to plan the body's reaction.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The site remains anatomical or bone-local while impulse is world momentum transfer. Hit conversion owns mass/velocity arithmetic; the receiving law owns the resulting reaction.

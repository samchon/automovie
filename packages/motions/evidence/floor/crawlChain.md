# src/floor/crawlChain.ts#crawlChain.IPlanar

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its direction and unit.

## @evidence contracts/development/design.md#principled-representation

Two coordinates of the plane the chain lies in.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The lateral places stay with the limbs, not here.

# src/floor/crawlChain.ts#crawlChain.ILeg

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The leg's elevation fixes the foot's lift and both joints.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members, all read by the chain's solve and the shape it gives.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The ankle follows from the foot's pivot on its ball.

# src/floor/crawlChain.ts#crawlChain.IShape

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The leg, the shoulders and the hip angle that place the whole body.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members over the leg's.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The wrists are where the hands put them, so they are not repeated.

# src/floor/crawlChain.ts#crawlChain.IChain

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, frame and unit.

## @evidence contracts/development/design.md#principled-representation

The solve and the body's places it was built from.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members the inchworm reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The key reaches are solved, not typed.

# src/floor/crawlChain.ts#crawlChain

## @evidence contracts/development/common.md#meaningful-documentation

States each input, its frame and the result; the namespace gives the rule.

## @evidence contracts/development/implementation.md#principled-implementation

The trunk, its lean and the thigh's rest angle are read off the rig's joints in the relaxed upright pose and the balls off the standing feet, so every length is the body's; the fold is held inside the hip's flexion range, and the fold and the plank are solved by bisection on the same chain.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A leg by its elevation, the shoulders over the wrists, the hips by one scan and a bisection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The scan comes down from the hips high, so the place kept is the upper one, and the shoulders go no further than the plank, where the two places meet; where the heel's lift leaves the arc a hair short of the shoulders, the nearest elevation is kept, never the scan's floor.

## @evidence contracts/development/implementation.md#efficient-algorithms

One upright FK requests only measured shoulders/hips/knees. Fixed floor/inverse yaw transforms prepare once; every original scan/bisection still observes actual foot geometry, while hip-only residuals omit unused ankle/whole-leg records and final shapes retain their full fresh representation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The unchanged floor frame and zero-origin heading share their native inverse coefficients. Body/heading/pivot define each integer scan elevation; only its actual translation changes with mu, applied in original arithmetic order. Noninteger candidate geometry remains actual.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The chain holds bounded frame coefficients, body lengths/places and at most 116 integer-elevation foot records from LOWEST through 120 until release; no noninteger bisection or queried shape is retained.

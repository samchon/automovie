# src/vehicles/rowBoat.ts#rowBoat

## @evidence contracts/development/implementation.md#principled-implementation

Strokes are counted by the distance covered, so a stroke's phase is the distance's fraction of `STROKE` and needs no integration; the drive's share is Kleshnev's rhythm at the stroke rate, 0.84 r + 25.1 percent with r in strokes a minute (ISBS 1996, p. 322, https://ojs.ub.uni-konstanz.de/cpa/article/view/2726/2573), its rate held inside the study's 26 to 36.5 strokes a minute. The sweep eases by half a cosine; the lift is the touch angle less a half sine of it through the drive and the touch angle plus a half sine of the rest of the clearance through the recovery, so the blade is below the water exactly between the catch and the finish.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build the course and locate its catches, then read each pose and apply the sea. Keep native binding metadata beside the original ride's paired root and socket readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `STROKE` is a named provisional value. Kleshnev's rhythm and the arc were read for sliding-seat boats, and the blade's feathering is not turned. A foreign plan gains no native binding.

## @evidence contracts/development/implementation.md#efficient-algorithms

One course sample per pose. Catch bisection reads distance forty times per catch once per ride. For a native course it reads the speed profile without evaluating the path or placement. The binding's root-only reader skips socket articulation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Samples reuse the plan and oar geometry. The film binding shares the native clock across its original root and socket procedures and labels only proven stationary domains.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The ride owns the boat, plan and sea. Native ride and reader identities weakly own binding metadata. No prior sampled output is retained by the binding.

## @evidence contracts/development/common.md#meaningful-documentation

States the stroke cycle and its source, how the rate follows speed, what the oars do in each phase, and how a native ride can be bound to film time.

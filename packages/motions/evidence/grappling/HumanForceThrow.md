# src/grappling/HumanForceThrow.ts#HumanForceThrow.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the phases, the inputs and both refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The fulcrum is the thrower's region on its placed posture at the broken base; the frozen body turns about it by `HumanForceExchange.swing`, whose start rate is the pull's speed across the fulcrum line, whose drive is the pull's moment about the fulcrum while it lasts, and whose inertia is the body's composite tensor on the swing's axis plus the parallel-axis term; after release the centre follows the parabola and the orientation the conserved angular momentum `R I ω` (`integrateAirborneRotation`); the landing is the first integrator step at which the lowest joint reaches the floor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fulcrum, swing, release state, flight, landing, plan.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A swing that stops is refused; the landing is searched, never set.

## @evidence contracts/development/implementation.md#efficient-algorithms

One swing and one flight retain their original integration budgets. The native fixed-shape constructor copies the actual full local bone map, propagates explicit zero bone rates and reduces its inertia/momentum once in O(B+S) for B bones and S mass parts. The engine may solve a supported principal/spherical residual-only rotation exactly; general anisotropic rotation keeps its original numerical integration over this same fixed tensor. If native rate propagation is unavailable, the original one-instant history path remains. The unchanged landing grid still evaluates every actual joint offset, requesting only its exact rotated Y component and omitting unused X/Z outputs and vector records.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The unchanged local frozen-shape map is actual complete geometry held throughout this throw's flight, so the native fixed constructor owns a copied whole-curve tensor and zero-relative-momentum proof rather than inferring constancy from callback samples. Its identity reaches the actual flight integrator directly, preserving numeric fallback for unsupported physical classes. The original single-instant reduction remains when fixed construction is unavailable. Release angle/rate, inverse heading and fixed joint offsets are also shared under their exact fixed-input contracts.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The native fixed history is cleared in finally after flight construction, including an integration failure; completed playback retains only numeric flight data. An unavailable native constructor uses the original temporary history, cleared after its one rigid-shape measurement. Rigid instants and landing offsets end with synchronous planning; the plan retains its original physical scalars, inverse heading and completed swing/flight trajectories without a shape-history owner.

# src/grappling/HumanForceThrow.ts#HumanForceThrow.site

## @evidence contracts/development/common.md#meaningful-documentation

States the input forms and the frame.

## @evidence contracts/development/implementation.md#principled-implementation

A region is placed by the engine's surface resolution, a bone's point by its bone's world transform.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two branches.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: a missing bone is the caller's canonical rig's defect.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work `resolveAutoMovieHumanoidSurfaces.place`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function.

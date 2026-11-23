# src/soft/simulateSoftBodyCore.ts#simulateSoftBodyCore

## @evidence contracts/development/implementation.md#principled-implementation

Damped prediction, ordered simultaneous Jacobi constraint gathers or XPBD Gauss-Seidel sweeps (Macklin, Müller and Chentanez 2016), discrete collider escape with optional position-based friction (Macklin et al. 2014) and cord self-contact form the scheme. Anchors have zero inverse mass and prescribed targets while held; domain admission and complete moving samples are caller premises. Nonfinite integrated arrays throw, without proving universal stability or collision freedom.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Static and moving-boundary public wrappers delegate to one core, sharing rest-target setup, lattice topology, fold ordering and contact geometry without changing their admission APIs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every seek replays the fixed clock from rest; no fixture state, adaptive timestep, undeclared self-collision pass or substituted moving target changes the declared trajectory. Self-contact and friction run only when the domain declares contact.

## @evidence contracts/development/common.md#meaningful-documentation

States absolute replay, caller admission, fixed-order stages and nonfinite failure rather than claiming every admitted large arithmetic input is safe.

## @evidence contracts/development/implementation.md#efficient-algorithms

For P particles, I sweeps, K target steps, C colliders, B moving capsules and A anchors, setup is O(P+A+S+T) for S states and T selected targets, each step is O(P*I+P*(C+B)+P*A) in the moving-anchor find path, with O(P) working arrays plus supplied boundary storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Rest lengths, valences, inverse masses and static targets are built once and reused across all steps/sweeps in this solve; changing domains, states or complete boundary sequences starts a new replay, without cross-call cache equivalence.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Working typed arrays and maps are call-local; only fresh plain position/velocity arrays and scalar measurements transfer in the result, and thrown failure retains no integration task or cursor.

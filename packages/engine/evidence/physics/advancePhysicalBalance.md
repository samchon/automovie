# src/physics/advancePhysicalBalance.ts#advancePhysicalBalance

## @evidence contracts/development/common.md#meaningful-documentation

States the controller's purpose, the phases it runs in order, that no phase writes its input, and that the caller's state becomes the last phase's.

## @evidence contracts/development/implementation.md#principled-implementation

A phase machine: each phase is a function from the recovery's state and the body's readings to the next state and its commands, run in the order handoff, touchdown, unload, landing ramp, lift, stance and plan, swing and settle. The order is the dependency order of the state each phase reads: a touchdown seats a landed foot before the ramp advances it, a lift gives up a seat before the stance is read, and the plan and swing read the stance after the lift. The swing's drives are applied after the phases, which is equivalent to applying them inside the swing because nothing the phases read depends on the actuation they accumulate into. The replay suite (test_physical_balance_replay) shows the composition returns and writes exactly what the single-function controller did at every recorded key frame of the fourteen disturbance cases.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The function composes the phases and applies their commands; each decision lives in the phase that owns it, and the state's adoption into the caller's object is one helper, `adopt`, because the caller keeps one state object across substeps and checkpoints.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts; one non-null assertion reads a drive's own segment, which the swing phase drove. No constant is introduced here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each phase is linear in the supporting limbs except the assessments, which scale with the support patches' points; the phases copy only the parts of the state they change, a few small objects per substep. The mass centre is read once, in the readings, and shared by every phase.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call advances one substep from its own readings; the readings are shared across the phases of that call only, and nothing outlives it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the state; the function replaces its keys by the last phase's and retains nothing itself. The trace, when passed, grows by the phases' events of this substep only.

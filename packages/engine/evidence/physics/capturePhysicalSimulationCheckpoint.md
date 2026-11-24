# src/physics/capturePhysicalSimulationCheckpoint.ts#capturePhysicalSimulationCheckpoint

## @evidence contracts/development/common.md#meaningful-documentation

Gives what is kept after a completed step (the world snapshot, the controller record and the recovery state, each under the step), which input is written and which only read, and how each part is owned: the contact ledger is counted rather than copied, open episodes keep their metadata and sample count, and plans, handoffs and recovery state are cloned.

## @evidence contracts/development/implementation.md#principled-implementation

This is the capture side of the checkpoint `restorePhysicalSimulationCheckpoint` reads back. A resumed run must start from the exact state a fresh bake held after the step. So the native world is snapshotted whole, and the controller record stores the counts that cut the shared ledgers (contacts, ownership) at their length now. Each open episode keeps its metadata and its sample count, so samples it gains later stay out of a resumed run. The mutable plans, handoffs and recovery state are cloned so later steps cannot change them. `AutoMoviePhysicalSimulation.compute` calls it only after a step its plan snapshots (`planPhysicalSimulationSteps`) has fully completed, so every open episode has its sample list.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns writing a checkpoint, apart from the run's step loop that decides when to write one and from the restore that reads one. It was moved out of `AutoMoviePhysicalSimulation.compute` unchanged and adds no option.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

It contains no `any` and no special case. One non-null assertion reads an open solver episode's sample list, which every solver receipt in the active map carries.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is the world snapshot's serialization, which is linear in its bodies, colliders, joints and last contacts, plus one pass over the open episodes and copies of the binding's plans and sets. The contact ledger and frames are not traversed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The checkpoint is the reuse: a later run whose input matches up to this step resumes from it instead of recomputing the prefix. Equivalence is decided by `checkpointPhysicalSimulation`, which compares the actual sampled inputs and the cache protocol, and the cache's input identity invalidates it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The run's cache owns what is written and retains it while the cache lives. Each capture adds one snapshot's bytes and one controller and balance record for its step, so the plan's snapshot count bounds the retained population. The function acquires no handle or task.

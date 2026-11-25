# src/compose/AutoMovieMotionHumanLeanInto.ts#AutoMovieMotionHumanLeanInto.solve

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result; the namespace states the movement.

## @evidence contracts/development/implementation.md#principled-implementation

With balance asked, the hips' shift at a pitch is the balance shift of the standing posture tipped there (otherwise none), lowered onto its legs and with the working arm on its goal, so the centre of mass stays where the unleaned body has it and moves no faster than the arm carries it (Hof et al. 2005's margin reads the centre's speed); it is solved at 5 degree steps and carried in proportion between, continuous in the pitch. The pitch is the least root of the wrist's distance beyond the kept share. That distance falls with the lean for a wrist below the shoulder and rises again for one above it, so the lean is scanned upward in 5 degree steps for the first pitch that reaches and bisected between it and the step before.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One balance solve per step of the pitch, one scan with its bisection, one primitive.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A wrist no scanned lean reaches throws with the smallest shortfall and the pitch that gives it; the leaned root is lowered until the planted legs reach their feet. A reach that opens and closes inside one 5 degree step is missed, the remaining gap; the shift between two steps of the pitch is their proportion, not a solve.

## @evidence contracts/development/implementation.md#efficient-algorithms

Retains at most nine scanned leans and nine halvings per read and, with balance asked, the original at-most-ten plan balance shifts; without it no centre of mass is read. One static shoulder demand serves actual checks; each pitch query shares exact FK prerequisites across its current poses and emits only the consumed shoulder ancestry. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses original tip/balance/lowering owners and actual Reach.prepareCheck. Only fixed body/limb demand lives with the plan; each runtime pitch and final raw lowering borrow the same current-person FK source without ROM projection or a stored target answer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns props, held centre, static shoulder metadata and at most ten original solved shifts. Every dynamic getter/loan stays inside its synchronous pitch/write and releases on return or throw; returned postures retain no reader or query history.

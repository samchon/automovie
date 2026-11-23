# src/kinematics/distalEndSwivelAdmitted.ts#distalEndSwivelAdmitted

## @evidence contracts/development/common.md#meaningful-documentation

States which limits admit a swivel, how the interval's ends are found, what a continued fit does with it, and the full-turn and unadmitted cases.

## @evidence contracts/development/implementation.md#principled-implementation

Each limit maps to an interval of the swivel (Tolani, Goswami and Badler 2000, section 3.2.4), so admission changes only at the refused arcs' ends and the twist range's breakpoints, and the connected interval holding a swivel ends at the nearest of those either way past which admission fails.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One admission test, then one pass over the candidate ends keeping the nearest failing one each way.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Closed-form ends tested by the same admission `distalEndSwivelNearest` reads, never sampled; an unadmitted swivel gives none.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the few arc ends and breakpoints, each with one admission test.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the branch's refused arcs and twist range its caller already built once per branch.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh arc and retains nothing.

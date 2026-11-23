# src/kinematics/distalEndSwivelAdmitted.ts#distalEndSwivelAdmitted

## @evidence contracts/development/common.md#meaningful-documentation

States which limits admit a swivel, how the interval's ends are found, what a continued fit does with it, how a swivel known to a resolution keeps the interval of the admitted swivel within it, and the full-turn and unadmitted cases.

## @evidence contracts/development/implementation.md#principled-implementation

Each limit maps to an interval of the swivel (Tolani, Goswami and Badler 2000, section 3.2.4), so admission changes only at the refused arcs' ends and the twist range's breakpoints, and the connected interval holding a swivel ends at the nearest of those either way past which admission fails. A fit's answer is refined only to the swivel's resolution (`hingedArmSwivel.RESOLUTION`), so the admitted swivel nearest it within that is the same answer to the fit, and its interval, widened to hold the answer, is the one the answer lies in.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One admission test, then one pass over the candidate ends keeping the nearest failing one each way.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Closed-form ends tested by the same admission `distalEndSwivelNearest` reads, never sampled; the tolerance is the caller's stated resolution, never a tuned one; a swivel with no admitted one within it gives none.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the few arc ends and breakpoints, each with one admission test; an unadmitted swivel reads its nearest admitted one once (`distalEndSwivelNearest`), linear too.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the branch's refused arcs and twist range its caller already built once per branch.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh arc and retains nothing.

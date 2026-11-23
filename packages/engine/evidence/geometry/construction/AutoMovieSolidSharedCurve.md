# src/geometry/construction/AutoMovieSolidSharedCurve.ts#AutoMovieSolidSharedCurve.create

## @evidence contracts/development/implementation.md#principled-implementation

Maps the loop through the host for the curve's exact jets, drops each point's foot on the part by Newton from the point before it, and refuses a point farther from the part than the tolerance, a loop that does not close on the part or enclose a region of the host's chart, and a part whose kept side reverses between neighbouring points.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One evaluator serves the stored points and the curve's reader; the sides and the arc are two small readers over the same jets.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The foot is never replaced by a nearest sample and the loop is never moved onto the part; a singular or diverging foot is a refusal.

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and each refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(count) feet of at most `STEPS` Newton steps each, one grid scan when no start is given, and one foot per later reading.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each foot starts from the neighbouring stored point's; the stored points serve every reading at their own clocks.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned readers retain the stored points and borrow the surfaces and the loop; nothing else outlives the call.

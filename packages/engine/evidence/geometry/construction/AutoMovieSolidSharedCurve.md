# src/geometry/construction/AutoMovieSolidSharedCurve.ts#AutoMovieSolidSharedCurve

## @evidence contracts/development/common.md#meaningful-documentation

States why a trace cannot follow the contact, the curve's exact jets, the foot's equations, what the surfaces decide, what the loop decides and the refusal.

## @evidence contracts/development/design.md#principled-representation

One generating owner supplies the shared boundary to both surfaces (construction.md, Connections, Ownership); the curve is the host's own map of that loop and the part's foot of it, so the join's rails, widths and blend read the same contact a traced curve publishes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The loop reader, the input, the shared contact with its three readers, the result and one builder.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No arc is declared by clock and nothing is fitted or searched along the curve: a loop off the part, a side that reverses or a loop that does not close on the part is refused by name.

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

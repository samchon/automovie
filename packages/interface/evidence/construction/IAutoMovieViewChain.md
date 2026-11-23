# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IInput

## @evidence contracts/development/common.md#meaningful-documentation

States units, ordering, orientation and the arc each entry belongs to.

## @evidence contracts/development/design.md#principled-representation

The section's own points and tangent directions, and one shoulder per arc from a point to the next.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `of`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Lengths, order and orientation are checked by `of`, not assumed.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IFieldInput

## @evidence contracts/development/common.md#meaningful-documentation

States that each entry carries its physical station partials and no phase partials.

## @evidence contracts/development/design.md#principled-representation

The same inputs as `IInput`, each scalar a `[value, s, 0, ss, 0, 0]` jet.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `primal` and `jets`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unavailable station jets are the caller's failure, never zeros supplied here.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IArc

## @evidence contracts/development/common.md#meaningful-documentation

States the control points, weight, phase interval and end curvatures.

## @evidence contracts/development/design.md#principled-representation

The rational quadratic's three control points and middle weight, with its phase span and signed end curvatures.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `read`, `jets`, the join report and the tests.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Only admitted arcs are prepared.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IJoin

## @evidence contracts/development/common.md#meaningful-documentation

States which arcs meet and the units.

## @evidence contracts/development/design.md#principled-representation

The incoming arc's end curvature and the outgoing arc's start curvature at a control point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `read` for the sided flag and by the trace's receipt.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reported, never equalized here.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.ISection

## @evidence contracts/development/common.md#meaningful-documentation

States the fault's meaning.

## @evidence contracts/development/design.md#principled-representation

The inputs, their arcs and joins, and a named fault that empties both.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `read`, `jets`, the native reader and the trace.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A faulted chain has no arcs to read.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IRead

## @evidence contracts/development/common.md#meaningful-documentation

States the members' meaning and units and the sided rule.

## @evidence contracts/development/design.md#principled-representation

The arc, its parameter and its exact point, with whether the phase sits on a join whose two curvatures differ.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `jets`, the native reader's Point0 and value, and `radius`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Only a met ray yields a reading.

# src/construction/IAutoMovieViewChain.ts#IAutoMovieViewChain.IReading

## @evidence contracts/development/common.md#meaningful-documentation

States the output order and units and the sided rule.

## @evidence contracts/development/design.md#principled-representation

The ray reading's point and sided flag with the radius Hessian at that same arc parameter.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the native reader's phase and jet capabilities.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A vanishing phase speed or unmet ray yields no reading rather than substituted values.

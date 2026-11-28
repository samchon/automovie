# src/geometry/IAutoMoviePrepareContourBoundaries64.ts#IAutoMoviePrepareContourBoundaries64.IPlans

## @evidence contracts/development/common.md#meaningful-documentation

The ordered work list borrows group identities and the surrounding documentation states both the shared-ring update and the optional unsupported reason.

## @evidence contracts/development/design.md#principled-representation

The Engine traverses adjacent section plans in the supplied order and can refine the same ring through several groups.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The caller owns adjacency and supplies each group. The list introduces no inferred groups and preserves each caller's subtype G.

# src/geometry/IAutoMoviePrepareContourBoundaries64.ts#IAutoMoviePrepareContourBoundaries64.IIntervalPlan

## @evidence contracts/development/common.md#meaningful-documentation

The plan pairs an upper section index with its ordered incidence groups and names both adjacent ring addresses.

## @evidence contracts/development/design.md#principled-representation

The preparer uses k-1 and k to collect the two sides of each group. The supplied groups retain their identity when rings or unsupported reasons change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The plan only carries one interval's index and borrowed groups. Ring data stays in the shared section collection.

# src/geometry/IAutoMoviePrepareContourBoundaries64.ts#IAutoMoviePrepareContourBoundaries64.IIntervalPlan.k

## @evidence contracts/development/common.md#meaningful-documentation

The index identifies the upper ring array and derives the lower array by subtracting one.

# src/geometry/IAutoMoviePrepareContourBoundaries64.ts#IAutoMoviePrepareContourBoundaries64.IIntervalPlan.groups

## @evidence contracts/development/common.md#meaningful-documentation

The list preserves the caller's group objects and traversal order, including any group subtype fields.

# src/geometry/IAutoMoviePrepareContourBoundaries64.ts#IAutoMoviePrepareContourBoundaries64.IResult

## @evidence contracts/development/common.md#meaningful-documentation

The result explains borrowed map keys, revised qualifications, and the distinction between observation counts and opt-in timings.

## @evidence contracts/development/design.md#principled-representation

The Engine allocates the map and observation record separately. The borrowed map keys keep the qualifications attached to the original work across passes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two outputs address qualification and measured work. The mutable group reason stays on the borrowed group.

# src/geometry/IAutoMoviePrepareContourBoundaries64.ts#IAutoMoviePrepareContourBoundaries64.IResult.interactions

## @evidence contracts/development/common.md#meaningful-documentation

The map describes skipped initially unsupported groups and the survival of an earlier map entry after a slit failure.

# src/geometry/IAutoMoviePrepareContourBoundaries64.ts#IAutoMoviePrepareContourBoundaries64.IResult.observations

## @evidence contracts/development/common.md#meaningful-documentation

The observations describe local group-side addresses, millimetre endpoints, and optional timing.

# src/geometry/IAutoMoviePrepareContourBoundaries64.ts#IAutoMoviePrepareContourBoundaries64.IInteractionQualification

## @evidence contracts/development/common.md#meaningful-documentation

The record states that both sides must qualify and explains the independent diagnostic history.

## @evidence contracts/development/design.md#principled-representation

The normal pass stores both side checks as one result. The caught arithmetic path stores false with the failure message.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One result attaches a qualification and trace to a borrowed map key. It carries no duplicate group or geometry identity.

# src/geometry/IAutoMoviePrepareContourBoundaries64.ts#IAutoMoviePrepareContourBoundaries64.IInteractionQualification.qualified

## @evidence contracts/development/common.md#meaningful-documentation

The flag identifies the latest two-sided outcome, including false after a caught arithmetic failure.

# src/geometry/IAutoMoviePrepareContourBoundaries64.ts#IAutoMoviePrepareContourBoundaries64.IInteractionQualification.diagnostics

## @evidence contracts/development/common.md#meaningful-documentation

The list distinguishes deduplicated pass-prefixed history from the replacement message on a caught arithmetic failure.

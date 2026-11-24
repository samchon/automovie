# src/posture/HumanBodyFitRows.ts#HumanBodyFitRows.IReading

## @evidence contracts/development/design.md#principled-representation

Combines floor and geometric-goal readings on the same resolved bones with their exact source clinical posture and optional requested balance, in their declared metres, degrees and radians.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fit, merit, goal readers and correction callbacks consume these existing readings; the same written clinical posture feeds current Jacobian projection and transfers to the final posture result.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Balance is absent only when not requested, while current floor candidates and goals remain actual readings rather than cached predicted values.

## @evidence contracts/development/common.md#meaningful-documentation

Names the floor, goal and balance owners and the optional balance condition.

# src/posture/HumanBodyFitRows.ts#HumanBodyFitRows.IRead

## @evidence contracts/development/design.md#principled-representation

Couples a linear QP row in solved units with its exact scalar geometric reading in metres or radians, which SOC compares on another actual reading.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The QP consumes row and the merit correction consumes f; their existing owners define the numeric row and body reading.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Keeps the actual reading callback instead of treating a linear prediction as physical evidence; input dimensions remain producer premises admitted by the QP.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the scalar reading, linearisation relationship and units.

# src/posture/HumanBodyFitRows.ts#HumanBodyFitRows.IRead.f

## @evidence contracts/development/common.md#meaningful-documentation

States the actual-reading input, scalar units and relation to the linear row.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

This is a callable signature; of, floor and the delegated target/goal builders own each pure geometric calculation.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

No body is declared here; the owning row builder supplies the callback consumed by SOC.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

The signature executes no replacement behavior; the builders define actual geometry rather than linear predictions.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

This declaration performs no work; the row builders document their actual measurement and Jacobian costs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This declaration shares no computed value; of owns same-at reuse while a supplied callback evaluates its requested reading.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The signature allocates nothing; its owning model controls the callback and captured geometric-data lifetime.

# src/posture/HumanBodyFitRows.ts#HumanBodyFitRows.IStep

## @evidence contracts/development/design.md#principled-representation

Collects the same current body reading, analytic variable motions, unit conversions, requested goals, penalty and selected contact indices used to assemble one linearised model.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Contact, floor, target and geometric-goal builders consume these members; touching carries current selected candidates and index supplies the shared actual variable domain to dense rows.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Uses the owning body, Jacobian and target types; matching index/unit/motion lengths and selected-candidate compatibility are producer premises, with every raw QP entry still admitted downstream.

## @evidence contracts/development/common.md#meaningful-documentation

States model inputs, units, penalty and the reading-specific contact selection.

# src/posture/HumanBodyFitRows.ts#HumanBodyFitRows

## @evidence contracts/development/implementation.md#principled-implementation

Linearises actual selected floor contacts, effector/geometric goals and the base-of-support inequalities using their owning analytic Jacobians, preserving the common l1 prices and numerical band.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One equality builder serves contact and goal rows; targets and balance retain their own measurement and derivative owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps existing goal tolerances, prices and contact multiplicity, and moves the base of support with its corners' bones as the merit's next reading does; no missing physical row is replaced with a numerical success flag.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adds the delegated goal and Jacobian costs and O(n*R) coefficient storage for R rows over n variables; one pure f(at) value now supplies both interval ends.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares variable indices and each pure f(at) value; when both centre and balance exist, a lazy same-body/bones/motions producer computes their mass Jacobian once at the original post-angle phase, and a new model rebuilds its current slopes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns owned row coefficients and geometric-reading callbacks for the model lifetime; no model or reading is stored globally.

## @evidence contracts/development/common.md#meaningful-documentation

Defines included row families, solved-unit slopes, pure reading reuse, contact multiplicity and delegated ownership.

# src/posture/HumanBodyFitRows.ts#HumanBodyFitRows.floor

## @evidence contracts/development/implementation.md#principled-implementation

Each selected candidate gets its current floor-height linearisation, lower bounded by the existing numerical band, using rigid-point analytic velocities.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Array.from maps the supplied candidate set directly into its rows without a separate spread-copy array.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves set iteration order, row keys, height, band and price; it does not alter which candidates the fit selected.

## @evidence contracts/development/implementation.md#efficient-algorithms

For F selected candidates and n variables, performs F*n velocity queries and stores O(F*n) coefficients, with one output array and a shared n-entry index array.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the existing posed reading and motions, sharing the variable-index array while recomputing each candidate's current derivative.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned rows own coefficients, borrow the fit's read-only variable indices and capture only their candidate index; rows are released with the model and shared indices with the fit.

## @evidence contracts/development/common.md#meaningful-documentation

States candidate indexing, order, units, lower-bound convention and row ownership.

# src/posture/HumanBodyFitRows.ts#HumanBodyFitRows.lowest

## @evidence contracts/development/implementation.md#principled-implementation

Selects each part's minimum candidate with the existing strict less-than comparison in original candidate order, preserving first ties, overlapping parts and nonfinite comparison behavior.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Empty and single-part inputs need no reverse index; multiple parts build shape-to-part membership once, then one candidate sweep updates only owning parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves duplicate-membership Set semantics and repeated output indices for overlapping parts; no physical cutoff or absent-candidate replacement is introduced.

## @evidence contracts/development/implementation.md#efficient-algorithms

With B parts, M memberships, C candidates and V matching candidate-part visits, takes O(B+M+C+V) time and O(B+M) temporary storage; complete overlap still permits V=B*C and speed is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads each candidate once in the multi-part sweep and shares its height across matching parts; consumers may carry this result only with the same unchanged reading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains no reading or reverse index after the call and returns a newly owned list of at most B selected indices.

## @evidence contracts/development/common.md#meaningful-documentation

Defines membership, candidate order, tie and duplicate semantics, missing candidates, costs and result lifetime.

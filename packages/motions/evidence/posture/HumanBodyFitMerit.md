# src/posture/HumanBodyFitMerit.ts#HumanBodyFitMerit.IMisses

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its row and sign.

## @evidence contracts/development/design.md#principled-representation

One list per kind of row.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every constraint family, all read by the merit and the feasibility.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Distances in the reading's units, never pre-priced.

# src/posture/HumanBodyFitMerit.ts#HumanBodyFitMerit.IEvaluation

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it holds.

## @evidence contracts/development/design.md#principled-representation

The loop's evaluation carries actual reading-specific misses and selected support indices, preserving part order and overlapping-part multiplicity for the step and its correction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carries the merit's two sums and the greatest single row's violation (sco's `vecMax(cnt_viols)`, which the loop's penalty adjustment reads), the reading, misses, ordered selected supports and their membership set, plus actual ordered pair gaps whose witnesses the next convexification consumes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The loop's own evaluation extended, not restated.

# src/posture/HumanBodyFitMerit.ts#HumanBodyFitMerit.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning.

## @evidence contracts/development/design.md#principled-representation

The fit's own inputs, resolved.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members the merit reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The fit's props are read by `Pick`, not restated.

# src/posture/HumanBodyFitMerit.ts#HumanBodyFitMerit.IMerit

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it reads and returns.

## @evidence contracts/development/design.md#principled-representation

The reading, the merit and the feasibility of one fit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Evaluation serves the fit and support seed selection; feasibility serves the fit's loop and final result.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One reading serves the merit and the feasibility.

# src/posture/HumanBodyFitMerit.ts#HumanBodyFitMerit.IMerit.evaluate

## @evidence contracts/development/common.md#meaningful-documentation

Defines the current-coordinate input and actual-reading evaluation result.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

This is the evaluator signature; of owns the physical reading and exact l1 merit body.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

No body is declared here; of assembles the evaluator from the owning floor, goal and balance readers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

This signature executes no shortcuts; of preserves the actual row measurements and prices.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The declaration performs no work; of documents per-evaluation kinematics and row-reader costs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The declaration computes no shared result; of owns same-reading support and centre-displacement reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The declaration allocates nothing; of defines closure inputs and evaluation result ownership.

# src/posture/HumanBodyFitMerit.ts#HumanBodyFitMerit.IMerit.holds

## @evidence contracts/development/common.md#meaningful-documentation

States the actual-miss input, all-row verdict and physical-radius convention.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

This is a feasibility signature; of owns the exact one-sided, two-sided and physical-radius predicates.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

No body is declared here; of provides the ordered row-family checks.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

The declaration changes no acceptance rule; of retains each existing tolerance and the zero excess required by a physical radius.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The declaration performs no scan; of owns the short-circuit traversal of current misses.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The declaration retains no verdict; of evaluates the supplied misses anew without copied concatenations.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The declaration allocates nothing; of supplies a boolean operation without retained misses.

# src/posture/HumanBodyFitMerit.ts#HumanBodyFitMerit.of

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result; the namespace gives the merit.

## @evidence contracts/development/implementation.md#principled-implementation

The l1 merit: the objective's pull plus each row's miss beyond the band at its share of the price; the named bearing parts' points within the bearing margin of their lowest form the balance's base.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reading, one pass of misses, one sum with its greatest term.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every row is priced in the merit as the step's model prices it.

## @evidence contracts/development/implementation.md#efficient-algorithms

One forward kinematics per evaluation plus the floor, pair and selected-goal readers' costs; merit summation and feasibility scan the current misses without concatenated copies, and one centre displacement serves all selected axes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares exact written clinical input, current support/membership and completed pair witnesses with convexification, and its actual mass centre with balance. One fit-owned lazy FK workspace shares only exactly equal current joint/ancestor dependencies through canonical/floor evaluations; each candidate and its full admission remain actual, and lazy centre displacement stays within that reading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Closures own fit inputs, bearing names and one lazy bounded FK workspace until return/throw, without candidate history. Each evaluation owns its written posture, reading/misses, T support/membership entries and P gaps with 2P witnesses; no FK supplier escapes through those outputs. The fit may transfer its final private written posture to its result.

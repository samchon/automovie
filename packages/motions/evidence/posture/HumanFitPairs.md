# src/posture/HumanFitPairs.ts#HumanFitPairs.ICapsule

## @evidence contracts/development/design.md#principled-representation

Names the capsule's two resolved joint endpoints and its radius in metres; finite body measures and available bones remain caller premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The pair gap and row readers consume each endpoint and radius directly; no copied mesh or action-specific geometry is stored.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Retains the existing measured capsule proxy without claiming a full-surface collision certificate or changing a radius.

## @evidence contracts/development/common.md#meaningful-documentation

States endpoint ownership, radius units, caller premises and the capsule-proxy scope.

# src/posture/HumanFitPairs.ts#HumanFitPairs.IPair

## @evidence contracts/development/design.md#principled-representation

Couples the two owning capsule records whose surface gap is constrained.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Both members are read by gap and its analytic relative-velocity row.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Uses the same capsule representation on both sides with no fixture category or precomputed answer.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the two constrained capsule owners.

# src/posture/HumanFitPairs.ts#HumanFitPairs.IGap

## @evidence contracts/development/design.md#principled-representation

Couples the signed surface distance in metres with the two closest axis witnesses on the same current resolved posture.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Near-row selection reads distance and the row's relative velocity reads both witnesses; all come from the same engine segment-distance result.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reports the existing capsule gap, including negative overlap, rather than a predicted step or acceptance flag.

## @evidence contracts/development/common.md#meaningful-documentation

States distance sign, world-frame witness units and shared-posture scope.

# src/posture/HumanFitPairs.ts#HumanFitPairs

## @evidence contracts/development/implementation.md#principled-implementation

Instantiates the existing deep-fold capsule-pair policy from the body's own thigh, shank, arm and chest measures.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two side loops build limb pairs and one builds chest-thigh pairs through a local capsule constructor.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves all fourteen existing proxy pairs and measured radii, including the documented half chest depth, without adding a physical tolerance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Takes O(1) time and storage for this fixed fourteen-pair policy, independent of the body's surface resolution.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares each local thigh and forearm capsule across the pairs that use it; the fit owns one pair list rather than rebuilding it per reading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one caller-owned bounded pair list and retains no body or geometry globally.

## @evidence contracts/development/common.md#meaningful-documentation

Names the capsule policy, measure source, pair count, shared local records and ownership.

# src/posture/HumanFitPairs.ts#HumanFitPairs.gap

## @evidence contracts/development/implementation.md#principled-implementation

Uses the engine's closest points between two current axis segments, then subtracts each capsule radius in the existing order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One segment-distance call supplies both witnesses and the signed surface gap.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads actual resolved joint positions without dropping a pair or replacing its distance; valid bones and measures remain caller premises.

## @evidence contracts/development/implementation.md#efficient-algorithms

Takes O(1) map queries and segment-distance work per pair, with one returned gap record.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares one closest-segment result between the distance and both derivative witnesses; a different posture requires a new reading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the engine's witness values in a new record without retaining the bones or pair.

## @evidence contracts/development/common.md#meaningful-documentation

Defines current endpoints, radius subtraction order, witness frame and signed distance.

# src/posture/HumanFitPairs.ts#HumanFitPairs.row

## @evidence contracts/development/implementation.md#principled-implementation

Projects the two closest witnesses' analytic rigid-point velocities onto their normalized separation, preserving the existing capsule-gap linearisation and lower bound.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One actual supplied or freshly measured gap serves the bound, witnesses and current-reading callback; variable columns use the owning Jacobian.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the original normalized-separation convention, including its coincident-witness behavior, and every price, band and scaling expression; no fabricated separating direction is introduced.

## @evidence contracts/development/implementation.md#efficient-algorithms

Performs two velocity queries per n variables and stores O(n) row data; a supplied actual current gap removes the repeated closest-segment query, otherwise gap incurs its original constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fit supplies its evaluation's completed gap only for the identical ordered pair and unchanged current bones; witnesses feed current derivatives, the callback shares its scalar at that same reading, and another trial always invokes the actual gap owner.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows a supplied gap without mutation and owns row coefficients/read-only-index references; rows retain their pair, current reading and one scalar until release, while witness ownership stays with the evaluation or temporary constructor.

## @evidence contracts/development/common.md#meaningful-documentation

States the derivative, units, current-reading reuse, degeneracy convention, retained inputs and actual-trial evaluation.

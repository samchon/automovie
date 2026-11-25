# src/kinematics/BendClinicalNodes.ts#BendClinicalNodes.record

## @evidence contracts/development/common.md#meaningful-documentation

Requires a newly allocated chart and records only its nodes.

## @evidence contracts/development/implementation.md#principled-implementation

Traverse the ordinary records at the actual allocation boundary, before export consumers can replace fields.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A weak identity traversal visits each object once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No record is frozen and no scalar chart value is retained.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the number of links in the three constant charts, once at allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Repeated clinical readers can authenticate current nodes without exploring unknown replacements.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Weak identities do not retain the chart.

# src/kinematics/BendClinicalNodes.ts#BendClinicalNodes.owns

## @evidence contracts/development/common.md#meaningful-documentation

Names the returned identity predicate.

## @evidence contracts/development/implementation.md#principled-implementation

Use the actual allocation receipt before inspecting the candidate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A type check and weak identity lookup.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unknown records are not traversed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The scalar clinical reader uses the original authority before checking current values.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

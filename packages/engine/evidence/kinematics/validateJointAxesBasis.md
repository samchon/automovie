# src/kinematics/validateJointAxesBasis.ts#validateJointAxesBasis

## @evidence contracts/development/implementation.md#principled-implementation

Checks the conditions an orthonormal basis needs, finite and non-degenerate axes and pairwise zero cosines, computing each cosine from unit copies so the threshold is scale-free; orthogonality is checked only when every axis has a direction, since a cosine with a zero or non-finite axis is undefined.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns issues rather than throwing, so retargeting reports them as violations while `normalizeJointAxes` turns the first into an error; both read one rule set.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every basis meets the same thresholds; nothing is repaired, orthogonalized or defaulted, and no bone is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States each requirement with its threshold, that non-unit axes are accepted and why, when orthogonality is checked, the issue order and path shape, and that an empty list means usable.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: nine finiteness checks, three lengths and, when usable, three normalizations and three dot products.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Unit copies of the three admitted axes serve all three pairwise dot checks inside the call; issues are rebuilt for the current values and diagnostic path.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned issues.

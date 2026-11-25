# src/validation/AffordanceArticulation.ts#AffordanceArticulation.leader

## @evidence contracts/development/common.md#meaningful-documentation

States the coordinate identity, failure cases and distinction from reverse input permission.

## @evidence contracts/development/implementation.md#principled-implementation

Walk only follows references to the terminal articulation, with a visited set; spatial rides never change coordinate identity.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the terminal id of the shared chain walk.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Contains no arithmetic or fallback coordinate.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(D) time and space for follows depth D, bounded by the model's affordances.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure lookup over caller-owned affordances; a performance keeps the result with its immutable writer list.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing across calls.

# src/validation/AffordanceArticulation.ts#AffordanceArticulation.input

## @evidence contracts/development/common.md#meaningful-documentation

States units, domain checks, reversible permission, immutability, failures and the caller's duplicate-input responsibility.

## @evidence contracts/development/implementation.md#principled-implementation

Resolve the acyclic chain, check the requested joint, then invert each permitted coupling over its leader's legal domain with affordanceLeadingTravel. Endpoint recovery uses exact forward images, not a tolerance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One chain walk, then one upstream admission pass returning either a coordinate or the first failed admission.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Never reverses an unmarked coupling, clamps a request or chooses among duplicate inputs.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(D + T) work and O(D) space for chain depth D and inverse table rows T along it.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares coupling inversion and travel ranges with model admission and forward posing; no cross-call cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Temporary path data is released on return.

# src/validation/AffordanceArticulation.ts#AffordanceArticulation.travel

## @evidence contracts/development/common.md#meaningful-documentation

States the state's meaning, zero default, result unit and null failures.

## @evidence contracts/development/implementation.md#principled-implementation

Find the requested joint's independent degree, normalize that degree's authored coordinate with input, then apply its forward coupling chain in reverse path order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the path, find its one input, then walk forward to the joint.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not treat an absent follower key as zero when its leader or another reversible coordinate has already moved it.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(S times D + T) work for S state inputs, maximum chain depth D and tables T inverted on the relevant input; paths use O(D) temporary space. Operations read a small prop state once when planning their start.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses input and the one forward coupling owner; no duplicated inverse arithmetic or retained state.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing across calls.

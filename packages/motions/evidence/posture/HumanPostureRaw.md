# src/posture/HumanPostureRaw.ts#HumanPostureRaw.eligible

## @evidence contracts/development/common.md#meaningful-documentation

States the raw proof domain: no digit goals, finite root, angles and joint triples, free leg goals only and an optional finite rigid rotation.

## @evidence contracts/development/implementation.md#principled-implementation

Reads only declared fields: the optional digit goals, root, angles, joint triples, leg goals and rotation, in order. The compiler owns the posture's shape, so no key list is scanned; numerical validity and constructed graph provenance remain the solver's and issuer's responsibilities.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A guarded ordered predicate shares only the free-goal and vector helpers and obtains no rig or FK state.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No runtime type check, range coercion or resolved state is inferred; a posture outside the domain continues through ordinary resolution.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits J raw triples and G goals once with Object.values/entries and finite checks, retaining no verdict.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only the same raw-domain predicate is shared by preparation and transport consumers; each call repeats its current reads and no prior query supplies admission.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The predicate retains no input, result, callback or resource.
# src/posture/HumanPostureRaw.ts#HumanPostureRaw.signature

## @evidence contracts/development/common.md#meaningful-documentation

Defines ordinary getter/toJSON order, signed-zero lowering and unreadable/cyclic refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The original JSON.stringify and replacer execute once over the supplied raw object; only numeric negative zero lowers to its existing sentinel string.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One serialization owner preserves actual observation while constructor-owned graph checks separately establish numerical reuse proof.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Performs no component early exit or alternate hook/proxy probing, and its string cannot independently certify a pose.

## @evidence contracts/development/implementation.md#efficient-algorithms

Ordinary JSON traversal visits the complete selected graph in O(S) serialized data and produces one string; no second serializer or cached callback result is used.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The serialization implementation is shared, while every invocation executes its original raw observations independently and retains no previous verdict.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one string or undefined and retains no authoring object or callback.

# src/posture/HumanPostureRaw.ts#HumanPostureRaw.translated

## @evidence contracts/development/common.md#meaningful-documentation

Defines complete owned output, original source displacement, attached/world contexts and alias-once mutation.

## @evidence contracts/development/implementation.md#principled-implementation

structuredClone preserves the complete authored graph; subtract new minus source root, copy the requested root, then add that displacement to each free point/bend. One identity set prevents shared limb/digit goal objects from moving twice.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Existing vector arithmetic owns every changed coordinate; one copied graph and bounded shifted-goal set retain graph relationships and unchanged metadata.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No achieved endpoint replaces a demand, attached goals/external colliders keep their own frames and every root/point/bend expression keeps its original arithmetic order.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(S) full authoring clone and O(G) goal work/set entries preserve public nested ownership for S raw data and G limb/digit goals; no numerical solve occurs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses original source values only to construct this fresh output; the shifted set coalesces only actual aliased goal identity within this translation, never distinct query results.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Output belongs to the caller; the temporary goal set ends on return/throw and no source, target, reader or previous translation is retained.

# src/posture/HumanPostureRaw.ts#HumanPostureRaw.vector

## @evidence contracts/development/common.md#meaningful-documentation

Defines finite numeric world components and original short-circuit order.

## @evidence contracts/development/implementation.md#principled-implementation

Number.isFinite rejects nonnumeric/nonfinite components without coercion, using the original ordered reads.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar predicate owns raw eligibility's existing vector reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No descriptors, prototypes, rounding, normalization or value repair are introduced.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work with at most three actual reads and no allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Every supplied current vector is read independently.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanPostureRaw.ts#HumanPostureRaw.free

## @evidence contracts/development/common.md#meaningful-documentation

Defines a free goal as one that sets none of the declared contact, plant, reference or collider contexts, without claiming scalar or source validity.

## @evidence contracts/development/implementation.md#principled-implementation

Reads each declared optional context field of the goal type directly; the compiler owns the goal's shape, so no key list is scanned.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This one predicate owns raw eligibility's free-goal test.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No runtime key inspection, descriptor or prototype probing; it certifies neither a body nor a solved result.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: twelve field reads and no allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads every current goal independently, retaining no callback or predicate result.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
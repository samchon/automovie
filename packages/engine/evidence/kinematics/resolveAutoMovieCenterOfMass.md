# src/kinematics/resolveAutoMovieCenterOfMass.ts#resolveAutoMovieCenterOfMass

## @evidence contracts/development/implementation.md#principled-implementation

The whole-body centre of mass is the mass-weighted mean of segment centres; the extrapolated centre and margin are Hof's definitions. Raw and prepared-rig construction share the same neutral-segment to bone-rest transform and ordered mass admission.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Raw rest FK or the genuine prepared-rig rest owner feeds one private segmental model constructor; placement, extrapolation and margin keep their existing owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A segment on a missing bone or a massless profile throws instead of skewing the mean. FromRig accepts neither an external rest map nor a caller-derived admission flag; the rig factory's private rest owner rejects a foreign rig and does not call a replaceable public resolver.

## @evidence contracts/development/implementation.md#efficient-algorithms

Raw preparation resolves B rig bones, indexes fresh frames directly without a mapped B-tuple array and constructs S segment records, adding each neutral translation into its owned rotated offset. FromRig reads the existing immutable producer's actual neutral rows instead of rebuilding raw axes/topology/rest composition; first-demand neutral work remains with that producer. Both obtain B fresh frames locally and construct S segments. Placement and each mass mean remain linear in S; extrapolation reuses its fresh scaled velocity for the original centre-plus-offset sums.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

FromRig shares only actual neutral values owned by the immutable rig, using the same root-null, identity-articulation parent-first arithmetic. The body's lazy mass getter uses the rig made from that same unchanged skeleton; raw callers retain fresh live-skeleton resolution. No posed centre, target or query history is memoized here.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Rest frame copies and their local name map end with construction. The returned model owns new segment, point and axis records and borrows the profile's principal-moment vectors as before; no skeleton, rest reader or query history is retained. Genuine static neutral rows remain with the rig's existing lifetime.

## @evidence contracts/development/common.md#meaningful-documentation

States the segmental method, its source and the bone-local convention. Namespace fromRig consumes a genuine immutable rig's neutral rest, separately from the raw default's current skeleton; its local prose defines snapshot and returned-model ownership.

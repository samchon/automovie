# src/kinematics/RigidCarrierSample.ts#RigidCarrierSample.IHold

## @evidence contracts/development/common.md#meaningful-documentation

Gives the bounds in film seconds and the source predicate that owns endpoint inclusion.

## @evidence contracts/development/design.md#principled-representation

Bounding seconds describe the interval and a source-owned predicate establishes actual membership.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two bounds and one exact predicate suffice for routing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A numeric endpoint bound alone cannot certify the state at that clock value.

# src/kinematics/RigidCarrierSample.ts#RigidCarrierSample.IHold.contains

## @evidence contracts/development/common.md#meaningful-documentation

Defines the timebase, Boolean result and producer-owned endpoint rule.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

The carrier producer implements the clock arithmetic.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

This callable signature leaves implementation structure with the producer.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

The producer must prove stationary membership from its authored clock and owns the implementation evidence.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The producer's clock predicate determines the cost.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This callable signature implements no sharing. The producer supplies a predicate for its own stationary domain.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

This signature acquires no resources. The producer owns any state captured by the predicate.

# src/kinematics/RigidCarrierSample.ts#RigidCarrierSample.IBinding

## @evidence contracts/development/common.md#meaningful-documentation

Names each world-frame reader and the film clock they share.

## @evidence contracts/development/design.md#principled-representation

The exact functions are the identity-bearing inputs to the adapter.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A root reader and a socket reader are the complete pair.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Equivalent wrappers do not acquire a hold by comparing returned transforms.

# src/kinematics/RigidCarrierSample.ts#RigidCarrierSample.IRead

## @evidence contracts/development/common.md#meaningful-documentation

Names the current world placement and the producer's selected material frames.

## @evidence contracts/development/design.md#principled-representation

One snapshot holds the rigid frame and the selected material observations made from that same film second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A carrier anchor and its named contacts are enough for the supported-body reader.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares canonical world transforms. The producer owns the actual material geometry and time.

# src/kinematics/RigidCarrierSample.ts#RigidCarrierSample.IRead.point

## @evidence contracts/development/common.md#meaningful-documentation

States the material id, world space and already selected film second.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

The source owns the material placement law.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

This signature routes selected ids to the source's current reader.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

The implementing source guards material and its actual frame.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Per-point work belongs to the implementing source.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This method declares a same-time dependency. The source selects the shared geometry.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

This portable callback signature retains nothing itself. The implementation owns the snapshot lifetime.

# src/kinematics/RigidCarrierSample.ts#RigidCarrierSample.bind

## @evidence contracts/development/common.md#meaningful-documentation

Publishes the exact pair, source-authored stationary intervals and optional playback over current film seconds.

## @evidence contracts/development/implementation.md#principled-implementation

The model and exact callbacks are the admission provenance, with membership owned by the producer's film clock.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One registration, returning the original callbacks directly.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Registration does not infer a hold from a pose or velocity and invokes no reader.

## @evidence contracts/development/implementation.md#efficient-algorithms

Copying the finite domain list costs O(H) for H authored intervals.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every adapter of the same source pair receives the same immutable domain records.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The source root callback weakly owns its model, matching socket callback, optional evaluator and immutable domain list. No sampled result enters the registry.

# src/kinematics/RigidCarrierSample.ts#RigidCarrierSample.adapt

## @evidence contracts/development/common.md#meaningful-documentation

The original model and exact callbacks authorize their newly adapted prop.

## @evidence contracts/development/implementation.md#principled-implementation

The dual callback and model identity check covers both root and articulating sockets.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Lookup the source once and borrow its metadata only on an exact match.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The adapter invokes no authoring callback or hold predicate during transfer.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work with a weak lookup and identity checks.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The adapted readers borrow the original source's domain list.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The adapted prop weakly owns its matching callbacks and their domain metadata.

# src/kinematics/RigidCarrierSample.ts#RigidCarrierSample.holds

## @evidence contracts/development/common.md#meaningful-documentation

A changed callback or foreign prop falls back to ordinary reading.

## @evidence contracts/development/implementation.md#principled-implementation

The prop and both current own callback fields must match the issued adaptation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup and two own field comparisons.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Descriptor reads do not execute a foreign getter or sampler.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work independent of the requested film frame count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same frozen domains are returned only for current original readers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

This read registers no additional references.

# src/kinematics/RigidCarrierSample.ts#RigidCarrierSample.playback

## @evidence contracts/development/common.md#meaningful-documentation

Documents the callback identity and that the returned evaluator has no supplied time yet.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the same paired identity admission as the stationary domains, without requiring a stationary interval.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One guarded metadata read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Foreign and rewrapped callbacks retain their ordinary route; no source is invoked here.

## @evidence contracts/development/implementation.md#efficient-algorithms

The weak lookup and two descriptor comparisons take constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Returns the originally authored evaluator by identity while the callback pair still matches.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

No sample or additional state is retained by this read.

# src/actions/jumpState.ts#jumpState

## @evidence contracts/development/common.md#meaningful-documentation

Separates raw endpoint demand, achieved canonical shape and root-local geometry; limits the scope to the action's own posture.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the ordinary resolver, the declared rig's clamp and the existing final planted-refit owner, then reads actual FK with its rigid root removed. A free phase starts from achieved geometry rather than a separately reconstructed ankle/pitch request.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve and finalize once, admit its root, copy clinical joints, then transfer the private FK map's independently owned leg vectors and quaternions into endpoint records.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not move or certify the original planted goal, change a range, drop a contact solve or fake a plant in flight. Original push/landing targets remain authored and audited independently.

## @evidence contracts/development/implementation.md#efficient-algorithms

Canonical resolution, full clamp and planted refit run per endpoint, followed by complete joint admission/copy and four-name knee/ankle FK. The caller prepares the four-name reader once for both endpoints; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

HumanSegmentPlant policy is shared and one map supplies both feet/knees. Its fresh nested outputs transfer directly from the discarded private map without aliasing the input pose or another bone/query. Explicit synchronous FK/projector loans share equal prerequisites/ROM metadata through the solves, clamp, refit and observations; every joint is admitted.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned pose/joints/leg records belong to the plan. The leg reader belongs to the caller's preparation and nothing is retained at module level. Query maps/getter/projector end on return/throw or with their synchronous lender; no loan or external handle enters the state.

# src/actions/jumpState.ts#jumpState.prepareLegs

## @evidence contracts/development/common.md#meaningful-documentation

States the reader's bones, owner and lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to poseBones.prepare, the canonical FK owner, for the two knees and two ankles.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delegation over a fixed bone set.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads no pose and stores no result.

## @evidence contracts/development/implementation.md#efficient-algorithms

The name lookup and ancestry sort run once per plan rather than once per endpoint.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both endpoints of one plan share the reader, since the body does not change within it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The calling plan preparation owns the reader and releases it on return; nothing is retained at module level.

# src/actions/jumpState.ts#jumpState.ILeg

## @evidence contracts/development/common.md#meaningful-documentation

Point and knee pole are root-frame metres; rotation is the achieved unit foot quaternion in that frame.

## @evidence contracts/development/design.md#principled-representation

Actual FK supplies the ankle, middle joint and end rotation of one physical chain.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The free goal uses all three fields; no world support is asserted.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Stores achieved geometry rather than replacing it with rest lengths or requested foot angles.

# src/actions/jumpState.ts#jumpState.IState

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the canonical pose, physical world root, clinical-degree table and two root-frame legs.

## @evidence contracts/development/design.md#principled-representation

Carries both the actual canonical pose used for mass and the compact geometry used for free limb goals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four fields serve the ballistic COM and free-flight shape boundaries.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Keeps pose and articulation from the actual resolver instead of claiming raw target equality certifies a canonical state.

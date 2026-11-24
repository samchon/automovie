# src/actions/standFeet.ts#standFeet.ICourse

## @evidence contracts/development/common.md#meaningful-documentation

Documents each field's frame and share.

## @evidence contracts/development/design.md#principled-representation

The final ankle targets and the rigid-contact course are one plan.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The ankle targets, pelvis displacement and posture writer used by quiet standing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Uses the shared posture, placement and carry types.

# src/actions/standFeet.ts#standFeet.ISample

## @evidence contracts/development/common.md#meaningful-documentation

States the single-reading lifetime and the root/foot consumers; members state metres and carrying semantics.

## @evidence contracts/development/design.md#principled-representation

The same two rigid foot placements determine their mean displacement and the written goals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Quiet standing consumes both fields in one posture evaluation; the course retains no last query or sample history.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Uses existing posture and support-carry types and preserves the original rocker geometry.

# src/actions/standFeet.ts#standFeet

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, units and result.

## @evidence contracts/development/implementation.md#principled-implementation

Each planted foot rolls about its lowest displayed sole socket; pitch, roll and toe flexion approach their quiet values while the heading it stands at is kept (a flat sole turned on the floor would slide), and HumanFoot.pivot derives the ankle from that fixed contact at every share.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads the two contacts once, then evaluates the two rockers and their mean displacement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No ankle-height floor inference or contact translation is used for a planted foot.

## @evidence contracts/development/implementation.md#efficient-algorithms

One entry FK requests only planted socket bones and their ancestry; each socket set is measured once and each moving writer evaluates its rockers once per share. At exactly completed progress the already required flat endpoint geometry supplies fresh vector copies without repeating its fixed rotations and contact construction.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Entry sockets serve floor and pivot selection, and fixed share-one foot/contact geometry also serves the flat targets. Each caller-owned sample shares its placements between offset and writing; no time-query result is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The course retains the body, two entry contacts and two fixed endpoint placements/offsets for its plan; outward endpoint vectors are fresh copies, and each sample's two current placements end with that reading.

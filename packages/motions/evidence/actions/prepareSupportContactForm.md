# src/actions/prepareSupportContactForm.ts#prepareSupportContactForm

## @evidence contracts/development/common.md#meaningful-documentation

States fixed body geometry, lazy quiet-stance foot normals, world targets and scalar/vector retention rather than a retained posed reading.

## @evidence contracts/development/implementation.md#principled-implementation

Preserves the existing foot-toe, hand-socket and trunk/knee skin mapping, floor axes and bearing patterns. Actual fit requests retain downward normals and the same solved-quiet-stance inverse toe rotation; point-only observations omit unused normals.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One explicit normal demand and lazy fixed-foot datum precede the original contact-part branches; supportContact.form and point observations share this sole mapping owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No contact kind, floor threshold, bearing selector, target offset, axis or actual contact normal is approximated. Only point-only readers suppress the normal field; all fit forms retain its original default demand.

## @evidence contracts/development/implementation.md#efficient-algorithms

The first normal-bearing foot request performs one complete quiet-stance solve and FK of the observed toe ancestries; later feet reuse fixed normals. Point-only observations request no quiet-stance solve, and hand sockets are read only when their offset or normal is actually used.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The unchanged body's quiet standing pose defines both toe normals for this operation. Current contact targets and floor decisions remain per request, and no current support posture is shared with the datum.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One caller owns a body reference and at most two fixed local vectors until release; the quiet pose and FK map end with their synchronous measurement, and no time query, fitted support pose or workspace is retained.

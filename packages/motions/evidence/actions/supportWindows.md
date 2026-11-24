# src/actions/supportWindows.ts#supportWindows.bearing

## @evidence contracts/development/common.md#meaningful-documentation

Resolves the body part, bearing kind and support frame of a stance contact.

## @evidence contracts/development/implementation.md#principled-implementation

The same canonical part, kind and frame identify both entry bearings and emitted windows.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolves the part, then the target frame and bearing kind.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A self region keeps the performing subject and the target region.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The part vocabulary has fixed size.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Entry selection and window emission share this mapping.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

No state outlives the call.

# src/actions/supportWindows.ts#supportWindows.IKey

## @evidence contracts/development/common.md#meaningful-documentation

States both fields and their units.

## @evidence contracts/development/design.md#principled-representation

Each instant carries its solved contacts and seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the two key fields the schedule reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reads the same contacts used to carry each interval.

# src/actions/supportWindows.ts#supportWindows.Observe

## @evidence contracts/development/common.md#meaningful-documentation

States when it is called and with what.

## @evidence contracts/development/design.md#principled-representation

The window is the published record; its end is final once the schedule settles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

planLadderAccess reads it to seat each named grip.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It reads the published window and cannot change it.

# src/actions/supportWindows.ts#supportWindows

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, units and result.

## @evidence contracts/development/implementation.md#principled-implementation

Contacts open when placed and close when released; each named target supplies its own support frame, including the shared on target and self regions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads identities, opens and closes their spans, then closes the final spans.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No action-specific support override.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over solved contacts, with one map entry per currently held contact.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One read per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing after returning.

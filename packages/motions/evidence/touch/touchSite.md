# src/touch/touchSite.ts#touchSite

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, what the returned function takes and keeps, and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The draw is taken once, at plan time, so the place is one place through the touch; the offset is laid in the tangent plane the normal defines, and the reach rule is the shoulder's foot in that plane brought inside the radius.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fixed draw supplies polar coefficients; each frame selects along displacement, shoulder projection or the tangent basis actually needed by its form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is clamped silently: the rule's radius is the stated bound, and a negative radius throws.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the variation owner's original two uniform draws. The fixed site radius and those same draws determine polar coefficients once per plan; changing normals and shoulder-dependent reach projection still evaluate every call.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each call retains its original constant geometry. Only drawn/literal tangent offsets need a tangent basis; along displacement and shoulder projection skip that unused basis. A drawn site prepares square root/trigonometric polar coefficients once rather than repeating them across limb-search/frame reads.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan-owned reader retains its fixed site and at most two polar coefficients; original draw arrays end after setup, and each returned frame is independent with no pose or time history.

# src/touch/touchSite.ts#touchSite.span

## @evidence contracts/development/common.md#meaningful-documentation

States each input, the result's frame and unit and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A contact's length runs along its own `+X`, centred on its frame (`IAutoMovieAffordance.length`); the share of it is turned by the contact's rotation and then by the prop's displayed frame at the second, so a site on a moving prop moves with it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup, two refusals, one rotated vector.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is clamped: a share past the contact's ends and a contact without a length are refused with what would be accepted.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the prop through the context, the owner of its displayed frame.

## @evidence contracts/development/implementation.md#efficient-algorithms

One linear lookup over the prop's few contacts and one rotation at plan time; each film second then costs one frame read and one rotation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The returned function closes over the prop's reader and one vector.

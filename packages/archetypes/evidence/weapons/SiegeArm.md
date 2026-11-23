# src/weapons/SiegeArm.ts#SiegeArm.pendulum

## @evidence contracts/development/common.md#meaningful-documentation

States what is summed.

## @evidence contracts/development/implementation.md#principled-implementation

A uniform beam from the short end to the long end, the counterweight a point mass at the short end (it hangs from a pin, so its own swing does not turn the arm), the stone a point mass at the long end: `I = sum m r^2`, the centre of mass their weighted mean, at rest where it hangs lowest.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three masses, two sums.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The sling's swing is not modelled: the stone rides the arm's tip until release.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The one owner of the arm's mass figures, read by the throw and its spec.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/weapons/SiegeArm.ts#SiegeArm.lay

## @evidence contracts/development/common.md#meaningful-documentation

States what it lays.

## @evidence contracts/development/implementation.md#principled-implementation

Keep sourced arm lengths, axle height and declared angle range. Design the unsourced moving section against the exact whole-domain arm/cradle/cord support, then admit base/post and plumb-counterweight support. The pouch socket consumes that real section. Generic articulation moves the connected fittings; every solid enters the existing total-mass volume allocation, independently of the stated reduced launch mass law.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Frame, arm, counterweight and contacts, then connected shaft/cradle/span/control fittings through SiegeStructure.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Fixed frame/control stock remains separate from the admitted moving section. No fitting is hidden with zero share, no source length/angle/floor is shifted and no runtime pose clamp or new physical simulator replaces the declared launch approximation.

## @evidence contracts/development/implementation.md#efficient-algorithms

A bounded list of primitive fittings, two spans and at most six contacts; generic articulation and anchor span emission remain linear in that list.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

SiegeStructure owns each missing physical fitting and its articulation membership; the existing pendulum and draw owners are unchanged.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/human/skeleton/IAutoMovieHumanBindingLimb.ts#IAutoMovieHumanBindingLimb

## @evidence contracts/development/common.md#meaningful-documentation

One bone's piece of the binding tree: its capsule, the cuts that hand it skin from its parent, and the comparisons that tell it from its neighbours.

## @evidence contracts/development/design.md#principled-representation `bone`: The Human joint the limb starts at. `slot`: The rig bone's slot. `parent`: The limb its skin comes from, or null for the root.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLimbCapsule.family. Read by AutoMovieHumanCrotchBinding.place, AutoMovieHumanLimbCapsule.height, AutoMovieHumanLimbCapsule.nearest. Also types AutoMovieHumanCrotchBinding.knee.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `bone`, `slot`, `parent`, `from`, `to`, `near`, `far`, `turn`, `planes`, `lips`, `midline`, `clear`, `side`, `rivals`, `own`, `contest`, `kids`; callers supply the complete record.

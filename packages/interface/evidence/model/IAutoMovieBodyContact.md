# src/model/IAutoMovieBodyContact.ts#IAutoMovieBodyContact

## @evidence contracts/development/common.md#meaningful-documentation

States what each member is, its unit and range, and that an unmeasured one is absent.

## @evidence contracts/development/design.md#principled-representation

Five independent optional quantities, each present only for the outcomes its body has: a depth in metres, a dimensionless rolling-resistance coefficient, a share of speed, a breaking energy in joules and a glance angle in degrees from the normal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the interface as a body's optional flight datum (#3482), written by projectile, breakable and armour producers (#3499, #3500). Flight outcomes read the existing impact quantities; glance is admitted metadata whose performance outcome consumer is not connected yet.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An unmeasured quantity is absent, never a placeholder.

# src/striking/StrikingWeaponRecord.ts#StrikingWeaponRecord

## @evidence contracts/development/common.md#meaningful-documentation

States what the reader returns, when that changes and how a caller uses it.

## @evidence contracts/development/design.md#principled-representation

Identity of the built geometry is the fact a kept reading depends on, so the reader returns that object and nothing derived from it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One call without arguments; the law that owns the geometry supplies it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No version number, flag or key stands in for the geometry: the comparison is by the object itself.

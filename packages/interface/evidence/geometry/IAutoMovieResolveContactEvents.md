# src/geometry/IAutoMovieResolveContactEvents.ts#IAutoMovieResolveContactEvents.IStops

## @evidence contracts/development/common.md#meaningful-documentation

Weapon IDs map to their resolved contact time in seconds in the resolver clock. ReadonlyMap prevents mutation through this view; it neither freezes the underlying map nor admits time values.

## @evidence contracts/development/design.md#principled-representation

Weapon IDs map to their resolved contact time in seconds in the resolver clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The resolver passes one read-only view to weapon paths and body readers during a search.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

ReadonlyMap prevents mutation through this view; it neither freezes the underlying map nor admits time values.

# src/geometry/IAutoMovieResolveContactEvents.ts#IAutoMovieResolveContactEvents.IWeaponFrame

## @evidence contracts/development/common.md#meaningful-documentation

One initial pair carries its nonpositive metre gap, seconds search span, current stops and ungated gap reader. The at reader reports actual pair geometry; a departure certificate cannot be inferred from sparse distance samples alone.

## @evidence contracts/development/design.md#principled-representation

One initial pair carries its nonpositive metre gap, seconds search span, current stops and ungated gap reader.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The resolver passes this state to the body's optional departure certifier before first-impact search.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The at reader reports actual pair geometry; a departure certificate cannot be inferred from sparse distance samples alone.

# src/geometry/IAutoMovieResolveContactEvents.ts#IAutoMovieResolveContactEvents.IInitialContact

## @evidence contracts/development/common.md#meaningful-documentation

Documents IAutoMovieResolveContactEvents.IInitialContact: Actual initial pair state, with an ungated reader of its signed gap.

## @evidence contracts/development/design.md#principled-representation

One record of weapon, from, to, stops, gap, at.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Its producer fills it and the enclosing IAutoMovieResolveContactEvents contract's readers use it; nothing else is declared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with its producer.

# src/geometry/IAutoMovieResolveContactEvents.ts#IAutoMovieResolveContactEvents.Departure

## @evidence contracts/development/common.md#meaningful-documentation

The clearance branch carries a later seconds instant; the no-entry branch certifies the complete current search span. The discriminant prevents a no-entry certificate from requiring a meaningless time; proof of physical departure remains the producer's obligation.

## @evidence contracts/development/design.md#principled-representation

The clearance branch carries a later seconds instant; the no-entry branch certifies the complete current search span.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Body physical models produce certificates consumed and checked by resolveAutoMovieContactEvents.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The discriminant prevents a no-entry certificate from requiring a meaningless time; proof of physical departure remains the producer's obligation.

# src/geometry/IAutoMovieResolveContactEvents.ts#IAutoMovieResolveContactEvents.IGrid

## @evidence contracts/development/common.md#meaningful-documentation

States the grid's seconds, the clipped last step and that each search after a contact has its own grid.

## @evidence contracts/development/design.md#principled-representation

A first second, a span end and a positive step are exactly what determines the seconds a search reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The resolver hands it to a weapon's and a body's speed readers, which prepare their bound for that search.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No second is cached; a positive finite step remains the resolver's admission.

# src/geometry/IAutoMovieResolveContactEvents.ts#IAutoMovieResolveContactEvents.Speed

## @evidence contracts/development/common.md#meaningful-documentation

States both seconds, the metre-a-second bound over grid seconds only and the undefined uncertified case.

## @evidence contracts/development/design.md#principled-representation

A reader of one interval's bound, so a side that holds still only for a while can state a tighter bound there.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `IWeapon.speed` and `IBody.speed`; the first-impact scan reads it where it advances.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Only a certified bound may be returned; undefined keeps every grid step read.

# src/geometry/IAutoMovieResolveContactEvents.ts#IAutoMovieResolveContactEvents.IWeapon

## @evidence contracts/development/common.md#meaningful-documentation

A world-metre centre and optional tail describe a sphere or capsule with a finite seconds live span. Tail and tailRadius remain optional to preserve existing sphere, uniform-capsule and tapered-capsule uses; compatible combinations need runtime/caller admission.

## @evidence contracts/development/design.md#principled-representation

A world-metre centre and optional tail describe a sphere or capsule with a finite seconds live span.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Caller-owned path functions supply moving geometry to the resolver, indexed by unique weapon and carrying-body IDs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Tail and tailRadius remain optional to preserve existing sphere, uniform-capsule and tapered-capsule uses; compatible combinations need runtime/caller admission.

# src/geometry/IAutoMovieResolveContactEvents.ts#IAutoMovieResolveContactEvents.IBody

## @evidence contracts/development/common.md#meaningful-documentation

World-metre signed-distance readers share the weapon seconds clock and report positive values outside. Capsule queries require axis support; optional readers express actual capabilities, and the interface cannot certify distance-field accuracy.

## @evidence contracts/development/design.md#principled-representation

World-metre signed-distance readers share the weapon seconds clock and report positive values outside.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The body's physical model owns distance, optional segment distance, departure and carried-weapon readers used by the resolver.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Capsule queries require axis support; optional readers express actual capabilities, and the interface cannot certify distance-field accuracy.

# src/geometry/IAutoMovieResolveContactEvents.ts#IAutoMovieResolveContactEvents.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Moving weapons and bodies share an ordered seconds search span and a positive seconds scan step. Array types do not enforce unique identities, valid spans or positive step; the resolver and geometric producers own those premises.

## @evidence contracts/development/design.md#principled-representation

Moving weapons and bodies share an ordered seconds search span and a positive seconds scan step.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveAutoMovieContactEvents consumes the caller's geometry arrays synchronously to build stop events.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Array types do not enforce unique identities, valid spans or positive step; the resolver and geometric producers own those premises.

# src/geometry/IAutoMovieResolveContactEvents.ts#IAutoMovieResolveContactEvents.IEvent

## @evidence contracts/development/common.md#meaningful-documentation

One resolved weapon/body pair records its stopping instant in the input seconds clock. A receipt contains actual identity keys, not sampled geometry or a general collision-free certificate.

## @evidence contracts/development/design.md#principled-representation

One resolved weapon/body pair records its stopping instant in the input seconds clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveAutoMovieContactEvents publishes these scalar receipts for downstream motion stops.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A receipt contains actual identity keys, not sampled geometry or a general collision-free certificate.

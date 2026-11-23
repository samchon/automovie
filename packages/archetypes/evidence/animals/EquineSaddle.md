# src/animals/EquineSaddle.ts#EquineSaddle.lay

## @evidence contracts/development/common.md#meaningful-documentation

States what it adds and what it reads.

## @evidence contracts/development/implementation.md#principled-implementation

The saddle sits over the rig's hitch and the stirrups hang below it. Each rein is a span between its head-local bit point and its trunk-carried hand contact, extending behind the hand by half the occupied grip run.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The saddle and its seat, the pommel and cantle, then each side's stirrup and rein.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only the saddle carries mass. Rein geometry and held-frame direction are recomputed by the shared span owner; neither the hand nor the bit is moved to fit a rigid rod.

## @evidence contracts/development/implementation.md#efficient-algorithms

Nine parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one saddle.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineSaddle.ts#EquineSaddle.rein

## @evidence contracts/development/common.md#meaningful-documentation

States what it lays, where and which contact it declares.

## @evidence contracts/development/implementation.md#principled-implementation

A span between the head-local bit point and the trunk-carried hand contact, extending behind the hand by half the occupied grip run.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One contact and one span; the riding saddle, the side saddle and the bareback bridle call it so their reins are one.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Rein geometry and held-frame direction are recomputed by the shared span owner; neither the hand nor the bit is moved to fit a rigid rod.

## @evidence contracts/development/implementation.md#efficient-algorithms

One part and one contact.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by every bridled tack.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineSaddle.ts#EquineSaddle.bareback

## @evidence contracts/development/common.md#meaningful-documentation

States what is laid, where the seat sits and what is absent.

## @evidence contracts/development/implementation.md#principled-implementation

The seat's front edge stands on the back over the rig's hitch, `BAREBACK` ahead of its rear, `SEAT_WIDTH` wide; the reins are `rein`'s.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One contact, then both reins.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No part stands in for the horse's back; the seat's depth is a named estimate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two parts and three contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `rein`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineSaddle.ts#EquineSaddle.pillion

## @evidence contracts/development/common.md#meaningful-documentation

States what it adds and where.

## @evidence contracts/development/implementation.md#principled-implementation

The pad's front edge at the cantle, `SADDLE_GAP` behind it, its top `PILLION.thick` over the back; the seat's front edge at the pad's front.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One pad and one seat.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The pad's sizes are named estimates; it carries no mass, none read.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One part.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one pad.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineSaddle.ts#EquineSaddle.trick

## @evidence contracts/development/common.md#meaningful-documentation

States what it adds and where.

## @evidence contracts/development/implementation.md#principled-implementation

Each fitting placed from the saddle's own top, pommel and barrel.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One fitting at a time.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The sizes are named estimates; the fittings carry no mass, none read.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A few parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one set.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineSaddle.ts#EquineSaddle.lead

## @evidence contracts/development/common.md#meaningful-documentation

States what it lays and where.

## @evidence contracts/development/implementation.md#principled-implementation

Bind the halter point to the built head, then span from the independently carried hand origin with half a held run of overhang; shared span posing keeps the full hand contact and current halter on the same physical line.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rod and its contact.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The rope is straight and massless, no maker's weight read.

## @evidence contracts/development/implementation.md#efficient-algorithms

One part.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same part anchor and held-span operations as both riding reins.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

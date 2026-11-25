# src/core/ArchetypeBuilderTypes.ts#ArchetypeBuilderTypes.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's meaning.

## @evidence contracts/development/design.md#principled-representation

The model's identity and the producer's draw session, which carries the producer's name, the values keyed by its closed union and where each came from, so the archetype's record is the session's and cannot disagree with it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the builder; every producer writes one and `build` reads every member. `id` is optional because a scene holding one such thing needs none.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No registry key: the archetype's name is text for messages only.

# src/core/ArchetypeBuilderTypes.ts#ArchetypeBuilderTypes.IOptions

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

Optical swatch and proxy opacity, followed by positive relative density or absolute mass share, rigid rotation and physical surface.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the builder; each member is read when a part is recorded and set by at least one producer.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Density and share are two optional members, not a union: a looseness that remains, bounded by the rule on `share` that a producer stating one states it for every part.

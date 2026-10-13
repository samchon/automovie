# Complete-surface ownership in the space layer

## Surface allocation closed before source authorship {#space-surface-ownership}
<!--
@evidence contracts/surface-ownership.md#whole-surface-owner 03's two allocation tables assign complete elevations, eight roof slopes, room interiors, storey substrates, stair, paving, and fence to their surface owners while calculation files retain no faces. Current spaces source and geometry observations exist; the integrated census including every later model member and finish remains unverified rather than being inferred from document-path counts.
-->

The [original contract](../../contracts/surface-ownership.md#whole-surface-owner) requires declaring owners and authoring files by elevation, room and floor when phase 1 closes, without dividing one surface. In spaces, [exterior-surface allocation](../../spaces/03-surface-owners.md#exterior-surface-handoff) and [room-interior allocation](../../spaces/03-surface-owners.md#interior-surface-handoff) own this declaration.

The allocation tables name `src/spaces/envelope/<face>.ts` for four elevations, `src/spaces/roof/<face>.ts` for eight slopes, `src/spaces/rooms/<room>.ts` for fifteen room interiors, and the respective `src/spaces/site/<paving>.ts` and `fence.ts` owners for exterior paving and fence surfaces. `src/spaces/storeys.ts` supplies [storey datums](../../spaces/01-storeys.md#storey-datums) rather than another surface owner. A count or extraction of document paths cannot establish actual face ownership, omissions, or duplicates.

Shared calculation files own no surfaces. `building.ts`, `roof/junctions.ts`, `openings.ts`, `boundaries.ts` and `site.ts` calculate and hand off only coordinates, intersections, opening forms, junction regions and exterior connections. The elevation owner owns a wall's complete exterior surface and the room owner its interior face, while [shared-wall allocation](../../spaces/07-boundary-assembly.md#interior-boundary-ownership) and [exterior-wall junctions](../../spaces/07-boundary-assembly.md#exterior-boundary-junctions) define one structural datum.

The assigned author in the table is this production's sole author. A transfer hands over a complete face, keeping members, repetition, and finish together. The original allocation preceded source authorship; current spaces source and compiled geometry observations now exist. Those observations concern the produced spaces skeleton, while full surface ids, face counts, and the omission/duplication census across all model fills, repeated members, and finishes remain unverified. This account records the ownership declaration rather than claiming that partial source output completes every surface.

<!--
@evidence discovery/core/common.md#shared-local-boundary In this manor, the continuous gallery, the single turning stair and the straight corridor of the same main house cannot be replaced by another connection form. Separately from the general connection validity of the reusable space contracts, this fixed graph is kept as the preservation item below.
@evidence discovery/core/common.md#canonical-realization Authority over the fixed graph lies in settings/003-spatial-basis.md, and spaces/001-manor.md#manor-space and src/spaces/manor.ts#manorSpaceSource take the design and the registered source respectively. The Manor spatial requirements are realized by the authored space claim in lint.config.ts connects this contract to the space H2.
@evidence discovery/core/settings.md#directive-promise-subject-requirements settings/003-spatial-basis.md owns the single main house and the per-room direct connections, settings/002-household.md the family background and every household item, and settings/001-production.md the image-based visual delivery and observation completion. The physical fitness of a real building is classified as not required in delivery-scope.
@evidence discovery/core/settings.md#planned-delivery-backcast coordinate-datum and single-stair set the datum levels and stair form shared by the actual space carrier and the 3D models and placement. reference-priority and visual-grammar set the exterior, furniture and materials, and observation-population sets observation of the actual render; no physical-usability proxy form is adopted as an additional condition.
@evidence discovery/design/spaces.md#work-specific-space-requirements Preserves the fixed composition in which, in the south-opening U-shaped main house, required ground-floor rooms connect directly to the same gallery and required upper-floor rooms to the same straight corridor. The item below and the existing space claim own this production-specific form and add no numerical condition of real-building usability.
-->
# Manor space preservation contract

**Status:** production decision, user-confirmed.

The subject is the whole single main house of `medieval-baron-manor`. The user-confirmed spatial
graph is owned by [spatial conditions of the single manor](../settings/003-spatial-basis.md).
This contract is the condition that every space design preserves those connections.

## Adopted spatial requirements {#manor-spatial-requirements}

Within one south-opening U-shaped main house, the entrance, the continuous gallery, the single central
turning stair, the upper straight corridor and the direct connections of the required rooms are
preserved. The walls, floors, openings and stair geometry of the actual source must express that
composition. Registering only room names, filling the stair opening with a plan that merges room
volumes, or making another room reachable only by passing through a required room fails this condition.

The design owner is [the actual manor space](../spaces/001-manor.md#manor-space), and the
registered source is `manorSpaceSource` in `src/spaces/manor.ts`. The derived space this source
consumes is currently generated from the actual geometry of `src/models/manor.js` and the
placement of `src/instances/manor.js`. Generated output that does not match the current source,
or spatial expression not confirmed in the current render, is never used as grounds for completion.

Review question: Do the current 3D main house, each storey, the rooms, galleries, turning stair, corridor and openings preserve the settings' fixed spatial composition in actual form?

Sources: [main house and central garden](../settings/003-spatial-basis.md#single-house), [ground-floor direct connections](../settings/003-spatial-basis.md#ground-access), [single central turning stair](../settings/003-spatial-basis.md#single-stair), [upper-floor direct connections](../settings/003-spatial-basis.md#upper-access), [whole delivery scope](../settings/001-production.md#delivery-scope).

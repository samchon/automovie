# Spatial solids retained by building assembly

When adding independent architectural members, consume the completed spaces producer once. This document owns membership retaining that output in the assembly, without reauthoring wall/floor/roof geometry or spatial-graph coordinates.

## Retaining rooms and the circulation graph {#room-membership}

<!--
@evidence principles/core/common.md#declared-basis Uses createTempleEnvironment rooms/storey/boundaries/openings/connectors, preserving space IDs and contacts unchanged.
@evidence principles/core/common.md#scope-preservation Retains entrance, courtyard, colonnade, sanctuary, offering, administration, records, storage, yard, and both exterior approaches.
@evidence principles/core/common.md#substantive-completion Preserves original space arrays/routes, assigning new members only to their IDs without a second plan graph.
@evidence principles/core/inherited-units.md#derived-parent-differentiation The graph is parent output; this layer adds only membership preserving all spaces/routes during placement.
@evidence principles/design/instances.md#instance-prototype-boundary Retains producer floor/wall prototypes without changing room dimensions or holes in placement.
@evidence principles/design/instances.md#instance-derivation-authority Reads room membership from same-environment IDs rather than approximate names or duplicate graphs.
@evidence principles/design/instances.md#instance-verification-address Checks actual remaining passage through four central directions, corners, and thresholds of eight interior spaces and the yard.
@evidence obligations/design/instances.md#instance-prototype-membership Includes every producer model/element and all nine spaces in the assembly.
@evidence obligations/design/instances.md#instance-identity-transform Preserves original space-element IDs, parents, spaces, and transforms.
@evidence obligations/design/instances.md#instance-placement-review Examines thresholds/opposite views for placed members inside usable widths along the main-door/fountain/sanctuary axis and east service route.
@evidence spaces/building.md#containment Retains building root, one storey, and nine-space containment after member additions.
@evidence spaces/storey.md#ground-storey Preserves the common storey datum of floors/thresholds.
@evidence spaces/circulation.md#public-route Preserves entrance-to-ring access and direct sanctuary/all-room connections.
@evidence spaces/circulation.md#service-route Retains east exterior service door and yard/colonnade connection without detour rooms.
@evidence spaces/building.md#approach-contacts Preserves IDs/heights of the main two-step and level service exterior contacts.
@evidence spaces/site.md#site-connections Retains only two site/building connectors, excluding neighbors from the circulation graph.
@evidence spaces/rooms/sanctuary.md#sanctuary-volume Preserves the broad high axial sanctuary's floor, walls, openings, and boundaries.
@evidence spaces/rooms/offering.md#offering-volume Preserves the long west offering space and direct colonnade door.
@evidence spaces/rooms/administration.md#office-volume Preserves southeast administration and its single door.
@evidence spaces/rooms/records.md#records-volume Preserves separate records north of administration and its direct door.
@evidence spaces/rooms/storage.md#storage-volume Preserves storage north of records and its direct door.
@evidence spaces/rooms/service-yard.md#yard-volume Preserves northeast open sky and both exterior/colonnade accesses.
@evidence settings/10-building.md#fixed-graph Consumes one colonnade ring and direct room connections unchanged.
@evidence settings/10-building.md#ground-access Retains main steps and level service contact from the same producer.
@evidence settings/30-interiors.md#sanctuary Placed members must not erase sanctuary identity or high roof underside.
@evidence settings/30-interiors.md#offering-room Retains the long west interior and direct access.
@evidence settings/30-interiors.md#administration Retains southeast administration location/access.
@evidence settings/30-interiors.md#records Retains the separate east-middle records space.
@evidence settings/30-interiors.md#storage Retains the separate east-north storage space.
@evidence settings/30-interiors.md#service-yard Retains northeast yard sky and exterior access.
@evidence settings/00-delivery.md#operator-access Preserves original addresses so tools can find room IDs and actual openings/connectors.
@evidence settings/00-delivery.md#operative-subjects Retains fixed objects/space addresses without adding acting or people.
@evidence settings/00-delivery.md#accessibility Inherits the requirement that placement not block colonnade/actual thresholds.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work Preserving nine spaces and ten connectors requires no containment revision or new movement route.
-->

Building assembly retains nine spaces, 52 boundaries, 16 openings, and ten connectors. Do not delete or copy spatial models/elements/floor supports. Add only new columns, beams, frames, leaves, tiles, and fountain bound to existing space IDs. From inside each room, its exit to the colonnade must remain visible. Preserve the main-axis sightline toward sanctuary and both yard-door paths. Props are not yet members at this stage; building completion does not establish their completion.

## Retaining envelope and inner-wall surfaces {#shell-membership}

<!--
@evidence principles/core/common.md#declared-basis Uses one producer's facade, wall-junction, floor, dado, and roof models/element transforms.
@evidence principles/core/common.md#scope-preservation Retains four facades, outer corners, lower interior bands, floors, and all roof substrate surfaces.
@evidence principles/core/common.md#substantive-completion Existing surfaces must remain once at original positions/material boundaries after adding tiles/frames.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This membership decides full retention of parent solids without redefining their geometry.
@evidence principles/design/instances.md#instance-prototype-boundary Retains spatial surface models/transforms and adds architectural models as separate building.md sets.
@evidence principles/design/instances.md#instance-derivation-authority Uses one space producer for walls/floors/roofs, preventing a second envelope.
@evidence principles/design/instances.md#instance-verification-address Uses four facades, corners, floor/band boundaries, and all roof/underside views as counterexamples.
@evidence obligations/design/instances.md#instance-prototype-membership Retains every existing spatial model/element once.
@evidence obligations/design/instances.md#instance-placement-review Reads new frame/tile contacts with existing reveals/roofs and band continuity on actual surfaces.
@evidence spaces/building.md#footprint Does not expand original X=±10.5m/Z=±10.25m through placement.
@evidence spaces/facades/east.md#east-envelope Retains actual east administrative wall and exterior service door.
@evidence spaces/facades/west.md#west-envelope Retains offering exterior and exposed high-sanctuary facade.
@evidence spaces/facades/north.md#north-envelope Retains rear sanctuary/yard walls and high windows.
@evidence spaces/facades/south.md#south-envelope Retains recessed porch and both front returns.
@evidence spaces/junctions.md#wall-junctions Retains internal T joins and outer corners as composed spatial envelope.
@evidence spaces/storey.md#wall-ground-contact Retains plinth-bottom solids meeting existing site grade.
@evidence spaces/ownership.md#interior-dado Retains lower red bands as separate existing-wall surface addresses.
@evidence spaces/ownership.md#surface-map Preserves floor/wall/reveal/roof upper/soffit/edge ownership IDs.
@evidence settings/20-envelope.md#walls Retains plaster envelope, thick stone plinth, and opening depth as actual spatial solids.
@evidence settings/20-envelope.md#stone-floors Retains large stone and smaller east-room paving as original floor surfaces.
@evidence settings/20-envelope.md#material-language Preserves plaster/stone/timber/red-tile distinctions throughout space surfaces.
@evidence settings/10-building.md#scale Does not revise the roughly 430m² single-storey outline/courtyard through instance scale.
@evidence settings/10-building.md#civic-identity Retains civic-temple envelope identity with courtyard, continuous colonnade, and axial sanctuary.
@evidence materials/20-space-bindings.md#space-binding-map Every existing surface address consumes the same binding table.
@evidence materials/20-space-bindings.md#material-junctions Dado/plinth/plaster/roof/timber boundaries remain on actual owned surfaces.
@evidence materials/20-space-bindings.md#material-review-set Retains bindings of all 96 spatial surfaces without arbitrary placement-level defaults.
@evidence materials/00-surface-palette.md#dado Retains the independent lower red-band material.
@evidence materials/00-surface-palette.md#plaster Retains warm plaster on four facades/interior walls.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work Retaining original surface prototypes/transforms requires no new wall depth, floor level, or surface ownership.
-->

Retain every spatial model/element once. Floors match original supports, dado has a distinct address from plaster, and all four facades remain actual wall solids after assembly. Red roof substrate does not count as repeated tiles; building.md owns actual tile sets separately. Inspection roof-off hides roofs, ceilings, and independent timber only in views, without deleting delivery-environment membership.

## Retaining site surfaces and distant ridge {#ground-membership}

<!--
@evidence principles/core/common.md#declared-basis Uses producer temple-site/site-distant surfaces, supports, and connectors.
@evidence principles/core/common.md#scope-preservation Retains four local site strips, both approaches, paving, earth, curbs, distant ridge, and foothills.
@evidence principles/core/common.md#substantive-completion Preserves original site elements beneath site.root and adds only neighbors/vegetation from site.md.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Retains complete ground/ridge membership, defining the boundary with added object sets at placement.
@evidence principles/design/instances.md#instance-prototype-boundary Uses original ground/paving/ridge models without replacing them with neighbor/tree prototypes.
@evidence principles/design/instances.md#instance-derivation-authority Reads one site producer's grade/extent for every site surface/contact.
@evidence principles/design/instances.md#instance-verification-address Checks ground through setting overview, both approaches, east/west alley sections, and low street views.
@evidence obligations/design/instances.md#instance-prototype-membership Retains every original site/site-distant model/element.
@evidence obligations/design/instances.md#instance-placement-review Observes earth/wall, curb/paving, and site/foothill contacts in the environment including new neighbors/vegetation.
@evidence spaces/site.md#site-extent Retains local rectangle, four convex cells, and site.root as separate site ownership.
@evidence spaces/site.md#distant-ridge Retains volumetric ridge/foothills as exterior background outside walking spaces.
@evidence settings/40-environment.md#distant-terrain Retains low volumetric background once without photo billboards.
@evidence materials/00-surface-palette.md#distant-ridge Retains separate ridge earth key on original surfaces.
@evidence materials/00-surface-palette.md#earth Retains original earth strips, neighbor ground, and foothill surfaces.
@evidence materials/00-surface-palette.md#paving Retains street/alleys/both approach paving.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work Full retention of original site surfaces/supports requires no extent, slope, or distant-ridge changes.
-->

Building/site roots remain separate. After retaining original ground pieces, curbs, paving, and ridge, add only site.md's three neighbors, four trees, and six grass clumps. Outside local site, only volumetric ridge/foothills remain, without extra rooms, trees, or roads. Preserve the main stair-foot and level exterior service heights unchanged.

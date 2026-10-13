# Public and service access on one storey

## Entrance and colonnade circulation {#public-route}

<!--
@evidence principles/core/common.md#scope-preservation Retains the main contact→two steps→door→courtyard axis, four-sided colonnade circulation, and every room's direct access in one route design.
@evidence principles/core/common.md#substantive-completion Distinguishes exterior→entrance from entrance→colonnade and defines courtyard south-tread width/depth and bidirectional check order.
@evidence principles/core/common.md#declared-basis Uses settings for movement envelopes and entrance/storey for section/heights; an API return is not an actual collision result.
@evidence principles/design/spaces.md#space-topology Uses paths within one colonnade union instead of same-space from/to connectors, without splitting the ring into rooms for representation convenience.
@evidence principles/design/spaces.md#space-boundary-authority Circulation owns route meaning only, consuming door/stair/floor dimensions from existing opening/entrance/storey addresses.
@evidence principles/design/spaces.md#space-verification-address Tests bidirectional threshold continuity at every door and turning envelopes at ring corners, rejecting graph reachability or camera movement alone as passage proof.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Adds actual main/courtyard entry sequence and same-space path representation to the single-colonnade parent relation.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Read fixed-graph direct access and use-profile walking/carrying envelopes with level changes. Internal ring paths and room doors accommodate them without another corridor or new parent user conditions.
@evidence settings/10-building.md#fixed-graph Attaches every room door to the only ring, south→east→north→west→south.
@evidence settings/10-building.md#use-profile Applies settings' walking/carrying envelopes unchanged to bidirectional door passage and corner turns.
@evidence obligations/design/spaces.md#space-access-circulation Connects public entry with actual doors, floors, and turning envelopes on one ring; the next unit connects service access from its separate contact to that same colonnade.
-->

Public access starts at [building contact](building.md#approach-contacts) `contact-temple-public`. Passing the [entrance](rooms/entrance.md#entrance-volume)'s two stone steps, upper landing, and `door-entry` reaches the south colonnade. Continuing straight descends the courtyard south step to the central basin. Colonnade circulation follows one floor south→east→north→west→south without corner doors or closed walls. Sanctuary, offering, administration, records, and storage each join this ring through their own [door](openings.md#doors).

Internal circulation is a continuous path inside one `colonnade` volume. Public `IAutoMovieBuiltConnector` joins distinct spaces, and `validateBuiltEnvironment` rejects equal from/to, so do not create a `colonnade → colonnade` connector or promote cells to spaces to represent the ring. Room doors and courtyard steps connect different actual spaces. Read internal circulation as paths in the union together with actual floors, obstacles, and turning envelopes. This is a topology representation plan, not route measurement.

Reserve width 1.8m and horizontal depth 0.35m for the south-axis courtyard tread, deriving its riser from storey heights. Its connector must meet that actual tread. [Colonnade cells](rooms/colonnade.md#ring-volume) own colonnade clearance; this document declares no duplicate width. Walking/carrying use the unchanged [settings envelope](../settings/10-building.md#use-profile).

Main access consumes actual risers, treads, and landing from the [entrance section](rooms/entrance.md#entrance-volume). Exterior→entrance stairs and entrance→colonnade door passage are different connections; each tread does not create another space. Input route heights/widths or `builtConnectorSectionAt` returns cannot pass measured stair clearance. That public function returns or interpolates declared connector width/clear height, requiring separate comparison of passage envelopes with actual beams, bases, and open leaves. Replacing stair rise with a ramp or adding a third step before the landing disagrees with this design.

Read the actual traversable door/connector sequence along shared floor boundaries and interference from open leaves. Traverse each door both ways and check turning envelopes at all four ring corners. Free camera movement or simple adjacency-graph reachability is insufficient. `src/spaces/circulation.ts` owns route meaning, consuming geometry singly owned by rooms, doors, and storey.

Check each door as room floor→[threshold inside wall thickness](storey.md#threshold-support)→opposite floor. Connector endpoints inside rooms do not allow omission of intermediate support. Read heights, extents, and ownership of both actual threshold-adjoining floors and usable passage behind open leaves, including the service door's exterior-ground junction.

## Deliveries from yard to storage {#service-route}

<!--
@evidence principles/core/common.md#scope-preservation Includes the full exterior-service-door→yard→colonnade→storage delivery route without traversing sanctuary or records.
@evidence principles/core/common.md#substantive-completion Fixes arrival order and heights from contact-temple-service through door-service-exterior, door-yard, and door-storage.
@evidence principles/core/common.md#declared-basis Uses existing settings/storey inputs for use envelopes and service heights, and site ownership for exterior ground/connectors.
@evidence principles/design/spaces.md#space-topology Uses the short northeast colonnade segment without piercing the yard/storage shared wall or adding a loop.
@evidence principles/design/spaces.md#space-boundary-authority Consumes contacts, door locations, and floors from building/openings/storey; owns delivery sequence and turns.
@evidence principles/design/spaces.md#space-verification-address Makes actual obstacle distances at the narrow yard doorway, northeast turn, and bidirectional thresholds counterexamples.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Narrows service-yard permission into a delivery route through three named doors without entering sanctuary.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Applied small-offering carrying envelopes and service-threshold limits. One level without stairs or sanctuary passage needs no revision to use scope.
@evidence settings/10-building.md#ground-access Continues one storey height from exterior door to storage without confusing it with main-entrance stone steps.
@evidence settings/30-interiors.md#service-yard Uses exterior delivery and direct colonnade access as a route joining the yard's two doors.
-->

Service access starts at [building contact](building.md#approach-contacts) `contact-temple-service`, received from paving before the service door in the site's east alley. Carry small offerings through `door-service-exterior`→[service yard](rooms/service-yard.md#yard-volume)→`door-yard`→northeast colonnade→`door-storage`→storage center. The entire route from exterior contact is at one storey floor height without traversing sanctuary or records. It shares a short existing colonnade segment without a separate circulation corridor.

The carrying envelope cannot pass through walls, columns, or open leaves, including while turning. Check turns especially before the narrow yard door and at the northeast corner. The [site/building connection](site.md#site-connections) service connector receives exterior access from Y=0 ground; do not copy the lower main-road height here. Counterexamples are bidirectional thresholds, longitudinal floor sections, and compiled distances to the nearest obstacle. Actual world triangles and SAT were compared against 0.8m-square door passage at height 0.01~1.90m, 1.5m colonnade width, and a 0.8√2m square covering every turning orientation. Sampling every 0.01m with movement-axis expansion of 0.01m covers the continuous sweep. Movement/turn collisions were 0 on service route (X,Z)=(10.8,-6.4)→(7.8,-6.4)→(7.8,-3.15)→(4.7225,-3.15)→(4.7225,-0.3)→(7.8,-0.3). An alternative yard lane at X=6.6m collided with an open leaf and was rejected; this does not claim passage on every free path. Floor support was read separately in longitudinal sections.

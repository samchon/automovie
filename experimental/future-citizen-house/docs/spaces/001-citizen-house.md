# 시민 주택 공간 설계

## 시민 주택 공간 {#citizen-house-space}
<!--
@evidence principles/core/common.md#declared-basis This space H2 declares the one-box, two-storey spatial basis used by the source.
@evidence principles/core/common.md#scope-preservation This space H2 preserves the fixed graph and does not add a courtyard, bridge, void, second stair, or branch corridor.
@evidence principles/core/common.md#substantive-completion This space H2 names the complete room, envelope, opening, circulation, and fit-out realization expected downstream.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This space H2 carries forward the settings dimensions, privacy basis, and household program into the spatial realization.
@evidence principles/design/spaces.md#space-boundary-authority This space H2 owns the rectangular house boundary and its logical room cells.
@evidence principles/design/spaces.md#space-topology This space H2 owns the storey, room, opening, and single-stair topology.
@evidence principles/design/spaces.md#space-verification-address This space H2 names the source owner and the compiled spatial observations used to verify it.
@evidence upstream/design/spaces.md#settings-and-map-revision-from-space-work This space H2 reports the spatial decisions that feed back to the selected settings and coordinate basis.
@evidence settings/001-production.md#delivery-scope This space H2 realizes the library delivery scope inherited from production settings.
@evidence settings/001-production.md#governing-aim This space H2 realizes the governing everyday-household aim.
@evidence settings/001-production.md#production-visual-grammar This space H2 realizes the declared material and visual grammar.
@evidence settings/001-production.md#delivery-review-condition This space H2 realizes the topology that supplies the required review population.
@evidence settings/001-production.md#roles-and-accessibility This space H2 supports the source/viewer role and access boundary.
@evidence settings/002-household.md#household-program This space H2 realizes the household scope.
@evidence settings/002-household.md#ground-program This space H2 realizes the ground-floor program.
@evidence settings/002-household.md#upper-program This space H2 realizes the upper-floor program.
@evidence settings/002-household.md#program-boundary This space H2 preserves the household program boundary.
@evidence settings/003-spatial-basis.md#coordinate-datum This space H2 realizes the declared coordinate datum and target dimensions.
@evidence settings/003-spatial-basis.md#ground-graph This space H2 realizes the ground-floor graph.
@evidence settings/003-spatial-basis.md#upper-graph This space H2 realizes the upper-floor graph.
@evidence settings/003-spatial-basis.md#envelope-and-privacy This space H2 realizes the envelope and privacy strategy.
@evidence settings/003-spatial-basis.md#surface-decomposition This space H2 realizes the surface ownership declaration.
@evidence contracts/citizen-house-spatial-requirements.md#citizen-house-spatial-requirements This space H2 realizes the production-local spatial contract.
-->

**Status:** construction draft, [공간 기준](../settings/003-spatial-basis.md)과 사용자 고정 공간 그래프의 직접 realization.

이 H2는 `citizen-house` building 하나, `ground-storey`와 `upper-storey` 두 level, 외부 `site-pad`와 모든 내부 room을 포함하는 하나의 environment graph를 소유한다. 건물 root의 world bounds는 11.0×12.0m이며 모든 logical room은 정확히 한 storey의 child다. source는 `src/spaces/citizen-house.ts#citizenHouseSpaceSource` 하나가 이 H2를 carrier로 내보낸다.

1층 graph는 `entry → common-room`, `entry → flex-workroom`, `entry → powder-utility`, `common-room → storage-1f`, `entry → upper-corridor`의 단일 꺾임계단이다. `common-room`은 living, dining, kitchen을 나누지 않는 하나의 연속 room이다. 2층 graph는 `upper-corridor`에서 `primary-bedroom`, `child-bedroom-1`, `child-bedroom-2`, `upper-bathroom`, `upper-storage`, `upper-service`로 직접 문이 난다. upper corridor 외의 corridor를 만들지 않으며, 모든 연결은 `passage` 또는 유일한 `stair` connector다.

외피는 front stair curtainwall, front flex curtainwall, rear common curtainwall, left return envelope, right opaque service envelope로 분해한다. 각 curtainwall bay의 x 또는 z 간격과 sill/head는 floor line과 대응 room boundary에 맞춰 source loop에서 파생한다. glass fill은 material 상태로 clear·electrochromic·translucent 역할을 나타내며 실제 shader나 전기 장치의 성능을 대신 주장하지 않는다.

명시 fit-out은 entry bench/shoe storage/charging niche, flex desk/chair/shelf/folding surface, common sofa/table/media wall/dining table six seats/kitchen island/sink/cooktop/refrigerator/pantry/recycling cabinet, ground core utility and storage, primary bed/bedside/wardrobe/desk, 두 child bed/wardrobe/desk, upper bathroom vanity/toilet/shower-tub/towel storage, corridor lighting, upper storage cabinets다. 지붕에는 roof slab, four-sided supported PV canopy, repeated solar/slat modules와 shading fins를 둔다.

**공간별 관찰 owner.**

compiled topology에서 setting one, exposed elevation four, every exposed corner, roof/top underside, every opening/entry를 얻는다. 각 room의 threshold, 네 inside corners, room center의 +X/-X/+Z/-Z를 별도 observation target으로 파생한다. 이 문서에 대표 view를 임의로 골라 분모를 줄이는 규칙은 없다. 다섯 reference의 외관·절개 조감·common room·flex room·upper private area는 이 population에 추가되는 질문이며, section axonometric은 inspection-only다.

**검증 경계.**

컴파일 전에는 안정 id와 authored bounds만 확인할 수 있고, 현재 sandbox의 package junction 때문에 실제 engine compile과 viewer capture는 `unverified`다. source가 시각적으로 잘 보인다는 판단, 법규·구조·에너지·설비 작동·인체 사용성의 통과는 이 H2가 아직 주장하지 않는다.

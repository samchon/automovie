# 방별 고정 사물 배치

건물 완료 뒤 이어가는 소품 단계의 명시 배치 입력이다. 이 문서는 역할·수·수평 좌표·회전·받침 관계를 정한다. 원형 geometry·part·UV0와 재료는 부모 소유다. 모든 배율은 1, parent는 temple.root, 공간은 표의 해당 방이다. 난수·seed·LOD 변경 없이 단일 정지 tier를 쓴다. 좌표는 월드 X/Z 미터, yaw는 Y축 라디안이다. 바닥형의 translationY=floor−실제 minY, 받침형은 hostTranslationY+선택 part 높이−실제 minY다. support의 height가 있으면 해당 part 범위 안의 판/턱 높이를 선택하고 없으면 maxY다. 받침을 먼저, 자식을 다음에 생성하되 role은 생성 순서와 독립된다. 표는 닫힌 명시 역할의 입력이며 반복 개체는 산문 식만을 따른다.

## 제실의 축과 낮은 의례 집기 {#sanctuary}

<!--
@evidence principles/core/common.md#declared-basis sanctuary의 실제 공간·원형·설정 부모에서 아래 역할과 좌표·받침을 선택한다.
@evidence principles/core/common.md#scope-preservation 제실의 축과 낮은 의례 집기의 명시 membership 전체를 포함하고 구조·새 작동 상태·다른 방 집기를 만들지 않는다.
@evidence principles/core/common.md#substantive-completion 표와 반복 식의 모든 역할에 원형·좌표·회전·host를 정해 다음 source가 essential 배치를 새로 선택하지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모의 원형과 사용 예약에서 실제 수·좌표·회전·접촉 및 최악 관찰을 이 단위가 더한다.
@evidence principles/design/instances.md#instance-prototype-boundary 명시된 기존 원형과 명명 변형만 사용하고 silhouette·축척·재료를 바꾸지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority 명시 표와 반복 식이 유일한 수평 배치 입력이고 Y는 실제 geometry와 host datum에서 산출한다.
@evidence principles/design/instances.md#instance-verification-address 아래 문턱·상면·근접에서 전 개체, 접촉과 사용 경로를 반증한다.
@evidence obligations/design/instances.md#addressable-instance-decisions sanctuary의 집기·받침 관계·수·배치를 독립 H2로 소유한다.
@evidence obligations/design/instances.md#instance-prototype-membership 각 표 역할과 선언된 반복 칸은 정확히 한 원형에 해당한다.
@evidence obligations/design/instances.md#instance-identity-transform 명명 role·단위 배율·월드 좌표·회전은 실행순서나 난수와 독립된다.
@evidence obligations/design/instances.md#instance-variation-tiers 기존 명명 변형만 단일 정지 tier로 사용하며 거리별 교체나 색 override가 없다.
@evidence obligations/design/instances.md#instance-placement-review 실제 포락·바닥/host 접촉·문 스윙·보행 경로 및 전 개체의 근접 가시성을 검사한다.
@evidence settings/30-interiors.md#sanctuary sanctuary의 사용 기능과 집기·고정 상태를 아래 membership으로 구현한다.
@evidence spaces/rooms/sanctuary.md#sanctuary-volume 방의 평면·문·완성면·집기/보행 예약을 소비하고 경계나 숨은 연결을 바꾸지 않는다.
@evidence spaces/storey.md#ground-storey 실내 Y=0과 중정 Y=−0.12m 및 국소 제단 단의 소유를 유지한다.
@evidence materials/10-model-bindings.md#binding-map 각 part의 기존 재료 결속과 반복 길이를 그대로 재사용한다.
@evidence models/fixtures.md#altar altar의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/fixtures.md#niche niche의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/fixtures.md#lampstand lampstand의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/wares.md#small-vessel small-vessel의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/wares.md#offering-bowl offering-bowl의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/portable.md#textile textile의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/ritual.md#censer censer의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/ritual.md#floor-cushion floor-cushion의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence settings/35-objects.md#altar sanctuary에서 쓰는 altar의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#lampstands sanctuary에서 쓰는 lampstands의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#vessels sanctuary에서 쓰는 vessels의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#textile sanctuary에서 쓰는 textile의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#censer sanctuary에서 쓰는 censer의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#floor-cushion sanctuary에서 쓰는 floor-cushion의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence materials/00-surface-palette.md#stone sanctuary 집기의 stone part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#metal sanctuary 집기의 metal part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#ceramic sanctuary 집기의 ceramic part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#textile sanctuary 집기의 textile part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work sanctuary의 원형 크기·원점과 방 경계·문·사용 예약을 이 수량·좌표·받침에 대조해 기존 부모 설계가 수용함을 확인했다.
-->

제단 중심 (0,−7.7)m의 석단 후면 Z=−8.5m에서 북벽까지 1.15m, 전면 Z=−6.9m에서 남벽까지 2.75m 활동 깊이를 남긴다. 북벽 감실의 뒷변은 Z=−9.65m에 닿고 칸의 용기는 아래 턱 Y=0.75m에 놓인다. 등잔대는 X=±1.8m이며 제단 위에는 그릇·향로·작은 천을 서로 떨어뜨린다. 두 바닥 좌구 중심은 X=±0.55m로 사이 0.64m를 남긴다. 중앙 문 축·제단 앞 3/4·감실 정면·좌구 근접에서 모든 집기와 접촉을 본다.

| role | prototype builder | X/Z·yaw·support 입력 |
| --- | --- | --- |
| `sanctuary.altar` | `altar` | `0,-7.7` |
| `sanctuary.niche` | `niche` | `0,-9.65` |
| `sanctuary.niche-vessel` | `small` | `0,-9.37,0,atop("sanctuary.niche","recess-frame",0.75)` |
| `sanctuary.lamp.west` | `lampstand` | `-1.8,-7.7` |
| `sanctuary.lamp.east` | `lampstand` | `1.8,-7.7` |
| `sanctuary.bowl` | `bowl` | `0,-7.9,0,atop("sanctuary.altar","top")` |
| `sanctuary.censer` | `ritual.censer()` | `-0.4,-7.9,0,atop("sanctuary.altar","top")` |
| `sanctuary.cloth` | `cloth` | `0.4,-7.5,0,atop("sanctuary.altar","top")` |
| `sanctuary.cushion.west` | `ritual.floorCushion()` | `-0.55,-6.1` |
| `sanctuary.cushion.east` | `ritual.floorCushion()` | `0.55,-6.1` |

## 긴 봉헌 탁자와 벽가 진열 {#offering}

<!--
@evidence principles/core/common.md#declared-basis offering의 실제 공간·원형·설정 부모에서 아래 역할과 좌표·받침을 선택한다.
@evidence principles/core/common.md#scope-preservation 긴 봉헌 탁자와 벽가 진열의 명시 membership 전체를 포함하고 구조·새 작동 상태·다른 방 집기를 만들지 않는다.
@evidence principles/core/common.md#substantive-completion 표와 반복 식의 모든 역할에 원형·좌표·회전·host를 정해 다음 source가 essential 배치를 새로 선택하지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모의 원형과 사용 예약에서 실제 수·좌표·회전·접촉 및 최악 관찰을 이 단위가 더한다.
@evidence principles/design/instances.md#instance-prototype-boundary 명시된 기존 원형과 명명 변형만 사용하고 silhouette·축척·재료를 바꾸지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority 명시 표와 반복 식이 유일한 수평 배치 입력이고 Y는 실제 geometry와 host datum에서 산출한다.
@evidence principles/design/instances.md#instance-verification-address 아래 문턱·상면·근접에서 전 개체, 접촉과 사용 경로를 반증한다.
@evidence obligations/design/instances.md#addressable-instance-decisions offering의 집기·받침 관계·수·배치를 독립 H2로 소유한다.
@evidence obligations/design/instances.md#instance-prototype-membership 각 표 역할과 선언된 반복 칸은 정확히 한 원형에 해당한다.
@evidence obligations/design/instances.md#instance-identity-transform 명명 role·단위 배율·월드 좌표·회전은 실행순서나 난수와 독립된다.
@evidence obligations/design/instances.md#instance-variation-tiers 기존 명명 변형만 단일 정지 tier로 사용하며 거리별 교체나 색 override가 없다.
@evidence obligations/design/instances.md#instance-placement-review 실제 포락·바닥/host 접촉·문 스윙·보행 경로 및 전 개체의 근접 가시성을 검사한다.
@evidence settings/30-interiors.md#offering-room offering의 사용 기능과 집기·고정 상태를 아래 membership으로 구현한다.
@evidence spaces/rooms/offering.md#offering-volume 방의 평면·문·완성면·집기/보행 예약을 소비하고 경계나 숨은 연결을 바꾸지 않는다.
@evidence spaces/storey.md#ground-storey 실내 Y=0과 중정 Y=−0.12m 및 국소 제단 단의 소유를 유지한다.
@evidence materials/10-model-bindings.md#binding-map 각 part의 기존 재료 결속과 반복 길이를 그대로 재사용한다.
@evidence models/fixtures.md#offering-table offering-table의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/fixtures.md#display-shelf display-shelf의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/wares.md#carry-jar carry-jar의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/wares.md#small-vessel small-vessel의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/wares.md#offering-bowl offering-bowl의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/portable.md#offering-tray offering-tray의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/portable.md#votive-plaque votive-plaque의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/portable.md#portable-lamp portable-lamp의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/portable.md#textile textile의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence settings/35-objects.md#offering-table offering에서 쓰는 offering-table의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#shelves offering에서 쓰는 shelves의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#vessels offering에서 쓰는 vessels의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#offering-tray offering에서 쓰는 offering-tray의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#votive-plaque offering에서 쓰는 votive-plaque의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#portable-lamp offering에서 쓰는 portable-lamp의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#textile offering에서 쓰는 textile의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence materials/00-surface-palette.md#stone offering 집기의 stone part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#timber offering 집기의 timber part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#metal offering 집기의 metal part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#ceramic offering 집기의 ceramic part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#textile offering 집기의 textile part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work offering의 원형 크기·원점과 방 경계·문·사용 예약을 이 수량·좌표·받침에 대조해 기존 부모 설계가 수용함을 확인했다.
-->

탁자는 (−7.7,0)m에서 장축 Z를 유지한다. 양옆 통로와 직접 문 Z=2.175m를 비운다. 북·서 벽 선반은 벽에서 0.02m 떨어지고 방 안을 바라본다. offering 선반 판 윗면 높이는 0.13/0.58/1.03/1.40m이며 표의 support 높이만 선택한다. 쟁반 속 그릇은 쟁반 floor에 닿고 봉헌판·작은 도기·등잔·운반 항아리는 서로 다른 칸 자리를 받는다. 문턱·장축 양끝·선반 정면과 탁자 상면에서 낮은 탁자, 크기가 다른 도기, 금속 그릇과 부재 접촉을 본다.

| role | prototype builder | X/Z·yaw·support 입력 |
| --- | --- | --- |
| `offering.table` | `fixtures.offeringTable()` | `-7.7,0` |
| `offering.shelf.west` | `fixtures.displayShelf("offering")` | `-9.88,-6.5,Math.PI/2` |
| `offering.shelf.north` | `fixtures.displayShelf("offering")` | `-7.5,-9.63` |
| `offering.tray` | `portable.offeringTray()` | `-7.7,-0.55,0,atop("offering.table","top")` |
| `offering.tray-bowl` | `bowl` | `-7.7,-0.55,0,atop("offering.tray","floor")` |
| `offering.small-vessel` | `small` | `-7.7,0.1,0,atop("offering.table","top")` |
| `offering.cloth` | `textile` | `-7.7,0.65,0,atop("offering.table","top")` |
| `offering.plaque` | `portable.votivePlaque()` | `-7.8,-9.43,0,atop("offering.shelf.north","board",1.03)` |
| `offering.shelf-vessel` | `small` | `-7.1,-9.43,0,atop("offering.shelf.north","board",0.58)` |
| `offering.shelf-jar` | `carry` | `-9.68,-6.1,Math.PI/2,atop("offering.shelf.west","board",0.13)` |
| `offering.lamp` | `lamp` | `-9.68,-6.8,0,atop("offering.shelf.west","board",0.58)` |

## 단일 작성 책상과 도구 {#administration}

<!--
@evidence principles/core/common.md#declared-basis administration의 실제 공간·원형·설정 부모에서 아래 역할과 좌표·받침을 선택한다.
@evidence principles/core/common.md#scope-preservation 단일 작성 책상과 도구의 명시 membership 전체를 포함하고 구조·새 작동 상태·다른 방 집기를 만들지 않는다.
@evidence principles/core/common.md#substantive-completion 표와 반복 식의 모든 역할에 원형·좌표·회전·host를 정해 다음 source가 essential 배치를 새로 선택하지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모의 원형과 사용 예약에서 실제 수·좌표·회전·접촉 및 최악 관찰을 이 단위가 더한다.
@evidence principles/design/instances.md#instance-prototype-boundary 명시된 기존 원형과 명명 변형만 사용하고 silhouette·축척·재료를 바꾸지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority 명시 표와 반복 식이 유일한 수평 배치 입력이고 Y는 실제 geometry와 host datum에서 산출한다.
@evidence principles/design/instances.md#instance-verification-address 아래 문턱·상면·근접에서 전 개체, 접촉과 사용 경로를 반증한다.
@evidence obligations/design/instances.md#addressable-instance-decisions administration의 집기·받침 관계·수·배치를 독립 H2로 소유한다.
@evidence obligations/design/instances.md#instance-prototype-membership 각 표 역할과 선언된 반복 칸은 정확히 한 원형에 해당한다.
@evidence obligations/design/instances.md#instance-identity-transform 명명 role·단위 배율·월드 좌표·회전은 실행순서나 난수와 독립된다.
@evidence obligations/design/instances.md#instance-variation-tiers 기존 명명 변형만 단일 정지 tier로 사용하며 거리별 교체나 색 override가 없다.
@evidence obligations/design/instances.md#instance-placement-review 실제 포락·바닥/host 접촉·문 스윙·보행 경로 및 전 개체의 근접 가시성을 검사한다.
@evidence settings/30-interiors.md#administration administration의 사용 기능과 집기·고정 상태를 아래 membership으로 구현한다.
@evidence spaces/rooms/administration.md#office-volume 방의 평면·문·완성면·집기/보행 예약을 소비하고 경계나 숨은 연결을 바꾸지 않는다.
@evidence spaces/storey.md#ground-storey 실내 Y=0과 중정 Y=−0.12m 및 국소 제단 단의 소유를 유지한다.
@evidence materials/10-model-bindings.md#binding-map 각 part의 기존 재료 결속과 반복 길이를 그대로 재사용한다.
@evidence models/fixtures.md#desk desk의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/fixtures.md#stool stool의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/fixtures.md#display-shelf display-shelf의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/wares.md#scroll scroll의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/wares.md#small-vessel small-vessel의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/portable.md#stylus stylus의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/portable.md#writing-tablet writing-tablet의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/portable.md#textile textile의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/portable.md#portable-lamp portable-lamp의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence settings/35-objects.md#workstation administration에서 쓰는 workstation의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#shelves administration에서 쓰는 shelves의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#scrolls administration에서 쓰는 scrolls의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#vessels administration에서 쓰는 vessels의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#stylus administration에서 쓰는 stylus의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#writing-tablet administration에서 쓰는 writing-tablet의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#textile administration에서 쓰는 textile의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#portable-lamp administration에서 쓰는 portable-lamp의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence materials/00-surface-palette.md#timber administration 집기의 timber part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#metal administration 집기의 metal part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#ceramic administration 집기의 ceramic part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#parchment administration 집기의 parchment part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#textile administration 집기의 textile part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work administration의 원형 크기·원점과 방 경계·문·사용 예약을 이 수량·좌표·받침에 대조해 기존 부모 설계가 수용함을 확인했다.
-->

동벽 가까이 (9.2,7.5)m의 작성 책상을 +90° 회전하고 스툴은 서쪽 (8.35,7.5)m로 빼 문에서 접근한다. 두루마리·필기판·첨필·작은 도구 용기는 책상 top 윗면 0.75m에서 서로 분리한다. 남벽의 짧은 선반은 북쪽을 바라보고 소량 도기·등잔·천만 받는다. administration형 판 윗면은 0.13/0.68/1.20m다. 문에서 스툴까지와 역방향, 책상 상면 근접·선반 정면에서 작성실이 기록실과 구별되는지 본다.

| role | prototype builder | X/Z·yaw·support 입력 |
| --- | --- | --- |
| `administration.desk` | `fixtures.desk("writing")` | `9.2,7.5,Math.PI/2` |
| `administration.stool` | `stool` | `8.35,7.5` |
| `administration.shelf` | `fixtures.displayShelf("administration")` | `8.2,9.63,Math.PI` |
| `administration.scroll` | `wares.scroll("open")` | `9.12,7.25,Math.PI/2,atop("administration.desk","top")` |
| `administration.tablet` | `portable.writingTablet()` | `9.18,7.75,Math.PI/2,atop("administration.desk","top")` |
| `administration.stylus` | `portable.stylus()` | `9.38,7.7,Math.PI/2,atop("administration.desk","top")` |
| `administration.tool-vessel` | `small` | `9.39,7.15,0,atop("administration.desk","top")` |
| `administration.cloth` | `cloth` | `7.98,9.48,Math.PI/2,atop("administration.shelf","board",0.68)` |
| `administration.shelf-vessel` | `small` | `8.45,9.48,0,atop("administration.shelf","board",0.13)` |
| `administration.lamp` | `lamp` | `8.42,9.48,0,atop("administration.shelf","board",0.68)` |

## 스무 칸의 두루마리와 열람 자리 {#records}

<!--
@evidence principles/core/common.md#declared-basis records의 실제 공간·원형·설정 부모에서 아래 역할과 좌표·받침을 선택한다.
@evidence principles/core/common.md#scope-preservation 스무 칸의 두루마리와 열람 자리의 명시 membership 전체를 포함하고 구조·새 작동 상태·다른 방 집기를 만들지 않는다.
@evidence principles/core/common.md#substantive-completion 표와 반복 식의 모든 역할에 원형·좌표·회전·host를 정해 다음 source가 essential 배치를 새로 선택하지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모의 원형과 사용 예약에서 실제 수·좌표·회전·접촉 및 최악 관찰을 이 단위가 더한다.
@evidence principles/design/instances.md#instance-prototype-boundary 명시된 기존 원형과 명명 변형만 사용하고 silhouette·축척·재료를 바꾸지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority 명시 표와 반복 식이 유일한 수평 배치 입력이고 Y는 실제 geometry와 host datum에서 산출한다.
@evidence principles/design/instances.md#instance-verification-address 아래 문턱·상면·근접에서 전 개체, 접촉과 사용 경로를 반증한다.
@evidence obligations/design/instances.md#addressable-instance-decisions records의 집기·받침 관계·수·배치를 독립 H2로 소유한다.
@evidence obligations/design/instances.md#instance-prototype-membership 각 표 역할과 선언된 반복 칸은 정확히 한 원형에 해당한다.
@evidence obligations/design/instances.md#instance-identity-transform 명명 role·단위 배율·월드 좌표·회전은 실행순서나 난수와 독립된다.
@evidence obligations/design/instances.md#instance-variation-tiers 기존 명명 변형만 단일 정지 tier로 사용하며 거리별 교체나 색 override가 없다.
@evidence obligations/design/instances.md#instance-placement-review 실제 포락·바닥/host 접촉·문 스윙·보행 경로 및 전 개체의 근접 가시성을 검사한다.
@evidence settings/30-interiors.md#records records의 사용 기능과 집기·고정 상태를 아래 membership으로 구현한다.
@evidence spaces/rooms/records.md#records-volume 방의 평면·문·완성면·집기/보행 예약을 소비하고 경계나 숨은 연결을 바꾸지 않는다.
@evidence spaces/storey.md#ground-storey 실내 Y=0과 중정 Y=−0.12m 및 국소 제단 단의 소유를 유지한다.
@evidence materials/10-model-bindings.md#binding-map 각 part의 기존 재료 결속과 반복 길이를 그대로 재사용한다.
@evidence models/fixtures.md#scroll-shelf scroll-shelf의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/fixtures.md#chest chest의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/fixtures.md#desk desk의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/fixtures.md#stool stool의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/wares.md#scroll scroll의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/portable.md#stylus stylus의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/portable.md#writing-tablet writing-tablet의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/portable.md#textile textile의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/portable.md#rope-coil rope-coil의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence settings/35-objects.md#shelves records에서 쓰는 shelves의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#chests records에서 쓰는 chests의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#workstation records에서 쓰는 workstation의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#scrolls records에서 쓰는 scrolls의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#stylus records에서 쓰는 stylus의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#writing-tablet records에서 쓰는 writing-tablet의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#textile records에서 쓰는 textile의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#rope-coil records에서 쓰는 rope-coil의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence materials/00-surface-palette.md#timber records 집기의 timber part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#metal records 집기의 metal part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#parchment records 집기의 parchment part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#textile records 집기의 textile part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#rope-fibre records 집기의 rope-fibre part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work records의 원형 크기·원점과 방 경계·문·사용 예약을 이 수량·좌표·받침에 대조해 기존 부모 설계가 수용함을 확인했다.
-->

북벽 선반 뒷변은 (7.8,1.87)m다. 다섯 받침 높이 0.04/0.37/0.70/1.03/1.36m와 네 가로 편차 −0.6575/−0.21875/+0.21875/+0.6575m를 조합한다. role records.scroll.tier-i.cell-j마다 i+j 짝수면 rolled, 홀수면 bundle 한 개체를 X축으로 놓고 Z=2.07m를 쓴다. 20개체 중 말린 것 10, 묶음 10이며 실제 minY를 판 높이에 맞춘다. 앞 0.9m 접근과 문 스윙을 비우고 열람대·스툴·닫힌 궤를 동쪽에 둔다. 표 외 출력 목록은 만들지 않는다. 선반의 20칸 정면·각 단 근접·열람대 상면·궤 앞에서 전 개체와 접촉을 본다.

| role | prototype builder | X/Z·yaw·support 입력 |
| --- | --- | --- |
| `records.shelf` | `fixtures.scrollShelf()` | `7.8,1.87` |
| `records.chest` | `chest` | `9.4,2.95,-Math.PI/2` |
| `records.desk` | `fixtures.desk("reading")` | `9.15,4.3,Math.PI/2` |
| `records.stool` | `stool` | `8.35,4.3` |
| `records.tablet` | `portable.writingTablet()` | `9.15,4.05,Math.PI/2,atop("records.desk","top")` |
| `records.stylus` | `portable.stylus()` | `9.32,4.25,Math.PI/2,atop("records.desk","top")` |
| `records.cloth` | `cloth` | `9.4,2.95,0,atop("records.chest","lid")` |
| `records.rope` | `portable.ropeCoil()` | `9.12,4.5,0,atop("records.desk","top")` |

## 벽가의 용기와 두 종류 받침 {#storage}

<!--
@evidence principles/core/common.md#declared-basis storage의 실제 공간·원형·설정 부모에서 아래 역할과 좌표·받침을 선택한다.
@evidence principles/core/common.md#scope-preservation 벽가의 용기와 두 종류 받침의 명시 membership 전체를 포함하고 구조·새 작동 상태·다른 방 집기를 만들지 않는다.
@evidence principles/core/common.md#substantive-completion 표와 반복 식의 모든 역할에 원형·좌표·회전·host를 정해 다음 source가 essential 배치를 새로 선택하지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모의 원형과 사용 예약에서 실제 수·좌표·회전·접촉 및 최악 관찰을 이 단위가 더한다.
@evidence principles/design/instances.md#instance-prototype-boundary 명시된 기존 원형과 명명 변형만 사용하고 silhouette·축척·재료를 바꾸지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority 명시 표와 반복 식이 유일한 수평 배치 입력이고 Y는 실제 geometry와 host datum에서 산출한다.
@evidence principles/design/instances.md#instance-verification-address 아래 문턱·상면·근접에서 전 개체, 접촉과 사용 경로를 반증한다.
@evidence obligations/design/instances.md#addressable-instance-decisions storage의 집기·받침 관계·수·배치를 독립 H2로 소유한다.
@evidence obligations/design/instances.md#instance-prototype-membership 각 표 역할과 선언된 반복 칸은 정확히 한 원형에 해당한다.
@evidence obligations/design/instances.md#instance-identity-transform 명명 role·단위 배율·월드 좌표·회전은 실행순서나 난수와 독립된다.
@evidence obligations/design/instances.md#instance-variation-tiers 기존 명명 변형만 단일 정지 tier로 사용하며 거리별 교체나 색 override가 없다.
@evidence obligations/design/instances.md#instance-placement-review 실제 포락·바닥/host 접촉·문 스윙·보행 경로 및 전 개체의 근접 가시성을 검사한다.
@evidence settings/30-interiors.md#storage storage의 사용 기능과 집기·고정 상태를 아래 membership으로 구현한다.
@evidence spaces/rooms/storage.md#storage-volume 방의 평면·문·완성면·집기/보행 예약을 소비하고 경계나 숨은 연결을 바꾸지 않는다.
@evidence spaces/storey.md#ground-storey 실내 Y=0과 중정 Y=−0.12m 및 국소 제단 단의 소유를 유지한다.
@evidence materials/10-model-bindings.md#binding-map 각 part의 기존 재료 결속과 반복 길이를 그대로 재사용한다.
@evidence models/fixtures.md#chest chest의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/wares.md#storage-jar storage-jar의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/wares.md#carry-jar carry-jar의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/wares.md#basket basket의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/portable.md#jar-rack jar-rack의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/portable.md#textile textile의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/portable.md#rope-coil rope-coil의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/ritual.md#jar-stand jar-stand의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence settings/35-objects.md#chests storage에서 쓰는 chests의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#vessels storage에서 쓰는 vessels의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#baskets storage에서 쓰는 baskets의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#jar-rack storage에서 쓰는 jar-rack의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#textile storage에서 쓰는 textile의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#rope-coil storage에서 쓰는 rope-coil의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#jar-stand storage에서 쓰는 jar-stand의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence materials/00-surface-palette.md#timber storage 집기의 timber part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#stone storage 집기의 stone part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#ceramic storage 집기의 ceramic part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#wicker storage 집기의 wicker part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#textile storage 집기의 textile part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#rope-fibre storage 집기의 rope-fibre part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work storage의 원형 크기·원점과 방 경계·문·사용 예약을 이 수량·좌표·받침에 대조해 기존 부모 설계가 수용함을 확인했다. 두 자리 받침 source가 홈 대신 온전한 판과 고리를 낸 결함은 model source에서 기존 문서의 0.268m 홈 바닥으로 수리하며 임의 인스턴스 높이로 숨기지 않는다.
-->

북쪽 두 자리 받침은 (7.4,−1.65)m, 항아리 중심은 X=7.11/7.69m다. 실제 well 바닥 Y=0.268m에 두 바닥을 맞춘다. 동북 한 자리 받침 (9.35,−1.6)m에는 큰 항아리가 ring 윗면 0.34m를 받는다. 다른 항아리·바구니·궤는 동·남 벽가에 두고 문부터 (7.8,−0.3)m까지 반입 포락을 비운다. 접은 천은 궤 lid에 닿으며 항아리 입에 공중 판을 얹지 않는다. 문턱·받침 상면·동벽 근접·궤 앞에서 각 용기 바닥 접촉과 중앙 빈 통로를 본다.

| role | prototype builder | X/Z·yaw·support 입력 |
| --- | --- | --- |
| `storage.rack` | `portable.jarRack()` | `7.4,-1.65` |
| `storage.rack-jar.west` | `jar` | `7.11,-1.65,0,atop("storage.rack","well")` |
| `storage.rack-jar.east` | `carry` | `7.69,-1.65,0,atop("storage.rack","well")` |
| `storage.stand` | `ritual.jarStand()` | `9.35,-1.6` |
| `storage.stand-jar` | `jar` | `9.35,-1.6,0,atop("storage.stand","ring")` |
| `storage.jar` | `jar` | `9.35,-0.8` |
| `storage.chest` | `chest` | `9.3,1.1` |
| `storage.cloth` | `textile` | `9.3,1.1,0,atop("storage.chest","lid")` |
| `storage.basket` | `basket` | `9.4,0.3` |
| `storage.rope` | `portable.ropeCoil()` | `8.7,1.2` |

## 북동 모서리의 고정 운반 비품 {#yard}

<!--
@evidence principles/core/common.md#declared-basis service-yard의 실제 공간·원형·설정 부모에서 아래 역할과 좌표·받침을 선택한다.
@evidence principles/core/common.md#scope-preservation 북동 모서리의 고정 운반 비품의 명시 membership 전체를 포함하고 구조·새 작동 상태·다른 방 집기를 만들지 않는다.
@evidence principles/core/common.md#substantive-completion 표와 반복 식의 모든 역할에 원형·좌표·회전·host를 정해 다음 source가 essential 배치를 새로 선택하지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모의 원형과 사용 예약에서 실제 수·좌표·회전·접촉 및 최악 관찰을 이 단위가 더한다.
@evidence principles/design/instances.md#instance-prototype-boundary 명시된 기존 원형과 명명 변형만 사용하고 silhouette·축척·재료를 바꾸지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority 명시 표와 반복 식이 유일한 수평 배치 입력이고 Y는 실제 geometry와 host datum에서 산출한다.
@evidence principles/design/instances.md#instance-verification-address 아래 문턱·상면·근접에서 전 개체, 접촉과 사용 경로를 반증한다.
@evidence obligations/design/instances.md#addressable-instance-decisions service-yard의 집기·받침 관계·수·배치를 독립 H2로 소유한다.
@evidence obligations/design/instances.md#instance-prototype-membership 각 표 역할과 선언된 반복 칸은 정확히 한 원형에 해당한다.
@evidence obligations/design/instances.md#instance-identity-transform 명명 role·단위 배율·월드 좌표·회전은 실행순서나 난수와 독립된다.
@evidence obligations/design/instances.md#instance-variation-tiers 기존 명명 변형만 단일 정지 tier로 사용하며 거리별 교체나 색 override가 없다.
@evidence obligations/design/instances.md#instance-placement-review 실제 포락·바닥/host 접촉·문 스윙·보행 경로 및 전 개체의 근접 가시성을 검사한다.
@evidence settings/30-interiors.md#service-yard service-yard의 사용 기능과 집기·고정 상태를 아래 membership으로 구현한다.
@evidence spaces/rooms/service-yard.md#yard-volume 방의 평면·문·완성면·집기/보행 예약을 소비하고 경계나 숨은 연결을 바꾸지 않는다.
@evidence spaces/storey.md#ground-storey 실내 Y=0과 중정 Y=−0.12m 및 국소 제단 단의 소유를 유지한다.
@evidence materials/10-model-bindings.md#binding-map 각 part의 기존 재료 결속과 반복 길이를 그대로 재사용한다.
@evidence models/wares.md#storage-jar storage-jar의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/wares.md#basket basket의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/portable.md#handcart handcart의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/portable.md#carrying-yoke carrying-yoke의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/portable.md#bucket bucket의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/portable.md#rope-coil rope-coil의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence settings/35-objects.md#vessels service-yard에서 쓰는 vessels의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#baskets service-yard에서 쓰는 baskets의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#handcart service-yard에서 쓰는 handcart의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#carrying-yoke service-yard에서 쓰는 carrying-yoke의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#bucket service-yard에서 쓰는 bucket의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#rope-coil service-yard에서 쓰는 rope-coil의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence materials/00-surface-palette.md#timber service-yard 집기의 timber part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#metal service-yard 집기의 metal part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#ceramic service-yard 집기의 ceramic part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#wicker service-yard 집기의 wicker part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#rope-fibre service-yard 집기의 rope-fibre part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work service-yard의 원형 크기·원점과 방 경계·문·사용 예약을 이 수량·좌표·받침에 대조해 기존 부모 설계가 수용함을 확인했다.
-->

손수레·멜대·한 항아리·한 바구니·물동이·끈은 X=8~9.5m, Z=−9.2~−7.1m의 북동 예약에 둔다. 멜대 원점은 막대 중심이므로 고리 최저 Y=−0.145m가 바닥에 닿도록 translationY를 산출한다. 손수레도 실제 바퀴 minY로 접촉하며 굴림·문 통과 성능은 주장하지 않는다. 외부 문→(7.8,−6.4)→(7.8,−3.15)→주랑 문→주랑→보관실의 0.8m 운반 포락은 비품 남쪽·서쪽에서 유지한다. 두 문턱·북동 근접·상면에서 여섯 물품의 비겹침·고정 상태·바닥 접촉을 본다.

| role | prototype builder | X/Z·yaw·support 입력 |
| --- | --- | --- |
| `yard.cart` | `portable.handcart()` | `9,-8.1` |
| `yard.yoke` | `portable.carryingYoke()` | `8.4,-7.1` |
| `yard.jar` | `jar` | `8,-9.2` |
| `yard.basket` | `basket` | `8.55,-9.2` |
| `yard.bucket` | `portable.bucket()` | `9.5,-7.1` |
| `yard.rope` | `portable.ropeCoil()` | `8.2,-7.65` |

## 분수 중심 밖의 대기 비품 {#courtyard}

<!--
@evidence principles/core/common.md#declared-basis courtyard의 실제 공간·원형·설정 부모에서 아래 역할과 좌표·받침을 선택한다.
@evidence principles/core/common.md#scope-preservation 분수 중심 밖의 대기 비품의 명시 membership 전체를 포함하고 구조·새 작동 상태·다른 방 집기를 만들지 않는다.
@evidence principles/core/common.md#substantive-completion 표와 반복 식의 모든 역할에 원형·좌표·회전·host를 정해 다음 source가 essential 배치를 새로 선택하지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모의 원형과 사용 예약에서 실제 수·좌표·회전·접촉 및 최악 관찰을 이 단위가 더한다.
@evidence principles/design/instances.md#instance-prototype-boundary 명시된 기존 원형과 명명 변형만 사용하고 silhouette·축척·재료를 바꾸지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority 명시 표와 반복 식이 유일한 수평 배치 입력이고 Y는 실제 geometry와 host datum에서 산출한다.
@evidence principles/design/instances.md#instance-verification-address 아래 문턱·상면·근접에서 전 개체, 접촉과 사용 경로를 반증한다.
@evidence obligations/design/instances.md#addressable-instance-decisions courtyard의 집기·받침 관계·수·배치를 독립 H2로 소유한다.
@evidence obligations/design/instances.md#instance-prototype-membership 각 표 역할과 선언된 반복 칸은 정확히 한 원형에 해당한다.
@evidence obligations/design/instances.md#instance-identity-transform 명명 role·단위 배율·월드 좌표·회전은 실행순서나 난수와 독립된다.
@evidence obligations/design/instances.md#instance-variation-tiers 기존 명명 변형만 단일 정지 tier로 사용하며 거리별 교체나 색 override가 없다.
@evidence obligations/design/instances.md#instance-placement-review 실제 포락·바닥/host 접촉·문 스윙·보행 경로 및 전 개체의 근접 가시성을 검사한다.
@evidence settings/30-interiors.md#fountain courtyard의 사용 기능과 집기·고정 상태를 아래 membership으로 구현한다.
@evidence spaces/rooms/courtyard.md#court-volume 방의 평면·문·완성면·집기/보행 예약을 소비하고 경계나 숨은 연결을 바꾸지 않는다.
@evidence spaces/storey.md#ground-storey 실내 Y=0과 중정 Y=−0.12m 및 국소 제단 단의 소유를 유지한다.
@evidence materials/10-model-bindings.md#binding-map 각 part의 기존 재료 결속과 반복 길이를 그대로 재사용한다.
@evidence models/portable.md#bench bench의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/portable.md#bucket bucket의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/portable.md#portable-lamp portable-lamp의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/portable.md#planter planter의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence models/landscape.md#grass-tuft grass-tuft의 원점·part·실제 점유와 받침면을 아래 배치가 소비한다.
@evidence settings/35-objects.md#bench courtyard에서 쓰는 bench의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#bucket courtyard에서 쓰는 bucket의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#portable-lamp courtyard에서 쓰는 portable-lamp의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence settings/35-objects.md#planter courtyard에서 쓰는 planter의 존재·용도·정지 상태를 아래 역할로 실현한다.
@evidence materials/00-surface-palette.md#stone courtyard 집기의 stone part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#metal courtyard 집기의 metal part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#ceramic courtyard 집기의 ceramic part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#earth courtyard 집기의 earth part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidence materials/00-surface-palette.md#foliage courtyard 집기의 foliage part는 기존 팔레트와 물성·반복 길이를 받는다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work courtyard의 원형 크기·원점과 방 경계·문·사용 예약을 이 수량·좌표·받침에 대조해 기존 부모 설계가 수용함을 확인했다.
-->

중정 완성면 Y=−0.12m에서 기본 벤치 둘은 (±2.7,4.9)m로 중심을 바라보고 짧은 벤치는 (2.7,−0.8)m에 둔다. 서측 벤치 옆 물동이와 좌판 위 등잔을 분리한다. 표 외 두 화분 court.planter.west/east는 X=−2.7/+2.7m, Z=2.2m, yaw=0이고 두 풀 court.plant.west/east는 같은 좌표에서 각 화분 soil maxY=0.27m에 뿌리를 맞춘다. 넓은 나무나 새 흙 띠를 만들지 않는다. 기존 분수와 주랑 1.5m 보행 예약을 비운다. 중정 네 방향·네 모서리·벤치/화분 근접에서 모든 비품과 실제 포장 접촉을 본다.

| role | prototype builder | X/Z·yaw·support 입력 |
| --- | --- | --- |
| `court.bench.west` | `portable.bench("standard")` | `-2.7,4.9,Math.PI/2` |
| `court.bench.east` | `portable.bench("standard")` | `2.7,4.9,-Math.PI/2` |
| `court.bench.short` | `portable.bench("short")` | `2.7,-0.8,-Math.PI/2` |
| `court.lamp` | `lamp` | `-2.7,5.25,0,atop("court.bench.west","seat")` |
| `court.bucket` | `portable.bucket()` | `-2.7,4` |

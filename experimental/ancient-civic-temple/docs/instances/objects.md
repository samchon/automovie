# 방별 고정 사물 배치

건물 완료 뒤 이어가는 소품 단계의 명시 배치 입력이다. 이 문서는 역할·수·수평 좌표·회전·받침 관계를 정한다. 원형 geometry·part·UV0와 재료는 부모 소유다. 모든 배율은 1, parent는 temple.root, 공간은 표의 해당 방이다. 난수·seed·LOD 변경 없이 단일 정지 tier를 쓴다. 좌표는 월드 X/Z 미터, yaw는 Y축 라디안이다. 바닥형의 translationY=floor−실제 minY, 받침형은 hostTranslationY+선택 part 높이−실제 minY다. support의 height가 있으면 해당 part 범위 안의 판/턱 높이를 선택하고 없으면 maxY다. 받침을 먼저, 자식을 다음에 생성하되 role은 생성 순서와 독립된다. 표는 닫힌 명시 역할의 입력이며 반복 개체는 산문 식만을 따른다.

## 제실의 축과 낮은 의례 집기 {#sanctuary}

<!--
@evidence principles/core/common.md#declared-basis 북쪽 축과 앞뒤 활동 깊이는 sanctuary-volume에서, 석단의 실제 2.4×1.6m 점유는 altar에서 받아 제단 중심 Z=-7.7m를 저작자가 선택했다.
@evidence principles/core/common.md#scope-preservation 열 역할 안에 제단·감실 속 용기·양측 등잔·상판의 세 비품·바닥 좌구 둘을 함께 배정해 제실을 제단 하나로 축소하지 않았다.
@evidence principles/core/common.md#substantive-completion 천의 Z=-7.75m와 감실 턱 0.75m까지 정해 구현자가 작은 천의 크기나 놓일 면을 임의로 고를 빈 항목이 없다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 남긴 제단 북쪽 축 예약에 X=0, Z=-7.7m와 뒤 1.15m·앞 2.75m의 실제 배치 여유를 더한다.
@evidence principles/design/instances.md#instance-prototype-boundary 좌구는 ritual.floor-cushion, 제단 천은 portable.textile.small로 따로 지목한다. 천을 늘려 좌구로 만드는 인스턴스 override는 없다.
@evidence principles/design/instances.md#instance-derivation-authority 감실 용기의 높이는 recess-frame의 0.75m 턱으로 선택한다. 같은 part의 위쪽 판 maxY를 독립적인 두 번째 받침값으로 쓰지 않는다.
@evidence principles/design/instances.md#instance-verification-address 문 축 시점은 제단 뒤 감실 위계를, 좌구 근접은 두 개 사이 0.64m 간격을, 제단 상면은 천의 전면 돌출을 각각 반증할 수 있다.
@evidence obligations/design/instances.md#addressable-instance-decisions 제실의 제단 축·감실 접촉·바닥 좌구는 이 sanctuary H2에서 바뀌며 봉헌실의 중앙 탁자 배치에 종속되지 않는다.
@evidence obligations/design/instances.md#instance-prototype-membership sanctuary.altar부터 cushion.east까지 열 개의 닫힌 role이 각 정식 model ID를 갖고 등잔대와 좌구만 같은 원형을 두 번 쓴다.
@evidence obligations/design/instances.md#instance-identity-transform west/east 등잔은 생성 순번 대신 role과 X 부호로 구별한다. temple.root 좌표에서 ±1.8m와 동일 Z를 단위 배율로 재현한다.
@evidence obligations/design/instances.md#instance-variation-tiers 이 방의 작은 천만 기존 small 변형이며 두 등잔대·두 좌구는 동일 원형이다. 근접 관찰에서 다른 자산으로 교체하는 tier는 없다.
@evidence obligations/design/instances.md#instance-placement-review 제단 석단의 전후 끝과 북벽 사이를 비교하고 중앙 문 스윙·두 좌구·상판 세 물품을 함께 보아 가장 넓은 석단이 접근을 막는 경우를 찾는다.
@evidence settings/30-interiors.md#sanctuary 후면 감실과 용기를 제단 뒤에 놓고 사람 신상·작업 책상 대신 석조 축과 양측 등잔으로 제실의 위계를 만든다.
@evidence spaces/rooms/sanctuary.md#sanctuary-volume 북벽-석단 후면 1.15m와 남벽-석단 전면 2.75m는 부모가 예약한 0.7m·1.5m보다 크며 남쪽 직접 문 앞에 좌구를 놓지 않는다.
@evidence spaces/storey.md#ground-storey 제단의 석단은 fixture.altar 안에 포함된다. 방 바닥 Y=0 위에 원형을 놓고 석단 높이 0.15m를 translation에 또 더하지 않는다.
@evidence materials/10-model-bindings.md#binding-map 제단 top/support/step은 limestone, 향로 cup은 dark-metal, ash/incense는 soil이다. 같은 상판 위라는 이유로 자식 전체를 석재로 결속하지 않는다.
@evidence models/fixtures.md#altar 상판 중심의 로컬 Z=-0.20m를 소비해 그릇과 향로를 월드 Z=-7.9m에 둔다. 천도 폭 0.42m·깊이 0.36m가 상판 안에 들어가는 위치를 받는다.
@evidence models/fixtures.md#niche 바닥 뒷변 원점을 북벽 Z=-9.65m에 맞추고 용기를 앞쪽 Z=-9.37m로 보내 오목한 칸 안에 둔다.
@evidence models/fixtures.md#lampstand 바닥 중심 원점의 높이 1.15m 원형 두 개를 석단 밖 X=±1.8m에 놓아 제단 상판보다 약간 높은 접시를 좌우에 드러낸다.
@evidence models/wares.md#small-vessel 높이 0.20m의 작은 용기는 감실 아래 턱 0.75m에 닿는다. 저장 항아리를 작은 감실에 축소해 끼우지 않는다.
@evidence models/wares.md#offering-bowl 얕은 bowl의 실제 minY를 제단 top의 1.10m에 맞추어 바닥 원점과 bowl 최저면 0.01m의 차이가 뜬 그릇을 만들지 않게 한다.
@evidence models/portable.md#textile small 천 한 개만 제단 오른쪽 X=0.4m에 둔다. Z=-7.75m에서 양 끝이 상판 안에 남고 봉헌 그릇의 중심을 덮지 않는다.
@evidence models/ritual.md#censer foot 바닥을 제단 top에 맞춰 컵과 꺼진 향 세 가닥이 위로 보이게 하며 그릇 왼쪽 0.4m의 독립 자리에서 두 실루엣을 분리한다.
@evidence models/ritual.md#floor-cushion 폭 0.46m 좌구 두 개의 중심 거리를 1.10m로 골라 제단 앞 바닥에 놓고 뒤 접힘선의 로컬 방향을 그대로 보존한다.
@evidence settings/35-objects.md#altar 독립 석단과 두 받침을 가진 제단 한 개 위에 얕은 그릇을 배정한다. 낮고 긴 봉헌실 탁자를 대신 쓰지 않는다.
@evidence settings/35-objects.md#lampstands 높은 등잔대의 넓은 발이 실내 바닥에 닿으며 두 접시가 제단 양쪽에서 불 없이 서 있다.
@evidence settings/35-objects.md#vessels 감실의 작은 적갈색 용기와 제단의 얕은 금속 그릇을 다른 role로 정해 용기 크기군과 용도를 섞지 않는다.
@evidence settings/35-objects.md#textile 제단 위의 얇은 덮개 천은 상판용 비품이고 바닥의 앉는 좌면은 별도의 좌구로 남는다.
@evidence settings/35-objects.md#censer 제단 왼쪽에 한 향로를 고정하고 연기·불꽃·의례 동작을 추가하지 않아 정지 의례 비품이라는 설정을 받는다.
@evidence settings/35-objects.md#floor-cushion 제단 전면 바닥 Z=-6.1m의 두 낮은 좌구는 관리·열람 스툴을 대신하지 않고 앞쪽 활동 깊이 안에서 양옆으로 갈라진다.
@evidence materials/00-surface-palette.md#stone 제단·감실의 모든 석재 part는 밝은 limestone을 유지해 붉은 하부 벽띠와 분리된다. 낮은 좌구까지 돌로 칠하지 않는다.
@evidence materials/00-surface-palette.md#metal 양측 등잔과 향로 금속부·봉헌 그릇에 dark-metal을 남겨 접시·컵의 반응을 같은 제실 주광에서 비교한다.
@evidence materials/00-surface-palette.md#ceramic 감실 안 한 작은 용기의 body/handle만 terracotta이며 제단 그릇의 금속 bowl과 재료가 다르다.
@evidence materials/00-surface-palette.md#textile 제단 cloth와 좌구 base/pad/fold가 linen을 공유해도 위치와 두께는 각 원형을 유지하고 0.25m 직조 반복으로 높이를 위조하지 않는다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 2.4m 석단, 1.24m 감실, 0.26m 등잔 발과 좌구 둘을 실제 제실 예약에 대조했다. 천의 전면 이탈은 제단 원형의 결함이 아니라 이 H2의 Z 선택을 -7.75m로 고쳐 해결했고 부모의 치수·경계·물성은 그대로 수용했다.
-->

제단 중심 (0,−7.7)m의 석단 후면 Z=−8.5m에서 북벽까지 1.15m, 전면 Z=−6.9m에서 남벽까지 2.75m 활동 깊이를 남긴다. 북벽 감실의 뒷변은 Z=−9.65m에 닿고 칸의 용기는 아래 턱 Y=0.75m에 놓인다. 등잔대는 X=±1.8m이며 제단 위에는 그릇·향로·작은 천을 서로 떨어뜨린다. 두 바닥 좌구 중심은 X=±0.55m로 사이 0.64m를 남긴다. 중앙 문 축·제단 앞 3/4·감실 정면·좌구 근접에서 모든 집기와 접촉을 본다.

| role | model ID | X/Z·yaw·support 입력 |
| --- | --- | --- |
| `sanctuary.altar` | `fixture.altar` | `0,-7.7` |
| `sanctuary.niche` | `fixture.niche` | `0,-9.65` |
| `sanctuary.niche-vessel` | `ware.small-vessel` | `0,-9.37,0,atop("sanctuary.niche","recess-frame",0.75)` |
| `sanctuary.lamp.west` | `fixture.lampstand` | `-1.8,-7.7` |
| `sanctuary.lamp.east` | `fixture.lampstand` | `1.8,-7.7` |
| `sanctuary.bowl` | `ware.offering-bowl` | `0,-7.9,0,atop("sanctuary.altar","top")` |
| `sanctuary.censer` | `ritual.censer` | `-0.4,-7.9,0,atop("sanctuary.altar","top")` |
| `sanctuary.cloth` | `portable.textile.small` | `0.4,-7.75,0,atop("sanctuary.altar","top")` |
| `sanctuary.cushion.west` | `ritual.floor-cushion` | `-0.55,-6.1` |
| `sanctuary.cushion.east` | `ritual.floor-cushion` | `0.55,-6.1` |

## 긴 봉헌 탁자와 벽가 진열 {#offering}

<!--
@evidence principles/core/common.md#declared-basis offering-volume의 북·서 벽 진열 예약과 offering-table의 Z 장축을 받아 탁자 (-7.7,0)m, 북쪽 선반 (-7.5,-9.63)m를 정한다.
@evidence principles/core/common.md#scope-preservation 중앙 석재 탁자, 벽 선반 둘, 크기 다른 용기, 쟁반·봉헌판·천·등잔을 열한 역할에 배정해 긴 방의 진열과 양측 사용을 함께 유지한다.
@evidence principles/core/common.md#substantive-completion board part에 네 판이 있다는 이유로 maxY를 일괄 적용하지 않는다. 작은 용기 .58m, 봉헌판·큰 운반 용기 1.40m의 실제 판을 각각 선택한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모의 긴 탁자와 벽 진열이라는 관계에 두 선반의 방향, 쟁반 속 그릇이라는 두 단계 받침, 물품별 판 높이를 추가했다.
@evidence principles/design/instances.md#instance-prototype-boundary offering 선반 변형 두 개를 회전만 달리 사용하며 봉헌판을 낮은 칸에 넣으려고 판 높이나 항아리 크기를 줄이지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority 쟁반은 table.top, 그릇은 tray.floor라는 단일 받침 사슬이다. 그릇 Y를 탁자와 쟁반에서 각자 산출하는 별도 좌표 목록은 없다.
@evidence principles/design/instances.md#instance-verification-address 가장 높은 운반 항아리는 서측 선반 정면에서 윗판 관통을, 쟁반 속 그릇은 탁자 상면에서 floor와의 접촉을 드러내는 최악 개체다.
@evidence obligations/design/instances.md#addressable-instance-decisions offering H2의 두 벽 진열과 중앙 탁자는 관리실의 짧은 선반 및 단일 작성 책상과 별도 배치 결정이다.
@evidence obligations/design/instances.md#instance-prototype-membership 두 선반은 fixture.display-shelf.offering을 공유하고 tray와 tray-bowl은 각각 portable.offering-tray, ware.offering-bowl에 연결되는 열한 닫힌 역할이다.
@evidence obligations/design/instances.md#instance-identity-transform west 선반의 +π/2와 north 선반의 yaw=0이 wall 방향을 고정한다. 같은 원형의 역할은 월드 위치나 생성 순번이 아닌 두 stable role로 남는다.
@evidence obligations/design/instances.md#instance-variation-tiers 봉헌실에는 기존 standard 천과 offering 선반만 사용한다. 같은 그릇에 도기 색을 덮는 별도 hero override나 거리별 교체를 선택하지 않았다.
@evidence obligations/design/instances.md#instance-placement-review 문 Z=2.175m와 탁자 양쪽 통로, 선반 상판의 봉헌판 높이 .42m·항아리 높이 .50m를 검사해 가장 작은 빈 칸에 긴 물체가 관통하는 배치를 거부한다.
@evidence settings/30-interiors.md#offering-room Z축으로 긴 낮은 돌 탁자와 북·서쪽 목재 진열대를 나눠 작은 봉헌물을 놓고 직접 문 앞을 비워 공용 사용을 만든다.
@evidence spaces/rooms/offering.md#offering-volume 북·서 벽에만 선반을 붙이고 긴 방의 뒤를 새 공간으로 나누지 않는다. 장축 양끝 관찰을 탁자 시점에 유지한다.
@evidence spaces/storey.md#ground-storey 탁자·선반 바닥은 실내 Y=0 기준이며 상판 .82m와 선반 판 높이는 원형의 로컬 값이다. 중정 -0.12m를 이 실내 집기에 적용하지 않는다.
@evidence materials/10-model-bindings.md#binding-map 쟁반 floor/rim과 그릇 bowl은 dark-metal, 선반 side/board는 dark-wood로 별도 결속되어 상하 접촉이 표면 ID를 합치지 않는다.
@evidence models/fixtures.md#offering-table 폭 .75m·길이 2.20m 원형의 top .82m 위에 쟁반·작은 용기·천을 Z 방향으로 분리해 상판 양쪽을 비운다.
@evidence models/fixtures.md#display-shelf 뒷변 원점을 벽에서 .02m 띄우고 .13/.58/1.03/1.40m 윗면을 실제 받침 선택지로 사용한다. 판 사이의 빈 칸 높이를 점유로 채우지 않는다.
@evidence models/wares.md#carry-jar .50m 운반 항아리는 윗판 1.40m에 놓아 .45m 판 간격보다 큰 몸체가 다음 판을 뚫는 이전 배치를 해소한다.
@evidence models/wares.md#small-vessel 탁자 중앙의 높이 .20m 용기와 북측 .58m 판의 같은 원형을 두 역할로 나누어 대형 항아리와 섞지 않는다.
@evidence models/wares.md#offering-bowl .22m 지름의 얕은 그릇은 쟁반의 .49×.31m 내부 중앙에 있으며 minY 보정으로 tray.floor 윗면 .838m에 닿는다.
@evidence models/portable.md#offering-tray .52×.34m 직사각 쟁반을 table.top에 얹고 그 안 floor만 그릇의 host로 지정해 림 위로 그릇을 띄우지 않는다.
@evidence models/portable.md#votive-plaque 높이 .42m 석판은 북측 최상판의 독립 자리 X=-7.8m에 서고 .34m 중간 칸에 끼워 넣지 않는다.
@evidence models/portable.md#portable-lamp 높이 .28m 작은 등잔을 서측 .58m 판에 놓아 위 판 아랫면 1.00m 아래에 접시가 남는다.
@evidence models/portable.md#textile standard 천의 .55×.40m 평면은 탁자 남쪽 Z=.65m에 놓이며 쟁반과 용기의 점유를 덮지 않는다.
@evidence settings/35-objects.md#offering-table 제단의 높은 석단 대신 낮고 긴 봉헌 탁자를 한 개 두고 두 다리 사이와 양옆에서 쓰는 빈 구간을 남긴다.
@evidence settings/35-objects.md#shelves 북·서 벽 진열대의 열린 넓은 칸은 그릇을 받으며 기록실의 4×5 작은 칸 원형을 대신 쓰지 않는다.
@evidence settings/35-objects.md#vessels 작은 탁상 도기 둘, 큰 운반 항아리 하나, 얕은 그릇 하나가 각기 다른 위치와 열린 입을 가진 상태로 남는다.
@evidence settings/35-objects.md#offering-tray 네 낮은 테두리 안의 그릇 한 개를 받는 별도 비품으로 지정해 원형 그릇 자체를 쟁반이라 부르지 않는다.
@evidence settings/35-objects.md#votive-plaque 북쪽 위 선반에 글자 없는 석판을 세워 작은 봉헌물의 존재를 보이되 중앙 탁자에 대형 비문을 추가하지 않는다.
@evidence settings/35-objects.md#portable-lamp 벽 선반의 낮은 접시 등잔 하나는 불·연료가 없는 탁상 비품이며 제실 자립 등잔대와 크기군이 다르다.
@evidence settings/35-objects.md#textile 탁자 위 접힌 천 한 개가 얇은 작업 비품으로 놓여 작은 봉헌물 사이의 여백을 유지한다.
@evidence materials/00-surface-palette.md#stone 탁자 top/trestle과 봉헌판 base/slab은 같은 밝은 석회석 계열이라도 서로 독립 part와 접촉을 유지한다.
@evidence materials/00-surface-palette.md#timber 두 진열대의 side와 board에는 1m 반복의 dark-wood를 사용하며 중앙 석재 상판에 목재 무늬가 옮겨 붙지 않는다.
@evidence materials/00-surface-palette.md#metal 테두리 쟁반·그릇·작은 등잔을 동일 노출에서 보아 어두운 금속이 도기와 다른 반응을 내는지 비교한다. 검은 실루엣만으로 재료 구현을 인정하지 않는다.
@evidence materials/00-surface-palette.md#ceramic 크기가 다른 세 도기의 body/handle만 .22m 반복 terracotta로 남고 tray-bowl의 bowl은 금속이다.
@evidence materials/00-surface-palette.md#textile 봉헌 탁자 남쪽 cloth에는 linen의 얇은 직조 흔적을 적용하며 그 무늬로 쟁반이나 상판의 geometry를 덮지 않는다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 선반 판의 .45m 간격에 .50m 항아리와 .42m 봉헌판이 맞지 않는 것은 원형 수치가 모순인 탓이 아니었다. 이 배치에서 최상판 1.40m를 선택해 원형·방 경계·허용 재료를 변경하지 않고 수용했다.
-->

탁자는 (−7.7,0)m에서 장축 Z를 유지한다. 양옆 통로와 직접 문 Z=2.175m를 비운다. 북·서 벽 선반은 벽에서 0.02m 떨어지고 방 안을 바라본다. offering 선반 판 윗면 높이는 0.13/0.58/1.03/1.40m이며 표의 support 높이만 선택한다. 쟁반 속 그릇은 쟁반 floor에 닿고 봉헌판·작은 도기·등잔·운반 항아리는 서로 다른 칸 자리를 받는다. 문턱·장축 양끝·선반 정면과 탁자 상면에서 낮은 탁자, 크기가 다른 도기, 금속 그릇과 부재 접촉을 본다.

| role | model ID | X/Z·yaw·support 입력 |
| --- | --- | --- |
| `offering.table` | `fixture.offering-table` | `-7.7,0` |
| `offering.shelf.west` | `fixture.display-shelf.offering` | `-9.88,-6.5,Math.PI/2` |
| `offering.shelf.north` | `fixture.display-shelf.offering` | `-7.5,-9.63` |
| `offering.tray` | `portable.offering-tray` | `-7.7,-0.55,0,atop("offering.table","top")` |
| `offering.tray-bowl` | `ware.offering-bowl` | `-7.7,-0.55,0,atop("offering.tray","floor")` |
| `offering.small-vessel` | `ware.small-vessel` | `-7.7,0.1,0,atop("offering.table","top")` |
| `offering.cloth` | `portable.textile.standard` | `-7.7,0.65,0,atop("offering.table","top")` |
| `offering.plaque` | `portable.votive-plaque` | `-7.8,-9.43,0,atop("offering.shelf.north","board",1.40)` |
| `offering.shelf-vessel` | `ware.small-vessel` | `-7.1,-9.43,0,atop("offering.shelf.north","board",0.58)` |
| `offering.shelf-jar` | `ware.carry-jar` | `-9.68,-6.1,Math.PI/2,atop("offering.shelf.west","board",1.40)` |
| `offering.lamp` | `portable.lamp` | `-9.68,-6.8,0,atop("offering.shelf.west","board",0.58)` |

## 단일 작성 책상과 도구 {#administration}

<!--
@evidence principles/core/common.md#declared-basis office-volume의 동쪽 책상·서쪽 스툴 예약을 좌표 (9.2,7.5)/(8.35,7.5)m로 해석하며 높이는 writing 책상 top .75m에서 받는다.
@evidence principles/core/common.md#scope-preservation 하나의 작성 책상과 스툴, 펼친 장·필기판·첨필·도구 용기, 짧은 선반의 천·도기·등잔까지 열 역할이 소량 작성실을 채운다.
@evidence principles/core/common.md#substantive-completion 책상 +π/2와 남벽 선반 π 회전, 도구 네 개의 서로 다른 X/Z 및 선반 .13/.68m 판을 정해 구현에서 도구 정렬을 새로 발명하지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 작은 작업대라는 설정에 작성물 중심 (9.12,7.25)m와 필기판 (9.18,7.75)m를 더해 같은 .75m 작업면에서 내용을 분리한다.
@evidence principles/design/instances.md#instance-prototype-boundary writing 책상·administration 선반·open 두루마리는 각 부모의 명명 변형이다. 기록실 칸 선반을 축소해서 이 방의 선반으로 만들지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority 네 책상 소품의 Y는 administration.desk/top에서만 유도된다. 펼친 장의 원점과 첨필의 중심 원점 차이는 공통 minY 접촉식으로 처리한다.
@evidence principles/design/instances.md#instance-verification-address 문→스툴과 책상→문 역방향은 인출 충돌을, 상면 근접은 첨필·판·장 겹침을, 선반 정면은 작은 천의 끝 돌출을 검사한다.
@evidence obligations/design/instances.md#addressable-instance-decisions 이 H2의 작성 자리 열 역할은 기록실의 20칸 보관 반복과 별도 소유되어 작업실 밀도를 독립적으로 바꿀 수 있다.
@evidence obligations/design/instances.md#instance-prototype-membership 펼친 장은 ware.scroll.open 한 개이고 administration.tool-vessel과 shelf-vessel만 ware.small-vessel을 공유한다. 두 소량 용기는 다른 역할이다.
@evidence obligations/design/instances.md#instance-identity-transform 책상·필기판·첨필의 +π/2가 로컬 긴 축을 월드 Z로 돌린다. 서쪽 스툴 role은 책상 생성 순서가 바뀌어도 같은 (8.35,7.5)m에 남는다.
@evidence obligations/design/instances.md#instance-variation-tiers 책상 writing과 짧은 선반 administration을 명명 tier로 고정하고 펼친 장에만 open 원형을 쓴다. 근접에서 글자·색·도구 밀도를 증가시키지 않는다.
@evidence obligations/design/instances.md#instance-placement-review 가장 긴 open 장의 약 .4074m 깊이와 작은 책상의 .60m 깊이를 함께 비교하고 스툴 서쪽 인출·남쪽 문 스윙이 겹치는 배치를 찾는다.
@evidence settings/30-interiors.md#administration 펼친 작성물과 작은 용기 한 개를 단일 책상에 놓고 짧은 벽 선반에만 도기를 더해 두루마리 축적 방과 구별한다.
@evidence spaces/rooms/administration.md#office-volume 책상을 동벽 가까이, 스툴을 서쪽에 두고 서쪽 직접 문에서 좌석으로 접근한다. 북쪽 기록실 벽에 연결문이나 새 출입을 만들지 않는다.
@evidence spaces/storey.md#ground-storey 책상·스툴·선반 세 받침은 실내 Y=0에 닿는다. 도구들은 층 높이가 아니라 각 받침의 실제 top/board 높이를 더한다.
@evidence materials/10-model-bindings.md#binding-map 필기판 frame은 dark-wood, writing-face와 펼친 장은 parchment, 첨필 shaft/tip은 dark-metal로 분리해 책상 위 내용을 한 목재 재료로 합치지 않는다.
@evidence models/fixtures.md#desk 1.10×.60m writing 상판의 .75m 높이를 네 도구가 소비하며 스툴을 서쪽 .85m 떨어뜨려 다리 안으로 매몰시키지 않는다.
@evidence models/fixtures.md#stool .45m 좌판이 책상보다 .30m 낮게 서고 서쪽 접근을 받아 앉는 자리를 표한다. 등받이·새 쿠션을 인스턴스가 붙이지 않는다.
@evidence models/fixtures.md#display-shelf 폭 1m·깊이 .30m 짧은 변형을 남벽에서 북쪽으로 향하게 돌려 세 판 중 아래 .13m와 가운데 .68m를 소비한다.
@evidence models/wares.md#scroll open 장 한 개는 쓰기 면에 놓이며 양 끝 말림까지 같은 .75m datum에서 떠 있지 않게 실제 최저 Y를 맞춘다.
@evidence models/wares.md#small-vessel 도구 용기 (9.39,7.15)m는 펼친 장과 다른 책상 모서리를 받고 선반의 같은 작은 용기 (8.45,9.48)m와 수량을 구별한다.
@evidence models/portable.md#stylus 중심 원점의 0.22m 막대를 +π/2로 놓고 실제 minY를 보정해 뾰족한 금속 도구가 책상 아래로 묻히지 않게 한다.
@evidence models/portable.md#writing-tablet .28×.22m 얕은 틀을 펼친 장 남쪽의 별도 자리에 놓아 빈 writing-face와 두루마리 표면이 겹치지 않게 한다.
@evidence models/portable.md#textile small 덮개는 가운데 선반에서 +π/2를 받아 .42m가 판 깊이 .30m보다 양쪽 .06m 나온다. 중심이 판 위에 남는 접힌 천의 작은 돌출이며 완전 평면 포함을 주장하지 않는다.
@evidence models/portable.md#portable-lamp 작은 등잔은 가운데 판의 천 오른쪽 X=8.42m에 놓이며 .28m 높이가 윗판 아래까지의 빈 칸에 들어간다.
@evidence settings/35-objects.md#workstation 목재 writing 책상과 스툴 한 쌍만 두고 소품 때문에 통로 방향 인출을 막거나 사람이 앉는 동작을 추가하지 않는다.
@evidence settings/35-objects.md#shelves 소량 도기를 받는 짧은 남벽 선반은 열린 두 칸을 유지하고 기록 선반의 작은 칸 격자를 복제하지 않는다.
@evidence settings/35-objects.md#scrolls 관리실은 펼친 한 장으로 정지 작성 상태를 나타내고 선반에 말린 기록물을 대량 쌓지 않는다.
@evidence settings/35-objects.md#vessels 높은 저장 항아리 대신 .20m 작은 용기 두 개를 작업·선반 역할에 나누어 두며 열린 입에 추가 액체를 만들지 않는다.
@evidence settings/35-objects.md#stylus 책상 위 첨필은 짧은 정지 도구 하나이며 손·필기 자국·읽는 글자를 생성하지 않는다.
@evidence settings/35-objects.md#writing-tablet 두루마리와 다른 빈 필기판의 독립 위치를 정해 가짜 본문 없이 작성 도구를 구별한다.
@evidence settings/35-objects.md#textile 선반 작은 천은 얇은 작업 비품으로 남고 스툴 좌판의 쿠션이나 제실 바닥 좌구로 바뀌지 않는다.
@evidence settings/35-objects.md#portable-lamp 낮은 금속 등잔 한 개를 선반 위에 두고 불을 켜서 작성실의 주광 부족을 숨기지 않는다.
@evidence materials/00-surface-palette.md#timber 책상·스툴·짧은 선반과 필기판 frame의 목재가 밝은 기록면 뒤에 남고 도기 용기에 1m 목재 무늬를 적용하지 않는다.
@evidence materials/00-surface-palette.md#metal 첨필과 선반 등잔은 같은 dark-metal 계열이라도 긴 막대와 접시의 반응을 각각 근접 관찰하며 금속도 .82를 도기용 색으로 대체하지 않는다.
@evidence materials/00-surface-palette.md#ceramic 책상 도구 용기와 아래 선반 용기의 body/handle이 무광 적갈색이며 등잔 접시는 같은 도기로 바꾸지 않는다.
@evidence materials/00-surface-palette.md#parchment 펼친 sheet와 필기판 writing-face가 밝은 황갈색 빈 기록면을 받아 목재 틀과 구별되고 문자 비트맵을 요구하지 않는다.
@evidence materials/00-surface-palette.md#textile 가운데 판의 작은 cloth만 linen이며 직조 무늬의 가로세로 방향을 회전된 원형 UV에 따르게 한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work .60m 깊이 책상에 네 도구가 들어가고 서쪽 스툴·남벽 짧은 선반은 office-volume의 인출 예약 밖에 있다. 천의 .06m 끝 돌출은 중심 접촉이 유지되는 사용 상태로 명시했으며 판 크기나 원형 축척을 바꿀 필요가 없었다.
-->

동벽 가까이 (9.2,7.5)m의 작성 책상을 +90° 회전하고 스툴은 서쪽 (8.35,7.5)m로 빼 문에서 접근한다. 두루마리·필기판·첨필·작은 도구 용기는 책상 top 윗면 0.75m에서 서로 분리한다. 남벽의 짧은 선반은 북쪽을 바라보고 소량 도기·등잔·천만 받는다. administration형 판 윗면은 0.13/0.68/1.20m다. 가운데 판의 small 천은 π/2 회전한 길이 .42m가 판 깊이 .30m를 양쪽 .06m씩 넘으며, 중심과 .30m 길이의 받침 접촉을 유지하는 접은 천의 끝 돌출이다. 문에서 스툴까지와 역방향, 책상 상면 근접·선반 정면에서 작성실이 기록실과 구별되는지 본다.

| role | model ID | X/Z·yaw·support 입력 |
| --- | --- | --- |
| `administration.desk` | `fixture.desk.writing` | `9.2,7.5,Math.PI/2` |
| `administration.stool` | `fixture.stool` | `8.35,7.5` |
| `administration.shelf` | `fixture.display-shelf.administration` | `8.2,9.63,Math.PI` |
| `administration.scroll` | `ware.scroll.open` | `9.12,7.25,Math.PI/2,atop("administration.desk","top")` |
| `administration.tablet` | `portable.writing-tablet` | `9.18,7.75,Math.PI/2,atop("administration.desk","top")` |
| `administration.stylus` | `portable.stylus` | `9.38,7.7,Math.PI/2,atop("administration.desk","top")` |
| `administration.tool-vessel` | `ware.small-vessel` | `9.39,7.15,0,atop("administration.desk","top")` |
| `administration.cloth` | `portable.textile.small` | `7.98,9.48,Math.PI/2,atop("administration.shelf","board",0.68)` |
| `administration.shelf-vessel` | `ware.small-vessel` | `8.45,9.48,0,atop("administration.shelf","board",0.13)` |
| `administration.lamp` | `portable.lamp` | `8.42,9.48,0,atop("administration.shelf","board",0.68)` |

## 스무 칸의 두루마리와 열람 자리 {#records}

<!--
@evidence principles/core/common.md#declared-basis scroll-shelf가 정한 네 칸·다섯 단의 빈 부피와 .288m 두루마리 길이를 받아 칸마다 한 개체라는 수량과 짝홀 변형 규칙을 선택했다.
@evidence principles/core/common.md#scope-preservation 마른 기록물 스무 개체뿐 아니라 선반 앞 접근, 닫힌 궤, 열람 책상·스툴·도구를 함께 소유해 보관과 열람 중 하나를 빼지 않는다.
@evidence principles/core/common.md#substantive-completion 다섯 높이와 네 X 편차의 곱, i+j 짝홀, Z=2.07m가 20개 변형과 접촉을 완전히 정한다. 구현자가 칸별 수량을 새로 고르지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모는 4×5 칸과 들어갈 수 있는 원통 길이만 준다. 여기서 10 rolled·10 bundle의 위치 교차와 북벽 선반·동쪽 열람/궤 좌표를 더한다.
@evidence principles/design/instances.md#instance-prototype-boundary 반복은 rolled와 bundle 정식 원형만 선택하며 bundle의 tie 접촉 경로를 배치 scale이나 Y override로 교정하지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority tier/cell 입력과 짝홀 식이 두루마리의 유일한 membership 권한이다. 20개 결과 좌표를 따로 적어 반복 식과 경쟁시키지 않는다.
@evidence principles/design/instances.md#instance-verification-address 맨 위 tier-4의 bundle은 높이·위판 여유의 최악이고 각 단 근접은 바닥 접촉, 20칸 정면은 누락·중복·짝홀 변형을 반증한다.
@evidence obligations/design/instances.md#addressable-instance-decisions records H2가 칸 보관 규칙과 별도 열람 자리의 관계를 소유하므로 관리실의 펼친 장 좌표를 바꿔 기록물 수량이 달라지지 않는다.
@evidence obligations/design/instances.md#instance-prototype-membership tier-0..4×cell-0..3의 20 role과 표의 8 role은 서로 겹치지 않는다. 두루마리의 진입·변형은 i+j 규칙에만 의존한다.
@evidence obligations/design/instances.md#instance-identity-transform records.scroll.tier-i.cell-j가 칸 번호를 보존하고 X=7.8+편차, Z=2.07, yaw=0을 정한다. 어느 단부터 평가해도 동일한 개체다.
@evidence obligations/design/instances.md#instance-variation-tiers 칸마다 rolled/bundle 선택은 명명 상태 차이이며 reading 책상은 writing 원형의 별도 명명 치수군이다. 거리별 종이 밀도나 영웅 문서를 추가하지 않는다.
@evidence obligations/design/instances.md#instance-placement-review 약 .41m 칸 폭과 .288m 길이, .30m 높이와 bundle 점유를 대조하고 선반 앞 .9m·궤 앞·스툴 접근을 실제 배치와 함께 검사한다.
@evidence settings/30-interiors.md#records 마른 두루마리 선반과 잠금 철물이 있는 낮은 궤, 동쪽 작은 열람대가 이 방의 보관/열람 기능을 나타내며 물이 유입되는 상태는 없다.
@evidence spaces/rooms/records.md#records-volume 북벽 선반의 앞쪽 접근을 비우고 열람 책상과 궤를 동벽가로 보내 서쪽 직접 문 스윙을 수용한다. 다른 업무방을 통과하지 않는다.
@evidence spaces/storey.md#ground-storey 북쪽 선반과 동쪽 궤·책상·스툴은 Y=0 실내에 닿고 두루마리의 .04~1.36m는 층이 아닌 선반 판의 로컬 높이이다.
@evidence materials/10-model-bindings.md#binding-map 두루마리 sheet-1/2/3은 parchment, tie는 rope-fibre를 받고 궤 body/lid의 목재와 hasp/strap의 금속은 같은 개체 안에서도 분리된다.
@evidence models/fixtures.md#scroll-shelf 북벽 뒷변 (7.8,1.87)m에서 폭 1.80m의 네 칸 중심을 각각 -.6575/-.21875/+.21875/+.6575m로 소비한다.
@evidence models/fixtures.md#chest 닫힌 궤를 동쪽 (9.4,2.95)m에서 -π/2로 돌려 전면 걸쇠가 방 안쪽을 보게 하고 lid를 작은 천의 받침으로 쓴다.
@evidence models/fixtures.md#desk reading 변형 .90×.55m 상판을 (9.15,4.3)m에 +π/2로 놓고 도구 세 개의 datum을 실제 top .72m에서 얻는다.
@evidence models/fixtures.md#stool 열람 스툴의 .45m 좌면은 reading 상판보다 .27m 낮으며 책상 서쪽 X=8.35m로 빠져 다리 사이에 끼지 않는다.
@evidence models/wares.md#scroll 원점이 축 중심인 rolled/bundle을 각 칸 바닥에 놓기 위해 서로 다른 실제 minY를 보정한다. 세 개 묶음도 한 rendered member로 수량을 센다.
@evidence models/portable.md#stylus .22m 금속 막대의 방향을 책상과 같은 +π/2로 고정하며 (9.32,4.25)m에서 필기판과 다른 작업 면적을 쓴다.
@evidence models/portable.md#writing-tablet 빈 쓰기 면의 얕은 틀을 (9.15,4.05)m에 놓아 열람대 위의 끈 뭉치와 Z로 분리한다.
@evidence models/portable.md#textile small 천은 열람대 대신 닫힌 궤 lid에 놓인다. 궤 Y와 실제 lid maxY를 더해 표면 위에 닿고 바닥 천처럼 취급하지 않는다.
@evidence models/portable.md#rope-coil 별도 세 고리 뭉치를 열람대 남쪽 (9.12,4.5)m에 놓고 두루마리 원형에 이미 포함된 tie와 수량을 혼동하지 않는다.
@evidence settings/35-objects.md#shelves 여러 작은 칸을 가진 기록 선반 한 개를 북벽에 고정하고 봉헌실의 넓은 칸 선반을 대신 배치하지 않는다.
@evidence settings/35-objects.md#chests 전면 잠금 장치가 보이는 닫힌 궤 하나가 마른 기록물 옆에 있다. 열림 애니메이션이나 보이지 않는 내용물을 새로 만들지 않는다.
@evidence settings/35-objects.md#workstation reading 책상·스툴은 열람용 한 쌍으로 두어 작성실의 writing 변형과 역할을 구별하고 서쪽 인출을 남긴다.
@evidence settings/35-objects.md#scrolls 20칸의 말린 한 개와 세 개 묶음 교차는 규칙 있는 보관량을 만들며 펼친 작성물을 선반에 쌓지 않는다.
@evidence settings/35-objects.md#stylus 열람대의 정지 첨필 한 개만 배치해 실제 필기 행위나 본문 없이 기록 도구를 나타낸다.
@evidence settings/35-objects.md#writing-tablet 열람대 상판의 글자 없는 판을 두루마리 보관 칸과 별도 자리로 정해 작업면과 저장물을 나눈다.
@evidence settings/35-objects.md#textile 궤 뚜껑의 작은 접은 천은 덮개이고 스툴이나 선반 전체를 가리는 천 더미로 늘리지 않는다.
@evidence settings/35-objects.md#rope-coil 책상 끝의 별도 끈 뭉치는 문서에 감긴 tie가 아니며 실제 결속 장력을 납품하는 상태도 아니다.
@evidence materials/00-surface-palette.md#timber 선반 frame/board/divider와 궤·열람대·스툴의 목재가 황백 기록물 뒤의 어두운 구조로 읽히게 기존 결속을 유지한다.
@evidence materials/00-surface-palette.md#metal 궤 걸쇠/띠와 열람 첨필만 청동 계열이며 닫힌 lid 전체를 반짝이는 금속면으로 바꾸지 않는다.
@evidence materials/00-surface-palette.md#parchment 스무 칸의 sheet 변형과 열람 판의 writing-face가 밝은 기록면을 공유하지만 글자나 개인정보 텍스처를 추가하지 않는다.
@evidence materials/00-surface-palette.md#textile 닫힌 궤 위 cloth에만 직조 흔적이 있고 두루마리 원통 표면으로 linen을 옮겨 붙이지 않는다.
@evidence materials/00-surface-palette.md#rope-fibre bundle의 tie와 별도 rope-coil 고리가 같은 마른 섬유색을 받아도 밝은 종이 sheet와 주소를 합치지 않는다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 스무 칸 모두 .288m 길이와 bundle 높이를 수용하고 .9m 선반 접근 및 동측 열람 배치가 방 예약 안에 남는다. tie의 이전 원형 source 오류는 이미 둥근 삼각형을 정한 wares 부모의 모순이 아니어서 model source에서 바로잡고 부모 수량·칸 경계를 바꾸지 않았다.
-->

북벽 선반 뒷변은 (7.8,1.87)m다. 다섯 받침 높이 0.04/0.37/0.70/1.03/1.36m와 네 가로 편차 −0.6575/−0.21875/+0.21875/+0.6575m를 조합한다. role records.scroll.tier-i.cell-j마다 i+j 짝수면 rolled, 홀수면 bundle 한 개체를 X축으로 놓고 Z=2.07m를 쓴다. 20개체 중 말린 것 10, 묶음 10이며 실제 minY를 판 높이에 맞춘다. 앞 0.9m 접근과 문 스윙을 비우고 열람대·스툴·닫힌 궤를 동쪽에 둔다. 표 외 출력 목록은 만들지 않는다. 선반의 20칸 정면·각 단 근접·열람대 상면·궤 앞에서 전 개체와 접촉을 본다.

| role | model ID | X/Z·yaw·support 입력 |
| --- | --- | --- |
| `records.shelf` | `fixture.scroll-shelf` | `7.8,1.87` |
| `records.chest` | `fixture.chest` | `9.4,2.95,-Math.PI/2` |
| `records.desk` | `fixture.desk.reading` | `9.15,4.3,Math.PI/2` |
| `records.stool` | `fixture.stool` | `8.35,4.3` |
| `records.tablet` | `portable.writing-tablet` | `9.15,4.05,Math.PI/2,atop("records.desk","top")` |
| `records.stylus` | `portable.stylus` | `9.32,4.25,Math.PI/2,atop("records.desk","top")` |
| `records.cloth` | `portable.textile.small` | `9.4,2.95,0,atop("records.chest","lid")` |
| `records.rope` | `portable.rope-coil` | `9.12,4.5,0,atop("records.desk","top")` |

## 벽가의 용기와 두 종류 받침 {#storage}

<!--
@evidence principles/core/common.md#declared-basis storage-volume의 북·동 벽 보관과 서쪽 반입 예약, jar-rack의 ±.29m 홈 중심, jar-stand의 .34m ring을 아래 두 받침 사슬의 근거로 쓴다.
@evidence principles/core/common.md#scope-preservation 세 저장 항아리·운반 항아리 한 개, 두 종류 받침, 궤·천·바구니·끈의 열 개체가 벽가 보관물을 이루고 중앙 반입을 함께 남긴다.
@evidence principles/core/common.md#substantive-completion 두 자리 홈의 X=7.11/7.69m와 Y=.268m, 한 자리 ring .34m, 궤 lid의 천까지 host를 정해 구현이 항아리의 받침을 추측하지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모는 벽가 보관과 원형의 홈 위치를 주고 이 H2는 두 자리의 서로 다른 크기 용기, 동북 한 자리·동벽 바닥 항아리의 세 사용 위치를 더한다.
@evidence principles/design/instances.md#instance-prototype-boundary rack과 stand는 두 독립 원형이며 항아리 크기 차이는 storage-jar/carry-jar 선택이다. 같은 항아리를 비균등 축척해 홈에 맞추지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority 두 rack 자식은 well의 실제 maxY로 높이를 얻고 stand 자식은 ring 윗면을 따른다. 바닥형 storage.jar는 어느 받침의 Y도 소비하지 않는다.
@evidence principles/design/instances.md#instance-verification-address rack 상면은 두 홈과 항아리 발의 관계를, 동벽 근접은 가장 큰 항아리의 벽 관통을, 문턱은 중심 반입 통로의 장애를 반증한다.
@evidence obligations/design/instances.md#addressable-instance-decisions 두 자리와 한 자리 받침의 배치는 storage H2에 있고 서비스 마당의 내려놓은 운반물 좌표가 이 받침 사슬의 수량을 바꾸지 않는다.
@evidence obligations/design/instances.md#instance-prototype-membership storage.rack-jar.west는 ware.storage-jar, east는 ware.carry-jar로 정한다. 한 자리 위와 바닥에 있는 storage-jar는 서로 다른 stable role이다.
@evidence obligations/design/instances.md#instance-identity-transform rack 중심 7.4m에 부모 홈 편차 ±.29m를 적용해 두 자식의 X를 얻는다. 역할은 west/east 이름과 부모 support 주소로 재현된다.
@evidence obligations/design/instances.md#instance-variation-tiers 저장용 큰 원형과 운반용 중간 원형만 허용하고 궤 위 천에는 standard 변형을 선택한다. 홈마다 별도 항아리 자산이나 색 tier가 없다.
@evidence obligations/design/instances.md#instance-placement-review 가장 큰 stand 발의 .60m 점유와 저장 항아리 배를 문→(7.8,-.3)m 반입 포락에 대조한다. 받침 위치를 비워도 자식 용기가 통로를 막는 경우까지 검사한다.
@evidence settings/30-interiors.md#storage 도기 크기군·닫힌 상자·마른 바구니가 동·북 벽가를 따라 놓여 문서 칸 선반 방과 다른 보관 상태를 만든다.
@evidence spaces/rooms/storage.md#storage-volume 북쪽 낮은 받침과 동쪽 궤/용기는 벽가 예약 안에 있고 서쪽 직접 문부터 중앙으로 들어오는 .8m 운반 포락을 비운다.
@evidence spaces/storey.md#ground-storey rack·stand·바닥 항아리·궤는 실내 완성면 Y=0 기준이며 받침 위 자식은 별도 국소 층을 만들지 않고 각 host 높이를 더한다.
@evidence materials/10-model-bindings.md#binding-map rack top/leg/well은 dark-wood, stand foot/post/ring은 limestone이다. 같은 항아리를 받는다는 이유로 두 받침의 재료를 합치지 않는다.
@evidence models/fixtures.md#chest 동남쪽 닫힌 궤 (9.3,1.1)m의 lid 윗면이 standard 천을 받으며 몸체 안 빈 보관 공간이나 열린 뚜껑 상태는 이 배치에 없다.
@evidence models/wares.md#storage-jar 큰 항아리 세 개가 rack 서쪽 홈, 독립 stand, 동벽 바닥이라는 서로 다른 datum을 받아도 동일 body/handle 원형을 보존한다.
@evidence models/wares.md#carry-jar 높이 .50m 중간 운반 항아리는 rack 동쪽 .268m 홈 위에 있으며 큰 저장 항아리와 대칭 축척으로 만들어진 별도 모형이 아니다.
@evidence models/wares.md#basket 열린 위를 가진 바구니는 동벽 (9.4,.3)m 바닥에 놓여 궤·항아리와 다른 낮은 입 실루엣을 보인다.
@evidence models/portable.md#jar-rack 두 홈 중심 ±.29m를 실제 자식 중심에 대조하고 .268m 홈 바닥을 받침면으로 소비한다. 상판 0.28m 윗면으로 자식을 띄우지 않는다.
@evidence models/portable.md#textile standard 천 하나는 궤 lid 위에 놓이며 용기 입이나 두 자리 홈을 공중 평판으로 막지 않는다.
@evidence models/portable.md#rope-coil (8.7,1.2)m 바닥의 별도 고리 뭉치는 중앙 반입을 벗어난 동남쪽 보관 비품이고 항아리에 감긴 물리 결속이 아니다.
@evidence models/ritual.md#jar-stand 바깥 지름 .60m의 발을 동북 (9.35,-1.6)m에 놓고 ring .34m 위에 저장 항아리 한 개만 올려 두 자리 선반과 구별한다.
@evidence settings/35-objects.md#chests 닫힌 목재 궤의 앞 철물을 볼 수 있는 바닥 자리를 주고 뚜껑 작동이나 내용물을 추가하지 않는다.
@evidence settings/35-objects.md#vessels 큰 저장형과 손잡이 운반형이 북·동 벽가에 나뉘며 입 안에 물을 채워 보관실을 설비 공간으로 바꾸지 않는다.
@evidence settings/35-objects.md#baskets 항아리와 달리 황갈색의 낮고 넓은 입을 가진 마른 바구니 한 개를 동벽에 내려놓아 반입 통로 밖에서 읽힌다.
@evidence settings/35-objects.md#jar-rack 두 자리 목재 받침에 실제 두 용기를 올려 홈 바닥의 비관통 접촉을 배치 수준에서 소비한다.
@evidence settings/35-objects.md#textile 보관 덮개는 궤 뚜껑의 접은 천으로 한정해 두루마리나 좌구를 이 방에 추가하지 않는다.
@evidence settings/35-objects.md#rope-coil 풀어 놓은 고리 비품이 바닥의 별도 role을 갖고 하중·결속 장력이나 항아리 운반을 시연하지 않는다.
@evidence settings/35-objects.md#jar-stand 좁은 기둥과 원형 윗받침 한 개를 가진 독립 물품에 항아리 하나만 놓아 두 홈의 목재 rack과 역할을 나눈다.
@evidence materials/00-surface-palette.md#timber 두 홈 받침과 궤 body/lid의 목재가 적갈색 도기의 뒤 구조로 남으며 석재 한 자리 stand에 목재 무늬가 붙지 않는다.
@evidence materials/00-surface-palette.md#stone 동북 stand의 세 석재 part는 밝은 limestone으로 .60m 발과 좁은 기둥을 구별한다. 항아리 body를 같은 석재로 바꾸지 않는다.
@evidence materials/00-surface-palette.md#ceramic 네 항아리의 열린 몸체·손잡이는 terracotta를 공유하며 크기와 받침 차이를 재료 색 바꾸기로 대신하지 않는다.
@evidence materials/00-surface-palette.md#wicker 동벽 바구니 wall/rim/floor의 마른 섬유색이 도기와 구별되는지가 이 방의 재료 관찰이며 생략된 세로 살을 무늬로 구현됐다고 하지 않는다.
@evidence materials/00-surface-palette.md#textile 궤 lid 위 standard cloth만 linen의 .25m 직조 흔적을 받는다. 천 무늬를 궤 전체에 씌우지 않는다.
@evidence materials/00-surface-palette.md#rope-fibre 바닥의 rope/tie를 마른 섬유색으로 유지하며 근접에서 개별 가닥의 꼬임이나 역학 성능을 요구하지 않는다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 두 자리 홈 .268m와 한 자리 ring .34m, 가장 큰 .60m 받침 발, 네 용기와 궤의 폭을 벽가 예약 및 반입 포락에 대조했다. rack의 옛 source가 홈을 없앤 오류는 올바른 portable 부모를 고쳐야 할 결함이 아니었고 model source에서 원래 홈을 되살렸다.
-->

북쪽 두 자리 받침은 (7.4,−1.65)m, 항아리 중심은 X=7.11/7.69m다. 실제 well 바닥 Y=0.268m에 두 바닥을 맞춘다. 동북 한 자리 받침 (9.35,−1.6)m에는 큰 항아리가 ring 윗면 0.34m를 받는다. 다른 항아리·바구니·궤는 동·남 벽가에 두고 문부터 (7.8,−0.3)m까지 반입 포락을 비운다. 접은 천은 궤 lid에 닿으며 항아리 입에 공중 판을 얹지 않는다. 문턱·받침 상면·동벽 근접·궤 앞에서 각 용기 바닥 접촉과 중앙 빈 통로를 본다.

| role | model ID | X/Z·yaw·support 입력 |
| --- | --- | --- |
| `storage.rack` | `portable.jar-rack` | `7.4,-1.65` |
| `storage.rack-jar.west` | `ware.storage-jar` | `7.11,-1.65,0,atop("storage.rack","well")` |
| `storage.rack-jar.east` | `ware.carry-jar` | `7.69,-1.65,0,atop("storage.rack","well")` |
| `storage.stand` | `ritual.jar-stand` | `9.35,-1.6` |
| `storage.stand-jar` | `ware.storage-jar` | `9.35,-1.6,0,atop("storage.stand","ring")` |
| `storage.jar` | `ware.storage-jar` | `9.35,-0.8` |
| `storage.chest` | `fixture.chest` | `9.3,1.1` |
| `storage.cloth` | `portable.textile.standard` | `9.3,1.1,0,atop("storage.chest","lid")` |
| `storage.basket` | `ware.basket` | `9.4,0.3` |
| `storage.rope` | `portable.rope-coil` | `8.7,1.2` |

## 북동 모서리의 고정 운반 비품 {#yard}

<!--
@evidence principles/core/common.md#declared-basis yard-volume의 북동 비품 예약과 직접 문 두 개를 소비해 물품 범위를 X=8~9.5m, Z=-9.2~-7.1m로 골랐다. 운반 성능은 각 portable 부모의 정지 한계를 따른다.
@evidence principles/core/common.md#scope-preservation 손수레·멜대·항아리·바구니·물동이·별도 끈의 여섯 role 모두를 북동에 두면서 외부 반입과 주랑 직접 출입을 빈 경로로 남긴다.
@evidence principles/core/common.md#substantive-completion 손수레 (9,-8.1)m와 멜대 (8.4,-7.1)m의 수평 값, 중심 원점의 실제 minY 접지 규칙을 함께 적어 내려놓는 높이를 구현에 미루지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모의 소수 운반물이라는 상태에 여섯 개체의 독립 위치와 남서쪽 연속 반입 경로를 더해 수레가 문을 통과할 필요 없는 배치를 정한다.
@evidence principles/design/instances.md#instance-prototype-boundary 수레와 멜대는 기존 정지 원형 그대로이며 바퀴·고리를 돌리는 rig나 통과를 위한 축소 변형을 인스턴스에서 만들지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority 중심 원점인 멜대는 고리 최저 -.145m를 단일 minY 식으로 보정한다. 막대 중심을 바닥으로 잡는 별도 특례 Y는 없다.
@evidence principles/design/instances.md#instance-verification-address 두 문턱 시점은 반입 경로, 북동 근접은 여섯 개체 간 겹침, 상면은 수레의 가장 긴 점유가 경로에 나오는지를 각각 드러낸다.
@evidence obligations/design/instances.md#addressable-instance-decisions 내려놓은 운반 비품의 여섯 역할은 yard H2에 닫혀 있고 저장실 rack의 받침 사슬이나 중정 대기 비품과 별도다.
@evidence obligations/design/instances.md#instance-prototype-membership yard.cart/yoke/jar/basket/bucket/rope가 각각 한 정식 원형을 가지며 수레 위 화물이나 고리에 걸린 추가 용기를 암묵적으로 생성하지 않는다.
@evidence obligations/design/instances.md#instance-identity-transform 여섯 role은 yaw=0, 단위 배율, temple.root의 월드 좌표로 고정된다. 수레와 멜대의 중심 원점은 같은 minY 규칙에 따라 재현된다.
@evidence obligations/design/instances.md#instance-variation-tiers 마당의 수레는 빈 정지 tier 하나이고 항아리는 기존 storage-jar 한 개다. 카메라가 가까워져도 화물·하중·회전 상태로 교체하지 않는다.
@evidence obligations/design/instances.md#instance-placement-review 수레 바퀴와 멜대 고리의 바닥 접촉을 검사하고 외부 문부터 X=7.8m의 .8m 반입 포락을 전 경로로 비교해 두 문 중 한쪽만 통과하는 결론을 피한다.
@evidence settings/30-interiors.md#service-yard 열린 하늘 아래 북동 소수 운반물을 두고 두 실제 문으로 접근한다. 비품을 둘러 독립 순환 중정이나 숨은 작업방을 만들지 않는다.
@evidence spaces/rooms/service-yard.md#yard-volume 낮은 둘레벽·포장·외부 문·주랑 문을 그대로 소비하며 북동 비품과 서남쪽 반입을 나눠 마당의 두 출입 관계를 유지한다.
@evidence spaces/storey.md#ground-storey 서비스 마당 비품은 포장 완성면 Y=0에 닿는다. 열린 옥외라는 이유로 중정 -0.12m를 수레 바퀴 datum으로 쓰지 않는다.
@evidence materials/10-model-bindings.md#binding-map 멜대 beam은 dark-wood, hook은 dark-metal로 분리한다. 수레 deck/handle/support/axle/wheel은 부모가 정한 목재 결속을 그대로 쓴다.
@evidence models/wares.md#storage-jar 북쪽 (8,-9.2)m에 놓인 큰 항아리는 몸체 바닥을 포장에 맞추고 rack이나 stand 없이 독립 내려놓은 원형이다.
@evidence models/wares.md#basket (8.55,-9.2)m의 열린 바구니는 항아리 오른쪽 별도 점유를 받으며 수레 deck 위로 옮겨 보이지 않는 화물로 만들지 않는다.
@evidence models/portable.md#handcart 바퀴의 실제 최저 Y로 수레를 접지하고 긴 손잡이까지 한 모델 점유로 검사한다. deck 원점만 맞춰 바퀴를 바닥 아래로 묻지 않는다.
@evidence models/portable.md#carrying-yoke 막대 중심 원형의 양끝 고리는 접지 뒤에도 빈 구멍으로 남으며 (8.4,-7.1)m에서 실제 운반 동작 없이 내려놓은 상태다.
@evidence models/portable.md#bucket 하나의 높은 손잡이와 열린 입을 가진 빈 물동이를 (9.5,-7.1)m에 놓아 항아리의 좁은 목과 구별한다.
@evidence models/portable.md#rope-coil 세 고리의 느슨한 뭉치 한 개를 (8.2,-7.65)m 포장 위에 두고 멜대 고리·수레 손잡이에 실제로 묶는 새 관계를 추가하지 않는다.
@evidence settings/35-objects.md#vessels 마당의 큰 항아리는 빈 운반 비품군에 속하며 실내 봉헌 그릇이나 분수 수면을 대신하지 않는다.
@evidence settings/35-objects.md#baskets 북쪽 바구니 한 개의 열린 입과 낮은 넓은 몸체가 옆 항아리와 다른 운반물로 읽힌다. 보행 경로에는 반복하지 않는다.
@evidence settings/35-objects.md#handcart 빈 작은 손수레 한 대를 반입문 북쪽에 고정하고 굴림·문 통과 성능을 시연하지 않는다.
@evidence settings/35-objects.md#carrying-yoke 내려놓은 긴 가로대와 두 금속 고리의 독립 비품을 선택해 실제 하중이나 고대 운반법 복원을 주장하지 않는다.
@evidence settings/35-objects.md#bucket 동북 물동이는 높은 손잡이가 있는 빈 도기이며 물의 무게·흐름·운반 동작을 납품하지 않는다.
@evidence settings/35-objects.md#rope-coil 마당 바닥의 별도 느슨한 끈을 포함하되 항아리 운반 장력을 표현하는 물리 시스템으로 바꾸지 않는다.
@evidence materials/00-surface-palette.md#timber 수레의 판·축·바퀴와 멜대 beam에 목재를 유지하며 원통의 횡결은 기존 소품 proxy 한계로 남긴다.
@evidence materials/00-surface-palette.md#metal 멜대 hook 두 개만 청동 계열의 반사로 막대에서 구별한다. 목재 바퀴를 편의상 금속 재료로 바꾸지 않는다.
@evidence materials/00-surface-palette.md#ceramic 항아리와 물동이가 같은 적갈색 도기여도 좁은 목/벌어진 입의 차이는 원형 geometry로 남기고 색만으로 구분하지 않는다.
@evidence materials/00-surface-palette.md#wicker 열린 바구니의 황갈색 섬유가 적갈 도기와 분리되며 가까운 촬영에서도 미세 짜임 비트맵을 새로 요구하지 않는다.
@evidence materials/00-surface-palette.md#rope-fibre 포장 위의 세 고리와 묶음 띠는 마른 섬유색을 받아 땅과 구별되며 빈 고리 중심을 재료로 메우지 않는다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 수레의 긴 손잡이·멜대 고리 최저점과 여섯 비품 점유를 북동 예약, 두 문 및 .8m 반입 경로에 대조했다. 원점 minY 보정만으로 내려놓은 접지가 성립하며 원형·마당 경계·정지 상태를 확대할 결함은 없었다.
-->

손수레·멜대·한 항아리·한 바구니·물동이·끈은 X=8~9.5m, Z=−9.2~−7.1m의 북동 예약에 둔다. 멜대 원점은 막대 중심이므로 고리 최저 Y=−0.145m가 바닥에 닿도록 translationY를 산출한다. 손수레도 실제 바퀴 minY로 접촉하며 굴림·문 통과 성능은 주장하지 않는다. 외부 문→(7.8,−6.4)→(7.8,−3.15)→주랑 문→주랑→보관실의 0.8m 운반 포락은 비품 남쪽·서쪽에서 유지한다. 두 문턱·북동 근접·상면에서 여섯 물품의 비겹침·고정 상태·바닥 접촉을 본다.

| role | model ID | X/Z·yaw·support 입력 |
| --- | --- | --- |
| `yard.cart` | `portable.handcart` | `9,-8.1` |
| `yard.yoke` | `portable.carrying-yoke` | `8.4,-7.1` |
| `yard.jar` | `ware.storage-jar` | `8,-9.2` |
| `yard.basket` | `ware.basket` | `8.55,-9.2` |
| `yard.bucket` | `portable.bucket` | `9.5,-7.1` |
| `yard.rope` | `portable.rope-coil` | `8.2,-7.65` |

## 분수 중심 밖의 대기 비품 {#courtyard}

<!--
@evidence principles/core/common.md#declared-basis fountain 설정이 허용한 가장자리 비품과 court-volume의 중심/주랑 여백을 받아 X=±2.7m 벤치·화분을 선택한다. soil .27m는 planter 원형에서 받는다.
@evidence principles/core/common.md#scope-preservation 벤치 셋·등잔·물동이·두 화분과 그 안 두 풀의 아홉 역할을 포함하고 이미 있는 중심 분수를 이 소품 집합에서 누락/중복 생성하지 않는다.
@evidence principles/core/common.md#substantive-completion 두 화분과 풀의 side/X 입력, Z=2.2m, 각 soil host가 산문으로 닫혀 표 밖 네 개체도 구현의 임의 추가가 아니다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모가 준 가장자리 허용에 기본 벤치 둘의 내향 회전, 짧은 벤치의 북동 자리, 화분과 풀의 실제 받침 사슬을 더한다.
@evidence principles/design/instances.md#instance-prototype-boundary bench.standard와 bench.short는 명명 변형이며 풀은 landscape.grass-tuft의 기존 원형이다. 넓은 나무나 화분 전용 새 식물 mesh를 생성하지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority west/east의 X=-2.7/+2.7m가 planter와 plant를 같이 정하고 풀 Y는 해당 planter/soil에서만 나온다. 두 식물의 높이를 따로 베껴 쓰지 않는다.
@evidence principles/design/instances.md#instance-verification-address 화분 근접은 soil 위 뿌리 접촉, 벤치 근접은 등잔의 seat 접촉을 검사한다. 네 방위/모서리는 아홉 개체가 분수·주랑을 가리는 경우를 반증한다.
@evidence obligations/design/instances.md#addressable-instance-decisions courtyard H2는 가장자리 대기 비품을 소유하며 중심 분수의 기존 fit-out 배치 및 대지 식생 집합과 독립된다.
@evidence obligations/design/instances.md#instance-prototype-membership 표의 다섯 역할에 산문의 planter.west/east와 plant.west/east 네 역할이 더해진다. 세 벤치는 standard 둘과 short 하나로 정확히 연결된다.
@evidence obligations/design/instances.md#instance-identity-transform 표준 벤치 두 개의 ±π/2가 서로 중심을 향하고 짧은 벤치 -π/2가 서쪽을 향한다. side 이름을 traversal 순번으로 바꾸지 않는다.
@evidence obligations/design/instances.md#instance-variation-tiers 짧은 벤치만 기존 short 치수군이며 두 풀의 geometry와 재료는 같고 scale=1이다. 가까운 화분에서 잎 수를 늘리는 LOD 전환은 없다.
@evidence obligations/design/instances.md#instance-placement-review 가장 긴 벤치 둘과 낮은 화분의 실제 점유를 분수 중심 여백 및 주랑 1.5m 포락과 대조하고 서측 seat 위 작은 등잔의 접촉을 별도로 본다.
@evidence settings/30-interiors.md#fountain 중심의 낮은 수반과 한 물줄기는 유지하고 대기 벤치·빈 물동이·불 없는 등잔·흙 화분을 외곽에만 두어 분수 순환 여백을 가리지 않는다.
@evidence spaces/rooms/courtyard.md#court-volume 화분과 벤치는 석재 중정 가장자리에 있고 중앙에 나무를 심지 않는다. 네 방향과 모서리 관찰 및 주랑의 보행 예약을 소품 이후에도 남긴다.
@evidence spaces/storey.md#ground-storey 중정 비품 바닥은 -0.12m이고 풀의 세계 datum은 -0.12+.27=.15m다. 실내 Y=0으로 화분을 띄우지 않는다.
@evidence materials/10-model-bindings.md#binding-map planter pot은 terracotta, soil은 soil, plant blade는 foliage로 세 주소가 갈라진다. seat 위 등잔만 dark-metal이며 벤치는 limestone이다.
@evidence models/portable.md#bench standard 둘과 short 하나의 seat/pier 원형을 그대로 두고 서측 seat의 로컬 .46m 윗면이 등잔을 받는다.
@evidence models/portable.md#bucket 서측 벤치 옆 (-2.7,4)m의 빈 물동이는 포장에 닿으며 분수에 연결된 물 장치나 채워진 수면으로 쓰지 않는다.
@evidence models/portable.md#portable-lamp 작은 등잔 foot을 서측 seat에 맞춰 높은 제실 등잔대와 다른 낮은 대기 비품으로 놓는다.
@evidence models/portable.md#planter 두 도기 화분의 soil .27m가 풀을 받고 pot 테두리보다 .09m 아래의 흙면을 유지한다. 두 화분 모두 완성 포장에 놓인다.
@evidence models/landscape.md#grass-tuft 기존 풀 원형 두 개의 root minY를 화분 soil에 맞추며 외부 조경 원형의 바닥 datum을 그대로 베껴 뿌리를 공중에 띄우지 않는다.
@evidence settings/35-objects.md#bench 세 낮은 석재 좌판과 두 받침이 가장자리 대기 공간을 만들며 등받이·인물의 앉기 동작이나 통행 안전 실측을 추가하지 않는다.
@evidence settings/35-objects.md#bucket 서측의 벌어진 입·높은 손잡이를 가진 도기 한 개는 빈 상태로 남아 분수 물의 흐름이나 운반 무게를 시연하지 않는다.
@evidence settings/35-objects.md#portable-lamp seat 위 불 없는 낮은 등잔 한 개로 대기 비품을 표하며 실내외 조명을 이 소품의 발광으로 보충하지 않는다.
@evidence settings/35-objects.md#planter 두 낮은 화분 안 흙과 별도 식물을 배치해 중앙 석재 중정을 흙 띠나 나무 구역으로 바꾸지 않는다.
@evidence materials/00-surface-palette.md#stone 세 벤치의 seat/pier는 중심 수반과 같은 밝은 limestone 계열이지만 각 원형 part와 물 재료는 합치지 않는다.
@evidence materials/00-surface-palette.md#metal 서측 작은 등잔만 청동 계열의 접시 반응을 내며 벤치 좌판을 금속으로 바꾸지 않는다.
@evidence materials/00-surface-palette.md#ceramic 두 화분 pot과 빈 물동이 body/handle은 적갈색 도기이고 화분 흙면에 같은 도기 키가 번지지 않는다.
@evidence materials/00-surface-palette.md#earth 화분 속 soil part의 낮은 갈색 면은 테두리 안에 담긴 흙이며 중정 석재 포장 전체에 흙 재료를 덮지 않는다.
@evidence materials/00-surface-palette.md#foliage 두 grass-tuft의 blade가 도기·흙과 다른 회녹색으로 남고 사진 잎이나 새로운 수관 자산을 요구하지 않는다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 가장 긴 standard 벤치, 두 .42m 화분과 풀의 soil 접촉을 중심 수반·주랑 포락·중정 -0.12m에 대조했다. 기존 원형과 중정 경계가 아홉 비품을 수용하므로 수반 축척, 포장 높이 또는 식생 종류를 부모에서 바꾸지 않았다.
-->

중정 완성면 Y=−0.12m에서 기본 벤치 둘은 (±2.7,4.9)m로 중심을 바라보고 짧은 벤치는 (2.7,−0.8)m에 둔다. 서측 벤치 옆 물동이와 좌판 위 등잔을 분리한다. 표 외 두 화분 court.planter.west/east는 X=−2.7/+2.7m, Z=2.2m, yaw=0이고 두 풀 court.plant.west/east는 같은 좌표에서 각 화분 soil maxY=0.27m에 뿌리를 맞춘다. 넓은 나무나 새 흙 띠를 만들지 않는다. 기존 분수와 주랑 1.5m 보행 예약을 비운다. 중정 네 방향·네 모서리·벤치/화분 근접에서 모든 비품과 실제 포장 접촉을 본다.

| role | model ID | X/Z·yaw·support 입력 |
| --- | --- | --- |
| `court.bench.west` | `portable.bench.standard` | `-2.7,4.9,Math.PI/2` |
| `court.bench.east` | `portable.bench.standard` | `2.7,4.9,-Math.PI/2` |
| `court.bench.short` | `portable.bench.short` | `2.7,-0.8,-Math.PI/2` |
| `court.lamp` | `portable.lamp` | `-2.7,5.25,0,atop("court.bench.west","seat")` |
| `court.bucket` | `portable.bucket` | `-2.7,4` |

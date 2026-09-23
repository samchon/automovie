# 목재 계열

## 바닥 오크 {#oak-floor}

<!--
@evidence principles/core/common.md#scope-preservation 타일 세 방을 뺀 아홉 방의 floor-boards population 전체를 이 마감에 두고, 판 폭·길이·잘린 판·두께·틈은 층 owner에 남겨 바닥 목재의 배정 누락과 형상 침범이 없다.
@evidence principles/core/common.md#substantive-completion #a78965·roughness .55, oak-grain 1024²·U .36m·V 1.8m, 평균 .96·범위 .86..1.00, 결 간격 1.5..4mm·띠 폭 20..50mm·횡편차 8mm, 판별 계수 .96..1.04를 정해 구현이 바닥 외관을 고르지 않는다.
@evidence principles/core/common.md#declared-basis 따뜻한 목재 바닥은 시각 문법, 판 치수와 틈은 floors.ts의 층 owner, +Z 결은 coordinate-datum과 판 local 축에서 받고 grain·색 수치는 이 층의 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모는 따뜻한 목재 바닥과 판 분할만 준다. 이 H2는 결 방향과 반복 길이, 판별 위상·색 변화, 저광택 투명 마감을 결정한다.
@evidence principles/design/materials.md#material-construction-appearance 명목 .06mm 무광 투명 마감은 표면층, 0.016m 판 두께와 틈은 geometry, 결은 명도 texture로 나누고 돌출이나 검은 옹이 구멍을 만들지 않는다.
@evidence principles/design/materials.md#material-binding-interface 각 판 local +Z와 결 V를 맞추고 방 cell 경계에서 결을 돌리지 않는 world +Z 규칙을 정해 잘린 판에서도 결 폭이 커지지 않게 한다.
@evidence principles/design/materials.md#material-verification-address 최단·최장 판의 scale 표본과 ref03·05의 방 안 네 방향·문턱에서 판재와 저광택 목재가 동시에 읽히는지를 반증한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work ground-level·upper-level의 층 owner 바닥 소유, 0.18×1.8m pitch와 x%3 엇갈림·0.016m 두께·1.5mm 틈의 판 분할을 대조했다. 잘린 판도 실제 크기를 가져 부모 수리가 필요 없었다.
@evidence settings/001-production.md#production-visual-grammar 따뜻한 목재 바닥과 참나무 계열이라는 재료 관계를 #a78965 저광택 오크로 구체화한다.
@evidence settings/003-spatial-basis.md#coordinate-datum +Z 후면 축을 모든 방 바닥판의 결 방향으로 쓴다.
@evidence spaces/002-spatial-graph.md#ground-level 1층 연속 바닥의 최종 면을 층 owner가 소유하므로 현관·작업실·공용부·1층 수납의 판재 population에 이 마감을 배정한다.
@evidence spaces/002-spatial-graph.md#upper-level 2층 복도·세 침실·상층 수납의 바닥판을 같은 층 owner 결정으로 받는다.
-->

`oak-floor`는 타일 방을 제외한 `<room.id>-floor-boards`에만 배정한다. storeys/floors.ts가 0.18m 폭·1.8m 길이 pitch, 잘린 판, 0.016m 판 두께와 기존 틈을 유지한다. 명목 무광 투명 마감층 .06mm이며 geometry를 추가하지 않는다. 기준색 #a78965, roughness=.55다. `oak-grain` 1024², U=.36m·V=1.8m 반복에서 결은 각 판 local+Z와 나란하다.

texture는 선형 무채색 평균 .96, 범위 .86..1.00, 1.5..4mm 간격의 물결치는 세로결과 20..50mm 폭의 완만한 띠다. 결의 횡편차는 주기당 최대 8mm이며 돌출·검은 옹이 구멍은 없다. 판별 위상은 [metric 규칙](001-binding-and-scale.md#metric-texture-coordinates), 판별 sRGB 기준색 계수는 .96..1.04다. 잘린 판에서 결 폭이 커지거나 판 이음이 texture의 검은 선으로 중복되면 실패다.

바닥 world+Z 결은 rooms 전체에 유지하고 cell의 경계 때문에 회전하지 않는다. [최단/최장 판 검사](007-observation.md#scale-and-junction-samples)와 ref03·05의 방 안 네 방향/문턱에서 판재와 저광택 목재가 동시에 읽혀야 한다. 실물 수종 판별·내마모·미끄럼 성능은 unverified다.

## 문과 수납 전면 {#oak-joinery}

<!--
@evidence principles/core/common.md#scope-preservation 모든 doorway의 leaf·jamb·head, 방의 oak cabinet 전면·측판·선반, murphy의 oak 틀을 이 마감에 두고 painted murphy closed-panel은 제외해 문과 수납 목재의 배정이 겹치거나 빠지지 않는다.
@evidence principles/core/common.md#substantive-completion 명목 .6mm 오크 베니어와 .06mm 투명 마감, #a08059·roughness .45, 판별 .98..1.02, 문짝·jamb·수직 전면·head·선반의 V 축을 정해 구현이 결 방향과 응답을 고르지 않는다.
@evidence principles/core/common.md#declared-basis 문 단면과 leaf 두께는 door-interface, 손으로 여는 일반 문은 inherited-defaults, murphy 틀은 flex-states에서 받고 색·결 축은 이 층의 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모는 문짝·틀의 두께와 hinge·pocket 상태만 정한다. 이 H2는 문짝 세로결·head 가로결·운동과 함께 도는 결 좌표와 베니어 응답을 결정한다.
@evidence principles/design/materials.md#material-construction-appearance 베니어·투명 마감은 명목 표면층이고 부재 두께와 운동은 geometry라고 나누며, 조립 내부 접착층과 실제 베니어 접합 상세를 구현했다고 하지 않는다.
@evidence principles/design/materials.md#material-binding-interface 문짝·jamb·장 측판·수직 전면은 V=local+Y, head와 수평 선반은 긴 수평축으로 정하고 좁은 edge band의 결도 명시해 문이 열려도 결이 hinge와 함께 돈다.
@evidence principles/design/materials.md#material-verification-address 상층·작업실과 문 상태 표본에서 문틀·문짝 세로결, 선반 가로결, handle 경계를 반례로 연다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work door-interface의 0.06m jamb·0.045m leaf와 bottom hinge 원점, 열한 문 H2의 폭·높이·열림 방향, flex-states의 murphy 틀을 대조했다. 결 좌표가 요구하는 hinge 원점과 부재 local 축이 이미 있어 부모 수리가 필요 없었다.
@evidence settings/002-household.md#inherited-defaults 손으로 여는 일반 실내 문이라는 기본값을 베니어 문짝과 hinge 회전을 따르는 결로 표현한다.
@evidence settings/002-household.md#flex-states 작업·손님 두 상태에 모두 남는 murphy 오크 틀은 이 마감으로, 작업 상태의 닫힌 panel은 painted로 나눈다.
@evidence spaces/002-spatial-graph.md#door-interface 0.06m jamb·head와 0.045m leaf 단면에 베니어 결 축을 부여하고 3/6mm 틈은 형상 그대로 둔다.
@evidence spaces/002-spatial-graph.md#front-entry reference01의 목재 현관문으로 읽혀야 하는 x=2.22 leaf와 틀이 이 오크 베니어를 받는다.
@evidence spaces/002-spatial-graph.md#entry-flex 벽 pocket으로 -Z 방향으로 미끄러지는 leaf의 세로결이 prismatic 이동과 함께 움직인다.
@evidence spaces/002-spatial-graph.md#entry-common leaf 없는 x=2.05 개구의 양 jamb와 head가 같은 오크 틀 마감을 받는다.
@evidence spaces/002-spatial-graph.md#entry-powder powder 안쪽으로 여는 z=-3.20 leaf와 틀이 이 마감이고 문턱 너머 powder 바닥은 wet-tile로 나뉜다.
@evidence spaces/002-spatial-graph.md#common-storage 수납실 안쪽으로 여는 x=-4.14 문짝과 틀을 이 마감으로 둔다.
@evidence spaces/002-spatial-graph.md#corridor-primary 주침실 안쪽으로 90° 여는 x=-0.58 leaf의 세로결이 hinge와 함께 돈다.
@evidence spaces/002-spatial-graph.md#corridor-child-one 작은 침실 1 연장부로 여는 z=-0.95 문짝과 틀이 이 마감을 받는다.
@evidence spaces/002-spatial-graph.md#corridor-child-two 작은 침실 2로 여는 z=1.05 문짝과 틀이 이 마감을 받는다.
@evidence spaces/002-spatial-graph.md#corridor-bathroom 욕실 안쪽으로 여는 z=1.86 leaf와 틀이 복도 쪽 오크 읽힘을 유지하고 욕실 바닥은 wet-tile로 나뉜다.
@evidence spaces/002-spatial-graph.md#corridor-storage 상층 수납으로 여는 z=0.48 문짝과 틀이 이 마감을 받는다.
@evidence spaces/002-spatial-graph.md#corridor-service 설비실로 여는 z=-0.95 문짝과 틀이 이 마감을 받는다.
@evidence spaces/002-spatial-graph.md#flex-workroom 작업실 murphy frame의 back·side·top 오크 판과 벽 책장이 이 마감을 받는다.
-->

`oak-joinery`는 doorway의 `*-leaf`, jamb/head, 방의 oak cabinet 전면·측판·선반, flex murphy의 oak 틀을 대상으로 한다. 실제 문 운동과 부재 두께는 owner의 현재 geometry다. 판에는 명목 .6mm 오크 베니어와 .06mm 투명 마감을 표현하며 색 #a08059, roughness=.45, 같은 oak-grain을 쓴다. 판별 계수 .98..1.02다.

문짝·jamb·장 측판과 수직 전면의 V는 local+Y, head와 수평 선반은 긴 수평 축이다. 문이 열려도 grain이 hinge와 함께 회전해야 한다. 좁은 edge band도 기존 끝면 안에서 grain 방향을 명시하고 painted murphy closed-panel에는 이 재료를 배정하지 않는다. [상층/작업실 및 문 상태 검사](007-observation.md#reference-material-samples)에서 문틀·문짝 세로결과 선반 가로결, handle 경계가 반례다. 조립 내부 접착층과 실제 베니어 접합 상세를 구현했다고 하지 않는다.

## 가구 목재 {#furniture-wood}

<!--
@evidence principles/core/common.md#scope-preservation 식탁·coffee table·desk의 top과 다리, 침대 base/head, 식탁 의자의 목재 seat·back, sofa plinth를 이 마감에 두고 식재 줄기·흙·잎과 element가 없는 palette의 walnut은 제외해 실제 가구 목재만 배정한다.
@evidence principles/core/common.md#substantive-completion oak-furniture #aa8760·.48과 기준색 변화 .98..1.02, top·headboard·다리·좌판의 V 축과 동률 규칙을 정해 구현이 가구 목재를 고르지 않는다.
@evidence principles/core/common.md#declared-basis 가구 목록은 ground/upper program과 각 방 owner의 형상에서 받고, 바닥·문과 다른 색·광택과 결 축은 이 층의 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모는 가구가 있다는 사실과 배치만 정한다. 이 H2는 바닥·문과 구분되는 가구 목재 응답과 부재별 결 축을 결정한다.
@evidence principles/design/materials.md#material-construction-appearance 판류는 .6mm 베니어, rod·다리는 통목처럼 읽히는 마감의 근사로 나누고 숨은 내부 구조를 성능 주장으로 남기지 않는다.
@evidence principles/design/materials.md#material-binding-interface table top V=local+X, headboard V=local+Y, 다리는 길이 축, 좌판·등받이는 넓은 면의 긴 축이고 동률이면 local+X로 정해 가구 회전과 함께 결이 움직인다.
@evidence principles/design/materials.md#material-verification-address ref03·04 가구 표본에서 조리대·식탁, 가구 목재와 바닥의 결·광택 구분을 반증하고 상자 형상의 단순함은 후속 형상 설계에 남긴다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work common-room의 식탁·coffee table·dining chair·sofa plinth, 세 침실의 bed base/head·desk, 작업실 desk의 형상과 생활 프로그램을 대조했다. 가구의 단순한 box 형상은 후속 형상 설계의 과제이지 재료 결합을 막는 부모 결함이 아니다.
@evidence settings/002-household.md#ground-program 여섯 자리 식탁·low table·조절식 desk를 가구 오크로 배정해 식사와 일의 가구로 읽히게 한다.
@evidence settings/002-household.md#upper-program 침실의 double/single bed와 desk를 같은 가구 목재로 받는다.
@evidence spaces/002-spatial-graph.md#common-room 공용부 식탁·coffee table·dining chair 목재부·sofa plinth를 공용부 owner가 이 마감으로 배정한다.
@evidence spaces/002-spatial-graph.md#primary-bedroom 주침실 double bed의 base/head와 desk가 이 마감을 받는다.
@evidence spaces/002-spatial-graph.md#child-bedroom-1 L자 작은 침실 1의 single bed base/head와 desk가 이 마감을 받는다.
@evidence spaces/002-spatial-graph.md#child-bedroom-2 작은 침실 2의 single bed base/head와 desk가 이 마감을 받는다.
@evidence spaces/002-spatial-graph.md#flex-workroom 작업실 desk의 top과 다리가 이 마감을 받는다.
-->

`oak-furniture`는 common dining/coffee/desk의 top·다리, 침대 base/head, 의자 목재부, sofa plinth의 실제 면에 배정한다. 방 owner가 가구별 전체 형상을 유지한다. 판류는 .6mm 베니어, rod/다리는 통목처럼 읽히는 마감의 근사이고 숨은 내부 구조는 미정 성능 주장으로 남기지 않는다. 색 #aa8760, roughness=.48, oak-grain을 쓰며 기준색 변화는 .98..1.02다.

table top의 V는 local+X, headboard V는 local+Y, 다리는 길이 축이다. 좌판/등받이는 각 넓은 면의 긴 축을 사용하고 동률이면 local+X다. assembly palette의 `walnut`은 어떤 element도 쓰지 않으므로 별도 목재 마감을 두지 않는다. 식재 줄기·흙·녹색 잎에는 목재 마감을 확장하지 않는다. [ref03·04 가구 검사](007-observation.md#reference-material-samples)에서 조리대와 식탁, 가구 목재와 floor의 결/광택 구분을 본다. 부품이 단순한 상자인 문제는 후속 형상 설계에 남긴다.

## 계단 목재 {#stair-wood}

<!--
@evidence principles/core/common.md#scope-preservation 계단 owner의 기존 tread·riser와 stair-half-landing 전체를 이 마감에 두고 handrail은 coated-metal로 남겨 계단 목재면의 배정을 끝낸다.
@evidence principles/core/common.md#substantive-completion oak-stair #a78965·roughness .50과 oak-grain, tread·riser V=local+X, 참판 +Z를 정해 구현이 계단 결을 고르지 않는다.
@evidence principles/core/common.md#declared-basis 단 수·위치·폭·단높이는 single-stair, 도착선은 stair-opening에서 받고 색은 바닥 기준색을 잇는 이 층의 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모는 rise·going·참 위치만 정한다. 이 H2는 디딤판 결의 방향과 참·층 바닥으로 이어지는 결의 연속을 결정한다.
@evidence principles/design/materials.md#material-construction-appearance .06mm 투명 마감의 시각 근사로 두고 미끄럼·안전 성능을 선언하지 않으며, 실제 부재가 없는 접합을 texture로 추가하지 않는다.
@evidence principles/design/materials.md#material-binding-interface tread·riser는 폭 방향 local+X, 참판은 +Z로 결을 정해 계단 수·위치·폭·회전을 바꾸지 않고 결합한다.
@evidence principles/design/materials.md#material-verification-address 첫단·꺾임참·마지막 단과 층 바닥의 이어짐, rail과 목재의 광택 차이를 scale-and-junction-samples의 계단 접합에서 반증한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work single-stair의 9+9 tread·riser와 y=1.60 참, stair-opening의 z=-1.80 도착선을 대조했다. 결 방향을 정하는 데 필요한 부재 local 축과 도착 경계가 모두 있었다.
@evidence spaces/002-spatial-graph.md#single-stair 9+9 tread·riser와 y=1.60 참판에 결 방향을 부여하고 metal handrail은 목재로 바꾸지 않는다.
@evidence spaces/002-spatial-graph.md#stair-opening 상부 flight 마지막 tread가 z=-1.80에서 복도 바닥판과 만나는 도착선을 결 연속 표본의 경계로 쓴다.
-->

계단 owner의 기존 tread/riser와 stair-half-landing은 `oak-stair` 색 #a78965·roughness=.50, oak-grain이다. 계단 수와 위치·폭·단높이·회전은 바꾸지 않는다. 디딤판 결의 V는 폭 방향 local+X, riser도 가로+X, 참판은 +Z다. 현재 handrail은 metal이므로 목재로 바꾸지 않고 coated-metal을 받는다. 현재 .06mm 투명 마감의 시각 근사이며 미끄럼/안전 성능을 선언하지 않는다.

[계단 접합 검사](007-observation.md#scale-and-junction-samples)는 첫단/꺾임참/마지막 단과 층 바닥의 이어짐, rail과 wood의 광택 차이를 본다. 실제 부재가 없는 접합을 texture로 추가하지 않으며 참판의 grain은 바닥 +Z를 유지한다. 단마다 grain 크기가 달라지거나 목재 디딤판이 금속 난간과 같은 재질로 읽히면 실패다.

## 목재 끝면 {#wood-end-faces}

<!--
@evidence principles/core/common.md#scope-preservation grain 축이 면 법선과 평행한 모든 목재 끝면을 같은 완결 owner의 wood-end 역할로 받아 끝면이 무배정이나 불가능한 투영으로 남지 않게 한다.
@evidence principles/core/common.md#substantive-completion 베니어 판 끝면은 긴 접선축 V와 X·Z·Y 동률 순서, 통목 다리 끝면은 같은 기준색·roughness의 무texture 면으로 정해 구현이 끝면 처리를 고르지 않는다.
@evidence principles/core/common.md#declared-basis 기준 목재 마감은 oak-floor·oak-joinery·furniture-wood·stair-wood에서, 끝면 소유는 surface-decomposition의 완결 owner에서 받고 끝면 규칙은 이 층의 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모는 부재 두께와 형상만 준다. 이 H2는 grain 축과 법선이 평행한 면에서 가짜 나이테 없이 결을 표현하는 끝면 규칙을 더한다.
@evidence principles/design/materials.md#material-construction-appearance .6mm edge band는 명목 표면층이고 기준 부재 두께는 geometry 그대로이며 실제 나이테나 접착 시공을 인증하지 않는다고 나눈다.
@evidence principles/design/materials.md#material-binding-interface 끝면 법선과 grain 축의 비교로 역할을 정하고 부재 두께나 형상을 바꾸지 않는 결합 조건을 둔다.
@evidence principles/design/materials.md#material-verification-address 문·가구·계단 접합 표본에서 얇은 edge와 넓은 면의 연결을 보고, census에서 texture 적용 끝면 수와 무texture 끝면 수를 따로 반증한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work door-interface의 0.045m leaf 끝면과 0.06m jamb 면, 가구 판 두께와 rod 다리, surface-decomposition의 owner 단위를 대조했다. 끝면을 한 owner가 배정하기에 부모의 소유와 형상이 충분했다.
@evidence settings/003-spatial-basis.md#surface-decomposition 끝면을 넓은 면과 같은 완결 owner가 배정해 다른 owner가 끝면만 덧칠하지 않게 한다.
@evidence spaces/002-spatial-graph.md#door-interface 0.045m leaf와 jamb의 좁은 끝면이 베니어 edge band 규칙의 대표 표면이다.
-->

grain 축이 면 법선과 평행한 끝면은 같은 완결 owner가 `wood-end/<기준 목재 마감>` 역할을 배정한다. 베니어 판은 명목 .6mm edge band이며 그 끝면의 긴 접선축을 V로 삼아 같은 oak-grain을 쓴다. 접선 길이가 같으면 X, Z, Y 순으로 결정한다. 통목처럼 표현한 다리의 절단 끝은 같은 기준색·roughness의 무texture 면으로 두어 불가능한 축 투영이나 가짜 나이테를 만들지 않는다. 기준 부재 두께는 그대로다.

이는 보이는 끝면의 표현 선택이며 실제 나이테나 접착 시공을 인증하지 않는다. [문·가구·계단 접합 검사](007-observation.md#scale-and-junction-samples)에서 얇은 edge와 넓은 면의 마감 연결을 보고, texture 적용 수와 끝면의 무texture 수를 [census](007-observation.md#binding-census)에 따로 남긴다. 끝면을 검사에서 삭제하거나 무UV를 metric texture 통과로 처리하지 않는다.

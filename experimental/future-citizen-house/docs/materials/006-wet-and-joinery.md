# 습식 마감과 도장 가구

## 바닥과 벽 타일 {#wet-tile}

<!--
@evidence principles/core/common.md#scope-preservation powder-utility·upper-bathroom·upper-service의 floor-boards, powder·욕실의 tile lining(공유 벽에서는 그 방 쪽 면만), 욕실 동측 tile 벽 안의 junction -X면 하나를 이 마감에 두고 upper-service lining과 공유 벽 반대편 면은 실내 도장, 세면기 bowl의 tile색은 도기로 넘겨 습식 면의 배정이 섞이지 않는다.
@evidence principles/core/common.md#substantive-completion #6f746f·roughness .65, tile-grain 512²·.45m, 2..6mm 입자와 평균 .98·범위 .95..1.00, 바닥 X/Z·벽 수평/수직 좌표를 정해 구현이 습식 마감을 고르지 않는다.
@evidence principles/core/common.md#declared-basis 세 방의 .45m pitch 판과 잘린 타일, lining은 층·방 owner의 기존 geometry에서 받고, 색·입자는 이 층의 선택이며 방수층·배수 경사·마찰 성능은 인증 범위 밖이라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모는 세 방이 위생·설비 공간이라는 사실과 층·방 owner source의 타일 판 분할과 tile lining만 준다. 이 H2는 도기·금속·목재와 구분되는 짙은 무광 타일 응답과 새 줄눈망 없이 실제 틈만 쓰는 규칙을 결정한다.
@evidence principles/design/materials.md#material-construction-appearance 기존 tile 판 두께와 틈은 geometry 그대로 두고 입자는 명도 texture로만 쓰며 벽돌 무늬나 줄눈 texture로 구조를 흉내 내지 않는다.
@evidence principles/design/materials.md#material-binding-interface 바닥 X/Z, 벽 수평/수직의 metric UV로 결합하고 세면기 bowl처럼 같은 색 이름의 다른 역할에는 결합하지 않는다.
@evidence principles/design/materials.md#material-verification-address 습식 방 표본에서 도기·금속·목재와의 구분, 문턱의 oak/tile 경계, 물체 아래 남은 바닥 면을, 그 면을 실제로 담는 upper-bathroom/corner-1·corner-3 관찰과 007 접합 표본에서 욕실 동측 tile 벽이 junction 면에서 도장 띠로 끊기지 않는지를 반증한다.
@evidence upstream/design/materials.md#parent-revision-from-material-work oak/tile 문턱 경계를 결합하려고 세 문 아래를 compiled scene에서 재자, tile 바닥판이 x=-3.02 앞에서, oak 바닥판이 x=-2.84 뒤에서 끝나고 그 사이 host 벽 두께 구간에는 바닥 마감 없이 구조 상면이 16mm 낮은 홈으로 드러나 있었다. 문 아래 바닥을 정하지 않은 부모 door-interface에 0.016m 문턱판을 정하고 doorway source를 고쳤다(fbaf7c73). 세 방의 clear cell, 층·방 owner source의 .45m tile pitch와 powder·욕실 lining은 충분했다.
@evidence settings/001-production.md#governing-aim 세척 공간이 실제 문 너머의 습식 마감으로 식별되도록 oak 방과 다른 타일 응답을 준다.
@evidence spaces/002-spatial-graph.md#powder-utility 1층 powder의 tile 바닥판과 전면·우측 외벽과 현관·수납 쪽 공유 벽의 tile lining 네 면이 이 마감을 받는다.
@evidence spaces/002-spatial-graph.md#upper-bathroom 상층 욕실의 tile 바닥판과 tile lining, 동측 벽의 junction 면 하나가 이 마감을 받아 욕실 벽이 한 마감으로 이어진다.
@evidence spaces/002-spatial-graph.md#upper-service 설비·세탁실의 tile 바닥판이 이 마감을 받고 lining은 실내 도장으로 남는다.
@evidence spaces/002-spatial-graph.md#entry-powder entry-powder 문의 oak 문턱판과 powder tile 바닥이 x=-3.02 벽면 선에서 만나는 경계를 이 마감이 가진다.
@evidence spaces/002-spatial-graph.md#wall-entry-powder 현관·powder 공유 벽에서 이 마감은 powder 쪽 tile lining만 받고 현관 쪽 면은 실내 도장이 받는다.
@evidence spaces/002-spatial-graph.md#wall-powder-storage powder·1층 수납 닫힌 경계에서 이 마감은 powder 쪽 tile lining만 받고 수납 쪽 면은 실내 도장이 받는다.
@evidence spaces/002-spatial-graph.md#wall-corridor-bathroom 복도·욕실 공유 벽에서 이 마감은 욕실 쪽 tile lining만 받고 복도 쪽 면은 실내 도장이 받으며, 욕실 문 cut이 두 면을 함께 관통한다.
@evidence spaces/002-spatial-graph.md#wall-storage-bath 상층 수납·욕실 닫힌 경계에서 이 마감은 욕실 쪽 tile lining만 받고 수납 쪽 면은 실내 도장이 받는다.
@evidence spaces/002-spatial-graph.md#wall-bath-primary 욕실·주침실 측면 경계에서 이 마감은 욕실 쪽 tile lining만 받고 주침실 쪽 면은 실내 도장이 받는다.
@evidence spaces/002-spatial-graph.md#wall-junctions 욕실·주침실·복도 벽 끝이 만나는 junction solid의 -X면이 욕실 tile 벽 안에 드러나므로 이 마감이 그 한 면을 받는다.
-->

`wet-tile`은 powder-utility, upper-bathroom, upper-service의 floor-boards, powder-utility와 upper-bathroom의 tile lining(powder는 전면·우측 외벽과 현관·수납 쪽 공유 벽의 네 면), 그리고 upper-bathroom 동측 tile 벽 안 x=-3.02..-2.84, z=2.40..2.58에 드러나는 층 owner junction의 -X면이다. 이 junction 면은 복도·주침실 벽 끝 사이에서 욕실 lining과 같은 면에 놓이므로 tile 벽을 도장 띠로 끊지 않도록 [실내 도장](005-soft-finishes.md#plaster-paint)의 junction 규칙에 따라 이 마감이 받는다. floor owner의 .45m pitch, 잘린 타일, 실제 틈과 room lining을 유지한다. upper-service의 lining은 plaster이며 [실내 도장](005-soft-finishes.md#plaster-paint)이 받는다. tile lining이 붙은 공유 벽의 반대편 면은 상대 방의 plaster lining으로 실내 도장이 받는다. oak 바닥과 만나는 문턱은 entry-powder, corridor-bathroom, corridor-service의 세 곳이며, 각 문의 [oak 문턱판](004-wood.md#oak-joinery)이 host 벽 두께를 채우고 tile 방 쪽 벽면 선에서 tile 바닥판과 만난다. 색 #6f746f, roughness=.65, `tile-grain` 512²·.45×.45m, 2..6mm 입자의 선형 평균 .98·범위 .95..1.00이다. 기존 tile 판의 두께는 geometry 값 그대로이고 새 줄눈망이나 벽돌 무늬는 그리지 않는다.

바닥 X/Z, 벽 수평/수직의 metric UV를 사용한다. 세면기 bowl의 기존 tile색에는 이 마감을 쓰지 않고 [위생 도기](#sanitary-ceramic)가 받는다. [습식 방 관찰](007-observation.md#reference-material-samples)에서 도기·금속·목재와 구분하고 문턱의 oak/tile 경계 및 물체 아래 남은 바닥 면을 확인한다. 이 junction 면은 욕실의 `upper-bathroom/corner-1` 관찰에서 샤워 고정 유리 너머 면 법선으로부터 약 57° 비스듬히, `corner-3` 관찰에서 비스듬한 선으로 보이며, [접합 표본](007-observation.md#scale-and-junction-samples)의 욕실 동측 tile 벽 junction 항목이 같은 면의 부재 ID와 법선을 기록한다. 이 세 표본이 junction 면이 좌우 tile lining과 한 마감으로 이어지는지를 반증한다. 중심 +X 관찰은 (-4.14, 3.52)에서 1.12m 떨어진 벽을 수평 반각 36.7°(세로 FOV 50°, 화면비 1.6)로 보아 약 z=2.68..4.36만 담으므로 이 면을 반증하지 못한다. 방수층·배수 경사·마찰 성능은 이 재료 설정의 인증 범위 밖이다.

## 조리대 석재 {#worktop-stone}

<!--
@evidence principles/core/common.md#scope-preservation kitchen-island counter와 kitchen-wall-bank worktop의 판 면만 이 마감에 두고 sink와 hob의 형상은 models, 배치는 instances에 남겨 조리대 표면의 범위를 닫는다.
@evidence principles/core/common.md#substantive-completion #dad7ce·roughness .30, worktop-grain 512²·.50m, 1..3mm 입자와 평균 .985·범위 .96..1.00, 금속성·투과·clearcoat 없음을 정해 구현이 조리대 외관을 고르지 않는다.
@evidence principles/core/common.md#declared-basis 조리대 판 두께와 sink·hob 형상은 models, 방 안 배치는 instances에서 받는다. 현재 공용부 source의 값은 임시 관찰 입력이며 연마 합성 석재 근사와 수치는 이 층의 선택이고 식품 접촉·내열 성능은 unverified다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 프로그램은 island와 주방이 있다는 사실만 준다. 이 H2는 초록 cabinet·식탁·싱크와 구분되는 연마된 밝은 석재 응답을 결정한다.
@evidence principles/design/materials.md#material-construction-appearance 판 두께는 geometry로 두고 입자는 명도 texture로만 쓰며 검은 marble vein이나 구운 광택 줄로 형상을 흉내 내지 않는다.
@evidence principles/design/materials.md#material-binding-interface top X/Z와 실제 edge 면에 같은 크기의 등방성 입자를 두어 top과 edge의 색이 이어지는 좌표 조건을 정한다.
@evidence principles/design/materials.md#material-verification-address ref03 조리대 표본에서 초록 cabinet·식탁·싱크와 다르게 읽히는지, top/edge 색이 연결되는지를 반증한다.
@evidence upstream/design/materials.md#parent-revision-from-material-work common-room의 island counter·wall bank worktop과 sink·hob는 현재 분리된 메시지만 방 source의 임시 물체 주소다. settings/003#surface-decomposition에서 형상과 배치를 models·instances로 분리했고 최종 counter와 sink 접합 주소는 models 재판정 뒤 확인한다.
@evidence settings/002-household.md#ground-program 주방 island와 cooktop이 놓인 조리대가 cabinet과 구분되는 밝은 석재로 읽히게 한다.
@evidence spaces/002-spatial-graph.md#common-room 연속 공용부 주방이라는 목적에 놓이는 island counter와 wall bank worktop의 model part에 이 마감을 배정한다.
-->

`worktop-stone`은 kitchen-island counter와 kitchen-wall-bank worktop의 기존 판 면이다. 현재 판 두께와 sink/hob의 기하 관계를 유지한다. 연마된 밝은 합성 석재의 근사로 색 #dad7ce, roughness=.30, `worktop-grain` 512²·.50×.50m, 1..3mm 입자, 선형 평균 .985·범위 .96..1.00을 쓴다. 금속성·투과·clearcoat는 없다.

top X/Z와 실제 edge 면에 같은 크기의 등방성 입자를 배정하며 검은 marble vein이나 구운 광택 줄은 없다. [ref03 조리대 검사](007-observation.md#reference-material-samples)에서 초록 cabinet·식탁·싱크와 다르게 읽히고 top/edge의 색이 연결되어야 한다. 실제 식품 접촉·내열 성능은 unverified다.

## 위생 도기 {#sanitary-ceramic}

<!--
@evidence principles/core/common.md#scope-preservation basin rim/bowl, toilet pedestal/bowl/cistern, 샤워 트레이의 실제 면을 이 마감에 두고 벽 타일·침구·가전 흰색에는 적용하지 않아 흰 면들의 배정이 섞이지 않는다.
@evidence principles/core/common.md#substantive-completion texture 없음, #e7e6df·roughness .19·metallic 0·clearcoat .12와 명목 .5mm 유약을 정해 구현이 도기 응답을 고르지 않는다.
@evidence principles/core/common.md#declared-basis 위생 기구 목록은 생활 프로그램, 최종 형상은 models에서 받는다. 현재 방 source는 임시 관찰 입력이고 배관·작동 제외는 program-boundary, 유광 수치는 이 층의 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모는 vanity·toilet·shower가 있다는 사실만 준다. 이 H2는 white·tile 이름으로 흩어진 위생 기구를 하나의 유광 도기 역할로 모으는 결정을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 유약 .5mm는 기하 안에 포함된 명목 층이고 위생 기구의 두께는 models, 배관 과정은 납품 밖에 남긴다. 유광 마감으로 단순한 형상이나 배관 작동을 해결했다고 하지 않는다.
@evidence principles/design/materials.md#material-binding-interface texture가 없어 좌표 요구가 없고 곡면은 현재 mesh 그대로 반사하며, 역할 주소(rim·bowl·pedestal·cistern·tray)로만 결합한다.
@evidence principles/design/materials.md#material-verification-address 습식 방 관찰에서 도기가 직물처럼 보이지 않는지, basin 내부가 바닥 tile과 같은 재료로 읽히지 않는지를 반증한다.
@evidence upstream/design/materials.md#parent-revision-from-material-work 도기 역할을 욕실 기구에 결합하며 spaces/002#upper-bathroom이 욕조와 샤워를 모두 약속한 반면 source에는 샤워 트레이 하나만 있음을 찾았다. upper-program은 shower/tub 가운데 하나를 요구하므로 부모 upper-bathroom을 샤워로 고쳤다(ad32755d). powder와 욕실의 basin·toilet·shower tray 형상과 program-boundary의 설비 작동 제외는 충분했다.
@evidence settings/002-household.md#upper-program 욕실의 vanity·toilet·shower 기구를 유광 도기로 식별되게 한다.
@evidence settings/002-household.md#program-boundary 설비 작동을 검증하지 않는다는 경계를 도기 마감이 배관 작동을 해결하지 않는다는 한계로 옮긴다.
@evidence spaces/002-spatial-graph.md#powder-utility powder의 세면기 rim·bowl과 toilet pedestal·bowl·cistern이 이 도기를 받는다.
@evidence spaces/002-spatial-graph.md#upper-bathroom 욕실 vanity rim·bowl, toilet 세 부재와 shower tray가 이 도기를 받는다.
-->

`sanitary-ceramic`은 basin rim/bowl, toilet pedestal/bowl/cistern, 샤워 트레이의 실제 면이다. 기구 목록은 [1층 프로그램](../settings/002-household.md#ground-program)과 [상층 프로그램](../settings/002-household.md#upper-program)에서, 최종 형상과 part/face는 models에서, 배관·작동 제외는 [프로그램 경계](../settings/002-household.md#program-boundary)에서 받는다. 현재 방 source의 white/tile 문자열은 이관 전 임시 이름이며 최종 역할 주소가 아니다. texture 없음, 색 #e7e6df, roughness=.19, metallic=0, clearcoat=.12다. 명목 .5mm 유약은 기하 안에 포함되며 벽 타일, 침구, 세탁기·keyboard 같은 가전 흰색에 적용하지 않는다.

곡면은 최종 model mesh의 법선을 사용하고 부재 두께도 models가 정한다. 배관 작동은 납품하지 않는다. [습식 방 관찰](007-observation.md#reference-material-samples)에서 도기가 직물처럼 보이지 않는지, basin 내부가 바닥 tile과 같은 재료로 읽히지 않는지 확인한다. 기기의 단순한 형상이나 실제 배관 작동은 이 glossy 마감으로 해결했다고 하지 않는다.

## 변기 좌판 수지 {#sanitary-seat}

<!--
@evidence principles/core/common.md#scope-preservation toilet의 기존 *-seat 면만 이 마감에 두고 도기 유약·직물 피복을 선언하지 않아, linen색 이름이 만든 직물 오배정을 닫는다.
@evidence principles/core/common.md#substantive-completion #e7e6df·roughness .30·metallic 0·clearcoat 0·texture 없음을 정해 구현이 좌판 응답을 고르지 않는다.
@evidence principles/core/common.md#declared-basis 좌판의 최종 타원 형상과 두께는 models에서 받고 현재 방 source geometry는 임시 관찰 입력이다. 성형 수지 분류와 수치는 이 층의 선택이며 조성·내구·하중은 unverified다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모는 toilet이 있다는 사실만 준다. 이 H2는 좌판을 도기 bowl과 같은 색·다른 광택의 수지로 구분하는 결정을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 성형 수지라는 부재 분류와 roughness .30의 렌더 응답을 나누고 도기와 겹치는 이중 표면을 만들지 않는다.
@evidence principles/design/materials.md#material-binding-interface 면 방향은 현재 mesh 법선을 따르고 texture 좌표 없이 *-toilet-seat 역할 주소로만 결합한다.
@evidence principles/design/materials.md#material-verification-address 습식 방 관찰에서 seat/bowl 경계를 함께 보고, 좌판에 직물 격자가 생기거나 도기와 겹치는 이중 표면이 생기면 실패로 둔다.
@evidence upstream/design/materials.md#parent-revision-from-material-work powder와 욕실의 seat와 bowl은 현재 별도 element이나 방 source의 임시 주소다. settings/003#surface-decomposition에서 위생 기구의 최종 part/face 소유를 models로 돌렸고 seat와 bowl 경계는 models 재판정 뒤 다시 결속한다.
@evidence spaces/002-spatial-graph.md#powder-utility powder toilet의 좌판이 이 수지 마감을 받는다.
@evidence spaces/002-spatial-graph.md#upper-bathroom 욕실 toilet의 좌판이 이 수지 마감을 받는다.
-->

`sanitary-seat`는 toilet의 좌판 면만 받는 흰 성형 수지 마감이다. 현재 `*-toilet-seat`는 임시 element 주소이며 최종 model part/face의 타원 형상과 두께를 사용한다. 도기 유약이나 직물 피복을 선언하지 않는다. 색 #e7e6df, roughness=.30, metallic=0, clearcoat=0, texture 없음이다. 기존 linen이라는 색 이름을 실제 직물로 해석하지 않는다. 면 방향은 최종 mesh 법선을 따르고 광택의 차이만 도기 bowl과 구분한다.

[습식 방 관찰](007-observation.md#reference-material-samples)에서 seat/bowl 경계를 함께 본다. 좌판에 직물 격자가 생기거나 도기와 겹치는 이중 표면이 생기면 실패다. 실제 수지 조성·내구·하중 성능은 unverified다.

## 도장 수납 가구 {#painted-joinery}

<!--
@evidence principles/core/common.md#scope-preservation kitchen-island·kitchen-wall-bank의 녹색 cabinet 판은 joinery-green, kitchen-overhead와 murphy closed-panel의 plaster색 판은 joinery-light로 모두 받고 green 소파 pillow·잎, plaster 벽·천장은 제외해 도장 가구의 배정이 섞이지 않는다.
@evidence principles/core/common.md#substantive-completion joinery-green #626b59·.44와 joinery-light #c9c3b7·.48, 명목 .1mm 도막, texture 없음·metallic 0을 정해 구현이 도장 가구를 고르지 않는다.
@evidence principles/core/common.md#declared-basis 낮은 채도의 녹색 가구는 시각 문법, murphy 상태는 flex-states, 최종 문짝 분할과 손잡이는 models에서 받고 색·광택은 이 층에서 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모는 녹색 가구와 접이식 panel이 있다는 사실만 준다. 이 H2는 무광 벽보다 약간 매끈한 도장 응답과 plaster 이름의 panel을 벽 도장과 다른 역할로 나누는 결정을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 명목 .1mm 도막은 표면층이고 문짝 분할·손잡이·틈은 models, 상태별 배치는 instances에 남긴다. 새 서랍 형상을 재료로 흉내 내지 않는다.
@evidence principles/design/materials.md#material-binding-interface 판 두께와 local face를 그대로 쓰고 texture가 없어 방향 좌표 요구가 없으며, 반사 방향은 실제 법선이 정한다는 조건으로 결합한다.
@evidence principles/design/materials.md#material-verification-address ref03·04 표본에서 cabinet이 무광 벽보다 약간 매끈하고 worktop·직물과 구분되는지를 반증한다.
@evidence upstream/design/materials.md#parent-revision-from-material-work kitchen cabinet과 murphy closed-panel은 현재 별도 element이지만 방 source가 형상을 만들고 있어 최종 owner가 아니다. settings/003#surface-decomposition에서 models·instances 이관을 정했으며 cabinet 판과 murphy 양면 주소를 models 재판정 뒤 결합한다.
@evidence settings/001-production.md#production-visual-grammar 낮은 채도의 녹색 가구라는 재료 관계를 joinery-green #626b59로 옮긴다.
@evidence settings/002-household.md#flex-states 작업 상태에서 닫혀 세로 패널로 읽히는 murphy panel을 joinery-light로 두고 손님 상태의 guest bed와 상태별 배치가 겹치지 않게 한다.
@evidence spaces/002-spatial-graph.md#common-room 주방 wall bank·island와 overhead가 공용부에 놓인다는 목적을 받고 각 model part의 두 도장 결합을 정한다.
@evidence spaces/002-spatial-graph.md#flex-workroom 작업실 murphy closed-panel의 방 귀속을 받고 joinery-light를 model part에 결합한다.
-->

`joinery-green`은 kitchen-island·kitchen-wall-bank cabinet의 green back·door·shelf·side 판에 색 #626b59·roughness=.44를 배정한다. `joinery-light`는 kitchen-overhead 및 flex murphy closed-panel의 밝은 판에 #c9c3b7·roughness=.48을 쓴다. 명목 .1mm 도막, texture 없음, metallic=0이다. murphy closed-panel은 작업 상태에만 있고 손님 상태에는 instance가 guest bed를 배치한다. 최종 문짝 분할·손잡이·틈의 주소는 models가 정하며 현재 방 source의 역할 이름은 임시 입력이다.

sofa 가운데 green pillow와 식물 잎, plaster wall/ceiling에 확장하지 않는다. 판 두께와 local face를 그대로 쓰므로 texture 방향 문제는 없고 반사 방향은 실제 법선으로 결정한다. [ref03·04 검사](007-observation.md#reference-material-samples)에서 cabinet은 무광 벽보다 약간 매끈하며 worktop·직물과 구분되어야 한다. 새로운 문 접합/서랍 형상은 후속 fit-out 설계의 영역이다.

## 나머지 표면의 보존 {#retained-surfaces}

<!--
@evidence principles/core/common.md#scope-preservation 식재·토양·대지 포장(잔디 보강 포장 service-band와 캐노피 cassette-staging-pad 포함), 기기 화면·hob·keyboard와 glow에 더해 felt 바구니·linen 더미·샤워 유리·세탁기·steel 설비장 몸체·stool 좌판처럼 새 마감이 없는 역할을 이름으로 retained/<현재 material id>에 두어 catch-all 없이 모든 기존 역할에 owner와 배정이 남게 한다.
@evidence principles/core/common.md#substantive-completion 보존 대상과 금지되는 자동 배정(oak 줄기→가구 결, green 소파→cabinet paint, 가전 white→도기)을 이름으로 정해 구현이 이름 추측으로 나머지 면을 칠하지 않는다.
@evidence principles/core/common.md#declared-basis 식재 수와 배치는 v-076의 roof-face 조경 결정, 대지 부재는 site-access에서 받고 기기·소품의 현재 방 source 값은 임시 입력으로 구분한다. 최종 물체 주소는 models·instances에 있고 보존 결정은 이 층의 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 spaces는 대지 면을, roof-face는 외부 식재의 ID·형상·보존을 정하고 기기·실내 소품의 최종 형상은 models에 남긴다. 이 H2는 임시 물체 주소와 이미 소유된 건축 면을 구별하며 retained 역할에 모르는 이름을 몰아넣지 않는 규칙을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 보존 면의 geometry와 material 값을 그대로 두고, 낮은 조경 밀도·기기 화면의 단색·단순한 조명 기구를 재료 PASS로 지운 완성으로 주장하지 않는다.
@evidence principles/design/materials.md#material-binding-interface retained 역할은 현재 owner 주소와 material id를 출력에서 추적하는 결합이며 값을 복사한 표를 새 owner로 만들지 않는다는 조건을 둔다.
@evidence principles/design/materials.md#material-verification-address 보존 목록은 binding-census에서, 전경의 읽힘은 reference 표본에서 반증하고 보존된 한계를 미완료로 남긴다.
@evidence upstream/design/materials.md#parent-revision-from-material-work site-access와 roof-face, right-face 및 두 층의 건축 면은 기존 owner와 대조했다. 그러나 방 source의 기기·소품은 영구 주소가 아니므로 settings/003#surface-decomposition에서 models·instances 이관을 정했고, 이 보존 목록의 물체 주소는 models 재판정 뒤 다시 결속해야 한다.
@evidence spaces/001-citizen-house.md#site-access 대지 owner의 포장·토양·식재를 현재 geometry와 material 값 그대로 보존 역할로 두어 site 면에 새 마감을 덧칠하지 않는다.
@evidence spaces/003-surface-ownership.md#roof-face roof-face가 보존 조건을 정하고 v-076에서 닫힌 나무·관목·풀의 ID·형상·재료를 재료 교체에서도 그대로 유지한다.
@evidence settings/002-household.md#operative-subjects 고정 식재와 보이는 fixture만 납품한다는 경계를 식재·기기 재료를 새 응답 없이 보존하는 결정으로 받는다.
@evidence settings/001-production.md#delivery-fidelity 낮은 fidelity로 빠진 부재를 면제하지 않는다는 기준에 따라 대지·나무의 낮은 형상 밀도를 보존된 미완료 한계로 남긴다.
-->

v-076의 식재·토양·대지 포장 및 equipment screen/hob/keyboard와 glow는 각 현재 owner의 geometry와 material 값을 유지한다. 현재 source에서 새 마감이 없는 역할은 이름으로 남긴다: 1층 수납의 felt 바구니, 상층 수납의 linen 더미, 욕실 샤워의 고정 유리 screen, 세탁기의 white 몸체·metal drum·glass 창·metal controls, 설비실의 steel 설비장 몸체(metal 손잡이는 [도장 금속](002-exterior-solids.md#coated-metal)), island stool의 metal 좌판, island 싱크 개구를 나타내는 짙은 metal basin 판, desk 화면·stand와 keyboard, 공용부 display, hob과 oven, 충전기, 식물 화분과 줄기·잎, 캐노피 support anchor·cassette 체결 bolt·head·거름망과 우측 배수 점검 덮개, 대지 포장·curb·계단·집수 부재와 green 잔디 보강 포장(`service-band-*`), 캐노피 정비용 석재 받침(`cassette-staging-pad`), 지붕 방수 최종 면(roof-weather, 가장자리 면 포함)과 캐노피 pedestal, 1층 기초 plinth(ground-foundation과 외벽 아래 `ground-foundation-bearing-*`), upper slab에서 계단 구멍 쪽 절단면과 전면 strip 윗면을 뺀 나머지 면(piece 사이 맞닿은 면 포함). 나무4·관목48그룹·풀23그룹의 이동이나 추가는 없다. 식재의 oak 줄기에 furniture grain을, 소파의 green에 cabinet paint를, appliance white에 도기를 자동 배정하지 않는다. 신규 finish가 지정되지 않은 기존 역할은 `retained/<현재 material id>`로 명시하며 알 수 없는 이름을 이 역할에 몰아넣지 않는다.

검증은 [완전 바인딩 census](007-observation.md#binding-census)의 보존 목록 및 [reference 전경 검사](007-observation.md#reference-material-samples)다. source 값을 복사한 표를 새 소유자로 만들지 않고 기존 material 및 owner 주소를 출력에서 추적한다. 대지·나무의 낮은 형상 밀도, 기기 화면의 단색, 조명 기구의 단순함은 보존된 한계이며 이번 재료 PASS만으로 전체 제작 완료를 주장하지 않는다.

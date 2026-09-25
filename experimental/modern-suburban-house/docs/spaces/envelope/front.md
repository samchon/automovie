# 전면 지붕과 실내 경계

## 박공 삼각 벽과 포치 위의 외벽 {#front-roof-closures}
<!--
@evidence principles/core/common.md#scope-preservation 왼쪽 박공 삼각 벽, 주/낮은 지붕 아래의 나머지 전면 벽, 차고 정면까지 하나의 전면 owner가 닫고 좌·중·우 구간의 방 바인딩을 모두 남긴다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 본문이 왼쪽 박공 삼각 벽·주/낮은 지붕 아래 나머지 전면·차고 정면을 front.ts 한 owner에 두고 좌·중·우 방 바인딩을 모두 적었는지 대조해 전면 폐합 범위에 빈 owner가 없음을 확인했다.
@evidence principles/core/common.md#substantive-completion 삼각 벽 높이를 F의 아래면에서 읽고 정면에 삼각 판을 겹쳐 박공처럼 보이게 하는 방식을 금지하는 전면 폐합 규칙을 정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 박공 삼각 벽 높이를 F의 아래면에서 읽고 정면에 삼각 판을 겹치지 않는다는 본문 규칙이 다음 층이 전면 박공 폐합 방식을 새로 정하지 않아도 될 만큼 결정적인지 확인했다.
@evidence principles/core/common.md#declared-basis 외곽은 main-building-extent, 박공 배정과 F 아래면은 roof-mass-allocation·roof-profile-datums, 벽 두께 상단은 roof-wall-head-junctions에서 받는다고 링크로 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 본문의 main-building-extent·roof-mass-allocation·roof-profile-datums·roof-wall-head-junctions 링크를 외곽·박공 배정·F 아래면·벽 두께 상단 진술에 하나씩 대응시켜 근거 추적이 끊기지 않음을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "각 박공은 실제 삼각 벽"이라는 설정을 전면 벽 두께 안의 폐합과 거실·올리브 침실·현관·계단 창·청회색 침실·서비스 띠의 구간 배정으로 바꾼다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 main-mass의 '각 박공은 실제 삼각 벽'에 대해 본문이 전면 벽 두께 안 폐합과 좌·중·우 구간의 방 배정이라는 spaces 층 결정을 더했는지 대조해 부모 재진술이 아님을 확인했다.
@evidence principles/design/spaces.md#space-topology 전면 벽이 왼쪽 거실/올리브 침실, 가운데 현관문/계단 창, 오른쪽 청회색 침실/서비스 띠를 감싸고 차고문은 본채 방에 묶지 않는 포함 관계를 정한다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 본문의 왼쪽 거실/올리브 침실, 가운데 현관문/계단 창, 오른쪽 청회색 침실/서비스 띠 배정과 차고문 비바인딩을 대조해 전면 벽의 포함 관계가 메시 없이 복원됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 벽 두께·지붕 아래면·앞 모서리와 단차 벽의 단일 몸체를 모두 원래 owner에서 소비하고 다른 입면의 완결 마감을 전면 파일에서 복제하지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 본문이 앞 모서리·차고 공유 벽·단차 벽의 단일 몸체를 exterior-boundary-junctions에서 소비하고 다른 입면 마감을 복제하지 않는지 대조해 전면 폐합에 이중 저작 경계가 없음을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 정면 전체·두 전면 모서리·삼각 벽/처마 아래 단면에서 계단의 작은 창이 박공 골짜기나 포치 접합에 잘리는지를 반증 주소로 둔다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 본문이 정면 전체·두 전면 모서리·삼각 벽/처마 아래 단면과 모든 실제 개구부를 검사 주소로 두고 계단 창이 박공 골짜기·포치 접합에 잘리면 실패로 적었는지 확인했다.
@evidence settings/10-house.md#main-mass 정면 왼쪽의 전방을 향한 큰 박공을 실제 삼각 벽으로 전면 벽 두께 안에서 닫고 판 하나로 대체하지 않는다.
@evidenceReview settings/10-house.md#main-mass #edcb5ab main-mass의 '정면 왼쪽 전방 큰 박공은 실제 삼각 벽'을 본문의 F 아래면까지 오르는 박공 삼각 벽과 기존 외벽 예약 두께 사용에 대조해 판 하나로 대체하지 않음을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work main-mass의 왼쪽 전방 박공·처마 0.35–0.50 m 범위와 house-scale의 "전면 박공의 얕은 돌출만 허용"을 전면 벽 폐합에 적용했고 삼각 벽을 기존 벽 두께 안에서 닫을 수 있어 부모를 고칠 필요가 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 main-mass의 왼쪽 전방 박공과 house-scale 외곽을 본문의 '같은 외곽에서 닫히는' 왼쪽 박공·기존 외벽 예약 두께에 대조해 전면 폐합이 부모 수정 없이 성립함을 확인했다.
-->

전면 전체 입면 owner는 `src/spaces/envelope/front.ts`다. [본채 전면](../00-building.md#main-building-extent)의 벽과 [왼쪽 박공](../roof/00-junctions.md#roof-mass-allocation)은 [같은 외곽](../../settings/10-house.md#house-scale)에서 닫힌다. 박공 삼각 벽의 높이는 [F의 아래면](../roof/00-junctions.md#roof-profile-datums)에서 읽고, 나머지 전면은 주/낮은 지붕의 해당 외벽선 아래면까지 이어진다. 정면에 삼각 판을 별도로 겹쳐 박공처럼 보이게 하지 않는다. 정면 벽의 실제 두께는 기존 외벽 예약을 사용한다.

위 입면의 외측 높이와 [벽 두께 전체의 상단](../roof/00-junctions.md#roof-wall-head-junctions)을 구별한다. 박공 교차선과 높은/낮은 지붕 분할을 벽 두께 안에서도 유지하고, [앞 모서리·차고 공유 벽·단차 벽의 단일 몸체](../07-boundary-assembly.md#exterior-boundary-junctions)를 소비한다. 다른 입면의 완결 마감까지 전면 파일에서 복제하지 않는다.

왼쪽은 [거실](../rooms/living.md#living-plan)과 [올리브 침실](../rooms/bedroom-two.md#bedroom-two-plan), 가운데는 [현관문](../rooms/entry.md#entry-plan)과 [계단 창](../02-stair.md#stair-floor-opening), 오른쪽은 [청회색 침실](../rooms/bedroom-three.md#bedroom-three-plan)과 서비스 띠에 각각 바인딩한다. 포치가 거실창과 현관문을 덮는 관계는 [포치 지붕](../porch.md#porch-roof-columns)이 소유한다. 차고 정면 역시 같은 완결 입면 owner가 소비하되 차고문을 본채 방에 바인딩하지 않는다.

아래 [개구부 배치](#front-openings)는 포치 벽 접합 위와 주/낮은 지붕 처마 아래에 남는 외벽을 소비한다. 특히 계단의 작은 창이 박공 골짜기·포치 접합에 잘리거나, 방 없이 입면에만 붙으면 실패다. 검사 주소는 정면 전체와 두 전면 모서리, 각 삼각 벽/처마 아래 단면 및 모든 실제 개구부다. 실제 void·문틀/창틀과 전체 형상·재료·GPU 프레임은 unverified다.

## 거실·침실·계단의 창과 현관문 {#front-openings}
<!--
@evidence principles/core/common.md#scope-preservation 거실의 세 칸 창, 상층 두 침실 창, 작은 계단 창의 위계와 파우더룸·서비스 접근 전면에 창을 두지 않는 결정까지 본채 전면 벽의 창 배치를 맡고, 현관문 void는 entry-plan, 차고문은 garage-front-opening에 남긴다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 본문이 거실 세 칸·상층 두 침실 두 칸·작은 계단 창 위계와 파우더룸·서비스 접근 전면의 무창 결정을 맡고 현관문 void는 entry-plan, 차고문은 garage-front-opening에 넘기는지 확인했다.
@evidence principles/core/common.md#substantive-completion 본채 전면 벽의 두께 방향 Z = [-0.25, 0] m를 그 벽 창들의 관통 구간으로 정하고 각 창을 자기 방/계단에 하나씩 바인딩한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 본채 전면 벽의 Z = [-0.25, 0] m 관통 구간과 '아래 창들은 각각 자기 방/계단에 바인딩' 문장을 대조해 창 배치 H2가 두께 구간과 소속 규칙을 모두 확정함을 확인했다.
@evidence principles/core/common.md#declared-basis 창의 위계는 01에서 채택했고 벽 두께 구간은 링크한 본채 외곽의 외벽 예약에서 받았으며 치수는 방 폭·지붕·포치 여유에서 저작 선택했다고 근거를 구별한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 본문의 '위계를 01에서 채택', 본채 외곽 링크의 0.25 m 외벽 예약, '치수는 방 폭·지붕·포치 여유에서 선택'을 대조해 채택·파생·저작 선택의 근거가 구별됨을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation openings 설정의 넓은 묶음창·침실 창들·더 작은 계단 창의 위계를 어느 방의 몇 칸 창인지와 창이 없는 전면 구간으로 확정한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 openings의 묶음창/침실 창/작은 계단 창 위계를 본문이 거실 세 칸·두 침실 두 칸·작은 계단 창과 파우더룸·서비스 접근의 무창 구간으로 확정했는지 대조해 새 결정을 확인했다.
@evidence principles/design/spaces.md#space-topology 각 전면 창이 거실·상층 두 침실·계단 가운데 자기 공간의 외벽에 속하고 파우더룸과 서비스 접근의 전면은 창을 추가하지 않은 벽으로 남는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 본문의 거실·상층 두 침실·계단 소속 창과 파우더룸·서비스 접근의 창 없는 전면을 대조해 본채 전면 벽의 각 구간이 어느 공간의 외벽인지 복원됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 본채 전면 벽의 Z = [-0.25, 0] m를 링크한 본채 외곽의 Z = 0 m 바깥 면과 0.25 m 외벽 예약에서 받고, 창틀은 06 공통 인계, 현관문 void는 entry owner, 차고문은 garage-front-opening에 두어 창 배치 밖의 경계를 다시 정하지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 Z = [-0.25, 0] m가 본채 외곽 Z = 0 m 바깥 면과 0.25 m 외벽 예약에서 유도되고 창틀은 06, 현관문 void는 entry owner로 링크되는지 대조해 이 H2가 경계를 재정의하지 않음을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 입면과 방 내부 양쪽의 창 위계·밝기를 실제 프레임의 비교 대상으로 남긴다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 본문이 전면 창 위계·밝기를 입면/방 내부 양쪽 실제 프레임의 비교 대상으로 남기고 unverified로 표시했는지 확인해 거실·침실·계단 창 위계의 반증 관찰이 있음을 확인했다.
@evidence settings/10-house.md#openings 전면 거실의 넓은 묶음창, 상층 침실 창들, 계단/복도용의 더 작은 창이라는 위계를 본채 전면 벽의 실제 방 바인딩으로 나눈다.
@evidenceReview settings/10-house.md#openings #5663f6c openings의 '전면 거실 넓은 묶음창, 상층 침실 창들, 더 작은 계단/복도 창'을 본문의 거실 세 칸·두 침실 두 칸·작은 계단 창 바인딩에 대조해 위계가 방별로 나뉨을 확인했다.
@evidence obligations/design/spaces.md#space-envelope-interface 본채 전면 벽의 창을 아래 창 H2마다 거실·상층 두 침실·계단 가운데 자기 방/계단 하나에 바인딩해 외부 창 위계와 방 배치가 서로 다른 집을 묘사하지 않게 한다.
@evidenceReview obligations/design/spaces.md#space-envelope-interface #4b397de 본문의 '아래 창들은 각각 자기 방/계단에 바인딩'과 거실·두 침실·계단 창 H2 링크를 대조해 전면 창 위계와 실내 방 배치가 같은 본채 전면 벽을 공유함을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work openings의 "창을 배정한 방과 그 창을 품은 외벽이 같아야 한다"와 01의 전면 위계를 전면 방 배치에 대조했고 파우더룸 전면을 창 없이 닫아도 설정 요구와 충돌하지 않았다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 openings의 방-외벽 일치 조건을 본문의 방/계단별 바인딩과 파우더룸·서비스 접근 전면의 무창 결정에 대조해 설정 요구와 충돌 없이 부모 수정이 불필요함을 확인했다.
-->

[공통 개구부 인계](../06-openings.md#external-opening-interface)를 적용한다. 본채 전면 벽의 두께 방향은 [본채 외곽](../00-building.md#main-building-extent)의 Z = 0 m 바깥 면에서 0.25 m 외벽 예약만큼 들어온 Z = [-0.25, 0] m다. 아래 창들은 각각 자기 방/계단에 바인딩한다. 거실의 넓은 세 칸 창, 상층 두 침실의 두 칸 창과 작은 계단 창의 위계를 01에서 채택했으며 치수는 방 폭·지붕·포치 여유에서 선택했다. 파우더룸과 서비스 접근의 전면에는 창을 추가하지 않는다. 제목의 현관문은 void를 [현관](../rooms/entry.md#entry-plan)에 남기고 외부 충전만 [목재 현관문](#front-entry-filling)이 맡으며, 차고문은 [닫힌 차고문](#garage-front-opening)이 맡는다. 입면/방 내부 양쪽의 창 위계·밝기는 실제 프레임에서 unverified다.

## 포치 아래 거실 묶음창 {#living-front-window}
<!--
@evidence principles/core/common.md#scope-preservation 거실 전면 묶음창 하나의 void, 수직 세 칸 분할, 포치 보와의 높이 관계를 모두 이 H2가 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 본문이 living-front-window 한 void와 수직 세 칸, 위 trim과 포치 보 높이 관계를 모두 이 H2에서 다루는지 대조해 거실 묶음창 범위에 빈 owner가 없음을 확인했다.
@evidence principles/core/common.md#substantive-completion 전면 벽의 X = [-5.10, -2.30], Y = [0.70, 2.30] m 개구부와 수직 창 세 칸을 확정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 본문의 X = [-5.10, -2.30], Y = [0.70, 2.30] m 개구부와 공통 창틀 예약 안 수직 세 칸이 거실 묶음창의 위치·크기·분할을 다음 층이 새로 정할 필요 없이 확정함을 확인했다.
@evidence principles/core/common.md#declared-basis 넓은 창 위계는 01에서, 창틀은 공통 창틀 예약에서, 벽 구간은 front-openings에서 받고 living-room 소속은 living-plan 링크로 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb living-front-window의 넓은 창 위계(01), 공통 창틀 예약, 전면 벽 구간(front-openings), living-plan 소속 링크를 본문 문장마다 대응시켜 근거가 추적됨을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "01의 넓은 전면 창은 이 거실의 외벽에 실제로 속한다"를 living-room 소속의 좌표·칸 수로 만든다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 living의 '넓은 전면 창은 거실 외벽에 속한다'에 대해 본문이 X = [-5.10, -2.30] m 좌표와 세 칸 분할을 더했는지 대조해 설정 재진술을 넘는 spaces 결정을 확인했다.
@evidence principles/design/spaces.md#space-topology 창을 ground-storey의 living-room 전면 외벽에 속하게 하고 포치 지붕 아래에 놓는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 본문의 'ground-storey의 living-room에 속한다'와 포치 지붕이 덮는 전면 벽 구간 진술을 대조해 X = [-5.10, -2.30] m 창의 소속과 포치 아래 관계가 복원됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 벽 두께와 창틀 깊이는 front-openings·external-opening-interface에서, 창을 덮는 관계와 포치 보 높이는 porch-roof-columns에서 받는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 living-front-window의 벽 두께·창틀 깊이를 front-openings·external-opening-interface, 포치 보 높이를 porch-roof-columns 링크로 받고 그 값을 재기록하지 않음을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 같은 void가 거실 안쪽과 일치하는지, 포치 기둥이 묶음창을 가리는지를 기둥/보/창틀을 함께 검사한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 본문이 거실 안쪽 void 일치, 포치 기둥의 묶음창 가림, 위 trim과 포치 보를 기둥/보/창틀과 함께 검사할 대상으로 적고 실제 깊이/그림자를 unverified로 남겼는지 확인했다.
@evidence settings/10-house.md#living 거실 외벽에 실제로 속하는 넓은 전면 창을 이 개구부 하나로 실현한다.
@evidenceReview settings/10-house.md#living #a70aad2 living의 거실 외벽 넓은 전면 창 요구를 본문의 living-room 소속 X = [-5.10, -2.30], Y = [0.70, 2.30] m 세 칸 묶음창 하나에 대조해 요구가 이 void로 실현됨을 확인했다.
@evidence settings/10-house.md#porch-entry 포치가 왼쪽 거실창을 덮는 관계 때문에 위 trim과 포치 보 높이를 함께 검사 대상으로 둔다.
@evidenceReview settings/10-house.md#porch-entry #a9f9880 porch-entry의 '포치가 왼쪽 거실창을 덮는다'를 본문의 포치 지붕이 덮는 전면 벽 구간과 위 trim·포치 보 높이 근접 진술에 대조해 거실 묶음창이 함께 검사됨을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work living의 넓은 전면창 소속과 porch-entry의 거실창·현관문을 함께 덮는 포치, 유효 깊이 1.6–2.0 m를 대조했고 창이 포치 아래 전면 벽에 들어가 부모 수정이 필요 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 living의 넓은 전면창 소속과 porch-entry의 거실창 덮개를 본문의 포치 아래 X = [-5.10, -2.30] m 세 칸 창에 대조해 두 설정이 함께 성립하고 부모 수정이 불필요함을 확인했다.
-->

`living-front-window`는 [전면 벽](#front-openings)의 X = [-5.10, -2.30], Y = [0.70, 2.30] m 개구부로 ground-storey의 [living-room](../rooms/living.md#living-plan)에 속한다. [공통 창틀 예약](../06-openings.md#external-opening-interface) 안의 수직 창 세 칸이며 01의 넓은 창 위계를 맡는다. 이 창은 [포치 지붕](../porch.md#porch-roof-columns)이 덮는 전면 벽 구간에 있고, 위 trim은 그 owner의 포치 보 아래와 높이가 가까워 기둥/보/창틀을 함께 검사한다. 같은 void가 거실 안쪽과 일치하는지, 포치 기둥이 묶음창을 가리는지와 실제 깊이/그림자는 unverified다.

## 왼쪽 자녀실의 정면 창 {#bedroom-two-front-window}
<!--
@evidence principles/core/common.md#scope-preservation bedroom-two의 전면 벽 창 하나와 그 위/아래 trim·두 지붕의 단면 관계를 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 본문이 bedroom-two-front-window 한 창과 위/아래 trim·두 지붕 단면 관계를 모두 다루는지 대조해 올리브 침실 전면 창 범위에 빈 owner가 없음을 확인했다.
@evidence principles/core/common.md#substantive-completion 전면 벽의 X = [-4.80, -2.70], Y = [3.91, 5.31] m 개구부와 수직 창 두 칸을 정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 본문의 X = [-4.80, -2.70], Y = [3.91, 5.31] m 개구부와 공통 인계의 수직 두 칸이 bedroom-two 창의 위치·크기·분할을 확정해 다음 층이 새로 정할 결정이 없음을 확인했다.
@evidence principles/core/common.md#declared-basis 창 형식은 공통 인계, 위 한계는 roof-profile-datums의 F 아래면, 아래 한계는 porch-roof-columns의 포치 벽 접합에서 받는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb bedroom-two-front-window의 공통 인계 창 형식, 위 한계 F 아래면(roof-profile-datums), 아래 한계 포치 벽 접합(porch-roof-columns) 링크를 본문에서 찾아 근거가 구별됨을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation bedroom-two의 "자기 외벽 창"을 전면 박공 아래·포치 벽 접합 위의 X = [-4.80, -2.70], Y = [3.91, 5.31] m 수직 두 칸 창으로 정한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 bedroom-two의 '자기 외벽 창'에 대해 본문이 전면 박공 아래·포치 벽 접합 위 X = [-4.80, -2.70] m 두 칸 창이라는 위치 결정을 더했는지 대조해 부모 재진술이 아님을 확인했다.
@evidence principles/design/spaces.md#space-topology 창을 upper-storey bedroom-two의 전면 벽, 전면 박공 아래에 바인딩하고 장식용 가짜 창을 금지한다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 본문의 'upper-storey의 bedroom-two에 속한다', F 아래·포치 접합 위 위치, '장식용 가짜 창이 아니다'를 대조해 X = [-4.80, -2.70] m 창의 방 소속이 복원됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority F 아래면은 roof-profile-datums, 포치 벽 접합은 porch-roof-columns에서 소비하고 창 좌표는 이 H2가 소유한다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 bedroom-two 창 Y = [3.91, 5.31] m의 위·아래 한계를 roof-profile-datums의 F 아래면과 porch-roof-columns 벽 접합 링크로 소비하고 창 좌표만 이 H2가 소유함을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 창 위/아래 trim과 두 지붕의 단면, 침대/책상에서의 창 접근을 반증 관찰로 둔다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 본문이 bedroom-two 창 위/아래 trim과 두 지붕의 단면, 침대/책상에서의 창 접근을 unverified 관찰로 적었는지 확인해 전면 박공 아래 창 배치를 반증할 주소가 있음을 확인했다.
@evidence settings/10-house.md#bedroom-two 한 자녀의 독립 침실이 갖는 자기 외벽 창을 전면 박공 아래 두 칸 창으로 실현한다.
@evidenceReview settings/10-house.md#bedroom-two #7ee9cb2 bedroom-two의 '자기 외벽 창'을 본문의 upper-storey bedroom-two 소속 X = [-4.80, -2.70], Y = [3.91, 5.31] m 두 칸 창에 대조해 전면 박공 아래 방 창으로 실현됨을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work bedroom-two의 자기 외벽 창과 main-mass의 전면 박공을 창 높이에 적용했고 Y = [3.91, 5.31] m가 두 지붕 사이에 들어가 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 bedroom-two의 자기 외벽 창과 main-mass 전면 박공을 본문의 F 아래면 아래·포치 벽 접합 위 Y = [3.91, 5.31] m 창에 대조해 두 지붕 사이에 들어가 부모 수정이 불필요함을 확인했다.
-->

`bedroom-two-front-window`는 [전면 벽](#front-openings)의 X = [-4.80, -2.70], Y = [3.91, 5.31] m 개구부로 upper-storey의 [bedroom-two](../rooms/bedroom-two.md#bedroom-two-plan)에 속한다. [공통 인계](../06-openings.md#external-opening-interface)에 따른 수직 창 두 칸이다. [지붕군](../../settings/10-house.md#main-mass)의 [전면 박공 F의 아래면](../roof/00-junctions.md#roof-profile-datums) 아래, [포치 지붕의 벽 접합](../porch.md#porch-roof-columns) 위의 방 창이며 장식용 가짜 창이 아니다. 창 위/아래 trim과 두 지붕의 단면, 침대/책상에서 창 접근과 실제 프레임은 unverified다.

## 층간 계단실의 작은 창 {#stair-front-window}
<!--
@evidence principles/core/common.md#scope-preservation 상층 높이에 있지만 계단실에 속하는 작은 전면 창 하나와 그 소속 공간을 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 본문이 상층 높이의 stair-front-window 한 창과 그 main-stair 층간 공간 소속을 모두 다루는지 대조해 계단 전면 창 범위에 빈 owner가 없음을 확인했다.
@evidence principles/core/common.md#substantive-completion 전면 벽의 X = [-1.62, -0.84], Y = [4.11, 5.21] m 개구부를 작은 수직 고정창 한 칸으로 정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 본문의 X = [-1.62, -0.84], Y = [4.11, 5.21] m 개구부와 작은 수직 고정창 한 칸이 계단 창의 위치·크기·형식을 확정해 다음 층이 새로 정할 결정이 없음을 확인했다.
@evidence principles/core/common.md#declared-basis main-stair 층간 공간의 소속은 stair-floor-opening에서, 작은 수직 고정창 형식은 공통 인계에서 받는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb stair-front-window의 소속을 stair-floor-opening 링크, 작은 수직 고정창 형식을 공통 인계 링크에서 받는다는 본문 문장을 대조해 두 근거가 구별됨을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 계단/복도용 더 작은 창을 복도가 아닌 ground-storey 소속 main-stair 층간 공간에 바인딩하는 결정을 더한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 openings의 계단/복도용 작은 창에 대해 본문이 복도가 아닌 ground-storey 소속 main-stair 층간 공간에 X = [-1.62, -0.84] m 창을 바인딩한 결정을 더했는지 확인했다.
@evidence principles/design/spaces.md#space-topology 창을 main-stair의 층간 공간에 속하게 하고 별도 복도/침실 바인딩이나 존재하지 않는 2층 바닥의 추가를 금지한다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 본문의 'main-stair의 층간 공간에 속한다'와 별도 복도/침실 바인딩·없는 2층 바닥 추가 금지를 대조해 상층 높이 계단 창의 소속이 모호하지 않게 복원됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 계단 구멍과 계단실 경계는 02-stair가 소유하고 이 H2는 창 void만 저작한다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 본문이 계단실 경계를 stair-floor-opening 링크에 두고 창 void만 적는지 대조했고, X = [-1.62, -0.84] m가 그 owner의 구멍 세로 부분 X = [-1.80, -0.65] 안에 듦을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 창 폭/trim과 계단실 경계의 일치, 위 박공 골짜기와 아래 포치 접합의 단면, 05의 밝은 계단참 읽힘을 반증 관찰로 둔다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 본문이 계단 창 폭/trim과 계단실 경계 일치, 위 박공 골짜기·아래 포치 접합 단면, 05의 밝은 계단참 읽힘을 unverified 관찰로 적었는지 확인했다.
@evidence settings/10-house.md#openings 상층 전면의 침실 창보다 작은 계단용 창으로 위계를 만든다.
@evidenceReview settings/10-house.md#openings #5663f6c openings의 더 작은 계단/복도 창 위계를 본문의 X = [-1.62, -0.84] m 한 칸 고정창과 형제 침실 창 X = [-4.80, -2.70] m 두 칸에 대조해 작은 계단 창 위계가 성립함을 확인했다.
@evidence settings/10-house.md#stair 상층 높이의 계단 창을 main-stair의 층간 공간에 바인딩하고 별도 복도/침실 바인딩이나 존재하지 않는 2층 바닥을 덧붙이지 않는다.
@evidenceReview settings/10-house.md#stair #170ce55 stair의 '별도 계단·사다리·복층 보이드는 없다'를 본문의 상층 높이 창을 main-stair 층간 공간에 두고 2층 바닥을 덧붙이지 않는 결정에 대조해 단일 계단 조건 유지를 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work openings의 작은 계단/복도 창 위계와 stair의 "별도 계단·사다리·복층 보이드는 없다"를 대조했고 창을 계단실에 두어도 두 조건이 함께 성립해 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 openings의 작은 계단/복도 창 위계와 stair의 단일 계단·보이드 금지를 본문의 main-stair 층간 소속 한 칸 창에 대조해 둘이 함께 성립하고 부모 수정이 불필요함을 확인했다.
-->

`stair-front-window`는 [전면 벽](#front-openings)의 X = [-1.62, -0.84], Y = [4.11, 5.21] m 개구부다. [공통 인계](../06-openings.md#external-opening-interface)에 따른 작은 수직 고정창 한 칸이며 상층 높이지만 ground-storey 소속 [main-stair의 층간 공간](../02-stair.md#stair-floor-opening)에 속한다. 별도 복도/침실에 바인딩하거나 존재하지 않는 2층 바닥을 덧붙이지 않는다. 창 폭/trim과 실제 계단실 경계의 일치, 위 박공 골짜기·아래 포치 접합과의 단면 및 05에서 요구한 밝은 계단참 읽힘은 unverified다.

## 오른쪽 자녀실의 정면 창 {#bedroom-three-front-window}
<!--
@evidence principles/core/common.md#scope-preservation bedroom-three의 전면 창 하나와 낮은 본채 지붕 아래 trim 한계를 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 본문이 bedroom-three-front-window 한 창과 낮은 본채 지붕 아래 위 trim 한계를 모두 다루는지 대조해 청회색 침실 전면 창 범위에 빈 owner가 없음을 확인했다.
@evidence principles/core/common.md#substantive-completion 전면 벽의 X = [2.65, 4.75], Y = [3.91, 5.31] m 개구부와 수직 창 두 칸을 정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 본문의 X = [2.65, 4.75], Y = [3.91, 5.31] m 개구부와 공통 인계 수직 두 칸이 bedroom-three 창의 위치·크기·분할을 확정해 다음 층이 새로 정할 결정이 없음을 확인했다.
@evidence principles/core/common.md#declared-basis 수직 창 형식은 공통 인계, 위 trim 한계는 낮은 본채 지붕 아래면, 벽 구간은 front-openings에서 받는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb bedroom-three-front-window의 수직 창 형식(공통 인계), 위 trim 한계(낮은 본채 지붕 아래면 링크), 벽 구간(front-openings 링크)을 본문에서 찾아 근거가 구별됨을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation bedroom-three의 자기 외벽 창을 전면에 두고 차고 위 측면 창으로 대신하지 않는 위치 결정을 더한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 bedroom-three의 '자기 외벽 창'에 대해 본문이 X = [2.65, 4.75] m 전면 오른쪽에 두고 차고 위 측면 창으로 대신하지 않는 위치 결정을 더했는지 확인했다.
@evidence principles/design/spaces.md#space-topology 창을 upper-storey bedroom-three의 전면 외벽에 바인딩하고 차고 지붕 위 측면 벽으로 옮기지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 본문의 'upper-storey의 bedroom-three에 속한다'와 차고 위 측면 창 배제를 대조해 X = [2.65, 4.75] m 창이 청회색 침실 전면 외벽에 속하는 관계가 복원됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 낮은 본채 지붕 아래면은 roof-profile-datums에서 소비하고 창의 위 trim을 그 아래로 제한하는 결과를 이 H2에 둔다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 본문이 위 trim을 roof-profile-datums의 낮은 본채 지붕 아래면보다 아래에 둔다는 결과만 두고 지붕 높이를 재기록하지 않는지 대조해 bedroom-three 창의 이중 저작이 없음을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 침실 안쪽 reveal, 낮은 처마와 창의 단면, 01 정면 위계를 반증 관찰로 둔다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 본문이 침실 안쪽 reveal, 낮은 처마/창 단면, 01 정면 위계를 unverified 관찰로 적었는지 확인해 X = [2.65, 4.75] m 창 배치를 반증할 주소가 있음을 확인했다.
@evidence settings/10-house.md#bedroom-three 두 번째 자녀 침실의 자기 외벽 창을 전면 오른쪽 두 칸 창으로 실현한다.
@evidenceReview settings/10-house.md#bedroom-three #ed25b92 bedroom-three의 '자기 외벽 창'을 본문의 upper-storey bedroom-three 소속 X = [2.65, 4.75], Y = [3.91, 5.31] m 두 칸 창에 대조해 전면 오른쪽 방 창으로 실현됨을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work bedroom-three의 자기 외벽 창과 main-mass의 본채 오른쪽 더 낮은 지붕을 대조했고 위 trim을 낮은 지붕 아래면 아래에 둘 수 있어 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 bedroom-three의 자기 외벽 창과 main-mass의 오른쪽 낮은 지붕을 본문의 낮은 본채 지붕 아래면보다 아래 둔 위 trim에 대조해 둘이 함께 성립해 부모 수정이 불필요함을 확인했다.
-->

`bedroom-three-front-window`는 [전면 벽](#front-openings)의 X = [2.65, 4.75], Y = [3.91, 5.31] m 개구부로 upper-storey의 [bedroom-three](../rooms/bedroom-three.md#bedroom-three-plan)에 속한다. [공통 인계](../06-openings.md#external-opening-interface)의 수직 창 두 칸이다. 위 trim을 [지붕군](../../settings/10-house.md#main-mass)의 [낮은 본채 지붕 아래면](../roof/00-junctions.md#roof-profile-datums)보다 아래에 남기고 차고 위 측면 창으로 대신하지 않는다. 침실 안쪽 reveal·낮은 처마/창 단면·01 정면 위계의 실제 프레임은 unverified다.

## 목재 현관문의 외부 충전 {#front-entry-filling}
<!--
@evidence principles/core/common.md#scope-preservation 현관문의 외부 충전인 문짝·상부 유리 분할·손잡이 위치와 01/04의 관찰 질문을 함께 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 본문이 front-door 외부 충전의 문짝·상부 유리 분할·손잡이 위치와 01/04 관찰 질문을 모두 이 H2에 두는지 대조해 현관문 충전 범위에 빈 owner가 없음을 확인했다.
@evidence principles/core/common.md#substantive-completion 목재 문짝 상부 유리를 문짝 안에서 세 열·두 행으로 반복 분할하고 검은 손잡이를 경첩 반대편에 두는 구성을 정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 본문의 상부 유리 세 열·두 행 반복 분할과 경첩 반대편 검은 손잡이가 front-door 문짝 구성을 확정해 다음 층이 분할·손잡이 측을 새로 정할 필요가 없음을 확인했다.
@evidence principles/core/common.md#declared-basis front-door의 void·순폭 목표·경첩/열림은 entry-plan에서 그대로 받고, 상부 유리의 세 열·두 행 분할과 경첩 반대편 검은 손잡이는 공통 인계에 따라 이 H2가 정한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 본문이 front-door void·순폭 목표·경첩/열림을 entry-plan 링크 그대로 받고 세 열·두 행 유리와 손잡이 측은 공통 인계에 따른 이 H2의 선택으로 구분하는지 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 포치 설정의 "목재문·유리 상부·어두운 손잡이"를 반복 분할 규칙과 손잡이 측으로 구체화한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 porch-entry의 '목재문·유리 상부·어두운 손잡이'에 대해 본문이 세 열·두 행 반복 분할과 경첩 반대편 손잡이라는 결정을 더했는지 대조해 설정 재진술이 아님을 확인했다.
@evidence principles/design/spaces.md#space-topology front-door가 ground-storey 포치와 현관(entry-plan)을 잇는 연결임을 유지하고 상부 유리를 계단 창이나 별도 현관 바닥과 연결하지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 본문의 'ground-storey의 포치와 현관을 잇는다'와 상부 유리를 계단 창이나 별도 현관 바닥으로 해석하지 않는다는 문장을 대조해 front-door 연결 관계가 복원됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 문 void 좌표를 다시 적지 않고 entry owner로 링크한다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 본문이 front-door void 좌표를 다시 적지 않고 현관 owner(entry-plan)로 링크하는지 대조해 문 void가 이 H2와 entry-plan에서 이중 저작되지 않음을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 01/04의 현관문과 포치 접속, 문틀 깊이·목재/상부 유리·열린 문짝과 손잡이, 문 앞 양방향 통행을 반증 관찰로 둔다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 본문이 01/04의 현관문·포치 접속, 문틀 깊이·목재/상부 유리·열린 문짝과 손잡이, 문 앞 양방향 통행을 unverified 관찰로 적었는지 확인해 현관문 충전의 반증 주소를 확인했다.
@evidence settings/10-house.md#porch-entry 현관의 목재문·유리 상부·어두운 손잡이를 문짝 안의 분할과 손잡이 배치로 구현할 입력으로 만든다.
@evidenceReview settings/10-house.md#porch-entry #a9f9880 porch-entry의 현관 목재문·유리 상부·어두운 손잡이를 본문의 목재 문짝, 세 열·두 행 상부 유리, 경첩 반대편 검은 손잡이에 대조해 세 요소가 모두 대응됨을 확인했다.
@evidence settings/10-house.md#openings 문짝 안에서 검은 손잡이를 경첩 반대편에 두어 경첩측과 손잡이측을 나눈다.
@evidenceReview settings/10-house.md#openings #5663f6c openings의 '문짝·경첩측·손잡이·문틀·문턱이 구별' 요구를 본문의 경첩 반대편 검은 손잡이와 entry-plan에서 받은 경첩/열림에 대조해 경첩측과 손잡이측이 나뉨을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work porch-entry의 "목재문·유리 상부·어두운 손잡이"와 openings의 "문짝·경첩측·손잡이·문틀·문턱이 구별된다"를 entry-plan의 문 void에 대조했고 문짝 안의 세 열·두 행 유리와 경첩 반대편 손잡이로 문짝·손잡이 구성이 성립해 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 porch-entry의 목재문·유리 상부·손잡이와 openings의 문짝 구별 조건을 entry-plan 문 void 위 본문의 세 열·두 행 유리·경첩 반대편 손잡이에 대조해 부모 수정 없이 성립함을 확인했다.
-->

`front-door`의 void·순폭 목표·경첩/열림은 [현관 owner](../rooms/entry.md#entry-plan) 그대로다. ground-storey의 포치와 현관을 잇는다. [공통 인계](../06-openings.md#external-opening-interface)에 따라 목재 문짝 상부 유리는 문짝 안에서 세 열·두 행으로 반복 분할하고 검은 손잡이는 경첩 반대편에 둔다. 이 유리를 계단 창과 연결하거나 별도 현관 바닥으로 해석하지 않는다.

관찰은 01/04의 현관문과 포치 접속, 문틀 깊이·목재/상부 유리·열린 문짝과 손잡이를 포함한다. 실제 부재/void·문 앞 양방향 통행·01/04 비교는 unverified다.

## 닫힌 차고문과 상부 이동 예약 {#garage-front-opening}
<!--
@evidence principles/core/common.md#scope-preservation 차고의 닫힌 분절 패널문, 패널/채광 반복, 안쪽 상부 가이드와 수직 레일 예약, 차도 접합을 모두 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 본문이 garage-front-door의 닫힌 분절 패널문, 네 패널/네 열 채광 반복, 안쪽 상부 가이드와 수직 레일 예약, 차도 접합을 모두 다루는지 대조해 빈 owner가 없음을 확인했다.
@evidence principles/core/common.md#substantive-completion 전면 벽 Z = [-0.55, -0.30] m에 X = [6.10, 11.10], Y = [-0.15, 2.15] m 개구부, 유효 폭 목표 4.80 m, 네 수평 패널과 맨 위 네 열 유리를 정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 본문의 Z = [-0.55, -0.30] m 벽에 X = [6.10, 11.10], Y = [-0.15, 2.15] m 개구부, 유효 폭 목표 4.80 m, 네 수평 패널과 맨 위 네 열 유리가 차고문을 확정함을 확인했다.
@evidence principles/core/common.md#declared-basis 바닥은 ground-threshold-datums의 차고 datum, 차도 상면은 driveway owner에서 받고 패널 높이는 문짝 유효 높이의 균등 분할로 산출한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 본문이 바닥을 ground-threshold-datums 차고 datum, 차도 상면을 driveway-plan 링크에서 받고 패널 높이를 문짝 유효 높이의 균등 분할로 산출한다고 밝혀 근거가 구별됨을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 두 대용 폭의 분절 패널문 하나와 상부 채광 유리를 가운데 기둥 없는 단일 개구부, 네 수평 패널, 가이드/열린 패널 예약 X = [6.00, 11.20], Z = [-3.40, -0.55], Y = [2.15, 2.50] m와 양 끝 수직 레일 띠로 바꾼다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 garage의 두 대 폭 패널문·상부 유리에 대해 본문이 가운데 기둥 없는 단일 개구부, 가이드 예약 X = [6.00, 11.20], Z = [-3.40, -0.55] m와 0.16 m 레일 띠를 더했는지 확인했다.
@evidence principles/design/spaces.md#space-topology garage-front-door를 garage 전면 벽에 두고 차도와 문턱 바닥에서 접하게 하며 기본 닫힘에서 내부 관찰은 머드룸을 통하게 한다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 본문의 garage 전면 벽 위치, 차도 상면과 문턱 바닥·바깥 벽면의 접합, 기본 닫힘과 머드룸 경유 검사를 대조해 garage-front-door의 내외부 연결이 복원됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 차고 바닥 datum과 차도 상면은 원래 owner에서 소비하고 패널 수와 반복을 외벽의 별도 opening 수로 세지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 본문이 차고 datum과 차도 상면을 링크 owner에서 소비하고 네 패널 반복을 외벽의 별도 opening 수로 세지 않는다고 적었는지 대조해 차고문 경계의 이중 저작이 없음을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 열린 패널 순높이, 곡선 레일의 이동/간섭, 상부 예약과 천장/보/수납의 대조, 빈 차고의 읽힘을 반증 관찰로 둔다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 본문이 열린 패널 순높이, 곡선 레일의 이동/간섭, X = [6.00, 11.20] m 상부 예약과 차고 천장/보/수납의 대조, 빈 차고의 읽힘을 unverified 관찰로 적었는지 확인했다.
@evidence settings/10-house.md#garage 두 대용 폭 분절 패널문 하나·상부 채광 유리·문 레일/상부 구조와 닫힌 기준 상태를 개구부와 이동 예약으로 만든다.
@evidenceReview settings/10-house.md#garage #261be15 garage의 두 대 폭 분절 패널문 하나·상부 채광 유리·문 레일/상부 구조·닫힌 기준 상태를 본문의 단일 개구부, 네 열 유리, 가이드/레일 예약, 기본 닫힘에 대조해 모두 대응됨을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work garage의 외곽 폭 5.8–6.4 m 범위, 문 하나·상부 유리·레일, "문을 임시 제거한 외부 view로 완성을 주장하지 않는다"를 X = [6.10, 11.10] m 개구부와 레일 예약에 적용했고 모두 함께 성립해 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 garage의 문 하나·상부 유리·레일과 문 제거 view 금지를 본문의 X = [6.10, 11.10] m 개구부·X = [6.00, 11.20] m 예약·머드룸 경유 검사에 대조했고 차고 외곽 X = [5.50, 11.70] m 안에서 성립함을 확인했다.
-->

`garage-front-door`는 [차고](../rooms/garage-interior.md#garage-interior-plan)의 전면 벽 Z = [-0.55, -0.30] m에 X = [6.10, 11.10], Y = [-0.15, 2.15] m의 거친 개구부로 택한다. 바닥은 [차고 datum](../01-storeys.md#ground-threshold-datums)이고 최종 유효 폭 목표는 4.80 m, 높이는 2.15 m다. 두 대 폭의 분절 패널문 하나이며 가운데 고정 기둥이나 두 개의 독립 문으로 나누지 않는다. [차도 상면](../site/driveway.md#driveway-plan)은 이 문턱 바닥과 바깥 벽면에서 접하며 실제 void/문틀 뒤의 접합은 unverified다.

닫힌 문은 네 수평 패널로 나누며 높이는 전체 문짝의 유효 높이에서 같은 간격으로 산출한다. 맨 위 패널 안의 채광 유리는 네 열로 반복 배치하고 나머지 패널에는 불투명한 사각 분절을 둔다. 실제 frame·패널 두께·레일·곡선 가이드의 geometry는 후속 부재가 소유한다. 패널 수와 반복을 외벽의 별도 opening 수로 잘못 보고하지 않는다.

문 안쪽 상부의 가이드/열린 패널 예약은 X = [6.00, 11.20], Z = [-3.40, -0.55], Y = [2.15, 2.50] m다. 양쪽 수직 레일은 이 X 범위의 양 끝 0.16 m 띠, Z = [-0.72, -0.55] m에서 차고 바닥부터 상부 예약까지 이어진다. 이 전체 점유를 차고 천장/보/수납과 대조한다. 머드룸 문 앞 바닥까지 상부 문을 밀어 넣지 않는다. 문은 기본 닫힘이며 머드룸을 통해 검사한다. 실제 열린 패널 순높이·곡선 레일의 이동/간섭·빈 차고의 읽힘은 unverified다.

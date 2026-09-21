# 완결 시각 표면의 소유 분해

## 입면·지붕·층의 소유 {#exterior-surface-handoff}

[완결 표면 계약](../contracts/surface-ownership.md#whole-surface-owner)을 첫 소스 저작 전에 적용한다. 아래 표는 이번 draft에서 작성할 소스 파일의 책임을 예약한다. 담당 저작자는 모두 이 production의 `/root`다. 다른 저작자에게 위임하려면 완결 면 하나를 통째로 넘기며 같은 면의 부재·반복·마감을 따로 넘기지 않는다. 현재는 source 파일이 아직 없어 파일 배정 의도이며, 실제 surface id·면 개수·누락/중복 census를 완료한 선언이 아니다.

| 완결 면 또는 공유 경계 | 소스 파일 owner | 책임과 접합 |
| --- | --- | --- |
| 전면 전체 입면 | `src/spaces/envelope/front.ts` | [본채 박공 삼각 벽·포치 접점·차고 정면](envelope/front.md#front-roof-closures). 거실/상층 창과 현관/차고문은 실제 방/벽 binding에서 받는다. |
| 후면 전체 입면 | `src/spaces/envelope/rear.ts` | [본채 지붕 단차·차고 뒤 처마 아래의 후벽](envelope/rear.md#rear-roof-closures), 공용부 정원 출입과 상층 창. 테라스 때문에 벽을 숨기지 않는다. |
| 왼쪽 전체 입면 | `src/spaces/envelope/left.ts` | [주 지붕 삼각 벽](envelope/left.md#left-roof-closure)과 [벽난로/굴뚝 접면](envelope/left.md#chimney-roof-interface), 창 둘레. |
| 오른쪽 노출 입면 전체 | `src/spaces/envelope/right.ts` | [본채 지붕 단차·오른쪽 박공·차고 박공과 벽 접합](envelope/right.md#right-roof-closures). 가려진 공유 벽과 노출 면을 구별한다. |
| 본채/차고 공유 벽체 | `src/spaces/garage.ts` | 구조 기준 한 개와 머드룸 문 void. 두 실 안쪽 면의 owner는 각 실이다. |
| 주 지붕 전방 경사면과 하부 | `src/spaces/roof/main-front.ts` | 전면 박공과 합류하는 골짜기 경계를 공유 지붕 교차 계산에서 받는다. |
| 주 지붕 후방 경사면과 하부 | `src/spaces/roof/main-back.ts` | 주 용마루·후면 처마와 마감 경계를 소유한다. |
| 전면 왼쪽 박공의 왼쪽 경사면·하부 | `src/spaces/roof/front-gable-left.ts` | 삼각 전면 벽과 왼쪽 처마·주 지붕 합류선. |
| 전면 왼쪽 박공의 오른쪽 경사면·하부 | `src/spaces/roof/front-gable-right.ts` | 현관 쪽 골짜기·처마·용마루 접점. |
| 본채 오른쪽 낮은 박공 전방 면·하부 | `src/spaces/roof/right-front.ts` | 높은 주 지붕과 낮은 우측 지붕의 단차 경계. |
| 본채 오른쪽 낮은 박공 후방 면·하부 | `src/spaces/roof/right-back.ts` | 오른쪽 박공 삼각 벽과 후방 처마 접점. |
| 차고 지붕 전방 면·하부 | `src/spaces/roof/garage-front.ts` | 차고 정면과 본채 접합의 닫힌 경계. |
| 차고 지붕 후방 면·하부 | `src/spaces/roof/garage-back.ts` | 차고 후벽·본채 접면과 처마. |
| 낮은 포치 지붕·하부 | `src/spaces/porch.ts` | [보·기둥·받침](porch.md#porch-roof-columns)과 [바닥/현관 접근](porch.md#porch-platform-access)을 함께 소유한다. |
| 본채 1층 바닥 구조 바탕 | `src/spaces/floors/ground.ts` | [연속 바탕](10-ground-floor.md#main-ground-floor-base)과 [문 아래 지지](10-ground-floor.md#ground-threshold-junctions)를 받는다. 보이는 방 마감은 각 room, 문턱은 원래 문 owner가 맡고 층간 구조/1층 천장을 중복 생성하지 않는다. |
| 차고의 낮은 바닥 바탕 | `src/spaces/garage.ts` | [독립 차고 바탕](10-ground-floor.md#garage-ground-floor-base)과 전면문 아래 지지. 노출 콘크리트 상면은 garage-interior, 머드룸의 높은 문턱/챌면은 laundry owner다. |
| 본채 층간 구조와 2층 천장 바탕 | `src/spaces/floors/upper.ts` | [단일 층간 구조](08-floor-assembly.md#interstorey-floor-boundary)와 같은 계단 구멍·상부 도착. [최상부 천장 바탕](09-ceiling-assembly.md#upper-ceiling-closure)에는 층간 구멍을 복제하지 않는다. 보이는 바닥/천장 마감은 각 방 owner다. |
| 차고의 독립 천장 바탕 | `src/spaces/garage.ts` | [차고 천장](09-ceiling-assembly.md#garage-ceiling-closure)의 구조/벽 접점. 보이는 전체 천장 마감은 garage-interior owner다. |
| 단일 L형 계단과 보호 경계 | `src/spaces/stair.ts` | 두 flight·중간참·도착·난간의 동일 기준과 [계단실 위 높은 천장 마감](09-ceiling-assembly.md#upper-ceiling-closure). |
| 현관 보행길과 차도까지의 연결로 전체 | `src/spaces/site/front-walk.ts` | [T자 보행면](site/front-walk.md#front-walk-plan)은 포치 아래 대기를 포함한다. 포치는 그 대기를 요구하고 별도 바닥을 생성하지 않는다. |
| 차고 앞 차도 전체 | `src/spaces/site/driveway.ts` | [차도 상면](site/driveway.md#driveway-plan)은 차고 문턱과 전면 포장 끝을 연결하고 보행 연결로의 높이 입력을 제공한다. |
| 정원 테라스·외부 단·아래 대기 | `src/spaces/site/terrace.ts` | [테라스](site/terrace.md#garden-terrace-plan)는 정원문 바깥 대기를 포함하며 [단과 아래 대기](site/terrace.md#garden-steps-plan)를 통해 지표로 나간다. |
| 차도에서 테라스 아래까지의 측면 관리 보행면 전체 | `src/spaces/site/side-walk.ts` | [세 띠의 연속 보행면](site/side-walk.md#side-walk-plan)과 경사 접속·gate 양쪽 대기를 통째로 소유한다. |
| 목재 울타리 전체와 측면 문·기둥 | `src/spaces/site/fence.ts` | [건물 양끝에 닿는 전체 선](site/fence.md#fence-enclosure-plan)과 [문/잔여 패널](site/fence.md#fence-gate-junction), [지표 접촉](site/fence.md#fence-ground-profile)을 소유한다. gate의 void·회전·대기는 관리길 owner에서 소비한다. 실제 maps 포함·접합은 미완료다. |

`src/spaces/building.ts`는 외곽·공유 좌표의 조립 owner이고 완결 입면의 개별 부재를 거대 배열로 직접 저작하지 않는다. 지붕 합류선은 `src/spaces/roof/junctions.ts`에서 [단일 높이/교차 경계](roof/00-junctions.md#roof-shared-edges)를 산출하고 각 경사면 owner가 소비한다. 지붕면별 문서는 같은 이름의 `docs/spaces/roof` 파일에 있다. 공유 계산은 경사면을 소유하는 두 번째 geometry가 아니다. 식과 윤곽의 설계 입력을 작성했지만 위 source 파일들은 아직 없고 실제 면 닫힘/census는 unverified다.

`src/spaces/openings.ts`의 [공통 개구부 인계](06-openings.md#external-opening-interface)는 좌표 형식과 부재 예약을 공유할 예정이며 창/문 geometry의 별도 소유자가 아니다. 각 완결 입면 owner가 자기 void와 바깥 trim/충전 부재를 소유하고 방 안쪽 owner가 동일 void의 reveal/마감을 받는다. 문짝 유리·창 내부 분할까지 실제 관찰에서 숨기지 않는다.

일반 실내 칸막이의 공통 몸체는 [공유 경계 배정](07-boundary-assembly.md#interior-boundary-ownership)의 단일 source owner가 생성하고 양쪽 room은 자기 완결 마감을 유지한다. `src/spaces/boundaries.ts`는 [교차부·개구부·문턱](07-boundary-assembly.md#interior-boundary-junctions)의 같은 경계를 전달하는 계산 책임만 가지며 별도 벽/마감을 만들지 않는다. 차고 공유 벽과 계단 구조의 기존 소유는 그대로다.

[층간 구조의 가장자리](08-floor-assembly.md#interstorey-edge-junctions)는 외벽의 두께 구역과 실내 벽 상하 접촉을 같은 경계로 잇는다. 계단 구멍의 몸체는 upper 층판 owner, 그 두께 단면의 보이는 연속 마감은 stair owner, 도착의 보이는 바닥은 upper-hall owner다. 같은 가장자리에 두 번째 층판이나 테두리 마감을 생성하지 않는다.

[지상층 바닥 아래 지지](10-ground-floor.md#ground-support-handoff)는 본채/차고 실내 바탕 아래와 외벽/공유 벽의 기단 구역을 구별한다. 기단의 노출 수직 마감은 기존 완결 입면 owner가 통합하며 바닥 owner가 별도 외장 띠를 덧씌우지 않는다. 실제 지표·지지 하단·기초와 접촉 census는 아직 미완료다.

`src/spaces/site.ts`는 [외부 구역/접속의 조립](site/00-access.md#site-access-interface)만 맡는다. 종전의 포장 전체 한 파일 예약을 소스 저작 전에 완결 보행면·차도·테라스로 구체화했다. 포치 아래 대기와 정원문 바깥 대기는 각 연속 포장 owner에게 통째로 속하며 별도 판으로 쪼개지지 않는다. 측면 관리길은 앞뒤 두 구역이어도 같은 연속 면 owner를 유지하며, 목재 울타리는 문만 다른 파일에서 떼어 만들지 않는다. 대지 경계·보도/도로·지표·식재의 소유 분해와 울타리의 실제 필지 포함·지표 접합은 maps가 아직 없어 미완료다. 이 표를 전체 대지 표면 census 완료로 읽지 않는다.

[외부 포장 바탕](site/01-paving-support.md#paving-depth-reservation)과 [높은 평탄면 지지](site/01-paving-support.md#raised-platform-support)도 위의 각 완결 포장/porch 파일이 함께 소유한다. site 조립 파일은 별도 바탕이나 지지 상자를 만들지 않는다. [차도/보행길 접촉과 문기둥 접합](site/01-paving-support.md#paving-contact-handoff)은 원래 owner의 동일 끝선에서 닫고 실제 지지 하단/지표는 후속 입력을 기다린다.

## 방 내부의 완결 면 소유 {#interior-surface-handoff}

아래 owner는 각 방의 모든 안쪽 벽·천장·바닥 마감 구역과 개구부 둘레를 한 저작자가 통합할 책임을 가진다. 구조 벽과 층판은 외곽/공유 기준을 소비하며 외피와 별도 방 좌표를 발명하지 않는다. 문·창의 실제 void는 경계 owner, 문짝·창호 부재와 reveal의 일치 책임은 그 면 owner에게 전달된다. 모든 담당은 `/root`다.

| 공간 책임 | 소스 파일 owner |
| --- | --- |
| 실내 현관과 외투 수납 접면 | `src/spaces/rooms/entry.ts` |
| 전면 거실과 벽난로 안쪽 접면 | `src/spaces/rooms/living.ts` |
| 후면 주방·식당·가족실 전체 | `src/spaces/rooms/common.ts` |
| 서비스 접근 통로 | `src/spaces/rooms/service.ts` |
| 팬트리 | `src/spaces/rooms/pantry.ts` |
| 파우더룸 | `src/spaces/rooms/powder.ts` |
| 세탁·머드룸 | `src/spaces/rooms/laundry.ts` |
| 빈 차고 내부 | `src/spaces/rooms/garage-interior.ts` |
| 상층 복도와 린넨 수납 접면 | `src/spaces/rooms/upper-hall.ts` |
| 주침실 | `src/spaces/rooms/primary.ts` |
| 주침실에서 들어가는 별도 옷방 | `src/spaces/rooms/wardrobe.ts` |
| 올리브 침구의 작은 침실과 자기 수납 | `src/spaces/rooms/bedroom-two.ts` |
| 청회색 침구의 작은 침실과 자기 수납 | `src/spaces/rooms/bedroom-three.ts` |
| 유리 부스 샤워 욕실 | `src/spaces/rooms/shower-bath.ts` |
| 욕조 욕실 | `src/spaces/rooms/tub-bath.ts` |

[별도 옷방](rooms/wardrobe.md#primary-wardrobe-plan)은 사람이 들어가는 공간으로 채택했으므로 자기 파일·전체 관찰을 추가했다. 얕은 [복도 린넨장](rooms/upper-hall.md#upper-linen-storage)과 [현관 외투장](rooms/entry.md#entry-coat-storage)은 소비하는 방의 접면이다. 이 분류로 실제 방의 질문을 줄이지 않는다. 방별 경계·문·창·storey binding은 [동선 인계](05-route-network.md#room-route-network)의 방 owner와 대조한다. 방의 면 개수를 표의 행 수로 대체하지 않는다. 표의 소스 파일은 아직 없고 실제 census는 unverified이며 이 문서만으로 1단계 표면 인계를 완료하지 않는다.

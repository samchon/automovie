# 완결 시각 표면의 소유 분해

## 입면·지붕·층의 소유 {#exterior-surface-handoff}

[완결 표면 계약](../contracts/surface-ownership.md#whole-surface-owner)을 첫 소스 저작 전에 적용한다. 아래 표는 이번 draft에서 작성할 소스 파일의 책임을 예약한다. 담당 저작자는 모두 이 production의 `/root`다. 다른 저작자에게 위임하려면 완결 면 하나를 통째로 넘기며 같은 면의 부재·반복·마감을 따로 넘기지 않는다. 현재는 source 파일이 아직 없어 파일 배정 의도이며, 실제 surface id·면 개수·누락/중복 census를 완료한 선언이 아니다.

| 완결 면 또는 공유 경계 | 소스 파일 owner | 책임과 접합 |
| --- | --- | --- |
| 전면 전체 입면 | `src/spaces/envelope/front.ts` | 본채 전면·포치 접점·차고 전면의 외부 완결 면. 거실/상층 창과 현관/차고문은 실제 방/벽 binding에서 받는다. |
| 후면 전체 입면 | `src/spaces/envelope/rear.ts` | 후면 공용부의 정원 출입과 상층 창을 포함한다. 테라스 때문에 벽을 숨기지 않는다. |
| 왼쪽 전체 입면 | `src/spaces/envelope/left.ts` | 벽난로/굴뚝 접면과 창 둘레. 굴뚝 몸체는 같은 외벽 기준을 받는다. |
| 오른쪽 노출 입면 전체 | `src/spaces/envelope/right.ts` | 차고 바깥 벽과 차고 위 본채의 노출 부분. 가려진 공유 벽과 노출 면을 구별한다. |
| 본채/차고 공유 벽체 | `src/spaces/garage.ts` | 구조 기준 한 개와 머드룸 문 void. 두 실 안쪽 면의 owner는 각 실이다. |
| 주 지붕 전방 경사면과 하부 | `src/spaces/roof/main-front.ts` | 전면 박공과 합류하는 골짜기 경계를 공유 지붕 교차 계산에서 받는다. |
| 주 지붕 후방 경사면과 하부 | `src/spaces/roof/main-back.ts` | 주 용마루·후면 처마와 마감 경계를 소유한다. |
| 전면 왼쪽 박공의 왼쪽 경사면·하부 | `src/spaces/roof/front-gable-left.ts` | 삼각 전면 벽과 왼쪽 처마·주 지붕 합류선. |
| 전면 왼쪽 박공의 오른쪽 경사면·하부 | `src/spaces/roof/front-gable-right.ts` | 현관 쪽 골짜기·처마·용마루 접점. |
| 본채 오른쪽 낮은 박공 전방 면·하부 | `src/spaces/roof/right-front.ts` | 높은 주 지붕과 낮은 우측 지붕의 단차 경계. |
| 본채 오른쪽 낮은 박공 후방 면·하부 | `src/spaces/roof/right-back.ts` | 오른쪽 박공 삼각 벽과 후방 처마 접점. |
| 차고 지붕 전방 면·하부 | `src/spaces/roof/garage-front.ts` | 차고 정면과 본채 접합의 닫힌 경계. |
| 차고 지붕 후방 면·하부 | `src/spaces/roof/garage-back.ts` | 차고 후벽·본채 접면과 처마. |
| 낮은 포치 지붕·하부 | `src/spaces/porch.ts` | 보·기둥과 현관 접근을 함께 소유한다. |
| 1층 바닥·천장 공통 경계 | `src/spaces/floors/ground.ts` | 방별 마감 구역의 구조 바탕과 계단 통행 구멍 아래쪽 접합. |
| 2층 바닥·천장 공통 경계 | `src/spaces/floors/upper.ts` | 1층과 같은 계단 구멍, 상부참·복도 접합, 지붕 아래 천장. |
| 단일 L형 계단과 보호 경계 | `src/spaces/stair.ts` | 두 flight·중간참·도착·난간의 동일 기준. |

`src/spaces/building.ts`는 외곽·공유 좌표의 조립 owner이고 완결 입면의 개별 부재를 거대 배열로 직접 저작하지 않는다. 지붕 합류선은 `src/spaces/roof/junctions.ts`의 단일 계산을 소비하게 한다. 이것은 경사면 소유를 나누는 두 번째 geometry가 아니라 경사면들이 공유할 경계의 한 권위다. 정확한 지붕 교차 형상은 아직 설계하지 않았고 위 파일들이 존재한다거나 면이 닫혔다고 주장하지 않는다.

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
| 주침실과 자기 옷 수납 | `src/spaces/rooms/primary.ts` |
| 올리브 침구의 작은 침실과 자기 수납 | `src/spaces/rooms/bedroom-two.ts` |
| 청회색 침구의 작은 침실과 자기 수납 | `src/spaces/rooms/bedroom-three.ts` |
| 유리 부스 샤워 욕실 | `src/spaces/rooms/shower-bath.ts` |
| 욕조 욕실 | `src/spaces/rooms/tub-bath.ts` |

사람이 들어가는 수납실을 별도 공간으로 채택하면 새 공간의 완결 면과 source 파일, 전체 관찰을 추가한다. 현재 표의 수납 접면이라는 표현은 실제 방을 숨기거나 관찰을 줄이는 분류가 아니다. 방별 최종 경계·문·창·storey binding을 작성할 때 이 배정과 일치하는지 확인한다. 방의 면 개수를 표의 행 수로 대체하지 않는다. 표의 소스 파일은 아직 없고 실제 census는 unverified이며 이 문서만으로 1단계 표면 인계를 완료하지 않는다.

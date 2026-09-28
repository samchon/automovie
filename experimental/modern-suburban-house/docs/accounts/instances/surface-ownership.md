# 인스턴스 층의 완결 표면 소유 계정

## 반복과 배치가 완결 면을 갈라 쓰지 않는지 {#instance-surface-ownership}
<!--
@evidence contracts/surface-ownership.md#whole-surface-owner 인스턴스 32 H2를 원형 배치·외피 반복·개구부 충전의 책임으로 묶어 입면과 방의 원래 완결 표면 owner를 유지한다. 반복 course는 입면/지붕 면 경계를 소비하고 모든 가구·문·창·커튼은 모델 face를 변환할 뿐 공간 벽·바닥·천장을 다시 만들지 않는다. source 면 census는 아직 없어 미검증이다.
-->

[완결 면 계약](../../contracts/surface-ownership.md#whole-surface-owner)은 한 표면의 저작자와 파일을 1단계에서 배정한다. 이 계정은 [외부 면 인계](../../spaces/03-surface-owners.md#exterior-surface-handoff)와 [방 내부 인계](../../spaces/03-surface-owners.md#interior-surface-handoff)를 instances가 소비할 때 저작권이 분열하는지 확인한다. 여기의 배치 문서는 00의 규칙·조명 5 H2, 01의 1층·실내 공통 11 H2, 02의 상층 4 H2, 03의 외장·대지 6 H2, 04의 개구부 6 H2로 총 32 H2다.

| 인스턴스 집합 | 표면 기준과 instance 책임 | 중복 금지 경계 |
|---|---|---|
| [siding course](../../instances/03-exterior-repetition.md#siding-course-law) | 각 입면 owner의 기단·벽 상단·창문 void·trim 경계를 받아 그 면의 k번째 원형 판을 절단·배치한다. | 벽체·기단·문선은 spaces와 models의 기존 owner가 만들며, course는 벽 앞의 또 하나의 전면 벽판이 아니다. |
| [shingle course](../../instances/03-exterior-repetition.md#shingle-course-law) | 여덟 지붕 경사면의 처마·용마루·골짜기·굴뚝 경계를 받아 줄의 순서와 절단을 정한다. | 지붕 구조·처마 하부·굴뚝은 spaces의 owner에 남고 줄 메시 형상은 shingle model에 남는다. |
| [창·문 충전](../../instances/04-opening-fill.md#opening-fill-membership) | 공간 개구부 id와 일대일인 원형을 골라 같은 윤곽 안에 놓는다. | 개구부 절개·벽 reveal·문턱판은 spaces가 만들고 instance는 구멍을 새로 파거나 벽 면을 덮지 않는다. |
| [차고문과 수납문](../../instances/04-opening-fill.md#exterior-door-fill-placement) | 닫힌 차고문 panel·rail 및 수납 미닫이문은 각 모델의 표면 파티션을 한 번만 변환한다. | 레일 예약마다 새 레일을 만들거나 차고문 panel을 siding course로 다시 세지 않는다. |
| [실내 가구·설비](../../instances/01-ground-rooms.md#kitchen-fixtures), [상층 가구](../../instances/02-upper-rooms.md#primary-furniture) | 방 예약은 위치·사용 여유, 모델은 닫힌 원형 면, 재료는 그 면의 최종 마감을 준다. | 가구가 벽·바닥·천장의 완결 면을 대신 만들지 않고 배치 여유를 위해 원형을 줄이지 않는다. |
| [커튼](../../instances/01-ground-rooms.md#window-curtain-members) | 여덟 창마다 동일한 `rod`·`bracket`·`curtain` 면을 가진 모델을 안쪽에 배치한다. | 유리·창틀·실내 벽과 별도 면이며 창틀 들임을 두 번 적용하지 않는다. |
| [식재와 테라스 가구](../../instances/03-exterior-repetition.md#planting-individuals) | map 기준점의 지표에 모델 줄기·수관을 접지하고 terrace table/chair는 공간 포장 위에 놓는다. | 지표·포장·울타리는 spaces/maps가 맡은 면이며 나무 그림자를 틈 은폐용 판으로 쓰지 않는다. |

[외장 반복 제외](../../instances/03-exterior-repetition.md#exterior-exclusions)가 포치 기둥·난간·차고문 패널·줄눈을 반복 집합에서 제거한다. 재료의 siding·shingle·가구 결합은 모델의 표면 id에만 응답하고 instance가 새 재료 face를 만들지 않는다. 원형 source와 instance source의 컴파일된 `(instance id, prototype id, face id, surface owner)` census 및 건물 viewer의 접합 프레임이 생기기 전까지 실제 완결 면의 중복·누락·틈은 미검증이다.

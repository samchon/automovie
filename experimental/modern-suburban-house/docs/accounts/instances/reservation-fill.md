# 인스턴스 층의 방 예약 충전 계정

## 방 예약과 개체의 전수 대응 {#instance-reservation-fill}
<!--
@evidence contracts/reservation-fill.md#reservation-fill 방 source의 furniture·fixture·storage·covering 예약을 전수 입력으로 삼고 아래 방별 owner와 다대일 원형 부재 대응을 함께 검사한다. 독립 러그·매트의 covering 예약 인계와 아직 없는 instance source의 경계 상자 census는 미검증으로 남긴다.
-->

[예약 계약](../../contracts/reservation-fill.md#reservation-fill)의 모집단은 `src/spaces/rooms/*.ts`가 내보내는 모든 `furniture`·`fixture`·`storage`·`covering` 예약이다. 현재 정적 예약은 fixture 37, furniture 19, storage 16, covering 3, 합계 75개다. `common`의 스툴 3개와 식탁 의자 6개, 두 자녀실의 책상 의자 2개는 `use` 예약에서 이름을 유도하는 별도 의자 11개다. 각 source generation 때 이 수를 다시 산출하며 이 기록의 숫자를 생성 입력으로 쓰지 않는다.

아래 표에서 각 방의 모든 정적 예약 id는 링크한 인스턴스 H2 본문에 그대로 등장한다. 실제 instance source가 생기면 `(room id, reservation id)`를 정렬해 예약→구성원 역색인과 개체→예약 순색인을 대조한다. 이름을 문서에 적은 것만으로 3D 배치가 맞았다고 세지 않는다.

| 방 예약 owner | 인스턴스 owner | 충전과 예외 |
|---|---|---|
| [공용부](../../spaces/rooms/common.md#common-room-plan) | [주방 설비](../../instances/01-ground-rooms.md#kitchen-fixtures), [식탁](../../instances/01-ground-rooms.md#dining-table-chairs), [스툴](../../instances/01-ground-rooms.md#island-stools), [가족실](../../instances/01-ground-rooms.md#family-seating), [커튼](../../instances/01-ground-rooms.md#window-curtain-members) | 섬의 `common-island-sink`는 `common-island` 한 원형의 부재다. 스툴·식탁 의자는 `-use` 예약에서 생성한다. |
| [거실](../../spaces/rooms/living.md#living-furniture-use) | [좌석·러그](../../instances/01-ground-rooms.md#living-furniture), [커튼](../../instances/01-ground-rooms.md#window-curtain-members) | 앞·왼쪽 커튼 두 fixture와 러그 covering을 포함한다. |
| [현관](../../spaces/rooms/entry.md#entry-use-routes) | [매트](../../instances/01-ground-rooms.md#entry-mat) | `entry-mat` 한 장이다. |
| [파우더룸](../../spaces/rooms/powder.md#powder-fixture-use) | [설비](../../instances/01-ground-rooms.md#powder-fixtures) | 변기·세면장·거울·수건걸이 네 fixture다. |
| [세탁실](../../spaces/rooms/laundry.md#laundry-equipment-use) | [기기·벤치](../../instances/01-ground-rooms.md#laundry-fixtures) | 기기·상판·상부장·벤치·걸이 여섯 예약이다. |
| [팬트리](../../spaces/rooms/pantry.md#pantry-storage-use) | [선반](../../instances/01-ground-rooms.md#pantry-shelves) | `pantry-back-shelf`와 `pantry-right-shelf`를 `pantry-l-shelf` 한 개가 채운다. 70개 용기는 선반 위 별도 소품이다. |
| [차고](../../spaces/rooms/garage-interior.md#garage-storage-use) | [수납](../../instances/01-ground-rooms.md#garage-storage), [차고문](../../instances/04-opening-fill.md#exterior-door-fill-placement) | 선반·작업대·공구판 세 예약과 `garage-front-door` 원형의 부재가 되는 레일 세 예약을 구별한다. |
| [주침실](../../spaces/rooms/primary.md#primary-furniture-use) | [침대·협탁·서랍장](../../instances/02-upper-rooms.md#primary-furniture), [커튼](../../instances/01-ground-rooms.md#window-curtain-members) | 방 가구 넷·커튼 둘의 예약을 채운다. 침대 러그 covering은 공간 예약 추가 전까지 미완료다. |
| [둘째 침실](../../spaces/rooms/bedroom-two.md#bedroom-two-furniture-use) | [자녀 가구](../../instances/02-upper-rooms.md#child-bedroom-furniture), [커튼](../../instances/01-ground-rooms.md#window-curtain-members) | 침대·협탁·책상·옷장·커튼 다섯 예약과 책상 의자 use 하나다. 러그 covering은 인계 대기다. |
| [셋째 침실](../../spaces/rooms/bedroom-three.md#bedroom-three-furniture-use) | [자녀 가구](../../instances/02-upper-rooms.md#child-bedroom-furniture), [커튼](../../instances/01-ground-rooms.md#window-curtain-members) | 둘째와 같은 다섯 예약 및 의자 하나이고 독립 id를 유지한다. 러그 covering은 인계 대기다. |
| [드레스룸](../../spaces/rooms/wardrobe.md#wardrobe-storage-use) | [수납](../../instances/02-upper-rooms.md#wardrobe-storage) | 옷걸이·선반 두 저장 예약이다. |
| [샤워 욕실](../../spaces/rooms/shower-bath.md#shower-fixture-use) | [욕실 설비](../../instances/02-upper-rooms.md#bath-fixtures) | `shower-bathroom-booth` 한 원형의 수전·헤드가 세 fixture 예약을 함께 채운다. 나머지 변기·세면장·수건걸이·거울은 개별 원형이다. 바닥 매트 covering은 인계 대기다. |
| [욕조 욕실](../../spaces/rooms/tub-bath.md#tub-fixture-use) | [욕실 설비](../../instances/02-upper-rooms.md#bath-fixtures) | 세면장·변기·욕조·커튼 레일·수건걸이·거울 여섯 예약이다. 바닥 매트 covering은 인계 대기다. |

방 예약의 충전은 외곽이 자기 예약에 들고 `route`·사람 전용 `use`·`swing`을 점유하지 않을 때만 통과한다. [적합 규칙](../../instances/00-placement-frame.md#placement-fit-validity)은 모델이 큰 경우 임의 축소를 금지한다. 벽감 병 세 개와 선반 위 식품 용기 70개는 방의 바닥 fixture 예약을 증식시키는 가구가 아니라 원형 선반/벽감 위 소품이며 각각 해당 host의 윗면·안쪽 경계를 검증한다. 독립 침대 러그 세 장과 욕실 매트 두 장의 예약을 공간 owner가 추가하기 전에는 이 계정의 방별 전수 충전 및 외곽 적합을 완료로 판정하지 않는다. 현재 `src/instances/`가 없어 예약 id의 실제 역색인과 경계 상자 결과도 미검증이다.

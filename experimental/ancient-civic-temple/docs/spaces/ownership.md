# 최초 공간 설계의 완결 표면 소유

## 입면·방·층·지붕의 소유 지도 {#surface-map}

[추가 공간 의무](../contracts/obligations-spaces.md#surface-ownership)를 실제 평면 경계와 연결한다. 아래의 source 경로는 이 draft가 지정하는 후속 단독 저작 owner이며 현재 생성된 source라고 주장하지 않는다. 저작자는 이번 production 세션 한 명이고 fan-out이 생겨도 하나의 행이 가진 완결 표면을 여러 사람에게 나누지 않는다. 내부벽의 물리 topology는 [boundaries](openings.md#boundary-ownership) 한 소유이며 마주 보는 두 마감은 각각의 방 소유다.

| 완결 표면/역할 | design owner | 후속 source owner |
| --- | --- | --- |
| 남측 외피와 후퇴 입구 바깥 반환면 | [남측](facades/south.md#south-envelope) | src/spaces/facades/south.ts |
| 북측 외피·제실 북 박공 | [북측](facades/north.md#north-envelope) | src/spaces/facades/north.ts |
| 서측 전체 외피 | [서측](facades/west.md#west-envelope) | src/spaces/facades/west.ts |
| 동측 전체 외피·서비스 문 바깥 | [동측](facades/east.md#east-envelope) | src/spaces/facades/east.ts |
| 한 층의 기준·바닥 구조체 공유 접합 | [층](storey.md#ground-storey) | src/spaces/storey.ts |
| 현관 안쪽 반환면·계단·상부참 | [현관](rooms/entrance.md#entrance-volume) | src/spaces/rooms/entrance.ts |
| 중정 바닥·연속 석재 턱 | [중정](rooms/courtyard.md#court-volume) | src/spaces/rooms/courtyard.ts |
| 한 고리 전체 내벽·바닥·노출 천장 | [주랑](rooms/colonnade.md#ring-volume) | src/spaces/rooms/colonnade.ts |
| 제실 내벽·바닥·노출 박공 하부 | [제실](rooms/sanctuary.md#sanctuary-volume) | src/spaces/rooms/sanctuary.ts |
| 봉헌실 내벽·바닥·낮은 천장 | [봉헌실](rooms/offering.md#offering-volume) | src/spaces/rooms/offering.ts |
| 관리실 내벽·바닥·천장 | [관리실](rooms/administration.md#office-volume) | src/spaces/rooms/administration.ts |
| 기록실 내벽·바닥·천장 | [기록실](rooms/records.md#records-volume) | src/spaces/rooms/records.ts |
| 보관실 내벽·바닥·천장 | [보관실](rooms/storage.md#storage-volume) | src/spaces/rooms/storage.ts |
| 마당 포장·안쪽 벽·낮은 벽 상단 | [서비스 마당](rooms/service-yard.md#yard-volume) | src/spaces/rooms/service-yard.ts |
| 제실 지붕 상부·바깥 처마 하부 | [제실 지붕](roofs/sanctuary.md#sanctuary-roof) | src/spaces/roofs/sanctuary.ts |
| 서측 날개 지붕 상부·바깥 하부 | [서측 지붕](roofs/west.md#west-roof) | src/spaces/roofs/west.ts |
| 동측 날개 지붕 상부·바깥 하부 | [동측 지붕](roofs/east.md#east-roof) | src/spaces/roofs/east.ts |
| 남북 주랑 덮개 상부·바깥 끝 | [주랑 지붕](roofs/colonnade.md) | src/spaces/roofs/colonnade.ts |
| 포치 지붕과 외부 처마 전체 | [포치 지붕](roofs/porch.md#porch-roof) | src/spaces/roofs/porch.ts |

surface ID는 `surface.<owner>.<face>`로 안정되게 정하고 실제 boundary/element의 면 범위에 결속한다. [벽 접합](junctions.md#wall-junctions)의 공통 내부 접면은 노출 마감이 아니며 모서리 절단이 외측 면의 소유를 바꾸지 않는다. [박공 폐쇄](junctions.md#gable-closures)의 노출 면도 위의 입면·방·지붕 소유에 속한다. junctions는 접합 계산의 소유이고 완결 시각 표면의 새 공동 소유자가 아니다. 마감의 수치값은 materials가 이 host를 소비하며 면을 다른 owner로 쪼개지 않는다. 기둥·문틀·문짝·수반·제단 같은 독립 물체의 전체 표면은 해당 model prototype 한 소유이고 방 파일은 배치와 접촉을 소비한다. 반복 instance마다 표면 정의를 복제하지 않는다.

이 지도는 compiled host binding이 아니다. source가 생기면 실제 모든 노출 면을 역으로 읽어 빠진 면·두 owner가 붙은 면·존재하지 않는 경계를 분모에 남긴다. 한 누락이라도 있으면 최초 공간 단계는 닫히지 않는다. 외부 setting의 지면·이웃·식생은 maps/models의 후속 완결 소유이며 건물 표면에 섞지 않는다.

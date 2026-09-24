# 모델 층의 완결 표면 소유

## 부재가 완결 표면을 쪼개지 않는 모델 배정 {#model-surface-ownership}
<!--
@evidence contracts/surface-ownership.md#whole-surface-owner 전후면 문턱은 spaces, 옆마당 대문 문짝과 외투장 문짝·봉은 models로 소유를 정정했다. 이 계정은 models 80개 H2 전체의 표면 대조를 계속해야 하며 현재 소스 표면 결속과 나머지 원형의 중복 소유 0건은 주장하지 않는다.
-->

[원문 계약](../../contracts/surface-ownership.md#whole-surface-owner)은 한 완결 표면에 한 소유자를 두고 후속 부재·모듈·마감 저작이 그 표면을 쪼개지 않기를 요구한다. models에서는 [표면 이름 규칙](../../models/00-model-frame.md#model-surface-partition-naming)이 부재 역할별 id만 정하고 색·광학값은 materials에 남긴다.

현재 확인한 경계는 다음과 같다. [창](../../models/01-windows.md#window-surface-partitions)은 창 부재 면을 소유하고 벽 reveal은 spaces가 소유한다. [외부 문](../../models/02-exterior-doors.md#exterior-door-surfaces)은 문짝·문설주·레일을 소유하되 [전후면 문턱판](../../spaces/10-ground-floor.md#ground-threshold-junctions)은 spaces가 이미 한 번 만들었다. [옆마당 대문](../../models/02-exterior-doors.md#side-yard-gate)의 움직이는 문짝은 models가 소유하고 `src/spaces/site/fence.ts`는 문기둥만 만든다. [실내 문](../../models/03-interior-doors.md#interior-door-surfaces)은 문설주·문선·문짝을 소유하고 방 벽 마감은 spaces가 소유한다. [난간](../../models/04-stair-members.md#stair-member-surfaces)은 baluster·bottom-rail을 소유하고 기둥·손잡이는 spaces 계단 owner가 소유한다. [외투장](../../models/05-closet-fittings.md#closet-fitting-surfaces)의 문짝·봉·선반은 models이고 `src/spaces/rooms/entry.ts`에는 벽 두 개만 있다. 이것은 발견한 세 중복 owner의 수리이며 80개 모델 H2 전부에 대한 면 단위 계정은 아직 작성하지 않았다. 전체 중복 소유 수와 실제 source 표면 바인딩은 unverified다.

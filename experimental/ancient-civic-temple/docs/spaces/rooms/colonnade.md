# 연속 주랑

## 구멍 있는 하나의 주랑 공간 {#ring-volume}

<!--
@evidence principles/core/common.md#scope-preservation 중정 구멍과 현관 후퇴부를 제외한 연속 주랑 전체를 한 공간으로 보존하고 모든 직접 문 앞의 여유를 남긴다.
@evidence principles/core/common.md#substantive-completion 겹치지 않는 여섯 평면 영역과 경사 하부에 따른 볼록 cell 분해, 기단/주두 돌출 예산을 정한다.
@evidence principles/core/common.md#declared-basis 기준선과 합성 roof를 입력으로 사용하며 공개 cells/contains 표현 가능성과 실제 containment 성공을 구별한다.
@evidence principles/design/spaces.md#space-topology colonnade 하나의 cell 합집합으로 고리를 표현하고 계산 접면에 벽·문·독립 복도를 추가하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 바닥·노출 천장은 주랑의 완결 소유로 유지하고 기둥 prototype이나 기준선 상수를 여기서 복제하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 영역 내부·열린 접면 양쪽·중정 구멍·반환벽의 점과 각 영역 중심 네 방위를 대조해 외접 상자 오인을 찾는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 연속 주랑 요구를 구멍과 notch가 있는 실제 영역, 기둥 돌출 후 여유 예산으로 결정한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work colonnade의 기둥 열과 use-profile의 유효폭 최소를 여섯 영역에 대조했다. 북·동·서 1.75m와 남 1.60m 예산을 남겨 부모 최소를 줄이지 않았고 실제 배치 검사는 별도로 남겼다.
@evidence settings/20-envelope.md#colonnade 기둥은 중정 경계 쪽에 두고 한 고리의 노출 하부와 바닥을 끊지 않는다.
@evidence settings/10-building.md#use-profile 명목 폭에서 기단/주두 돌출을 뺀 예산을 구분하고 열린 문짝·집기까지 놓은 후 유효폭을 다시 검사한다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 중정 구멍과 현관 notch를 빼고 모든 직접 문 앞을 잇는 고리 전체를 다룬다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 여섯 평면 영역과 roof에 따른 추가 볼록 분해를 구별해 고정 cell 수로 잘못 구현하지 않게 했다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb cells API의 표현 가능성과 아직 없는 production containment 결과를 구분했다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 한 레코드의 합집합이며 계산 접면은 벽이나 독립 복도가 아니라는 문장이 고리를 유지한다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 주랑 바닥/천장을 한 owner에 남기고 기둥 prototype의 표면은 models로 보낸다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 중정 구멍과 반환벽 안의 반증점도 읽게 하므로 외접 상자만 선언한 구현은 실패한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모의 연속 주랑에 오목 영역과 기단 돌출 뒤의 여유 예산을 더했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 명목 폭에서 돌출을 뺀 1.75m·1.60m는 배치 전 예산이며 부모 최소의 실제 충족을 발명하지 않았다.
@evidenceReview settings/20-envelope.md#colonnade #29bfe45 기둥 열은 중정 경계 쪽이고 네 변의 바닥/노출 하부는 연결된 공간에 남는다.
@evidenceReview settings/10-building.md#use-profile #ee92183 문짝·집기까지 놓은 후 유효폭을 다시 검사하도록 해 예산을 통과 측정으로 쓰지 않는다.
-->

공간 ID `colonnade`는 [지상층](../storey.md#ground-storey)의 내부/반외부 연결 공간이다. 평면은 [공유 기준선](../building.md#plan-datums)의 west-ring~east-ring, north-ring~south-inner 사각 영역에서 중정과 현관 후퇴부를 뺀 하나의 연결 영역이다. 중정 구멍을 포함하는 외접 상자 전체를 실내로 선언하지 않는다.

내부가 겹치지 않는 평면 영역은 북쪽(west-ring~east-ring, north-ring~court-back), 서쪽(west-ring~west-court, court-back~court-front), 동쪽(east-court~east-ring, court-back~court-front), 남쪽(west-ring~east-ring, court-front~entrance-back), 남서 꼬리(west-ring~west-porch-outer, entrance-back~south-inner), 남동 꼬리(east-porch-outer~east-ring, entrance-back~south-inner)다. 반환벽 두께는 영역 밖에 남기고 현관 쪽 빈 공간에도 포함하지 않는다. 이 분해는 공간 내부를 설명하는 도구이며 새 방이나 독립 복도가 아니다. 인접 영역의 접면은 막힌 벽 없이 맞닿는다.

공개 타입 `IAutoMovieBuiltSpace`의 `cells`는 볼록 cell의 합집합으로 한 공간을 표현한다. 구현은 `id: colonnade`, `parent: temple-ground` 한 레코드에 이 합집합을 담고 `shell`을 동시에 선언하지 않는다. 평면 여섯 영역에 [완성 바닥](../storey.md#ground-storey)과 [합성된 지붕 하부](../roofs/assembly.md#roof-junctions)를 적용해 실제 3차원 cell을 유도한다. 지붕 접합에서 볼록성을 유지하기 위한 추가 분해가 필요하면 같은 공간 안 cell만 늘린다. 따라서 여섯 평면 영역을 compiled cell 수로 고정하지 않는다. cell의 계산 접면은 물리벽·문·표면 소유자를 만들지 않으며, 주랑의 완결된 바닥과 천장 노출면 소유도 나누지 않는다.

각 cell은 world 좌표의 `dot(normal, point) <= offset` 반공간 교집합이며, 공개 `builtSpaceContainsPoint`는 이 cell들의 합집합을 판독한다. 이 경로와 `lowerBuiltEnvironment`의 원래 built environment 보존을 저장소 source에서 확인했다. 실제 산출물에서는 주랑 각 영역 내부, 열린 접면 양쪽, 중정 구멍, 현관 후퇴부와 반환벽 안의 점을 대조해 합집합이 설계 경계를 따르는지 확인한다. 문턱의 연결은 실제 개구부와 connector에서 별도로 읽는다. 공개 표현 가능성을 확인한 것이며 production의 containment·관찰 위치·통과 결과는 아직 unverified다.

[주랑 정체성](../../settings/20-envelope.md#colonnade)의 기둥 열은 중정 경계 쪽에 두고 주랑에 돌출하는 기단/주두 평면 폭은 경계에서 최대 0.35m다. 북·동·서쪽 명목 폭에서 이를 뺀 여유는 1.75m이고 남쪽 현관 후퇴벽 앞은 1.60m다. 이는 배치 전 예산이며 [사용 포락](../../settings/10-building.md#use-profile)의 유효폭 검사는 문짝·기둥·집기 배치 후 다시 한다. 문 앞을 기둥이 막는 반복 규칙은 채택할 수 없다.

source `src/spaces/rooms/colonnade.ts`가 한 공간과 내부 벽 마감·바닥·천장 노출면 전체를 소유한다. 기둥 prototype 자체는 models의 한 소유이고 여기서 원주의 표면을 쪼개지 않는다. 관찰은 여섯 평면 영역 각각의 실제 공간 내부 중심 네 방위, 외측·중정측·현관 후퇴부 모서리, 모든 직접 문과 바닥 이어짐이다. 외접 상자 중앙이 중정에 있다는 이유로 주랑 중심 관찰을 방 밖에서 답하지 않는다.

# 재료 층의 완결 표면 소유

## 표면을 쪼개지 않는 재료 결합 {#material-surface-ownership}
<!--
@evidence contracts/surface-ownership.md#whole-surface-owner 재료 H2 46개를 한 줄씩 대조해 41개 재료 H2가 spaces 03의 완결 면 owner 또는 models 00–15의 파티션 id에만 결합하고, 한 면에 재료 하나라는 규칙을 00-material-frame의 material-binding-rule이 소유하며, 경계는 host 부재 끝선에서만 바뀌고 삼각형 단위로 새 경계를 만들지 않음을 확인했다. 미결합 한 곳(주침실 창 커튼)은 models에 원형이 없어서 남은 것이며 표면을 나눈 것이 아니고, 벽난로 화구는 living owner의 벽난로 안쪽 접면에 결합한다.
-->

[원문 계약](../../contracts/surface-ownership.md#whole-surface-owner)은 한 표면에 한 소유자를 두고 후속 부재·모듈·마감 저작이 그 완결 표면을 쪼개지 않기를 요구한다. materials는 표면을 만들지 않고 [외부 표면 배정](../../spaces/03-surface-owners.md#exterior-surface-handoff)과 [방 내부 배정](../../spaces/03-surface-owners.md#interior-surface-handoff)의 owner 면, 그리고 [모델 파티션 이름 규칙](../../models/00-model-frame.md#model-surface-partition-naming)의 id에 마감을 결합한다. 한 면에 재료 하나, 경계는 host 부재 끝선이라는 규칙은 [면 결합 규칙](../../materials/00-material-frame.md#material-binding-rule)이 소유한다.

대조 방법은 docs/materials 네 파일의 H2 46개를 한 줄씩 읽어 각 H2의 "결합 면" 문장을 spaces 03의 owner 표와 models의 파티션 id에 맞추는 것이었다. 틀 파일 `00-material-frame.md`의 H2 5개(색 공간, 비트맵 없음, 응답 관례, 면 결합 규칙, 리뷰 견본)는 규칙을 소유하고 표면에 결합하지 않는다. 나머지 41개 중 외부 12개는 입면·지붕 경사면·포치·포장·울타리 owner 면과 창·외부 문 파티션에, 실내 외피 13개는 방 owner의 벽·천장·바닥 마감 구역과 실내 문·계단·수납 파티션에, 가구·설비 16개는 models 10–15 원형의 파티션 id에 결합한다.

같은 host 안에서 두 재료가 만나는 곳은 모두 host가 이미 가진 부재 경계다. siding과 벽돌은 기단 윗선, 마루·카펫·타일·세탁실 바닥은 [실내 경계의 문턱](../../spaces/07-boundary-assembly.md#interior-boundary-junctions), 벽 도장과 욕실 벽 타일은 기구·수납 끝선, 벽돌과 줄눈은 instance가 만든 오목한 줄눈 면에서 바뀐다. 같은 값을 여러 파티션이 공유하는 경우(참나무 마루와 계단 디딤판, 소품 파티션의 재사용)는 재료 값을 공유할 뿐 표면을 합치거나 나누지 않는다.

결합 대상이 아직 없는 곳은 주침실의 얇은 창 커튼 하나이며 models에 원형이 없다. 거실 벽난로 화구는 03 방 내부 배정에서 `src/spaces/rooms/living.ts`가 소유하는 벽난로 안쪽 접면에 결합하고 개별 surface id는 source 단계에서 부여된다. 컴파일된 산출물에서 재료 없는 면과 두 재료를 받은 면의 개수를 세는 census는 source 단계의 [면 결합 규칙](../../materials/00-material-frame.md#material-binding-rule) 검사로 남으며 현재 unverified다.

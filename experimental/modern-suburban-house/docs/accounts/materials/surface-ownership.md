# 재료 층의 완결 표면 소유

## 표면을 쪼개지 않는 재료 결합 {#material-surface-ownership}
<!--
@evidence contracts/surface-ownership.md#whole-surface-owner materials의 49 H2 중 공통 규칙 5와 마감 응답 44의 분모를 분리하고, host 부재 면에는 한 최종 재료만 결합하되 벽돌·타일 줄눈은 그 재료 안의 UV 마스크라고 정한다. 아직 없는 materialSources의 실제 면별 0/1 결합 census는 unverified다.
-->

[원문 계약](../../contracts/surface-ownership.md#whole-surface-owner)은 한 완결 시각 표면에 한 소유자를 둔다. materials는 [외부](../../spaces/03-surface-owners.md#exterior-surface-handoff)·[내부](../../spaces/03-surface-owners.md#interior-surface-handoff) spaces 면과 [모델 파티션](../../models/00-model-frame.md#model-surface-partition-naming)에 마감만 결합한다. 한 면에 한 **최종 재료 인스턴스**를 붙이고, 서로 다른 최종 재료가 만나는 선은 [결합 규칙](../../materials/00-material-frame.md#material-binding-rule)대로 host 부재 경계와 맞춘다.

현재 `docs/materials` 네 파일에는 H2가 49개다. `00-material-frame.md`의 5개는 공통 규칙·리뷰 주소이고 표면을 직접 받지 않는다. `01-exterior.md`의 12개, `02-interior-shell.md`의 13개, `03-furnishings.md`의 19개는 마감 응답 44개다. 이 수는 H2 분모이며 각 마감 H2가 열거한 모든 `(host surface id, 최종 재료)` 쌍의 실제 결속 검사를 완료했다는 뜻이 아니다. 그 쌍의 전수 및 컴파일된 면의 미결합·중복 결합 census는 materialSources 구현 뒤 측정할 때까지 unverified다.

구조적 경계는 다음처럼 배분한다. siding/벽돌의 만남은 기단 윗선, 마루/카펫/타일/세탁실 바닥의 만남은 [실내 문 아래 전환](../../spaces/07-boundary-assembly.md#interior-boundary-junctions), 벽 도장/벽 타일의 만남은 host의 타일 구역 끝선이다. [흰 외부 trim](../../materials/01-exterior.md#trim-white)은 [모서리 L자 판](../../models/15-outdoor.md#exterior-corner-trim)의 `exterior-trim`에도 결합한다. [벽돌 줄눈](../../materials/01-exterior.md#brick-red-brown)과 [타일 줄눈](../../materials/02-interior-shell.md#tile-grout)은 각각 기존 벽돌·타일 면에 결합한 **한 재료 안의** 색·거칠기·normal UV 마스크다. 오목 줄눈 메시, 별도 `grout` face id, 두 번째 material binding은 없다.

[주침실과 여섯 창 커튼](../../models/13-bedrooms.md#primary-window-curtains)의 `curtain` 파티션은 [직물 마감](../../materials/03-furnishings.md#towel-curtain-textile)이 받는다. [벽난로의 금속 화구·목재 선반](../../models/11-living.md#fireplace-insert-mantel)은 벽돌 구조와 별도 닫힌 면이고 각각 [검은 화구](../../materials/03-furnishings.md#firebox-black)와 [가구 목재](../../materials/03-furnishings.md#furniture-wood)를 받는다. modelSources가 열리기 전 이 부재의 실제 메시·face id·GPU 결속은 unverified다.

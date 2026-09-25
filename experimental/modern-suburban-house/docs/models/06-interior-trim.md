# 실내 벽 하단 마감 부재

## 방 벽 걸레받이 원형 {#wall-baseboard}
<!--
@evidence principles/core/common.md#scope-preservation 1·2층 마른 실내 벽과 세탁실의 노출 벽 하단 걸레받이 한 원형, 개구부·계단·타일 구역의 종단, 닫힌 면 id와 후속 반복 인계를 맡는다.
@evidence principles/core/common.md#substantive-completion 높이 0.10 m·최대 돌출 0.015 m·윗면 0.01 m 사면의 닫힌 오각 단면, 실제 벽 구간에서 산출하는 길이 L, miter·끝 마개, `wall-baseboard` id와 UV를 정한다.
@evidence principles/core/common.md#declared-basis 벽 위치·열린 개구부·방 마감 면은 spaces/03-surface-owners.md#interior-surface-handoff에서, 흰 부재와 레퍼런스 03·04·05의 읽힘은 settings/20-verification.md#visual-grammar에서 받으며 픽셀로 치수를 재지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 방의 완결 벽 마감 owner와 구별되는 별도 닫힌 0.10 × 0.015 m 부재, 개구부와 계단에서의 종단, face id와 반복 입력을 더한다.
@evidence principles/design/models.md#representation-contract 모델은 벽·바닥·문선·계단 측면을 복제하지 않고 그 면에 접한 닫힌 걸레받이만 만든다. 보이지 않는 접착제·못과 타일 벽의 걸레받이는 표현하지 않는다.
@evidence principles/design/models.md#spatial-convention 국소 원점은 완성 바닥과 실내 마감 벽면이 만나는 노출 run의 시작점, +X는 run 방향, +Y는 위, +Z는 방 안쪽이다. 길이 L과 코너 miter는 실제 방 경계에서 받는다.
@evidence principles/design/models.md#reviewable-structure 03 공용부, 04 현관·계단, 05 복도의 낮은 벽과 문선 옆을 방 안쪽 모서리/중심에서 보아 흰 0.10 m 띠의 연속, 문 아래 빈 띠, 모서리 중복을 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 레퍼런스 03·04·05의 흰 벽 하단 판을 낮은 연속 띠로 채택한다. 벽보다 좁은 반광 하이라이트는 materials가 정하고 사진의 픽셀 높이는 치수 근거로 쓰지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 닫힌 오각 단면의 다섯 꼭짓점, run 산출과 종단, 단일 id, UV·source owner·관찰을 정한다. 실측된 방 경계 외의 길이·배치 수는 후속 instances가 정한다.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work spaces/03-surface-owners.md#interior-surface-handoff가 모든 안쪽 벽 마감을 방 owner에 주면서 materials가 요구한 별도 걸레받이를 분리하지 않았다. 그 부모 본문과 space-boundary-authority 근거에 방 벽·바닥 면은 spaces, 닫힌 걸레받이 판은 models/06이라는 단일 소유 인계를 명시했다.
@evidence spaces/03-surface-owners.md#interior-surface-handoff 방마다 완결된 안쪽 벽·바닥 마감 면과 실제 개구부를 원래 owner에게서 받고, 그 면 위의 독립 걸레받이 판만 이 모델에 둔다.
@evidence settings/20-verification.md#visual-grammar 읽히는 실내 trim을 방의 낮은 벽에서 연속한 돌출 띠로 구현할 원형을 정한다.
@evidence contracts/surface-ownership.md#whole-surface-owner 각 run의 앞·뒤·윗면·아랫면·절단 끝을 한 모델 owner와 `wall-baseboard` face id로 닫고 벽·바닥 마감과 중복 생성하지 않는다.
@evidence obligations/design/models.md#addressable-model-decisions 방 벽 걸레받이를 문짝·가구 plinth와 구별되는 주소로 두고, 원형 단면과 room 반복 배치를 분리한다.
@evidence obligations/design/models.md#model-review-set 방 안쪽 모서리·threshold·중심의 낮은 벽 관찰에서 판의 연속·종단·모서리 겹침을 검사하도록 정한다.
-->

레퍼런스 03의 공용실, 04의 현관과 계단 옆, 05의 상층 복도에서 낮은 흰 걸레받이를 채택한다. 이는 [방 내부 완결 면](../spaces/03-surface-owners.md#interior-surface-handoff)의 벽 도장이나 바닥 마감 자체가 아니라 그 접선에 붙는 별도 닫힌 목재·MDF 판 원형이다. 색·광택·목재 결은 [흰 실내 trim](../materials/02-interior-shell.md#interior-trim-white)이 정한다. 사진의 높이를 픽셀에서 재지 않는다.

국소 원점은 한 방의 완성 바닥 상면과 실내 벽 마감 면이 만나는 노출 run의 시작점이다. +X는 해당 벽을 따라, +Y는 위, +Z는 방 안쪽이다. 단면 YZ 꼭짓점은 `(0,0) → (0.10,0) → (0.10,0.005) → (0.09,0.015) → (0,0.015)` m이며, 첫 좌표가 Y이고 둘째가 Z다. 따라서 높이는 0.10 m, 최대 방 쪽 돌출은 0.015 m, 위쪽 0.01 m에는 사면이 생긴다. 단면을 실제 run 길이 L만큼 압출해 앞·뒤·윗면·아랫면·시작/끝을 닫는다. 모든 삼각형의 face id는 `wall-baseboard` 하나다. 구조 벽과 방 마감, 가구 하부의 `plinth`는 이 원형이 만들지 않는다.

입력 L은 [방별 벽 마감](../spaces/03-surface-owners.md#interior-surface-handoff)의 실제 노출 직선 구간에서 받는다. 한 방의 벽에 붙은 판은 열린 문 개구부와 문선 바깥 끝, 문 없는 통로의 벽 끝, 붙박이 수납의 실제 닫힌 앞면에서 끊는다. 문턱 아래나 개구부를 가로질러 판을 잇지 않는다. 창대가 이 높이에 내려오지 않는 일반 창에서는 판을 연속한다. 내부/외부 방 모서리에서 이웃 run 둘은 각 45° miter 끝면으로 정확히 맞대고, 독립 노출 종단은 수직 끝 마개로 닫는다. 한 모서리의 판을 두 방에서 만들지 않으며 같은 방 안의 두 run은 모서리 공통 부피를 복제하지 않는다. 1층·2층의 마른 실과 세탁실의 노출 도장 벽에는 이 원형을 반복한다. 차고의 콘크리트 벽과 욕실의 타일 벽·타일 하단에는 만들지 않는다. 계단 아래 시작 run은 첫 챌판/계단 측판에서 끝내고, 위층 run은 도착 바닥의 새 경계에서 시작한다. 비스듬한 계단 측판을 수평 걸레받이로 대신하지 않는다.

UV는 run 시작 끝면의 완성 바닥·벽 접점을 원점으로 한다. 긴 앞/뒤 면은 U가 +X 방향 미터 길이, V가 Y 높이 미터 길이이고, 윗 사면과 끝 마개는 각 면의 실제 경계에서 같은 물리 척도로 새 투영을 시작한다. 코너 miter에서는 결 방향을 각 run의 +X로 다시 잡고, 문선·계단·타일 종단에서 텍스처를 잇지 않는다. 관절은 없다. 설계 source owner는 `src/models/interior/baseboard.ts`이고, 실제 벽 길이·개수와 배치 변환은 후속 instances가 컴파일된 방 경계로 산출한다. 현재 modelSources가 열리지 않아 메시·UV·재료 결속과 GPU 읽힘은 unverified다.

# 침실과 옷방의 가구 원형

## 머리판 있는 침대 {#headboard-bed}
<!--
@evidence principles/core/common.md#scope-preservation 주침실 L 2.15 × W 1.60 m와 두 작은 침실 L 2.15 × W 1.15 m 세 예약을 W·L·H·B 네 인자의 한 침대 원형으로 모두 받아 어느 침실 침대도 빠뜨리지 않는다.
@evidence principles/core/common.md#substantive-completion 머리판 두께 0.06 m, 프레임 Y = [0.10, 0.30], 매트리스 Y = [0.30, H − 0.03], 침구 덮개 0.03 m, 베개 0.60 × 0.40 × 0.12 m를 수치로 확정해 구현자가 부품 치수를 새로 정할 일이 없다.
@evidence principles/core/common.md#declared-basis 외곽 L·W와 H·B는 세 방 예약 링크에서 받은 값이고 부품 두께·다리 높이·베개 수는 이 H2의 저작 선택으로 적혀 있다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 방 예약은 외곽과 H·B만 주는데 이 H2는 머리판·프레임·매트리스·침구·베개 다섯 부품과 +X/-Z 머리 방향을 한 원형의 인자로 더한다.
@evidence principles/design/models.md#representation-contract 머리판·프레임·매트리스·침구 덮개·베개 계층과 `headboard`·`bed-frame`·`mattress`·`bedding`·`pillow` 재질 경계를 두고 관절 없음·이불 주름 비표현을 명시한다.
@evidence principles/design/models.md#spatial-convention 가구 국소 좌표에서 +Z가 발끝, 높이는 상층 완성 바닥 기준이며 침구 덮개가 발끝과 양옆으로 0.02 m 내려와도 외곽 안에 머문다고 정한다.
@evidence principles/design/models.md#reviewable-structure 측면에서 H와 B가 배치별 값과 같은지, 위에서 외곽이 세 예약과 같은지를 관찰 대상 실루엣으로 지정한다.
@evidence principles/design/models.md#model-observable-style-basis 머리판 있는 침대라는 형식을 0.06 m 머리판, 네 모서리 다리 위 프레임, 발끝·양옆으로 0.02 m 내려오는 덮개라는 관찰 가능한 구성으로 풀고 침구색은 materials에 넘긴다.
@evidence principles/design/models.md#model-scale-layer-completion 세 예약의 L·W·H·B, 다섯 부품 층, 다섯 재질 경계, 관절 없음, 측면·평면 관찰이 함께 적혀 있고 모든 관찰은 unverified라고 밝힌다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 주침실·둘째·셋째 침실 예약의 외곽 좌표와 H 0.60/0.55 m·B 1.00/0.95 m를 적힌 그대로 소비했고 고칠 부모 결함이 없었다.
@evidence settings/10-house.md#primary-bedroom 성인 둘의 침대 요구를 주침실 W = 1.60 m 폭과 베개 둘로 받는다.
@evidence settings/10-house.md#bedroom-two 자녀 한 명 침대 요구를 W = 1.15 m, 베개 하나의 작은 침실 배치로 받는다.
@evidence settings/10-house.md#bedroom-three 둘째 자녀 침실의 침대를 같은 원형의 W = 1.15 m·H 0.55 m 배치로 받고 청회색 침구는 materials가 배치별로 정한다고 적는다.
@evidence spaces/rooms/primary.md#primary-furniture-use 주침실 예약 X = [-1.50, 0.65], Z = [-8.65, -7.05]를 L = 2.15 m, W = 1.60 m, H 0.60 m, B 1.00 m, 머리 +X로 소비한다.
@evidence spaces/rooms/bedroom-two.md#bedroom-two-furniture-use 둘째 침실 예약 X = [-5.25, -4.10], Z = [-4.50, -2.35]를 L 2.15 m, W 1.15 m, H 0.55 m, B 0.95 m, 머리 -Z로 소비한다.
@evidence spaces/rooms/bedroom-three.md#bedroom-three-furniture-use 셋째 침실 예약 X = [-0.25, 0.90], Z = [-3.10, -0.95]를 둘째 침실과 같은 L·W·H·B 값과 머리 -Z로 소비한다.
@evidence obligations/design/models.md#addressable-model-decisions 침대 원형의 인자 W·L·H·B, 다섯 부품, 다섯 재질 경계 이름, 소스 owner `src/models/furnishings/bedrooms.ts`를 한 H2에서 주소로 정한다.
@evidence obligations/design/models.md#model-review-set 관찰을 모델 리뷰 뷰 링크의 고정 뷰로 찍고 재질 경계 이름은 표면 파티션 이름 규칙 링크를 따르게 한다.
@evidence obligations/design/models.md#reference-scale 매트리스 상면 H를 주침실 0.60 m, 작은 침실 0.55 m로 방 예약에서 받아 매트리스 Y = [0.30, H − 0.03]과 덮개 0.03 m가 그 높이에 맞도록 부품 치수를 유도한다.
-->

레퍼런스 05의 주침실 침대와 02의 작은 침실 두 침대를 같은 머리판 계열로 채택한다. 세 크기는 각 방 예약에서 받는다.

침대는 폭 W, 길이 L, 매트리스 상면 H, 머리판 상단 B를 받는 한 원형이다. [주침실 예약](../spaces/rooms/primary.md#primary-furniture-use) X = [-1.50, 0.65], Z = [-8.65, -7.05]는 L = 2.15 m, W = 1.60 m, H = 0.60 m, B = 1.00 m이고 머리가 +X다. [둘째 침실](../spaces/rooms/bedroom-two.md#bedroom-two-furniture-use) X = [-5.25, -4.10], Z = [-4.50, -2.35]와 [셋째 침실](../spaces/rooms/bedroom-three.md#bedroom-three-furniture-use) X = [-0.25, 0.90], Z = [-3.10, -0.95]는 L = 2.15 m, W = 1.15 m, H = 0.55 m, B = 0.95 m이고 머리가 -Z다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)를 따르며 +Z가 발끝 방향이며 높이는 상층 완성 바닥 기준이다.

부품은 머리판, 프레임, 매트리스, 침구 덮개, 베개다. 머리판은 두께 0.06 m, 전체 폭 W다. 프레임은 Y = [0.10, 0.30], 네 모서리 다리 0.10 m 위에 놓인다. 매트리스는 Y = [0.30, H − 0.03], 침구 덮개는 매트리스 위 0.03 m 두께로 발끝과 양옆으로 0.02 m 내려와 외곽 안에 머문다. 베개는 주침실 둘, 작은 침실 하나로 각 0.60 × 0.40 × 0.12 m이며 머리판 앞에 둔다. 재질 경계는 `headboard`, `bed-frame`, `mattress`, `bedding`, `pillow`이고 회베이지·올리브·청회색 침구는 materials가 배치별로 정한다. 관절은 없고 이불 주름은 표현하지 않는다.

소스 owner는 `src/models/furnishings/bedrooms.ts`다. 관찰은 측면에서 H와 B가 배치별 값과 같은지, 위에서 외곽이 세 예약과 같은지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 협탁과 등 {#nightstand-lamp}
<!--
@evidence principles/core/common.md#scope-preservation 주침실 두 협탁과 두 작은 침실의 협탁 하나씩을 S·T·U 세 인자의 한 원형으로 받아 등까지 포함한다.
@evidence principles/core/common.md#substantive-completion 등 받침 지름 0.14 m, 갓 지름 0.25 m·높이 0.22 m 원뿔대, 서랍 전면이 상면 아래 0.15 m라는 치수를 확정한다.
@evidence principles/core/common.md#declared-basis S·T·U는 방 예약 링크의 값이고 서랍 전면이 강체인 근거를 방 문서가 협탁 서랍 작동을 예약하지 않았다는 데 둔다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 방 예약은 협탁 외곽과 상면·등 상단 높이만 주고 이 H2는 몸통·서랍 전면·등 받침·기둥·갓 부품 구성과 갓 상단을 U에 맞추는 결정을 더한다.
@evidence principles/design/models.md#representation-contract 몸통, 강체 서랍 전면, 등 받침·기둥·원뿔대 갓 계층과 `carcass`·`drawer-front`·`lamp-base`·`lamp-shade` 경계를 두고 빛 방출은 lighting 소유로 넘긴다. 보이지 않는 한계는 본문의 "등 전선·스위치·갓의 반투명은 표현하지 않는다."로 밝힌다.
@evidence principles/design/models.md#spatial-convention 가구 국소 좌표에서 +Z를 서랍 정면으로 두고 갓 상단이 U 높이에 오게 한다.
@evidence principles/design/models.md#reviewable-structure 측면에서 T와 U 높이, 위에서 갓이 S 안에 드는지를 검토 실루엣으로 둔다.
@evidence principles/design/models.md#model-observable-style-basis 협탁과 등을 사각 몸통, 서랍 전면 하나, 지름 0.25 m 원뿔대 갓이라는 형태 결정으로 한정하고 조명 성능은 주장하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion S 0.50/0.45 m, T 0.55/0.50 m, U 1.10/1.05 m, 다섯 부품, 네 재질 경계, 강체 서랍, unverified 관찰이 함께 적혀 있다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 주침실 두 협탁과 두 작은 침실 협탁의 좌표·S·T·U를 적힌 그대로 소비했고 서랍 작동 예약이 없다는 부모 결정도 바꾸지 않았다.
@evidence settings/10-house.md#primary-bedroom 양옆 협탁과 조명 요구를 Z = [-9.15, -8.65]와 Z = [-7.05, -6.55] 두 협탁과 U 1.10 m 등으로 받는다.
@evidence settings/10-house.md#bedroom-two 협탁과 조명 요구를 X = [-3.95, -3.50] 협탁 하나와 U 1.05 m 등으로 받는다.
@evidence settings/10-house.md#bedroom-three 협탁/등 요구를 X = [1.05, 1.50], Z = [-3.10, -2.65] 협탁과 같은 S 0.45 m 원형 배치로 받는다.
@evidence spaces/rooms/primary.md#primary-furniture-use 주침실 두 협탁 예약 X = [0.15, 0.65]를 S 0.50 m, T 0.55 m, U 1.10 m로 소비한다.
@evidence spaces/rooms/bedroom-two.md#bedroom-two-furniture-use 둘째 침실 협탁 예약 X = [-3.95, -3.50], Z = [-4.50, -4.05]를 S 0.45 m, T 0.50 m로 소비한다.
@evidence spaces/rooms/bedroom-three.md#bedroom-three-furniture-use 셋째 침실 협탁 예약 X = [1.05, 1.50], Z = [-3.10, -2.65]를 S 0.45 m, U 1.05 m로 소비한다.
-->

레퍼런스 02의 침대 옆 협탁과 작은 조명을 채택한다. 레퍼런스 05에서 보이지 않는 램프 갓 치수는 예약 높이로 정한다.

협탁은 정사각 폭 S, 상면 T, 등 상단 U를 받는 한 원형이다. [주침실의 두 협탁](../spaces/rooms/primary.md#primary-furniture-use) X = [0.15, 0.65], Z = [-9.15, -8.65]와 Z = [-7.05, -6.55]는 S = 0.50 m, T = 0.55 m, U = 1.10 m다. [둘째 침실](../spaces/rooms/bedroom-two.md#bedroom-two-furniture-use) X = [-3.95, -3.50], Z = [-4.50, -4.05]와 [셋째 침실](../spaces/rooms/bedroom-three.md#bedroom-three-furniture-use) X = [1.05, 1.50], Z = [-3.10, -2.65]는 S = 0.45 m, T = 0.50 m, U = 1.05 m다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)를 따르며 +Z가 서랍 정면이다.

부품은 몸통, 서랍 전면 하나, 등 받침, 등 기둥, 갓이다. 서랍 전면은 상면 아래 0.15 m 높이이며 방 문서가 협탁 서랍 작동을 예약하지 않으므로 강체다. 등은 지름 0.14 m·높이 0.025 m 받침, 지름 0.018 m 기둥, 하단 지름 0.25 m·상단 지름 0.16 m·높이 0.22 m 원뿔대 갓이다. 갓 상단은 U, 갓 하단은 U − 0.22 m, 기둥은 받침 상단부터 갓 하단까지 이어진다. 재질 경계는 `carcass`, `drawer-front`, `lamp-base`, `lamp-shade`다. 빛 방출은 lighting 소유다. 등 전선·스위치·갓의 반투명은 표현하지 않는다. 소스 owner는 `src/models/furnishings/bedrooms.ts`다. 관찰은 측면에서 T와 U, 위에서 갓이 S 안에 드는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 낮은 서랍장 {#low-dresser}
<!--
@evidence principles/core/common.md#scope-preservation 주침실의 낮은 서랍장 하나를 몸통·다리 넷·서랍 여섯까지 모델로 맡는다.
@evidence principles/core/common.md#substantive-completion 길이 1.40 m, 깊이 0.50 m, 높이 0.80 m, 다리 0.08 m, 2열 × 3단 서랍과 최대 인출 0.40 m를 확정한다.
@evidence principles/core/common.md#declared-basis 외곽과 상면 0.80 m는 주침실 예약에서, 인출 0.40 m는 서랍 작동 예약 X = [-5.00, -4.60]과 같다는 근거로 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 방 예약은 외곽과 서랍 작동 범위만 주고 이 H2는 2열 × 3단 분할, 홈 손잡이, 피벗 이름을 더한다.
@evidence principles/design/models.md#representation-contract 몸통·다리·서랍 여섯 계층과 `carcass`·`drawer-front`·`handle`·`leg` 경계를 두고 손잡이를 돌출 없는 윗 모서리 홈으로 정한다. 보이지 않는 한계는 본문의 "서랍 레일·서랍 내부 칸막이는 표현하지 않는다."로 밝힌다.
@evidence principles/design/models.md#spatial-convention +Z를 서랍 정면으로 두고 yaw π/2에서 world +X가 된다고 밝히며 각 서랍 피벗이 +Z로 0.40 m까지 미끄러진다.
@evidence principles/design/models.md#reviewable-structure 서랍 0.40 m 인출 평면이 작업 범위 X = [-4.60, -4.00]로 넘어가지 않는지를 관절 영역 관찰로 둔다.
@evidence principles/design/models.md#model-observable-style-basis 낮은 서랍장을 높이 0.80 m, 0.08 m 다리, 2열 × 3단 전면, 돌출 없는 홈 손잡이라는 관찰 가능한 구성으로 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 외곽 치수, 여섯 서랍 층, 피벗 인터페이스, 네 재질 경계, 인출 관찰이 함께 적혀 있고 관찰은 unverified다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 주침실 서랍장 외곽 X = [-5.50, -5.00], Z = [-6.50, -5.10]과 서랍 작동 예약을 적힌 그대로 소비했고 부모 수정이 없었다.
@evidence settings/10-house.md#primary-bedroom 주침실의 낮은 서랍장 요구를 높이 0.80 m, 길이 1.40 m 서랍장으로 받는다.
@evidence spaces/rooms/primary.md#primary-furniture-use 주침실 서랍장 예약 X = [-5.50, -5.00], Z = [-6.50, -5.10]과 서랍 작동 예약 X = [-5.00, -4.60]을 외곽과 인출 한계로 소비한다.
@evidence obligations/design/models.md#articulation-ownership 여섯 서랍 피벗을 `drawer-<열>-<단>`으로 이름 붙이고 +Z 최대 0.40 m 미끄럼을 이 모델의 움직임 인터페이스로 정한다.
-->

레퍼런스 05 주침실 문 너머의 어두운 서랍장 실루엣을 채택한다. 여섯 서랍 분할은 사진에서 세지 않고 수납 기능으로 정한다.

서랍장은 [주침실 예약](../spaces/rooms/primary.md#primary-furniture-use)의 X = [-5.50, -5.00], Z = [-6.50, -5.10], 상면 0.80 m를 외곽으로 받아 길이 1.40 m, 깊이 0.50 m, 높이 0.80 m다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)를 따르며 +Z는 서랍 정면(yaw π/2에서 world +X)이다.

부품은 몸통, 다리 넷(0.08 m), 서랍 여섯(2열 × 3단)이다. 각 서랍은 피벗 `drawer-<열>-<단>`으로 +Z로 최대 0.40 m 미끄러져 [서랍 작동 예약 X = [-5.00, -4.60]](../spaces/rooms/primary.md#primary-furniture-use)과 같고, 손잡이는 서랍 윗 모서리 홈이라 돌출이 없다. 재질 경계는 `carcass`, `drawer-front`, `handle`, `leg`다. 서랍 레일·서랍 내부 칸막이는 표현하지 않는다. 소스 owner는 `src/models/furnishings/bedrooms.ts`다. 관찰은 서랍 0.40 m 인출 평면이 작업 범위 X = [-4.60, -4.00]로 넘어가지 않는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 작은 책상 {#child-desk}
<!--
@evidence principles/core/common.md#scope-preservation 두 작은 침실의 책상을 길이 L 한 인자의 원형으로 받고 상판·다리·선반·소품까지 맡는다.
@evidence principles/core/common.md#substantive-completion 깊이 0.60 m, 상면 0.75 m, 상판 0.03 m, 다리 0.04 m 각, 선반 0.10 m 높이, 소품을 상판 뒤쪽 0.25 m 안에 두는 값을 확정한다.
@evidence principles/core/common.md#declared-basis L 1.20/1.15 m는 방 예약에서 받고 램프 대신 책 세 권 묶음과 연필꽂이를 둔다는 소품 선택은 이 H2의 저작 결정으로 적힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 방 예약은 책상 외곽만 주고 이 H2는 앞으로 열리지 않는 얕은 칸막이 선반과 무릎 공간 0.62 m를 더한다.
@evidence principles/design/models.md#representation-contract 상판·다리 넷·칸막이 선반·소품 계층과 `top`·`leg`·`shelf`·`prop` 경계를 두고 관절이 없다고 적는다. 보이지 않는 한계는 본문의 "책 표지·연필 개별 형상·상판 모따기는 표현하지 않는다."로 밝힌다.
@evidence principles/design/models.md#spatial-convention 가구 국소 좌표에서 +Z를 앉는 쪽으로 두고 소품을 상판 뒤쪽 0.25 m 안에 배치한다.
@evidence principles/design/models.md#reviewable-structure 측면에서 상판 아래 무릎 공간 0.62 m가 비어 있는지를 음의 공간 관찰로 지정한다.
@evidence principles/design/models.md#model-observable-style-basis 작은 책상을 0.03 m 얇은 상판, 0.04 m 각 다리, 0.10 m 얕은 선반이라는 비례로 정하고 램프를 두지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion L 두 값, 상면 0.75 m, 네 부품 층, 네 재질 경계, 관절 없음, 무릎 공간 관찰이 함께 적혀 있고 관찰은 unverified다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 둘째·셋째 침실의 책상 예약 좌표와 L을 적힌 그대로 소비했고 고칠 부모 결함이 없었다.
@evidence settings/10-house.md#bedroom-two 책상 요구를 둘째 침실 L = 1.20 m 책상으로 받는다.
@evidence settings/10-house.md#bedroom-three 책상 요구를 셋째 침실 L = 1.15 m 책상으로 받아 첫 자녀 방과 같은 학습 기능을 준다.
@evidence spaces/rooms/bedroom-two.md#bedroom-two-furniture-use 둘째 침실 책상 예약 X = [-5.50, -4.90], Z = [-1.60, -0.40]을 L = 1.20 m로 소비한다.
@evidence spaces/rooms/bedroom-three.md#bedroom-three-furniture-use 셋째 침실 책상 예약 X = [1.40, 2.55], Z = [-0.85, -0.25]를 L = 1.15 m로 소비한다.
-->

레퍼런스 02의 작은 침실에서는 책상 소품이 보이지 않으므로 책·연필 개수를 사진 근거로 주장하지 않는다. 방 예약과 설정의 공부 자리를 원형으로 만든다.

책상은 길이 L을 받는 한 원형이며 깊이 0.60 m, 상면 0.75 m다. [둘째 침실](../spaces/rooms/bedroom-two.md#bedroom-two-furniture-use) X = [-5.50, -4.90], Z = [-1.60, -0.40]은 L = 1.20 m, [셋째 침실](../spaces/rooms/bedroom-three.md#bedroom-three-furniture-use) X = [1.40, 2.55], Z = [-0.85, -0.25]는 L = 1.15 m다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)를 따르며 +Z는 앉는 쪽이다.

부품은 상판(0.03 m), 다리 넷(0.04 m 각), 상판 아래 앞으로 열리지 않는 얕은 칸막이 선반 하나(0.10 m 높이)다. 책상 소품은 램프 대신 0.20 × 0.14 × 0.025 m 책 세 권을 쌓아 높이 0.075 m로, 지름 0.065 m·높이 0.10 m 원통 연필꽂이 하나와 지름 0.006 m·높이 0.18 m 연필 넷을 상판 뒤쪽 0.25 m 안에 둔다. 책은 `book`, 컵은 `container`, 연필은 `pencil`이고 책상 구조는 `top`, `leg`, `shelf`다. 각 닫힌 면에는 이 여섯 id 중 하나를 붙이고 상판·책은 국소 가로 U·세로 V, 원통은 둘레 U·높이 V 미터 UV를 둔다. 관절은 없다. 책 표지·연필 개별 형상·상판 모따기는 표현하지 않는다. 소스 owner는 `src/models/furnishings/bedrooms.ts`다. 관찰은 측면에서 상판 아래 무릎 공간 0.62 m가 비어 있는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 책상 의자 {#desk-chair}
<!--
@evidence principles/core/common.md#scope-preservation 두 작은 침실의 책상 의자를 식탁 의자와 구별되는 별도 원형으로 맡는다.
@evidence principles/core/common.md#substantive-completion 몸체 예약이 없는 의자에 폭 0.45 m, 깊이 0.48 m, 좌면 0.45 m, 등받이 0.82 m를 확정한다.
@evidence principles/core/common.md#declared-basis 치수 근거를 책상 상면 0.75 m와 0.30 m 차이의 앉은 자세, 사용 영역 안에서 밀고 당기는 여유로 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 식탁 의자 링크와 같은 좌면·다리·등받이 구성을 쓰되 등받이가 낮고 폭이 좁다는 차이로 별도 원형임을 밝힌다.
@evidence principles/design/models.md#representation-contract 좌면·다리·등받이 계층과 `seat`·`leg`·`back` 경계를 두고 관절이 없다고 적는다. 보이지 않는 한계는 본문의 "좌판 곡면·다리 이음·바퀴는 표현하지 않는다."로 밝힌다.
@evidence principles/design/models.md#spatial-convention 의자 사용 예약 0.75 × 0.75 m 안에 폭 0.45 m·깊이 0.48 m 몸체를 두는 치수 관계를 정한다.
@evidence principles/design/models.md#reviewable-structure 밀어 넣은 상태에서 의자가 책상 다리 사이에 드는지를 검토 관찰로 둔다.
@evidence principles/design/models.md#model-observable-style-basis 책상 의자를 식탁 의자보다 낮은 등받이 0.82 m와 좁은 폭 0.45 m라는 비례 차이로 구분한다.
@evidence principles/design/models.md#model-scale-layer-completion 외곽과 좌면·등받이 치수, 좌판 두께·다리 단면과 위치·등판 치수, 세 재질 경계, 관절 없음, 밀어 넣기 관찰이 함께 적혀 있고 관찰은 unverified다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 둘째 침실 의자 사용 예약 0.75 × 0.75 m를 적힌 그대로 소비했고 몸체 예약 부재를 부모 결함으로 고치지 않고 이 층이 치수를 택했다.
@evidence settings/10-house.md#bedroom-two 책상과 의자 요구 중 의자를 좌면 0.45 m 책상 의자로 받는다.
@evidence settings/10-house.md#bedroom-three 책상/의자 요구의 의자를 같은 원형으로 두 침실에 쓴다고 적는다.
@evidence spaces/rooms/bedroom-two.md#bedroom-two-furniture-use 둘째 침실 의자 사용 예약 0.75 × 0.75 m 안에서 쓰는 의자로 소비한다.
-->

레퍼런스 02·05에는 책상 의자의 형태가 보이지 않으므로 그 사진에서 등받이 모양을 채택하지 않는다. 두 방의 책상과 사용 예약에 맞는 단순한 등판 의자를 이 H2에서 결정한다.

책상 의자는 두 침실의 [의자 사용 예약](../spaces/rooms/bedroom-two.md#bedroom-two-furniture-use) 0.75 × 0.75 m 안에서 쓰는 한 원형이다. 몸체 예약이 없으므로 폭 0.45 m, 깊이 0.48 m, 좌면 0.45 m, 등받이 0.82 m를 이 층이 택하며, 근거는 책상 상면 0.75 m와 0.30 m 차이의 앉은 자세와 사용 영역 안에서 밀고 당기는 여유다. [식탁 의자](10-kitchen-dining.md#dining-chair)와 같은 좌면·다리·등받이 구성을 쓰되 등받이가 낮고 폭이 좁아 별도 원형이다.

좌판은 폭 0.45 m·깊이 0.48 m·두께 0.03 m로 상면 0.45 m다. 다리 네 개는 0.035 m 각재, 좌판 모서리에서 X·Z 각각 0.04 m 안쪽에 중심을 둔다. 등받이는 뒤쪽 두 다리에서 이어지는 같은 단면의 기둥 두 개와 폭 0.35 m·높이 0.18 m·두께 0.025 m 판 하나이며 판 하단은 0.62 m, 상단은 0.80 m, 기둥 상단은 0.82 m다. 등판은 앞뒤로 기울이지 않고 좌판 뒤 가장자리에서 0.04 m 앞에 두므로 의자 깊이 0.48 m 안에 든다. 재질 경계는 `seat`, `leg`, `back`이고 관절은 없다. 좌판 곡면·다리 이음·바퀴는 표현하지 않는다. 소스 owner는 `src/models/furnishings/bedrooms.ts`다. 관찰은 밀어 넣은 상태에서 의자가 책상 다리 사이에 드는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 미닫이 옷장 {#sliding-closet}
<!--
@evidence principles/core/common.md#scope-preservation 둘째·셋째 침실 옷장 두 예약을 한 원형으로 받고 문·봉·선반·옷까지 맡는다.
@evidence principles/core/common.md#substantive-completion 폭 1.50 m, 깊이 0.60 m, 높이 2.20 m, 문 폭 0.76 m·두께 0.02 m, 봉 뒤에서 0.28 m·높이 1.65 m, 윗선반 1.85 m를 확정한다.
@evidence principles/core/common.md#declared-basis 외곽과 -X 면 미닫이 문은 두 방 예약에서, 문·봉·선반 치수는 이 H2의 저작 값으로 적힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 방 예약은 옷장 외곽과 문 면만 주고 이 H2는 앞뒤 두 레일 미닫이 문, 봉, 윗선반, 걸린 옷 덩어리를 더한다.
@evidence principles/design/models.md#representation-contract 몸통·두 문·봉·윗선반·옷 계층과 `carcass`·`leaf`·`handle`·`rail`·`rod`·`shelf`·`clothes` 경계를 둔다. 보이지 않는 한계는 본문의 "미닫이 롤러·레일 단면·옷걸이 개별 형상은 표현하지 않는다."로 밝힌다.
@evidence principles/design/models.md#spatial-convention +Z를 문 면으로 두고 문이 로컬 X 방향으로 최대 0.72 m 미끄러지며 몸체 깊이 안에서만 움직인다고 정한다.
@evidence principles/design/models.md#reviewable-structure 문이 열린 상태에서도 몸체 앞면 밖으로 나오지 않는지를 관절 영역 관찰로 둔다.
@evidence principles/design/models.md#model-observable-style-basis 미닫이 옷장을 앞뒤 두 레일, 0.76 m 두 문, 2.20 m 높이라는 관찰 가능한 구성으로 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 외곽 치수, 다섯 부품 층, 두 문 피벗, 일곱 재질 경계, 열린 문 관찰이 함께 적혀 있고 관찰은 unverified다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 둘째·셋째 침실 옷장 예약의 좌표와 1.50 × 0.60 × 2.20 m, -X 문 면을 적힌 그대로 소비했고 부모 수정이 없었다.
@evidence settings/10-house.md#bedroom-two 옷 수납 요구를 X = [-2.55, -1.95] 미닫이 옷장으로 받는다.
@evidence settings/10-house.md#bedroom-three 옷 수납 요구를 X = [4.90, 5.50] 미닫이 옷장으로 받아 첫 자녀 방 좌표를 복사하지 않는다.
@evidence settings/10-house.md#storage 침실 옷장에 문짝·옷걸이 봉·윗선반과 깊이 0.60 m 내부를 둬 빈 문짝으로 대신하지 않는다.
@evidence spaces/rooms/bedroom-two.md#bedroom-two-furniture-use 둘째 침실 옷장 예약 X = [-2.55, -1.95], Z = [-2.95, -1.45]를 폭 1.50 m 원형으로 소비한다.
@evidence spaces/rooms/bedroom-three.md#bedroom-three-furniture-use 셋째 침실 옷장 예약 X = [4.90, 5.50], Z = [-2.80, -1.30]을 같은 원형으로 소비한다.
@evidence obligations/design/models.md#articulation-ownership 문 피벗을 `door-front`, `door-back`으로 이름 붙이고 로컬 X 최대 0.72 m 미끄럼을 움직임 인터페이스로 정한다.
-->

레퍼런스 02의 작은 침실 수납과 05의 열린 옷장을 채택한다. 문짝 두께와 옷 개수는 사진에서 재지 않고 예약과 이 H2의 수치로 정한다.

옷장은 [둘째 침실](../spaces/rooms/bedroom-two.md#bedroom-two-furniture-use) X = [-2.55, -1.95], Z = [-2.95, -1.45]와 [셋째 침실](../spaces/rooms/bedroom-three.md#bedroom-three-furniture-use) X = [4.90, 5.50], Z = [-2.80, -1.30]에 쓰는 한 원형이다. 두 예약 모두 폭 1.50 m, 깊이 0.60 m, 높이 2.20 m이고 -X 면에 미닫이 문을 둔다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)를 따르며 +Z는 문 면이다.

부품은 몸통, 앞뒤 두 레일 위의 미닫이 문 둘(각 폭 0.76 m, 두께 0.02 m), 옷걸이 봉(뒤에서 0.28 m, 높이 1.65 m), 윗선반(1.85 m), 걸린 옷 덩어리다. 문 피벗 `door-front`, `door-back`은 로컬 X 방향으로 최대 0.72 m 미끄러지며 몸체 깊이 안에서만 움직인다. 재질 경계는 `carcass`, `leaf`, `handle`, `rail`, `rod`, `shelf`, `clothes`다. 미닫이 롤러·레일 단면·옷걸이 개별 형상은 표현하지 않는다. 소스 owner는 `src/models/furnishings/bedrooms.ts`다. 관찰은 문이 열린 상태에서도 몸체 앞면 밖으로 나오지 않는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 주침실 두 창의 얇은 커튼 {#primary-window-curtains}
<!--
@evidence principles/core/common.md#scope-preservation 주침실 후면 2.40 m와 왼쪽 1.60 m 두 창에 같은 커튼 원형을 각각 결속하고 다른 방의 창이나 방 벽 마감을 소유하지 않는다.
@evidence principles/core/common.md#substantive-completion 창 폭 W와 높이 1.40 m, 상층 바닥 위 0.10–2.37 m 드레이프, 벽에서 0.12 m 이내 돌출, 양쪽 0.18 m 모임 폭, 봉·받침·커튼 표면 경계를 정한다.
@evidence principles/core/common.md#declared-basis 두 W와 개구부 Y = [3.91, 5.31] m는 rear/left 입면에서, 방 안쪽 돌출 0.12 m는 primary-furniture-use에서 받고 봉·드레이프 여유는 이 원형의 저작 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 공간은 두 창과 커튼의 돌출 상한만 예약했고 이 H2는 개방 상태의 두 끝 모임, 실루엣·부품·표면 분할을 더한다.
@evidence principles/design/models.md#representation-contract 봉·받침·양쪽 얇은 천 패널의 부품과 `rod`·`bracket`·`curtain` 표면을 구분하고 고정 개방 상태와 세 굵은 접힘만 표현을 밝힌다.
@evidence principles/design/models.md#spatial-convention 창의 안쪽 왼쪽 아래를 국소 원점, 개구부 너비를 U, 높이를 V, 방 안쪽을 +N으로 두고 두 입면의 축 회전만 배치에서 바꾼다.
@evidence principles/design/models.md#reviewable-structure 정면에서 두 끝 0.18 m 모임이 창 대부분을 열어 두는지, 측면에서 최대 돌출 0.12 m를 지키는지를 반증 견본으로 둔다.
@evidence principles/design/models.md#model-observable-style-basis 곧은 봉과 서로 분리된 얇은 두 드레이프를 두어 라벨 없이 주침실 창 커튼으로 읽히게 하고 직물 결·투과는 materials에 남긴다.
@evidence principles/design/models.md#model-scale-layer-completion 2.40/1.60 m 두 외곽, 0.12 m 돌출, 세 표면 id, 고정 개방 상태와 두 방향 리뷰를 함께 정한다.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work 주침실의 0.12 m 돌출 한도만으로는 봉의 좌우·상하 점유를 예약할 수 없어 spaces/rooms/primary.md#primary-furniture-use에 개구부 유도 폭 W + 0.20 m·높이 범위와 깊이 0.12 m의 커튼 띠를 추가했다.
@evidence settings/10-house.md#primary-bedroom 주침실을 자녀 침실과 구별하는 얇은 커튼을 후면·왼쪽 두 창에 제공한다.
@evidence spaces/envelope/rear.md#primary-rear-window X = [-3.85, -1.45] m의 후면 개구부를 W = 2.40 m 커튼 원형의 첫 배치로 받는다.
@evidence spaces/envelope/left.md#primary-left-window Z = [-8.90, -7.30] m의 측면 개구부를 W = 1.60 m 같은 원형의 둘째 배치로 받는다.
@evidence spaces/rooms/primary.md#primary-furniture-use 두 창 커튼의 host 유도 폭 W + 0.20 m·상하 범위와 방 안쪽 돌출 0.12 m를 `rod`·`bracket`·`curtain`의 전체 점유 상한으로 받는다.
@evidence obligations/design/models.md#representation-ceiling 얇은 드레이프의 큰 접힘만 원형 형상으로 두고 실밥·봉제·천의 동역학은 이 정적 모델이 주장하지 않는다.
-->

레퍼런스 05의 주침실 창에 걸린 얇은 회색 커튼을 채택한다. 접힌 주름 수는 사진 복제가 아니라 두 창폭의 규칙으로 정한다.

후면의 [주침실 창](../spaces/envelope/rear.md#primary-rear-window)은 폭 W = 2.40 m, 왼쪽의 [주침실 창](../spaces/envelope/left.md#primary-left-window)은 W = 1.60 m이며 두 개구부 모두 Y = [3.91, 5.31] m다. 같은 원형을 두 창의 안쪽 면에 각각 배치한다. 원형의 국소 원점은 개구부 안쪽 왼쪽 아래이며 U는 창 너비, V는 위쪽, +N은 방 안쪽이다. 후면과 왼쪽 배치는 축 회전만 다르고 치수식은 같다. 봉 중심은 개구부 아래 변 기준 국소 Y = 1.52 m(개구부 위 0.12 m)에 놓고 양끝으로 0.10 m씩 뻗는다. 드레이프는 국소 Y = -0.75 m(상층 완성 바닥 위 0.10 m)부터 봉 중심 Y = 1.52 m까지 이어지며 윗단 0.025 m를 봉 주위에 감싼다. 두 패널을 창 양끝에 각 0.18 m 폭으로 모은 고정 개방 상태다. 윗단과 봉은 같은 높이에서 닿으므로 0.0175 m 공중 틈이 없다.

부품은 지름 0.025 m 봉, 양끝 받침 둘, 양쪽 얇은 천 패널이다. 봉 중심은 안쪽 벽면에서 +N 0.06 m, 천의 중간 면은 각 패널의 가로 좌표 u ∈ [0, 0.18] m에 대해 `N(u) = 0.08 + 0.02 sin(6πu / 0.18)` m로 세 접힘을 만들고 두께 0.006 m를 그 양쪽에 둔다. 앞면 최대 N = 0.103 m다. 받침은 +N 0–0.08 m에 머무르므로 봉·받침·천의 앞면을 포함한 최대 돌출 0.103 m는 [주침실 사용 예약](../spaces/rooms/primary.md#primary-furniture-use)의 0.12 m 이내다. 표면 id는 `rod`, `bracket`, `curtain`이며 천 두 패널은 같은 재료 파티션을 공유한다. 얇은 천의 직조 결·투과는 materials가 결속하고, 실밥·봉제선·천의 동역학은 표현하지 않는다. 소스 owner는 `src/models/furnishings/bedrooms.ts`다. [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 정면에서 두 끝 0.18 m 모임이 창 대부분을 열어 두는지, 측면에서 최대 돌출 0.12 m와 창대·손잡이 간섭이 없는지 본다. 실제 부재·점유·GPU 프레임은 unverified다.

## 옷방 옷걸이 구간 {#wardrobe-hanging}
<!--
@evidence principles/core/common.md#scope-preservation 옷방 예약의 옷걸이 구간을 봉·상단 선반·몸통·옷까지 한 모델로 맡는다.
@evidence principles/core/common.md#substantive-completion 길이 2.15 m, 깊이 0.55 m, 봉 후면에서 0.28 m·높이 1.65 m, 상단 선반 2.05 m, 옷 판 두께 0.03–0.06 m·폭 0.50 m를 확정한다.
@evidence principles/core/common.md#declared-basis 외곽과 높이 2.05 m는 옷방 예약에서 받고 옷 판 치수와 고정 시드 배열은 이 H2의 저작 선택으로 적힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 옷방 예약은 외곽과 높이만 주고 이 H2는 봉 위치, 상단 선반, 고정 시드 옷 판 묶음을 더한다.
@evidence principles/design/models.md#representation-contract 봉·상단 선반·몸통·옷 계층과 `rod`·`shelf`·`carcass`·`clothes` 경계를 두고 관절이 없다고 적는다. 보이지 않는 한계는 본문의 "옷걸이 개별 형상·소매·옷 주름은 표현하지 않는다."로 밝힌다.
@evidence principles/design/models.md#spatial-convention 옷 판을 뒤벽과 0.55 m 앞면 사이에 머물게 해 점유 범위를 Z = [-10.45, -9.90] 안으로 한정한다.
@evidence principles/design/models.md#reviewable-structure 위에서 옷 앞 끝이 Z = -9.90 m를 넘지 않는지를 검토 실루엣으로 둔다.
@evidence principles/design/models.md#model-observable-style-basis 걸린 옷을 두께 0.03–0.06 m, 폭 0.50 m 판 묶음이라는 추상화 결정으로 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 외곽 치수, 네 부품 층, 네 재질 경계, 관절 없음, 옷 앞 끝 관찰이 함께 적혀 있고 관찰은 unverified다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 옷방 예약 X = [2.10, 4.25], Z = [-10.45, -9.90], 높이 2.05 m를 적힌 그대로 소비했고 부모 수정이 없었다.
@evidence settings/10-house.md#primary-bedroom 주침실의 별도 옷 수납 요구 중 옷걸이 구간을 길이 2.15 m 봉과 선반으로 받는다.
@evidence settings/10-house.md#storage 옷걸이 봉과 상단 선반, 0.55 m 실제 내부 깊이를 둬 수납을 빈 문짝으로 대신하지 않는다.
@evidence spaces/rooms/wardrobe.md#wardrobe-storage-use 옷방 예약 X = [2.10, 4.25], Z = [-10.45, -9.90]과 높이 2.05 m를 길이 2.15 m·깊이 0.55 m 외곽으로 소비한다.
@evidence obligations/design/models.md#representation-ceiling 옷을 고정 시드 판 묶음 대리 형상으로 두고 이 대리가 받치는 관찰을 위에서 옷 앞 끝이 Z = -9.90 m를 넘지 않는지로 한정한다.
-->

레퍼런스 05 복도 옆 열린 옷장의 걸린 옷을 채택한다. 36벌의 두께와 길이 순서는 사진의 옷을 세지 않고 결정 규칙으로 만든다.

옷걸이 구간은 [옷방 예약](../spaces/rooms/wardrobe.md#wardrobe-storage-use)의 X = [2.10, 4.25], Z = [-10.45, -9.90], 높이 상층 바닥 위 2.05 m를 외곽으로 받아 길이 2.15 m, 깊이 0.55 m다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)를 따른다. 봉은 후면에서 0.28 m, 높이 1.65 m이고 상단 선반은 상면 2.05 m, 깊이 0.55 m다. 옷은 36벌의 얇은 부피다. 순번 i = 0…35에 대해 두께 `0.035 + 0.005 × (i mod 3)` m, 앞뒤 폭 0.50 m, 걸린 길이 `0.85 + 0.10 × (i mod 3)` m로 고정한다. 두께 합은 1.44 m이며 길이 2.15 m 봉 중앙에 좌우 0.355 m씩 여유를 두고 순서대로 건다. 어깨는 봉 아래 0.05 m, 옷 아랫끝은 바닥 위 최소 0.55 m이며 뒤벽과 0.55 m 앞면 사이에 머문다. 재질 경계는 `rod`, `shelf`, `carcass`, `clothes`이고 관절은 없다. 옷걸이 개별 형상·소매·옷 주름은 표현하지 않는다. 소스 owner는 `src/models/furnishings/bedrooms.ts`다. 관찰은 위에서 옷 앞 끝이 Z = -9.90 m를 넘지 않는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

## 옷방 선반 구간 {#wardrobe-shelves}
<!--
@evidence principles/core/common.md#scope-preservation 옷방 예약의 선반 구간을 네 선반과 접은 옷·신발 상자까지 맡는다.
@evidence principles/core/common.md#substantive-completion 길이 1.10 m, 깊이 0.55 m, 선반 상면 0.20·0.65·1.10·1.55 m, 두께 0.03 m, 상자·바구니 각각 0.30 × 0.35 × 0.20 m를 확정한다.
@evidence principles/core/common.md#declared-basis 외곽은 옷방 예약에서 받고 0.20 m 시작과 0.45 m 간격의 네 단은 이 H2의 저작 값으로 적힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 옷방 예약은 선반 구간 외곽만 주고 이 H2는 네 단 높이와 접은 옷·신발 상자 대리를 더한다.
@evidence principles/design/models.md#representation-contract 선반·몸통·접은 옷·신발 상자·바구니 계층과 `shelf`·`carcass`·`folded`·`shoe-box`·`basket` 경계를 두고 관절이 없다고 적는다. 보이지 않는 한계는 본문의 "접은 옷의 층·신발 형상·선반 브래킷은 표현하지 않는다."로 밝힌다.
@evidence principles/design/models.md#spatial-convention 선반 높이를 바닥 위 0.20 m부터 0.45 m 간격으로 정하고 가구 국소 좌표를 따른다.
@evidence principles/design/models.md#reviewable-structure 정면에서 네 단이 읽히는지를 검토 실루엣으로 둔다.
@evidence principles/design/models.md#model-observable-style-basis 개방 선반을 0.03 m 얇은 네 단, 0.30 × 0.35 × 0.20 m의 상자 세 개와 바구니 하나, 접은 옷 여덟 더미로 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 외곽 치수, 네 단 높이, 다섯 재질 경계, 관절 없음, 정면 관찰이 함께 적혀 있고 관찰은 unverified다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 옷방 예약 X = [4.40, 5.50], Z = [-10.45, -9.90]을 적힌 그대로 소비했고 부모 수정이 없었다.
@evidence settings/10-house.md#storage 선반과 접은 옷·신발 상자를 둔 0.55 m 깊이 선반 구간으로 수납의 선반 요구를 받는다.
@evidence settings/10-house.md#primary-bedroom 주침실의 별도 옷 수납 요구 중 접은 옷 선반 몫을 네 단 선반 구간으로 받는다.
@evidence spaces/rooms/wardrobe.md#wardrobe-storage-use 옷방 예약 X = [4.40, 5.50], Z = [-10.45, -9.90]을 길이 1.10 m·깊이 0.55 m 외곽으로 소비한다.
@evidence obligations/design/models.md#model-representation-completion 이 파일 마지막 H2로서 네 단 높이·상자와 바구니 치수·다섯 재질 경계·관절 없음을 적고 정면 관찰이 unverified임을 밝혀 이 H2의 표현 완결 몫을 기록한다.
-->

선반 구간은 [옷방 예약](../spaces/rooms/wardrobe.md#wardrobe-storage-use)의 X = [4.40, 5.50], Z = [-10.45, -9.90]을 받아 길이 1.10 m, 깊이 0.55 m다. 네 선반 상면은 바닥 위 0.20 m부터 0.45 m 간격인 0.20, 0.65, 1.10, 1.55 m이고 두께 0.03 m다. 각 선반마다 접은 옷 두 더미와 오른쪽 용기 하나를 좌우로 둔다. 아래 세 선반의 용기는 신발 상자, 맨 위 선반의 용기는 레퍼런스 05의 바구니로 채택한다. 더미는 각각 0.28 × 0.32 × 0.12 m, 상자와 바구니는 모두 0.30 × 0.35 × 0.20 m이며 바구니는 벽 두께 0.015 m의 열린 상자와 양옆 지름 0.025 m 둥근 손잡이 두 개로 만든다. 바구니 입구는 위로 열리고, 0.02 m 간격 두 개를 포함한 가로 합은 0.90 m라 선반 길이 1.10 m 안에 양끝 0.10 m씩 남는다. 네 선반에 더미 8개와 상자 3개·바구니 1개가 생기고 각 높이는 다음 선반과의 0.45 m 간격보다 작다. 로컬 좌표는 [가구 국소 좌표](00-model-frame.md#model-furniture-local-frame)를 따른다. 재질 경계는 `shelf`, `carcass`, `folded`, `shoe-box`, `basket`이고 관절은 없다. 접은 옷의 층·신발 형상·선반 브래킷은 표현하지 않는다. 소스 owner는 `src/models/furnishings/bedrooms.ts`다. 관찰은 정면에서 네 단이 읽히는지다. 관찰은 [모델 리뷰 뷰](00-model-frame.md#model-review-set)의 고정 뷰로 찍고 재질 경계 이름은 [표면 파티션 이름 규칙](00-model-frame.md#model-surface-partition-naming)을 따르며, 모든 관찰은 unverified다.

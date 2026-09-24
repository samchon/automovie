# 외피의 물리 접합

## 벽 끝과 모서리의 맞닿음 {#wall-junctions}

<!--
@evidence principles/core/common.md#scope-preservation 네 외곽 모서리·spine T 접합·현관 반환부를 모두 처리하되 방 수나 통행 관계를 바꾸지 않는다.
@evidence principles/core/common.md#substantive-completion 외곽은 등거리 대각면, 가지 벽은 관통벽 접면에서 끝내는 규칙으로 중복 체적을 없앤다.
@evidence principles/core/common.md#declared-basis 공유 기준선과 경계 인접성을 입력으로 받아 같은 두께의 모서리 영역 배정을 유도한다.
@evidence principles/design/spaces.md#space-topology 접촉 내부 면은 두 공간 사이의 새 통로나 노출 마감이 아니며 기존 L/T 연결을 닫는 접면이다.
@evidence principles/design/spaces.md#space-boundary-authority junctions는 절단 입력만 계산하고 실제 벽과 완결 외측 면은 입면/boundaries의 원래 owner에 남긴다.
@evidence principles/design/spaces.md#space-verification-address 모든 L/T 접합에서 겹친 체적은 외피 겹침 스캔으로, 빈 틈·노출 내부 끝마개는 접합 관찰로, 접면의 단면은 뷰어의 정확한 연직 단면으로 읽는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 회벽 외피의 연속 요구를 대각 맞댐과 가지 벽 끝 범위로 구체화해 서로 다른 입면의 실체 중첩을 막는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work walls의 두꺼운 실체와 fixed-graph의 직사각 외곽을 함께 읽었다. 같은 두께의 대각 접합과 내부 T 접합으로 연속 면을 만들 수 있어 상위 외곽을 변형하지 않았다.
@evidence settings/20-envelope.md#walls 회벽 외피의 모서리가 겹친 상자 끝으로 보이지 않게 실제 벽 접촉을 닫는다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 외곽 네 모서리, spine과 가로벽 T 접합, 현관 후퇴벽·반환벽 끝이 모두 규칙과 단면 관찰에 들어 방 수나 문을 바꾸지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 등거리 대각면과 관통벽 접면에서 끝나는 가지 벽의 X 범위가 기준선 이름으로 적혀 source가 접합 위치를 새로 고르지 않는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 모서리 배정은 기준선과 경계 인접성에서 유도되고 단면 판독의 근거는 관찰 소유의 section 묶음이며, 아직 판정에서 읽지 않은 단면 결과를 unverified로 한정한다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 접촉 내부 면을 새 통로나 노출 마감으로 세지 않는다는 문장이 L/T 접합을 닫는 접면으로 한정한다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 현관 후퇴벽·반환벽은 남측 외피의 물리 소유이고 boundaries가 두 번째 실체를 만들지 않으며 접합 단면 관찰은 observations가 소유한다고 가리켜 이중 저작이 없다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 겹친 체적은 스캔 수치, 틈·끝마개는 접합 관찰 화면, 접면은 L/T 접합마다 둔 연직 단면으로 나눠 접합마다 반증 수단이 있고 판독 전 결과는 unverified다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모의 연속 회벽 요구에 대각 맞댐과 가지 벽 끝 범위라는 접합 규칙을 더했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 직사각 외곽과 0.6m 외벽이 대각·T 접합으로 함께 성립해 부모 외곽을 바꿀 필요가 없었다.
@evidenceReview settings/20-envelope.md#walls #35026c5 네 입면의 바깥 면이 전 길이로 원래 입면에 남아 겹친 상자 끝이 회벽 모서리를 대신하지 않는다.
-->

[공유 기준선](building.md#plan-datums)과 [경계의 인접 관계](openings.md#boundary-ownership)를 소비한다. 이 결정은 방의 수·경계·문·통행을 바꾸지 않고, 같은 벽 교차부를 두 실체가 동시에 차지하지 않게 한다. source `src/spaces/junctions.ts`는 경계의 절단 입력과 접면 관계를 계산하고 완결 입면이나 방 표면을 소유하지 않는다. 물리벽은 기존 입면 또는 boundaries 소유가 그 입력으로 만든다.

직사각형 외곽의 네 모서리는 바깥 꼭짓점과 안쪽 꼭짓점을 잇는 수직 대각면으로 맞댄다. 같은 두께의 두 외벽이 겹치는 정사각 영역에서 각 입면의 바깥 평면까지의 수평 거리가 작은 쪽 벽에 체적을 배정한다. 같은 거리인 대각면은 부피 없는 공통 접면이다. 따라서 서·동·남·북의 완결 외측 면은 각각 원래 입면에 전 길이로 남고, 모서리에서 다른 입면의 끝마개를 겹쳐 그리지 않는다. 낮은 마당 벽도 같은 평면 접합을 쓰되 높이는 그 벽의 기존 소유를 따른다.

내부 T 접합은 관통하는 벽의 접면에서 가지 벽을 끝낸다. 서·동 spine은 north-inner~south-inner 사이에 놓이고, 제실 남벽의 X 끝은 west-ring/east-ring, 오른쪽 가로 벽의 X 끝은 east-room/east-inner다. 이로써 외벽·spine과 가지 벽의 접면은 맞닿고 체적은 겹치지 않는다. 현관 후퇴벽의 X 끝은 west-porch-outer/east-porch-outer이며 반환벽은 entrance-front에서 south-outer까지다. 반환벽의 바깥 X 면이 남측 외벽의 중앙 절단 끝에 맞닿는다. 현관 후퇴벽·반환벽은 남측 외피의 물리 소유이고 boundaries가 두 번째 실체를 만들지 않는다.

접면의 양쪽 element와 면 주소는 보존하되 접촉 내부 면을 노출 마감이나 두꺼운 틈으로 그리지 않는다. 외부/방 쪽의 완결 시각 표면은 [소유 지도](ownership.md#surface-map)를 유지한다. 판정은 [관찰 소유](observations.md#geometry-observations)의 모든 L/T 접합에서 빈 틈·중복 체적·노출된 내부 끝마개를 읽고 공유 기준선의 허용 오차와 비교한다. 중복 체적은 외피 겹침 전수 스캔이 수치로 재고, 빈 틈과 내부 끝마개의 노출은 접합 관찰 위치의 화면으로 본다. 접면의 단면은 [관찰 소유](observations.md#geometry-observations)의 `section` 묶음이 외곽 네 모서리의 L 접합과 spine·제실 남벽·오른쪽 가로벽·현관 후퇴벽의 T 접합마다 둔 연직 단면을 뷰어의 단면 검사로 읽는다. 그 단면을 아직 판정에서 읽지 않았으므로 단면 판독 결과는 unverified다.

## 박공과 지붕 아래의 닫힌 경계 {#gable-closures}

<!--
@evidence principles/core/common.md#scope-preservation 외쪽 지붕 끝의 파라펫, 제실·동측·포치 박공, 제실 측벽과 떠 있는 처마, 제실 처마가 지나는 봉헌실 파라펫, 날개 안 높이 차이를 각각 폐쇄 owner에 배정한다.
@evidence principles/core/common.md#substantive-completion 파라펫이 지붕 위로 솟아 닫는 끝, 벽 두께 안 roof 하부까지의 상단, roof-only 높이 차이 폐쇄와 떠 있는 처마, 코핑과 지붕의 높이 관계를 구분한 접점 표를 제공한다.
@evidence principles/core/common.md#declared-basis 높이와 경사는 합성된 roof, 코핑 높이는 남측 입면을 소비하며 이 표는 기존 벽의 연장과 노출 표면 귀속, 그 사이 여유만 정한다.
@evidence principles/design/spaces.md#space-topology 파라펫·제실 벽·후퇴벽처럼 이미 있는 경계만 연장하고 주랑 위 높이 차이를 바닥부터 막는 새 벽이나 옥상 공간을 만들지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 벽 면을 지붕 아래 실내 마감·지붕 두께 안 접면·지붕 위 외면으로 나눠 기존 입면·방·roof에 돌리고 junctions가 새 표면 owner가 되지 않는다.
@evidence principles/design/spaces.md#space-verification-address 파라펫과 지붕의 만남, 박공 양면과 하부 단면, 제실 처마 아래와 파라펫 위, 문 head·창을 함께 놓고 실체 겹침은 외피 겹침 스캔의 겹친 쌍 수로 잰다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 파라펫과 박공 요구에 벽 연장·띠 분할·roof 끝면만으로 닫는 접점별 경계를 더한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 수리된 roof-form의 파라펫·외쪽·박공과 ceilings의 노출 하부를 고정 순환에 대조했다. 기존 벽 연장과 roof 끝면만으로 닫혀 이 접합이 부모에 추가 결함을 드러내지 않았다.
@evidence settings/20-envelope.md#roof-form 외쪽 지붕 끝을 코핑 파라펫 뒤에 숨기고 박공 아래 벽은 경사 하부까지 닫는다.
@evidence settings/20-envelope.md#ceilings 비거주 구조 틈은 추가 실내로 만들지 않고 제실·주랑의 노출 하부를 기존 공간 표면에 남긴다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 표가 외쪽 지붕 끝 파라펫, 제실·동측·포치 박공, 제실 처마 아래, 동측 박공 남쪽 끝의 코핑, 제실 서쪽 처마의 파라펫 통과, 날개 안 높이 차이를 모두 폐쇄 owner에 배정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 제실 남벽·서측 spine과 마당/보관실 끝벽 행이 낮은 쪽 상한 아래/위 경계 ID를 적고, 용마루 약 4.53m·기와 약 4.63m 대 코핑 아랫면 4.69m, 처마 하부 약 4.95m 대 코핑 윗면 4.85m가 접점마다 수치로 정해진다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 높이는 합성 roof와 남측 입면에서 소비하고 표는 벽 연장·표면 귀속·여유와 경계 주소만 적어 지붕 높이를 이 H2가 새로 정하지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 제실 처마와 파라펫 사이 틈을 외부로 두고 날개 지붕 위로 솟은 제실 벽을 외부 향 위쪽 경계로 주소화해 새 벽이나 옥상 공간, 아래 방과의 연결을 만들지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 용마루 덮개 줄이 코핑 돌출 끝에서 멈춘다는 규칙만 표에 두고 덮개 배치는 models/instances에, 나뉜 경계 ID는 경계 소유 H2에 남겨 표면·경계 소유를 가져가지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 외피 겹침 스캔(기본 0.01m 격자)의 겹친 쌍이 하나라도 있으면 실패로 정하고 박공 끝 하부 단면을 관찰 소유의 section 묶음에 이어 가려진 관통과 하부 틈이 드러난다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 파라펫·박공 요구에 접점별 벽 연장과 띠 분할, roof-only 폐쇄, 코핑과의 여유 규칙을 더했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 두 관통은 spaces의 지붕 선택에서 생긴 결함이고 수리된 부모 범위 안에서 고쳐져 부모 설정을 바꿀 필요가 없었다.
@evidenceReview settings/20-envelope.md#roof-form #7269ea1 서측·남측·북측 봉헌실 구간 파라펫이 외쪽 지붕 끝 위로 솟고 동측 박공 용마루도 코핑 아래에 머물러 부모의 파라펫 정면이 유지된다.
@evidenceReview settings/20-envelope.md#ceilings #c397437 낮은 천장 위 빈틈에 내부용 마감/문/관찰 방을 새로 만들지 않아 노출 하부와 비거주 틈을 구별한다.
-->

[지붕 합성](roofs/assembly.md#roof-junctions)의 상면·평행 하부면과 [코핑 높이](facades/south.md#south-envelope)를 소비한다. 지붕 밑 벽의 상단은 벽 두께 안 각 위치의 실제 지붕 하부까지 닫고, 외쪽 지붕의 높은 끝이 닿는 외곽 벽은 지붕 위로 코핑까지 솟는 파라펫이다. 지붕에 닿는 벽 면은 지붕 하부 아래의 실내/주랑 마감, 지붕 두께 안의 가려진 접면, 지붕 상면 위의 외면으로 나뉜다. 처마 기준 높이에서 수평으로 자르거나 그 높이를 경사지붕 위로 돌출시키지 않으며 주랑의 열린 cell 사이에 새로운 바닥부터의 막음벽을 만들지 않는다.

| 지붕 끝/접점 | 실체 경계와 노출 표면 소유 |
| --- | --- |
| 서측 외쪽 지붕의 서·북·남 끝 | 서측 외벽, 북측 외벽의 봉헌실 구간, 남측 외벽이 코핑까지 솟는 파라펫. 지붕 아래는 봉헌실/주랑, 지붕 위 파라펫 뒷면과 코핑은 해당 입면 소유 |
| 남쪽 주랑 외쪽 지붕의 남쪽 끝과 두 꼬리 | 남측 파라펫과 두 반환벽 파라펫. 반환벽의 주랑 쪽 면은 지붕 아래 주랑, 지붕 위는 남측 입면 소유 |
| 북쪽 주랑 외쪽 지붕의 북쪽 끝 | 제실 남벽이 제실 박공 하부까지 솟아 닫음. 지붕 상면 아래는 boundary-sanctuary-south, 위는 외부 향 boundary-sanctuary-south.upper로 주소가 나뉘는 같은 물리벽. 주랑 쪽 면은 지붕 아래와 위 모두 주랑, 제실 쪽은 제실 소유 |
| 서측 외쪽 지붕의 제실 쪽 끝 | 서측 spine의 제실 구간이 제실 지붕 하부까지 솟아 닫음. 지붕 상면 아래는 boundary-west-spine.sanctuary, 위는 외부 향 boundary-west-spine.sanctuary-upper. 봉헌실 쪽 면은 지붕 아래 봉헌실, 지붕 위로 드러난 제실 서측벽 외면은 서측 입면 소유 |
| 제실 북·남 박공 | 북측 외벽과 제실 남벽(boundary-sanctuary-south.upper)의 연장. 북쪽 바깥은 북측 입면, 남쪽은 주랑, 제실 쪽은 제실 소유 |
| 제실 처마 아래 | 서·남 처마는 봉헌실·북쪽 주랑 지붕 위에, 동쪽 처마는 마당 위에 떠 있음. 처마와 아래 지붕 사이는 외부이며 제실 측벽·남벽의 외면이 실내를 닫음 |
| 동측 박공 북쪽, 마당과 맞닿는 구간 | 물리벽은 동측 박공 하부까지 연장한다. 3.20m 아래 `boundary-yard-storage`는 마당/보관실 사이이고 그 위 `boundary-yard-storage.upper`는 보관실 하나의 외부 향 면이다. 완결 물리벽과 지붕 끝 막음 소유는 그대로다 |
| 동측 박공 남쪽 끝과 남동 모서리 | 남측 파라펫이 박공보다 높아 닫음. 19도 박공의 용마루 상면은 약 4.53m, 기와 약 0.10m를 더해 약 4.63m로 코핑 아랫면 4.69m보다 낮아 코핑 안쪽 돌출(south-inner에서 0.06m) 아래로 들어간다. 용마루 덮개 줄은 그 돌출 끝에서 멈춘다. 동측 외벽의 남동 모서리 칸은 코핑 높이로 올라 파라펫과 동측 처마 벽을 이음. 바깥은 남측·동측 입면 소유 |
| 제실 서쪽 처마와 봉헌실 구간 북측 파라펫 | 제실 서쪽 처마(west-room에서 0.35m)가 north-outer 너머까지 봉헌실 구간 파라펫과 그 코핑 위를 지난다. 처마 하부 약 4.95m가 코핑 윗면 4.85m보다 약 0.10m 높아 닿지 않고, 파라펫과 코핑은 처마 아래에서도 끊기지 않는다. 그 틈은 외부이며 봉헌실 쪽은 파라펫, 제실 쪽은 서측 spine이 닫음 |
| 포치 박공 | 앞: 기둥 위 보가 받는 삼각 막음(남측 입면 소유), 옆: 두 반환벽 파라펫, 뒤: 현관 후퇴벽이 포치 하부까지 올라 받치고 닫음. 후퇴벽 북면 중 남쪽 외쪽 지붕 위로 드러난 부분은 남측 입면 소유 |
| 날개 단위 안의 높이 차이 | 높은 조각 owner의 수직 끝면이 낮은 조각 상면까지 닫음. 주랑 cell 사이를 바닥부터 막는 벽은 없음 |

마당의 낮은 북·동 외벽 높이를 보관실 북쪽 박공에 복사하지 않는다. 파라펫은 지붕 위 외면과 코핑을 입면에 남기고 그 뒤에 올라갈 공간이나 난간을 만들지 않는다. 다른 지붕에 붙어 숨은 절단면을 외부 띠로 추가하지 않고, 낮은 천장 위 구조 빈틈에는 내부용 새 마감·문·층·관찰 방을 만들지 않는다. source에서 접합 계산은 junctions와 벽 띠 분할, 벽 실체는 기존 경계, 지붕 실체는 각 roof owner가 받는다.

관찰은 파라펫과 지붕의 만남 전 구간, 모든 박공 끝의 양면·지붕 하부 단면, 제실 처마와 아래 지붕·파라펫 사이, 마당에서 보관실 북쪽 끝을 올려다보는 위치를 포함한다. 벽·지붕·코핑·기단·바닥 실체의 양의 체적 겹침은 `npm run self-check`의 외피 겹침 전수 스캔(기본 0.01m 격자, 깊이 한계 0.001m)이 수치로 재며 겹친 쌍이 하나라도 있으면 실패다. 박공 끝 하부 단면은 [관찰 소유](observations.md#geometry-observations)의 `section` 묶음이 제실 북·남, 동측 박공 두 끝, 포치 앞뒤마다 둔다. 높은 창 void와 문 head의 상단도 이 단면에 함께 놓는다. 누광 틈, 지붕을 뚫는 벽 상단, 코핑 아래로 드러난 지붕 끝, 마당 하늘의 잘못된 폐쇄, 주랑 통행을 가르는 막음 중 하나라도 있으면 해당 접합과 소비자를 수리한다. 실체·그림자·방 읽힘은 source와 GPU 관찰에서 확인한다.

## 외벽 기단과 코핑의 단면 {#plinth-coping}

<!--
@evidence principles/core/common.md#scope-preservation 네 입면·반환벽·후퇴벽 양끝·남동 모서리·마당 벽의 코핑과 외곽 바깥면 전체의 기단을 한 단면 규칙에 넣고 개구부·현관 후퇴부의 예외를 함께 정한다.
@evidence principles/core/common.md#substantive-completion 코핑 두께 0.16m·돌출 0.06m, 기단 돌출 0.04m, 벽 실체가 코핑 아래에서 끝나는 높이와 모서리·T 접합·높은 벽 끝의 처리를 정한다.
@evidence principles/core/common.md#declared-basis 4.85m·0.65m는 남측 입면, 2.55m는 북측 입면, 지면은 site, 하단은 storey에서 받고 두께·돌출은 저작자 결정으로 표시한다.
@evidence principles/design/spaces.md#space-topology 코핑과 기단은 기존 벽 위·앞에 붙는 실체이며 파라펫 뒤 통로나 새 공간, 현관·서비스 문 통과를 막는 턱을 만들지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 높이 값은 각 owner를 소비하고 표면은 입면·서비스 마당 소유로 남기며 이 H2는 단면과 만남만 소유한다.
@evidence principles/design/spaces.md#space-verification-address 모서리 만남, 코핑과 만나는 세 지붕과 그 위를 지나는 제실 처마, 높은 벽 끝, 서비스 문 앞, 동·서 기단 경사를 관찰하고 실체 겹침은 외피 겹침 스캔으로 잰다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 외피 canon의 석재 기단과 남측의 석재 코핑이라는 부모 요구를 두께·돌출·모서리 규칙을 가진 실제 단면으로 바꾼다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work walls의 석재 기단, roof-form의 코핑 파라펫 범위(4.5~5.2m), 남측의 4.85m·0.65m, 대지 지면과 코핑 아랫면 4.69m에 닿는 세 지붕·제실 처마를 대조했다. 22도 동측 박공과 5.05m 제실 지지가 코핑을 뚫었지만 지붕 owner를 범위 안(19도, 5.35m)에서 고쳐 해결했고 부모 범위는 고치지 않았다.
@evidence settings/20-envelope.md#walls 연한 석재 기단을 황토 회벽과 다른 실제 두께의 띠로 나눠 재료 경계가 부재·높이 경계를 따르게 한다.
@evidence settings/20-envelope.md#roof-form 외곽 파라펫 윗단을 석재 코핑으로 마감하고 코핑 아랫면을 그와 만나는 지붕 상면보다 높게 둔다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 코핑 대상 다섯 종류의 윗단과 기단 대상 외곽 바깥면이 열거되고, 빠지는 곳은 서비스 문 앞과 현관 후퇴부 두 곳으로 이유와 함께 한정돼 있다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 0.16·0.06·0.04m와 받침면 높이, 정면 0.41m·북쪽 0.65m 기단 상단이 적혀 source가 단면을 새로 고를 여지가 없다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 네 높이 입력은 각 owner 링크로 받고 두께·돌출만 저작자 결정이라고 표시해 소비한 값과 새 결정이 구별된다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 기단이 현관 후퇴부와 서비스 문 앞에서 끊긴다는 문장이 두 출입 경로에 턱을 만들지 않고, 파라펫 뒤 새 공간도 없다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 코핑·기단 표면을 각 입면과 서비스 마당의 기존 ID로 남기고 지붕과의 여유 표는 gable-closures에 두어 한 관계를 두 곳이 정하지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 코핑 아랫면과 만나는 세 지붕의 높이(약 4.66·3.95·4.63m)와 제실 처마 여유(약 0.10m)를 적고 스캔 겹침 0으로 확인하게 해, 서측 한 곳만 본 이전 산술의 공백을 닫았다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모는 석재 기단·코핑의 존재와 두 높이만 줬고 두께·돌출·모서리·높은 벽 끝 규칙은 이 공간 단위가 더했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 코핑 관통 두 곳은 지붕 owner의 선택을 범위 안에서 바꿔 고쳐졌고 코핑 범위·기단 높이는 그대로라 부모 결함이 아니었다.
@evidenceReview settings/20-envelope.md#walls #35026c5 기단이 회벽 면 위 색 띠가 아니라 0.04m 앞으로 나온 실제 띠라서 재료 경계가 부재 경계를 따른다는 부모 조건을 지킨다.
@evidenceReview settings/20-envelope.md#roof-form #7269ea1 파라펫 윗단이 석재 코핑으로 끝나고 코핑과 만나는 세 지붕 상면이 모두 코핑 아래에 머물러 외곽 파라펫 정면이 유지된다.
-->

[외피 canon](../settings/20-envelope.md#walls)의 연한 석재 기단과 [남측 입면](facades/south.md#south-envelope)의 석재 코핑을 네 입면과 마당 벽에 같은 단면으로 준다. 높이는 각 owner에서 받는다. 파라펫 코핑 상단 4.85m와 기단 상단(각 접지면 위 0.65m)은 남측 입면, 마당 벽 상단 2.55m는 [북측 입면](facades/north.md#north-envelope), 지면은 [대지 지면](site.md#site-grade), 벽 하단은 [층](storey.md#wall-ground-contact)이 소유한다. 이 H2는 두께·돌출과 모서리에서의 만남만 정하고 새 표면 owner가 되지 않는다.

저작자 결정: 코핑은 두께 0.16m의 석재 띠이며 평평한 윗단(파라펫, 반환벽, 후퇴벽 양끝 칸, 남동 모서리 칸, 마당 벽)의 상단을 윗면으로 삼는다. 벽 실체는 그 상단보다 0.16m 낮은 곳에서 끝나고 그 윗면은 코핑 아래의 가려진 받침면이 된다. 코핑은 벽의 양쪽 긴 면과 벽 평면의 끝(바깥 모서리·자유 끝)에서 0.06m 돌출하고, 같은 높이의 코핑끼리는 모서리와 T 접합에서 끊김 없이 한 덩어리로 잇는다. 더 높은 벽(제실·동측 박공 아래 벽)으로 이어지는 끝은 돌출하지 않고 그 벽 면에서 끝나며, 돌출분이 다른 벽 실체 안으로 들어가는 칸은 만들지 않는다. 코핑 아랫면 4.69m와 만나는 지붕은 셋이다. 서측 외쪽 지붕이 파라펫에 닿는 가장 높은 상면은 입력 산술상 약 4.56m(기와를 더해 약 4.66m), 남쪽 주랑 외쪽 지붕은 south-inner에서 약 3.95m, 19도 동측 박공의 남쪽 끝 용마루는 약 4.53m(기와를 더해 약 4.63m)이며 셋 모두 코핑 아랫면보다 낮다. 제실 서쪽 처마는 봉헌실 구간 코핑 위를 약 0.10m 띄워 지난다. 이 관계의 표는 [박공과 파라펫 폐쇄](#gable-closures)가 소유하고, 실체 겹침은 외피 겹침 전수 스캔으로 잰다.

기단은 건물 외곽선 위 바깥면(네 입면과 두 반환벽의 거리 쪽 끝면) 앞에 0.04m 돌출한 석재 띠다. 아래는 공통 외벽 하단까지 지면 속에 묻히고 위는 각 위치 지면 위 0.65m로 지면과 나란하다. 따라서 정면은 Y=0.41m, yard-front 북쪽은 Y=0.65m이고 동·서 입면은 그 사이를 경사로 잇는다. 네 바깥 모서리에서 두 띠는 정사각 칸으로 이어진다. 외부 서비스 문처럼 벽이 기단 상단보다 낮게 끝나는 개구부 앞과 현관 후퇴부(X=±1.65 사이)에는 두지 않는다. 기단 뒤의 벽 바깥면과 묻힌 아랫면은 가려진 접면이다.

표면은 입면별 `surface.facade-<면>.coping`과 `surface.facade-<면>.plinth`이며 마당 벽 위 코핑은 [서비스 마당](rooms/service-yard.md#yard-volume)이 이미 소유한 `surface.service-yard.wall-top`이다. 바깥 모서리 칸은 기단이면 남·북 입면, 코핑이면 조립 순서(북·서·동·남)에서 먼저 오는 입면의 표면을 받아 한 칸에 두 표면을 겹치지 않는다. 단면 수치는 `src/spaces/junctions.ts`, 기단 높이는 `src/spaces/facades/south.ts`가 내보내고 유도 계산은 `src/geometry/wall-trim.ts`가 맡으며 environment가 코핑·기단 두 model로 조립한다.

관찰은 네 바깥 모서리의 코핑·기단 만남, 파라펫 뒤 지붕과 코핑 아랫면 사이, 코핑이 제실 박공 벽·동측 처마 벽에 닿는 끝, 서비스 문 앞 기단 끊김, 동·서 입면의 기단 경사다. 코핑과 벽 사이 틈, 모서리의 빠진 칸이나 겹친 칸, 지붕을 뚫는 코핑, 문 void를 막거나 지면 위에 뜬 기단 중 하나라도 있으면 실패다. 마감 색·줄눈·블록 분할은 materials가 이 표면에 결속한다.

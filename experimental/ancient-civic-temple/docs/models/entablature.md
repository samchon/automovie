# 보와 지붕 아래 목조

## 주랑 목재 보 {#colonnade-beam}

<!--
@evidence principles/core/common.md#scope-preservation 주랑 네 변의 목재 상부 보를 단면·두 길이 변형·윗면 높이·노출면과 접촉면까지 정한다.
@evidence principles/core/common.md#substantive-completion 폭 0.26·깊이 0.28m 단면, 남·북 약 7.69m와 동·서 약 7.94m 길이, 서까래 법선 깊이를 연직으로 환산한 12°/19° 두 높이 식과 모서리의 남·북 보 직접 받침·동측 보 끝면 맞댐이 있어 source가 보 지지점을 다시 설계하지 않는다.
@evidence principles/core/common.md#declared-basis 폭은 ring-volume의 0.35m 기둥 예산, 길이는 building 기준선의 중정 경계와 기둥 축, 높이는 roofs/assembly 주랑 처마 값에서 온다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 주랑 목재 상부라는 설정을 기둥 축 사이 길이 가족·두 보가 맞대는 모서리 규칙이라는 모델 결정으로 바꾼다.
@evidence principles/design/models.md#representation-contract timber part 하나에 기둥 위·서까래 받침·맞댐 끝면의 가려진 접촉면과 중정·주랑 쪽 노출 네 면을 구별한다.
@evidence principles/design/models.md#spatial-convention 원점을 보 아랫면의 길이 중심에 두고 길이 로컬 X, 폭 Z, 깊이 +Y로 정한다.
@evidence principles/design/models.md#reviewable-structure 2.0m 표본의 정면·측면과 건물 안의 기둥 위 공백·주두보다 넓은 보·모서리 겹침을 반증 관찰로 둔다.
@evidence principles/design/models.md#model-observable-style-basis 이미지 03·05의 원주 위 수평 목재를 곧은 각재로 받고 조각·몰딩은 주장하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 기둥 주두·서까래·지붕 하부와 높이 산술로 이어진 길이 가족이라 축척·계층·접촉 층이 함께 닫힌다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work ring-volume의 기둥 예산, plan-datums의 중정 경계, roofs/assembly의 주랑 처마 3.20m를 보 단면과 경사별 윗면 높이에 대조했고 서까래 법선 깊이 0.12m를 경사별 연직 깊이로 바꿔도 기둥이 서서 부모를 고치지 않았다.
@evidence settings/20-envelope.md#colonnade 원주 위 어두운 목재 상부라는 정체성을 곧은 목재 보 prototype으로 받는다.
@evidence spaces/rooms/colonnade.md#ring-volume 0.35m 기둥 예산 안의 보 폭 0.26m와 네 변 배치를 소비한다.
@evidence spaces/building.md#plan-datums 중정 경계에서 0.175m 안쪽 기둥 축 사이 거리를 두 길이 변형의 산술 입력으로 쓴다.
@evidence spaces/roofs/assembly.md#roof-junctions 중정 쪽 상면 3.20m, 외쪽 경사 12°, 법선 두께 0.18m를 보 윗면의 접촉 높이 식에 소비한다.
@evidence settings/50-production.md#references 이미지 03·05의 원주 위를 잇는 굵은 목재를 보의 형태 근거로 쓴다.
@evidenceExclude spaces/junctions.md#wall-junctions 벽 끝 맞닿음 규칙은 벽 실체끼리의 폐쇄를 정하며 두 보가 모서리에서 맞대는 방식은 이 H2의 끝면 규칙이 따로 정하므로 소비하지 않는다.
-->

[연속 주랑](../settings/20-envelope.md#colonnade)의 어두운 목재 상부 보이며 이미지 03·05에서 원주 위를 수평으로 잇는 굵은 목재가 근거다. 기둥 사이를 한 번에 건너는 곧은 각재로 조각·몰딩은 주장하지 않는다. 단면은 폭 0.26m·깊이 0.28m 직사각형이며 폭은 [주랑 공간](../spaces/rooms/colonnade.md#ring-volume)의 0.35m 기둥 예산 안이다.

로컬 원점은 보 아랫면의 길이 방향 중심이고 길이는 로컬 X, 폭은 Z, 깊이는 +Y다. 이 모델은 길이와 지붕 경사를 매개변수로 가진 한 가족이며 source는 판정된 기준선에서 두 길이와 두 높이 변형을 만든다. 남·북 보는 중정 경계에서 0.175m 안쪽의 두 모서리 기둥 축 사이에 기둥 주두 판 반폭을 더한 길이(입력 산술상 약 7.69m)이고, 동·서 보는 남·북 보의 옆면 사이를 잇는 길이(약 7.94m)다. 보 중심선은 중정 경계에서 바깥으로 0.175m이고 보 폭 0.26m이므로 중정 쪽 윗모서리는 경계에서 0.175−0.26/2=0.045m 바깥이다. 그 선의 지붕 경사 α에 대해 slab 하부와 법선 깊이 0.12m 서까래의 아랫면은 `Ybeam(α)=3.20+0.045tan(α)−(0.18+0.12)/cos(α)`다. 12° 외쪽 변은 Ybeam=2.902862867m, 19° 동측 박공 변은 Ybeam=2.898208538m다. 각 변에서 이 값을 보 윗면으로 두고 중정 쪽 윗모서리에서 서까래가 접선으로 받치며 안쪽으로 갈수록 두 부재의 실체가 겹치지 않는다. 각 보 아랫면은 그 변의 Ybeam에서 0.28m 낮고 그 높이 변형은 [주랑 원주](columns.md#colonnade-column)가 소비한다. 네 모서리 원주는 12° 높이 변형으로 남·북 보를 직접 받친다. 동·서 보는 남·북 보의 서로 마주 보는 옆면에 끝면을 맞대고, 각 변의 중간 원주만 해당 경사 높이 변형으로 그 아랫면을 받친다. 동측 보 윗면은 남·북 보보다 0.004654329m 낮지만 끝면의 공통 접촉 높이는 0.275345671m로 양수이며 서로 관통하지 않는다. 서측 보와 남·북 보는 같은 12° 높이에서 끝면이 맞닿는다. 점유 상자는 길이×0.28×0.26m이며 평평한 면 법선을 쓴다.

part와 표면은 `timber` 하나다. 아랫면 중 기둥 위 구간과 윗면 중 서까래 받침 구간, 두 보가 맞대는 끝면은 가려진 접촉면이며 나머지 네 면이 중정과 주랑 쪽에 노출된다. 내부 빈 공간은 없다. instances가 네 변에 하나씩 배치하고 materials가 어두운 목재를 결속한다.

검토 판에서는 짧은 길이 표본(2.0m)을 정면·측면으로 보고, 건물 안 관찰에서는 기둥 주두 위에 보가 얹혀 지붕이 기둥에서 떠 보이지 않는지를 본다. 기둥 위 공백, 주두보다 넓게 튀어나온 보, 두 보가 모서리에서 겹쳐 뚫린 형상은 실패다.

## 서까래 {#rafter}

<!--
@evidence principles/core/common.md#scope-preservation 주랑 외쪽 지붕·동측 박공·제실의 서까래를 한 가족으로 묶어 단면, 경사 유도, 처마 쪽 연직 절단, 뒷벽 끝 접촉, 제실 측벽 두께에서 끊는 두 부재와 지붕 하부 식, 만들지 않는 숨은 서까래까지 정한다.
@evidence principles/core/common.md#substantive-completion 폭 0.08·깊이 0.12m 단면과 지붕 조각에서 경사를 유도하는 규칙, 주랑·동측 뒷벽 목록 및 제실 서·동 처마 끝→측벽 바깥면, 측벽 안쪽면→용마루 절단선이 있어 source가 벽 안의 숨은 겹침을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 주랑 12°는 west·east·north-canopy·south-canopy 지붕에서, 동측 19°는 roofs/assembly의 판정된 동측 박공에서, 제실 22°는 제실 지붕에서 온다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 천장과 지붕 하부의 노출 서까래라는 설정을 경사 매개변수 가족·plumb cut·벽 접촉 끝이라는 모델 결정으로 바꾼다.
@evidence principles/design/models.md#representation-contract timber part 하나에서 측벽 바깥쪽 꼬리와 내부 서까래를 각각 닫힌 성분으로 두고, 벽 두께 안의 겹친 목재는 만들지 않으며 22° 지붕 하부 식을 따라 slab 아랫면·보 윗면·벽 절단 끝의 가려진 접촉면을 정한다.
@evidence principles/design/models.md#spatial-convention 원점을 처마 쪽 아래 모서리 선의 중심, +Z를 경사 오르는 방향, +Y를 서까래 윗면 법선으로 둔다.
@evidence principles/design/models.md#reviewable-structure 1.0m 표본의 연직 끝면과 건물 안 처마 아래 서까래 끝 간격, 제실 측벽 단면에서 west/east-room~west/east-ring 벽 두께 공백을 보고 slab만 보이는 주랑 천장·뜬 끝·벽 관통을 실패로 둔다.
@evidence principles/design/models.md#model-observable-style-basis 이미지 03의 주랑 처마 아래 각재 끝과 이미지 04의 제실 서까래를 근거로 하되 서까래 장식이나 결은 주장하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 경사·수평 길이 매개변수와 배치 간격 제안 0.50m, 골 쪽 단축 규칙의 소유를 함께 정해 반복 prototype 층이 완결된다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 네 외쪽 지붕의 12°와 판정된 동측 박공 19°를 서까래 경사에 대조했고 서까래 뒷끝이 닿을 spine·제실 남벽·후퇴벽·남측 파라펫이 모두 판정된 지붕 범위 안에 있어 부모를 고치지 않았다. 동측 19° 수정은 용마루 기와 H2가 보고한다.
@evidence settings/20-envelope.md#ceilings 주랑과 제실의 노출 목재 서까래라는 천장 설정을 서까래 가족으로 받는다.
@evidence spaces/roofs/assembly.md#roof-junctions 판정된 지붕의 동측 박공 19°와 골선을 서까래 변형의 경사와 단축 기준으로 쓴다.
@evidence spaces/roofs/west.md#west-roof 서측 외쪽 지붕 12°와 서측 spine 뒷벽을 서쪽 주랑 서까래의 경사와 끝으로 쓴다.
@evidence spaces/roofs/east.md#east-roof 동측 박공 19°와 동측 spine을 동쪽 주랑 서까래 변형의 경사와 뒷벽으로 쓴다.
@evidence spaces/roofs/colonnade.md#north-canopy 북쪽 외쪽 지붕 12°와 제실 남벽을 북쪽 주랑 서까래의 경사와 뒷벽으로 쓴다.
@evidence spaces/roofs/colonnade.md#south-canopy 남쪽 외쪽 지붕 12°와 후퇴벽·남측 파라펫을 남쪽 주랑 서까래의 경사와 뒷벽으로 쓴다.
@evidence spaces/building.md#plan-datums 제실 측벽의 west/east-room 바깥면과 west/east-ring 안쪽면을 제실 서까래의 두 절단면과 벽 두께 공백으로 소비한다.
@evidence settings/50-production.md#references 이미지 03의 처마 아래 서까래 끝과 이미지 04의 제실 지붕 아래 서까래를 근거로 쓴다.
-->

[천장과 지붕 하부](../settings/20-envelope.md#ceilings)의 반복 서까래 끝이다. 이미지 03의 주랑 처마 아래로 규칙적으로 드러나는 각재 끝과 이미지 04의 제실 지붕 아래 서까래가 근거다. 단면은 폭 0.08m·깊이 0.12m이며 지붕 slab 아랫면 바로 밑에서 경사를 따라 놓인다.

로컬 원점은 처마 쪽 아래 모서리 선의 중심이다. 로컬 +Z가 경사를 따라 오르는 방향, +Y는 서까래 윗면의 법선이다. 모델은 수평 길이와 경사를 매개변수로 가진 가족이며 source는 판정된 지붕에서 변형을 만든다. 주랑 외쪽 지붕 아래 서까래는 12° 경사로 중정 쪽 처마 끝선에서 주랑 뒷벽(서측·동측 spine의 주랑 쪽 면, 제실 남벽, 후퇴벽, 남측 파라펫)까지 이어지고, 동측 박공 아래는 [판정된 지붕](../spaces/roofs/assembly.md#roof-junctions)의 동측 박공과 같은 19° 경사다. 변형의 경사는 해당 지붕 조각의 경사에서 유도하며 이 문서가 따로 고르지 않는다. 주랑·동측 박공의 처마 쪽 끝은 연직으로 잘린 면(plumb cut)이 드러나고 뒷벽 쪽 끝은 벽면에 닿는다. 제실의 22° 변형은 각 경사면에서 바깥 처마 끝선 |X|=6.10m부터 [제실 측벽](../spaces/building.md#plan-datums)의 west/east-room 바깥면 |X|=5.90m까지의 외부 꼬리와, west/east-ring 안쪽면 |X|=5.60m부터 X=0 용마루 연직면까지의 내부 서까래를 별도 닫힌 각재로 만든다. 각 절단에서 서까래 윗면의 세계 높이는 `Ytop(|X|)=5.35+(5.75−|X|)tan(22°)−0.18/cos(22°)`이고 아랫면은 이 평행면에서 법선 깊이 0.12m 아래다. west/east-room~west/east-ring 벽 두께 0.30m 안에는 목재를 방출하지 않는다. 각 절단면은 벽면에 맞닿는 가려진 면이고 두 부재의 윗면은 모두 slab 하부에 닿는다. 양 내부 서까래의 윗끝은 X=0 면에서 서로 맞닿고 slab 하부를 뚫지 않는다. 제실 변형에는 주랑 뒷벽 끝 규칙을 적용하지 않는다. 널판 천장 위에 숨는 봉헌실·업무방 위 서까래는 이 표현 상한에서 만들지 않는다. 각 연속 부재의 수평 투영 길이를 L, 해당 지붕 경사를 α라 하면 로컬 점유 상자는 `0.08×0.12×(L/cos(α))m`이고 연직 절단 끝도 이 상자를 넘지 않는다. 제실은 벽 두께를 건너 하나의 상자로 묶지 않고 외부 꼬리와 내부 부재마다 L을 따로 쓴다.

part와 표면은 `timber` 하나다. 제실 양쪽의 외부 꼬리와 내부 서까래는 같은 표면 ID 아래 각각 닫힌 연결 성분이며, 벽 속 구간을 잇는 가짜 목재는 없다. 윗면은 지붕 slab 아랫면에, 중간 아랫면은 보 윗면에 닿는 가려진 접촉면이다. 배치 간격(주랑 0.50m 중심 간격을 기본 제안으로 둔다)과 모서리 골 쪽에서 짧아지는 길이는 instances가 판정된 골선에서 유도한다.

검토 판에서 1.0m 표본의 끝면이 연직으로 잘렸는지, 건물 안에서는 중정 쪽 처마 아래로 서까래 끝이 일정 간격으로 드러나는지를 본다. 서까래 없이 slab 아랫면만 보이는 주랑 천장, 처마 끝을 넘어 공중에 뜬 끝, 벽을 뚫고 나가는 뒷끝은 실패다.

## 포치 보와 박공 트림 {#porch-entablature}

<!--
@evidence principles/core/common.md#scope-preservation 포치의 석재 보, 수평 코니스, 두 경사 트림을 치수·위치·접촉까지 정하고 기둥→보→삼각 막음→지붕 끝선의 연속 관계를 보인다.
@evidence principles/core/common.md#substantive-completion 보 3.30×0.30×0.30m와 아랫면 3.20m, 반환벽·막음과의 접면, 코니스 돌출 0.08m와 지붕 하부 식으로 얻는 두 경사 트림의 공통 X=0 끝을 정해 source가 접촉 기준을 다시 고르지 않는다.
@evidence principles/core/common.md#declared-basis 길이는 두 반환벽 안쪽 면, 앞면 선은 south-outer, 경사는 roofs/porch 22°, 삼각 막음은 facades/south, 기둥 위치는 entrance-volume에서 온다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 정면 포치 설정을 보·코니스·경사 트림의 세 part와 막음 앞면에 붙는 트림이라는 모델 결정으로 바꾼다.
@evidence principles/design/models.md#representation-contract beam·cornice·raking-trim part와 보 윗면의 막음 받침 접촉면, 두 끝면과 반환벽 안쪽 면의 맞닿음을 정한다.
@evidence principles/design/models.md#spatial-convention 원점을 보 아랫면의 앞 모서리 중심에 두고 south-outer 안쪽 0.30m 범위와 보 아랫면 3.20m~박공 트림 꼭대기 약 4.473m에서 유도한 점유 상자 3.30×약 1.27×0.38m를 적는다.
@evidence principles/design/models.md#reviewable-structure 정면·측면의 보·코니스·트림 분리와 용마루 만남, 건물 정면의 기둥→보→박공 연속과 트림 위치를 반증 관찰로 둔다.
@evidence principles/design/models.md#model-observable-style-basis 이미지 01의 두 원주 위 석재 보와 박공 돌 테두리를 근거로 하고 판 하나로 된 박공을 실패로 둔다.
@evidence principles/design/models.md#model-scale-layer-completion 기둥 3.20m·보·막음·포치 지붕 끝선이 한 연쇄로 이어져 접촉 층과 축척이 함께 닫힌다.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work 기둥 중심이 Z=9.68일 때 보와 삼각 막음이 정면 가까이에서 기둥 위에 함께 얹힐 수 없었다. 이 보의 받침 조건이 드러낸 결함이라 spaces/rooms/entrance.md#entrance-volume을 먼저 고쳐 기둥 중심을 Z=10.00, 기단 앞면을 south-outer에 두었다(4db31acf).
@evidence settings/20-envelope.md#entrance-porch 두 기둥 위 작은 박공의 정면 포치를 보·코니스·경사 트림으로 받는다.
@evidence spaces/rooms/entrance.md#entrance-volume 수리된 기둥 중심 Z=10.00과 기단 앞면 south-outer를 보가 얹힐 받침 위치로 소비한다.
@evidence spaces/facades/south.md#south-envelope 보 위에 놓이는 삼각 막음의 위치를 트림이 따라 붙는 앞면으로 소비한다.
@evidence spaces/roofs/porch.md#porch-roof 포치 지붕 22° 경사와 용마루 X=0을 경사 트림의 기울기와 만남점으로 쓴다.
@evidence spaces/building.md#plan-datums 두 반환벽 안쪽 면과 south-outer를 보 길이 3.30m와 앞면 범위로 쓴다.
@evidence settings/50-production.md#references 이미지 01의 기둥 위 두꺼운 석재 보와 박공을 두르는 돌 테두리를 근거로 쓴다.
-->

[정면 포치](../settings/20-envelope.md#entrance-porch)의 수평 보와 작은 삼각 박공의 가장자리 트림이다. 이미지 01에서 두 원주 위에 얹힌 두꺼운 석재 보와 박공을 두르는 돌 테두리가 근거다. 기둥이 보를, 보가 [삼각 막음](../spaces/facades/south.md#south-envelope)을, 막음 위의 [포치 지붕](../spaces/roofs/porch.md#porch-roof)이 트림 선을 따라 끝나는 연속 관계를 보여 준다.

로컬 원점은 보 아랫면의 앞 모서리(정면 쪽) 중심이다. 보는 길이 3.30m(두 반환벽 안쪽 면 사이), 앞뒤 폭 0.30m, 높이 0.30m 석재 각재로 south-outer에서 안쪽 0.30m 범위에 놓이며 아랫면 Y=3.20m가 두 [포치 원주](columns.md#porch-column)의 주두 판 **윗면에 면 접촉으로 얹힌다**. 앞은 로컬 +Z이고 보 앞면은 Z=0, 뒷면은 Z=−0.30m다. 보 윗면 Y=3.50m는 삼각 막음 아랫면 Y=3.50m와 같고, X=±1.65m 끝은 두 반환벽 안쪽 면에 닿는다. 수평 코니스는 보 앞 윗모서리를 따라 연직 높이 0.10m·보 앞면에서 +Z로 0.08m 돌출하는 띠다. 경사 트림은 삼각 막음 앞면 위 두 경사 가장자리를 따라 **세계 연직 높이** 0.12m·삼각 막음 앞면에서 +Z로 0.08m 돌출하는 띠 두 개다. 지붕 하부와 닿는 윗선은 `Ytop(X)=4.00+1.65tan(22°)−0.18/cos(22°)−|X|tan(22°)`이며 X는 각각 −1.65~0m와 0~+1.65m다. 아랫선은 `Ytop(X)−0.12m`라 두 트림은 X=0의 같은 단면에서 틈이나 중복 없이 만난다. 점유 높이는 보 아랫면 3.20m부터 트림 꼭대기 약 4.473m까지여서 상자는 3.30×약 1.27×0.38m다.

part와 표면은 `beam`, `cornice`, `raking-trim`이다. 보 윗면은 삼각 막음 아랫면을 받는 가려진 접촉면이고 보의 두 끝면은 반환벽 안쪽 면과 맞닿는다. 이 모델은 한 번 배치된다.

검토 판에서 정면·측면으로 보와 코니스, 두 경사 트림의 분리와 용마루에서의 만남을 본다. 건물 관찰에서는 정면에서 기둥→보→박공이 틈 없이 이어지고 트림이 포치 지붕 끝선 아래에 붙어 있는지를 확인한다. 기둥 위에서 뜬 보, 삼각 막음과 떨어진 트림, 판 하나로 된 박공은 실패다.

## 제실 트러스 {#sanctuary-truss}

<!--
@evidence principles/core/common.md#scope-preservation 제실의 가운데 기둥 목조 트러스를 평보·경사재·가운데 기둥·버팀재 네 부재와 높이·접촉·창과의 여유까지 정한다.
@evidence principles/core/common.md#substantive-completion 평보 11.20m·0.22×0.28m·아랫면 4.86m, 경사재의 지붕 하부식과 평보 윗면 절삭, 가운데 기둥 V형 머리, 버팀재 발끝 X=±0.09·Y=5.69m와 위끝 X=±2.80m를 확정해 source가 트러스의 구조 끝점을 다시 고르지 않는다.
@evidence principles/core/common.md#declared-basis 길이는 제실 서·동 벽 안쪽 면, 높이는 roofs/sanctuary의 지지 5.35m와 측벽 안쪽 하부 약 5.22m, 창 여유는 openings.md#clerestories의 창틀 윗끝 약 4.46m에서 온다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 높은 목재 박공 천장이라는 설정을 네 부재 트러스와 평보가 창 위 약 0.40m에 걸리는 모델 결정으로 바꾼다.
@evidence principles/design/models.md#representation-contract tie-beam·principal·king-post·strut part와 평보 끝면의 벽 접촉, 경사재 윗면의 slab 접촉을 정하고 트러스 사이 서까래는 서까래 가족에 맡긴다.
@evidence principles/design/models.md#spatial-convention 원점을 평보 아랫면 중심에 두고 폭 로컬 X, 두께 Z로 정한다.
@evidence principles/design/models.md#reviewable-structure 정면 삼각 윤곽과 네 부재 분리, 제실 중심·threshold 시점에서 평보가 창과 문 위에 걸리는지와 경사재가 지붕 하부에 닿는지를 본다.
@evidence principles/design/models.md#model-observable-style-basis 이미지 04의 굵은 평보와 경사 부재를 가운데 기둥 트러스로 받고 벽을 뚫는 평보·판 천장을 실패로 둔다.
@evidence principles/design/models.md#model-scale-layer-completion 지붕 하부·창 높이·벽 간격과 산술로 이어진 치수와 배치 소유 경계가 있어 제실 천장 층이 완결된다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work roofs/sanctuary의 지지 5.35m와 용마루 아래 하부 약 7.48m, 측벽 창 윗끝 4.46m를 트러스 높이에 대조했고 평보가 창 위와 지붕 하부 아래 사이에 들어 부모를 고치지 않았다. 지지 높이 수정은 spaces 쪽 코핑 충돌에서 왔고 트러스는 그 결과에 다시 앉혔다.
@evidence settings/30-interiors.md#sanctuary 제실의 높은 목재 박공 천장을 트러스가 드러나는 천장으로 받는다.
@evidence settings/20-envelope.md#ceilings 노출 목재 박공 보라는 천장 설정을 평보와 경사재로 받는다.
@evidence spaces/roofs/sanctuary.md#sanctuary-roof 지지 5.35m와 22° 박공의 하부를 평보 높이와 경사재 윗면의 기준으로 쓴다.
@evidence spaces/rooms/sanctuary.md#sanctuary-volume 제실 서·동 벽 안쪽 면 사이 11.20m를 평보 길이로 쓴다.
@evidence spaces/openings.md#clerestories 측벽 창틀 윗끝 약 4.46m를 평보 아랫면 4.86m와의 여유 기준으로 쓴다.
@evidence spaces/observations.md#geometry-observations 제실 중심→북·남과 threshold 관찰 station을 평보와 창·문의 관계를 볼 건물 시점으로 쓴다.
@evidence settings/50-production.md#references 이미지 04의 벽 사이 굵은 평보와 경사 부재를 근거로 쓴다.
-->

[제실](../settings/30-interiors.md#sanctuary)의 높은 목재 박공 천장과 서까래, [천장 설정](../settings/20-envelope.md#ceilings)의 노출 목재 박공 보가 근거이며 이미지 04에서 벽 사이를 가로지르는 굵은 평보와 경사 부재가 보인다. 형식은 가운데 기둥이 있는 단순한 목조 트러스다.

로컬 원점은 평보 아랫면의 중심이고 폭 방향은 로컬 X, 두께는 Z다. 평보는 길이 11.20m(제실 서·동 벽 안쪽 면 사이), 단면 0.22×0.28m이며 아랫면 Y=4.86m, 윗면 5.14m로 [제실 지붕](../spaces/roofs/sanctuary.md#sanctuary-roof)(지지 5.35m)의 측벽 안쪽 면 위치 하부(약 5.22m)보다 낮게 벽에 걸린다. 두 경사재는 단면 0.18×0.20m로 평보 양끝 X=±5.60m에서 지붕 하부를 따라 X=0의 용마루 아래까지 오른다. 경사재 윗면은 `Yprincipal(|X|)=5.35+(5.75−|X|)tan(22°)−0.18/cos(22°)`이고 아랫면은 `max(Yprincipal−0.20/cos(22°),5.14)`로 절삭한다. 바깥 끝은 X=±5.60m 연직면, 두 용마루 끝은 X=0 연직면에서 서로 맞댄다. 평보 쪽 아랫끝은 평보 윗면 Y=5.14m로 평평하게 절삭하므로 평보를 뚫지 않는다. 가운데 기둥(0.18×0.18m)은 평보 윗면 Y=5.14m에서 서고 머리는 |X|≤0.09m 범위의 두 경사재 아랫면 `Yprincipal(|X|)−0.20/cos(22°)`를 따르는 V형 절삭면이다(중심 높이 약 7.263m). 두 버팀재(0.14×0.14m)의 발끝 중심은 가운데 기둥의 양 측면 X=±0.09m·Y=5.69m이며 반대쪽 끝 중심은 각 경사재의 수평 구간 중간 X=±2.80m에서 그 아랫면 Y≈6.132m에 놓인다. 버팀재 위끝은 경사재 아랫면, 발끝은 가운데 기둥 측면에 따라 절삭해 두 부재 안으로 관통하지 않는다. 점유 상자는 11.20×약 2.62×0.22m다. 측벽 채광구(창틀 윗끝 약 4.46m)는 평보 아래 약 0.40m에 남는다.

part와 표면은 `tie-beam`, `principal`, `king-post`, `strut`이다. 평보의 두 끝면은 벽 안에 닿는 가려진 접촉면이고 경사재 윗면은 지붕 slab 아랫면에 닿는다. 트러스 사이의 제실 서까래는 [서까래](#rafter) 가족을 쓴다. 배치 위치와 수(북·남 박공 벽과 창에서 떨어진 제실 안 Z 위치)는 instances가 정한다.

검토 판에서 정면으로 삼각 윤곽과 부재 네 종의 분리를, 건물 관찰에서 제실 중심→북·남과 threshold 시점에서 평보가 창과 문 위에 걸리는지, 경사재가 지붕 하부와 떨어지지 않는지를 본다. 벽을 뚫는 평보, 지붕 위로 솟는 경사재, 부재 없이 평평한 판 천장은 실패다.

## 업무방·봉헌실 천장 보 {#ceiling-joist}

<!--
@evidence principles/core/common.md#scope-preservation 봉헌실과 동측 세 방의 낮은 목재 천장 보를 단면·길이·높이와 배치 소유 경계까지 정한다.
@evidence principles/core/common.md#substantive-completion 폭 0.12·깊이 0.18m, 길이 4.00m, 윗면 3.10m·아랫면 2.92m가 있어 source가 천장 보를 다시 고르지 않는다.
@evidence principles/core/common.md#declared-basis 깊이 0.18m와 보 아래 2.92m는 storey.md#ground-storey의 예산, 길이는 기준선 west/east-inner~room, 문 head 2.36m는 openings.md#doors에서 온다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 업무방·봉헌실의 낮은 목재 천장이라는 설정을 네 방 공통 4.00m 보와 널판 접촉이라는 모델 결정으로 바꾼다.
@evidence principles/design/models.md#representation-contract timber part 하나에 윗면·두 끝면의 가려진 접촉면과 평평한 면 법선을 정한다.
@evidence principles/design/models.md#spatial-convention 원점을 보 아랫면의 길이 중심에 두고 점유 상자 4.00×0.18×0.12m를 적는다.
@evidence principles/design/models.md#reviewable-structure 1.0m 표본과 각 방 중심·모서리 시점에서 보가 널판 아래 규칙적으로 드러나는지, 2.92m 아래로 처지지 않는지를 본다.
@evidence principles/design/models.md#model-observable-style-basis 이미지 05의 널판 천장 아래 어두운 각재를 근거로 하고 장식 보나 결은 주장하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 층 예산·방 순치수·문 head와 이어진 높이와 0.60m 간격 제안의 소유 경계가 있어 낮은 천장 층이 완결된다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work storey의 보 깊이 예산 0.18m와 보 아래 2.92m, 네 방 짧은 변 4.00m, 문 head 2.36m를 보에 대조했고 모두 예산 안이라 부모를 고치지 않았다.
@evidence settings/20-envelope.md#ceilings 업무방과 봉헌실의 낮은 목재 보 천장을 천장 보 prototype으로 받는다.
@evidence spaces/storey.md#ground-storey 보 깊이 예산 0.18m와 보 아래 유효 높이 2.92m를 보 단면과 높이로 소비한다.
@evidence spaces/building.md#plan-datums west/east-inner~west/east-room 사이 4.00m를 보 길이로 쓴다.
@evidence spaces/openings.md#doors 문 head(2.36m 이하)를 보 아랫면이 남겨야 할 높이 기준으로 쓴다.
@evidence spaces/rooms/offering.md#offering-volume 봉헌실의 낮은 널판 천장 아래를 보가 놓일 방으로 소비한다.
@evidence spaces/rooms/administration.md#office-volume 관리실 널판 천장 아래를 보가 놓일 방으로 소비한다.
@evidence spaces/rooms/records.md#records-volume 기록실 널판 천장 아래를 보가 놓일 방으로 소비한다.
@evidence spaces/rooms/storage.md#storage-volume 보관실 널판 천장 아래를 보가 놓일 방으로 소비한다.
@evidence spaces/observations.md#geometry-observations 각 방 중심→네 방위와 모서리 station을 보의 규칙적 노출을 볼 건물 시점으로 쓴다.
@evidence settings/50-production.md#references 이미지 05의 널판 천장 아래 어두운 각재를 근거로 쓴다.
-->

[천장과 지붕 하부](../settings/20-envelope.md#ceilings)의 업무방과 봉헌실 낮은 목재 보다. 이미지 05에서 널판 천장 아래를 가로지르는 어두운 각재가 근거다. 판정된 [층](../spaces/storey.md#ground-storey)의 보 깊이 예산 0.18m와 보 아래 유효 높이 2.92m를 그대로 쓴다.

로컬 원점은 보 아랫면의 길이 중심이다. 단면은 폭 0.12m·깊이 0.18m, 길이는 방의 짧은 변 순치수 4.00m(봉헌실과 동측 세 방 모두 west/east-inner~west/east-room 사이)다. 윗면 Y=3.10m가 널판 천장 아랫면에 닿고 아랫면은 2.92m다. 점유 상자는 4.00×0.18×0.12m이며 평평한 면 법선을 쓴다.

part와 표면은 `timber` 하나이고 윗면과 두 끝면은 가려진 접촉면이다. 간격(0.60m 중심 간격을 기본 제안으로 둔다)과 문·벽 가까이의 끝 위치는 instances가 정한다.

검토 판에서 1.0m 표본을, 건물 관찰에서 각 방 중심→네 방위와 모서리 시점에서 보가 널판 아래에 규칙적으로 드러나고 문 head(2.36m 이하)보다 높게 남는지를 본다. 널판에서 떨어진 보, 벽을 뚫는 끝, 2.92m 아래로 처진 보는 실패다.

# 지붕 매스의 접합

## 공통 지지 높이와 겹침 해소 {#roof-junctions}

<!--
@evidence principles/core/common.md#scope-preservation 날개 합성의 상면·하부·골과 높이 차이 끝면, 제실·포치의 떠 있는 처마, 파라펫에서 끝나는 지붕 끝과 실내외 하부 소유를 모두 공통 접합에 포함한다.
@evidence principles/core/common.md#substantive-completion 주랑 처마 지지 Y=3.20m·동측 외벽 지지 3.55m·제실 5.35m·포치 4.00m, 외쪽 12도·제실과 포치 박공 22도·동측 박공 19도·법선 두께 0.18m·돌출 0.35m와 날개 단위 최대 높이 합성 순서를 정한다.
@evidence principles/core/common.md#declared-basis roof-form 범위를 소비하고 0.18/cos(경사)의 수직 두께와 코핑 대비 높이는 입력 산술로 적으며 compiled 계측과 구별한다.
@evidence principles/design/spaces.md#space-topology 날개 합성은 중정 네 안쪽 모서리에 골을 만들 뿐 열린 주랑을 막음벽으로 닫지 않고, 제실 처마를 아래 날개 지붕 위에 띄워 낮은 지붕에 구멍을 내지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority assembly는 합성 계산만 하고 잘린 면과 높이 차이 끝면의 앞면은 원래 roof owner의 표면에 남기며 끝면 뒷면과 실내 하부는 아래 구획의 방에 귀속한다.
@evidence principles/design/spaces.md#space-verification-address 네 골의 단면, 높이 차이 끝면, 제실 처마 아래 틈, 파라펫과 지붕의 만남을 양쪽에서 보며 누광·중복·구멍을 찾고 실체 겹침은 외피 겹침 스캔으로 잰다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 외쪽·박공 범위를 날개/제실/포치의 세 합성 단위와 각 지지 높이, 떠 있는 처마 규칙으로 구체화한다.
@evidence upstream/design/spaces.md#settings-and-map-revision-from-space-work 2026-09-24 첫 GPU 렌더를 이미지 01과 대조한 결과 날개 박공의 바깥 처마가 파라펫·안쪽 경사와 다르게 읽혔고, 서측 7m 외쪽 지붕을 기존 18~28도·용마루 5.0~6.2m 안에 넣을 수 없어 settings/20-envelope.md#roof-form의 처마·코핑·용마루·경사 범위를 먼저 수리했다.
@evidence settings/20-envelope.md#roof-form 외쪽 12도, 제실·포치 박공 22도와 동측 박공 19도, 코핑 4.85m 아래의 날개 지붕, 가장 높은 제실 용마루 약 7.67m를 수리된 범위 안에서 고른다.
@evidence settings/20-envelope.md#ceilings 주랑·제실의 노출 하부와 널판 천장 위 비거주 틈을 구별해 지붕 하부를 방별로 배정한다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 날개 합성·골·높이 차이 끝면과 그 주머니 쪽 뒷면·떠 있는 처마·파라펫 끝·하부 소유가 한 H2에 있고, 코핑과 만나는 세 지붕의 관계는 gable-closures 표로 넘겨 빠진 접점이 없다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 네 지지 높이와 세 경사(12·22·19도), 두께·돌출, 동측만 19도인 이유, 높이 차이 끝면의 앞면·뒷면 소유와 현재 해당하는 Z=-2.8m 끝면이 본문에 있어 source가 경사나 면 소유를 따로 고르지 않는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 서측 약 4.56m와 제실 용마루 약 7.67m는 입력 산술이며 겹침은 스캔으로 잰다고 적고, 뒷면 규칙은 주랑 안에서 끝면 너머가 비쳐 보이는 관찰에서 나왔다고 밝혀 산술·측정·관찰이 구별된다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 골은 중정 네 안쪽 모서리에만 생기고 제실 처마는 낮은 지붕을 지우지 않고 떠 있으며, 높이 차이 끝면의 뒷면이 주랑 위 주머니를 닫아도 새 공간이나 바닥부터의 막음벽이 생기지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 잘린 조각과 끝면 앞면은 원래 roof owner의 surface ID에, 끝면 뒷면과 실내 하부는 아래 구획의 방 owner에 남고 뒷면은 같은 한 장의 다른 면이라 assembly가 표면을 가져가거나 부재를 복제하지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 22도 동측 박공과 5.05m 제실 지지가 코핑을 뚫은 사례와 끝면 뒷면이 없으면 주랑에서 바깥이 비치는 조건을 본문에 적고, 겹침은 스캔으로, 끝면은 단면과 양쪽 관찰로 재게 해 산술만으로 통과시키지 않는다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 설정은 경사·높이 범위만 줬고 세 합성 단위와 지지 높이, 동측 전용 경사, 높이 차이 끝면의 양면 소유는 공간 층의 결정이다.
@evidenceReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 첫 렌더 대조에서 드러난 roof-form 범위 결함과 그 수리가 적혀 있고, 19도·7.67m는 그 범위 안이며 끝면 뒷면은 지붕 형상을 바꾸지 않는 표면 결정이라 부모를 다시 고치지 않았다.
@evidenceReview settings/20-envelope.md#roof-form #7269ea1 외쪽 12도는 10~16도, 박공 19·22도는 18~28도, 제실 약 7.67m는 6.8~7.8m, 코핑 4.85m는 4.5~5.2m 안에 있다.
@evidenceReview settings/20-envelope.md#ceilings #c397437 주랑·제실의 노출 하부와 높이 차이 끝면의 주랑 쪽 뒷면은 방 owner, 널판 천장 위 틈은 비거주로 남아 지붕 하부가 새 공간이 되지 않고 주랑 천장에 틈이 비치지 않는다.
-->

[경사지붕 설정](../../settings/20-envelope.md#roof-form)을 소비한다. 지붕은 세 합성 단위로 나뉜다. 날개 단위는 [서측 외쪽 지붕](west.md#west-roof), [북쪽](colonnade.md#north-canopy)·[남쪽](colonnade.md#south-canopy) 주랑 외쪽 지붕, [동측 박공](east.md#east-roof)이며 중정을 둘러싸는 하나의 기와 지붕이다. [제실 박공](sanctuary.md#sanctuary-roof)과 [포치 박공](porch.md#porch-roof)은 각각 별도 단위다. 각 지붕의 높이는 owner가 정한 지지선 위치의 상면 높이에서 유도한다. 중정 쪽 주랑 처마 지지선(west-court·east-court·court-back·court-front)의 상면은 Y=3.20m, 동측 박공의 동측 외벽 중심 지지선은 3.55m, 제실 박공 지지선은 5.35m, 포치 박공 지지선은 4.00m다. 이 값은 지붕 상면의 기준이고 보나 벽의 실제 받침 높이가 아니다.

외쪽 지붕의 경사는 12도, 제실·포치 박공은 22도, 동측 박공은 19도이고 매스의 법선 두께는 0.18m다. 하부는 상면에서 수직으로 0.18/cos(경사)만큼 내려간 평행면이며 벽 상단과 받침은 이 하부에 맞춘다. 예를 들어 서측 외쪽 지붕의 west-inner 위치 상면은 입력 산술상 약 4.56m이고 [외곽 파라펫 코핑](../facades/south.md#south-envelope) 4.85m보다 낮다. 제실 용마루는 약 7.67m다. 코핑 아랫면 4.69m와 만나거나 그 위를 지나는 지붕은 셋이며 그 관계는 [박공과 파라펫 폐쇄](../junctions.md#gable-closures)가 표로 가진다. 22도였던 동측 박공은 남쪽 끝 용마루가 약 4.73m로 남측 코핑 안쪽 돌출을 뚫었고, 5.05m였던 제실 지지는 서쪽 처마가 봉헌실 북측 파라펫 코핑을 뚫었다. 그래서 동측 박공만 19도로 낮추고 제실 지지를 5.35m로 올렸다. 이 수치는 실측이나 compiled 결과가 아니며 겹침 여부는 외피 겹침 전수 스캔으로 잰다. 보·서까래·기와의 세부 단면은 외피/반복 단계에서 이 매스의 지지·두께와 대조해 소유한다.

처마 돌출은 열린 끝에만 있으며 각 roof owner가 지정한 참조면에서 바깥쪽으로 수평 0.35m다. 열린 끝은 중정을 향한 주랑 처마, 동측 외벽 처마, 동측 박공과 북쪽 외쪽 지붕의 마당 쪽 끝, 제실 네 끝, 포치 앞끝이다. 파라펫이나 더 높은 벽에 닿는 지붕 끝은 그 벽의 안쪽 면에서 끝나고 돌출하지 않는다. 수평 끝선 위치를 먼저 정한 뒤 이미 정의한 경사면의 높이를 그 위치에서 구하며 두께 때문에 평면 외곽을 다시 늘리지 않는다.

날개 단위의 후보가 겹치는 곳은 상면 높이가 가장 큰 영역만 외부 상면으로 남긴다. 안쪽으로 기우는 외쪽 지붕과 동측 박공의 중정 쪽 면이 이렇게 만나 중정 네 안쪽 모서리에서 모서리 밖으로 올라가는 골(valley)이 생긴다. plane 교차선에서 자르고 같은 면을 두 번 남기지 않는다. 동고면의 소유 우선순위는 서측→주랑(북·남)→동측 순이며 같은 위치의 중복 제거에만 쓴다. 제거한 영역의 하부 slab도 남기지 않는다. 날개 단위 안에서 두 조각이 맞닿는 변의 높이가 달라 높은 조각의 하부가 낮은 조각의 상면보다 위에 있으면 그 사이를 높은 조각 owner의 수직 끝면으로 닫는다. 이 끝면은 두께 없는 한 장이므로 낮은 조각 쪽을 향한 앞면과 함께 높은 조각 아래 주머니 쪽을 향한 뒷면을 둔다. 앞면은 높은 조각 owner의 표면이고, 뒷면은 아래 구획을 따라 방이면 그 방의 천장 표면, 외부면 그 지붕 owner의 처마 하부 표면이다. 뒷면은 같은 한 장의 다른 면이며 두 번째 부재가 아니다. 현재 해당하는 끝면은 북쪽 주랑 외쪽 지붕과 동측 박공이 만나는 Z=-2.8m의 하나이고 뒷면은 주랑 천장이다. 뒷면이 없으면 주랑 안에서 그 끝면 너머 바깥이 비쳐 보인다. 지붕끼리 붙는 내부 접면에는 노출 끝마개를 추가하지 않는다.

제실과 포치 단위는 날개 지붕과 합성하지 않는다. 날개 후보는 제실 몸체(west-room~east-room, north-inner 북쪽~north-ring)와 현관 몸체를 비우고, 제실의 서·남 처마와 마당 쪽 처마는 아래 봉헌실·북쪽 주랑 지붕이나 마당 위에 떠 있다. 높은 처마가 낮은 지붕을 지워 그 아래에 구멍을 남기지 않는다. 어느 벽이 지붕 밑과 지붕 사이를 닫는지는 [박공과 파라펫 폐쇄](../junctions.md#gable-closures)를 따르며 열린 주랑에 새 막음벽을 추가하지 않는다.

지붕 합성 source는 `src/spaces/roofs/assembly.ts`이고 다른 owner의 매스 입력을 결합할 뿐 완결 시각 표면을 가져가지 않는다. 잘린 plane 조각과 높이 차이 끝면의 앞면도 원래 지붕 owner의 surface ID에 남는다. 외부 처마 하부는 지붕 owner, 공간 내부에서 보이는 천장/지붕 하부는 해당 방 owner로 구획한다. 양쪽에서 같은 물리 부재를 복제하지 않는다. 낮은 널판 천장 위 비거주 구조 빈틈은 새 공간이나 접근 경로가 아니다.

관찰은 네 골과 모든 교차선의 단면, 높이 차이 끝면, 제실 처마와 그 아래 날개 지붕 사이, 지붕이 파라펫과 만나는 선, 모든 노출 상면·처마 하부다. 지붕 누광·중복 면·열린 단면·높은 처마 아래 구멍·기둥 위 공백이 발견되면 이 접합과 해당 지붕 owner를 함께 고친다. 실제 면 분할·법선·그림자는 source와 GPU 관찰에서 다시 읽어야 하며 이 문서의 산술은 그 대체가 아니다.

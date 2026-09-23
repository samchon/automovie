# 지붕 매스의 접합

## 공통 지지 높이와 겹침 해소 {#roof-junctions}

<!--
@evidence principles/core/common.md#scope-preservation 날개 합성의 상면·하부·골과 높이 차이 끝면, 제실·포치의 떠 있는 처마, 파라펫에서 끝나는 지붕 끝과 실내외 하부 소유를 모두 공통 접합에 포함한다.
@evidence principles/core/common.md#substantive-completion 주랑 처마 지지 Y=3.20m·동측 외벽 지지 3.55m·제실 5.05m·포치 4.00m, 외쪽 12도·박공 22도·법선 두께 0.18m·돌출 0.35m와 날개 단위 최대 높이 합성 순서를 정한다.
@evidence principles/core/common.md#declared-basis roof-form 범위를 소비하고 0.18/cos(경사)의 수직 두께와 코핑 대비 높이는 입력 산술로 적으며 compiled 계측과 구별한다.
@evidence principles/design/spaces.md#space-topology 날개 합성은 중정 네 안쪽 모서리에 골을 만들 뿐 열린 주랑을 막음벽으로 닫지 않고, 제실 처마를 아래 날개 지붕 위에 띄워 낮은 지붕에 구멍을 내지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority assembly는 합성 계산만 하고 잘린 면과 높이 차이 끝면도 원래 roof owner의 표면에 남기며 실내 하부는 해당 방에 귀속한다.
@evidence principles/design/spaces.md#space-verification-address 네 골의 단면, 높이 차이 끝면, 제실 처마 아래 틈, 파라펫과 지붕의 만남을 양쪽에서 보며 누광·중복·구멍을 찾는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 외쪽·박공 범위를 날개/제실/포치의 세 합성 단위와 각 지지 높이, 떠 있는 처마 규칙으로 구체화한다.
@evidence upstream/design/spaces.md#settings-and-map-revision-from-space-work 2026-09-24 첫 GPU 렌더를 이미지 01과 대조한 결과 날개 박공의 바깥 처마가 파라펫·안쪽 경사와 다르게 읽혔고, 서측 7m 외쪽 지붕을 기존 18~28도·용마루 5.0~6.2m 안에 넣을 수 없어 settings/20-envelope.md#roof-form의 처마·코핑·용마루·경사 범위를 먼저 수리했다.
@evidence settings/20-envelope.md#roof-form 외쪽 12도와 박공 22도, 코핑 4.85m 아래의 날개 지붕, 가장 높은 제실 용마루 약 7.37m를 수리된 범위 안에서 고른다.
@evidence settings/20-envelope.md#ceilings 주랑·제실의 노출 하부와 널판 천장 위 비거주 틈을 구별해 지붕 하부를 방별로 배정한다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation 날개 상면만이 아니라 네 모서리 골, 높은 조각의 끝면, 떠 있는 제실·포치 처마와 파라펫 앞에서 멈추는 끝까지 이 접합의 범위로 적혀 있다.
@evidenceReview principles/core/common.md#substantive-completion 지지 높이 네 값과 두 경사, 날개 단위 최대 높이·동고 순서가 적혀 있어 합성 방식을 새로 고르지 않고 source가 같은 지붕을 낼 수 있다.
@evidenceReview principles/core/common.md#declared-basis 서측 외쪽 끝 약 4.56m와 제실 용마루 약 7.37m가 삼각함수 산술로 표시되고 compiled 결과가 아니라는 구분이 남아 있다.
@evidenceReview principles/design/spaces.md#space-topology 날개끼리만 최대 높이로 합성하고 제실·포치는 별도 단위로 떠 있게 해, 높은 처마 아래 봉헌실·북쪽 주랑 지붕이 지워지는 공백을 규칙에서 막았다.
@evidenceReview principles/design/spaces.md#space-boundary-authority 높이 차이 끝면은 높은 조각의 owner에, 잘린 조각은 원래 owner에 남아 assembly가 새 완결 표면 소유자가 되지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address 골 단면과 제실 처마 아래, 파라펫 뒤 만남을 관찰 대상으로 적어 위에서만 보면 숨는 틈도 검사 목록에 들어간다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation 설정이 준 범위를 세 합성 단위와 단위별 지지 높이, 떠 있는 처마라는 공간 결정으로 좁혔다.
@evidenceReview upstream/design/spaces.md#settings-and-map-revision-from-space-work 렌더 대조와 서측 날개 단면 산술이라는 두 공간 시험을 적고 roof-form의 네 범위를 부모에서 고친 뒤 이 접합이 그 값을 소비한다고 밝혀 지역 치수로 부모를 우회하지 않았다.
@evidenceReview settings/20-envelope.md#roof-form 외쪽 12도는 수리된 10~16도, 제실 약 7.37m는 6.8~7.8m, 코핑 4.85m는 4.5~5.2m 안에 있어 부모 범위와 맞물린다.
@evidenceReview settings/20-envelope.md#ceilings 주랑·제실의 노출 하부와 네 업무방 널판 위 은폐 하부를 다른 표면으로 나눠 천장 방식의 부모 구분을 지킨다.
-->

[경사지붕 설정](../../settings/20-envelope.md#roof-form)을 소비한다. 지붕은 세 합성 단위로 나뉜다. 날개 단위는 [서측 외쪽 지붕](west.md#west-roof), [북쪽](colonnade.md#north-canopy)·[남쪽](colonnade.md#south-canopy) 주랑 외쪽 지붕, [동측 박공](east.md#east-roof)이며 중정을 둘러싸는 하나의 기와 지붕이다. [제실 박공](sanctuary.md#sanctuary-roof)과 [포치 박공](porch.md#porch-roof)은 각각 별도 단위다. 각 지붕의 높이는 owner가 정한 지지선 위치의 상면 높이에서 유도한다. 중정 쪽 주랑 처마 지지선(west-court·east-court·court-back·court-front)의 상면은 Y=3.20m, 동측 박공의 동측 외벽 중심 지지선은 3.55m, 제실 박공 지지선은 5.05m, 포치 박공 지지선은 4.00m다. 이 값은 지붕 상면의 기준이고 보나 벽의 실제 받침 높이가 아니다.

외쪽 지붕의 경사는 12도, 박공은 22도이고 매스의 법선 두께는 0.18m다. 하부는 상면에서 수직으로 0.18/cos(경사)만큼 내려간 평행면이며 벽 상단과 받침은 이 하부에 맞춘다. 예를 들어 서측 외쪽 지붕의 west-inner 위치 상면은 입력 산술상 약 4.56m이고 [외곽 파라펫 코핑](../facades/south.md#south-envelope) 4.85m보다 낮다. 제실 용마루는 약 7.37m다. 이 수치는 실측이나 compiled 결과가 아니다. 보·서까래·기와의 세부 단면은 외피/반복 단계에서 이 매스의 지지·두께와 대조해 소유한다.

처마 돌출은 열린 끝에만 있으며 각 roof owner가 지정한 참조면에서 바깥쪽으로 수평 0.35m다. 열린 끝은 중정을 향한 주랑 처마, 동측 외벽 처마, 동측 박공과 북쪽 외쪽 지붕의 마당 쪽 끝, 제실 네 끝, 포치 앞끝이다. 파라펫이나 더 높은 벽에 닿는 지붕 끝은 그 벽의 안쪽 면에서 끝나고 돌출하지 않는다. 수평 끝선 위치를 먼저 정한 뒤 이미 정의한 경사면의 높이를 그 위치에서 구하며 두께 때문에 평면 외곽을 다시 늘리지 않는다.

날개 단위의 후보가 겹치는 곳은 상면 높이가 가장 큰 영역만 외부 상면으로 남긴다. 안쪽으로 기우는 외쪽 지붕과 동측 박공의 중정 쪽 면이 이렇게 만나 중정 네 안쪽 모서리에서 모서리 밖으로 올라가는 골(valley)이 생긴다. plane 교차선에서 자르고 같은 면을 두 번 남기지 않는다. 동고면의 소유 우선순위는 서측→주랑(북·남)→동측 순이며 같은 위치의 중복 제거에만 쓴다. 제거한 영역의 하부 slab도 남기지 않는다. 날개 단위 안에서 두 조각이 맞닿는 변의 높이가 달라 높은 조각의 하부가 낮은 조각의 상면보다 위에 있으면 그 사이를 높은 조각 owner의 수직 끝면으로 닫는다. 지붕끼리 붙는 내부 접면에는 노출 끝마개를 추가하지 않는다.

제실과 포치 단위는 날개 지붕과 합성하지 않는다. 날개 후보는 제실 몸체(west-room~east-room, north-inner 북쪽~north-ring)와 현관 몸체를 비우고, 제실의 서·남 처마와 마당 쪽 처마는 아래 봉헌실·북쪽 주랑 지붕이나 마당 위에 떠 있다. 높은 처마가 낮은 지붕을 지워 그 아래에 구멍을 남기지 않는다. 어느 벽이 지붕 밑과 지붕 사이를 닫는지는 [박공과 파라펫 폐쇄](../junctions.md#gable-closures)를 따르며 열린 주랑에 새 막음벽을 추가하지 않는다.

지붕 합성 source는 `src/spaces/roofs/assembly.ts`이고 다른 owner의 매스 입력을 결합할 뿐 완결 시각 표면을 가져가지 않는다. 잘린 plane 조각과 높이 차이 끝면도 원래 지붕 owner의 surface ID에 남는다. 외부 처마 하부는 지붕 owner, 공간 내부에서 보이는 천장/지붕 하부는 해당 방 owner로 구획한다. 양쪽에서 같은 물리 부재를 복제하지 않는다. 낮은 널판 천장 위 비거주 구조 빈틈은 새 공간이나 접근 경로가 아니다.

관찰은 네 골과 모든 교차선의 단면, 높이 차이 끝면, 제실 처마와 그 아래 날개 지붕 사이, 지붕이 파라펫과 만나는 선, 모든 노출 상면·처마 하부다. 지붕 누광·중복 면·열린 단면·높은 처마 아래 구멍·기둥 위 공백이 발견되면 이 접합과 해당 지붕 owner를 함께 고친다. 실제 면 분할·법선·그림자는 source와 GPU 관찰에서 다시 읽어야 하며 이 문서의 산술은 그 대체가 아니다.

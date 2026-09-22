# 지붕 매스의 접합

## 공통 지지 높이와 겹침 해소 {#roof-junctions}

<!--
@evidence principles/core/common.md#scope-preservation 모든 roof 후보의 상하 면·노출 끝·겹침과 실내/외 처마 하부의 소유를 공통 접합에 포함한다.
@evidence principles/core/common.md#substantive-completion 상면 Y=3.55m·경사 22도·법선 두께 0.18m·수평 돌출 0.35m와 높이 최대 선택/동고 우선순위를 정한다.
@evidence principles/core/common.md#declared-basis roof-form을 소비하며 수직 두께와 후보 끝 높이는 삼각함수 입력 산술로 표시하고 compiled 결과와 구별한다.
@evidence principles/design/spaces.md#space-topology 낮은 roof 중첩 slab를 제거하되 열린 주랑을 새 막음벽으로 닫거나 천장 위 구조 틈을 공간으로 만들지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority assembly는 교차 계산만 하고 잘린 면도 원래 roof surface에 남기며 내부 하부는 해당 방에 귀속한다.
@evidence principles/design/spaces.md#space-verification-address 모든 교차선 단면과 양쪽 perspective, 노출 상면/하부로 누광·중복·열린 끝·받침 공백을 찾는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 경사/처마 허용을 실제 상하 평행면과 roof 합성 순서로 결정한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work roof-form의 돌출 요구와 ceilings의 노출 하부를 검토했다. 지지선에서 돌출을 재던 공간 후보만 고쳐 외벽 바깥면부터 필요한 처마를 남겼고 설정을 약화하지 않았다.
@evidence settings/20-envelope.md#roof-form 벽 바깥면/중정 경계에서 돌출을 재며 선택한 경사면의 높이와 실제 하부를 함께 유도한다.
@evidence settings/20-envelope.md#ceilings 실내 노출 하부와 외부 처마 하부를 구별하고 낮은 널판 위 비거주 틈은 새 공간으로 만들지 않는다.
-->

[경사지붕 설정](../../settings/20-envelope.md#roof-form)을 소비한다. 포치를 제외한 지붕은 평면 지지선 위치의 경사 상면을 Y=3.55m로 정한다. 이 값은 지붕 상면의 기준이고 벽 또는 보의 실제 받침 높이가 아니다. 경사는 22도, 매스의 법선 두께는 0.18m다. 각 지붕 owner가 지지선을 정하고 경사 상면을 이 입력에서 tan(22도)로 유도한다. 하부는 상면에서 수직으로 0.18/cos(22도)만큼 내려간 평행면이며 벽 상단과 받침은 이 하부에 맞춘다. 보·서까래·기와의 세부 단면은 외피/반복 단계에서 이 매스의 지지·두께와 대조해 소유한다.

처마 돌출은 지지선과 분리해 각 roof owner가 지정한 참조면에서 바깥쪽으로 수평 0.35m다. 외벽이 있는 노출 변의 참조면은 벽 바깥면이며, 중정을 향한 열린 변은 해당 중정 경계다. 겹침부의 참조면도 후보 매스 끝선을 결정하지만 합성 뒤 숨은 끝을 노출 처마로 세지 않는다. 수평 끝선 위치를 먼저 정한 뒤 이미 정의한 경사면의 높이를 그 위치에서 구한다. 두께 때문에 평면 외곽을 다시 늘리지 않는다. 이전의 벽 중심 지지선+0.35m는 두께 0.6m 외벽에서 실제 돌출이 0.05m만 남아 폐기했다. 예를 들어 외측 날개는 중심 지지선부터 끝선까지 0.30+0.35m이므로 끝 상면은 입력 산술상 약 Y=3.287m다. 이 값은 실측치나 compiled 결과가 아니다.

각 owner의 끝선과 notch를 적용한 모든 지붕 후보가 겹치는 부분은 위쪽 지붕 면의 높이가 가장 큰 영역만 외부 상면으로 남긴다. plane 교차선에서 자르고 같은 면을 두 번 남기지 않는다. 동고면의 소유 우선순위는 제실→서측→동측→주랑→포치 순이며 우선순위는 같은 위치의 중복 제거에만 쓰고 높이가 낮은 지붕으로 실루엣을 바꾸지 않는다. 제거한 영역의 하부 slab도 남기지 않는다. 노출된 외측 끝은 두께를 닫고, 지붕끼리 붙는 내부 접면에는 노출 끝마개를 추가하지 않는다. 어느 벽이 지붕 밑을 닫는지는 [박공 폐쇄](../junctions.md#gable-closures)를 따르며 열린 주랑에 새 막음벽을 추가하지 않는다.

지붕 합성 source는 `src/spaces/roofs/assembly.ts`이고 다른 owner의 매스 입력을 결합할 뿐 완결 시각 표면을 가져가지 않는다. 잘린 plane 조각도 원래 지붕 owner의 같은 surface ID에 남는다. 외부 처마 하부는 지붕 owner, 공간 내부에서 보이는 천장/지붕 하부는 해당 방 owner로 구획한다. 양쪽에서 같은 물리 부재를 복제하지 않는다. 낮은 널판 천장 위 비거주 구조 빈틈은 새 공간이나 접근 경로가 아니다.

관찰은 교차선 전부의 단면과 양쪽 perspective, 모든 노출 상면·처마 하부다. 지붕 누광·중복 면·열린 단면·기둥 위 공백이 발견되면 이 접합과 해당 지붕 owner를 함께 고친다. 실제 면 분할·법선·그림자는 아직 source가 없어 unverified다.

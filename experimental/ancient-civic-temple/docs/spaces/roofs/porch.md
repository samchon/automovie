# 정면 포치의 작은 박공

## 두 기둥 위의 입구 지붕 {#porch-roof}

<!--
@evidence principles/core/common.md#scope-preservation 정면의 작은 삼각 박공과 두 원주→보→roof 지지, 앞 처마와 후퇴벽 위 뒤끝, 두 반환벽 파라펫과의 만남을 함께 배정한다.
@evidence principles/core/common.md#substantive-completion 반환벽 안쪽 면 지지선의 상면 Y=4.00m, X=0의 축상 용마루, entrance-back~south-outer+0.35의 영역을 결정한다.
@evidence principles/core/common.md#declared-basis 경사·두께는 assembly를 소비하고 용마루 약 4.67m가 코핑 4.85m 아래에 물리는 관계를 입력 산술로 적는다.
@evidence principles/design/spaces.md#space-topology 기둥과 바닥은 직사각 외곽 안에 남고 앞 처마만 돌출하며 옆은 파라펫 반환벽이 닫아 새 동이나 옆 처마를 만들지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 포치 상면·트림 결속면·외부 하부는 porch roof가 맡고 현관 바닥/기둥, 반환벽·후퇴벽·삼각 막음 벽체를 복제하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 정면·양 사선·문턱 올려다봄과 후퇴벽 위 뒤끝, 반환벽과의 만남에서 받침 공백과 틈을 확인한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 포치 정체성에 별도 지지 상면과 파라펫 사이에 물린 폭, 후퇴벽 위 뒤끝을 정해 작은 박공이 읽힐 단면을 제공한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work entrance-porch의 원주·보·박공 지지와 수리된 roof-form의 코핑 범위를 대조했다. 포치를 반환벽 사이에 물리고 지지를 4.00m로 올리면 박공이 코핑 아래에서 읽혀 이 단위가 부모 결함을 드러내지 않았다.
@evidence settings/20-envelope.md#entrance-porch 두 원주 위 보가 남측 입면의 삼각 막음을 받고, 그 막음이 포치 하부까지 이어지는 작은 정면 박공을 넓은 회벽 파라펫 사이에 배정한다.
@evidence settings/20-envelope.md#roof-form 정면 포치의 작은 박공을 두 파라펫 사이에 물리고 박공 경사 22도를 쓴다.
-->

<!--
-->

[현관](../rooms/entrance.md#entrance-volume) 양옆 반환벽의 안쪽 면 west-porch-inner/east-porch-inner를 지지선으로 한다. 두 반환벽은 [남측 파라펫](../facades/south.md#south-envelope)과 같은 코핑 높이로 올라 포치의 옆을 닫으므로 포치 지붕은 두 면 사이에 물리고 옆 처마가 없다. 지지선 위치의 상면은 Y=4.00m이며 경사·법선 두께와 하부면 유도는 [공통 지붕 입력](assembly.md#roof-junctions)의 박공 값을 쓴다. 용마루는 X=0을 따라 정면을 향하고 그 상면은 입력 산술상 약 4.67m로 코핑보다 낮다. 작은 삼각 박공이 넓은 회벽 파라펫 사이 중앙에 놓인다.

Z 범위는 entrance-back부터 south-outer에서 0.35m 앞으로 나간 처마선까지다. 뒤끝은 현관 후퇴벽의 북쪽 면이며 후퇴벽은 포치 하부까지 올라 이 지붕을 받친다. 앞끝만 외곽 밖으로 돌출하고 포치 바닥·기둥은 직사각 외곽 안에 있다. 기둥 위 보의 윗면 Y=3.50m는 [삼각 막음](../facades/south.md#south-envelope)의 아랫면에 닿고, 남측 입면이 소유한 그 막음의 윗면이 포치 하부에 닿는다. 지지선 X=±1.65m의 포치 하부 Y≈3.806m까지 보와 지붕 사이 약 0.306m는 삼각 막음이 채우며, 보가 직접 지붕 하부에 닿는다고 세지 않는다.

source `src/spaces/roofs/porch.ts`가 포치 전체 상면·박공 트림 결속면·외부 처마 하부를 소유한다. 두 원주→수평 보→박공의 지지 관계를 실제 부재에서 보존하고 지붕이 공중에 떠 있지 않게 한다. 정면·양사선·문턱에서 올려다본 하부, 후퇴벽 위 뒤끝, 반환벽과의 만남을 관찰한다. 원주·트림의 상세 geometry와 마감은 아직 만들어지지 않았다.

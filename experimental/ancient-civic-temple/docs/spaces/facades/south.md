# 정면 외피의 단독 소유

## 후퇴 현관을 가진 남측 입면 {#south-envelope}

<!--
@evidence principles/core/common.md#scope-preservation 남쪽 양 날개와 중앙 후퇴벽·반환벽·포치 박공의 외측 면을 한 입면 소유에 포함한다.
@evidence principles/core/common.md#substantive-completion 중앙 절단의 X 범위와 외벽 두께, 기단 상단을 접지면 위 0.65m로 정해 정면 외피의 경계를 닫는다.
@evidence principles/core/common.md#declared-basis 외곽은 building, 상단은 roof 하부, 물리 접합은 junctions, 회벽/기단 관계는 외피 canon을 소비한다.
@evidence principles/design/spaces.md#space-topology 중앙 입구만 뒤로 물리고 양옆 외벽과 반환부를 이어 내부 주랑·현관의 경계와 같은 건물을 설명한다.
@evidence principles/design/spaces.md#space-boundary-authority 바깥 정면과 벽 실체만 south가 만들고 기둥 prototype·포치 roof·방 안쪽 표면은 각 원래 owner에 둔다.
@evidence principles/design/spaces.md#space-verification-address 정면·양 모서리·반환부와 문틀 단면에서 외부 형상과 실내 경계의 불일치를 찾는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 포치가 드러나는 정면 요구를 후퇴벽/반환면의 물리 소유와 지면을 따르는 기단 상단으로 구체화한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work walls의 회벽/석재 기단과 entrance-porch의 실제 원주·보·박공을 비교했다. 후퇴 외피에 모두 배정할 수 있어 판 하나로 단순화하거나 부모 외곽을 확장하지 않았다.
@evidence settings/20-envelope.md#walls 황토 회벽과 밝은 기단이 후퇴부까지 연속하는 외피로 배정된다.
@evidence settings/20-envelope.md#entrance-porch 중앙 입구의 원주·보·박공 관계를 입면에서 드러내고 단순 문 구멍으로 완료하지 않는다.
@evidence settings/20-envelope.md#material-language 회벽과 석재 기단은 실제 외피 범위를 덮으며 임의 표면 패치로 대체하지 않는다.
-->

[건물 외곽](../building.md#footprint)의 남쪽 면을 한 완결 시각 표면으로 소유한다. 외벽은 west-outer~west-porch-outer 및 east-porch-outer~east-outer 구간에서 south-inner~south-outer 두께를 갖고 중앙은 현관 후퇴부와 반환벽이다. 반환벽과 후퇴벽의 바깥면까지 남측 입면에 포함하며 실제 문 void는 [개구부](../openings.md#doors)가 소유한다. 내측 면은 봉헌실·주랑·관리실·현관의 해당 owner가 각각 소비한다.

일반 외벽의 처마 기준은 [지붕 상면 기준](../roofs/assembly.md#roof-junctions)을 소비하고 실제 벽 상단은 그 하부면에 맞춘다. 서·동 날개와 포치의 남쪽 박공은 [박공 폐쇄](../junctions.md#gable-closures)가 정한 범위에서 닫고 그 외측 면도 이 입면이 소유한다. 외벽 양끝과 후퇴 현관 접합은 [벽 접합](../junctions.md#wall-junctions)을 소비한다. 황토 회벽·밝은 석재 기단은 [외피 canon](../../settings/20-envelope.md#walls)을 따른다. 입면의 석재 기단 상단은 각 접지면 위 0.65m로 정해 낮은 정문 지면과 서비스 지면을 혼동하지 않는다. 포치의 실제 원주·보·박공이 중앙 입구를 드러내며 부재 상세는 models, 마감 수치는 materials로 넘긴다. 문만 있는 밋밋한 판으로 닫지 않는다.

source `src/spaces/facades/south.ts`는 남쪽 외벽 실체와 바깥면 전체를 소유한다. 현관 기둥 prototype이나 지붕을 중복 생성하지 않는다. 정면·양쪽 모서리·현관 반환부와 문틀 단면을 모두 관찰하고 바깥 형상이 실내 경계와 맞지 않으면 공유 벽 owner에서 고친다.

외벽·후퇴벽·반환벽의 하단은 [층의 지면 접합](../storey.md#wall-ground-contact)을 소비한다. 실내 Y=0이나 기단 마감의 상단을 벽 실체의 아래 끝으로 쓰지 않는다. 현관 석단과 문턱의 실제 부피를 존중하고, 지면 아래의 연장도 이 입면의 같은 벽 실체로 소유한다.

# 정면 외피의 단독 소유

## 후퇴 현관을 가진 남측 입면 {#south-envelope}

[건물 외곽](../building.md#footprint)의 남쪽 면을 한 완결 시각 표면으로 소유한다. 외벽은 west-outer~west-porch-outer 및 east-porch-outer~east-outer 구간에서 south-inner~south-outer 두께를 갖고 중앙은 현관 후퇴부와 반환벽이다. 반환벽과 후퇴벽의 바깥면까지 남측 입면에 포함하며 실제 문 void는 [개구부](../openings.md#doors)가 소유한다. 내측 면은 봉헌실·주랑·관리실·현관의 해당 owner가 각각 소비한다.

외벽 몸체 상단 기준은 Y=3.55m다. 이것은 박공 끝의 수평 절단 높이가 아니다. 서·동 날개와 포치의 남쪽 박공 벽은 각 지붕의 실제 하부 단면까지 이어서 닫고 그 외측 면도 이 입면이 소유한다. 황토 회벽·밝은 석재 기단은 [외피 canon](../../settings/20-envelope.md#walls)을 따른다. 입면의 석재 기단 상단은 각 접지면 위 0.65m로 정해 낮은 정문 지면과 서비스 지면을 혼동하지 않는다. 포치의 실제 원주·보·박공이 중앙 입구를 드러내며 부재 상세는 models, 마감 수치는 materials로 넘긴다. 문만 있는 밋밋한 판으로 닫지 않는다.

source `src/spaces/facades/south.ts`는 남쪽 외벽 실체와 바깥면 전체를 소유한다. 현관 기둥 prototype이나 지붕을 중복 생성하지 않는다. 정면·양쪽 모서리·현관 반환부와 문틀 단면을 모두 관찰하고 바깥 형상이 실내 경계와 맞지 않으면 공유 벽 owner에서 고친다.

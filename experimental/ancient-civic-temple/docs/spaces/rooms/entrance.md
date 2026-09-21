# 직사각형 안으로 물린 현관

## 정문과 포치의 깊이 {#entrance-volume}

공간 ID `entrance`는 [평면 기준선](../building.md#plan-datums)의 west-porch-inner~east-porch-inner, entrance-front~south-outer에 놓인 지붕 있는 외부 전이 공간이다. 뒤의 후퇴벽은 entrance-back~entrance-front이고 그 중앙 실제 양개문이 주랑으로 통한다. 정문 축에서 중정 중심까지 시선을 꺾는 벽이나 방은 없다. 양옆 반환벽은 porch-inner~porch-outer 사이의 실제 두께를 가지며 정면 외피와 이어진다.

두 단의 석단은 각 단높이 0.12m, 유효 디딤 0.35m이며 정면 외곽 안에서 도로 접점에서 Y=0의 현관 상부참으로 오른다. 계단 폭은 1.8m이고 상부참의 문 앞 깊이는 1.2m다. 두 포치 기둥의 기단은 각각 0.5m 정방형 이내, 중심 X=±1.35m, Z=9.68m로 채택해 반환벽과 중앙 계단을 피한다. 계단 양옆의 석재 받침은 기둥 밑에서 Y=0까지 연속해 두 기둥이 단높이가 다른 디딤 면에 걸치지 않는다. 부재는 [정면 포치](../../settings/20-envelope.md#entrance-porch)를 따라 실제 보·박공에 닿아야 하며 아직 부재 mesh는 없다.

source `src/spaces/rooms/entrance.ts`가 현관 공간, 석단·상부참, 안쪽 반환벽의 완결 표면을 맡는다. 바깥 정면과 포치 지붕은 각 [입면](../facades/south.md#south-envelope)과 [지붕](../roofs/porch.md#porch-roof) owner다. 관찰은 도로→두 단→상부참→열린 문→주랑의 종단면, 네 모서리와 문 안/밖 threshold이며 카메라 이동으로 실제 발 디딤 연결을 대신하지 않는다.

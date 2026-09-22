# 직사각형 안으로 물린 현관

## 정문과 포치의 깊이 {#entrance-volume}

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 중앙 디딤뿐 아니라 양측 기둥 받침과 후퇴벽 문턱까지 현관 안에 남겼다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 둘째 디딤과 참의 같은 높이를 명시해 깊이 예산에서 불필요한 세 번째 챌면을 만들지 않는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Z 구간 표는 south-outer에서 두 디딤을 뺀 산술이며 별도 측량값으로 제시하지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 높이별 cell이 늘어도 entrance 하나이며 정문 축과 중정 사이에 새 방을 끼우지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 안쪽 반환면과 바깥 정면, 포치 roof를 각각 다른 완결 표면의 기존 owner로 보낸다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 종단면과 문 양면 threshold에서 도로→디딤→참→주랑이 실제 이어지는지를 묻게 했다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 포치 약속에 두 단의 실제 수평 면과 같은 높이의 두 기둥 받침 위치를 추가했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 기둥 예산과 단높이/디딤 제약을 후퇴부 안에서 함께 적용해 외곽 확장이 필요하지 않았다.
@evidenceReview settings/20-envelope.md#entrance-porch #a164498 기둥 받침이 서로 다른 디딤 높이에 걸치지 않고 보·박공에 닿아야 한다는 조건이 있다.
@evidenceReview settings/10-building.md#ground-access #be07d7d 경사 support로 계단을 덮지 않는 본문이 부모의 실제 석단 접근을 보존한다.
-->

<!--
@evidence principles/core/common.md#scope-preservation 직사각 외곽 안에 후퇴 현관·두 석단·상부참·기둥 받침과 후퇴벽 문턱을 함께 수용한다.
@evidence principles/core/common.md#substantive-completion 단높이 0.12m·디딤 0.35m·폭 1.8m, 참 깊이와 기둥 중심 및 구간별 cell 아래 경계를 결정한다.
@evidence principles/core/common.md#declared-basis 현관 범위는 평면 기준선에서, 높이는 도로/층에서 받고 표의 Z 구간은 디딤 깊이에서 뺀 산술이라고 명시한다.
@evidence principles/design/spaces.md#space-topology 한 entrance 안에서 계단과 양측 받침의 cell만 나누며 정문에서 주랑·중정 축까지 새 방을 끼우지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 계단·참·안쪽 반환면은 현관, 바깥면은 남측 입면, 지붕은 porch owner로 나눈다.
@evidence principles/design/spaces.md#space-verification-address 도로부터 열린 문까지의 종단면에서 실제 디딤과 cell 아래 경계를 대조하고 문 양면 및 기둥 받침 단면도 본다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 포치와 낮은 석단이라는 설정을 도로 높이차를 메우는 두 단의 단면·기둥 자리로 구체화한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work entrance-porch의 두 원주와 ground-access의 단높이/디딤 한계를 대조했다. 외곽 안 후퇴부에 두 단과 참을 배정할 수 있어 도로로 돌출하거나 부모 단차를 바꾸지 않았다.
@evidence settings/20-envelope.md#entrance-porch 두 기둥의 같은 높이 받침과 보·박공 접촉을 현관 안에 예약한다.
@evidence settings/10-building.md#ground-access 실제 수평 디딤과 두 챌면으로 정문 높이차를 해결하고 경사 support로 대신하지 않는다.
-->

공간 ID `entrance`의 본체는 [평면 기준선](../building.md#plan-datums)의 west-porch-inner~east-porch-inner, entrance-front~south-outer에 놓인 지붕 있는 외부 전이 공간이다. 뒤의 후퇴벽은 entrance-back~entrance-front이고 그 중앙 실제 양개문이 주랑으로 통한다. 정문 축에서 중정 중심까지 시선을 꺾는 벽이나 방은 없다. 양옆 반환벽은 porch-inner~porch-outer 사이의 실제 두께를 가지며 정면 외피와 이어진다.

후퇴벽 안 `door-entry`의 문턱 바닥과 통과 부피는 [층의 배정](../storey.md#threshold-support)에 따라 이 현관에 귀속하며 상부참에서 주랑 쪽 벽면까지 연속한다.

두 단의 석단은 각 단높이 0.12m, 유효 디딤 0.35m이며 정면 외곽 안에서 도로 접점에서 Y=0의 현관 상부참으로 오른다. 계단 폭은 1.8m이고 상부참의 문 앞 깊이는 1.2m다. 두 포치 기둥의 기단은 각각 0.5m 정방형 이내, 중심 X=±1.35m, Z=9.68m로 채택해 반환벽과 중앙 계단을 피한다. 계단 양옆의 석재 받침은 기둥 밑에서 Y=0까지 연속해 두 기둥이 단높이가 다른 디딤 면에 걸치지 않는다. 부재는 [정면 포치](../../settings/20-envelope.md#entrance-porch)를 따라 실제 보·박공에 닿아야 하며 아직 부재 mesh는 없다.

종단면은 south-outer에서 -Z 방향으로 앞 문단의 디딤 깊이를 두 번 빼고, 남은 구간을 entrance-front까지의 상부참으로 정한다. 높이는 [도로와 층 바닥](../storey.md#ground-storey)에 결속한다. 아래 수치는 이 입력의 산술을 보인 것이며 별도 치수 원본이나 compiled 측정값이 아니다.

| 중앙 계단 구간 | Z 범위(m) | 완성면 Y(m) | 접합 |
| --- | --- | --- | --- |
| 첫 디딤 | 9.90~10.25 | -0.12 | south-outer에서 도로보다 한 단 높음 |
| 둘째 디딤 | 9.55~9.90 | 0 | 첫 디딤에서 한 단 올라옴 |
| 문 앞 상부참 | 8.35~9.55 | 0 | 둘째 디딤과 같은 높이로 연속 |

중앙 구간의 X 범위는 계단 폭의 절반을 축 양쪽에 적용한다. 그 바깥에서 현관 안쪽 반환벽까지의 양측 석재 받침은 본체 깊이 전체에 Y=0으로 이어진다. 둘째 디딤과 상부참 사이에는 추가 챌면이나 겹친 상판을 만들지 않는다. 도로→첫 디딤과 첫째→둘째 사이만 수직 챌면이며, 그 위를 경사 지지면으로 덮지 않는다. 디딤·참·받침의 실제 상면과 수직 면은 같은 현관 바닥 owner가 소유한다. 보행 support는 실제 수평 면에만 배정하고 기둥 기단과 열린 문짝이 차지한 곳을 통과 여유로 세지 않는다.

현관은 한 `entrance` 공간이며 바닥 높이가 바뀌는 구간과 양측 받침에서 `cells`를 나눈다. 아래 경계는 각 구간의 완성면이고 위 경계는 [합성된 포치 지붕](../roofs/porch.md#porch-roof)의 실제 하부다. 계단의 최저 높이를 현관 전체의 바닥으로 복사해 석재 내부를 공간에 포함하지 않는다. 동일 높이의 둘째 디딤·참은 합칠 수 있고, 경사지붕 때문에 더 나눈 cell도 같은 공간에 남는다. 후퇴벽의 문턱 통과 cell은 기존 층 배정을 따른다. cell 접면은 물리벽·새 방·새 순환 경로를 만들지 않으며, 실제 보·기둥·문짝 충돌은 별도로 확인한다.

source `src/spaces/rooms/entrance.ts`가 현관 공간, 석단·상부참, 안쪽 반환벽의 완결 표면을 맡는다. 바깥 정면과 포치 지붕은 각 [입면](../facades/south.md#south-envelope)과 [지붕](../roofs/porch.md#porch-roof) owner다. 관찰은 도로→두 단→상부참→열린 문→주랑의 종단면, 네 모서리와 문 안/밖 threshold이며 카메라 이동으로 실제 발 디딤 연결을 대신하지 않는다.

# 직사각형 안으로 물린 현관

## 정문과 포치의 깊이 {#entrance-volume}

<!--
@evidence principles/core/common.md#scope-preservation 직사각 외곽 안에 후퇴 현관·두 석단·상부참·기둥 받침과 후퇴벽 문턱을 함께 수용한다.
@evidence principles/core/common.md#substantive-completion 단높이 0.12m·디딤 0.35m·폭 1.8m, 참 깊이와 기둥 중심 Z=10.00m·보 폭 및 구간별 cell 아래 경계를 결정한다.
@evidence principles/core/common.md#declared-basis 현관 범위는 평면 기준선에서, 높이는 도로/층에서 받고 표의 Z 구간은 디딤 깊이에서 뺀 산술이라고 명시한다.
@evidence principles/design/spaces.md#space-topology 한 entrance 안에서 계단과 양측 받침의 cell만 나누며 정문에서 주랑·중정 축까지 새 방을 끼우지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 계단·참·안쪽 반환면은 현관, 바깥면은 남측 입면, 지붕은 porch owner로 나눈다.
@evidence principles/design/spaces.md#space-verification-address 도로부터 열린 문까지의 종단면에서 실제 디딤과 cell 아래 경계를 대조하고 문 양면 및 기둥 받침 단면도 본다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 포치와 낮은 석단이라는 설정을 도로 높이차를 메우는 두 단의 단면·기둥 자리로 구체화한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work entrance-porch의 두 원주와 ground-access의 단높이/디딤 한계를 대조했다. 외곽 안 후퇴부에 두 단과 참을 배정할 수 있어 도로로 돌출하거나 부모 단차를 바꾸지 않았다.
@evidence settings/20-envelope.md#entrance-porch 두 기둥의 같은 높이 받침과 기둥 위 보·삼각 막음의 접촉을 정면 가까이 현관 안에 예약한다.
@evidence settings/10-building.md#ground-access 실제 수평 디딤과 두 챌면으로 정문 높이차를 해결하고 경사 support로 대신하지 않는다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 두 단과 상부참, 양측 받침 위 두 기둥, 기둥 위 보와 후퇴벽 문턱까지 현관 안에 남겨 정면 포치의 부재가 빠지지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 기둥 중심 Z=10.00m와 보 폭 0.30m가 적혀 보가 기둥 머리에 얹히는 위치를 source가 새로 고르지 않는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Z 구간 표는 south-outer에서 두 디딤을 뺀 산술이고, 기둥 기단 앞면을 south-outer에 맞춘 선택은 이 H2에서 별도로 채택했다고 밝힌다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 기둥을 앞으로 옮겨도 entrance 하나 안의 cell과 받침만 쓰며 정문 축과 중정 사이에 새 방을 끼우지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 보 위 삼각 막음은 남측 입면, 안쪽 반환면과 석단은 현관, 포치 roof는 porch owner로 남아 한 면의 이중 저작이 없다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 기둥 받침을 지나는 평행 단면과 종단면을 적어 기둥이 첫 디딤 옆 받침 위에 서는지 확인하게 했다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 포치 약속을 두 단의 수평 면, 받침 위 기둥 자리, 정면 쪽 보 위치로 구체화했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 기둥을 받침 앞끝으로 옮기는 것은 현관 안 배치 조정이며 단높이·디딤 제약과 외곽을 바꾸지 않아 부모 수정이 필요 없었다.
@evidenceReview settings/20-envelope.md#entrance-porch #a164498 기둥 두 개가 같은 높이 받침에 서고 그 위 보가 삼각 막음과 포치를 받쳐 부모의 원주·보·박공 연결을 따른다.
@evidenceReview settings/10-building.md#ground-access #be07d7d 첫 디딤과 둘째 디딤의 두 챌면만 두고 받침 위 기둥이 디딤 면을 점유하지 않아 실제 석단 접근이 유지된다.
-->

공간 ID `entrance`의 본체는 [평면 기준선](../building.md#plan-datums)의 west-porch-inner~east-porch-inner, entrance-front~south-outer에 놓인 지붕 있는 외부 전이 공간이다. 뒤의 후퇴벽은 entrance-back~entrance-front이고 그 중앙 실제 양개문이 주랑으로 통한다. 정문 축에서 중정 중심까지 시선을 꺾는 벽이나 방은 없다. 양옆 반환벽은 porch-inner~porch-outer 사이의 실제 두께를 가지며 정면 외피와 이어진다.

후퇴벽 안 `door-entry`의 문턱 바닥과 통과 부피는 [층의 배정](../storey.md#threshold-support)에 따라 이 현관에 귀속하며 상부참에서 주랑 쪽 벽면까지 연속한다.

두 단의 석단은 각 단높이 0.12m, 유효 디딤 0.35m이며 정면 외곽 안에서 도로 접점에서 Y=0의 현관 상부참으로 오른다. 계단 폭은 1.8m이고 상부참의 문 앞 깊이는 1.2m다. 두 포치 기둥의 기단은 각각 0.5m 정방형 이내, 중심 X=±1.35m, Z=10.00m로 채택해 반환벽과 중앙 계단을 피하고 기단 앞면을 south-outer에 맞춘다. 기둥 머리 위 수평 보는 south-outer 안쪽 0.30m 폭으로 놓여 [남측 입면](../facades/south.md#south-envelope)의 삼각 막음을 받치므로, 보·삼각 막음·포치 앞끝이 정면 가까이에서 한 박공으로 읽힌다. 계단 양옆의 석재 받침은 기둥 밑에서 Y=0까지 연속해 두 기둥이 단높이가 다른 디딤 면에 걸치지 않는다. 부재는 [정면 포치](../../settings/20-envelope.md#entrance-porch)를 따라 실제 보·박공에 닿아야 하며 아직 부재 mesh는 없다.

종단면은 south-outer에서 -Z 방향으로 앞 문단의 디딤 깊이를 두 번 빼고, 남은 구간을 entrance-front까지의 상부참으로 정한다. 높이는 [도로와 층 바닥](../storey.md#ground-storey)에 결속한다. 아래 수치는 이 입력의 산술을 보인 것이며 별도 치수 원본이나 compiled 측정값이 아니다.

| 중앙 계단 구간 | Z 범위(m) | 완성면 Y(m) | 접합 |
| --- | --- | --- | --- |
| 첫 디딤 | 9.90~10.25 | -0.12 | south-outer에서 도로보다 한 단 높음 |
| 둘째 디딤 | 9.55~9.90 | 0 | 첫 디딤에서 한 단 올라옴 |
| 문 앞 상부참 | 8.35~9.55 | 0 | 둘째 디딤과 같은 높이로 연속 |

중앙 구간의 X 범위는 계단 폭의 절반을 축 양쪽에 적용한다. 그 바깥에서 현관 안쪽 반환벽까지의 양측 석재 받침은 본체 깊이 전체에 Y=0으로 이어진다. 둘째 디딤과 상부참 사이에는 추가 챌면이나 겹친 상판을 만들지 않는다. 도로→첫 디딤과 첫째→둘째 사이만 수직 챌면이며, 그 위를 경사 지지면으로 덮지 않는다. 디딤·참·받침의 실제 상면과 수직 면은 같은 현관 바닥 owner가 소유한다. 보행 support는 실제 수평 면에만 배정하고 기둥 기단과 열린 문짝이 차지한 곳을 통과 여유로 세지 않는다.

현관은 한 `entrance` 공간이며 바닥 높이가 바뀌는 구간과 양측 받침에서 `cells`를 나눈다. 아래 경계는 각 구간의 완성면이고 위 경계는 [합성된 포치 지붕](../roofs/porch.md#porch-roof)의 실제 하부다. 계단의 최저 높이를 현관 전체의 바닥으로 복사해 석재 내부를 공간에 포함하지 않는다. 동일 높이의 둘째 디딤·참은 합칠 수 있고, 경사지붕 때문에 더 나눈 cell도 같은 공간에 남는다. 후퇴벽의 문턱 통과 cell은 기존 층 배정을 따른다. cell 접면은 물리벽·새 방·새 순환 경로를 만들지 않으며, 실제 보·기둥·문짝 충돌은 별도로 확인한다.

source `src/spaces/rooms/entrance.ts`가 현관 공간, 석단·상부참, 안쪽 반환벽의 완결 표면을 맡는다. 바깥 정면과 포치 지붕은 각 [입면](../facades/south.md#south-envelope)과 [지붕](../roofs/porch.md#porch-roof) owner다. 관찰은 도로→두 단→상부참→열린 문→주랑의 종단면, 기둥 받침 X=±1.35m를 지나는 [평행 단면](../observations.md#geometry-observations), 네 모서리와 문 안/밖 threshold다. 종단면 X=0은 기둥 받침을 지나지 않으므로 평행 단면에서 받침과 기둥의 접촉을 별도로 확인하며 카메라 이동으로 실제 발 디딤 연결을 대신하지 않는다.

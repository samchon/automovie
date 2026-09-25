# 신전의 이동식 비품과 소품

이 파일은 사물 단계의 재사용 prototype을 소유한다. 오른손 Y-up 미터 좌표와 [공통 축척](scale.md#reference-scale)을 쓰며 표의 각 행은 해당 part의 닫힌 점유 구간이다. 표의 X·Y·Z는 배치 좌표가 아니라 로컬 실체 범위이고, 점유 상자는 모든 part 범위의 합집합이다. 같은 prototype의 방별 복제 수·회전·간격은 instances가 정한다. 표면 id는 part 이름이며 별도 하위 표면이 필요한 경우에만 이름을 더한다. 모든 바닥 접촉형의 로컬 Y=0은 바닥면이고, 제조·하중·역사적 실물 복원을 주장하지 않는다.

## 대기와 작업용 석재 벤치 {#bench}

<!--
@evidence principles/core/common.md#scope-preservation 정문·중정·주랑·서비스 마당의 앉거나 물건을 놓는 낮은 벤치를 한 비품 원형으로 둔다.
@evidence principles/core/common.md#substantive-completion 상판과 두 받침의 닫힌 좌표, 접촉면, 폭 매개변수와 통행을 방해하지 않는 관찰을 정한다.
@evidence principles/core/common.md#declared-basis 이미지 01·03의 돌 기단과 05의 간소한 비품 규모를 참고하되 벤치 자체는 방별 비품을 채우라는 현 단계 사용자 지시의 저작 결정이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 방의 대기·작업 기능을 등받이 없는 석재 상판과 별도 받침 두 개로 좁힌다.
@evidence principles/design/models.md#representation-contract seat·pier의 접촉, 좌석 아래 빈 공간, 직육면체 proxy의 한계를 정한다.
@evidence principles/design/models.md#spatial-convention 바닥 중심 원점, 앞 +Z, 폭 변형과 합집합 점유 범위를 정한다.
@evidence principles/design/models.md#reviewable-structure 정면·옆면에서 열린 하부와 상판 돌출이 읽히는지 확인한다.
@evidence principles/design/models.md#model-observable-style-basis 장식 없는 두 지지체와 두꺼운 돌판으로 공용 비품을 읽히게 한다.
@evidence principles/design/models.md#model-scale-layer-completion 1.40m 기본형과 폭 1.10m 변형을 같은 접합법으로 정해 네 구역의 벤치 역할을 한 원형으로 닫는다.
@evidence settings/30-interiors.md#service-yard 낮은 외부 작업 공간의 운반물 주변에 놓이는 비품으로 연결한다.
@evidence settings/50-production.md#references 이미지 01·03·05의 절제된 돌·목재 집기 규모를 비교 기준으로 사용한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 서비스 마당의 열린 작업·반입 동선과 0.46m 높이 벤치를 대조했다. 벤치의 방별 위치가 통로를 가리는지는 instances의 배치 판단이고 건물 방 크기를 고칠 모순은 없다.
-->

벤치는 등받이·팔걸이 없는 석판과 분리된 두 석재 받침이다. 로컬 원점은 지면 중심, 앞은 +Z다. 기본 폭 W=1.40m, 짧은 변형 W=1.10m이며 다른 수치는 공유한다. 상판 두께 0.06m·깊이 0.45m, 윗면 Y=0.46m다. 받침 폭 0.12m·깊이 0.36m이고 두 중심은 X=±(W/2−0.17)m다. 받침은 Y=0~0.40m, 상판은 Y=0.40~0.46m라 접촉하고 아래 가운데는 열린다. 기본형 점유 상자는 1.40×0.46×0.45m이고 짧은 변형은 W만 대입한다.

| part | X | Y | Z |
| --- | --- | --- | --- |
| `seat` | X=−0.70~0.70m | Y=0.40~0.46m | Z=−0.225~0.225m |
| `pier` | X=−0.65~−0.53m 또는 X=0.53~0.65m | Y=0~0.40m | Z=−0.18~0.18m |

부재 대응: `seat`=상판; `pier`=받침.

part와 표면은 `seat`, `pier`다. `seat` 윗면은 쓰는 면이며 재료의 결은 후속 materials가 받는다. 검토 판의 정면·측면에서 0.40m 열린 하부와 두 받침의 분리를 본다. 지면과 떨어진 받침이나 막힌 상자형 벤치는 실패다.

## 들고 놓는 소형 등잔 {#portable-lamp}

<!--
@evidence principles/core/common.md#scope-preservation 정문·중정·봉헌실·업무방의 낮은 이동식 등잔을 불 없는 고정 상태로 정한다.
@evidence principles/core/common.md#substantive-completion 발·줄기·오목한 접시의 범위와 연결 높이, 16분할 원형 면을 정한다.
@evidence principles/core/common.md#declared-basis 35-objects#lampstands의 꺼진 금속 등잔을 작은 탁상·바닥 비품으로 파생한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 높은 제실 등잔대와 다른 높이의 휴대형 발·짧은 줄기·접시를 설계한다.
@evidence principles/design/models.md#representation-contract foot·stem·dish와 위로 열린 접시, 불꽃 없는 proxy를 정한다.
@evidence principles/design/models.md#spatial-convention 바닥 중심 원점과 0.24×0.28×0.24m 점유 상자를 정한다.
@evidence principles/design/models.md#reviewable-structure 측면에서 접시 깊이와 가는 지지대가 한 원통으로 합쳐지지 않는지 본다.
@evidence principles/design/models.md#model-observable-style-basis 이미지 02·04의 얕은 접시와 어두운 금속 실루엣을 소형으로 변주한다.
@evidence principles/design/models.md#model-scale-layer-completion 큰 등잔대와 소형 등잔의 규모 차이와 표면 경계가 정해져 방별 비품이 같은 원형을 쓴다.
@evidence settings/35-objects.md#lampstands 불을 켜지 않은 금속 접시형 등잔이라는 상태를 유지한다.
@evidence settings/30-interiors.md#services 꺼진 등잔 상태를 소형 비품에도 적용한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 기존 등잔의 불 없는 상태와 낮 주광을 0.28m 소형 등잔에 대조했다. 불꽃·연료 작동을 추가하지 않아 설비 설정을 고칠 결손이 없다.
-->

이 등잔은 [금속 등잔대](fixtures.md#lampstand)의 작은 이동식 변형이며 기름·심지·불꽃의 작동은 표시하지 않는다. 로컬 원점은 발 바닥 중심이다. 발은 반지름 0.10m·높이 0.035m의 16분할 원판, 줄기는 반지름 0.012m·Y=0.035~0.23m 원통, 접시는 바깥 반지름 0.12m·Y=0.23~0.28m의 열린 평바닥 컵이다. 접시 안쪽 반지름 0.105m, 바닥 두께 0.008m이며 윗면 고리 두께는 0.015m다. 줄기는 발 윗면과 접시 아랫면에 각각 닿는다. 점유 상자는 0.24×0.28×0.24m다.

| part | X | Y | Z |
| --- | --- | --- | --- |
| `foot` | X=−0.10~0.10m | Y=0~0.035m | Z=−0.10~0.10m |
| `stem` | X=−0.012~0.012m | Y=0.035~0.23m | Z=−0.012~0.012m |
| `dish` | X=−0.12~0.12m | Y=0.23~0.28m | Z=−0.12~0.12m |

부재 대응: `foot`=발; `stem`=줄기; `dish`=접시.

part와 표면은 `foot`, `stem`, `dish`다. 세 회전체는 둘레 16분할이고 접시 안쪽 면은 별도 법선과 UV 이음을 가진다. 검토 판에서 원형 접시의 실제 오목함과 줄기 끝 접촉을 본다. 불꽃을 더하거나 접시를 막힌 원판으로 바꾸면 실패다.

## 항아리 두 자리 받침대 {#jar-rack}

<!--
@evidence principles/core/common.md#scope-preservation 보관실의 큰 도기 둘을 바닥에서 조금 띄워 세우는 하나의 재사용 받침을 정한다.
@evidence principles/core/common.md#substantive-completion 상판·두 홈·네 다리의 좌표와 열린 아래, 항아리 바닥보다 큰 홈을 정한다.
@evidence principles/core/common.md#declared-basis 30-interiors#storage의 벽 쪽 저장과 35-objects#vessels의 큰 항아리 바닥을 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 바닥 저장을 얕은 두 원형 홈의 낮은 받침 구조로 구체화한다.
@evidence principles/design/models.md#representation-contract top·leg·well의 실제 얕은 홈과 접촉면을 정하고 항아리 자체는 재저작하지 않는다.
@evidence principles/design/models.md#spatial-convention 바닥 중심 원점과 앞 +Z, 1.18×0.28×0.58m 점유를 정한다.
@evidence principles/design/models.md#reviewable-structure 위와 옆에서 두 홈, 네 다리, 상판 아래 개방을 본다.
@evidence principles/design/models.md#model-observable-style-basis 이미지 02·05의 분리된 보관 물건을 한 큰 상자로 덮지 않는 낮은 목재 받침으로 읽힌다.
@evidence principles/design/models.md#model-scale-layer-completion 큰 항아리와 손잡이 항아리의 바닥을 받는 홈 크기를 한 치수군으로 확정한다.
@evidence settings/30-interiors.md#storage 보관실 벽쪽 물품이 통로를 남기도록 놓이는 받침이다.
@evidence settings/35-objects.md#vessels 열린 밑바닥의 큰 도기와 분리된 받침으로 소비한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 보관실 벽쪽 저장 예약과 1.18×0.58m 받침을 대조했다. 홈은 도기 prototype을 바꾸지 않고 항아리의 실제 개수·접촉은 instances가 정하므로 공간·용기 부모 수리가 필요하지 않다.
-->

받침대는 항아리 둘의 prototype이 아니라 그 밑의 독립된 낮은 목재 가구다. 로컬 원점은 바닥 중심이며 긴 변은 X, 앞은 +Z다. 상판은 폭 1.18m·깊이 0.58m·두께 0.06m로 Y=0.22~0.28m에 있다. 네 다리는 정방 0.07m이고 중심 (X,Z)=(±0.52,±0.22)m에 놓여 Y=0~0.22m에서 상판에 닿는다. 상판의 두 원형 홈은 중심 X=±0.29m·Z=0, 반지름 0.16m, 깊이 0.012m이며 위로 열리고 판을 관통하지 않는다. 홈의 바닥 Y=0.268m는 항아리의 인스턴스 받침 datum이며 홈과 항아리 사이 실제 접촉 판단은 instances가 한다. 점유 상자는 1.18×0.28×0.58m다.

| part | X | Y | Z |
| --- | --- | --- | --- |
| `top` | X=−0.59~0.59m | Y=0.22~0.28m | Z=−0.29~0.29m |
| `leg` | X=−0.555~−0.485m 또는 X=0.485~0.555m | Y=0~0.22m | Z=−0.255~−0.185m 또는 Z=0.185~0.255m |
| `well` | X=−0.45~−0.13m 또는 X=0.13~0.45m | Y=0.268~0.28m | Z=−0.16~0.16m |

부재 대응: `top`=상판; `leg`=다리; `well`=홈.

part와 표면은 `top`, `leg`, `well`이다. `well`은 상판에서 깎아낸 두 홈의 바닥·벽 면 소유이고 독립 중복 실체가 아니다. 홈 원주는 16분할이다. 검토 판의 상면에서 두 빈 홈, 측면에서 열린 하부를 확인한다. 홈이 관통하거나 홈 없이 도기와 겹치는 판은 실패다.

## 양손 운반 멜대 {#carrying-yoke}

<!--
@evidence principles/core/common.md#scope-preservation 서비스 마당의 작은 운반 멜대를 가로대와 두 끝 고리로 정한다.
@evidence principles/core/common.md#substantive-completion 막대·고리의 치수·중심·접촉과 고정 상태를 정해 하중 계산으로 오해되지 않게 한다.
@evidence principles/core/common.md#declared-basis 서비스 마당 운반 기능과 바구니·항아리의 손잡이를 받되 역사 운반 방식의 고증은 하지 않는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 소수 운반물 배치를 손에 드는 가로대와 끝 고리라는 독립 물체로 분리한다.
@evidence principles/design/models.md#representation-contract beam·hook의 분리와 고리 구멍을 정하고 줄·하중은 포함하지 않는다.
@evidence principles/design/models.md#spatial-convention 막대 중심 원점, +X 장축, 1.16×0.17×0.12m 점유를 정한다.
@evidence principles/design/models.md#reviewable-structure 정면에서 가는 가로대와 두 고리 안쪽의 빈 공간을 본다.
@evidence principles/design/models.md#model-observable-style-basis 마당의 손운반 규모를 단순한 목재 직선과 금속 고리의 구성으로 읽힌다.
@evidence principles/design/models.md#model-scale-layer-completion 양끝 고리의 범위와 배치 후 들기 동작 제외를 확정한다.
@evidence settings/30-interiors.md#service-yard 열린 작업 마당의 소수 운반물에 속한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 서비스 마당의 소수 운반물 역할을 1.16m 막대와 정지된 두 고리로 시험했다. 실제 운반 동작과 하중을 약속하지 않아 공간 경로·상태의 누락을 만들지 않는다.
-->

멜대는 사용하지 않을 때 내려놓는 고정 상태다. 로컬 원점은 막대 중심이고 장축은 +X다. 목재 가로대는 X=−0.58~0.58m·Y=−0.025~0.025m·Z=−0.025~0.025m다. 양끝 금속 고리는 YZ 평면의 외반지름 0.06m·내반지름 0.04m인 16×8분할 원환이고 중심 X=±0.50m·Y=−0.085m·Z=0이다. 고리의 윗면 Y=−0.025m가 막대 아랫면에 닿고 고리의 안쪽은 비어 있다. 점유 상자는 1.16×0.17×0.12m다.

| part | X | Y | Z |
| --- | --- | --- | --- |
| `beam` | X=−0.58~0.58m | Y=−0.025~0.025m | Z=−0.025~0.025m |
| `hook` | X=−0.51~−0.49m 또는 X=0.49~0.51m | Y=−0.145~−0.025m | Z=−0.06~0.06m |

부재 대응: `beam`=가로대; `hook`=고리.

part와 표면은 `beam`, `hook`이다. 두 고리는 같은 형상의 반복이며 첫 중심은 −X 쪽이다. 검토 판에서 고리 두 구멍과 나무·금속 부재의 분리를 본다. 실제 적재 강도나 운반 동작은 주장하지 않는다.

## 작은 손수레 {#handcart}

<!--
@evidence principles/core/common.md#scope-preservation 서비스 마당과 외부 길의 손수레를 하나의 고정형 prototype으로 정한다.
@evidence principles/core/common.md#substantive-completion 상판·두 바퀴·축·손잡이의 닫힌 범위와 바닥 접촉을 정한다.
@evidence principles/core/common.md#declared-basis 서비스 마당의 외부 반입이라는 설정에서 낮은 규모의 바퀴 달린 비품을 저작한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 반입 기능을 0.76m 너비의 두 바퀴 수레로 구체화한다.
@evidence principles/design/models.md#representation-contract deck·axle·wheel·handle의 분리와 열린 밑면, 정지된 바퀴를 정한다.
@evidence principles/design/models.md#spatial-convention 축 아래 바닥 중심 원점, 앞 +Z, 0.76×0.72×1.80m 점유를 정한다.
@evidence principles/design/models.md#reviewable-structure 정면과 측면에서 두 바퀴의 지면 접촉과 손잡이까지 읽힌다.
@evidence principles/design/models.md#model-observable-style-basis 작은 외부 반입을 거친 마차가 아닌 손수레 실루엣으로 한정한다.
@evidence principles/design/models.md#model-scale-layer-completion 문 통과를 위한 좁은 폭과 정지 상태, 구성품 범위를 확정한다.
@evidence settings/30-interiors.md#service-yard 외부 반입 문이 있는 작업 마당의 비품으로 받는다.
@evidence settings/10-building.md#ground-access 같은 높이의 외부 접근에 수레 바퀴가 맞닿는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 0.76m 수레 폭을 서비스 마당의 외부 문과 같은 높이 문턱에 대조했다. 바퀴가 바닥에 닿는 정지형 비품이며 새 경사로·문·굴림 상태가 필요하지 않다.
-->

손수레는 바퀴 둘과 긴 손잡이 둘이 붙은 작은 빈 운반대다. 로컬 원점은 바퀴 축의 수평 중심 아래 지면, 앞은 +Z다. 바퀴 중심은 (X,Y,Z)=(±0.34,0.23,0.10)m, 반지름 0.23m·두께 0.08m이고 X축 회전 원통 16분할이다. 두 바퀴의 바깥 X끝은 ±0.38m다. 축은 X=−0.34~0.34m, Y=0.23m, Z=0.10m를 잇는 반지름 0.018m 원통이다. 판은 X=−0.30~0.30m·Y=0.43~0.49m·Z=−0.65~0.60m다. 손잡이는 판 뒤쪽 Z=−0.65m에서 Z=−1.20m까지 X=±0.24m의 두 각재로 이어지고 Y=0.43~0.72m로 올라간다. 바퀴 아래는 Y=0에서 지면에 접하고 판 아래 중앙은 열려 있다. 점유 상자는 0.76×0.72×1.80m다.

| part | X | Y | Z |
| --- | --- | --- | --- |
| `deck` | X=−0.30~0.30m | Y=0.43~0.49m | Z=−0.65~0.60m |
| `axle` | X=−0.34~0.34m | Y=0.212~0.248m | Z=0.082~0.118m |
| `wheel` | X=−0.38~−0.30m 또는 X=0.30~0.38m | Y=0~0.46m | Z=−0.13~0.33m |
| `handle` | X=−0.26~−0.22m 또는 X=0.22~0.26m | Y=0.43~0.72m | Z=−1.20~−0.65m |

부재 대응: `deck`=판; `axle`=축; `wheel`=바퀴; `handle`=손잡이.

part와 표면은 `deck`, `axle`, `wheel`, `handle`이다. 바퀴는 정지된 고정 부재이고 굴림 애니메이션 인터페이스는 없다. 검토 판에서 두 바퀴의 같은 지면 접촉과 판 아래 빈 공간을 본다. 외관으로 하중 성능을 주장하지 않는다.

## 손잡이 있는 물동이 {#bucket}

<!--
@evidence principles/core/common.md#scope-preservation 정문·중정·마당의 손에 드는 물동이를 열린 몸체와 회전 손잡이 없이 고정된 고리로 정한다.
@evidence principles/core/common.md#substantive-completion 바닥·벌어진 윗입·안쪽 바닥·양쪽 손잡이 접점과 16분할을 정한다.
@evidence principles/core/common.md#declared-basis 35-objects#vessels의 열린 용기와 30-interiors#service-yard의 운반물을 작은 물동이로 파생한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 저장 항아리와 다른 벌어진 입·가로 손잡이의 작은 물 운반 도구로 분리한다.
@evidence principles/design/models.md#representation-contract body·handle, 열린 입, 실제 안쪽 바닥과 손잡이 아래 빈 공간을 정한다.
@evidence principles/design/models.md#spatial-convention 바닥 중심 원점과 0.32×0.45×0.30m 점유를 정한다.
@evidence principles/design/models.md#reviewable-structure 측면에서 손잡이 고리와 안쪽 깊이가 도기 항아리와 구별되는지 본다.
@evidence principles/design/models.md#model-observable-style-basis 물을 나르는 낮은 도구의 벌어진 입과 단일 고리 실루엣을 채택한다.
@evidence principles/design/models.md#model-scale-layer-completion 수반보다 작은 크기와 열린 경계, 방별 반복 소유를 정해 물동이 역할을 닫는다.
@evidence settings/35-objects.md#vessels 열린 입과 실제 곡면 손잡이가 있는 용기라는 입력을 받는다.
@evidence settings/30-interiors.md#service-yard 외부 작업 마당의 손운반 비품으로 받는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 열린 용기와 곡면 손잡이 설정을 0.45m 높이 물동이에 대조했다. 물의 실제 무게·흐름을 납품하지 않아 설비나 마당 용량을 새로 요구하지 않는다.
-->

물동이는 고정된 빈 용기이고 물 표면·실제 담기는 양은 모델에 없다. 로컬 원점은 바닥 중심이다. 몸체 바깥은 Y=0에서 반지름 0.11m, Y=0.28m에서 반지름 0.15m로 벌어지는 16분할 원뿔대다. 바닥 두께 0.02m이며 안쪽은 Y=0.02m에서 반지름 0.095m부터 입 아래 반지름 0.135m까지 열려 있다. 손잡이는 XY 평면에서 X=±0.14m·Y=0.27m 두 접점과 꼭대기 (0,0.44)m를 잇는 반원형 12구간 관이고 관 반지름 0.01m·둘레 8분할이다. 접점은 몸체 입술 내부까지 0.01m 들어가 끊기지 않으며 손잡이 가운데 아래는 빈 공간이다. 점유 상자는 0.32×0.45×0.30m다.

| part | X | Y | Z |
| --- | --- | --- | --- |
| `body` | X=−0.15~0.15m | Y=0~0.28m | Z=−0.15~0.15m |
| `handle` | X=−0.16~0.16m | Y=0.26~0.45m | Z=−0.01~0.01m |

부재 대응: `body`=몸체; `handle`=손잡이.

part와 표면은 `body`, `handle`이다. `body` 안쪽 면은 별도 법선·UV 이음이다. 검토 판에서 벌어진 입과 반원 손잡이의 실제 빈 공간을 본다. 손잡이 끝이 몸체에서 뜨거나 입이 막히면 실패다.

## 흙을 담은 낮은 화분 {#planter}

<!--
@evidence principles/core/common.md#scope-preservation 중정·포치 흙띠의 화분을 용기와 노출 흙면까지 정하고 식물은 별도 prototype으로 둔다.
@evidence principles/core/common.md#substantive-completion 바닥·테두리·내벽·흙면의 높이와 빈 윗공간을 정한다.
@evidence principles/core/common.md#declared-basis 40-environment#vegetation과 35-objects#vessels의 도기 형태를 포치·중정 비품으로 조합한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 열린 도기를 식재를 받을 낮고 넓은 화분으로 구분한다.
@evidence principles/design/models.md#representation-contract pot·soil 표면, 열린 위, 흙 위 식물의 별도 배치를 정한다.
@evidence principles/design/models.md#spatial-convention 바닥 중심 원점과 0.42×0.36×0.42m 점유를 정한다.
@evidence principles/design/models.md#reviewable-structure 평면에서 흙면이 도기 테두리 아래에 있고 화분 위가 열린지 본다.
@evidence principles/design/models.md#model-observable-style-basis 단순한 넓은 입의 도기와 작은 흙 면으로 정원 장식 과장을 피한다.
@evidence principles/design/models.md#model-scale-layer-completion 식물 개체·위치는 instances에 넘기고 도기와 흙의 경계만 이 원형에서 닫는다.
@evidence settings/40-environment.md#vegetation 낮은 식생을 개별 식물 prototype으로 받으며 화분 자체가 나무를 대신하지 않는다.
@evidence settings/35-objects.md#vessels 실제 열린 입을 가진 도기 형상을 작은 외부 비품에 쓴다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 0.42m 화분은 낮은 식생과 열린 도기라는 부모 범위에 들어가며 흙면 위의 식물 수는 instances가 정한다. 건물의 식생 구역이나 용기 크기군을 바꿀 필요가 없다.
-->

화분은 외부에 놓는 넓은 도기다. 로컬 원점은 바닥 중심이다. 바깥 몸체는 바닥 반지름 0.14m에서 윗입 반지름 0.21m까지 Y=0~0.36m로 벌어지고, 안쪽은 반지름 0.12m에서 0.19m까지 바닥 Y=0.03m에서 열린다. 테두리는 반지름 방향 두께 0.02m다. 노출 흙면은 윗면 Y=0.270m·두께 0.001m인 반지름 0.18m 원판이며 테두리보다 0.09m 낮다. 그 위 식물은 [풀 prototype](landscape.md#grass-tuft)의 인스턴스이고 흙면 자체는 심을 수 있는 구멍을 만들지 않는다. 원형 면은 16분할이다. 점유 상자는 0.42×0.36×0.42m다.

| part | X | Y | Z |
| --- | --- | --- | --- |
| `pot` | X=−0.21~0.21m | Y=0~0.36m | Z=−0.21~0.21m |
| `soil` | X=−0.18~0.18m | Y=0.269~0.270m | Z=−0.18~0.18m |

부재 대응: `pot`=화분; `soil`=흙면.

part와 표면은 `pot`, `soil`이다. `soil`은 0.001m 두께의 노출 원판이고 `pot`과 부피를 겹쳐 방출하지 않는다. 검토 판의 평면·측면에서 흙면이 테두리 안쪽에 담기고 외벽을 뚫지 않는지 본다. 식물의 종류와 개수는 이 모델의 형상이 아니다.

## 무문양 봉헌판 {#votive-plaque}

<!--
@evidence principles/core/common.md#scope-preservation 제실·봉헌실·주랑의 작은 봉헌판을 서는 받침과 글자 없는 판으로 정한다.
@evidence principles/core/common.md#substantive-completion 받침 폭과 앞뒤 안정 면, 판 높이·두께·접촉을 정한다.
@evidence principles/core/common.md#declared-basis 10-building#civic-identity의 가짜 비문 금지와 30-interiors#offering-room의 작은 봉헌물을 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 손에 들 수 있는 봉헌물을 무문양 판과 낮은 받침의 조합으로 좁힌다.
@evidence principles/design/models.md#representation-contract base·slab의 분리와 앞뒤 평면, 판 자체의 글자·그림 부재를 정한다.
@evidence principles/design/models.md#spatial-convention 바닥 중심 원점, 앞 +Z, 0.36×0.42×0.14m 점유를 정한다.
@evidence principles/design/models.md#reviewable-structure 정면·옆면에서 얇은 판이 낮은 발에 서 있는지 본다.
@evidence principles/design/models.md#model-observable-style-basis 읽히는 비문 대신 윤곽과 빈 판으로 작은 봉헌 표시를 만든다.
@evidence principles/design/models.md#model-scale-layer-completion 한 크기 원형을 여러 방에 반복하고 내용 글자는 포함하지 않는다.
@evidence settings/10-building.md#civic-identity 고대 언어의 가짜 비문을 물체 표면에도 만들지 않는다.
@evidence settings/30-interiors.md#offering-room 손에 드는 작은 봉헌물의 한 종류로 놓인다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 작은 봉헌물 규모와 읽을 수 없는 문자 경계를 무문양 판에 적용했다. 봉헌실과 제실의 용도나 신격 정체성을 새로 발명할 결손이 없다.
-->

봉헌판은 쓰거나 읽을 수 있는 글자가 없는 작은 직사각 판이다. 로컬 원점은 받침 바닥 중심이고 앞은 +Z다. 받침은 폭 0.36m·깊이 0.14m·높이 0.04m 상자다. 판은 폭 0.32m·높이 0.38m·두께 0.035m이며 중앙에서 Y=0.04~0.42m로 올라 받침 윗면에 닿는다. 새긴 문자·도상·실제 봉헌자 이름은 없다. 점유 상자는 0.36×0.42×0.14m다.

| part | X | Y | Z |
| --- | --- | --- | --- |
| `base` | X=−0.18~0.18m | Y=0~0.04m | Z=−0.07~0.07m |
| `slab` | X=−0.16~0.16m | Y=0.04~0.42m | Z=−0.0175~0.0175m |

부재 대응: `base`=받침; `slab`=판.

part와 표면은 `base`, `slab`이다. 검토 판의 앞·옆에서 판과 받침이 닿고 직사각 판의 두께가 남는지 본다. 글자가 읽히거나 받침 없이 공중에 서면 실패다.

## 낮은 봉헌 쟁반 {#offering-tray}

<!--
@evidence principles/core/common.md#scope-preservation 봉헌실의 그릇 아래 놓는 낮은 쟁반을 실제 테두리와 오목한 바닥으로 정한다.
@evidence principles/core/common.md#substantive-completion 바닥 판·네 림의 폭·두께·접촉과 빈 안쪽 범위를 정한다.
@evidence principles/core/common.md#declared-basis 30-interiors#offering-room의 작은 용기 진열과 35-objects#offering-table의 상판을 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 긴 공용 탁자 위의 작은 용기 집합을 낮은 운반 쟁반이라는 별도 원형으로 조직한다.
@evidence principles/design/models.md#representation-contract floor·rim의 닫힌 판과 열린 위, 담긴 그릇의 별도 인스턴스를 정한다.
@evidence principles/design/models.md#spatial-convention 바닥 중심 원점과 0.52×0.055×0.34m 점유를 정한다.
@evidence principles/design/models.md#reviewable-structure 위에서 열린 가운데와 네 림, 측면에서 실제 깊이를 본다.
@evidence principles/design/models.md#model-observable-style-basis 낮은 얇은 테두리가 탁자의 큰 석재 상판과 시각적으로 구별된다.
@evidence principles/design/models.md#model-scale-layer-completion 접시와 작은 도기의 받침 높이가 정해져 배치만 instances가 남긴다.
@evidence settings/30-interiors.md#offering-room 작은 봉헌 용기를 탁자 위에 모아 놓는 역할을 받는다.
@evidence settings/35-objects.md#offering-table 긴 상판 자체와 독립된 얕은 비품이다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 0.52×0.34m 쟁반은 봉헌 탁자 상판의 0.75m 폭 안에 놓일 수 있다. 탁자 형상·방 동선을 바꾸지 않고 작은 그릇의 배치는 instances에 남는다.
-->

쟁반은 열린 바닥을 네 개의 낮은 테두리가 감싼 직사각형이다. 로컬 원점은 아래면 중심, 긴 변은 X다. 바닥은 폭 0.52m·깊이 0.34m·두께 0.018m다. 네 림은 바닥 바깥 가장자리에서 안쪽으로 0.015m 두께이고 Y=0.018~0.055m로 오르며 모서리에서는 맞댄다. 안쪽의 유효 평면은 0.49×0.31m이고 바닥 윗면 Y=0.018m에서 열린다. 점유 상자는 0.52×0.055×0.34m다.

| part | X | Y | Z |
| --- | --- | --- | --- |
| `floor` | X=−0.26~0.26m | Y=0~0.018m | Z=−0.17~0.17m |
| `rim` | X=−0.26~0.26m | Y=0.018~0.055m | Z=−0.17~0.17m |

부재 대응: `floor`=바닥; `rim`=림.

part와 표면은 `floor`, `rim`이다. `rim` 행은 네 외곽 판의 합집합 범위이며 가운데를 채운 상자가 아니다. 검토 판의 평면·측면에서 빈 가운데와 네 테두리의 맞댐을 본다. 얕은 그릇 하나와 구별되지 않는 원판은 실패다.

## 접은 직물과 바닥 좌구 {#textile}

<!--
@evidence principles/core/common.md#scope-preservation 제단 천·봉헌실 천·관리실 천·기록실 덮개·보관실 덮개·제실 좌구를 한 직물 원형의 치수 변형으로 정한다.
@evidence principles/core/common.md#substantive-completion 가로·세로·두께 매개변수와 접힌 양끝, 바닥 접촉을 정한다.
@evidence principles/core/common.md#declared-basis 30-interiors#sanctuary와 #storage의 소품·보관물, 사용자 단계 2의 직물 요구에서 파생한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 방별 여러 천을 하나의 두께 있는 접힌 직물 proxy로 통합한다.
@evidence principles/design/models.md#representation-contract cloth의 양면·두께·접힘 경계와 미세 직조 제외를 정한다.
@evidence principles/design/models.md#spatial-convention 아래면 중심 원점, 앞 +Z, 0.55×0.045×0.40m 기본 점유를 정한다.
@evidence principles/design/models.md#reviewable-structure 측면에서 얇지만 0이 아닌 두께와 두 겹 접힘이 읽히는지 본다.
@evidence principles/design/models.md#model-observable-style-basis 거친 직조를 형상으로 과장하지 않고 낮은 접힘 윤곽으로 생활 소품을 읽힌다.
@evidence principles/design/models.md#model-scale-layer-completion W·D·T만 바꾼 변형을 여섯 역할에 쓰고 재질 차이는 materials에 넘긴다.
@evidence settings/30-interiors.md#sanctuary 제실의 제단 위 소품은 중심 위계를 가리지 않는다.
@evidence settings/30-interiors.md#storage 큰 용기를 다루는 방의 덮개 비품이다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 접은 천의 0.55m 기본 폭과 0.07m 좌구 높이를 제단·보관실의 낮은 비품 범위에 대조했다. 벽·문·제단 규모를 바꾸지 않고 천의 방별 놓임만 instances가 정한다.
-->

하나의 직물 원형에 폭 W·깊이 D·두께 T만 준다. 기본 접은 천은 W=0.55m·D=0.40m·T=0.045m다. 좌구는 W=0.50m·D=0.50m·T=0.07m, 작은 덮개는 W=0.42m·D=0.36m·T=0.03m 변형이다. 로컬 원점은 아래면 중심, 앞은 +Z다. 위와 아래 면은 분리되고 두 앞뒤 끝은 굴곡 없는 접힌 0.015m 폭 띠로 닫는다. 네 모서리는 단단한 직각으로 한정한 blocking proxy이며 실의 직조·주름 결·봉합선은 geometry가 아니다. 기본형 점유 상자는 0.55×0.045×0.40m이고 변형은 W×T×D를 대입한다.

| part | X | Y | Z |
| --- | --- | --- | --- |
| `cloth` | X=−0.275~0.275m | Y=0~0.045m | Z=−0.20~0.20m |

부재 대응: `cloth`=직물.

part와 표면은 `cloth`이고 윗면·아랫면·접힌 끝은 서로 다른 UV 이음이다. 검토 판에서 천이 놓인 면에 닿고 좌구 변형이 사람의 보행 포락보다 낮은지 본다. 보이지 않는 직물 물성을 형상에서 추론하지 않는다.

## 필기용 첨필 {#stylus}

<!--
@evidence principles/core/common.md#scope-preservation 관리실 작성 도구인 작은 첨필을 몸통과 뾰족한 끝으로 정한다.
@evidence principles/core/common.md#substantive-completion 길이·두께·끝 접점과 원통 분할을 정해 책상 위에서 읽히는 최소 형상을 확정한다.
@evidence principles/core/common.md#declared-basis 30-interiors#administration의 작업대·도구 용기와 이미지 05의 작은 작성 도구를 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 관리실의 작성 기능을 한 개의 짧은 무문양 필기구로 구체화한다.
@evidence principles/design/models.md#representation-contract shaft·tip의 접촉과 문자를 새기지 않는 외형을 정한다.
@evidence principles/design/models.md#spatial-convention 중앙 원점, +X 장축, 0.22×0.012×0.012m 점유를 정한다.
@evidence principles/design/models.md#reviewable-structure 위에서 가는 막대와 끝의 원뿔이 구별되는지 본다.
@evidence principles/design/models.md#model-observable-style-basis 기능을 과장된 장식 없이 가는 봉과 점으로 읽히게 한다.
@evidence principles/design/models.md#model-scale-layer-completion 필기판과 별개 원형으로 정하고 실제 글자 생성은 제외한다.
@evidence settings/30-interiors.md#administration 작은 작성실의 도구 용기와 작업대에 놓일 물체다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 관리실의 작성 작업과 0.22m 첨필을 대조했다. 글자 내용이나 손동작을 만들지 않으므로 기록실 계약·책상 상판 크기를 고칠 이유가 없다.
-->

첨필은 로컬 +X 방향으로 뾰족해지는 작은 막대다. 원점은 전체 길이의 중앙이다. 몸통은 X=−0.11~0.09m, 반지름 0.006m의 8분할 원통이다. 끝은 X=0.09~0.11m에서 반지름 0.006m에서 0으로 좁아지는 8분할 원뿔이며 몸통 끝면과 접한다. 손잡이 문양·실제 필기 자국은 없다. 점유 상자는 0.22×0.012×0.012m다.

| part | X | Y | Z |
| --- | --- | --- | --- |
| `shaft` | X=−0.11~0.09m | Y=−0.006~0.006m | Z=−0.006~0.006m |
| `tip` | X=0.09~0.11m | Y=−0.006~0.006m | Z=−0.006~0.006m |

부재 대응: `shaft`=몸통; `tip`=끝.

part와 표면은 `shaft`, `tip`이다. 검토 판에서 접합부에 틈이 없고 끝이 몸통과 다른 경사로 읽히는지 본다. 책상 위 실제 배치와 회전은 instances가 정한다.

## 글자 없는 필기판 {#writing-tablet}

<!--
@evidence principles/core/common.md#scope-preservation 관리실의 필기판을 나무 틀과 오목한 쓰기 면으로 정하되 실제 문서 본문은 만들지 않는다.
@evidence principles/core/common.md#substantive-completion 바깥 판·안쪽 면의 두께와 단차를 정해 상판 위에 놓을 수 있는 형상으로 닫는다.
@evidence principles/core/common.md#declared-basis 30-interiors#administration의 작성 상태와 10-building#civic-identity의 가짜 고대 글자 제외를 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 작성 책상 위 작업을 무문양 얕은 필기판으로 보이게 한다.
@evidence principles/design/models.md#representation-contract frame·writing-face의 표면 분리와 실제 움푹한 중앙을 정한다.
@evidence principles/design/models.md#spatial-convention 아래면 중심 원점과 0.28×0.025×0.22m 점유를 정한다.
@evidence principles/design/models.md#reviewable-structure 상면에서 테두리 네 면과 낮은 중앙이 읽히는지 본다.
@evidence principles/design/models.md#model-observable-style-basis 글자를 쓰지 않고 얕은 작업면과 목재 둘레만으로 작성 도구를 나타낸다.
@evidence principles/design/models.md#model-scale-layer-completion 첨필보다 큰 독립 판이지만 책상 상판보다 작아 작업실 소품의 관계가 닫힌다.
@evidence settings/30-interiors.md#administration 작업이 멈춘 작은 작성실의 책상 위 소품이다.
@evidence settings/10-building.md#civic-identity 가짜 비문과 문자 재현을 이 물체에서도 금지한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 글자 없는 0.28×0.22m 판은 관리실 책상 상판 안에 놓이고 작성 정지 상태를 유지한다. 새 문서 본문이나 방 기능을 부모에 추가할 필요가 없다.
-->

필기판은 글자 없는 얕은 사각 목재 틀이다. 원점은 아래면 중심, 긴 변은 X다. 바깥 폭 0.28m·깊이 0.22m·높이 0.025m이고 테두리는 안쪽으로 폭 0.018m 남긴다. 가운데 쓰기 면은 X=−0.122~0.122m·Z=−0.092~0.092m에 놓인 두께 0.001m의 빈 양피지 면으로 윗면 Y=0.014m다. 테두리 윗면 Y=0.025m와 0.011m 단차가 있고 중앙 판은 아래면 Y=0에서 막힌다. 점유 상자는 0.28×0.025×0.22m다.

| part | X | Y | Z |
| --- | --- | --- | --- |
| `frame` | X=−0.14~0.14m | Y=0~0.025m | Z=−0.11~0.11m |
| `writing-face` | X=−0.122~0.122m | Y=0.013~0.014m | Z=−0.092~0.092m |

부재 대응: `frame`=틀; `writing-face`=쓰기 면.

part와 표면은 `frame`, `writing-face`다. `writing-face`는 틀 내부의 윗면이며 중복된 판 부피가 아니다. 검토 판에서 중앙 단차를 읽고 빈 구멍이나 임의의 글자가 없는지 본다.

## 묶는 끈 뭉치 {#rope-coil}

<!--
@evidence principles/core/common.md#scope-preservation 기록실·보관실·마당의 묶는 끈을 세 동심 고리와 한 묶음 띠로 정한다.
@evidence principles/core/common.md#substantive-completion 세 반지름·관 굵기·띠 접촉과 분할 수를 정해 끈을 평면 그림으로 대체하지 않는다.
@evidence principles/core/common.md#declared-basis 35-objects#scrolls의 묶음 끈과 30-interiors#storage의 운반 보관 기능을 별도의 느슨한 비품으로 확장한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 두루마리 끈을 문서에 고정된 부분과 따로 놓인 끈 뭉치로 구별한다.
@evidence principles/design/models.md#representation-contract rope·tie의 접촉과 세 고리 사이 빈 간극을 정한다.
@evidence principles/design/models.md#spatial-convention 바닥 중심 원점과 0.226×0.024×0.226m 점유를 정한다.
@evidence principles/design/models.md#reviewable-structure 평면에서 세 선과 간극, 측면에서 작은 높이가 보이는지 본다.
@evidence principles/design/models.md#model-observable-style-basis 미세 꼬임 무늬 대신 세 두꺼운 원환의 실루엣으로 소도구를 읽힌다.
@evidence principles/design/models.md#model-scale-layer-completion 문서·용기·수레와의 실제 결속 관계는 instances에 남기고 놓인 상태를 완결한다.
@evidence settings/35-objects.md#scrolls 두루마리의 기존 묶음 끈과 같은 규모의 별도 비품이다.
@evidence settings/30-interiors.md#storage 보관실에서 물건을 묶는 비품의 자리다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 두루마리 묶음 끈과 보관실 물품 역할을 낮은 세 고리로 대조했다. 실제 결속 동작·장력은 약속하지 않아 문서 모델이나 보관실 접근을 수정하지 않는다.
-->

끈 뭉치는 실제 감김 역학이 아니라 내려놓은 세 동심 고리다. 로컬 원점은 바닥 중심이고 고리 중심은 모두 (0,0.008,0)m다. 중심선 반지름은 안쪽부터 0.045m·0.075m·0.105m, 관 반지름은 0.008m다. 각 원환은 주환 16분할·관 8분할이며 가장 가까운 고리 표면 사이에도 0.014m 빈 간극이 있다. X=−0.012~0.012m 폭의 얇은 묶음 띠는 Z=−0.113~0.113m로 세 고리 위 Y=0.016~0.024m에 닿아 고리들을 가로지르되 가운데 빈 구멍을 바닥까지 막지 않는다. 점유 상자는 0.226×0.024×0.226m다.

| part | X | Y | Z |
| --- | --- | --- | --- |
| `rope` | X=−0.113~0.113m | Y=0~0.016m | Z=−0.113~0.113m |
| `tie` | X=−0.012~0.012m | Y=0.016~0.024m | Z=−0.113~0.113m |

부재 대응: `rope`=고리; `tie`=묶음 띠.

part와 표면은 `rope`, `tie`다. 검토 판에서 세 간극과 띠의 위쪽 접촉을 본다. 끈 한 가닥의 미세한 꼬임, 물체를 실제로 묶는 물리 동작은 표시하지 않는다.

# 제실 의례와 보관의 별도 사물

기존 용기·접은 직물·두 항아리 받침대만으로 읽히지 않는 세 실루엣이다. 모두 로컬 Y-up 미터 좌표를 쓰며 배치와 재료는 각각 instances와 materials가 소유한다. 의례 절차나 특정 시대 유물의 실물 복원을 주장하지 않는다.

## 낮은 향로 {#censer}

<!--
@evidence principles/core/common.md#scope-preservation 제실의 낮은 향 받침을 운반 쟁반과 그릇의 우연한 조합이 아닌 별도 물체로 정한다.
@evidence principles/core/common.md#substantive-completion 발·줄기·재를 담는 컵과 꺼진 향 세 개의 치수·표면·상태를 정한다.
@evidence principles/core/common.md#declared-basis 사용자 사물 단계 지시의 향로 예시와 제실의 제단 중심 기능을 근거로 삼는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 제실의 얕은 봉헌 그릇과 구별되는 높이와 줄기 실루엣을 낸다.
@evidence principles/design/models.md#representation-contract foot·stem·cup·ash·incense의 부재와 열린 컵을 정한다.
@evidence principles/design/models.md#spatial-convention 바닥 중심 원점과 0.22×0.35×0.22m 점유를 정한다.
@evidence principles/design/models.md#reviewable-structure 컵 속 재와 세 향 줄기가 제단 위에서 분리되어 보이는지 검사한다.
@evidence principles/design/models.md#model-observable-style-basis 불꽃·연기 없이 간소한 저상 의례 소품으로 읽히게 한다.
@evidence principles/design/models.md#model-scale-layer-completion 제단 상판 1.10m 위에서 전체 높이 0.35m가 채광구보다 낮다.
@evidence settings/30-interiors.md#sanctuary 제실의 제단과 봉헌 용기 중심을 별도 작은 의례물로 구체화한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 향로는 봉헌 그릇과 별도 실루엣이지만 기존 제단 상판에 들어가므로 방 규모 수리는 없다.
-->

로컬 원점은 발 바닥의 중심이다. 원뿔대 발은 Y=0~0.04m, 아래 반지름 0.11m·위 0.09m다. 반지름 0.025m 줄기는 Y=0.04~0.16m이며 발과 줄기의 윗끝은 0.04+0.12=0.16m다. 컵은 바깥쪽 (Y,반지름)=(0.16,0.075),(0.23,0.105)m, 안쪽은 (0.23,0.09),(0.18,0.065)m로 돌아와 열린 윗면과 재를 담는 빈 공간을 만든다. 재 원판은 Y=0.185~0.19m, 반지름 0.064m다. 꺼진 향 세 가닥은 X=−0.04m, 0, +0.04m에 서며 Y=0.19~0.35m, 반지름 0.003m다. 점유 상자는 0.22×0.35×0.22m다. 발·줄기·컵은 회전체 20분할, 향은 팔각기둥이다.

| prototype | part | X | Y | Z |
| --- | --- | --- | --- | --- |
| `object.censer` | `foot` | X=−0.110~0.110m | Y=0.000~0.040m | Z=−0.110~0.110m |
| `object.censer` | `stem` | X=−0.025~0.025m | Y=0.040~0.160m | Z=−0.025~0.025m |
| `object.censer` | `cup` | X=−0.105~0.105m | Y=0.160~0.230m | Z=−0.105~0.105m |
| `object.censer` | `ash` | X=−0.064~0.064m | Y=0.185~0.190m | Z=−0.064~0.064m |
| `object.censer` | `incense` | X=−0.043~0.043m | Y=0.190~0.350m | Z=−0.003~0.003m |

부재 대응: `foot`=발; `stem`=줄기; `cup`=컵; `ash`=재; `incense`=향.

part와 표면은 `foot`, `stem`, `cup`, `ash`, `incense`다. 제실 제단의 상판에 놓이며 향은 타지 않는다. 검토 판의 정면·측면에서 낮은 받침과 열린 컵, 세 줄기가 보이지 않거나 봉헌 쟁반으로 읽히면 실패다.

## 바닥 좌구 {#floor-cushion}

<!--
@evidence principles/core/common.md#scope-preservation 제실의 바닥 좌구를 접어 쌓는 직물과 구분한다.
@evidence principles/core/common.md#substantive-completion 바닥층·두툼한 패드·뒤 접힘선의 치수와 접촉을 확정한다.
@evidence principles/core/common.md#declared-basis 사용자가 요구한 좌구 역할을 별도 prototype으로 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 낮은 제실 좌구를 접은 천의 세 겹 더미가 아니라 앉는 면으로 만든다.
@evidence principles/design/models.md#representation-contract base·pad·fold 부재와 윗면을 정한다.
@evidence principles/design/models.md#spatial-convention 바닥 중심 원점과 0.46×0.158×0.38m 점유를 정한다.
@evidence principles/design/models.md#reviewable-structure 펼친 평면과 두께가 접은 직물과 구별되는지 본다.
@evidence principles/design/models.md#model-observable-style-basis 장식·등받이 없는 낮은 앉는 면이다.
@evidence principles/design/models.md#model-scale-layer-completion 제단 앞쪽 접근을 막지 않는 0.46m 폭이다.
@evidence settings/30-interiors.md#sanctuary 제실의 인체 없는 중심 배치에서 바닥 비품으로만 쓴다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 좌구는 방 바닥에 놓이며 공간 cell과 제단 크기를 바꾸지 않는다.
-->

로컬 원점은 바닥 중심이다. 아래층 `base`는 폭 0.46m·깊이 0.38m·높이 0.04m이고 그 위 좌면 `pad`는 폭 0.42m·깊이 0.34m·높이 0.10m다. 뒤 접힘선 `fold`는 폭 0.42m·깊이 0.06m·높이 0.018m로 Y=0.14~0.158m에 놓인다. 세 부재가 위아래로 접해 전체 높이는 0.04+0.10+0.018=0.158m다. 점유 상자는 0.46×0.158×0.38m다.

| prototype | part | X | Y | Z |
| --- | --- | --- | --- | --- |
| `object.floor-cushion` | `base` | X=−0.230~0.230m | Y=0.000~0.040m | Z=−0.190~0.190m |
| `object.floor-cushion` | `pad` | X=−0.210~0.210m | Y=0.040~0.140m | Z=−0.170~0.170m |
| `object.floor-cushion` | `fold` | X=−0.210~0.210m | Y=0.140~0.158m | Z=−0.170~−0.110m |

부재 대응: `base`=아래층; `pad`=좌면; `fold`=뒤 접힘선.

part와 표면은 `base`, `pad`, `fold`다. 제실 바닥에 놓고 인물·관절은 포함하지 않는다. 검토 판 정면에서 낮은 좌면이 보이지 않고 접은 천 더미처럼만 보이면 실패다.

## 항아리 한 자리 받침 {#jar-stand}

<!--
@evidence principles/core/common.md#scope-preservation 보관실의 한 항아리 받침을 두 자리 선반 원형과 구별한다.
@evidence principles/core/common.md#substantive-completion 원형 발·기둥·윗 고리의 치수와 열린 중심을 정한다.
@evidence principles/core/common.md#declared-basis 사용자의 물동이 받침 예시와 보관실의 용기 분류를 근거로 삼는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 보관실 받침을 두 자리 목재 선반에서 한 자리 석재 받침으로 좁힌다.
@evidence principles/design/models.md#representation-contract foot·post·ring의 분리된 실체를 정한다.
@evidence principles/design/models.md#spatial-convention 바닥 중심 원점과 0.60×0.34×0.60m 점유를 정한다.
@evidence principles/design/models.md#reviewable-structure 높은 원형 받침이 선반이나 바구니처럼 읽히지 않는지 본다.
@evidence principles/design/models.md#model-observable-style-basis 장식 없는 세 원형 부재로 보관용 지지를 읽힌다.
@evidence principles/design/models.md#model-scale-layer-completion 저장 항아리보다 낮은 0.34m 높이와 한 자리 지름이다.
@evidence settings/30-interiors.md#storage 항아리와 보관 궤가 놓이는 방에 받침 하나를 더한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 기존 보관실 바닥 안에 놓이며 통로 폭과 벽을 바꾸지 않는다.
-->

로컬 원점은 바닥 중심이다. 발은 Y=0~0.05m의 반지름 0.30→0.29m 원뿔대, 기둥은 Y=0.05~0.30m의 반지름 0.06m 원통, 윗 받침 고리는 Y=0.30~0.34m의 반지름 0.17m 원통이다. 각 회전체의 둘레는 16분할이다. 세 부재는 수직으로 접해 높이가 0.05+0.25+0.04=0.34m이고 바깥 지름은 0.60m다. 점유 상자는 0.60×0.34×0.60m다.

| prototype | part | X | Y | Z |
| --- | --- | --- | --- | --- |
| `object.jar-stand` | `foot` | X=−0.300~0.300m | Y=0.000~0.050m | Z=−0.300~0.300m |
| `object.jar-stand` | `post` | X=−0.060~0.060m | Y=0.050~0.300m | Z=−0.060~0.060m |
| `object.jar-stand` | `ring` | X=−0.170~0.170m | Y=0.300~0.340m | Z=−0.170~0.170m |

부재 대응: `foot`=발; `post`=기둥; `ring`=윗 받침.

part와 표면은 `foot`, `post`, `ring`이다. 항아리 한 개만 놓는 받침이며 두 자리 선반이 아니다. 검토 판 옆면에서 기둥의 열린 둘레가 보이지 않고 통짜 항아리처럼 읽히면 실패다.

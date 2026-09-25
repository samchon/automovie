# 모델 population의 공통 기준

## 축척 기준과 표현 상한 {#reference-scale}

<!--
@evidence principles/core/common.md#scope-preservation 모든 prototype이 따를 좌표·단위, 공유 축척 기준(보행 포락 0.6×0.4×1.9m), settings 범위·spaces 순치수에서의 치수 유도, 표현 상한, 반복 부재를 instances에 넘기는 경계를 한 H2에 모두 둔다.
@evidence principles/core/common.md#substantive-completion 비교 규칙(점유 상자를 settings 범위와 보행 포락에 함께 대조, 통로를 막으면 실패)과 허용·금지 시각 주장 목록이 있어 각 모델 H2가 자기 상한과 축척을 다시 고르지 않는다.
@evidence principles/core/common.md#declared-basis 좌표는 00-delivery#coordinates, 축척은 10-building#use-profile, 상한은 50-production#fidelity, 표면 ID 경계는 20-envelope#material-language, prototype/배치 분담은 00-delivery#build-scope에서 온다고 문장마다 연결한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 보행 포락과 표현 수준을 모델 population의 비교 규칙·리뷰 거리 2~25m·곡면 분할과 법선 규칙이라는 모델 결정으로 바꾼다.
@evidence principles/design/models.md#representation-contract 결정론적 blocking geometry라는 proxy 상태와 허용 주장(실루엣·부재 분리·실제 빈 공간·두께)과 금지 주장(조각·세로 홈·풍화·정확한 고대 비례)을 population 전체에 정한다.
@evidence principles/design/models.md#spatial-convention 오른손 Y-up·m 단위를 쓰고 별도 앞·위 축을 두지 않으며 primitive 기본 크기를 치수로 쓰지 않는다는 좌표 규칙을 모든 모델에 건다.
@evidence principles/design/models.md#reviewable-structure 점유 상자와 보행 포락을 나란히 대조하는 규칙이 각 H2 검토 판의 공통 반증 기준이 된다.
@evidence principles/design/models.md#model-observable-style-basis 고대 지중해라는 표지를 부재 분리와 빈 공간으로만 읽히게 하고 세로 홈·조각·특정 오더 비례는 주장하지 않으며 색·거칠기는 materials 몫이라고 경계를 긋는다.
@evidence principles/design/models.md#model-scale-layer-completion 축척 기준·표현 상한·prototype 점유 상자·배치 기준점의 층을 함께 정해 반복 부재 H2가 배치 수 없이도 완결되게 한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work use-profile의 보행 포락, coordinates의 Y-up m, fidelity의 입체 부재 요구, build-scope의 prototype/instances 분담을 모든 모델 치수에 대조했고 모순이나 빠진 권위가 없어 부모를 고치지 않았다.
@evidence settings/00-delivery.md#coordinates 오른손 Y-up, 길이 m 규약을 모델 좌표로 그대로 쓴다.
@evidence settings/10-building.md#use-profile 성인 보행 포락 0.6×0.4×1.9m를 모든 모델의 공유 축척 기준으로 지명한다.
@evidence settings/50-production.md#fidelity 입체 부재가 리뷰 거리에서 읽히되 사진 같은 열화 복제는 증명하지 않는다는 요구를 blocking geometry 상한과 허용·금지 주장으로 옮긴다.
@evidence settings/20-envelope.md#material-language 색·roughness·texture 이미지와 반복 빈도는 materials가 결정하고 모델은 안정된 표면 ID와 1 UV=1m의 UV0 투영 좌표를 낸다고 정한다.
@evidence settings/00-delivery.md#build-scope 기둥·문짝·기와·집기 prototype은 models, 반복 배치는 instances라는 분담표를 반복 부재 규칙으로 옮긴다.
@evidence obligations/design/models.md#representation-ceiling population의 표현 상한과 모델이 주장할 수 없는 시각 추론(조각·세로 홈·풍화·기와 한 장씩의 불규칙·정확한 고대 비례)을 이 H2가 정한다.
@evidence obligations/design/models.md#reference-scale 공유 축척 기준을 보행 포락으로 지명하고 점유 상자를 settings 범위·포락과 대조하는 도출·검사 규칙을 정한다.
@evidenceExclude settings/00-delivery.md#coverage-map 설정 소유 지도는 settings 파일 사이의 색인이며 모델 H2는 지도가 가리키는 외피·실내·물체·환경 owner를 직접 인용하므로 지도 자체가 주는 모델 결정은 없다.
@evidenceExclude settings/00-delivery.md#delivery-scope 납품 범위의 공간 목록과 뷰어 약속은 spaces와 viewer가 받고, 모델 population은 build-scope가 models에 배정한 prototype 목록으로만 범위를 받는다.
@evidenceExclude settings/00-delivery.md#operative-subjects 주체 표의 물체·분수·주민 항목은 35-objects·30-interiors#fountain·10-building#use-profile로 이미 직접 소비되고 표 자체는 새 형상 결정을 주지 않는다.
@evidenceExclude settings/00-delivery.md#working-language 작업 언어는 모델 형상의 입력이 아니라 문서 표기 규칙이어서 accounts/models/core-common.md의 production-language 설명이 population 단위로 맡는다.
@evidenceExclude settings/10-building.md#fixed-graph 방 순서·문·주랑 루프는 spaces가 실현했고 모델은 그 결과를 방 volume과 문 표로만 받아 그래프를 직접 소비하는 prototype이 없다.
@evidenceExclude settings/10-building.md#scale 410~450㎡ 외곽과 장단변비는 spaces footprint가 소비했고 모델 치수는 보행 포락과 판정된 방 순치수에서 유도해 건물 면적을 쓰지 않는다.
@evidenceExclude settings/50-production.md#measurement-truth 모델 문서의 치수는 settings 범위와 판정된 spaces 값에서 유도한 입력이며 compiled 측정과 실패 기록은 modelSources가 생긴 뒤 그 source 관찰이 진다.
@evidenceExclude settings/50-production.md#runtime-boundary CJS producer와 뷰어 전달 경계는 source 전달 방식이며 prototype의 형상·표면·관절 결정 어느 것도 이 경계에서 오지 않는다.
@evidenceExclude spaces/building.md#containment 공간 부모 위계는 공간 identity 관계이고 모델 prototype은 공간 부모를 갖지 않으며 배치된 element의 부모는 instances가 정한다.
@evidenceExclude spaces/building.md#footprint 외곽 치수 선택은 건물 매스의 결정이며 모델은 그 외곽 대신 방·주랑·지붕 순치수와 기준선만 소비한다.
@evidenceExclude spaces/ownership.md#surface-map 표면 소유 지도는 spaces가 내는 벽·바닥·지붕 표면만 다루며 모델 표면 ID는 각 H2의 part 목록이 자기 prototype 안에서 정한다.
-->

모든 신전 모델은 오른손 Y-up, 길이 m의 [좌표 규약](../settings/00-delivery.md#coordinates)을 따르고 별도의 앞·위 축을 두지 않는다. 공유 축척 기준은 [이용 조건](../settings/10-building.md#use-profile)의 성인 보행 포락 폭 0.6m·깊이 0.4m·높이 1.9m다. 각 모델의 치수는 해당 settings 범위([물체](../settings/35-objects.md), [외피](../settings/20-envelope.md), [실내](../settings/30-interiors.md))와 판정된 spaces의 순치수(문 유효 폭·높이, 주랑 기둥 예산, 지붕 하부 높이)에서 유도하며 primitive 기본 크기를 치수로 쓰지 않는다. 비교 규칙은 모델의 점유 상자를 그 settings 범위와 보행 포락에 함께 대조하는 것이다. 범위를 벗어나거나 보행 포락보다 큰 집기가 방 통로를 막으면 그 모델 H2가 실패다.

표현 상한은 결정론적 blocking geometry다. 허용하는 시각 주장은 리뷰 거리(눈높이 1.6m, 대상까지 약 2~25m)의 실루엣, 부재 분리(기단·몸통·주두, 문틀·문짝의 선대·가로대·판, 테두리·몸통·목), 실제 빈 공간(문 개구, 수반 안쪽, 선반 칸, 궤 뚜껑의 틈), 실제 두께다. 조각 장식, 세로 홈, 공구 자국, 기하로 새긴 나뭇결과 기와 한 장씩의 불규칙, 기하로 새긴 풍화, 끈과 짜임의 미세 형상, 특정 고대 양식의 정확한 비례는 주장하지 않는다. 곡면은 각 H2가 정한 분할 수의 다면체이며 부드러운 법선은 그 H2가 요구한 곳에만 쓴다. 재료의 색·거칠기·결과 무늬는 materials가 정한다. 모델은 안정된 표면 ID와 다음 UV0 물리 좌표를 모두 낸다.

모든 방출 part는 position마다 유한한 UV0 한 쌍을 가진다. 로컬 원점에서 1 UV 단위는 1m다. 기본 평면 투영은 각 삼각형의 주법선 축으로 정한다. 법선 +X에는 (U,V)=(−Z,Y), −X에는 (Z,Y), +Y에는 (X,−Z), −Y에는 (X,Z), +Z에는 (X,Y), −Z에는 (−X,Y)를 쓴다. 각 경우 U×V는 해당 바깥법선을 향하므로 양면의 무늬가 거울상으로 뒤집히지 않는다. 면이 바뀌는 단단한 모서리와 서로 다른 part·표면 ID에서는 정점을 복제해 이음을 끊는다. 삼각형 하나 안에서 투영 축을 바꾸지 않는다. 잘린 끝면은 새 면 법선으로 다시 투영하고, 같은 면 안의 반복 부재는 각 prototype의 로컬 원점을 유지하므로 배치가 UV 원점을 새로 고르지 않는다. materials는 이 미터 좌표에서 반복 빈도·색·거칠기·텍스처 이미지를 결정한다. UV0가 없는 part에 texture를 결속하려 하면 source/viewer 검증이 실패해야 하며 단색으로 조용히 건너뛰지 않는다.

Y축 회전체의 옆면은 평면 투영 대신 +X 반직선에서 시작해 −Z 쪽으로 도는 각도 θ=atan2(−Z,X)를 [0,2π]로 펼치고 U=각 단면 고리의 실제 반지름×θ를 쓴다. V는 로컬 밑고리에서 시작해 단면을 이루는 연속 직선 구간마다 `√((ΔY)²+(Δ반지름)²)`를 누적한 모선 길이이며 원통에서는 Y와 같다. θ=0 이음의 정점을 복제한다. 원판 윗·아랫면은 기본 ±Y 투영이다. YZ 평면 원환의 큰 원 각도 0은 +Z에서 +Y로, XY 평면은 +X에서 +Y로, XZ 평면은 +X에서 −Z로 돈다. 큰 원 중심선의 호길이를 U, 작은 관 단면 호길이를 V로 하며 작은 관의 각도 0은 큰 원의 바깥 반경 방향으로 둔다. 두 닫힘 각도 0에서 이음을 복제한다. X축 원통의 θ=0은 +Z에서 +Y로, +X 축 방향 길이를 V로 둔다. Z축 연결 핀은 +Z 축을 기준으로 θ=0을 +X에서 +Y로 두고 U를 둘레 호길이, V를 +Z 방향 길이로 펼친다. −Z를 향하는 핀은 같은 +X 시접에서 −Y 쪽으로 돌아 U를 전개하고 V는 −Z 방향 길이로 둔다. 사선 나뭇가지 원통은 가지 시작점에서 축 방향 단위벡터에 +X를 직교 투영해 θ=0을 정하고, +X가 축과 평행하면 +Y, 그것도 평행하면 +Z를 같은 순서로 투영한다. 가지의 길이 방향을 V로 두고 시작점의 시접을 끝까지 평행 이동한다. 베지어 관은 아래 부착점에서 위 부착점으로 중심선 호길이를 U로 둔다. 시작 접선에 가장 덜 평행한 로컬 축을 X·Y·Z 순서로 고르고 접선에 직교 투영해 관 각도 0을 정한 뒤 구간마다 그 법선을 평행 이동해 시접을 잇는다. 길이 방향 결을 읽는 목재 각재는 해당 H2가 지정한 부재 장축을 U, 그에 직교하는 면 내 축을 V로 둔다. 비정형 면은 위 기본 평면 규칙을 따른다. normal·UV·part 범위는 modelSources의 concrete exported class가 함께 방출하며, class는 여기서 없는 투영법을 새로 고르지 않는다.

다음 표는 기본 평면 투영과 다른 표면을 빠짐없이 지정한다. 길이축 U는 각 부재가 점유하는 로컬 장축의 작은 좌표 끝에서 시작해 표에 적힌 양의 축으로 증가한다. 정방 다리·기둥은 밑끝, 서까래는 처마 끝, 트러스 버팀재는 낮은 발끝이 시작이다. 목재 장축 투영처럼 표가 V를 별도로 쓰지 않은 길이축 예외에서는 각 면의 단위 바깥법선 n과 단위 U 방향 u로 V 방향을 n×u로 정한다. 표가 V를 직접 지정한 경사 기와·이웃 지붕 등은 그 지정을 우선한다. 항아리·그릇 안쪽 면의 V 시작은 그 안쪽 단면의 가장 낮은 고리이며 바깥면과 내부 시접을 잇지 않는다. 이음은 표의 부재 끝·원주 시접에서 끊는다. 음의 길이 방향 부재는 배치 전에 prototype의 양의 길이축으로 뒤집으며, instances가 UV를 재작성하지 않는다.

| H2 | part·면 | UV0 투영과 이음 |
| --- | --- | --- |
| `columns#colonnade-column`, `columns#porch-column` | `base`, `shaft`, `capital`의 둥근 옆면 | Y축 원통 전개; 각 단면의 실제 반지름, +X 시접. 정방 `plinth`·주두 판은 기본 평면 투영. |
| `entablature#colonnade-beam` | 목재 `timber`의 노출 긴 면 | 부재 시작에서 길이 방향 +X를 U로 전개; 부재 끝·모서리에서 이음. `entablature#porch-entablature`의 석재 `beam`·`cornice`·`raking-trim`은 기본 평면 투영. |
| `entablature#rafter`, `#sanctuary-truss`, `#ceiling-joist` | `timber`, `tie-beam`, `principal`, `king-post`, `strut`의 목재 긴 면 | 각 각재의 지정된 처마→용마루 또는 한 끝→다른 끝 장축을 U로 전개; 각 부재 끝에서 이음. |
| `openings#door-frame`, `#window-frame` | 석재 `lining`, `surround` | 기본 평면 투영; 각 선대·가로대의 맞댐과 part 경계에서 이음. |
| `openings#double-door-leaf`, `#single-door-leaf` | `frame`, `panel`, `board`, `batten`, `strap`, `plate`, `pin`의 목재·쇠 띠 면 | 세로 판과 선대는 +Y, 가로대·띠는 +X를 U로 전개; 각 판·띠 끝에서 이음. `ring`은 XY 원환, `hinge`는 Y축 원통, `pin`은 문면 법선축 원통, `plate`는 기본 평면 투영. |
| `cladding#roof-tile` | `tegula`, `imbrex`의 윗면·곡면 | 로컬 +Z 경사 오름을 V, +X 가로를 U로 둔다. 반원통은 처마 쪽 −X 가장자리에서 +X 쪽으로 호길이 U를 펼친다. 단위의 Z 양끝과 두 part 경계에서 이음. |
| `cladding#ridge-tile` | `ridge` 반원통 | 로컬 +Z 용마루 길이를 V, −X 가장자리에서 +X로 도는 반원 호길이를 U로 펼친다. 각 단위의 Z 끝과 반지름 단차에서 이음. |
| `fixtures#fountain`, `#lampstand` | 돌·금속 원형 옆면, 노즐, 물줄기, 파문, 접시 | Y축 회전체와 원환 전개; 물면·받침의 수평면은 기본 평면 투영. 각 원형 part의 +X 시접에서 이음. |
| `fixtures#altar`, `#niche`, `#offering-table` | 석재 `step`, `top`, `support`, `plinth`, `body`, `recess`, `cap`, `trestle` | 기본 평면 투영; 각 독립 석판과 오목한 칸의 단단한 모서리에서 이음. |
| `fixtures#display-shelf`, `#desk`, `#stool`, `#scroll-shelf`, `#chest` | 목재 `top`, `board`, `frame`, `leg`, `stretcher`, `divider`, `side`, `seat`, `body`, `lid` 긴 면 | 각 판은 가장 긴 로컬 모서리를 U로, 정방 다리는 +Y를 U로 전개한다. 길이가 같으면 +X를 먼저 택한다. 금속 `strap`·걸쇠는 기본 투영. 각 독립 판·다리 끝에서 이음. |
| `wares#storage-jar`, `#carry-jar`, `#small-vessel`, `#offering-bowl`, `#basket` | 항아리·그릇·바구니 원형 몸체와 손잡이 | Y축 회전체와 원환 전개; 손잡이 베지어 관은 아래 부착점에서 위 부착점까지 중심선 호길이 U와 관 둘레 호길이 V. 바구니 띠는 각 원형 띠의 호길이 U, 세로 살은 +Y를 U. +X 시접·각 손잡이 부착점에서 이음. |
| `wares#scroll` | `sheet`, `tie` | 말린 종이·끈은 X축 원통/YZ 원환 전개, 펼친 종이는 로컬 +Z 긴 방향을 U, +X를 V로 하는 평면 투영; 종이 끝과 끈 시접에서 이음. |
| `landscape#cypress`, `#broad-tree`, `#grass-tuft` | 줄기·가지·잎·풀 | 줄기와 가지는 각 축의 원통 전개, 잎과 풀의 앞뒷면은 기본 평면 투영; 줄기·가지 +X 시접과 각 잎·풀의 외곽에서 이음. |
| `landscape#neighbor-house` | `roof`, `wall`, `plinth`, `recess` | 지붕 가로 +X를 U, 변형 A는 처마→용마루 경사 방향, 변형 B는 앞 처마→높은 뒤 처마 방향을 V로 둔다. 벽·기단·문창 안쪽은 기본 평면 투영; 지붕 경사·건물 모서리·개구부에서 이음. |

반복 부재(원주·보·서까래·천장 보·기와)는 prototype 하나를 instances가 측정값과 반복 규칙으로 배치한다. 모델 H2는 배치 수와 간격을 정하지 않고 prototype의 점유 상자와 배치 기준점만 준다. 이 상한 아래에서 보이는 것은 형태의 읽힘이며 재료 표현이나 사진 같은 완성도가 아니다.

## 움직이는 부재와 고정 부재 {#articulation-map}

<!--
@evidence principles/core/common.md#scope-preservation 관절이 있는 모델을 두 문짝으로 한정하고 hinge node 이름·축·범위·상태 이름·기본 상태·여는 방향의 출처를 모두 적으며 그 밖의 모든 모델을 강체로 선언한다.
@evidence principles/core/common.md#substantive-completion hinge.<판 ID> 변환 node, 연직 축, 0°~90°, closed/open, 기본 open이 정해져 있어 문짝 H2와 motion이 관절 인터페이스를 새로 만들 필요가 없다.
@evidence principles/core/common.md#declared-basis 기본 상태와 여는 방향은 spaces/openings.md#doors의 열림·스윙 예약에서, 분수와 등잔의 고정 상태는 30-interiors#services에서 받는다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 문과 설비의 표시 상태라는 설정을 motion이 쓸 수 있는 node 하나와 강체 목록이라는 모델 인터페이스 결정으로 바꾼다.
@evidence principles/design/models.md#representation-contract 판 node의 자식으로 손잡이·경첩·판이 함께 도는 계층과 궤 뚜껑·물줄기의 고정 형상을 정해 관절 데이터가 필요한 곳과 필요 없는 곳을 가른다.
@evidence principles/design/models.md#spatial-convention 양개문 X=+0.021·Z=0, 외개문 X=0·Z=+0.031m의 연직 hinge 축과 국소 R_y(−θ), 닫힘 0°에서 열림 90°까지의 각도 기준을 정한다.
@evidence principles/design/models.md#reviewable-structure 문짝은 closed와 open 두 상태를 각각 검토하도록 해 관절 영역이 검토 판에서 드러난다.
@evidence principles/design/models.md#model-observable-style-basis 관절 규칙은 양식 표지를 쓰지 않고 연직 경첩 판문이라는 관찰 결정만 정하며 문 모양의 양식 근거는 각 문짝 H2에 남긴다.
@evidence principles/design/models.md#model-scale-layer-completion 관절 모델과 강체 모델의 경계, 상태 이름, 범위를 함께 정해 motion 층이 형상을 다시 만들지 않고 쓸 인터페이스 층이 완결된다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work openings.md#doors의 기본 열림과 스윙 예약, services의 고정 수위·꺼진 등잔을 관절 범위에 대조했고 90° 열림이 스윙 예약 안에 들어 부모를 고치지 않았다.
@evidence spaces/openings.md#doors 여덟 문의 기본 열림 상태와 스윙 예약을 hinge node의 기본 open 상태와 여는 방향으로 소비한다.
@evidence settings/20-envelope.md#openings 목재 문짝이 여닫히는 개구부라는 정체성을 두 문짝만 관절을 갖는 규칙으로 받는다.
@evidence settings/30-interiors.md#services 고정 수위의 물줄기와 꺼진 등잔을 받아 분수·등잔을 시간 변화 없는 강체로 둔다.
@evidence obligations/design/models.md#articulation-ownership motion이 쓸 수 있는 인터페이스를 hinge.<판 ID> 하나로 한정하고 손잡이·경첩·궤 뚜껑·물줄기를 의도된 강체로 선언한다.
@evidenceExclude settings/50-production.md#execution-authority 작업 권한과 설치·검증 절차는 저작 행위의 규칙이며 관절 인터페이스나 어떤 prototype 형상도 이 권한에서 결정되지 않는다.
-->

관절을 가진 모델은 [문짝](openings.md#double-door-leaf)과 [외개 문짝](openings.md#single-door-leaf)뿐이다. 각 문짝 판은 `hinge.<판 ID>` 이름의 변환 node 하나를 motion과 공개 opening operation이 쓸 수 있는 안정 인터페이스로 가진다. 회전축은 연직이며 양개문은 판 원점에서 X=+0.021m·Z=0, 외개문은 X=0·Z=+0.031m에 있다. 범위는 닫힘 0°부터 열림 90°까지이고 판의 국소 개방 변환은 이 축 주위 `R_y(−θ)`다. instances가 판 전체를 각 방의 스윙 방향으로 향하게 설치하므로 모델은 방별 회전 부호를 새로 고르지 않는다. 상태 이름은 `closed`와 `open`이며 기본 상태는 [개구부 소유](../spaces/openings.md#doors)가 정한 열림이다. 여는 방향은 spaces의 스윙 예약을 따르고 모델은 방향을 새로 정하지 않는다.

그 밖의 모든 모델은 강체다. 궤 뚜껑은 닫힌 고정 부재이고 분수 물줄기는 정지 형상이며 시간에 따른 변화는 systems·motions의 후속 결정이다. 문짝의 손잡이·경첩·판은 판 node의 자식으로 함께 돌고 따로 움직이는 인터페이스가 아니다.

## 중립 모델 검토 판 {#model-review-board}

<!--
@evidence principles/core/common.md#scope-preservation 검토 판의 장면 구성(중립 회색 바닥, +X 0.8m 보행 포락), 조명, 카메라, 네 필수 시점, 문짝 두 상태, 반복 모듈 3×3 표본, 비교 기준을 모두 정한다.
@evidence principles/core/common.md#substantive-completion 시점마다 모델 높이가 화면의 약 70%가 되도록 거리를 정하는 규칙까지 있어 검토 판을 다시 설계하지 않고 모든 prototype을 같은 조건으로 볼 수 있다.
@evidence principles/core/common.md#declared-basis 1600×1000·수직 시야각 50°는 00-delivery#review-condition, 고정 광원 방향은 40-environment#daylight에서 받고 건물 안 배치·접촉은 spaces 관찰로 넘긴다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 건물 관찰 조건을 건물과 분리된 prototype 판의 배경·포락 비교·반복 표본이라는 모델 검토 결정으로 바꾼다.
@evidence principles/design/models.md#representation-contract 재료가 결속되지 않은 part를 같은 중립 클레이로 보이게 해 표면 분할과 부재 분리만으로 형상을 판단하게 한다.
@evidence principles/design/models.md#spatial-convention 각 prototype을 Y=0 바닥에 원점으로 세우고 보행 포락 상자를 +X 0.8m에 두는 배치 규칙을 정한다.
@evidence principles/design/models.md#reviewable-structure 정면(+Z에서 −Z)·우측면·평면·3/4 조감(고도 30°) 네 시점과 문짝 두 상태, 반복 모듈의 한 단위·3×3 배열을 필수 관찰로 둔다.
@evidence principles/design/models.md#model-observable-style-basis 셰이딩·연출이 아닌 구성 판단용 판이라고 선언해 양식 판정을 실루엣·부재 분리·빈 공간에 묶고 조명 연출이 양식 증거로 쓰이지 않게 한다.
@evidence principles/design/models.md#model-scale-layer-completion 포락 비교·시점·상태·반복 표본을 함께 정해 각 모델 H2의 관찰 층이 한 판 위에서 완결된다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work review-condition의 프레임과 daylight의 광원 방향을 건물과 분리된 판에 적용할 수 있었고 두 조건이 prototype 판정에 충분해 부모를 고치지 않았다.
@evidence settings/00-delivery.md#review-condition 기본 비교 프레임 1600×1000과 수직 시야각 50°를 검토 판 카메라로 그대로 쓴다.
@evidence settings/40-environment.md#daylight 정면 좌측 위 고정 햇빛과 하늘 보조광을 검토 판의 광원 하나와 보조광으로 쓴다.
@evidence spaces/observations.md#geometry-observations 건물 안 배치·접촉 판정은 spaces 관찰 전집합이 맡는다고 경계를 긋고 각 모델 H2의 건물 관찰 문장이 그 station을 가리키게 한다.
@evidence obligations/design/models.md#model-review-set 중립 배경·보행 포락 비교·네 시점·두 상태·3×3 표본으로 된 유한 검토 판을 정의한다.
@evidenceExclude settings/00-delivery.md#accessibility 한국어 설명·키보드 조작은 viewer의 접근성 산출물이며 검토 판의 시점·배경이나 prototype 형상이 지는 의무가 아니다.
@evidenceExclude settings/00-delivery.md#governing-aim 다섯 이미지 대조는 건물 관찰 위치에서 판정되며 이 검토 판은 건물과 분리된 구성 판단이라 지배 목표의 대조를 직접 수행하지 않는다.
@evidenceExclude settings/00-delivery.md#operator-access 궤도·확대·시점 선택은 건물 viewer 운영 조작이며 검토 판은 고정된 네 시점과 두 상태만 쓰므로 이 조작을 소비하지 않는다.
@evidenceExclude settings/50-production.md#acceptance 판정 권한과 완료 조건은 제작 절차의 규칙이며 검토 판은 reviewer가 볼 구성 시점만 정하고 판정 권한을 정하지 않는다.
@evidenceExclude settings/50-production.md#author-commits 커밋·푸시 절차는 저작 기록 규칙이며 검토 판을 포함한 어떤 모델 결정의 입력도 아니다.
@evidenceExclude settings/50-production.md#gpu-observation GPU 캡처 경로는 프레임을 관찰로 세는 수단 규칙이며 검토 판의 시점·배경·비교 기준은 그 경로와 무관하게 정해지고 캡처는 modelSources 이후에 온다.
@evidenceExclude spaces/observations.md#viewer-path viewer-path는 건물 source를 그리는 전달 경로이고 검토 판은 건물과 분리된 별도 장면이라 그 경로의 모드·단면을 쓰지 않는다.
-->

모델 검토 판은 건물과 분리된 한 장면이다. 각 prototype을 Y=0의 중립 회색 바닥 위에 하나씩 세우고 오른쪽(+X) 0.8m에 보행 포락 상자(0.6×0.4×1.9m)를 둔다. 조명은 건물 뷰어의 검토용 주광 방향과 같은 고정 광원 하나와 하늘 보조광이며 재료가 결속되지 않은 part는 같은 중립 클레이로 보인다. 카메라는 수직 시야각 50°, 1600×1000 비율이다.

필수 시점은 정면(+Z 쪽에서 −Z를 봄), 우측면(+X 쪽), 평면(위에서), 3/4 조감(+X·+Y·+Z 방향 고도 30°)이며 각 시점은 모델 높이가 화면 높이의 약 70%가 되도록 거리를 정한다. 문짝은 `closed`와 `open` 두 상태를 각각 본다. 기와처럼 반복되는 모듈은 한 단위와 3×3 배열 표본을 함께 본다. 비교 기준은 각 모델 H2가 적은 실루엣 단면, 부재 분리, 빈 공간, 점유 상자와 보행 포락의 비례다. 이 판은 셰이딩이나 연출이 아닌 구성 판단용이며 건물 안 배치나 접촉은 instances와 spaces 관찰이 따로 본다.

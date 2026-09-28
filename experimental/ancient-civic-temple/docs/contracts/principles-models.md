<!--
@evidence discovery/design/models.md#work-specific-model-requirements 한 신전의 모든 원형에 반복 적용되는 축척·UV0 투영은 개별 원형의 형상 결정과 달리 여러 모델 소유자를 가로지르므로 local 원칙으로 보존한다.
-->

# 신전 모델의 반복 적용 원칙

이 계약은 신전의 49개 독립 모델 원형 전체에 축척·UV0를 각 H2별로 적용한다. 관절 경계와 중립 검토 판은 별도 모델 population 의무가 맡는다. 원형별 형상과 치수는 `docs/models`가, 재료 결속과 배치는 후속 분기가 소유한다.

## 축척 기준과 표현 상한 {#temple-reference-scale}

권위: 신전의 검토된 모델 공통 설계와 2026-09-27 사용자 지시다. 아래 기준은 모든 원형 H2와 이를 구현하는 source에 적용된다. 한 원형의 점유·UV0가 이 기준을 벗어나면 그 원형과 재료 결속의 검토가 실패한다.


2026-09-25 사용자 사물 제작 지시가 존재 범위를 넓혔을 때 settings의 35-objects와 30-interiors에 16개 물체의 정체성·방별 자리가 없었다. 두 부모 문서를 먼저 수리했고 각 물체의 구체 치수·접합은 해당 모델 H2가 맡는다.

모든 신전 모델은 오른손 Y-up, 길이 m의 [좌표 규약](../settings/00-delivery.md#coordinates)을 따르고 별도의 앞·위 축을 두지 않는다. 공유 축척 기준은 [이용 조건](../settings/10-building.md#use-profile)의 성인 보행 포락 폭 0.6m·깊이 0.4m·높이 1.9m다. 각 모델의 치수는 해당 settings 범위([물체](../settings/35-objects.md), [외피](../settings/20-envelope.md), [실내](../settings/30-interiors.md))와 판정된 spaces의 순치수(문 유효 폭·높이, 주랑 기둥 예산, 지붕 하부 높이)에서 유도하며 primitive 기본 크기를 치수로 쓰지 않는다. 비교 규칙은 모델의 점유 상자를 그 settings 범위와 보행 포락에 함께 대조하는 것이다. 범위를 벗어나거나 보행 포락보다 큰 집기가 방 통로를 막으면 그 모델 H2가 실패다. [표현 상한](../settings/50-production.md#fidelity)은 입체 부재가 리뷰 거리에서 읽힐 것을 요구하고, [표면 언어](../settings/20-envelope.md#material-language)는 재료 수치의 소유를 materials에 둔다. [제작 분담](../settings/00-delivery.md#build-scope)에 따라 모델은 prototype, instances는 배치와 복제를 맡는다.

표현 상한은 결정론적 blocking geometry다. 허용하는 시각 주장은 리뷰 거리(눈높이 1.6m, 대상까지 약 2~25m)의 실루엣, 부재 분리(기단·몸통·주두, 문틀·문짝의 선대·가로대·판, 테두리·몸통·목), 실제 빈 공간(문 개구, 수반 안쪽, 선반 칸, 궤 뚜껑의 틈), 실제 두께다. 조각 장식, 세로 홈, 공구 자국, 기하로 새긴 나뭇결과 기와 한 장씩의 불규칙, 기하로 새긴 풍화, 끈과 짜임의 미세 형상, 특정 고대 양식의 정확한 비례는 주장하지 않는다. 곡면은 각 H2가 정한 분할 수의 다면체이며 부드러운 법선은 그 H2가 요구한 곳에만 쓴다. 재료의 색·거칠기·결과 무늬는 materials가 정한다. 모델은 안정된 표면 ID와 다음 UV0 물리 좌표를 모두 낸다.

하나의 prototype 안에서 이산 부재를 반복하면 해당 H2가 개수·간격·첫 부재의 위치 또는 각 위상·기준 부재의 어느 면에 붙는지까지 정한다. 원형 반복은 첫 부재의 중심각과 진행 방향을 적고, 다각형 면에 붙는 부재의 돌출은 꼭짓점 외접원이 아니라 그 면의 바깥 법선에서 잰다. 일렬 반복은 첫 중심 또는 첫 모서리와 진행 축을 적는다. 이 규칙은 instances가 정하는 건물 내 prototype 배치 횟수를 대신 정하지 않는다. 각 H2의 로컬 원점은 그 prototype의 배치 기준점이며 실제 위치·방향·수량은 instances가 정한다.

모든 방출 part는 position마다 유한한 UV0 한 쌍을 가진다. 로컬 원점에서 1 UV 단위는 1m다. 기본 평면 투영은 각 삼각형의 주법선 축으로 정한다. 법선 +X에는 (U,V)=(−Z,Y), −X에는 (Z,Y), +Y에는 (X,−Z), −Y에는 (X,Z), +Z에는 (X,Y), −Z에는 (−X,Y)를 쓴다. 각 경우 U×V는 해당 바깥법선을 향하므로 양면의 무늬가 거울상으로 뒤집히지 않는다. 면이 바뀌는 단단한 모서리와 서로 다른 part·표면 ID에서는 정점을 복제해 이음을 끊는다. 삼각형 하나 안에서 투영 축을 바꾸지 않는다. 잘린 끝면은 새 면 법선으로 다시 투영하고, 같은 면 안의 반복 부재는 각 prototype의 로컬 원점을 유지하므로 배치가 UV 원점을 새로 고르지 않는다. materials는 이 미터 좌표에서 반복 빈도·색·거칠기·텍스처 이미지를 결정한다. UV0가 없는 part에 texture를 결속하려 하면 source/viewer 검증이 실패해야 하며 단색으로 조용히 건너뛰지 않는다.

Y축 회전체의 옆면은 평면 투영 대신 +X 반직선에서 시작해 −Z 쪽으로 도는 각도 θ=atan2(−Z,X)를 [0,2π]로 펼치고 U=각 단면 고리의 실제 반지름×θ를 쓴다. V는 로컬 밑고리에서 시작해 단면을 이루는 연속 직선 구간마다 `√((ΔY)²+(Δ반지름)²)`를 누적한 모선 길이이며 원통에서는 Y와 같다. θ=0 이음의 정점을 복제한다. 원판 윗·아랫면은 기본 ±Y 투영이다. YZ 평면 원환의 큰 원 각도 0은 +Z에서 +Y로, XY 평면은 +X에서 +Y로, XZ 평면은 +X에서 −Z로 돈다. 큰 원 중심선의 호길이를 U, 작은 관 단면 호길이를 V로 하며 작은 관의 각도 0은 큰 원의 바깥 반경 방향으로 둔다. 두 닫힘 각도 0에서 이음을 복제한다. X축 원통의 θ=0은 +Z에서 +Y로, +X 축 방향 길이를 V로 둔다. Z축 연결 핀은 +Z 축을 기준으로 θ=0을 +X에서 +Y로 두고 U를 둘레 호길이, V를 +Z 방향 길이로 펼친다. −Z를 향하는 핀은 같은 +X 시접에서 −Y 쪽으로 돌아 U를 전개하고 V는 −Z 방향 길이로 둔다. 사선 나뭇가지 원통은 가지 시작점에서 축 방향 단위벡터에 +X를 직교 투영해 θ=0을 정하고, +X가 축과 평행하면 +Y, 그것도 평행하면 +Z를 같은 순서로 투영한다. 가지의 길이 방향을 V로 두고 시작점의 시접을 끝까지 평행 이동한다. 모든 열린 관(베지어 관과 물동이 반타원 관을 포함한다)은 각 H2가 정한 첫 부착점에서 마지막 부착점까지 중심선 호길이를 U로, 관 단면 호길이를 V로 둔다. 시작 접선에 가장 덜 평행한 로컬 축을 X·Y·Z 순서로 고르고 접선에 직교 투영해 관 각도 0을 정한 뒤 구간마다 그 법선을 평행 이동해 시접을 잇는다. 첫 끝 링은 첫 분할 현에, 마지막 끝 링은 마지막 분할 현에 각각 수직이며 중간 링은 이웃 현의 정확한 mitre로 잇는다. 길이 방향 결을 읽는 목재 각재는 해당 H2가 지정한 부재 장축을 U, 그에 직교하는 면 내 축을 V로 둔다. 비정형 면은 위 기본 평면 규칙을 따른다. normal·UV·part 범위는 modelSources의 concrete exported class가 함께 방출하며, class는 여기서 없는 투영법을 새로 고르지 않는다.

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
| `fixtures#altar`, `#niche`, `#offering-table` | 석재 `step`, `top`, `support`, `plinth`, `body`, `recess-frame`, `recess`, `cap`, `trestle` | 기본 평면 투영; 각 독립 석판과 오목한 칸의 단단한 모서리에서 이음. |
| `fixtures#display-shelf`, `#desk`, `#stool`, `#scroll-shelf`, `#chest` | 목재 `top`, `board`, `frame`, `leg`, `stretcher`, `divider`, `side`, `seat`, `body`, `lid` 긴 면 | 각 판은 가장 긴 로컬 모서리를 U로, 정방 다리는 +Y를 U로 전개한다. 길이가 같으면 +X를 먼저 택한다. 금속 `strap`·걸쇠는 기본 투영. 각 독립 판·다리 끝에서 이음. |
| `wares#storage-jar`, `#carry-jar`, `#small-vessel`, `#offering-bowl`, `#basket` | 항아리·그릇·바구니 원형 몸체와 손잡이 | Y축 회전체와 원환 전개; 손잡이 베지어 관은 아래 부착점에서 위 부착점까지 중심선 호길이 U와 관 둘레 호길이 V. 바구니 띠는 각 원형 띠의 호길이 U, 세로 살은 +Y를 U. +X 시접·각 손잡이 부착점에서 이음. |
| `wares#scroll` | `sheet`, `sheet-1`, `sheet-2`, `sheet-3`, `tie` | 말린 종이·끈은 X축 원통/YZ 원환 전개, 펼친 종이는 로컬 +Z 긴 방향을 U, +X를 V로 하는 평면 투영; 종이 끝과 끈 시접에서 이음. |
| `landscape#cypress`, `#broad-tree`, `#grass-tuft` | 줄기·가지·잎·풀 | 줄기와 가지는 각 축의 원통 전개, 잎과 풀의 앞뒷면은 기본 평면 투영; 줄기·가지 +X 시접과 각 잎·풀의 외곽에서 이음. |
| `landscape#neighbor-house` | `roof`, `wall`, `plinth`, `recess` | 지붕 윗면의 U는 변형 A의 로컬 +Z 앞 경사에서 +X, −Z 뒤 경사에서 −X, 변형 B의 외쪽 경사에서 +X다. 각 경사의 V는 처마에서 높은 쪽으로 실제 경사 길이만큼 증가한다. 이 배향은 U×V가 바깥 법선을 향하게 한다. 벽·기단·문창 안쪽은 기본 평면 투영; 지붕 경사·건물 모서리·개구부에서 이음. |
| `portable#bench`, `#votive-plaque`, `#offering-tray`, `#writing-tablet`, `ritual#floor-cushion` | 모든 평판·각재 part | 각 독립 평면에 기본 투영을 쓰고 판의 모서리와 part 경계에서 이음. |
| `portable#portable-lamp`, `#bucket`, `#planter`, `#stylus`, `ritual#censer`, `#jar-stand` | 회전체 옆면·원판·관 | 회전체는 +X 시접에서 호길이 U, 모선 길이 V; 원판·평평한 흙·재 면은 기본 평면 투영. 물동이 손잡이 관은 t=0의 +X 끝에서 t=π의 −X 끝까지 중심선 호길이 U와 관 단면 호길이 V. |
| `portable#jar-rack` | `top`, `leg`, `well` | 상판·다리는 부재 장축 U; 둥근 홈의 벽은 회전체 호길이 U, 바닥은 기본 평면 투영. `top`은 홈 구멍의 벽만, `well`은 홈 바닥만 소유한다. |
| `portable#carrying-yoke` | `beam`, `hook` | 막대 장축 +X를 U, 고리 YZ 원환은 중심선·관 둘레 호길이로 전개한다. |
| `portable#handcart` | `deck`, `handle`, `support`, `axle`, `wheel` | 판·손잡이·지지재는 각각 장축 U, 축·바퀴는 X축 원통의 둘레 U와 축 길이 V로 전개한다. |
| `portable#textile` | `cloth` | 두 겹의 윗면·아랫면과 접힌 띠의 평면을 각각 기본 투영하며 접힌 모서리에서 정점을 복제한다. |
| `portable#rope-coil` | `rope`, `tie` | 고리는 XZ 원환의 중심선·관 둘레 호길이, 직사각 묶음 띠는 기본 평면 투영을 쓴다. |

모델은 각 part의 안정된 표면 ID와 UV0 투영·이음만 소유한다. 재료 결속 키·반복 길이·fallback과 part별 배정은 [재료 결속](../materials/10-model-bindings.md#binding-map)이 소유한다.


Review question: 이 원형의 실제 점유와 UV0 투영·이음이 위 수치 및 표의 해당 행과 일치하고, 보행 포락과 판정된 공간 순치수에 맞는가?

Sources: 검토된 기존 `docs/models/scale.md#reference-scale`의 설계 결정과 사용자 2026-09-27 지시.

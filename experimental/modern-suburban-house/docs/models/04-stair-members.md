# 계단 난간살과 아래 부재

## 난간살의 단면과 반복 {#stair-balusters}
<!--
@evidence principles/core/common.md#scope-preservation 계단 난간살의 0.02 m 정사각 단면, 0.075 m 예약 가운데 배치, 개수와 간격 산출을 이 H2가 맡고 기둥·손잡이는 spaces source에 남긴다.
@evidence principles/core/common.md#substantive-completion 아래 flight·참은 양끝 기둥 안쪽, 상부 flight는 참 기둥 안쪽에서 손잡이 자유단 X=1.87 m까지를 L로 잡는다. n=ceil((L−0.10)/0.12)와 간격 (L−0.02n)/(n+1)로 빈 간격 0.10 m 이하를 산출하고 아래끝을 디딤·참 또는 복도 bottom-rail 윗면에 맞댄다.
@evidence principles/core/common.md#declared-basis 간격 상한과 역할은 spaces/02-stair.md#stair-boundary-heights, 점유 예약은 #stair-clearance, 철제 수직살은 settings/10-house.md#stair에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 02-stair의 난간살 간격 상한과 후속 반복 산출 인계를 아래 flight·참·복도 개수식과 위 flight의 디딤별 네 살 배치로 구체화한다.
@evidence principles/design/models.md#representation-contract rigid 난간살 원형과 위아래 끝의 접속을 정한다.
@evidence principles/design/models.md#spatial-convention 원점을 난간살 아래 끝 중심으로 적는다.
@evidence principles/design/models.md#reviewable-structure 02가 적은 flight·중간참·상부 도착 view에서 간격을 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 레퍼런스 03·04의 계단에서 일정 간격으로 이어지는 검은 난간살을 채택한다. 검은 철제 수직살을 0.02 m 정사각 단면으로 구체화한다.
@evidence principles/design/models.md#model-scale-layer-completion 예약 폭 안의 점유 척도를 정한다.
@evidence spaces/02-stair.md#stair-boundary-heights 난간살 빈 간격 0.10 m 이하를 개수·간격 공식으로 소비한다.
@evidence spaces/02-stair.md#stair-clearance 양쪽 0.075 m 점유 예약 가운데 선에 0.02 m 난간살을 둔다.
@evidence settings/10-house.md#stair 검은 수직 철제 난간살을 0.02 m 정사각 단면으로 소비한다.
@evidence contracts/reservation-fit.md#reservation-fit 난간살 점유 0.02 m가 0.075 m 예약 안이고 간격이 0.10 m 이하임을 산술로 보인다.
@evidence obligations/design/models.md#articulation-ownership 난간살을 관절 없는 rigid 부재로 정한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 816cd4b3에서 바뀐 02-stair의 위 손잡이 코 높이와 벽 시작 Y=2.75 m를 다시 읽어 위 flight 난간살의 윗끝을 제한했다. 이 모델 수정은 부모의 손잡이·벽 경계를 바꾸지 않는다.
-->

레퍼런스 03·04의 계단에서 일정 간격으로 이어지는 검은 난간살을 채택한다. 개수는 사진을 세지 않고 각 flight 길이로 산출한다.

[계단 경계 높이 owner](../spaces/02-stair.md#stair-boundary-heights)가 모델에 남긴 것은 기둥·손잡이 사이를 채우는 검은 수직 철제 난간살의 부재와 반복이다. 기둥과 손잡이는 spaces source가 [양쪽 0.075 m 예약](../spaces/02-stair.md#stair-clearance) 안에 이미 만들므로 이 모델은 다시 만들지 않는다. 난간살은 [단일 꺾임계단 설정](../settings/10-house.md#stair)의 가는 철제 수직살을 위해 한 변 0.02 m의 정사각 단면으로 택하며, 0.075 m 예약의 가운데 선에 두어 통행 쪽 점유가 예약선을 넘지 않는다. 아래 flight와 참 및 상층 복도의 평탄한 구간에서는 양끝 기둥의 안쪽 면 사이를 L로 잡고 개수 n=ceil((L−0.10)/0.12), 빈 간격 (L−0.02n)/(n+1)≤0.10 m를 쓴다. 위 flight에는 도착 기둥을 가정하지 않고 각 디딤 폭 0.28 m마다 살 네 개를 따로 둔다. 이 구간의 [위 손잡이](../../src/spaces/stair-guards.ts)는 첫 코 X=−0.65 m의 상단 Y=2.43 m에서 도착 코 X=1.87 m의 상단 Y=3.96 m까지 이어지며, 살은 손잡이 아래면과 벽 시작 높이 Y=2.75 m 중 낮은 면에서 멈춘다. 아홉째 디딤의 상면 Y=2.89 m는 이미 벽 시작 위이므로 그 디딤에는 살을 두지 않는다.

국소 원점은 난간살 아래 끝 중심, 국소 +Y는 world +Y이며 모든 난간살은 rigid이고 관절 인터페이스가 없다. 아래 flight와 참은 위 끝을 손잡이 아래면에, 아래 끝을 해당 디딤판·참의 보이는 윗면에 맞댄다. 위 flight는 위 끝을 손잡이 아래면과 Y=2.75 m 중 낮은 곳에, 아래 끝을 각 디딤의 상면에 맞댄다. 상층 복도는 [아래 부재](#stair-bottom-member)의 윗면에서 손잡이 아래면까지 세운다. 소스 owner는 `src/models/stair-baluster.ts`이며 검사 주소는 02가 적은 현관에서 보이는 아래 flight, 중간참 두 방향, 각 디딤 코와 상부 도착의 벽 높이 단면, 복도 가장자리다.

평탄한 구간의 각 `baluster` 중심은 기둥 안쪽에서 잰 길이축 s에서 i=0…n−1마다 s=gap+0.01+i×(0.02+gap) m이고, gap=(L−0.02n)/(n+1) m다. 위 flight의 디딤 j=1…8은 [구조 디딤](../../src/spaces/stair.ts)의 X 시작 a_j=−0.65+0.28(j−1) m, 상면 h_j=1.36+0.17j m를 받는다. 그 디딤의 네 `baluster` 중심은 k=0…3에 대해 X=a_j+0.05+0.06k m이고, 단면 X=[중심−0.01,중심+0.01]·Z=[−3.4575,−3.4375] m다. 디딤 안쪽 끝 간격은 각각 0.04 m, 인접 디딤 사이의 빈 간격은 0.08 m라 0.10 m 상한 안이다. 첫 j의 왼쪽 끝도 참 기둥 X=−0.65 m에서 0.04 m 떨어지고, 어떤 0.02 m 단면도 a_j 또는 다음 챌판 선 a_j+0.28 m를 가로지르지 않는다. 아래 Y=h_j, 위 Y=min(2.75, 2.43+(X+0.65)×1.53/2.52−0.075) m다. j=8에서 h_j=2.72<2.75 m이고 j=9에서는 h_j=2.89>2.75 m라 양의 높이가 있는 살을 j=8까지만 만든다. 네 옆면과 양 절단 끝은 각 정사각 기둥 한 부재의 면이고 spaces 디딤·기둥·손잡이·Y≥2.75 m 벽의 닫힌 체적에는 들어가지 않는다.

## 디딤과 복도 가장자리의 아래 부재 {#stair-bottom-member}
<!--
@evidence principles/core/common.md#scope-preservation flight·중간참에서 아래 가로대를 두지 않고 복도 가장자리에만 bottom-rail을 두는 결정을 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 상층 복도 두 기둥 안쪽 X=[−1.725,1.795] m, 경계 중심 Z=−4.635 m에서 bottom-rail Y=[3.11,3.15] m·폭 0.04 m를 정하고 경사 가로대가 삼각형 틈을 만드는 이유를 적는다.
@evidence principles/core/common.md#declared-basis 아래 빈 높이 0.10 m 상한은 spaces/02-stair.md#stair-boundary-heights에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 02-stair의 디딤 아래 빈 높이 한도를 경사 구간의 디딤 직접 지지와 평탄 복도의 Y=[3.11,3.15] m `bottom-rail`로 구체화한다.
@evidence principles/design/models.md#representation-contract bottom-rail과 난간살의 연결을 정한다.
@evidence principles/design/models.md#spatial-convention bottom-rail 높이를 upper-storey 바닥 기준으로 적는다.
@evidence principles/design/models.md#reviewable-structure 디딤별 측면 단면과 복도 가장자리 단면에서 빈 높이를 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 레퍼런스 04의 계단 아래 흰 띠와 검은 난간살 접합을 채택한다. 검은 철제 아래 부재를 정한다.
@evidence principles/design/models.md#model-scale-layer-completion 아래 부재 층의 유무를 구간별로 정한다.
@evidence spaces/02-stair.md#stair-boundary-heights 아래 빈 높이 0.10 m 이하를 디딤 직접 고정과 bottom-rail 0.05 m로 소비한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 02를 적힌 그대로 소비했고 부모 수정이 없었다.
-->

레퍼런스 04의 계단 아래 흰 띠와 검은 난간살 접합을 채택한다. 디딤판과 기둥은 reviewed spaces의 부재다.

경사진 flight와 중간참에서는 별도 아래 가로대를 두지 않고 난간살을 각 디딤과 참 위에 직접 세운다. 경사 가로대는 디딤 뒤쪽에서 챌판 높이만큼 삼각형 틈을 만들어 [owner의 아래 빈 높이 0.10 m 이하](../spaces/02-stair.md#stair-boundary-heights)를 어길 수 있기 때문이다. 상층 복도의 평탄한 추락 경계에서는 [두 기둥과 상부 손잡이](../../src/spaces/stair-guards.ts)의 중심선 Z=(−4.71−4.56)/2=−4.635 m를 받는다. 기둥은 X=[−1.80,−1.725]·[1.795,1.87] m이므로 검은 `bottom-rail` 한 부재는 양쪽 기둥 안쪽 면 사이 X=[−1.725,1.795], Z=[−4.655,−4.615], Y=[3.11,3.15] m로 닫는다. 이는 upper-storey 바닥 Y=3.06 m에서 아랫면을 0.05 m 띄운 높이·폭 0.04 m 판이며 양 끝은 기둥에 면으로 맞댄다. 그 위에 세운 복도 난간살은 Y=3.15 m에서 시작해 위 손잡이 아래면 Y=4.035 m에서 끝난다. 이 구간 L=3.52 m에 [공통 개수식](#stair-balusters)을 적용하면 n=29, 빈 간격 (3.52−29×0.02)/30=0.098 m로 0.10 m 상한을 지킨다. 소스 owner는 `src/models/stair-baluster.ts`이며 디딤별 측면 단면과 복도 가장자리 단면으로 검사한다.

## 열린 계단 옆 경사 측판 {#stair-side-skirt}
<!--
@evidence principles/core/common.md#scope-preservation 레퍼런스 03·05의 흰 경사 측판을 아래·위 flight 열린 바깥 옆면의 두 경사 판과 참 모서리 연결판으로 소유한다. 디딤 몸체·난간·벽 걸레받이는 만들지 않는다.
@evidence principles/core/common.md#substantive-completion 두 flight의 외측 0.015 m 두께, 디딤선 위 0.10 m 높이, 0.28 m run과 0.17 m rise에서 산출한 사다리꼴 네 점, 0.015 m 참 모서리 연결판을 정한다.
@evidence principles/core/common.md#declared-basis 두 flight의 0.17 m rise·0.28 m run·방향과 외측 구조 면은 spaces/02-stair.md#stair-reservation에서 받고 난간 점유와 상층 벽 시작 높이는 같은 문서의 #stair-clearance·#stair-boundary-heights에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 닫힌 계단 구조 옆면과 열린 가장자리 난간 사이에 독립 흰 경사 마감판 원형을 더하고 끝 접속을 정한다.
@evidence principles/design/models.md#representation-contract 세 닫힌 강체 부재의 앞·뒤·윗면·아랫면·끝면을 한 `stair-skirt` id로 소유하고 spaces tread의 옆면을 복제하지 않는다.
@evidence principles/design/models.md#spatial-convention flight의 실제 바깥 옆면을 국소 깊이 0으로 받아 두께 0.015 m를 열린 방 쪽으로 두고, 아래 판은 참 연결판 앞면까지, 위 판은 1층 천장선 Y=2.75 m까지 산출해 그 위 상층 경계는 spaces에 남긴다.
@evidence principles/design/models.md#reviewable-structure 현관에서 본 아래 flight, 참 안쪽 모서리, 위 판의 천장선 종단과 측면 직교 단면에서 디딤·난간·걸레받이 및 상층 경계와의 부피 교차와 흰 띠의 끊김을 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 레퍼런스 03·05의 디딤 아래 흰 경사 띠를 실내 trim과 같은 닫힌 판으로 채택하고 사진 비례는 치수 근거로 쓰지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 경사식·두께·모서리 연결·종단·face id·미터 UV·후속 source owner를 정하며 새 계단이나 방 경계는 만들지 않는다.
@evidence spaces/02-stair.md#stair-reservation 0.17 m rise와 0.28 m run, 아래 7단·참·위 9단의 단일 L형 계단을 두 경사 판의 길이와 기울기 입력으로 받는다.
@evidence spaces/02-stair.md#stair-clearance 난간이 계단 통행 안쪽 0.075 m 예약을 쓰는 반면 측판은 구조 옆면에서 방 쪽 0.015 m를 써 계단 통행 예약과 교차하지 않도록 분리한다.
@evidence contracts/reservation-fit.md#reservation-fit 0.015 m 외측 판과 기존 난간의 0.075 m 내측 예약이 계단 옆면을 경계로 접할 뿐 겹치지 않으며, 방 쪽 실제 통행은 후속 compiled 관찰에서 다시 잰다.
@evidence obligations/design/models.md#addressable-model-decisions 난간살·복도 아래 가로대와 다른 흰 경사 측판을 한 주소로 둔다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 기존 02의 디딤 외측 구조 면과 난간 예약은 움직이지 않고 그 바깥에 0.015 m 마감판을 추가하므로 부모의 구조·경로 수치를 수정하지 않았다. 방 쪽 실제 순폭은 source 생성 전 unverified다.
-->

레퍼런스 03·05의 흰 경사 측판은 계단 디딤의 구조 옆면을 도색한 듯이 숨기지 않고 그 바깥에 붙는 별도 닫힌 판으로 채택한다. 구조 디딤과 참은 [계단 평면](../spaces/02-stair.md#stair-reservation)의 spaces owner, 검은 난간은 이 문서의 앞 두 원형과 spaces 손잡이, 흰 측판은 이 H2의 `src/models/stair-skirt.ts` 한 owner다. 방 벽의 [수평 걸레받이](06-interior-trim.md#wall-baseboard)는 첫 챌판 앞에서 끝나며 경사 판을 대신하지 않는다.

아래 flight는 `src/spaces/stair.ts`의 열린 옆면 X=−0.65 m에서 현관 쪽 +X로 두께 0.015 m만 차지한다. 길이축은 시작 Z=−1.45 m에서 참 연결판의 앞면 Z=−3.395 m까지 −Z이고, 아래 모서리는 `Y=0.17×(−1.45−Z)/0.28` m, 위 모서리는 그 값+0.10 m다. 네 끝점의 (Z,Y)는 `(−1.45,0)`, `(−1.45,0.10)`, `(−3.395,1.280892857)`, `(−3.395,1.180892857)` m다. 상부 flight는 열린 앞 옆면 Z=[−3.41,−3.395] m에서 현관 쪽으로 X=−0.635 m부터 시작한다. 아래 모서리는 `Y=1.36+0.17×(X+0.65)/0.28` m, 위 모서리는 그 값+0.10 m다. 시작 높이는 [1.369107143,1.469107143] m이고, 1층 천장선에서 위끝이 Y=2.75 m에 닿는 `Xc=−0.65+(2.75−1.46)×0.28/0.17=1.474705882` m에서 판을 수직 절단한다. 절단 끝의 높이는 [2.65,2.75] m다. X>Xc의 상층 구조 옆면과 Y≥2.75 m의 `stair-opening-edge-front`는 reviewed spaces 부재로 남고 이 원형의 측판은 그 체적에 들어가지 않는다. 마지막 챌판과 상층 바닥 Y=3.06 m는 기존 spaces 부재이며 측판을 그 바닥까지 늘리지 않는다. 두 경사 판은 계단 안쪽 0.075 m 난간 예약에도 들어가지 않는다. 검사는 현관에서 본 아래 flight, 참 안쪽 모서리, 위 판의 Y=2.75 m 종단, 측면 직교 단면을 같은 위치에서 대조해 디딤·난간·걸레받이와의 교차와 흰 띠의 끊김을 확인한다.

두 판 사이 참의 바깥 0.015×0.015 m 정사각 모서리 X=[−0.65,−0.635], Z=[−3.41,−3.395] m는 같은 원형의 세 번째 닫힌 연결판이다. 그 아래끝 Y=1.180892857 m는 아래 판의 Z=−3.395 끝면 아래 모서리이고 위끝 Y=1.469107143 m는 위 판의 X=−0.635 시작면 윗모서리다. 아래 판은 연결판의 Z=−3.395 면에서 Y=[1.180892857,1.280892857] m에, 위 판은 연결판의 X=−0.635 면에서 Y=[1.369107143,1.469107143] m에 닿는다. 두 판의 점유는 연결판 내부에 들어오지 않으며 중간 높이의 연결판은 구조 참 옆면을 가린다. 첫 챌판 앞과 X=Xc의 천장 접선에서는 수직 끝면으로 닫고, 그 위쪽 [계단 도착 막음](../spaces/02-stair.md#stair-boundary-heights)은 spaces가 소유한다. 세 판의 앞·뒤·윗면·아랫면·끝면은 모두 `stair-skirt` face id를 받고, 흰 도장은 [실내 trim](../materials/02-interior-shell.md#interior-trim-white)이 맡는다. UV는 각 경사 판의 첫 아래 모서리에서 실제 경사 길이 U·판 높이 V를 1 UV/m로 투영하고 두께 면과 끝면은 새로 시작한다. 참 연결판은 각 면의 왼쪽 아래에서 별도 투영해 세 부재의 접선에서 이음을 끊는다. 실제 메시·GPU 읽힘은 modelSources 이전이라 unverified다.

세 경사·연결 판에서 `stair-skirt`의 두께는 각각 열린 쪽 X=[−0.65,−0.635] m 또는 Z=[−3.41,−3.395] m의 0.015 m이고, 앞·뒤·윗면·아랫면·수직 끝면은 앞 문단의 높이 식과 Xc=1.474705882 m에서 닫는다. 이 id를 받는 닫힌 판은 계단 구조 옆면에 면으로만 닿고 구조의 두께 속에는 들어가지 않는다.

## 난간 부재의 표면 파티션 {#stair-member-surfaces}
<!--
@evidence principles/core/common.md#scope-preservation 난간 부재의 표면 id baluster·bottom-rail, 평면 법선과 길이 방향 미터 UV를 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 기둥·손잡이 표면은 spaces source가 소유한다고 적어 중복을 막는다.
@evidence principles/core/common.md#declared-basis id 규칙은 00-model-frame.md#model-surface-partition-naming, 색 조건은 settings/10-house.md#stair에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 검은 철제 부재를 분체결이 따라갈 길이 방향 UV와 두 표면 id로 구체화한다.
@evidence principles/design/models.md#representation-contract 난간 부재의 안정 표면을 정한다.
@evidence principles/design/models.md#spatial-convention baluster의 UV는 난간살 아래끝 중심, bottom-rail의 UV는 부재 왼쪽 끝 모서리에서 시작하며 두 부재의 축·척도를 본문에서 구분한다.
@evidence principles/design/models.md#reviewable-structure 바인딩 뷰에서 기둥과 난간살 경계로 반증한다.
@evidence principles/design/models.md#model-observable-style-basis 레퍼런스 03·04의 검은 난간살과 흰 계단 바탕이 구분되므로 난간 부재 면만 models로 넘긴다. 검은 철제 색은 materials에 둔다.
@evidence principles/design/models.md#model-scale-layer-completion baluster와 bottom-rail 두 표면 인터페이스를 정하고 기둥·손잡이 표면은 spaces에 남긴다.
@evidence settings/10-house.md#stair 검은 철제 난간살의 색 결합 면을 baluster·bottom-rail로 한정하고 계단 기둥·손잡이 면은 spaces owner에 남긴다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work settings stair를 그대로 소비했고 부모 수정이 없었다.
-->

레퍼런스 03·04의 검은 난간살과 흰 계단 바탕이 구분되므로 난간 부재 면만 models로 넘긴다.

[이름 규칙](00-model-frame.md#model-surface-partition-naming)에 따라 표면 id는 `baluster`와 `bottom-rail`이다. 둘 다 [단일 꺾임계단 설정](../settings/10-house.md#stair)의 검은 철제 부재로 면마다 평면 법선을 쓰고, [검은 도장 금속의 분체결](../materials/02-interior-shell.md#black-coated-metal)이 붙도록 `baluster`는 아래 끝 중심을 원점으로 높이 U와 정사각 둘레 V를, `bottom-rail`은 왼쪽 끝 모서리를 원점으로 길이 U와 단면 둘레 V를 미터 단위로 둔다. 기둥과 손잡이의 표면은 spaces source가 소유한다. 소스 owner는 `src/models/stair-baluster.ts`다.

재료 결속 뷰에서는 현관 아래 flight와 상층 복도에서 검은 `baluster`·`bottom-rail`이 흰 spaces 기둥 및 목재 손잡이와 다른 면으로 끝나는지 본다. 실제 모델 메시·재료 결속은 unverified다.

## 난간 부재의 표현 한계 {#stair-member-fidelity}
<!--
@evidence principles/core/common.md#scope-preservation 용접부·볼트·받침판을 만들지 않는 난간 부재의 한계를 이 H2가 맡는다.
@evidence principles/core/common.md#substantive-completion 난간살 반복이 보호 성능이나 법규 적합을 증명하지 않는다고 적는다.
@evidence principles/core/common.md#declared-basis 용접부·볼트·받침판 생략의 상한은 00-model-frame.md#model-representation-ceiling에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 공통 상한을 난간 부재의 생략 목록으로 바꾼다.
@evidence principles/design/models.md#representation-contract 난간살 반복이 보호 성능·법규 적합을 증명하지 않는다는 proxy 한계를 정한다.
@evidence principles/design/models.md#spatial-convention 난간살 0.02 m 단면과 bottom-rail 0.05 m 높이는 앞 H2에 두고 이 한계 H2는 좌표를 정하지 않는다.
@evidence principles/design/models.md#reviewable-structure 모델 리뷰 뷰의 측면 단면에서 난간살 끝의 받침판이 생기면 반증된다.
@evidence principles/design/models.md#model-observable-style-basis 레퍼런스 04에서 읽히는 살대와 아래 띠는 채택하지만 나사·고정구는 사진에서도 보이지 않아 표현 범위에서 제외한다. 용접부·볼트가 보이지 않는다는 관찰 가능한 난간 한계를 적는다.
@evidence principles/design/models.md#model-scale-layer-completion 난간 부재의 용접부·볼트·받침판을 만들지 않는 층으로 명시한다.
@evidence obligations/design/models.md#representation-ceiling 난간 부재의 보호 성능·법규 비증명을 적는다.
@evidence spaces/02-stair.md#stair-boundary-heights 간격과 아래 빈 높이의 형상 조건만 난간 부재로 소비하고 보호 성능·법규 적합 인증으로 확대하지 않는다.
@evidence settings/20-verification.md#fidelity 계단 난간살과 아래 띠는 캡처에서 읽히는 부재로 유지하되 볼트·용접부를 사실적 기능 증명으로 확대하지 않는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work settings fidelity와 02-stair의 법규 비주장을 난간 부재 생략과 대조했고 부모 수정이 필요하지 않았다.
-->

레퍼런스 04에서 읽히는 살대와 아래 띠는 채택하지만 나사·고정구는 사진에서도 보이지 않아 표현 범위에서 제외한다.

[표현 상한](00-model-frame.md#model-representation-ceiling) 안에서 용접부·고정 볼트·받침판은 만들지 않는다. 난간살 반복이 보호 성능이나 법규 적합을 증명하지 않는다. 검사 주소는 [모델 리뷰 뷰 목록](00-model-frame.md#model-review-set)이며 실제 렌더는 unverified다.

# 개구부 부재

## 석재 문틀 {#door-frame}

<!--
@evidence principles/core/common.md#scope-preservation 여덟 문의 벽 두께 안 안감 세 조각과 양면 테를 치수·변형·접촉·통과 영역까지 정하고 문턱 바닥은 방 소유로 남긴다.
@evidence principles/core/common.md#substantive-completion 문설주 0.06m·상인방·벽 두께 깊이의 안감, 폭 0.16m·돌출 0.03m 테, 변형을 (유효 폭, 유효 높이, 벽 두께) 조합에서 만드는 규칙이 있어 source가 문틀을 다시 고르지 않는다.
@evidence principles/core/common.md#declared-basis 유효 치수·틀 0.06m는 openings.md#doors와 #boundary-ownership, 벽 두께 0.30/0.60m는 판정된 경계, 돌 테의 존재는 20-envelope#walls의 석재 문 주변에서 온다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 깊은 문설주와 문 주변 틀이라는 설정을 void를 채우는 안감과 벽면 위 테라는 두 표면 모델로 바꾼다.
@evidence principles/design/models.md#representation-contract lining·surround part와 두 표면, 안감 바깥면·테 뒷면의 가려진 접촉면, 유효 통과 영역의 negative space를 정한다.
@evidence principles/design/models.md#spatial-convention 원점을 void 바닥 가장자리 선의 중심(문턱 완성면 Y=0, 벽 중심면)에 두고 X 벽 길이·Z 벽 두께·+Y 위로 정한다.
@evidence principles/design/models.md#reviewable-structure 1.0×2.2×0.3m 변형의 세 시점과 건물의 각 문 양면에서 틀이 void를 정확히 채우고 유효 폭을 줄이지 않는지를 본다.
@evidence principles/design/models.md#model-observable-style-basis 이미지 03·04의 넓은 돌 테와 이미지 05의 깊은 reveal을 근거로 하고 평면 테만 있는 문을 실패로 둔다.
@evidence principles/design/models.md#model-scale-layer-completion 문 표의 여덟 조합과 벽 두께가 변형을 모두 정하고 점유 상자 식이 있어 개구부 층이 완결된다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work openings.md#doors의 여덟 유효 치수, #boundary-ownership의 0.06m 틀과 void, storey의 문턱 바닥 소유를 안감·테에 대조했고 void와 틀이 정확히 맞아 부모를 고치지 않았다.
@evidence settings/20-envelope.md#openings 벽 두께 안의 깊은 문설주·상인방과 문 주변 틀이라는 개구부 설정을 안감과 테로 받는다.
@evidence spaces/openings.md#doors 여덟 문의 유효 폭·높이와 문이 뚫린 벽을 문틀 변형의 입력으로 소비한다.
@evidence spaces/openings.md#boundary-ownership 각 가장자리 0.06m 틀과 void가 경계 한 곳에만 속한다는 규칙을 안감 두께와 void 채움으로 소비한다.
@evidence spaces/storey.md#threshold-support 문턱 바닥이 방 소유라는 배정을 받아 문틀이 바닥을 만들지 않는다.
@evidence settings/20-envelope.md#walls 문 주변이 연한 회백색 석재로 회벽을 나눈다는 설정을 벽면 위 surround 표면으로 받는다.
@evidence settings/50-production.md#references 이미지 03·04의 문 둘레 돌 테와 이미지 05의 깊은 reveal을 근거로 쓴다.
@evidenceExclude spaces/facades/east.md#east-envelope 동측 외벽의 서비스 문 void는 openings.md#doors 표로 받으며 입면의 완결 외면·기단·코핑은 spaces 벽이 소유해 문틀이 입면에서 받는 결정이 없다.
-->

[개구부와 문짝](../settings/20-envelope.md#openings)의 벽 두께 안 깊은 문설주·상인방과 문 주변 틀이다. 이미지 03·04에서 문 둘레를 두르는 넓은 돌 테와 이미지 05의 깊은 reveal이 근거다. 판정된 [출입문 표](../spaces/openings.md#doors)의 유효 폭·높이와 각 가장자리 0.06m 틀을 그대로 소비하며 void 위치를 새로 정하지 않는다.

로컬 원점은 void 바닥 가장자리 선의 중심, 곧 문턱 완성면 Y=0에서 벽 중심면 위의 점이다. 로컬 X는 벽 길이 방향, Z는 벽 두께 방향, +Y는 위다. 안감은 세 조각으로, 두 문설주는 폭 0.06m·높이(유효 높이+0.06m)이고 상인방은 길이(유효 폭+0.12m)·높이 0.06m이며 세 조각의 깊이는 그 문이 뚫린 벽의 두께(0.30m 또는 0.60m)다. 벽 양면에는 void 둘레를 두르는 테(폭 0.16m, 벽면에서 0.03m 돌출)가 문설주 양옆과 상인방 위를 감싼다. 변형은 판정된 여덟 문의 (유효 폭, 유효 높이, 벽 두께) 조합에서 source가 만든다. 점유 상자는 (유효 폭+0.44m)×(유효 높이+0.22m)×(벽 두께+0.06m)다.

part와 표면은 `lining`(안감), `surround`(양면 테)이며 두 표면을 나눠 materials가 안감과 테에 다른 마감을 줄 수 있다. 안감 바깥면과 테 뒷면은 벽 void 면·벽면과 맞닿는 가려진 접촉면이다. 유효 통과 영역(유효 폭×유효 높이)은 비어 있는 negative space이며 문턱 바닥은 이 모델이 아니라 방 바닥 소유다.

검토 판에서 1.0×2.2×0.3m 변형을 정면·측면·3/4로 보고 안감 깊이와 테 돌출이 분리돼 읽히는지 본다. 건물 관찰에서는 각 문 양면에서 틀이 void를 정확히 채우고 벽과 틈이 없으며 유효 폭을 줄이지 않는지를 확인한다. 벽면에 붙인 평면 테만 있고 깊이 방향 안감이 없는 문, void보다 큰 안감, 유효 폭을 침범한 틀은 실패다.

## 양개 목재 문짝 {#double-door-leaf}

<!--
@evidence principles/core/common.md#scope-preservation 정문과 제실 문의 양개 목재 문짝을 두 변형으로 한정하고 짝 치수·테두리와 판·손잡이·경첩·관절·표면까지 정한다.
@evidence principles/core/common.md#substantive-completion 선대·가로대·판 두께와 바닥 띄움, 손잡이 X·양면 Z·Y=1.104m 핀, 반지름 0.06m의 문에 붙은 받침판, 원환 16×8분할과 경첩 위치·12분할을 함께 정해 철물 접점을 고정한다.
@evidence principles/core/common.md#declared-basis 변형 치수는 openings.md#doors의 door-entry 1.8×2.5m·door-sanctuary 1.4×2.5m, 열림 판정 1.4m는 10-building#use-profile, 관절은 scale.md#articulation-map에서 온다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 어두운 목재 양개문이라는 설정을 테두리 판문 구조와 짝마다 hinge node를 가진 모델 결정으로 바꾼다.
@evidence principles/design/models.md#representation-contract frame·panel·plate·pin·ring·hinge part로 목재와 철물의 각 독립 표면을 구별하고 손잡이·경첩을 짝 node의 자식으로 둔다.
@evidence principles/design/models.md#spatial-convention 짝 원점을 경첩 축 바닥 점, 축을 문틀 안감 안쪽 모서리 선 위 여는 쪽 벽면 0.05m 안쪽에 두고 닫힌 자세의 X·Z 범위를 적는다.
@evidence principles/design/models.md#reviewable-structure 닫힘·열림 두 상태의 정면·평면과 건물 안에서 열린 짝이 90°에 멈추고 정문 유효폭 1.4m 이상을 남기는지를 본다.
@evidence principles/design/models.md#model-observable-style-basis 이미지 01의 정문 양개문과 이미지 04의 판과 테두리를 근거로 하고 판 하나로 된 문을 실패로 둔다.
@evidence principles/design/models.md#model-scale-layer-completion 두 변형 치수·관절 범위·기본 open 상태·열린 폭 판정이 함께 정해져 관절 모델 층이 완결된다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work door-entry·door-sanctuary의 유효 치수와 room-double 스윙, use-profile의 열린 정문 1.4m를 짝 폭 0.9/0.7m에 대조했고 90° 열린 두 짝의 두께와 손잡이 돌출을 빼도 정문에 산술상 약 1.64m가 남아 부모를 고치지 않았다.
@evidence settings/20-envelope.md#openings 어두운 목재 양개 정문과 제실 문이라는 설정을 양개 문짝 두 변형으로 받는다.
@evidence spaces/openings.md#doors door-entry 1.8×2.5m와 door-sanctuary 1.4×2.5m, room-double 스윙을 두 변형 치수와 여는 방향으로 소비한다.
@evidence settings/10-building.md#use-profile 열린 정문 1.4m 통과 조건을 열린 짝이 남길 유효폭 판정으로 쓴다.
@evidence settings/50-production.md#references 이미지 01의 정문 양개문과 이미지 04의 판·테두리를 근거로 쓴다.
@evidenceExclude spaces/circulation.md#public-route 현관-주랑 순환 경로는 문 위치와 통과 순서로 이미 openings.md#doors에 실현됐고 문짝은 그 경로에 새 형상을 더하지 않고 통과 폭만 use-profile로 판정한다.
-->

[개구부와 문짝](../settings/20-envelope.md#openings)의 어두운 목재 양개 정문과 제실 문이다. 이미지 01의 정문 양개문과 이미지 04의 판과 테두리가 근거다. 판정된 `door-entry`(유효 1.8×2.5m)와 `door-sanctuary`(1.4×2.5m)의 두 변형만 만들며 한 짝의 폭은 유효 폭의 절반이다.

각 짝의 로컬 원점은 경첩 축의 바닥 점이다. 축은 연직이며 문틀 안감의 안쪽 모서리 선 위, 여는 쪽 벽면에서 0.05m 안쪽에 있다. 닫힌 자세에서 판은 로컬 X 0~(유효 폭/2), Z −0.05~0 범위를 차지하고 바닥에서 0.01m 띄워 높이는 유효 높이−0.01m다. 판은 두께 0.05m이며 선대 폭 0.10m, 윗 가로대 0.10m, 가운데 가로대 0.10m(아랫면 높이 1.00m), 아래 가로대 0.16m로 테두리를 짜고 그 사이 두 판은 양면에서 0.015m 들어가 두께 0.02m다. 맞닿는 선대 쪽 높이 1.05m에 청동 고리 손잡이(바깥 반지름 0.06m, 관 반지름 0.006m)와 받침판(반지름 0.06m, 두께 0.006m)이 양면에 있고, 경첩 쪽 모서리 위·아래에 핀 경첩(반지름 0.02m, 높이 0.10m 원통) 두 개가 있다. 손잡이와 받침판 중심은 각 짝의 X=(유효 폭/2)−0.15m·Y=1.05m이고 받침판은 문 중앙 가로대의 면 Z=0~+0.006m/−0.056~−0.05m에서 판문과 면 접촉한다. 받침판의 반지름 0.06m 원판 중 Y=1.00~1.10m 띠는 가로대 위에 직접 붙고 윗 0.01m 부분만 가로대 위쪽으로 나온다. 고리 중심면은 Z=+0.015m/−0.065m다. 고리는 로컬 XY 평면 원환(주환 16분할·관 8분할)이며 중심선 반지름 0.054m다. 반지름 0.006m의 연결 핀 두 개는 각 받침판 바깥면의 (X,Y)=(손잡이 중심 X,1.104m)에서 해당 면 법선 방향으로 길이 0.009m 뻗어 고리 맨 위 관의 중심선과 겹친다. 핀 축의 받침판 중심으로부터 거리 0.054m에 핀 반지름 0.006m를 더해도 받침판 반지름 0.06m 안이며 접촉 원판 넓이는 양수다. 앞핀은 Z=+0.006~+0.015m, 뒷핀은 Z=−0.056~−0.065m이므로 고리와 받침판 모두에 실체 접촉하고 그 조립은 가로대를 통해 문에 붙는다. 두 경첩 원통 중심은 X=0·Z=−0.025m, Y=0.25m와 (유효 높이−0.25m)이며 둘레 12분할이다. 철물까지 포함한 닫힌 한 짝의 점유 범위는 X=−0.02~(유효 폭/2)m, Y=0.01~유효 높이 m, Z=−0.071~+0.021m다.

관절 인터페이스는 [공통 관절 규칙](scale.md#articulation-map)의 `hinge.<짝 ID>`이며 범위 0°~90°, 기본 `open` 90°, 여는 방향은 spaces의 스윙 예약이다. 손잡이·경첩은 짝 node의 자식이다. part와 표면은 `frame`(선대·가로대), `panel`, `plate`, `pin`, `ring`, `hinge`로 나눠 목재와 금속의 각 표면을 구별한다.

검토 판에서 닫힘·열림 두 상태의 정면·평면을 보고 판의 들어간 면과 테두리, 손잡이와 경첩이 분리돼 읽히는지 확인한다. 건물 관찰에서는 열린 짝이 벽에 닿기 전 90°에 멈추고 정문 유효폭 1.4m 이상을 남기는지 본다. 판 하나로 된 문, 문틀보다 큰 짝, 열림 상태에서 벽이나 기둥을 뚫는 짝은 실패다.

## 외개 목재 문짝 {#single-door-leaf}

<!--
@evidence principles/core/common.md#scope-preservation 봉헌실·세 업무방·마당 두 문의 외개 판문을 세 치수 변형으로 정하고 가로 띠·쇠 띠 경첩·이음 홈·손잡이·관절·표면까지 정한다.
@evidence principles/core/common.md#substantive-completion 가로 띠·쇠 띠·널 다섯 장과 쇠 띠의 X 시작·Y 중심·앞면 Z에 손잡이 위치, 양면 연결 핀과 원환 분할을 더해 source가 철물 접점을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 변형 치수와 여는 방향은 openings.md#doors의 여섯 문과 스윙, 열린 폭 0.9m 판정은 10-building#use-profile, 관절 규칙은 scale.md#articulation-map에서 온다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 서비스·업무 문의 단순한 판문이라는 설정을 한 면에만 띠와 쇠 띠가 있는 비대칭 판과 hinge node라는 모델 결정으로 바꾼다.
@evidence principles/design/models.md#representation-contract board·batten·strap·pin·ring part로 목재와 금속 표면을 나누고 여는 쪽 면과 반대면의 형상 차이를 정한다.
@evidence principles/design/models.md#spatial-convention 원점을 경첩 축 바닥 점으로 두고 축과 닫힌 자세 규칙을 양개 문짝과 같게 하며 짝 폭 = 유효 폭, 높이 = 유효 높이−0.01m로 정한다.
@evidence principles/design/models.md#reviewable-structure 두 상태와 두 면에서 띠가 한 면에만 있는지, 이음 홈이 반대면에서 읽히는지, 열린 짝이 스윙 예약 안에 머무는지를 본다.
@evidence principles/design/models.md#model-observable-style-basis 이미지 01의 서비스 문과 이미지 05의 업무방 문처럼 세로 널을 가로 띠로 묶은 판문을 근거로 하고 양개문과 구별되지 않는 판을 실패로 둔다.
@evidence principles/design/models.md#model-scale-layer-completion 세 치수 변형·경첩 쪽·여는 방향·열린 폭 판정이 함께 정해져 외개 문 층이 완결된다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 여섯 문의 유효 치수(1.2×2.3, 1.0×2.2, 1.1×2.2m)와 북·남 스윙 예약, use-profile의 방 문 0.9m를 짝 폭에 대조했고 가장 좁은 1.0m 문에서도 열린 짝 두께와 손잡이 돌출을 빼면 산술상 약 0.91m가 남아 부모를 고치지 않았다.
@evidence settings/20-envelope.md#openings 봉헌실·업무방·마당의 목재 판문이라는 개구부 설정을 외개 문짝으로 받는다.
@evidence spaces/openings.md#doors door-offering·door-administration·door-records·door-yard·door-storage·door-service-exterior의 치수와 스윙을 세 변형과 여는 방향으로 소비한다.
@evidence settings/10-building.md#use-profile 방 문 0.9m 통과 조건을 열린 외개 짝이 남길 유효 폭 판정으로 쓴다.
@evidence settings/50-production.md#references 이미지 01의 서비스 문과 이미지 05의 업무방 문을 근거로 쓴다.
@evidenceExclude spaces/circulation.md#service-route 마당에서 보관실까지의 반입 순서는 door-yard·door-storage 위치로 openings.md#doors에 이미 실현됐고 문짝 형상은 그 순서에서 새로 받는 결정이 없다.
@evidenceExclude spaces/site.md#site-connections 대지 connector는 서비스 문 밖 앞마당과 정문 진입의 보행 연결이며 door-service-exterior 짝은 외벽 void 안에서만 돌아 connector 끝점을 바꾸지 않는다.
@evidenceExclude spaces/building.md#approach-contacts 정문 도로와 서비스 외부 접점의 높이·위치는 spaces가 문턱과 connector로 소유하고 문짝은 문턱 완성면 위 0.01m에서 도는 판이라 접점을 소비하지 않는다.
-->

봉헌실·세 업무방·마당 두 문의 외개 목재 문이다. 이미지 01의 서비스 문과 이미지 05의 업무방 문처럼 세로 널을 가로 띠로 묶은 단순한 판문이 근거다. 판정된 `door-offering`(1.2×2.3m), `door-administration`·`door-records`·`door-yard`(1.0×2.2m), `door-storage`·`door-service-exterior`(1.1×2.2m)의 세 치수 변형을 만든다.

로컬 원점은 경첩 축의 바닥 점이며 축과 닫힌 자세의 규칙은 양개 문짝과 같다. 짝은 폭 = 유효 폭, 높이 = 유효 높이−0.01m, 두께 0.05m이다. 여는 쪽 면에는 가로 띠 두 줄(연직 폭 0.12m, 두께 0.025m, 아랫면 높이 0.25m와 유효 높이−0.40m)이 있다. 각 쇠 띠 경첩은 X=0에서 시작해 X=0.6×유효 폭에서 끝나며 Y 중심은 아래 띠 0.31m, 위 띠 유효 높이−0.34m다. 연직 폭 0.04m·두께 0.006m이고 앞면 Z=+0.025~+0.031m에 놓여 두 가로 띠의 앞면과 면 접촉한다. 반대면은 세로 널 다섯 장의 이음 홈(폭 0.01m, 깊이 0.004m)만 보인다. 경첩 반대쪽의 쇠 고리 손잡이(바깥 반지름 0.05m, 관 반지름 0.005m)는 양면에서 중심 X=(유효 폭−0.12m)·Y=1.05m, Z=+0.025m/−0.075m이고 로컬 XY 평면의 주환 16분할·관 8분할이다. 각 고리의 중심선 반지름은 0.045m다. 앞·뒤 연결 핀은 반지름 0.006m이고 (X,Y)=(유효 폭−0.12m,1.095m)에서 판 앞면 Z=0m→+0.025m와 뒷면 Z=−0.05m→−0.075m로 각각 길이 0.025m 뻗는다. 각 핀의 끝은 고리 맨 위 관 중심선과 겹치므로 고리와 판 양쪽에 실체 접촉한다. 쇠 띠와 고리까지 포함한 닫힌 문짝 점유 범위는 X=0~유효 폭 m, Y=0.01~유효 높이 m, Z=−0.080~+0.031m다.

관절은 `hinge.<문 ID>` 하나이며 범위와 기본 상태는 공통 규칙을, 경첩 쪽과 여는 방향은 spaces의 스윙 예약(봉헌실 북쪽, 관리실·기록실·보관실 남쪽, 마당 두 문 북쪽)을 따른다. part와 표면은 `board`, `batten`, `strap`, `pin`, `ring`이다.

검토 판에서 두 상태와 두 면을 보고 가로 띠·쇠 띠가 한 면에만 있는지, 이음 홈이 반대면에서 읽히는지 본다. 건물 관찰에서는 열린 짝이 방 안 스윙 예약 안에 머물고 유효 폭 0.9m 이상을 남기는지 확인한다. 양개 문과 구별되지 않는 판, 스윙 예약 밖으로 여는 짝은 실패다.

## 채광구 석재 틀 {#window-frame}

<!--
@evidence principles/core/common.md#scope-preservation 제실 채광구의 깊은 석재 안감과 바깥 테를 두 벽 두께 변형으로 정하고 유리·창살·덧문이 없음을 밝힌다.
@evidence principles/core/common.md#substantive-completion 안감 폭 0.06m와 벽 두께 깊이, 외부 면 테 0.10m·돌출 0.03m, 점유 상자 0.72×0.72×(벽 두께+0.03)m가 있어 source가 창틀을 다시 고르지 않는다.
@evidence principles/core/common.md#declared-basis 유효 0.4×0.4m와 틀 0.06m는 openings.md#clerestories, 벽 두께는 북측 박공 0.60m·제실 남벽과 spine 0.30m, 외부 면 방향은 #boundary-ownership의 위쪽 외부 경계에서 온다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 깊은 틀의 작은 채광구라는 설정을 안쪽은 reveal만, 바깥에만 테가 있는 비대칭 창틀 모델로 바꾼다.
@evidence principles/design/models.md#representation-contract lining·surround part와 안감·테의 가려진 접촉면, 0.4×0.4m의 빈 통과 영역을 정한다.
@evidence principles/design/models.md#spatial-convention 원점을 void 아랫변 중심(창대 높이−0.06m, 벽 중심면)에 둔다.
@evidence principles/design/models.md#reviewable-structure 정면과 45° 시점의 깊은 안감·바깥 테와 건물의 실내 쪽 reveal·외부 쪽 테를 반증 관찰로 둔다.
@evidence principles/design/models.md#model-observable-style-basis 이미지 04의 벽 위쪽 작은 창과 깊은 틀을 근거로 하고 유리 판·얕은 안감을 실패로 둔다.
@evidence principles/design/models.md#model-scale-layer-completion 두 벽 두께 변형과 외부 면 방향의 소유가 정해져 여덟 창이 모두 이 prototype으로 덮인다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work clerestories의 유효 치수·창대 높이와 수리된 위쪽 외부 경계를 두 두께 변형에 대조했고 여덟 창 모두 외부 면이 정해져 모델 쪽에서 부모를 더 고치지 않았다. 창 결속 수리(c7af729c)는 space-source 작업에서 먼저 드러났다.
@evidence settings/20-envelope.md#openings 깊은 석재 틀과 내부 reveal을 가진 작은 채광구라는 설정을 창틀 prototype으로 받는다.
@evidence spaces/openings.md#clerestories 유효 0.4×0.4m, 틀 0.06m, 박공 창과 측벽 창의 결속 벽을 두 변형으로 소비한다.
@evidence spaces/openings.md#boundary-ownership 측벽·남측 창이 결속된 위쪽 외부 경계를 테가 붙을 외부 면 방향으로 소비한다.
@evidence spaces/facades/north.md#north-envelope 박공 창의 외부 면이 북측 입면이라는 사실을 0.60m 변형의 테 방향으로 쓴다.
@evidence settings/50-production.md#references 이미지 04의 벽 위쪽 작은 창과 깊은 틀을 근거로 쓴다.
@evidenceExclude spaces/facades/west.md#west-envelope 서측 봉헌실 외벽은 창이 없는 연속 외피라 채광구 틀 변형이 놓이지 않고 다른 모델도 서측 입면을 소비하지 않는다.
-->

[개구부와 문짝](../settings/20-envelope.md#openings)의 깊은 석재 틀과 내부 reveal을 가진 작은 채광구다. 이미지 04의 벽 위쪽 작은 창과 깊은 틀이 근거이며 유리·창살·덧문은 두지 않는다. 판정된 [채광구](../spaces/openings.md#clerestories)의 유효 0.4×0.4m와 0.06m 틀을 소비한다.

로컬 원점은 void 아랫변의 중심(창대 높이−0.06m, 벽 중심면)이다. 안감 네 조각은 폭 0.06m이며 깊이는 벽 두께(북측 박공 0.60m, 제실 남벽과 두 spine 0.30m)다. 외부 면에만 폭 0.10m, 돌출 0.03m의 테가 네 변을 두른다. 변형은 두 벽 두께에 따른 두 개다. 점유 상자는 0.72×0.72×(벽 두께+0.03)m다.

part와 표면은 `lining`, `surround`이다. 안감 바깥면과 테 뒷면은 벽과 맞닿는 가려진 접촉면이고 0.4×0.4m의 통과 영역은 비어 있다. 외부 면은 박공 창에서는 북측 입면·주랑 지붕 쪽, 측벽 창에서는 봉헌실 지붕·마당 쪽이며 instances가 그 방향을 소비한다.

검토 판에서 정면과 45° 시점으로 깊은 안감과 바깥 테를 보고, 건물 관찰에서 실내 쪽에는 테 없이 reveal만 있고 외부에서는 테가 보이는지 확인한다. 유리 판, 벽 두께보다 얕은 안감, void를 막은 틀은 실패다.

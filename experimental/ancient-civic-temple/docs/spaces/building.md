# 단층 시민 신전의 기준 평면

## 외곽과 치수 선택 {#footprint}

<!--
@evidence principles/core/common.md#scope-preservation 외벽 바깥선 안에 주랑·중정·서비스 마당·후퇴 현관을 함께 넣고 도로를 제외해 약 430㎡의 분모를 유지한다.
@evidence principles/core/common.md#substantive-completion 21×20.5m와 외벽 0.6m·내부벽 0.3m를 선택하고 폐기한 얕은 제실 후보와 비교해 치수 선택을 끝냈다.
@evidence principles/core/common.md#declared-basis 고정 그래프와 면적 범위를 부모로 명시하고 430.5㎡는 사진 측량이 아닌 선택 입력의 산술로 구분한다.
@evidence principles/design/spaces.md#space-topology 좌우 방 사이에 주랑·중정을 두고 왼쪽 긴 방을 별도 복도로 자르지 않는 배치를 외곽 선택에 결속한다.
@evidence principles/design/spaces.md#space-boundary-authority building.ts는 범위와 조립만 맡고 완결 외피·방 표면을 흡수하지 않으며 상세 기준선은 다음 단위가 소유한다.
@evidence principles/design/spaces.md#space-verification-address compiled 외곽이 달라지거나 두 번째 층·중정이 생기는 경우를 이 치수 선택의 반증으로 지정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 허용 면적을 실제 외곽과 벽 두께로 좁히고 제실 깊이와 중정 너비를 함께 확보하는 평면을 골랐다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 10-building의 면적·거의 정방형 범위와 제단/운반 크기를 대조했다. 얕은 제실은 공간 후보를 바꾸어 해결했고 부모의 규모나 물체 크기를 줄일 이유는 없었다. maps는 아직 없다.
@evidence settings/10-building.md#scale 410~450㎡ 허용 범위 안에서 중정·마당까지 포함한 외벽 바깥선 430.5㎡를 선택한다.
@evidence settings/10-building.md#fixed-graph 같은 외곽 안에 후면 제실·좌측 긴 방·우측 방과 중앙 중정을 배치한다.
@evidence settings/35-objects.md#altar 제단을 판으로 줄이는 대신 제실 깊이를 확보하는 대안을 선택한다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 도로를 면적에 넣지 않는 본문 덕분에 후퇴 현관까지 포함한 신전 범위가 430.5㎡ 안에 남는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 폐기 후보의 얕은 제실과 현재 깊이 5.5m를 비교한 선택이 있어 면적 숫자만 적은 평면이 아니다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 21×20.5의 산술을 compiled 값과 구별하고 사진 픽셀에서 얻지 않았다고 명시했다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 왼쪽 봉헌실을 쪼개지 않은 채 중앙 고리와 우측 작업실을 수용하는 관계를 읽었다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 범위와 조립을 building.ts에 남기면서 완결 외피를 입면 owner로 보내는 경계가 있다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 실제 범위의 불일치와 두 번째 층·중정의 발생을 실패로 삼아 이 외곽 결정을 반증할 수 있다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모가 허용한 거의 정방형 규모에서 벽 두께와 제실/중정의 유효 깊이를 추가 결정했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 면적과 제단 조건을 후보에 대조한 결과는 제단 축소가 아니라 평면 선택 변경이다. 상위 요구를 버린 근거는 없다.
@evidenceReview settings/10-building.md#scale #4d1f683 외벽 바깥선 안의 서비스 마당도 분모에 들어가며 도로는 빠져 부모 면적 정의와 맞는다.
@evidenceReview settings/10-building.md#fixed-graph #afadc4e 후면·좌측·우측이라는 방 배치가 외곽 선택의 내부 관계로 남고 별도 중정은 없다.
@evidenceReview settings/35-objects.md#altar #53d6be8 제실을 깊게 고른 사유가 제단과 운반의 수용이며 제단을 축소해 통과시켰다는 주장이 없다.
-->

이 설계는 [고정 그래프](../settings/10-building.md#fixed-graph)와 [면적 범위](../settings/10-building.md#scale)를 소비한다. 외벽 바깥선은 X=-10.5~10.5m, Z=-10.25~10.25m인 하나의 직사각형이다. 선택한 입력 면적은 21×20.5=430.5㎡이며 장변/단변 비는 약 1.024다. 주랑·중정·서비스 마당·후퇴한 현관도 이 외곽 안에 있고 도로는 밖이다. 이 산술은 설계 입력의 비교이며 compiled 계측 결과가 아니다.

외벽 두께는 0.6m, 내부 경계벽은 0.3m다. 좌우 방의 유효 깊이는 4m로 잡고, 그 사이에 기둥 기단이 놓인 주랑과 중앙 중정을 배정한다. 북쪽 제실은 넓은 전면 축과 제단 앞 접근을 얻고, 오른쪽 세 방은 같은 깊이의 작성·열람·저장 작업실로 나눈다. 왼쪽 봉헌실은 길지만 별도 복도나 뒷방으로 자르지 않는다. 벽 진열과 긴 탁자의 사용 구역으로 길이를 읽힌다.

선행 후보 22×19.6m의 12.2×4.1m 제실은 너비에 비해 깊이가 얕았고, 옆방을 5m로 넓힌 후보는 중정을 크게 줄였다. 현재 외곽은 21×20.5m로 바꾸어 제실의 깊이 5.5m, 중정의 너비 7m를 함께 남긴 선택이다. 사진 픽셀에서 얻은 치수가 아니다. 물체를 줄여 맞추지 않고 [제단](../settings/35-objects.md#altar)과 [운반 포락](../settings/10-building.md#use-profile)을 수용할 설계 여지를 늘렸다. 최종 통과 여부는 문짝·기둥·집기를 포함한 source와 프레임에서 확인해야 하며 현재 unverified다.

building ID는 `temple`이다. source 소유는 `src/spaces/building.ts`이며 building의 범위와 조립만 맡고 완결 외피·방 표면을 이 파일에 몰아넣지 않는다. 외곽·면적·방 관계를 검사하는 [관찰 설계](observations.md#geometry-observations)가 이 결정의 반증 위치다. compiled 건물 범위가 위 외곽과 다르거나 두 번째 층·중정이 생기면 이 owner부터 수리한다.

## 공유 평면 기준선 {#plan-datums}

<!--
@evidence principles/core/common.md#scope-preservation 외벽 양면부터 중정·주랑·업무방·현관 반환벽까지 하위 경계가 소비할 X/Z 선을 빠짐없이 이름 붙인다.
@evidence principles/core/common.md#substantive-completion 벽 양면 사이 두께와 방 전후 끝을 표의 수치로 확정하고 공유 입력 비교 허용값 0.001m를 정한다.
@evidence principles/core/common.md#declared-basis 좌표 규약을 상속하고 허용값은 유적 측량 정밀도가 아닌 저작 일치 비교용이라고 밝힌다.
@evidence principles/design/spaces.md#space-topology 마당 남면과 보관실 북면처럼 맞붙은 공간 사이에 물리벽 하나가 들어가는 양면 관계를 정의한다.
@evidence principles/design/spaces.md#space-boundary-authority 하위 파일은 기준선 이름을 참조하고 자체 상수로 복제하지 않으며 문 중심의 국소 좌표는 opening owner에 남긴다.
@evidence principles/design/spaces.md#space-verification-address 선 변경 시 방·입면·지붕·문·관찰을 함께 읽고 입력 경계 차이를 0.001m와 대조한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Y-up 좌표 약속을 현관 후퇴부와 세 업무방까지 구별하는 실제 X/Z 기준선으로 구체화한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 00-delivery의 m 단위와 앞/뒤·좌/우 규약으로 모든 기준선의 부호와 순서를 정할 수 있어 다른 좌표계나 부모 보정이 필요하지 않았다.
@evidence settings/00-delivery.md#coordinates X와 Z의 부호 및 북쪽에서 남쪽으로의 배열을 생산 좌표 규약에 맞춘다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 현관 반환벽의 안팎까지 표에 있어 후퇴부를 별도 임의 치수로 메울 필요가 없다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 기준선 표와 0.001m 대조값이 함께 있으므로 하위 경계 일치의 입력이 완결된다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 0.001m를 고대 측량 정밀도가 아닌 저작 허용값으로 한정한 문장을 확인했다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 yard-front와 storage-back 사이를 하나의 벽 두께로 읽게 해 맞닿은 방의 경계를 뒤집지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 문 중심은 opening에, 공유 X/Z 선은 이 표에 남겨 서로 다른 치수 책임을 구별했다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 공유 선이 바뀔 때 방·입면·roof·문·관찰을 다시 읽도록 한 범위가 경계 불일치를 드러낸다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 앞/뒤 좌표 약속만 있던 부모에 업무방 전후 끝과 현관 후퇴선의 실제 값을 더했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 부모의 m·Y-up·앞뒤 규약으로 표의 부호와 순서를 읽을 수 있고 변환 보정은 요구되지 않는다.
@evidenceReview settings/00-delivery.md#coordinates #4d2b0d4 서동 X의 반대 부호와 북→남 Z 순서를 좌표 본문과 대조했다.
-->

[좌표 규약](../settings/00-delivery.md#coordinates)을 그대로 쓴다. 아래 기준선은 벽면·공간 경계의 단일 치수 소유다. 다른 파일은 이름을 참조하고 수치를 복사하지 않는다. `west`와 `east` 쌍은 X 부호만 반대다. Z는 북쪽에서 남쪽 순이며 문 위치의 별도 국소 치수는 해당 개구부 owner가 정한다.

| 기준선 | X 또는 Z (m) | 의미 |
| --- | ---: | --- |
| west/east-outer | X=∓10.5 | 외벽 바깥면 |
| west/east-inner | X=∓9.9 | 외벽 안쪽면 |
| west/east-room | X=∓5.9 | 측면 방의 주랑 쪽 벽면 |
| west/east-ring | X=∓5.6 | 주랑의 방 쪽 벽면 |
| west/east-court | X=∓3.5 | 열린 중정과 주랑의 바닥 경계 |
| west/east-porch | X=∓1.8 | 현관 반환벽의 중심 지지선 |
| west/east-porch-inner | X=∓1.65 | 반환벽의 현관 쪽 면 |
| west/east-porch-outer | X=∓1.95 | 반환벽의 주랑 쪽 면 |
| north-outer | Z=-10.25 | 후면 외벽 바깥면 |
| north-inner | Z=-9.65 | 후면 외벽 안쪽면 |
| sanctuary-front | Z=-4.15 | 제실의 남쪽 벽면 |
| north-ring | Z=-3.85 | 북쪽 주랑의 제실 쪽 벽면 |
| yard-front | Z=-2.45 | 서비스 마당의 남쪽 벽면 |
| storage-back | Z=-2.15 | 보관실의 북쪽 벽면 |
| court-back | Z=-1.75 | 중정 북쪽 바닥 경계 |
| storage-front | Z=1.55 | 보관실의 남쪽 벽면 |
| records-back | Z=1.85 | 기록실의 북쪽 벽면 |
| records-front | Z=5.6 | 기록실의 남쪽 벽면 |
| office-back | Z=5.9 | 관리실의 북쪽 벽면 |
| court-front | Z=6.1 | 중정 남쪽 바닥 경계 |
| entrance-back | Z=8.05 | 현관 후퇴벽의 주랑 쪽 면 |
| entrance-front | Z=8.35 | 현관 후퇴벽의 바깥 면 |
| south-inner | Z=9.65 | 정면 외벽 안쪽면 |
| south-outer | Z=10.25 | 정면 외벽 바깥면 |

공간 설계의 일치는 입력 기준선에서 허용 오차 0.001m 이내로 대조한다. 이것은 유적 측량 정밀도가 아니라 source의 공유 경계를 비교하는 저작 허용값이다. 벽 두께만큼 떨어진 두 공간 면 사이에 하나의 물리벽이 있고 같은 위치에 벽 두 개를 중첩하지 않는다. 공유 기준선이 바뀌면 해당 방·입면·지붕·문·관찰 위치를 함께 다시 읽는다. source에서는 이 기준선 값을 단일 입력으로 내보내고 하위 소유가 받아 쓰며 자체 상수로 복제하지 않는다.

## 연결의 위계 {#containment}

<!--
@evidence principles/core/common.md#scope-preservation 현관부터 서비스 마당까지 전부 temple의 유일 지상층 아래에 두며 방끼리 통과해야만 도착하는 대상을 만들지 않는다.
@evidence principles/core/common.md#substantive-completion building·storey·공간의 부모와 주랑·문·사용 경로의 담당 주소를 결정한다.
@evidence principles/core/common.md#declared-basis settings의 건물 연결 조건을 temple과 지상층의 명명된 위계로 실현한다.
@evidence principles/design/spaces.md#space-topology 주랑 네 변은 한 공간이며 각 방과 서비스 마당이 이 공간에 직접 문으로 접속한다.
@evidence principles/design/spaces.md#space-boundary-authority 고리 영역은 colonnade, 문 관계는 openings, 이용 순서는 circulation에 맡겨 부모 목록이 세 결정을 복제하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 실제 storeyId와 부모뿐 아니라 지나간 void·바닥·문짝까지 읽어 관계 목록만 맞는 단절을 찾는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 고정 방 배치를 temple 아래 지상층 한 개와 직접 출입 관계로 묶어 후속 생성의 부모 identity를 제공한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 10-building의 단층·주랑 직접 문·서비스 외부 문 허용을 함께 적용해도 방 간 우회나 두 번째 복도가 필요하지 않아 고정 그래프를 고치지 않았다.
@evidence settings/10-building.md#fixed-graph 모든 요구 공간의 같은 층 귀속과 주랑 직접 출입을 부모/접속 목록으로 옮긴다.
@evidence settings/10-building.md#civic-identity 제실만 있는 홀이 아니라 공동 봉헌·기록·관리·보관을 같은 건물의 연결된 방으로 둔다.
@evidence obligations/design/spaces.md#space-reference-topology temple→temple-ground→모든 공간의 부모와 주랑 직접 출입 관계를 명명하고 문/경로 owner로 연결한다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 서비스 마당까지 같은 지상층 목록에 있으며 방끼리 통과해야 하는 막힌 목적지가 없다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 부모 위계와 문/고리/경로의 참조 주소가 있어 이름 목록 뒤의 연결 결정을 찾을 수 있다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb settings의 단층 조건이 temple 아래 지상층 하나라는 구체 부모 관계의 권위다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 네 변을 별도 방으로 등록하지 말라는 본문이 하나의 주랑 identity를 보존한다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 부모 목록이 door 위치나 고리 윤곽을 다시 정하지 않고 각 owner로 보낸다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 storeyId 대조만으로 끝내지 않고 void·바닥·문짝을 읽어 명목상 도달의 오판을 막는다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 방 배치를 직접 출입과 부모 identity로 전개해 settings의 이름 목록 이상을 제공한다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 서비스 외부 문과 주랑 직접 문은 동시에 가능하며 다른 방 관통을 상위 조건으로 추가하지 않았다.
@evidenceReview settings/10-building.md#fixed-graph #afadc4e 현관·중정·주랑·제실·봉헌실·업무방·마당의 한 층 귀속이 모두 본문에 있다.
@evidenceReview settings/10-building.md#civic-identity #62ab7cd 기록·관리·보관 기능을 제실에 흡수하지 않고 연결된 개별 방으로 유지했다.
@evidenceReview obligations/design/spaces.md#space-reference-topology #5053f99 층의 parent와 문/경로 owner를 함께 추적할 수 있어 주소 없는 연결이 남지 않는다.
-->

`temple` 아래에는 [지상층](storey.md#ground-storey) 하나가 있고 그 아래에 현관, 중정, 주랑, 제실, 봉헌실, 관리실, 기록실, 보관실, 서비스 마당이 있다. 후면 제실과 왼쪽 봉헌실, 오른쪽 세 방은 각각 주랑에 직접 문을 낸다. 서비스 마당도 같은 주랑에 직접 문을 내며 외부 문은 실제 서비스 접근으로 이어진다. 방끼리 연결해야만 도착하는 대상은 없다.

중정 둘레의 고리는 [주랑](rooms/colonnade.md#ring-volume) 하나가 소유한다. 네 변을 서로 다른 방으로 등록하거나 마당 옆에 두 번째 복도를 추가하지 않는다. 방 문은 [경계와 개구부](openings.md)에, 사용 경로는 [통행](circulation.md)에 귀속한다. containment 검사는 모든 공간의 storeyId와 부모 연결을 실제 산출물에서 읽고, 경로 검사는 도달한 ID뿐 아니라 통과한 void·바닥·문짝을 함께 읽는다.

## 외부 접근을 받는 건물 접점 {#approach-contacts}

<!--
@evidence principles/core/common.md#scope-preservation 정문 계단 발치와 서비스 문턱을 별도 접점으로 두어 서로 다른 외부 높이의 접근을 모두 남긴다.
@evidence principles/core/common.md#substantive-completion contact-temple-public과 contact-temple-service의 연결 공간·참조 경계·진입 방향·폭 소유를 표에서 확정한다.
@evidence principles/core/common.md#declared-basis 위치는 기준선, 높이는 층, 유효 폭은 계단/문 owner에서 소비하고 외부 지면과 connector는 대지 owner에서 받는다고 구분한다.
@evidence principles/design/spaces.md#space-topology 대지 temple-site에서 entrance 또는 service-yard로 들어오는 두 접면을 기존 공간에 연결하고 새 방이나 외부 노드로 승격하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority building은 접점 관계만 내보내고 문·바닥 mesh와 외부 지면은 각각 기존 공간 및 대지 소유에 남긴다.
@evidence principles/design/spaces.md#space-verification-address 접면 일치·문턱 단차와 경계석·배수 홈·문짝의 침범을 왕복 운반 포락으로 확인하도록 한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 도로/서비스 접근을 서로 다른 안정 ID와 건물 외곽 접면으로 구체화한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 10-building의 정문 국소 석단과 서비스 무단차 조건, 40-environment의 외부 길 연속성을 대조했다. 두 접점으로 양립하고 대지 connector가 두 접점을 그대로 받아 부모 조건을 고치지 않았다.
@evidence settings/10-building.md#ground-access 정문 계단 하단 높이를 서비스 문턱에 복사하지 않고 서비스 진입은 마당과 이어지는 높이로 소비한다.
@evidence settings/40-environment.md#site 도로와 외부 서비스 길이 실제 건물 접면에 이어져야 한다는 요구를 대지 connector가 받는 두 인터페이스로 제공한다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation 정문 발치(-0.24)와 서비스 문턱(Y=0)이 표의 별도 행이라 한 접점을 빼거나 두 진입을 같은 높이로 합치는 축소가 남지 않는다.
@evidenceReview principles/core/common.md#substantive-completion 두 contact의 연결 공간·위치·유효 범위·진입 방향이 표 네 열에 채워져 대지 connector가 받을 접면을 새로 고르지 않는다.
@evidenceReview principles/core/common.md#declared-basis 마지막 문단이 외부 지면·길·경계석을 대지 owner로 돌리고 위치·높이·폭은 기준선·층·계단/문 링크에서 받아 이 H2가 새로 정한 값이 없다.
@evidenceReview principles/design/spaces.md#space-topology contact가 새 방·추가 출입문·대지 쪽 공간이 아니라는 문장과 temple-site의 두 connector가 받는다는 문장이 함께 있어 외부와 건물의 연결이 하나로 읽힌다.
@evidenceReview principles/design/spaces.md#space-boundary-authority building.ts는 관계만 내보내고 바닥·문 mesh는 기존 공간, 지면은 대지가 만든다고 적어 한 표면을 두 곳이 만들지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address 경계석·배수 홈·식생·문짝이 유효 접면을 막는지 실제 통행 포락으로 보라는 문장이 좌표만 맞고 경로가 막힌 경우를 실패로 만든다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation 설정의 도로/서비스 접근을 public/service 두 안정 ID와 서로 다른 진입 방향·높이로 나눈 것이 이 단위가 더한 결정이다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work 정문 석단과 서비스 무단차가 두 접점에서 양립하고 대지 쪽 connector도 그 높이를 그대로 받아 부모에서 고칠 결함이 드러나지 않았다.
@evidenceReview settings/10-building.md#ground-access 서비스 행이 층 owner의 서비스 외부 높이를 소비해 정문 계단 하단 높이와 구별되고 서비스 문턱에 단이 생기지 않는다.
@evidenceReview settings/40-environment.md#site 설정의 외부 길 연속 요구가 대지 connector 두 개로 건물 접면까지 이어지며 실제 왕복 통과는 unverified로 남는다.
-->

건물 `temple`은 외부 보행을 아래 두 접점에서 받아 기존 지상층 공간으로 잇는다. 이 ID는 건물 측 바닥·출입 경계의 식별자이며 새 방, 추가 출입문 또는 대지 쪽 공간이 아니다. 좌표는 [기준선](#plan-datums), 바닥 높이는 [층](storey.md#ground-storey), 폭은 실제 계단과 문을 소유하는 설계에서 가져온다. `src/spaces/building.ts`는 이 관계를 내보내고 바닥이나 문 mesh를 복제하지 않는다.

| 접점 ID | 건물 측 연결과 위치 | 접면의 유효 범위 | 외부에서 들어오는 방향 |
| --- | --- | --- | --- |
| contact-temple-public | exterior→entrance; 정문 축 X=0, Z=south-outer의 계단 하단 발치 | [현관 계단](rooms/entrance.md#entrance-volume)의 폭, 층 owner의 정문 도로 높이 | -Z; 두 단을 거쳐 상부참과 door-entry로 연결 |
| contact-temple-service | exterior→service-yard; X=east-outer, Z는 door-service-exterior의 중심 | [외부 서비스 문](openings.md#doors)의 틀을 제외한 유효 폭, 층 owner의 서비스 외부 높이 | -X; 외벽 두께를 관통하는 문턱에서 마당으로 연결 |

정문 접점의 높이는 계단의 하단 발치를 받는 외부 바닥 높이다. 이 높이를 상부참에 복사해 계단을 없애거나, 서비스 문 앞에도 복사해 의도하지 않은 단차를 만들지 않는다. 접면의 평면 일치는 [기준선 허용 오차](#plan-datums)로, 서비스 문턱은 [마당의 단차 한계](rooms/service-yard.md#yard-volume)로 비교한다. 문은 양방향 통과를 검사하며 위 방향은 진입 순서를 표시한다. 경계석·배수 홈·식생·문짝이 유효 접면을 막는지도 실제 통행 포락으로 확인한다.

외부 지면·길·경계석과 대지 범위는 [대지](site.md#site-extent)가 소유한다. [지면의 높이](site.md#site-grade)가 정문 도로 Y=-0.24m와 서비스 외부 Y=0을 잇고, [대지와 건물의 연결](site.md#site-connections)의 두 connector가 이 두 접점을 `temple-site`에서 받는다. maps 분기는 열리지 않으므로 world→site의 별도 접근 노드는 두지 않고 대지 범위의 정면 거리와 골목이 외부 보행의 끝이다. [통행](circulation.md)의 경로 시작은 이 건물 측 접점이며 대지 쪽을 포함한 왕복·접지 검사는 [관찰](observations.md#geometry-observations)이 맡는다. 문짝·기둥이 들어온 뒤의 실제 왕복 통과는 아직 확인하지 않았으므로 unverified다.

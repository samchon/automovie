# 같은 층의 공용·서비스 접근

## 현관과 주랑의 순환 {#public-route}

<!--
@evidence principles/core/common.md#scope-preservation 정문 접점부터 두 단·문·중정까지의 축과 주랑 네 변의 순환, 각 방 직접 출입을 같은 경로 설계에 남긴다.
@evidence principles/core/common.md#substantive-completion exterior→entrance와 entrance→colonnade를 구별하고 중정 남쪽 디딤 폭·깊이 및 왕복 검사 순서를 정한다.
@evidence principles/core/common.md#declared-basis 이동 포락은 설정에서, 단면과 높이는 현관/층에서 소비하며 API 반환은 실제 충돌 결과가 아니라고 한정한다.
@evidence principles/design/spaces.md#space-topology 동일 공간 from/to connector 대신 한 colonnade 합집합 안 경로를 써서 표현 편의로 고리를 여러 방으로 나누지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 경로 의미만 circulation이 소유하고 문·계단·바닥 치수는 기존 opening·현관·층 주소에서 가져온다.
@evidence principles/design/spaces.md#space-verification-address 문마다 양방향 문턱 연속성과 고리 모서리 회전 포락을 검사해 그래프 도달과 카메라 이동만의 통과를 거부한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 단일 주랑이라는 부모 관계에 실제 정문/중정 진입 순서와 동일 공간 경로의 표현 방식을 더한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work fixed-graph의 직접 출입과 use-profile의 보행·운반 포락을 단차 조건과 함께 읽었다. 한 고리 내부 경로와 방 문으로 수용하므로 두 번째 복도나 새 이용자 조건을 부모에 요구하지 않았다.
@evidence settings/10-building.md#fixed-graph 남→동→북→서→남의 유일 고리에 모든 방의 문을 붙인다.
@evidence settings/10-building.md#use-profile 문과 모서리의 왕복·회전에 설정의 보행/운반 포락을 그대로 적용한다.
@evidence obligations/design/spaces.md#space-access-circulation 공용 진입과 단일 고리의 실제 문·바닥·회전 포락을 연결하고 서비스 경로는 다음 단위가 별도 접점에서 같은 주랑에 잇는다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 정문 두 단과 중정 남쪽 턱, 각 방 문을 모두 지나가는 경로라 고리만 남긴 축소가 아니다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 계단 connector와 문 connector를 분리하고 중정 디딤 면도 정해 실제 연결 순서를 제공한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb builtConnectorSectionAt 반환을 장애물 여유 실측으로 읽지 않는 한계가 명시돼 있다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 colonnade→colonnade를 만들지 않고 같은 volume 내부 경로를 택해 공간 수를 늘리지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 계단 단면은 entrance, 높이는 storey에서 받아 경로 문서가 바닥을 재정의하지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 열린 문짝과 고리 모서리 회전까지 검사하므로 단순 그래프 도달만으로 통과시킬 수 없다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 단일 고리 요구에 외부 계단·정문·중정 턱의 서로 다른 전이 순서를 더했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 보행·운반 포락을 직접 문과 고리에 적용하는 설계가 가능하며 새 복도를 부모에게 요구하지 않았다.
@evidenceReview settings/10-building.md#fixed-graph #afadc4e 남→동→북→서→남에서 모서리 문을 추가하지 않아 원래 순환 관계가 보존된다.
@evidenceReview settings/10-building.md#use-profile #00a6851 이동자의 포락을 줄이는 대신 왕복과 회전에서 실제 문·기둥을 확인하도록 남겼다.
@evidenceReview obligations/design/spaces.md#space-access-circulation #76c5e04 공용 경로와 service-route를 함께 읽었고 두 시작점 모두 같은 주랑과 실체 문턱을 경유한다.
-->

공용 시작은 [건물 접점](building.md#approach-contacts) `contact-temple-public`이다. [현관](rooms/entrance.md#entrance-volume)의 두 석단과 상부참을 거쳐 `door-entry`를 통과하면 남쪽 주랑이며 직진하면 중정의 남쪽 턱을 내려 중앙 수반 앞에 선다. 주랑의 순환은 남→동→북→서→남의 같은 바닥이고 어느 모서리에도 문이나 닫힌 벽을 추가하지 않는다. 제실·봉헌실·관리실·기록실·보관실은 각각 자기 [문](openings.md#doors)으로 이 고리에 붙는다.

주랑 내부 순환은 한 `colonnade` volume 안의 연속 경로다. 공개 `IAutoMovieBuiltConnector`는 서로 다른 공간을 잇고 `validateBuiltEnvironment`는 동일한 from/to를 거부하므로, 고리를 표현하려고 `colonnade → colonnade` connector를 만들거나 cell을 별도 공간으로 승격하지 않는다. 방 문과 중정 단차는 서로 다른 실제 공간의 connector로 연결하고, 주랑 내부의 순환 검사는 합집합 안의 경로와 실제 바닥·장애물·회전 포락을 함께 읽는다. 이 구분은 topology 표현 계획이며 route 실측 결과가 아니다.

중정 남쪽 축의 발 디딤 구간은 폭 1.8m, 수평 깊이 0.35m를 예약하고 단높이는 층 높이에서 유도한다. 공간을 연결하는 connector는 이 실제 디딤 면에 닿아야 한다. 주랑에 배정한 여유는 [주랑 cell](rooms/colonnade.md#ring-volume)에서 정하고 이 문서는 다른 폭을 중복 선언하지 않는다. 보행과 운반은 [설정 포락](../settings/10-building.md#use-profile)을 그대로 사용한다.

정문 접근은 [현관의 단면](rooms/entrance.md#entrance-volume)에서 실제 챌면·디딤·상부참을 소비한다. exterior→entrance의 계단과 entrance→colonnade의 문 통과는 서로 다른 연결이며, 디딤 하나마다 새 공간을 만들지 않는다. 경로의 입력 높이·폭이나 `builtConnectorSectionAt`의 반환만으로 석단의 실측 여유를 통과시키지 않는다. 이 공개 함수는 connector에 선언된 폭·유효 높이를 반환하거나 보간하므로, 실제 보·기단·열린 문짝과 통행 포락의 충돌은 별도로 대조해야 한다. 계단의 높이 차를 경사로로 바꾸거나 상부참 앞에 세 번째 단을 추가하면 기존 설계와 불일치다.

검사는 바닥의 공유 경계를 따라 실제 통과 가능한 문/connector의 순서와 열린 문짝의 방해 여부를 읽는다. 각 문을 왕복하고 고리 네 모서리에서는 회전 포락도 확인한다. 카메라의 자유 이동이나 인접 그래프의 단순 도달만으로 통과라고 세지 않는다. 경로 의미 소유는 `src/spaces/circulation.ts`이고 실제 형상은 방·문·층의 단일 소유를 소비한다.

각 문 통과는 한쪽 방 바닥→[벽 두께 안 문턱](storey.md#threshold-support)→반대쪽 바닥의 순서로 확인한다. connector의 끝점이 방 안에 있다는 사실만으로 그 중간 지지면을 생략하지 않는다. 실제 문턱과 맞닿는 두 바닥의 높이·범위·소유, 열린 문짝 뒤의 유효 통과 영역을 함께 읽으며 서비스 문의 외부 지면 접합도 같은 대상이다.

## 마당에서 보관실까지의 반입 {#service-route}

<!--
@evidence principles/core/common.md#scope-preservation 외부 서비스 문부터 마당·주랑·보관실까지 반입 전 구간을 포함하며 제실이나 기록실 통과를 요구하지 않는다.
@evidence principles/core/common.md#substantive-completion contact-temple-service에서 door-service-exterior·door-yard·door-storage를 거치는 도착 순서와 높이 조건을 확정한다.
@evidence principles/core/common.md#declared-basis 사용 포락과 서비스 높이는 설정/층의 기존 입력이며 외부 지면은 maps가 소비할 미구현 조건이다.
@evidence principles/design/spaces.md#space-topology 마당과 보관실의 공유 벽을 뚫지 않고 북동 주랑의 짧은 구간으로 연결해 별도 루프를 만들지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 접점·문 위치·바닥은 각각 building/openings/storey에서 받고 이 단위는 반입 순서와 회전을 맡는다.
@evidence principles/design/spaces.md#space-verification-address 좁은 마당 문 앞·북동 모서리 회전과 양방향 threshold의 실제 장애물 거리를 반증 항목으로 지정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 서비스 마당 허용을 제실에 들어가지 않는 명명된 문 세 개의 반입 경로로 좁힌다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 작은 봉헌물의 운반 포락과 서비스 문턱 한계를 이 경로에 적용했다. 계단이나 제실 관통 없이 같은 높이로 계획할 수 있어 사용 범위를 고치지 않았다.
@evidence settings/10-building.md#ground-access 외부 문부터 보관실까지 같은 층 높이를 이어 정문 석단 조건과 혼동하지 않는다.
@evidence settings/30-interiors.md#service-yard 외부 반입과 주랑 직접 출입을 마당의 두 문을 잇는 경로로 사용한다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 제실이나 기록실을 통과하지 않는 반입 순서가 적혀 있어 서비스 기능이 공용 방을 잠식하지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 외부 문·마당 문·보관실 문이 차례로 명명돼 반입 경로의 시작과 도착을 잇는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 외부 지면은 maps의 미구현 조건으로 남고 건물 내 높이는 층에서 받는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 북동 주랑의 짧은 구간을 공유하므로 마당-보관실 사이에 새 문이나 루프가 필요하지 않다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 문 위치를 다시 적지 않고 openings를 소비하며 이 H2는 반입 순서와 회전을 결정한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 좁은 마당 문 앞과 북동 회전점이 지정돼 직선 통과만으로 반입을 판정할 수 없다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 마당의 두 출입 약속에 보관실까지 명명된 문 순서를 더한 것이 이 단위의 추가 결정이다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 작은 봉헌물의 운반 조건과 서비스 단차 한계를 그대로 적용했고 제실 관통으로 회피하지 않았다.
@evidenceReview settings/10-building.md#ground-access #be07d7d 전 구간 같은 층 높이라는 조건은 정문 도로 높이를 서비스 입구에 복사하는 해석을 거부한다.
@evidenceReview settings/30-interiors.md#service-yard #bc0ce16 외부 반입→주랑→보관실의 순서가 마당을 단순 장식 공간으로 만들지 않는다.
-->

서비스 시작은 [건물 접점](building.md#approach-contacts) `contact-temple-service`다. `door-service-exterior`→[서비스 마당](rooms/service-yard.md#yard-volume)→`door-yard`→북동 주랑→`door-storage`→보관실 중앙 순서로 작은 봉헌물을 옮긴다. 외부 접점부터 전 구간이 같은 층 바닥 높이이며 제실이나 기록실을 통과하지 않는다. 이 경로는 기존 주랑의 짧은 구간을 공유하고 별도 순환 복도를 만들지 않는다.

운반 포락은 회전 시에도 벽·기둥·열린 문짝을 통과할 수 없다. 특히 좁은 마당 문 앞과 북동 모서리에서 회전을 검사한다. 외부 지면은 maps가 이 접점 높이를 소비해야 하며 정문 도로의 낮은 높이를 서비스 문에도 복사하지 않는다. 양방향 threshold와 바닥 종단면, 가장 가까운 장애물까지의 compiled 거리로 반증한다. 소스 없는 지금은 모든 물리 통과 결과를 unverified로 남긴다.

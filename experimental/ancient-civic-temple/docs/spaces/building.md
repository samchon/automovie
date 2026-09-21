# 단층 시민 신전의 기준 평면

## 외곽과 치수 선택 {#footprint}

이 설계는 [고정 그래프](../settings/10-building.md#fixed-graph)와 [면적 범위](../settings/10-building.md#scale)를 소비한다. 외벽 바깥선은 X=-10.5~10.5m, Z=-10.25~10.25m인 하나의 직사각형이다. 선택한 입력 면적은 21×20.5=430.5㎡이며 장변/단변 비는 약 1.024다. 주랑·중정·서비스 마당·후퇴한 현관도 이 외곽 안에 있고 도로는 밖이다. 이 산술은 설계 입력의 비교이며 compiled 계측 결과가 아니다.

외벽 두께는 0.6m, 내부 경계벽은 0.3m다. 좌우 방의 유효 깊이는 4m로 잡고, 그 사이에 기둥 기단이 놓인 주랑과 중앙 중정을 배정한다. 북쪽 제실은 넓은 전면 축과 제단 앞 접근을 얻고, 오른쪽 세 방은 같은 깊이의 작성·열람·저장 작업실로 나눈다. 왼쪽 봉헌실은 길지만 별도 복도나 뒷방으로 자르지 않는다. 벽 진열과 긴 탁자의 사용 구역으로 길이를 읽힌다.

선행 후보 22×19.6m의 12.2×4.1m 제실은 너비에 비해 깊이가 얕았고, 옆방을 5m로 넓힌 후보는 중정을 크게 줄였다. 현재 외곽은 21×20.5m로 바꾸어 제실의 깊이 5.5m, 중정의 너비 7m를 함께 남긴 선택이다. 사진 픽셀에서 얻은 치수가 아니다. 물체를 줄여 맞추지 않고 [제단](../settings/35-objects.md#altar)과 [운반 포락](../settings/10-building.md#use-profile)을 수용할 설계 여지를 늘렸다. 최종 통과 여부는 문짝·기둥·집기를 포함한 source와 프레임에서 확인해야 하며 현재 unverified다.

building ID는 `temple`이다. source 소유는 `src/spaces/building.ts`이며 building의 범위와 조립만 맡고 완결 외피·방 표면을 이 파일에 몰아넣지 않는다. 외곽·면적·방 관계를 검사하는 [관찰 설계](observations.md#geometry-observations)가 이 결정의 반증 위치다. compiled 건물 범위가 위 외곽과 다르거나 두 번째 층·중정이 생기면 이 owner부터 수리한다.

## 공유 평면 기준선 {#plan-datums}

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

`temple` 아래에는 [지상층](storey.md#ground-storey) 하나가 있고 그 아래에 현관, 중정, 주랑, 제실, 봉헌실, 관리실, 기록실, 보관실, 서비스 마당이 있다. 후면 제실과 왼쪽 봉헌실, 오른쪽 세 방은 각각 주랑에 직접 문을 낸다. 서비스 마당도 같은 주랑에 직접 문을 내며 외부 문은 실제 서비스 접근으로 이어진다. 방끼리 연결해야만 도착하는 대상은 없다.

중정 둘레의 고리는 [주랑](rooms/colonnade.md#ring-volume) 하나가 소유한다. 네 변을 서로 다른 방으로 등록하거나 마당 옆에 두 번째 복도를 추가하지 않는다. 방 문은 [경계와 개구부](openings.md)에, 사용 경로는 [통행](circulation.md)에 귀속한다. containment 검사는 모든 공간의 storeyId와 부모 연결을 실제 산출물에서 읽고, 경로 검사는 도달한 ID뿐 아니라 통과한 void·바닥·문짝을 함께 읽는다.

## 외부 접근을 받는 건물 접점 {#approach-contacts}

건물 `temple`은 외부 보행을 아래 두 접점에서 받아 기존 지상층 공간으로 잇는다. 이 ID는 건물 측 바닥·출입 경계의 식별자이며 새 방, 추가 출입문 또는 maps의 대지 접근 노드가 아니다. 좌표는 [기준선](#plan-datums), 바닥 높이는 [층](storey.md#ground-storey), 폭은 실제 계단과 문을 소유하는 설계에서 가져온다. `src/spaces/building.ts`는 이 관계를 내보내고 바닥이나 문 mesh를 복제하지 않는다.

| 접점 ID | 건물 측 연결과 위치 | 접면의 유효 범위 | 외부에서 들어오는 방향 |
| --- | --- | --- | --- |
| contact-temple-public | exterior→entrance; 정문 축 X=0, Z=south-outer의 계단 하단 발치 | [현관 계단](rooms/entrance.md#entrance-volume)의 폭, 층 owner의 정문 도로 높이 | -Z; 두 단을 거쳐 상부참과 door-entry로 연결 |
| contact-temple-service | exterior→service-yard; X=east-outer, Z는 door-service-exterior의 중심 | [외부 서비스 문](openings.md#doors)의 틀을 제외한 유효 폭, 층 owner의 서비스 외부 높이 | -X; 외벽 두께를 관통하는 문턱에서 마당으로 연결 |

정문 접점의 높이는 계단의 하단 발치를 받는 외부 바닥 높이다. 이 높이를 상부참에 복사해 계단을 없애거나, 서비스 문 앞에도 복사해 의도하지 않은 단차를 만들지 않는다. 접면의 평면 일치는 [기준선 허용 오차](#plan-datums)로, 서비스 문턱은 [마당의 단차 한계](rooms/service-yard.md#yard-volume)로 비교한다. 문은 양방향 통과를 검사하며 위 방향은 진입 순서를 표시한다. 경계석·배수 홈·식생·문짝이 유효 접면을 막는지도 실제 통행 포락으로 확인한다.

외부 지면·길·대지 경계 및 world→site의 명명된 접근 노드는 후속 maps가 소유한다. maps는 이 두 건물 접점을 소비해 정문 도로와 서비스 접근의 서로 다른 높이를 잇는 지면을 결정해야 한다. 현재는 maps가 활성화되지 않았고 채택한 대지 경계·외부 노드·종단면도 없다. 따라서 이 접점 설계만으로 world→site→building 접근이나 대지 배치를 완료했다고 하지 않는다. [통행](circulation.md)의 경로 시작은 이 건물 측 접점이고, 외부 구간을 포함한 왕복·접지 검사는 [관찰](observations.md#geometry-observations)에 미완료로 남긴다.

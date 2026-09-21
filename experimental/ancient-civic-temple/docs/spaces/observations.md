# topology에서 파생할 공간 관찰

## 전체 경계와 공간의 관찰 {#geometry-observations}

[관찰 계약](../contracts/obligations-spaces.md#compiled-observations)과 [검토 프레임](../settings/00-delivery.md#review-condition)을 그대로 소비한다. 입력은 한 generation의 실제 built environment와 lowering 산출물이며 viewer와 계측이 같은 값을 쓴다. `builtEnvironmentBuildingCensus`의 외피·지붕·처마 하부·모서리·외부 출입 population을 소비하되 내부 개구부는 별도 actual boundary/opening 전집합에서 더한다. 이 API의 현재 source를 읽은 설계이며 아직 실행 결과는 없다.

공간마다 실제 volume 내부의 threshold, 네 안쪽 모서리, 중심 네 방위를 만든다. `builtSpaceObservationStations`가 반환한 위치도 현재 공간 내부·렌즈 포락·near 비충돌인지 확인한다. 이 함수는 외접 상자 중심이 공간 밖이면 유효한 첫 cell의 꼭짓점 평균을 내부 기준점으로 택한다. 따라서 반환된 중심 네 방위만으로 주랑 전체를 읽었다고 판단하지 않는다. [주랑의 여섯 평면 영역](rooms/colonnade.md#ring-volume) 각각에서 실제 built cell과의 결속 및 내부 위치를 확인한 중심 네 방위, 합집합의 외측·내측·현관 notch 모서리를 더한다. 추가 cell의 계산 접면을 새 방 모서리로 세지 않는다.

기본 threshold 위치는 개구부 중심에서 공간 기준점 쪽으로 이동해 내부 점을 찾는다. 구멍 있는 주랑에서는 같은 공간 내부라는 사실만으로 해당 문 바로 안쪽의 도착을 보여 준다고 할 수 없다. 실제 opening ID·boundary face와 관찰 위치의 관계를 읽어 문턱 쪽에 서는지 별도로 확인하고 필요한 보조 관찰을 추가한다. 반환 불가/null이나 충돌한 원 질문은 지우지 않고 unverified로 남겨 자기 공간 안 가장 가까운 유효 보조 위치와 함께 표시한다. 모든 공간의 개구부 양면도 누락하지 않는다.

[개구부 소유](openings.md#boundary-ownership)의 같은 boundary/opening ID마다 선언한 profile과 실제 벽 void의 위치·범위·관통 깊이를 대조한다. 바닥까지 열린 문 아래에 벽 띠가 남는지, 높은 창 위 박공이 외접 직사각형으로 메워졌는지, reveal 뒤에 중복 벽이 있는지를 문턱 종단면과 양면에서 확인한다. 닫힌 자세의 문짝 fitting과 열린 자세의 통과 영역도 같은 실제 element를 읽는다. `builtOpeningSweepEnvelope`는 두께 없는 panel 직사각형의 회전/이동을 감싸는 world 상자를 반환하므로 실제 문짝 두께·철물·손잡이의 swept 실체나 장애물 충돌 판정을 대신하지 않는다. 이 상자와 실제 mesh의 검토 범위를 구별하고, 전체 실체의 회전·통과를 재는 수단이 없거나 실행하지 않았다면 해당 질문은 unverified로 남긴다.

[문턱 바닥](storey.md#threshold-support)은 같은 opening ID의 host 깊이 전체를 포함한 종단면과 폭 방향 양끝에서 본다. 양쪽 바닥·문턱의 실제 mesh, support patch와 높이, 귀속 공간의 volume 및 connector를 대조해 빈 틈·중복 바닥·허공의 지지 선언을 구분한다. 외부 서비스 문도 마당의 문턱 끝과 외부 지면이 만나는 부분을 포함한다. 단순한 점 하나의 containment나 끝점 도달로 전체 발 디딤과 운반 포락의 연속성을 대신하지 않는다.

외부 setting 하나, 모든 노출 입면·입면 사이 모서리·노출 지붕·하부·개구부에 안정된 compiled ID를 부여한다. 단층 평면은 Y=1.2m 절단, 지붕 접합과 실내 높이는 문/용마루를 지나는 실제 종횡 단면으로 본다. 각 면의 법선·경계에서 관찰 pose를 유도하고 수동 대표 시점이 전집합을 덮었다고 가정하지 않는다. 카메라 위치·target·렌즈·현재 generation과 렌더 모드를 함께 보여 준다. source owner는 `src/spaces/observations.ts`이며 건물 geometry를 다시 만들지 않는다.

[벽 접합](junctions.md#wall-junctions)의 실제 L/T 접면과 [박공 폐쇄](junctions.md#gable-closures)의 경계 목록을 소비해 각 접합 단면·양면 관찰을 더한다. 물리벽끼리 맞닿는 내부 면과 외부에 노출된 면을 구별해 내부 접면을 마감 누락으로 세지 않는다. 특히 마당-보관실의 높은 끝벽과 주랑 위의 열린 지붕 접합을 서로 다른 경계로 관찰한다. 수평 도면만으로 지붕 위에 돌출한 벽 상단을 통과시키지 않는다.

[지붕 돌출](roofs/assembly.md#roof-junctions)은 합성 뒤 실제로 노출된 끝선에서 해당 외벽 바깥면 또는 중정 경계까지의 수평 거리와 그 끝 높이를 읽는다. 벽 중심 지지선부터의 거리나 합성에서 제거된 후보 끝으로 처마 길이를 대신하지 않는다. 포치 측면·외측 날개·남북 박공 끝과 중정 네 면의 처마를 각각 포함하며, 실제 roof/face ID와 참조면의 결속도 함께 읽는다.

[건물 접점](building.md#approach-contacts)의 두 ID마다 외부 지면부터 첫 내부 바닥까지의 종단면과 유효 폭을 본다. 정문은 계단 하단 발치→디딤 면→상부참, 서비스 문은 외부 지면→벽체 안 문턱→마당을 연속해서 읽고 왕복 포락을 확인한다. maps가 생기면 실제 대지 접근 노드에서 이 접점들까지의 외부 경로도 이어 읽는다. 현재 대지 경계와 노드, 두 외부 높이를 잇는 지면은 미정이므로 그 구간을 검토 목록에서 빼거나 건물 안 도달성으로 대체하지 않고 unverified로 남긴다.

입력 수량을 compiled 수량으로 복사하지 않는다. 아직 실제 census와 host/pose binding이 없으므로 관찰 수·도달성·모든 물리 접합은 unverified다. 다섯 reference의 외관·절개 검사·분수 중정·제실·기록/서비스 비교를 별도로 더하고 절개를 전달 프레임으로 세지 않는다.

## 원래 소스를 그리는 뷰어 {#viewer-path}

[CJS 경계](../settings/50-production.md#runtime-boundary)를 따른다. `src/viewer/server.cts`가 CJS 환경에서 생산 source와 공개 engine을 호출하고 현재 environment, 실제 mesh·transform·material, 같은 generation의 관찰 정보를 클라이언트로 전달하는 경로를 계획한다. 브라우저는 Node/engine 런타임을 import하지 않으며 실제 3D 원근·조명·그림자·깊이로 받은 geometry를 그린다. 건물을 client 데이터로 다시 만들지 않는다. 실행 코드는 src, HTML·스타일 자산은 public에 둔다.

서버 인자는 `--port`를 받고 기본 포트는 사용자 지정 4175다. 관찰 UI는 화면 밖의 한국어 공간·관찰 선택, 외관 궤도·확대·축소와 명시적 검사 모드를 갖는다. 라벨·경로·경계·절개는 기본 꺼짐이다. compilation 실패 시 이전 성공 화면을 남기지 않고 현재 오류를 보여 주며 그 상태를 정상 납품이라고 하지 않는다. 코드·의존성·시작 명령은 source 착수 시 package.json에 배정하고 서버 기동은 조정자가 한다. 2026-09-22 사용자 정정에 따라 의존성을 변경할 때는 저작자가 저장소 루트에서 `pnpm install`을 실행하고 production과 바뀐 `pnpm-lock.yaml`을 같은 커밋에 넣는다.

이 문서는 viewer 설계이고 실행 가능한 viewer나 시작 명령이 아직 아니다. source 진입의 부모 gate를 조정자에게 확인 중이며 우회 source 경로·임의 selector·ESM 전환을 사용하지 않는다. 실제 GPU 캡처, RENDERER, 빈 화면 여부, 모든 방의 reference 판독은 unverified다. 페이지가 생기면 실행 디렉터리·명령·포트·경로를 따로 인계한다.

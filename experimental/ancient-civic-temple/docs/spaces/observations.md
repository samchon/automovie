# topology에서 파생할 공간 관찰

## 전체 경계와 공간의 관찰 {#geometry-observations}

[관찰 계약](../contracts/obligations-spaces.md#compiled-observations)과 [검토 프레임](../settings/00-delivery.md#review-condition)을 그대로 소비한다. 입력은 한 generation의 실제 built environment와 lowering 산출물이며 viewer와 계측이 같은 값을 쓴다. `builtEnvironmentBuildingCensus`의 외피·지붕·처마 하부·모서리·외부 출입 population을 소비하되 내부 개구부는 별도 actual boundary/opening 전집합에서 더한다. 이 API의 현재 source를 읽은 설계이며 아직 실행 결과는 없다.

공간마다 실제 volume 내부의 threshold, 네 안쪽 모서리, 중심 네 방위를 만든다. `builtSpaceObservationStations`가 반환한 위치도 현재 공간 내부·렌즈 포락·near 비충돌인지 확인한다. 주랑은 외접 상자 중심이 구멍에 놓일 수 있으므로 여섯 cell 중심과 외측·내측·현관 notch의 모든 모서리를 추가한다. 반환 불가/null이나 충돌한 원 질문은 지우지 않고 unverified로 남겨 자기 공간 안 가장 가까운 유효 보조 위치와 함께 표시한다. 모든 공간의 개구부 양면도 누락하지 않는다.

외부 setting 하나, 모든 노출 입면·입면 사이 모서리·노출 지붕·하부·개구부에 안정된 compiled ID를 부여한다. 단층 평면은 Y=1.2m 절단, 지붕 접합과 실내 높이는 문/용마루를 지나는 실제 종횡 단면으로 본다. 각 면의 법선·경계에서 관찰 pose를 유도하고 수동 대표 시점이 전집합을 덮었다고 가정하지 않는다. 카메라 위치·target·렌즈·현재 generation과 렌더 모드를 함께 보여 준다. source owner는 `src/spaces/observations.ts`이며 건물 geometry를 다시 만들지 않는다.

[벽 접합](junctions.md#wall-junctions)의 실제 L/T 접면과 [박공 폐쇄](junctions.md#gable-closures)의 경계 목록을 소비해 각 접합 단면·양면 관찰을 더한다. 물리벽끼리 맞닿는 내부 면과 외부에 노출된 면을 구별해 내부 접면을 마감 누락으로 세지 않는다. 특히 마당-보관실의 높은 끝벽과 주랑 위의 열린 지붕 접합을 서로 다른 경계로 관찰한다. 수평 도면만으로 지붕 위에 돌출한 벽 상단을 통과시키지 않는다.

[건물 접점](building.md#approach-contacts)의 두 ID마다 외부 지면부터 첫 내부 바닥까지의 종단면과 유효 폭을 본다. 정문은 계단 하단 발치→디딤 면→상부참, 서비스 문은 외부 지면→벽체 안 문턱→마당을 연속해서 읽고 왕복 포락을 확인한다. maps가 생기면 실제 대지 접근 노드에서 이 접점들까지의 외부 경로도 이어 읽는다. 현재 대지 경계와 노드, 두 외부 높이를 잇는 지면은 미정이므로 그 구간을 검토 목록에서 빼거나 건물 안 도달성으로 대체하지 않고 unverified로 남긴다.

입력 수량을 compiled 수량으로 복사하지 않는다. 아직 실제 census와 host/pose binding이 없으므로 관찰 수·도달성·모든 물리 접합은 unverified다. 다섯 reference의 외관·절개 검사·분수 중정·제실·기록/서비스 비교를 별도로 더하고 절개를 전달 프레임으로 세지 않는다.

## 원래 소스를 그리는 뷰어 {#viewer-path}

[CJS 경계](../settings/50-production.md#runtime-boundary)를 따른다. `src/viewer/server.cts`가 CJS 환경에서 생산 source와 공개 engine을 호출하고 현재 environment, 실제 mesh·transform·material, 같은 generation의 관찰 정보를 클라이언트로 전달하는 경로를 계획한다. 브라우저는 Node/engine 런타임을 import하지 않으며 실제 3D 원근·조명·그림자·깊이로 받은 geometry를 그린다. 건물을 client 데이터로 다시 만들지 않는다. 실행 코드는 src, HTML·스타일 자산은 public에 둔다.

서버 인자는 `--port`를 받고 기본 포트는 사용자 지정 4175다. 관찰 UI는 화면 밖의 한국어 공간·관찰 선택, 외관 궤도·확대·축소와 명시적 검사 모드를 갖는다. 라벨·경로·경계·절개는 기본 꺼짐이다. compilation 실패 시 이전 성공 화면을 남기지 않고 현재 오류를 보여 주며 그 상태를 정상 납품이라고 하지 않는다. 코드·의존성·시작 명령은 source 착수 시 package.json에 배정하고 서버 기동은 조정자가 한다. 2026-09-22 사용자 정정에 따라 의존성을 변경할 때는 저작자가 저장소 루트에서 `pnpm install`을 실행하고 production과 바뀐 `pnpm-lock.yaml`을 같은 커밋에 넣는다.

이 문서는 viewer 설계이고 실행 가능한 viewer나 시작 명령이 아직 아니다. source 진입의 부모 gate를 조정자에게 확인 중이며 우회 source 경로·임의 selector·ESM 전환을 사용하지 않는다. 실제 GPU 캡처, RENDERER, 빈 화면 여부, 모든 방의 reference 판독은 unverified다. 페이지가 생기면 실행 디렉터리·명령·포트·경로를 따로 인계한다.

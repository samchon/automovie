# topology에서 파생할 공간 관찰

## 전체 경계와 공간의 관찰 {#geometry-observations}

[관찰 계약](../contracts/obligations-spaces.md#compiled-observations)과 [검토 프레임](../settings/00-delivery.md#review-condition)을 그대로 소비한다. 입력은 한 generation의 실제 built environment와 lowering 산출물이며 viewer와 계측이 같은 값을 쓴다. `builtEnvironmentBuildingCensus`의 외피·지붕·처마 하부·모서리·외부 출입 population을 소비하되 내부 개구부는 별도 actual boundary/opening 전집합에서 더한다. 이 API의 현재 source를 읽은 설계이며 아직 실행 결과는 없다.

공간마다 실제 volume 내부의 threshold, 네 안쪽 모서리, 중심 네 방위를 만든다. `builtSpaceObservationStations`가 반환한 위치도 현재 공간 내부·렌즈 포락·near 비충돌인지 확인한다. 이 함수는 외접 상자 중심이 공간 밖이면 유효한 첫 cell의 꼭짓점 평균을 내부 기준점으로 택한다. 따라서 반환된 중심 네 방위만으로 주랑 전체를 읽었다고 판단하지 않는다. [주랑의 여섯 평면 영역](rooms/colonnade.md#ring-volume) 각각에서 실제 built cell과의 결속 및 내부 위치를 확인한 중심 네 방위, 합집합의 외측·내측·현관 notch 모서리를 더한다. 추가 cell의 계산 접면을 새 방 모서리로 세지 않는다.

기본 함수의 높이는 `bounds.min.y + min(1.6, volume 높이/2)`이며 그 점이 공간 밖이면 다른 높이의 내부 기준점으로 돌아갈 수도 있다. 각 필수 중심 관찰은 [설정의 눈높이](../settings/00-delivery.md#review-condition)인 해당 위치의 실제 바닥 위 1.6m와 별도로 대조한다. 함수의 반환 높이가 다르면 원래 값을 기록하고, 실제 volume과 장비 포락 안에서 요구 높이의 pose를 유도한다. 관찰 함수에 맞추려고 낮은 천장의 volume을 늘리거나 지지 바닥을 올리지 않는다. 요구 위치가 충돌하면 원 질문을 unverified로 유지하고 기존 규칙대로 보조 관찰을 더한다.

[중정](rooms/courtyard.md#court-volume)과 [서비스 마당](rooms/service-yard.md#yard-volume)의 위쪽 cell 평면은 유한한 논리 범위이며 물리 천장이 아니다. 실제 공간 bounds와 서비스 마당의 두 문턱을 포함한 귀속을 확인하고, 하늘을 가리는 mesh나 그림자·support patch가 그 평면에서 생성되지 않았는지도 본다. 공간 안 시점에서도 논리 상한이 시선·조명·화면을 잘라 하늘이나 높은 지붕을 숨기지 않아야 한다. 처마 하부와 하늘의 노출 여부는 실제 roof/element에서 읽는다. 논리 bounds만으로 열린 하늘이나 유효 높이 검증을 완료하지 않는다.

기본 threshold 위치는 개구부 중심에서 공간 기준점 쪽으로 이동해 내부 점을 찾는다. 구멍 있는 주랑에서는 같은 공간 내부라는 사실만으로 해당 문 바로 안쪽의 도착을 보여 준다고 할 수 없다. 실제 opening ID·boundary face와 관찰 위치의 관계를 읽어 문턱 쪽에 서는지 별도로 확인하고 필요한 보조 관찰을 추가한다. 반환 불가/null이나 충돌한 원 질문은 지우지 않고 unverified로 남겨 자기 공간 안 가장 가까운 유효 보조 위치와 함께 표시한다. 모든 공간의 개구부 양면도 누락하지 않는다.

[개구부 소유](openings.md#boundary-ownership)의 같은 boundary/opening ID마다 선언한 profile과 실제 벽 void의 위치·범위·관통 깊이를 대조한다. 바닥까지 열린 문 아래에 벽 띠가 남는지, 높은 창 위 박공이 외접 직사각형으로 메워졌는지, reveal 뒤에 중복 벽이 있는지를 문턱 종단면과 양면에서 확인한다. 닫힌 자세의 문짝 fitting과 열린 자세의 통과 영역도 같은 실제 element를 읽는다. `builtOpeningSweepEnvelope`는 두께 없는 panel 직사각형의 회전/이동을 감싸는 world 상자를 반환하므로 실제 문짝 두께·철물·손잡이의 swept 실체나 장애물 충돌 판정을 대신하지 않는다. 이 상자와 실제 mesh의 검토 범위를 구별하고, 전체 실체의 회전·통과를 재는 수단이 없거나 실행하지 않았다면 해당 질문은 unverified로 남긴다.

[문턱 바닥](storey.md#threshold-support)은 같은 opening ID의 host 깊이 전체를 포함한 종단면과 폭 방향 양끝에서 본다. 양쪽 바닥·문턱의 실제 mesh, support patch와 높이, 귀속 공간의 volume 및 connector를 대조해 빈 틈·중복 바닥·허공의 지지 선언을 구분한다. 외부 서비스 문도 마당의 문턱 끝과 외부 지면이 만나는 부분을 포함한다. 단순한 점 하나의 containment나 끝점 도달로 전체 발 디딤과 운반 포락의 연속성을 대신하지 않는다.

외부 setting 하나, 모든 노출 입면·입면 사이 모서리·노출 지붕·하부·개구부에 안정된 compiled ID를 부여한다. 단층 평면은 Y=1.2m 절단, 지붕 접합과 실내 높이는 문/용마루를 지나는 실제 종횡 단면으로 본다. 각 면의 법선·경계에서 관찰 pose를 유도하고 수동 대표 시점이 전집합을 덮었다고 가정하지 않는다. 카메라 위치·target·렌즈·현재 generation과 렌더 모드를 함께 보여 준다. source owner는 `src/spaces/observations.ts`이며 건물 geometry를 다시 만들지 않는다.

[벽 접합](junctions.md#wall-junctions)의 실제 L/T 접면과 [박공 폐쇄](junctions.md#gable-closures)의 경계 목록을 소비해 각 접합 단면·양면 관찰을 더한다. 물리벽끼리 맞닿는 내부 면과 외부에 노출된 면을 구별해 내부 접면을 마감 누락으로 세지 않는다. 특히 마당-보관실의 높은 끝벽과 주랑 위의 열린 지붕 접합을 서로 다른 경계로 관찰한다. 수평 도면만으로 지붕 위에 돌출한 벽 상단을 통과시키지 않는다.

[지붕 돌출](roofs/assembly.md#roof-junctions)은 합성 뒤 실제로 노출된 끝선에서 해당 외벽 바깥면 또는 중정 경계까지의 수평 거리와 그 끝 높이를 읽는다. 벽 중심 지지선부터의 거리나 합성에서 제거된 후보 끝으로 처마 길이를 대신하지 않는다. 포치 측면·외측 날개·남북 박공 끝과 중정 네 면의 처마를 각각 포함하며, 실제 roof/face ID와 참조면의 결속도 함께 읽는다.

[건물 접점](building.md#approach-contacts)의 두 ID마다 외부 지면부터 첫 내부 바닥까지의 종단면과 유효 폭을 본다. 정문은 계단 하단 발치→디딤 면→상부참, 서비스 문은 외부 지면→벽체 안 문턱→마당을 연속해서 읽고 왕복 포락을 확인한다. maps가 생기면 실제 대지 접근 노드에서 이 접점들까지의 외부 경로도 이어 읽는다. 현재 대지 경계와 노드, 두 외부 높이를 잇는 지면은 미정이므로 그 구간을 검토 목록에서 빼거나 건물 안 도달성으로 대체하지 않고 unverified로 남긴다.

[현관 단면](rooms/entrance.md#entrance-volume)은 중앙축과 계단 양끝, 기둥 받침을 지나는 평행 단면을 함께 읽는다. 실제 두 챌면의 수·위치·높이, 둘째 디딤과 참의 동고 접합, 각 수평 면의 support와 `entrance` cell 아래 경계를 대조한다. 논리 공간이 석단 안으로 내려가거나 경사 support가 디딤을 덮는지, 기둥이 서로 다른 높이의 단에 걸치는지도 확인한다. 관찰 눈높이는 공간 bounds의 최저점이 아니라 해당 위치의 실제 완성면에서 잰다. 이 모두는 현재 설계 질문이며 계단 실체와 접지 결과는 unverified다.

[외벽 하단](storey.md#wall-ground-contact)은 실제 외부 지면의 최저 접촉 높이와 인접 완성 바닥, 벽 하단·슬래브 아랫면을 같은 단면에서 읽는다. 네 입면·모서리·현관 후퇴부·서비스 문턱의 지면 접합을 모두 포함하며 지면 위 그림자만으로 접촉했다고 세지 않는다. 문 아래 벽 띠 검사는 실제 보행 완성면 위의 통과 영역을 대상으로 하고, 문턱 아래의 벽 지지 부분과 구별한다. maps의 지면이 없으면 접촉 최저점과 매입량을 대신 계산하거나 검사에서 빼지 않고 unverified로 남긴다.

입력 수량을 compiled 수량으로 복사하지 않는다. 아직 실제 census와 host/pose binding이 없으므로 관찰 수·도달성·모든 물리 접합은 unverified다. 다섯 reference의 외관·절개 검사·분수 중정·제실·기록/서비스 비교를 별도로 더하고 절개를 전달 프레임으로 세지 않는다.

## 원래 소스를 그리는 뷰어 {#viewer-path}

[CJS 경계](../settings/50-production.md#runtime-boundary)를 따른다. `src/viewer/server.cts`가 CJS 환경에서 생산 source와 공개 engine을 호출하고 현재 environment, 실제 mesh·transform·material, 같은 generation의 관찰 정보를 클라이언트로 전달하는 경로를 계획한다. 브라우저는 Node/engine 런타임을 import하지 않으며 실제 3D 원근·조명·그림자·깊이로 받은 geometry를 그린다. 건물을 client 데이터로 다시 만들지 않는다. 실행 코드는 src, HTML·스타일 자산은 public에 둔다.

서버는 같은 environment를 공개 `lowerBuiltEnvironment`에 전달해 현재 문짝 상태와 부모·자식 변환이 반영된 element 배치를 얻고, 원래 environment는 공간·경계·개구부 계측에 함께 사용한다. lowering의 `set`은 실제 model이 결속된 element의 world 배치이며 경계 선언에서 벽이나 지붕을 생성하는 기능이 아니다. 따라서 건물의 보이는 실체는 [표면 소유](ownership.md#surface-map)에 배정된 source가 실제 element/model로 공급한다. 논리 volume·boundary·외접 상자를 그 실체로 대체하지 않는다.

전달은 node·element·model·part의 식별 관계와 geometry, 재료 결속을 보존한다. primitive는 서버 쪽 공개 tessellation으로 삼각형 데이터를 얻고, explicit mesh는 원본 positions·normals·UV·색·indices와 각 속성의 부재를 보존한다. `tessellateToMesh`의 UV는 `null`이므로 텍스처 좌표가 생겼다고 간주하지 않는다. 필요한 UV는 geometry와 materials의 소유자가 준비하며 전달자가 임의 좌표를 덧씌우지 않는다. element의 world 변환과 model part의 local 변환은 서로 다른 값으로 유지하고, 같은 변환을 정점과 node 양쪽에 중복 적용하지 않는다. model 내부 재료와 전체 model population에서 찾는 재료를 구별하며, 결속된 재료를 찾지 못한 경우 다른 색의 기본 재료로 성공 화면을 만들지 않는다.

support patch는 발 디딤과 계측의 선언이며 기본 화면의 물리 바닥이 아니다. 바닥·계단·지면은 실제 authored geometry로 그린다. support와 논리 경계는 명시적 검사 모드에서만 구별해 표시하고, 기본 화면의 색·깊이·그림자에 참여시켜 빠진 구조체를 가리지 않는다. 낮은 마당의 논리 상한도 같은 이유로 하늘을 막는 면으로 만들지 않는다. 기존 viewer helper 중 engine을 runtime import하는 경로는 브라우저에서 직접 사용하지 않으며, 서버 산출물을 소비하는 렌더 코드가 이 모듈 경계를 지킨다.

반복 population이 추가되면 lowering이 돌려주는 authored `IAutoMovieInstanceSetDesign`과 실제 compiled 반복 산출물을 구별한다. 반복 소유자의 같은 규칙·입력에서 나온 prototype와 배치 결과를 전달하며, 화면 쪽에서 기둥·기와 개수나 간격을 다시 정하지 않는다. 아직 컴파일하지 않은 set을 compiled 수량으로 보고하거나 전송하지 못한 반복을 조용히 빼지 않는다. viewer·관찰·계측은 동일한 현재 generation을 소비하고, 전송용 값은 런타임 전달에만 쓰며 별도 JSON 프로젝트 저장소로 기록하지 않는다.

서버 인자는 `--port`를 받고 기본 포트는 사용자 지정 4175다. 관찰 UI는 화면 밖의 한국어 공간·관찰 선택, 외관 궤도·확대·축소와 명시적 검사 모드를 갖는다. 라벨·경로·경계·절개는 기본 꺼짐이다. compilation 실패 시 이전 성공 화면을 남기지 않고 현재 오류를 보여 주며 그 상태를 정상 납품이라고 하지 않는다. 코드·의존성·시작 명령은 source 착수 시 package.json에 배정하고 서버 기동은 조정자가 한다. 2026-09-22 사용자 정정에 따라 의존성을 변경할 때는 저작자가 저장소 루트에서 `pnpm install`을 실행하고 production과 바뀐 `pnpm-lock.yaml`을 같은 커밋에 넣는다.

이 문서는 viewer 설계이고 실행 가능한 viewer나 시작 명령이 아직 아니다. spaces는 draft이며 source 진입은 spaces의 독립 판정과 review 단계 조건을 따른다. 우회 source 경로·임의 selector·ESM 전환을 사용하지 않는다. 공개 API를 읽은 위 설계도 실제 CJS 로딩·전송·GPU 실행 성공의 증거가 아니다. 실제 GPU 캡처, RENDERER, 빈 화면 여부, 모든 방의 reference 판독은 unverified다. 페이지가 생기면 실행 디렉터리·명령·포트·경로를 따로 인계한다.

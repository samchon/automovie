# topology에서 파생할 공간 관찰

## 전체 경계와 공간의 관찰 {#geometry-observations}

<!--
@evidence principles/core/common.md#scope-preservation 실제 외피/개구부 전집합과 각 공간 내부 관찰에 고리 주랑·단차·지붕 골과 파라펫·제실 처마 아래·지면 접합 및 다섯 reference 질문을 더하고 실패한 질문을 지우지 않는다.
@evidence principles/core/common.md#substantive-completion census와 실제 opening/volume을 입력으로 한 pose 유도, census가 비운 지붕·처마 하부의 보충, 내부성·눈높이·충돌 대조, 원 질문과 보조 관찰의 보존 규칙을 정한다.
@evidence principles/core/common.md#declared-basis 설정의 검토 조건과 compiled-observations를 소비하며 API 기본 위치·높이·sweep 상자와 census의 지붕 공백을 실제 geometry 측정과 구분한다.
@evidence principles/design/spaces.md#space-topology 주랑의 중정 구멍·현관 몸체·문 도착면과 열린 마당의 논리 cap을 구별해 방 밖 위치나 계산 접면으로 내부 관찰을 대체하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 현재 environment와 lowering의 같은 ID/binding을 읽고 입력 수량이나 별도 화면 좌표를 compiled 목록으로 복사하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 벽 void·문턱·L/T 접합·파라펫 띠·박공·네 골·높이 차이 끝면·제실 처마 아래·외벽 접지를 각각 actual 단면/면 관계와 연결하고 수단이 없으면 unverified로 남긴다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모의 관찰 조건을 이 신전의 구멍 있는 주랑, 현관 계단, 중정 네 골과 떠 있는 제실 처마, 마당 두 threshold에서 반증할 구체 질문으로 확장한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work review-condition의 바닥 위 1.6m·내부 렌즈 조건을 기본 API 반환과 비교했다. API가 다른 높이를 줄 수 있다는 사실은 원 질문을 보존하고 보조 pose를 유도하는 공간 관찰 설계로 처리하며 부모 눈높이를 낮추지 않았다.
@evidence settings/00-delivery.md#review-condition API 기본 pose를 실제 바닥 위 요구 눈높이와 장비 포락에 대조하고 충돌한 원 질문도 미해결로 남긴다.
@evidence settings/00-delivery.md#governing-aim 대표 구도만 남기지 않고 모든 공간/경계 질문에 다섯 reference의 같은 건물·방 정체성 비교를 더한다.
@evidence settings/50-production.md#references 외관·절개 검사·분수 중정·제실·기록/서비스 비교는 topology 관찰 전집합을 대신하지 않는 추가 질문이다.
@evidence settings/50-production.md#measurement-truth census·거리·binding과 프레임의 역할을 분리하고 실제 실행 없는 수량/통과/접지를 unverified로 남긴다.
@evidence settings/50-production.md#acceptance 절개를 전달 프레임으로 세지 않고 원 질문이 남은 상태를 시각 완료로 선언하지 않는다.
@evidence obligations/design/spaces.md#space-review-set 현재 topology에서 유한한 외부/내부 관찰을 유도하고 각 접합·문·이동 포락의 반증 위치를 배정한다.
@evidence contracts/obligations-spaces.md#compiled-observations 외부 setting·전 입면/모서리/roof/하부/개구부와 각 공간 threshold/모서리/네 방위를 보존하며 오목한 주랑에는 추가 내부 관찰을 더한다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 주랑 안쪽·현관 모서리와 접합·단면, 여섯 수평·반환벽 네 경사 상부, 포치 자유 끝 두 면, 16개 opening-facing 및 다섯 reference 질문을 함께 보존한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 문·창 16개의 profile 높이·host 법선·0.1m 탐색·0.3m 물림·50° 거리식, 열 상부와 두 포치 자유 끝의 카메라 위치, 네 종횡 단면을 각각 정한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 도착 threshold와 반대 방향의 opening-facing을 구별하고 창의 네 꼭짓점 절두체를 잰다. 천장·경계석 없는 단면 payload와 대각 골의 X/Z 단면 한계를 밝힌다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 중정 구멍·현관 notch 안쪽 여섯 모서리를 추가하고 창은 제실 내부에서 자기 창을 본다. 반환벽 상부와 두 자유 끝은 새 방 없이 기존 공간에 결속한다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 현재 generation의 census와 opening ID를 소비한다. 열 상부 및 포치 자유 끝 두 면의 결속은 openings#boundary-ownership을 따르고 관찰은 새 벽을 만들지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 문턱·박공·처마·접합·외벽 하단과 반환벽 상부·자유 끝을 compiled 질문으로 본다. 대각 골 전체와 단면 payload 밖 부재는 unverified로 남긴다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 네 방위·외부 읽기를 안쪽 주랑 모서리, 현관 notch, 네 골, 제실 처마, 열 상부·두 포치 자유 끝 및 X=0·Z=-6.9·Z=3.7·X=7.36 단면으로 넓힌다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 opening-facing은 profile 높이지만 필수 중심·모서리 station은 support 위 1.6m다. 포치 자유 끝 카메라도 보조 입면 질문이고 충돌 원 질문을 삭제하지 않는다.
@evidenceReview settings/00-delivery.md#review-condition #6daf6ae 필수 방·대지 station은 바닥 위 1.6m, 창·문 검사용 별도 pose는 profile 중심 높이다. 포치 자유 끝도 실체 안 시점을 검사해 필수 내부 station의 대체로 삼지 않는다.
@evidenceReview settings/00-delivery.md#governing-aim #df3c7b2 다섯 reference pose를 공간·경계 전집합에 더하고, 반환벽의 경사 상부와 포치 자유 끝 및 각 opening-facing을 개별 반증 질문으로 둔다.
@evidenceReview settings/50-production.md#references #eb34a79 `reference` 01~05 질문은 마지막 문단에 있으며 02는 지붕·천장을 숨긴 검사다. opening-facing 16개·상부 열 곳·포치 자유 끝 둘은 별도 compiled 질문이다.
@evidenceReview settings/50-production.md#measurement-truth #c6e89a8 0.01m 스캔은 겹침과 모든 pose의 실체 내부 여부, 절두체는 창 profile의 포함만 잰다. 공간 정체성·재료 읽힘, 대각 골 및 빠진 천장·경계석 단면은 따로 unverified다.
@evidenceReview settings/50-production.md#acceptance #2c49b7f 다섯 reference에 더해 대각 골·천장·경계석·충돌 원 질문을 유지한다. 반환벽의 새 두 자유 끝 입면도 시각 완료 전의 질문으로 남긴다.
@evidenceReview obligations/design/spaces.md#space-review-set #86bcab4 Y=1.2m 평면·네 종횡 단면에 문턱·박공·처마·외벽 하단·반환벽 상부 열 곳과 자유 끝 둘을 더하며 방의 threshold·모서리·방위도 유지한다.
@evidenceReview contracts/obligations-spaces.md#compiled-observations #09b52ea 노출 면에 여섯 수평 상부·반환벽 네 경사 상부·두 포치 자유 끝·제실 창을 포함한다. 공간별 원 질문, opening-facing 16개, 주랑 추가 모서리 여섯, reference 다섯을 따로 보존한다.
-->

[관찰 계약](../contracts/obligations-spaces.md#compiled-observations)과 [검토 프레임](../settings/00-delivery.md#review-condition)을 그대로 소비한다. 입력은 한 generation의 실제 built environment와 lowering 산출물이며 viewer와 계측이 같은 값을 쓴다. `builtEnvironmentBuildingCensus`의 외피·지붕·처마 하부·모서리·외부 출입 population을 소비하되 내부 개구부는 별도 actual boundary/opening 전집합에서 더한다. 이 census는 host face를 가진 단일 공간 경계만 입면으로 세며 지붕은 경계 face가 아니어서 지붕·처마 하부 population이 비므로, 네 방향 지붕 조감과 네 입면의 처마 하부 관찰을 source owner가 별도로 더한다.

공간마다 실제 volume 내부의 threshold, 네 안쪽 모서리, 중심 네 방위를 만든다. `builtSpaceObservationStations`가 반환한 위치도 현재 공간 내부·렌즈 포락·near 비충돌인지 확인한다. 이 함수는 외접 상자 중심이 공간 밖이면 유효한 첫 cell의 꼭짓점 평균을 내부 기준점으로 택한다. 따라서 반환된 중심 네 방위만으로 주랑 전체를 읽었다고 판단하지 않는다. [주랑의 여섯 평면 영역](rooms/colonnade.md#ring-volume) 각각에서 실제 built cell과의 결속 및 내부 위치를 확인한 중심 네 방위, 합집합의 외측·내측·현관 몸체 모서리를 더한다. 엔진이 돌려주는 네 모서리는 외접 상자 근처의 외측 모서리이므로 중정 쪽 안쪽 모서리 네 곳과 현관 몸체의 서·동 모서리 두 곳은 source가 각 모서리에서 주랑 쪽으로 1.05m 떨어진 눈높이 pose로 따로 세운다. 추가 cell의 계산 접면을 새 방 모서리로 세지 않는다.

기본 함수의 높이는 `bounds.min.y + min(1.6, volume 높이/2)`이며 그 점이 공간 밖이면 다른 높이의 내부 기준점으로 돌아갈 수도 있다. 각 필수 중심 관찰은 [설정의 눈높이](../settings/00-delivery.md#review-condition)인 해당 위치의 실제 바닥 위 1.6m와 별도로 대조한다. 함수의 반환 높이가 다르면 원래 값을 기록하고, 실제 volume과 장비 포락 안에서 요구 높이의 pose를 유도한다. 관찰 함수에 맞추려고 낮은 천장의 volume을 늘리거나 지지 바닥을 올리지 않는다. 요구 위치가 충돌하면 원 질문을 unverified로 유지하고 기존 규칙대로 보조 관찰을 더한다.

[중정](rooms/courtyard.md#court-volume)과 [서비스 마당](rooms/service-yard.md#yard-volume)의 위쪽 cell 평면은 유한한 논리 범위이며 물리 천장이 아니다. 실제 공간 bounds와 서비스 마당의 두 문턱을 포함한 귀속을 확인하고, 하늘을 가리는 mesh나 그림자·support patch가 그 평면에서 생성되지 않았는지도 본다. 공간 안 시점에서도 논리 상한이 시선·조명·화면을 잘라 하늘이나 높은 지붕을 숨기지 않아야 한다. 처마 하부와 하늘의 노출 여부는 실제 roof/element에서 읽는다. 논리 bounds만으로 열린 하늘이나 유효 높이 검증을 완료하지 않는다.

기본 threshold 위치는 개구부 중심에서 공간 기준점 쪽으로 이동해 내부 점을 찾으며 시선은 실내 도착 방향이다. 구멍 있는 주랑에서는 같은 공간 내부라는 사실만으로 해당 문 바로 안쪽의 도착을 보여 준다고 할 수 없다. 실제 opening ID·boundary face와 관찰 위치의 관계를 읽어 문턱 쪽에 서는지 별도로 확인한다. 창 threshold 여덟은 자기 창이 카메라 뒤에 있으므로 창 판독의 증거로 세지 않는다. 별도 `opening-facing` 관찰은 모든 문·창 16개 각각의 실제 host profile 중심을 자기 방 안에서 바라본다. 문과 창의 시점 높이는 해당 profile 중심이며 제실 창은 높은 창 중심까지 방 안 시점을 올려 수평으로 바라본다. host 법선 중 방 중심 station을 향하는 쪽에서 0.1m 간격으로 자기 공간 안의 가장 먼 유효점을 찾고, 먼 벽에서 `min(0.3m, 유효 거리/2)`만큼 물린다. 그 한도 안에서 profile 높이 `h`에 대한 수직 50° 화면의 70% 맞춤 거리 `max(2m, h/(1.4×tan25°))`를 목표로 한다. 이는 문 pose의 거리나 높이를 source가 다시 고르지 않게 하고 바닥 위 1.6m인 필수 중심·모서리 관찰을 대체하지 않는다. 제실 창 여덟은 profile 네 꼭짓점까지 뷰어의 50° 수직 시야·1600:1000 비율 안에 드는지 전수 검산한다. 반환 불가/null이나 충돌한 원 질문은 지우지 않고 unverified로 남겨 자기 공간 안 가장 가까운 유효 보조 위치와 함께 표시한다. 모든 공간의 개구부 양면도 누락하지 않는다. [개구부 소유](openings.md#boundary-ownership)가 나눈 노출 위쪽 경계 열 곳(일정 높이 여섯, 반환벽 경사·바깥 각 둘)과 반환벽 포치 자유 끝 두 곳은 공간이 하나라 census의 입면과 외부 개구부 전집합에 든다. 지붕·마당 위에 있는 열 면은 다른 입면과 같은 맞춤 거리에서 면 중심보다 0.8m 높게 보고, 포치 자유 끝 둘은 맞닿은 남측 벽 실체 반대편 대신 열린 포치 중심선에서 본다. 제실 창 여덟은 모두 창 바깥 2.5m에서 창 중심보다 0.6m 높게 본다. 이전 결속이 봉헌실과 주랑 안에 만든 창 threshold 네 곳은 창을 보여 주지 않는 무효 위치였으므로 목록에서 지우지 않고 pose 없는 unverified 항목으로 남긴다.

[개구부 소유](openings.md#boundary-ownership)의 같은 boundary/opening ID마다 선언한 profile과 실제 벽 void의 위치·범위·관통 깊이를 대조한다. 바닥까지 열린 문 아래에 벽 띠가 남는지, 높은 창 위 박공이 외접 직사각형으로 메워졌는지, reveal 뒤에 중복 벽이나 기둥 사이 내부 접면이 드러나는지를 문턱 종단면과 양면에서 확인한다. 닫힌 자세의 문짝 fitting과 열린 자세의 통과 영역도 같은 실제 element를 읽는다. `builtOpeningSweepEnvelope`는 두께 없는 panel 직사각형의 회전/이동을 감싸는 world 상자를 반환하므로 실제 문짝 두께·철물·손잡이의 swept 실체나 장애물 충돌 판정을 대신하지 않는다. 이 상자와 실제 mesh의 검토 범위를 구별하고, 전체 실체의 회전·통과를 재는 수단이 없거나 실행하지 않았다면 해당 질문은 unverified로 남긴다.

[문턱 바닥](storey.md#threshold-support)은 같은 opening ID의 host 깊이 전체를 포함한 종단면과 폭 방향 양끝에서 본다. 양쪽 바닥·문턱의 실제 mesh, support patch와 높이, 귀속 공간의 volume 및 connector를 대조해 빈 틈·중복 바닥·허공의 지지 선언을 구분한다. 외부 서비스 문도 마당의 문턱 끝과 외부 지면이 만나는 부분을 포함한다. 단순한 점 하나의 containment나 끝점 도달로 전체 발 디딤과 운반 포락의 연속성을 대신하지 않는다.

외부 setting 하나, 모든 노출 입면·입면 사이 모서리·노출 지붕·하부·개구부에 안정된 compiled ID를 부여한다. 단층 평면은 Y=1.2m 절단, 지붕 접합과 실내 높이는 문/용마루를 지나는 실제 종횡 단면으로 본다. 연직 단면은 뷰어의 단면 검사로 읽는다. 서버가 현재 벽·지붕·코핑·기단·바닥 외피 실체를 X 또는 Z 평면으로 잘라 보낸 조각을 정사영과 0.5m 격자로 보는 보기다. `model.ceilings`와 대지 경계석은 이 단면 payload에 포함하지 않으므로 그 부재의 단면이 검증됐다고 세지 않고 별도 3D 관찰은 unverified로 남긴다. source는 각 단면 질문을 `section` 묶음의 pose와 그 보기 설정으로 둔다. 종횡 단면은 X=0 종단면(정문·현관·중정·제실 문·제실 용마루·포치), Z=-6.9 제실 횡단면, Z=3.7 동측 날개 횡단면, X=7.36 동측 용마루 종단면이다. 각 면의 법선·경계에서 관찰 pose를 유도하고 수동 대표 시점이 전집합을 덮었다고 가정하지 않는다. 대지 `temple-site`는 공간 station 외에 [대지](site.md)의 각 H2가 요구한 구획 조감·정문 진입·동측 골목의 서비스 문·서측 골목 경사·먼 능선 시점을 `site` 묶음으로 더하고 눈높이는 대지 support 위 1.6m다. 카메라 위치·target·렌즈·현재 generation과 렌더 모드를 함께 보여 준다. source owner는 `src/spaces/observations.ts`와 분리된 `src/spaces/perimeter-observations.ts`이며 건물 geometry를 다시 만들지 않는다.

[벽 접합](junctions.md#wall-junctions)의 실제 L/T 접면과 [박공과 파라펫 폐쇄](junctions.md#gable-closures)의 경계 목록을 소비해 각 접합 단면·양면 관찰을 더한다. source는 `junction` 묶음으로 네 지붕 골, 제실 서·동·남 처마 아래와 봉헌실 파라펫 위를 지나는 제실 서쪽 처마, 서·북·남 파라펫과 지붕의 만남, 동측 박공 남쪽 용마루와 남측 코핑, 외곽 네 모서리의 코핑·기단 만남을 pose로 둔다. 연직 단면으로 읽는 접합은 `section` 묶음이 맡는다. 문 여덟의 문턱 종단면, 제실 북·남 박공과 동측 박공 두 끝·포치 앞뒤의 박공 끝 하부, 채광구 여덟, 날개 지붕의 높이 차이 끝면, 외곽 네 모서리의 L 접합, spine·제실 남벽·오른쪽 가로벽·현관 후퇴벽의 T 접합, 네 입면의 외벽 하단, 현관의 평행 단면 넷이다. 네 지붕 골은 평면에서 대각선이라 X/Z 연직 단면이 골선을 따라가지 못하므로 골 전 길이 단면만 pose 없이 그 이유를 적은 unverified 항목으로 남긴다. 벽·지붕·코핑·기단·바닥 실체의 양의 체적 겹침은 판정 요청 전마다 `npm run self-check`의 외피 겹침 전수 스캔(기본 0.01m 격자, 깊이 한계 0.001m)으로 재어 표본 수와 겹친 쌍의 수를 보고하며, 이 수치는 틈이나 단면의 시각 판독을 대신하지 않는다. 같은 검사는 관찰 pose 중 실체 안에 놓인 것도 세고 하나라도 있으면 실패다. 물리벽끼리 맞닿는 내부 면과 외부에 노출된 면을 구별해 내부 접면을 마감 누락으로 세지 않는다. 파라펫과 지붕의 만남은 전 구간에서 지붕 끝이 코핑 아래로 드러나거나 파라펫 뒤에 틈이 남는지 본다. 마당-보관실의 높은 끝벽과 주랑 위의 열린 지붕 접합을 서로 다른 경계로 관찰한다. 수평 도면만으로 지붕 위에 돌출한 벽 상단을 통과시키지 않는다.

[지붕 돌출](roofs/assembly.md#roof-junctions)은 합성 뒤 실제로 노출된 끝선에서 해당 외벽 바깥면 또는 중정 경계까지의 수평 거리와 그 끝 높이를 읽는다. 벽 중심 지지선부터의 거리나 합성에서 제거된 후보 끝으로 처마 길이를 대신하지 않는다. 중정 네 면의 처마, 동측 외벽 처마, 동측 박공과 북쪽 외쪽 지붕의 마당 쪽 끝, 제실 네 끝, 포치 앞끝을 각각 포함하며 실제 roof/face ID와 참조면의 결속도 함께 읽는다. source는 이 열두 끝을 `section` 묶음의 처마 돌출 단면으로 두고 끝선과 참조면을 같은 단면에서 읽게 한다.

[지붕 합성](roofs/assembly.md#roof-junctions)의 중정 네 안쪽 모서리 골은 골선 전 길이의 양쪽 단면에서 두 지붕 상면이 같은 선에서 만나고 하부도 닫히는지 본다. 날개 안의 높이 차이 끝면은 각 끝면을 지나는 연직 단면에서 높은 조각의 하부와 낮은 조각의 상면 사이가 막혔는지, [제실 처마](roofs/sanctuary.md#sanctuary-roof)는 아래 봉헌실·북쪽 주랑 지붕을 지우지 않고 떠 있는지와 그 사이가 제실 벽 외면으로 닫혀 실내로 새지 않는지를 확인한다. 한 대표 점 위에 지붕이 있다는 사실만으로 구간 전체를 통과시키지 않는다. 높은 처마 아래의 구멍이나 마당 전체를 덮어 메운 곳은 모두 실패다. 전체 면 관계를 측정할 수 없으면 해당 질문은 unverified로 남긴다.

[건물 접점](building.md#approach-contacts)의 두 ID마다 외부 지면부터 첫 내부 바닥까지의 종단면과 유효 폭을 본다. 정문은 계단 하단 발치→디딤 면→상부참, 서비스 문은 외부 지면→벽체 안 문턱→마당을 연속해서 읽고 왕복 포락을 확인한다. 대지 쪽은 [대지와 건물의 연결](site.md#site-connections)의 두 connector와 정면 거리·동측 골목 support에서 이어 읽는다. connector가 있다는 사실만으로 왕복 통과를 완료하지 않고 문짝·기둥이 들어온 뒤의 포락 검사까지 unverified로 남긴다.

[현관 단면](rooms/entrance.md#entrance-volume)은 중앙축과 계단 양끝, 기둥 받침을 지나는 평행 단면을 함께 읽는다. 실제 두 챌면의 수·위치·높이, 둘째 디딤과 참의 동고 접합, 각 수평 면의 support와 `entrance` cell 아래 경계를 대조한다. 논리 공간이 석단 안으로 내려가거나 경사 support가 디딤을 덮는지, 기둥이 서로 다른 높이의 단에 걸치는지도 확인한다. 관찰 눈높이는 공간 bounds의 최저점이 아니라 해당 위치의 실제 완성면에서 잰다. 계단 실체와 접지 결과는 source 단면과 GPU 관찰로 확인한다.

[외벽 하단](storey.md#wall-ground-contact)은 실제 외부 지면의 최저 접촉 높이와 인접 완성 바닥, 벽 하단·슬래브 아랫면을 같은 단면에서 읽는다. 네 입면·모서리·현관 후퇴부·서비스 문턱의 지면 접합을 모두 포함하며 지면 위 그림자만으로 접촉했다고 세지 않는다. 문 아래 벽 띠 검사는 실제 보행 완성면 위의 통과 영역을 대상으로 하고, 문턱 아래의 벽 지지 부분과 구별한다. 벽 하단은 [대지 지면](site.md#site-grade)의 최저 접촉에서 유도되지만 그 계산으로 접촉·매입 결과를 대신하거나 검사에서 빼지 않고, 현관 석단 앞 구조체와 동·서 외벽의 경사 접촉도 같은 단면에 포함한다.

입력 수량을 compiled 수량으로 복사하지 않는다. compiled 관찰 목록과 census 수는 viewer payload가 같은 generation의 environment에서 매번 유도하며, 도달성·모든 물리 접합·시각 판정은 그 목록이 생긴 것만으로 완료되지 않는다. 다섯 reference의 외관·절개 검사·분수 중정·제실·기록/서비스 비교를 별도로 더하고 절개를 전달 프레임으로 세지 않는다. source는 이를 `reference` 묶음의 다섯 pose로 두며 절개 검사는 지붕·천장을 숨긴 조감 보기로 연다. 이 pose는 같은 건물·방으로 읽히는지의 비교 질문이고 판정 전에는 unverified다.

## 원래 소스를 그리는 뷰어 {#viewer-path}

<!--
@evidence principles/core/common.md#scope-preservation source 실체·현재 문 상태·계측 generation·한국어 관찰 UI와 GPU 결과를 하나의 전달 경로에 배정한다.
@evidence principles/core/common.md#substantive-completion server.cts→공개 lowering/tessellation→클라이언트의 전달 경계와 식별자/변환/재료 보존, 오류 표시 및 포트 인자를 정한다.
@evidence principles/core/common.md#declared-basis CJS 경계와 사용자 4175/설치 권한을 소비하고, 저작자의 GPU 확인은 전달 경로가 동작한다는 증거일 뿐 방별 reference 판독이 아니라고 구분한다.
@evidence principles/design/spaces.md#space-topology 원래 environment의 공간/경계는 계측에 보존하고 실제 element/model만 기본 화면에 그려 논리 cap·support·AABB가 구조체를 대신하지 못한다.
@evidence principles/design/spaces.md#space-boundary-authority 서버는 원래 geometry와 world/local 변환을 전달하고 브라우저가 건물·반복 수량·UV·재료를 새로 저작하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 현재 오류에서 오래된 성공 화면을 버리고 RENDERER·콘솔 오류·빈 캔버스를 매 확인에서 다시 읽으며 reference 판독은 별도로 남긴다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation CJS producer 약속을 lowering의 현재 operation 및 part local/world 변환을 보존하는 구체 전달 인터페이스로 좁힌다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work runtime-boundary의 CJS producer와 gpu-observation의 실제 캡처 조건을 공개 API 입력/출력에 대조했다. UV 부재와 authored set 구별을 전달 설계에 남길 수 있어 engine ESM 전환이나 대체 성공 기준을 부모에 요구하지 않았다.
@evidence settings/00-delivery.md#delivery-scope 공간 library의 현재 source를 실제 3D로 열어 보는 viewer 경로를 제공하며 별도 영화나 client 건물을 만들지 않는다.
@evidence settings/00-delivery.md#operator-access 외관 궤도/확대와 공간·관찰 선택을 화면 밖 패널로 두고 라벨·경계·절개는 검사 모드에서만 켠다.
@evidence settings/00-delivery.md#working-language 공간·관찰 선택과 설명을 한국어 UI로 배정하고 source/API 식별자는 전달에 보존한다.
@evidence settings/00-delivery.md#operative-subjects producer·renderer·관찰 UI의 역할을 나누어 전달자가 geometry나 공간을 새로 만들지 못하게 한다.
@evidence settings/00-delivery.md#accessibility 공간 설명·대상 텍스트 목록과 키보드 선택을 실제 관찰 UI의 구현 조건으로 포함한다.
@evidence settings/50-production.md#runtime-boundary CJS 서버에서 engine을 호출하고 브라우저에는 실제 산출물만 보내 runtime ESM import를 피한다.
@evidence settings/50-production.md#fidelity 실제 mesh·재료·깊이·그림자를 그리며 논리 volume과 support를 기본 화면의 물리 실체로 대체하지 않는다.
@evidence settings/50-production.md#gpu-observation Playwright chromium 채널로 RENDERER가 하드웨어 GPU(ANGLE D3D11)인지·콘솔 오류·빈 캔버스를 저작자 자가검사마다 확인하고 방별 reference 판독은 단계 관찰로 남긴다.
@evidence settings/50-production.md#execution-authority 코드·의존성·viewer script는 package.json이 가지며 서버를 띄워 두는 것은 조정자에게 맡긴다.
@evidence settings/50-production.md#author-commits 의존성 변경 시 root pnpm install과 바뀐 lockfile의 production 동시 commit 조건을 viewer 실행 인계에 포함한다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 현재 source·문 상태·관찰 generation과 한국어 UI, GPU 확인이 한 전달 경로에 묶여 그림만 다른 시점의 결과가 되지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 CJS producer에서 mesh/변환/재료를 전송하는 순서와 오류·포트 처리, 시작 명령·경로가 구체적이다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 마지막 문단이 저작자 GPU 확인을 전달 경로 동작의 증거로만 한정하고 방별 reference 판독과 구별해 더는 viewer가 없다는 낡은 문장이 남지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 논리 cap·support·외접 상자는 기본 실체 화면에 그리지 않아 누락 구조를 검사 도형으로 감출 수 없다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 part local과 element world를 분리하고 UV/재료 부재도 보존해 client가 새 건물을 만들지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 오류 시 이전 화면을 버리고 RENDERER·콘솔·빈 캔버스를 매번 다시 확인하는 조건이 오래된 성공 화면을 증거로 쓰는 것을 막는다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모 CJS 약속을 lowering의 문 상태와 part/world 변환을 보존하는 구체 전송 경계로 좁혔다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 UV 부재와 authored set 한계를 전달 계약에 드러낼 수 있어 ESM 전환이나 소프트웨어 캡처의 성공 인정이 필요하지 않았다.
@evidenceReview settings/00-delivery.md#delivery-scope #142c909 공간 library의 실제 source를 보는 경로이며 client용 복제 건물이나 영화로 납품을 바꾸지 않는다.
@evidenceReview settings/00-delivery.md#operator-access #e19a32a 라벨·경계·절개는 명시 검사에서만 켜고 공간 선택 패널은 화면 밖에 둔다.
@evidenceReview settings/00-delivery.md#working-language #ba75eb7 공간/관찰 선택과 설명을 한국어로 제공하고 API 식별자는 정확히 보존한다.
@evidenceReview settings/00-delivery.md#operative-subjects #78af323 producer가 실체를 만들고 renderer는 전달받은 값을 그려 관찰 UI가 geometry 저작자가 되지 않는다.
@evidenceReview settings/00-delivery.md#accessibility #e5000b9 텍스트 목록·키보드 선택·색 외 상태 표시를 관찰 UI 조건으로 두고 실제 조작 성공은 source와 관찰에서 확인한다고 적었다.
@evidenceReview settings/50-production.md#runtime-boundary #3eb9810 브라우저에서 Node/engine runtime을 import하지 않고 CJS 서버만 engine을 호출한다.
@evidenceReview settings/50-production.md#fidelity #bb89317 원근·조명·그림자·깊이는 실제 mesh에 적용하고 support를 바닥으로 대체하지 않는다.
@evidenceReview settings/50-production.md#gpu-observation #b0ab4b5 chromium 채널에서 하드웨어 RENDERER·콘솔 오류·빈 캔버스를 확인하는 방법이 적혀 소프트웨어 렌더나 빈 화면을 GPU 성공으로 셀 수 없다.
@evidenceReview settings/50-production.md#execution-authority #cf13b03 package.json의 viewer script가 시작 명령을 가지고 서버를 띄워 두는 역할은 조정자로 나뉘어 있다.
@evidenceReview settings/50-production.md#author-commits #f2218c8 의존성 변경 때 root pnpm install과 lockfile 동시 commit을 명시해 frozen install의 불일치를 막는다.
-->

[CJS 경계](../settings/50-production.md#runtime-boundary)를 따른다. `src/viewer/server.cts`가 CJS 환경에서 생산 source와 공개 engine을 호출하고 현재 environment, 실제 mesh·transform·material, 같은 generation의 관찰 정보를 클라이언트로 전달한다. 브라우저는 Node/engine 런타임을 import하지 않으며 실제 3D 원근·조명·그림자·깊이로 받은 geometry를 그린다. 건물을 client 데이터로 다시 만들지 않는다. 실행 코드는 src, HTML·스타일 자산은 public에 둔다.

서버는 같은 environment를 공개 `lowerBuiltEnvironment`에 전달해 현재 문짝 상태와 부모·자식 변환이 반영된 element 배치를 얻고, 원래 environment는 공간·경계·개구부 계측에 함께 사용한다. lowering의 `set`은 실제 model이 결속된 element의 world 배치이며 경계 선언에서 벽이나 지붕을 생성하는 기능이 아니다. 따라서 건물의 보이는 실체는 [표면 소유](ownership.md#surface-map)에 배정된 source가 실제 element/model로 공급한다. 논리 volume·boundary·외접 상자를 그 실체로 대체하지 않는다.

전달은 node·element·model·part의 식별 관계와 geometry, 재료 결속을 보존한다. primitive는 서버 쪽 공개 tessellation으로 삼각형 데이터를 얻고, explicit mesh는 원본 positions·normals·UV·색·indices와 각 속성의 부재를 보존한다. `tessellateToMesh`의 UV는 `null`이므로 텍스처 좌표가 생겼다고 간주하지 않는다. 필요한 UV는 geometry와 materials의 소유자가 준비하며 전달자가 임의 좌표를 덧씌우지 않는다. element의 world 변환과 model part의 local 변환은 서로 다른 값으로 유지하고, 같은 변환을 정점과 node 양쪽에 중복 적용하지 않는다. model 내부 재료와 전체 model population에서 찾는 재료를 구별하며, 결속된 재료를 찾지 못한 경우 다른 색의 기본 재료로 성공 화면을 만들지 않는다.

support patch는 발 디딤과 계측의 선언이며 기본 화면의 물리 바닥이 아니다. 바닥·계단·지면은 실제 authored geometry로 그린다. support와 논리 경계는 명시적 검사 모드에서만 구별해 표시하고, 기본 화면의 색·깊이·그림자에 참여시켜 빠진 구조체를 가리지 않는다. 낮은 마당의 논리 상한도 같은 이유로 하늘을 막는 면으로 만들지 않는다. 기존 viewer helper 중 engine을 runtime import하는 경로는 브라우저에서 직접 사용하지 않으며, 서버 산출물을 소비하는 렌더 코드가 이 모듈 경계를 지킨다.

반복 population이 추가되면 lowering이 돌려주는 authored `IAutoMovieInstanceSetDesign`과 실제 compiled 반복 산출물을 구별한다. 반복 소유자의 같은 규칙·입력에서 나온 prototype와 배치 결과를 전달하며, 화면 쪽에서 기둥·기와 개수나 간격을 다시 정하지 않는다. 아직 컴파일하지 않은 set을 compiled 수량으로 보고하거나 전송하지 못한 반복을 조용히 빼지 않는다. viewer·관찰·계측은 동일한 현재 generation을 소비하고, 전송용 값은 런타임 전달에만 쓰며 별도 JSON 프로젝트 저장소로 기록하지 않는다.

서버 인자는 `--port`를 받고 기본 포트는 사용자 지정 4175다. 관찰 UI는 화면 밖의 한국어 공간·관찰 선택, 외관 궤도·확대·축소와 명시적 검사 모드를 갖는다. 라벨·경로·경계·절개는 기본 꺼짐이다. compilation 실패 시 이전 성공 화면을 남기지 않고 현재 오류를 보여 주며 그 상태를 정상 납품이라고 하지 않는다. 코드·의존성·시작 명령은 package.json의 `viewer` script와 의존성 선언이 가지며 서버를 띄워 두는 것은 조정자가 한다. 2026-09-22 사용자 정정에 따라 의존성을 변경할 때는 저작자가 저장소 루트에서 `pnpm install`을 실행하고 production과 바뀐 `pnpm-lock.yaml`을 같은 커밋에 넣는다.

관찰 UI는 공간 설명과 관찰 대상의 텍스트 목록을 제공하고 공간·시점·검사 모드 선택을 키보드로 조작할 수 있어야 한다. 선택/실패 상태를 색만으로 표시하지 않는다. 이는 공간 관찰에 필요한 접근 인터페이스이며 실제 조작 성공은 viewer source와 관찰에서 확인한다.

시작은 production 루트에서 `npm run viewer -- --port 4175`, 열 경로는 `/`다. 단계의 단일 선언은 lint.config.ts이고 우회 source 경로·임의 selector·ESM 전환을 사용하지 않는다. 저작자 자가검사는 Playwright의 `chromium` 채널로 이 페이지를 열어 콘솔의 RENDERER가 하드웨어 GPU(ANGLE D3D11)인지와 오류가 없는지, 캔버스가 비어 있지 않은지를 매번 확인한다. 그 확인은 전달 경로가 동작한다는 증거일 뿐이며 방별 reference 판독과 재료·부재가 붙은 뒤의 시각 판정은 각 단계의 관찰로 남는다.

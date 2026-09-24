# 실제 경계의 개구부

## 벽과 void의 단일 소유 {#boundary-ownership}

<!--
@evidence principles/core/common.md#scope-preservation spine·가로 벽·현관 후퇴부의 인접 관계와 같은 구멍을 보는 벽 양면, 지붕 선으로 나뉘는 벽 면의 띠를 하나의 경계 절단에 연결한다.
@evidence principles/core/common.md#substantive-completion 안정 boundary ID, host face와 local XY opening profile, 볼록 기둥 프리즘 분해와 개구부 구간의 문턱 아래·인방 위 실체, 맞닿은 면의 제거 규칙을 결정한다.
@evidence principles/core/common.md#declared-basis 공유 기준선과 공개 polyhedron/검증 API의 표현 범위를 근거로 하고 extrude 경로를 폐기한 이유를 모서리 맞댐과 경사 상단으로 밝힌다.
@evidence principles/design/spaces.md#space-topology 서·동 spine에서 인접 공간이 바뀌는 구간과 여섯 host에서 옆 부피가 끝나는 높이를 구별하고 닫힌 벽에 semantic 문만 생기는 것을 금지한다.
@evidence principles/design/spaces.md#space-boundary-authority 외벽은 입면, 내부벽은 boundaries, 방은 자기 쪽 표면만 소비하며 void와 문틀은 같은 host/profile을 쓴다.
@evidence principles/design/spaces.md#space-verification-address 경계 양면과 void 관통 단면, 기둥 사이 reveal과 지붕 선의 띠를 짝으로 읽어 한쪽 벽 잔존과 잘못된 공간 연결을 찾는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 실제 개구부 요구에 경계 ID·절단 윤곽·물리 실체 생성 방식과 owner를 배정해 문짝 부착만의 가짜 구멍을 차단한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work openings의 깊은 reveal과 fixed-graph의 직접 문을 같은 host 절단으로 표현할 수 있었다. 경사 상단·대각 맞댐을 일정 단면 압출이 담지 못하는 한계는 기둥 프리즘 경로 선택으로 다루고 부모의 박공·문 요구를 약화하지 않았다.
@evidence settings/20-envelope.md#openings 문틀·문짝과 별개로 벽 양면이 공유하는 실제 관통 void를 요구한다.
@evidence obligations/design/spaces.md#space-envelope-interface 외벽/내벽 양면이 같은 boundary face와 opening profile을 소비하게 하고 실제 절단 깊이를 단면에서 대조한다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 문 양면과 지붕 띠, 후퇴벽 중앙·양끝, 반환벽 상부·자유 끝, 거리 쪽 안타 끝면 둘과 포치 박공 양면을 기존 host에 빠짐없이 주소화한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 여섯 높이 절단, 후퇴벽 북면과 옆면의 서로 다른 지붕 최고점, 반환벽 경사 교차·자유 끝, 안타·박공의 host ID와 공간 결속을 본문이 정한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 이웃 지붕 상면·마당 상한 3.20m와 반환벽의 12° 상면을 절단 근거로 쓴다. 후퇴벽 북면 노출은 3.614m부터, 옆면 노출은 최고점 3.678m부터다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 반환벽의 두 공간/한 공간 구간과 후퇴벽 끝 칸의 주랑 한 공간 구간을 구별한다. 안타·박공 외부 주소는 방·직접 문·순환 루프를 추가하지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 후퇴벽·반환벽·안타·박공의 새 경계는 기존 물리벽에 붙는다. 박공·반환벽의 실체와 완결 표면은 남측 입면 owner가 계속 소유한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 지붕 위 반환벽·후퇴벽 끝 칸과 포치 자유 끝·거리 쪽 안타·박공 양면을 각자 다른 노출면 주소와 관찰 질문으로 남긴다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 문은 절단 profile, 반환벽의 0.159m 띠는 경사 분할 host, 후퇴벽 양끝·안타·박공 양면은 한 공간 경계로 구체화한다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 노출면 주소와 북면·옆면 절단 높이만 바로잡았다. 중앙 문 연결, 박공의 물리 막음, reveal 형상과 한 주랑 루프는 상위 결정을 유지한다.
@evidenceReview settings/20-envelope.md#openings #4053d90 노출면 경계를 보탰어도 문·창 수와 같은 host/profile의 양면 절단은 유지한다. 제실 채광창을 낮은 방의 문턱으로 세지 않는다.
@evidenceReview obligations/design/spaces.md#space-envelope-interface #4b397de 여섯 상부 host·반환벽·후퇴벽 북면/옆면·안타·박공 경계는 기존 물리벽의 주소이고 두 번째 벽 실체가 아니다.
-->

[공유 기준선](building.md#plan-datums)이 두께와 접면을 정하고 이 파일은 각 물리 경계의 ID·인접 관계·void를 소유한다. 외벽 실체는 해당 입면 source가 만들고 내부벽 실체는 `src/spaces/boundaries.ts`가 만든다. 방 파일은 그 벽의 자기 쪽 표면을 참조할 뿐 두 번째 벽을 생성하지 않는다. 같은 벽에 뚫린 문·창은 이 경계의 절단 결과를 내·외부에서 함께 쓴다. 문짝이나 틀을 붙였다고 void가 생겼다고 세지 않는다.

`boundary-sanctuary-south`는 sanctuary-front~north-ring, `boundary-west-spine`은 west-room~west-ring, `boundary-east-spine`은 east-ring~east-room이다. 서측 spine은 북쪽에서 봉헌실/제실, 남쪽에서 봉헌실/주랑을 가르므로 인접 공간이 바뀌는 지점에서 topology 구간을 나누되 물리 접합은 끊지 않는다. 동측 spine도 제실/마당, 주랑/마당, 주랑/세 업무방으로 인접성을 구별한다. 오른쪽의 세 가로 벽은 yard-front~storage-back, storage-front~records-back, records-front~office-back이다. 정문 후퇴벽은 entrance-back~entrance-front이고 반환벽은 [현관](rooms/entrance.md#entrance-volume)의 양옆 경계다.

경계 host의 한쪽 공간 부피가 다른 쪽의 지붕 상면 또는 열린 마당의 논리 상한 위로 계속되고 그 띠가 외부로 드러나면, host를 낮은 쪽의 종료 높이에서 나눈다. 아래는 두 공간의 경계이고 위는 높은 쪽 공간 하나만 가진 외부 향 경계다. 일정 높이로 절단할 여섯 host의 종료 높이는 지붕 있는 방이면 벽 면을 따라 그 방 쪽 지붕 상면이 가장 높은 곳, 지붕 없는 마당이면 [마당의 논리 상한](rooms/service-yard.md#yard-volume)이다. 벽 두께 안에 물린 지붕 slab 구간은 아래 경계에 든다. 실제 모든 두 공간 boundary의 host 상단과 양쪽 국소 공간 상한을 대조한다. 반환벽에서는 주랑 지붕 상면이 Z에 따라 올라가므로 다른 지점의 최고 높이로 국소 노출을 지우지 않고 아래의 경사 절단을 쓴다.

일정 높이에서 나누는 여섯 host는 제실의 세 벽, 주랑/마당 동측 spine, 현관 후퇴벽, 마당/보관실 북쪽 끝벽이다. `boundary-sanctuary-south`는 북쪽 주랑 외쪽 지붕 상면(north-ring에서 약 3.65m) 아래의 제실/주랑 경계이고 그 위는 `boundary-sanctuary-south.upper`다. `boundary-west-spine.sanctuary`는 서측 외쪽 지붕 상면(west-room에서 약 3.71m) 아래의 봉헌실/제실 경계이고 위는 `boundary-west-spine.sanctuary-upper`다. `boundary-east-spine.sanctuary`는 마당 논리 상한 3.20m 아래의 제실/마당 경계이고 위는 `boundary-east-spine.sanctuary-upper`다. `boundary-east-spine.yard`는 같은 3.20m 아래의 주랑/마당 경계이고 그 위는 `boundary-east-spine.yard-upper`다. `boundary-entry`는 후퇴벽의 주랑 쪽 외쪽 지붕 상면 아래의 현관/주랑 경계이고 위는 `boundary-entry.upper`다. `boundary-yard-storage`는 3.20m 아래의 마당/보관실 경계이고 위는 `boundary-yard-storage.upper`다.

두 반환벽 각각은 현관 앞벽 Z=8.35m부터 남측 외벽 Z=10.25m까지다. 후퇴벽 가까이에서는 포치 공간 상한 약 3.838m가 남쪽 주랑 지붕 상면보다 높다. Z≈8.395m의 주랑 지붕 상면 약 3.688m와의 차는 약 0.150m이며 1cm 탐침에서 최대 약 0.159m의 주랑 쪽 노출 띠가 생긴다. `boundary-entrance-return-{west|east}`는 Z=8.35m부터 주랑 지붕 상면이 포치 공간 상한에 닿는 교차점(약 Z=9.1m)까지 남쪽 주랑 지붕의 12° 상면 선 아래의 현관/주랑 경계다. 같은 물리 host의 선 위는 `boundary-entrance-return-{west|east}.upper`로 현관 쪽 외부 향이다. 교차점부터 남측 외벽 안쪽 Z=9.65m까지 아래는 `boundary-entrance-return-{west|east}.outer`로 두 공간에, 포치 쪽 공간 상한 위는 `.outer-upper`로 주랑 쪽 외부 향에 결속한다. Z=9.65~10.25m의 자유 끝은 주랑 부피가 닿지 않아 `boundary-entrance-return-{west|east}.front`로 각각 현관 한 공간에 결속하며 열린 포치 쪽에서 관찰한다. 후퇴벽 북면의 X=-1.65~1.65m 중앙은 현관/주랑의 `boundary-entry`, 지붕 위는 현관 한 공간의 `boundary-entry.upper`다. 양끝 X=-1.95~-1.65m와 +1.65~+1.95m는 남면만 반환벽에 닿는다. 북면과 X=±1.95m의 옆면은 주랑에 열리고 북면은 지붕 위 약 3.614~4.690m, 옆면은 지붕 최고점 위 약 3.678~4.690m가 하늘에 노출되므로 각 끝의 `boundary-entry.{west|east}-end`와 `.upper`, 옆면 `boundary-entry.{west|east}-side`와 `.upper`에 주랑 한 공간으로 결속한다. 같은 물리 후퇴벽 host의 정면·옆면만 주소를 나누며 별도 벽을 만들지 않는다. 교차점은 고정 숫자가 아니라 실제 포치 지붕 하부와 주랑 지붕 상면의 교점에서 유도한다. 반환벽 상단 4.690m까지의 파라펫은 포치 지붕 상면 약 4.04m 위에서도 양쪽이 하늘에 노출된다. 이 벽의 실체와 파라펫 양면은 남측 입면 owner를 유지하고, 각 위쪽 boundary와 양면 입면 관찰은 [관찰 소유](observations.md#geometry-observations)가 맡는다.

후퇴벽의 양 끝 옆면은 Z=8.05~8.35m를 따라 주랑 지붕 상면이 약 3.614~3.678m로 올라간다. 따라서 북면에 쓴 3.614m를 옆면에 복제하지 않고 그 면을 따라 가장 높은 3.678m에서 `boundary-entry.{west|east}-side`와 `.upper`를 나눈다. 반환벽 두 개의 거리 쪽 끝면(Z=10.25m, X=±1.65~±1.95m)은 `boundary-entrance-return-{west|east}.street-end`로, 포치 박공 막음의 앞면(Z=10.25m)과 뒷면(Z=10.05m)은 `boundary-porch-pediment.{front|back}`으로 각각 한 공간 입면 주소를 둔다. 이 네 주소는 남측 입면이 이미 소유한 물리벽의 노출 면에 붙고 안타·박공을 두 번째 벽으로 만들지 않는다.

나뉜 경계는 같은 물리 벽의 주소이며 벽 실체와 완결 표면의 소유는 바뀌지 않는다. 위쪽 경계는 공간이 하나이므로 외부 입면·외부 개구부와 같은 방식으로 관찰되고, 그 경계의 개구부는 아래쪽 방의 threshold를 만들지 않는다.

오른쪽 가로 경계의 안정 ID는 북쪽부터 `boundary-yard-storage`, `boundary-storage-records`, `boundary-records-office`다. 이들의 끝과 spine·외벽·현관의 맞닿음은 [벽 접합](junctions.md#wall-junctions)이 정한다. 외곽 모서리의 두 벽을 겹친 상자로 만들지 않으며 후퇴벽·반환벽은 남측 입면의 물리 소유다. 마당과 보관실 사이의 높은 지붕 끝은 [박공 폐쇄](junctions.md#gable-closures)를 소비한다.

공개 `IAutoMovieBuiltBoundary.face`에는 절단 전 host의 위치·회전·윤곽·두께를, `IAutoMovieBuiltOpening.profile`에는 그 host의 local XY로 표현한 실제 void를 배정한다. 문과 채광구의 profile은 네 꼭짓점의 직사각형이며 아래 각 절의 유효 치수와 해당 가장자리의 틀 두께에서 유도한다. profile 없는 관계 레코드를 물리 개구부로 세지 않는다. 실체 벽의 절단과 문틀·문짝 배치는 동일한 host/profile/ID를 소비하며 화면용 좌표나 구멍 목록을 별도로 만들지 않는다.

벽 실체는 host 평면(대각 맞댐을 적용한 볼록 사다리꼴 또는 직사각형)을 길이 방향 절단선과 지붕 조각으로 나눈 볼록 기둥 프리즘의 합이다. 절단선은 인접 공간이 바뀌는 좌표, 개구부 profile의 양끝, 옆 지붕 조각의 경계가 벽 면을 지나는 좌표다. 각 기둥의 하단은 공통 하단, 상단은 해당 합성 단위의 지붕 하부 평면 또는 코핑·마당 벽 높이의 수평면이다. 개구부 구간의 기둥은 [문턱 슬래브 예약](storey.md#threshold-support) 아래와 인방 위(채광구는 창대 아래와 위)만 남아 실제 void와 벽 두께를 관통하는 reveal이 생긴다. 인접 기둥이 맞닿은 면은 같은 평면의 반대 법선 면끼리 차집합으로 지워 노출 부분(문설주 reveal, 높이 차이 끝)만 남긴다. 긴 면이 지붕에 닿으면 [띠 분할](junctions.md#gable-closures)로 지붕 아래·지붕 두께 안·지붕 위로 나눈다. 공개 `extrudeAutoMovieRegion`의 일정 단면 압출은 대각 맞댐 끝과 벽 두께 안에서 달라지는 경사 상단을 담지 못해 폐기했고, `builtBoundaryWallCut`의 외접 직사각형 환원도 박공 윤곽 대신 쓰지 않는다. 기둥은 공개 `buildAutoMoviePolyhedron`의 볼록 평면 면으로 만들고 표면 part마다 2-manifold 검증을 통과해야 한다.

관찰은 각 경계 양면과 모든 void의 단면을 짝으로 읽는다. 인접 공간이 잘못 연결되거나 문 한쪽에 벽이 남거나 기둥 사이 내부 접면이 드러나면 실패다. 닫힌 경계에 보이지 않는 semantic 문을 만들지 않는다. 벽 mesh의 실제 절단·reveal·그림자는 source와 GPU 관찰에서 확인한다.

## 출입문의 명시 위치 {#doors}

<!--
@evidence principles/core/common.md#scope-preservation 정문·제실·봉헌실·세 업무방·마당의 두 문 각각에 연결 경계와 스윙을 배정한다.
@evidence principles/core/common.md#substantive-completion 유효 폭/높이와 중심, 문틀 0.06m·문짝 예산 0.05m 및 open/closed 상태의 소비 관계를 정한다.
@evidence principles/core/common.md#declared-basis 유효 통과 기준은 설정에서 받고 틀을 더한 void와 좁은 마당 접면의 벽 여유는 선택 입력의 산술로 구분한다.
@evidence principles/design/spaces.md#space-topology 정문은 현관으로, 방 문은 해당 방 안으로 열어 주랑을 보존하고 실제 fill panel을 opening에 붙인다.
@evidence principles/design/spaces.md#space-boundary-authority 위치·유효 치수·스윙 예약은 이 표가 소유하며 후속 model/instance가 다른 문 좌표를 복제하지 못한다.
@evidence principles/design/spaces.md#space-verification-address 전체 스윙과 열린 상태에서 기둥·철물·두께가 남긴 실제 통과 영역을 목표 폭과 비교한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모의 최소 통과 폭과 깊은 창호 요구를 문마다 다른 중심·치수·열림 방향으로 정착시킨다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work use-profile의 방 문/정문 최소와 openings의 열린 목재 문 요구를 직접 문 접면에 대조했다. 마당 접면도 틀을 포함한 void를 수용해 부모 폭이나 그래프를 줄이지 않았다.
@evidence settings/10-building.md#use-profile 표의 유효 치수는 열린 문짝·철물을 뺀 실제 통과에서도 유지해야 한다.
@evidence settings/20-envelope.md#openings reveal·문설주·인방·실제 panel과 닫힘/열림 상태를 같은 opening 소유에 묶는다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 마당의 두 문까지 각 경계·연결·스윙을 정해 공용 문만으로 목록을 끝내지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 유효 폭/높이에서 틀 0.06m를 더하는 순서와 실제 panel 상태를 정했다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 마당 접면 1.4m와 void 1.12m의 여유를 입력 산술로 한정해 실체 검증과 구별했다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 방 문은 방 안으로, 정문은 현관 쪽으로 열어 주랑을 문 스윙으로 막지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 후속 hinge/model이 폭을 조용히 복제하지 말고 이 owner를 수정하도록 단일 치수 책임을 유지한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 문짝 두께·손잡이가 남긴 열린 통과 영역도 읽게 해 문틀 안 폭만으로 통과시킬 수 없다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 최소 폭 요구에 각 방의 다른 중심·높이·열림 방향과 상태 binding을 더했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 좁은 마당 접면에도 틀 포함 void와 양끝 벽 여유가 남아 부모 폭을 줄이지 않았다.
@evidenceReview settings/10-building.md#use-profile #00a6851 설정의 통과 최소는 열린 문짝/철물 뒤 실제 영역에도 유지해야 한다고 명시했다.
@evidenceReview settings/20-envelope.md#openings #4053d90 opening.fill의 실제 panel과 closed/open 상태가 같은 lowering 경로를 써서 브라우저의 별도 회전이 개구부를 대신하지 않는다.
-->

아래 치수는 프레임을 제외한 유효 통과 폭·높이이고 중심은 벽 길이 방향의 좌표다. Y=0 문턱으로 [층 높이](storey.md#ground-storey)를 잇는다. 개구부 원형 폭은 양쪽 문틀 각 0.06m를 더해 유도하고 head도 틀 두께 0.06m를 더한다. 인방·문설주는 벽 두께를 관통하는 reveal을 가지며 문짝 두께 예산은 0.05m다. 문은 기본 열림이며 실제 회전축과 열린 폭을 후속 model/instance가 이 통과 영역에 맞춘다.

| ID | 경계와 연결 | 길이 방향 중심(m) | 유효 폭×높이(m) | 방 안의 스윙 예약 |
| --- | --- | ---: | --- | --- |
| door-entry | 후퇴벽, entrance↔colonnade | X=0 | 1.8×2.5 | 양개문을 현관 쪽 90도로 열어 주랑 순폭 보존 |
| door-sanctuary | 제실 남벽, colonnade↔sanctuary | X=0 | 1.4×2.5 | 양개, 제실 안 양측 |
| door-offering | 서측 spine, colonnade↔offering | Z=2.175 | 1.2×2.3 | 봉헌실 안 북쪽 |
| door-administration | 동측 spine, colonnade↔administration | Z=7.65 | 1.0×2.2 | 관리실 안 남쪽 |
| door-records | 동측 spine, colonnade↔records | Z=3.725 | 1.0×2.2 | 기록실 안 남쪽 |
| door-storage | 동측 spine, colonnade↔storage | Z=-0.3 | 1.1×2.2 | 보관실 안 남쪽 |
| door-yard | 동측 spine, colonnade↔service-yard | Z=-3.15 | 1.0×2.2 | 마당 안 북쪽 |
| door-service-exterior | 동측 외벽, exterior↔service-yard | Z=-6.4 | 1.1×2.2 | 마당 안 북쪽 |

마당-주랑 접면의 입력 길이는 1.4m이고 문틀을 포함한 void는 1.12m이므로 양끝 벽 여유가 각각 0.14m다. 문틀을 구멍 폭에 덧붙이는 순서를 뒤집어 유효 폭을 잃지 않는다. 모든 문짝은 기둥·부재·사람 포락과 스윙 전 범위에서 비교하고 열린 정지 상태에서 주랑 유효폭을 확인한다. 이 산술은 부재 검증을 대신하지 않는다. 실제 compile에서 프레임·힌지 위치가 달라지면 문 치수를 조용히 복제하지 말고 이 소유를 수정한다.

표의 유효 폭은 열린 문짝과 철물이 남긴 실제 통과 영역에서도 유지해야 한다. 문틀 안쪽 폭만 같다고 통과시키지 않으며 0.05m 문짝의 두께나 손잡이가 침범하면 힌지·틀 단면과 그 소비자를 이 목표에 맞춰 다시 검토한다. `opening.fill` 아래 실제 한 짝 또는 두 짝 element를 배정하고 각 panel의 닫힌 자세와 회전축·한계, `closed`/`open` 상태를 선언한다. 현재 상태는 `open`이며 정문의 두 짝은 위 표의 90도 방향을 따른다. `builtOpeningPanelPlacements`가 읽는 상태와 `lowerBuiltEnvironment`가 그리는 상태를 일치시키고, 여닫힘을 브라우저에서 별도 회전으로 재현하지 않는다. 틀·힌지·손잡이는 실제 부재가 필요하며 operation 레코드만으로 생기지 않는다.

## 높은 제실 채광구 {#clerestories}

<!--
@evidence principles/core/common.md#scope-preservation 제실의 높은 채광을 북·남 박공과 서·동 측벽의 작은 구멍으로 남기고 출입구나 인접 방 연결로 바꾸지 않는다.
@evidence principles/core/common.md#substantive-completion 박공 창 X=±1.0m·sill 4.6m와 측벽 창 Z=-8.0/-5.8m·sill 4.0m의 window ID, 유효 0.4×0.4m 및 틀/관통 벽 범위를 고른다.
@evidence principles/core/common.md#declared-basis 봉헌실 외쪽 지붕 상면·제실 처마 하부·북쪽 주랑 지붕 상면과의 높이 비교를 입력 산술로 적고 실측이 아닌 설계 비교 결과로 한정한다.
@evidence principles/design/spaces.md#space-topology 제실 안에서 박공 바깥과 날개 지붕·마당 위 외부로 열리도록 두고 방 사이의 통로는 만들지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 창 위치는 이 owner, 관통 범위는 기준선, 위아래 한계는 제실 roof와 옆 날개 지붕에서 받아 처마 끝을 창 기준으로 대체하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 창 윗모서리와 roof 하부, 창 아랫모서리와 옆 지붕 상면, reveal 깊이, 주랑 지붕 가림을 입면/실내 단면에서 함께 본다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 작은 상부 채광구라는 제실 설정에 박공과 측벽의 위치, 날개 지붕 위 높이, 실제 void 비례를 더한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work sanctuary의 상부 채광과 openings의 깊은 틀을 높아진 제실 단면에 대조했다. 측벽 창을 봉헌실 외쪽 지붕 위로 둘 수 있어 창을 없애거나 부모 roof 높이를 더 바꿀 결함은 드러나지 않았다.
@evidence settings/30-interiors.md#sanctuary 노출 박공 내부에 필요한 높은 채광을 양쪽 박공 벽과 두 측벽 상부에서 확보한다.
@evidence settings/20-envelope.md#openings 작은 구멍도 유효 치수와 틀 두께를 분리하고 벽 두께를 관통하는 reveal로 다룬다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 북·남 박공과 서·동 측벽에 각 두 창을 둔 여덟 ID가 제실 상부에만 속한다. 남·서·동의 바깥은 분할된 외부 향 경계이며 마지막 문단은 이를 낮은 방의 threshold로 세지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 X=±1.0m·sill 4.6m인 박공 창과 Z=-8.0/-5.8m·sill 4.0m인 측벽 창의 0.4m 유효 크기·0.06m 틀, 북벽과 세 위쪽 host가 첫 문단에 확정된다. 마지막 문단은 방 쪽 pose도 창 ID에 결속한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 둘째 문단은 박공 3.65m 지붕 위/6.97m 하부 아래와 측벽 틀 3.94~4.46m 대 서측 3.71m·제실 5.10~5.22m, 동측 마당 3.20m를 설계 산술로 구분한다. 실제 채광은 마지막 문단에서 unverified로 남긴다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 북벽 두 창은 원래 제실/외부이고 다른 여섯은 제실/외부 상부 경계다. 본문이 도착 threshold의 창 판독 효력을 제외해 낮은 봉헌실·주랑·마당을 통한 허위 창 연결을 막는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 창 X/Z·sill과 profile은 이 절이 정하고 북·남 벽 및 두 spine 기준선, 제실 하부·이웃 지붕 상면·마당 상한은 각 owner에서 읽는다. `#boundary-ownership`의 ID를 소비해 창 pose 때문에 벽을 다시 만들지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 본문 마지막 문단이 창별 연직 단면·지붕/마당 위 외부 관찰·제실 내부 `opening-facing` pose를 나누고, 도착 threshold가 창을 등진다고 명시한다. 네 꼭짓점 절두체 검사도 요구한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 settings의 상부 채광 요구에 박공 네 곳·측벽 네 곳의 좌표·틀 여유·관통 깊이를 더한다. 해당 창의 내부 판독은 창 중심 높이에서 자기 ID를 향하는 pose로 구체화한다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 제실 측벽 틀 3.94~4.46m가 서측 지붕 3.71m 위·제실 하부 5.10~5.22m 아래이며 동쪽 마당 상한 3.20m 위다. threshold를 창 관찰에서 빼도 별도 pose로 직접 읽으므로 부모의 채광·지붕 설정을 바꾸지 않는다.
@evidenceReview settings/30-interiors.md#sanctuary #f53612f 북·남 박공과 측벽의 여덟 창은 제실 상부에 남는다. 본문은 각 창의 방 쪽 관찰을 threshold가 아니라 profile 중심 높이에서 자기 창을 향하는 `opening-facing` pose로 정한다.
@evidenceReview settings/20-envelope.md#openings #4053d90 북·남 박공과 서·동 spine을 관통하는 0.4×0.4m 유효 void와 0.06m 석재 틀, 유리 없음이 첫 문단에 분리된다. 마지막 문단은 reveal을 방 쪽 창 pose와 외부 단면에서 실제로 읽게 한다.
-->

제실의 북·남 박공 벽과 서·동 측벽에 작은 채광구를 둔다. 박공 창은 `window-sanctuary-{north|south}-{west|east}`이며 중심 X=±1.0m, sill Y=4.6m다. Z 방향 void는 [기준선](building.md#plan-datums)의 북측 벽 north-outer~north-inner와 남측 벽 sanctuary-front~north-ring을 각각 관통한다. 측벽 창은 `window-sanctuary-{west|east}-{north|south}`이며 중심 Z=-8.0m(north)와 Z=-5.8m(south), sill Y=4.0m이고 X 방향 void는 서측 spine west-room~west-ring과 동측 spine east-ring~east-room의 제실 구간을 관통한다. 북측 박공 창은 원래 제실 하나만 가진 `boundary-north.sanctuary`에, 남측 박공 창과 측벽 창은 [경계 소유](#boundary-ownership)의 외부 향 위쪽 경계 `boundary-sanctuary-south.upper`, `boundary-west-spine.sanctuary-upper`, `boundary-east-spine.sanctuary-upper`에 속한다. 모든 창의 바깥은 외부이며 봉헌실·주랑·마당과 이어지는 개구부가 아니다. 모든 창의 유효 폭·높이는 0.4m, 석재 틀 두께는 각 가장자리 0.06m이고 유리는 없다. [제실 지붕](roofs/sanctuary.md#sanctuary-roof)은 상부 한계를 제공하며 처마 끝선으로 창 위치를 옮기지 않는다. 모두 문 인방 위에 있고 다른 방으로 연결되는 출입구가 아니다.

박공 창의 창대 4.6m는 [북쪽 주랑 외쪽 지붕](roofs/colonnade.md#north-canopy)이 제실 남벽에 닿는 상면 약 3.65m보다 높고, 창 윗모서리(틀 포함 약 5.06m)는 X=±1.26m의 제실 박공 하부 약 6.97m보다 낮다. 측벽 서쪽 창의 틀 아래끝 약 3.94m는 [서측 외쪽 지붕](roofs/west.md#west-roof)이 서측 spine에 닿는 상면 약 3.71m보다 높고, 틀 윗끝 약 4.46m는 spine 두께 안(X=∓5.9~∓5.6)의 제실 지붕 하부 약 5.10~5.22m보다 낮다. 동쪽 창의 틀 아래끝 약 3.94m는 지붕이 없는 [서비스 마당](rooms/service-yard.md#yard-volume)의 논리 상한 3.20m와 낮은 마당 벽 2.55m보다 높아 마당 위 외부로 열린다. 이 비교는 설계 산술이며 실제 충돌 계측 결과가 아니다. 고정 공간 그래프는 바꾸지 않는다.

판정은 창마다 벽에 수직인 연직 단면과 바깥 지붕 위·마당 위의 외부 관찰, 제실 안에서 해당 창 ID의 실제 host profile 중심을 향한 별도 `opening-facing` pose로 창 윗모서리와 지붕 하부의 관계, 측벽 창과 봉헌실 지붕의 간격, 깊은 reveal, 주랑 지붕의 가림을 함께 본다. 엔진이 생성한 도착 방향의 threshold는 창을 등지므로 창 판독 증거로 세지 않는다. 창 전용 pose의 시점 높이는 profile 중심 높이이며 그 네 꼭짓점이 수직 50°·화면비 1600:1000 절두체 안에 드는지 전수 검사한다. 봉헌실·주랑·마당 안의 관찰 위치도 이 창들을 보여 주지 않으므로 창의 관찰로 세지 않는다. 프레임과 실제 채광은 unverified이며 개구부 개수만으로 밝기를 보증하지 않는다.

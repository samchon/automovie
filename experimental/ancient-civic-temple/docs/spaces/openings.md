# 실제 경계의 개구부

## 벽과 void의 단일 소유 {#boundary-ownership}

<!--
@evidence principles/core/common.md#scope-preservation spine·가로 벽·현관 후퇴부의 인접 관계와 같은 구멍을 보는 벽 양면, 지붕 선으로 나뉘는 벽 면의 띠를 하나의 경계 절단에 연결한다.
@evidence principles/core/common.md#substantive-completion 안정 boundary ID, host face와 local XY opening profile, 볼록 기둥 프리즘 분해와 개구부 구간의 문턱 아래·인방 위 실체, 맞닿은 면의 제거 규칙을 결정한다.
@evidence principles/core/common.md#declared-basis 공유 기준선과 공개 polyhedron/검증 API의 표현 범위를 근거로 하고 extrude 경로를 폐기한 이유를 모서리 맞댐과 경사 상단으로 밝힌다.
@evidence principles/design/spaces.md#space-topology 서·동 spine에서 인접 공간이 바뀌는 구간을 구별하고 닫힌 벽에 semantic 문만 생기는 것을 금지한다.
@evidence principles/design/spaces.md#space-boundary-authority 외벽은 입면, 내부벽은 boundaries, 방은 자기 쪽 표면만 소비하며 void와 문틀은 같은 host/profile을 쓴다.
@evidence principles/design/spaces.md#space-verification-address 경계 양면과 void 관통 단면, 기둥 사이 reveal과 지붕 선의 띠를 짝으로 읽어 한쪽 벽 잔존과 잘못된 공간 연결을 찾는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 실제 개구부 요구에 경계 ID·절단 윤곽·물리 실체 생성 방식과 owner를 배정해 문짝 부착만의 가짜 구멍을 차단한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work openings의 깊은 reveal과 fixed-graph의 직접 문을 같은 host 절단으로 표현할 수 있었다. 경사 상단·대각 맞댐을 일정 단면 압출이 담지 못하는 한계는 기둥 프리즘 경로 선택으로 다루고 부모의 박공·문 요구를 약화하지 않았다.
@evidence settings/20-envelope.md#openings 문틀·문짝과 별개로 벽 양면이 공유하는 실제 관통 void를 요구한다.
@evidence obligations/design/spaces.md#space-envelope-interface 외벽/내벽 양면이 같은 boundary face와 opening profile을 소비하게 하고 실제 절단 깊이를 단면에서 대조한다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 spine의 인접 공간 변화, 문 양면, 지붕 선으로 나뉘는 벽 면을 같은 경계 절단에 묶어 한쪽 벽만 열리거나 지붕 위 면의 소유가 비는 상태를 허용하지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 boundary ID·local XY profile과 함께 기둥 분해·개구부 구간 실체·맞닿은 면 제거가 정해져 source가 벽 생성 방식을 새로 고르지 않는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 일정 단면 압출을 대각 맞댐과 경사 상단 때문에 폐기했다는 근거와 공개 polyhedron의 볼록 면 조건이 함께 적혀 있다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 봉헌실/제실과 봉헌실/주랑 구간을 구별하고 닫힌 벽의 semantic 문만으로 연결을 세지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 입면은 외벽, boundaries는 내부벽, 방은 자기 면을 소비해 기둥으로 나눠도 벽 실체의 소유는 한 곳에 남는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 기둥 사이 reveal과 지붕 선 띠를 관통 단면과 함께 읽어 profile이 있어도 벽이 남는 경우와 내부 접면 노출을 실패로 남겼다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모 개구부 약속에 안정 ID·실제 절단 윤곽·기둥 프리즘 생성 방식과 owner를 추가했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 압출 경로의 한계를 기둥 프리즘 선택으로 넘어 부모 박공/깊은 문 요구를 버리지 않았다.
@evidenceReview settings/20-envelope.md#openings #4053d90 문짝을 붙인 사실을 void 생성으로 세지 않고 개구부 구간 기둥을 문턱 아래·인방 위로만 남겨 실제 관통을 만든다.
@evidenceReview obligations/design/spaces.md#space-envelope-interface #4b397de 같은 host/profile이 외벽·내벽 양면과 기둥 void를 지배하고 실제 절단 깊이는 단면에서 대조한다.
-->

[공유 기준선](building.md#plan-datums)이 두께와 접면을 정하고 이 파일은 각 물리 경계의 ID·인접 관계·void를 소유한다. 외벽 실체는 해당 입면 source가 만들고 내부벽 실체는 `src/spaces/boundaries.ts`가 만든다. 방 파일은 그 벽의 자기 쪽 표면을 참조할 뿐 두 번째 벽을 생성하지 않는다. 같은 벽에 뚫린 문·창은 이 경계의 절단 결과를 내·외부에서 함께 쓴다. 문짝이나 틀을 붙였다고 void가 생겼다고 세지 않는다.

`boundary-sanctuary-south`는 sanctuary-front~north-ring, `boundary-west-spine`은 west-room~west-ring, `boundary-east-spine`은 east-ring~east-room이다. 서측 spine은 북쪽에서 봉헌실/제실, 남쪽에서 봉헌실/주랑을 가르므로 인접 공간이 바뀌는 지점에서 topology 구간을 나누되 물리 접합은 끊지 않는다. 동측 spine도 제실/마당, 주랑/마당, 주랑/세 업무방으로 인접성을 구별한다. 오른쪽의 세 가로 벽은 yard-front~storage-back, storage-front~records-back, records-front~office-back이다. 정문 후퇴벽은 entrance-back~entrance-front이고 반환벽은 [현관](rooms/entrance.md#entrance-volume)의 양옆 경계다.

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
@evidenceReview principles/core/common.md#scope-preservation #24155e1 박공 네 창과 측벽 네 창 모두 방 사이 출입구가 아니며 유리를 추가하지 않아 높은 채광의 성격만 남는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 여덟 window ID와 중심·sill·유효 크기·틀 두께가 있어 측벽 창도 실제 void로 주소화된다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 측벽 창 아래 봉헌실 지붕 약 3.71m, 위 제실 처마 하부 약 4.80m와의 비교가 산술로 적히고 계측 결과라는 주장이 없다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 측벽 창은 봉헌실 지붕 위와 마당 위 외부로 열리고 봉헌실이나 마당으로 통하는 새 연결을 만들지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 측벽 창의 Z 위치와 X 관통 범위는 spine 기준선, 위아래 한계는 제실 roof와 서측 외쪽 지붕에서 받는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 측벽 창 아랫모서리와 옆 지붕 상면의 간격까지 단면 관찰에 넣어 지붕에 묻힌 창을 찾도록 했다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 상부 채광 약속에 박공·측벽 위치와 날개 지붕 위 높이를 추가해 지붕 충돌을 피하도록 했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 높아진 제실 단면에서 측벽 창이 봉헌실 지붕 위에 놓여 부모 roof 높이 변경이나 창 삭제가 요구되지 않았다.
@evidenceReview settings/30-interiors.md#sanctuary #f53612f 박공과 측벽 상부의 작은 창이 제실의 노출 박공 내부에 높은 채광을 준다.
@evidenceReview settings/20-envelope.md#openings #4053d90 0.4m 유효 폭/높이와 각 가장자리 틀을 구별하고 박공 벽과 spine 두께의 reveal을 남긴다.
-->

제실의 북·남 박공 벽과 서·동 측벽에 작은 채광구를 둔다. 박공 창은 `window-sanctuary-{north|south}-{west|east}`이며 중심 X=±1.0m, sill Y=4.6m다. Z 방향 void는 [기준선](building.md#plan-datums)의 북측 벽 north-outer~north-inner와 남측 벽 sanctuary-front~north-ring을 각각 관통한다. 측벽 창은 `window-sanctuary-{west|east}-{north|south}`이며 중심 Z=-8.0m(north)와 Z=-5.8m(south), sill Y=4.0m이고 X 방향 void는 서측 spine west-room~west-ring과 동측 spine east-ring~east-room의 제실 구간을 관통한다. 모든 창의 유효 폭·높이는 0.4m, 석재 틀 두께는 각 가장자리 0.06m이고 유리는 없다. [제실 지붕](roofs/sanctuary.md#sanctuary-roof)은 상부 한계를 제공하며 처마 끝선으로 창 위치를 옮기지 않는다. 모두 문 인방 위에 있고 다른 방으로 연결되는 출입구가 아니다.

박공 창의 창대 4.6m는 [북쪽 주랑 외쪽 지붕](roofs/colonnade.md#north-canopy)이 제실 남벽에 닿는 상면 약 3.65m보다 높고, 창 윗모서리(틀 포함 약 5.06m)는 X=±1.26m의 제실 박공 하부 약 6.67m보다 낮다. 측벽 서쪽 창의 틀 아래끝 약 3.94m는 [서측 외쪽 지붕](roofs/west.md#west-roof)이 서측 spine에 닿는 상면 약 3.71m보다 높고, 틀 윗끝 약 4.46m는 spine 위치의 제실 처마 하부 약 4.80m보다 낮다. 동쪽 창은 지붕이 없는 [서비스 마당](rooms/service-yard.md#yard-volume) 위로 열린다. 이 비교는 설계 산술이며 실제 충돌 계측 결과가 아니다. 고정 공간 그래프는 바꾸지 않는다.

판정은 박공과 측벽의 입면·실내 단면에서 창 윗모서리가 지붕 하부에 닿지 않는지, 측벽 창이 봉헌실 지붕에 묻히지 않는지, 깊은 reveal이 읽히는지, 주랑 지붕에 가려 닫힌 구멍이 되지 않는지를 함께 본다. 프레임과 실제 채광은 unverified이며 개구부 개수만으로 밝기를 보증하지 않는다.

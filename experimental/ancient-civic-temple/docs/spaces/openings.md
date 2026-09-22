# 실제 경계의 개구부

## 벽과 void의 단일 소유 {#boundary-ownership}

<!--
@evidence principles/core/common.md#scope-preservation spine·가로 벽·현관 후퇴부의 인접 관계와 같은 구멍을 보는 벽 양면을 하나의 경계 절단에 연결한다.
@evidence principles/core/common.md#substantive-completion 안정 boundary ID, host face와 local XY opening profile, 끝에 닿는 절단과 내부 hole의 표현 차이를 결정한다.
@evidence principles/core/common.md#declared-basis 공유 기준선과 공개 타입/API의 표현 범위를 근거로 하고 아직 생성된 벽 mesh가 없음을 밝힌다.
@evidence principles/design/spaces.md#space-topology 서·동 spine에서 인접 공간이 바뀌는 구간을 구별하고 닫힌 벽에 semantic 문만 생기는 것을 금지한다.
@evidence principles/design/spaces.md#space-boundary-authority 외벽은 입면, 내부벽은 boundaries, 방은 자기 쪽 표면만 소비하며 void와 문틀은 같은 host/profile을 쓴다.
@evidence principles/design/spaces.md#space-verification-address 경계 양면과 void 관통 단면을 짝으로 읽어 한쪽 벽 잔존과 잘못된 공간 연결을 찾는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 실제 개구부 요구에 경계 ID·절단 윤곽·물리 실체 생성 owner를 배정해 문짝 부착만의 가짜 구멍을 차단한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work openings의 깊은 reveal과 fixed-graph의 직접 문을 같은 host 절단으로 표현할 수 있었다. 박공을 직사각형으로 환원하는 API 한계는 형상 경로 선택으로 다루고 부모의 박공·문 요구를 약화하지 않았다.
@evidence settings/20-envelope.md#openings 문틀·문짝과 별개로 벽 양면이 공유하는 실제 관통 void를 요구한다.
@evidence obligations/design/spaces.md#space-envelope-interface 외벽/내벽 양면이 같은 boundary face와 opening profile을 소비하게 하고 실제 절단 깊이를 단면에서 대조한다.
-->

[공유 기준선](building.md#plan-datums)이 두께와 접면을 정하고 이 파일은 각 물리 경계의 ID·인접 관계·void를 소유한다. 외벽 실체는 해당 입면 source가 만들고 내부벽 실체는 `src/spaces/boundaries.ts`가 만든다. 방 파일은 그 벽의 자기 쪽 표면을 참조할 뿐 두 번째 벽을 생성하지 않는다. 같은 벽에 뚫린 문·창은 이 경계의 절단 결과를 내·외부에서 함께 쓴다. 문짝이나 틀을 붙였다고 void가 생겼다고 세지 않는다.

`boundary-sanctuary-south`는 sanctuary-front~north-ring, `boundary-west-spine`은 west-room~west-ring, `boundary-east-spine`은 east-ring~east-room이다. 서측 spine은 북쪽에서 봉헌실/제실, 남쪽에서 봉헌실/주랑을 가르므로 인접 공간이 바뀌는 지점에서 topology 구간을 나누되 물리 접합은 끊지 않는다. 동측 spine도 제실/마당, 주랑/마당, 주랑/세 업무방으로 인접성을 구별한다. 오른쪽의 세 가로 벽은 yard-front~storage-back, storage-front~records-back, records-front~office-back이다. 정문 후퇴벽은 entrance-back~entrance-front이고 반환벽은 [현관](rooms/entrance.md#entrance-volume)의 양옆 경계다.

오른쪽 가로 경계의 안정 ID는 북쪽부터 `boundary-yard-storage`, `boundary-storage-records`, `boundary-records-office`다. 이들의 끝과 spine·외벽·현관의 맞닿음은 [벽 접합](junctions.md#wall-junctions)이 정한다. 외곽 모서리의 두 벽을 겹친 상자로 만들지 않으며 후퇴벽·반환벽은 남측 입면의 물리 소유다. 마당과 보관실 사이의 높은 지붕 끝은 [박공 폐쇄](junctions.md#gable-closures)를 소비한다.

공개 `IAutoMovieBuiltBoundary.face`에는 절단 전 host의 위치·회전·윤곽·두께를, `IAutoMovieBuiltOpening.profile`에는 그 host의 local XY로 표현한 실제 void를 배정한다. 문과 채광구의 profile은 네 꼭짓점의 직사각형이며 아래 각 절의 유효 치수와 해당 가장자리의 틀 두께에서 유도한다. profile 없는 관계 레코드를 물리 개구부로 세지 않는다. 실체 벽의 절단과 문틀·문짝 배치는 동일한 host/profile/ID를 소비하며 화면용 좌표나 구멍 목록을 별도로 만들지 않는다.

`builtBoundaryWallCut`은 opening ID를 보존하지만 host 윤곽도 외접 직사각형으로 환원한다. 직사각형 벽의 절단 입력에는 적용할 수 있으나 [박공](junctions.md#gable-closures)의 최종 윤곽을 대신하지 못한다. 두께 방향으로 단면이 일정한 벽은 공개 `extrudeAutoMovieRegion`에 실제 host 윤곽과 void를 반영한 영역을 전달하는 경로를 채택한다. 그 API는 바깥 윤곽과 닿는 hole을 거부하므로 실제 host 끝에 닿는 절단은 바깥 윤곽의 오목한 부분으로, 벽 안에 완전히 둘러싸인 절단은 내부 hole로 유도한다. 바닥 아래까지 연장한 벽에서는 문도 내부 hole일 수 있으므로 문/창 이름만으로 두 경우를 나누지 않는다. 이 형상 변환은 위의 profile과 [문턱 슬래브 예약](storey.md#threshold-support)에서 파생하고 새 문 위치나 유효 치수를 저작하지 않는다. 모서리 맞댐이나 벽 두께 안에서 달라지는 지붕 하부는 일정 단면 압출만으로 완료했다고 하지 않으며 기존 접합 소유에서 실제 닫힌 실체와 대조한다. 이 경로는 공개 API 조사에 근거한 설계이고 생성된 벽 mesh는 아직 없다.

관찰은 각 경계 양면과 모든 void의 단면을 짝으로 읽는다. 인접 공간이 잘못 연결되거나 문 한쪽에 벽이 남으면 실패다. 닫힌 경계에 보이지 않는 semantic 문을 만들지 않는다. 현재 이 선언은 설계이며 실체 절단은 unverified다.

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
@evidence principles/core/common.md#scope-preservation 제실의 높은 채광을 북·남 박공의 작은 구멍으로 남기고 출입구나 인접 방 연결로 바꾸지 않는다.
@evidence principles/core/common.md#substantive-completion window ID와 X=±1.0m, sill Y=4.6m, 유효 0.4×0.4m 및 틀/관통 벽 범위를 고른다.
@evidence principles/core/common.md#declared-basis 낮은 측벽 창과 sill Y=4.3m를 지붕 단면 충돌 때문에 폐기했으며 현재 값도 실측 아닌 설계 비교 결과로 한정한다.
@evidence principles/design/spaces.md#space-topology 제실 안에서 박공 바깥으로 열리도록 주랑 덮개 위로 옮기고 방 사이의 통로는 만들지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 창 위치는 이 owner, Z 관통 범위는 기준선, 위쪽 한계는 제실 roof에서 받아 처마 끝을 창 기준으로 대체하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 창 윗모서리와 roof 하부, reveal 깊이, 주랑 지붕 가림을 입면/실내 단면에서 함께 본다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 작은 상부 채광구라는 제실 설정에 roof 충돌을 피한 박공 위치와 실제 void 비례를 더한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work sanctuary의 상부 채광과 openings의 깊은 틀을 대조했다. 배치 후보를 높여 해결할 수 있으므로 창을 없애거나 부모 roof 높이를 바꿀 결함은 드러나지 않았다.
@evidence settings/30-interiors.md#sanctuary 노출 박공 내부에 필요한 높은 채광을 양쪽 박공 벽에서 확보한다.
@evidence settings/20-envelope.md#openings 작은 구멍도 유효 치수와 틀 두께를 분리하고 벽 두께를 관통하는 reveal로 다룬다.
-->

제실의 북·남 박공 벽에 각 두 개의 작은 채광구를 둔다. ID는 `window-sanctuary-{north|south}-{west|east}`이며 중심 X=±1.0m, 유효 폭 0.4m, sill Y=4.6m, 유효 높이 0.4m다. 석재 틀 두께는 각 가장자리 0.06m이고 유리는 없다. Z 방향 void는 [기준선](building.md#plan-datums)의 북측 벽 north-outer~north-inner와 남측 벽 sanctuary-front~north-ring을 각각 관통한다. [제실 지붕](roofs/sanctuary.md#sanctuary-roof)은 상부 한계를 제공하며 처마 끝선으로 창 위치를 옮기지 않는다. 문 인방 위에 있고 다른 방으로 연결되는 출입구가 아니다.

측면 낮은 벽의 창은 인접 봉헌실 지붕 높이와 겹치는 입력이므로 채택하지 않았다. 처음 제안한 박공 창의 sill Y=4.3m도 북쪽 주랑 지붕의 상단보다 낮아 폐기했다. 현재는 작은 창을 용마루 쪽으로 모으고 높여 덮개 위의 외부로 열리게 했다. 이것은 설계 단면 비교이며 실제 충돌 계측 결과가 아니다. 고정 공간 그래프는 바꾸지 않는다. 판정은 두 박공의 입면과 실내 단면에서 창 윗모서리가 지붕 하부에 닿지 않는지, 깊은 reveal이 읽히는지, 주랑 지붕에 가려 닫힌 구멍이 되지 않는지를 함께 본다. 프레임과 실제 채광은 unverified이며 개구부 개수만으로 밝기를 보증하지 않는다.

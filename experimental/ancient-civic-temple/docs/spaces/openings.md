# 실제 경계의 개구부

## 벽과 void의 단일 소유 {#boundary-ownership}

[공유 기준선](building.md#plan-datums)이 두께와 접면을 정하고 이 파일은 각 물리 경계의 ID·인접 관계·void를 소유한다. 외벽 실체는 해당 입면 source가 만들고 내부벽 실체는 `src/spaces/boundaries.ts`가 만든다. 방 파일은 그 벽의 자기 쪽 표면을 참조할 뿐 두 번째 벽을 생성하지 않는다. 같은 벽에 뚫린 문·창은 이 경계의 절단 결과를 내·외부에서 함께 쓴다. 문짝이나 틀을 붙였다고 void가 생겼다고 세지 않는다.

`boundary-sanctuary-south`는 sanctuary-front~north-ring, `boundary-west-spine`은 west-room~west-ring, `boundary-east-spine`은 east-ring~east-room이다. 서측 spine은 북쪽에서 봉헌실/제실, 남쪽에서 봉헌실/주랑을 가르므로 인접 공간이 바뀌는 지점에서 topology 구간을 나누되 물리 접합은 끊지 않는다. 동측 spine도 제실/마당, 주랑/마당, 주랑/세 업무방으로 인접성을 구별한다. 오른쪽의 세 가로 벽은 yard-front~storage-back, storage-front~records-back, records-front~office-back이다. 정문 후퇴벽은 entrance-back~entrance-front이고 반환벽은 [현관](rooms/entrance.md#entrance-volume)의 양옆 경계다.

관찰은 각 경계 양면과 모든 void의 단면을 짝으로 읽는다. 인접 공간이 잘못 연결되거나 문 한쪽에 벽이 남으면 실패다. 닫힌 경계에 보이지 않는 semantic 문을 만들지 않는다. 현재 이 선언은 설계이며 실체 절단은 unverified다.

## 출입문의 명시 위치 {#doors}

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

## 높은 제실 채광구 {#clerestories}

제실의 북·남 박공 벽에 각 두 개의 작은 채광구를 둔다. ID는 `window-sanctuary-{north|south}-{west|east}`이며 중심 X=±1.0m, 유효 폭 0.4m, sill Y=4.6m, 유효 높이 0.4m다. 석재 틀 두께는 각 가장자리 0.06m이고 유리는 없다. Z 위치는 각각 [제실 지붕](roofs/sanctuary.md#sanctuary-roof)의 북·남 gable 경계에서 유도한다. 문 인방 위에 있고 다른 방으로 연결되는 출입구가 아니다.

측면 낮은 벽의 창은 인접 봉헌실 지붕 높이와 겹치는 입력이므로 채택하지 않았다. 처음 제안한 박공 창의 sill Y=4.3m도 북쪽 주랑 지붕의 상단보다 낮아 폐기했다. 현재는 작은 창을 용마루 쪽으로 모으고 높여 덮개 위의 외부로 열리게 했다. 이것은 설계 단면 비교이며 실제 충돌 계측 결과가 아니다. 고정 공간 그래프는 바꾸지 않는다. 판정은 두 박공의 입면과 실내 단면에서 창 윗모서리가 지붕 하부에 닿지 않는지, 깊은 reveal이 읽히는지, 주랑 지붕에 가려 닫힌 구멍이 되지 않는지를 함께 본다. 프레임과 실제 채광은 unverified이며 개구부 개수만으로 밝기를 보증하지 않는다.

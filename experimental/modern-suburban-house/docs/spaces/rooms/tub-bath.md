# 오른쪽 욕조 욕실

## 복도 끝에서 직접 들어가는 욕실 {#tub-bath-plan}
<!--
@evidence principles/core/common.md#scope-preservation tub-bathroom의 경계와 인접, 왼쪽 벽의 단일 문, 세 기구와 높은 흐린 창의 소비, 욕조까지의 경로 질문을 맡는다.
@evidence principles/core/common.md#substantive-completion 마감 안쪽 X = [3.22, 5.50], Z = [-8.80, -4.71] m, hall-tub-door Z = [-5.86, -4.86] m와 유효 폭 0.90 m를 정한다.
@evidence principles/core/common.md#declared-basis 뒤쪽으로 긴 순내부 2.28 × 4.09 m와 기구 예약을 욕조 겸 샤워·변기·세면장 배치 근거로 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "상층 복도에 자기 문을 가진 두 번째 욕실"을 +Z 문설주 경첩·방 안 +X 열림의 문과 샤워 욕실과 벽을 사이에 둔 독립 실로 만든다.
@evidence principles/design/spaces.md#space-topology 왼쪽 벽의 앞 부분은 복도, 뒤 부분은 샤워 욕실에 닿고 샤워 욕실·침실 쪽에는 통과문이 없다.
@evidence principles/design/spaces.md#space-boundary-authority 오른쪽 외벽 창은 tub-right-window에서 소비하고 이 방에만 바인딩한다.
@evidence principles/design/spaces.md#space-verification-address 변기나 세면장을 넘지 않고 욕조에 닿는 경로, 창의 접근/프라이버시, 모든 구석과 부재 읽힘을 검사한다.
@evidence settings/10-house.md#tub-bathroom 샤워 욕실과 벽을 사이에 둔 독립 욕실로 두고 한 실의 좌우 구역으로 합치지 않는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work tub-bathroom의 자기 문·독립 실·욕조 접근 조건을 대조했고 복도에 닿는 왼쪽 벽의 hall-tub-door와 샤워 욕실·침실 쪽 통과문 없는 독립 실로 성립해 부모 수정이 없었다.
-->

`tub-bathroom`은 upper-storey의 오른쪽 독립 욕실이다. 마감 안쪽 X = [3.22, 5.50], Z = [-8.80, -4.71] m다. 오른쪽은 본채 외벽, 앞쪽은 청회색 침실과 Z = [-4.71, -4.56]의 벽, 뒤쪽은 옷방과 Z = [-8.95, -8.80]의 벽이다. 왼쪽 X = [3.07, 3.22]의 벽은 앞 부분에서 [복도](upper-hall.md#upper-hall-plan), 뒤 부분에서 [샤워 욕실](shower-bath.md#shower-bath-plan)에 닿는다.

`hall-tub-door`는 이 왼쪽 벽의 Z = [-5.86, -4.86], Y = [3.06, 5.26] m를 거친 개구부로 만든다. 유효 폭 0.90 m를 목표로 하고 +Z 문설주 경첩에서 방 안 +X 방향으로 연다. 샤워 욕실과 침실 쪽에는 통과문을 만들지 않는다.

[욕조 겸 샤워·변기·세면장](../../settings/10-house.md#tub-bathroom)은 뒤쪽으로 긴 순내부 2.28 × 4.09 m와 [기구 사용 예약](#tub-fixture-use)을 소비한다. 오른쪽 외벽의 [tub-right-window](../envelope/right.md#tub-right-window)는 차고 뒤 지붕을 피한 높은 흐린 창으로 이 방에만 바인딩한다. 실제 창호와 기구 부재는 아직 미완료다. `src/spaces/rooms/tub-bath.ts`가 소유한다. 변기나 세면장을 넘지 않고 욕조에 닿는 경로, 창의 접근/프라이버시·문/창의 실제 방 binding, 모든 구석과 부재 읽힘은 unverified다.

## 긴 욕실의 세 기구와 창 {#tub-fixture-use}
<!--
@evidence principles/core/common.md#scope-preservation 세면장·변기·욕조의 몸체와 사용, 왼쪽 주 경로, 수건걸이, 거울, 수전과 커튼 레일, 창 조작과 폐기한 수건 예약을 맡는다.
@evidence principles/core/common.md#substantive-completion 세 기구 표와 주 경로 X = [3.32, 4.22], Z = [-8.70, -5.00] m, 수건걸이 Z = [-6.85, -6.10] m, 커튼 레일 X = 4.62 m·높이 2.05 m를 정한다.
@evidence principles/core/common.md#declared-basis 종전 수건 예약 Z = [-5.85, -5.00] m는 실문 개구부 안이라 지지 벽이 없어 폐기했다는 근거를 남긴다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "출입과 욕조 접근은 변기나 세면장을 넘어가지 않고"를 오른쪽 기구 열과 왼쪽 통행 띠의 분리로 만든다.
@evidence principles/design/spaces.md#space-topology 실문을 연 뒤 왼쪽 띠로 욕조에 접근하고 기구를 넘거나 다른 방을 통해 돌아오지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 수건걸이는 interior-boundary-junctions의 실제 벽/개구부 인계를 소비해 문 뒤 닫힌 구간에 둔다.
@evidence principles/design/spaces.md#space-verification-address 기구 위에 올라서야 가능한 창 조작을 합격으로 처리하지 않고 커튼을 펴거나 걷은 프라이버시와 두 방향 진입을 검사한다.
@evidence settings/10-house.md#tub-bathroom 욕조 가장자리 높이 0.55 m, 뒤쪽 끝의 욕조 수전/샤워기, X = 4.62 m의 커튼 레일과 뒤쪽 끝에 모으는 커튼, 세면장 위 거울, 문 뒤 닫힌 구간의 수건걸이를 공간 예약으로 둔다.
@evidence settings/00-production.md#use-profile 실제 문/기구/수전/커튼·창·수건을 소비한 평면과 단면에서 같은 사용체로 경로를 검사한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work tub-bathroom의 기구 목록·비넘김 경로와 use-profile을 오른쪽 기구 열과 왼쪽 주 경로 X = [3.32, 4.22] m에 적용했고 수건걸이를 문 뒤 닫힌 구간 Z = [-6.85, -6.10] m로 옮겨 이 H2 안에서 해결해 부모 수정이 없었다.
-->

같은 tub-bathroom/upper-storey의 오른쪽에 [욕조 욕실 설정](../../settings/10-house.md#tub-bathroom)의 세면장·변기·욕조를 앞에서부터 놓고 왼쪽 바닥으로 잇는다. 아래 world X/Z m의 오른쪽 끝은 모두 [방 안쪽 면](#tub-bath-plan)이며 높이는 상층 완성 바닥 기준이다. 표의 몸체와 사용은 별개 점유다.

| 기구 | 몸체 예약 | 사용과 높이 |
| --- | --- | --- |
| 세면장 | X는 4.95 m부터 오른쪽 면, Z = [-5.75, -4.90] | 상면 0.85 m, -X 전면. 앞 사용 X = [4.30, 4.95], Z = [-5.70, -4.95] m. |
| 변기 | X는 4.75 m부터 오른쪽 면, Z = [-6.65, -5.95] | 좌면 0.43 m·최대 높이 0.82 m, -X 전면. 앞 사용 X = [4.25, 4.75], Z = [-6.60, -6.00] m. |
| 욕조 겸 샤워 | X는 4.70 m부터 오른쪽 면, Z = [-8.70, -6.90] | 가장자리 높이 0.55 m. 긴 -X 면 앞 사용 X = [3.65, 4.70], Z = [-8.55, -7.00] m. |

주 경로는 X = [3.32, 4.22], Z = [-8.70, -5.00] m의 왼쪽 띠다. 실문을 90° 연 뒤 세면장/변기 앞 작업과 구별된 이 띠로 욕조에 접근한다. 문 회전 중에는 먼저 기다린 뒤 통과한다. 욕조 앞 사용은 경로의 끝 목적지이고 기구를 넘어가거나 다른 방을 통해 돌아오지 않는다. 수건걸이는 왼쪽 벽의 문 뒤 닫힌 구간 Z = [-6.85, -6.10] m, 높이 1.10–1.50 m에 둔다. 걸린 수건·받침까지 벽 안쪽 면에서 최대 0.08 m 돌출 안에 담아 왼쪽 통행 띠와 분리한다. 종전 Z = [-5.85, -5.00] m 예약은 실문 개구부 안에 있어 지지 벽이 없으므로 폐기했다. [실제 벽/개구부 인계](../07-boundary-assembly.md#interior-boundary-junctions)를 소비하며, 원래 문설주·문틀/열린 문짝과의 분리 및 전신 통행은 부재 이후 다시 읽는다. 수건을 꺼내는 동안의 점유는 통과 상태와 구별한다.

세면장 위 거울은 같은 오른쪽 벽의 세면장 Z 폭, 높이 1.10–1.90 m에서 돌출 0.04 m 이내다. 욕조 수전/샤워기는 뒤쪽 끝에, 커튼 레일은 X = 4.62 m에서 욕조의 Z 길이를 따라 높이 2.05 m에 두고, 열린 커튼은 뒤쪽 끝 0.25 m 안에 모은다. [높은 흐린 창](../envelope/right.md#tub-right-window)의 실제 열림과 손잡이 접근, 커튼을 펴거나 걷었을 때의 프라이버시를 함께 검사하며 기구 위에 올라서야 가능한 창 조작을 합격으로 처리하지 않는다.

[사용체](../../settings/00-production.md#use-profile), 실제 문/기구/수전/커튼·창·수건을 소비한 평면과 단면, 두 방향 진입과 각 기능, 02의 욕조 욕실과 방 전체 시야를 [관찰 owner](../04-observations.md#spatial-observation-derivation)가 검사한다. 도기·유리·타일/카펫 경계의 원형·재료 구현과 물/급배수 성능은 이 공간 입력의 결과가 아니다. 실제 순폭·충돌·창 조작·프레임은 unverified다.

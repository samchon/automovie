# 외부 개구부의 실내외 인계

## 거친 개구부와 충전 부재의 경계 {#external-opening-interface}
<!--
@evidence principles/core/common.md#scope-preservation 외벽 거친 개구부의 좌표 형식과 소유, 벽 절단 인계, trim·창틀 깊이·창대 돌출 예약, 방별 창 작동 종류와 기준 상태, 관찰을 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 세계 좌표 형식, 네 입면 좌표 owner, 벽 절단 조건, 0.10·0.04·0.14·0.06 m 예약, 방별 창 종류와 닫힌 기준 상태, 04-observations 검사 주소 문단을 대조해 외부 개구부 범위에 빈 owner가 없음을 확인했다.
@evidence principles/core/common.md#substantive-completion 외부 trim을 거친 개구부 둘레 0.10 m 이내로, 창틀 바깥 면을 날씨 면에서 0.04 m 물린 깊이 0.14 m 안에, 창대·손잡이 안쪽 돌출을 0.06 m 이내로 예약하고 방·창 종류별 작동 방식을 정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 trim 0.10 m, 날씨 면에서 0.04 m 물린 0.14 m 창틀 깊이, 0.06 m 안쪽 돌출, 상하 미닫이·고정·상부 경첩 배정을 대조해 다음 층이 창 깊이나 작동 종류를 새로 정할 필요가 없음을 확인했다.
@evidence principles/core/common.md#declared-basis 방 연결은 05, 지붕 높이는 roof-profile-datums, 벽 두께 방향은 본채/차고 외곽에서 받고 builtBoundaryWallCut·extrudeAutoMovieRegion 적용 조건은 공개 API를 읽고 정한 인계이며 실제 절단 결과가 아니라고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 05 방 연결·roof-profile-datums·00-building 외곽 인용과, builtBoundaryWallCut의 bounding 직사각 반환과 local Z 절반 압출이 공개 API 판독에 따른 unverified 인계라는 문장을 대조해 근거 추적을 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation openings 설정의 두께 있는 frame·sash·유리를 외벽 두께 안의 충전 위치와 상하 미닫이·고정·상부 경첩 작동 종류로 정한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 settings openings의 두께 있는 frame·sash·유리 요구에 본문이 날씨 면에서 0.04 m 물린 0.14 m 깊이의 충전 위치와 방별 상하 미닫이·고정·상부 경첩 종류를 더했음을 대조해 부모에 없던 결정을 확인했다.
@evidence principles/design/spaces.md#space-topology 각 입면 void가 방 안쪽 reveal까지 관통하고 문짝 상부 유리를 별도 외벽 구멍으로 세지 않으며 기준 상태에서 외부 문과 모든 창을 닫는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 입면 void가 외곽 안쪽 면까지 관통하고 문짝 상부 유리를 그 문짝의 충전으로 세며 외부 문과 모든 창이 기준 상태에서 닫힌다는 문장을 대조해 안팎 관계와 개구부 개수가 메쉬 없이 복원됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 개구부 좌표는 네 입면 owner, front-door만 entry owner가 소유하고 방은 같은 id의 reveal만 맡으며 openings.ts는 입면 geometry를 가져가지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 전면·후면·왼쪽·오른쪽 입면 H2와 rooms/entry의 front-door만 좌표를 갖고 방은 같은 id의 reveal, openings.ts는 공통 예약만 맡는지 대조해 창 좌표가 두 곳에서 저작되지 않음을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 방 안쪽 reveal에서 외벽 void를 지나는 단면, 닫힌 충전의 정면/측면, 문 열림과 대기로 거친 폭과 순폭을 구별하게 한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 안쪽 reveal에서 같은 외벽 void를 지나는 단면, 닫힌 충전 정면/측면, 문 열림과 대기, 거친 폭에서 프레임·문짝·손잡이 점유를 뺀 순폭 판정을 대조해 창·문 주장마다 반증 관찰이 지정됨을 확인했다.
@evidence settings/10-house.md#openings 사각 구멍으로 창호를 대신하지 않도록 벽·틀·유리·살대의 깊이와 충전을 분리한다.
@evidenceReview settings/10-house.md#openings #5663f6c settings openings의 두께 있는 frame·sash·유리·살대 요구를 0.14 m 창틀 깊이, 유효 폭과 분할 수에서의 frame/sash/mullion 반복, 유리를 검은 판으로 대신하지 않는 문장에 대조해 사각 구멍 대체가 없음을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work openings의 "창을 배정한 방과 그 창을 품은 외벽이 같아야 한다"와 "유리는 구멍도 불투명 검은 판도 아니며"를 공통 예약에 대조했고 외벽 두께 안의 충전으로 둘 다 성립해 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 openings의 방-외벽 일치와 유리 요구를 네 입면 owner 좌표를 방이 같은 id로 소비하는 규칙과 0.14 m 깊이 충전 예약에 대조해 부모 수정 없이 둘 다 성립함을 확인했다.
@evidence obligations/design/spaces.md#space-envelope-interface 입면 owner가 거친 개구부 좌표를, 방 owner가 같은 id의 안쪽 reveal을 소유하게 하고 창틀을 날씨 면에서 0.04 m 물린 깊이 0.14 m 안에 두어 안팎이 같은 void를 쓰게 한다.
@evidenceReview obligations/design/spaces.md#space-envelope-interface #4b397de 각 입면 H2의 세계 좌표 void가 본채/차고 외곽 안쪽 면부터 바깥 면까지 관통하고 방 owner가 같은 id의 reveal만 소비하는지 대조해 실내외가 한 개구부를 다르게 기술할 여지가 없음을 확인했다.
-->

외부 개구부는 [방 연결](05-route-network.md#room-route-network)과 [지붕 높이](roof/00-junctions.md#roof-profile-datums)를 소비한다. 각 입면의 개구부 H2는 실제 외벽에 만들 거친 직사각 개구부의 세계 좌표 입력이다. X 또는 Z 구간이 수평 폭이고 Y 구간이 바닥 기준이 아닌 세계 높이다. 벽 두께 방향은 [본채](00-building.md#main-building-extent)/[차고](00-building.md#attached-garage-extent) 외곽의 안쪽 면부터 바깥 면까지 관통한다. 여기서 예정한 id·위치·개수는 compiled 산출물이 아니다.

전면·후면·왼쪽·오른쪽의 개구부 좌표는 각각 [전면](envelope/front.md#front-openings), [후면](envelope/rear.md#rear-openings), [왼쪽](envelope/left.md#left-openings), [오른쪽](envelope/right.md#right-openings) 입면 owner가 소유한다. 기존 front-door만 [현관](rooms/entry.md#entry-plan)의 결정을 그대로 받는다. 방 owner는 같은 id와 void를 소비하고 안쪽 마감/reveal을 맡으며 창을 독립 좌표로 복제하지 않는다. 입면은 한 묶음창의 수직 분할 수를 선언하고 frame/sash/mullion은 유효 폭과 분할 수에서 반복 산출한다. 문짝 속 상부 유리는 그 문짝의 충전 부재이며 별도의 외벽 구멍으로 세지 않는다.

후속 실제 벽은 같은 boundary의 면 윤곽과 opening profile에서 생성한다. 설치된 `builtBoundaryWallCut`은 면과 개구부를 각각 감싸는 직사각형으로 반환하므로 직사각 벽/void에만 그대로 적용할 수 있다. 박공이나 오목한 벽의 원래 윤곽을 그 bounding panel로 바꾸지 않는다. `extrudeAutoMovieRegion`에 전달할 때 벽 내부에 완전히 들어가는 창은 내부 ring, 벽 바닥까지 닿는 문은 외곽선의 열린 패임으로 표현한다. 서로 닿는 outer/hole ring을 입력하거나 얇은 가짜 문턱 벽을 남겨 통과시키지 않는다. 압출은 local Z의 양쪽 절반에 생성되지만 boundary 두께는 local +Z 방향이므로, 같은 face의 origin·rotation과 두께 절반의 이동으로 실제 벽 구간을 맞춘다. 이는 공개 API를 읽고 정한 인계 조건이며 실제 절단·배치 결과는 unverified다.

공통 공간 예약으로 외부 trim은 거친 개구부의 좌우/위쪽에서 0.10 m 이내, 창 아래에서도 0.10 m 이내로 택한다. 출입문 아래에는 바닥을 막는 같은 폭의 trim을 돌리지 않는다. 창 frame의 바깥쪽 면은 외벽 날씨 면에서 실내로 0.04 m 물리고 깊이 0.14 m 안에 frame·sash·유리를 배치한다. 이는 벽 안의 창틀 깊이를 확보하는 예약이며 아직 실제 부재 적층은 아니다. 창대와 손잡이가 안쪽 마감 면에서 돌출하는 양은 0.06 m 이내로 예약하고 창 앞 사용 공간 검사에 포함한다. 유리를 검은 불투명 판으로 대신하지 않는다.

거실·침실·주방·가족실의 수직 창은 상하 미닫이 sash, 작은 계단 창은 고정창, 높은 욕실 창은 흐린 유리의 상부 경첩창, 차고 측면은 고정창으로 택한다. 기준 상태에서 외부 문과 모든 창은 닫힌다. 통행 순폭은 거친 폭에서 프레임·열린 문짝·손잡이의 실제 점유를 뺀 산출값으로 판단하며 거친 폭만으로 합격을 주장하지 않는다. 창의 개폐·프라이버시·채광은 실제 부재/시야/조명 이후 unverified다. 이 배치는 피난·환기·열·구조 규정 적합성의 주장이 아니다.

`src/spaces/openings.ts`는 위 공통 예약과 방/입면의 인계 형식을 제공할 예정이고 완결 입면 geometry를 가져가지는 않는다. 모든 실제 개구부와 충전 부재는 [전체 관찰](04-observations.md#spatial-observation-derivation)에 포함한다. 검사 주소는 각 방의 안쪽 reveal에서 같은 외벽 void를 통과한 단면, 닫힌 충전 부재의 정면/측면, 문 열림과 문 앞 대기, 전체 입면 및 모든 내부 관찰이다. 실제 host/storey/room binding·void·부재·GPU 읽힘은 unverified다.

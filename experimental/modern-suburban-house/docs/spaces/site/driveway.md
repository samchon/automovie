# 빈 차고 앞의 진입 차도

## 차고 문턱으로 오르는 차도 {#driveway-plan}
<!--
@evidence principles/core/common.md#scope-preservation 차고 앞 차도의 경계, 경사 상면식, 문턱과의 비중복, 식재 제외 여유, 차량 배제, owner와 관찰을 맡는다.
@evidence principles/core/common.md#substantive-completion X 범위를 차고 거친 문 개구부 양쪽에 0.20 m씩 더해 정하고 `D(Z) = (1 - u) × 차고 바닥 Y + u × 앞 보행길 Y`로 상면을 정한다.
@evidence principles/core/common.md#declared-basis 두 끝 높이는 ground-threshold-datums의 차고 바닥과 앞 보행길, 끝선은 garage-front-opening과 site-access-interface에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation "차고 진입 콘크리트 차도"를 측방 경사 없는 선형 보간면과 양옆 연결로 접속으로 만든다.
@evidence principles/design/spaces.md#space-topology driveway가 뒤쪽 차고문 바깥 벽면, 앞쪽 포장 끝, 왼쪽 현관 연결로, 오른쪽 관리길 연결로에 열리고 그 밖의 가장자리는 지표와 만난다.
@evidence principles/design/spaces.md#space-boundary-authority 외벽 두께 안의 문턱 바닥은 차고 바닥 owner가 연장하고 차도는 그 선에서 끝나 바닥이 겹치지 않는다.
@evidence principles/design/spaces.md#space-verification-address 차고 문턱, 양옆 문설주, 연결로 접점과 바깥 포트의 종횡 단면으로 경사/폭/연결 높이를 반증한다.
@evidence settings/10-house.md#garage 차도를 차고와 함께 완성하되 자동차·주차 표시·가짜 실루엣을 넣지 않는다.
@evidence settings/10-house.md#site-identity 차고 진입 콘크리트 차도를 앞 보도 쪽 끝까지 잇는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work garage의 차도·차량 금지와 site-identity의 콘크리트 차도를 두 datum 사이 경사에 적용했고 측량/주행성 주장 없이 성립해 부모 수정이 없었다.
-->

`driveway`는 house-site/ground-storey의 외부 포장 구역이다. 뒤쪽은 [garage-front-door](../envelope/front.md#garage-front-opening)의 바깥 벽면, 앞쪽은 [전면 포장 끝](00-access.md#site-access-interface), 왼쪽은 [현관 가로 연결로](front-walk.md#front-walk-plan), 오른쪽은 [측면 관리길의 앞 연결로](side-walk.md#side-walk-plan)에 열린다. X 범위는 차고의 거친 문 개구부 양쪽에 각각 0.20 m를 더해 정한다. 문과 다른 중심을 따로 저작하지 않는다. 두 연결로 밖의 우측/좌측 가장자리는 지표와 만나는 경계이며 별도 도로로 연결하지 않는다.

상면 D(Z)는 차고 쪽 끝의 [차고 완성 바닥](../01-storeys.md#ground-threshold-datums)과 앞쪽 끝의 같은 owner가 정한 보행길 높이를 선형 보간한다. `u = (Z - 차고문 바깥 Z) / (전면 포장 끝 Z - 차고문 바깥 Z)`, `D(Z) = (1 - u) × 차고 바닥 Y + u × 앞 보행길 Y`다. 측방 경사는 추가하지 않는다. 외벽 두께 안의 문턱 바닥은 차고 바닥 owner가 바깥 벽면까지 연장하고 차도는 그 선에서 끝나므로 바닥이 겹치지 않는다. 거친 문 폭과 최종 문틀/레일을 뺀 순폭을 구별한다.

이 경사는 기존 두 바닥을 연결하는 저작 치수이며 지리적 측량·배수 성능·차량 주행성의 검증값이 아니다. 문은 기준 상태에서 닫고 [빈 차고](../rooms/garage-interior.md#garage-interior-plan)의 관찰은 머드룸에서 한다. 차량·주차 표시·가짜 실루엣을 넣지 않는다. 차도/연결로 위에는 식재나 수납을 배치하지 않으며 양옆에 0.20 m의 식재 점유 제외 여유를 남긴다. 외부 보도와 도로로의 접속은 map/space 인터페이스 미완료로 남긴다.

완결 차도 상면과 가장자리 owner는 `src/spaces/site/driveway.ts`다. 바탕은 [차도 두께 예약](01-paving-support.md#paving-depth-reservation)과 [보행길 접촉](01-paving-support.md#paving-contact-handoff)을 소비한다. 줄눈·재료는 같은 면의 후속 저작이며 임의 사각 패치를 복제하지 않는다. 차고 문턱, 양옆 문설주, 연결로 접점과 바깥 포트의 종횡 단면을 [전체 관찰](../04-observations.md#spatial-observation-derivation)에 넣는다. 최종 표면의 경사/폭/연결 높이, 열린 문 기구와의 간섭, 콘크리트와 그림자·01의 읽힘은 unverified다.

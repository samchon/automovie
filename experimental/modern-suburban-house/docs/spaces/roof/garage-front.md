# 차고의 낮은 전방 지붕

## 패널문 위의 경사면 {#garage-front-roof}
<!--
@evidence principles/core/common.md#scope-preservation 차고 지붕 앞 절반의 날씨 면·아래면, 공유 벽 바깥 접합, 닫힌 패널문과 레일을 위한 내부 높이 유지를 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 roof.garage.front가 Gfront 앞 절반 날씨 면·아래면, 본채 공유 벽 바깥 지붕 접합, 닫힌 패널문·레일을 위한 ground-threshold-datums 내부 높이 유지를 garage-front.ts 범위에 담음을 확인했다.
@evidence principles/core/common.md#substantive-completion Gfront를 이 면에 적용하고 앞 처마·뒤 낮은 용마루·오른쪽 차고 박공·왼쪽 공유 벽 바깥 접합의 경계를 정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 본문의 Gfront와 차고 정면 처마·뒤 낮은 용마루·오른쪽 차고 박공·본채 공유 벽 바깥 접합을 대조해 차고 앞 면의 네 경계가 하나의 경사면으로 닫혀 하위가 윤곽을 새로 정하지 않아도 됨을 확인했다.
@evidence principles/core/common.md#declared-basis 영역은 roof-mass-allocation, 높이는 roof-profile-datums, 차고 내부 높이는 ground-threshold-datums에서 받는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 차고 앞 면의 영역·Gfront·내부 높이가 roof-mass-allocation·roof-profile-datums·01-storeys#ground-threshold-datums 링크에, 문·레일 예약이 front.md#garage-front-opening에 근거함을 대조했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 낮은 차고 박공의 앞 면을 본채 안으로 기울어진 판이 들어오지 않는 공유 벽 바깥 접합과 패널문 위 처마로 정한다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 00이 차고 영역을 공유 벽 바깥에서 끝낸 데 더해 이 H2가 머드룸 천장 관통 판 금지, 패널문 위 정면 처마, 문·레일 예약과의 대조를 앞 면 결정으로 더함을 확인했다.
@evidence principles/design/spaces.md#space-topology 지붕판이 본채 공유 벽 바깥에서 끝나 머드룸 천장을 관통하지 않고 앞 처마 아래에 닫힌 패널문이 있는 차고 정면이 온다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 첫 문단의 왼쪽 경계와 마지막 문장, 둘째 문단의 앞 처마 아래 정면 벽을 대조해 roof.garage.front가 본채 안으로 들어가지 않고 머드룸 천장·닫힌 패널문과의 안팎 관계가 명시됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 높이는 Gfront에서 받고 패널문 개구부·상부 가이드·수직 레일의 예약은 garage-front-opening에서 받아 이 면 아래와 대조한다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 패널문 개구부·상부 가이드·수직 레일 예약을 front.md#garage-front-opening에서 받아 Gfront 아래와 대조만 하고 차고 앞 면 본문이 그 좌표를 다시 적지 않아 문·레일 예약의 owner가 하나로 유지됨을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 차고 정면, 본채 벽 접합의 앞 끝, 지붕/문/천장 단면을 차고문을 제거하지 않은 상태로 검사하게 한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 검사 주소인 차고 정면, 본채 벽 접합의 앞 끝, 지붕/문/천장 단면과 '차고문을 제거한 빈 공간으로 검사하지 않는다'를 대조해 차고 앞 면의 반증 관찰이 닫힌 문 기준으로 지정됨을 확인했다.
@evidence settings/10-house.md#garage 낮은 박공 아래에서 닫힌 패널문과 내부 레일 높이를 유지한다.
@evidenceReview settings/10-house.md#garage #261be15 설정 garage의 낮은 박공 지붕, 문 레일/상부 구조, 닫힌 차고문 기준을 본문의 기존 datum 유지, garage-front-opening 예약 대조, 문 제거 검사 금지에 대조해 차고 앞 면의 이행을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work garage의 "낮은 박공 지붕"과 "차고문은 닫힌 기준 상태"를 앞 면에 대조했고 Gfront 아래에 닫힌 문과 레일 높이가 남아 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 설정 garage의 닫힌 차고문 기준과 낮은 박공을 Gfront 앞 면 아래의 ground-threshold-datums 내부 높이·문·레일 예약 대조에 적용해 부모와 충돌이 없어 설정 수정이 필요 없음을 확인했다.
-->

`roof.garage.front`는 [차고 지붕 영역](00-junctions.md#roof-mass-allocation)의 앞 절반이다. [Gfront](00-junctions.md#roof-profile-datums)의 날씨 면과 아래면을 `src/spaces/roof/garage-front.ts`가 소유한다. 앞은 차고 정면 처마, 뒤는 낮은 용마루, 오른쪽은 차고 박공, 왼쪽은 본채 공유 벽 바깥의 지붕 접합이다. 본채 안에 기울어진 지붕판이 남아 머드룸 천장을 관통하지 않는다.

닫힌 패널문과 레일을 위한 차고 내부 높이는 [기존 datum](../01-storeys.md#ground-threshold-datums)을 유지한다. 앞 처마 아래 차고 정면 벽의 패널문 개구부와 상부 가이드·수직 레일의 예약은 [닫힌 차고문과 상부 이동 예약](../envelope/front.md#garage-front-opening)에서 받아 이 지붕 아래와 대조한다. 검사 주소는 차고 정면, 본채 벽 접합의 앞 끝과 지붕/문/천장 단면이다. 차고문을 제거한 빈 공간으로 검사하지 않는다. 실제 부재 간섭·머드룸 문 연계·렌더는 unverified다.

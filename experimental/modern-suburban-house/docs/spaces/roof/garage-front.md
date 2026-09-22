# 차고의 낮은 전방 지붕

## 패널문 위의 경사면 {#garage-front-roof}
<!--
@evidence principles/core/common.md#scope-preservation 패널문 위 차고 앞 지붕과 본채 접합을 배정한다.
@evidence principles/core/common.md#substantive-completion Gfront를 차고 앞 절반에 적용한다.
@evidence principles/core/common.md#declared-basis 차고 영역과 낮은 천장 datum을 공통 owner에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 낮은 차고 요구를 정면 처마·오른쪽 박공·서쪽 벽 접합으로 나눈다.
@evidence principles/design/spaces.md#space-topology 지붕판이 본채 내부 머드룸 천장을 관통하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 차고 전방 면과 아래면은 garage-front.ts가 통합한다.
@evidence principles/design/spaces.md#space-verification-address 문을 제거하지 않고 지붕/문/레일/천장 단면을 검사한다.
@evidence settings/10-house.md#garage 낮은 박공 아래에서 닫힌 패널문과 내부 레일 높이를 유지한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 빈 차고의 닫힌 문 기준과 낮은 지붕을 함께 검사할 수 있어 부모 상태나 외곽 변경은 없다.
-->

`roof.garage.front`는 [차고 지붕 영역](00-junctions.md#roof-mass-allocation)의 앞 절반이다. [Gfront](00-junctions.md#roof-profile-datums)의 날씨 면과 아래면을 `src/spaces/roof/garage-front.ts`가 소유한다. 앞은 차고 정면 처마, 뒤는 낮은 용마루, 오른쪽은 차고 박공, 왼쪽은 본채 공유 벽 바깥의 지붕 접합이다. 본채 안에 기울어진 지붕판이 남아 머드룸 천장을 관통하지 않는다.

닫힌 패널문과 레일을 위한 차고 내부 높이는 [기존 datum](../01-storeys.md#ground-threshold-datums)을 유지한다. 패널문·상인방·레일의 실제 예약은 다음 개구부/부재 배치에서 이 지붕 아래와 대조한다. 검사 주소는 차고 정면, 본채 벽 접합의 앞 끝과 지붕/문/천장 단면이다. 차고문을 제거한 빈 공간으로 검사하지 않는다. 실제 부재 간섭·머드룸 문 연계·렌더는 unverified다.

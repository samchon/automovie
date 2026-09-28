# 차고의 낮은 전방 지붕

## 패널문 위의 경사면 {#garage-front-roof}
<!--
@evidence principles/core/common.md#scope-preservation 차고 지붕 앞 절반의 날씨 면·아래면, 공유 벽 바깥 접합, 닫힌 패널문과 레일을 위한 내부 높이 유지를 맡는다.
@evidence principles/core/common.md#substantive-completion Gfront를 이 면에 적용하고 앞 처마·뒤 낮은 용마루·오른쪽 차고 박공·왼쪽 공유 벽 바깥 접합의 경계를 정한다.
@evidence principles/core/common.md#declared-basis 영역은 roof-mass-allocation, 높이는 roof-profile-datums, 차고 내부 높이는 ground-threshold-datums에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 00-junctions의 차고 지붕 경계, garage-front-opening의 문·가이드 예약, 03-surface-owners의 아래면 owner를 받아, 지붕·문·천장 단면에서 처마 아래면과 문 이동 예약을 함께 대조한다.
@evidence principles/design/spaces.md#space-topology 지붕판이 본채 공유 벽 바깥에서 끝나 머드룸 천장을 관통하지 않고 앞 처마 아래에 닫힌 패널문이 있는 차고 정면이 온다.
@evidence principles/design/spaces.md#space-boundary-authority 높이는 Gfront에서 받고 패널문 개구부·상부 가이드·수직 레일의 예약은 garage-front-opening에서 받아 이 면 아래와 대조한다.
@evidence principles/design/spaces.md#space-verification-address 차고 정면, 본채 벽 접합의 앞 끝, 지붕/문/천장 단면을 차고문을 제거하지 않은 상태로 검사하게 한다.
@evidence settings/10-house.md#garage 낮은 박공 아래에서 닫힌 패널문과 내부 레일 높이를 유지한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work garage의 "낮은 박공 지붕"과 "차고문은 닫힌 기준 상태"를 앞 면에 대조했고 Gfront 아래에 닫힌 문과 레일 높이가 남아 부모 수정이 없었다.
-->

`roof.garage.front`는 [차고 지붕 영역](00-junctions.md#roof-mass-allocation)의 앞 절반이다. [Gfront](00-junctions.md#roof-profile-datums)의 날씨 면과 아래면을 `src/spaces/roof/garage-front.ts`가 소유한다. 앞은 차고 정면 처마, 뒤는 낮은 용마루, 오른쪽은 차고 박공, 왼쪽은 본채 공유 벽 바깥의 지붕 접합이다. 본채 안에 기울어진 지붕판이 남아 머드룸 천장을 관통하지 않는다.

닫힌 패널문과 레일을 위한 차고 내부 높이는 [기존 datum](../01-storeys.md#ground-threshold-datums)을 유지한다. 앞 처마 아래 차고 정면 벽의 패널문 개구부와 상부 가이드·수직 레일의 예약은 [닫힌 차고문과 상부 이동 예약](../envelope/front.md#garage-front-opening)에서 받아 이 지붕 아래와 대조한다. 검사 주소는 차고 정면, 본채 벽 접합의 앞 끝과 지붕/문/천장 단면이다. 차고문을 제거한 빈 공간으로 검사하지 않는다. 실제 부재 간섭·머드룸 문 연계·렌더는 unverified다.

차고 앞 흰 처마 하부는 본채 공유 벽 바깥 접점의 앞 자유 처마에서 오른쪽 +X로 잰 거리를 U, 그 처마에서 차고 용마루 쪽 −Z로 올라간 실제 경사 거리를 V로 둔다. 지붕널 날씨 면은 [세계 경사 UV](../03-surface-owners.md#exterior-surface-handoff)를 유지한다. 차고 전면 처마·오른쪽 박공 사선의 노출 두께면 fascia는 각 자유 모서리의 사전식으로 작은 (X,Z) 끝에서 3차원 길이 U, 날씨 면에서 아래면까지 수직 두께 0.24 m를 V로 다시 시작한다. 본채 공유 벽 접합과 차고 용마루에서 면과 UV를 자르고 벽 속에 묻힌 fascia를 노출시키지 않는다.

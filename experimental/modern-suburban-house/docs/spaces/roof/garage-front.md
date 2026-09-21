# 차고의 낮은 전방 지붕

## 패널문 위의 경사면 {#garage-front-roof}

`roof.garage.front`는 [차고 지붕 영역](00-junctions.md#roof-mass-allocation)의 앞 절반이다. [Gfront](00-junctions.md#roof-profile-datums)의 날씨 면과 아래면을 `src/spaces/roof/garage-front.ts`가 소유한다. 앞은 차고 정면 처마, 뒤는 낮은 용마루, 오른쪽은 차고 박공, 왼쪽은 본채 공유 벽 바깥의 지붕 접합이다. 본채 안에 기울어진 지붕판이 남아 머드룸 천장을 관통하지 않는다.

닫힌 패널문과 레일을 위한 차고 내부 높이는 [기존 datum](../01-storeys.md#ground-threshold-datums)을 유지한다. 패널문·상인방·레일의 실제 예약은 다음 개구부/부재 배치에서 이 지붕 아래와 대조한다. 검사 주소는 차고 정면, 본채 벽 접합의 앞 끝과 지붕/문/천장 단면이다. 차고문을 제거한 빈 공간으로 검사하지 않는다. 실제 부재 간섭·머드룸 문 연계·렌더는 unverified다.

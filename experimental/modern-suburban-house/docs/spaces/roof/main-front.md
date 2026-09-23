# 주 지붕의 전방 경사면

## 전면 박공과 굴뚝을 받는 면 {#main-front-roof}
<!--
@evidence principles/core/common.md#scope-preservation 주 지붕 앞 절반에서 박공 우세 영역과 굴뚝 절단을 뺀 한 완결 경사면, 아래면, 자유 외곽 두께와 처마·홈통·지붕재가 소비할 공유 경계를 맡는다.
@evidence principles/core/common.md#substantive-completion 날씨 면과 아래면을 Mfront와 수직 두께로 정하고 골짜기·용마루에 겹치는 내부 막음판을 남기지 않는다.
@evidence principles/core/common.md#declared-basis 영역은 roof-mass-allocation, 높이는 roof-profile-datums, 박공 우세 영역과 굴뚝 절단은 roof-shared-edges에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 주 지붕 앞 면을 박공 합류와 굴뚝 절단 뒤에 남는 한 경사면으로 확정해 박공 아래에 가려진 판을 남기지 않는다.
@evidence principles/design/spaces.md#space-topology 이 면은 왼쪽에서 본채 측면, 뒤에서 주 용마루, 오른쪽에서 낮은 지붕 위의 단차, 앞에서 처마와 박공 합류에 닿고 지붕 아래는 방의 추가 바닥이나 통행 공간이 아니다.
@evidence principles/design/spaces.md#space-boundary-authority 골짜기 윤곽은 roof-shared-edges의 등고 경계를 소비하고 처마 끝·홈통·반복 지붕재도 그 공유 경계를 별도 좌표로 다시 만들지 않는다.
@evidence principles/design/spaces.md#space-verification-address 주 용마루에서 전면 처마로 내려오는 단면, 전면 박공 양쪽 골짜기, 굴뚝 옆 절단과 아래면을 검사하게 한다.
@evidence settings/10-house.md#main-mass 전면 교차 박공 뒤의 주 지붕을 중첩 없는 노출 면으로 유지한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work main-mass의 "골짜기와 합류부에 빈틈이나 중첩 지붕판을 남기지 않는다"와 living의 왼쪽 외벽 굴뚝을 앞 면에 대조했고 박공 우세 영역과 굴뚝 notch를 빼는 것으로 성립해 부모 수정이 없었다.
-->

`roof.main.front`의 owner는 `src/spaces/roof/main-front.ts`다. [주 지붕 영역](00-junctions.md#roof-mass-allocation)의 앞 절반과 자유 돌출을 받고, 날씨 면/아래면은 [Mfront와 수직 두께](00-junctions.md#roof-profile-datums)를 소비한다. 같은 면에서 [전면 박공의 우세 영역과 굴뚝 절단](00-junctions.md#roof-shared-edges)을 제외한다. 왼쪽은 본채 측면, 뒤는 주 용마루, 오른쪽은 낮은 지붕 위의 단차, 앞은 처마와 박공 합류다.

이 owner는 잘린 뒤의 한 완결 경사면과 아래면, 자유 외곽에서 둘을 잇는 두께를 소유한다. 골짜기/용마루에 겹치는 내부 막음판을 남기지 않는다. 처마 끝·홈통과 반복 지붕재는 이 면의 공유 경계를 소비하며 골짜기 윤곽을 별도 좌표로 다시 만들지 않는다. 지붕 아래는 방의 추가 바닥이나 통행 공간이 아니다.

검사 주소는 주 용마루에서 전면 처마로 내려오는 단면, 전면 박공 양쪽 골짜기, 굴뚝 옆 절단과 아래면이다. 실제 source·면 윤곽·접합 부재·재료와 그림자 읽힘은 unverified다.

# 주 지붕의 전방 경사면

## 전면 박공과 굴뚝을 받는 면 {#main-front-roof}
<!--
@evidence principles/core/common.md#scope-preservation 전면 박공과 굴뚝에 잘린 주 지붕·하부·자유 두께를 배정한다.
@evidence principles/core/common.md#substantive-completion 박공 우세 영역과 굴뚝 절단을 주 지붕 앞 절반에서 뺀다.
@evidence principles/core/common.md#declared-basis Mfront와 수직 두께를 공통 지붕 함수에서 소비한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 주 용마루 요구를 합류 뒤 남는 하나의 전방 경사면으로 분해한다.
@evidence principles/design/spaces.md#space-topology 왼쪽 측면·뒤 용마루·오른쪽 단차·앞 합류를 연결한다.
@evidence principles/design/spaces.md#space-boundary-authority 반복 지붕재도 같은 골짜기 윤곽을 받는다.
@evidence principles/design/spaces.md#space-verification-address 주 용마루 단면·양 골짜기·굴뚝 옆 절단을 검사한다.
@evidence settings/10-house.md#main-mass 전면 교차 박공 뒤의 주 지붕을 중첩 없는 노출 면으로 유지한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 주 용마루와 교차 박공의 설정을 우세 영역 분할로 실현할 수 있어 부모 매스를 바꾸지 않았다.
-->

`roof.main.front`의 owner는 `src/spaces/roof/main-front.ts`다. [주 지붕 영역](00-junctions.md#roof-mass-allocation)의 앞 절반과 자유 돌출을 받고, 날씨 면/아래면은 [Mfront와 수직 두께](00-junctions.md#roof-profile-datums)를 소비한다. 같은 면에서 [전면 박공의 우세 영역과 굴뚝 절단](00-junctions.md#roof-shared-edges)을 제외한다. 왼쪽은 본채 측면, 뒤는 주 용마루, 오른쪽은 낮은 지붕 위의 단차, 앞은 처마와 박공 합류다.

이 owner는 잘린 뒤의 한 완결 경사면과 아래면, 자유 외곽에서 둘을 잇는 두께를 소유한다. 골짜기/용마루에 겹치는 내부 막음판을 남기지 않는다. 처마 끝·홈통과 반복 지붕재는 이 면의 공유 경계를 소비하며 골짜기 윤곽을 별도 좌표로 다시 만들지 않는다. 지붕 아래는 방의 추가 바닥이나 통행 공간이 아니다.

검사 주소는 주 용마루에서 전면 처마로 내려오는 단면, 전면 박공 양쪽 골짜기, 굴뚝 옆 절단과 아래면이다. 실제 source·면 윤곽·접합 부재·재료와 그림자 읽힘은 unverified다.

# 주 지붕의 전방 경사면

## 전면 박공과 굴뚝을 받는 면 {#main-front-roof}
<!--
@evidence principles/core/common.md#scope-preservation 주 지붕 앞 절반에서 박공 우세 영역과 굴뚝 절단을 뺀 한 완결 경사면, 아래면, 자유 외곽 두께와 처마·홈통·지붕재가 소비할 공유 경계를 맡는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 첫 문단의 roof-shared-edges 제외 조항과 둘째 문단의 완결 면·아래면·두께 소유, 처마 끝·홈통·지붕재 소비 문장을 대조해 roof.main.front 범위의 각 요소가 main-front.ts에 배정됨을 확인했다.
@evidence principles/core/common.md#substantive-completion 날씨 면과 아래면을 Mfront와 수직 두께로 정하고 골짜기·용마루에 겹치는 내부 막음판을 남기지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 본문이 날씨 면을 Mfront, 아래면을 수직 두께로 정하고 자유 외곽 두께로 둘을 잇되 골짜기/용마루 내부 막음판을 배제해 주 지붕 앞 면 입체가 하위 발명 없이 완결됨을 확인했다.
@evidence principles/core/common.md#declared-basis 영역은 roof-mass-allocation, 높이는 roof-profile-datums, 박공 우세 영역과 굴뚝 절단은 roof-shared-edges에서 받는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 주 지붕 앞 면의 영역·Mfront·박공 우세 영역과 굴뚝 절단이 roof-mass-allocation·roof-profile-datums·roof-shared-edges 링크에, 굴뚝 위치가 설정 living에 근거함을 대조해 출처를 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 주 지붕 앞 면을 박공 합류와 굴뚝 절단 뒤에 남는 한 경사면으로 확정해 박공 아래에 가려진 판을 남기지 않는다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 00이 Mfront와 등고 경계를 계산한 데 대해 이 H2가 박공 합류·굴뚝 절단 뒤 남는 한 경사면만 소유하고 박공 아래 가려진 판을 두지 않는 면 단위 결정을 더함을 대조했다.
@evidence principles/design/spaces.md#space-topology 이 면은 왼쪽에서 본채 측면, 뒤에서 주 용마루, 오른쪽에서 낮은 지붕 위의 단차, 앞에서 처마와 박공 합류에 닿고 지붕 아래는 방의 추가 바닥이나 통행 공간이 아니다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 첫 문단 끝의 네 방향 경계 목록과 둘째 문단 끝의 비거주·비통행 문장을 대조해, roof.main.front의 이웃(본채 측면·주 용마루·낮은 지붕 단차·박공 합류)과 아래 공간 관계가 메쉬 없이 복원됨을 확인했다.
@evidence principles/design/spaces.md#space-boundary-authority 골짜기 윤곽은 roof-shared-edges의 등고 경계를 소비하고 처마 끝·홈통·반복 지붕재도 그 공유 경계를 별도 좌표로 다시 만들지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 둘째 문단의 '골짜기 윤곽을 별도 좌표로 다시 만들지 않는다'를 첫 문단의 roof-shared-edges 링크와 대조해, roof.main.front와 처마 끝·홈통·지붕재가 등고 경계를 한 owner에서만 받음을 확인했다.
@evidence principles/design/spaces.md#space-verification-address 주 용마루에서 전면 처마로 내려오는 단면, 전면 박공 양쪽 골짜기, 굴뚝 옆 절단과 아래면을 검사하게 한다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 검사 주소인 주 용마루~전면 처마 단면, 전면 박공 양쪽 골짜기, 왼쪽 외벽 굴뚝 옆 절단과 아래면을 절단·무막음판 주장에 대조했고 source·면 윤곽·그림자가 unverified로 남음을 확인했다.
@evidence settings/10-house.md#main-mass 전면 교차 박공 뒤의 주 지붕을 중첩 없는 노출 면으로 유지한다.
@evidenceReview settings/10-house.md#main-mass #edcb5ab 설정 main-mass의 박공 뒤 좌우 주 용마루와 무중첩 합류 요구를 본문의 전면 박공 우세 영역 제외와 막음판 금지에 대조해 박공 뒤 주 지붕 앞 면이 중첩 없는 노출 면으로 이행됨을 확인했다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work main-mass의 "골짜기와 합류부에 빈틈이나 중첩 지붕판을 남기지 않는다"와 living의 왼쪽 외벽 굴뚝을 앞 면에 대조했고 박공 우세 영역과 굴뚝 절단을 빼는 것으로 성립해 부모 수정이 없었다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 설정 main-mass의 합류부 무틈·무중첩과 living의 왼쪽 외벽 굴뚝을 주 지붕 앞 면의 박공 우세 영역·굴뚝 절단 제외에 함께 대조했고 두 부모 요구가 충돌 없이 담겨 설정 수정이 필요 없음을 확인했다.
-->

`roof.main.front`의 owner는 `src/spaces/roof/main-front.ts`다. [주 지붕 영역](00-junctions.md#roof-mass-allocation)의 앞 절반과 자유 돌출을 받고, 날씨 면/아래면은 [Mfront와 수직 두께](00-junctions.md#roof-profile-datums)를 소비한다. 같은 면에서 [전면 박공의 우세 영역과 굴뚝 절단](00-junctions.md#roof-shared-edges)을 제외한다. 왼쪽은 본채 측면, 뒤는 주 용마루, 오른쪽은 낮은 지붕 위의 단차, 앞은 처마와 박공 합류다.

이 owner는 잘린 뒤의 한 완결 경사면과 아래면, 자유 외곽에서 둘을 잇는 두께를 소유한다. 골짜기/용마루에 겹치는 내부 막음판을 남기지 않는다. 처마 끝·홈통과 반복 지붕재는 이 면의 공유 경계를 소비하며 골짜기 윤곽을 별도 좌표로 다시 만들지 않는다. 지붕 아래는 방의 추가 바닥이나 통행 공간이 아니다.

검사 주소는 주 용마루에서 전면 처마로 내려오는 단면, 전면 박공 양쪽 골짜기, [왼쪽 외벽 굴뚝](../../settings/10-house.md#living) 옆 절단과 아래면이다. 실제 source·면 윤곽·접합 부재·재료와 그림자 읽힘은 unverified다.

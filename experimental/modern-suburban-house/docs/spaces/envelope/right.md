# 오른쪽 박공과 두 지붕 접합

## 본채 단차와 차고 위의 벽 {#right-roof-closures}
<!--
@evidence principles/core/common.md#scope-preservation 본채 지붕 단차 벽, 본채·차고의 오른쪽 삼각 벽, 차고 지붕과 공유 벽의 후레싱 접합, 오른쪽 창 배정 방향까지 맡는다.
@evidence principles/core/common.md#substantive-completion 단차 벽을 분할면에서 -X로 0.15 m 두께로 예약하고 차고 지붕 후레싱 상승 높이를 0.15 m로 정한다.
@evidence principles/core/common.md#declared-basis 분할면과 두 지붕 아래면은 roof-mass-allocation·roof-profile-datums, 공유 벽은 attached-garage-extent에서 받고 0.15 m 값은 방수 인증이 아닌 공간 예약이라고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 본채 오른쪽 끝의 더 낮은 지붕과 우측을 향하는 박공을 단차 벽·두 개의 오른쪽 삼각 벽·차고 지붕 접합 띠로 분해한다.
@evidence principles/design/spaces.md#space-topology 차고 지붕 왼쪽이 본채 공유 벽 바깥에 붙고 청회색 침실은 전면 창을, 욕조 욕실은 차고 후면 돌출 뒤의 측면 창을 쓰는 관계를 정한다.
@evidence principles/design/spaces.md#space-boundary-authority 본채/차고 공유 벽은 차고 owner, 단차 벽과 앞뒤 외벽의 공통 몸체는 07이 소유하고 이 파일은 다시 만들지 않는다.
@evidence principles/design/spaces.md#space-verification-address 단차의 앞/뒤 끝과 용마루 지점, 두 오른쪽 삼각 벽, 차고 지붕/본채 벽 접촉선 전체를 반증 주소로 둔다.
@evidence settings/10-house.md#main-mass 본채 오른쪽 끝의 더 낮은 지붕과 우측 박공을 단차 벽과 삼각 벽으로 닫는다.
@evidence settings/10-house.md#garage 차고의 낮은 박공 지붕 오른쪽 삼각 벽을 차고 외벽 두께 안에서 별도로 닫는다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work main-mass의 오른쪽 낮은 지붕·우측 박공과 garage의 낮은 박공을 오른쪽 입면에 적용했고 "골짜기와 합류부에 빈틈이나 중첩 지붕판을 남기지 않는다"를 단차 벽 배정으로 충족해 부모 수정이 없었다.
-->

오른쪽 노출 입면의 owner는 `src/spaces/envelope/right.ts`다. [주 지붕과 낮은 지붕](../roof/00-junctions.md#roof-mass-allocation)의 분할면에서 주 지붕 끝의 노출 벽을 닫는다. 단차 벽은 분할면에서 -X로 0.15 m의 두께를 예약한다. 윗 경계는 주 지붕 아래면, 아래쪽 접합은 낮은 지붕 아래면을 받는다. 낮은 날씨 면보다 위에 드러나는 부분과 지붕 두께 안에 묻히는 접합을 구분하고, 위쪽 주 지붕의 두께 막음과 벽을 중복 생성하지 않는다. 아래층의 방 경계나 바닥은 바꾸지 않는다.

[단차 벽과 앞뒤 외벽의 공통 몸체](../07-boundary-assembly.md#exterior-boundary-junctions)는 높이별 점유로 나누고 이 파일이 그 몸체를 다시 만들지 않는다. 남은 단차 구간의 위아래 경계와 본채/차고 박공 벽의 [두께 전체 상단](../roof/00-junctions.md#roof-wall-head-junctions)을 함께 소비한다. 본채 공유 벽 위의 노출 면도 차고 지붕 때문에 생략하지 않는다.

본채 오른쪽 외벽의 박공 삼각 벽은 [낮은 지붕의 앞/뒤 아래면](../roof/00-junctions.md#roof-profile-datums)에 맞춰 닫는다. 차고 오른쪽 외벽도 자기 Gfront/Gback 아래면에서 별도 삼각 벽을 만든다. 각 삼각 벽은 기존 외벽 두께 안에 있고 겹친 삼각 장식판으로 대체하지 않는다. 본채/차고 공유 벽은 [차고 owner](../00-building.md#attached-garage-extent)가 소유하며 이 파일이 다시 만들지 않는다.

차고 지붕의 왼쪽은 본채 공유 벽 바깥에 붙는다. 그 접촉 높이는 Gfront/Gback과 같으며, 후레싱이 벽을 따라 오르는 높이는 공간 예약 0.15 m로 택한다. 이 후레싱까지 포함한 접합 띠에는 창틀이나 환기구를 겹치지 않는다. 이 값은 방수 성능의 인증이 아니라 시각·기하 접합의 예약이다. [청회색 침실](../rooms/bedroom-three.md#bedroom-three-plan)의 요구 창은 전면에 있고 차고 위 측면에 창을 억지로 더할 필요는 없다. [욕조 욕실의 측면 창](#right-openings)은 차고 후면 돌출보다 뒤에 배정한다.

검사 주소는 단차의 앞/뒤 끝과 용마루 지점, 본채와 차고의 오른쪽 삼각 벽, 차고 지붕/본채 벽 접촉선 전체와 모든 해당 창이다. 건물 오른쪽에서 보이는 삼각 면·단차·처마 밑면, 실내 천장 간섭과 실제 수밀 부재/프레임은 unverified다.

## 차고 접합을 피한 측면 채광 {#right-openings}
<!--
@evidence principles/core/common.md#scope-preservation 본채와 차고 오른쪽 외벽의 창 배치 전체와 공유 벽·서비스실 쪽에 창을 두지 않는 결정을 맡는다.
@evidence principles/core/common.md#substantive-completion 본채 오른쪽 창은 X = [5.50, 5.75] m, 차고 오른쪽 창은 X = [11.45, 11.70] m 외벽에 바인딩하는 원칙을 정한다.
@evidence principles/core/common.md#declared-basis 두 외벽 구간은 본채·차고 외곽 owner, 창틀은 공통 인계에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 차고가 가리는 본채 오른쪽 구간에 서비스실 창을 두지 않고 청회색 침실은 전면 창을 쓰는 방별 창 유무를 결정한다.
@evidence principles/design/spaces.md#space-topology 공유 벽을 통과하는 가짜 외부 창을 금지하고 오른쪽 창을 실제 외기에 닿는 벽에만 둔다.
@evidence principles/design/spaces.md#space-boundary-authority 본채 X = [5.50, 5.75] m와 차고 X = [11.45, 11.70] m 외벽 구간을 각 외곽 owner에서 받고 두 외곽이 공유하는 벽은 차고 owner의 것이라 그 구간에 창을 두지 않는다.
@evidence principles/design/spaces.md#space-verification-address 외벽/방 binding과 지붕/창/모서리 전체의 내외부 프레임을 반증 관찰로 둔다.
@evidence settings/10-house.md#openings 창을 배정한 방과 그 창을 품은 외벽이 같아야 한다는 조건으로 공유 벽 뒤 서비스실의 창을 배제한다.
@evidence obligations/design/spaces.md#space-envelope-interface 차고가 덮는 본채 오른쪽 벽과 노출된 벽을 구별해 외부 창과 실내 방의 대응이 공유 벽에서 어긋나지 않게 한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work openings의 방-외벽 일치와 service-band의 서비스 띠 위치를 대조했고 서비스실이 창 없이도 설정을 충족해 부모 수정이 없었다.
-->

[공통 개구부 인계](../06-openings.md#external-opening-interface)에 따라 본채 오른쪽 창은 외벽 X = [5.50, 5.75] m, 차고 오른쪽 창은 X = [11.45, 11.70] m에 바인딩한다. 공유 벽을 통과하는 가짜 외부 창은 없다.

본채 우측 서비스실은 공유 벽 때문에 측면 창을 두지 않고 청회색 침실은 자기 전면 창을 사용한다. 실제 외벽/방 binding과 지붕/창/모서리 전체의 내외부 프레임은 unverified다.

## 가족실의 오른쪽 창 {#family-right-window}
<!--
@evidence principles/core/common.md#scope-preservation 가족실의 두 번째 외벽 창 하나를 맡는다.
@evidence principles/core/common.md#substantive-completion 본채 오른쪽 벽의 Z = [-9.95, -8.25], Y = [0.75, 2.30] m 개구부와 수직 창 두 칸을 정한다.
@evidence principles/core/common.md#declared-basis 차고 뒤로 노출되는 벽 구간은 차고 외곽에서, 창틀은 공통 인계에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 가족실이 후면 창과 함께 오른쪽 노출 외벽 창을 갖도록 차고 뒤 구간에 위치를 정한다.
@evidence principles/design/spaces.md#space-topology 창을 ground-storey kitchen-dining-family에 속하게 하고 차고 뒤의 노출 외벽에만 둔다.
@evidence principles/design/spaces.md#space-boundary-authority 차고 후벽 Z와 본채 외벽 두께를 외곽 owner에서 소비한다.
@evidence principles/design/spaces.md#space-verification-address 소파/커튼 앞 접근, 뒤 모서리에서 두 창의 일치를 반증 관찰로 둔다.
@evidence settings/10-house.md#common-room 오른쪽 가족실 좌석이 같은 방의 두 창으로 밝혀지도록 한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work common-room의 가족실 우측 배치와 garage의 깊이 6.0–6.6 m를 대조했고 차고 뒤에 노출 외벽이 남아 부모 수정이 없었다.
-->

`family-right-window`는 [본채 오른쪽 벽](#right-openings)의 Z = [-9.95, -8.25], Y = [0.75, 2.30] m 개구부로 ground-storey의 [kitchen-dining-family](../rooms/common.md#common-room-plan)에 속한다. [공통 인계](../06-openings.md#external-opening-interface)의 수직 창 두 칸이다. 차고 뒤의 노출 외벽에 바인딩하며 후면 창과 같은 가족실을 비춘다. 소파/커튼 앞 접근, 뒤 모서리와 두 창의 일치·실제 내외부 프레임은 unverified다.

## 욕조 욕실의 높은 흐린 창 {#tub-right-window}
<!--
@evidence principles/core/common.md#scope-preservation 욕조 욕실의 높은 흐린 창 하나와 차고 뒤 지붕 돌출과의 분리, sash 점유를 맡는다.
@evidence principles/core/common.md#substantive-completion 본채 오른쪽 벽의 Z = [-8.40, -7.50], Y = [4.56, 5.31] m 개구부를 흐린 유리의 높은 상부 경첩창 한 칸으로 정한다.
@evidence principles/core/common.md#declared-basis 높은 sill과 흐린 유리는 프라이버시를 위한 설계 선택이라고 밝히고 지붕 돌출 끝은 roof-profile-datums에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 욕조 욕실을 밝히는 창을 차고 지붕을 피한 높이와 trim 앞쪽 한계 Z = -7.40 m로 배치한다.
@evidence principles/design/spaces.md#space-topology 창을 upper-storey tub-bathroom의 오른쪽 외벽 중 차고 뒤 지붕 돌출보다 뒤쪽 구간에 바인딩한다.
@evidence principles/design/spaces.md#space-boundary-authority 차고 뒤 지붕 돌출은 roof owner가 소유하고 이 H2는 창의 trim 한계와 바깥 +X 0.25 m 이내 sash 점유만 둔다.
@evidence principles/design/spaces.md#space-verification-address 지붕 간섭, 기구 배치 뒤 양방향 눈높이의 프라이버시, 창 조작 접근을 반증 관찰로 둔다.
@evidence settings/10-house.md#openings 욕실 창을 그 방을 품은 오른쪽 외벽에 두어 창을 배정한 방과 외벽이 같다는 조건을 따른다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work openings의 방-외벽 일치와 tub-bathroom의 독립 욕실 조건을 대조했고 차고 뒤 노출 벽에 높은 창을 둘 수 있어 부모 수정이 없었다.
-->

`tub-right-window`는 [본채 오른쪽 벽](#right-openings)의 Z = [-8.40, -7.50], Y = [4.56, 5.31] m 개구부로 upper-storey의 [tub-bathroom](../rooms/tub-bath.md#tub-bath-plan)에 속한다. [공통 인계](../06-openings.md#external-opening-interface)의 높은 상부 경첩창 한 칸으로 흐린 유리를 쓴다.

욕실 창 앞쪽 trim 한계 Z = -7.40 m와 [차고 뒤 지붕 돌출](../roof/00-junctions.md#roof-profile-datums) 끝은 분리한다. 높은 sill과 흐린 유리는 프라이버시를 위한 설계 선택이며 기구 배치 뒤 양방향 눈높이에서 검토해야 한다. 열리는 sash는 바깥 +X 방향에 0.25 m 이내의 점유로 예약하고 창 앞 접근/조경과 대조한다. 실제 지붕 간섭·접근·프라이버시·채광/프레임은 unverified다.

## 차고의 측면 채광창 {#garage-right-window}
<!--
@evidence principles/core/common.md#scope-preservation 차고의 측면 채광창 하나와 선반·레일과의 관계를 맡는다.
@evidence principles/core/common.md#substantive-completion 차고 오른쪽 벽의 Z = [-5.85, -4.25], Y = [1.40, 2.20] m 개구부를 높은 고정창 두 칸으로 정한다.
@evidence principles/core/common.md#declared-basis 벽 구간은 차고 외곽, 상부 문 이동 예약은 garage-front-opening에서 받는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 빈 차고 내부가 머드룸에서 관찰될 때 읽히도록 측면 채광을 문 이동 예약 뒤의 벽에 둔다.
@evidence principles/design/spaces.md#space-topology 창을 ground-storey garage 오른쪽 벽의 상부 문 이동 예약보다 뒤쪽 구간에 속하게 한다.
@evidence principles/design/spaces.md#space-boundary-authority 상부 문 이동 예약과 후벽 수납은 다른 owner에서 소비하고 창 좌표만 저작한다.
@evidence principles/design/spaces.md#space-verification-address 문 레일/수납과의 간섭, 안팎 reveal, 채광과 차고 내부 읽힘을 반증 관찰로 둔다.
@evidence settings/10-house.md#garage 선반·공구 수납이 있는 빈 차고 내부에 측면 채광창을 두고 후속 선반/작업대가 그 창 전체를 막지 않게 한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work garage의 문 레일/상부 구조·선반 수납과 폭 5.8–6.4 m 외곽을 대조했고 창이 레일 뒤 벽에 들어가 부모 수정이 없었다.
-->

`garage-right-window`는 [차고 오른쪽 벽](#right-openings)의 Z = [-5.85, -4.25], Y = [1.40, 2.20] m 개구부로 ground-storey의 [garage](../rooms/garage-interior.md#garage-interior-plan)에 속한다. [공통 인계](../06-openings.md#external-opening-interface)의 높은 고정창 두 칸이다. [상부 문 이동 예약](front.md#garage-front-opening)보다 뒤쪽 벽에 놓고 후속 선반/작업대가 창 전체를 막지 않게 한다. 실제 문 레일/수납과의 간섭·안팎 reveal·채광과 차고 내부 읽힘은 unverified다.

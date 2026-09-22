# 서측 봉헌실과 주랑의 지붕

## 긴 낮은 날개 {#west-roof}

<!--
@evidence principles/core/common.md#scope-preservation 봉헌실과 서쪽 주랑을 함께 덮고 남북 박공·외측/중정측 처마·제실 교차선을 남긴다.
@evidence principles/core/common.md#substantive-completion 두 X 지지선 사이 중점에 Z 방향 용마루를 놓고 외벽 바깥면/중정 경계로 네 후보 끝을 정한다.
@evidence principles/core/common.md#declared-basis 경사·두께·합성은 assembly에서 받고 실내의 서로 다른 천장 방식은 ceilings를 소비한다.
@evidence principles/design/spaces.md#space-topology roof는 봉헌실과 서쪽 주랑 위에 이어지지만 좁은 처마 외에는 중앙 중정을 덮지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 외부 roof 전체는 west owner가 맡고 봉헌실 널판/주랑 보 노출면은 각 방에 남긴다.
@evidence principles/design/spaces.md#space-verification-address 제실 교차선·양 박공 끝·양쪽 처마에서 교차판 깜빡임과 내부 roof 누락을 확인한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 낮은 날개라는 설정에 봉헌실과 주랑을 잇는 장축 및 중정을 침범하지 않는 후보 끝선을 제공한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work roof-form의 경사 외피와 ceilings의 봉헌실 널판/주랑 노출 구분을 같은 날개 아래에 배정할 수 있어 부모 천장 방식을 통일하거나 중정을 덮지 않았다.
@evidence settings/20-envelope.md#roof-form 봉헌실 장축을 따라 낮은 박공을 두고 외측과 중정측에 각각 처마를 남긴다.
@evidence settings/20-envelope.md#ceilings 같은 roof 아래에서도 봉헌실의 널판과 주랑의 노출 보를 별도 공간 소유에 둔다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 봉헌실과 서쪽 주랑을 함께 덮고 양 박공 끝과 양쪽 처마를 모두 관찰한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 두 X 지지선 중점의 Z축 용마루와 네 끝 참조면을 정해 긴 날개가 닫힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 공통 높이/경사와 공간별 천장 방식을 소비하므로 같은 roof가 같은 실내 천장을 뜻하지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 중정 경계를 넘는 것은 좁은 처마뿐이고 전체 중정을 덮는 연장은 금지된다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 서측 roof 외부를 나누지 않으며 봉헌실 널판과 주랑 노출 보의 면은 각 공간에 남는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 제실 교차선과 두 박공 끝을 포함해 교차판 깜빡임과 내부 roof 누락을 찾는다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 낮은 날개 요구를 봉헌실 장축과 중정을 침범하지 않는 끝선으로 구체화했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 하나의 날개 아래 널판/노출 하부를 구별할 수 있어 부모 천장을 통일할 이유가 없었다.
@evidenceReview settings/20-envelope.md#roof-form #e18ede4 외벽 중심은 높이 계산에만 쓰고 노출 처마 길이는 실제 외벽 바깥에서 잰다.
@evidenceReview settings/20-envelope.md#ceilings #c397437 봉헌실의 낮은 널판과 주랑의 노출 보가 각기 다른 실내 owner에 남아 있다.
-->

지지선은 X=-10.2m와 [중정 서쪽 기준선](../building.md#plan-datums), Z=-9.95~9.95m다. 단면은 두 X 지지선의 중점에서 용마루를 갖는 박공이고 Z 방향으로 이어진다. 높이·경사·돌출은 [공통 접합](assembly.md#roof-junctions)을 따른다. 봉헌실과 서쪽 주랑을 함께 덮되 중앙 중정으로 지붕 면을 연장하지 않는다. 돌출 처마의 좁은 영역만 중정 경계를 넘어간다.

끝선을 유도하는 참조면은 서쪽 west-outer, 동쪽 west-court, 북쪽 north-outer, 남쪽 south-outer다. 각 참조면에 공통 돌출을 바깥쪽으로 적용한다. 외벽 중심 지지선은 경사 상면의 높이 계산에만 쓰고 노출 처마 길이의 시작점으로 쓰지 않는다. 제실과 겹쳐 숨는 후보 끝은 assembly가 제거한다.

source `src/spaces/roofs/west.ts`가 완결 서측 날개 지붕 상면과 외부 하부를 맡는다. 봉헌실은 낮은 목재 널판 천장, 주랑은 노출 보·서까래 아래를 본다는 [천장 설정](../../settings/20-envelope.md#ceilings)을 소비한다. 내부 천장은 각 공간 표면 owner이며 지붕 외부를 나누어 공동 저작하지 않는다.

제실 지붕과의 교차선, 남북 박공 끝, 서쪽 외부 처마, 중정 쪽 처마를 모두 관찰한다. 같은 경사판 두 개가 교차해 깜빡이거나 내부에 지붕이 사라지면 실패다. 상세 부재의 간격과 기와 반복은 후속 단계이며 현재 상자 slab를 완성 지붕으로 제시하지 않는다.

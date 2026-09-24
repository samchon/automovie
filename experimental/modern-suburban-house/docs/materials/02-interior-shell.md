# 실내 외피 마감

## 따뜻한 밝은 벽 도장 {#interior-wall-paint}
<!--
@evidence principles/core/common.md#declared-basis 따뜻한 밝은 벽 도장의 #F1EEE6·roughness 0.60은 settings/10-house.md#entry의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 따뜻한 밝은 벽 도장은 spaces 03 interior-surface-handoff의 열다섯 방 owner(`src/spaces/rooms/*.ts`) 안쪽 벽 마감 구역(욕실 벽 타일 구역 제외, 차고 내부 벽 포함)에 마감만 결합하고 그 면의 geometry·경계와 개수는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 따뜻한 밝은 벽 도장은 #F1EEE6(선형 0.880, 0.855, 0.791), roughness 0.60, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/interior/walls.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#entry는 색·재료를 말로만 정했고 따뜻한 밝은 벽 도장은 #F1EEE6 값과 roughness 0.60, 결합 면 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 따뜻한 밝은 벽 도장은 구성을 '석고보드 위 무광 수성 도장'로, 외관의 #F1EEE6·roughness 0.60·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 따뜻한 밝은 벽 도장의 결합 vocabulary는 spaces 03 interior-surface-handoff의 열다섯 방 owner(`src/spaces/rooms/*.ts`) 안쪽 벽 마감 구역(욕실 벽 타일 구역 제외, 차고 내부 벽 포함)이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 따뜻한 밝은 벽 도장의 반증 견본은 '실내 threshold view에서 켜진 따뜻한 천장등 아래 벽이 회색으로 가라앉지 않고 문선과 구별되는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #F1EEE6 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 따뜻한 밝은 벽 도장은 settings/10-house.md#entry, settings/10-house.md#upper-hall를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 방 벽 도장의 미세 롤러 결은 0.10 m 모듈로 투영한다. 각 방 벽의 왼쪽 아래를 원점으로 U는 벽 길이·V는 높이이며 문·창·걸레받이 부재 끝에서 끊는다.
@evidence settings/10-house.md#entry 따뜻한 밝은 벽 도장이 '실내 현관'(settings/10-house.md#entry)를 링크로 소비해 #F1EEE6 값과 결합 면의 근거로 삼았다.
@evidence settings/10-house.md#powder 따뜻한 밝은 벽 도장이 '파우더룸'(settings/10-house.md#powder)를 링크로 소비해 #F1EEE6 값과 결합 면의 근거로 삼았다.
@evidence settings/10-house.md#upper-hall 따뜻한 밝은 벽 도장이 '상층 복도'(settings/10-house.md#upper-hall)를 링크로 소비해 #F1EEE6 값과 결합 면의 근거로 삼았다.
@evidence spaces/03-surface-owners.md#interior-surface-handoff 따뜻한 밝은 벽 도장이 '방 내부의 완결 면 소유'(spaces/03-surface-owners.md#interior-surface-handoff)를 링크로 소비해 #F1EEE6 값과 결합 면의 근거로 삼았다.
-->

[실내 현관](../settings/10-house.md#entry)·[상층 복도](../settings/10-house.md#upper-hall)·침실의 밝은 벽과 [파우더룸](../settings/10-house.md#powder)의 따뜻한 흰 벽이다. 구성은 석고보드 위 무광 수성 도장이며 도막 두께는 형상에 반영하지 않는다. 외관은 그 도막 한 층의 색과 광택만 근사하는 `#F1EEE6`(선형 0.880, 0.855, 0.791), roughness 0.60, metallic 0.0, transmission 0.0이다. 바깥 siding `#EDE8DC`보다 밝고 [흰 실내 trim](#interior-trim-white)보다 한 단계 따뜻해 문선이 벽에서 분리된다. 결합 면은 [방 내부의 완결 면 소유](../spaces/03-surface-owners.md#interior-surface-handoff)의 모든 방 owner가 가진 안쪽 벽 마감 구역이며, [욕실 벽 타일](#bath-wall-tile)이 덮는 구역은 제외하고 차고 내부 벽은 포함한다. source owner는 `src/materials/interior/walls.ts`이고, 리뷰는 실내 threshold view에서 켜진 따뜻한 천장등 아래 벽이 회색으로 가라앉지 않고 문선과 구별되는지를 관찰한다.

표면 결속 계획: 방 벽 도장의 미세 롤러 결은 0.10 m 모듈로 투영한다. 각 방 벽의 왼쪽 아래를 원점으로 U는 벽 길이·V는 높이이며 문·창·걸레받이 부재 끝에서 끊는다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 평평한 흰 천장 {#interior-ceiling}
<!--
@evidence principles/core/common.md#declared-basis 평평한 흰 천장의 #FAF9F6·roughness 0.65은 settings/20-verification.md#visual-grammar의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 평평한 흰 천장은 열다섯 방 owner(`src/spaces/rooms/*.ts`)의 보이는 천장 마감과 `src/spaces/stair.ts`의 계단실 위 높은 천장에 마감만 결합하고 그 면의 geometry·경계와 개수는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 평평한 흰 천장은 #FAF9F6(선형 0.956, 0.947, 0.922), roughness 0.65, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/interior/ceilings.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/20-verification.md#visual-grammar는 색·재료를 말로만 정했고 평평한 흰 천장은 #FAF9F6 값과 roughness 0.65, 결합 면 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 평평한 흰 천장은 구성을 '석고보드 위 무광 흰 도장'로, 외관의 #FAF9F6·roughness 0.65·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 평평한 흰 천장의 결합 vocabulary는 열다섯 방 owner(`src/spaces/rooms/*.ts`)의 보이는 천장 마감과 `src/spaces/stair.ts`의 계단실 위 높은 천장이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 평평한 흰 천장의 반증 견본은 '실내 모서리 view에서 벽·천장 경계가 보이고 천장이 발광판처럼 균일하게 타지 않는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #FAF9F6 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 평평한 흰 천장은 spaces/09-ceiling-assembly.md#upper-ceiling-closure를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 도장의 약한 롤러 결은 0.10 m 세계 X/Z 모듈로 투영한다. 같은 층 원점을 쓰되 각 방 천장 구멍과 단차에서 실제 면만 받으며 광원 바로 아래에서도 단색 판이 되지 않게 한다.
@evidence spaces/09-ceiling-assembly.md#upper-ceiling-closure 평평한 흰 천장이 '본채 상층과 계단실의 같은 상부 경계'(spaces/09-ceiling-assembly.md#upper-ceiling-closure)를 링크로 소비해 #FAF9F6 값과 결합 면의 근거로 삼았다.
-->

모든 실내 천장이다. 구성은 석고보드 위 무광 흰 도장이다. 외관은 도막 한 층을 근사하는 `#FAF9F6`(선형 0.956, 0.947, 0.922), roughness 0.65, metallic 0.0, transmission 0.0이다. 벽보다 밝고 차가워 벽과 천장의 모서리가 같은 조명에서 명도 차로 읽힌다. 결합 면은 각 방 owner의 보이는 천장 마감과 [계단실 위 높은 천장](../spaces/09-ceiling-assembly.md#upper-ceiling-closure)이며, 차고 천장은 같은 재료를 받는다. source owner는 `src/materials/interior/ceilings.ts`이고, 리뷰는 실내 모서리 view에서 벽·천장 경계가 보이고 천장이 발광판처럼 균일하게 타지 않는지를 관찰한다.

표면 결속 계획: 천장 도장의 약한 롤러 결은 0.10 m 세계 X/Z 모듈로 투영한다. 같은 층 원점을 쓰되 각 방 천장 구멍과 단차에서 실제 면만 받으며 광원 바로 아래에서도 단색 판이 되지 않게 한다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 흰 실내 trim과 패널 문짝 {#interior-trim-white}
<!--
@evidence principles/core/common.md#declared-basis 흰 실내 trim과 패널 문짝의 #F4F2EC·roughness 0.35은 settings/10-house.md#openings의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 흰 실내 trim과 패널 문짝은 models 03 실내 문·05 수납·01 창 안쪽 창대 파티션과 `src/spaces/stair.ts` 계단의 챌판·난간 기둥에 마감만 결합하고 그 면의 geometry·경계와 개수는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 흰 실내 trim과 패널 문짝은 #F4F2EC(선형 0.905, 0.888, 0.839), roughness 0.35, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/interior/trim.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#openings는 색·재료를 말로만 정했고 흰 실내 trim과 패널 문짝은 #F4F2EC 값과 roughness 0.35, `leaf`·`leaf-panel`·`jamb-a`·`jamb-b`·`jamb-core`·`casing-a`·`casing-b` 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 흰 실내 trim과 패널 문짝은 구성을 '반광 도장한 목재·MDF 부재'로, 외관의 #F4F2EC·roughness 0.35·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 흰 실내 trim과 패널 문짝의 결합 vocabulary는 `leaf`·`leaf-panel`·`jamb-a`·`jamb-b`·`jamb-core`·`casing-a`·`casing-b`이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 흰 실내 trim과 패널 문짝의 반증 견본은 '05의 복도 view에서 흰 문짝과 문선이 벽과 분리되고 반광 하이라이트가 벽보다 좁은지'이고 00 재료 리뷰 견본의 중성 조명 판이 #F4F2EC 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 흰 실내 trim과 패널 문짝은 settings/10-house.md#openings, settings/10-house.md#stair를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 실내 문선·걸레받이·패널 문짝의 도장 솔결은 부재 길이 U의 0.10 m 모듈이다. 각 파티션의 시작 모서리를 원점으로 하고 패널 오목부·문짝 가장자리에서 결 방향과 이음을 새로 잡는다.
@evidence settings/10-house.md#openings 흰 실내 trim과 패널 문짝이 '개구부의 읽힘'(settings/10-house.md#openings)를 링크로 소비해 #F4F2EC 값과 결합 면의 근거로 삼았다.
@evidence settings/10-house.md#stair 흰 실내 trim과 패널 문짝이 '단일 꺾임계단'(settings/10-house.md#stair)를 링크로 소비해 #F4F2EC 값과 결합 면의 근거로 삼았다.
-->

[03–05의 흰 실내 문선 및 패널문](../settings/10-house.md#openings)과 계단의 [흰 챌판과 기둥](../settings/10-house.md#stair)이다. 구성은 반광 도장한 목재·MDF 부재이며 패널 분절은 모델 geometry가 만든다. 외관은 도막을 근사하는 `#F4F2EC`(선형 0.905, 0.888, 0.839), roughness 0.35, metallic 0.0, transmission 0.0이다. 결합 면은 [실내 문의 표면 파티션](../models/03-interior-doors.md#interior-door-surfaces)의 `leaf`·`leaf-panel`·`jamb-a`·`jamb-b`·`jamb-core`·`casing-a`·`casing-b`, 현관문 `casing`, 걸레받이, 창 안쪽 `interior-sill`([창의 표면 파티션](../models/01-windows.md#window-surface-partitions)), 계단 챌판과 난간 기둥, [외투장](../models/05-closet-fittings.md#coat-closet-doors)·[린넨장](../models/05-closet-fittings.md#linen-closet-fittings) 문짝과 선반, 외투장 [봉과 선반](../models/05-closet-fittings.md#coat-closet-rod-shelf)의 `shelf`다. source owner는 `src/materials/interior/trim.ts`이고, 리뷰는 05의 복도 view에서 흰 문짝과 문선이 벽과 분리되고 반광 하이라이트가 벽보다 좁은지를 관찰한다.

창의 안쪽 `interior-sill`, 외투장·린넨장과 미닫이 옷장의 흰 몸통 `carcass`도 이 반광 도장을 받는다. 검은 레일·봉·손잡이에는 결합하지 않는다.

표면 결속 계획: 실내 문선·걸레받이·패널 문짝의 도장 솔결은 부재 길이 U의 0.10 m 모듈이다. 각 파티션의 시작 모서리를 원점으로 하고 패널 오목부·문짝 가장자리에서 결 방향과 이음을 새로 잡는다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 참나무색 마루 {#oak-floor}
<!--
@evidence principles/core/common.md#declared-basis 참나무색 마루의 #B08050·roughness 0.50은 settings/10-house.md#entry의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 참나무색 마루는 `src/spaces/rooms/entry.ts`·`living.ts`·`common.ts`·`service.ts`·`pantry.ts` owner의 보이는 바닥 마감에 마감만 결합하고 그 면의 geometry·경계와 개수는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 참나무색 마루는 #B08050(선형 0.434, 0.216, 0.080), roughness 0.50, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/interior/floors.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#entry는 색·재료를 말로만 정했고 참나무색 마루는 #B08050 값과 roughness 0.50, 결합 면 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 참나무색 마루는 구성을 '폭 0.13 m 판의 오일 마감 원목 마루'로, 외관의 #B08050·roughness 0.50·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 참나무색 마루의 결합 vocabulary는 `src/spaces/rooms/entry.ts`·`living.ts`·`common.ts`·`service.ts`·`pantry.ts` owner의 보이는 바닥 마감이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 참나무색 마루의 반증 견본은 '04와 03의 비교 view에서 마루가 꿀빛으로 읽히고 파우더룸·세탁실 문턱에서 끊기는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #B08050 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 참나무색 마루는 settings/10-house.md#entry, spaces/07-boundary-assembly.md#interior-boundary-junctions를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 1층 마루는 판 폭 0.13 m와 길이 방향의 결정론적 오크 결·판 이음을 색/거칠기 맵에 함께 둔다. 세계 X를 U, Z를 V로 하고 (0,0) 원점에서 방 사이 위상을 이어 가며 욕실·세탁실·문턱에서 끊는다.
@evidence settings/10-house.md#entry 참나무색 마루가 '실내 현관'(settings/10-house.md#entry)를 링크로 소비해 #B08050 값과 결합 면의 근거로 삼았다.
@evidence spaces/07-boundary-assembly.md#interior-boundary-junctions 참나무색 마루가 '모서리와 문턱에서 끊기지 않는 경계'(spaces/07-boundary-assembly.md#interior-boundary-junctions)를 링크로 소비해 #B08050 값과 결합 면의 근거로 삼았다.
@evidence settings/10-house.md#pantry 팬트리 설정의 '주방과 이어지는 바닥'을 참나무색 마루가 `src/spaces/rooms/pantry.ts` owner 바닥에 #B08050 값으로 결합해 받는다.
@evidence spaces/10-ground-floor.md#main-ground-floor-base 1층 바탕이 마루·타일 차이에도 높이를 맞추므로 참나무색 마루는 그 완성 면에 #B08050 기준색과 판 결속을 적용하고 바탕 높이를 바꾸지 않는다.
-->

[실내 현관의 참나무색 마루](../settings/10-house.md#entry)이고 1층 거실·공용부·서비스 통로·팬트리에 이어진다. 구성은 폭 0.13 m 판의 오일 마감 원목 마루이며 판 이음 선은 후속 마감 맵의 0.13 m 판 모듈과 실제 방·문턱 경계에서 표현하며, 장래 별도 판 부재를 만들면 그 경계와 일치시킨다. 외관 기준색은 오일 마감 표면의 `#B08050`(선형 0.434, 0.216, 0.080), roughness 0.50, metallic 0.0, transmission 0.0이다. 결합 면은 entry·living·common·service·pantry owner의 보이는 바닥 마감이다. 문턱에서 다른 재료로 바뀌는 선은 [실내 경계의 문턱](../spaces/07-boundary-assembly.md#interior-boundary-junctions)을 따른다. source owner는 `src/materials/interior/floors.ts`이고, 리뷰는 04와 03의 비교 view에서 마루가 꿀빛으로 읽히고 파우더룸·세탁실 문턱에서 끊기는지를 관찰한다.

표면 결속 계획: 1층 마루는 판 폭 0.13 m와 길이 방향의 결정론적 오크 결·판 이음을 색/거칠기 맵에 함께 둔다. 세계 X를 U, Z를 V로 하고 (0,0) 원점에서 방 사이 위상을 이어 가며 욕실·세탁실·문턱에서 끊는다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 밝은 목재 계단 디딤판 {#stair-tread-wood}
<!--
@evidence principles/core/common.md#declared-basis 밝은 목재 계단 디딤판의 #B08050·roughness 0.50은 settings/10-house.md#stair의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 밝은 목재 계단 디딤판은 `src/spaces/stair.ts` owner의 디딤판 윗면·앞 모서리와 중간참 바닥에 마감만 결합하고 그 면의 geometry·경계와 개수는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 밝은 목재 계단 디딤판은 #B08050(선형 0.434, 0.216, 0.080), roughness 0.50, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/interior/stair.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#stair는 색·재료를 말로만 정했고 밝은 목재 계단 디딤판은 #B08050 값과 roughness 0.50, 결합 면 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 밝은 목재 계단 디딤판은 구성을 '마루와 같은 수종의 두께 있는 참나무 디딤판'로, 외관의 #B08050·roughness 0.50·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 밝은 목재 계단 디딤판의 결합 vocabulary는 `src/spaces/stair.ts` owner의 디딤판 윗면·앞 모서리와 중간참 바닥이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 밝은 목재 계단 디딤판의 반증 견본은 '계단 단면과 04 view에서 흰 챌판과 목재 디딤판이 층마다 번갈아 읽히는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #B08050 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 밝은 목재 계단 디딤판은 settings/10-house.md#stair, spaces/02-stair.md#stair-reservation를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 각 디딤판의 목리는 0.28 m run을 따라 놓고 0.13 m 판 폭의 오크 결을 쓴다. 디딤판의 코 왼쪽을 원점으로 U 폭·V 진행 방향을 두며 단 코와 참 이음에서 잘라 손잡이 결과 구별한다.
@evidence settings/10-house.md#stair 밝은 목재 계단 디딤판이 '단일 꺾임계단'(settings/10-house.md#stair)를 링크로 소비해 #B08050 값과 결합 면의 근거로 삼았다.
@evidence spaces/02-stair.md#stair-reservation 밝은 목재 계단 디딤판이 '두 층을 잇는 L형 경로'(spaces/02-stair.md#stair-reservation)를 링크로 소비해 #B08050 값과 결합 면의 근거로 삼았다.
-->

[밝은 목재 디딤판](../settings/10-house.md#stair)이다. 구성은 마루와 같은 수종의 두께 있는 참나무 디딤판이고, 외관은 [참나무색 마루](#oak-floor)와 같은 값 `#B08050`(선형 0.434, 0.216, 0.080), roughness 0.50, metallic 0.0, transmission 0.0이다. 계단은 현관 마루에서 올라가므로 같은 수종으로 이어지는 것이 04의 관계이며 별도 색을 만들 근거가 없다. 결합 면은 [단일 L형 계단](../spaces/02-stair.md#stair-reservation) owner의 디딤판 윗면·앞 모서리와 중간참 바닥이다. 챌판은 [흰 실내 trim](#interior-trim-white)이다. source owner는 `src/materials/interior/stair.ts`이고, 리뷰는 계단 단면과 04 view에서 흰 챌판과 목재 디딤판이 층마다 번갈아 읽히는지를 관찰한다.

표면 결속 계획: 각 디딤판의 목리는 0.28 m run을 따라 놓고 0.13 m 판 폭의 오크 결을 쓴다. 디딤판의 코 왼쪽을 원점으로 U 폭·V 진행 방향을 두며 단 코와 참 이음에서 잘라 손잡이 결과 구별한다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 목재 난간 손잡이 {#handrail-wood}
<!--
@evidence principles/core/common.md#declared-basis 목재 난간 손잡이의 #8A5A34·roughness 0.45은 settings/10-house.md#stair의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 목재 난간 손잡이는 `src/spaces/stair.ts` owner가 소유한 계단과 계단 개구부 보호 경계의 손잡이에 마감만 결합하고 그 면의 geometry·경계와 개수는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 목재 난간 손잡이는 #8A5A34(선형 0.254, 0.102, 0.034), roughness 0.45, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/interior/stair.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#stair는 색·재료를 말로만 정했고 목재 난간 손잡이는 #8A5A34 값과 roughness 0.45, 결합 면 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 목재 난간 손잡이는 구성을 '오일 마감 경목 원형 단면 부재'로, 외관의 #8A5A34·roughness 0.45·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 목재 난간 손잡이의 결합 vocabulary는 `src/spaces/stair.ts` owner가 소유한 계단과 계단 개구부 보호 경계의 손잡이이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 목재 난간 손잡이의 반증 견본은 '04와 05에서 손잡이가 끊김 없이 한 재료로 이어지는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #8A5A34 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 목재 난간 손잡이는 settings/10-house.md#stair, settings/10-house.md#upper-hall를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 손잡이 목리는 길이 방향 U로 이어지는 0.15 m 폭 오크 패턴이다. 각 손잡이 구간의 시작 기둥을 원점으로 하고 기둥 맞댐에서 결을 끊되 경사 구간의 방향을 따라 회전한다.
@evidence settings/10-house.md#stair 목재 난간 손잡이가 '단일 꺾임계단'(settings/10-house.md#stair)를 링크로 소비해 #8A5A34 값과 결합 면의 근거로 삼았다.
@evidence settings/10-house.md#upper-hall 목재 난간 손잡이가 '상층 복도'(settings/10-house.md#upper-hall)를 링크로 소비해 #8A5A34 값과 결합 면의 근거로 삼았다.
@evidence spaces/02-stair.md#stair-boundary-heights 목재 난간 손잡이가 '계단 곁 벽과 열린 보호 경계의 높이'(spaces/02-stair.md#stair-boundary-heights)를 링크로 소비해 #8A5A34 값과 결합 면의 근거로 삼았다.
-->

[목재 손잡이](../settings/10-house.md#stair)와 [상층 복도의 목재 손잡이](../settings/10-house.md#upper-hall)다. 구성은 오일 마감 경목 원형 단면 부재다. 외관은 `#8A5A34`(선형 0.254, 0.102, 0.034), roughness 0.45, metallic 0.0, transmission 0.0이다. 디딤판보다 어두워 흰 기둥과 검은 난간살 위에서 선으로 읽힌다. 결합 면은 계단과 [계단 개구부 보호 경계](../spaces/02-stair.md#stair-boundary-heights)의 손잡이 전체 면이다. source owner는 `src/materials/interior/stair.ts`이고, 리뷰는 04와 05에서 손잡이가 끊김 없이 한 재료로 이어지는지를 관찰한다.

표면 결속 계획: 손잡이 목리는 길이 방향 U로 이어지는 0.15 m 폭 오크 패턴이다. 각 손잡이 구간의 시작 기둥을 원점으로 하고 기둥 맞댐에서 결을 끊되 경사 구간의 방향을 따라 회전한다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 검은 도장 금속 {#black-coated-metal}
<!--
@evidence principles/core/common.md#declared-basis 검은 도장 금속의 #1F1F20·roughness 0.40은 settings/10-house.md#stair의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 검은 도장 금속은 models/04-stair-members.md#stair-balusters, models/04-stair-members.md#stair-bottom-member의 면에 마감만 결합하고 그 면의 geometry·경계는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 검은 도장 금속은 #1F1F20(선형 0.014, 0.014, 0.014), roughness 0.40, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/interior/metal.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#stair는 색·재료를 말로만 정했고 검은 도장 금속은 #1F1F20 값과 roughness 0.40, `baluster`·`bottom-rail`·`handle`·`hinge` 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 검은 도장 금속은 구성을 '분체 도장 강재'로, 외관의 #1F1F20·roughness 0.40·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 검은 도장 금속의 결합 vocabulary는 난간의 `baluster`·`bottom-rail`, 문 `handle`·`hinge`, 주침실 커튼의 `rod`·`bracket`이며 부재별 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 검은 도장 금속의 반증 견본은 '흰 벽 앞에서 난간살 하나하나가 분리되어 보이는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #1F1F20 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 검은 도장 금속은 settings/10-house.md#stair, settings/10-house.md#shower-bathroom를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 난간살·손잡이·등기구에 0.05 m 모듈의 미세 분체결을 부재 국소 길이 U로 투영한다. 각 파티션 시작점에서 위상을 잡고 접합에서 끊어 광택이 검은 단색판으로 뭉개지지 않게 한다.
@evidence settings/10-house.md#porch-entry 검은 도장 금속이 '현관 포치와 외부 진입'(settings/10-house.md#porch-entry)를 링크로 소비해 #1F1F20 값과 결합 면의 근거로 삼았다.
@evidence settings/10-house.md#shower-bathroom 검은 도장 금속이 '샤워 욕실'(settings/10-house.md#shower-bathroom)를 링크로 소비해 #1F1F20 값과 결합 면의 근거로 삼았다.
@evidence settings/10-house.md#stair 검은 도장 금속이 '단일 꺾임계단'(settings/10-house.md#stair)를 링크로 소비해 #1F1F20 값과 결합 면의 근거로 삼았다.
-->

[검은 수직 철제 난간살](../settings/10-house.md#stair)과 [검은 금속 손잡이](../settings/10-house.md#shower-bathroom), 현관의 [어두운 손잡이](../settings/10-house.md#porch-entry)다. 구성은 분체 도장 강재다. 외관은 도막을 근사하므로 [거칠기·금속성 관례](00-material-frame.md#material-response-conventions)에 따라 metallic 0.0이며 `#1F1F20`(선형 0.014, 0.014, 0.014), roughness 0.40, transmission 0.0이다. 결합 면은 [난간살](../models/04-stair-members.md#stair-balusters)의 `baluster`와 [아래 부재](../models/04-stair-members.md#stair-bottom-member)의 `bottom-rail`, 실내 문의 `handle`·`hinge`, 현관문 `handle`, 샤워부스 손잡이, 수건걸이·욕조 커튼 레일, [주침실 두 창 커튼](../models/13-bedrooms.md#primary-window-curtains)의 `rod`·`bracket`, [벽 거울](../models/14-bathrooms.md#wall-mirror)의 `mirror-frame`이다. source owner는 `src/materials/interior/metal.ts`이고, 리뷰는 흰 벽 앞에서 난간살 하나하나와 창 앞의 가는 커튼 봉이 분리되어 보이는지를 관찰한다.

머드룸 `hook`, 문과 수납의 검은 `handle`·`hinge`·`rail`, 수건걸이의 `bracket`, 거울의 `mirror-frame`, 등기구의 `fixture-housing`·`fixture-canopy`·`fixture-stem`도 이 금속 도막을 받는다. 각 부품 길이 U·둘레 V의 미터 UV를 부품 끝에서 끊는다.

표면 결속 계획: 난간살·손잡이·등기구 검은 도장 금속은 0.05 m 모듈의 미세 분체결을 부재 국소 길이 U로 투영한다. 각 파티션 시작점에서 위상을 잡고 접합에서 끊어 광택이 검은 단색판으로 뭉개지지 않게 한다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 베이지 카펫 {#beige-carpet}
<!--
@evidence principles/core/common.md#declared-basis 베이지 카펫의 #CDBFA6·roughness 0.95은 settings/10-house.md#upper-hall의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 베이지 카펫은 `src/spaces/rooms/upper-hall.ts`·`primary.ts`·`wardrobe.ts`·`bedroom-two.ts`·`bedroom-three.ts` owner의 보이는 바닥 마감에 마감만 결합하고 그 면의 geometry·경계와 개수는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 베이지 카펫은 #CDBFA6(선형 0.610, 0.521, 0.381), roughness 0.95, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/interior/floors.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#upper-hall는 색·재료를 말로만 정했고 베이지 카펫은 #CDBFA6 값과 roughness 0.95, 결합 면 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 베이지 카펫은 구성을 '짧은 루프 파일 카펫과 하부 패드'로, 외관의 #CDBFA6·roughness 0.95·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 베이지 카펫의 결합 vocabulary는 `src/spaces/rooms/upper-hall.ts`·`primary.ts`·`wardrobe.ts`·`bedroom-two.ts`·`bedroom-three.ts` owner의 보이는 바닥 마감이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 베이지 카펫의 반증 견본은 '05 view에서 카펫이 마루보다 밝고 하이라이트 없이 읽히며 욕실 문턱에서 타일과 경계가 맞는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #CDBFA6 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 베이지 카펫은 settings/10-house.md#upper-hall, settings/10-house.md#primary-bedroom를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 상층 카펫의 짧은 루프 파일은 0.01 m 반복의 결정론적 색·법선 결이다. 세계 X/Z를 U/V로, 상층 바닥 원점을 공유하며 욕실 타일·문턱·계단 가장자리에서 끊는다.
@evidence settings/10-house.md#bedroom-two 베이지 카펫이 '올리브 침구의 작은 침실'(settings/10-house.md#bedroom-two)를 링크로 소비해 #CDBFA6 값과 결합 면의 근거로 삼았다.
@evidence settings/10-house.md#primary-bedroom 베이지 카펫이 '주침실'(settings/10-house.md#primary-bedroom)를 링크로 소비해 #CDBFA6 값과 결합 면의 근거로 삼았다.
@evidence settings/10-house.md#shower-bathroom 베이지 카펫이 '샤워 욕실'(settings/10-house.md#shower-bathroom)를 링크로 소비해 #CDBFA6 값과 결합 면의 근거로 삼았다.
@evidence settings/10-house.md#upper-hall 베이지 카펫이 '상층 복도'(settings/10-house.md#upper-hall)를 링크로 소비해 #CDBFA6 값과 결합 면의 근거로 삼았다.
@evidence spaces/rooms/shower-bath.md#shower-bath-plan shower-bath-plan의 '카펫은 방 문턱에서 끝난다'를 베이지 카펫 #CDBFA6의 결합 범위가 욕실 문턱에서 멈추는 것으로 받는다.
@evidence spaces/08-floor-assembly.md#interstorey-floor-boundary 층간 바닥이 타일과 카펫의 두께 차로 새 단을 만들지 않게 했으므로 베이지 카펫은 방 owner의 완성 바닥 면에 파일 결속과 기준색을 적용하고 datum을 바꾸지 않는다.
@evidence spaces/04-observations.md#reference-spatial-comparisons 방별 카펫·욕실 타일이 같은 집으로 읽히는지 비교하는 관찰을 베이지 카펫 #CDBFA6와 욕실 타일 값의 명도 차로 대비할 수 있게 했다.
-->

[상층 복도의 베이지 카펫](../settings/10-house.md#upper-hall)과 [주침실](../settings/10-house.md#primary-bedroom)·[두 작은 침실](../settings/10-house.md#bedroom-two)의 중성 카펫을 한 재료로 정한다. 한 재료로 두는 이유는 두 작은 침실이 주침실의 재료 체계를 잇는다는 settings 조건이다. 구성은 짧은 루프 파일 카펫과 하부 패드이며 파일 결은 0.01 m 반복의 색·법선 맵으로 표현한다. 외관은 `#CDBFA6`(선형 0.610, 0.521, 0.381), roughness 0.95, metallic 0.0, transmission 0.0이다. 결합 면은 upper-hall·primary·wardrobe·bedroom-two·bedroom-three owner의 보이는 바닥 마감이며 [욕실 문턱에서 끝난다](../settings/10-house.md#shower-bathroom). source owner는 `src/materials/interior/floors.ts`이고, 리뷰는 05 view에서 카펫이 마루보다 밝고 하이라이트 없이 읽히며 욕실 문턱에서 타일과 경계가 맞는지를 관찰한다.

표면 결속 계획: 상층 카펫의 짧은 루프 파일은 0.01 m 반복의 결정론적 색·법선 결이다. 세계 X/Z를 U/V로, 상층 바닥 원점을 공유하며 욕실 타일·문턱·계단 가장자리에서 끊는다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 욕실 바닥 타일 {#bath-floor-tile}
<!--
@evidence principles/core/common.md#declared-basis 욕실 바닥 타일의 #D8D4CC·roughness 0.40은 settings/10-house.md#powder의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 욕실 바닥 타일은 `src/spaces/rooms/powder.ts`·`shower-bath.ts`·`tub-bath.ts` owner의 보이는 바닥 마감에 마감만 결합하고 그 면의 geometry·경계와 개수는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 욕실 바닥 타일은 #D8D4CC(선형 0.687, 0.658, 0.604), roughness 0.40, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/interior/tile.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#powder는 색·재료를 말로만 정했고 욕실 바닥 타일은 #D8D4CC 값과 roughness 0.40, 결합 면 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 욕실 바닥 타일은 구성을 '유약 자기질 타일 0.30 m 모듈'로, 외관의 #D8D4CC·roughness 0.40·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 욕실 바닥 타일의 결합 vocabulary는 `src/spaces/rooms/powder.ts`·`shower-bath.ts`·`tub-bath.ts` owner의 보이는 바닥 마감이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 욕실 바닥 타일의 반증 견본은 '욕실 threshold view에서 바닥·벽 타일이 구별되는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #D8D4CC 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 욕실 바닥 타일은 settings/10-house.md#powder를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 욕실 바닥 타일은 0.30 × 0.30 m 판과 줄눈의 반복 결을 쓴다. 세계 X/Z를 U/V로 욕실별 안쪽 모서리를 원점으로 놓고 배수·벽·문턱에서 절단한다.
@evidence settings/10-house.md#powder 욕실 바닥 타일이 '파우더룸'(settings/10-house.md#powder)를 링크로 소비해 #D8D4CC 값과 결합 면의 근거로 삼았다.
@evidence spaces/rooms/tub-bath.md#tub-fixture-use tub-fixture-use가 공간 입력 밖으로 둔 타일/카펫 경계의 재료 구현을 욕실 바닥 타일 #D8D4CC가 tub-bath owner 바닥에서 받고 카펫은 문턱에서 끝난다.
-->

[밝은 타일 바닥](../settings/10-house.md#powder)과 욕실의 방수 바닥이다. 구성은 유약 자기질 타일 0.30 m 모듈이며 줄눈은 geometry가 오목하게 만든 면에 [타일 줄눈](#tile-grout)을 결합한다. 외관은 유약면을 근사하는 `#D8D4CC`(선형 0.687, 0.658, 0.604), roughness 0.40, metallic 0.0, transmission 0.0이다. 벽 타일보다 어두워 바닥과 벽의 경계가 읽힌다. 결합 면은 powder·shower-bath·tub-bath owner의 보이는 바닥 마감이다. source owner는 `src/materials/interior/tile.ts`이고, 리뷰는 욕실 threshold view에서 바닥·벽 타일이 구별되는지를 관찰한다.

표면 결속 계획: 욕실 바닥 타일은 0.30 × 0.30 m 판과 줄눈의 반복 결을 쓴다. 세계 X/Z를 U/V로 욕실별 안쪽 모서리를 원점으로 놓고 배수·벽·문턱에서 절단한다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 욕실 벽 타일 {#bath-wall-tile}
<!--
@evidence principles/core/common.md#declared-basis 욕실 벽 타일의 #EEEDEA·roughness 0.30은 settings/10-house.md#shower-bathroom의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 욕실 벽 타일은 `src/spaces/rooms/shower-bath.ts`·`tub-bath.ts`의 샤워·욕조 주위 벽 구역과 `src/spaces/rooms/common.ts`의 주방 하부장·상부장 사이 벽 구역에 마감만 결합하고 그 면의 geometry·경계와 개수는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 욕실 벽 타일은 #EEEDEA(선형 0.855, 0.847, 0.823), roughness 0.30, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/interior/tile.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#shower-bathroom는 색·재료를 말로만 정했고 욕실 벽 타일은 #EEEDEA 값과 roughness 0.30, 결합 면 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 욕실 벽 타일은 구성을 '유약 도기 벽 타일'로, 외관의 #EEEDEA·roughness 0.30·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 욕실 벽 타일의 결합 vocabulary는 `src/spaces/rooms/shower-bath.ts`·`tub-bath.ts`의 샤워·욕조 주위 벽 구역과 `src/spaces/rooms/common.ts`의 주방 하부장·상부장 사이 벽 구역이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 욕실 벽 타일의 반증 견본은 '05와 03 view에서 흰 타일이 벽 도장과 광택 차이로 구별되는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #EEEDEA 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 욕실 벽 타일은 settings/10-house.md#shower-bathroom, settings/10-house.md#kitchen-equipment를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 욕실 벽 타일은 0.30 m 가로 × 0.10 m 세로의 엇갈린 줄과 약한 유약 거칠기를 쓴다. 벽 왼쪽 아래에서 U 수평·V 높이로 놓고 코너·문·니치·설비에서 절단한다.
@evidence settings/10-house.md#kitchen-equipment 욕실 벽 타일이 '주방 설비'(settings/10-house.md#kitchen-equipment)를 링크로 소비해 #EEEDEA 값과 결합 면의 근거로 삼았다.
@evidence settings/10-house.md#shower-bathroom 욕실 벽 타일이 '샤워 욕실'(settings/10-house.md#shower-bathroom)를 링크로 소비해 #EEEDEA 값과 결합 면의 근거로 삼았다.
@evidence spaces/rooms/shower-bath.md#shower-fixture-use shower-fixture-use가 유지하라는 도기/타일 읽힘을 욕실 벽 타일 #EEEDEA(roughness 0.30)와 흰 에나멜(roughness 0.25)의 광택 차로 받는다.
-->

[흰 타일](../settings/10-house.md#shower-bathroom)과 주방의 [타일 backsplash](../settings/10-house.md#kitchen-equipment)다. 구성은 유약 도기 벽 타일이며 모듈과 줄눈은 geometry가 만든다. 외관은 `#EEEDEA`(선형 0.855, 0.847, 0.823), roughness 0.30, metallic 0.0, transmission 0.0이다. 결합 면은 샤워부스 안 벽, 욕조 주위 벽, 주방 하부장과 상부장 사이 벽 구역이며, 그 구역의 경계는 host owner의 기구·수납 끝선을 따른다. source owner는 `src/materials/interior/tile.ts`이고, 리뷰는 05와 03 view에서 흰 타일이 벽 도장과 광택 차이로 구별되는지를 관찰한다.

표면 결속 계획: 욕실 벽 타일은 0.30 m 가로 × 0.10 m 세로의 엇갈린 줄과 약한 유약 거칠기를 쓴다. 벽 왼쪽 아래에서 U 수평·V 높이로 놓고 코너·문·니치·설비에서 절단한다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 타일 줄눈 {#tile-grout}
<!--
@evidence principles/core/common.md#declared-basis 타일 줄눈의 #A9A39A·roughness 0.90은 settings/20-verification.md#visual-grammar의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 타일 줄눈은 두 타일 재료를 받는 방 owner 면 안에서 타일 geometry가 만든 오목한 줄눈 면에 마감만 결합하고 그 면의 geometry·경계와 개수는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 타일 줄눈은 #A9A39A(선형 0.397, 0.366, 0.323), roughness 0.90, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/interior/tile.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/20-verification.md#visual-grammar는 색·재료를 말로만 정했고 타일 줄눈은 #A9A39A 값과 roughness 0.90, 결합 면 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 타일 줄눈은 구성을 '시멘트 줄눈'로, 외관의 #A9A39A·roughness 0.90·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 타일 줄눈의 결합 vocabulary는 두 타일 재료를 받는 방 owner 면 안에서 타일 geometry가 만든 오목한 줄눈 면이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 타일 줄눈의 반증 견본은 '근접 view에서 줄눈 격자가 모듈과 일치하고 색 패치가 아닌 음영으로 읽히는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #A9A39A 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 타일 줄눈은 settings/20-verification.md#visual-grammar를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability `grout`은 타일 사이 0.005 m 폭의 오목한 회색 미세결만 받는다. 타일과 같은 U/V 원점·회전을 공유하고 타일 상면에는 번지지 않으며 가장자리 절단에서 끝난다.
-->

두 타일 재료의 줄눈 면이다. 구성은 시멘트 줄눈이다. 외관은 `#A9A39A`(선형 0.397, 0.366, 0.323), roughness 0.90, metallic 0.0, transmission 0.0이다. 결합 면은 타일 geometry의 오목한 줄눈 면뿐이며 타일 윗면에 선을 칠하지 않는다. source owner는 `src/materials/interior/tile.ts`이고, 리뷰는 근접 view에서 줄눈 격자가 모듈과 일치하고 색 패치가 아닌 음영으로 읽히는지를 관찰한다.

표면 결속 계획: `grout`은 타일 사이 0.005 m 폭의 오목한 회색 미세결만 받는다. 타일과 같은 U/V 원점·회전을 공유하고 타일 상면에는 번지지 않으며 가장자리 절단에서 끝난다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 세탁실 밝은 회색 바닥 {#laundry-floor}
<!--
@evidence principles/core/common.md#declared-basis 세탁실 밝은 회색 바닥의 #C9C4BA·roughness 0.50은 settings/10-house.md#laundry-mudroom의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 세탁실 밝은 회색 바닥은 `src/spaces/rooms/laundry.ts` owner의 보이는 바닥 마감과 머드룸 쪽 높은 문턱 챌면에 마감만 결합하고 그 면의 geometry·경계와 개수는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 세탁실 밝은 회색 바닥은 #C9C4BA(선형 0.584, 0.552, 0.491), roughness 0.50, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/interior/floors.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#laundry-mudroom는 색·재료를 말로만 정했고 세탁실 밝은 회색 바닥은 #C9C4BA 값과 roughness 0.50, 결합 면 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 세탁실 밝은 회색 바닥은 구성을 '비닐 판 바닥'로, 외관의 #C9C4BA·roughness 0.50·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 세탁실 밝은 회색 바닥의 결합 vocabulary는 `src/spaces/rooms/laundry.ts` owner의 보이는 바닥 마감과 머드룸 쪽 높은 문턱 챌면이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 세탁실 밝은 회색 바닥의 반증 견본은 '머드룸 문 view에서 두 바닥의 명도·광택 차'이고 00 재료 리뷰 견본의 중성 조명 판이 #C9C4BA 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 세탁실 밝은 회색 바닥은 settings/10-house.md#laundry-mudroom를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 세탁실의 밝은 회색 바닥은 0.30 m 정방 모듈의 약한 얼룩·거칠기를 쓴다. 세계 X/Z와 방 안쪽 모서리를 원점으로 하고 머드룸·차고 문턱에서 이음을 끊는다.
@evidence settings/10-house.md#laundry-mudroom 세탁실 밝은 회색 바닥이 '세탁 겸 머드룸'(settings/10-house.md#laundry-mudroom)를 링크로 소비해 #C9C4BA 값과 결합 면의 근거로 삼았다.
-->

[밝은 회색의 내구성 바닥](../settings/10-house.md#laundry-mudroom)이다. 구성은 비닐 판 바닥이다. 외관은 `#C9C4BA`(선형 0.584, 0.552, 0.491), roughness 0.50, metallic 0.0, transmission 0.0이다. [차고 콘크리트](#garage-concrete)보다 밝고 매끈해 두 바닥이 같은 문턱에서 구별된다. 결합 면은 laundry owner의 보이는 바닥 마감과 머드룸 쪽 높은 문턱 챌면이다. source owner는 `src/materials/interior/floors.ts`이고, 리뷰는 머드룸 문 view에서 두 바닥의 명도·광택 차를 관찰한다.

표면 결속 계획: 세탁실의 밝은 회색 바닥은 0.30 m 정방 모듈의 약한 얼룩·거칠기를 쓴다. 세계 X/Z와 방 안쪽 모서리를 원점으로 하고 머드룸·차고 문턱에서 이음을 끊는다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 차고 콘크리트 {#garage-concrete}
<!--
@evidence principles/core/common.md#declared-basis 차고 콘크리트의 #9C9890·roughness 0.85은 settings/10-house.md#garage의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 차고 콘크리트는 `src/spaces/rooms/garage-interior.ts` owner의 노출 콘크리트 상면에 마감만 결합하고 그 면의 geometry·경계와 개수는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 차고 콘크리트는 #9C9890(선형 0.332, 0.314, 0.279), roughness 0.85, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/interior/floors.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#garage는 색·재료를 말로만 정했고 차고 콘크리트는 #9C9890 값과 roughness 0.85, 결합 면 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 차고 콘크리트는 구성을 '흙손 마감 콘크리트 슬래브'로, 외관의 #9C9890·roughness 0.85·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 차고 콘크리트의 결합 vocabulary는 `src/spaces/rooms/garage-interior.ts` owner의 노출 콘크리트 상면이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 차고 콘크리트의 반증 견본은 '차고 코너 view에서 바닥이 포장 콘크리트보다 어둡고 거칠게 읽히는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #9C9890 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 차고 콘크리트는 settings/10-house.md#garage, spaces/rooms/garage-interior.md#garage-interior-plan를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 빈 차고 바닥은 0.50 m 콘크리트 잔골재·완만한 얼룩 모듈을 쓴다. 세계 X/Z를 U/V로 차고 앞 왼쪽 모서리를 원점으로 하고 차고문 레일·머드룸 문턱·포장 경계에서 자른다.
@evidence settings/10-house.md#garage 차고 콘크리트가 '빈 2대 차고'(settings/10-house.md#garage)를 링크로 소비해 #9C9890 값과 결합 면의 근거로 삼았다.
@evidence spaces/rooms/garage-interior.md#garage-interior-plan 차고 콘크리트가 '머드룸 연결과 비어 있는 바닥'(spaces/rooms/garage-interior.md#garage-interior-plan)를 링크로 소비해 #9C9890 값과 결합 면의 근거로 삼았다.
-->

[차고의 콘크리트 바닥과 내부](../settings/10-house.md#garage)다. 구성은 흙손 마감 콘크리트 슬래브다. 외관은 `#9C9890`(선형 0.332, 0.314, 0.279), roughness 0.85, metallic 0.0, transmission 0.0이다. 차고 내부 벽은 도장 석고보드이므로 [실내 벽 도장](#interior-wall-paint)을 받고 회색 변형을 따로 두지 않는다. 결합 면은 [garage-interior](../spaces/rooms/garage-interior.md#garage-interior-plan) owner의 노출 콘크리트 상면이다. source owner는 `src/materials/interior/floors.ts`이고, 리뷰는 차고 코너 view에서 바닥이 포장 콘크리트보다 어둡고 거칠게 읽히는지를 관찰한다.

표면 결속 계획: 빈 차고 바닥은 0.50 m 콘크리트 잔골재·완만한 얼룩 모듈을 쓴다. 세계 X/Z를 U/V로 차고 앞 왼쪽 모서리를 원점으로 하고 차고문 레일·머드룸 문턱·포장 경계에서 자른다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

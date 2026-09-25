# 외부 재료

## 따뜻한 백색 lap siding {#siding-warm-white}
<!--
@evidence principles/core/common.md#declared-basis 따뜻한 백색 lap siding의 #EDE8DC·roughness 0.55은 settings/20-verification.md#visual-grammar의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 따뜻한 백색 lap siding은 spaces 03 exterior-surface-handoff의 네 입면 owner(`src/spaces/envelope/front.ts`·`rear.ts`·`left.ts`·`right.ts`) 바깥 벽면에 놓이는 lap siding 판에 마감만 결합하고 그 면의 geometry·경계와 개수는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 따뜻한 백색 lap siding은 #EDE8DC(선형 0.847, 0.807, 0.716), roughness 0.55, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/exterior/siding.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/20-verification.md#visual-grammar는 색·재료를 말로만 정했고 따뜻한 백색 lap siding은 #EDE8DC 값과 roughness 0.55, `siding-face`·`siding-butt`·`siding-back`·`siding-top`·`siding-cut` 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 따뜻한 백색 lap siding은 구성을 '공장 도장한 섬유시멘트 판'로, 외관의 #EDE8DC·roughness 0.55·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 따뜻한 백색 lap siding의 결합 vocabulary는 `siding-face`·`siding-butt`·`siding-back`·`siding-top`·`siding-cut`이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 따뜻한 백색 lap siding의 반증 견본은 '[재료 리뷰 견본](00-material-frame.md#material-review-set)의 01 외관 기본 view와 벽 앞 2 m 근접…'이고 00 재료 리뷰 견본의 중성 조명 판이 #EDE8DC 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 따뜻한 백색 lap siding은 settings/20-verification.md#visual-grammar와 이번 모델 수리 뒤의 models/15-outdoor.md#lap-siding-board를 소비한다. 모서리 trim owner 추가는 모델 분기의 수리이며 이 재료 H2가 요구한 부모 결함은 아니다.
@evidence contracts/texture-readability.md#material-texture-readability `siding-face`의 도장 섬유결을 결정론적 색·거칠기 맵으로 만든다. 판의 국소 +X를 U, +Y를 V로 놓고 아래 모서리를 원점으로 하며 0.15 m 노출 높이마다 결이 반복된다. 판 끝·창 void에서는 끊고 같은 높이의 코너 course는 위상을 맞춘다.
@evidence obligations/design/materials.md#material-identity-assembly 공장 도장 섬유시멘트 판과 lap siding 판의 siding-face·siding-butt·siding-back·siding-top·siding-cut 파티션으로 siding의 구성과 단위를 명명했다.
@evidence settings/20-verification.md#visual-grammar 따뜻한 백색 lap siding이 '공통 재료와 외피 인상'(settings/20-verification.md#visual-grammar)를 링크로 소비해 #EDE8DC 값과 결합 면의 근거로 삼았다.
@evidence spaces/envelope/front.md#front-openings 따뜻한 백색 lap siding이 '거실·침실·계단의 창과 현관문'(spaces/envelope/front.md#front-openings)를 링크로 소비해 #EDE8DC 값과 결합 면의 근거로 삼았다.
@evidence spaces/envelope/left.md#left-openings 따뜻한 백색 lap siding이 '굴뚝 뒤에서 방으로 열리는 창'(spaces/envelope/left.md#left-openings)를 링크로 소비해 #EDE8DC 값과 결합 면의 근거로 삼았다.
@evidence spaces/envelope/rear.md#rear-openings 따뜻한 백색 lap siding이 '공용부와 주침실의 정원 쪽 개구부'(spaces/envelope/rear.md#rear-openings)를 링크로 소비해 #EDE8DC 값과 결합 면의 근거로 삼았다.
@evidence spaces/envelope/right.md#right-openings 따뜻한 백색 lap siding이 '차고 접합을 피한 측면 채광'(spaces/envelope/right.md#right-openings)를 링크로 소비해 #EDE8DC 값과 결합 면의 근거로 삼았다.
-->

[공통 재료와 외피 인상](../settings/20-verification.md#visual-grammar)의 따뜻한 백색 수평 lap siding이다. 구성은 공장 도장한 섬유시멘트 판이며 course의 노출 높이와 겹침 그림자는 [lap siding 판 단면](../models/15-outdoor.md#lap-siding-board)의 판 geometry와 그 반복 instance가 만든다. 외관은 도막 한 층의 색과 광택만 근사하는 `#EDE8DC`(선형 0.847, 0.807, 0.716), roughness 0.55, metallic 0.0, transmission 0.0이다. trim `#F6F4EE`보다 한 단계 따뜻하고 어두워 [흰 trim](#trim-white)과 벽이 같은 흰색으로 합쳐지지 않게 한다. 결합 면은 lap siding 판의 `siding-face`·`siding-butt`·`siding-back`·`siding-top`·`siding-cut`이며, 판이 덮는 host는 [전면](../spaces/envelope/front.md#front-openings)·[후면](../spaces/envelope/rear.md#rear-openings)·[왼쪽](../spaces/envelope/left.md#left-openings)·[오른쪽](../spaces/envelope/right.md#right-openings) 입면 owner의 기단 윗선 위 바깥 벽면, 박공 삼각 벽, 차고 바깥 벽면이다. 창·문 void와 trim 부재 면은 받지 않는다. source owner는 `src/materials/exterior/siding.ts`이고, 리뷰는 [재료 리뷰 견본](00-material-frame.md#material-review-set)의 01 외관 기본 view와 벽 앞 2 m 근접 view에서 siding과 trim의 명도 차가 읽히고 한 입면 안에 색 패치가 없는지를 관찰한다.

표면 결속 계획: `siding-face`의 도장 섬유결을 결정론적 색·거칠기 맵으로 만든다. 판의 국소 +X를 U, +Y를 V로 놓고 아래 모서리를 원점으로 하며 0.15 m 노출 높이마다 결이 반복된다. 판 끝·창 void에서는 끊고 같은 높이의 코너 course는 위상을 맞춘다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 흰 외부 trim {#trim-white}
<!--
@evidence principles/core/common.md#declared-basis 흰 외부 trim의 #F6F4EE·roughness 0.35은 settings/20-verification.md#visual-grammar의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 흰 외부 trim은 models/15-outdoor.md#exterior-corner-trim 및 창·문 모델의 trim 면, 여덟 지붕 경사면 owner(`src/spaces/roof/*.ts`)의 처마 하부·fascia, `src/spaces/porch.ts`의 기둥·보·받침에 마감만 결합하고 그 면의 geometry·경계와 개수는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 흰 외부 trim은 #F6F4EE(선형 0.922, 0.905, 0.855), roughness 0.35, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/exterior/trim.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/20-verification.md#visual-grammar는 색·재료를 말로만 정했고 흰 외부 trim은 #F6F4EE 값과 roughness 0.35, 모델의 `exterior-trim`·`jamb` 및 spaces 문턱판 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 흰 외부 trim은 구성을 '반광 도장한 PVC·목재 trim 판'로, 외관의 #F6F4EE·roughness 0.35·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 흰 외부 trim은 모델 `exterior-trim`·`jamb`와 spaces의 전후면 문턱판 id에 결합하며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 흰 외부 trim의 반증 견본은 '오후 key 아래 처마 soffit이 완전 검정으로 닫히지 않고 기둥 네 면이 같은 재료로 읽히는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #F6F4EE 값을 대조한다.
@evidence upstream/design/materials.md#parent-revision-from-material-work 모서리 판의 `exterior-trim` 결속을 대조하니 창 문선과 달리 닫힌 모서리 판 원형이 없었다. models/15-outdoor.md#exterior-corner-trim을 새 설계 owner로 추가하고 spaces/07-boundary-assembly.md#exterior-boundary-junctions에 구조 모서리 몸체와 별도 trim 판의 인계를 명시한 뒤 이 재료를 결합한다. settings/20-verification.md#visual-grammar의 흰 trim 읽힘은 유지했다.
@evidence contracts/texture-readability.md#material-texture-readability `exterior-trim`과 처마 fascia·soffit은 도장 미세결을 0.10 m 모듈로 반복한다. 각 부재 길이를 U, 폭을 V로 하고 한 끝 모서리를 원점으로 두며 코너 맞댐에서는 방향을 새로 잡는다.
@evidence settings/20-verification.md#visual-grammar 흰 외부 trim이 '공통 재료와 외피 인상'(settings/20-verification.md#visual-grammar)를 링크로 소비해 #F6F4EE 값과 결합 면의 근거로 삼았다.
@evidence spaces/porch.md#porch-roof-columns 흰 외부 trim이 '세 기둥과 낮은 경사 지붕'(spaces/porch.md#porch-roof-columns)를 링크로 소비해 #F6F4EE 값과 결합 면의 근거로 삼았다.
-->

창·문 둘레 casing, 모서리 판, 처마 fascia와 soffit, 포치 기둥·보다. 구성은 반광 도장한 PVC·목재 trim 판이다. 외관은 `#F6F4EE`(선형 0.922, 0.905, 0.855), roughness 0.35, metallic 0.0, transmission 0.0이며 반광으로 siding(0.55)보다 좁은 하이라이트를 가져 [trim이 돌출과 음영으로 접합을 설명](../settings/20-verification.md#visual-grammar)하는 읽힘을 돕는다. 결합 면은 [외벽 모서리 trim 원형](../models/15-outdoor.md#exterior-corner-trim)의 `exterior-trim`, [창의 표면 파티션](../models/01-windows.md#window-surface-partitions)의 `exterior-trim`, [현관문](../models/02-exterior-doors.md#front-entry-door)과 [정원문](../models/02-exterior-doors.md#garden-door-pair)의 `exterior-trim`·`jamb`, [전후면 문턱판](../spaces/10-ground-floor.md#ground-threshold-junctions)의 `front-door-threshold`·`garden-door-threshold`, 각 지붕 경사면 owner의 처마 하부와 fascia, [포치의 기둥·보·받침](../spaces/porch.md#porch-roof-columns)이다. 입면 owner는 모서리의 구조 벽과 연속 날씨 면을 만들지만 닫힌 L자 trim 판은 복제하지 않는다. source owner는 `src/materials/exterior/trim.ts`이고, 리뷰는 오후 key 아래 처마 soffit이 완전 검정으로 닫히지 않고 기둥 네 면이 같은 재료로 읽히는지를 관찰한다.

표면 결속 계획: `exterior-trim`과 처마 fascia·soffit은 도장 미세결을 0.10 m 모듈로 반복한다. 각 부재 길이를 U, 폭을 V로 하고 한 끝 모서리를 원점으로 두며 코너 맞댐에서는 방향을 새로 잡는다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 어두운 asphalt shingle {#roof-shingle}
<!--
@evidence principles/core/common.md#declared-basis 어두운 asphalt shingle의 #3A3C3E·roughness 0.90은 settings/20-verification.md#visual-grammar의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 어두운 asphalt shingle은 spaces 03 표의 여덟 지붕 경사면 owner(`src/spaces/roof/*.ts`)와 `src/spaces/porch.ts` 포치 지붕의 상면에 마감만 결합하고 그 면의 geometry·경계와 개수는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 어두운 asphalt shingle은 #3A3C3E(선형 0.042, 0.045, 0.048), roughness 0.90, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/exterior/shingle.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/20-verification.md#visual-grammar는 색·재료를 말로만 정했고 어두운 asphalt shingle은 #3A3C3E 값과 roughness 0.90, 결합 면 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 어두운 asphalt shingle은 구성을 '광물 입자를 입힌 asphalt shingle'로, 외관의 #3A3C3E·roughness 0.90·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 어두운 asphalt shingle의 결합 vocabulary는 spaces 03 표의 여덟 지붕 경사면 owner(`src/spaces/roof/*.ts`)와 `src/spaces/porch.ts` 포치 지붕의 상면이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 어두운 asphalt shingle의 반증 견본은 '높은 roof view에서 경사면마다 같은 색이고 골짜기에서 재료가 끊기지 않는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #3A3C3E 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 어두운 asphalt shingle은 settings/20-verification.md#visual-grammar를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability `shingle-face`의 광물 입자 거칠기와 미세 색 차를 결정론적 맵으로 만든다. 각 지붕 면의 처마를 V 원점, 처마 평행선을 U로 놓고 탭 폭 0.330 m·course 노출 0.14 m에 맞춘다. 골짜기·용마루·굴뚝 절단에서 pattern은 실제 잘린 부재와 함께 끝난다.
@evidence settings/20-verification.md#visual-grammar 어두운 asphalt shingle이 '공통 재료와 외피 인상'(settings/20-verification.md#visual-grammar)를 링크로 소비해 #3A3C3E 값과 결합 면의 근거로 삼았다.
-->

[작고 규칙적인 어두운 asphalt shingle](../settings/20-verification.md#visual-grammar)이다. 구성은 광물 입자를 입힌 asphalt shingle이며 중첩 결은 지붕 경사면 owner와 instance의 shingle 줄 geometry가 만든다. 외관은 입자 표면을 평균한 `#3A3C3E`(선형 0.042, 0.045, 0.048), roughness 0.90, metallic 0.0, transmission 0.0이다. 결합 면은 여덟 지붕 경사면 owner와 포치 지붕의 상면이며 처마 하부·fascia는 [흰 trim](#trim-white)이 받는다. source owner는 `src/materials/exterior/shingle.ts`이고, 리뷰는 높은 roof view에서 경사면마다 같은 색이고 골짜기에서 재료가 끊기지 않는지를 관찰한다.

shingle 원형의 `shingle-face`·`shingle-butt`·`shingle-back`·`shingle-cut` 네 면은 같은 지붕널 재료를 받되 UV 이음은 탭 절단과 줄 끝에서 끊는다.

표면 결속 계획: `shingle-face`의 광물 입자 거칠기와 미세 색 차를 결정론적 맵으로 만든다. 각 지붕 면의 처마를 V 원점, 처마 평행선을 U로 놓고 탭 폭 0.330 m·course 노출 0.14 m에 맞춘다. 골짜기·용마루·굴뚝 절단에서 pattern은 실제 잘린 부재와 함께 끝난다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 붉은갈색 벽돌 {#brick-red-brown}
<!--
@evidence principles/core/common.md#declared-basis 붉은갈색 벽돌의 #8A4A3A·roughness 0.85은 settings/20-verification.md#visual-grammar의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 붉은갈색 벽돌은 네 입면 owner의 기단 노출 수직 면과 `src/spaces/envelope/left.ts`가 만드는 굴뚝·벽난로 벽돌 몸체에 결합한다. 줄눈은 같은 면의 UV 마스크로 표현하며 별도 메시나 instance를 요구하지 않는다.
@evidence principles/core/common.md#substantive-completion 붉은갈색 벽돌은 #8A4A3A(선형 0.254, 0.068, 0.042), roughness 0.85, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/exterior/brick.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/20-verification.md#visual-grammar는 색·재료를 말로만 정했고 붉은갈색 벽돌은 #8A4A3A 값과 roughness 0.85, 결합 면 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 붉은갈색 벽돌은 구성을 '소성 점토 벽돌과 시멘트 모르타르 줄눈'로, 외관의 #8A4A3A·roughness 0.85·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 붉은갈색 벽돌의 결합 대상은 네 입면 owner의 기단 노출 수직 면과 `src/spaces/envelope/left.ts`의 굴뚝·벽난로 벽돌 몸체다. 색과 줄눈 마스크는 기존 면에만 붙인다.
@evidence principles/design/materials.md#material-verification-address 붉은갈색 벽돌의 반증 견본은 '01 외관에서 기단과 굴뚝이 같은 벽돌로 읽히고 줄눈이 창·문을 침범하지 않는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #8A4A3A 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 붉은갈색 벽돌은 spaces/envelope/left.md#chimney-roof-interface를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 기단·굴뚝·벽난로의 벽돌 면에는 줄눈 포함 0.20 × 0.065 m 모듈과 0.01 m 줄눈의 색·거칠기·normal 맵을 쓴다. 벽 길이 U·높이 V, 외벽 바닥선과 굴뚝 하단을 원점으로 하며 홀수 줄은 U를 0.10 m 옮기고 모서리에서 수평 줄눈 높이를 맞추며 개구부에서 끊는다.
@evidence obligations/design/materials.md#material-identity-assembly 소성 점토 벽돌 #8A4A3A 값과 시멘트 모르타르 줄눈 #BDB5A8 두 층을 각자의 값으로 명명했다.
@evidence spaces/envelope/left.md#chimney-roof-interface 붉은갈색 벽돌이 '벽난로에서 지붕까지의 굴뚝'(spaces/envelope/left.md#chimney-roof-interface)를 링크로 소비해 #8A4A3A 값과 결합 면의 근거로 삼았다.
-->

기단·굴뚝·벽난로의 붉은갈색 벽돌이다. 구성은 소성 점토 벽돌과 시멘트 모르타르 줄눈이다. 벽돌 외관은 `#8A4A3A`(선형 0.254, 0.068, 0.042), roughness 0.85, metallic 0.0, transmission 0.0이고 줄눈 외관은 `#BDB5A8`(선형 0.509, 0.462, 0.392), roughness 0.92다. 줄눈은 기존 벽돌 면의 UV에서 줄눈 포함 0.20 × 0.065 m 모듈 가장자리 폭 0.01 m의 색·거칠기·normal 마스크로 만든다. 짝수 줄은 U=0, 홀수 줄은 U=0.10 m에서 시작하고 0.002 m의 음각 normal 응답만 주며 메시를 변위하지 않는다. 별도 오목 geometry·face id나 instance 제작은 요구하지 않는다. 결합 면은 각 입면 owner의 기단 노출 수직 면, [굴뚝 접면](../spaces/envelope/left.md#chimney-roof-interface)의 굴뚝 몸체, 거실 벽난로 본체다. 굴뚝 cap은 [charcoal 금속](#window-frame-charcoal)이다. source owner는 `src/materials/exterior/brick.ts`이고, 리뷰는 01 외관에서 기단과 굴뚝이 같은 벽돌로 읽히고 줄눈이 창·문을 침범하지 않는지를 관찰한다.

표면 결속 계획: 기단·굴뚝·벽난로의 기존 벽돌 면 UV에 줄눈 포함 0.20 × 0.065 m 모듈과 0.01 m 줄눈의 색·거칠기·normal 맵을 쓴다. 벽 길이 U·높이 V, 외벽 바닥선과 굴뚝 하단을 원점으로 하며 홀수 줄은 U를 0.10 m 옮기고 모서리에서 수평 줄눈 높이를 맞추며 개구부에서 끊는다. `modE(x,m)=x−m floor(x/m)`로 두고 줄 번호 `r=floor(V/0.065)`에 따라 `U′=U+0.10×modE(r,2)`로 정한다. `dU=min(modE(U′,0.20),0.20−modE(U′,0.20))`, `dV=min(modE(V,0.065),0.065−modE(V,0.065))` m 중 하나가 0.005 m 미만이면 경계 양쪽을 합친 폭 0.01 m 줄눈이다. 경계 양쪽 0.005 m에 0.002 m 음각 normal 기울기만 주며 메시를 변위하지 않는다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## charcoal 창틀·굴뚝 cap·지붕 flashing {#window-frame-charcoal}
<!--
@evidence principles/core/common.md#declared-basis charcoal 창틀·굴뚝 cap·지붕 flashing의 #2E3033·roughness 0.40은 settings/20-verification.md#visual-grammar의 짙은 외피 금속 조건과 models/15-outdoor.md#asphalt-shingle-strip의 금속 접합 원형을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation charcoal 창틀·굴뚝 cap·지붕 flashing은 models/01-windows.md#window-surface-partitions, models/02-exterior-doors.md#front-entry-door, models/02-exterior-doors.md#garden-door-pair 및 models/15-outdoor.md#eave-gutter-downspout 및 models/15-outdoor.md#asphalt-shingle-strip의 면에 마감만 결합하고 그 면의 geometry·경계는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion charcoal 창틀·굴뚝 cap·지붕 flashing은 #2E3033(선형 0.027, 0.030, 0.033), roughness 0.40, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/exterior/frames.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/20-verification.md#visual-grammar는 색·재료를 말로만 정했고 charcoal 창틀·굴뚝 cap·지붕 flashing은 #2E3033 값과 roughness 0.40, `frame`·`sash`·`mullion`·`muntin`·`roof-flashing` 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance charcoal 창틀·굴뚝 cap·지붕 flashing은 구성을 '분체 도장 알루미늄'로, 외관의 #2E3033·roughness 0.40·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface charcoal 창틀·굴뚝 cap·지붕 flashing의 결합 vocabulary는 `frame`·`sash`·`mullion`·`muntin`·`roof-flashing`이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address charcoal 창틀·굴뚝 cap·지붕 flashing의 반증 견본은 '흰 trim 안에서 창틀이 두께 있는 틀로, 골짜기와 굴뚝 접합의 flashing이 지붕널과 다른 얇은 금속으로 읽히는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #2E3033 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work charcoal 창틀·굴뚝 cap·지붕 flashing은 settings/20-verification.md#visual-grammar, 이번 모델 수리 뒤의 models/01-windows.md#window-surface-partitions와 models/15-outdoor.md#asphalt-shingle-strip의 `roof-flashing`을 소비한다. 바깥 trim 소유 정정은 모델 분기의 수리이며 이 재료 H2가 부모 수정으로 요구한 값은 없다.
@evidence contracts/texture-readability.md#material-texture-readability `frame`·`sash`·`mullion`·`muntin`과 굴뚝 cap·지붕 flashing의 도장 금속 미세결은 각 부재 길이를 U로 한 0.05 m 모듈이다. 국소 부재 끝을 원점으로 하고 맞댐마다 결 방향을 새로 잡으며 모서리 하이라이트를 유지한다.
@evidence settings/20-verification.md#visual-grammar charcoal 창틀·굴뚝 cap·지붕 flashing이 '공통 재료와 외피 인상'(settings/20-verification.md#visual-grammar)를 링크로 소비해 #2E3033 값과 결합 면의 근거로 삼았다.
-->

[창틀의 짙은 charcoal](../settings/20-verification.md#visual-grammar)이다. 구성은 분체 도장 알루미늄이므로 [관례](00-material-frame.md#material-response-conventions)대로 도막을 metallic 0.0으로 표현한다. 외관은 `#2E3033`(선형 0.027, 0.030, 0.033), roughness 0.40, transmission 0.0이다. 결합 면은 [창의 표면 파티션](../models/01-windows.md#window-surface-partitions)의 `frame`·`sash`·`mullion`·`muntin`, [현관문](../models/02-exterior-doors.md#front-entry-door)의 `muntin`, [정원 쪽 유리문](../models/02-exterior-doors.md#garden-door-pair)의 `leaf-exterior`·`leaf-interior`·`leaf-edge`·`sash`, [처마 홈통](../models/15-outdoor.md#eave-gutter-downspout)의 `gutter`·`downspout`, [골짜기와 굴뚝 접합 금속](../models/15-outdoor.md#asphalt-shingle-strip)의 `roof-flashing`, 굴뚝 cap이다. source owner는 `src/materials/exterior/frames.ts`이고, 리뷰는 흰 trim 안에서 창틀이 두께 있는 틀로, 골짜기와 굴뚝 접합의 flashing이 지붕널과 다른 얇은 금속으로 읽히는지를 관찰한다.

표면 결속 계획: `frame`·`sash`·`mullion`·`muntin`과 굴뚝 cap·지붕 flashing의 도장 금속 미세결은 각 부재 길이를 U로 한 0.05 m 모듈이다. 국소 부재 끝을 원점으로 하고 맞댐마다 결 방향을 새로 잡으며 모서리 하이라이트를 유지한다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

`frame`·`mullion`의 물리 폭과 깊이는 [창 부재 치수](../models/01-windows.md#window-member-sizes)가 정한다. [창 표면 파티션](../models/01-windows.md#window-surface-partitions)은 이름 경계만 정하며 그 H2만으로 메시를 만들지 않는다.

## 투명 창유리 {#glass-clear}
<!--
@evidence principles/core/common.md#declared-basis 투명 창유리의 #E8EEF0·roughness 0.03은 settings/10-house.md#openings의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 투명 창유리는 models/02-exterior-doors.md#front-entry-door, models/02-exterior-doors.md#garage-sectional-door, models/02-exterior-doors.md#garden-door-pair의 면에 마감만 결합하고 그 면의 geometry·경계는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 투명 창유리는 #E8EEF0(선형 0.807, 0.855, 0.871), roughness 0.03, metallic 0.0, transmission 0.92, 결합 면, source owner `src/materials/exterior/glass.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#openings는 색·재료를 말로만 정했고 투명 창유리는 #E8EEF0 값과 roughness 0.03, `glass` 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 투명 창유리는 구성을 '두께 0.006 m 판유리 한 장으로 근사하며 복층 공기층은 표현하지 않는'로, 외관의 #E8EEF0·roughness 0.03·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 투명 창유리의 결합 vocabulary는 `glass`이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 투명 창유리의 반증 견본은 '켜진 실내등 아래 외관에서 창 안쪽이 비치고 하늘 반사가 함께 읽히는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #E8EEF0 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 투명 창유리는 settings/10-house.md#openings와 이번 모델 수리 뒤의 models/02-exterior-doors.md#front-entry-door를 소비한다. 현관 문턱·충전 소유 정정은 모델 분기의 수리이며 유리 재료가 부모에 요구한 수정은 없다.
@evidence contracts/texture-readability.md#material-texture-readability `glass`는 의도적으로 매끈한 무문양 표면이다. 색 맵 대신 transmission 0.92·ior 1.50·roughness 0.03과 실제 장면 반사·투과로 읽히게 하고, 창틀 안의 각 유리판 경계에서 결속을 끝낸다. 빛을 받는 프레임에서 불투명 단색판이면 실패다.
@evidence obligations/design/materials.md#material-response 투명 유리의 transmission 0.92, ior 1.50, 두께 0.006 m와 양면을 수치로 정했다.
@evidence settings/10-house.md#openings 투명 창유리가 '개구부의 읽힘'(settings/10-house.md#openings)를 링크로 소비해 #E8EEF0 값과 결합 면의 근거로 삼았다.
-->

[유리는 구멍도 불투명 검은 판도 아니다](../settings/10-house.md#openings). 구성은 두께 0.006 m 판유리 한 장으로 근사하며 복층 공기층은 표현하지 않는다. 외관은 `#E8EEF0`(선형 0.807, 0.855, 0.871), roughness 0.03, metallic 0.0, transmission 0.92, ior 1.50, 두께 0.006 m이며 양면이다. 결합 면은 창 모델의 `glass`, [현관문](../models/02-exterior-doors.md#front-entry-door)·[차고문](../models/02-exterior-doors.md#garage-sectional-door)·[정원 쪽 유리문](../models/02-exterior-doors.md#garden-door-pair)의 `glass`, [샤워부스](../models/14-bathrooms.md#sliding-shower-booth)의 `glass`, 세탁기 원형의 `glass`다. source owner는 `src/materials/exterior/glass.ts`이고, 리뷰는 켜진 실내등 아래 외관에서 창 안쪽이 비치고 하늘 반사가 함께 읽히는지를 관찰한다.

표면 결속 계획: `glass`는 의도적으로 매끈한 무문양 표면이다. 색 맵 대신 transmission 0.92·ior 1.50·roughness 0.03과 실제 장면 반사·투과로 읽히게 하고, 창틀 안의 각 유리판 경계에서 결속을 끝낸다. 빛을 받는 프레임에서 불투명 단색판이면 실패다. 실제 GPU 근접·리뷰 거리 판정은 아직 없으므로 unverified다.

## 불투명 욕실 유리 {#glass-obscure}
<!--
@evidence principles/core/common.md#declared-basis 불투명 욕실 유리의 #E8EEF0·roughness 0.55은 settings/20-verification.md#visual-grammar의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 불투명 욕실 유리는 spaces/envelope/right.md#tub-right-window, models/01-windows.md#awning-window의 면에 마감만 결합하고 그 면의 geometry·경계는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 불투명 욕실 유리는 #E8EEF0(선형 0.807, 0.855, 0.871), roughness 0.55, metallic 0.0, transmission 0.80, 결합 면, source owner `src/materials/exterior/glass.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/20-verification.md#visual-grammar는 색·재료를 말로만 정했고 불투명 욕실 유리는 #E8EEF0 값과 roughness 0.55, `obscured-glass` 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 불투명 욕실 유리는 구성을 '한 면을 산성 부식한 판유리'로, 외관의 #E8EEF0·roughness 0.55·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 불투명 욕실 유리의 결합 vocabulary는 `obscured-glass`이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 불투명 욕실 유리의 반증 견본은 '욕실 창이 밝게 빛나되 기구 형상이 보이지 않는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #E8EEF0 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 불투명 욕실 유리는 spaces/envelope/right.md#tub-right-window, models/01-windows.md#awning-window를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability `obscured-glass`는 0.002 m 모듈의 결정론적 산부식 미세 거칠기 맵을 쓴다. 유리판 왼쪽 아래를 원점으로 U 수평·V 수직이며 sash 경계에서 끝난다. 투과는 유지하되 욕실 형상이 흐려져야 한다.
@evidence spaces/envelope/right.md#tub-right-window 불투명 욕실 유리가 '욕조 욕실의 높은 흐린 창'(spaces/envelope/right.md#tub-right-window)를 링크로 소비해 #E8EEF0 값과 결합 면의 근거로 삼았다.
-->

욕실 외부 창의 프라이버시 유리다. 구성은 한 면을 산성 부식한 판유리다. 외관은 투명 유리와 같은 색·ior·두께에 roughness 0.55, metallic 0.0, transmission 0.80이어서 빛은 통과하되 실내 형상이 흐려진다. 결합 면은 [욕조 욕실 창](../spaces/envelope/right.md#tub-right-window)을 채우는 [상부 경첩창](../models/01-windows.md#awning-window)의 `obscured-glass`다. source owner는 `src/materials/exterior/glass.ts`이고, 리뷰는 욕실 창이 밝게 빛나되 기구 형상이 보이지 않는지를 관찰한다.

표면 결속 계획: `obscured-glass`는 0.002 m 모듈의 결정론적 산부식 미세 거칠기 맵을 쓴다. 유리판 왼쪽 아래를 원점으로 U 수평·V 수직이며 sash 경계에서 끝난다. 투과는 유지하되 욕실 형상이 흐려져야 한다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 꿀빛 목재 현관문 {#front-door-wood}
<!--
@evidence principles/core/common.md#declared-basis 꿀빛 목재 현관문의 #9A6A3E·roughness 0.50은 settings/10-house.md#porch-entry의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 꿀빛 목재 현관문은 models/02-exterior-doors.md#front-entry-door의 면에 마감만 결합하고 그 면의 geometry·경계는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 꿀빛 목재 현관문은 #9A6A3E(선형 0.323, 0.144, 0.048), roughness 0.50, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/exterior/doors.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#porch-entry는 색·재료를 말로만 정했고 꿀빛 목재 현관문은 #9A6A3E 값과 roughness 0.50, `leaf`·`casing`·`handle` 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 꿀빛 목재 현관문은 구성을 '오일 마감 참나무 판 문짝'로, 외관의 #9A6A3E·roughness 0.50·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 꿀빛 목재 현관문의 결합 vocabulary는 `leaf`·`casing`·`handle`이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 꿀빛 목재 현관문의 반증 견본은 '포치 그늘 안에서 문이 흰 벽과 구별되는 중간갈색으로 읽히는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #9A6A3E 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 꿀빛 목재 현관문은 settings/10-house.md#porch-entry와 이번 모델 수리 뒤의 models/02-exterior-doors.md#front-entry-door를 소비한다. 문턱·충전 소유 정정은 모델 분기의 수리이며 이 재료 H2가 부모에 요구한 수정은 없다.
@evidence contracts/texture-readability.md#material-texture-readability 현관 `leaf-exterior`·`leaf-interior`·`leaf-edge`·`leaf-panel`의 오크 결은 국소 문짝 세로축 V에 따라 늘어나는 0.15 m 폭 목재 결 맵으로 만든다. 문짝 왼쪽 아래를 원점으로 두고 패널·모서리 파티션마다 결 방향을 맞추되 문선에서는 끊는다.
@evidence settings/10-house.md#porch-entry 꿀빛 목재 현관문이 '현관 포치와 외부 진입'(settings/10-house.md#porch-entry)를 링크로 소비해 #9A6A3E 값과 결합 면의 근거로 삼았다.
-->

[현관의 목재문](../settings/10-house.md#porch-entry)이다. 구성은 오일 마감 참나무 판 문짝이다. 외관 기준색은 `#9A6A3E`(선형 0.323, 0.144, 0.048), roughness 0.50, metallic 0.0, transmission 0.0이다. 결합 면은 [목재 현관문](../models/02-exterior-doors.md#front-entry-door)의 `leaf-exterior`·`leaf-interior`·`leaf-edge`·`leaf-panel`이며 `casing`은 [흰 실내 trim](02-interior-shell.md#interior-trim-white), `handle`은 [검은 도장 금속](02-interior-shell.md#black-coated-metal)이다. source owner는 `src/materials/exterior/doors.ts`이고, 리뷰는 포치 그늘 안에서 문이 흰 벽과 구별되는 중간갈색으로 읽히는지를 관찰한다.

표면 결속 계획: 현관 `leaf-exterior`·`leaf-interior`·`leaf-edge`·`leaf-panel`의 오크 결은 국소 문짝 세로축 V에 따라 늘어나는 0.15 m 폭 목재 결 맵으로 만든다. 문짝 왼쪽 아래를 원점으로 두고 패널·모서리 파티션마다 결 방향을 맞추되 문선에서는 끊는다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## charcoal 차고문 패널 {#garage-door-charcoal}
<!--
@evidence principles/core/common.md#declared-basis charcoal 차고문 패널의 #34373A·roughness 0.45은 settings/10-house.md#garage의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation charcoal 차고문 패널은 models/02-exterior-doors.md#garage-sectional-door의 면에 마감만 결합하고 그 면의 geometry·경계는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion charcoal 차고문 패널은 #34373A(선형 0.034, 0.038, 0.042), roughness 0.45, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/exterior/doors.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#garage는 색·재료를 말로만 정했고 charcoal 차고문 패널은 #34373A 값과 roughness 0.45, `leaf-panel` 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance charcoal 차고문 패널은 구성을 '도장 강판 분절 패널'로, 외관의 #34373A·roughness 0.45·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface charcoal 차고문 패널의 결합 vocabulary는 `leaf-panel`이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address charcoal 차고문 패널의 반증 견본은 '01 외관에서 패널 분절 그림자와 상부 유리가 읽히는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #34373A 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work charcoal 차고문 패널은 settings/10-house.md#garage, models/02-exterior-doors.md#garage-sectional-door를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 분절 차고문 `leaf-exterior`·`leaf-interior`·`leaf-panel`·`panel-edge`의 도장 강판 미세결은 패널마다 U 수평·V 수직의 0.25 m 모듈이다. 각 패널 왼쪽 아래에서 시작해 분절 홈에서 이음을 끊고 상부 유리에는 칠하지 않는다.
@evidence settings/10-house.md#garage charcoal 차고문 패널이 '빈 2대 차고'(settings/10-house.md#garage)를 링크로 소비해 #34373A 값과 결합 면의 근거로 삼았다.
-->

[두 대용 폭의 어두운 분절 패널문](../settings/10-house.md#garage)이다. 구성은 도장 강판 분절 패널이므로 metallic 0.0이다. 외관은 `#34373A`(선형 0.034, 0.038, 0.042), roughness 0.45, transmission 0.0이며 창틀보다 한 단계 밝게 해 넓은 면이 검은 판으로 뭉개지지 않게 한다. 결합 면은 [분절 차고문](../models/02-exterior-doors.md#garage-sectional-door)의 `leaf-exterior`·`leaf-interior`·`leaf-panel`·`panel-edge` 전체이며 `rail`은 [스테인리스](03-furnishings.md#stainless-steel)다. source owner는 `src/materials/exterior/doors.ts`이고, 리뷰는 01 외관에서 패널 분절 그림자와 상부 유리가 읽히는지를 관찰한다.

표면 결속 계획: 분절 차고문 `leaf-exterior`·`leaf-interior`·`leaf-panel`·`panel-edge`의 도장 강판 미세결은 패널마다 U 수평·V 수직의 0.25 m 모듈이다. 각 패널 왼쪽 아래에서 시작해 분절 홈에서 이음을 끊고 상부 유리에는 칠하지 않는다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 포치 바닥 {#porch-floor}
<!--
@evidence principles/core/common.md#declared-basis 포치 바닥의 #A8A49C·roughness 0.80은 settings/20-verification.md#visual-grammar의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 포치 바닥은 spaces 03 표의 `src/spaces/porch.ts` 포치 바닥 상면·챌면·노출 옆면에 마감만 결합하고 그 면의 geometry·경계와 개수는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 포치 바닥은 #A8A49C(선형 0.392, 0.371, 0.332), roughness 0.80, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/exterior/paving.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/20-verification.md#visual-grammar는 색·재료를 말로만 정했고 포치 바닥은 #A8A49C 값과 roughness 0.80, 결합 면 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 포치 바닥은 구성을 '도장 콘크리트 상부판'로, 외관의 #A8A49C·roughness 0.80·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 포치 바닥의 결합 vocabulary는 spaces 03 표의 `src/spaces/porch.ts` 포치 바닥 상면·챌면·노출 옆면이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 포치 바닥의 반증 견본은 '포치 단과 앞 보행길의 경계가 색과 그림자로 구별되는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #A8A49C 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 포치 바닥은 spaces/porch.md#porch-platform-access를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 포치 상면의 콘크리트 잔골재와 색 편차는 0.40 m 모듈이다. 세계 X/Z를 U/V로, 포치 바깥 왼쪽 모서리를 원점으로 투영하고 단 코와 기둥 기초에서 부재별로 자른다.
@evidence spaces/porch.md#porch-platform-access 포치 바닥이 '현관문에 맞춘 포치와 세 챌판'(spaces/porch.md#porch-platform-access)를 링크로 소비해 #A8A49C 값과 결합 면의 근거로 삼았다.
-->

[현관 포치](../spaces/porch.md#porch-platform-access)의 높은 바닥과 단이다. 구성은 도장 콘크리트 상부판이다. 외관은 `#A8A49C`(선형 0.392, 0.371, 0.332), roughness 0.80, metallic 0.0, transmission 0.0으로 [포장 콘크리트](#paving-concrete)보다 조금 어둡게 해 높이 차이가 읽히게 한다. 결합 면은 포치 상면·챌면·노출 옆면이다. source owner는 `src/materials/exterior/paving.ts`이고, 리뷰는 포치 단과 앞 보행길의 경계가 색과 그림자로 구별되는지를 관찰한다.

표면 결속 계획: 포치 상면의 콘크리트 잔골재와 색 편차는 0.40 m 모듈이다. 세계 X/Z를 U/V로, 포치 바깥 왼쪽 모서리를 원점으로 투영하고 단 코와 기둥 기초에서 부재별로 자른다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 포장 콘크리트 {#paving-concrete}
<!--
@evidence principles/core/common.md#declared-basis 포장 콘크리트의 #B4B0A8·roughness 0.88은 settings/10-house.md#site-identity의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 포장 콘크리트는 spaces 03 표의 `src/spaces/site/front-walk.ts`·`driveway.ts`·`side-walk.ts`·`terrace.ts` 상면과 노출 옆면에 마감만 결합하고 그 면의 geometry·경계와 개수는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 포장 콘크리트는 #B4B0A8(선형 0.456, 0.434, 0.392), roughness 0.88, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/exterior/paving.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#site-identity는 색·재료를 말로만 정했고 포장 콘크리트는 #B4B0A8 값과 roughness 0.88, 결합 면 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 포장 콘크리트는 구성을 '빗자루 마감 현장 타설 콘크리트'로, 외관의 #B4B0A8·roughness 0.88·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 포장 콘크리트의 결합 vocabulary는 spaces 03 표의 `src/spaces/site/front-walk.ts`·`driveway.ts`·`side-walk.ts`·`terrace.ts` 상면과 노출 옆면이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 포장 콘크리트의 반증 견본은 '오후 key 아래 포장이 흰 벽보다 어둡고 잔디와 구별되는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #B4B0A8 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 포장 콘크리트는 settings/10-house.md#site-identity, spaces/site/01-paving-support.md#paving-depth-reservation를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 차도·보도·테라스의 콘크리트 잔골재는 0.50 m 세계 X/Z 모듈로 같은 위상을 쓴다. 대지 원점을 공유하고 실제 포장 판 이음·문턱·연석에서 결이 잘리며 틈에 색을 칠해 접지를 속이지 않는다.
@evidence settings/10-house.md#site-identity 포장 콘크리트가 '대지와 식재'(settings/10-house.md#site-identity)를 링크로 소비해 #B4B0A8 값과 결합 면의 근거로 삼았다.
@evidence spaces/site/01-paving-support.md#paving-depth-reservation 포장 콘크리트가 '낮은 포장의 두께와 경사 바탕'(spaces/site/01-paving-support.md#paving-depth-reservation)를 링크로 소비해 #B4B0A8 값과 결합 면의 근거로 삼았다.
@evidence spaces/site/driveway.md#driveway-plan driveway가 같은 면의 후속 저작으로 넘긴 재료를 포장 콘크리트 #B4B0A8, roughness 0.88로 받고 줄눈은 이 H2가 만들지 않는다고 적었다.
@evidence spaces/site/front-walk.md#front-walk-plan front-walk가 넘긴 콘크리트 마감을 같은 #B4B0A8 값으로 T자 보행면 상면과 노출 옆면에 결합한다.
-->

[차고 진입 콘크리트 차도와 현관 보행길](../settings/10-house.md#site-identity)이다. 구성은 빗자루 마감 현장 타설 콘크리트이며 두께는 [포장 바탕](../spaces/site/01-paving-support.md#paving-depth-reservation)이 예약한다. 외관은 빗자루 결을 평균한 `#B4B0A8`(선형 0.456, 0.434, 0.392), roughness 0.88, metallic 0.0, transmission 0.0이다. 결합 면은 front-walk·driveway·side-walk·terrace owner의 상면과 노출 옆면이며 줄눈은 이 H2가 만들지 않는다. source owner는 `src/materials/exterior/paving.ts`이고, 리뷰는 오후 key 아래 포장이 흰 벽보다 어둡고 잔디와 구별되는지를 관찰한다.

표면 결속 계획: 차도·보도·테라스의 콘크리트 잔골재는 0.50 m 세계 X/Z 모듈로 같은 위상을 쓴다. 대지 원점을 공유하고 실제 포장 판 이음·문턱·연석에서 결이 잘리며 틈에 색을 칠해 접지를 속이지 않는다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 중간갈색 울타리 목재 {#fence-wood}
<!--
@evidence principles/core/common.md#declared-basis 중간갈색 울타리 목재의 #8C6A48·roughness 0.75은 settings/10-house.md#site-identity의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 중간갈색 울타리 목재는 spaces 03 표의 `src/spaces/site/fence.ts` 울타리 노출 면과 models 02 옆마당 대문에 마감만 결합하고 그 면의 geometry·경계와 개수는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 중간갈색 울타리 목재는 #8C6A48(선형 0.262, 0.144, 0.065), roughness 0.75, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/exterior/fence.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#site-identity는 색·재료를 말로만 정했고 중간갈색 울타리 목재는 #8C6A48 값과 roughness 0.75, 고정 울타리 면 및 대문 `leaf-panel`·`gate-batten` 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 중간갈색 울타리 목재는 구성을 '착색한 방부 목재 판'로, 외관의 #8C6A48·roughness 0.75·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 중간갈색 울타리 목재의 결합 vocabulary는 spaces 고정 울타리의 노출 목재 면과 models 대문의 `leaf-panel`·`gate-batten`이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 중간갈색 울타리 목재의 반증 견본은 '01 외관에서 울타리가 현관문보다 회색빛이 도는 중간갈색으로 읽히는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #8C6A48 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 중간갈색 울타리 목재는 settings/10-house.md#site-identity, spaces/site/fence.md#fence-enclosure-plan를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 울타리 보드의 세로 목리는 보드 폭 0.14 m, 세로 반복 0.80 m를 따른다. 각 보드의 바닥 안쪽 모서리를 원점으로 U 폭·V 높이로 투영하고 보드 사이와 문짝 경첩선에서 끊는다.
@evidence settings/10-house.md#site-identity 중간갈색 울타리 목재가 '대지와 식재'(settings/10-house.md#site-identity)를 링크로 소비해 #8C6A48 값과 결합 면의 근거로 삼았다.
@evidence spaces/site/fence.md#fence-enclosure-plan 중간갈색 울타리 목재가 '건물 두 끝에 닿는 울타리 선'(spaces/site/fence.md#fence-enclosure-plan)를 링크로 소비해 #8C6A48 값과 결합 면의 근거로 삼았다.
-->

[우측 목재 울타리](../settings/10-house.md#site-identity)다. 구성은 착색한 방부 목재 판이다. 외관은 `#8C6A48`(선형 0.262, 0.144, 0.065), roughness 0.75, metallic 0.0, transmission 0.0이다. 결합 면은 [울타리 고정 패널·문 개구부·기둥](../spaces/site/fence.md#fence-enclosure-plan)의 노출 목재 면과 [옆마당 목재 대문](../models/02-exterior-doors.md#side-yard-gate)의 `leaf-panel`·`gate-batten`이다. 대문 철물은 검은 금속을 받으며 울타리 spaces source의 면으로 세지 않는다. source owner는 `src/materials/exterior/fence.ts`이고, 리뷰는 01 외관에서 울타리가 현관문보다 회색빛이 도는 중간갈색으로 읽히는지를 관찰한다.

표면 결속 계획: 울타리 보드의 세로 목리는 보드 폭 0.14 m, 세로 반복 0.80 m를 따른다. 각 보드의 바닥 안쪽 모서리를 원점으로 U 폭·V 높이로 투영하고 보드 사이와 문짝 경첩선에서 끊는다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

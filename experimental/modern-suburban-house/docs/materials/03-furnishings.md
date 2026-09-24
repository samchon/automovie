# 가구·설비·직물 재료

## 회갈색 패널 수납장 {#greige-cabinet}
<!--
@evidence principles/core/common.md#declared-basis 회갈색 패널 수납장의 #8A7F72·roughness 0.50은 settings/10-house.md#kitchen-equipment의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 회갈색 패널 수납장은 models/10-kitchen-dining.md#kitchen-base-run, models/10-kitchen-dining.md#kitchen-island, models/10-kitchen-dining.md#kitchen-wall-cabinet의 면에 마감만 결합하고 그 면의 geometry·경계는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 회갈색 패널 수납장은 #8A7F72(선형 0.254, 0.212, 0.168), roughness 0.50, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/furnishings/cabinetry.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#kitchen-equipment는 색·재료를 말로만 정했고 회갈색 패널 수납장은 #8A7F72 값과 roughness 0.50, `plinth`·`carcass`·`leaf` 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 회갈색 패널 수납장은 구성을 '두께 0.018 m MDF 패널 위 반무광 도장'로, 외관의 #8A7F72·roughness 0.50·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 회갈색 패널 수납장의 결합 vocabulary는 `plinth`·`carcass`·`leaf`이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 회갈색 패널 수납장의 반증 견본은 '[재료 리뷰 견본](00-material-frame.md#material-review-set)의 거리 견본 중 03 공용부 view와 욕실…'이고 00 재료 리뷰 견본의 중성 조명 판이 #8A7F72 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 회갈색 패널 수납장은 settings/10-house.md#kitchen-equipment, settings/10-house.md#tub-bathroom를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 수납장 `leaf`·`carcass`의 반무광 도막 결은 0.10 m 모듈이다. 원형의 각 판 왼쪽 아래를 원점으로 U 폭·V 높이를 쓰고 서랍·문짝 경계에서 끊어 패널 간 그림자를 지우지 않는다.
@evidence settings/10-house.md#kitchen-equipment 회갈색 패널 수납장이 '주방 설비'(settings/10-house.md#kitchen-equipment)를 링크로 소비해 #8A7F72 값과 결합 면의 근거로 삼았다.
@evidence settings/10-house.md#tub-bathroom 회갈색 패널 수납장이 '욕조 욕실'(settings/10-house.md#tub-bathroom)를 링크로 소비해 #8A7F72 값과 결합 면의 근거로 삼았다.
-->

[주방의 회갈색 패널 수납장](../settings/10-house.md#kitchen-equipment)과 [욕실의 회갈색 세면장](../settings/10-house.md#tub-bathroom)이다. 구성은 두께 0.018 m MDF 패널 위 반무광 도장이다. 외관은 `#8A7F72`(선형 0.254, 0.212, 0.168), roughness 0.50, metallic 0.0, transmission 0.0이며 도막 한 층의 색과 광택만 근사하고 패널 분절과 문 틈은 모델 geometry가 만든다. 흰 벽 타일과 밝은 상판 사이에서 중간 명도의 띠로 읽히도록 정했다. 결합 면은 [주방 하부장 띠](../models/10-kitchen-dining.md#kitchen-base-run)와 [싱크 섬](../models/10-kitchen-dining.md#kitchen-island)의 `plinth`·`carcass`·`leaf`·`drawer-front`, [주방 상부장](../models/10-kitchen-dining.md#kitchen-wall-cabinet)의 `carcass`·`leaf`, [세면장](../models/14-bathrooms.md#vanity-basin)의 `plinth`·`carcass`·`leaf`, [세탁실 상부 수납](../models/12-service-rooms.md#laundry-upper-storage)의 `carcass`·`leaf`다. source owner는 `src/materials/furnishings/cabinetry.ts`이고, 리뷰는 [재료 리뷰 견본](00-material-frame.md#material-review-set)의 거리 견본 중 03 공용부 view와 욕실 threshold view에서 서랍·문 분절이 같은 재료의 그림자로 구별되는지를 관찰한다.

표면 결속 계획: 수납장 `leaf`·`carcass`의 반무광 도막 결은 0.10 m 모듈이다. 원형의 각 판 왼쪽 아래를 원점으로 U 폭·V 높이를 쓰고 서랍·문짝 경계에서 끊어 패널 간 그림자를 지우지 않는다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 밝은 석재 상판 {#light-countertop}
<!--
@evidence principles/core/common.md#declared-basis 밝은 석재 상판의 #E4E0D8·roughness 0.30은 settings/10-house.md#kitchen-equipment의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 밝은 석재 상판은 models/12-service-rooms.md#laundry-folding-top의 면에 마감만 결합하고 그 면의 geometry·경계는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 밝은 석재 상판은 #E4E0D8(선형 0.776, 0.745, 0.687), roughness 0.30, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/furnishings/cabinetry.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#kitchen-equipment는 색·재료를 말로만 정했고 밝은 석재 상판은 #E4E0D8 값과 roughness 0.30, `countertop`·`top`·`cleat` 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 밝은 석재 상판은 구성을 '두께 0.03 m 엔지니어드 석재 판'로, 외관의 #E4E0D8·roughness 0.30·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 밝은 석재 상판의 결합 vocabulary는 `countertop`·`top`·`cleat`이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 밝은 석재 상판의 반증 견본은 '03 view에서 상판 앞 모서리가 수납장 위 밝은 선으로 읽히는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #E4E0D8 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 밝은 석재 상판은 settings/10-house.md#kitchen-equipment, models/12-service-rooms.md#laundry-folding-top를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 상판 `countertop`·`top`은 0.30 m 모듈의 연한 석재 입자와 드문 가는 맥을 결정론적으로 만든다. 상판 국소 X/Z를 U/V로 한 모서리를 원점으로 하고 싱크 구멍·앞 모서리에서 결을 절단한다.
@evidence settings/10-house.md#kitchen-equipment 밝은 석재 상판이 '주방 설비'(settings/10-house.md#kitchen-equipment)를 링크로 소비해 #E4E0D8 값과 결합 면의 근거로 삼았다.
-->

[밝은 상판](../settings/10-house.md#kitchen-equipment)이다. 구성은 두께 0.03 m 엔지니어드 석재 판이다. 외관은 `#E4E0D8`(선형 0.776, 0.745, 0.687), roughness 0.30, metallic 0.0, transmission 0.0이며 연마면의 색과 반광을 기준으로 하고 석재 입자와 드문 맥을 결속한다. 결합 면은 주방 하부장 띠·싱크 섬·세면장의 `countertop`과 [세탁기 위 접는 상판](../models/12-service-rooms.md#laundry-folding-top)의 `top`이다. 받침 `cleat`는 [회갈색 패널 수납장](#greige-cabinet)을 받는다. source owner는 `src/materials/furnishings/cabinetry.ts`이고, 리뷰는 03 view에서 상판 앞 모서리가 수납장 위 밝은 선으로 읽히는지를 관찰한다.

표면 결속 계획: 상판 `countertop`·`top`은 0.30 m 모듈의 연한 석재 입자와 드문 가는 맥을 결정론적으로 만든다. 상판 국소 X/Z를 U/V로 한 모서리를 원점으로 하고 싱크 구멍·앞 모서리에서 결을 절단한다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 스테인리스 가전과 수전 {#stainless-steel}
<!--
@evidence principles/core/common.md#declared-basis 스테인리스 가전과 수전의 #C0C2C4·roughness 0.30은 settings/10-house.md#kitchen-equipment의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 스테인리스 가전과 수전은 models/10-kitchen-dining.md#kitchen-refrigerator, models/10-kitchen-dining.md#kitchen-range, models/10-kitchen-dining.md#kitchen-microwave의 면에 마감만 결합하고 그 면의 geometry·경계는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 스테인리스 가전과 수전은 #C0C2C4(선형 0.527, 0.539, 0.552), roughness 0.30, metallic 1.0, transmission 0.0, 결합 면, source owner `src/materials/furnishings/appliances.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#kitchen-equipment는 색·재료를 말로만 정했고 스테인리스 가전과 수전은 #C0C2C4 값과 roughness 0.30, `leaf`·`drawer-front`·`appliance-body` 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 스테인리스 가전과 수전은 구성을 '도장하지 않은 헤어라인 스테인리스 강판과 주물 수전'로, 외관의 #C0C2C4·roughness 0.30·metallic 1.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 스테인리스 가전과 수전의 결합 vocabulary는 `leaf`·`drawer-front`·`appliance-body`이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 스테인리스 가전과 수전의 반증 견본은 '중성 조명 판과 03 view에서 가전이 흰 벽보다 어둡지만 검은 판이 아닌 금속 반사로 읽히는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #C0C2C4 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 스테인리스 가전과 수전은 settings/10-house.md#kitchen-equipment, models/10-kitchen-dining.md#kitchen-refrigerator를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 가전·수전의 노출 스테인리스에는 0.02 m 반복의 방향성 헤어라인 거칠기 맵을 쓴다. 판의 길이 U를 연마 방향으로, 판 시작 모서리를 원점으로 하고 문·손잡이 파티션 경계에서 방향을 새로 잡는다.
@evidence settings/10-house.md#kitchen-equipment 스테인리스 가전과 수전이 '주방 설비'(settings/10-house.md#kitchen-equipment)를 링크로 소비해 #C0C2C4 값과 결합 면의 근거로 삼았다.
-->

[스테인리스 냉장고·레인지·전자레인지](../settings/10-house.md#kitchen-equipment)와 식기세척기, 수전이다. 구성은 도장하지 않은 헤어라인 스테인리스 강판과 주물 수전이다. 외관은 `#C0C2C4`(선형 0.527, 0.539, 0.552), roughness 0.30, metallic 1.0, transmission 0.0이며 헤어라인 방향성은 판의 길이 방향 거칠기 맵으로 표현한다. 결합 면은 [양문 냉장고](../models/10-kitchen-dining.md#kitchen-refrigerator)의 `leaf`·`drawer-front`·`appliance-body`·`handle`, [레인지](../models/10-kitchen-dining.md#kitchen-range)의 `leaf`·`appliance-body`·`handle`, [전자레인지](../models/10-kitchen-dining.md#kitchen-microwave)의 `appliance-body`·`leaf`, [식기세척기](../models/10-kitchen-dining.md#kitchen-dishwasher)의 `leaf`·`appliance-body`, 싱크 섬의 `basin`·`faucet`, 세면장·욕조·샤워부스의 `faucet`, [차고 금속 선반](../models/12-service-rooms.md#garage-shelving)의 `post`·`shelf`, [공구판](../models/12-service-rooms.md#garage-tool-board)의 `tool-steel`, [세탁기 원형](../models/12-service-rooms.md#laundry-machine)의 `door-ring`·`drum`이다. 가전 안쪽 `appliance-interior`는 [흰 에나멜](#white-enamel)을 받는다. source owner는 `src/materials/furnishings/appliances.ts`이고, 리뷰는 중성 조명 판과 03 view에서 가전이 흰 벽보다 어둡지만 검은 판이 아닌 금속 반사로 읽히는지를 관찰한다.

욕실·수납의 금속 `rail`·`rod`와 주방 `utensil`의 금속부도 이 재료를 받는다. 각 막대의 길이 U·둘레 V를 미터로 투영하고 부품 끝에서 끊는다.

표면 결속 계획: 가전·수전의 노출 스테인리스에는 0.02 m 반복의 방향성 헤어라인 거칠기 맵을 쓴다. 판의 길이 U를 연마 방향으로, 판 시작 모서리를 원점으로 하고 문·손잡이 파티션 경계에서 방향을 새로 잡는다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 검은 유리 조작부 {#black-glass-panel}
<!--
@evidence principles/core/common.md#declared-basis 검은 유리 조작부의 #1F1F20·roughness 0.08은 settings/20-verification.md#visual-grammar의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 검은 유리 조작부는 models/12-service-rooms.md#laundry-machine의 면에 마감만 결합하고 그 면의 geometry·경계는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 검은 유리 조작부는 #1F1F20(선형 0.014, 0.014, 0.014), roughness 0.08, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/furnishings/appliances.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/20-verification.md#visual-grammar는 색·재료를 말로만 정했고 검은 유리 조작부는 #1F1F20 값과 roughness 0.08, `cooktop`·`burner`·`control-panel`·`appliance-glass` 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 검은 유리 조작부는 구성을 '검은 유리 세라믹 판'로, 외관의 #1F1F20·roughness 0.08·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 검은 유리 조작부의 결합 vocabulary는 `cooktop`·`burner`·`control-panel`·`appliance-glass`이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 검은 유리 조작부의 반증 견본은 '근접 거리 견본에서 조작부가 스테인리스와 광택으로 구별되는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #1F1F20 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 검은 유리 조작부는 models/12-service-rooms.md#laundry-machine를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability `glass`는 의도적으로 매끈하며 roughness 0.08의 좁은 반사와 실제 프레임의 광원·주변 사물 반사로 유리로 읽힌다. 패널 파티션 밖에 맵을 번지게 하지 않고 단색 검은 직사각형이면 실패다.
-->

오븐 창·쿡탑·조작부다. 구성은 검은 유리 세라믹 판이다. 외관은 `#1F1F20`(선형 0.014, 0.014, 0.014), roughness 0.08, metallic 0.0, transmission 0.0이며 판 뒤 내부는 보이지 않는 불투명 반사면으로 근사한다. 결합 면은 레인지의 `cooktop`·`burner`·`control-panel`·`appliance-glass`, 전자레인지의 `appliance-glass`·`control-panel`, 식기세척기의 `control-panel`, [드럼 세탁기와 건조기](../models/12-service-rooms.md#laundry-machine)의 `control-panel`다. source owner는 `src/materials/furnishings/appliances.ts`이고, 리뷰는 근접 거리 견본에서 조작부가 스테인리스와 광택으로 구별되는지를 관찰한다.

표면 결속 계획: 검은 조작부 `glass`는 의도적으로 매끈하며 roughness 0.08의 좁은 반사와 실제 프레임의 광원·주변 사물 반사로 유리로 읽힌다. 패널 파티션 밖에 맵을 번지게 하지 않고 단색 검은 직사각형이면 실패다. 실제 GPU 근접·리뷰 거리 판정은 아직 없으므로 unverified다.

## 흰 에나멜과 도기 {#white-enamel}
<!--
@evidence principles/core/common.md#declared-basis 흰 에나멜과 도기의 #F5F5F2·roughness 0.25은 settings/10-house.md#laundry-mudroom의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 흰 에나멜과 도기는 models/14-bathrooms.md#shared-toilet, models/14-bathrooms.md#bathtub, models/14-bathrooms.md#sliding-shower-booth의 면에 마감만 결합하고 그 면의 geometry·경계는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 흰 에나멜과 도기는 #F5F5F2(선형 0.913, 0.913, 0.888), roughness 0.25, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/furnishings/fixtures.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#laundry-mudroom는 색·재료를 말로만 정했고 흰 에나멜과 도기는 #F5F5F2 값과 roughness 0.25, `ceramic`·`toilet-seat`·`lid` 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 흰 에나멜과 도기는 구성을 '유약 도기와 법랑 강판'로, 외관의 #F5F5F2·roughness 0.25·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 흰 에나멜과 도기의 결합 vocabulary는 `ceramic`·`toilet-seat`·`lid`이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 흰 에나멜과 도기의 반증 견본은 '05 욕실 view에서 도기가 벽 타일보다 좁은 하이라이트로 구별되는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #F5F5F2 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 흰 에나멜과 도기는 settings/10-house.md#laundry-mudroom, models/14-bathrooms.md#shared-toilet를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 흰 도기·에나멜은 의도적으로 매끈한 유약 면이다. roughness 0.25의 넓은 하이라이트와 실제 곡면 법선·그림자로 부피를 읽히게 하며 금속·벽 타일 파티션과의 접합에서 끝난다.
@evidence settings/10-house.md#laundry-mudroom 흰 에나멜과 도기가 '세탁 겸 머드룸'(settings/10-house.md#laundry-mudroom)를 링크로 소비해 #F5F5F2 값과 결합 면의 근거로 삼았다.
-->

변기·세면기·욕조와 [앞문식 세탁기·건조기](../settings/10-house.md#laundry-mudroom)의 흰 몸체다. 구성은 유약 도기와 법랑 강판이며 두 구성을 한 외관으로 묶는다. 외관은 `#F5F5F2`(선형 0.913, 0.913, 0.888), roughness 0.25, metallic 0.0, transmission 0.0이다. 결합 면은 [공용 변기](../models/14-bathrooms.md#shared-toilet)의 `ceramic`·`toilet-seat`·`lid`, 세면장과 [욕조 겸 샤워](../models/14-bathrooms.md#bathtub)의 `ceramic`, [샤워부스](../models/14-bathrooms.md#sliding-shower-booth)의 `shower-tray`, 세탁기·건조기의 `appliance-body`·`leaf`, 가전의 `appliance-interior`다. 세탁기 `door-ring`은 [스테인리스](#stainless-steel), `glass`는 [투명 유리](01-exterior.md#glass-clear), `drum`은 스테인리스를 받는다. source owner는 `src/materials/furnishings/fixtures.ts`이고, 리뷰는 05 욕실 view에서 도기가 벽 타일보다 좁은 하이라이트로 구별되는지를 관찰한다.

샤워 세면대의 세 `accessory`, 도기 화분과 병의 `container`, 과일 `bowl`, 협탁등의 `lamp-base`에도 같은 흰 법랑 값을 배정한다. 용기 둘레 U·높이 V의 미터 UV를 각각의 열린 입술에서 끊는다.

표면 결속 계획: 흰 도기·에나멜은 의도적으로 매끈한 유약 면이다. roughness 0.25의 넓은 하이라이트와 실제 곡면 법선·그림자로 부피를 읽히게 하며 금속·벽 타일 파티션과의 접합에서 끝난다. 실제 GPU 근접·리뷰 거리 판정은 아직 없으므로 unverified다.

## 꿀빛 가구 목재 {#furniture-wood}
<!--
@evidence principles/core/common.md#declared-basis 꿀빛 가구 목재의 #A87A4E·roughness 0.50은 settings/10-house.md#living의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 꿀빛 가구 목재는 models/10-kitchen-dining.md#dining-table, models/10-kitchen-dining.md#dining-chair, models/10-kitchen-dining.md#kitchen-island-stool의 면에 마감만 결합하고 그 면의 geometry·경계는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 꿀빛 가구 목재는 #A87A4E(선형 0.392, 0.195, 0.076), roughness 0.50, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/furnishings/wood.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#living는 색·재료를 말로만 정했고 꿀빛 가구 목재는 #A87A4E 값과 roughness 0.50, `top`·`apron`·`leg`·`seat` 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 꿀빛 가구 목재는 구성을 '오일 마감 참나무 집성재'로, 외관의 #A87A4E·roughness 0.50·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 꿀빛 가구 목재의 결합 vocabulary는 `top`·`apron`·`leg`·`seat`이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 꿀빛 가구 목재의 반증 견본은 '03과 05 view에서 가구와 마루가 같은 계열이되 구별되는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #A87A4E 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 꿀빛 가구 목재는 settings/10-house.md#living, settings/10-house.md#primary-bedroom를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 식탁·침대·의자·선반 목재의 오크 결은 판 길이 U와 폭 0.15 m 모듈을 쓴다. 각 모델 부재 시작 모서리를 원점으로 하고 다리·상판·서랍 전면의 접합에서 결 방향을 새로 잡는다.
@evidence settings/10-house.md#living 꿀빛 가구 목재가 '전면 거실'(settings/10-house.md#living)를 링크로 소비해 #A87A4E 값과 결합 면의 근거로 삼았다.
@evidence settings/10-house.md#primary-bedroom 꿀빛 가구 목재가 '주침실'(settings/10-house.md#primary-bedroom)를 링크로 소비해 #A87A4E 값과 결합 면의 근거로 삼았다.
-->

[낮은 목재 테이블](../settings/10-house.md#living), [목재 침대](../settings/10-house.md#primary-bedroom), 식탁·의자·책상, 팬트리 선반이다. 구성은 오일 마감 참나무 집성재다. 외관은 `#A87A4E`(선형 0.392, 0.195, 0.076), roughness 0.50, metallic 0.0, transmission 0.0이며 오크 결 맵을 부재 길이에 결속하고 모서리 음영으로 목재 덩어리의 두께도 읽힌다. [참나무색 마루](02-interior-shell.md#oak-floor)보다 약간 어두워 다리가 바닥에 묻히지 않도록 정했다. 결합 면은 [여섯 좌석 식탁](../models/10-kitchen-dining.md#dining-table)의 `top`·`apron`·`leg`, [식탁 의자](../models/10-kitchen-dining.md#dining-chair)·[섬 스툴](../models/10-kitchen-dining.md#kitchen-island-stool)·[책상 의자](../models/13-bedrooms.md#desk-chair)의 `seat`·`leg`·`back`·`footrest`, [낮은 목재 테이블](../models/11-living.md#low-table)과 [작은 책상](../models/13-bedrooms.md#child-desk)의 `top`·`leg`·`shelf`, [머리판 있는 침대](../models/13-bedrooms.md#headboard-bed)의 `headboard`·`bed-frame`, [협탁](../models/13-bedrooms.md#nightstand-lamp)·[낮은 서랍장](../models/13-bedrooms.md#low-dresser)의 `carcass`·`drawer-front`·`leg`, 소파·[안락의자](../models/11-living.md#reading-armchair)의 `leg`, [팬트리 L형 선반](../models/12-service-rooms.md#pantry-l-shelf)과 [머드룸 신발 벤치](../models/12-service-rooms.md#mudroom-bench)의 `seat`·`carcass`·`shelf`, 팬트리 선반의 `shelf`·`cleat`, [공구 작업대](../models/12-service-rooms.md#garage-workbench)의 `top`·`leg`·`drawer-front`, [테라스 식탁](../models/15-outdoor.md#terrace-table)·[테라스 의자](../models/15-outdoor.md#terrace-chair)다. source owner는 `src/materials/furnishings/wood.ts`이고, 리뷰는 03과 05 view에서 가구와 마루가 같은 계열이되 구별되는지를 관찰한다.

탁자·벤치의 `base`·`plinth`, 공구판의 `board`·`tool-grip`, 거실 `tray`, 주방 `cutting-board`, 벽난로 `mantel`, 선반 `basket`, 책상 `pencil`의 목재 부피도 이 재료를 받는다. 부재마다 길이 U·폭 V를 새로 시작한다.

표면 결속 계획: 식탁·침대·의자·선반 목재의 오크 결은 판 길이 U와 폭 0.15 m 모듈을 쓴다. 각 모델 부재 시작 모서리를 원점으로 하고 다리·상판·서랍 전면의 접합에서 결 방향을 새로 잡는다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 짙은 책장 목재 {#dark-bookcase-wood}
<!--
@evidence principles/core/common.md#declared-basis 짙은 책장 목재의 #4A3A2E·roughness 0.55은 settings/10-house.md#living의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 짙은 책장 목재는 models/11-living.md#dark-bookcase의 면에 마감만 결합하고 그 면의 geometry·경계는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 짙은 책장 목재는 #4A3A2E(선형 0.068, 0.042, 0.027), roughness 0.55, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/furnishings/wood.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#living는 색·재료를 말로만 정했고 짙은 책장 목재는 #4A3A2E 값과 roughness 0.55, `carcass`·`plinth`·`shelf`·`book` 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 짙은 책장 목재는 구성을 '어두운 착색 호두나무 판재'로, 외관의 #4A3A2E·roughness 0.55·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 짙은 책장 목재의 결합 vocabulary는 `carcass`·`plinth`·`shelf`·`book`이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 짙은 책장 목재의 반증 견본은 '04 view에서 책장이 흰 벽 앞 짙은 덩어리로 읽히되 선반 그림자와 책 색 변화가 보이는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #4A3A2E 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 짙은 책장 목재는 settings/10-house.md#living, models/11-living.md#dark-bookcase를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 짙은 책장 목재는 판 길이 U의 0.15 m 어두운 오크 결 맵을 쓴다. 각 선반·측판의 안쪽 시작 모서리를 원점으로 하고 판 끝에서 끊어 뒤판과 선반이 한 검은 면으로 합쳐지지 않게 한다.
@evidence settings/10-house.md#living 짙은 책장 목재가 '전면 거실'(settings/10-house.md#living)를 링크로 소비해 #4A3A2E 값과 결합 면의 근거로 삼았다.
-->

[거실의 짙은 책장](../settings/10-house.md#living)이다. 구성은 어두운 착색 호두나무 판재다. 외관은 `#4A3A2E`(선형 0.068, 0.042, 0.027), roughness 0.55, metallic 0.0, transmission 0.0이다. 결합 면은 [짙은 책장과 책](../models/11-living.md#dark-bookcase)의 `carcass`·`plinth`·`shelf`이다. `book`은 이 H2가 아니라 [회베이지 천갈이](#grey-beige-upholstery)와 [올리브](#olive-bedding)·[청회색](#blue-grey-bedding) 직물 값을 책마다 순환해 받는다. source owner는 `src/materials/furnishings/wood.ts`이고, 리뷰는 04 view에서 책장이 흰 벽 앞 짙은 덩어리로 읽히되 선반 그림자와 책 색 변화가 보이는지를 관찰한다.

벽 액자의 `art-frame`은 책장과 같은 짙은 목재를 사용하며 인쇄면 `art-print`는 별도 재료를 받는다.

표면 결속 계획: 짙은 책장 목재는 판 길이 U의 0.15 m 어두운 오크 결 맵을 쓴다. 각 선반·측판의 안쪽 시작 모서리를 원점으로 하고 판 끝에서 끊어 뒤판과 선반이 한 검은 면으로 합쳐지지 않게 한다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 회베이지 천갈이 {#grey-beige-upholstery}
<!--
@evidence principles/core/common.md#declared-basis 회베이지 천갈이의 #B7AFA3·roughness 0.92은 settings/10-house.md#living의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 회베이지 천갈이는 models/11-living.md#fabric-sofa, models/11-living.md#reading-armchair의 면에 마감만 결합하고 그 면의 geometry·경계는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 회베이지 천갈이는 #B7AFA3(선형 0.474, 0.429, 0.366), roughness 0.92, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/furnishings/textiles.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#living는 색·재료를 말로만 정했고 회베이지 천갈이는 #B7AFA3 값과 roughness 0.92, `base`·`seat-cushion`·`back`·`arm` 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 회베이지 천갈이는 구성을 '폼 위 직조 폴리 직물'로, 외관의 #B7AFA3·roughness 0.92·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 회베이지 천갈이의 결합 vocabulary는 `base`·`seat-cushion`·`back`·`arm`이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 회베이지 천갈이의 반증 견본은 '04와 03 view에서 소파가 벽보다 어둡고 광택 없이 읽히는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #B7AFA3 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 회베이지 천갈이는 settings/10-house.md#living, models/11-living.md#fabric-sofa를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 소파·안락의자의 직조 천은 0.01 m 날실/씨실 반복의 색·법선 결이다. 쿠션 파티션의 국소 가로 U·세로 V와 봉제선 원점을 쓰고 쿠션 이음에서 잘라 부피를 보존한다.
@evidence settings/10-house.md#living 회베이지 천갈이가 '전면 거실'(settings/10-house.md#living)를 링크로 소비해 #B7AFA3 값과 결합 면의 근거로 삼았다.
-->

[회색/미색 패브릭 소파](../settings/10-house.md#living)와 안락의자다. 구성은 폼 위 직조 폴리 직물이다. 외관은 `#B7AFA3`(선형 0.474, 0.429, 0.366), roughness 0.92, metallic 0.0, transmission 0.0이며 직조 결은 0.01 m 색·법선 맵으로 표현한다. 결합 면은 [패브릭 소파](../models/11-living.md#fabric-sofa)와 [독서 안락의자](../models/11-living.md#reading-armchair)의 `base`·`seat-cushion`·`back`·`arm`이다. source owner는 `src/materials/furnishings/textiles.ts`이고, 리뷰는 04와 03 view에서 소파가 벽보다 어둡고 광택 없이 읽히는지를 관찰한다.

거실 소파의 보조 `pillow`와 세 방 옷장 `clothes`의 회베이지 변형도 이 직물 값을 받는다. 다른 색 옷은 인스턴스별 올리브·청회색 직물로 분기한다.

표면 결속 계획: 소파·안락의자의 직조 천은 0.01 m 날실/씨실 반복의 색·법선 결이다. 쿠션 파티션의 국소 가로 U·세로 V와 봉제선 원점을 쓰고 쿠션 이음에서 잘라 부피를 보존한다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 회베이지 주침실 침구 {#primary-bedding}
<!--
@evidence principles/core/common.md#declared-basis 회베이지 주침실 침구의 #CFC8BC·roughness 0.93은 settings/10-house.md#primary-bedroom의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 회베이지 주침실 침구는 models/13-bedrooms.md#headboard-bed의 면에 마감만 결합하고 그 면의 geometry·경계는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 회베이지 주침실 침구는 #CFC8BC(선형 0.624, 0.578, 0.503), roughness 0.93, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/furnishings/textiles.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#primary-bedroom는 색·재료를 말로만 정했고 회베이지 주침실 침구는 #CFC8BC 값과 roughness 0.93, `bedding`·`pillow`·`mattress` 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 회베이지 주침실 침구는 구성을 '면 직물 이불·베개'로, 외관의 #CFC8BC·roughness 0.93·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 회베이지 주침실 침구의 결합 vocabulary는 `bedding`·`pillow`·`mattress`이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 회베이지 주침실 침구의 반증 견본은 '주침실 view에서 침구가 목재 침대와 카펫 사이에서 구별되는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #CFC8BC 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 회베이지 주침실 침구는 settings/10-house.md#primary-bedroom, models/13-bedrooms.md#headboard-bed를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 주침실 침구의 회베이지 직조 결은 0.01 m 모듈이다. 이불 장변 U·단변 V를 침대 발치 모서리에서 시작하고 접힌 끝·베개 경계에서 잘라 천의 방향을 읽힌다.
@evidence settings/10-house.md#primary-bedroom 회베이지 주침실 침구가 '주침실'(settings/10-house.md#primary-bedroom)를 링크로 소비해 #CFC8BC 값과 결합 면의 근거로 삼았다.
@evidence spaces/rooms/primary.md#primary-furniture-use primary-furniture-use가 후속 저작으로 둔 회베이지 침구 재료를 #CFC8BC로 주침실 침대 `bedding`에 결합한다.
-->

[주침실의 회베이지 침구](../settings/10-house.md#primary-bedroom)다. 구성은 면 직물 이불·베개이고 매트리스는 흰 면 커버다. 외관은 `#CFC8BC`(선형 0.624, 0.578, 0.503), roughness 0.93, metallic 0.0, transmission 0.0이다. 결합 면은 주침실 [머리판 있는 침대](../models/13-bedrooms.md#headboard-bed)의 `bedding`, 세 침대의 `pillow`와 `mattress`다. source owner는 `src/materials/furnishings/textiles.ts`이고, 리뷰는 주침실 view에서 침구가 목재 침대와 카펫 사이에서 구별되는지를 관찰한다.

표면 결속 계획: 주침실 침구의 회베이지 직조 결은 0.01 m 모듈이다. 이불 장변 U·단변 V를 침대 발치 모서리에서 시작하고 접힌 끝·베개 경계에서 잘라 천의 방향을 읽힌다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 올리브 침구 {#olive-bedding}
<!--
@evidence principles/core/common.md#declared-basis 올리브 침구의 #6B7040·roughness 0.92은 settings/10-house.md#bedroom-two의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 올리브 침구는 models/13-bedrooms.md#headboard-bed의 면에 마감만 결합하고 그 면의 geometry·경계는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 올리브 침구는 #6B7040(선형 0.147, 0.162, 0.051), roughness 0.92, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/furnishings/textiles.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#bedroom-two는 색·재료를 말로만 정했고 올리브 침구는 #6B7040 값과 roughness 0.92, `bedding` 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 올리브 침구는 구성을 '면 직물 이불'로, 외관의 #6B7040·roughness 0.92·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 올리브 침구의 결합 vocabulary는 `bedding`이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 올리브 침구의 반증 견본은 '기준 상태 판과 bedroom-two 전체 view에서 이불이 올리브로 식별되는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #6B7040 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 올리브 침구는 settings/10-house.md#bedroom-two, models/13-bedrooms.md#headboard-bed를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 침실 둘의 올리브 침구 직조 결은 0.01 m 모듈이다. 이불 장변 U·단변 V를 발치에서 시작하고 접힘과 베개 경계에서 끊어 주침실 회베이지와 구별한다.
@evidence settings/10-house.md#bedroom-two 올리브 침구가 '올리브 침구의 작은 침실'(settings/10-house.md#bedroom-two)를 링크로 소비해 #6B7040 값과 결합 면의 근거로 삼았다.
-->

[올리브색 침구의 작은 침실](../settings/10-house.md#bedroom-two)의 식별색이다. 구성은 면 직물 이불이다. 외관은 `#6B7040`(선형 0.147, 0.162, 0.051), roughness 0.92, metallic 0.0, transmission 0.0이다. 결합 면은 bedroom-two에 놓인 [머리판 있는 침대](../models/13-bedrooms.md#headboard-bed) instance의 `bedding`이며 같은 원형의 방별 변형은 instances가 선언한다. source owner는 `src/materials/furnishings/textiles.ts`이고, 리뷰는 기준 상태 판과 bedroom-two 전체 view에서 이불이 올리브로 식별되는지를 관찰한다.

책장의 `book` 표지 및 옷방 `clothes`의 올리브 변형에도 이 색 직물 결을 재사용한다. 침구 `bedding`과는 서로 다른 부품 경계에서 끊는다.

표면 결속 계획: 침실 둘의 올리브 침구 직조 결은 0.01 m 모듈이다. 이불 장변 U·단변 V를 발치에서 시작하고 접힘과 베개 경계에서 끊어 주침실 회베이지와 구별한다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 청회색 침구 {#blue-grey-bedding}
<!--
@evidence principles/core/common.md#declared-basis 청회색 침구의 #6E7F8C·roughness 0.92은 settings/10-house.md#bedroom-three의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 청회색 침구는 spaces/03-surface-owners.md의 owner 면의 면에 마감만 결합하고 그 면의 geometry·경계는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 청회색 침구는 #6E7F8C(선형 0.156, 0.212, 0.262), roughness 0.92, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/furnishings/textiles.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#bedroom-three는 색·재료를 말로만 정했고 청회색 침구는 #6E7F8C 값과 roughness 0.92, `bedding` 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 청회색 침구는 구성을 '면 직물 이불'로, 외관의 #6E7F8C·roughness 0.92·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 청회색 침구의 결합 vocabulary는 `bedding`이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 청회색 침구의 반증 견본은 '두 작은 침실 view를 나란히 놓아 따뜻한 실내등 아래에서도 침구색이 구별되는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #6E7F8C 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 청회색 침구는 settings/10-house.md#bedroom-three를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 침실 셋의 청회색 침구 직조 결은 0.01 m 모듈이다. 이불 장변 U·단변 V를 발치에서 시작하고 접힘과 베개 경계에서 끊어 다른 두 침구와 구별한다.
@evidence settings/10-house.md#bedroom-three 청회색 침구가 '청회색 침구의 작은 침실'(settings/10-house.md#bedroom-three)를 링크로 소비해 #6E7F8C 값과 결합 면의 근거로 삼았다.
-->

[청회색 침구의 작은 침실](../settings/10-house.md#bedroom-three)의 식별색이다. 구성은 면 직물 이불이다. 외관은 `#6E7F8C`(선형 0.156, 0.212, 0.262), roughness 0.92, metallic 0.0, transmission 0.0이며 올리브와 명도가 비슷하되 색상이 반대편이어서 두 방이 침구로 구별된다. 결합 면은 bedroom-three에 놓인 머리판 있는 침대 instance의 `bedding`이다. source owner는 `src/materials/furnishings/textiles.ts`이고, 리뷰는 두 작은 침실 view를 나란히 놓아 따뜻한 실내등 아래에서도 침구색이 구별되는지를 관찰한다.

책장의 `book` 표지 및 옷방 `clothes`의 청회색 변형에도 이 색 직물 결을 재사용한다. 침구 `bedding`과는 서로 다른 부품 경계에서 끊는다.

표면 결속 계획: 침실 셋의 청회색 침구 직조 결은 0.01 m 모듈이다. 이불 장변 U·단변 V를 발치에서 시작하고 접힘과 베개 경계에서 끊어 다른 두 침구와 구별한다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 절제된 러그 {#muted-rug}
<!--
@evidence principles/core/common.md#declared-basis 절제된 러그의 #8E8579·roughness 0.95은 settings/10-house.md#living의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 절제된 러그는 models/11-living.md#floor-covering의 면에 마감만 결합하고 그 면의 geometry·경계는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 절제된 러그는 #8E8579(선형 0.270, 0.235, 0.191), roughness 0.95, metallic 0.0, transmission 0.0, 결합 면, source owner `src/materials/furnishings/textiles.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#living는 색·재료를 말로만 정했고 절제된 러그는 #8E8579 값과 roughness 0.95, `field`·`border` 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 절제된 러그는 구성을 '얇은 양모 직물'로, 외관의 #8E8579·roughness 0.95·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 절제된 러그의 결합 vocabulary는 `field`·`border`이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 절제된 러그의 반증 견본은 '04 view에서 러그가 마루 위 별도 면과 테두리로 읽히는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #8E8579 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 절제된 러그는 settings/10-house.md#living, models/11-living.md#floor-covering를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 러그 `field`에는 0.15 m 반복의 절제된 기하 직조 무늬, `border`에는 같은 섬유결만 둔다. 러그 왼쪽 앞 모서리를 원점으로 U 폭·V 길이를 쓰고 테두리 파티션에서 패턴을 정확히 끊는다.
@evidence settings/10-house.md#living 절제된 러그가 '전면 거실'(settings/10-house.md#living)를 링크로 소비해 #8E8579 값과 결합 면의 근거로 삼았다.
-->

[절제된 무늬 러그](../settings/10-house.md#living)다. 구성은 얇은 양모 직물이다. 외관은 몸체 `#8E8579`(선형 0.270, 0.235, 0.191), roughness 0.95, metallic 0.0, transmission 0.0이고 테두리는 [회베이지 천갈이](#grey-beige-upholstery) 값이다. 무늬는 [얇은 바닥 깔개](../models/11-living.md#floor-covering)의 `field`에 0.15 m 직조 맵으로 넣고 `border` 파티션에서 정확히 자른다. source owner는 `src/materials/furnishings/textiles.ts`이고, 리뷰는 04 view에서 러그가 마루 위 별도 면과 테두리로 읽히는지를 관찰한다.

표면 결속 계획: 러그 `field`에는 0.15 m 반복의 절제된 기하 직조 무늬, `border`에는 같은 섬유결만 둔다. 러그 왼쪽 앞 모서리를 원점으로 U 폭·V 길이를 쓰고 테두리 파티션에서 패턴을 정확히 끊는다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 흰 수건과 얇은 커튼 {#towel-curtain-textile}
<!--
@evidence principles/core/common.md#declared-basis 흰 수건과 얇은 커튼의 #EAE6DC·roughness 0.95은 settings/10-house.md#shower-bathroom의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 흰 수건과 얇은 커튼은 models/14-bathrooms.md#towel-bar, models/14-bathrooms.md#tub-curtain-rail, models/13-bedrooms.md#primary-window-curtains와 wardrobe-shelves의 부재 면에 마감만 결합하고 geometry·경계는 모델 owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 수건 #EAE6DC(roughness 0.95)와 커튼 #EDE9E0(roughness 0.90, transmission 0.30, 양면), 욕조·주침실 창 커튼의 `curtain` 파티션 및 수건·접힌 린넨 결속, source owner `src/materials/furnishings/textiles.ts`와 관찰을 모두 적는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#shower-bathroom는 색·재료를 말로만 정했고 흰 수건과 얇은 커튼은 #EAE6DC 값과 roughness 0.95, `towel`·`curtain`·`folded` 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 흰 수건과 얇은 커튼은 구성을 '파일 면 직물(수건)과 얇은 폴리 직물(커튼)'로, 외관의 #EAE6DC·roughness 0.95·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 수건과 린넨의 `towel`·`folded`, 욕조와 주침실 창의 `curtain`을 분리 결속하며 얇은 커튼은 양면이다.
@evidence principles/design/materials.md#material-verification-address 흰 수건과 얇은 커튼의 반증 견본은 '욕조 커튼이 빛을 통과시키는지와 수건이 흰 타일과 구별되는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #EAE6DC 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 흰 수건과 얇은 커튼은 settings/10-house.md#shower-bathroom, settings/10-house.md#storage를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 수건은 0.01 m 파일 결, 얇은 커튼은 0.02 m 투과 직조 결을 각 파티션에 따로 쓴다. 세로 매달림을 V, 폭을 U로 두고 각각 아래 왼쪽을 원점으로 하며 봉제 끝·창틀 경계에서 끊는다.
@evidence settings/10-house.md#primary-bedroom 주침실의 얇은 두 창 커튼을 #EDE9E0과 양면 투과 직물로 받고 방 안쪽 0.12 m 예약을 마감이 늘리지 않는다.
@evidence settings/10-house.md#shower-bathroom 흰 수건과 얇은 커튼이 '샤워 욕실'(settings/10-house.md#shower-bathroom)를 링크로 소비해 #EAE6DC 값과 결합 면의 근거로 삼았다.
@evidence settings/10-house.md#storage 흰 수건과 얇은 커튼이 '수납'(settings/10-house.md#storage)를 링크로 소비해 #EAE6DC 값과 결합 면의 근거로 삼았다.
-->

[수건](../settings/10-house.md#shower-bathroom)·[접힌 린넨](../settings/10-house.md#storage)과 [주침실의 얇은 커튼](../models/13-bedrooms.md#primary-window-curtains), 욕조 샤워 커튼이다. 구성은 파일 면 직물(수건)과 얇은 폴리 직물(커튼)이다. 수건 외관은 `#EAE6DC`(선형 0.823, 0.791, 0.716), roughness 0.95, metallic 0.0, transmission 0.0이다. 커튼 외관은 `#EDE9E0`(선형 0.847, 0.815, 0.745), roughness 0.90, metallic 0.0, transmission 0.30이며 양면이어서 창빛이 비친다. 두 값은 교체 경로가 달라 source에서 두 재료 객체로 둔다. 결합 면은 [수건걸이와 수건](../models/14-bathrooms.md#towel-bar)의 `towel`, [욕조 커튼](../models/14-bathrooms.md#tub-curtain-rail)의 `curtain`, 주침실 두 창 원형의 `curtain`, 린넨장·[옷방 선반](../models/13-bedrooms.md#wardrobe-shelves)의 `folded`다. 커튼 원형의 `rod`·`bracket`은 [검은 도장 금속](02-interior-shell.md#black-coated-metal)을 받는다. source owner는 `src/materials/furnishings/textiles.ts`이고, 리뷰는 욕조와 주침실 창 커튼이 빛을 통과시키면서 창 유리·수건·흰 타일과 구별되는지를 관찰한다.

협탁등의 `lamp-shade`와 매단 등의 `fixture-shade`는 밝은 직물 외관을 받되 구조 부재는 별도 금속 표면으로 남긴다.

표면 결속 계획: 수건은 0.01 m 파일 결, 얇은 커튼은 0.02 m 투과 직조 결을 각 파티션에 따로 쓴다. 세로 매달림을 V, 폭을 U로 두고 각각 아래 왼쪽을 원점으로 하며 봉제 끝·창틀 경계에서 끊는다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 거울 {#mirror}
<!--
@evidence principles/core/common.md#declared-basis 거울의 #EDEDED·roughness 0.02은 settings/10-house.md#powder의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 거울은 models/14-bathrooms.md#wall-mirror의 면에 마감만 결합하고 그 면의 geometry·경계는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 거울은 #EDEDED(선형 0.847, 0.847, 0.847), roughness 0.02, metallic 1.0, transmission 0.0, 결합 면, source owner `src/materials/furnishings/fixtures.ts`, 리뷰 관찰을 모두 적었다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#powder는 색·재료를 말로만 정했고 거울은 #EDEDED 값과 roughness 0.02, `mirror`·`frame` 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 거울은 구성을 '뒷면 은막을 입힌 유리 판'로, 외관의 #EDEDED·roughness 0.02·metallic 1.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 거울의 결합 vocabulary는 `mirror`·`frame`이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 거울의 반증 견본은 '욕실 view에서 거울이 방을 반사하되 관찰 대상을 가리지 않는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #EDEDED 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 거울은 settings/10-house.md#powder, models/14-bathrooms.md#wall-mirror를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 거울은 의도적으로 무문양의 매끈한 반사면이다. roughness 0.02·금속성 은막과 실제 장면 반사로 세면장 위 거울임을 보이고 frame 파티션에서 끝낸다. 회색 단색판이면 실패다.
@evidence settings/10-house.md#powder 거울이 '파우더룸'(settings/10-house.md#powder)를 링크로 소비해 #EDEDED 값과 결합 면의 근거로 삼았다.
@evidence spaces/rooms/powder.md#powder-fixture-use powder-fixture-use가 materials에 넘긴 거울 재료를 `mirror`의 #EDEDED, roughness 0.02, metallic 1.0으로 받는다.
-->

[세면대 거울](../settings/10-house.md#powder)이다. 구성은 뒷면 은막을 입힌 유리 판이다. 외관은 은막 반사를 표면 반사로 근사한 `#EDEDED`(선형 0.847, 0.847, 0.847), roughness 0.02, metallic 1.0, transmission 0.0이다. 결합 면은 [벽 거울](../models/14-bathrooms.md#wall-mirror)의 `mirror`이며 `mirror-frame`은 [검은 도장 금속](02-interior-shell.md#black-coated-metal)을 받는다. source owner는 `src/materials/furnishings/fixtures.ts`이고, 리뷰는 욕실 view에서 거울이 방을 반사하되 관찰 대상을 가리지 않는지를 관찰한다.

표면 결속 계획: 거울은 의도적으로 무문양의 매끈한 반사면이다. roughness 0.02·금속성 은막과 실제 장면 반사로 세면장 위 거울임을 보이고 frame 파티션에서 끝낸다. 회색 단색판이면 실패다. 실제 GPU 근접·리뷰 거리 판정은 아직 없으므로 unverified다.

## 벽난로 화구 {#firebox-black}
<!--
@evidence principles/core/common.md#declared-basis 벽난로 화구의 #1F1F20·roughness 0.90은 settings/10-house.md#living의 조건을 근거로 한 이 branch의 선택이며 사진 픽셀 값이 아니라고 00 색 공간 규칙과 함께 밝힌다.
@evidence principles/core/common.md#scope-preservation 벽난로 화구는 spaces 03 interior-surface-handoff의 `src/spaces/rooms/living.ts` owner가 가진 벽난로 안쪽 접면 중 화구 안쪽 면에 마감만 결합하고 그 면의 geometry·경계와 개수는 host owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 벽난로 화구는 #1F1F20, roughness 0.90, metallic 0.0, transmission 0.0과 `src/spaces/rooms/living.ts` owner의 벽난로 안쪽 접면 결합, source owner `src/materials/furnishings/fixtures.ts`, 04 view 관찰을 적었고 화구 면의 개별 surface id는 source 단계에서 그 owner가 부여한다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 부모 settings/10-house.md#living는 색·재료를 말로만 정했고 벽난로 화구는 #1F1F20 값과 roughness 0.90, 결합 면 결합을 더한다.
@evidence principles/design/materials.md#material-construction-appearance 벽난로 화구는 구성을 '그을린 내화 벽돌'로, 외관의 #1F1F20·roughness 0.90·metallic 0.0을 기준값으로 두고 아래 표면 결속 계획의 결·광학 응답으로 최상층 마감을 표현한다고 적는다.
@evidence principles/design/materials.md#material-binding-interface 벽난로 화구의 결합 vocabulary는 spaces 03 interior-surface-handoff의 `src/spaces/rooms/living.ts` owner가 가진 벽난로 안쪽 접면 중 화구 안쪽 면이며 방향과 단면/양면은 00 면 결합 규칙을 따른다.
@evidence principles/design/materials.md#material-verification-address 벽난로 화구의 반증 견본은 '04 view에서 화구가 벽돌 본체와 목재 선반 사이에서 구별되는지'이고 00 재료 리뷰 견본의 중성 조명 판이 #1F1F20 값을 대조한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 벽난로 화구는 settings/10-house.md#living를 적힌 그대로 소비했고 수정할 부모 결함을 찾지 않았다.
@evidence contracts/texture-readability.md#material-texture-readability 꺼진 화구의 내화재에는 0.10 m 반복의 약한 그을음·거친 표면 결을 쓴다. 화구 안쪽 왼쪽 아래에서 U 수평·V 높이를 두고 벽돌 입구·선반 경계에서 끊으며 불빛을 그려 넣지 않는다.
@evidence settings/10-house.md#living 벽난로 화구가 '전면 거실'(settings/10-house.md#living)를 링크로 소비해 #1F1F20 값과 결합 면의 근거로 삼았다.
@evidence spaces/rooms/living.md#living-furniture-use living-furniture-use가 후속 저작으로 둔 벽난로 화구 재료를 #1F1F20, roughness 0.90으로 living owner의 화구 안쪽 면에 결합한다.
-->

[벽난로의 검은 화구](../settings/10-house.md#living)다. 구성은 그을린 내화 벽돌이며 줄눈은 표현하지 않는다. 외관은 `#1F1F20`(선형 0.014, 0.014, 0.014), roughness 0.90, metallic 0.0, transmission 0.0이고 불은 꺼진 정적 상태라 발광이 없다. 결합 면은 [화구 원형](../models/11-living.md#fireplace-insert-mantel)의 `firebox`·`firebox-trim`이다. 벽돌 본체와 화구 뒤·옆 개구부는 [벽난로 공간 owner](../spaces/envelope/left.md#chimney-roof-interface)가 소유하고 [붉은갈색 벽돌](01-exterior.md#brick-red-brown)을 받는다. 목재 `mantel`은 [꿀빛 가구 목재](#furniture-wood)를 받는다. source owner는 `src/materials/furnishings/fixtures.ts`이고, 리뷰는 04 view에서 화구가 벽돌 본체와 목재 선반 사이에서 구별되는지를 관찰한다.

표면 결속 계획: 꺼진 화구의 내화재에는 0.10 m 반복의 약한 그을음·거친 표면 결을 쓴다. 화구 안쪽 왼쪽 아래에서 U 수평·V 높이를 두고 벽돌 입구·선반 경계에서 끊으며 불빛을 그려 넣지 않는다. 아직 생성된 맵과 GPU 근접·리뷰 거리 판정은 없으므로 unverified다.

## 식재의 수피와 잎 {#planting-bark-foliage}
<!--
@evidence principles/core/common.md#declared-basis 레퍼런스 01의 실제 수관과 settings/10-house.md#site-identity의 성목·관목을 근거로 수피와 잎의 색·거칠기·결을 택한다.
@evidence principles/core/common.md#scope-preservation models/16-planting.md#site-tree-prototypes와 #site-shrub-prototype의 `bark`·`foliage`, 18·19의 작은 식물 `stem`·`foliage`에 마감만 결합한다.
@evidence principles/core/common.md#substantive-completion 수피 #675746·roughness 0.92, 잎 #617343·roughness 0.88, 국소 UV·반복 척도·source owner·관찰을 결정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 16의 식재 부피에 수피와 잎의 서로 다른 반사와 실제 m당 반복 결을 더하되 가지·잎 군집 수는 바꾸지 않는다.
@evidence principles/design/materials.md#material-construction-appearance 수피의 세로 갈라짐과 잎 군집의 명암 점을 각각 0.08 m·0.025 m 모듈로 계획하며 광학 응답과 구조를 분리한다.
@evidence principles/design/materials.md#material-binding-interface `bark`·`stem`은 수피, `foliage`는 잎으로 결합하고 각 클러스터 끝에서 UV 이음을 끊는다.
@evidence principles/design/materials.md#material-verification-address 01 대지 view와 02 조감의 나무 실루엣에서 잎이 단색 블록으로 뭉개지면 실패다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work settings의 식재 크기와 models의 면 id를 소비하며 공간 그래프·식재 원형을 수정하지 않는다.
@evidence contracts/texture-readability.md#material-texture-readability 수피는 가지 길이 U·둘레 V에 0.08 m, 잎은 클러스터 외곽 접평면에 0.025 m 반복을 쓰고 원형별 국소 원점에서 시작한다.
@evidence obligations/design/materials.md#material-surface-assignment 새 식재 면 세 id를 재료에 결속한다.
-->

[식재 원형](../models/16-planting.md#site-tree-prototypes)의 `bark`와 실내 소형 식물의 `stem`에는 `#675746`(roughness 0.92, metallic 0, transmission 0)을, 야외·실내 `foliage`에는 `#617343`(roughness 0.88, metallic 0, transmission 0)을 쓴다. 수피의 어두운 세로 균열과 밝은 측면을 0.08 m, 잎 군집의 밝고 어두운 미세 점을 0.025 m 물리 모듈로 결정론적으로 만든다. 가지 길이 U·둘레 V, 잎 클러스터의 국소 접평면 U/V를 미터로 읽고 가지 접합·개별 클러스터에서 이음을 끊는다. source owner는 `src/materials/exterior/planting.ts`이며 실제 맵·GPU 읽힘은 unverified다.

## 등기구의 확산면 {#light-fixture-surfaces}
<!--
@evidence principles/core/common.md#declared-basis systems/02-interior-fixtures.md#interior-fixture-layout과 models/17-light-fixtures.md#flush-ceiling-fixture가 넘긴 등기구의 보이는 몸체와 확산면을 받는다.
@evidence principles/core/common.md#scope-preservation 등기구의 확산면·유리·갓 마감만 결정하고 광원 광도·색온도·배치는 systems와 instances에 남긴다.
@evidence principles/core/common.md#substantive-completion 확산면 #F4F1E9·roughness 0.36·transmission 0.35와 포치 유리 transmission 0.78, 재료 id·UV·검사 주소를 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 17의 `fixture-diffuser`·`fixture-glass`에 실제 투과 응답을 주고 `fixture-housing`·`fixture-canopy`·`fixture-stem`은 기존 도장 금속을 재사용한다.
@evidence principles/design/materials.md#material-construction-appearance 폴리카보네이트 확산판과 포치 투명 유리의 광학값을 구별하며 이미지에 빛무리를 그리지 않는다.
@evidence principles/design/materials.md#material-binding-interface `fixture-diffuser`·`fixture-glass`를 각각 확산판·유리에 결속하고 갓·기구 외장은 별도 기존 재료를 받는다.
@evidence principles/design/materials.md#material-verification-address 03 매단 등과 01 포치 등에서 기구 경계와 조명이 별개로 보이는지 확인한다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 기구 크기·배치·광도 결정을 수정하지 않고 17의 id만 마감한다.
@evidence contracts/texture-readability.md#material-texture-readability 매끈한 확산판은 무문양이고 부재 경계의 실제 반사·투과로 읽힌다. 평면 U/V는 부재 국소 미터 좌표다.
@evidence obligations/design/materials.md#material-surface-assignment 확산판과 등 유리 두 id를 명시적으로 결합한다.
-->

[등기구 원형](../models/17-light-fixtures.md#flush-ceiling-fixture)의 `fixture-diffuser`는 폴리카보네이트 `#F4F1E9`(roughness 0.36, metallic 0, transmission 0.35), [포치 벽등](../models/17-light-fixtures.md#porch-wall-sconce)의 `fixture-glass`는 같은 색의 유리(roughness 0.06, metallic 0, transmission 0.78, ior 1.50)다. 두 면은 무문양이지만 실제 반사와 투과, 두께 있는 몸체와 떨어진 경계로 구별한다. 빛의 세기·색온도·그림자는 [systems](../systems/00-lighting-frame.md#lighting-allocation)의 소유다. `fixture-housing`·`fixture-canopy`·`fixture-stem`은 [검은 도장 금속](02-interior-shell.md#black-coated-metal), `fixture-shade`는 [얇은 커튼](#towel-curtain-textile)의 밝은 직물 값을 받는다. source owner는 `src/materials/furnishings/fixtures.ts`이며 실제 GPU 프레임은 unverified다.

## 음식과 액자 인쇄면 {#food-art-finishes}
<!--
@evidence principles/core/common.md#declared-basis 레퍼런스 03의 과일 그릇과 02–05의 벽 액자에 근거해 음식과 인쇄면을 별도 마감한다.
@evidence principles/core/common.md#scope-preservation 18의 과일 표면과 19의 액자 인쇄면만 맡고 그릇·액자 테·가구 형상은 원형에 남긴다.
@evidence principles/core/common.md#substantive-completion 과일 다섯의 순서별 색 세 가지와 인쇄면의 결정론적 띠 규칙·물리 모듈·source owner를 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation `fruit`·`art-print`의 안정 id에 읽히는 색 분할과 인쇄 결을 더하되 수·위치·이미지 픽셀 치수를 바꾸지 않는다.
@evidence principles/design/materials.md#material-construction-appearance 과일은 광택 적은 껍질, 액자는 종이 인쇄로 두어 같은 단색 도장으로 보이지 않게 한다.
@evidence principles/design/materials.md#material-binding-interface `fruit`는 순번에 따른 세 값, `art-print`는 국소 인쇄면 U/V로 결속한다.
@evidence principles/design/materials.md#material-verification-address 03 식탁 과일과 04·05 액자가 빈 상판·흰 벽과 구별되지 않으면 실패다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 소품 수와 벽·상판 경계는 models·spaces가 정한 그대로 받는다.
@evidence contracts/texture-readability.md#material-texture-readability 과일 표피 색반점 0.008 m, 액자 인쇄 획 0.05 m는 원형 UV의 미터 척도이며 개별 과일·인쇄면 테에서 잘린다.
@evidence obligations/design/materials.md#material-surface-assignment `fruit`·`art-print`의 두 표면 id를 재료에 결속한다.
-->

[과일 다섯](../models/18-house-props.md#kitchen-food-utensils)의 `fruit`는 순번 i = 0…4에서 i mod 3 = 0이면 올리브 `#859344`, 1이면 황금색 `#C9A449`, 2이면 붉은색 `#9C5549`다(roughness 0.62, metallic 0, transmission 0). 각 과일 표피 반점은 0.008 m 반복이다. [액자](../models/19-room-accents.md#wall-art-indoor-plant)의 `art-print`는 종이 `#ECE8DF`(roughness 0.90, metallic 0)에 0.05 m 물리 간격으로 얇은 청회·올리브 붓 획을 국소 UV와 정수 seed 1952에서 생성한다. 구체적인 획 방정식·소스 배열은 materialSources의 결정론적 함수가 맡으며 지금의 인쇄 이미지는 unverified다. `art-frame`은 [짙은 책장 목재](#dark-bookcase-wood)를 받는다. source owner는 `src/materials/furnishings/accents.ts`다.

## 나머지 소품 파티션 {#minor-prop-partitions}
<!--
@evidence principles/core/common.md#declared-basis 원형마다 표면 id를 확인해 기존 H2 재료를 다시 쓰되 다른 역할의 면을 같은 이름으로 숨기지 않는다.
@evidence principles/core/common.md#scope-preservation 05·12·13·18·19의 수납·소품과 17의 기구 외장에 남은 면의 계획 결속을 맡고 실제 source 결속은 후속 materialSources에 남긴다.
@evidence principles/core/common.md#substantive-completion 아래 표의 원형·id·재료 H2 매핑을 적고 현재 생성 맵과 GPU 결과를 unverified로 둔다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation models 00의 역할 id를 실제 재료 H2 주소로 바꾸어 `prop` 같은 무명 대체를 쓰지 않는다.
@evidence principles/design/materials.md#material-construction-appearance 각 면은 링크된 목재·금속·직물·유리의 광학 응답을 그대로 받아 역할별 색·결이 구별된다.
@evidence principles/design/materials.md#material-binding-interface 아래 표에 적힌 정확한 모델 id만 결속하며 관절 이름이나 배치 id는 재료 id로 쓰지 않는다.
@evidence principles/design/materials.md#material-verification-address 실제 source 뒤 표면 id 미결속 0 검사를 요구하고 현재는 unverified라고 남긴다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 원형의 면 이름을 확인해 재료 문서만 정정했고 공간·원형 치수는 여기서 바꾸지 않는다.
@evidence contracts/texture-readability.md#material-texture-readability 재사용 면은 링크한 원 재료 H2의 물리 척도·국소 축·부재별 끊김을 그대로 따른다.
@evidence obligations/design/materials.md#material-surface-assignment 표의 id마다 한 재료 H2를 지정하되 source 구현 뒤 실제 결속을 다시 검사한다.
-->

| 원형 | 결합 surface id | 재료 H2 |
|---|---|---|
| [외투장과 린넨장](../models/05-closet-fittings.md#closet-fitting-surfaces), [미닫이 옷장](../models/13-bedrooms.md#sliding-closet), [옷방](../models/13-bedrooms.md#wardrobe-hanging) | `carcass`·`leaf`·`leaf-panel`·`shelf` | [흰 실내 trim](02-interior-shell.md#interior-trim-white) |
| 같은 수납 | `rail`·`rod` | [스테인리스](#stainless-steel) |
| 같은 수납 | `handle` | [검은 도장 금속](02-interior-shell.md#black-coated-metal) |
| [옷장](../models/13-bedrooms.md#wardrobe-hanging)·[머드룸 외투 걸이](../models/12-service-rooms.md#mudroom-coat-hooks) | `clothes` | 순번별 [회베이지](#grey-beige-upholstery)·[청회색](#blue-grey-bedding)·[올리브](#olive-bedding) 직물 |
| [팬트리 용기](../models/12-service-rooms.md#pantry-containers) | `container` / `lid`·`basket` | [투명 유리](01-exterior.md#glass-clear) / [가구 목재](#furniture-wood) |
| [머드룸 걸이](../models/12-service-rooms.md#mudroom-coat-hooks) | `rail` / `hook` | [가구 목재](#furniture-wood) / [검은 도장 금속](02-interior-shell.md#black-coated-metal) |
| [차고 선반·공구판](../models/12-service-rooms.md#garage-shelving) | `bin`·`tool-grip` / `board` / `tool-steel` | [검은 도장 금속](02-interior-shell.md#black-coated-metal) / [가구 목재](#furniture-wood) / [스테인리스](#stainless-steel) |
| [작은 책상 소품](../models/13-bedrooms.md#child-desk) | `book` / `container` / `pencil` | [침구색 순환](#olive-bedding) / [흰 에나멜](#white-enamel) / [가구 목재](#furniture-wood) |
| [옷방 선반 바구니](../models/13-bedrooms.md#wardrobe-shelves) | `basket` | [가구 목재](#furniture-wood) |
| [욕실 매트](../models/14-bathrooms.md#bath-floor-mats) | `field`·`border` | [절제된 러그](#muted-rug) |
| [샤워 벽감 병](../models/14-bathrooms.md#shower-niche-bottles) | `container` / `lid` | [흰 에나멜](#white-enamel) / [검은 도장 금속](02-interior-shell.md#black-coated-metal) |
| [협탁등](../models/13-bedrooms.md#nightstand-lamp) | `lamp-base` / `lamp-shade` | [흰 에나멜](#white-enamel) / [얇은 커튼 직물](#towel-curtain-textile) |
| [포치 발판·화분](../models/18-house-props.md#porch-mat-planter) | `field`·`border` / `container` / `stem`·`foliage` | [절제된 러그](#muted-rug) / [흰 도기](#white-enamel) / [식재](#planting-bark-foliage) |
| [주방 소품](../models/18-house-props.md#kitchen-food-utensils) | `cutting-board` / `utensil` / `container` / `bowl` / `fruit` | [가구 목재](#furniture-wood) / [스테인리스](#stainless-steel) / [투명 유리](01-exterior.md#glass-clear) / [흰 도기](#white-enamel) / [과일](#food-art-finishes) |
| [린넨 수건](../models/18-house-props.md#linen-folded-towels)·[소파 직물](../models/19-room-accents.md#sofa-throws) | `folded`·`pillow` | [수건 직물](#towel-curtain-textile)·[회베이지](#grey-beige-upholstery) — 인스턴스별 구별 |
| [거실 탁자 소품](../models/19-room-accents.md#living-tabletop-props) | `book`·`tray` / `container` / `stem`·`foliage` | [직물 색 순환](#olive-bedding)·[가구 목재](#furniture-wood) / [흰 도기](#white-enamel) / [식재](#planting-bark-foliage) |
| [벽 액자·실내 식물](../models/19-room-accents.md#wall-art-indoor-plant) | `art-frame` / `art-print` / `container` / `stem`·`foliage` | [짙은 목재](#dark-bookcase-wood) / [인쇄면](#food-art-finishes) / [흰 도기](#white-enamel) / [식재](#planting-bark-foliage) |
| [등기구](../models/17-light-fixtures.md#flush-ceiling-fixture) | `fixture-housing`·`fixture-canopy`·`fixture-stem` / `fixture-shade` / `fixture-diffuser`·`fixture-glass` | [검은 도장 금속](02-interior-shell.md#black-coated-metal) / [밝은 직물](#towel-curtain-textile) / [등기구 확산면](#light-fixture-surfaces) |

이 표는 설계 결속이다. 실제 `src/materials` 바인딩과 GPU 표면 읽힘은 unverified다. 각 면의 UV 축·원점·반복 길이·경계 절단은 링크된 재료 H2를 따르며, 원형 안의 관절 이름·배치 id는 결속 표에 넣지 않는다. source owner는 `src/materials/bindings.ts`다.

머드룸의 `shoe`는 [검은 도장 금속](02-interior-shell.md#black-coated-metal)의 어두운 무광 값, 옷방의 `shoe-box`는 [가구 목재](#furniture-wood)의 따뜻한 갈색 값을 부피의 모든 면에 받는다.

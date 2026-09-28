# 신전 표면 재료

이 파일은 [외피](../settings/20-envelope.md#material-language), [실내](../settings/30-interiors.md), [대지](../settings/40-environment.md), [표현 수준](../settings/50-production.md#fidelity)과 다섯 참고 이미지에서 채택한 재료의 물리적 구분과 렌더 반응을 정한다. 사진은 색·명암·부재 관계의 근거이지 안료 분석이나 실측 자료가 아니다. [결속 키와 모델 part](10-model-bindings.md#binding-map), [공간 표면](20-space-bindings.md#space-binding-map)은 배정과 반복 길이의 소유자다. 색은 sRGB 기본색이고 source는 선형 광량으로 변환한다. 거칠기·금속도는 결정론적 3D 검토 값이지 실제 재료 시험값이 아니다. 재료는 host 두께·형상·UV0를 바꾸지 않는다. 절차 생성 PNG는 3D 표면 입력이며 완성 프레임을 덧칠하지 않는다.

## 밝은 석회석 부재 {#stone}

<!--
@evidence principles/core/common.md#declared-basis 낮은 마당 둘레벽은 settings/30-interiors.md#service-yard에서, 높은 마당쪽 면까지 같은 limestone 키로 묶는 선택은 spaces/facades/north.md#north-envelope와 단일 service-yard.wall ID에서 온다.
@evidence principles/core/common.md#scope-preservation 기단·코핑·문틀·기둥·수반의 석재 part와 service-yard 안쪽 wall 및 wall-top에 한정해 limestone를 정하고 형상·배치·인접 재료의 소유를 건드리지 않는다.
@evidence principles/core/common.md#substantive-completion 기단·코핑·문틀·기둥·수반의 석재 part와 service-yard 안쪽 wall 및 wall-top의 기본색·거칠기·비트맵 또는 무비트맵과 검토 실패 조건을 H2에서 닫는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 석재로 정해진 낮은 마당 벽에 더해, 단일 service-yard.wall 주소가 품은 높은 두 면과 코핑을 limestone으로 결속하고 1 m 반복·거칠기 0.86과 01·02·03 관찰 장면을 정한다.
@evidence principles/design/materials.md#material-construction-appearance limestone의 1m 석재 명암과 거칠기 0.86을 블록 형상 대신 표면 응답으로 둔다
@evidence principles/design/materials.md#material-binding-interface 기단/코핑/문틀/기둥 part와 service-yard.wall·wall-top, 월드 미터 UV0를 분리한다
@evidence principles/design/materials.md#material-verification-address 01 코핑과 02 마당 벽, 03 분수의 밝은 석재가 목재와 구별되는가
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work service-yard.wall은 낮은 북·동쪽 둘레벽과 높은 제실·보관실 면을 함께 가리킨다. 이 H2는 그 주소 전체를 석재로 선택하고 wall-top도 석재로 두므로 공간 면 분할을 요청하지 않는다.
@evidence obligations/design/materials.md#addressable-material-decisions 석회석을 회벽·포장·점토와 독립 H2로 두어 코핑·기단·기둥의 키와 관찰 기준을 별도로 고칠 수 있다.
@evidence settings/20-envelope.md#colonnade 밝은 원형 기둥의 plinth·base·shaft·capital을 limestone에 배정한다.
@evidence settings/20-envelope.md#entrance-porch 현관 두 원주와 석재 인방·문틀을 limestone으로 읽고 짙은 목재 문짝과 분리한다.
@evidence settings/30-interiors.md#service-yard 낮은 북·동쪽 석재 둘레벽을 limestone으로 받는다; 높은 마당쪽 두 벽의 같은 키는 spaces의 단일 wall ID에 따른 재료 선택이다.
@evidence spaces/facades/north.md#north-envelope 북쪽 outer 회벽과 마당쪽 stone wall 및 coping을 별개 면으로 읽고 service-yard 단일 안쪽 wall ID에 limestone을 준다.
@evidence spaces/junctions.md#plinth-coping 기단·코핑·문 주변의 물리 면을 limestone으로 묶고 회벽 전환은 기존 부재 경계에서만 둔다.
@evidence spaces/openings.md#doors door-frame의 석재 lining/surround를 목재 leaf와 금속 철물로부터 분리한다.
@evidence spaces/rooms/service-yard.md#yard-volume 마당 안쪽 wall·wall-top을 limestone으로, floor를 paving으로 분리한다.
-->

기단·코핑·문틀·기둥·제단·분수의 고체 part와 경계석에는 `limestone`을 배정한다. 서비스 마당의 `surface.service-yard.wall`은 낮은 북·동쪽 둘레벽의 안쪽과 제실·북쪽 주랑 동단벽 및 보관실 북벽의 마당 쪽 면을 함께 가리키므로 이 면들을 석재로 읽는다. `surface.service-yard.wall-top`의 코핑도 석재이며 북·동 바깥면 `outer`는 회벽으로 남긴다. 기본색 `#c9c0ad`, 거칠기 0.86, 금속도 0, 불투명도 1이다. `stone.png`의 얕은 명암을 1m×1m로 반복하며 비트맵이 없으면 기본색을 유지한다. 돌의 실제 두께는 spaces와 models가 소유하고 재료는 줄눈 그림으로 가짜 블록을 만들지 않는다. 이미지 01의 포치 기둥·코핑과 02의 마당 둘레, 03의 수반 테를 같은 주광 아래 목재보다 차갑고 회벽과 구분되는지 본다.

## 절단 석재 바닥과 포장 {#paving}

<!--
@evidence principles/core/common.md#declared-basis settings/20-envelope.md#stone-floors의 작은 업무방 돌판은 관리실·기록실·보관실 세 floor ID에 paving-small을 주는 근거이고, 중정·주랑 등의 큰 판은 별도 paving 키로 정한다.
@evidence principles/core/common.md#scope-preservation 중정·주랑·현관·제실·봉헌실·마당의 floor와 세 업무방 floor에 한정해 paving/paving-small를 정하고 형상·배치·인접 재료의 소유를 건드리지 않는다.
@evidence principles/core/common.md#substantive-completion 중정·주랑·현관·제실·봉헌실·마당의 floor와 세 업무방 floor의 기본색·거칠기·비트맵 또는 무비트맵과 검토 실패 조건을 H2에서 닫는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 상속된 큰 돌판과 세 업무방 작은 돌판을 같은 paving.png의 2 m·1 m 반복으로 나누고 주랑과 업무방 문턱의 줄눈 주기를 비교 대상으로 정한다.
@evidence principles/design/materials.md#material-construction-appearance paving 2m와 paving-small 1m의 동일 석재 이미지를 다른 줄눈 간격으로 둔다
@evidence principles/design/materials.md#material-binding-interface 각 surface.*.floor와 site.paving에 기존 평면 UV0만 사용하고 바닥 높이는 받는다
@evidence principles/design/materials.md#material-verification-address 주랑 2m 표본과 세 업무방 문턱의 1m 표본에서 줄눈 네 칸 주기가 다른가
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 세 업무방은 이미 서로 다른 floor surface ID를 가지므로 paving-small의 1 m 반복은 재료 선택으로 닫힌다. 이 결속 때문에 바닥 높이·경계·UV0를 고치지 않는다.
@evidence settings/10-building.md#ground-access 하나의 지상층 바닥·문턱을 석재 포장으로 잇되 기존 계단·경사·높이는 바꾸지 않는다.
@evidence settings/10-building.md#use-profile 주랑과 세 업무방 바닥의 기존 통행 면을 받고 바닥 키는 보행 포락의 유효폭을 침범하는 geometry를 만들지 않는다.
@evidence settings/20-envelope.md#stone-floors 중정·주랑·현관·제실은 paving 2m, 관리실·기록실·보관실은 paving-small 1m를 쓴다.
@evidence settings/30-interiors.md#records 기록실 floor를 관리실과 같은 paving-small로 두고 주랑의 2m 줄눈과 구분한다.
@evidence spaces/rooms/courtyard.md#court-volume 중정 floor를 paving 2m로 받고 분수의 물/석재는 별도 model part에 남긴다.
@evidence spaces/rooms/records.md#records-volume 기록실 floor의 작은 돌판을 paving-small 1m로 두고 wall·ceiling은 별도 키다.
@evidence spaces/rooms/storage.md#storage-volume 보관실 floor의 작은 돌판을 paving-small 1m로 두고 벽·천장은 plaster·dark-wood에 남긴다.
@evidence spaces/site.md#site-paving site.paving은 paving, site.curb는 limestone, 남은 흙띠는 soil에 배정한다.
@evidence spaces/storey.md#threshold-support 관리실·기록실·보관실 문턱의 1m 포장과 주랑 2m 포장을 맞대어 관찰한다.
@evidence spaces/ownership.md#surface-map 관리실·기록실·보관실의 세 floor ID를 paving-small에, 주랑 floor를 paving에 배정해 주랑과 업무방의 줄눈 간격을 나눈다.
-->

중정·주랑·현관·제실·봉헌실·서비스 마당의 `floor`와 대지 `paving`에는 `paving`을 배정한다. 관리실·기록실·보관실 세 업무방의 `floor`에는 `paving-small`을 배정한다. 두 키의 기본색은 `#c9c0ad`, 거칠기 0.90, 금속도 0, 불투명도 1이다. 같은 `paving.png`의 한 주기는 각 축에 네 칸씩 있으며 `paving`의 2m×2m 반복은 0.5m 줄눈 간격, `paving-small`의 1m×1m 반복은 0.25m 간격을 낸다. 이미지 01·03·05의 길과 마당을 읽히게 하되 텍스처 줄눈은 바닥 높이·계단·경계석 형상을 바꾸지 않는다. 비트맵 실패 시 석재 기본색만 남는다. 2m 주랑 표본과 관리실·기록실·보관실의 각 1m 표본에 각각 네 칸씩 있는지, 세 방의 문턱과 주랑 포장 접점에서 대조한다. 어느 업무방이든 주랑과 줄눈 간격이 같거나 벽에 바닥 줄눈이 나타나면 실패다.

## 황토빛 회벽 {#plaster}

<!--
@evidence principles/core/common.md#declared-basis settings/20-envelope.md#walls의 황토 외피를 outer와 일반 실내 wall의 plaster 근거로 쓰되, spaces/facades/north.md#north-envelope의 석재 마당 경계는 이 키의 범위에서 뺀다.
@evidence principles/core/common.md#scope-preservation 외벽 outer·일반 실내 wall·박공과 필라스터 노출면 및 가려진 bearing에 한정해 plaster를 정하고 형상·배치·인접 재료의 소유를 건드리지 않는다.
@evidence principles/core/common.md#substantive-completion 외벽 outer·일반 실내 wall·박공과 필라스터 노출면 및 가려진 bearing의 기본색·거칠기·비트맵 또는 무비트맵과 검토 실패 조건을 H2에서 닫는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 외피의 황토색 요구를 outer·room wall·노출 박공의 plaster 키, 1.5 m 얼룩 반복, 코핑·목재 문과의 시각 분리 기준으로 내린다.
@evidence principles/design/materials.md#material-construction-appearance 1.5m 회벽 무늬와 거칠기 0.96은 벽 두께·개구부 void를 만들지 않는다
@evidence principles/design/materials.md#material-binding-interface outer·wall·bearing·joint를 받아 service-yard 안쪽 wall·wall-top은 limestone에 남긴다
@evidence principles/design/materials.md#material-verification-address 01 외벽과 03 중정·04 제실에서 문턱의 붉은 띠와 석재 코핑이 섞이지 않는가
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 서비스 마당 안쪽 wall과 wall-top은 이미 별도 surface ID이므로 일반 outer 회벽에서 제외한다. 회벽의 1.5 m 얼룩은 기존 UV0에 붙이며 벽·개구부 형상 수정은 요구하지 않는다.
@evidence settings/20-envelope.md#walls 외벽 outer와 일반 실내 wall에 황토 plaster를 두고 석재 기단·코핑 및 마당 안쪽 석벽은 분리한다.
@evidence spaces/openings.md#clerestories 채광구 void를 덮지 않는 plaster와 limestone reveal을 서로 다른 공간 면에서 받는다.
-->

외벽 `outer`와 일반 실내 `wall`, 박공·파라펫의 노출 면과 반환벽에는 `plaster`를 배정한다. 서비스 마당 안쪽 `wall`과 그 코핑은 석재 주소이므로 이 일반 규칙에서 제외한다. 기본색 `#cdb68e`, 거칠기 0.96, 금속도 0, 불투명도 1이며 `plaster.png`의 약한 얼룩을 1.5m×1.5m로 반복한다. 벽 `joint`와 지붕 `bearing`의 숨은 접면은 같은 회벽 기본색으로 닫되 표면을 새로 띄워 붙이지 않는다. 지면 가까운 마모는 약하게만 읽히며 별도 부식 geometry나 임의 사각 색 패치를 만들지 않는다. 비트맵이 없으면 크림색 평면으로 남는다. 이미지 01 외벽과 03 중정·04 제실의 동일 노출에서 코핑과 목재 문을 분리해 보고, 얼룩이 벽 실체나 창 void를 가리면 실패다.

## 주랑과 제실의 붉은 하부 띠 {#dado}

<!--
@evidence principles/core/common.md#declared-basis spaces/ownership.md#interior-dado가 분리한 주랑·제실의 Y=0~0.60 m 면 두 개만 dado를 받는다.
@evidence principles/core/common.md#scope-preservation surface.colonnade.dado와 surface.sanctuary.dado의 Y 0~0.60m에 한정해 dado를 정하고 형상·배치·인접 재료의 소유를 건드리지 않는다.
@evidence principles/core/common.md#substantive-completion surface.colonnade.dado와 surface.sanctuary.dado의 Y 0~0.60m의 기본색·거칠기·비트맵 또는 무비트맵과 검토 실패 조건을 H2에서 닫는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation spaces/ownership.md#interior-dado가 정한 두 벽의 Y=0.60m 선을 dado 결속, 표면 반응 및 검토 표본 03 주랑 및 04 제실 문턱에서 띠가 끊기고 다른 방으로 번지지 않는가로 구체화한다.
@evidence principles/design/materials.md#material-construction-appearance plaster.png를 쓰는 붉은 기본색은 도장층이며 별도 턱 geometry가 아니다
@evidence principles/design/materials.md#material-binding-interface 두 dado ID와 해당 벽의 기존 Y=0.60m 분할·문 void를 따른다
@evidence principles/design/materials.md#material-verification-address 03 주랑 및 04 제실 문턱에서 띠가 끊기고 다른 방으로 번지지 않는가
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 주랑·제실의 하부 띠는 별도 dado surface ID와 0.60 m 경계로 이미 방출된다. 붉은 재료를 입히기 위해 wall 면을 중복하거나 새 경계를 자를 필요가 없다.
@evidence settings/30-interiors.md#sanctuary 제실 벽 하부 Y=0~0.60m의 붉은 dado와 위쪽 plaster를 별개 마감으로 둔다.
@evidence spaces/ownership.md#interior-dado 주랑·제실의 Y=0~0.60m 벽 하부 면만 붉은 dado로 하고 문 void에서 멈춘다.
-->

`surface.colonnade.dado`와 `surface.sanctuary.dado`에만 `dado`를 배정한다. spaces가 정한 바닥 위 Y=0~0.60m의 면 분할을 소비하며 띠 높이·문 void·벽 두께를 다시 정하지 않는다. 기본색 `#866350`, 거칠기 0.94, 금속도 0, 불투명도 1이고 낮은 진폭의 `plaster.png`를 1.5m×1.5m로 쓴다. 이미지 03·04의 문턱과 모서리에서 두 방의 띠 윗선이 이어지고 봉헌실·기록실·외벽에는 번지지 않는지 본다. 색만으로 원래 wall 면 위에 띠를 중복 결속하면 실패다.

## 구조와 가구의 목재 {#timber}

<!--
@evidence principles/core/common.md#declared-basis settings/20-envelope.md#ceilings의 노출 목재 천장과 models/entablature.md#sanctuary-truss의 목재 부재가 dark-wood의 건물 입력이며, 가구·수목의 목재 part도 같은 키를 선택한다.
@evidence models/entablature.md#sanctuary-truss 트러스의 tie-beam·principal·king-post·strut은 dark-wood로 묶고 roof upper의 기와색과 분리한다.
@evidence principles/core/common.md#scope-preservation 트러스·서까래·문짝·가구·수목·손수레 목재 part와 천장·지붕 하부 face에 dark-wood를 정하고 형상·배치·인접 재료의 소유를 건드리지 않는다.
@evidence principles/core/common.md#substantive-completion 목재 기본색·거칠기·1m 비트맵 반복, 보·판재 장축 결 및 원통형 소품 횡결 proxy와 검토 실패 조건을 H2에서 닫는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 천장·트러스·문짝·가구의 목재 part를 dark-wood에 묶고 1 m timber.png 반복을 택한다. 수목·손수레의 둘레 U는 장축 결이 아닌 소품 proxy로 밝힌다.
@evidence principles/design/materials.md#material-construction-appearance dark-wood와 timber.png의 1m 결은 0.78 거칠기의 표면 표현이며 보 길이·문짝 두께는 host가 정한다
@evidence principles/design/materials.md#material-binding-interface 보·판재의 장축 U, 수목 줄기·가지와 손수레 원통 part의 둘레 U, 공간 ceiling·roof edge/soffit의 기존 UV0를 각각 소비한다.
@evidence principles/design/materials.md#material-verification-address 04 트러스와 05 선반·천장 가까이서 목재가 회벽·석재와 분리되는가
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 제실 트러스 보·판재의 장축 U와 공간 천장·처마의 월드 UV0를 대조했다. 수목 줄기·가지와 손수레 축·바퀴의 둘레 U가 횡결을 만드는 것은 소품 proxy로 H2에 명시했으며 이 마감 때문에 부모의 part나 면 분할을 바꾸지 않는다.
@evidence settings/20-envelope.md#ceilings 제실 트러스와 업무방 ceiling의 노출 목재를 dark-wood로 묶되 천장 보 형상은 모델/공간에 남긴다.
@evidence models/landscape.md#cypress 수관과 별개인 trunk 목재 part의 둘레 U에 dark-wood를 결속하고 횡결 proxy를 인정한다.
@evidence models/landscape.md#broad-tree trunk·branch 목재 part는 foliage crown과 분리하고 둘레 U의 횡결을 소품 proxy로 밝힌다.
@evidence models/portable.md#handcart 축·바퀴의 둘레 U에 dark-wood를 써 판재 deck의 장축 결 규칙과 구분한다.
-->

제실 트러스·서까래·보·문짝·선반·책상, 널판 천장과 처마 하부에는 `dark-wood`를 배정한다. 기본색 `#795339`, 거칠기 0.78, 금속도 0, 불투명도 1이다. `timber.png`는 1m×1m로 반복한다. 보·판재는 모델 H2의 장축 U에 긴 결을 맞추지만, 나무 줄기·가지와 손수레 축·바퀴는 원통 둘레 U를 따라 횡결이 보이는 소품 proxy다. 공간 천장·지붕 하부는 기존 월드 UV0를 사용하며 결 회전이 필요한 건물 면은 source에서 새로 발명하지 않고 공간 설계를 먼저 고친다. 비트맵이 없으면 중간 갈색이다. 이미지 04의 트러스와 05의 선반을 회벽에서 분리해 보고 석재 벤치·제단·봉헌 탁자에 목재가 붙으면 실패다.

## 노출 기와와 지붕 상면 {#roof-tile}

<!--
@evidence principles/core/common.md#declared-basis settings/20-envelope.md#roof-form의 적갈색 지붕과 models/cladding.md의 roof-tile·ridge-tile part가 roof-terracotta의 건물 면 근거다.
@evidence principles/core/common.md#scope-preservation tegula·imbrex·ridge와 다섯 roof upper face에 한정해 roof-terracotta를 정하고 형상·배치·인접 재료의 소유를 건드리지 않는다.
@evidence principles/core/common.md#substantive-completion tegula·imbrex·ridge와 다섯 roof upper face의 기본색·거칠기·비트맵 또는 무비트맵과 검토 실패 조건을 H2에서 닫는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 20-envelope.md#roof-form과 models/cladding.md#roof-tile·#ridge-tile의 실물 기와 면을 roof-terracotta 결속, 표면 반응 및 검토 표본 01·03 처마에서 낱개 기와와 바탕의 같은 점토색이 직교 격자 없이 읽히는가로 구체화한다.
@evidence principles/design/materials.md#material-construction-appearance roof-terracotta 단색은 별도 기와 prototype과 바탕 면을 구별하며 격자 무늬를 발명하지 않는다
@evidence principles/design/materials.md#material-binding-interface 세 기와 part와 roof-*.upper의 UV0를 받고 edge·soffit은 목재에 남긴다
@evidence principles/design/materials.md#material-verification-address 01·03 처마에서 낱개 기와와 바탕의 같은 점토색이 직교 격자 없이 읽히는가
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work roof upper와 tegula·imbrex·ridge는 이미 서로 다른 공간 면·모델 part다. 이 H2는 동일 점토색으로 결속하며 기와 홈이나 처마 형상을 재설계하지 않는다.
@evidence settings/20-envelope.md#roof-form 모든 roof upper와 tegula·imbrex·ridge를 점토색으로 묶고 edge·soffit은 목재로 둔다.
@evidence spaces/roofs/colonnade.md#north-canopy 북쪽 주랑 지붕 upper의 점토색과 edge·soffit의 목재색을 따로 둔다.
@evidence spaces/roofs/colonnade.md#south-canopy 남쪽 주랑 지붕 upper의 점토색과 edge·soffit의 목재색을 따로 둔다.
@evidence spaces/roofs/east.md#east-roof 동쪽 날개 roof-east.upper를 roof-terracotta로 두고 처마 하부는 dark-wood에 남긴다.
@evidence spaces/roofs/porch.md#porch-roof 현관 roof-porch.upper는 점토색, edge·soffit는 목재색으로 나눈다.
@evidence spaces/roofs/sanctuary.md#sanctuary-roof 제실 roof-sanctuary.upper 점토색과 edge·soffit 목재색을 나눈다.
@evidence spaces/roofs/west.md#west-roof 서쪽 날개 roof-west.upper 점토색과 edge·soffit 목재색을 나눈다.
-->

`tegula`·`imbrex`·`ridge`와 지붕 `upper`에는 `roof-terracotta`를 배정한다. 기본색 `#874b38`, 거칠기 0.84, 금속도 0, 불투명도 1이다. 지붕 상면은 배치 전에도 흙빛 붉은 바탕이지만 최종 줄·겹침·처마 끝 빈 반원은 독립 기와 모델이 맡는다. 기존 `tile.png`의 직교 줄눈 격자는 개별 기와 UV에 결합하지 않는다. 이 재료는 현재 단색으로 설계하고, 후속 비트맵은 실제 점토 면의 약한 얼룩만 담은 반복 자산을 별도로 만들 때 채택한다. `tile.png`는 보존한다. 이미지 01 조감과 03 처마 끝에서 기와가 크림 벽과 분리되고 그려진 격자가 실제 이음과 경쟁하지 않는지 본다.

## 청동 철물과 등잔 {#metal}

<!--
@evidence principles/core/common.md#declared-basis settings/20-envelope.md#openings의 목재 문짝과 models/openings.md#double-door-leaf의 분리 철물이 문 금속 part만 dark-metal에 배정하는 근거다.
@evidence models/openings.md#double-door-leaf plate·pin·ring·hinge만 금속 키를 받고 frame·panel은 dark-wood를 유지한다.
@evidence principles/core/common.md#scope-preservation 문 철물·궤 hasp/strap·등잔 및 필기구 금속 part에 한정해 dark-metal를 정하고 형상·배치·인접 재료의 소유를 건드리지 않는다.
@evidence principles/core/common.md#substantive-completion 문 철물·궤 hasp/strap·등잔 및 필기구 금속 part의 기본색·거칠기·비트맵 또는 무비트맵과 검토 실패 조건을 H2에서 닫는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 문짝의 plate·pin·ring·hinge와 궤·등잔의 금속 part에 무비트맵 dark-metal, 금속도 0.82를 정하고 03·04·05에서 목재와의 분리를 본다.
@evidence principles/design/materials.md#material-construction-appearance dark-metal의 0.82 금속도와 0.39 거칠기는 목재 면을 청동으로 바꾸지 않는다
@evidence principles/design/materials.md#material-binding-interface plate·pin·ring·hinge 등 분리된 model part만 받고 별도 비트맵을 요구하지 않는다
@evidence principles/design/materials.md#material-verification-address 03 문과 04·05 근접 장면에서 금속 철물이 어두운 목재와 구별되는가
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 문 철물은 문짝의 plate·pin·ring·hinge로 이미 분리되어 있다. 이 H2는 그 part의 표면 응답만 정하며 문짝 mesh나 경첩 축 변경을 요구하지 않는다.
@evidence obligations/design/materials.md#material-response dark-metal의 금속도 0.82·거칠기 0.39를 목재·석재와 구분하고 H2의 다른 재료도 자기 기본색·거칠기·불투명도를 둔다.
@evidence settings/20-envelope.md#openings 문짝의 plate·pin·ring·hinge는 dark-metal에, 목재 panel은 dark-wood에 남겨 철물을 분리한다.
-->

문짝 철물, 궤의 hasp·strap, 등잔·향로·필기 도구의 금속 part에는 `dark-metal`을 배정한다. 기본색 `#574b39`, 거칠기 0.39, 금속도 0.82, 불투명도 1이며 별도 비트맵은 요구하지 않는다. 얇은 고리와 못은 반사로 구별하고 목재 면 전체를 청동으로 바꾸지 않는다. 이미지 03 열린 문과 04·05 근접 시점에서 목재·석재와 구별되되 거울처럼 번쩍이지 않는지 본다.

## 붉은 도기 {#ceramic}

<!--
@evidence principles/core/common.md#declared-basis settings/35-objects.md#vessels와 models/wares.md의 storage-jar·carry-jar body가 도기 키의 입력이고 offering-bowl의 선택 가능한 금속/도기 변형은 별도 결속 결정으로 남긴다.
@evidence settings/35-objects.md#vessels 저장 항아리와 운반 항아리의 붉은 도기 몸체를 terracotta로 받고 봉헌 그릇의 현재 금속 키와 구별한다.
@evidence models/wares.md#storage-jar 저장 항아리 body의 도기색을 terracotta로 정하고 실루엣과 굽은 모델에 남긴다.
@evidence models/wares.md#carry-jar 운반 항아리 body와 handle을 terracotta로 묶고 손잡이 접합을 재료로 대체하지 않는다.
@evidence principles/core/common.md#scope-preservation 항아리·물동이·작은 용기·화분 pot의 도기 몸체에 한정해 terracotta를 정하고 형상·배치·인접 재료의 소유를 건드리지 않는다.
@evidence principles/core/common.md#substantive-completion 항아리·물동이·작은 용기·화분 pot의 도기 몸체의 기본색·거칠기·비트맵 또는 무비트맵과 검토 실패 조건을 H2에서 닫는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 항아리·물동이·작은 용기·화분 pot의 body를 terracotta에 묶고 0.22 m 반복과 02·05 저장 구역의 목재 대비를 정한다.
@evidence principles/design/materials.md#material-construction-appearance terracotta의 0.22m 반복 없는 점토 기본색은 실제 두께와 굽을 대신하지 않는다
@evidence principles/design/materials.md#material-binding-interface body·handle·pot에만 붙고 planter.soil과 offering-bowl.bowl은 다른 키다
@evidence principles/design/materials.md#material-verification-address 02·05 저장 용기에서 목재 가구와 붉은 도기가 분리되는가
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 도기 용기의 body·handle·pot와 화분 흙은 이미 다른 part다. 붉은 도기 색을 붙이기 위해 용기 윤곽이나 굽을 새로 정할 필요가 없다.
-->

항아리·물동이·작은 용기·화분의 몸체와 손잡이에 `terracotta`를 배정한다. 기본색 `#9a684b`, 거칠기 0.72, 금속도 0, 불투명도 1이고 반복 길이는 0.22m다. 별도 비트맵은 없으며 윤곽과 구멍은 모델 part가 담당한다. 화분의 `soil`과 봉헌 그릇의 `bowl`은 이 키로 바꾸지 않는다. 이미지 02·05의 보관 용기를 선반 목재와 구별하는 대략의 재질 읽힘이 관찰 기준이다.

## 마른 바구니 섬유 {#wicker}

<!--
@evidence principles/core/common.md#declared-basis settings/35-objects.md#baskets와 models/wares.md#basket의 wall·rim·floor 세 part가 이 섬유색 결속의 입력이다.
@evidence settings/35-objects.md#baskets 운반 바구니의 마른 섬유색은 wicker 키로 받되 짜임 구멍은 proxy 원형 범위 밖에 둔다.
@evidence models/wares.md#basket wall·rim·floor part 세 개를 동일 wicker에 배정한다.
@evidence principles/core/common.md#scope-preservation 바구니 wall·rim·floor에 한정해 wicker를 정하고 형상·배치·인접 재료의 소유를 건드리지 않는다.
@evidence principles/core/common.md#substantive-completion 바구니 wall·rim·floor의 기본색·거칠기·비트맵 또는 무비트맵과 검토 실패 조건을 H2에서 닫는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 바구니의 세 proxy part를 무비트맵 wicker·거칠기 0.96에 배정하고 02 보관 구역에서 목재 선반과 색을 구별한다.
@evidence principles/design/materials.md#material-construction-appearance wicker 색과 0.96 거칠기는 proxy 외곽에 짜임 구멍이 있다는 약속이 아니다
@evidence principles/design/materials.md#material-binding-interface 바구니 세 part의 기존 UV0를 쓰되 교차 짜임 비트맵은 지정하지 않는다
@evidence principles/design/materials.md#material-verification-address 02 보관 구역에서 바구니가 나무 선반과 다른 마른 섬유색으로 읽히는가
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work basket의 wall·rim·floor proxy는 이미 원형이 방출한다. 이 색은 짜임 구멍의 추가 geometry를 약속하지 않아 모델 수리가 필요하지 않다.
-->

바구니 `wall`·`rim`·`floor`에는 `wicker`를 배정한다. 기본색 `#a58658`, 거칠기 0.96, 금속도 0, 불투명도 1이고 반복 길이는 0.11m다. 별도 교차 짜임 비트맵은 사용하지 않는다. 벽의 실제 띠와 생략된 세로 살은 모델의 proxy 한계이며 재료가 빠진 살을 무늬로 채워 구현됐다고 주장하지 않는다. 이미지 02의 저장 구역과 서비스 마당에서 도기·목재와 다른 마른 섬유색이면 충분하다.

## 두루마리와 필기면 {#parchment}

<!--
@evidence principles/core/common.md#declared-basis settings/35-objects.md#scrolls의 두루마리와 models/wares.md#scroll의 sheet part를 받으며 필기판 writing-face에도 같은 밝은 표면 키를 선택한다.
@evidence settings/35-objects.md#scrolls 두루마리의 밝은 종이 면을 parchment로, 묶는 끈은 rope-fibre로 분리한다.
@evidence models/wares.md#scroll sheet 표면의 밝은 키만 정하고 말린 양끝과 tie의 형상은 원형에 남긴다.
@evidence principles/core/common.md#scope-preservation 두루마리 sheet 변형과 필기판 writing-face에 한정해 parchment를 정하고 형상·배치·인접 재료의 소유를 건드리지 않는다.
@evidence principles/core/common.md#substantive-completion 두루마리 sheet 변형과 필기판 writing-face의 기본색·거칠기·비트맵 또는 무비트맵과 검토 실패 조건을 H2에서 닫는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 두루마리 sheet와 필기판 writing-face를 parchment로 묶고 0.16 m 반복과 무문자 밝은 바탕을 정해 05 책상에서 목재 frame과 구분한다.
@evidence principles/design/materials.md#material-construction-appearance parchment 0.16m 반복과 밝은 바탕색은 실제 글자 내용을 생산하지 않는다
@evidence principles/design/materials.md#material-binding-interface sheet·sheet-1/2/3·writing-face만 받고 말림 형상과 묶음은 models에 남긴다
@evidence principles/design/materials.md#material-verification-address 05 책상에서 필기면이 나무 frame과 분리되고 가짜 글자가 없는가
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 두루마리의 말림·묶음과 필기판 frame은 이미 다른 model part다. 밝은 sheet 결속은 글자나 새 말림 형상을 요구하지 않는다.
-->

두루마리 `sheet` 변형과 서판 `writing-face`에는 `parchment`를 배정한다. 기본색 `#c6aa77`, 거칠기 0.92, 금속도 0, 불투명도 1, 반복 길이는 0.16m이며 필기 문자 비트맵은 만들지 않는다. 말림·겹침·묶음은 모델과 instances가 소유하고 재료는 밝은 기록면의 명암만 낸다. 이미지 05의 선반·책상에서 어두운 목재와 구별되는지 보고 글자 내용을 재료가 발명하면 실패다.

## 접힌 직물과 좌구 {#textile}

<!--
@evidence principles/core/common.md#declared-basis settings/35-objects.md#textile의 접힌 천과 models/ritual.md#floor-cushion의 base·pad·fold를 직물 키의 입력으로 받는다.
@evidence settings/35-objects.md#textile 접힌 직물의 cloth를 linen으로 받아 목재 가구색과 나눈다.
@evidence settings/35-objects.md#floor-cushion 제실 낮은 좌구의 분리된 덮개 part를 linen으로 묶고 바닥 석재와 구별한다.
@evidence models/ritual.md#floor-cushion base·pad·fold의 직물색과 0.25 m textile.png 반복을 정하고 좌구 높이는 모델에 남긴다.
@evidence principles/core/common.md#scope-preservation cloth 및 좌구 base·pad·fold에 한정해 linen를 정하고 형상·배치·인접 재료의 소유를 건드리지 않는다.
@evidence principles/core/common.md#substantive-completion cloth 및 좌구 base·pad·fold의 기본색·거칠기·비트맵 또는 무비트맵과 검토 실패 조건을 H2에서 닫는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation cloth와 좌구의 base·pad·fold에 linen 및 0.25 m textile.png 반복을 주고 04·05에서 가구·회벽 대비를 관찰한다.
@evidence principles/design/materials.md#material-construction-appearance linen에 textile.png 0.25m 반복을 주되 접힘 부피는 기존 모델이다
@evidence principles/design/materials.md#material-binding-interface 직물 part UV0에만 붙고 인접 목재·석재 seat를 재질 변경하지 않는다
@evidence principles/design/materials.md#material-verification-address 04·05에서 접힌 직물과 좌구가 회벽·가구 면에 흡수되지 않는가
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work textile의 cloth와 좌구의 base·pad·fold는 이미 분리된 mesh part다. 0.25 m 무늬는 그 UV0를 소비하며 접힘 부피를 재설계하지 않는다.
-->

`cloth`와 좌구의 `base`·`pad`·`fold`에는 `linen`을 배정한다. 기본색 `#8a7564`, 거칠기 0.98, 금속도 0, 불투명도 1이다. `textile.png`의 가로·세로 직조 흔적을 0.25m×0.25m로 반복하며 접힘 형상은 모델이 담당한다. 비트맵이 없으면 같은 색이다. 이미지 04·05에서 돌바닥·목재와 구분하고 직조 무늬가 큰 격자판처럼 보이면 실패다.

## 묶음 끈과 밧줄 {#rope-fibre}

<!--
@evidence principles/core/common.md#declared-basis settings/35-objects.md#rope-coil과 models/portable.md#rope-coil의 rope·tie part를 이 섬유 키의 입력으로 받는다.
@evidence settings/35-objects.md#rope-coil 느슨한 밧줄 뭉치의 rope·tie를 동일 rope-fibre 키로 묶는다.
@evidence models/portable.md#rope-coil 감긴 rope와 묶음 tie에 무비트맵 섬유색을 주고 감김 중심선은 모델에 남긴다.
@evidence principles/core/common.md#scope-preservation scroll.tie 및 rope-coil의 rope·tie에 한정해 rope-fibre를 정하고 형상·배치·인접 재료의 소유를 건드리지 않는다.
@evidence principles/core/common.md#substantive-completion scroll.tie 및 rope-coil의 rope·tie의 기본색·거칠기·비트맵 또는 무비트맵과 검토 실패 조건을 H2에서 닫는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation rope와 tie에 무비트맵 rope-fibre·거칠기 0.96을 배정하고 05 기록면 옆에서 필기면과 목재보다 어두운 섬유로 읽히는지 본다.
@evidence principles/design/materials.md#material-construction-appearance rope-fibre 0.10m 길이와 0.96 거칠기는 별도 작은 섬유 geometry를 늘리지 않는다
@evidence principles/design/materials.md#material-binding-interface 묶음 끈과 밧줄 part의 UV0를 받고 고리·감김 경로는 models에 남긴다
@evidence principles/design/materials.md#material-verification-address 05 기록면 옆에서 밧줄이 필기면 및 목재와 분리되는가
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work rope·tie의 감김 경로와 두께는 portable 원형에 있고 이 H2는 색과 거칠기만 정한다. 결속을 위해 새 섬유 mesh를 요구하지 않는다.
-->

두루마리 `tie`와 밧줄의 `rope`·`tie`에는 `rope-fibre`를 배정한다. 기본색 `#96805c`, 거칠기 0.96, 금속도 0, 불투명도 1, 반복 길이는 0.10m다. 별도 비트맵은 없고 고리의 빈 중심과 묶음 위치는 모델이 소유한다. 이미지 05에서 기록면의 밝은 황갈색과 끈의 마른 섬유색을 구별하되 작은 소품의 개별 가닥은 요구하지 않는다.

## 전경 흙과 화분 속흙 {#earth}

<!--
@evidence principles/core/common.md#declared-basis settings/40-environment.md#site와 spaces/site.md#site-grade의 전경 흙 면을 받으며 화분 soil과 향로 ash·incense에도 흙빛 키를 고른다.
@evidence principles/core/common.md#scope-preservation site earth·ground와 화분 soil 및 향로 ash·incense에 한정해 soil를 정하고 형상·배치·인접 재료의 소유를 건드리지 않는다.
@evidence principles/core/common.md#substantive-completion site earth·ground와 화분 soil 및 향로 ash·incense의 기본색·거칠기·비트맵 또는 무비트맵과 검토 실패 조건을 H2에서 닫는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation site.earth·ground에는 0.25 m earth.png 반복을, 화분 soil과 향로 ash·incense에는 같은 키의 기본색을 주고 01 포장 경계에서 분리해 본다.
@evidence principles/design/materials.md#material-construction-appearance soil 기본색과 전경 earth.png 0.25m 반복은 대지 경사나 화분 깊이를 바꾸지 않는다
@evidence principles/design/materials.md#material-binding-interface surface.site.earth·ground와 soil/ash part를 구분하고 먼 ridge는 다른 키다
@evidence principles/design/materials.md#material-verification-address 01 포장 경계의 마른 흙과 03 분수 및 화분 속흙이 혼동되지 않는가
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work 대지 경사와 화분 깊이는 site·model에 있고 전경 흙과 먼 능선도 별도 surface ID다. 흙빛 반복은 기존 UV0에 붙으므로 높이 수리를 요구하지 않는다.
@evidence settings/40-environment.md#site 대지 earth·ground는 soil, 포장 길은 paving에 남겨 흙띠와 석재길을 구분한다.
@evidence spaces/site.md#site-grade site earth·ground의 기존 경사 UV0를 soil 결속 입력으로 받으며 높이를 바꾸지 않는다.
-->

대지 `earth`·`ground`, 먼 기슭 `ground`, 화분 `soil`과 향로의 `ash`·`incense`에는 `soil`을 배정한다. 기본색 `#8c795c`, 거칠기 1, 금속도 0, 불투명도 1이다. 전경 지면은 `earth.png`를 0.25m×0.25m로 반복하고 작은 그릇 속 흙은 기본색만으로도 된다. 높낮이와 포장 경계는 spaces가 소유한다. 이미지 01에서 흙길·포장·외벽이 다른 띠이고 분수 안에 흙색이 번지지 않는지 본다.

## 낮은 먼 능선 {#distant-ridge}

<!--
@evidence principles/core/common.md#declared-basis settings/40-environment.md#distant-terrain의 낮은 먼 능선과 spaces/site.md#distant-ridge의 ridge surface를 이 단색 키의 입력으로 받는다.
@evidence principles/core/common.md#scope-preservation surface.site-distant.ridge에 한정해 distant-earth를 정하고 형상·배치·인접 재료의 소유를 건드리지 않는다.
@evidence principles/core/common.md#substantive-completion surface.site-distant.ridge의 기본색·거칠기·비트맵 또는 무비트맵과 검토 실패 조건을 H2에서 닫는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 40-environment.md#distant-terrain과 spaces/site.md#distant-ridge의 별도 ridge 면을 distant-earth 결속, 표면 반응 및 검토 표본 01 원경에서 능선이 박공보다 강한 대비나 사진 질감이 되는가로 구체화한다.
@evidence principles/design/materials.md#material-construction-appearance distant-earth의 저채도 무광 단색은 먼 지형의 질감을 근경처럼 끌어올리지 않는다
@evidence principles/design/materials.md#material-binding-interface ridge 한 surface만 사용하고 site-distant.ground는 soil에 남긴다
@evidence principles/design/materials.md#material-verification-address 01 원경에서 능선이 박공보다 강한 대비나 사진 질감이 되는가
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work site-distant.ridge는 ground와 다른 ID로 이미 방출된다. 저채도 무광 단색은 능선 높이나 실루엣 수정을 요구하지 않는다.
@evidence settings/40-environment.md#distant-terrain 낮은 먼 능선 surface.site-distant.ridge를 저채도 distant-earth로 두고 전경 흙과 다른 깊이로 읽는다.
@evidence spaces/site.md#distant-ridge surface.site-distant.ridge는 distant-earth이고 같은 원경의 ground는 soil로 분리한다.
-->

`surface.site-distant.ridge`에는 `distant-earth`를 배정한다. 기본색 `#827e69`, 거칠기 1, 금속도 0, 불투명도 1이며 비트맵은 쓰지 않는다. 저채도 갈회색은 배경을 물러나게 할 저작자 선택이고 수평선 물이나 특정 지역 지질을 뜻하지 않는다. 이미지 01 외관 시점에서 능선이 박공보다 강한 대비를 갖거나 사진 배경처럼 평면으로 보이면 실패다.

## 나무 수관과 풀 {#foliage}

<!--
@evidence principles/core/common.md#declared-basis settings/40-environment.md#vegetation과 models/landscape.md#cypress의 crown을 받으며 broad-tree crown과 grass-tuft blade도 같은 잎색 키를 선택한다.
@evidence principles/core/common.md#scope-preservation cypress·broad-tree crown과 grass-tuft blade에 한정해 foliage를 정하고 형상·배치·인접 재료의 소유를 건드리지 않는다.
@evidence principles/core/common.md#substantive-completion cypress·broad-tree crown과 grass-tuft blade의 기본색·거칠기·비트맵 또는 무비트맵과 검토 실패 조건을 H2에서 닫는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 40-environment.md#vegetation과 models/landscape.md#cypress의 crown을 foliage 결속, 표면 반응 및 검토 표본 01·03 수직 수관과 낮은 풀의 깊이 관계가 회벽과 섞이지 않는가로 구체화한다.
@evidence principles/design/materials.md#material-construction-appearance foliage의 무광 녹색은 잎사귀 사진이나 추가 가지 geometry가 아니다
@evidence principles/design/materials.md#material-binding-interface crown·blade part만 받고 trunk·branch 목재 part는 분리한다
@evidence principles/design/materials.md#material-verification-address 01·03 수직 수관과 낮은 풀의 깊이 관계가 회벽과 섞이지 않는가
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work crown·blade와 trunk·branch는 이미 다른 part다. 잎색 키는 수관 실루엣이나 나무 수량을 정하지 않아 model·instance 변경을 요구하지 않는다.
@evidence settings/40-environment.md#vegetation 수관 crown과 풀 blade는 무광 foliage로 두고 trunk·branch의 목재색은 분리한다.
-->

수관 `crown`과 풀 `blade`에는 `foliage`를 배정한다. 기본색 `#526448`, 거칠기 1, 금속도 0, 불투명도 1, 반복 길이는 0.28m다. 잎 덩어리의 간격과 실루엣은 모델·instances가 맡고 재료는 잎 사진을 약속하지 않는다. 이미지 01·03에서 짙은 수직 수관과 주변 회녹색 덩어리가 빛·배치 차이로 읽히는지 보고 회벽처럼 보이면 실패다.

## 분수의 물 {#water}

<!--
@evidence settings/30-interiors.md#services 고정 수위 분수의 물 표면만 water 키로 표시하고 숨은 급배수관이나 펌프실의 물성을 새로 약속하지 않는다.
@evidence principles/core/common.md#declared-basis settings/30-interiors.md#fountain의 고정 분수와 models/fixtures.md#fountain의 water·ripple·jet part를 물 키의 입력으로 받는다.
@evidence principles/core/common.md#scope-preservation fountain water·ripple·jet에 한정해 water를 정하고 형상·배치·인접 재료의 소유를 건드리지 않는다.
@evidence principles/core/common.md#substantive-completion fountain water·ripple·jet의 기본색·거칠기·비트맵 또는 무비트맵과 검토 실패 조건을 H2에서 닫는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 물 part 세 가지에 청회색 water·거칠기 0.20을 정하고 수반의 석재 rim과 경계가 보이는지를 03 중정 장면의 관찰점으로 둔다.
@evidence principles/design/materials.md#material-construction-appearance water 색과 0.20 거칠기는 정적인 원형 물 표면이며 순환 시뮬레이션이 아니다
@evidence principles/design/materials.md#material-binding-interface water/ripple/jet part만 받고 basin-inner·rim은 limestone에 남긴다
@evidence principles/design/materials.md#material-verification-address 03 중정에서 수반 석재와 물 경계가 사라지지 않는가
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work fountain의 rim·basin-inner와 water·ripple·jet가 이미 분리된 part다. 청회색과 거칠기를 입히기 위해 수위나 분수 배관을 새로 설계하지 않는다.
@evidence settings/30-interiors.md#fountain 중정 분수의 water·ripple·jet를 물 키에, rim·basin-inner를 limestone에 남긴다.
-->

분수 `water`·`ripple`·`jet`에는 `water`를 배정한다. 기본색 `#668b91`, 거칠기 0.20, 금속도 0, 불투명도 1, 반복 길이는 0.50m다. 굴절·시간 변화는 이 library의 고정 모델이 보증하지 않는다. 석재 `basin-inner`와 `rim`을 덮는 수면·물줄기 형상은 모델이 소유하며 재료는 낮은 거칠기와 청회색으로 구별한다. 이미지 03 중정에서 석재 수반과 물의 경계가 사라지면 실패다.

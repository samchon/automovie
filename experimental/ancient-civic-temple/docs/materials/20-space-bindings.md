# 공간 표면의 재료 결속

## 공간 표면 결속 {#space-binding-map}

<!--
@evidence principles/core/common.md#declared-basis spaces/ownership의 완결 surface ID와 site.paving 및 roofs/assembly의 roof face를 결속 표의 입력으로 삼는다.
@evidence principles/core/common.md#scope-preservation 방출된 공간 면마다 하나의 재료 키를 지정하고 wall·roof·floor geometry 및 model part를 추가하지 않는다.
@evidence principles/core/common.md#substantive-completion 표의 96개 surface ID를 빠짐과 중복 없이 키에 배정하고 숨은 bearing·joint·concealed의 fallback도 명시한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 공간의 surface.* ID를 limestone·paving·plaster·dark-wood 등 구체 키로 내려 건물의 같은 물리벽 양면을 구별한다.
@evidence principles/design/materials.md#material-construction-appearance 공간이 만든 구조 면을 받아 표에서 마감 키만 배정하고 물성·반복 길이는 팔레트와 모델 결속 표에 남긴다.
@evidence principles/design/materials.md#material-binding-interface surface.<owner>.<face> 문자열과 월드 미터 UV0를 입력으로 쓰며 텍스처 대상 UV0 누락은 오류다.
@evidence principles/design/materials.md#material-verification-address 01 포치·외벽·기와, 03 중정 바닥·띠, 04 천장, 05 기록실 바닥을 대조하고 바닥에 plaster가 붙으면 실패다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work spaces/ownership.md#surface-map의 96개 surface ID와 site.paving·roof upper/edge/soffit의 기존 UV0를 표에 대조했으며 마감 배정으로 새 공간 면을 요구하지 않는다.
@evidence obligations/core/common.md#layer-boundary 공간의 surface ID는 읽기만 하고 재료 키만 정하며 모델 part 결속은 별도 문서에 둔다.
@evidence obligations/design/materials.md#material-surface-assignment 방출된 공간 surface ID마다 마감 키 하나를 배정하고 가려진 bearing·joint·concealed의 fallback도 정한다.
@evidence settings/00-delivery.md#build-scope 공간이 만든 wall·floor·roof 면에 마감 키만 배정하고 형상·배치·렌더 구현은 가져오지 않는다.
@evidence settings/10-building.md#fixed-graph 중정·주랑·제실과 동측 세 업무방을 서로 다른 surface owner로 받아 floor·wall·ceiling 키를 배정한다.
@evidence settings/30-interiors.md#offering-room 봉헌실 floor·wall·ceiling을 각각 paving·plaster·dark-wood에 배정한다.
@evidence settings/30-interiors.md#administration 관리실 floor·wall·ceiling을 paving-small·plaster·dark-wood의 별도 surface ID에 배정한다.
@evidence settings/30-interiors.md#storage 보관실 floor·wall·ceiling을 paving-small·plaster·dark-wood의 별도 surface ID에 배정한다.
@evidence spaces/building.md#containment 주랑·중정·제실·동측 방의 서로 다른 owner를 floor·wall·ceiling surface ID의 키 분리에 쓴다.
@evidenceExclude spaces/building.md#plan-datums 방 경계의 X/Z 치수와 좌표 기준은 spaces가 면을 방출할 때 소비하며, 이 재료 population은 완성된 surface ID와 UV0 미터 좌표만 받아 마감 키를 선택한다.
@evidence spaces/facades/east.md#east-envelope facade-east의 outer/bearing/joint는 plaster, plinth/coping/footing/reveal은 limestone으로 나눈다.
@evidence spaces/facades/south.md#south-envelope facade-south outer/parapet-back의 회벽과 coping/plinth의 석재를 분리한다.
@evidence spaces/facades/west.md#west-envelope facade-west outer/sanctuary-flank 회벽과 plinth/coping 석재를 분리한다.
@evidence spaces/ownership.md#surface-map 완결 surface ID 96개를 결속표에서 하나씩 키에 배정한다.
@evidence spaces/rooms/administration.md#office-volume 관리실 floor를 paving-small, wall을 plaster, ceiling을 dark-wood로 배정한다.
@evidence spaces/rooms/colonnade.md#ring-volume 주랑 floor paving, dado 붉은 하부, wall plaster, ceiling dark-wood를 분리한다.
@evidence spaces/rooms/entrance.md#entrance-volume 현관 floor는 paving, return·pediment-back은 plaster에 배정한다.
@evidence spaces/rooms/offering.md#offering-volume 봉헌실 floor paving, wall plaster, ceiling dark-wood를 분리한다.
@evidence spaces/rooms/sanctuary.md#sanctuary-volume 제실 floor paving, wall plaster, dado 붉은 띠, ceiling dark-wood를 별도 ID에 준다.
@evidence spaces/storey.md#ground-storey 하나의 지상층에 있는 모든 실내 floor ID에 키를 주고 새 층이나 바닥 높이를 만들지 않는다.
-->

[완결 면 소유](../spaces/ownership.md#surface-map)와 [대지 포장](../spaces/site.md#site-paving), [지붕 합성](../spaces/roofs/assembly.md#roof-junctions)이 방출하는 `surface.<owner>.<face>`를 아래 한 키에 각각 배정한다. 이 표는 공간 face의 마감 소유만 정하고 wall·roof·floor geometry나 model part를 만들지 않는다. 키의 물성은 [팔레트](00-surface-palette.md), 반복 길이·기본색은 [결속 키](10-model-bindings.md#binding-map)에서 읽는다. 표에 없는 방출 면, 한 면의 중복 배정, 존재하지 않는 면에 대한 배정은 실패다. 숨은 bearing·joint는 같은 벽의 회벽 기본색, 숨은 roof concealed는 인접 목재 하부의 기본색으로 닫으며 별도 보이는 장식이라고 주장하지 않는다.

| 방출 공간 표면 ID | 결속 키 |
| --- | --- |
| `surface.colonnade.dado` | `dado` |
| `surface.sanctuary.dado` | `dado` |
| `surface.administration.ceiling`, `surface.administration.ceiling-back` | `dark-wood` |
| `surface.colonnade.ceiling` | `dark-wood` |
| `surface.offering.ceiling`, `surface.offering.ceiling-back` | `dark-wood` |
| `surface.records.ceiling`, `surface.records.ceiling-back` | `dark-wood` |
| `surface.roof-colonnade.concealed`, `surface.roof-colonnade.edge`, `surface.roof-colonnade.soffit` | `dark-wood` |
| `surface.roof-east.concealed`, `surface.roof-east.edge`, `surface.roof-east.soffit` | `dark-wood` |
| `surface.roof-porch.edge`, `surface.roof-porch.soffit` | `dark-wood` |
| `surface.roof-sanctuary.concealed`, `surface.roof-sanctuary.edge`, `surface.roof-sanctuary.soffit` | `dark-wood` |
| `surface.roof-west.concealed`, `surface.roof-west.edge`, `surface.roof-west.soffit` | `dark-wood` |
| `surface.sanctuary.ceiling` | `dark-wood` |
| `surface.storage.ceiling`, `surface.storage.ceiling-back` | `dark-wood` |
| `surface.site-distant.ridge` | `distant-earth` |
| `surface.boundaries.footing`, `surface.boundaries.reveal` | `limestone` |
| `surface.facade-east.coping`, `surface.facade-east.footing`, `surface.facade-east.plinth`, `surface.facade-east.reveal` | `limestone` |
| `surface.facade-north.coping`, `surface.facade-north.footing`, `surface.facade-north.plinth`, `surface.facade-north.reveal` | `limestone` |
| `surface.facade-south.coping`, `surface.facade-south.footing`, `surface.facade-south.plinth`, `surface.facade-south.reveal` | `limestone` |
| `surface.facade-west.coping`, `surface.facade-west.footing`, `surface.facade-west.plinth` | `limestone` |
| `surface.site.curb` | `limestone` |
| `surface.administration.floor` | `paving-small` |
| `surface.colonnade.floor` | `paving` |
| `surface.courtyard.floor` | `paving` |
| `surface.entrance.floor` | `paving` |
| `surface.offering.floor` | `paving` |
| `surface.records.floor` | `paving-small` |
| `surface.sanctuary.floor` | `paving` |
| `surface.service-yard.floor` | `paving` |
| `surface.site.paving` | `paving` |
| `surface.storage.floor` | `paving-small` |
| `surface.administration.wall` | `plaster` |
| `surface.boundaries.bearing`, `surface.boundaries.joint` | `plaster` |
| `surface.colonnade.sanctuary-gable`, `surface.colonnade.wall` | `plaster` |
| `surface.entrance.pediment-back`, `surface.entrance.return` | `plaster` |
| `surface.facade-east.bearing`, `surface.facade-east.joint`, `surface.facade-east.outer` | `plaster` |
| `surface.facade-north.bearing`, `surface.facade-north.joint`, `surface.facade-north.outer`, `surface.facade-north.parapet-back` | `plaster` |
| `surface.facade-south.bearing`, `surface.facade-south.joint`, `surface.facade-south.outer`, `surface.facade-south.parapet-back` | `plaster` |
| `surface.facade-west.joint`, `surface.facade-west.outer`, `surface.facade-west.parapet-back`, `surface.facade-west.sanctuary-flank` | `plaster` |
| `surface.offering.wall` | `plaster` |
| `surface.records.wall` | `plaster` |
| `surface.roof-colonnade.bearing` | `plaster` |
| `surface.roof-east.bearing` | `plaster` |
| `surface.roof-porch.bearing` | `plaster` |
| `surface.roof-sanctuary.bearing` | `plaster` |
| `surface.roof-west.bearing` | `plaster` |
| `surface.sanctuary.wall` | `plaster` |
| `surface.service-yard.wall`, `surface.service-yard.wall-top` | `limestone` |
| `surface.storage.wall` | `plaster` |
| `surface.roof-colonnade.upper` | `roof-terracotta` |
| `surface.roof-east.upper` | `roof-terracotta` |
| `surface.roof-porch.upper` | `roof-terracotta` |
| `surface.roof-sanctuary.upper` | `roof-terracotta` |
| `surface.roof-west.upper` | `roof-terracotta` |
| `surface.site.earth`, `surface.site.ground` | `soil` |
| `surface.site-distant.ground` | `soil` |

모델의 기둥·문짝·기와·수반처럼 독립 prototype이 만든 part는 이 표에 복제하지 않고 [모델 결속](10-model-bindings.md#binding-map)을 소비한다. 공간 표면에 실제 비트맵이 붙으면 producer UV0의 유한성과 월드 미터 반복을 확인하고, 실패 시 기본색으로 조용히 넘기지 않는다. 이미지 01의 포치·외벽·기와, 03의 중정 바닥·붉은 띠, 04의 제실 천장, 05의 기록실 바닥을 같은 주광에서 본다. 외벽이 `paving`을 받거나 중정 바닥이 `plaster`를 받으면 즉시 반례다.

## 재료 전환과 가려진 접면 {#material-junctions}

<!--
@evidence principles/core/common.md#declared-basis spaces/ownership의 dado Y=0.60m, spaces/junctions의 기단·코핑, roof edge·soffit·upper 면 분리를 접면 입력으로 둔다.
@evidence principles/core/common.md#scope-preservation 벽·지붕의 기존 경계에서 finish만 전환하고 별도 돌출 턱이나 새로운 면을 만들지 않는다.
@evidence principles/core/common.md#substantive-completion 코핑/회벽, dado/문 void, 지붕 upper/edge/soffit, 가려진 bearing의 서로 다른 마감 규칙을 닫는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation spaces의 동일 벽 및 roof 면 분할을 노출 마감과 숨은 접촉면의 차이로 구체화한다.
@evidence principles/design/materials.md#material-construction-appearance 기단·코핑·문틀은 host의 물리 부재이고 석재/회벽 경계 및 가려진 bearing의 색만 재료로 정한다.
@evidence principles/design/materials.md#material-binding-interface dado의 Y=0.60m와 문 void, roof upper·edge·soffit의 기존 면 ID에 따라 키를 전환한다.
@evidence principles/design/materials.md#material-verification-address 외관 코핑 모서리, 동서 처마, 제실 트러스·천장, 두 dado 문턱의 근접 시점에서 finish 뒤집힘을 찾는다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work spaces/ownership.md#interior-dado의 Y=0.60m 분할, openings의 void와 roofs/assembly의 upper/edge/soffit 면을 대조했고 재료 접면 때문에 부모 분할을 바꾸지 않는다.
@evidence spaces/junctions.md#gable-closures 박공 wall 회벽과 지붕 upper 점토·edge/soffit 목재의 접면에서 물리 패치를 늘리지 않는다.
@evidence spaces/junctions.md#wall-junctions 한 물리벽의 양면과 숨은 bearing/joint를 각각 노출 마감 및 기본색으로 다룬다.
@evidence spaces/openings.md#boundary-ownership 문 void 주변 reveal 석재와 wall 회벽을 기존 개구부 경계에서 전환한다.
@evidence spaces/roofs/assembly.md#roof-junctions 합성 roof upper의 점토 기와 바탕, edge/soffit 목재, 숨은 bearing 회벽을 분리한다.
@evidence spaces/storey.md#wall-ground-contact 대지 경사에 닿는 외벽 기단 석재와 흙·포장 면의 마감 경계를 기존 접점에 둔다.
@evidence spaces/ownership.md#interior-dado 주랑과 제실의 Y=0.60m 붉은 띠는 이 분할 면과 문 void에서 멈추고 별도 턱을 만들지 않는다.
-->

기단·코핑·문 주변 석재와 회벽의 전환은 각 부재 경계에서 일어난다. 주랑·제실 붉은 띠는 [실내 띠](../spaces/ownership.md#interior-dado)의 Y=0.60m 선과 문 void에서만 멈추며 별도 부피나 돌출 턱이 없다. 외벽 아래 기단은 대지 경사를 따르는 기존 면에 결속하고, 지붕의 `upper`는 기와 바탕, `edge`·`soffit`는 목재색 하부, 벽·지붕의 가려진 bearing은 노출 마감으로 세지 않는다. 이 구분은 동일 물리벽의 양면과 접면을 하나의 텍스처 평면으로 합치지 않기 위한 재료 결정이다. 외관 코핑 모서리, 동·서 처마 끝, 제실에서 올려다본 트러스와 천장, 두 dado 문턱을 가까이 보아 뒤집힌 finish·누광·중복 띠를 찾는다.

## 재료 검토 표본 {#material-review-set}

<!--
@evidence principles/core/common.md#declared-basis settings/00-delivery의 1600×1000·50° 프레임과 40-environment의 고정 주광 및 레퍼런스 01~05를 표본 조건으로 삼는다.
@evidence principles/core/common.md#scope-preservation 팔레트와 결속표가 정한 마감 결과를 관찰할 표본을 소유하고 새 geometry나 응답 키를 만들지 않는다.
@evidence principles/core/common.md#substantive-completion 검토판의 정면·사선·근접과 다섯 참조 장면, 업무방 문턱·마당 벽·코핑의 실패 조건을 지정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation settings의 중립 프레임을 각 부재·공간 재료의 경계·반복 길이·색 분리 확인으로 구체화한다.
@evidence principles/design/materials.md#material-construction-appearance 석재·목재·회벽의 물리적 분리와 색·줄눈·거칠기 같은 화면 반응을 별개 검토 질문으로 둔다.
@evidence principles/design/materials.md#material-binding-interface 기둥/보/문철물/기와 part 및 각 surface ID를 2m·1m 포장 표본과 함께 확인해 geometry 소유를 넘겨받지 않는다.
@evidence principles/design/materials.md#material-verification-address 01~05 각 화면, 세 업무방 문턱, 마당 양면, 모델 검토판의 정면·사선·근접이라는 재현 가능한 표본을 둔다.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work settings/00-delivery.md#review-condition과 40-environment.md#daylight 및 spaces의 검토 면을 표본으로 받아 재료 표본 단계에서 상위 카메라·조명·면을 바꾸지 않는다.
@evidence obligations/core/common.md#purpose-fit 팔레트·모델 part 표·공간 face 표가 있어야 사용자가 다섯 레퍼런스에서 마감을 비교할 수 있고 이 H2가 그 재현 표본을 닫는다.
@evidence obligations/core/common.md#production-language 세 재료 문서의 결정과 검토 조건을 한국어로 적고 surface ID·part·키 식별자는 그대로 써 운영자가 대응시킬 수 있다.
@evidence obligations/design/materials.md#material-review-set 중립 프레임·주광 아래 기둥/보/철물/기와, 세 업무방 문턱, 마당 벽 양면을 정면·사선·근접으로 본다.
@evidence settings/00-delivery.md#delivery-scope 재사용 건물·실내·대지를 다섯 참조 장면별 재료 표본으로 분리해 확인한다.
@evidence settings/00-delivery.md#governing-aim 다섯 이미지의 동일 신전에서 석재·회벽·목재·기와를 이어 읽을 수 있는지를 표본으로 삼는다.
@evidence settings/00-delivery.md#review-condition 1600×1000·수직 50° 중립 프레임과 외관·실내 가까운 시점을 재료 검토 조건으로 받는다.
@evidence settings/00-delivery.md#working-language 재료 팔레트와 결속·검토 조건을 한국어로 쓰고 face/key 식별자만 원어로 유지한다.
@evidence settings/40-environment.md#daylight 고정 낮과 하늘 보조광 아래 같은 재료를 정면·사선·근접으로 비교한다.
@evidence settings/50-production.md#fidelity 사진 수준 재현 대신 건물의 석재·회벽·목재·기와와 소품 proxy를 다른 검토 엄밀도로 다룬다.
@evidence settings/50-production.md#references 사용자 이미지 01~05를 외관·절개·중정·제실·서비스의 마감 비교 표본으로 받는다.
@evidenceExclude settings/00-delivery.md#accessibility 자막·키보드·포커스 및 판독성은 viewer의 운영 인터페이스이고 이 재료 H2들은 표면 응답과 결속만 정한다.
@evidenceExclude settings/00-delivery.md#coverage-map settings 파일의 소유 안내표는 재료가 소비할 표면이나 응답을 정하지 않으며 이 층은 20-envelope의 실제 면 문장을 별도로 받았다.
@evidenceExclude settings/00-delivery.md#operative-subjects 행위 주체와 허용 동작은 정적인 마감 키·상태가 아니며 이 재사용 건물 재료는 배우나 동작을 만들지 않는다.
@evidenceExclude settings/00-delivery.md#operator-access 운영자의 뷰어 조작·라벨·검사는 viewer 소유이고 1600×1000 표본만 재료 검토 H2가 받았다.
@evidenceExclude settings/10-building.md#civic-identity 특정 신앙·왕조를 단정하지 않는 용도 정체성은 settings의 범위이며 팔레트는 석재·회벽 등 관찰 가능한 마감만 정한다.
@evidenceExclude settings/10-building.md#scale 410~450㎡ 외곽과 장단변비는 spaces의 footprint 검증이며 포장·회벽 키는 해당 면적이나 평면 치수를 다시 결정하지 않는다.
@evidenceExclude settings/50-production.md#acceptance 독립 판정과 단계 승격 권한은 작업 절차이며 마감의 구성·결속·빛 반응을 바꾸지 않는다.
@evidenceExclude settings/50-production.md#author-commits 저작자 커밋·push 규칙은 저장소 절차이고 재료 H2의 표면 키나 반복 길이의 입력이 아니다.
@evidenceExclude settings/50-production.md#execution-authority production 경계 및 설치 권한은 작업 절차이고 20개 마감 H2에서 소비하는 건물 face 결정이 아니다.
@evidenceExclude settings/50-production.md#gpu-observation GPU renderer 확인은 이후 화면 측정 절차이고 이 초안의 중립 조명·카메라 표본은 review-condition과 daylight에서 받았다.
@evidenceExclude settings/50-production.md#measurement-truth compiled ID·position의 진실을 source에서 재는 규칙은 구현 검증 절차이며 이 재료 문서는 안정된 surface ID와 키만 저작한다.
@evidenceExclude settings/50-production.md#runtime-boundary CJS/ESM 및 viewer payload 경계는 source 구현 규칙이고 이 마감 설계의 물리층·UV·키를 정하지 않는다.
@evidenceExclude spaces/building.md#approach-contacts 건물 접근 접점의 위치와 두 연결 노드는 spaces의 길 찾기이며 재료 표는 그 접점에 방출된 site.paving·curb 면만 소비한다.
@evidenceExclude spaces/building.md#footprint 외곽 좌표와 410~450㎡ 면적은 spaces의 footprint이며 재료는 그 결과의 surface ID에만 결속한다.
@evidenceExclude spaces/circulation.md#public-route 주랑과 현관의 보행 경로·폭은 공간 동선이며 재료는 이미 방출된 floor에 paving을 주는 것까지만 맡는다.
@evidenceExclude spaces/circulation.md#service-route 서비스 측면 출입 순서는 공간 동선이고 마당 floor/wall의 마감 키는 별도 표에서 받는다.
@evidenceExclude spaces/observations.md#geometry-observations 공간 수치·관통·접촉 관찰은 geometry 검토이며 재료 표본은 색·반복·접면만 독립적으로 판정한다.
@evidenceExclude spaces/observations.md#viewer-path viewer의 카메라 경로 및 조작은 공간 검토 소유이며 재료는 review-condition의 중립 프레임을 사용한다.
@evidenceExclude spaces/site.md#placement-zones 이웃집과 수목의 개체 위치·반복 수는 instances의 배치이며 재료는 각 prototype part의 finish만 정한다.
@evidenceExclude spaces/site.md#site-connections 대지 접근 노드와 외부 길 연결은 공간/지도 접점이고 재료는 site.paving의 마감 키만 정한다.
@evidenceExclude spaces/site.md#site-extent 대지 경계와 바깥 25m 관찰 범위는 spaces의 영역 결정이고 재료는 그 안에 방출된 earth·paving·ridge face만 받는다.
-->

비교 조건은 [검토 프레임](../settings/00-delivery.md#review-condition)의 1600×1000·수직 50°와 [주광](../settings/40-environment.md#daylight)의 고정 낮·하늘 보조광을 따른다. 검토판에서는 기둥 석재·목재 보·문철물·기와 한 단위와 2m 포장 표본을 정면·사선·가까운 시점으로 본다. 건물에서는 이미지 01 외관, 02 절개 조감의 면 배정, 03 중정, 04 제실, 05 기록·서비스의 각 질문을 별도로 대조한다. 서비스 마당 북·동 낮은 안쪽 벽과 높은 제실·보관실 벽의 마당 쪽 면, 벽 위 코핑을 석재로 읽되 북·동 바깥면 회벽과 분리한다. 관리실·기록실·보관실 문턱마다 1m 포장과 주랑 2m 포장의 네 칸 주기를 대조한다. 어느 업무방이든 주랑과 줄눈 간격이 같거나, 기와 geometry 이외에 직교 격자가 보이거나, 문틀·문짝 간 재료가 뒤집히거나, 붉은 띠가 방 바깥으로 새거나, 천장과 회벽이 단색으로 합쳐지거나, 포장·흙·수반 물이 분리되지 않으면 실패다. 사진 수준의 손상 복제는 주장하지 않는다. 실제 재료 source와 배치가 생긴 뒤 이 조건으로 화면을 다시 판정한다.

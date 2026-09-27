# 공간 표면의 재료 결속

## 공간 표면 결속 {#space-binding-map}

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
| `surface.records.floor` | `paving` |
| `surface.sanctuary.floor` | `paving` |
| `surface.service-yard.floor` | `paving` |
| `surface.site.paving` | `paving` |
| `surface.storage.floor` | `paving` |
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
| `surface.service-yard.wall`, `surface.service-yard.wall-top` | `plaster` |
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

기단·코핑·문 주변 석재와 회벽의 전환은 각 부재 경계에서 일어난다. 주랑·제실 붉은 띠는 [실내 띠](../spaces/ownership.md#interior-dado)의 Y=0.60m 선과 문 void에서만 멈추며 별도 부피나 돌출 턱이 없다. 외벽 아래 기단은 대지 경사를 따르는 기존 면에 결속하고, 지붕의 `upper`는 기와 바탕, `edge`·`soffit`는 목재색 하부, 벽·지붕의 가려진 bearing은 노출 마감으로 세지 않는다. 이 구분은 동일 물리벽의 양면과 접면을 하나의 텍스처 평면으로 합치지 않기 위한 재료 결정이다. 외관 코핑 모서리, 동·서 처마 끝, 제실에서 올려다본 트러스와 천장, 두 dado 문턱을 가까이 보아 뒤집힌 finish·누광·중복 띠를 찾는다.

## 재료 검토 표본 {#material-review-set}

비교 조건은 [검토 프레임](../settings/00-delivery.md#review-condition)의 1600×1000·수직 50°와 [주광](../settings/40-environment.md#daylight)의 고정 낮·하늘 보조광을 따른다. 검토판에서는 기둥 석재·목재 보·문철물·기와 한 단위와 2m 포장 표본을 정면·사선·가까운 시점으로 본다. 건물에서는 이미지 01 외관, 02 절개 조감의 면 배정, 03 중정, 04 제실, 05 기록·서비스의 각 질문을 별도로 대조한다. 주랑 2m 포장의 각 축 네 칸과 업무방 1m 포장의 각 축 네 칸이 다르게 나타나지 않거나, 기와 geometry 이외에 직교 격자가 보이거나, 문틀·문짝 간 재료가 뒤집히거나, 붉은 띠가 방 바깥으로 새거나, 천장과 회벽이 단색으로 합쳐지거나, 포장·흙·수반 물이 분리되지 않으면 실패다. 사진 수준의 손상 복제는 주장하지 않는다. 초안 단계에서는 이 표본과 실패 조건을 설계하고, 실제 재료 source와 배치가 생긴 뒤 같은 조건으로 화면을 판정한다.

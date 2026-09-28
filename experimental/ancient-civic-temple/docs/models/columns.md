# 원주

## 주랑 원주 {#colonnade-column}

<!--
@evidence contracts/principles-models.md#temple-reference-scale 0.34×h×0.34m 원형은 12°·19° 보 하부 높이에 맞춰 보행 포락보다 좁은 통행 지지재가 되고, `base`·`shaft`·`capital`의 둥근 옆면은 +X 시접의 Y축 원통 UV를 쓴다.
@evidenceReview contracts/principles-models.md#temple-reference-scale #64c0ea1 주랑 기둥 지름 0.34m와 두 보 아랫면 높이 식을 읽고, 받침·몸통·주두의 둥근 면은 +X 시접 회전체이며 정방 판은 평면 투영인지 확인했다.
@evidence settings/00-delivery.md#build-scope 주랑 원형 H2는 plinth·shaft·capital의 형상을 정하고 실제 주랑의 반복 수와 위치는 instances에 넘겨 제작 분담의 prototype 경계를 지킨다.
@evidenceReview settings/00-delivery.md#build-scope #8d597f9 원주 부재와 주랑 반복 배치의 서로 다른 owner를 이 H2와 00-delivery의 제작 분담표에서 확인했다.
@evidenceExclude settings/10-building.md#scale 410~450㎡ 외곽과 장단변비는 spaces footprint가 소비하고 원형은 보행 포락과 방·지붕의 판정된 순치수로 각자 크기를 정한다.
@evidenceExcludeReview settings/10-building.md#scale #4d1f683 건물 면적과 원형 점유 상자의 서로 다른 척도를 모델 H2와 spaces footprint에서 확인했다.
@evidence principles/core/common.md#scope-preservation 연속 주랑의 원형 석주 하나를 여섯 부재(기단·받침·몸통·목 띠·받침머리·주두 판)와 높이·점유 상자·part·접촉면까지 온전히 정한다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 여섯 단 부재와 보 접촉, 폭·높이를 한 기둥에 남겨 주랑 원주의 필요한 면을 빠뜨리지 않았는지 확인했다.
@evidence principles/core/common.md#substantive-completion 부재별 치수, 경사별 보 윗면 접선 식에서 유도한 두 전체 높이 h=2.622862867/2.618208538m와 몸통 높이 h−0.38m, 24분할·법선·모서리 12°와 동측 중간 19° 배치 기준이 있어 source가 기둥 형상을 다시 고르지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 두 경사에 따른 h와 몸통 높이 h−0.38m, 24각 및 법선 선택을 본문 식과 대조했다.
@evidence principles/core/common.md#declared-basis 가장 넓은 폭 0.34m는 rooms/colonnade.md#ring-volume의 0.35m 기둥 예산, 높이는 주랑 보 아랫면과 roofs/assembly의 주랑 처마 값, 양식은 이미지 02·03·05에서 온다고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 0.35m 주랑 예산, 보 아랫면, 이미지 02·03·05가 각각 폭·높이·형태의 출처로 쓰이는지 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 주랑 기둥이라는 설정과 0.35m 예산을 여섯 단 분할·몸통의 좁아짐·주두 판 접촉면이라는 모델 결정으로 바꾼다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 연속 석주 약속에 없던 여섯 단 및 좁아지는 몸통·주두 접촉면을 추가한 지점을 읽었다.
@evidence principles/design/models.md#representation-contract plinth·base·shaft·capital 네 part와 표면, 기단 바닥과 주두 판 윗면의 가려진 접촉면, 내부 빈 공간 없음을 정한다.
@evidenceReview principles/design/models.md#representation-contract #41a7d98 네 part가 여섯 물리 구간을 빠짐없이 분담하고 바닥·보 접촉면을 드러내는지 확인했다.
@evidence principles/design/models.md#spatial-convention 원점을 기단 바닥면 중심, 기둥 축을 로컬 +Y로 두고 점유 상자 0.34×h×0.34m의 높이를 보 접선 식으로 유도한다.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e 기단 중심 원점과 +Y 축에서 0.34×h×0.34m 점유가 보 식에 따라 정해지는지 확인했다.
@evidence principles/design/models.md#reviewable-structure 정면·측면 실루엣에서 여섯 단 구분과 몸통 좁아짐을 보고 원통 하나·0.35m 초과 기단·주두 없는 몸통을 실패로 둔다.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b 정면·측면에서 여섯 단과 테이퍼가 보여야 한다는 기준이 원통 하나를 실패로 판별하는지 확인했다.
@evidence principles/design/models.md#model-observable-style-basis 매끈한 몸통·목 띠·정방 주두 판을 양식 근거로 삼고 세로 홈·조각·특정 고대 오더 비례는 주장하지 않는다.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 매끈한 몸통과 정방 주두까지만 양식 근거로 두고 세로 홈이나 고대 오더를 주장하지 않는지 확인했다.
@evidence principles/design/models.md#model-scale-layer-completion 기둥 높이가 보·서까래·지붕 하부와 산술로 이어지고 포락 대비 약 1.38배·기단 약 0.57배의 비교가 있어 축척과 층이 함께 닫힌다.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e 12도·19도 두 높이와 포락 1.38배를 대조해 기둥 크기가 보·서까래 아래 접촉과 함께 닫히는지 확인했다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work ring-volume의 0.35m 기둥 예산과 roofs/assembly의 주랑 처마 3.20m를 기둥 폭 0.34m·12°/19° 보 접선에서 유도한 두 높이 2.622862867/2.618208538m에 대조했고 예산 안에 들어 부모를 고치지 않았다.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 0.34m가 0.35m 예산 안이고 두 h가 처마 접선에서 나옴을 대조해 부모 높이 수리가 요구되지 않는지 확인했다.
@evidence settings/20-envelope.md#colonnade 밝은 원형 석주의 연속 주랑이라는 정체성을 원형 석주 prototype으로 받는다.
@evidenceReview settings/20-envelope.md#colonnade #29bfe45 밝은 원형 석주가 네 part를 가진 반복 prototype으로 유지되고 벽 장식으로 흡수되지 않는지 확인했다.
@evidence spaces/rooms/colonnade.md#ring-volume 기단·주두 평면 폭 0.35m 예산과 중정 경계 0.175m 안쪽 축선을 기둥 폭 0.34m와 배치 기준점으로 소비한다.
@evidenceReview spaces/rooms/colonnade.md#ring-volume #8c8a4cf 중정 경계 0.175m 안쪽 축과 0.35m 허용폭이 배치 및 0.34m 기단에 각각 소비되는지 확인했다.
@evidence spaces/roofs/assembly.md#roof-junctions 합성 날개 지붕의 중정 쪽 하부 높이에서 서까래 깊이를 뺀 보 윗면으로 기둥 전체 높이를 유도한다.
@evidenceReview spaces/roofs/assembly.md#roof-junctions #1812a91 주랑 보 윗면에서 0.28m를 빼 h를 얻는 산식이 지붕 조립 높이의 실제 소비인지 확인했다.
@evidence settings/50-production.md#references 이미지 02·03·05의 정방 기단·둥근 받침·매끈한 몸통·목 띠·정방 주두 판을 양식 근거로 쓴다.
@evidenceReview settings/50-production.md#references #eb34a79 이미지 02·03·05의 정방 기단·둥근 받침·목 띠·주두 판이 본문 여섯 단에 남아 있는지 확인했다.
@evidenceExclude spaces/ownership.md#interior-dado 적갈색 하부 띠는 주랑·제실 벽 표면의 높이 분할이며 원주는 벽에서 떨어진 독립 부재라 띠와 만나는 모델 표면이 없다.
@evidenceExcludeReview spaces/ownership.md#interior-dado #4b6731d 벽 표면의 적갈 하부 띠가 독립 원주에는 닿지 않는다는 배제를 벽과 기둥의 소유 범위에서 확인했다.
-->

[연속 주랑](../settings/20-envelope.md#colonnade)의 밝은 원형 석주다. 이미지 02·03·05에서 읽히는 뚜렷한 정방 기단, 둥근 받침, 위로 약간 가늘어지는 매끈한 몸통, 목 띠와 둥근 받침머리, 정방 판으로 된 주두가 양식 근거다. 세로 홈·조각·특정 고대 오더의 비례는 주장하지 않는다. 판정된 [주랑 공간](../spaces/rooms/colonnade.md#ring-volume)이 허용한 기단·주두 평면 폭 0.35m 안에 들도록 가장 넓은 부분을 0.34m로 정했다.

로컬 원점은 기단 바닥면의 중심이며 기둥 축은 로컬 +Y다. 부재는 아래부터 기단(정방 0.34×0.34m, 높이 0.08m), 받침(원통 반지름 0.155m, 높이 0.10m), 몸통(원뿔대, 아래 반지름 0.135m에서 위 0.115m), 목 띠(원통 반지름 0.125m, 높이 0.03m), 받침머리(원뿔대 반지름 0.125m→0.155m, 높이 0.10m), 주두 판(정방 0.34×0.34m, 높이 0.07m)이다. 전체 높이 h는 [주랑 목재 보](entablature.md#colonnade-beam)의 경사별 접촉 식으로 얻은 보 윗면에서 보 깊이 0.28m를 뺀 값이다. 12° 외쪽 변은 h=2.902862867−0.28=2.622862867m, 19° 동측 박공 변은 h=2.898208538−0.28=2.618208538m다. 몸통 높이는 각 h에서 0.08+0.10+0.03+0.10+0.07=0.38m를 뺀 2.242862867m와 2.238208538m다. source는 반올림한 화면 표기가 아니라 앞의 접촉 식을 소비한다. 원형 부재는 24분할 다면체이고 몸통과 받침은 부드러운 법선, 기단과 주두 판은 평평한 면 법선을 쓴다. 점유 상자는 `0.34×h×0.34m`다.

부재 대응: `plinth`=기단; `base`=받침; `shaft`=몸통; `capital`=주두.

part와 표면은 `plinth`, `base`, `shaft`, `capital`(목 띠·받침머리·주두 판) 네 개다. 기단이 바닥에 닿고 주두 판 윗면이 보 아랫면을 받는 면이며 두 면은 가려진 접촉면이다. 내부 빈 공간은 없다. materials는 네 표면에 같은 석재를 줄 수도 있고 기단의 마모만 달리할 수도 있다. 배치 기준점은 원점이며 instances가 중정 경계에서 0.175m 안쪽의 축선 위 간격과 수를 정한다. 모서리 원주는 남·북 보 아래의 12° 높이 변형이고 동측 변 중간 원주는 19° 높이 변형이며, 다른 변 중간 원주는 12° 높이 변형이다. 동측 보의 끝면은 남·북 보 옆면에 닿고, 양끝 아랫면의 0.040m 긴 얕은 턱은 이 모서리 주두 판 윗면에도 닿는다. 동측 변 중간의 온전한 보 아랫면은 19° 높이 원주가 받친다.

검토 판의 정면·측면 실루엣에서 기단·받침·몸통·목 띠·받침머리·주두 판의 여섯 단 구분과 몸통의 좁아짐이 읽혀야 한다. 보행 포락과 나란히 둘 때 기둥이 약 1.38배 높고 기단 폭은 포락 폭의 약 0.57배다. 원통 하나로 된 기둥, 0.35m를 넘는 기단, 주두 없이 보에 닿는 몸통은 이 모델의 실패다.

주랑 `base`·`shaft`·`capital`의 둥근 옆면 UV0는 각 단면의 실제 반지름을 쓰는 Y축 원통 전개이며 +X에 시접을 둔다. 정방 `plinth`와 주두 판의 평면은 면 법선별 기본 투영으로 끊는다.

## 포치 원주 {#porch-column}

<!--
@evidence contracts/principles-models.md#temple-reference-scale 포치 기둥의 0.50×3.20×0.50m 점유는 두 받침 축 X=±1.35m와 보 아랫면을 연결하고, 24각 몸통·받침은 Y축 원통 UV, 정방 기단과 판은 평면 UV를 낸다.
@evidenceReview contracts/principles-models.md#temple-reference-scale #64c0ea1 포치 원주 3.20m 윗면과 0.50m 지름을 보 위치에 대조하고, 24각 원통 면과 정방 기단·판의 서로 다른 투영을 읽었다.
@evidence settings/00-delivery.md#coordinates 포치 원주의 기단 바닥 Y=0, 중심 Z=10.00m와 높이 치수는 오른손 Y-up의 미터 좌표로 해석한다.
@evidenceReview settings/00-delivery.md#coordinates #4d2b0d4 포치 기단 원점·Z 중심·Y 높이를 settings의 축과 단위 규약에 대조했다.
@evidence principles/core/common.md#scope-preservation 정면 포치의 두 원형 기둥을 여섯 부재 치수, 전체 높이 3.20m, 두 번 배치되는 위치 출처까지 정한다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 두 번 쓰는 포치 원주가 여섯 단 크기, 3.20m 높이, 위치 출처를 모두 가지는지 확인했다.
@evidence principles/core/common.md#substantive-completion 부재별 반지름·높이와 주두 판 0.46m, 점유 상자 0.50×3.20×0.50m가 있어 source가 기둥 크기를 다시 고르지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 부재 높이 합과 0.50×3.20×0.50m 점유를 계산해 source가 기단·몸통 비례를 새로 정하지 않는지 확인했다.
@evidence principles/core/common.md#declared-basis 기단 0.50m는 rooms/entrance.md#entrance-volume의 0.5m 정방 예산과 south-outer 10.25, 높이는 포치 보 아랫면, 양식은 이미지 01에서 온다고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 현관 0.5m 기단 예산, south-outer, 보 아랫면, 이미지 01이 폭·앞면·높이·양식에 각각 연결되는지 확인했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 포치 기둥이라는 설정을 주랑 원주와 같은 가족의 더 굵은 비례·기단 앞면을 south-outer에 맞추는 배치라는 모델 결정으로 바꾼다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 주랑 원주보다 굵은 몸통과 현관 외선에 맞춘 기단 앞면이 부모의 두 기둥 약속을 넘는 선택인지 확인했다.
@evidence principles/design/models.md#representation-contract plinth·base·shaft·capital part와 주두 판 윗면의 포치 보 접촉면, 24분할과 주랑 원주와 같은 법선 규칙을 정한다.
@evidenceReview principles/design/models.md#representation-contract #41a7d98 네 part가 24각 받침·몸통·주두를 배분하고 주두 판 윗면이 보 접촉면인지 확인했다.
@evidence principles/design/models.md#spatial-convention 원점을 기단 바닥 중심, 축을 로컬 +Y로 두고 높이를 양측 받침 완성면 Y=0에서 잰다고 적는다.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e 기단 바닥 중심에서 +Y 3.20m를 양측 받침 완성면 Y=0 기준으로 재는 문장을 확인했다.
@evidence principles/design/models.md#reviewable-structure 주랑 원주와 나란히 두고 몸통 지름 0.36m가 포락 폭의 약 0.6배인지, 주두 판 없는 몸통이 없는지 본다.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b 주랑 원주와 포락을 옆에 두는 비교가 0.36m 몸통 지름과 빈 주두 실패를 드러내는지 확인했다.
@evidence principles/design/models.md#model-observable-style-basis 이미지 01의 문짝보다 조금 높은 포치 기둥 비례를 따르며 주랑 원주보다 가는 기둥을 실패로 두어 같은 가족의 큰 부재라는 판단을 반증 가능하게 한다.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 이미지 01의 문보다 조금 높은 비례가 3.20m 기둥과 주랑보다 굵은 몸통으로 판단 가능한지 확인했다.
@evidence principles/design/models.md#model-scale-layer-completion 기둥 높이와 포치 보 아랫면 3.20m, 기단 앞면과 south-outer의 일치로 축척과 접촉 층이 닫힌다.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e 기단 앞면 Z=10.25m와 보 아랫면 Y=3.20m가 각각 평면·연직 접촉을 닫는지 확인했다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work entrance-volume의 0.5m 정방 예산과 기둥 중심 Z=10.00, 포치 보 아랫면 3.20m를 이 기둥에 대조했다. 기둥 위치를 옮긴 부모 수리는 포치 보의 받침 조건에서 드러난 것이라 porch-entablature가 보고하고 이 기둥은 그 결과를 소비한다.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 현관 예산과 X=±1.35m·Z=10.00m를 대조했고 위치 수리는 포치 보 H2의 부모 교정이라는 경계를 확인했다.
@evidence settings/20-envelope.md#entrance-porch 두 원형 기둥이 받치는 정면 포치라는 정체성을 포치 원주 prototype으로 받는다.
@evidenceReview settings/20-envelope.md#entrance-porch #e6180af 두 원주가 포치 보를 받는다는 설정이 기둥 한 종류의 두 배치로 실현되는지 확인했다.
@evidence spaces/rooms/entrance.md#entrance-volume 0.5m 정방 이내 기단과 기둥 위치 X=±1.35m·Z=10.00m를 기단 폭과 두 배치 위치로 소비한다.
@evidenceReview spaces/rooms/entrance.md#entrance-volume #8bd8ef3 0.50m 기단과 X=±1.35m·Z=10.00m가 현관 공간의 허용 위치를 그대로 쓰는지 확인했다.
@evidence spaces/building.md#plan-datums south-outer 10.25를 기단 앞면이 맞출 선으로 소비한다.
@evidenceReview spaces/building.md#plan-datums #a9e2a0d Z=10.00m 중심에 반폭 0.25m를 더한 앞면이 south-outer 10.25m와 일치함을 확인했다.
@evidence settings/50-production.md#references 이미지 01의 포치 기둥 비례를 문짝보다 조금 높은 석주로 옮긴다.
@evidenceReview settings/50-production.md#references #eb34a79 이미지 01의 포치 원주가 문보다 조금 높은 석주라는 본문 비례에 사용됐는지 확인했다.
-->

[정면 포치](../settings/20-envelope.md#entrance-porch)의 두 원형 기둥이다. 주랑 원주와 같은 구성의 더 크고 굵은 석주이며 이미지 01의 포치 기둥처럼 문짝보다 조금 높은 비례를 가진다. 판정된 [현관](../spaces/rooms/entrance.md#entrance-volume)이 허용한 0.5m 정방 이내 기단의 앞면을 south-outer에 맞추도록 기단을 0.50m로 정했다. 중심 Z=10.00m에서 기단 앞면이 Z=10.25m가 된다.

로컬 원점은 기단 바닥 중심, 축은 로컬 +Y다. 기단(정방 0.50m, 높이 0.10m), 받침(원통 반지름 0.21m, 높이 0.13m), 몸통(원뿔대 반지름 0.18m→0.155m, 높이 2.71m), 목 띠(반지름 0.165m, 높이 0.04m), 받침머리(원뿔대 0.165m→0.21m, 높이 0.13m), 주두 판(정방 0.46m, 높이 0.09m)으로 전체 높이 3.20m다. 이 높이는 [포치 보](entablature.md#porch-entablature) 아랫면과 같고 기둥이 서는 양측 받침의 완성면 Y=0에서 잰다. 원형 부재는 24분할이며 법선 규칙은 주랑 원주와 같다. 점유 상자는 0.50×3.20×0.50m다.

부재 대응: `plinth`=기단; `base`=받침; `shaft`=몸통; `capital`=주두.

part와 표면은 `plinth`, `base`, `shaft`, `capital`이다. 주두 판 윗면은 포치 보를 받는 가려진 접촉면이다. 이 모델은 두 번 배치되며 위치는 현관 설계의 X=±1.35m, Z=10.00m를 instances가 소비한다.

포치 `base`·`shaft`·`capital`의 둥근 24각 옆면 UV0는 +X에서 시작하는 Y축 원통 호길이 U와 모선 길이 V다. 정방 `plinth`와 주두 판은 각각 바깥 법선의 평면 투영을 쓴다.

검토 판에서 주랑 원주와 나란히 두어 같은 가족의 더 큰 부재로 읽히는지, 몸통 지름 0.36m가 보행 포락 폭의 약 0.6배인지 본다. 주랑 원주보다 가는 포치 기둥이나 주두 판 없이 보를 받는 몸통은 실패다.

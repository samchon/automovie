# 지붕을 덮는 모듈

## 둥근기와와 평기와 {#roof-tile}

<!--
@evidenceExclude settings/00-delivery.md#operator-access 궤도·확대·시점 선택은 건물 viewer 조작이고 모델 population의 판은 계약에 정한 여섯 방향과 접합 근접 시점을 사용한다.
@evidenceExcludeReview settings/00-delivery.md#operator-access #e19a32a 건물 viewer의 사용자 조작과 중립 판의 고정 관찰 목록을 분리했다.
@evidence settings/50-production.md#fidelity 평기와·둥근기와 H2는 겹침·빈 반원 단면을 읽히게 하지만 장마다 다른 풍화나 정확한 역사 기와 제작을 납품 범위로 약속하지 않는다.
@evidenceReview settings/50-production.md#fidelity #bb89317 기와의 입체 겹침과 열화·개별 불규칙 제외가 blocking 표현 상한에 맞는지 확인했다.
@evidence principles/core/common.md#scope-preservation 평기와와 둥근기와 한 쌍을 한 단위로 삼아 치수·겹침·표면·빈 공간·배치 소유와 코핑과의 높이 관계까지 정한다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 평기와 한 장과 이음 위 둥근기와의 폭·겹침·배치 책임을 본문 끝까지 대조해 지붕 표면을 무늬 판으로 축소하지 않았음을 확인했다.
@evidence principles/core/common.md#substantive-completion 평기와 0.40×0.52m의 0.08m 들린 겹침과 0.44m 피치, 이음 X=+0.20m에 중심을 둔 둥근기와 시작·끝 반지름 0.085/0.075m, 양쪽 0.10m 턱의 접촉 띠와 단위 점유 폭 0.485m를 함께 정한다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 평기와 앞끝의 0.08m 들림, 0.44m 피치, 둥근기와 발과 턱의 접촉 높이를 함께 읽어 다음 단위가 접촉 방식을 발명할 여지가 없는지 확인했다.
@evidence principles/core/common.md#declared-basis 지붕 형태는 20-envelope#roof-form, 세 지붕 끝 높이는 roofs/west·colonnade#south-canopy·east와 roofs/assembly, 코핑 아랫면 4.69m는 junctions#plinth-coping에서 온다고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 지붕 형상과 서·남·동 slab 높이 및 4.69m 코핑 하단의 주소를 실제 사용 문장과 대조했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 곡면 기와 지붕이라는 설정을 반복 단위·줄 방향·코핑 아래로 들어가는 끝이라는 모델 결정으로 바꾼다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모의 곡면 기와 약속에 없던 tegula·imbrex 반복 단위와 코핑 전 정지 계산이 이 단위의 추가 결정임을 확인했다.
@evidence principles/design/models.md#representation-contract tegula·imbrex 두 part와 표면, 평기와 아랫면의 slab 접촉, 처마 끝에서만 보이는 둥근기와 안쪽 빈 공간을 정한다.
@evidenceReview principles/design/models.md#representation-contract #41a7d98 `tegula`의 slab 접촉 아랫면과 `imbrex`의 열린 처마 단면이 서로 다른 두 part에 배정돼 있는지 읽었다.
@evidence principles/design/models.md#spatial-convention 원점을 처마 쪽 아래 모서리 선 중심, +Z 경사 오름, +Y 지붕 면 법선, X 경사 가로로 둔다.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e 처마 아래 모서리 원점과 +Z 경사·+Y 법선·X 가로가 평기와 및 둥근기와 좌표 전체에 동일하게 적용되는지 확인했다.
@evidence principles/design/models.md#reviewable-structure 한 단위와 3×3 배열의 세 시점, 건물의 반원 덮개 줄 읽힘을 보고 평판 무늬·어긋난 줄·파라펫을 뚫는 기와를 실패로 둔다.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b 단위와 3×3 표본의 겹침 단차·반원 끝을 보도록 한 검토와 파라펫 관통 실패가 본문의 형상 한계에 맞는지 대조했다.
@evidence principles/design/models.md#model-observable-style-basis 이미지 01·03의 반원 덮개 줄과 처마 끝 반원 단면을 근거로 하고 기와 한 장씩의 불규칙과 결은 주장하지 않는다.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 이미지 01·03에서 읽은 줄과 반원 단면만 형상 근거로 삼고 개별 기와의 불규칙·결은 약속하지 않는 경계를 확인했다.
@evidence principles/design/models.md#model-scale-layer-completion 평기와 반복 폭 0.40m·길이 0.52m, 둥근기와를 포함한 점유 폭 0.485m·최대 높이 0.125m와 코핑 아래 0.01m 여유를 실제 지붕 높이로 검사하는 규칙이 있어 반복 모듈 층이 완결된다.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e 0.485m 점유 폭과 0.125m 최고점으로 코핑 아래 실제 여유를 검사하게 해 모듈의 크기·경계·배치가 한 닫힌 결정인지 확인했다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 서측 지붕 높은 끝의 slab 상면 약 4.56m와 코핑 아랫면 4.69m 차이는 0.13m라서 높이 0.125m의 기와는 들어가도 0.01m 여유는 못 남긴다. 부모 지붕·코핑 치수를 바꾸지 않고 instances가 실제 높이의 0.01m 여유를 검사해 줄을 멈추므로 부모 수정은 필요 없었다.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 junctions#plinth-coping의 서측 기와 약 4.66m는 0.10m 추정이고, 이 단위의 상한 0.125m를 더하면 4.685m로 코핑 하단과 0.005m만 남는다. 부모의 코핑 높이·지붕 끝은 유지하고 instances가 0.01m 여유 전에 온전한 단위를 멈추는지 대조했다.
@evidence settings/20-envelope.md#roof-form 흙빛 붉은 곡면 기와의 경사지붕을 평기와·둥근기와 단위로 받는다.
@evidenceReview settings/20-envelope.md#roof-form #7269ea1 흙빛 붉은 경사 기와라는 부모 조건이 평판 무늬가 아닌 두 실제 부재로 구체화됐는지 읽었다.
@evidence spaces/junctions.md#plinth-coping 코핑 아랫면 4.69m를 기와 줄 끝이 들어가야 할 높이 상한으로 쓴다.
@evidenceReview spaces/junctions.md#plinth-coping #711b673 코핑 하단 4.69m가 실제 기와 높이와 합산해 비교되는 상한으로 쓰였음을 확인했다.
@evidence spaces/roofs/assembly.md#roof-junctions 합성 지붕 조각의 경계와 골선을 instances가 단위를 자를 기준으로 넘긴다.
@evidenceReview spaces/roofs/assembly.md#roof-junctions #1812a91 골선과 조각 경계에서 온전한 단위의 마지막 위치를 계산하도록 assembly 경계를 쓰는지 확인했다.
@evidence spaces/roofs/west.md#west-roof 서측 외쪽 지붕 높은 끝 약 4.56m를 코핑 대조의 한 끝으로 쓴다.
@evidenceReview spaces/roofs/west.md#west-roof #ee48ff5 서측 높은 끝 4.56m를 4.685m 높이 대조에 사용한 위치를 본문에서 확인했다.
@evidence spaces/roofs/colonnade.md#south-canopy 남쪽 주랑 덮개의 실제 slab 상면을 받아 각 지붕 조각의 코핑 직전 정지 계산에 쓴다.
@evidenceReview spaces/roofs/colonnade.md#south-canopy #698df98 남쪽 주랑 외쪽 slab 상면을 별도 입력으로 받으며 서측 4.56m를 남쪽 지붕의 높이로 쓰지 않았는지 확인했다.
@evidence spaces/roofs/east.md#east-roof 19도 동측 지붕 조각의 실제 slab 상면을 코핑 아래 기와 줄의 정지 계산에 쓴다.
@evidenceReview spaces/roofs/east.md#east-roof #674b805 동측 박공 19°의 실제 slab 상면을 기와 0.125m와 더해 코핑 여유를 검사할 입력으로 남겼는지 확인했다.
@evidence settings/50-production.md#references 이미지 01·03의 경사를 따라 내려오는 반원 덮개 줄과 처마 끝 반원 단면을 근거로 쓴다.
@evidenceReview settings/50-production.md#references #eb34a79 참조 이미지의 처마 반원 끝과 경사를 따르는 덮개 줄이 본문 검토 기준에 각각 남아 있는지 확인했다.
-->

[경사지붕과 처마](../settings/20-envelope.md#roof-form)의 흙빛 붉은 곡면 기와다. 이미지 01·03의 지붕에서 반원형 덮개 기와의 줄이 경사를 따라 내려오고 처마 끝에서 반원 단면이 드러나는 것이 근거다. 평기와 한 장과 그 이음을 덮는 둥근기와 한 장을 한 단위로 삼으며 기와 한 장씩의 불규칙이나 표면 결은 주장하지 않는다.

건물에서 이 단위가 놓이는 slab 상면은 [서측](../spaces/roofs/west.md#west-roof)·[남쪽 주랑](../spaces/roofs/colonnade.md#south-canopy)·[동측](../spaces/roofs/east.md#east-roof) 지붕과 [합성 경계](../spaces/roofs/assembly.md#roof-junctions)에서 받는다. [코핑 단면](../spaces/junctions.md#plinth-coping)의 아랫면 4.69m는 단위 높이를 더한 뒤의 상한이다.

로컬 원점은 단위의 처마 쪽 아래 모서리 선의 중심이며 지붕 slab 상면 위에 놓인다. 로컬 +Z는 경사를 따라 오르는 방향, +Y는 지붕 면의 법선, X는 경사를 가로지르는 방향이다. 평기와는 X=−0.20~+0.20m, Z=0~0.52m, 두께 0.02m 판이다. Z=0.08~0.52m의 기본 판은 Y=0~0.02m이고 양 긴 가장자리 X=−0.20~−0.10m와 +0.10~+0.20m에는 Z=0.08~0.44m 구간에 한해 Y=0.02~0.04m의 폭 0.10m 턱이 붙는다. 마지막 Z=0.44~0.52m에서는 다음 평기와의 들린 앞끝이 Y=0.02~0.04m를 차지하므로 턱을 빼고 겹침 부피를 피한다. 처마 쪽 0≤Z<0.08m에서는 판 바닥과 윗면을 각각 Y=0.02/0.04m로 올리고 턱은 별도 부피로 만들지 않는다. Z=0.08m의 수직 접합면 뒤쪽은 판 Y=0/0.02m이다. 같은 줄의 위 단위를 0.44m마다 놓으면 위 단위의 들린 0.08m 아랫면이 아래 단위의 윗면 Y=0.02m에 면 접촉하므로 판 두 장의 부피가 겹치지 않는다. 둥근기와의 X 중심은 단위 오른쪽 이음선 X=+0.20m, 축은 +Z다. 바깥 반지름은 Z=0.08m에서 0.085m, Z=0.52m에서 0.075m로 선형으로 줄고 두께는 0.015m, 반원은 8분할한다. 두 발의 X는 시작에서 0.115/0.285m, 끝에서 0.125/0.275m다. Z=0.08~0.44m에서 왼발은 이 단위의 +X 턱(+0.10~+0.20m), 오른발은 X=+0.40m에 놓이는 다음 단위의 −X 턱(+0.20~+0.30m) 위에서 Y=0.04m에 닿는다. 끝 0.08m는 접촉 띠가 없는 짧은 돌출이며 앞 0.36m의 양발 지지로 매단다. 양 발의 0.015m 폭이 각 턱 안에 있고 가운데 X=+0.20m 이음을 가로지른다. 껍질은 Z=0.08~0.52m에만 있으며 이음의 아래 단위 끝과 위 단위 시작이 Z=0.52m에서 맞닿는다. 한 줄 노출 길이는 0.44m, 최대 높이는 0.04+0.085=0.125m다. imbrex가 옆 단위로 넘어가므로 한 단위 점유 범위 X=−0.20~+0.285m, Y=0~0.125m, Z=0~0.52m(상자 0.485×0.125×0.52m)다.

부재 대응: `tegula`=평기와; `imbrex`=둥근기와.

part와 표면은 `tegula`, `imbrex`로 나눠 materials가 두 기와의 색을 조금 달리할 수 있다. 평기와의 뒤쪽 아랫면은 slab 상면에 닿고, 처마 쪽 들린 0.08m 겹침 아랫면은 아래 판에 닿는 가려진 접촉면이다. 둥근기와의 열린 밑면은 처마 끝에서 보이고 양 발의 접촉 띠는 턱 뒤에 숨는다. 배치 수, X 줄 간격 0.40m, 줄 방향, 조각 경계와 골선에서 잘리거나 빠지는 단위는 instances가 합성 지붕 조각에서 유도한다. 코핑 아래에서 서측 외쪽 지붕 끝 slab 상면 약 4.56m에 최대 기와 높이 0.125m를 더하면 4.685m로 코핑 아랫면 4.69m와 0.005m 차이여서 요구 여유 0.01m에 못 미친다. instances는 각 지붕 조각의 실제 slab 상면과 0.125m 부재 상한을 합해 코핑 아랫면보다 0.01m 낮은 곳까지만 온전한 단위를 두고, 잘린 끝은 코핑과 만나기 전에 마감한다. 박공 용마루에서 만나는 마지막 0.16m의 경사 구간은 둥근기와와 두 턱을 만들지 않고 평기와 판의 Y=0~0.02m 윗면만 용마루까지 이어 용마루 덮개의 양 발을 받친다. 이 접합의 잘림 위치와 단위 수는 판정된 roof와 코핑 면에서 계산한다.

검토 판에서 한 단위와 3×3 배열을 정면·측면·3/4로 보고 반원 덮개 줄과 겹침 단차, 처마 끝 반원 단면이 읽히는지 확인한다. 건물 관찰에서는 리뷰 거리에서 지붕이 줄무늬 판이 아니라 반원 덮개 줄의 기와면으로 읽히는지 본다. 평판 위 무늬, 줄 방향이 경사와 어긋난 배치, 파라펫을 뚫고 나간 기와는 실패다.

## 용마루 기와 {#ridge-tile}

<!--
@evidenceExclude settings/00-delivery.md#review-condition 1600×1000·50° 카메라는 모델 population의 중립 검토 계약이 소유한다. 용마루 기와를 포함한 개별 원형 H2는 접합·실루엣 질문을 정하지만 공통 카메라 수치를 다시 결정하지 않는다.
@evidenceExcludeReview settings/00-delivery.md#review-condition #6daf6ae 용마루의 근접 질문과 공통 검토 계약의 카메라 숫자를 분리해 원형별 재정의가 없음을 확인했다.
@evidenceExclude settings/50-production.md#gpu-observation GPU 캡처는 source 이후 실제 프레임의 관찰 경로이고 models의 원형 H2는 그 전 단계의 치수·시점 계획만 정한다.
@evidenceExcludeReview settings/50-production.md#gpu-observation #b0ab4b5 모델 설계와 source 기반 GPU 캡처의 단계 경계를 확인했다.
@evidence principles/core/common.md#scope-preservation 세 박공 용마루의 반원 덮개 단위를 치수·겹침·접촉·배치 소유와 동측 박공 남쪽 끝의 정지 규칙까지 정하고 골 기와를 만들지 않는 한계를 밝힌다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 세 용마루와 제외된 골선·외쪽 높은 끝, 코핑 전 정지까지 읽어 덮개가 쓰일 영역을 빠뜨리지 않았음을 확인했다.
@evidence principles/core/common.md#substantive-completion 뒤쪽 반지름 0.13m·앞쪽 코 0.15m, 0.45m 길이·12분할·0.40m 피치와 경사별 Y 기준식·발 절삭식 및 마지막 0.16m 평기와 받침을 정해 source가 접촉 높이를 다시 고르지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 0.13m 몸통과 0.15m 코, 0.40m 피치, 경사별 절삭식을 따라 발의 받침과 겹침이 수치로 정해지는지 대조했다.
@evidence principles/core/common.md#declared-basis 세 용마루 높이는 roofs/sanctuary(약 7.67m)·east(약 4.53m)·porch(약 4.67m), 정지 규칙은 junctions#gable-closures, 코핑 아랫면 4.69m는 #plinth-coping에서 온다고 밝힌다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 제실·동측·포치 용마루 높이를 사용선 분류에, junctions의 south-inner−0.06m 돌출 끝을 동측 덮개 종료점에 사용했는지 본문과 대조했다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 용마루 기와 줄이라는 설정을 쓰이는 세 용마루와 쓰이지 않는 네 골선·외쪽 높은 끝, 코핑 앞 정지라는 모델 결정으로 바꾼다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모의 용마루 줄 약속을 세 사용선과 네 비사용 골선 및 동남단 정지라는 모델 결정으로 좁혔음을 확인했다.
@evidence principles/design/models.md#representation-contract ridge part 하나와 아랫 가장자리의 가려진 접촉면을 정하고 골선은 slab 접힘과 잘린 기와 끝으로만 읽힌다는 표현 한계를 적는다.
@evidenceReview principles/design/models.md#representation-contract #41a7d98 `ridge` 한 part가 양 경사 위 발과 열린 끝 단면을 소유하며 골 기와를 새 부재로 만들지 않는 한계를 읽었다.
@evidence principles/design/models.md#spatial-convention 원점을 slab 용마루 선에 두고 +Z 용마루 방향, +Y 연직 위로 정한다. 높이는 경사각에 따른 Y0=0.02/cos(경사각)−0.13tan(경사각)에서 시작하고 X 폭 0.30m·Z 길이 0.45m다.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e slab 용마루 원점, +Z 방향, 경사각별 Y0와 X 폭을 식·점유 범위에 대조했다.
@evidence principles/design/models.md#reviewable-structure 한 단위와 세 단위 줄, 건물의 제실·동측 박공 용마루와 박공 끝 반원 단면을 보고 날카로운 용마루·뜬 덮개를 실패로 둔다.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b 한 장·세 장 줄과 박공 끝 반원 단면을 보고 뜬 덮개를 실패로 삼는 관찰이 실제 발 접촉을 드러내는지 확인했다.
@evidence principles/design/models.md#model-observable-style-basis 이미지 01의 제실·동측 날개 용마루를 따라 이어진 굵은 기와 줄을 근거로 한다.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 이미지 01의 굵은 용마루 줄이 0.13m 몸통과 겹침 코라는 볼 수 있는 형상 결정으로 옮겨졌는지 확인했다.
@evidence principles/design/models.md#model-scale-layer-completion 세 용마루의 높이와 막는 부재 유무, 코핑과의 높이 대조가 함께 정해져 용마루 층이 완결된다.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e 세 용마루별 막는 부재와 높이 계산, 끊는 위치가 모두 정해져 source가 골선 사용 여부를 새로 고르지 않는지 확인했다.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work 동측 박공이 22°였을 때 slab 용마루 약 4.73m가 코핑 아랫면 4.69m보다 높아 덮개를 받을 수 없었다. spaces/roofs/east.md#east-roof와 roofs/assembly.md#roof-junctions의 동측 경사를 19°로 고치고 junctions.md#gable-closures에 덮개가 코핑 안쪽 돌출 끝에서 멈추는 행을 더한 뒤(a2153151) 이 단위를 다시 정했다.
@evidenceReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 옛 22도 slab 약 4.73m는 코핑 하단 4.69m를 넘었고, 수리된 19도 slab 약 4.53m에 덮개 최대 Y0+0.15m를 더하면 4.656m다. junctions의 기와 약 4.63m는 옛 0.10m 추정으로 읽고, 부모의 돌출 끝 정지·코핑 높이를 그대로 적용하는지 대조했다.
@evidence settings/20-envelope.md#roof-form 박공 용마루를 덮는 기와 줄을 반원 덮개 단위로 받는다.
@evidenceReview settings/20-envelope.md#roof-form #7269ea1 박공의 용마루 기와 줄 요구가 독립 `ridge` 덮개로 실현되고 골선에는 옮겨지지 않는지 확인했다.
@evidence spaces/roofs/east.md#east-roof 수리된 19° 동측 박공의 용마루 약 4.53m를 덮개 높이 대조에 쓴다.
@evidenceReview spaces/roofs/east.md#east-roof #674b805 동측 19도·약 4.53m를 Y0+0.15m 식에 넣어 코핑 아래 여유 약 0.034m가 생기는지 대조했다.
@evidence spaces/roofs/assembly.md#roof-junctions 수리된 동측 경사와 네 골선을 용마루 기와가 쓰이는 곳과 쓰이지 않는 곳의 경계로 쓴다.
@evidenceReview spaces/roofs/assembly.md#roof-junctions #1812a91 assembly가 네 골선을 분류한다는 사실과 이 H2의 골선 비사용 선언이 일치하는지 확인했다.
@evidence spaces/junctions.md#gable-closures SE 모서리의 용마루 덮개가 south-inner−0.06m의 코핑 안쪽 돌출 끝에서 멈추는 폐쇄 행을 정지 위치로 소비한다.
@evidenceReview spaces/junctions.md#gable-closures #4ca854c 동남단 덮개 줄의 마지막 절단면을 south-inner−0.06m의 코핑 안쪽 돌출 끝에 두어 폐쇄 표의 정확한 위치를 받았는지 확인했다.
@evidence spaces/junctions.md#plinth-coping 코핑 아랫면 4.69m를 덮개 최대 높이 0.15m를 더한 실제 용마루 높이의 정지 기준으로 쓴다.
@evidenceReview spaces/junctions.md#plinth-coping #711b673 4.69m 코핑 하단과 덮개 상단 사이 0.01m 최저 여유가 본문 정지 조건에 들어 있는지 확인했다.
@evidence spaces/roofs/sanctuary.md#sanctuary-roof 제실 용마루 약 7.67m를 막는 부재가 없는 용마루로 쓴다.
@evidenceReview spaces/roofs/sanctuary.md#sanctuary-roof #74ec06b 제실 7.67m 용마루에는 위쪽 막음이 없어서 덮개가 계속될 수 있음을 확인했다.
@evidence spaces/roofs/porch.md#porch-roof 두 반환벽 코핑 사이 포치 용마루 약 4.67m를 막는 부재가 없는 용마루로 쓴다.
@evidenceReview spaces/roofs/porch.md#porch-roof #ec83370 포치 4.67m 용마루가 두 반환벽 사이에 있어 동측 코핑 정지 규칙을 잘못 공유하지 않음을 확인했다.
@evidence settings/50-production.md#references 이미지 01의 제실·동측 날개 용마루 기와 줄을 근거로 쓴다.
@evidenceReview settings/50-production.md#references #eb34a79 이미지 01의 제실·동측 박공 줄을 근거로 지명하고 골 기와의 모습까지 참조에서 추론하지 않았는지 확인했다.
-->

박공 지붕의 용마루를 덮는 반원 덮개다. 이미지 01의 제실·동측 날개 용마루를 따라 이어진 굵은 기와 줄이 근거다. 제실·동측 박공·포치의 세 용마루에 쓰이고, 외쪽 지붕의 파라펫 쪽 높은 끝과 네 골선에는 쓰지 않는다. 골선은 slab 접힘과 그 선에서 잘린 기와 끝으로만 읽히며 별도 골 기와를 만들지 않는 것이 이 표현 상한의 한계다.

로컬 원점은 slab 용마루 선 위의 단위 앞끝 Z=0이고 로컬 +Z가 용마루 방향, +Y가 연직 위, X가 양 경사를 가로지르는 방향이다. 그 박공의 경사각 α(동측 19°, 제실·포치 22°)에서 덮개 아랫 가장자리의 Y 기준은 `Y0=0.02m/cos(α)−0.13m×tan(α)`다. 평기와의 0.02m 두께는 경사면 법선 방향이므로 단면 전체의 윗면은 `Ytile(X)=0.02m/cos(α)−|X|tan(α)`다. 반원통 껍질은 길이 0.45m·반원 둘레 12분할이며 뒤쪽 0.40m 구간(0.05≤Z≤0.45m)은 바깥 반지름 0.13m·두께 0.02m다. 앞쪽 0.05m 겹침 코는 바깥 반지름 0.15m·안쪽 반지름 0.13m로 바깥쪽에 올려, 0.40m 피치로 놓였을 때 아래 단위 뒷구간 바깥면에 안쪽 면이 접한다. 두 구간 모두 해당 바깥 반지름 r(뒤 r=0.13m, 코 r=0.15m)에 대해 바깥 윗단면은 `Youter(X)=Y0+√(r²−X²)`다. 아랫단면은 |X|≤r−0.02m에서 `max(Y0+√((r−0.02m)²−X²),Ytile(X))`, r−0.02m<|X|≤r에서 `Ytile(X)`다. 12분할 반원 각 꼭짓점에 더해 안쪽 원호와 Ytile의 교차점은 24회 이분 탐색해 꼭짓점으로 넣는다. 발의 아랫면은 교차점부터 반지름 끝까지 지붕 경사를 따르므로 뒤쪽 띠가 평기와를 파지 않는다. 코의 |X|=0.13~0.15m 양 발은 Y0에서 Ytile(0.15m)까지 내려간 짧은 끝면을 가지므로 뜨지 않는다. 줄 맨 앞 노출 단위의 코도 이 단면 절삭식을 쓰고 Z=0에서만 열린 끝을 닫는다. Z=0.05m에는 반지름 0.02m의 단차 끝면을 둔다. 내부 이음에 겹친 끝면을 중복 cap으로 만들지 않고 노출·절단 끝에서만 두께 단면을 닫는다. Y 점유는 `Ytile(0.15m)`부터 `Y0+0.15m`, X=−0.15~+0.15m, Z=0~0.45m다. 양쪽 경사의 [평기와 판](cladding.md#roof-tile)은 용마루 앞 0.16m에서 둥근기와와 턱을 멈추고 기본 판만 이어서 뒤쪽 덮개 발 X=±0.13m와 코 발 X=±0.15m를 받친다.

부재 대응: `ridge`=덮개.

part와 표면은 `ridge` 하나다. 뒤쪽 발 X=±0.13m와 겹침 코 발 X=±0.15m는 양쪽 평기와 판 위에 닿는 가려진 접촉면이다. 용마루 길이와 배치 수는 instances가 각 용마루 선에서 유도한다. 동측 박공 남쪽 끝에서 slab 용마루 상면 약 4.53m에 19°의 `Y0+0.15m`를 더하면 약 4.656m다. 코핑 아랫면 4.69m까지 약 0.034m이므로 0.01m 여유를 확보한다. 동측 박공의 용마루 덮개 줄은 [박공 폐쇄](../spaces/junctions.md#gable-closures)가 정한 south-inner−0.06m, 곧 코핑 안쪽 돌출 끝에서 멈춘다. instances는 그 위치까지 온전한 단위를 놓고 마지막 단위를 그 평면에서 잘라 남쪽 끝면을 닫는다. 실제 높이와 해당 경사각의 `Y0+0.15m`도 코핑 아랫면과 대조해 0.01m 여유가 없으면 그 앞에서 멈춘다. 공간 인터페이스 보고: 동측 박공이 22°였을 때 slab 용마루가 약 4.73m로 올라 코핑 아랫면 4.69m를 넘었고, spaces가 [동측 박공](../spaces/roofs/east.md#east-roof)을 19°로 고쳐 받을 수 있게 되었다. 제실 용마루(약 7.67m)와 포치 용마루(약 4.67m, 두 반환벽 코핑 사이)는 막는 부재가 없다.

검토 판에서 한 단위와 세 단위 줄을 보고, 건물 관찰에서 제실과 동측 박공의 용마루가 기와 줄로 읽히는지와 박공 끝에서 반원 단면이 보이는지 확인한다. 용마루 없이 두 경사면이 날카롭게 만나는 박공, 용마루 위로 뜬 덮개는 실패다.

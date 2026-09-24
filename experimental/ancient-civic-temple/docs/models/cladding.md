# 지붕을 덮는 모듈

## 둥근기와와 평기와 {#roof-tile}

<!--
@evidence principles/core/common.md#scope-preservation 평기와와 둥근기와 한 쌍을 한 단위로 삼아 치수·겹침·표면·빈 공간·배치 소유와 코핑과의 높이 관계까지 정한다.
@evidence principles/core/common.md#substantive-completion 평기와 0.40×0.52×0.02m와 턱, 둥근기와 반지름 0.085→0.075m·8분할, 겹침 0.08m·노출 0.44m가 있어 source가 기와를 다시 고르지 않는다.
@evidence principles/core/common.md#declared-basis 지붕 형태는 20-envelope#roof-form, 세 지붕 끝 높이는 roofs/west·colonnade#south-canopy·east와 roofs/assembly, 코핑 아랫면 4.69m는 junctions#plinth-coping에서 온다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 곡면 기와 지붕이라는 설정을 반복 단위·줄 방향·코핑 아래로 들어가는 끝이라는 모델 결정으로 바꾼다.
@evidence principles/design/models.md#representation-contract tegula·imbrex 두 part와 표면, 평기와 아랫면의 slab 접촉, 처마 끝에서만 보이는 둥근기와 안쪽 빈 공간을 정한다.
@evidence principles/design/models.md#spatial-convention 원점을 처마 쪽 아래 모서리 선 중심, +Z 경사 오름, +Y 지붕 면 법선, X 경사 가로로 둔다.
@evidence principles/design/models.md#reviewable-structure 한 단위와 3×3 배열의 세 시점, 건물의 반원 덮개 줄 읽힘을 보고 평판 무늬·어긋난 줄·파라펫을 뚫는 기와를 실패로 둔다.
@evidence principles/design/models.md#model-observable-style-basis 이미지 01·03의 반원 덮개 줄과 처마 끝 반원 단면을 근거로 하고 기와 한 장씩의 불규칙과 결은 주장하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 단위 치수·줄 간격 0.40m 소유·slab 위 약 0.10m 높이가 코핑과 대조돼 반복 모듈 층이 완결된다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work 기와 높이 약 0.10m를 더한 서측 외쪽 지붕 약 4.66m, 남쪽 주랑 외쪽 지붕 약 4.05m, 동측 19° 박공 남쪽 끝 약 4.63m를 코핑 아랫면 4.69m에 대조했고 모두 아래라 기와 줄 때문에 고칠 부모가 없었다.
@evidence settings/20-envelope.md#roof-form 흙빛 붉은 곡면 기와의 경사지붕을 평기와·둥근기와 단위로 받는다.
@evidence spaces/junctions.md#plinth-coping 코핑 아랫면 4.69m를 기와 줄 끝이 들어가야 할 높이 상한으로 쓴다.
@evidence spaces/roofs/assembly.md#roof-junctions 합성 지붕 조각의 경계와 골선을 instances가 단위를 자를 기준으로 넘긴다.
@evidence spaces/roofs/west.md#west-roof 서측 외쪽 지붕 높은 끝 약 4.66m를 코핑 대조의 한 끝으로 쓴다.
@evidence spaces/roofs/colonnade.md#south-canopy 남쪽 주랑 외쪽 지붕 높은 끝 약 4.05m를 코핑 대조의 한 끝으로 쓴다.
@evidence spaces/roofs/east.md#east-roof 19도 동측 박공의 남쪽 용마루 부근 약 4.63m를 코핑 대조의 한 끝으로 쓴다.
@evidence settings/50-production.md#references 이미지 01·03의 경사를 따라 내려오는 반원 덮개 줄과 처마 끝 반원 단면을 근거로 쓴다.
-->

[경사지붕과 처마](../settings/20-envelope.md#roof-form)의 흙빛 붉은 곡면 기와다. 이미지 01·03의 지붕에서 반원형 덮개 기와의 줄이 경사를 따라 내려오고 처마 끝에서 반원 단면이 드러나는 것이 근거다. 평기와 한 장과 그 이음을 덮는 둥근기와 한 장을 한 단위로 삼으며 기와 한 장씩의 불규칙이나 표면 결은 주장하지 않는다.

로컬 원점은 단위의 처마 쪽 아래 모서리 선의 중심이며 지붕 slab 상면 위에 놓인다. 로컬 +Z는 경사를 따라 오르는 방향, +Y는 지붕 면의 법선, X는 경사를 가로지르는 방향이다. 평기와는 폭 0.40m·길이 0.52m·두께 0.02m 판이고 두 긴 가장자리에 폭 0.03m·높이 0.04m의 턱이 선다. 둥근기와는 평기와 한쪽 긴 가장자리 위에 얹히는 반원통 껍질이며 바깥 반지름이 처마 쪽 0.085m에서 위쪽 0.075m로 줄고 두께 0.015m, 길이 0.52m, 반원을 8분할한다. 한 줄에서 위 단위는 아래 단위를 0.08m 겹쳐 노출 길이가 0.44m다. 점유 상자는 0.40×약 0.10×0.52m다.

part와 표면은 `tegula`, `imbrex`로 나눠 materials가 두 기와의 색을 조금 달리할 수 있다. 평기와 아랫면은 slab 상면에 닿는 가려진 접촉면이다. 둥근기와 안쪽은 처마 끝에서만 보이는 빈 공간이다. 배치 수, 줄 간격 0.40m, 줄 방향, 조각 경계와 골선에서 잘리거나 빠지는 단위는 instances가 합성 지붕 조각에서 유도한다. 기와가 slab 위에 더하는 높이(약 0.10m)를 더해도 코핑 아랫면 4.69m와 만나는 세 지붕 끝, 곧 서측 외쪽 지붕(약 4.66m), 남쪽 주랑 외쪽 지붕(약 4.05m), 19도 동측 박공의 남쪽 용마루 부근(약 4.63m)은 모두 [코핑](../spaces/junctions.md#plinth-coping) 아랫면보다 낮아 기와 줄이 코핑 안쪽 돌출 아래로 들어간다.

검토 판에서 한 단위와 3×3 배열을 정면·측면·3/4로 보고 반원 덮개 줄과 겹침 단차, 처마 끝 반원 단면이 읽히는지 확인한다. 건물 관찰에서는 리뷰 거리에서 지붕이 줄무늬 판이 아니라 반원 덮개 줄의 기와면으로 읽히는지 본다. 평판 위 무늬, 줄 방향이 경사와 어긋난 배치, 파라펫을 뚫고 나간 기와는 실패다.

## 용마루 기와 {#ridge-tile}

<!--
@evidence principles/core/common.md#scope-preservation 세 박공 용마루의 반원 덮개 단위를 치수·겹침·접촉·배치 소유와 동측 박공 남쪽 끝의 정지 규칙까지 정하고 골 기와를 만들지 않는 한계를 밝힌다.
@evidence principles/core/common.md#substantive-completion 바깥 반지름 0.13m·두께 0.02m·길이 0.45m·12분할, 겹침 0.05m, south-inner 0.06m 앞 정지가 있어 source가 용마루를 다시 고르지 않는다.
@evidence principles/core/common.md#declared-basis 세 용마루 높이는 roofs/sanctuary(약 7.67m)·east(약 4.53m)·porch(약 4.67m), 정지 규칙은 junctions#gable-closures, 코핑 4.69/4.85m는 #plinth-coping에서 온다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 용마루 기와 줄이라는 설정을 쓰이는 세 용마루와 쓰이지 않는 네 골선·외쪽 높은 끝, 코핑 앞 정지라는 모델 결정으로 바꾼다.
@evidence principles/design/models.md#representation-contract ridge part 하나와 아랫 가장자리의 가려진 접촉면을 정하고 골선은 slab 접힘과 잘린 기와 끝으로만 읽힌다는 표현 한계를 적는다.
@evidence principles/design/models.md#spatial-convention 원점을 단위 아래 모서리 선 중심, +Z 용마루 방향, +Y 위로 두고 점유 상자 0.26×0.13×0.45m를 적는다.
@evidence principles/design/models.md#reviewable-structure 한 단위와 세 단위 줄, 건물의 제실·동측 박공 용마루와 박공 끝 반원 단면을 보고 날카로운 용마루·뜬 덮개를 실패로 둔다.
@evidence principles/design/models.md#model-observable-style-basis 이미지 01의 제실·동측 날개 용마루를 따라 이어진 굵은 기와 줄을 근거로 한다.
@evidence principles/design/models.md#model-scale-layer-completion 세 용마루의 높이와 막는 부재 유무, 코핑과의 높이 대조가 함께 정해져 용마루 층이 완결된다.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work 동측 박공이 22°일 때 덮개 윗면이 약 4.96m로 코핑 윗면 4.85m 위로 나와 이 단위를 받을 수 없었다. spaces/roofs/east.md#east-roof와 roofs/assembly.md#roof-junctions의 동측 경사를 19°로 고치고 junctions.md#gable-closures에 덮개가 코핑 안쪽 돌출 끝에서 멈추는 행을 더한 뒤(a2153151) 이 단위를 다시 정했다.
@evidence settings/20-envelope.md#roof-form 박공 용마루를 덮는 기와 줄을 반원 덮개 단위로 받는다.
@evidence spaces/roofs/east.md#east-roof 수리된 19° 동측 박공의 용마루 약 4.53m를 덮개 높이 대조에 쓴다.
@evidence spaces/roofs/assembly.md#roof-junctions 수리된 동측 경사와 네 골선을 용마루 기와가 쓰이는 곳과 쓰이지 않는 곳의 경계로 쓴다.
@evidence spaces/junctions.md#gable-closures SE 모서리의 용마루가 코핑 아래에서 멈추는 폐쇄 행을 덮개 정지 위치로 소비한다.
@evidence spaces/junctions.md#plinth-coping 코핑 아랫면 4.69m와 윗면 4.85m를 덮개 윗면 약 4.76m의 대조 기준으로 쓴다.
@evidence spaces/roofs/sanctuary.md#sanctuary-roof 제실 용마루 약 7.67m를 막는 부재가 없는 용마루로 쓴다.
@evidence spaces/roofs/porch.md#porch-roof 두 반환벽 코핑 사이 포치 용마루 약 4.67m를 막는 부재가 없는 용마루로 쓴다.
@evidence settings/50-production.md#references 이미지 01의 제실·동측 날개 용마루 기와 줄을 근거로 쓴다.
-->

박공 지붕의 용마루를 덮는 반원 덮개다. 이미지 01의 제실·동측 날개 용마루를 따라 이어진 굵은 기와 줄이 근거다. 제실·동측 박공·포치의 세 용마루에 쓰이고, 외쪽 지붕의 파라펫 쪽 높은 끝과 네 골선에는 쓰지 않는다. 골선은 slab 접힘과 그 선에서 잘린 기와 끝으로만 읽히며 별도 골 기와를 만들지 않는 것이 이 표현 상한의 한계다.

로컬 원점은 단위 아래 모서리 선의 중심이고 로컬 +Z가 용마루 방향, +Y가 위다. 반원통 껍질의 바깥 반지름 0.13m, 두께 0.02m, 길이 0.45m이며 12분할한다. 한 줄에서 다음 단위가 0.05m 겹친다. 점유 상자는 0.26×0.13×0.45m다.

part와 표면은 `ridge` 하나다. 아랫 가장자리는 양쪽 기와 줄 위에 닿는 가려진 접촉면이다. 용마루 길이와 배치 수는 instances가 각 용마루 선에서 유도한다. 동측 박공의 남쪽 끝에서는 용마루 상면 약 4.53m 위 기와 윗면이 약 4.63m, 덮개 윗면이 약 4.76m로 남측 코핑 아랫면 4.69m보다 높으므로 덮개 줄은 south-inner에서 0.06m 앞, 곧 코핑 안쪽 돌출 끝에서 멈춘다. 덮개 윗면은 코핑 윗면 4.85m보다 낮아 정면 파라펫 위로 나오지 않는다. 공간 인터페이스 보고: 박공이 22도였을 때 이 덮개는 약 4.96m로 코핑 윗면 위로 나와 받을 수 없었고, spaces가 [동측 박공](../spaces/roofs/east.md#east-roof)을 19도로 고쳐 받을 수 있게 되었다. 제실 용마루(약 7.67m)와 포치 용마루(약 4.67m, 두 반환벽 코핑 사이)는 막는 부재가 없다.

검토 판에서 한 단위와 세 단위 줄을 보고, 건물 관찰에서 제실과 동측 박공의 용마루가 기와 줄로 읽히는지와 박공 끝에서 반원 단면이 보이는지 확인한다. 용마루 없이 두 경사면이 날카롭게 만나는 박공, 용마루 위로 뜬 덮개는 실패다.

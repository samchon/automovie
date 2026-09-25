# 용기와 기록물

## 큰 저장 항아리 {#storage-jar}

<!--
@evidence principles/core/common.md#scope-preservation 큰 저장 항아리를 회전체 윤곽 다섯 점·열린 입·어깨 손잡이 두 개까지 정한다.
@evidence principles/core/common.md#substantive-completion 높이별 반지름과 입 안쪽 깊이, ±X 어깨에 로컬 XY 평면으로 향하는 두 고리 손잡이의 중심·원환 치수, 몸체 16분할을 확정해 source가 항아리 손잡이 방향을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 윤곽 구성은 35-objects#vessels, 쓰이는 곳은 30-interiors#storage와 #service-yard, 형태는 이미지 02·05에서 온다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 도기 설정을 배·어깨·목·입술 네 구간과 열린 입이라는 모델 결정으로 바꾼다.
@evidence principles/design/models.md#representation-contract body·handle part와 입 안쪽 0.15m의 보이는 빈 공간, 부드러운 법선을 정한다.
@evidence principles/design/models.md#spatial-convention 원점을 바닥면 중심에 두고 점유 상자 약 0.56×0.70×0.56m를 적는다.
@evidence principles/design/models.md#reviewable-structure 측면 실루엣의 네 구간과 열린 입을 보고 구체·원통·막힌 입을 실패로 둔다.
@evidence principles/design/models.md#model-observable-style-basis 이미지 02·05의 벽을 따라 선 큰 항아리를 근거로 한다.
@evidence principles/design/models.md#model-scale-layer-completion 윤곽과 크기군 반복 소유가 정해져 저장 용기 층이 완결된다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work vessels의 구성과 storage·service-yard의 벽 따라 놓인 큰 항아리를 높이 0.70m에 대조했고 부모를 고칠 모순이 없었다.
@evidence settings/35-objects.md#vessels 바닥·부푼 배·좁은 목·입술과 열린 입의 도기 구성을 큰 항아리 윤곽으로 받는다.
@evidence settings/30-interiors.md#storage 보관실 벽을 따라 놓인 큰 도기 항아리를 이 prototype으로 받는다.
@evidence settings/30-interiors.md#service-yard 서비스 마당의 소수 항아리를 같은 prototype으로 받는다.
@evidence settings/50-production.md#references 이미지 02·05의 큰 항아리를 근거로 쓴다.
@evidenceExclude spaces/rooms/service-yard.md#yard-volume 마당 volume의 열린 범위와 court-eave 상한은 항아리·바구니 prototype의 형상을 제약하지 않고 마당 안 위치와 수는 instances가 정해 어떤 모델도 이 volume을 소비하지 않는다.
-->

[보관실](../settings/30-interiors.md#storage)과 서비스 마당의 큰 도기 항아리다. [도기와 봉헌 그릇](../settings/35-objects.md#vessels)의 바닥·부푼 배·좁은 목·입술과 열린 입, 이미지 02·05의 벽을 따라 선 큰 항아리가 근거다.

로컬 원점은 바닥면 중심이다. 회전체 윤곽은 높이 0에서 반지름 0.10m(바닥), 0.40m에서 0.24m(배), 0.58m에서 0.18m(어깨), 0.64m에서 0.08m(목), 0.70m에서 0.10m(입술 바깥)로 이어지고 입술 안쪽은 반지름 0.08m에서 0.15m 깊이까지 파인다. 어깨의 작은 고리 손잡이 두 개(원환 반지름 0.04m, 굵기 0.015m)는 각각 중심 (X,Y,Z)=(±0.20,0.58,0)m이며 로컬 XY 평면에 세운다. 원환은 주환 16분할·관 8분할로 몸체 어깨에 닿고 두 손잡이는 서로 반대 X 방향으로 선다. 몸체 회전 16분할, 부드러운 법선이다. 점유 상자는 약 0.56×0.70×0.56m다.

part와 표면은 `body`, `handle`이다. 입 안쪽 0.15m가 보이는 빈 공간이다. 크기군 반복과 위치는 instances가 정한다.

검토 판에서 측면 실루엣의 배·어깨·목·입술 네 구간과 열린 입을 본다. 구체나 원통, 입이 막힌 항아리는 실패다.

## 운반 항아리 {#carry-jar}

<!--
@evidence principles/core/common.md#scope-preservation 운반 항아리를 윤곽 다섯 점·입 안쪽 깊이·목과 어깨를 잇는 세로 고리 손잡이 두 개까지 정한다.
@evidence principles/core/common.md#substantive-completion 몸체의 높이별 반지름과 입 안쪽 0.10m, ±X 손잡이의 두 부착점·바깥 제어점·곡선 분할·관 굵기를 정해 source가 곡선 경로를 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 몸체와 붙은 곡면 손잡이는 35-objects#vessels, 보관실의 손잡이 달린 운반 용기는 30-interiors#storage에서 온다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 도기 설정을 큰 항아리와 구별되는 중간 크기와 세로 고리 손잡이라는 모델 결정으로 바꾼다.
@evidence principles/design/models.md#representation-contract body·handle part와 손잡이 안쪽 고리·입 안쪽의 빈 공간을 정한다.
@evidence principles/design/models.md#spatial-convention 원점을 바닥면 중심에 두고 점유 상자 약 0.40×0.50×0.30m를 적는다.
@evidence principles/design/models.md#reviewable-structure 큰 항아리 옆에서 크기와 손잡이 형태가 다른 종류로 읽히는지 보고 몸체에서 떨어진 손잡이를 실패로 둔다.
@evidence principles/design/models.md#model-observable-style-basis 몸체에 붙은 곡면 손잡이라는 도기 설정을 형상으로 반증 가능하게 한다.
@evidence principles/design/models.md#model-scale-layer-completion 윤곽·손잡이와 위치 소유가 정해져 운반 용기 층이 완결된다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work vessels와 storage 설정의 손잡이 달린 운반 용기를 높이 0.50m 윤곽에 대조했고 부모를 고칠 모순이 없었다.
@evidence settings/35-objects.md#vessels 몸체와 붙은 곡면 손잡이 도기를 운반 항아리 윤곽으로 받는다.
@evidence settings/30-interiors.md#storage 보관실의 손잡이 달린 운반 용기를 이 prototype으로 받는다.
-->

손잡이 달린 중간 크기 운반 용기다. [도기와 봉헌 그릇](../settings/35-objects.md#vessels)의 몸체와 붙은 곡면 손잡이가 근거다.

로컬 원점은 바닥면 중심이다. 윤곽은 높이 0에서 반지름 0.07m, 0.28m에서 0.15m, 0.40m에서 0.10m, 0.45m에서 0.05m, 0.50m에서 0.06m이며 입 안쪽은 0.10m 깊이까지 파인다. 목과 어깨를 잇는 세로 고리 손잡이 두 개(관 반지름 0.018m)는 로컬 ±X 면에서 아래 부착점 (±0.15,0.28,0)m, 위 부착점 (±0.06,0.45,0)m을 잇는다. 각 경로는 아래점→(±0.20,0.30,0)→(±0.20,0.43,0)→위점을 제어점으로 하는 3차 베지어 곡선이며 길이 12분할·관 둘레 8분할이다. 몸체 회전 16분할이다. 점유 상자는 약 0.44×0.50×0.30m다.

part와 표면은 `body`, `handle`이다. 손잡이 안쪽 고리와 입 안쪽이 빈 공간이다. 위치는 instances가 정한다.

검토 판에서 큰 항아리 옆에 두어 크기와 손잡이 형태가 다른 종류로 읽히는지 본다. 손잡이가 몸체에서 떨어진 형상은 실패다.

## 작은 탁상 용기 {#small-vessel}

<!--
@evidence principles/core/common.md#scope-preservation 작은 탁상 용기를 윤곽 네 점·입 안쪽 깊이·손잡이 하나까지 정한다.
@evidence principles/core/common.md#substantive-completion 높이별 반지름과 입 안쪽 깊이에 +X 손잡이의 아래·위 부착점, 두 제어점과 12구간 경로·관 8분할을 더해 source가 손잡이 형상을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 높이 0.12~0.30m 탁상 용기 범위는 35-objects#vessels에서 오고 봉헌실·관리실·감실의 쓰임은 각 선반·감실 모델 H2가 받는다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 도기 설정을 좁은 목과 한쪽 손잡이의 0.20m 용기라는 모델 결정으로 바꾼다.
@evidence principles/design/models.md#representation-contract body·handle part와 입 안쪽 빈 공간을 정한다.
@evidence principles/design/models.md#spatial-convention 원점을 바닥면 중심에 두고 점유 상자 약 0.20×0.20×0.16m를 적는다.
@evidence principles/design/models.md#reviewable-structure 한 손잡이와 좁은 목을 보고 작은 원통을 실패로 둔다.
@evidence principles/design/models.md#model-observable-style-basis 탁상 용기 범위를 손잡이와 좁은 목이라는 관찰 결정으로 좁힌다.
@evidence principles/design/models.md#model-scale-layer-completion 높이 0.20m가 탁상 범위 안이고 위치·수량 소유가 정해져 탁상 용기 층이 완결된다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work vessels의 0.12~0.30m 범위를 높이 0.20m에 대조했고 감실 칸 0.80m·선반 칸 높이 안에 들어 부모를 고치지 않았다.
@evidence settings/35-objects.md#vessels 높이 0.12~0.30m 탁상 용기 범위를 0.20m 용기로 받는다.
-->

봉헌실·관리실·감실의 작은 도기다. [도기와 봉헌 그릇](../settings/35-objects.md#vessels)의 높이 0.12~0.30m 탁상 용기가 근거다.

로컬 원점은 바닥면 중심이다. 윤곽은 높이 0에서 반지름 0.05m, 0.10m에서 0.08m, 0.16m에서 0.035m, 0.20m에서 0.045m이며 입 안쪽이 0.05m 깊이까지 파인다. 한쪽 +X의 고리 손잡이(관 반지름 0.01m)는 아래 부착점 (0.08,0.10,0)m에서 제어점 (0.10,0.10,0)m·(0.10,0.16,0)m를 지나 위 부착점 (0.035,0.16,0)m으로 이어지는 3차 베지어 곡선이다. 경로 12분할·관 둘레 8분할, 몸체 회전 12분할이다. 점유 상자는 약 0.22×0.20×0.16m다.

part와 표면은 `body`, `handle`이다. 위치와 수량은 instances가 정한다.

검토 판에서 한 손잡이와 좁은 목을 본다. 작은 원통은 실패다.

## 얕은 봉헌 그릇 {#offering-bowl}

<!--
@evidence principles/core/common.md#scope-preservation 얕은 봉헌 그릇을 지름·높이·테두리 두께·오목면·굽까지 정한다.
@evidence principles/core/common.md#substantive-completion 지름 0.22m·높이 0.06m, 테두리 0.012m, 바닥 위 0.015m까지 파인 오목면, 굽 치수, 24분할이 있어 source가 그릇을 다시 고르지 않는다.
@evidence principles/core/common.md#declared-basis 지름 0.15~0.30m와 두꺼운 테두리·오목한 안쪽은 35-objects#vessels에서, 놓이는 면은 제단·탁자·진열대 모델 H2에서 온다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 봉헌 그릇 설정을 얇은 테두리의 오목 껍질과 굽이라는 모델 결정으로 바꾸고 재료 선택은 materials에 남긴다.
@evidence principles/design/models.md#representation-contract bowl part 하나와 오목한 안쪽 빈 공간을 정하고 금속·도기 선택을 materials에 넘긴다.
@evidence principles/design/models.md#spatial-convention 원점을 바닥면 중심에 두고 점유 상자 0.22×0.06×0.22m를 적는다.
@evidence principles/design/models.md#reviewable-structure 측면의 얇은 테두리와 오목한 안쪽을 보고 납작한 원판을 실패로 둔다.
@evidence principles/design/models.md#model-observable-style-basis 두꺼운 테두리와 오목한 안쪽이라는 설정을 측면 윤곽으로 반증 가능하게 한다.
@evidence principles/design/models.md#model-scale-layer-completion 치수가 제단 상판 1.40×0.75m 위에 놓일 규모이고 위치 소유가 정해져 봉헌 그릇 층이 완결된다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work vessels의 지름 범위와 제단·탁자·진열대 윗면을 지름 0.22m에 대조했고 모두 올릴 수 있어 부모를 고치지 않았다.
@evidence settings/35-objects.md#vessels 지름 0.15~0.30m, 두꺼운 테두리와 오목한 안쪽의 그릇을 0.22m 그릇으로 받는다.
-->

제단·봉헌 탁자·진열대의 얕은 그릇이다. [도기와 봉헌 그릇](../settings/35-objects.md#vessels)의 지름 0.15~0.30m, 두꺼운 테두리와 오목한 안쪽 면이 근거다.

로컬 원점은 바닥면 중심이다. 지름 0.22m·높이 0.06m 껍질이며 테두리 두께 0.012m, 안쪽은 반구에 가까운 오목면으로 바닥 위 0.015m까지 파이고 아래에 지름 0.08m·높이 0.01m의 굽이 있다. 회전 24분할이다. 점유 상자는 0.22×0.06×0.22m다.

part와 표면은 `bowl` 하나이며 materials가 금속 또는 도기를 고른다. 오목한 안쪽이 빈 공간이다. 위치는 instances가 정한다.

검토 판에서 측면으로 얇은 테두리와 오목한 안쪽을 본다. 납작한 원판은 실패다.

## 운반 바구니 {#basket}

<!--
@evidence principles/core/common.md#scope-preservation 운반 바구니를 벌어지는 원통 껍질·안쪽 바닥·띠와 살의 요철·테두리까지 정한다.
@evidence principles/core/common.md#substantive-completion 지름·높이·벽 두께, 열 줄 띠와 24개 세로 살의 폭 0.012m·0.004m 돌출, 테두리 원환을 확정해 source가 세로 살 단면을 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis 구성은 35-objects#baskets, 쓰이는 곳은 30-interiors#storage·#service-yard, 형태는 이미지 02·05에서 온다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 짠 바구니 설정을 그림 판이 아닌 띠·살 요철의 기하라는 모델 결정으로 바꾼다.
@evidence principles/design/models.md#representation-contract wall·rim·floor part와 위로 열린 빈 공간을 정한다.
@evidence principles/design/models.md#spatial-convention 원점을 바닥면 중심에 두고 점유 상자 0.40×0.32×0.40m를 적는다.
@evidence principles/design/models.md#reviewable-structure 가까이서 띠와 살의 요철, 멀리서 둥근 테두리를 보고 매끈한 통·무늬만 그린 원통을 실패로 둔다.
@evidence principles/design/models.md#model-observable-style-basis 이미지 02·05의 둥근 몸체와 테두리를 근거로 하고 짜임 무늬를 texture로 대신하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 요철 규모가 리뷰 거리와 맞고 위치·수 소유가 정해져 바구니 층이 완결된다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work baskets 구성과 storage·service-yard의 바구니를 지름 0.40m에 대조했고 부모를 고칠 모순이 없었다.
@evidence settings/35-objects.md#baskets 황갈색 짠 운반 바구니를 띠·살 요철의 원통 껍질로 받는다.
@evidence settings/30-interiors.md#storage 보관실의 짠 바구니를 이 prototype으로 받는다.
@evidence settings/30-interiors.md#service-yard 서비스 마당의 운반 바구니를 같은 prototype으로 받는다.
@evidence settings/50-production.md#references 이미지 02·05의 둥근 몸체와 테두리를 근거로 쓴다.
-->

[운반 바구니](../settings/35-objects.md#baskets)의 황갈색 짠 바구니다. 이미지 02·05의 둥근 몸체와 테두리가 근거다. 짜임은 리뷰 거리에서 띠와 살의 요철로 표현하며 전면 그림 판을 쓰지 않는다.

로컬 원점은 바닥면 중심이다. 지름 0.40m·높이 0.32m의 약간 벌어지는 원통 껍질(아래 반지름 0.18m, 위 0.20m, 벽 두께 0.015m)이며 바닥 위 0.02m에 안쪽 바닥이 있다. 벽은 높이 방향 열 줄의 띠가 번갈아 0.004m씩 바깥으로 나오고, 24개의 세로 살은 둘레를 따라 중심각 15°마다 놓이며 각 살의 접선 방향 폭은 0.012m, 바깥 돌출은 0.004m다. 테두리는 굵기 0.015m 원환이다. 회전 24분할이다. 돌출 살과 테두리까지의 점유 상자는 약 0.43×0.32×0.43m다.

part와 표면은 `wall`, `rim`, `floor`다. 속은 위로 열린 빈 공간이다. 보관실·마당의 위치와 수는 instances가 정한다.

검토 판에서 가까이서 띠와 살의 요철, 멀리서 둥근 테두리를 본다. 매끈한 통, 무늬만 그린 원통은 실패다.

## 두루마리 {#scroll}

<!--
@evidence principles/core/common.md#scope-preservation 두루마리를 말린 한 개·세 개 묶음·펼친 한 장의 세 변형과 말림 심·끈까지 정한다.
@evidence principles/core/common.md#substantive-completion 반지름 0.03m·길이 0.28m 원통과 심 돌출 0.004m, 끈 굵기, 펼친 장 0.25×0.35m와 말린 끝, 세 변형 점유 상자가 있어 source가 두루마리를 다시 고르지 않는다.
@evidence principles/core/common.md#declared-basis 구성은 35-objects#scrolls, 칸 선반에 놓임은 30-interiors#records, 형태는 이미지 02·05, 글자 없음은 10-building#civic-identity에서 온다고 밝힌다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 두루마리 설정을 세 변형과 끝면 심·끈으로 막대와 구별되는 모델 결정으로 바꾼다.
@evidence principles/design/models.md#representation-contract sheet·tie part를 정하고 읽을 수 있는 글자가 없음을 적는다.
@evidence principles/design/models.md#spatial-convention 말린 두루마리의 원점을 원통 축 중심, 축을 로컬 X로 둔다.
@evidence principles/design/models.md#reviewable-structure 끝면의 말림 심과 끈이 돌·나무 막대와 구별되는지 보고 막힌 끝면·글자 있는 장을 실패로 둔다.
@evidence principles/design/models.md#model-observable-style-basis 이미지 02·05의 칸 안 원통 묶음과 책상 위 펼친 장을 근거로 한다.
@evidence principles/design/models.md#model-scale-layer-completion 세 변형이 칸 선반 칸(약 0.40×0.30m)과 책상 상판에 맞고 수량 소유가 정해져 기록물 층이 완결된다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work scrolls 구성과 records의 칸 선반 보관, civic-identity의 가짜 비문 금지를 세 변형에 대조했고 칸에 들어가 부모를 고치지 않았다.
@evidence settings/35-objects.md#scrolls 말린 기록물을 세 변형의 두루마리로 받는다.
@evidence settings/30-interiors.md#records 기록실 칸 선반의 마른 두루마리를 이 prototype으로 받는다.
@evidence settings/10-building.md#civic-identity 고대 언어의 가짜 비문을 만들지 않는다는 정체성을 글자 없는 펼친 장으로 받는다.
@evidence settings/50-production.md#references 이미지 02·05의 칸 안 원통 묶음과 펼친 한 장을 근거로 쓴다.
-->

[두루마리](../settings/35-objects.md#scrolls)의 말린 기록물이다. 이미지 02·05의 칸 안에 눕혀진 원통 묶음과 책상 위 펼친 한 장이 근거이며 읽을 수 있는 글자는 없다. 말린 한 개, 세 개 묶음, 펼친 한 장의 세 변형이다.

말린 두루마리는 로컬 원점이 원통 축의 중심이고 축은 로컬 X다. 반지름 0.03m·길이 0.28m 원통의 양끝 면에 반지름 0.012m의 말림 심이 0.004m 튀어나오고 가운데에 굵기 0.005m의 묶음 끈 고리가 돈다. 세 개 묶음은 같은 두루마리 셋을 삼각으로 쌓고 한 끈으로 묶는다. 펼친 한 장은 0.25×0.35m·두께 0.002m 판의 양쪽 짧은 변에 반지름 0.02m의 말린 끝이 있다. 원통은 16분할이다. 점유 상자는 말린 것 0.28×0.06×0.06m, 묶음 0.28×0.11×0.12m, 펼친 것 0.25×0.04×0.43m다.

part와 표면은 `sheet`, `tie`다. 위치와 칸별 수량은 instances가 정한다.

검토 판에서 끝면의 말림 심과 끈이 돌이나 나무 막대와 구별되는지 본다. 끝면이 막힌 원통, 글자가 있는 펼친 장은 실패다.

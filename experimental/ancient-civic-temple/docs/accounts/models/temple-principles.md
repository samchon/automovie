# 신전 모델의 공통 축척과 UV0 결산

이 계정은 건물 부재와 대략적인 소품을 포함한 모델 원형 전체에 같은 축척·UV0 규칙을 배정한다. 각 원형의 형상과 접촉 치수는 아홉 모델 설계 파일이 소유하며, 재료 반복 길이와 색은 materials가 소유한다.

## 전체 원형의 축척과 UV0 {#model-scale-uv-allocation}

<!--
@evidence contracts/principles-models.md#temple-reference-scale 아홉 모델 파일의 49개 원형 H2를 같은 0.6×0.4×1.9m 보행 포락과 미터 UV0 표에 대조한다. 원형 문서의 part 선언 138개를 재료 결속 표와 양방향 비교하고, 방출 메시에서는 문짝 목재 장축·핀, 소품 다리·측판, 두루마리·손수레 원통, 이웃 지붕 경사의 U/V 방향을 각각 측정한다.
@evidenceReview contracts/principles-models.md#temple-reference-scale #7195f79 보행 포락은 부재 크기의 공통 비교 기준이고 UV0는 각 part의 로컬 좌표임을 구분했다. 원형 49개와 138개 part의 표면 주소 검사를 확인했으며, 책상 다리의 +Y U, 손수레 바퀴의 둘레 U·축 V, 앞 박공의 −X U와 세 경사의 처마→높은 쪽 V가 계약 표와 일치하는지 방출 정점에서 대조했다.
-->

[공통 기준](../../contracts/principles-models.md#temple-reference-scale)은 아홉 원형 문서의 49개 H2 전체에 적용된다. 각 원형은 자기 점유 상자와 원점·part를 결정하고, 설정의 보행 포락과 판정된 공간 순치수로 크기를 비교한다. `modelSources`의 아홉 class는 각자 정확히 한 원형 파일과 그 H2들을 구현한다. 이 계정은 그 파일 소유와 별개로 공통 규칙의 전체 적용을 결산한다.

[재료 결속 표](../../materials/10-model-bindings.md#binding-map)의 57개 행은 138개 part 주소를 빠짐없이 배정한다. `model-surface-binding` 감사는 반대로 표에만 있는 part도 거부한다. 방출 메시 검사는 UV0 존재에 더해 목재 결 방향, 두루마리·손수레의 원통 전개, 두 이웃 지붕의 앞·뒤·외쪽 경사 투영을 읽는다. 건물 부재의 형상은 이 UV 교정에서 변경하지 않았다. 소품의 세부 형상은 blocking 상한을 유지한다.

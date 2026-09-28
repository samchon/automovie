# 네이티브 증거 평가기 입력

## 선언과 평가 입력 {#agent-production-evidence-native-input}

### 네이티브 설정 경계 {#agent-production-evidence-native-boundary}

검증된 작품 전용 claim을 네이티브 평가기에 전달할 때 작품의 소유권 메타데이터는 평가기 입력에 섞이지 않아야 한다. 이 변환은 원본 선언을 수정하지 않고 claim 순서, 대상 선택, 단계에 따른 활성화, 심각도, 제외 허용 여부와 cardinality를 보존해야 한다. 모든 관계는 실제 인용과 제외의 근거를 요구하며, 추가 claim도 `evidenceReview`·`evidenceExcludeReview` companion이나 fingerprint 작성을 다시 요구할 수 없다.

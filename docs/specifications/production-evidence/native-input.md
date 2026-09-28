# 네이티브 증거 설정 변환

## 선언에서 평가 입력으로 {#spec-authoring-production-evidence-native-input}

### 네이티브 입력 투영 {#spec-authoring-production-evidence-native-boundary}

<!-- @evidence requirements/production-evidence/native-input.md#agent-production-evidence-native-boundary 작품의 소유권 선언을 보존하면서 네이티브 평가기 입력만 분리한다. -->

이미 소유권 검증을 마친 추가 claim마다 새 최상위 레코드를 만들고 작품 소유권 메타데이터를 제거한다. 원본 선언과 그 메타데이터는 manifest 판독을 위해 유지한다. 모든 reference도 새 레코드로 복사하고 `requireReview`를 `false`로 설정한다. 투영은 claim과 reference의 순서, 단계별 활성화, 심각도, exclusion 허용 여부, cardinality, host와 target selector를 보존한다. 단일 reference와 reference 배열, 처음부터 native 형식인 claim과 빈 claim 배열에도 같은 정책을 적용한다. 이 경계는 추가 claim이 companion과 fingerprint 요구를 복원하는 것을 막으며 실제 인용 의무를 줄이지 않는다.

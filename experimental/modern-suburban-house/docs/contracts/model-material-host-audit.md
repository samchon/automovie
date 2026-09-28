<!--
@evidence discovery/design/designs.md#work-specific-design-requirements 재료 H2가 face id를 쓰지 않고 물리 부재를 부르는 경우도 빠짐없이 제작자를 대조하려고 이 production의 역방향 계정을 둔다.
@evidenceReview discovery/design/designs.md#work-specific-design-requirements #1c8460c 발견 절의 부재 인계·호환성 요구를 읽고 이 계약의 모집단이 재료 파일 네 개라는 것을 docs/materials 파일 목록과 대조했다. 모델 계정 claim은 lint.config.ts의 house-model-material-host-audit 하나가 소유한다.
-->
# 재료 H2의 부재군 대조

이 주택의 네 재료 설계 파일 H2 전체에 적용한다.

## 재료 결합 대상을 H2마다 확인한다 {#model-material-host-audit}

재료 네 파일의 H2마다 결합 대상 또는 비결합 규칙을 한 번씩 적고, 결합 대상의 실제 제작 H2를 대조한다. 같은 어휘가 여러 부재에 붙을 때 호스트별 결속을 따로 확인하며 링크의 존재만으로 제작을 인정하지 않는다.

Review question: 모든 재료 H2의 대상과 제작자가 명시되고, 부정 문장을 양성 결합으로 읽지 않는가?

Sources: 사용자 판정 v-114 N2와 v-120 검사기 m7.

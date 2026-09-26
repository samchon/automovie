<!--
@evidence discovery/design/designs.md#work-specific-design-requirements 재료가 결합하는 이름만 있고 물리 부재가 없는 결함이 반복되어 이 production은 재료 H2 전부에서 face id의 설계 제작자를 역으로 대조한다.
@evidenceReview discovery/design/designs.md#work-specific-design-requirements #1c8460c 해당 발견 절의 branch 간 인터페이스·식별자·반증 관찰 요구를 읽고, 이 계약이 materials의 명명 면과 models의 물리 제작자를 잇는 별도 owner이며 models 계정 claim이 이 H2를 가리키는지 lint.config.ts에서 대조했다. 검사기의 실제 해상도는 모델 부재 문장을 따로 검토한다.
-->
# 모델과 재료의 면 결합 대조

models와 materials가 evidence 단계에 있는 이 주택의 모든 명명 재료 면에 적용한다.

## 재료 면마다 물리 제작자를 확인한다 {#model-material-face-audit}

재료 H2가 결합하는 각 (호스트 H2, face id)에는 같은 부재의 위치·크기·UV를 결정한 제작 H2가 있어야 한다. 다른 재료를 가리키는 부정 문장과 재질 경계 이름만 적힌 문장은 제작 증거가 아니다. 전체 재료 H2를 계정에 한 번씩 올리고 만든 부재, 비메시 UV 마스크, 아직 설계되지 않은 면을 구별한다.

Review question: 재료의 각 면 결합이 실제 치수와 좌표를 가진 단일 제작자에 닿는가?

Sources: 사용자 판정 v-117 B2, v-120 N2(c)와 검사기 돌연변이 M1–M4.

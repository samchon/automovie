<!--
@evidence discovery/design/designs.md#work-specific-design-requirements 외피·반복 모듈·마감이 같은 완결 면을 다른 기준으로 다시 소유하는 실패를 막기 위해 이 계약의 사전 분해 시한을 유지한다. spaces/03-surface-owners.md의 exterior-surface-handoff와 interior-surface-handoff가 입면·지붕·층·방의 한 저작자와 파일 책임을 배정하고 house-space-surface-ownership claim이 spaces에 적용된다. 아직 소스 파일과 surface census가 없어 예약을 실제 배정 완료로 읽지 않는다.
@evidenceReview discovery/design/designs.md#work-specific-design-requirements #1c8460c 계약의 ‘부재·반복 모듈·마감은 여러 branch가 관여해도 동일한 저작자 책임’과 외피 단계 이후 분해 금지를 branch 간 공유 조건 요구에 대조하고, lint.config.ts의 house-space-surface-ownership이 이 문서를 spaces에 거는 것을 확인했다.
@evidence discovery/core/common.md#shared-local-boundary 일반적인 경계 소유만으로는 입면·방·층의 완결 시각 표면을 1단계 폐쇄 전에 파일과 저작자에 배정하는 시한을 보장하지 못한다. 이 주택에서는 외피를 저작한 뒤 분해하는 실패를 막는 whole-surface-owner를 유지한다.
@evidenceReview discovery/core/common.md#shared-local-boundary #ae499c0 공유 경계 소유와 달리 완결 시각 면을 1단계 전에 저작자·파일에 배정해야 하는 시한이 독립적으로 남는다. 사후 분해 금지는 이 집의 이전 거대 소스 실패에 직접 대응한다.
@evidence discovery/core/common.md#canonical-realization settings/20-verification.md#surface-allocation은 실제 표면 목록을 spaces의 첫 인계에 두고 부재·모듈·마감이 그 소유를 이어받도록 정한다. house-surface-ownership claim은 이 계약을 settings H2 모집단에 연결하고 실제 표면 배정 완료라는 주장은 아직 하지 않는다.
@evidenceReview discovery/core/common.md#canonical-realization #5a6e541 whole-surface-owner가 surface-allocation 및 house-surface-ownership claim으로 연결되고 부재·반복·마감의 동일 면 인계를 요구한다. 이 연결은 실제 면별 배정 완료를 주장하지 않는다.
@evidence discovery/core/settings.md#directive-promise-subject-requirements 고정 공간 그래프·빈 차고는 settings/10-house.md에, 다섯 입력의 권위와 실제 3D 인계는 settings/20-verification.md에, 가족 사용 가정·접근·제작 범위는 settings/00-production.md에 분리했다. 거대 단일 소스로 완결 표면을 나누지 못했던 실패에서 이 파일의 사전 소유 분해 의무를 별도로 유지했다.
@evidenceReview discovery/core/settings.md#directive-promise-subject-requirements #1c99050 고정 그래프·빈 차고는 10, 입력 권위·GPU/CJS는 20, 가족 사용체·접근·제작 배분은 00의 실제 owner와 대조했다. 완결 면의 사전 분해 시한만 독립 계약으로 남겨 같은 질문의 별도 규칙 복제를 피했다.
-->
# 완결 표면의 소유

settings의 설계 인계와 매스/공간 그래프 폐쇄 시점에 적용하며 완결 시각 표면의 소유 분해를 판단한다.

## 1단계에서 닫히는 표면별 소유 분해 {#whole-surface-owner}

사용자가 요구한 적용 범위는 이 주택의 모든 시각적으로 완결된 표면이다. settings는 공간 그래프를 닫는 1단계의 산출물에 입면별·방별·층별 소유자와 실제 저작 파일의 선언이 포함됨을 보장한다. 한 표면에는 한 명의 소유자가 있고, 그 표면을 여러 저작자에게 쪼개지 않는다. 모서리·개구부 둘레·층판과 계단 구멍 같은 접합 경계도 배정한다. 같은 표면의 부재·반복 모듈·마감은 여러 branch가 관여해도 동일한 저작자 책임 아래 통합한다. 같은 벽의 외부 완결 면과 방 안쪽 면은 서로 다른 표면이지만 공유 구조의 기준은 하나여야 한다. 큰 파일 몇 개로 시작해 외피 단계 이후에 분해하는 방식은 이 경계를 충족하지 못한다.

Review question: 1단계 인계 전에 모든 입면·방·층과 경계면에 누락·중복 없는 소유 및 파일 배정이 있고 후속 부재·모듈·마감 저작이 그 완결 표면을 분할하지 않는가?

Sources: 사용자 브리프 「표면 분해」와 단계 1–4.

<!--
@evidence discovery/design/models.md#work-specific-model-requirements 임시 room source의 root 54개와 child 501개를 part 주소 또는 명명 퇴역으로 전수 대조해야 한다는 이 집의 인계 조건을 독립 obligation으로 보존한다. 공유 model 형상 의무만으로는 source 작성 지점과 새 part 사이의 1:1 퇴역 경계를 특정하지 못한다.
-->

# 기존 실내 물체의 모델 인계 계약

**Status:** 사용자 지시의 전체 실내 완성과 미소유 요소 금지를 적용하는 production-local obligation. 현재 `models`는 `draft`이며 이 계약이 모델 설계의 승인을 뜻하지 않는다.

## 모든 기존 물체 자식의 단일 목적지 {#legacy-fitout-child-destination}

현재 방 source가 생성하는 각 fit-out root와 그 모든 child ID는 [인계 계정](../accounts/models/legacy-fitout.md#legacy-root-correspondence)에서 하나의 안정적인 model prototype/part/face 주소 또는 이름을 적은 퇴역으로 대응한다. 동일한 후속 주소로 다른 child를 합치거나, 목적지 part가 실제 모델 설계 H2에 없는 상태를 성공으로 세지 않는다. `settings/003`이 정한 임시 메시의 퇴역 시점까지 source의 현재 물체는 임시 소비로 유지하고, models는 형상·part, instances는 배치, systems는 발광을 각각 결정한다.

이 의무는 특정 소파나 선반 하나의 충실도를 대신하지 않는다. 완료 경계는 임시 child의 전수 모집단과 모델 part 주소의 교차 검사에서 빈 목적지가 0이고, 의도적 제거는 이름으로 기록되며, 검사에 child 삭제·주소 삭제 돌연변이를 넣으면 실패하는 것이다. 화면에서 각 물체가 그 물체로 읽히는지는 이후 modelSources와 독립 시각 판정의 별도 질문이며 현재 `unverified`다.

Review question: 기존 방 물체의 모든 child가 실행 가능한 모델 주소 또는 명명 퇴역 한 곳에만 닿는가?

Authority: 사용자의 전체 실내 저작 브리프와 v-097 F2, v-115 B3의 전수 인계 지시.

Sources: [표면 소유](../settings/003-spatial-basis.md#surface-decomposition), [인계 계정](../accounts/models/legacy-fitout.md#legacy-root-correspondence).

<!--
@evidenceExclude discovery/design/designs.md#work-specific-design-requirements 활성 spaces·models 초안·materials를 대상으로 고정 그래프, 가구의 안정 part 주소와 방 배치의 분리, 실제 표면 마감, 다섯 reference, 비균일 scale·palette 및 CJS→viewer 전달을 대조했다. 건물 표면 형상은 spaces, 가구 형상과 part는 models, 그 배치와 반복은 instances, 색과 texture 결합은 materials, 광원 과정은 systems가 소유한다. 이 분기 경계와 공유 interface 질문 밖에 새 교차 분기 독립 규칙은 발견되지 않았고 고정 공간 그래프는 기존 citizen-house-spatial-requirements에 남아 있다.
@evidenceExcludeReview discovery/design/designs.md#work-specific-design-requirements #1c8460c 공간의 단일 그래프·완결 표면, 모델의 part 분할, 재료의 배정·좌표·관찰을 각각 대조했다. 표면 ID가 없는 가구 부재가 재료층으로 흘러가는 현 실패는 model representation-contract와 material surface-bindings의 서로 다른 질문이 함께 막으며, 배치는 instance 분기로 분리한다. PV·유리·식재 회귀는 같은 compiled 관찰에서 재검토하고 별도 고정 그래프는 local contract가 이미 강제하므로 추가 교차 계약은 발견되지 않았다.
@evidenceExclude discovery/design/materials.md#work-specific-material-requirements 현재 표면의 texture 부재, unit box의 scale 왜곡, door/floor 결 방향, 곡면 seam, white/green/oak의 서로 다른 용도, 절대 palette의 이중 tint, PV alpha와 유리 상태 회귀, 지원하지 않는 texture channel 및 ref01·03·05의 재료 읽힘을 조사했다. 그 결과는 materials 001의 전달/metric binding, 002~006의 각 실제 면별 마감과 007의 전수·거리·접합·상태 표본으로 결정했다. 이들은 material-construction-appearance, material-binding-interface와 material-response/material-review-set에 대한 이 집의 구체적인 답이며 그 밖에 반복 적용할 독립 material 규칙은 발견되지 않았다. runtime 한계를 새 광학 성능 보증이나 별도 계약으로 바꾸지 않는다.
-->

# 생산별 계약 목록

현재 production-specific contract는 [시민 주택 공간 보존 계약](citizen-house-spatial-requirements.md)과 [기존 물체 인계 계약](model-fitout-handoff.md)이다. 다섯 reference는 settings·spaces·models·materials가 해석하는 추가 질문이다. 가구의 part 경계와 재료의 마감·좌표·관찰 결정은 각 설계 H2가 소유하며 이 목록은 그 설계를 대신하지 않는다.

<!--
@evidence discovery/design/materials.md#work-specific-material-requirements 조정자 지시로 이 주택의 재료는 텍스처 비트맵을 저작하거나 결합하지 않고 base color·roughness·metallic·transmission 상수만 가진다. 공용 재료 계약은 texture scale·UV·channel 관계를 응답 항목으로 요구할 뿐 비트맵이 없다는 조건을 모르므로, 이 조건과 그 결과(반복 결은 model/instance의 실제 geometry가 소유하고 상수 값이 fallback)를 이 계약이 보존한다. 가장 이른 owner는 materials/00-material-frame.md#material-no-bitmap이고, lint.config.ts의 house-material-no-bitmap 원칙 claim이 materials H2 모집단 전체에 이 계약을 건다.
-->

# 비트맵 없는 재료 응답

materials 층의 모든 재료 H2와 그 재료를 소비하는 후속 source에 적용하며, 재료가 표면 응답을 어떻게 싣는지를 판단한다.

## 상수 네 값과 형상이 맡는 반복 결 {#constant-response-no-bitmap}

이 주택의 재료는 색·거칠기·법선·변위 어느 것의 텍스처 비트맵도 저작하거나 결합하지 않는다. 각 재료는 sRGB hex와 그 선형 변환값의 base color, roughness, metallic, transmission 상수만 정하고, 유리만 ior와 두께를 더한다. siding course, 벽돌 줄눈, shingle 겹침, 마루 판, 타일 줄눈처럼 반복되는 결이 읽혀야 하는 곳은 색 패치나 절차적 noise가 아니라 models와 instances가 만든 두께 있는 실제 부재와 재료 상수의 대비로 얻는다. 나중에 비트맵이 허용되더라도 이 상수 값이 fallback이며, 비트맵 없이 표현할 수 없는 무늬는 새 규칙이 아니라 이 계약의 표현 한계로 각 재료 H2가 적는다. 현재 실현은 [재료 틀의 비트맵 없는 응답](../materials/00-material-frame.md#material-no-bitmap)이 소유하고 각 재료 H2가 자기 값으로 답한다.

Review question: 이 재료가 상수 네 값(유리는 ior·두께 포함) 밖의 텍스처나 절차적 결에 기대고 있지 않으며, 필요한 반복 결의 owner가 실제 geometry 쪽에 있는가?

Sources: 조정자 지시 「#1952 사용자 최종 지시 — 6시간, 2+2+2로 쪼갠다」(2026-09-24)의 "텍스처 이미지는 만들지 마라… base color·roughness·metallic·transmission만".

<!--
@evidence discovery/design/spaces.md#work-specific-space-requirements 고정된 방 이름 목록이 실제로 연결된 공간을 보장하지 않았던 실패와 사용자 전수 관찰 요구를 다시 대조했다. spaces/04-observations.md#spatial-observation-derivation은 공간·입면·지붕·개구부 산출물에서 질문을 파생할 책임을 맡고 house-space-observation-denominator claim이 spaces 전체에 이 계약을 연결한다. 현재 공간 컴파일은 403개 질문과 각 카메라를 산출하며 geometry-audit가 실제 포함·도달 검사를 수행한다. 수와 검사의 통과는 각 원본의 직접 픽셀 판독과 구분한다.
@evidence discovery/core/common.md#shared-local-boundary 사용자 브리프의 외부 전체 노출면과 각 방의 threshold·네 모서리·네 방위는 대표 표본을 허용하는 일반 검토 계획만으로 보장되지 않아, topology 유래 분모와 양쪽 미완료 목록의 동시 해소를 이 계약의 독립 의무로 채택했다.
@evidence discovery/core/common.md#canonical-realization settings/20-verification.md의 observation-allocation과 completion-boundary가 이 계약의 현재 실현이며 lint.config.ts의 house-observation-denominator claim이 settings 전체 H2를 대상으로 선언된다. 실제 시점·개수는 후속 공간 산출물의 책임으로 남겨 현재 문서를 관찰 완료로 취급하지 않는다.
-->
# 전체 관찰과 완료 분모

이 주택의 settings가 검토 책임을 배분하고 후속 공간·소스·뷰어가 그 범위를 실현할 때 적용하는 생산물별 의무다.

## 컴파일된 공간의 전체 관찰 분모 {#compiled-denominator}

권위는 사용자의 주택 저작 브리프다. settings 전체는 이 주택의 검토에서 대표 view로 줄일 수 없는 분모를 명시하고 공간·소스·뷰어 소비자에 책임을 배분한다. settings 단계의 실현은 이 배분과 검사 조건이며, source 단계 이후의 실현은 실제 컴파일된 topology에서 파생한 관찰 집합이다. 외부는 setting 하나, 모든 노출 입면, 입면이 만나는 모서리, 모든 노출 지붕과 하부, 모든 개구부와 출입구를 포함한다. 각 공간은 threshold 하나, 네 안쪽 모서리, 중심에서 네 방위가 자기 공간 안을 답한다. 비직사각형 공간에서 네 시점으로 가려지는 부분이 있으면 관찰을 추가한다. 계획은 질문을 더할 수만 있고, 공간 이름 변경·합치기·선택 view로 질문을 줄일 수 없다. 레퍼런스 다섯 장의 질문은 이 집합에 추가된다.

Review question: settings의 분모와 책임 배분을 따를 때 실제 topology에 존재하는 방·면·지붕·개구부가 관찰 없이 승인될 경로가 있는가?

Sources: 사용자 「저작 브리프 — 현대 미국 교외 2층 단독주택」의 「매 round 읽히는 것」과 「이번의 기준」.

## 저작자와 관찰자의 동시 완료 {#dual-completion}

최신 사용자 지시 “모델러 스스로가 렌더 샷 보면서 스스로 판정하고 스스로 개선해야지”와 “리뷰 대립 에이전트? 그딴거 두지마라, 무조건 지가 스스로 판단해서 스스로 고치게하라”를 적용한다. 다섯 레퍼런스 전부의 저작자 미완료 목록과 전달된 관찰자 목록은 계속 같은 모집단으로 보존하며 모델러 한 명이 실제 그림을 직접 보고 판정·수리한다. 별도 판정 에이전트를 배정하지 않는다. 목록이 전달되지 않았거나 계측 수단이 없으면 빈 것으로 해석하지 않는다. 관찰자의 진술은 원인이나 판정이 아니며 반박은 현재 산출물의 측정과 실제 프레임으로 한다. settings는 이 완료 경계와 각 주체의 권한을 분리해야 한다. 이전 gate, 문서 관계, lint 성공, id나 부재 수의 존재는 시각 완료를 대신하지 않는다.

Review question: 전달되지 않은 목록이나 unverified 관찰을 완료로 바꾸지 않고 두 목록을 보존하며 모델러 자신의 실제 화면 판정과 수리를 모두 요구하는가?

Sources: 사용자 브리프 「끝나는 조건」, 「역할」, 「기록」. 초기 조정자의 독립 reviewer 배정 지시는 위 최신 사용자 원문으로 대체되었으며 원문과 이행 경과는 `.wiki/99-worklog/2026-09-28-successor-completion.md`에 보존한다.

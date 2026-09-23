# 재료 공통 의무

## 재료 population의 역할과 배분 {#materials-core-common-coverage}

<!--
@evidence obligations/core/common.md#purpose-fit 001의 전달·좌표, 002~006의 표면군별 마감, 007의 관찰이라는 일곱 파일 역할을 배정한다. 001이 없으면 채널과 metric UV를, 002~006 중 하나가 없으면 그 표면군의 마감을, 007이 없으면 재료 결과를 반증할 표본을 다음 단계가 발명해야 한다.
@evidence obligations/core/common.md#layer-boundary 일곱 파일은 마감·좌표·응답·상태 표본만 정하고 창호 단면·차양·가구 외형·식재 배치는 spaces와 후속 설계로, 실제 GPU 결과와 판정은 review 기록으로 넘긴다. 재료 문서가 형상 치수를 새로 정하지 않는다.
@evidence obligations/core/common.md#production-language 판단과 근거는 한국어로 쓰고 finish id·texture id·element 역할 주소·API 이름은 source와 같은 표기로 유지한다. roughness·metallic 같은 렌더 용어와 moiré는 정해진 기술 용어로만 남긴다.
@evidence obligations/core/common.md#proportionate-development 7파일 29 H2의 주석 제외 본문 30,473자와 커밋된 draft의 29,656자, H2별 438~5,530자 분포를 기록했다. 채널·좌표와 관찰처럼 여러 표면군이 소비하는 결정에 더 긴 본문을, 단일 마감에는 짧은 본문을 두었고 세 곳의 설계 수리만큼만 늘었다.
-->

재료 설계는 일곱 역할로 나뉜다. 001은 native 전달 채널, 역할 주소와 explicit prototype variant, metric texture 좌표를 모든 마감이 공유하는 규칙으로 소유한다. 002는 외피의 석재·층간 띠·도장 금속·노출 금속, 003은 유리 두 종류와 보존할 PV·캐노피, 004는 목재 다섯 역할, 005는 실내 도장·흡음 패널·직물·screen, 006은 습식·조리대·위생·도장 가구와 보존 역할을 소유한다. 007은 census·크기와 접합·reference·상태의 네 관찰 역할이다. 표면의 형상과 소유는 spaces와 settings/003#surface-decomposition에 남고, 재료 문서는 그 표면에 결합하는 마감만 정한다.

2026-09-24 현재 일곱 파일의 evidence 주석을 제거하고 연속 빈 줄을 한 빈 줄로 정규화한 문자열을 셌다. 비교 기준은 draft를 커밋한 HEAD의 같은 파일이다. 문자 수는 heading을 포함하며 시각 품질의 점수가 아니다.

| 파일 | H2 | 본문 문자 수 | HEAD 본문 | H2별 문자 범위 |
| --- | ---: | ---: | ---: | ---: |
| 001-binding-and-scale.md | 3 | 7164 | 7164 | 1310–3657 |
| 002-exterior-solids.md | 4 | 3969 | 3706 | 576–1798 |
| 003-glass-and-roof.md | 3 | 1834 | 1834 | 571–644 |
| 004-wood.md | 5 | 3038 | 3038 | 505–747 |
| 005-soft-finishes.md | 4 | 3373 | 2819 | 473–1171 |
| 006-wet-and-joinery.md | 6 | 3161 | 3161 | 438–630 |
| 007-observation.md | 4 | 7934 | 7934 | 592–5530 |

가장 긴 H2는 007#scale-and-junction-samples와 001#surface-bindings다. 전자는 native validateTextureScale의 입력·반환·경고 조건과 production wrapper schema, 후자는 prototype 레코드와 instanceSlot 소비 경로를 소유해 모든 textured 표면이 그 계약을 공유한다. 단일 마감 H2는 438~1,171자로 색·응답·texture·좌표·표본의 같은 항목을 각자 채운다. 이번 증가분은 opaque-floor-band를 네 입면의 창 쌍 규칙으로 명확히 한 263자와 plaster-paint에 층 owner의 노출 junction·slab 절단면과 그 표본을, textiles에 현관 bench cushion을 더한 554자다. 파일 수와 H2 수는 draft와 같다.

한국어로 판단과 수치의 근거를 쓰고 finish id, texture id, `*-floor-boards` 같은 역할 주소, 공개 API 이름은 source에서 쓰는 표기 그대로 둔다. 새 source·GPU 프레임이 없는 상태에서 본문의 양이나 evidence 단계가 재료 구현이나 시각 합격을 뜻하지 않는다. 재료 source, 실제 native census, reference 대조는 이후 단계의 미완료로 남아 있다.

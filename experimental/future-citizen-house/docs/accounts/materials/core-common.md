# 재료 공통 의무

## 재료 population의 역할과 배분 {#materials-core-common-coverage}

<!--
@evidence obligations/core/common.md#purpose-fit 001의 전달·좌표, 002~006의 표면군별 마감, 007의 관찰이라는 일곱 파일 역할을 배정한다. 001이 없으면 채널과 metric texture 좌표를, 002~006 중 하나가 없으면 그 표면군의 마감을, 007이 없으면 재료 결과를 반증할 표본을 다음 단계가 발명해야 한다.
@evidence obligations/core/common.md#layer-boundary 일곱 파일은 전달 채널·역할 주소·prototype variant·좌표, 마감·응답, census·표본 계약만 정하고 표면의 형상과 소유는 spaces와 settings/003#surface-decomposition에, 재료 source·native census·reference 대조는 이후 단계에 남긴다. 재료 문서가 형상 치수를 새로 정하지 않는다.
@evidence obligations/core/common.md#production-language 판단과 근거는 한국어로 쓰고 finish id·texture id·`*-floor-boards` 같은 역할 주소·공개 API 이름은 source와 같은 표기로, roughness·metallic·moiré 같은 렌더 용어는 원어로 유지한다.
@evidence obligations/core/common.md#proportionate-development 7파일 29 H2의 주석 제외 본문 45,576자와 draft(929170b2)의 29,656자, H2별 442~6,084자 분포를 기록했다. 채널·좌표와 관찰, 여러 부재의 경계를 가르는 층간 띠와 실내 도장에 긴 본문을, 단일 마감에는 짧은 본문을 두었고 증가분은 v-084·v-086·v-088과 g4 r4 판정이 요구한 범위·부류·면 분할·색 배정, 근거와 저작 선택 표시, 계단 구멍·문턱·입면 위아래 끝·가구 지지·욕실 기구의 upstream 수리에 맞춘 면 배정, oak back·guest bed·끝면·결 축 규칙, census·접합·방 표본 항목이다.
-->

재료 설계는 일곱 역할로 나뉜다. 001은 native 전달 채널, 역할 주소와 explicit prototype variant, metric texture 좌표를 모든 마감이 공유하는 규칙으로 소유한다. 002는 외피의 석재·층간 띠·도장 금속·노출 금속, 003은 유리 두 종류와 보존할 PV·캐노피, 004는 목재 다섯 역할, 005는 실내 도장·흡음 패널·직물·screen, 006은 습식·조리대·위생·도장 가구와 보존 역할을 소유한다. 007은 census·크기와 접합·reference·상태의 네 관찰 역할이다. 표면의 형상과 소유는 spaces와 settings/003#surface-decomposition에 남고, 재료 문서는 그 표면에 결합하는 마감만 정한다.

2026-09-24 v-084·v-086·v-088과 g4 r4 판정의 수리, 그리고 층 전체 421관계의 요청 전 두 차례 전수 검사 수리 뒤 일곱 파일의 evidence 주석을 제거하고 연속 빈 줄을 한 빈 줄로 정규화한 문자열을 셌다. 비교 기준은 draft를 커밋한 929170b2의 같은 파일이다. 문자 수는 heading을 포함하며 시각 품질의 점수가 아니다.

| 파일 | H2 | 본문 문자 수 | draft 본문 | H2별 문자 범위 |
| --- | ---: | ---: | ---: | ---: |
| 001-binding-and-scale.md | 3 | 9452 | 7164 | 2038–4254 |
| 002-exterior-solids.md | 4 | 6744 | 3706 | 858–3171 |
| 003-glass-and-roof.md | 3 | 2658 | 1834 | 835–940 |
| 004-wood.md | 5 | 5022 | 3038 | 538–1862 |
| 005-soft-finishes.md | 4 | 6414 | 2819 | 629–3446 |
| 006-wet-and-joinery.md | 6 | 5185 | 3161 | 442–1563 |
| 007-observation.md | 4 | 10101 | 7934 | 641–6084 |
| 합계 | 29 | 45576 | 29656 | 442–6084 |

가장 긴 H2는 007#scale-and-junction-samples(6,084자)와 001#surface-bindings(4,254자)다. 전자는 native validateTextureScale의 입력·반환·경고 조건, production wrapper schema와 필수 접합 목록을, 후자는 prototype 레코드와 instanceSlot 소비 경로를 소유해 모든 textured 표면이 그 계약을 공유한다. 그다음은 계단 구멍과 계단 void 둘레 면, junction 12개·노출면 16개를 배정하는 실내 도장(3,446자), 네 입면 창 쌍의 frame 포함 범위·drip·교차 panel member를 담는 층간 띠(3,171자), 001의 좌표 규칙(3,139자)이다. 단일 마감 H2는 442~1,862자이며, 긴 쪽은 oak cabinet 18개·문턱판·충전 선반을 이름으로 배정하는 oak-joinery(1,862자), 지붕 끝·층간 띠·계단 void 면의 경계를 적는 limestone(1,814자), 세 문턱과 공유 벽 면을 나누는 wet-tile(1,563자), 네 색 배정과 곡면 좌표의 직물(1,552자)이다. draft 대비 +15,920자는 판정마다 요구된 범위·부류·면 분할·색 배정, 현재 소비 경로·texture 공유와 채널 목록의 사실 서술, 근거와 저작 선택 표시, 계단 구멍·문턱·입면 위아래 끝·가구 지지·욕실 기구의 upstream 수리(2164056c·fbaf7c73·47c52c85·8d0319f6·ad32755d)에 맞춘 면 배정, oak back·guest bed·통판 끝면·결 축 규칙, census·접합·방 표본 항목의 추가다. 004는 walnut 제거로 22자 줄었지만 위 추가로 draft보다 1,984자 길다. 파일 수와 H2 수는 draft와 같다.

한국어로 판단과 수치의 근거를 쓰고 finish id, texture id, `*-floor-boards` 같은 역할 주소, 공개 API 이름은 source에서 쓰는 표기 그대로 둔다. roughness·metallic·moiré 같은 렌더 용어도 원어로 둔다. 새 source·GPU 프레임이 없는 상태에서 본문의 양이나 evidence 단계가 재료 구현이나 시각 합격을 뜻하지 않는다. 재료 source, 실제 native census, reference 대조는 이후 단계의 미완료로 남아 있다.

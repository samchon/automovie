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

한국어로 판단과 수치의 근거를 쓰고 finish id, texture id, `*-floor-boards` 같은 역할 주소, 공개 API 이름은 source에서 쓰는 표기 그대로 둔다. roughness·metallic·moiré 같은 렌더 용어도 원어로 둔다. 위 문자 수는 2026-09-24의 설계 기록이며 source 구현이나 시각 품질 점수가 아니다.

2026-09-28 successor는 sourceBasis `38484f5e337228d23697a0ff4837325ca4da1e273bc8d7cd5e633131eb80d521`에서 cassette·seal을 포함한 현재 native binding을 구현하고, 공개 build/lowering으로 얻은 가시 placement 6,093개와 model 1,534개의 part 배정 8,222행을 열거했다. 각 행에 실제 node·part·material, 마감 producer owner, parent·space, native transform·world bounds, 삼각형 법선, texture slot·physical tile·UV span·RGBA bytes를 남겼다. source owner·asset·UV·channel 오류는 없었다. 가시 placement 수와 논리 부재·population member를 포함한 identity count 6,147은 서로 다른 분모다. native `validateTextureScale`는 같은 model 입력에서 성공했고 경고 1,296개를 원래 severity와 함께 유지했다. 이 성공은 curved UV의 등거리성이나 seam·pole의 시각 합격을 증명하지 않는다.

같은 basis의 실내·외관 전체 1,118 station 중 pose가 있는 1,116 PNG(257 primary와 859 detail)를 저작자가 모두 직접 읽었다. 원래 null 2곳과 부재에 가린 원래 시점은 보존하고 clear-eye 보충 시점과 구분했다. 실제 GPU는 `ANGLE (AMD, AMD Radeon(TM) 8060S Graphics (0x00001586) Direct3D11 vs_5_0 ps_5_0, D3D11)`이며, 대표 프레임은 `D:/github/samchon/AutoMovie/experimental/future-citizen-house/.wiki/99-worklog/successor-captures/14-12-anchor/references--01-exterior.png`와 같은 폴더 `references--03-common-room.png`다. 독립 1m 교정 도형은 같은 폴더 `calibration-1m-native-buffer.png`의 실제 1600×1000 버퍼에서 400×400픽셀로 확인했다. 1600×1001 DOM 교정 실패본은 정상 교정으로 세지 않는다.

`a00382b41632eb0058acb420279547e14d7d82b1ff224a75928acb7e3cae0595` basis의 실제 151 face를 1m·3m·12m와 두 각도에서 찍은 중성 재료 906장 및 다른 privacy/flex 조합의 영향 공간 718장도 저작자가 전부 읽었다. 이후 anchor 끝면 수리는 마감 producer와 UV를 바꾸지 않았으나 이 캡처를 새 basis의 프레임으로 표시하지 않는다. 작은 실제 면의 12m 결은 읽히지 않는 한계로 남는다. 현재 문 operation closed/open의 native leaf와 hardware 60장, 같은 원래 threshold에서 본 집 전체 20장을 함께 읽었다. 문이 화면 밖인 원래 문턱은 grain 검증으로 세지 않는다.

같은 현재 basis의 건물 접합부는 `D:/github/samchon/AutoMovie/experimental/future-citizen-house/.wiki/99-worklog/successor-captures/14-44-joints-bar`의 433 native PNG와 실제 ID·part·면 법선·삼각형 중심·이웃 부재를 기록한 `population.json`으로 관찰했다. 모든 PNG는 1600×1000으로 decode됐고 28 contact sheet를 저작자가 전부 직접 읽었다. 페이지 오류·GL 오류·context loss는 없었다. 중성 배경·광도·노출·FOV는 007의 조건을 쓰며, 독립 1m 흰 막대를 목표 깊이에 두고 막대의 depthTest만 끈 검사 표시를 함께 촬영했다. production mesh·UV·재료·배치는 바꾸지 않았다. 앞선 432장에는 기준 막대가 없고 `landing-side--1.14` 한 facet이 빠져 있었으므로 이 실행으로 보완하되 원본은 보존했다.

가시 표본에서 외부 석재 miter와 bearing 연결, 다섯 cassette band의 plate·seal·drip 및 stone의 깊이 차이, slab 절단면과 계단 lining·전면 strip의 도장 연결, 문턱의 oak/tile 경계, 첫/마지막 tread와 참·층 바닥, 난간/stringer와 무texture 목재 끝면의 광택 차이가 읽힌다. 기존 anchor 공면 끝은 6mm 노출 수리 뒤 36개 모두 보인다. 뒤쪽 잎과 다른 부재가 가린 표본, 숨은 면 및 아주 작은 끝면은 무독해로 남기며 전체 집의 원래·보충 관찰과 함께 판단한다. 중성 격리는 전달용 프레임이 아니다. 문 전체 frame은 14-16-door-pairs의 native operation.hardware에 포함된 jamb/head/threshold와 leaf를 같이 본 60장으로 확인했다. 같은 원래 threshold eye에서 closed leaf 중심을 향한 추가 20장은 `14-38-door-facing-thresholds`에 보존하고 원래 room-facing 20장과 구분했다.

materialSources의 30 export 및 public type fields 전체 모집단은 그대로 draft이며, 개별 사물의 reusable prototype 통합·바인딩·식탁/조리대/소파 접합 표본·전체 evidence 마감이 남아 있다. 건물에 쓰는 실제 마감은 `houseFinish`→`Assembly`의 native model material→공개 lowering→viewer uploader의 같은 레코드이며 census와 건물 표본으로 확인했다. 이것을 전체 재료 source 완료로 섞지 않는다. 실물 구조·광학 인증과 curved UV 등거리성은 unverified다.

필수 욕실 junction `junction-wall-bath-primary--wall-corridor-bathroom--wall-corridor-primary-2-13`의 wet-tile part는 실제 -X 법선과 x=-3.02, z=2.40..2.58 면을 가진다. 열린 문짝이 이 면을 가린 중성 155번과 원래 모서리 프레임을 보존했다. 기존 `corridor-bathroom` operation을 public lowering으로 closed에 둔 보충은 `D:/github/samchon/AutoMovie/experimental/future-citizen-house/.wiki/99-worklog/successor-captures/14-51-bath-joint-closed/000--junction-wall-bath-primary--wall-corridor-bathroom--wall-corridor-primary-2-13.png`다. 저작자가 실제 1600×1000 PNG를 열어 tile의 연속과 문 상부/세로틀의 결, 이전 도장 띠가 없음을 확인했다. 같은 현재 basis·GPU이며 geometry·재료는 바꾸지 않았다.

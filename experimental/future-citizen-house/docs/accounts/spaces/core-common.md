# 공간 공통 의무

## 공간 population의 역할과 배분 {#spaces-core-common-coverage}

<!--
@evidence obligations/core/common.md#purpose-fit 001의 포함·도착·관찰,002의 내부 구획·접속,003의 외피·개구라는 전체 파일 역할을 배정한다. 어느 하나가 빠지면 대지와 집, 방 도달, 안팎 경계 중 해당 결정이 소실된다.
@evidence obligations/core/common.md#layer-boundary 세 파일은 공간 관계와 점유 치수를 정하고 실행 이력·작성자 배정·재료 구현은 각자의 다른 owner로 넘긴다. source와 GPU 결과를 공간 설계 본문으로 대체하지 않는다.
@evidence obligations/core/common.md#production-language 설명과 저작 판단은 한국어로 읽히고 room/storey id와 좌표축은 정확한 수정 주소로 유지한다. 별도 관객 언어 전환이나 미설명 대사층을 넣지 않는다.
@evidence obligations/core/common.md#proportionate-development 현재3파일76 H2의 주석 제외 본문 분포와 보존된 이전1 H2의 혼합 역할을 비교했다. 중요 계단·L자·접합·창호는 결합 규칙을 더하고 과거 전체 snapshot 및 새 source/관찰 수는 없는 수단으로 추정하지 않고 unverified로 남긴다.
-->

공간 설계는 세 역할로 나뉜다. 001은 site→house→storey 포함과 전면 도착 및 관찰의 도출, 002는 두 층 datum·방·문·계단·내부 shared wall과 접합, 003은 외주의 면·고정창·roof/canopy 및 외부 corner를 소유한다. 이전 구현의 기각 이력은 .wiki worklog, 작성자와 파일 배정은 settings/003#surface-decomposition에 있고 공간 결정을 대신하지 않는다.

2026-09-21 현재 세 파일의 evidence 주석을 제거하고 연속 빈 줄을 한 빈 줄로 정규화한 문자열을 기록했다. 아래 문자 수는 본문과 heading을 포함하며 시각 품질의 점수가 아니다.

| 파일 | H2 | 본문 문자 수 | H2별 문자 범위 |
| --- | ---: | ---: | ---: |
| 001-citizen-house.md | 3 | 3086 | 932–1081 |
| 002-spatial-graph.md | 54 | 32363 | 313–1168 |
| 003-surface-ownership.md | 19 | 13365 | 424–1292 |

선택된76 H2는 집·대지·관찰3개, 내부54개, 외피19개다. 문·방·닫힌 경계를 독립 주소로 나누고, 계단의 실제 상승·도착, L자 room의 외주와 seam, 내벽 junction·외벽 miter, 창틀 점유와 분할은 서로의 값을 소비하는 관계를 구체적으로 기록한다. 비슷한 방문과 공유 벽은 같은 결합 규칙을 읽지만 각자 다른 host·room·통과 허용 여부를 소유하므로 한 문 수정이 다른 방의 문이나 경계를 묵시적으로 바꾸지 않는다.

철회 전 worklog에 보존한 공간 본문은1 H2·5,674자였고, 한 H2가 상태 보고·집 계층·방 그래프·외피·fit-out을 함께 담았다. 현재는 포함·도착·관찰, 내부 구획·접속, 외피의 공간 결정을 나누고 검토 이력과 작성자 배정을 각각 worklog와 settings owner로 옮겼다. 이전 버전 전체의 파일별 본문 snapshot은 남아 있지 않아 그 전체 인구 비교는 unverified이며 이 단일 보존본으로 과거 모든 파일의 양을 추정하지 않는다. 2026-09-21 기록 당시에는 건축 source의 부분 컴파일·GPU 관찰 이력만 있고 전체 관찰 분모 판정은 unverified였다. 개별 room·opening·wall의 분리는 수정 주소를 만들 뿐 그 수로 방의 읽힘이나 요구 관찰 통과를 주장하지 않는다.

한국어로 판단과 치수 근거를 설명하고 room/storey/portal의 source id와 좌표축 표기는 정확한 주소로 유지한다. source geometry·가구·재료·도구 코드는 이 문서 population의 산출물이 아니다. 후속 물체·재료 구현과 전체 컴파일 관찰·시각 판정이 미완료인 상태를 문서의 양이나 review 선언으로 통과시키지 않는다.

2026-09-28 successor의 건축 자체 관찰 기준은 sourceBasis `38484f5e337228d23697a0ff4837325ca4da1e273bc8d7cd5e633131eb80d521`다. 11×12m 두 층의 포함·방 경계·개구·도달과 외피·지붕/캐노피·배수·계단은 같은 `buildHouse`의 native environment로 검사했다. 34 self-check의 실패는 0이며, 집·캐노피 오류 0과 12 connector의 실제 삼각형 원통 통행 clear를 확인했다. 계단은 반지름0.30m·높이1.80m의 81점 실제 상승 경로와 walk polygon의 disc 접촉을 검사했으며 인체 gait·안전 인증으로 읽지 않는다. 창의 shared wall·공간 경계와 29 조명/천장 대응도 같은 검사에 포함됐다.

현재 전체 관찰 1,118 station 중 pose가 있는 1,116 PNG를 저작자가 직접 읽었고, 원래 null 2곳과 가려진 원래 시점을 보존했다. ±8cm pocket뿐 아니라 내부 목표까지의 전체 선분이 빈 clear-eye 보충으로 방의 읽힘을 함께 판단한다. 이것은 전체 frustum이나 몸 통행 인증이 아니다. 전체 실내/외관은 `D:/github/samchon/AutoMovie/experimental/future-citizen-house/.wiki/99-worklog/successor-captures/14-12-anchor`에, 건물 접합부 433장의 보충 중성 관찰은 같은 상위 폴더의 `14-44-joints-bar`에 있다. 실제 AMD Radeon 8060S D3D11 GPU와 독립 1m 도형의 400×400픽셀/1600×1000 native buffer 교정을 확인했다. 재료 binding census·상태/거리 표본의 다른 basis와 한계는 [재료 공통 계정](../materials/core-common.md#materials-core-common-coverage)에 둔다. 개별 사물의 prototype 통합·배치·전체 재료 source 종료는 이 건축 관찰의 결과로 승인되지 않는다.

2026-09-28 14:52Z에 저작자는 이 건물 assembly의 완성을 판정했다. 경계는 두 층의 공간·외피·개구·계단·roof/canopy와 실제 건물 마감이다. 전체 대상의 소스/문서 변경과 native 검사·프레임을 읽고, 욕실/계단 면 배정·문 뒤 시야·누락 walk surface·screen contrast·anchor 공면·관찰 모드 누락을 각 owner에서 수리한 뒤 마지막 자체 판정에서 추가 건물 결함은 없었다. 원복된 공유 core basis `ff93c8bd958978da03417f0e58cf1ebf7453a6876a385985037dab7907e8f08b`에서 14:51Z에 시작한 canonical `npm run lint`는 14:52Z exit0으로 끝났다. 이 경계는 evidence stage 전환이나 전체 production 종료가 아니며, materialSources30 export와 modelSource/instanceSource의 미완은 그대로 유지한 채 바로 개별 사물 통합을 시작한다.

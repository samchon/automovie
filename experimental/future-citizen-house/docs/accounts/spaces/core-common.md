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

철회 전 worklog에 보존한 공간 본문은1 H2·5,674자였고, 한 H2가 상태 보고·집 계층·방 그래프·외피·fit-out을 함께 담았다. 현재는 포함·도착·관찰, 내부 구획·접속, 외피의 공간 결정을 나누고 검토 이력과 작성자 배정을 각각 worklog와 settings owner로 옮겼다. 이전 버전 전체의 파일별 본문 snapshot은 남아 있지 않아 그 전체 인구 비교는 unverified이며 이 단일 보존본으로 과거 모든 파일의 양을 추정하지 않는다. 현재 source-owner 실현 분포와 컴파일 관찰 수는 새 구현 전이므로 역시 unverified다. 개별 room·opening·wall의 분리는 실제 수정 주소를 만들지만 그 수만으로 방이 읽힌다거나 요구 관찰을 통과했다고 판정하지 않는다.

한국어로 판단과 치수 근거를 설명하고 room/storey/portal의 source id와 좌표축 표기는 정확한 주소로 유지한다. source geometry·가구·재료·도구 코드는 이 문서 population의 산출물이 아니다. 새 구현과 전체 컴파일 관찰·시각 판정이 미완료인 상태를 문서의 양이나 review 선언으로 통과시키지 않는다.

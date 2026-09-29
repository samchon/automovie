# 공간 모집단의 역할과 분량

## 파일 역할과 층 경계 {#population-roles}
<!--
@evidence obligations/core/common.md#purpose-fit 00·01은 방·입면·지붕이 참조하는 외곽과 storey 좌표, 02는 두 층 사이의 유일한 연결, 05는 현관에서 모든 방으로 가는 경계 순서, 03은 소스 저작 전 완결 면의 파일 배정, 04는 관찰 질문 파생과 렌더 인계, 06–10과 roof/00은 두 owner 사이의 공유 경계, site/00·01은 house-site 접속과 포장 바탕 규칙을 한 번만 정하고, 입면·지붕 경사면·포치·방과 다섯 대지 파일은 완결 면이나 방 하나를 맡는다. 이 가운데 한 파일을 지우면 그 면이나 방의 경계·개구부·사용 예약이 다른 파일의 산문 속으로 들어가거나 사라진다.
@evidence obligations/core/common.md#layer-boundary 가구·기구·선반의 표는 점유 상한 예약이고 원형·다리·손잡이 형상은 models, 세 스툴·여섯 의자의 배치는 instances, 재료와 광학값은 materials, 방별 광원은 systems가 소비하며, 필지·외부 보도·지표·식재는 maps 인계의 입력으로만 적는다. 04의 engine-render-handoff는 공간 면의 model element 인계 조건, 비직사각 공간의 볼록 cell 합집합 또는 닫힌 shell, standable surface와 landing 검증의 한계, 관찰 helper의 null 처리라는 공간 결정만 남기고 뷰어 포트 4173·`--port`·실행기·카메라·조명·그림자는 settings의 viewer-handoff·renderer-boundary·lighting-state가 소유한다.
-->

비교 모집단은 `docs/spaces` 아래 47개 파일 전체다. 이 account는 파일 사이의 역할 배분과 층 경계만 답하며 각 H2의 원칙 답변을 대신하지 않는다.

공통 파일은 한 번만 정할 기준을 소유한다. [외곽](../../spaces/00-building.md#main-building-extent)과 [두 storey](../../spaces/01-storeys.md#storey-datums)는 방·입면·지붕의 좌표와 층 높이가 나오는 기준이고, [단일 계단](../../spaces/02-stair.md#stair-reservation)은 두 층 사이의 유일한 연결이다. [방 연결 표](../../spaces/05-route-network.md#room-route-network)는 현관에서 모든 방으로 가는 경계 순서를 인계한다. [표면 소유](../../spaces/03-surface-owners.md#exterior-surface-handoff)는 소스 저작 전에 완결 면을 파일에 배정하고, [관찰 파생](../../spaces/04-observations.md#spatial-observation-derivation)은 그 산출물에서 검사 질문을 만든다. [개구부](../../spaces/06-openings.md#external-opening-interface), [벽](../../spaces/07-boundary-assembly.md#interior-boundary-ownership), [층판](../../spaces/08-floor-assembly.md#interstorey-floor-boundary), [천장](../../spaces/09-ceiling-assembly.md#upper-ceiling-closure), [지상층](../../spaces/10-ground-floor.md#main-ground-floor-base), [지붕 교차](../../spaces/roof/00-junctions.md#roof-mass-allocation)는 두 owner 사이의 공유 경계를 한 번만 정한다.

나머지 서른다섯 파일 가운데 서른세 파일은 완결 표면 하나 또는 방 하나를 맡는다. 네 입면, 여덟 지붕 경사면, 포치, 열다섯 실내 공간과 보행길·차도·관리길·테라스·울타리의 다섯 대지 파일이 그 단위다. 남은 두 대지 파일은 표면을 소유하지 않고, [대지 접속](../../spaces/site/00-access.md#site-access-interface)은 house-site의 포함·내부 경로·maps 인계를, [포장 바탕](../../spaces/site/01-paving-support.md#paving-depth-reservation)은 각 포장·포치 owner가 함께 소유할 바탕 두께·지지·접촉 규칙을 한 번만 정한다. 이 분해는 [표면 소유 계약](../../contracts/surface-ownership.md#whole-surface-owner)이 요구하는 파일 경계와 같다. 파일 하나를 지우면 그 면이나 방의 경계·개구부·사용 예약이 다른 파일의 산문 속으로 들어가거나 사라진다.

층 경계는 각 owner가 스스로 밝힌다. 가구·기기·선반의 표는 점유 상한 예약이며 원형·다리·손잡이 형상은 models, 세 스툴·여섯 의자의 배치는 instances, 재료와 광학값은 materials, 방별 광원은 systems가 소비한다. 필지·외부 보도·지표·식재는 [maps 인계](../../spaces/site/00-access.md#map-handoff-inputs)가 받을 입력으로만 적고 spaces가 대신 정하지 않는다. [렌더 인계](../../spaces/04-observations.md#engine-render-handoff)는 공간 결정만 남긴다. 공간 면이 같은 surface owner의 model element로 넘어가야 한다는 조건, 비직사각 공간을 볼록 cell 합집합 또는 닫힌 shell로 표현하는 방식, 걷는 면의 standable surface가 보이는 바닥이 아니라는 한계, 관찰 helper가 null을 돌려준 pose를 성공으로 세지 않는 규칙, landing 검증이 참 내부 포함을 보증하지 않는다는 한계다. [관찰 파생](../../spaces/04-observations.md#spatial-observation-derivation)도 pose의 카메라 조건은 [프레임 조건](../../settings/20-verification.md#frame-condition)에서 받을 뿐이다. 뷰어의 포트 4173과 `--port`, 실행기, 기동 확인은 [뷰어 실행 인계](../../settings/20-verification.md#viewer-handoff)가, 카메라·재질·깊이는 [실제 3D 렌더 경계](../../settings/20-verification.md#renderer-boundary)가, 조명과 그림자는 [빛과 기준 상태](../../settings/20-verification.md#lighting-state)가 소유하며 spaces 문서는 그 값을 정하지 않는다. 이 배분이 실제 source에서 지켜지는지는 source가 없는 현재 unverified다.

## 작업 언어의 일관성 {#population-language}
<!--
@evidence obligations/core/common.md#production-language 47개 파일은 settings의 한국어 작업 언어로 설명·결정·검사 문장을 쓰고, 코드와 대조할 공간 id(`front-entry` 등)·`src/spaces/...` 경로·`lowerBuiltEnvironment` 같은 API 이름·`D(Z)` 같은 좌표식은 번역하지 않는다. threshold·reveal·trim·sash·flight·connector·bbox·pose·census는 원어 그대로 반복해 쓰며 47개 파일 전체를 `\p{Script=Han}`으로 검사해 한자가 없음을 확인했다.
-->

[작업 언어](../../settings/00-production.md#working-language)에 따라 설명·결정·검사 문장은 한국어로 쓴다. 원형을 유지하는 것은 공간 id(`front-entry`, `kitchen-dining-family`, `garage-front-door` 등), 소스 경로(`src/spaces/rooms/entry.ts` 등), 공개 API 이름(`lowerBuiltEnvironment`, `builtSpaceObservationStations` 등)과 좌표식(`D(Z)`, `q = h11 - h10 - h01 + h00`)이다. 이들은 코드와 같은 문자열로 대조해야 하므로 번역하지 않는다.

건축·렌더 용어 가운데 threshold, reveal, trim, sash, flight, connector, bbox, pose, census는 한국어 대응어가 흔들리기 쉬워 원어 그대로 반복해 쓴다. 예를 들어 문 둘레의 안쪽 면은 reveal로 쓴다. 방 입구 관찰은 threshold로 쓰는 파일과 문턱으로 쓰는 파일이 함께 있으며 두 말은 같은 관찰을 가리킨다.

이번 evidence 배치에서 47개 파일 전체를 `\p{Script=Han}`으로 검사했고 한자가 없었다. 이 검사는 문자 체계의 일관성만 확인하며 문장의 명료성은 독립 리뷰의 판단으로 남는다.

## 선언 규모에 맞춘 분량 배분 {#population-proportion}
<!--
@evidence obligations/core/common.md#proportionate-development 주석·제목·공백을 뺀 본문은 공통 11파일 28 H2 / 50169자, 입면 4 / 24 / 13940, 지붕 9 / 12 / 8406, 포치 1 / 2 / 1691, 방 15 / 38 / 35479, 대지 7 / 16 / 18545, 합계 47 / 120 / 128230자다. 재생성 전 spaces는 house.md 1파일 7 H2 2938자였다. 계단(5 H2 / 5582자)과 공용부(6 / 6013)가 서비스 통로(1 / 993)와 옷방(2 / 1275)보다 깊고, 지붕 경사면은 roof/00(4525자)의 교차 계산을 소비해 각 436–536자에 머문다.
-->

측정은 `docs/spaces`의 각 파일에서 HTML 주석, 제목 줄, 공백을 뺀 본문 문자를 세었다. 수치는 저작량이 어디에 있는지를 보여 줄 뿐 완성의 판정이 아니다.

| 묶음 | 파일 | H2 | 본문 문자 |
| --- | --- | --- | --- |
| 공통 기준·접합(00–10) | 11 | 28 | 50169 |
| 입면(envelope) | 4 | 24 | 13940 |
| 지붕(roof) | 9 | 12 | 8406 |
| 포치 | 1 | 2 | 1691 |
| 방(rooms) | 15 | 38 | 35479 |
| 대지(site) | 7 | 16 | 18545 |
| 합계 | 47 | 120 | 128230 |

사용자가 정한 규모는 약 246㎡의 2층 본채, 우측 2대 차고, 전체 실내다. [본채 외곽](../../spaces/00-building.md#main-building-extent)의 두 층 합 246.10㎡와 그 밖에 붙은 [차고](../../spaces/00-building.md#attached-garage-extent)에 열다섯 실내 공간 owner와 네 입면, 여덟 지붕 경사면이 있고, 이는 방별·입면별·층별 소유를 요구한 [표면 계약](../../contracts/surface-ownership.md#whole-surface-owner)의 분해와 같은 단위다. 이 규모를 넘는 방이나 층을 더하지 않았다.

결과가 무거운 결정일수록 더 길다. [계단](../../spaces/02-stair.md#stair-reservation)은 5 H2 / 5582자로 단 분할, connector, 층판 구멍, 순폭, 높이별 보호 경계를 따로 다룬다. [공용부](../../spaces/rooms/common.md#common-room-plan)는 6 H2 / 6013자로 주방 벽, 섬, 식탁, 가족실, 동선을 나눈다. 반대로 [서비스 통로](../../spaces/rooms/service.md#service-access-plan)는 1 H2 / 993자, [옷방](../../spaces/rooms/wardrobe.md#primary-wardrobe-plan)은 2 H2 / 1275자다. 지붕 경사면 여덟 파일이 각 436–536자로 짧은 것은 높이와 교차를 [지붕 교차](../../spaces/roof/00-junctions.md#roof-profile-datums)(4525자)가 한 번 계산하고 각 면이 소비하기 때문이다. 경사면마다 같은 계산을 반복하면 분량은 늘지만 owner가 둘로 갈린다.

재생성 전 spaces는 `house.md` 한 파일, 7 H2, 2938자였다. 지금의 모집단은 그 한 파일의 결정을 방·면·접합 owner로 나누고 사용·통행 예약을 더했다. 파일과 H2 수가 줄어든 곳은 없다. 이 비교는 분량의 회귀가 없다는 뜻일 뿐이며 실제 형상·도달성·그림은 집을 그리는 공간 source와 그 GPU 프레임이 없는 현재 unverified다. design→source 사이의 분량은 산문과 TypeScript를 비교하지 않고 source 단계에서 H2별 실현 여부로 따진다.

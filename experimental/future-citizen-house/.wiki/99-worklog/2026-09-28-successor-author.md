# 미래 시민 주택 successor 저작 기록

## 사용자 지시

사용자 최신 원문: "인수인계서 이슈 #2623 의 본문과 모든 코멘트를 읽고, 최신 내용에 따라 이어받아 끝내라." 이어 "기대하기로서니 1시간 내에 건물의 모든 것을 끝내고, 곧이어 바로 개별 사물들로 건너가기를 바라노라." 이번 successor의 건물 완료 기대 시각은 2026-09-28 12:52Z이며 시간은 완료 근거가 아니다.

지속 원문: "건물부터 완벽하게 완성시킨 뒤 소품으로", "소품 디테일링이 필요하냐? 대충 엇비슷하면 되지, 메쉬 상세할 필요 없잖아", "모델러 스스로가 렌더 샷 보면서 스스로 판정하고 스스로 개선해야지", "리뷰 대립 에이전트? 그딴거 두지마라, 무조건 지가 스스로 판단해서 스스로 고치게하라", "야 씨발 evidenceReview 필요없는거로 해라. 뭐더러 evidenceReview까지 가냐? evidence만 쓰면 끝나게 혀", "정석대로. 꼼수 금지.", "모델러들 모두 강제 중지하고 절대로 새 창 cmd 안 뜨게 아주 강력히 경고하고 지시하라. 절대지침이다".

최신 이어받기 지시가 이전 중지를 대체한다. 새 CMD·PowerShell·터미널 창 금지는 유지한다. 실행은 파이프 모드, 하위 프로세스는 windowsHide, 별도 리뷰어·서브에이전트 없이 한 저작자가 직접 현재 렌더를 판정한다. evidence 모집단과 인용 의무는 유지한다. 하니스·공통 packages/scaffold·다른 production·lockfile·브랜치는 동결한다. 기존 PNG·미커밋 변경을 보존하며 ESM 전환·몽키패치·preload·기본 tsconfig 지정·#1954 시작·머지는 하지 않는다. production 경로만 명시적으로 stage하고 공유 index 커밋은 감독자와 조율한다.

## 인수인계와 이행

루트 및 production AGENTS.md, project/documentation/development/3d-modeling/experiment/viewer-verification 및 설치된 contract/source-authoring/review-verification/evidence-graph/production-lifecycle 스킬을 읽었다. 기존 settings/spaces/spaceSources/models/materials evidence와 modelSources/materialSources/instances draft를 보존하고 현재 영향 표면을 조사한다. 이전 실행의 완료나 관찰을 이번 완료로 소급하지 않는다.

## 건물 수리와 현재 검증

#2623 본문과 세 코멘트 전부, #1953 본문과 두 코멘트 전부를 읽었다. 10:53Z 중지는 이번 이어받기 지시로 대체됐고 새 창 금지는 유지한다. 설치된 evidence-graph/staging.md의 "Leave completed layers in `review`"와 별도 판정 요구는 사용자 evidence-only·자가 판정 지시로 이번 실행에서 대체한다. 설치 파일은 수정하지 않고 분모·인용·실제 관찰 의무는 유지한다.

기준 9e8abeedd491efff9a147c3f6934df2943ace0e04fd3620a038f125771af0d7b의 48 GPU 화면 중 욕실 junction의 도장 띠와 계단 끝면의 긴 결을 직접 발견했다. junction 면의 인접 room finish, upper slab cut·front-body strip·drip·roof-bearing의 계단 안쪽 면을 각 geometry owner에서 분리했다. 목재 grain 축 및 무texture 끝면을 나눴다. 위치·닫힌 solid를 바꾸지 않고 material partition을 만들며 rigid/normal/UV 전제 밖 입력은 거부한다.

44ff2eae5ca0ba97aa2b4853c8f539a5d194a4219282c994e9968de8aa5f3bb0에서 channel chromium, ANGLE (AMD, AMD Radeon(TM) 8060S Graphics (0x00001586) Direct3D11 vs_5_0 ps_5_0, D3D11), 1600×1000/DPR1로 캡처했다. 독립 1m 정사각형의 GPU pixel bounds는 400×400이다. 절대 경로 D:/github/samchon/AutoMovie/experimental/future-citizen-house/.wiki/99-worklog/successor-captures/44ff2eae/calibration-1m.png, entry--center-x-plus.png, upper-bathroom--corner-1.png에서 새 끝면과 tile 접합을 직접 읽었다. 전체 1049 station의 캡처는 약 200장까지 생성했고 후속 source 수리 때문에 중단했다. 이를 전수 완료로 세지 않는다. 모든 PNG를 보존했다.

buildHouse와 payload가 같은 native validateTextureScale 결과·범위 census를 소비하고 docs/materials·models·instances도 server sourceBasis에 넣었다. 당시 models1534/parts1964/무texture840, native success=true이며 짧은 반복 축의 원본 경고를 보존한다. 12개 route 중 11개 수평 passage의 실제 triangle 원통 sweep은 clear, single-stair는 미계측이다. 32개 self-check는 실패0으로 완료했으나 중간에 source가 바뀌었으므로 최종 현재 트리 검증이라고 주장하지 않는다.

후속으로 actual L-cell union의 여섯 경계 모서리 관찰을 추가했고 기존 child-bedroom-1/corner-0·upper-service/corner-3 null과 이유를 삭제하지 않았다. native sphere tessellation의 ring/열 길이를 scale 후 누적하여 뒤쪽 -Z seam·아래 pole UV를 구현했고 위치·법선·삼각형은 보존한다. 새 순수 fixture 테스트를 포함해 9파일/11exports는 통과했다. 최초 pure-tests 호출에 tsx runtime을 빠뜨려 9개 load 실패가 났고, 선언된 CJS tsx runtime으로 다시 실행해 모두 통과했다. ESM 전환은 하지 않았다.

materialSources는 아직 draft다. 새로운 renderer mapping을 H2 소유별 실제 recipe export로 분리하고 있으며 아직 전체 인용 배치·거리 표본·상태별 전수 GPU 판정·계단 원통 검증을 완료하지 않았다. 건물 완료와 개별 사물 단계 전이는 아직 선언하지 않았다.

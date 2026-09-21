# 제작과 판정의 경계

## 레퍼런스의 권위 {#references}

사용자가 배포한 이미지의 원본 경로는 D:/AutoMovieBench/refs-20260916/1951/이며 01-exterior.png는 외관, 02-section-axonometric.png는 절개 검사, 03-courtyard-fountain.png는 중정, 04-worship-hall.png는 제실, 05-records-service-wing.png는 기록·서비스 구역이다. 이 자료는 형태·분위기·재료·공간 관계의 시각 근거이며 치수 도면이나 실재 유적의 증거가 아니다. 픽셀 비례와 이미지 안 숫자로 실측치를 역산하지 않는다. 치수는 [규모](10-building.md#scale)와 사용·시공·동선 근거에서 결정한다. 다섯 비교는 [필수 관찰](../contracts/obligations-spaces.md#compiled-observations)에 추가되며 그 집합을 줄이지 않는다. 상충하는 분수 형상은 [분수](30-interiors.md#fountain)에서, 인체 신상은 [제실](30-interiors.md#sanctuary)에서 명시적으로 해결한다.

## 표현 수준 {#fidelity}

사용자 지시: 실제 입체 매스·부재·재질·빛·그림자·깊이를 가진 결정론적 3D가 전달 표면이다. 박공·처마·기둥·문틀·문짝·단차·집기의 실체와 모든 방의 정체성이 리뷰 거리에서 읽혀야 한다. 그림 대신 문서·topology·bounding box로 완성 주장을 하지 않는다. 사진과 같은 미세한 열화 복제를 증명하지 않으며 이미지 생성·repaint·사진 부착은 사용하지 않는다. 표현 수준이라는 이름으로 요구된 입체 부재나 전체 실내를 생략하지 않는다.

## 런타임 경계 {#runtime-boundary}

사용자 지시: @automovie/engine의 CommonJS 경계를 유지하고 ESM으로 바꾸지 않는다. 저작자 결정: producer는 CJS 서버에서 공개 엔진 API로 source를 해석하고 현재 topology와 실제 mesh·transform·material 산출물을 클라이언트에 전달하는 구조를 채택한다. 뷰어에서 엔진의 ESM directory re-export를 호출하지 않는다. 모듈 호환성을 위한 하드코딩·monkey patch·우회 설정 파일·저장소 수정은 금지한다. producer가 전달한 실제 형상을 그리며 AABB를 모델로 대체하거나 UI 안에서 건물을 다시 만든다거나 오래된 결과를 성공처럼 보여 주지 않는다. 아직 API 실행·뷰어 구현은 검증되지 않았고 구체적인 공개 API 선택은 구현 전에 installed source로 확인한다.

## GPU 관찰 {#gpu-observation}

사용자 지시: 저장소 viewer-verification skill의 Playwright channel chromium과 WebGL 경로로 캡처하고 실제 RENDERER 문자열을 보고한다. 기본 headless software rasterizer의 프레임은 GPU 관찰로 세지 않는다. 빈 캔버스·오류 배너·건물을 가리는 라벨은 결함이다. reviewer는 현재 source에 대응하는 프레임을 직접 열어 reference와 대조한다. geometry 구현 전 현재 GPU·RENDERER·시각 일치는 unverified이며 다른 계측으로 대체하지 않는다.

## 작업과 실행의 권한 {#execution-authority}

사용자 지시: 저작은 이 production 안에서만 한다. packages/*, 저장소 .agents/*, 다른 production과 human-face 코드를 바꾸지 않는다. 새 파일은 README ownership을 따른다. 의존성은 package.json에 선언만 하고 설치는 조정자가 한다. viewer가 생기면 시작 명령·실행 디렉터리·포트·열어야 할 경로를 인계하고 기동은 조정자가 한다. 커밋과 푸시는 [저작자 커밋 절차](#author-commits)를 따른다. 검증은 README 소유 npm run lint만 사용하고 추가 flag·대체 명령·직접 binary·추가 설정 파일을 쓰지 않는다. 파생 산출물·캐시·임시 파일을 작업 트리에 남기지 않으며 비교용 출력 보관 위치는 coordinator가 정한 외부 capture 경로를 사용한다.

## 판정과 완료 {#acceptance}

사용자 지시: 저작자는 source·분업·수리를 소유하고 관찰자는 계측만 하며 별도 독립 read-only reviewer가 판정한다. 관찰을 원인으로 단정하지 않고 실제 계측으로 확인한다. 거친 매스·공간 그래프와 표면 분해 선언을 먼저, 외피, 규칙 기반 반복 모듈, fit-out, 마감 순서로 닫는다. 닫힌 단계를 다시 열 때에는 영향을 준 실제 결함과 이유를 기록한다. stage는 disabled→draft→evidence→review로 전진하고 저작자가 스스로 review를 선언하지 않는다. 검토 제출 후 조정자가 reviewer를 배정한다. 이 사용자 순서는 구현의 거친 결이고 evidence의 부모 선행 조건도 함께 지킨다. 완성은 다섯 reference 모두에서 저작자의 미완료 목록과 관찰자의 미완료 목록이 동시에 비었을 때다. lint 성공이나 review 선언만으로 시각 완료를 주장하지 않는다.

## 측정과 실패 기록 {#measurement-truth}

사용자 지시: 수·ID·위치·binding·치수는 실제 compiled 산출물에서 읽는다. 프레임은 리뷰 거리의 형태와 공간 정체성을 판정한다. 미지원·실패·시도 후 폐기·악화·오류·우회·미완료를 성공과 같은 비중으로 해당 소유 문서의 관찰과 작업 기록에 남긴다. 측정 수단이 없는 항목은 unverified로 남기고 비슷한 명령의 수치로 바꾸지 않는다. 실행 명령은 실제 종료 코드와 함께 매 turn 보고하며 프로세스가 시작되지 않은 실패에는 종료 코드를 발명하지 않는다. settings의 범위 값은 저작자 입력이며 compiled 측정치라고 부르지 않는다.

## 저작자 커밋 절차 {#author-commits}

사용자 지시(2026-09-21): 저작자가 최소 매 turn 끝, 단계 종료, viewer 작성 때마다 직접 커밋하고 푸시한다. 공유 checkout의 브랜치는 benchmark/1951-1953-harness 하나다. 저장소 루트에서 git add experimental/ancient-civic-temple로 이 production의 명시 경로만 스테이지하고, git commit -m "feat(experimental): <변경 내용 한 줄>", git pull --rebase origin benchmark/1951-1953-harness, git push origin benchmark/1951-1953-harness 순서로 실행한다. git add -A, 다른 production·packages/*·.agents/*·루트 파일 스테이징, master 접촉, force-push, 임의 히스토리 재작성과 다른 저작자 커밋 수정은 금지한다. 지정한 pull --rebase만 동기화 절차로 사용하며 다른 저작자의 수정·스테이징을 숨기거나 되돌리지 않는다. 커밋 전에 이 production의 생성 산출물·캐시·임시 파일을 정리하고 gitignore된 .wiki는 커밋하지 않는다. 매 turn 커밋 해시와 push 종료 코드를 보고한다. sandbox가 git 또는 네트워크를 막으면 정확한 오류와 종료 코드를 기록하고 우회하지 않는다.

# 제작과 판정의 경계

## 레퍼런스의 권위 {#references}

<!--
@evidence principles/core/common.md#scope-preservation 원본 다섯 파일과 각 비교 역할을 모두 보존하고 compiled 필수 관찰에 추가하도록 한다.
@evidence principles/core/common.md#substantive-completion 이미지의 시각 권위와 치수 비권위를 구별하고 분수·신상 충돌의 결정 소유를 연결한다.
@evidence principles/core/common.md#declared-basis 사용자 배포 경로와 파일명이 형태·분위기·재료·관계의 직접 근거다.
@evidence principles/core/settings.md#fact-status reference를 실재 유적 증거나 치수 도면으로 보지 않고 사용·시공·동선에서 치수를 정하게 한다.
@evidence principles/core/settings.md#source-support 01-exterior.png부터 05-records-service-wing.png까지 원본 경로와 역할을 특정해 같은 자료를 다시 열 수 있다.
@evidence principles/core/settings.md#capability-boundary 이미지 비교는 질문을 추가하지만 필수 관찰 집합을 줄이거나 픽셀/이미지 숫자로 실측을 만들지 못한다.
@evidence principles/core/settings.md#constraint-sufficiency 높이가 다른 분수는 fountain, 인체 신상은 sanctuary 소유에서 해결하도록 충돌 경로를 정한다.
@evidence principles/core/settings.md#observable-identity 외관·중정·제실·기록/서비스를 서로 다른 시각 질문으로 보존하고 절개 조감은 검사 자료로 분류한다.
-->

사용자가 배포한 이미지의 원본 경로는 D:/AutoMovieBench/refs-20260916/1951/이며 01-exterior.png는 외관, 02-section-axonometric.png는 절개 검사, 03-courtyard-fountain.png는 중정, 04-worship-hall.png는 제실, 05-records-service-wing.png는 기록·서비스 구역이다. 이 자료는 형태·분위기·재료·공간 관계의 시각 근거이며 치수 도면이나 실재 유적의 증거가 아니다. 픽셀 비례와 이미지 안 숫자로 실측치를 역산하지 않는다. 치수는 [규모](10-building.md#scale)와 사용·시공·동선 근거에서 결정한다. 다섯 비교는 [필수 관찰](../contracts/obligations-spaces.md#compiled-observations)에 추가되며 그 집합을 줄이지 않는다. 상충하는 분수 형상은 [분수](30-interiors.md#fountain)에서, 인체 신상은 [제실](30-interiors.md#sanctuary)에서 명시적으로 해결한다.

## 표현 수준 {#fidelity}

<!--
@evidence principles/core/common.md#scope-preservation 매스·부재·재질·빛·그림자·깊이와 전체 실내 정체성을 납품 표면으로 유지한다.
@evidence principles/core/common.md#substantive-completion 결정론적 3D 자체를 전달 표면으로 정하고 문서·topology·상자 대체로 완성을 주장하지 못하게 한다.
@evidence principles/core/common.md#declared-basis 실제 입체와 리뷰 거리의 부재 판독 요구는 사용자 지시다.
@evidence principles/core/settings.md#fact-status 사진 수준의 미세 열화 복제를 증명하지 않으며 요구 부재 판독은 달성해야 할 기준으로 제시한다.
@evidence principles/core/settings.md#source-support reference의 미세 손상까지 복원했다는 주장을 하지 않고 이미지 생성·사진 부착도 채택하지 않는다.
@evidence principles/core/settings.md#capability-boundary deterministic 3D가 직접 납품이며 repaint나 외부 생성 그림을 추가 표면으로 쓰지 않는다.
@evidence principles/core/settings.md#constraint-sufficiency 표현 수준을 이유로 박공·처마·문틀·문짝·단차·집기 또는 전체 실내를 생략하지 못한다.
@evidence principles/core/settings.md#observable-identity 리뷰 거리에서 개별 입체 부재와 각 방의 성격이 읽히는가를 그림의 허용 추론으로 정한다.
@evidence obligations/core/settings.md#production-fidelity-tier 실제 결정론적 3D에서 입체와 방 정체성을 판단하되 사진 같은 열화 복제나 구조 자료만의 시각 완료 추론은 허용하지 않는다.
-->

사용자 지시: 실제 입체 매스·부재·재질·빛·그림자·깊이를 가진 결정론적 3D가 전달 표면이다. 박공·처마·기둥·문틀·문짝·단차·집기의 실체와 모든 방의 정체성이 리뷰 거리에서 읽혀야 한다. 그림 대신 문서·topology·bounding box로 완성 주장을 하지 않는다. 사진과 같은 미세한 열화 복제를 증명하지 않으며 이미지 생성·repaint·사진 부착은 사용하지 않는다. 표현 수준이라는 이름으로 요구된 입체 부재나 전체 실내를 생략하지 않는다.

## 런타임 경계 {#runtime-boundary}

<!--
@evidence principles/core/common.md#scope-preservation producer의 엔진 해석부터 현재 topology·mesh·transform·material 전달까지 하나의 source 소비 경로를 정한다.
@evidence principles/core/common.md#substantive-completion CJS 서버 해석과 클라이언트 산출물 소비로 뷰어의 모듈 경계를 결정한다.
@evidence principles/core/common.md#declared-basis 엔진 CommonJS 유지와 우회 금지는 사용자 지시, CJS producer 구조는 저작자 채택이다.
@evidence principles/core/settings.md#fact-status API 실행과 뷰어 구현은 미검증으로 명시하며 구조 선택을 동작 성공으로 바꾸지 않는다.
@evidence principles/core/settings.md#source-support 구체 API는 실행 전 installed source에서 확인하도록 남겨 기억에 의존한 API 가능성을 사실화하지 않는다.
@evidence principles/core/settings.md#capability-boundary 클라이언트는 받은 실제 형상을 그리며 engine ESM directory re-export·monkey patch·우회 설정을 쓰지 않는다.
@evidence principles/core/settings.md#constraint-sufficiency AABB나 UI 재저작으로 원래 형상을 바꾸거나 오래된 결과를 성공처럼 보이는 경로를 금한다.
@evidence principles/core/settings.md#observable-identity 전달자는 건물의 모습 자체를 새로 정의하지 않고 source의 실제 mesh·material을 그림에 보존한다.
-->

사용자 지시: @automovie/engine의 CommonJS 경계를 유지하고 ESM으로 바꾸지 않는다. 저작자 결정: producer는 CJS 서버에서 공개 엔진 API로 source를 해석하고 현재 topology와 실제 mesh·transform·material 산출물을 클라이언트에 전달하는 구조를 채택한다. 뷰어에서 엔진의 ESM directory re-export를 호출하지 않는다. 모듈 호환성을 위한 하드코딩·monkey patch·우회 설정 파일·저장소 수정은 금지한다. producer가 전달한 실제 형상을 그리며 AABB를 모델로 대체하거나 UI 안에서 건물을 다시 만든다거나 오래된 결과를 성공처럼 보여 주지 않는다. 아직 API 실행·뷰어 구현은 검증되지 않았고 구체적인 공개 API 선택은 구현 전에 installed source로 확인한다.

## GPU 관찰 {#gpu-observation}

<!--
@evidence principles/core/common.md#scope-preservation GPU 경로·RENDERER·현재 source와 reference 직접 비교를 포함하고 빈 화면도 결함으로 센다.
@evidence principles/core/common.md#substantive-completion Playwright channel chromium/WebGL와 실제 RENDERER 보고를 관찰 조건으로 확정한다.
@evidence principles/core/common.md#declared-basis 캡처 경로와 소프트웨어 프레임의 제외는 사용자 지시 및 지정 viewer-verification 절차를 따른다.
@evidence principles/core/settings.md#fact-status 현재 GPU·RENDERER·시각 일치는 unverified로 남아 있고 이후 얻을 캡처를 이미 관측했다고 하지 않는다.
@evidence principles/core/settings.md#source-support 하드웨어 관찰 요구는 사용자 지정 GPU skill에 귀속하며 장치명이나 RENDERER 값을 발명하지 않는다.
@evidence principles/core/settings.md#capability-boundary 기본 headless software rasterizer의 프레임은 GPU 증거로 사용할 수 없고 다른 계측으로 대체하지 않는다.
@evidence principles/core/settings.md#constraint-sufficiency reviewer가 현재 source 프레임을 직접 열며 오류 배너·빈 캔버스·가리는 라벨은 통과시킬 수 없다.
@evidence principles/core/settings.md#observable-identity 건물 자체가 실제 캡처에 보여야 reference와 대조할 수 있다는 관찰 표면의 최소 조건을 둔다.
-->

사용자 지시: 저장소 viewer-verification skill의 Playwright channel chromium과 WebGL 경로로 캡처하고 실제 RENDERER 문자열을 보고한다. 기본 headless software rasterizer의 프레임은 GPU 관찰로 세지 않는다. 빈 캔버스·오류 배너·건물을 가리는 라벨은 결함이다. reviewer는 현재 source에 대응하는 프레임을 직접 열어 reference와 대조한다. geometry 구현 전 현재 GPU·RENDERER·시각 일치는 unverified이며 다른 계측으로 대체하지 않는다.

## 작업과 실행의 권한 {#execution-authority}

<!--
@evidence principles/core/common.md#scope-preservation 쓰기 범위·설치·viewer 기동·검증·산출물 보관의 권한을 모두 배정한다.
@evidence principles/core/common.md#substantive-completion production 내부 저작, 의존성 선언, 조정자 설치/기동과 npm run lint 전용 검증을 실행 계약으로 정한다.
@evidence principles/core/common.md#declared-basis 저장소와 타 production·human-face 보호 및 실행 역할은 사용자 직접 지시다.
@evidence principles/core/settings.md#fact-status 여기의 권한은 제작 절차이지 이미 서버가 열렸거나 검증을 마쳤다는 결과가 아니다.
@evidence principles/core/settings.md#source-support 명령·소유 경계는 사용자와 README에 연결되며 임의 실행 우회를 지원된 기능처럼 설명하지 않는다.
@evidence principles/core/settings.md#capability-boundary 저작자는 package.json에 의존성을 선언할 수 있지만 설치·서버 기동은 조정자 몫이다.
@evidence principles/core/settings.md#constraint-sufficiency viewer 인계의 명령·디렉터리·포트·경로와 금지된 추가 flag/직접 binary를 구체화한다.
@evidence principles/core/settings.md#observable-identity 실행 권한 단위는 새 시각 대상을 정의하지 않고 외부 capture 경로에 보관할 비교 출력만 지시한다.
-->

사용자 지시: 저작은 이 production 안에서만 한다. packages/*, 저장소 .agents/*, 다른 production과 human-face 코드를 바꾸지 않는다. 새 파일은 README ownership을 따른다. 의존성은 package.json에 선언만 하고 설치는 조정자가 한다. viewer가 생기면 시작 명령·실행 디렉터리·포트·열어야 할 경로를 인계하고 기동은 조정자가 한다. 커밋과 푸시는 [저작자 커밋 절차](#author-commits)를 따른다. 검증은 README 소유 npm run lint만 사용하고 추가 flag·대체 명령·직접 binary·추가 설정 파일을 쓰지 않는다. 파생 산출물·캐시·임시 파일을 작업 트리에 남기지 않으며 비교용 출력 보관 위치는 coordinator가 정한 외부 capture 경로를 사용한다.

## 판정과 완료 {#acceptance}

<!--
@evidence principles/core/common.md#scope-preservation 매스·표면 분해부터 마감까지의 순서와 저작자/관찰자 두 미완료 목록을 종료 조건에 넣는다.
@evidence principles/core/common.md#substantive-completion 관찰자의 계측, 독립 reviewer의 판정, 조정자의 배정과 전진 stage를 분명하게 나눈다.
@evidence principles/core/common.md#declared-basis 판정 권한과 동시 종료 조건은 사용자 지시이며 저작자의 자가 승인이 아니다.
@evidence principles/core/settings.md#fact-status review 선언과 lint 성공은 시각 완료 사실이 아니라고 구별한다.
@evidence principles/core/settings.md#source-support 관찰자를 틀리지 않는 권위로 간주하지 않고 실제 계측으로 원인을 확인하라는 직접 지시를 따른다.
@evidence principles/core/settings.md#capability-boundary 저작자는 수리·분업을 소유하지만 스스로 review를 선언하지 못하며 독립 판정에 제출한다.
@evidence principles/core/settings.md#constraint-sufficiency 닫힌 단계를 다시 열려면 결함·이유를 기록하고 구현 순서와 evidence 부모 조건을 함께 지킨다.
@evidence principles/core/settings.md#observable-identity 다섯 reference 모두에서 방·건물 판독의 미완료가 양측에 없어야 하므로 단일 미관 프레임으로 종료하지 않는다.
-->

사용자 지시: 저작자는 source·분업·수리를 소유하고 관찰자는 계측만 하며 별도 독립 read-only reviewer가 판정한다. 관찰을 원인으로 단정하지 않고 실제 계측으로 확인한다. 거친 매스·공간 그래프와 표면 분해 선언을 먼저, 외피, 규칙 기반 반복 모듈, fit-out, 마감 순서로 닫는다. 닫힌 단계를 다시 열 때에는 영향을 준 실제 결함과 이유를 기록한다. stage는 disabled→draft→evidence→review로 전진하고 저작자가 스스로 review를 선언하지 않는다. 검토 제출 후 조정자가 reviewer를 배정한다. 이 사용자 순서는 구현의 거친 결이고 evidence의 부모 선행 조건도 함께 지킨다. 완성은 다섯 reference 모두에서 저작자의 미완료 목록과 관찰자의 미완료 목록이 동시에 비었을 때다. lint 성공이나 review 선언만으로 시각 완료를 주장하지 않는다.

## 측정과 실패 기록 {#measurement-truth}

<!--
@evidence principles/core/common.md#scope-preservation 성공 외에 미지원·폐기·악화·오류·우회·미완료까지 같은 비중의 기록 대상으로 둔다.
@evidence principles/core/common.md#substantive-completion 숫자는 compiled 산출물, 형태 판독은 프레임, 도구 없는 항목은 unverified로 나누어 증거 역할을 확정한다.
@evidence principles/core/common.md#declared-basis 계측 자료의 소유와 실패 기록 방식은 사용자 지시이며 settings 수치는 저작 입력임을 밝힌다.
@evidence principles/core/settings.md#fact-status 범위 값·실제 측정·미검증을 구분하고 프로세스가 시작되지 않은 실패의 종료 코드는 만들지 않는다.
@evidence principles/core/settings.md#source-support 실제 command와 산출물에서만 수치를 얻도록 하며 유사 명령이나 기억의 값으로 근거를 바꾸지 않는다.
@evidence principles/core/settings.md#capability-boundary 관찰 프레임은 공간 정체성을 답하며 ID·binding·치수를 판독하는 대체 계측기로 쓰지 않는다.
@evidence principles/core/settings.md#constraint-sufficiency 매 turn 명령/종료 코드와 해당 소유 문서의 관찰 기록을 요구해 실패를 성공 문서 뒤에 숨기지 못한다.
@evidence principles/core/settings.md#observable-identity 그림이 답하는 질문을 리뷰 거리의 자기 형상과 방 정체성으로 특정한다.
-->

사용자 지시: 수·ID·위치·binding·치수는 실제 compiled 산출물에서 읽는다. 프레임은 리뷰 거리의 형태와 공간 정체성을 판정한다. 미지원·실패·시도 후 폐기·악화·오류·우회·미완료를 성공과 같은 비중으로 해당 소유 문서의 관찰과 작업 기록에 남긴다. 측정 수단이 없는 항목은 unverified로 남기고 비슷한 명령의 수치로 바꾸지 않는다. 실행 명령은 실제 종료 코드와 함께 매 turn 보고하며 프로세스가 시작되지 않은 실패에는 종료 코드를 발명하지 않는다. settings의 범위 값은 저작자 입력이며 compiled 측정치라고 부르지 않는다.

## 저작자 커밋 절차 {#author-commits}

<!--
@evidence principles/core/common.md#scope-preservation 명시 경로 staging부터 commit/push·실패 보고까지 저작자의 배포 책임을 다룬다.
@evidence principles/core/common.md#substantive-completion 공유 branch에서 add→commit→push를 정하고 non-fast-forward 거부 때 보고만 하도록 절차를 닫는다.
@evidence principles/core/common.md#declared-basis 2026-09-21 사용자가 정정한 공유 checkout 절차에 따라 pull --rebase를 금지한다.
@evidence principles/core/settings.md#fact-status branch와 명령은 실행할 절차의 사실이며 push 성공이나 새 커밋 생성의 증거가 아니다.
@evidence principles/core/settings.md#source-support 실제 명령 문자열을 직접 사용자 지시에 맞춰 적고 공유 checkout 동기화에 관한 별도 가정을 보태지 않는다.
@evidence principles/core/settings.md#capability-boundary 저작자 소유 경로만 stage하며 master·force-push·남의 변경 stash/수정과 우회 동기화를 허용하지 않는다.
@evidence principles/core/settings.md#constraint-sufficiency 생성 파일 정리와 ignored wiki 제외, 해시·push 종료 코드 및 차단 오류의 보고 조건을 정한다.
@evidence principles/core/settings.md#observable-identity 커밋 절차는 시각 대상을 새로 정하는 단위가 아니며 viewer 작성 시에도 동일한 소유 경계만 적용한다.
-->

사용자 지시(2026-09-21): 저작자가 최소 매 turn 끝, 단계 종료, viewer 작성 때마다 직접 커밋하고 푸시한다. 공유 checkout의 브랜치는 benchmark/1951-1953-harness 하나다. 저장소 루트에서 git add experimental/ancient-civic-temple로 이 production의 명시 경로만 스테이지하고, git commit -m "feat(experimental): <변경 내용 한 줄>", git push origin benchmark/1951-1953-harness 순서로 실행한다. git pull --rebase, git add -A, 다른 production·packages/*·.agents/*·루트 파일 스테이징, master 접촉, force-push, 임의 히스토리 재작성과 다른 저작자 커밋 수정은 금지한다. 다른 저작자의 수정·스테이징을 stash하거나 되돌리지 않는다. push가 non-fast-forward로 거부되면 오류를 보고하고 우회하지 않는다. 커밋 전에 이 production의 생성 산출물·캐시·임시 파일을 정리하고 gitignore된 .wiki는 커밋하지 않는다. 매 turn 커밋 해시와 push 종료 코드를 보고한다. sandbox가 git 또는 네트워크를 막으면 정확한 오류와 종료 코드를 기록하고 우회하지 않는다.

# 표현과 검증 조건

## 레퍼런스 권위 {#reference-authority}

사용자가 제공한 D:/AutoMovieBench/refs-20260916/1952/의 01-exterior.png, 02-section-axonometric.png, 03-common-room.png, 04-living-entry.png, 05-upper-private-floor.png가 순서대로 외관, 절개 조감, 후면 공용부, 현관·거실·계단, 상층 사적 구역의 입력이다. 원본 제공 이미지를 직접 본 인상은 형태·색·재료·관계의 근거이며 치수 도면이나 실재 주택 조사 자료는 아니다. 픽셀 비례의 역산과 이미지 속 숫자의 사실화는 하지 않는다. 02의 자동차는 10-house.md#garage의 명시적 차량 금지에 종속된다. 내부 시점 사이에서 계단 난간·창 배치가 다른 것은 10-house.md의 한 집 canon으로 통일한다. 나머지 충돌도 고정 그래프를 보존하며 조정하고 그래프 변경을 요구하는 경우 저작을 멈춰 조정자에게 올린다. 원본 이미지를 background, billboard, texture로 붙이지 않는다.

## 공통 재료와 외피 인상 {#visual-grammar}

레퍼런스에서 채택한 palette는 따뜻한 백색 수평 lap siding, 창틀과 차고문의 짙은 charcoal, 흰 trim, 붉은갈색 벽돌 기단과 굴뚝, 꿀빛/중간갈색 목재, 회베이지 실내 직물이다. 지붕은 작고 규칙적인 어두운 asphalt shingle의 중첩 결로 읽힌다. siding은 벽면 전체를 일관된 course로 덮고 brick은 기단·굴뚝·벽난로에만 연속적인 줄눈을 가지며 창·문을 가리지 않는다. 굴뚝은 왼쪽 벽난로에서 지붕 위로 솟는 벽돌 몸체와 마감 cap을 갖춘다. trim은 벽과 창·문·처마의 접합을 실제 돌출과 음영으로 설명한다. 불규칙한 색 패치로 재료를 대신하지 않는다. 실내 1층 마루, 상층 침실/복도 카펫, 욕실 타일, 차고 콘크리트의 경계는 방의 사용과 맞는다. 정확한 광학값·텍스처 scale·UV는 materials가, 각 면의 경계는 spaces/models가 소유한다.

## 표현 수준 {#fidelity}

이 production의 사용자 지시는 매스와 지붕, 개구부 비례/위치, 포치·기둥·처마·trim·굴뚝·계단·난간·창호·문짝, 재료·빛·그림자·조경과 모든 실내가 실제 캡처에서 읽혀야 한다는 것이다. 결정론적 3D 자체가 검토 대상이다. 단순 blocking 또는 topology PASS만으로 이 요구를 낮추지 않는다. 사진과의 픽셀 일치나 측량·구조 안전·법규 인증은 주장하지 않지만, 이 한계가 부재나 생활 기능의 생략을 허용하지는 않는다. 외부 생성 이미지로 품질을 보충하거나 보이는 부분만 별도 모델로 만들지 않는다.

## 빛과 기준 상태 {#lighting-state}

01의 부드러운 늦은 오후 인상을 저작 기준으로 삼는다. 제작 선택상 key light는 집의 전면 왼쪽 위에서 오고 그림자는 뒤 오른쪽으로 놓이며 하늘의 부드러운 fill이 깊은 그늘을 완전 검정으로 닫지 않는다. 일조 방향은 지리/날짜 계산값이 아니다. 실내는 창 자연광과 켜진 따뜻한 천장등·주방 pendant·식탁등·협탁등이 함께 읽히고 조명 기구가 발광판 하나로 공간을 평평하게 지우지 않는다. 날씨는 맑거나 얇은 구름, 바람과 강수는 정지다. 고정 노출과 white balance를 기록하고 어두운 방을 view별 임의 밝기로 숨기지 않는다. 각 방의 필요 광원·그림자·재질 반응은 systems/materials가 실현한다.

## 실제 3D 렌더 경계 {#renderer-boundary}

사용자 지정 경로는 원근 camera·WebGL 깊이·재질·조명·그림자를 사용하는 실제 3D viewer다. 라벨 기본 꺼짐과 검사 모드 분리는 00-production.md#operator-access를 따른다. GPU 검토는 저장소 viewer-verification skill의 Playwright channel: "chromium"을 사용하고 건물을 그리는 실제 canvas의 RENDERER 문자열을 보고한다. 기본 헤드리스 채널의 소프트웨어 래스터 결과나 별도 빈 canvas의 하드웨어 probe는 건물 GPU 프레임의 증거가 아니다. 캡처가 빈 화면·에러 배너·건물을 가리는 overlay이면 결함이다. 수동 calibration 형상을 검사 모드에서 먼저 보고 축·scale·깊이를 확인하며, preserveDrawingBuffer와 렌더 완료 동기화 등 실제 캡처 경계는 source가 읽은 API로 구현한다.

## 리뷰 프레임 조건 {#frame-condition}

제작 선택으로 비교 프레임은 canvas 1536×1024, device pixel ratio 1, 색을 가리지 않는 중성 배경을 기본으로 한다. 외부 기본 view는 정면 약간 오른쪽에서 사람 눈높이 1.6 m, 수직 FOV 45°로 집과 포치·차도·대지 접점이 화면 안에 들어오는 거리에서 촬영한다. 높이 있는 roof view는 독립 외부 관찰로 추가한다. 실내 threshold·모서리·중심 view는 완성 바닥 위 1.6 m, 수직 FOV 60°, near 0.05 m를 초기 선택으로 삼되 실제 경계에 따라 시점을 안쪽으로 옮긴 근거와 최종 pose를 기록한다. 극단적 광각이나 orthographic 실내가 방의 통행 문제를 감추지 않게 한다. 세부가 안 읽히면 가까운 보충 view를 더하고 원래 질문은 남긴다. 02는 절개 검사로만 비교하며 외피를 켠 01·03·04·05 전달용 view를 대체하지 않는다.

## 관찰 배분 {#observation-allocation}

settings 전체 관찰 의무의 원문은 ../contracts/observation-denominator.md#compiled-denominator다. spaces가 storey·방·실제 노출 경계·지붕·개구부의 정체성과 연결을 만들고 matching source가 그 컴파일 산출물에서 질문·id·pose·binding을 파생한다. viewer는 그 위치와 보는 방향을 그대로 실현하고 방 안 질문이 다른 방이나 벽을 보는지 확인한다. 레퍼런스 01은 온전한 외관, 02는 두 층의 분리 검사, 03은 연속 공용부, 04는 현관/거실/단일 계단 관계, 05는 복도/문/침실/욕실과 계단참을 추가로 묻는다. 아직 topology가 없는 settings에서는 관찰 수를 상수로 정하거나 수행 완료로 기록하지 않는다.

## 측정과 프레임의 책임 {#data-authority}

사용자 지시에 따라 수·id·위치·binding·치수는 컴파일된 산출물에서 읽는다. 문 두 개가 같은 방 이름을 연결한다는 정보로 실제 뚫린 문이나 장애물 없는 경로를 추정하지 않는다. 실제 경계·문턱·개구부·층판·가구 점유에 대한 검사와 실내 시점의 포함 여부를 별도로 답한다. 프레임의 질문은 리뷰 거리에서 그 부재가 자기 자신으로, 방이 그 방으로 읽히는가다. 계측 도구가 실패하거나 아직 없으면 해당 항목은 unverified이며 비슷한 명령·수작업 추정·소스 상수를 결과처럼 대체하지 않는다. 관찰은 revision·입력·실제 camera·raster·runtime·검사 모드 여부와 결합하고 stale frame을 새 결과로 쓰지 않는다.

## 표면 분해 인계 {#surface-allocation}

../contracts/surface-ownership.md#whole-surface-owner를 1단계 폐쇄의 필수 산출물로 적용한다. spaces는 외부 입면, 각 방 내부의 완결 면, 각 층 바닥·천장·계단 구멍과 접합의 owner 및 source 파일 경계를 처음부터 선언한다. models는 그 경계를 받아 두께 있는 부재를, instances는 측정값과 반복 법칙으로 외장 모듈을, materials는 동일 surface binding으로 마감을 구현한다. 같은 완결 표면의 무작위 레코드 복제나 여러 소유자의 독립 기준을 허용하지 않는다. 저작자 한 명이 구현해도 표면 소유와 파일 분해를 생략하지 않는다. 이번 settings는 이 인계 의무를 정하며 실제 면 목록은 1단계 topology 없이는 완료할 수 없다.

## 실행과 모듈 경계 {#execution-boundary}

사용자 지시로 @automovie/engine의 CommonJS 경계를 유지한다. 엔진을 ESM으로 바꾸거나 directory re-export를 monkeypatch·hardcode·우회 설정으로 통과시키지 않는다. viewer 구현의 선택은 서버 측 CJS에서 공개 엔진 API로 현재 source를 해석하고 그 산출물을 브라우저에 전달하는 구조다. 서버는 별도 집을 생성하지 않고 응답 데이터는 일시적인 전송값이며 추가 JSON 상태 파일을 남기지 않는다. 생성된 package.json의 기존 도구 설정 자체를 엔진 ESM 전환의 허가로 해석하지 않는다. 구체 entry·실행기·API·의존성은 설치본을 읽고 source 단계에서 결정하며 선언과 설치 권한은 implementation-boundary에 따른다. renderer가 경계를 못 지키면 조정자에게 제한을 보고하고 저장소 코드를 바꾸지 않는다.

## 저작 순서 {#lifecycle-boundary}

사용자의 제작 순서는 매스/공간 그래프와 표면 분해를 함께 닫고, 실제 외피 부재, 외피 반복 모듈, fit-out, 재료 읽힘과 정리로 전진하는 것이다. 1단계 폐쇄에는 모든 공간의 storey 소속과 모든 요구 공간에 실제 문·계단·복도로 끊김 없이 도달하는 검사가 포함된다. lifecycle상 settings를 먼저 완성하고 role-boundary의 독립 판정으로 다음 상태를 진행한다. 단계는 disabled → draft → evidence → review로만 전진하며 완료된 층을 되돌리지 않는다. 이후 오류는 이유를 기록해 최초 소유 내용을 수정하고 영향받은 검사를 다시 수행한다.

## 저작·계측·판정 권한 {#role-boundary}

사용자가 정한 역할에 따라 저작자는 이 production의 소스·자기 fan-out·수리를 소유하고, 관찰자는 계측하며, 독립 read-only reviewer가 단계 전이를 판정한다. 관찰은 원인이나 승인으로 받아들이지 않고 현재 산출물의 측정으로 반박할 수 있다. reviewer 배정과 그래프 변경이 필요한 충돌 결정은 조정자가 맡는다. 설치 권한은 implementation-boundary, 서버 기동은 viewer-handoff, 저작자의 커밋·푸시는 submission-boundary가 각각 소유한다. 저작자의 자체 검토가 독립 판정을 대체하지 않는다.

## 편집과 의존성 경계 {#implementation-boundary}

사용자가 허용한 편집 범위는 이 production의 저작 파일이다. packages, .agents, 다른 production, 저장소 루트 파일 및 human face 코드는 편집하지 않는다. 파일을 추가하기 전에 README의 ownership을 따른다. 필요한 의존성은 기존 package.json에 선언만 하고 설치는 조정자가 한다. 엔진과 뷰어의 모듈 경계는 execution-boundary에 따르며 설치된 기능의 부재를 저장소 수정이나 우회 설정으로 보충하지 않는다.

## 정규 검증 명령 {#validation-boundary}

사용자가 지정한 검증 명령은 이 production 디렉터리에서 README가 소유하는 npm run lint 그대로다. 대체 명령, 추가 플래그, binary 직접 호출과 우회 설정을 사용하지 않는다. 보고에는 실제 실행한 명령과 종료 코드를 함께 적고, 실행되지 않은 명령이나 결과를 수령하지 못한 명령을 통과 또는 실패로 꾸미지 않는다. 측정 수단의 부재와 프레임의 책임은 data-authority에 따른다.

## 커밋과 푸시 {#submission-boundary}

사용자의 현재 지시에 따라 저작자가 최소 매 turn 끝과 단계 폐쇄/뷰어 구현 때 커밋·푸시한다. 파생 산출물·캐시·임시 파일을 정리하고 저장소 루트에서 git add experimental/modern-suburban-house, git commit -m "feat(experimental): <변경 요약>", git pull --rebase origin benchmark/1951-1953-harness, git push origin benchmark/1951-1953-harness 순서로 제출한다. 이 지정 브랜치 하나를 공유하는 다른 저작자의 경로는 스테이지하지 않고 다른 저작자의 커밋을 수정하지 않는다. git add -A, master 접촉, force-push와 지정 동기화 밖의 히스토리 재작성은 금지한다. .wiki는 gitignore된 작업 이력이므로 커밋하지 않는다. 매 turn 보고에 커밋 해시와 git push 종료 코드를 남긴다. Git 또는 네트워크가 거부되면 정확한 오류와 종료 코드를 보고하고 우회하지 않는다.

## 뷰어 실행 인계 {#viewer-handoff}

사용자 지시에 따라 뷰어를 구현했으면 시작 명령, 실행 디렉터리, 포트, 열어야 할 경로를 보고한다. 서버 기동과 유지는 조정자가 맡으며 저작 turn에서 서버를 띄우거나 살려 두지 않는다. 이 인계는 renderer-boundary가 요구하는 실제 3D 결과와 현재 소스 연결을 약화하지 않는다. viewer 미구현 상태에서는 이전 뷰어의 명령이나 주소를 새 실행 경로로 보고하지 않는다.

## 완료와 기록 {#completion-boundary}

../contracts/observation-denominator.md#dual-completion의 양쪽 목록과 독립 판정을 적용한다. 저작자는 매 round 자기 미완료를 보고하고 관찰자의 목록이 없으면 미수령으로 기록한다. 시도와 폐기, 악화, 오류와 우회, 표현 불가, unverified는 성공과 같은 비중으로 해당 저작 owner의 관찰 및 작업 이력에 남긴다. 판정은 현재 저작 내용과 산출물에 결합하며 이전 상태의 fingerprint를 재사용하지 않는다. lint 통과는 현재 선언의 검증이고 시각 품질 승인이 아니다. 최종 승인 전 모든 실제 관찰·추가 다섯 질문·현재 GPU 프레임이 독립 판정에 들어가야 한다.

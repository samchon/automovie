# Fit-out 소유권 역방향 점검

이 파일은 [어휘 목록](fitout-owner-lexicon.txt)을 사용하는 읽기 절차다. 저작 결정을 새로 소유하거나 판정 결과를 저장하지 않는다. production 루트에서 실행한다.

1. `lint.config.ts`에서 현재 `review`로 선언된 층을 읽고 해당 `docs/<layer>`와 `src/<source-layer>`, `docs/accounts`, `docs/contracts`, 부모·형제 설계 문서를 검색 범위로 적는다. 현재 범위는 `docs/settings docs/spaces docs/accounts docs/contracts src/spaces`다. 한 파일 또는 `src`만 검색하고 전수라고 쓰지 않는다.
2. `rg -n -f src/review/fitout-owner-lexicon.txt docs/settings docs/spaces docs/accounts docs/contracts src/spaces`로 가구·기구·소품·조명·차폐 어휘를 찾는다. `@evidenceReview`·`@evidenceExcludeReview` 행은 모두 원문 H2·인용 target·실제 source 호출 경로와 함께 읽는다. `배정|실현|조립|소유|둔다|놓|남긴다|수용|보증|배치|구현|맡`은 우선 검토할 동사일 뿐 필터의 끝이 아니다. 동사가 없어도 host가 생성하지 않은 물체의 결과를 보증하는 행을 찾는다.
3. 영어는 단어 경계로 `bedroom`·`stable`·`materials`·`daylight` 같은 부분 문자열을 제외한다. 창틀 `frame`, 구조 `stand`, 외피 `shade`·`roller`·`louvre`는 주변 H2와 실제 owner를 읽어 기계적 hit를 가구 소유 주장으로 세지 않는다. 한국어 `책임`도 책 소품으로 세지 않는다. 오탐을 버릴 때에도 해당 행의 실제 보증 대상을 확인한다.
4. 부모·형제의 물체 인계 문장과 `src/house/rooms/`에서 `interior.ts`를 제외한 모든 호출 파일의 `new Item(`, 직접 `a.box(`, 직접 `a.ellipsoid(`, `lights(`, `lining(` 작성 지점을 역방향으로 대조한다. 다섯 어휘의 호출 지점 수를 파일별로 세어 합계를 만들고, 반복이 만든 실제 element ID는 compiled scene에서 따로 센다. 각 작성 지점과 반복 element에 형상(models 또는 건축 spaces), 배치(instances), 발광(systems), 마감(materials)의 해당 owner를 연결하고 빈 owner를 남기지 않는다. `lining`은 room 건축 면, 나머지 물체는 model prototype·instance, `glow`를 낸 요소는 luminaire part와 system emitter 둘 다 필요하다. 선언만 있는 owner와 구현·판정된 prototype은 구분한다.
5. 변경한 H2의 review 행은 target 해시가 여전히 유효해도 원문을 다시 읽고 직접 다시 쓴다. `전부|모든|0건|일치|대조했다` 같은 수량·대조 행은 이번 트리의 생산자 출력과 개수를 연결한다. 재지 못한 항목은 `unverified`로 남긴다. `npm run lint`가 유일한 계약 검증 명령이며 이 검색은 의미 점검의 입력이다.

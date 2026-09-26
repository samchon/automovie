# 단계 3 source 검증 기록

2026-09-25 19:13Z의 현재 production에서 `npm run self-check -- --bench`는 lint와 다섯 순수 테스트 파일의 여섯 export를 포함한 22검사 중 4실패(exit 1)다. 실패는 model-coordinate-audit의 문법 밖 산문 소수, doc-review-numbers의 본문 밖 수치 후보, 그리고 검사 대상이 0인 docs/models review 및 face-binding-owner 탐침이다. 이 두 무검사 탐침은 종료 코드가 0이어도 집계에서 실패로 센다. 새 캐시를 쓴 별도 lint도 exit 0이었다.

건물 source 수리는 상층 여섯 방의 배치 y를 `plan.ts`의 `datum.floors[1]` 값 import로 통일하고, 13개 방 파일의 숫자 토큰 835개와 구조 파일 14개의 숫자 토큰 1,201개에서 반복 datum 0건을 확인했다. 원천을 바꾼 사본은 네 입면 body가 `innerX` 변경을 따르고, 주침대·욕실 세면대·세탁기·상층 수납장 실제 부재가 층고 변경을 따랐다. 내부 derive 감사는 plan scalar 4개, 소비자 family 58개(상층 fit-out transform 24개), 방 끝 8개, stringer/tread 쌍 72개에서 실패 0이다. 모집단 148개 datum 사용 가운데 임의 12개를 다시 리터럴로 바꾼 시험은 12/12 red다.

새 `src/spaces` review 행 여섯 개를 host의 호출과 값 import에 대조했다. `ground()`가 datum을 직접 import한다는 거짓 암시 한 곳을 `slabTop()`·`floorFinish()`·`ceiling()`·`partitions()`를 통한 간접 소비로 바로잡았다. 외부 탐침은 review 91행 중 64행을 표시하지만, 단일 export 밖의 호출 결과와 값 전이를 식별하지 못하는 표시가 많다. `src-literal-duplication`은 TS 44파일에서 중복 측정 리터럴 178개, 값 import 사슬로 연결되지 않은 후보 98개를 냈다. 이 수는 결함 확정 수가 아니다.

사물은 15공간의 목록 422개 전부에 문서상 설계 주소가 있다(45 prototype H2, 164상태, `@part` 표 1,221행·상태 부품 1,269개, 마감 결합 40행과 face 선언 14개). 현재 `src/models`와 `src/instances` 디렉터리가 없어 이 422개를 독립 source로 구현·배치했다고 보증할 수 없다. 산문 소수 1,525개 중 축 좌표 740개만 증인을 가졌고 비축 785개는 35개 H2에서 미검증 실패로 남는다. 모델 주소 변형 10/10과 마감 변형 10/10은 red였지만 이 숫자를 실물 구현으로 읽지 않는다.

일곱 외부 탐침은 소스 중복 후보 외에 docs review 수치 후보 42행(exit 1), 해결된 anchor 341개/끊김 0개, 공유 reason 0개를 냈다. `docs/models` review 행 0개와 외부 face-binding 탐침의 인용 0건은 무검사로 남는다. 단계 선언은 `spaces`·`spaceSources` review, `models` draft, `materials` evidence다. source 구현, 비축 수치 검증, 현재 트리 전체 GPU·연속 보행 검증과 무검사 탐침의 모집단 연결이 다음 판정의 차단이다.

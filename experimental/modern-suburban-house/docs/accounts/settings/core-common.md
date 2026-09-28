# 설정 모집단의 역할과 분량

## 세 설정 파일의 배분 {#population-allocation}
<!--
@evidence obligations/core/common.md#purpose-fit 00-production은 전달·조작·사용체와 제작 책임, 10-house는 실제 집과 각 생활 공간의 정체성, 20-verification은 참조·렌더·관찰·권한을 맡는다. 하나를 없애면 각각 사용자 접근 조건, 방별 설계 기준, 결과를 읽고 제출할 조건이 사라지므로 세 파일 모두 같은 주택 전달에 필요하다.
@evidenceReview obligations/core/common.md#purpose-fit #7b32c66 00을 빼면 사용체·조작 조건, 10을 빼면 집·방 정체성, 20을 빼면 그림과 제출 판단 조건이 없어진다는 본문의 비교를 세 파일 전체와 대조했다. 정적 library에 영화·대사 파일을 만들지 않은 이유도 일치한다.
@evidence obligations/core/common.md#layer-boundary 세 파일은 채택 사실·정체성·제약을 정하며 방 좌표와 부재 생성은 spaces/models, 광학값은 materials, 구체 entry·API와 렌더 동기화는 source로 넘긴다. 조정자가 지시한 뷰어 실행기 `tsx`와 포트 4173은 viewer-handoff 한 곳의 운영 조건이고, 비교 카메라의 초기값과 사용체 크기는 구현 코드가 아니라 설계를 제한하는 settings 조건이다.
@evidenceReview obligations/core/common.md#layer-boundary #5271f94 세 파일은 사실·제약을 소유하고 방 좌표·부재 생성·광학값은 design, entry·API·렌더 동기화는 source로 배분한다. 뷰어 실행기와 포트는 조정자 지시에서 온 운영 조건으로 viewer-handoff만 정하고 execution-boundary는 그것을 가리키므로 source 단계와 settings가 같은 결정을 나눠 갖지 않는다.
@evidence obligations/core/common.md#proportionate-development 주택 정체성의 22개 H2는 두 작은 침실·두 욕실·차고·서비스실을 각각 다루고, 전달 조건 10개와 검증 조건 17개는 전체 집의 사용·관찰을 지탱한다. 주석을 뺀 본문 배분과 승인된 draft를 비교했을 때 새 evidence가 방 설명을 대체하거나 줄인 곳은 없으며 작은 수납보다 계단·지붕·개구부에 더 많은 관계 조건을 배분했다.
@evidenceReview obligations/core/common.md#proportionate-development #78feb28 00의 10 H2/2700자, 10의 22/4572, 20의 17/5234를 본문 배분과 함께 읽었다. 계단·지붕·개구부의 관계 서술은 팬트리의 좁은 보관 기능보다 깊고 두 침실·두 욕실·차고가 별도 기능을 가져 수치만 부풀린 분해가 아니다.
-->

비교 모집단은 [제작 범위와 사용 조건](../../settings/00-production.md), [주택과 생활 공간의 정체성](../../settings/10-house.md), [표현과 검증 조건](../../settings/20-verification.md) 전체다. 각 파일은 settings라는 한 문서 역할을 가지며, 이 account는 그 파일 사이의 배분만 답한다. 개별 H2의 원칙 답변을 대신하지 않는다.

00의 사용체와 조작자는 10의 문·계단·방에 적용할 조건이고, 10의 집은 20의 현재 프레임과 전체 관찰에 노출된다. 10만 남기면 눈에 보이는 집을 설명해도 누가 어떤 경로로 검사할지 결정되지 않는다. 20만 남기면 GPU와 관찰 절차는 있어도 읽어야 할 집과 방의 정체성이 없다. 00은 이 둘의 전달 범위와 사용자·좌표·언어를 연결한다. 영화·대사·가족 전기 파일은 정적 library에 역할이 없어 만들지 않았다.

주석과 제목 및 공백을 제외한 본문 문자 배분은 00이 10개 H2 / 2700자, 10이 22개 / 4572자, 20이 17개 / 5234자다. 이는 저작량의 위치를 드러내는 수치이며 완성의 판정은 아니다. 계단은 단일 경로·참·층판 구멍·난간·치수 산출의 관계를 다루고, 팬트리는 선반·문·식품 접근의 더 좁은 결정을 다룬다. 두 자녀 침실은 동일한 기능을 가지면서 색·자기 창과 별도 문·관찰을 정하고, 두 욕실은 부스와 욕조 및 직접 복도 접근을 구별한다. 빈 차고에도 천장·문 레일·바닥·수납을 배분했으므로 차량 부재가 내부 생략으로 이어지지 않는다.

승인된 draft의 세 파일과 비교해 파일·H2 수와 방별 본문을 유지한다. 이번 본문 변경은 최신 사용자 정정에 따른 20의 submission-boundary에서 pull --rebase를 제거하고 공유 checkout·non-fast-forward 처리 경계를 반영한 것이다. 주석 증가를 새로운 공간 저작량으로 세지 않는다. settings에는 부모 저작 층이 없고 아직 design/source가 없어 부모 대비 내러티브 길이나 소스 실현 분포 비교는 적용하지 않는다. 현재 배분은 한 채의 두 층과 전체 실내를 설정하는 것이며 그 형상·도달성·시각 완성을 증명하지 않는다.

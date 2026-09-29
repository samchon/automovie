import { Assembly } from "../house/assembly";
import { front } from "../house/envelope/front";
import { left } from "../house/envelope/left";
import { rear } from "../house/envelope/rear";
import { right } from "../house/envelope/right";
import { roof } from "../house/envelope/roof";

/** Complete exterior surfaces, cut profiles and measured repeating assemblies.
 * @evidence spaces/003-surface-ownership.md envelope가 네 입면과 지붕의 완결 owner를 호출한다. 각 owner가 자기 벽·개구·창호·차양·외부 노출 마감 면·corner 조각의 안정 주소를 만들며 viewer용 대체 외피가 없다. 재료 결합은 materials가 결정한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 003의 plane·normal·clear span·frame 깊이·캐노피 외곽을 그대로 소비한다. 본채는 평지붕 직사각형이고 박공·굴뚝·옥상 통행이나 새 후문을 추가하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion façade는 공개 wall kernel의 닫힌 절삭 mesh, 깊이 있는 frame과 glass, 반복 stone panel·shade를 생성한다. roof는 실제 slab·edge·지지·PV cassette를 내므로 라벨이나 빈 boundary만 남는 구현이 아니다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 003의 전체 입면과 room별 opening을 동일 좌표에서 구현했고 유효 span 밖0.04m frame, 층선, 삼각 corner 분할을 유지했다. 닫힌 wall·창틀·불투명 return을 만들기 위해 room graph나 roof 형태를 바꿀 필요가 없었다. 광학·구조 성능 인증은 포함하지 않는다.
 * @evidence spaces/003-surface-ownership.md#whole-surface-owners front/rear/left/right/roof 모듈이 각 표면 전체를 소유하며 full facade boundary는 house에 귀속하고 그 face는 외측 O에 둔다. 구조 내벽·실내 수평 마감과 입면 아래 plinth는 storey 모듈, 현관 출입구 아래 문턱판과 계단 void 앞 외벽 실내 면은 전면 facade에 남는다.
 * @evidence spaces/003-surface-ownership.md#front-face 절삭 중심 z=-5.88, 외측 face z=-6.00·normal -Z의 벽에서 현관문·하상층 계단창·작업실창·상층 침실창을 절삭한다. -X 불투명 코어를 유지하고 표준 창 높이에서 짝을 선택해 두 floor 사이 spandrel cassette를 만든다.
 * @evidence spaces/003-surface-ownership.md#rear-face 절삭 중심 z=5.88, 외측 face z=6.00·normal +Z의 후면 벽에 common·primary·bathroom의 독립 opening을 두며 상층 코어 벽 끝을 넘어 유리를 잇지 않는다.
 * @evidence spaces/003-surface-ownership.md#left-face 절삭 중심 x=5.38, 외측 face x=5.50의 +X 외벽에 작업실과 child-one의 같은 z span, child-two의 별도 창을 구현한다. 전면과의 불투명 return은 삼각 corner 및 wall body로 닫는다.
 * @evidence spaces/003-surface-ownership.md#right-face 절삭 중심 x=-5.38, 외측 face x=-5.50의 -X 외벽에서 전면 서비스 영역을 불투명하게 닫고 후면 common·bath 두 창만 같은 z span에 둔다.
 * @evidence spaces/003-surface-ownership.md#roof-face roof가 B/J/T/P와 R의 경사에서 주보·분절 rail·열린 cassette·지지·거터·outlet·overflow를 만들고 right가 y=6.10 아래 관을 이어 준다. top·soffit도 native boundary로 내며 정비 식재는 이 export가 중복 생성하지 않고 site-access를 실현하는 citizenHouseSpaceSource의 garden 호출에 남긴다.
 * @evidence spaces/003-surface-ownership.md#glazing-interface 각 창의 jamb·mullion은 member 중심에서 body·web·압착판·덮개 네 부재, head·sill은 bay마다 같은 단면의 네 부재를 인접 수직 부재의 같은 부재 face까지 이어 맞댄다. 유리는 seat 안으로 0.006 들어가고 gasket과 setting block이 받친다. cut 안쪽 reveal, 표준 창 높이와 층 datum에서 유도한 층간 cassette, 입면 몸체 끝에서 자른 drip, 전면·좌측 작업실과 침실 창의 하부 루버를 같은 owner가 만들고, 후면 주침실 창에는 루버를 두지 않는다.
 * @evidence spaces/003-surface-ownership.md#front-stair-glazing stair hole 양 끝에서0.04 안쪽인 x=-1.20..1.54를 하상층으로 나누고 floor+0.12/ceiling-0.10에 glass를 둔다. entry와 upper-storey의 소속을 각 fill element에 기록한다.
 * @evidence spaces/003-surface-ownership.md#front-flex-glazing x=3.06..5.22의 ground opening이 작업실 clear face 안에 frame까지 들어간다. 낮에는 하부 반투명, 상부 clear이며 사적·야간 상태는 같은 opening의 shade를 내린다.
 * @evidence spaces/003-surface-ownership.md#front-bedroom-glazing child-one의 x=1.80..5.22 span에 하층 작업실 서측 jamb 중심 x=3.04를 우선 분할선으로 넣고, 상층 sill/head와 privacy band를 따로 적용한다.
 * @evidence spaces/003-surface-ownership.md#rear-common-glazing rear.ts는 roomEdge("common-room", "x", "min/max")에서 glazingInset을 양끝에 적용해 현재 x=-5.22..5.22의 고정 curtainwall을 만든다. 뒤뜰로 통하는 추가 door나 route는 없다.
 * @evidence spaces/003-surface-ownership.md#rear-bedroom-glazing primary의 x=-2.80..5.22 span을 upper floor에 맞춰 나누며 -X 욕실과 shared wall의 끝을 관통하지 않는다.
 * @evidence spaces/003-surface-ownership.md#rear-bath-glazing x=-4.86..-3.42,y=4.20..5.65에 고정 반투명 유리를 만들고 욕실의 방 바인딩을 유지한다. 침실의 전기변색 상태로 바꾸지 않는다.
 * @evidence spaces/003-surface-ownership.md#left-flex-glazing z=-5.40..-2.30의 ground 측창을 전면 창과 별개인 직교 opening으로 절삭하고 하부 띠 앞에 루버를 둔다. 앞 모서리까지 유리를 연장하지 않는다.
 * @evidence spaces/003-surface-ownership.md#left-bedroom-glazing 작업실 측창과 같은 z span·bay 규칙을 상층 child-one에 적용하고 하부 띠 앞에 루버를 둔다. floor band를 가로지르는 panel을 만들지 않는다.
 * @evidence spaces/003-surface-ownership.md#left-child-two-glazing child-two의 z=0.35..1.90,y=3.90..5.80 opening을 독립 window로 구현하고 하부 1.25m 띠 앞에 루버를 둔다. 인접 침실과 한 창으로 묶지 않는다.
 * @evidence spaces/003-surface-ownership.md#right-common-glazing core 후면 z=3.60..5.40에서 ground common의 측창만 절삭한다. 나머지 코어 벽은 불투명 panel 몸체다.
 * @evidence spaces/003-surface-ownership.md#right-bath-glazing 위층 같은 z span에 전면 반투명 bath glass를 두고 room·floor 경계를 보존한다. bath glazing은 세 privacy 상태에서도 고정 반투명이다.
 * @evidence spaces/003-surface-ownership.md#envelope-corners 각0.24×0.24 코너를 inner–outer 대각선의 두 convex triangle prism으로 나눈다. 한 조각은 정면/후면, 다른 조각은 측면이 소유하고 각 boundary가 자기 실물 element를 참조한다.
 */
export function envelope(a: Assembly): void {
  front(a);
  rear(a);
  left(a);
  right(a);
  roof(a);
}

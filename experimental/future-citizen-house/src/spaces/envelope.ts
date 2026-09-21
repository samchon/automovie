import { Assembly } from "../house/assembly";
import { front } from "../house/envelope/front";
import { rear } from "../house/envelope/rear";
import { left } from "../house/envelope/left";
import { right } from "../house/envelope/right";
import { roof } from "../house/envelope/roof";
/** Complete exterior surfaces, cut profiles and measured repeating assemblies.
 * @evidence spaces/003-surface-ownership.md envelope가 네 입면과 지붕의 완결 owner를 호출한다. 각 owner가 자기 벽·개구·창호·차양·외부 마감·corner 조각을 함께 만들며 viewer용 대체 외피가 없다.
 * @evidenceReview spaces/003-surface-ownership.md 003의 다섯 면과 유리 상태·corner 접합을 buildEnvelope가 소비하므로 소유권 문서만 있고 빠진 외피 생산자가 없다.
 * @evidence principles/core/source-units.md#source-scope-preservation 003의 plane·normal·clear span·frame 깊이·캐노피 외곽을 그대로 소비한다. 본채는 평지붕 직사각형이고 박공·굴뚝·옥상 통행이나 새 후문을 추가하지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation 외피 export는 facade·roof를 반환하며 계단이나 실내 room 경계를 다시 저작하지 않아 003의 표면 책임에 머문다.
 * @evidence principles/core/source-units.md#source-substantive-completion façade는 공개 wall kernel의 닫힌 절삭 mesh, 깊이 있는 frame과 glass, 반복 stone panel·shade를 생성한다. roof는 실제 slab·edge·지지·PV cassette를 내므로 라벨이나 빈 boundary만 남는 구현이 아니다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion 열거한 opening마다 cut·frame·pane이 실제 부재로 생성되며 재료의 시각적 단순함을 topology 완료와 혼동하지 않는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 003의 전체 입면과 room별 opening을 동일 좌표에서 구현했고 유효 span 밖0.04m frame, 층선, 삼각 corner 분할을 유지했다. 닫힌 wall·창틀·불투명 return을 만들기 위해 room graph나 roof 형태를 바꿀 필요가 없었다. 광학·구조 성능 인증은 포함하지 않는다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work 003의 floor band·room 끝·corner return으로 모든 외피 cut을 만들 수 있어 envelope 조립에서 상위 고정 그래프를 수정할 결손은 없었다.
 * @evidence spaces/003-surface-ownership.md#whole-surface-owners front/rear/left/right/roof 모듈이 각 표면 전체를 소유하며 full facade boundary는 house에 귀속한다. 구조 내벽과 실내 수평 마감은 storey 모듈에 남긴다.
 * @evidenceReview spaces/003-surface-ownership.md#whole-surface-owners front·rear·left·right·roof를 각 파일에서 조립하고 room lining은 실내 owner에 남겨 완결 표면을 가구 파일에 분산시키지 않는다.
 * @evidence spaces/003-surface-ownership.md#front-face z=-5.88,normal -Z의 벽에서 현관문·하상층 계단창·작업실창·상층 침실창을 절삭한다. -X 불투명 코어와 두 floor 사이 spandrel을 보존한다.
 * @evidenceReview spaces/003-surface-ownership.md#front-face front owner가 문·계단 유리·방 유리를 자신의 벽에 절단하고 -X 코어는 불투명 실체로 남긴다.
 * @evidence spaces/003-surface-ownership.md#rear-face z=5.88,normal +Z의 후면 벽에 common·primary·bathroom의 독립 opening을 두며 상층 코어 벽 끝을 넘어 유리를 잇지 않는다.
 * @evidenceReview spaces/003-surface-ownership.md#rear-face rear owner가 common·primary·bath 개구와 층 band를 한 면에 조립하여 실내 room 경계를 외관에서 보존한다.
 * @evidence spaces/003-surface-ownership.md#left-face +X 외벽 x=5.38에 작업실과 child-one의 같은 z span, child-two의 별도 창을 구현한다. 전면과의 불투명 return은 삼각 corner 및 wall body로 닫는다.
 * @evidenceReview spaces/003-surface-ownership.md#left-face left facade는 flex·child-one·child-two의 cut만 받고 나머지 측면은 stone 부재로 남긴다.
 * @evidence spaces/003-surface-ownership.md#right-face -X 외벽 x=-5.38의 전면 서비스 영역을 불투명하게 닫고 후면 common·bath 두 창만 같은 z span에 둔다.
 * @evidenceReview spaces/003-surface-ownership.md#right-face right facade 전면은 불투명으로 남고 후면 두 창만 절단되어 주거 코어의 외피 역할이 구분된다.
 * @evidence spaces/003-surface-ownership.md#roof-face 본채11×12 slab의 top6.40,얇은 edge와 짧은 분산 지지 위에 underside6.70의 PV canopy를 만든다. canopy top과 soffit도 native boundary로 관찰 대상에 포함한다.
 * @evidenceReview spaces/003-surface-ownership.md#roof-face roof가 명시된 평지붕·edge·반복 PV와 짧은 지지를 생성하지만 v-071이 지적한 캐노피 표현 밀도는 별도 개선 대상으로 남는다.
 * @evidence spaces/003-surface-ownership.md#glazing-interface clear span 바깥0.04 frame과 내부0.04 mullion을 따로 계산하고 glass에서 frame 점유를 뺀다. 각 독립 span은 ceil(span/1.25)로 등분하며 cut·glass·shade가 같은 측정값을 쓴다.
 * @evidenceReview spaces/003-surface-ownership.md#glazing-interface 외곽 jamb와 내부 mullion을 뺀 pane 폭을 계산해 glass와 frame이 동일 치수를 중복 점유하지 않는다.
 * @evidence spaces/003-surface-ownership.md#front-stair-glazing stair hole 양 끝에서0.04 안쪽인 x=-1.20..1.54를 하상층으로 나누고 floor+0.12/ceiling-0.10에 glass를 둔다. entry와 upper-storey의 소속을 각 fill element에 기록한다.
 * @evidenceReview spaces/003-surface-ownership.md#front-stair-glazing 계단 전면 유리는 두 층을 각각 만들고 사이 floor band를 남겨 무지지 통유리 한 장으로 대체하지 않는다.
 * @evidence spaces/003-surface-ownership.md#front-flex-glazing x=3.06..5.22의 ground opening이 작업실 clear face 안에 frame까지 들어간다. 낮에는 하부 반투명, 상부 clear이며 사적·야간 상태는 같은 opening의 shade를 내린다.
 * @evidenceReview spaces/003-surface-ownership.md#front-flex-glazing flex 전면 cut과 frame을 방의 clear X 범위에 넣고 하부 반투명 구간을 생성하여 실내 lining 밖으로 개구를 밀지 않는다.
 * @evidence spaces/003-surface-ownership.md#front-bedroom-glazing child-one의 x=1.80..5.22 span에 하층 작업실 서측 jamb 중심 x=3.04를 우선 분할선으로 넣는다. 상층 sill/head와 privacy band를 따로 적용한다.
 * @evidenceReview spaces/003-surface-ownership.md#front-bedroom-glazing 상층 전면 child-one 유리는 하층 flex jamb 중심선을 분할 기준으로 사용하여 floor 위아래 베이가 어긋나지 않는다.
 * @evidence spaces/003-surface-ownership.md#rear-common-glazing common의 후면 clear 폭에서 frame margin을 뺀 x=-5.22..5.22에 고정 curtainwall을 만든다. 뒤뜰로 통하는 추가 door나 route는 없다.
 * @evidenceReview spaces/003-surface-ownership.md#rear-common-glazing rear-common은 한 room 전체의 고정 유리로 조립되며 설계에 없는 뒤 출입 connector를 만들지 않는다.
 * @evidence spaces/003-surface-ownership.md#rear-bedroom-glazing primary의 x=-2.80..5.22 span을 upper floor에 맞춰 나누며 -X 욕실과 shared wall의 끝을 관통하지 않는다.
 * @evidenceReview spaces/003-surface-ownership.md#rear-bedroom-glazing rear-primary의 서측 끝은 bathroom shared wall에서 멈춰 침실 창이 욕실 안까지 이어지지 않는다.
 * @evidence spaces/003-surface-ownership.md#rear-bath-glazing x=-4.86..-3.42,y=4.20..5.65에 고정 반투명 유리를 만들고 욕실의 방 바인딩을 유지한다. 침실의 전기변색 상태로 바꾸지 않는다.
 * @evidenceReview spaces/003-surface-ownership.md#rear-bath-glazing 욕실 후면 pane은 높은 sill과 frosted 재료를 사용하여 다른 rear 유리와 같은 clear 상태로 풀리지 않는다.
 * @evidence spaces/003-surface-ownership.md#left-flex-glazing z=-5.40..-2.30의 ground 측창을 전면 창과 별개인 직교 opening으로 절삭한다. 앞 모서리까지 유리를 연장하지 않는다.
 * @evidenceReview spaces/003-surface-ownership.md#left-flex-glazing left-flex glazing을 모서리에서 물려 전면 창과 사이에 실제 불투명 return을 유지한다.
 * @evidence spaces/003-surface-ownership.md#left-bedroom-glazing 작업실 측창과 같은 z span·bay 규칙을 상층 child-one에 적용한다. floor band를 가로지르는 panel을 만들지 않는다.
 * @evidenceReview spaces/003-surface-ownership.md#left-bedroom-glazing left-bedroom glazing이 하층 flex의 Z 범위와 반복 간격을 이어 상하층 측면 창호의 정렬을 유지한다.
 * @evidence spaces/003-surface-ownership.md#left-child-two-glazing child-two의 z=0.35..1.90,y=3.90..5.80 opening을 독립 window로 구현한다. 인접 침실과 한 창으로 묶지 않는다.
 * @evidenceReview spaces/003-surface-ownership.md#left-child-two-glazing left-child-two의 짧은 높은 창은 중간 침실 cell 안에만 생성되어 앞 침실의 긴 창을 복제하지 않는다.
 * @evidence spaces/003-surface-ownership.md#right-common-glazing core 후면 z=3.60..5.40에서 ground common의 측창만 절삭한다. 나머지 코어 벽은 불투명 panel 몸체다.
 * @evidenceReview spaces/003-surface-ownership.md#right-common-glazing right-common의 유리 구간을 후면 z=3.60..5.40에 한정해 전면 설비 코어를 투명화하지 않는다.
 * @evidence spaces/003-surface-ownership.md#right-bath-glazing 위층 같은 z span에 전면 반투명 bath glass를 두고 room·floor 경계를 보존한다. bath glazing은 세 privacy 상태에서도 고정 반투명이다.
 * @evidenceReview spaces/003-surface-ownership.md#right-bath-glazing right-bath glazing은 하층 common과 Z span을 맞추되 frosted 상태로 만들어 코어의 프라이버시를 유지한다.
 * @evidence spaces/003-surface-ownership.md#envelope-corners 각0.24×0.24 코너를 inner–outer 대각선의 두 convex triangle prism으로 나눈다. 한 조각은 정면/후면, 다른 조각은 측면이 소유하고 각 boundary가 자기 실물 element를 참조한다.
 * @evidenceReview spaces/003-surface-ownership.md#envelope-corners 외벽 모서리를 두 삼각 기둥으로 나누어 각 facade의 온전한 return 소유권과 외곽 폐합을 함께 유지한다.
 */
export function envelope(a: Assembly): void { front(a); rear(a); left(a); right(a); roof(a); }

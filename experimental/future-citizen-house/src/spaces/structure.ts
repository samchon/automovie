import { Assembly } from "../house/assembly";
import { topology } from "../house/topology";
import { ground } from "../house/storeys/ground";
import { upper } from "../house/storeys/upper";
import { stair } from "../house/circulation/stair";
/** Realize the clear cells, shared boundaries, floors and one stair together.
 * @evidence spaces/002-spatial-graph.md 이 함수는 topology·두 storey·단일 stair를 조립하여 002의 매스, 방 경계, 문과 계단을 실물과 native graph로 함께 반환한다.
 * @evidence principles/core/source-units.md#source-scope-preservation plan의 clear cell과 datum으로만 shared wall을 도출하고 002가 금지한 별도 복도·계단·보이드를 추가하지 않는다. 바닥·천장·partition은 각 층의 파일이 소유한다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 바닥·분할·계단과 내부 가구까지만 이 조립이 맡고 외부 커튼월 표면은 envelope owner에 남긴다.
 * @evidence principles/core/source-units.md#source-substantive-completion topology는 실제 convex cells, partitions는 공개 wall kernel로 절삭한 solid와 opening operation, stair는 18개 tread 및 참을 만든다. 위임 대상은 모두 현재 호출되는 구체 함수이며 빈 source wrapper가 아니다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f rooms·walls·stair가 실제 geometry와 connector를 반환하므로 설계 배열을 복사한 메타데이터만으로 소스 실현을 주장하지 않는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work 002의 3.20m 층차, clear cell, 0.18m shared wall과 단일 꺾임계단을 그대로 구현했다. connector.steps.run이 참을 포함한 전체 route 길이를 검사하므로 그 선택 필드는 생략하고 명목 going은 실제 tread geometry에서 읽게 했다. 설계 route나 치수를 바꾸어 engine metric에 맞추지 않았다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 002가 정한 L형 seam·계단 hole·문 열림을 구현할 입력이 모두 있어 구조 export에서 부모 방 수나 corridor 형식을 바꿀 필요는 없었다.
 * @evidence obligations/design/space-sources.md#space-source-design-ownership 매스·층은 datum, room은 rooms, passage는 portals가 해당 H2의 입력을 하나씩 소유한다. walls는 마주보는 clear face의 교집합이며 뷰어가 별도 방 경계를 정의하지 않는다. 현재 재작성의 독립 판정은 아직 미지급이다.
 * @evidenceReview obligations/design/space-sources.md#space-source-design-ownership #c0afa1f 구조 조립은 designPlan의 방·층·개구 주소를 받아 사용하며 검증 편의를 위한 독립 공간 그래프를 만들지 않는다.
 * @evidence spaces/002-spatial-graph.md#mass-and-storeys 11×12 외곽, 외벽0.24, 내벽0.18, floor0/3.20, ceiling2.90/6.10을 plan에서 공유한다. gross와 clear cell 면적은 구분하며 audit가 각 방 cell 면적을 산출한다.
 * @evidenceReview spaces/002-spatial-graph.md#mass-and-storeys #53ac292 11×12m 외곽과 3.20m 상층 datum을 하나의 house에 조립하여 면적 목표를 별동이나 추가 층으로 보충하지 않는다.
 * @evidence spaces/002-spatial-graph.md#ground-level ground는 기초·마감 바닥·천장·partition을 생성한다. 다섯 하층 room의 parent가 ground-storey인지 audit에서 확인한다.
 * @evidenceReview spaces/002-spatial-graph.md#ground-level #16fe591 ground-level이 1층 room들의 부모이고 y=0 바닥이 외부 landing 및 첫 계단 단과 같은 높이를 소비한다.
 * @evidence spaces/002-spatial-graph.md#upper-level upper는 계단 hole을 제외한 slab과 방별 연속 바닥을 생성한다. 일곱 상층 room이 upper-storey에 속하고 그 cell 꼭짓점은 부모 포함 판정을 받는다.
 * @evidenceReview spaces/002-spatial-graph.md#upper-level #f24bb63 upper-level의 y=3.20 바닥과 y=6.10 천장이 침실·욕실·복도에 공통으로 적용된다.
 * @evidence spaces/002-spatial-graph.md#ground-partition 다섯 room의 clear cell에서 마주보는 face segment를 찾아 공유 벽을 생성한다. 현관–작업실·powder·공용부와 공용부–수납 연결은 해당 portals에만 존재한다.
 * @evidenceReview spaces/002-spatial-graph.md#ground-partition #5445973 1층 방의 대향 clear face에서 shared wall을 산출하여 수납·위생실 사이 잔여 틈을 임의의 복도로 만들지 않는다.
 * @evidence spaces/002-spatial-graph.md#entry entry는 x=-2.84..2.84,z=-5.76..-0.32 cell이며 계단 동측 보행대와 네 직접 출입 관계를 가진다. 별도 현관 corridor를 생성하지 않는다.
 * @evidenceReview spaces/002-spatial-graph.md#entry #bf2f088 현관 room 안에서 계단 동측 보행 띠와 세 목적지 개구가 연결되어 계단만 있고 통행 공간이 없는 구성이 아니다.
 * @evidence spaces/002-spatial-graph.md#flex-workroom flex-workroom은 x=3.02..5.26의 하층 전면 cell이고 entry-flex로만 진입한다. 실제 pocket leaf는 -Z로 이동한다.
 * @evidenceReview spaces/002-spatial-graph.md#flex-workroom #4b08fbc flex는 전면 동측의 2.24m 폭 cell과 entry 출입으로 생성되며 common 쪽 폐쇄 벽을 지름길로 사용하지 않는다.
 * @evidence spaces/002-spatial-graph.md#common-room common-room은 z=-0.14..5.76의 연속 cell 하나다. 거실·식당·주방 사이에 partition이나 추가 문을 만들지 않는다.
 * @evidenceReview spaces/002-spatial-graph.md#common-room #b06ac33 후면 common의 거실·식당·주방을 한 room과 연속 바닥으로 조립하여 가구 배치가 추가 분할 벽을 만들지 않는다.
 * @evidence spaces/002-spatial-graph.md#powder-utility powder-utility는 -X 전면 코어의 x=-5.26..-3.02,z=-5.76..-2.24 cell이다. entry-powder가 유일한 통행 연결이다.
 * @evidenceReview spaces/002-spatial-graph.md#powder-utility #212302a powder-utility는 -X 전면 cell과 현관 문을 갖고 급배수 가구가 common 쪽으로 위생실 경계를 넓히지 않는다.
 * @evidence spaces/002-spatial-graph.md#storage-1f storage-1f는 powder 뒤 z=-2.06..-0.32 cell이며 공용부에만 문이 있다. 현관과 powder의 인접 벽은 닫는다.
 * @evidenceReview spaces/002-spatial-graph.md#storage-1f #2360e96 1층 수납은 common 문으로만 접근하고 powder·entry 면을 닫아 별도의 숨은 연결이 생기지 않는다.
 * @evidence spaces/002-spatial-graph.md#door-interface clear 폭 밖에0.06 jamb·head를 만들고 두께0.045 leaf와 손잡이를 실제 element로 연결한다. native revolute/prismatic state가 open을 적용하며 passage는 leaf가 없다.
 * @evidenceReview spaces/002-spatial-graph.md#door-interface #0b0ffd8 clear opening 밖 jamb·head와 두께 있는 leaf를 조립하고 열린 leaf도 장애물로 남겨 사각 구멍만 제공하지 않는다.
 * @evidence spaces/002-spatial-graph.md#front-entry portals의 x=2.22,폭1.05,높이2.30을 전면 owner가 소비한다. site landing과 entry 양쪽 endpoint가 있는 passage route이고 문짝은 현관 안쪽으로 열린다.
 * @evidenceReview spaces/002-spatial-graph.md#front-entry #903a5ea front-entry의 x=2.22 문과 외부 landing이 만나 계단 유리 frame과 겹치지 않는 전면 진입이 된다.
 * @evidence spaces/002-spatial-graph.md#entry-flex z=-1.10의 폭1.20 pocket opening을 wall-entry-flex에서 절삭한다. open travel은 실제 local axis를 world -Z로 해석해 앞쪽 벽 pocket에 leaf를 넣는다.
 * @evidenceReview spaces/002-spatial-graph.md#entry-flex #8e50867 entry-flex의 pocket leaf가 -Z로 clear width만큼 이동하여 짧은 반대쪽 벽 끝에 문짝을 밀어 넣지 않는다.
 * @evidence spaces/002-spatial-graph.md#entry-common x=2.05,폭1.30,높이2.20의 leaf 없는 개구가 계단 동측 보행대에서 공용부로 이어진다. 양 jamb와 head는 실제 부재다.
 * @evidenceReview spaces/002-spatial-graph.md#entry-common #45048eb x=2.05의 leaf 없는 통로가 후면 common과 현관의 계단 옆 보행 띠를 직접 잇는다.
 * @evidence spaces/002-spatial-graph.md#entry-powder z=-3.20,폭0.90의 현관·powder 경계를 절삭하고 문은 powder 쪽으로90도 열린다. route의 양 끝은 그 두 cell 안에 둔다.
 * @evidenceReview spaces/002-spatial-graph.md#entry-powder #f50ad3b powder 안쪽으로 열리는 z=-3.20 방문이 현관에서 위생실로 직접 닿고 entry 보행 띠를 차지하지 않는다.
 * @evidence spaces/002-spatial-graph.md#common-storage x=-4.14,폭0.90의 수납 진입을 shared wall에 만든다. leaf는 수납 안쪽으로 열리고 공용부 endpoint와 직접 연결된다.
 * @evidenceReview spaces/002-spatial-graph.md#common-storage #c0661ec common-storage 문을 x=-4.14의 공용부 경계에 내어 수납 접근이 폐쇄된 현관 측 벽을 관통하지 않는다.
 * @evidence spaces/002-spatial-graph.md#single-stair 3.20/18 rise와0.28 going으로9+9 tread를 만들고 y=1.60의 폭2.64 참을 연결한다. route는 tread 상단과 참을 소비하며 양 flight에 금속 baluster·handrail·stringer를 둔다.
 * @evidenceReview spaces/002-spatial-graph.md#single-stair #8f9361e 9+9 riser와 중간 landing으로 3.20m를 올라 마지막 tread와 층 바닥을 중복된 한 단으로 세지 않는다.
 * @evidence spaces/002-spatial-graph.md#stair-opening slab과 하층 ceiling에서 x=-1.24..1.58,z=-5.64..-1.80의 같은 hole을 실제로 뺀다. upper floor finish는 room clear cells에만 놓여 이 구멍을 덮지 않는다.
 * @evidenceReview spaces/002-spatial-graph.md#stair-opening #e8f2534 상층 slab에서 명시된 stair-opening만 빼므로 계단 구멍을 거실 복층 보이드로 확대하지 않는다.
 * @evidence spaces/002-spatial-graph.md#upper-partition upper-corridor의 짧은 cell 하나에서 여섯 방문이 직접 뻗고 계단 route가 그 앞에 닿는다. L자 room의 cell union 내부에는 벽을 만들지 않는다.
 * @evidenceReview spaces/002-spatial-graph.md#upper-partition #506a629 상층 cell 접촉면과 여섯 문으로 분할을 구성해 설비실 L형 내부 seam에는 벽을 추가하지 않는다.
 * @evidence spaces/002-spatial-graph.md#upper-corridor corridor cell은 x=-2.84..0.12,z=-1.80..2.40이다. 여섯 실내 passage와 single-stair의 endpoint가 같은 room에 귀속한다.
 * @evidenceReview spaces/002-spatial-graph.md#upper-corridor #3cb298b 4.20m 일자 corridor가 계단 도착에서 시작해 여섯 목적지 문을 받아 분기 복도를 만들지 않는다.
 * @evidence spaces/002-spatial-graph.md#primary-bedroom primary-bedroom은 x=-2.84..5.26,z=2.58..5.76의 상층 후면 cell이며 corridor-primary로 직접 도달한다.
 * @evidenceReview spaces/002-spatial-graph.md#primary-bedroom #8f555cc 후면 주침실의 clear cell과 corridor 문이 일치하여 bath와 공유하는 서측 벽 밖으로 침실 범위를 늘리지 않는다.
 * @evidence spaces/002-spatial-graph.md#child-bedroom-1 전면 큰 cell과 x=0.30..1.76,z=-1.62..-0.32의 연장 cell을 한 room으로 합친다. corridor-child-one이 연장부에 닿고 내부 cell seam을 막지 않는다.
 * @evidenceReview spaces/002-spatial-graph.md#child-bedroom-1 #010df7b L형 child-one의 두 cell 사이 벽을 만들지 않고 corridor 문을 확장 cell에 연결하여 침대 영역까지 같은 방으로 남긴다.
 * @evidence spaces/002-spatial-graph.md#child-bedroom-2 x=0.30..5.26,z=-0.14..2.40의 작은 침실을 상층에 둔다. 앞뒤 침실과 닫힌 벽을 공유하며 corridor-child-two만 통행한다.
 * @evidenceReview spaces/002-spatial-graph.md#child-bedroom-2 #b3ea2be child-two를 동측 중간 cell로 만들고 전용 corridor 문을 두어 다른 침실을 통과해야 들어가는 방이 되지 않는다.
 * @evidence spaces/002-spatial-graph.md#upper-bathroom x=-5.26..-3.02,z=1.28..5.76의 코어 cell을 만들고 z=1.86 방문으로 복도에 직접 잇는다.
 * @evidenceReview spaces/002-spatial-graph.md#upper-bathroom #561b29b upper-bathroom의 서측 후면 cell 안에 위생 가구를 조립하고 문은 corridor에 직접 연결한다.
 * @evidence spaces/002-spatial-graph.md#upper-storage x=-5.26..-3.02,z=-0.14..1.10의 cell에 복도 직결 문을 둔다. 욕실·설비 경계는 닫힌 wall이다.
 * @evidenceReview spaces/002-spatial-graph.md#upper-storage #53a7cce upper-storage는 z=-0.14..1.10의 독립 cell이고 corridor 문이 있어 욕실 벽장으로 대체되지 않는다.
 * @evidence spaces/002-spatial-graph.md#upper-service 전면 넓은 cell과 -X측 연장 cell을 같은 설비실로 묶는다. 복도 전면의 닫힌 벽과 z=-0.95 출입 벽을 구분하여 이름 없는 통로를 만들지 않는다.
 * @evidenceReview spaces/002-spatial-graph.md#upper-service #c37bff6 upper-service 두 cell의 합집합과 서측 corridor 문을 유지하여 계단 서쪽 부분이 고립된 별실이 되지 않는다.
 * @evidence spaces/002-spatial-graph.md#corridor-primary x=-0.58,폭0.90의 opening을 북측 wall에 만들고 leaf를 주침실 안쪽으로 연다. clear height는2.20이다.
 * @evidenceReview spaces/002-spatial-graph.md#corridor-primary #1421db3 주침실 문은 북쪽 x=-0.58에서 상층 바닥에 연결되어 후면 방으로 직접 들어간다.
 * @evidence spaces/002-spatial-graph.md#corridor-child-one z=-0.95,폭0.90의 opening이 L자 침실 연장부와 corridor 사이에 있다. open leaf는 침실 쪽이며 passage endpoint도 그 cell 안에 둔다.
 * @evidenceReview spaces/002-spatial-graph.md#corridor-child-one #4f328b2 z=-0.95의 동측 문이 child-one 확장 cell에 닿아 계단 뒤의 주 cell까지 L형 내부 연결을 유지한다.
 * @evidence spaces/002-spatial-graph.md#corridor-child-two z=1.05,폭0.90의 방문을 복도 동측 벽에서 절삭한다. 한 connector가 복도와 child-bedroom-2만 잇는다.
 * @evidenceReview spaces/002-spatial-graph.md#corridor-child-two #1566536 child-two 출입은 z=1.05의 동측 문으로 실현되어 child-one 출입과 별개의 corridor 연결이다.
 * @evidence spaces/002-spatial-graph.md#corridor-bathroom z=1.86,폭0.90의 방문을 복도 서측 욕실 경계에 두고 leaf는 욕실 안으로 연다.
 * @evidenceReview spaces/002-spatial-graph.md#corridor-bathroom #5b2410b 상층 서측 z=1.86 개구와 욕실 안으로 열린 leaf가 corridor-bathroom의 목적 방에 도착한다.
 * @evidence spaces/002-spatial-graph.md#corridor-storage z=0.48,폭0.90의 문으로 상층 수납과 corridor를 직접 연결한다. frame을 더한 cut과 별도의 clear profile을 유지한다.
 * @evidenceReview spaces/002-spatial-graph.md#corridor-storage #0ddd06d z=0.48 서측 문이 upper-storage 내부로 열려 욕실이나 설비실을 경유하는 수납 동선이 생기지 않는다.
 * @evidence spaces/002-spatial-graph.md#corridor-service z=-0.95,폭0.90의 설비실 문은 -X측 shared wall에만 생성한다. 전면의 닫힌 segment에는 같은 문을 복제하지 않는다.
 * @evidenceReview spaces/002-spatial-graph.md#corridor-service #d7d4e8b 설비실 문을 서측 z=-0.95 구간에 배치하므로 corridor 전면의 폐쇄 경계를 출입구로 오인하지 않는다.
 * @evidence spaces/002-spatial-graph.md#wall-entry-flex 두 room의 x clear edge 평균 x=2.93에서 겹치는 z segment를 실제 wall로 닫고 entry-flex cut을 소비한다.
 * @evidenceReview spaces/002-spatial-graph.md#wall-entry-flex #dfdb03c entry-flex X 벽이 pocket 문과 그 이동 구간을 받아 facade 유리와 다른 내부 출입 경계를 만든다.
 * @evidence spaces/002-spatial-graph.md#wall-entry-common entry maxZ와 common minZ 사이 평균면에 wall을 만들며 x=2.05 개구 외에는 닫는다.
 * @evidenceReview spaces/002-spatial-graph.md#wall-entry-common #4167cfb entry-common Z 벽에 동측 통로를 두어 계단의 북쪽 도착과 1층 passage를 같은 구멍으로 섞지 않는다.
 * @evidence spaces/002-spatial-graph.md#wall-entry-powder 현관·powder의 마주보는 x face에서 두께0.18의 벽을 도출한다. entry-powder만 절삭하며 양면 finish는 room owner가 담당한다.
 * @evidenceReview spaces/002-spatial-graph.md#wall-entry-powder #fda2d8d entry-powder 서측 벽의 개구가 위생실 안쪽 leaf에 맞아 현관을 가로지르는 문짝을 만들지 않는다.
 * @evidence spaces/002-spatial-graph.md#wall-common-storage 수납 뒤와 공용부 앞의 z face 사이에 wall을 생성하고 common-storage opening을 같은 frame에서 만든다.
 * @evidenceReview spaces/002-spatial-graph.md#wall-common-storage #0d1a2ef common-storage 벽의 단일 opening이 공용부에서 수납으로 연결되며 다른 구간은 실제 벽체다.
 * @evidence spaces/002-spatial-graph.md#wall-corridor-primary corridor maxZ와 primary minZ의 겹치는 x segment 전체를 닫되 corridor-primary를 절삭한다.
 * @evidenceReview spaces/002-spatial-graph.md#wall-corridor-primary #4f0844f 복도 북쪽 Z 벽에서 primary 문만 제거하여 그 뒤 주침실과 corridor가 하나의 room으로 합쳐지지 않는다.
 * @evidence spaces/002-spatial-graph.md#wall-corridor-child-one corridor와 child-one 연장 cell의 마주보는 x face를 사용한다. 방의 큰 cell 내부 seam을 벽으로 오인하지 않는다.
 * @evidenceReview spaces/002-spatial-graph.md#wall-corridor-child-one #d1b06c9 child-one 확장 cell과 corridor 사이의 짧은 X 벽에 전용 문을 내어 침실 주 cell 경계를 잘못 자르지 않는다.
 * @evidence spaces/002-spatial-graph.md#wall-corridor-child-two 복도 동측과 child-two 서측의 z 교집합을 wall로 만들고 그 범위 안에 방문을 절삭한다.
 * @evidenceReview spaces/002-spatial-graph.md#wall-corridor-child-two #d11ccd6 corridor-child-two X 벽의 z=1.05 문과 나머지 실체 구간이 child-one 벽과 별도로 생성된다.
 * @evidence spaces/002-spatial-graph.md#wall-corridor-bathroom 욕실·복도의 겹치는 z segment에 shared wall 한 개와 욕실 문 하나를 생성한다.
 * @evidenceReview spaces/002-spatial-graph.md#wall-corridor-bathroom #c221644 corridor-bathroom 벽에서 z=1.86 개구만 잘라 bathroom 문의 jamb와 shared wall이 대응한다.
 * @evidence spaces/002-spatial-graph.md#wall-corridor-storage 상층 수납·복도의 x edge 평균면과 z 교집합으로 벽을 생성하고 수납 문을 소비한다.
 * @evidenceReview spaces/002-spatial-graph.md#wall-corridor-storage #eb6e8bf upper-storage와 corridor 사이 X 벽에 수납 문을 생성하며 bath 문은 이 벽의 opening으로 붙지 않는다.
 * @evidence spaces/002-spatial-graph.md#wall-corridor-service 설비실의 짧은 연장부와 복도 사이 벽은 z=-0.95 문을 담는 segment다. 전면 폐쇄 벽과 다른 id로 유지한다.
 * @evidenceReview spaces/002-spatial-graph.md#wall-corridor-service #f5d2036 service 접촉 X 벽의 실제 z 구간만 사용하므로 corridor 전면 폐쇄 벽까지 서비스 문을 연장하지 않는다.
 * @evidence spaces/002-spatial-graph.md#wall-powder-storage powder와 storage-1f의 z edge 사이0.18m strip을 닫고 opening·connector를 두지 않는다.
 * @evidenceReview spaces/002-spatial-graph.md#wall-powder-storage #925c6cb powder-storage의 Z 분리벽을 닫아 1층 설비 코어가 통과 동선으로 변하지 않는다.
 * @evidence spaces/002-spatial-graph.md#wall-flex-common 작업실 뒤와 common 앞 사이의 전체 x 교집합은 폐쇄 wall이다. 작업실의 출입은 현관 문으로만 유지된다.
 * @evidenceReview spaces/002-spatial-graph.md#wall-flex-common #70c2ca8 flex-common Z 벽은 닫혀 있어 작업실 손님 동선이 후면 공용부로 임의 관통하지 않는다.
 * @evidence spaces/002-spatial-graph.md#wall-child-one-two child-one 두 cell에서 나온 연속 segment를 동일 평면·id로 합쳐 child-two와의 하나의 폐쇄 벽을 만든다.
 * @evidenceReview spaces/002-spatial-graph.md#wall-child-one-two #f34a08f 두 작은 침실 사이 Z 벽은 각 cell의 접촉 구간만 덮어 L형 child-one 내부를 나누지 않는다.
 * @evidence spaces/002-spatial-graph.md#wall-child-two-primary child-two 북측과 primary 남측의 x 겹침에 문 없는 벽을 두어 침실을 통과실로 쓰지 않는다.
 * @evidenceReview spaces/002-spatial-graph.md#wall-child-two-primary #8180be0 child-two와 primary 사이 Z 벽이 두 침실의 독립성을 유지하고 corridor 이외 문을 만들지 않는다.
 * @evidence spaces/002-spatial-graph.md#wall-service-storage 설비실 연장부 뒤와 상층 수납 앞 사이의 z 평균면을 닫는다. 해당 두 room 사이 passage를 생성하지 않는다.
 * @evidenceReview spaces/002-spatial-graph.md#wall-service-storage #5f882f6 service-storage Z 벽에는 문을 만들지 않아 각 실의 corridor 직접 연결을 바꾸지 않는다.
 * @evidence spaces/002-spatial-graph.md#wall-storage-bath 수납 뒤와 욕실 앞 사이 전체 x segment가 닫힌 shared wall을 가진다. 두 방은 각 corridor 문으로만 출입한다.
 * @evidenceReview spaces/002-spatial-graph.md#wall-storage-bath #32e3fec storage-bath Z 벽이 linen 수납과 위생실을 분리하므로 한쪽 문으로 두 room을 통과하지 않는다.
 * @evidence spaces/002-spatial-graph.md#wall-bath-primary 욕실+X와 주침실-X clear edge 평균면에서 z 교집합을 닫는다. 후면 유리 범위와 이 벽 끝을 외피 owner가 함께 소비한다.
 * @evidenceReview spaces/002-spatial-graph.md#wall-bath-primary #4d85462 bath-primary의 X 경계는 양 room 사이를 폐쇄하여 주침실에서 욕실로 임의 출입을 만들지 않는다.
 * @evidence spaces/002-spatial-graph.md#wall-service-corridor-front 설비실 큰 cell 뒤와 corridor 앞의 겹치는 x segment에는 opening을 넣지 않는다. 문 중심이 segment 안에 드는지 판정해 측면 출입 벽과 구분한다.
 * @evidenceReview spaces/002-spatial-graph.md#wall-service-corridor-front #07903a5 service-corridor-front Z 벽은 폐쇄된 채 유지되고 서비스 출입은 서측 X 벽에만 남는다.
 * @evidence spaces/002-spatial-graph.md#stair-enclosure hole 서·동 edge 밖에 두 측벽을 z=-5.76부터 두고 child-one 연장부 앞의 북측 return을 닫는다. 계단 쪽 lining은 slab 상면 3.184부터 서·동측은 z=-5.766까지 만들고 구멍 가장자리의 두 junction도 3.184에서 시작한다. 복도 도착 구간을 wall로 막지 않는다.
 * @evidenceReview spaces/002-spatial-graph.md#stair-enclosure #8152e06 partitions의 두 측벽 frame이 a=-datum.innerZ(-5.76)에서 시작하고, stair의 lining이 frame.floor 대신 slabTop(1)=3.184에서 시작하며 z축 frame은 -5.766까지 늘어나는 것을 코드로 읽었다. junction 생성에서 hole 경계에 면이 놓이고 겹침이 있는 칸만 3.184에서 시작한다. compiled scene에서 바뀐 요소는 두 측벽 body, 세 lining, 두 room lining, 두 junction의 bounds뿐이고 id 4652개와 audit 통과는 그대로였다. 복도 도착 x=-1.24..0.12는 여전히 벽 없이 열려 있다.
 * @evidence spaces/002-spatial-graph.md#wall-entry-storage 현관과 하층 수납의 x edge 사이 벽은 폐쇄 상태로 생성한다. 수납의 실제 route는 common-storage뿐이다.
 * @evidenceReview spaces/002-spatial-graph.md#wall-entry-storage #f5f7f83 entry-storage X 벽은 개구 없이 생성되어 수납 접근은 common-storage 연결 하나로 유지된다.
 * @evidence spaces/002-spatial-graph.md#wall-junctions 층의 clear cell과 wall strip으로 분할한 평면에서 두 wall 끝이 접하고 room·stair hole 밖에 남는 작은 직사각형만 junction으로 만든다. 정렬한 인접 boundary id로 안정 id를 만들고 그 boundary들이 같은 element를 참조한다.
 * @evidenceReview spaces/002-spatial-graph.md#wall-junctions #0c7c374 벽 끝 접합의 남은 실체만 별도 ID로 채워 room cell·opening·계단 hole 안에 보강 덩어리를 추가하지 않는다.
 * @evidence spaces/002-spatial-graph.md#envelope-interface 외피는 같은 plan datum·clear edge에서 절삭 범위와 bay를 소비하고 캐노피는1.20×1.90 최대 pitch로 등분한다. 대지 landing과 현관 sill은 같은 y=0이다.
 * @evidence spaces/002-spatial-graph.md#stage-one-verification auditHouse가 native validation, room/storey 포함, entry 도달, stair 수, endpoint와 tread bounds를 출력한다. observations는 모든 필수·추가 질문을 유지한다. 연속 원통 충돌과 현재 GPU 판정은 측정했다고 주장하지 않고 limits에 unverified로 낸다.
 * @evidenceReview spaces/002-spatial-graph.md#stage-one-verification #dfb57ae native audit가 storey 포함과 entry 도달을 검사하지만 연속 인체 통행·성능 인증을 그 결과로 주장하지 않는다.
 */
export function structure(a: Assembly): void { topology(a); ground(a); upper(a); stair(a); }

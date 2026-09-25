# 기존 방 물체의 모델 인계 계정

[공통 모델 규칙](../../models/000-representation.md#model-address-and-scale)을 참조한다.

## Item root 대응 {#legacy-root-correspondence}

현재 `src/house/rooms/*.ts`와 `interior.ts`가 생성하는 임시 메시의 작성 지점을 보존한다. 한 행은 하나의 정적 작성 지점이며 반복의 실제 ID는 표기한 유한 범위를 전개한다. 임시 메시를 승인된 modelSource라고 부르지 않는다. `new Item(` 작성 지점은 46개이며 상태·반복을 전개한 root ID는 54개다. 각 root의 null-model parent는 새 instance identity에 대응하고, 자식 solid는 아래 부품 변환 규칙의 안정 주소에 대응한다. 서로 다른 legacy ID를 같은 후속 `instance/part/face` 주소로 합치지 않는다. 배치 좌표·방 membership은 instances가, 발광은 systems가, finish 결합은 materials가 소유한다. `flex-guest-bed`와 `flex-murphy-frame`은 같은 murphy prototype을 소비하지만 `bed-frame`과 `case-*`의 서로 다른 후속 part 주소로 구별한다.

| Source | Legacy Item root ID (전개 수) | 후속 prototype/part owner |
| --- | --- | --- |
| bathroom.ts | `bath-vanity` (1) | `basin/1000`, vanity 외함은 `cabinet/vanity/1000x800x480/closed` |
| bathroom.ts | `bath-toilet` (1) | `toilet` |
| bathroom.ts | `bath-shower` (1) | `shower` |
| bathroom.ts | `bath-towels` (1) | `cabinet/open-shelf/600x1100x380/open` |
| child-one.ts | `child-one-bed` (1) | `fixed-bed/1000` |
| child-one.ts | `child-one-desk` (1) | `work-desk/bed-1240` + `work-display` + `work-keyboard` |
| child-one.ts | `child-one-chair` (1) | `desk-chair` |
| child-one.ts | `child-one-wardrobe` (1) | `cabinet/tall/1300x2650x600/closed` |
| child-one.ts | `child-one-books` (1) | `cabinet/open-shelf/750x1200x400/open` |
| child-two.ts | `child-two-bed` (1) | `fixed-bed/1000` |
| child-two.ts | `child-two-desk` (1) | `work-desk/bed-1250` + `work-display` + `work-keyboard` |
| child-two.ts | `child-two-chair` (1) | `desk-chair` |
| child-two.ts | `child-two-wardrobe` (1) | `cabinet/tall/1400x2600x540/closed` |
| common.ts | `common-sofa` (1) | `living-sofa/chaise-right` |
| common.ts | `common-coffee` (1) | `coffee-table` |
| common.ts | `common-media` (1) | `cabinet/media/2000x440x350/closed` |
| common.ts | `common-dining` (1) | `dining-table` |
| common.ts | `dining-chair-<z>-<i>` (6: z=-1,+1; i=0..2) | `dining-chair` 여섯 instance |
| common.ts | `kitchen-island` (1) | `kitchen-island` + `cabinet/island-base/880x870x2650/closed` |
| common.ts | `island-stool-<i>` (3: i=0..2) | `island-stool` 세 instance |
| common.ts | `kitchen-wall-bank` (1) | `wall-worktop` + `cooktop` + `oven` + `cabinet/kitchen-base/2900x870x620/closed` |
| common.ts | `kitchen-overhead` (1) | `cabinet/wall/2900x980x360/closed`의 다섯 leaf |
| common.ts | `kitchen-fridge-pantry` (1) | `refrigerator`; 기존 cabinet child 중 기기 외관에 없는 내부 선반은 퇴역 목록에 기록 |
| common.ts | `kitchen-sorting` (1) | `cabinet/service/640x840x600/closed` |
| common.ts | `common-plant` (1) | `potted-plant/1100` |
| entry.ts | `entry-shoe-bench` (1) | `entry-bench` + `cabinet/bench-base/1150x440x480/closed` |
| entry.ts | `entry-plant` (1) | `potted-plant/800` |
| flex.ts | `flex-desk` (1) | `work-desk/flex-1400`의 필수 `folded` 상태 + `work-display` + `work-keyboard` |
| flex.ts | `flex-chair` (1) | `desk-chair` |
| flex.ts | `flex-books` (1) | `cabinet/open-shelf/950x1350x250/open` |
| flex.ts | `flex-murphy-frame` (1, 두 상태 공유) | `murphy-bed`의 `case-*`와 상태별 판 |
| flex.ts | `flex-guest-bed` (1, guest에서만) | `murphy-bed`의 guest `bed-frame/mattress/duvet/pillow/support-*`; 같은 instance의 다른 part |
| powder.ts | `powder-toilet` (1) | `toilet` |
| powder.ts | `powder-basin` (1) | 실제 인자 0.8m를 받는 `basin/800` + `cabinet/vanity/800x800x480/closed` |
| powder.ts | `powder-cleaning` (1) | `cabinet/tall/520x2250x520/closed` |
| primary.ts | `primary-bed` (1) | `fixed-bed/1800` |
| primary.ts | `primary-nightstand-<x>` (2: x=1.60,4.16) | `cabinet/nightstand/500x460x460/closed` 두 instance |
| primary.ts | `primary-wardrobe` (1) | `cabinet/tall/2720x2650x600/closed` |
| primary.ts | `primary-desk` (1) | `work-desk/bed-1200` + `work-display` + `work-keyboard` |
| primary.ts | `primary-chair` (1) | `desk-chair` |
| primary.ts | `primary-plant` (1) | `potted-plant/600` |
| service-upper.ts | `upper-laundry` (1) | `laundry-washer`와 `laundry-dryer`의 구분된 두 child part/instance |
| service-upper.ts | `upper-mechanical` (1) | `cabinet/service/1100x2400x560/closed` |
| service-upper.ts | `upper-utility-shelf` (1) | `cabinet/open-shelf/850x2400x450/open` |
| storage-ground.ts | `ground-store-shelves` (1) | `cabinet/open-shelf/1550x2500x500/open` |
| storage-upper.ts | `upper-linen-cabinet` (1) | `cabinet/open-shelf/1100x2600x500/open` |

## 직접 primitive와 방 lining {#legacy-direct-correspondence}

`Item` 밖의 직접 primitive 작성 지점 10개는 상태·반복 전개 뒤 18개 element다. source의 `a.box(` 8곳과 `a.ellipsoid(` 2곳을 각각 아래에 둔다. 새 장식은 해당 모델 H2에서 형상만 추가되고 이 표의 legacy element 삭제를 승인하지 않는다.

| Source 작성 지점 | Legacy element ID (전개 수) | 후속 주소 |
| --- | --- | --- |
| common.ts box | `common-rug` (1) | `living-rug/pile` |
| common.ts box | `common-display` (1) | `living-display/screen` |
| common.ts box | `dining-pendant-cord` (1) | `dining-pendant/cord` |
| common.ts ellipsoid | `dining-pendant` (1) | `dining-pendant/diffuser` + system emitter |
| entry.ts box | `entry-bench-cushion` (1) | `entry-bench/cushion` |
| entry.ts box | `entry-charging-shelf` (1) | `entry-charging-shelf/board` |
| entry.ts box | `entry-charger` (1) | `entry-charger/body` |
| primary.ts ellipsoid | `primary-lamp-<x>` (2: x=1.60,4.16) | `portable-lamp/bedside-globe/globe` + 각 system emitter |
| storage-ground.ts box | `ground-store-basket-<i>` (4: i=0..3) | `storage-basket/wall` 네 instance |
| storage-upper.ts box | `upper-linen-stack-<i>` (5: i=0..4) | `folded-towel/160/layer-0..2` 다섯 instance |

## 공통 helper의 자식 면과 발광 {#legacy-helper-correspondence}

`Item.box/round`가 낸 child id는 위 root 뒤에 `-<name>`으로 붙는다. work·guest 상태의 child ID 합집합을 [현재 source 전개 producer](../../../src/review/model-child-audit.cjs)로 세고, 각 ID가 아래의 서로 다른 후속 part/face 주소 또는 명명 퇴역 한 곳에만 닿아야 한다. 아래 변환은 재료 문자열(`oak`, `white`, `green`, `tile`, `metal`)이 아니라 호출 경로·부품 역할로 고른다. 각 행의 범위는 정수 반복의 끝까지 포함한다.

| helper 또는 수제 child | 기존 name 범위 | 후속 part/face 또는 명시 퇴역 |
| --- | --- | --- |
| `table()` | `top`, `leg-<x>-<z>` (x,z=±1) | dining/coffee `top`, `leg-0..3`; `desk()` 안에서는 work-desk의 `top`, 앞쪽 두 `support-*`; flex의 네 옛 다리와 침실 변종의 뒤쪽 여섯 옛 다리는 명명 퇴역 |
| `chair()` | `seat`, `back`, `leg-<x>-<z>` | dining-chair는 seat-frame/seat-pad/back/leg, 네 책상 의자의 old seat와 back은 각각 `shell-seat`와 `shell-back`에 일대일 대응하며 upholstery와 leg는 새 주소를 받는다; 한 기존 부재의 새 face는 전체 면을 분할 |
| `cabinet()` | `back`, `side-±1`, `shelf-0..ceil(H/.38)`, 닫힌 경우 `door-±1`, `handle-±1` | 동일 외함의 back·side·bottom·top·shelf·door 또는 drawer·handle. `shelf-0`은 bottom, 마지막은 top이며 가운데는 형상형에 따라 확정 내부 shelf 또는 아래 표의 명명 퇴역이다. 새 수식이 추가한 shelf는 신규 부재다. `nightstand`·`vanity`·`media`의 old door −1/+1은 새 `drawer-0/1`, `kitchen-base`의 old door −1/+1은 `drawer-0/5`에 일대일 대응한다. 같은 번호의 old handle도 대응하고 나머지 서랍·손잡이는 신규 부재다. `base-drawer` 형상형은 만들지 않는다. 내부 선반의 명명 퇴역은 아래 표에 적는다 |
| `bed()` | `base`, `leg-<x>-<z>`, `mattress`, `duvet`, `head`, `pillow-<i>` | fixed-bed의 옛 단일 base는 명명 퇴역하고 네 frame rail과 매트리스 아래 `support-deck`을 신규 부품으로 만든다. 나머지는 leg/mattress/duvet/headboard/pillow; guest root의 앞쪽 두 다리만 murphy의 `support-left/right`에 대응한다. 뒤쪽 두 다리와 옛 자유 침대 `head`는 외함 힌지·뒤판 지지로 기능을 옮겨 이름별로 퇴역한다 |
| `plant()` | `pot`, `stem`, `leaf-0..8` | potted-plant pot/stem/leaf-0..8; 새 branch-0..4·leaf-9..14는 추가 부재 |
| `desk()` | `table()`의 top/leg, `screen`, `screen-stand`, `keyboard` | work-desk top/앞쪽 support; 옛 flex 네 다리·침실 변종 뒤쪽 다리는 아래 명명 퇴역, 독립 work-display screen/stand, work-keyboard body/keys |
| `basin()` | `cabinet()`의 판, `rim`, `bowl`, `tap`, `spout`, `mirror` | vanity cabinet의 판, basin rim/bowl/tap-body/tap-spout/mirror의 안정 face |
| `toilet()` | `pedestal`, `bowl`, `seat`, `cistern`, `flush` | toilet의 같은 역할 part와 각각의 안·밖·rim·edge 주소; lid는 추가 부재 |
| bathroom.ts shower | `tray`, `drain`, `fixed-screen`, `screen-rail`, `riser`, `head` | shower의 같은 역할 part와 분리한 face; 열린 출입에는 문 part를 추가하지 않음 |
| common.ts sofa | `plinth`, `back`, `cushion-0..2`, `pillow-0..2`, `arm-±1` | living-sofa의 frame/back-frame/seat/pillow/arm; L자 연장은 신규 part |
| common.ts island | cabinet 부품 + `counter`, `sink`, `sink-basin`, `tap-upright`, `tap-spout` | island-base 판·`service-door-0/4`·`service-handle-0/4`, kitchen-island counter/sink/tap. 기존 `sink-basin`의 평평한 겹판은 제거하고 음각 bowl로 교체함을 명시 |
| common.ts wall bank | cabinet 부품 + `worktop`, `hob`, `hob-ring-<x>-<z>`(4), `oven`, `oven-handle` | kitchen-base의 drawer·oven bay, wall-worktop, cooktop zone-0..3, oven body/front/handle |
| common.ts stool | `seat`, `leg-<x>-<z>` (3×4) | island-stool seat/leg, 고리 footrest는 새 부재 |
| flex.ts murphy | `back`, `side-<x>`, `top`, work의 `closed-panel`, `pull` | murphy-bed case-back/case-side/case-top/closed-panel/pull; guest frame은 guest root와 구분 |
| service-upper.ts laundry | `machine-0..1`, `drum-0..1`, `window-0..1`, `controls-0..1` | 0=washer, 1=dryer의 body/drum/window/controls. root는 두 후속 instance를 묶는 현재 group 주소 |

기존 cabinet의 `shelf-0`과 마지막 `shelf-ceil(H/0.38)`은 새 외함의 bottom·top에 각각 대응한다. 열린 책장·tall·service·wall·bench-base·island-base에서 가운데 old shelf j는 새 `shelf-j`로 일대일 이동하고, 새 피치가 추가한 shelf는 새 부품이다. kitchen-overhead의 가운데 두 장(`shelf-1/2`), entry-shoe-bench의 한 장(`shelf-1`), kitchen-island의 두 장(`shelf-1/2`)은 각각 wall·bench-base·island-base의 확정 내부 선반에 대응한다. 닫힌 cabinet의 old door/handle −1은 새 첫 leaf, +1은 새 마지막 leaf에 대응하고 사이 leaf는 신규다. 주방 상부장에서는 `door--1/1`·`handle--1/1`이 각각 다섯 leaf의 `door-0/4`·`handle-0/4`에 닿는다. 길어진 섬 서비스 면의 old door/handle도 `service-door-0/4`·`service-handle-0/4`에 닿고 중간 셋은 신규다. 이 대응은 두 legacy 문을 한 새 문으로 합치지 않는다.

| 명명 퇴역 child ID 또는 유한 전개 | 개수 | 후속 구조와 퇴역 이유 |
| --- | ---: | --- |
| `bath-vanity-shelf-1/2`, `powder-basin-shelf-1/2` | 4 | vanity 서랍과 bowl 음각이 내부 선반 부피를 대체한다. |
| `primary-nightstand-1.6-shelf-1`, `primary-nightstand-4.16-shelf-1` | 2 | 각 full-width 서랍 둘을 위한 빈 내부로 바뀐다. |
| `common-media-shelf-1` | 1 | 중앙 열린 bay와 좌우 서랍 사이의 기존 통판을 제거한다. |
| `kitchen-wall-bank-shelf-1/2` | 2 | 오븐 개방 bay와 drawer bank가 대신한다. 신설 `oven-sill`은 오븐을 실제로 받지만 이전 선반 ID를 재사용하지 않는다. |
| `flex-desk-leg-<x>-<z>` (x,z=−1,+1) | 4 | 왼쪽 서랍장과 오른쪽 접지 telescopic 기둥으로 지지 체계를 바꾸며 네 낱개 다리를 퇴역한다. |
| `primary-desk-leg-<x>--1`, `child-one-desk-leg-<x>--1`, `child-two-desk-leg-<x>--1` (x=−1,+1) | 6 | 침실 책상 뒤쪽 두 다리씩은 벽측 back rail로 교체한다. 앞쪽 `z=+1` 두 다리씩만 `support-left/right`에 대응한다. |
| `flex-guest-bed-leg-<x>--1` (x=−1,+1) | 2 | 펼친 침대 뒤쪽 접지는 murphy 외함·pivot이 맡는다. 앞쪽 `z=+1` 둘만 `support-left/right`에 대응한다. |
| `primary-bed-base`, `child-one-bed-base`, `child-two-bed-base` | 3 | 기존 막힌 단일 base 부피는 퇴역한다. 각 침대에는 [고정 침대](../../models/002-storage-and-sleep.md#fixed-bed)의 `frame-side-left/right`와 `frame-head/foot` 네 열린 rail과 그 사이의 `support-deck`을 새 주소로 저작한다. |
| `kitchen-fridge-pantry-shelf-0..7` | 8 | 냉장고 내장을 납품하지 않으므로 열린 pantry 선반을 퇴역한다. |
| `flex-guest-bed-head` | 1 | guest 머리 지지는 murphy 외함 뒤판으로 옮긴다. |
| `kitchen-island-sink-basin` | 1 | 평판 basin을 퇴역하고 kitchen-island의 음각 bowl로 대체한다. |

고정 closet 내부와 실제 냉장고 내부는 같은 기능이 아니다. `kitchen-fridge-pantry-shelf-0..7`은 냉장고 내장을 납품하지 않는 [냉장고 설계](../../models/003-service-fixtures.md#refrigerator)에 따라 **이름을 명시해 의도적으로 제거**하고, `kitchen-fridge-pantry-door-±1`은 두 냉장고 문, `handle-±1`은 상하 손잡이에 대응한다. `flex-guest-bed-head`는 [murphy 설계](../../models/002-storage-and-sleep.md#murphy-bed)의 손님 상태에서 외함 뒤판이 머리 지지를 맡으므로 **이름을 명시해 제거**한다. `flex-guest-bed-pillow-0`과 `flex-guest-bed-duvet`는 각각 같은 설계의 guest `pillow`와 `duvet`에 대응한다. `kitchen-island-sink-basin`은 위의 음각 bowl로 **교체**하며 얕은 판 부피를 중복 보존하지 않는다. 이 삭제·교체는 후속 instanceSource 구현 때 source의 실제 전개 ID와 하나씩 대조해 누락을 실패로 보고해야 한다.

`lining(a,room)` 12곳은 room 내측 벽의 건축 면이므로 다음 순서대로 **spaces owner**에 남는다: bathroom, child-one, child-two, common, corridor, entry, flex, powder, primary, service-upper, storage-ground, storage-upper. `lights(a,room,points)`도 같은 12곳에서 각각 2,2,1,5,3,3,2,1,2,2,1,1개의 점을 받으며 합계 25점이다. 각 점의 `room-light-trim-i`는 `recessed-light/trim`, `room-light-i`는 `recessed-light/diffuser` **및** system emitter로 대응한다. common의 pendant 1과 primary의 bedside 2를 합하면 기존 emissive element는 28개다. 모든 기존 emissive ID마다 후속 instance/part **및** emitter가 필요하다. `lining`은 model prototype이나 material binding을 소유하지 않는다.

이 계정의 모집단은 정적 작성 지점 `Item` 46 + 직접 primitive 10 + `lining` 12 + `lights` 12 = 80곳이다. [정적 측정 producer](../../../src/review/model-owner-audit.cjs)가 현재 방 source와 이 표의 source별 행 수·빈 owner를 계산하고 누락 행을 제거한 대조가 실패하는지 함께 확인한다. 실제 전개 element ID·중복·퇴역 의도·추가 prototype의 배치는 [상류 이관 조건](../../settings/003-spatial-basis.md#surface-decomposition)의 단일 커밋에서 compiled producer로 재계수한다. 이 초안 표가 현재 source에서 구현됐다는 주장은 `unverified`다.

## 상위·형제 층의 물품 요구 역대응 {#upstream-demand-correspondence}

이 표는 이 파일의 legacy 작성 지점이 출처를 못 주는 신규 소품까지 [1층 프로그램](../../settings/002-household.md#ground-program), [작업실 상태](../../settings/002-household.md#flex-states), [2층 프로그램](../../settings/002-household.md#upper-program), [재료의 물체 결합 입력](../../materials/004-wood.md#oak-joinery)을 역방향으로 읽은 요구 행이다. 표의 prototype은 형상 owner이며 방별 member·반복·transform은 이후 instances, 발광은 systems가 맡는다. `현재` 열의 없음은 현재 source에 해당 부재가 없다는 사실이지 납품 제외가 아니다. 외부 수목과 커튼월 roller는 각각 대지·외피의 건축 부재여서 이 모델 모집단에 복제하지 않는다.

| 요구와 목적지 | 현재 임시 요소 또는 상태 | models 형상·part 주소 |
| --- | --- | --- |
| 현관 신발 수납·벤치 | `entry-shoe-bench`, `entry-bench-cushion` | [벤치와 cabinet](../../models/002-storage-and-sleep.md#entry-bench) |
| 현관 평벽 우편·충전 선반과 충전기 | `entry-charging-shelf`, `entry-charger` | [벽걸이 선반](../../models/002-storage-and-sleep.md#entry-charging-shelf), [충전 물체](../../models/004-decor-and-fixtures.md#entry-charger) |
| 작업실 조절 책상·접이식 보조판 | `flex-desk`의 단순 table | [flex desk](../../models/001-seating-and-work.md#work-desk) |
| 작업실 천 씌운 의자 | `flex-chair`의 통판 등 | [desk-chair](../../models/001-seating-and-work.md#desk-chair) |
| 작업실 벽 선반·개별 책 | `flex-books`; 책은 없음 | [열린 cabinet](../../models/002-storage-and-sleep.md#cabinet-and-shelf), [book](../../models/004-decor-and-fixtures.md#books) |
| 작업실 숨은 수면 수납과 손님 침구 | `flex-murphy-frame`, 손님 상태 `flex-guest-bed` | [두 상태 murphy](../../models/002-storage-and-sleep.md#murphy-bed) |
| 작업실 사생활 screen | 기존 커튼월 유리·roller | **spaces 외피 부재**; 별도 가구 prototype 없음 |
| 후면 소파·쿠션·낮은 탁자 | `common-sofa`, `common-coffee`; L자 연장 없음 | [소파](../../models/001-seating-and-work.md#living-sofa), [낮은 탁자](../../models/001-seating-and-work.md#coffee-table) |
| 후면 media 수납·화면 | `common-media`, `common-display` | [media cabinet](../../models/002-storage-and-sleep.md#cabinet-and-shelf), [living-display](../../models/004-decor-and-fixtures.md#living-display) |
| 후면 독서등·러그·그릇과 쟁반 | `common-rug`; 등·그릇·쟁반 없음 | [reading lamp](../../models/004-decor-and-fixtures.md#portable-lamps), [rug](../../models/004-decor-and-fixtures.md#rugs), [tabletop props](../../models/004-decor-and-fixtures.md#tabletop-props) |
| 여섯 자리 식탁·천 좌판 의자 | `common-dining`, `dining-chair-*` 여섯 | [table](../../models/001-seating-and-work.md#dining-table), [dining-chair](../../models/001-seating-and-work.md#dining-chair) |
| 식탁의 가는 원통 펜던트 | 원판형 `dining-pendant`, cord | [pendant](../../models/004-decor-and-fixtures.md#dining-pendant) 및 system emitter |
| 섬·싱크·고리 스툴 | `kitchen-island`, `island-stool-*` 셋 | [island](../../models/003-service-fixtures.md#kitchen-island), [island-stool](../../models/001-seating-and-work.md#island-stool) |
| 주방 벽 조리대·쿡탑·오븐·서랍 | `kitchen-wall-bank`의 겹판·두 문 | [조리 기기](../../models/003-service-fixtures.md#cooking-appliances), [drawer cabinet](../../models/002-storage-and-sleep.md#cabinet-and-shelf) |
| 냉장고와 별도 tall pantry | `kitchen-fridge-pantry` 한 외함 | [refrigerator](../../models/003-service-fixtures.md#refrigerator), 신규 `cabinet/tall/900x2650x600/closed` |
| 재활용·주방 상부 수납 | `kitchen-sorting`, `kitchen-overhead` | [service/wall cabinet](../../models/002-storage-and-sleep.md#cabinet-and-shelf) |
| powder 세면대·거울·변기·청소장 | `powder-basin`(실제 폭 0.80), `powder-toilet`, `powder-cleaning` | [basin/800](../../models/003-service-fixtures.md#basin), [toilet](../../models/003-service-fixtures.md#toilet), [tall cabinet](../../models/002-storage-and-sleep.md#cabinet-and-shelf) |
| 1층 창고 선반·바구니 | `ground-store-shelves`, basket 넷 | [open cabinet](../../models/002-storage-and-sleep.md#cabinet-and-shelf), [basket](../../models/004-decor-and-fixtures.md#storage-basket) |
| 주침실 double bed·침구·러그 | `primary-bed`; 러그 없음 | [fixed-bed/1800](../../models/002-storage-and-sleep.md#fixed-bed), [bedroom-rug](../../models/004-decor-and-fixtures.md#rugs) |
| 주침실 협탁·구형 등 두 개 | `primary-nightstand-*`, `primary-lamp-*` 둘 | [nightstand cabinet](../../models/002-storage-and-sleep.md#cabinet-and-shelf), [globe lamp](../../models/004-decor-and-fixtures.md#portable-lamps) 및 각 system emitter |
| 주침실 옷장·책상·책상 의자 | `primary-wardrobe`, `primary-desk`, `primary-chair` | [tall cabinet](../../models/002-storage-and-sleep.md#cabinet-and-shelf), [work-desk](../../models/001-seating-and-work.md#work-desk), [desk-chair](../../models/001-seating-and-work.md#desk-chair) |
| 두 작은 침실의 single bed·옷장 | `child-*-bed`, `child-*-wardrobe` | [fixed-bed/1000](../../models/002-storage-and-sleep.md#fixed-bed), [tall cabinet](../../models/002-storage-and-sleep.md#cabinet-and-shelf) |
| 두 작은 침실의 원형 러그 | 현재 없음 | [round-rug/1200](../../models/004-decor-and-fixtures.md#rugs); 방별 배치는 instances가 결정 |
| 두 작은 침실의 desk/shelf·천 의자·작업등 | `child-*-desk`, `child-*-chair`, child-one의 책장; 작업등 없음 | [work-desk](../../models/001-seating-and-work.md#work-desk), [desk-chair](../../models/001-seating-and-work.md#desk-chair), [desk-task lamp](../../models/004-decor-and-fixtures.md#portable-lamps) |
| 침실 벽 액자·책·소형 화분 | 바닥 큰 화분만 일부; 액자·개별 책 없음 | [wall-art](../../models/004-decor-and-fixtures.md#wall-art), [book](../../models/004-decor-and-fixtures.md#books), [potted-plant](../../models/004-decor-and-fixtures.md#potted-plant) |
| 상층 욕실 세면대·변기·샤워·욕조 | `bath-vanity`, `bath-toilet`, `bath-shower`; 욕조 없음 | [basin/1000](../../models/003-service-fixtures.md#basin), [toilet](../../models/003-service-fixtures.md#toilet), [shower](../../models/003-service-fixtures.md#shower), [bathtub](../../models/003-service-fixtures.md#bathtub) |
| 상층 욕실 수건장·접힌 수건 | `bath-towels` 선반; 개별 수건 없음 | [open cabinet](../../models/002-storage-and-sleep.md#cabinet-and-shelf), [folded-towel](../../models/004-decor-and-fixtures.md#folded-towels) |
| 상층 수납 linen·청소장·바구니 | `upper-linen-cabinet`, linen stack; 청소장 없음 | [open cabinet와 신규 tall/600x2300x500](../../models/002-storage-and-sleep.md#cabinet-and-shelf), [folded-towel](../../models/004-decor-and-fixtures.md#folded-towels), [basket](../../models/004-decor-and-fixtures.md#storage-basket) |
| 상층 설비실 세탁·건조·점검 수납 | `upper-laundry`, `upper-mechanical`, `upper-utility-shelf` | [washer/dryer](../../models/003-service-fixtures.md#laundry-appliances), [service/open cabinet](../../models/002-storage-and-sleep.md#cabinet-and-shelf) |
| 실내 낮은 화분과 큰 화분 | `entry/common/primary-plant`; 작은 것은 없음 | [potted-plant 0.18..1.10](../../models/004-decor-and-fixtures.md#potted-plant) |
| 매입등 전체와 직접 발광 세 곳 | `lights()` 25점, pendant 하나, bedside 둘 | [recessed-light](../../models/004-decor-and-fixtures.md#recessed-light), [pendant](../../models/004-decor-and-fixtures.md#dining-pendant), [globe lamp](../../models/004-decor-and-fixtures.md#portable-lamps); 각 emissive ID는 system emitter도 필요 |

이 역대응은 legacy 80곳의 현재 배치가 새 prototype을 이미 소비한다는 뜻이 아니다. 신규 pantry·청소장·욕조·소품의 실제 member ID와 관찰은 instanceSources review 이후에 같은 compiled producer에서 받아야 하며 지금은 `unverified`다. 물체 면에 결합할 material H2는 prototype part/face를 받아 다시 판정하고, 이 표가 finish를 결정하지 않는다.

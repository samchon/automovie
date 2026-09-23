# 재료 설계 의무

## 재료 결정의 전체 배정 {#materials-design-materials-coverage}

<!--
@evidence obligations/design/materials.md#addressable-material-decisions 새 마감 25종과 보존·retained 역할, texture family 9종, 관찰 4역할을 29 H2에 배정한다. 석재 입자, 층간 띠 경계, 목재 끝면, 도기와 좌판의 광택처럼 따로 바뀌는 결정은 각자 H2를 갖고, 같은 구성·좌표·표본을 공유하는 변형(직물 네 색, steel과 거울, 두 joinery 도장)만 한 H2 안의 명시 항목으로 둔다.
@evidence obligations/design/materials.md#material-identity-assembly 각 마감 H2가 기준색과 명목 표면층(도장 .15mm·도막 .08mm·베니어 .6mm+투명 .06mm·유약 .5mm·직물 .001m·섬유 .003m)을 이름으로 정하고, 허용 대체는 retained/<현재 material id> 하나뿐이라고 배정한다.
@evidence obligations/design/materials.md#material-surface-assignment 001의 역할 주소 위에서 002~006이 표면군을 나눠 받고 wood-end·floor-band·retained로 끝면·부분 띠·보존 면까지 배정한다. junction 노출면은 향한 방의 벽 마감을, slab는 계단 구멍 쪽 절단면만 도장을 받아 두 마감은 실제 벽·문턱·부재 모서리에서만 바뀐다.
@evidence obligations/design/materials.md#material-response 모든 마감이 sRGB 기준색과 roughness·metallic을 수치로, 유리·PV·도기·거울이 transmission·ior·thickness·clearcoat·metallic 1을, grain texture가 linear 무채색 평균·범위와 물리 반복 길이를 갖는다. normal·displacement는 001에서 채널 밖으로 둔다.
@evidence obligations/design/materials.md#material-review-set 007이 native census, 1m·3m·12m와 30° 사선의 중성 장면·접합 목록, topology 전체 관찰과 다섯 reference, privacy·flex·문 상태 쌍을 배정하고 각 마감 H2가 자기 반례를 그 표본에 연결한다.
-->

재료 결정은 다음 owner로 나뉜다. 각 H2는 자기 마감의 기준색·응답·texture·좌표·표본을 소유하고, 결합 주소와 좌표 규칙은 001을 공유한다.

| 마감 또는 역할 | 소유 H2 | 받는 표면 |
| --- | --- | --- |
| limestone-honed | 002#limestone-panels | 네 입면의 stone panel·wall body·corner prism·drip, 지붕 가장자리 stone |
| floor-band-finish | 002#opaque-floor-band | 아래 head 2.80·위 sill 3.32 창 쌍의 frame 포함 교집합(a-0.04..b+0.04) 안 외향 석재 면 |
| frame-coated | 002#coated-metal | 창호 frame·shade-box·hem, 문 hardware, 실내 계단 난간, 가구 metal 다리·손잡이, 샤워 screen rail, 등기구 trim·pendant cord |
| steel-satin, mirror-proxy | 002#exposed-steel | 수전·싱크·hob ring·가전 손잡이·stringer·flush·shower 부속, 욕실·powder 거울 |
| 투명 유리 두 상태 | 003#clear-glass | curtainwall glass pane |
| 반투명 유리 | 003#frosted-glass | 하부 privacy band와 욕실 창 |
| PV·canopy-metal 보존 | 003#pv-and-canopy | v-076이 닫은 캐노피 전체 |
| oak-floor | 004#oak-floor | 아홉 방의 floor-boards |
| oak-joinery | 004#oak-joinery | 문짝·jamb·head, oak cabinet, murphy 틀 |
| oak-furniture | 004#furniture-wood | 식탁·coffee table·desk·침대·식탁 의자 목재부·sofa plinth |
| oak-stair | 004#stair-wood | tread·riser·half-landing |
| wood-end/<목재 마감> | 004#wood-end-faces | grain 축이 법선과 평행한 끝면 |
| plaster-paint | 005#plaster-paint | plaster lining·stair-lining·ceiling, 층 owner 내벽 body·pocket skin, plaster 방과 계단 구멍을 향한 junction 15면, slab의 계단 구멍 쪽 절단면 |
| felt-panel | 005#felt-panels | 작업실 lining |
| textile-linen·green·blue·white | 005#textiles | 소파·의자·현관 bench cushion, 침구, rug |
| screen-fabric | 005#screen-fabric | shade panel |
| wet-tile | 006#wet-tile | 세 습식 방의 바닥판과 powder·욕실 lining, 욕실 tile 벽 안의 junction 1면 |
| worktop-stone | 006#worktop-stone | island counter와 wall bank worktop |
| sanitary-ceramic | 006#sanitary-ceramic | basin·toilet·shower tray |
| sanitary-seat | 006#sanitary-seat | toilet seat |
| joinery-green, joinery-light | 006#painted-joinery | 녹색 cabinet, overhead·murphy panel |
| retained/<현재 material id> | 006#retained-surfaces | 식재·토양·대지 포장·기기·소품·glow와 이름으로 든 새 마감 없는 역할(felt 바구니·linen 더미·샤워 유리·세탁기·steel 설비장·stool 좌판 등), 지붕 방수 최종 면·캐노피 pedestal·기초 plinth, slab의 숨은 면 |

texture family는 limestone-grain, floor-band/<owner>/<element-or-member>, oak-grain, paint-grain, felt-grain, woven-grain, tile-grain, worktop-grain과 보존되는 canopy-pv-cell이다. 모두 typed source의 결정론적 RGBA이고 사진이나 reference 이미지를 쓰지 않는다. 반복 texture는 surface-metres와 repeat, 층간 띠만 clamp를 쓴다.

두 마감이 만나는 곳은 실제 형상의 경계다. 공유 벽은 양쪽 방 lining이 각자 마감을 받고(예: 현관 plaster/작업실 felt, 복도 plaster/욕실 tile), 문턱은 oak 바닥과 tile 바닥이 문 아래에서 나뉜다. 층간 띠는 쌍 창의 frame 바깥선에서 끝나는 석재 위 도장이고, junction 노출면은 향한 방의 벽 마감(공용부 전면벽은 도장, 욕실 동측 벽은 tile)을 따른다. 같은 면에 서로 다른 두 사후 칠하기 owner를 두지 않는다.

관찰은 007이 맡는다. binding-census는 역할 주소별 배정과 variant 증가를, scale-and-junction-samples는 반복·접합·native span 검사를, reference-material-samples는 topology 전체 관찰과 다섯 reference를, material-state-samples는 privacy·flex·문 상태 쌍을 반증한다. 이 배정은 아직 설계이며 재료 source, native census 실행, GPU 프레임은 없다. 재료 구현과 독립 시각 판정은 미완료다.

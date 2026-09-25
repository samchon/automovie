# 수납과 침대 모델

[공통 재현 계약](000-representation.md#model-address-and-scale)을 참조한다.

## 수납장 외함과 열린 책장 {#cabinet-and-shelf}

`cabinet/<형상형>/<폭-mm>x<높이-mm>x<깊이-mm>/<closed|open>`이 prototype ID다. mm 토큰은 [공통 규칙](000-representation.md#model-address-and-scale)대로 검증한다. 일반형은 폭 0.50..2.90m, 높이 0.44..2.65m, 깊이 0.25..0.76m이며 예외 `island-base/880x870x2650`은 Z 장축 2.65m를 깊이 토큰에 명시한다. 다른 일반형을 이 예외로 확대하지 않는다. 원점은 바닥 접촉 중심, 일반형 +Z는 문·열린 선반 앞, 섬 하부장만 +X가 스툴이 붙는 긴 외측, −X가 서비스 문 쪽이며 장축은 Z다. `open-shelf`만 `open`이고 나머지 형상형은 `closed`가 납품 상태다. `tall`, `service`, `wall`, `bench-base`, `island-base`는 별도의 `open` 검사 상태를 가지며 고정 외함은 같다. 일반형 문은 폭에서 산출한 모든 leaf를 왼쪽부터 `door-0..n-1`로 정렬하고, 짝수 leaf는 왼쪽 edge에서 0.013m 안쪽, 홀수 leaf는 오른쪽 edge에서 0.013m 안쪽의 x와 z=D/2−0.009에 Y 경첩 축을 둔다. 문은 z=D/2−0.018..D/2에 닿고 뒤판은 z=−D/2..−D/2+0.012, 측판은 그 두 면 사이에 있으므로 손잡이까지 포함한 닫힌 일반형의 전후 AABB는 깊이 D이며, 뒤 cleat가 있는 `wall`만 D+0.025m다. 최소 두 문인 좁은 변종도 같은 짝수 leaf 규칙을 쓴다. 섬 문은 x=−0.44..−0.422이고 축은 x=−0.427에서 각 leaf의 −Z 끝을 따른다. 검사 상태는 닫힌 각 문을 바깥으로 90° 회전시키며 중간 운동과 충돌 회피는 제공하지 않는다.

일반 외함의 측판·상하판은 0.018m, 뒤판은 0.012m, 문·서랍 전면은 0.018m 두께다. 섬 외의 측판은 두께 0.018m로 x=±W/2의 안쪽에, y=0.08..H, z=−D/2+0.012..D/2−0.023에 놓이고 하판은 y=0.08..0.098, 상판은 y=H−0.018..H이며 두 수평판도 z=−D/2+0.012..D/2−0.023이다. 내부 선반의 앞 edge도 z=D/2−0.023에서 끝나므로 열린 문이 점유하는 최소 z=D/2−0.022와 0.001m 떨어진다. 뒤판은 x=±W/2, y=0.08..H의 바깥 경계까지 닿는다. 벽장형 `wall`만 측·뒤판을 y=0..H, 하판을 y=0..0.018로 내려 앞의 0.08m 고정 프레임 뒤를 막는다. 외함마다 판 자체의 닫힌 두께를 내고 판들이 만나는 접합면은 중복 외부 삼각형으로 남기지 않는다. 문마다 지름 0.016m·축 길이 0.04m의 숨은 힌지 둘을 y=0.16과 H−0.16에 놓고, 섬 문은 y=0.16과 0.71에 놓는다. 일반형 힌지 축 z=D/2−0.009와 반경 0.008m는 문 두께 안의 z=D/2−0.017..D/2−0.001에 들고, 문에는 그 원통 점유를 절삭한 받침면을 둔다. 같은 hinge 부품의 0.006m 깊이 연결편은 z=D/2−0.023..D/2−0.017로 뒤로 뻗어 해당 측판 또는 중간 stile 전면에 면 접촉한다. leaf 이음마다 중심 x가 그 틈 중심인 두께 0.018m의 `stile-j`를 y=0.098..H−0.018,z=D/2−0.041..D/2−0.023에 두어 상·하판과 닿게 하고 안쪽 문 힌지의 고정점을 제공한다. 닫힌 문은 hinge 부피를 위한 원통 recess를 가지며, 모든 힌지는 문·stile의 부피를 관통하지 않는다. 문 손잡이는 각 leaf의 힌지 반대 세로 edge에서 0.055m 안쪽·y=0.083+0.55(H−0.086)에, 서랍 손잡이는 각 전면의 X 중심에 놓는다. 섬 서비스 문도 같은 문 높이식에 H=0.87m를 넣어 중심 y=0.5142m로 둔다. 모든 문에는 손잡이 하나, 모든 서랍에는 가로 손잡이 하나가 있다. 문틈은 중앙·둘레 0.003m, 손잡이는 폭 0.012×높이 0.16×깊이 0.016m이고 문 손잡이 중심은 바닥 기준 y=0.083+0.55(H−0.086)이고 섬도 이 식을 따른다. 일반형 문·서랍 전면에서는 그 점유를 실제로 절삭하고 손잡이를 z=D/2−0.016..D/2에 매립해 전면과 flush로 마친다. 섬 서비스 문에서는 같은 깊이 0.016m의 손잡이를 −X 전면 x=−0.44..−0.424에 매립한다. 금속 몸체 앞에 원래 판의 겹친 face를 남기지 않으므로 닫힌 외곽의 깊이 토큰 D는 손잡이까지 포함한다. 바닥형의 toe는 x=±W/2,y=0..0.08,z=−D/2..D/2−0.05이며, `wall`에는 toe가 없다. 열린 선반의 내부 높이 H-0.08m를 `n=max(1,ceil((H-0.08)/0.34))`개의 동일 중심 피치로 나누고 내부 선반 `shelf-1..n-1`의 중심 y=0.04+j(H-0.08)/n에 둔다. 상판·하판은 그 중심 피치 계산에 포함하지 않으며 실제 clear는 선반 두께 0.018m를 뺀 값이다. 이 공식과 토큰이 같은 id의 선반 개수와 위치를 단 하나로 정한다. `tall`에서 W≥1.30m인 세 침실 옷장만 오른쪽 x=+0.10W+0.018..W/2−0.018에 n−1개의 내부 선반을 두고 x=+0.10W..+0.10W+0.018에는 두께 0.018m의 세로 `divider`를 하판 상면부터 상판 하면까지, z=−D/2+0.012..D/2−0.018에 둔다. 왼쪽 빈 칸은 x=−W/2+0.018..+0.10W다. 가로 옷걸이 rod는 지름 0.025m, 길이 0.60W−0.018m, 중심 x=−0.20W+0.009,y=H−0.35,z=−0.08에 놓아 왼쪽 끝이 측판 내측 면, 오른쪽 끝이 divider의 왼쪽 면에 각각 면 접촉한다. W<1.30m인 pantry·청소장은 n−1개 선반을 전체 내부 폭 W−0.036에 두고 rod를 만들지 않는다. `service`·`wall`·`bench-base`도 위 n 규칙의 n−1개 선반을 내며 `wall`은 y=0 하판을 기준으로 피치를 y=jH/n으로 옮긴다. `island-base`의 내부 선반은 j=1..n−1, 중심 y=0.04+j(H−0.08)/n, x=−0.422..+0.422,z=−1.307..+1.307의 0.018m 닫힌 판 두 장이다. `nightstand`·`vanity`·`media`·`kitchen-base`의 legacy 내부 선반은 서랍·가전 bay로 전면을 재구성하면서 명명 퇴역하고 서랍 뒤쪽은 비운다. `vanity`의 상판은 [세면대](003-service-fixtures.md#basin) bowl 바깥벽과 겹치지 않게 중심 x=0,z=+0.025m, 폭 0.68W+0.04m·깊이 0.34m 직사각형을 y=H−0.018..H 전체 두께에서 절삭한다. 절삭 edge는 `top/edge`에 속하며 cavity 안에 중복 상판 face를 남기지 않는다. 열린 책장에는 문·손잡이가 없고 뒤판의 내측 면이 전면에서 보인다.

전면 형상은 다음 유한 규칙으로 결정한다. `open-shelf`에는 문이 없다. `tall`, `service`, `bench-base`, `wall`의 leaf 수는 `n=max(2,ceil((W−0.006)/0.60))`이고 각 leaf 폭은 `(W−(n+1)×0.003)/n`으로서 0.60m를 넘지 않는다. 왼쪽부터 index i=0..n−1의 leaf 중심은 `−W/2+0.003+i×(leaf폭+0.003)+leaf폭/2`이며 각 leaf의 네 가장자리에는 0.003m 틈이 있다. 모든 leaf 높이는 H−0.086m다. 이 문들은 하단 y=0.083, 상단 y=H−0.003이고 `wall`에는 toe 대신 하단 0.08m의 고정 프레임이 있다. `nightstand`는 중심 y=0.16,0.34의 높이 0.14m 서랍 둘, `vanity`는 중심 y=0.25,0.57의 높이 0.24m 서랍 둘이다. 둘 다 drawer 전면 폭 W−0.012m, 뒤쪽 상자 외폭 W−0.042m, 상자 깊이 D−0.038m다. 상자는 측벽·뒤벽·바닥 두께 0.012m의 속 빈 열린 부품이며 Z 점유는 −D/2+0.020..D/2−0.018, X 점유는 ±(W−0.042)/2이다. 측판 내폭 W−0.036m에서 양쪽 0.003m clear를 남기고 전면 판의 뒷면 z=D/2−0.018에 직접 면 접촉한다. 서랍·열린 bay 바깥의 남은 전면은 0.018m 두께의 `fixed-front` 고정띠다. 그 경계는 x=±W/2와 y=0.08..H에서 위에 선언한 서랍·열린 bay 직사각형 및 0.003m 둘레 seam을 차집합해 결정한다. `media`는 좌우 bay 폭 0.42W 안에서 각 0.003m 둘레 seam을 뺀 서랍 둘(중심 x=±0.29W,y=0.28, 높이 0.18m), x=±0.08W 사이에서 y=0.08..H−0.018인 열린 bay와 하단 0.08m 고정띠다. `kitchen-base`는 X 중심 폭 0.64m의 높이 0.59m 가전 개방 bay(y=0.15..0.74)와 그 아래의 `oven-sill`(x=±0.32,y=0.098..0.15,z=−D/2+0.012..D/2−0.018), 그 좌우 bay 폭 (W−0.64)/2에서 각 0.003m 둘레 seam을 뺀 세 서랍씩(중심 y=0.20,0.44,0.68, 높이 0.20m), 상단 0.08m 구조 띠를 갖는다. `island-base`는 일반형의 −Z 뒤판·±X 측판을 사용하지 않는다. 이 형상형의 top은 sink bowl 바깥벽 통과를 위해 자체 국소 중심 x=−0.08,z=+0.65m에 폭 0.52·길이 0.40m 직사각형을 전 두께에서 절삭한다. 별도 counter 상판의 sink 개구는 같은 world 중심 x=−0.12,z=+0.65m를 사용하고 base의 x=−0.04m 배치 때문에 두 절삭 중심이 정확히 겹친다. 장축 Z의 끝판 둘은 z=±(1.325−0.009), 두께 0.018m이고 +X 긴 면의 이음 없는 판은 x=+0.422..+0.440이다. −X 긴 면은 서비스 문 자리만 비우고 위·아래 고정띠를 남긴다. 섬 서비스 문 수는 `n=ceil((2.65−0.008)/0.60)=5`, 각 문 길이는 `(2.65−(n+1)×0.004)/n=0.5252m`, 두께는 x=−0.440..−0.422, 높이는 y=0.083..0.867이다. 왼쪽 Z 끝부터 i=0..4의 중심은 `−1.325+0.004+i×(0.5252+0.004)+0.5252/2`; 각 문의 −Z 경계에서 0.009m 안쪽에 Y 힌지를 두고 반대 Z edge에서 0.055m 안쪽에 손잡이를 둔다. 끝 Z면은 문 없는 측판이며 여섯 0.004m 틈을 일정하게 둔다. 실제 oven은 [조리 기기](003-service-fixtures.md#cooking-appliances)의 독립 prototype으로 개방 bay 안에 들어가며 cabinet 문 위에 겹쳐 놓지 않는다. `wall`은 y=0 toe가 없고 벽 고정 뒷판 뒤 z=−D/2−0.025..−D/2에 폭 0.08·높이 0.06·깊이 0.025m cleat 둘을 둔다. cleat 중심은 x=±(W/2−0.12), y=0.16이고 이 변종의 외곽 깊이는 D+0.025m다. 허용되는 형상형·치수 조합은 [전수 대응표](../accounts/models/legacy-fitout.md#legacy-root-correspondence)의 legacy root, 1층 tall pantry `cabinet/tall/900x2650x600/closed`, 상층 수납실 청소장 `cabinet/tall/600x2300x500/closed`에 한정한다. 두 새 변종은 기존 냉장고 내부 선반의 이름을 바꾸어 재사용하지 않으며 후속 instances가 별도 member로 배치한다. 임의의 폭으로 새로운 전면 분할을 고르는 자유도는 없다.

안정 주소는 `back/front/back/edge`, `side-left/right/outer/inner/front-edge/back-edge/top/sole`, `top/upper/underside/edge`, `bottom/upper/underside/edge`, `shelf-j/upper/underside/edge`, `door-0..n-1/front/back/edge`, `stile-j/front/back/edge/top/sole`, `drawer-j/front/side-left/side-right/back/bottom/top-edge`, `fixed-front/front/back/edge`, `handle-0..n-1/outer/contact`, `hinge-0..2n-1/outer/contact`, `oven-sill/upper/edge/underside`, `toe/front/back/top/underside/side`, `cleat-j/outer/contact`, 옷장에만 `divider/left/right/front/back/top/sole`, `rod/outer/end-left/end-right`다. 섬 예외의 안정 주소는 `dining-side/outer/inner/end/top/sole`, `end-negative/positive/outer/inner/edge`, `service-door-0..4/front/back/edge`, `service-hinge-0..9/outer/contact`, `service-handle-0..4/outer/contact`로 일반형의 back·side·door 주소를 대체한다. 위 슬래시는 prototype/part/face 계층을 뜻하며 `back` 판 앞·뒤와 열린 책장 측판의 전면 edge는 각각 별도 face다. 선반 속 빈 bay와 oven bay는 의도된 음각 공간이고 판은 닫힌 두께를 가진다. 정면·측면·45°·열린 선반 안쪽과 닫힌/90° 열린 문 변종에서 back 내부·edge·toe·서랍·oven 개방을 확인한다. ref02의 각 방 수납과 열린 린넨장, ref04의 벽 책장·서랍장, ref03의 하부장 서랍과 다섯 장으로 나뉜 긴 주방 상부장 전면을 채택한다. ref01·05는 수납 세부가 안 보이므로 판 두께를 추정하지 않고, ref03의 긴 초록 장을 두 문짝 하나로 단순화하지 않는다. 실제 경첩·서랍 하중과 사용자 손 닿음은 `unverified`다.

ref04 책상 왼쪽 벽붙박이 선반의 가로 책판과 목재 측판 읽힘은 `open-shelf`에 채택하되, 방 벽을 파낸 매입 형상은 채택하지 않는다. 벽 표면은 spaces가 소유하고 독립 수납 물체의 방별 밀착 배치는 instances가 결정한다. ref02 주침실의 별도 낮은 sideboard는 세 침실의 침대·옷장·책상 외에 배치 가능한 통행 폭이 아직 측정되지 않아 이번 허용 형상형에 넣지 않는다. 누락을 성공으로 세지 않고 주침실 배치 판정 전까지 `unverified`로 남긴다.

일반형 `open` 검사 상태에서 각 닫힌 문 사각형의 X 경계를 `[x_i,x_i+L]`, 앞뒤를 `[D/2−0.018,D/2]`, 힌지를 `(h_x,h_z)`라 둔다. 짝수 문은 `x'=h_x−(z−h_z), z'=h_z+(x−h_x)`, 홀수 문은 `x'=h_x+(z−h_z), z'=h_z−(x−h_x)`로 90° 돌린다. 그러면 외함과 모든 열린 문의 합집합 AABB는 일반형 `x=±W/2,y=0..H,z=−D/2..D/2+L−0.022`이고 `wall`만 z 최소가 `−D/2−0.025`다. 여기서 `L=(W−(n+1)×0.003)/n`이다. 섬 `open`은 다섯 서비스 문 각각의 −Z 경계에서 0.009m 안쪽인 `(h_x=−0.427,h_z)`를 축으로 `x'=h_x−(z−h_z),z'=h_z+(x−h_x)`로 돌려 `x=−0.9432..+0.440,y=0..0.87,z=±1.325m`를 낸다. 이 값은 문 부피와 외함의 합집합이며 회전 중간 경로나 손잡이 간섭은 `unverified`다.

## 현관 벤치와 신발장 {#entry-bench}

이 wrapper의 단독 부품은 방석 하나다. `support@0.44`는 별도 cabinet/bench-base의 상단 접촉면이며 cabinet 판을 이 부품 표에 복제하지 않는다.

@inventory default: cushion

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | default | * | bounds | -0.575..0.575 | 0..0.52 | -0.24..0.25 | - |
| @part | default | cushion | box | -0.575..0.575 | 0.44..0.52 | -0.24..0.25 | support@0.44 |

`entry-bench`는 폭 1.15, 외함 깊이 0.48, 방석 앞 돌출을 포함한 전체 깊이 0.49, 전체 높이 0.52m다. 바닥 외함 중심이 원점, +Z가 앉는 앞이다. `cabinet/bench-base/1150x440x480/closed`의 두 문 외함 위에 두께 0.08m 방석을 얹어 상면 y=0.52를 만든다. 방석은 z 앞쪽으로 0.01m만 돌출하며 문 seam·손잡이 높이를 가리지 않는다. `entry-bench` wrapper는 `cushion/upper/side/underside`만 만들고, 외함은 독립 `cabinet/bench-base/1150x440x480/closed`의 back·side·door·edge 주소를 그대로 운반한다. wrapper가 외함 판을 복제하거나 새 표면 ID로 바꾸지 않는다. 정면·측면·45°에서 수납 두 leaf와 착석 면이 함께 보여야 한다. ref02 현관의 벤치·신발장 기능을 채택하며 ref01의 바깥 포치를 벤치 형태로 옮기지 않는다. ref03·04·05에는 현관 벤치를 판독할 세부가 없다. 착석 하중·문 간섭은 `unverified`다.

## 현관 평벽 충전 선반 {#entry-charging-shelf}

`entry-charging-shelf`는 폭 0.32, 깊이 0.15, 몸판 두께 0.045m의 벽걸이 물체다. 원점은 평벽 마감면의 선반 아래 중앙(z=0)이며 +Z가 벽에서 실내로 나오는 방향, +Y가 위다. 판은 x=±0.16, y=0..0.045, z=0..0.15이고 뒤쪽 숨은 cleat는 0.22×0.030×0.025m로 x=±0.11,y=-0.030..0,z=0..0.025에 놓여 벽면과 판 아래면에 닿는다. 양 끝 아래의 지지 브래킷 둘은 두께 0.012m, 깊이 0.12m, 높이 0.08m이며 x=±0.125 중심,y=-0.08..0,z=0..0.12다. 각 브래킷은 z=0에서 평벽, y=0에서 판 아래면에 닿고 cleat와 x에서 겹치지 않는다. 우편을 올리는 상면은 평평하고 충전기 자리는 후속 배치다. `board/upper/underside/front-edge/side-left/side-right/back-contact`, `cleat/outer/contact`, `bracket-left/right/outer/contact`가 안정 주소다. 실제 건축 구멍이나 lining을 만들지 않는다. 정면·측면·상부에서 판 깊이와 평벽 접합이 읽혀야 한다. ref02의 현관 수납 기능과 settings의 건축 구멍 없는 선반 결정을 채택한다. ref01·03·04·05의 벽 장면을 충전 niche의 증거로 쓰지 않는다. 실제 앵커 하중은 `unverified`다.

@inventory default: board, cleat, bracket-left, bracket-right

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | default | * | bounds | -0.16..0.16 | -0.08..0.045 | 0..0.15 | - |
| @part | default | board | box | -0.16..0.16 | 0..0.045 | 0..0.15 | cleat,bracket-left,bracket-right |
| @part | default | cleat | box | -0.11..0.11 | -0.03..0 | 0..0.025 | wall,board |
| @part | default | bracket-left | box | -0.131..-0.119 | -0.08..0 | 0..0.12 | wall,board |
| @part | default | bracket-right | box | 0.119..0.131 | -0.08..0 | 0..0.12 | wall,board |

## 고정 침대와 침구 {#fixed-bed}

`fixed-bed/1800`은 1.80m 매트리스와 베개 둘, `fixed-bed/1000`은 1.00m 매트리스와 베개 하나다. 매트리스 길이 2.02m, 프레임 외곽은 폭 W+0.08·깊이 2.18·최고 1.01m다. 바닥 중심 원점, +Z는 발치다. 네 다리는 단면 0.045×0.045m이고 중심 x=±(W/2+0.0175), z=±1.00, y=0..0.08이다. 프레임의 측면 rail은 x=±(W/2+0.015..W/2+0.04), z=−1.03..+1.03, y=0.08..0.28이고, 머리·발치 rail은 x=±(W/2+0.04), z=−1.09..−1.03과 +1.03..+1.09, y=0.08..0.28이다. 이 네 rail은 겹치는 모서리 부피 없이 면으로 만나며 다리 상면과 면 접촉한다. `support-deck`은 x=±(W/2+0.015), z=−1.03..+1.03, y=0.26..0.28인 두께 0.02m의 닫힌 지지판이다. 네 rail의 안쪽 수직 면에 접하고 매트리스 아래면 y=0.28을 받는다. 지지판은 외곽 rail 아래 0.18m 틈의 윗부분에만 있으며 다리 사이의 바닥을 막지 않는다. 매트리스는 x=±W/2,z=−1.01..+1.01,y=0.28..0.50, 이불은 x=±(W/2−0.03),y=0.50..0.56에서 z=−0.40..+1.02를 덮는다. 머리판은 x=±(W/2+0.04),z=−1.09..−1.03,y=0.28..1.01로 머리 rail의 상면에 접하고 발치에 0.03m 접힌 이불 edge가 별도 부피로 보인다. 베개는 각각 폭 (W−0.18)/개수, 깊이 0.38, 높이 0.12m로 중심 z=−0.76, y=0.56(상면 0.62)에 놓인다. 두 베개 변종의 중심 x는 ±((W−0.18)/4+0.02)라 사이 틈이 0.04m이고, 한 베개 변종의 중심 x는 0이다.

안정 주소는 `frame-side-left/right/outer/inner/edge`, `frame-head/foot/outer/inner/edge`, `support-deck/upper/underside/edge`, `leg-0..3/shaft/top/sole`, `mattress/upper/side/underside`, `duvet/upper/edge/underside`, `headboard/front/back/edge`, `pillow-0..1/upper/edge/underside`다. 각 베개의 사용 여부는 ID 폭 변종으로 고정하고 소스의 blanket 색 문자열은 재료 ID가 아니다. 상부·발치·측면·45°에서 침대 폭, 머리판, 바닥 틈, 베개 수와 접힌 이불 끝을 확인한다. ref02의 세 침실 침대·침구와 ref05의 문 뒤 사적 구역 관계를 채택하며 ref05 복도 사진에서 침대 치수를 역산하지 않는다. ref01·03·04는 고정 침대 형상 근거가 아니다. 인체 누운 자세와 섬유 변형은 `unverified`다.

침대 폭 변종별 닫힌 부품의 점유와 지지면은 다음 표가 고정한다. rail 네 장 사이의 `support-deck`은 매트리스가 공중에 뜨지 않게 한다. `fixed-bed/1800`과 `fixed-bed/1000`에서 베개 수만 다르고 rail·다리 접촉 규칙은 같다.

@inventory 1800: frame-side-left, frame-side-right, frame-head, frame-foot, support-deck, leg-0, leg-1, leg-2, leg-3, mattress, duvet, headboard, pillow-0, pillow-1
@inventory 1000: frame-side-left, frame-side-right, frame-head, frame-foot, support-deck, leg-0, leg-1, leg-2, leg-3, mattress, duvet, headboard, pillow-0

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | 1800 | * | bounds | -0.94..0.94 | 0..1.01 | -1.09..1.09 | - |
| @part | 1800 | frame-side-left | box | -0.94..-0.915 | 0.08..0.28 | -1.03..1.03 | leg-0,frame-head,support-deck |
| @part | 1800 | frame-side-right | box | 0.915..0.94 | 0.08..0.28 | -1.03..1.03 | leg-2,frame-head,support-deck |
| @part | 1800 | frame-head | box | -0.94..0.94 | 0.08..0.28 | -1.09..-1.03 | frame-side-left,headboard |
| @part | 1800 | frame-foot | box | -0.94..0.94 | 0.08..0.28 | 1.03..1.09 | frame-side-right,support-deck |
| @part | 1800 | support-deck | box | -0.915..0.915 | 0.26..0.28 | -1.03..1.03 | frame-side-left,frame-side-right,mattress |
| @part | 1800 | leg-0 | box | -0.94..-0.895 | 0..0.08 | -1.0225..-0.9775 | ground,frame-side-left |
| @part | 1800 | leg-1 | box | -0.94..-0.895 | 0..0.08 | 0.9775..1.0225 | ground,frame-side-left |
| @part | 1800 | leg-2 | box | 0.895..0.94 | 0..0.08 | -1.0225..-0.9775 | ground,frame-side-right |
| @part | 1800 | leg-3 | box | 0.895..0.94 | 0..0.08 | 0.9775..1.0225 | ground,frame-side-right |
| @part | 1800 | mattress | box | -0.90..0.90 | 0.28..0.50 | -1.01..1.01 | support-deck,duvet,pillow-0,pillow-1 |
| @part | 1800 | duvet | box | -0.87..0.87 | 0.50..0.56 | -0.40..1.02 | mattress |
| @part | 1800 | headboard | box | -0.94..0.94 | 0.28..1.01 | -1.09..-1.03 | frame-head |
| @part | 1800 | pillow-0 | box | -0.83..-0.02 | 0.50..0.62 | -0.95..-0.57 | mattress |
| @part | 1800 | pillow-1 | box | 0.02..0.83 | 0.50..0.62 | -0.95..-0.57 | mattress |
| @envelope | 1000 | * | bounds | -0.54..0.54 | 0..1.01 | -1.09..1.09 | - |
| @part | 1000 | frame-side-left | box | -0.54..-0.515 | 0.08..0.28 | -1.03..1.03 | leg-0,frame-head,support-deck |
| @part | 1000 | frame-side-right | box | 0.515..0.54 | 0.08..0.28 | -1.03..1.03 | leg-2,frame-head,support-deck |
| @part | 1000 | frame-head | box | -0.54..0.54 | 0.08..0.28 | -1.09..-1.03 | frame-side-left,headboard |
| @part | 1000 | frame-foot | box | -0.54..0.54 | 0.08..0.28 | 1.03..1.09 | frame-side-right,support-deck |
| @part | 1000 | support-deck | box | -0.515..0.515 | 0.26..0.28 | -1.03..1.03 | frame-side-left,frame-side-right,mattress |
| @part | 1000 | leg-0 | box | -0.54..-0.495 | 0..0.08 | -1.0225..-0.9775 | ground,frame-side-left |
| @part | 1000 | leg-1 | box | -0.54..-0.495 | 0..0.08 | 0.9775..1.0225 | ground,frame-side-left |
| @part | 1000 | leg-2 | box | 0.495..0.54 | 0..0.08 | -1.0225..-0.9775 | ground,frame-side-right |
| @part | 1000 | leg-3 | box | 0.495..0.54 | 0..0.08 | 0.9775..1.0225 | ground,frame-side-right |
| @part | 1000 | mattress | box | -0.50..0.50 | 0.28..0.50 | -1.01..1.01 | support-deck,duvet,pillow-0 |
| @part | 1000 | duvet | box | -0.47..0.47 | 0.50..0.56 | -0.40..1.02 | mattress |
| @part | 1000 | headboard | box | -0.54..0.54 | 0.28..1.01 | -1.09..-1.03 | frame-head |
| @part | 1000 | pillow-0 | box | -0.41..0.41 | 0.50..0.62 | -0.95..-0.57 | mattress |

## 작업실 수납 침대 {#murphy-bed}

`murphy-bed`는 명시 상태 `work` 또는 `guest`를 받는다. 바닥 외함 중심 원점, +Z가 방 안쪽이다. 외함은 폭 1.30, 높이 2.36, 깊이 0.46m로 x=±0.65, z=±0.23이며 두 상태에서 같다. 뒤판 두께 0.025m는 z=-0.23..-0.205, 측판 두께 0.045m는 x=−0.65..−0.605와 +0.605..+0.65, y=0..2.32,z=−0.205..+0.23이고 상판 두께 0.04m는 y=2.32..2.36,z=−0.23..+0.23이다. pivot은 양쪽 x=±0.625, y=0.32, z=0.205의 동일 X축 한 줄이며 각 힌지는 지름 0.05m, X축 길이 0.05m의 닫힌 부품이다. 측판에는 각 힌지의 x=±(0.60..0.65), y=0.295..0.345, z=0.18..0.23 점유를 따라 닫힌 원통형 recess를 빼고 접촉 edge를 남긴다. 힌지는 세로 panel의 측면 x=±0.60과 손님 프레임의 뒤 edge z=0.23에 면으로 닿는다. 작업 상태의 세로 panel은 폭 1.20, 높이 2.28, 두께 0.035m로 x=±0.60,y=0.04..2.32,z=0.21..0.245에 닫힌다. 손잡이 0.32×0.025×0.025m는 x=±0.16,y=1.0175..1.0425,z=0.245..0.270에 보이며 작업 상태 AABB는 x=±0.65,y=0..2.36,z=−0.23..+0.27m다. 손님 상태 AABB는 x=±0.65,y=0..2.36,z=−0.23..+2.18m다. 손님 상태의 수평 프레임은 pivot에서 +Z로 뻗어 외함 전면 z=0.23부터 발치 z=2.18까지, 폭 1.22m·두께 0.12m로 y=0.32..0.44에 놓인다. 매트리스는 폭 1.10, 길이 1.82, 두께 0.16m로 z=0.27..2.09,y=0.44..0.60이다. 접지 지지 다리 두 개는 단면 0.045×0.045m, 중심 x=±0.52, z=2.08, y=0..0.32에 세워 프레임 아래면 y=0.32에서 끝내며 프레임 부피를 관통하지 않는다. 손님 침대에는 폭 1.08·길이 1.30·두께 0.055m의 이불을 y=0.60..0.655, z=0.72..2.02에, 폭 0.72·깊이 0.34·높이 0.11m의 베개 하나를 중심 z=0.50, y=0.655에 둔다. 별도 머리판은 외함의 내부 뒤판이 대신한다. 닫힌 panel과 펼친 frame·매트리스·침구는 동시에 나타나지 않는다. 실제 중간 회전 경로·잠금·하중은 `unverified`다.

공유 주소는 `case-back/front/back/edge`, `case-side-left/right/outer/inner/front-edge/back-edge/top/sole`, `case-top/upper/underside/edge`, `hinge-left/right/outer/contact`다. 작업만 `closed-panel/front/back/edge`, `pull/outer/contact`, 손님만 `bed-frame/upper/edge/underside`, `mattress/upper/side/underside`, `support-left/right/shaft/top/sole`, `duvet/upper/side/underside`, `pillow/upper/side/underside`를 낸다. 두 상태 모두 뒤판 앞면이 외함 내부에서 관찰될 수 있어 뒷면과 분리한다. 같은 45°·측면 중립 카메라와 작업실 출입 뷰에서 외함 점유의 동일함과 상태별 part 분리를 확인한다. ref04의 평평한 접이식 전면과 책상·계단으로 이어지는 열린 작업실을 채택하고, ref02의 작업실 정지 상태는 평면 관계 확인에 쓴다. ref01·03·05의 고정 방을 침대 동작 근거로 쓰지 않는다. 출입 원통 성립은 instances의 배치 검증 대상이다.

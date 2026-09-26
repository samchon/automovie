# 수납과 침대 모델

[공통 재현 계약](000-representation.md#model-address-and-scale)을 참조한다.

## 수납장 외함과 열린 책장 {#cabinet-and-shelf}

@prose-dim cleat의: cleat-*
@prose-dim cleat 둘은: cleat-*
@prose-part 섬 서비스 하단 고정띠는: service-strip-bottom
@prose-part 상단 고정띠는: service-strip-top
@prose-part sink 절삭의: top!void
@prose-part 열린 bay: fixed-front!void

`cabinet/<형상형>/<폭-mm>x<높이-mm>x<깊이-mm>/<closed|open>`이 prototype ID다. mm 토큰은 [공통 규칙](000-representation.md#model-address-and-scale)대로 검증한다. 일반형은 폭 0.50..2.90m, 높이 0.44..2.65m, 깊이 0.25..0.76m이며 예외 `island-base/880x870x2650`은 Z 장축 2.65m를 깊이 토큰에 명시한다. 다른 일반형을 이 예외로 확대하지 않는다. 원점은 바닥 접촉 중심, 일반형 +Z는 문·열린 선반 앞, 섬 하부장만 +X가 스툴이 붙는 긴 외측, −X가 서비스 문 쪽이며 장축은 Z다. `open-shelf`만 `open`이고 나머지 형상형은 `closed`가 납품 상태다. `tall`, `service`, `wall`, `bench-base`, `island-base`는 별도의 `open` 검사 상태를 가지며 고정 외함은 같다. 일반형 문은 폭에서 산출한 모든 leaf를 왼쪽부터 `door-0..n-1`로 정렬하고, 짝수 leaf는 왼쪽 edge에서 0.013m 안쪽, 홀수 leaf는 오른쪽 edge에서 0.013m 안쪽의 x와 z=D/2−0.009에 Y 경첩 축을 둔다. 문은 z=D/2−0.018..D/2에 닿고 뒤판은 z=−D/2..−D/2+0.012, 측판은 그 두 면 사이에 있으므로 손잡이까지 포함한 닫힌 일반형의 전후 AABB는 깊이 D이며, 뒤 cleat가 있는 `wall` cleat의 Z 깊이 c이며 닫힌 외함의 전체 깊이는 D에 이 깊이를 더한다. 최소 두 문인 좁은 변종도 같은 짝수 leaf 규칙을 쓴다. 섬 문은 x=−0.44..−0.422이고 축의 x는 `service-hinge-*` 행의 X 중심이며 각 leaf의 −Z 끝을 따른다. 열린 검사 상태는 닫힌 문의 각도를 바깥쪽 90°로 놓되 힌지 연결편의 절삭이 상태별로 달라 같은 강체 문 메시를 회전한 결과가 아니다. 두 상태의 문은 각각 별도 확정 형상이고 중간 운동과 충돌 회피는 제공하지 않는다.

일반 외함의 측판·상하판은 0.018m, 뒤판은 0.012m, 문·서랍 전면은 0.018m 두께다. 섬 외의 측판은 두께 0.018m로 x=±W/2의 안쪽에, y=0.098..H−0.018, z=−D/2+0.012..D/2−0.023에 놓인다. 하판은 y=0.08..0.098,z=−D/2+0.012..D/2−0.023이고, 상판은 y=H−0.018..H,z=−D/2..D/2−0.023이다. 내부 선반의 앞 edge도 z=D/2−0.023에서 끝나므로 열린 문이 점유하는 최소 z=D/2−0.022와 0.001m 떨어진다. 뒤판은 x=±W/2,y=0.08..H−0.018의 바깥 경계까지 닿고 상판 아래면과 면 접촉한다. 벽장형 `wall`만 뒤판을 y=0..H−0.018, 측판을 y=0.018..H−0.018, 하판을 y=0..0.018로 내려 앞의 0.083m 고정 프레임 뒤를 막는다. 외함마다 판 자체의 닫힌 두께를 내고 판들이 만나는 접합면은 중복 외부 삼각형으로 남기지 않는다. 문마다 X 폭 0.016m·Y 길이 0.04m의 숨은 사각 힌지 둘을 y=0.16과 H−0.16에 놓고, 섬 문은 y=0.16과 0.71에 놓는다. 일반형 힌지의 중심 z=D/2−0.009와 X 반폭 0.008m는 문 두께 안의 z=D/2−0.017..D/2−0.001에 들고, 문에는 그 직사각 점유를 절삭한 받침면을 둔다. 같은 hinge 부품의 0.005m 깊이 연결편은 z=D/2−0.023..D/2−0.018로 뒤로 뻗고, 0.001m collar가 z=D/2−0.018..D/2−0.017을 메워 해당 측판 또는 중간 stile 전면에 면 접촉한다. leaf 이음마다 중심 x가 그 틈 중심인 두께 0.018m의 `stile-j`를 바닥형에서는 y=0.098..H−0.018, `wall`에서는 y=0.018..H−0.018,z=D/2−0.041..D/2−0.023에 두고, 선반에서는 이 stile 점유를 빼고 옷장 divider에서는 stile 점유와 전방 0.005m 여유를 함께 빼서 상·하판과 닿게 하고 안쪽 문 힌지의 고정점을 제공한다. 닫힌 문은 hinge 부피를 위한 x=중심±0.008,y=중심±0.020,z=D/2−0.018..D/2−0.001의 직사각 recess를 가지며, 90° 열린 검사 상태에서도 축 주위 연결편의 점유를 판에서 절삭한다. 힌지의 두 닫힌 직육면체는 이 직사각 절삭 안에 놓이고 문 전면은 0.001m skin으로 남는다. 모든 힌지는 문·stile의 부피를 관통하지 않는다. 문 손잡이는 각 leaf의 힌지 반대 세로 edge에서 q 안쪽·y=0.083+0.55(H−0.086)에, 서랍 손잡이는 각 전면의 X 중심에 놓는다. 서랍의 가로 손잡이는 폭 0.16×높이 0.012×깊이 0.016m이며 판에서 같은 체적을 절삭한다. 섬 서비스 문도 같은 문 높이식에 H=0.87m를 넣어 중심 y=0.5142m로 둔다. 모든 문에는 손잡이 하나, 모든 서랍에는 가로 손잡이 하나가 있다. 문틈은 중앙·둘레 0.003m, 손잡이는 폭 0.012×높이 0.16×깊이 0.016m이고 문 손잡이 중심은 바닥 기준 y=0.083+0.55(H−0.086)이고 섬도 이 식을 따른다. 일반형 문·서랍 전면에서는 그 점유를 실제로 절삭하고 손잡이를 z=D/2−0.016..D/2에 매립해 전면과 flush로 마친다. 섬 서비스 문에서는 같은 깊이 0.016m의 손잡이를 −X 전면 x=−0.44..−0.424에 매립한다. 금속 몸체 앞에 원래 판의 겹친 face를 남기지 않으므로 닫힌 외곽의 깊이 토큰 D는 손잡이까지 포함한다. 바닥형의 toe는 x=±W/2,y=0..0.08,z=−D/2..D/2−0.05이며, `wall`에는 toe가 없다. 열린 선반의 내부 높이 H-0.08m를 `n=max(1,ceil((H-0.08)/0.34))`개의 동일 중심 피치로 나누고 내부 선반 `shelf-1..n-1`의 중심 y=0.04+j(H-0.08)/n에 둔다. 상판·하판은 그 중심 피치 계산에 포함하지 않으며 실제 clear는 선반 두께 0.018m를 뺀 값이다. 이 공식과 토큰이 같은 id의 선반 개수와 위치를 단 하나로 정한다. `tall`에서 W≥1.30m인 세 침실 옷장만 오른쪽 x=+0.10W+0.018..W/2−0.018에 n−1개의 내부 선반을 두고 x=+0.10W..+0.10W+0.018에는 두께 0.018m의 세로 `divider`를 하판 상면부터 상판 하면까지, z=−D/2+0.012..D/2−0.018에 둔다. 왼쪽 빈 칸은 x=−W/2+0.018..+0.10W다. 가로 옷걸이 rod는 지름 0.025m, 길이 0.60W−0.018m, 중심 x=−0.20W+0.009,y=H−0.35,z=−0.0055에 놓아 왼쪽 끝이 측판 내측 면, 오른쪽 끝이 divider의 왼쪽 면에 각각 면 접촉한다. W<1.30m인 pantry·청소장은 n−1개 선반을 전체 내부 폭 W−0.036에 두고 rod를 만들지 않는다. `service`·`wall`·`bench-base`도 위 n 규칙의 n−1개 선반을 내며 `wall`은 y=0 하판을 기준으로 피치를 y=jH/n으로 옮긴다. `island-base`의 내부 선반은 j=1..n−1, 중심 y=0.04+j(H−0.08)/n, x=−0.418..+0.422,z=−1.307..+1.307의 0.018m 닫힌 판 두 장이다. `nightstand`·`vanity`·`media`·`kitchen-base`의 legacy 내부 선반은 서랍·가전 bay로 전면을 재구성하면서 명명 퇴역하고 서랍 뒤쪽은 비운다. `vanity`의 상판은 [세면대](003-service-fixtures.md#basin) bowl 바깥벽과 겹치지 않게 중심 x=0,z=+0.025m, 폭 0.68W+0.04m·깊이 0.34m 직사각형을 y=H−0.018..H 전체 두께에서 절삭한다. 절삭 edge는 `top/edge`에 속하며 cavity 안에 중복 상판 face를 남기지 않는다. 열린 책장에는 문·손잡이가 없고 뒤판의 내측 면이 전면에서 보인다. 이 형상형만 측판·상판·하판·내부 선반의 앞 edge를 z=D/2까지 연장해 실제 개방 외연과 선언 점유를 일치시킨다.

전면 형상은 다음 유한 규칙으로 결정한다. `open-shelf`에는 문이 없다. `tall`, `service`, `bench-base`, `wall`의 leaf 수는 `n=max(2,ceil((W−0.006)/0.60))`이고 각 leaf 폭은 `(W−(n+1)×t)/n`으로서 0.60m를 넘지 않는다. 왼쪽부터 index i=0..n−1의 leaf 중심은 `−W/2+t+i×(leaf폭+t)+leaf폭/2`이며 `wall`의 각 leaf는 좌우·상단에 t 틈을 두고 하단은 `fixed-front-bottom`의 y=0.083 상면과 맞댄다. `tall`·`service`·`bench-base`의 하단은 그 고정 프레임이 없으므로 문 아래의 빈 이음으로 남기며 지지 경로는 측면 힌지다. 모든 leaf 높이는 H−0.086m다. 이 문들은 하단 y=0.083, 상단 y=H−t이고 `wall`에는 toe 대신 하단 0.083m의 고정 프레임이 있다. `nightstand`는 중심 y=0.16,0.34의 높이 0.14m 서랍 둘, `vanity`는 중심 y=0.25,0.57의 높이 0.24m 서랍 둘이다. 둘 다 drawer 전면 폭 W−0.012m, 뒤쪽 상자 외폭 W−0.042m, 상자 깊이 D−0.038m다. 상자는 측벽·뒤벽·바닥 두께 0.012m의 속 빈 열린 부품이며 Z 점유는 −D/2+0.020..D/2−0.018, X 점유는 ±(W−0.042)/2이다. 상자 Y 점유는 각 전면 Y 하한+0.015..상한−0.010m이고 앞판과 상자 바닥·좌우벽·뒤벽은 단일 drawer 부품의 서로 면 접촉하는 다섯 piece다. `nightstand`·`vanity`는 각 drawer 좌우에 x=측판 내측 면..상자 외측 면인 아래 `runner-*` 행이 정한 폭의 runner를 붙이며 runner Y는 상자 하한+0.012..+0.024, Z는 상자 뒤..외함 전면 inset까지다. `media`·`kitchen-base`는 열린 bay 양쪽의 0.018m `bay-divider-left/right`와 측판이 drawer 상자를 지지한다. 서랍 상자의 바깥 측면은 측판 또는 `bay-divider-left/right`에 맞대고 전면 판의 뒷면 z=D/2−0.018에 직접 면 접촉한다. 서랍·열린 bay 바깥의 남은 전면은 z=D/2−0.023..D/2의 0.023m 구조 깊이를 가진 `fixed-front` 고정띠다. 그 경계는 x=±W/2와 y=0.08..H−p에서 위에 선언한 서랍·열린 bay 직사각형 및 t 둘레 seam을 차집합해 결정한다. `media`는 좌우 bay에 아래 `media`의 `drawer-*` 행이 정한 서랍 둘을 두고, 아래 `@void media` 행의 X/Y 범위에 있는 열린 bay와 그 아래 `fixed-front` 부품의 닫힌 고정띠다. `kitchen-base`는 X 중앙의 가전 개방 bay(높이와 하한은 아래 `kitchen-base`의 `fixed-front` 절삭 행)와 그 아래의 `oven-sill`(x=±0.32,y=0.098..0.15,z=−D/2+0.012..D/2−0.023), 그 좌우 bay 폭 (W−0.64)/2에서 각 t 둘레 seam을 뺀 세 서랍씩(중심·높이는 아래 `kitchen-base`의 `drawer-*` 행), 상단 0.069m 구조 띠를 갖는다. `kitchen-base` 상판은 뒤 조리대 sink 외벽을 위해 아래 `@void kitchen-base/2900x870x620/closed: top` 행의 직사각형을 전 두께에서 절삭하며 서랍 윗면과 sink 바닥 사이에는 빈 층이 있다. `island-base`는 일반형의 −Z 뒤판·±X 측판을 사용하지 않는다. 이 형상형의 top은 sink bowl 바깥벽 통과를 위해 `island-base/880x870x2650`의 sink 절삭의 국소 중심 x=−0.08,z=+0.65m에 X 폭 0.52m·Z 깊이 0.40m인 직사각형을 전 두께에서 절삭한다. 별도 counter 상판의 sink 개구는 [주방 섬](003-service-fixtures.md#kitchen-island)이 소유한 world 중심을 사용하고 base의 x=−0.04m 배치 때문에 두 절삭 중심이 정확히 겹친다. 장축 Z의 끝판 둘은 z=±(D/2−p/2), 두께 p이며 x=−0.418..+0.440이다. 상·하판도 x=−0.418..+0.440에서 끝판 외연까지 닿고, +X 긴 면의 이음 없는 판은 x=+0.422..+0.440이다. −X 긴 면은 서비스 문 자리만 비우고 위·아래 고정띠와 문의 이음마다 x=−0.418..−0.400,z=이음 중심±0.009의 `service-stile-j`를 남긴다. 선반에서 이 stile의 점유를 절삭한다. 섬 서비스 문 수는 `n=ceil((D−2s)/0.60)=5`, 각 문 길이 L은 `(D−(n+1)×s)/n`, 두께는 x=−0.440..−0.422, 높이는 상·하판과 t clear를 두어 y=0.101..0.849이다. 왼쪽 Z 끝부터 i=0..4의 중심은 `−D/2+s+i×(L+s)+L/2`; 각 문의 −Z 경계에서 0.009m 안쪽에 Y 힌지를 두고 반대 Z edge에서 q 안쪽에 손잡이를 둔다. 끝 Z면은 문 없는 측판이며 여섯 s 폭 틈을 일정하게 둔다. 실제 oven은 [조리 기기](003-service-fixtures.md#cooking-appliances)의 독립 prototype으로 개방 bay 안에 들어가며 cabinet 문 위에 겹쳐 놓지 않는다. `wall`은 y=0 toe가 없고 벽 고정 뒷판 뒤 z=−D/2−c..−D/2에 cleat 둘은 폭 0.08·높이 0.06·깊이 c로 둔다. cleat 중심은 x=±(W/2−0.12), y=0.16이고 이 변종의 외곽 깊이는 D에 위 cleat의 Z 깊이를 더한 값이다. 여기서 p·d·c·q는 각각 `@cabinet-spec`의 panel·doorThickness·cleatDepth·handleEdgeInset이고 s와 t는 각각 islandSeam·seam이다. 허용되는 형상형·치수 조합은 [전수 대응표](../accounts/models/legacy-fitout.md#legacy-root-correspondence)의 legacy root, 1층 tall pantry `cabinet/tall/900x2650x600/closed`, 상층 수납실 청소장 `cabinet/tall/600x2300x500/closed`에 한정한다. 두 새 변종은 기존 냉장고 내부 선반의 이름을 바꾸어 재사용하지 않으며 후속 instances가 별도 member로 배치한다. 임의의 폭으로 새로운 전면 분할을 고르는 자유도는 없다.

안정 주소는 `back/front/back/edge`, `side-left/right/outer/inner/front-edge/back-edge/top/sole`, `top/upper/underside/edge`, `bottom/upper/underside/edge`, `shelf-j/upper/underside/edge`, `door-0..n-1/front/back/edge`, `stile-j/front/back/edge/top/sole`, `drawer-j/front/side-left/side-right/back/bottom/top-edge`, `fixed-front/front/back/edge`, `handle-0..n-1/outer/contact`, `hinge-0..2n-1/outer/contact`, `oven-sill/upper/edge/underside`, `toe/front/back/top/underside/side`, `cleat-j/outer/contact`, 옷장에만 `divider/left/right/front/back/top/sole`, `rod/outer/end-left/end-right`다. 서랍형에만 `runner-j-left/right/outer/contact`, `bay-divider-left/right/front/back/edge`가 있다. 섬 예외의 안정 주소는 `service-stile-j/front/back/edge/top/sole`, `dining-side/outer/inner/end/top/sole`, `end-negative/positive/outer/inner/edge`, `service-door-0..4/front/back/edge`, `service-hinge-0..9/outer/contact`, `service-handle-0..4/outer/contact`로 일반형의 back·side·door 주소를 대체한다. 위 슬래시는 prototype/part/face 계층을 뜻하며 `back` 판 앞·뒤와 열린 책장 측판의 전면 edge는 각각 별도 face다. 선반 속 빈 bay와 oven bay는 의도된 음각 공간이고 판은 닫힌 두께를 가진다. 정면·측면·45°·열린 선반 안쪽과 닫힌/90° 열린 문 변종에서 back 내부·edge·toe·서랍·oven 개방을 확인한다. ref02의 각 방 수납과 열린 린넨장, ref04의 벽 책장·서랍장, ref03의 하부장 서랍과 다섯 장으로 나뉜 긴 주방 상부장 전면을 채택한다. ref01·05는 수납 세부가 안 보이므로 판 두께를 추정하지 않고, ref03의 긴 초록 장을 두 문짝 하나로 단순화하지 않는다. 실제 경첩·서랍 하중과 사용자 손 닿음은 `unverified`다.

ref04 책상 왼쪽 벽붙박이 선반의 가로 책판과 목재 측판 읽힘은 `open-shelf`에 채택하되, 방 벽을 파낸 매입 형상은 채택하지 않는다. 벽 표면은 spaces가 소유하고 독립 수납 물체의 방별 밀착 배치는 instances가 결정한다. ref02 주침실의 별도 낮은 sideboard는 세 침실의 침대·옷장·책상 외에 배치 가능한 통행 폭이 아직 측정되지 않아 이번 허용 형상형에 넣지 않는다. 누락을 성공으로 세지 않고 주침실 배치 판정 전까지 `unverified`로 남긴다.

일반형 `open` 검사 상태에서 각 닫힌 문 사각형의 X 경계를 `[x_i,x_i+L]`, 앞뒤를 `[D/2−d,D/2]`, 힌지를 `(h_x,h_z)`라 둔다. 짝수 문은 `x'=h_x−(z−h_z), z'=h_z+(x−h_x)`, 홀수 문은 `x'=h_x+(z−h_z), z'=h_z−(x−h_x)`로 90° 돌린다. 그러면 외함과 모든 열린 문의 합집합 AABB는 일반형 아래 일반형 `@envelope` 행의 X·Y·Z 범위이고 `wall`만 z 최소가 `−D/2−c`다. 여기서 `L=(W−(n+1)×t)/n`이고 t는 `@cabinet-spec`의 seam이다. 섬 `open`은 다섯 서비스 문 각각의 −Z 경계에서 p/2 안쪽인 `(h_x,h_z)`를 축으로 `x'=h_x−(z−h_z),z'=h_z+(x−h_x)`로 돌려 `아래 `@envelope` 행의 X·Y·Z 범위`를 낸다. 이 값은 문 부피와 외함의 합집합이며 회전 중간 경로나 손잡이 간섭은 `unverified`다.

부품 표는 아래 명명된 계측 생산자가 이 H2의 수치와 허용 variant를 입력으로 결정론적으로 만든다. `@envelope`과 `@part`의 상태 키는 호출 가능한 `cabinet/<형상형>/<폭-mm>x<높이-mm>x<깊이-mm>/<closed|open>` ID와 정확히 같으며 행은 국소 m 좌표다. `open-shelf`는 `open`만 갖고 나머지 납품 변종은 `closed`이며 힌지가 있는 다섯 형상형에 한해 같은 치수 토큰의 `open` 검사 상태를 추가한다. `@void`와 `@piece`는 판 절삭과 접합을 기록한다. 생산자 `src/review/model-cabinet-producer.cjs`는 생성 블록을 수식과 정확히 대조하고 외함·힌지·서랍·섬 문에 관한 산문 단서를 별도로 검사한다.

섬 서비스 하단 고정띠는 x=−0.440..−0.418,y=0.080..0.101,z=−1.307..+1.307이고 상단 고정띠는 같은 X/Z에서 y=0.849..0.870이다. 서비스 문은 이 두 띠 사이에 있고 각 service hinge는 x=−0.435..−0.418의 숨은 직육면체 둘로 닫는다. 문 recess 안쪽 조각은 x=−0.435..−0.422, 고정판 쪽 연결 조각은 x=−0.422..−0.418이며 두 조각의 공유면은 Y 0.04m×Z 0.016m다. 연결 조각은 끝판 또는 service-stile에 유한 면으로 닿는다. `wall`의 toe 없는 전면 하단 프레임은 x=±W/2,y=0..0.083,z=D/2−0.023..D/2다. 이 고정띠와 프레임은 각각 `service-strip-bottom/top`과 `fixed-front-bottom` 안정 주소를 가진다.

`media`와 `kitchen-base`의 `fixed-front`는 서랍과 열린 bay를 절삭한 뒤 서로 떨어진 닫힌 조각을 같은 안정 part 주소로 묶는 의도된 예외다. 조각 수는 아래 `@component-count`가 소유하며 각 조각은 독립된 닫힌 2-manifold이고 빈 cutout을 가로질러 허구의 연결 삼각형을 만들지 않는다.

@component-count media/2000x440x350/closed: fixed-front, 3
@component-count kitchen-base/2900x870x620/closed: fixed-front, 6

@cabinet-spec: {"panel":0.018,"back":0.012,"toe":0.08,"frontInset":0.023,"cleatDepth":0.025,"doorThickness":0.018,"seam":0.003,"leafMaximum":0.6,"hingeHalfWidth":0.008,"hingeDepth":0.04,"hingeY":0.16,"handleEdgeInset":0.055,"handleWidth":0.012,"handleHeight":0.16,"handleDepth":0.016,"drawerWall":0.012,"shelfPitch":0.34,"islandSeam":0.004}
@cabinet-variants: bench-base/1150x440x480/closed, island-base/880x870x2650/closed, kitchen-base/2900x870x620/closed, media/2000x440x350/closed, nightstand/500x460x460/closed, open-shelf/1100x2600x500/open, open-shelf/1550x2500x500/open, open-shelf/600x1100x380/open, open-shelf/750x1200x400/open, open-shelf/850x2400x450/open, open-shelf/950x1350x250/open, service/1100x2400x560/closed, service/640x840x600/closed, tall/1300x2650x600/closed, tall/1400x2600x540/closed, tall/2720x2650x600/closed, tall/520x2250x520/closed, tall/600x2300x500/closed, tall/900x2650x600/closed, vanity/1000x800x480/closed, vanity/800x800x480/closed, wall/2900x980x360/closed

@scalar-control door-height-deduction: 0.086
@scalar-control toe-front-inset: 0.05
@scalar-control narrow-shelf-width-deduction: 0.036
@scalar-control drawer-box-depth-deduction: 0.038
@scalar-control drawer-box-bottom-inset: 0.015
@scalar-control runner-upper-offset: 0.024
@scalar-control kitchen-front-top-rail: 0.069

<!-- @generated-cabinet-parts:start -->
@inventory bench-base/1150x440x480/closed: back, bottom, top, side-left, side-right, toe, shelf-1, stile-1, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1

@void bench-base/1150x440x480/closed: shelf-1, -0.009..0.009, 0.211..0.229, 0.199..0.217
@void bench-base/1150x440x480/closed: door-0, -0.567..-0.551, 0.14..0.18, 0.222..0.239
@void bench-base/1150x440x480/closed: door-0, -0.567..-0.551, 0.26..0.3, 0.222..0.239
@void bench-base/1150x440x480/closed: door-0, -0.0625..-0.0505, 0.1977..0.3577, 0.224..0.24
@void bench-base/1150x440x480/closed: door-1, 0.551..0.567, 0.14..0.18, 0.222..0.239
@void bench-base/1150x440x480/closed: door-1, 0.551..0.567, 0.26..0.3, 0.222..0.239
@void bench-base/1150x440x480/closed: door-1, 0.0505..0.0625, 0.1977..0.3577, 0.224..0.24
@piece bench-base/1150x440x480/closed: hinge-0, -0.567..-0.551, 0.14..0.18, 0.217..0.222
@piece bench-base/1150x440x480/closed: hinge-0, -0.567..-0.551, 0.14..0.18, 0.222..0.239
@piece bench-base/1150x440x480/closed: hinge-1, -0.567..-0.551, 0.26..0.3, 0.217..0.222
@piece bench-base/1150x440x480/closed: hinge-1, -0.567..-0.551, 0.26..0.3, 0.222..0.239
@piece bench-base/1150x440x480/closed: hinge-2, 0.551..0.567, 0.14..0.18, 0.217..0.222
@piece bench-base/1150x440x480/closed: hinge-2, 0.551..0.567, 0.14..0.18, 0.222..0.239
@piece bench-base/1150x440x480/closed: hinge-3, 0.551..0.567, 0.26..0.3, 0.217..0.222
@piece bench-base/1150x440x480/closed: hinge-3, 0.551..0.567, 0.26..0.3, 0.222..0.239
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | bench-base/1150x440x480/closed | * | bounds | -0.575..0.575 | 0..0.44 | -0.24..0.24 | - |
| @part | bench-base/1150x440x480/closed | back | box | -0.575..0.575 | 0.08..0.422 | -0.24..-0.228 | toe,bottom,top |
| @part | bench-base/1150x440x480/closed | bottom | box | -0.575..0.575 | 0.08..0.098 | -0.228..0.217 | back,side-left,side-right |
| @part | bench-base/1150x440x480/closed | top | box | -0.575..0.575 | 0.422..0.44 | -0.24..0.217 | back,side-left,side-right |
| @part | bench-base/1150x440x480/closed | side-left | box | -0.575..-0.557 | 0.098..0.422 | -0.228..0.217 | back,bottom,top |
| @part | bench-base/1150x440x480/closed | side-right | box | 0.557..0.575 | 0.098..0.422 | -0.228..0.217 | back,bottom,top |
| @part | bench-base/1150x440x480/closed | toe | box | -0.575..0.575 | 0..0.08 | -0.24..0.19 | ground,back,bottom |
| @part | bench-base/1150x440x480/closed | shelf-1 | box | -0.557..0.557 | 0.211..0.229 | -0.228..0.217 | side-left,side-right,back |
| @part | bench-base/1150x440x480/closed | stile-1 | box | -0.009..0.009 | 0.098..0.422 | 0.199..0.217 | bottom,top |
| @part | bench-base/1150x440x480/closed | door-0 | box | -0.572..-0.0015 | 0.083..0.437 | 0.222..0.24 | hinge-0,hinge-1 |
| @part | bench-base/1150x440x480/closed | hinge-0 | box | -0.567..-0.551 | 0.14..0.18 | 0.217..0.239 | door-0,side-left |
| @part | bench-base/1150x440x480/closed | hinge-1 | box | -0.567..-0.551 | 0.26..0.3 | 0.217..0.239 | door-0,side-left |
| @part | bench-base/1150x440x480/closed | handle-0 | box | -0.0625..-0.0505 | 0.1977..0.3577 | 0.224..0.24 | door-0 |
| @part | bench-base/1150x440x480/closed | door-1 | box | 0.0015..0.572 | 0.083..0.437 | 0.222..0.24 | hinge-2,hinge-3 |
| @part | bench-base/1150x440x480/closed | hinge-2 | box | 0.551..0.567 | 0.14..0.18 | 0.217..0.239 | door-1,side-right |
| @part | bench-base/1150x440x480/closed | hinge-3 | box | 0.551..0.567 | 0.26..0.3 | 0.217..0.239 | door-1,side-right |
| @part | bench-base/1150x440x480/closed | handle-1 | box | 0.0505..0.0625 | 0.1977..0.3577 | 0.224..0.24 | door-1 |

@inventory bench-base/1150x440x480/open: back, bottom, top, side-left, side-right, toe, shelf-1, stile-1, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1

@void bench-base/1150x440x480/open: shelf-1, -0.009..0.009, 0.211..0.229, 0.199..0.217
@void bench-base/1150x440x480/open: door-0, -0.567..-0.55, 0.14..0.18, 0.223..0.239
@void bench-base/1150x440x480/open: door-0, -0.568..-0.55, 0.14..0.18, 0.218..0.239
@void bench-base/1150x440x480/open: door-0, -0.567..-0.55, 0.26..0.3, 0.223..0.239
@void bench-base/1150x440x480/open: door-0, -0.568..-0.55, 0.26..0.3, 0.218..0.239
@void bench-base/1150x440x480/open: door-0, -0.568..-0.552, 0.1977..0.3577, 0.7275..0.7395
@void bench-base/1150x440x480/open: door-1, 0.55..0.567, 0.14..0.18, 0.223..0.239
@void bench-base/1150x440x480/open: door-1, 0.55..0.568, 0.14..0.18, 0.218..0.239
@void bench-base/1150x440x480/open: door-1, 0.55..0.567, 0.26..0.3, 0.223..0.239
@void bench-base/1150x440x480/open: door-1, 0.55..0.568, 0.26..0.3, 0.218..0.239
@void bench-base/1150x440x480/open: door-1, 0.552..0.568, 0.1977..0.3577, 0.7275..0.7395
@piece bench-base/1150x440x480/open: hinge-0, -0.567..-0.551, 0.14..0.18, 0.217..0.222
@piece bench-base/1150x440x480/open: hinge-0, -0.567..-0.551, 0.14..0.18, 0.222..0.239
@piece bench-base/1150x440x480/open: hinge-1, -0.567..-0.551, 0.26..0.3, 0.217..0.222
@piece bench-base/1150x440x480/open: hinge-1, -0.567..-0.551, 0.26..0.3, 0.222..0.239
@piece bench-base/1150x440x480/open: hinge-2, 0.551..0.567, 0.14..0.18, 0.217..0.222
@piece bench-base/1150x440x480/open: hinge-2, 0.551..0.567, 0.14..0.18, 0.222..0.239
@piece bench-base/1150x440x480/open: hinge-3, 0.551..0.567, 0.26..0.3, 0.217..0.222
@piece bench-base/1150x440x480/open: hinge-3, 0.551..0.567, 0.26..0.3, 0.222..0.239
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | bench-base/1150x440x480/open | * | bounds | -0.575..0.575 | 0..0.44 | -0.24..0.7885 | - |
| @part | bench-base/1150x440x480/open | back | box | -0.575..0.575 | 0.08..0.422 | -0.24..-0.228 | toe,bottom,top |
| @part | bench-base/1150x440x480/open | bottom | box | -0.575..0.575 | 0.08..0.098 | -0.228..0.217 | back,side-left,side-right |
| @part | bench-base/1150x440x480/open | top | box | -0.575..0.575 | 0.422..0.44 | -0.24..0.217 | back,side-left,side-right |
| @part | bench-base/1150x440x480/open | side-left | box | -0.575..-0.557 | 0.098..0.422 | -0.228..0.217 | back,bottom,top |
| @part | bench-base/1150x440x480/open | side-right | box | 0.557..0.575 | 0.098..0.422 | -0.228..0.217 | back,bottom,top |
| @part | bench-base/1150x440x480/open | toe | box | -0.575..0.575 | 0..0.08 | -0.24..0.19 | ground,back,bottom |
| @part | bench-base/1150x440x480/open | shelf-1 | box | -0.557..0.557 | 0.211..0.229 | -0.228..0.217 | side-left,side-right,back |
| @part | bench-base/1150x440x480/open | stile-1 | box | -0.009..0.009 | 0.098..0.422 | 0.199..0.217 | bottom,top |
| @part | bench-base/1150x440x480/open | door-0 | box | -0.568..-0.55 | 0.083..0.437 | 0.218..0.7885 | hinge-0,hinge-1 |
| @part | bench-base/1150x440x480/open | hinge-0 | box | -0.567..-0.551 | 0.14..0.18 | 0.217..0.239 | door-0,side-left |
| @part | bench-base/1150x440x480/open | hinge-1 | box | -0.567..-0.551 | 0.26..0.3 | 0.217..0.239 | door-0,side-left |
| @part | bench-base/1150x440x480/open | handle-0 | box | -0.568..-0.552 | 0.1977..0.3577 | 0.7275..0.7395 | door-0 |
| @part | bench-base/1150x440x480/open | door-1 | box | 0.55..0.568 | 0.083..0.437 | 0.218..0.7885 | hinge-2,hinge-3 |
| @part | bench-base/1150x440x480/open | hinge-2 | box | 0.551..0.567 | 0.14..0.18 | 0.217..0.239 | door-1,side-right |
| @part | bench-base/1150x440x480/open | hinge-3 | box | 0.551..0.567 | 0.26..0.3 | 0.217..0.239 | door-1,side-right |
| @part | bench-base/1150x440x480/open | handle-1 | box | 0.552..0.568 | 0.1977..0.3577 | 0.7275..0.7395 | door-1 |

@inventory island-base/880x870x2650/closed: bottom, top, toe, end-negative, end-positive, dining-side, service-strip-bottom, service-strip-top, shelf-1, shelf-2, service-stile-1, service-stile-2, service-stile-3, service-stile-4, service-door-0, service-hinge-0, service-hinge-1, service-handle-0, service-door-1, service-hinge-2, service-hinge-3, service-handle-1, service-door-2, service-hinge-4, service-hinge-5, service-handle-2, service-door-3, service-hinge-6, service-hinge-7, service-handle-3, service-door-4, service-hinge-8, service-hinge-9, service-handle-4

@void island-base/880x870x2650/closed: top, -0.34..0.18, 0.852..0.87, 0.45..0.85
@void island-base/880x870x2650/closed: shelf-1, -0.418..-0.4, 0.294333..0.312333, -0.8028..-0.7848
@void island-base/880x870x2650/closed: shelf-2, -0.418..-0.4, 0.557667..0.575667, -0.8028..-0.7848
@void island-base/880x870x2650/closed: shelf-1, -0.418..-0.4, 0.294333..0.312333, -0.2736..-0.2556
@void island-base/880x870x2650/closed: shelf-2, -0.418..-0.4, 0.557667..0.575667, -0.2736..-0.2556
@void island-base/880x870x2650/closed: shelf-1, -0.418..-0.4, 0.294333..0.312333, 0.2556..0.2736
@void island-base/880x870x2650/closed: shelf-2, -0.418..-0.4, 0.557667..0.575667, 0.2556..0.2736
@void island-base/880x870x2650/closed: shelf-1, -0.418..-0.4, 0.294333..0.312333, 0.7848..0.8028
@void island-base/880x870x2650/closed: shelf-2, -0.418..-0.4, 0.557667..0.575667, 0.7848..0.8028
@void island-base/880x870x2650/closed: service-door-0, -0.435..-0.422, 0.14..0.18, -1.32..-1.304
@void island-base/880x870x2650/closed: service-door-0, -0.435..-0.422, 0.69..0.73, -1.32..-1.304
@void island-base/880x870x2650/closed: service-door-0, -0.44..-0.424, 0.4342..0.5942, -0.8568..-0.8448
@void island-base/880x870x2650/closed: service-door-1, -0.435..-0.422, 0.14..0.18, -0.7908..-0.7748
@void island-base/880x870x2650/closed: service-door-1, -0.435..-0.422, 0.69..0.73, -0.7908..-0.7748
@void island-base/880x870x2650/closed: service-door-1, -0.44..-0.424, 0.4342..0.5942, -0.3276..-0.3156
@void island-base/880x870x2650/closed: service-door-2, -0.435..-0.422, 0.14..0.18, -0.2616..-0.2456
@void island-base/880x870x2650/closed: service-door-2, -0.435..-0.422, 0.69..0.73, -0.2616..-0.2456
@void island-base/880x870x2650/closed: service-door-2, -0.44..-0.424, 0.4342..0.5942, 0.2016..0.2136
@void island-base/880x870x2650/closed: service-door-3, -0.435..-0.422, 0.14..0.18, 0.2676..0.2836
@void island-base/880x870x2650/closed: service-door-3, -0.435..-0.422, 0.69..0.73, 0.2676..0.2836
@void island-base/880x870x2650/closed: service-door-3, -0.44..-0.424, 0.4342..0.5942, 0.7308..0.7428
@void island-base/880x870x2650/closed: service-door-4, -0.435..-0.422, 0.14..0.18, 0.7968..0.8128
@void island-base/880x870x2650/closed: service-door-4, -0.435..-0.422, 0.69..0.73, 0.7968..0.8128
@void island-base/880x870x2650/closed: service-door-4, -0.44..-0.424, 0.4342..0.5942, 1.26..1.272
@piece island-base/880x870x2650/closed: service-hinge-0, -0.435..-0.422, 0.14..0.18, -1.32..-1.304
@piece island-base/880x870x2650/closed: service-hinge-0, -0.422..-0.418, 0.14..0.18, -1.32..-1.304
@piece island-base/880x870x2650/closed: service-hinge-1, -0.435..-0.422, 0.69..0.73, -1.32..-1.304
@piece island-base/880x870x2650/closed: service-hinge-1, -0.422..-0.418, 0.69..0.73, -1.32..-1.304
@piece island-base/880x870x2650/closed: service-hinge-2, -0.435..-0.422, 0.14..0.18, -0.7908..-0.7748
@piece island-base/880x870x2650/closed: service-hinge-2, -0.422..-0.418, 0.14..0.18, -0.7908..-0.7748
@piece island-base/880x870x2650/closed: service-hinge-3, -0.435..-0.422, 0.69..0.73, -0.7908..-0.7748
@piece island-base/880x870x2650/closed: service-hinge-3, -0.422..-0.418, 0.69..0.73, -0.7908..-0.7748
@piece island-base/880x870x2650/closed: service-hinge-4, -0.435..-0.422, 0.14..0.18, -0.2616..-0.2456
@piece island-base/880x870x2650/closed: service-hinge-4, -0.422..-0.418, 0.14..0.18, -0.2616..-0.2456
@piece island-base/880x870x2650/closed: service-hinge-5, -0.435..-0.422, 0.69..0.73, -0.2616..-0.2456
@piece island-base/880x870x2650/closed: service-hinge-5, -0.422..-0.418, 0.69..0.73, -0.2616..-0.2456
@piece island-base/880x870x2650/closed: service-hinge-6, -0.435..-0.422, 0.14..0.18, 0.2676..0.2836
@piece island-base/880x870x2650/closed: service-hinge-6, -0.422..-0.418, 0.14..0.18, 0.2676..0.2836
@piece island-base/880x870x2650/closed: service-hinge-7, -0.435..-0.422, 0.69..0.73, 0.2676..0.2836
@piece island-base/880x870x2650/closed: service-hinge-7, -0.422..-0.418, 0.69..0.73, 0.2676..0.2836
@piece island-base/880x870x2650/closed: service-hinge-8, -0.435..-0.422, 0.14..0.18, 0.7968..0.8128
@piece island-base/880x870x2650/closed: service-hinge-8, -0.422..-0.418, 0.14..0.18, 0.7968..0.8128
@piece island-base/880x870x2650/closed: service-hinge-9, -0.435..-0.422, 0.69..0.73, 0.7968..0.8128
@piece island-base/880x870x2650/closed: service-hinge-9, -0.422..-0.418, 0.69..0.73, 0.7968..0.8128
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | island-base/880x870x2650/closed | * | bounds | -0.44..0.44 | 0..0.87 | -1.325..1.325 | - |
| @part | island-base/880x870x2650/closed | bottom | box | -0.418..0.44 | 0.08..0.098 | -1.325..1.325 | toe,end-negative,end-positive |
| @part | island-base/880x870x2650/closed | top | box | -0.418..0.44 | 0.852..0.87 | -1.325..1.325 | end-negative,end-positive,dining-side |
| @part | island-base/880x870x2650/closed | toe | box | -0.44..0.44 | 0..0.08 | -1.325..1.275 | ground,bottom |
| @part | island-base/880x870x2650/closed | end-negative | box | -0.418..0.44 | 0.098..0.852 | -1.325..-1.307 | bottom,top,dining-side |
| @part | island-base/880x870x2650/closed | end-positive | box | -0.418..0.44 | 0.098..0.852 | 1.307..1.325 | bottom,top,dining-side |
| @part | island-base/880x870x2650/closed | dining-side | box | 0.422..0.44 | 0.098..0.852 | -1.307..1.307 | bottom,top,end-negative,end-positive |
| @part | island-base/880x870x2650/closed | service-strip-bottom | box | -0.44..-0.418 | 0.08..0.101 | -1.307..1.307 | toe,bottom |
| @part | island-base/880x870x2650/closed | service-strip-top | box | -0.44..-0.418 | 0.849..0.87 | -1.307..1.307 | top |
| @part | island-base/880x870x2650/closed | shelf-1 | box | -0.418..0.422 | 0.294333..0.312333 | -1.307..1.307 | end-negative,end-positive,dining-side |
| @part | island-base/880x870x2650/closed | shelf-2 | box | -0.418..0.422 | 0.557667..0.575667 | -1.307..1.307 | end-negative,end-positive,dining-side |
| @part | island-base/880x870x2650/closed | service-stile-1 | box | -0.418..-0.4 | 0.098..0.852 | -0.8028..-0.7848 | bottom,top |
| @part | island-base/880x870x2650/closed | service-stile-2 | box | -0.418..-0.4 | 0.098..0.852 | -0.2736..-0.2556 | bottom,top |
| @part | island-base/880x870x2650/closed | service-stile-3 | box | -0.418..-0.4 | 0.098..0.852 | 0.2556..0.2736 | bottom,top |
| @part | island-base/880x870x2650/closed | service-stile-4 | box | -0.418..-0.4 | 0.098..0.852 | 0.7848..0.8028 | bottom,top |
| @part | island-base/880x870x2650/closed | service-door-0 | box | -0.44..-0.422 | 0.101..0.849 | -1.321..-0.7958 | service-hinge-0,service-hinge-1 |
| @part | island-base/880x870x2650/closed | service-hinge-0 | box | -0.435..-0.418 | 0.14..0.18 | -1.32..-1.304 | service-door-0,end-negative |
| @part | island-base/880x870x2650/closed | service-hinge-1 | box | -0.435..-0.418 | 0.69..0.73 | -1.32..-1.304 | service-door-0,end-negative |
| @part | island-base/880x870x2650/closed | service-handle-0 | box | -0.44..-0.424 | 0.4342..0.5942 | -0.8568..-0.8448 | service-door-0 |
| @part | island-base/880x870x2650/closed | service-door-1 | box | -0.44..-0.422 | 0.101..0.849 | -0.7918..-0.2666 | service-hinge-2,service-hinge-3 |
| @part | island-base/880x870x2650/closed | service-hinge-2 | box | -0.435..-0.418 | 0.14..0.18 | -0.7908..-0.7748 | service-door-1,service-stile-1 |
| @part | island-base/880x870x2650/closed | service-hinge-3 | box | -0.435..-0.418 | 0.69..0.73 | -0.7908..-0.7748 | service-door-1,service-stile-1 |
| @part | island-base/880x870x2650/closed | service-handle-1 | box | -0.44..-0.424 | 0.4342..0.5942 | -0.3276..-0.3156 | service-door-1 |
| @part | island-base/880x870x2650/closed | service-door-2 | box | -0.44..-0.422 | 0.101..0.849 | -0.2626..0.2626 | service-hinge-4,service-hinge-5 |
| @part | island-base/880x870x2650/closed | service-hinge-4 | box | -0.435..-0.418 | 0.14..0.18 | -0.2616..-0.2456 | service-door-2,service-stile-2 |
| @part | island-base/880x870x2650/closed | service-hinge-5 | box | -0.435..-0.418 | 0.69..0.73 | -0.2616..-0.2456 | service-door-2,service-stile-2 |
| @part | island-base/880x870x2650/closed | service-handle-2 | box | -0.44..-0.424 | 0.4342..0.5942 | 0.2016..0.2136 | service-door-2 |
| @part | island-base/880x870x2650/closed | service-door-3 | box | -0.44..-0.422 | 0.101..0.849 | 0.2666..0.7918 | service-hinge-6,service-hinge-7 |
| @part | island-base/880x870x2650/closed | service-hinge-6 | box | -0.435..-0.418 | 0.14..0.18 | 0.2676..0.2836 | service-door-3,service-stile-3 |
| @part | island-base/880x870x2650/closed | service-hinge-7 | box | -0.435..-0.418 | 0.69..0.73 | 0.2676..0.2836 | service-door-3,service-stile-3 |
| @part | island-base/880x870x2650/closed | service-handle-3 | box | -0.44..-0.424 | 0.4342..0.5942 | 0.7308..0.7428 | service-door-3 |
| @part | island-base/880x870x2650/closed | service-door-4 | box | -0.44..-0.422 | 0.101..0.849 | 0.7958..1.321 | service-hinge-8,service-hinge-9 |
| @part | island-base/880x870x2650/closed | service-hinge-8 | box | -0.435..-0.418 | 0.14..0.18 | 0.7968..0.8128 | service-door-4,service-stile-4 |
| @part | island-base/880x870x2650/closed | service-hinge-9 | box | -0.435..-0.418 | 0.69..0.73 | 0.7968..0.8128 | service-door-4,service-stile-4 |
| @part | island-base/880x870x2650/closed | service-handle-4 | box | -0.44..-0.424 | 0.4342..0.5942 | 1.26..1.272 | service-door-4 |

@inventory island-base/880x870x2650/open: bottom, top, toe, end-negative, end-positive, dining-side, service-strip-bottom, service-strip-top, shelf-1, shelf-2, service-stile-1, service-stile-2, service-stile-3, service-stile-4, service-door-0, service-hinge-0, service-hinge-1, service-handle-0, service-door-1, service-hinge-2, service-hinge-3, service-handle-1, service-door-2, service-hinge-4, service-hinge-5, service-handle-2, service-door-3, service-hinge-6, service-hinge-7, service-handle-3, service-door-4, service-hinge-8, service-hinge-9, service-handle-4

@void island-base/880x870x2650/open: top, -0.34..0.18, 0.852..0.87, 0.45..0.85
@void island-base/880x870x2650/open: shelf-1, -0.418..-0.4, 0.294333..0.312333, -0.8028..-0.7848
@void island-base/880x870x2650/open: shelf-2, -0.418..-0.4, 0.557667..0.575667, -0.8028..-0.7848
@void island-base/880x870x2650/open: shelf-1, -0.418..-0.4, 0.294333..0.312333, -0.2736..-0.2556
@void island-base/880x870x2650/open: shelf-2, -0.418..-0.4, 0.557667..0.575667, -0.2736..-0.2556
@void island-base/880x870x2650/open: shelf-1, -0.418..-0.4, 0.294333..0.312333, 0.2556..0.2736
@void island-base/880x870x2650/open: shelf-2, -0.418..-0.4, 0.557667..0.575667, 0.2556..0.2736
@void island-base/880x870x2650/open: shelf-1, -0.418..-0.4, 0.294333..0.312333, 0.7848..0.8028
@void island-base/880x870x2650/open: shelf-2, -0.418..-0.4, 0.557667..0.575667, 0.7848..0.8028
@void island-base/880x870x2650/open: service-door-0, -0.435..-0.419, 0.14..0.18, -1.32..-1.307
@void island-base/880x870x2650/open: service-door-0, -0.46..-0.418, 0.14..0.18, -1.325..-1.307
@void island-base/880x870x2650/open: service-door-0, -0.435..-0.419, 0.69..0.73, -1.32..-1.307
@void island-base/880x870x2650/open: service-door-0, -0.46..-0.418, 0.69..0.73, -1.325..-1.307
@void island-base/880x870x2650/open: service-door-0, -0.8942..-0.8822, 0.4342..0.5942, -1.325..-1.309
@void island-base/880x870x2650/open: service-door-1, -0.435..-0.419, 0.14..0.18, -0.7908..-0.7778
@void island-base/880x870x2650/open: service-door-1, -0.46..-0.418, 0.14..0.18, -0.7958..-0.7778
@void island-base/880x870x2650/open: service-door-1, -0.435..-0.419, 0.69..0.73, -0.7908..-0.7778
@void island-base/880x870x2650/open: service-door-1, -0.46..-0.418, 0.69..0.73, -0.7958..-0.7778
@void island-base/880x870x2650/open: service-door-1, -0.8942..-0.8822, 0.4342..0.5942, -0.7958..-0.7798
@void island-base/880x870x2650/open: service-door-2, -0.435..-0.419, 0.14..0.18, -0.2616..-0.2486
@void island-base/880x870x2650/open: service-door-2, -0.46..-0.418, 0.14..0.18, -0.2666..-0.2486
@void island-base/880x870x2650/open: service-door-2, -0.435..-0.419, 0.69..0.73, -0.2616..-0.2486
@void island-base/880x870x2650/open: service-door-2, -0.46..-0.418, 0.69..0.73, -0.2666..-0.2486
@void island-base/880x870x2650/open: service-door-2, -0.8942..-0.8822, 0.4342..0.5942, -0.2666..-0.2506
@void island-base/880x870x2650/open: service-door-3, -0.435..-0.419, 0.14..0.18, 0.2676..0.2806
@void island-base/880x870x2650/open: service-door-3, -0.46..-0.418, 0.14..0.18, 0.2626..0.2806
@void island-base/880x870x2650/open: service-door-3, -0.435..-0.419, 0.69..0.73, 0.2676..0.2806
@void island-base/880x870x2650/open: service-door-3, -0.46..-0.418, 0.69..0.73, 0.2626..0.2806
@void island-base/880x870x2650/open: service-door-3, -0.8942..-0.8822, 0.4342..0.5942, 0.2626..0.2786
@void island-base/880x870x2650/open: service-door-4, -0.435..-0.419, 0.14..0.18, 0.7968..0.8098
@void island-base/880x870x2650/open: service-door-4, -0.46..-0.418, 0.14..0.18, 0.7918..0.8098
@void island-base/880x870x2650/open: service-door-4, -0.435..-0.419, 0.69..0.73, 0.7968..0.8098
@void island-base/880x870x2650/open: service-door-4, -0.46..-0.418, 0.69..0.73, 0.7918..0.8098
@void island-base/880x870x2650/open: service-door-4, -0.8942..-0.8822, 0.4342..0.5942, 0.7918..0.8078
@piece island-base/880x870x2650/open: service-hinge-0, -0.435..-0.422, 0.14..0.18, -1.32..-1.304
@piece island-base/880x870x2650/open: service-hinge-0, -0.422..-0.418, 0.14..0.18, -1.32..-1.304
@piece island-base/880x870x2650/open: service-hinge-1, -0.435..-0.422, 0.69..0.73, -1.32..-1.304
@piece island-base/880x870x2650/open: service-hinge-1, -0.422..-0.418, 0.69..0.73, -1.32..-1.304
@piece island-base/880x870x2650/open: service-hinge-2, -0.435..-0.422, 0.14..0.18, -0.7908..-0.7748
@piece island-base/880x870x2650/open: service-hinge-2, -0.422..-0.418, 0.14..0.18, -0.7908..-0.7748
@piece island-base/880x870x2650/open: service-hinge-3, -0.435..-0.422, 0.69..0.73, -0.7908..-0.7748
@piece island-base/880x870x2650/open: service-hinge-3, -0.422..-0.418, 0.69..0.73, -0.7908..-0.7748
@piece island-base/880x870x2650/open: service-hinge-4, -0.435..-0.422, 0.14..0.18, -0.2616..-0.2456
@piece island-base/880x870x2650/open: service-hinge-4, -0.422..-0.418, 0.14..0.18, -0.2616..-0.2456
@piece island-base/880x870x2650/open: service-hinge-5, -0.435..-0.422, 0.69..0.73, -0.2616..-0.2456
@piece island-base/880x870x2650/open: service-hinge-5, -0.422..-0.418, 0.69..0.73, -0.2616..-0.2456
@piece island-base/880x870x2650/open: service-hinge-6, -0.435..-0.422, 0.14..0.18, 0.2676..0.2836
@piece island-base/880x870x2650/open: service-hinge-6, -0.422..-0.418, 0.14..0.18, 0.2676..0.2836
@piece island-base/880x870x2650/open: service-hinge-7, -0.435..-0.422, 0.69..0.73, 0.2676..0.2836
@piece island-base/880x870x2650/open: service-hinge-7, -0.422..-0.418, 0.69..0.73, 0.2676..0.2836
@piece island-base/880x870x2650/open: service-hinge-8, -0.435..-0.422, 0.14..0.18, 0.7968..0.8128
@piece island-base/880x870x2650/open: service-hinge-8, -0.422..-0.418, 0.14..0.18, 0.7968..0.8128
@piece island-base/880x870x2650/open: service-hinge-9, -0.435..-0.422, 0.69..0.73, 0.7968..0.8128
@piece island-base/880x870x2650/open: service-hinge-9, -0.422..-0.418, 0.69..0.73, 0.7968..0.8128
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | island-base/880x870x2650/open | * | bounds | -0.9432..0.44 | 0..0.87 | -1.325..1.325 | - |
| @part | island-base/880x870x2650/open | bottom | box | -0.418..0.44 | 0.08..0.098 | -1.325..1.325 | toe,end-negative,end-positive |
| @part | island-base/880x870x2650/open | top | box | -0.418..0.44 | 0.852..0.87 | -1.325..1.325 | end-negative,end-positive,dining-side |
| @part | island-base/880x870x2650/open | toe | box | -0.44..0.44 | 0..0.08 | -1.325..1.275 | ground,bottom |
| @part | island-base/880x870x2650/open | end-negative | box | -0.418..0.44 | 0.098..0.852 | -1.325..-1.307 | bottom,top,dining-side |
| @part | island-base/880x870x2650/open | end-positive | box | -0.418..0.44 | 0.098..0.852 | 1.307..1.325 | bottom,top,dining-side |
| @part | island-base/880x870x2650/open | dining-side | box | 0.422..0.44 | 0.098..0.852 | -1.307..1.307 | bottom,top,end-negative,end-positive |
| @part | island-base/880x870x2650/open | service-strip-bottom | box | -0.44..-0.418 | 0.08..0.101 | -1.307..1.307 | toe,bottom |
| @part | island-base/880x870x2650/open | service-strip-top | box | -0.44..-0.418 | 0.849..0.87 | -1.307..1.307 | top |
| @part | island-base/880x870x2650/open | shelf-1 | box | -0.418..0.422 | 0.294333..0.312333 | -1.307..1.307 | end-negative,end-positive,dining-side |
| @part | island-base/880x870x2650/open | shelf-2 | box | -0.418..0.422 | 0.557667..0.575667 | -1.307..1.307 | end-negative,end-positive,dining-side |
| @part | island-base/880x870x2650/open | service-stile-1 | box | -0.418..-0.4 | 0.098..0.852 | -0.8028..-0.7848 | bottom,top |
| @part | island-base/880x870x2650/open | service-stile-2 | box | -0.418..-0.4 | 0.098..0.852 | -0.2736..-0.2556 | bottom,top |
| @part | island-base/880x870x2650/open | service-stile-3 | box | -0.418..-0.4 | 0.098..0.852 | 0.2556..0.2736 | bottom,top |
| @part | island-base/880x870x2650/open | service-stile-4 | box | -0.418..-0.4 | 0.098..0.852 | 0.7848..0.8028 | bottom,top |
| @part | island-base/880x870x2650/open | service-door-0 | box | -0.9432..-0.418 | 0.101..0.849 | -1.325..-1.307 | service-hinge-0,service-hinge-1 |
| @part | island-base/880x870x2650/open | service-hinge-0 | box | -0.435..-0.418 | 0.14..0.18 | -1.32..-1.304 | service-door-0,end-negative |
| @part | island-base/880x870x2650/open | service-hinge-1 | box | -0.435..-0.418 | 0.69..0.73 | -1.32..-1.304 | service-door-0,end-negative |
| @part | island-base/880x870x2650/open | service-handle-0 | box | -0.8942..-0.8822 | 0.4342..0.5942 | -1.325..-1.309 | service-door-0 |
| @part | island-base/880x870x2650/open | service-door-1 | box | -0.9432..-0.418 | 0.101..0.849 | -0.7958..-0.7778 | service-hinge-2,service-hinge-3 |
| @part | island-base/880x870x2650/open | service-hinge-2 | box | -0.435..-0.418 | 0.14..0.18 | -0.7908..-0.7748 | service-door-1,service-stile-1 |
| @part | island-base/880x870x2650/open | service-hinge-3 | box | -0.435..-0.418 | 0.69..0.73 | -0.7908..-0.7748 | service-door-1,service-stile-1 |
| @part | island-base/880x870x2650/open | service-handle-1 | box | -0.8942..-0.8822 | 0.4342..0.5942 | -0.7958..-0.7798 | service-door-1 |
| @part | island-base/880x870x2650/open | service-door-2 | box | -0.9432..-0.418 | 0.101..0.849 | -0.2666..-0.2486 | service-hinge-4,service-hinge-5 |
| @part | island-base/880x870x2650/open | service-hinge-4 | box | -0.435..-0.418 | 0.14..0.18 | -0.2616..-0.2456 | service-door-2,service-stile-2 |
| @part | island-base/880x870x2650/open | service-hinge-5 | box | -0.435..-0.418 | 0.69..0.73 | -0.2616..-0.2456 | service-door-2,service-stile-2 |
| @part | island-base/880x870x2650/open | service-handle-2 | box | -0.8942..-0.8822 | 0.4342..0.5942 | -0.2666..-0.2506 | service-door-2 |
| @part | island-base/880x870x2650/open | service-door-3 | box | -0.9432..-0.418 | 0.101..0.849 | 0.2626..0.2806 | service-hinge-6,service-hinge-7 |
| @part | island-base/880x870x2650/open | service-hinge-6 | box | -0.435..-0.418 | 0.14..0.18 | 0.2676..0.2836 | service-door-3,service-stile-3 |
| @part | island-base/880x870x2650/open | service-hinge-7 | box | -0.435..-0.418 | 0.69..0.73 | 0.2676..0.2836 | service-door-3,service-stile-3 |
| @part | island-base/880x870x2650/open | service-handle-3 | box | -0.8942..-0.8822 | 0.4342..0.5942 | 0.2626..0.2786 | service-door-3 |
| @part | island-base/880x870x2650/open | service-door-4 | box | -0.9432..-0.418 | 0.101..0.849 | 0.7918..0.8098 | service-hinge-8,service-hinge-9 |
| @part | island-base/880x870x2650/open | service-hinge-8 | box | -0.435..-0.418 | 0.14..0.18 | 0.7968..0.8128 | service-door-4,service-stile-4 |
| @part | island-base/880x870x2650/open | service-hinge-9 | box | -0.435..-0.418 | 0.69..0.73 | 0.7968..0.8128 | service-door-4,service-stile-4 |
| @part | island-base/880x870x2650/open | service-handle-4 | box | -0.8942..-0.8822 | 0.4342..0.5942 | 0.7918..0.8078 | service-door-4 |

@inventory kitchen-base/2900x870x620/closed: back, bottom, top, side-left, side-right, toe, fixed-front, bay-divider-left, bay-divider-right, oven-sill, drawer-0, handle-0, drawer-1, handle-1, drawer-2, handle-2, drawer-3, handle-3, drawer-4, handle-4, drawer-5, handle-5

@void kitchen-base/2900x870x620/closed: top, 0.9..1.3, 0.852..0.87, -0.08..0.22
@void kitchen-base/2900x870x620/closed: fixed-front, -0.32..0.32, 0.15..0.74, 0.287..0.31
@void kitchen-base/2900x870x620/closed: fixed-front, -1.45..-0.32, 0.097..0.303, 0.287..0.31
@void kitchen-base/2900x870x620/closed: drawer-0, -0.965..-0.805, 0.194..0.206, 0.294..0.31
@void kitchen-base/2900x870x620/closed: fixed-front, -1.45..-0.32, 0.337..0.543, 0.287..0.31
@void kitchen-base/2900x870x620/closed: drawer-1, -0.965..-0.805, 0.434..0.446, 0.294..0.31
@void kitchen-base/2900x870x620/closed: fixed-front, -1.45..-0.32, 0.577..0.783, 0.287..0.31
@void kitchen-base/2900x870x620/closed: drawer-2, -0.965..-0.805, 0.674..0.686, 0.294..0.31
@void kitchen-base/2900x870x620/closed: fixed-front, 0.32..1.45, 0.097..0.303, 0.287..0.31
@void kitchen-base/2900x870x620/closed: drawer-3, 0.805..0.965, 0.194..0.206, 0.294..0.31
@void kitchen-base/2900x870x620/closed: fixed-front, 0.32..1.45, 0.337..0.543, 0.287..0.31
@void kitchen-base/2900x870x620/closed: drawer-4, 0.805..0.965, 0.434..0.446, 0.294..0.31
@void kitchen-base/2900x870x620/closed: fixed-front, 0.32..1.45, 0.577..0.783, 0.287..0.31
@void kitchen-base/2900x870x620/closed: drawer-5, 0.805..0.965, 0.674..0.686, 0.294..0.31
@piece kitchen-base/2900x870x620/closed: drawer-0, -1.447..-0.323, 0.1..0.3, 0.292..0.31
@piece kitchen-base/2900x870x620/closed: drawer-0, -1.432..-0.338, 0.115..0.127, -0.29..0.292
@piece kitchen-base/2900x870x620/closed: drawer-0, -1.432..-1.42, 0.127..0.29, -0.29..0.292
@piece kitchen-base/2900x870x620/closed: drawer-0, -0.35..-0.338, 0.127..0.29, -0.29..0.292
@piece kitchen-base/2900x870x620/closed: drawer-0, -1.42..-0.35, 0.127..0.29, -0.29..-0.278
@piece kitchen-base/2900x870x620/closed: drawer-1, -1.447..-0.323, 0.34..0.54, 0.292..0.31
@piece kitchen-base/2900x870x620/closed: drawer-1, -1.432..-0.338, 0.355..0.367, -0.29..0.292
@piece kitchen-base/2900x870x620/closed: drawer-1, -1.432..-1.42, 0.367..0.53, -0.29..0.292
@piece kitchen-base/2900x870x620/closed: drawer-1, -0.35..-0.338, 0.367..0.53, -0.29..0.292
@piece kitchen-base/2900x870x620/closed: drawer-1, -1.42..-0.35, 0.367..0.53, -0.29..-0.278
@piece kitchen-base/2900x870x620/closed: drawer-2, -1.447..-0.323, 0.58..0.78, 0.292..0.31
@piece kitchen-base/2900x870x620/closed: drawer-2, -1.432..-0.338, 0.595..0.607, -0.29..0.292
@piece kitchen-base/2900x870x620/closed: drawer-2, -1.432..-1.42, 0.607..0.77, -0.29..0.292
@piece kitchen-base/2900x870x620/closed: drawer-2, -0.35..-0.338, 0.607..0.77, -0.29..0.292
@piece kitchen-base/2900x870x620/closed: drawer-2, -1.42..-0.35, 0.607..0.77, -0.29..-0.278
@piece kitchen-base/2900x870x620/closed: drawer-3, 0.323..1.447, 0.1..0.3, 0.292..0.31
@piece kitchen-base/2900x870x620/closed: drawer-3, 0.338..1.432, 0.115..0.127, -0.29..0.292
@piece kitchen-base/2900x870x620/closed: drawer-3, 0.338..0.35, 0.127..0.29, -0.29..0.292
@piece kitchen-base/2900x870x620/closed: drawer-3, 1.42..1.432, 0.127..0.29, -0.29..0.292
@piece kitchen-base/2900x870x620/closed: drawer-3, 0.35..1.42, 0.127..0.29, -0.29..-0.278
@piece kitchen-base/2900x870x620/closed: drawer-4, 0.323..1.447, 0.34..0.54, 0.292..0.31
@piece kitchen-base/2900x870x620/closed: drawer-4, 0.338..1.432, 0.355..0.367, -0.29..0.292
@piece kitchen-base/2900x870x620/closed: drawer-4, 0.338..0.35, 0.367..0.53, -0.29..0.292
@piece kitchen-base/2900x870x620/closed: drawer-4, 1.42..1.432, 0.367..0.53, -0.29..0.292
@piece kitchen-base/2900x870x620/closed: drawer-4, 0.35..1.42, 0.367..0.53, -0.29..-0.278
@piece kitchen-base/2900x870x620/closed: drawer-5, 0.323..1.447, 0.58..0.78, 0.292..0.31
@piece kitchen-base/2900x870x620/closed: drawer-5, 0.338..1.432, 0.595..0.607, -0.29..0.292
@piece kitchen-base/2900x870x620/closed: drawer-5, 0.338..0.35, 0.607..0.77, -0.29..0.292
@piece kitchen-base/2900x870x620/closed: drawer-5, 1.42..1.432, 0.607..0.77, -0.29..0.292
@piece kitchen-base/2900x870x620/closed: drawer-5, 0.35..1.42, 0.607..0.77, -0.29..-0.278
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | kitchen-base/2900x870x620/closed | * | bounds | -1.45..1.45 | 0..0.87 | -0.31..0.31 | - |
| @part | kitchen-base/2900x870x620/closed | back | box | -1.45..1.45 | 0.08..0.852 | -0.31..-0.298 | toe,bottom,top |
| @part | kitchen-base/2900x870x620/closed | bottom | box | -1.45..1.45 | 0.08..0.098 | -0.298..0.287 | back,side-left,side-right |
| @part | kitchen-base/2900x870x620/closed | top | box | -1.45..1.45 | 0.852..0.87 | -0.31..0.287 | back,side-left,side-right |
| @part | kitchen-base/2900x870x620/closed | side-left | box | -1.45..-1.432 | 0.098..0.852 | -0.298..0.287 | back,bottom,top |
| @part | kitchen-base/2900x870x620/closed | side-right | box | 1.432..1.45 | 0.098..0.852 | -0.298..0.287 | back,bottom,top |
| @part | kitchen-base/2900x870x620/closed | toe | box | -1.45..1.45 | 0..0.08 | -0.31..0.26 | ground,back,bottom |
| @part | kitchen-base/2900x870x620/closed | fixed-front | box | -1.45..1.45 | 0.08..0.852 | 0.287..0.31 | side-left,side-right |
| @part | kitchen-base/2900x870x620/closed | bay-divider-left | box | -0.338..-0.32 | 0.098..0.852 | -0.298..0.287 | bottom,top,back |
| @part | kitchen-base/2900x870x620/closed | bay-divider-right | box | 0.32..0.338 | 0.098..0.852 | -0.298..0.287 | bottom,top,back |
| @part | kitchen-base/2900x870x620/closed | oven-sill | box | -0.32..0.32 | 0.098..0.15 | -0.298..0.287 | bottom,bay-divider-left,bay-divider-right |
| @part | kitchen-base/2900x870x620/closed | drawer-0 | hollow | -1.447..-0.323 | 0.1..0.3 | -0.29..0.31 | side-left,bay-divider-left,handle-0 |
| @part | kitchen-base/2900x870x620/closed | handle-0 | box | -0.965..-0.805 | 0.194..0.206 | 0.294..0.31 | drawer-0 |
| @part | kitchen-base/2900x870x620/closed | drawer-1 | hollow | -1.447..-0.323 | 0.34..0.54 | -0.29..0.31 | side-left,bay-divider-left,handle-1 |
| @part | kitchen-base/2900x870x620/closed | handle-1 | box | -0.965..-0.805 | 0.434..0.446 | 0.294..0.31 | drawer-1 |
| @part | kitchen-base/2900x870x620/closed | drawer-2 | hollow | -1.447..-0.323 | 0.58..0.78 | -0.29..0.31 | side-left,bay-divider-left,handle-2 |
| @part | kitchen-base/2900x870x620/closed | handle-2 | box | -0.965..-0.805 | 0.674..0.686 | 0.294..0.31 | drawer-2 |
| @part | kitchen-base/2900x870x620/closed | drawer-3 | hollow | 0.323..1.447 | 0.1..0.3 | -0.29..0.31 | bay-divider-right,side-right,handle-3 |
| @part | kitchen-base/2900x870x620/closed | handle-3 | box | 0.805..0.965 | 0.194..0.206 | 0.294..0.31 | drawer-3 |
| @part | kitchen-base/2900x870x620/closed | drawer-4 | hollow | 0.323..1.447 | 0.34..0.54 | -0.29..0.31 | bay-divider-right,side-right,handle-4 |
| @part | kitchen-base/2900x870x620/closed | handle-4 | box | 0.805..0.965 | 0.434..0.446 | 0.294..0.31 | drawer-4 |
| @part | kitchen-base/2900x870x620/closed | drawer-5 | hollow | 0.323..1.447 | 0.58..0.78 | -0.29..0.31 | bay-divider-right,side-right,handle-5 |
| @part | kitchen-base/2900x870x620/closed | handle-5 | box | 0.805..0.965 | 0.674..0.686 | 0.294..0.31 | drawer-5 |

@inventory media/2000x440x350/closed: back, bottom, top, side-left, side-right, toe, fixed-front, bay-divider-left, bay-divider-right, drawer-0, handle-0, drawer-1, handle-1

@void media/2000x440x350/closed: fixed-front, -0.16..0.16, 0.098..0.422, 0.152..0.175
@void media/2000x440x350/closed: fixed-front, -1..-0.16, 0.187..0.373, 0.152..0.175
@void media/2000x440x350/closed: drawer-0, -0.66..-0.5, 0.274..0.286, 0.159..0.175
@void media/2000x440x350/closed: fixed-front, 0.16..1, 0.187..0.373, 0.152..0.175
@void media/2000x440x350/closed: drawer-1, 0.5..0.66, 0.274..0.286, 0.159..0.175
@piece media/2000x440x350/closed: drawer-0, -0.997..-0.163, 0.19..0.37, 0.157..0.175
@piece media/2000x440x350/closed: drawer-0, -0.982..-0.178, 0.205..0.217, -0.155..0.157
@piece media/2000x440x350/closed: drawer-0, -0.982..-0.97, 0.217..0.36, -0.155..0.157
@piece media/2000x440x350/closed: drawer-0, -0.19..-0.178, 0.217..0.36, -0.155..0.157
@piece media/2000x440x350/closed: drawer-0, -0.97..-0.19, 0.217..0.36, -0.155..-0.143
@piece media/2000x440x350/closed: drawer-1, 0.163..0.997, 0.19..0.37, 0.157..0.175
@piece media/2000x440x350/closed: drawer-1, 0.178..0.982, 0.205..0.217, -0.155..0.157
@piece media/2000x440x350/closed: drawer-1, 0.178..0.19, 0.217..0.36, -0.155..0.157
@piece media/2000x440x350/closed: drawer-1, 0.97..0.982, 0.217..0.36, -0.155..0.157
@piece media/2000x440x350/closed: drawer-1, 0.19..0.97, 0.217..0.36, -0.155..-0.143
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | media/2000x440x350/closed | * | bounds | -1..1 | 0..0.44 | -0.175..0.175 | - |
| @part | media/2000x440x350/closed | back | box | -1..1 | 0.08..0.422 | -0.175..-0.163 | toe,bottom,top |
| @part | media/2000x440x350/closed | bottom | box | -1..1 | 0.08..0.098 | -0.163..0.152 | back,side-left,side-right |
| @part | media/2000x440x350/closed | top | box | -1..1 | 0.422..0.44 | -0.175..0.152 | back,side-left,side-right |
| @part | media/2000x440x350/closed | side-left | box | -1..-0.982 | 0.098..0.422 | -0.163..0.152 | back,bottom,top |
| @part | media/2000x440x350/closed | side-right | box | 0.982..1 | 0.098..0.422 | -0.163..0.152 | back,bottom,top |
| @part | media/2000x440x350/closed | toe | box | -1..1 | 0..0.08 | -0.175..0.125 | ground,back,bottom |
| @part | media/2000x440x350/closed | fixed-front | box | -1..1 | 0.08..0.422 | 0.152..0.175 | side-left,side-right |
| @part | media/2000x440x350/closed | bay-divider-left | box | -0.178..-0.16 | 0.098..0.422 | -0.163..0.152 | bottom,top,back |
| @part | media/2000x440x350/closed | bay-divider-right | box | 0.16..0.178 | 0.098..0.422 | -0.163..0.152 | bottom,top,back |
| @part | media/2000x440x350/closed | drawer-0 | hollow | -0.997..-0.163 | 0.19..0.37 | -0.155..0.175 | side-left,bay-divider-left,handle-0 |
| @part | media/2000x440x350/closed | handle-0 | box | -0.66..-0.5 | 0.274..0.286 | 0.159..0.175 | drawer-0 |
| @part | media/2000x440x350/closed | drawer-1 | hollow | 0.163..0.997 | 0.19..0.37 | -0.155..0.175 | bay-divider-right,side-right,handle-1 |
| @part | media/2000x440x350/closed | handle-1 | box | 0.5..0.66 | 0.274..0.286 | 0.159..0.175 | drawer-1 |

@inventory nightstand/500x460x460/closed: back, bottom, top, side-left, side-right, toe, fixed-front, drawer-0, runner-0-left, runner-0-right, handle-0, drawer-1, runner-1-left, runner-1-right, handle-1

@void nightstand/500x460x460/closed: fixed-front, -0.247..0.247, 0.087..0.233, 0.207..0.23
@void nightstand/500x460x460/closed: drawer-0, -0.08..0.08, 0.154..0.166, 0.214..0.23
@void nightstand/500x460x460/closed: fixed-front, -0.247..0.247, 0.267..0.413, 0.207..0.23
@void nightstand/500x460x460/closed: drawer-1, -0.08..0.08, 0.334..0.346, 0.214..0.23
@piece nightstand/500x460x460/closed: drawer-0, -0.244..0.244, 0.09..0.23, 0.212..0.23
@piece nightstand/500x460x460/closed: drawer-0, -0.229..0.229, 0.105..0.117, -0.21..0.212
@piece nightstand/500x460x460/closed: drawer-0, -0.229..-0.217, 0.117..0.22, -0.21..0.212
@piece nightstand/500x460x460/closed: drawer-0, 0.217..0.229, 0.117..0.22, -0.21..0.212
@piece nightstand/500x460x460/closed: drawer-0, -0.217..0.217, 0.117..0.22, -0.21..-0.198
@piece nightstand/500x460x460/closed: drawer-1, -0.244..0.244, 0.27..0.41, 0.212..0.23
@piece nightstand/500x460x460/closed: drawer-1, -0.229..0.229, 0.285..0.297, -0.21..0.212
@piece nightstand/500x460x460/closed: drawer-1, -0.229..-0.217, 0.297..0.4, -0.21..0.212
@piece nightstand/500x460x460/closed: drawer-1, 0.217..0.229, 0.297..0.4, -0.21..0.212
@piece nightstand/500x460x460/closed: drawer-1, -0.217..0.217, 0.297..0.4, -0.21..-0.198
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | nightstand/500x460x460/closed | * | bounds | -0.25..0.25 | 0..0.46 | -0.23..0.23 | - |
| @part | nightstand/500x460x460/closed | back | box | -0.25..0.25 | 0.08..0.442 | -0.23..-0.218 | toe,bottom,top |
| @part | nightstand/500x460x460/closed | bottom | box | -0.25..0.25 | 0.08..0.098 | -0.218..0.207 | back,side-left,side-right |
| @part | nightstand/500x460x460/closed | top | box | -0.25..0.25 | 0.442..0.46 | -0.23..0.207 | back,side-left,side-right |
| @part | nightstand/500x460x460/closed | side-left | box | -0.25..-0.232 | 0.098..0.442 | -0.218..0.207 | back,bottom,top |
| @part | nightstand/500x460x460/closed | side-right | box | 0.232..0.25 | 0.098..0.442 | -0.218..0.207 | back,bottom,top |
| @part | nightstand/500x460x460/closed | toe | box | -0.25..0.25 | 0..0.08 | -0.23..0.18 | ground,back,bottom |
| @part | nightstand/500x460x460/closed | fixed-front | box | -0.25..0.25 | 0.08..0.442 | 0.207..0.23 | side-left,side-right |
| @part | nightstand/500x460x460/closed | drawer-0 | hollow | -0.244..0.244 | 0.09..0.23 | -0.21..0.23 | runner-0-left,runner-0-right,handle-0 |
| @part | nightstand/500x460x460/closed | runner-0-left | box | -0.232..-0.229 | 0.117..0.129 | -0.21..0.207 | side-left,drawer-0 |
| @part | nightstand/500x460x460/closed | runner-0-right | box | 0.229..0.232 | 0.117..0.129 | -0.21..0.207 | side-right,drawer-0 |
| @part | nightstand/500x460x460/closed | handle-0 | box | -0.08..0.08 | 0.154..0.166 | 0.214..0.23 | drawer-0 |
| @part | nightstand/500x460x460/closed | drawer-1 | hollow | -0.244..0.244 | 0.27..0.41 | -0.21..0.23 | runner-1-left,runner-1-right,handle-1 |
| @part | nightstand/500x460x460/closed | runner-1-left | box | -0.232..-0.229 | 0.297..0.309 | -0.21..0.207 | side-left,drawer-1 |
| @part | nightstand/500x460x460/closed | runner-1-right | box | 0.229..0.232 | 0.297..0.309 | -0.21..0.207 | side-right,drawer-1 |
| @part | nightstand/500x460x460/closed | handle-1 | box | -0.08..0.08 | 0.334..0.346 | 0.214..0.23 | drawer-1 |

@inventory open-shelf/1100x2600x500/open: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, shelf-7

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | open-shelf/1100x2600x500/open | * | bounds | -0.55..0.55 | 0..2.6 | -0.25..0.25 | - |
| @part | open-shelf/1100x2600x500/open | back | box | -0.55..0.55 | 0.08..2.582 | -0.25..-0.238 | toe,bottom,top |
| @part | open-shelf/1100x2600x500/open | bottom | box | -0.55..0.55 | 0.08..0.098 | -0.238..0.25 | back,side-left,side-right |
| @part | open-shelf/1100x2600x500/open | top | box | -0.55..0.55 | 2.582..2.6 | -0.25..0.25 | back,side-left,side-right |
| @part | open-shelf/1100x2600x500/open | side-left | box | -0.55..-0.532 | 0.098..2.582 | -0.238..0.25 | back,bottom,top |
| @part | open-shelf/1100x2600x500/open | side-right | box | 0.532..0.55 | 0.098..2.582 | -0.238..0.25 | back,bottom,top |
| @part | open-shelf/1100x2600x500/open | toe | box | -0.55..0.55 | 0..0.08 | -0.25..0.2 | ground,back,bottom |
| @part | open-shelf/1100x2600x500/open | shelf-1 | box | -0.532..0.532 | 0.346..0.364 | -0.238..0.25 | side-left,side-right,back |
| @part | open-shelf/1100x2600x500/open | shelf-2 | box | -0.532..0.532 | 0.661..0.679 | -0.238..0.25 | side-left,side-right,back |
| @part | open-shelf/1100x2600x500/open | shelf-3 | box | -0.532..0.532 | 0.976..0.994 | -0.238..0.25 | side-left,side-right,back |
| @part | open-shelf/1100x2600x500/open | shelf-4 | box | -0.532..0.532 | 1.291..1.309 | -0.238..0.25 | side-left,side-right,back |
| @part | open-shelf/1100x2600x500/open | shelf-5 | box | -0.532..0.532 | 1.606..1.624 | -0.238..0.25 | side-left,side-right,back |
| @part | open-shelf/1100x2600x500/open | shelf-6 | box | -0.532..0.532 | 1.921..1.939 | -0.238..0.25 | side-left,side-right,back |
| @part | open-shelf/1100x2600x500/open | shelf-7 | box | -0.532..0.532 | 2.236..2.254 | -0.238..0.25 | side-left,side-right,back |

@inventory open-shelf/1550x2500x500/open: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, shelf-7

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | open-shelf/1550x2500x500/open | * | bounds | -0.775..0.775 | 0..2.5 | -0.25..0.25 | - |
| @part | open-shelf/1550x2500x500/open | back | box | -0.775..0.775 | 0.08..2.482 | -0.25..-0.238 | toe,bottom,top |
| @part | open-shelf/1550x2500x500/open | bottom | box | -0.775..0.775 | 0.08..0.098 | -0.238..0.25 | back,side-left,side-right |
| @part | open-shelf/1550x2500x500/open | top | box | -0.775..0.775 | 2.482..2.5 | -0.25..0.25 | back,side-left,side-right |
| @part | open-shelf/1550x2500x500/open | side-left | box | -0.775..-0.757 | 0.098..2.482 | -0.238..0.25 | back,bottom,top |
| @part | open-shelf/1550x2500x500/open | side-right | box | 0.757..0.775 | 0.098..2.482 | -0.238..0.25 | back,bottom,top |
| @part | open-shelf/1550x2500x500/open | toe | box | -0.775..0.775 | 0..0.08 | -0.25..0.2 | ground,back,bottom |
| @part | open-shelf/1550x2500x500/open | shelf-1 | box | -0.757..0.757 | 0.3335..0.3515 | -0.238..0.25 | side-left,side-right,back |
| @part | open-shelf/1550x2500x500/open | shelf-2 | box | -0.757..0.757 | 0.636..0.654 | -0.238..0.25 | side-left,side-right,back |
| @part | open-shelf/1550x2500x500/open | shelf-3 | box | -0.757..0.757 | 0.9385..0.9565 | -0.238..0.25 | side-left,side-right,back |
| @part | open-shelf/1550x2500x500/open | shelf-4 | box | -0.757..0.757 | 1.241..1.259 | -0.238..0.25 | side-left,side-right,back |
| @part | open-shelf/1550x2500x500/open | shelf-5 | box | -0.757..0.757 | 1.5435..1.5615 | -0.238..0.25 | side-left,side-right,back |
| @part | open-shelf/1550x2500x500/open | shelf-6 | box | -0.757..0.757 | 1.846..1.864 | -0.238..0.25 | side-left,side-right,back |
| @part | open-shelf/1550x2500x500/open | shelf-7 | box | -0.757..0.757 | 2.1485..2.1665 | -0.238..0.25 | side-left,side-right,back |

@inventory open-shelf/600x1100x380/open: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | open-shelf/600x1100x380/open | * | bounds | -0.3..0.3 | 0..1.1 | -0.19..0.19 | - |
| @part | open-shelf/600x1100x380/open | back | box | -0.3..0.3 | 0.08..1.082 | -0.19..-0.178 | toe,bottom,top |
| @part | open-shelf/600x1100x380/open | bottom | box | -0.3..0.3 | 0.08..0.098 | -0.178..0.19 | back,side-left,side-right |
| @part | open-shelf/600x1100x380/open | top | box | -0.3..0.3 | 1.082..1.1 | -0.19..0.19 | back,side-left,side-right |
| @part | open-shelf/600x1100x380/open | side-left | box | -0.3..-0.282 | 0.098..1.082 | -0.178..0.19 | back,bottom,top |
| @part | open-shelf/600x1100x380/open | side-right | box | 0.282..0.3 | 0.098..1.082 | -0.178..0.19 | back,bottom,top |
| @part | open-shelf/600x1100x380/open | toe | box | -0.3..0.3 | 0..0.08 | -0.19..0.14 | ground,back,bottom |
| @part | open-shelf/600x1100x380/open | shelf-1 | box | -0.282..0.282 | 0.371..0.389 | -0.178..0.19 | side-left,side-right,back |
| @part | open-shelf/600x1100x380/open | shelf-2 | box | -0.282..0.282 | 0.711..0.729 | -0.178..0.19 | side-left,side-right,back |

@inventory open-shelf/750x1200x400/open: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | open-shelf/750x1200x400/open | * | bounds | -0.375..0.375 | 0..1.2 | -0.2..0.2 | - |
| @part | open-shelf/750x1200x400/open | back | box | -0.375..0.375 | 0.08..1.182 | -0.2..-0.188 | toe,bottom,top |
| @part | open-shelf/750x1200x400/open | bottom | box | -0.375..0.375 | 0.08..0.098 | -0.188..0.2 | back,side-left,side-right |
| @part | open-shelf/750x1200x400/open | top | box | -0.375..0.375 | 1.182..1.2 | -0.2..0.2 | back,side-left,side-right |
| @part | open-shelf/750x1200x400/open | side-left | box | -0.375..-0.357 | 0.098..1.182 | -0.188..0.2 | back,bottom,top |
| @part | open-shelf/750x1200x400/open | side-right | box | 0.357..0.375 | 0.098..1.182 | -0.188..0.2 | back,bottom,top |
| @part | open-shelf/750x1200x400/open | toe | box | -0.375..0.375 | 0..0.08 | -0.2..0.15 | ground,back,bottom |
| @part | open-shelf/750x1200x400/open | shelf-1 | box | -0.357..0.357 | 0.311..0.329 | -0.188..0.2 | side-left,side-right,back |
| @part | open-shelf/750x1200x400/open | shelf-2 | box | -0.357..0.357 | 0.591..0.609 | -0.188..0.2 | side-left,side-right,back |
| @part | open-shelf/750x1200x400/open | shelf-3 | box | -0.357..0.357 | 0.871..0.889 | -0.188..0.2 | side-left,side-right,back |

@inventory open-shelf/850x2400x450/open: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | open-shelf/850x2400x450/open | * | bounds | -0.425..0.425 | 0..2.4 | -0.225..0.225 | - |
| @part | open-shelf/850x2400x450/open | back | box | -0.425..0.425 | 0.08..2.382 | -0.225..-0.213 | toe,bottom,top |
| @part | open-shelf/850x2400x450/open | bottom | box | -0.425..0.425 | 0.08..0.098 | -0.213..0.225 | back,side-left,side-right |
| @part | open-shelf/850x2400x450/open | top | box | -0.425..0.425 | 2.382..2.4 | -0.225..0.225 | back,side-left,side-right |
| @part | open-shelf/850x2400x450/open | side-left | box | -0.425..-0.407 | 0.098..2.382 | -0.213..0.225 | back,bottom,top |
| @part | open-shelf/850x2400x450/open | side-right | box | 0.407..0.425 | 0.098..2.382 | -0.213..0.225 | back,bottom,top |
| @part | open-shelf/850x2400x450/open | toe | box | -0.425..0.425 | 0..0.08 | -0.225..0.175 | ground,back,bottom |
| @part | open-shelf/850x2400x450/open | shelf-1 | box | -0.407..0.407 | 0.362429..0.380429 | -0.213..0.225 | side-left,side-right,back |
| @part | open-shelf/850x2400x450/open | shelf-2 | box | -0.407..0.407 | 0.693857..0.711857 | -0.213..0.225 | side-left,side-right,back |
| @part | open-shelf/850x2400x450/open | shelf-3 | box | -0.407..0.407 | 1.025286..1.043286 | -0.213..0.225 | side-left,side-right,back |
| @part | open-shelf/850x2400x450/open | shelf-4 | box | -0.407..0.407 | 1.356714..1.374714 | -0.213..0.225 | side-left,side-right,back |
| @part | open-shelf/850x2400x450/open | shelf-5 | box | -0.407..0.407 | 1.688143..1.706143 | -0.213..0.225 | side-left,side-right,back |
| @part | open-shelf/850x2400x450/open | shelf-6 | box | -0.407..0.407 | 2.019571..2.037571 | -0.213..0.225 | side-left,side-right,back |

@inventory open-shelf/950x1350x250/open: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | open-shelf/950x1350x250/open | * | bounds | -0.475..0.475 | 0..1.35 | -0.125..0.125 | - |
| @part | open-shelf/950x1350x250/open | back | box | -0.475..0.475 | 0.08..1.332 | -0.125..-0.113 | toe,bottom,top |
| @part | open-shelf/950x1350x250/open | bottom | box | -0.475..0.475 | 0.08..0.098 | -0.113..0.125 | back,side-left,side-right |
| @part | open-shelf/950x1350x250/open | top | box | -0.475..0.475 | 1.332..1.35 | -0.125..0.125 | back,side-left,side-right |
| @part | open-shelf/950x1350x250/open | side-left | box | -0.475..-0.457 | 0.098..1.332 | -0.113..0.125 | back,bottom,top |
| @part | open-shelf/950x1350x250/open | side-right | box | 0.457..0.475 | 0.098..1.332 | -0.113..0.125 | back,bottom,top |
| @part | open-shelf/950x1350x250/open | toe | box | -0.475..0.475 | 0..0.08 | -0.125..0.075 | ground,back,bottom |
| @part | open-shelf/950x1350x250/open | shelf-1 | box | -0.457..0.457 | 0.3485..0.3665 | -0.113..0.125 | side-left,side-right,back |
| @part | open-shelf/950x1350x250/open | shelf-2 | box | -0.457..0.457 | 0.666..0.684 | -0.113..0.125 | side-left,side-right,back |
| @part | open-shelf/950x1350x250/open | shelf-3 | box | -0.457..0.457 | 0.9835..1.0015 | -0.113..0.125 | side-left,side-right,back |

@inventory service/1100x2400x560/closed: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, stile-1, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1

@void service/1100x2400x560/closed: shelf-1, -0.009..0.009, 0.362429..0.380429, 0.239..0.257
@void service/1100x2400x560/closed: shelf-2, -0.009..0.009, 0.693857..0.711857, 0.239..0.257
@void service/1100x2400x560/closed: shelf-3, -0.009..0.009, 1.025286..1.043286, 0.239..0.257
@void service/1100x2400x560/closed: shelf-4, -0.009..0.009, 1.356714..1.374714, 0.239..0.257
@void service/1100x2400x560/closed: shelf-5, -0.009..0.009, 1.688143..1.706143, 0.239..0.257
@void service/1100x2400x560/closed: shelf-6, -0.009..0.009, 2.019571..2.037571, 0.239..0.257
@void service/1100x2400x560/closed: door-0, -0.542..-0.526, 0.14..0.18, 0.262..0.279
@void service/1100x2400x560/closed: door-0, -0.542..-0.526, 2.22..2.26, 0.262..0.279
@void service/1100x2400x560/closed: door-0, -0.0625..-0.0505, 1.2757..1.4357, 0.264..0.28
@void service/1100x2400x560/closed: door-1, 0.526..0.542, 0.14..0.18, 0.262..0.279
@void service/1100x2400x560/closed: door-1, 0.526..0.542, 2.22..2.26, 0.262..0.279
@void service/1100x2400x560/closed: door-1, 0.0505..0.0625, 1.2757..1.4357, 0.264..0.28
@piece service/1100x2400x560/closed: hinge-0, -0.542..-0.526, 0.14..0.18, 0.257..0.262
@piece service/1100x2400x560/closed: hinge-0, -0.542..-0.526, 0.14..0.18, 0.262..0.279
@piece service/1100x2400x560/closed: hinge-1, -0.542..-0.526, 2.22..2.26, 0.257..0.262
@piece service/1100x2400x560/closed: hinge-1, -0.542..-0.526, 2.22..2.26, 0.262..0.279
@piece service/1100x2400x560/closed: hinge-2, 0.526..0.542, 0.14..0.18, 0.257..0.262
@piece service/1100x2400x560/closed: hinge-2, 0.526..0.542, 0.14..0.18, 0.262..0.279
@piece service/1100x2400x560/closed: hinge-3, 0.526..0.542, 2.22..2.26, 0.257..0.262
@piece service/1100x2400x560/closed: hinge-3, 0.526..0.542, 2.22..2.26, 0.262..0.279
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | service/1100x2400x560/closed | * | bounds | -0.55..0.55 | 0..2.4 | -0.28..0.28 | - |
| @part | service/1100x2400x560/closed | back | box | -0.55..0.55 | 0.08..2.382 | -0.28..-0.268 | toe,bottom,top |
| @part | service/1100x2400x560/closed | bottom | box | -0.55..0.55 | 0.08..0.098 | -0.268..0.257 | back,side-left,side-right |
| @part | service/1100x2400x560/closed | top | box | -0.55..0.55 | 2.382..2.4 | -0.28..0.257 | back,side-left,side-right |
| @part | service/1100x2400x560/closed | side-left | box | -0.55..-0.532 | 0.098..2.382 | -0.268..0.257 | back,bottom,top |
| @part | service/1100x2400x560/closed | side-right | box | 0.532..0.55 | 0.098..2.382 | -0.268..0.257 | back,bottom,top |
| @part | service/1100x2400x560/closed | toe | box | -0.55..0.55 | 0..0.08 | -0.28..0.23 | ground,back,bottom |
| @part | service/1100x2400x560/closed | shelf-1 | box | -0.532..0.532 | 0.362429..0.380429 | -0.268..0.257 | side-left,side-right,back |
| @part | service/1100x2400x560/closed | shelf-2 | box | -0.532..0.532 | 0.693857..0.711857 | -0.268..0.257 | side-left,side-right,back |
| @part | service/1100x2400x560/closed | shelf-3 | box | -0.532..0.532 | 1.025286..1.043286 | -0.268..0.257 | side-left,side-right,back |
| @part | service/1100x2400x560/closed | shelf-4 | box | -0.532..0.532 | 1.356714..1.374714 | -0.268..0.257 | side-left,side-right,back |
| @part | service/1100x2400x560/closed | shelf-5 | box | -0.532..0.532 | 1.688143..1.706143 | -0.268..0.257 | side-left,side-right,back |
| @part | service/1100x2400x560/closed | shelf-6 | box | -0.532..0.532 | 2.019571..2.037571 | -0.268..0.257 | side-left,side-right,back |
| @part | service/1100x2400x560/closed | stile-1 | box | -0.009..0.009 | 0.098..2.382 | 0.239..0.257 | bottom,top |
| @part | service/1100x2400x560/closed | door-0 | box | -0.547..-0.0015 | 0.083..2.397 | 0.262..0.28 | hinge-0,hinge-1 |
| @part | service/1100x2400x560/closed | hinge-0 | box | -0.542..-0.526 | 0.14..0.18 | 0.257..0.279 | door-0,side-left |
| @part | service/1100x2400x560/closed | hinge-1 | box | -0.542..-0.526 | 2.22..2.26 | 0.257..0.279 | door-0,side-left |
| @part | service/1100x2400x560/closed | handle-0 | box | -0.0625..-0.0505 | 1.2757..1.4357 | 0.264..0.28 | door-0 |
| @part | service/1100x2400x560/closed | door-1 | box | 0.0015..0.547 | 0.083..2.397 | 0.262..0.28 | hinge-2,hinge-3 |
| @part | service/1100x2400x560/closed | hinge-2 | box | 0.526..0.542 | 0.14..0.18 | 0.257..0.279 | door-1,side-right |
| @part | service/1100x2400x560/closed | hinge-3 | box | 0.526..0.542 | 2.22..2.26 | 0.257..0.279 | door-1,side-right |
| @part | service/1100x2400x560/closed | handle-1 | box | 0.0505..0.0625 | 1.2757..1.4357 | 0.264..0.28 | door-1 |

@inventory service/1100x2400x560/open: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, stile-1, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1

@void service/1100x2400x560/open: shelf-1, -0.009..0.009, 0.362429..0.380429, 0.239..0.257
@void service/1100x2400x560/open: shelf-2, -0.009..0.009, 0.693857..0.711857, 0.239..0.257
@void service/1100x2400x560/open: shelf-3, -0.009..0.009, 1.025286..1.043286, 0.239..0.257
@void service/1100x2400x560/open: shelf-4, -0.009..0.009, 1.356714..1.374714, 0.239..0.257
@void service/1100x2400x560/open: shelf-5, -0.009..0.009, 1.688143..1.706143, 0.239..0.257
@void service/1100x2400x560/open: shelf-6, -0.009..0.009, 2.019571..2.037571, 0.239..0.257
@void service/1100x2400x560/open: door-0, -0.542..-0.525, 0.14..0.18, 0.263..0.279
@void service/1100x2400x560/open: door-0, -0.543..-0.525, 0.14..0.18, 0.258..0.279
@void service/1100x2400x560/open: door-0, -0.542..-0.525, 2.22..2.26, 0.263..0.279
@void service/1100x2400x560/open: door-0, -0.543..-0.525, 2.22..2.26, 0.258..0.279
@void service/1100x2400x560/open: door-0, -0.543..-0.527, 1.2757..1.4357, 0.7425..0.7545
@void service/1100x2400x560/open: door-1, 0.525..0.542, 0.14..0.18, 0.263..0.279
@void service/1100x2400x560/open: door-1, 0.525..0.543, 0.14..0.18, 0.258..0.279
@void service/1100x2400x560/open: door-1, 0.525..0.542, 2.22..2.26, 0.263..0.279
@void service/1100x2400x560/open: door-1, 0.525..0.543, 2.22..2.26, 0.258..0.279
@void service/1100x2400x560/open: door-1, 0.527..0.543, 1.2757..1.4357, 0.7425..0.7545
@piece service/1100x2400x560/open: hinge-0, -0.542..-0.526, 0.14..0.18, 0.257..0.262
@piece service/1100x2400x560/open: hinge-0, -0.542..-0.526, 0.14..0.18, 0.262..0.279
@piece service/1100x2400x560/open: hinge-1, -0.542..-0.526, 2.22..2.26, 0.257..0.262
@piece service/1100x2400x560/open: hinge-1, -0.542..-0.526, 2.22..2.26, 0.262..0.279
@piece service/1100x2400x560/open: hinge-2, 0.526..0.542, 0.14..0.18, 0.257..0.262
@piece service/1100x2400x560/open: hinge-2, 0.526..0.542, 0.14..0.18, 0.262..0.279
@piece service/1100x2400x560/open: hinge-3, 0.526..0.542, 2.22..2.26, 0.257..0.262
@piece service/1100x2400x560/open: hinge-3, 0.526..0.542, 2.22..2.26, 0.262..0.279
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | service/1100x2400x560/open | * | bounds | -0.55..0.55 | 0..2.4 | -0.28..0.8035 | - |
| @part | service/1100x2400x560/open | back | box | -0.55..0.55 | 0.08..2.382 | -0.28..-0.268 | toe,bottom,top |
| @part | service/1100x2400x560/open | bottom | box | -0.55..0.55 | 0.08..0.098 | -0.268..0.257 | back,side-left,side-right |
| @part | service/1100x2400x560/open | top | box | -0.55..0.55 | 2.382..2.4 | -0.28..0.257 | back,side-left,side-right |
| @part | service/1100x2400x560/open | side-left | box | -0.55..-0.532 | 0.098..2.382 | -0.268..0.257 | back,bottom,top |
| @part | service/1100x2400x560/open | side-right | box | 0.532..0.55 | 0.098..2.382 | -0.268..0.257 | back,bottom,top |
| @part | service/1100x2400x560/open | toe | box | -0.55..0.55 | 0..0.08 | -0.28..0.23 | ground,back,bottom |
| @part | service/1100x2400x560/open | shelf-1 | box | -0.532..0.532 | 0.362429..0.380429 | -0.268..0.257 | side-left,side-right,back |
| @part | service/1100x2400x560/open | shelf-2 | box | -0.532..0.532 | 0.693857..0.711857 | -0.268..0.257 | side-left,side-right,back |
| @part | service/1100x2400x560/open | shelf-3 | box | -0.532..0.532 | 1.025286..1.043286 | -0.268..0.257 | side-left,side-right,back |
| @part | service/1100x2400x560/open | shelf-4 | box | -0.532..0.532 | 1.356714..1.374714 | -0.268..0.257 | side-left,side-right,back |
| @part | service/1100x2400x560/open | shelf-5 | box | -0.532..0.532 | 1.688143..1.706143 | -0.268..0.257 | side-left,side-right,back |
| @part | service/1100x2400x560/open | shelf-6 | box | -0.532..0.532 | 2.019571..2.037571 | -0.268..0.257 | side-left,side-right,back |
| @part | service/1100x2400x560/open | stile-1 | box | -0.009..0.009 | 0.098..2.382 | 0.239..0.257 | bottom,top |
| @part | service/1100x2400x560/open | door-0 | box | -0.543..-0.525 | 0.083..2.397 | 0.258..0.8035 | hinge-0,hinge-1 |
| @part | service/1100x2400x560/open | hinge-0 | box | -0.542..-0.526 | 0.14..0.18 | 0.257..0.279 | door-0,side-left |
| @part | service/1100x2400x560/open | hinge-1 | box | -0.542..-0.526 | 2.22..2.26 | 0.257..0.279 | door-0,side-left |
| @part | service/1100x2400x560/open | handle-0 | box | -0.543..-0.527 | 1.2757..1.4357 | 0.7425..0.7545 | door-0 |
| @part | service/1100x2400x560/open | door-1 | box | 0.525..0.543 | 0.083..2.397 | 0.258..0.8035 | hinge-2,hinge-3 |
| @part | service/1100x2400x560/open | hinge-2 | box | 0.526..0.542 | 0.14..0.18 | 0.257..0.279 | door-1,side-right |
| @part | service/1100x2400x560/open | hinge-3 | box | 0.526..0.542 | 2.22..2.26 | 0.257..0.279 | door-1,side-right |
| @part | service/1100x2400x560/open | handle-1 | box | 0.527..0.543 | 1.2757..1.4357 | 0.7425..0.7545 | door-1 |

@inventory service/640x840x600/closed: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, stile-1, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1

@void service/640x840x600/closed: shelf-1, -0.009..0.009, 0.284333..0.302333, 0.259..0.277
@void service/640x840x600/closed: shelf-2, -0.009..0.009, 0.537667..0.555667, 0.259..0.277
@void service/640x840x600/closed: door-0, -0.312..-0.296, 0.14..0.18, 0.282..0.299
@void service/640x840x600/closed: door-0, -0.312..-0.296, 0.66..0.7, 0.282..0.299
@void service/640x840x600/closed: door-0, -0.0625..-0.0505, 0.4177..0.5777, 0.284..0.3
@void service/640x840x600/closed: door-1, 0.296..0.312, 0.14..0.18, 0.282..0.299
@void service/640x840x600/closed: door-1, 0.296..0.312, 0.66..0.7, 0.282..0.299
@void service/640x840x600/closed: door-1, 0.0505..0.0625, 0.4177..0.5777, 0.284..0.3
@piece service/640x840x600/closed: hinge-0, -0.312..-0.296, 0.14..0.18, 0.277..0.282
@piece service/640x840x600/closed: hinge-0, -0.312..-0.296, 0.14..0.18, 0.282..0.299
@piece service/640x840x600/closed: hinge-1, -0.312..-0.296, 0.66..0.7, 0.277..0.282
@piece service/640x840x600/closed: hinge-1, -0.312..-0.296, 0.66..0.7, 0.282..0.299
@piece service/640x840x600/closed: hinge-2, 0.296..0.312, 0.14..0.18, 0.277..0.282
@piece service/640x840x600/closed: hinge-2, 0.296..0.312, 0.14..0.18, 0.282..0.299
@piece service/640x840x600/closed: hinge-3, 0.296..0.312, 0.66..0.7, 0.277..0.282
@piece service/640x840x600/closed: hinge-3, 0.296..0.312, 0.66..0.7, 0.282..0.299
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | service/640x840x600/closed | * | bounds | -0.32..0.32 | 0..0.84 | -0.3..0.3 | - |
| @part | service/640x840x600/closed | back | box | -0.32..0.32 | 0.08..0.822 | -0.3..-0.288 | toe,bottom,top |
| @part | service/640x840x600/closed | bottom | box | -0.32..0.32 | 0.08..0.098 | -0.288..0.277 | back,side-left,side-right |
| @part | service/640x840x600/closed | top | box | -0.32..0.32 | 0.822..0.84 | -0.3..0.277 | back,side-left,side-right |
| @part | service/640x840x600/closed | side-left | box | -0.32..-0.302 | 0.098..0.822 | -0.288..0.277 | back,bottom,top |
| @part | service/640x840x600/closed | side-right | box | 0.302..0.32 | 0.098..0.822 | -0.288..0.277 | back,bottom,top |
| @part | service/640x840x600/closed | toe | box | -0.32..0.32 | 0..0.08 | -0.3..0.25 | ground,back,bottom |
| @part | service/640x840x600/closed | shelf-1 | box | -0.302..0.302 | 0.284333..0.302333 | -0.288..0.277 | side-left,side-right,back |
| @part | service/640x840x600/closed | shelf-2 | box | -0.302..0.302 | 0.537667..0.555667 | -0.288..0.277 | side-left,side-right,back |
| @part | service/640x840x600/closed | stile-1 | box | -0.009..0.009 | 0.098..0.822 | 0.259..0.277 | bottom,top |
| @part | service/640x840x600/closed | door-0 | box | -0.317..-0.0015 | 0.083..0.837 | 0.282..0.3 | hinge-0,hinge-1 |
| @part | service/640x840x600/closed | hinge-0 | box | -0.312..-0.296 | 0.14..0.18 | 0.277..0.299 | door-0,side-left |
| @part | service/640x840x600/closed | hinge-1 | box | -0.312..-0.296 | 0.66..0.7 | 0.277..0.299 | door-0,side-left |
| @part | service/640x840x600/closed | handle-0 | box | -0.0625..-0.0505 | 0.4177..0.5777 | 0.284..0.3 | door-0 |
| @part | service/640x840x600/closed | door-1 | box | 0.0015..0.317 | 0.083..0.837 | 0.282..0.3 | hinge-2,hinge-3 |
| @part | service/640x840x600/closed | hinge-2 | box | 0.296..0.312 | 0.14..0.18 | 0.277..0.299 | door-1,side-right |
| @part | service/640x840x600/closed | hinge-3 | box | 0.296..0.312 | 0.66..0.7 | 0.277..0.299 | door-1,side-right |
| @part | service/640x840x600/closed | handle-1 | box | 0.0505..0.0625 | 0.4177..0.5777 | 0.284..0.3 | door-1 |

@inventory service/640x840x600/open: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, stile-1, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1

@void service/640x840x600/open: shelf-1, -0.009..0.009, 0.284333..0.302333, 0.259..0.277
@void service/640x840x600/open: shelf-2, -0.009..0.009, 0.537667..0.555667, 0.259..0.277
@void service/640x840x600/open: door-0, -0.312..-0.295, 0.14..0.18, 0.283..0.299
@void service/640x840x600/open: door-0, -0.313..-0.295, 0.14..0.18, 0.278..0.299
@void service/640x840x600/open: door-0, -0.312..-0.295, 0.66..0.7, 0.283..0.299
@void service/640x840x600/open: door-0, -0.313..-0.295, 0.66..0.7, 0.278..0.299
@void service/640x840x600/open: door-0, -0.313..-0.297, 0.4177..0.5777, 0.5325..0.5445
@void service/640x840x600/open: door-1, 0.295..0.312, 0.14..0.18, 0.283..0.299
@void service/640x840x600/open: door-1, 0.295..0.313, 0.14..0.18, 0.278..0.299
@void service/640x840x600/open: door-1, 0.295..0.312, 0.66..0.7, 0.283..0.299
@void service/640x840x600/open: door-1, 0.295..0.313, 0.66..0.7, 0.278..0.299
@void service/640x840x600/open: door-1, 0.297..0.313, 0.4177..0.5777, 0.5325..0.5445
@piece service/640x840x600/open: hinge-0, -0.312..-0.296, 0.14..0.18, 0.277..0.282
@piece service/640x840x600/open: hinge-0, -0.312..-0.296, 0.14..0.18, 0.282..0.299
@piece service/640x840x600/open: hinge-1, -0.312..-0.296, 0.66..0.7, 0.277..0.282
@piece service/640x840x600/open: hinge-1, -0.312..-0.296, 0.66..0.7, 0.282..0.299
@piece service/640x840x600/open: hinge-2, 0.296..0.312, 0.14..0.18, 0.277..0.282
@piece service/640x840x600/open: hinge-2, 0.296..0.312, 0.14..0.18, 0.282..0.299
@piece service/640x840x600/open: hinge-3, 0.296..0.312, 0.66..0.7, 0.277..0.282
@piece service/640x840x600/open: hinge-3, 0.296..0.312, 0.66..0.7, 0.282..0.299
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | service/640x840x600/open | * | bounds | -0.32..0.32 | 0..0.84 | -0.3..0.5935 | - |
| @part | service/640x840x600/open | back | box | -0.32..0.32 | 0.08..0.822 | -0.3..-0.288 | toe,bottom,top |
| @part | service/640x840x600/open | bottom | box | -0.32..0.32 | 0.08..0.098 | -0.288..0.277 | back,side-left,side-right |
| @part | service/640x840x600/open | top | box | -0.32..0.32 | 0.822..0.84 | -0.3..0.277 | back,side-left,side-right |
| @part | service/640x840x600/open | side-left | box | -0.32..-0.302 | 0.098..0.822 | -0.288..0.277 | back,bottom,top |
| @part | service/640x840x600/open | side-right | box | 0.302..0.32 | 0.098..0.822 | -0.288..0.277 | back,bottom,top |
| @part | service/640x840x600/open | toe | box | -0.32..0.32 | 0..0.08 | -0.3..0.25 | ground,back,bottom |
| @part | service/640x840x600/open | shelf-1 | box | -0.302..0.302 | 0.284333..0.302333 | -0.288..0.277 | side-left,side-right,back |
| @part | service/640x840x600/open | shelf-2 | box | -0.302..0.302 | 0.537667..0.555667 | -0.288..0.277 | side-left,side-right,back |
| @part | service/640x840x600/open | stile-1 | box | -0.009..0.009 | 0.098..0.822 | 0.259..0.277 | bottom,top |
| @part | service/640x840x600/open | door-0 | box | -0.313..-0.295 | 0.083..0.837 | 0.278..0.5935 | hinge-0,hinge-1 |
| @part | service/640x840x600/open | hinge-0 | box | -0.312..-0.296 | 0.14..0.18 | 0.277..0.299 | door-0,side-left |
| @part | service/640x840x600/open | hinge-1 | box | -0.312..-0.296 | 0.66..0.7 | 0.277..0.299 | door-0,side-left |
| @part | service/640x840x600/open | handle-0 | box | -0.313..-0.297 | 0.4177..0.5777 | 0.5325..0.5445 | door-0 |
| @part | service/640x840x600/open | door-1 | box | 0.295..0.313 | 0.083..0.837 | 0.278..0.5935 | hinge-2,hinge-3 |
| @part | service/640x840x600/open | hinge-2 | box | 0.296..0.312 | 0.14..0.18 | 0.277..0.299 | door-1,side-right |
| @part | service/640x840x600/open | hinge-3 | box | 0.296..0.312 | 0.66..0.7 | 0.277..0.299 | door-1,side-right |
| @part | service/640x840x600/open | handle-1 | box | 0.297..0.313 | 0.4177..0.5777 | 0.5325..0.5445 | door-1 |

@inventory tall/1300x2650x600/closed: back, bottom, top, side-left, side-right, toe, divider, rod, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, shelf-7, stile-1, stile-2, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1, door-2, hinge-4, hinge-5, handle-2

@void tall/1300x2650x600/closed: shelf-1, 0.207167..0.225167, 0.35225..0.37025, 0.259..0.277
@void tall/1300x2650x600/closed: shelf-2, 0.207167..0.225167, 0.6735..0.6915, 0.259..0.277
@void tall/1300x2650x600/closed: shelf-3, 0.207167..0.225167, 0.99475..1.01275, 0.259..0.277
@void tall/1300x2650x600/closed: shelf-4, 0.207167..0.225167, 1.316..1.334, 0.259..0.277
@void tall/1300x2650x600/closed: shelf-5, 0.207167..0.225167, 1.63725..1.65525, 0.259..0.277
@void tall/1300x2650x600/closed: shelf-6, 0.207167..0.225167, 1.9585..1.9765, 0.259..0.277
@void tall/1300x2650x600/closed: shelf-7, 0.207167..0.225167, 2.27975..2.29775, 0.259..0.277
@void tall/1300x2650x600/closed: door-0, -0.642..-0.626, 0.14..0.18, 0.282..0.299
@void tall/1300x2650x600/closed: door-0, -0.642..-0.626, 2.47..2.51, 0.282..0.299
@void tall/1300x2650x600/closed: door-0, -0.278667..-0.266667, 1.4132..1.5732, 0.284..0.3
@void tall/1300x2650x600/closed: door-1, 0.193667..0.209667, 0.14..0.18, 0.282..0.299
@void tall/1300x2650x600/closed: door-1, 0.193667..0.209667, 2.47..2.51, 0.282..0.299
@void tall/1300x2650x600/closed: door-1, -0.165667..-0.153667, 1.4132..1.5732, 0.284..0.3
@void tall/1300x2650x600/closed: door-2, 0.222667..0.238667, 0.14..0.18, 0.282..0.299
@void tall/1300x2650x600/closed: door-2, 0.222667..0.238667, 2.47..2.51, 0.282..0.299
@void tall/1300x2650x600/closed: door-2, 0.586..0.598, 1.4132..1.5732, 0.284..0.3
@piece tall/1300x2650x600/closed: hinge-0, -0.642..-0.626, 0.14..0.18, 0.277..0.282
@piece tall/1300x2650x600/closed: hinge-0, -0.642..-0.626, 0.14..0.18, 0.282..0.299
@piece tall/1300x2650x600/closed: hinge-1, -0.642..-0.626, 2.47..2.51, 0.277..0.282
@piece tall/1300x2650x600/closed: hinge-1, -0.642..-0.626, 2.47..2.51, 0.282..0.299
@piece tall/1300x2650x600/closed: hinge-2, 0.193667..0.209667, 0.14..0.18, 0.277..0.282
@piece tall/1300x2650x600/closed: hinge-2, 0.193667..0.209667, 0.14..0.18, 0.282..0.299
@piece tall/1300x2650x600/closed: hinge-3, 0.193667..0.209667, 2.47..2.51, 0.277..0.282
@piece tall/1300x2650x600/closed: hinge-3, 0.193667..0.209667, 2.47..2.51, 0.282..0.299
@piece tall/1300x2650x600/closed: hinge-4, 0.222667..0.238667, 0.14..0.18, 0.277..0.282
@piece tall/1300x2650x600/closed: hinge-4, 0.222667..0.238667, 0.14..0.18, 0.282..0.299
@piece tall/1300x2650x600/closed: hinge-5, 0.222667..0.238667, 2.47..2.51, 0.277..0.282
@piece tall/1300x2650x600/closed: hinge-5, 0.222667..0.238667, 2.47..2.51, 0.282..0.299
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | tall/1300x2650x600/closed | * | bounds | -0.65..0.65 | 0..2.65 | -0.3..0.3 | - |
| @part | tall/1300x2650x600/closed | back | box | -0.65..0.65 | 0.08..2.632 | -0.3..-0.288 | toe,bottom,top |
| @part | tall/1300x2650x600/closed | bottom | box | -0.65..0.65 | 0.08..0.098 | -0.288..0.277 | back,side-left,side-right |
| @part | tall/1300x2650x600/closed | top | box | -0.65..0.65 | 2.632..2.65 | -0.3..0.277 | back,side-left,side-right |
| @part | tall/1300x2650x600/closed | side-left | box | -0.65..-0.632 | 0.098..2.632 | -0.288..0.277 | back,bottom,top |
| @part | tall/1300x2650x600/closed | side-right | box | 0.632..0.65 | 0.098..2.632 | -0.288..0.277 | back,bottom,top |
| @part | tall/1300x2650x600/closed | toe | box | -0.65..0.65 | 0..0.08 | -0.3..0.25 | ground,back,bottom |
| @part | tall/1300x2650x600/closed | divider | box | 0.13..0.148 | 0.098..2.632 | -0.288..0.282 | bottom,top |
| @part | tall/1300x2650x600/closed | rod | cylinder | -0.632..0.13 | 2.2875..2.3125 | -0.018..0.007 | side-left,divider |
| @part | tall/1300x2650x600/closed | shelf-1 | box | 0.148..0.632 | 0.35225..0.37025 | -0.288..0.277 | divider,side-right,back |
| @part | tall/1300x2650x600/closed | shelf-2 | box | 0.148..0.632 | 0.6735..0.6915 | -0.288..0.277 | divider,side-right,back |
| @part | tall/1300x2650x600/closed | shelf-3 | box | 0.148..0.632 | 0.99475..1.01275 | -0.288..0.277 | divider,side-right,back |
| @part | tall/1300x2650x600/closed | shelf-4 | box | 0.148..0.632 | 1.316..1.334 | -0.288..0.277 | divider,side-right,back |
| @part | tall/1300x2650x600/closed | shelf-5 | box | 0.148..0.632 | 1.63725..1.65525 | -0.288..0.277 | divider,side-right,back |
| @part | tall/1300x2650x600/closed | shelf-6 | box | 0.148..0.632 | 1.9585..1.9765 | -0.288..0.277 | divider,side-right,back |
| @part | tall/1300x2650x600/closed | shelf-7 | box | 0.148..0.632 | 2.27975..2.29775 | -0.288..0.277 | divider,side-right,back |
| @part | tall/1300x2650x600/closed | stile-1 | box | -0.225167..-0.207167 | 0.098..2.632 | 0.259..0.277 | bottom,top |
| @part | tall/1300x2650x600/closed | stile-2 | box | 0.207167..0.225167 | 0.098..2.632 | 0.259..0.277 | bottom,top |
| @part | tall/1300x2650x600/closed | door-0 | box | -0.647..-0.217667 | 0.083..2.647 | 0.282..0.3 | hinge-0,hinge-1 |
| @part | tall/1300x2650x600/closed | hinge-0 | box | -0.642..-0.626 | 0.14..0.18 | 0.277..0.299 | door-0,side-left |
| @part | tall/1300x2650x600/closed | hinge-1 | box | -0.642..-0.626 | 2.47..2.51 | 0.277..0.299 | door-0,side-left |
| @part | tall/1300x2650x600/closed | handle-0 | box | -0.278667..-0.266667 | 1.4132..1.5732 | 0.284..0.3 | door-0 |
| @part | tall/1300x2650x600/closed | door-1 | box | -0.214667..0.214667 | 0.083..2.647 | 0.282..0.3 | hinge-2,hinge-3 |
| @part | tall/1300x2650x600/closed | hinge-2 | box | 0.193667..0.209667 | 0.14..0.18 | 0.277..0.299 | door-1,stile-2 |
| @part | tall/1300x2650x600/closed | hinge-3 | box | 0.193667..0.209667 | 2.47..2.51 | 0.277..0.299 | door-1,stile-2 |
| @part | tall/1300x2650x600/closed | handle-1 | box | -0.165667..-0.153667 | 1.4132..1.5732 | 0.284..0.3 | door-1 |
| @part | tall/1300x2650x600/closed | door-2 | box | 0.217667..0.647 | 0.083..2.647 | 0.282..0.3 | hinge-4,hinge-5 |
| @part | tall/1300x2650x600/closed | hinge-4 | box | 0.222667..0.238667 | 0.14..0.18 | 0.277..0.299 | door-2,stile-2 |
| @part | tall/1300x2650x600/closed | hinge-5 | box | 0.222667..0.238667 | 2.47..2.51 | 0.277..0.299 | door-2,stile-2 |
| @part | tall/1300x2650x600/closed | handle-2 | box | 0.586..0.598 | 1.4132..1.5732 | 0.284..0.3 | door-2 |

@inventory tall/1300x2650x600/open: back, bottom, top, side-left, side-right, toe, divider, rod, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, shelf-7, stile-1, stile-2, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1, door-2, hinge-4, hinge-5, handle-2

@void tall/1300x2650x600/open: shelf-1, 0.207167..0.225167, 0.35225..0.37025, 0.259..0.277
@void tall/1300x2650x600/open: shelf-2, 0.207167..0.225167, 0.6735..0.6915, 0.259..0.277
@void tall/1300x2650x600/open: shelf-3, 0.207167..0.225167, 0.99475..1.01275, 0.259..0.277
@void tall/1300x2650x600/open: shelf-4, 0.207167..0.225167, 1.316..1.334, 0.259..0.277
@void tall/1300x2650x600/open: shelf-5, 0.207167..0.225167, 1.63725..1.65525, 0.259..0.277
@void tall/1300x2650x600/open: shelf-6, 0.207167..0.225167, 1.9585..1.9765, 0.259..0.277
@void tall/1300x2650x600/open: shelf-7, 0.207167..0.225167, 2.27975..2.29775, 0.259..0.277
@void tall/1300x2650x600/open: door-0, -0.642..-0.625, 0.14..0.18, 0.283..0.299
@void tall/1300x2650x600/open: door-0, -0.643..-0.625, 0.14..0.18, 0.278..0.299
@void tall/1300x2650x600/open: door-0, -0.642..-0.625, 2.47..2.51, 0.283..0.299
@void tall/1300x2650x600/open: door-0, -0.643..-0.625, 2.47..2.51, 0.278..0.299
@void tall/1300x2650x600/open: door-0, -0.643..-0.627, 1.4132..1.5732, 0.646333..0.658333
@void tall/1300x2650x600/open: door-1, 0.192667..0.209667, 0.14..0.18, 0.283..0.299
@void tall/1300x2650x600/open: door-1, 0.192667..0.210667, 0.14..0.18, 0.278..0.299
@void tall/1300x2650x600/open: door-1, 0.192667..0.209667, 2.47..2.51, 0.283..0.299
@void tall/1300x2650x600/open: door-1, 0.192667..0.210667, 2.47..2.51, 0.278..0.299
@void tall/1300x2650x600/open: door-1, 0.194667..0.210667, 1.4132..1.5732, 0.646334..0.658334
@void tall/1300x2650x600/open: door-2, 0.222667..0.239667, 0.14..0.18, 0.283..0.299
@void tall/1300x2650x600/open: door-2, 0.221667..0.239667, 0.14..0.18, 0.278..0.299
@void tall/1300x2650x600/open: door-2, 0.222667..0.239667, 2.47..2.51, 0.283..0.299
@void tall/1300x2650x600/open: door-2, 0.221667..0.239667, 2.47..2.51, 0.278..0.299
@void tall/1300x2650x600/open: door-2, 0.221667..0.237667, 1.4132..1.5732, 0.646333..0.658333
@piece tall/1300x2650x600/open: hinge-0, -0.642..-0.626, 0.14..0.18, 0.277..0.282
@piece tall/1300x2650x600/open: hinge-0, -0.642..-0.626, 0.14..0.18, 0.282..0.299
@piece tall/1300x2650x600/open: hinge-1, -0.642..-0.626, 2.47..2.51, 0.277..0.282
@piece tall/1300x2650x600/open: hinge-1, -0.642..-0.626, 2.47..2.51, 0.282..0.299
@piece tall/1300x2650x600/open: hinge-2, 0.193667..0.209667, 0.14..0.18, 0.277..0.282
@piece tall/1300x2650x600/open: hinge-2, 0.193667..0.209667, 0.14..0.18, 0.282..0.299
@piece tall/1300x2650x600/open: hinge-3, 0.193667..0.209667, 2.47..2.51, 0.277..0.282
@piece tall/1300x2650x600/open: hinge-3, 0.193667..0.209667, 2.47..2.51, 0.282..0.299
@piece tall/1300x2650x600/open: hinge-4, 0.222667..0.238667, 0.14..0.18, 0.277..0.282
@piece tall/1300x2650x600/open: hinge-4, 0.222667..0.238667, 0.14..0.18, 0.282..0.299
@piece tall/1300x2650x600/open: hinge-5, 0.222667..0.238667, 2.47..2.51, 0.277..0.282
@piece tall/1300x2650x600/open: hinge-5, 0.222667..0.238667, 2.47..2.51, 0.282..0.299
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | tall/1300x2650x600/open | * | bounds | -0.65..0.65 | 0..2.65 | -0.3..0.707333 | - |
| @part | tall/1300x2650x600/open | back | box | -0.65..0.65 | 0.08..2.632 | -0.3..-0.288 | toe,bottom,top |
| @part | tall/1300x2650x600/open | bottom | box | -0.65..0.65 | 0.08..0.098 | -0.288..0.277 | back,side-left,side-right |
| @part | tall/1300x2650x600/open | top | box | -0.65..0.65 | 2.632..2.65 | -0.3..0.277 | back,side-left,side-right |
| @part | tall/1300x2650x600/open | side-left | box | -0.65..-0.632 | 0.098..2.632 | -0.288..0.277 | back,bottom,top |
| @part | tall/1300x2650x600/open | side-right | box | 0.632..0.65 | 0.098..2.632 | -0.288..0.277 | back,bottom,top |
| @part | tall/1300x2650x600/open | toe | box | -0.65..0.65 | 0..0.08 | -0.3..0.25 | ground,back,bottom |
| @part | tall/1300x2650x600/open | divider | box | 0.13..0.148 | 0.098..2.632 | -0.288..0.282 | bottom,top |
| @part | tall/1300x2650x600/open | rod | cylinder | -0.632..0.13 | 2.2875..2.3125 | -0.018..0.007 | side-left,divider |
| @part | tall/1300x2650x600/open | shelf-1 | box | 0.148..0.632 | 0.35225..0.37025 | -0.288..0.277 | divider,side-right,back |
| @part | tall/1300x2650x600/open | shelf-2 | box | 0.148..0.632 | 0.6735..0.6915 | -0.288..0.277 | divider,side-right,back |
| @part | tall/1300x2650x600/open | shelf-3 | box | 0.148..0.632 | 0.99475..1.01275 | -0.288..0.277 | divider,side-right,back |
| @part | tall/1300x2650x600/open | shelf-4 | box | 0.148..0.632 | 1.316..1.334 | -0.288..0.277 | divider,side-right,back |
| @part | tall/1300x2650x600/open | shelf-5 | box | 0.148..0.632 | 1.63725..1.65525 | -0.288..0.277 | divider,side-right,back |
| @part | tall/1300x2650x600/open | shelf-6 | box | 0.148..0.632 | 1.9585..1.9765 | -0.288..0.277 | divider,side-right,back |
| @part | tall/1300x2650x600/open | shelf-7 | box | 0.148..0.632 | 2.27975..2.29775 | -0.288..0.277 | divider,side-right,back |
| @part | tall/1300x2650x600/open | stile-1 | box | -0.225167..-0.207167 | 0.098..2.632 | 0.259..0.277 | bottom,top |
| @part | tall/1300x2650x600/open | stile-2 | box | 0.207167..0.225167 | 0.098..2.632 | 0.259..0.277 | bottom,top |
| @part | tall/1300x2650x600/open | door-0 | box | -0.643..-0.625 | 0.083..2.647 | 0.278..0.707333 | hinge-0,hinge-1 |
| @part | tall/1300x2650x600/open | hinge-0 | box | -0.642..-0.626 | 0.14..0.18 | 0.277..0.299 | door-0,side-left |
| @part | tall/1300x2650x600/open | hinge-1 | box | -0.642..-0.626 | 2.47..2.51 | 0.277..0.299 | door-0,side-left |
| @part | tall/1300x2650x600/open | handle-0 | box | -0.643..-0.627 | 1.4132..1.5732 | 0.646333..0.658333 | door-0 |
| @part | tall/1300x2650x600/open | door-1 | box | 0.192667..0.210667 | 0.083..2.647 | 0.278..0.707333 | hinge-2,hinge-3 |
| @part | tall/1300x2650x600/open | hinge-2 | box | 0.193667..0.209667 | 0.14..0.18 | 0.277..0.299 | door-1,stile-2 |
| @part | tall/1300x2650x600/open | hinge-3 | box | 0.193667..0.209667 | 2.47..2.51 | 0.277..0.299 | door-1,stile-2 |
| @part | tall/1300x2650x600/open | handle-1 | box | 0.194667..0.210667 | 1.4132..1.5732 | 0.646334..0.658334 | door-1 |
| @part | tall/1300x2650x600/open | door-2 | box | 0.221667..0.239667 | 0.083..2.647 | 0.278..0.707333 | hinge-4,hinge-5 |
| @part | tall/1300x2650x600/open | hinge-4 | box | 0.222667..0.238667 | 0.14..0.18 | 0.277..0.299 | door-2,stile-2 |
| @part | tall/1300x2650x600/open | hinge-5 | box | 0.222667..0.238667 | 2.47..2.51 | 0.277..0.299 | door-2,stile-2 |
| @part | tall/1300x2650x600/open | handle-2 | box | 0.221667..0.237667 | 1.4132..1.5732 | 0.646333..0.658333 | door-2 |

@inventory tall/1400x2600x540/closed: back, bottom, top, side-left, side-right, toe, divider, rod, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, shelf-7, stile-1, stile-2, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1, door-2, hinge-4, hinge-5, handle-2

@void tall/1400x2600x540/closed: shelf-1, 0.223833..0.241833, 0.346..0.364, 0.229..0.247
@void tall/1400x2600x540/closed: shelf-2, 0.223833..0.241833, 0.661..0.679, 0.229..0.247
@void tall/1400x2600x540/closed: shelf-3, 0.223833..0.241833, 0.976..0.994, 0.229..0.247
@void tall/1400x2600x540/closed: shelf-4, 0.223833..0.241833, 1.291..1.309, 0.229..0.247
@void tall/1400x2600x540/closed: shelf-5, 0.223833..0.241833, 1.606..1.624, 0.229..0.247
@void tall/1400x2600x540/closed: shelf-6, 0.223833..0.241833, 1.921..1.939, 0.229..0.247
@void tall/1400x2600x540/closed: shelf-7, 0.223833..0.241833, 2.236..2.254, 0.229..0.247
@void tall/1400x2600x540/closed: door-0, -0.692..-0.676, 0.14..0.18, 0.252..0.269
@void tall/1400x2600x540/closed: door-0, -0.692..-0.676, 2.42..2.46, 0.252..0.269
@void tall/1400x2600x540/closed: door-0, -0.295333..-0.283333, 1.3857..1.5457, 0.254..0.27
@void tall/1400x2600x540/closed: door-1, 0.210333..0.226333, 0.14..0.18, 0.252..0.269
@void tall/1400x2600x540/closed: door-1, 0.210333..0.226333, 2.42..2.46, 0.252..0.269
@void tall/1400x2600x540/closed: door-1, -0.182333..-0.170333, 1.3857..1.5457, 0.254..0.27
@void tall/1400x2600x540/closed: door-2, 0.239333..0.255333, 0.14..0.18, 0.252..0.269
@void tall/1400x2600x540/closed: door-2, 0.239333..0.255333, 2.42..2.46, 0.252..0.269
@void tall/1400x2600x540/closed: door-2, 0.636..0.648, 1.3857..1.5457, 0.254..0.27
@piece tall/1400x2600x540/closed: hinge-0, -0.692..-0.676, 0.14..0.18, 0.247..0.252
@piece tall/1400x2600x540/closed: hinge-0, -0.692..-0.676, 0.14..0.18, 0.252..0.269
@piece tall/1400x2600x540/closed: hinge-1, -0.692..-0.676, 2.42..2.46, 0.247..0.252
@piece tall/1400x2600x540/closed: hinge-1, -0.692..-0.676, 2.42..2.46, 0.252..0.269
@piece tall/1400x2600x540/closed: hinge-2, 0.210333..0.226333, 0.14..0.18, 0.247..0.252
@piece tall/1400x2600x540/closed: hinge-2, 0.210333..0.226333, 0.14..0.18, 0.252..0.269
@piece tall/1400x2600x540/closed: hinge-3, 0.210333..0.226333, 2.42..2.46, 0.247..0.252
@piece tall/1400x2600x540/closed: hinge-3, 0.210333..0.226333, 2.42..2.46, 0.252..0.269
@piece tall/1400x2600x540/closed: hinge-4, 0.239333..0.255333, 0.14..0.18, 0.247..0.252
@piece tall/1400x2600x540/closed: hinge-4, 0.239333..0.255333, 0.14..0.18, 0.252..0.269
@piece tall/1400x2600x540/closed: hinge-5, 0.239333..0.255333, 2.42..2.46, 0.247..0.252
@piece tall/1400x2600x540/closed: hinge-5, 0.239333..0.255333, 2.42..2.46, 0.252..0.269
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | tall/1400x2600x540/closed | * | bounds | -0.7..0.7 | 0..2.6 | -0.27..0.27 | - |
| @part | tall/1400x2600x540/closed | back | box | -0.7..0.7 | 0.08..2.582 | -0.27..-0.258 | toe,bottom,top |
| @part | tall/1400x2600x540/closed | bottom | box | -0.7..0.7 | 0.08..0.098 | -0.258..0.247 | back,side-left,side-right |
| @part | tall/1400x2600x540/closed | top | box | -0.7..0.7 | 2.582..2.6 | -0.27..0.247 | back,side-left,side-right |
| @part | tall/1400x2600x540/closed | side-left | box | -0.7..-0.682 | 0.098..2.582 | -0.258..0.247 | back,bottom,top |
| @part | tall/1400x2600x540/closed | side-right | box | 0.682..0.7 | 0.098..2.582 | -0.258..0.247 | back,bottom,top |
| @part | tall/1400x2600x540/closed | toe | box | -0.7..0.7 | 0..0.08 | -0.27..0.22 | ground,back,bottom |
| @part | tall/1400x2600x540/closed | divider | box | 0.14..0.158 | 0.098..2.582 | -0.258..0.252 | bottom,top |
| @part | tall/1400x2600x540/closed | rod | cylinder | -0.682..0.14 | 2.2375..2.2625 | -0.018..0.007 | side-left,divider |
| @part | tall/1400x2600x540/closed | shelf-1 | box | 0.158..0.682 | 0.346..0.364 | -0.258..0.247 | divider,side-right,back |
| @part | tall/1400x2600x540/closed | shelf-2 | box | 0.158..0.682 | 0.661..0.679 | -0.258..0.247 | divider,side-right,back |
| @part | tall/1400x2600x540/closed | shelf-3 | box | 0.158..0.682 | 0.976..0.994 | -0.258..0.247 | divider,side-right,back |
| @part | tall/1400x2600x540/closed | shelf-4 | box | 0.158..0.682 | 1.291..1.309 | -0.258..0.247 | divider,side-right,back |
| @part | tall/1400x2600x540/closed | shelf-5 | box | 0.158..0.682 | 1.606..1.624 | -0.258..0.247 | divider,side-right,back |
| @part | tall/1400x2600x540/closed | shelf-6 | box | 0.158..0.682 | 1.921..1.939 | -0.258..0.247 | divider,side-right,back |
| @part | tall/1400x2600x540/closed | shelf-7 | box | 0.158..0.682 | 2.236..2.254 | -0.258..0.247 | divider,side-right,back |
| @part | tall/1400x2600x540/closed | stile-1 | box | -0.241833..-0.223833 | 0.098..2.582 | 0.229..0.247 | bottom,top |
| @part | tall/1400x2600x540/closed | stile-2 | box | 0.223833..0.241833 | 0.098..2.582 | 0.229..0.247 | bottom,top |
| @part | tall/1400x2600x540/closed | door-0 | box | -0.697..-0.234333 | 0.083..2.597 | 0.252..0.27 | hinge-0,hinge-1 |
| @part | tall/1400x2600x540/closed | hinge-0 | box | -0.692..-0.676 | 0.14..0.18 | 0.247..0.269 | door-0,side-left |
| @part | tall/1400x2600x540/closed | hinge-1 | box | -0.692..-0.676 | 2.42..2.46 | 0.247..0.269 | door-0,side-left |
| @part | tall/1400x2600x540/closed | handle-0 | box | -0.295333..-0.283333 | 1.3857..1.5457 | 0.254..0.27 | door-0 |
| @part | tall/1400x2600x540/closed | door-1 | box | -0.231333..0.231333 | 0.083..2.597 | 0.252..0.27 | hinge-2,hinge-3 |
| @part | tall/1400x2600x540/closed | hinge-2 | box | 0.210333..0.226333 | 0.14..0.18 | 0.247..0.269 | door-1,stile-2 |
| @part | tall/1400x2600x540/closed | hinge-3 | box | 0.210333..0.226333 | 2.42..2.46 | 0.247..0.269 | door-1,stile-2 |
| @part | tall/1400x2600x540/closed | handle-1 | box | -0.182333..-0.170333 | 1.3857..1.5457 | 0.254..0.27 | door-1 |
| @part | tall/1400x2600x540/closed | door-2 | box | 0.234333..0.697 | 0.083..2.597 | 0.252..0.27 | hinge-4,hinge-5 |
| @part | tall/1400x2600x540/closed | hinge-4 | box | 0.239333..0.255333 | 0.14..0.18 | 0.247..0.269 | door-2,stile-2 |
| @part | tall/1400x2600x540/closed | hinge-5 | box | 0.239333..0.255333 | 2.42..2.46 | 0.247..0.269 | door-2,stile-2 |
| @part | tall/1400x2600x540/closed | handle-2 | box | 0.636..0.648 | 1.3857..1.5457 | 0.254..0.27 | door-2 |

@inventory tall/1400x2600x540/open: back, bottom, top, side-left, side-right, toe, divider, rod, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, shelf-7, stile-1, stile-2, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1, door-2, hinge-4, hinge-5, handle-2

@void tall/1400x2600x540/open: shelf-1, 0.223833..0.241833, 0.346..0.364, 0.229..0.247
@void tall/1400x2600x540/open: shelf-2, 0.223833..0.241833, 0.661..0.679, 0.229..0.247
@void tall/1400x2600x540/open: shelf-3, 0.223833..0.241833, 0.976..0.994, 0.229..0.247
@void tall/1400x2600x540/open: shelf-4, 0.223833..0.241833, 1.291..1.309, 0.229..0.247
@void tall/1400x2600x540/open: shelf-5, 0.223833..0.241833, 1.606..1.624, 0.229..0.247
@void tall/1400x2600x540/open: shelf-6, 0.223833..0.241833, 1.921..1.939, 0.229..0.247
@void tall/1400x2600x540/open: shelf-7, 0.223833..0.241833, 2.236..2.254, 0.229..0.247
@void tall/1400x2600x540/open: door-0, -0.692..-0.675, 0.14..0.18, 0.253..0.269
@void tall/1400x2600x540/open: door-0, -0.693..-0.675, 0.14..0.18, 0.248..0.269
@void tall/1400x2600x540/open: door-0, -0.692..-0.675, 2.42..2.46, 0.253..0.269
@void tall/1400x2600x540/open: door-0, -0.693..-0.675, 2.42..2.46, 0.248..0.269
@void tall/1400x2600x540/open: door-0, -0.693..-0.677, 1.3857..1.5457, 0.649667..0.661667
@void tall/1400x2600x540/open: door-1, 0.209333..0.226333, 0.14..0.18, 0.253..0.269
@void tall/1400x2600x540/open: door-1, 0.209333..0.227333, 0.14..0.18, 0.248..0.269
@void tall/1400x2600x540/open: door-1, 0.209333..0.226333, 2.42..2.46, 0.253..0.269
@void tall/1400x2600x540/open: door-1, 0.209333..0.227333, 2.42..2.46, 0.248..0.269
@void tall/1400x2600x540/open: door-1, 0.211333..0.227333, 1.3857..1.5457, 0.649666..0.661666
@void tall/1400x2600x540/open: door-2, 0.239333..0.256333, 0.14..0.18, 0.253..0.269
@void tall/1400x2600x540/open: door-2, 0.238333..0.256333, 0.14..0.18, 0.248..0.269
@void tall/1400x2600x540/open: door-2, 0.239333..0.256333, 2.42..2.46, 0.253..0.269
@void tall/1400x2600x540/open: door-2, 0.238333..0.256333, 2.42..2.46, 0.248..0.269
@void tall/1400x2600x540/open: door-2, 0.238333..0.254333, 1.3857..1.5457, 0.649667..0.661667
@piece tall/1400x2600x540/open: hinge-0, -0.692..-0.676, 0.14..0.18, 0.247..0.252
@piece tall/1400x2600x540/open: hinge-0, -0.692..-0.676, 0.14..0.18, 0.252..0.269
@piece tall/1400x2600x540/open: hinge-1, -0.692..-0.676, 2.42..2.46, 0.247..0.252
@piece tall/1400x2600x540/open: hinge-1, -0.692..-0.676, 2.42..2.46, 0.252..0.269
@piece tall/1400x2600x540/open: hinge-2, 0.210333..0.226333, 0.14..0.18, 0.247..0.252
@piece tall/1400x2600x540/open: hinge-2, 0.210333..0.226333, 0.14..0.18, 0.252..0.269
@piece tall/1400x2600x540/open: hinge-3, 0.210333..0.226333, 2.42..2.46, 0.247..0.252
@piece tall/1400x2600x540/open: hinge-3, 0.210333..0.226333, 2.42..2.46, 0.252..0.269
@piece tall/1400x2600x540/open: hinge-4, 0.239333..0.255333, 0.14..0.18, 0.247..0.252
@piece tall/1400x2600x540/open: hinge-4, 0.239333..0.255333, 0.14..0.18, 0.252..0.269
@piece tall/1400x2600x540/open: hinge-5, 0.239333..0.255333, 2.42..2.46, 0.247..0.252
@piece tall/1400x2600x540/open: hinge-5, 0.239333..0.255333, 2.42..2.46, 0.252..0.269
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | tall/1400x2600x540/open | * | bounds | -0.7..0.7 | 0..2.6 | -0.27..0.710667 | - |
| @part | tall/1400x2600x540/open | back | box | -0.7..0.7 | 0.08..2.582 | -0.27..-0.258 | toe,bottom,top |
| @part | tall/1400x2600x540/open | bottom | box | -0.7..0.7 | 0.08..0.098 | -0.258..0.247 | back,side-left,side-right |
| @part | tall/1400x2600x540/open | top | box | -0.7..0.7 | 2.582..2.6 | -0.27..0.247 | back,side-left,side-right |
| @part | tall/1400x2600x540/open | side-left | box | -0.7..-0.682 | 0.098..2.582 | -0.258..0.247 | back,bottom,top |
| @part | tall/1400x2600x540/open | side-right | box | 0.682..0.7 | 0.098..2.582 | -0.258..0.247 | back,bottom,top |
| @part | tall/1400x2600x540/open | toe | box | -0.7..0.7 | 0..0.08 | -0.27..0.22 | ground,back,bottom |
| @part | tall/1400x2600x540/open | divider | box | 0.14..0.158 | 0.098..2.582 | -0.258..0.252 | bottom,top |
| @part | tall/1400x2600x540/open | rod | cylinder | -0.682..0.14 | 2.2375..2.2625 | -0.018..0.007 | side-left,divider |
| @part | tall/1400x2600x540/open | shelf-1 | box | 0.158..0.682 | 0.346..0.364 | -0.258..0.247 | divider,side-right,back |
| @part | tall/1400x2600x540/open | shelf-2 | box | 0.158..0.682 | 0.661..0.679 | -0.258..0.247 | divider,side-right,back |
| @part | tall/1400x2600x540/open | shelf-3 | box | 0.158..0.682 | 0.976..0.994 | -0.258..0.247 | divider,side-right,back |
| @part | tall/1400x2600x540/open | shelf-4 | box | 0.158..0.682 | 1.291..1.309 | -0.258..0.247 | divider,side-right,back |
| @part | tall/1400x2600x540/open | shelf-5 | box | 0.158..0.682 | 1.606..1.624 | -0.258..0.247 | divider,side-right,back |
| @part | tall/1400x2600x540/open | shelf-6 | box | 0.158..0.682 | 1.921..1.939 | -0.258..0.247 | divider,side-right,back |
| @part | tall/1400x2600x540/open | shelf-7 | box | 0.158..0.682 | 2.236..2.254 | -0.258..0.247 | divider,side-right,back |
| @part | tall/1400x2600x540/open | stile-1 | box | -0.241833..-0.223833 | 0.098..2.582 | 0.229..0.247 | bottom,top |
| @part | tall/1400x2600x540/open | stile-2 | box | 0.223833..0.241833 | 0.098..2.582 | 0.229..0.247 | bottom,top |
| @part | tall/1400x2600x540/open | door-0 | box | -0.693..-0.675 | 0.083..2.597 | 0.248..0.710667 | hinge-0,hinge-1 |
| @part | tall/1400x2600x540/open | hinge-0 | box | -0.692..-0.676 | 0.14..0.18 | 0.247..0.269 | door-0,side-left |
| @part | tall/1400x2600x540/open | hinge-1 | box | -0.692..-0.676 | 2.42..2.46 | 0.247..0.269 | door-0,side-left |
| @part | tall/1400x2600x540/open | handle-0 | box | -0.693..-0.677 | 1.3857..1.5457 | 0.649667..0.661667 | door-0 |
| @part | tall/1400x2600x540/open | door-1 | box | 0.209333..0.227333 | 0.083..2.597 | 0.248..0.710667 | hinge-2,hinge-3 |
| @part | tall/1400x2600x540/open | hinge-2 | box | 0.210333..0.226333 | 0.14..0.18 | 0.247..0.269 | door-1,stile-2 |
| @part | tall/1400x2600x540/open | hinge-3 | box | 0.210333..0.226333 | 2.42..2.46 | 0.247..0.269 | door-1,stile-2 |
| @part | tall/1400x2600x540/open | handle-1 | box | 0.211333..0.227333 | 1.3857..1.5457 | 0.649666..0.661666 | door-1 |
| @part | tall/1400x2600x540/open | door-2 | box | 0.238333..0.256333 | 0.083..2.597 | 0.248..0.710667 | hinge-4,hinge-5 |
| @part | tall/1400x2600x540/open | hinge-4 | box | 0.239333..0.255333 | 0.14..0.18 | 0.247..0.269 | door-2,stile-2 |
| @part | tall/1400x2600x540/open | hinge-5 | box | 0.239333..0.255333 | 2.42..2.46 | 0.247..0.269 | door-2,stile-2 |
| @part | tall/1400x2600x540/open | handle-2 | box | 0.238333..0.254333 | 1.3857..1.5457 | 0.649667..0.661667 | door-2 |

@inventory tall/2720x2650x600/closed: back, bottom, top, side-left, side-right, toe, divider, rod, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, shelf-7, stile-1, stile-2, stile-3, stile-4, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1, door-2, hinge-4, hinge-5, handle-2, door-3, hinge-6, hinge-7, handle-3, door-4, hinge-8, hinge-9, handle-4

@void tall/2720x2650x600/closed: divider, 0.272..0.2807, 0.098..2.632, 0.259..0.282
@void tall/2720x2650x600/closed: shelf-1, 0.8061..0.8241, 0.35225..0.37025, 0.259..0.277
@void tall/2720x2650x600/closed: shelf-2, 0.8061..0.8241, 0.6735..0.6915, 0.259..0.277
@void tall/2720x2650x600/closed: shelf-3, 0.8061..0.8241, 0.99475..1.01275, 0.259..0.277
@void tall/2720x2650x600/closed: shelf-4, 0.8061..0.8241, 1.316..1.334, 0.259..0.277
@void tall/2720x2650x600/closed: shelf-5, 0.8061..0.8241, 1.63725..1.65525, 0.259..0.277
@void tall/2720x2650x600/closed: shelf-6, 0.8061..0.8241, 1.9585..1.9765, 0.259..0.277
@void tall/2720x2650x600/closed: shelf-7, 0.8061..0.8241, 2.27975..2.29775, 0.259..0.277
@void tall/2720x2650x600/closed: door-0, -1.352..-1.336, 0.14..0.18, 0.282..0.299
@void tall/2720x2650x600/closed: door-0, -1.352..-1.336, 2.47..2.51, 0.282..0.299
@void tall/2720x2650x600/closed: door-0, -0.8776..-0.8656, 1.4132..1.5732, 0.284..0.3
@void tall/2720x2650x600/closed: door-1, -0.2942..-0.2782, 0.14..0.18, 0.282..0.299
@void tall/2720x2650x600/closed: door-1, -0.2942..-0.2782, 2.47..2.51, 0.282..0.299
@void tall/2720x2650x600/closed: door-1, -0.7646..-0.7526, 1.4132..1.5732, 0.284..0.3
@void tall/2720x2650x600/closed: door-2, -0.2652..-0.2492, 0.14..0.18, 0.282..0.299
@void tall/2720x2650x600/closed: door-2, -0.2652..-0.2492, 2.47..2.51, 0.282..0.299
@void tall/2720x2650x600/closed: door-2, 0.2092..0.2212, 1.4132..1.5732, 0.284..0.3
@void tall/2720x2650x600/closed: door-3, 0.7926..0.8086, 0.14..0.18, 0.282..0.299
@void tall/2720x2650x600/closed: door-3, 0.7926..0.8086, 2.47..2.51, 0.282..0.299
@void tall/2720x2650x600/closed: door-3, 0.3222..0.3342, 1.4132..1.5732, 0.284..0.3
@void tall/2720x2650x600/closed: door-4, 0.8216..0.8376, 0.14..0.18, 0.282..0.299
@void tall/2720x2650x600/closed: door-4, 0.8216..0.8376, 2.47..2.51, 0.282..0.299
@void tall/2720x2650x600/closed: door-4, 1.296..1.308, 1.4132..1.5732, 0.284..0.3
@piece tall/2720x2650x600/closed: hinge-0, -1.352..-1.336, 0.14..0.18, 0.277..0.282
@piece tall/2720x2650x600/closed: hinge-0, -1.352..-1.336, 0.14..0.18, 0.282..0.299
@piece tall/2720x2650x600/closed: hinge-1, -1.352..-1.336, 2.47..2.51, 0.277..0.282
@piece tall/2720x2650x600/closed: hinge-1, -1.352..-1.336, 2.47..2.51, 0.282..0.299
@piece tall/2720x2650x600/closed: hinge-2, -0.2942..-0.2782, 0.14..0.18, 0.277..0.282
@piece tall/2720x2650x600/closed: hinge-2, -0.2942..-0.2782, 0.14..0.18, 0.282..0.299
@piece tall/2720x2650x600/closed: hinge-3, -0.2942..-0.2782, 2.47..2.51, 0.277..0.282
@piece tall/2720x2650x600/closed: hinge-3, -0.2942..-0.2782, 2.47..2.51, 0.282..0.299
@piece tall/2720x2650x600/closed: hinge-4, -0.2652..-0.2492, 0.14..0.18, 0.277..0.282
@piece tall/2720x2650x600/closed: hinge-4, -0.2652..-0.2492, 0.14..0.18, 0.282..0.299
@piece tall/2720x2650x600/closed: hinge-5, -0.2652..-0.2492, 2.47..2.51, 0.277..0.282
@piece tall/2720x2650x600/closed: hinge-5, -0.2652..-0.2492, 2.47..2.51, 0.282..0.299
@piece tall/2720x2650x600/closed: hinge-6, 0.7926..0.8086, 0.14..0.18, 0.277..0.282
@piece tall/2720x2650x600/closed: hinge-6, 0.7926..0.8086, 0.14..0.18, 0.282..0.299
@piece tall/2720x2650x600/closed: hinge-7, 0.7926..0.8086, 2.47..2.51, 0.277..0.282
@piece tall/2720x2650x600/closed: hinge-7, 0.7926..0.8086, 2.47..2.51, 0.282..0.299
@piece tall/2720x2650x600/closed: hinge-8, 0.8216..0.8376, 0.14..0.18, 0.277..0.282
@piece tall/2720x2650x600/closed: hinge-8, 0.8216..0.8376, 0.14..0.18, 0.282..0.299
@piece tall/2720x2650x600/closed: hinge-9, 0.8216..0.8376, 2.47..2.51, 0.277..0.282
@piece tall/2720x2650x600/closed: hinge-9, 0.8216..0.8376, 2.47..2.51, 0.282..0.299
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | tall/2720x2650x600/closed | * | bounds | -1.36..1.36 | 0..2.65 | -0.3..0.3 | - |
| @part | tall/2720x2650x600/closed | back | box | -1.36..1.36 | 0.08..2.632 | -0.3..-0.288 | toe,bottom,top |
| @part | tall/2720x2650x600/closed | bottom | box | -1.36..1.36 | 0.08..0.098 | -0.288..0.277 | back,side-left,side-right |
| @part | tall/2720x2650x600/closed | top | box | -1.36..1.36 | 2.632..2.65 | -0.3..0.277 | back,side-left,side-right |
| @part | tall/2720x2650x600/closed | side-left | box | -1.36..-1.342 | 0.098..2.632 | -0.288..0.277 | back,bottom,top |
| @part | tall/2720x2650x600/closed | side-right | box | 1.342..1.36 | 0.098..2.632 | -0.288..0.277 | back,bottom,top |
| @part | tall/2720x2650x600/closed | toe | box | -1.36..1.36 | 0..0.08 | -0.3..0.25 | ground,back,bottom |
| @part | tall/2720x2650x600/closed | divider | box | 0.272..0.29 | 0.098..2.632 | -0.288..0.282 | bottom,top |
| @part | tall/2720x2650x600/closed | rod | cylinder | -1.342..0.272 | 2.2875..2.3125 | -0.018..0.007 | side-left,divider |
| @part | tall/2720x2650x600/closed | shelf-1 | box | 0.29..1.342 | 0.35225..0.37025 | -0.288..0.277 | divider,side-right,back |
| @part | tall/2720x2650x600/closed | shelf-2 | box | 0.29..1.342 | 0.6735..0.6915 | -0.288..0.277 | divider,side-right,back |
| @part | tall/2720x2650x600/closed | shelf-3 | box | 0.29..1.342 | 0.99475..1.01275 | -0.288..0.277 | divider,side-right,back |
| @part | tall/2720x2650x600/closed | shelf-4 | box | 0.29..1.342 | 1.316..1.334 | -0.288..0.277 | divider,side-right,back |
| @part | tall/2720x2650x600/closed | shelf-5 | box | 0.29..1.342 | 1.63725..1.65525 | -0.288..0.277 | divider,side-right,back |
| @part | tall/2720x2650x600/closed | shelf-6 | box | 0.29..1.342 | 1.9585..1.9765 | -0.288..0.277 | divider,side-right,back |
| @part | tall/2720x2650x600/closed | shelf-7 | box | 0.29..1.342 | 2.27975..2.29775 | -0.288..0.277 | divider,side-right,back |
| @part | tall/2720x2650x600/closed | stile-1 | box | -0.8241..-0.8061 | 0.098..2.632 | 0.259..0.277 | bottom,top |
| @part | tall/2720x2650x600/closed | stile-2 | box | -0.2807..-0.2627 | 0.098..2.632 | 0.259..0.277 | bottom,top |
| @part | tall/2720x2650x600/closed | stile-3 | box | 0.2627..0.2807 | 0.098..2.632 | 0.259..0.277 | bottom,top |
| @part | tall/2720x2650x600/closed | stile-4 | box | 0.8061..0.8241 | 0.098..2.632 | 0.259..0.277 | bottom,top |
| @part | tall/2720x2650x600/closed | door-0 | box | -1.357..-0.8166 | 0.083..2.647 | 0.282..0.3 | hinge-0,hinge-1 |
| @part | tall/2720x2650x600/closed | hinge-0 | box | -1.352..-1.336 | 0.14..0.18 | 0.277..0.299 | door-0,side-left |
| @part | tall/2720x2650x600/closed | hinge-1 | box | -1.352..-1.336 | 2.47..2.51 | 0.277..0.299 | door-0,side-left |
| @part | tall/2720x2650x600/closed | handle-0 | box | -0.8776..-0.8656 | 1.4132..1.5732 | 0.284..0.3 | door-0 |
| @part | tall/2720x2650x600/closed | door-1 | box | -0.8136..-0.2732 | 0.083..2.647 | 0.282..0.3 | hinge-2,hinge-3 |
| @part | tall/2720x2650x600/closed | hinge-2 | box | -0.2942..-0.2782 | 0.14..0.18 | 0.277..0.299 | door-1,stile-2 |
| @part | tall/2720x2650x600/closed | hinge-3 | box | -0.2942..-0.2782 | 2.47..2.51 | 0.277..0.299 | door-1,stile-2 |
| @part | tall/2720x2650x600/closed | handle-1 | box | -0.7646..-0.7526 | 1.4132..1.5732 | 0.284..0.3 | door-1 |
| @part | tall/2720x2650x600/closed | door-2 | box | -0.2702..0.2702 | 0.083..2.647 | 0.282..0.3 | hinge-4,hinge-5 |
| @part | tall/2720x2650x600/closed | hinge-4 | box | -0.2652..-0.2492 | 0.14..0.18 | 0.277..0.299 | door-2,stile-2 |
| @part | tall/2720x2650x600/closed | hinge-5 | box | -0.2652..-0.2492 | 2.47..2.51 | 0.277..0.299 | door-2,stile-2 |
| @part | tall/2720x2650x600/closed | handle-2 | box | 0.2092..0.2212 | 1.4132..1.5732 | 0.284..0.3 | door-2 |
| @part | tall/2720x2650x600/closed | door-3 | box | 0.2732..0.8136 | 0.083..2.647 | 0.282..0.3 | hinge-6,hinge-7 |
| @part | tall/2720x2650x600/closed | hinge-6 | box | 0.7926..0.8086 | 0.14..0.18 | 0.277..0.299 | door-3,stile-4 |
| @part | tall/2720x2650x600/closed | hinge-7 | box | 0.7926..0.8086 | 2.47..2.51 | 0.277..0.299 | door-3,stile-4 |
| @part | tall/2720x2650x600/closed | handle-3 | box | 0.3222..0.3342 | 1.4132..1.5732 | 0.284..0.3 | door-3 |
| @part | tall/2720x2650x600/closed | door-4 | box | 0.8166..1.357 | 0.083..2.647 | 0.282..0.3 | hinge-8,hinge-9 |
| @part | tall/2720x2650x600/closed | hinge-8 | box | 0.8216..0.8376 | 0.14..0.18 | 0.277..0.299 | door-4,stile-4 |
| @part | tall/2720x2650x600/closed | hinge-9 | box | 0.8216..0.8376 | 2.47..2.51 | 0.277..0.299 | door-4,stile-4 |
| @part | tall/2720x2650x600/closed | handle-4 | box | 1.296..1.308 | 1.4132..1.5732 | 0.284..0.3 | door-4 |

@inventory tall/2720x2650x600/open: back, bottom, top, side-left, side-right, toe, divider, rod, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, shelf-7, stile-1, stile-2, stile-3, stile-4, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1, door-2, hinge-4, hinge-5, handle-2, door-3, hinge-6, hinge-7, handle-3, door-4, hinge-8, hinge-9, handle-4

@void tall/2720x2650x600/open: divider, 0.272..0.2807, 0.098..2.632, 0.259..0.282
@void tall/2720x2650x600/open: shelf-1, 0.8061..0.8241, 0.35225..0.37025, 0.259..0.277
@void tall/2720x2650x600/open: shelf-2, 0.8061..0.8241, 0.6735..0.6915, 0.259..0.277
@void tall/2720x2650x600/open: shelf-3, 0.8061..0.8241, 0.99475..1.01275, 0.259..0.277
@void tall/2720x2650x600/open: shelf-4, 0.8061..0.8241, 1.316..1.334, 0.259..0.277
@void tall/2720x2650x600/open: shelf-5, 0.8061..0.8241, 1.63725..1.65525, 0.259..0.277
@void tall/2720x2650x600/open: shelf-6, 0.8061..0.8241, 1.9585..1.9765, 0.259..0.277
@void tall/2720x2650x600/open: shelf-7, 0.8061..0.8241, 2.27975..2.29775, 0.259..0.277
@void tall/2720x2650x600/open: door-0, -1.352..-1.335, 0.14..0.18, 0.283..0.299
@void tall/2720x2650x600/open: door-0, -1.353..-1.335, 0.14..0.18, 0.278..0.299
@void tall/2720x2650x600/open: door-0, -1.352..-1.335, 2.47..2.51, 0.283..0.299
@void tall/2720x2650x600/open: door-0, -1.353..-1.335, 2.47..2.51, 0.278..0.299
@void tall/2720x2650x600/open: door-0, -1.353..-1.337, 1.4132..1.5732, 0.7574..0.7694
@void tall/2720x2650x600/open: door-1, -0.2952..-0.2782, 0.14..0.18, 0.283..0.299
@void tall/2720x2650x600/open: door-1, -0.2952..-0.2772, 0.14..0.18, 0.278..0.299
@void tall/2720x2650x600/open: door-1, -0.2952..-0.2782, 2.47..2.51, 0.283..0.299
@void tall/2720x2650x600/open: door-1, -0.2952..-0.2772, 2.47..2.51, 0.278..0.299
@void tall/2720x2650x600/open: door-1, -0.2932..-0.2772, 1.4132..1.5732, 0.7574..0.7694
@void tall/2720x2650x600/open: door-2, -0.2652..-0.2482, 0.14..0.18, 0.283..0.299
@void tall/2720x2650x600/open: door-2, -0.2662..-0.2482, 0.14..0.18, 0.278..0.299
@void tall/2720x2650x600/open: door-2, -0.2652..-0.2482, 2.47..2.51, 0.283..0.299
@void tall/2720x2650x600/open: door-2, -0.2662..-0.2482, 2.47..2.51, 0.278..0.299
@void tall/2720x2650x600/open: door-2, -0.2662..-0.2502, 1.4132..1.5732, 0.7574..0.7694
@void tall/2720x2650x600/open: door-3, 0.7916..0.8086, 0.14..0.18, 0.283..0.299
@void tall/2720x2650x600/open: door-3, 0.7916..0.8096, 0.14..0.18, 0.278..0.299
@void tall/2720x2650x600/open: door-3, 0.7916..0.8086, 2.47..2.51, 0.283..0.299
@void tall/2720x2650x600/open: door-3, 0.7916..0.8096, 2.47..2.51, 0.278..0.299
@void tall/2720x2650x600/open: door-3, 0.7936..0.8096, 1.4132..1.5732, 0.7574..0.7694
@void tall/2720x2650x600/open: door-4, 0.8216..0.8386, 0.14..0.18, 0.283..0.299
@void tall/2720x2650x600/open: door-4, 0.8206..0.8386, 0.14..0.18, 0.278..0.299
@void tall/2720x2650x600/open: door-4, 0.8216..0.8386, 2.47..2.51, 0.283..0.299
@void tall/2720x2650x600/open: door-4, 0.8206..0.8386, 2.47..2.51, 0.278..0.299
@void tall/2720x2650x600/open: door-4, 0.8206..0.8366, 1.4132..1.5732, 0.7574..0.7694
@piece tall/2720x2650x600/open: hinge-0, -1.352..-1.336, 0.14..0.18, 0.277..0.282
@piece tall/2720x2650x600/open: hinge-0, -1.352..-1.336, 0.14..0.18, 0.282..0.299
@piece tall/2720x2650x600/open: hinge-1, -1.352..-1.336, 2.47..2.51, 0.277..0.282
@piece tall/2720x2650x600/open: hinge-1, -1.352..-1.336, 2.47..2.51, 0.282..0.299
@piece tall/2720x2650x600/open: hinge-2, -0.2942..-0.2782, 0.14..0.18, 0.277..0.282
@piece tall/2720x2650x600/open: hinge-2, -0.2942..-0.2782, 0.14..0.18, 0.282..0.299
@piece tall/2720x2650x600/open: hinge-3, -0.2942..-0.2782, 2.47..2.51, 0.277..0.282
@piece tall/2720x2650x600/open: hinge-3, -0.2942..-0.2782, 2.47..2.51, 0.282..0.299
@piece tall/2720x2650x600/open: hinge-4, -0.2652..-0.2492, 0.14..0.18, 0.277..0.282
@piece tall/2720x2650x600/open: hinge-4, -0.2652..-0.2492, 0.14..0.18, 0.282..0.299
@piece tall/2720x2650x600/open: hinge-5, -0.2652..-0.2492, 2.47..2.51, 0.277..0.282
@piece tall/2720x2650x600/open: hinge-5, -0.2652..-0.2492, 2.47..2.51, 0.282..0.299
@piece tall/2720x2650x600/open: hinge-6, 0.7926..0.8086, 0.14..0.18, 0.277..0.282
@piece tall/2720x2650x600/open: hinge-6, 0.7926..0.8086, 0.14..0.18, 0.282..0.299
@piece tall/2720x2650x600/open: hinge-7, 0.7926..0.8086, 2.47..2.51, 0.277..0.282
@piece tall/2720x2650x600/open: hinge-7, 0.7926..0.8086, 2.47..2.51, 0.282..0.299
@piece tall/2720x2650x600/open: hinge-8, 0.8216..0.8376, 0.14..0.18, 0.277..0.282
@piece tall/2720x2650x600/open: hinge-8, 0.8216..0.8376, 0.14..0.18, 0.282..0.299
@piece tall/2720x2650x600/open: hinge-9, 0.8216..0.8376, 2.47..2.51, 0.277..0.282
@piece tall/2720x2650x600/open: hinge-9, 0.8216..0.8376, 2.47..2.51, 0.282..0.299
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | tall/2720x2650x600/open | * | bounds | -1.36..1.36 | 0..2.65 | -0.3..0.8184 | - |
| @part | tall/2720x2650x600/open | back | box | -1.36..1.36 | 0.08..2.632 | -0.3..-0.288 | toe,bottom,top |
| @part | tall/2720x2650x600/open | bottom | box | -1.36..1.36 | 0.08..0.098 | -0.288..0.277 | back,side-left,side-right |
| @part | tall/2720x2650x600/open | top | box | -1.36..1.36 | 2.632..2.65 | -0.3..0.277 | back,side-left,side-right |
| @part | tall/2720x2650x600/open | side-left | box | -1.36..-1.342 | 0.098..2.632 | -0.288..0.277 | back,bottom,top |
| @part | tall/2720x2650x600/open | side-right | box | 1.342..1.36 | 0.098..2.632 | -0.288..0.277 | back,bottom,top |
| @part | tall/2720x2650x600/open | toe | box | -1.36..1.36 | 0..0.08 | -0.3..0.25 | ground,back,bottom |
| @part | tall/2720x2650x600/open | divider | box | 0.272..0.29 | 0.098..2.632 | -0.288..0.282 | bottom,top |
| @part | tall/2720x2650x600/open | rod | cylinder | -1.342..0.272 | 2.2875..2.3125 | -0.018..0.007 | side-left,divider |
| @part | tall/2720x2650x600/open | shelf-1 | box | 0.29..1.342 | 0.35225..0.37025 | -0.288..0.277 | divider,side-right,back |
| @part | tall/2720x2650x600/open | shelf-2 | box | 0.29..1.342 | 0.6735..0.6915 | -0.288..0.277 | divider,side-right,back |
| @part | tall/2720x2650x600/open | shelf-3 | box | 0.29..1.342 | 0.99475..1.01275 | -0.288..0.277 | divider,side-right,back |
| @part | tall/2720x2650x600/open | shelf-4 | box | 0.29..1.342 | 1.316..1.334 | -0.288..0.277 | divider,side-right,back |
| @part | tall/2720x2650x600/open | shelf-5 | box | 0.29..1.342 | 1.63725..1.65525 | -0.288..0.277 | divider,side-right,back |
| @part | tall/2720x2650x600/open | shelf-6 | box | 0.29..1.342 | 1.9585..1.9765 | -0.288..0.277 | divider,side-right,back |
| @part | tall/2720x2650x600/open | shelf-7 | box | 0.29..1.342 | 2.27975..2.29775 | -0.288..0.277 | divider,side-right,back |
| @part | tall/2720x2650x600/open | stile-1 | box | -0.8241..-0.8061 | 0.098..2.632 | 0.259..0.277 | bottom,top |
| @part | tall/2720x2650x600/open | stile-2 | box | -0.2807..-0.2627 | 0.098..2.632 | 0.259..0.277 | bottom,top |
| @part | tall/2720x2650x600/open | stile-3 | box | 0.2627..0.2807 | 0.098..2.632 | 0.259..0.277 | bottom,top |
| @part | tall/2720x2650x600/open | stile-4 | box | 0.8061..0.8241 | 0.098..2.632 | 0.259..0.277 | bottom,top |
| @part | tall/2720x2650x600/open | door-0 | box | -1.353..-1.335 | 0.083..2.647 | 0.278..0.8184 | hinge-0,hinge-1 |
| @part | tall/2720x2650x600/open | hinge-0 | box | -1.352..-1.336 | 0.14..0.18 | 0.277..0.299 | door-0,side-left |
| @part | tall/2720x2650x600/open | hinge-1 | box | -1.352..-1.336 | 2.47..2.51 | 0.277..0.299 | door-0,side-left |
| @part | tall/2720x2650x600/open | handle-0 | box | -1.353..-1.337 | 1.4132..1.5732 | 0.7574..0.7694 | door-0 |
| @part | tall/2720x2650x600/open | door-1 | box | -0.2952..-0.2772 | 0.083..2.647 | 0.278..0.8184 | hinge-2,hinge-3 |
| @part | tall/2720x2650x600/open | hinge-2 | box | -0.2942..-0.2782 | 0.14..0.18 | 0.277..0.299 | door-1,stile-2 |
| @part | tall/2720x2650x600/open | hinge-3 | box | -0.2942..-0.2782 | 2.47..2.51 | 0.277..0.299 | door-1,stile-2 |
| @part | tall/2720x2650x600/open | handle-1 | box | -0.2932..-0.2772 | 1.4132..1.5732 | 0.7574..0.7694 | door-1 |
| @part | tall/2720x2650x600/open | door-2 | box | -0.2662..-0.2482 | 0.083..2.647 | 0.278..0.8184 | hinge-4,hinge-5 |
| @part | tall/2720x2650x600/open | hinge-4 | box | -0.2652..-0.2492 | 0.14..0.18 | 0.277..0.299 | door-2,stile-2 |
| @part | tall/2720x2650x600/open | hinge-5 | box | -0.2652..-0.2492 | 2.47..2.51 | 0.277..0.299 | door-2,stile-2 |
| @part | tall/2720x2650x600/open | handle-2 | box | -0.2662..-0.2502 | 1.4132..1.5732 | 0.7574..0.7694 | door-2 |
| @part | tall/2720x2650x600/open | door-3 | box | 0.7916..0.8096 | 0.083..2.647 | 0.278..0.8184 | hinge-6,hinge-7 |
| @part | tall/2720x2650x600/open | hinge-6 | box | 0.7926..0.8086 | 0.14..0.18 | 0.277..0.299 | door-3,stile-4 |
| @part | tall/2720x2650x600/open | hinge-7 | box | 0.7926..0.8086 | 2.47..2.51 | 0.277..0.299 | door-3,stile-4 |
| @part | tall/2720x2650x600/open | handle-3 | box | 0.7936..0.8096 | 1.4132..1.5732 | 0.7574..0.7694 | door-3 |
| @part | tall/2720x2650x600/open | door-4 | box | 0.8206..0.8386 | 0.083..2.647 | 0.278..0.8184 | hinge-8,hinge-9 |
| @part | tall/2720x2650x600/open | hinge-8 | box | 0.8216..0.8376 | 0.14..0.18 | 0.277..0.299 | door-4,stile-4 |
| @part | tall/2720x2650x600/open | hinge-9 | box | 0.8216..0.8376 | 2.47..2.51 | 0.277..0.299 | door-4,stile-4 |
| @part | tall/2720x2650x600/open | handle-4 | box | 0.8206..0.8366 | 1.4132..1.5732 | 0.7574..0.7694 | door-4 |

@inventory tall/520x2250x520/closed: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, stile-1, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1

@void tall/520x2250x520/closed: shelf-1, -0.009..0.009, 0.341..0.359, 0.219..0.237
@void tall/520x2250x520/closed: shelf-2, -0.009..0.009, 0.651..0.669, 0.219..0.237
@void tall/520x2250x520/closed: shelf-3, -0.009..0.009, 0.961..0.979, 0.219..0.237
@void tall/520x2250x520/closed: shelf-4, -0.009..0.009, 1.271..1.289, 0.219..0.237
@void tall/520x2250x520/closed: shelf-5, -0.009..0.009, 1.581..1.599, 0.219..0.237
@void tall/520x2250x520/closed: shelf-6, -0.009..0.009, 1.891..1.909, 0.219..0.237
@void tall/520x2250x520/closed: door-0, -0.252..-0.236, 0.14..0.18, 0.242..0.259
@void tall/520x2250x520/closed: door-0, -0.252..-0.236, 2.07..2.11, 0.242..0.259
@void tall/520x2250x520/closed: door-0, -0.0625..-0.0505, 1.1932..1.3532, 0.244..0.26
@void tall/520x2250x520/closed: door-1, 0.236..0.252, 0.14..0.18, 0.242..0.259
@void tall/520x2250x520/closed: door-1, 0.236..0.252, 2.07..2.11, 0.242..0.259
@void tall/520x2250x520/closed: door-1, 0.0505..0.0625, 1.1932..1.3532, 0.244..0.26
@piece tall/520x2250x520/closed: hinge-0, -0.252..-0.236, 0.14..0.18, 0.237..0.242
@piece tall/520x2250x520/closed: hinge-0, -0.252..-0.236, 0.14..0.18, 0.242..0.259
@piece tall/520x2250x520/closed: hinge-1, -0.252..-0.236, 2.07..2.11, 0.237..0.242
@piece tall/520x2250x520/closed: hinge-1, -0.252..-0.236, 2.07..2.11, 0.242..0.259
@piece tall/520x2250x520/closed: hinge-2, 0.236..0.252, 0.14..0.18, 0.237..0.242
@piece tall/520x2250x520/closed: hinge-2, 0.236..0.252, 0.14..0.18, 0.242..0.259
@piece tall/520x2250x520/closed: hinge-3, 0.236..0.252, 2.07..2.11, 0.237..0.242
@piece tall/520x2250x520/closed: hinge-3, 0.236..0.252, 2.07..2.11, 0.242..0.259
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | tall/520x2250x520/closed | * | bounds | -0.26..0.26 | 0..2.25 | -0.26..0.26 | - |
| @part | tall/520x2250x520/closed | back | box | -0.26..0.26 | 0.08..2.232 | -0.26..-0.248 | toe,bottom,top |
| @part | tall/520x2250x520/closed | bottom | box | -0.26..0.26 | 0.08..0.098 | -0.248..0.237 | back,side-left,side-right |
| @part | tall/520x2250x520/closed | top | box | -0.26..0.26 | 2.232..2.25 | -0.26..0.237 | back,side-left,side-right |
| @part | tall/520x2250x520/closed | side-left | box | -0.26..-0.242 | 0.098..2.232 | -0.248..0.237 | back,bottom,top |
| @part | tall/520x2250x520/closed | side-right | box | 0.242..0.26 | 0.098..2.232 | -0.248..0.237 | back,bottom,top |
| @part | tall/520x2250x520/closed | toe | box | -0.26..0.26 | 0..0.08 | -0.26..0.21 | ground,back,bottom |
| @part | tall/520x2250x520/closed | shelf-1 | box | -0.242..0.242 | 0.341..0.359 | -0.248..0.237 | side-left,side-right,back |
| @part | tall/520x2250x520/closed | shelf-2 | box | -0.242..0.242 | 0.651..0.669 | -0.248..0.237 | side-left,side-right,back |
| @part | tall/520x2250x520/closed | shelf-3 | box | -0.242..0.242 | 0.961..0.979 | -0.248..0.237 | side-left,side-right,back |
| @part | tall/520x2250x520/closed | shelf-4 | box | -0.242..0.242 | 1.271..1.289 | -0.248..0.237 | side-left,side-right,back |
| @part | tall/520x2250x520/closed | shelf-5 | box | -0.242..0.242 | 1.581..1.599 | -0.248..0.237 | side-left,side-right,back |
| @part | tall/520x2250x520/closed | shelf-6 | box | -0.242..0.242 | 1.891..1.909 | -0.248..0.237 | side-left,side-right,back |
| @part | tall/520x2250x520/closed | stile-1 | box | -0.009..0.009 | 0.098..2.232 | 0.219..0.237 | bottom,top |
| @part | tall/520x2250x520/closed | door-0 | box | -0.257..-0.0015 | 0.083..2.247 | 0.242..0.26 | hinge-0,hinge-1 |
| @part | tall/520x2250x520/closed | hinge-0 | box | -0.252..-0.236 | 0.14..0.18 | 0.237..0.259 | door-0,side-left |
| @part | tall/520x2250x520/closed | hinge-1 | box | -0.252..-0.236 | 2.07..2.11 | 0.237..0.259 | door-0,side-left |
| @part | tall/520x2250x520/closed | handle-0 | box | -0.0625..-0.0505 | 1.1932..1.3532 | 0.244..0.26 | door-0 |
| @part | tall/520x2250x520/closed | door-1 | box | 0.0015..0.257 | 0.083..2.247 | 0.242..0.26 | hinge-2,hinge-3 |
| @part | tall/520x2250x520/closed | hinge-2 | box | 0.236..0.252 | 0.14..0.18 | 0.237..0.259 | door-1,side-right |
| @part | tall/520x2250x520/closed | hinge-3 | box | 0.236..0.252 | 2.07..2.11 | 0.237..0.259 | door-1,side-right |
| @part | tall/520x2250x520/closed | handle-1 | box | 0.0505..0.0625 | 1.1932..1.3532 | 0.244..0.26 | door-1 |

@inventory tall/520x2250x520/open: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, stile-1, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1

@void tall/520x2250x520/open: shelf-1, -0.009..0.009, 0.341..0.359, 0.219..0.237
@void tall/520x2250x520/open: shelf-2, -0.009..0.009, 0.651..0.669, 0.219..0.237
@void tall/520x2250x520/open: shelf-3, -0.009..0.009, 0.961..0.979, 0.219..0.237
@void tall/520x2250x520/open: shelf-4, -0.009..0.009, 1.271..1.289, 0.219..0.237
@void tall/520x2250x520/open: shelf-5, -0.009..0.009, 1.581..1.599, 0.219..0.237
@void tall/520x2250x520/open: shelf-6, -0.009..0.009, 1.891..1.909, 0.219..0.237
@void tall/520x2250x520/open: door-0, -0.252..-0.235, 0.14..0.18, 0.243..0.259
@void tall/520x2250x520/open: door-0, -0.253..-0.235, 0.14..0.18, 0.238..0.259
@void tall/520x2250x520/open: door-0, -0.252..-0.235, 2.07..2.11, 0.243..0.259
@void tall/520x2250x520/open: door-0, -0.253..-0.235, 2.07..2.11, 0.238..0.259
@void tall/520x2250x520/open: door-0, -0.253..-0.237, 1.1932..1.3532, 0.4325..0.4445
@void tall/520x2250x520/open: door-1, 0.235..0.252, 0.14..0.18, 0.243..0.259
@void tall/520x2250x520/open: door-1, 0.235..0.253, 0.14..0.18, 0.238..0.259
@void tall/520x2250x520/open: door-1, 0.235..0.252, 2.07..2.11, 0.243..0.259
@void tall/520x2250x520/open: door-1, 0.235..0.253, 2.07..2.11, 0.238..0.259
@void tall/520x2250x520/open: door-1, 0.237..0.253, 1.1932..1.3532, 0.4325..0.4445
@piece tall/520x2250x520/open: hinge-0, -0.252..-0.236, 0.14..0.18, 0.237..0.242
@piece tall/520x2250x520/open: hinge-0, -0.252..-0.236, 0.14..0.18, 0.242..0.259
@piece tall/520x2250x520/open: hinge-1, -0.252..-0.236, 2.07..2.11, 0.237..0.242
@piece tall/520x2250x520/open: hinge-1, -0.252..-0.236, 2.07..2.11, 0.242..0.259
@piece tall/520x2250x520/open: hinge-2, 0.236..0.252, 0.14..0.18, 0.237..0.242
@piece tall/520x2250x520/open: hinge-2, 0.236..0.252, 0.14..0.18, 0.242..0.259
@piece tall/520x2250x520/open: hinge-3, 0.236..0.252, 2.07..2.11, 0.237..0.242
@piece tall/520x2250x520/open: hinge-3, 0.236..0.252, 2.07..2.11, 0.242..0.259
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | tall/520x2250x520/open | * | bounds | -0.26..0.26 | 0..2.25 | -0.26..0.4935 | - |
| @part | tall/520x2250x520/open | back | box | -0.26..0.26 | 0.08..2.232 | -0.26..-0.248 | toe,bottom,top |
| @part | tall/520x2250x520/open | bottom | box | -0.26..0.26 | 0.08..0.098 | -0.248..0.237 | back,side-left,side-right |
| @part | tall/520x2250x520/open | top | box | -0.26..0.26 | 2.232..2.25 | -0.26..0.237 | back,side-left,side-right |
| @part | tall/520x2250x520/open | side-left | box | -0.26..-0.242 | 0.098..2.232 | -0.248..0.237 | back,bottom,top |
| @part | tall/520x2250x520/open | side-right | box | 0.242..0.26 | 0.098..2.232 | -0.248..0.237 | back,bottom,top |
| @part | tall/520x2250x520/open | toe | box | -0.26..0.26 | 0..0.08 | -0.26..0.21 | ground,back,bottom |
| @part | tall/520x2250x520/open | shelf-1 | box | -0.242..0.242 | 0.341..0.359 | -0.248..0.237 | side-left,side-right,back |
| @part | tall/520x2250x520/open | shelf-2 | box | -0.242..0.242 | 0.651..0.669 | -0.248..0.237 | side-left,side-right,back |
| @part | tall/520x2250x520/open | shelf-3 | box | -0.242..0.242 | 0.961..0.979 | -0.248..0.237 | side-left,side-right,back |
| @part | tall/520x2250x520/open | shelf-4 | box | -0.242..0.242 | 1.271..1.289 | -0.248..0.237 | side-left,side-right,back |
| @part | tall/520x2250x520/open | shelf-5 | box | -0.242..0.242 | 1.581..1.599 | -0.248..0.237 | side-left,side-right,back |
| @part | tall/520x2250x520/open | shelf-6 | box | -0.242..0.242 | 1.891..1.909 | -0.248..0.237 | side-left,side-right,back |
| @part | tall/520x2250x520/open | stile-1 | box | -0.009..0.009 | 0.098..2.232 | 0.219..0.237 | bottom,top |
| @part | tall/520x2250x520/open | door-0 | box | -0.253..-0.235 | 0.083..2.247 | 0.238..0.4935 | hinge-0,hinge-1 |
| @part | tall/520x2250x520/open | hinge-0 | box | -0.252..-0.236 | 0.14..0.18 | 0.237..0.259 | door-0,side-left |
| @part | tall/520x2250x520/open | hinge-1 | box | -0.252..-0.236 | 2.07..2.11 | 0.237..0.259 | door-0,side-left |
| @part | tall/520x2250x520/open | handle-0 | box | -0.253..-0.237 | 1.1932..1.3532 | 0.4325..0.4445 | door-0 |
| @part | tall/520x2250x520/open | door-1 | box | 0.235..0.253 | 0.083..2.247 | 0.238..0.4935 | hinge-2,hinge-3 |
| @part | tall/520x2250x520/open | hinge-2 | box | 0.236..0.252 | 0.14..0.18 | 0.237..0.259 | door-1,side-right |
| @part | tall/520x2250x520/open | hinge-3 | box | 0.236..0.252 | 2.07..2.11 | 0.237..0.259 | door-1,side-right |
| @part | tall/520x2250x520/open | handle-1 | box | 0.237..0.253 | 1.1932..1.3532 | 0.4325..0.4445 | door-1 |

@inventory tall/600x2300x500/closed: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, stile-1, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1

@void tall/600x2300x500/closed: shelf-1, -0.009..0.009, 0.348143..0.366143, 0.209..0.227
@void tall/600x2300x500/closed: shelf-2, -0.009..0.009, 0.665286..0.683286, 0.209..0.227
@void tall/600x2300x500/closed: shelf-3, -0.009..0.009, 0.982429..1.000429, 0.209..0.227
@void tall/600x2300x500/closed: shelf-4, -0.009..0.009, 1.299571..1.317571, 0.209..0.227
@void tall/600x2300x500/closed: shelf-5, -0.009..0.009, 1.616714..1.634714, 0.209..0.227
@void tall/600x2300x500/closed: shelf-6, -0.009..0.009, 1.933857..1.951857, 0.209..0.227
@void tall/600x2300x500/closed: door-0, -0.292..-0.276, 0.14..0.18, 0.232..0.249
@void tall/600x2300x500/closed: door-0, -0.292..-0.276, 2.12..2.16, 0.232..0.249
@void tall/600x2300x500/closed: door-0, -0.0625..-0.0505, 1.2207..1.3807, 0.234..0.25
@void tall/600x2300x500/closed: door-1, 0.276..0.292, 0.14..0.18, 0.232..0.249
@void tall/600x2300x500/closed: door-1, 0.276..0.292, 2.12..2.16, 0.232..0.249
@void tall/600x2300x500/closed: door-1, 0.0505..0.0625, 1.2207..1.3807, 0.234..0.25
@piece tall/600x2300x500/closed: hinge-0, -0.292..-0.276, 0.14..0.18, 0.227..0.232
@piece tall/600x2300x500/closed: hinge-0, -0.292..-0.276, 0.14..0.18, 0.232..0.249
@piece tall/600x2300x500/closed: hinge-1, -0.292..-0.276, 2.12..2.16, 0.227..0.232
@piece tall/600x2300x500/closed: hinge-1, -0.292..-0.276, 2.12..2.16, 0.232..0.249
@piece tall/600x2300x500/closed: hinge-2, 0.276..0.292, 0.14..0.18, 0.227..0.232
@piece tall/600x2300x500/closed: hinge-2, 0.276..0.292, 0.14..0.18, 0.232..0.249
@piece tall/600x2300x500/closed: hinge-3, 0.276..0.292, 2.12..2.16, 0.227..0.232
@piece tall/600x2300x500/closed: hinge-3, 0.276..0.292, 2.12..2.16, 0.232..0.249
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | tall/600x2300x500/closed | * | bounds | -0.3..0.3 | 0..2.3 | -0.25..0.25 | - |
| @part | tall/600x2300x500/closed | back | box | -0.3..0.3 | 0.08..2.282 | -0.25..-0.238 | toe,bottom,top |
| @part | tall/600x2300x500/closed | bottom | box | -0.3..0.3 | 0.08..0.098 | -0.238..0.227 | back,side-left,side-right |
| @part | tall/600x2300x500/closed | top | box | -0.3..0.3 | 2.282..2.3 | -0.25..0.227 | back,side-left,side-right |
| @part | tall/600x2300x500/closed | side-left | box | -0.3..-0.282 | 0.098..2.282 | -0.238..0.227 | back,bottom,top |
| @part | tall/600x2300x500/closed | side-right | box | 0.282..0.3 | 0.098..2.282 | -0.238..0.227 | back,bottom,top |
| @part | tall/600x2300x500/closed | toe | box | -0.3..0.3 | 0..0.08 | -0.25..0.2 | ground,back,bottom |
| @part | tall/600x2300x500/closed | shelf-1 | box | -0.282..0.282 | 0.348143..0.366143 | -0.238..0.227 | side-left,side-right,back |
| @part | tall/600x2300x500/closed | shelf-2 | box | -0.282..0.282 | 0.665286..0.683286 | -0.238..0.227 | side-left,side-right,back |
| @part | tall/600x2300x500/closed | shelf-3 | box | -0.282..0.282 | 0.982429..1.000429 | -0.238..0.227 | side-left,side-right,back |
| @part | tall/600x2300x500/closed | shelf-4 | box | -0.282..0.282 | 1.299571..1.317571 | -0.238..0.227 | side-left,side-right,back |
| @part | tall/600x2300x500/closed | shelf-5 | box | -0.282..0.282 | 1.616714..1.634714 | -0.238..0.227 | side-left,side-right,back |
| @part | tall/600x2300x500/closed | shelf-6 | box | -0.282..0.282 | 1.933857..1.951857 | -0.238..0.227 | side-left,side-right,back |
| @part | tall/600x2300x500/closed | stile-1 | box | -0.009..0.009 | 0.098..2.282 | 0.209..0.227 | bottom,top |
| @part | tall/600x2300x500/closed | door-0 | box | -0.297..-0.0015 | 0.083..2.297 | 0.232..0.25 | hinge-0,hinge-1 |
| @part | tall/600x2300x500/closed | hinge-0 | box | -0.292..-0.276 | 0.14..0.18 | 0.227..0.249 | door-0,side-left |
| @part | tall/600x2300x500/closed | hinge-1 | box | -0.292..-0.276 | 2.12..2.16 | 0.227..0.249 | door-0,side-left |
| @part | tall/600x2300x500/closed | handle-0 | box | -0.0625..-0.0505 | 1.2207..1.3807 | 0.234..0.25 | door-0 |
| @part | tall/600x2300x500/closed | door-1 | box | 0.0015..0.297 | 0.083..2.297 | 0.232..0.25 | hinge-2,hinge-3 |
| @part | tall/600x2300x500/closed | hinge-2 | box | 0.276..0.292 | 0.14..0.18 | 0.227..0.249 | door-1,side-right |
| @part | tall/600x2300x500/closed | hinge-3 | box | 0.276..0.292 | 2.12..2.16 | 0.227..0.249 | door-1,side-right |
| @part | tall/600x2300x500/closed | handle-1 | box | 0.0505..0.0625 | 1.2207..1.3807 | 0.234..0.25 | door-1 |

@inventory tall/600x2300x500/open: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, stile-1, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1

@void tall/600x2300x500/open: shelf-1, -0.009..0.009, 0.348143..0.366143, 0.209..0.227
@void tall/600x2300x500/open: shelf-2, -0.009..0.009, 0.665286..0.683286, 0.209..0.227
@void tall/600x2300x500/open: shelf-3, -0.009..0.009, 0.982429..1.000429, 0.209..0.227
@void tall/600x2300x500/open: shelf-4, -0.009..0.009, 1.299571..1.317571, 0.209..0.227
@void tall/600x2300x500/open: shelf-5, -0.009..0.009, 1.616714..1.634714, 0.209..0.227
@void tall/600x2300x500/open: shelf-6, -0.009..0.009, 1.933857..1.951857, 0.209..0.227
@void tall/600x2300x500/open: door-0, -0.292..-0.275, 0.14..0.18, 0.233..0.249
@void tall/600x2300x500/open: door-0, -0.293..-0.275, 0.14..0.18, 0.228..0.249
@void tall/600x2300x500/open: door-0, -0.292..-0.275, 2.12..2.16, 0.233..0.249
@void tall/600x2300x500/open: door-0, -0.293..-0.275, 2.12..2.16, 0.228..0.249
@void tall/600x2300x500/open: door-0, -0.293..-0.277, 1.2207..1.3807, 0.4625..0.4745
@void tall/600x2300x500/open: door-1, 0.275..0.292, 0.14..0.18, 0.233..0.249
@void tall/600x2300x500/open: door-1, 0.275..0.293, 0.14..0.18, 0.228..0.249
@void tall/600x2300x500/open: door-1, 0.275..0.292, 2.12..2.16, 0.233..0.249
@void tall/600x2300x500/open: door-1, 0.275..0.293, 2.12..2.16, 0.228..0.249
@void tall/600x2300x500/open: door-1, 0.277..0.293, 1.2207..1.3807, 0.4625..0.4745
@piece tall/600x2300x500/open: hinge-0, -0.292..-0.276, 0.14..0.18, 0.227..0.232
@piece tall/600x2300x500/open: hinge-0, -0.292..-0.276, 0.14..0.18, 0.232..0.249
@piece tall/600x2300x500/open: hinge-1, -0.292..-0.276, 2.12..2.16, 0.227..0.232
@piece tall/600x2300x500/open: hinge-1, -0.292..-0.276, 2.12..2.16, 0.232..0.249
@piece tall/600x2300x500/open: hinge-2, 0.276..0.292, 0.14..0.18, 0.227..0.232
@piece tall/600x2300x500/open: hinge-2, 0.276..0.292, 0.14..0.18, 0.232..0.249
@piece tall/600x2300x500/open: hinge-3, 0.276..0.292, 2.12..2.16, 0.227..0.232
@piece tall/600x2300x500/open: hinge-3, 0.276..0.292, 2.12..2.16, 0.232..0.249
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | tall/600x2300x500/open | * | bounds | -0.3..0.3 | 0..2.3 | -0.25..0.5235 | - |
| @part | tall/600x2300x500/open | back | box | -0.3..0.3 | 0.08..2.282 | -0.25..-0.238 | toe,bottom,top |
| @part | tall/600x2300x500/open | bottom | box | -0.3..0.3 | 0.08..0.098 | -0.238..0.227 | back,side-left,side-right |
| @part | tall/600x2300x500/open | top | box | -0.3..0.3 | 2.282..2.3 | -0.25..0.227 | back,side-left,side-right |
| @part | tall/600x2300x500/open | side-left | box | -0.3..-0.282 | 0.098..2.282 | -0.238..0.227 | back,bottom,top |
| @part | tall/600x2300x500/open | side-right | box | 0.282..0.3 | 0.098..2.282 | -0.238..0.227 | back,bottom,top |
| @part | tall/600x2300x500/open | toe | box | -0.3..0.3 | 0..0.08 | -0.25..0.2 | ground,back,bottom |
| @part | tall/600x2300x500/open | shelf-1 | box | -0.282..0.282 | 0.348143..0.366143 | -0.238..0.227 | side-left,side-right,back |
| @part | tall/600x2300x500/open | shelf-2 | box | -0.282..0.282 | 0.665286..0.683286 | -0.238..0.227 | side-left,side-right,back |
| @part | tall/600x2300x500/open | shelf-3 | box | -0.282..0.282 | 0.982429..1.000429 | -0.238..0.227 | side-left,side-right,back |
| @part | tall/600x2300x500/open | shelf-4 | box | -0.282..0.282 | 1.299571..1.317571 | -0.238..0.227 | side-left,side-right,back |
| @part | tall/600x2300x500/open | shelf-5 | box | -0.282..0.282 | 1.616714..1.634714 | -0.238..0.227 | side-left,side-right,back |
| @part | tall/600x2300x500/open | shelf-6 | box | -0.282..0.282 | 1.933857..1.951857 | -0.238..0.227 | side-left,side-right,back |
| @part | tall/600x2300x500/open | stile-1 | box | -0.009..0.009 | 0.098..2.282 | 0.209..0.227 | bottom,top |
| @part | tall/600x2300x500/open | door-0 | box | -0.293..-0.275 | 0.083..2.297 | 0.228..0.5235 | hinge-0,hinge-1 |
| @part | tall/600x2300x500/open | hinge-0 | box | -0.292..-0.276 | 0.14..0.18 | 0.227..0.249 | door-0,side-left |
| @part | tall/600x2300x500/open | hinge-1 | box | -0.292..-0.276 | 2.12..2.16 | 0.227..0.249 | door-0,side-left |
| @part | tall/600x2300x500/open | handle-0 | box | -0.293..-0.277 | 1.2207..1.3807 | 0.4625..0.4745 | door-0 |
| @part | tall/600x2300x500/open | door-1 | box | 0.275..0.293 | 0.083..2.297 | 0.228..0.5235 | hinge-2,hinge-3 |
| @part | tall/600x2300x500/open | hinge-2 | box | 0.276..0.292 | 0.14..0.18 | 0.227..0.249 | door-1,side-right |
| @part | tall/600x2300x500/open | hinge-3 | box | 0.276..0.292 | 2.12..2.16 | 0.227..0.249 | door-1,side-right |
| @part | tall/600x2300x500/open | handle-1 | box | 0.277..0.293 | 1.2207..1.3807 | 0.4625..0.4745 | door-1 |

@inventory tall/900x2650x600/closed: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, shelf-7, stile-1, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1

@void tall/900x2650x600/closed: shelf-1, -0.009..0.009, 0.35225..0.37025, 0.259..0.277
@void tall/900x2650x600/closed: shelf-2, -0.009..0.009, 0.6735..0.6915, 0.259..0.277
@void tall/900x2650x600/closed: shelf-3, -0.009..0.009, 0.99475..1.01275, 0.259..0.277
@void tall/900x2650x600/closed: shelf-4, -0.009..0.009, 1.316..1.334, 0.259..0.277
@void tall/900x2650x600/closed: shelf-5, -0.009..0.009, 1.63725..1.65525, 0.259..0.277
@void tall/900x2650x600/closed: shelf-6, -0.009..0.009, 1.9585..1.9765, 0.259..0.277
@void tall/900x2650x600/closed: shelf-7, -0.009..0.009, 2.27975..2.29775, 0.259..0.277
@void tall/900x2650x600/closed: door-0, -0.442..-0.426, 0.14..0.18, 0.282..0.299
@void tall/900x2650x600/closed: door-0, -0.442..-0.426, 2.47..2.51, 0.282..0.299
@void tall/900x2650x600/closed: door-0, -0.0625..-0.0505, 1.4132..1.5732, 0.284..0.3
@void tall/900x2650x600/closed: door-1, 0.426..0.442, 0.14..0.18, 0.282..0.299
@void tall/900x2650x600/closed: door-1, 0.426..0.442, 2.47..2.51, 0.282..0.299
@void tall/900x2650x600/closed: door-1, 0.0505..0.0625, 1.4132..1.5732, 0.284..0.3
@piece tall/900x2650x600/closed: hinge-0, -0.442..-0.426, 0.14..0.18, 0.277..0.282
@piece tall/900x2650x600/closed: hinge-0, -0.442..-0.426, 0.14..0.18, 0.282..0.299
@piece tall/900x2650x600/closed: hinge-1, -0.442..-0.426, 2.47..2.51, 0.277..0.282
@piece tall/900x2650x600/closed: hinge-1, -0.442..-0.426, 2.47..2.51, 0.282..0.299
@piece tall/900x2650x600/closed: hinge-2, 0.426..0.442, 0.14..0.18, 0.277..0.282
@piece tall/900x2650x600/closed: hinge-2, 0.426..0.442, 0.14..0.18, 0.282..0.299
@piece tall/900x2650x600/closed: hinge-3, 0.426..0.442, 2.47..2.51, 0.277..0.282
@piece tall/900x2650x600/closed: hinge-3, 0.426..0.442, 2.47..2.51, 0.282..0.299
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | tall/900x2650x600/closed | * | bounds | -0.45..0.45 | 0..2.65 | -0.3..0.3 | - |
| @part | tall/900x2650x600/closed | back | box | -0.45..0.45 | 0.08..2.632 | -0.3..-0.288 | toe,bottom,top |
| @part | tall/900x2650x600/closed | bottom | box | -0.45..0.45 | 0.08..0.098 | -0.288..0.277 | back,side-left,side-right |
| @part | tall/900x2650x600/closed | top | box | -0.45..0.45 | 2.632..2.65 | -0.3..0.277 | back,side-left,side-right |
| @part | tall/900x2650x600/closed | side-left | box | -0.45..-0.432 | 0.098..2.632 | -0.288..0.277 | back,bottom,top |
| @part | tall/900x2650x600/closed | side-right | box | 0.432..0.45 | 0.098..2.632 | -0.288..0.277 | back,bottom,top |
| @part | tall/900x2650x600/closed | toe | box | -0.45..0.45 | 0..0.08 | -0.3..0.25 | ground,back,bottom |
| @part | tall/900x2650x600/closed | shelf-1 | box | -0.432..0.432 | 0.35225..0.37025 | -0.288..0.277 | side-left,side-right,back |
| @part | tall/900x2650x600/closed | shelf-2 | box | -0.432..0.432 | 0.6735..0.6915 | -0.288..0.277 | side-left,side-right,back |
| @part | tall/900x2650x600/closed | shelf-3 | box | -0.432..0.432 | 0.99475..1.01275 | -0.288..0.277 | side-left,side-right,back |
| @part | tall/900x2650x600/closed | shelf-4 | box | -0.432..0.432 | 1.316..1.334 | -0.288..0.277 | side-left,side-right,back |
| @part | tall/900x2650x600/closed | shelf-5 | box | -0.432..0.432 | 1.63725..1.65525 | -0.288..0.277 | side-left,side-right,back |
| @part | tall/900x2650x600/closed | shelf-6 | box | -0.432..0.432 | 1.9585..1.9765 | -0.288..0.277 | side-left,side-right,back |
| @part | tall/900x2650x600/closed | shelf-7 | box | -0.432..0.432 | 2.27975..2.29775 | -0.288..0.277 | side-left,side-right,back |
| @part | tall/900x2650x600/closed | stile-1 | box | -0.009..0.009 | 0.098..2.632 | 0.259..0.277 | bottom,top |
| @part | tall/900x2650x600/closed | door-0 | box | -0.447..-0.0015 | 0.083..2.647 | 0.282..0.3 | hinge-0,hinge-1 |
| @part | tall/900x2650x600/closed | hinge-0 | box | -0.442..-0.426 | 0.14..0.18 | 0.277..0.299 | door-0,side-left |
| @part | tall/900x2650x600/closed | hinge-1 | box | -0.442..-0.426 | 2.47..2.51 | 0.277..0.299 | door-0,side-left |
| @part | tall/900x2650x600/closed | handle-0 | box | -0.0625..-0.0505 | 1.4132..1.5732 | 0.284..0.3 | door-0 |
| @part | tall/900x2650x600/closed | door-1 | box | 0.0015..0.447 | 0.083..2.647 | 0.282..0.3 | hinge-2,hinge-3 |
| @part | tall/900x2650x600/closed | hinge-2 | box | 0.426..0.442 | 0.14..0.18 | 0.277..0.299 | door-1,side-right |
| @part | tall/900x2650x600/closed | hinge-3 | box | 0.426..0.442 | 2.47..2.51 | 0.277..0.299 | door-1,side-right |
| @part | tall/900x2650x600/closed | handle-1 | box | 0.0505..0.0625 | 1.4132..1.5732 | 0.284..0.3 | door-1 |

@inventory tall/900x2650x600/open: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, shelf-7, stile-1, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1

@void tall/900x2650x600/open: shelf-1, -0.009..0.009, 0.35225..0.37025, 0.259..0.277
@void tall/900x2650x600/open: shelf-2, -0.009..0.009, 0.6735..0.6915, 0.259..0.277
@void tall/900x2650x600/open: shelf-3, -0.009..0.009, 0.99475..1.01275, 0.259..0.277
@void tall/900x2650x600/open: shelf-4, -0.009..0.009, 1.316..1.334, 0.259..0.277
@void tall/900x2650x600/open: shelf-5, -0.009..0.009, 1.63725..1.65525, 0.259..0.277
@void tall/900x2650x600/open: shelf-6, -0.009..0.009, 1.9585..1.9765, 0.259..0.277
@void tall/900x2650x600/open: shelf-7, -0.009..0.009, 2.27975..2.29775, 0.259..0.277
@void tall/900x2650x600/open: door-0, -0.442..-0.425, 0.14..0.18, 0.283..0.299
@void tall/900x2650x600/open: door-0, -0.443..-0.425, 0.14..0.18, 0.278..0.299
@void tall/900x2650x600/open: door-0, -0.442..-0.425, 2.47..2.51, 0.283..0.299
@void tall/900x2650x600/open: door-0, -0.443..-0.425, 2.47..2.51, 0.278..0.299
@void tall/900x2650x600/open: door-0, -0.443..-0.427, 1.4132..1.5732, 0.6625..0.6745
@void tall/900x2650x600/open: door-1, 0.425..0.442, 0.14..0.18, 0.283..0.299
@void tall/900x2650x600/open: door-1, 0.425..0.443, 0.14..0.18, 0.278..0.299
@void tall/900x2650x600/open: door-1, 0.425..0.442, 2.47..2.51, 0.283..0.299
@void tall/900x2650x600/open: door-1, 0.425..0.443, 2.47..2.51, 0.278..0.299
@void tall/900x2650x600/open: door-1, 0.427..0.443, 1.4132..1.5732, 0.6625..0.6745
@piece tall/900x2650x600/open: hinge-0, -0.442..-0.426, 0.14..0.18, 0.277..0.282
@piece tall/900x2650x600/open: hinge-0, -0.442..-0.426, 0.14..0.18, 0.282..0.299
@piece tall/900x2650x600/open: hinge-1, -0.442..-0.426, 2.47..2.51, 0.277..0.282
@piece tall/900x2650x600/open: hinge-1, -0.442..-0.426, 2.47..2.51, 0.282..0.299
@piece tall/900x2650x600/open: hinge-2, 0.426..0.442, 0.14..0.18, 0.277..0.282
@piece tall/900x2650x600/open: hinge-2, 0.426..0.442, 0.14..0.18, 0.282..0.299
@piece tall/900x2650x600/open: hinge-3, 0.426..0.442, 2.47..2.51, 0.277..0.282
@piece tall/900x2650x600/open: hinge-3, 0.426..0.442, 2.47..2.51, 0.282..0.299
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | tall/900x2650x600/open | * | bounds | -0.45..0.45 | 0..2.65 | -0.3..0.7235 | - |
| @part | tall/900x2650x600/open | back | box | -0.45..0.45 | 0.08..2.632 | -0.3..-0.288 | toe,bottom,top |
| @part | tall/900x2650x600/open | bottom | box | -0.45..0.45 | 0.08..0.098 | -0.288..0.277 | back,side-left,side-right |
| @part | tall/900x2650x600/open | top | box | -0.45..0.45 | 2.632..2.65 | -0.3..0.277 | back,side-left,side-right |
| @part | tall/900x2650x600/open | side-left | box | -0.45..-0.432 | 0.098..2.632 | -0.288..0.277 | back,bottom,top |
| @part | tall/900x2650x600/open | side-right | box | 0.432..0.45 | 0.098..2.632 | -0.288..0.277 | back,bottom,top |
| @part | tall/900x2650x600/open | toe | box | -0.45..0.45 | 0..0.08 | -0.3..0.25 | ground,back,bottom |
| @part | tall/900x2650x600/open | shelf-1 | box | -0.432..0.432 | 0.35225..0.37025 | -0.288..0.277 | side-left,side-right,back |
| @part | tall/900x2650x600/open | shelf-2 | box | -0.432..0.432 | 0.6735..0.6915 | -0.288..0.277 | side-left,side-right,back |
| @part | tall/900x2650x600/open | shelf-3 | box | -0.432..0.432 | 0.99475..1.01275 | -0.288..0.277 | side-left,side-right,back |
| @part | tall/900x2650x600/open | shelf-4 | box | -0.432..0.432 | 1.316..1.334 | -0.288..0.277 | side-left,side-right,back |
| @part | tall/900x2650x600/open | shelf-5 | box | -0.432..0.432 | 1.63725..1.65525 | -0.288..0.277 | side-left,side-right,back |
| @part | tall/900x2650x600/open | shelf-6 | box | -0.432..0.432 | 1.9585..1.9765 | -0.288..0.277 | side-left,side-right,back |
| @part | tall/900x2650x600/open | shelf-7 | box | -0.432..0.432 | 2.27975..2.29775 | -0.288..0.277 | side-left,side-right,back |
| @part | tall/900x2650x600/open | stile-1 | box | -0.009..0.009 | 0.098..2.632 | 0.259..0.277 | bottom,top |
| @part | tall/900x2650x600/open | door-0 | box | -0.443..-0.425 | 0.083..2.647 | 0.278..0.7235 | hinge-0,hinge-1 |
| @part | tall/900x2650x600/open | hinge-0 | box | -0.442..-0.426 | 0.14..0.18 | 0.277..0.299 | door-0,side-left |
| @part | tall/900x2650x600/open | hinge-1 | box | -0.442..-0.426 | 2.47..2.51 | 0.277..0.299 | door-0,side-left |
| @part | tall/900x2650x600/open | handle-0 | box | -0.443..-0.427 | 1.4132..1.5732 | 0.6625..0.6745 | door-0 |
| @part | tall/900x2650x600/open | door-1 | box | 0.425..0.443 | 0.083..2.647 | 0.278..0.7235 | hinge-2,hinge-3 |
| @part | tall/900x2650x600/open | hinge-2 | box | 0.426..0.442 | 0.14..0.18 | 0.277..0.299 | door-1,side-right |
| @part | tall/900x2650x600/open | hinge-3 | box | 0.426..0.442 | 2.47..2.51 | 0.277..0.299 | door-1,side-right |
| @part | tall/900x2650x600/open | handle-1 | box | 0.427..0.443 | 1.4132..1.5732 | 0.6625..0.6745 | door-1 |

@inventory vanity/1000x800x480/closed: back, bottom, top, side-left, side-right, toe, fixed-front, drawer-0, runner-0-left, runner-0-right, handle-0, drawer-1, runner-1-left, runner-1-right, handle-1

@void vanity/1000x800x480/closed: top, -0.36..0.36, 0.782..0.8, -0.145..0.195
@void vanity/1000x800x480/closed: fixed-front, -0.497..0.497, 0.127..0.373, 0.217..0.24
@void vanity/1000x800x480/closed: drawer-0, -0.08..0.08, 0.244..0.256, 0.224..0.24
@void vanity/1000x800x480/closed: fixed-front, -0.497..0.497, 0.447..0.693, 0.217..0.24
@void vanity/1000x800x480/closed: drawer-1, -0.08..0.08, 0.564..0.576, 0.224..0.24
@piece vanity/1000x800x480/closed: drawer-0, -0.494..0.494, 0.13..0.37, 0.222..0.24
@piece vanity/1000x800x480/closed: drawer-0, -0.479..0.479, 0.145..0.157, -0.22..0.222
@piece vanity/1000x800x480/closed: drawer-0, -0.479..-0.467, 0.157..0.36, -0.22..0.222
@piece vanity/1000x800x480/closed: drawer-0, 0.467..0.479, 0.157..0.36, -0.22..0.222
@piece vanity/1000x800x480/closed: drawer-0, -0.467..0.467, 0.157..0.36, -0.22..-0.208
@piece vanity/1000x800x480/closed: drawer-1, -0.494..0.494, 0.45..0.69, 0.222..0.24
@piece vanity/1000x800x480/closed: drawer-1, -0.479..0.479, 0.465..0.477, -0.22..0.222
@piece vanity/1000x800x480/closed: drawer-1, -0.479..-0.467, 0.477..0.68, -0.22..0.222
@piece vanity/1000x800x480/closed: drawer-1, 0.467..0.479, 0.477..0.68, -0.22..0.222
@piece vanity/1000x800x480/closed: drawer-1, -0.467..0.467, 0.477..0.68, -0.22..-0.208
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | vanity/1000x800x480/closed | * | bounds | -0.5..0.5 | 0..0.8 | -0.24..0.24 | - |
| @part | vanity/1000x800x480/closed | back | box | -0.5..0.5 | 0.08..0.782 | -0.24..-0.228 | toe,bottom,top |
| @part | vanity/1000x800x480/closed | bottom | box | -0.5..0.5 | 0.08..0.098 | -0.228..0.217 | back,side-left,side-right |
| @part | vanity/1000x800x480/closed | top | box | -0.5..0.5 | 0.782..0.8 | -0.24..0.217 | back,side-left,side-right |
| @part | vanity/1000x800x480/closed | side-left | box | -0.5..-0.482 | 0.098..0.782 | -0.228..0.217 | back,bottom,top |
| @part | vanity/1000x800x480/closed | side-right | box | 0.482..0.5 | 0.098..0.782 | -0.228..0.217 | back,bottom,top |
| @part | vanity/1000x800x480/closed | toe | box | -0.5..0.5 | 0..0.08 | -0.24..0.19 | ground,back,bottom |
| @part | vanity/1000x800x480/closed | fixed-front | box | -0.5..0.5 | 0.08..0.782 | 0.217..0.24 | side-left,side-right |
| @part | vanity/1000x800x480/closed | drawer-0 | hollow | -0.494..0.494 | 0.13..0.37 | -0.22..0.24 | runner-0-left,runner-0-right,handle-0 |
| @part | vanity/1000x800x480/closed | runner-0-left | box | -0.482..-0.479 | 0.157..0.169 | -0.22..0.217 | side-left,drawer-0 |
| @part | vanity/1000x800x480/closed | runner-0-right | box | 0.479..0.482 | 0.157..0.169 | -0.22..0.217 | side-right,drawer-0 |
| @part | vanity/1000x800x480/closed | handle-0 | box | -0.08..0.08 | 0.244..0.256 | 0.224..0.24 | drawer-0 |
| @part | vanity/1000x800x480/closed | drawer-1 | hollow | -0.494..0.494 | 0.45..0.69 | -0.22..0.24 | runner-1-left,runner-1-right,handle-1 |
| @part | vanity/1000x800x480/closed | runner-1-left | box | -0.482..-0.479 | 0.477..0.489 | -0.22..0.217 | side-left,drawer-1 |
| @part | vanity/1000x800x480/closed | runner-1-right | box | 0.479..0.482 | 0.477..0.489 | -0.22..0.217 | side-right,drawer-1 |
| @part | vanity/1000x800x480/closed | handle-1 | box | -0.08..0.08 | 0.564..0.576 | 0.224..0.24 | drawer-1 |

@inventory vanity/800x800x480/closed: back, bottom, top, side-left, side-right, toe, fixed-front, drawer-0, runner-0-left, runner-0-right, handle-0, drawer-1, runner-1-left, runner-1-right, handle-1

@void vanity/800x800x480/closed: top, -0.292..0.292, 0.782..0.8, -0.145..0.195
@void vanity/800x800x480/closed: fixed-front, -0.397..0.397, 0.127..0.373, 0.217..0.24
@void vanity/800x800x480/closed: drawer-0, -0.08..0.08, 0.244..0.256, 0.224..0.24
@void vanity/800x800x480/closed: fixed-front, -0.397..0.397, 0.447..0.693, 0.217..0.24
@void vanity/800x800x480/closed: drawer-1, -0.08..0.08, 0.564..0.576, 0.224..0.24
@piece vanity/800x800x480/closed: drawer-0, -0.394..0.394, 0.13..0.37, 0.222..0.24
@piece vanity/800x800x480/closed: drawer-0, -0.379..0.379, 0.145..0.157, -0.22..0.222
@piece vanity/800x800x480/closed: drawer-0, -0.379..-0.367, 0.157..0.36, -0.22..0.222
@piece vanity/800x800x480/closed: drawer-0, 0.367..0.379, 0.157..0.36, -0.22..0.222
@piece vanity/800x800x480/closed: drawer-0, -0.367..0.367, 0.157..0.36, -0.22..-0.208
@piece vanity/800x800x480/closed: drawer-1, -0.394..0.394, 0.45..0.69, 0.222..0.24
@piece vanity/800x800x480/closed: drawer-1, -0.379..0.379, 0.465..0.477, -0.22..0.222
@piece vanity/800x800x480/closed: drawer-1, -0.379..-0.367, 0.477..0.68, -0.22..0.222
@piece vanity/800x800x480/closed: drawer-1, 0.367..0.379, 0.477..0.68, -0.22..0.222
@piece vanity/800x800x480/closed: drawer-1, -0.367..0.367, 0.477..0.68, -0.22..-0.208
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | vanity/800x800x480/closed | * | bounds | -0.4..0.4 | 0..0.8 | -0.24..0.24 | - |
| @part | vanity/800x800x480/closed | back | box | -0.4..0.4 | 0.08..0.782 | -0.24..-0.228 | toe,bottom,top |
| @part | vanity/800x800x480/closed | bottom | box | -0.4..0.4 | 0.08..0.098 | -0.228..0.217 | back,side-left,side-right |
| @part | vanity/800x800x480/closed | top | box | -0.4..0.4 | 0.782..0.8 | -0.24..0.217 | back,side-left,side-right |
| @part | vanity/800x800x480/closed | side-left | box | -0.4..-0.382 | 0.098..0.782 | -0.228..0.217 | back,bottom,top |
| @part | vanity/800x800x480/closed | side-right | box | 0.382..0.4 | 0.098..0.782 | -0.228..0.217 | back,bottom,top |
| @part | vanity/800x800x480/closed | toe | box | -0.4..0.4 | 0..0.08 | -0.24..0.19 | ground,back,bottom |
| @part | vanity/800x800x480/closed | fixed-front | box | -0.4..0.4 | 0.08..0.782 | 0.217..0.24 | side-left,side-right |
| @part | vanity/800x800x480/closed | drawer-0 | hollow | -0.394..0.394 | 0.13..0.37 | -0.22..0.24 | runner-0-left,runner-0-right,handle-0 |
| @part | vanity/800x800x480/closed | runner-0-left | box | -0.382..-0.379 | 0.157..0.169 | -0.22..0.217 | side-left,drawer-0 |
| @part | vanity/800x800x480/closed | runner-0-right | box | 0.379..0.382 | 0.157..0.169 | -0.22..0.217 | side-right,drawer-0 |
| @part | vanity/800x800x480/closed | handle-0 | box | -0.08..0.08 | 0.244..0.256 | 0.224..0.24 | drawer-0 |
| @part | vanity/800x800x480/closed | drawer-1 | hollow | -0.394..0.394 | 0.45..0.69 | -0.22..0.24 | runner-1-left,runner-1-right,handle-1 |
| @part | vanity/800x800x480/closed | runner-1-left | box | -0.382..-0.379 | 0.477..0.489 | -0.22..0.217 | side-left,drawer-1 |
| @part | vanity/800x800x480/closed | runner-1-right | box | 0.379..0.382 | 0.477..0.489 | -0.22..0.217 | side-right,drawer-1 |
| @part | vanity/800x800x480/closed | handle-1 | box | -0.08..0.08 | 0.564..0.576 | 0.224..0.24 | drawer-1 |

@inventory wall/2900x980x360/closed: back, bottom, top, side-left, side-right, cleat-0, cleat-1, fixed-front-bottom, shelf-1, shelf-2, stile-1, stile-2, stile-3, stile-4, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1, door-2, hinge-4, hinge-5, handle-2, door-3, hinge-6, hinge-7, handle-3, door-4, hinge-8, hinge-9, handle-4

@void wall/2900x980x360/closed: shelf-1, -0.8781..-0.8601, 0.317667..0.335667, 0.139..0.157
@void wall/2900x980x360/closed: shelf-2, -0.8781..-0.8601, 0.644333..0.662333, 0.139..0.157
@void wall/2900x980x360/closed: shelf-1, -0.2987..-0.2807, 0.317667..0.335667, 0.139..0.157
@void wall/2900x980x360/closed: shelf-2, -0.2987..-0.2807, 0.644333..0.662333, 0.139..0.157
@void wall/2900x980x360/closed: shelf-1, 0.2807..0.2987, 0.317667..0.335667, 0.139..0.157
@void wall/2900x980x360/closed: shelf-2, 0.2807..0.2987, 0.644333..0.662333, 0.139..0.157
@void wall/2900x980x360/closed: shelf-1, 0.8601..0.8781, 0.317667..0.335667, 0.139..0.157
@void wall/2900x980x360/closed: shelf-2, 0.8601..0.8781, 0.644333..0.662333, 0.139..0.157
@void wall/2900x980x360/closed: door-0, -1.442..-1.426, 0.14..0.18, 0.162..0.179
@void wall/2900x980x360/closed: door-0, -1.442..-1.426, 0.8..0.84, 0.162..0.179
@void wall/2900x980x360/closed: door-0, -0.9316..-0.9196, 0.4947..0.6547, 0.164..0.18
@void wall/2900x980x360/closed: door-1, -0.3122..-0.2962, 0.14..0.18, 0.162..0.179
@void wall/2900x980x360/closed: door-1, -0.3122..-0.2962, 0.8..0.84, 0.162..0.179
@void wall/2900x980x360/closed: door-1, -0.8186..-0.8066, 0.4947..0.6547, 0.164..0.18
@void wall/2900x980x360/closed: door-2, -0.2832..-0.2672, 0.14..0.18, 0.162..0.179
@void wall/2900x980x360/closed: door-2, -0.2832..-0.2672, 0.8..0.84, 0.162..0.179
@void wall/2900x980x360/closed: door-2, 0.2272..0.2392, 0.4947..0.6547, 0.164..0.18
@void wall/2900x980x360/closed: door-3, 0.8466..0.8626, 0.14..0.18, 0.162..0.179
@void wall/2900x980x360/closed: door-3, 0.8466..0.8626, 0.8..0.84, 0.162..0.179
@void wall/2900x980x360/closed: door-3, 0.3402..0.3522, 0.4947..0.6547, 0.164..0.18
@void wall/2900x980x360/closed: door-4, 0.8756..0.8916, 0.14..0.18, 0.162..0.179
@void wall/2900x980x360/closed: door-4, 0.8756..0.8916, 0.8..0.84, 0.162..0.179
@void wall/2900x980x360/closed: door-4, 1.386..1.398, 0.4947..0.6547, 0.164..0.18
@piece wall/2900x980x360/closed: hinge-0, -1.442..-1.426, 0.14..0.18, 0.157..0.162
@piece wall/2900x980x360/closed: hinge-0, -1.442..-1.426, 0.14..0.18, 0.162..0.179
@piece wall/2900x980x360/closed: hinge-1, -1.442..-1.426, 0.8..0.84, 0.157..0.162
@piece wall/2900x980x360/closed: hinge-1, -1.442..-1.426, 0.8..0.84, 0.162..0.179
@piece wall/2900x980x360/closed: hinge-2, -0.3122..-0.2962, 0.14..0.18, 0.157..0.162
@piece wall/2900x980x360/closed: hinge-2, -0.3122..-0.2962, 0.14..0.18, 0.162..0.179
@piece wall/2900x980x360/closed: hinge-3, -0.3122..-0.2962, 0.8..0.84, 0.157..0.162
@piece wall/2900x980x360/closed: hinge-3, -0.3122..-0.2962, 0.8..0.84, 0.162..0.179
@piece wall/2900x980x360/closed: hinge-4, -0.2832..-0.2672, 0.14..0.18, 0.157..0.162
@piece wall/2900x980x360/closed: hinge-4, -0.2832..-0.2672, 0.14..0.18, 0.162..0.179
@piece wall/2900x980x360/closed: hinge-5, -0.2832..-0.2672, 0.8..0.84, 0.157..0.162
@piece wall/2900x980x360/closed: hinge-5, -0.2832..-0.2672, 0.8..0.84, 0.162..0.179
@piece wall/2900x980x360/closed: hinge-6, 0.8466..0.8626, 0.14..0.18, 0.157..0.162
@piece wall/2900x980x360/closed: hinge-6, 0.8466..0.8626, 0.14..0.18, 0.162..0.179
@piece wall/2900x980x360/closed: hinge-7, 0.8466..0.8626, 0.8..0.84, 0.157..0.162
@piece wall/2900x980x360/closed: hinge-7, 0.8466..0.8626, 0.8..0.84, 0.162..0.179
@piece wall/2900x980x360/closed: hinge-8, 0.8756..0.8916, 0.14..0.18, 0.157..0.162
@piece wall/2900x980x360/closed: hinge-8, 0.8756..0.8916, 0.14..0.18, 0.162..0.179
@piece wall/2900x980x360/closed: hinge-9, 0.8756..0.8916, 0.8..0.84, 0.157..0.162
@piece wall/2900x980x360/closed: hinge-9, 0.8756..0.8916, 0.8..0.84, 0.162..0.179
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | wall/2900x980x360/closed | * | bounds | -1.45..1.45 | 0..0.98 | -0.205..0.18 | - |
| @part | wall/2900x980x360/closed | back | box | -1.45..1.45 | 0..0.962 | -0.18..-0.168 | cleat-0,bottom,top |
| @part | wall/2900x980x360/closed | bottom | box | -1.45..1.45 | 0..0.018 | -0.168..0.157 | back,side-left,side-right |
| @part | wall/2900x980x360/closed | top | box | -1.45..1.45 | 0.962..0.98 | -0.18..0.157 | back,side-left,side-right |
| @part | wall/2900x980x360/closed | side-left | box | -1.45..-1.432 | 0.018..0.962 | -0.168..0.157 | back,bottom,top |
| @part | wall/2900x980x360/closed | side-right | box | 1.432..1.45 | 0.018..0.962 | -0.168..0.157 | back,bottom,top |
| @part | wall/2900x980x360/closed | cleat-0 | box | -1.37..-1.29 | 0.13..0.19 | -0.205..-0.18 | back,wall |
| @part | wall/2900x980x360/closed | cleat-1 | box | 1.29..1.37 | 0.13..0.19 | -0.205..-0.18 | back,wall |
| @part | wall/2900x980x360/closed | fixed-front-bottom | box | -1.45..1.45 | 0..0.083 | 0.157..0.18 | side-left,side-right,bottom |
| @part | wall/2900x980x360/closed | shelf-1 | box | -1.432..1.432 | 0.317667..0.335667 | -0.168..0.157 | side-left,side-right,back |
| @part | wall/2900x980x360/closed | shelf-2 | box | -1.432..1.432 | 0.644333..0.662333 | -0.168..0.157 | side-left,side-right,back |
| @part | wall/2900x980x360/closed | stile-1 | box | -0.8781..-0.8601 | 0.018..0.962 | 0.139..0.157 | bottom,top |
| @part | wall/2900x980x360/closed | stile-2 | box | -0.2987..-0.2807 | 0.018..0.962 | 0.139..0.157 | bottom,top |
| @part | wall/2900x980x360/closed | stile-3 | box | 0.2807..0.2987 | 0.018..0.962 | 0.139..0.157 | bottom,top |
| @part | wall/2900x980x360/closed | stile-4 | box | 0.8601..0.8781 | 0.018..0.962 | 0.139..0.157 | bottom,top |
| @part | wall/2900x980x360/closed | door-0 | box | -1.447..-0.8706 | 0.083..0.977 | 0.162..0.18 | hinge-0,hinge-1 |
| @part | wall/2900x980x360/closed | hinge-0 | box | -1.442..-1.426 | 0.14..0.18 | 0.157..0.179 | door-0,side-left |
| @part | wall/2900x980x360/closed | hinge-1 | box | -1.442..-1.426 | 0.8..0.84 | 0.157..0.179 | door-0,side-left |
| @part | wall/2900x980x360/closed | handle-0 | box | -0.9316..-0.9196 | 0.4947..0.6547 | 0.164..0.18 | door-0 |
| @part | wall/2900x980x360/closed | door-1 | box | -0.8676..-0.2912 | 0.083..0.977 | 0.162..0.18 | hinge-2,hinge-3 |
| @part | wall/2900x980x360/closed | hinge-2 | box | -0.3122..-0.2962 | 0.14..0.18 | 0.157..0.179 | door-1,stile-2 |
| @part | wall/2900x980x360/closed | hinge-3 | box | -0.3122..-0.2962 | 0.8..0.84 | 0.157..0.179 | door-1,stile-2 |
| @part | wall/2900x980x360/closed | handle-1 | box | -0.8186..-0.8066 | 0.4947..0.6547 | 0.164..0.18 | door-1 |
| @part | wall/2900x980x360/closed | door-2 | box | -0.2882..0.2882 | 0.083..0.977 | 0.162..0.18 | hinge-4,hinge-5 |
| @part | wall/2900x980x360/closed | hinge-4 | box | -0.2832..-0.2672 | 0.14..0.18 | 0.157..0.179 | door-2,stile-2 |
| @part | wall/2900x980x360/closed | hinge-5 | box | -0.2832..-0.2672 | 0.8..0.84 | 0.157..0.179 | door-2,stile-2 |
| @part | wall/2900x980x360/closed | handle-2 | box | 0.2272..0.2392 | 0.4947..0.6547 | 0.164..0.18 | door-2 |
| @part | wall/2900x980x360/closed | door-3 | box | 0.2912..0.8676 | 0.083..0.977 | 0.162..0.18 | hinge-6,hinge-7 |
| @part | wall/2900x980x360/closed | hinge-6 | box | 0.8466..0.8626 | 0.14..0.18 | 0.157..0.179 | door-3,stile-4 |
| @part | wall/2900x980x360/closed | hinge-7 | box | 0.8466..0.8626 | 0.8..0.84 | 0.157..0.179 | door-3,stile-4 |
| @part | wall/2900x980x360/closed | handle-3 | box | 0.3402..0.3522 | 0.4947..0.6547 | 0.164..0.18 | door-3 |
| @part | wall/2900x980x360/closed | door-4 | box | 0.8706..1.447 | 0.083..0.977 | 0.162..0.18 | hinge-8,hinge-9 |
| @part | wall/2900x980x360/closed | hinge-8 | box | 0.8756..0.8916 | 0.14..0.18 | 0.157..0.179 | door-4,stile-4 |
| @part | wall/2900x980x360/closed | hinge-9 | box | 0.8756..0.8916 | 0.8..0.84 | 0.157..0.179 | door-4,stile-4 |
| @part | wall/2900x980x360/closed | handle-4 | box | 1.386..1.398 | 0.4947..0.6547 | 0.164..0.18 | door-4 |

@inventory wall/2900x980x360/open: back, bottom, top, side-left, side-right, cleat-0, cleat-1, fixed-front-bottom, shelf-1, shelf-2, stile-1, stile-2, stile-3, stile-4, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1, door-2, hinge-4, hinge-5, handle-2, door-3, hinge-6, hinge-7, handle-3, door-4, hinge-8, hinge-9, handle-4

@void wall/2900x980x360/open: shelf-1, -0.8781..-0.8601, 0.317667..0.335667, 0.139..0.157
@void wall/2900x980x360/open: shelf-2, -0.8781..-0.8601, 0.644333..0.662333, 0.139..0.157
@void wall/2900x980x360/open: shelf-1, -0.2987..-0.2807, 0.317667..0.335667, 0.139..0.157
@void wall/2900x980x360/open: shelf-2, -0.2987..-0.2807, 0.644333..0.662333, 0.139..0.157
@void wall/2900x980x360/open: shelf-1, 0.2807..0.2987, 0.317667..0.335667, 0.139..0.157
@void wall/2900x980x360/open: shelf-2, 0.2807..0.2987, 0.644333..0.662333, 0.139..0.157
@void wall/2900x980x360/open: shelf-1, 0.8601..0.8781, 0.317667..0.335667, 0.139..0.157
@void wall/2900x980x360/open: shelf-2, 0.8601..0.8781, 0.644333..0.662333, 0.139..0.157
@void wall/2900x980x360/open: door-0, -1.442..-1.425, 0.14..0.18, 0.163..0.179
@void wall/2900x980x360/open: door-0, -1.443..-1.425, 0.14..0.18, 0.158..0.179
@void wall/2900x980x360/open: door-0, -1.442..-1.425, 0.8..0.84, 0.163..0.179
@void wall/2900x980x360/open: door-0, -1.443..-1.425, 0.8..0.84, 0.158..0.179
@void wall/2900x980x360/open: door-0, -1.443..-1.427, 0.4947..0.6547, 0.6734..0.6854
@void wall/2900x980x360/open: door-1, -0.3132..-0.2962, 0.14..0.18, 0.163..0.179
@void wall/2900x980x360/open: door-1, -0.3132..-0.2952, 0.14..0.18, 0.158..0.179
@void wall/2900x980x360/open: door-1, -0.3132..-0.2962, 0.8..0.84, 0.163..0.179
@void wall/2900x980x360/open: door-1, -0.3132..-0.2952, 0.8..0.84, 0.158..0.179
@void wall/2900x980x360/open: door-1, -0.3112..-0.2952, 0.4947..0.6547, 0.6734..0.6854
@void wall/2900x980x360/open: door-2, -0.2832..-0.2662, 0.14..0.18, 0.163..0.179
@void wall/2900x980x360/open: door-2, -0.2842..-0.2662, 0.14..0.18, 0.158..0.179
@void wall/2900x980x360/open: door-2, -0.2832..-0.2662, 0.8..0.84, 0.163..0.179
@void wall/2900x980x360/open: door-2, -0.2842..-0.2662, 0.8..0.84, 0.158..0.179
@void wall/2900x980x360/open: door-2, -0.2842..-0.2682, 0.4947..0.6547, 0.6734..0.6854
@void wall/2900x980x360/open: door-3, 0.8456..0.8626, 0.14..0.18, 0.163..0.179
@void wall/2900x980x360/open: door-3, 0.8456..0.8636, 0.14..0.18, 0.158..0.179
@void wall/2900x980x360/open: door-3, 0.8456..0.8626, 0.8..0.84, 0.163..0.179
@void wall/2900x980x360/open: door-3, 0.8456..0.8636, 0.8..0.84, 0.158..0.179
@void wall/2900x980x360/open: door-3, 0.8476..0.8636, 0.4947..0.6547, 0.6734..0.6854
@void wall/2900x980x360/open: door-4, 0.8756..0.8926, 0.14..0.18, 0.163..0.179
@void wall/2900x980x360/open: door-4, 0.8746..0.8926, 0.14..0.18, 0.158..0.179
@void wall/2900x980x360/open: door-4, 0.8756..0.8926, 0.8..0.84, 0.163..0.179
@void wall/2900x980x360/open: door-4, 0.8746..0.8926, 0.8..0.84, 0.158..0.179
@void wall/2900x980x360/open: door-4, 0.8746..0.8906, 0.4947..0.6547, 0.6734..0.6854
@piece wall/2900x980x360/open: hinge-0, -1.442..-1.426, 0.14..0.18, 0.157..0.162
@piece wall/2900x980x360/open: hinge-0, -1.442..-1.426, 0.14..0.18, 0.162..0.179
@piece wall/2900x980x360/open: hinge-1, -1.442..-1.426, 0.8..0.84, 0.157..0.162
@piece wall/2900x980x360/open: hinge-1, -1.442..-1.426, 0.8..0.84, 0.162..0.179
@piece wall/2900x980x360/open: hinge-2, -0.3122..-0.2962, 0.14..0.18, 0.157..0.162
@piece wall/2900x980x360/open: hinge-2, -0.3122..-0.2962, 0.14..0.18, 0.162..0.179
@piece wall/2900x980x360/open: hinge-3, -0.3122..-0.2962, 0.8..0.84, 0.157..0.162
@piece wall/2900x980x360/open: hinge-3, -0.3122..-0.2962, 0.8..0.84, 0.162..0.179
@piece wall/2900x980x360/open: hinge-4, -0.2832..-0.2672, 0.14..0.18, 0.157..0.162
@piece wall/2900x980x360/open: hinge-4, -0.2832..-0.2672, 0.14..0.18, 0.162..0.179
@piece wall/2900x980x360/open: hinge-5, -0.2832..-0.2672, 0.8..0.84, 0.157..0.162
@piece wall/2900x980x360/open: hinge-5, -0.2832..-0.2672, 0.8..0.84, 0.162..0.179
@piece wall/2900x980x360/open: hinge-6, 0.8466..0.8626, 0.14..0.18, 0.157..0.162
@piece wall/2900x980x360/open: hinge-6, 0.8466..0.8626, 0.14..0.18, 0.162..0.179
@piece wall/2900x980x360/open: hinge-7, 0.8466..0.8626, 0.8..0.84, 0.157..0.162
@piece wall/2900x980x360/open: hinge-7, 0.8466..0.8626, 0.8..0.84, 0.162..0.179
@piece wall/2900x980x360/open: hinge-8, 0.8756..0.8916, 0.14..0.18, 0.157..0.162
@piece wall/2900x980x360/open: hinge-8, 0.8756..0.8916, 0.14..0.18, 0.162..0.179
@piece wall/2900x980x360/open: hinge-9, 0.8756..0.8916, 0.8..0.84, 0.157..0.162
@piece wall/2900x980x360/open: hinge-9, 0.8756..0.8916, 0.8..0.84, 0.162..0.179
| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | wall/2900x980x360/open | * | bounds | -1.45..1.45 | 0..0.98 | -0.205..0.7344 | - |
| @part | wall/2900x980x360/open | back | box | -1.45..1.45 | 0..0.962 | -0.18..-0.168 | cleat-0,bottom,top |
| @part | wall/2900x980x360/open | bottom | box | -1.45..1.45 | 0..0.018 | -0.168..0.157 | back,side-left,side-right |
| @part | wall/2900x980x360/open | top | box | -1.45..1.45 | 0.962..0.98 | -0.18..0.157 | back,side-left,side-right |
| @part | wall/2900x980x360/open | side-left | box | -1.45..-1.432 | 0.018..0.962 | -0.168..0.157 | back,bottom,top |
| @part | wall/2900x980x360/open | side-right | box | 1.432..1.45 | 0.018..0.962 | -0.168..0.157 | back,bottom,top |
| @part | wall/2900x980x360/open | cleat-0 | box | -1.37..-1.29 | 0.13..0.19 | -0.205..-0.18 | back,wall |
| @part | wall/2900x980x360/open | cleat-1 | box | 1.29..1.37 | 0.13..0.19 | -0.205..-0.18 | back,wall |
| @part | wall/2900x980x360/open | fixed-front-bottom | box | -1.45..1.45 | 0..0.083 | 0.157..0.18 | side-left,side-right,bottom |
| @part | wall/2900x980x360/open | shelf-1 | box | -1.432..1.432 | 0.317667..0.335667 | -0.168..0.157 | side-left,side-right,back |
| @part | wall/2900x980x360/open | shelf-2 | box | -1.432..1.432 | 0.644333..0.662333 | -0.168..0.157 | side-left,side-right,back |
| @part | wall/2900x980x360/open | stile-1 | box | -0.8781..-0.8601 | 0.018..0.962 | 0.139..0.157 | bottom,top |
| @part | wall/2900x980x360/open | stile-2 | box | -0.2987..-0.2807 | 0.018..0.962 | 0.139..0.157 | bottom,top |
| @part | wall/2900x980x360/open | stile-3 | box | 0.2807..0.2987 | 0.018..0.962 | 0.139..0.157 | bottom,top |
| @part | wall/2900x980x360/open | stile-4 | box | 0.8601..0.8781 | 0.018..0.962 | 0.139..0.157 | bottom,top |
| @part | wall/2900x980x360/open | door-0 | box | -1.443..-1.425 | 0.083..0.977 | 0.158..0.7344 | hinge-0,hinge-1 |
| @part | wall/2900x980x360/open | hinge-0 | box | -1.442..-1.426 | 0.14..0.18 | 0.157..0.179 | door-0,side-left |
| @part | wall/2900x980x360/open | hinge-1 | box | -1.442..-1.426 | 0.8..0.84 | 0.157..0.179 | door-0,side-left |
| @part | wall/2900x980x360/open | handle-0 | box | -1.443..-1.427 | 0.4947..0.6547 | 0.6734..0.6854 | door-0 |
| @part | wall/2900x980x360/open | door-1 | box | -0.3132..-0.2952 | 0.083..0.977 | 0.158..0.7344 | hinge-2,hinge-3 |
| @part | wall/2900x980x360/open | hinge-2 | box | -0.3122..-0.2962 | 0.14..0.18 | 0.157..0.179 | door-1,stile-2 |
| @part | wall/2900x980x360/open | hinge-3 | box | -0.3122..-0.2962 | 0.8..0.84 | 0.157..0.179 | door-1,stile-2 |
| @part | wall/2900x980x360/open | handle-1 | box | -0.3112..-0.2952 | 0.4947..0.6547 | 0.6734..0.6854 | door-1 |
| @part | wall/2900x980x360/open | door-2 | box | -0.2842..-0.2662 | 0.083..0.977 | 0.158..0.7344 | hinge-4,hinge-5 |
| @part | wall/2900x980x360/open | hinge-4 | box | -0.2832..-0.2672 | 0.14..0.18 | 0.157..0.179 | door-2,stile-2 |
| @part | wall/2900x980x360/open | hinge-5 | box | -0.2832..-0.2672 | 0.8..0.84 | 0.157..0.179 | door-2,stile-2 |
| @part | wall/2900x980x360/open | handle-2 | box | -0.2842..-0.2682 | 0.4947..0.6547 | 0.6734..0.6854 | door-2 |
| @part | wall/2900x980x360/open | door-3 | box | 0.8456..0.8636 | 0.083..0.977 | 0.158..0.7344 | hinge-6,hinge-7 |
| @part | wall/2900x980x360/open | hinge-6 | box | 0.8466..0.8626 | 0.14..0.18 | 0.157..0.179 | door-3,stile-4 |
| @part | wall/2900x980x360/open | hinge-7 | box | 0.8466..0.8626 | 0.8..0.84 | 0.157..0.179 | door-3,stile-4 |
| @part | wall/2900x980x360/open | handle-3 | box | 0.8476..0.8636 | 0.4947..0.6547 | 0.6734..0.6854 | door-3 |
| @part | wall/2900x980x360/open | door-4 | box | 0.8746..0.8926 | 0.083..0.977 | 0.158..0.7344 | hinge-8,hinge-9 |
| @part | wall/2900x980x360/open | hinge-8 | box | 0.8756..0.8916 | 0.14..0.18 | 0.157..0.179 | door-4,stile-4 |
| @part | wall/2900x980x360/open | hinge-9 | box | 0.8756..0.8916 | 0.8..0.84 | 0.157..0.179 | door-4,stile-4 |
| @part | wall/2900x980x360/open | handle-4 | box | 0.8746..0.8906 | 0.4947..0.6547 | 0.6734..0.6854 | door-4 |
<!-- @generated-cabinet-parts:end -->

<!-- @authored-address-state:start -->
@address-state bench-base/1150x440x480/closed: back, bottom, top, side-left, side-right, toe, shelf-1, stile-1, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1
@address-state bench-base/1150x440x480/open: back, bottom, top, side-left, side-right, toe, shelf-1, stile-1, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1
@address-state island-base/880x870x2650/closed: bottom, top, toe, end-negative, end-positive, dining-side, service-strip-bottom, service-strip-top, shelf-1, shelf-2, service-stile-1, service-stile-2, service-stile-3, service-stile-4, service-door-0, service-hinge-0, service-hinge-1, service-handle-0, service-door-1, service-hinge-2, service-hinge-3, service-handle-1, service-door-2, service-hinge-4, service-hinge-5, service-handle-2, service-door-3, service-hinge-6, service-hinge-7, service-handle-3, service-door-4, service-hinge-8, service-hinge-9, service-handle-4
@address-state island-base/880x870x2650/open: bottom, top, toe, end-negative, end-positive, dining-side, service-strip-bottom, service-strip-top, shelf-1, shelf-2, service-stile-1, service-stile-2, service-stile-3, service-stile-4, service-door-0, service-hinge-0, service-hinge-1, service-handle-0, service-door-1, service-hinge-2, service-hinge-3, service-handle-1, service-door-2, service-hinge-4, service-hinge-5, service-handle-2, service-door-3, service-hinge-6, service-hinge-7, service-handle-3, service-door-4, service-hinge-8, service-hinge-9, service-handle-4
@address-state kitchen-base/2900x870x620/closed: back, bottom, top, side-left, side-right, toe, fixed-front, bay-divider-left, bay-divider-right, oven-sill, drawer-0, handle-0, drawer-1, handle-1, drawer-2, handle-2, drawer-3, handle-3, drawer-4, handle-4, drawer-5, handle-5
@address-state media/2000x440x350/closed: back, bottom, top, side-left, side-right, toe, fixed-front, bay-divider-left, bay-divider-right, drawer-0, handle-0, drawer-1, handle-1
@address-state nightstand/500x460x460/closed: back, bottom, top, side-left, side-right, toe, fixed-front, drawer-0, runner-0-left, runner-0-right, handle-0, drawer-1, runner-1-left, runner-1-right, handle-1
@address-state open-shelf/1100x2600x500/open: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, shelf-7
@address-state open-shelf/1550x2500x500/open: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, shelf-7
@address-state open-shelf/600x1100x380/open: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2
@address-state open-shelf/750x1200x400/open: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3
@address-state open-shelf/850x2400x450/open: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6
@address-state open-shelf/950x1350x250/open: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3
@address-state service/1100x2400x560/closed: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, stile-1, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1
@address-state service/1100x2400x560/open: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, stile-1, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1
@address-state service/640x840x600/closed: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, stile-1, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1
@address-state service/640x840x600/open: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, stile-1, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1
@address-state tall/1300x2650x600/closed: back, bottom, top, side-left, side-right, toe, divider, rod, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, shelf-7, stile-1, stile-2, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1, door-2, hinge-4, hinge-5, handle-2
@address-state tall/1300x2650x600/open: back, bottom, top, side-left, side-right, toe, divider, rod, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, shelf-7, stile-1, stile-2, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1, door-2, hinge-4, hinge-5, handle-2
@address-state tall/1400x2600x540/closed: back, bottom, top, side-left, side-right, toe, divider, rod, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, shelf-7, stile-1, stile-2, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1, door-2, hinge-4, hinge-5, handle-2
@address-state tall/1400x2600x540/open: back, bottom, top, side-left, side-right, toe, divider, rod, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, shelf-7, stile-1, stile-2, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1, door-2, hinge-4, hinge-5, handle-2
@address-state tall/2720x2650x600/closed: back, bottom, top, side-left, side-right, toe, divider, rod, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, shelf-7, stile-1, stile-2, stile-3, stile-4, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1, door-2, hinge-4, hinge-5, handle-2, door-3, hinge-6, hinge-7, handle-3, door-4, hinge-8, hinge-9, handle-4
@address-state tall/2720x2650x600/open: back, bottom, top, side-left, side-right, toe, divider, rod, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, shelf-7, stile-1, stile-2, stile-3, stile-4, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1, door-2, hinge-4, hinge-5, handle-2, door-3, hinge-6, hinge-7, handle-3, door-4, hinge-8, hinge-9, handle-4
@address-state tall/520x2250x520/closed: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, stile-1, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1
@address-state tall/520x2250x520/open: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, stile-1, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1
@address-state tall/600x2300x500/closed: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, stile-1, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1
@address-state tall/600x2300x500/open: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, stile-1, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1
@address-state tall/900x2650x600/closed: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, shelf-7, stile-1, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1
@address-state tall/900x2650x600/open: back, bottom, top, side-left, side-right, toe, shelf-1, shelf-2, shelf-3, shelf-4, shelf-5, shelf-6, shelf-7, stile-1, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1
@address-state vanity/1000x800x480/closed: back, bottom, top, side-left, side-right, toe, fixed-front, drawer-0, runner-0-left, runner-0-right, handle-0, drawer-1, runner-1-left, runner-1-right, handle-1
@address-state vanity/800x800x480/closed: back, bottom, top, side-left, side-right, toe, fixed-front, drawer-0, runner-0-left, runner-0-right, handle-0, drawer-1, runner-1-left, runner-1-right, handle-1
@address-state wall/2900x980x360/closed: back, bottom, top, side-left, side-right, cleat-0, cleat-1, fixed-front-bottom, shelf-1, shelf-2, stile-1, stile-2, stile-3, stile-4, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1, door-2, hinge-4, hinge-5, handle-2, door-3, hinge-6, hinge-7, handle-3, door-4, hinge-8, hinge-9, handle-4
@address-state wall/2900x980x360/open: back, bottom, top, side-left, side-right, cleat-0, cleat-1, fixed-front-bottom, shelf-1, shelf-2, stile-1, stile-2, stile-3, stile-4, door-0, hinge-0, hinge-1, handle-0, door-1, hinge-2, hinge-3, handle-1, door-2, hinge-4, hinge-5, handle-2, door-3, hinge-6, hinge-7, handle-3, door-4, hinge-8, hinge-9, handle-4
<!-- @authored-address-state:end -->

## 현관 벤치와 신발장 {#entry-bench}

이 wrapper의 단독 부품은 방석 하나다. `support@0.44`는 별도 cabinet/bench-base의 상단 접촉면이며 cabinet 판을 이 부품 표에 복제하지 않는다.

@compose default: cabinet-and-shelf, bench-base/1150x440x480/closed, 0, 0, 0
@scalar-control cushion-front-projection: 0.01

@inventory default: cushion

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | default | * | bounds | -0.575..0.575 | 0..0.52 | -0.24..0.25 | - |
| @part | default | cushion | box | -0.575..0.575 | 0.44..0.52 | -0.24..0.25 | support@0.44 |

`entry-bench`는 폭 1.15, 외함 깊이 0.48, 방석 앞 돌출을 포함한 전체 깊이 0.49, 전체 높이 0.52m다. 바닥 외함 중심이 원점, +Z가 앉는 앞이다. `cabinet/bench-base/1150x440x480/closed`의 두 문 외함 위에 두께 0.08m 방석을 얹어 상면 y=0.52를 만든다. 방석은 z 앞쪽으로 0.01m만 돌출하며 문 seam·손잡이 높이를 가리지 않는다. `entry-bench` wrapper는 `cushion/upper/side/underside`만 만들고, 외함은 독립 `cabinet/bench-base/1150x440x480/closed`의 back·side·door·edge 주소를 그대로 운반한다. wrapper가 외함 판을 복제하거나 새 표면 ID로 바꾸지 않는다. 정면·측면·45°에서 수납 두 leaf와 착석 면이 함께 보여야 한다. ref02 현관의 벤치·신발장 기능을 채택하며 ref01의 바깥 포치를 벤치 형태로 옮기지 않는다. ref03·04·05에는 현관 벤치를 판독할 세부가 없다. 착석 하중·문 간섭은 `unverified`다.

<!-- @authored-address-state:start -->
@address-state default: cushion
<!-- @authored-address-state:end -->

## 현관 평벽 충전 선반 {#entry-charging-shelf}

`entry-charging-shelf`는 폭 0.32, 깊이 0.15, 몸판 두께 0.045m의 벽걸이 물체다. 원점은 평벽 마감면의 선반 아래 중앙(z=0)이며 +Z가 벽에서 실내로 나오는 방향, +Y가 위다. 판은 x=±0.16, y=0..0.045, z=0..0.15이고 뒤쪽 숨은 cleat는 0.22×0.030×0.025m로 x=±0.11,y=-0.030..0,z=0..0.025에 놓여 벽면과 판 아래면에 닿는다. 양 끝 아래의 지지 브래킷 둘은 두께 0.012m, 깊이 0.12m, 높이 0.08m이며 x=±0.125 중심,y=-0.08..0,z=0..0.12다. 각 브래킷은 z=0에서 평벽, y=0에서 판 아래면에 닿고 cleat와 x에서 겹치지 않는다. 우편을 올리는 상면은 평평하고 충전기 자리는 후속 배치다. `board/upper/underside/front-edge/side-left/side-right/back-contact`, `cleat/outer/contact`, `bracket-left/right/outer/contact`가 안정 주소다. 실제 건축 구멍이나 lining을 만들지 않는다. 정면·측면·상부에서 판 깊이와 평벽 접합이 읽혀야 한다. ref02의 현관 수납 기능과 settings의 건축 구멍 없는 선반 결정을 채택한다. ref01·03·04·05의 벽 장면을 충전 niche의 증거로 쓰지 않는다. 실제 앵커 하중은 `unverified`다.

@prose-part 판: board
@prose-part 브래킷: bracket-*
@prose-part cleat: cleat
@prose-part 지지 브래킷 둘은: bracket-*
@inventory default: board, cleat, bracket-left, bracket-right

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | default | * | bounds | -0.16..0.16 | -0.08..0.045 | 0..0.15 | - |
| @part | default | board | box | -0.16..0.16 | 0..0.045 | 0..0.15 | cleat,bracket-left,bracket-right |
| @part | default | cleat | box | -0.11..0.11 | -0.03..0 | 0..0.025 | wall,board |
| @part | default | bracket-left | box | -0.131..-0.119 | -0.08..0 | 0..0.12 | wall,board |
| @part | default | bracket-right | box | 0.119..0.131 | -0.08..0 | 0..0.12 | wall,board |

<!-- @authored-address-state:start -->
@address-state default: board, cleat, bracket-left, bracket-right
<!-- @authored-address-state:end -->

## 고정 침대와 침구 {#fixed-bed}

@axis-control 1800: duvet, Z, 0.99, foot fold start
@axis-control 1000: duvet, Z, 0.99, foot fold start

`fixed-bed/1800`은 1.80m 매트리스와 베개 둘, `fixed-bed/1000`은 1.00m 매트리스와 베개 하나다. 매트리스 길이 2.02m, 프레임 외곽은 폭 W+0.08·깊이 2.18·최고 1.01m다. 바닥 중심 원점, +Z는 발치다. 네 다리는 단면 0.045×0.045m이고 중심 x=±(W/2+0.0175), z=±1.03, y=0..0.08이다. 각 다리 상면은 측면 rail과 머리 또는 발치 rail의 아래면을 각각 0.0225m Z 길이의 유한 면으로 받친다. 프레임의 측면 rail은 x=±(W/2+0.015..W/2+0.04), z=−1.03..+1.03, y=0.08..0.28이고, 머리·발치 rail은 x=±(W/2+0.04), z=−1.09..−1.03과 +1.03..+1.09, y=0.08..0.28이다. 이 네 rail은 겹치는 모서리 부피 없이 면으로 만나며 다리 상면과 면 접촉한다. `support-deck`은 x=±(W/2+0.015), z=−1.03..+1.03, y=0.26..0.28인 두께 0.02m의 닫힌 지지판이다. 네 rail의 안쪽 수직 면에 접하고 매트리스 아래면 y=0.28을 받는다. 지지판은 외곽 rail 아래 0.18m 틈의 윗부분에만 있으며 다리 사이의 바닥을 막지 않는다. 매트리스는 x=±W/2,z=−1.01..+1.01,y=0.28..0.50, 이불은 x=±(W/2−0.03),y=0.50..0.56에서 z=−0.40..+1.02를 덮는다. 머리판은 x=±(W/2+0.04),z=−1.09..−1.03,y=0.28..1.01로 머리 rail의 상면에 접하고 발치의 0.03m 접힘 표시는 단일 `duvet` 부품의 상부 앞쪽 z=0.99..1.02m인 `duvet/fold-edge` 표면 영역으로 나타내며 별도 고체 부품을 만들지 않는다. 베개는 각각 폭 (W−0.18)/개수, 깊이 0.38, 높이 0.12m로 중심 z=−0.76, y=0.56(상면 0.62)에 놓인다. 두 베개 변종의 중심 x는 ±((W−0.18)/4+0.02)라 사이 틈이 0.04m이고, 한 베개 변종의 중심 x는 0이다.

안정 주소는 `frame-side-left/right/outer/inner/edge`, `frame-head/foot/outer/inner/edge`, `support-deck/upper/underside/edge`, `leg-0..3/shaft/top/sole`, `mattress/upper/side/underside`, `duvet/upper/fold-edge/edge/underside`, `headboard/front/back/edge`, `pillow-0..1/upper/edge/underside`다. 각 베개의 사용 여부는 ID 폭 변종으로 고정하고 소스의 blanket 색 문자열은 재료 ID가 아니다. 상부·발치·측면·45°에서 침대 폭, 머리판, 바닥 틈, 베개 수와 접힌 이불 끝을 확인한다. ref02의 세 침실 침대·침구와 ref05의 문 뒤 사적 구역 관계를 채택하며 ref05 복도 사진에서 침대 치수를 역산하지 않는다. ref01·03·04는 고정 침대 형상 근거가 아니다. 인체 누운 자세와 섬유 변형은 `unverified`다.

침대 폭 변종별 닫힌 부품의 점유와 지지면은 다음 표가 고정한다. rail 네 장 사이의 `support-deck`은 매트리스가 공중에 뜨지 않게 한다. `fixed-bed/1800`과 `fixed-bed/1000`에서 베개 수만 다르고 rail·다리 접촉 규칙은 같다.

@scalar-control leg-x-inset: 0.0175
@scalar-control side-rail-x-inset: 0.015
@scalar-control pillow-top: 0.62

@prose-part 측면 rail은: frame-side-*
@prose-part 머리·발치 rail은: frame-*
@prose-part 매트리스는: mattress
@prose-part 이불은: duvet
@prose-part support-deck: support-deck
@prose-part 네 다리는: leg-*
@prose-part 머리판은: headboard
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
| @part | 1800 | leg-0 | box | -0.94..-0.895 | 0..0.08 | -1.0525..-1.0075 | ground,frame-side-left,frame-head |
| @part | 1800 | leg-1 | box | -0.94..-0.895 | 0..0.08 | 1.0075..1.0525 | ground,frame-side-left,frame-foot |
| @part | 1800 | leg-2 | box | 0.895..0.94 | 0..0.08 | -1.0525..-1.0075 | ground,frame-side-right,frame-head |
| @part | 1800 | leg-3 | box | 0.895..0.94 | 0..0.08 | 1.0075..1.0525 | ground,frame-side-right,frame-foot |
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
| @part | 1000 | leg-0 | box | -0.54..-0.495 | 0..0.08 | -1.0525..-1.0075 | ground,frame-side-left,frame-head |
| @part | 1000 | leg-1 | box | -0.54..-0.495 | 0..0.08 | 1.0075..1.0525 | ground,frame-side-left,frame-foot |
| @part | 1000 | leg-2 | box | 0.495..0.54 | 0..0.08 | -1.0525..-1.0075 | ground,frame-side-right,frame-head |
| @part | 1000 | leg-3 | box | 0.495..0.54 | 0..0.08 | 1.0075..1.0525 | ground,frame-side-right,frame-foot |
| @part | 1000 | mattress | box | -0.50..0.50 | 0.28..0.50 | -1.01..1.01 | support-deck,duvet,pillow-0 |
| @part | 1000 | duvet | box | -0.47..0.47 | 0.50..0.56 | -0.40..1.02 | mattress |
| @part | 1000 | headboard | box | -0.54..0.54 | 0.28..1.01 | -1.09..-1.03 | frame-head |
| @part | 1000 | pillow-0 | box | -0.41..0.41 | 0.50..0.62 | -0.95..-0.57 | mattress |

<!-- @authored-address-state:start -->
@address-state 1800: frame-side-left, frame-side-right, frame-head, frame-foot, support-deck, leg-0, leg-1, leg-2, leg-3, mattress, duvet, headboard, pillow-0, pillow-1
@address-state 1000: frame-side-left, frame-side-right, frame-head, frame-foot, support-deck, leg-0, leg-1, leg-2, leg-3, mattress, duvet, headboard, pillow-0
<!-- @authored-address-state:end -->

## 작업실 수납 침대 {#murphy-bed}

@prose-dim 손잡이: pull

외함 뒤판의 상단은 y=2.32m에서 끝나 상판 아랫면과 접한다. 힌지 축의 원통형 recess는 아래 `@bore-x`의 X 구간·YZ 중심·반지름만 절삭한다. 힌지 AABB를 감싸는 직사각형은 절삭하지 않으며 원통 밖 모서리에는 측판 재료가 남는다. guest 베개는 중심 y=0.655m라 아래면이 매트리스 y=0.60m에 닿는다. XZ 네 모서리는 반지름 min(H/2,W/12,D/12)의 여섯 호 구간으로 둥글리고 y=0.60의 중앙 밑면과 y=0.71의 중앙 윗면은 평평하게 닫는다. 아래 `@flat-contact`의 XZ 직사각형은 둥근 모서리에서 안쪽으로 떨어져 매트리스와 유한 면으로 접한다.

@inventory work: case-back, case-side-left, case-side-right, case-top, hinge-left, hinge-right, closed-panel, pull
@inventory guest: case-back, case-side-left, case-side-right, case-top, hinge-left, hinge-right, bed-frame, mattress, support-left, support-right, duvet, pillow
@flat-contact guest: pillow, mattress, -Y, 0.60, -0.30..0.30, 0.38..0.62
@pin-face work: hinge-left, closed-panel
@pin-face work: hinge-right, closed-panel
@pin-face guest: hinge-left, bed-frame
@pin-face guest: hinge-right, bed-frame
@bore-x work: case-side-left, -0.65..-0.605, 0.32, 0.205, 0.025
@bore-x work: case-side-right, 0.605..0.65, 0.32, 0.205, 0.025
@bore-x guest: case-side-left, -0.65..-0.605, 0.32, 0.205, 0.025
@bore-x guest: case-side-right, 0.605..0.65, 0.32, 0.205, 0.025
@flat-contact work: case-side-left, case-back, -Z, -0.205, -0.65..-0.605, 1.0..1.1
@flat-contact work: case-top, case-side-left, -Y, 2.32, -0.65..-0.605, -0.18..-0.10
@flat-contact work: case-side-right, case-back, -Z, -0.205, 0.605..0.65, 1.0..1.1
@flat-contact work: case-top, case-side-right, -Y, 2.32, 0.605..0.65, -0.18..-0.10
@flat-contact guest: case-side-left, case-back, -Z, -0.205, -0.65..-0.605, 1.0..1.1
@flat-contact guest: case-top, case-side-left, -Y, 2.32, -0.65..-0.605, -0.18..-0.10
@flat-contact guest: case-side-right, case-back, -Z, -0.205, 0.605..0.65, 1.0..1.1
@flat-contact guest: case-top, case-side-right, -Y, 2.32, 0.605..0.65, -0.18..-0.10

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | work | * | bounds | -0.65..0.65 | 0..2.36 | -0.23..0.27 | - |
| @part | work | case-back | box | -0.65..0.65 | 0..2.32 | -0.23..-0.205 | ground,case-side-left,case-top |
| @part | work | case-side-left | hollow | -0.65..-0.605 | 0..2.32 | -0.205..0.23 | ground,case-back,case-top,hinge-left |
| @part | work | case-side-right | hollow | 0.605..0.65 | 0..2.32 | -0.205..0.23 | ground,case-back,case-top,hinge-right |
| @part | work | case-top | box | -0.65..0.65 | 2.32..2.36 | -0.23..0.23 | case-back,case-side-left,closed-panel |
| @part | work | hinge-left | cylinder | -0.65..-0.60 | 0.295..0.345 | 0.18..0.23 | case-side-left,closed-panel |
| @part | work | hinge-right | cylinder | 0.60..0.65 | 0.295..0.345 | 0.18..0.23 | case-side-right,closed-panel |
| @part | work | closed-panel | box | -0.60..0.60 | 0.04..2.32 | 0.21..0.245 | hinge-left,hinge-right,case-top,pull |
| @part | work | pull | box | -0.16..0.16 | 1.0175..1.0425 | 0.245..0.27 | closed-panel |
| @envelope | guest | * | bounds | -0.65..0.65 | 0..2.36 | -0.23..2.18 | - |
| @part | guest | case-back | box | -0.65..0.65 | 0..2.32 | -0.23..-0.205 | ground,case-side-left,case-top |
| @part | guest | case-side-left | hollow | -0.65..-0.605 | 0..2.32 | -0.205..0.23 | ground,case-back,case-top,hinge-left |
| @part | guest | case-side-right | hollow | 0.605..0.65 | 0..2.32 | -0.205..0.23 | ground,case-back,case-top,hinge-right |
| @part | guest | case-top | box | -0.65..0.65 | 2.32..2.36 | -0.23..0.23 | case-back,case-side-left |
| @part | guest | hinge-left | cylinder | -0.65..-0.60 | 0.295..0.345 | 0.18..0.23 | case-side-left,bed-frame |
| @part | guest | hinge-right | cylinder | 0.60..0.65 | 0.295..0.345 | 0.18..0.23 | case-side-right,bed-frame |
| @part | guest | bed-frame | box | -0.60..0.60 | 0.32..0.44 | 0.22..2.18 | hinge-left,hinge-right,mattress,support-left |
| @part | guest | mattress | box | -0.55..0.55 | 0.44..0.60 | 0.27..2.09 | bed-frame,duvet,pillow |
| @part | guest | support-left | box | -0.5425..-0.4975 | 0..0.32 | 2.0575..2.1025 | ground,bed-frame |
| @part | guest | support-right | box | 0.4975..0.5425 | 0..0.32 | 2.0575..2.1025 | ground,bed-frame |
| @part | guest | duvet | box | -0.54..0.54 | 0.60..0.655 | 0.72..2.02 | mattress |
| @part | guest | pillow | curved | -0.36..0.36 | 0.60..0.71 | 0.33..0.67 | mattress |

`murphy-bed`는 명시 상태 `work` 또는 `guest`를 받는다. 바닥 외함 중심 원점, +Z가 방 안쪽이다. 외함은 폭 1.30, 높이 2.36, 깊이 0.46m로 x=±0.65, z=±0.23이며 두 상태에서 같다. 뒤판 두께 0.025m는 z=-0.23..-0.205, 측판 두께 0.045m는 x=−0.65..−0.605와 +0.605..+0.65, y=0..2.32,z=−0.205..+0.23이고 상판 두께 0.04m는 y=2.32..2.36,z=−0.23..+0.23이다. pivot은 양쪽 x=±0.625, y=0.32, z=0.205의 동일 X축 한 줄이며 각 힌지는 지름 0.05m, X축 길이 0.05m의 닫힌 부품이다. 측판에는 각 힌지의 x=±(0.60..0.65), y=0.295..0.345, z=0.18..0.23 점유를 따라 닫힌 원통형 recess를 빼고 접촉 edge를 남긴다. 각 힌지의 X축 끝 원판 x=±0.60은 세로 panel 측면과 손님 프레임의 옆면에 닿는다. 손님 프레임은 z=0.22부터 시작하므로 원판 중심 z=0.205·반경 0.025와 y≥0.32,z≥0.22인 프레임 옆면의 교집합이 양의 면적이다. z=0.23의 접선만으로 지지하지 않는다. 작업 상태의 세로 panel은 폭 1.20, 높이 2.28, 두께 0.035m로 x=±0.60,y=0.04..2.32,z=0.21..0.245에 닫힌다. 손잡이 0.32×0.025×0.025m는 아래 `@part work pull` 행의 X·Y·Z 범위에 보이며 작업·손님 상태의 전체 AABB는 각각 아래 `@envelope work`와 `@envelope guest` 행이 소유한다. 손님 상태의 수평 프레임은 pivot에서 +Z로 뻗어 외함 전면 근처 z=0.22부터 발치 z=2.18까지, 폭 1.20m·두께 0.12m로 y=0.32..0.44에 놓인다. 매트리스는 폭 1.10, 길이 1.82, 두께 0.16m로 z=0.27..2.09,y=0.44..0.60이다. 접지 지지 다리 두 개는 단면 0.045×0.045m, 중심 x=±0.52, z=2.08, y=0..0.32에 세워 프레임 아래면 y=0.32에서 끝내며 프레임 부피를 관통하지 않는다. 손님 침대에는 폭 1.08·길이 1.30·두께 0.055m의 이불을 y=0.60..0.655, z=0.72..2.02에, 폭 0.72·깊이 0.34·높이 0.11m의 베개 하나를 중심 z=0.50, y=0.655에 둔다. 별도 머리판은 외함의 내부 뒤판이 대신한다. 닫힌 panel과 펼친 frame·매트리스·침구는 동시에 나타나지 않는다. 실제 중간 회전 경로·잠금·하중은 `unverified`다.

공유 주소는 `case-back/front/back/edge`, `case-side-left/right/outer/inner/front-edge/back-edge/top/sole`, `case-top/upper/underside/edge`, `hinge-left/right/outer/contact`다. 작업만 `closed-panel/front/back/edge`, `pull/outer/contact`, 손님만 `bed-frame/upper/edge/underside`, `mattress/upper/side/underside`, `support-left/right/shaft/top/sole`, `duvet/upper/side/underside`, `pillow/upper/side/underside`를 낸다. 두 상태 모두 뒤판 앞면이 외함 내부에서 관찰될 수 있어 뒷면과 분리한다. 같은 45°·측면 중립 카메라와 작업실 출입 뷰에서 외함 점유의 동일함과 상태별 part 분리를 확인한다. ref04의 평평한 접이식 전면과 책상·계단으로 이어지는 열린 작업실을 채택하고, ref02의 작업실 정지 상태는 평면 관계 확인에 쓴다. ref01·03·05의 고정 방을 침대 동작 근거로 쓰지 않는다. 출입 원통 성립은 instances의 배치 검증 대상이다.

<!-- @authored-address-state:start -->
@address-state work: case-back, case-side-left, case-side-right, case-top, hinge-left, hinge-right, closed-panel, pull
@address-state guest: case-back, case-side-left, case-side-right, case-top, hinge-left, hinge-right, bed-frame, mattress, support-left, support-right, duvet, pillow
<!-- @authored-address-state:end -->

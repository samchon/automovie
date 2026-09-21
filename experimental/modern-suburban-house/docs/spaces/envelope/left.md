# 왼쪽 박공과 거실 굴뚝

## 주 지붕 끝의 왼쪽 삼각 벽 {#left-roof-closure}

`src/spaces/envelope/left.ts`가 왼쪽 완결 입면을 소유한다. [본채 왼쪽 외벽](../00-building.md#main-building-extent)의 평면에서 [주 지붕 앞/뒤 아래면](../roof/00-junctions.md#roof-profile-datums)까지 삼각 벽으로 닫는다. 전면 박공은 왼쪽 모서리에서 같은 지붕군의 교차선을 소비하므로 왼쪽 외벽에 또 하나의 분리된 상자를 덧붙이지 않는다. 처마 돌출은 지붕 owner가 소유하고 벽이 돌출 끝까지 부풀어 방 폭을 바꾸지 않는다.

왼쪽 벽에는 아래 [굴뚝 접면](#chimney-roof-interface), 거실·주침실·올리브 침실의 실제 경계를 바인딩한다. [측면 창](#left-openings)은 굴뚝을 피하는 위치에 배정한다. 왼쪽 전체 입면과 두 모서리, 삼각 벽과 지붕 아래면의 접촉, 각 방 창의 실내외 일치가 검사 주소다. 실제 면과 창 census·실루엣/재료 판정은 unverified다.

## 굴뚝 뒤에서 방으로 열리는 창 {#left-openings}

본채 왼쪽 외벽 X = [-5.75, -5.50] m의 [공통 개구부 인계](../06-openings.md#external-opening-interface)다. 창 수를 늘려 입면을 채우는 대신 굴뚝·조리 수납과 실제 방 사용을 함께 고려했다.

올리브 침실은 [전면 창](front.md#bedroom-two-front-window)을 사용하므로 굴뚝 가까운 측면 창을 덧붙이지 않는다. 공용부 주방의 왼쪽 벽은 가전/수납을 위해 닫고 [주방 후면 창](rear.md#kitchen-rear-window)을 소비한다. 실제 창틀/굴뚝 간섭·가구 접근·왼쪽 입면과 방 안 시야는 unverified다.

## 거실 벽난로 뒤쪽의 창 {#living-left-window}

`living-left-window`는 [왼쪽 벽](#left-openings)의 Z = [-5.50, -4.30], Y = [0.75, 2.30] m 개구부로 ground-storey의 [living-room](../rooms/living.md#living-plan)에 속한다. [공통 인계](../06-openings.md#external-opening-interface)의 수직 창 한 칸이다. 아래 [벽난로/굴뚝 예약](#chimney-roof-interface)보다 뒤에 놓여 같은 벽의 화구와 겹치지 않는다. 거실 가구 뒤 접근과 창/굴뚝 단면, 왼쪽 시야의 실제 읽힘은 unverified다.

## 주침실 본체의 측면 창 {#primary-left-window}

`primary-left-window`는 [왼쪽 벽](#left-openings)의 Z = [-8.90, -7.30], Y = [3.91, 5.31] m 개구부로 upper-storey의 [primary-bedroom](../rooms/primary.md#primary-plan)에 속한다. [공통 인계](../06-openings.md#external-opening-interface)의 수직 창 두 칸이다. 주침실의 뒤쪽 본체에 속하고 앞쪽 복도나 자녀실로 바인딩하지 않는다. 창대/커튼과 침대 주변 경로, 후면 창과 함께 보이는 시야·실제 단면/프레임은 unverified다.

## 벽난로에서 지붕까지의 굴뚝 {#chimney-roof-interface}

[거실 벽난로](../../settings/10-house.md#living)는 왼쪽 외벽에 붙는다. 굴뚝 구조 몸통의 평면 예약은 X = [-6.30, -5.50], Z = [-2.75, -1.65] m다. 외부에서 보이는 몸통은 포치 앞 보행길과 같은 Y = -0.45 m부터 Y = 8.90 m까지, 덮개/상부 형상 예약은 Y = [8.90, 9.10] m로 택한다. 지하 기초·실제 연도/열 성능을 모델링했다는 뜻은 아니다. 덮개 외곽은 몸통보다 수평 0.10 m씩 내밀며 검은 금속 상부와 벽돌 몸통을 구별할 수 있게 한다.

거실 쪽 벽난로/벽돌 앞면의 공간 예약은 X = [-5.50, -4.95], Z = [-3.00, -1.40], Y = [0, 1.40] m다. [거실의 문 앞 대기](../rooms/living.md#living-plan)와 떨어진 왼쪽 벽에서 화구·벽돌 앞면·선반을 후속 부재로 구성한다. 몸통과 실내 앞면은 하나의 chimney 접면을 공유하며 외벽만 사이에 남긴 무관한 두 장식물로 저작하지 않는다. 실내 완결 면은 living owner, 외부와 구조 기준은 이 왼쪽 입면 owner가 담당한다. 불은 꺼진 상태다.

굴뚝 몸통은 주 지붕의 왼쪽 돌출 끝을 넘어 있으므로 지붕 절단은 닫힌 사각 구멍이 아니라 왼쪽 경계에 닿는 notch다. [주 지붕 앞 면](../roof/main-front.md#main-front-roof)의 윤곽에서 몸통 평면과 겹치는 부분을 제외하고, 만나는 선을 따라 후레싱/역후레싱의 실제 두께를 후속 단계에서 붙인다. 전면 박공에 불필요한 두 번째 구멍을 뚫지 않는다. 몸통 주위의 지붕 높이는 [Mfront](../roof/00-junctions.md#roof-profile-datums)에서 읽으며 굴뚝 덮개가 지붕 안으로 묻히면 실패다.

검사 주소는 거실 화구부터 외벽/굴뚝으로 이어지는 단면, 왼쪽 전체 높이, 지붕 경계 notch의 세 접면과 위에서 본 덮개다. 높이 선택은 연소 규정 적합성이나 구조 안전의 주장이 아니다. 실제 부재/void·기초 접촉·후레싱·그림자·프레임은 unverified다.

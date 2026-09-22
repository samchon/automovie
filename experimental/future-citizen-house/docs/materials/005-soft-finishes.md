# 벽과 직물 마감

## 실내 도장 {#plaster-paint}

`plaster-paint`는 방 lining 중 plaster, 계단의 stair-lining과 층별 ceiling의 실제 면이다. 방/계단/층 owner가 개구부 cut과 lining 두께를 유지하며 명목 .15mm 도장만 시각적으로 표현한다. 색 #e5e0d6, roughness=.90, `paint-grain` 256²·.256×.256m의 등방성 무채색 입자다. 선형 texture 평균 .99, 범위 .98..1.00, 입자 1..3mm이며 큰 얼룩·미장 이음은 없다. 벽 local 수평/수직과 천장 local X/Z에 [metric 좌표](001-binding-and-scale.md#metric-texture-coordinates)를 쓴다.

가구의 plaster색 panel은 [joinery paint](006-wet-and-joinery.md#painted-joinery)에 배정한다. 광원 glow는 흰 벽 도장과 다르다. [방 내부 전체 검사](007-observation.md#reference-material-samples)는 벽·천장의 연결과 개구부 반환면을 포함한다. 무광 벽의 형상이 조명으로 읽히고 재료 자체의 얼룩이 그림자를 대신하지 않아야 한다.

## 작업실 흡음 패널 {#felt-panels}

`felt-panel`은 flex-workroom의 felt lining 면에 배정한다. 기존 판 두께/이음은 방 owner가 유지하고 섬유 피복 명목 .003m는 현재 판 안에 포함된 것으로 표현한다. 색 #a09a8d, roughness=.96, `felt-grain` 512²·.256×.256m, 선형 평균 .97·범위 .91..1.00의 1..4mm 등방성 섬유 점을 사용한다. 면 local 좌표는 벽 수평 U/수직 V다.

표면 입자는 색 변화이며 섬유 두께나 흡음률을 계산하지 않는다. 틈은 기존 geometry만 쓴다. [ref04 및 작업실 네 모서리](007-observation.md#reference-material-samples)에서 plaster보다 부드럽고 거친 무광 패널로 읽히는지, 책상 목재와 색이 뭉개지는지 확인한다. 실제 음향 성능은 unverified다.

## 가구와 침구 직물 {#textiles}

소파/의자 cushion·pillow, bed mattress/duvet/pillow, rug의 실제 면은 각 방 owner가 `textile-linen`, `textile-green`, `textile-blue`, `textile-white`로 배정한다. 색은 차례로 #c8c3b6, #6b735c, #657682, #e1dfd5이며 roughness는 .92, .94, .94, .92다. 기존 충전재 덩어리·곡면은 유지하며 명목 표면 직물 .001m는 외곽 안에 포함한다. toilet seat의 linen색은 직물 대상이 아니다.

`woven-grain`은 256²·.064×.064m, 1.5..2mm 격자 조직, 선형 평균 .96·범위 .89..1.00이다. box의 top은 X/Z, 전면은 X/Y, 옆면은 Z/Y의 metric UV다. ellipsoid pillow는 원래 sphere tessellation의 위도 ring과 경도 열을 유지한다. scale 뒤 각 위도 ring의 뒤쪽 local -Z seam부터 둘레의 실제 mesh edge 길이를 누적한 값을 U로, 각 경도 열의 아래쪽 pole부터 누적한 edge 길이를 V로 둔다. 같은 점이 만나는 seam의 UV 속성만 복제하고 면 위치·법선은 바꾸지 않는다.

이 곡면 좌표는 tessellated row/column의 길이를 보존하는 근사이며 곡면 전체의 등거리 직물 재단을 보증하지 않는다. pole과 뒤쪽 seam을 [scale 검사](007-observation.md#scale-and-junction-samples)의 별도 표본으로 넣어 몰림·끊김을 본다. 해당 pole 삼각형의 등거리 texel scale은 unverified로 남기고 평면 검사 결과로 치환하지 않는다. pillow가 회전하면 grain도 그 로컬 면과 함께 움직여야 한다.

ref03의 sofa/rug, ref02의 침구, ref04의 chair를 [거리·방 검사](007-observation.md#reference-material-samples)로 비교한다. 원거리에서 작은 weave가 평균색으로 사라지는 것은 정상이며 격자 moiré가 생기면 실패다. 원단 미세 그림자·실의 단면·주름 추가는 현재 renderer/형상 범위 밖이다.

## 기존 스크린 직물 {#screen-fabric}

`screen-fabric`은 기존 `shade` panel 표면에만 배정한다. 금속 hem과 shade-box는 [도장 금속](002-exterior-solids.md#coated-metal)이다. 색 #aab3a0, roughness=.88, opacity=1·transmission=0을 유지하고 woven-grain의 변화 폭을 .96..1.00으로 낮춘다. shade panel의 수직 V를 따른다. 기존 roller 상태·높이·개수와 실제 차폐 영역은 창호 owner가 그대로 소유한다.

texture에 투명한 구멍을 뚫거나 외부 louver를 그리지 않는다. 천의 읽힘만 개선하고 유리 상태/차양 배치의 후속 설계를 대신하지 않는다. [상태 검사](007-observation.md#material-state-samples)에서 각 실제 screen의 올림/내림 범위와 유리 구분을 본다. ref03·05의 차폐가 요구하는 추가 성능은 별도 판정 전이며 weave의 투광 성능은 unverified다.

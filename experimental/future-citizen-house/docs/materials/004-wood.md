# 목재 계열

## 바닥 오크 {#oak-floor}

`oak-floor`는 타일 방을 제외한 `<room.id>-floor-boards`에만 배정한다. storeys/floors.ts가 0.18m 폭·1.8m 길이 pitch, 잘린 판, 0.016m 판 두께와 기존 틈을 유지한다. 명목 무광 투명 마감층 .06mm이며 geometry를 추가하지 않는다. 기준색 #a78965, roughness=.55다. `oak-grain` 1024², U=.36m·V=1.8m 반복에서 결은 각 판 local+Z와 나란하다.

texture는 선형 무채색 평균 .96, 범위 .86..1.00, 1.5..4mm 간격의 물결치는 세로결과 20..50mm 폭의 완만한 띠다. 결의 횡편차는 주기당 최대 8mm이며 돌출·검은 옹이 구멍은 없다. 판별 위상은 [metric 규칙](001-binding-and-scale.md#metric-texture-coordinates), 판별 sRGB 기준색 계수는 .96..1.04다. 잘린 판에서 결 폭이 커지거나 판 이음이 texture의 검은 선으로 중복되면 실패다.

바닥 world+Z 결은 rooms 전체에 유지하고 cell의 경계 때문에 회전하지 않는다. [최단/최장 판 검사](007-observation.md#scale-and-junction-samples)와 ref03·05의 방 안 네 방향/문턱에서 판재와 저광택 목재가 동시에 읽혀야 한다. 실물 수종 판별·내마모·미끄럼 성능은 unverified다.

## 문과 수납 전면 {#oak-joinery}

`oak-joinery`는 doorway의 `*-leaf`, jamb/head, 방의 oak cabinet 전면·측판·선반, flex murphy의 oak 틀을 대상으로 한다. 실제 문 운동과 부재 두께는 owner의 현재 geometry다. 판에는 명목 .6mm 오크 베니어와 .06mm 투명 마감을 표현하며 색 #a08059, roughness=.45, 같은 oak-grain을 쓴다. 판별 계수 .98..1.02다.

문짝·jamb·장 측판과 수직 전면의 V는 local+Y, head와 수평 선반은 긴 수평 축이다. 문이 열려도 grain이 hinge와 함께 회전해야 한다. 좁은 edge band도 기존 끝면 안에서 grain 방향을 명시하고 painted murphy closed-panel에는 이 재료를 배정하지 않는다. [상층/작업실 및 문 상태 검사](007-observation.md#reference-material-samples)에서 문틀·문짝 세로결과 선반 가로결, handle 경계가 반례다. 조립 내부 접착층과 실제 베니어 접합 상세를 구현했다고 하지 않는다.

## 가구 목재 {#furniture-wood}

`oak-furniture`는 common dining/coffee/desk의 top·다리, 침대 base/head, 의자 목재부, sofa plinth의 실제 면에 배정한다. 방 owner가 가구별 전체 형상을 유지한다. 판류는 .6mm 베니어, rod/다리는 통목처럼 읽히는 마감의 근사이고 숨은 내부 구조는 미정 성능 주장으로 남기지 않는다. 색 #aa8760, roughness=.48, oak-grain을 쓰며 기준색 변화는 .98..1.02다.

table top의 V는 local+X, headboard V는 local+Y, 다리는 길이 축이다. 좌판/등받이는 각 넓은 면의 긴 축을 사용하고 동률이면 local+X다. 소품의 `walnut`은 `walnut-furniture` 색 #73583f·roughness=.52로 동일한 grain 규칙을 쓰는 어두운 목재 마감이다. 식재 줄기·흙·녹색 잎에는 목재 마감을 확장하지 않는다. [ref03·04 가구 검사](007-observation.md#reference-material-samples)에서 조리대와 식탁, 가구 목재와 floor의 결/광택 구분을 본다. 부품이 단순한 상자인 문제는 후속 형상 설계에 남긴다.

## 계단 목재 {#stair-wood}

계단 owner의 기존 tread/riser와 stair-half-landing은 `oak-stair` 색 #a78965·roughness=.50, oak-grain이다. 계단 수와 위치·폭·단높이·회전은 바꾸지 않는다. 디딤판 결의 V는 폭 방향 local+X, riser도 가로+X, 참판은 +Z다. 현재 handrail은 metal이므로 목재로 바꾸지 않고 coated-metal을 받는다. 현재 .06mm 투명 마감의 시각 근사이며 미끄럼/안전 성능을 선언하지 않는다.

[계단 접합 검사](007-observation.md#scale-and-junction-samples)는 첫단/꺾임참/마지막 단과 층 바닥의 이어짐, rail과 wood의 광택 차이를 본다. 실제 부재가 없는 접합을 texture로 추가하지 않으며 참판의 grain은 바닥 +Z를 유지한다. 단마다 grain 크기가 달라지거나 목재 디딤판이 금속 난간과 같은 재질로 읽히면 실패다.

## 목재 끝면 {#wood-end-faces}

grain 축이 면 법선과 평행한 끝면은 같은 완결 owner가 `wood-end/<기준 목재 마감>` 역할을 배정한다. 베니어 판은 명목 .6mm edge band이며 그 끝면의 긴 접선축을 V로 삼아 같은 oak-grain을 쓴다. 접선 길이가 같으면 X, Z, Y 순으로 결정한다. 통목처럼 표현한 다리의 절단 끝은 같은 기준색·roughness의 무texture 면으로 두어 불가능한 축 투영이나 가짜 나이테를 만들지 않는다. 기준 부재 두께는 그대로다.

이는 보이는 끝면의 표현 선택이며 실제 나이테나 접착 시공을 인증하지 않는다. [문·가구·계단 접합 검사](007-observation.md#scale-and-junction-samples)에서 얇은 edge와 넓은 면의 마감 연결을 보고, texture 적용 수와 끝면의 무texture 수를 [census](007-observation.md#binding-census)에 따로 남긴다. 끝면을 검사에서 삭제하거나 무UV를 metric texture 통과로 처리하지 않는다.

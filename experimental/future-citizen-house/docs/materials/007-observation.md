# 재료의 유한 관찰 집합

## 바인딩 전수 검사 {#binding-census}

검사 입력은 현재 상태의 `buildHouse()` 반환과 공개 lowering/instanceSlot이 만든 실제 모델·부재·material·UV다. [바인딩 인터페이스](001-binding-and-scale.md#surface-bindings)의 역할별로 source owner, element 또는 set/member, part/면, material ID, texture ID, physical tile, UV 근거를 열거한다. 적용 없는 역할도 0을 남기고, missing/중복 role·지원하지 않는 channel·잘못된 색 공간은 실패로 보고한다. 미정 배정을 plaster나 retained로 대신하지 않는다.

기존과 비교할 것은 room/storey/connector/opening 주소, 모든 실제 member ID·count·transform·world bounds·소유 관계다. 새 model variant 수는 원래 prototype/finish/scale로 설명되어야 한다. topology·캐노피 audit 오류와 유효하지 않은 texture binding을 숨기지 않는다. `sourceBasis`는 구현 단계에서 docs/materials와 새 material source도 현재 입력으로 포함해야 하며 구 버전 payload를 새 문서의 검증으로 인용하지 않는다.

물리 층은 부재 소유 문서/geometry와 명목 표면층 선택을 구분하고 optical 값은 native material에서 읽는다. 이번 draft에는 source가 없어 결과는 unverified다. 구현 뒤에도 텍스트 census는 시각 합격이 아니며 아래 실제 프레임과 함께 읽는다.

## 크기와 접합 표본 {#scale-and-junction-samples}

모든 새 texture family에서 현재 적용 면의 최소/최대 크기 및 각 UV 방향을 하나씩 선택한다. 기준은 실제 native 면적·extent이며 동률은 ID 사전순이다. 같은 source geometry를 1m, 3m, 12m 거리에서 정면, 접선과 30°를 이루는 사선으로 본다. 좁은 실제 방에서는 카메라가 자기 공간을 벗어나지 않는 최대 거리까지만 찍고 불가능한 거리와 이유를 남긴다. 나머지 거리 표본은 검사 전용 격리 장면에서 같은 모델/마감/배치를 사용하며 실제 방 검사를 대체하지 않는다.

중성 검사에는 sRGB #808080 배경, D65에 가까운 흰 hemisphere intensity=1, 흰 directional intensity=2를 local 표면 법선에서 45° 위치에 둔다. tone mapping은 기존 viewer와 같고 exposure=1, 1600×1000/DPR1, 동일 camera FOV50으로 고정한다. 1m의 단색 기준 막대를 검사 모드에만 두고 texture 주기와 함께 촬영한다. production beauty의 기존 illumination/PMREM은 바꾸지 않는다. 광도 단위와 이 장면은 실측 조명 인증이 아니다.

필수 접합은 front/right 모서리, front/rear floor-band 위아래와 opening 끝, door leaf/jamb/head, 첫 계단/꺾임참/마지막 단, oak/tile 문턱, worktop/edge/sink, sofa의 평면/곡면 seam, 각 texture의 두 반복 주기 경계다. 각 접합의 부재 ID와 표면 정상 방향을 기록한다. grain 늘어남, 뒤집힌 face, 이중 tint, 눈에 띄는 타일 경계, moiré와 가짜 geometry 읽힘이 실패다.

`validateTextureScale`은 현재 전달 모델의 실제 primary UV와 선언된 surface-metres binding에 실행한다. 원본 unit mesh와 실제 scale의 차이는 별도 world-space U/V 길이 대조로 확인한다. API의 checkable 수·primitive/무UV/unsupported 수와 findings를 함께 남기고 지원 밖 표면은 unverified다. 구현 시 기존 canopy audit처럼 동일 producer에서 수행하여 viewer의 현재 산출물에 결과를 붙인다. README의 `npm run lint`는 canonical source/evidence 검사이며 이 정적 명령이 geometry 측정까지 실행했다고 주장하지 않는다. 별도 대체 CLI나 우회 설정을 만들지 않고 실제 producer의 해당 측정을 실행·읽지 못하면 unverified로 보고한다.

## 집 전체와 레퍼런스 {#reference-material-samples}

현재 compiled topology에서 파생된 관찰 집합 전부를 유지한다. exterior setting 하나, 모든 노출 입면/모서리/지붕/하부와 개구·출입구, 모든 공간의 threshold·네 안쪽 모서리·중심에서 네 방위를 자기 공간 안에서 본다. failure/null 위치는 삭제하지 않는다. material이 바뀌지 않은 방도 반사·주변색의 영향을 받으므로 관찰 분모에서 빼지 않는다. 현재 canopy top/soffit·배수 접합 표본도 유지한다.

추가 다섯 장면은 reference01 외관의 석재/짙은 frame/floor-band/유리/PV, 02 절개의 바닥/침구/습식면 구분, 03 공용부의 oak floor/식탁/직물/초록 cabinet/밝은 worktop/금속, 04 flex의 felt/desk/직물/접이식 전면, 05 상층의 door/jamb 세로결/floor/유리 반사다. reference02의 절개는 검사 수단이며 전달 프레임이 아니다. ref01·03·05는 기존 GPU 캡처와 나란히 비교해 같은 재료로 읽히는지 명시한다. 사진의 픽셀로 roughness나 치수를 역산하지 않는다.

현재 한계인 단순한 furniture/장비 형상, 얕은 frame, 향후 louver와 landscape 밀도를 별도 미완료로 남긴다. 이 항목은 재료만으로 그 결함을 지우는 판정이 아니다. 실제 GPU는 viewer-verification이 정한 Playwright channel=chromium/WebGL2 경로로 확인하고 RENDERER·현재 sourceBasis·에러 배너/페이지 오류를 기록한다. 소프트웨어 rasterizer 결과나 이전 판정의 renderer를 새 실행의 값으로 쓰지 않는다. 자료가 없으면 unverified다.

## 상태별 재료 {#material-state-samples}

현재 명시 상태 privacy=day/private/night와 flex=work/guest의 6개 조합을 동일 source producer에 준다. 이 상태들이 만드는 실제 부재 및 바인딩 census를 비교하고 유리·screen·folding bed가 영향을 받는 모든 opening/room 관찰을 반복한다. 나머지 집 전체 관찰은 기본 day/work에서 완주하고, 다른 상태가 바꾼 부재·재료의 영향 면은 빠짐없이 추가한다. 동일한 두 상태도 동일하다는 사실을 기록한다.

door closed/open은 실제 기존 operation에 적용하여 문 grain과 hardware의 움직임을 같은 문턱에서 대조한다. 프레임 유지, 유리의 transparent/frosted band, screen의 내려온 범위, guest bed의 흰 직물과 painted panel 배정이 반례 표본이다. 새 프라이버시 상태·동작 경로·차양 geometry를 이 검사에서 발명하지 않는다. 낮아진 transmission은 렌더 근사이며 실물 시선 차단·에너지·광학 성능의 측정은 unverified다.

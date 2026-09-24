# 외부 기구

## 현관 옆 벽등 {#exterior-porch-sconce}

[현관 포치 설정](../settings/10-house.md#porch-entry)의 현관 옆 벽등을 point 광원 `light:front-porch:door-sconce` 하나로 실현한다. [front-door](../spaces/rooms/entry.md#entry-plan)의 거친 개구부는 본채 전면 벽의 X = [0.40, 1.40], Y = [0, 2.20] m이고 [포치 바닥](../spaces/porch.md#porch-platform-access)은 X = [-5.75, 2.20], Z = [0, 2.20] m에서 Y = 0 m이다. 벽등은 문의 경첩 반대쪽인 -X 문설주 옆 X = 0.15 m, 전면 벽 바깥면 Z = 0 m에서 0.10 m 나온 Z = 0.10 m, 포치 바닥 위 Y = 1.80 m에 둔다. 이 높이는 [포치 앞 보](../spaces/porch.md#porch-roof-columns)의 Y = [2.45, 2.70] m 아래이고 문짝은 실내 -Z로 열리므로 문 작동과 겹치지 않는다. 돌출 0.10 m는 포치 유효 깊이 1.80 m의 통행을 막지 않는다. 약 2,700 K (1.00, 0.72, 0.45), `intensity` 15 cd, `range` 3.0 m이며 [낮의 기준 상태](../settings/20-verification.md#lighting-state)에서 켤 이유가 없으므로 리뷰 프레임에서 꺼짐이다. 꺼짐은 [정지 기준 상태](00-lighting-frame.md#lighting-static-state)대로 광원 레코드를 만들지 않고 기구 형상만 남긴다. 설정은 그 밖의 외부 기구를 요구하지 않으므로 차고 정면·후면 정원문 등은 두지 않는다.

source owner는 `src/systems/lighting.ts`다. 반증 관찰은 컴파일된 광원 목록에 이 id가 없는지, models의 벽등 기구가 X = 0.15 m·Y = 1.80 m 근처에 있어 01 외관 프레임에서 문 옆에 읽히는지이며 unverified다.

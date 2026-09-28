# 외부 기구

## 현관 옆 벽등 {#exterior-porch-sconce}
<!--
@evidence principles/core/common.md#scope-preservation 현관 옆 벽등의 위치·색·강도와 낮의 꺼짐, 다른 외부 기구 부재를 맡는다.
@evidence principles/core/common.md#substantive-completion X = 0.15, Z = 0.10, Y = 1.80 m, 2,700 K, 15 cd, range 3.0 m, 리뷰 프레임 꺼짐을 정한다.
@evidence principles/core/common.md#declared-basis 벽등 존재는 porch-entry, 문 위치는 entry-plan의 front-door에서 받고 낮의 꺼짐은 이 branch의 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation porch-entry가 옆 벽등의 존재만 정한 데 비해 좌표·높이·상태를 더한다.
@evidence principles/design/systems.md#system-authority-confinement 광원만 쓰고 벽등 기구 geometry는 models에 남긴다.
@evidence principles/design/systems.md#system-dependency-basis 좌표는 front-door 개구부 X = [0.40, 1.40]의 경첩 반대쪽과 포치 바닥 Y = 0에서 유도한다.
@evidence principles/design/systems.md#system-verification-address 광원 목록에 이 id가 없는지, 01 외관에서 기구가 문 옆에 읽히는지가 반증 관찰이다.
@evidenceExclude upstream/design/systems.md#parent-revision-from-system-work porch-entry와 front-door·포치 바닥·앞 보 높이를 대조했고 벽등이 문 작동과 보 아래에 들어 부모 수정이 없었다.
@evidence settings/10-house.md#porch-entry 현관 옆 벽등을 point 광원 하나로 두고 낮에는 끈다.
@evidence spaces/porch.md#porch-platform-access 포치 바닥 Y = 0과 유효 깊이 1.80 m를 벽등 높이·돌출 대조에 쓴다.
@evidence spaces/porch.md#porch-roof-columns 앞 보 Y = [2.45, 2.70] 아래 높이임을 대조한다.
@evidence obligations/core/common.md#purpose-fit 03-exterior-fixtures.md는 설정이 요구한 유일한 외부 기구인 현관 벽등의 위치와 낮의 꺼짐 역할을 맡으며 이것이 없으면 porch-entry의 벽등 상태가 정해지지 않는다.
-->

[현관 포치 설정](../settings/10-house.md#porch-entry)의 현관 옆 벽등을 point 광원 `light:front-porch:door-sconce` 하나로 실현한다. [front-door](../spaces/rooms/entry.md#entry-plan)의 거친 개구부는 본채 전면 벽의 X = [0.40, 1.40], Y = [0, 2.20] m이고 [포치 바닥](../spaces/porch.md#porch-platform-access)은 X = [-5.75, 2.20], Z = [0, 2.20] m에서 Y = 0 m이다. 벽등 광원은 문의 경첩 반대쪽인 -X 문설주 옆 X = 0.15 m, 전면 벽 바깥면 Z = 0 m에서 0.10 m 나온 Z = 0.10 m, 포치 바닥 위 Y = 1.80 m에 둔다. 기구 몸체의 앞점은 [벽등 원형](../models/17-light-fixtures.md#porch-wall-sconce)에 따라 Z = 0.17 m이며 광원점 0.10 m는 그 갓 안에 있다. 이 높이는 [포치 앞 보](../spaces/porch.md#porch-roof-columns)의 Y = [2.45, 2.70] m 아래이고 문짝은 실내 -Z로 열리므로 문 작동과 겹치지 않는다. 몸체 돌출 0.17 m를 빼도 포치 유효 깊이 1.80 m 중 1.63 m가 남는다. 약 2,700 K (1.00, 0.72, 0.45), `intensity` 15 cd, `range` 3.0 m이며 [낮의 기준 상태](../settings/20-verification.md#lighting-state)에서 켤 이유가 없으므로 리뷰 프레임에서 꺼짐이다. 꺼짐은 [정지 기준 상태](00-lighting-frame.md#lighting-static-state)대로 광원 레코드를 만들지 않고 기구 형상만 남긴다. 설정은 그 밖의 외부 기구를 요구하지 않으므로 차고 정면·후면 정원문 등은 두지 않는다.

source owner는 `src/systems/lighting.ts`다. 반증 관찰은 컴파일된 광원 목록에 이 id가 없는지, models의 벽등 기구가 X = 0.15 m·Y = 1.80 m 근처에 있어 01 외관 프레임에서 문 옆에 읽히는지이며 unverified다.

# 신전을 받치는 국소 대지

## 대지 단위와 범위 {#site-extent}

<!--
@evidence principles/core/common.md#scope-preservation 대지를 건물 외곽 밖 25m 범위 전체로 잡고 지면·포장·배치 구역과 범위 밖 먼 능선의 자리를 나눠 외관 앞 한 조각만 만드는 축소를 막는다.
@evidence principles/core/common.md#substantive-completion 소유 단위 temple-site, 뿌리 element site.root, kind site 공간과 네 볼록 cell의 X·Z·Y 범위를 수치로 정한다.
@evidence principles/core/common.md#declared-basis 25m 범위는 40-environment#site의 저작자 선택에서, 외곽 좌표는 building#footprint에서 받고 필지나 실측 도로선이 아니라고 밝힌다.
@evidence principles/design/spaces.md#space-topology temple-site가 건물·층 아래에 들지 않는 별도 뿌리이며 두 connector로만 건물 공간과 이어지고 네 cell이 건물 공간과 외곽 바깥면에서만 만나는 관계를 적는다.
@evidence principles/design/spaces.md#space-boundary-authority 범위·기준선은 extent.ts 한 곳, 건물 외곽은 building, 현관 후퇴부 바닥은 entrance가 소유하고 대지는 외곽 안에 표면을 두지 않는다.
@evidence principles/design/spaces.md#space-verification-address 대지 공간과 외곽의 겹침, 범위 밖 포장, site.root 아래 건물 element를 관찰 owner의 대지 항목에서 실패로 삼는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 25m 국소 setting과 대지 배정을 별도 소유 단위·뿌리 공간·네 cell의 공간 구조로 바꾼다.
@evidence upstream/design/spaces.md#settings-and-map-revision-from-space-work 대지를 공간으로 놓으려 하자 build-scope가 대지를 열 수 없는 maps에 배정했음이 드러났다. spaces가 이미 review라 maps를 활성화하면 builder가 거부하므로 00-delivery#build-scope의 대지 행을 spaces의 대지 owner로 고쳤다.
@evidence settings/40-environment.md#site 외벽에서 최대 25m인 국소 setting을 대지 범위 X=-35.5~35.5, Z=-35.25~35.25로 옮기고 먼 배경을 범위 밖으로 나눈다.
@evidence settings/00-delivery.md#build-scope 고친 배정대로 지면·경계석·먼 능선과 배치 구역을 이 파일이 소유하고 이웃·식생 개체는 models/instances에 남긴다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 범위 안 지면·포장·배치 구역과 범위 밖 능선이 모두 이 파일의 H2로 배정돼 정면 거리만 만들고 골목이나 후면 지면을 빠뜨리는 선택이 남지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 뿌리 ID 세 개와 네 cell의 평면 좌표, Y=-0.30~6.0 높이가 적혀 있어 구현자가 대지 공간의 모양을 새로 고를 여지가 없다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 25m는 설정의 저작자 선택, 좌표는 외곽 owner에서 받았고 필지 경계나 실측 도로선이 아니라는 문장이 측량값으로 읽히는 것을 막는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 대지가 temple이나 temple-ground 아래에 없다는 포함 관계, 두 connector만의 접속, 네 cell이 건물 공간과 바깥면에서만 만나는 관계를 mesh 없이 읽을 수 있어 장소 그래프가 복원된다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 외곽 좌표를 다시 정하지 않고 building 링크로 소비하며 현관 후퇴부 바닥을 entrance에 남겨 한 바닥을 두 owner가 만들지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 대지 cell이 외곽과 겹치는 경우와 건물 element가 site.root 아래로 들어가는 경우가 각각 관찰 대지 항목의 실패로 적혀 있다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 설정은 25m 반경만 주었고 소유 단위 분리·뿌리 공간·네 볼록 cell은 이 공간 단위가 더한 결정이다.
@evidenceReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 드러난 결함은 build-scope의 maps 대지 배정이고, 그 원인인 stage 규칙과 수정한 00-delivery#build-scope 행이 함께 적혀 있다.
@evidenceReview settings/40-environment.md#site #f317e20 설정의 외벽에서 최대 25m가 네 바깥면 각각에서 25m인 직사각형으로 옮겨졌고 먼 지형은 범위 밖 H2로 분리됐다.
@evidenceReview settings/00-delivery.md#build-scope #8d597f9 고친 표 첫 행의 지면·경계석·먼 능선·배치 구역을 이 H2가 떠맡고 이웃 외피 prototype과 배치는 models/instances 행에 남겼다.
-->

[국소 대지](../settings/40-environment.md#site)와 [제작 대상과 분기](../settings/00-delivery.md#build-scope)의 지면·길·경계·배치 구역 배정을 소비한다. 대지는 건물 `temple`과 별도의 소유 단위 `temple-site`다. 이 단위의 뿌리 element는 `site.root`, 뿌리 공간은 kind `site`의 `temple-site`이며 어느 쪽도 건물 뿌리나 `temple-ground` 층 아래에 들어가지 않는다. 건물 안 공간과 대지는 [대지와 건물의 연결](#site-connections)의 두 connector로만 만난다. 이 production에서 maps 분기는 열리지 않는다. spaces가 이미 review이고 활성화된 미검토 기반 위에서는 spaces가 review에 머물 수 없으므로, 부모 설정의 대지 배정이 spaces로 옮겨졌고 이 파일이 그 단독 공간 owner다.

범위는 [외곽](building.md#footprint)의 네 바깥면에서 각각 25m 떨어진 직사각형 X=-35.5~35.5m, Z=-35.25~35.25m다. 이 선은 설정이 정한 국소 제작 한계이며 필지 경계나 실측 도로선의 선언이 아니다. 범위 안에는 [지면 높이](#site-grade), [흙띠·경계석·포장](#site-paving), [배치 구역](#placement-zones)이 있고 범위 밖은 [먼 능선과 기슭](#distant-ridge)만 있다. 건물 외곽 X=±10.5m, Z=±10.25m 안에는 대지 표면·공간·배치가 없으며 현관 후퇴부의 바닥도 기존 [현관](rooms/entrance.md#entrance-volume) 소유다.

`temple-site` 공간은 건물 외곽을 뺀 범위를 남·북 띠(X 전폭, Z=10.25~35.25m와 -35.25~-10.25m)와 동·서 띠(Z=-10.25~10.25m, X=10.5~35.5m와 -35.5~-10.5m)의 네 볼록 cell로 덮는다. 각 cell은 Y=-0.30m에서 Y=6.0m까지다. 아래 한계는 가장 낮은 지면 -0.24m 아래이고 위 한계는 보행·관찰을 담는 논리 범위이며 하늘을 가리는 면이 아니다. 네 cell은 서로 면으로만 맞닿고 건물 공간과는 외곽의 바깥면에서만 만나며 어느 쪽과도 양의 체적으로 겹치지 않는다.

source 조립 owner는 `src/spaces/site/assembly.ts`이고 범위·기준선은 `src/spaces/site/extent.ts`가 단일 입력으로 내보낸다. 반증은 [관찰](observations.md#geometry-observations)의 대지 항목이다. compiled 대지 공간이 건물 외곽과 겹치거나, 범위 밖으로 포장이 나가거나, 건물 쪽 element가 `site.root` 아래에 들어가면 이 owner부터 고친다.

## 지면의 높이 {#site-grade}

<!--
@evidence principles/core/common.md#scope-preservation 정문 도로, 서비스 외부, 동·서 외벽을 따른 경사와 범위 전체 표면의 높이를 한 규칙으로 다뤄 접점 두 곳만 맞추는 축소를 막는다.
@evidence principles/core/common.md#substantive-completion yard-front 북쪽 Y=0, south-outer 남쪽 Y=-0.24와 그 사이 Y=-0.24×(Z+2.45)/12.7의 식을 정한다.
@evidence principles/core/common.md#declared-basis 두 높이는 storey#ground-storey, 전환선은 building#plan-datums에서 받고 기울기는 배수 설계나 실측 지형이 아닌 저작 선택이라고 밝힌다.
@evidence principles/design/spaces.md#space-topology 지면이 정문 계단 발치와 서비스 문 앞을 끊김 없이 잇고 X 방향 경사나 둔덕이 없다는 관계를 형상보다 먼저 정한다.
@evidence principles/design/spaces.md#space-boundary-authority 접점 높이는 storey, 전환선 Z는 기준선 표가 소유하고 이 H2는 그 사이 지면 식과 외벽 하단이 읽을 최저값만 낸다.
@evidence principles/design/spaces.md#space-verification-address 동·서 외벽 종단면과 두 접점 단면에서 틈·접점 높이 불일치·전환선 단차를 실패로 삼는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 도로와 서비스 접근이 끊기지 않는다는 조건을 Z에만 따르는 세 구간 지면 식과 평면 조각 분할로 구체화한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work ground-access의 정문 석단 허용과 서비스 무단차, storey의 -0.24/0 두 높이를 대조했다. 12.7m에 걸친 약 1.9% 경사로 두 조건이 함께 성립해 부모의 높이나 단차 한계를 고치지 않았다.
@evidence settings/10-building.md#ground-access 정문 쪽 낮은 석단과 서비스 쪽 무단차를 서로 다른 지면 높이로 받아 한쪽 높이를 다른 쪽에 복사하지 않는다.
@evidence settings/40-environment.md#site 도로와 서비스 접근의 연속과 지면-기단 맞닿음을 동·서 외벽을 따라 이어지는 경사 지면으로 만든다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 식이 범위 전체의 Z에 대해 정의돼 정면·후면·동서 골목·이웃 바닥이 같은 규칙을 따르며 접점 주변만 높이를 가진 조각 지면이 남지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 세 구간의 경계 Z와 식의 계수가 모두 적혀 source가 경사를 따로 고를 필요가 없다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb -0.24와 0은 storey 링크, -2.45와 10.25는 기준선 이름으로 받았고 경사가 배수 설계가 아니라고 적어 근거의 종류를 나눴다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 두 접점을 한 연속 지면이 잇고 국소 둔덕이 없다는 관계가 먼저 적혀 형상 없이도 외부 보행의 연속을 읽을 수 있다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 접점 높이를 새로 정하지 않고 storey 값을 소비하며, 외벽 하단 쪽에는 최저 접촉 -0.24라는 결과만 넘겨 하단 계산은 storey에 남긴다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 경사 전환선 두 곳의 단차와 동·서 외벽 바깥면의 틈이 각각 종단면 관찰의 실패 조건으로 남아 있다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모는 연속과 접촉만 요구했고 Z 전용 3구간 식과 조각 분할은 공간 층이 더한 결정이다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 ground-access의 두 조건과 storey 두 높이가 1.9% 경사 하나로 양립함을 식으로 보였고 부모를 고칠 결함은 드러나지 않았다.
@evidenceReview settings/10-building.md#ground-access #be07d7d 정문 -0.24와 서비스 0이 서로 다른 구간으로 남아 정문 석단 높이가 서비스 문 앞에 복사되지 않는다.
@evidenceReview settings/40-environment.md#site #f317e20 동·서 외벽을 따라 경사가 벽 바깥면에 그대로 닿아 기단이 뜨는 구간 없이 도로에서 서비스 문까지 지면이 이어진다.
-->

[바닥 접근](../settings/10-building.md#ground-access)의 정문 석단과 서비스 무단차 조건, [층](storey.md#ground-storey)의 정문 도로 Y=-0.24m와 서비스 외부 Y=0을 한 지면으로 잇는다. 지면 높이는 Z에만 따른다. [기준선](building.md#plan-datums) `yard-front` Z=-2.45m보다 북쪽은 Y=0, `south-outer` Z=10.25m보다 남쪽은 Y=-0.24m이고 그 사이 12.7m는 Y=-0.24×(Z+2.45)/12.7로 곧게 이어진다. 기울기는 약 1.9%로 남쪽 정면을 향해 낮아진다. X 방향 경사나 국소 둔덕은 두지 않는다.

이 규칙으로 정문 계단 발치는 Y=-0.24m 지면에, 서비스 문(Z=-6.4m 중심) 앞은 Y=0 지면에 닿는다. 두 접점의 높이는 지면이 그 값을 가지도록 정한 것이며 서로 복사하지 않는다. 동·서 외벽을 따라서는 이 경사가 그대로 벽 바깥면에 닿으므로 [외벽 하단](storey.md#wall-ground-contact)이 읽는 외부 접촉선 최저값은 정면의 -0.24m다. 지면 기울기는 배수 설계나 실측 지형이 아니라 두 접점을 끊김 없이 잇는 저작 선택이다.

모든 대지 표면과 경계석 상면은 이 규칙에서 유도하고 source는 `src/spaces/site/extent.ts`의 한 함수로 내보낸다. 표면을 경사 전환선 Z=-2.45m와 Z=10.25m에서 나누어 각 조각이 평면이 되게 하고, 보행 support는 조각마다 같은 평면 높이 규칙을 가진다. 관찰은 동·서 외벽을 따른 종단면과 두 접점의 단면이며 지면과 벽 하단 사이 틈, 접점 높이 불일치, 경사 전환선의 단차가 있으면 실패다.

## 흙띠·경계석·포장 {#site-paving}

<!--
@evidence principles/core/common.md#scope-preservation 벽 밑 흙띠·경계석·정면 거리·세 골목·진입 포장·서비스 문 앞 포장·이웃 바닥으로 범위 전체를 빈틈 없이 나눈다.
@evidence principles/core/common.md#substantive-completion 구획별 평면 범위와 표면 ID, 흙띠 깊이 3.0m/1.0m, 경계석 폭 0.30m·높이 0.12m·매입 0.10m를 정한다.
@evidence principles/core/common.md#declared-basis 포장·경계석·마른 흙의 관계는 이미지 01과 40-environment#site에서 받고 구획 치수는 저작 선택이다.
@evidence principles/design/spaces.md#space-topology 경계석 고리가 두 접근 경로에서만 끊기고 표면들이 겹치지 않으며 흙띠가 벽에 닿는 관계를 정한다.
@evidence principles/design/spaces.md#space-boundary-authority 높이는 site-grade, 진입 포장 폭은 현관 반환벽 안쪽 면, 서비스 문 폭은 openings에서 받고 포장석 결은 materials에 남긴다.
@evidence principles/design/spaces.md#space-verification-address 조감의 구획 평면, 두 접근의 경계석 끊김, 네 모서리, 골목 경사 단면으로 흙띠 이탈·접근 차단·표면 중복을 반증한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 석재 길·낮은 경계석·마른 흙을 여덟 구획의 평면표와 경계석 끊김 규칙으로 바꾼다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work 40-environment#site의 포장·경계석·흙 관계와 vegetation의 벽 밑 풀을 구획에 대조했다. 모두 한 평면표 안에 자리를 얻어 설정의 재료 관계나 범위를 고칠 필요가 없었다.
@evidence settings/40-environment.md#site 정문 앞 거친 석재 포장, 낮은 경계석, 벽 가장자리 마른 흙을 각각 paving·curb·earth 표면으로 만든다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 표의 여덟 행과 범위 안의 나머지인 이웃 바닥이 범위 전체를 덮어 표면이 없는 대지 구멍이나 건물 뒤 빈 땅이 생기지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 모든 구획에 X·Z 범위가 있고 경계석의 폭·상면 높이·매입 깊이까지 적혀 source가 치수를 추정하지 않는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 세 재료의 관계는 설정·이미지 01에서, 3.0m·1.0m·0.30m 같은 치수는 저작 선택으로 구별된다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 경계석 끊김이 정문 진입 포장과 서비스 문 앞 포장 두 곳뿐이라는 문장이 접근 경로와 턱의 관계를 정한다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 진입 포장 폭 X=±1.65는 현관 반환벽 안쪽 면, 서비스 문 앞 길이는 문 유효 폭에서 유도해 두 값을 이 H2가 새로 발명하지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 흙띠가 벽에 닿지 않는 경우, 경계석이 접근 경로를 막는 경우, 두 표면이 겹치는 경우가 각각 관찰 실패로 적혀 있다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 설정은 세 재료의 존재만 정했고 구획 좌표와 끊김 규칙은 공간 층의 결정이다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 포장·경계석·흙과 벽 밑 풀이 모두 표 안에 자리를 얻어 설정의 재료 관계나 25m 범위에 결함이 드러나지 않았다.
@evidenceReview settings/40-environment.md#site #f317e20 설정의 세 재료가 표의 paving·curb·earth 세 표면 ID로 하나씩 대응해 단색 정육면체 대지가 될 여지가 없다.
-->

[국소 대지](../settings/40-environment.md#site)의 정문 앞 거친 석재 포장, 낮은 경계석, 벽 가장자리의 좁은 마른 흙을 평면으로 배정한다. 모든 높이는 [지면의 높이](#site-grade)를 따른다.

| 구획 | 평면 범위(m) | 표면 |
| --- | --- | --- |
| 벽 밑 흙띠 | 건물 외곽에서 경계석 안쪽 선까지. 안쪽 선은 X=±11.5, 북 Z=-11.25, 남 Z=13.25 | `surface.site.earth` |
| 경계석 | 안쪽 선 바깥 0.30m 띠(X=±11.5~±11.8, Z=-11.25~-11.55, Z=13.25~13.55), 상면은 지면 위 0.12m | `surface.site.curb` |
| 정면 거리 | Z=13.55~21.55, 범위 전폭 | `surface.site.paving` |
| 동측 골목·서측 골목 | X=11.8~14.8과 -14.8~-11.8, Z=-11.55~13.55 | `surface.site.paving` |
| 북측 골목 | Z=-14.55~-11.55, X=-14.8~14.8 | `surface.site.paving` |
| 정문 진입 포장 | X=-1.65~1.65, Z=10.25~13.55 | `surface.site.paving` |
| 서비스 문 앞 포장 | X=10.5~11.8, Z=-7.3~-5.5 | `surface.site.paving` |
| 이웃 바닥 | 범위 안의 나머지 | `surface.site.ground` |

정면의 흙띠는 깊이 3.0m, 동·서·북은 폭 1.0m다. 경계석 띠는 정문 진입 포장(X=±1.65)과 서비스 문 앞 포장(Z=-7.3~-5.5)에서 끊겨 두 접근 경로에 0.12m 턱이 없다. 진입 포장의 폭은 현관 반환벽 안쪽 면 사이와 같고, 서비스 문 앞 포장은 문 유효 폭 1.1m에 양쪽 0.35m씩 더한 길이다. 네 모서리에서 경계석은 끊기지 않는 직사각형 고리로 만난다.

흙띠·포장·이웃 바닥은 지면 높이의 윗면만 가진 열린 표면이고 경계석은 지면 아래 0.10m부터 지면 위 0.12m까지의 닫힌 석재 띠다. 표면들은 서로 겹치지 않고 경계석 띠 자리에는 경계석만 있다. 포장 석재의 줄눈·요철과 흙의 결은 materials가 이 표면에 결속하며 spaces는 개별 포장석을 만들지 않는다. 벽 밑 흙띠에는 [벽 밑 풀](../settings/40-environment.md#vegetation)만 놓일 수 있고 나무와 이웃은 놓이지 않는다.

source owner는 `src/spaces/site/ground.ts`다. 관찰은 조감의 구획 평면, 정문 진입과 서비스 문 앞의 경계석 끊김, 네 모서리 경계석, 동·서 골목의 경사 단면이다. 흙띠가 벽에 닿지 않거나 경계석이 접근 경로를 막거나 표면 두 개가 같은 자리에 겹치면 실패다.

## 대지와 건물의 연결 {#site-connections}

<!--
@evidence principles/core/common.md#scope-preservation 정문 계단과 외부 서비스 문 두 접점을 모두 connector로 만들고 다른 통로가 없다고 한정한다.
@evidence principles/core/common.md#substantive-completion 두 connector의 ID·종류·방향·경로 끝점·단 수·폭·유효 높이를 표로 정한다.
@evidence principles/core/common.md#declared-basis 계단 치수는 entrance, 문 폭·높이는 openings, 문턱 소유는 storey#threshold-support에서 받는다.
@evidence principles/design/spaces.md#space-topology temple-site↔entrance와 service-yard↔temple-site 두 연결만 두고 대지를 층이나 외벽 경계의 두 번째 공간으로 등록하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority connector는 circulation.ts, 대지 support와 공간은 assembly.ts가 소유하고 문턱 바닥은 service-yard 소유로 남긴다.
@evidence principles/design/spaces.md#space-verification-address 두 connector의 종단면과 경로 폭 안 장애물에서 벽·기둥·경계석 통과와 공간 밖 끝점을 실패로 삼는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 건물 접점 두 ID를 실제 외부 공간과 잇는 stair/passage connector 기록으로 바꾼다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work building#approach-contacts의 두 접점, entrance의 두 단, openings의 서비스 문 치수를 대지 connector에 대조했다. 모두 그대로 소비돼 부모 접점이나 설정의 접근 조건을 고치지 않았다.
@evidence settings/40-environment.md#site 도로와 외부 서비스 접근이 끊기지 않도록 대지에서 건물로 들어가는 두 경로를 실제 connector로 만든다.
@evidence settings/10-building.md#ground-access 정문은 두 단 stair, 서비스 문은 같은 높이 passage로 만들어 서비스 쪽에 단을 두지 않는다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 정문과 서비스의 두 접점이 모두 표에 있고 이 두 connector 외에 통로가 없다는 문장이 추가 출입구를 막는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 표에 Z=10.60/9.90, X=9.6/10.8 같은 경로 끝점과 단높이·디딤·폭이 있어 connector 기록을 그대로 만들 수 있다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 계단 1.8m·0.12m·0.35m는 entrance, 1.1×2.2m는 openings 링크에서 받았다고 적어 값의 출처가 드러난다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 대지를 temple-ground나 외벽 경계에 넣지 않는다는 문장이 외벽 입면을 방 하나의 경계로 유지하며 두 연결의 방향도 표에 있다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 문턱 바닥을 대지가 아니라 service-yard 소유로 남기고 connector와 support의 source owner를 나눠 적었다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 connector가 경계석이나 기둥을 통과하는 경우와 끝점이 자기 공간 밖인 경우가 종단면 관찰의 실패로 명시돼 있다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 building은 접점 ID와 방향만 줬고 stair/passage 종류·경로·유효 높이 규칙은 이 H2가 더했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 접점 두 개와 계단·문 치수가 대지 쪽에서 그대로 성립해 부모 접점을 옮기거나 설정 접근 조건을 바꿀 필요가 없었다.
@evidenceReview settings/40-environment.md#site #f317e20 설정의 도로와 외부 서비스 접근이 끊기지 않는다는 조건이 두 connector로 실제 공간 사이 연결이 되었다.
@evidenceReview settings/10-building.md#ground-access #be07d7d 정문만 stair이고 서비스 문은 Y=0 passage라 서비스 경로에 단이 생기지 않는다.
-->

[건물 접점](building.md#approach-contacts)의 두 ID를 `temple-site`의 두 connector로 소비한다. 외부 쪽 공간은 모두 `temple-site`다.

| connector | 종류와 방향 | 경로와 치수 |
| --- | --- | --- |
| connector.site-entrance-stair | stair, temple-site→entrance, 양방향 | X=0에서 계단 발치 앞 Z=10.60m(Y=-0.24)부터 상부참 Z=9.90m(Y=0)까지, 두 단(단높이 0.12m, 디딤 0.35m), 폭은 [현관 계단](rooms/entrance.md#entrance-volume)의 1.8m |
| connector.door-service-exterior | passage, service-yard→temple-site, 양방향 | Z=-6.4m에서 벽 안쪽 면 0.3m 안(X=9.6)부터 바깥면 0.3m 밖(X=10.8)까지 Y=0, 폭과 유효 높이는 [외부 서비스 문](openings.md#doors)의 1.1×2.2m |

정문 connector의 유효 높이는 경로 위 포치 지붕 하부에서 읽고 지붕 밖 구간은 하늘로 열린다. 서비스 문 connector는 기존 문 통과와 같은 규칙으로 만들고 문턱 바닥은 [문턱 귀속](storey.md#threshold-support)대로 service-yard 소유다. 대지 쪽 보행 support는 흙띠·포장의 표면이며 이웃 바닥과 경계석은 보행 목록에 넣지 않는다.

이 두 connector 외에 건물과 대지를 잇는 통로는 없다. 대지는 건물의 방이나 층이 아니므로 `temple-site`를 `temple-ground`에 귀속하거나 건물 외벽 경계에 두 번째 공간으로 등록하지 않는다. 외벽 경계는 계속 방 하나만 가진 입면으로 남는다. source는 connector를 `src/spaces/circulation.ts`가, 대지 support와 공간을 `src/spaces/site/assembly.ts`가 소유한다. 관찰은 두 connector의 종단면과 경로 폭 안의 장애물이며 connector가 벽·기둥·경계석을 통과하거나 끝점이 자기 공간 밖에 있으면 실패다.

## 이웃과 수목의 배치 구역 {#placement-zones}

<!--
@evidence principles/core/common.md#scope-preservation 네 이웃 구역과 벽 밑 풀 띠, 포장·접근 경로의 금지와 관찰 시선 보호를 함께 정해 배경 배치를 무제한으로 두지 않는다.
@evidence principles/core/common.md#substantive-completion 구역별 평면 범위와 허용 개체, 1.5m 후퇴, 풀 띠 0.6m, 접근 양옆 0.5m 금지를 정한다.
@evidence principles/core/common.md#declared-basis 이웃 높이 제한과 비가림은 40-environment#neighborhood·#vegetation에서 받고 후퇴 거리는 저작 선택이다.
@evidence principles/design/spaces.md#space-topology 구역이 포장 밖 이웃 바닥 위에 있고 포장·경계석과 겹치지 않으며 외부 관찰 시선을 막지 않는 관계를 정한다.
@evidence principles/design/spaces.md#space-boundary-authority spaces는 구역만, 개체 위치·수·크기·회전은 instances, 형상은 models가 소유한다고 나눈다.
@evidence principles/design/spaces.md#space-verification-address 조감의 구역과 실제 배치를 대조해 구역 밖 개체·포장 위 개체·관찰 시선 차단을 실패로 삼는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 비가림·높이 조건을 네 구역 좌표와 허용 개체·금지 폭으로 바꾼다.
@evidence upstream/design/spaces.md#settings-and-map-revision-from-space-work 구역을 정하려 하자 40-environment#neighborhood가 열릴 수 없는 maps에 이웃 위치·크기를 맡기고 있음이 드러났다. 그 H2를 spaces 구역과 instances 배치로 고쳤다.
@evidence settings/40-environment.md#neighborhood 길 건너 이웃 외피를 네 구역에만 두고 포치·박공·외곽과 관찰 시선을 가리는 배치를 거부한다.
@evidence settings/40-environment.md#vegetation 나무는 이웃 구역, 풀은 벽 밑 띠에만 두고 문 앞과 접근 포장에서 떨어뜨린다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 구역 밖 금지와 시선 보호가 같이 적혀 이웃과 나무를 건물 바로 앞 거리에 두는 배치가 범위 안으로 들어오지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 네 구역의 좌표표와 후퇴·띠·금지 폭이 적혀 instances가 구역 경계를 새로 정할 필요가 없다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 높이·비가림은 설정 링크, 1.5m 후퇴와 0.6m 띠는 저작 결정으로 나뉘어 있다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 표 바로 뒤 문단이 구역은 모두 포장 가장자리에서 1.5m 물러난 이웃 바닥 위이고 포장·경계석·두 접근 포장에는 개체를 두지 않는다고 적어, 좌표표와 함께 포장과 겹치지 않는 관계를 준다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 이 H2는 개체 수나 크기를 하나도 정하지 않고 instances·models에 남겨 배치 결정을 두 번 저작하지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 시선을 막는 개체는 구역 안이라도 거부된다는 조건이 조감 대조만 통과하는 배치를 실패로 돌린다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 설정은 높이·비가림만 주었고 구역 좌표와 풀 띠는 공간 층이 더한 결정이다.
@evidenceReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 드러난 결함인 #neighborhood의 maps 배치 배정과 수정한 부모 H2가 적혀 있고 구역은 수정된 배정을 소비한다.
@evidenceReview settings/40-environment.md#neighborhood #459e898 설정의 박공과 포치·외곽을 가리지 않는다는 조건이 관찰 시선 거부 규칙과 구역 후퇴로 이어졌다.
@evidenceReview settings/40-environment.md#vegetation #bdc9c1c 설정의 부재·문·검토 카메라를 가리지 않는다는 조건이 풀의 접근 양옆 0.5m 금지와 나무의 구역 제한으로 옮겨졌다.
-->

[주변 건물](../settings/40-environment.md#neighborhood)과 [식생](../settings/40-environment.md#vegetation)을 instances가 배치할 구역과 금지 조건을 정한다. spaces는 구역만 소유하고 개체의 위치·수·크기·회전은 instances, 형상은 models 소유다.

| 구역 | 평면 범위(m) | 허용 개체 |
| --- | --- | --- |
| 남쪽 이웃 구역 | Z=23.05~35.25, 범위 전폭 | 이웃 외피, 나무 |
| 서쪽 이웃 구역 | X=-35.5~-16.3, Z=-35.25~12.05 | 이웃 외피, 나무 |
| 동쪽 이웃 구역 | X=16.3~35.5, Z=-35.25~12.05 | 이웃 외피, 나무 |
| 북쪽 이웃 구역 | Z=-35.25~-16.05, X=-16.3~16.3 | 이웃 외피, 나무 |
| 벽 밑 풀 띠 | 벽 밑 흙띠 중 벽 바깥면에서 0.6m 안 | 풀 |

이웃 구역은 포장 가장자리에서 1.5m 물러난 이웃 바닥 위다. 네 구역 밖의 포장·경계석·진입 포장·서비스 문 앞 포장에는 어떤 개체도 두지 않는다. 풀은 정문 진입 포장과 서비스 문 앞 포장의 양옆 0.5m 안에 두지 않는다. 이웃 외피의 높이는 설정대로 신전보다 낮거나 비슷해야 하며 [관찰](observations.md#geometry-observations)의 외부 관찰 위치와 그 시선이 신전의 포치·박공·외곽에 닿는 경로를 막는 배치는 구역 안이라도 거부한다.

구역 경계는 `src/spaces/site/extent.ts`가 내보내고 instances가 소비한다. 현재 instances 분기가 열리지 않았으므로 이웃과 나무는 아직 없고 그 배치 결과는 unverified다. 관찰은 조감 평면의 구역과 실제 배치의 대조이며 구역 밖 개체, 포장 위 개체, 외부 관찰 시선을 막는 개체가 있으면 실패다.

## 먼 능선과 기슭 {#distant-ridge}

<!--
@evidence principles/core/common.md#scope-preservation 40~100m 능선과 대지 밖 기슭만 맡고 보행·시설·식생 개체를 두지 않는다.
@evidence principles/core/common.md#substantive-completion 발치·마루 반지름, 마루 높이 식, 72분할, 기슭 220m 사각형을 정한다.
@evidence principles/core/common.md#declared-basis 거리 범위와 낮은 윤곽은 40-environment#distant-terrain에서 받고 반지름과 높이 식은 저작 선택이다.
@evidence principles/design/spaces.md#space-topology 능선과 기슭이 보행 support·공간 cell·배치 구역 밖의 배경 표면이라는 관계를 정한다.
@evidence principles/design/spaces.md#space-boundary-authority 기슭 높이는 site-grade 규칙을 이어받고 능선 형상은 ridge.ts 한 곳이 소유한다.
@evidence principles/design/spaces.md#space-verification-address 외부 조감과 거리 서쪽 끝 눈높이 시점에서 능선의 위계와 기슭 단차·틈을 실패 조건으로 둔다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 설정의 40~100m 낮은 능선을 반지름·높이 식·분할로 된 입체 형상으로 바꾼다.
@evidence upstream/design/spaces.md#settings-and-map-revision-from-space-work 능선을 만들려 하자 40-environment#distant-terrain이 열릴 수 없는 maps에 높이·윤곽을 맡기고 있음이 드러나 그 H2를 spaces 대지 owner로 고쳤다.
@evidence settings/40-environment.md#distant-terrain 건물에서 약 41.3~97.8m 떨어진 낮고 완만한 입체 능선을 사진 없이 만든다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 능선과 기슭에 개체를 두지 않는다는 문장이 먼 배경을 새 보행·식생 납품 구역으로 넓히지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 반지름 세 개와 H(φ) 식, 72조각, 220m 기슭이 있어 능선 형상을 source가 새로 고르지 않는다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 40~100m와 낮은 윤곽은 설정, 56·88·108m와 식의 계수는 저작 선택으로 구별돼 있다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 능선을 support·cell·구역에 넣지 않는다고 적어 배경 표면이 보행 가능한 장소로 읽히지 않는다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 기슭의 높이를 새로 정하지 않고 site-grade 규칙을 이어받아 대지 경계에서 두 높이 규칙이 겹치지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 능선이 신전 실루엣 뒤에 낮게 놓이는지와 대지-기슭 단차가 지정된 두 시점의 실패 조건으로 남는다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 설정의 거리·역할만으로는 형상이 없고 고리 반지름·마루 높이 식이 공간 층의 결정이다.
@evidenceReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 드러난 결함인 #distant-terrain의 maps 높이 배정과 수정한 부모 H2가 적혀 있다.
@evidenceReview settings/40-environment.md#distant-terrain #77d325d 최소 41.3m·최대 97.8m 거리와 뒤쪽 약 19°, 정면 쪽 11° 이하의 안쪽 경사가 설정의 40~100m 낮고 완만한 능선을 지킨다.
-->

[먼 지형](../settings/40-environment.md#distant-terrain)의 40~100m 낮고 완만한 입체 능선을 소유한다. 능선은 원점을 중심으로 한 고리 모양의 열린 표면이다. 안쪽 발치 반지름 56m, 마루 반지름 88m, 바깥 발치 반지름 108m이고 발치는 Y=-0.30m에서 지면 아래로 들어간다. 건물에서 가장 가까운 거리는 외곽 모서리(반지름 약 14.7m)에서 안쪽 발치까지 약 41.3m, 가장 먼 거리는 축 방향 바깥면에서 바깥 발치까지 약 97.8m로 설정 범위 안에 있다.

마루 높이는 방위각 φ(정면 +Z에서 0, 동쪽 +X로 증가)에 대해 H(φ)=7.0−2.5·cos φ+1.2·sin(3φ+0.7)+0.6·sin(7φ+1.9) m다. 정면을 중심으로 한 ±60° 구간은 약 3.3~5.9m로 낮고 신전 뒤쪽 ±60° 구간은 약 8.1~10.7m로 높아 지붕 뒤 수평선을 이룬다. 안쪽 경사는 가장 높은 곳에서도 약 19°, 정면 쪽은 약 11° 이하다. 둘레를 72조각(5°)으로 나누고 각 조각은 안쪽 경사·바깥 경사의 삼각형 면으로 만든다. 능선 아래와 국소 대지 사이의 기슭은 대지 범위 밖에서 한 변 220m 사각형까지 [지면의 높이](#site-grade) 규칙을 이어받은 평면이다.

능선과 기슭은 보행·시설·식생 개체가 없는 배경 표면이며 보행 support나 공간 cell에 넣지 않는다. 평면 사진이나 billboard를 쓰지 않는다. 산이나 절벽처럼 신전보다 주인공이 되는 형상도 만들지 않는다. 표면은 `surface.site-distant.ridge`와 `surface.site-distant.ground`이고 source owner는 `src/spaces/site/ridge.ts`다. 관찰은 외부 setting 조감과 정면 거리 서쪽 끝(X=-26, Z=18)의 눈높이 시점에서 능선이 신전 실루엣 뒤에 낮게 놓이는지와 국소 대지와 기슭 사이 단차·틈이 없는지다.

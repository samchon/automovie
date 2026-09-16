# 공간 기준

## 좌표와 전체 치수 {#coordinate-datum}
<!--
@evidence principles/core/common.md#declared-basis Y-up·meter·11×12m·층고를 공간 저작의 declared basis로 둔다.
@evidence principles/core/common.md#scope-preservation 목표 범위와 측량값을 혼동하지 않고 단순 box graph를 유지한다.
@evidence principles/core/common.md#substantive-completion 모든 공간과 외피가 동일한 좌표 기준으로 실현되게 한다.
@evidence principles/core/settings.md#capability-boundary 명시된 목표 규모를 시공 측량이나 인증으로 확대하지 않는다.
@evidence principles/core/settings.md#constraint-sufficiency 층선·벽 두께·clear height가 graph 실현을 제한한다.
@evidence principles/core/settings.md#fact-status 명시 치수와 unverified 성능 주장을 분리한다.
@evidence principles/core/settings.md#observable-identity 전체 box와 두 storey가 올바른 scale로 읽히게 한다.
@evidence principles/core/settings.md#source-support datum과 치수를 공간 source의 동일 규칙에 연결한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Read the shared declared-basis checklist and checked the Y-up, metre, footprint, and storey basis.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 Read the shared scope checklist and checked target scale is not treated as a survey value.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 Read the shared completion checklist and checked that spaces and envelope use one coordinate basis.
@evidenceReview principles/core/settings.md#capability-boundary #83a6f2c Read the capability-boundary checklist and checked that target dimensions are not construction measurement or certification.
@evidenceReview principles/core/settings.md#constraint-sufficiency #20cf612 Read the constraint-sufficiency checklist and checked storey lines, wall thickness, and clear height.
@evidenceReview principles/core/settings.md#fact-status #93a284a Read the fact-status checklist and checked stated dimensions against unverified performance claims.
@evidenceReview principles/core/settings.md#observable-identity #4ccb62e Read the observable-identity checklist and checked that the two-storey box reads at the declared scale.
@evidenceReview principles/core/settings.md#source-support #430bca9 Read the source-support checklist and checked datum and dimensions against the space-source rules.
-->

**Status:** production choice, reference pixel 비례가 아닌 구조·동선·시각 blocking을 함께 만족시키기 위해 정한 값.

세계 단위는 m이며 오른손 `Y-up` 좌표를 쓴다. 평면에서 +X는 동쪽, +Z는 후면이며 전면은 -Z다. 외곽 기준은 x=-5.5..5.5, z=-6.0..6.0인 11.0×12.0m 직사각형이다. 완성 바닥면적은 외곽 132㎡에서 벽체·계단·설비 코어를 제외한 약 250㎡ 목표 범위로 읽는다.

1층 finished floor는 y=0, 2층 finished floor는 y=3.0이며 slab은 0.20m다. 실내 clear height는 각 층 2.70m를 목표로 한다. 외피는 0.24m opaque wall 또는 0.12m curtainwall assembly로 모델링하고, 지붕 구조 상단은 y=6.20, PV canopy 상단은 약 y=6.80으로 둔다.

## 1층 공간 그래프 {#ground-graph}
<!--
@evidence principles/core/common.md#declared-basis 1층의 named spaces와 단일 dogleg stair 경로를 선언한다.
@evidence principles/core/common.md#scope-preservation branch corridor와 disconnected room을 배제한다.
@evidence principles/core/common.md#substantive-completion 모든 요구 공간이 실제 connector와 opening으로 닿게 한다.
@evidence principles/core/settings.md#capability-boundary 구조적으로 표현 가능한 공간 graph만 주장한다.
@evidence principles/core/settings.md#constraint-sufficiency entry에서 flex·common·core·stair가 닿는 조건을 닫는다.
@evidence principles/core/settings.md#fact-status graph의 authored topology와 시각적 read를 분리한다.
@evidence principles/core/settings.md#observable-identity 1층 각 room이 threshold·모서리·중심 관찰을 받을 수 있게 한다.
@evidence principles/core/settings.md#source-support ground graph를 동일한 source owner와 compiled environment에 연결한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Read the shared declared-basis checklist and checked the named ground spaces and single dogleg stair.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 Read the shared scope checklist and checked that branch corridors and disconnected rooms are excluded.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 Read the shared completion checklist and checked every required ground space has an explicit connection.
@evidenceReview principles/core/settings.md#capability-boundary #83a6f2c Read the capability-boundary checklist and checked only structurally expressible space graph is claimed.
@evidenceReview principles/core/settings.md#constraint-sufficiency #20cf612 Read the constraint-sufficiency checklist and checked entry access to flex, common, core, and stair.
@evidenceReview principles/core/settings.md#fact-status #93a284a Read the fact-status checklist and checked authored topology against visual read.
@evidenceReview principles/core/settings.md#observable-identity #4ccb62e Read the observable-identity checklist and checked ground-room threshold, corners, and centre targets.
@evidenceReview principles/core/settings.md#source-support #430bca9 Read the source-support checklist and checked ground graph against its compiled environment owner.
-->

1층은 `entry`가 유일한 전면 진입 node다. `flex-workroom`은 entry에 직접 붙고, `common-room`은 entry에 직접 붙으며 living·dining·kitchen이 후면을 따라 하나의 연속 공간을 이룬다. `powder-utility`와 `storage-1f`는 우측 opaque service core 안에서 entry/common에 각각 직접 붙는다. 계단은 entry에서 시작해 하나의 중간 landing을 거쳐 `upper-corridor`로 올라간다.

선택한 room bounds는 다음과 같다. bounds는 wall face 안쪽의 논리 범위이며, 실제 wall thickness와 door reveal은 source가 함께 낸다: `entry` x=-1.55..1.55, z=-5.76..-2.90; `flex-workroom` x=-5.26..-1.80, z=-5.76..-2.90; `common-room` x=-5.26..3.26, z=-2.66..5.76; `powder-utility` x=3.26..5.26, z=-5.76..-2.66; `storage-1f` x=3.26..5.26, z=-2.66..0.10.

## 2층 공간 그래프 {#upper-graph}
<!--
@evidence principles/core/common.md#declared-basis upper corridor와 다섯 사적·서비스 공간의 관계를 선언한다.
@evidence principles/core/common.md#scope-preservation 두 번째 계단·분기 복도·단절된 방을 배제한다.
@evidence principles/core/common.md#substantive-completion 각 2층 공간이 짧은 corridor의 실제 문으로 닿게 한다.
@evidence principles/core/settings.md#capability-boundary 하나의 2층 공간 graph만 저작한다.
@evidence principles/core/settings.md#constraint-sufficiency bounds와 door landings가 upper circulation을 제한한다.
@evidence principles/core/settings.md#fact-status 공간 경계의 선언과 미검증 시각 결과를 구분한다.
@evidence principles/core/settings.md#observable-identity 각 침실·욕실·수납·서비스 공간이 자기 방으로 읽히게 한다.
@evidence principles/core/settings.md#source-support upper graph를 source owner와 compiled topology에 연결한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Read the shared declared-basis checklist and checked the upper corridor and private/service spaces.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 Read the shared scope checklist and checked that no second stair, branch corridor, or disconnected room appears.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 Read the shared completion checklist and checked direct doors from the short upper corridor.
@evidenceReview principles/core/settings.md#capability-boundary #83a6f2c Read the capability-boundary checklist and checked that one upper graph is authored.
@evidenceReview principles/core/settings.md#constraint-sufficiency #20cf612 Read the constraint-sufficiency checklist and checked upper bounds and door landings.
@evidenceReview principles/core/settings.md#fact-status #93a284a Read the fact-status checklist and checked declared boundaries against unverified visual results.
@evidenceReview principles/core/settings.md#observable-identity #4ccb62e Read the observable-identity checklist and checked each bedroom, bath, storage, and service space identity.
@evidenceReview principles/core/settings.md#source-support #430bca9 Read the source-support checklist and checked upper graph against the compiled topology owner.
-->

2층은 `upper-corridor` 하나만 공용 circulation spine으로 갖는다. corridor는 계단 landing에서 시작해 primary bedroom, child bedroom 2, child bedroom 1, upper bathroom, upper storage의 문에 직접 닿는다. `upper-service`는 우측 core의 설비·덕트 zone이며 corridor에서 직접 접근 가능한 수납·점검 영역으로 둔다. branch corridor, second stair, disconnected room은 없다.

선택한 upper bounds는 다음과 같다: `primary-bedroom` x=-5.26..0.00, z=2.66..5.76; `child-bedroom-2` x=-5.26..0.00, z=-0.02..2.60; `child-bedroom-1` x=-5.26..0.00, z=-5.76..-0.04; `upper-corridor` x=0.20..1.90, z=-4.30..2.60; `upper-bathroom` x=1.90..5.26, z=1.60..4.40; `upper-storage` x=1.90..5.26, z=0.00..1.50; `upper-service` x=1.90..5.26, z=-5.76..-0.04.

## 외피·개구부·프라이버시 {#envelope-and-privacy}
<!--
@evidence principles/core/common.md#declared-basis curtainwall·opaque core·electrochromic·translucent glass·차양을 외피 basis로 선언한다.
@evidence principles/core/common.md#scope-preservation 고정 graph를 바꾸지 않고 외피만 표현한다.
@evidence principles/core/common.md#substantive-completion 바닥선·방 경계에 맞는 bay와 privacy 장치를 실제 부재로 구현한다.
@evidence principles/core/settings.md#capability-boundary glass 성능 인증이나 에너지 성능을 주장하지 않는다.
@evidence principles/core/settings.md#constraint-sufficiency front/rear bay·right opaque wall·canopy 지지 조건을 닫는다.
@evidence principles/core/settings.md#fact-status material state와 실제 인증되지 않은 performance를 구분한다.
@evidence principles/core/settings.md#observable-identity 유리 많은 일상 주택과 privacy control이 함께 읽히게 한다.
@evidence principles/core/settings.md#source-support 외피 규칙을 population과 element source owner에 연결한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Read the shared declared-basis checklist and checked curtainwall, opaque core, glass, shading, and PV.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 Read the shared scope checklist and checked envelope expression does not change the fixed graph.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 Read the shared completion checklist and checked bay alignment and privacy devices are authored.
@evidenceReview principles/core/settings.md#capability-boundary #83a6f2c Read the capability-boundary checklist and checked that glass and energy performance are not certified.
@evidenceReview principles/core/settings.md#constraint-sufficiency #20cf612 Read the constraint-sufficiency checklist and checked front/rear bays, right wall, and canopy supports.
@evidenceReview principles/core/settings.md#fact-status #93a284a Read the fact-status checklist and checked material state against uncertified performance.
@evidenceReview principles/core/settings.md#observable-identity #4ccb62e Read the observable-identity checklist and checked the everyday glazed house and privacy controls.
@evidenceReview principles/core/settings.md#source-support #430bca9 Read the source-support checklist and checked envelope populations and elements.
-->

전면 stair bay, 전면 flex bay, 후면 common bay, 2층 전면 bedroom/corridor bay는 각 대응 room bounds의 x span을 bay count로 나눈 측정 폭으로 나눈다. 0.12m curtainwall assembly의 inner face는 front room z=-5.76, rear room z=5.76에 맞추고 source는 그 inner face와 assembly thickness에서 center를 계산한다. source는 각 bay center, width, floor-to-ceiling height를 그 room bounds와 floor line에서 직접 유도하므로 module 끝이 room 경계와 일치한다. 우측 x=5.50 쪽은 opaque service wall로 묶고, 좌측은 구조적으로 필요한 opaque return과 제한된 glass를 둔다. roof는 직사각형 box 위 y=6.20에서 시작하는 네 개의 support post를 세워 y=6.80에서 끝나는 별도 canopy frame으로 표현하며 cantilevered house mass는 만들지 않는다.

프라이버시는 세 단계다. 낮에는 후면 common의 clear electrochromic glass가 열리고 전면 private bay는 반투명 tint를 기본으로 한다. 야간 또는 외부 시선이 강한 상태에서는 glass tint가 어두워지고 translucent interlayer와 roller shade가 silhouette만 남긴다. canopy의 수평 PV/slat과 sill-level exterior fin은 직사광선과 맞은편 시선을 낮춘다. 이 제어는 material·fit-out 상태의 시각 표현이며 실제 전기변색 장치의 성능 인증이 아니다.

## 표면 소유 선언 {#surface-decomposition}
<!--
@evidence principles/core/common.md#declared-basis 입면·층·방별 surface owner를 선언한다.
@evidence principles/core/common.md#scope-preservation 완결된 시각 표면을 여러 owner로 쪼개지 않는다.
@evidence principles/core/common.md#substantive-completion 반복 부재·fit-out·지붕·공용 표면의 owner를 모두 기록한다.
@evidence principles/core/settings.md#capability-boundary surface declaration을 실제 authored owner 범위에 둔다.
@evidence principles/core/settings.md#constraint-sufficiency floor line·room boundary·population 반복 규칙을 owner 결정에 반영한다.
@evidence principles/core/settings.md#fact-status 선언된 owner와 아직 검증하지 않은 재료 읽힘을 구분한다.
@evidence principles/core/settings.md#observable-identity 어떤 표면이 어느 주택 요소에 속하는지 추적 가능하게 한다.
@evidence principles/core/settings.md#source-support 문서 owner와 TypeScript carrier를 하나의 lineage로 연결한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb Read the shared declared-basis checklist and checked the facade, floor, room, roof, and fit-out owners.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 Read the shared scope checklist and checked that no surface is split across owners.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 Read the shared completion checklist and checked repeated envelope, fit-out, roof, and common surfaces are assigned.
@evidenceReview principles/core/settings.md#capability-boundary #83a6f2c Read the capability-boundary checklist and checked surface declarations stay within authored owners.
@evidenceReview principles/core/settings.md#constraint-sufficiency #20cf612 Read the constraint-sufficiency checklist and checked floor lines, room boundaries, and population rules.
@evidenceReview principles/core/settings.md#fact-status #93a284a Read the fact-status checklist and checked declared ownership against unverified material read.
@evidenceReview principles/core/settings.md#observable-identity #4ccb62e Read the observable-identity checklist and checked each surface can be traced to its house element.
@evidenceReview principles/core/settings.md#source-support #430bca9 Read the source-support checklist and checked document owner and TypeScript carrier lineage.
-->

하나의 완결된 시각 표면은 하나의 owner만 가진다. `spaces/001-citizen-house.md`가 건물·층·room 경계와 floor 의미를 소유하고, `src/spaces/citizen-house.ts`가 그 그래프와 실제 환경 carrier를 소유한다. source 내부의 box model helper는 공통 primitive만 소유하며 방의 경계나 외피 관계를 새로 결정하지 않는다.

입면 owner는 `front-stair-curtainwall`, `front-flex-curtainwall`, `rear-common-curtainwall`, `left-return-envelope`, `right-service-envelope`로 나눈다. 층별 floor·ceiling owner는 `ground-storey-surfaces`와 `upper-storey-surfaces`, 지붕·PV·canopy owner는 `roof-canopy`다. room별 fit-out surface owner는 `entry-fitout`, `flex-fitout`, `common-fitout`, `ground-core-fitout`, `primary-fitout`, `child-fitout`, `upper-corridor-fitout`, `upper-core-fitout`이며 한 표면을 여러 owner가 다시 칠하지 않는다.

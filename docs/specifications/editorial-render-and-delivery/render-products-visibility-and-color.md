# Render product, visibility와 color

## Contract units {#spec-render-products-visibility-color-contract-units}

### Pass, channel과 multi-view product {#spec-render-pass-products}
<!-- @evidence requirements/rendering/passes-channels-and-products.md#rendering-passes-channels-products 여러 render product의 identity를 정밀화한다. -->
<!-- @evidence requirements/rendering/passes-channels-and-products.md#rendering-beauty-structural-distinction Beauty와 structural pass 경계를 정밀화한다. -->
<!-- @evidence requirements/rendering/passes-channels-and-products.md#rendering-arbitrary-channels Channel semantic을 정밀화한다. -->
<!-- @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Identity mask 안정성을 정밀화한다. -->
<!-- @evidence requirements/rendering/passes-channels-and-products.md#rendering-multiview-products View별 product identity를 정밀화한다. -->
<!-- @evidence requirements/rendering/passes-channels-and-products.md#rendering-pass-dependencies Pass dependency와 order를 정밀화한다. -->
<!-- @evidence requirements/rendering/passes-channels-and-products.md#rendering-partial-product-set Partial product set을 정밀화한다. -->
<!-- @evidence requirements/rendering/passes-channels-and-products.md#rendering-pass-refusal Unsupported pass 거절 조건을 정밀화한다. -->
<!-- @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-control-alignment Beauty와 control pass의 alignment가 rendition input 경계를 결정한다. -->

Product는 purpose, camera·view, frame schedule, dimensions, pass, channel schema, data type, background, color treatment와 dependency closure를 가진 독립 identity다. Semantic mask v2 identity는 digest 자신을 제외한 canonical full payload를 seal하고, current mask product는 exact frame과 shot에 대한 verified palette, zero-gap runtime coverage, sidecar path·bytes·digest를 manifest 또는 chunk receipt에서 함께 다시 열 수 있어야 한다. Historical schema, missing 또는 tampered sidecar, foreign shot, unresolved id나 unnamed mesh는 current complete가 아니다. Beauty는 appearance를, structural product는 geometry, depth, normal, pose 또는 semantic identity 같은 선언된 사실을 표현하고 beauty-only light·tone·atmosphere가 structural 값에 섞이지 않는다. 임의 channel은 component order, unit, coordinate space, precision, missing value와 valid region을 명시한다.

Identity mapping은 source owner와 instance를 frame·chunk에 걸쳐 안정적으로 유지하고 background, transparency, occlusion과 anti-aliased boundary 처리 규칙을 함께 제공한다. 여러 camera, eye, crop, resolution과 delivery version은 같은 time을 공유할 수 있어도 서로 다른 product다. 다른 pass를 소비하는 product는 ordered dependency를, 독립 pass는 request order와 무관한 result를 가져야 한다.

Expected, completed, failed, unsupported와 not-run products 및 frame ranges를 구분한다. Unknown pass·channel, identity collision, invalid precision, incompatible transparency, unavailable runtime capability와 beauty effect leakage는 거절한다. 성공 beauty를 missing structural output으로 대체하지 않고, aligned control set이 불완전하면 optional rendition의 선행 조건도 complete로 만들지 않는다.

### Geometry ownership, visibility와 culling {#spec-render-visibility-culling}
<!-- @evidence requirements/rendering/geometry-visibility-and-culling.md#rendering-geometry-visibility-culling Frame 참여 geometry의 판정을 정밀화한다. -->
<!-- @evidence requirements/rendering/geometry-visibility-and-culling.md#rendering-hierarchical-transforms Hierarchical transform 합성을 정밀화한다. -->
<!-- @evidence requirements/rendering/geometry-visibility-and-culling.md#rendering-deformed-bounds Deformed bounds를 정밀화한다. -->
<!-- @evidence requirements/rendering/geometry-visibility-and-culling.md#rendering-visibility-state Visibility state 분류를 정밀화한다. -->
<!-- @evidence requirements/rendering/geometry-visibility-and-culling.md#rendering-room-region-culling Room과 region culling을 정밀화한다. -->
<!-- @evidence requirements/rendering/geometry-visibility-and-culling.md#rendering-frustum-boundaries Frustum boundary convention을 정밀화한다. -->
<!-- @evidence requirements/rendering/geometry-visibility-and-culling.md#rendering-culling-diagnostics Culling decision 관찰성을 정밀화한다. -->
<!-- @evidence requirements/rendering/geometry-visibility-and-culling.md#rendering-culling-refusal Unsafe culling 거절 조건을 정밀화한다. -->

Visibility evaluation은 resolved geometry owner, parent transform chain, current deformation, camera·view, authored visibility, phase, layer, room·region, frustum과 pass relation을 입력으로 받는다. Local transform은 declared handedness와 unit의 ordered hierarchy로 합성하고, bounds는 현재 skin, morph, soft surface와 supported procedural displacement를 conservative하게 포함한다. Culling은 source deletion이나 모든 consumer의 exclusion이 아니다.

상태는 authored-visible, authored-hidden, phase-disabled, layer-excluded, room-culled, frustum-culled, supported occlusion과 unknown을 구분한다. Camera room membership, openings, region boundary, near·far, crop와 margin의 접촉 포함 규칙과 tolerance는 product identity에 들어간다. Beauty camera에서 보이지 않아도 shadow, reflection, sound evidence 또는 structural pass가 필요한 object는 consumer별로 다시 평가한다.

Decision trace는 source visibility에서 final participation까지 각 transform, bounds, plane·region test와 exclusion reason을 반환한다. Invalid bounds, non-finite transform, hierarchy cycle, unknown state와 budget 편의를 위한 required owner 제거는 거절한다. Conservative recovery는 더 많이 그리는 방향만 허용하고 partial frame은 missing owner와 affected pass를 명시하며 final-capable로 승인하지 않는다.

### Material, lighting과 color pipeline {#spec-render-material-color}
<!-- @evidence requirements/rendering/materials-lighting-and-color.md#rendering-materials-lighting-color Material과 light의 working color 경계를 정밀화한다. -->
<!-- @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Material binding precedence를 정밀화한다. -->
<!-- @evidence requirements/rendering/materials-lighting-and-color.md#rendering-external-materials External material channel 보존을 정밀화한다. -->
<!-- @evidence requirements/rendering/materials-lighting-and-color.md#rendering-texture-decode Texture decode intent를 정밀화한다. -->
<!-- @evidence requirements/rendering/materials-lighting-and-color.md#rendering-lighting-evaluation Fixed state lighting 평가를 정밀화한다. -->
<!-- @evidence requirements/rendering/materials-lighting-and-color.md#rendering-scene-display-color Scene-linear와 display transform 경계를 정밀화한다. -->
<!-- @evidence requirements/rendering/materials-lighting-and-color.md#rendering-transparency-alpha Transparency와 alpha 의미를 정밀화한다. -->
<!-- @evidence requirements/rendering/materials-lighting-and-color.md#rendering-color-recovery Diagnostic color fallback recovery를 정밀화한다. -->
<!-- @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-refusal Material과 color 거절 조건을 정밀화한다. -->

Surface evaluation은 stable material owner, source channels, instance override precedence, texture digest·decode intent·sampler·coordinate, opacity, transmission, emission과 scene lights를 declared scene-linear working domain에서 결합한다. Color texture와 numeric texture는 같은 bytes라도 별도 semantic decode를 가지며 external channel이나 extension을 지원하지 않으면 손실된 appearance 사실을 보고한다. Light type, transform, intensity meaning, color, shaping, shadow와 environment는 fixed frame state에서 canonical order로 평가한다. 재료가 피하 산란 반경을 가지면 직접광의 확산 항만 반투명 표면의 사전 적분 응답으로 바꾼다: fragment마다 보간 법선의 화면 공간 변화를 view 위치의 변화로 나눠 곡률 κ를 추정하고, 원색마다 clamp된 cosine을 표준편차 σκ(σ는 그 원색의 반경) 라디안의 원 둘레 가우스로 평균한 표(Penner·Borshukov 2011, 확산 profile 대신 가우스)를 읽는다. 원 위의 평균은 Lambert 평균 1/π로 보존되며, 평평한 표면은 Lambert 그대로이고 휜 표면은 명암 경계 너머로 붉고 부드럽게 번진다. Specular, clearcoat와 간접광은 바뀌지 않는다. 재료가 두 번째 법선 map을 가지면 그 map을 자기 좌표 변환으로 UV 0에서 표본화하고, 기울기에 배율을 곱한 뒤 접선 공간에서 첫 map과 whiteout으로 섞는다(`normalize(vec3(n1.xy + n2.xy, n1.z · n2.z))`). 셰이더 변경이 여럿이면 추가된 순서대로 적용하고 program key가 모두를 이름 짓는다.

Pipeline은 input color identity, scene-linear intermediate, tone 또는 view transform, display-referred preview와 encoded output transform을 구분하고 한 transform이 두 단계에 중복 적용되지 않게 lineage를 만든다. Product별 opaque, masked, supported blended surface, straight 또는 premultiplied alpha와 background expectation을 선언한다. Transparent ordering이 결과에 영향을 주면 deterministic ordering 또는 unsupported condition으로 처리한다.

Receipt는 resolved binding, missing channels, texture facts, lighting state, working·display transforms, alpha contract와 diagnostic fallback을 제공한다. Missing required texture, invalid coordinate, unknown color space, non-finite parameter, unsupported transmission, cyclic material relation과 resource 초과는 거절한다. Preview fallback은 affected frame과 identity를 바꾸고 final-capable이 아니며 원 dependency가 복구되면 fallback products를 stale로 만든다.

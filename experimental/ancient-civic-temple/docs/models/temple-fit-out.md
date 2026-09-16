# Ancient civic temple model designs

이 문서는 review된 `docs/spaces/temple.md`의 공간·개구부·표면 host를 소비하는 blocking prototype을 닫는다. 모든 prototype은 오른손잡이 Y-up metre 좌표, 명시적 local origin, 고정 hierarchy, stable surface owner, deterministic geometry를 갖는다. 이 문서는 placement, repeated membership, material response, water simulation, camera, 또는 역사적 복원을 소유하지 않는다. 수치는 레퍼런스 픽셀에서 역산하지 않고 settings의 compiled scale anchor와 이 prototype의 blocking 목적에서 채택한다.

## Model scope, scale, and fidelity {#model-scope-scale-and-fidelity}

<!--
@evidence principles/core/common.md#declared-basis The reviewed settings and spaces source provide the metre, floor, height, opening, and blocking basis for this model population.
@evidence principles/core/common.md#scope-preservation This unit keeps prototype geometry, placement, finish, and population as separate owners while defining their shared model boundary.
@evidence principles/core/common.md#substantive-completion This unit closes the common scale anchors, proxy ceiling, and neutral comparison set used by every prototype below.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds a model-owned representation and review boundary beyond the reviewed space topology.
@evidence principles/design/models.md#representation-contract This unit defines the bounded prototype population, stable interfaces, and omitted fidelity rather than a parseable placeholder.
@evidence principles/design/models.md#spatial-convention This unit fixes the shared Y-up metre frame and local-origin rule used by every prototype.
@evidence principles/design/models.md#reviewable-structure This unit fixes the neutral views and common scale comparison that expose model regressions.
@evidence principles/design/models.md#model-observable-style-basis This unit translates the temple's visual grammar into observable blocking silhouettes without claiming finish.
@evidence principles/design/models.md#model-scale-layer-completion This unit closes the shared scale, occupied layers, stable interfaces, limits, and observations for the model population.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work This unit tests the inherited metre, height, opening, route, and fidelity limits before any prototype is consumed.
@evidence spaces/temple.md#envelope-opening-and-interior-interface This unit consumes the reviewed floor, room height, host depth, and opening boundary as model scale inputs.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions This unit carries the reviewed prototype identity and blocking exclusions into model-owned geometry.
@evidence settings/temple.md#delivery-scope This model-scope-scale-and-fidelity unit realizes the reviewed settings boundary for delivery-scope.
@evidence settings/temple.md#governing-aim This model-scope-scale-and-fidelity unit realizes the reviewed settings boundary for governing-aim.
@evidence settings/temple.md#production-visual-grammar This model-scope-scale-and-fidelity unit realizes the reviewed settings boundary for production-visual-grammar.
@evidence settings/temple.md#production-fidelity-tier This model-scope-scale-and-fidelity unit realizes the reviewed settings boundary for production-fidelity-tier.
@evidence settings/temple.md#subject-breakdown-production-scope This model-scope-scale-and-fidelity unit realizes the reviewed settings boundary for subject-breakdown-production-scope.
@evidence settings/temple.md#audience-operator-access This model-scope-scale-and-fidelity unit realizes the reviewed settings boundary for audience-operator-access.
@evidence settings/temple.md#accessibility-deliverable-states This model-scope-scale-and-fidelity unit realizes the reviewed settings boundary for accessibility-deliverable-states.
@evidence settings/temple.md#coordinate-unit-convention This model-scope-scale-and-fidelity unit realizes the reviewed settings boundary for coordinate-unit-convention.
@evidence settings/temple.md#stage-policy This model-scope-scale-and-fidelity unit realizes the reviewed settings boundary for stage-policy.
@evidence settings/temple.md#delivery-review-condition This model-scope-scale-and-fidelity unit realizes the reviewed settings boundary for delivery-review-condition.
@evidence settings/temple.md#settings-coverage-map This model-scope-scale-and-fidelity unit realizes the reviewed settings boundary for settings-coverage-map.
@evidence settings/temple.md#operative-subject-inventory This model-scope-scale-and-fidelity unit realizes the reviewed settings boundary for operative-subject-inventory.
@evidence settings/temple.md#design-dependent-subject-conditions This model-scope-scale-and-fidelity unit realizes the reviewed settings boundary for design-dependent-subject-conditions.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits This model-scope-scale-and-fidelity unit realizes the reviewed settings boundary for subject-observable-identity-and-fit-out-limits.
@evidence settings/temple.md#reference-interpretation-boundary This model-scope-scale-and-fidelity unit realizes the reviewed settings boundary for reference-interpretation-boundary.
@evidence obligations/core/common.md#purpose-fit The model scope assigns every promised bounded prototype to the library's civic blocking purpose.
@evidence obligations/core/common.md#layer-boundary The model scope keeps prototype construction separate from space, material, instance, and viewer ownership.
@evidence obligations/core/common.md#production-language The model scope names stable English prototype roles alongside the production's authored language.
@evidence obligations/core/common.md#proportionate-development The model scope limits the prototype set to consequential blocking geometry rather than unsupported detail.
@evidence obligations/design/models.md#addressable-model-decisions The model scope identifies the independently reviewable prototype H2 owners and their stable boundaries.
@evidence obligations/design/models.md#representation-ceiling The model scope states the blocking proxy ceiling and refuses photoreal or simulated detail.
@evidence obligations/design/models.md#reference-scale The model scope establishes the common metre, door, room-height, and route scale anchors.
@evidence obligations/design/models.md#articulation-ownership The model scope records that the current prototype population is rigid and has no motion interface.
@evidence obligations/design/models.md#model-review-set The model scope defines the finite neutral views and common comparison used for model review.
@evidence obligations/design/models.md#model-representation-completion The model scope accounts for geometry, interfaces, limits, and observations before source realization.
@evidence spaces/temple.md#one-storey-civic-temple-graph This model-scope-scale-and-fidelity unit consumes the reviewed spatial boundary one-storey-civic-temple-graph.
@evidence spaces/temple.md#one-storey-containment-and-level This model-scope-scale-and-fidelity unit consumes the reviewed spatial boundary one-storey-containment-and-level.
@evidence spaces/temple.md#courtyard-and-continuous-colonnade-loop This model-scope-scale-and-fidelity unit consumes the reviewed spatial boundary courtyard-and-continuous-colonnade-loop.
@evidence spaces/temple.md#room-schedule-and-direct-thresholds This model-scope-scale-and-fidelity unit consumes the reviewed spatial boundary room-schedule-and-direct-thresholds.
@evidence spaces/temple.md#entrance-service-gate-and-route-graph This model-scope-scale-and-fidelity unit consumes the reviewed spatial boundary entrance-service-gate-and-route-graph.
@evidence spaces/temple.md#surface-decomposition-and-ownership-handoff This model-scope-scale-and-fidelity unit consumes the reviewed spatial boundary surface-decomposition-and-ownership-handoff.
@evidence spaces/temple.md#spatial-verification-addresses-and-finite-review-set This model-scope-scale-and-fidelity unit consumes the reviewed spatial boundary spatial-verification-addresses-and-finite-review-set.
-->

권위와 상태: `docs/settings/temple.md#production-fidelity-tier`와 review된 `docs/spaces/temple.md`를 상속한 `author-adopted` model boundary다. 범위: 이 파일의 모든 prototype과 그 neutral model review다. 공통 scale anchor는 compiled space의 Y-up metre, floor datum `Y=0.00`, room clear height `3.60m`, ordinary door clear width `1.10m`, room-side observation route `1.20m`, loop width `2.00m`이다. Prototype local origin은 별도 항목에 명시하고, dimensions는 이 anchor에 대한 blocking realization으로만 해석한다. 지붕과 벽의 envelope, surface finish, instance transform, quantity, spacing, camera, water dynamics는 각각 spaces, materials, instances, 또는 review owner에 남긴다. 모든 prototype은 rigid blocking geometry이며 motion-writable pivot이나 photoreal detail을 약속하지 않는다.

검토 범위는 neutral orthographic-like front, side, top, and three-quarter views at a common metre scale, plus a silhouette comparison beside the `1.10m` door opening and `3.60m` room height anchor다. 이 범위에서 part hierarchy, negative space, surface ownership, ground contact, and role identity를 읽을 수 있어야 한다. 표현하지 않는 것은 석재 결, 테라코타 문양, 목재 grain, 유체 입자, hidden joinery, engineering reinforcement다. 그런 요구가 들어오면 `unsupported blocking fidelity`로 드러내고 낮은 proxy로 조용히 대체하지 않는다.

검토 질문: 같은 compiled scale anchor에서 모든 prototype의 blocking identity와 제한을 비교할 수 있는가?

## Column prototype {#column-prototype}

<!--
@evidence principles/core/common.md#declared-basis The reviewed loop and settings column identity establish this prototype's base, shaft, capital, and scale basis.
@evidence principles/core/common.md#scope-preservation This unit owns the column's rigid geometry and leaves loop placement and material response to their owners.
@evidence principles/core/common.md#substantive-completion The three-part column hierarchy, extents, surfaces, and proxy limits are fully named here.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds a reusable column representation beyond the loop space that receives it.
@evidence principles/design/models.md#representation-contract This unit defines the column's solid parts, surfaces, bounds, and absent articulation.
@evidence principles/design/models.md#spatial-convention This unit fixes the base-centred origin, Y-up axis, and metre extents.
@evidence principles/design/models.md#reviewable-structure This unit identifies the views that expose base, shaft, capital, taper, and contact.
@evidence principles/design/models.md#model-observable-style-basis This unit makes the rough stone three-part silhouette observable without historical-order claims.
@evidence principles/design/models.md#model-scale-layer-completion This unit closes the column's layers, proportion anchors, surfaces, and blocking ceiling.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work This unit tests the loop running-line and clear-height constraints before placement.
@evidence spaces/temple.md#courtyard-and-continuous-colonnade-loop This unit consumes the reviewed colonnade loop and its clear width for the column placement handoff.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions This unit preserves the reviewed stone-column silhouette and route exclusion.
@evidence settings/temple.md#delivery-scope This column-prototype unit realizes the reviewed settings boundary for delivery-scope.
@evidence settings/temple.md#governing-aim This column-prototype unit realizes the reviewed settings boundary for governing-aim.
@evidence settings/temple.md#production-visual-grammar This column-prototype unit realizes the reviewed settings boundary for production-visual-grammar.
@evidence settings/temple.md#production-fidelity-tier This column-prototype unit realizes the reviewed settings boundary for production-fidelity-tier.
@evidence settings/temple.md#subject-breakdown-production-scope This column-prototype unit realizes the reviewed settings boundary for subject-breakdown-production-scope.
@evidence settings/temple.md#audience-operator-access This column-prototype unit realizes the reviewed settings boundary for audience-operator-access.
@evidence settings/temple.md#accessibility-deliverable-states This column-prototype unit realizes the reviewed settings boundary for accessibility-deliverable-states.
@evidence settings/temple.md#coordinate-unit-convention This column-prototype unit realizes the reviewed settings boundary for coordinate-unit-convention.
@evidence settings/temple.md#stage-policy This column-prototype unit realizes the reviewed settings boundary for stage-policy.
@evidence settings/temple.md#delivery-review-condition This column-prototype unit realizes the reviewed settings boundary for delivery-review-condition.
@evidence settings/temple.md#settings-coverage-map This column-prototype unit realizes the reviewed settings boundary for settings-coverage-map.
@evidence settings/temple.md#operative-subject-inventory This column-prototype unit realizes the reviewed settings boundary for operative-subject-inventory.
@evidence settings/temple.md#design-dependent-subject-conditions This column-prototype unit realizes the reviewed settings boundary for design-dependent-subject-conditions.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits This column-prototype unit realizes the reviewed settings boundary for subject-observable-identity-and-fit-out-limits.
@evidence settings/temple.md#reference-interpretation-boundary This column-prototype unit realizes the reviewed settings boundary for reference-interpretation-boundary.
@evidence spaces/temple.md#one-storey-civic-temple-graph This column-prototype unit consumes the reviewed spatial boundary one-storey-civic-temple-graph.
@evidence spaces/temple.md#one-storey-containment-and-level This column-prototype unit consumes the reviewed spatial boundary one-storey-containment-and-level.
@evidence spaces/temple.md#room-schedule-and-direct-thresholds This column-prototype unit consumes the reviewed spatial boundary room-schedule-and-direct-thresholds.
@evidence spaces/temple.md#entrance-service-gate-and-route-graph This column-prototype unit consumes the reviewed spatial boundary entrance-service-gate-and-route-graph.
@evidence spaces/temple.md#envelope-opening-and-interior-interface This column-prototype unit consumes the reviewed spatial boundary envelope-opening-and-interior-interface.
@evidence spaces/temple.md#surface-decomposition-and-ownership-handoff This column-prototype unit consumes the reviewed spatial boundary surface-decomposition-and-ownership-handoff.
@evidence spaces/temple.md#spatial-verification-addresses-and-finite-review-set This column-prototype unit consumes the reviewed spatial boundary spatial-verification-addresses-and-finite-review-set.
-->

권위와 상태: settings의 `column` identity를 실현하는 `author-adopted` fixed prototype이다. local origin은 base 중심의 floor 접점 `(0,0,0)`, Y-up, occupied extent는 X/Z `-0.20..0.20`, Y `0.00..3.20m`다. hierarchy는 `base`, `shaft`, `capital` 세 rigid part이며 circular base 지름 `0.40m`, shaft 지름 `0.32m`에서 상단 `0.30m`로 taper, capital 지름 `0.46m`, capital 높이 `0.28m`를 사용한다. base·shaft·capital은 각각 `column-stone-base`, `column-stone-shaft`, `column-stone-capital` surface owner를 갖고, 모든 부분은 connected solid이며 내부 negative space나 articulation은 없다. shaft taper는 5% 이하이고 capital은 shaft보다 1.25~1.50배 넓어 settings identity를 보존한다. instance owner만 loop의 running line 밖에 placement한다.

neutral review는 정면·측면·상면·three-quarter에서 base 접지, 세 부분 silhouette, capital-to-shaft 비례, 그리고 `3.60m` clear-height 아래의 scale을 본다. 이 proxy는 fluting, carved relief, structural load, 또는 historical order를 표현하지 않는다. 움직일 수 있는 pivot은 없으며 모든 part는 rigid transform으로 남긴다.

검토 질문: column prototype이 base·shaft·capital의 세 단계와 허용 taper를 한눈에 보이며 loop route 안으로 돌출하지 않는 배치 interface를 제공하는가?

## Door prototype {#door-prototype}

<!--
@evidence principles/core/common.md#declared-basis The reviewed opening schedule and door identity establish the frame, leaf, host, and clear-space basis.
@evidence principles/core/common.md#scope-preservation This unit owns frame and leaf geometry while the spaces source owns the semantic void and the instances source owns placement.
@evidence principles/core/common.md#substantive-completion This unit names the door parts, clear relation, surfaces, rigid state, and proxy refusal boundary.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds a reusable door representation beyond the opening topology.
@evidence principles/design/models.md#representation-contract This unit defines the frame, leaf, stable surfaces, clear void relation, and rigid hierarchy.
@evidence principles/design/models.md#spatial-convention This unit fixes threshold-centred origin, Y-up, nominal clear extents, and host-depth relation.
@evidence principles/design/models.md#reviewable-structure This unit identifies views that expose clear width, height, frame, leaf, and host fit.
@evidence principles/design/models.md#model-observable-style-basis This unit makes the light-stone frame and dark-wood leaf contrast observable without joinery claims.
@evidence principles/design/models.md#model-scale-layer-completion This unit closes the door's frame, leaf, void, surfaces, scale anchors, and rigid ceiling.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work This unit tests every reviewed room opening and route handoff before a door is placed.
@evidence spaces/temple.md#room-schedule-and-direct-thresholds This unit consumes the reviewed direct room threshold, 1.10m width, and room-facing route origin.
@evidence spaces/temple.md#envelope-opening-and-interior-interface This unit consumes the reviewed 0.40m host depth and vertical opening range.
@evidence settings/temple.md#delivery-scope This door-prototype unit realizes the reviewed settings boundary for delivery-scope.
@evidence settings/temple.md#governing-aim This door-prototype unit realizes the reviewed settings boundary for governing-aim.
@evidence settings/temple.md#production-visual-grammar This door-prototype unit realizes the reviewed settings boundary for production-visual-grammar.
@evidence settings/temple.md#production-fidelity-tier This door-prototype unit realizes the reviewed settings boundary for production-fidelity-tier.
@evidence settings/temple.md#subject-breakdown-production-scope This door-prototype unit realizes the reviewed settings boundary for subject-breakdown-production-scope.
@evidence settings/temple.md#audience-operator-access This door-prototype unit realizes the reviewed settings boundary for audience-operator-access.
@evidence settings/temple.md#accessibility-deliverable-states This door-prototype unit realizes the reviewed settings boundary for accessibility-deliverable-states.
@evidence settings/temple.md#coordinate-unit-convention This door-prototype unit realizes the reviewed settings boundary for coordinate-unit-convention.
@evidence settings/temple.md#stage-policy This door-prototype unit realizes the reviewed settings boundary for stage-policy.
@evidence settings/temple.md#delivery-review-condition This door-prototype unit realizes the reviewed settings boundary for delivery-review-condition.
@evidence settings/temple.md#settings-coverage-map This door-prototype unit realizes the reviewed settings boundary for settings-coverage-map.
@evidence settings/temple.md#operative-subject-inventory This door-prototype unit realizes the reviewed settings boundary for operative-subject-inventory.
@evidence settings/temple.md#design-dependent-subject-conditions This door-prototype unit realizes the reviewed settings boundary for design-dependent-subject-conditions.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits This door-prototype unit realizes the reviewed settings boundary for subject-observable-identity-and-fit-out-limits.
@evidence settings/temple.md#reference-interpretation-boundary This door-prototype unit realizes the reviewed settings boundary for reference-interpretation-boundary.
@evidence spaces/temple.md#one-storey-civic-temple-graph This door-prototype unit consumes the reviewed spatial boundary one-storey-civic-temple-graph.
@evidence spaces/temple.md#one-storey-containment-and-level This door-prototype unit consumes the reviewed spatial boundary one-storey-containment-and-level.
@evidence spaces/temple.md#courtyard-and-continuous-colonnade-loop This door-prototype unit consumes the reviewed spatial boundary courtyard-and-continuous-colonnade-loop.
@evidence spaces/temple.md#entrance-service-gate-and-route-graph This door-prototype unit consumes the reviewed spatial boundary entrance-service-gate-and-route-graph.
@evidence spaces/temple.md#surface-decomposition-and-ownership-handoff This door-prototype unit consumes the reviewed spatial boundary surface-decomposition-and-ownership-handoff.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions This door-prototype unit consumes the reviewed spatial boundary spatial-identity-tolerance-and-exclusions.
@evidence spaces/temple.md#spatial-verification-addresses-and-finite-review-set This door-prototype unit consumes the reviewed spatial boundary spatial-verification-addresses-and-finite-review-set.
-->

권위와 상태: review된 room opening host와 settings의 door identity를 소비하는 `author-adopted` fixed prototype이다. local origin은 threshold center의 floor 접점, Y-up, nominal clear leaf extent는 X `-0.55..0.55m`, Y `0.00..2.10m`, host depth `0.40m` 안에서의 Z depth를 사용한다. hierarchy는 `stone-jamb-left`, `stone-jamb-right`, `stone-lintel`, `wood-leaf`의 rigid parts다. 밝은 stone frame의 외곽은 clear opening보다 좌우 각각 `0.18m`, 상부 `0.22m`만 넓히고, leaf는 clear void를 가리지 않는 직사각형 판으로 둔다. frame과 leaf는 각각 stable surface owners를 가지며, semantic void와 threshold는 spaces source가 소유하고 이 prototype은 그 void를 변경하지 않는다. leaf는 closed blocking state 하나만 제공하며 motion pivot은 의도적으로 유보한다.

neutral review는 남쪽 현관 기준으로 정면·반대편·측면·three-quarter에서 `1.10m` clear width, `2.10m` clear height, frame/leaf contrast, host depth, 그리고 room-side `1.20m` route의 연속성을 본다. handle, hinge, joinery, weather seal, opening animation은 이 proxy의 범위 밖이며 요청 시 unsupported로 보고한다.

검토 질문: door prototype이 frame과 leaf를 읽히게 하면서 compiled opening의 clear void와 room-side route를 침범하지 않는가?

## Fountain basin prototype {#fountain-basin-prototype}

<!--
@evidence principles/core/common.md#declared-basis The reviewed fountain-center landmark socket establishes this basin's centred low circular representation.
@evidence principles/core/common.md#scope-preservation This unit owns basin geometry and leaves the socket, water response, and population placement to their named owners.
@evidence principles/core/common.md#substantive-completion This unit closes the circular shell, rim, water negative space, bounds, surfaces, and static proxy limit.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds a basin prototype beyond the courtyard landmark socket.
@evidence principles/design/models.md#representation-contract This unit defines connected basin parts, one negative water space, surfaces, and bounds.
@evidence principles/design/models.md#spatial-convention This unit fixes a socket-centred floor origin, Y-up axis, and radial extents.
@evidence principles/design/models.md#reviewable-structure This unit identifies top, side, and three-quarter views that expose the low rim and central opening.
@evidence principles/design/models.md#model-observable-style-basis This unit makes the low stone circular landmark observable without claiming carved restoration.
@evidence principles/design/models.md#model-scale-layer-completion This unit closes stone shell, rim, negative space, contact, surface owners, and blocking limits.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work This unit tests the reviewed centre socket and loop clearance before basin placement.
@evidence spaces/temple.md#courtyard-and-continuous-colonnade-loop This unit consumes the reviewed fountain-center socket and loop inner-edge clearance.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions This unit preserves the one-basin and one-stream landmark boundary.
@evidence settings/temple.md#delivery-scope This fountain-basin-prototype unit realizes the reviewed settings boundary for delivery-scope.
@evidence settings/temple.md#governing-aim This fountain-basin-prototype unit realizes the reviewed settings boundary for governing-aim.
@evidence settings/temple.md#production-visual-grammar This fountain-basin-prototype unit realizes the reviewed settings boundary for production-visual-grammar.
@evidence settings/temple.md#production-fidelity-tier This fountain-basin-prototype unit realizes the reviewed settings boundary for production-fidelity-tier.
@evidence settings/temple.md#subject-breakdown-production-scope This fountain-basin-prototype unit realizes the reviewed settings boundary for subject-breakdown-production-scope.
@evidence settings/temple.md#audience-operator-access This fountain-basin-prototype unit realizes the reviewed settings boundary for audience-operator-access.
@evidence settings/temple.md#accessibility-deliverable-states This fountain-basin-prototype unit realizes the reviewed settings boundary for accessibility-deliverable-states.
@evidence settings/temple.md#coordinate-unit-convention This fountain-basin-prototype unit realizes the reviewed settings boundary for coordinate-unit-convention.
@evidence settings/temple.md#stage-policy This fountain-basin-prototype unit realizes the reviewed settings boundary for stage-policy.
@evidence settings/temple.md#delivery-review-condition This fountain-basin-prototype unit realizes the reviewed settings boundary for delivery-review-condition.
@evidence settings/temple.md#settings-coverage-map This fountain-basin-prototype unit realizes the reviewed settings boundary for settings-coverage-map.
@evidence settings/temple.md#operative-subject-inventory This fountain-basin-prototype unit realizes the reviewed settings boundary for operative-subject-inventory.
@evidence settings/temple.md#design-dependent-subject-conditions This fountain-basin-prototype unit realizes the reviewed settings boundary for design-dependent-subject-conditions.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits This fountain-basin-prototype unit realizes the reviewed settings boundary for subject-observable-identity-and-fit-out-limits.
@evidence settings/temple.md#reference-interpretation-boundary This fountain-basin-prototype unit realizes the reviewed settings boundary for reference-interpretation-boundary.
@evidence spaces/temple.md#one-storey-civic-temple-graph This fountain-basin-prototype unit consumes the reviewed spatial boundary one-storey-civic-temple-graph.
@evidence spaces/temple.md#one-storey-containment-and-level This fountain-basin-prototype unit consumes the reviewed spatial boundary one-storey-containment-and-level.
@evidence spaces/temple.md#room-schedule-and-direct-thresholds This fountain-basin-prototype unit consumes the reviewed spatial boundary room-schedule-and-direct-thresholds.
@evidence spaces/temple.md#entrance-service-gate-and-route-graph This fountain-basin-prototype unit consumes the reviewed spatial boundary entrance-service-gate-and-route-graph.
@evidence spaces/temple.md#envelope-opening-and-interior-interface This fountain-basin-prototype unit consumes the reviewed spatial boundary envelope-opening-and-interior-interface.
@evidence spaces/temple.md#surface-decomposition-and-ownership-handoff This fountain-basin-prototype unit consumes the reviewed spatial boundary surface-decomposition-and-ownership-handoff.
@evidence spaces/temple.md#spatial-verification-addresses-and-finite-review-set This fountain-basin-prototype unit consumes the reviewed spatial boundary spatial-verification-addresses-and-finite-review-set.
-->

권위와 상태: review된 `fountain-center` landmark socket을 소비하는 `author-adopted` fixed prototype이다. local origin은 socket의 중심 floor datum, Y-up, occupied extent는 X/Z `-0.95..0.95m`, Y `0.00..0.32m`다. hierarchy는 `stone-base`, `circular-rim`, `water-void`이며 outer radius `0.95m`, low rim height `0.32m`, inner water opening radius `0.68m`를 사용한다. rim과 basin wall은 connected circular solid with one visible central negative water space이고, stable surfaces는 `basin-stone-outer`, `basin-stone-rim`, `basin-water-receiving`으로 나눈다. 이 prototype은 중앙 socket을 이동하거나 loop clear edge를 줄이지 않으며 stream prototype을 geometry 안에 중복 생성하지 않는다.

neutral review는 top, side, and three-quarter에서 낮은 원형 rim, 중앙 negative space, floor contact, `1.20m` 이하의 settings landmark scale을 확인한다. 실제 수면 반사, 물결, drain, stone weathering은 materials 또는 systems 범위이며 이 model은 static basin proxy다.

검토 질문: basin prototype이 하나의 낮은 원형 석조 landmark와 중앙 stream을 받을 명확한 negative space를 제공하는가?

## Fountain stream prototype {#fountain-stream-prototype}

<!--
@evidence principles/core/common.md#declared-basis The reviewed fountain-center socket and static water-accent condition establish this stream's axis and height basis.
@evidence principles/core/common.md#scope-preservation This unit owns a static stream proxy and leaves basin geometry, water material, and simulation outside the model layer.
@evidence principles/core/common.md#substantive-completion This unit closes the vertical parts, bounds, surface, contact, and explicit non-simulation limit.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds a stream representation beyond the courtyard socket.
@evidence principles/design/models.md#representation-contract This unit defines one connected vertical accent, one surface owner, bounds, and no branching.
@evidence principles/design/models.md#spatial-convention This unit fixes the basin-centred floor origin, Y-up axis, and vertical extent.
@evidence principles/design/models.md#reviewable-structure This unit identifies side and three-quarter views that expose the centreline and contact.
@evidence principles/design/models.md#model-observable-style-basis This unit makes one narrow upward water accent observable without a fluid-realism claim.
@evidence principles/design/models.md#model-scale-layer-completion This unit closes the static accent's contact, layer, surface, scale, and refusal boundary.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work This unit tests the reviewed one-stream condition and route non-interference before placement.
@evidence spaces/temple.md#courtyard-and-continuous-colonnade-loop This unit consumes the reviewed fountain-center landmark and courtyard route clearance.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions This unit preserves one centred static stream and forbids extra channels.
@evidence settings/temple.md#delivery-scope This fountain-stream-prototype unit realizes the reviewed settings boundary for delivery-scope.
@evidence settings/temple.md#governing-aim This fountain-stream-prototype unit realizes the reviewed settings boundary for governing-aim.
@evidence settings/temple.md#production-visual-grammar This fountain-stream-prototype unit realizes the reviewed settings boundary for production-visual-grammar.
@evidence settings/temple.md#production-fidelity-tier This fountain-stream-prototype unit realizes the reviewed settings boundary for production-fidelity-tier.
@evidence settings/temple.md#subject-breakdown-production-scope This fountain-stream-prototype unit realizes the reviewed settings boundary for subject-breakdown-production-scope.
@evidence settings/temple.md#audience-operator-access This fountain-stream-prototype unit realizes the reviewed settings boundary for audience-operator-access.
@evidence settings/temple.md#accessibility-deliverable-states This fountain-stream-prototype unit realizes the reviewed settings boundary for accessibility-deliverable-states.
@evidence settings/temple.md#coordinate-unit-convention This fountain-stream-prototype unit realizes the reviewed settings boundary for coordinate-unit-convention.
@evidence settings/temple.md#stage-policy This fountain-stream-prototype unit realizes the reviewed settings boundary for stage-policy.
@evidence settings/temple.md#delivery-review-condition This fountain-stream-prototype unit realizes the reviewed settings boundary for delivery-review-condition.
@evidence settings/temple.md#settings-coverage-map This fountain-stream-prototype unit realizes the reviewed settings boundary for settings-coverage-map.
@evidence settings/temple.md#operative-subject-inventory This fountain-stream-prototype unit realizes the reviewed settings boundary for operative-subject-inventory.
@evidence settings/temple.md#design-dependent-subject-conditions This fountain-stream-prototype unit realizes the reviewed settings boundary for design-dependent-subject-conditions.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits This fountain-stream-prototype unit realizes the reviewed settings boundary for subject-observable-identity-and-fit-out-limits.
@evidence settings/temple.md#reference-interpretation-boundary This fountain-stream-prototype unit realizes the reviewed settings boundary for reference-interpretation-boundary.
@evidence spaces/temple.md#one-storey-civic-temple-graph This fountain-stream-prototype unit consumes the reviewed spatial boundary one-storey-civic-temple-graph.
@evidence spaces/temple.md#one-storey-containment-and-level This fountain-stream-prototype unit consumes the reviewed spatial boundary one-storey-containment-and-level.
@evidence spaces/temple.md#room-schedule-and-direct-thresholds This fountain-stream-prototype unit consumes the reviewed spatial boundary room-schedule-and-direct-thresholds.
@evidence spaces/temple.md#entrance-service-gate-and-route-graph This fountain-stream-prototype unit consumes the reviewed spatial boundary entrance-service-gate-and-route-graph.
@evidence spaces/temple.md#envelope-opening-and-interior-interface This fountain-stream-prototype unit consumes the reviewed spatial boundary envelope-opening-and-interior-interface.
@evidence spaces/temple.md#surface-decomposition-and-ownership-handoff This fountain-stream-prototype unit consumes the reviewed spatial boundary surface-decomposition-and-ownership-handoff.
@evidence spaces/temple.md#spatial-verification-addresses-and-finite-review-set This fountain-stream-prototype unit consumes the reviewed spatial boundary spatial-verification-addresses-and-finite-review-set.
-->

권위와 상태: settings의 one-static-stream 조건과 `fountain-center` socket을 소비하는 `author-adopted` static accent prototype이다. local origin은 basin water opening 중심의 floor datum, Y-up, occupied extent는 X/Z `-0.05..0.05m`, Y `0.25..1.20m`다. hierarchy는 `base-contact`, `vertical-column`, `top-break`의 connected rigid parts이며 nominal radius `0.05m`다. 하나의 vertical centerline만 사용하고 branching, lateral arc, spray volume, hidden pump, particle state를 만들지 않는다. stable surface owner는 `stream-water` 하나이며 basin mesh나 route surface를 소유하지 않는다. motion interface는 없고 height와 centerline은 prototype identity로 고정한다.

neutral review는 side와 three-quarter에서 basin 중심에 선 정적 수직 accent, 낮은 landmark와의 비례, route 비침범을 확인한다. 유체 시뮬레이션과 physical splash는 outside-scope이며 이 proxy의 존재만 읽힌다.

검토 질문: stream prototype이 basin 중심의 한 줄기 정적 수직 accent로만 읽히며 추가 water channel이나 순환을 암시하지 않는가?

## Altar and plinth prototype {#altar-and-plinth-prototype}

<!--
@evidence principles/core/common.md#declared-basis The reviewed sanctuary identity establishes this altar pair's rear-axis blocking role and scale basis.
@evidence principles/core/common.md#scope-preservation This unit owns the two-part altar geometry while the instances source owns sanctuary placement and the materials source owns finish.
@evidence principles/core/common.md#substantive-completion This unit closes plinth, body, bounds, surfaces, contact, and unsupported ritual-detail limits.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds a reusable altar pair beyond the sanctuary space boundary.
@evidence principles/design/models.md#representation-contract This unit defines two connected rigid parts, their proportion, surfaces, and closed top boundary.
@evidence principles/design/models.md#spatial-convention This unit fixes a plinth-centred floor origin, Y-up axis, and occupied extents.
@evidence principles/design/models.md#reviewable-structure This unit identifies views that expose plinth-to-body width, depth, stack, and contact.
@evidence principles/design/models.md#model-observable-style-basis This unit makes the broad stone plinth and smaller body an observable sanctuary landmark.
@evidence principles/design/models.md#model-scale-layer-completion This unit closes both occupied layers, stable surfaces, scale relation, and blocking ceiling.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work This unit tests sanctuary clear height and rear-axis fit before placement.
@evidence spaces/temple.md#room-schedule-and-direct-thresholds This unit consumes the reviewed sanctuary room and its north-rear axis relation.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions This unit preserves the one-altar and one-plinth landmark boundary.
@evidence settings/temple.md#delivery-scope This altar-and-plinth-prototype unit realizes the reviewed settings boundary for delivery-scope.
@evidence settings/temple.md#governing-aim This altar-and-plinth-prototype unit realizes the reviewed settings boundary for governing-aim.
@evidence settings/temple.md#production-visual-grammar This altar-and-plinth-prototype unit realizes the reviewed settings boundary for production-visual-grammar.
@evidence settings/temple.md#production-fidelity-tier This altar-and-plinth-prototype unit realizes the reviewed settings boundary for production-fidelity-tier.
@evidence settings/temple.md#subject-breakdown-production-scope This altar-and-plinth-prototype unit realizes the reviewed settings boundary for subject-breakdown-production-scope.
@evidence settings/temple.md#audience-operator-access This altar-and-plinth-prototype unit realizes the reviewed settings boundary for audience-operator-access.
@evidence settings/temple.md#accessibility-deliverable-states This altar-and-plinth-prototype unit realizes the reviewed settings boundary for accessibility-deliverable-states.
@evidence settings/temple.md#coordinate-unit-convention This altar-and-plinth-prototype unit realizes the reviewed settings boundary for coordinate-unit-convention.
@evidence settings/temple.md#stage-policy This altar-and-plinth-prototype unit realizes the reviewed settings boundary for stage-policy.
@evidence settings/temple.md#delivery-review-condition This altar-and-plinth-prototype unit realizes the reviewed settings boundary for delivery-review-condition.
@evidence settings/temple.md#settings-coverage-map This altar-and-plinth-prototype unit realizes the reviewed settings boundary for settings-coverage-map.
@evidence settings/temple.md#operative-subject-inventory This altar-and-plinth-prototype unit realizes the reviewed settings boundary for operative-subject-inventory.
@evidence settings/temple.md#design-dependent-subject-conditions This altar-and-plinth-prototype unit realizes the reviewed settings boundary for design-dependent-subject-conditions.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits This altar-and-plinth-prototype unit realizes the reviewed settings boundary for subject-observable-identity-and-fit-out-limits.
@evidence settings/temple.md#reference-interpretation-boundary This altar-and-plinth-prototype unit realizes the reviewed settings boundary for reference-interpretation-boundary.
@evidence spaces/temple.md#one-storey-civic-temple-graph This altar-and-plinth-prototype unit consumes the reviewed spatial boundary one-storey-civic-temple-graph.
@evidence spaces/temple.md#one-storey-containment-and-level This altar-and-plinth-prototype unit consumes the reviewed spatial boundary one-storey-containment-and-level.
@evidence spaces/temple.md#courtyard-and-continuous-colonnade-loop This altar-and-plinth-prototype unit consumes the reviewed spatial boundary courtyard-and-continuous-colonnade-loop.
@evidence spaces/temple.md#entrance-service-gate-and-route-graph This altar-and-plinth-prototype unit consumes the reviewed spatial boundary entrance-service-gate-and-route-graph.
@evidence spaces/temple.md#envelope-opening-and-interior-interface This altar-and-plinth-prototype unit consumes the reviewed spatial boundary envelope-opening-and-interior-interface.
@evidence spaces/temple.md#surface-decomposition-and-ownership-handoff This altar-and-plinth-prototype unit consumes the reviewed spatial boundary surface-decomposition-and-ownership-handoff.
@evidence spaces/temple.md#spatial-verification-addresses-and-finite-review-set This altar-and-plinth-prototype unit consumes the reviewed spatial boundary spatial-verification-addresses-and-finite-review-set.
-->

권위와 상태: settings의 rear-axis altar identity를 소비하는 `author-adopted` fixed pair다. local origin은 plinth 중심의 floor 접점, Y-up, combined occupied extent X `-0.65..0.65m`, Z `-0.40..0.40m`, Y `0.00..0.82m`다. hierarchy는 `plinth`와 `altar-body` 두 rigid parts다. plinth는 `1.30m × 0.80m × 0.32m`, altar body는 `0.90m × 0.48m × 0.50m`로 body보다 넓고 깊으며, 두 part는 `altar-plinth-stone`과 `altar-body-stone` surface owners로 분리된다. top은 closed horizontal plane이고 body와 plinth 사이에는 hidden void가 없다. axis and placement belong to instances consuming the sanctuary socket; this model does not choose the sanctuary position.

neutral review는 rear-axis three-quarter, front, side, and top에서 plinth가 body보다 명확히 넓고 깊은지, floor contact와 rigid stack을 확인한다. carving, offering contents, flame, and ritual claims are unsupported by this blocking prototype.

검토 질문: altar pair가 plinth와 body의 두 단계와 rear-axis landmark scale을 placement 없이도 분명히 제시하는가?

## Roof tile prototype {#roof-tile-prototype}

<!--
@evidence principles/core/common.md#declared-basis The reviewed low terracotta roof identity establishes this tile's repeated envelope role and slope scale.
@evidence principles/core/common.md#scope-preservation This unit owns one tile's geometry while the spaces source owns roof boundaries, instances own rows, and materials own terracotta response.
@evidence principles/core/common.md#substantive-completion This unit closes the tile parts, overlap interface, surfaces, bounds, and omitted roof-population responsibility.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds a reusable envelope tile beyond the roof space host.
@evidence principles/design/models.md#representation-contract This unit defines body, overlap lip, underside seat, stable surfaces, and closed tile topology.
@evidence principles/design/models.md#spatial-convention This unit fixes eave-corner origin, row and slope axes, Y-up, and occupied extents.
@evidence principles/design/models.md#reviewable-structure This unit identifies top, slope-side, eave, and three-quarter views that expose overlap and termination.
@evidence principles/design/models.md#model-observable-style-basis This unit makes the red terracotta shallow repeated unit observable without ornament claims.
@evidence principles/design/models.md#model-scale-layer-completion This unit closes top, edge, underside, contact, overlap, scale, and proxy limits.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work This unit tests the reviewed low roof profile and envelope handoff before row placement.
@evidence spaces/temple.md#envelope-opening-and-interior-interface This unit consumes the reviewed roof underside and building envelope boundary.
@evidence spaces/temple.md#surface-decomposition-and-ownership-handoff This unit consumes the roof-facing host boundary without assigning its finish.
@evidence settings/temple.md#delivery-scope This roof-tile-prototype unit realizes the reviewed settings boundary for delivery-scope.
@evidence settings/temple.md#governing-aim This roof-tile-prototype unit realizes the reviewed settings boundary for governing-aim.
@evidence settings/temple.md#production-visual-grammar This roof-tile-prototype unit realizes the reviewed settings boundary for production-visual-grammar.
@evidence settings/temple.md#production-fidelity-tier This roof-tile-prototype unit realizes the reviewed settings boundary for production-fidelity-tier.
@evidence settings/temple.md#subject-breakdown-production-scope This roof-tile-prototype unit realizes the reviewed settings boundary for subject-breakdown-production-scope.
@evidence settings/temple.md#audience-operator-access This roof-tile-prototype unit realizes the reviewed settings boundary for audience-operator-access.
@evidence settings/temple.md#accessibility-deliverable-states This roof-tile-prototype unit realizes the reviewed settings boundary for accessibility-deliverable-states.
@evidence settings/temple.md#coordinate-unit-convention This roof-tile-prototype unit realizes the reviewed settings boundary for coordinate-unit-convention.
@evidence settings/temple.md#stage-policy This roof-tile-prototype unit realizes the reviewed settings boundary for stage-policy.
@evidence settings/temple.md#delivery-review-condition This roof-tile-prototype unit realizes the reviewed settings boundary for delivery-review-condition.
@evidence settings/temple.md#settings-coverage-map This roof-tile-prototype unit realizes the reviewed settings boundary for settings-coverage-map.
@evidence settings/temple.md#operative-subject-inventory This roof-tile-prototype unit realizes the reviewed settings boundary for operative-subject-inventory.
@evidence settings/temple.md#design-dependent-subject-conditions This roof-tile-prototype unit realizes the reviewed settings boundary for design-dependent-subject-conditions.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits This roof-tile-prototype unit realizes the reviewed settings boundary for subject-observable-identity-and-fit-out-limits.
@evidence settings/temple.md#reference-interpretation-boundary This roof-tile-prototype unit realizes the reviewed settings boundary for reference-interpretation-boundary.
@evidence spaces/temple.md#one-storey-civic-temple-graph This roof-tile-prototype unit consumes the reviewed spatial boundary one-storey-civic-temple-graph.
@evidence spaces/temple.md#one-storey-containment-and-level This roof-tile-prototype unit consumes the reviewed spatial boundary one-storey-containment-and-level.
@evidence spaces/temple.md#courtyard-and-continuous-colonnade-loop This roof-tile-prototype unit consumes the reviewed spatial boundary courtyard-and-continuous-colonnade-loop.
@evidence spaces/temple.md#room-schedule-and-direct-thresholds This roof-tile-prototype unit consumes the reviewed spatial boundary room-schedule-and-direct-thresholds.
@evidence spaces/temple.md#entrance-service-gate-and-route-graph This roof-tile-prototype unit consumes the reviewed spatial boundary entrance-service-gate-and-route-graph.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions This roof-tile-prototype unit consumes the reviewed spatial boundary spatial-identity-tolerance-and-exclusions.
@evidence spaces/temple.md#spatial-verification-addresses-and-finite-review-set This roof-tile-prototype unit consumes the reviewed spatial boundary spatial-verification-addresses-and-finite-review-set.
-->

권위와 상태: settings의 low terracotta roof identity를 소비하는 `author-adopted` repeated-envelope prototype이다. local origin은 tile의 lower eave contact corner, Y-up, row-axis X, slope-axis Z, occupied extent X `0.00..0.72m`, Z `0.00..0.44m`, Y `0.00..0.10m`다. hierarchy는 `tile-body`, `overlap-lip`, `underside-seat`의 rigid parts다. tile-body는 shallow tapered terracotta slab, overlap-lip은 다음 tile을 향한 visible overlap edge, underside-seat은 preceding row 위에 놓이는 closed contact surface다. stable surfaces는 `roof-tile-top`, `roof-tile-edge`, `roof-tile-underside`이며 tile 하나는 hole이나 transparent plane이 아니다. overlap relation과 low profile을 유지하는 dimension은 instance row rule이 읽어야 하고, this prototype does not create a roof, ridge, eave, or edge population.

neutral review는 top, slope-side, eave, and three-quarter에서 red terracotta row의 overlap direction, thin profile, edge termination interface를 확인한다. glazed ornament, individually broken tiles, thermal assembly, and hidden rafters remain outside the model proxy.

검토 질문: roof-tile prototype이 반복 시 겹침 방향과 낮은 지붕 profile을 유지할 수 있는 stable top, edge, underside를 제공하는가?

## Records furniture prototypes {#records-furniture-prototypes}

<!--
@evidence principles/core/common.md#declared-basis The reviewed records-room fit-out identity establishes four functional furniture silhouettes and their door-relative scale.
@evidence principles/core/common.md#scope-preservation This unit owns records furniture geometry and leaves count, placement, route clearance, and finish to their named owners.
@evidence principles/core/common.md#substantive-completion This unit closes table, shelf, chest, and lamp hierarchies, bounds, surfaces, and proxy limits.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds reusable furniture representations beyond the records room topology.
@evidence principles/design/models.md#representation-contract This unit defines four rigid families, their parts, surfaces, contacts, and distinct functional silhouettes.
@evidence principles/design/models.md#spatial-convention This unit fixes floor-centred origins, Y-up, and common door/room scale anchors.
@evidence principles/design/models.md#reviewable-structure This unit identifies common-scale views that expose each furniture role and its boundary.
@evidence principles/design/models.md#model-observable-style-basis This unit makes work, storage, chest, and lamp roles observable without decorative realism.
@evidence principles/design/models.md#model-scale-layer-completion This unit closes all four occupied layers, stable surfaces, contacts, scale, and rigid ceiling.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work This unit tests records-room height and route capacity before repeated placement.
@evidence spaces/temple.md#room-schedule-and-direct-thresholds This unit consumes the reviewed records-room clear box, threshold, and room-side route.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions This unit preserves the records-room fit-out role and route protection.
@evidence settings/temple.md#delivery-scope This records-furniture-prototypes unit realizes the reviewed settings boundary for delivery-scope.
@evidence settings/temple.md#governing-aim This records-furniture-prototypes unit realizes the reviewed settings boundary for governing-aim.
@evidence settings/temple.md#production-visual-grammar This records-furniture-prototypes unit realizes the reviewed settings boundary for production-visual-grammar.
@evidence settings/temple.md#production-fidelity-tier This records-furniture-prototypes unit realizes the reviewed settings boundary for production-fidelity-tier.
@evidence settings/temple.md#subject-breakdown-production-scope This records-furniture-prototypes unit realizes the reviewed settings boundary for subject-breakdown-production-scope.
@evidence settings/temple.md#audience-operator-access This records-furniture-prototypes unit realizes the reviewed settings boundary for audience-operator-access.
@evidence settings/temple.md#accessibility-deliverable-states This records-furniture-prototypes unit realizes the reviewed settings boundary for accessibility-deliverable-states.
@evidence settings/temple.md#coordinate-unit-convention This records-furniture-prototypes unit realizes the reviewed settings boundary for coordinate-unit-convention.
@evidence settings/temple.md#stage-policy This records-furniture-prototypes unit realizes the reviewed settings boundary for stage-policy.
@evidence settings/temple.md#delivery-review-condition This records-furniture-prototypes unit realizes the reviewed settings boundary for delivery-review-condition.
@evidence settings/temple.md#settings-coverage-map This records-furniture-prototypes unit realizes the reviewed settings boundary for settings-coverage-map.
@evidence settings/temple.md#operative-subject-inventory This records-furniture-prototypes unit realizes the reviewed settings boundary for operative-subject-inventory.
@evidence settings/temple.md#design-dependent-subject-conditions This records-furniture-prototypes unit realizes the reviewed settings boundary for design-dependent-subject-conditions.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits This records-furniture-prototypes unit realizes the reviewed settings boundary for subject-observable-identity-and-fit-out-limits.
@evidence settings/temple.md#reference-interpretation-boundary This records-furniture-prototypes unit realizes the reviewed settings boundary for reference-interpretation-boundary.
@evidence spaces/temple.md#one-storey-civic-temple-graph This records-furniture-prototypes unit consumes the reviewed spatial boundary one-storey-civic-temple-graph.
@evidence spaces/temple.md#one-storey-containment-and-level This records-furniture-prototypes unit consumes the reviewed spatial boundary one-storey-containment-and-level.
@evidence spaces/temple.md#courtyard-and-continuous-colonnade-loop This records-furniture-prototypes unit consumes the reviewed spatial boundary courtyard-and-continuous-colonnade-loop.
@evidence spaces/temple.md#entrance-service-gate-and-route-graph This records-furniture-prototypes unit consumes the reviewed spatial boundary entrance-service-gate-and-route-graph.
@evidence spaces/temple.md#envelope-opening-and-interior-interface This records-furniture-prototypes unit consumes the reviewed spatial boundary envelope-opening-and-interior-interface.
@evidence spaces/temple.md#surface-decomposition-and-ownership-handoff This records-furniture-prototypes unit consumes the reviewed spatial boundary surface-decomposition-and-ownership-handoff.
@evidence spaces/temple.md#spatial-verification-addresses-and-finite-review-set This records-furniture-prototypes unit consumes the reviewed spatial boundary spatial-verification-addresses-and-finite-review-set.
-->

권위와 상태: records-room의 settings fit-out identity를 위한 `author-adopted` rigid prototype family다. 각 member local origin은 floor contact center, Y-up이며 공통 scale anchor는 `1.10m` door와 `3.60m` room height다. `records-table`은 `1.20 × 0.60 × 0.76m` top-and-four-leg hierarchy, `records-shelf`는 `0.90 × 0.32 × 1.80m` frame-and-three-shelf hierarchy, `records-chest`는 `0.80 × 0.45 × 0.55m` box-lid hierarchy, `records-lamp`는 `0.18 × 0.18 × 0.42m` base-stem-shade hierarchy를 갖는다. 각 family member는 `records-table-wood`, `records-shelf-wood`, `records-chest-wood`, `records-lamp-metal` stable surface owner를 가지며 closed solids and explicit floor contacts를 사용한다. drawer articulation, light emission, contents, and material response는 이 layer에서 만들지 않는다; each silhouette remains distinct for instance placement.

neutral review는 one common scale board에서 four members의 front, side, top, and three-quarter silhouettes, floor contact, and usable clearance를 비교한다. table surface는 work landmark, shelf는 vertical storage, chest는 low closed volume, lamp는 small vertical accent로 읽혀야 하며 records population count와 placement는 instances owner다.

검토 질문: records furniture family가 네 기능을 서로 다른 bounded silhouette과 surface boundary로 제공하면서 room route를 대신 소유하지 않는가?

## Storage furniture prototypes {#storage-furniture-prototypes}

<!--
@evidence principles/core/common.md#declared-basis The reviewed votive-storage-room fit-out identity establishes shelf, chest, and basket roles at a shared scale.
@evidence principles/core/common.md#scope-preservation This unit owns storage furniture geometry and leaves quantity, stacking, placement, density, and finish to their named owners.
@evidence principles/core/common.md#substantive-completion This unit closes the three family hierarchies, open boundaries, bounds, surfaces, and proxy limits.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds reusable storage representations beyond the room topology.
@evidence principles/design/models.md#representation-contract This unit defines shelf gaps, chest body, basket rim, stable surfaces, contacts, and bounds.
@evidence principles/design/models.md#spatial-convention This unit fixes floor-centred origins, Y-up, and the common room/door scale.
@evidence principles/design/models.md#reviewable-structure This unit identifies views exposing vertical shelf rhythm, low chest mass, and basket opening.
@evidence principles/design/models.md#model-observable-style-basis This unit makes the three storage roles observable without loaded contents or woven-detail claims.
@evidence principles/design/models.md#model-scale-layer-completion This unit closes the storage layers, negative openings, stable surfaces, scale, and blocking ceiling.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work This unit tests the storage room clear height and protected route before placement.
@evidence spaces/temple.md#room-schedule-and-direct-thresholds This unit consumes the reviewed storage room clear box, threshold, and route.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions This unit preserves the storage fit-out and density boundary.
@evidence settings/temple.md#delivery-scope This storage-furniture-prototypes unit realizes the reviewed settings boundary for delivery-scope.
@evidence settings/temple.md#governing-aim This storage-furniture-prototypes unit realizes the reviewed settings boundary for governing-aim.
@evidence settings/temple.md#production-visual-grammar This storage-furniture-prototypes unit realizes the reviewed settings boundary for production-visual-grammar.
@evidence settings/temple.md#production-fidelity-tier This storage-furniture-prototypes unit realizes the reviewed settings boundary for production-fidelity-tier.
@evidence settings/temple.md#subject-breakdown-production-scope This storage-furniture-prototypes unit realizes the reviewed settings boundary for subject-breakdown-production-scope.
@evidence settings/temple.md#audience-operator-access This storage-furniture-prototypes unit realizes the reviewed settings boundary for audience-operator-access.
@evidence settings/temple.md#accessibility-deliverable-states This storage-furniture-prototypes unit realizes the reviewed settings boundary for accessibility-deliverable-states.
@evidence settings/temple.md#coordinate-unit-convention This storage-furniture-prototypes unit realizes the reviewed settings boundary for coordinate-unit-convention.
@evidence settings/temple.md#stage-policy This storage-furniture-prototypes unit realizes the reviewed settings boundary for stage-policy.
@evidence settings/temple.md#delivery-review-condition This storage-furniture-prototypes unit realizes the reviewed settings boundary for delivery-review-condition.
@evidence settings/temple.md#settings-coverage-map This storage-furniture-prototypes unit realizes the reviewed settings boundary for settings-coverage-map.
@evidence settings/temple.md#operative-subject-inventory This storage-furniture-prototypes unit realizes the reviewed settings boundary for operative-subject-inventory.
@evidence settings/temple.md#design-dependent-subject-conditions This storage-furniture-prototypes unit realizes the reviewed settings boundary for design-dependent-subject-conditions.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits This storage-furniture-prototypes unit realizes the reviewed settings boundary for subject-observable-identity-and-fit-out-limits.
@evidence settings/temple.md#reference-interpretation-boundary This storage-furniture-prototypes unit realizes the reviewed settings boundary for reference-interpretation-boundary.
@evidence spaces/temple.md#one-storey-civic-temple-graph This storage-furniture-prototypes unit consumes the reviewed spatial boundary one-storey-civic-temple-graph.
@evidence spaces/temple.md#one-storey-containment-and-level This storage-furniture-prototypes unit consumes the reviewed spatial boundary one-storey-containment-and-level.
@evidence spaces/temple.md#courtyard-and-continuous-colonnade-loop This storage-furniture-prototypes unit consumes the reviewed spatial boundary courtyard-and-continuous-colonnade-loop.
@evidence spaces/temple.md#entrance-service-gate-and-route-graph This storage-furniture-prototypes unit consumes the reviewed spatial boundary entrance-service-gate-and-route-graph.
@evidence spaces/temple.md#envelope-opening-and-interior-interface This storage-furniture-prototypes unit consumes the reviewed spatial boundary envelope-opening-and-interior-interface.
@evidence spaces/temple.md#surface-decomposition-and-ownership-handoff This storage-furniture-prototypes unit consumes the reviewed spatial boundary surface-decomposition-and-ownership-handoff.
@evidence spaces/temple.md#spatial-verification-addresses-and-finite-review-set This storage-furniture-prototypes unit consumes the reviewed spatial boundary spatial-verification-addresses-and-finite-review-set.
-->

권위와 상태: votive-storage-room의 settings fit-out identity를 위한 `author-adopted` rigid prototype family다. local origin은 floor contact center, Y-up이다. `storage-shelf`는 `0.90 × 0.34 × 1.70m`의 side-frame-and-four-shelf hierarchy, `storage-chest`는 `0.78 × 0.46 × 0.55m`의 closed body and lid, `storage-basket`은 `0.42 × 0.42 × 0.48m`의 tapered open-rim body and handle hierarchy를 사용한다. stable surface owners는 각각 `storage-shelf-wood`, `storage-chest-wood`, `storage-basket-fiber`다. shelf는 open horizontal gaps를 유지하고 basket만 one top opening을 가지며, silhouette-changing variation, stacking, and placement remain with instances. No member extends beyond the compiled room clear height or invents a storage alcove.

neutral review는 front, side, top, and three-quarter에서 shelf의 vertical rhythm, chest의 low mass, basket의 open rim, and their common door-relative scale를 비교한다. 실제 contents, woven texture, loading state, and density are not modeled here.

검토 질문: storage family가 shelf·chest·basket을 기능별로 구분하면서 open rim과 shelf gaps를 보존하는가?

## Votive display prototype {#votive-display-prototype}

<!--
@evidence principles/core/common.md#declared-basis The reviewed communal-votive-room identity establishes this low display's public offering role and scale.
@evidence principles/core/common.md#scope-preservation This unit owns display geometry and leaves vessel membership, placement, material response, and count to their owners.
@evidence principles/core/common.md#substantive-completion This unit closes plinth, board, ledge, recess, bounds, surfaces, and omitted iconography.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds a reusable display representation beyond the communal room topology.
@evidence principles/design/models.md#representation-contract This unit defines three rigid parts, one visible recess, stable surfaces, and occupied bounds.
@evidence principles/design/models.md#spatial-convention This unit fixes floor-centred origin, Y-up, and display extents.
@evidence principles/design/models.md#reviewable-structure This unit identifies views exposing the low plinth, upright board, ledge, recess, and contact.
@evidence principles/design/models.md#model-observable-style-basis This unit makes a civic offering display observable without inventing precious contents or iconography.
@evidence principles/design/models.md#model-scale-layer-completion This unit closes the display layers, negative recess, surfaces, scale, and proxy ceiling.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work This unit tests the communal room route and display clearance before placement.
@evidence spaces/temple.md#room-schedule-and-direct-thresholds This unit consumes the reviewed communal-votive room and its room-side route.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions This unit preserves the display role and protected route boundary.
@evidence settings/temple.md#delivery-scope This votive-display-prototype unit realizes the reviewed settings boundary for delivery-scope.
@evidence settings/temple.md#governing-aim This votive-display-prototype unit realizes the reviewed settings boundary for governing-aim.
@evidence settings/temple.md#production-visual-grammar This votive-display-prototype unit realizes the reviewed settings boundary for production-visual-grammar.
@evidence settings/temple.md#production-fidelity-tier This votive-display-prototype unit realizes the reviewed settings boundary for production-fidelity-tier.
@evidence settings/temple.md#subject-breakdown-production-scope This votive-display-prototype unit realizes the reviewed settings boundary for subject-breakdown-production-scope.
@evidence settings/temple.md#audience-operator-access This votive-display-prototype unit realizes the reviewed settings boundary for audience-operator-access.
@evidence settings/temple.md#accessibility-deliverable-states This votive-display-prototype unit realizes the reviewed settings boundary for accessibility-deliverable-states.
@evidence settings/temple.md#coordinate-unit-convention This votive-display-prototype unit realizes the reviewed settings boundary for coordinate-unit-convention.
@evidence settings/temple.md#stage-policy This votive-display-prototype unit realizes the reviewed settings boundary for stage-policy.
@evidence settings/temple.md#delivery-review-condition This votive-display-prototype unit realizes the reviewed settings boundary for delivery-review-condition.
@evidence settings/temple.md#settings-coverage-map This votive-display-prototype unit realizes the reviewed settings boundary for settings-coverage-map.
@evidence settings/temple.md#operative-subject-inventory This votive-display-prototype unit realizes the reviewed settings boundary for operative-subject-inventory.
@evidence settings/temple.md#design-dependent-subject-conditions This votive-display-prototype unit realizes the reviewed settings boundary for design-dependent-subject-conditions.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits This votive-display-prototype unit realizes the reviewed settings boundary for subject-observable-identity-and-fit-out-limits.
@evidence settings/temple.md#reference-interpretation-boundary This votive-display-prototype unit realizes the reviewed settings boundary for reference-interpretation-boundary.
@evidence spaces/temple.md#one-storey-civic-temple-graph This votive-display-prototype unit consumes the reviewed spatial boundary one-storey-civic-temple-graph.
@evidence spaces/temple.md#one-storey-containment-and-level This votive-display-prototype unit consumes the reviewed spatial boundary one-storey-containment-and-level.
@evidence spaces/temple.md#courtyard-and-continuous-colonnade-loop This votive-display-prototype unit consumes the reviewed spatial boundary courtyard-and-continuous-colonnade-loop.
@evidence spaces/temple.md#entrance-service-gate-and-route-graph This votive-display-prototype unit consumes the reviewed spatial boundary entrance-service-gate-and-route-graph.
@evidence spaces/temple.md#envelope-opening-and-interior-interface This votive-display-prototype unit consumes the reviewed spatial boundary envelope-opening-and-interior-interface.
@evidence spaces/temple.md#surface-decomposition-and-ownership-handoff This votive-display-prototype unit consumes the reviewed spatial boundary surface-decomposition-and-ownership-handoff.
@evidence spaces/temple.md#spatial-verification-addresses-and-finite-review-set This votive-display-prototype unit consumes the reviewed spatial boundary spatial-verification-addresses-and-finite-review-set.
-->

권위와 상태: communal-votive-room의 settings identity를 소비하는 `author-adopted` display prototype이다. local origin은 floor contact center, Y-up, occupied extent X `-0.55..0.55m`, Z `-0.24..0.24m`, Y `0.00..1.20m`다. hierarchy는 `display-plinth`, `back-board`, `ledge`의 rigid parts이며 display-plinth는 `1.10 × 0.48 × 0.22m`, back-board는 `0.95 × 0.08 × 0.78m`, ledge는 `0.88 × 0.24 × 0.12m`다. stable surfaces는 `votive-display-stone`, `votive-display-wood`, `votive-display-ledge`; ledge와 board 사이의 shallow visible recess는 intended negative space다. It is one display unit, not a room partition or route marker, and vessels are separate prototypes.

neutral review는 front, side, and three-quarter에서 low plinth, upright back-board, ledge and recess가 하나의 civic offering display로 읽히는지 확인한다. carved iconography, precious contents, and population count remain outside this prototype.

검토 질문: votive display prototype이 낮은 받침·세운 판·선반의 관계와 별도 vessel 수용 공간을 읽히게 하는가?

## Ceramic and basket prototypes {#ceramic-and-basket-prototypes}

<!--
@evidence principles/core/common.md#declared-basis The reviewed display and storage fit-out identities establish the two small-prop roles and common scale.
@evidence principles/core/common.md#scope-preservation This unit owns ceramic and basket geometry while instances own counts and placement and materials own tone.
@evidence principles/core/common.md#substantive-completion This unit closes both hierarchies, open rims, bounds, surfaces, contacts, and omitted contents.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds small reusable props beyond the rooms that receive them.
@evidence principles/design/models.md#representation-contract This unit defines two distinct rigid families, their negative openings, surfaces, and bounds.
@evidence principles/design/models.md#spatial-convention This unit fixes contact-centred origins, Y-up, and explicit scale extents.
@evidence principles/design/models.md#reviewable-structure This unit identifies a common scale board and three-quarter view that distinguish the roles.
@evidence principles/design/models.md#model-observable-style-basis This unit makes vessel and basket functions observable without texture or content claims.
@evidence principles/design/models.md#model-scale-layer-completion This unit closes the two prop layers, open boundaries, stable surfaces, scale, and blocking ceiling.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work This unit tests the room route and shelf/display contact scale before population.
@evidence spaces/temple.md#room-schedule-and-direct-thresholds This unit consumes the reviewed communal and storage room clear boxes and routes.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions This unit preserves the named prop silhouettes and density boundary.
@evidence settings/temple.md#delivery-scope This ceramic-and-basket-prototypes unit realizes the reviewed settings boundary for delivery-scope.
@evidence settings/temple.md#governing-aim This ceramic-and-basket-prototypes unit realizes the reviewed settings boundary for governing-aim.
@evidence settings/temple.md#production-visual-grammar This ceramic-and-basket-prototypes unit realizes the reviewed settings boundary for production-visual-grammar.
@evidence settings/temple.md#production-fidelity-tier This ceramic-and-basket-prototypes unit realizes the reviewed settings boundary for production-fidelity-tier.
@evidence settings/temple.md#subject-breakdown-production-scope This ceramic-and-basket-prototypes unit realizes the reviewed settings boundary for subject-breakdown-production-scope.
@evidence settings/temple.md#audience-operator-access This ceramic-and-basket-prototypes unit realizes the reviewed settings boundary for audience-operator-access.
@evidence settings/temple.md#accessibility-deliverable-states This ceramic-and-basket-prototypes unit realizes the reviewed settings boundary for accessibility-deliverable-states.
@evidence settings/temple.md#coordinate-unit-convention This ceramic-and-basket-prototypes unit realizes the reviewed settings boundary for coordinate-unit-convention.
@evidence settings/temple.md#stage-policy This ceramic-and-basket-prototypes unit realizes the reviewed settings boundary for stage-policy.
@evidence settings/temple.md#delivery-review-condition This ceramic-and-basket-prototypes unit realizes the reviewed settings boundary for delivery-review-condition.
@evidence settings/temple.md#settings-coverage-map This ceramic-and-basket-prototypes unit realizes the reviewed settings boundary for settings-coverage-map.
@evidence settings/temple.md#operative-subject-inventory This ceramic-and-basket-prototypes unit realizes the reviewed settings boundary for operative-subject-inventory.
@evidence settings/temple.md#design-dependent-subject-conditions This ceramic-and-basket-prototypes unit realizes the reviewed settings boundary for design-dependent-subject-conditions.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits This ceramic-and-basket-prototypes unit realizes the reviewed settings boundary for subject-observable-identity-and-fit-out-limits.
@evidence settings/temple.md#reference-interpretation-boundary This ceramic-and-basket-prototypes unit realizes the reviewed settings boundary for reference-interpretation-boundary.
@evidence spaces/temple.md#one-storey-civic-temple-graph This ceramic-and-basket-prototypes unit consumes the reviewed spatial boundary one-storey-civic-temple-graph.
@evidence spaces/temple.md#one-storey-containment-and-level This ceramic-and-basket-prototypes unit consumes the reviewed spatial boundary one-storey-containment-and-level.
@evidence spaces/temple.md#courtyard-and-continuous-colonnade-loop This ceramic-and-basket-prototypes unit consumes the reviewed spatial boundary courtyard-and-continuous-colonnade-loop.
@evidence spaces/temple.md#entrance-service-gate-and-route-graph This ceramic-and-basket-prototypes unit consumes the reviewed spatial boundary entrance-service-gate-and-route-graph.
@evidence spaces/temple.md#envelope-opening-and-interior-interface This ceramic-and-basket-prototypes unit consumes the reviewed spatial boundary envelope-opening-and-interior-interface.
@evidence spaces/temple.md#surface-decomposition-and-ownership-handoff This ceramic-and-basket-prototypes unit consumes the reviewed spatial boundary surface-decomposition-and-ownership-handoff.
@evidence spaces/temple.md#spatial-verification-addresses-and-finite-review-set This ceramic-and-basket-prototypes unit consumes the reviewed spatial boundary spatial-verification-addresses-and-finite-review-set.
-->

권위와 상태: communal display와 storage fit-out에 소비되는 `author-adopted` small-prop family다. local origin은 floor or shelf contact center, Y-up이다. `ceramic-vessel`은 radius `0.16m`, height `0.34m`의 foot-body-neck-rim hierarchy와 one open top를 갖고, `storage-basket`은 radius `0.21m`, height `0.48m`의 tapered body-rim-handle hierarchy와 one open top를 갖는다. occupied bounds는 각각 X/Z `±0.16m`, Y `0.00..0.34m`와 X/Z `±0.21m`, Y `0.00..0.48m`이며 stable surfaces는 `ceramic-body`, `ceramic-rim`, `basket-fiber`, `basket-rim`이다. Both are upright rigid proxies; contents, wetness, weaving strands, and deformations are not represented. Placement, count, and tone variation remain with instances/materials.

neutral review는 common door-relative scale board and three-quarter view에서 vessel의 foot-body-neck-rim과 basket의 tapered open-rim silhouette를 구분한다. A generic cylinder or closed block is a failure because it erases the role-defining negative space.

검토 질문: ceramic과 basket prototype이 작은 scale에서도 서로 다른 open-rim silhouette과 기능을 보이는가?

## Lamp prototype {#lamp-prototype}

<!--
@evidence principles/core/common.md#declared-basis The reviewed lamp identity establishes this small vertical accent's scale and restrained geometry.
@evidence principles/core/common.md#scope-preservation This unit owns lamp geometry and leaves light response, count, and placement to materials, systems, and instances.
@evidence principles/core/common.md#substantive-completion This unit closes base, stem, shade, underside, bounds, surfaces, and non-emissive proxy limits.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds a reusable lamp representation beyond the room topology.
@evidence principles/design/models.md#representation-contract This unit defines three rigid parts, one open underside, stable surfaces, and contact.
@evidence principles/design/models.md#spatial-convention This unit fixes mounting/floor origin, Y-up, and occupied extents.
@evidence principles/design/models.md#reviewable-structure This unit identifies side and three-quarter views exposing the small vertical silhouette.
@evidence principles/design/models.md#model-observable-style-basis This unit makes the lamp role observable without claiming flame, smoke, or emitted light.
@evidence principles/design/models.md#model-scale-layer-completion This unit closes the lamp layers, opening, surfaces, scale, and rigid blocking ceiling.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work This unit tests basket and door-relative scale and the protected route before placement.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions This unit consumes the reviewed lamp role and route exclusion.
@evidence spaces/temple.md#room-schedule-and-direct-thresholds This unit consumes the room-side route and clear-box boundary that lamp instances must respect.
@evidence settings/temple.md#delivery-scope This lamp-prototype unit realizes the reviewed settings boundary for delivery-scope.
@evidence settings/temple.md#governing-aim This lamp-prototype unit realizes the reviewed settings boundary for governing-aim.
@evidence settings/temple.md#production-visual-grammar This lamp-prototype unit realizes the reviewed settings boundary for production-visual-grammar.
@evidence settings/temple.md#production-fidelity-tier This lamp-prototype unit realizes the reviewed settings boundary for production-fidelity-tier.
@evidence settings/temple.md#subject-breakdown-production-scope This lamp-prototype unit realizes the reviewed settings boundary for subject-breakdown-production-scope.
@evidence settings/temple.md#audience-operator-access This lamp-prototype unit realizes the reviewed settings boundary for audience-operator-access.
@evidence settings/temple.md#accessibility-deliverable-states This lamp-prototype unit realizes the reviewed settings boundary for accessibility-deliverable-states.
@evidence settings/temple.md#coordinate-unit-convention This lamp-prototype unit realizes the reviewed settings boundary for coordinate-unit-convention.
@evidence settings/temple.md#stage-policy This lamp-prototype unit realizes the reviewed settings boundary for stage-policy.
@evidence settings/temple.md#delivery-review-condition This lamp-prototype unit realizes the reviewed settings boundary for delivery-review-condition.
@evidence settings/temple.md#settings-coverage-map This lamp-prototype unit realizes the reviewed settings boundary for settings-coverage-map.
@evidence settings/temple.md#operative-subject-inventory This lamp-prototype unit realizes the reviewed settings boundary for operative-subject-inventory.
@evidence settings/temple.md#design-dependent-subject-conditions This lamp-prototype unit realizes the reviewed settings boundary for design-dependent-subject-conditions.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits This lamp-prototype unit realizes the reviewed settings boundary for subject-observable-identity-and-fit-out-limits.
@evidence settings/temple.md#reference-interpretation-boundary This lamp-prototype unit realizes the reviewed settings boundary for reference-interpretation-boundary.
@evidence spaces/temple.md#one-storey-civic-temple-graph This lamp-prototype unit consumes the reviewed spatial boundary one-storey-civic-temple-graph.
@evidence spaces/temple.md#one-storey-containment-and-level This lamp-prototype unit consumes the reviewed spatial boundary one-storey-containment-and-level.
@evidence spaces/temple.md#courtyard-and-continuous-colonnade-loop This lamp-prototype unit consumes the reviewed spatial boundary courtyard-and-continuous-colonnade-loop.
@evidence spaces/temple.md#entrance-service-gate-and-route-graph This lamp-prototype unit consumes the reviewed spatial boundary entrance-service-gate-and-route-graph.
@evidence spaces/temple.md#envelope-opening-and-interior-interface This lamp-prototype unit consumes the reviewed spatial boundary envelope-opening-and-interior-interface.
@evidence spaces/temple.md#surface-decomposition-and-ownership-handoff This lamp-prototype unit consumes the reviewed spatial boundary surface-decomposition-and-ownership-handoff.
@evidence spaces/temple.md#spatial-verification-addresses-and-finite-review-set This lamp-prototype unit consumes the reviewed spatial boundary spatial-verification-addresses-and-finite-review-set.
-->

권위와 상태: settings의 restrained lamp population을 위한 `author-adopted` rigid prototype이다. local origin은 mounting or floor contact datum, Y-up, occupied extent X/Z `±0.10m`, Y `0.00..0.42m`다. hierarchy는 `base`, `stem`, `shallow-shade`의 rigid parts다. base 지름 `0.20m`, stem height `0.22m`, shade 지름 `0.18m`, total height `0.42m`이며 stable surfaces는 `lamp-base`, `lamp-stem`, `lamp-shade`다. shade has a shallow open underside as a visible negative boundary, but no fire, emissive response, smoke, or hanging articulation is modeled. The lamp remains a small vertical accent that cannot redefine a room or loop.

neutral review는 side and three-quarter에서 low base, slender stem, shallow shade, and scale against the `0.42m` basket and `1.10m` door anchor를 비교한다. Light intensity and color are material/system decisions; this model supplies only geometry.

검토 질문: lamp prototype이 작은 vertical accent로 읽히며 shade의 open underside와 rigid floor/mount interface를 보존하는가?

## Bench prototype {#bench-prototype}

<!--
@evidence principles/core/common.md#declared-basis The reviewed colonnaded-loop bench identity establishes this low civic seat's scale and role.
@evidence principles/core/common.md#scope-preservation This unit owns bench geometry and leaves count, orientation, placement, route clearance, and finish to their owners.
@evidence principles/core/common.md#substantive-completion This unit closes seat, legs, rail, negative space, bounds, surfaces, contact, and proxy limits.
@evidence principles/core/inherited-units.md#derived-parent-differentiation This unit adds a reusable bench representation beyond the colonnade space.
@evidence principles/design/models.md#representation-contract This unit defines three rigid parts, open underside, stable surfaces, and occupied bounds.
@evidence principles/design/models.md#spatial-convention This unit fixes floor-centred origin, Y-up, seat height, and extents.
@evidence principles/design/models.md#reviewable-structure This unit identifies views exposing low seat, supports, rail, contact, and route side.
@evidence principles/design/models.md#model-observable-style-basis This unit makes a plain low civic bench observable without cushion or occupancy claims.
@evidence principles/design/models.md#model-scale-layer-completion This unit closes bench layers, negative underside, stable surfaces, scale, and rigid ceiling.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work This unit tests the reviewed 2.00m loop and running route before placement.
@evidence spaces/temple.md#courtyard-and-continuous-colonnade-loop This unit consumes the reviewed colonnaded-loop width and continuous circulation boundary.
@evidence spaces/temple.md#spatial-identity-tolerance-and-exclusions This unit preserves the bench role and protected loop route.
@evidence settings/temple.md#delivery-scope This bench-prototype unit realizes the reviewed settings boundary for delivery-scope.
@evidence settings/temple.md#governing-aim This bench-prototype unit realizes the reviewed settings boundary for governing-aim.
@evidence settings/temple.md#production-visual-grammar This bench-prototype unit realizes the reviewed settings boundary for production-visual-grammar.
@evidence settings/temple.md#production-fidelity-tier This bench-prototype unit realizes the reviewed settings boundary for production-fidelity-tier.
@evidence settings/temple.md#subject-breakdown-production-scope This bench-prototype unit realizes the reviewed settings boundary for subject-breakdown-production-scope.
@evidence settings/temple.md#audience-operator-access This bench-prototype unit realizes the reviewed settings boundary for audience-operator-access.
@evidence settings/temple.md#accessibility-deliverable-states This bench-prototype unit realizes the reviewed settings boundary for accessibility-deliverable-states.
@evidence settings/temple.md#coordinate-unit-convention This bench-prototype unit realizes the reviewed settings boundary for coordinate-unit-convention.
@evidence settings/temple.md#stage-policy This bench-prototype unit realizes the reviewed settings boundary for stage-policy.
@evidence settings/temple.md#delivery-review-condition This bench-prototype unit realizes the reviewed settings boundary for delivery-review-condition.
@evidence settings/temple.md#settings-coverage-map This bench-prototype unit realizes the reviewed settings boundary for settings-coverage-map.
@evidence settings/temple.md#operative-subject-inventory This bench-prototype unit realizes the reviewed settings boundary for operative-subject-inventory.
@evidence settings/temple.md#design-dependent-subject-conditions This bench-prototype unit realizes the reviewed settings boundary for design-dependent-subject-conditions.
@evidence settings/temple.md#subject-observable-identity-and-fit-out-limits This bench-prototype unit realizes the reviewed settings boundary for subject-observable-identity-and-fit-out-limits.
@evidence settings/temple.md#reference-interpretation-boundary This bench-prototype unit realizes the reviewed settings boundary for reference-interpretation-boundary.
@evidence spaces/temple.md#one-storey-civic-temple-graph This bench-prototype unit consumes the reviewed spatial boundary one-storey-civic-temple-graph.
@evidence spaces/temple.md#one-storey-containment-and-level This bench-prototype unit consumes the reviewed spatial boundary one-storey-containment-and-level.
@evidence spaces/temple.md#room-schedule-and-direct-thresholds This bench-prototype unit consumes the reviewed spatial boundary room-schedule-and-direct-thresholds.
@evidence spaces/temple.md#entrance-service-gate-and-route-graph This bench-prototype unit consumes the reviewed spatial boundary entrance-service-gate-and-route-graph.
@evidence spaces/temple.md#envelope-opening-and-interior-interface This bench-prototype unit consumes the reviewed spatial boundary envelope-opening-and-interior-interface.
@evidence spaces/temple.md#surface-decomposition-and-ownership-handoff This bench-prototype unit consumes the reviewed spatial boundary surface-decomposition-and-ownership-handoff.
@evidence spaces/temple.md#spatial-verification-addresses-and-finite-review-set This bench-prototype unit consumes the reviewed spatial boundary spatial-verification-addresses-and-finite-review-set.
-->

권위와 상태: colonnaded-loop의 settings bench identity를 위한 `author-adopted` rigid prototype이다. local origin은 floor contact center, Y-up, occupied extent X `-0.70..0.70m`, Z `-0.24..0.24m`, Y `0.00..0.48m`다. hierarchy는 `seat`, `legs`, `back-rail`의 rigid parts이며 seat `1.40 × 0.48 × 0.12m`, seat top `Y=0.42m`, back-rail top `Y=0.48m`를 사용한다. stable surfaces are `bench-seat`, `bench-legs`, `bench-back-rail`; underside is open between legs and remains a visible negative space. Instance placement must keep the compiled `2.00m` loop route and its `1.20m` clear handoff free; this prototype does not own route width or bench count.

neutral review는 front, side, top, and three-quarter에서 low horizontal seat, four support points, shallow back-rail, floor contact, and route clearance를 확인한다. Cushions, occupancy, wood grain, and weathering remain outside the model proxy.

검토 질문: bench prototype이 낮은 수평 civic seat으로 읽히면서 legs 사이 negative space와 loop clear route를 보존하는가?

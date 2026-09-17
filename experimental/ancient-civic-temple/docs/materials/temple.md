# Ancient civic temple material designs

This document owns construction, finish, texture scale, optical response, and material state for the reviewed civic temple library. It does not create or resize a wall, opening, floor, model part, population, or route. A model or space remains the owner of the stable surface to which one of these material decisions binds.

The authority for the visual vocabulary is the reviewed settings grammar, while the exact host names come from the reviewed spaces surface schedule and model stable-surface declarations. All colours and renderer coefficients below are author-adopted blocking values, not measured historical facts or pixel-derived values. No image is used as a texture or dimension source.

## Material scope and identity {#material-scope-and-identity}

Authority and status: the reviewed settings visual grammar, model stable-surface names, and spaces surface schedule are the parent decisions; the material family boundaries and numeric response values below are `author-adopted` design decisions. Scope: the complete material population for the current model and space hosts, including the neutral material review set. A material family may bind to several stable surfaces only when construction, response, and state are the same; it never renames or splits the host surface.

The population is eleven independently replaceable decisions: wall plaster, structural stone, floor stone, service-yard earth, dark timber, terracotta roof, water, ceramic, basket fiber, lamp metal, and the neutral material review condition. The lower wall band is a region state of the wall-plaster assembly rather than a second owner of the same complete wall surface. Route-reservation elements are review overlays and have no finish material. HDRI, photographic projection, procedural particles, displacement, and hidden engineering are outside this material scope.

Every renderer material uses linear `baseColor` values, `metallic` and `roughness` in `[0, 1]`, `opacity=1`, `alphaMode=opaque`, `emissive=null`, and no texture unless a later source explicitly supplies a reviewed asset. The canonical material key is the stable surface identifier where a model source already exposes one; semantic space hosts use the family key in this document. This distinction keeps binding identity readable without pretending that the current library contribution has a standalone material carrier.

The material branch inherits the reviewed Y-up metre convention. Surface scale is expressed in metres: any future texture binding must state its coordinate source and repeat scale, and a missing texture asset is `unverified` rather than silently replaced by an image or a new geometry layer.

Review question: can a later material source assign every exposed host to one of these families, preserve the host's stable identifier, and report an unsupported texture or region without changing space or model ownership?

## Wall plaster finish {#wall-plaster-finish}

Authority and status: the reviewed warm ochre lime-plaster grammar and dark reddish lower-band observation are `user-fixed` visual requirements as interpreted by an `author-adopted` material assembly. Scope: exposed exterior wall faces, interior room and loop wall faces, room ceilings where the host is plaster, and opening reveals that remain plaster after the stone host is excluded.

The construction is a mineral lime-plaster finish over the existing wall host; it has no new thickness, jamb, or boundary. The single material family is `material/wall-plaster-ochre`. Its renderer record is linear base colour `(0.42, 0.24, 0.10)`, metallic `0`, roughness `0.88`, opaque, non-emissive, and texture-free. The upper field is the warm ochre field. A deterministic lower-band state uses the same host and a dark reddish response `(0.25, 0.07, 0.04)` only where the host exposes the reviewed lower wall region; it is not a second surface owner and cannot change the wall's boundary.

Bindings are `elevation-south`, `elevation-north`, `elevation-west`, `elevation-east`, `exterior-wall-inner-faces`, `loop-facing-boundaries`, `east-room-separator-faces`, the five room boundary/ceiling host sets, and the plaster portions of named opening reveals. The spaces schedule does not expose a separate exterior-plinth host, so this material does not invent one or split an elevation to create it; any exterior plinth reading remains `unverified` until an existing host owner exposes that region. Stone jambs, lintels, and model-owned stone parts are excluded. No plaster binding may cover a door leaf, a complete stone frame, a roof tile, or the courtyard water surface.

The finish is matte and hand-made rather than smooth plastic. Deterministic variation is limited to tone ±`0.03` per linear channel and roughness ±`0.04`, clamped to `[0,1]`, under the material source seed; it may not create cracks, photographic wear, or a new colour zone. If a host has no region address for the lower band, the source must report that band observation as `unverified` instead of splitting the closed space surface or baking an unreviewed texture.

Review question: in an outward elevation and an interior room view, does the wall read as one plaster host with a restrained lower reddish band where its region is addressable, while every stone opening host remains visibly separate?

## Structural light-stone finish {#structural-light-stone-finish}

Authority and status: the reviewed rough light-stone plinth, column, frame, basin, altar, display, and edge grammar is `user-fixed` in vocabulary and `author-adopted` in response. Scope: every model stable surface whose name identifies stone construction, plus the courtyard edge faces and exterior stone plinth host where the spaces schedule assigns them.

The material family is `material/light-stone-rough`, with linear base colour `(0.47, 0.40, 0.30)`, metallic `0`, roughness `0.84`, opaque, non-emissive, and no texture. It is a visible blocking finish over the model part, not a claim about structural thickness. It keeps the same response on connected surfaces of one prototype so a column, basin, altar, or door frame does not change substance at an arbitrary seam.

The model bindings are `column-stone-base`, `column-stone-shaft`, `column-stone-capital`, `door-frame-left-stone`, `door-frame-right-stone`, `door-frame-lintel-stone`, `basin-stone-exterior`, `basin-stone-rim`, `altar-plinth-stone`, `altar-body-stone`, `display-plinth-stone`, `display-board-stone`, and `display-ledge-stone`. The space bindings are the four `courtyard-edge` faces and any named stone opening reveal. The exterior elevation remains assigned to wall plaster because no separate stone-plinth surface is owned by spaces. `door-leaf-wood`, water, ceramic, and plaster are not members of this family.

The permitted deterministic variation is tone ±`0.025` per linear channel and roughness ±`0.04`; it must preserve the light-stone read and never add a normal map, bevel, crack, or displacement that changes the model silhouette. The negative boundary of the votive display remains an empty field; stone surrounds it but does not fill it.

Review question: do the exposed stone parts read as one rough light material family while each stable stone surface remains individually bindable and each display recess remains visibly open?

## Floor-stone finish {#floor-stone-finish}

Authority and status: the reviewed civic stone paving and separate walkable floor hosts are `author-adopted` material decisions derived from the settings surface grammar and spaces floor schedule. Scope: the entry apron, courtyard floor, loop floor, and five room floors. This material owns response, not polygon boundaries or the courtyard hole.

The family is `material/floor-stone`, with linear base colour `(0.57, 0.48, 0.33)`, metallic `0`, roughness `0.90`, opaque, non-emissive, and no texture. Its texture policy is intentionally empty: a later source may add a reviewed, metre-scaled tile asset, but no texture is inferred from a reference image. If no such asset exists, the flat response is the complete blocking representation.

Bindings are `surface/entry-threshold-floor`, `surface/courtyard-floor`, `surface/loop-floor`, `surface/sanctuary-floor`, `surface/communal-votive-floor`, `surface/administration-floor`, `surface/records-floor`, and `surface/votive-storage-floor`. The courtyard floor remains open to the basin socket and has no material geometry over the basin or stream. `surface/service-yard-floor` is assigned to the earth family below, not silently treated as interior paving.

The finish is continuous at the room threshold and does not narrow the 1.20m protected route. Tone variation is ±`0.035` per linear channel and roughness variation is ±`0.03`, deterministic and face-stable. A tile or seam pattern that cannot state its metre repeat is refused as `unverified`; a viewer route line is not a floor finish.

Review question: from the neutral exterior, courtyard, and room views, do all eight civic floor hosts read as one restrained matte stone field, with no material crossing the courtyard hole or reserved route?

## Service-yard earth finish {#service-yard-earth-finish}

Authority and status: the rear-east service yard's practical unpaved distinction is an `author-adopted` interpretation of the settings service boundary and reference 5's service question. Scope: only `surface/service-yard-floor` and its `service-yard-boundary` ground-facing host.

The family is `material/service-yard-earth`, with linear base colour `(0.25, 0.16, 0.09)`, metallic `0`, roughness `0.94`, opaque, non-emissive, and no texture. It is a flat blocking earth response and does not add gravel geometry, vegetation, puddles, or a second service circulation path. The service gate remains a terminal access owned by spaces.

No earth material binds to a room, loop, courtyard, roof, or model part. Deterministic tone variation is limited to ±`0.025` per linear channel and roughness ±`0.03`; it may not become a photographic ground texture. If the service yard is exposed in a review view, the contrast with the floor-stone family must remain legible without changing the building graph.

Review question: does the rear-east terminal yard read as a rough earth service surface while its gate, boundary, and non-loop status remain space-owned and unchanged?

## Dark-timber finish {#dark-timber-finish}

Authority and status: the reviewed dark timber doors, rafters, shelves, chests, and civic furniture are `user-fixed` in vocabulary and `author-adopted` in numeric response. Scope: all stable model surfaces that are named as wood or timber and the space roof-underside/ceiling-underside hosts assigned to exposed timber.

The family is `material/dark-timber`, with linear base colour `(0.28, 0.12, 0.04)`, metallic `0`, roughness `0.78`, opaque, non-emissive, and no texture. The surface is matte dark wood, not a literal image of grain. The model bindings are `door-leaf-wood`, `records-shelf-frame-wood`, `records-shelf-board-wood`, `storage-shelf-frame-wood`, `storage-shelf-board-wood`, `records-table-top`, `records-table-legs`, `records-chest-body`, `records-chest-lid`, `storage-chest-body`, `storage-chest-lid`, `bench-seat`, `bench-legs`, and `bench-back-rail`. The space bindings are `roof-underside`, `loop-ceiling-underside`, and room ceiling hosts only where the host is the reviewed exposed timber underside; plaster ceiling hosts remain plaster.

Surface identity is preserved: `records-table-top` is not renamed to `records-table-wood`, and a chest body is not merged with its lid. Tone variation is ±`0.03` per linear channel and roughness ±`0.04`, deterministic per stable surface. No material state may add a hinge, grain relief, cushion, or beam geometry, because those belong to model or space owners.

Review question: do the door leaves and fit-out pieces read as one restrained dark-timber family, with top/leg, body/lid, and seat/rail bindings still distinguishable for later inspection?

## Terracotta roof finish {#terracotta-roof-finish}

Authority and status: the low red terracotta roof grammar is `user-fixed` in appearance and `author-adopted` in response. Scope: the reusable roof-tile surfaces and the roof-cover host; the roof silhouette, overlap count, ridge, and eave geometry remain owned by models, spaces, and instances.

The family is `material/red-terracotta`, with linear base colour `(0.34, 0.12, 0.05)`, metallic `0`, roughness `0.88`, opaque, non-emissive, and no texture. Model bindings are exactly `roof-tile-top`, `roof-tile-edge`, and `roof-tile-underside`; the space binding is `roof-cover`. The roof underside is assigned to dark timber only where its host is a timber underside; a tile underside does not become timber merely because it faces down.

The tile's existing metre scale is the only repeat basis: no image repetition is introduced without an explicit surface-metres coordinate source and a repeat value. Tone variation is ±`0.03` per channel and roughness ±`0.04`, deterministic per tile population member but not enough to erase the continuous low-profile roof read. Material assignment never changes the reviewed roof hole over the courtyard.

Review question: in the exterior and courtyard views, does the roof read as a low, matte red terracotta cover with its top, edge, and underside surfaces bound by name, without a texture or material rule changing the roof silhouette?

## Water surface state {#water-surface-state}

Authority and status: the reviewed matte blue-gray water and one static stream are `user-fixed` visual requirements; their material response is `author-adopted`. Scope: only `basin-water-seat` and `stream-water`, with no fluid simulation or spill state.

The family is `material/matte-blue-gray-water`, with linear base colour `(0.08, 0.28, 0.31)`, metallic `0`, roughness `0.30`, opacity `1`, alpha mode `opaque`, emissive `null`, double-sided true, and no texture. It binds exactly to model surfaces `basin-water-seat` and `stream-water`. The water-seat remains a plane inside the open basin; this material does not fill the basin wall or create a second strand.

The only allowed state is `static-surface`: no particles, animated flow, foam, reflection capture, or emissive glow. Tone variation is ±`0.02` per channel and roughness ±`0.03`, deterministic and bounded. A source that cannot render a water surface keeps the material record but reports the water appearance as `unverified`; it does not replace water with transparent air or a moving effect.

Review question: in the courtyard view, is one low basin and one narrow matte blue-gray strand readable, with no extra water geometry or simulation state?

## Ceramic votive finish {#ceramic-votive-finish}

Authority and status: the small ceramic vessel and votive-prop vocabulary from the settings and reference questions is `author-adopted` blocking identity, not a historical reconstruction. Scope: `ceramic-foot`, `ceramic-body`, and `ceramic-rim` on the ceramic vessel prototype; the four-layer hierarchy remains model-owned.

The family is `material/ochre-ceramic`, with linear base colour `(0.42, 0.16, 0.07)`, metallic `0`, roughness `0.82`, opaque, non-emissive, and no texture. `ceramic-body` is bound to both the body and independent neck parts because they share the reviewed ceramic response; the `ceramic-foot` and `ceramic-rim` IDs remain separate for addressability. No material binding may absorb the neck part or fill the vessel opening.

The finish is matte fired clay with deterministic tone variation ±`0.025` and roughness ±`0.04`. There is no glaze highlight, liquid contents, inscription, or breakage state. A texture asset is not required for the blocking identity; if one is later introduced it must state surface-metres or normalized coordinates and remain subordinate to the flat base response.

Review question: in the communal-votive and records/service views, does the vessel retain a small open-rim ceramic silhouette with foot, body, neck, and rim still separately inspectable?

## Basket fiber finish {#basket-fiber-finish}

Authority and status: the open tapered storage basket is `author-adopted` from the settings fit-out identity and reference 5. Scope: `storage-basket-fiber`, `storage-basket-rim`, and `storage-basket-handle` on the one basket prototype.

The body family is `material/basket-fiber`, with linear base colour `(0.28, 0.17, 0.08)`, metallic `0`, roughness `0.92`, opaque, non-emissive, and no texture. `storage-basket-fiber` binds the base and tapered body; `storage-basket-rim` and `storage-basket-handle` use the same response but remain stable separate bindings. The cavity stays empty and the rim remains at its reviewed interval.

Deterministic tone variation is ±`0.03` per channel and roughness ±`0.03`; woven strands, contents, and a photographic weave map are outside the blocking ceiling. No basket material may bind to shelf boards, ceramic vessels, or the protected storage route. A later texture must carry a declared metre repeat; absent that declaration the flat material is the complete result.

Review question: from the storage-room view, does the basket read as one rough open tapered fiber object with an empty cavity, named rim, and handle rather than a solid or a wood box?

## Lamp metal finish {#lamp-metal-finish}

Authority and status: the restrained metal accent on the reviewed rigid lamp is `author-adopted`; the settings explicitly refuse flame and smoke simulation. Scope: `lamp-base`, `lamp-stem`, and `lamp-shade` only.

The family is `material/lamp-metal`, with linear base colour `(0.18, 0.20, 0.18)`, metallic `0.65`, roughness `0.50`, opaque, non-emissive, and no texture. The three names remain separate bindings although they share one response. This material does not choose the lamp's floor-contact origin, mounting offset, count, or placement.

Tone variation is ±`0.02` per channel and roughness ±`0.03`, deterministic per source instance. The source must not add emissive flame, smoke, a light source, or hanging articulation under this material decision; those are outside the current system and fidelity scope. An unseen underside is not assigned a second material merely to create a highlight.

Review question: beside the reviewed door and basket scale anchors, does the lamp read as one small three-part dark metal object without pretending to illuminate or animate?

## Neutral material review condition {#neutral-material-review-condition}

Authority and status: the reviewed settings delivery condition and the material obligations define this `author-adopted` inspection contract. Scope: material readability and binding checks only; it does not replace the compiled-topology observation denominator or certify the currently unverified model-board runtime.

The neutral board uses the fixed viewer conditions from settings: sRGB `1600×900`, 16:9, devicePixelRatio `1`, vertical FOV `50°`, background `#D8D4CC`, no auto exposure, depth of field, bloom, or other post effect. The light rig is the fixed world directional light, fill directional light, and weak ambient declared by the eventual source; no HDRI or reference image is permitted. The material source must expose a deterministic swatch/sample for wall plaster with lower-band state, structural stone, floor stone, timber, terracotta, water, ceramic, fiber, and metal.

The review set has four sample classes: a flat face for base colour and roughness, a two-face junction for binding ownership, a repeated roof/floor sample for scale and seam absence, and the open basin/display/vessel/basket samples for negative-space and state errors. Each sample records the stable host IDs it tests. The source and compiled material records, not the viewer labels, answer counts, IDs, bindings, and numeric values; the viewer answers only whether the material reads as its named construction at the neutral review distance.

The current model-board API remains `unverified` because the workspace engine source entry fails Node ESM directory-import resolution in the coordinator harness. That limitation is recorded rather than replaced with a direct built-library import or a viewer path that skips model source. Until the harness is repaired externally, any runtime colour or seam observation is `unverified`; source-level material identity and parameter checks remain reportable.

Review question: can a reviewer reproduce each material sample, identify the host surface and material family, see a falsifying seam/scale/binding/state condition, and distinguish an unverified renderer observation from a source-level fact?

## Material handoff and refusal boundary {#material-handoff-and-refusal-boundary}

Authority and status: this is an `author-adopted` handoff record that applies the shared material binding and capability boundaries to this production. Scope: the transition from reviewed model and space surfaces to the later material-source and instance owners.

Materials consume, but never redefine, these space hosts: the four exterior elevations, exterior wall inner faces, roof cover and underside, courtyard floor and edges, entry threshold floor, loop floor/ceiling/facing boundaries, five room floors and room boundary/ceiling hosts, east separator faces, service-yard floor/boundary, and named opening reveals. Materials consume, but never rename, every model stable surface listed in the material family sections. Instances later decide which repeated member receives a material-ready model; materials do not decide count or placement.

The material source must refuse an unknown host ID, an unbounded numeric coefficient, an undeclared texture coordinate source, a texture asset outside the production boundary, a material assigned to a route overlay, and any request that changes host geometry. It must preserve the exact material key and stable surface name, return deterministic records for equal inputs, and leave unsupported texture, region, water, or physical claims `unverified`.

This handoff is complete for the materials design draft. It deliberately does not advance `materialSources`, create a renderer workaround, or open the instances branch. Those are later source and population owners after an independent materials gate.

Review question: does every material assignment have one host owner and one material owner, with a named refusal for each unsupported or unmeasured substitution?

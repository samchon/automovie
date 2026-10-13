# Common obligations of the model design population

## File roles and model delivery {#file-roles}

<!--
@evidence obligations/core/common.md#purpose-fit Nine model files were compared as building members, permanent furniture, handheld supplies and site objects. Without portable, bench/cart/fabric/writing-tool prototypes disappear; without fixtures/wares, altar/shelf prototypes and the pottery they support disappear. Separate production contracts own shared scale, articulation and review criteria.
-->

This population designs blocking prototypes of independent members consumed by one single-storey civic temple and its site. [Model principles](../../contracts/principles-models.md) require shared scale/UV0 from each of the 49 prototype H2s. [Model obligations](../../contracts/obligations-models.md) own articulation roles and the neutral review board. Prototype files each own their geometry and joints.

[columns](../../models/columns.md) owns round stone columns for the colonnade and porch; [entablature](../../models/entablature.md) owns their beams, porch gable trim, rafters, sanctuary trusses and low ceiling joists. Their separation exposes column height, beam top, rafter depth and roof underside as one arithmetic chain; retaining only one would leave the roof floating above columns or the colonnade ceiling showing only a slab underside. [openings](../../models/openings.md) owns frames, leaves and window frames filling the reviewed voids of eight doors and eight light openings, and contains the only articulated models.

[cladding](../../models/cladding.md) owns repeated roof/ridge tile units over composed roof pieces; [fixtures](../../models/fixtures.md) owns equipment and furniture identifying room use, including fountain, altar, niche, lampstand, tables, shelves, desks, stools and chests; [wares](../../models/wares.md) owns jars, bowls, baskets and scrolls placed on or inside them. Merging fixtures and wares would hide their furniture/vessel dimensional relationship inside one file; separating them gives supporting decisions such as compartment shelf and scroll their own addresses. [landscape](../../models/landscape.md) owns trees, grass and neighbor shells placed in site zones, supplying actual object prototypes for the zones left by the spaces site.

[portable](../../models/portable.md) owns reusable prototypes of benches, small lamps, two-jar racks, carrying yokes, handcarts, buckets, planters, votive plaques, trays, fabric, styli, writing tablets and rope coils. [ritual](../../models/ritual.md) owns the separate silhouettes of low censers, floor cushions and single-jar stands. instances determines copies per room. Records and storage chests use the [same base prototype](../../models/fixtures.md#chest).

## Boundary between models and other production branches {#layer-routing}

<!--
@evidence obligations/core/common.md#layer-boundary Each of the 49 model H2s answers geometry, occupancy and local scale/UV principles, while a separate obligation account owns population conclusions for articulation roles and the neutral review board. materials owns material response; instances owns room copies/contact; systems owns water flow/light; spaces owns the envelope/ground.
-->

The 49 prototype-defining H2s each determine their prototype's geometry, part and surface IDs, hidden contact faces and voids, occupied extents and placement datum. The [scale/UV0 principle](../../contracts/principles-models.md#temple-reference-scale) is a prototype-level checklist, so each H2 answers its own occupancy and projection. [Articulation/review-board obligations](../../contracts/obligations-models.md) account for role allocation and observation plans across the population. Member count, spacing, first position or phase within a prototype belongs to its model H2; instances derives actual building copies and clipping at spatial boundaries from reviewed spaces and composed roofs. instances also determines in-room placement and actual contact with other objects. [Material binding](../../materials/10-model-bindings.md#binding-map) owns binding, texture repeat lengths and fallback colors; materials also owns bitmap selection and final color/roughness response.

Fountain flow/light reflection and lamp state changes are later systems/motions decisions; models emit static geometry only. External wall plinths/coping, threshold floors, site ground and distant ridges are already spaces-owned solids and are not reintroduced into the model population. Each H2 respects this boundary by keeping door frames from recreating threshold floors, neighbor shells from recreating paving zones and window frames from relocating wall voids.

Reviewers and authors judge position, size, section, subdivision and joints in each model H2. When implementation exposes an absent choice, repair that H2 first.

## Working language and identifier notation {#working-language}

<!--
@evidence obligations/core/common.md#production-language Model decisions and failure conditions use technical English; part/surface/interface identifiers such as plinth, tegula and hinge.<leaf ID>, anchors and API terminology retain their exact notation. Specialist terms such as plumb cut are explained at first use.
-->

Following the settings [working language](../../settings/00-delivery.md#working-language), model documents use standard modern English. Dimensions, heights and failure conditions use numeric metre values in English sentences. Part/surface names (`plinth`, `shaft`, `tegula`, `imbrex`, `lining`, `surround`), articulation interfaces (`hinge.<leaf ID>`), state names (`closed`, `open`), door IDs (such as `door-entry`) and anchors retain their exact source identifiers.

Branch names (materials, instances, systems) and contract terms such as prototype, negative space and blocking geometry are used with their meaning clear from context. At first use, specialist terms are explained, such as the vertical end face of a rafter, or plumb cut. Ancient-language names and inscriptions are not used.

## Comparison of scale and development amount {#proportion}

<!--
@evidence obligations/core/common.md#proportionate-development Nine prototype files and 49 H2s allocate detail by object role and reuse. Tiles, double leaves and basin retain detailed sections, while styli and plaques define thin members; portable's 13 H2s serve reuse across rooms. Three common-rule H2s remain in separate contracts rather than inflating the prototype population.
-->

The model population separates door frames, double leaves, single leaves and window frames; colonnade and porch round columns; and flat and ridge tiles. Decisions with distinct consumers and change paths have their own addresses rather than being combined into broad column, door or tile sections. Trees and neighbor shells settle their placement interfaces and leaf rules, while thin portable objects need less construction detail than a basin or articulated door.

Columns, leaves, door frames, tiles, basin, altar, furniture, vessels, vegetation and neighbor-shell prototypes assigned to models by [build-scope](../../settings/00-delivery.md#build-scope) each have at least one H2. Design and source lengths are not compared; at the `modelSources` evidence stage, public-class/prototype-file/H2 correspondence is inspected separately.

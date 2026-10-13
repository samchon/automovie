# Furniture, fixture, and textile materials

## Greige paneled cabinetry {#greige-cabinet}
<!--
@evidence models/10-kitchen-dining.md#kitchen-base-run plinth/carcass/leaf/drawer-front receive coating while stone countertop and black handles remain separate.
@evidence models/10-kitchen-dining.md#kitchen-wall-cabinet Existing upper carcass/leaves receive coating; current protruding handle faces retain their black-metal assignment rather than an outdated groove description.
@evidence models/10-kitchen-dining.md#kitchen-island Storage carcass/fronts receive greige response without extending into the existing seating-side knee space.
@evidence models/12-service-rooms.md#laundry-upper-storage Existing carcass cuts and two leaf grooves retain greige coating while the separate worktop remains stone.
@evidence principles/core/common.md#declared-basis kitchen-equipment's gray-brown cabinets ground #8A7F72/roughness 0.50 under the shared authored-color rule.
@evidence principles/core/common.md#scope-preservation Finish covers listed cabinet/vanity/laundry faces without changing their geometry or handles.
@evidence principles/core/common.md#substantive-completion MDF/coating decision, color/linear response, five face roles, 0.10 m grain, source, and segmentation views are defined.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Gray-brown cabinet identity gains #8A7F72, roughness 0.50, and explicit cabinetry/cleat bindings.
@evidence principles/design/materials.md#material-construction-appearance The 0.018 m MDF assembly choice remains distinct from optical coating values and host-owned panel thickness.
@evidence principles/design/materials.md#material-binding-interface plinth/carcass/leaf/drawer-front/cleat uses each actual board's metric UVs and seam boundaries.
@evidence principles/design/materials.md#material-verification-address Common-area/bathroom views can falsify merged drawers/leaves even with correct greige constants.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work The kitchen/tub cabinet identities and existing model-qualified faces supply compatible coating hosts without changed geometry.
@evidence contracts/texture-readability.md#material-texture-readability Planned 0.10 m coating grain uses panel lower-left origins, width U/height V, and actual drawer/leaf seams.
@evidence settings/10-house.md#kitchen-equipment Cabinet color remains a middle-value band between white backsplash and pale countertop.
@evidence settings/10-house.md#tub-bathroom The vanity shares the gray-brown cabinet family while basin/top/hardware retain distinct responses.
-->

The [kitchen gray-brown cabinets](../settings/10-house.md#kitchen-equipment) and [tub-room vanity](../settings/10-house.md#tub-bathroom) use a material assembly choice of semi-matte paint over 0.018 m MDF panels. Appearance is `#8A7F72` (linear 0.254, 0.212, 0.168), roughness 0.50, metallic 0.0, transmission 0.0, approximating coating color/gloss. Models creates panel divisions and door gaps; this material thickness choice does not resize the existing host boards. The intended mid-value band remains between white wall tile and pale tops.

Bind [base cabinets](../models/10-kitchen-dining.md#kitchen-base-run)/[island](../models/10-kitchen-dining.md#kitchen-island) `plinth`, `carcass`, `leaf`, `drawer-front`; [wall cabinets](../models/10-kitchen-dining.md#kitchen-wall-cabinet) `carcass`, `leaf`; [vanity](../models/14-bathrooms.md#vanity-basin) `plinth`, `carcass`, `leaf`; [laundry upper cabinets](../models/12-service-rooms.md#laundry-upper-storage) `carcass`, `leaf`; and [folding worktop](../models/12-service-rooms.md#laundry-folding-top) `cleat`. Source owner is `src/materials/furnishings/cabinetry.ts`. [Distance samples](00-material-frame.md#material-review-set) in common-area 03 and bathroom thresholds test divisions readable through shadows within one finish.

Surface plan: semi-matte grain on `leaf`/`carcass` repeats at 0.10 m from each panel's lower-left with U width/V height, breaking at drawers/leaves without erasing division shadows. Current source declares constant response without that texture; grain and current close/review-distance GPU acceptance remain unverified.

## Light stone countertops {#light-countertop}
<!--
@evidence models/12-service-rooms.md#laundry-folding-top top's actual casing cuts and cleat sockets receive stone response; cleat members remain greige and actual top thickness stays host-owned.
@evidence principles/core/common.md#declared-basis kitchen-equipment's pale top grounds #E4E0D8/roughness 0.30 under the common authored-color rule.
@evidence principles/core/common.md#scope-preservation Stone binds cabinet/island/vanity countertop and laundry top without coating cleats or changing host geometry.
@evidence principles/core/common.md#substantive-completion Stone assembly, color/linear response, exact top roles, 0.30 m grain, source, and front-edge observation are defined.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Pale-top identity gains numeric stone response and countertop/top bindings separate from cleats.
@evidence principles/design/materials.md#material-construction-appearance The 0.03 m engineered-stone choice is distinct from coating optics and the laundry host's existing 0.06 m top geometry.
@evidence principles/design/materials.md#material-binding-interface countertop/top receives local X/Z UVs from a corner, cut at real sink/edge boundaries; cleat remains another finish.
@evidence principles/design/materials.md#material-verification-address View 03 can falsify a missing pale front edge above greige storage.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Pale-top identity and existing laundry top/socket faces suffice for appearance binding without changed support geometry.
@evidence contracts/texture-readability.md#material-texture-readability Planned subtle stone grains/sparse veins repeat at 0.30 m with member-local X/Z coordinates and real sink/front-edge cuts.
@evidence settings/10-house.md#kitchen-equipment A light top remains visibly separate from gray-brown cabinets and stainless fixtures.
-->

The [pale tops](../settings/10-house.md#kitchen-equipment) have an engineered-stone assembly choice of 0.03 m thickness. Appearance is `#E4E0D8` (linear 0.776, 0.745, 0.687), roughness 0.30, metallic 0.0, transmission 0.0, approximating polished color/semi-gloss with planned grains/sparse veins. Bind [base cabinets](../models/10-kitchen-dining.md#kitchen-base-run), [island](../models/10-kitchen-dining.md#kitchen-island), and [vanity](../models/14-bathrooms.md#vanity-basin) `countertop`, plus [laundry worktop](../models/12-service-rooms.md#laundry-folding-top) `top`. Its `cleat` receives [greige cabinetry](#greige-cabinet); its actual reserved 0.06 m geometry is not reduced to the shared 0.03 m material assembly choice. Source owner is `src/materials/furnishings/cabinetry.ts`; view 03 tests the pale front edge above storage.

Surface plan: subtle stone grains/sparse veins repeat at 0.30 m using top-local X/Z as U/V from one corner, cut at sink holes/front edges. Current source declares constant response without the texture; grain/current close/review-distance GPU acceptance remains unverified.

## Stainless appliances and faucets {#stainless-steel}
<!--
@evidence models/10-kitchen-dining.md#kitchen-refrigerator Planned appliance-body/leaf/drawer-front/handle metal remains distinct from the prototype's enamel appliance-interior; this refrigerator declares no control-panel.
@evidence models/10-kitchen-dining.md#kitchen-range Planned body/leaf/handle metal leaves cooktop/controls/opaque appliance-glass and enamel interior separate.
@evidence models/10-kitchen-dining.md#kitchen-dishwasher Planned body/leaf/recessed handle receives metal while controls/interior retain black glass/enamel.
@evidence models/10-kitchen-dining.md#kitchen-microwave Planned body/leaf metal stays separate from appliance-glass/control-panel.
@evidence models/12-service-rooms.md#garage-shelving Four actual 0.04 m post sections/five shelves are planned as metal while four bins retain dark response.
@evidence models/14-bathrooms.md#vanity-basin Faucet receives stainless independently from basin ceramic, stone top, and cabinet coating.
@evidence models/14-bathrooms.md#towel-bar Existing rod/brackets receive stainless without transferring gloss to towel textile.
@evidence models/05-closet-fittings.md#coat-closet-rod-shelf The 0.03 m-diameter rod uses metric axial/perimeter UVs; the same prototype shelf retains white trim.
@evidenceExclude models/05-closet-fittings.md#closet-fitting-fidelity Omitted rollers/brackets/screws have no material host; textile props require their own realized parts.
@evidence principles/core/common.md#declared-basis kitchen-equipment's stainless identity grounds #C0C2C4/roughness 0.30 under the color convention.
@evidence principles/core/common.md#scope-preservation Metal response binds designated appliance/faucet/storage faces without another fixture or resized panel.
@evidence principles/core/common.md#substantive-completion Color/linear values, metallic 1.0, exact metal roles, 0.02 m hairline plan, source, and reflection test are defined.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Stainless identity gains numeric response and model-qualified metal bindings beyond verbal material selection.
@evidence principles/design/materials.md#material-construction-appearance Unpainted hairline steel/cast faucets retain construction distinct from their approximate metallic optical response.
@evidence principles/design/materials.md#material-binding-interface Reused leaf/rod/rail/handle ids stay model-qualified, with grain reset at each actual component boundary.
@evidence principles/design/materials.md#material-verification-address Neutral/03 samples can falsify metal reading as a flat black slab or merging with white walls.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Kitchen identity and current model metal partitions suffice for response; unbuilt appliance assignments remain plans rather than a new geometry revision.
@evidence contracts/texture-readability.md#material-texture-readability Planned 0.02 m directional hairline roughness follows member length U from its start and resets at leaves/handles.
@evidence settings/10-house.md#kitchen-equipment Stainless equipment remains distinct from greige storage, pale stone, black controls, and white interiors.
-->

The [stainless refrigerator/range/microwave](../settings/10-house.md#kitchen-equipment), dishwasher, and faucets use unpainted hairline steel sheet/cast metal. Appearance is `#C0C2C4` (linear 0.527, 0.539, 0.552), roughness 0.30, metallic 1.0, transmission 0.0. Planned directional roughness follows panel length; the exposed-metal 0.30 response is an explicit metallic exception to the coating/wood roughness bands.

Planned appliance bindings are [refrigerator](../models/10-kitchen-dining.md#kitchen-refrigerator) `leaf`, `drawer-front`, `appliance-body`, `handle`; [range](../models/10-kitchen-dining.md#kitchen-range) `leaf`, `appliance-body`, `handle`; [microwave](../models/10-kitchen-dining.md#kitchen-microwave) `appliance-body`, `leaf`; [dishwasher](../models/10-kitchen-dining.md#kitchen-dishwasher) `leaf`, `appliance-body`, `handle`; [laundry machines](../models/12-service-rooms.md#laundry-machine) `door-ring`, `drum`; [garage shelves](../models/12-service-rooms.md#garage-shelving) `post`, `shelf`; and [tool board](../models/12-service-rooms.md#garage-tool-board) `tool-steel`. Their `appliance-interior` receives [white enamel](#white-enamel). Separate unbuilt objects do not gain active bindings by appearing in this design list.

Building fixture bindings are [toilet](../models/14-bathrooms.md#shared-toilet) flush `handle`; [island](../models/10-kitchen-dining.md#kitchen-island) `basin`/`faucet`; [vanity](../models/14-bathrooms.md#vanity-basin), [tub](../models/14-bathrooms.md#bathtub), and [shower](../models/14-bathrooms.md#sliding-shower-booth) `faucet`; shower `rail`; coat/linen/bedroom-closet `rail`/`rod`; [wardrobe hanging](../models/13-bedrooms.md#wardrobe-hanging) `rod`; and [towel bar](../models/14-bathrooms.md#towel-bar) `rod`/`bracket`. [Kitchen utensil](../models/18-house-props.md#kitchen-food-utensils) metal is also planned stainless. Each rod uses meter length U/perimeter V ending at actual part ends. Black window/tub-curtain rods remain [coated metal](02-interior-shell.md#black-coated-metal), not stainless.

The 2026-09-28 storage-interior GPU record reports correcting an erroneous black-metal binding for storage rods to exposed stainless. This is the original recorded observation, not a new capture in this translation. Source owner is `src/materials/furnishings/appliances.ts`; current building bindings cover the named fixed fixtures/storage metal while appliance/prop realization remains separate. Neutral/03 review asks for readable metal reflection, darker than white walls without becoming a black panel.

Surface plan: directional hairline roughness repeats at 0.02 m, panel-length U is the polishing direction, and origin is a panel starting corner, reset at leaf/handle boundaries. Current source uses constant metallic response without that roughness map; grain and current close/review-distance GPU judgment remain unverified.

## Black-glass controls {#black-glass-panel}
<!--
@evidence principles/core/common.md#declared-basis The dark palette and appliance control/glass roles ground authored #1F1F20/roughness 0.08 without photographic sampling.
@evidence principles/core/common.md#scope-preservation Planned response covers range/microwave/dishwasher/laundry control surfaces without changing appliance geometry.
@evidence principles/core/common.md#substantive-completion Color/linear values, optics, exact control/glass roles, source plan, and glossy-metal comparison are defined while realization remains unverified.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Dark palette identity gains a glass-specific 0.08 gloss and appliance-glass/control-panel assignments.
@evidence principles/design/materials.md#material-construction-appearance Opaque black glass-ceramic construction is distinct from bare metal and transparent window glass.
@evidence principles/design/materials.md#material-binding-interface cooktop/burner/control-panel/appliance-glass ends at each actual appliance partition, without spill onto steel.
@evidence principles/design/materials.md#material-verification-address Close samples must distinguish controls from stainless through gloss; a flat black rectangle fails.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Existing appliance roles, including the repaired laundry door/drum interfaces, suffice for this response plan. The earlier door-hole repair is model work; this design creates no appliance geometry.
@evidence contracts/texture-readability.md#material-texture-readability Intentional smoothness requires the planned 0.08 optical response and actual-frame reflection rather than painted grain; current acceptance is unverified.
-->

Oven windows, cooktops, and controls use black glass-ceramic. Appearance is `#1F1F20` (linear 0.014, 0.014, 0.014), roughness 0.08, metallic 0.0, transmission 0.0: an opaque reflector with no visible interior behind the panel. Roughness 0.08 is an authored glass exception to the common glossy 0.02–0.05 band, retaining a narrow highlight without clear-pane transmission.

Planned bindings are [range](../models/10-kitchen-dining.md#kitchen-range) `cooktop`, `burner`, `control-panel`, `appliance-glass`; [microwave](../models/10-kitchen-dining.md#kitchen-microwave) `appliance-glass`, `control-panel`; [dishwasher](../models/10-kitchen-dining.md#kitchen-dishwasher) `control-panel`; and [washer/dryer](../models/12-service-rooms.md#laundry-machine) `control-panel`. The planned source owner remains `src/materials/furnishings/appliances.ts`, but that current file declares stainless steel, not this separate black-glass finish. The unbuilt appliance design does not establish its active realization.

Surface plan: intentionally smooth control glass reads through roughness 0.08 highlights and real light/scene response, ending at panel partitions without pattern spill. Close samples compare controls with stainless; a flat black rectangle fails. Current source realization and close/review-distance GPU judgment remain unverified.

## White enamel and ceramic {#white-enamel}
<!--
@evidence models/12-service-rooms.md#laundry-machine Planned white body/leaf remains separate from glass/controls/door-ring/drum; laundry is not inferred complete from sanitary material source.
@evidence models/14-bathrooms.md#shared-toilet Existing ceramic/seat/lid receives glaze response while the flush handle remains stainless.
@evidence models/14-bathrooms.md#bathtub Ceramic inner floor/walls/rim retains one glaze response, distinct from faucet metal.
@evidence principles/core/common.md#declared-basis laundry-mudroom's white appliances and sanitary ceramic roles ground #F5F5F2/roughness 0.25 under the color convention.
@evidence principles/core/common.md#scope-preservation Response binds existing ceramic and planned enamel/prop surfaces without changing fixture geometry.
@evidence principles/core/common.md#substantive-completion Color/linear values, glaze response, exact ceramic/enamel roles, source distinction, and bathroom observation are defined.
@evidence principles/core/inherited-units.md#derived-parent-differentiation White appliance/ceramic identity gains numeric glaze and ceramic/seat/lid bindings.
@evidence principles/design/materials.md#material-construction-appearance Glazed ceramic and enamel-coated steel share an approximate dielectric appearance without becoming the same physical assembly.
@evidence principles/design/materials.md#material-binding-interface Ceramic/tray/seat/lid and planned appliance/prop faces are qualified by their own model roles rather than coated by generic names.
@evidence principles/design/materials.md#material-verification-address Bathroom 05 must distinguish glaze from wall tile through highlights and actual curved normals.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Laundry identity and existing toilet/tub ceramic faces suffice for the appearance choice; no fixture construction is revised by this finish.
@evidence contracts/texture-readability.md#material-texture-readability Smooth glaze requires roughness 0.25 highlights and real curved shading rather than decorative maps, ending at metal/tile partitions.
@evidence settings/10-house.md#laundry-mudroom The planned appliance white body remains distinct from glass and steel parts without claiming active appliance source.
-->

Toilets, basins, tubs, and [front-loading washer/dryer bodies](../settings/10-house.md#laundry-mudroom) use glazed ceramic or enamel-coated steel. These remain different constructions sharing approximate appearance: `#F5F5F2` (linear 0.913, 0.913, 0.888), roughness 0.25, metallic 0.0, transmission 0.0.

Bind [toilet](../models/14-bathrooms.md#shared-toilet) `ceramic`, `toilet-seat`, `lid`; [vanity](../models/14-bathrooms.md#vanity-basin)/[tub](../models/14-bathrooms.md#bathtub) `ceramic`; and [shower](../models/14-bathrooms.md#sliding-shower-booth) `shower-tray`. Planned separate-object bindings are [washer/dryer](../models/12-service-rooms.md#laundry-machine) `appliance-body`, `leaf`, and [oven](../models/10-kitchen-dining.md#kitchen-range)/[dishwasher](../models/10-kitchen-dining.md#kitchen-dishwasher) `appliance-interior`. Laundry `door-ring`/`drum` is [stainless](#stainless-steel) and `glass` is [clear](01-exterior.md#glass-clear).

The current fixed-ceramic source owner is `src/materials/furnishings/sanitary.ts`; it declares `white-sanitary-ceramic`. This does not implement the whole planned enamel/prop family. Planned [vanity accessories](../models/14-bathrooms.md#vanity-basin) `accessory`, [porch planter](../models/18-house-props.md#porch-mat-planter) and bottles `container`, [fruit bowl](../models/18-house-props.md#kitchen-food-utensils) `bowl`, and [nightstand lamp](../models/13-bedrooms.md#nightstand-lamp) `lamp-base` share the white design values. Project meter perimeter U/height V, ending at each open lip; current realization remains separate from this design assignment.

Surface plan: intentionally smooth glaze reads through roughness 0.25 highlights, actual curved normals, and shadows, ending at metal/tile boundaries. Bathroom 05 compares glaze with wall tile's wider highlight. Current close/review-distance GPU judgment and the unbuilt enamel/prop realization remain unverified.

## Honey-colored furniture wood {#furniture-wood}
<!--
@evidence models/10-kitchen-dining.md#dining-table Planned top/apron/leg grain follows each actual member axis rather than continuing horizontal grain onto vertical legs.
@evidence models/10-kitchen-dining.md#dining-chair Planned seat/leg/back uses the same honey family with each member's separate UVs.
@evidence models/10-kitchen-dining.md#kitchen-island-stool Planned seat/leg/footrest remains wood without filling open leg gaps with textured panels.
@evidence models/11-living.md#low-table Planned top/four legs retain actual host thickness and independently aligned grain.
@evidence models/11-living.md#reading-armchair Planned legs receive wood while the upholstered base/seat/back/arms remain textile.
@evidence models/12-service-rooms.md#mudroom-bench Planned seat/carcass/shelf receives wood while shoe faces remain separate props.
@evidence models/12-service-rooms.md#mudroom-coat-hooks The 0.80 m board aligns grain with its long world-Z axis; hooks and clothes remain distinct.
@evidence models/12-service-rooms.md#pantry-l-shelf Actual shelf/cleat lengths align grain without duplicated L-corner boards.
@evidence models/12-service-rooms.md#garage-workbench Planned top/leg/drawer-front receives wood while handles/tools remain metal.
@evidence models/13-bedrooms.md#headboard-bed Planned headboard/bed-frame remains wood separate from mattress/cover/pillows.
@evidence models/13-bedrooms.md#nightstand-lamp Planned carcass/drawer-front remains wood separate from lamp-base/shade.
@evidence models/13-bedrooms.md#low-dresser Planned carcass/drawer-front/leg retains member-aligned grain and separate handles.
@evidence models/13-bedrooms.md#child-desk Planned top/leg/shelf remains wood separate from books/pot/pencils' assigned roles.
@evidence models/13-bedrooms.md#desk-chair Planned seat/leg/back receives wood without new joints or cushions.
@evidence models/15-outdoor.md#terrace-table Planned top/plank ends/legs receive wood without filling actual plank gaps.
@evidence models/15-outdoor.md#terrace-chair Planned seat/back/leg receives wood without blocking actual slat gaps.
@evidence principles/core/common.md#declared-basis living's wooden furniture and primary-bedroom's bed ground #A87A4E/roughness 0.50 under the color convention.
@evidence principles/core/common.md#scope-preservation Listed actual/planned wood faces receive response; geometry/placement and unrelated plinth/base finishes stay with their owners.
@evidence principles/core/common.md#substantive-completion Color/linear response, complete wood assignments, 0.15 m grain module, current source limits, and floor/furniture comparison are stated.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Wood identity gains numeric response and explicit member-specific bindings beyond parent furniture construction.
@evidence principles/design/materials.md#material-construction-appearance Oiled laminated oak construction remains distinct from approximate coating/grain response.
@evidence principles/design/materials.md#material-binding-interface Actual/planned tops/aprons/legs/seats/storage/mantel roles retain member-local length U/width V and restart at joints.
@evidence principles/design/materials.md#material-verification-address Views 03/05 can falsify furniture legs merged with oak flooring or mismatched grain directions.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Living/bedroom wood identity and named prototype faces suffice for appearance plans without modifying furniture envelopes or placing unbuilt objects.
@evidence contracts/texture-readability.md#material-texture-readability Oak color repeats over length U 1.00 m/width V 0.15 m without floor-plank joints, restarting at actual member contacts.
@evidence settings/10-house.md#living Furniture wood remains slightly darker than flooring, separate from upholstered seats and brick.
@evidence settings/10-house.md#primary-bedroom The planned bed/nightstands retain the same honey wood family without claiming their source/captures exist.
-->

The [low wooden table](../settings/10-house.md#living), [wooden bed](../settings/10-house.md#primary-bedroom), dining furniture, desks, and pantry shelving use oiled laminated oak. Appearance is `#A87A4E` (linear 0.392, 0.195, 0.076), roughness 0.50, metallic 0.0, transmission 0.0. Planned grain follows member length and real edge shading reveals thickness. It is slightly darker than [oak flooring](02-interior-shell.md#oak-floor) so legs need not disappear into it.

Planned bindings are [dining table](../models/10-kitchen-dining.md#dining-table) `top`/`apron`/`leg`, [dining chair](../models/10-kitchen-dining.md#dining-chair) `seat`/`leg`/`back`, [stool](../models/10-kitchen-dining.md#kitchen-island-stool) `seat`/`leg`/`footrest`, [desk chair](../models/13-bedrooms.md#desk-chair) `seat`/`leg`/`back`, [low table](../models/11-living.md#low-table) `top`/`leg`, [desk](../models/13-bedrooms.md#child-desk) `top`/`leg`/`shelf`, [bed](../models/13-bedrooms.md#headboard-bed) `headboard`/`bed-frame`, [nightstand](../models/13-bedrooms.md#nightstand-lamp) `carcass`/`drawer-front`, [dresser](../models/13-bedrooms.md#low-dresser) `carcass`/`drawer-front`/`leg`, sofa/[armchair](../models/11-living.md#reading-armchair) `leg`, [shoe bench](../models/12-service-rooms.md#mudroom-bench) `seat`/`carcass`/`shelf`, [workbench](../models/12-service-rooms.md#garage-workbench) `top`/`leg`/`drawer-front`, and [terrace table](../models/15-outdoor.md#terrace-table)/[chair](../models/15-outdoor.md#terrace-chair) wood faces.

Existing fixed wood includes [pantry shelves](../models/12-service-rooms.md#pantry-l-shelf) `shelf`/`cleat` and [mudroom hook board](../models/12-service-rooms.md#mudroom-coat-hooks) `board`, aligned along world Z. Current source owner `src/materials/furnishings/wood.ts` binds those fixed faces; [mantel](../models/11-living.md#fireplace-insert-mantel) `mantel` has matching values in `src/materials/furnishings/fixtures.ts`. This does not realize all unbuilt furniture/props in the design list. Views 03/05 compare the shared wood family with flooring.

Further planned wood assignments are [tool board](../models/12-service-rooms.md#garage-tool-board) `board`/`tool-grip`, [table props](../models/19-room-accents.md#living-tabletop-props) `tray`, [kitchen props](../models/18-house-props.md#kitchen-food-utensils) `cutting-board`, [pantry containers](../models/12-service-rooms.md#pantry-containers)/[wardrobe baskets](../models/13-bedrooms.md#wardrobe-shelves) `basket`, pantry `box`, and [desk](../models/13-bedrooms.md#child-desk) `pencil`. Each box starts length U/height V at one bottom corner and restarts at actual board ends; other members restart length U/width V separately. The tool-grip's differing assignment in the minor-partition table remains a design conflict described there, not an active implementation claim.

Surface plan: 0.15 m-wide oak grain follows panel length U. `furniture-oak.png` repeats over U 1.00 m/V 0.15 m in #A87A4E, without floor-plank seams, restarting directions at leg/top/drawer joints. The file is registered for current fixed wood; complete texture response and current close/review-distance GPU judgment remain unverified. Kitchen `plinth` belongs to [greige](#greige-cabinet), bookcase `plinth` to [dark wood](#dark-bookcase-wood), and sofa/armchair `base` to [upholstery](#grey-beige-upholstery), outside this wood binding.

## Dark bookcase wood {#dark-bookcase-wood}
<!--
@evidence models/11-living.md#dark-bookcase Planned carcass/plinth/shelf receives dark wood while book faces retain their independent color-cycle design.
@evidence principles/core/common.md#declared-basis living's dark bookcase grounds #4A3A2E/roughness 0.55 under the color convention.
@evidence principles/core/common.md#scope-preservation Finish covers planned bookcase/art-frame wood without changing prototypes or coating book/print faces.
@evidence principles/core/common.md#substantive-completion Color/linear response, dark-wood construction, exact roles, 0.15 m grain, planned source, and shadow/book-color observation are defined.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Dark-bookcase identity gains numeric response and carcass/plinth/shelf/art-frame assignments.
@evidence principles/design/materials.md#material-construction-appearance Stained walnut construction is distinct from approximate dark color/roughness and the chosen oak-like grain proxy.
@evidence principles/design/materials.md#material-binding-interface Board-local length U and seam resets retain separate shelves/sides/back; books/prints remain other materials.
@evidence principles/design/materials.md#material-verification-address View 04 must reveal shelves/shadows/book variations inside a dark body rather than one black panel.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Existing living identity and bookcase partitions suffice for the wood plan without changed furniture geometry or placement.
@evidence contracts/texture-readability.md#material-texture-readability Planned 0.15 m dark grain starts at each shelf/side's inner corner and ends at actual board cuts.
@evidence settings/10-house.md#living The planned dark bookcase remains distinct from the light wall and independent book colors.
-->

The [dark living-room bookcase](../settings/10-house.md#living) uses dark-stained walnut boards. Appearance is `#4A3A2E` (linear 0.068, 0.042, 0.027), roughness 0.55, metallic 0.0, transmission 0.0. Planned [bookcase](../models/11-living.md#dark-bookcase) bindings are `carcass`, `plinth`, `shelf`; `book` receives the color-cycle design from [gray-beige](#grey-beige-upholstery), [olive](#olive-bedding), and [blue-gray](#blue-grey-bedding). Wall-art `art-frame` shares the dark wood; `art-print` remains separate.

The planned source owner is `src/materials/furnishings/wood.ts`, but its current declaration covers honey fixed wood, not a dark-bookcase finish. Review 04 asks for a dark body in front of the white wall with shelves/shadows and book-color variation still visible. Surface plan uses the authored 0.15 m dark oak-like grain proxy along board length U, from each shelf/side inner starting corner, cut at board ends. Source/grain/current close/review-distance GPU realization remains unverified.

## Gray-beige upholstery {#grey-beige-upholstery}
<!--
@evidence models/11-living.md#fabric-sofa Planned base/seat-cushion/back/arm receives matte cloth while wood legs remain separate.
@evidence models/13-bedrooms.md#wardrobe-hanging Planned gray-beige clothes uses textile response while rod/shelf remains stainless/white trim; current storedCloth is only the gray variant.
@evidence models/19-room-accents.md#sofa-throws Planned gray-beige throw pillow shares cloth response; folded blanket uses the separate towel-family design.
@evidence principles/core/common.md#declared-basis living's gray/off-white fabric identity grounds #B7AFA3/roughness 0.92 under the color rule.
@evidence principles/core/common.md#scope-preservation Planned upholstery/pillows/clothes/book-color/rug-border faces receive response without new geometry.
@evidence principles/core/common.md#substantive-completion Color/linear response, cloth construction, exact roles, 0.01 m weave, planned source, and sofa/wall observations are defined.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Fabric identity gains numeric matte response and part-specific upholstery assignments.
@evidence principles/design/materials.md#material-construction-appearance Woven polyester over foam remains construction; optical color/normal weave approximates its surface.
@evidence principles/design/materials.md#material-binding-interface Cushion-local horizontal U/vertical V and seam origins preserve actual joints; books reuse palette values as a declared proxy.
@evidence principles/design/materials.md#material-verification-address Views 04/03 must distinguish matte sofa from the brighter wall without flattening cushions.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Living identity and existing sofa/garment partitions suffice for cloth response plans without new cushions or clothes geometry.
@evidence contracts/texture-readability.md#material-texture-readability Planned 0.01 m warp/weft color/normal grain uses cushion-local origins and ends at actual seams.
@evidence settings/10-house.md#living Gray/off-white upholstery remains separate from wood legs and the light wall.
-->

The [gray/off-white sofa](../settings/10-house.md#living) and armchair use woven polyester over foam. Appearance is `#B7AFA3` (linear 0.474, 0.429, 0.366), roughness 0.92, metallic 0.0, transmission 0.0; a planned 0.01 m color/normal repeat approximates weave. Bind [sofa](../models/11-living.md#fabric-sofa)/[armchair](../models/11-living.md#reading-armchair) `base`, `seat-cushion`, `back`, `arm`. Planned [throw pillows](../models/19-room-accents.md#sofa-throws) `pillow` and [wardrobe garments](../models/13-bedrooms.md#wardrobe-hanging) `clothes` gray-beige variants share the response; other garment variants use olive/blue-gray. Book covers and rug borders reuse the palette as designed proxies, not physical polyester construction claims.

The planned full textile owner is `src/materials/furnishings/textiles.ts`, which does not currently exist. Actual `storedCloth` in `src/materials/furnishings/cabinetry.ts` uses the same gray-beige constants for current storage garments; it does not implement sofas, weave, or olive/blue-gray garment variants. Views 04/03 test matte sofas darker than walls. Surface plan: 0.01 m warp/weft color/normal grain uses cushion-local horizontal U/vertical V from sewing-seam origins and ends at actual seams, preserving cushion volume. Full textile/source and current close/review-distance GPU realization remain unverified.

## Gray-beige primary bedding {#primary-bedding}
<!--
@evidence principles/core/common.md#declared-basis primary-bedroom's gray-beige bedding grounds #CFC8BC/roughness 0.93 under the authored-color convention.
@evidence principles/core/common.md#scope-preservation Planned primary bedding and all three beds' pillow/mattress faces receive response without changing bed geometry.
@evidence principles/core/common.md#substantive-completion Color/linear optics, cotton construction, exact bedding/pillow/mattress assignment, 0.01 m weave, source plan, and contrast test are defined.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Bedding identity gains numeric cloth response and per-part assignment beyond bed construction.
@evidence principles/design/materials.md#material-construction-appearance Cotton quilt/pillows/mattress covers retain construction distinct from approximate color/normal weave.
@evidence principles/design/materials.md#material-binding-interface Bed-cover long U/short V starts at a foot corner and ends at folded edges/pillow boundaries.
@evidence principles/design/materials.md#material-verification-address Primary-room views must distinguish bedding from wood and carpet.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Existing primary identity and bed partitions suffice for cloth response without resizing mattress or creating a bed source.
@evidence contracts/texture-readability.md#material-texture-readability Planned 0.01 m weave follows blanket direction and breaks at actual fold/pillow interfaces.
@evidence settings/10-house.md#primary-bedroom The planned primary bedding retains gray-beige identity rather than borrowing a child's identifying color.
@evidence spaces/rooms/primary.md#primary-furniture-use Its bedding material handoff receives #CFC8BC on primary bedding without changing placement reservations.
-->

The [primary gray-beige bedding](../settings/10-house.md#primary-bedroom) is cotton quilt/pillows with light gray-beige cotton mattress covers. Appearance is `#CFC8BC` (linear 0.624, 0.578, 0.503), roughness 0.93, metallic 0.0, transmission 0.0. Planned bindings are primary [headboard-bed](../models/13-bedrooms.md#headboard-bed) `bedding` and all three beds' `pillow`/`mattress`. Planned owner is the absent `src/materials/furnishings/textiles.ts`; no active bedding realization is claimed. Primary-room review compares bedding with wooden bed and carpet.

Surface plan: 0.01 m weave follows long blanket U/short V from a foot corner, ending at folded ends/pillows to reveal cloth direction. Source/grain/current close/review-distance GPU realization remains unverified.

## Olive bedding {#olive-bedding}
<!--
@evidence principles/core/common.md#declared-basis bedroom-two's olive identity grounds #6B7040/roughness 0.92 under the authored-color rule.
@evidence principles/core/common.md#scope-preservation Planned second-bed bedding and independent book/clothes variants receive response without changed geometry or pillow ownership.
@evidence principles/core/common.md#substantive-completion Color/linear optics, cotton construction, variant assignments, 0.01 m weave, source plan, and room identification are defined.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Olive identity gains numeric cloth response and per-instance bedding assignment.
@evidence principles/design/materials.md#material-construction-appearance Cotton quilt construction remains separate from palette reuse on book covers and approximate weave.
@evidence principles/design/materials.md#material-binding-interface bedding/book/clothes remain distinct model-qualified parts with seams at their actual boundaries.
@evidence principles/design/materials.md#material-verification-address Baseline samples and bedroom-two views test olive identification under warm light.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Existing olive-room identity and shared bed partitions suffice for response without new bed geometry or changed placement.
@evidence contracts/texture-readability.md#material-texture-readability Planned 0.01 m weave follows blanket U/V from the foot and ends at folds/pillows.
@evidence settings/10-house.md#bedroom-two Olive bedding retains this child's identifying color while the wood/carpet system remains shared.
-->

This is the identifying color of the [small olive-bedding bedroom](../settings/10-house.md#bedroom-two), using a cotton quilt. Appearance is `#6B7040` (linear 0.147, 0.162, 0.051), roughness 0.92, metallic 0.0, transmission 0.0. Bind planned bedroom-two [bed instance](../models/13-bedrooms.md#headboard-bed) `bedding`; instances owns the shared prototype's room variants. Book `book` and wardrobe `clothes` olive variants reuse the palette on their separate parts, ending at their own boundaries.

Planned owner is the absent `src/materials/furnishings/textiles.ts`; current gray storedCloth does not implement the olive garment variant. Baseline/bedroom-two samples test olive identity. Surface plan: 0.01 m weave follows long U/short V from the blanket foot, ending at folds/pillows separately from primary gray-beige. Source/grain/current close/review-distance GPU realization remains unverified.

## Blue-gray bedding {#blue-grey-bedding}
<!--
@evidence principles/core/common.md#declared-basis bedroom-three's blue-gray identity grounds #6E7F8C/roughness 0.92 under the authored-color convention.
@evidence principles/core/common.md#scope-preservation Planned third-bed bedding and independent book/clothes variants receive response; all pillows retain the primary-bedding owner.
@evidence principles/core/common.md#substantive-completion Color/linear optics, cotton construction, variant roles, 0.01 m weave, source plan, and room comparison are defined.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Blue-gray room identity gains numeric cloth response and instance-specific bedding assignment.
@evidence principles/design/materials.md#material-construction-appearance Cotton quilt construction remains distinct from palette reuse on books and approximate surface weave.
@evidence principles/design/materials.md#material-binding-interface bedding/book/clothes remains separate parts; seam origins follow each actual host rather than one universal cloth panel.
@evidence principles/design/materials.md#material-verification-address Side-by-side small-room views test distinct hues under warm light.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Existing third-room identity and bed partitions suffice for the response plan without new geometry or changed placement.
@evidence contracts/texture-readability.md#material-texture-readability Planned 0.01 m weave follows blanket U/V from foot corners and ends at folds/pillows.
@evidence settings/10-house.md#bedroom-three Blue-gray bedding remains a separate identifying hue from olive without changing shared room functions.
-->

The [blue-gray child's room](../settings/10-house.md#bedroom-three) is identified by its cotton quilt. Appearance is `#6E7F8C` (linear 0.156, 0.212, 0.262), roughness 0.92, metallic 0.0, transmission 0.0. The intended brightness is close to olive but hue differs, distinguishing the rooms through bedding. Bind planned bedroom-three [headboard bed](../models/13-bedrooms.md#headboard-bed) `bedding`; book `book`/wardrobe `clothes` blue-gray variants reuse palette values on distinct parts. All beds' pillows remain [primary-bedding](#primary-bedding) faces.

Planned owner is the absent `src/materials/furnishings/textiles.ts`; current gray storedCloth does not realize the blue-gray garment variant. Side-by-side small-room views test distinction under warm lights. Surface plan: 0.01 m weave follows long U/short V from the foot and ends at folds/pillows separately from other bedding. Source/grain/current close/review-distance GPU realization remains unverified.

## Restrained rug {#muted-rug}
<!--
@evidence models/14-bathrooms.md#bath-floor-mats Planned field/border covers actual thin mat top/bottom/cuts without copying the floor's wood/tile pattern into textile.
@evidence models/11-living.md#floor-covering Planned grain binds actual cover faces without recreating floor pieces beneath them.
@evidence principles/core/common.md#declared-basis living's restrained rug grounds #8E8579/roughness 0.95 under the color convention.
@evidence principles/core/common.md#scope-preservation Planned finish covers existing field/border roles without changing mat/rug geometry or floor ownership.
@evidence principles/core/common.md#substantive-completion Color/linear response, wool construction, field/border assignments, 0.15 m pattern, source plan, and floor-separation views are defined.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Rug identity gains numeric response and precisely bounded field/border texture assignments.
@evidence principles/design/materials.md#material-construction-appearance Thin wool construction remains distinct from approximate matte grain and color.
@evidence principles/design/materials.md#material-binding-interface Rug lower-left front origin/width U/length V ends the field pattern exactly at the border.
@evidence principles/design/materials.md#material-verification-address View 04 must reveal a separate rug/border above flooring rather than an indistinguishable surface.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Existing rug identity and floor-covering partitions suffice for texture planning without another floor geometry.
@evidence contracts/texture-readability.md#material-texture-readability Planned 0.15 m restrained geometric weave stays within field; border retains only matching fiber grain.
@evidence settings/10-house.md#living The rug remains a restrained patterned textile separate from wood flooring.
-->

The [restrained patterned rug](../settings/10-house.md#living) uses thin wool textile. Field appearance is `#8E8579` (linear 0.270, 0.235, 0.191), roughness 0.95, metallic 0.0, transmission 0.0; border uses [gray-beige upholstery](#grey-beige-upholstery) palette values. The [thin covering](../models/11-living.md#floor-covering) `field` has a 0.15 m woven pattern cut exactly at `border`. Planned owner is the absent `src/materials/furnishings/textiles.ts`; review 04 tests rug/border separation from flooring.

Surface plan: restrained geometric weave repeats at 0.15 m on `field`, while `border` retains only matching fiber grain. Use the rug's left-front corner as origin, U width/V length, ending the pattern at the actual border. Source/grain/current close/review-distance GPU realization remains unverified.

## White towels and thin curtains {#towel-curtain-textile}
<!--
@evidence models/13-bedrooms.md#primary-window-curtains Only actual curtain partitions across eight planned windows receive thin cloth; rod/bracket remains black metal.
@evidence models/18-house-props.md#linen-folded-towels Planned folded stack tops/bottoms/cuts receive cloth, distinguished from painted shelves by optical response.
@evidence principles/core/common.md#declared-basis shower-bathroom's towels and storage's folded linen ground the authored textile values under the color convention.
@evidence principles/core/common.md#scope-preservation Planned towels/linen/tub/window curtains retain their host geometry; fixture shades reuse bright appearance separately from their own optical source.
@evidence principles/core/common.md#substantive-completion Two colors/linear values, roughness/transmission/sidedness, actual roles, separate weave scales, source plan, and optical comparisons are defined.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Towel/curtain identity gains distinct numeric responses rather than one universal white fabric.
@evidence principles/design/materials.md#material-construction-appearance Cotton pile towels and thin polyester curtains remain different constructions with distinct optics.
@evidence principles/design/materials.md#material-binding-interface towel/folded/curtain and shade roles keep separate parts; curtain is double-sided with its own UVs.
@evidence principles/design/materials.md#material-verification-address Bathroom/window samples test curtain light transmission and towel/tile distinction in actual frames.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Existing towel/storage identities and curtain strips supply compatible host roles without increasing reservations or revising windows.
@evidence contracts/texture-readability.md#material-texture-readability Planned 0.01 m pile/0.02 m transmissive weave uses horizontal U/hanging V from each lower-left and ends at sewing/frame boundaries.
@evidence settings/10-house.md#primary-bedroom The two primary curtains receive #EDE9E0 and planned thin optics without enlarging their 0.12 m inward reservation.
@evidence spaces/06-openings.md#selected-window-curtain-strips Six additional living/family/child-window strips receive the same thin-curtain plan without changed occupancy.
@evidence settings/10-house.md#shower-bathroom Towels and tub textile remain separate from glass, ceramic, and metal hardware.
@evidence settings/10-house.md#storage Folded linen receives cloth appearance without turning shelf paint into textile.
-->

[Towels](../settings/10-house.md#shower-bathroom), [folded linen](../settings/10-house.md#storage), [eight-window curtains](../models/13-bedrooms.md#primary-window-curtains), and tub curtains use cotton pile or thin polyester. Towel appearance is `#EAE6DC` (linear 0.823, 0.791, 0.716), roughness 0.95, metallic 0.0, transmission 0.0. Curtain appearance is `#EDE9E0` (linear 0.847, 0.815, 0.745), roughness 0.90, metallic 0.0, transmission 0.30, double-sided for intended window-light readability. Different replacement paths require separate material objects when realized; this design does not claim they currently exist.

Planned bindings are [towel-bar](../models/14-bathrooms.md#towel-bar) `towel`, [tub curtain](../models/14-bathrooms.md#tub-curtain-rail) `curtain`, eight-window `curtain`, and linen/[wardrobe shelves](../models/13-bedrooms.md#wardrobe-shelves) `folded`. Curtain `rod`/`bracket` receives [black coating](02-interior-shell.md#black-coated-metal). Planned full textile owner is the absent `src/materials/furnishings/textiles.ts`; textile/object realization and current GPU judgment remain unverified. Review tests transmission while curtains remain distinct from glass/towels/white tile.

[Nightstand](../models/13-bedrooms.md#nightstand-lamp) `lamp-shade` and [pendant](../models/17-light-fixtures.md#pendant-fixtures) `fixture-shade` reuse bright textile appearance while structural parts remain metal. Current fixed pendant `fixtureShade` in `src/materials/furnishings/fixtures.ts` has the matching bright color/roughness and double-sided response without curtain transmission; its source does not implement the whole towel/curtain family.

Surface plan: towels use 0.01 m pile, thin curtains 0.02 m transmissive weave, separately per partition. Set U width/V hanging direction from lower-left, breaking at sewing ends/window-frame boundaries. Full grain/source and current close/review-distance GPU acceptance remain unverified.

## Mirrors {#mirror}
<!--
@evidence models/14-bathrooms.md#wall-mirror The actual 0.01 m panel front receives planar scene reflection while its 0.02 m-wide frame remains black coating.
@evidence principles/core/common.md#declared-basis powder's vanity mirror grounds #EDEDED/roughness 0.02 under the common authored-color convention.
@evidence principles/core/common.md#scope-preservation Response binds existing mirror faces without changing panel/frame geometry.
@evidence principles/core/common.md#substantive-completion Color/linear optics, mirror/frame assignments, current source/Reflector boundary, and falsifying views are defined.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Mirror identity gains numeric silver response and explicit planar reflection semantics.
@evidence principles/design/materials.md#material-construction-appearance Silver-backed glass is approximated as a metallic reflective surface rather than photographic image content.
@evidence principles/design/materials.md#material-binding-interface mirror faces retain the actual front-plane normal/coordinates; mirror-frame receives black coating.
@evidence principles/design/materials.md#material-verification-address Bathroom views must show the room reflected without obscuring the inspection target; a gray flat panel fails.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work The powder mirror identity and actual wall-mirror plane suffice for reflection binding without a new panel or camera-placement geometry.
@evidence contracts/texture-readability.md#material-texture-readability Intentional smoothness requires roughness 0.02/silver response and actual planar reflection, ending at the frame.
@evidence settings/10-house.md#powder The vanity mirror retains its bathroom role rather than a gray surrogate panel.
@evidence spaces/rooms/powder.md#powder-fixture-use The existing vanity mirror interface receives silver response without changing fixture occupancy.
-->

The [vanity mirror](../settings/10-house.md#powder) is silver-backed glass. Appearance approximates silver reflection as `#EDEDED` (linear 0.847, 0.847, 0.847), roughness 0.02, metallic 1.0, transmission 0.0. Bind [wall-mirror](../models/14-bathrooms.md#wall-mirror) `mirror`; `mirror-frame` receives [black coating](02-interior-shell.md#black-coated-metal). Current finish owner is `src/materials/furnishings/sanitary.ts`, declaring `mirrorSilver`. Bathroom views test the reflected room without losing the inspection target.

Surface plan: intentionally smooth, unpatterned silver response must read through actual reflection, ending at the frame. A flat gray panel fails. Native `src/viewer/scene.mts` realizes the front with the installed three.js `Reflector`, rendering the same scene's actual geometry/materials/global lights through a virtual reflection camera. It substitutes no photograph/static reflection texture. Target size is 512×512, using the first real front normal/coordinates and retaining panel backs/edges in the producer mesh. Further mirror-to-mirror reflections depend on the installed Reflector's current visibility behavior, not an unbounded recursion claim. Current close/review-distance GPU judgment remains unverified in this translation.

## Black firebox {#firebox-black}
<!--
@evidence models/11-living.md#fireplace-insert-mantel Existing firebox/firebox-trim receives nonemissive refractory appearance while mantel wood and spaces-owned brick remain separate.
@evidence principles/core/common.md#declared-basis living's unlit black firebox grounds #1F1F20/roughness 0.90 under the authored-color rule.
@evidence principles/core/common.md#scope-preservation Response covers firebox/firebox-trim only; brick body stays with the left space owner.
@evidence principles/core/common.md#substantive-completion Numeric nonemissive response, exact roles, 0.10 m soot plan, current source, and view 04 distinction are specified.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Unlit-firebox identity gains bounded response and explicit insert-face bindings.
@evidence principles/design/materials.md#material-construction-appearance Sooted refractory appearance remains an authored proxy for the existing insert plates, not a new brick construction or combustion claim.
@evidence principles/design/materials.md#material-binding-interface firebox/firebox-trim retain local horizontal U/height V and actual opening/mantel boundaries.
@evidence principles/design/materials.md#material-verification-address View 04 must distinguish black insert from brick body and wooden mantel without painted firelight.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Living's unlit state and existing insert/brick/mantel interfaces suffice for appearance without changed fireplace geometry.
@evidence contracts/texture-readability.md#material-texture-readability Planned 0.10 m weak soot/rough grain starts lower-left and ends at actual brick/mantel boundaries without emission.
@evidence settings/10-house.md#living The unlit static fireplace retains separate black/brick/wood identities without combustion performance.
@evidence spaces/rooms/living.md#living-furniture-use Its later firebox material handoff receives black response without altering the reserved fireplace body or routes.
-->

The [black living firebox](../settings/10-house.md#living) has an authored sooted refractory-brick appearance without expressed mortar joints. The existing [insert prototype](../models/11-living.md#fireplace-insert-mantel) is made of metal plates; refractory appearance is a visual proxy and does not claim those plates became physical brick. Response is `#1F1F20` (linear 0.014, 0.014, 0.014), roughness 0.90, metallic 0.0, transmission 0.0, without emission in the static unlit state.

Bind `firebox`/`firebox-trim`. The [left fireplace space owner](../spaces/envelope/left.md#chimney-roof-interface) retains body/opening sides and [red-brown brick](01-exterior.md#brick-red-brown); `mantel` receives [honey wood](#furniture-wood). Source owner is `src/materials/furnishings/fixtures.ts`; view 04 tests the three material identities. Surface plan: weak soot/rough grain repeats at 0.10 m from insert inner lower-left, U horizontal/V height, ending at brick/mantel boundaries without painting firelight. Current source uses constant response without that map; grain/current close/review-distance GPU acceptance remains unverified.

## Planting bark and foliage {#planting-bark-foliage}
<!--
@evidence models/16-planting.md#site-shrub-prototype Planned leaf response covers one central/eight branch-tip clusters, with separate bark on eight branches and no added individual leaves.
@evidence models/16-planting.md#site-tree-prototypes Planned bark/foliage separates the 8.00 m/6.00 m tree prototypes, consuming their actual metric coordinate interfaces.
@evidence principles/core/common.md#declared-basis Reference 01's canopy and site-identity's mature trees/shrubs ground authored bark/foliage colors and grain.
@evidence principles/core/common.md#scope-preservation Planned bark/foliage and small-plant stem/foliage faces receive response without changing branches/clusters or placement.
@evidence principles/core/common.md#substantive-completion Bark #675746/roughness 0.92, leaves #617343/0.88, metric modules/UVs, source plan, and silhouette observations are defined.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Planting volumes gain distinct bark/foliage response and physical grain without changed branch/cluster counts.
@evidence principles/design/materials.md#material-construction-appearance Planned bark fissures/leaf-cluster flecks are appearance at 0.08/0.025 m, not new individual-leaf geometry.
@evidence principles/design/materials.md#material-binding-interface bark/stem receives bark and foliage receives leaf response, breaking at actual branches/clusters.
@evidence principles/design/materials.md#material-verification-address Site 01 and bird's-eye 02 test foliage reading as more than flat color blocks.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Site identity and declared planting face/coordinate interfaces suffice for appearance plans without changing the space graph or prototypes.
@evidence contracts/texture-readability.md#material-texture-readability Planned bark uses branch length U/perimeter V at 0.08 m; foliage uses each cluster's local tangent U/V at 0.025 m.
@evidence obligations/design/materials.md#material-surface-assignment Three declared bark/stem/foliage roles receive explicit finish plans without claiming active source bindings.
-->

[Tree prototypes](../models/16-planting.md#site-tree-prototypes) `bark` and indoor-small-plant `stem` are planned as `#675746`, roughness 0.92, metallic 0, transmission 0; outdoor/indoor `foliage` as `#617343`, roughness 0.88, metallic 0, transmission 0. Bark's dark vertical fissures/light sides repeat at 0.08 m; leaf-cluster flecks at 0.025 m. Read branch length U/perimeter V and each leaf cluster's local tangent U/V in meters, breaking at branch contacts/clusters from prototype-local origins. These are appearances for the existing clustered representation, not species or individual-leaf claims.

Planned source owner `src/materials/exterior/planting.ts` does not currently exist; actual maps/bindings and current GPU readability remain unverified. Site 01 and bird's-eye 02 reject flat-color foliage blocks while preserving the original cluster geometry.

## Light-fixture diffusers {#light-fixture-surfaces}
<!--
@evidence models/17-light-fixtures.md#flush-ceiling-fixture Existing 0.012 m fixture-diffuser receives milky transmission while housing remains black coating.
@evidence models/17-light-fixtures.md#pendant-fixtures Diffuser/shade remains separate from metallic canopy/stem without transferring transmission to the supports.
@evidence models/17-light-fixtures.md#vanity-wall-fixture Existing diffuser bar receives milky response separately from black housing/supports.
@evidence models/17-light-fixtures.md#porch-wall-sconce fixture-glass receives clear response instead of the milky diffuser; housing/stem remains coated metal.
@evidence principles/core/common.md#declared-basis The systems interior-fixture allocation and model fixture bodies supply visible diffuser/glass roles, not material-owned light placement.
@evidence principles/core/common.md#scope-preservation This unit owns diffuser/glass/shade appearance; systems/instances retains intensity/temperature/placement.
@evidence principles/core/common.md#substantive-completion Diffuser #F4F1E9/roughness 0.36/transmission 0.35 and porch glass 0.06/0.78/ior 1.50, roles/UVs/source, and tests are specified.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Fixture bodies gain explicit diffuser/glass optics while existing housing/canopy/stem reuses coating.
@evidence principles/design/materials.md#material-construction-appearance Polycarbonate diffuser and clear porch glass retain different construction/optics without painted light bloom.
@evidence principles/design/materials.md#material-binding-interface diffuser/glass binds actual member-local coordinates; shades/supports retain separate finishes.
@evidence principles/design/materials.md#material-verification-address Common-area 03/porch 01 must show fixture boundaries separately from light pools.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Existing fixture ids/dimensions and lighting allocation suffice for surface response without revising location, geometry, or light intensity.
@evidence contracts/texture-readability.md#material-texture-readability Smooth unpatterned surfaces must read through actual reflection/transmission and member thickness using metric local UVs.
@evidence obligations/design/materials.md#material-surface-assignment Diffuser/glass roles receive distinct optical finishes, with housing/shade delegated to existing owners.
-->

The [fixture](../models/17-light-fixtures.md#flush-ceiling-fixture) `fixture-diffuser` is polycarbonate `#F4F1E9`, roughness 0.36, metallic 0, transmission 0.35. [Porch sconce](../models/17-light-fixtures.md#porch-wall-sconce) `fixture-glass` shares that tint as glass, roughness 0.06, metallic 0, transmission 0.78, ior 1.50. These deliberately scoped transmissive surfaces are exceptions to the general clear-window convention. Both are unpatterned but must read through actual reflection/transmission and their separate thick-member boundaries. Light intensity/temperature/shadows remain [systems-owned](../systems/00-lighting-frame.md#lighting-authority), without image-painted bloom.

`fixture-housing`, `fixture-canopy`, `fixture-stem` receive [black coating](02-interior-shell.md#black-coated-metal); `fixture-shade` receives the [bright textile appearance](#towel-curtain-textile). [Pendant](../models/17-light-fixtures.md#pendant-fixtures) canopy/shade and [porch sconce](../models/17-light-fixtures.md#porch-wall-sconce) glass/stem are distinct actual prototype members, consumed as interfaces rather than recreated here. Source owner is `src/materials/furnishings/fixtures.ts`. Planar UVs are local metric coordinates. Common-area 03 and porch 01 compare fixture boundaries with the actual light pools; current close/review-distance GPU acceptance remains unverified.

## Food and framed print surfaces {#food-art-finishes}
<!--
@evidence models/18-house-props.md#kitchen-food-utensils Planned fruit color leaves cutting-board/utensil/container/bowl assigned separately to wood/metal/glass/ceramic.
@evidence models/19-room-accents.md#wall-art-indoor-plant Planned art-print color leaves frame/container/stem/foliage with their separate finishes.
@evidence principles/core/common.md#declared-basis Reference 03's fruit bowl and 02–05 wall art ground authored food/print appearance rather than copied photographs.
@evidence principles/core/common.md#scope-preservation Only fruit/print appearance is owned here; bowls/frame/furniture geometry remains prototypes.
@evidence principles/core/common.md#substantive-completion Five fruits' three-color rule, physical fleck/stroke modules, integer seed 1952, source plan, and falsifying observations are specified.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Stable fruit/art-print roles gain numeric color/pattern decisions without changed count, positions, or image dimensions.
@evidence principles/design/materials.md#material-construction-appearance Low-gloss fruit skin and paper print retain different constructions rather than identical paint.
@evidence principles/design/materials.md#material-binding-interface Fruit index selects its palette; art-print uses actual local metric U/V and ends at its frame.
@evidence principles/design/materials.md#material-verification-address Common-area fruit and 04/05 art must distinguish themselves from empty tops/white walls.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Existing prop counts and top/wall face interfaces suffice for appearance planning without changed prototypes or placements.
@evidence contracts/texture-readability.md#material-texture-readability Planned fruit flecks 0.008 m and print strokes 0.05 m use actual metric UVs, ending at each fruit/print edge.
@evidence obligations/design/materials.md#material-surface-assignment Fruit/art-print receives explicit material plans without claiming their active source exists.
-->

For [five fruits](../models/18-house-props.md#kitchen-food-utensils) `fruit`, index i = 0…4 uses olive `#859344` when i mod 3 = 0, gold `#C9A449` at 1, red `#9C5549` at 2; roughness 0.62, metallic 0, transmission 0. Skin flecks repeat at 0.008 m. [Wall art](../models/19-room-accents.md#wall-art-indoor-plant) `art-print` uses paper `#ECE8DF`, roughness 0.90, metallic 0, with thin blue-gray/olive strokes at physical spacing 0.05 m from local UVs/integer seed 1952. Precise stroke equations/arrays remain the future deterministic material-source function's responsibility; they are not an opaque photograph transcription. `art-frame` receives [dark wood](#dark-bookcase-wood).

Planned source owner `src/materials/furnishings/accents.ts` does not currently exist. Print/fruit-source realization and current GPU judgment remain unverified. Review compares common-area 03 fruit and 04/05 wall art with the host tops/walls.

## Remaining prop partitions {#minor-prop-partitions}
<!--
@evidence models/12-service-rooms.md#garage-tool-board Board, metal tool bodies, grips, and bins retain distinct planned appearances; painted peg holes cannot replace the board's actual geometry.
@evidence models/12-service-rooms.md#pantry-containers Clear containers and wooden lids/baskets/boxes follow their actual variant members instead of one indiscriminate container color.
@evidence models/14-bathrooms.md#shower-niche-bottles White containers and black lids remain separate from the niche's tiled host faces.
@evidence models/18-house-props.md#porch-mat-planter Rug field/border, ceramic container, and plant stem/foliage retain separate owners rather than copying porch paving.
@evidence models/19-room-accents.md#living-tabletop-props Books, tray, container, and plant members receive their respective finishes without recoloring the host tabletop.
@evidence principles/core/common.md#declared-basis Linked prototype member names provide the partition interfaces, rather than invented placement or articulation identities.
@evidence principles/core/common.md#scope-preservation The table allocates surface appearances only; prototype geometry and instance placement remain their existing owners.
@evidence principles/core/common.md#substantive-completion Every listed prop role has an explicit finish owner; unresolved tool-grip design disagreement and unbuilt bindings remain visible limitations.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Small-prop roles gain material ownership while their existing models and host relationships remain intact.
@evidence principles/design/materials.md#material-construction-appearance Wood, metal, textile, glass, ceramic, and foliage remain distinct according to the actual member construction.
@evidence principles/design/materials.md#material-binding-interface Each listed model/part pair resolves through the linked finish's UV axes, origin, physical repeat, and edge rules.
@evidence principles/design/materials.md#material-verification-address Common-area, bedroom, service-room, bathroom, and porch observations must reveal the listed partitions at close and review distances.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Existing prototype partitions suffice for this allocation; documenting their appearances does not require resizing, remodeling, or relocating them.
@evidence contracts/texture-readability.md#material-texture-readability Linked finish rules preserve metric UVs and member seams; an articulation node or placement id cannot substitute for a surface interface.
@evidence obligations/design/materials.md#material-surface-assignment Each listed material id retains one authored finish unit; the table is a design allocation, not proof of implemented bindings or GPU acceptance.
-->

| Prototype | Member | Planned material owner |
| --- | --- | --- |
| [Coat-closet leaves](../models/05-closet-fittings.md#coat-closet-doors) | `leaf`, `leaf-panel` | [Interior trim white](02-interior-shell.md#interior-trim-white) |
| [Coat rod and shelf](../models/05-closet-fittings.md#coat-closet-rod-shelf) | `shelf` | [Interior trim white](02-interior-shell.md#interior-trim-white) |
| [Linen closet](../models/05-closet-fittings.md#linen-closet-fittings) | `leaf`, `leaf-panel`, `shelf` | [Interior trim white](02-interior-shell.md#interior-trim-white) |
| [Sliding closet](../models/13-bedrooms.md#sliding-closet) | `carcass`, `leaf`, `shelf` | [Interior trim white](02-interior-shell.md#interior-trim-white) |
| [Wardrobe hanging](../models/13-bedrooms.md#wardrobe-hanging) | `carcass`, `shelf` | [Interior trim white](02-interior-shell.md#interior-trim-white) |
| [Wardrobe shelves](../models/13-bedrooms.md#wardrobe-shelves) | `carcass`, `shelf` | [Interior trim white](02-interior-shell.md#interior-trim-white) |
| [Coat rod](../models/05-closet-fittings.md#coat-closet-rod-shelf) | `rod` | [Stainless steel](#stainless-steel) |
| [Linen closet](../models/05-closet-fittings.md#linen-closet-fittings) | `rail` | [Stainless steel](#stainless-steel) |
| [Sliding closet](../models/13-bedrooms.md#sliding-closet) | `rail`, `rod` | [Stainless steel](#stainless-steel) |
| [Wardrobe hanging](../models/13-bedrooms.md#wardrobe-hanging) | `rod` | [Stainless steel](#stainless-steel) |
| [Coat-closet leaves](../models/05-closet-fittings.md#coat-closet-doors), [linen closet](../models/05-closet-fittings.md#linen-closet-fittings), [sliding closet](../models/13-bedrooms.md#sliding-closet) | `handle` | [Black coated metal](02-interior-shell.md#black-coated-metal) |
| [Sliding closet](../models/13-bedrooms.md#sliding-closet), [wardrobe hanging](../models/13-bedrooms.md#wardrobe-hanging), [mudroom hooks](../models/12-service-rooms.md#mudroom-coat-hooks) | Each prototype's `clothes` | Index-based [gray-beige upholstery](#grey-beige-upholstery), [blue-gray bedding](#blue-grey-bedding), [olive bedding](#olive-bedding) |
| [Pantry containers](../models/12-service-rooms.md#pantry-containers) | `container`; `lid`, `basket`, `box` | [Clear glass](01-exterior.md#glass-clear); [furniture wood](#furniture-wood) |
| [Mudroom hooks](../models/12-service-rooms.md#mudroom-coat-hooks) | `board`; `hook` | [Furniture wood](#furniture-wood); [black coated metal](02-interior-shell.md#black-coated-metal) |
| [Garage shelving](../models/12-service-rooms.md#garage-shelving) | `bin` | [Black coated metal](02-interior-shell.md#black-coated-metal) |
| [Garage tool board](../models/12-service-rooms.md#garage-tool-board) | `bin`, `tool-grip`; `board`; `tool-steel` | [Black coated metal](02-interior-shell.md#black-coated-metal); [furniture wood](#furniture-wood); [stainless steel](#stainless-steel) |
| [Child desk](../models/13-bedrooms.md#child-desk) | `book`; `container`; `pencil` | [Bedding palette cycle](#olive-bedding); [white enamel](#white-enamel); [furniture wood](#furniture-wood) |
| [Wardrobe shelves](../models/13-bedrooms.md#wardrobe-shelves) | `basket` | [Furniture wood](#furniture-wood) |
| [Bath floor mats](../models/14-bathrooms.md#bath-floor-mats) | `field`, `border` | [Muted rug](#muted-rug), including its delegated border finish |
| [Shower niche bottles](../models/14-bathrooms.md#shower-niche-bottles) | `container`; `lid` | [White enamel](#white-enamel); [black coated metal](02-interior-shell.md#black-coated-metal) |
| [Nightstand lamp](../models/13-bedrooms.md#nightstand-lamp) | `lamp-base`; `lamp-shade` | [White enamel](#white-enamel); [towel/curtain textile](#towel-curtain-textile) |
| [Porch mat and planter](../models/18-house-props.md#porch-mat-planter) | `field`, `border`; `container`; `stem`, `foliage` | [Muted rug](#muted-rug); [white enamel](#white-enamel); [planting](#planting-bark-foliage) |
| [Kitchen food and utensils](../models/18-house-props.md#kitchen-food-utensils) | `cutting-board`; `utensil`; `container`; `bowl`; `fruit` | [Furniture wood](#furniture-wood); [stainless steel](#stainless-steel); [clear glass](01-exterior.md#glass-clear); [white enamel](#white-enamel); [food finishes](#food-art-finishes) |
| [Folded linen towels](../models/18-house-props.md#linen-folded-towels) | `folded` | [Towel textile](#towel-curtain-textile) |
| [Sofa throws](../models/19-room-accents.md#sofa-throws) | `pillow`, `folded` | Instance-specific [gray-beige upholstery](#grey-beige-upholstery) or [towel textile](#towel-curtain-textile) |
| [Living tabletop props](../models/19-room-accents.md#living-tabletop-props) | `book`, `tray`; `container`; `stem`, `foliage` | [Bedding palette](#olive-bedding) and [furniture wood](#furniture-wood); [white enamel](#white-enamel); [planting](#planting-bark-foliage) |
| [Wall art and indoor plant](../models/19-room-accents.md#wall-art-indoor-plant) | `art-frame`; `art-print`; `container`; `stem`, `foliage` | [Dark wood](#dark-bookcase-wood); [print finishes](#food-art-finishes); [white enamel](#white-enamel); [planting](#planting-bark-foliage) |
| [Flush ceiling fixture](../models/17-light-fixtures.md#flush-ceiling-fixture) | `fixture-housing`; `fixture-diffuser` | [Black coated metal](02-interior-shell.md#black-coated-metal); [light-fixture diffuser](#light-fixture-surfaces) |
| [Pendant fixtures](../models/17-light-fixtures.md#pendant-fixtures) | `fixture-canopy`, `fixture-stem`; `fixture-shade`; `fixture-diffuser` | [Black coated metal](02-interior-shell.md#black-coated-metal); [bright textile](#towel-curtain-textile); [light-fixture diffuser](#light-fixture-surfaces) |
| [Vanity wall fixture](../models/17-light-fixtures.md#vanity-wall-fixture) | `fixture-housing`; `fixture-diffuser` | [Black coated metal](02-interior-shell.md#black-coated-metal); [light-fixture diffuser](#light-fixture-surfaces) |
| [Porch wall sconce](../models/17-light-fixtures.md#porch-wall-sconce) | `fixture-housing`, `fixture-stem`; `fixture-glass` | [Black coated metal](02-interior-shell.md#black-coated-metal); [light-fixture glass](#light-fixture-surfaces) |

This is a design allocation. `board`, `tool-grip`, and `tool-steel` belong to the garage-tool-board prototype; canopy/shade/stem to the pendant prototype; glass and its separate stem to the porch-sconce prototype. Actual fixed-member bindings are owned by `src/materials/model-bindings.ts`; the table's unbuilt prop bindings and current GPU readability remain unverified. Every linked finish owns UV axes, origin, physical repeat, and member-end cuts. Articulation-node and placement ids are not material interfaces.

The inherited design has an unresolved `tool-grip` disagreement: the [furniture-wood](#furniture-wood) unit assigns wood, whereas this partition table assigns black coating. No active grip binding resolves that disagreement, so this translation preserves it explicitly rather than choosing a new design. The mudroom shoe uses the black coating's dark matte parameters; wardrobe shoe boxes use the furniture wood's warm-brown appearance on every volumetric face. These remain planned prop allocations rather than implemented-source claims.

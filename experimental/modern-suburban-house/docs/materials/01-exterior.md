# Exterior materials

## Warm-white lap siding {#siding-warm-white}
<!--
@evidence models/15-outdoor.md#lap-siding-board Coating binds to the board's 0.15 m exposed courses and real overlap/end faces without substituting a pattern for physical lap geometry.
@evidence principles/core/common.md#declared-basis #EDE8DC and roughness 0.55 are authored interpretations of visual-grammar under the common color rule, not photographic samples.
@evidence principles/core/common.md#scope-preservation Finish binds to siding boards over the four elevation owners; boundaries/count/thickness remain host geometry.
@evidence principles/core/common.md#substantive-completion Color/linear RGB, optical constants, five siding partitions, source owner, physical grain plan, and falsifying views are specified.
@evidence principles/core/inherited-units.md#derived-parent-differentiation visual-grammar's warm-white relationship gains numeric response and siding-face/butt/back/top/cut bindings.
@evidence principles/design/materials.md#material-construction-appearance Factory-painted fiber-cement construction is distinct from the coating's averaged color/gloss and planned grain.
@evidence principles/design/materials.md#material-binding-interface Five siding ids consume host axes/seams and the common normal/sidedness convention.
@evidence principles/design/materials.md#material-verification-address Exterior 01 and 2 m wall views can falsify trim/siding distinction or irregular color patches; the neutral plate compares the swatch.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work The palette and current lap-board prototype supply coating roles, overlap, and metric coordinates. The earlier corner-trim addition belongs to model repair rather than a new siding-material parent correction.
@evidence contracts/texture-readability.md#material-texture-readability Planned deterministic coating grain repeats at 0.15 m exposed height using exterior-owner UVs and matching corner course levels.
@evidence obligations/design/materials.md#material-identity-assembly Painted fiber-cement boards and their five face roles identify the siding assembly without recreating board geometry.
@evidence settings/20-verification.md#visual-grammar Warm-white horizontal courses remain lighter than charcoal and distinct from white trim.
@evidence spaces/envelope/front.md#front-openings The front owner supplies the exterior wall/window interfaces; siding excludes its existing voids and trim.
@evidence spaces/envelope/left.md#left-openings Left window/chimney interfaces delimit the same siding finish without another opening layout.
@evidence spaces/envelope/rear.md#rear-openings Rear windows and garden-door interfaces delimit the finish without another wall or void.
@evidence spaces/envelope/right.md#right-openings Exposed right/garage faces receive siding while the shared-wall and real opening boundaries remain host-owned.
-->

This is the [warm-white horizontal lap siding](../settings/20-verification.md#visual-grammar). Construction is factory-painted fiber-cement boards. Course exposure and overlap shadows come from the [lap-board section](../models/15-outdoor.md#lap-siding-board) and repeated instances. Appearance approximates the coating's color/gloss: `#EDE8DC` (linear 0.847, 0.807, 0.716), roughness 0.55, metallic 0.0, transmission 0.0. It is warmer/darker than trim `#F6F4EE`, keeping [white trim](#trim-white) distinct from the wall.

Bind `siding-face`, `siding-butt`, `siding-back`, `siding-top`, and `siding-cut`. Their hosts are the exterior walls above the plinth, gable triangles, and garage exterior of the [front](../spaces/envelope/front.md#front-openings), [rear](../spaces/envelope/rear.md#rear-openings), [left](../spaces/envelope/left.md#left-openings), and [right](../spaces/envelope/right.md#right-openings) elevation owners. Exclude window/door voids and trim members. Source owner is `src/materials/exterior/siding.ts`. Review uses [material samples](00-material-frame.md#material-review-set), exterior 01 and a wall view at 2 m, checking brightness distinction and absence of color patches within an elevation.

Surface plan: deterministic color/roughness coating grain on `siding-face` consumes [exterior UVs and cuts](../spaces/03-surface-owners.md#exterior-surface-handoff), repeating at each 0.15 m exposed V height and matching course levels around corners. Current source registers `siding.png`; the complete texture-response plan and close/review-distance GPU judgment remain unverified under the [implementation limits](00-material-frame.md#material-texture-response).

## White exterior trim {#trim-white}
<!--
@evidence models/15-outdoor.md#exterior-corner-trim White coating covers the closed L-corner trim and its backs/cuts without adding volume at the fold.
@evidence models/01-windows.md#window-sill-trim Four outer boards project 0.035 m weatherward; finish ends at each real board cut and consumes meter length/width UVs.
@evidence principles/core/common.md#declared-basis #F6F4EE/roughness 0.35 interprets visual-grammar's white trim under the common authored-color convention.
@evidence principles/core/common.md#scope-preservation Finish covers corner/window/door trim, roof soffit/fascia, and porch members while geometry remains their owners'.
@evidence principles/core/common.md#substantive-completion Numeric coating response, compatible trim/jamb/threshold faces, source owner, grain module, and soffit/column observations are defined.
@evidence principles/core/inherited-units.md#derived-parent-differentiation White-trim identity gains #F6F4EE, roughness 0.35, and explicit model/space bindings.
@evidence principles/design/materials.md#material-construction-appearance Painted PVC/wood boards retain construction thickness while semi-gloss values approximate their coating.
@evidence principles/design/materials.md#material-binding-interface exterior-trim/jamb and named threshold/soffit/fascia/porch faces retain host UVs and the common sidedness rule.
@evidence principles/design/materials.md#material-verification-address Afternoon soffit/column views can falsify fully black undersides or inconsistent coating across a column's four sides.
@evidence upstream/design/materials.md#parent-revision-from-material-work The earlier binding comparison exposed a missing closed corner-trim prototype. exterior-corner-trim added that model owner and exterior-boundary-junctions separated structural corners from trim before binding; this translation changes neither geometry nor palette.
@evidence contracts/texture-readability.md#material-texture-readability Planned 0.10 m coating grain consumes each roof/porch/threshold owner's UVs and each model trim's own coordinates.
@evidence settings/20-verification.md#visual-grammar Real projection/shadow plus white coating explains trim junctions instead of merging siding and trim.
@evidence spaces/porch.md#porch-roof-columns The existing three columns, beams, bases/capitals, and roof underside receive trim response without a second porch member.
-->

Window/door casing, corner boards, eave fascia/soffits, and porch columns/beams use semi-gloss-painted PVC/wood trim. Appearance is `#F6F4EE` (linear 0.922, 0.905, 0.855), roughness 0.35, metallic 0.0, transmission 0.0. Its highlights are intended to be narrower than siding's roughness 0.55, supporting [junction readability through projection and shade](../settings/20-verification.md#visual-grammar).

Bindings are [corner trim](../models/15-outdoor.md#exterior-corner-trim) and [window outer boards](../models/01-windows.md#window-sill-trim) `exterior-trim`; [front](../models/02-exterior-doors.md#front-entry-door)/[garden doors](../models/02-exterior-doors.md#garden-door-pair) `exterior-trim` and `jamb`; [garage door](../models/02-exterior-doors.md#garage-sectional-door) `exterior-trim`; [threshold plates](../spaces/10-ground-floor.md#ground-threshold-junctions) `front-door-threshold` and `garden-door-threshold`; roof-owner soffit/fascia; and [porch columns/beams/bases](../spaces/porch.md#porch-roof-columns). Elevation owners create structural corners/continuous weather faces without duplicating closed L-trim. Source owner is `src/materials/exterior/trim.ts`; review tests afternoon soffit visibility and consistent material on all four column faces.

Surface plan: coating micrograin repeats at 0.10 m. The soffits of [main front](../spaces/roof/main-front.md#main-front-roof), [main back](../spaces/roof/main-back.md#main-back-roof), [front-gable left](../spaces/roof/front-gable-left.md#front-gable-left-roof), [front-gable right](../spaces/roof/front-gable-right.md#front-gable-right-roof), [right front](../spaces/roof/right-front.md#right-front-roof), [right back](../spaces/roof/right-back.md#right-back-roof), [garage front](../spaces/roof/garage-front.md#garage-front-roof), and [garage back](../spaces/roof/garage-back.md#garage-back-roof), [porch members](../spaces/porch.md#porch-roof-columns), and [front](../spaces/envelope/front.md#front-entry-filling)/[rear](../spaces/envelope/rear.md#garden-door) thresholds consume their space-owner axes/origins/seams. Model trim consumes its model UVs. `exterior-trim.png` is registered; complete grain response/current close/review-distance GPU acceptance remains unverified.

## Dark asphalt shingles {#roof-shingle}
<!--
@evidence models/15-outdoor.md#asphalt-shingle-strip Current 1.00×0.30 m strips have three 0.330 m tabs, real grooves, and 0.14 m exposure; granule grain binds without inventing more tabs or replacing overlap geometry.
@evidence principles/core/common.md#declared-basis #3A3C3E/roughness 0.90 is an authored visual-grammar interpretation under the common color rule.
@evidence principles/core/common.md#scope-preservation Finish binds roof/porch weather faces and existing shingle partitions; slope outlines/overlap geometry remain host-owned.
@evidence principles/core/common.md#substantive-completion Color/linear values, roughness/metallicity/transmission, four shingle ids, source, module, and roof-view test are specified.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Dark regular shingles gain #3A3C3E, roughness 0.90, and weather-face bindings beyond the verbal palette.
@evidence principles/design/materials.md#material-construction-appearance Mineral-coated asphalt construction is distinct from averaged color/roughness and planned granule response.
@evidence principles/design/materials.md#material-binding-interface The four shingle ids and space weather faces receive host slope coordinates; soffit/fascia retain white trim.
@evidence principles/design/materials.md#material-verification-address Elevated roof views can falsify inconsistent slopes or broken finish at valleys; neutral samples compare the swatch.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Current strip dimensions, tab cuts, and shared slope coordinates suffice for the 0.330/0.14 m repeat plan without a new roof or model revision.
@evidence contracts/texture-readability.md#material-texture-readability Granule color/roughness uses host slope UVs and tab/course modules, ending at real valleys/ridges/chimney cuts.
@evidence settings/20-verification.md#visual-grammar Small regular dark overlap remains the roof identity rather than irregular color patches.
-->

The roof uses [small regular dark asphalt shingles](../settings/20-verification.md#visual-grammar), built as mineral-coated asphalt. Roof-owner and instance strip geometry makes overlap; appearance averages the granules as `#3A3C3E` (linear 0.042, 0.045, 0.048), roughness 0.90, metallic 0.0, transmission 0.0. Bind weather faces of the eight roof slopes and porch; soffits/fascia receive [white trim](#trim-white). Source owner is `src/materials/exterior/shingle.ts`. Elevated roof views test consistent response among slopes and continuity at valleys.

The prototype's `shingle-face`, `shingle-butt`, `shingle-back`, and `shingle-cut` share the finish, with seams broken at tab cuts and row ends. Surface plan: deterministic granule roughness/subtle color variation consumes [slope UVs and cuts](../spaces/roof/00-junctions.md#roof-shared-edges), with U tab width 0.330 m and V course exposure 0.14 m. Eaves share V contours; pattern ends at actual valley/ridge/chimney cuts. Current `shingle.png` is registered at a 0.66×0.28 m repeat. Complete roughness response and current close/review-distance GPU judgment remain unverified.

## Red-brown brick {#brick-red-brown}
<!--
@evidence principles/core/common.md#declared-basis #8A4A3A/roughness 0.85 interprets visual-grammar rather than photograph pixels.
@evidence principles/core/common.md#scope-preservation Finish covers exposed plinth/chimney/fireplace faces; mortar is an internal UV mask without another mesh or instance.
@evidence principles/core/common.md#substantive-completion Brick/mortar optical values, 0.20×0.065 m module, 0.01 m joint, 0.002 m normal plan, bindings, source, and observation are defined.
@evidence principles/core/inherited-units.md#derived-parent-differentiation The brick identity gains numeric response, staggered-joint equations, and concrete host bindings.
@evidence principles/design/materials.md#material-construction-appearance Fired clay and cement mortar are construction; color/roughness/normal masks approximate their exposed response without displacement.
@evidence principles/design/materials.md#material-binding-interface Existing brick faces consume owner UVs; mortar shares the final material rather than adding a grout face id.
@evidence principles/design/materials.md#material-verification-address Exterior 01 and close views can falsify inconsistent plinth/chimney brick or mortar crossing openings.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work The left owner's chimney/fireplace faces and shared exterior UVs supply the staggered-mask interface without changing chimney construction.
@evidence contracts/texture-readability.md#material-texture-readability Brick/mortar response uses metric owner UVs, 0.20×0.065 m repeats, 0.01 m joints, and 0.10 m odd-row offset.
@evidence obligations/design/materials.md#material-identity-assembly Fired clay #8A4A3A and cement mortar #BDB5A8 are separate construction responses within the same finish.
@evidence spaces/envelope/left.md#chimney-roof-interface Existing chimney/fireplace bodies receive brick while their cap remains charcoal; no separate material geometry recreates the shaft.
-->

Plinths, chimney, and fireplace use fired clay brick with cement mortar. Brick appearance is `#8A4A3A` (linear 0.254, 0.068, 0.042), roughness 0.85, metallic 0.0, transmission 0.0. Mortar is `#BDB5A8` (linear 0.509, 0.462, 0.392), roughness 0.92. Joints occupy 0.01 m edges within a joint-inclusive 0.20×0.065 m UV module. Even rows start at U=0, odd rows at U=0.10 m. The intended 0.002 m recessed normal response changes no mesh position; no separate recessed geometry, face id, or instance is required.

Bind exposed vertical plinth faces, the [chimney shaft](../spaces/envelope/left.md#chimney-roof-interface), and living-room fireplace body. The cap receives [charcoal metal](#window-frame-charcoal). Source owner is `src/materials/exterior/brick.ts`; exterior 01 tests consistent plinth/chimney identity and joints staying outside window/door voids.

Surface plan consumes [exterior UVs/cuts](../spaces/03-surface-owners.md#exterior-surface-handoff) for plinth/chimney and each separate fireplace model's UVs. Horizontal joint heights match around corners. Set `modE(x,m)=x−m floor(x/m)`, row `r=floor(V/0.065)`, and `U′=U+0.10×modE(r,2)`. With `dU=min(modE(U′,0.20),0.20−modE(U′,0.20))` and `dV=min(modE(V,0.065),0.065−modE(V,0.065))` m, either distance below 0.005 m denotes a joint of combined width 0.01 m across the boundary. Across those 0.005 m halves, use the planned 0.002 m normal slope without displacement. Current `brick.png` is registered, but roughness/normal-mask realization and current close/review-distance GPU acceptance remain unverified.

## Charcoal frames, chimney cap, and roof flashing {#window-frame-charcoal}
<!--
@evidence models/15-outdoor.md#eave-gutter-downspout Charcoal coating covers open gutter inner/outer faces and the closed downspout section without capping the gutter opening.
@evidence models/02-exterior-doors.md#garden-door-pair Garden leaf-exterior/interior/edge and sash receive charcoal while glass and white casing remain separate.
@evidence models/01-windows.md#window-member-sizes Existing frame 0.06 m, sash 0.05 m, and mullion 0.08 m use actual member length/width UVs without changed widths.
@evidence models/01-windows.md#window-muntin-grid Only the 0.01 m muntin layers on both glazing sides receive coating; the four glass cells remain separate.
@evidence models/01-windows.md#window-surface-partitions frame/sash/mullion/muntin ids select charcoal independently of trim, inner sill/casing, and clear/obscure glass.
@evidence principles/core/common.md#declared-basis #2E3033/roughness 0.40 interprets visual-grammar and the flashing prototype under the common authored-color convention.
@evidence principles/core/common.md#scope-preservation Coating binds existing window/door/gutter/flashing/cap faces without owning their geometry.
@evidence principles/core/common.md#substantive-completion Numeric response, concrete face vocabulary, 0.05 m micrograin, source, and frame/flashing observations are specified.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Charcoal identity gains #2E3033, roughness 0.40, and frame/sash/mullion/muntin/flashing bindings.
@evidence principles/design/materials.md#material-construction-appearance Powder-coated aluminum construction is distinct from dielectric coating response metallic 0.0.
@evidence principles/design/materials.md#material-binding-interface Stable frame/sash/mullion/muntin/roof-flashing ids and cap UVs retain the common host/sidedness conventions.
@evidence principles/design/materials.md#material-verification-address White-trim window views and valley/chimney close views can falsify lost frame thickness or flashing indistinguishable from shingles.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work The current window partitions and roof-flashing prototype supply compatible faces. Earlier exterior-trim ownership correction was model repair, not a new charcoal-material geometry revision.
@evidence contracts/texture-readability.md#material-texture-readability Planned 0.05 m coating grain consumes model UVs and the cap's space-owner UVs, preserving edge highlights.
@evidence settings/20-verification.md#visual-grammar Deep charcoal remains distinct from white trim and dark shingles through its actual metal member boundaries.
-->

This is the [deep charcoal window family](../settings/20-verification.md#visual-grammar). Construction is powder-coated aluminum; the exposed coating uses metallic 0.0 under the [response convention](00-material-frame.md#material-response-conventions). Appearance is `#2E3033` (linear 0.027, 0.030, 0.033), roughness 0.40, transmission 0.0.

Bind [window members](../models/01-windows.md#window-member-sizes) `frame`, `sash`, `mullion`; [muntins](../models/01-windows.md#window-muntin-grid) `muntin`; [front-door](../models/02-exterior-doors.md#front-entry-door) `muntin`; [garden doors](../models/02-exterior-doors.md#garden-door-pair) `leaf-exterior`, `leaf-interior`, `leaf-edge`, `sash`; [gutters/downspouts](../models/15-outdoor.md#eave-gutter-downspout) `gutter`, `downspout`; [valley/chimney metal](../models/15-outdoor.md#asphalt-shingle-strip) `roof-flashing`; and the chimney cap. Source owner is `src/materials/exterior/frames.ts`. Review asks whether thick frames read inside white trim and thin flashing reads separately from shingles at valley/chimney junctions.

Surface plan: frame/sash/mullion/muntin, cap, and flashing coating micrograin repeats at 0.05 m. The [cap](../spaces/envelope/left.md#chimney-roof-interface) consumes its space-owner axes/origin/seams; models supplies window/flashing UVs. Preserve edge highlights. Current `charcoal-frame.png` is registered, while complete grain response and close/review-distance GPU judgment remain unverified. [Member dimensions](../models/01-windows.md#window-member-sizes) owns frame/mullion width/depth; [partition naming](../models/01-windows.md#window-surface-partitions) alone does not generate their meshes.

## Clear glass {#glass-clear}
<!--
@evidence models/14-bathrooms.md#sliding-shower-booth Transmission binds the prototype's actual 0.008 m glass members while rails/handles/faucets/tray remain distinct. The shared shader thickness is a separate 0.006 m approximation.
@evidence models/01-windows.md#window-local-frame Existing glass hosts retain their recessed window coordinates; shader response does not replace frame depth.
@evidence models/01-windows.md#double-hung-window Each closed 0.006 m glass cell in upper/lower tracks receives transmission without new tracks or motion nodes.
@evidence models/01-windows.md#fixed-window Fixed stair/garage glass cells remain clear and distinct from the muntin grid.
@evidence models/01-windows.md#window-fidelity The omitted double-glazing air gap is not added as shader geometry or claimed insulation/waterproofing.
@evidence principles/core/common.md#declared-basis The openings requirement that glass is neither a hole nor black plate grounds the authored #E8EEF0/roughness 0.03.
@evidence principles/core/common.md#scope-preservation Existing window/door/shower/laundry glass faces receive response without changed host geometry.
@evidence principles/core/common.md#substantive-completion Color/linear RGB, transmission 0.92, ior 1.50, shader thickness 0.006 m, double-sided response, bindings, and observation are defined.
@evidence principles/core/inherited-units.md#derived-parent-differentiation The glass-readability parent gains numeric transmission/IOR/roughness and glass-face bindings.
@evidence principles/design/materials.md#material-construction-appearance Plate-glass construction is approximated by one transmissive layer; host thickness and shader approximation are distinguished.
@evidence principles/design/materials.md#material-binding-interface glass ids end at their real pane boundaries with double-sided response rather than coating frames.
@evidence principles/design/materials.md#material-verification-address Exterior views with interior lights can falsify absent interior transmission or unsupported sky reflection; a flat opaque plate fails.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Current pane partitions and openings supply compatible transmission hosts. Earlier front-door threshold/fill ownership repair remains model work; this finish changes no parent geometry.
@evidence contracts/texture-readability.md#material-texture-readability Smooth glass requires transmission 0.92/ior 1.50/roughness 0.03 and actual-frame readability rather than painted grain.
@evidence obligations/design/materials.md#material-response Clear glass assigns bounded optical constants and double-sided shader response without claiming physical performance.
@evidence settings/10-house.md#openings Glass remains an actual transmissive member, neither a missing pane nor an opaque black substitute.
-->

[Glass is neither a hole nor an opaque black panel](../settings/10-house.md#openings). The appearance approximation is one 0.006 m plate layer without a double-glazing air gap: `#E8EEF0` (linear 0.807, 0.855, 0.871), roughness 0.03, metallic 0.0, transmission 0.92, ior 1.50, shader thickness 0.006 m, double-sided. Actual geometry remains the host's: the [shower booth](../models/14-bathrooms.md#sliding-shower-booth) declares 0.008 m panes, so the common shader thickness is not a claim that all glass meshes are 0.006 m thick.

Bind window `glass`, [front door](../models/02-exterior-doors.md#front-entry-door), [garage door](../models/02-exterior-doors.md#garage-sectional-door), [garden doors](../models/02-exterior-doors.md#garden-door-pair), shower-booth `glass`, and the designed laundry-machine `glass`. Source owner is `src/materials/exterior/glass.ts`; current declared building bindings cover windows/doors/shower glass, while the separate appliance design does not by itself establish active laundry realization. Review asks whether interiors remain visible and the intended reflection reads in an exterior frame with interior lights on.

Surface plan: `glass` is intentionally smooth and unpatterned. Its transmission/IOR/roughness and actual scene response must read as glass, ending at each pane inside the frame. An opaque flat color in a lit frame fails. Current close/review-distance GPU acceptance remains unverified; no sky/environment-reflection pass is inferred from shader constants.

## Obscured bathroom glass {#glass-obscure}
<!--
@evidence models/01-windows.md#awning-window Only the 0.68×0.53 m obscured-glass pane receives privacy response, preserving its 0.006 m thickness and unmuntined center.
@evidence principles/core/common.md#declared-basis The tub-window privacy role and common palette ground the authored #E8EEF0/roughness 0.55.
@evidence principles/core/common.md#scope-preservation Response binds only the existing tub-window/awning-pane interface without changed geometry.
@evidence principles/core/common.md#substantive-completion Shared tint/IOR/thickness, roughness 0.55, transmission 0.80, etched module, source, and privacy test are specified.
@evidence principles/core/inherited-units.md#derived-parent-differentiation The privacy/window role gains numeric optical response and obscured-glass binding.
@evidence principles/design/materials.md#material-construction-appearance Acid-etched plate glass is approximated by rough transmissive response, not an opaque painted pane.
@evidence principles/design/materials.md#material-binding-interface obscured-glass uses pane-local horizontal U/vertical V from its lower-left and ends at the sash.
@evidence principles/design/materials.md#material-verification-address The bathroom window must admit light while obscuring fixture shapes in actual frames.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work The tub-right-window privacy role and existing awning-pane id/dimensions provide the needed host without geometry revision.
@evidence contracts/texture-readability.md#material-texture-readability Planned etched roughness repeats at 0.002 m with pane-local origin and sash-bound seams; the current color tile is not proof of roughness-map realization.
@evidence spaces/envelope/right.md#tub-right-window The high privacy window retains its room binding and existing opening while receiving obscured optics.
-->

The exterior bathroom privacy window is plate glass etched on one face. It shares clear-glass color, ior, and thickness, with roughness 0.55, metallic 0.0, transmission 0.80: light passes while interior forms are intended to blur. Bind [tub-window](../spaces/envelope/right.md#tub-right-window) [awning-pane](../models/01-windows.md#awning-window) `obscured-glass`. Source owner is `src/materials/exterior/glass.ts`; review asks whether the window stays bright without exposing fixture shapes.

Surface plan: deterministic etched micro-roughness repeats at 0.002 m. Set the pane lower-left as origin, horizontal U/vertical V, ending at the sash. Preserve transmission and intended obscurity. Current source registers `obscured-glass.png` as a color map with constant roughness; the planned roughness map and current close/review-distance privacy judgment remain unverified.

## Honey-brown wooden entry door {#front-door-wood}
<!--
@evidence models/02-exterior-doors.md#front-entry-door Wood binds leaf-exterior/interior/edge/panel around six glass cells and recesses, leaving white casing and black hardware separate.
@evidence models/02-exterior-doors.md#exterior-door-surfaces Broad faces, thickness ends, recessed panels, and hinge-hole walls retain actual ids/metric UVs; grain is reprojected at cuts.
@evidence principles/core/common.md#declared-basis porch-entry's wooden door grounds the authored #9A6A3E/roughness 0.50 under the common color convention.
@evidence principles/core/common.md#scope-preservation Finish covers existing leaf faces without changing the entry-door envelope or casing/hardware ownership.
@evidence principles/core/common.md#substantive-completion Color/linear RGB, optical values, four leaf ids, vertical grain, source, and porch-shadow observation are defined.
@evidence principles/core/inherited-units.md#derived-parent-differentiation The wood-door parent gains numeric finish and leaf bindings while casing/handle retains other finishes.
@evidence principles/design/materials.md#material-construction-appearance Oiled oak construction is distinct from coating color/gloss and planned grain response.
@evidence principles/design/materials.md#material-binding-interface Four leaf roles consume local vertical V and cut-face projection; casing/handle remains white/black.
@evidence principles/design/materials.md#material-verification-address Porch-shadow views can falsify wood indistinguishable from the white wall; neutral samples compare #9A6A3E.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Current porch/entry identity and repaired front-door faces suffice for coating/grain; earlier threshold/fill ownership repair is model work, not a new finish revision.
@evidence contracts/texture-readability.md#material-texture-readability Planned 0.15 m oak width follows leaf vertical V from lower-left, breaking at panel/edge/casing boundaries.
@evidence settings/10-house.md#porch-entry The wooden leaf remains medium brown within the shaded porch instead of merging with the white envelope.
-->

The [wooden entry door](../settings/10-house.md#porch-entry) uses oiled oak boards. Appearance is `#9A6A3E` (linear 0.323, 0.144, 0.048), roughness 0.50, metallic 0.0, transmission 0.0. Bind the [front-door prototype](../models/02-exterior-doors.md#front-entry-door) `leaf-exterior`, `leaf-interior`, `leaf-edge`, `leaf-panel`; `casing` receives [white interior trim](02-interior-shell.md#interior-trim-white) and `handle` receives [black-coated metal](02-interior-shell.md#black-coated-metal). Source owner is `src/materials/exterior/doors.ts`; review asks whether medium-brown wood remains distinct from white walls in porch shade.

Surface plan: oak grain has a 0.15 m width module elongated along the leaf's vertical V. Origin is the lower-left; panel/edge partitions align grain direction while casing breaks it. `front-door-oak.png` is currently registered; complete grain response and current close/review-distance GPU judgment remain unverified.

## Charcoal garage-door panels {#garage-door-charcoal}
<!--
@evidence models/02-exterior-doors.md#garage-sectional-door Four rigid panels receive coating on broad/recess/groove/end faces, leaving top glass and metal rails separate.
@evidenceExclude models/02-exterior-doors.md#exterior-door-fidelity Omitted springs/motors/cables/rollers have no material host; coating creates neither those parts nor proof of rail contact.
@evidence principles/core/common.md#declared-basis garage's dark sectional door grounds #34373A/roughness 0.45 under the authored-color convention.
@evidence principles/core/common.md#scope-preservation Finish binds existing garage-panel faces without changing their geometry or travel.
@evidence principles/core/common.md#substantive-completion Color/linear RGB, coating response, four panel roles, module/seams, source, and segmentation/glass observations are stated.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Dark garage-door identity gains numeric response and leaf/panel-edge bindings.
@evidence principles/design/materials.md#material-construction-appearance Painted steel is represented by dielectric coating metallic 0.0 rather than bare-metal response.
@evidence principles/design/materials.md#material-binding-interface leaf-exterior/interior/panel and panel-edge end at actual grooves; rail/glass receives other materials.
@evidence principles/design/materials.md#material-verification-address Exterior 01 must retain panel shadows and upper glass rather than a flattened black slab.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work The garage identity and current sectional prototype supply panel boundaries/UVs without a new door geometry or state.
@evidence contracts/texture-readability.md#material-texture-readability Planned 0.25 m steel-coating grain uses horizontal U/vertical V from each panel lower-left and breaks at grooves.
@evidence settings/10-house.md#garage The two-car-width dark sectional door retains visible divisions and upper daylight glass without vehicles.
-->

The [dark two-car-width sectional door](../settings/10-house.md#garage) has painted steel panels, hence metallic 0.0. Appearance is `#34373A` (linear 0.034, 0.038, 0.042), roughness 0.45, transmission 0.0. It is slightly brighter than window frames so the broad surface need not collapse into black. Bind the [garage-door](../models/02-exterior-doors.md#garage-sectional-door) `leaf-exterior`, `leaf-interior`, `leaf-panel`, `panel-edge`; `rail` receives [stainless steel](03-furnishings.md#stainless-steel). Source owner is `src/materials/exterior/doors.ts`. Exterior 01 tests panel-division shadows and top glazing.

Surface plan: coating micrograin repeats at 0.25 m with horizontal U/vertical V from each panel's lower-left, breaking at grooves and excluding upper glass. Current `garage-door-steel.png` is registered; complete grain response and current close/review-distance GPU acceptance remain unverified.

## Porch floor {#porch-floor}
<!--
@evidence principles/core/common.md#declared-basis #A8A49C/roughness 0.80 is an authored palette choice for the porch under the common color convention.
@evidence principles/core/common.md#scope-preservation Coating binds existing porch top/riser/exposed-side faces without changing platform height or step count.
@evidence principles/core/common.md#substantive-completion Color/linear values, optics, compatible porch faces, 0.40 m grain, source, and walk-boundary observation are specified.
@evidence principles/core/inherited-units.md#derived-parent-differentiation The porch surface gains numeric finish and physical aggregate scale beyond its geometry reservation.
@evidence principles/design/materials.md#material-construction-appearance Painted concrete top construction is distinct from averaged coating/aggregate appearance.
@evidence principles/design/materials.md#material-binding-interface Porch faces receive existing paving UVs, with grain cut at nosings and column bases.
@evidence principles/design/materials.md#material-verification-address Step/walk views can falsify an unreadable height boundary despite valid numeric constants.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work porch-platform-access's existing top/risers and paving UV conventions suffice without a new support or step geometry.
@evidence contracts/texture-readability.md#material-texture-readability Planned 0.40 m aggregate/color variation ends at actual nosings/base interfaces using owner coordinates.
@evidence spaces/porch.md#porch-platform-access The raised platform and three risers retain their existing structure while receiving darker porch response.
-->

This finish covers the raised floor and steps of the [entry porch](../spaces/porch.md#porch-platform-access). Construction is a painted concrete top slab. Appearance is `#A8A49C` (linear 0.392, 0.371, 0.332), roughness 0.80, metallic 0.0, transmission 0.0, slightly darker than [site concrete](#paving-concrete) so the level boundary can read. Bind porch top, risers, and exposed sides. Source owner is `src/materials/exterior/paving.ts`; review compares porch steps and front walk through color/shadow.

Surface plan: fine aggregate/color variation repeats at 0.40 m, consuming [paving UVs/cuts](../spaces/site/01-paving-support.md#paving-depth-reservation) and ending at actual nosings/column bases. Current `porch.png` is registered; complete grain response and current close/review-distance GPU acceptance remain unverified.

## Paving concrete {#paving-concrete}
<!--
@evidence principles/core/common.md#declared-basis site's concrete drive/walk identity grounds #B4B0A8/roughness 0.88 as authored response rather than photographic sampling.
@evidence principles/core/common.md#scope-preservation Finish binds existing front-walk/driveway/side-walk/terrace tops/sides without changing outlines, interpolation, or support.
@evidence principles/core/common.md#substantive-completion Color/linear RGB, optical values, hosts, 0.50 m grain, source, and wall/lawn distinction are defined.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Concrete/site geometry gains numeric response and metric grain beyond its spatial thickness reservation.
@evidence principles/design/materials.md#material-construction-appearance Broom-finished cast concrete construction is distinct from averaged color/roughness.
@evidence principles/design/materials.md#material-binding-interface Existing paving owner UVs retain phase, while slab/threshold/curb boundaries cut the texture.
@evidence principles/design/materials.md#material-verification-address Afternoon views can falsify paving merged with white walls or lawn, and close views can expose fake joint/ground contacts.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Site identity and paving-depth-reservation supplies thickness/metric UVs; this finish changes no height formula or support geometry.
@evidence contracts/texture-readability.md#material-texture-readability Planned 0.50 m aggregate repeats in the existing phase and cuts at actual slabs/thresholds/curbs without painting over gaps.
@evidence settings/10-house.md#site-identity Concrete driveway and entry walk retain the authored site identity without survey or drainage claims.
@evidence spaces/site/01-paving-support.md#paving-depth-reservation Host-owned thickness/sloped tops and metric projections remain unchanged by finish response.
@evidence spaces/site/driveway.md#driveway-plan #B4B0A8/roughness 0.88 receives the existing driveway top/exposed sides; this finish authors no joints or slope.
@evidence spaces/site/front-walk.md#front-walk-plan The same concrete response binds the T-shaped walk top/sides without creating a second contact floor.
-->

This is the [garage concrete drive and entry walk](../settings/10-house.md#site-identity). Construction is broom-finished cast-in-place concrete; [paving substrate](../spaces/site/01-paving-support.md#paving-depth-reservation) owns thickness. Appearance averages broom grain as `#B4B0A8` (linear 0.456, 0.434, 0.392), roughness 0.88, metallic 0.0, transmission 0.0. Bind front-walk, driveway, side-walk, and terrace tops/exposed sides; this H2 authors no joints. Source owner is `src/materials/exterior/paving.ts`. Afternoon review asks whether paving is darker than white walls and distinct from lawn.

Surface plan: aggregate repeats at 0.50 m using [paving-owner UVs/cuts](../spaces/site/01-paving-support.md#paving-depth-reservation) with matching phase. Actual slab seams, thresholds, and curbs cut the grain; painted gaps cannot stand in for ground contact. `concrete.png` is registered; complete grain response and current close/review-distance GPU judgment remain unverified.

## Mid-brown fence wood {#fence-wood}
<!--
@evidence models/02-exterior-doors.md#side-yard-gate Eight leaf-panel boards and two gate-batten faces receive wood grain while actual 0.008 m gaps and hardware remain separate.
@evidence principles/core/common.md#declared-basis site-identity grounds the authored #8C6A48/roughness 0.75 rather than photographic pixels.
@evidence principles/core/common.md#scope-preservation Finish covers existing fixed-fence wood and separate gate boards without changing geometry or ownership.
@evidence principles/core/common.md#substantive-completion Color/linear RGB, optics, wood face ids, 0.14/0.80 m modules, source, and entry-door comparison are stated.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Wooden-fence identity gains numeric response and fixed-panel/gate-batten bindings.
@evidence principles/design/materials.md#material-construction-appearance Stained preservative-treated boards remain construction; color/roughness/grain approximates their exposed finish.
@evidence principles/design/materials.md#material-binding-interface Fixed panels use space-owner UVs; leaf-panel/gate-batten uses model UVs with seams at actual board/hinge boundaries.
@evidence principles/design/materials.md#material-verification-address Exterior 01 must read fence wood as grayer mid-brown than the entry leaf, with physical board/gate separation.
@evidenceExclude upstream/design/materials.md#parent-revision-from-material-work Existing fence line/face interfaces and the independent gate prototype suffice for finish binding without changed ground or enclosure geometry.
@evidence contracts/texture-readability.md#material-texture-readability Vertical grain follows 0.14 m board width and 0.80 m length repeat, ending at actual board gaps and hinge lines.
@evidence settings/10-house.md#site-identity Right-side mid-brown wood remains a separate site boundary material.
@evidence spaces/site/fence.md#fence-enclosure-plan Fixed panels/posts retain the existing enclosure responsibility; independent moving gate wood is a model binding.
-->

The [right wooden fence](../settings/10-house.md#site-identity) uses stained preservative-treated boards. Appearance is `#8C6A48` (linear 0.262, 0.144, 0.065), roughness 0.75, metallic 0.0, transmission 0.0. The 0.75 roughness is an authored exception to the common oiled-wood band, making this outdoor stained surface less glossy than the entry leaf while preserving its medium-brown identity. Bind exposed wood of the [fixed fence panels/posts](../spaces/site/fence.md#fence-enclosure-plan) and separate [side-yard gate](../models/02-exterior-doors.md#side-yard-gate) `leaf-panel`/`gate-batten`. Gate hardware receives black metal and is not counted as fence-space geometry. Source owner is `src/materials/exterior/fence.ts`; exterior 01 compares the grayer mid-brown fence with the entry door.

Surface plan: vertical wood grain follows 0.14 m board width and 0.80 m length repeat. Fixed boards consume [fence-owner UVs/cuts](../spaces/site/fence.md#fence-ground-profile); separate leaf boards consume local model UVs. Grain ends at actual board gaps/hinge lines. Current `timber.png` is registered; complete grain response and current close/review-distance GPU acceptance remain unverified.

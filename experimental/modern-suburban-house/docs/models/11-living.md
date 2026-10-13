# Living and family-room furniture prototypes

## Fabric sofa {#fabric-sofa}
<!--
@evidence principles/core/common.md#scope-preservation This H2 receives living/family sofa reservations as one prototype and owns envelope 2.10 × 0.95 × 0.90 m, parts, material boundaries, observations and source src/models/furnishings/living.ts.
@evidence principles/core/common.md#substantive-completion Define base Y = [0.08, 0.30], arm width 0.15 m/height 0.62 m, back depth 0.20 m/top 0.90 m, three cushions width 0.596 m/depth 0.75 m/top 0.43 m, gaps 0.006 m and lower-rear baseboard relief.
@evidence principles/core/common.md#declared-basis Equal reservation length/depth/height supply the envelope; living seat 0.43 m is inherited. Family seat 0.43 m is this layer's decision, grounded in equal envelopes/shared gray-off-white fabric-sofa identity.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Parents supply only envelope/living seat 0.43 m; add arms/back/three-cushion divisions, height tiers 0.43/0.62/0.90 m and the previously unspecified family seat height.
@evidence principles/design/models.md#representation-contract Divide base/three cushions/back/two arms/four corner legs 0.08 m; fix leg/base/seat-cushion/back/arm boundaries and omit cushion compression/folds/seams.
@evidence principles/design/models.md#spatial-convention Furniture-local +Z is seated front; living faces world -X/family -Z; envelope length 2.10 m/depth 0.95 m/height 0.90 m.
@evidence principles/design/models.md#reviewable-structure Fixed model-review side orthographic compares seat 0.43/arms 0.62/back 0.90 m, top distinguishes three cushions/two arms and both placements compare reservation envelopes; no articulation.
@evidence principles/design/models.md#model-observable-style-basis Translate gray/off-white fabric-sofa identity into three cushions read through two 0.006 m gaps, full-depth arms and rear back; materials chooses fabric colors per placement.
@evidence principles/design/models.md#model-scale-layer-completion Seat reference 0.43 m, leg/base/cushion/back/arm layers, five material boundaries, compression/fold/seam omissions and three observations define both placements' blocking representation.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Use living X=-2.90 to -1.95 m/Z=[-3.75,-1.65]/height 0.90/seat 0.43 m and family X=[3.25,5.35]/Z=-7.15 to -6.20 m/height 0.90 m unchanged. Family seat 0.43 m fills a models decision rather than a parent defect.
@evidence settings/10-house.md#living Shared gray/off-white fabric-sofa identity permits one prototype for living/family, with colors assigned per placement by materials.
@evidence settings/10-house.md#common-room Realize the family sofa with the same prototype; settings specifies no seat height, so family seat 0.43 m is this layer's choice.
@evidence spaces/rooms/living.md#living-furniture-use Consume living X=-2.90 to right inner face -1.95 m/Z=[-3.75,-1.65]/height 0.90 m as envelope and table seat 0.43 m as cushion top.
@evidence spaces/rooms/common.md#common-family-reservation Use family X=[3.25,5.35]/Z=-7.15 to common front inner face -6.20 m/height 0.90 m for the shared envelope facing world -Z.
@evidence obligations/design/models.md#addressable-model-decisions Gather envelope, legs/base/three cushions/back/two arms, five boundary names and three observations under fabric-sofa, giving both reservations one prototype address.
@evidence obligations/design/models.md#model-review-set Fixed side/top/reservation-envelope comparisons in 00-model-frame.md#model-review-set judge structure independently of dramatic composition; all observations remain unverified.
@evidence obligations/design/models.md#reference-scale Both placements use cushion top 0.43 m, arm top 0.62 m and back top 0.90 m measured from the floor; living supplies the seat reference and the shared envelope is 2.10 × 0.95 × 0.90 m.
-->

Adopt reference 04's light living sofa and 03's light common-area sofa as two placements of one structural prototype. Auxiliary cushions/throws are separate prop prototypes.

One fabric-sofa prototype serves [living reservation](../spaces/rooms/living.md#living-furniture-use) X=-2.90 m to right inner face -1.95 m, Z=[-3.75,-1.65], height 0.90 m and [family reservation](../spaces/rooms/common.md#common-family-reservation) X=[3.25,5.35], Z=-7.15 m to common front inner face -6.20 m, height 0.90 m. Both give length 2.10 m/depth 0.95 m/height 0.90 m, retained as envelope. Follow [furniture-local coordinates](00-model-frame.md#model-furniture-local-frame): +Z is seated front, facing world -X in living/world -Z in family.

Parts are base, three seat cushions, back and two arms. Base Y=[0.08,0.30] rests on four corner legs height 0.08 m. Each full-depth arm is width 0.15 m/top 0.62 m. Back between arms uses rear depth 0.20 m/top 0.90 m. Divide inner width 1.80 m into three 0.596 m cushions/two 0.006 m gaps (3 × 0.596 + 2 × 0.006 = 1.800 m), depth 0.75 m/top 0.43 m matching the [living seat](../spaces/rooms/living.md#living-furniture-use). Family reservation/[common settings](../settings/10-house.md#common-room) specify no seat height; using 0.43 m there is this layer's choice grounded in equal envelopes and the [living settings'](../settings/10-house.md#living) shared gray/off-white sofa identity. Gaps 0.006 m make three cushions readable.

Boundaries are `leg`, `base`, `seat-cushion`, `back`, `arm`; materials can choose fabric colors per placement. No articulation or cushion compression/folds/seams. Source owner is `src/models/furnishings/living.ts`. Observe side-orthographic height tiers 0.43/0.62/0.90 m, top-view distinction of three cushions/two arms and envelope/reservation equality in both placements. Capture fixed [model-review views](00-model-frame.md#model-review-set), following [surface naming](00-model-frame.md#model-surface-partition-naming); all observations are unverified.

Both placements retain their rear wall-contact reference. Move rear edges of two back feet to local Z=0.015 m, leaving front feet unchanged. Cut rear-lower `base` Z=[0,0.015] m at Y=[0.08,0.10] m to meet baseboard front. Back/arms contact the rear wall only above 0.10 m; retain front edges/full 2.10×0.95×0.90 m envelope. Do not create the previous flat lower-rear board lacking relief.

Local envelope X=[−1.05,1.05], Z=[0,0.95] m. Four `leg` sections 0.06×0.06 m/Y=[0,0.08] m form pairs X=[−0.98,−0.92]·[0.92,0.98] m, rear Z=[0.015,0.075]/front [0.87,0.93] m. `base` closes X=[−1.05,1.05]·Z=[0,0.95]·Y=[0.08,0.30] m except rear-lower cut Z=[0,0.015]·Y=[0.08,0.10]. `arm` X=[−1.05,−0.90]·[0.90,1.05], Z=[0,0.95], Y=[0.30,0.62] m; `back` X=[−0.90,0.90]·Z=[0,0.20]·Y=[0.30,0.90] m. Cushions fill three intervals of remaining X width 1.80 m/Z=[0.20,0.95]·Y=[0.30,0.43] m. Rear-foot inset/base cut clear low baseboards; arms/back reach the rear wall only at Y≥0.30 m.

Three closed `seat-cushion` fabric members divide width 1.80 m into 0.596 m each/two gaps 0.006 m, depth Z=[0.20,0.95]/height Y=[0.30,0.43] m. They meet base at faces, sharing no arm/back volume.

## Low wooden table {#low-table}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns one L/W prototype for two living/family reservations, both parameter pairs, top/legs, boundaries, observations and source owner.
@evidence principles/core/common.md#substantive-completion Top Y=[0.38,0.42]/thickness 0.04 m, four square legs 0.05 m inset 0.05 m from corners, no apron/lower shelf make both placements constructible.
@evidence principles/core/common.md#declared-basis Inherit L=1.30/W=0.50 and L=1.05/W=0.55 m/top 0.42 m from reservations. Floor-plan-center origin is a furniture-frame exception because the table is used from all sides.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Reservations provide envelope/top 0.42 m; add L/W parameters, top thickness 0.04 m, leg positions and no apron, connecting sofa-front foot space beneath the top.
@evidence principles/design/models.md#representation-contract One top/four legs, top/leg boundaries, no articulation and empty space below without apron/lower shelf; omit grain/chamfers/leg joints.
@evidence principles/design/models.md#spatial-convention Origin is floor-plan center/+X long axis; living long axis world Z/family world X, both top 0.42 m.
@evidence principles/design/models.md#reviewable-structure Fixed views compare both parameter-pair envelopes to reservations and side top 0.42 m nearly matching sofa seat 0.43 m.
@evidence principles/design/models.md#model-observable-style-basis Use shared low wooden top 0.04 m/square legs 0.05 m. Exclude reference 02's TV console because it blocks family window light/access; pass only top/leg boundaries to materials.
@evidence principles/design/models.md#model-scale-layer-completion Top 0.42 m versus seat 0.43 m, top/leg layers, two boundaries/two observations define blocking per parameter pair.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Use living X=[-3.95,-3.45]·Z=[-3.30,-2.00], family X=[3.40,4.45]·Z=[-8.35,-7.80] and both tops 0.42 m unchanged as L/W/height; no parent defect requires repair.
@evidence settings/10-house.md#living The low wooden table identity selects this prototype; its living dimensions come from the room reservation rather than the settings description.
@evidence settings/10-house.md#common-room The family sofa/low-table identity selects the same structural prototype; the family reservation supplies its distinct length and width.
@evidence spaces/rooms/living.md#living-furniture-use Consume X=[-3.95,-3.45]·Z=[-3.30,-2.00] as L=1.30/W=0.50 m/world-Z long axis/top 0.42 m.
@evidence spaces/rooms/common.md#common-family-reservation Consume X=[3.40,4.45]·Z=[-8.35,-7.80] as L=1.05/W=0.55 m/world-X long axis/top 0.42 m.
-->

[Living settings'](../settings/10-house.md#living) low wooden table and [common settings'](../settings/10-house.md#common-room) family table share one L/W prototype. [Living reservation](../spaces/rooms/living.md#living-furniture-use) X=[-3.95,-3.45], Z=[-3.30,-2.00] gives L=1.30/W=0.50 m/world-Z long axis. [Family reservation](../spaces/rooms/common.md#common-family-reservation) X=[3.40,4.45], Z=[-8.35,-7.80] gives L=1.05/W=0.55 m/world-X long axis. Both top at 0.42 m. As a [furniture-frame](00-model-frame.md#model-furniture-local-frame) exception for all-sided use, origin is floor-plan center/+X long axis.

Parts are top/four legs. Top Y=[0.38,0.42] is thickness 0.04 m; legs are square timber 0.05 m, placed 0.05 m inside corners. No apron/lower shelf: sofa-front foot space continues beneath top. Boundaries top/leg; no articulation.

Omit wood grain, corner chamfers and leg joints. Do not adopt reference 02's family TV console/tall screen: rear/right walls faced by the sofa contain two windows/access routes; the back wall lies behind sofa, leaving no facing screen wall. A low console beneath a window would force the TV ahead of it, blocking access/daylight. Source owner is `src/models/furnishings/living.ts`. Observe envelope/reservation equality for both pairs and side top 0.42 m nearly level with sofa seat 0.43 m. Use fixed [model-review views](00-model-frame.md#model-review-set)/[surface naming](00-model-frame.md#model-surface-partition-naming); all observations are unverified.

## Reading armchair {#reading-armchair}
<!--
@evidence principles/core/common.md#scope-preservation This H2 receives one living armchair envelope and owns leg/base/cushion/back/arm sections, boundaries, observations and source.
@evidence principles/core/common.md#substantive-completion Define four leg sections/centers/heights and X/Z/Y envelopes of base/back/arms/cushion.
@evidence principles/core/common.md#declared-basis Reservation supplies 0.85×0.85 m/height 0.90 m. Share only sofa seat 0.43/back top 0.90 m; decide arm/back depths separately for a one-person 0.85 m envelope and choose seat width 0.61 m to express that role.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Add one cushion/single-person seat, arm width 0.12/back depth 0.18/seat 0.43 m to reservation envelope/height 0.90 m.
@evidence principles/design/models.md#representation-contract Four legs/base/one cushion/back/two arms, leg/base/seat-cushion/back/arm boundaries, no articulation; omit compression/seams/fabric folds.
@evidence principles/design/models.md#spatial-convention Furniture-local +Z is front/world +Z in placement; envelope width/depth 0.85 m/height 0.90 m.
@evidence principles/design/models.md#reviewable-structure Fixed side view verifies only seat/back-top heights shared with sofa; top view tests 0.85 m envelope against foot-use Z=[-4.80,-4.20].
@evidence principles/design/models.md#model-observable-style-basis Adopt reference 04's fireplace armchair as one seat width 0.61 m, sharing only seat 0.43/back top 0.90 m through an independent section; choose no materials/colors.
@evidence principles/design/models.md#model-scale-layer-completion Seat 0.43/arm 0.60/back 0.90 m tiers, independent section/five boundaries/two observations define reservation-fit expression.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Use living X=[-3.90,-3.05]·Z=[-5.65,-4.80]/height 0.90 m and foot-use Z=[-4.80,-4.20] unchanged as envelope/observation limit; no parent revision needed.
@evidence settings/10-house.md#living The small reading-armchair identity selects one-person seating; the room reservation supplies the 0.85 m square envelope.
@evidence spaces/rooms/living.md#living-furniture-use Consume X=[-3.90,-3.05]/Z=[-5.65,-4.80]/height 0.90 m as envelope and foot-use Z=[-4.80,-4.20] as observation boundary not to cross.
-->

Adopt reference 04's armchair ahead of the fireplace. Its neighboring small table has no separate reservation and is not hidden inside this prototype.

[Living settings'](../settings/10-house.md#living) small reading armchair receives [reservation](../spaces/rooms/living.md#living-furniture-use) X=[-3.90,-3.05], Z=[-5.65,-4.80], height 0.90 m: width/depth 0.85 m. Follow [furniture-local coordinates](00-model-frame.md#model-furniture-local-frame), front +Z/world +Z.

Parts: four legs/base/one seat cushion/back/two arms. Envelope X=[−0.425,0.425]·Z=[0,0.85]·Y=[0,0.90] m. Four leg prisms section 0.06×0.06 m center X=±0.365·Z=0.08/0.77 m/Y=[0,0.08]. Base X=[−0.425,0.425]·Z=[0,0.85]·Y=[0.08,0.30]. Back same X/Z=[0,0.18]·Y=[0.30,0.90]. Arms X=[−0.425,−0.305]·[0.305,0.425]·Z=[0.18,0.80]·Y=[0.30,0.60]. Seat-cushion X=[−0.305,0.305]·Z=[0.18,0.80]·Y=[0.30,0.43] m. Boards meet only specified faces, sharing no interior volume. Seat width 0.61 m fills the single-person reservation. Boundaries leg/base/seat-cushion/back/arm; no articulation.

Omit cushion compression/seams/fabric folds. Source owner is `src/models/furnishings/living.ts`. Side observations verify sofa-shared seat/back-top heights only; top verifies square 0.85 m envelope does not enter foot-use Z=[-4.80,-4.20] m. Use fixed [model-review views](00-model-frame.md#model-review-set)/[surface naming](00-model-frame.md#model-surface-partition-naming); all observations are unverified.

## Dark bookcase and books {#dark-bookcase}
<!--
@evidence principles/core/common.md#scope-preservation This H2 receives the living bookcase envelope and owns body boards/five shelves/book groups/boundaries/observations/source.
@evidence principles/core/common.md#substantive-completion Define sides/top 0.02 m/back 0.01 m/plinth 0.08 m/rear-lower baseboard cut, tops 0.20·0.55·0.90·1.25·1.60 m, 25 books per level with seed 1952 dimensions, local depth Z=[0.12,0.32] m and width occupancy 77.6–78.6%, leaving front clearance 0.03 m.
@evidence principles/core/common.md#declared-basis Inherit envelope/shelf law 0.35 m intervals from 0.20 m; board thickness/book ranges/fixed-seed derivation are this H2's new choices, without parent attribution.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Add board construction, shelf thickness 0.02 m below tops and seeded book groups/fill ratios to parent envelope/top law.
@evidence principles/design/models.md#representation-contract Define two sides/back/top/plinth/five shelves, fixed child books and doorless open shelves; books stay within body depth rather than projecting beyond front.
@evidence principles/design/models.md#spatial-convention Furniture-local +Z is book retrieval/world -X; envelope width 1.00/depth 0.35/height 1.90 m.
@evidence principles/design/models.md#reviewable-structure Fixed front views falsify shelf/group readability; side views test books inside 0.35 m depth; no articulation.
@evidence principles/design/models.md#model-observable-style-basis Materials owns dark color; observable geometry is doorless shelves/thin-box book groups occupying 70–85% inner width.
@evidence principles/design/models.md#model-scale-layer-completion Envelope 1.00×0.35×1.90 m, sides/top 0.02/back 0.01/plinth 0.08 m, shelf tops 0.20–1.60 m/books, carcass/plinth/shelf/book ids, omitted spine text/covers and two observations define expression.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Use living X=-2.30 to -1.95 m/Z=[-5.90,-4.90]/height 1.90 m and shelf-top law unchanged; no parent revision needed.
@evidence settings/10-house.md#living Specify dark bookcase identity as open shelves/book groups, without choosing dark color here.
@evidence spaces/rooms/living.md#living-furniture-use Consume bookcase X=-2.30 to right inner -1.95 m/Z=[-5.90,-4.90]/height 1.90 m as envelope and parent top law as 0.20·0.55·0.90·1.25·1.60 m.
@evidence obligations/design/models.md#representation-ceiling Books are thin boxes thickness 0.025–0.035/height 0.20–0.28/depth 0.20 m; omit spine text/individual covers, claiming shelf/group readability rather than individual book identity.
-->

Adopt reference 04's dark fireplace-side bookcase and differing book heights. Create no spine text; fill by defined dimensions/order.

[Living settings'](../settings/10-house.md#living) dark bookcase receives [reservation](../spaces/rooms/living.md#living-furniture-use) X=-2.30 to right inner -1.95 m, Z=[-5.90,-4.90], height 1.90 m: width 1.00/depth 0.35/height 1.90 m. Follow [furniture frame](00-model-frame.md#model-furniture-local-frame), retrieval +Z/world -X. Shelves are open without doors.

Parts are two sides/back/top/plinth/five shelves. Side/top thickness 0.02 m, back 0.01 m, plinth height 0.08 m. Shelf tops follow [room law](../spaces/rooms/living.md#living-furniture-use): 0.20,0.55,0.90,1.25,1.60 m, thickness 0.02 m below. Each shelf has 25 books, s=0…4 bottom-up/i=0…24 left-right/integer seed 1952. Thickness `0.025 + 0.001 × ((1952 + 17s + 7i) mod 11)` m, height `0.20 + 0.01 × ((1952 + 13s + 5i) mod 9)` m, depth 0.20 m, giving thickness 0.025–0.035/height 0.20–0.28 m. Five thickness totals 0.749,0.745,0.752,0.748,0.755 m occupy 77.6–78.6% of inner width 0.96 m. Start each group 0.02 m from inner left, stacking in order within body depth without front projection.

Boundaries carcass/plinth/shelf/book. Books are fixed children without articulation. Omit spine text/individual covers. Source owner is `src/models/furnishings/living.ts`. Observe five shelf intervals/book groups frontally and book front inside 0.35 m depth laterally, using fixed [model-review views](00-model-frame.md#model-review-set)/[surface naming](00-model-frame.md#model-surface-partition-naming); all observations are unverified.

Retain rear envelope reference at wall; carcass back starts Y=0.10 m and both sides cut local Z=[0,0.015]/Y=[0,0.10] m. Plinth height 0.08 m has rear Z=0.015 m, meeting the wall baseboard alongside; front retains depth end 0.35 m. Shelves/books/envelope 1.00×0.35×1.90 m/five tops stay fixed. Bookcase plinth and wall-baseboard are distinct closed members.

Each shelf is a closed inner-width 0.96 m/depth 0.34 m/thickness 0.02 m board, top 0.20+0.35s m(s=0…4). Each book is a separate closed box with preceding seed/index dimensions. All groups start 0.02 m from inner X and occupy Z=[0.12,0.32] m, clear of back front Z=0.01 m by 0.11 m and inset 0.03 m from shelf front Z=0.35 m. Books contact shelf tops at this depth.

## Thin floor covering {#floor-covering}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns one L/W/T prototype for living/family rugs, entry mat and three bed-host-derived covers: six parameter sets, field/border, boundaries, furniture overlap rules and observations.
@evidence principles/core/common.md#substantive-completion Define living 2.35×2.00×0.008/family 1.70×1.55×0.008/entry 0.90×0.65×0.006 m, three bed length/width laws/footward shifts, border 0.04 m/bottom Y=0. Expand furniture footprint union in Y=[0,T] by 0.001 m, subtract from field/border and close cuts with the same ids.
@evidence principles/core/common.md#declared-basis Living/entry/family reservations supply envelopes; one prototype/origin exception are grounded in thin floor covers people walk across.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Add field/0.04 m border partition at equal height and furniture-contact footprint subtraction to reservation envelopes.
@evidence principles/design/models.md#representation-contract Define field/border of equal thickness, ids field/border, omitting patterns/pile/tassels.
@evidence principles/design/models.md#spatial-convention Origin floor-plan center/+X L/bottom Y=0; rug L world Z/mat L world X.
@evidence principles/design/models.md#reviewable-structure Fixed sides test thickness ≤T without threshold appearance; top compares three room-reserved covers and three bed-derived draft envelopes, then tests floor separation without z-fighting. The bed-derived covers still need separate spatial reservations.
@evidence principles/design/models.md#model-observable-style-basis Geometry owns only thin T=0.008/0.006 m and field/border partitions; omit pattern/pile/tassels.
@evidence principles/design/models.md#model-scale-layer-completion Six thicknesses, bed-foot shifts 0.07/0.11/0.01 m, equal-height border, footprint-cut rule and three observations are specified together.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work Living/entry reservations were retained, but missing family-rug world position was added to spaces/rooms/common.md#common-family-reservation; models consumes only width/length.
@evidence settings/10-house.md#living Consume restrained rug as living T=0.008 m; pattern is not geometry, only field/border.
@evidence settings/10-house.md#entry Consume shallow mat as T=0.006 m, observed laterally for no threshold appearance.
@evidence spaces/rooms/living.md#living-furniture-use Consume X=[-4.00,-2.00]/Z=[-3.90,-1.55] as L=2.35 m(world Z)/W=2.00 m.
@evidence spaces/rooms/common.md#common-family-reservation Receive family X width 1.55/Z length 1.70 m as prototype parameters; parent/instances own position.
@evidence spaces/rooms/entry.md#entry-use-routes Consume X=[0.45,1.35]/Z=[-1.95,-1.30] as L=0.90 m(world X)/W=0.65 m.
@evidence obligations/design/models.md#model-representation-completion Define field/border layers, six L/W/T sets, boundaries, pattern/pile/tassel omissions and three observations. All remain unverified; structural validity/semantic completion is not established.
-->

Rugs/mats are thin covers people walk across, so share one L/W/T prototype. [Living rug](../spaces/rooms/living.md#living-furniture-use) X=[-4.00,-2.00], Z=[-3.90,-1.55] gives L=2.35 m(world Z)/W=2.00/T=0.008 m. [Family rug](../spaces/rooms/common.md#common-family-reservation) gives X width 1.55/Z length 1.70/thickness 0.008 m. Instances consumes that parent for origin/rotation. [Entry mat](../spaces/rooms/entry.md#entry-use-routes) X=[0.45,1.35], Z=[-1.95,-1.30] gives L=0.90 m(world X)/W=0.65/T=0.006 m. Also adopt reference 02's thin under-bed rugs, derived by adding 0.30 m to [bed](13-bedrooms.md#headboard-bed) length/width: primary 2.45×1.90×0.008 m, both small bedrooms 2.45×1.45×0.008 m. Start at bed center with 0.15 m exposure each side; if headward rug edge is less than 0.02 m from wall finish, shift the whole rug footward by the shortage. Primary shifts 0.07 m to resolve 0.05 m intrusion; bedroom two 0.11 m for 0.09 m intrusion; bedroom three 0.01 m to enlarge wall gap 0.01 to 0.02 m. Keep envelopes/thickness, fixing asymmetric exposures with these three decisions. Create no new room/wall; actual swing/furniture-foot fit belongs to instance review and is unverified. As a [furniture-frame](00-model-frame.md#model-furniture-local-frame) exception for walkable covers, origin is floor-plan center/+X L/bottom Y=0.

Parts are field and edge border. Border is width 0.04 m around field at the same thickness, partitioning faces without raising height. Boundaries field/border; omit pattern/pile/tassels. Subtract placement-provided floor-contact footprints and close resulting vertical cuts with original field/border ids. Footprints are the union of every furniture solid in Y=[0,T] transformed to covering-local plane, including legless bed headboards and floor-reaching nightstand bodies. Expand boundaries outward 0.001 m to prevent numerical intersection of distinct prototypes. Do not alter furniture height where covering is absent; coverings neither lift furniture nor share its volume. Later instances calculates footprint lists/world transforms from actual placed prototypes; this H2 duplicates no room-furniture coordinates.

Source owner is `src/models/furnishings/living.ts`. Observe side thickness ≤T without threshold appearance, top-view equality with the three room reservations and three bed-derived draft envelopes, and floor separation without z-fighting, using fixed [model-review views](00-model-frame.md#model-review-set)/[surface naming](00-model-frame.md#model-surface-partition-naming). The three bed-derived covers have no separate spatial reservation yet; their draft dimensions and shifts do not close that handoff. All observations are unverified.

## Fireplace black firebox and wooden mantel {#fireplace-insert-mantel}
<!--
@evidence principles/core/common.md#scope-preservation Own only the actual empty brick firebox insert and upper wooden mantel, without duplicating spaces brick front/chimney.
@evidence principles/core/common.md#substantive-completion Define firebox width 1.04/height 0.64/depth 0.55 m, black plate thickness 0.025 m and mantel 1.60×0.55×0.10 m; front ring X=[−0.52,0.52]·Y=[0.23,0.87]·Z=[−0.015,0] m and hollow-ring width.
@evidence principles/core/common.md#declared-basis Dimensions come from settings/10-house.md#living's black-firebox/brick/mantel distinction and spaces/envelope/left.md#chimney-roof-interface interior-front reservation.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Choose five black interior faces in the actual void and mantel above as separate prototype rather than an empty brick box alone.
@evidence principles/design/models.md#representation-contract Five closed metal plates back/sides/top/bottom use firebox; front thin ring firebox-trim; all mantel faces mantel. Create no flames/actual flue.
@evidence principles/design/models.md#spatial-convention Origin is brick front at lower firebox center; +Z livingward/+X width/+Y up. Derive placement from chimney face.
@evidence principles/design/models.md#reviewable-structure Front compares black empty center/brick ring/wood top, side depth/mantel boundaries and 45° unlit firebox.
@evidence principles/design/models.md#model-observable-style-basis Reference 04's low brick fireplace reads through separate black interior/wood mantel volumes; materials owns color/grain.
@evidence principles/design/models.md#model-scale-layer-completion Fix firebox/mantel envelopes, thickness/contact ranges, three ids, meter UVs/local frame.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work Confirm the void required in brick front and revise spaces/envelope/left.md and src/spaces/envelope/left.ts into four closed brick members. Retain mantel Y=[1.30,1.40] m as separate ownership.
@evidence settings/10-house.md#living Separate black firebox/brick/wood mantel as three surfaces.
@evidence spaces/envelope/left.md#chimney-roof-interface Fill reserved interior-front firebox void/mantel heights unchanged.
@evidence obligations/design/models.md#addressable-model-decisions Define black firebox/wood mantel prototype independently from brick body.
@evidence obligations/design/models.md#model-review-set Inspect 00 front/side/45° views and living reference 04 view.
-->

Building classification: fixture — insert into the spaces-cleared brick firebox and mantel above.

[Living conditions](../settings/10-house.md#living) distinguish black firebox/brick/wood mantel. [Left elevation owner](../spaces/envelope/left.md#chimney-roof-interface) creates brick front/chimney, leaving only firebox empty. Local origin is brick front at lower firebox center, +Z livingward/+X width/+Y up. Void width 1.04/height 0.64 m, Y=0.23–0.87 m above floor/depth 0.55 m. Put closed black metal plates thickness 0.025 m at back/sides/top/bottom, bounded by the void. Front ring width 0.025/thickness 0.015 m recesses into brick front without livingward projection. Both brick/firebox remain visible; create no flames/flue/combustion.

Mantel spans full brick-front width 1.60/depth 0.55/height 0.10 m, Y=[1.30,1.40] m above floor, meeting brick top at one boundary. Top/bottom/four sides are mantel; all metal plates firebox/front ring firebox-trim. Wood UV uses width U/depth V; black plates project local horizontal/vertical meters. Position/size stay within [interior-front reservation](../spaces/envelope/left.md#chimney-roof-interface) without expanding into fireplace-front route 0.90 m. Source owner is `src/models/furnishings/living.ts`; compare black/brick/wood in [fixed model views](00-model-frame.md#model-review-set)/reference 04 front living view. Actual source/render realization is unverified here.

With brick opening front local Z=0, firebox-trim is a four-board thin ring Z=[−0.015,0] m, outer X=[−0.52,0.52]·Y=[0.23,0.87] m, inner void X=[−0.495,0.495]·Y=[0.255,0.845] m, width 0.025 m. Divide board end meetings into 45° miters. Back meets metal inlet at faces; front does not project beyond brick.

Firebox rear plate X=[−0.52,0.52]·Y=[0.23,0.87]·Z=[−0.55,−0.525] m; side plates X=[−0.52,−0.495]·[0.495,0.52], Y=[0.255,0.845]·Z=[−0.525,−0.015] m. Top/bottom share X=[−0.52,0.52]·Z=[−0.525,−0.015] m and respectively Y=[0.845,0.87]·[0.23,0.255] m. Five plates meet only at ends within brick void. Mantel is closed X=[−0.80,0.80]·Z=[−0.55,0]·Y=[1.30,1.40] m about the same firebox center, matching left-owner brick-front reservation X=[−5.50,−4.95]·Z=[−3.00,−1.40] m and contacting brick top Y=1.30 m with its bottom.

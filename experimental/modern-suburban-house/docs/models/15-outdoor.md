# Terrace furniture and exterior board prototypes

## Terrace table {#terrace-table}
<!--
@evidence principles/core/common.md#scope-preservation Own table envelope 1.40×0.80 m/top 0.74 m, plank top/four legs, top/leg ids, no articulation, source src/models/furnishings/outdoor.ts and front/side observations; instances owns position/yaw.
@evidence principles/core/common.md#substantive-completion Top Y=[0.71,0.74], six planks width 0.125 m/gaps 0.01 m and square legs 0.05 m centered X=±0.675/Z=±0.375 m are numeric. Six planks/five gaps sum to top width 0.80 m.
@evidence principles/core/common.md#declared-basis L=1.40/W=0.80/top 0.74 m are model decisions fitting four seats/pulled-out chairs inside reservation half-width 1.35 m. Leg X intervals meet seat-width ends ±0.65 m with no interior overlap.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Add plank division, leg X=[-0.70,-0.65]·[0.65,0.70] and seat centers local X=±0.35 m to terrace reservation. Add floor-plan-center origin as furniture-frame exception.
@evidence principles/design/models.md#representation-contract Plank top/four 0.05 m square legs, top/leg surfaces, no articulation/envelope 1.40×0.80×0.74 m support only top/plank-gap readability, not grain/construction durability; omit screws/foot caps, leaving grain to materials.
@evidence principles/design/models.md#spatial-convention Origin floor-plan center/+X long direction/Y=0 terrace top is an exception because four seats use both long sides.
@evidence principles/design/models.md#reviewable-structure Model-review front/side views falsify top 0.74 m/plank gaps, top/leg partitions, with no articulation region.
@evidence principles/design/models.md#model-observable-style-basis Define only six planks with 0.01 m gaps and 0.05 m corner legs, without style/material/color/light labels.
@evidence principles/design/models.md#model-scale-layer-completion Reference-scale link, envelope 1.40×0.80×0.74 m, top Y=[0.71,0.74]/leg layers, ids/front-side observations and six planks/five gaps exactly filling 0.80 m are specified together.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consume terrace-plan furniture area 2.70 m/four-person use unchanged; table 1.40×0.80 m fits without parent revision.
@evidence settings/00-production.md#use-profile Two adults/two children yield two seats per long side; width 0.60 m yields seat intervals [-0.65,-0.05]·[0.05,0.65].
@evidence settings/10-house.md#site-identity Realize the rear paved-terrace table as plank prototype 1.40×0.80 m/top 0.74 m, consuming reservation/use assumptions directly.
@evidence spaces/site/terrace.md#garden-terrace-plan X=[1.50,4.20]/Z=[-14.10,-11.40] m is the furniture-use reservation; table at its 2.70×2.70 m center uses half-width 1.35 m as seating limit.
@evidence obligations/design/models.md#addressable-model-decisions Separate table from chairs/siding so envelope/top divisions/frame exception/ids have independent addresses; instances retains terrace positions.
@evidence obligations/design/models.md#model-review-set Fixed front/side views compare top 0.74 m/plank gaps across revisions.
-->

Adopt the backyard table beyond reference 03's garden doors as a small four-person plank table. References 01/02 do not ground its shape. Derive dimensions from terrace reservation/four seats rather than projected photograph length.

Prototype fits [terrace reservation](../spaces/site/terrace.md#garden-terrace-plan) use area 2.70×2.70 m. Later instances chooses center placement/yaw. Length 1.40 m(local X), width 0.80 m(local Z), top 0.74 m are model decisions fitting two adults/two children, two per long side, including pulled-out chairs within half-width 1.35 m. As [furniture-frame](00-model-frame.md#model-furniture-local-frame) exception for two-sided four-seat use, origin is floor-plan center/+X long axis/Y=0 terrace top. Compare [reference scale](00-model-frame.md#model-reference-scale).

Parts are plank top/four legs. Top Y=[0.71,0.74]; six planks running local X, each width 0.125 m with gaps 0.01 m, fill 6×0.125+5×0.01=0.80 m. Square legs 0.05 m have outer faces aligned to top corners, centers X=±0.675/Z=±0.375 m. Long-side seats center X=±0.35 m, width 0.60 m gives [-0.65,-0.05]·[0.05,0.65]. Leg X=[-0.70,-0.65]·[0.65,0.70] meets seat ends without entering knee width. Ids are [naming-rule](00-model-frame.md#model-surface-partition-naming) `top`, `leg`; no articulation.

Omit plank screws/foot caps; materials owns grain. Source owner is `src/models/furnishings/outdoor.ts`. Observe top 0.74 m/plank gaps in [model-review](00-model-frame.md#model-review-set) front/side views. All observations are unverified.

## Terrace chair {#terrace-chair}
<!--
@evidence principles/core/common.md#scope-preservation Own one four-use chair prototype envelope 0.50×0.55 m/seat 0.45/back 0.85 m, seat/four legs/two back posts/three planks, seat/leg/back ids/source; instances derives positions.
@evidence principles/core/common.md#substantive-completion Define four seat planks Y=[0.42,0.45], square legs 0.035 m/two back posts/three planks height 0.08/thickness 0.02 m. Tilt axis parallels local X at Y=0.45/Z=0.09 m; Z(Y)=0.09−(Y−0.45)tan 8° keeps top inside depth.
@evidence principles/core/common.md#declared-basis Pulled-out rear extent table half-width 0.40+pull 0.30+chair depth 0.55=1.25 m fits reservation half-width 1.35 m. Seat 0.45 m is 0.29 m below table; width 0.50 m leaves 0.20 m between centers 0.70 m apart.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Add armless envelope, fixed-axis 8° back tilt and rear-leg rear edge local Z=0; pulling is placement change rather than articulation.
@evidence principles/design/models.md#representation-contract Rigid seat/four legs/two back supports/three planks, seat/leg/back surfaces/envelope 0.50×0.55×0.85 m support no grain/durability inference; omit screws/back curvature/foot caps.
@evidence principles/design/models.md#spatial-convention Rear-leg rear edge local Z=0/+Z table-facing front; rear-leg center Z=0.0175 m/tilt axis Y=0.45/Z=0.09 m.
@evidence principles/design/models.md#reviewable-structure Side view falsifies seat/tilt; pulled-out four-chair plan tests reservation fit with seat/leg/back partitions.
@evidence principles/design/models.md#model-observable-style-basis Specify armless four-plank seat/three 8°-tilted back planks, without a style label.
@evidence principles/design/models.md#model-scale-layer-completion Define envelope/seat/back heights, plank/leg/post sections, tilt axis/depth occupancy, three ids, no articulation and side/plan observations.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Combine unchanged terrace 2.70 m use area with this layer's table half-width 0.40 m; pulled-out end 1.25 m fits without parent revision.
@evidence settings/10-house.md#site-identity Realize the rear paved-terrace chair as armless 0.50×0.55 m prototype, consuming reservation/use assumptions directly.
@evidence spaces/site/terrace.md#garden-terrace-plan For X=[1.50,4.20]/Z=[-14.10,-11.40] m, pull 0.30 m from table edge gives rear extent 1.25 m within half-width 1.35 m.
@evidence obligations/design/models.md#reference-scale Compare chair depth 0.55+table half-width 0.40+pull 0.30 m with reservation half-width 1.35 m; this H2 does not name the common scale reference itself.
-->

Adopt reference 03's chairs beyond garden doors as armless plank chairs. Exclude references 01/02 as shape grounds; compare pulled-out dimensions with terrace-use reservation rather than photograph proportions.

One prototype consumes [terrace reservation](../spaces/site/terrace.md#garden-terrace-plan)/four-person [use assumptions](../settings/00-production.md#use-profile); later instances derives count/positions from table half-width 0.40 m/chair depth. Envelope width 0.50/depth 0.55/seat 0.45/back 0.85 m, no arms. Seat 0.45 m gives table-top 0.74 minus 0.29 m, matching [dining-chair](10-kitchen-dining.md#dining-chair) posture. Width 0.50 m leaves gap 0.20 m between long-side centers 0.70 m apart; depth 0.55 m keeps pulled-out end 1.25 m within half-width 1.35 m. Follow [furniture coordinates](00-model-frame.md#model-furniture-local-frame), rear line at rear-leg back/+Z tableward. Pull 0.30 m from table edge: center-relative rear extent 0.40+0.30+0.55=1.25 m.

Parts: seat/four legs/two back posts/three back planks. Seat Y=[0.42,0.45] m/Z=[0,0.55] m uses four planks 0.13 m/three gaps 0.01 m. Legs 0.035×0.035 m center X=±0.21/rear Z=0.0175/front Z=0.51 m; rear back Z=0 is origin line, legs support Y=[0,0.45]. Back posts 0.035 m start within seat Y=0.42/end Y=0.85 m. Local-X-parallel tilt axis Y=0.45/Z=0.09 m and centerline `Z(Y)=0.09−(Y−0.45)tan(8°)`. Three planks span posts, width 0.42/height 0.08/thickness 0.02 m at Y=[0.55,0.63]·[0.66,0.74]·[0.77,0.85], centers following that law. Top center Z≈0.0338 m minus post half-thickness 0.0175 leaves 0.0163 m>0, within rear boundary Z=0. All post/plank faces back, legs leg/seat seat. No articulation; 8° is fixed geometry. Omit screws/back curvature/foot caps; geometry verifies no grain/outdoor durability. Source owner is `src/models/furnishings/outdoor.ts`. Observe seat/tilt/rear boundary laterally and four pulled-out chairs' plan fit. Actual source/frames are unverified.

## Lap-siding board section {#lap-siding-board}
<!--
@evidence principles/core/common.md#scope-preservation Own board wedge/height 0.18/overlap 0.03/exposure 0.15 m, L parameter/frame/ids/source src/models/exterior/siding.ts. Instances owns start/cuts/count; exterior-corner-trim owns end molding.
@evidence principles/core/common.md#substantive-completion Height 0.18 m/wedge thickness bottom 0.018 to top 0.006 m, upper-board back resting on lower front through overlap 0.03 m and square ends are specified.
@evidence principles/core/common.md#declared-basis Height 0.18=exposure 0.15+overlap 0.03 m; overlap grounds are material-readability course-shadow requirements. Actual product exposure/thickness comparison remains inference pending external sources.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Add exposure 0.15/overlap 0.03/wedge 0.018→0.006/height 0.18/difference 0.012 m/front slope arctan(0.012/0.18) to consistent horizontal settings texture.
@evidence principles/design/models.md#representation-contract Extrude wedge board length L with siding-face/butt/back/top/cut surfaces, no articulation; product comparison remains inference.
@evidence principles/design/models.md#spatial-convention Origin is lower-edge length center on board back; +X length/+Y up/+Z outward weather normal.
@evidence principles/design/models.md#reviewable-structure Side orthographic section falsifies wedge/overlap 0.03 m; front tests siding-butt horizontal shadow per course.
@evidence principles/design/models.md#model-observable-style-basis Resolve lap-siding label into wedge/upper overlap 0.03 m/horizontal butt shadow, assigning end molding to exterior-corner-trim.
@evidence principles/design/models.md#model-scale-layer-completion This H2 owns section/exposure, instances L/cuts/count and trim owner end molding, with side/front observations.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consume consistent horizontal settings courses/spaces wall boundaries, choosing exposure 0.15/overlap 0.03 m here without parent revision.
@evidence settings/20-verification.md#visual-grammar Consistent courses ground height 0.18 m(exposure 0.15+overlap 0.03); provide siding-butt thickness face for instance repetition.
@evidence obligations/design/models.md#representation-ceiling Infer no actual-product exposure/thickness match before external-source confirmation; all observations unverified.
@evidence obligations/design/models.md#model-representation-completion Allocate board section/exposure here, actual L/cuts to instances/end molding to trim owner; retain product comparison limit without separate structural/semantic completion verdicts.
-->

Building classification: envelope — siding attached to exterior walls.

Adopt reference 01's continuous horizontal white lap-siding courses/shallow butt shadows. Reference 02's cutaway wall assists only seam location; do not back-calculate height/thickness from pixels.

For [material readability's](../settings/20-verification.md#visual-grammar) consistent courses, this prototype defines section/exposure 0.15 m. [Course repetition](../instances/03-exterior-repetition.md#siding-course-law) consumes it for start datum/cuts/count. Length-L wedge boards receive L from instances' wall intervals/opening cuts. Origin is lower-edge length center on back/exterior-wall substrate, +X length/+Y up/+Z outward weather normal.

Height 0.18 m is exposure 0.15+upper overlap 0.03 m, grounded in [readability](../settings/20-verification.md#visual-grammar) of consistent courses as horizontal shadow lines at review distance. Prototype defines exposure/overlap; instances repeats them. Overlap 0.03 m creates a butt thickness face per board. Wedge bottom 0.018/top 0.006 m differs by 0.018−0.006=0.012 m; front slope arctan(0.012/0.18). In overlap, upper back contacts lower front without an extra 0.012 m translation. Square-cut ends receive [corner-trim](#exterior-corner-trim) molding. Actual product comparison remains inference pending external sources.

Ids: weather `siding-face`, lower thickness `siding-butt`, substrate-facing `siding-back`, upper thickness `siding-top`, ends/opening cuts `siding-cut`; every end has exactly one. Front UV starts lower-left, meter length U/height V; cuts reproject edge-length U/thickness V. No articulation. Source owner `src/models/exterior/siding.ts`. Observe side wedge/overlap 0.03 m and front butt shadows per course; all unverified.

Length-L/height-0.18 m siding-face is the weather wedge thinning 0.018→0.006 m. Butt is lower L×0.018 m, top upper L×0.006 m, back structural-wall plane L×0.18 m. Cut closes section height 0.18 m/thickness 0.006–0.018 m at each length end/opening. These five ids are different faces of one wedge, not arbitrary color patches.

Each siding-cut at local X=−L/2·L/2 or an opening cut closes Y=[0,0.18] m/weatherward thickness 0.006–0.018 m without extending L.

## Exterior corner trim {#exterior-corner-trim}
<!--
@evidence principles/core/common.md#scope-preservation Own closed two-wing L-trim at exposed right-angle main/garage corners without duplicating structural walls/siding cuts.
@evidence principles/core/common.md#substantive-completion Each wing width 0.075/weather projection/thickness 0.035 m stands 0.005 m beyond maximum siding butt 0.030 m. Define start/end input lines/all closed-face ids.
@evidence principles/core/common.md#declared-basis Exposed corners/end heights come from spaces/07-boundary-assembly.md#exterior-boundary-junctions and elevation ground/eave/gable cuts; white projecting trim readability from settings visual-grammar.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Add independent closed L-board owner, width 0.075/front 0.035 m and single meeting-wing junction separate from structural bodies.
@evidence principles/design/models.md#representation-contract Two wings form one closed right-angle rigid section; every front/side/back/end belongs to exterior-trim.
@evidence principles/design/models.md#spatial-convention Two weather-face intersection is local Y; first elevation +X/neighbor +Z; start is their actual exposed lower intersection.
@evidence principles/design/models.md#reviewable-structure Side sections/exteriors at front/side corners and high/low roofs falsify continuous two-face contact without eave/opening/plinth penetration.
@evidence principles/design/models.md#model-observable-style-basis Adopt reference 01 white main-gable/garage corner boards through shallow two-face projection/vertical shadow, without pixel-derived width.
@evidence principles/design/models.md#model-scale-layer-completion Define L width/thickness/projection, height inputs/end rules, UVs/ids/source; later instances derives actual corner lengths/positions from original boundaries.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work exterior-boundary-junctions assigned structural corners but only forbade trim fragmentation, leaving independent boards ownerless. Correct the parent to distinguish/handoff structural corners and closed model trim.
@evidence settings/20-verification.md#visual-grammar White trim explains junctions through projection/shadow; front 0.035 m stands 0.005 m beyond maximum butt 0.030 m.
@evidence spaces/07-boundary-assembly.md#exterior-boundary-junctions Spaces retains front/rear/garage structural corners; only the two-weather-face intersection is closed-trim placement input.
@evidence contracts/surface-ownership.md#whole-surface-owner Separate structural walls/siding cuts/independent closed L-trim owners without duplicating end faces.
-->

Building classification: envelope — exterior-corner trim.

Adopt reference 01's vertical white main-gable/garage corner boards. Spaces creates [corner bodies](../spaces/07-boundary-assembly.md#exterior-boundary-junctions); this prototype creates only one closed L-trim on the outer weather-face intersection. Duplicate no wall/siding cuts/eave fascia/window-door casing.

Origin is the actual exposed lower intersection. +Y up; +X/+Z follow neighboring wall faces away from corner, weather planes local X=0/Z=0. Closed projecting XZ section vertices are `(-0.035,-0.035) → (0.075,-0.035) → (0.075,0) → (0,0) → (0,0.075) → (-0.035,0.075)` m. Each wing extends 0.075 m along wall/projects 0.035 m/thickness 0.035 m. Maximum siding butt 0.030 m leaves trim 0.005 m ahead, hiding end cuts. Courses meet inner trim X/Z=0.075 m without overlap behind trim. Common corner square occurs once rather than overlapping boxes. Lower end follows actual exposed wall start, upper eave underside/gable slope intersection; cut/close there without ground/plinth/roof penetration. Where boundaries differ by height, clip each wing while retaining one closed common-corner junction. Later instances reads corner list/actual lengths from spaces.

Extrude the six-vertex section through actual height, closing all front/side/back/top/bottom/cuts once, every triangle exterior-trim. Meter UV starts at each wing's outer lower face, vertical length U/horizontal width V; reset direction per wing at folded corner. Top/bottom/back cuts restart lower-left at the same scale. Rigid source `src/models/exterior/trim.ts`; [white trim material](../materials/01-exterior.md#trim-white) receives id. Inspect front/side/garage exteriors/sections for two-face contact/vertical shadow/no plinth-eave penetration. Actual source/GPU frames are unverified.

Split exposed corner runs into separate vertical members ending at actual roof-eave/garage-roof intersections and restarting above. Close cut tops/bottoms exterior-trim without extending into shingles/fascia. At fence-wall contacts subtract wall-side intervals occupied by fence end posts, with separate ends above/below. Derive intersection/post world coordinates from both owners' compiled boundaries, without guessed fixed heights.

## Asphalt-shingle strip section {#asphalt-shingle-strip}
<!--
@evidence principles/core/common.md#scope-preservation Own tab width/thickness/exposure 0.14 m pairing, eave/valley/ridge cuts and valley/chimney/garage-roof-main-wall flashing; instances owns course placement/order/ids.
@evidence principles/core/common.md#substantive-completion Define length 1.00/height 0.30 m, three tabs 0.330 m, grooves width 0.005/depth 0.14 m, wedge 0.010→0.002 m, overlap 0.16 m, starter/ridge/flashing variants and slope/contact-line UVs/seams.
@evidence principles/core/common.md#declared-basis Strip height/tab width/thickness are branch choices absent from settings/spaces, grounded in small regular dark overlap/double covering at exposure 0.14 m; product dimensions remain inference.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Add exposure 0.14/tab 0.330(half 0.165)/overlap 0.16/butt step about 0.004 m per course to settings' small overlap texture.
@evidence principles/design/models.md#representation-contract Rigid substrate-contact wedge/starter/ridge-cap/metal flashing variants/plane clipping permit only course overlap volume; separate metal interfaces via local lift 0.003 m. Omit nails/adhesive/granules.
@evidence principles/design/models.md#spatial-convention Furniture-frame exception: origin lower-butt length-center underside, +X length/+Z outward roof normal/+Y uphill ridgeward.
@evidence principles/design/models.md#reviewable-structure Side section tests wedge/overlap 0.16 m; front three tabs/grooves/half-tab offset; shingle-cut/ridge-cap symmetry are falsifiable boundaries.
@evidence principles/design/models.md#model-observable-style-basis Dark shingles become three-tab strips, groove vertical texture/butt-step horizontal texture; materials owns color.
@evidence principles/design/models.md#model-scale-layer-completion Exposure 0.14/height 0.30 m, strip/variant/cut layers, four shingle ids/roof-flashing, wall height 0.15 m, omissions/observations define expression.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consume pitches 8/12·9/12·7/12·5/12/weather functions/shared edges/face allocation; exposure 0.14 m is this prototype's choice, without parent revision.
@evidence settings/20-verification.md#visual-grammar Realize small regular dark overlap as three-tab strips width 0.330 m and course butt steps.
@evidence spaces/roof/00-junctions.md#roof-profile-datums Weather functions/pitches set substrate/ridge-cap angles; underside vertical reservation 0.24 m bounds wedge maximum 0.010 m.
@evidence spaces/roof/00-junctions.md#roof-shared-edges Shared valley/step/chimney lines govern strip cuts/metal flashing owned here.
@evidence spaces/envelope/right.md#right-roof-closures Receive garage-roof/shared-wall contact and flashing height 0.15 m as local metal bend height.
@evidence spaces/roof/00-junctions.md#roof-mass-allocation Eave lines align starter/course-0 butts.
@evidence obligations/design/models.md#representation-ceiling Show only overlap geometry without waterproofing/adhesion/granule/wind-load claims.
@evidence obligations/design/models.md#articulation-ownership Strips/starter/ridge-cap/flashing are rigid without pivots or motion interfaces.
-->

Building classification: envelope — sloped-roof covering.

Adopt reference 01's dense horizontal dark-gable courses/small tabs. Reference 02's roofless upper cutaway supplies no shingle-shape grounds. Exposure/steps follow model dimensions rather than photograph proportions.

For [material readability's](../settings/20-verification.md#visual-grammar) small overlap, define exposure 0.14 m/tab width/thickness here. [Course repetition](../instances/03-exterior-repetition.md#shingle-course-law) derives eave-to-ridge order/odd half-tab offset/member ids. One three-tab strip realizes the small regular dark overlap. As [furniture-frame](00-model-frame.md#model-furniture-local-frame) exception, origin is lower-butt length-center underside, +X strip length/+Z outward normal/+Y uphill ridgeward. Instances derives placement/rotation from [weather-face functions](../spaces/roof/00-junctions.md#roof-profile-datums).

Strip length 1.00/height 0.30 m; two grooves width 0.005/depth 0.14 m from butt yield three tabs 0.330 m (3×0.330+2×0.005=1.000 m). Height 0.30=exposure 0.14+overlap 0.16 m covers every roof point with at least two strips; half-tab offset 0.165 m places grooves below upper-tab centers. Length/height/tab width are branch choices absent from settings/spaces, grounded in small regular texture repeating several times per meter horizontally/vertically through exposure 0.14/tab 0.330 m. Actual product comparison remains inference pending external sources.

Wedge underside meets substrate, thinning butt 0.010→top 0.002 m. Upper courses' undersides use the same substrate, permitting overlap-volume intersection with lower strips. At upper butt, 0.14 m above lower butt, lower thickness 0.010−0.008×0.14/0.30≈0.006 m gives course butt step about 0.004 m/horizontal shadow. Maximum 0.010 m lies within [vertical underside reservation 0.24 m](../spaces/roof/00-junctions.md#roof-profile-datums). Instances owns weather functions/top alignment.

Use two variants/one operation at eaves/edges. Ungrooved same-section `starter` aligns its butt to [face-allocation](../spaces/roof/00-junctions.md#roof-mass-allocation) eave below course 0. At gable ends/valleys/steps/chimneys, clip with planes through [shared edges](../spaces/roof/00-junctions.md#roof-shared-edges) perpendicular to roof faces, closing shingle-cut. At valleys, cut both faces 0.05 m back from shared line. Beneath, one folded roof-flashing strip centered on line spans width 0.10 m/thickness 0.003 m on each roof face: total center 0.10 m exposed/outer 0.05 m each hidden. Ends follow actual valley segments; only necessary longitudinal joins overlap 0.04 m. At four chimney contacts, bent metal follows shared outline with roof width 0.12/chimney height 0.08/thickness 0.003 m; corners overlap 0.04 m. Embed at least 0.06 m under shingle cuts and contact brick without recreating chimney/roof structure. To prevent metal penetration, lift shingle undersides over metal 0.003 m along substrate normal, then linearly return to zero across 0.02 m beyond metal outer ends. Preserve valley cuts/chimney outlines. Instances derives segment/outline lengths/rotations from spaces. Clip last courses at ridge and cover with `ridge-cap`: one tab width 0.330/length 0.30 m folded symmetrically to both roof pitches; ridge-direction exposure 0.14/thickness uniform 0.006 m.

At garage-roof/main shared-wall contacts use L-flashing consuming [right-elevation](../spaces/envelope/right.md#right-roof-closures) wall height 0.15 m. Origin front contact-line end, local U tangent/V downslope/N wall-to-roof. Wall leg height 0.15 m/roof leg width 0.12 m along slope/both thickness 0.003 m. Roof-leg outer 0.06 m hides under shingles/inner 0.06 m exposed; shingle bottoms lift normal 0.003 m over metal and return over 0.02 m beyond its outer end as above. Fold is continuous metal with both legs; instances derives contact length/rotation from spaces. Ends stop at contact ends, overlapping longitudinally 0.04 m only if joins are needed. Duplicate no wall/roof structure; every front/back/cut uses roof-flashing. Claim no actual waterproofing.

Ids shingle-face, shingle-butt(lower thickness), shingle-back, shingle-cut; folded metal front/back/cuts roof-flashing. [Shingle material](../materials/01-exterior.md#roof-shingle) binds four dark ids; [charcoal metal](../materials/01-exterior.md#window-frame-charcoal) binds flashing. All variants are rigid/no pivots. Omit nails/adhesive/granules/waterproofing/wind-load performance. Source `src/models/exterior/shingle.ts`. [Model-review](00-model-frame.md#model-review-set) side sections observe wedge/0.16 m overlap/0.004 m step, front three tabs/grooves/half-tab regular texture and ridge cap seated symmetrically. All unverified.

Shingle-face/starter tops use left-lower butt UV origin, length +X U/uphill +Y V at 1 UV/m. Back restarts underside lower-left with same physical axes; butt/cut use each face's long-edge U/thickness V. Break at grooves/course cuts/starter ends while continuing one strip's top. Ridge-cap uses ridgeward U/downhill V per side, restarting V at ridge fold. Flashing uses continuous strip start/contact-line U/wall-or-slope width V, with V continuous at bends and seams broken at physical overlaps at valleys/chimney corners/wall joins. Metal backs/thickness cuts 0.003 m use 1 UV/m.

Shingle-butt closes lower cut at local Y=0/length X=[−0.50,0.50] m/normal thickness 0.010 m. Back uses same X/slope Y=[0,0.30] m touching roof substrate, behind wedge 0.010→0.002 m. Cut closes wedge thickness 0.002–0.010 m/Y=[0,0.30] at X=−0.50·0.50 or shared roof cuts without extending beyond boundaries.

## Exposed-eave gutters and downspouts {#eave-gutter-downspout}
<!--
@evidence principles/core/common.md#scope-preservation Own exposed horizontal-eave gutters/downspouts at drainage-run ends without duplicating roof/ridge/wall faces.
@evidence principles/core/common.md#substantive-completion Define gutter width 0.12/depth 0.08/metal thickness 0.003 m, downspout section 0.08×0.06 m/thickness 0.003 m, end-selection rules/ids.
@evidence principles/core/common.md#declared-basis Receive actual shared edges handed to later eave/gutter members by spaces/roof/main-front.md#main-front-roof.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Convert exposed eave lines into U-section collectors/downward pipes without rainwater-performance claims.
@evidence principles/design/models.md#representation-contract Open-top U-section/closed tube faces use gutter/downspout; omit individual screws/internal drainage.
@evidence principles/design/models.md#spatial-convention Origin is roof-source eave start; U tangent length/V section circumference, without duplicated world endpoints.
@evidence principles/design/models.md#reviewable-structure Reference-01 exterior/eave section tests roof-edge attachment/no window-door obstruction.
@evidence principles/design/models.md#model-observable-style-basis Thin metal collector/vertical-pipe projection/shadows express eave ends; materials owns color.
@evidence principles/design/models.md#model-scale-layer-completion Define section/thickness/selection/origin/UV/ids/contact limits; actual drainage performance unverified.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Consume shared eave lines/exposed walls without moving roof/openings.
@evidence spaces/roof/main-front.md#main-front-roof Receive shared eave/gutter edge as continuous input line.
@evidence settings/20-verification.md#visual-grammar Real-thickness gutters realize reference-01 envelope edges/projecting members.
@evidence obligations/design/models.md#addressable-model-decisions Separate shingles/gutters into independent H2s, avoiding mixed surfaces/repetition rules.
-->

Building classification: envelope — drainage members attached to eaves/walls.

Adopt reference 01's horizontal eave collectors/vertical downspouts. [Exposed eaves](../spaces/roof/main-front.md#main-front-roof) receive roof-owner segment lists; duplicate no roof/fascia. Gutter open-top U width 0.12/depth 0.08/thickness 0.003 m hangs 0.03 m outward/0.025 m downward from drip edge. Outer/inner/both cut ends share gutter id. Choose externally viewed right end of each connected run for downspout, switching left if its vertical strip is within 0.15 m of opening trim. If both ends are blocked, stop and return to roof/elevation owner rather than forcing penetration. Downspout closed rectangular tube section 0.08×0.06 m/wall 0.003 m is 0.02 m clear of weather face, from eave underside to 0.10 m above ground; exposed tube/end faces share id. Derive lengths from input eave endpoints/elevation ground, with no separate world coordinate list. Meter UV length U/section circumference V breaks at elbows/ends. Elbows radius 0.10 m/90° use four tube segments with downspout id. Proxy proves no drainage/storm-pipe connection/loads. Source `src/models/exterior/drainage.ts`; actual contacts/GPU frames unverified.

Open the tube start at each selected gutter bottom center. Local depth d=0 is fixed exterior substrate, positive outward. Vertical tube center depth is rear clearance plus half normal thickness, 0.02+0.06/2=0.05 m. Align gutter outlet/tube centers in eave-tangent coordinate; connect depth difference via upper horizontal tube/two 90° elbows as one downspout path. First tangent is 0.10 m below outlet; second at least 0.20 m away in depth; remaining depth difference uses straight span between tangents. If input boundaries lack horizontal turn space 0.20 m, stop rather than folding arbitrarily/passing through another wall. Cut lower vertical end horizontally 0.10 m above ground.

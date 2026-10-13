# Coat and linen closet fittings

## Sliding leaves of the under-stair coat closet {#coat-closet-doors}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns two coat-closet sliding leaves, each 0.50 m wide, 2.11 m high and 0.03 m thick, tracks, handles and three casing boards outside the opening.
@evidence principles/core/common.md#substantive-completion It defines rear-track d=[0.07,0.10] and front-track d=[0.11,0.14] m from X=1.87 m, both closed Z ranges and casing bottom Y=0/head Y=[2.15,2.20] m. Casing corridor end X=2.035 < 2.07 m and leaf corridor end including recessed handles X=2.01 < 2.07 m.
@evidence principles/core/common.md#declared-basis Opening and projection limits come from spaces/rooms/entry.md#entry-coat-storage.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It turns entry-coat-storage's two overlapping sliding leaves into leaf dimensions and track coordinates.
@evidence principles/design/models.md#representation-contract It defines two leaves, tracks, recessed panels and three casing boards outside the opening.
@evidence principles/design/models.md#spatial-convention Local X parallel to opening width is the leaf movement axis, distinct from local depth d.
@evidence principles/design/models.md#reviewable-structure The service-corridor front view and under-stair section can falsify it.
@evidence principles/design/models.md#model-observable-style-basis It adopts the white storage doors beside the stairs in reference 04. Two recessed panels continue the interior doors' white panel-door vocabulary.
@evidence principles/design/models.md#model-scale-layer-completion It defines the sliding interface and track layer.
@evidence obligations/design/models.md#articulation-ownership Each leaf has local-X translation of 0–0.45 m as its motion interface, with closed as the reference state.
@evidence spaces/rooms/entry.md#entry-coat-storage Accepting the entry owner's fixed-body/opening boundary, this model receives two 0.50 m leaves for a 0.95 m opening, 0.05 m overlap and maximum corridor-side local depth 0.14 m.
@evidence spaces/07-boundary-assembly.md#interior-boundary-ownership Opening faces in fixed closet walls remain in spaces; coat-closet sliding leaves, tracks and casing are separate model solids.
@evidence contracts/reservation-fit.md#reservation-fit Track local-depth end 0.14 m stays within the 0.15 m boundary; casing is outside the opening's Z span with corridor end X=2.035 < 2.07 m.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work entry-coat-storage originally assigned leaves and the rod to entry.ts, although that source contained only walls and an opening. The parent H2 was corrected to assign walls/opening to spaces and leaves/rod/shelf to models. spaces/07-boundary-assembly.md#interior-boundary-ownership was corrected for the same ownership contradiction in storage doors filling room faces, handing the closed storage-door prototype to this H2.
-->

Adopt the white storage doors beside the stairs in reference 04. Sliding overlap and track depth come from the entry reservation; the photograph's hinged-door angle is not imposed.

This model places two overlapping sliding storage leaves at X = 2.02 m reserved by the [entry coat closet's fixed-body/opening owner](../spaces/rooms/entry.md#entry-coat-storage). The leaves filling `entry-coat-opening`, Z = [-4.51, -3.56], Y = [0, 2.15] m, are each 0.50 m wide (half of 0.95 m plus half of the 0.05 m overlap), 2.11 m high (excluding the 0.03 m head track and 0.01 m floor clearance) and 0.03 m thick. Within local depth d ∈ [0, 0.15] m measured from the rear boundary toward the corridor, place the front track at d = [0.11, 0.14] m and rear track at d = [0.07, 0.10] m. Thickness 0.03 m and overlap 0.05 m are model decisions fitting both tracks within the 0.15 m boundary and hiding the closed-leaf gap in front view. Recess one handle into each leaf's corridor face, centered 0.04 m outward from the meeting line and 1.00 m above finished floor, 0.10 m wide, 0.025 m high and 0.02 m deep. The front handle does not project beyond the leaf face, remaining at d = 0.14 m within the owner's corridor-side projection limit d = 0.20 m. Each leaf's motion interface is translation along local X parallel to opening width, from 0 to leaf width minus 0.05 m; both reference states are closed. Use two recessed panels matching the [interior doors](03-interior-doors.md#interior-door-members) to continue the white panel-door vocabulary. The source owner is `src/models/closet.ts`; inspect from the service-corridor front view and under-stair section.

Track depth d=0 is the [opening's rear boundary](../spaces/rooms/entry.md#entry-coat-storage), X=1.87 m, and +d points corridorward along +X. Front leaf X=[1.98,2.01] and rear leaf X=[1.94,1.97] m follow. Each of the two `rail` bottom plates occupies its own X depth across opening Z=[−4.51,−3.56] m at Y=[0,0.01] m; its head plate occupies Y=[2.12,2.15] m. Leaf Y=[0.01,2.12] m meets these plates only at faces. Closed front leaf Z=[−4.51,−4.01] and rear leaf Z=[−4.06,−3.56] m produce 0.05 m frontal overlap at Z=[−4.06,−4.01] m in separate depth layers. The front leaf moves +Z and rear leaf −Z, each by 0–0.45 m; at 0.45 m either fully overlaps the other's closed Z span in front view. Handle-groove Z centers are −4.075 and −3.995 m, each 0.04 m outward from meeting midpoint Z=−4.035 m. The near edge of each 0.10 m wide groove stays 0.005 m from its panel edge, avoiding intersection with the panel recess. Each leaf's two recessed panels inherit heights [0.18,0.86] and [0.98,1.98] m, 0.12 m end margins and depth 0.008 m from the [interior-door panels](03-interior-doors.md#interior-door-members). From each leaf's longitudinal start, panel local-Z width is [0.12,0.38] m; recess floors and four reveals on both faces are `leaf-panel`. Leaf corridor end X=2.01 m and casing end X=2.035 m remain within the parent's X≤2.07 m corridor limit.

Closed white `casing` consists of three boards on the wall outside the opening width. Jamb boards occupy X=[2.02,2.035] m, Z=[−4.56,−4.51]·[−3.56,−3.51] m, Y=[0,2.15] m. The head occupies X=[2.02,2.035] m, Z=[−4.56,−3.51] m, Y=[2.15,2.20] m. Each is 0.05 m wide and projects 0.015 m from the interior wall; jambs reach finished floor. Head and jambs meet only at Y=2.15 m without entering opening/leaf/track Z width. Farthest X=2.035 m is 0.035 m inside permitted corridor end X=2.07 m. All board faces are `casing`; project length U/width V at 1 UV/m from each jamb's bottom or head's left end, restarting seams at cut ends.

Each leaf's `handle` comprises the floor and four reveals of the preceding 0.10 m wide, 0.025 m high, 0.02 m deep recess. Its horizontal center is 0.04 m outward from that leaf's meeting line and vertical center 1.00 m above finished floor; it does not enlarge the leaf envelope. Wood front/back faces outside the groove are `leaf`. For each `handle`, use the groove's lower-left corner as UV origin with horizontal U/vertical V in meters.

Closed coat-closet `leaf` faces comprise broad faces and four end faces of front body X=[1.98,2.01]·Z=[−4.51,−4.01] m and rear body X=[1.94,1.97]·Z=[−4.06,−3.56] m, each at Y=[0.01,2.12] m, excluding two recessed panels and the handle groove. Separate X layers share no closed volume within the 0.05 m frontal overlap.

## Coat-closet rod and shelf {#coat-closet-rod-shelf}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns the rod 0.325 m from the rear coat-closet face and 1.65 m above floor, and upper shelf with top 2.00 m/depth 0.65 m.
@evidence principles/core/common.md#substantive-completion It specifies rod diameter 0.03 m, shelf thickness 0.02 m and clipping at the structural stair underside if they overlap.
@evidence principles/core/common.md#declared-basis Positions come from spaces/rooms/entry.md#entry-coat-storage; structural thickness comes from spaces/02-stair.md#stair-boundary-heights.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It turns the owner's rear-face rod position and floor-relative height into local depth 0.325 m and height 1.65 m.
@evidence principles/design/models.md#representation-contract It defines rod and shelf members.
@evidence principles/design/models.md#spatial-convention It specifies a Z-directed rod.
@evidence principles/design/models.md#reviewable-structure The under-stair section can falsify the shelf/structural-underside relationship.
@evidence principles/design/models.md#model-observable-style-basis It defines storage-member positions without a style label.
@evidence principles/design/models.md#model-scale-layer-completion It defines member layers within body local depth 0.65 m.
@evidence spaces/rooms/entry.md#entry-coat-storage It consumes rod position, shelf top 2.00 m and body depth 0.65 m.
@evidence spaces/02-stair.md#stair-boundary-heights The stair underside is the clipping limit keeping the shelf top below structure.
@evidence contracts/reservation-fit.md#reservation-fit Rod and shelf remain within body local depth [0, 0.65] m.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work entry-coat-storage's original source responsibility included the rod in entry.ts, duplicating this prototype. The parent H2 was corrected to assign only walls/opening to spaces and rod/shelf to models; stair structural heights remain unverified.
-->

Adopt the coat storage near the entry in reference 02 as a rod and upper shelf. Reference 04 does not show the interior, so the reservation sets rod height.

Place the rod along the closet length, 0.325 m corridorward from the owner's rear body face and 1.65 m above floor, as a 0.03 m diameter cylinder. The shelf has top 2.00 m and thickness 0.02 m. Since tracks lie at the boundary outside the body, use entire body local depth d = [0, 0.65] m. If it overlaps the structural stair underside, clip there, preserving the condition that [structural thickness is not zero](../spaces/02-stair.md#stair-boundary-heights). Surface ids are `rod` and `shelf`. The source owner is `src/models/closet.ts`.

The `rod` centerline is X=1.425 m, 0.325 m corridorward from rear body X=1.10 m, and Y=1.65 m above finished floor. Its diameter 0.03 m spans Z=[−4.56,−3.51] m, length 1.05 m. The `shelf` is a 0.65×1.05×0.02 m board filling rear-body X=[1.10,1.75] m, Z=[−4.56,−3.51] m between inner side-wall faces and Y=[1.98,2.00] m. Rod ends and shelf Z ends meet inner side walls; shelf rear X=1.10 m meets the rear wall's inner face. They do not enter tracks/opening at X≥1.87 m.

Use the front view through open doors and a vertical under-stair section to inspect rod-end/shelf-end wall contacts and clipping between shelf top and structural underside. Actual model meshes and contacts are unverified.

## Linen-closet sliding leaves and shelves {#linen-closet-fittings}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns two 0.525 m linen-closet sliding leaves, five shelves and three casing boards outside the opening.
@evidence principles/core/common.md#substantive-completion It defines shelf tops 0.25·0.63·1.01·1.39·1.77 m, wall contact at X=[1.87,3.07] m, leaf height 2.16 m, track depths [0.07,0.10]/[0.11,0.14] m from Z=−3.26 m, closed leaf X spans and each movement 0–0.475 m. Three corridor casing boards extend from floor to Y=2.25 m.
@evidence principles/core/common.md#declared-basis Opening/shelf rules come from spaces/rooms/upper-hall.md#upper-linen-storage.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It turns upper-linen-storage's 0.38 m intervals from 0.25 m into five shelf-top values.
@evidence principles/design/models.md#representation-contract It defines leaves, tracks, shelves and three corridor-side casing boards.
@evidence principles/design/models.md#spatial-convention Shelf depth uses the rear inner face as local depth zero.
@evidence principles/design/models.md#reviewable-structure The corridor arrival view and closet section can falsify it.
@evidence principles/design/models.md#model-observable-style-basis It defines storage members without a style label.
@evidence principles/design/models.md#model-scale-layer-completion It defines the sliding interface and shelf layer.
@evidence obligations/design/models.md#articulation-ownership Linen-leaf local-X translation uses the same motion-interface form as the coat closet.
@evidence spaces/rooms/upper-hall.md#upper-linen-storage It consumes upper-linen-opening X = [1.97, 2.97] m and the five-shelf rule as 0.525 m leaves and explicit shelf tops.
@evidence spaces/07-boundary-assembly.md#interior-boundary-ownership It separates source owners of the fixed linen front wall/opening and sliding leaves/shelves.
@evidence contracts/reservation-fit.md#reservation-fit There is 0.05 m clearance beyond shelf depth 0.55 m; tracks occupy a separate local-depth [0,0.15] m boundary. Casing lies outside rough-opening X and at corridor-side Z≤−3.41 m, sharing no volume with leaves.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work The storage interior outside upper-hall circulation lacked floor finish, so spaces/rooms/upper-hall.md#upper-linen-storage first closed the storage floor and opening finish strip. This H2 consumes revised finished-floor top Y=3.06 m as the rail bottom and creates no floor face.
-->

Adopt the upper-corridor storage doors in reference 05 and corridor storage location in reference 02. Five interior shelves and towels follow storage requirements rather than photographic proportions.

Two sliding leaves fill the [linen-closet owner's](../spaces/rooms/upper-hall.md#upper-linen-storage) `upper-linen-opening`, rough width 1.00 m and height 2.20 m. Each is 0.525 m wide (half of 1.00 m plus half of 0.05 m overlap), 0.03 m thick and 2.16 m high (excluding 0.03 m head track and 0.01 m floor clearance). Tracks occupy rear d = [0.07, 0.10] m and front d = [0.11, 0.14] m within local depth d = [0, 0.15] m from the closet's inner face toward the corridor. Leaf bottom is 0.01 m above finished floor and top 2.17 m. Five shelf tops are 0.25, 0.63, 1.01, 1.39, 1.77 m above upper floor, at 0.38 m intervals from 0.25 m. With the rear inner face as depth zero, shelves are 0.55 m deep toward doors and 0.02 m thick. Each leaf has a recessed `handle`, centered 0.04 m outward from the meeting line and 1.00 m above finished upper floor, 0.10 m wide, 0.025 m high and 0.012 m deep. Each leaf translates horizontally 0–0.475 m (width 0.525 m minus overlap 0.05 m); both reference states are closed. Shelf front and inner door-boundary face have 0.05 m clearance; leaves move only within the 0.15 m boundary farther corridorward. Surface ids are shelf `shelf`, leaf front/back/thickness faces `leaf`, recessed panels `leaf-panel`, tracks `rail`, recessed handles `handle`. The source owner is `src/models/closet.ts`; inspect in the corridor arrival view and closet section.

Each linen `leaf-panel` inherits the [interior-door panels'](03-interior-doors.md#interior-door-members) height ranges [0.18,0.86]·[0.98,1.98] m and 0.12 m side margins. Each leaf has two panels, width 0.525−2×0.12=0.285 m and heights 0.68·1.00 m. Apply 0.008 m recess depth to both leaf faces; each flat recess floor and four reveals are `leaf-panel`. Remaining front/back and end faces are `leaf`. With leaf-local lower-left (0,0), fix panel X=[0.12,0.405] m and Y=[0.18,0.86]·[0.98,1.98] m. Recess one 0.012 m deep `handle` only into each broad corridor face.

Track depth d=0 is inner front Z=−3.26 m; +d points corridorward along −Z. Rear leaf Z=[−3.36,−3.33] and front leaf Z=[−3.40,−3.37] m follow. Each `rail` bottom plate occupies its own Z depth across opening X=[1.97,2.97] m at upper-floor-relative Y=[0,0.01] m; its head occupies Y=[2.17,2.20] m. They meet leaf Y=[0.01,2.17] m only at faces. Shelf front Z=−3.21 m and rear-leaf back Z=−3.33 m leave 0.12 m. Closed front-left X=[1.97,2.495] and rear-right X=[2.445,2.97] m leaves have 0.05 m frontal overlap in separate thickness layers. Front moves +X and rear −X, each 0–0.475 m. Groove centers X=2.43·2.51 m are each 0.04 m outward from meeting midpoint X=2.47 m. The near edge of each 0.10 m wide groove is 0.005 m from its panel edge; corridor end Z=−3.40 m is 0.01 m inside casing back Z=−3.41 m.

Each `shelf` spans the 1.20 m closet interior X=[1.87,3.07] m, or local X=[−0.60,0.60] m about center X=2.47 m, with end faces meeting inner wall faces. Each fills rear local depth d=[0,0.55] m without separate brackets. Shelves meet walls only at faces and do not enter the corridor-side track strip.

The [upper-hall storage-floor owner](../spaces/rooms/upper-hall.md#upper-linen-storage) fills interior X=[1.87,3.07]·Z=[−3.26,−2.66] m and the opening strip with 0.025 m finish thickness, closing the top at Y=3.06 m. The model does not duplicate this finish. Bottom-`rail` local Y=[0,0.01] m is world Y=[3.06,3.07] m; both track bottoms in the opening strip meet spaces finish top Y=3.06 m at a face.

Shelf-only depth `d_s=0` is rear inner wall Z=−2.66 m, with +`d_s` corridorward along −Z. All five `shelf` boards therefore occupy X=[1.87,3.07]·Z=[−3.21,−2.66] m, and Y from 0.02 m below each top to that top at 0.25·0.63·1.01·1.39·1.77 m. Track-only `d_t=0` is the separate inner front Z=−3.26 m, also with +`d_t` corridorward along −Z. Shelf front Z=−3.21 m leaves 0.05 m to this face and 0.12 m to rear-leaf back Z=−3.33 m. All five shelves' X ends meet inner side walls without unsupported 0.05 m gaps. Do not mix these depth origins.

White corridor `casing` consists of three closed boards outside `upper-linen-opening`. Left/right jambs occupy X=[1.92,1.97]·[2.97,3.02] m, Z=[−3.425,−3.41] m, upper-finished-floor-relative Y=[0,2.20] m. The head occupies X=[1.92,3.02] m at the same Z depth and Y=[2.20,2.25] m. Each visible width is 0.05 m with 0.015 m projection from finished corridor wall. Jambs reach floor and meet the head only at Y=2.20 m. Boards do not invade rough-opening X=[1.97,2.97] m or leaves/tracks/shelves at Z>−3.41 m. Every board face is `casing`; project length U/width V at 1 UV/m from jamb bottom/head left, restarting seams at board ends.

Closed linen `leaf` faces comprise broad faces and four ends of front body X=[1.97,2.495]·Z=[−3.40,−3.37] m and rear body X=[2.445,2.97]·Z=[−3.36,−3.33] m, each at Y=[0.01,2.17] m, excluding the preceding two panels and handle groove. Separate Z layers and panel recess depth 0.008 m do not close one volume twice.

## Storage-fitting surface partitions {#closet-fitting-surfaces}
<!--
@evidence principles/core/common.md#scope-preservation This H2 owns storage surface ids leaf·leaf-panel·rail·rod·shelf·handle·casing and leaf/casing UVs.
@evidence principles/core/common.md#substantive-completion Leaves use local X/Y UVs; tracks length U, rods axial length U, shelves width U and casing length U from jamb bottom/head left. Seams restart at every cut end.
@evidence principles/core/common.md#declared-basis leaf·rail·rod·shelf·handle id rules come from 00-model-frame.md#model-surface-partition-naming.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It turns common id rules into a storage-member list.
@evidence principles/design/models.md#representation-contract It defines stable storage-member surfaces.
@evidence principles/design/models.md#spatial-convention It specifies UV axes.
@evidence principles/design/models.md#reviewable-structure The binding view can falsify it.
@evidence principles/design/models.md#model-observable-style-basis Color belongs to materials.
@evidence principles/design/models.md#model-scale-layer-completion It defines surface interfaces for coat/linen leaves, rods and shelves.
@evidence upstream/design/models.md#settings-and-space-revision-from-model-work The parent's duplicate assignment of entry-coat-storage leaves/rod to spaces source was corrected so one models owner emits leaf·rod·shelf faces. upper-linen-storage's shelf reservation and 00 id rules were sufficient without revision.
@evidence spaces/rooms/entry.md#entry-coat-storage Coat-closet body/opening remain in spaces; only closed sliding leaf·rail·rod·shelf faces receive model-member surface ids.
-->

Adopt the white storage-door fronts in references 04·05 and interior rods/shelves as distinct surfaces. Only openings remain in spaces.

Following the [naming rules](00-model-frame.md#model-surface-partition-naming), leaves use `leaf`/`leaf-panel`, tracks `rail`, rods `rod`, shelves `shelf`, handle recesses `handle` and coat/linen casing boards outside openings `casing`. Like the [interior doors](03-interior-doors.md#interior-door-members), leaf faces have meter-based UVs aligned with leaf-local X/Y. The source owner is `src/models/closet.ts`.

Use 1 UV/m: `rail` has length U/width V from each track's start; `rod` axial length U/actual circumference V from the door-facing seam; `shelf` horizontal length U/forward depth V from its rear-left corner. Project each recessed `handle` floor and four reveals with actual length U/depth V. Restart origins at every cut end of tracks, rods, shelves, leaves and handles; include backs and undersides.

For `casing`, use length U/width V at 1 UV/m from each jamb's bottom/head's left end. Cover front, back and cut ends with the same id, restarting seams for each board.

In the material-binding view, inspect whether open coat/linen leaves, recesses, shelves, rods, tracks and outer casing end at respective `leaf`·`handle`·`shelf`·`rod`·`rail`·`casing` boundaries. Actual model meshes and bindings are unverified.

## Storage-fitting representation limits {#closet-fitting-fidelity}
<!--
@evidence principles/core/common.md#scope-preservation This H2 excludes rollers/brackets/screws and assigns clothes/towels/containers to prop models.
@evidence principles/core/common.md#substantive-completion It explicitly excludes storage contents from this model.
@evidence principles/core/common.md#declared-basis Hardware omissions/contents exclusions come from 00-model-frame.md#model-representation-ceiling.
@evidence principles/core/inherited-units.md#derived-parent-differentiation It turns the common ceiling into a storage-fitting omission list.
@evidence principles/design/models.md#representation-contract Sliding-leaf movement is a proxy that does not prove roller friction or loads.
@evidence principles/design/models.md#spatial-convention Earlier storage-fitting H2s define tracks/shelf coordinates; this limit H2 introduces no coordinates.
@evidence principles/design/models.md#reviewable-structure Clothes/towels included in this prototype would falsify it in the model-review closet section.
@evidence principles/design/models.md#model-observable-style-basis It states observable storage limits: rollers/brackets are absent.
@evidence principles/design/models.md#model-scale-layer-completion It explicitly excludes sliding rollers, shelf brackets/screws and clothes/towels/containers.
@evidence obligations/design/models.md#representation-ceiling It specifies storage hardware omissions and contents exclusions.
@evidence spaces/rooms/upper-hall.md#upper-linen-storage Models create linen shelves; towels belong to a separate prop prototype, separating opening/shelf/contents ownership.
@evidence settings/20-verification.md#fidelity Linen leaves/interior shelves must remain legible in captures, while hidden rollers/screws are omitted.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work Storage-fitting omissions were compared with settings fidelity and entry/upper-hall contents descriptions; no parent revision was needed.
-->

Adopt the visible doors and open-storage silhouettes in references 04·05. Hidden rollers and shelf-support screws are outside the observation scope.

Within the [representation ceiling](00-model-frame.md#model-representation-ceiling), omit rollers, brackets and shelf-support screws. Clothes, towels and containers belong to prop models rather than this model. The inspection address is the [model-review view list](00-model-frame.md#model-review-set); actual renders are unverified. The source owner is `src/models/closet.ts`.

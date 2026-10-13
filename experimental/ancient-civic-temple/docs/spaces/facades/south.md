# Sole ownership of the front envelope

## South facade with recessed entrance {#south-envelope}

<!--
@evidence principles/core/common.md#scope-preservation Includes both south-wing parapets and coping, return-wall parapets, central recessed wall, porch triangular infill, and parapet rear faces above roofs in one facade ownership.
@evidence principles/core/common.md#substantive-completion Closes the front envelope by defining the central cut's X range, wall thickness, coping top Y=4.85m, infill underside 3.50m, and plinth top 0.65m above each ground contact.
@evidence principles/core/common.md#declared-basis Uses building for the outline, roof-form for coping range, porch underside for the recessed-wall top, junctions for physical joins, and envelope canon for plaster/plinth relations.
@evidence principles/design/spaces.md#space-topology Recesses only the central entrance while joining side parapets and returns into the same building as the colonnade/entrance boundaries; creates no space behind parapets.
@evidence principles/design/spaces.md#space-boundary-authority South creates only the exterior frontage, coping, parapet rear faces, and wall solid; column prototypes, porch roof, and room inner surfaces retain their original owners.
@evidence principles/design/spaces.md#space-verification-address Examines the front, both corners, returns, roof junctions behind parapets, and frame sections for disagreement between exterior form and interior boundaries.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Makes the visible porch requirement concrete through recess ownership between parapets, coping height, and a plinth top following the ground.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared walls' plaster/stone plinth, entrance-porch columns/beam/gable, and repaired roof-form coping range. Parapets and recessed porch allocate them all without exposing another parent defect.
@evidence settings/20-envelope.md#walls Assigns ochre plaster and light plinth continuously across parapets and recesses.
@evidence settings/20-envelope.md#entrance-porch Exposes the column, beam, and triangular-infill relation at the central entrance between parapets instead of completing it as a simple door hole.
@evidence settings/20-envelope.md#material-language Covers actual envelope extents with plaster, stone plinth, and coping rather than arbitrary surface patches.
@evidence settings/20-envelope.md#roof-form Raises the front outline as horizontal stone-coped parapets hiding the south monopitch roof and east gable end.
-->

Own the south face of the [building outline](../building.md#footprint) as one complete visual surface. The outer wall occupies south-inner~south-outer over west-outer~west-porch-outer and east-porch-outer~east-outer; the center is the entrance recess and returns. Include the outer faces of returns and recessed wall in the south facade; [openings](../openings.md#doors) owns the actual door void. Offering, colonnade, administration, and entrance owners consume their respective inner faces.

Both wing walls and returns form the outer parapets of the [roof setting](../../settings/20-envelope.md#roof-form), with horizontal stone coping topped at Y=4.85m. West, north, and the southeast corner of east consume this same height. The [south monopitch roof](../roofs/colonnade.md#south-canopy), [east gable](../roofs/east.md#east-roof) end, and south end of the [west roof](../roofs/west.md#west-roof) terminate at the parapets' inner faces. [Band division](../junctions.md#gable-closures) separates inner faces into interior finish below the roof, concealed contact, and parapet rear face above the roof. This facade owns the rear face and coping. Wall ends and entrance recess consume [wall junctions](../junctions.md#wall-junctions).

Between the returns, the recessed entrance wall rises to the [porch roof](../roofs/porch.md#porch-roof) underside to support its rear end; corner bays at both ends rise to coping. This facade also owns the central north face of the recessed wall exposed above the south monopitch roof. At the porch front, the beam above the columns supports triangular infill between the returns' inner faces, 0.2m thick inward from south-outer. Its underside is Y=3.50m and its top follows the porch underside. Leave the entrance front open below it.

Ochre plaster, light stone plinth, and stone coping follow the [envelope canon](../../settings/20-envelope.md#walls). Set the plinth top 0.65m above each ground-contact surface, distinguishing the lower main-entrance ground from service ground. Actual porch columns and beam reveal the central entrance; models own member detail and materials own finish values. Do not close the frontage as a bland panel containing only a door.

Source `src/spaces/facades/south.ts` owns the south wall solids and all outer faces, parapet rear faces, coping, and triangular infill. Do not duplicate entrance column prototypes or roof. Observe the front, both corners, entrance returns, roof junctions behind parapets, and frame sections. Correct disagreement between exterior form and interior boundaries at the shared wall owner.

Outer-wall, recessed-wall, and return bottoms follow the [storey ground junction](../storey.md#wall-ground-contact). Neither interior Y=0 nor the plinth finish top is the wall solid's lower end. Respect the actual stone-step and threshold volumes; below-ground extensions remain part of this facade's same wall solid.

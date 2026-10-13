# Back Slope of the Main Roof

## Main Roof Continuing to the Back Eave {#main-back-roof}
<!--
@evidence principles/core/common.md#scope-preservation Takes on the weather face and underside of the back half of the main roof, the free back eave, the left rake edge, and the step boundary with the low roof on the right.
@evidence principles/core/common.md#substantive-completion Applies Mback to the back half of the main roof zone, and does not run the front gable through to this face or leave it as a hidden plate below.
@evidence principles/core/common.md#declared-basis The zone comes from roof-mass-allocation, the height function from roof-profile-datums, and the relation with the rear room ceilings from storey-datums.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Limits the rear gutter to the free back eave and ends it at the right step, without continuing it onto the step wall or the main ridge.
@evidence principles/design/spaces.md#space-topology The front boundary is the main ridge, the back the free eave of the main block rear, the left the side rake edge, and the right the step with the low roof, and there is no habitable storey between the rear room ceilings and this roof.
@evidence principles/design/spaces.md#space-boundary-authority The height comes from Mback of 00-junctions and the main roof zone, and the right step is closed by the step wall of the right elevation, so this face does not pierce or remake that boundary.
@evidence principles/design/spaces.md#space-verification-address Has the whole rear elevation, the ridge/back eave section, and the back end and underside of the right step observed.
@evidence settings/10-house.md#main-mass Closes the back of the side-to-side main ridge with one slope descending to the back eave and does not run the front gable through this face.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared main-mass's "the side-to-side main ridge of the main block" and the upper clear height of 2.50–2.65 m with the back face; Mback descends to the back eave above the rear room ceilings, so there was no parent revision.
-->

`roof.main.back` and its underside are owned by `src/spaces/roof/main-back.ts`. It uses [Mback](00-junctions.md#roof-profile-datums) in the back half of the [main roof zone](00-junctions.md#roof-mass-allocation). The front boundary is the main ridge, the back the free eave of the main block rear, the left the side rake edge, and the right the step with the low roof. The front gable is not run through to this face or left as a hidden plate below.

The rear room ceilings and the roof underside share the [storey reference](../01-storeys.md#storey-datums), and no additional habitable storey is inserted between them. The rear gutter follows the free back eave and ends at the right step, without climbing to the main ridge or piercing the step. That step is closed by the [step wall of the right elevation](../envelope/right.md#right-roof-closures), so this face does not make it again. The inspection addresses are the whole rear elevation, the ridge/back eave section, and the back end and underside of the right step. The real shape, members, and exposed face observation are unverified.

This owner's white eave soffit uses as origin and axes U along +X from the left end of the free back eave and V as the real slope distance rising from that eave in +Z toward the main ridge. The shingle weather face keeps the [world slope UV](../03-surface-owners.md#exterior-surface-handoff). The white fascia of the really free thickness faces at the rear eave, the exposed left rake, and the right step restarts the 3D length U at the lexicographically smaller (X,Z) end of each edge and V as the 0.24 m vertical thickness from the weather face to the underside. The face and UV are cut at the main ridge, the step wall, and the gutter end, and no duplicate white face is kept inside a contact.

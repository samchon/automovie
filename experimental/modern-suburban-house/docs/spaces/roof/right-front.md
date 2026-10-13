# Low Front Roof on the Right of the Main Block

## Front Face Attached Below the High Roof {#right-front-roof}
<!--
@evidence principles/core/common.md#scope-preservation Takes on the weather face and underside of the front half of the main block right zone, the preservation of the wall height above the upper front windows, and the height distinction from the garage roof.
@evidence principles/core/common.md#substantive-completion Applies Rfront to this face's weather face and underside, fixing a front face lower than the main roof, and keeps the complete slope and underside in one owner, right-front.ts.
@evidence principles/core/common.md#declared-basis States that the front half zone and Rfront come from roof/00 and the left junction from the step wall of right-roof-closures, and that the height difference from the garage is read by comparison with garage-front-roof.
@evidence principles/core/inherited-units.md#derived-parent-differentiation Compares the front face of the low right roof and the upper front windows in the same section, leaving the exterior wall height above the windows.
@evidence principles/design/spaces.md#space-topology The front is the main block front eave, the back the low ridge, the right the gable rake edge of the main block side, and the left the main roof step, and it is not a separate box floating above the garage.
@evidence principles/design/spaces.md#space-boundary-authority The height and underside consume Rfront and the left junction consumes the step wall of right-roof-closures, so this face does not make the step wall and owns the complete slope and underside.
@evidence principles/design/spaces.md#space-verification-address Has the front end of the main roof step, the upper window/eave section, and the front silhouette of the low ridge checked.
@evidence settings/10-house.md#main-mass Keeps the right roof that lowers within the main block above the upper front windows.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work Compared main-mass's "a lower roof at the right end of the main block" and "The right gable is not a separate independent building or a third storey" with the front face; Rfront stays above the upper windows inside the main block zone, so there was no parent revision.
-->

`roof.right.front` is the front half of the [main block right zone](00-junctions.md#roof-mass-allocation). The height and underside consume [Rfront](00-junctions.md#roof-profile-datums), and the left junction the [step wall](../envelope/right.md#right-roof-closures). The front is the main block front eave, the back the low ridge, and the right the gable rake edge of the main block side. No separate box or additional floor floating above the garage is made.

`src/spaces/roof/right-front.ts` owns the complete slope and underside. It preserves the wall height above the upper front windows and reads as an envelope at a different height from the [garage roof](garage-front.md#garage-front-roof). The front end of the main roof step, the upper window/eave section, and the front silhouette of the low ridge are checked. The real members, window bindings, shadows, and frame comparison are unverified.

This owner's white eave soffit sets U along +X from the left end X=1.60 m of the free front eave on the main block right, and V as the real slope distance rising from that eave in −Z toward the low ridge. The shingle weather face keeps the [world slope UV](../03-surface-owners.md#exterior-surface-handoff). The fascia of the exposed thickness faces of the front eave and right rake restarts the 3D length U at the lexicographically smaller (X,Z) end of each free edge and V as the 0.24 m vertical thickness from the weather face to the underside. The face and UV end at the left step and the low ridge, and do not continue as one sheet into the garage roof fascia.

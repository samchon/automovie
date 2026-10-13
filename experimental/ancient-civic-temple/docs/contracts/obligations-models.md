<!--
@evidence discovery/design/models.md#work-specific-model-requirements The role assignment that only the two door leaves have joints and the finite review board shared by all models are kept as population obligations distinct from the detailed shape of each prototype.
-->

# Repeated obligations of the temple model population

This contract assigns the joint role of the two door leaves and the neutral review board that observes every prototype to the whole model population. The dimensions and UV0 projection of each prototype are owned by the separate model principle and the relevant model H2.

## Moving and fixed members {#temple-articulation-map}

Authority: the reviewed shared model design of the temple. Each prototype keeps either the joint interface of the two named door leaves or the rigid boundary, and inventing a separate joint is a failure.


The only models with joints are the [door leaf](../models/openings.md#double-door-leaf) and the [single door leaf](../models/openings.md#single-door-leaf). Each door leaf has one transform node named `hinge.<leaf ID>` as a stable interface that motion and the public opening operation can use. The rotation axis is vertical, at X=+0.021m, Z=0 from the leaf origin for the double door and at X=0, Z=+0.031m for the single door. The range runs from closed 0° to open 90°, and the local opening transform of the leaf is `R_y(−θ)` about this axis. instances installs the whole leaf facing the swing direction of each room, so the model does not choose a per-room rotation sign anew. The state names are `closed` and `open`, and the default state is the open state set by [opening ownership](../spaces/openings.md#doors). The opening direction follows the swing reservation of spaces, and the model does not set the direction anew.

Every other model is rigid. The chest lid is a closed fixed member, the fountain jet is a static shape following the fixed water level of the [service state](../settings/30-interiors.md#services), and the lamps are likewise fixed in the unlit state of the same setting. Changes over time are later decisions of systems and motions. The handle, hinges and panel of a door leaf turn together as children of the leaf node and are not separately moving interfaces.

On the review board each of the two door leaves is viewed at `closed` 0° and `open` 90° to check that the panel, handle and hinges around the hinge axis turn together.

Review question: Does this prototype follow the named hinge axis, states and child composition of the two door leaves, or keep the rigid boundary otherwise?

Sources: the design decisions of the reviewed earlier `docs/models/scale.md#articulation-map`.

## Neutral model review board {#temple-model-review-board}

Authority: the reviewed shared model design of the temple. The judgement plan of the model population sets the same neutral board and the relevant close and state views, and certifying contact or proportion with a missing view is a failure.


The model review board is one scene separate from the building. Each prototype stands alone on a neutral grey floor at Y=0, with a walking envelope box (0.6×0.4×1.9m) 0.8m to its right (+X). The lighting is one fixed light source with the same direction as the review daylight of the building viewer plus a sky fill, and parts without a bound material show in the same neutral clay. The camera has a 50° vertical field of view and a 1600×1000 ratio. It takes the frame and field of view of the [review condition](../settings/00-delivery.md#review-condition) and the direction of the [daytime daylight](../settings/40-environment.md#daylight).

The required whole views are six: front (+Z toward −Z), right side (+X toward −X), back (−Z toward +Z), plan (+Y toward −Y), first diagonal (from the +X, +Y, +Z direction at 30° altitude) and opposite diagonal (from the −X, +Y, −Z direction at 30° altitude). Each view sets its distance by the same subject bounds so that the long axis fills about 70% of the frame. For each joint and penetration boundary, thin member and opening named in each model H2, a close view is added that frames the two touching members and the void together. A close view is taken at the distance where a local projection box, covering the joint region and, around it, one times the longest section dimension of the small member, fills about 90% of the long axis of the frame, and it is taken from the opposite normal direction with the same distance, focus and local projection box. The full length of a long member is not included in the close view distance calculation. A boundary hidden along the normal is also taken from the side faces orthogonal to that normal and from below with the same fill ratio. The close view background is the same neutral grey floor with the fixed daylight and sky fill as the whole views. The `closed` and `open` door leaves and the scroll's one rolled, bundle of three and one opened sheet, each a state with a name attached, are viewed in the six whole views and the relevant close views. Dimensional variants are also viewed one by one. Repeated modules such as tiles are viewed as one unit together with a 3×3 array sample. The comparison criteria are the silhouette sections, member separation, real voids, floating or penetration at joint faces, and the proportion of the occupancy box to the walking envelope written by each model H2. For every model with a tube handle attached, including the carrying jar, bucket and small vessel, the exposure itself is not counted as floating when part of the end disc shows outside the body but another part is inserted into the body solid at a positive depth. If the whole end ring is outside the body, or a positive gap runs between the whole circumference of the end ring and the body so that there is no solid contact, it is floating. Background sky seen beside the handle from one viewing direction is not by itself judged a gap around the whole circumference, and the joint normal, opposite normal and side close views are compared together with the solid penetration values. This board is for composition judgement, not shading or staging, and placement or contact in the building is observed separately by instances and spaces observations.

Review question: Are the six whole views, the needed joint and opening close views, and the named states and variants of this prototype observed on the shared board by the same comparison criteria?

Sources: the design decisions of the reviewed earlier `docs/models/scale.md#model-review-board` and the user's 2026-09-27 building-first instruction.

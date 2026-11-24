# Human construction

## Anatomical inputs

Construct and measure each public input at its published landmark, site and posture. Use ISO 8559-1 and ANSUR II for body measures and Farkas for head measures. State units and population ranges. Apply published relations in their own covariates. Mark estimates with their reasons and check them against held-out evidence. [Anatomical consistency](../../../packages/human/docs/testing/consistency.md).

Place joint centres from the person's inputs in the parent's anatomical frame. Derive the loft course and section scaling centres independently when their definitions differ. Read each girth on the original surface at its own site and solve only the controls that own it. [Centres and courses](../../../packages/human/docs/techniques/centres-and-courses.md).

## Body construction

Use one parameterized body definition for the supported population. Human authors the anatomical nodes and their relative frames. The interface declares the construction, and the engine realizes its chains, connections and skin. Add missing shared operations at that owner with an independent operator test.

Use conic families for the body's lofted regions. Choose the representation for folds, openings and other features under [3D modeling](../3d-modeling/crafting/lofting.md#composition-before-lofting). Build bilateral regions from the same law and reflect their frames with consistent orientation. Keep the same realized atlas for binding, appearance and export. Keep the modelled skin free of genitals and nipples.

Derive production curves from the person's inputs and published or documented estimated laws. Use the fewest curves and simplest rules that satisfy the anatomical form and connections. Use reference observations to investigate laws and check generalization. [Mesh recovery](../3d-modeling/crafting/recovery.md).

## Connections

Use [Lofting](../3d-modeling/crafting/lofting.md#connections) for the common connection rules. Choose the Human operator by anatomy and topology.

| Connection | Human operator |
| --- | --- |
| A child leaves a continuing parent surface | Landmark port, for example the arm at the armscye |
| Several children leave one open parent end | Split along the anatomical saddle, as at the finger webs or crotch |
| Two compatible open ends continue one field | Continuation |
| One defined volume enters another | Seeded merge |
| A recess or opening removes a defined volume | Difference or trim |

The parent owns its shared loop and publishes the original curve and available transverse derivatives. The child starts at those values under the declared frame and parameter maps. Correct the source line where the band reveals a gap or a turn the source cannot support.

For a port, cut the parent's field with a surface defined in the relevant skeletal frame and check the loop against its defining landmarks. For a split, end the parent at its last regular common section and follow each measured web from the fork to its saddle. [Armscye](../../../packages/human/docs/techniques/armscye-join.md) · [Joint logic](../../../packages/human/docs/techniques/joint-logic.md).

# Turnaround views

Turnaround views give an image-to-3D model or a modeler a subject's sides. They serve only a commissioned [detail option](../development/entities.md#detail) or standalone asset under [3D modeling](../3d-modeling/SKILL.md); a coarse entity needs none. They are a set apart from the [canon references](canon-references.md), which a standalone asset also takes first, from its own record. [Image hints](../3d-modeling/diffusion/image-hints.md) owns what each view must look like and which views a model takes.

## Making the views

Pose the subject's coarse form as [image hints](../3d-modeling/diffusion/image-hints.md#pose) set, render it from fixed cameras at one framing and even light, and restyle each render from the frozen canon references through a [conditioning route](conditioning.md#routes). Give every view the same references and prompt, and give the accepted front view beside the canon references for each further angle. A multi-view model, where one is chosen, generates the set together from the front view and the coarse form's mesh, which keeps the views in agreement.

Lay the views side by side and check that they agree on proportions, parts and colors before handing them on.

## Limits

Generated views carry no camera calibration or scale and disagree with each other at pixel level, so they are never measurements; real dimensions come from the research and the entity's code.

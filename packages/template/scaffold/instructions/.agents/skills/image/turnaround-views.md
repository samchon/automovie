# Turnaround views

Turnaround views show a subject's sides for a commissioned [detail option](../development/entities.md#detail) or standalone asset under [3D modeling](../3d-modeling/SKILL.md). A coarse entity needs none.

Keep this set separate from the subject's frozen [canon references](canon-references.md). [Image hints](../3d-modeling/diffusion/image-hints.md) owns the required views and their form.

## Making the views

Pose the coarse form under [image hints](../3d-modeling/diffusion/image-hints.md#pose). Render the required views with matched framing and even light, then restyle them from the same canon references through [conditioning](diffusion/conditioning.md#routes).

Generate views together where supported, using the accepted front view and mesh in their documented roles. Otherwise give the accepted front view beside the canon references for each further angle.

Lay the views side by side and check that they agree on proportions, parts and colors before handing them on.

## Limits

Generated views carry no camera calibration or scale and disagree with each other at pixel level, so they are never measurements; real dimensions come from the research and the entity's code.

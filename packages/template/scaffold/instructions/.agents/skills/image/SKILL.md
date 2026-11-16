---
name: image
description: Prepares canon references, shot frames and turnaround views, and routes generation methods to image diffusion. Use when a production or standalone asset needs images.
---

# Image

Image work supplies the appearance of people, places and props, shot frames for a video model, and views for image-to-3D. The motion hint carries pose and camera; images supply the intended look.

| Task | Read |
| --- | --- |
| Generate, edit or finish an image | [Image diffusion](diffusion/SKILL.md) |
| Make a subject's canon references | [Canon references](canon-references.md) |
| Prepare a shot frame, place angle or shape reference from a render | [Conditioning](diffusion/conditioning.md) |
| Make views for image-to-3D or a modeler | [Turnaround views](turnaround-views.md) |

## Every image

Freeze each accepted image: keep the file as generated, with its content credentials, and its record under [media records](../production/media-records.md#records), and reuse it rather than generate it again.

Generate every view, shot frame and variant from the frozen canon references, never from an earlier derived image alone, because each edit of an edit loses detail and drifts from the subject.

Judge each image under [visual debugging](../visual-debugging/SKILL.md), against its record and its frozen canon references: identity and wardrobe, hands, scale against a door or a figure, light direction, lettering, and the blur or oversharpened edges that repeated edits leave.

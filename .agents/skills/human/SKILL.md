---
name: human
description: Builds and verifies parameterized human anatomy, the Human viewer and the polygon man.
---

# Human

Follow [3D modeling](../3d-modeling/SKILL.md) for representation, construction, resolution, fitting, rigging and form inspection. Follow [visual debugging](../visual-debugging/SKILL.md) for matched captures and correction rounds. This skill adds anatomical and package requirements.

| Read | For |
| --- | --- |
| [Construction](construction.md) | Deriving anatomical inputs and building the body, joints or skin |
| [Verification](verification.md) | Checking anatomical inputs, joins, generated skin or the Human viewer |
| [Supervision](supervision.md) | Starting, resuming or running periodic Human supervision |
| [Human README](../../../packages/human/README.md#inspection) | Live viewer subjects, capture commands and selection paths |

Use the issue for the current task and its acceptance checks. Finish the anatomical neutral and bind before evaluating dependent poses.

Apply the [research requirements](supervision.md#evidence-before-implementation) to every Human feature and correction.

## Polygon man

The polygon man is the plain rigid figure used by motion verification and diffusion hints. Correct measured radii, lengths and frames while keeping its primitives, segment count and style. Refer any change to that representation to the user. Verify it separately from the continuous skin. [Polygon man](../../../packages/human/README.md#polygon-man).

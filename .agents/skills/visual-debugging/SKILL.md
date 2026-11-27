---
name: visual-debugging
description: Captures, compares and corrects pictures.
---

# Visual debugging

Judge appearance from captured stills. The subject skill defines what to inspect.

Plan each capture. The inspector in `viewer` and capture host in `cli` drive the same `render` core with the same request text.

| Read | For |
| --- | --- |
| [Instrument](instrument.md) | What the instrument draws, plans, records and omits |
| [Capture](capture.md) | Restore it or plan subjects, views, times and stills |
| [Passes](passes.md) | Choose what stills draw and mark measured findings |
| [Comparison](comparison.md) | Setting two captures against each other |
| [Correction rounds](correction-rounds.md) | Correcting what a capture shows |
| [Rendering cost](rendering-cost.md) | Measuring what drawing costs |

| Read also | For |
| --- | --- |
| [Inspecting a form](../3d-modeling/inspection.md) | A form, its construction, rig or materials |
| [Motion verification](../motion/laws/verification.md) | Body motion |
| The human skill's verification page | The Human figure |

The [package boundaries](../project/SKILL.md#packages) say which package owns display, capture and each measurement. Add a view, pass or selection the instrument lacks at that owner under [development](../development/SKILL.md), so every consumer of the instrument gains it.

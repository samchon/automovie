---
name: human
description: Governs main-agent supervision, instruction-compliance audits, and thirty-minute reporting for Human work. Use with the 3d-modeling skill before working on packages/human, a human figure, or the Human viewer.
---

# Human

## Supervision

The main agent owns instruction compliance throughout Human work. Before assigning or starting work, read the applicable skills and linked procedures, identify the rules that govern it, and name the author responsible for each source surface and shared boundary. Delegation requires the user's authorization.

Audit evidence that the author read and followed those instructions, inspected the actual viewer, and completed correction rounds. The main agent does not approve visual quality, act as an independent visual reviewer, or impose a start or approval gate before the author can proceed. The author owns implementation, enlarged viewer inspection, and self-review.

An audit records the governing instruction, its evidence, any breach, the responsible owner, and the correction. Assign missing or invalid evidence to its owner and report it honestly; a claim of compliance alone is insufficient. A serious result or instruction breach is reported immediately.

## Author Workflow

The author inspects the current assembled person in the actual Human viewer, enlarges each affected region, records the round's defects, and traces them through all affected parts and shared boundaries. Follow [Visual Debugging](../3d-modeling/visual-debugging.md) and [Verification](verification.md), fix the round's common causes together, then inspect the complete result again. Collect a self-review round's findings before fixing them together under [Review](../review/SKILL.md).

Coordinate source, build, viewer-runtime, and capture ownership before using shared resources. Record and respect the active owner's lock and source snapshot; wait for release or an explicit handoff rather than modifying another owner's input or stopping their process. The main agent audits this coordination and does not take over the author's build or capture work.

Preserve the last valid state when an operation fails. If code and formulas cannot reach the required quality, report that limit instead of substituting another generation route.

## Inspection And Reporting

During active Human work, the main agent audits compliance and reports to the user in Korean every thirty minutes from the work's start. Keep that schedule fixed: intermediate updates and immediate reports do not reset it.

Each scheduled report includes the actual viewer's current full-body screenshot as an absolute-path image, its source snapshot and capture time, the author's enlarged inspection and correction evidence, unresolved defects, and instruction-compliance findings with their owners. Distinguish the image's capture time from the report time. If a current capture is unavailable, report that gap and its owner without presenting an old capture as current.

When the user requests a percentage, give the author's estimated development progress with its basis and scope; never present it as accuracy or test coverage.

Identify a `.shots` file's current use before deleting it. Keep only images needed for the current judgment in `.shots/output`, including the active before-and-after pair; keep metadata and logs outside it.

## Human Tests

Do not write, restore, or work around test code for Human or the Human viewer, regardless of the reason, including by renaming or relocating it into another package, helper, or check. Runtime admission, source guards, and compiler checks remain separate production responsibilities; they must not conceal replacement test code. Use actual-viewer inspection for visual evidence.

## Technical Guides

Read the relevant technical guide before its task:

- [Anatomy](anatomy.md) owns anatomical grounds and modeled tissue.
- [Parameters](parameters.md) owns parameter meaning and admission.
- [Construction](construction.md) owns generation, parts, junctions, and the core boundary.
- [References](references.md) owns reference use and comparison.
- [Verification](verification.md) owns calibration bodies and form judgment.

Read the research workspace, `packages/human/docs`, before researching a value or technique, and update it when research changes, so sources and abandoned approaches are not repeated.

## Documentation

Apply [Meaningful documentation](../contracts/common.md#meaningful-documentation) to Human's public declarations and implementation comments, citing anatomical primary sources directly. `packages/human/docs` is the developers' research workspace, not a manual, and may be deleted when the rebuild completes, so no code or JSDoc refers to it.

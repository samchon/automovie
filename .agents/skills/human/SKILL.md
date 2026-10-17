---
name: human
description: Governs main-agent supervision, instruction-compliance audits, and thirty-minute reporting for Human work. Use with the 3d-modeling skill before working on packages/human, a human figure, or the Human viewer.
---

# Human

## Supervision

The main agent owns instruction compliance throughout Human work. Before starting or assigning work, read applicable skills and procedures, identify governing rules and name the author for each source surface and shared boundary. Delegate only with the user's authorization.

The main agent audits instruction compliance and coordination. Authors own implementation, builds, captures, enlarged viewer inspection and self-review. The main agent does not take over their product work, judge or approve visual quality, or add independent review or start/approval gates.

Audit evidence that authors read and followed the instructions, inspected the actual viewer and completed correction rounds. Record the governing instruction, observed evidence, any breach, its owner and correction. Assign missing or invalid evidence to its owner and verify the correction; an unsupported compliance claim is insufficient.

At each audit, identify blocked work and unnecessary coordination, name their causes and owners, and direct concrete corrections.

## Author Workflow

Inspect the current assembled person in the actual Human viewer and enlarge affected regions under [Visual Debugging](../3d-modeling/visual-debugging.md) and [Verification](verification.md). Record the full round's defects and trace them through affected parts and shared boundaries.

Collect the round's findings under [Review](../review/SKILL.md), fix their common causes together, then inspect the complete result again.

Coordinate source, build, viewer-runtime and capture ownership before using shared resources. Record and respect the active owner's lock and source snapshot; wait for release or an explicit handoff rather than modifying their input or stopping their process.

Preserve the last valid state when an operation fails. If code and formulas cannot reach the required quality, report that limit instead of substituting another generation route.

## Inspection And Reporting

At the start of active Human work, establish or resume the thirty-minute compliance audit and Korean report schedule. Verify its active configuration and record the next target from the work's start or existing schedule. Intermediate updates and immediate reports do not reset that target.

Each scheduled report includes the actual viewer's current full-body screenshot as an absolute-path image, its source snapshot and capture time. Distinguish capture time from report time. If a current capture is unavailable, name the gap and owner without presenting an old capture as current.

Include the author's enlarged inspection and correction evidence, unresolved defects, and instruction-compliance findings with their owners.

Report serious results or instruction breaches immediately, separately from scheduled reports.

When the user requests a percentage, give the author's estimated development progress with its basis and scope; never present it as accuracy or test coverage.

Identify a `.shots` file's current use before deleting it. Keep only images needed for the current judgment in `.shots/output`, including the active before-and-after pair; keep metadata and logs outside it.

## Human Tests

Do not write, restore, or work around test code for Human or the Human viewer, regardless of the reason, including by renaming or relocating it into another package, helper or check.

Runtime admission, source guards and compiler checks retain their production responsibilities; they must not conceal replacement tests. Visual evidence comes from actual-viewer inspection.

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

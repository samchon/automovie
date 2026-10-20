---
name: human
description: Builds parameter-driven human figures from recovered reference curves through exact Hermite storage, hierarchical rule identification, and actual-viewer verification. Use with 3d-modeling before working on packages/human, a human figure, or the Human viewer.
---

# Human

Recover the reference model's curve structure first, then derive a common parameter-driven generator from it. Attaching measurements to an independently invented body does not adopt the reference's shape rules. The reference supplies the broad silhouette, proportions, volumes and feature placement, without making every small residual a required target.

## Workflow

1. Extract the whole reference model's sections, longitudinal guides, obliques and feature curves through `recovery`, retaining their relationships under [References](references.md).
2. Convert and save every recovered curve in an exact Hermite representation under [Hermite Storage](references.md#hermite-storage); publish omissions instead of presenting a selected subset as the whole body.
3. Analyze the complete material to choose principal layers, axes, feature curves, branch relationships and parameter influences under [Reverse Analysis](reverse-analysis.md).
4. Generate intermediate axes and layers by recursive interval subdivision, identifying common rules through constraints and suitable solvers under [Hierarchical Identification](reverse-analysis.md#hierarchical-identification).
5. Repeat on the assembled body, independent parameter changes, interactions and return to the starting state under [Verification](verification.md).
6. Find suitable methods for the trunk, limbs, hands, feet, head and face, while joining them through the common authority under [Construction](construction.md).

These steps organize work, not approval gates. Read [Parameters](parameters.md) before defining inputs and [Anatomy](anatomy.md) before assigning anatomical meaning. Apply [3D Modeling](../3d-modeling/SKILL.md), [Development](../development/SKILL.md), [Contracts](../contracts/SKILL.md) and [Review](../review/SKILL.md) for their own responsibilities.

## Ownership And Supervision

The main agent owns instruction compliance, ownership, resources, evidence and bottlenecks. Read the applicable instructions and skills before assigning work; the user's instructions take precedence. One integration author owns the common generator, shared boundaries, assembled actual-viewer inspection, captures and complete self-review.

Use regional subagents for parallel research and implementation when the user authorizes parallel work. Define each region's source ownership, inputs, outputs, anatomical scope and shared-boundary contract before assigning it. Regional authors may implement their owned sources; they send equations, assumptions, evidence and affected consumers to the integration author, who reconciles the common model. Read-only research remains read-only. No two authors write the same source or independently redefine a shared boundary.

Keep one owner for shared compiler, watch, cache, HTTP and GPU resources. An author hands a coherent source snapshot directly to that owner, without waiting for the main agent to relay or approve it. Record process ownership and resource handoffs in the campaign ledger, not these permanent instructions. Preserve user files, valid shared mathematics and protected saved work.

While supervision is authorized and active, the main agent maintains the existing fifteen-minute Korean audit schedule without resetting its targets after a message, report or session recovery. If the user disables or pauses supervision, keep it inactive until they explicitly authorize its resumption. At each active audit, check the governing instruction, actual source and processes, evidence, hypothesis, uncertainty, next distinguishing observation and responsible owner. Report serious breaches immediately with the observation, correction and recheck. Supervision adds no independent visual approval gate.

Warn immediately on every instruction or skill violation regardless of its reason, naming the rule, observation, responsible owner and correction. Correct the cause and verify compliance again; do not automatically suspend or replace an owner. Correct a faulty skill under [Prompting](../prompting/SKILL.md) rather than unilaterally disregarding it; follow the user when their instruction conflicts with a skill.

An explicit user stop prevents automatic resumption of modeling, builds or captures. Check compliance with that stop only while supervision itself remains authorized and active.

## Boundaries

Human and Human-viewer tests are forbidden: do not write, restore, run, rename or relocate them into another package, helper or general-mathematics check. Production admission and compiler diagnostics retain their real responsibilities and cannot conceal replacement tests. Use actual-viewer observation for visual evidence.

`packages/human/docs` contains only reference material and research analysis. Keep operational decisions, campaign status, failed execution procedures and executable tools elsewhere under their responsible owner. Public code and comments cite durable primary sources rather than depending on this disposable research directory. Apply [Documentation](../documentation/SKILL.md); omit author-attribution tags from Human declarations as the user requires.

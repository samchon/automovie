# Long route

Long work runs settings, treatments, scripts and screenplay, one layer at a time, and each layer is a pass that closes before the next builds on it.

Run [discovery](../planning/discovery.md) on the director's [recorded answers](../planning/requirements.md#asking-the-user) before bulk settings and [again after settings](../planning/discovery.md#checkpoints).

## Parents

| Submitted layer | Required parent |
| --- | --- |
| Settings | Adopted instructions, discovered requirements and [studies](../planning/research.md) |
| Treatments | Completed settings |
| Scripts | Completed treatments |
| Screenplay | Completed treatments and scripts |

Each layer inherits through its actual parents and repairs a missing handoff at its owner under [upstream defects](../correction/repair.md#upstream-defects), never bypassing it.

## Each layer's pass

### 1. Construction

The author finishes the whole body while its stage is disabled, inspects it under [inspection](../correction/inspection.md), independent classification included, and repairs by [cause](../correction/repair.md#cause-rounds).

### 2. Evidence

The [evidence answerer](../answers.md) enables the stage through [evidence configuration](../../evidence/configuration.md), writes the answers and returns the gaps it cannot answer truthfully. The author fills them.

### 3. Review

An independent reviewer reads the body, its boundaries and its population under [narrative rounds](../../review/narrative-rounds.md).

### 4. Repair

The author decides each finding and repairs the accepted ones at their owners, and the answerer reconciles the answers.

### Closing

Run at most two review rounds.

A round in which the author accepts no finding closes the pass. Otherwise a fresh reviewer reads the repaired body in a second and last round, and the pass closes once that round's accepted findings are repaired.

A closed layer's stage may then go back to disabled, so the repairs that follow owe no story answers.

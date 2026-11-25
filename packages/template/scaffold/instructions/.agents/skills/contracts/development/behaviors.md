# Behaviors

Each exported function and method under `src/laws/`, `src/interactions/` and `src/consequences/` answers these items beside [common](common.md) and [implementation](implementation.md).

Answer for what the declaration implements, wherever its file lives:

| Responsibility | Owns |
| --- | --- |
| Relation | Coordination of installed actions that several scenes reuse |
| Motion law | Planning a new action or moving body |
| Pure rule or table | Legality, outcome classification or variation bounds |
| Consequence | The effect of an actual outcome |

A law names the study it follows in its studied laws answer, as `docs/research/<discipline>/<topic>.md` with the section and values it uses.

## Studied laws

What facts or observations support the behavior's choices, timing and outcomes?

Identify the screenplay facts, installed actions and operators the relation uses. For skilled practice, cite the [study](../../story/planning/research.md#performance-study) passage that supports how the participants coordinate their actions. Settle each action under [action axes](../../motion/compose/composition.md#action-axes). Repair a faulty action at its owner. Test the relation's choices and coordination through [motion checks](../../development/testing.md#motion-checks).

Add and register a [motion law](../../motion/laws/SKILL.md) only for an action the installed vocabulary cannot compose. Derive its poses, reach, contacts and variation from the study. Scale [time and speed](../../motion/laws/declaration.md#time-scale) to the body and test them against the observations. Give the factor and reason for deliberate stylization.

In [source comments](../../development/modules.md#documenting-source), trace choices to the screenplay fact, study observation or rule. Test a rule or table against independently expected classifications and boundaries.

## Relational goals

Does the behavior express the required interaction and verify the part it owns?

A relation supplies the performer, counterpart, outcome and synchronization. A law sets the [effector, target, approach and window](../../motion/laws/authoring.md#writing-a-goal), including whether the target tracks. Coordinates and tuned joint angles alone cannot establish a goal.

Declare [out-of-reach behavior](../../motion/laws/authoring.md#out-of-reach), [contact windows and support frames](../../motion/laws/contacts.md#windows-and-support-frames). Apply consequences to the computed outcome. A contact reaction and any impact sound follow the resolved contact of the depicted pair. A miss can prompt a response to a different cue in the beat.

Test the relation's own cases. Check applicable [bounds on reach, penetration, slip, joint range, balance and continuity](../../motion/laws/verification.md) across statures, proportions, partners and props. For a rule or table, identify and test the input boundaries for each result.

## Deterministic evaluation

Does the behavior evaluate deterministically, including on replay and seek?

Resolve the shared plan once. Derive each pose from the [plan and film time](../../motion/laws/declaration.md#plan-and-time), including on seek. Preserve pose, velocity, supports and possessions at [entry](../../motion/laws/declaration.md#entry-state). Synchronize on declared [events](../../motion/laws/declaration.md#events-and-the-decisive-instant) and admit only planned [cuts](../../motion/laws/transitions.md#declared-cuts), windows and kinds. Pure rules and tables need only their inputs.

Draw variation from the installed generator's [independent streams](../../motion/laws/variation.md#independent-draws) keyed by seed and stable identities. Stay within the law's range and preserve the outcome class and member count. If evaluation depends on sequential history or a transient source, identify the affected consumer.

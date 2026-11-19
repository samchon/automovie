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

- Name the screenplay facts, installed actions and operators the relation uses. For skilled practice, cite the [study](../../story/planning/research.md#performance-study) passage that supports how the participants coordinate those actions. Use package defaults for the mechanics they specify and repair a faulty action at its owner.
- Add and [register](../../motion/laws/extension.md) a motion law only for an action the installed vocabulary cannot compose. Derive poses, reach, contacts and variation from its study. Scale [time and speed](../../motion/laws/declaration.md#time-scale) to the body and test against the observed values.
- Test the relation's choices and coordination through [motion checks](../../development/testing.md#motion-checks). Test a rule or table against independently expected classifications and boundaries. Name the factor and reason for deliberate stylization.

## Relational goals

Does the behavior express the required interaction and verify the part it owns?

- A relation supplies the performer, counterpart, outcome and synchronization. A law sets [effector, target, approach and window](../../motion/laws/authoring.md#writing-a-goal), including whether the target tracks. Coordinates and tuned joint angles cannot establish a goal.
- Declare [out-of-reach behavior](../../motion/laws/authoring.md#out-of-reach), [contact windows and support frames](../../motion/laws/contacts.md#windows-and-support-frames). Apply consequences to the computed outcome. Drive a contact reaction and any impact sound from the resolved contact of the depicted pair. A miss can prompt a response to a different cue in the beat.
- Check the applicable [bounds on reach, penetration, slip, joint range, balance and continuity](../../motion/laws/verification.md) across statures, proportions, partners and props. Test the relation's own cases. For a rule or table, identify the input conditions for each result and test their boundaries.

## Deterministic evaluation

Does the behavior evaluate deterministically, including on replay and seek?

- Resolve the shared plan once. Each pose follows from that [plan and film time](../../motion/laws/declaration.md#plan-and-time), including on seek. Preserve pose, velocity, supports and possessions at [entry](../../motion/laws/declaration.md#entry-state).
- Synchronize on declared [events](../../motion/laws/declaration.md#events-and-the-decisive-instant). Admit only planned [cuts](../../motion/laws/transitions.md#declared-cuts), windows and kinds. Pure rules and tables need only their inputs.
- Draw variation from the installed generator's [independent streams](../../motion/laws/variation.md#independent-draws) keyed by seed and stable identities. Stay within the law's range and preserve the outcome class and member count. Identify the affected consumer of any dependence on sequential history or a transient source.

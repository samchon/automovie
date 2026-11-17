# Behaviors

Each exported function and method under `src/laws/`, `src/interactions/` and `src/consequences/` answers these items beside [common](common.md) and [implementation](implementation.md).

Answer for what the declaration implements, wherever its file lives:

| Responsibility | Owns |
| --- | --- |
| Composition | Selection and coordination of installed actions |
| Motion law | Planning a new action or moving body |
| Pure rule or table | Legality, outcome classification or variation bounds |
| Consequence | The effect of an actual outcome |

Study only what [research](../../story/planning/research.md#what-needs-a-study) requires. Cite each study used as `@evidence docs/research/<discipline>/<topic>.md <section and values>`.

Screenplay decisions and installed defaults need no new study. Every production study still needs a behavior that uses it.

Statements: [statements/behaviors.md](statements/behaviors.md).

## Studied laws

Does the behavior reuse available actions and ground what it adds in the facts or study it needs? Unsourced choices cannot be checked against the depicted practice.

State the delegated actions, sources of its own choices or constants, and tests it owns. A stylized departure states its factor and reason.

## Relational goals

Does the behavior express the required interaction and verify the part it owns? A tuned pose may meet one body and miss another.

State the supplied targets and outcomes, the checks it owns and those delegated to an installed action. A pure rule or table states which input conditions yield each result.

## Deterministic evaluation

Does the behavior give the same result for the same inputs? Hidden state can make seeking and replay disagree.

State its input dependencies and any plan, events, cuts or seeded streams it uses. Identify who resolves a shared plan.

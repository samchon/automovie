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

Statements: [statements/behaviors.md](statements/behaviors.md).

## Studied laws

Does the behavior reuse installed actions and ground additions in the facts or studies it needs?

State the delegated actions, sources of its own choices or constants, and tests it owns. A stylized departure states its factor and reason.

## Relational goals

Does the behavior express the required interaction and verify the part it owns?

State the supplied targets and outcomes, the checks it owns and those delegated to an installed action. A pure rule or table states which input conditions yield each result.

## Deterministic evaluation

Does the behavior evaluate deterministically, including on replay and seek?

State its input dependencies and any plan, events, cuts or seeded streams it uses. Identify who resolves a shared plan.

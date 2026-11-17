# Entities

Each exported declaration under `src/entities/` answers these items in its doc comment, beside [common](common.md), [design](design.md) and [implementation](implementation.md). An entity is one cast member, crowd, prop, set, camera or light.

Its [settings realization](#settings-realization) answer names each fact it realizes as `docs/body/settings/<domain>/<subject>.md#<fact>` or `docs/body/brief/<domain>/<subject>.md#<fact>`, and each measurement's study as `docs/research/<discipline>/<topic>.md` with the section it uses. Two cases name another source:

- on a short, a decision the [brief leaves to the screenplay](../../story/layers/brief.md#what-it-holds) is named by its screenplay scene file and anchor;
- when [no narrative pass runs](../../story/workflow/routes.md#who-writes-the-screenplay), the answer names the screenplay or instruction section, and cites each instruction section as `@evidence docs/instructions/<topic>.md#<anchor> <how>`.

Statements: [statements/entities.md](statements/entities.md).

## Settings realization

Does the declaration build its subject from the settings or brief facts it cites and its measurements from the research it cites, so that the subject is identifiable and on-model at every view and state the scenes use, in its [coarse form](../../development/entities.md#coarse-first) and at each commissioned detail? An entity that invents a fact or a measurement has no basis a reviewer can check, and one that models what its form cannot show spends on surface the effort motion needed.

State each fact it realizes and how, each fact it hands on and to which consumer, and each measurement's study.

## Object shape

Is the entity an immutable object built from its facts, whose capabilities say what the subject means to do and leave alignment, timing and outcome to interactions and laws? Hidden mutable state or a method that answers with a position makes the entity untestable without mocks and the film unseekable.

State what each capability returns and where the entity's state lives.

## Controls and source

Does one module serve every use of the subject: the controls its scenes drive, every version of the subject as a parameter or a seed, the coarse form and each commissioned detail from one definition, and a rebuild from a fixed source? A copied variant or a second definition for the detailed form drifts from the first at its next repair.

State its controls, parameters, detail options, source and usage rights. Trace an installed producer's result into the actual drawing and performance.

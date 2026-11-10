# Entities

Each exported declaration under `src/entities/` answers these items in its doc comment, beside [common](common.md), [design](design.md) and [implementation](implementation.md). An entity is one cast member, crowd, prop, set, camera or light, and its [settings realization](#settings-realization) answer names each settings or brief fact it realizes as `docs/body/settings/<domain>/<subject>.md#<fact>` or `docs/body/brief/<domain>/<subject>.md#<fact>` with how it is realized, and each measurement's study as `docs/research/<discipline>/<topic>.md` with the section it uses. Check each item's [statements](statements/entities.md) before answering it.

## Does it realize the settings or brief facts it cites? {#settings-realization}

Does the declaration build its subject from the settings or brief facts it cites and its measurements from the research it cites, so that the subject is identifiable and on-model at every view and state the scenes use, in its [coarse form](../../development/entities.md#coarse-first) and at each commissioned detail? An entity that invents a fact or a measurement has no basis a reviewer can check, and one that models what its form cannot show spends on surface the effort motion needed. State each fact it realizes and how, each fact it hands on and to which consumer, and each measurement's study.

## Is it an object whose capabilities emit intent? {#object-shape}

Is the entity an immutable object built from its facts, whose capabilities say what the subject means to do and leave alignment, timing and outcome to interactions and laws? Hidden mutable state or a method that answers with a position makes the entity untestable without mocks and the film unseekable. State what each capability returns and where the entity's state lives.

## Can the scenes drive, vary and rebuild it? {#controls-and-source}

Does one module serve every use of the subject: the controls its scenes drive, every flavour as a parameter or a seed, the coarse form and each commissioned detail from one definition, and a rebuild from a fixed source? A copied variant or a second definition for the detailed form drifts from the first at its next repair. State the controls and parameters it exposes, the detail options it builds, and its source with its usage rights.

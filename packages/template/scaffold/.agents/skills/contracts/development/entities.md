# Entities

Each exported declaration under `src/entities/` answers these items in its doc comment, beside [common](common.md), [design](design.md) and [implementation](implementation.md). An entity is one cast member, crowd, prop, set, camera or light, and its [settings realization](#settings-realization) answer names each settings fact it realizes as `docs/body/settings/<domain>/<subject>.md#<fact>` with how it is realized, which review checks.

## Does it realize the settings facts it cites? {#settings-realization}

Does the declaration build its subject from the facts it cites (dimensions, proportions, look, wardrobe and makeup state, voice, uses and habits) so that the realized subject is on-model at every view and state the scenes use, deriving each parameter of a research law from those facts within the law's range? Placements, weights, texture coordinates and measurements derive from the subject's generating definition, so changing the detail level moves none of them. A fact the settings do not establish is written there first; an entity that invents one has no basis a reviewer can check.

## Is it an object whose capabilities emit intent? {#object-shape}

Is the entity a class with `readonly` fields, constructed only from its settings facts and immutable configuration, composed of small fragments rather than inherited, and importing no other entity? Does each capability method return an immutable intent or relational-goal record, never a pose, coordinate, offset or time, leaving alignment, timing and outcome to interactions and laws? State such as wardrobe by story day, wounds, fatigue or a learned habit exists only as an explicit snapshot computed at schedule resolution, and a habit is a trigger-to-response rule with the speed and reliability its settings fact describes. Hidden mutable state or a method that answers with a position makes the entity untestable without mocks and the film unseekable.

## Can the scenes drive and rebuild it? {#controls-and-source}

Does the entity expose the controls its scenes' behaviors and variation use, and rebuild from a fixed source with its usage rights? An adopted or converted asset states which channels and deformation the conversion and runtime retain. Rig complexity no scene uses is not required, and an omitted necessary deformation remains a defect.

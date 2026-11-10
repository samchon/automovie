# Behaviors

Each exported function and method under `src/laws/`, `src/interactions/` and `src/consequences/` answers these items in its doc comment, beside [common](common.md) and [implementation](implementation.md).

It cites the research it follows as `@evidence docs/research/<discipline>/<topic>.md <the section, law and values it uses>`, and every study is followed by some behavior.

Statements: [statements/behaviors.md](statements/behaviors.md).

## Is it built from the research laws it cites? {#studied-laws}

Does the behavior take everything that makes it the depicted practice from the study it cites, with every constant traced to a source, and do its unit tests compare its results with the study's values? A behavior written before its study, a constant tuned until a scene looks right, or a second implementation of an action the installed motion vocabulary performs leaves a motion nobody can check against the practice.

State the study sections and laws it uses, each constant's source, and any stylized departure with its factor and reason.

## Is it authored by goals and held to bounds? {#relational-goals}

Does the behavior bring effectors to targets on the counterpart's actual body, prop or set, under declared rules for reach, contact and outcome, and do bounded checks hold it to those rules on every body? A position, an offset or a tuned joint angle fits one body and one distance, a silent clamp hides a miss, and an outcome left to geometry changes when a performer does.

State its goals and targets, its out-of-reach rule, its contact windows, how its outcome is decided, and the bounds its tests assert.

## Does it evaluate the same at every second? {#deterministic-evaluation}

Does the behavior plan once from its entry state and then evaluate a pure function of film time, with its events, its admitted cuts and its seeded variation declared, so that playback, seeking and capture give the same result? History that only sequential playback builds, an unseeded draw or an undeclared cut makes the film differ between a seek and a replay.

State what it plans at its start, the events and cuts it declares, and the streams its variation draws from.

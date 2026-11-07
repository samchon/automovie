# Behaviors

Each exported function and method under `src/laws/`, `src/interactions/` and `src/consequences/` answers these items in its doc comment, beside [common](common.md) and [implementation](implementation.md). It cites the research it follows as `@evidence docs/research/<discipline>/<topic>.md#<section> <the law and values it uses>`, and every study is followed by some behavior.

## Is it built from the research laws it cites? {#studied-laws}

Does the behavior take its shape priors in the performer's own body frame, its timing windows, reach, contact surfaces, legal and illegal actions, outcome rules and variation ranges from the study it cites, with every constant a named law stating its source or derivation, and do its unit tests compare its results with those values? A behavior written before its study, a constant tuned until a scene looks right, or an action the study does not record fails. A deliberately stylized departure states its factor and reason.

## Does it resolve relations rather than positions? {#relational-goals}

Does the behavior aim at the counterpart's actual body or collider region with an approach direction, timing window and a stated choice to freeze or track the target, bending the technique's shape prior to that relation by fitting rather than reading absolute coordinates, offsets or tuned joint angles? Does an interaction decide the outcome class from the composed intents by its research outcome table first, then let geometry realize and audit it, so a geometric miss fails the audit instead of silently changing the outcome? A consequence such as sweat, blood, dust or a sound cue follows only from a computed outcome.

## Does it evaluate the same at every second? {#deterministic-evaluation}

Does the behavior resolve its composition into a frozen schedule once and then evaluate a pure function of film time, so playback, seeking and capture give the same result? Variation draws from the installed seeded generator with a seed derived from the film seed and stable identities, never `Math.random` or a clock, within a domain the cited law bounds, and no seed can change an outcome class. History that only sequential playback builds, an unseeded draw or a transient source breaks replay unless the limitation is stated with its consumer.

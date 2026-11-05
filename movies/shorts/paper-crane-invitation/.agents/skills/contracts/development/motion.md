# Motion

Each exported function under `src/motion/` answers these items in its doc comment, beside [common](common.md) and [implementation](implementation.md). A movement family is one folder there: an action or technique family, locomotion and footwork, responses and reactions, contact and collision, or a secondary participant such as an official. Each function cites the performance study it follows as `@evidence docs/research/<study>.md <the section and values it uses>`, and every study is followed by some function.

## Is the motion built from its performance study? {#studied-performance}

Does the function take its phases, timing, reach, distances and limits from the study it cites, and do its unit tests compare its behavior with those values? Motion invented without a study fails. An explicitly stylized departure states its factor and reason.

## Does it evaluate the same at every second? {#deterministic-evaluation}

Does the function give the same result for a film second whether it is reached by playback, seeking or capture, with any state, randomness or settling reproduced from fixed inputs? History that only sequential playback builds, an unseeded random draw or a transient source breaks replay unless the limitation is stated with its consumer.

# Films

Each exported function under `src/films/` answers these items in its doc comment, beside [common](common.md) and [implementation](implementation.md). A film delivers one screenplay file and cites it as `@evidence docs/body/screenplay/<file>.md <what it delivers>`, and every screenplay file becomes a film.

## Does the film deliver its whole screenplay? {#whole-screenplay}

Does the film include every shot its screenplay's units require, in the screenplay's order, with the transitions, sound placement and running time the screenplay decides? A missing, repeated or reordered unit, or a duration that the shots and sound do not fill, leaves the film incomplete.

## Does the film only compose? {#composition-only}

Does the function only list its shots, transitions, sound and delivery profile as data, leaving evaluation, playback, seeking and export to the installed packages and every visible behavior to the shots and modules? A film that computes camera, motion or effects itself repeats work the next film needs again.

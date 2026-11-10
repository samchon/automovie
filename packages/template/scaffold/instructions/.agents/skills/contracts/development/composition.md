# Composition

Each exported function and method under `src/composition/` answers these items in its doc comment, beside [common](common.md) and [implementation](implementation.md). A scene in `src/composition/scenes/<film>/<scene>/` cites each screenplay scene or beat it realizes as `@evidence docs/body/screenplay/<film>.md#<anchor> <what it realizes>`, and a film in `src/composition/films/` cites its screenplay file; every scene, beat and screenplay file is realized, and an `OMITTED` one is covered by an `@evidenceExclude` on the scene that would have realized it, or on a neighboring scene when the whole scene is omitted. A catalog case in `src/composition/scenes/catalog/<case>/` and the catalog film cite the research section or settings or brief fact each case exhibits in place of a screenplay, and answer the other items.

## Does it realize every screenplay decision it cites? {#screenplay-realization}

Does the scene compose each cited beat's cast, intent, outcome, consequence, spatial change, camera, requested sound layers and continuity, without omitting, altering or adding to them, and does each state continue across cuts until a beat changes it? Does a film play every scene in screenplay order with its transitions, titles and subtitles, grade, delivery profile and conditioning passes, filling its running time? The scene's comment opens with its screenplay citation and a summary of what happens, then a `Concretization:` paragraph naming each decision the code had to make where the screenplay was vague, never an exchange, outcome or reaction, which only the screenplay decides, and the same change patches the screenplay to record it under its repair rules; an unrecorded choice leaves the screenplay and the film disagreeing.

## Does it only compose? {#composition-only}

Does the declaration only combine entity capabilities, interaction entry points and consequences through the installed time-scoped combinators and their fluent chain, and place absolute time only at the screenplay's anchors? A calculation, constant, coordinate, direct law import, URL parameter, archive load or runtime selection here is a capability missing from its owner: add it there, because logic written into one scene cannot be reused or tested.

## Is every presence alive and every target met? {#living-scene}

Does every on-screen entity, officials, crowds, cameras and lights included, perform its role behavior for its whole presence, reacting to the scene's state rather than standing by? Does each beat's spatial change move its participants between the set's zones and landmarks, and does the camera reframe, follow and move with motivated action? Do the composed behaviors aim at the research's measurable targets for what a viewer sees and hears, which delivery review then measures on the picture? A scene that regresses to isolated single actions, one axis of movement, an idle participant or a static camera fails.

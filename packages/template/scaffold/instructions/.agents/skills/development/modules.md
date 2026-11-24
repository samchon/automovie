# Modules

Read the existing source and relevant installed APIs before implementing a capability. Give each module explicit inputs, outputs and state ownership. Test what the module owns and verify the composition through its consumer.

## How the parts work together

Build each entity from its settings or brief facts. Compose fragments into capabilities that name what it does and to whom.

Compose a person's action in the installed vocabulary using its prepared body, recorded proficiency and scene targets. Settle it under [action axes](../motion/compose/composition.md#action-axes).

Compose capabilities with the installed vocabulary and engine. Use the screenplay's outcomes. Delegate alignment and contact timing to the vocabulary.

Resolve one immutable schedule per film and evaluate each second from it. Derive all streams from one film seed. Start a continuation from the prior film's final state snapshots.

A film only composes, as the [composition only](../contracts/development/composition.md#composition-only) item requires. The catalog and the screenplay films call the same capabilities with the same kind of parameters, so a case accepted in the catalog plays the same way in the film.

The object shell over a functional core is the production's own style; installed packages keep theirs.

## Shots and films

<!-- @source `prepareAutoMovieFlames` and `prepareAutoMovieSurfaceGraphics` in `@automovie/render`, and `IFilmProduction` in `src/IFilmProduction.ts`. -->

Supply the place's prepared stage to the shot's `defineShot` builder and the prepared runtime records to `compileDefinedShot`. Give the runtime's `frameFormat` the film's `fps`, `width` and `height`, because without `fps` a shot whose camera moves is refused.

The film draws only what it mounts. After building a shot's scene, mount its flames with `prepareAutoMovieFlames` and its surface graphics with `prepareAutoMovieSurfaceGraphics`. Apply both whenever the film places that shot and dispose both with the film, as the returned objects' JSDoc sets. A feed layer stays empty until the film's `beforeDraw` calls the graphics' `renderFeeds` with the film's `optics`.

Give a film whose `playback` sequence has a transition a `seekShot` member, because every picture inside a transition is refused without it. Its JSDoc in `src/IFilmProduction.ts` sets what it places, which second each member then reads and the seconds it is asked for.

## One module

Use one definition per subject or action. Vary it through parameters or a seed. Extend the definition when it lacks a required parameter.

## Places

Build a place as [Environments](../3d-modeling/environments.md) sets out, and cite its items' named frames for entrances, seats and other motion targets. Keep the production's dimensions and scene-specific selections in its set source.

Actors who use overlapping floors or cross between supports cite the appropriate walkable surfaces in their staged support windows. Check the assembled scene and its contacts with the production's own capture.

## Shared modules

Move modules shared by workspace productions to `packages/<name>` and import them from there. A standalone production keeps its modules in `src`.

Pass facts that vary by production as constructor inputs or parameters. Keep unit tests with the shared module. Each consumer cites and supplies its own settings or brief facts.

## Documenting source

Each changed declaration answers its development contracts in its doc comment. Document invariants and the material the module realizes. Comment each value with its source and how it realizes it, as its contract's realization comments require. Give one short composition example under [Meaningful documentation](../contracts/development/common.md#meaningful-documentation).

# Composition

Each exported function and method under `src/composition/` answers these items in its doc comment, beside [common](common.md) and [implementation](implementation.md). What it cites depends on what it composes:

| Declaration | Cites |
| --- | --- |
| A scene in `src/composition/scenes/<film>/<scene>/` | Its screenplay scene file, or each section and beat of it |
| A film in `src/composition/films/<film>.ts` | Each scene file of its folder, in the order it plays them |
| A catalog case in `src/composition/scenes/catalog/<module>/` | What it exhibits, named in prose |
| The catalog film | What each of its cases exhibits, named in prose |

Cite a beat or section as `@evidence docs/body/screenplay/<film folder>/<scene file>#<anchor> <what it realizes>`. Omit the anchor for a whole file.

Without narrative passes, scenes and films also cite the instructions they realize. Ask the user to add missing scene files or section or beat headings to a fixed screenplay before citing it.

Every section, beat and scene file is realized. An `OMITTED` one is covered by an `@evidenceExclude` on the scene composition that would have realized it, or on the film when a whole scene file is omitted.

## Screenplay realization

Does each scene realize every cited beat as written, and does the film play every scene in screenplay order at the recorded delivery profile?

### Scene

Open the scene comment with its screenplay citation, action and relevant staging choices. Bind staged instances to the subjects in the standing state. Follow the same instances through movement, handovers, cuts and time out of view. Realize changes in camera and sound. For commissioned generation, carry reactions beyond the representation in the prompt.

Under [meaningful documentation](common.md#meaningful-documentation), comment every value the scene passes and every default it relies on. Give the beat anchor, the [beat element](../../motion/staging.md#reading-the-scene) the value realizes and how, and the study section for skilled practice. Write what a reader needs to check the value against the beat, and nothing the value or its JSDoc already says. Realize every element of each cited beat in at least one commented value.

```ts
const rush = jun.run({
  // #s02-b03 action, "he rushes Mara": the sprint pace, the run's fastest.
  pace: "sprint",
  // #s02-b03 action, "Jun snaps": strides lengthened to lunge at her.
  stride: 1.2,
  // #s02-b03 action, "Jun snaps": strong, sudden, direct and unrestrained effort.
  manner: { effort: { weight: 1, time: 1, space: 1, flow: -1 } },
  // #s02-b03 Space, "Jun by the door, Mara at the sink": the 5 m from his door mark to her front mark.
  to: kitchen.sink.front,
  // via omitted: #s02-b03 Space leaves the floor between them clear, so the default straight path holds.
});
// #s02-b03 action, "knife raised": the knife hand stays high through the run.
overlay(rush, jun.raise(knife, { hand: "right" }));
// #s02-b03 Intent, "before she can get round the table": he sets off on her first step back.
sync(rush.start, maraBackStep.start);
```

If staging a passage requires inventing an exchange, response or pause, return that decision to its [written owner](../../story/correction/repair.md#concretization). Changes to a fixed screenplay go to the user.

### Film and catalog

Play the numbered scenes with their transitions, titles and subtitles. Use the [delivery profile](../../production/project-context.md) for raster, frame rate and running time. Take grade and control channels from the screenplay and profile.

For a catalog case, name the fact it exhibits and use the case parameters. For skilled practice, cite the observed exchange it reproduces. The catalog film lists every case used by the screenplay.

A film comments each value with the screenplay or profile entry it takes, and a catalog case with the fact or observed exchange it exhibits.

## Composition only

Does the declaration compose only accepted module capabilities using installed operators and the screenplay's decisions?

Resolve the film once from one seed. Place absolute time only at screenplay anchors. Compose the [production entity's capabilities](entities.md#settings-realization), interactions and consequences with installed operators. Their capability owners handle calculations, constants, coordinates, direct law imports, URL parameters, archive loads and runtime selections.

Cast and crowds perform through the vocabulary. [Retarget](../../motion/retargeting.md) a supplied or user-chosen clip to its performer. Fix package [refusals](../../motion/compose/refusals.md) at the named axis.

Use the same capabilities in the film and catalog. Select a [catalog case](../../motion/catalog-cases.md#record) accepted for the scene's body, load, support and partner conditions. Recheck affected capabilities after a repair or change of conditions.

## Living scene

Does each participant carry out their part throughout the interval, with the movement and framing the beat requires?

Follow every presence through the interval. A held position needs a purpose in the beat or standing state. Combine the actions and axes the exchange requires, including [secondary actions](../../motion/compose/composition.md#action-axes).

Stage movement between the set's zones and landmarks. Follow or reframe motivated action unless the screenplay calls for a fixed view. Locate each adopted picture or sound target in the scene. For skilled practice, include the study's cues, timing and responses so delivery review can check them in the rendered exchange.

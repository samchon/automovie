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

Comment every value the scene passes to an action, camera, light or sound, and every default it relies on. Each comment gives the beat anchor, the element of the [beat record](../../story/layers/notation.md#records) or action block the value realizes, and how it realizes it, citing the study section for skilled practice. Every element of each cited beat is realized by at least one commented value:

```ts
sprint({
  to: kitchen.sink.front, // #s02-b03 Space, "Mara at the sink": ends at her mark.
  // #s02-b03 action, "he rushes her": pace omitted, the sprint's own.
});
```

If staging a passage requires inventing an exchange, response or pause, return that decision to its [written owner](../../story/correction/repair.md#concretization). Changes to a fixed screenplay go to the user.

### Film and catalog

Play the numbered scenes with their transitions, titles and subtitles. Use the [delivery profile](../../production/project-context.md) for raster, frame rate and running time. Take grade and control channels from the screenplay and profile.

For a catalog case, name the fact it exhibits and use the case parameters. For skilled practice, cite the observed exchange it reproduces. The catalog film lists every case used by the screenplay.

## Composition only

Does the declaration compose only accepted module capabilities using installed operators and the screenplay's decisions?

Resolve the film once from one seed. Place absolute time only at screenplay anchors. Compose the [production entity's capabilities](entities.md#settings-realization), interactions and consequences with installed operators. Their capability owners handle calculations, constants, coordinates, direct law imports, URL parameters, archive loads and runtime selections.

Cast and crowds perform through the vocabulary. [Retarget](../../motion/retargeting.md) a supplied or user-chosen clip to its performer. Fix package [refusals](../../motion/compose/refusals.md) at the named axis.

Use the same capabilities in the film and catalog. Select a [catalog case](../../motion/catalog-cases.md#record) accepted for the scene's body, load, support and partner conditions. Recheck affected capabilities after a repair or change of conditions.

## Living scene

Does each participant carry out their part throughout the interval, with the movement and framing the beat requires?

Follow every presence through the interval. A held position needs a purpose in the beat or standing state. Combine the actions and axes the exchange requires, including [secondary actions](../../motion/compose/composition.md#action-axes).

Stage movement between the set's zones and landmarks. Follow or reframe motivated action unless the screenplay calls for a fixed view. Locate each adopted picture or sound target in the scene. For skilled practice, include the study's cues, timing and responses so delivery review can check them in the rendered exchange.

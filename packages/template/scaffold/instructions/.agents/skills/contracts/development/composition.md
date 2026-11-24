# Composition

Each exported function and method under `src/composition/` answers these items in its doc comment, beside [implementation](implementation.md). It realizes a screenplay rather than serving callers, so it documents that realization here instead of under [common](common.md). What it cites depends on what it composes:

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

Does each scene realize every cited beat as written, and does the film play every scene in screenplay order at the recorded delivery profile and any adopted look, with each spoken line in any sound list it declares?

### Scene

Open the scene comment with its screenplay citation, action and relevant staging choices. Bind staged instances to the subjects in the standing state. Follow the same instances through movement, handovers, cuts and time out of view. Realize changes in camera. Where the film declares a sound list, carry the beat's spoken lines and sound cues into it. For commissioned generation, carry reactions beyond the representation in the prompt.

If staging a passage requires inventing an exchange, response or pause, return that decision to its [written owner](../../story/correction/repair.md#concretization). Changes to a fixed screenplay go to the user.

### Film and catalog

Play the numbered scenes with their transitions, titles and subtitles. Use the [delivery profile](../../production/project-context.md) for raster, frame rate and running time. Take the grade from the screenplay and profile.

Where a direct 3D film declares a sound list, the list carries each line its scenes speak, with the screenplay's text and a start frame within its beat, and binds each speaker to the staged actor who plays them. Check `sound.lines` and `sound.speakers` against the cited scene files and the subjects their scenes bind.

A direct 3D film's loudness record takes the delivery profile's targets, and its camera response the adopted [look](../../production/project-context.md#overview-and-look). Each exposure change it marks with `change` in its exposure continuity check cites the screenplay decision behind it. Check `delivery.loudness` and `optics` against the profile and the look.

For a catalog case, name the fact it exhibits and use the case parameters. For skilled practice, cite the observed exchange it reproduces. The catalog film lists every case used by the screenplay.

## Realization comments

Can a reader trace each value the declaration passes, and each default it relies on, to what it realizes, and every element of each cited beat to its values?

Comment each such value with its source and how it realizes it, so a reader can check it against that source without deriving it again. A scene's comment gives the beat anchor, the [beat element](../../motion/staging.md#reading-the-scene) and, for skilled practice, the study section. Every element of each cited beat reaches at least one commented value. A film cites the screenplay or profile entry a value takes, and a catalog case the fact or observed exchange it exhibits.

```ts
const rush = jun.run({
  // #s02-b03 action, "he rushes Mara": at full speed.
  pace: "sprint",
  // #s02-b03 action, "Jun snaps": he lunges at her.
  stride: 1.2,
  // #s02-b03 action, "Jun snaps": all his weight thrown at once, straight at her, past control.
  manner: { effort: { weight: 1, time: 1, space: 1, flow: -1 } },
  // #s02-b03 Space, "Jun by the door, Mara at the sink": 5 m to her.
  to: kitchen.sink.front,
  // via omitted: #s02-b03 Space leaves the floor between them clear, so he runs straight.
});
// #s02-b03 action, "knife raised": held high through the run.
overlay(rush, jun.raise(knife, { hand: "right" }));
// #s02-b03 Intent, "before she can get round the table": he sets off on her first step back.
sync(rush.start, maraBackStep.start);
```

## Composition only

Does the declaration compose only accepted module capabilities using installed operators and the screenplay's decisions?

Resolve the film once from one seed. Place absolute time only at screenplay anchors. Compose the [production entity's capabilities](entities.md#settings-realization), interactions and consequences with installed operators. Their capability owners handle calculations, constants, coordinates, direct law imports, URL parameters, archive loads and runtime selections.

Cast and crowds perform through the vocabulary. [Retarget](../../motion/retargeting.md) a supplied or user-chosen clip to its performer. Fix package [refusals](../../motion/compose/refusals.md) at the named axis.

Use the same capabilities in the film and catalog. Select a [catalog case](../../motion/catalog-cases.md#record) accepted for the scene's body, load, support and partner conditions. Recheck affected capabilities after a repair or change of conditions.

## Living scene

Does each participant carry out their part throughout the interval, with the movement and framing the beat requires?

Follow every presence through the interval. A held position needs a purpose in the beat or standing state. Combine the actions and axes the exchange requires, including [secondary actions](../../motion/compose/composition.md#action-axes).

Stage movement between the set's zones and landmarks. Follow or reframe motivated action unless the screenplay calls for a fixed view. Locate each adopted picture or sound target in the scene. For skilled practice, include the study's cues, timing and responses so delivery review can check them in the rendered exchange.

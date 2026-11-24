# Composition

Each exported function and method under `src/composition/scenes/` and in the catalog film `src/composition/films/catalog.ts` answers these items in its doc comment, beside [implementation](implementation.md). It realizes a screenplay rather than serving callers, so it documents that realization here instead of under [common](common.md). A screenplay film answers [films](films.md) instead. What a declaration cites depends on what it composes:

| Declaration | Cites |
| --- | --- |
| A scene in `src/composition/scenes/<film>/<scene>/` | Its screenplay scene file, or each section and beat of it |
| A catalog case in `src/composition/scenes/catalog/<module>/` | What it exhibits, named in prose |
| The catalog film | What each of its cases exhibits, named in prose |

Cite a beat or section as `@evidence docs/body/screenplay/<film folder>/<scene file>#<anchor> <what it realizes>`. Omit the anchor for a whole file.

Without narrative passes, scenes also cite the instructions they realize. Ask the user to add missing scene files or section or beat headings to a fixed screenplay before citing it.

Every section and beat is realized. An `OMITTED` one is covered by an `@evidenceExclude` on the scene composition that would have realized it. A whole omitted scene file is excluded on its film under [scene order](films.md#scene-order).

## Screenplay realization

Does each scene realize every cited beat as written, does each catalog case exhibit the fact it names, and does the catalog film play every case the screenplay uses?

### Scene

Open the scene comment with its screenplay citation, action and relevant staging choices. Bind staged instances to the subjects in the standing state. Follow the same instances through movement, handovers, cuts and time out of view. Realize changes in camera. The film's [sound list](films.md#sound-list) carries the beat's lines and cues. For commissioned generation, carry reactions beyond the representation in the prompt.

If staging a passage requires inventing an exchange, response or pause, return that decision to its [written owner](../../story/correction/repair.md#concretization). Changes to a fixed screenplay go to the user.

### Catalog

For a catalog case, name the fact it exhibits and use the case parameters. For skilled practice, cite the observed exchange it reproduces. The catalog film lists every case used by the screenplay.

## Realization comments

Can a reader trace each value the declaration passes, and each default it relies on, to what it realizes, and every element of each cited beat to its values?

Comment each such value with its source and how it realizes it, so a reader can check it against that source without deriving it again. A scene's comment gives the beat anchor, the [beat element](../../motion/staging.md#reading-the-scene) and, for skilled practice, the study section. Every element of each cited beat reaches at least one commented value. A catalog case cites the fact or observed exchange it exhibits.

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

The catalog film resolves once from one seed. Place absolute time only at screenplay anchors. Compose the [production entity's capabilities](entities.md#settings-realization), interactions and consequences with installed operators. Their capability owners handle calculations, constants, coordinates, direct law imports, URL parameters, archive loads and runtime selections.

Cast and crowds perform through the vocabulary. [Retarget](../../motion/retargeting.md) a supplied or user-chosen clip to its performer. Fix package [refusals](../../motion/compose/refusals.md) at the named axis.

Use the same capabilities in the screenplay's scenes and the catalog. Select a [catalog case](../../motion/catalog-cases.md#record) accepted for the scene's body, load, support and partner conditions. Recheck affected capabilities after a repair or change of conditions.

## Living scene

Does each participant carry out their part throughout the interval, with the movement and framing the beat requires?

Follow every presence through the interval. A held position needs a purpose in the beat or standing state. Combine the actions and axes the exchange requires, including [secondary actions](../../motion/compose/composition.md#action-axes).

Stage movement between the set's zones and landmarks. Follow or reframe motivated action unless the screenplay calls for a fixed view. Locate each adopted picture or sound target in the scene. For skilled practice, include the study's cues, timing and responses so delivery review can check them in the rendered exchange.

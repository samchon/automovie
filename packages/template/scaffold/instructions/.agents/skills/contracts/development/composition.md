# Composition

Each exported function and method of a screenplay scene in `src/composition/scenes/<film>/<scene>/` answers these items in its doc comment, beside [implementation](implementation.md). It realizes a screenplay rather than serving callers, so it documents that realization here instead of under [common](common.md). A screenplay film answers [films](films.md) and the catalog answers [catalog](catalog.md) instead.

A scene cites its screenplay scene file, or each section and beat of it, as `@evidence docs/body/screenplay/<film folder>/<scene file>#<anchor> <what it realizes>`. Omit the anchor for a whole file.

Without narrative passes, scenes also cite the instructions they realize. Ask the user to add missing section or beat headings to a fixed screenplay before citing it.

Every section and beat is realized. An `OMITTED` one is covered by an `@evidenceExclude` on the scene composition that would have realized it. A whole omitted scene file is excluded on its film under [scene order](films.md#scene-order).

## Screenplay realization

Does each scene realize every cited beat as written?

Open the scene comment with its screenplay citation, action and relevant staging choices. Bind staged instances to the subjects in the standing state. Follow the same instances through movement, handovers, cuts and time out of view. Realize changes in camera. For a direct 3D film, the film's [sound list](films.md#sound-list) carries the beat's lines and cues. For other films, compose the beat's outcome sound cues from `src/consequences/sound/`, as [source layout](../../development/source-layout.md#laws-interactions-and-consequences) places them. For commissioned generation, carry reactions beyond the representation in the prompt.

If staging a passage requires inventing an exchange, response or pause, return that decision to its [written owner](../../story/correction/repair.md#concretization). Changes to a fixed screenplay go to the user.

### Beat annotations

<!-- @source The beat elements in motion/staging.md and the screenplay records in story/layers/notation.md. -->

Trace each cited [beat element](../../motion/staging.md#reading-the-scene) to at least one [commented value](../../development/modules.md#documenting-source). Include the beat anchor and, for skilled practice, the study section.

```ts
import { HumanChain } from "@automovie/motions";

const composition = HumanChain.subject("mara")
  .stand(
    // #s02-b03 action, "Mara holds her place for two seconds."
    { hold: 2 },
    "wait",
  )
  .over((upper) =>
    upper.gesture(
      // #s02-b03 action, "She brings her palms together as she waits."
      { kind: "palmsTogether" },
    ),
  )
  .sync({
    // #s02-b03 Sound, "She begins at the third beat."
    of: "score",
    event: "beat",
    index: 2,
  }).node;
```

## Composition only

Does the scene compose only accepted module capabilities using installed operators and the screenplay's decisions?

Place absolute time only at screenplay anchors and follow the [composition rules](../../development/modules.md#how-the-parts-work-together). [Retarget](../../motion/retargeting.md) supplied clips to their performers. Fix [refusals](../../motion/compose/refusals.md) at the named axis.

Verify the module in an interval that exhibits the scene's body, load, support and partner conditions. Use a [separate case](../../motion/catalog-cases.md) when those conditions need an independent check. Recheck affected capabilities after a repair or change of conditions.

## Living scene

Does each participant carry out their part throughout the interval, with the movement and framing the beat requires?

Follow every presence through the interval. A held position needs a purpose in the beat or standing state. Combine the actions and axes the exchange requires, including [secondary actions](../../motion/compose/composition.md#action-axes).

Stage movement between the set's zones and landmarks. Follow or reframe motivated action unless the screenplay calls for a fixed view. Locate each adopted picture or sound target in the scene. For skilled practice, include the study's cues, timing and responses so delivery review can check them in the rendered exchange.

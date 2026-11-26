# Composition

Each exported function and method in `src/composition/scenes/<film>/<scene>/` answers these items and [implementation](implementation.md) in its doc comment. Use these realization items in place of [common](common.md). Screenplay films answer [films](films.md). Catalogs answer [catalog](catalog.md).

A scene cites its screenplay scene file, or each section and beat of it, as `@evidence docs/body/screenplay/<film folder>/<scene file>#<anchor> <what it realizes>`. Omit the anchor for a whole file.

Without narrative passes, scenes also cite the instructions they realize. Ask the user to add missing section or beat headings to a fixed screenplay before citing it.

Every section and beat is realized. An `OMITTED` one is covered by an `@evidenceExclude` on the scene composition that would have realized it. A whole omitted scene file is excluded on its film under [scene order](films.md#scene-order).

## Screenplay realization

Does each scene realize every cited beat as written?

Open the scene comment with the screenplay citation, action and staging choices. Bind instances to standing-state subjects and preserve their identity through movement, handovers, cuts and time out of view. Realize camera changes.

- Direct 3D films carry lines and cues in the film's [sound list](films.md#sound-list).
- Other films compose outcome cues from `src/consequences/sound/`.
- For commissioned generation, prompt for reactions beyond the representation.

If staging a passage requires inventing an exchange, response or pause, return that decision to its [written owner](../../story/correction/repair.md#concretization). Changes to a fixed screenplay go to the user.

### Beat annotations

<!-- @source The beat elements in motion/staging.md and the screenplay records in story/layers/notation.md. -->

Trace each cited beat element to at least one [commented value](../../development/modules.md#documenting-source). Include the beat anchor and, for skilled practice, the study section.

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

Use absolute time only at screenplay anchors. Follow the [composition rules](../../development/modules.md#how-the-parts-work-together). [Retarget clips](../../motion/retargeting.md) to their performers and fix [refusals](../../motion/compose/refusals.md) at the named axis.

Verify the module in an interval that exhibits the scene's body, load, support and partner conditions. Use a [separate case](../../motion/catalog-cases.md) when those conditions need an independent check. Recheck affected capabilities after a repair or change of conditions.

## Living scene

Does each participant carry out their part throughout the interval, with the movement and framing the beat requires?

Follow every presence through the interval. A held position needs a purpose in the beat or standing state. Combine the actions and axes the exchange requires, including [secondary actions](../../motion/compose/composition.md#action-axes).

Stage movement between the set's zones and landmarks. Follow or reframe motivated action unless the screenplay calls for a fixed view. Locate each adopted picture or sound target in the scene. For skilled practice, include the study's cues, timing and responses so delivery review can check them in the rendered exchange.

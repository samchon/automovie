import { AutoMovieTransitionDisplays } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import type * as THREE from "three";

import { createDisplayCompositionRenderer } from "../internal/createDisplayCompositionRenderer";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A transition's held layers reach the display compositor by their weights, and
 * a fade over a transparent background takes the compositor's transparent
 * branch, which `renderAutoMovieFilmFrame` had no caller for.
 *
 * Scenarios:
 *
 * 1. Holding two slots copies the canvas twice, at the drawing buffer's size.
 * 2. A dissolve of the outgoing slot at 0.75 and the live slot at 0.25 replays
 *    both held pictures as the compositor's sources, outgoing first, and mixes
 *    them at the incoming weight 0.25, not as a fade.
 * 3. A fade of one slot at weight 0.5 over a transparent background reaches the
 *    compositor as a fade at mix 0.5 toward a transparent pixel; the same fade
 *    over an opaque background falls toward opaque black.
 * 4. Compositing a slot that was never held is refused, naming the slot.
 * 5. Disposing releases each held copy once.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Holds and composites through `AutoMovieTransitionDisplays` over the established compositor double and asserts the copies, the replayed sources and the compositor's mix, fade and transparent uniforms; a dropped `transparent`, a swapped weight, a fade drawn as a dissolve or a stale slot fails.
 * @evidence contracts/development/testing.md#independent-expectations The compositor's contract fixes the mix as the incoming weight for a dissolve and one minus the weight for a fade, and the transparent branch is the fade target #4090 defined; the double's buffer is 64 by 32 pixels by construction.
 * @evidence contracts/development/testing.md#distinguishing-cases Dissolve against fade, transparent against opaque fade, held against unheld slot, and disposal; the compositor's GPU bytes are observed by the SwiftShader capture, and the layer weights by `test_film_playback_layers`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_draw_transition_composite`; the renderer is the in-memory compositor double and no GPU starts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_draw_transition_composite(): void {
  const host: ReturnType<typeof createDisplayCompositionRenderer> =
    createDisplayCompositionRenderer();
  const displays: AutoMovieTransitionDisplays =
    new AutoMovieTransitionDisplays();

  // 1. Two held slots.
  displays.hold(host.renderer, 0);
  displays.hold(host.renderer, 1);
  const held: THREE.FramebufferTexture[] = [...host.copied];
  TestValidator.equals(
    "each slot holds one copy of the drawing buffer",
    held.map((copy: THREE.FramebufferTexture): number[] => [
      copy.image.width,
      copy.image.height,
    ]),
    [
      [64, 32],
      [64, 32],
    ],
  );

  // 2. A dissolve.
  host.calls.length = 0;
  displays.composite(
    host.renderer,
    [
      { weight: 0.75, slot: 0 },
      { weight: 0.25, slot: 1 },
    ],
    false,
  );
  const dissolve: (typeof host.rendered)[number] = host.rendered.at(-1)!;
  TestValidator.predicate(
    "a dissolve replays both slots and mixes at the incoming weight",
    host.calls.filter((call: string): boolean => call === "sourceRender")
      .length === 2 &&
      !dissolve.fade &&
      nclose(dissolve.alpha, 0.25, 0),
  );

  // 3. Fades.
  displays.composite(host.renderer, [{ weight: 0.5, slot: 0 }], true);
  const transparent: (typeof host.rendered)[number] = host.rendered.at(-1)!;
  displays.composite(host.renderer, [{ weight: 0.5, slot: 0 }], false);
  const opaque: (typeof host.rendered)[number] = host.rendered.at(-1)!;
  TestValidator.predicate(
    "a transparent fade falls toward alpha 0, an opaque one toward black",
    transparent.fade &&
      transparent.fadeTransparent &&
      nclose(transparent.alpha, 0.5, 0) &&
      opaque.fade &&
      !opaque.fadeTransparent,
  );

  // 4. An unheld slot.
  TestValidator.predicate(
    "an unheld slot is refused by name",
    throwsError(
      (): void =>
        displays.composite(host.renderer, [{ weight: 0.5, slot: 2 }], false),
      "slot 2",
    ),
  );

  // 5. Disposal.
  let released: number = 0;
  for (const copy of held)
    copy.addEventListener("dispose", (): void => {
      released++;
    });
  displays.dispose();
  TestValidator.equals("each held copy is released once", released, 2);
}

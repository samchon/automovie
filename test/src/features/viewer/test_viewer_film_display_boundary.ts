import {
  disposeCrossDissolve,
  disposeFadeToBlack,
  readAutoMovieFilmDisplayTextureResidency,
  renderAutoMovieFilmFrame,
  renderFadeToBlackFrame,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createDisplayCompositionRenderer } from "../internal/createDisplayCompositionRenderer";
import { nclose } from "../internal/predicates";

/**
 * The sampled-film consumer separates beauty weights from structural samples and refuses invalid admission before changing the previous display.
 *
 * Scenarios:
 * 1. Direct, fade and dissolve call their exact sampled source and pass owner.
 * 2. Every structural pass uses Engine's dominant sample and incoming tie rule.
 * 3. Invalid cardinality and weights refuse before a callback mutates display.
 * 4. Empty/invalid dimensions refuse, with positive resize recovering normally.
 * 5. Null context attributes remain supported, while disposal attempts all resources, retains failed closed ownership and preserves its completion without retry, while successful ended ownership is removed.
 *
 * @evidence contracts/testing.md#behavioral-verification Invokes the real film/pass boundary and compositor ownership paths with the existing controlled renderer, then observes actual Three texture disposal events and registry residency; catches malformed sampling mutation, skipped release, failure-erased ownership and native release retries without claiming GPU pixel parity.
 * @evidence contracts/testing.md#independent-expectations Authored source callbacks pin sample/pass order, engine dominant-sample rule pins structural ties, and supplied Error identities/dispose counts pin one attempt per owner; closed failure must stay in potential residency rather than disappear because a registry entry was deleted.
 * @evidence contracts/testing.md#distinguishing-cases Covers direct/fade/dissolve, all structural passes, malformed cardinality/weight/dimensions, successful resize/release, null attributes, two throwing dispose listeners, repeated release/draw refusal and target restoration; separate pixel and device suites own actual GPU color behavior.
 * @evidence contracts/testing.md#execution-ownership Portable unit owns in-memory Three targets/textures and the existing explicit renderer-control seam, with no native WebGL context, browser or process; callbacks/maps are declared per case and no global or foreign method is replaced.
 */
export function test_viewer_film_display_boundary(): void {
  const host: ReturnType<typeof createDisplayCompositionRenderer> =
    createDisplayCompositionRenderer();
  TestValidator.equals(
    "unused renderer owns no display copies",
    readAutoMovieFilmDisplayTextureResidency(host.renderer),
    [],
  );
  const calls: Array<{
    shot: string;
    time: number;
    weight: number;
    pass: string;
  }> = [];
  const render: (
    layer: { shot: string; time: number; weight: number },
    pass: string,
  ) => void = (
    layer: { shot: string; time: number; weight: number },
    pass: string,
  ): void => {
    calls.push({ ...layer, pass });
  };
  renderAutoMovieFilmFrame(
    host.renderer,
    [{ shot: "direct", time: 1, weight: 1 }],
    "beauty",
    render,
  );
  renderAutoMovieFilmFrame(
    host.renderer,
    [{ shot: "fade", time: 2, weight: 0.25 }],
    "beauty",
    render,
  );
  const layers: { shot: string; time: number; weight: number }[] = [
    { shot: "out", time: 3, weight: 0.5 },
    { shot: "in", time: 4, weight: 0.5 },
  ];
  renderAutoMovieFilmFrame(host.renderer, layers, "beauty", render);
  const residency: {
    owner: "film-fade" | "film-dissolve";
    width: number;
    height: number;
    copies: 3;
  }[] = readAutoMovieFilmDisplayTextureResidency(host.renderer);
  TestValidator.equals(
    "both acquired compositors retain three RGBA8 copies",
    residency,
    [
      { owner: "film-fade", width: 64, height: 32, copies: 3 },
      { owner: "film-dissolve", width: 64, height: 32, copies: 3 },
    ],
  );
  residency[0]!.width = 1;
  TestValidator.equals(
    "host residency records are owned copies",
    readAutoMovieFilmDisplayTextureResidency(host.renderer)[0]!.width,
    64,
  );
  const expectedSources: typeof calls = [
    { shot: "direct", time: 1, weight: 1, pass: "beauty" },
    { shot: "fade", time: 2, weight: 0.25, pass: "beauty" },
    { shot: "out", time: 3, weight: 0.5, pass: "beauty" },
    { shot: "in", time: 4, weight: 0.5, pass: "beauty" },
  ];
  TestValidator.predicate(
    "exact beauty source samples",
    calls.length === expectedSources.length &&
      calls.every(
        (
          actual: { shot: string; time: number; weight: number; pass: string },
          index: number,
        ): boolean => {
          const expected: (typeof calls)[number] = expectedSources[index]!;
          return (
            actual.shot === expected.shot &&
            actual.pass === expected.pass &&
            nclose(actual.time, expected.time, 0) &&
            nclose(actual.weight, expected.weight, 0)
          );
        },
      ),
  );
  for (const pass of ["depth", "mask", "normal", "outline", "pose"] as const) {
    renderAutoMovieFilmFrame(host.renderer, layers, pass, render);
    const actual: (typeof calls)[number] = calls.at(-1)!;
    TestValidator.predicate(
      "guide tie retains incoming sample at full weight",
      actual.shot === "in" &&
        actual.pass === pass &&
        nclose(actual.time, 4, 0) &&
        nclose(actual.weight, 1, 0),
    );
  }
  const previous: number = calls.length;
  for (const invalid of [
    [],
    [{ weight: NaN }],
    [{ weight: -0.1 }],
    [{ weight: 1.1 }],
    [{ weight: 0.2 }, { weight: 0.7 }],
  ]) {
    let refused: boolean = false;
    try {
      renderAutoMovieFilmFrame(host.renderer, invalid, "beauty", (): void => {
        calls.push({ shot: "invalid", time: 0, weight: 0, pass: "beauty" });
      });
    } catch {
      refused = true;
    }
    TestValidator.predicate(
      "invalid admission refuses before drawing",
      refused && calls.length === previous,
    );
  }
  for (const [width, height] of [
    [0, 1],
    [1, 0],
    [-1, 1],
    [1, -1],
    [NaN, 1],
    [1, NaN],
    [1.5, 1],
    [1, 1.5],
  ]) {
    const invalid: ReturnType<typeof createDisplayCompositionRenderer> =
      createDisplayCompositionRenderer(width, height);
    let refused: boolean = false;
    try {
      renderFadeToBlackFrame(invalid.renderer, (): undefined => undefined, 0.5);
    } catch {
      refused = true;
    }
    TestValidator.predicate("invalid drawing-buffer size", refused);
  }
  host.size.set(0, 1);
  let resizeRefused: boolean = false;
  try {
    renderFadeToBlackFrame(host.renderer, (): undefined => undefined, 0.5);
  } catch {
    resizeRefused = true;
  }
  TestValidator.predicate("invalid resize refuses", resizeRefused);
  host.size.set(1, 1);
  const unreported: ReturnType<typeof createDisplayCompositionRenderer> =
    createDisplayCompositionRenderer(1, 1, null);
  renderFadeToBlackFrame(unreported.renderer, (): undefined => undefined, 0.5);
  disposeFadeToBlack(unreported.renderer);
  const failed: ReturnType<typeof createDisplayCompositionRenderer> =
    createDisplayCompositionRenderer();
  renderFadeToBlackFrame(failed.renderer, (): undefined => undefined, 0.5);
  const first: Error = new Error("first disposal"),
    second: Error = new Error("second disposal");
  let firstAttempts: number = 0;
  let secondAttempts: number = 0;
  failed.copied[0]!.addEventListener("dispose", (): never => {
    ++firstAttempts;
    throw first;
  });
  failed.copied[1]!.addEventListener("dispose", (): never => {
    ++secondAttempts;
    throw second;
  });
  let aggregate: unknown;
  try {
    disposeFadeToBlack(failed.renderer);
  } catch (error) {
    aggregate = error;
  }
  TestValidator.predicate(
    "all resource failures retained",
    aggregate instanceof AggregateError &&
      aggregate.errors.includes(first) &&
      aggregate.errors.includes(second),
  );
  let repeatedFailure: unknown;
  let drawingFailure: unknown;
  let afterCloseCallbacks: number = 0;
  const copiesBeforeRefusal: number = failed.copied.length;
  try {
    disposeFadeToBlack(failed.renderer);
  } catch (error) {
    repeatedFailure = error;
  }
  try {
    renderFadeToBlackFrame(
      failed.renderer,
      (): void => {
        ++afterCloseCallbacks;
      },
      0.5,
    );
  } catch (error) {
    drawingFailure = error;
  }
  TestValidator.predicate(
    "failed retirement keeps one completion and refuses new drawing",
    repeatedFailure === aggregate && drawingFailure === aggregate,
  );
  TestValidator.equals(
    "failed owners never retry disposal or copy another display",
    [firstAttempts, secondAttempts, afterCloseCallbacks, failed.copied.length],
    [1, 1, 0, copiesBeforeRefusal],
  );
  TestValidator.equals(
    "failed closure still reports its retained potential copies",
    readAutoMovieFilmDisplayTextureResidency(failed.renderer),
    [{ owner: "film-fade", width: 64, height: 32, copies: 3 }],
  );
  const one: ReturnType<typeof createDisplayCompositionRenderer> =
    createDisplayCompositionRenderer();
  renderFadeToBlackFrame(one.renderer, (): undefined => undefined, 0.5);
  one.copied[1]!.addEventListener("dispose", (): never => {
    throw first;
  });
  let single: unknown;
  try {
    disposeFadeToBlack(one.renderer);
  } catch (error) {
    single = error;
  }
  TestValidator.predicate(
    "single disposal error preserves identity",
    single === first,
  );
  const target: THREE.WebGLRenderTarget<
    THREE.Texture<unknown, THREE.TextureEventMap>
  > = new THREE.WebGLRenderTarget(2, 2);
  host.renderer.setRenderTarget(target);
  host.errors.set("host", first);
  let targetError: unknown;
  try {
    renderFadeToBlackFrame(host.renderer, (): undefined => undefined, 0.5);
  } catch (error) {
    targetError = error;
  }
  TestValidator.predicate(
    "target failure and restoration aggregate",
    targetError instanceof AggregateError &&
      targetError.errors.every((cause: unknown): boolean => cause === first),
  );
  target.dispose();
  disposeFadeToBlack(host.renderer);
  disposeCrossDissolve(host.renderer);
  TestValidator.equals(
    "release removes every active display-copy lifetime",
    readAutoMovieFilmDisplayTextureResidency(host.renderer),
    [],
  );
}

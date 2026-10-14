import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { disposeCrossDissolve, readAutoMovieFilmDisplayTextureResidency, renderCrossDissolve, renderCrossDissolveFrames } from "@automovie/viewer";



import { createDisplayCompositionRenderer } from "../internal/createDisplayCompositionRenderer";
import { nclose } from "../internal/predicates";

/**
 * Display-source copies retain renderer-local ownership and the pose wrapper carries the original source sample and optional pass owner into each draw.
 *
 * Scenarios:
 * 1. Endpoints and intermediate weights resolve both callbacks in order.
 * 2. Source copies reuse, resize, dispose once and recreate independently.
 * 3. A caller-owned target receives the result and retains its canvas backing.
 * 4. Invalid alpha refuses, while the pose wrapper preserves callback order.
 * 5. A throwing source-texture disposal cannot skip either healthy copy and repeats preserve the same closed-owner failure without disposal or draw.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs actual dissolve/compositor functions through the existing explicit renderer-control seam and reads real FramebufferTexture identity/extents/dispose events; distinguishes local reuse, healthy recreation and failed retirement that loses owner state or retries native release, without observing GPU pixels.
 * @evidence contracts/testing.md#independent-expectations Caller source sequence pins outgoing/incoming order, requested drawing-buffer integers pin copy extent, and supplied Error plus one event per three distinct copies pins one-attempt failure completion independently of registry implementation.
 * @evidence contracts/testing.md#distinguishing-cases Exercises both weight endpoints/midpoint, two renderers, resize, successful repeat/recreation, caller target/backing, invalid alpha and pose/pass wrapper, then one throwing copy with two healthy releases and post-close callback refusal.
 * @evidence contracts/testing.md#execution-ownership Portable unit uses existing in-memory renderer ports and actual Three textures/targets; no browser/context, filesystem or process is created, all case callbacks are inline and foreign/global methods are never replaced.
 */
export function test_viewer_dissolve_state(): void {
  const a: ReturnType<typeof createDisplayCompositionRenderer> =
      createDisplayCompositionRenderer(),
    b: ReturnType<typeof createDisplayCompositionRenderer> =
      createDisplayCompositionRenderer(128, 72);
  disposeCrossDissolve(a.renderer);
  let order: string = "";
  for (const alpha of [0, 0.5, 1])
    renderCrossDissolveFrames(
      a.renderer,
      (): void => {
        order += "o";
      },
      (): void => {
        order += "i";
      },
      alpha,
    );
  renderCrossDissolveFrames(
    b.renderer,
    (): undefined => undefined,
    (): undefined => undefined,
    0.25,
  );
  TestValidator.equals("every boundary resolves both sources", order, "oioioi");
  TestValidator.predicate(
    "weights reach byte shader",
    a.rendered.length === 3 &&
      a.rendered.every(
        (
          frame: {
            target: THREE.WebGLRenderTarget | null;
            face: number;
            mip: number;
            alpha: number;
            fade: boolean;
            backing: boolean;
            srgb: boolean;
            viewport: number[];
            scissor: number[];
            scissorTest: boolean;
          },
          index: number,
        ): boolean => nclose(frame.alpha, [0, 0.5, 1][index]!, 0),
      ),
  );
  TestValidator.predicate(
    "copies stay renderer-local",
    a.copied[1] === a.copied[4] &&
      a.copied[2] === a.copied[5] &&
      a.copied[1] !== b.copied[1],
  );
  a.size.set(320, 240);
  renderCrossDissolveFrames(
    a.renderer,
    (): undefined => undefined,
    (): undefined => undefined,
    0.5,
  );
  TestValidator.equals(
    "owned buffer dimensions",
    [
      a.copied[1]!.image.width,
      a.copied[1]!.image.height,
      b.copied[1]!.image.width,
    ],
    [320, 240, 128],
  );
  let disposed: number = 0;
  a.copied[1]!.addEventListener("dispose", (): void => {
    disposed++;
  });
  disposeCrossDissolve(a.renderer);
  disposeCrossDissolve(a.renderer);
  renderCrossDissolveFrames(
    a.renderer,
    (): undefined => undefined,
    (): undefined => undefined,
    0.5,
  );
  TestValidator.predicate(
    "release once and recreate",
    disposed === 1 && a.copied.at(-2) !== a.copied[1],
  );
  const host: ReturnType<typeof createDisplayCompositionRenderer> =
      createDisplayCompositionRenderer(),
    target: THREE.WebGLRenderTarget<
      THREE.Texture<unknown, THREE.TextureEventMap>
    > = new THREE.WebGLRenderTarget(4, 4);
  host.renderer.setRenderTarget(target);
  renderCrossDissolveFrames(
    host.renderer,
    (): undefined => undefined,
    (): undefined => undefined,
    0.5,
  );
  TestValidator.predicate(
    "host and backing survive",
    host.rendered[0]!.target === target &&
      host.rendered[1]!.backing &&
      host.renderer.getRenderTarget() === target,
  );
  for (const alpha of [NaN, -0.01, 1.01]) {
    let refused: boolean = false;
    try {
      renderCrossDissolveFrames(
        a.renderer,
        (): undefined => undefined,
        (): undefined => undefined,
        alpha,
      );
    } catch {
      refused = true;
    }
    TestValidator.predicate("invalid alpha", refused);
  }
  let poses: string = "",
    halves: number = 0;
  renderCrossDissolve(
    b.renderer,
    new THREE.Scene(),
    new THREE.Camera(),
    (): void => {
      poses += "o";
    },
    (): void => {
      poses += "i";
    },
    0.5,
    (): void => {
      halves++;
    },
  );
  TestValidator.equals("pose and pass ownership", [poses, halves], ["oi", 2]);
  const wrapper: ReturnType<typeof createDisplayCompositionRenderer> =
    createDisplayCompositionRenderer();
  renderCrossDissolve(
    wrapper.renderer,
    new THREE.Scene(),
    new THREE.Camera(),
    (): undefined => undefined,
    (): undefined => undefined,
    0.5,
  );
  const failed: ReturnType<typeof createDisplayCompositionRenderer> =
    createDisplayCompositionRenderer();
  renderCrossDissolveFrames(
    failed.renderer,
    (): void => {},
    (): void => {},
    0.5,
  );
  const failure: Error = new Error("Dissolve copy retirement refused.");
  let sourceAttempts: number = 0;
  let incomingAttempts: number = 0;
  let backingAttempts: number = 0;
  failed.copied[1]!.addEventListener("dispose", (): never => {
    ++sourceAttempts;
    throw failure;
  });
  failed.copied[2]!.addEventListener("dispose", (): void => {
    ++incomingAttempts;
  });
  failed.copied[0]!.addEventListener("dispose", (): void => {
    ++backingAttempts;
  });
  let firstFailure: unknown;
  let repeatedFailure: unknown;
  let drawingFailure: unknown;
  let attemptedSources: number = 0;
  try {
    disposeCrossDissolve(failed.renderer);
  } catch (error) {
    firstFailure = error;
  }
  try {
    disposeCrossDissolve(failed.renderer);
  } catch (error) {
    repeatedFailure = error;
  }
  try {
    renderCrossDissolveFrames(
      failed.renderer,
      (): void => {
        ++attemptedSources;
      },
      (): void => {
        ++attemptedSources;
      },
      0.5,
    );
  } catch (error) {
    drawingFailure = error;
  }
  TestValidator.predicate(
    "failed dissolve keeps one actual completion",
    firstFailure === failure &&
      repeatedFailure === failure &&
      drawingFailure === failure,
  );
  TestValidator.equals(
    "throwing copy never skips healthy copies or retries",
    [sourceAttempts, incomingAttempts, backingAttempts, attemptedSources],
    [1, 1, 1, 0],
  );
  TestValidator.equals(
    "closed failed owner remains potentially resident",
    readAutoMovieFilmDisplayTextureResidency(failed.renderer),
    [{ owner: "film-dissolve", width: 64, height: 32, copies: 3 }],
  );
  target.dispose();
  disposeCrossDissolve(a.renderer);
  disposeCrossDissolve(b.renderer);
  disposeCrossDissolve(host.renderer);
  disposeCrossDissolve(wrapper.renderer);
}

import { TestValidator } from "@nestia/e2e";
import type * as THREE from "three";

import { disposeCrossDissolve, readAutoMovieFilmDisplayTextureResidency, renderCrossDissolveFrames } from "@automovie/viewer";


import { createDisplayCompositionRenderer } from "../internal/createDisplayCompositionRenderer";

/**
 * Failed old-copy retirement retains its original extent and closes the owner; an independent healthy lifetime still resizes and reuses its current copies.
 *
 * Scenarios:
 * 1. Two independent disposal failures retain their identities, attempt all three real wrappers and leave old extents/upload generations unchanged.
 * 2. Same/different-size draw and final release keep the failed completion without another release, callback, copy or fresh allocation.
 * 3. A single failure retains its Error; an independent healthy owner updates every copy once, reuses equal dimensions and closes successfully.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs actual dissolve resize/release through the existing renderer-control seam and observes real FramebufferTexture disposal events, images, versions, callback refusal and residency. Detects failed ownership erased or relabeled as new storage; it does not claim observed GPU pixels or allocations.
 * @evidence contracts/testing.md#independent-expectations Public release failure cannot certify that the old allocation ended, so prior pixel dimensions and upload generations remain the conservative extent. Supplied Error identities and one event per wrapper pin independent attempts; a separate healthy lifetime supplies the positive resize/release comparison.
 * @evidence contracts/testing.md#distinguishing-cases Preserves two-failure, repeated-size and single-failure cases, distinguishing terminal uncertainty from independent healthy resize, equal-size reuse and successful release. Invalid dimension preflight belongs to film_display_boundary; native image/device behavior belongs to its host cases.
 * @evidence contracts/testing.md#execution-ownership The named portable unit uses the existing in-memory renderer port and public listeners on actual Three textures. It installs no browser, native context or process and replaces no global or foreign method.
 */
export function test_viewer_display_resize_recovery(): void {
  const host: ReturnType<typeof createDisplayCompositionRenderer> =
    createDisplayCompositionRenderer();
  renderCrossDissolveFrames(
    host.renderer,
    (): void => {},
    (): void => {},
    0.5,
  );
  const textures: THREE.FramebufferTexture[] = [...new Set(host.copied)];
  TestValidator.equals(
    "three acquired copies start at the host extent",
    textures.map((texture: THREE.FramebufferTexture): number[] => [
      texture.image.width,
      texture.image.height,
    ]),
    [
      [64, 32],
      [64, 32],
      [64, 32],
    ],
  );
  const first: Error = new Error("first resize disposal");
  const second: Error = new Error("second resize disposal");
  let firstFails: boolean = true;
  let secondFails: boolean = true;
  let retirements: number = 0;
  const reentrantErrors: unknown[] = [];
  textures[0]!.addEventListener("dispose", (): void => {
    ++retirements;
    try {
      disposeCrossDissolve(host.renderer);
    } catch (error) {
      reentrantErrors.push(error);
    }
    if (firstFails) throw first;
  });
  textures[1]!.addEventListener("dispose", (): void => {
    ++retirements;
    if (secondFails) throw second;
  });
  textures[2]!.addEventListener("dispose", (): void => {
    ++retirements;
  });
  const versions: number[] = textures.map(
    (texture: THREE.FramebufferTexture): number => texture.version,
  );
  host.size.set(128, 64);
  let failure: unknown;
  try {
    renderCrossDissolveFrames(
      host.renderer,
      (): void => {},
      (): void => {},
      0.5,
    );
  } catch (error) {
    failure = error;
  }
  TestValidator.predicate(
    "both resize failures remain visible",
    failure instanceof AggregateError &&
      failure.errors.length === 2 &&
      failure.errors.includes(first) &&
      failure.errors.includes(second),
  );
  TestValidator.predicate(
    "reentrant release cannot end an in-progress resize",
    reentrantErrors.length === 1 &&
      reentrantErrors[0] instanceof Error &&
      reentrantErrors[0].message.includes("still running"),
  );
  TestValidator.equals(
    "all old copies retire once without publishing new extents",
    {
      retirements,
      extents: textures.map((texture: THREE.FramebufferTexture): number[] => [
        texture.image.width,
        texture.image.height,
      ]),
      versions: textures.map(
        (texture: THREE.FramebufferTexture): number => texture.version,
      ),
    },
    {
      retirements: 3,
      extents: [
        [64, 32],
        [64, 32],
        [64, 32],
      ],
      versions,
    },
  );
  firstFails = false;
  secondFails = false;
  let callbacks: number = 0;
  const copies: number = host.copied.length;
  for (const dimensions of [
    [128, 64],
    [256, 128],
    [64, 32],
  ]) {
    host.size.set(dimensions[0]!, dimensions[1]!);
    let repeated: unknown;
    try {
      renderCrossDissolveFrames(
        host.renderer,
        (): void => {
          ++callbacks;
        },
        (): void => {
          ++callbacks;
        },
        0.5,
      );
    } catch (error) {
      repeated = error;
    }
    TestValidator.predicate(
      "failed resize retains its original completion",
      repeated === failure,
    );
  }
  let finalFailure: unknown;
  try {
    disposeCrossDissolve(host.renderer);
  } catch (error) {
    finalFailure = error;
  }
  TestValidator.predicate(
    "failed final release shares the resize completion",
    finalFailure === failure,
  );
  TestValidator.equals(
    "failed owner never retries or draws",
    [callbacks, retirements, host.copied.length],
    [0, 3, copies],
  );
  TestValidator.equals(
    "failed resize retains its previous potential copy extent",
    readAutoMovieFilmDisplayTextureResidency(host.renderer),
    [{ owner: "film-dissolve", width: 64, height: 32, copies: 3 }],
  );

  const single: ReturnType<typeof createDisplayCompositionRenderer> =
    createDisplayCompositionRenderer();
  renderCrossDissolveFrames(
    single.renderer,
    (): void => {},
    (): void => {},
    0.5,
  );
  let singleAttempts: number = 0;
  for (const texture of new Set(single.copied))
    texture.addEventListener("dispose", (): void => {
      ++singleAttempts;
      if (texture === single.copied[0]) throw first;
    });
  single.size.set(256, 128);
  let singleFailure: unknown;
  try {
    renderCrossDissolveFrames(
      single.renderer,
      (): void => {},
      (): void => {},
      0.5,
    );
  } catch (error) {
    singleFailure = error;
  }
  TestValidator.predicate(
    "single resize failure preserves identity",
    singleFailure === first,
  );
  try {
    disposeCrossDissolve(single.renderer);
  } catch (error) {
    singleFailure = error;
  }
  TestValidator.predicate(
    "single failed closure keeps its same cause",
    singleFailure === first,
  );
  TestValidator.equals(
    "single failure cannot skip healthy old copies or retry",
    singleAttempts,
    3,
  );

  const healthy: ReturnType<typeof createDisplayCompositionRenderer> =
    createDisplayCompositionRenderer();
  renderCrossDissolveFrames(
    healthy.renderer,
    (): void => {},
    (): void => {},
    0.5,
  );
  const healthyTextures: THREE.FramebufferTexture[] = [
    ...new Set(healthy.copied),
  ];
  const healthyVersions: number[] = healthyTextures.map(
    (texture: THREE.FramebufferTexture): number => texture.version,
  );
  let healthyAttempts: number = 0;
  for (const texture of healthyTextures)
    texture.addEventListener("dispose", (): void => {
      ++healthyAttempts;
    });
  healthy.size.set(256, 128);
  renderCrossDissolveFrames(
    healthy.renderer,
    (): void => {},
    (): void => {},
    0.5,
  );
  TestValidator.equals(
    "healthy resize updates the complete lifetime",
    {
      attempts: healthyAttempts,
      extents: healthyTextures.map(
        (texture: THREE.FramebufferTexture): number[] => [
          texture.image.width,
          texture.image.height,
        ],
      ),
      versions: healthyTextures.map(
        (texture: THREE.FramebufferTexture): number => texture.version,
      ),
    },
    {
      attempts: 3,
      extents: [
        [256, 128],
        [256, 128],
        [256, 128],
      ],
      versions: healthyVersions.map((version: number): number => version + 1),
    },
  );
  renderCrossDissolveFrames(
    healthy.renderer,
    (): void => {},
    (): void => {},
    0.5,
  );
  TestValidator.equals(
    "healthy same-size draw reuses its copies",
    healthyAttempts,
    3,
  );
  disposeCrossDissolve(healthy.renderer);
  disposeCrossDissolve(healthy.renderer);
  TestValidator.equals(
    "healthy final release closes all copies once",
    healthyAttempts,
    6,
  );
  TestValidator.equals(
    "healthy final release removes its residency",
    readAutoMovieFilmDisplayTextureResidency(healthy.renderer),
    [],
  );
}

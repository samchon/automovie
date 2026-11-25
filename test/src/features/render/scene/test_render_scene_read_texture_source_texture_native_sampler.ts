import {
  autoMovieRenderTextureDigest,
  measureAutoMovieRenderTextureClosure,
} from "@automovie/engine";
import type { IAutoMovieRenderTextureSource } from "@automovie/interface";
import { readAutoMovieTextureSource } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import type { DataTexture } from "three";

import { material } from "../../internal/renderFixtures";

/**
 * Supported native filters outside the authorable sampler union still split
 * actual Source allocations.
 *
 * Scenarios:
 *
 * 1. Two actual clones using nearest/linear nearest-mip filters retain two
 *    independently calculated 84-byte chains; identical state shares one.
 * 2. Native-filter changes invalidate the upload digest.
 * 3. Distinct native anisotropy keys remain distinct and keep two bounds.
 */
export async function test_render_scene_read_texture_source_texture_native_sampler(): Promise<void> {
  const THREE: typeof import("three") = await import("three");
  const a: DataTexture = new THREE.DataTexture(new Uint8Array(64), 4, 4);
  a.generateMipmaps = true;
  a.minFilter = THREE.NearestMipmapNearestFilter;
  const b: DataTexture = a.clone();
  b.minFilter = THREE.LinearMipmapNearestFilter;
  const first: IAutoMovieRenderTextureSource = readAutoMovieTextureSource(
    "a",
    a,
  );
  const second: IAutoMovieRenderTextureSource = readAutoMovieTextureSource(
    "b",
    b,
  );
  TestValidator.equals(
    "arranged shared pixels",
    first.sourceIdentity,
    second.sourceIdentity,
  );
  TestValidator.predicate(
    "arranged native filters split",
    first.samplerState !== second.samplerState,
  );
  const close: (
    source?: IAutoMovieRenderTextureSource,
  ) => ReturnType<typeof measureAutoMovieRenderTextureClosure> = (
    source: IAutoMovieRenderTextureSource = second,
  ): ReturnType<typeof measureAutoMovieRenderTextureClosure> =>
    measureAutoMovieRenderTextureClosure({
      materials: [material("first", "a"), material("second", "b")],
      sources: [first, source],
      environment: null,
    }).filter(
      (
        row: ReturnType<typeof measureAutoMovieRenderTextureClosure>[number],
      ): boolean => row.asset !== null,
    );
  TestValidator.equals(
    "native filter variants",
    close().map(
      (row: ReturnType<typeof close>[number]): number | null => row.bytes,
    ),
    [84, 84],
  );
  TestValidator.equals(
    "native filter sharing",
    close({ ...first, asset: "b" }).map(
      (row: ReturnType<typeof close>[number]): number | null => row.bytes,
    ),
    [84],
  );
  const digest: string = autoMovieRenderTextureDigest([second]);
  TestValidator.predicate(
    "native filter changes freshness",
    autoMovieRenderTextureDigest([{ ...first, asset: "b" }]) !== digest,
  );
  const fixed: [DataTexture, DataTexture] = [a.clone(), a.clone()];
  fixed[0].anisotropy = 2;
  fixed[1].anisotropy = 4;
  const fixedFacts: IAutoMovieRenderTextureSource[] = fixed.map(
    (texture: DataTexture, index: number): IAutoMovieRenderTextureSource =>
      readAutoMovieTextureSource(`fixed-${index}`, texture),
  );
  TestValidator.predicate(
    "distinct native anisotropy keys remain distinct",
    fixedFacts[0].uploadState !== fixedFacts[1].uploadState,
  );
  TestValidator.equals(
    "fixed native variants retain two bounds",
    measureAutoMovieRenderTextureClosure({
      materials: fixedFacts.map(
        (
          source: IAutoMovieRenderTextureSource,
          index: number,
        ): ReturnType<typeof material> =>
          material(`fixed-material-${index}`, source.asset),
      ),
      sources: fixedFacts,
      environment: null,
    })
      .filter(
        (row: ReturnType<typeof close>[number]): boolean => row.asset !== null,
      )
      .map((row: ReturnType<typeof close>[number]): number | null => row.bytes),
    [84, 84],
  );
  Object.assign(fixed[0], { wrapR: false, anisotropy: 1 });
  Object.assign(fixed[1], { wrapR: 0, anisotropy: 1 });
  TestValidator.equals(
    "native falsy wrapR keys are equivalent",
    readAutoMovieTextureSource("same", fixed[0]).uploadState,
    readAutoMovieTextureSource("same", fixed[1]).uploadState,
  );
  for (const texture of fixed) texture.dispose();
  a.dispose();
  b.dispose();
}

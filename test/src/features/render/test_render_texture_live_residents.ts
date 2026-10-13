import { autoMovieRenderTextureDigest, measureAutoMovieRenderTextureClosure, type IAutoMovieRenderTextureResidency } from "@automovie/engine";
import { AutoMovieTextureCache, readAutoMovieTextureSource } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

import { material } from "../internal/renderFixtures";

/**
 * Simultaneously live shots share GPU storage through actual Source objects,
 * while environment clones retain independent derivatives. Cache-owned texture
 * disposal and renderer-owned scratch have separate lifetimes.
 *
 * Scenarios:
 *
 * 1. Two real caches independently decode one 4-by-4 asset and charge two raw
 *    64-byte allocations; returning clones of one source shares one allocation.
 * 2. Two environment clones share raw pixels but retain two CubeUV outputs and
 *    two background cubes, with one shared DFG lookup and blur scratch.
 * 3. Sharing the actual environment Texture collapses its derivatives, and
 *    removing a disposed scope removes its source rows while scratch remains.
 * 4. Opaque token renaming preserves the target; source/texture sharing changes
 *    invalidate it, while irrelevant retained assets change no identity.
 */
export const test_render_texture_live_residents = async (): Promise<void> => {
  const THREE = await import("three");
  const make = () => new THREE.DataTexture(new Uint8Array(64), 4, 4, THREE.RGBAFormat, THREE.UnsignedByteType);
  const m = material("material", "image");
  const independent = [new AutoMovieTextureCache(async () => make()), new AutoMovieTextureCache(async () => make())];
  await Promise.all(independent.map((cache) => cache.prime(["image"])));
  const a = independent[0].describeSources()[0];
  const b = independent[1].describeSources()[0];
  TestValidator.predicate("arranged independent decode", a.sourceIdentity !== b.sourceIdentity);
  const profile = (sources: typeof a[], patch: Partial<IAutoMovieRenderTextureResidency> = {}): IAutoMovieRenderTextureResidency => ({
    owner: "first", residents: [{ owner: "second", materials: [m], sources, environment: null, shadowCasters: [], areaLights: false }],
    dfgRetained: false, pmremRetained: null, ...patch,
  });
  const close = (sources: typeof a[], residency = profile([b]), environment: string | null = null) =>
    measureAutoMovieRenderTextureClosure({ materials: [m], sources, environment, residency });
  TestValidator.equals("independent raw allocations", close([a]).filter((row) => row.asset !== null).map((row) => row.bytes), [64, 64]);
  TestValidator.equals("one shared lookup", close([a]).filter((row) => row.runtime === "dfg-lut").length, 1);
  const base = make();
  const shared = [new AutoMovieTextureCache(async () => base.clone()), new AutoMovieTextureCache(async () => base.clone())];
  await Promise.all(shared.map((cache) => cache.prime(["image"])));
  const first = shared[0].describeSources()[0];
  const second = shared[1].describeSources()[0];
  TestValidator.equals("arranged shared pixels", first.sourceIdentity, second.sourceIdentity);
  const rawShared = close([first], profile([second]));
  TestValidator.equals("shared source is charged once", rawShared.filter((row) => row.asset !== null).map((row) => [row.bytes, row.residents]), [[64, ["first", "second"]]]);
  const envA = readAutoMovieTextureSource("image", shared[0].resolve("image"));
  const envB = readAutoMovieTextureSource("image", shared[1].resolve("image"));
  TestValidator.predicate("arranged independent environment clones", envA.textureIdentity !== envB.textureIdentity);
  const environment = profile([second], { environmentTexture: envA,
    residents: [{ owner: "second", materials: [m], sources: [second], environment: "image", environmentTexture: envB, shadowCasters: [], areaLights: false }],
  });
  const clones = close([first], environment, "image");
  TestValidator.equals("two PMREM outputs", clones.filter((row) => row.variant === "environment-cubeuv").length, 2);
  TestValidator.equals("two background cubes", clones.filter((row) => row.variant === "environment-background-cube").length, 2);
  TestValidator.equals("one renderer scratch", clones.filter((row) => row.runtime === "pmrem-blur").map((row) => row.bytes), [3 * 112 * 4 * 8]);
  const identicalEnvironment = { ...environment, residents: [{ ...environment.residents[0], environmentTexture: envA }] };
  TestValidator.equals("same environment object shares derivatives", close([first], identicalEnvironment, "image").length, 5);
  const renamed = { ...identicalEnvironment, environmentTexture: { ...envA, sourceIdentity: "renamed-source", textureIdentity: "renamed-texture" },
    residents: [{ ...identicalEnvironment.residents[0], sources: [{ ...second, sourceIdentity: "renamed-source" }],
      environmentTexture: { ...envA, sourceIdentity: "renamed-source", textureIdentity: "renamed-texture" } }],
  };
  const digest = autoMovieRenderTextureDigest([first], identicalEnvironment);
  TestValidator.equals("UUID spelling is not target identity", autoMovieRenderTextureDigest([{ ...first, sourceIdentity: "renamed-source" }], renamed), digest);
  TestValidator.predicate("clone sharing affects identity", autoMovieRenderTextureDigest([first], environment) !== digest);
  TestValidator.predicate("source sharing affects identity", autoMovieRenderTextureDigest([a], profile([b])) !== autoMovieRenderTextureDigest([first], profile([second])));
  const irrelevant = { ...identicalEnvironment, residents: [{ ...identicalEnvironment.residents[0], sources: [second, { ...second, asset: "unused", width: 128 }] }] };
  TestValidator.equals("unused retained source is not a dependency", autoMovieRenderTextureDigest([first], irrelevant), digest);
  const aliasedA = { ...envA, asset: "rgb-a" };
  const aliasedB = { ...envA, asset: "rgb-b" };
  const aliases = [{ owner: "a", materials: [material("a")], sources: [aliasedA], environment: "rgb-a", environmentTexture: aliasedA, shadowCasters: [], areaLights: false },
    { owner: "b", materials: [material("b")], sources: [aliasedB], environment: "rgb-b", environmentTexture: aliasedB, shadowCasters: [], areaLights: false }];
  const aliasClosure = (residents = aliases) => measureAutoMovieRenderTextureClosure({ materials: [], sources: [], environment: null,
    residency: { owner: "current", residents, dfgRetained: false, pmremRetained: null },
  });
  TestValidator.equals("environment aliases are independent of resident order", aliasClosure(), aliasClosure([...aliases].reverse()));
  TestValidator.equals("shared derivatives preserve every alias", aliasClosure().filter((row) => row.variant === "environment-cubeuv" || row.variant === "environment-background-cube").map((row) => row.assets), [["rgb-a", "rgb-b"], ["rgb-a", "rgb-b"]]);
  const mixedAliases = [{ ...aliases[0], materials: [] }, aliases[1]];
  TestValidator.equals("mixed environment consumers retain order independence", aliasClosure(mixedAliases), aliasClosure([...mixedAliases].reverse()));
  TestValidator.equals("only PBR scopes own the image-lighting output", aliasClosure(mixedAliases).find((row) => row.variant === "environment-cubeuv")!.residents, ["b"]);
  TestValidator.equals("only PBR asset aliases own the image-lighting output", aliasClosure(mixedAliases).find((row) => row.variant === "environment-cubeuv")!.assets, ["rgb-b"]);
  TestValidator.equals("all image scopes own their shared background", aliasClosure(mixedAliases).find((row) => row.variant === "environment-background-cube")!.residents, ["a", "b"]);
  await independent[0].dispose();
  const remaining = measureAutoMovieRenderTextureClosure({ materials: [m], sources: [b], environment: null,
    residency: { owner: "second", residents: [], dfgRetained: true, pmremRetained: { width: 336, height: 4 } },
  });
  TestValidator.equals("disposed source is absent, scratch remains", remaining.map((row) => row.bytes).sort((x, y) => x! - y!), [64, 1024, 336 * 4 * 8]);
  await Promise.all([...independent.slice(1), ...shared].map((cache) => cache.dispose()));
  base.dispose();
};

import { autoMovieRenderTextureDigest, measureAutoMovieRenderTextureClosure, type IAutoMovieRenderTextureResidency } from "@automovie/engine";
import { AutoMovieTextureCache, readAutoMovieTextureSource } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import type { DataTexture } from "three";
import type { IAutoMovieRenderTextureSource, IAutoMovieRenderTextureResident } from "@automovie/engine";

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
 *
 * @evidence contracts/testing.md#behavioral-verification Uses actual cache loading and resolved clone identities with the real residency closure and digest to check source sharing, environment derivative ownership, alias attribution and retained scratch accounting.
 * @evidence contracts/testing.md#independent-expectations Each raw 4-by-4 RGBA8 source costs 64 bytes; expected source/derivative counts, literal resident/asset lists and 336-by-4 half-float scratch arithmetic are authored independently of closure output.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts independent decoded sources, shared-source wrappers, separate versus identical environment textures, opaque token renaming, unused assets and mixed PBR/background aliases in both resident orders, then supplied scope removal with retained scratch.
 * @evidence contracts/testing.md#execution-ownership Owns asynchronous CPU Three texture/cache objects, awaits prime and successful-path disposal, and supplies residency records itself; no GPU derivative creation or native release is measured, and removing a disposed scope from the next record is explicit caller input rather than automatic disposal observation.
 */
export async function test_render_texture_live_residents(): Promise<void> {
  const THREE: typeof import("three") = await import("three");
  const make: () => DataTexture = (): DataTexture => new THREE.DataTexture(new Uint8Array(64), 4, 4, THREE.RGBAFormat, THREE.UnsignedByteType);
  const m: ReturnType<typeof material> = material("material", "image");
  const independent: [AutoMovieTextureCache, AutoMovieTextureCache] = [new AutoMovieTextureCache(async (): Promise<DataTexture> => make()), new AutoMovieTextureCache(async (): Promise<DataTexture> => make())];
  await Promise.all(independent.map((cache: AutoMovieTextureCache): Promise<void> => cache.prime(["image"])));
  const a: IAutoMovieRenderTextureSource = independent[0].describeSources()[0];
  const b: IAutoMovieRenderTextureSource = independent[1].describeSources()[0];
  TestValidator.predicate("arranged independent decode", a.sourceIdentity !== b.sourceIdentity);
  const profile: (sources: IAutoMovieRenderTextureSource[], patch?: Partial<IAutoMovieRenderTextureResidency>) => IAutoMovieRenderTextureResidency = (sources: IAutoMovieRenderTextureSource[], patch: Partial<IAutoMovieRenderTextureResidency> = {}): IAutoMovieRenderTextureResidency => ({
    owner: "first", residents: [{ owner: "second", materials: [m], sources, environment: null, shadowCasters: [], areaLights: false }],
    dfgRetained: false, pmremRetained: null, ...patch,
  });
  const close: (sources: IAutoMovieRenderTextureSource[], residency?: IAutoMovieRenderTextureResidency, environment?: string | null) => ReturnType<typeof measureAutoMovieRenderTextureClosure> = (sources: IAutoMovieRenderTextureSource[], residency: IAutoMovieRenderTextureResidency = profile([b]), environment: string | null = null): ReturnType<typeof measureAutoMovieRenderTextureClosure> =>
    measureAutoMovieRenderTextureClosure({ materials: [m], sources, environment, residency });
  TestValidator.equals("independent raw allocations", close([a]).filter((row: ReturnType<typeof close>[number]): boolean => row.asset !== null).map((row: ReturnType<typeof close>[number]): number | null => row.bytes), [64, 64]);
  TestValidator.equals("one shared lookup", close([a]).filter((row: ReturnType<typeof close>[number]): boolean => row.runtime === "dfg-lut").length, 1);
  const base: DataTexture = make();
  const shared: [AutoMovieTextureCache, AutoMovieTextureCache] = [new AutoMovieTextureCache(async (): Promise<DataTexture> => base.clone()), new AutoMovieTextureCache(async (): Promise<DataTexture> => base.clone())];
  await Promise.all(shared.map((cache: AutoMovieTextureCache): Promise<void> => cache.prime(["image"])));
  const first: IAutoMovieRenderTextureSource = shared[0].describeSources()[0];
  const second: IAutoMovieRenderTextureSource = shared[1].describeSources()[0];
  TestValidator.equals("arranged shared pixels", first.sourceIdentity, second.sourceIdentity);
  const rawShared: ReturnType<typeof close> = close([first], profile([second]));
  TestValidator.equals("shared source is charged once", rawShared.filter((row: ReturnType<typeof close>[number]): boolean => row.asset !== null).map((row: ReturnType<typeof close>[number]): [number | null, string[] | undefined] => [row.bytes, row.residents]), [[64, ["first", "second"]]]);
  const envA: IAutoMovieRenderTextureSource = readAutoMovieTextureSource("image", shared[0].resolve("image"));
  const envB: IAutoMovieRenderTextureSource = readAutoMovieTextureSource("image", shared[1].resolve("image"));
  TestValidator.predicate("arranged independent environment clones", envA.textureIdentity !== envB.textureIdentity);
  const environment: IAutoMovieRenderTextureResidency = profile([second], { environmentTexture: envA,
    residents: [{ owner: "second", materials: [m], sources: [second], environment: "image", environmentTexture: envB, shadowCasters: [], areaLights: false }],
  });
  const clones: ReturnType<typeof close> = close([first], environment, "image");
  TestValidator.equals("two PMREM outputs", clones.filter((row: ReturnType<typeof close>[number]): boolean => row.variant === "environment-cubeuv").length, 2);
  TestValidator.equals("two background cubes", clones.filter((row: ReturnType<typeof close>[number]): boolean => row.variant === "environment-background-cube").length, 2);
  TestValidator.equals("one renderer scratch", clones.filter((row: ReturnType<typeof close>[number]): boolean => row.runtime === "pmrem-blur").map((row: ReturnType<typeof close>[number]): number | null => row.bytes), [3 * 112 * 4 * 8]);
  const identicalEnvironment: IAutoMovieRenderTextureResidency = { ...environment, residents: [{ ...environment.residents[0], environmentTexture: envA }] };
  TestValidator.equals("same environment object shares derivatives", close([first], identicalEnvironment, "image").length, 5);
  const renamed: IAutoMovieRenderTextureResidency = { ...identicalEnvironment, environmentTexture: { ...envA, sourceIdentity: "renamed-source", textureIdentity: "renamed-texture" },
    residents: [{ ...identicalEnvironment.residents[0], sources: [{ ...second, sourceIdentity: "renamed-source" }],
      environmentTexture: { ...envA, sourceIdentity: "renamed-source", textureIdentity: "renamed-texture" } }],
  };
  const digest: string = autoMovieRenderTextureDigest([first], identicalEnvironment);
  TestValidator.equals("UUID spelling is not target identity", autoMovieRenderTextureDigest([{ ...first, sourceIdentity: "renamed-source" }], renamed), digest);
  TestValidator.predicate("clone sharing affects identity", autoMovieRenderTextureDigest([first], environment) !== digest);
  TestValidator.predicate("source sharing affects identity", autoMovieRenderTextureDigest([a], profile([b])) !== autoMovieRenderTextureDigest([first], profile([second])));
  const irrelevant: IAutoMovieRenderTextureResidency = { ...identicalEnvironment, residents: [{ ...identicalEnvironment.residents[0], sources: [second, { ...second, asset: "unused", width: 128 }] }] };
  TestValidator.equals("unused retained source is not a dependency", autoMovieRenderTextureDigest([first], irrelevant), digest);
  const aliasedA: IAutoMovieRenderTextureSource = { ...envA, asset: "rgb-a" };
  const aliasedB: IAutoMovieRenderTextureSource = { ...envA, asset: "rgb-b" };
  const aliases: IAutoMovieRenderTextureResident[] = [{ owner: "a", materials: [material("a")], sources: [aliasedA], environment: "rgb-a", environmentTexture: aliasedA, shadowCasters: [], areaLights: false },
    { owner: "b", materials: [material("b")], sources: [aliasedB], environment: "rgb-b", environmentTexture: aliasedB, shadowCasters: [], areaLights: false }];
  const aliasClosure: (residents?: IAutoMovieRenderTextureResident[]) => ReturnType<typeof close> = (residents: IAutoMovieRenderTextureResident[] = aliases): ReturnType<typeof close> => measureAutoMovieRenderTextureClosure({ materials: [], sources: [], environment: null,
    residency: { owner: "current", residents, dfgRetained: false, pmremRetained: null },
  });
  TestValidator.equals("environment aliases are independent of resident order", aliasClosure(), aliasClosure([...aliases].reverse()));
  TestValidator.equals("shared derivatives preserve every alias", aliasClosure().filter((row: ReturnType<typeof close>[number]): boolean => row.variant === "environment-cubeuv" || row.variant === "environment-background-cube").map((row: ReturnType<typeof close>[number]): string[] | undefined => row.assets), [["rgb-a", "rgb-b"], ["rgb-a", "rgb-b"]]);
  const mixedAliases: IAutoMovieRenderTextureResident[] = [{ ...aliases[0], materials: [] }, aliases[1]];
  TestValidator.equals("mixed environment consumers retain order independence", aliasClosure(mixedAliases), aliasClosure([...mixedAliases].reverse()));
  TestValidator.equals("only PBR scopes own the image-lighting output", aliasClosure(mixedAliases).find((row: ReturnType<typeof close>[number]): boolean => row.variant === "environment-cubeuv")!.residents, ["b"]);
  TestValidator.equals("only PBR asset aliases own the image-lighting output", aliasClosure(mixedAliases).find((row: ReturnType<typeof close>[number]): boolean => row.variant === "environment-cubeuv")!.assets, ["rgb-b"]);
  TestValidator.equals("all image scopes own their shared background", aliasClosure(mixedAliases).find((row: ReturnType<typeof close>[number]): boolean => row.variant === "environment-background-cube")!.residents, ["a", "b"]);
  await independent[0].dispose();
  const remaining: ReturnType<typeof close> = measureAutoMovieRenderTextureClosure({ materials: [m], sources: [b], environment: null,
    residency: { owner: "second", residents: [], dfgRetained: true, pmremRetained: { width: 336, height: 4 } },
  });
  TestValidator.equals("disposed source is absent, scratch remains", remaining.map((row: ReturnType<typeof close>[number]): number | null => row.bytes).sort((x: number | null, y: number | null): number => x! - y!), [64, 1024, 336 * 4 * 8]);
  await Promise.all([...independent.slice(1), ...shared].map((cache: AutoMovieTextureCache): Promise<void> => cache.dispose()));
  base.dispose();
}

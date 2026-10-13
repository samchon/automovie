import type { AutoMovieContentDigest } from "@automovie/interface";

import { materialTextureSlots } from "../validation/materialTextureSlots";
import type { IAutoMovieRenderTextureResidency } from "./IAutoMovieRenderTextureResidency";
import type { IAutoMovieRenderTextureSource } from "./IAutoMovieRenderTextureSource";
import { autoMovieRenderDigest } from "./autoMovieRenderDigest";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";

/**
 * Fingerprint upload facts and their actual object-sharing relation. Runtime
 * equality tokens group sorted stable owner/asset use locations; their random
 * spelling never enters the digest. Renaming tokens preserves identity, while
 * shared-to-independent decode or environment-clone changes invalidate it.
 * Fixed-position records ignore property order and retain unknown facts. Invalid
 * dimensions remain distinct so an unknown bound cannot reuse a valid one.
 * Conflicting facts for one scoped asset refuse rather than choosing by order.
 * The caller supplies the current shot's required source closure; retained
 * scopes are filtered to the texture channels and environment they consume.
 * This proves identity, not validity or a complete memory bound.
 */
export function autoMovieRenderTextureDigest(
  sources: readonly IAutoMovieRenderTextureSource[],
  residency?: IAutoMovieRenderTextureResidency,
): AutoMovieContentDigest {
  const scopes = [{ owner: residency?.owner ?? "current", sources,
    environmentTexture: residency?.environmentTexture,
  }, ...(residency?.residents ?? []).map((resident) => {
    const assets = new Set(resident.materials.flatMap((material) => materialTextureSlots(material)
      .map((slot) => typeof slot.binding === "string" ? slot.binding : slot.binding.asset)));
    if (resident.environment !== null) assets.add(resident.environment);
    return { owner: resident.owner, sources: resident.sources.filter((source) => assets.has(source.asset)),
      environmentTexture: resident.environmentTexture,
    };
  })];
  const records: string[] = [];
  const sourceGroups = new Map<string, Set<string>>();
  const textureGroups = new Map<string, Set<string>>();
  const owners = new Set<string>();
  const scoped = new Map<string, { record: string; identity: string | undefined }>();
  const record = (owner: string, source: IAutoMovieRenderTextureSource, role: "source" | "environment" | "runtime"): void => {
      const sampler = source.sampler;
      const facts = JSON.stringify([source.asset, String(source.width), String(source.height),
        source.format ?? null, source.mipmapped, source.allocationStateKnown ?? null, source.generateMipmaps ?? null,
        source.explicitMipmaps ?? null, source.uploadState ?? null,
        source.samplerState === undefined ? ["legacy-unreported"] : source.samplerState,
        source.environmentColorSpace ?? null, source.environmentBackgroundFormat ?? null,
        source.environmentSampler === undefined ? null : [source.environmentSampler.wrapS, source.environmentSampler.wrapT,
          source.environmentSampler.minFilter, source.environmentSampler.magFilter],
        source.environmentSamplerState === undefined ? ["legacy-unreported-factory"] : source.environmentSamplerState,
        role === "runtime" ? source.colorSpace ?? null : null,
        source.sourceIdentity !== undefined, role === "environment" && source.textureIdentity !== undefined,
        sampler === undefined ? null : [sampler.wrapS, sampler.wrapT, sampler.minFilter, sampler.magFilter],
      ]);
      const position = JSON.stringify([owner, role, source.asset]);
      const previous = scoped.get(position);
      if (previous !== undefined && (previous.record !== facts || previous.identity !== source.sourceIdentity))
        throw new Error(`Texture asset "${source.asset}" has conflicting decoded upload facts.`);
      if (previous === undefined) {
        scoped.set(position, { record: facts, identity: source.sourceIdentity });
        records.push(JSON.stringify([owner, role, facts]));
      }
      addGroup(sourceGroups, JSON.stringify([source.sourceIdentity === undefined ? "legacy" : "object", source.sourceIdentity ?? position]), position);
      if (role === "environment") addGroup(textureGroups, JSON.stringify([source.textureIdentity === undefined ? "legacy" : "object", source.textureIdentity ?? position]), position);
    };
  for (const scope of scopes) {
    if (scope.owner.trim().length === 0 || owners.has(scope.owner))
      throw new Error(`Texture resident owner "${scope.owner}" must be nonblank and unique.`);
    owners.add(scope.owner);
    for (const source of scope.sources) record(scope.owner, source, "source");
    if (scope.environmentTexture !== undefined) record(scope.owner, scope.environmentTexture, "environment");
  }
  const runtimeOwners = new Set<string>();
  for (const runtime of residency?.runtimeTextures ?? []) {
    if (runtime.owner.trim().length === 0 || runtimeOwners.has(runtime.owner))
      throw new Error(`Runtime texture owner "${runtime.owner}" must be nonblank and unique.`);
    runtimeOwners.add(runtime.owner);
    record(runtime.owner, { ...runtime.texture, asset: runtime.owner }, "runtime");
  }
  const canonicalGroups = (groups: Map<string, Set<string>>) => [...groups.values()]
    .map((positions) => [...positions].sort(compareAutoMovieRenderIds))
    .sort((a, b) => compareAutoMovieRenderIds(JSON.stringify(a), JSON.stringify(b)));
  return autoMovieRenderDigest(JSON.stringify([
    "automovie.texture-upload.v3", records.sort(compareAutoMovieRenderIds),
    canonicalGroups(sourceGroups), canonicalGroups(textureGroups),
    (residency?.residents ?? []).map((resident) => JSON.stringify([resident.owner, resident.areaLights ?? null,
      resident.shadowCasters === undefined ? null : resident.shadowCasters.map((caster) => [caster.light, caster.filterDraws])
        .sort((a, b) => compareAutoMovieRenderIds(JSON.stringify(a), JSON.stringify(b))),
    ])).sort(compareAutoMovieRenderIds),
    (residency?.runtimeTextures ?? []).map((runtime) => JSON.stringify([runtime.owner, runtime.purpose ?? null,
      [...(runtime.residents ?? [])].sort(compareAutoMovieRenderIds),
    ])).sort(compareAutoMovieRenderIds),
    residency?.dfgRetained ?? false, residency?.pmremRetained === null || residency?.pmremRetained === undefined ? null :
      [String(residency.pmremRetained.width), String(residency.pmremRetained.height)],
    (residency?.displayCompositors ?? []).map((row) => JSON.stringify([row.owner, String(row.width), String(row.height)]))
      .sort(compareAutoMovieRenderIds),
    (residency?.renderTargets ?? []).map((target) => JSON.stringify([target.owner,
      target.transmissionScope ?? null, String(target.width), String(target.height),
      target.formats.map((format) => format ?? null), target.mipmapped,
      String(target.samples), target.depthBytesPerTexel === null ? null : String(target.depthBytesPerTexel),
      target.depthTexture ?? false, target.faces ?? 1,
      target.shadow === undefined ? null : [target.shadow.scope, target.shadow.light, target.shadow.role]]))
      .sort(compareAutoMovieRenderIds),
  ]));
}

/** Collect object equivalence without serializing the host's equality token. */
const addGroup = (groups: Map<string, Set<string>>, identity: string, position: string): void => {
  let positions = groups.get(identity);
  if (positions === undefined) {
    positions = new Set();
    groups.set(identity, positions);
  }
  positions.add(position);
};

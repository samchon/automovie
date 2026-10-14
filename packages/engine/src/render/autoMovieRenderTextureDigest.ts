import type { IAutoMovieMaterial } from "@automovie/interface";

import { materialTextureSlots } from "../validation/materialTextureSlots";
import type { AutoMovieBuiltinTexturePurpose } from "./AutoMovieBuiltinTexturePurpose";
import type { IAutoMovieRenderTextureResidency } from "./IAutoMovieRenderTextureResidency";
import type { IAutoMovieRenderTextureResident } from "./IAutoMovieRenderTextureResident";
import type { IAutoMovieRenderTextureSource } from "./IAutoMovieRenderTextureSource";
import type { IAutoMovieRenderTextureTarget } from "./IAutoMovieRenderTextureTarget";
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
 *
 * @evidence contracts/common.md#principled-implementation Serialize fixed-position upload facts and sorted stable use locations, then hash object-sharing equivalence classes rather than opaque token spelling. Unknown/null flags remain distinct, and conflicting scoped asset facts or repeated owners throw.
 * @evidence contracts/common.md#clear-and-simple-design Identity grouping stays separate from storage validity; retained scopes are filtered to actual material/environment consumers while runtime/target/scratch rows are included explicitly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Renamed equality tokens preserve the sharing relation, but shared-to-independent sources or environment clones change identity; the digest cannot certify missing sampler/allocation authority or a complete memory bound.
 * @evidence contracts/common.md#meaningful-documentation Docs explain token equivalence, property-order independence, invalid-dimension spelling, scoped conflict refusal and the required source-closure premise.
 * @evidence contracts/performance.md#efficient-algorithms S source uses and M material slots build grouped records, then sort records/group positions and serialize B bytes; work is O(M+S log S+B) plus retained target/runtime rows, with O(S+B) call storage.
 * @evidence contracts/performance.md#reuse-equivalent-work A source record serves all uses in its equality class within this call; cross-call reuse requires unchanged facts and sharing relations, which object or asset identity alone cannot prove.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Grouping maps, sets and canonical bytes are temporary; only the digest string escapes and this identity function opens or disposes no native texture.
 */
export function autoMovieRenderTextureDigest(
  sources: readonly IAutoMovieRenderTextureSource[],
  residency?: IAutoMovieRenderTextureResidency,
): string {
  const scopes: {
    owner: string;
    sources: readonly IAutoMovieRenderTextureSource[];
    environmentTexture: IAutoMovieRenderTextureSource | undefined;
  }[] = [
    {
      owner: residency?.owner ?? "current",
      sources,
      environmentTexture: residency?.environmentTexture,
    },
    ...(residency?.residents ?? []).map(
      (
        resident: IAutoMovieRenderTextureResident,
      ): {
        owner: string;
        sources: IAutoMovieRenderTextureSource[];
        environmentTexture: IAutoMovieRenderTextureSource | undefined;
      } => {
        const assets: Set<string> = new Set(
          resident.materials.flatMap((material: IAutoMovieMaterial): string[] =>
            materialTextureSlots(material).map(
              (
                slot: ReturnType<typeof materialTextureSlots>[number],
              ): string =>
                typeof slot.binding === "string"
                  ? slot.binding
                  : slot.binding.asset,
            ),
          ),
        );
        if (resident.environment !== null) assets.add(resident.environment);
        return {
          owner: resident.owner,
          sources: resident.sources.filter(
            (source: IAutoMovieRenderTextureSource): boolean =>
              assets.has(source.asset),
          ),
          environmentTexture: resident.environmentTexture,
        };
      },
    ),
  ];
  const records: string[] = [];
  const sourceGroups: Map<string, Set<string>> = new Map<string, Set<string>>();
  const textureGroups: Map<string, Set<string>> = new Map<
    string,
    Set<string>
  >();
  const owners: Set<string> = new Set<string>();
  const scoped: Map<string, { record: string; identity: string | undefined }> =
    new Map<string, { record: string; identity: string | undefined }>();
  const record: (
    owner: string,
    source: IAutoMovieRenderTextureSource,
    role: "source" | "environment" | "runtime",
  ) => void = (
    owner: string,
    source: IAutoMovieRenderTextureSource,
    role: "source" | "environment" | "runtime",
  ): void => {
    const sampler:
      | {
          wrapS: "clamp" | "repeat" | "mirror";
          wrapT: "clamp" | "repeat" | "mirror";
          minFilter:
            | "nearest"
            | "linear"
            | "nearestMipmapLinear"
            | "linearMipmapLinear";
          magFilter: "nearest" | "linear";
        }
      | undefined = source.sampler;
    const facts: string = JSON.stringify([
      source.asset,
      String(source.width),
      String(source.height),
      source.format ?? null,
      source.mipmapped,
      source.allocationStateKnown ?? null,
      source.generateMipmaps ?? null,
      source.explicitMipmaps ?? null,
      source.uploadState ?? null,
      source.samplerState === undefined
        ? ["legacy-unreported"]
        : source.samplerState,
      source.environmentColorSpace ?? null,
      source.environmentBackgroundFormat ?? null,
      source.environmentSampler === undefined
        ? null
        : [
            source.environmentSampler.wrapS,
            source.environmentSampler.wrapT,
            source.environmentSampler.minFilter,
            source.environmentSampler.magFilter,
          ],
      source.environmentSamplerState === undefined
        ? ["legacy-unreported-factory"]
        : source.environmentSamplerState,
      role === "runtime" ? (source.colorSpace ?? null) : null,
      source.sourceIdentity !== undefined,
      role === "environment" && source.textureIdentity !== undefined,
      sampler === undefined
        ? null
        : [sampler.wrapS, sampler.wrapT, sampler.minFilter, sampler.magFilter],
    ]);
    const position: string = JSON.stringify([owner, role, source.asset]);
    const previous:
      | { record: string; identity: string | undefined }
      | undefined = scoped.get(position);
    if (
      previous !== undefined &&
      (previous.record !== facts || previous.identity !== source.sourceIdentity)
    )
      throw new Error(
        `Texture asset "${source.asset}" has conflicting decoded upload facts.`,
      );
    if (previous === undefined) {
      scoped.set(position, { record: facts, identity: source.sourceIdentity });
      records.push(JSON.stringify([owner, role, facts]));
    }
    addGroup(
      sourceGroups,
      JSON.stringify([
        source.sourceIdentity === undefined ? "legacy" : "object",
        source.sourceIdentity ?? position,
      ]),
      position,
    );
    if (role === "environment")
      addGroup(
        textureGroups,
        JSON.stringify([
          source.textureIdentity === undefined ? "legacy" : "object",
          source.textureIdentity ?? position,
        ]),
        position,
      );
  };
  for (const scope of scopes) {
    if (scope.owner.trim().length === 0 || owners.has(scope.owner))
      throw new Error(
        `Texture resident owner "${scope.owner}" must be nonblank and unique.`,
      );
    owners.add(scope.owner);
    for (const source of scope.sources) record(scope.owner, source, "source");
    if (scope.environmentTexture !== undefined)
      record(scope.owner, scope.environmentTexture, "environment");
  }
  const runtimeOwners: Set<string> = new Set<string>();
  for (const runtime of residency?.runtimeTextures ?? []) {
    if (runtime.owner.trim().length === 0 || runtimeOwners.has(runtime.owner))
      throw new Error(
        `Runtime texture owner "${runtime.owner}" must be nonblank and unique.`,
      );
    runtimeOwners.add(runtime.owner);
    record(
      runtime.owner,
      { ...runtime.texture, asset: runtime.owner },
      "runtime",
    );
  }
  const canonicalGroups: (groups: Map<string, Set<string>>) => string[][] = (
    groups: Map<string, Set<string>>,
  ): string[][] =>
    [...groups.values()]
      .map((positions: Set<string>): string[] =>
        [...positions].sort(compareAutoMovieRenderIds),
      )
      .sort((a: string[], b: string[]): number =>
        compareAutoMovieRenderIds(JSON.stringify(a), JSON.stringify(b)),
      );
  return autoMovieRenderDigest(
    JSON.stringify([
      "automovie.texture-upload.v3",
      records.sort(compareAutoMovieRenderIds),
      canonicalGroups(sourceGroups),
      canonicalGroups(textureGroups),
      (residency?.residents ?? [])
        .map((resident: IAutoMovieRenderTextureResident): string =>
          JSON.stringify([
            resident.owner,
            resident.areaLights ?? null,
            resident.shadowCasters === undefined
              ? null
              : resident.shadowCasters
                  .map(
                    (caster: {
                      light: string;
                      filterDraws: number;
                    }): (string | number)[] => [
                      caster.light,
                      caster.filterDraws,
                    ],
                  )
                  .sort(
                    (a: (string | number)[], b: (string | number)[]): number =>
                      compareAutoMovieRenderIds(
                        JSON.stringify(a),
                        JSON.stringify(b),
                      ),
                  ),
          ]),
        )
        .sort(compareAutoMovieRenderIds),
      (residency?.runtimeTextures ?? [])
        .map(
          (runtime: {
            owner: string;
            texture: Omit<IAutoMovieRenderTextureSource, "asset">;
            purpose?: AutoMovieBuiltinTexturePurpose;
            residents?: readonly string[];
          }): string =>
            JSON.stringify([
              runtime.owner,
              runtime.purpose ?? null,
              [...(runtime.residents ?? [])].sort(compareAutoMovieRenderIds),
            ]),
        )
        .sort(compareAutoMovieRenderIds),
      residency?.dfgRetained ?? false,
      residency?.pmremRetained === null ||
      residency?.pmremRetained === undefined
        ? null
        : [
            String(residency.pmremRetained.width),
            String(residency.pmremRetained.height),
          ],
      (residency?.displayCompositors ?? [])
        .map((row: { owner: string; width: number; height: number }): string =>
          JSON.stringify([row.owner, String(row.width), String(row.height)]),
        )
        .sort(compareAutoMovieRenderIds),
      (residency?.renderTargets ?? [])
        .map((target: IAutoMovieRenderTextureTarget): string =>
          JSON.stringify([
            target.owner,
            target.transmissionScope ?? null,
            String(target.width),
            String(target.height),
            target.formats.map(
              (
                format:
                  | "r16f"
                  | "rgba8"
                  | "rg16f"
                  | "rgba16f"
                  | "rgba32f"
                  | undefined,
              ): "r16f" | "rgba8" | "rg16f" | "rgba16f" | "rgba32f" | null =>
                format ?? null,
            ),
            target.mipmapped,
            String(target.samples),
            target.depthBytesPerTexel === null
              ? null
              : String(target.depthBytesPerTexel),
            target.depthTexture ?? false,
            target.faces ?? 1,
            target.shadow === undefined
              ? null
              : [target.shadow.scope, target.shadow.light, target.shadow.role],
          ]),
        )
        .sort(compareAutoMovieRenderIds),
    ]),
  );
}

/** Collect object equivalence without serializing the host's equality token. */
const addGroup: (
  groups: Map<string, Set<string>>,
  identity: string,
  position: string,
) => void = (
  groups: Map<string, Set<string>>,
  identity: string,
  position: string,
): void => {
  let positions: Set<string> | undefined = groups.get(identity);
  if (positions === undefined) {
    positions = new Set();
    groups.set(identity, positions);
  }
  positions.add(position);
};

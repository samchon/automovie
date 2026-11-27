import type {
  IAutoMovieMaterial,
  IAutoMovieMeasureRenderTextureClosure,
  IAutoMovieRenderTextureCost,
  IAutoMovieRenderTextureResident,
  IAutoMovieRenderTextureSource,
} from "@automovie/interface";

import { materialTextureSlots } from "../../validation/internal/materialTextureSlots";
import { autoMovieTextureBindingStateKey } from "./autoMovieTextureBindingStateKey";
import { autoMovieTextureFormatBytes } from "./autoMovieTextureFormatBytes";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";
import { measureAutoMovieRenderTextureTarget } from "./measureAutoMovieRenderTextureTarget";
import { measureAutoMovieTextureStorage } from "./measureAutoMovieTextureStorage";
import { AutoMovieEngineRenderMaterial } from "../AutoMovieEngineRenderMaterial";

/*
 * Close current and retained consumers over one renderer's texture allocations.
 * Raw uploads share only an actual Source and equivalent upload state. PMREM
 * output and sharp-background cubes share only the actual environment Texture
 * object. PBR DFG lookup and PMREM blur scratch belong to the renderer once. A
 * source disposal releases its environment derivatives, while scratch and
 * lookup survive until their host releases the context or replaces the scratch.
 * Environment factory sampling is an initialization-order union: configured
 * mip-linear uploads and temporary linear conversion uploads can occupy
 * distinct keys even after properties match. Count each possible state once
 * with every equivalent material/source consumer; this is an upper bound, not a
 * census.
 *
 * Missing object identities in a multi-resident closure leave required bytes
 * unknown. Legacy single-shot facts describe a fresh context. Opaque object
 * tokens are used only for equality; stable resident owners identify the
 * result. PMREM bounds follow r186: a half-float atlas is 3_max(cubeSize,112)
 * by 4_cubeSize, cubeSize=power-of-two floor(width/4). The background cube
 * retains six RGBA color faces of the inherited component type and a
 * conservative 32-bit depth face attachment. Raw channel/internal format does
 * not own them. DFG is a 16-by-16 RG half-float texture, with no mip chain.
 * Driver overhead and encoded/CPU source bytes are outside these uncompressed
 * storage bounds.
 */
export function measureAutoMovieRenderTextureClosure(
  props: IAutoMovieMeasureRenderTextureClosure.IProps,
): IAutoMovieRenderTextureCost[] {
  const scopes: IAutoMovieRenderTextureResident[] = [
    {
      owner: props.residency?.owner ?? "current",
      materials: [...props.materials],
      sources: props.sources,
      environment: props.environment,
      environmentTexture: props.residency?.environmentTexture,
      defaultPbr: props.defaultPbr,
      shadowCasters: props.shadowCasters ?? [],
      areaLights: props.areaLights ?? false,
    },
    ...(props.residency?.residents ?? []),
  ];
  const owners: Set<string> = new Set<string>();
  for (const scope of scopes) {
    if (owners.has(scope.owner))
      throw new Error(
        `Texture resident owner "${scope.owner}" must be unique.`,
      );
    owners.add(scope.owner);
  }
  const multi: boolean = scopes.length > 1;
  const variants: Map<
    string,
    {
      assets: Set<string>;
      variant: string;
      materials: Set<string>;
      residents: Set<string>;
      bytes: number | null;
      allocations: number | null;
      runtimeOwners: Set<string>;
    }
  > = new Map<
    string,
    {
      assets: Set<string>;
      variant: string;
      materials: Set<string>;
      residents: Set<string>;
      bytes: number | null;
      allocations: number | null;
      runtimeOwners: Set<string>;
    }
  >();
  const derivatives: Map<string, IAutoMovieRenderTextureCost[]> = new Map<
    string,
    IAutoMovieRenderTextureCost[]
  >();
  const pbrMaterials: Set<string> = new Set<string>();
  const pbrOwners: Set<string> = new Set<string>();
  let dfg: boolean = props.residency?.dfgRetained ?? false;
  let blurBytes: number | null =
    props.residency?.pmremRetained === null ||
    props.residency?.pmremRetained === undefined
      ? 0
      : measureAutoMovieTextureStorage({
          ...props.residency.pmremRetained,
          bytesPerTexel: 8,
          mipmapped: false,
        });
  let blur: boolean =
    props.residency?.pmremRetained !== null &&
    props.residency?.pmremRetained !== undefined;
  const blurOwners: Set<string> = new Set<string>();
  for (const scope of scopes) {
    const sources: Map<string, IAutoMovieRenderTextureSource> = new Map<
      string,
      IAutoMovieRenderTextureSource
    >();
    for (const source of scope.sources) {
      const previous: IAutoMovieRenderTextureSource | undefined = sources.get(
        source.asset,
      );
      if (previous !== undefined && previous !== source)
        throw new Error(
          `Texture resident "${scope.owner}" repeats source asset "${source.asset}".`,
        );
      sources.set(source.asset, source);
    }
    const bind: (
      asset: string,
      variant: string,
      source: IAutoMovieRenderTextureSource | undefined,
      material?: string,
      explicitSampler?: boolean,
    ) => void = (
      asset: string,
      variant: string,
      source: IAutoMovieRenderTextureSource | undefined,
      material?: string,
      explicitSampler: boolean = false,
    ): void => {
      const mipmapped: boolean =
        source?.generateMipmaps === undefined
          ? (source?.mipmapped ?? false)
          : source.explicitMipmaps === true || source.generateMipmaps;
      const allocationKnown: boolean =
        source !== undefined &&
        source.allocationStateKnown !== false &&
        (source.samplerState !== null || explicitSampler) &&
        (!multi ||
          (source.sourceIdentity !== undefined &&
            source.uploadState !== undefined));
      const bytes: number | null =
        !allocationKnown || source === undefined
          ? null
          : measureAutoMovieTextureStorage({
              width: source.width,
              height: source.height,
              mipmapped,
              bytesPerTexel: autoMovieTextureFormatBytes(source.format),
            });
      const key: string = JSON.stringify([
        source?.sourceIdentity ?? [scope.owner, asset],
        variant,
        source?.uploadState ?? null,
        source?.format ?? null,
      ]);
      let entry:
        | {
            assets: Set<string>;
            variant: string;
            materials: Set<string>;
            residents: Set<string>;
            bytes: number | null;
            allocations: number | null;
            runtimeOwners: Set<string>;
          }
        | undefined = variants.get(key);
      if (entry === undefined) {
        entry = {
          assets: new Set(),
          variant,
          materials: new Set(),
          residents: new Set(),
          bytes,
          allocations: allocationKnown ? 1 : null,
          runtimeOwners: new Set(),
        };
        variants.set(key, entry);
      } else {
        if (entry.bytes !== null && bytes !== null && entry.bytes !== bytes)
          throw new Error(
            `Texture source "${asset}" has contradictory resident storage facts.`,
          );
        if (bytes === null) entry.bytes = null;
        if (!allocationKnown) entry.allocations = null;
      }
      entry.assets.add(asset);
      entry.residents.add(scope.owner);
      if (material !== undefined) entry.materials.add(material);
    };
    for (const material of scope.materials)
      for (const slot of materialTextureSlots(material)) {
        const asset: string =
          typeof slot.binding === "string" ? slot.binding : slot.binding.asset;
        const source: IAutoMovieRenderTextureSource | undefined =
          sources.get(asset);
        bind(
          asset,
          autoMovieTextureBindingStateKey(
            slot.binding,
            slot.colorSpace,
            source?.sampler,
            source?.samplerState,
          ),
          source,
          material.id,
          typeof slot.binding !== "string" &&
            slot.binding.sampler !== undefined,
        );
      }
    const pbr: boolean =
      scope.materials.length !== 0 || scope.defaultPbr === true;
    if (pbr) {
      dfg = true;
      pbrOwners.add(scope.owner);
      for (const material of scope.materials) pbrMaterials.add(material.id);
    }
    if (scope.environment === null) continue;
    const source: IAutoMovieRenderTextureSource | undefined =
      scope.environmentTexture ?? sources.get(scope.environment);
    if (source !== undefined && source.asset !== scope.environment)
      throw new Error(
        `Texture resident "${scope.owner}" has environment facts for a different asset.`,
      );
    const environmentColorSpace: "srgb" | "linear-environment" =
      source?.environmentColorSpace ??
      (source?.format === "rgba8" ? "srgb" : "linear-environment");
    const factoryReported: boolean =
      source?.environmentSampler !== undefined ||
      source?.environmentSamplerState !== undefined;
    const factoryRequired: boolean =
      source?.sampler === undefined ||
      source.sampler.minFilter === "linearMipmapLinear";
    const factoryKnown: boolean =
      source?.environmentSamplerState !== null &&
      (factoryReported || !factoryRequired);
    const bounded: IAutoMovieRenderTextureSource | undefined =
      source === undefined || factoryKnown
        ? source
        : { ...source, allocationStateKnown: false };
    bind(
      scope.environment,
      autoMovieTextureBindingStateKey(
        scope.environment,
        environmentColorSpace,
        source?.sampler,
        source?.samplerState,
      ),
      bounded,
    );
    if (factoryReported)
      bind(
        scope.environment,
        autoMovieTextureBindingStateKey(
          scope.environment,
          environmentColorSpace,
          source?.environmentSampler,
          source?.environmentSamplerState,
        ),
        bounded,
      );
    const knownIdentity: boolean =
      !multi ||
      (scope.environmentTexture !== undefined &&
        source?.textureIdentity !== undefined);
    const derivativeKey: string =
      source?.textureIdentity !== undefined && knownIdentity
        ? source.textureIdentity
        : scope.owner;
    let rows: IAutoMovieRenderTextureCost[] | undefined =
      derivatives.get(derivativeKey);
    const atlasBytes: number | null =
      knownIdentity && source?.allocationStateKnown !== false
        ? pmremBytes(source)
        : null;
    const cubeBytes: number | null =
      knownIdentity && source?.allocationStateKnown !== false
        ? backgroundBytes(source)
        : null;
    if (rows === undefined) {
      rows = [
        {
          asset: scope.environment,
          variant: "environment-background-cube",
          materials: [],
          residents: [],
          bytes: cubeBytes,
          ...(!knownIdentity ? { allocations: null } : {}),
        },
      ];
      derivatives.set(derivativeKey, rows);
    } else {
      if (
        rows[0]!.bytes !== null &&
        cubeBytes !== null &&
        rows[0]!.bytes !== cubeBytes
      )
        throw new Error(
          `Environment texture "${scope.environment}" has contradictory background extents.`,
        );
      if (cubeBytes === null) rows[0]!.bytes = null;
      if (!knownIdentity) rows[0]!.allocations = null;
    }
    const background: IAutoMovieRenderTextureCost = rows[0]!;
    background.residents!.push(scope.owner);
    background.assets = [
      ...new Set([
        ...(background.assets ?? [background.asset!]),
        scope.environment,
      ]),
    ].sort(compareAutoMovieRenderIds);
    background.asset = background.assets[0]!;
    if (pbr) {
      let output: IAutoMovieRenderTextureCost | undefined = rows.find(
        (row: IAutoMovieRenderTextureCost): boolean =>
          row.variant === "environment-cubeuv",
      );
      if (output === undefined) {
        output = {
          asset: scope.environment,
          assets: [],
          variant: "environment-cubeuv",
          materials: [],
          residents: [],
          bytes: atlasBytes,
          ...(!knownIdentity ? { allocations: null } : {}),
        };
        rows.push(output);
      } else {
        if (
          output.bytes !== null &&
          atlasBytes !== null &&
          output.bytes !== atlasBytes
        )
          throw new Error(
            `Environment texture "${scope.environment}" has contradictory PMREM extents.`,
          );
        if (atlasBytes === null) output.bytes = null;
        if (!knownIdentity) output.allocations = null;
      }
      output.residents!.push(scope.owner);
      output.assets = [...new Set([...output.assets!, scope.environment])].sort(
        compareAutoMovieRenderIds,
      );
      output.asset = output.assets[0]!;
      blur = true;
      blurOwners.add(scope.owner);
      blurBytes =
        blurBytes === null || atlasBytes === null
          ? null
          : Math.max(blurBytes, atlasBytes);
    }
  }
  const runtimeOwners: Set<string> = new Set<string>();
  const builtinUses: Set<string> = new Set<string>();
  for (const runtime of props.residency?.runtimeTextures ?? []) {
    if (runtimeOwners.has(runtime.owner))
      throw new Error(
        `Runtime texture owner "${runtime.owner}" must be unique.`,
      );
    runtimeOwners.add(runtime.owner);
    const source: Omit<IAutoMovieRenderTextureSource, "asset"> =
      runtime.texture;
    const variant: string =
      source.colorSpace === undefined
        ? JSON.stringify(["unknown-runtime", source.sampler ?? null])
        : autoMovieTextureBindingStateKey(
            runtime.owner,
            source.colorSpace,
            source.sampler,
            source.samplerState,
          );
    const key: string = JSON.stringify([
      source.sourceIdentity ?? ["runtime", runtime.owner],
      variant,
      source.uploadState ?? null,
      source.format ?? null,
    ]);
    const allocationKnown: boolean =
      source.allocationStateKnown !== false &&
      source.samplerState !== null &&
      source.colorSpace !== undefined &&
      source.sourceIdentity !== undefined &&
      source.uploadState !== undefined;
    const bytes: number | null = !allocationKnown
      ? null
      : measureAutoMovieTextureStorage({
          width: source.width,
          height: source.height,
          bytesPerTexel: autoMovieTextureFormatBytes(source.format),
          mipmapped: source.mipmapped,
        });
    let entry:
      | {
          assets: Set<string>;
          variant: string;
          materials: Set<string>;
          residents: Set<string>;
          bytes: number | null;
          allocations: number | null;
          runtimeOwners: Set<string>;
        }
      | undefined = variants.get(key);
    if (entry === undefined) {
      entry = {
        assets: new Set(),
        variant,
        materials: new Set(),
        residents: new Set(),
        bytes,
        allocations: allocationKnown ? 1 : null,
        runtimeOwners: new Set(),
      };
      variants.set(key, entry);
    } else {
      if (entry.bytes !== null && bytes !== null && entry.bytes !== bytes)
        throw new Error(
          `Runtime texture "${runtime.owner}" has contradictory resident storage facts.`,
        );
      if (bytes === null) entry.bytes = null;
      if (!allocationKnown) entry.allocations = null;
    }
    entry.runtimeOwners.add(runtime.owner);
    for (const resident of runtime.residents ?? []) {
      entry.residents.add(resident);
      if (runtime.purpose !== undefined)
        builtinUses.add(JSON.stringify([resident, runtime.purpose]));
    }
  }
  const rows: IAutoMovieRenderTextureCost[] = [...variants.values()].map(
    (entry: {
      assets: Set<string>;
      variant: string;
      materials: Set<string>;
      residents: Set<string>;
      bytes: number | null;
      allocations: number | null;
      runtimeOwners: Set<string>;
    }): {
      runtimeOwners: string[];
      allocations?: null | undefined;
      assets: string[];
      materials: string[];
      residents: string[];
      bytes: number | null;
      runtime?: "data-texture" | undefined;
      asset: string;
      variant: string;
    } => ({
      asset: [...entry.assets].sort(compareAutoMovieRenderIds)[0] ?? null,
      variant: entry.variant,
      ...(entry.assets.size === 0 ? { runtime: "data-texture" as const } : {}),
      assets: [...entry.assets].sort(compareAutoMovieRenderIds),
      materials: [...entry.materials].sort(compareAutoMovieRenderIds),
      residents: [...entry.residents].sort(compareAutoMovieRenderIds),
      bytes: entry.bytes,
      ...(entry.allocations === null ? { allocations: null } : {}),
      runtimeOwners: [...entry.runtimeOwners].sort(compareAutoMovieRenderIds),
    }),
  );
  const targetOwners: Set<string> = new Set<string>();
  const transmissionScopes: Set<string> = new Set<string>();
  const shadowRoles: Set<string> = new Set<string>();
  for (const target of props.residency?.renderTargets ?? []) {
    if (targetOwners.has(target.owner))
      throw new Error(`Render target owner "${target.owner}" must be unique.`);
    targetOwners.add(target.owner);
    if (target.transmissionScope !== undefined)
      transmissionScopes.add(target.transmissionScope);
    if (target.shadow !== undefined)
      shadowRoles.add(
        JSON.stringify([
          target.shadow.scope,
          target.shadow.light,
          target.shadow.role,
        ]),
      );
    rows.push({
      asset: null,
      runtime:
        target.transmissionScope === undefined
          ? "render-target"
          : "transmission-target",
      variant: `render-target:${target.owner}`,
      allocations:
        target.formats.length + (target.depthTexture === true ? 1 : 0),
      materials: [],
      residents:
        target.transmissionScope === undefined
          ? target.shadow === undefined
            ? []
            : [target.shadow.scope]
          : [target.transmissionScope],
      runtimeOwners: [target.owner],
      bytes: measureAutoMovieRenderTextureTarget(target),
    });
  }
  for (const scope of scopes) {
    if (
      scope.areaLights === undefined &&
      (scope.materials.length !== 0 || scope.defaultPbr === true)
    )
      rows.push({
        asset: null,
        runtime: "data-texture",
        variant: `area-light-profile:${scope.owner}`,
        materials: [],
        residents: [scope.owner],
        bytes: null,
        allocations: null,
      });
    for (const purpose of AutoMovieEngineRenderMaterial.requiredTexturePurposes({
      materials: scope.materials,
      defaultPbr: scope.defaultPbr === true,
      areaLights: scope.areaLights ?? false,
    }))
      if (!builtinUses.has(JSON.stringify([scope.owner, purpose])))
        rows.push({
          asset: null,
          runtime: "data-texture",
          variant: `builtin-texture:${JSON.stringify([scope.owner, purpose])}`,
          runtimeOwners: [purpose],
          materials: [],
          residents: [scope.owner],
          bytes: null,
          allocations: null,
        });
    if (scope.shadowCasters === undefined) {
      rows.push({
        asset: null,
        runtime: "render-target",
        variant: `shadow-profile:${scope.owner}`,
        materials: [],
        residents: [scope.owner],
        bytes: null,
        allocations: null,
      });
      continue;
    }
    for (const caster of scope.shadowCasters)
      for (const role of caster.filterDraws === 0 ? ["map"] : ["map", "blur"])
        if (!shadowRoles.has(JSON.stringify([scope.owner, caster.light, role])))
          rows.push({
            asset: null,
            runtime: "render-target",
            variant: `shadow-target:${JSON.stringify([scope.owner, caster.light, role])}`,
            materials: [],
            residents: [scope.owner],
            bytes: null,
            allocations: null,
          });
  }
  for (const scope of scopes)
    if (
      scope.materials.some(
        (material: IAutoMovieMaterial): boolean =>
          (material.transmission ?? 0) > 0,
      ) &&
      !transmissionScopes.has(scope.owner)
    )
      rows.push({
        asset: null,
        runtime: "transmission-target",
        variant: `transmission-target:${scope.owner}`,
        materials: scope.materials
          .filter(
            (material: IAutoMovieMaterial): boolean =>
              (material.transmission ?? 0) > 0,
          )
          .map((material: IAutoMovieMaterial): string => material.id)
          .sort(compareAutoMovieRenderIds),
        residents: [scope.owner],
        bytes: null,
        allocations: null,
      });
  rows.push(...[...derivatives.values()].flat());
  if (dfg)
    rows.push({
      asset: null,
      runtime: "dfg-lut",
      variant: "renderer-dfg-lut",
      materials: [...pbrMaterials].sort(compareAutoMovieRenderIds),
      residents: [...pbrOwners].sort(compareAutoMovieRenderIds),
      bytes: 16 * 16 * 2 * 2,
    });
  if (blur)
    rows.push({
      asset: null,
      runtime: "pmrem-blur",
      variant: "renderer-pmrem-blur",
      materials: [],
      residents: [...blurOwners].sort(compareAutoMovieRenderIds),
      bytes: blurBytes,
    });
  const compositors: Set<string> = new Set<string>();
  for (const compositor of props.residency?.displayCompositors ?? []) {
    if (compositors.has(compositor.owner))
      throw new Error(
        `Display compositor owner "${compositor.owner}" must be unique.`,
      );
    compositors.add(compositor.owner);
    const copyBytes: number | null = measureAutoMovieTextureStorage({
      ...compositor,
      bytesPerTexel: 4,
      mipmapped: false,
    });
    for (const role of ["incoming", "outgoing", "completed"])
      rows.push({
        asset: null,
        runtime: "display-compositor",
        variant: `display-compositor:${compositor.owner}:${role}`,
        materials: [],
        residents: [],
        bytes: copyBytes,
      });
  }
  for (const row of rows)
    row.residents = [...new Set(row.residents)].sort(compareAutoMovieRenderIds);
  return rows.sort(
    (a: IAutoMovieRenderTextureCost, b: IAutoMovieRenderTextureCost): number =>
      compareAutoMovieRenderIds(a.asset ?? "", b.asset ?? "") ||
      compareAutoMovieRenderIds(a.variant ?? "", b.variant ?? "") ||
      compareAutoMovieRenderIds(
        JSON.stringify(a.residents),
        JSON.stringify(b.residents),
      ) ||
      compareAutoMovieRenderIds(
        JSON.stringify(a.runtimeOwners ?? []),
        JSON.stringify(b.runtimeOwners ?? []),
      ),
  );
}

/*
 * R186 equirectangular conversion produces a two-dimensional half-float atlas.
 */
const pmremBytes: (
  source: IAutoMovieRenderTextureSource | undefined,
) => number | null = (
  source: IAutoMovieRenderTextureSource | undefined,
): number | null => {
  if (source === undefined || source.width <= 0 || source.height <= 0)
    return null;
  const cubeSize: number = Math.max(
    1,
    2 ** Math.floor(Math.log2(source.width / 4)),
  );
  return measureAutoMovieTextureStorage({
    width: 3 * Math.max(cubeSize, 112),
    height: 4 * cubeSize,
    bytesPerTexel: 8,
    mipmapped: false,
  });
};

/*
 * Sharp-background conversion retains six color faces and depth attachments.
 */
const backgroundBytes: (
  source: IAutoMovieRenderTextureSource | undefined,
) => number | null = (
  source: IAutoMovieRenderTextureSource | undefined,
): number | null => {
  if (source === undefined) return null;
  const color: number | null = measureAutoMovieTextureStorage({
    width: source.height,
    height: source.height,
    bytesPerTexel: autoMovieTextureFormatBytes(
      source.environmentBackgroundFormat,
    ),
    mipmapped: source.generateMipmaps ?? source.mipmapped,
  });
  const depth: number | null = measureAutoMovieTextureStorage({
    width: source.height,
    height: source.height,
    bytesPerTexel: 4,
    mipmapped: false,
  });
  const bytes: number | null =
    color === null || depth === null ? null : 6 * (color + depth);
  return bytes !== null ? bytes : null;
};

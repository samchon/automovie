import type {
  IAutoMovieConstraintViolation,
  IAutoMovieLight,
  IAutoMovieMaterial,
  IAutoMovieMeasureRenderSimulation,
  IAutoMovieModel,
  IAutoMovieRenderAnalysisGap,
  IAutoMovieRenderSubject,
  IAutoMovieRenderTargetSettings,
  IAutoMovieRenderTextureCost,
} from "@automovie/interface";

import { measureAutoMovieRenderTextureClosure } from "./measureAutoMovieRenderTextureClosure";
import { resolveAutoMovieShadowProfile } from "./resolveAutoMovieShadowProfile";
import { sumAutoMovieRenderTextureAllocations } from "./sumAutoMovieRenderTextureAllocations";

/**
 * The render inventory's material and texture phase: resolve the shadow
 * profile, complete the material table with every drawn model's part materials,
 * close the textures over it and attribute each texture's bytes and
 * allocations.
 *
 * It runs after the population and simulation phases have named every drawn
 * model and every material a simulated drawable cites, so `materials` already
 * holds those and this phase only adds the drawn parts' own. One `materials`
 * row per material id joins `add`; each texture closure row adds its bytes and
 * allocation count when known, as the owner's own cost for an asset and as a
 * runtime cost for a renderer-made texture. A texture whose bytes or the
 * combined bytes are unknown, and an uncertified allocation population, each
 * append a `not-run` gap rather than an invented number.
 *
 * @returns The shadow casters the pass phase counts, the texture closure rows
 *   and their summed bytes and allocations, each `null` when not known.
 * @throws {Error} The shadow profile the scene and settings ask for is not
 *   supported.
 */
export function measureRenderTextures(
  props: measureRenderTextures.IProps,
): measureRenderTextures.IResult {
  const {
    subject,
    materials,
    byId,
    drawnModels,
    add,
    gaps,
  }: measureRenderTextures.IProps = props;
  const shadowProfile:
    | {
        success: false;
        violations: IAutoMovieConstraintViolation[];
        enabled?: undefined;
        type?: undefined;
        casters?: undefined;
      }
    | {
        success: true;
        enabled: boolean;
        type: "pcf" | "vsm";
        casters: measureRenderTextures.ICaster[];
        violations?: undefined;
      } = resolveAutoMovieShadowProfile({
    lights: subject.scene.lights,
    shadows:
      subject.scene.environment?.shadows ??
      (props.settings === undefined
        ? undefined
        : {
            enabled: props.settings.shadows,
            type:
              props.settings.shadowType === "none"
                ? "pcf"
                : props.settings.shadowType,
          }),
  });
  if (!shadowProfile.success)
    throw new Error(
      "Unsupported shadow profile: " + JSON.stringify(shadowProfile.violations),
    );
  const casters: measureRenderTextures.ICaster[] = shadowProfile.casters;
  for (const id of drawnModels) {
    const definition: IAutoMovieModel = byId.get(id)!;
    for (const part of definition.parts) {
      if (part.material === null) continue;
      const material: IAutoMovieMaterial | undefined =
        definition.materials.find(
          (candidate: IAutoMovieMaterial): boolean =>
            candidate.id === part.material,
        );
      if (material !== undefined && !materials.has(material.id))
        materials.set(material.id, material);
    }
  }
  for (const material of materials.values())
    add(
      `material:${material.id}`,
      `models[].materials["${material.id}"]`,
      "materials",
      1,
    );
  const textures: IAutoMovieRenderTextureCost[] =
    measureAutoMovieRenderTextureClosure({
      materials: materials.values(),
      sources: subject.textures ?? [],
      environment: subject.scene.environment?.image ?? null,
      defaultPbr:
        props.defaultMaterials > (subject.effects ?? []).length ||
        [...drawnModels].some(
          (id: string): boolean => byId.get(id)!.parts.length !== 0,
        ),
      residency: subject.textureResidency,
      shadowCasters: casters,
      areaLights: subject.scene.lights.some(
        (light: IAutoMovieLight): boolean => light.type === "area",
      ),
    });
  const missing: IAutoMovieRenderTextureCost[] = textures.filter(
    (texture: IAutoMovieRenderTextureCost): boolean => texture.bytes === null,
  );
  const textureBytes: number | null = sumBytes(textures);
  const textureAllocations: number | null =
    sumAutoMovieRenderTextureAllocations(textures);
  for (const texture of textures) {
    const owner: string =
      texture.asset === null
        ? texture.runtime === "data-texture"
          ? `runtime-texture:${JSON.stringify(texture.runtimeOwners)}`
          : `renderer:${texture.runtime}`
        : `texture:${texture.asset}`;
    const path: string =
      texture.asset === null
        ? texture.runtime === "data-texture"
          ? `renderer.runtimeTextures[${JSON.stringify(texture.runtimeOwners)}]`
          : `renderer.${texture.runtime}`
        : `assets["${texture.asset}"]`;
    if (texture.bytes !== null)
      add(
        owner,
        path,
        "textureBytes",
        texture.bytes,
        texture.asset === null ? "runtime" : "own",
      );
    if (texture.allocations !== null)
      add(
        owner,
        path,
        "textures",
        texture.allocations ?? 1,
        texture.asset === null ? "runtime" : "own",
      );
  }
  if (missing.length !== 0)
    gaps.push({
      metric: "textureBytes",
      status: "not-run",
      reason: `${missing.length} resident texture representation(s) have no safe decoded upload bound, starting with "${textureDiagnosticName(missing[0]!)}"`,
      remedy:
        "pass every resident source's decoded dimensions, upload format, sampling/mipmap facts and retained context extents from the capture host",
    });
  else if (textureBytes === null)
    gaps.push({
      metric: "textureBytes",
      status: "not-run",
      reason:
        "the combined resident texture representations exceed safe integer storage",
      remedy:
        "reduce resident upload dimensions or representation count before measuring the budget",
    });
  if (textureAllocations === null)
    gaps.push({
      metric: "textures",
      status: "not-run",
      reason: `the resident allocation population is uncertified or unsafe for ${textures.map(textureDiagnosticName).join(", ")}`,
      remedy:
        "supply actual host allocation authority and safe aggregate counts; current manual-mip properties cannot certify native sharing",
    });
  return { casters, textures, textureBytes, textureAllocations };
}

/** What the material and texture phase reads and returns. */
export namespace measureRenderTextures {
  /** One light's shadow map: its depth faces and its filtering draws. */
  export interface ICaster {
    /** The casting light's id. */
    light: string;

    /** Depth faces the light's map renders, each a pass over the scene. */
    depthFaces: number;

    /** Fullscreen filtering draws, each one triangle; 0 without VSM. */
    filterDraws: number;
  }

  /** The subject, the earlier phases' tables and the shared row sinks. */
  export interface IProps {
    /** The measured subject; only read. */
    subject: IAutoMovieRenderSubject;

    /** Target settings whose shadows apply when the scene states none. */
    settings?: IAutoMovieRenderTargetSettings;

    /** The subject's models by id. */
    byId: ReadonlyMap<string, IAutoMovieModel>;

    /** Ids of the models the population phase drew. */
    drawnModels: ReadonlySet<string>;

    /**
     * Materials cited so far by id; this phase adds the drawn parts' own and
     * reads the completed table.
     */
    materials: Map<string, IAutoMovieMaterial>;

    /** Materials the renderer creates for unnamed simulated drawables. */
    defaultMaterials: number;

    /** Appends one owner row. */
    add: IAutoMovieMeasureRenderSimulation.IProps["add"];

    /** Receives the phase's analysis gaps. */
    gaps: IAutoMovieRenderAnalysisGap[];
  }

  /** The phase's shadow casters and texture closure. */
  export interface IResult {
    /** Lights that render a shadow map, for the pass phase. */
    casters: ICaster[];

    /** The texture closure rows the report lists. */
    textures: IAutoMovieRenderTextureCost[];

    /** Summed texture bytes, or `null` when any is unknown or unsafe. */
    textureBytes: number | null;

    /** Summed texture allocations, or `null` when uncertified or unsafe. */
    textureAllocations: number | null;
  }
}

/** Sum of the rows' bytes; `null` when one is unknown or the sum is unsafe. */
const sumBytes: (
  textures: readonly IAutoMovieRenderTextureCost[],
) => number | null = (
  textures: readonly IAutoMovieRenderTextureCost[],
): number | null => {
  let sum: number = 0;
  for (const texture of textures) {
    if (texture.bytes === null) return null;
    sum += texture.bytes;
    if (!Number.isSafeInteger(sum)) return null;
  }
  return sum;
};

/** A source or generating runtime stays named even when its cost is unknown. */
const textureDiagnosticName: (
  texture: IAutoMovieRenderTextureCost,
) => string | undefined = (
  texture: IAutoMovieRenderTextureCost,
): string | undefined =>
  texture.asset ?? texture.runtimeOwners?.join(", ") ?? texture.variant;

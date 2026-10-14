import {
  normalizeAutoMovieShadowFilter,
  resolveAutoMovieShadowProfile,
  sealAutoMovieRenderTarget,
} from "@automovie/engine";
import type { IAutoMovieConstraintViolation, IAutoMovieLight, IAutoMovieRenderTarget, IAutoMovieRenderTargetSettings } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Shadow support and identity use one effective filter. A removed soft-PCF
 * implementation retains its authored spelling as a canonical PCF alias;
 * enabled point VSM is an input refusal with every offending light's path.
 *
 * Scenarios:
 *
 * 1. PCF and its alias normalize identically; VSM retains its identity and an
 *    unknown runtime filter is refused with a named diagnostic.
 * 2. Default and null policies retain legacy PCF. Disabled, noncasting and area
 *    lights owe no shadow allocation, with supported VSM twins still accepted.
 * 3. Two point VSM casters report both original light paths. Directional and
 *    spot VSM report one depth face and two filtering draws each.
 * 4. A sealed target normalizes the alias without mutating authored settings;
 *    PCF and alias target digests agree while VSM and disabled targets differ.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises normalizeAutoMovieShadowFilter, resolveAutoMovieShadowProfile and sealAutoMovieRenderTarget, asserting canonical policy, caster multiplicity, every original refusal path, authored-setting preservation and digest equivalence or change; this catches an alias priced differently or unsupported point VSM admitted as work.
 * @evidence contracts/testing.md#independent-expectations Literal filter and caster records follow the supported PCF/VSM policy: point PCF has six depth faces, directional and spot VSM have one face and two filtering draws, and area or disabled casters allocate none. Null-policy equivalence is anchored by the separate literal default assertion; digest tests check semantic equality and distinction rather than a captured hash.
 * @evidence contracts/testing.md#distinguishing-cases Covers PCF, its legacy alias, VSM and an unknown filter; omitted/null and disabled policies; supported directional/spot VSM beside two refused point casters; and noncasting/area neighbours. Target tests distinguish equivalent aliases from VSM and disabled policy; storage and whole-frame arithmetic belong to the other shadow tests.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_shadow_profile entry runs pure engine policy resolution and target hashing in-process with authored records, starting no renderer, browser, GPU or installed production; it owns every listed assertion directly.
 */
export function test_render_shadow_profile(): void {
  TestValidator.equals("effective filters", [
    normalizeAutoMovieShadowFilter("pcf"),
    normalizeAutoMovieShadowFilter("pcfSoft"),
    normalizeAutoMovieShadowFilter("vsm"),
  ], ["pcf", "pcf", "vsm"]);
  TestValidator.predicate("unknown filter is refused", throwsError(
    (): "pcf" | "vsm" => normalizeAutoMovieShadowFilter("unknown" as "pcf"),
    "Unsupported shadow filter: unknown",
  ));
  const base: Pick<IAutoMovieLight, "transform" | "color" | "intensity" | "castShadow"> = {
    transform: {
      translation: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    color: { r: 1, g: 1, b: 1, a: 1, hex: null },
    intensity: 1, castShadow: true,
  };
  const point: IAutoMovieLight = { ...base, id: "point", type: "point", range: 0 };
  const directional: IAutoMovieLight = { ...base, id: "sun", type: "directional" };
  const spot: IAutoMovieLight = { ...base, id: "spot", type: "spot", range: 0, coneAngle: 45 };
  const area: IAutoMovieLight = { ...base, id: "panel", type: "area", width: 1, height: 1 };
  const legacy: ReturnType<typeof resolveAutoMovieShadowProfile> = resolveAutoMovieShadowProfile({ lights: [point] });
  TestValidator.equals("default is one point resource with six PCF faces", legacy, {
    success: true, enabled: true, type: "pcf",
    casters: [{ light: "point", depthFaces: 6, filterDraws: 0 }],
  });
  TestValidator.equals("null policy keeps legacy", resolveAutoMovieShadowProfile({
    lights: [point], shadows: null,
  }), legacy);
  const refused: ReturnType<typeof resolveAutoMovieShadowProfile> = resolveAutoMovieShadowProfile({
    lights: [point, directional, { ...point, id: "second" }],
    shadows: { enabled: true, type: "vsm" },
  });
  TestValidator.equals("unsupported input is refused", refused.success, false);
  if (refused.success) throw new Error("The unsupported input was admitted.");
  TestValidator.equals("every unsupported light is reported", refused.violations.map((v: IAutoMovieConstraintViolation): Pick<IAutoMovieConstraintViolation, "kind" | "path" | "value"> => ({
    kind:v.kind,path:v.path,value:v.value,
  })), [
    { kind: "type", path: "$input.lights[0].castShadow", value: true },
    { kind: "type", path: "$input.lights[2].castShadow", value: true },
  ]);
  TestValidator.equals("directional and spot support VSM filtering", resolveAutoMovieShadowProfile({
    lights: [directional, spot, { ...point, castShadow: false }, area],
    shadows: { enabled: true, type: "vsm" },
  }), {
    success: true, enabled: true, type: "vsm",
    casters: [
      { light: "sun", depthFaces: 1, filterDraws: 2 },
      { light: "spot", depthFaces: 1, filterDraws: 2 },
    ],
  });
  TestValidator.equals("disabled VSM point is supported without work", resolveAutoMovieShadowProfile({
    lights: [point, directional, spot, area], shadows: { enabled: false, type: "vsm" },
  }), { success: true, enabled: false, type: "vsm", casters: [] });
  const settings: IAutoMovieRenderTargetSettings = {
    width: 32, height: 32, pixelRatio: 1, shadows: true,
    shadowType: "pcfSoft", toneMapping: "none", exposure: 1,
  };
  const seal: (patch?: Partial<IAutoMovieRenderTargetSettings>) => IAutoMovieRenderTarget = (patch: Partial<IAutoMovieRenderTargetSettings> = {}): IAutoMovieRenderTarget => sealAutoMovieRenderTarget({
    renderer: { api: "webgl2", vendor: "unit", device: "unit" },
    settings: { ...settings, ...patch }, assets: [],
  });
  const alias: IAutoMovieRenderTarget = seal();
  TestValidator.equals("sealed alias is PCF", alias.settings.shadowType, "pcf");
  TestValidator.equals("authored spelling is preserved", settings.shadowType, "pcfSoft");
  TestValidator.equals("same effective target has same digest", alias.digest, seal({ shadowType: "pcf" }).digest);
  TestValidator.predicate("VSM differs", alias.digest !== seal({ shadowType: "vsm" }).digest);
  TestValidator.predicate("disabled differs", alias.digest !== seal({ shadows: false, shadowType: "none" }).digest);
}

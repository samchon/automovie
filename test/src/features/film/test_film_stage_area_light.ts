import type { IAutoMovieLight, IAutoMovieStageLight } from "@automovie/interface";
import { nclose } from "../internal/nclose";
import type { IAutoMovieStagedSet } from "../../../../packages/engine/src/film/IAutoMovieStagedSet";
import { stageScene } from "../../../../packages/engine/src/film/stageScene";
import { TestValidator } from "@nestia/e2e";
import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import { hasViolation, namedFacts, qclose } from "../internal/predicates";

/** A staged window panel; `width`/`height` ride the placement as authored. */
const WINDOW: IAutoMovieStageLight = {
  node: "north-window",
  role: "fill",
  type: "area",
  direction: { x: -1, y: 0, z: 0 },
  position: { x: 4, y: 2.2, z: 0 },
  intensity: 12,
  width: 2.4,
  height: 1.8,
} as unknown as IAutoMovieStageLight;

/** Stage the original duel with one unknown test payload cast only at its typed ingress. */
const stagedWith: (light: unknown) => IAutoMovieStagedSet = (light: unknown): IAutoMovieStagedSet =>
  stageScene(makeScriptWrite(), {
    ...makeStagingWrite(),
    lights: [light as IAutoMovieStageLight],
  });

/** Apply the isolated panel patch and read the original addressed refusal kind and path. */
const refusedAt: (patch: Record<string, unknown>, kind: "type" | "range", path: string) => boolean = (
  patch: Record<string, unknown>,
  kind: "type" | "range",
  path: string,
): boolean => hasViolation(stagedWith({ ...WINDOW, ...patch }), kind, path);

/**
 * A rectangular area light is staged with the exact parameters it can act on.
 *
 * Scenarios:
 *
 * 1. A complete panel lowers to an `area` scene light keeping its extent, its aim
 * as a rotation of local −Z, and its position.
 * 2. Missing panel extent is refused, as are zero width, infinite height and a
 * nonnumeric width; extent on spot and directional inputs is refused at its own field.
 * 3. The parameters a panel cannot act on are refused rather than dropped: a
 * distance `range`, a spot `coneAngle`, and a shadow map `three.js` never renders for an analytically integrated source.
 *
 * @evidence contracts/testing.md#behavioral-verification Stages an authored area panel and observes copied extent, aim and position plus located refusals for missing/invalid extent and fields unavailable to the chosen kind.
 * @evidence contracts/testing.md#independent-expectations Literal panel dimensions/position and local-minus-Z aimed along minus-X provide the expected quaternion; per-kind field rules provide refusal paths, while numerical lowering proves no GPU area-light or shadow-map appearance.
 * @evidence contracts/testing.md#distinguishing-cases Keeps complete area input, missing axes, zero/non-finite/nonnumeric extent, extent on other kinds, unavailable range/cone/shadow and the adjacent punctual shadow requirement.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_stage_area_light and this entry owns its direct and delegated in-memory CPU assertions; it acquires no renderer, GPU, decoder, native build, installed consumer or completed-result cache. Numeric/byte observations do not prove hardware appearance or universal cross-host identity.
 */
export function test_film_stage_area_light(): void {
  const staged: IAutoMovieStagedSet = stagedWith(WINDOW);
  const light: IAutoMovieLight | undefined = staged.success === true ? staged.scene.lights[0] : undefined;
  TestValidator.equals(
    "a complete panel lowers whole",
    namedFacts([
      ["staged", (): boolean => staged.success === true],
      ["kind", (): boolean => light?.type === "area"],
      [
        "extent",
        (): boolean =>
          light?.type === "area" && nclose(light.width, 2.4, 0) && nclose(light.height, 1.8, 0),
      ],
      [
        "aim",
        (): boolean =>
          light !== undefined &&
          qclose(light.transform.rotation, {
            x: 0,
            y: Math.SQRT1_2,
            z: 0,
            w: Math.SQRT1_2,
          }),
      ],
      [
        "position",
        (): boolean =>
          light !== undefined &&
          nclose(light.transform.translation.x, 4, 0) &&
          nclose(light.transform.translation.y, 2.2, 0),
      ],
      ["noRange", (): boolean => light !== undefined && !("range" in light)],
    ]),
    {
      staged: true,
      kind: true,
      extent: true,
      aim: true,
      position: true,
      noRange: true,
    },
  );

  TestValidator.equals(
    "extent belongs to the panel alone and is held to a real size",
    namedFacts([
      [
        "missingWidth",
        (): boolean => refusedAt({ width: undefined }, "type", "$input.lights[0].width"),
      ],
      [
        "missingHeight",
        (): boolean =>
          refusedAt({ height: undefined }, "type", "$input.lights[0].height"),
      ],
      ["zeroWidth", (): boolean => refusedAt({ width: 0 }, "range", ".width")],
      [
        "infiniteHeight",
        (): boolean => refusedAt({ height: Infinity }, "range", ".height"),
      ],
      [
        "nonNumericWidth",
        (): boolean => refusedAt({ width: "wide" }, "range", ".width"),
      ],
      [
        "extentOnSpot",
        (): boolean =>
          hasViolation(
            stagedWith({
              node: "key",
              type: "spot",
              direction: { x: 0, y: -1, z: 0 },
              position: { x: 0, y: 3, z: 0 },
              intensity: 5,
              width: 1,
            }),
            "type",
            "$input.lights[0].width",
          ),
      ],
      [
        "extentOnDirectional",
        (): boolean =>
          hasViolation(
            stagedWith({
              node: "sun",
              direction: { x: -1, y: -1, z: 0 },
              intensity: 1,
              height: 2,
            }),
            "type",
            "$input.lights[0].height",
          ),
      ],
    ]),
    {
      missingWidth: true,
      missingHeight: true,
      zeroWidth: true,
      infiniteHeight: true,
      nonNumericWidth: true,
      extentOnSpot: true,
      extentOnDirectional: true,
    },
  );

  TestValidator.equals(
    "a panel refuses every parameter it could not act on",
    namedFacts([
      [
        "range",
        (): boolean => refusedAt({ range: 8 }, "type", "$input.lights[0].range"),
      ],
      [
        "coneAngle",
        (): boolean =>
          refusedAt({ coneAngle: 30 }, "type", "$input.lights[0].coneAngle"),
      ],
      [
        "castShadow",
        (): boolean =>
          refusedAt(
            {
              castShadow: true,
              shadow: {
                mapSize: 512,
                bias: 0,
                normalBias: 0,
                near: 0.1,
                far: 50,
              },
            },
            "type",
            "$input.lights[0].castShadow",
          ),
      ],
      [
        "castShadowIsNotAskedForSettings",
        (): boolean =>
          hasViolation(
            stagedWith({ ...WINDOW, castShadow: true }),
            "type",
            "$input.lights[0].castShadow",
          ) &&
          !hasViolation(
            stagedWith({ ...WINDOW, castShadow: true }),
            "type",
            "$input.lights[0].shadow",
          ),
      ],
      [
        "punctualShadowStillRequired",
        (): boolean =>
          hasViolation(
            stagedWith({
              node: "key",
              type: "spot",
              direction: { x: 0, y: -1, z: 0 },
              position: { x: 0, y: 3, z: 0 },
              intensity: 5,
              castShadow: true,
            }),
            "type",
            "$input.lights[0].shadow",
          ),
      ],
    ]),
    {
      range: true,
      coneAngle: true,
      castShadow: true,
      castShadowIsNotAskedForSettings: true,
      punctualShadowStillRequired: true,
    },
  );
}

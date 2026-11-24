import { stageScene } from "@automovie/engine";
import type {
  IAutoMovieLight,
  IAutoMovieStageLight,
  IAutoMovieStagedSet,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeScriptWrite, makeStagingWrite } from "../../../internal/filmFixtures";
import { nclose } from "../../../internal/nclose";
import { hasViolation, namedFacts, qclose } from "../../../internal/predicates";

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
const stagedWith: (light: unknown) => IAutoMovieStagedSet = (
  light: unknown,
): IAutoMovieStagedSet =>
  stageScene(makeScriptWrite(), {
    ...makeStagingWrite(),
    lights: [light as IAutoMovieStageLight],
  });

/** Apply the isolated panel patch and read the original addressed refusal kind and path. */
const refusedAt: (
  patch: Record<string, unknown>,
  kind: "type" | "range",
  path: string,
) => boolean = (
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
 * as a rotation of local −Z, and its X/Y position. Z and intensity are supplied but not asserted here.
 * 2. A zero width is refused, and a punctual shadow still requires its settings.
 */
export function test_unit_engine_film_film_stage_area_light(): void {
  const staged: IAutoMovieStagedSet = stagedWith(WINDOW);
  const light: IAutoMovieLight | undefined =
    staged.success === true ? staged.scene.lights[0] : undefined;
  TestValidator.predicate(
    "a complete panel lowers whole",
    Object.values(
      namedFacts([
        ["staged", (): boolean => staged.success === true],
        ["kind", (): boolean => light?.type === "area"],
        [
          "extent",
          (): boolean =>
            light?.type === "area" &&
            nclose(light.width, 2.4, 0) &&
            nclose(light.height, 1.8, 0),
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
    ).every((fact: boolean): boolean => fact),
  );

  TestValidator.equals(
    "a panel's extent is held to a real size and punctual shadows keep their settings",
    namedFacts([
      ["zeroWidth", (): boolean => refusedAt({ width: 0 }, "range", ".width")],
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
      zeroWidth: true,
      punctualShadowStillRequired: true,
    },
  );
}
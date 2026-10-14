import { stageScene } from "@automovie/engine";
import type {
  IAutoMovieSceneNode,
  IAutoMovieStageSetPiece,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import { hasViolation, namedFacts, vclose } from "../internal/predicates";

/** Alias of the authored set-placement schema used by this entry's fixture. */
type SetPlacement = IAutoMovieStageSetPiece;

/** Stage the original script and replace only its authored set placements; the owning entry checks accepted TRS and the located scale refusals. */
const stageSet: (set: SetPlacement[]) => ReturnType<typeof stageScene> = (
  set: SetPlacement[],
): ReturnType<typeof stageScene> =>
  stageScene(makeScriptWrite(), makeStagingWrite({ set }));

/**
 * A set piece carries an optional uniform-or-per-axis `scale` (#1173), lowered
 * onto the staged node's transform. This lets one forged primitive
 * furnish a whole set (the wall, the step, and the table top are the same unit
 * box at three sizes) where the pinned `{1, 1, 1}` forced a separately forged
 * model per size.
 *
 * Scenarios:
 *
 * 1. An omitted `scale` keeps the model's authored size (identity); a bare number
 *    scales all three axes; a vector scales each axis on its own: one `slab`
 *    model staged three ways in one round.
 * 2. The gate refuses uniform zero scale, a negative axis
 *    (a reflected transform), and a
 *    non-finite one, each at its own `$input.set[i].scale`.
 * 3. The negative twin: a very small but positive uniform scale is accepted, so
 *    the gate rejects zero rather than "small".
 *
 * @evidence contracts/testing.md#behavioral-verification Stages omitted, uniform and per-axis set scales and observes their TRS values, then requires zero, negative and nonfinite refusals while admitting a tiny positive scale.
 * @evidence contracts/testing.md#independent-expectations Identity, the literal uniform 2.5 and vector components define the scale oracle, compared with vclose; positive finite scale is the admission rule rather than a measured rendered size.
 * @evidence contracts/testing.md#distinguishing-cases Preserves omission, uniform/vector spellings, zero, negative axis, NaN, infinite axis and the adjacent positive 1e-6 case; model geometry and yaw/full rotation have separate owners.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns all scale cases through stageScene and existing fixture records, without model loading, rendering or any real host.
 */
export function test_film_stage_scene_set_scale(): void {
  const staged: ReturnType<typeof stageSet> = stageSet([
    { node: "plain", model: "slab", position: { x: 0, y: 0, z: 0 } },
    {
      node: "crate",
      model: "slab",
      position: { x: 1, y: 0, z: 0 },
      scale: 2.5,
    },
    {
      node: "wall",
      model: "slab",
      position: { x: 2, y: 0, z: 0 },
      scale: { x: 12, y: 1.8, z: 0.24 },
    },
  ]);
  TestValidator.equals(
    "staging with scaled set succeeds",
    staged.success,
    true,
  );
  if (staged.success !== true) return;

  /** Borrow the accepted fixture node's lowered scale; known fixture ids are the caller premise. */
  const scaleOf: (id: string) => IAutoMovieVector3 = (
    id: string,
  ): IAutoMovieVector3 =>
    staged.scene.nodes.find(
      (node: IAutoMovieSceneNode): boolean => node.id === id,
    )!.transform.scale;
  TestValidator.predicate(
    "an omitted scale is identity",
    vclose(scaleOf("plain"), {
      x: 1,
      y: 1,
      z: 1,
    }),
  );
  TestValidator.predicate(
    "a number scales every axis",
    vclose(scaleOf("crate"), {
      x: 2.5,
      y: 2.5,
      z: 2.5,
    }),
  );
  TestValidator.predicate(
    "a vector scales per axis",
    vclose(scaleOf("wall"), {
      x: 12,
      y: 1.8,
      z: 0.24,
    }),
  );

  // 2. the gate, all in one refused round.
  const refused: ReturnType<typeof stageSet> = stageSet([
    { node: "flat", model: "slab", position: { x: 0, y: 0, z: 0 }, scale: 0 },
    {
      node: "mirror",
      model: "slab",
      position: { x: 1, y: 0, z: 0 },
      scale: { x: 1, y: -1, z: 1 },
    },
    {
      node: "nan",
      model: "slab",
      position: { x: 2, y: 0, z: 0 },
      scale: Number.NaN,
    },
    {
      node: "endless",
      model: "slab",
      position: { x: 3, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: Number.POSITIVE_INFINITY },
    },
  ]);
  TestValidator.equals(
    "zero, negative, and non-finite scales are each refused at their path",
    namedFacts([
      ["refusedSuccess", (): boolean => refused.success === false],
      [
        "hasViolationRefusedRange",
        (): boolean =>
          refused.success === false &&
          hasViolation(refused, "range", "$input.set[0].scale"),
      ],
      [
        "hasViolationRefusedRange2",
        (): boolean =>
          refused.success === false &&
          hasViolation(refused, "range", "$input.set[1].scale"),
      ],
      [
        "hasViolationRefusedRange3",
        (): boolean =>
          refused.success === false &&
          hasViolation(refused, "range", "$input.set[2].scale"),
      ],
      [
        "hasViolationRefusedRange4",
        (): boolean =>
          refused.success === false &&
          hasViolation(refused, "range", "$input.set[3].scale"),
      ],
    ]),
    {
      refusedSuccess: true,
      hasViolationRefusedRange: true,
      hasViolationRefusedRange2: true,
      hasViolationRefusedRange3: true,
      hasViolationRefusedRange4: true,
    },
  );

  // 3. the negative twin: positive-but-tiny is a size, not a collapse.
  const tiny: ReturnType<typeof stageSet> = stageSet([
    {
      node: "pebble",
      model: "slab",
      position: { x: 0, y: 0, z: 0 },
      scale: 1e-6,
    },
  ]);
  TestValidator.equals("a tiny positive scale is accepted", tiny.success, true);
}

import { AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieColor,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieProceduralSurface,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { boxModel } from "../internal/boxModel";
import { hasViolation } from "../internal/hasViolation";

/**
 * Model admission accepts a well-formed procedural surface and refuses each
 * malformed field at its own path, so a production learns which field to fix
 * before anything is drawn.
 *
 * Scenarios:
 *
 * 1. A stone surface and a wood surface with an axis are admitted.
 * 2. A surface on a material that also binds `baseColorTexture` is refused at
 *    `procedural`.
 * 3. An axis on stone and a missing axis on wood are refused at `procedural.axis`.
 * 4. A negative seed, a seed above 2³² − 1, a zero scale, a roughness of 1.5 and a
 *    negative relief are each refused at their field.
 * 5. A pattern piece whose tile has a zero length is refused at
 *    `procedural.piece.tile.u`, and a piece material cited by a box primitive,
 *    which has no UV0, is refused at that part's geometry.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `validateModel` on boxes citing each material; an admission that let a field through or reported it at another path fails.
 * @evidence contracts/development/testing.md#independent-expectations Every expected refusal is a range or rule the issue and the contract state; the accepted cases satisfy all of them.
 * @evidence contracts/development/testing.md#distinguishing-cases Each malformed case differs from an admitted one in one field, so a refusal cannot come from another field; the box primitive is the case without UV0, and the CPU samples are owned by `test_material_procedural_sample`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_material_procedural_admission`, with in-memory models only.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_material_procedural_admission(): void {
  const check: (
    procedural: unknown,
    extra?: Partial<IAutoMovieMaterial>,
  ) => IAutoMovieValidation = (
    procedural: unknown,
    extra: Partial<IAutoMovieMaterial> = {},
  ): IAutoMovieValidation =>
    AutoMovieEngineValidation.validateModel({
      model: boxModel({
        id: "card",
        materials: [
          {
            ...material(),
            ...extra,
            procedural: procedural as IAutoMovieProceduralSurface,
          },
        ],
      }),
    });

  // 1. Admitted.
  TestValidator.predicate("stone is admitted", check(stone()).success);
  TestValidator.predicate(
    "wood with an axis is admitted",
    check({ ...stone(), kind: "wood", axis: { x: 0, y: 1, z: 0 } }).success,
  );

  // 2. A texture stating the same channels.
  TestValidator.predicate(
    "a base colour texture beside a procedural surface is refused at procedural",
    hasViolation(
      check(stone(), {
        baseColorTexture: {
          asset: "wood.png",
          texCoord: 0,
          colorSpace: "srgb",
        },
      }),
      "type",
      ".procedural",
    ),
  );

  // 3. The axis rule.
  TestValidator.predicate(
    "an axis on stone is refused",
    hasViolation(
      check({ ...stone(), axis: { x: 0, y: 1, z: 0 } }),
      "type",
      ".procedural.axis",
    ),
  );
  TestValidator.predicate(
    "wood without an axis is refused",
    hasViolation(
      check({ ...stone(), kind: "wood" }),
      "type",
      ".procedural.axis",
    ),
  );

  // 4. Ranges.
  for (const [field, value] of [
    ["seed", -1],
    ["seed", 4294967296],
    ["scale", 0],
    ["relief", -0.001],
  ] as const)
    TestValidator.predicate(
      `${field} ${value} is refused`,
      hasViolation(
        check({ ...stone(), [field]: value }),
        "range",
        `.procedural.${field}`,
      ),
    );
  TestValidator.predicate(
    "a roughness of 1.5 is refused",
    hasViolation(
      check({ ...stone(), roughness: [0.2, 1.5] }),
      "range",
      ".procedural.roughness[1]",
    ),
  );

  // 5. Pattern pieces.
  const piece: IAutoMovieProceduralSurface.IPiece = {
    sheet: "face",
    tile: { u: 1, v: 1 },
    transform: {
      id: "field/t-0-0",
      offset: { x: 0, y: 0 },
      scale: { x: 1, y: 1 },
      rotationDeg: 0,
    },
  };
  TestValidator.predicate(
    "a zero tile length is refused",
    hasViolation(
      check({ ...stone(), piece: { ...piece, tile: { u: 0, v: 1 } } }),
      "range",
      ".procedural.piece.tile.u",
    ),
  );
  const model: IAutoMovieModel = boxModel({
    id: "board",
    materials: [{ ...material(), procedural: { ...stone(), piece } }],
  });
  TestValidator.predicate(
    "a piece material on a primitive without UV0 is refused at the part",
    hasViolation(AutoMovieEngineValidation.validateModel({ model }), "type", "$input.parts[0].geometry"),
  );
}

/** A plain material without a surface. */
function material(): IAutoMovieMaterial {
  return {
    id: "finish",
    name: null,
    baseColor: color(0.5),
    metallic: 0,
    roughness: 0.5,
    emissive: null,
    opacity: 1,
    baseColorTexture: null,
  };
}

/** An admissible stone surface. */
function stone(): IAutoMovieProceduralSurface {
  return {
    kind: "stone",
    seed: 1,
    scale: 0.1,
    colors: [color(0.2), color(0.6)],
    roughness: [0.6, 0.9],
    relief: 0.002,
  };
}

/** A grey linear colour. */
function color(value: number): IAutoMovieColor {
  return { r: value, g: value, b: value, a: 1, hex: null };
}

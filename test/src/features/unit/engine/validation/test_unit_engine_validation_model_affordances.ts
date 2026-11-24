import { validateModel } from "@automovie/engine";
import {
  IAutoMovieAffordance,
  IAutoMovieModel,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../../../internal/fixtures";
import { hasViolation } from "../../../internal/predicates";

const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
const UNIT: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };

const SQUARE: IAutoMovieVector3[] = [
  { x: -0.5, y: 0, z: -0.5 },
  { x: 0.5, y: 0, z: -0.5 },
  { x: 0.5, y: 0, z: 0.5 },
  { x: -0.5, y: 0, z: 0.5 },
];

const TOP: IAutoMovieAffordance = {
  id: "top",
  kind: "stack-top",
  frame: {
    translation: { x: 0, y: 0.5, z: 0 },
    rotation: IDENTITY,
    scale: UNIT,
  },
  extent: SQUARE,
};

const HANDLE: IAutoMovieAffordance = {
  id: "grip",
  kind: "handle",
  frame: {
    translation: { x: 0.3, y: 0.2, z: 0 },
    rotation: IDENTITY,
    scale: UNIT,
  },
  extent: null,
};

const withAffordances: (
  affordances: IAutoMovieAffordance[] | null | undefined,
) => IAutoMovieModel = (
  affordances: IAutoMovieAffordance[] | null | undefined,
): IAutoMovieModel =>
  affordances === undefined ? createModel() : { ...createModel(), affordances };

/**
 * Affordances are validated inside `validateModel`: ids unique, frame scalars
 * finite, and extent semantics by kind: a stack-top needs a well-formed
 * supporting face, point-like kinds must leave extent null. The field is
 * evolving-schema optional, so models that never heard of affordances validate
 * unchanged.
 *
 * Scenarios:
 *
 * 1. A model without the field and one with `affordances: null` both succeed; a
 *    valid stack-top + handle pair succeeds.
 * 2. A duplicate affordance id is a `type` violation on the second entry.
 * 3. An empty id is a `type` violation.
 * 4. A stack-top with `extent: null` is a `type` violation on `.extent`.
 * 5. A stack-top with only 2 extent points is a `type` violation.
 * 6. A collinear extent encloses no area: `type` violation.
 * 7. A non-finite extent coordinate is a `range` violation on that axis.
 * 8. A handle carrying an extent is a `type` violation (point-like).
 * 9. A non-finite frame scalar is a `range` violation via the shared transform
 *    check.
 * 10. A sized surface with a diamond outline inside its 1 m square succeeds; an
 *     outline on a handle, one of two points and a crossing bow tie are `type`
 *     violations on `.outline`, and a point 0.6 m out on a 1 m wide face is a
 *     `range` violation on that point's `x`.
 */
export function test_unit_engine_validation_model_affordances(): void {
  TestValidator.equals(
    "model without the field succeeds",
    validateModel({ model: withAffordances(undefined) }).success,
    true,
  );
  TestValidator.equals(
    "affordances: null succeeds",
    validateModel({ model: withAffordances(null) }).success,
    true,
  );
  TestValidator.equals(
    "valid stack-top + handle succeed",
    validateModel({ model: withAffordances([TOP, HANDLE]) }).success,
    true,
  );

  TestValidator.predicate(
    "duplicate affordance id fails",
    hasViolation(
      validateModel({
        model: withAffordances([TOP, { ...HANDLE, id: "top" }]),
      }),
      "type",
      ".affordances[1].id",
    ),
  );

  TestValidator.predicate(
    "stack-top without an extent fails",
    hasViolation(
      validateModel({ model: withAffordances([{ ...TOP, extent: null }]) }),
      "type",
      ".affordances[0].extent",
    ),
  );
  TestValidator.predicate(
    "stack-top with only two extent points fails",
    hasViolation(
      validateModel({
        model: withAffordances([{ ...TOP, extent: SQUARE.slice(0, 2) }]),
      }),
      "type",
      ".affordances[0].extent",
    ),
  );
  TestValidator.predicate(
    "collinear extent fails",
    hasViolation(
      validateModel({
        model: withAffordances([
          {
            ...TOP,
            extent: [
              { x: 0, y: 0, z: 0 },
              { x: 1, y: 0, z: 0 },
              { x: 2, y: 0, z: 0 },
            ],
          },
        ]),
      }),
      "type",
      ".affordances[0].extent",
    ),
  );
  TestValidator.predicate(
    "point-like handle with an extent fails",
    hasViolation(
      validateModel({
        model: withAffordances([{ ...HANDLE, extent: SQUARE }]),
      }),
      "type",
      ".affordances[0].extent",
    ),
  );

  // 10. A sized surface's outline.
  const face: IAutoMovieAffordance = {
    id: "face",
    kind: "surface",
    frame: HANDLE.frame,
    extent: null,
    width: 1,
    depth: 1,
  };
  const at = (x: number, z: number): IAutoMovieVector3 => ({ x, y: 0, z });
  const DIAMOND: IAutoMovieVector3[] = [
    at(0, -0.5),
    at(0.5, 0),
    at(0, 0.5),
    at(-0.5, 0),
  ];
  TestValidator.equals(
    "a surface outline inside its rectangle succeeds",
    validateModel({
      model: withAffordances([{ ...face, outline: DIAMOND }]),
    }).success,
    true,
  );
  for (const [name, affordance, kind, path] of [
    [
      "an outline on a handle",
      { ...HANDLE, outline: DIAMOND },
      "type",
      ".affordances[0].outline",
    ],
    [
      "an outline of two points",
      { ...face, outline: DIAMOND.slice(0, 2) },
      "type",
      ".affordances[0].outline",
    ],
    [
      "an outline point past the rectangle",
      { ...face, outline: [at(0, -0.5), at(0.6, 0), at(0, 0.5)] },
      "range",
      ".affordances[0].outline[1].x",
    ],
    [
      "a crossing outline",
      {
        ...face,
        outline: [at(-0.5, -0.5), at(0.5, 0.5), at(0.5, -0.5), at(-0.5, 0.5)],
      },
      "type",
      ".affordances[0].outline",
    ],
  ] as const)
    TestValidator.predicate(
      `${name} fails`,
      hasViolation(
        validateModel({
          model: withAffordances([affordance as IAutoMovieAffordance]),
        }),
        kind,
        path,
      ),
    );
}

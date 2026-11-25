import {
  jointToQuaternionOnBasis as compose,
  normalizeJointAxes,
} from "@automovie/engine";
import type {
  AutoMovieJointTwistPlacement,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../../../internal/qclose";

/** Both places a joint's twist can sit along its segment. */
const PLACEMENTS: readonly AutoMovieJointTwistPlacement[] = [
  "proximal",
  "distal",
];

/** The four components of a quaternion, in storage order. */
const COMPONENTS: readonly (keyof IAutoMovieQuaternion)[] = [
  "x",
  "y",
  "z",
  "w",
];

/**
 * Public prepared cardinal composition retains the actual noncommuting product,
 * signed-zero arithmetic and fresh outer quaternion ownership.
 *
 * Scenarios:
 *
 * 1. Proximal Y90_X90 is(0.5,0.5,-0.5,0.5). Swapping the two named axes makes
 *    X90_Y90=(0.5,0.5,0.5,0.5). Reversing only flexion changes its
 *    corresponding component and the cross-product sign. Both a genuinely
 *    normalized basis and an ordinary structural copy describe these
 *    rotations.
 * 2. One current joint record reads A/B/zero/A on one prepared composer. Changed
 *    nonzero factor pairs require current inner composition; old outputs stay
 *    unchanged and an edited old output cannot poison replay. Raw direct parity
 *    supplements the literal geometry at signed-zero input.
 * 3. After finite cardinal products, a finite clinical MAX minus neutral -MAX
 *    overflows. The raw public result remains NaN on all components, matching
 *    direct arithmetic; a valid replacement frame then recovers.
 * 4. Scalar query readers deliver complete raw values and the current caller
 *    context to an actual visitor. A nonidentity affine frame fixes literal
 *    X90/X60 results; a reentrant identity read cannot replace the outerX60. A
 *    visitor's owned exception propagates without poisoning later reads, and
 *    invalid clinical input still refuses before that visitor executes.
 * 5. Three cyclic XYZ bases put the nonzero outer factor on each Cartesian axis
 *    under proximal/distal association. Literal triple quarter-turns include
 *    cancellation and four nonzero components; fresh, mutable-frame and scalar
 *    readers all preserve the same physical values and raw zeros.
 */
export function test_unit_engine_math_prepared_cardinal_products(): void {
  for (const swapped of [false, true]) {
    const normalized: IAutoMovieJointAxes = normalizeJointAxes(
      {
        flexion: swapped ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 },
        abduction: swapped ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 },
        twist: { x: 0, y: 0, z: 1 },
        twistPlacement: "proximal",
      },
      "prepared cardinal product basis",
    );
    for (const owned of [true, false]) {
      const basis: IAutoMovieJointAxes = owned
        ? normalized
        : {
            ...normalized,
            flexion: { ...normalized.flexion },
            abduction: { ...normalized.abduction },
            twist: { ...normalized.twist },
          };
      const frame: IAutoMovieRestFrame = { flexion: { sign: 1, neutral: 0 } };
      const original: NonNullable<IAutoMovieRestFrame["flexion"]> =
        frame.flexion!;
      const read: ReturnType<typeof compose.prepare> = compose.prepare(
        basis,
        frame,
      );
      const current: IAutoMovieJointPose = {
        bone: "spine",
        flexion: 90,
        abduction: 90,
        twist: null,
      };
      const a: IAutoMovieQuaternion = {
        x: 0.5,
        y: 0.5,
        z: swapped ? 0.5 : -0.5,
        w: 0.5,
      };
      const b: IAutoMovieQuaternion = {
        x: swapped ? 0.5 : -0.5,
        y: swapped ? -0.5 : 0.5,
        z: swapped ? -0.5 : 0.5,
        w: 0.5,
      };
      const earlier: {
        output: IAutoMovieQuaternion;
        expected: IAutoMovieQuaternion;
      }[] = [];
      const turns: ReadonlyArray<[number, number, IAutoMovieQuaternion]> = [
        [90, 90, a],
        [-90, 90, b],
        [0, -0, { x: 0, y: 0, z: 0, w: 1 }],
        [90, 90, a],
      ];
      for (const [flexion, abduction, expected] of turns) {
        current.flexion = flexion;
        current.abduction = abduction;
        const actual: IAutoMovieQuaternion = read(current);
        const direct: IAutoMovieQuaternion = compose(current, basis, frame);
        TestValidator.predicate(
          `literal cardinal product swapped=${swapped}, owned=${owned}, F=${flexion}, A=${abduction}`,
          qclose(actual, expected, 1e-12) && raw(actual, direct),
        );
        TestValidator.predicate(
          "changing private factor pairs cannot overwrite an earlier public quaternion",
          earlier.every(
            (prior: {
              output: IAutoMovieQuaternion;
              expected: IAutoMovieQuaternion;
            }): boolean =>
              actual !== prior.output &&
              qclose(prior.output, prior.expected, 1e-12),
          ),
        );
        earlier.push({ output: actual, expected });
      }
      earlier[0]!.output.x = 999;
      TestValidator.predicate(
        "caller output poison cannot change a later same-angle composition",
        qclose(read(current), a, 1e-12) && Object.is(earlier[0]!.output.x, 999),
      );
      frame.flexion = original;
      current.flexion = 90;
      TestValidator.predicate(
        "valid frame replacement recovers the original noncommuting product",
        qclose(read(current), a, 1e-12) &&
          raw(read(current), compose(current, basis, frame)),
      );
    }
  }
  outer();
  scalar(
    normalizeJointAxes(
      {
        flexion: { x: 1, y: 0, z: 0 },
        abduction: { x: 0, y: 1, z: 0 },
        twist: { x: 0, y: 0, z: 1 },
      },
      "scalar visitor cardinal basis",
    ),
  );
}

/**
 * Cyclic axes preserve handedness while demanding each actual outer sparse
 * sign/permutation.
 */
function outer(): void {
  const axes: readonly [
    IAutoMovieVector3,
    IAutoMovieVector3,
    IAutoMovieVector3,
  ] = [
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
  ];
  const s: number = Math.SQRT1_2;
  for (const cycle of [0, 1, 2])
    for (const placement of PLACEMENTS) {
      const basis: IAutoMovieJointAxes = normalizeJointAxes(
        {
          flexion: axes[cycle]!,
          abduction: axes[(cycle + 1) % 3]!,
          twist: axes[(cycle + 2) % 3]!,
          twistPlacement: placement,
        },
        "outer cardinal axes",
      );
      const frame: IAutoMovieRestFrame = {};
      const read: ReturnType<typeof compose.prepare> = compose.prepare(
        basis,
        frame,
      );
      const mutable: ReturnType<typeof compose.prepareMutable> =
        compose.prepareMutable(basis);
      const scalarRead: ReturnType<
        ReturnType<typeof compose.prepareScalarQueries>
      > = compose.prepareScalarQueries(basis, frame)();
      const context: object = {};
      const current: IAutoMovieJointPose = {
        bone: "spine",
        flexion: 90,
        abduction: 90,
        twist: 90,
      };
      const quarters: readonly [
        number,
        number,
        number,
        readonly [number, number, number, number],
      ][] = [
        [90, 90, 90, placement === "proximal" ? [0, s, 0, s] : [s, 0, 0, s]],
        [90, 90, -90, placement === "proximal" ? [s, 0, -s, 0] : [0, s, -s, 0]],
        [
          0,
          90,
          90,
          placement === "proximal"
            ? [-0.5, 0.5, 0.5, 0.5]
            : [0.5, 0.5, 0.5, 0.5],
        ],
        [-0, -0, -0, [0, 0, 0, 1]],
        [90, 90, 90, placement === "proximal" ? [0, s, 0, s] : [s, 0, 0, s]],
      ];
      let previous: IAutoMovieQuaternion | undefined;
      for (const [flexion, abduction, twist, values] of quarters) {
        current.flexion = flexion;
        current.abduction = abduction;
        current.twist = twist;
        const expected: IAutoMovieQuaternion = {
          x: values[(3 - cycle) % 3]!,
          y: values[(4 - cycle) % 3]!,
          z: values[(5 - cycle) % 3]!,
          w: values[3],
        };
        const actual: IAutoMovieQuaternion = read(current);
        const direct: IAutoMovieQuaternion = compose(current, basis, frame);
        const scalarValue: IScalar = scalarRead(current, collected, context);
        TestValidator.predicate(
          `literal outer product cycle${cycle}/${placement} at${flexion},${abduction},${twist}`,
          qclose(actual, expected, 1e-12) &&
            qclose(mutable(current, frame), expected, 1e-12) &&
            qclose(scalarValue.rotation, expected, 1e-12) &&
            scalarValue.context === context &&
            raw(actual, direct) &&
            raw(scalarValue.rotation, direct),
        );
        if (previous !== undefined)
          TestValidator.predicate(
            "changed outer factors neither borrow nor repair an earlier caller-edited quaternion",
            actual !== previous && Object.is(previous.w, 123),
          );
        actual.w = 123;
        previous = actual;
      }
      delete frame.twist;
      current.twist = 90;
      const restored: IAutoMovieQuaternion = read(current);
      const expected: readonly [number, number, number, number] =
        placement === "proximal" ? [0, s, 0, s] : [s, 0, 0, s];
      TestValidator.predicate(
        "finite outer-factor recovery restores the literal quarter-turn composition",
        qclose(
          restored,
          {
            x: expected[(3 - cycle) % 3]!,
            y: expected[(4 - cycle) % 3]!,
            z: expected[(5 - cycle) % 3]!,
            w: expected[3],
          },
          1e-12,
        ) && raw(restored, compose(current, basis)),
      );
    }
}

/**
 * Scalar results/context belong to each synchronous visitor, including
 * recursion and throw.
 */
function scalar(basis: IAutoMovieJointAxes): void {
  const frame: IAutoMovieRestFrame = { flexion: { sign: -1, neutral: 30 } };
  const factory: ReturnType<typeof compose.prepareScalarQueries> =
    compose.prepareScalarQueries(basis, frame);
  const one: ReturnType<typeof factory> = factory();
  const two: ReturnType<typeof factory> = factory();
  const context: object = {};
  const other: object = {};
  const quarter: IAutoMovieJointPose = {
    bone: "spine",
    flexion: -60,
    abduction: 0,
    twist: null,
  };
  const sixty: IAutoMovieJointPose = {
    bone: "spine",
    flexion: -30,
    abduction: 0,
    twist: null,
  };
  const zero: IAutoMovieJointPose = {
    bone: "spine",
    flexion: 30,
    abduction: 0,
    twist: null,
  };
  const first: IScalar = one(quarter, collected, context);
  const second: IScalar = two(zero, collected, other);
  TestValidator.predicate(
    "scalar visitors receive actual raw affine rotations and their original context",
    first.context === context &&
      second.context === other &&
      qclose(
        first.rotation,
        { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 },
        1e-12,
      ) &&
      qclose(second.rotation, { x: 0, y: 0, z: 0, w: 1 }, 1e-12),
  );
  const nested: IScalar = one(
    sixty,
    (x: number, y: number, z: number, w: number, actual: object): IScalar => {
      const inner: IScalar = one(zero, collected, other);
      TestValidator.predicate(
        "same-reader recursion has its own completed scalars and caller context",
        actual === context &&
          inner.context === other &&
          qclose(inner.rotation, { x: 0, y: 0, z: 0, w: 1 }, 1e-12),
      );
      return { rotation: { x, y, z, w }, context: actual };
    },
    context,
  );
  TestValidator.predicate(
    "nested scalar read cannot replace an enclosing completed X60 result",
    nested.context === context &&
      qclose(
        nested.rotation,
        { x: 0.5, y: 0, z: 0, w: Math.sqrt(3) / 2 },
        1e-12,
      ),
  );
  const marker: object = {};
  const returned: object = one(
    quarter,
    (x: number, y: number, z: number, w: number, actual: object): object => {
      TestValidator.predicate(
        "the visitor owns its arbitrary returned value under the actual raw demand",
        actual === context && qclose({ x, y, z, w }, first.rotation, 1e-12),
      );
      return marker;
    },
    context,
  );
  TestValidator.predicate(
    "the reader returns exactly the visitor's value",
    returned === marker,
  );
  const sentinel: Error = new Error("owned scalar visitor failure");
  let refused: unknown = undefined;
  try {
    one(
      sixty,
      (
        _x: number,
        _y: number,
        _z: number,
        _w: number,
        _actual: object,
      ): never => {
        throw sentinel;
      },
      context,
    );
  } catch (error) {
    refused = error;
  }
  TestValidator.predicate(
    "a visitor's actual owned exception propagates unchanged",
    refused === sentinel,
  );
  const recovered: IScalar = one(quarter, collected, other);
  TestValidator.predicate(
    "a failed visitor cannot poison a later joint/context",
    recovered.context === other &&
      qclose(recovered.rotation, first.rotation, 1e-12),
  );
}

/** A visitor-owned raw rotation and the exact context its caller supplied. */
interface IScalar {
  /** Four completed raw Hamilton components. */
  rotation: IAutoMovieQuaternion;
  /** Exact original synchronous caller context. */
  context: object;
}

/**
 * Materialize only the test visitor's own result, without borrowing a producer
 * record.
 */
function collected(
  x: number,
  y: number,
  z: number,
  w: number,
  context: object,
): IScalar {
  return { rotation: { x, y, z, w }, context };
}

/**
 * Raw equivalence is secondary to the independently specified cardinal
 * rotation.
 */
function raw(
  actual: IAutoMovieQuaternion,
  expected: IAutoMovieQuaternion,
): boolean {
  return COMPONENTS.every((axis: keyof IAutoMovieQuaternion): boolean =>
    Object.is(actual[axis], expected[axis]),
  );
}

import {
  AutoMovieConstructionViews,
  type AutoMovieLoftFrame,
  AutoMovieViewAxis,
  rollAutoMovieViewAxis,
} from "@automovie/engine";
import type { IAutoMovieConstructionJointedAxis } from "@automovie/interface";

/**
 * A requested material roll changes only the in-plane basis, with C2 endpoint joins.
 *
 * Scenarios:
 * 1. Three length scales and signed target angles on a straight axis agree with the independent rotation matrix at the zero-jet quintic angle, preserving every origin and normal. Exact antipodal input follows the positive-half-turn convention.
 * 2. A nonplanar jointed course retains its original centreline and tangent. The endpoint +u matches the signed target's actual normal-plane projection; after the endpoint it carries a constant relative rotation rather than reprojecting a world direction. Before the start it retains the original frame.
 * 3. Metre AST admission preserves target directions and scales only station/centre lengths. Omitted and zero roll retain the base behavior. Malformed intervals and zero/nonfinite targets remain explicit axis failures. Relative projection below/at/above the existing 1e-9 conditioning boundary is distinguished from geometric parallelism; safe target magnitude changes preserve admitted orientation in both endpoint roll and initial base-up normalization, including a subnormal normal component whose reciprocal overflows.
 * 4. Existing segment/hinge normalization preserves a finite minimum-subnormal separation and a genuinely nonzero tiny turn. Positive uniform coordinate scaling preserves the double-reflection RMF on a nonplanar curve, including underflowing and overflowing squared chord norms.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Enters through the actual ConstructionViews.frame jointed AST path and reads original/rotated frames; directly checks the zero-roll preparation identity and rejects invalid declarations.
 * @evidence contracts/development/testing.md#independent-expectations Straight-frame expectations are u=(cos(theta*S),0,sin(theta*S)), v=(-sin(theta*S),0,cos(theta*S)) with S=10t^3-15t^4+6t^5 and constant endpoint extension. General-course target/normal expectations use independent cross/dot projection and a two-dimensional rotation matrix. Minimum-subnormal directions normalize analytically to diagonal unit vectors; a positive uniform coordinate scale does not change tangent directions or Householder reflection planes. All vector counts and finite components are checked before tolerances.
 * @evidence contracts/development/testing.md#distinguishing-cases Uses both rotation signs, a half turn, three scales, a genuinely nonplanar course, stations before/inside/after the transition, signed projected endpoint ownership, unchanged origins/normals, omitted/zero roll and invalid data.
 * @evidence contracts/development/testing.md#execution-ownership Synchronous discoverable synthetic CPU unit through --include construction_material_roll. It creates no Human, renderer, server, process or fixture.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Three length scales and signed target angles on a straight axis agree with the independent rotation matrix at the zero-jet quintic angle,...).
 */
export function test_construction_material_roll(): void {
  const failures: string[] = [];
  for (const scale of [0.001, 1, 1000])
    for (const angle of [-0.9, 0.7, Math.PI]) {
      const declaration: IAutoMovieConstructionJointedAxis = {
        type: "jointed",
        centres: [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: scale / 10, z: 0 },
        ],
        halves: [],
        up: { x: 1, y: 0, z: 0 },
        roll: {
          from: 0.02 * scale,
          to: 0.05 * scale,
          up:
            angle === Math.PI
              ? { x: -1, y: 0, z: 0 }
              : { x: Math.cos(angle), y: 0, z: Math.sin(angle) },
        },
      };
      const axis: AutoMovieViewAxis.IAxis | string =
        AutoMovieConstructionViews.frame(declaration);
      if (typeof axis === "string") {
        failures.push(`straight ${scale}/${angle}: ${axis}`);
        continue;
      }
      for (const t of [
        -1, 0, 0.0001, 0.01, 0.25, 0.5, 0.75, 0.99, 0.9999, 1, 2,
      ]) {
        const station: number = (20 + 30 * t) * scale;
        const q: number =
          t <= 0 ? 0 : t >= 1 ? 1 : t * t * t * (10 - 15 * t + 6 * t * t);
        const theta: number = angle * q;
        const frame: AutoMovieLoftFrame.IFrame = axis.at(station);
        vector(
          failures,
          `straight origin ${scale}/${angle}/${t}`,
          frame.origin,
          [0, station, 0],
          1e-11 * scale,
        );
        vector(
          failures,
          `straight u ${scale}/${angle}/${t}`,
          frame.u,
          [Math.cos(theta), 0, Math.sin(theta)],
          1e-12,
        );
        vector(
          failures,
          `straight v ${scale}/${angle}/${t}`,
          frame.v,
          [-Math.sin(theta), 0, Math.cos(theta)],
          1e-12,
        );
        vector(
          failures,
          `straight normal ${scale}/${angle}/${t}`,
          cross(frame.v, frame.u),
          [0, 1, 0],
          1e-12,
        );
      }

      // A one-sided value test at both endpoints distinguishes a linear angle ramp from a zero-jet C2 transition.
      for (const t of [0.001, 0.0005]) {
        const begin: AutoMovieLoftFrame.IFrame = axis.at((20 + 30 * t) * scale);
        const end: AutoMovieLoftFrame.IFrame = axis.at((50 - 30 * t) * scale);
        const limit: number =
          11 * Math.abs(angle) * t ** 3 + 64 * Number.EPSILON;
        if (
          begin.u.length !== 3 ||
          end.u.length !== 3 ||
          ![...begin.u, ...end.u, limit].every(Number.isFinite) ||
          Math.hypot(begin.u[0] - 1, begin.u[1], begin.u[2]) > limit ||
          Math.hypot(
            end.u[0] - Math.cos(angle),
            end.u[1],
            end.u[2] - Math.sin(angle),
          ) > limit
        )
          failures.push(`endpoint zero jets ${scale}/${angle}/${t}`);
      }
    }

  const centres: [number, number, number][] = [
    [0, 0, 0],
    [0, 20, 0],
    [15, 30, 4],
    [20, 50, 8],
  ];
  const base: AutoMovieViewAxis.IAxis | string = AutoMovieViewAxis.jointed(
    centres,
    [1, 1],
    [1, 0, 0],
  );
  if (typeof base === "string") failures.push(`nonplanar fixture: ${base}`);
  else {
    const target: [number, number, number] = [1, 0.3, 0.4];
    const from: number = 10;
    const to: number = 40;
    const rolled: AutoMovieViewAxis.IAxis | string = rollAutoMovieViewAxis(
      base,
      from,
      to,
      target,
    );
    if (typeof rolled === "string") failures.push(`nonplanar roll: ${rolled}`);
    else {
      const end: AutoMovieLoftFrame.IFrame = base.at(to);
      const n: [number, number, number] = cross(end.v, end.u);
      const projected: number[] = target.map(
        (value: number, i: number): number => value - dot(target, n) * n[i]!,
      );
      const length: number = Math.hypot(...projected);
      vector(
        failures,
        "signed endpoint projection",
        rolled.at(to).u,
        projected.map((value: number): number => value / length),
        2e-12,
      );
      const angle: number = Math.atan2(dot(target, end.v), dot(target, end.u));
      for (const station of [-5, 0, 10, 17, 25, 35, 40, 45, 60]) {
        const before: AutoMovieLoftFrame.IFrame = base.at(station);
        const after: AutoMovieLoftFrame.IFrame = rolled.at(station);
        vector(
          failures,
          `course origin ${station}`,
          after.origin,
          before.origin,
          1e-12,
        );
        vector(
          failures,
          `course normal ${station}`,
          cross(after.v, after.u),
          cross(before.v, before.u),
          2e-12,
        );
        if (station <= from) {
          vector(
            failures,
            `retained initial u ${station}`,
            after.u,
            before.u,
            0,
          );
          vector(
            failures,
            `retained initial v ${station}`,
            after.v,
            before.v,
            0,
          );
        }
        if (station >= to)
          vector(
            failures,
            `constant relative roll ${station}`,
            after.u,
            before.u.map(
              (value: number, i: number): number =>
                Math.cos(angle) * value + Math.sin(angle) * before.v[i]!,
            ),
            2e-12,
          );
      }
    }
  }

  const straight: AutoMovieViewAxis.IAxis = AutoMovieViewAxis.straight(
    [0, 0, 0],
    [1, 0, 0],
    [0, 0, 1],
  );
  if (rollAutoMovieViewAxis(straight, 1, 2, [1, 0, 0]) !== straight)
    failures.push("zero roll did not reuse the base axis");
  for (const [from, to, up] of [
    [1, 1, [1, 0, 0]],
    [2, 1, [1, 0, 0]],
    [NaN, 2, [1, 0, 0]],
    [-Number.MAX_VALUE, Number.MAX_VALUE, [1, 0, 0]],
    [1, 2, [0, 0, 0]],
    [1, 2, [0, 1, 0]],
    [1, 2, [Infinity, 0, 0]],
  ] as [number, number, [number, number, number]][]) {
    if (typeof rollAutoMovieViewAxis(straight, from, to, up) !== "string")
      failures.push(`invalid roll accepted: ${from}/${to}/${up}`);
  }
  for (const ratio of [0.5e-9, 1e-9]) {
    const target: [number, number, number] = [ratio, 1, 0];
    const refused: AutoMovieViewAxis.IAxis | string = rollAutoMovieViewAxis(
      straight,
      1,
      2,
      target,
    );
    const initial: AutoMovieViewAxis.IAxis | string = AutoMovieViewAxis.jointed(
      [
        [0, 0, 0],
        [0, 10, 0],
      ],
      [],
      target,
    );
    if (
      typeof refused !== "string" ||
      !refused.includes("relative normal projection") ||
      typeof initial !== "string" ||
      !initial.includes("relative normal projection")
    )
      failures.push(
        `nonparallel conditioning boundary ${ratio} was not identified`,
      );
  }
  for (const magnitude of [1e-300, 1, 1e300]) {
    const angle: number = 0.7;
    const target: [number, number, number] = [
      2e-9 * Math.cos(angle) * magnitude,
      magnitude,
      2e-9 * Math.sin(angle) * magnitude,
    ];
    const admitted: AutoMovieViewAxis.IAxis | string = rollAutoMovieViewAxis(
      straight,
      1,
      2,
      target,
    );
    if (typeof admitted === "string")
      failures.push(`conditioned target ${magnitude}: ${admitted}`);
    else
      vector(
        failures,
        `conditioned target orientation ${magnitude}`,
        admitted.at(2).u,
        [Math.cos(angle), 0, Math.sin(angle)],
        2e-12,
      );
    const initial: AutoMovieViewAxis.IAxis | string = AutoMovieViewAxis.jointed(
      [
        [0, 0, 0],
        [0, 10, 0],
      ],
      [],
      target,
    );
    if (typeof initial === "string")
      failures.push(`conditioned initial direction ${magnitude}: ${initial}`);
    else
      vector(
        failures,
        `conditioned initial orientation ${magnitude}`,
        initial.at(2).u,
        [Math.cos(angle), 0, Math.sin(angle)],
        2e-12,
      );
    const refused: AutoMovieViewAxis.IAxis | string = rollAutoMovieViewAxis(
      straight,
      1,
      2,
      [0.5e-9 * magnitude, magnitude, 0],
    );
    if (
      typeof refused !== "string" ||
      !refused.includes("relative normal projection")
    )
      failures.push(
        `small nonparallel target ${magnitude} was not refused by the documented policy`,
      );
  }
  const tiny: AutoMovieViewAxis.IAxis | string = AutoMovieViewAxis.jointed(
    [
      [0, 0, 0],
      [0, 0, 10],
    ],
    [],
    [Number.MIN_VALUE, Number.MIN_VALUE, 0],
  );
  if (typeof tiny === "string")
    failures.push(
      `admitted two-component minimum-subnormal direction: ${tiny}`,
    );
  else {
    const frame: AutoMovieLoftFrame.IFrame = tiny.at(2);
    vector(
      failures,
      "minimum-subnormal normalized u",
      frame.u,
      [Math.SQRT1_2, Math.SQRT1_2, 0],
      1e-12,
    );
    vector(
      failures,
      "minimum-subnormal normalized tangent",
      cross(frame.v, frame.u),
      [0, 0, 1],
      1e-12,
    );
  }
  const diagonal: AutoMovieViewAxis.IAxis | string = AutoMovieViewAxis.jointed(
    [
      [0, 0, 0],
      [10, 0, 10],
    ],
    [],
    [Number.MIN_VALUE, Number.MIN_VALUE, 0],
  );
  if (typeof diagonal === "string")
    failures.push(`minimum-subnormal noncardinal projection: ${diagonal}`);
  else
    vector(
      failures,
      "minimum-subnormal projected orientation",
      diagonal.at(2).u,
      [1 / Math.sqrt(6), 2 / Math.sqrt(6), -1 / Math.sqrt(6)],
      2e-12,
    );
  if (
    typeof AutoMovieViewAxis.jointed(
      [
        [0, 0, 0],
        [0, 0, 10],
      ],
      [],
      [Number.MAX_VALUE, Number.MAX_VALUE, 0],
    ) !== "string"
  )
    failures.push(
      "the declared finite initial-up norm premise was not enforced",
    );
  const curved: AutoMovieViewAxis.IAxis = AutoMovieViewAxis.minimal(
    [
      { station: 0, point: [0, 0, 0] },
      { station: 10, point: [0, 0, 10] },
    ],
    [Number.MIN_VALUE, Number.MIN_VALUE, 0],
    1,
  );
  for (const station of [0, 2, 10])
    vector(
      failures,
      `minimal axis subnormal up ${station}`,
      curved.at(station).u,
      [Math.SQRT1_2, Math.SQRT1_2, 0],
      2e-12,
    );
  const mixed: [number, number, number] = [Number.MIN_VALUE, 0, 1e300];
  const preserved: AutoMovieViewAxis.IAxis = AutoMovieViewAxis.minimal(
    [
      { station: 0, point: [0, 0, 0] },
      { station: 10, point: [0, 0, 10] },
    ],
    mixed,
    1,
  );
  for (const station of [0, 2, 10])
    vector(
      failures,
      `minimal raw normal preservation ${station}`,
      preserved.at(station).u,
      [1, 0, 0],
      2e-12,
    );
  if (
    typeof AutoMovieViewAxis.jointed(
      [
        [0, 0, 0],
        [0, 0, 10],
      ],
      [],
      mixed,
    ) !== "string"
  )
    failures.push(
      "raw projection preservation bypassed the jointed conditioning policy",
    );
  const shortAxis: AutoMovieViewAxis.IAxis | string = AutoMovieViewAxis.jointed(
    [
      [0, 0, 0],
      [Number.MIN_VALUE, Number.MIN_VALUE, 0],
    ],
    [],
    [0, 0, 1],
  );
  if (typeof shortAxis === "string")
    failures.push(`finite minimum-subnormal separation: ${shortAxis}`);
  else
    vector(
      failures,
      "minimum-subnormal segment direction",
      AutoMovieViewAxis.normal(shortAxis.at(0)),
      [Math.SQRT1_2, Math.SQRT1_2, 0],
      2e-12,
    );
  const faintTurn: AutoMovieViewAxis.IAxis | string = AutoMovieViewAxis.jointed(
    [
      [0, 0, 0],
      [1, 0, 0],
      [2, Number.MIN_VALUE, 0],
    ],
    [0.1],
    [0, 0, 1],
  );
  if (typeof faintTurn === "string")
    failures.push(`retained minimum-subnormal turn: ${faintTurn}`);
  else {
    vector(
      failures,
      "minimum-subnormal hinge frame",
      faintTurn.at(1).u,
      [0, 0, 1],
      2e-12,
    );
    const tangent: [number, number, number] = AutoMovieViewAxis.normal(
      faintTurn.at(2),
    );
    if (!tangent.every(Number.isFinite) || !(tangent[1] > 0))
      failures.push(`the admitted nonzero turn was lost: ${tangent}`);
  }
  const shape: [number, number, number][] = [
    [0, 0, 0],
    [1, 0.2, 1],
    [1.4, 1, 2],
    [0.5, 1.5, 3],
  ];
  const reference: AutoMovieViewAxis.IAxis = AutoMovieViewAxis.minimal(
    shape.map(
      (
        point: [number, number, number],
        i: number,
      ): AutoMovieViewAxis.IAxisKnot => ({ station: i, point }),
    ),
    [1, 0, 0],
    0.1,
  );
  for (const magnitude of [1e-160, 1e160]) {
    const scaled: AutoMovieViewAxis.IAxis = AutoMovieViewAxis.minimal(
      shape.map(
        (
          point: [number, number, number],
          i: number,
        ): AutoMovieViewAxis.IAxisKnot => ({
          station: i,
          point: point.map((value: number): number => value * magnitude) as [
            number,
            number,
            number,
          ],
        }),
      ),
      [1, 0, 0],
      0.1,
    );
    for (const station of [0, 0.3, 0.9, 1.4, 2.1, 3]) {
      vector(
        failures,
        `scaled nonplanar RMF u ${magnitude}/${station}`,
        scaled.at(station).u,
        reference.at(station).u,
        2e-11,
      );
      vector(
        failures,
        `scaled nonplanar RMF v ${magnitude}/${station}`,
        scaled.at(station).v,
        reference.at(station).v,
        2e-11,
      );
    }
  }
  const omitted: AutoMovieViewAxis.IAxis | string =
    AutoMovieConstructionViews.frame({
      type: "jointed",
      centres: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0.1, z: 0 },
      ],
      halves: [],
      up: { x: 1, y: 0, z: 0 },
    });
  if (typeof omitted === "string") failures.push(`omitted roll: ${omitted}`);
  else
    vector(
      failures,
      "omitted material rotation",
      omitted.at(17).u,
      [1, 0, 0],
      0,
    );
  if (failures.length !== 0)
    throw new Error(
      `${failures.length} material roll findings:\n${failures.join("\n")}`,
    );
}

/** Finite three-component comparison; NaN and missing components cannot pass a numeric tolerance. */
function vector(
  failures: string[],
  label: string,
  actual: readonly number[],
  expected: readonly number[],
  tolerance: number,
): void {
  if (
    actual.length !== 3 ||
    expected.length !== 3 ||
    ![...actual, ...expected].every(Number.isFinite) ||
    actual.some(
      (value: number, i: number): boolean =>
        Math.abs(value - expected[i]!) > tolerance,
    )
  )
    failures.push(`${label}: ${actual}, expected ${expected}`);
}

/** Independent dot product for projection and signed endpoint rotation. */
function dot(a: readonly number[], b: readonly number[]): number {
  return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
}

/** Independent oriented normal of two three-component vectors. */
function cross(
  a: readonly number[],
  b: readonly number[],
): [number, number, number] {
  return [
    a[1]! * b[2]! - a[2]! * b[1]!,
    a[2]! * b[0]! - a[0]! * b[2]!,
    a[0]! * b[1]! - a[1]! * b[0]!,
  ];
}

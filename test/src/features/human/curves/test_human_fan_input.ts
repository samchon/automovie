import {
  AutoMovieHumanConicLoft,
  AutoMovieHumanConicSection,
} from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieMillimeterMesh,
} from "@automovie/interface";

import { FamilyConicFanFit } from "../../../reference-conics/FamilyConicFanFit";
import { FamilyConicFanInput as Fan } from "../../../reference-conics/FamilyConicFanInput";

/**
 * Made hand and foot fans prepare complete, independent stock and read the
 * engine's coupled source cut. Four or five tubes splay from neighbouring
 * overlapping ellipses at the end plane, their parent oval ends there, and the
 * open fan's raw reference cuts come from a separately constructed box. A child
 * wholly past the plane and another wholly before it expose both independent
 * refusals in one reading. The hand also drives two independent positive root
 * extensions through the elastic fit and checks the assembled split skin.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Uses the adapter's exact end read, indexed observations, and alternate stock guard on four- and five-child fans.
 * @evidence contracts/development/testing.md#independent-expectations The fixture's world centrelines intersect X=0 in ordered intervals. The hand requires three seams and the foot four. Plane and distal observation are known independently from the synthetic geometry.
 * @evidence contracts/development/testing.md#distinguishing-cases Reads both anatomical rosters, the closed side of a measured box plane, a cardinal change with held distal material, and a member that never reaches the plane on either side.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit with no external input, compiler subprocess, browser, or shared files.
 * @evidence contracts/development/common.md#meaningful-documentation Describes the synthetic controls, the parent's boundary and the two independent failure branches.
 */
export function test_human_fan_input(): void {
  const failures: string[] = [];
  const layout: IAutoMovieHumanConicLoft.IFamily["layout"] =
    AutoMovieHumanConicSection.limb(0);
  const radius: number = 10;
  const step: number = (8 * radius) / 5;
  const ellipse = (
    name: string,
    u: number,
    v: number,
    centres: AutoMovieVector3Tuple[],
    knots: number[],
  ): IAutoMovieHumanConicLoft.IFamily => ({
    name,
    centres,
    halves: [],
    up: [0, 1, 0],
    layout,
    knots,
    values: [
      u,
      0,
      0,
      v,
      -u,
      0,
      0,
      -v,
      ...new Array<number>(4).fill(Math.SQRT2 - 1),
    ].map((x: number): number[] => knots.map((): number => x)),
  });
  const reference: IAutoMovieMillimeterMesh = {
    positions: [
      -5, -75, -75, 50, -75, -75, 50, 75, -75, -5, 75, -75, -5, -75, 75, 50,
      -75, 75, 50, 75, 75, -5, 75, 75,
    ],
    indices: [
      0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0,
      4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5,
    ],
  };

  for (const kind of ["hand", "foot"] as const) {
    const count: number = kind === "hand" ? 4 : 5;
    const edge: number = ((count - 1) * step) / 2;
    const host: Fan.IWall = {
      family: ellipse(
        "host",
        radius,
        edge + radius,
        [
          [-40, 0, 0],
          [0, 0, 0],
        ],
        [0, 20, 40],
      ),
      stations: [0, 10, 20, 30, 40],
    };
    const digits: Fan.IDigit[] = Array.from(
      { length: count },
      (_, i: number): Fan.IDigit => {
        const lateral: number = i * step - edge;
        // The centres splay from one common focus, so the wedges widen along each child's own course.
        const slope: number = lateral / (4 * radius);
        const centres: AutoMovieVector3Tuple[] = [
          [-radius, 0, lateral - radius * slope],
          [6 * radius, 0, lateral + 6 * radius * slope],
        ];
        const end: number = 7 * radius * Math.hypot(1, slope);
        const mark: number = end / 2;
        const knots: number[] = [0, end / 4, mark, 0.75 * end, end];
        const family: IAutoMovieHumanConicLoft.IFamily = ellipse(
          `digit.${i}`,
          radius,
          radius,
          centres,
          knots,
        );
        if (i === 0) {
          // The inserted station splits an existing non-linear origin spline without changing the fixed course.
          family.origin = {
            u: knots.map(
              (s: number): number =>
                (radius / 100) * Math.sin((Math.PI * s) / end),
            ),
            v: [0, 0, 0, 0, 0],
          };
          return {
            family,
            stations: [0, end / 8, ...knots.slice(1)],
            mark,
            rail: radius,
          };
        }
        return {
          family,
          stations: knots,
          mark,
          rail: radius,
        };
      },
    );
    const request: Fan.IRequest = { kind, host, digits, count: 48 };
    const prepared = Fan.prepare(request);
    if (
      !(
        Math.hypot(...prepared.plane.point) <= 1e-12 &&
        prepared.plane.normal[0] === 1
      )
    )
      failures.push(`${kind} plane does not coincide with the host's X=0 end`);
    const read: Fan.IReceipt = prepared.read();
    if (
      read.sources.length !== 0 ||
      read.composition !== null ||
      read.derived?.seams.length !== count - 1 ||
      read.derived.cuts.length !== count
    )
      failures.push(
        `${kind} has no ${count}-child native cut: ${read.composition ?? JSON.stringify(read.sources)}`,
      );
    for (const { digit, tail } of prepared.digits) {
      const original: number[] = tail.free.map(
        (k: number): number => tail.initial[0]![k]!,
      );
      original[0]! += radius / 10;
      const values: number[][] = tail.initial.map(
        (field: number[], f: number): number[] =>
          f === 0 ? tail.expand(f, original) : field,
      );
      const fault: string | null = tail.check({ knots: tail.knots, values });
      if (fault !== null)
        failures.push(`${digit.family.name} changed held material: ${fault}`);
    }
    const first = prepared.digits[0]!;
    const ordinates: number[][] = first.tail.initial.map(
      (field: number[]): number[] =>
        first.tail.free.map((index: number): number => field[index]!),
    );
    ordinates[0]![0]! += radius / 10;
    const fixedAxis = AutoMovieHumanConicLoft.axis(first.digit.family);
    const expandedAxis = AutoMovieHumanConicLoft.axis(first.expand(ordinates));
    for (const station of first.digit.stations) {
      const half: number = station / 2;
      const old = fixedAxis.at(half).origin,
        next = expandedAxis.at(half).origin;
      if (
        !(
          Math.hypot(
            old[0]! - next[0]!,
            old[1]! - next[1]!,
            old[2]! - next[2]!,
          ) <= 1e-12
        )
      )
        failures.push(
          `${kind} inserted an ordinate with a moving course at ${half} mm`,
        );
    }
    const changed: Fan.IReceipt = prepared.read(
      new Map([[first.digit.family.name, ordinates]]),
    );
    if (
      changed.sources.length !== 0 ||
      changed.derived?.seams.length !== count - 1
    )
      failures.push(
        `${kind} root ordinate lost its composed cut: ${changed.composition ?? JSON.stringify(changed.sources)}`,
      );
    const incomplete: Fan.IReceipt = prepared.read(
      new Map([[first.digit.family.name, []]]),
    );
    if (
      incomplete.sources.length !== 1 ||
      !incomplete.sources[0]!.refusal.includes(
        "complete finite independent ordinates",
      )
    )
      failures.push(`${kind} accepts an incomplete field vector`);
    const observations = prepared.observe(reference);
    for (const digit of digits) {
      const at = observations
        .get(digit.family.name)
        ?.find(({ station }): boolean => station === digit.mark);
      if (
        at?.retained !== true ||
        !at.loops.some(({ closed }): boolean => closed)
      )
        failures.push(
          `${digit.family.name} has no independently observed retained box cut`,
        );
    }
    const broken: Fan.IDigit[] = digits.map(
      (digit, i: number): Fan.IDigit =>
        i > 1
          ? digit
          : {
              ...digit,
              family: {
                ...digit.family,
                centres: digit.family.centres.map(
                  ([x, y, z]): AutoMovieVector3Tuple => [
                    x + (i === 0 ? 100 : -100),
                    y,
                    z,
                  ],
                ),
              },
            },
    );
    const refusals = Fan.prepare({ ...request, digits: broken }).read();
    if (
      refusals.sources.length !== 2 ||
      refusals.derived !== null ||
      refusals.sources[0]!.name !== digits[0]!.family.name ||
      refusals.sources[1]!.name !== digits[1]!.family.name ||
      !refusals.sources[0]!.refusal.includes("already inside") ||
      !refusals.sources[1]!.refusal.includes("never enters")
    )
      failures.push(
        `${kind} did not observe both independent wall failures: ${JSON.stringify(refusals.sources)}`,
      );
    if (kind === "hand") {
      const tol: number = 1e-7;
      const lower: number = radius + 0.25;
      const upper: number = radius + 0.5;
      const bounds: FamilyConicFanFit.IBound[] = digits
        .slice(0, 2)
        .flatMap(({ family }): FamilyConicFanFit.IBound[] => [
          {
            kind: "inside",
            terms: [{ digit: family.name, field: 0, knot: 0, weight: -1 }],
            maximum: -lower,
          },
          {
            kind: "hard",
            terms: [{ digit: family.name, field: 0, knot: 0, weight: 1 }],
            maximum: upper,
          },
        ]);
      const fit = FamilyConicFanFit.fit(request, {
        tolerance: tol,
        updates: 2,
        restorationUpdates: 0,
        chord: 0.001,
        rows: 4,
        bounds,
      });
      if (typeof fit === "string") failures.push("hand group fit: " + fit);
      else {
        const result = fit.result;
        if (
          result.iteration < 1 ||
          !result.steps.some(
            ({ phase }): boolean => phase === "elastic incidence",
          ) ||
          result.incidence > tol ||
          result.seal?.refusal !== null ||
          !result.seal.realization?.mesh.indices.length
        )
          failures.push(
            `hand fit lacks a changed admitted skin: iteration ${result.iteration}, incidence ${result.incidence}, ${result.stopped}, ${result.seal?.refusal}`,
          );
        for (const { digit, tail } of prepared.digits.slice(0, 2)) {
          const candidate = fit.families.get(digit.family.name)!;
          const ordinate: number = candidate.values[0]![tail.free[0]!]!;
          if (
            !(
              ordinate >= lower - tol &&
              ordinate <= upper &&
              tail.check(candidate) === null
            )
          )
            failures.push(
              `${digit.family.name} failed its nonzero bounded move: ${ordinate}`,
            );
        }
      }
    }
  }
  if (failures.length > 0) throw new Error(failures.join("\n"));
}

import {
  AutoMovieConstructionSplitBand as Band,
  AutoMovieConstructionSeeds as Seeds,
} from "@automovie/engine";
import type {
  IAutoMovieBlendColumn,
  IAutoMovieConstructionSearchSeed,
  IAutoMovieConstructionSeedTrace,
  IAutoMovieConstructionSplitBand,
  IAutoMovieConstructionSplitBandTrace,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Existing strip and seed results survive detached observation of their work.
 *
 * Scenarios:
 *
 * 1. Four parallel ribbons on S(s,t)=(cos(t),s,sin(t)) have common scale1 and a
 *    settled first local pass. Observed and unobserved actual surfaces retain
 *    the analytic point and station derivatives at twelve addresses.
 * 2. A transverse pair of planes meets at [0,0,0]; disjoint parallel planes
 *    terminate on a singular Newton step at gap2. Observation changes neither
 *    returned result and retains each actual termination's update count;
 *    candidate completion records that count as not applicable.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual strip and bounded seed producers with and without optional observers, then reads actual strip surfaces and real event payloads.
 * @evidence contracts/development/testing.md#independent-expectations Unit-spaced parallel ribbons give the linear cross curve with first [0,1,0] and second zero, so the monotonicity predicate holds at1 and all log targets are0. Plane equations give the unique fixed-phase transverse meeting and the disjoint gap2 with a singular Jacobian.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates missing observations from unchanged normal results, common/local scales, detached vector ownership, actual surface jets, a converged seed and a bounded failed seed.
 * @evidence contracts/development/testing.md#execution-ownership Tiny analytic surfaces and existing in-process operators only; no Human, reference, host, whole mesh or foreign-method replacement.
 * @evidence contracts/development/common.md#meaningful-documentation Names the independent equations and the normalized cross versus physical surface derivative distinction.
 */
export function test_construction_operator_trace(): void {
  const failures: string[] = [];
  const close: (
    actual: readonly number[],
    expected: readonly number[],
  ) => boolean = (
    actual: readonly number[],
    expected: readonly number[],
  ): boolean =>
    actual.length === expected.length &&
    actual.every((value: number, index: number): boolean =>
      nclose(value, expected[index]!, 1e-9),
    );
  const zero: [number, number, number] = [0, 0, 0];
  const cylinder: IAutoMovieSolidSurface = {
    name: "cylinder",
    orientation: 1,
    period: 2 * Math.PI,
    domain: [0, 2],
    jet(s: number, t: number): IAutoMovieSolidSurface.IJet {
      return {
        p: [Math.cos(t), s, Math.sin(t)],
        u: [0, 1, 0],
        v: [-Math.sin(t), 0, Math.cos(t)],
        uu: [...zero],
        uv: [...zero],
        vv: [-Math.cos(t), 0, -Math.sin(t)],
      };
    },
  };
  const loop: [number, number, number][] = [0, 1, 2, 3].map(
    (k: number): [number, number, number] => [
      Math.cos((k * Math.PI) / 2),
      0,
      Math.sin((k * Math.PI) / 2),
    ],
  );
  const near: (k: number, length: number) => IAutoMovieBlendColumn["start"] = (
    k: number,
    length: number,
  ): IAutoMovieBlendColumn["start"] => ({
    point: loop[k]!,
    first: [0, length, 0],
    second: [...zero],
  });
  const events: IAutoMovieConstructionSplitBandTrace.Event[] = [];
  const plain: IAutoMovieConstructionSplitBand.IStrip | string = Band.strip(
    "parallel",
    loop,
    near,
    [1, 0, 0],
    { surface: cylinder, station: 1, into: 1 },
    undefined,
    "angle",
    "column",
  );
  const observed: IAutoMovieConstructionSplitBand.IStrip | string = Band.strip(
    "parallel",
    loop,
    near,
    [1, 0, 0],
    { surface: cylinder, station: 1, into: 1 },
    undefined,
    "angle",
    "column",
    [],
    (event: IAutoMovieConstructionSplitBandTrace.Event): void => {
      events.push(event);
    },
  );
  if (typeof plain === "string" || typeof observed === "string")
    failures.push(
      "valid parallel strip refused: " + String(plain) + "/" + String(observed),
    );
  else {
    if (
      !nclose(plain.length, 1) ||
      !nclose(observed.length, 1) ||
      !nclose(observed.scale.applied, 1)
    )
      failures.push("parallel strip changed its unit span/scale");
    for (const station of [0, 0.5, 1])
      for (const phase of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
        const a: IAutoMovieSolidSurface.IJet = plain.surface.jet(
          station,
          phase,
        );
        const b: IAutoMovieSolidSurface.IJet = observed.surface.jet(
          station,
          phase,
        );
        if (
          !close(a.p, [Math.cos(phase), station, Math.sin(phase)]) ||
          !close(a.u, [0, 1, 0]) ||
          !close(a.uu, zero)
        )
          failures.push(
            "plain analytic cylinder mismatch " + station + "/" + phase,
          );
        for (const key of ["p", "u", "v", "uu", "uv", "vv"] as const)
          if (!close(a[key], b[key]))
            failures.push("trace changed actual surface " + key);
      }
  }
  const prepared:
    | Extract<IAutoMovieConstructionSplitBandTrace.Event, { kind: "prepared" }>
    | undefined = events.find(
    (
      event: IAutoMovieConstructionSplitBandTrace.Event,
    ): event is Extract<
      IAutoMovieConstructionSplitBandTrace.Event,
      { kind: "prepared" }
    > => event.kind === "prepared",
  );
  const pass:
    | Extract<
        IAutoMovieConstructionSplitBandTrace.Event,
        { kind: "local-pass" }
      >
    | undefined = events.find(
    (
      event: IAutoMovieConstructionSplitBandTrace.Event,
    ): event is Extract<
      IAutoMovieConstructionSplitBandTrace.Event,
      { kind: "local-pass" }
    > => event.kind === "local-pass",
  );
  if (prepared === undefined)
    failures.push("actual prepared/common-factor event missing");
  else {
    if (
      !nclose(prepared.commonFactor, 1) ||
      prepared.columns.length !== 4 ||
      prepared.backward.length !== 0 ||
      !prepared.factors.every((value: number): boolean => nclose(value, 1))
    )
      failures.push(
        "actual common-factor payload differs from independent unit ribbons",
      );
    if (prepared.columns[0]!.start.point === loop[0])
      failures.push("trace borrowed a live producer vector");
    for (const column of prepared.columns)
      if (
        !close(column.start.first, [0, 1, 0]) ||
        !close(column.end.first, [0, 1, 0]) ||
        !close(column.start.second, zero) ||
        !close(column.end.second, zero)
      )
        failures.push("normalized cross ribbon payload mismatch");
  }
  if (pass === undefined) failures.push("actual local iteration event missing");
  else if (
    pass.pass !== 0 ||
    !pass.settled ||
    !pass.smooth.every((value: number): boolean => nclose(value, 0)) ||
    !pass.field.every((value: number): boolean => nclose(value, 1))
  )
    failures.push("unit local pass did not retain its literal settled state");

  // Plane charts are regular; their fixed-phase meeting has independent equations.
  const part: IAutoMovieSolidSurface = {
    name: "part-plane",
    orientation: 1,
    domain: [-1, 1],
    jet(s: number, t: number): IAutoMovieSolidSurface.IJet {
      return {
        p: [s, 0, t],
        u: [1, 0, 0],
        v: [0, 0, 1],
        uu: [...zero],
        uv: [...zero],
        vv: [...zero],
      };
    },
  };
  for (const parallel of [false, true]) {
    const host: IAutoMovieSolidSurface = {
      name: "host-plane",
      orientation: 1,
      domain: [-1, 1],
      jet(s: number, t: number): IAutoMovieSolidSurface.IJet {
        return {
          p: parallel ? [s, 2, t] : [0, s, t],
          u: parallel ? [1, 0, 0] : [0, 1, 0],
          v: [0, 0, 1],
          uu: [...zero],
          uv: [...zero],
          vv: [...zero],
        };
      },
    };
    const seed: IAutoMovieConstructionSearchSeed = {
      type: "search",
      partFace: part.name,
      hostFace: host.name,
      phase: 0,
      from: 0.25,
      to: 0.75,
    };
    const trace: IAutoMovieConstructionSeedTrace.IEvent[] = [];
    const a: ReturnType<typeof Seeds.create> = Seeds.create(
      seed,
      part,
      [-1, 0, 1],
      host,
      7,
      1e-10,
    );
    const b: ReturnType<typeof Seeds.create> = Seeds.create(
      seed,
      part,
      [-1, 0, 1],
      host,
      7,
      1e-10,
      (event: IAutoMovieConstructionSeedTrace.IEvent): void => {
        trace.push(event);
      },
    );
    if (
      !trace.some(
        (event: IAutoMovieConstructionSeedTrace.IEvent): boolean =>
          event.kind === "candidate" && event.reason !== "start",
      ) ||
      trace.some(
        (event: IAutoMovieConstructionSeedTrace.IEvent): boolean =>
          event.kind === "candidate" &&
          event.reason !== "start" &&
          event.iteration !== null,
      )
    )
      failures.push("candidate completion invented a Newton update count");
    if (
      trace.some(
        (event: IAutoMovieConstructionSeedTrace.IEvent): boolean =>
          event.kind === "meet-end" &&
          (event.iteration === null || event.iteration < 0),
      )
    )
      failures.push("actual Newton termination lost its accepted-update count");
    if (parallel) {
      if (typeof a !== "string" || b !== a || !a.includes("3 local starts"))
        failures.push("parallel planes lost the identical bounded refusal");
      if (
        !trace.some(
          (event: IAutoMovieConstructionSeedTrace.IEvent): boolean =>
            event.kind === "meet-end" &&
            event.reason === "singular-step" &&
            event.gap !== null &&
            nclose(event.gap, 2),
        )
      )
        failures.push("actual singular gap2 termination event missing");
    } else {
      if (
        typeof a === "string" ||
        typeof b === "string" ||
        a.face !== 7 ||
        b.face !== 7 ||
        !close([a.s, a.y, a.theta, a.phi], [0, 0, 0, 0]) ||
        !close([a.s, a.y, a.theta, a.phi], [b.s, b.y, b.theta, b.phi])
      )
        failures.push("transverse planes changed their exact meeting");
      if (
        !trace.some(
          (event: IAutoMovieConstructionSeedTrace.IEvent): boolean =>
            event.kind === "meet-end" &&
            event.reason === "converged" &&
            event.gap !== null &&
            nclose(event.gap, 0),
        )
      )
        failures.push("actual converged gap0 termination event missing");
    }
  }
  TestValidator.predicate(failures.join("\n"), failures.length === 0);
}

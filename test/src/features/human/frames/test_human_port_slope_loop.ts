import { AutoMovieHumanArmscyePort } from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieLoftViewFullSource,
  IAutoMovieViewAxisJet,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Publish the repaired seam and its two jets on a made shoulder with an exact
 * radial chart. The lower end of the circular port has excessive positive
 * slope. The port's upper station remains fixed, so the limiting slope at the
 * new low point is known independently of the fit and the relocated fold reach.
 * The repaired arc crosses the clock origin.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual seam preparation, checks every intervening phase and checks the parent-published world jets.
 * @evidence contracts/development/testing.md#independent-expectations Analytic circular sections and a quadratic radius give closed-form jets. At the low point L equals extent plus reach, so the upper slope limit is 81/16 times reachShare over 1 plus reachShare.
 * @evidence contracts/development/testing.md#distinguishing-cases One finite arc moves onto the upper limit while the curve and both jets of the far arc coincide with the registered seam.
 * @evidence contracts/development/testing.md#execution-ownership Synchronous and independent of reference or authored geometry.
 */
export function test_human_port_slope_loop(): void {
  const count: number = 192;
  const tolerance: number = 0.001;
  const reachShare: number = 1 / 4;
  const zero: AutoMovieVector3Tuple = [0, 0, 0];
  const frame = (station: number): IAutoMovieViewAxisJet.IJet => ({
    value: { origin: [station, 0, 0], u: [0, 1, 0], v: [0, 0, -1] },
    first: { origin: [1, 0, 0], u: zero, v: zero },
    second: { origin: zero, u: zero, v: zero },
  });
  const axis = { at: (station: number) => frame(station).value, jet: frame };
  const radius = (station: number): number =>
    52 + 0.6 * (station - 100) - 0.03 * (station - 100) ** 2;
  const slope = (station: number): number => 0.6 - 0.06 * (station - 100);
  const host: Pick<IAutoMovieLoftViewFullSource.IReader, "domain" | "jet"> = {
    domain: [75, 130],
    jet: (station, phase) => {
      const c: number = Math.cos(phase),
        s: number = Math.sin(phase);
      const r: number = radius(station),
        ds: number = slope(station);
      return {
        p: [station, r * c, -r * s],
        u: [1, ds * c, -ds * s],
        v: [0, -r * s, -r * c],
        uu: [0, -0.06 * c, 0.06 * s],
        uv: [0, -ds * s, -ds * c],
        vv: [0, -r * c, r * s],
      };
    },
  };
  const hostAt = (clock: number) => ({
    point: [100 - 15 * Math.cos(clock), clock] as [number, number],
    first: [15 * Math.sin(clock), 1] as [number, number],
    second: [15 * Math.cos(clock), 0] as [number, number],
  });
  const master = {
    hostAt,
    at: (clock: number) => {
      const { point, first, second } = hostAt(clock);
      const h = host.jet(...point);
      return {
        point: h.p,
        first: h.u.map(
          (x, i) => x * first[0] + h.v[i]!,
        ) as AutoMovieVector3Tuple,
        second: h.u.map(
          (x, i) =>
            x * second[0] +
            h.uu[i]! * first[0] ** 2 +
            2 * h.uv[i]! * first[0] +
            h.vv[i]!,
        ) as AutoMovieVector3Tuple,
      };
    },
    normal: (clock: number): AutoMovieVector3Tuple => {
      const [station, phase] = hostAt(clock).point;
      const ds: number = slope(station),
        scale: number = Math.hypot(1, ds);
      return [-ds / scale, Math.cos(phase) / scale, -Math.sin(phase) / scale];
    },
  };
  const corrected = AutoMovieHumanArmscyePort.place({
    master,
    host,
    hostAxis: axis,
    childAxis: axis,
    count,
    reachShare,
    tolerance,
    owns: () => true,
    address: (p) => ({
      station: p[0],
      phase: Math.atan2(-p[2], p[1]),
      radius: Math.hypot(p[1], p[2]),
    }),
  });
  const low: number = corrected.master.hostAt(0).point[0];
  const expected: number =
    100 + (0.6 - ((81 / 16) * reachShare) / (1 + reachShare)) / 0.06;
  TestValidator.predicate(
    "the low point reaches the analytic upper slope limit",
    () =>
      nclose(low, expected, 0.004) &&
      corrected.arcs.length === 1 &&
      corrected.arcs[0]!.max > 0,
  );
  const sameJets = (
    a: ReturnType<typeof master.at>,
    b: ReturnType<typeof master.at>,
  ): boolean =>
    (["point", "first", "second"] as const).every((key): boolean =>
      a[key].every((x, i): boolean => nclose(x, b[key][i]!, 1e-12)),
    );
  TestValidator.predicate(
    "the original parent jets are retained outside the fold reach",
    () => sameJets(master.at(Math.PI), corrected.master.at(Math.PI)),
  );
  TestValidator.predicate(
    "the moved parent jets agree across the clock origin",
    () => sameJets(corrected.master.at(0), corrected.master.at(2 * Math.PI)),
  );

  const reach: number = corrected.extent * reachShare;
  for (let i: number = 0; i < 4 * count; ++i) {
    const clock: number = (2 * Math.PI * (i + 0.5)) / (4 * count);
    const q = corrected.master.hostAt(clock);
    const station: number = q.point[0];
    const a: number = slope(station),
      length: number = corrected.mark - station;
    TestValidator.predicate(
      "the analytic slope and phase at " + i,
      () =>
        a > (-2.5 * radius(station)) / length &&
        a <= ((81 / 16) * reach) / length &&
        q.first[1] > 0,
    );
  }
}

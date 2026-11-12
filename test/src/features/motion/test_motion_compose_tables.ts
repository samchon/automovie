import {
  type IAutoMovieRandom,
  createAutoMovieRandom,
} from "@automovie/engine";
import {
  AutoMovieMotionHumanClearance,
  AutoMovieMotionHumanCourse,
  AutoMovieMotionHumanInterrupt,
  AutoMovieMotionHumanRange,
  AutoMovieMotionHumanTarget,
  AutoMovieMotionHumanTiming,
  AutoMovieMotionHumanVariation,
  AutoMovieMotionHumanVariationDraw,
  AutoMovieMotionManner,
  type IHumanBody,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The named tables of the composition layer hold what their documents cite
 * and relate as their documents say, read through the functions that use
 * them.
 *
 * Cited values are checked against the citation: McIntosh, Mon-Williams and
 * Tresilian (2018, table 1) give a reach-to-grasp time of `-306.07 + 297.27
 * lg A + 0.65 W` milliseconds for an amplitude `A` and a width `W` in
 * millimetres, fitted from 170 mm; Roberts (2018) steps a one-, two- and
 * three-component recurrence by the inverse roots of `x^2 = x + 1`, `x^3 = x
 * + 1` and `x^4 = x + 1`. Provisional values are held to the relations their
 * documents state: a stated formula, an order, a unit, or one table being
 * another's multiple.
 *
 * Scenarios:
 * 1. Timing: the free rule is `0.25 + 0.5 D`, the aimed rule McIntosh's fit
 *    with its floor at 170 mm, and the pauses rise from none, `brief` being
 *    an interrupt's smooth blend.
 * 2. Interrupt blends rise from a reflex to a voluntary change; range levels
 *    rise within (0, 1) and `half` is half the range.
 * 3. Course knots are half a frame of 24 frames a second apart and corrected
 *    at least once; a clearing path sampled every `SPACING` clears a post
 *    three samples wide to within half the corner radius.
 * 4. Target heights rise from the floor to overhead on the lightest and the
 *    heaviest body, `overhead` standing `OVERHEAD` arms above the shoulder
 *    with `OVERHEAD` in (0, 1]; a nudge of `NUDGE` arms is taken and one
 *    past it refused; `away` points from the place to the body over the
 *    floor, and back along the heading when the place is overhead.
 * 5. Manner: a bound flow (+1) holds `1 + HOLD` times the tempo and a free
 *    one `1 - HOLD`; a full variation offsets the tempo and the extent by at
 *    most their `BOUNDS` (the novice's at proficiency 0, the elite's at 1);
 *    the tempo's bounds are `TRUNCATE` spreads of the pause variability.
 * 6. Variation: the spread across an arrival is narrower than along it; no
 *    spread widens with skill, a slot the goal depends on narrows by at
 *    least 2.5 and one it does not by at most 1.5; a fixed bound is twice
 *    the novice's spread; `MARGIN` lies in (0, 1); `ALPHA` is Roberts'.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads each table through its user where one is public (the timing rules, `place`, `height`, `away`, `resolve`, `path`); a coefficient off its citation, a rule using another constant or a relation broken fails.
 * @evidence contracts/development/testing.md#independent-expectations Cited coefficients are typed from the citation, the recurrence's steps are checked against their defining polynomials, and every other expectation is a relation stated in a document.
 * @evidence contracts/development/testing.md#distinguishing-cases Below and above the fit's floor, bound and free flow at both ends of skill, a nudge at and past its bound, a place beside and above the body, two bodies.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on two prepared bodies; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the citations, how provisional values are held and the 6 scenarios.
 */
export function test_motion_compose_tables(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const close = (a: number, b: number, e: number = 1e-9): boolean =>
    Math.abs(a - b) <= e;
  const T = AutoMovieMotionHumanTiming;

  // 1. Timing.
  for (const d of [0, 0.3, 1.2])
    complaints.check(
      `the free rule over ${d} m is 0.25 + 0.5 D`,
      close(T.transport(d), 0.25 + 0.5 * d) &&
        close(T.BASE + T.RATE * d, T.transport(d)),
    );
  const mcintosh = (mm: number, wmm: number): number =>
    (-306.07 + 297.27 * Math.log10(mm) + 0.65 * wmm) / 1000;
  complaints.check(
    "the aimed rule is McIntosh et al.'s fit",
    close(T.aimed(0.3, 0.05), mcintosh(300, 50), 1e-6) &&
      close(T.aimed(0.6, 0), mcintosh(600, 0), 1e-6) &&
      close(T.INTERCEPT, -0.30607) &&
      close(T.AMPLITUDE, 0.29727) &&
      close(T.WIDTH * 0.001, 0.00065),
  );
  complaints.check(
    "the fit is not extrapolated below 170 mm",
    close(T.SHORTEST, 0.17) &&
      close(T.aimed(0.05, 0.02), mcintosh(170, 20), 1e-6),
  );
  complaints.check(
    "the pauses rise from none and a brief one is a smooth blend",
    T.PAUSES.none === 0 &&
      T.PAUSES.none < T.PAUSES.brief &&
      T.PAUSES.brief < T.PAUSES.beat &&
      T.PAUSES.beat < T.PAUSES.long &&
      T.PAUSES.brief === AutoMovieMotionHumanInterrupt.BLENDS.smooth,
  );

  // 2. Blends and levels.
  const B = AutoMovieMotionHumanInterrupt.BLENDS;
  complaints.check(
    "a reflex blends faster than a defence, and a defence than a voluntary change",
    0 < B.reflex && B.reflex < B.quick && B.quick < B.smooth,
  );
  const L = AutoMovieMotionHumanRange.LEVELS;
  complaints.check(
    "the levels rise within (0, 1) and half is half",
    0 < L.slight &&
      L.slight < L.light &&
      L.light < L.half &&
      L.half < L.deep &&
      L.deep < L.full &&
      L.full < 1 &&
      L.half === 0.5,
  );

  // 3. Course and clearance.
  complaints.check(
    "course knots are half a frame apart and corrected",
    close(AutoMovieMotionHumanCourse.STEP, 1 / (2 * 24)) &&
      Number.isInteger(AutoMovieMotionHumanCourse.CORRECTIONS) &&
      AutoMovieMotionHumanCourse.CORRECTIONS >= 1,
  );
  const C = AutoMovieMotionHumanClearance;
  const post: number = 3 * C.SPACING;
  const path = C.path({ z: 0, y: 0 }, { z: 0.3, y: 0 }, (z: number): number =>
    z >= 0.15 && z <= 0.15 + post ? 0.2 : 0,
  );
  let over: number = Infinity;
  for (let i: number = 0; i <= 4000; i++) {
    const p = path(i / 4000);
    if (p.z >= 0.15 && p.z <= 0.15 + post) over = Math.min(over, p.y);
  }
  complaints.check(
    `a post ${(post * 1000).toFixed(0)} mm wide is cleared at ${over.toFixed(4)} m, within half the corner radius of 0.2 m`,
    C.SPACING > 0 && over >= 0.2 - C.RADIUS / 2 - 1e-9,
  );

  // 4. Target.
  const G = AutoMovieMotionHumanTarget;
  for (const name of ["f-small", "m-large"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const m = body.measure;
    const heights: number[] = G.HEIGHTS.map((h) => G.height(body, h));
    complaints.check(
      `${name}: heights rise from the floor to overhead (${heights.map((h) => h.toFixed(3)).join(", ")})`,
      heights[0] === 0 &&
        heights.every((h: number, i: number): boolean =>
          i === 0 ? true : h > heights[i - 1]!,
        ),
    );
    complaints.check(
      `${name}: overhead stands OVERHEAD arms above the shoulder`,
      G.OVERHEAD > 0 &&
        G.OVERHEAD <= 1 &&
        close(
          (G.height(body, "overhead") * m.stature - m.shoulderHeight) /
            (m.upperArm + m.forearm),
          G.OVERHEAD,
        ),
    );
    const base: AutoMovieMotionHumanTarget.IGrid = {
      height: "chest",
      lateral: "inside",
      distance: "mid",
    };
    const plain = G.place(body, "right", base);
    const nudged = G.place(body, "right", {
      at: base,
      nudge: { up: G.NUDGE },
    });
    complaints.check(
      `${name}: a nudge of NUDGE arms up is taken in statures`,
      close(
        (nudged.height - plain.height) * m.stature,
        G.NUDGE * (m.upperArm + m.forearm),
      ),
    );
    complaints.refuses(`${name}: a nudge past NUDGE`, () =>
      G.place(body, "right", {
        at: base,
        nudge: { forward: G.NUDGE + 0.01 },
      }),
    );
  }
  const away = G.away(
    { point: { x: 0, y: 1, z: 1 } },
    { x: 0.5, y: 1.4, z: 1 },
    0,
  );
  const below = G.away(
    { point: { x: 0.2, y: 2.5, z: 0.1 } },
    { x: 0.2, y: 1.4, z: 0.1 },
    90,
  );
  complaints.check(
    "away points from the place to the body over the floor, and back along the heading from overhead",
    close(away.x, 1) &&
      close(away.y, 0) &&
      close(away.z, 0) &&
      close(below.x, -1) &&
      close(below.y, 0) &&
      close(below.z, 0),
  );

  // 5. Manner.
  // A real stream whose uniform draws are pinned to one value, so the
  // variation's extreme offsets can be reached.
  const random = (u: number): IAutoMovieRandom => ({
    ...createAutoMovieRandom("00000000000000aa"),
    float: (): number => u,
  });
  const M = AutoMovieMotionManner;
  for (const flow of [1, -1]) {
    const r = M.resolve({ effort: { flow } }, random(0.5));
    complaints.check(
      `a flow of ${flow} holds ${(r.hold / r.tempo).toFixed(4)} times the tempo`,
      close(r.hold / r.tempo, 1 + M.HOLD * flow),
    );
  }
  for (const [proficiency, index] of [
    [0, 0],
    [1, 1],
  ] as const)
    for (const u of [0, 1 - 1e-12]) {
      const r = M.resolve({ variation: 1, proficiency }, random(u));
      const tempo: number = M.BOUNDS.tempo[index];
      const extent: number = M.BOUNDS.extent[index];
      complaints.check(
        `a full variation at proficiency ${proficiency} offsets the tempo by ${(r.tempo - 1).toFixed(4)} within ${tempo} and the extent by ${(r.extent - 1).toFixed(4)} within ${extent}`,
        Math.abs(r.tempo - 1) <= tempo + 1e-9 &&
          Math.abs(r.extent - 1) <= extent + 1e-9 &&
          Math.abs(r.tempo - 1) >= tempo - 1e-6,
      );
    }
  const V = AutoMovieMotionHumanVariation;
  const D = AutoMovieMotionHumanVariationDraw;
  complaints.check(
    "the tempo's bounds are TRUNCATE spreads of the pause variability",
    close(M.BOUNDS.tempo[0], D.TRUNCATE * V.SPREADS.pause[0]) &&
      close(M.BOUNDS.tempo[1], D.TRUNCATE * V.SPREADS.pause[1]),
  );

  // 6. Variation.
  complaints.check(
    "the spread across an arrival is narrower than along it",
    V.ACROSS > 0 && V.ACROSS < 1,
  );
  for (const [slot, [novice, elite]] of Object.entries(V.SPREADS)) {
    const ratio: number = novice / elite;
    const free: boolean = ["swivel", "bend", "curvature"].includes(slot);
    complaints.check(
      `${slot} narrows by ${ratio.toFixed(2)} from novice to elite`,
      elite > 0 && (free ? ratio >= 1 && ratio <= 1.5 : ratio >= 2.5),
    );
  }
  for (const [slot, bound] of Object.entries(V.BOUNDS))
    complaints.check(
      `the fixed bound of ${slot} is twice the novice's spread`,
      close(bound, 2 * V.SPREADS[slot as keyof typeof V.BOUNDS][0]),
    );
  complaints.check("the margin lies in (0, 1)", D.MARGIN > 0 && D.MARGIN < 1);
  const root = (power: number): number => {
    let x: number = 1.5;
    for (let i: number = 0; i < 100; i++)
      x -= (x ** power - x - 1) / (power * x ** (power - 1) - 1);
    return x;
  };
  complaints.check(
    "the recurrence's steps are Roberts'",
    D.ALPHA[0]!.length === 0 &&
      [1, 2, 3].every((count: number): boolean =>
        D.ALPHA[count]!.every((a: number, k: number): boolean =>
          close(a, root(count + 1) ** -(k + 1), 1e-12),
        ),
      ),
  );
  complaints.assert("every table holds what its document states");
}

import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanPerformance, IAutoMovieMotionHumanRefusal, IAutoMovieMotionHumanSignature, IAutoMovieResolveCenterOfMass, AutoMovieHumanoidRegion, IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieGravity,
  Vector3,
  integrateMotionTrajectory,
  resolveAutoMovieCenterOfMass,
  resolveAutoMovieMomentum,
} from "@automovie/engine";

import { HumanChain, HumanFoot, HumanForceExchange, HumanPerformance, HumanRefusal, HumanSignature } from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A force exchanged through grips (#3439): a pull draws the partner's
 * centre toward the base's edge along it and breaks the base at the instant
 * the pendulum law gives; a resisted pull keeps the centre over the base;
 * a throw carries the partner about the thrower's fulcrum, releases it and
 * flies it with conserved angular momentum; an outcome the forces cannot
 * produce is refused.
 *
 * Bounds: the base breaks within one integrator step of the instant the
 * pull was sized for (#3439's acceptance), the centre keeps its distance
 * from the fulcrum within 1 cm while it lies on it (#3439), and the angular
 * momentum in flight holds within 1 % of its value at release (the
 * campaign's flight bound, `test_human_motion_core_flight`). The pull that
 * breaks a base at a declared instant is `HumanForceExchange.breaking`'s law
 * (the linear inverted pendulum under a constant force, Hof, Gazendam and
 * Sinke 2005); the base, the centre and the extrapolated centre are read
 * from the displayed bodies.
 *
 * Scenarios, the partner b standing 0.3 s and then performing `perturb`
 * with the author's outcome, the pull a sustained force on b's left chest
 * and right elbow (a collar and sleeve grip) from 0.3 s:
 * 1. Off-balancing, for b the average man and the small woman, pulled
 *    forward and to its left, the pull sized to break the base one
 *    pendulum time constant `1 / ω` after it starts: b's displayed centre
 *    moves along the pull at every twentieth of that span, and its
 *    displayed extrapolated centre reaches the feet's base's edge (its
 *    margin no more than its own travel over one sampling interval) within
 *    one integrator step of the declared instant; the plan's `kuzushi` event
 *    lies there too.
 * 2. Resist, the same bodies and directions, a pull of half the force the
 *    base's extent behind can resist: b's displayed centre stays inside its
 *    base throughout the pull.
 * 3. A pull of twice that force asked to be resisted is refused as a
 *    `parameter` refusal on `outcome` whose feasible maximum is the force
 *    that can be resisted.
 * 4. A yield whose pull ends before the base breaks is refused with a
 *    feasible minimum force.
 * 5. A throw, the large man thrown over the small woman's lower back by a
 *    pull of his own weight: between `kuzushi` and `release` his centre
 *    keeps its distance from the fulcrum within 1 cm; his displayed centre
 *    leaves the base; the bearing window on the thrower ends at `release`;
 *    `kuzushi`, `release` and `land` come in that order; and his angular
 *    momentum holds within 1 % of its value at release at every tenth of the
 *    flight.
 * 6. A throw with no fulcrum is refused as a `participant` refusal on
 *    `fulcrum`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the pull through the public performance with the force input and reads the displayed bodies and the plan's windows and events; a centre that does not travel, a base broken at the wrong instant, a resisted pull that topples, a throw off its fulcrum or with drifting momentum, or an impossible outcome accepted fails with its numbers.
 * @evidence contracts/development/testing.md#independent-expectations The instant, the fulcrum bound and the momentum bound are #3439's and the campaign's; the base and the centres are read from the displayed bones by the engine's own measures, never from the response's plan.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, two pull directions, three outcomes, three refusals and one throw.
 * @evidence contracts/development/testing.md#execution-ownership Prepares three polygon men and builds short performances in memory; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, each bound with its source and the 6 scenarios.
 */
export function test_human_motion_force_exchange(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const START: number = 0.3;
  const STEP: number = integrateMotionTrajectory.STEP;
  const SITES: readonly AutoMovieHumanoidRegion[] = ["chestLeft", "elbowRight"];
  const perform = (
    bodies: Readonly<Record<"a" | "b", IAutoMovieMotionHumanBody>>,
    params: object,
    force: number,
    direction: IAutoMovieVector3,
    span: number,
    thrower: { at: IAutoMovieVector3; yaw: number } | null = null,
  ): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "exchange",
      performers: [
        {
          subject: "b",
          body: bodies.b,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        ...(thrower === null
          ? []
          : [
              {
                subject: "a",
                body: bodies.a,
                at: thrower.at,
                yaw: thrower.yaw,
                proficiency: { level: "trained" as const },
              },
            ]),
      ],
      composition: (thrower === null
        ? HumanChain.subject("b")
            .stand({ seconds: START })
            .act("perturb", params as never)
        : HumanChain.subject("a")
            .stand({ seconds: START + 3 })
            .with(
              HumanChain.subject("b")
                .stand({ seconds: START })
                .act("perturb", params as never),
            )
      ).node,
      forces: HumanForceExchange.pull({
        subject: "b",
        sites: SITES,
        direction,
        force,
        from: START,
        to: START + span,
      }),
    });
  const standing = (body: IAutoMovieMotionHumanBody) => {
    const film: IAutoMovieMotionHumanPerformance = new HumanPerformance({
      seed: "exchange",
      performers: [
        {
          subject: "b",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("b").stand({ seconds: START }).node,
    });
    const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
      film,
      "b",
      body,
      0,
    );
    return {
      centre: HumanSignature.centre(reader, START),
      base: HumanFoot.base(body, HumanSignature.bones(reader, START)),
    };
  };

  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const model: IAutoMovieResolveCenterOfMass.IModel =
      resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
    const length: number = resolveAutoMovieCenterOfMass.pendulum(
      body.measure.hipHeight,
    );
    const w: number = resolveAutoMovieCenterOfMass.frequency(length);
    const still = standing(body);
    for (const [label, direction] of [
      ["forward", { x: 0, y: 0, z: 1 }],
      ["to its left", { x: 1, y: 0, z: 0 }],
    ] as const) {
      const cell: string = `${name} pulled ${label}`;
      const edge: number = HumanForceExchange.edge(
        still.centre,
        direction,
        still.base,
      );
      const declared: number = 1 / w;
      const force: number = HumanForceExchange.breaking({
        mass: model.mass,
        frequency: w,
        edge,
        seconds: declared,
      });

      // 1. Off-balancing.
      const film: IAutoMovieMotionHumanPerformance = perform(
        { a: body, b: body },
        { outcome: "yield" },
        force,
        direction,
        2 * declared,
      );
      const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
        film,
        "b",
        body,
        0,
      );
      const along = (t: number): number =>
        Vector3.dot(
          Vector3.subtract(HumanSignature.centre(reader, t), still.centre),
          direction,
        );
      let previous: number = along(START);
      for (let k: number = 1; k <= 20; k++) {
        const t: number = START + (declared * k) / 20;
        const now: number = along(t);
        all.check(
          `${cell}: at ${t.toFixed(3)} s the centre is ${(now * 1000).toFixed(1)} mm along the pull, past ${(previous * 1000).toFixed(1)} mm expected`,
          now > previous,
        );
        previous = now;
      }
      // The instant the extrapolated centre reaches the base's edge: the
      // first sample whose margin is no more than the extrapolated centre
      // travels in one sampling interval, the resolution of the reading.
      const xcom = (t: number): IAutoMovieVector3 => {
        const c: IAutoMovieVector3 = HumanSignature.centre(reader, t);
        const v: IAutoMovieVector3 = Vector3.scale(
          Vector3.subtract(c, HumanSignature.centre(reader, t - STEP / 4)),
          4 / STEP,
        );
        return resolveAutoMovieCenterOfMass.extrapolate(c, v, length);
      };
      let crossed: number | null = null;
      for (
        let t: number = START + STEP;
        t <= START + declared + 2 * STEP && crossed === null;
        t += STEP / 4
      ) {
        const xi: IAutoMovieVector3 = xcom(t);
        const travel: number = Vector3.length(
          Vector3.subtract(xi, xcom(t - STEP / 4)),
        );
        const margin: number = resolveAutoMovieCenterOfMass.margin(
          xi,
          HumanFoot.base(body, HumanSignature.bones(reader, t)),
        );
        if (margin <= travel) crossed = t;
      }
      // Where the displayed base's edge lies then, against the standing one.
      const shown = (t: number): number =>
        HumanForceExchange.edge(
          still.centre,
          direction,
          HumanFoot.base(body, HumanSignature.bones(reader, t)),
        );
      const moved: string =
        crossed === null
          ? ""
          : `; the base's edge then lies ${(shown(crossed) * 1000).toFixed(1)} mm along the pull, ${(edge * 1000).toFixed(1)} mm standing`;
      all.check(
        `${cell}: the extrapolated centre reaches the base's edge at ${crossed === null ? "no instant" : `${crossed.toFixed(4)} s`}, within ${STEP.toFixed(4)} s of ${(START + declared).toFixed(4)} s expected${moved}`,
        crossed !== null && Math.abs(crossed - (START + declared)) <= STEP,
      );
      const plan = film.segments("b")[film.segments("b").length - 1]!.plan;
      const event = plan.events.find((e) => e.name === "kuzushi");
      all.check(
        `${cell}: the kuzushi event at ${event === undefined ? "none" : (event.share * plan.duration).toFixed(4)} s into the response, ${declared.toFixed(4)} within one step expected`,
        event !== undefined &&
          Math.abs(event.share * plan.duration - declared) <= STEP,
      );

      // 2 and 3. Resist.
      const behind: number = HumanForceExchange.edge(
        still.centre,
        Vector3.scale(direction, -1),
        still.base,
      );
      const grip: number =
        SITES.map(
          (s: AutoMovieHumanoidRegion): number =>
            HumanSignature.region(
              HumanSignature.of(film, "b", body, 0),
              s,
              START,
            ).y,
        ).reduce((a: number, b: number): number => a + b, 0) / SITES.length;
      const limit: number =
        (model.mass * AutoMovieGravity.STANDARD * behind) / grip;
      const resisted: IAutoMovieMotionHumanPerformance = perform(
        { a: body, b: body },
        { outcome: "resist" },
        limit / 2,
        direction,
        1,
      );
      const held: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
        resisted,
        "b",
        body,
        0,
      );
      let worst: number = Number.POSITIVE_INFINITY;
      for (const t of HumanSignature.times(START, START + 1, 20))
        worst = Math.min(
          worst,
          resolveAutoMovieCenterOfMass.margin(
            HumanSignature.centre(held, t),
            HumanFoot.base(body, HumanSignature.bones(held, t)),
          ),
        );
      all.check(
        `${cell}, resisting half the limit: the centre's least margin inside the base is ${(worst * 1000).toFixed(1)} mm, inside expected`,
        worst >= 0,
      );
      let refusal: IAutoMovieMotionHumanRefusal | null = null;
      try {
        perform(
          { a: body, b: body },
          { outcome: "resist" },
          2 * limit,
          direction,
          1,
        ).segments("b");
      } catch (error) {
        if (error instanceof HumanRefusal) refusal = error;
        else throw error;
      }
      all.check(
        `${cell}, resisting twice the limit: a parameter refusal on outcome with the maximum ${limit.toFixed(0)} N expected, read ${refusal?.message ?? "none"}`,
        refusal !== null &&
          refusal.kind === "parameter" &&
          refusal.axis === "outcome" &&
          refusal.feasible?.kind === "range" &&
          refusal.feasible.maximum !== null &&
          Math.abs(refusal.feasible.maximum - limit) <= 1e-6 * limit,
      );

      // 4. A pull that ends before the base breaks.
      refusal = null;
      try {
        perform(
          { a: body, b: body },
          { outcome: "yield" },
          force,
          direction,
          declared / 2,
        ).segments("b");
      } catch (error) {
        if (error instanceof HumanRefusal) refusal = error;
        else throw error;
      }
      all.check(
        `${cell}, a pull of half the span: a parameter refusal on outcome with a feasible minimum force expected, read ${refusal?.message ?? "none"}`,
        refusal !== null &&
          refusal.kind === "parameter" &&
          refusal.axis === "outcome" &&
          refusal.feasible?.kind === "range" &&
          refusal.feasible.minimum !== null &&
          refusal.feasible.minimum > force,
      );
    }
  }

  // 5. The throw.
  const bodies: Record<"a" | "b", IAutoMovieMotionHumanBody> = {
    a: motionHumanBody("f-small"),
    b: motionHumanBody("m-large"),
  };
  const model: IAutoMovieResolveCenterOfMass.IModel =
    resolveAutoMovieCenterOfMass(bodies.b.skeleton, bodies.b.profile);
  const forward: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  let thrown: IAutoMovieMotionHumanPerformance | null = null;
  try {
    thrown = perform(
      bodies,
      { outcome: "thrown", by: "a", fulcrum: "lowerBack" },
      model.mass * AutoMovieGravity.STANDARD,
      forward,
      2,
      { at: { x: 0, y: 0, z: bodies.b.measure.footLength }, yaw: 0 },
    );
    thrown.segments("b");
  } catch (error) {
    all.check(
      `the large man thrown over the small woman's lower back: planned expected, refused with ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
    thrown = null;
  }
  if (thrown !== null) {
    const segments = thrown.segments("b");
    const response = segments[segments.length - 1]!;
    const plan = response.plan;
    const at = (name: string): number | null => {
      const e = plan.events.find((x) => x.name === name);
      return e === undefined ? null : response.start + e.share * plan.duration;
    };
    const kuzushi: number | null = at("kuzushi");
    const release: number | null = at("release");
    const land: number | null = at("land");
    all.check(
      `the throw's events kuzushi ${kuzushi}, release ${release}, land ${land}: in that order expected`,
      kuzushi !== null &&
        release !== null &&
        land !== null &&
        kuzushi < release &&
        release <= land,
    );
    const bearing: IAutoMovieMotionHumanContactWindow | undefined = plan.contacts.find(
      (w: IAutoMovieMotionHumanContactWindow): boolean =>
        w.support.kind === "person" && w.support.subject === "a",
    );
    all.check(
      `the throw's bearing window on the thrower ends at share ${bearing?.to ?? "none"}, the release's ${release === null ? "none" : ((release - response.start) / plan.duration).toFixed(4)} expected`,
      bearing !== undefined &&
        release !== null &&
        Math.abs(bearing.to - (release - response.start) / plan.duration) <=
          1e-9,
    );
    const partner: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
      thrown,
      "b",
      bodies.b,
      0,
    );
    const thrower: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
      thrown,
      "a",
      bodies.a,
      0,
    );
    if (kuzushi !== null && release !== null && land !== null) {
      const fulcrum: IAutoMovieVector3 = HumanSignature.region(
        thrower,
        "lowerBack",
        kuzushi,
      );
      const distances: number[] = HumanSignature.times(
        kuzushi,
        release,
        60,
      ).map((t: number): number =>
        Vector3.length(
          Vector3.subtract(HumanSignature.centre(partner, t), fulcrum),
        ),
      );
      const spread: number = Math.max(...distances) - Math.min(...distances);
      all.check(
        `the thrown centre's distance to the fulcrum varies by ${(spread * 1000).toFixed(1)} mm on it, 10 mm at most expected`,
        spread <= 0.01,
      );
      const outside: boolean = HumanSignature.times(kuzushi, land, 60).some(
        (t: number): boolean =>
          resolveAutoMovieCenterOfMass.margin(
            HumanSignature.centre(partner, t),
            HumanFoot.base(bodies.b, HumanSignature.bones(partner, t)),
          ) < 0,
      );
      all.check("the thrown centre leaves its base", outside);
      const momentum = (t: number): IAutoMovieVector3 =>
        resolveAutoMovieMomentum(
          model,
          thrown!.bones("b", t - 1e-3),
          thrown!.bones("b", t + 1e-3),
          2e-3,
        ).angular;
      const first: IAutoMovieVector3 = momentum(
        release + 0.05 * (land - release),
      );
      for (let k: number = 1; k <= 9; k++) {
        const t: number = release + ((land - release) * k) / 10;
        const drift: number =
          Vector3.length(Vector3.subtract(momentum(t), first)) /
          Vector3.length(first);
        all.check(
          `the thrown body's angular momentum drifts ${(100 * drift).toFixed(2)} % at ${k}/10 of the flight, 1 % at most expected`,
          drift <= 0.01,
        );
      }
    }
  }

  // 6. A throw with no fulcrum.
  let missing: IAutoMovieMotionHumanRefusal | null = null;
  try {
    perform(
      bodies,
      { outcome: "thrown", by: "a" },
      model.mass * AutoMovieGravity.STANDARD,
      forward,
      2,
      { at: { x: 0, y: 0, z: bodies.b.measure.footLength }, yaw: 0 },
    ).segments("b");
  } catch (error) {
    if (error instanceof HumanRefusal) missing = error;
    else throw error;
  }
  all.check(
    `a throw with no fulcrum: a participant refusal on fulcrum expected, read ${missing?.message ?? "none"}`,
    missing !== null &&
      missing.kind === "participant" &&
      missing.axis === "fulcrum",
  );
  all.assert(
    "a force exchanged through grips moves the partner as its outcome says",
  );
}

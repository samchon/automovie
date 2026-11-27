import { AutoMovieEnginePhysicalBalance, type AutoMovieEnginePhysicalBalanceTypes } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../internal/PhysicalTolerance";

/** The step either side of a branch a sample is read at, seconds. */
const STEP: number = 1e-7;

/**
 * How far the span may jump across a branch, metres: its rate of order a metre
 * per second over the two steps either side, with room for the branch's corner,
 * under 1e-4.
 */
const JOIN: number = 1e-4;

/**
 * A biped's push response is prepared once and sampled as a pure function of
 * time (`preparePhysicalDisturbanceSpan`): its branch points sit where the
 * closed forms put them and its curves join across them.
 *
 * Scenarios, two 0.24 x 0.1 m feet 0.2 m apart facing +z, the centre of mass at
 * 0.9 m, omega = sqrt(9.81 / 0.9), the authored capture point at rest at the
 * origin, a 0.6 m step and a forward push of 1.2 m/s, xi0 = 1.2 / omega:
 *
 * 1. Purity: the two-step span sampled at 16 times in shuffled order gives exactly
 *    the samples in ascending order; before the push it gives the state at the
 *    push.
 * 2. One step, no reaction: with the centre of pressure on the stance foot's front
 *    edge p = 0.12 m, the capture point at the quickest swing's landing, p +
 *    (xi0 - p) e^(omega 0.15), lies within the reach, so one step captures. The
 *    branches are push, trigger at the push, touchdown, standing and end, and
 *    the footstep is viable.
 * 3. Two steps, a 0.1 s reaction: the pivot held on the front edge carries the
 *    capture point to p + (xi0 - p) e^(omega 0.1) by the trigger, and on to
 *    beyond the reach even at the quickest swing's landing, so one step cannot
 *    capture (Koolen et al., Eq. 25). The branches are push, trigger at the
 *    push plus the reaction, touchdown, standing, a second trigger, touchdown
 *    and standing, and end; never a third step.
 * 4. Timing, both spans: each touchdown follows its trigger by a swing within the
 *    reference's [0.15, 0.6] s (`WalkingSingleSupportState`), each standing
 *    comes at least the 0.25 s transfer after its touchdown, and the end 0.25 s
 *    after the last standing.
 * 5. Double support: the pivot is held (saturated) on the support and the capture
 *    point diverges from it as cmp + (xi0 - cmp) e^(omega t) (Hof et al. 2005,
 *    Eq. 3; IHMC `CapturePointTools`).
 * 6. Continuity, both spans: capture point, centre of mass and its velocity join
 *    across every branch.
 * 7. After the end, both spans: the capture point's error from the authored point
 *    at rest decays as e^(-omega K_p t), K_p = 2 (IHMC's proportional law,
 *    Zulu's gain), the pivot free of the support.
 * 8. A 0.05 m/s push, its capture point inside the support and within 0.05 m of
 *    the plan, takes no step: no trigger and no footstep.
 * 9. A 3 m/s push carries the capture point past the reach even at the quickest
 *    swing's landing: its footstep is not viable, a fall.
 * 10. At every sampled time the floor's reaction is the weight m g up and m omega^2
 *     (c - cmp) across at the pivot (the linear inverted pendulum), shared
 *     among the planted feet summing to one, none on a swinging foot.
 * 11. Resume: the span prepared again from the same stored input gives the same
 *     samples bit for bit.
 * 12. Any number of contacts through one path: 2, 3, 4, 6 and 8 soles, 0.1 x 0.06
 *     m, on a 0.3 m ring (a 0.2 m pair for 2), each pushed three ways from rest
 *     with no reaction. 0.05 m/s holds with no step. A capture point 0.08 m
 *     past the front edge, well within the 0.6 m reach, takes exactly one step:
 *     push, trigger, touchdown, standing, end. 3.5 m/s falls. Every span starts
 *     at the push, puts each touchdown straight after its trigger, runs in time
 *     order and joins its capture point and centre of mass across each branch.
 */
export function test_engine_physics_prepare_physical_disturbance_span(): void {
  const omega: number = Math.sqrt(9.81 / 0.9);
  const t0: number = 0.2;
  const speed: number = 1.2;
  const xi0: number = speed / omega;
  const edge: number = 0.12;
  const reach: number = 0.6;
  const quickest: number = 0.15;
  const rectangle: { x: number; y: number }[] = [
    { x: -0.12, y: -0.05 },
    { x: 0.12, y: -0.05 },
    { x: 0.12, y: 0.05 },
    { x: -0.12, y: 0.05 },
  ];
  const input = (velocity: number, reaction: number): AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanInput => ({
    seconds: t0,
    center: { x: 0, y: 0.9, z: 0 },
    velocity: { x: 0, y: 0, z: velocity },
    omega,
    mass: MASS,
    gravity: 9.81,
    feet: [
      {
        bone: "left",
        side: "left",
        frame: { origin: { x: 0.1, z: 0 }, forward: { x: 0, z: 1 } },
        polygon: rectangle,
      },
      {
        bone: "right",
        side: "right",
        frame: { origin: { x: -0.1, z: 0 }, forward: { x: 0, z: 1 } },
        polygon: rectangle,
      },
    ],
    authored: { position: { x: 0, z: 0 }, velocity: { x: 0, z: 0 } },
    maximumStep: reach,
    reactionSeconds: reaction,
    floor: 0,
  });
  const close = (a: number, b: number, tolerance: number): boolean =>
    Math.abs(a - b) <= tolerance;
  const kinds = (span: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanResult): string[] =>
    span.branches.map((branch) => branch.kind);
  const failures: string[] = [];
  const check = (name: string, ok: boolean, detail: string = ""): void => {
    if (!ok) failures.push(detail ? `${name}: ${detail}` : name);
  };
  const listed = (span: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanResult): string => {
    const all: string[] = kinds(span);
    return all.length <= 10
      ? all.join(",")
      : `${all.slice(0, 4).join(",")},...,${all.slice(-3).join(",")} (${all.length} branches)`;
  };
  const one: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanResult = AutoMovieEnginePhysicalBalance.prepareDisturbanceSpan(input(speed, 0));
  const late: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanResult = AutoMovieEnginePhysicalBalance.prepareDisturbanceSpan(input(speed, 0.1));
  const two: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanResult = AutoMovieEnginePhysicalBalance.prepareDisturbanceSpan(input(speed, 0.15));
  // The farthest a capture point can land inside one step's foot: the reach
  // across the 0.2 m stance width, plus the foot's half-length (Koolen et al.,
  // Eq. 25, the step region dilated by the foot).
  const captures: number = Math.sqrt(reach * reach - 0.2 * 0.2) + edge;
  const landing = (reaction: number): number =>
    edge +
    (edge + (xi0 - edge) * Math.exp(omega * reaction) - edge) *
      Math.exp(omega * quickest);

  // 1. Purity.
  const end: number = two.branches.at(-1)!.seconds;
  const times: number[] = Array.from(
    { length: 16 },
    (_, i: number): number => t0 - 0.1 + ((end + 0.6 - t0) * i) / 15,
  );
  const ascending: string[] = times.map((t) => JSON.stringify(two.sample(t)));
  const shuffled: string[] = new Array(16);
  for (const i of times.map((_, k: number): number => (k * 7) % 16))
    shuffled[i] = JSON.stringify(two.sample(times[i]!));
  check(
    "shuffled samples",
    JSON.stringify(shuffled) === JSON.stringify(ascending),
  );
  check(
    "before the push",
    JSON.stringify(two.sample(t0 - 1)) === JSON.stringify(two.sample(t0)),
  );

  // 2. One step captures with no reaction and with a 0.1 s one: the capture
  // point lands inside the step's reach and foot.
  for (const [name, span, reaction] of [
    ["one", one, 0],
    ["late", late, 0.1],
  ] as const) {
    check(`${name}: one-step premise`, landing(reaction) < captures);
    check(
      `${name}: one-step branches`,
      kinds(span).join() === "push,trigger,touchdown,standing,end",
      listed(span),
    );
    check(
      `${name}: trigger after the reaction`,
      close(
        span.branches[1]!.seconds,
        t0 + reaction,
        PhysicalTolerance.ROUNDING,
      ),
    );
    check(`${name}: footstep viable`, span.footstep?.viable === true);
  }

  // 3. A 0.15 s reaction leaves one step short: two steps, never a third,
  // and no fall.
  check("two-step premise", landing(0.15) > captures);
  check(
    "two-step branches",
    kinds(two).filter((kind) => kind === "trigger").length === 2 &&
      !kinds(two).includes("fall") &&
      kinds(two).at(-1) === "end",
    listed(two),
  );
  check(
    "two-step trigger after the reaction",
    close(two.branches[1]!.seconds, t0 + 0.15, PhysicalTolerance.ROUNDING),
  );

  // 4. Timing.
  const timing: string[] = [];
  for (const [name, span] of [
    ["one", one],
    ["two", two],
  ] as const) {
    const branches: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanBranch[] = span.branches;
    branches.forEach((branch: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanBranch, i: number): void => {
      const previous: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanBranch | undefined = branches[i - 1];
      if (branch.kind === "touchdown" && previous?.kind === "trigger") {
        const swing: number = branch.seconds - previous.seconds;
        if (
          !(
            swing >= quickest - PhysicalTolerance.ROUNDING &&
            swing <= 0.6 + PhysicalTolerance.ROUNDING
          )
        )
          timing.push(`${name}: a ${swing} s swing at ${branch.seconds} s`);
      }
      if (branch.kind === "standing" && previous?.kind === "touchdown")
        if (
          !(
            branch.seconds >=
            previous.seconds + 0.25 - PhysicalTolerance.ROUNDING
          )
        )
          timing.push(
            `${name}: standing ${branch.seconds - previous.seconds} s after touchdown`,
          );
      if (branch.kind === "end" && previous?.kind === "standing")
        if (
          !close(
            branch.seconds,
            previous.seconds + 0.25,
            PhysicalTolerance.ROUNDING,
          )
        )
          timing.push(
            `${name}: end ${branch.seconds - previous.seconds} s after standing`,
          );
    });
  }
  failures.push(...timing);

  // 5. Double support: a held pivot on the support and the capture point's
  // exponential from it.
  const held = two.sample(t0).pivot;
  check(
    "pivot held on the support",
    two.sample(t0).saturated &&
      Math.abs(held.x) <= 0.15 + PhysicalTolerance.ACCUMULATED &&
      Math.abs(held.z) <= edge + PhysicalTolerance.ACCUMULATED,
  );
  for (const t of [0.02, 0.05, 0.09]) {
    const sample: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanSample = two.sample(t0 + t);
    const grow: number = Math.exp(omega * t);
    check(
      `divergence at ${t} s`,
      close(sample.pivot.x, held.x, PhysicalTolerance.ROUNDING) &&
        close(sample.pivot.z, held.z, PhysicalTolerance.ROUNDING) &&
        close(
          sample.capture.z,
          held.z + (xi0 - held.z) * grow,
          PhysicalTolerance.ACCUMULATED,
        ) &&
        close(
          sample.capture.x,
          held.x + (0 - held.x) * grow,
          PhysicalTolerance.ACCUMULATED,
        ),
    );
  }

  // 6. Continuity across every branch.
  const h: number = STEP;
  const jumps: string[] = [];
  for (const [name, span] of [
    ["one", one],
    ["two", two],
  ] as const)
    for (const branch of span.branches.slice(1)) {
      const before: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanSample = span.sample(branch.seconds - h);
      const after: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanSample = span.sample(branch.seconds + h);
      for (const [quantity, a, b] of [
        ["capture", before.capture, after.capture],
        ["center", before.center, after.center],
        ["centerVelocity", before.centerVelocity, after.centerVelocity],
      ] as const) {
        const gap: number = Math.hypot(a.x - b.x, a.z - b.z);
        if (!(gap <= JOIN))
          jumps.push(
            `${name}: ${quantity} jumps ${gap} at ${branch.kind} ${branch.seconds} s`,
          );
      }
    }
  failures.push(...jumps.slice(0, 12));

  // 7. After the end the error from the standing target decays at omega K_p
  // once the pivot is free of the support: for equally spaced samples the
  // ratio of successive differences is the decay over the spacing, whatever
  // the target.
  for (const [name, span] of [
    ["one", one],
    ["late", late],
    ["two", two],
  ] as const) {
    // From the first time after the end that the pivot is free: once the
    // error has decayed enough for the unconstrained pivot to re-enter.
    let free: number = span.branches.at(-1)!.seconds;
    while (
      span.sample(free).saturated &&
      free < span.branches.at(-1)!.seconds + 2
    )
      free += 0.05;
    const [a, b, c] = [0, 0.2, 0.4].map((t) => span.sample(free + t));
    const ratio: number =
      Math.hypot(c!.capture.x - b!.capture.x, c!.capture.z - b!.capture.z) /
      Math.hypot(b!.capture.x - a!.capture.x, b!.capture.z - a!.capture.z);
    check(
      `${name}: decay at omega K_p`,
      !a!.saturated &&
        !b!.saturated &&
        !c!.saturated &&
        close(ratio, Math.exp(-omega * 2 * 0.2), PhysicalTolerance.CONVERGED),
      `ratio ${ratio}, saturated ${[a, b, c].map((s) => s!.saturated)}`,
    );
  }

  // 8. A small push: no step.
  const small: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanResult = AutoMovieEnginePhysicalBalance.prepareDisturbanceSpan(input(0.05, 0.1));
  check(
    "small push holds",
    small.footstep === undefined &&
      !small.branches.some((branch) => branch.kind === "trigger"),
    listed(small),
  );

  // 9. A fall: a 3 m/s push puts the capture point past any footstep the
  // reach and the quickest swing allow, so the recovery step is not viable.
  const fall: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanResult = AutoMovieEnginePhysicalBalance.prepareDisturbanceSpan(input(3, 0.1));
  check(
    "fall premise",
    edge + (3 / omega - edge) * Math.exp(omega * (0.1 + quickest)) > reach,
  );
  check(
    "fall has no capturable step",
    fall.branches.some((branch) => branch.kind === "fall") ||
      fall.footstep?.viable === false,
    `${listed(fall)} footstep ${JSON.stringify(fall.footstep)}`,
  );

  // 10. The floor's reaction: the weight up and m omega^2 (c - cmp) across at
  // the pivot, shared among the planted feet, none on a swinging one.
  const reactions: string[] = [];
  for (const t of times) {
    const sample: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanSample = two.sample(t);
    const r = sample.reaction;
    const shares: number = Object.values(sample.loads).reduce(
      (sum: number, share: number): number => sum + share,
      0,
    );
    const swinging: string | undefined =
      sample.phase === "single"
        ? Object.keys(sample.feet).find((bone) => !(sample.loads[bone]! > 0))
        : undefined;
    if (
      !close(r.force.y, MASS * 9.81, PhysicalTolerance.ACCUMULATED) ||
      !close(
        r.force.x,
        MASS * omega * omega * (sample.center.x - sample.pivot.x),
        PhysicalTolerance.CONVERGED,
      ) ||
      !close(
        r.force.z,
        MASS * omega * omega * (sample.center.z - sample.pivot.z),
        PhysicalTolerance.CONVERGED,
      ) ||
      !close(r.point.x, sample.pivot.x, PhysicalTolerance.ROUNDING) ||
      !close(r.point.z, sample.pivot.z, PhysicalTolerance.ROUNDING) ||
      !close(shares, 1, PhysicalTolerance.ACCUMULATED) ||
      (sample.phase === "single" && swinging === undefined)
    )
      reactions.push(
        `${t.toFixed(3)} s ${sample.phase}: ${JSON.stringify({ r, loads: sample.loads })}`,
      );
  }
  failures.push(...reactions.slice(0, 6));

  // 11. Resume: the span prepared again from its stored input gives the same
  // samples bit for bit.
  const again: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanResult = AutoMovieEnginePhysicalBalance.prepareDisturbanceSpan(input(speed, 0.15));
  check(
    "re-prepared span",
    JSON.stringify(times.map((t) => again.sample(t))) ===
      JSON.stringify(times.map((t) => two.sample(t))),
  );

  // 12. Every support count through one path: 2, 3, 4, 6 and 8 contacts, each
  // a sustained push, a recoverable one and a fall.
  for (const count of [2, 3, 4, 6, 8]) {
    const feet: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanFoot[] = Array.from(
      { length: count },
      (_, i: number): AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanFoot => {
        const angle: number = (2 * Math.PI * (i + 0.5)) / count;
        const x: number =
          count === 2 ? (i === 0 ? 0.1 : -0.1) : 0.3 * Math.cos(angle);
        const z: number = count === 2 ? 0 : 0.3 * Math.sin(angle);
        return {
          bone: `contact-${i}`,
          side: x >= 0 ? "left" : "right",
          frame: { origin: { x, z }, forward: { x: 0, z: 1 } },
          polygon: [
            { x: -0.05, y: -0.03 },
            { x: 0.05, y: -0.03 },
            { x: 0.05, y: 0.03 },
            { x: -0.05, y: 0.03 },
          ],
        };
      },
    );
    const front: number = Math.max(
      ...feet.map((foot): number => foot.frame.origin.z + 0.05),
    );
    for (const [outcome, velocity] of [
      ["sustained", 0.05],
      ["recover", omega * (front + 0.08)],
      ["fall", 3.5],
    ] as const) {
      const label: string = `${count} contacts, ${outcome}`;
      try {
        verifyCase(label, AutoMovieEnginePhysicalBalance.prepareDisturbanceSpan({ ...input(velocity, 0), feet }), outcome);
      } catch (error: unknown) {
        failures.push(
          `${label}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
  TestValidator.equals("disturbance span", failures, []);

  /** Check one support count's outcome: its branches' order and joins. */
  function verifyCase(
    label: string,
    prepared: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanResult,
    outcome: "sustained" | "recover" | "fall",
  ): void {
    {
      const order: string[] = kinds(prepared);
      const consistent: boolean =
        order[0] === "push" &&
        ["end", "fall"].includes(order.at(-1)!) &&
        order.every(
          (kind: string, i: number): boolean =>
            kind !== "touchdown" || order[i - 1] === "trigger",
        ) &&
        prepared.branches.every(
          (branch, i: number): boolean =>
            i === 0 || branch.seconds >= prepared.branches[i - 1]!.seconds,
        );
      check(`${label}: branch order`, consistent, listed(prepared));
      const steps: number = order.filter((kind) => kind === "trigger").length;
      const fell: boolean =
        order.includes("fall") || prepared.footstep?.viable === false;
      if (outcome === "sustained")
        check(`${label}: no step`, steps === 0 && !fell, listed(prepared));
      else if (outcome === "recover")
        check(
          `${label}: one step, then stands`,
          order.join() === "push,trigger,touchdown,standing,end",
          listed(prepared),
        );
      else check(`${label}: falls`, fell, listed(prepared));
      for (const branch of prepared.branches.slice(1)) {
        const a: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanSample = prepared.sample(branch.seconds - STEP);
        const b: AutoMovieEnginePhysicalBalanceTypes.IPrepareDisturbanceSpanSample = prepared.sample(branch.seconds + STEP);
        const gap: number = Math.max(
          Math.hypot(a.capture.x - b.capture.x, a.capture.z - b.capture.z),
          Math.hypot(a.center.x - b.center.x, a.center.z - b.center.z),
        );
        check(
          `${label}: continuous at ${branch.kind}`,
          gap <= JOIN,
          `${gap} at ${branch.seconds} s`,
        );
      }
    }
  }
}

/** The body's mass, kilograms. */
const MASS: number = 75;

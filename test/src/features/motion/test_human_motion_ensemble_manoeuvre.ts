import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HUMAN_MANOEUVRES,
  HumanEnsemble,
  HumanFormation,
  HumanGait,
  HumanManoeuvre,
  HumanRefusal,
  type IHumanBody,
  type IHumanFormation,
  type IHumanManoeuvre,
  manoeuvreWheel,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A change of formation is planned as each member's own travel: file order
 * kept, ways that do not cross, the wheel's steps growing with the radius,
 * a square's front ranks kneeling, the same plan in a moved frame, and the
 * drills only rows over four choices.
 *
 * Scenarios, members on three bodies:
 * 1. A column of four 2 by 6 blocks deploys into a line of four 2 by 6
 *    blocks: every member's way ends on its new slot, file order is kept
 *    (member i takes slot i), the farthest block steps off first, and the
 *    plan's own crossing check passes.
 * 2. A 2 by 12 line wheels through 90 degrees on its left flank: every way
 *    is an arc whose length grows with the member's radius from the pivot
 *    (front rank, file by file), and the pivot marks time. Every member
 *    keeps its slot of one turning formation (`manoeuvreWheel`): its pivot
 *    never moves, its outward file's slot reaches the manual's lengthened
 *    step of the slowest member's march speed and never exceeds it, and at
 *    the wheel's end every slot lies on its target slot within 1e-6 m.
 * 3. A square from an attack column: four outward faces, the front rank of
 *    each face kneeling and the others standing.
 * 4. The same deployment with the whole scene moved by (5, 0, -3) m and turned
 *    by 30 degrees gives the same ways moved and turned, within 1e-9 m.
 * 5. A deployment whose column has more blocks than its line, a straight
 *    re-form whose ways cross, and a wheel to a line half a metre off the
 *    turned one are refused as located refusals naming the ensemble.
 * 6. The `deploy` row and its four choices written out plan the same parts.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Plans manoeuvres and reads their parts: a reordered file, a member that misses its slot, a crossing left in, a wheel with uneven steps, an inward face, a frame-dependent plan, or a row with logic of its own is caught.
 * @evidence contracts/development/testing.md#independent-expectations File order and non-crossing are the drill's; arc length proportional to radius is the wheel's geometry, and the outward man's 33 inch step over the ordinary 30 is the manual's; outward faces and kneeling front ranks are the square's regulation; frame invariance is geometric.
 * @evidence contracts/development/testing.md#distinguishing-cases Deploy, wheel and square, a wheel's turning stations, a moved frame, three refusals and the row's equivalence; performing the parts belongs to the scene tests.
 * @evidence contracts/development/testing.md#execution-ownership A unit test of the motions package on prepared polygon-man bodies, discovered by its exported name; plans only, no pose, no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios and what each pins.
 */
export function test_human_motion_ensemble_manoeuvre(): void {
  const findings: string[] = [];
  const pool: IHumanBody[] = [
    motionHumanBody("m-average"),
    motionHumanBody("f-small"),
    motionHumanBody("m-tall"),
  ];
  const block = (lateral: number, depth: number): IHumanFormation.IBlock => ({
    layout: {
      kind: "line",
      ranks: 2,
      files: 6,
      spacing: { lateral: 0.6, depth: 0.8 },
    },
    count: 12,
    offset: { lateral, depth },
  });
  const fixed = (
    at: IAutoMovieVector3,
    heading: number,
  ): IHumanFormation.Frame => ({ kind: "fixed", at, heading });
  const column = (frame: IHumanFormation.Frame): IHumanFormation => ({
    blocks: [0, 1, 2, 3].map(
      (k: number): IHumanFormation.IBlock => block(0, 3 * k),
    ),
    frame,
  });
  const line = (frame: IHumanFormation.Frame): IHumanFormation => ({
    blocks: [-1.5, -0.5, 0.5, 1.5].map(
      (k: number): IHumanFormation.IBlock => block(k * 4.2, 0),
    ),
    frame,
  });
  const ensemble = (
    formation: IHumanFormation,
    count: number = 48,
  ): HumanEnsemble.IEnsemble =>
    HumanEnsemble.of({
      id: "b",
      seed: "manoeuvre",
      count,
      bodies: pool,
      preset: "line",
      formation,
    });
  const deploy = (frame: IHumanFormation.Frame): IHumanManoeuvre => ({
    from: column(frame),
    to: line(frame),
    rule: "deploy",
    on: { of: "orders", event: "deploy" },
    at: 0,
    gait: "march",
  });

  // 1. Deploy.
  const origin: IHumanFormation.Frame = fixed({ x: 0, y: 0, z: 0 }, 0);
  const troop: HumanEnsemble.IEnsemble = ensemble(column(origin));
  let parts: IHumanManoeuvre.IPart[] = [];
  try {
    parts = HumanManoeuvre.plan(troop, deploy(origin));
  } catch (error) {
    findings.push(`the deployment was refused: ${String(error)}`);
  }
  for (const p of parts) {
    if (p.slot !== p.member)
      findings.push(`member ${p.member} takes slot ${p.slot}`);
    const end: IAutoMovieVector3 = p.via[p.via.length - 1]!;
    const slot: IAutoMovieVector3 = HumanFormation.slot(
      line(origin),
      p.slot,
      0,
    ).at;
    if (Math.hypot(end.x - slot.x, end.z - slot.z) > 1e-9)
      findings.push(`member ${p.member}'s way ends off its slot`);
  }
  const reach = (p: IHumanManoeuvre.IPart): number =>
    Math.hypot(
      p.via[p.via.length - 1]!.x - p.via[0]!.x,
      p.via[p.via.length - 1]!.z - p.via[0]!.z,
    );
  const farthest: IHumanManoeuvre.IPart | undefined = [...parts].sort(
    (a: IHumanManoeuvre.IPart, b: IHumanManoeuvre.IPart): number =>
      reach(b) - reach(a),
  )[0];
  if (farthest !== undefined && farthest.delay !== 0)
    findings.push(
      `the farthest member steps off ${farthest.delay} s after the word`,
    );

  // 2. Wheel.
  const wide: IHumanFormation = {
    blocks: [
      {
        layout: {
          kind: "line",
          ranks: 2,
          files: 12,
          spacing: { lateral: 0.6, depth: 0.8 },
        },
        count: 24,
      },
    ],
    frame: origin,
  };
  // Wheeled left by 90 degrees about file 0 of the front rank, which stands 3.3 m to the frame's left: the new frame faces +X with file 0 where it stood.
  const pivotAt: IAutoMovieVector3 = HumanFormation.slot(wide, 0, 0).at;
  const wheeled: IHumanFormation = {
    ...wide,
    frame: fixed({ x: pivotAt.x, y: 0, z: pivotAt.z + 3.3 }, 90),
  };
  const wheelParts: IHumanManoeuvre.IPart[] = HumanManoeuvre.plan(
    ensemble(wide, 24),
    {
      from: wide,
      to: wheeled,
      rule: "wheel",
      on: { of: "orders", event: "wheel" },
      at: 0,
      pivot: "left",
    },
  );
  const still: IAutoMovieVector3 = HumanFormation.slot(wheeled, 0, 0).at;
  if (Math.hypot(still.x - pivotAt.x, still.z - pivotAt.z) > 1e-9)
    findings.push("the pivot does not keep its place");
  const length = (p: IHumanManoeuvre.IPart): number =>
    p.via
      .slice(1)
      .reduce(
        (s: number, q: IAutoMovieVector3, k: number): number =>
          s + Math.hypot(q.x - p.via[k]!.x, q.z - p.via[k]!.z),
        0,
      );
  const front: IHumanManoeuvre.IPart[] = wheelParts.slice(0, 12);
  for (let k: number = 1; k < front.length; ++k)
    if (!(length(front[k]!) >= length(front[k - 1]!) - 1e-9))
      findings.push(
        `file ${k} of the wheel goes ${length(front[k]!).toFixed(3)} m, less than file ${k - 1}'s`,
      );

  // The wheel's stations: one turning formation, the line straight, the outward man at the lengthened step and no faster, the target reached.
  const wheeling: IHumanFormation.IStation | undefined = wheelParts[0]?.station;
  if (wheeling === undefined) findings.push("the wheel keeps no station");
  else {
    const until: number = wheeling.until!;
    const slowest: number = Math.min(
      ...ensemble(wide, 24).members.map(
        (m: HumanEnsemble.IMember): number =>
          (HumanGait.MARCH.step *
            m.body.measure.hipHeight *
            HumanGait.MARCH.cadence) /
          60,
      ),
    );
    const bound: number = manoeuvreWheel.LENGTHENED * slowest;
    let fastest: number = 0;
    for (let t: number = 0; t + 1 / 24 <= until + 1e-9; t += 1 / 24) {
      const a: IAutoMovieVector3 = HumanFormation.slot(
        wheeling.formation,
        OUTWARD,
        t,
      ).at;
      const b: IAutoMovieVector3 = HumanFormation.slot(
        wheeling.formation,
        OUTWARD,
        t + 1 / 24,
      ).at;
      fastest = Math.max(fastest, Math.hypot(b.x - a.x, b.z - a.z) * 24);
      const pivotNow: IAutoMovieVector3 = HumanFormation.slot(
        wheeling.formation,
        0,
        t,
      ).at;
      if (Math.hypot(pivotNow.x - pivotAt.x, pivotNow.z - pivotAt.z) > 1e-9) {
        findings.push(`the wheel's pivot moves at ${t.toFixed(2)} s`);
        break;
      }
    }
    if (fastest > bound * (1 + 1e-6))
      findings.push(
        `the outward man is asked ${fastest.toFixed(3)} m/s, beyond the lengthened step's ${bound.toFixed(3)}`,
      );
    if (fastest < bound * 0.99)
      findings.push(
        `the outward man never reaches the lengthened step: ${fastest.toFixed(3)} of ${bound.toFixed(3)} m/s`,
      );
    for (const p of wheelParts) {
      const at: IAutoMovieVector3 = HumanFormation.slot(
        p.station!.formation,
        p.station!.slot,
        until,
      ).at;
      const target: IAutoMovieVector3 = HumanFormation.slot(
        wheeled,
        p.slot,
        0,
      ).at;
      if (Math.hypot(at.x - target.x, at.z - target.z) > 1e-6)
        findings.push(`member ${p.member}'s wheeling slot ends off its target`);
    }
  }

  // 3. Square.
  const face = (
    facing: number,
    lateral: number,
    depth: number,
  ): IHumanFormation.IBlock => ({ ...block(lateral, depth), facing });
  const square: IHumanFormation = {
    blocks: [face(0, 0, -3), face(90, -3, 0), face(180, 0, 3), face(270, 3, 0)],
    frame: origin,
  };
  const squared: IHumanManoeuvre.IPart[] = HumanManoeuvre.plan(troop, {
    from: column(origin),
    to: square,
    rule: "square",
    on: { of: "orders", event: "square" },
    at: 0,
  });
  for (const p of squared) {
    const slot: HumanFormation.ILocal = HumanFormation.local(square, p.slot);
    if ((slot.rank === 0) !== (p.arrive === "kneel"))
      findings.push(
        `member ${p.member} of rank ${slot.rank} arrives ${p.arrive}`,
      );
    const at: IAutoMovieVector3 = p.via[p.via.length - 1]!;
    if (
      !(
        at.x * Math.sin((p.face * Math.PI) / 180) +
          at.z * Math.cos((p.face * Math.PI) / 180) >
        0
      )
    )
      findings.push(`member ${p.member} faces into the square`);
  }

  // 4. A moved frame.
  const moved: IHumanFormation.Frame = fixed({ x: 5, y: 0, z: -3 }, 30);
  const movedParts: IHumanManoeuvre.IPart[] = HumanManoeuvre.plan(
    ensemble(column(moved)),
    deploy(moved),
  );
  const turn = (p: IAutoMovieVector3): IAutoMovieVector3 => {
    const h: number = (30 * Math.PI) / 180;
    return {
      x: 5 + p.x * Math.cos(h) + p.z * Math.sin(h),
      y: 0,
      z: -3 - p.x * Math.sin(h) + p.z * Math.cos(h),
    };
  };
  parts.forEach((p: IHumanManoeuvre.IPart, i: number): void => {
    const a: IAutoMovieVector3 = turn(p.via[p.via.length - 1]!);
    const b: IAutoMovieVector3 =
      movedParts[i]!.via[movedParts[i]!.via.length - 1]!;
    if (Math.hypot(a.x - b.x, a.z - b.z) > 1e-9)
      findings.push(`member ${i}'s way does not move with the frame`);
  });

  // 5. Refusals.
  for (const [label, run] of [
    [
      "a column of more blocks than its line",
      (): unknown =>
        HumanManoeuvre.plan(troop, {
          ...deploy(origin),
          to: {
            blocks: [
              { ...block(0, 0), count: 12 },
              { ...block(4, 0), count: 12 },
            ],
            frame: origin,
          },
        }),
    ],
    [
      "crossing ways",
      (): unknown =>
        HumanManoeuvre.plan(ensemble(wide, 24), {
          from: wide,
          to: { ...wide, frame: fixed({ x: 0, y: 0, z: 0 }, 180) },
          rule: { assign: "order", path: "straight", order: "together" },
          on: { of: "orders", event: "x" },
          at: 0,
        }),
    ],
    [
      "a wheel to a formation that is not the line turned",
      (): unknown =>
        HumanManoeuvre.plan(ensemble(wide, 24), {
          from: wide,
          to: {
            ...wide,
            frame: fixed({ x: pivotAt.x + 0.5, y: 0, z: pivotAt.z + 3.3 }, 90),
          },
          rule: "wheel",
          on: { of: "orders", event: "wheel" },
          at: 0,
        }),
    ],
  ] as const)
    try {
      run();
      findings.push(`${label} was not refused`);
    } catch (error) {
      if (!(error instanceof HumanRefusal) || !error.axis.startsWith("b."))
        findings.push(`${label}: not a located refusal: ${String(error)}`);
    }

  // 6. A row is its four choices.
  const written: IHumanManoeuvre.IPart[] = HumanManoeuvre.plan(troop, {
    ...deploy(origin),
    rule: { ...HUMAN_MANOEUVRES.deploy },
  });
  if (JSON.stringify(written) !== JSON.stringify(parts))
    findings.push("the deploy row and its choices plan different parts");
  TestValidator.equals("a manoeuvre as members' own travel", findings, []);
}

/** The wheel's outward member: file 11 of the rear rank, the farthest from the left pivot. */
const OUTWARD: number = 23;

import {
  createCraftTool,
  createEasel,
  createPalette,
  createPotteryWheel,
  createSeat,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanConduct,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanWrite,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";

import { assertTakeClean } from "../internal/assertTakeClean";
import { everydayTake } from "../internal/everydayTake";
import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/** A working point lies on its surface within this, metres. */
const ON: number = 0.005;
/** A held prop drifts at most this in its hand's frame, metres. */
const HOLD: number = 0.005;
/** A palm stays on the clay wall within this, metres. */
const PALM: number = 0.03;
/** An ictus falls on its beat within this, seconds: a 24 Hz frame. */
const ICTUS: number = 1 / 24;
/** The conducting tempo, beats per minute. */
const BPM: number = 120;

/**
 * Crafts (#3996): painting at an easel, conducting, sewing, knitting and
 * throwing pottery.
 *
 * Scenarios, on m-average and f-small:
 * 1. Painting: the palette on the left thumb, the brush reloads on the
 *    palette and paints two strokes, each tip on the canvas along its
 *    authored points; the palette stays on the thumb. A canvas beyond
 *    reach is refused.
 * 2. Conducting: 2/4, 3/4 and 4/4 each beat one bar; every ictus is its
 *    beat's lowest point on the beat's instant, and each beat comes from
 *    its standard direction (4/4 down, in, out, up).
 * 3. Sewing: a needle pierces a held cloth along a seam in two stitches,
 *    each drawn out to arm's length, the cloth held still.
 * 4. Knitting: seated, the right needle's tip enters the left needle's
 *    stitch and takes it, both hands holding their needles.
 * 5. Pottery: seated at the wheel, both palms stay on the clay wall as it
 *    rises monotonically on the turning head.
 * Every take passes the shipped verdicts, which include prop and body
 * penetration: no needle passes through the holding hand.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario, the bodies and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Composes pickUp, write, workHeld, conduct and throwPottery and reads displayed tool tips, surfaces, palms and articulation states.
 * @evidence contracts/development/testing.md#independent-expectations Stroke points, beat instants and figure directions are the author's and Rudolf's; tolerances are named.
 * @evidence contracts/development/testing.md#distinguishing-cases Three meters, reload against stroke, a canvas within against beyond reach.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_human_motion_crafts(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    for (const scene of SCENES)
      try {
        scene.run(body, `${name} ${scene.label}`, checks);
      } catch (error: unknown) {
        checks.check(
          `${name} ${scene.label} refused: ${everydayTake.describe(error)}`,
          false,
        );
      }
  }
  checks.assert("crafts");
}

/** The take with the shipped verdicts. */
function play(
  label: string,
  body: IAutoMovieMotionHumanBody,
  props: readonly IAutoMovieMotionHumanProp[],
  chain: IAutoMovieMotionHumanChain,
): HumanPerformance {
  const take: HumanPerformance = everydayTake.perform(
    `crafts-${label}`,
    body,
    props,
    chain,
    Object.values(HUMAN_LEXICON).flat(),
  );
  assertTakeClean(label, take);
  return take;
}

/** The segments of one law, in order. */
function named(
  take: HumanPerformance,
  law: string,
): IAutoMovieMotionHumanSegment[] {
  return take
    .segments("actor")
    .filter((s: IAutoMovieMotionHumanSegment): boolean => s.law.name === law);
}

/** A point in a surface's frame: its offset along the surface's X, normal and Z. */
function local(
  take: HumanPerformance,
  model: IAutoMovieMotionHumanPropModel,
  subject: string,
  surface: string,
  world: IAutoMovieVector3,
  t: number,
): IAutoMovieVector3 {
  const site: IAutoMovieAffordance = model.affordances!.find(
    (a: IAutoMovieAffordance): boolean => a.id === surface,
  )!;
  const frame: IAutoMovieRigidTransform = take.prop(subject, t);
  const origin: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, site.frame.translation),
  );
  return Quaternion.rotateVector(
    Quaternion.inverse(
      Quaternion.multiply(frame.rotation, site.frame.rotation),
    ),
    Vector3.subtract(world, origin),
  );
}

/** A prop model with its affordances. */
type IAutoMovieMotionHumanPropModel = Parameters<typeof HumanObject.prop>[1];

/** Painting: reload on the palette, two strokes on the canvas, the refusal. */
function painting(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  const easel = createEasel({ id: "easel" });
  const palette = createPalette({ id: "palette", kind: "palette" });
  const brush = createCraftTool({ id: "brush", kind: "paintbrush" });
  const centre: number = body.measure.shoulderHeight - 0.15;
  const props: IAutoMovieMotionHumanProp[] = [
    everydayTake.prop(
      "easel",
      easel,
      { x: 0, y: centre - 1.35, z: 0.6 },
      undefined,
      true,
    ),
    everydayTake.prop("palette", palette, { x: 0.3, y: 0.95, z: 0.25 }),
    everydayTake.prop("brush", brush, { x: -0.25, y: 1.0, z: 0.3 }),
  ];
  const strokes: readonly IAutoMovieMotionHumanWrite["stroke"][] = [
    [
      [-0.1, 0.05],
      [0, 0.08],
      [0.1, 0.05],
    ],
    [
      [-0.08, -0.05],
      [0.08, -0.1],
    ],
  ];
  let chain: IAutoMovieMotionHumanChain = HumanChain.subject("actor")
    .stand()
    .pickUp({ prop: "palette", handle: "hold", hand: "left", lift: 0.1 })
    .pickUp({ prop: "brush", handle: "grip", hand: "right", lift: 0.05 });
  for (const stroke of strokes)
    chain = chain
      .registered("write", {
        tool: "brush",
        tip: "tip",
        on: "palette",
        surface: "face",
        stroke: [
          [0.05, 0],
          [0.08, 0.02],
        ],
        seconds: 0.4,
        side: "right",
      })
      .registered("write", {
        tool: "brush",
        tip: "tip",
        on: "easel",
        surface: "canvas",
        stroke,
        seconds: 0.8,
        side: "right",
      });
  const take: HumanPerformance = play(`${label} painting`, body, props, chain);
  const writes: IAutoMovieMotionHumanSegment[] = named(take, "write");
  writes.forEach((w: IAutoMovieMotionHumanSegment, k: number): void => {
    const onCanvas: boolean = k % 2 === 1;
    let off: number = 0;
    for (let i: number = 4; i <= 8; ++i) {
      const t: number = w.start + ((w.end - w.start) * i) / 12;
      const tip: IAutoMovieVector3 = everydayTake.point(
        take,
        brush,
        "brush",
        "tip",
        t,
      );
      off = Math.max(
        off,
        Math.abs(
          local(
            take,
            onCanvas ? easel : palette,
            onCanvas ? "easel" : "palette",
            onCanvas ? "canvas" : "face",
            tip,
            t,
          ).y,
        ),
      );
    }
    checks.check(
      `${label}: ${onCanvas ? `stroke ${(k + 1) / 2}` : `reload ${k / 2 + 1}`} keeps the tip on its surface (${off.toFixed(4)} m)`,
      off <= ON,
    );
  });
  checks.check(
    `${label}: the palette stays on the thumb`,
    everydayTake.drift(
      take,
      "left",
      "palette",
      writes[0]!.start,
      take.duration,
    ) <= HOLD,
  );
  const far: HumanRefusal | undefined = everydayTake.refusal(() =>
    everydayTake.perform(
      `crafts-${label}-far`,
      body,
      [
        everydayTake.prop(
          "easel",
          easel,
          { x: 0, y: centre - 1.35, z: 2 },
          undefined,
          true,
        ),
        props[1]!,
        props[2]!,
      ],
      HumanChain.subject("actor")
        .stand()
        .pickUp({ prop: "brush", handle: "grip", hand: "right", lift: 0.05 })
        .registered("write", {
          tool: "brush",
          tip: "tip",
          on: "easel",
          surface: "canvas",
          stroke: [
            [0, 0],
            [0.1, 0],
          ],
          seconds: 0.5,
          side: "right",
        }),
      Object.values(HUMAN_LEXICON).flat(),
    ),
  );
  checks.check(
    `${label}: a canvas beyond reach is refused`,
    far !== undefined && far.kind === "reach",
  );
}

/** Conducting each meter for one bar. */
function conducting(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  const baton = createCraftTool({ id: "baton", kind: "baton" });
  const figures: readonly IFigure[] = [
    { meter: "2/4", directions: ["down", "up"] },
    { meter: "3/4", directions: ["down", "out", "up"] },
    { meter: "4/4", directions: ["down", "in", "out", "up"] },
  ];
  let chain: IAutoMovieMotionHumanChain = HumanChain.subject("actor")
    .stand()
    .pickUp({ prop: "baton", handle: "grip", hand: "right", lift: 0.1 });
  for (const figure of figures)
    chain = chain.registered("conduct", {
      baton: "baton",
      meter: figure.meter,
      bars: 1,
      bpm: BPM,
    });
  const take: HumanPerformance = play(
    `${label} conducting`,
    body,
    [everydayTake.prop("baton", baton, { x: -0.25, y: 1.0, z: 0.3 })],
    chain,
  );
  const period: number = 60 / BPM;
  const tip: (t: number) => IAutoMovieVector3 = (
    t: number,
  ): IAutoMovieVector3 => everydayTake.point(take, baton, "baton", "tip", t);
  named(take, "conduct").forEach(
    (segment: IAutoMovieMotionHumanSegment, f: number): void => {
      const figure: IFigure = figures[f]!;
      figure.directions.forEach((direction: Direction, b: number): void => {
        const beat: number = segment.start + (b + 1) * period;
        // The tip's lowest point within half a beat either side.
        let lowest: number = beat;
        let low: number = tip(beat).y;
        for (let i: number = -12; i <= 12; ++i) {
          const t: number = beat + (i * period) / 24;
          const y: number = tip(t).y;
          if (y < low) {
            low = y;
            lowest = t;
          }
        }
        checks.check(
          `${label} ${figure.meter}: beat ${b + 1}'s ictus falls on its instant (${(lowest - beat).toFixed(3)} s)`,
          Math.abs(lowest - beat) <= ICTUS,
        );
        const move: IAutoMovieVector3 = Vector3.subtract(
          tip(beat),
          tip(b === 0 ? beat - period / 2 : beat - period),
        );
        const ok: boolean =
          direction === "down"
            ? move.y < -Math.abs(move.x)
            : direction === "up"
              ? move.y > 0
              : direction === "in"
                ? move.x > Math.abs(move.y)
                : -move.x > Math.abs(move.y);
        checks.check(
          `${label} ${figure.meter}: beat ${b + 1} comes ${direction}`,
          ok,
        );
      });
    },
  );
}

/** Sewing three stitches along a seam on a held cloth. */
function sewing(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  const cloth = createPalette({ id: "cloth", kind: "cloth" });
  const needle = createCraftTool({ id: "needle", kind: "needle" });
  const props: IAutoMovieMotionHumanProp[] = [
    everydayTake.prop("cloth", cloth, { x: 0.15, y: 1.0, z: 0.3 }),
    everydayTake.prop("needle", needle, { x: -0.2, y: 1.0, z: 0.3 }),
  ];
  let chain: IAutoMovieMotionHumanChain = HumanChain.subject("actor")
    .stand()
    .pickUp({ prop: "cloth", handle: "hold", hand: "left", lift: 0.1 })
    .pickUp({ prop: "needle", handle: "grip", hand: "right", lift: 0.05 });
  const shoulder: number = body.measure.shoulderHeight;
  const reach: number = body.measure.upperArm + body.measure.forearm;
  for (let k: number = 0; k < 2; ++k)
    chain = chain
      .registered("write", {
        tool: "needle",
        tip: "tip",
        on: "cloth",
        surface: "face",
        stroke: [
          [0.06 - 0.02 * k, 0.01],
          [0.06 - 0.02 * k, -0.01],
        ],
        seconds: 0.4,
        side: "right",
      })
      .registered("workHeld", {
        prop: "needle",
        side: "right",
        at: { out: 0.35, up: shoulder - 0.05, forward: reach * 0.5 },
        seconds: 0.5,
      });
  const take: HumanPerformance = play(`${label} sewing`, body, props, chain);
  const stitches: IAutoMovieMotionHumanSegment[] = named(take, "write");
  const pulls: IAutoMovieMotionHumanSegment[] = named(take, "workHeld");
  stitches.forEach((w: IAutoMovieMotionHumanSegment, k: number): void => {
    const t: number = (w.start + w.end) / 2;
    const tip: IAutoMovieVector3 = everydayTake.point(
      take,
      needle,
      "needle",
      "tip",
      t,
    );
    checks.check(
      `${label}: stitch ${k + 1} passes the needle through the cloth`,
      Math.abs(local(take, cloth, "cloth", "face", tip, t).y) <= ON,
    );
    const out: number = Vector3.distance(
      everydayTake.point(take, needle, "needle", "tip", pulls[k]!.end),
      tip,
    );
    checks.check(
      `${label}: stitch ${k + 1}'s thread is drawn out`,
      out >= 0.25,
    );
  });
  checks.check(
    `${label}: the cloth stays in the holding hand`,
    everydayTake.drift(
      take,
      "left",
      "cloth",
      stitches[0]!.start,
      take.duration,
    ) <= HOLD,
  );
}

/** Knitting: the right needle takes a stitch off the left one. */
function knitting(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  const chair = createSeat({ id: "chair", kind: "dining" });
  const placement = {
    at: { x: 0, y: 0, z: -0.3 },
    yaw: 0,
    fixed: true,
  } as const;
  const left = createCraftTool({ id: "leftNeedle", kind: "knittingNeedle" });
  const right = createCraftTool({ id: "rightNeedle", kind: "knittingNeedle" });
  const props: IAutoMovieMotionHumanProp[] = [
    HumanObject.prop("chair", chair, placement),
    everydayTake.prop("leftNeedle", left, { x: 0.2, y: 0.75, z: 0.1 }),
    everydayTake.prop("rightNeedle", right, { x: -0.2, y: 0.75, z: 0.1 }),
  ];
  const chain: IAutoMovieMotionHumanChain = HumanChain.subject("actor")
    .sit({ seat: HumanObject.seat(chair, placement), seconds: 1 })
    .pickUp({ prop: "leftNeedle", handle: "grip", hand: "left", lift: 0.1 })
    .pickUp({ prop: "rightNeedle", handle: "grip", hand: "right", lift: 0.1 })
    .registered("write", {
      tool: "rightNeedle",
      tip: "tip",
      on: "leftNeedle",
      surface: "stitch",
      stroke: [
        [0, -0.01],
        [0, 0.01],
      ],
      seconds: 0.5,
      side: "right",
    });
  const take: HumanPerformance = play(`${label} knitting`, body, props, chain);
  const stitch: IAutoMovieMotionHumanSegment = named(take, "write")[0]!;
  const t: number = (stitch.start + stitch.end) / 2;
  const tip: IAutoMovieVector3 = everydayTake.point(
    take,
    right,
    "rightNeedle",
    "tip",
    t,
  );
  checks.check(
    `${label}: the right needle's tip enters the left needle's stitch`,
    Math.abs(local(take, left, "leftNeedle", "stitch", tip, t).y) <= ON,
  );
  checks.check(
    `${label}: both hands keep their needles`,
    everydayTake.drift(take, "left", "leftNeedle", stitch.start, stitch.end) <=
      HOLD &&
      everydayTake.drift(
        take,
        "right",
        "rightNeedle",
        stitch.start,
        stitch.end,
      ) <= HOLD,
  );
}

/** Pottery: both palms on the rising wall of the turning clay. */
function pottery(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  const chair = createSeat({ id: "chair", kind: "dining" });
  const placement = {
    at: { x: 0, y: 0, z: -0.3 },
    yaw: 0,
    fixed: true,
  } as const;
  const wheel = createPotteryWheel({ id: "wheel" });
  const props: IAutoMovieMotionHumanProp[] = [
    HumanObject.prop("chair", chair, placement),
    everydayTake.prop("wheel", wheel, { x: 0, y: 0, z: 0.25 }, undefined, true),
  ];
  const chain: IAutoMovieMotionHumanChain = HumanChain.subject("actor")
    .sit({ seat: HumanObject.seat(chair, placement), seconds: 1 })
    .registered("throwPottery", { wheel: "wheel", seconds: 2 });
  const take: HumanPerformance = play(`${label} pottery`, body, props, chain);
  const pull: IAutoMovieMotionHumanSegment = named(take, "throwPottery")[0]!;
  let rise: number = -1;
  let monotone: boolean = true;
  const palms: readonly IPalm[] = [
    { side: "right", face: "outside" },
    { side: "left", face: "inside" },
  ];
  const from: number = pull.start + ((pull.end - pull.start) * 3) / 24;
  const gap: (palm: IPalm, t: number) => number = (
    palm: IPalm,
    t: number,
  ): number =>
    Vector3.distance(
      take.bones("actor", t).get(`${palm.side}Hand`)!.worldPosition,
      Vector3.add(everydayTake.point(take, wheel, "wheel", palm.face, t), {
        x: 0,
        y: take.state("wheel", t)["raise"] ?? 0,
        z: 0,
      }),
    );
  let touch: number = 0;
  for (let i: number = 3; i <= 21; ++i) {
    const t: number = pull.start + ((pull.end - pull.start) * i) / 24;
    const raised: number = take.state("wheel", t)["raise"] ?? 0;
    monotone &&= raised >= rise - 1e-9;
    rise = raised;
    for (const palm of palms)
      touch = Math.max(touch, Math.abs(gap(palm, t) - gap(palm, from)));
  }
  checks.check(
    `${label}: the wall rises monotonically`,
    monotone && rise > 0.05,
  );
  checks.check(
    `${label}: both palms stay on the wall as it rises (${touch.toFixed(3)} m)`,
    touch <= PALM,
  );
  checks.check(
    `${label}: the head turns`,
    Math.abs(take.state("wheel", pull.end)["head"] ?? 0) > 360,
  );
}

/** A meter and its beats' directions. */
interface IFigure {
  /** The meter. */
  meter: IAutoMovieMotionHumanConduct.Meter;

  /** Each beat's direction into its ictus. */
  directions: readonly Direction[];
}

/** A beat's direction into its ictus, "in" toward the body's midline. */
type Direction = "down" | "in" | "out" | "up";

/** A palm and the wall face it lies on. */
interface IPalm {
  /** The hand. */
  side: "left" | "right";

  /** The wheel's face. */
  face: "outside" | "inside";
}

/** One scenario of the spec. */
interface IScene {
  /** Its name. */
  label: string;

  /** Its run on one body. */
  run: (
    body: IAutoMovieMotionHumanBody,
    label: string,
    checks: motionComplaints.IGatherer,
  ) => void;
}

/** The scenarios. */
const SCENES: readonly IScene[] = [
  { label: "painting", run: painting },
  { label: "conducting", run: conducting },
  { label: "sewing", run: sewing },
  { label: "knitting", run: knitting },
  { label: "pottery", run: pottery },
];

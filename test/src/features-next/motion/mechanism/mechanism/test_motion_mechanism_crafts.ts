import {
  createCraftTool,
  createEasel,
  createPalette,
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
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HUMAN_LEXICON } from "@automovie/motions/internal";

import { everydayTake } from "../../../../features/internal/everydayTake";
import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/** A working point lies on its surface within this, metres. */
const ON: number = 0.005;
/** A held prop drifts at most this in its hand's frame, metres. */
const HOLD: number = 0.005;
/** The conducting tempo, beats per minute. */
const BPM: number = 120;

/**
 * Standing crafts (#3996): painting at an easel, conducting and sewing.
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
 * Knitting and pottery, seated, are 	est_human_motion_crafts_seated's.
 * Every take passes the shipped verdicts, which include prop and body
 * penetration: no needle passes through the holding hand.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario, the bodies and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Composes pickUp, write, workHeld, conduct and throwPottery and reads displayed tool tips, surfaces, palms and articulation states.
 * @evidence contracts/development/testing.md#independent-expectations Stroke points, beat instants and figure directions are the author's and Rudolf's; tolerances are named.
 * @evidence contracts/development/testing.md#distinguishing-cases Three meters, reload against stroke, a canvas within against beyond reach.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_mechanism_crafts(): void {
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
  everydayTake.clean(label, take);
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
      { x: 0, y: centre - 1.35, z: 0.45 },
      undefined,
      true,
    ),
    everydayTake.prop("palette", palette, { x: 0.12, y: 0.95, z: 0.3 }),
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
        duration: 0.4,
        hand: "right",
      })
      .registered("write", {
        tool: "brush",
        tip: "tip",
        on: "easel",
        surface: "canvas",
        stroke,
        duration: 0.8,
        hand: "right",
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
  // A refusal is checked once, on the first body.
  if (label.startsWith("m-average")) {
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
            duration: 0.5,
            hand: "right",
          }),
        Object.values(HUMAN_LEXICON).flat(),
      ),
    );
    checks.check(
      `${label}: a canvas beyond reach is refused`,
      far !== undefined && far.kind === "reach",
    );
  }
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
        // The ictus is the tip's lowest point: the lowest within a quarter
        // beat either side falls within a frame of the beat.
        let lowest: number = beat;
        let low: number = Infinity;
        // Read at film frames, the precision the check asks, out to a quarter
        // beat either side.
        const frames: number = Math.ceil((period / 4) * 24);
        for (let i: number = -frames; i <= frames; ++i) {
          const t: number = beat + i / 24;
          const y: number = tip(t).y;
          if (y < low) {
            low = y;
            lowest = t;
          }
        }
        checks.check(
          `${label} ${figure.meter}: beat ${b + 1}'s ictus falls on its instant (${(lowest - beat).toFixed(3)} s)`,
          Math.abs(lowest - beat) <= 1 / 24,
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
    everydayTake.prop("cloth", cloth, { x: 0.1, y: 1.05, z: 0.38 }),
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
        duration: 0.4,
        hand: "right",
      })
      .registered("workHeld", {
        prop: "needle",
        hand: "right",
        at: { out: 0.35, up: shoulder - 0.05, forward: reach * 0.5 },
        duration: 0.5,
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

/** A meter and its beats' directions. */
interface IFigure {
  /** The meter. */
  meter: IAutoMovieMotionHumanConduct.Meter;

  /** Each beat's direction into its ictus. */
  directions: readonly Direction[];
}

/** A beat's direction into its ictus, "in" toward the body's midline. */
type Direction = "down" | "in" | "out" | "up";

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
];

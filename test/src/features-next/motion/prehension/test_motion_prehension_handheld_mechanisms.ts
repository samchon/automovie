import {
  AutoMovieArchetypeUmbrellaRunner,
  createFoldingKnife,
  createPalette,
  createScissors,
  createUmbrella,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance, HumanRefusal } from "@automovie/motions";
import { HUMAN_LEXICON, HumanHand } from "@automovie/motions/internal";

import { everydayTake } from "../../../features/internal/everydayTake";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** A hand stays on the part it works within this, metres. */
const ON: number = 0.03;
/** A held prop drifts at most this in its hand's frame, metres. */
const HOLD: number = 0.005;
/** A cut point lies on its authored line within this, metres. */
const LINE: number = 0.005;
/** Degrees of travel read as shut or fully open. */
const SHUT: number = 0.5;

/**
 * Hand-worked mechanisms (#4013): an umbrella opened by its runner and
 * shared walking, scissors cutting along a line, a folding knife flicked
 * open, locked and closed.
 *
 * Scenarios, on m-average and f-small:
 * 1. Umbrella, held in the right hand: the left hand pushes the runner from
 *    furled to open and stays on it; every rib's opening follows the
 *    runner and reaches the open angle with it; raised over the head and
 *    walked beside a partner, the canopy stays above both heads and spans
 *    both. A runner beyond the hand's reach is refused.
 * 2. Scissors, right-handed on m-average and left-handed on f-small: three
 *    closures cut across a stretched ribbon along an authored line; each
 *    closure brings the blades together with the thumb on its ring, each
 *    cut point lies further along the line, and at the last the ribbon
 *    separates into its tied half and its loose half, which falls. Driving scissors the hand does not
 *    hold is refused.
 * 3. Folding knife: the blade swings from closed to open and stays locked
 *    open through the next act, then closes, the knife held still in the
 *    palm throughout.
 * Every take passes the shipped verdicts, which include prop and body
 * penetration: no blade passes through the holding hand.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario, the bodies, the handedness and the refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Composes pickUp, workHeld with a pushing hand, operate, write and walk and reads displayed hands, props and articulation states.
 * @evidence contracts/development/testing.md#independent-expectations The open angle and the line are the archetype's and the author's; tolerances are named.
 * @evidence contracts/development/testing.md#distinguishing-cases Right against left hand, furled against open, open against closed, reachable against distant runner, held against unheld scissors.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_prehension_handheld_mechanisms(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const side: AutoMovieHumanSide = name === "m-average" ? "right" : "left";
    for (const scene of SCENES)
      try {
        scene.run(body, `${name} ${scene.label}`, side, checks);
      } catch (error: unknown) {
        checks.check(
          `${name} ${scene.label} refused: ${everydayTake.describe(error)}`,
          false,
        );
      }
  }
  checks.assert("handheld mechanisms");
}

/** The take with the shipped verdicts. */
function play(
  label: string,
  body: IAutoMovieMotionHumanBody,
  props: readonly IAutoMovieMotionHumanProp[],
  chain: IAutoMovieMotionHumanChain,
  others: readonly everydayTake.IOther[] = [],
): HumanPerformance {
  const take: HumanPerformance = everydayTake.perform(
    `handheld-${label}`,
    body,
    props,
    chain,
    Object.values(HUMAN_LEXICON).flat(),
    others,
  );
  everydayTake.clean(label, take);
  return take;
}

/** The segments of one law, in order. */
function named(
  take: HumanPerformance,
  law: string,
  subject: string = "actor",
): IAutoMovieMotionHumanSegment[] {
  return take
    .segments(subject)
    .filter((s: IAutoMovieMotionHumanSegment): boolean => s.law.name === law);
}

/** The umbrella opened, raised and shared on a walk. */
function umbrella(
  body: IAutoMovieMotionHumanBody,
  label: string,
  _side: AutoMovieHumanSide,
  checks: motionComplaints.IGatherer,
): void {
  const model = createUmbrella({ id: "umbrella" });
  const runner: IAutoMovieAffordance = model.affordances!.find(
    (a: IAutoMovieAffordance): boolean => a.id === "runner",
  )!;
  const at: IAutoMovieVector3 = { x: -0.25, y: 0.9, z: 0.3 };
  const props: IAutoMovieMotionHumanProp[] = [
    everydayTake.prop("umbrella", model, at),
  ];
  const shoulder: number = body.measure.shoulderHeight;
  // Held so the grip and the runner's open stop, the free hand's farthest
  // push, sit evenly about the shoulders: the grip half the umbrella's own
  // grip-to-stop length below, the stop half above, for any umbrella and
  // body. `stop` is how far below the shoulder the umbrella's origin goes.
  const grip: IAutoMovieAffordance = model.affordances!.find(
    (a: IAutoMovieAffordance): boolean => a.id === "grip",
  )!;
  const stop: number =
    (runner.frame.translation.y + runner.travel! + grip.frame.translation.y) /
    2;
  // Sharing one umbrella the two walk side by side, the holder's raised arm
  // between them: each shoulder's breadth with its arm, and room for the
  // holder's elbow, which can stand an upper arm out from the shoulder.
  const apart: number =
    2 * (body.measure.shoulderHalfWidth + body.measure.upperArmRadius) +
    body.measure.upperArm;
  // The shaft stands just before the chest: half its depth, then the breadth
  // of the hand closed around the shaft.
  const before: number =
    body.measure.chestDepth / 2 + everydayTake.BREADTH * body.measure.hand;
  const chain: IAutoMovieMotionHumanChain = HumanChain.subject("actor")
    .stand()
    .pickUp({ prop: "umbrella", handle: "grip", hand: "right", lift: 0.05 })
    .registered("workHeld", {
      prop: "umbrella",
      // Held on the midline, the grip and the runner's stop as near both
      // shoulders as the chest allows.
      at: { out: 0, up: shoulder - stop, forward: before },
      duration: 0.4,
    })
    .registered("workHeld", {
      prop: "umbrella",
      hand: "right",
      drive: [{ articulation: "runner", to: runner.travel! }],
      push: "runner",
      duration: 0.8,
    })
    .registered("workHeld", {
      prop: "umbrella",
      // Raised for two: the shaft midway between the sharers' midlines, the
      // grip at the shoulder's height, just before the chest.
      at: {
        out: apart / 2,
        up: shoulder - grip.frame.translation.y,
        forward: before,
      },
      duration: 0.4,
    })
    .walk({ to: { x: 0, y: 0, z: 2 } }, "share");
  const partner: everydayTake.IOther = {
    subject: "partner",
    body,
    at: { x: -apart, y: 0, z: 0 },
    yaw: 0,
    // The partner steps off with the holder, side by side under it.
    chain: HumanChain.subject("partner")
      .stand({ hold: 0.5, sway: 0 })
      .walk({ to: { x: -apart, y: 0, z: 2 } })
      .sync({ of: "share", event: "start" }),
  };
  const take: HumanPerformance = play(label, body, props, chain, [partner]);
  const operate: IAutoMovieMotionHumanSegment = named(take, "workHeld")[1]!;
  let last: number = -1;
  let follows: boolean = true;
  let stays: number = 0;
  for (let i: number = 0; i <= 24; ++i) {
    const t: number = operate.start + ((operate.end - operate.start) * i) / 24;
    // The ribs as the runner's travel poses the umbrella.
    const posed: ReturnType<typeof model.articulate> = model.articulate({
      runner: take.state("umbrella", t)["runner"] ?? 0,
    });
    const rib: number = posed.travel("rib0");
    follows &&= rib >= last - 1e-6;
    for (let k: number = 1; k < AutoMovieArchetypeUmbrellaRunner.RIBS; ++k)
      follows &&= Math.abs(posed.travel(`rib${k}`) - rib) <= 1e-6;
    last = rib;
  }
  const end: Record<string, number> = take.state("umbrella", operate.end);
  checks.check(
    `${label}: the runner travels from furled to open`,
    Math.abs((end["runner"] ?? 0) - runner.travel!) <= 1e-6 &&
      (take.state("umbrella", operate.start)["runner"] ?? 0) <= 1e-6,
  );
  checks.check(
    `${label}: every rib opens with the runner to the open angle`,
    follows &&
      Math.abs(
        model.articulate({ runner: end["runner"] ?? 0 }).travel("rib0") -
          AutoMovieArchetypeUmbrellaRunner.OPEN,
      ) <= SHUT,
  );
  // The left hand on the runner through the push's middle half.
  for (let i: number = 6; i <= 18; ++i) {
    const t: number = operate.start + ((operate.end - operate.start) * i) / 24;
    const travel: number = take.state("umbrella", t)["runner"] ?? 0;
    const frame: IAutoMovieRigidTransform = take.prop("umbrella", t);
    const point: IAutoMovieVector3 = Vector3.add(
      frame.position,
      Quaternion.rotateVector(
        frame.rotation,
        Vector3.add(runner.frame.translation, { x: 0, y: travel, z: 0 }),
      ),
    );
    // The hand's grip site, where it closes on the runner.
    const hand: IAutoMovieResolvedBone = take
      .bones("actor", t)
      .get("leftHand")!;
    const site: IAutoMovieVector3 = Vector3.add(
      hand.worldPosition,
      Quaternion.rotateVector(
        hand.worldRotation,
        HumanHand.offset(body, "left", "grip").point,
      ),
    );
    stays = Math.max(stays, Vector3.distance(site, point));
  }
  checks.check(
    `${label}: the pushing hand stays on the runner (${stays.toFixed(3)} m)`,
    stays <= ON,
  );
  const walk: IAutoMovieMotionHumanSegment = named(take, "walk")[0]!;
  const radius: number = createUmbrella.MODELS.classic.canopy! / 2;
  let covered: boolean = true;
  let lowest: number = Infinity;
  let widest: number = 0;
  for (let i: number = 0; i <= 12; ++i) {
    const t: number = walk.start + ((walk.end - walk.start) * i) / 12;
    const frame: IAutoMovieRigidTransform = take.prop("umbrella", t);
    const top: IAutoMovieVector3 = Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, {
        x: 0,
        y: createUmbrella.MODELS.classic.length!,
        z: 0,
      }),
    );
    for (const who of ["actor", "partner"]) {
      const head: IAutoMovieVector3 = take
        .bones(who, t)
        .get("head")!.worldPosition;
      const over: number = top.y - head.y;
      const off: number = Vector3.distance({ ...top, y: 0 }, { ...head, y: 0 });
      lowest = Math.min(lowest, over);
      widest = Math.max(widest, off);
      covered &&= over > 0.15 && off < radius;
    }
  }
  checks.check(
    `${label}: the canopy stays above both heads on the walk (lowest ${lowest.toFixed(2)} m over a head, widest ${widest.toFixed(2)} m off its axis)`,
    covered,
  );
  checks.check(
    `${label}: the umbrella stays in the palm through the walk`,
    everydayTake.drift(take, "right", "umbrella", walk.start, walk.end) <= HOLD,
  );
  // A refusal is checked once, on the first body.
  if (label.startsWith("m-average")) {
    const far: HumanRefusal | undefined = everydayTake.refusal(() =>
      everydayTake.perform(
        `handheld-${label}-far`,
        body,
        props,
        // Raised overhead first, the runner rises beyond the free arm.
        HumanChain.subject("actor")
          .stand()
          .pickUp({
            prop: "umbrella",
            handle: "grip",
            hand: "right",
            lift: 0.05,
          })
          .registered("workHeld", {
            prop: "umbrella",
            at: { out: 0.05, up: shoulder + 0.25, forward: 0.15 },
            duration: 0.4,
          })
          .registered("workHeld", {
            prop: "umbrella",
            hand: "right",
            drive: [{ articulation: "runner", to: runner.travel! }],
            push: "runner",
            duration: 0.8,
          }),
        Object.values(HUMAN_LEXICON).flat(),
      ),
    );
    checks.check(
      `${label}: a runner beyond the hand's reach is refused`,
      far !== undefined && far.kind === "reach",
    );
  }
}

/** Scissors cutting a stretched ribbon across in three closures. */
function scissors(
  body: IAutoMovieMotionHumanBody,
  label: string,
  side: AutoMovieHumanSide,
  checks: motionComplaints.IGatherer,
): void {
  const sign: number = side === "right" ? -1 : 1;
  const tool = createScissors({ id: "scissors" });
  const sheet = createPalette({ id: "sheet", kind: "ribbon" });
  const width: number = 0.4;
  const props: IAutoMovieMotionHumanProp[] = [
    everydayTake.prop("scissors", tool, { x: sign * 0.2, y: 1.0, z: 0.3 }),
    // The ribbon's tied half and its loose half meet at the cut.
    everydayTake.prop(
      "sheet",
      sheet,
      { x: -sign * 0.1 - width / 2, y: 1.1, z: 0.4 },
      undefined,
      true,
    ),
    everydayTake.prop("loose", createPalette({ id: "loose", kind: "ribbon" }), {
      x: -sign * 0.1 + width / 2,
      y: 1.1,
      z: 0.4,
    }),
  ];
  // The authored line across the ribbon at the tied half's free end.
  const edge: number = (width - 0.1) / 2;
  const line: readonly (readonly [number, number])[] = [
    [edge, 0.024],
    [edge, 0.008],
    [edge, -0.008],
    [edge, -0.024],
  ];
  let chain: IAutoMovieMotionHumanChain = HumanChain.subject("actor")
    .stand()
    .pickUp({ prop: "scissors", handle: "fingerRing", hand: side, lift: 0.05 });
  for (let k: number = 0; k < 3; ++k)
    chain = chain
      .registered("workHeld", {
        prop: "scissors",
        hand: side,
        drive: [
          {
            articulation: "pivot",
            to: 30,
            by: { digit: "thumb", site: "thumbRing" },
          },
        ],
        duration: 0.3,
      })
      .registered("write", {
        tool: "scissors",
        tip: "cut",
        on: "sheet",
        surface: "face",
        stroke: [line[k]!, line[k + 1]!],
        seconds: 0.4,
        side,
        drive: [
          {
            articulation: "pivot",
            to: 0,
            by: { digit: "thumb", site: "thumbRing" },
          },
        ],
        ...(k === 2 ? { release: ["loose"] } : {}),
      });
  chain = chain.stand({ hold: 0.8, sway: 0 });
  const take: HumanPerformance = play(`${label} ${side}`, body, props, chain);
  const strokes: IAutoMovieMotionHumanSegment[] = named(take, "write");
  const face: IAutoMovieAffordance = sheet.affordances!.find(
    (a: IAutoMovieAffordance): boolean => a.id === "face",
  )!;
  let progress: number = Infinity;
  strokes.forEach((stroke: IAutoMovieMotionHumanSegment, k: number): void => {
    const shut: number = stroke.start + (stroke.end - stroke.start) * 0.75;
    const travel: number = take.state("scissors", shut)["pivot"] ?? 0;
    checks.check(
      `${label}: closure ${k + 1} brings the blades together`,
      travel <= SHUT,
    );
    const cut: IAutoMovieVector3 = everydayTake.point(
      take,
      tool,
      "scissors",
      "cut",
      shut,
    );
    const sheetFrame: IAutoMovieRigidTransform = take.prop("sheet", shut);
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(
        Quaternion.multiply(sheetFrame.rotation, face.frame.rotation),
      ),
      Vector3.subtract(
        cut,
        Vector3.add(
          sheetFrame.position,
          Quaternion.rotateVector(sheetFrame.rotation, face.frame.translation),
        ),
      ),
    );
    checks.check(
      `${label}: cut ${k + 1} lies on the line`,
      Math.abs(local.x - edge) <= LINE && Math.abs(local.y) <= LINE,
    );
    checks.check(
      `${label}: cut ${k + 1} advances along the line`,
      local.z < progress,
    );
    progress = local.z;
    const thumb: IAutoMovieVector3 =
      take.bones("actor", shut).get(`${side}ThumbDistal`)?.worldPosition ??
      take.bones("actor", shut).get(`${side}Hand`)!.worldPosition;
    checks.check(
      `${label}: the thumb works its ring at closure ${k + 1}`,
      Vector3.distance(
        thumb,
        everydayTake.point(take, tool, "scissors", "thumbRing", shut),
      ) <= ON,
    );
  });
  const cut: number = strokes[2]!.end;
  checks.check(
    `${label}: the cut ribbon separates, its loose end falling away`,
    take.prop("loose", take.duration).position.y <
      take.prop("loose", cut).position.y - 0.2 &&
      Vector3.distance(
        take.prop("sheet", take.duration).position,
        take.prop("sheet", 0).position,
      ) <= 1e-6,
  );
  checks.check(
    `${label}: the scissors stay in the palm`,
    everydayTake.drift(
      take,
      side,
      "scissors",
      strokes[0]!.start,
      take.duration,
    ) <= HOLD,
  );
  // A refusal is checked once, on the first body.
  if (label.startsWith("m-average")) {
    const unheld: HumanRefusal | undefined = everydayTake.refusal(() =>
      everydayTake.perform(
        `handheld-${label}-unheld`,
        body,
        props,
        HumanChain.subject("actor")
          .stand()
          .registered("workHeld", {
            prop: "scissors",
            hand: side,
            drive: [
              {
                articulation: "pivot",
                to: 30,
                by: { digit: "thumb", site: "thumbRing" },
              },
            ],
            duration: 0.3,
          }),
        Object.values(HUMAN_LEXICON).flat(),
      ),
    );
    checks.check(
      `${label}: scissors the hand does not hold are refused`,
      unheld !== undefined,
    );
  }
}

/** A folding knife opened, locked through a pause, then closed. */
function knife(
  body: IAutoMovieMotionHumanBody,
  label: string,
  side: AutoMovieHumanSide,
  checks: motionComplaints.IGatherer,
): void {
  const model = createFoldingKnife({ id: "knife" });
  const sign: number = side === "right" ? -1 : 1;
  const props: IAutoMovieMotionHumanProp[] = [
    everydayTake.prop("knife", model, { x: sign * 0.2, y: 1.0, z: 0.3 }),
  ];
  const chain: IAutoMovieMotionHumanChain = HumanChain.subject("actor")
    .stand()
    .pickUp({ prop: "knife", handle: "grip", hand: side, lift: 0.1 })
    .registered("workHeld", {
      prop: "knife",
      hand: side,
      drive: [{ articulation: "blade", to: 180 }],
      duration: 0.25,
    })
    .stand({ hold: 0.6, sway: 0 })
    .registered("workHeld", {
      prop: "knife",
      hand: side,
      drive: [{ articulation: "blade", to: 0 }],
      duration: 0.6,
    });
  const take: HumanPerformance = play(`${label} knife`, body, props, chain);
  const works: IAutoMovieMotionHumanSegment[] = named(take, "workHeld");
  checks.check(
    `${label}: the blade swings open`,
    Math.abs((take.state("knife", works[0]!.end)["blade"] ?? 0) - 180) <= SHUT,
  );
  const pause: IAutoMovieMotionHumanSegment = take
    .segments("actor")
    .find(
      (s: IAutoMovieMotionHumanSegment): boolean =>
        s.start >= works[0]!.end - 1e-6 && s.law.name === "stand",
    )!;
  checks.check(
    `${label}: the blade stays locked open`,
    Math.abs(
      (take.state("knife", (pause.start + pause.end) / 2)["blade"] ?? 0) - 180,
    ) <= SHUT,
  );
  checks.check(
    `${label}: the blade closes`,
    (take.state("knife", works[1]!.end)["blade"] ?? 180) <= SHUT,
  );
  checks.check(
    `${label}: the knife stays in the palm`,
    everydayTake.drift(take, side, "knife", works[0]!.start, take.duration) <=
      HOLD,
  );
}

/** One scenario of the spec. */
interface IScene {
  /** Its name. */
  label: string;

  /** Its run on one body with the working hand. */
  run: (
    body: IAutoMovieMotionHumanBody,
    label: string,
    side: AutoMovieHumanSide,
    checks: motionComplaints.IGatherer,
  ) => void;
}

/** The scenarios. */
const SCENES: readonly IScene[] = [
  { label: "umbrella", run: umbrella },
  { label: "scissors", run: scissors },
  { label: "knife", run: knife },
];

import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { HumanFoot, poseBones } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../internal/motionHumanBody";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** The existing displayed foot-pivot fixture's 5 mm bound, in metres. */
const CONTACT: number = 0.005;

/** A sole measurement from the actual evaluated foot transform. */
type Sole = "ball" | "heel";

/** A composed actor's world-pose reader at shares of the last action. */
interface ITake {
  segment: IAutoMovieMotionHumanSegment;
  bones(share: number): ReturnType<typeof poseBones>;
  sole(share: number, side: "left" | "right", socket: Sole): IAutoMovieVector3;
}

/**
 * Exercise footwork distinguishes a fixed sole pivot from moving both feet into
 * a new lead. Karate and tai chi use distinct planted weight transfers.
 *
 * Scenarios:
 *
 * 1. A 15-degree pivot on each lead leaves its forefoot fixed while the heel
 *    traces the expected arc.
 * 2. Reversing the lead in place moves the former rear foot first and reverses the
 *    feet's order along the line.
 * 3. Karate and tai chi each travel forward and back over a planted stance. Their
 *    hip rotation and arm carriage differ.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the take types, anchor, distinguishing movements and the contact bound.
 * @evidence contracts/development/testing.md#behavioral-verification Reads world positions of the actual evaluated heel, ball, hips and hands, including contact boundaries and samples between them. Contact checks are discrete.
 * @evidence contracts/development/testing.md#independent-expectations A fixed ball and a heel chord of the authored turn distinguish rotation about an ankle. Foot order reverses in a lead exchange. Weight transfer changes the hip's location relative to two stationary sole points.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both leads over small and average rigs, the two kinds of footwork, and contrasting rhythms and arm goals in the two form phrases.
 * @evidence contracts/development/testing.md#execution-ownership Every take uses the public HumanChain and HumanPerformance, and observes displayed poses through FK.
 */
export function test_motion_strike_striking_support(): void {
  for (const [name, lead, turn] of [
    ["f-small", "right", -15],
    ["m-average", "left", 15],
  ] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const rear: "left" | "right" = lead === "left" ? "right" : "left";
    const stance: "orthodox" | "southpaw" =
      lead === "left" ? "orthodox" : "southpaw";
    const pivot: ITake = take(
      body,
      HumanChain.subject("actor")
        .guard({ duration: 0.8, stance, style: "boxing" })
        .step({ direction: "forward", turn, guard: "boxing" }),
    );
    const ball: IAutoMovieVector3 = pivot.sole(0, lead, "ball");
    const heel: IAutoMovieVector3 = pivot.sole(0, lead, "heel");
    for (const share of [0.125, 0.5, 0.875, 1])
      TestValidator.predicate(
        `${name} fixed ball at ${share}`,
        vclose(pivot.sole(share, lead, "ball"), ball, CONTACT),
      );
    TestValidator.predicate(
      `${name} pivot displaces heel by the turn's chord`,
      nclose(
        horizontal(heel, pivot.sole(1, lead, "heel")),
        2 * horizontal(heel, ball) * Math.sin((Math.abs(turn) * Math.PI) / 360),
        CONTACT,
      ),
    );
    TestValidator.predicate(
      `${name} pivot lifts heel while opposite leg swings`,
      pivot.sole(0.5, lead, "heel").y > heel.y &&
        pivot.sole(0.5, rear, "ball").y > pivot.sole(0, rear, "ball").y,
    );

    const exchange: ITake = take(
      body,
      HumanChain.subject("actor")
        .guard({ duration: 0.8, stance, style: "kickboxing" })
        .step({ direction: "forward", lead: rear, guard: "kickboxing" }),
    );
    TestValidator.predicate(
      `${name} old lead stays while rear foot travels`,
      vclose(
        exchange.sole(0.25, lead, "ball"),
        exchange.sole(0, lead, "ball"),
        CONTACT,
      ) &&
        exchange.sole(0.25, rear, "ball").y > exchange.sole(0, rear, "ball").y,
    );
    TestValidator.predicate(
      `${name} new lead stays after landing`,
      vclose(
        exchange.sole(0.75, rear, "ball"),
        exchange.sole(1, rear, "ball"),
        CONTACT,
      ),
    );
    TestValidator.predicate(
      `${name} reversed foot order along film forward`,
      exchange.sole(0, lead, "ball").z > exchange.sole(0, rear, "ball").z &&
        exchange.sole(1, rear, "ball").z > exchange.sole(1, lead, "ball").z,
    );

    const karate = form(body, lead, "karateStanceTransfer");
    const taiChi = form(body, lead, "taiChiTransfer");
    TestValidator.predicate(
      `${name} karate turns while tai chi maintains heading`,
      karate.yawChange > taiChi.yawChange && nclose(taiChi.yawChange, 0, 1e-6),
    );
    TestValidator.predicate(
      `${name} tai chi uses a longer transfer window`,
      taiChi.duration > karate.duration,
    );
  }
}

/** Build one actual performance at world forward and read its last action. */
function take(
  body: IAutoMovieMotionHumanBody,
  chain: ReturnType<typeof HumanChain.subject>,
): ITake {
  const film: HumanPerformance = new HumanPerformance({
    seed: "exercise-striking-support",
    performers: [
      {
        subject: "actor",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: chain.node,
  });
  const segment: IAutoMovieMotionHumanSegment = film.segments("actor").at(-1)!;
  const bones = (share: number): ReturnType<typeof poseBones> =>
    poseBones(
      body,
      film.pose("actor", segment.start + segment.plan.duration * share),
    );
  return {
    segment,
    bones,
    sole: (
      share: number,
      side: "left" | "right",
      socket: Sole,
    ): IAutoMovieVector3 => {
      const foot = bones(share).get(`${side}Foot`)!;
      const placement: IAutoMovieMotionHumanFoot.IPlacement = {
        ankle: foot.worldPosition,
        rotation: foot.worldRotation,
      };
      return HumanFoot.point(body, side, socket, placement);
    },
  };
}

/**
 * Observe a form's paired plant, forward and backward transfers and arm
 * movement.
 */
function form(
  body: IAutoMovieMotionHumanBody,
  lead: "left" | "right",
  kind: "karateStanceTransfer" | "taiChiTransfer",
): { yawChange: number; duration: number } {
  const scene: ITake = take(
    body,
    HumanChain.subject("actor").martialArt({ kind, lead }),
  );
  const at = (name: string): number =>
    scene.segment.plan.events.find((event) => event.name === name)!.share;
  const ready: number = at("ready");
  const fore: number = at("stroke");
  const back: number = at("strokeEnd");
  const positions: number[] = [
    ready,
    (ready + fore) / 2,
    fore,
    (fore + back) / 2,
    back,
  ];
  for (const side of ["left", "right"] as const) {
    const ball: IAutoMovieVector3 = scene.sole(ready, side, "ball");
    for (const share of positions)
      TestValidator.predicate(
        `${kind} ${lead} lead, ${side} ball stays planted at ${share}`,
        vclose(scene.sole(share, side, "ball"), ball, CONTACT),
      );
  }
  const entered: ReturnType<typeof poseBones> = scene.bones(ready);
  const front: ReturnType<typeof poseBones> = scene.bones(fore);
  const rear: ReturnType<typeof poseBones> = scene.bones(back);
  const hipsFront = front.get("hips")!;
  const hipsBack = rear.get("hips")!;
  TestValidator.predicate(
    `${kind} ${lead} lead travels forward and back over both anchors`,
    hipsFront.worldPosition.z > entered.get("hips")!.worldPosition.z &&
      hipsBack.worldPosition.z < entered.get("hips")!.worldPosition.z,
  );
  for (const side of ["left", "right"] as const)
    TestValidator.predicate(
      `${kind} ${lead} lead moves the ${side} wrist relative to the torso`,
      !nclose(
        front.get(`${side}Hand`)!.worldPosition.z -
          front.get("chest")!.worldPosition.z,
        rear.get(`${side}Hand`)!.worldPosition.z -
          rear.get("chest")!.worldPosition.z,
        CONTACT,
      ),
    );
  return {
    yawChange: Math.abs(
      HumanFoot.heading(hipsFront.worldRotation) -
        HumanFoot.heading(hipsBack.worldRotation),
    ),
    duration: (back - ready) * scene.segment.plan.duration,
  };
}

/** Distance between points in the horizontal plane, in metres. */
function horizontal(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

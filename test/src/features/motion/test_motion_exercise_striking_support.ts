import { Vector3, wrapDegrees } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanFoot,
  HumanPerformance,
  poseBones,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/** The existing displayed foot-pivot fixture's 5 mm bound, in metres. */
const CONTACT: number = 0.005;

/** A sole measurement from the actual evaluated foot transform. */
type Sole = "ball" | "heel";

/** A composed actor's world-pose reader at shares of the last action. */
interface ITake {
  film: HumanPerformance;
  segment: IAutoMovieMotionHumanSegment;
  bones(share: number): ReturnType<typeof poseBones>;
  sole(share: number, side: "left" | "right", socket: Sole): IAutoMovieVector3;
}

/**
 * Exercise footwork distinguishes a fixed sole pivot from moving both feet
 * into a new lead. Karate and tai chi use distinct planted weight transfers.
 *
 * Scenarios:
 * 1. A 15-degree pivot on each lead leaves its forefoot fixed while the heel traces the expected arc.
 * 2. Reversing the lead in place moves the former rear foot first and reverses the feet's order along the line.
 * 3. Karate and tai chi each travel forward and back over a planted stance. Their hip rotation and arm carriage differ.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the take types, anchor, distinguishing movements and the contact bound.
 * @evidence contracts/development/testing.md#behavioral-verification Reads world positions of the actual evaluated heel, ball, hips and hands, including contact boundaries and samples between them. Contact checks are discrete.
 * @evidence contracts/development/testing.md#independent-expectations A fixed ball and a heel chord of the authored turn distinguish rotation about an ankle. Foot order reverses in a lead exchange. Weight transfer changes the hip's location relative to two stationary sole points.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both leads over small and average rigs, the two kinds of footwork, and contrasting rhythms and arm goals in the two form phrases.
 * @evidence contracts/development/testing.md#execution-ownership Every take uses the public HumanChain and HumanPerformance, and observes displayed poses through FK.
 */
export function test_motion_exercise_striking_support(): void {
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
        .guard({ seconds: 0.8, stance, style: "boxing" })
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
        .guard({ seconds: 0.8, stance, style: "kickboxing" })
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

/**
 * Cut from an ongoing foot transfer into another authored step. The old
 * bearing sole stays put through the first landing, then releases. The
 * incoming step claims the exact cut second and settles both feet on the floor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the support exchange and authored clock that distinguish a moving cut.
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed world sole, pelvis and chest transforms and the published ground windows on each side of the authored cut. The spatial samples are discrete.
 * @evidence contracts/development/testing.md#independent-expectations The same approach played without a cut supplies the missing outgoing pose. Independent floor, fixed sole and contact order expectations govern the next step.
 * @evidence contracts/development/testing.md#distinguishing-cases Repeats a straight reversal, a forefoot pivot into turn and a lead exchange into pivot with each lead on two bodies.
 * @evidence contracts/development/testing.md#execution-ownership Authors both actions through HumanChain and evaluates their world pose through public HumanPerformance and forward kinematics.
 */
export function test_motion_exercise_striking_support_cut(): void {
  const failures: string[] = [];
  for (const name of ["f-small", "m-average"] as const)
    for (const lead of ["left", "right"] as const) {
      const body = motionHumanBody(name);
      const rear = lead === "left" ? "right" : "left";
      const stance = lead === "left" ? "orthodox" : "southpaw";
      const turn = lead === "left" ? 15 : -15;
      for (const [kind, departing, arriving, cut, bearing] of [
        [
          "reversal",
          { direction: "forward" },
          { direction: "back" },
          0.3,
          rear,
        ],
        [
          "traveling turn",
          { direction: "forward", turn },
          { direction: "forward", turn, length: 0.06 },
          0.3,
          lead,
        ],
        [
          "pivot after lead exchange",
          { direction: "forward", lead: rear },
          { direction: "forward", turn },
          0.3,
          lead,
        ],
      ] as const) {
        const chain = HumanChain.subject("actor")
          .guard({ seconds: 0.8, stance, style: "boxing" })
          .step({ ...departing, guard: "boxing" });
        const before = take(body, chain);
        const after = take(
          body,
          chain.until({ share: cut }).step({ ...arriving, guard: "boxing" }),
        );
        const swinging = bearing === "left" ? "right" : "left";
        const label = `${name} ${lead} lead ${kind}`;
        const check = (problem: string, ok: boolean): void => {
          if (!ok) failures.push(`${label}: ${problem}`);
        };
        const supports = (
          take: ITake,
          share: number,
          side: "left" | "right",
        ): boolean =>
          take.segment.plan.contacts.some(
            (contact) =>
              contact.part === `${side}Foot` &&
              contact.support.kind === "ground" &&
              contact.from <= share &&
              share <= contact.to,
          );
        const seam = before.segment.start + before.segment.plan.duration * cut;
        check(
          `cut ${seam} arrives at ${after.segment.start}`,
          nclose(after.segment.start, seam, 1e-9) &&
            nclose(after.film.segments("actor")[1]!.end, seam, 1e-9),
        );
        const anchor = before.sole(cut, bearing, "ball");
        const airborne = before.sole(cut, swinging, "ball");
        check(
          `approach has its chosen bearing foot and a clear swing (${airborne.y} m)`,
          supports(before, cut, bearing) &&
            !supports(before, cut, swinging) &&
            airborne.y > anchor.y + CONTACT,
        );
        for (const share of [0, 0.125, 0.375]) {
          const slip = Vector3.distance(
            after.sole(share, bearing, "ball"),
            anchor,
          );
          check(
            `at ${share}, bearing ball slips ${slip} m or support is misclassified`,
            slip <= CONTACT &&
              supports(after, share, bearing) &&
              !supports(after, share, swinging),
          );
        }
        const pivot = kind === "pivot after lead exchange";
        const release = 0.65;
        const moved = Vector3.distance(
          after.sole(release, bearing, "ball"),
          anchor,
        );
        check(
          `at ${release}, old support motion is ${moved} m with the wrong support order`,
          pivot
            ? moved <= CONTACT &&
                supports(after, release, bearing) &&
                !supports(after, release, swinging)
            : moved > CONTACT &&
                !supports(after, release, bearing) &&
                supports(after, release, swinging) &&
                nclose(
                  after.sole(release, swinging, "ball").y,
                  anchor.y,
                  CONTACT,
                ),
        );
        const landed = after.sole(1, swinging, "ball");
        check(
          `swing replants at ${landed.y} m with floor ${anchor.y} m`,
          nclose(landed.y, anchor.y, CONTACT) &&
            supports(after, 1, swinging) &&
            supports(after, 1, bearing),
        );
        const outgoing = before.bones(cut);
        const incoming = after.bones(0);
        for (const bone of ["hips", "chest"] as const) {
          const from = outgoing.get(bone)!;
          const to = incoming.get(bone)!;
          const position = Vector3.distance(
            from.worldPosition,
            to.worldPosition,
          );
          const heading = wrapDegrees(
            HumanFoot.heading(to.worldRotation) -
              HumanFoot.heading(from.worldRotation),
          );
          check(
            `${bone} jumps ${position} m and ${heading} degrees at the cut`,
            position <= CONTACT && nclose(heading, 0, 0.05),
          );
        }
      }
    }
  TestValidator.predicate(failures.join("\n"), failures.length === 0);
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
    film,
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

/** Observe a form's paired plant, forward and backward transfers and arm movement. */
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

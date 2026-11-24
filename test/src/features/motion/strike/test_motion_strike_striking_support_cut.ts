import { AutoMovieComposition, Vector3, wrapDegrees } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
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

/** The existing displayed foot-pivot fixture's 5 mm bound, in metres. */
const CONTACT: number = 0.005;

/** A sole measurement from the actual evaluated foot transform. */
type Sole = "ball" | "heel";

/** A composed actor's world-pose reader at shares of the last action. */
interface ITake {
  /** The whole performance the actor was placed in. */
  film: HumanPerformance;

  /** The actor's last placed action. */
  segment: IAutoMovieMotionHumanSegment;

  /** The displayed world bones at a share of the last action. */
  bones(share: number): ReturnType<typeof poseBones>;

  /** A displayed sole point, world metres, at a share of the last action. */
  sole(
    share: number,
    side: AutoMovieHumanSide,
    socket: Sole,
  ): IAutoMovieVector3;
}

/**
 * The public timeline and ground contacts agree when a footwork transfer is
 * interrupted by another step or by a different supported action.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States authored timing, observed support, movement and recipient coverage.
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed world sole and trunk transforms and the published ground windows on both sides of each cut. The spatial samples are discrete.
 * @evidence contracts/development/testing.md#independent-expectations The same approach without a cut supplies the outgoing pose and bearing anchor. The required release order, floor and cut time are checked independently of the entering law.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers straight reversal, traveling turn, stationary pivot, guard, punch, both kicking support assignments, a paired defence and an inadmissible cut. Supported cases mirror both leads on two body proportions.
 * @evidence contracts/development/testing.md#execution-ownership Uses public HumanChain and HumanPerformance with actual world FK.
 */
export function test_motion_strike_striking_support_cut(): void {
  verifyStepCuts();
  verifyRecipientCuts();
}

/**
 * Cut from an ongoing foot transfer into another authored step. The old bearing
 * sole stays put through the first landing, then releases. The incoming step
 * claims the exact cut second and settles both feet on the floor.
 */
function verifyStepCuts(): void {
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
          .guard({ duration: 0.8, stance, style: "boxing" })
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

/**
 * Each recipient of a step cut receives the displayed bearing foot and an
 * airborne foot. Check the actual sole and the live contact at the cut and its
 * return to the floor, with one true backing performer for the defence.
 */
function verifyRecipientCuts(): void {
  const failures: string[] = [];
  for (const name of ["f-small", "m-average"] as const)
    for (const lead of ["left", "right"] as const) {
      const body = motionHumanBody(name);
      const bearing = lead === "left" ? "right" : "left";
      const stance = lead === "left" ? "orthodox" : "southpaw";
      const before = HumanChain.subject("actor")
        .guard({ duration: 0.8, stance, style: "boxing" })
        .step({ direction: "forward", guard: "boxing" });
      const cut = 0.3;
      const approach = take(body, before);
      const start = before.until({ share: cut });
      const attacker = HumanChain.subject("opponent")
        .guard({ duration: 1.0, style: "boxing" })
        .punch(
          {
            technique: "straight",
            at: { kind: "person", subject: "actor", region: "face" },
          },
          "opponent-strike",
        );
      for (const [kind, act, other] of [
        ["guard", start.guard({ duration: 0.8, style: "boxing" })],
        ["punch", start.punch({ technique: "straight", at: { kind: "none" } })],
        [
          "kick using inherited support",
          start.kick({ technique: "round", leg: "lead", at: { kind: "none" } }),
        ],
        [
          "kick changing support",
          start.kick({ technique: "round", leg: "rear", at: { kind: "none" } }),
        ],
        [
          "defend",
          start.defend({ kind: "cover", against: "opponent-strike" }),
          attacker,
        ],
      ] as const) {
        const label = `${name} ${lead} lead ${kind}`;
        const check = (problem: string, ok: boolean): void => {
          if (!ok) failures.push(`${label}: ${problem}`);
        };
        let after: ITake;
        try {
          after = take(body, act, other);
        } catch (error) {
          failures.push(`${label}: ${String(error)}`);
          continue;
        }
        const seam =
          approach.segment.start + approach.segment.plan.duration * cut;
        check(
          `cut ${seam} arrives at ${after.segment.start}`,
          nclose(after.segment.start, seam, 1e-9) &&
            nclose(after.film.segments("actor")[1]!.end, seam, 1e-9),
        );
        const anchor = approach.sole(cut, bearing, "ball");
        const swing = approach.sole(cut, lead, "ball");
        for (const share of [0, 0.04]) {
          const slip = Vector3.distance(
            after.sole(share, bearing, "ball"),
            anchor,
          );
          check(
            `bearing at ${share} slides ${slip} m or loses support`,
            slip <= CONTACT && supports(after, share, bearing),
          );
        }
        const jump = Vector3.distance(after.sole(0, lead, "ball"), swing);
        check(
          `swing at the cut jumps ${jump} m or is claimed planted`,
          jump <= CONTACT && !supports(after, 0, lead),
        );
        const planted = after.sole(1, lead, "ball");
        check(
          `swing finishes at ${planted.y} m with floor ${anchor.y} m`,
          nclose(planted.y, anchor.y, CONTACT) &&
            supports(after, 1, lead) &&
            supports(after, 1, bearing),
        );
      }
      TestValidator.error(
        "footwork refuses a cut into an undeclared action",
        () => {
          take(body, start.stand({ hold: 0.8 }));
        },
      );
    }
  TestValidator.predicate(failures.join("\n"), failures.length === 0);
}

/** Whether a displayed take declares ground contact for the foot at a share. */
function supports(
  take: ITake,
  share: number,
  side: AutoMovieHumanSide,
): boolean {
  return take.segment.plan.contacts.some(
    (contact) =>
      contact.part === `${side}Foot` &&
      contact.support.kind === "ground" &&
      contact.from <= share &&
      share <= contact.to,
  );
}

/** Build one actual performance at world forward and read its last action. */
function take(
  body: IAutoMovieMotionHumanBody,
  chain: ReturnType<typeof HumanChain.subject>,
  opponent?: ReturnType<typeof HumanChain.subject>,
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
      ...(opponent === undefined
        ? []
        : [
            {
              subject: "opponent",
              body,
              at: { x: 0, y: 0, z: 1.35 },
              yaw: 180,
              proficiency: { level: "trained" } as const,
            },
          ]),
    ],
    composition:
      opponent === undefined
        ? chain.node
        : AutoMovieComposition.parallel(opponent.node, chain.node),
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
      side: AutoMovieHumanSide,
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

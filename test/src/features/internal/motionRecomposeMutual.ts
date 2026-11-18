import { createBall, createDrinkware } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanMutual,
  HumanObject,
  HumanPerformance,
  seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "./motionHumanBody";

type Base = "standing" | "seated";
type Subject = "a" | "b";

interface IComposition {
  node: IAutoMovieMotionHumanPerformance.IInput["composition"];
}

interface IWorldPlacement {
  at: IAutoMovieVector3;
  yaw: number;
}

/**
 * The seated pair keeps its pelvis within 10 mm of its original seat over
 * a handshake, mug handover, cheek kiss and pick-up of a mug or football.
 * The clasp is shared, the wrists stay within a mean hand length at
 * contact and the closed grip drifts no more than 10 mm (#3201). The mug
 * giver releases after the receiver closes their grip (Mason and MacKenzie
 * 2005). Both props lift only after grip closure and stay within 5 mm of
 * their initial hand-local position. A second seed changes the handshake's
 * reach timing and keeps the clasp shared.
 *
 * The standing pair throws and catches a football beyond arm's reach
 * and kicks a football from the floor. The throw precedes the catch, and
 * a toss with no anchor is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Checks order and contact from the public composition, held offsets in hand coordinates and pelvic position throughout the seated acts.
 * @evidence contracts/development/testing.md#independent-expectations Mass and body geometry come from the fixture. The grip drift, seat drift and prop-slip bounds retain #3201, #3361 and #3364.
 * @evidence contracts/development/testing.md#distinguishing-cases The seated base supplies the contact and fixed-seat regressions. Standing exercises flight beyond reach and the floor strike. Dedicated tests cover high-five geometry and both handover casts.
 * @evidence contracts/development/testing.md#execution-ownership The two base specs run the public performance in memory.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the event and geometry contracts for each base.
 */
export function motionRecomposeMutual(
  first: motionHumanBody.Name,
  second: motionHumanBody.Name,
  base: Base,
): void {
  const findings: string[] = [];
  const apart: number = 0.7;
  const gap = (p: IAutoMovieVector3, q: IAutoMovieVector3): number =>
    Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
  const instant = (
    segment: IAutoMovieMotionHumanSegment | undefined,
    event: string,
  ): number =>
    segment === undefined
      ? NaN
      : segment.start +
        (segment.plan.events.find((e): boolean => e.name === event)?.share ??
          NaN) *
          segment.plan.duration;
  const bodies: Record<Subject, IAutoMovieMotionHumanBody> = {
    a: motionHumanBody(first),
    b: motionHumanBody(second),
  };
  const label: string = `${first} with ${second}, ${base}`;
  const start = (who: Subject): IAutoMovieMotionHumanChain => {
    const body: IAutoMovieMotionHumanBody = bodies[who];
    if (base === "standing")
      return HumanChain.subject(who).stand({ seconds: 0.3 });
    const seat: IAutoMovieMotionHumanSeated.ISeat = {
      at: {
        x: 0,
        y: seated.popliteal(body),
        z:
          who === "a"
            ? body.rest.get("leftFoot")!.z - 0.1
            : apart - body.rest.get("leftFoot")!.z + 0.1,
      },
      yaw: who === "a" ? 0 : 180,
      depth: 0.45,
    };
    return HumanChain.subject(who).sit({ seat });
  };
  const perform = (
    composition: IComposition,
    props: IAutoMovieMotionHumanProp[] = [],
    seed: string = "recompose",
    distance: number = apart,
  ): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed,
      props,
      performers: (["a", "b"] as const).map((subject: Subject) => ({
        subject,
        body: bodies[subject],
        at: { x: 0, y: 0, z: subject === "a" ? 0 : distance },
        yaw: subject === "a" ? 0 : 180,
        proficiency: { level: "trained" as const },
      })),
      composition: composition.node,
    });
  const seatHeld = (
    p: IAutoMovieMotionHumanPerformance,
    who: Subject,
    from: number,
    to: number,
    act: string,
  ): void => {
    const settled: IAutoMovieVector3 = p
      .bones(who, from)
      .get("hips")!.worldPosition;
    for (let t: number = from; t <= to; t += 1 / 24) {
      const moved: number = gap(
        p.bones(who, t).get("hips")!.worldPosition,
        settled,
      );
      if (moved > 0.01) {
        findings.push(
          `${label}: ${act}: ${who}'s pelvis moves ${(moved * 1000).toFixed(0)} mm from the seat at ${t.toFixed(2)} s`,
        );
        return;
      }
    }
  };
  const attempt = (act: string, run: () => void): void => {
    try {
      run();
    } catch (error) {
      findings.push(
        `${label}: ${act} is refused: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };
  if (base === "seated") {
    const hands: number = (bodies.a.measure.hand + bodies.b.measure.hand) / 2;

    // 1. Handshake.
    attempt("handshake", (): void => {
      const p: IAutoMovieMotionHumanPerformance = perform(
        HumanChain.mutual(HumanMutual.handshake, {
          one: start("a"),
          other: start("b"),
        }),
      );
      const sa: IAutoMovieMotionHumanSegment | undefined = p.segments("a")[1];
      const sb: IAutoMovieMotionHumanSegment | undefined = p.segments("b")[1];
      const clasp: number = instant(sa, "clasp");
      if (!(Math.abs(clasp - instant(sb, "clasp")) <= 1e-9))
        findings.push(
          `${label}: the two clasps fall ${Math.abs(clasp - instant(sb, "clasp")).toFixed(4)} s apart`,
        );
      const wrists = (t: number): number =>
        gap(
          p.bones("a", t).get("rightHand")!.worldPosition,
          p.bones("b", t).get("rightHand")!.worldPosition,
        );
      if (!(wrists(clasp) <= hands))
        findings.push(
          `${label}: at the clasp the wrists are ${(wrists(clasp) * 1000).toFixed(0)} mm apart, within ${(hands * 1000).toFixed(0)} mm expected`,
        );
      const closed: number = instant(sa, "gripClosed");
      const released: number = instant(sa, "release");
      const held: number = wrists(closed);
      for (let t: number = closed + 1 / 24; t <= released; t += 1 / 24) {
        const drift: number = Math.abs(wrists(t) - held);
        if (drift > 0.01) {
          findings.push(
            `${label}: the grip drifts ${(drift * 1000).toFixed(1)} mm at ${t.toFixed(2)} s, within 10 mm expected`,
          );
          break;
        }
      }
      seatHeld(p, "a", sa!.entryTime, sa!.end, "handshake");

      // 8. Replay and variation.
      const again: IAutoMovieMotionHumanPerformance = perform(
        HumanChain.mutual(HumanMutual.handshake, {
          one: start("a"),
          other: start("b"),
        }),
      );
      if (
        JSON.stringify(again.pose("a", clasp)) !==
        JSON.stringify(p.pose("a", clasp))
      )
        findings.push(`${label}: the handshake does not replay`);
      const other: IAutoMovieMotionHumanPerformance = perform(
        HumanChain.mutual(HumanMutual.handshake, {
          one: start("a"),
          other: start("b"),
        }),
        [],
        "another",
      );
      // The reach's velocity peak is drawn (`HumanPrehension.peak`), so another seed moves the hand otherwise on its way to the clasp.
      const reaching: number = (sa!.entryTime + clasp) / 2;
      if (
        JSON.stringify(other.pose("a", reaching)) ===
        JSON.stringify(p.pose("a", reaching))
      )
        findings.push(
          `${label}: another seed reaches for the clasp exactly alike`,
        );
      const otherClasp: number = instant(other.segments("a")[1], "clasp");
      if (
        !(
          Math.abs(otherClasp - instant(other.segments("b")[1], "clasp")) <=
          1e-9
        ) ||
        !(
          gap(
            other.bones("a", otherClasp).get("rightHand")!.worldPosition,
            other.bones("b", otherClasp).get("rightHand")!.worldPosition,
          ) <= hands
        )
      )
        findings.push(`${label}: changing only the seed breaks the clasp`);
    });
  }

  // The stage for the seated prop acts also supplies the standing toss.
  const mug: ReturnType<typeof createDrinkware> = createDrinkware({
    kind: "mug",
  });
  // Where each sits once seated: its right shoulder, read from the pair sitting down.
  const sat: IAutoMovieMotionHumanPerformance | null =
    base === "seated"
      ? perform({
          node: {
            kind: "parallel",
            parts: [start("a").node, start("b").node],
          },
        })
      : null;
  // A prop on a table before the performer, 0.6 of the arm ahead of the right shoulder: at the waist standing, at the elbow seated (a seated table's height).
  const before = (who: Subject): IWorldPlacement => {
    const m: IAutoMovieMotionHumanBody["measure"] = bodies[who].measure;
    const ahead: number = 0.6 * (m.upperArm + m.forearm);
    const toward: number = who === "a" ? 1 : -1;
    const shoulder: IAutoMovieVector3 =
      sat === null
        ? {
            x: who === "a" ? -m.shoulderHalfWidth : m.shoulderHalfWidth,
            y: m.waistHeight + m.upperArm,
            z: who === "a" ? 0 : apart,
          }
        : sat.bones(who, sat.segments(who).at(-1)!.end).get("rightUpperArm")!
            .worldPosition;
    return {
      at: {
        x: shoulder.x,
        y: shoulder.y - m.upperArm,
        z: shoulder.z + toward * ahead,
      },
      yaw: who === "a" ? 0 : 180,
    };
  };
  if (base === "seated") {
    attempt("handover", (): void => {
      const p: IAutoMovieMotionHumanPerformance = perform(
        HumanChain.mutual(
          HumanMutual.handOver,
          {
            giver: start("a").pickUp({ prop: "mug", handle: "handle" }),
            receiver: start("b"),
          },
          { prop: "mug", handle: "body" },
        ),
        [HumanObject.prop("mug", mug, before("a"))],
      );
      const give: IAutoMovieMotionHumanSegment | undefined = p
        .segments("a")
        .find(
          (s: IAutoMovieMotionHumanSegment): boolean => s.name === "handOver",
        );
      const take: IAutoMovieMotionHumanSegment | undefined = p
        .segments("b")
        .find(
          (s: IAutoMovieMotionHumanSegment): boolean => s.name === "receive",
        );
      if (!(instant(take, "gripClosed") < instant(give, "release")))
        findings.push(
          `${label}: the giver releases at ${instant(give, "release").toFixed(3)} s, before the receiver's grip closes at ${instant(take, "gripClosed").toFixed(3)} s`,
        );
      if (give !== undefined)
        seatHeld(p, "a", give.entryTime, give.end, "handover");
    });

    // 4. A kiss on the cheek, joined: the kissed looks at the kisser's face.
    attempt("kiss", (): void => {
      const p: IAutoMovieMotionHumanPerformance = perform(
        HumanChain.mutual(
          HumanMutual.kiss,
          { kisser: start("a"), kissed: start("b") },
          { region: "cheekLeft" },
        ),
      );
      const k: IAutoMovieMotionHumanSegment = p.segments("a")[1]!;
      const contact: number = instant(k, "contact");
      if (!(contact > k.entryTime && contact < k.end))
        findings.push(
          `${label}: the kiss's contact falls at ${contact} s, outside the act`,
        );
      if (p.segments("b")[1]?.name !== "look")
        findings.push(`${label}: the kissed does not look at the kisser`);
      seatHeld(p, "a", k.entryTime, k.end, "kiss");
    });
    // 5. Pick up and put down a mug and a ball.
    for (const [name, prop, handle] of [
      ["mug", mug, "handle"],
      ["ball", createBall({ kind: "football" }), "grip"],
    ] as const)
      attempt(`pick up a ${name}`, (): void => {
        const p: IAutoMovieMotionHumanPerformance = perform(
          {
            node: {
              kind: "parallel",
              parts: [
                start("a")
                  .pickUp({ prop: name, handle })
                  .putDown({ prop: name, at: before("a").at }).node,
                start("b").node,
              ],
            },
          },
          [HumanObject.prop(name, prop, before("a"))],
        );
        const pick: IAutoMovieMotionHumanSegment = p.segments("a")[1]!;
        const closed: number = instant(pick, "gripClosed");
        const lifted: number = instant(pick, "lifted");
        if (!(closed < lifted))
          findings.push(
            `${label}: the ${name} lifts at ${lifted} s, before the grip closes at ${closed} s`,
          );
        // The prop's place in the right hand's frame, which a held prop keeps.
        const offset = (t: number): IAutoMovieVector3 => {
          const hand: IAutoMovieResolvedBone = p
            .bones("a", t)
            .get("rightHand")!;
          return Quaternion.rotateVector(
            Quaternion.inverse(hand.worldRotation),
            Vector3.subtract(p.prop(name, t).position, hand.worldPosition),
          );
        };
        const frame: number = 1 / 24;
        const held: IAutoMovieVector3 = offset(closed + frame);
        for (let t: number = closed + 2 * frame; t <= lifted; t += frame) {
          const drift: number = gap(offset(t), held);
          if (drift > 0.005) {
            findings.push(
              `${label}: the ${name} slides ${(drift * 1000).toFixed(1)} mm in the hand at ${t.toFixed(2)} s, within 5 mm expected`,
            );
            break;
          }
        }
        seatHeld(p, "a", pick.entryTime, pick.end, `pick up a ${name}`);
      });
  }

  // Throw, catch and kick use the standing base.
  if (base === "standing") {
    attempt("throw and catch", (): void => {
      const ball: ReturnType<typeof createBall> = createBall({
        kind: "football",
      });
      const p: IAutoMovieMotionHumanPerformance = perform(
        HumanChain.mutual(
          HumanMutual.pass,
          {
            thrower: start("a").pickUp({ prop: "ball", handle: "grip" }),
            catcher: start("b"),
          },
          { ball: "ball" },
          "toss",
        ),
        [HumanObject.prop("ball", ball, before("a"))],
        "recompose",
        TOSS,
      );
      const thrown: number = instant(
        p
          .segments("a")
          .find(
            (s: IAutoMovieMotionHumanSegment): boolean =>
              s.name === "throwObject",
          ),
        "release",
      );
      const secured: number = instant(
        p
          .segments("b")
          .find(
            (s: IAutoMovieMotionHumanSegment): boolean =>
              s.name === "catchObject",
          ),
        "secured",
      );
      if (!(secured > thrown))
        findings.push(
          `${label}: the catch is secured at ${secured} s, not after the release at ${thrown} s`,
        );
    });
    attempt("a pass without an anchor", (): void => {
      try {
        HumanChain.mutual(
          HumanMutual.pass,
          { thrower: start("a"), catcher: start("b") },
          { ball: "ball" },
        );
        findings.push(`${label}: a pass without an anchor was not refused`);
      } catch {
        // Refused, as a pass joins its catch to its throw by the anchor.
      }
    });
    attempt("kick", (): void => {
      const ball: ReturnType<typeof createBall> = createBall({
        kind: "football",
      });
      const p: IAutoMovieMotionHumanPerformance = perform(
        {
          node: {
            kind: "parallel",
            parts: [
              start("a").act("kickBall", { ball: "ball" }).node,
              start("b").node,
            ],
          },
        },
        [
          HumanObject.prop("ball", ball, {
            at: { x: 0.1, y: 0.11, z: 0.45 },
            yaw: 0,
          }),
        ],
      );
      const kick: IAutoMovieMotionHumanSegment | undefined = p.segments("a")[1];
      const stroke: number = instant(kick, "stroke");
      if (!(stroke > kick!.entryTime && stroke < kick!.end))
        findings.push(
          `${label}: the kick's stroke falls at ${stroke} s, outside the act`,
        );
    });
  }
  TestValidator.equals(
    `the mutual and prop-handling laws on bases, roles and props (${first} with ${second}, ${base})`,
    findings,
    [],
  );
}

/** Metres between a thrower and a catcher in scenario 7: a toss across a room, beyond both arms' reach of the release, which a catch refuses inside. */
const TOSS: number = 3;

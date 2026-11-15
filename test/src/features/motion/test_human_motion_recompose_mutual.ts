import { createBall, createDrinkware } from "@automovie/archetypes";
import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanMutual,
  HumanObject,
  HumanPerformance,
  type HumanSegment,
  type IHumanBody,
  type IHumanProp,
  seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The mutual and prop-handling laws composed over the grammar's bases, roles
 * and props (#3364's composition matrix): each keeps its shipped verdict on
 * a standing and a seated base, for two pairs of bodies of different
 * stature, with a mug and a ball.
 *
 * Scenarios, the pairs (average man, small woman) and (small woman, tall
 * man), each facing the other 0.7 m apart, standing or seated at their own
 * popliteal height:
 * 1. Handshake joined by `HumanChain.mutual`: both roles' `clasp` falls at
 *    one second; at it the right wrists lie within the mean hand length of
 *    each other; from `gripClosed` to `release` their distance changes by at
 *    most 10 mm (#3201's step 4 acceptance: drift within 10 mm).
 * 2. High five joined the same way: one `meet` second, wrists within the
 *    mean hand length there.
 * 3. Handover of a mug: the receiver's `gripClosed` comes before the giver's
 *    `release` (release only after the receiver's grip closes, Mason and
 *    MacKenzie 2005).
 * 4. A kiss on the partner's cheek: the kisser's `contact` exists and falls
 *    inside the action.
 * 5. Pick up and put down a mug and a ball: `gripClosed` before `lifted`,
 *    and the prop rides the hand between them (its offset from the right
 *    hand changes by at most 5 mm).
 * 6. On the seated base, the pelvis stays within 10 mm of where sitting left
 *    it through each act (the seat is not left).
 * 7. A pass joined by `HumanMutual.pass`: the ball thrown at the partner's
 *    right palm is caught, the catch's `secured` after the throw's
 *    `release`; a pass without an anchor is refused; and a kick of a ball on
 *    the floor names its `plant`.
 * 8. Replay: the handshake performed again with the same seed is bit for bit
 *    the same; with another seed its duration differs (variation, #3359).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs every law of the matrix through the public chains and reads events, displayed bones and prop frames: roles that meet apart, a drifting grip, a release before the receiver's grip, a prop sliding in the hand, a seat left, a catch before its throw, or a non-replaying take is caught.
 * @evidence contracts/development/testing.md#independent-expectations The 10 mm grip drift and the release order are the shipped verdicts of #3229 and #3231 carried by #3364; the hand-length bound is the mutual join's own; the 10 mm seat bound is #3361's seated base; replay is the keyed-draw contract.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bases, two pairs of statures, two props, a mutual and a one-person case per law, and a second seed; each law's own signature sweeps belong to its own specs.
 * @evidence contracts/development/testing.md#execution-ownership A unit test of the motions package on prepared polygon-man bodies and archetype props (the test package may import archetypes), discovered by its exported name; no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the eight scenarios, their bounds and sources.
 */
export function test_human_motion_recompose_mutual(): void {
  const findings: string[] = [];
  const apart: number = 0.7;
  const gap = (p: IAutoMovieVector3, q: IAutoMovieVector3): number =>
    Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
  const instant = (
    segment: HumanSegment.ISegment | undefined,
    event: string,
  ): number =>
    segment === undefined
      ? NaN
      : segment.start +
        (segment.plan.events.find(
          (e: { name: string }): boolean => e.name === event,
        )?.share ?? NaN) *
          segment.plan.duration;
  for (const [first, second] of [
    ["m-average", "f-small"],
    ["f-small", "m-tall"],
  ] as const) {
    const bodies: Record<"a" | "b", IHumanBody> = {
      a: motionHumanBody(first),
      b: motionHumanBody(second),
    };
    for (const base of ["standing", "seated"] as const) {
      const label: string = `${first} with ${second}, ${base}`;
      const start = (who: "a" | "b"): HumanChain => {
        const body: IHumanBody = bodies[who];
        if (base === "standing")
          return HumanChain.subject(who).stand({ seconds: 0.3 });
        const seat: seated.ISeat = {
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
        composition: { node: HumanPerformance.IInput["composition"] },
        props: IHumanProp[] = [],
        seed: string = "recompose",
      ): HumanPerformance =>
        new HumanPerformance({
          seed,
          props,
          performers: (["a", "b"] as const).map((subject: "a" | "b") => ({
            subject,
            body: bodies[subject],
            at: { x: 0, y: 0, z: subject === "a" ? 0 : apart },
            yaw: subject === "a" ? 0 : 180,
            proficiency: { level: "trained" as const },
          })),
          composition: composition.node,
        });
      const seatHeld = (
        p: HumanPerformance,
        who: "a" | "b",
        from: number,
        to: number,
        act: string,
      ): void => {
        if (base !== "seated") return;
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
      const hands: number = (bodies.a.measure.hand + bodies.b.measure.hand) / 2;

      // 1. Handshake.
      attempt("handshake", (): void => {
        const p: HumanPerformance = perform(
          HumanChain.mutual(HumanMutual.handshake, {
            one: start("a"),
            other: start("b"),
          }),
        );
        const sa: HumanSegment.ISegment | undefined = p.segments("a")[1];
        const sb: HumanSegment.ISegment | undefined = p.segments("b")[1];
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
        for (let t: number = closed; t <= released; t += 1 / 24)
          if (Math.abs(wrists(t) - held) > 0.01) {
            findings.push(
              `${label}: the grip drifts ${(Math.abs(wrists(t) - held) * 1000).toFixed(1)} mm at ${t.toFixed(2)} s, within 10 mm expected`,
            );
            break;
          }
        seatHeld(p, "a", sa!.entryTime, sa!.end, "handshake");

        // 8. Replay and variation.
        const again: HumanPerformance = perform(
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
        const other: HumanPerformance = perform(
          HumanChain.mutual(HumanMutual.handshake, {
            one: start("a"),
            other: start("b"),
          }),
          [],
          "another",
        );
        if (other.segments("a")[1]!.plan.duration === sa!.plan.duration)
          findings.push(`${label}: another seed shakes for exactly as long`);
      });

      // 2. High five.
      attempt("high five", (): void => {
        const p: HumanPerformance = perform(
          HumanChain.mutual(HumanMutual.highFive, {
            one: start("a"),
            other: start("b"),
          }),
        );
        const meet: number = instant(p.segments("a")[1], "meet");
        if (!(Math.abs(meet - instant(p.segments("b")[1], "meet")) <= 1e-9))
          findings.push(`${label}: the high five's roles meet apart`);
        const d: number = gap(
          p.bones("a", meet).get("rightHand")!.worldPosition,
          p.bones("b", meet).get("rightHand")!.worldPosition,
        );
        if (!(d <= hands))
          findings.push(
            `${label}: at the high five the wrists are ${(d * 1000).toFixed(0)} mm apart`,
          );
        seatHeld(
          p,
          "a",
          p.segments("a")[1]!.entryTime,
          p.segments("a")[1]!.end,
          "high five",
        );
      });

      // 3. Handover of a mug.
      const mug: ReturnType<typeof createDrinkware> = createDrinkware({
        kind: "mug",
      });
      const before = (who: "a" | "b"): HumanObject.Placement => {
        const m: IHumanBody["measure"] = bodies[who].measure;
        const ahead: number = 0.6 * (m.upperArm + m.forearm);
        return {
          at: {
            x: who === "a" ? -m.shoulderHalfWidth : m.shoulderHalfWidth,
            y: m.waistHeight,
            z: who === "a" ? ahead : apart - ahead,
          },
          yaw: who === "a" ? 0 : 180,
        };
      };
      attempt("handover", (): void => {
        const p: HumanPerformance = perform(
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
        const give: HumanSegment.ISegment | undefined = p
          .segments("a")
          .find((s: HumanSegment.ISegment): boolean => s.name === "handOver");
        const take: HumanSegment.ISegment | undefined = p
          .segments("b")
          .find((s: HumanSegment.ISegment): boolean => s.name === "receive");
        if (!(instant(take, "gripClosed") < instant(give, "release")))
          findings.push(
            `${label}: the giver releases at ${instant(give, "release").toFixed(3)} s, before the receiver's grip closes at ${instant(take, "gripClosed").toFixed(3)} s`,
          );
        if (give !== undefined)
          seatHeld(p, "a", give.entryTime, give.end, "handover");
      });

      // 4. A kiss on the cheek, joined: the kissed looks at the kisser's face.
      attempt("kiss", (): void => {
        const p: HumanPerformance = perform(
          HumanChain.mutual(
            HumanMutual.kiss,
            { kisser: start("a"), kissed: start("b") },
            { region: "cheekLeft" },
          ),
        );
        const k: HumanSegment.ISegment = p.segments("a")[1]!;
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
          const p: HumanPerformance = perform(
            {
              node: {
                kind: "parallel",
                parts: [
                  start("a")
                    .pickUp({ prop: name, handle })
                    .putDown({ prop: name }).node,
                  start("b").node,
                ],
              },
            },
            [HumanObject.prop(name, prop, before("a"))],
          );
          const pick: HumanSegment.ISegment = p.segments("a")[1]!;
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
          const held: IAutoMovieVector3 = offset(closed + 1 / 24);
          for (let t: number = closed + 1 / 24; t <= lifted; t += 1 / 24)
            if (gap(offset(t), held) > 0.005) {
              findings.push(
                `${label}: the ${name} slides ${(gap(offset(t), held) * 1000).toFixed(1)} mm in the hand at ${t.toFixed(2)} s, within 5 mm expected`,
              );
              break;
            }
          seatHeld(p, "a", pick.entryTime, pick.end, `pick up a ${name}`);
        });

      // 7. A throw caught and a kick (standing only: a seated kick or catch leaves the seat by design).
      if (base === "standing") {
        attempt("throw and catch", (): void => {
          const ball: ReturnType<typeof createBall> = createBall({
            kind: "football",
          });
          const p: HumanPerformance = perform(
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
          );
          const thrown: number = instant(
            p
              .segments("a")
              .find(
                (s: HumanSegment.ISegment): boolean => s.name === "throwObject",
              ),
            "release",
          );
          const secured: number = instant(
            p
              .segments("b")
              .find(
                (s: HumanSegment.ISegment): boolean => s.name === "catchObject",
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
          const p: HumanPerformance = perform(
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
          if (!Number.isFinite(instant(p.segments("a")[1], "plant")))
            findings.push(`${label}: the kick names no plant`);
        });
      }
    }
  }
  TestValidator.equals(
    "the mutual and prop-handling laws on bases, roles and props",
    findings,
    [],
  );
}

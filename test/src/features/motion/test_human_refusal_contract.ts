import { Quaternion } from "@automovie/engine";
import type { AutoMovieMotionTarget } from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  type IHumanBody,
  type IHumanProp,
  seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/** One refused composition with what its refusal must say and the composition its fix leads to. */
interface ICase {
  /** What the case pins. */
  title: string;

  /** The expected class. */
  kind: HumanRefusal.Kind;

  /** The expected action. */
  act: string;

  /** The expected axis. */
  axis: string;

  /** How far `b` stands ahead of `a`, metres. */
  gap: number;

  /** The refused chain of `a`. */
  refused: HumanChain;

  /** The chain the refusal's fix leads to, read from the refusal itself where it names a value. */
  repaired: (refusal: HumanRefusal) => HumanChain;

  /** What else the refusal must carry. */
  holds: (refusal: HumanRefusal) => boolean;
}

/**
 * A refused composition tells its author who, which action, which axis, the
 * value given, what is accepted and what to change, and the stated change
 * makes the composition plan.
 *
 * The author is a coding agent that composes a scene from a brief. A
 * refusal is the only feedback it gets before a film exists, so the refusal
 * is a contract: a typed `HumanRefusal` whose fields locate the fault and
 * whose fix is a repair, never a bare assertion. The cases are the natural
 * first attempts an agent makes: a value out of range, a partner out of
 * reach, a grip the prop does not have, a hand that is already full, a cut
 * where the action declares none, a partner that is not in the scene, and a
 * seat the performer does not face away from.
 *
 * Scenarios, each on the average man with the small woman as `b`:
 * 1. `stand` for -1 s: a `parameter` refusal on `seconds`, whose feasible
 *    range excludes 0 from below; standing 1 s plans.
 * 2. A wave repeated 0 times: a `parameter` refusal on `count`, feasible
 *    whole numbers from 1; a count of 1 plans.
 * 3. A pat on the shoulder of `b` standing 3 m away: a `reach` refusal on
 *    `target`; with `b` at arm's length the same chain plans.
 * 4. Picking a bottle up by a grip it does not have: an `affordance` refusal
 *    on `handle` listing the bottle's grips; the first listed grip plans.
 * 5. Waving with the hand that holds the bottle: an `affordance` refusal on
 *    `hand` listing the free hand; the listed hand plans.
 * 6. A touch cut at half its length into standing: a `cut` refusal listing
 *    the legal windows; cutting at the listed window's opening plans.
 * 7. A handshake with a partner who is not in the scene: a `participant`
 *    refusal listing the performers; the listed partner plans.
 * 8. Sitting on a seat the performer faces: a `base` refusal on `seat`;
 *    the seat turned to face the performer's way plans.
 * 9. Every refusal names performer `a`, its action, occurrence 1, a
 *    non-empty reason and fix, and its message states all of them.
 * 10. Each refused composition is refused with the identical message under
 *     three seeds: a refusal never depends on the seed.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds real performances through the public constructor on real bodies and reads the thrown error; a bare `Error`, a missing field, a wrong axis or a fix that does not plan fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected class and axis come from what the author did wrong in each scene, not from the message; the repair is built from the refusal's own feasible set, so a feasible set that does not plan fails.
 * @evidence contracts/development/testing.md#distinguishing-cases One scene per class of refusal an author meets today, two for a parameter (a duration and a count) and two for an affordance (a missing grip and a held hand); the channel clash arrives with parallel acts.
 * @evidence contracts/development/testing.md#execution-ownership Prepares polygon men, so it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 10 scenarios and why a refusal is a contract for its reader.
 */
export function test_human_refusal_contract(): void {
  const a: IHumanBody = motionHumanBody("m-average");
  const b: IHumanBody = motionHumanBody("f-small");
  const shoulder: AutoMovieMotionTarget = {
    kind: "person",
    subject: "b",
    region: "shoulderLeft",
  };
  const chest: AutoMovieMotionTarget = { kind: "self", region: "sternum" };

  // A bottle at hip height within the right hand's reach, with two grips.
  const bottle: IHumanProp = {
    subject: "bottle",
    frame: {
      position: {
        x: a.rest.get("rightUpperArm")!.x,
        y: a.measure.hipHeight,
        z: 0.3,
      },
      rotation: Quaternion.identity(),
    },
    points: {},
    shapes: [
      {
        id: "glass",
        material: "glass",
        transform: {
          position: { x: 0, y: 0.095, z: 0 },
          rotation: Quaternion.identity(),
        },
        kind: "capsule",
        radius: 0.035,
        halfLength: 0.06,
      },
    ],
    affordances: (["low", "high"] as const).map((id, i) => ({
      id,
      kind: "handle" as const,
      frame: {
        translation: { x: 0, y: i === 0 ? 0.06 : 0.15, z: 0 },
        rotation: Quaternion.normalize(
          Quaternion.multiply(
            Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, i === 0 ? 0 : 180),
            Quaternion.normalize(
              Quaternion.multiply(
                Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 90),
                Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -90),
              ),
            ),
          ),
        ),
        scale: { x: 1, y: 1, z: 1 },
      },
      extent: null,
      grip: "power" as const,
      aperture: 0.07,
    })),
  };

  // A chair under `a`, as high as the popliteal height, 0.1 m behind the heels.
  const chair = (yaw: number): seated.ISeat => ({
    at: {
      x: 0,
      y: seated.popliteal(a),
      z: a.rest.get("leftFoot")!.z - 0.1,
    },
    yaw,
    depth: 0.45,
  });
  const alternatives = (refusal: HumanRefusal): readonly string[] =>
    refusal.feasible?.kind === "alternatives" ? refusal.feasible.values : [];
  const near: number = 0.8 * (a.measure.upperArm + a.measure.forearm);
  const start = (): HumanChain => HumanChain.subject("a");

  const cases: ICase[] = [
    {
      title: "a negative duration",
      kind: "parameter",
      act: "stand",
      axis: "seconds",
      gap: 3,
      refused: start().stand({ seconds: -1 }),
      repaired: () => start().stand({ seconds: 1 }),
      holds: (r) =>
        r.value === -1 &&
        r.feasible?.kind === "range" &&
        r.feasible.minimum === 0 &&
        r.feasible.unit === "s",
    },
    {
      title: "a count of zero",
      kind: "parameter",
      act: "gesture",
      axis: "count",
      gap: 3,
      refused: start().gesture({ kind: "wave", count: 0 }),
      repaired: (r) =>
        start().gesture({
          kind: "wave",
          count: r.feasible?.kind === "range" ? (r.feasible.minimum ?? 0) : 0,
        }),
      holds: (r) =>
        r.value === 0 &&
        r.feasible?.kind === "range" &&
        r.feasible.minimum === 1 &&
        r.feasible.whole === true,
    },
    {
      title: "a partner out of reach",
      kind: "reach",
      act: "touch",
      axis: "target",
      gap: 3,
      refused: start().touch({ target: shoulder, kind: "pat" }),
      // The same chain with `b` at arm's length; the case's own gap is the refused one.
      repaired: () => start().touch({ target: shoulder, kind: "pat" }),
      holds: (r) => r.feasible === null || r.feasible.kind === "range",
    },
    {
      title: "a grip the prop does not have",
      kind: "affordance",
      act: "pickUp",
      axis: "handle",
      gap: 3,
      refused: start().pickUp({ prop: "bottle", handle: "middle" }),
      repaired: (r) =>
        start().pickUp({ prop: "bottle", handle: alternatives(r)[0] ?? "" }),
      holds: (r) =>
        r.value === "middle" &&
        alternatives(r).join() === ["low", "high"].join(),
    },
    {
      title: "a hand that is already full",
      kind: "affordance",
      act: "gesture",
      axis: "hand",
      gap: 3,
      refused: start()
        .pickUp({ prop: "bottle", handle: "low", hand: "right" })
        .gesture({ kind: "wave", side: "right" }),
      repaired: (r) =>
        start()
          .pickUp({ prop: "bottle", handle: "low", hand: "right" })
          .gesture({
            kind: "wave",
            side: alternatives(r)[0] === "left" ? "left" : "right",
          }),
      holds: (r) => r.value === "right" && alternatives(r).join() === "left",
    },
    {
      title: "a cut where the action declares none",
      kind: "cut",
      act: "stand",
      axis: "cut",
      gap: 3,
      refused: start()
        .touch({ target: chest, kind: "press" })
        .until({ share: 0.5 })
        .stand(),
      repaired: () =>
        start()
          .touch({ target: chest, kind: "press" })
          .until({ event: "relax" })
          .stand(),
      holds: (r) =>
        r.value === 0.5 && alternatives(r).some((w) => w.includes("relax")),
    },
    {
      title: "a partner who is not in the scene",
      kind: "participant",
      act: "handshake",
      axis: "performer",
      gap: 0.9,
      refused: start().handshake({ partner: "c" }),
      repaired: (r) =>
        start().handshake({
          partner: alternatives(r).find((s) => s !== "a") ?? "",
        }),
      holds: (r) => r.value === "c" && alternatives(r).join() === "a,b",
    },
    {
      title: "a seat the performer faces",
      kind: "base",
      act: "sit",
      axis: "seat",
      gap: 3,
      refused: start().sit({ seat: chair(180) }),
      repaired: () => start().sit({ seat: chair(0) }),
      holds: (r) => typeof r.value === "number",
    },
  ];

  const perform = (
    seed: string,
    gap: number,
    chain: HumanChain,
  ): HumanPerformance =>
    new HumanPerformance({
      seed,
      performers: [
        {
          subject: "a",
          body: a,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body: b,
          at: { x: 0, y: 0, z: gap },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      props: [bottle],
      composition: chain.node,
    });
  const refusal = (seed: string, gap: number, chain: HumanChain): unknown => {
    try {
      perform(seed, gap, chain);
    } catch (error) {
      return error;
    }
    return null;
  };

  for (const c of cases) {
    const thrown: unknown = refusal("refusal", c.gap, c.refused);
    TestValidator.predicate(
      `${c.title}: refused with a HumanRefusal, got ${thrown instanceof Error ? `${thrown.name}: ${thrown.message}` : String(thrown)}`,
      thrown instanceof HumanRefusal,
    );
    if (!(thrown instanceof HumanRefusal)) continue;

    // 1 to 8. The class, the place, the axis and the case's own facts.
    TestValidator.equals(
      `${c.title}: kind (${thrown.message})`,
      thrown.kind,
      c.kind,
    );
    TestValidator.equals(
      `${c.title}: axis (${thrown.message})`,
      thrown.axis,
      c.axis,
    );
    TestValidator.predicate(
      `${c.title}: carries its facts (${thrown.message})`,
      c.holds(thrown),
    );

    // 9. Who, which action, which occurrence, why and what to change.
    TestValidator.equals(`${c.title}: performer`, thrown.performer, "a");
    TestValidator.equals(
      `${c.title}: act (${thrown.message})`,
      thrown.act,
      c.act,
    );
    TestValidator.equals(`${c.title}: instance`, thrown.instance, 1);
    TestValidator.predicate(
      `${c.title}: states a reason and a fix`,
      thrown.reason.length > 0 && thrown.fix.length > 0,
    );
    TestValidator.predicate(
      `${c.title}: the message states the place, the axis, the reason and the fix (${thrown.message})`,
      thrown.message.startsWith(`a.${c.act}#1 ${c.axis}: `) &&
        thrown.message.includes(thrown.reason) &&
        thrown.message.endsWith(`fix: ${thrown.fix}`),
    );

    // The stated fix makes the composition plan.
    const after: unknown = refusal(
      "refusal",
      c.kind === "reach" ? near : c.gap,
      c.repaired(thrown),
    );
    TestValidator.predicate(
      `${c.title}: the fix plans, got ${after instanceof Error ? after.message : String(after)}`,
      after === null,
    );

    // 10. The seed never decides a refusal.
    for (const seed of ["seed-1", "seed-2", "seed-3"]) {
      const again: unknown = refusal(seed, c.gap, c.refused);
      TestValidator.predicate(
        `${c.title}: the same refusal under ${seed}`,
        again instanceof HumanRefusal && again.message === thrown.message,
      );
    }
  }
}

import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanActionRow,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  HumanSignature,
  type IHumanActionLaw,
  type IHumanBody,
  handToFace,
  seated,
  sit,
  touch,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/** `true` only when two types are each assignable to the other. */
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

/**
 * A production registers a law of its own and performs it like the
 * vocabulary's: under its own name, with a typed chain method, with cuts in
 * and out, deterministically, and without changing any other action.
 *
 * The worked example is the military hand salute, a row of the shipped
 * `touch` with its target, effector, kind, hand and elbow fixed: the right
 * forefinger's tip to the forehead near and slightly to the right of the
 * right eyebrow (US Army TC 3-21.5, Drill and Ceremonies, the hand salute).
 *
 * Scenarios, on the average man:
 * 1. Registered and chained between two stands, the salute is placed as an
 *    action named `salute`, and during its hold the right forefinger's last
 *    joint lies within 30 mm of the right temple region (the fingertip is a
 *    finger joint's length beyond it).
 * 2. The same performance built twice gives the same pose at every sampled
 *    instant.
 * 3. A performance that does not use the salute gives the same poses with
 *    and without the law registered: registering changes no other action.
 * 4. A law registered under a vocabulary name (`walk`), and one name
 *    registered twice, each refuse the performance as a `parameter` refusal
 *    on `laws` naming the name.
 * 5. An unregistered name is refused listing the names that exist, the
 *    registered one among them.
 * 6. Cuts: standing is cut into the salute at any instant; the salute cut
 *    at 0.1 of its length into standing is refused as a `cut`; cut at its
 *    `relax` it plans.
 * 7. `HumanChain.extend` refuses a key that differs from its law's name and
 *    a key the chain already has.
 * 8. Compile time: the extended chain's `salute` takes the parameters the
 *    row leaves open and returns a chain that still has the vocabulary and
 *    the salute.
 * 9. A row counts as its family. A row of `sit` with the chair fixed, then
 *    `rise`, gives the poses of `sit` on that chair then `rise`: the rise
 *    reads the seat it leaves through the row.
 * 10. A row of data: a shave is a hand-to-face task the table lacks, given
 *    as its own row (a razor's head on the jaw, rubbed). It plans alone and
 *    over a walk, as the shipped tasks do, and a walk cut into it and it cut
 *    at 0.1 into standing follow the hand-to-face table.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers a law through the public input and chain, performs it on a real body and reads placed actions, poses and refusals; a law that cannot be performed, changes another action, shadows a name or cuts where it declares no window fails.
 * @evidence contracts/development/testing.md#independent-expectations Where the fingertip goes is the drill manual's; sameness is the distance between two runs' joint centres under a nanometre, never a stored pose; the refusals follow from what a name and a cut window mean.
 * @evidence contracts/development/testing.md#distinguishing-cases A used and an unused registration, a shadow and a duplicate, an unknown name, cuts in both directions inside and outside a window, both ways `extend` can be misused, a row counted as its family (`sit` then `rise`), and a data row (a shave) alone, over a walk, cut into and cut out of.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and samples short films; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the example with its source and the 10 scenarios.
 */
export function test_human_motion_registered_law(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const salute: IHumanActionLaw<
    Omit<touch.IParams, "target" | "with" | "kind" | "side" | "elbow">
  > = HumanActionRow.of("salute", touch, {
    target: { kind: "self", region: "templeRight" },
    with: "forefinger",
    kind: "hold",
    side: "right",
    elbow: "level",
  });
  const chair: seated.ISeat = {
    at: {
      x: 0,
      y: seated.popliteal(body),
      z: body.rest.get("leftFoot")!.z - 0.1,
    },
    yaw: 0,
    depth: 0.45,
  };
  const takeSeat: IHumanActionLaw<Omit<sit.IParams, "seat">> =
    HumanActionRow.of("takeSeat", sit, { seat: chair });
  const shave: IHumanActionLaw<Omit<handToFace.IParams, "task">> =
    HumanActionRow.of("shave", handToFace, {
      task: {
        region: "jawRight",
        effector: {
          surface: "grip",
          shape: "fist",
          tool: { thumb: 0.5 },
          facing: "thumb",
          along: "palm",
        },
        kind: "rub",
        count: 3,
        hold: 0.2,
        tangent: "up",
        head: 0,
        at: "atJaw",
      },
    });
  const Chain: HumanChain.IExtension<{
    salute: typeof salute;
    takeSeat: typeof takeSeat;
    shave: typeof shave;
  }> = HumanChain.extend({ salute, takeSeat, shave });
  const perform = (
    composition: HumanChain,
    laws: readonly IHumanActionLaw<never>[] = [salute, takeSeat, shave],
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "registered",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      laws,
      composition: composition.node,
    });
  const refused = (build: () => unknown): unknown => {
    try {
      build();
    } catch (error) {
      return error;
    }
    return null;
  };
  const complaints: string[] = [];
  const expect = (label: string, holds: boolean): void => {
    if (!holds) complaints.push(label);
  };
  const said = (thrown: unknown): string =>
    thrown instanceof Error ? thrown.message : String(thrown);

  // Whether two films show the same body: every joint centre within a
  // nanometre at every quarter second.
  const same = (one: HumanPerformance, other: HumanPerformance): boolean => {
    if (Math.abs(one.duration - other.duration) > 1e-9) return false;
    for (let t: number = 0; t <= one.duration; t += 0.25) {
      const there: ReturnType<HumanPerformance["bones"]> = other.bones("a", t);
      for (const [bone, resolved] of one.bones("a", t)) {
        const p: IAutoMovieVector3 = resolved.worldPosition;
        const q: IAutoMovieVector3 | undefined = there.get(bone)?.worldPosition;
        if (
          q === undefined ||
          Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z) > 1e-9
        )
          return false;
      }
    }
    return true;
  };
  const scene = (): HumanChain =>
    Chain.subject("a")
      .stand({ seconds: 0.5 })
      .salute({ hold: 0.5 })
      .stand({ seconds: 0.5 });

  // 1. Performed under its own name, the fingertip at the brow.
  const first: HumanPerformance = perform(scene());
  const placed: HumanSegment.ISegment | undefined = first.segments("a")[1];
  expect(
    `the second action is named ${placed?.name}, salute expected`,
    placed?.name === "salute",
  );
  if (placed !== undefined) {
    const instant = (event: string): number =>
      placed.start +
      (placed.plan.events.find((e): boolean => e.name === event)?.share ?? 0) *
        placed.plan.duration;
    const reader: HumanSignature.IReader = HumanSignature.of(
      first,
      "a",
      body,
      0,
    );
    const held: number = (instant("ready") + instant("relax")) / 2;
    const finger: IAutoMovieVector3 = HumanSignature.joint(
      reader,
      held,
      "rightIndexDistal",
    );
    const brow: IAutoMovieVector3 = HumanSignature.region(
      reader,
      "templeRight",
      held,
    );
    const gap: number = Math.hypot(
      finger.x - brow.x,
      finger.y - brow.y,
      finger.z - brow.z,
    );
    expect(
      `the forefinger's last joint is ${(gap * 1000).toFixed(0)} mm from the right temple while the salute is held, within 30 mm expected (TC 3-21.5)`,
      gap <= 0.03,
    );
  }

  // 2. The same film twice.
  expect(
    "the same composition and seed give the same poses",
    same(first, perform(scene())),
  );

  // 3. Registering changes no other action.
  const plain = (): HumanChain =>
    HumanChain.subject("a")
      .stand({ seconds: 0.5 })
      .touch({ target: { kind: "self", region: "sternum" }, kind: "pat" });
  expect(
    "an unused registration changes no pose",
    same(perform(plain(), []), perform(plain())),
  );

  // 4. A name means one thing.
  for (const [label, laws, name] of [
    ["a vocabulary name", [{ ...salute, name: "walk" }], "walk"],
    ["one name twice", [salute, salute], "salute"],
  ] as const) {
    const thrown: unknown = refused(() => perform(plain(), laws));
    expect(
      `${label}: expected a parameter refusal on laws naming ${name}, got ${said(thrown)}`,
      thrown instanceof HumanRefusal &&
        thrown.kind === "parameter" &&
        thrown.axis === "laws" &&
        thrown.value === name,
    );
  }

  // 5. An unknown name lists what exists.
  const unknown: unknown = refused(() =>
    perform(HumanChain.subject("a").registered("curtsy")),
  );
  expect(
    `an unregistered name: expected the names that exist, got ${said(unknown)}`,
    unknown instanceof HumanRefusal &&
      unknown.axis === "act" &&
      unknown.feasible?.kind === "alternatives" &&
      unknown.feasible.values.includes("salute") &&
      unknown.feasible.values.includes("walk"),
  );

  // 6. Cuts in and out.
  expect(
    `standing cut into the salute: ${said(refused(() => perform(Chain.subject("a").stand({ seconds: 2 }).until({ share: 0.3 }).salute())))}`,
    refused(() =>
      perform(
        Chain.subject("a").stand({ seconds: 2 }).until({ share: 0.3 }).salute(),
      ),
    ) === null,
  );
  const early: unknown = refused(() =>
    perform(Chain.subject("a").salute().until({ share: 0.1 }).stand()),
  );
  expect(
    `the salute cut at 0.1 into standing: expected a cut refusal, got ${said(early)}`,
    early instanceof HumanRefusal && early.kind === "cut",
  );
  expect(
    `the salute cut at its relax: ${said(refused(() => perform(Chain.subject("a").salute().until({ event: "relax" }).stand())))}`,
    refused(() =>
      perform(Chain.subject("a").salute().until({ event: "relax" }).stand()),
    ) === null,
  );

  // 7. What extend refuses.
  expect(
    "a key that differs from its law's name is refused",
    refused(() => HumanChain.extend({ greet: salute })) instanceof Error,
  );
  expect(
    "a key the chain already has is refused",
    refused(() =>
      HumanChain.extend({ walk: { ...salute, name: "walk" } }),
    ) instanceof Error,
  );

  // 8. Compile time: the method is typed by the law and keeps the chain.
  const typed: Same<
    keyof NonNullable<
      Parameters<HumanChain.Extended<{ salute: typeof salute }>["salute"]>[0]
    >,
    Exclude<keyof touch.IParams, "target" | "with" | "kind" | "side" | "elbow">
  > = true;
  const chained: HumanChain.Extended<{ salute: typeof salute }> = Chain.subject(
    "a",
  )
    .salute()
    .walk({ to: { x: 0, y: 0, z: 1 } })
    .salute({ hold: 2 });
  expect("the type pins the open parameters", typed && chained.subject === "a");

  // 9. A row counts as its family.
  expect(
    "a rise after a row of sit differs from a rise after sit on the same chair",
    same(
      perform(Chain.subject("a").takeSeat({ seconds: 0.3 }).rise()),
      perform(Chain.subject("a").sit({ seat: chair, seconds: 0.3 }).rise()),
    ),
  );

  // 10. A row of data, cut and carried like its table's tasks.
  for (const [label, build, legal] of [
    ["alone", () => Chain.subject("a").shave(), true],
    [
      "over a walk",
      () =>
        Chain.subject("a")
          .walk({ to: { x: 0, y: 0, z: 4 } })
          .over((o) => o.shave()),
      true,
    ],
    [
      "cut at 0.1 into standing",
      () => Chain.subject("a").shave().until({ share: 0.1 }).stand(),
      false,
    ],
    [
      "cut at its relax into standing",
      () => Chain.subject("a").shave().until({ event: "relax" }).stand(),
      true,
    ],
  ] as const) {
    const thrown: unknown = refused(() => perform(build()));
    expect(
      `a shave ${label}: ${legal ? "expected to plan" : "expected a cut refusal"}, got ${said(thrown)}`,
      legal
        ? thrown === null
        : thrown instanceof HumanRefusal && thrown.kind === "cut",
    );
  }

  TestValidator.equals("a registered law", complaints, []);
}

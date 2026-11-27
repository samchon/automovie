import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieMotionHumanActionLaw, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanSegment, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieMotionHumanCarryPerson, AutoMovieMotionHumanChain, AutoMovieMotionHumanPerformance, AutoMovieMotionHumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";

/**
 * A short cradle pickup from a staged low position whose soles still bear. The
 * bearer stays in place and the raised footing is measured from the displayed
 * soles of the reference carry.
 *
 * Scenarios:
 *
 * 1. Both roles receive the same acquisition, landing and release times.
 * 2. The soles leave and return to their original footing.
 * 3. Both actual palm surfaces bear through the airborne interval.
 * 4. A nearby stance and a rigid staging move preserve the prepared contacts.
 * 5. An unreached body is refused before the lift is displayed.
 */
export async function test_motions_lexicon_cradle_lift_support(): Promise<void> {
  const carry = AutoMovieMotionHumanCarryPerson.HumanCoupled.carry;
  const times = AutoMovieMotionHumanCarryPerson.carriedLift.timing(
    { lift: 0.6, setDown: 0.4 },
    2,
  );
  TestValidator.predicate(
    "the support changes lie inside the original phases",
    nclose(times.take, 0.3, 1e-12) &&
      nclose(times.land, 1.8, 1e-12) &&
      nclose(times.release, 1.9, 1e-12),
  );
  const cast = { bearer: "carrier", borne: "passenger" };
  const props = { carry: "cradle" as const, hold: 2, lift: 0.6, setDown: 0.4 };
  TestValidator.equals(
    "the bearing and borne laws receive the same transfer",
    [
      carry.act("bearer", props, cast).params,
      carry.act("borne", props, cast).params,
    ],
    [
      { ...props, of: "passenger" },
      { ...props, partner: "carrier" },
    ],
  );
  TestValidator.equals(
    "the mutual plan keeps its already-borne default",
    [carry.act("bearer", {}, cast).params, carry.act("borne", {}, cast).params],
    [
      { of: "passenger", lift: 0 },
      { partner: "carrier", lift: 0 },
    ],
  );
  const [bearer, borne]: IAutoMovieMotionHumanBody[] = await Promise.all([
    humanFixtureBody("m-average"),
    humanFixtureBody("f-small"),
  ]);
  const laws = AutoMovieMotionHumanCarryPerson.carryPerson;
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const rotation = (yaw: number) =>
    AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw);
  const make = (
    yaw: number,
    shift: IAutoMovieVector3,
    phases: typeof props,
    setup?: IAutoMovieMotionHumanActionLaw,
  ): AutoMovieMotionHumanPerformance =>
    new AutoMovieMotionHumanPerformance({
      seed: "cradle transfer",
      performers: [
        {
          subject: "carrier",
          body: bearer!,
          at: shift,
          yaw,
          proficiency: { level: "trained" },
        },
        {
          subject: "passenger",
          body: borne!,
          at: shift,
          yaw,
          proficiency: { level: "trained" },
        },
      ],
      laws: [laws.bearing, laws.borne, ...(setup === undefined ? [] : [setup])],
      composition: AutoMovieMotionHumanChain.mutual(
        carry,
        {
          bearer: AutoMovieMotionHumanChain.subject("carrier").stand({ hold: 0.7, sway: 0 }),
          borne:
            setup === undefined
              ? AutoMovieMotionHumanChain.subject("passenger")
              : AutoMovieMotionHumanChain.subject("passenger").registered(setup.name, {}),
        },
        phases,
      ).node,
    });
  const reference: AutoMovieMotionHumanPerformance = make(0, origin, {
    ...props,
    lift: 0,
    setDown: 0,
  });
  const carried: IAutoMovieMotionHumanPosture = reference.posture(
    "passenger",
    1.7,
  );
  const positions = (
    performance: AutoMovieMotionHumanPerformance,
    at: number,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    performance.bones("passenger", at);
  const soles = (
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): readonly [number, number] =>
    (["Left", "Right"] as const).map((side): number =>
      Math.min(
        ...(["heel", "ball", "toe"] as const).map((socket): number => {
          const frame = borne!.surfaces.sockets[`${socket}${side}`];
          return AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePoint(
            frame,
            bones.get(frame.bone)!,
          ).y;
        }),
      ),
    ) as unknown as readonly [number, number];
  const referenceFooting: readonly [number, number] = soles(
    positions(reference, 1.7),
  );

  const staged = (
    drop: number,
    yaw: number = 0,
    translation: IAutoMovieVector3 = origin,
    offset: number = 0,
  ): AutoMovieMotionHumanPerformance => {
    const turn = rotation(yaw);
    const placed = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      AutoMovieEngineVector3.add(
        AutoMovieEngineVector3.add(translation, AutoMovieEngineQuaternion.rotateVector(turn, point)),
        { x: 0, y: -drop, z: offset },
      );
    const posture: IAutoMovieMotionHumanPosture = {
      ...carried,
      root: placed(carried.root),
      yaw: carried.yaw + yaw,
      ...(carried.rotation === undefined
        ? {}
        : {
            rotation: {
              about: placed(carried.rotation.about),
              turn: AutoMovieEngineQuaternion.multiply(
                AutoMovieEngineQuaternion.multiply(turn, carried.rotation.turn),
                AutoMovieEngineQuaternion.inverse(turn),
              ),
            },
          }),
    };
    return make(yaw, translation, props, {
      name: "cradleApproachFooting",
      interrupts: {},
      plan: () => ({
        duration: 0.7,
        events: [],
        contacts: (["leftFoot", "rightFoot"] as const).map(
          (part, index): IAutoMovieMotionHumanContactWindow => ({
            part,
            kind: "plant",
            from: 0,
            to: 1,
            support: {
              kind: "ground",
              height: referenceFooting[index]! - drop + translation.y,
            },
          }),
        ),
        posture: () => posture,
      }),
    });
  };
  const take: AutoMovieMotionHumanPerformance = staged(0.045);
  const segment: IAutoMovieMotionHumanSegment = take
    .segments("passenger")
    .at(-1)!;
  const carrier: IAutoMovieMotionHumanSegment = take
    .segments("carrier")
    .at(-1)!;
  const matching = (
    role: IAutoMovieMotionHumanSegment,
    share: number,
  ): IAutoMovieMotionHumanContactWindow[] =>
    role.plan.contacts.filter(
      (window): boolean => window.from <= share && share <= window.to,
    );
  TestValidator.equals(
    "the feet and arms share the two transfers on the same clock",
    [0, 0.15, 0.5, 0.9, 0.94, 0.96, 1].map((share): number[] => {
      const open = matching(segment, share);
      return [
        open.filter(
          (window): boolean =>
            window.kind === "plant" && window.support.kind === "ground",
        ).length,
        open.filter(
          (window): boolean =>
            window.material !== undefined && window.support.kind === "person",
        ).length,
        matching(carrier, share).filter(
          (window): boolean =>
            window.kind === "grip" && window.support.kind === "person",
        ).length,
      ];
    }),
    [
      [2, 0, 0],
      [2, 2, 2],
      [0, 2, 2],
      [2, 2, 2],
      [2, 2, 2],
      [2, 0, 0],
      [2, 0, 0],
    ],
  );
  for (const [time, isAir] of [
    [0.25, false],
    [0.7, true],
    [1.82, false],
  ] as const) {
    const feet = soles(positions(take, segment.start + time));
    TestValidator.predicate(
      "both displayed soles transfer together",
      feet.every((height, index): boolean => {
        const gap: number = height - (referenceFooting[index]! - 0.045);
        return isAir ? gap > 0.03 : Math.abs(gap) < 0.006;
      }),
    );
  }
  const expected = positions(reference, 1.7);
  const actual = positions(take, segment.start + 1);
  TestValidator.predicate(
    "the reference steady endpoint is retained",
    [...expected].every(
      ([bone, frame]): boolean =>
        AutoMovieEngineVector3.distance(frame.worldPosition, actual.get(bone)!.worldPosition) <
        0.001,
    ),
  );

  const receipts = (
    performance: AutoMovieMotionHumanPerformance,
  ): IAutoMovieMotionHumanContactWindow.IMaterial[] =>
    performance
      .segments("passenger")
      .at(-1)!
      .plan.contacts.flatMap(
        (window): IAutoMovieMotionHumanContactWindow.IMaterial[] =>
          window.material === undefined ? [] : [window.material],
      );
  const nearby: AutoMovieMotionHumanPerformance = staged(0.047);
  TestValidator.equals(
    "both contacts admit a nearby footing",
    receipts(nearby).length,
    2,
  );
  const turn: number = 37;
  const shift: IAutoMovieVector3 = { x: 0.8, y: 0, z: -0.4 };
  const moved: AutoMovieMotionHumanPerformance = staged(0.045, turn, shift);
  TestValidator.predicate(
    "common rigid motion keeps both material-local points",
    receipts(take).length === 2 &&
      receipts(take).every(
        (material, index): boolean =>
          AutoMovieEngineVector3.distance(material.point, receipts(moved)[index]!.point) <
          0.002,
      ),
  );
  const seconds = [0.36, 1, 0.3, 1.8, 0.6, 1.85];
  const ordered = seconds.map((second) => [
    ...positions(take, segment.start + second),
  ]);
  TestValidator.equals(
    "shuffled seeks keep the prepared poses",
    seconds.map((_, index) => {
      const reversed = seconds.length - 1 - index;
      return [...positions(take, segment.start + seconds[reversed]!)];
    }),
    [...ordered].reverse(),
  );
  let refused: unknown;
  try {
    staged(0.045, 0, origin, 1.1);
  } catch (error: unknown) {
    refused = error;
  }
  TestValidator.predicate(
    "an unreached partner cannot lift unsupported",
    refused instanceof AutoMovieMotionHumanRefusal && refused.kind === "reach",
  );
}

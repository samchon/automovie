import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
  rotationBetween,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  type IHumanBody,
  type IHumanProp,
  createHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { MotionBodies } from "../../../../packages/motions/src/executable/MotionBodies";

/**
 * Two polygon men of any statures hand a bottle from one to the other: the
 * giver lets go only after the receiver's grip has closed, the exchange
 * happens between them, and the bottle passes without a jump.
 *
 * The bottle is a primitive upright capsule (70 mm by 190 mm) with two grips
 * on its axis, `low` facing its holder and `high` facing away. The giver
 * picks it up by `low` from a surface at hip height in front of the right
 * shoulder, then the pair hands it over (`HumanChain.pair(...).handOver`),
 * the receiver taking `high`. Pairs: the small woman and the tall man in both
 * orders, and the average and long-armed men, facing; seeds 1 to 4 at
 * trained skill. Each pair stands so the shorter arm reaches the point midway
 * between the right shoulders, at their mean height, with 0.85 of its
 * shoulder-to-palm length (upper arm, forearm and half the hand): Basili et
 * al. (2009) measured a mean 1.16 m between partners at a handover, and half
 * of it is 0.85 of an average adult's 0.68 m shoulder-to-palm length
 * (Winter's segment fractions 0.186, 0.146 and half of 0.108 of a 1.75 m
 * stature).
 *
 * Scenarios:
 * 1. No early release: the giver's grip ends no earlier than the receiver's
 *    `gripClosed`, for every pair and seed (#3201 M10).
 * 2. The handover point (the bottle at `gripClosed`) lies within 0.15 m of
 *    the midpoint between the two sternums (M10).
 * 3. The bottle never jumps: between 240 Hz samples it moves less than 5 mm
 *    from the giver's pick up to the end.
 * 4. After the release the bottle rides the receiver's hand within 1 mm to
 *    the end.
 * 5. A `withdraw` keeps the bottle in the giver's hand: the receiver never
 *    grips it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs whole two-person performances with a prop and reads the schedule's events, the displayed bones and the performance's prop frames; an early release, an exchange off the midpoint, a jumping prop, a slipping hold or a withdrawn prop taken anyway fails.
 * @evidence contracts/development/testing.md#independent-expectations The release rule and the 0.15 m bound are #3201 M10's (Mason and MacKenzie 2005; Hansen et al. 2017); the spacing comes from the bodies' measured segment lengths and Basili et al.'s mean handover distance, not from the planner's reach band; positions come from forward kinematics and the performance's prop frames; 5 mm per 1/240 s is 1.2 m/s, faster than any hand transport here.
 * @evidence contracts/development/testing.md#distinguishing-cases Short-tall pairs in both orders and a long-armed pair, four seeds, transfer and withdraw; the planner's arithmetic and the mutual goal are owned by CI tests.
 * @evidence contracts/development/testing.md#execution-ownership A local test: it prepares polygon men, so its name falls under the CI exclusion of test_human_.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 scenarios and what each pins.
 */
export function test_human_motion_handling_handover(): void {
  const failures: string[] = [];
  const check = (label: string, ok: boolean): void => {
    if (!ok) failures.push(label);
  };
  const bodies: Map<string, IHumanBody> = new Map();
  const body = (name: string): IHumanBody => {
    if (!bodies.has(name)) {
      const man = MotionBodies.population(name);
      bodies.set(name, createHumanBody(man.body.skeleton, man.body.profile));
    }
    return bodies.get(name)!;
  };
  for (const [g, r] of [
    ["f-small", "m-tall"],
    ["m-tall", "f-small"],
    ["m-average", "m-long-armed"],
  ] as const)
    for (const seed of [1, 2, 3, 4]) {
      const giver: IHumanBody = body(g);
      const receiver: IHumanBody = body(r);
      const performance: HumanPerformance = handover(
        giver,
        receiver,
        `${g}-${r}-${seed}`,
        "transfer",
      );
      const giving = performance
        .segments("a")
        .find((s) => s.name === "handOver")!;
      const taking = performance
        .segments("b")
        .find((s) => s.name === "receive")!;
      const event = (s: typeof giving, n: string): number =>
        s.start +
        s.plan.events.find((e) => e.name === n)!.share * s.plan.duration;
      const closed: number = event(taking, "gripClosed");
      const release: number = event(giving, "release");
      check(
        `${g}->${r} #${seed} releases after the grip (${release.toFixed(3)} >= ${closed.toFixed(3)})`,
        release >= closed - 1e-9,
      );

      const sternum = (
        subject: string,
        b: IHumanBody,
        t: number,
      ): IAutoMovieVector3 =>
        resolveAutoMovieHumanoidSurfaces.place(
          b.surfaces.regions.sternum,
          performance.bones(subject, t).get(b.surfaces.regions.sternum.bone)!,
        ).point;
      const middle: IAutoMovieVector3 = Vector3.scale(
        Vector3.add(
          sternum("a", giver, closed),
          sternum("b", receiver, closed),
        ),
        0.5,
      );
      const exchange: number = Vector3.length(
        Vector3.subtract(performance.prop("bottle", closed).position, middle),
      );
      check(
        `${g}->${r} #${seed} exchange ${exchange.toFixed(3)} m from the midpoint`,
        exchange <= 0.15,
      );

      const start: number = performance
        .segments("a")
        .find((s) => s.name === "pickUp")!.entryTime;
      let jump: number = 0;
      let previous: IAutoMovieVector3 = performance.prop(
        "bottle",
        start,
      ).position;
      for (
        let t: number = start + 1 / 240;
        t <= performance.duration;
        t += 1 / 240
      ) {
        const now: IAutoMovieVector3 = performance.prop("bottle", t).position;
        jump = Math.max(jump, Vector3.length(Vector3.subtract(now, previous)));
        previous = now;
      }
      check(
        `${g}->${r} #${seed} no jump (${(jump * 1000).toFixed(2)} mm per sample)`,
        jump < 0.005,
      );

      const offset = (t: number): IAutoMovieVector3 => {
        const hand: IAutoMovieResolvedBone = performance
          .bones("b", t)
          .get("rightHand")!;
        return Quaternion.rotateVector(
          Quaternion.inverse(hand.worldRotation),
          Vector3.subtract(
            performance.prop("bottle", t).position,
            hand.worldPosition,
          ),
        );
      };
      let slip: number = 0;
      for (let t: number = release; t <= performance.duration; t += 1 / 24)
        slip = Math.max(
          slip,
          Vector3.length(Vector3.subtract(offset(t), offset(release))),
        );
      check(
        `${g}->${r} #${seed} held by the receiver (${(slip * 1000).toFixed(2)} mm)`,
        slip <= 0.001,
      );
    }

  // 5. Withdraw.
  const withdrawn: HumanPerformance = handover(
    body("m-average"),
    body("m-long-armed"),
    "withdraw",
    "withdraw",
  );
  const grips: boolean = withdrawn
    .segments("b")
    .some((s) => s.plan.contacts.some((c) => c.kind === "grip"));
  check("a withdrawn offer is never gripped by the receiver", !grips);
  TestValidator.predicate(
    failures.join("; ") || "all checks",
    failures.length === 0,
  );
}

/** The giver picks the bottle up, then the pair hands it over. */
function handover(
  giver: IHumanBody,
  receiver: IHumanBody,
  seed: string,
  outcome: "transfer" | "withdraw",
): HumanPerformance {
  const shoulder: IAutoMovieVector3 = giver.rest.get("rightUpperArm")!;
  const other: IAutoMovieVector3 = receiver.rest.get("rightUpperArm")!;
  const palm = (b: IHumanBody): number =>
    b.measure.upperArm + b.measure.forearm + b.measure.hand / 2;
  const reach: number = 0.85 * Math.min(palm(giver), palm(receiver));
  const half: number = Math.sqrt(
    reach * reach - ((shoulder.y - other.y) / 2) ** 2,
  );
  const across: number = shoulder.x + other.x;
  const apart: number =
    shoulder.z + other.z + Math.sqrt(4 * half * half - across * across);
  return new HumanPerformance({
    seed,
    performers: [
      {
        subject: "a",
        body: giver,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body: receiver,
        at: { x: 0, y: 0, z: apart },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    props: [bottle({ x: shoulder.x, y: giver.measure.hipHeight, z: 0.3 })],
    composition: HumanChain.pair(
      HumanChain.subject("a")
        .stand({ seconds: 0.3 })
        .pickUp({ prop: "bottle", handle: "low", hand: "right" }),
      HumanChain.subject("b").stand({ seconds: 0.3 }),
    ).handOver({
      prop: "bottle",
      handle: "high",
      hand: "right",
      receiverHand: "right",
      mass: 0.5,
      outcome,
    }).node,
  });
}

/** An upright capsule bottle with a low grip facing -Z and a high grip facing +Z. */
function bottle(at: IAutoMovieVector3): IHumanProp {
  const capsule: P.IShape = {
    id: "glass",
    material: "glass",
    transform: {
      position: { x: 0, y: 0.095, z: 0 },
      rotation: Quaternion.identity(),
    },
    kind: "capsule",
    radius: 0.035,
    halfLength: 0.06,
  };
  const grip = (
    id: string,
    y: number,
    toward: number,
  ): IAutoMovieAffordance => ({
    id,
    kind: "handle",
    frame: {
      translation: { x: 0, y, z: 0 },
      rotation: frame({ x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: toward }),
      scale: { x: 1, y: 1, z: 1 },
    },
    extent: null,
    grip: "power",
    aperture: 0.07,
  });
  return {
    subject: "bottle",
    frame: { position: at, rotation: Quaternion.identity() },
    points: {},
    shapes: [capsule],
    affordances: [grip("low", 0.06, -1), grip("high", 0.15, 1)],
  };
}

/** The rotation taking local +X and +Y onto two perpendicular unit directions. */
function frame(
  x: IAutoMovieVector3,
  y: IAutoMovieVector3,
): IAutoMovieQuaternion {
  const swing: IAutoMovieQuaternion = rotationBetween({ x: 0, y: 1, z: 0 }, y);
  const turned: IAutoMovieVector3 = Quaternion.rotateVector(swing, {
    x: 1,
    y: 0,
    z: 0,
  });
  const angle: number =
    (Math.atan2(
      Vector3.dot(y, Vector3.cross(turned, x)),
      Vector3.dot(turned, x),
    ) *
      180) /
    Math.PI;
  return Quaternion.normalize(
    Quaternion.multiply(Quaternion.fromAxisAngle(y, angle), swing),
  );
}

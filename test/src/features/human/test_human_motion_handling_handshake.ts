import { type IAutoMovieResolvedBone, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import {
  HumanChain,
  HumanHand,
  HumanPerformance,
  type IHumanBody,
  createHumanBody,
  handshake,
  resolveHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { measureAutoMovieContact } from "../../../../packages/engine/src/composition/measureAutoMovieContact";
import { preparePhysicalGeometry as Geometry } from "../../../../packages/engine/src/physics/preparePhysicalGeometry";
import { MotionBodies } from "../../../../packages/motions/src/executable/MotionBodies";

/**
 * Two polygon men of any stature and proportion shake hands: their palms
 * meet at one point, stay together through the pump, do not pass through
 * each other, and a declined reach returns without a seam.
 *
 * Scenarios, for every ordered pair of six sweep bodies (the small and tall
 * women, the tall and large men, the long- and short-armed men), the pair
 * standing so their right shoulders are `handshake.gap` apart, where both
 * offering arms meet:
 * 1. At the clasp the two palm sockets are within 15 mm (#3201 step 4).
 * 2. Through the pump the palm sockets stay within 10 mm.
 * 3. Through clasp and pump, no collider of one right hand (palm and
 *    phalanges) is deeper than 10 mm into the other's right hand or forearm.
 * 4. At the clasp, every closing digit of each hand ends within 2 mm of the
 *    partner's palm without entering it, or is stopped short by its range of
 *    motion (reported).
 * 5. The pump stays put: each person's ankles move at most 5 mm.
 * 6. A handshake cut into a stand before the clasp is a declined reach: the
 *    right wrist's velocity jumps by at most 5 % of the window's peak speed at
 *    the cut, and after the blend the displayed pose equals the stand's own
 *    pose (no residual offset).
 * 7. A pair farther apart than both arms reach is refused; the same pair
 *    twice gives bit-identical poses.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs whole two-person performances and reads displayed bones and colliders; palms that miss, drift apart in the pump, hands that interpenetrate, fingers stopping off the partner's hand, sliding feet, a seam at a declined reach, a residual offset or an accepted unreachable pair fails.
 * @evidence contracts/development/testing.md#independent-expectations The 15 mm, 10 mm, 2 mm, 5 mm and 5 % bounds are #3201's acceptance values; palm points come from the body's surface frames on forward kinematics and contact from the engine's native collider query, not from the law's goals.
 * @evidence contracts/development/testing.md#distinguishing-cases Short against tall in both orders, both sexes, arm-length extremes, the declined reach and the unreachable pair; the mutual goal's arithmetic is owned by the CI test test_motion_handling_mutual_goal.
 * @evidence contracts/development/testing.md#execution-ownership A local test: it prepares polygon men, so its name falls under the CI exclusion of test_human_.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 7 scenarios and what each pins.
 */
export async function test_human_motion_handling_handshake(): Promise<void> {
  const queries: Geometry.IQueries = await Geometry();
  const names: string[] = [
    "f-small",
    "f-tall",
    "m-tall",
    "m-large",
    "m-long-armed",
    "m-short-armed",
  ];
  const bodies: Map<string, IHumanBody> = new Map(
    names.map((n: string): [string, IHumanBody] => {
      const man = MotionBodies.population(n);
      return [n, createHumanBody(man.body.skeleton, man.body.profile)];
    }),
  );
  const failures: string[] = [];
  const check = (label: string, ok: boolean): void => {
    if (!ok) failures.push(label);
  };

  for (const a of names)
    for (const b of names) {
      if (a === b) continue;
      const self: IHumanBody = bodies.get(a)!;
      const other: IHumanBody = bodies.get(b)!;
      const performance: HumanPerformance = shake(
        self,
        other,
        `pair-${a}-${b}`,
        spacing(self, other),
      );
      const segment = performance
        .segments("a")
        .find((s) => s.name === "handshake")!;
      const at = (event: string): number =>
        segment.start +
        segment.plan.events.find((e) => e.name === event)!.share *
          segment.plan.duration;
      const clasp: number = at("clasp");
      const release: number = at("release");
      const palm = (
        subject: string,
        body: IHumanBody,
        t: number,
      ): IAutoMovieVector3 =>
        HumanHand.frame(
          body,
          performance.bones(subject, t),
          "right",
          "palm",
          "flat",
        ).point;
      const meet: number = Vector3.length(
        Vector3.subtract(palm("a", self, clasp), palm("b", other, clasp)),
      );
      check(
        `${a}/${b} palms meet ${(meet * 1000).toFixed(1)} mm`,
        meet <= 0.015,
      );

      let drift: number = 0;
      let deepest: number = Infinity;
      for (let t: number = clasp; t <= release + 1e-9; t += 1 / 48) {
        drift = Math.max(
          drift,
          Vector3.length(
            Vector3.subtract(palm("a", self, t), palm("b", other, t)),
          ),
        );
        deepest = Math.min(
          deepest,
          contact(queries, performance, self, other, t, HAND, [
            ...HAND,
            "rightLowerArm",
          ]).separation,
        );
      }
      check(
        `${a}/${b} grip drift ${(drift * 1000).toFixed(1)} mm`,
        drift <= 0.01,
      );
      check(
        `${a}/${b} penetration ${(deepest * 1000).toFixed(1)} mm`,
        deepest >= -0.01,
      );

      for (const digit of ["Index", "Middle", "Ring", "Little", "Thumb"]) {
        const phalanges: string[] =
          digit === "Thumb"
            ? ["ThumbMetacarpal", "ThumbProximal", "ThumbDistal"]
            : [`${digit}Proximal`, `${digit}Intermediate`, `${digit}Distal`];
        const gap: number = contact(
          queries,
          performance,
          self,
          other,
          clasp,
          phalanges.map((p: string): string => `right${p}`),
          ["rightHand"],
        ).separation;
        check(
          `${a}/${b} ${digit} touches ${(gap * 1000).toFixed(2)} mm`,
          gap >= -0.001 && gap <= 0.002,
        );
      }
      for (const subject of ["a", "b"])
        check(
          `${a}/${b} ${subject} ankles still`,
          ankleSlip(performance, subject, segment.entryTime, segment.end) <=
            0.005,
        );
    }

  // 6. A declined reach.
  const self: IHumanBody = bodies.get("m-tall")!;
  const other: IHumanBody = bodies.get("f-small")!;
  const D: number = spacing(self, other);
  const declined: HumanPerformance = new HumanPerformance({
    seed: "declined",
    performers: performers(self, other, D),
    composition: HumanChain.subject("a")
      .stand({ seconds: 0.4 })
      .handshake({ partner: "b" })
      .until({ share: 0.15 })
      .stand({ seconds: 1.2 })
      .with(HumanChain.subject("b").stand({ seconds: 3 })).node,
  });
  const cut: number = declined.segments("a")[2]!.entryTime;
  const wrist = (t: number): IAutoMovieVector3 =>
    declined.bones("a", t).get("rightHand")!.worldPosition;
  const h: number = 1e-4;
  const speed = (t: number): IAutoMovieVector3 =>
    Vector3.scale(Vector3.subtract(wrist(t + h / 2), wrist(t - h / 2)), 1 / h);
  let peak: number = 0;
  for (let t: number = 0.4; t <= cut + 0.3; t += 1 / 96)
    peak = Math.max(peak, Vector3.length(speed(t)));
  const jump: number = Vector3.length(
    Vector3.subtract(speed(cut + h), speed(cut - h)),
  );
  check(
    `declined reach velocity jump ${jump.toFixed(4)} of peak ${peak.toFixed(3)}`,
    jump <= 0.05 * peak,
  );
  const after: number = cut + 0.3 + 0.05;
  const shown: IAutoMoviePose = declined.pose("a", after);
  const own: IAutoMoviePose = resolveHumanPosture(
    self,
    declined.posture("a", after),
  );
  const residual: number = Math.max(
    ...own.joints.map((j): number => {
      const s = shown.joints.find((x) => x.bone === j.bone)!;
      return Math.max(
        Math.abs((s.flexion ?? 0) - (j.flexion ?? 0)),
        Math.abs((s.abduction ?? 0) - (j.abduction ?? 0)),
        Math.abs((s.twist ?? 0) - (j.twist ?? 0)),
      );
    }),
  );
  check(
    `declined reach leaves no offset (${residual.toExponential(2)} deg)`,
    residual <= 1e-6,
  );

  // 7. Refusal and determinism.
  TestValidator.error("an unreachable pair is refused", (): unknown =>
    shake(self, other, "far", 3),
  );
  const again: HumanPerformance = shake(self, other, "twice", D);
  const twice: HumanPerformance = shake(self, other, "twice", D);
  check(
    "bit-identical",
    JSON.stringify(again.pose("a", 1.2)) ===
      JSON.stringify(twice.pose("a", 1.2)),
  );
  TestValidator.predicate(
    failures.join("; ") || "all checks",
    failures.length === 0,
  );
}

/** The right hand's colliders: the palm and every phalanx. */
const HAND: string[] = [
  "rightHand",
  ...["Thumb", "Index", "Middle", "Ring", "Little"].flatMap(
    (d: string): string[] =>
      (d === "Thumb"
        ? ["Metacarpal", "Proximal", "Distal"]
        : ["Proximal", "Intermediate", "Distal"]
      ).map((s: string): string => `right${d}${s}`),
  ),
];

/** Root distance that puts the sternums the handshake gap apart, where both offering arms meet. */
function spacing(a: IHumanBody, b: IHumanBody): number {
  return (
    handshake.gap(a.measure, b.measure) +
    a.measure.chestDepth / 2 +
    b.measure.chestDepth / 2
  );
}

/** The two performers facing each other. */
function performers(
  a: IHumanBody,
  b: IHumanBody,
  D: number,
): HumanPerformance.IInput["performers"] {
  return [
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
      at: { x: 0, y: 0, z: D },
      yaw: 180,
      proficiency: { level: "trained" },
    },
  ];
}

/** A paired handshake after a short stand. */
function shake(
  a: IHumanBody,
  b: IHumanBody,
  seed: string,
  D: number,
): HumanPerformance {
  return new HumanPerformance({
    seed,
    performers: performers(a, b, D),
    composition: HumanChain.pair(
      HumanChain.subject("a").stand({ seconds: 0.4 }),
      HumanChain.subject("b").stand({ seconds: 0.4 }),
    ).handshake().node,
  });
}

/** Least separation between named segments of a's and b's displayed bodies. */
function contact(
  queries: Geometry.IQueries,
  performance: HumanPerformance,
  a: IHumanBody,
  b: IHumanBody,
  seconds: number,
  ofA: readonly string[],
  ofB: readonly string[],
): measureAutoMovieContact.IResult {
  const side = (
    subject: string,
    body: IHumanBody,
    bones: readonly string[],
  ): measureAutoMovieContact.ISide => {
    const resolved: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      performance.bones(subject, seconds);
    const segments: Record<string, P.ITransform> = {};
    for (const bone of bones) {
      const r: IAutoMovieResolvedBone = resolved.get(
        bone as AutoMovieHumanoidBone,
      )!;
      segments[bone] = { position: r.worldPosition, rotation: r.worldRotation };
    }
    return { subject, region: "hand", profile: body.profile, segments, bones };
  };
  return measureAutoMovieContact({
    a: side("a", a, ofA),
    b: side("b", b, ofB),
    queries,
    seconds,
    prediction: 0.2,
  });
}

/** The largest ankle displacement of a person over an interval. */
function ankleSlip(
  performance: HumanPerformance,
  subject: string,
  from: number,
  to: number,
): number {
  let worst: number = 0;
  for (const side of ["leftFoot", "rightFoot"] as const) {
    const start: IAutoMovieVector3 = performance
      .bones(subject, from)
      .get(side)!.worldPosition;
    for (let t: number = from; t <= to + 1e-9; t += 1 / 24)
      worst = Math.max(
        worst,
        Vector3.length(
          Vector3.subtract(
            performance.bones(subject, t).get(side)!.worldPosition,
            start,
          ),
        ),
      );
  }
  return worst;
}

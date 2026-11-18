import {
  Quaternion,
  Vector3,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  IAutoMovieMotionCoupling,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarried,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanRefusal,
  IAutoMovieMotionHumanSignature,
  IAutoMovieMotionMeeting,
  IAutoMovieMotionMeetingKind,
  IAutoMovieMotionMeetingRole,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionMeeting,
  HumanCarried,
  HumanCarriedCoupling,
  HumanCarriedCouplingLoad,
  HumanFoot,
  HumanPhysics,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";

import { inspectHumanPairSeparation } from "../internal/inspectHumanPairSeparation";
import { motionComplaints } from "../internal/motionComplaints";
import { motionCoupledCarry } from "../internal/motionCoupledCarry";
import { motionHumanBody } from "../internal/motionHumanBody";

type CarryRole = "bearer" | "borne";
type ObservedCarry = motionCoupledCarry.IScene | null;

/**
 * A coupled carry takes the borne body's load through its declared contacts
 * and the bearer leans against that load (#3437).
 *
 * #3349 sets the 10 mm contact and slip bound. #3437 sets the standing
 * margin within 2 % of the bearer's stature. The walking balance uses Hof's
 * extrapolated centre (2005). Knapik, Harman and Reynolds (1996) describe
 * how leaning forward offsets a load on the back.
 *
 * Scenarios, the bearer standing 0.3 s then walking 2 m (or standing) under
 * `bearing` with the borne person named and the pair's tip scheduled over
 * the carry (`HumanCarriedLean.coupled` with `HumanCarriedCouplingLoad.lean`),
 * the borne person under `borne`,
 * read at 20 Hz from 0.8 s to 2.2 s:
 * 1. For the piggyback, the cradle and the fireman's carry (`overShoulder`),
 *    each by the pairs (m-large bears f-small) and (m-average bears
 *    m-average), walking: every bearing contact of the coupling is within
 *    10 mm of the bearer's region and slips less than 10 mm in the frame of
 *    that region's bone.
 *    No joint of either body lies more than 10 mm inside the other's
 *    colliders (`HumanVerdicts`' partner bound).
 * 2. The same six, standing under an explicit balance audit: the pair's
 *    combined centre of mass lies within
 *    2 % of the bearer's stature of the feet's base.
 * 3. The same six, walking under the same audit: at every instant both
 *    bearer feet bear, the pair's extrapolated centre lies inside their base.
 * 4. The coupling's bearing shares sum to 1 within 1e-9, each in [0, 1], and
 *    every grip bears none; every window of the borne plan names the bearer
 *    as its support.
 * 5. Metamorphic, piggyback with the coupled lean: the average man's chest
 *    tips farther forward carrying the large man than carrying the small
 *    woman, at three instants of the walk.
 * 6. Invariance: the meeting computed from the roles in either order gives
 *    the same coupling, bit for bit.
 * 7. Invariance: the same pair gives the same borne posture bit for bit in
 *    two performances.
 * 8. The average man cradling the small woman, whose own mass lies within
 *    the cradle's capacity: an extra mass one kilogram above it is refused as a
 *    `participant` refusal on `mass` whose feasible maximum is the capacity,
 *    and one kilogram below it is accepted.
 * 9. With a lift and a set-down of 0.5 s each, at every share at
 *    least one window bears the borne body (a foot on the ground or a
 *    contact on the bearer), and the feet's windows on the ground close no
 *    earlier than the first bearing window on the bearer opens.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds two-person performances through the public chain and reads both displayed bodies; a borne body off its contacts, a pair off the bearer's base, a lean that ignores the mass, an order-dependent record, an unrefused overload or a support gap fails with its numbers.
 * @evidence contracts/development/testing.md#independent-expectations The contact bound is #3349's, the statics bound #3437's, the balance measure Hof's, the lean direction Knapik's; every reading is of the displayed bodies or the plan's declared windows, never of the solve's own residuals.
 * @evidence contracts/development/testing.md#distinguishing-cases Three carries by two pairs, standing and walking, two borne masses, both role orders, a refusal and its boundary, the lift and set-down.
 * @evidence contracts/development/testing.md#execution-ownership Prepares four polygon men and builds short performances in memory; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, each bound with its source and the 9 scenarios.
 */
export function test_human_motion_coupled_meeting(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const CONTACT: number = 0.01;
  const STATICS: number = 0.02;
  const times: number[] = HumanSignature.times(0.8, 2.2, 20);
  const readStage = (
    names: motionCoupledCarry.Pair,
    carry: IAutoMovieMotionHumanCarried.Carry,
    walking: boolean,
    extra?: motionCoupledCarry.IExtra,
    known?: IAutoMovieMotionCoupling,
  ): ObservedCarry => {
    try {
      return motionCoupledCarry(names, carry, walking, extra, known);
    } catch (error) {
      all.list.push(
        `${carry}, ${names[0]} bearing ${names[1]}, ${walking ? "walking" : "standing"}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  };
  const PAIRS: readonly motionCoupledCarry.Pair[] = [
    ["m-large", "f-small"],
    ["m-average", "m-average"],
  ];
  const CARRIES: readonly IAutoMovieMotionHumanCarried.Carry[] = [
    "piggyback",
    "cradle",
    "overShoulder",
  ];

  for (const names of PAIRS)
    for (const carry of CARRIES) {
      const cell: string = `${carry}, ${names[0]} bearing ${names[1]}`;
      const walked: ObservedCarry = readStage(names, carry, true);
      if (walked === null) continue;
      const coupling: IAutoMovieMotionCoupling = walked.coupling;

      // 4. The shares.
      const bearing: IAutoMovieMotionCoupling.IContact[] =
        coupling.contacts.filter(
          (c: IAutoMovieMotionCoupling.IContact): boolean => c.kind === "bear",
        );
      const sum: number = bearing.reduce(
        (s: number, c: IAutoMovieMotionCoupling.IContact): number => s + c.load,
        0,
      );
      all.check(
        `${cell}: the bearing shares sum to ${sum}, 1 within 1e-9 expected`,
        Math.abs(sum - 1) <= 1e-9,
      );
      for (const c of coupling.contacts)
        all.check(
          `${cell}: the ${c.region} on the bearer's ${c.on.region} (${c.kind}) bears ${c.load}, in [0, 1] and none for a grip expected`,
          c.load >= 0 && c.load <= 1 && (c.kind === "bear" || c.load === 0),
        );

      // 1, 3 and 4. Walking: contacts, slip and the extrapolated centre.
      const borne: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
        walked.film,
        "b",
        walked.bodies.b,
        0,
      );
      const bearer: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
        walked.film,
        "a",
        walked.bodies.a,
        0,
      );
      const windows: readonly IAutoMovieMotionHumanContactWindow[] = walked.film
        .segments("b")
        .flatMap((s) => [...s.plan.contacts]);
      for (const w of windows.filter(
        (w: IAutoMovieMotionHumanContactWindow): boolean =>
          w.support.kind !== "ground",
      ))
        all.check(
          `${cell}: the borne ${w.part} window bears on ${JSON.stringify(w.support)}, the bearer a expected`,
          w.support.kind === "person" && w.support.subject === "a",
        );
      for (const contact of bearing) {
        let worst: number = 0;
        let slip: number = 0;
        let first: IAutoMovieVector3 | null = null;
        for (const t of times) {
          const mine: IAutoMovieVector3 = HumanSignature.region(
            borne,
            contact.region,
            t,
          );
          const theirs: IAutoMovieVector3 = HumanSignature.region(
            bearer,
            contact.on.region,
            t,
          );
          worst = Math.max(
            worst,
            Vector3.length(Vector3.subtract(mine, theirs)),
          );
          const bone = HumanSignature.bones(bearer, t).get(
            walked.bodies.a.surfaces.regions[contact.on.region].bone,
          )!;
          const local: IAutoMovieVector3 = Quaternion.rotateVector(
            Quaternion.inverse(bone.worldRotation),
            Vector3.subtract(mine, bone.worldPosition),
          );
          first ??= local;
          slip = Math.max(slip, Vector3.length(Vector3.subtract(local, first)));
        }
        all.check(
          `${cell}, walking: the borne ${contact.region} is up to ${(worst * 1000).toFixed(1)} mm from the bearer's ${contact.on.region}, ${CONTACT * 1000} mm at most expected`,
          worst <= CONTACT,
        );
        all.check(
          `${cell}, walking: the borne ${contact.region} slips ${(slip * 1000).toFixed(1)} mm in the frame of the bearer's ${contact.on.region}, ${CONTACT * 1000} mm at most expected`,
          slip <= CONTACT,
        );
      }
      // The bodies do not pass into each other beyond the partner verdict's
      // bound (`HumanVerdicts`' `partner`, 10 mm).
      const deepest: ReturnType<typeof inspectHumanPairSeparation> =
        inspectHumanPairSeparation(borne, bearer, times);
      all.check(
        `${cell}, walking at ${deepest.seconds.toFixed(2)} s: ${deepest.where} by ${(-deepest.distance * 1000).toFixed(1)} mm, ${CONTACT * 1000} mm at most expected`,
        deepest.distance >= -CONTACT,
      );
      const length: number = resolveAutoMovieCenterOfMass.pendulum(
        walked.bodies.a.measure.hipHeight,
      );
      const pair = (t: number): IAutoMovieVector3 =>
        motionCoupledCarry.centre(bearer, borne, t);
      const walkAudit: HumanPhysics.ISpan = motionCoupledCarry.balanceAudit(
        walked.film,
      );
      all.check(
        `${cell}, walking: the pair's balance is judged`,
        HumanPhysics.judged(walkAudit),
      );
      for (const t of times) {
        if (
          !HumanPhysics.judged(walkAudit, t) ||
          !HumanSignature.bears(bearer, t, "left") ||
          !HumanSignature.bears(bearer, t, "right")
        )
          continue;
        const h: number = 1 / 120;
        const velocity: IAutoMovieVector3 = Vector3.scale(
          Vector3.subtract(pair(t + h), pair(t - h)),
          1 / (2 * h),
        );
        const margin: number = resolveAutoMovieCenterOfMass.margin(
          resolveAutoMovieCenterOfMass.extrapolate(pair(t), velocity, length),
          HumanFoot.base(walked.bodies.a, HumanSignature.bones(bearer, t)),
        );
        all.check(
          `${cell}, walking at ${t.toFixed(2)} s: the pair's extrapolated centre is ${(margin * 1000).toFixed(0)} mm inside the bearer's base, inside expected`,
          margin >= 0,
        );
      }

      // 2. Standing: the combined centre over the feet.
      const stood: ObservedCarry = readStage(
        names,
        carry,
        false,
        undefined,
        coupling,
      );
      if (stood === null) continue;
      const still: Record<
        motionCoupledCarry.Subject,
        IAutoMovieMotionHumanSignature.IReader
      > = {
        a: HumanSignature.of(stood.film, "a", stood.bodies.a, 0),
        b: HumanSignature.of(stood.film, "b", stood.bodies.b, 0),
      };
      if (
        process.env.AUTOMOVIE_PROFILE_MOTION?.split(",").includes(
          "coupled-static-witness",
        ) === true
      )
        console.log(
          JSON.stringify({
            stage: "coupled-static-witness",
            carry,
            bearer: names[0],
            borne: names[1],
            ...inspectHumanPairSeparation(still.b, still.a, [times[0]!]),
          }),
        );
      const standAudit: HumanPhysics.ISpan = motionCoupledCarry.balanceAudit(
        stood.film,
      );
      all.check(
        `${cell}, standing: the pair's balance is judged`,
        HumanPhysics.judged(standAudit),
      );
      for (const t of times) {
        if (!HumanPhysics.judged(standAudit, t)) continue;
        const margin: number = resolveAutoMovieCenterOfMass.margin(
          motionCoupledCarry.centre(still.a, still.b, t),
          HumanFoot.base(stood.bodies.a, HumanSignature.bones(still.a, t)),
        );
        all.check(
          `${cell}, standing at ${t.toFixed(2)} s: the pair's centre is ${(-margin * 1000).toFixed(0)} mm outside the bearer's base, ${(STATICS * stood.bodies.a.measure.stature * 1000).toFixed(0)} mm at most expected`,
          margin >= -STATICS * stood.bodies.a.measure.stature,
        );
      }
    }

  // 5. A heavier borne body leans the bearer more.
  const tip = (
    reader: IAutoMovieMotionHumanSignature.IReader,
    t: number,
  ): number => {
    const up: IAutoMovieVector3 = Quaternion.rotateVector(
      HumanSignature.bones(reader, t).get("chest")!.worldRotation,
      { x: 0, y: 1, z: 0 },
    );
    return (Math.atan2(up.z, up.y) * 180) / Math.PI;
  };
  const light: ObservedCarry = readStage(
    ["m-average", "f-small"],
    "piggyback",
    true,
  );
  const heavy: ObservedCarry = readStage(
    ["m-average", "m-large"],
    "piggyback",
    true,
  );
  if (light !== null && heavy !== null) {
    const lightBearer = HumanSignature.of(light.film, "a", light.bodies.a, 0);
    const heavyBearer = HumanSignature.of(heavy.film, "a", heavy.bodies.a, 0);
    for (const t of [1.3, 1.6, 1.9]) {
      const a: number = tip(lightBearer, t);
      const b: number = tip(heavyBearer, t);
      all.check(
        `piggyback at ${t} s: the bearer's chest tips ${b.toFixed(1)} degrees carrying m-large and ${a.toFixed(1)} carrying f-small, more for the heavier expected`,
        b > a,
      );
    }
  }

  // 6. The coupling does not depend on which role is computed first.
  const roles = (order: readonly CarryRole[]): IAutoMovieMotionMeetingRole[] =>
    order.map(
      (name: CarryRole): IAutoMovieMotionMeetingRole => ({
        name,
        subject: name === "bearer" ? "a" : "b",
        body: motionHumanBody(name === "bearer" ? "m-average" : "f-small"),
        posture: {
          root: { x: 0, y: 0, z: name === "bearer" ? 0 : -0.3 },
          yaw: 0,
        },
        bones: new Map(),
      }),
    );
  const kind: IAutoMovieMotionMeetingKind = HumanCarriedCoupling.kind(
    "piggyback",
    HumanCarried.CARRIES,
  );
  const forward: IAutoMovieMotionMeeting = AutoMovieMotionMeeting.of(
    kind,
    roles(["bearer", "borne"]),
    { start: 0 },
  );
  const backward: IAutoMovieMotionMeeting = AutoMovieMotionMeeting.of(
    kind,
    roles(["borne", "bearer"]),
    { start: 0 },
  );
  all.check(
    "the coupling is the same whichever role is given first",
    forward.coupling !== undefined &&
      JSON.stringify(forward.coupling) === JSON.stringify(backward.coupling),
  );

  // 7. Determinism of the borne posture.
  const repeat: ObservedCarry = readStage(
    ["m-average", "f-small"],
    "piggyback",
    true,
  );
  if (light !== null && repeat !== null) {
    const firstBorne = HumanSignature.of(light.film, "b", light.bodies.b, 0);
    const secondBorne = HumanSignature.of(repeat.film, "b", repeat.bodies.b, 0);
    for (const t of [0.9, 1.5, 2.1]) {
      const p = (reader: IAutoMovieMotionHumanSignature.IReader): string =>
        JSON.stringify(
          [...HumanSignature.bones(reader, t)].map(([bone, b]) => [
            bone,
            b.worldPosition,
            b.worldRotation,
          ]),
        );
      all.check(
        `piggyback at ${t} s: the borne pose is the same in two performances`,
        p(firstBorne) === p(secondBorne),
      );
    }
  }

  // 8. The capacity and its boundary.
  const bearerBody: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const borneBody: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const load = HumanCarriedCouplingLoad.load(
    bearerBody,
    HumanCarriedCoupling.couple(
      bearerBody,
      borneBody,
      HumanCarried.CARRIES.cradle,
      "cradle",
    ),
  );
  const capacity: number = (load.mass * load.height) / Math.abs(load.ahead);
  const own: number = load.load;
  let refusal: IAutoMovieMotionHumanRefusal | null = null;
  try {
    motionCoupledCarry(["m-average", "f-small"], "cradle", false, {
      mass: Math.max(0, capacity - own) + 1,
    }).film.segments("b");
  } catch (error) {
    if (error instanceof HumanRefusal) refusal = error;
    else throw error;
  }
  all.check(
    `a borne mass 1 kg over the cradle's capacity of ${capacity.toFixed(1)} kg: a participant refusal on mass with that maximum expected, read ${refusal?.message ?? "none"}`,
    refusal !== null &&
      refusal.kind === "participant" &&
      refusal.axis === "mass" &&
      refusal.feasible?.kind === "range" &&
      refusal.feasible.maximum !== null &&
      Math.abs(refusal.feasible.maximum - capacity) <= 1e-6 * capacity,
  );
  if (capacity - own > 1)
    all.check(
      `a borne mass 1 kg under the cradle's capacity of ${capacity.toFixed(1)} kg is accepted`,
      (() => {
        try {
          motionCoupledCarry(["m-average", "f-small"], "cradle", false, {
            mass: capacity - own - 1,
          }).film.segments("b");
          return true;
        } catch {
          return false;
        }
      })(),
    );

  // 9. The lift and the set-down as a support sequence.
  const lifted = readStage(["m-average", "f-small"], "piggyback", false, {
    lift: 0.5,
    setDown: 0.5,
  });
  if (lifted === null) {
    all.assert("a coupled carry bears the borne body on the bearer");
    return;
  }
  const segments = lifted.film.segments("b");
  const plan = segments[segments.length - 1]!.plan;
  const contacts: readonly IAutoMovieMotionHumanContactWindow[] = plan.contacts;
  const bears = (w: IAutoMovieMotionHumanContactWindow): boolean =>
    w.kind === "plant" || w.kind === "bear" || w.kind === "seat";
  // Cover the closed unit interval with the union of the bearing windows.
  const windows: IAutoMovieMotionHumanContactWindow[] = contacts
    .filter(bears)
    .sort((a, b) => a.from - b.from);
  let covered: number = 0;
  for (const w of windows) {
    if (!(w.from - 1e-9 <= covered)) break;
    covered = Math.max(covered, w.to + 1e-9);
  }
  all.check(
    `with a lift: bearing windows must cover the whole action; they cover through share ${covered.toFixed(9)}`,
    covered >= 1,
  );
  const onBearer: IAutoMovieMotionHumanContactWindow[] = contacts.filter(
    (w: IAutoMovieMotionHumanContactWindow): boolean =>
      bears(w) && w.support.kind === "person",
  );
  const ground: IAutoMovieMotionHumanContactWindow[] = contacts.filter(
    (w: IAutoMovieMotionHumanContactWindow): boolean =>
      w.support.kind === "ground",
  );
  const opens: number = Math.min(
    ...onBearer.map((w: IAutoMovieMotionHumanContactWindow): number => w.from),
  );
  all.check(
    `with a lift: the feet leave the ground no earlier than the bearer bears (${opens.toFixed(3)}), read ${ground.map((w) => `${w.part} ${w.from.toFixed(3)}-${w.to.toFixed(3)}`).join(", ")}`,
    onBearer.length > 0 &&
      ground.some(
        (w: IAutoMovieMotionHumanContactWindow): boolean => w.from === 0,
      ) &&
      ground
        .filter(
          (w: IAutoMovieMotionHumanContactWindow): boolean => w.from === 0,
        )
        .every(
          (w: IAutoMovieMotionHumanContactWindow): boolean =>
            w.to >= opens - 1e-9,
        ),
  );
  all.assert("a coupled carry bears the borne body on the bearer");
}

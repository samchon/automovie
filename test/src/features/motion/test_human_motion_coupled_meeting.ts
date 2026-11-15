import {
  Quaternion,
  Vector3,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionMeeting,
  HumanCarried,
  HumanCarriedCoupling,
  HumanCarriedCouplingLoad,
  HumanCarriedLean,
  HumanChain,
  HumanFoot,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
  type IHumanBody,
  type IHumanContactWindow,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A coupled meeting in which one body bears another (#3437): the borne body
 * rests on the bearer by every contact of the carry's coupling, the pair's
 * combined centre stays over the bearer's support, a heavier borne body
 * leans the bearer more, the record is the same whichever role plans first,
 * and a borne mass no lean balances is refused with the feasible mass.
 *
 * Bounds: a shared contact stays within 10 mm of its region and slips less
 * than 10 mm in the bearer's region frame through its hold (#3349's contact
 * bound, "carrier and carried within 10 mm at every declared contact",
 * which `test_human_motion_carried_carries` holds too); the standing pair's
 * combined centre lies within 2 % of the bearer's stature of the feet's base
 * (#3437's statics acceptance); while walking the pair's extrapolated centre
 * (Hof 2005) lies inside the base of the feet that bear, at the instants both
 * feet bear. The lean's direction is Knapik, Harman and Reynolds 1996's: a
 * load on the back leans the trunk forward, more for more load.
 *
 * Scenarios, the bearer standing 0.3 s then walking 2 m (or standing) under
 * `bearing` with the borne person named and the lean of the coupled load
 * scheduled over the carry (`HumanCarriedLean.layer` with
 * `HumanCarriedCouplingLoad.load`), the borne person under `borne`,
 * read at 20 Hz from 0.8 s to 2.2 s:
 * 1. For the piggyback, the cradle and the fireman's carry (`overShoulder`),
 *    each by the pairs (m-large bears f-small) and (m-average bears
 *    m-average), walking: every bearing contact of the coupling is within
 *    10 mm of the bearer's region and slips less than 10 mm in the frame of
 *    that region's bone.
 *    No joint of either body lies more than 10 mm inside the other's
 *    colliders (`HumanVerdicts`' partner bound).
 * 2. The same six, standing: the pair's combined centre of mass lies within
 *    2 % of the bearer's stature of the feet's base.
 * 3. The same six, walking: at every instant both bearer feet bear, the
 *    pair's extrapolated centre lies inside their base.
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
 * 8. A borne mass one kilogram above the capacity is refused as a
 *    `participant` refusal on `mass` whose feasible maximum is the capacity,
 *    and one kilogram below it is accepted.
 * 9. With a lift and a set-down of 0.5 s each, at every sampled share at
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
  type Name = "m-large" | "f-small" | "m-average";
  const CONTACT: number = 0.01;
  const STATICS: number = 0.02;
  const times: number[] = HumanSignature.times(0.8, 2.2, 20);
  const stage = (
    names: readonly [Name, Name],
    carry: HumanCarried.Carry,
    walking: boolean,
    extra: { mass?: number; lift?: number; setDown?: number } = {},
    lean: boolean = false,
  ): {
    film: HumanPerformance;
    bodies: Record<"a" | "b", IHumanBody>;
  } => {
    const bodies: Record<"a" | "b", IHumanBody> = {
      a: motionHumanBody(names[0]),
      b: motionHumanBody(names[1]),
    };
    const own: HumanChain = HumanChain.subject("a").stand({ seconds: 0.3 });
    const moved: HumanChain = walking
      ? own.walk({ to: { x: 0, y: 0, z: 2 } })
      : own.stand({ seconds: 2 });
    const coupling: AutoMovieMotionMeeting.ICoupling | null = lean
      ? HumanCarriedCoupling.couple(
          bodies.a,
          bodies.b,
          HumanCarried.CARRIES[carry],
          carry,
          extra.mass ?? 0,
        )
      : null;
    return {
      bodies,
      film: new HumanPerformance({
        seed: "coupled",
        laws: [HumanCarried.borne, HumanCarried.bearing],
        performers: (["a", "b"] as const).map((subject) => ({
          subject,
          body: bodies[subject],
          at: { x: 0, y: 0, z: subject === "a" ? 0 : -0.3 },
          yaw: 0,
          proficiency: { level: "trained" as const },
        })),
        composition: moved
          .over((o) =>
            o.registered("bearing", {
              carry,
              seconds: 2,
              of: "b",
              ...(extra.mass === undefined ? {} : { mass: extra.mass }),
            }),
          )
          .with(
            HumanChain.subject("b")
              .stand({ seconds: 0.3 })
              .registered("borne", { by: "a", carry, seconds: 2, ...extra }),
          ).node,
        ...(coupling === null
          ? {}
          : {
              layers: {
                a: [
                  {
                    layer: HumanCarriedLean.layer(
                      carry,
                      HumanCarriedCouplingLoad.load(bodies.a, coupling),
                    ),
                    from: 0.3,
                    fade: HumanCarried.TAKE,
                  },
                ],
              },
            }),
      }),
    };
  };
  const PAIRS: readonly (readonly [Name, Name])[] = [
    ["m-large", "f-small"],
    ["m-average", "m-average"],
  ];
  const CARRIES: readonly HumanCarried.Carry[] = [
    "piggyback",
    "cradle",
    "overShoulder",
  ];

  for (const names of PAIRS)
    for (const carry of CARRIES) {
      const cell: string = `${carry}, ${names[0]} bearing ${names[1]}`;
      const coupling: AutoMovieMotionMeeting.ICoupling =
        HumanCarriedCoupling.couple(
          motionHumanBody(names[0]),
          motionHumanBody(names[1]),
          HumanCarried.CARRIES[carry],
          carry,
        );

      // 4. The shares.
      const bearing: AutoMovieMotionMeeting.ICoupledContact[] =
        coupling.contacts.filter(
          (c: AutoMovieMotionMeeting.ICoupledContact): boolean =>
            c.kind === "bear",
        );
      const sum: number = bearing.reduce(
        (s: number, c: AutoMovieMotionMeeting.ICoupledContact): number =>
          s + c.load,
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
      const walked = stage(names, carry, true, {}, true);
      const borne: HumanSignature.IReader = HumanSignature.of(
        walked.film,
        "b",
        walked.bodies.b,
        0,
      );
      const bearer: HumanSignature.IReader = HumanSignature.of(
        walked.film,
        "a",
        walked.bodies.a,
        0,
      );
      const windows: readonly IHumanContactWindow[] = walked.film
        .segments("b")
        .flatMap((s) => [...s.plan.contacts]);
      for (const w of windows.filter(
        (w: IHumanContactWindow): boolean => w.support.kind !== "ground",
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
      let deepest: number = Number.POSITIVE_INFINITY;
      for (const t of times)
        deepest = Math.min(deepest, HumanSignature.apart(borne, bearer, t));
      all.check(
        `${cell}, walking: a joint lies ${(-deepest * 1000).toFixed(1)} mm inside the other body, ${CONTACT * 1000} mm at most expected`,
        deepest >= -CONTACT,
      );      const length: number = resolveAutoMovieCenterOfMass.pendulum(
        walked.bodies.a.measure.hipHeight,
      );
      const pair = (t: number): IAutoMovieVector3 =>
        combined(bearer, borne, walked.bodies, t);
      for (const t of times) {
        if (
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
      const stood = stage(names, carry, false, {}, true);
      const still: Record<"a" | "b", HumanSignature.IReader> = {
        a: HumanSignature.of(stood.film, "a", stood.bodies.a, 0),
        b: HumanSignature.of(stood.film, "b", stood.bodies.b, 0),
      };
      for (const t of times) {
        const margin: number = resolveAutoMovieCenterOfMass.margin(
          combined(still.a, still.b, stood.bodies, t),
          HumanFoot.base(stood.bodies.a, HumanSignature.bones(still.a, t)),
        );
        all.check(
          `${cell}, standing at ${t.toFixed(2)} s: the pair's centre is ${(-margin * 1000).toFixed(0)} mm outside the bearer's base, ${(STATICS * stood.bodies.a.measure.stature * 1000).toFixed(0)} mm at most expected`,
          margin >= -STATICS * stood.bodies.a.measure.stature,
        );
      }
    }

  // 5. A heavier borne body leans the bearer more.
  const tip = (film: HumanPerformance, body: IHumanBody, t: number): number => {
    const up: IAutoMovieVector3 = Quaternion.rotateVector(
      HumanSignature.bones(HumanSignature.of(film, "a", body, 0), t).get(
        "chest",
      )!.worldRotation,
      { x: 0, y: 1, z: 0 },
    );
    return (Math.atan2(up.z, up.y) * 180) / Math.PI;
  };
  const light = stage(["m-average", "f-small"], "piggyback", true, {}, true);
  const heavy = stage(["m-average", "m-large"], "piggyback", true, {}, true);
  for (const t of [1.3, 1.6, 1.9]) {
    const a: number = tip(light.film, light.bodies.a, t);
    const b: number = tip(heavy.film, heavy.bodies.a, t);
    all.check(
      `piggyback at ${t} s: the bearer's chest tips ${b.toFixed(1)} degrees carrying m-large and ${a.toFixed(1)} carrying f-small, more for the heavier expected`,
      b > a,
    );
  }

  // 6. The coupling does not depend on which role is computed first.
  const roles = (
    order: readonly ("bearer" | "borne")[],
  ): AutoMovieMotionMeeting.IRole[] =>
    order.map(
      (name: "bearer" | "borne"): AutoMovieMotionMeeting.IRole => ({
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
  const kind: AutoMovieMotionMeeting.IKind = HumanCarriedCoupling.kind(
    "piggyback",
    HumanCarried.CARRIES,
  );
  const forward: AutoMovieMotionMeeting.IMeeting = AutoMovieMotionMeeting.of(
    kind,
    roles(["bearer", "borne"]),
    { start: 0 },
  );
  const backward: AutoMovieMotionMeeting.IMeeting = AutoMovieMotionMeeting.of(
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
  const once = stage(["m-average", "f-small"], "piggyback", true);
  const twice = stage(["m-average", "f-small"], "piggyback", true);
  for (const t of [0.9, 1.5, 2.1]) {
    const p = (film: HumanPerformance, body: IHumanBody): string =>
      JSON.stringify(
        [...HumanSignature.bones(HumanSignature.of(film, "b", body, 0), t)].map(
          ([bone, b]) => [bone, b.worldPosition, b.worldRotation],
        ),
      );
    all.check(
      `piggyback at ${t} s: the borne pose is the same in two performances`,
      p(once.film, once.bodies.b) === p(twice.film, twice.bodies.b),
    );
  }

  // 8. The capacity and its boundary.
  const bearerBody: IHumanBody = motionHumanBody("f-small");
  const borneBody: IHumanBody = motionHumanBody("m-large");
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
  let refusal: HumanRefusal | null = null;
  try {
    stage(["f-small", "m-large"], "cradle", false, {
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
          stage(["f-small", "m-large"], "cradle", false, {
            mass: capacity - own - 1,
          }).film.segments("b");
          return true;
        } catch {
          return false;
        }
      })(),
    );

  // 9. The lift and the set-down as a support sequence.
  const lifted = stage(["m-average", "f-small"], "piggyback", false, {
    lift: 0.5,
    setDown: 0.5,
  });
  const segments = lifted.film.segments("b");
  const plan = segments[segments.length - 1]!.plan;
  const contacts: readonly IHumanContactWindow[] = plan.contacts;
  const bears = (w: IHumanContactWindow): boolean =>
    w.kind === "plant" || w.kind === "bear" || w.kind === "seat";
  for (let share: number = 0; share <= 1 + 1e-9; share += 0.05)
    all.check(
      `with a lift: at share ${share.toFixed(2)} some window bears the borne body`,
      contacts.some(
        (w: IHumanContactWindow): boolean =>
          bears(w) && w.from <= share + 1e-9 && w.to >= share - 1e-9,
      ),
    );
  const onBearer: IHumanContactWindow[] = contacts.filter(
    (w: IHumanContactWindow): boolean =>
      bears(w) && w.support.kind === "person",
  );
  const ground: IHumanContactWindow[] = contacts.filter(
    (w: IHumanContactWindow): boolean => w.support.kind === "ground",
  );
  const opens: number = Math.min(
    ...onBearer.map((w: IHumanContactWindow): number => w.from),
  );
  all.check(
    `with a lift: the feet leave the ground no earlier than the bearer bears (${opens.toFixed(3)}), read ${ground.map((w) => `${w.part} ${w.from.toFixed(3)}-${w.to.toFixed(3)}`).join(", ")}`,
    onBearer.length > 0 &&
      ground.some((w: IHumanContactWindow): boolean => w.from === 0) &&
      ground
        .filter((w: IHumanContactWindow): boolean => w.from === 0)
        .every((w: IHumanContactWindow): boolean => w.to >= opens - 1e-9),
  );
  all.assert("a coupled carry bears the borne body on the bearer");
}

/** The two bodies' combined centre of mass at a second. */
function combined(
  a: HumanSignature.IReader,
  b: HumanSignature.IReader,
  bodies: Record<"a" | "b", IHumanBody>,
  t: number,
): IAutoMovieVector3 {
  const ma: number = resolveAutoMovieCenterOfMass(
    bodies.a.skeleton,
    bodies.a.profile,
  ).mass;
  const mb: number = resolveAutoMovieCenterOfMass(
    bodies.b.skeleton,
    bodies.b.profile,
  ).mass;
  return Vector3.scale(
    Vector3.add(
      Vector3.scale(HumanSignature.centre(a, t), ma),
      Vector3.scale(HumanSignature.centre(b, t), mb),
    ),
    1 / (ma + mb),
  );
}

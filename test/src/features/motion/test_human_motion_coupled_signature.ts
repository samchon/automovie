import {
  AutoMovieGravity,
  Vector3,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  IAutoMovieMotionCoupling,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCoupled,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSignature,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanCarried,
  HumanCarriedCoupling,
  HumanChain,
  HumanCoupled,
  HumanFoot,
  HumanForceExchange,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The coupled records of #3440 keep the coupled bounds on every pair: a
 * pairwise covering array over record, pair and outcome, each cell passing
 * #3437's statics and slip checks and #3439's outcome checks, or refused as
 * expected.
 *
 * Bounds: a bearing contact within 10 mm of its region (#3349's contact
 * bound), the standing bearer's centre with the borne weight its contacts
 * carry, each share at its contact (all of it when the bearer bears alone,
 * the pair's centre), within 2 % of the bearer's stature of the feet's base
 * (#3437), a resisted centre inside its base and a thrown
 * one leaving it (#3439). A cell is refused as expected when its borne mass
 * exceeds the carry's capacity: a `participant` refusal on `mass` whose
 * feasible maximum lies below the borne mass.
 *
 * Scenarios, over the pairs (m-large, f-small), (f-small, m-large) and
 * (m-average, m-average), the first named casting the first role:
 * 1. `carry` in the fireman's carry (`overShoulder`), the piggyback, the
 *    supported walk and the dance's waist lift and overhead lift on every
 *    pair, the bearer standing: every bearing contact within 10 mm of its
 *    region at 20 Hz over the carry (a palm that misses reports the
 *    region's distance from the shoulder against the arm), and the loaded
 *    centre over the bearer's feet within 2 % of the bearer's stature; or
 *    the expected capacity refusal.
 * 2. `throwing` over a pairwise covering of its four kinds, the three pairs
 *    and the three outcomes (twelve cells, every pair of factors met):
 *    `thrown`, the pull the thrown body's weight, its centre leaves its base
 *    and its events run `kuzushi`, `release`, `land`; `resist`, the pull
 *    half the force its standing base resists by the moment balance,
 *    its centre stays inside its base; `yield`, the pull its weight, its
 *    `kuzushi` event is its plan's end.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the records through the public chain and reads both displayed bodies and the plans' events; a slipping or floating contact, a pair off the bearer's base, an outcome its geometry does not show, or an unexpected refusal fails with its cell and numbers.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are #3349's, #3437's and #3439's; every reading is of the displayed bodies or the declared events.
 * @evidence contracts/development/testing.md#distinguishing-cases Five carries by three pairs, and a pairwise covering of four throws, three pairs and three outcomes, help-up on three pairs and two walks between two helpers.
 * @evidence contracts/development/testing.md#execution-ownership Prepares four polygon men and builds twenty-seven short performances; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, each bound with its source, the expected refusal and the 4 scenarios.
 */
export function test_human_motion_coupled_signature(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  type Name = "m-large" | "f-small" | "m-average";
  const PAIRS: readonly (readonly [Name, Name])[] = [
    ["m-large", "f-small"],
    ["f-small", "m-large"],
    ["m-average", "m-average"],
  ];
  const SECONDS: number = 2;
  const START: number = 0.3;
  const CONTACT: number = 0.01;
  const STATICS: number = 0.02;

  // 1. The carries.
  for (const names of PAIRS)
    for (const carry of [
      "overShoulder",
      "piggyback",
      "supported",
      "waistLift",
      "overheadLift",
    ] as const) {
      const cell: string = `carry ${carry}, ${names[0]} bearing ${names[1]}`;
      const bodies: Record<"a" | "b", IAutoMovieMotionHumanBody> = {
        a: motionHumanBody(names[0]),
        b: motionHumanBody(names[1]),
      };
      let film: IAutoMovieMotionHumanPerformance;
      try {
        film = new HumanPerformance({
          seed: "coupled-signature",
          laws: [HumanCarried.borne, HumanCarried.bearing],
          performers: (["a", "b"] as const).map((subject) => ({
            subject,
            body: bodies[subject],
            at: {
              x: 0,
              y: 0,
              z: subject === "a" ? 0 : -bodies.a.measure.footLength,
            },
            yaw: 0,
            proficiency: { level: "trained" as const },
          })),
          composition: HumanChain.mutual(
            HumanCoupled.carry,
            {
              bearer: HumanChain.subject("a").stand({ seconds: START }),
              borne: HumanChain.subject("b").stand({ seconds: START }),
            },
            { carry, seconds: SECONDS },
          ).node,
        });
        film.segments("b");
      } catch (error) {
        const borne: number = resolveAutoMovieCenterOfMass(
          bodies.b.skeleton,
          bodies.b.profile,
        ).mass;
        all.check(
          `${cell}: planned or a capacity refusal below the borne ${borne.toFixed(1)} kg expected, read ${error instanceof Error ? error.message : String(error)}`,
          error instanceof HumanRefusal &&
            error.kind === "participant" &&
            error.axis === "mass" &&
            error.feasible?.kind === "range" &&
            error.feasible.maximum !== null &&
            error.feasible.maximum < borne,
        );
        continue;
      }
      const coupling: IAutoMovieMotionCoupling = HumanCarriedCoupling.couple(
        bodies.a,
        bodies.b,
        HumanCarried.CARRIES[carry],
        carry,
      );
      const readers: Record<"a" | "b", IAutoMovieMotionHumanSignature.IReader> =
        {
          a: HumanSignature.of(film, "a", bodies.a, 0),
          b: HumanSignature.of(film, "b", bodies.b, 0),
        };
      const masses: Record<"a" | "b", number> = {
        a: resolveAutoMovieCenterOfMass(bodies.a.skeleton, bodies.a.profile)
          .mass,
        b: resolveAutoMovieCenterOfMass(bodies.b.skeleton, bodies.b.profile)
          .mass,
      };
      for (const t of HumanSignature.times(
        START + HumanCarried.TAKE,
        START + SECONDS,
        20,
      )) {
        for (const contact of coupling.contacts.filter(
          (c: IAutoMovieMotionCoupling.IContact): boolean => c.kind === "bear",
        )) {
          const held: IAutoMovieVector3 = HumanSignature.region(
            readers.b,
            contact.region,
            t,
          );
          const gap: number = Vector3.length(
            Vector3.subtract(
              held,
              HumanSignature.region(readers.a, contact.on.region, t),
            ),
          );
          // A palm that misses says whether the region lay beyond the arm.
          const side: "left" | "right" | null =
            contact.on.region === "palmLeft"
              ? "left"
              : contact.on.region === "palmRight"
                ? "right"
                : null;
          const reach: string =
            side === null
              ? ""
              : `; the region lies ${(
                  Vector3.length(
                    Vector3.subtract(
                      held,
                      HumanSignature.joint(readers.a, t, `${side}UpperArm`),
                    ),
                  ) * 1000
                ).toFixed(0)} mm from the shoulder, the arm to the wrist ${(
                  (bodies.a.measure.upperArm + bodies.a.measure.forearm) *
                  1000
                ).toFixed(0)} mm`;
          all.check(
            `${cell} at ${t.toFixed(2)} s: the borne ${contact.region} is ${(gap * 1000).toFixed(1)} mm from the bearer's ${contact.on.region}, ${CONTACT * 1000} mm at most expected${reach}`,
            gap <= CONTACT,
          );
        }

        // The bearer balances its own weight and the borne weight its
        // contacts carry, each share acting where it bears.
        const carried: IAutoMovieMotionCoupling.IContact[] =
          coupling.contacts.filter(
            (c: IAutoMovieMotionCoupling.IContact): boolean =>
              c.kind === "bear" && c.on.role === coupling.bearer,
          );
        const borne: number = carried.reduce(
          (s: number, c: IAutoMovieMotionCoupling.IContact): number =>
            s + c.load * masses.b,
          0,
        );
        const pair: IAutoMovieVector3 = Vector3.scale(
          carried.reduce(
            (
              s: IAutoMovieVector3,
              c: IAutoMovieMotionCoupling.IContact,
            ): IAutoMovieVector3 =>
              Vector3.add(
                s,
                Vector3.scale(
                  HumanSignature.region(readers.a, c.on.region, t),
                  c.load * masses.b,
                ),
              ),
            Vector3.scale(HumanSignature.centre(readers.a, t), masses.a),
          ),
          1 / (masses.a + borne),
        );
        const margin: number = resolveAutoMovieCenterOfMass.margin(
          pair,
          HumanFoot.base(bodies.a, HumanSignature.bones(readers.a, t)),
        );
        all.check(
          `${cell} at ${t.toFixed(2)} s: the bearer's centre with its ${borne.toFixed(1)} kg of the borne weight is ${(-margin * 1000).toFixed(0)} mm outside its base, ${(STATICS * bodies.a.measure.stature * 1000).toFixed(0)} mm at most expected`,
          margin >= -STATICS * bodies.a.measure.stature,
        );
      }
    }

  // 2. The throws, a pairwise covering: kind i mod 4, pair i mod 3,
  // outcome floor(i / 4) meet every pair of their values over twelve cells.
  const KINDS: readonly IAutoMovieMotionHumanCoupled.Throw[] = [
    "seoiNage",
    "oGoshi",
    "oSotoGari",
    "singleLeg",
  ];
  const OUTCOMES: readonly ("thrown" | "resist" | "yield")[] = [
    "thrown",
    "resist",
    "yield",
  ];
  for (let i: number = 0; i < KINDS.length * PAIRS.length; i++) {
    const kind: IAutoMovieMotionHumanCoupled.Throw = KINDS[i % KINDS.length]!;
    const names: readonly [Name, Name] = PAIRS[i % PAIRS.length]!;
    const outcome: "thrown" | "resist" | "yield" =
      OUTCOMES[Math.floor(i / KINDS.length)]!;
    const cell: string = `throw ${kind} ${outcome}, ${names[0]} throwing ${names[1]}`;
    const bodies: Record<"a" | "b", IAutoMovieMotionHumanBody> = {
      a: motionHumanBody(names[0]),
      b: motionHumanBody(names[1]),
    };
    const weight: number =
      resolveAutoMovieCenterOfMass(bodies.b.skeleton, bodies.b.profile).mass *
      AutoMovieGravity.STANDARD;
    // Half the pull its base resists, read on the standing body.
    const force: number =
      outcome === "resist" ? resistible(bodies.b) / 2 : weight;
    let film: IAutoMovieMotionHumanPerformance;
    try {
      film = new HumanPerformance({
        seed: "coupled-signature",
        performers: (["a", "b"] as const).map((subject) => ({
          subject,
          body: bodies[subject],
          at: {
            x: 0,
            y: 0,
            z: subject === "a" ? bodies.b.measure.footLength : 0,
          },
          yaw: 0,
          proficiency: { level: "trained" as const },
        })),
        composition: HumanChain.mutual(
          HumanCoupled.throwing,
          {
            thrower: HumanChain.subject("a").stand({ seconds: START }),
            thrown: HumanChain.subject("b").stand({ seconds: START }),
          },
          { kind, outcome },
        ).node,
        forces: HumanForceExchange.pull({
          subject: "b",
          sites: ["chestLeft", "elbowRight"],
          direction: { x: 0, y: 0, z: 1 },
          force,
          from: START,
          to: START + SECONDS,
        }),
      });
      film.segments("b");
    } catch (error) {
      all.check(
        `${cell}: planned expected, refused with ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
      continue;
    }
    const segments = film.segments("b");
    const response = segments[segments.length - 1]!;
    const event = (name: string): number | null => {
      const e = response.plan.events.find((x) => x.name === name);
      return e === undefined
        ? null
        : response.start + e.share * response.plan.duration;
    };
    const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
      film,
      "b",
      bodies.b,
      0,
    );
    const margins: number[] = HumanSignature.times(
      START,
      response.start + response.plan.duration,
      30,
    ).map((t: number): number =>
      resolveAutoMovieCenterOfMass.margin(
        HumanSignature.centre(reader, t),
        HumanFoot.base(bodies.b, HumanSignature.bones(reader, t)),
      ),
    );
    if (outcome === "thrown") {
      const k: number | null = event("kuzushi");
      const r: number | null = event("release");
      const l: number | null = event("land");
      all.check(
        `${cell}: the events kuzushi ${k}, release ${r}, land ${l} in that order expected`,
        k !== null && r !== null && l !== null && k < r && r <= l,
      );
      all.check(
        `${cell}: the thrown centre leaves its base`,
        margins.some((m: number): boolean => m < 0),
      );
    } else if (outcome === "resist")
      all.check(
        `${cell}: the resisting centre's least margin is ${(Math.min(...margins) * 1000).toFixed(1)} mm, inside its base expected`,
        Math.min(...margins) >= 0,
      );
    else {
      const k: number | null = event("kuzushi");
      all.check(
        `${cell}: the yield's kuzushi event at ${k} is its plan's end`,
        k !== null &&
          Math.abs(k - (response.start + response.plan.duration)) <= 1e-9,
      );
    }
  }
  all.assert("the coupled records keep their bounds on every pair");
}

/**
 * The pull a standing body resists at most, by the moment balance on its
 * displayed base: its weight times the base's extent behind its centre over
 * the collar-and-sleeve grips' height, `M g e / h` (`HumanForceExchange`).
 */
function resistible(body: IAutoMovieMotionHumanBody): number {
  const film: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "resistible",
    performers: [
      {
        subject: "b",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("b").stand({ seconds: 0.3 }).node,
  });
  const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
    film,
    "b",
    body,
    0,
  );
  const centre: IAutoMovieVector3 = HumanSignature.centre(reader, 0.3);
  const behind: number = HumanForceExchange.edge(
    centre,
    { x: 0, y: 0, z: -1 },
    HumanFoot.base(body, HumanSignature.bones(reader, 0.3)),
  );
  const grip: number =
    (HumanSignature.region(reader, "chestLeft", 0.3).y +
      HumanSignature.region(reader, "elbowRight", 0.3).y) /
    2;
  return (
    (resolveAutoMovieCenterOfMass(body.skeleton, body.profile).mass *
      AutoMovieGravity.STANDARD *
      behind) /
    grip
  );
}

import { AutoMovieGravity, resolveAutoMovieCenterOfMass } from "@automovie/engine";
import {
  HumanCarried,
  HumanChain,
  HumanCoupled,
  HumanForceExchange,
  HumanPerformance,
  type IHumanBody,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Every coupled mutual record (#3440) is something two bodies can do: the
 * carry in each named carry and the throw in each kind and outcome, on the
 * average man and the small woman both ways, plans through
 * `HumanChain.mutual`, and each role's placed action is the record's.
 *
 * A record writes no motion; its first possible fault is a combination its
 * laws refuse on some pair, and this test is the net for that, as
 * `LexiconRowNet`'s mutual cast is for the social records. Whether a
 * planned record keeps the coupled bounds is
 * `test_human_motion_coupled_signature`'s.
 *
 * Scenarios, for the pairs (m-average, f-small) and (f-small, m-average),
 * the first named casting the first role:
 * 1. `carry` in each of the eight carries of `HumanCarried.CARRIES`, with a
 *    lift and a set-down of a quarter of the carry each, plans; the bearer's
 *    placed action is `bearing` and the borne's `borne`.
 * 2. `throwing` in each of the four kinds by the three outcomes, the pull on
 *    the thrown body's collar and sleeve sized by the outcome (the thrown
 *    body's weight for `thrown` and `yield`, half the force its base can
 *    resist for `resist`), plans; the thrower's placed action is `clinch`
 *    and the thrown's `perturb`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Joins the records through the public chain on real bodies and reads the placed actions; a record that is refused or placed under another action fails with the record, the pair and the refusal's message.
 * @evidence contracts/development/testing.md#independent-expectations That each record is humanly performable by these pairs is what the record claims; the pull is sized by the force law's own inputs, never read from the response.
 * @evidence contracts/development/testing.md#distinguishing-cases Eight carries and twelve throws by two pairings of opposite builds.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds one short performance per cell; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States what the net catches, what it leaves to the signature test, and the 2 scenarios.
 */
export function test_human_motion_lexicon_rows_coupled(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const SECONDS: number = 2;
  for (const names of [
    ["m-average", "f-small"],
    ["f-small", "m-average"],
  ] as const) {
    const bodies: Record<"a" | "b", IHumanBody> = {
      a: motionHumanBody(names[0]),
      b: motionHumanBody(names[1]),
    };
    const performers = (behind: number) =>
      (["a", "b"] as const).map((subject) => ({
        subject,
        body: bodies[subject],
        at: { x: 0, y: 0, z: subject === "a" ? 0 : -behind },
        yaw: 0,
        proficiency: { level: "trained" as const },
      }));
    const placed = (film: HumanPerformance, subject: string): string => {
      const segments = film.segments(subject);
      return segments[segments.length - 1]?.name ?? "none";
    };

    // 1. The carries.
    for (const carry of Object.keys(HumanCarried.CARRIES) as HumanCarried.Carry[]) {
      const cell: string = `carry ${carry}, ${names[0]} bearing ${names[1]}`;
      try {
        const film: HumanPerformance = new HumanPerformance({
          seed: "coupled-rows",
          laws: [HumanCarried.borne, HumanCarried.bearing],
          performers: performers(bodies.a.measure.footLength),
          composition: HumanChain.mutual(
            HumanCoupled.carry,
            {
              bearer: HumanChain.subject("a").stand({ seconds: 0.3 }),
              borne: HumanChain.subject("b").stand({ seconds: 0.3 }),
            },
            {
              carry,
              seconds: SECONDS,
              lift: SECONDS / 4,
              setDown: SECONDS / 4,
            },
          ).node,
        });
        all.equals(
          `${cell}: the placed actions`,
          [placed(film, "a"), placed(film, "b")],
          ["bearing", "borne"],
        );
      } catch (error) {
        all.check(
          `${cell}: planned expected, refused with ${error instanceof Error ? error.message : String(error)}`,
          false,
        );
      }
    }

    // 2. The throws.
    const model: resolveAutoMovieCenterOfMass.IModel =
      resolveAutoMovieCenterOfMass(bodies.b.skeleton, bodies.b.profile);
    const weight: number = model.mass * AutoMovieGravity.STANDARD;
    const height: number = bodies.b.measure.hipHeight;
    for (const kind of Object.keys(HumanCoupled.FULCRUMS) as HumanCoupled.Throw[])
      for (const outcome of ["thrown", "resist", "yield"] as const) {
        const cell: string = `throw ${kind} ${outcome}, ${names[0]} throwing ${names[1]}`;

        // Half the pull the base can resist, its half foot behind the
        // centre at hip height: a pull the resistance holds by its law.
        const force: number =
          outcome === "resist"
            ? (weight * bodies.b.measure.footLength) / 4 / height
            : weight;
        try {
          const film: HumanPerformance = new HumanPerformance({
            seed: "coupled-rows",
            // The thrower stands a foot ahead of the thrown body, its back
            // to it, as a turned-in entry stands.
            performers: performers(0).map((p) =>
              p.subject === "a"
                ? { ...p, at: { x: 0, y: 0, z: bodies.b.measure.footLength } }
                : p,
            ),
            composition: HumanChain.mutual(
              HumanCoupled.throwing,
              {
                thrower: HumanChain.subject("a").stand({ seconds: 0.3 }),
                thrown: HumanChain.subject("b").stand({ seconds: 0.3 }),
              },
              { kind, outcome },
            ).node,
            forces: HumanForceExchange.pull({
              subject: "b",
              sites: ["chestLeft", "elbowRight"],
              direction: { x: 0, y: 0, z: 1 },
              force,
              from: 0.3,
              to: 0.3 + SECONDS,
            }),
          });
          all.equals(
            `${cell}: the placed actions`,
            [placed(film, "a"), placed(film, "b")],
            ["clinch", "perturb"],
          );
        } catch (error) {
          all.check(
            `${cell}: planned expected, refused with ${error instanceof Error ? error.message : String(error)}`,
            false,
          );
        }
      }
  }
  all.assert("every coupled record is performable");
}

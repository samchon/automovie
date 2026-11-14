import { createRacket } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanObject,
  HumanPerformance,
  type HumanSegment,
  type IHumanActionLaw,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";

import { motionHumanBody } from "./motionHumanBody";

/**
 * The reading of the held working point specs on one body. A swing of a held
 * implement meets its target with the implement's own working point, read
 * from its affordance: a tennis racket's forehand and its overhead smash,
 * each with `tip: "sweetSpot"`, put the racket's `sweetSpot` on the target.
 * The racket lies before the right hand and is taken by its grip, then
 * swung at a point of the world before the body.
 *
 * @param name The body.
 * @returns The complaints; none when the sweet spot is within 15 mm of its target at each swing's decisive instant.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the implement, the rows and what is read.
 * @evidence contracts/development/implementation.md#principled-implementation Builds each swing through the public chain and reads the displayed racket's own affordance at the decisive instant.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One staging, two rows.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The working point is the archetype's affordance, never a share of the racket's length.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two films.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the working point specs, one per body.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; each film is dropped after its reading.
 */
export function motionHeldWorkingPoint(name: motionHumanBody.Name): string[] {
  const laws: IHumanActionLaw<never>[] = Object.values(HUMAN_LEXICON).flat();
  const body: IHumanBody = motionHumanBody(name);
  const stature: number = body.measure.stature;
  const racket: ReturnType<typeof createRacket> = createRacket({
    kind: "tennis",
  });
  const sweetSpot: IAutoMovieVector3 =
    racket.affordance("sweetSpot").frame.translation;
  const target: IAutoMovieVector3 = {
    x: -0.12 * stature,
    y: 0.62 * stature,
    z: 0.42 * stature,
  };
  const complaints: string[] = [];
  for (const row of ["forehand", "overheadSmash"] as const) {
    const film: HumanPerformance = new HumanPerformance({
      seed: "swing",
      laws,
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        // The racket lies level before the right hand, as on a table.
        HumanObject.prop("racket", racket, {
          position: { x: -0.1 * stature, y: 0.6 * stature, z: 0.18 * stature },
          rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
        }),
      ],
      composition: HumanChain.subject("a")
        .stand({ seconds: 0.3 })
        .pickUp({ prop: "racket", handle: "grip" })
        .registered(row, {
          blade: "racket",
          tip: "sweetSpot",
          target: { kind: "point", at: target, frame: "world" },
        }).node,
    });
    const act: HumanSegment.ISegment = film
      .segments("a")
      .find((s: HumanSegment.ISegment): boolean => s.name === row)!;
    const at: number = act.start + (act.plan.contact ?? Number.NaN);
    const frame: IHumanProp.IFrame = film.prop("racket", at);
    const off: number = Vector3.length(
      Vector3.subtract(
        Vector3.add(
          frame.position,
          Quaternion.rotateVector(frame.rotation, sweetSpot),
        ),
        target,
      ),
    );
    if (!(off <= 0.015))
      complaints.push(
        `${name}, a tennis racket's ${row}: its sweetSpot is ${(off * 1000).toFixed(1)} mm from the target at the decisive instant, 15 mm at most expected`,
      );
  }
  return complaints;
}

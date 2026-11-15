import { createClub, createRacket } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  type IHumanActionLaw,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";

import { motionHumanBody } from "./motionHumanBody";

/**
 * The reading of the held working point specs on one body. A swing of a held
 * implement meets its target with the implement's own working point, read
 * from its affordance: a tennis racket's forehand and overhead smash, each
 * with `tip: "sweetSpot"`, put the racket's `sweetSpot` on the target, and a
 * bat's level swing (`clubSwing`, which fixes the `strike` contact) puts the
 * bat's `strike` there. Each implement lies before the right hand and is
 * taken by its grip, then swung at a point at its own reach: ahead of the
 * right shoulder by half the arm and then the implement from its `grip` to
 * its working point, at 0.62 of the stature's height.
 *
 * @param name The body.
 * @returns The complaints; none when each working point is within 15 mm of its target at its swing's decisive instant.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the implements, the rows, where each target stands and what is read.
 * @evidence contracts/development/implementation.md#principled-implementation Builds each swing through the public chain and reads the displayed implement's own affordance at the decisive instant; each target is placed by the implement's own length.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One staging, three swings.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The working point is the archetype's affordance, never a share of the implement's length; a swing refused is a complaint with its reason, never skipped.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three films.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the working point specs, one per body.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; each film is dropped after its reading.
 */
export function motionHeldWorkingPoint(name: motionHumanBody.Name): string[] {
  const laws: IHumanActionLaw<never>[] = Object.values(HUMAN_LEXICON).flat();
  const body: IHumanBody = motionHumanBody(name);
  const stature: number = body.measure.stature;
  const shoulder: IAutoMovieVector3 = body.rest.get("rightUpperArm")!;
  const arm: number = body.measure.upperArm + body.measure.forearm;
  const racket: ReturnType<typeof createRacket> = createRacket({
    kind: "tennis",
  });
  const bat: ReturnType<typeof createClub> = createClub({ kind: "bat" });
  const swings: readonly {
    label: string;
    model: HumanObject.IModel;
    row: string;
    tip: string;
    working: IAutoMovieVector3;
    grip: IAutoMovieVector3;
    params: object;
  }[] = [
    {
      label: "a tennis racket's forehand",
      model: racket,
      row: "forehand",
      tip: "sweetSpot",
      working: racket.affordance("sweetSpot").frame.translation,
      grip: racket.affordance("grip").frame.translation,
      params: { tip: "sweetSpot" },
    },
    {
      label: "a tennis racket's overhead smash",
      model: racket,
      row: "overheadSmash",
      tip: "sweetSpot",
      working: racket.affordance("sweetSpot").frame.translation,
      grip: racket.affordance("grip").frame.translation,
      params: { tip: "sweetSpot" },
    },
    {
      label: "a bat's level swing",
      model: bat,
      row: "clubSwing",
      tip: "strike",
      working: bat.affordance("strike").frame.translation,
      grip: bat.affordance("grip").frame.translation,
      params: {},
    },
  ];
  const complaints: string[] = [];
  for (const swing of swings) {
    const reach: number =
      0.5 * arm + Vector3.length(Vector3.subtract(swing.working, swing.grip));
    const drop: number = shoulder.y - 0.62 * stature;
    const target: IAutoMovieVector3 = {
      x: shoulder.x,
      y: 0.62 * stature,
      z: shoulder.z + Math.sqrt(Math.max(0, reach * reach - drop * drop)),
    };
    let film: HumanPerformance;
    try {
      film = new HumanPerformance({
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
          // The implement lies level before the right hand, as on a table.
          HumanObject.prop("tool", swing.model, {
            position: {
              x: -0.1 * stature,
              y: 0.6 * stature,
              z: 0.18 * stature,
            },
            rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
          }),
        ],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .pickUp({ prop: "tool", handle: "grip" })
          .registered(swing.row, {
            blade: "tool",
            ...swing.params,
            target: { kind: "point", at: target, frame: "world" },
          }).node,
      });
    } catch (error) {
      if (!(error instanceof HumanRefusal)) throw error;
      complaints.push(
        `${name}, ${swing.label}: refused at a target at its own reach, ${error.message}`,
      );
      continue;
    }
    const act: HumanSegment.ISegment = film
      .segments("a")
      .find((s: HumanSegment.ISegment): boolean => s.name === swing.row)!;
    const at: number = act.start + (act.plan.contact ?? Number.NaN);
    const frame: IHumanProp.IFrame = film.prop("tool", at);
    const off: number = Vector3.length(
      Vector3.subtract(
        Vector3.add(
          frame.position,
          Quaternion.rotateVector(frame.rotation, swing.working),
        ),
        target,
      ),
    );
    if (!(off <= 0.015))
      complaints.push(
        `${name}, ${swing.label}: its ${swing.tip} is ${(off * 1000).toFixed(1)} mm from the target at the decisive instant, 15 mm at most expected`,
      );
  }
  return complaints;
}

import { createPell, createSword } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanBlade,
  HumanChain,
  HumanObject,
  HumanPerformance,
  type HumanSegment,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";

import { motionHumanBody } from "./motionHumanBody";

/**
 * The reading of the blade seed specs on one body: a lunge with an arming
 * sword at a pell 0.91 of the stature away, trained, under two seeds and
 * the first seed again; the bounds are stated on the specs.
 *
 * @param name The body.
 * @returns The complaints, empty when every bound holds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the scene, the takes and where the bounds are stated.
 * @evidence contracts/development/implementation.md#principled-implementation Builds each take through the public chain and input and reads the displayed sword point at the take's decisive instant.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One staging function, the two seeds, then the replay.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The bounds are the spec's own; nothing is loosened by the split.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three films.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the blade seed specs, one per body.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; each film is dropped after its reading.
 */
export function motionBladeSeed(name: motionHumanBody.Name): string[] {
  const sword: ReturnType<typeof createSword> = createSword({
    kind: "armingSword",
  });
  const pell: ReturnType<typeof createPell> = createPell();
  const tip: IAutoMovieVector3 = sword.affordance("point").frame.translation;
  const complaints: string[] = [];
  const body: IHumanBody = motionHumanBody(name);
  const stature: number = body.measure.stature;
  const place: { at: IAutoMovieVector3; yaw: number } = {
    at: { x: 0, y: 0, z: 0.91 * stature },
    yaw: 180,
  };
  const target: IAutoMovieVector3 = Vector3.add(
    place.at,
    Quaternion.rotateVector(
      HumanObject.frame(place).rotation,
      pell.affordance("target").frame.translation,
    ),
  );
  const stage = (
    level: "novice" | "trained" | "elite",
    seed: string,
  ): {
    point: (seconds: number) => IAutoMovieVector3;
    act: HumanSegment.ISegment;
    at: number;
  } => {
    const film: HumanPerformance = new HumanPerformance({
      seed,
      laws: Object.values(HumanBlade),
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level },
        },
      ],
      props: [
        // The sword lies level before the right hand, point ahead.
        HumanObject.prop("sword", sword, {
          position: {
            x: -0.1 * stature,
            y: 0.6 * stature,
            z: 0.18 * stature,
          },
          rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
        }),
        HumanObject.prop("pell", pell, place),
      ],
      composition: HumanChain.subject("a")
        .stand({ seconds: 0.3 })
        .pickUp({
          prop: "sword",
          handle: "grip",
          use: { tip: "point", line: "oblique" },
        })
        .registered("lunge", {
          blade: "sword",
          target: { kind: "prop", subject: "pell", point: "target" },
        }).node,
    });
    const act: HumanSegment.ISegment = film
      .segments("a")
      .find((s: HumanSegment.ISegment): boolean => s.name === "lunge")!;
    return {
      act,
      at: act.start + (act.plan.contact ?? Number.NaN),
      point: (seconds: number): IAutoMovieVector3 => {
        const frame: IHumanProp.IFrame = film.prop("sword", seconds);
        return Vector3.add(
          frame.position,
          Quaternion.rotateVector(frame.rotation, tip),
        );
      },
    };
  };

  // 1. Seeds vary the take, not the landing.
  const instants: Set<string> = new Set();
  const takes: ReturnType<typeof stage>[] = [];
  for (const seed of ["s1", "s2"]) {
    const take: ReturnType<typeof stage> = stage("trained", seed);
    takes.push(take);
    instants.add((take.at - take.act.entryTime).toFixed(4));
    const missed: number = Vector3.length(
      Vector3.subtract(take.point(take.at), target),
    );
    if (!(missed <= 0.015))
      complaints.push(
        `${name}, seed ${seed}: the lunge's point is ${(missed * 1000).toFixed(1)} mm from the target, 15 mm at most expected`,
      );
  }
  if (instants.size < 2)
    complaints.push(
      `${name}: two seeds give one decisive instant, ${[...instants].join(", ")} s into the lunge; a varied timing expected`,
    );

  // 2. A seed replays.
  const first: ReturnType<typeof stage> = takes[0]!;
  const again: ReturnType<typeof stage> = stage("trained", "s1");
  const apart: number = Vector3.length(
    Vector3.subtract(first.point(first.at), again.point(again.at)),
  );
  if (!(Math.abs(first.at - again.at) <= 1e-9 && apart <= 1e-6))
    complaints.push(
      `${name}: the same seed gives decisive instants ${first.at} and ${again.at} s and points ${(apart * 1e6).toFixed(1)} um apart`,
    );
  return complaints;
}

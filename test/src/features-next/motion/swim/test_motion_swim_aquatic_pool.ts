import { createPoolEdge } from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAquatic,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSwim,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../features/internal/motionHumanLaw";
import { nclose } from "../../../features/internal/nclose";
import { vclose } from "../../../features/internal/vclose";

/**
 * A race in a bounded lane and a dive from a raised deck reach the declared surfaces.
 *
 * Scenarios:
 * 1. Crawl and breaststroke leave a racing platform, enter the marked water
 *    and resume swimming back along the lane after a wall plant. Breaststroke
 *    reaches the wall with both wrists before the feet plant.
 * 2. A forward dive from a high platform crosses the same world water plane
 *    with the leading wrist before the head. The crossing replays after later reads.
 * 3. A diver initially standing at water height is refused.
 * 4. A named wall outside the lane or turned obliquely is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two race strokes, the launch and return surfaces, and the adjacent invalid entry.
 * @evidence contracts/development/testing.md#behavioral-verification Uses registered composition with a generated body and real pool affordances. Reads displayed world bones at wall and entry events and before and after the dive entry.
 * @evidence contracts/development/testing.md#independent-expectations The placed wall and water affordances supply planes. The one centimetre tolerance is for the authored wrist or ankle landmark against the plane, not the skin envelope. World Aquatics distinguishes the two-hand breaststroke touch and reversal from the crawl's foot contact.
 * @evidence contracts/development/testing.md#distinguishing-cases The same lane hosts both kinds. The high deck provides a separate flight. The wall and dive cases distinguish a valid support from an invalid placement.
 * @evidence contracts/development/testing.md#execution-ownership Runs in-memory public performance and FK at selected event times without a viewer or a rendered surface proxy.
 */
export function test_motion_swim_aquatic_pool(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const block: ReturnType<typeof createPoolEdge> = createPoolEdge(
    { kind: "startingPlatform" },
    4,
  );
  const wall: ReturnType<typeof createPoolEdge> = createPoolEdge(
    { kind: "deckEdge" },
    5,
  );
  const rotation = Quaternion.identity();
  const metres: number = 0.01;
  const starter: IAutoMovieVector3 =
    block.affordance("platform").frame.translation;
  const water: number = block.affordance("water").frame.translation.y;
  const end: IAutoMovieVector3 = { x: 0, y: 0, z: 6 };
  const props: readonly IAutoMovieMotionHumanProp[] = [
    HumanObject.prop("block", block, {
      position: { x: 0, y: 0, z: 0 },
      rotation,
    }),
    HumanObject.prop("wall", wall, {
      position: end,
      rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180),
    }),
  ];

  const stage = (
    at: IAutoMovieVector3,
    params: IAutoMovieMotionHumanAquatic.IParams,
    scene: readonly IAutoMovieMotionHumanProp[],
  ): motionHumanLaw.IFilm =>
    motionHumanLaw.film(
      new HumanPerformance({
        seed: "aquatic-pool",
        laws: [AutoMovieMotionHumanSwim.aquatic],
        performers: [
          {
            subject: "swimmer",
            body,
            at,
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        props: [...scene],
        composition: HumanChain.subject("swimmer").registered("aquatic", params)
          .node,
      }),
    );
  const position = (
    film: motionHumanLaw.IFilm,
    time: number,
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieVector3 => film.bones("swimmer", time).get(bone)!.worldPosition;

  for (const kind of ["crawlStartTurn", "breaststrokeStartTurn"] as const) {
    const film: motionHumanLaw.IFilm = stage(
      starter,
      {
        kind,
        water,
        wall: end.z - starter.z,
        support: "wall",
      },
      props,
    );
    const entry: number = motionHumanLaw.event(film, "waterEntry", "swimmer");
    const plant: number = motionHumanLaw.event(film, "wallPlant", "swimmer");
    const push: number = motionHumanLaw.event(film, "pushOff", "swimmer");
    const resume: number = motionHumanLaw.event(
      film,
      "resumeStroke",
      "swimmer",
    );
    const relax: number = motionHumanLaw.event(film, "relax", "swimmer");
    const firstWrist: number = Math.min(
      position(film, entry, "leftHand").y,
      position(film, entry, "rightHand").y,
    );
    TestValidator.predicate(
      `${kind} reaches the lane surface`,
      nclose(firstWrist, water, metres),
    );
    for (const t of [plant, (plant + push) / 2, push])
      for (const foot of ["leftFoot", "rightFoot"] as const) {
        const depth: number = position(film, t, foot).z;
        TestValidator.predicate(
          `${kind}: ${foot} bears at the end wall at ${t} s (measured ${depth.toFixed(4)} m, expected ${end.z} m)`,
          nclose(depth, end.z, metres),
        );
      }
    if (kind === "breaststrokeStartTurn") {
      const touch: number = motionHumanLaw.event(
        film,
        "twoHandTouch",
        "swimmer",
      );
      TestValidator.predicate(
        "the simultaneous hand touch precedes the foot plant",
        touch < plant,
      );
      for (const hand of ["leftHand", "rightHand"] as const)
        TestValidator.predicate(
          `breaststroke: ${hand} reaches the wall`,
          nclose(position(film, touch, hand).z, end.z, metres),
        );
    }
    TestValidator.predicate(
      `${kind} swims away from the end wall after reversing`,
      position(film, relax, "hips").z < position(film, resume, "hips").z,
    );
  }

  for (const [label, position, yaw] of [
    ["past the wall span", { ...end, x: 10 }, 180],
    ["oblique to the lane", end, 165],
  ] as const) {
    const placed: IAutoMovieMotionHumanProp = HumanObject.prop("wall", wall, {
      position,
      rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw),
    });
    let refusal: unknown;
    try {
      stage(
        starter,
        { kind: "breaststrokeStartTurn", water, support: "wall" },
        [props[0]!, placed],
      );
    } catch (error) {
      refusal = error;
    }
    TestValidator.predicate(
      `a wall ${label} cannot supply lane contacts`,
      refusal instanceof HumanRefusal &&
        refusal.kind === "affordance" &&
        refusal.axis === "support",
    );
  }

  // A raised rigid deck supplies the launch plane while the lower pool edge
  // independently establishes the water. No board compliance is assumed.
  const tower: IAutoMovieVector3 = { x: 0, y: water + 3, z: -0.16 };
  const platform: IAutoMovieMotionHumanProp = HumanObject.prop("tower", wall, {
    position: tower,
    rotation,
  });
  const dive: motionHumanLaw.IFilm = stage(
    tower,
    { kind: "springboardDive", water },
    [platform, ...props],
  );
  const entry: number = motionHumanLaw.event(dive, "waterEntry", "swimmer");
  const earlier: number = entry - 1 / 120;
  const before: number = Math.min(
    position(dive, earlier, "leftHand").y,
    position(dive, earlier, "rightHand").y,
  );
  const at: IAutoMovieVector3 = position(dive, entry, "rightHand");
  const head: IAutoMovieVector3 = position(dive, entry, "head");
  const later: number = motionHumanLaw.event(dive, "relax", "swimmer");
  TestValidator.predicate(
    "the leading wrists arrive from above before the head",
    before > water &&
      nclose(
        Math.min(at.y, position(dive, entry, "leftHand").y),
        water,
        metres,
      ) &&
      head.y > water,
  );
  const top: number = Math.max(
    ...(
      ["head", "leftHand", "rightHand", "leftFoot", "rightFoot"] as const
    ).map(
      (bone: AutoMovieHumanoidBone): number => position(dive, later, bone).y,
    ),
  );
  TestValidator.predicate(
    `the diver finishes the recovery below the surface (highest marker ${top.toFixed(4)} m, water ${water} m)`,
    top < water,
  );
  TestValidator.predicate(
    "out-of-order entry reaches the same displayed wrist",
    vclose(
      at,
      dive.performance.bones("swimmer", entry).get("rightHand")!.worldPosition,
    ),
  );

  let invalid: unknown;
  try {
    stage({ x: 0, y: water, z: 0 }, { kind: "springboardDive", water }, props);
  } catch (error) {
    invalid = error;
  }
  TestValidator.predicate(
    "a dive needs raised launch support",
    invalid instanceof HumanRefusal && invalid.kind === "base",
  );
}

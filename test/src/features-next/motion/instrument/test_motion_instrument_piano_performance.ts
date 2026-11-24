import { createInstrument, createSeat } from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPianoPerformance,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanInstrument,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../../features/internal/archetypeExtent";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";
import { vclose } from "../../../features/internal/vclose";

/**
 * A seated pianist fingers two notes while holding the damper across the
 * first note's end and releasing it during the second note.
 *
 * Scenarios:
 * 1. At simultaneous full travel the fingertip and forefoot meet the piano.
 * 2. The first key returns with the damper held. The damper returns while
 *    the second key is down. Both clocks retain their authored event times.
 * 3. A longer second note holds after the shorter pedal part restores the
 *    right foot to its original ground plant.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the seated performance, independent releases, and supporting foot.
 * @evidence contracts/development/testing.md#behavioral-verification Registers the combined law, samples the piano's articulated affordances and the displayed body, and checks named events and the recovered right-foot contact window. A clock stretched to the other duration changes the sampled travel or event times.
 * @evidence contracts/development/testing.md#independent-expectations The authored event times set the travel phases. Rigid rotation about the archetype's hinge predicts plate position and normal. The key dip and plate dimensions set the remaining position bounds. The score's provisional polygon tip margin is 5 mm. The sole checks use the shared bearing tolerance and the staged floor.
 * @evidence contracts/development/testing.md#distinguishing-cases Both drives overlap and release independently. Each part outlasts the other in one case. The score and pedal feature tests own standalone admission and individual motion.
 * @evidence contracts/development/testing.md#execution-ownership Discovered by the motions feature suite and runs the in-memory performance on a generated body and archetype.
 */
export function test_motion_instrument_piano_performance(): void {
  const piano: ReturnType<typeof createInstrument> = createInstrument(
    { kind: "uprightPiano" },
    5,
  );
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const params: IAutoMovieMotionHumanPianoPerformance = {
    prop: "upright",
    notes: [
      {
        key: "key35",
        hand: "left",
        digit: "index",
        from: 0.5,
        at: 0.7,
        release: 0.85,
        to: 1.05,
      },
      {
        key: "key46",
        hand: "right",
        digit: "index",
        from: 1.2,
        at: 1.4,
        release: 1.6,
        to: 1.8,
      },
    ],
    pedal: {
      duration: 2.3,
      presses: [{ from: 0.6, at: 0.8, release: 1.3, to: 1.5 }],
    },
  };
  const floor: number = 0;
  const caseFront: number = archetypeExtent(piano, "z", ["case"]).high;
  const stanceZ: number = caseFront + body.measure.footLength + 0.095;
  const bench: ReturnType<typeof createSeat> = createSeat(
    { kind: "bench", places: 1 },
    2,
  );
  const benchFrame: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
    bench,
    {
      at: { x: 0, y: floor, z: 0 },
      yaw: 180,
    },
  );
  const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(bench, {
    at: { x: 0, y: floor, z: stanceZ - benchFrame.at.z },
    yaw: 180,
  });
  /** Place either phrase at the same bench on the same floor. */
  const play = (
    phrase: IAutoMovieMotionHumanPianoPerformance,
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "upright piano performance",
      performers: [
        {
          subject: "pianist",
          body,
          at: { x: seat.at.x, y: floor, z: stanceZ },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        HumanObject.prop(phrase.prop, piano, {
          fixed: true,
          at: { x: 0, y: floor, z: 0 },
          yaw: 0,
        }),
      ],
      laws: [AutoMovieMotionHumanInstrument.pianoPerformance],
      composition: HumanChain.subject("pianist")
        .sit({ seat, hold: 1 })
        .registered("pianoPerformance", phrase, "phrase").node,
    });

  const performance: HumanPerformance = play(params);
  const start: number = performance.instant({ of: "phrase", event: "start" });
  const findings: string[] = [];
  const hinge: IAutoMovieAffordance = piano.affordance("damperPedalHinge");
  const plate: IAutoMovieAffordance = piano.affordance("damperPedal");
  const pivot: IAutoMovieVector3 = hinge.frame.translation;
  const arm: IAutoMovieVector3 = Vector3.subtract(
    plate.frame.translation,
    pivot,
  );

  for (const [local, firstKey, secondKey, pedalShare] of [
    [0, 0, 0, 0],
    [0.8, 1, 0, 1],
    [1.1, 0, 0, 1],
    [1.4, 0, 1, 0.5],
    [1.55, 0, 1, 0],
    [2.3, 0, 0, 0],
  ] as const) {
    const seconds: number = start + local;
    const moved: ReturnType<typeof createInstrument> = piano.articulate(
      performance.state(params.prop, seconds),
    );
    for (const [id, share] of [
      ["key35", firstKey],
      ["key46", secondKey],
    ] as const) {
      const rest: IAutoMovieAffordance = piano.affordance(id);
      const actual: number = moved.affordance(id).frame.translation.y;
      const expected: number = rest.frame.translation.y - rest.travel! * share;
      if (!nclose(actual, expected, 1e-8))
        findings.push(
          `${id} at ${local}s has height ${actual}, expected ${expected}`,
        );
    }

    // The upright's pivot axis is piano-local +X and the plate rests level.
    const angle: number = (pedalShare * hinge.travel! * Math.PI) / 180;
    const sin: number = Math.sin(angle);
    const cos: number = Math.cos(angle);
    const expected: IAutoMovieVector3 = Vector3.add(pivot, {
      x: arm.x,
      y: arm.y * cos - arm.z * sin,
      z: arm.y * sin + arm.z * cos,
    });
    const pedal: IAutoMovieAffordance = moved.affordance("damperPedal");
    const normal: IAutoMovieVector3 = Quaternion.rotateVector(
      pedal.frame.rotation,
      { x: 0, y: 1, z: 0 },
    );
    if (
      !vclose(pedal.frame.translation, expected, 1e-8) ||
      !vclose(normal, { x: 0, y: cos, z: sin }, 1e-8)
    )
      findings.push(`damper plate at ${local}s does not follow its hinge`);

    if (local === 0.8) {
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        performance.bones("pianist", seconds);
      const finger: IAutoMovieHumanoidSurfaces.IFrame =
        body.surfaces.regions.indexTipLeft;
      const tip: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
        finger,
        bones.get(finger.bone)!,
      ).point;
      const key: IAutoMovieVector3 =
        moved.affordance("key35").frame.translation;
      const miss: number = Vector3.length(Vector3.subtract(tip, key));
      if (miss > 0.005)
        findings.push(`left fingertip misses the key by ${miss} m`);

      const right: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
        body,
        bones,
        "right",
      );
      const relative: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(pedal.frame.rotation),
        Vector3.subtract(right[1]!.point, pedal.frame.translation),
      );
      if (
        Math.abs(relative.x) > pedal.width! / 2 ||
        Math.abs(relative.z) > pedal.depth! / 2 ||
        !nclose(relative.y, 0, HumanFoot.BEARING)
      )
        findings.push(
          `right forefoot misses the damper plate at ${JSON.stringify(relative)} m`,
        );
      if (!nclose(right[0]!.point.y, floor, HumanFoot.BEARING))
        findings.push(`right heel leaves the floor at ${right[0]!.point.y} m`);
    }
  }

  const seated: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    performance.bones("pianist", start);
  const returned: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    performance.bones("pianist", start + params.pedal.duration);
  for (const side of ["left", "right"] as const) {
    const planted: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
      body,
      seated,
      side,
    );
    const sockets: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
      body,
      returned,
      side,
    );
    sockets.forEach(({ socket, point }, i): void => {
      if (point.z <= caseFront || !nclose(point.y, floor, HumanFoot.BEARING))
        findings.push(
          `${side} ${socket} does not finish clear of the case on the floor`,
        );
      if (!vclose(point, planted[i]!.point, HumanFoot.BEARING))
        findings.push(`${side} ${socket} does not return to its seated plant`);
    });
  }

  for (const [event, local] of [
    ["keyDown1", 0.7],
    ["pedalDown1", 0.8],
    ["keyUp1", 1.05],
    ["keyDown2", 1.4],
    ["pedalUp1", 1.5],
    ["keyUp2", 1.8],
    ["end", 2.3],
  ] as const) {
    const actual: number = performance.instant({ of: "phrase", event }) - start;
    if (!nclose(actual, local, 1e-9))
      findings.push(`${event} falls at ${actual}s, expected ${local}s`);
  }
  // Extend only the second note so the recovered foot has to stay planted
  // while the right hand is still playing.
  const longerScore: HumanPerformance = play({
    ...params,
    notes: [params.notes[0]!, { ...params.notes[1]!, release: 2.55, to: 2.75 }],
  });
  const laterStart: number = longerScore.instant({
    of: "phrase",
    event: "start",
  });
  for (const [event, local] of [
    ["pedalDown1", 0.8],
    ["pedalUp1", 1.5],
    ["keyUp2", 2.75],
    ["end", 2.75],
  ] as const) {
    const actual: number =
      longerScore.instant({ of: "phrase", event }) - laterStart;
    if (!nclose(actual, local, 1e-9))
      findings.push(
        `longer score ${event} falls at ${actual}s, expected ${local}s`,
      );
  }
  const late: number = 2.45;
  const latePiano: ReturnType<typeof createInstrument> = piano.articulate(
    longerScore.state(params.prop, laterStart + late),
  );
  const rightKey: IAutoMovieAffordance = piano.affordance("key46");
  if (
    !vclose(
      latePiano.affordance("damperPedal").frame.translation,
      plate.frame.translation,
      1e-8,
    ) ||
    !nclose(
      latePiano.affordance("key46").frame.translation.y,
      rightKey.frame.translation.y - rightKey.travel!,
      1e-8,
    )
  )
    findings.push("the right key must stay depressed after the pedal recovers");

  const laterSeated: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    longerScore.bones("pianist", laterStart);
  const rightPlant: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
    body,
    laterSeated,
    "right",
  );
  const laterBones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    longerScore.bones("pianist", laterStart + late);
  const laterFoot: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
    body,
    laterBones,
    "right",
  );
  for (const [i, { socket, point }] of laterFoot.entries())
    if (!vclose(point, rightPlant[i]!.point, HumanFoot.BEARING))
      findings.push(
        `right ${socket} does not stay on its plant under the longer note`,
      );
  const segment: IAutoMovieMotionHumanSegment =
    longerScore.segments("pianist")[1]!;
  const share: number = late / 2.75;
  const pedalShare: number = params.pedal.presses[0]!.at / 2.75;
  if (
    !segment.plan.contacts.some(
      (contact): boolean =>
        contact.part === "rightFoot" &&
        contact.kind === "pivot" &&
        contact.region === "heelRight" &&
        contact.support.kind === "ground" &&
        contact.from <= pedalShare &&
        contact.to >= pedalShare,
    )
  )
    findings.push(
      "the heel pivot must cover the pedal press in the longer score",
    );
  if (
    !segment.plan.contacts.some(
      (contact): boolean =>
        contact.part === "rightFoot" &&
        contact.kind === "plant" &&
        contact.support.kind === "ground" &&
        contact.from <= share &&
        contact.to >= share,
    )
  )
    findings.push("the right foot's ground contact must cover the longer note");

  TestValidator.equals(
    "the key and damper clocks retain independent contacts",
    findings,
    [],
  );
}

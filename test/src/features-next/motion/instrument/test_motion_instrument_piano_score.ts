import { createInstrument, createSeat } from "@automovie/archetypes";
import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPianoScore,
  IAutoMovieMotionHumanSeated,
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

/**
 * A seated pianist depresses a white and black key with different hands
 * over overlapping intervals, then changes fingers on the right hand.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the instrument, the distinct hands and dates of contact, and the independent returns.
 * @evidence contracts/development/testing.md#behavioral-verification Registers the public law after sitting, samples the displayed tips and articulated key surfaces, and checks the score's scheduled events.
 * @evidence contracts/development/testing.md#independent-expectations The rest geometry and full key travel come from the upright piano archetype, and the halfway heights follow from the authored timing's halfway samples. The 5 mm tip margin is provisional for the polygon rig.
 * @evidence contracts/development/testing.md#distinguishing-cases Separate hands overlap, return independently and switch fingers continuously between notes.
 * @evidence contracts/development/testing.md#execution-ownership Discovered as a motions feature test; no viewer or environment dependency.
 */
export function test_motion_instrument_piano_score(): void {
  const piano: ReturnType<typeof createInstrument> = createInstrument(
    { kind: "uprightPiano" },
    5,
  );
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const params: IAutoMovieMotionHumanPianoScore = {
    prop: "upright",
    notes: [
      {
        key: "key35",
        hand: "left",
        digit: "index",
        from: 0.5,
        at: 0.7,
        release: 1.25,
        to: 1.45,
      },
      {
        key: "key46",
        hand: "right",
        digit: "index",
        from: 0.75,
        at: 0.95,
        release: 1.05,
        to: 1.15,
      },
      {
        key: "key47",
        hand: "right",
        digit: "middle",
        from: 1.35,
        at: 1.55,
        release: 1.6,
        to: 1.8,
      },
    ],
  };
  const caseFront: number = archetypeExtent(piano, "z", ["case"]).high;
  // The toes clear the case independently of how close the bench sits to the keys.
  const stanceZ: number = caseFront + body.measure.footLength + 0.095;
  const bench = createSeat({ kind: "bench", places: 1 }, 2);
  const benchFrame = HumanObject.seat(bench, {
    at: { x: 0, y: 0, z: 0 },
    yaw: 180,
  });
  const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(bench, {
    at: { x: 0, y: 0, z: stanceZ - benchFrame.at.z },
    yaw: 180,
  });
  const performance: HumanPerformance = new HumanPerformance({
    seed: "upright piano score",
    performers: [
      {
        subject: "pianist",
        body,
        at: { x: seat.at.x, y: 0, z: stanceZ },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      HumanObject.prop(params.prop, piano, {
        fixed: true,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
      }),
    ],
    laws: [AutoMovieMotionHumanInstrument.pianoScore],
    composition: HumanChain.subject("pianist")
      .sit({ seat, hold: 1 })
      .registered("pianoScore", params, "phrase").node,
  });

  const start: number = performance.instant({ of: "phrase", event: "start" });
  const samples: readonly (readonly [number, number, number, number])[] = [
    [0.4, 0, 0, 0],
    [0.6, 0.5, 0, 0],
    [0.85, 1, 0.5, 0],
    [1.0, 1, 1, 0],
    [1.1, 1, 0.5, 0],
    [1.2, 1, 0, 0],
    [1.35, 0.5, 0, 0],
    [1.55, 0, 0, 1],
    [1.81, 0, 0, 0],
  ];
  const keys = [
    ["key35", "indexTipLeft"],
    ["key46", "indexTipRight"],
    ["key47", "middleTipRight"],
    ["key40", "indexTipRight"],
  ] as const;
  const tops: number[] = keys.map(
    ([id]): number => archetypeExtent(piano, "y", [`${id}-part`]).high,
  );
  const findings: string[] = [];
  const seated = performance.bones("pianist", start);
  for (const side of ["left", "right"] as const)
    if (
      HumanFoot.sockets(body, seated, side).some(
        (socket): boolean => socket.point.z <= caseFront,
      )
    )
      findings.push(`${side} foot overlaps the piano case`);
  for (const [local, ...travel] of samples) {
    const seconds: number = start + local;
    const state: Readonly<Record<string, number>> = performance.state(
      params.prop,
      seconds,
    );
    const moved: ReturnType<typeof createInstrument> = piano.articulate(state);
    const bones = travel.some((share): boolean => share > 0)
      ? performance.bones("pianist", seconds)
      : undefined;
    keys.forEach(([id, region], i): void => {
      const share: number = travel[i] ?? 0;
      const rest: IAutoMovieAffordance = piano.affordance(id);
      const point: IAutoMovieVector3 = moved.affordance(id).frame.translation;
      const y: number = rest.frame.translation.y - rest.travel! * share;
      if (Math.abs(point.y - y) > 1e-8)
        findings.push(`${id} at ${local}s has y=${point.y}, expected ${y}`);
      const part: string = `${id}-part`;
      const expectedTop: number = tops[i]! - rest.travel! * share;
      const top: number = archetypeExtent(moved, "y", [part]).high;
      if (Math.abs(top - expectedTop) > 1e-8)
        findings.push(
          `${part} at ${local}s has top=${top}, expected ${expectedTop}`,
        );
      if (share === 0) return;
      const surface: IAutoMovieHumanoidSurfaces.IFrame =
        body.surfaces.regions[region];
      const tip: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
        surface,
        bones!.get(surface.bone)!,
      ).point;
      const miss: number = Vector3.length(Vector3.subtract(tip, point));
      if (miss > 0.005)
        findings.push(`${region} at ${local}s misses ${id} by ${miss} m`);
    });
  }
  // Across the release and next attack, compare the same tips one film
  // subframe apart on either side. Both boundary velocities are zero.
  for (const [boundary, key, tip] of [
    [1.15, "key46", "indexTipRight"],
    [1.35, "key47", "middleTipRight"],
  ] as const) {
    const before = performance.bones("pianist", start + boundary - 1 / 240);
    const after = performance.bones("pianist", start + boundary + 1 / 240);
    const contact = performance.bones("pianist", start + boundary);
    const target: IAutoMovieVector3 = piano.affordance(key).frame.translation;
    for (const region of ["indexTipRight", "middleTipRight"] as const) {
      const surface: IAutoMovieHumanoidSurfaces.IFrame =
        body.surfaces.regions[region];
      const a: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
        surface,
        before.get(surface.bone)!,
      ).point;
      const b: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
        surface,
        after.get(surface.bone)!,
      ).point;
      const jump: number = Vector3.length(Vector3.subtract(b, a));
      if (jump > 0.005)
        findings.push(`${region} jumps ${jump} m across ${boundary}s`);
      if (region === tip) {
        const at: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
          surface,
          contact.get(surface.bone)!,
        ).point;
        const miss: number = Vector3.length(Vector3.subtract(at, target));
        if (miss > 0.005)
          findings.push(`${region} misses the undepressed ${key} by ${miss} m`);
      }
    }
  }
  for (const [event, local] of [
    ["keyDown1", 0.7],
    ["keyDown2", 0.95],
    ["keyUp2", 1.15],
    ["keyUp1", 1.45],
    ["keyDown3", 1.55],
    ["keyUp3", 1.8],
  ] as const) {
    const actual: number = performance.instant({ of: "phrase", event });
    if (Math.abs(actual - start - local) > 1e-9)
      findings.push(`${event} falls at ${actual - start}s, expected ${local}s`);
  }
  TestValidator.equals(
    "the keys follow the scored fingertip contacts",
    findings,
    [],
  );
}

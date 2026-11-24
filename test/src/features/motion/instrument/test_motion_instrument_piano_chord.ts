import { createInstrument, createSeat } from "@automovie/archetypes";
import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPianoScore,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanInstrument,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { poseBones, resolveHumanPosture } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../internal/archetypeExtent";
import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * A right-hand dyad and a left-hand note overlap on the upright piano.
 *
 * Scenarios:
 *
 * 1. The chord begins on two resting keys, depresses them together and releases
 *    while the other hand still holds its key.
 * 2. The adjacent unscored key stays level throughout both hands' contacts.
 * 3. At full depression of a transferred key, only the new fingertip meets it.
 * 4. Duplicate assignments, zero-gap transfers and unreachable spans are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two hands' tasks and the three admission cases.
 * @evidence contracts/development/testing.md#behavioral-verification Measures the articulated key meshes and canonical fingertip world points of the public score playback.
 * @evidence contracts/development/testing.md#independent-expectations The upright model supplies the initial surfaces and full dip. The authored windows determine which keys have completed each phase. The 5 mm tip margin follows the provisional piano score bound for the polygon rig.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks onset, concurrent full travel, independent release, an unscored neighbor and three distinct invalid assignments.
 * @evidence contracts/development/testing.md#execution-ownership A discovered motions feature test using the generated polygon body and installed archetypes.
 */
export function test_motion_instrument_piano_chord(): void {
  const piano: ReturnType<typeof createInstrument> = createInstrument(
    { kind: "uprightPiano" },
    5,
  );
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const left = {
    key: "key35",
    hand: "left",
    digit: "index",
    from: 0.5,
    at: 0.7,
    release: 1.25,
    to: 1.45,
  } as const satisfies IAutoMovieMotionHumanPianoScore.INote;
  const index = {
    key: "key45",
    hand: "right",
    digit: "index",
    from: 0.75,
    at: 0.95,
    release: 1.05,
    to: 1.15,
  } as const satisfies IAutoMovieMotionHumanPianoScore.INote;
  const middle = {
    ...index,
    key: "key47",
    digit: "middle",
  } as const satisfies IAutoMovieMotionHumanPianoScore.INote;
  const caseFront: number = archetypeExtent(piano, "z", ["case"]).high;
  // Keep the feet clear while placing the bench within chord reach.
  const stanceZ: number = caseFront + body.measure.footLength + 0.095;
  const bench: ReturnType<typeof createSeat> = createSeat(
    { kind: "bench", places: 1 },
    2,
  );
  const benchFrame: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
    bench,
    {
      at: { x: 0, y: 0, z: 0 },
      yaw: 180,
    },
  );
  const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(bench, {
    at: { x: 0, y: 0, z: stanceZ - benchFrame.at.z },
    yaw: 180,
  });
  const perform = (
    notes: readonly IAutoMovieMotionHumanPianoScore.INote[],
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "upright piano chord",
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
        HumanObject.prop("upright", piano, {
          fixed: true,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
        }),
      ],
      laws: [AutoMovieMotionHumanInstrument.pianoScore],
      composition: HumanChain.subject("pianist")
        .sit({ seat, hold: 1 })
        .registered("pianoScore", { prop: "upright", notes }, "phrase").node,
    });
  const performance: HumanPerformance = perform([left, index, middle]);
  const start: number = performance.instant({ of: "phrase", event: "start" });
  const keys = [
    [left.key, "indexTipLeft"],
    [index.key, "indexTipRight"],
    [middle.key, "middleTipRight"],
    ["key46", undefined],
  ] as const;
  const tops: number[] = keys.map(
    ([id]): number => archetypeExtent(piano, "y", [`${id}-part`]).high,
  );
  const findings: string[] = [];
  const samples = [
    [index.from, 0],
    [(index.from + index.at) / 2, 0.5],
    [index.at, 1],
    [index.release, 1],
    [(index.release + index.to) / 2, 0.5],
    [index.to, 0],
  ] as const;
  for (const [local, chord] of samples) {
    const seconds: number = start + local;
    const moved: ReturnType<typeof createInstrument> = piano.articulate(
      performance.state("upright", seconds),
    );
    const bones: ReturnType<HumanPerformance["bones"]> = performance.bones(
      "pianist",
      seconds,
    );
    keys.forEach(([id, region], i): void => {
      const share: number = i === 0 ? 1 : i === 3 ? 0 : chord;
      const rest: IAutoMovieAffordance = piano.affordance(id);
      const top: number = archetypeExtent(moved, "y", [`${id}-part`]).high;
      const expected: number = tops[i]! - rest.travel! * share;
      if (Math.abs(top - expected) > 1e-8)
        findings.push(
          `${id} at ${local}s has top=${top}, expected ${expected}`,
        );
      if (region === undefined) return;
      const surface: IAutoMovieHumanoidSurfaces.IFrame =
        body.surfaces.regions[region];
      const tip: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
        surface,
        bones.get(surface.bone)!,
      ).point;
      const point: IAutoMovieVector3 = moved.affordance(id).frame.translation;
      const miss: number = Vector3.length(Vector3.subtract(tip, point));
      if (!(miss <= 0.005))
        findings.push(`${region} at ${local}s misses ${id} by ${miss} m`);
    });
  }

  const segment: IAutoMovieMotionHumanSegment = performance
    .segments("pianist")
    .find(
      (candidate: IAutoMovieMotionHumanSegment): boolean =>
        candidate.id === "phrase",
    )!;
  const transfer = {
    ...left,
    key: index.key,
    from: 1.6,
    at: 1.8,
    release: 1.9,
    to: 2,
  } as const satisfies IAutoMovieMotionHumanPianoScore.INote;
  const transferred: IAutoMovieMotionHumanActionPlan =
    AutoMovieMotionHumanInstrument.pianoScore.plan({
      ...segment.context,
      params: { prop: "upright", notes: [left, index, middle, transfer] },
    });
  const transferPosture: IAutoMovieMotionHumanPosture = transferred.posture(
    transfer.at,
  );
  const digits = transferPosture.digits;
  if (digits?.rightIndex !== undefined || digits?.leftIndex === undefined)
    findings.push("the released key did not pass exclusively to the left hand");

  const transferredBones: ReturnType<typeof poseBones> = poseBones(
    body,
    resolveHumanPosture(body, transferPosture),
  );
  const transferredKey: IAutoMovieAffordance = piano.affordance(transfer.key);
  const depressed: IAutoMovieVector3 = piano
    .articulate({ [transfer.key]: transferredKey.travel! })
    .affordance(transfer.key).frame.translation;
  for (const [region, contacts] of [
    ["indexTipLeft", true],
    ["indexTipRight", false],
  ] as const) {
    const surface: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.regions[region];
    const tip: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
      surface,
      transferredBones.get(surface.bone)!,
    ).point;
    const gap: number = Vector3.length(Vector3.subtract(tip, depressed));
    if (!Number.isFinite(gap) || gap <= 0.005 !== contacts)
      findings.push(
        `${region} is ${gap} m from the transferred ${transfer.key}`,
      );
  }

  // A placed score must refuse either ambiguous assignment or a missed
  // chord, before it publishes any of the prop drives.
  for (const [name, notes, axis, kind] of [
    [
      "duplicate digit",
      [index, { ...middle, digit: index.digit }],
      "notes.digit",
      "parameter",
    ],
    [
      "duplicate key",
      [index, { ...middle, key: index.key }],
      "notes.key",
      "parameter",
    ],
    [
      "zero-gap key transfer",
      [index, { ...transfer, from: index.to }],
      "notes.key",
      "parameter",
    ],
    [
      "unreachable span",
      [
        { ...index, key: "key1" },
        { ...middle, key: "key88" },
      ],
      "notes.key",
      "reach",
    ],
  ] as const) {
    try {
      AutoMovieMotionHumanInstrument.pianoScore.plan({
        ...segment.context,
        params: { prop: "upright", notes },
      });
      findings.push(`${name} was accepted`);
    } catch (error) {
      if (
        !(error instanceof HumanRefusal) ||
        error.axis !== axis ||
        error.kind !== kind
      )
        findings.push(`${name} produced ${String(error)}`);
    }
  }
  TestValidator.equals("the chord reaches its scored keys", findings, []);
}

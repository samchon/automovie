import { createInstrument } from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGuitarChord,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanInstrument,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** Displayed fingertip tolerance, metres, for the keyed contact from #3446. */
const CONTACT: number = 0.002;

/**
 * The same rotated guitar supports two fretted fingers across a continuous
 * right-index sweep. Scenarios:
 *
 * 1. Down starts on the lower-pitched string 3 and continues to string 2.
 * 2. Up traverses the same sites in reverse and leaves the voicing held.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the directed cases and the static fretting requirement.
 * @evidence contracts/development/testing.md#behavioral-verification Registers the law in the performance and observes displayed fingertip surfaces and contact events.
 * @evidence contracts/development/testing.md#independent-expectations Builds string endpoints from the archetype's published measurements and projects the centres without reading the law's goals.
 * @evidence contracts/development/testing.md#distinguishing-cases Both directions must keep identical fretting contacts while changing the order of two distinct pitched crossings.
 * @evidence contracts/development/testing.md#execution-ownership Uses a canonical motion body and archetype without viewer or capture dependencies.
 */
export function test_motion_instrument_guitar_chord(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const guitar: ReturnType<typeof createInstrument> = createInstrument({
    kind: "guitar",
  });
  const top: number = guitar.dimensions.bodyDepth!;
  const position: IAutoMovieVector3 = {
    x: -0.06,
    y: body.measure.shoulderHeight - body.measure.upperArm - top,
    z: body.rest.get("rightUpperArm")!.z + 0.8 * body.measure.forearm,
  };
  const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    9,
  );
  const stopAt: number = 0.5;
  const sweepStartAt: number = 0.65;
  const sweepEndAt: number = 0.95;
  const releaseAt: number = 1.2;
  const duration: number = 1.5;
  const scale: number = guitar.dimensions.scale!;
  const nutX: number = scale * (1 - 2 ** (-14 / 12));
  const saddleX: number = nutX - scale;
  const soundboard: IAutoMovieVector3 = { x: saddleX / 2, y: top, z: 0 };

  /** Expected points from the string endpoints and the fret's X station. */
  const sites = (
    fret: number,
    span: number,
  ): readonly [IAutoMovieVector3, IAutoMovieVector3] => {
    const saddle: IAutoMovieVector3 = {
      x: saddleX,
      y: top,
      z: span * guitar.dimensions.saddle!,
    };
    const nut: IAutoMovieVector3 = {
      x: nutX,
      y: top,
      z: span * guitar.dimensions.nut!,
    };
    const axis: IAutoMovieVector3 = Vector3.subtract(nut, saddle);
    const fretX: number = guitar.affordance(`fret${fret}`).frame.translation.x;
    return [
      Vector3.lerp(saddle, nut, (fretX - saddleX) / scale),
      Vector3.lerp(
        saddle,
        nut,
        Vector3.dot(Vector3.subtract(soundboard, saddle), axis) /
          Vector3.dot(axis, axis),
      ),
    ];
  };
  const [index, string3]: readonly [IAutoMovieVector3, IAutoMovieVector3] =
    sites(4, -0.1);
  const [middle, string2]: readonly [IAutoMovieVector3, IAutoMovieVector3] =
    sites(5, -0.3);
  const complaints: string[] = [];
  for (const direction of ["down", "up"] as const) {
    const params: IAutoMovieMotionHumanGuitarChord = {
      prop: "instrument",
      direction,
      stopAt,
      sweepStartAt,
      sweepEndAt,
      releaseAt,
      duration,
    };
    const film: HumanPerformance = new HumanPerformance({
      seed: "fretted sweep",
      laws: [AutoMovieMotionHumanInstrument.guitarChord],
      performers: [
        {
          subject: "player",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        HumanObject.prop(params.prop, guitar, {
          position,
          rotation,
          fixed: true,
        }),
      ],
      composition: HumanChain.subject("player").registered(
        "guitarChord",
        params,
      ).node,
    });
    const segment: IAutoMovieMotionHumanSegment = film.segments("player")[0]!;

    /** Read a displayed fingertip in the rigid guitar frame. */
    const tip = (
      region: IAutoMovieHumanoidSurfaces.IFrame,
      seconds: number,
    ): IAutoMovieVector3 => {
      const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        film.bones("player", segment.start + seconds);
      const world: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
        region,
        bones.get(region.bone)!,
      ).point;
      return Quaternion.rotateVector(
        Quaternion.inverse(rotation),
        Vector3.subtract(world, position),
      );
    };

    /** Accumulate every contact miss before failing the scenario. */
    const contact = (
      region: IAutoMovieHumanoidSurfaces.IFrame,
      target: IAutoMovieVector3,
      seconds: number,
    ): void => {
      const miss: number = Vector3.length(
        Vector3.subtract(tip(region, seconds), target),
      );
      if (!(miss <= CONTACT))
        complaints.push(
          `${direction} ${region.bone} missed by ${miss * 1000} mm at ${seconds} s`,
        );
    };

    const leftIndex: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.regions.indexTipLeft;
    const leftMiddle: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.regions.middleTipLeft;
    const rightIndex: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.regions.indexTipRight;
    const first: number = 0.75;
    const second: number = 0.85;
    for (const time of [
      stopAt,
      first,
      (first + second) / 2,
      second,
      releaseAt,
    ]) {
      contact(leftIndex, index, time);
      contact(leftMiddle, middle, time);
    }
    contact(rightIndex, direction === "down" ? string3 : string2, first);
    contact(rightIndex, direction === "down" ? string2 : string3, second);
    contact(
      rightIndex,
      Vector3.lerp(string2, string3, 0.5),
      (first + second) / 2,
    );
    const [nameFirst, nameSecond]: readonly [string, string] =
      direction === "down" ? ["string3", "string2"] : ["string2", "string3"];
    const events: ReadonlyMap<string, number> = new Map(
      segment.plan.events.map(({ name, share }): [string, number] => [
        name,
        share * duration,
      ]),
    );
    if (
      Math.abs((events.get(nameFirst) ?? Infinity) - first) > 1e-12 ||
      Math.abs((events.get(nameSecond) ?? Infinity) - second) > 1e-12 ||
      Math.abs((segment.plan.contact ?? Infinity) - first) > 1e-12
    )
      complaints.push(
        `${direction} did not announce both crossings at their authored times`,
      );
    for (const region of [leftIndex, leftMiddle, rightIndex])
      if (!(tip(region, duration).y > top + CONTACT))
        complaints.push(
          `${direction} ${region.bone} did not lift clear at the end`,
        );
  }
  TestValidator.equals(
    "two sustained stops and two ordered crossings",
    complaints,
    [],
  );
}

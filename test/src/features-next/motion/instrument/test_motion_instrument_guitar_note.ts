import { createInstrument } from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGuitarNote,
  IAutoMovieMotionHumanProp,
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

/** Fingertip contact bound, metres, from the keyed digit target of #3446. */
const CONTACT: number = 0.002;

/**
 * A rotated staged guitar with an interior string stopped before a pluck.
 * The string's bar frame is reversed along its length.
 *
 * Scenarios:
 * 1. The displayed left index holds the stop while the right index plucks.
 * 2. The right index crosses in the same physical direction and both tips clear.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the stage, fingertips and phases under measurement.
 * @evidence contracts/development/testing.md#behavioral-verification Resolves the registered law in a performance and measures displayed skeletal fingertip surfaces.
 * @evidence contracts/development/testing.md#independent-expectations Computes the left target from the produced fret's X station and the string endpoints; projects the soundboard centre onto those endpoints for the right target without consuming planned goals.
 * @evidence contracts/development/testing.md#distinguishing-cases An interior string differs from both bar origins, its reversed frame tests invariance to the bar axis sign, a rotated stage differs from model coordinates, and the phases distinguish pressing from crossing and releasing.
 * @evidence contracts/development/testing.md#execution-ownership Builds an archetype and a canonical polygon body without the viewer or a capture host.
 */
export function test_motion_instrument_guitar_note(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const guitar: ReturnType<typeof createInstrument> = createInstrument({
    kind: "guitar",
  });
  const params: IAutoMovieMotionHumanGuitarNote = {
    prop: "instrument",
    fret: "fret5",
    string: "string2",
    stopAt: 0.5,
    pluckAt: 0.9,
    releaseAt: 1.3,
    duration: 1.6,
  };
  const top: number = guitar.dimensions.bodyDepth!;
  const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    9,
  );
  const position: IAutoMovieVector3 = {
    x: -0.06,
    y: body.measure.shoulderHeight - body.measure.upperArm - top,
    z: body.rest.get("rightUpperArm")!.z + 0.8 * body.measure.forearm,
  };
  const prop: IAutoMovieMotionHumanProp = HumanObject.prop(
    params.prop,
    guitar,
    {
      position,
      rotation,
      fixed: true,
    },
  );
  const halfTurn: IAutoMovieQuaternion = { x: 0, y: 1, z: 0, w: 0 };
  const affordances: IAutoMovieAffordance[] = guitar.affordances.map(
    (affordance: IAutoMovieAffordance): IAutoMovieAffordance =>
      affordance.id === params.string
        ? {
            ...affordance,
            frame: {
              ...affordance.frame,
              rotation: Quaternion.multiply(
                affordance.frame.rotation,
                halfTurn,
              ),
            },
          }
        : affordance,
  );
  const film: HumanPerformance = new HumanPerformance({
    seed: "stopped string",
    laws: [AutoMovieMotionHumanInstrument.guitarNote],
    performers: [
      {
        subject: "player",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: [{ ...prop, affordances }],
    composition: HumanChain.subject("player").registered("guitarNote", params)
      .node,
  });

  // Derive string 2's endpoints independently from the model dimensions.
  const scale: number = guitar.dimensions.scale!;
  const nutX: number = scale * (1 - 2 ** (-14 / 12));
  const nut: IAutoMovieVector3 = {
    x: nutX,
    y: top,
    z: -0.3 * guitar.dimensions.nut!,
  };
  const saddle: IAutoMovieVector3 = {
    x: nutX - scale,
    y: top,
    z: -0.3 * guitar.dimensions.saddle!,
  };
  const along: IAutoMovieVector3 = Vector3.subtract(nut, saddle);
  const fretX: number = guitar.affordance("fret5").frame.translation.x;
  const stop: IAutoMovieVector3 = Vector3.lerp(
    saddle,
    nut,
    (fretX - saddle.x) / scale,
  );
  const centre: IAutoMovieVector3 = { x: saddle.x / 2, y: top, z: 0 };
  const pluck: IAutoMovieVector3 = Vector3.lerp(
    saddle,
    nut,
    Vector3.dot(Vector3.subtract(centre, saddle), along) /
      Vector3.dot(along, along),
  );
  const sideOfString: IAutoMovieVector3 = Vector3.normalize(
    Vector3.cross(along, { x: 0, y: 1, z: 0 }),
  );
  const segment: IAutoMovieMotionHumanSegment = film.segments("player")[0]!;
  const tip = (
    side: AutoMovieHumanSide,
    seconds: number,
  ): IAutoMovieVector3 => {
    const region: IAutoMovieHumanoidSurfaces.IFrame =
      side === "left"
        ? body.surfaces.regions.indexTipLeft
        : body.surfaces.regions.indexTipRight;
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

  const complaints: string[] = [];
  const check = (message: string, passed: boolean): void => {
    if (!passed) complaints.push(message);
  };
  for (const seconds of [
    params.stopAt,
    0.7,
    params.pluckAt,
    1.1,
    params.releaseAt,
  ]) {
    const miss: number = Vector3.length(
      Vector3.subtract(tip("left", seconds), stop),
    );
    check(
      `the left index stops string 2 at fret 5 at ${seconds}s (${miss * 1000} mm)`,
      miss <= CONTACT,
    );
  }
  const pluckMiss: number = Vector3.length(
    Vector3.subtract(tip("right", params.pluckAt), pluck),
  );
  check(
    `the right index crosses string 2 over the soundboard (${pluckMiss * 1000} mm)`,
    pluckMiss <= CONTACT,
  );
  const before: number = Vector3.dot(
    Vector3.subtract(tip("right", 0.72), pluck),
    sideOfString,
  );
  const after: number = Vector3.dot(
    Vector3.subtract(tip("right", 1.08), pluck),
    sideOfString,
  );
  check("the right index passes across the string", before < 0 && after > 0);
  for (const side of ["left", "right"] as const)
    check(
      `the ${side} index lifts above the strings after the note`,
      tip(side, params.duration).y > top + CONTACT,
    );

  for (const [name, seconds] of [
    ["stop", params.stopAt],
    ["pluck", params.pluckAt],
    ["release", params.releaseAt],
  ] as const) {
    const event: IAutoMovieMotionEvent | undefined = segment.plan.events.find(
      (item: IAutoMovieMotionEvent): boolean => item.name === name,
    );
    check(
      `${name} stays on the authored clock`,
      event !== undefined &&
        Math.abs(event.share * segment.plan.duration - seconds) < 1e-12,
    );
  }
  TestValidator.equals("all stopped-note phases", complaints, []);
}

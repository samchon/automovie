import { IAutoMovieFramedSubject, compileCameraMove } from "@automovie/engine";
import { IAutoMovieCamera, IAutoMovieCameraAction, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose, vclose } from "../internal/predicates";

const CAMERA: IAutoMovieCamera = {
  id: "cam",
  transform: {
    translation: { x: 0, y: 1, z: 4 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  fovY: 90,
  near: 0.1,
  far: 1000,
  depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
};

const frame: (move: IAutoMovieCameraAction["move"], start?: number, duration?: number | "auto") => IAutoMovieCameraAction = (
  move: IAutoMovieCameraAction["move"],
  start: number = 0,
  duration: number | "auto" = "auto",
): IAutoMovieCameraAction => ({
  verb: "frame",
  actor: "cam",
  start,
  duration,
  framing: "full",
  move,
  on: { kind: "point", point: { x: 0, y: 0, z: 0 } },
});

/**
 * Pins the moving paths and the builder's edge branches. Subject height 2 at
 * the origin, `full` framing (1.15×, aim at half height y = 1), 90° FOV →
 * framed distance `d = 1.15`.
 *
 * Scenarios:
 *
 * 1. `orbit` → 9 keys sweeping 45°, every position at distance `d` from the aim,
 *    the last bearing swung off the initial +Z, and the swept angle **eased**
 *    in and out (the mid-arc segments turn faster than the end ones).
 * 2. `follow` with an animated base marching down +X → 5 keys over one second (4
 *    Hz + endpoints) whose X tracks the subject.
 * 3. `follow` with a static subject (`at: null`) degenerates to one static key.
 * 4. Two moves abutting on the same instant → the later framing replaces the
 *    earlier key instead of minting a zero-width span.
 * 5. A camera staged exactly on the aim point falls back to the +Z bearing.
 * 6. No entries → no clip (`null`).
 * 7. Truck movement ends screen-left at fixed depth, keeps an animated
 *    subject's endpoint shift, and has a defined lateral fallback for a
 *    vertical staged bearing.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls compileCameraMove for orbit, follow, truck, static, colliding start times, and empty entries, observing key counts, selected positions, orbit radius/easing, and fallback bearings.
 * @evidence contracts/testing.md#independent-expectations A two-metre full subject at 90-degree FOV gives the fixed 1.15 metre distance and one-metre aim. Euclidean Math.hypot and atan2 measure orbit radius and angle independently; literal follow and truck endpoints follow the authored one-metre subject translation and framing grammar.
 * @evidence contracts/testing.md#distinguishing-cases Orbit mid-arc speed exceeds both ends, animated follow differs from static follow, later same-time framing replaces the earlier one, and vertical or zero staged bearings must return defined positions. Empty entries must yield null rather than a fabricated clip.
 * @evidence contracts/testing.md#execution-ownership Uses synchronous compilation and a local pure subject-position callback through the product seam; no renderer, filesystem, clock, process state, or dependency replacement is involved. Selected numerical keys do not prove rendered interpolation between them.
 */
export function test_film_camera_move_paths(): void {
  const subject: IAutoMovieFramedSubject = { base: { x: 0, y: 0, z: 0 }, height: 2, at: null };
  const orbit: NonNullable<ReturnType<typeof compileCameraMove>> = compileCameraMove({
    clipId: "clip",
    camera: CAMERA,
    entries: [{ action: frame("orbit"), subject }],
    shotDuration: 2,
  })!;
  TestValidator.equals("orbit keys", orbit.tracks[0]!.times.length, 9);
  const aim: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  for (let k: number = 0; k < 9; ++k) {
    const pos: IAutoMovieVector3 = {
      x: orbit.tracks[0]!.values[k * 3]!,
      y: orbit.tracks[0]!.values[k * 3 + 1]!,
      z: orbit.tracks[0]!.values[k * 3 + 2]!,
    };
    TestValidator.predicate(
      `orbit key ${k} keeps the framed distance`,
      nclose(Math.hypot(pos.x - aim.x, pos.y - aim.y, pos.z - aim.z), 1.15, 1e-6),
    );
  }
  TestValidator.predicate(
    "orbit swings off the initial bearing",
    Math.abs(orbit.tracks[0]!.values[24]!) > 0.5,
  );

  // the swept angle eases in/out: consecutive keys turn slowly at the ends and
  // faster through the mid-arc (a reveal orbit, not a constant-rate turntable).
  const ang: (k: number) => number = (k: number): number =>
    Math.atan2(
      orbit.tracks[0]!.values[k * 3]! - aim.x,
      orbit.tracks[0]!.values[k * 3 + 2]! - aim.z,
    );
  const step: (a: number, b: number) => number = (a: number, b: number): number => Math.abs(ang(b) - ang(a));
  TestValidator.predicate("orbit sweeps forty-five degrees", nclose(step(0, 8), Math.PI / 4));
  TestValidator.equals(
    "orbit eases: the mid-arc turns faster than either end",
    namedFacts([
      ["fasterThanOpening", (): boolean => step(3, 4) > step(0, 1) + 1e-6],
      ["fasterThanClosing", (): boolean => step(3, 4) > step(7, 8) + 1e-6],
    ]),
    { fasterThanOpening: true, fasterThanClosing: true },
  );

  const marching: IAutoMovieFramedSubject = {
    base: { x: 0, y: 0, z: 0 },
    height: 2,
    at: (t: number): IAutoMovieVector3 => ({ x: t, y: 0, z: 0 }),
  };
  const follow: NonNullable<ReturnType<typeof compileCameraMove>> = compileCameraMove({
    clipId: "clip",
    camera: CAMERA,
    entries: [{ action: frame("follow", 0, 1), subject: marching }],
    shotDuration: 2,
  })!;
  TestValidator.equals("follow keys", follow.tracks[0]!.times.length, 5);
  for (let k: number = 0; k < 5; ++k)
    TestValidator.predicate(`follow key ${k} tracks the quarter-second subject position`, nclose(follow.tracks[0]!.times[k]!, k / 4) && nclose(follow.tracks[0]!.values[k * 3]!, k / 4));
  TestValidator.predicate(
    "follow starts on the subject",
    nclose(follow.tracks[0]!.values[0]!, 0),
  );
  TestValidator.predicate(
    "follow ends on the subject",
    nclose(follow.tracks[0]!.values[12]!, 1),
  );

  const held: NonNullable<ReturnType<typeof compileCameraMove>> = compileCameraMove({
    clipId: "clip",
    camera: CAMERA,
    entries: [{ action: frame("follow"), subject }],
    shotDuration: 2,
  })!;
  TestValidator.equals(
    "static-subject follow holds",
    { length: held.tracks[0]!.times.length, atZero: nclose(held.tracks[0]!.times[0]!, 0) },
    { length: 1, atZero: true },
  );

  const truck: NonNullable<ReturnType<typeof compileCameraMove>> = compileCameraMove({
    clipId: "clip",
    camera: CAMERA,
    entries: [{ action: frame("truck", 0, 2), subject }],
    shotDuration: 2,
  })!;
  TestValidator.equals(
    "truck eases over 9 keys",
    truck.tracks[0]!.times.length,
    9,
  );
  TestValidator.equals(
    "truck finishes screen-left while holding staged depth",
    namedFacts([
      ["ncloseTruckTracks", (): boolean => nclose(truck.tracks[0]!.values[24]!, -1.15)],
      ["ncloseTruckTracks2", (): boolean => nclose(truck.tracks[0]!.values[25]!, 1)],
      ["ncloseTruckTracks3", (): boolean => nclose(truck.tracks[0]!.values[26]!, 1.15)],
    ]),
    {
      ncloseTruckTracks: true,
      ncloseTruckTracks2: true,
      ncloseTruckTracks3: true,
    },
  );
  const movingTruck: NonNullable<ReturnType<typeof compileCameraMove>> = compileCameraMove({
    clipId: "clip",
    camera: CAMERA,
    entries: [{ action: frame("truck", 0, 1), subject: marching }],
    shotDuration: 2,
  })!;
  TestValidator.predicate(
    "truck keeps tracking an animated subject",
    nclose(movingTruck.tracks[0]!.values[24]!, -0.15),
  );
  const verticalTruck: NonNullable<ReturnType<typeof compileCameraMove>> = compileCameraMove({
    clipId: "clip",
    camera: {
      ...CAMERA,
      transform: {
        ...CAMERA.transform,
        translation: { x: 0, y: 3, z: 0 },
      },
    },
    entries: [{ action: frame("truck", 0, 2), subject }],
    shotDuration: 2,
  })!;
  TestValidator.equals(
    "a vertical staged bearing uses the total screen-left fallback",
    namedFacts([
      [
        "ncloseVerticalTruckTracks",
        (): boolean => nclose(verticalTruck.tracks[0]!.values[24]!, -1.15),
      ],
      [
        "ncloseVerticalTruckTracks2",
        (): boolean => nclose(verticalTruck.tracks[0]!.values[25]!, 2.15),
      ],
      [
        "ncloseVerticalTruckTracks3",
        (): boolean => nclose(verticalTruck.tracks[0]!.values[26]!, 0),
      ],
    ]),
    {
      ncloseVerticalTruckTracks: true,
      ncloseVerticalTruckTracks2: true,
      ncloseVerticalTruckTracks3: true,
    },
  );

  const abutted: NonNullable<ReturnType<typeof compileCameraMove>> = compileCameraMove({
    clipId: "clip",
    camera: CAMERA,
    entries: [
      { action: frame("static", 0, "auto"), subject },
      {
        action: frame("static", 0, "auto"),
        subject: { ...subject, height: 1 },
      },
    ],
    shotDuration: 2,
  })!;
  TestValidator.equals(
    "same-instant keys collapse to the later framing",
    { length: abutted.tracks[0]!.times.length, atZero: nclose(abutted.tracks[0]!.times[0]!, 0) },
    { length: 1, atZero: true },
  );
  TestValidator.predicate(
    // Height-2 framing sits at y = 1; the height-1 framing aims at y = 0.5
    // with a slight upward bearing (staged camera at y = 1), landing ≈ 0.57.
    "the later (height 1) framing won",
    abutted.tracks[0]!.values[1]! < 0.8,
  );

  const onAim: NonNullable<ReturnType<typeof compileCameraMove>> = compileCameraMove({
    clipId: "clip",
    camera: {
      ...CAMERA,
      transform: { ...CAMERA.transform, translation: { x: 0, y: 1, z: 0 } },
    },
    entries: [{ action: frame("static"), subject }],
    shotDuration: 2,
  })!;
  TestValidator.predicate(
    "degenerate bearing falls back to +Z",
    vclose(
      {
        x: onAim.tracks[0]!.values[0]!,
        y: onAim.tracks[0]!.values[1]!,
        z: onAim.tracks[0]!.values[2]!,
      },
      { x: 0, y: 1, z: 1.15 },
    ),
  );

  TestValidator.equals(
    "no entries, no clip",
    compileCameraMove({
      clipId: "clip",
      camera: CAMERA,
      entries: [],
      shotDuration: 2,
    }),
    null,
  );
}

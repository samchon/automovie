import { IAutoMovieFramedSubject, Quaternion, compileCameraMove } from "@automovie/engine";
import {
  IAutoMovieCamera,
  IAutoMovieCameraAction,
  IAutoMovieQuaternion,
  IAutoMovieTrack,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose, qclose, vclose } from "../internal/predicates";

const camera: (translation?: IAutoMovieVector3, rotation?: IAutoMovieQuaternion) => IAutoMovieCamera = (
  translation: IAutoMovieVector3 = { x: 0, y: 1.44, z: 5 },
  rotation: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 },
): IAutoMovieCamera => ({
  id: "cam",
  transform: { translation, rotation, scale: { x: 1, y: 1, z: 1 } },
  fovY: 90,
  near: 0.1,
  far: 1000,
  depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
});

const frame: (move: IAutoMovieCameraAction["move"], framing: IAutoMovieCameraAction["framing"], start?: number, duration?: number | "auto") => IAutoMovieCameraAction = (
  move: IAutoMovieCameraAction["move"],
  framing: IAutoMovieCameraAction["framing"],
  start: number = 0,
  duration: number | "auto" = "auto",
): IAutoMovieCameraAction => ({
  verb: "frame",
  actor: "cam",
  start,
  duration,
  framing,
  move,
  on: { kind: "point", point: { x: 0, y: 0, z: 0 } },
});

const SUBJECT: IAutoMovieFramedSubject = { base: { x: 0, y: 0, z: 0 }, height: 2, at: null };

/**
 * Pins the framing grammar's arithmetic with hand-computed oracles. With a 90°
 * vertical FOV, `tan(fovY/2) = 1`, so the framed distance is exactly half the
 * visible height: a subject of height 2 framed `medium` (0.62×) gives `d = 1.24
 * / 2 = 0.62`, aimed at 0.72 × height = y 1.44.
 *
 * Scenarios:
 *
 * 1. `static medium` → one key at the framed position `(0, 1.44, 0.62)` (the
 *    staged bearing is +Z), rotation identity (−Z already faces the aim),
 *    emitted as `translation` + `rotation` node tracks on the camera.
 * 2. `push-in medium` → an eased dolly (9 keys) from `0.62×1.25 = 0.775` to
 *    `0.62×0.8 = 0.496` along the bearing, easeInOut so it starts slow (the
 *    quarter-mark key sits at 0.7401, short of a linear 0.705), spanning start
 *    → shot end.
 * 3. `whip` from a 90°-yawed staged orientation → two keys 0.2 s apart, both at
 *    the STAGED position (a whip pans in place), rotating from the staged
 *    quaternion to the aim.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls compileCameraMove for static, push-in, and whip actions, checking track kinds, key counts, positions, timing, eased progress, and the whip's staged start and aimed landing.
 * @evidence contracts/testing.md#independent-expectations A two-metre subject and 90-degree FOV give the hand-authored 0.62 distance and 1.44 aim. Push-in endpoints 0.775 and 0.496, quarter progress 0.7401, and the 0.2-second whip span are fixed grammar expectations; the final forward axis independently checks the landing orientation.
 * @evidence contracts/testing.md#distinguishing-cases Static position differs from the staged distance; eased quarter progress differs from linear movement; a yawed staged whip must retain its position while starting from that yaw and landing on the aim.
 * @evidence contracts/testing.md#execution-ownership Uses synchronous camera compilation and quaternion-vector math on local records without a renderer, resource access, clock, process state, or replacement of product dependencies; selected track values establish numerical grammar behavior, not every clip field or a rendered move.
 */
export function test_film_camera_move_grammar(): void {
  const still: ReturnType<typeof compileCameraMove> = compileCameraMove({
    clipId: "clip",
    camera: camera(),
    entries: [{ action: frame("static", "medium"), subject: SUBJECT }],
    shotDuration: 2,
  });
  TestValidator.predicate("static compiles", still !== null);
  if (still === null) return;
  TestValidator.equals(
    "track channels",
    still.tracks.map((t: IAutoMovieTrack): string => (t.channel.kind === "node" ? t.channel.path : "")),
    ["translation", "rotation"],
  );
  TestValidator.equals("one key", { length: still.tracks[0]!.times.length, atZero: nclose(still.tracks[0]!.times[0]!, 0) }, { length: 1, atZero: true });
  TestValidator.predicate(
    "framed position",
    vclose(
      {
        x: still.tracks[0]!.values[0]!,
        y: still.tracks[0]!.values[1]!,
        z: still.tracks[0]!.values[2]!,
      },
      { x: 0, y: 1.44, z: 0.62 },
    ),
  );
  TestValidator.predicate(
    "aim already down −Z (identity rotation)",
    nclose(still.tracks[1]!.values[3]!, 1) && qclose({ x: still.tracks[1]!.values[0]!, y: still.tracks[1]!.values[1]!, z: still.tracks[1]!.values[2]!, w: still.tracks[1]!.values[3]! }, { x: 0, y: 0, z: 0, w: 1 }),
  );

  const dolly: NonNullable<ReturnType<typeof compileCameraMove>> = compileCameraMove({
    clipId: "clip",
    camera: camera(),
    entries: [{ action: frame("push-in", "medium"), subject: SUBJECT }],
    shotDuration: 2,
  })!;
  TestValidator.equals(
    "push-in eases over 9 keys",
    dolly.tracks[0]!.times.length,
    9,
  );
  TestValidator.equals(
    "push-in spans the shot (0 → 2 s)",
    namedFacts([
      ["startsAtShotOpen", (): boolean => nclose(dolly.tracks[0]!.times[0]!, 0)],
      ["endsAtShotClose", (): boolean => nclose(dolly.tracks[0]!.times[8]!, 2)],
    ]),
    { startsAtShotOpen: true, endsAtShotClose: true },
  );
  TestValidator.predicate(
    "dolly from 1.25×d",
    nclose(dolly.tracks[0]!.values[2]!, 0.775),
  );
  TestValidator.predicate(
    "dolly to 0.8×d (the last key)",
    nclose(dolly.tracks[0]!.values[26]!, 0.496),
  );
  // Eased, not ramped: at the quarter mark easeInOut(0.25) = 0.125, so the dolly
  // has crept only 12.5% of the way (d = 0.62 × 1.19375 = 0.7401), well short of
  // a linear quarter (0.705): the camera starts slow.
  TestValidator.predicate(
    "the dolly eases in (slow at the start)",
    nclose(dolly.tracks[0]!.values[8]!, 0.7401, 1e-3),
  );

  const yawed: IAutoMovieCamera = camera(undefined, {
    x: 0,
    y: Math.SQRT1_2,
    z: 0,
    w: Math.SQRT1_2,
  });
  const whip: NonNullable<ReturnType<typeof compileCameraMove>> = compileCameraMove({
    clipId: "clip",
    camera: yawed,
    entries: [{ action: frame("whip", "medium"), subject: SUBJECT }],
    shotDuration: 2,
  })!;
  TestValidator.equals("whip snaps in 0.2 s", { length: whip.tracks[0]!.times.length, start: nclose(whip.tracks[0]!.times[0]!, 0), end: nclose(whip.tracks[0]!.times[1]!, 0.2) }, { length: 2, start: true, end: true });
  TestValidator.predicate(
    "whip starts at the staged position",
    vclose({ x: whip.tracks[0]!.values[0]!, y: whip.tracks[0]!.values[1]!, z: whip.tracks[0]!.values[2]! }, yawed.transform.translation),
  );
  TestValidator.predicate(
    "whip holds the staged position",
    vclose(
      {
        x: whip.tracks[0]!.values[3]!,
        y: whip.tracks[0]!.values[4]!,
        z: whip.tracks[0]!.values[5]!,
      },
      yawed.transform.translation,
    ),
  );
  TestValidator.predicate(
    "whip starts on the staged orientation",
    nclose(Math.abs(whip.tracks[1]!.values[1]!), Math.SQRT1_2) && qclose({ x: whip.tracks[1]!.values[0]!, y: whip.tracks[1]!.values[1]!, z: whip.tracks[1]!.values[2]!, w: whip.tracks[1]!.values[3]! }, yawed.transform.rotation),
  );
  const landing: IAutoMovieQuaternion = {
    x: whip.tracks[1]!.values[4]!,
    y: whip.tracks[1]!.values[5]!,
    z: whip.tracks[1]!.values[6]!,
    w: whip.tracks[1]!.values[7]!,
  };
  TestValidator.predicate(
    "whip lands with −Z on the aim",
    vclose(Quaternion.rotateVector(landing, { x: 0, y: 0, z: -1 }), {
      x: 0,
      y: 0,
      z: -1,
    }),
  );
}

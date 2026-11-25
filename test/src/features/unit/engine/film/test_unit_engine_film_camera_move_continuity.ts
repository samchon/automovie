import {
  bakedTransformFromClipsAt,
  compileCameraMove,
} from "@automovie/engine";
import {
  IAutoMovieCamera,
  IAutoMovieCameraAction,
  IAutoMovieClip,
  type IAutoMovieFramedSubject,
  IAutoMovieProductionFrameRate,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/predicates";

/**
 * The moving camera: a 90-degree lens 5 m in front of the subject, level with
 * its aim point.
 */
const CAMERA: IAutoMovieCamera = {
  id: "cam",
  transform: {
    translation: { x: 0, y: 1.44, z: 5 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  fovY: 90,
  near: 0.1,
  far: 1000,
  depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
};

/** A two-metre subject framed `medium`: distance 0.62 m, aim at y 1.44. */
const SUBJECT: IAutoMovieFramedSubject = {
  base: { x: 0, y: 0, z: 0 },
  height: 2,
  at: null,
};

/** The framed distance of {@link SUBJECT} at `medium` under a 90-degree lens. */
const D: number = 0.62;

/** The aim point of {@link SUBJECT} at `medium`. */
const AIM: IAutoMovieVector3 = { x: 0, y: 1.44, z: 0 };

/** The delivery rate the moves are keyed at, 30 fps. */
const RATE: IAutoMovieProductionFrameRate = { numerator: 30, denominator: 1 };

/** A `frame` action of the camera on the origin with the given move and timing. */
const frame: (
  move: IAutoMovieCameraAction["move"],
  start: number,
  duration?: number | "auto",
  framing?: IAutoMovieCameraAction["framing"],
) => IAutoMovieCameraAction = (
  move: IAutoMovieCameraAction["move"],
  start: number,
  duration: number | "auto" = "auto",
  framing: IAutoMovieCameraAction["framing"] = "medium",
): IAutoMovieCameraAction => ({
  verb: "frame",
  actor: "cam",
  start,
  duration,
  framing,
  move,
  on: { kind: "point", point: { x: 0, y: 0, z: 0 } },
});

/**
 * Framed distance and aim height of {@link SUBJECT} per framing under the
 * 90-degree lens: the framing's height fraction of the 2 m subject over the
 * unit half-angle tangent, and its aim fraction of the height.
 */
const FRAMED: Record<
  IAutoMovieCameraAction["framing"],
  { distance: number; aimY: number }
> = {
  wide: { distance: 4, aimY: 1 },
  full: { distance: 1.15, aimY: 1 },
  medium: { distance: 0.62, aimY: 1.44 },
  close: { distance: 0.28, aimY: 1.7 },
};

/** Distance from the camera to one framing's aim at one instant. */
function reachOf(
  clip: IAutoMovieClip,
  t: number,
  framing: IAutoMovieCameraAction["framing"],
): number {
  const p: IAutoMovieVector3 = at(clip, t);
  return Math.hypot(p.x, p.y - FRAMED[framing].aimY, p.z);
}

/** Quadratic ease in and out, written from its definition. */
function easeInOut(p: number): number {
  return p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p);
}

/** Camera translation the clip plays at one shot-local instant. */
function at(clip: IAutoMovieClip, t: number): IAutoMovieVector3 {
  const transform: IAutoMovieTransform | null = bakedTransformFromClipsAt(
    [clip],
    "cam",
    t,
  );
  if (transform === null) throw new Error("the camera clip writes no pose");
  return transform.translation;
}

/** Distance from the camera to the aim at one instant. */
function reach(clip: IAutoMovieClip, t: number): number {
  const p: IAutoMovieVector3 = at(clip, t);
  return Math.hypot(p.x - AIM.x, p.y - AIM.y, p.z - AIM.z);
}

/** Swing of the camera about world up from the +Z bearing, in radians. */
function swing(clip: IAutoMovieClip, t: number): number {
  const p: IAutoMovieVector3 = at(clip, t);
  return Math.atan2(p.x - AIM.x, p.z - AIM.z);
}

/** Compile one camera's entries over a four-second shot; a null rate is omitted. */
function compile(
  entries: Array<{
    action: IAutoMovieCameraAction;
    subject?: IAutoMovieFramedSubject;
  }>,
  frameRate: IAutoMovieProductionFrameRate | null = RATE,
): IAutoMovieClip {
  return compileCameraMove({
    clipId: "clip",
    camera: CAMERA,
    entries: entries.map(
      (entry: {
        action: IAutoMovieCameraAction;
        subject?: IAutoMovieFramedSubject;
      }) => ({ action: entry.action, subject: entry.subject ?? SUBJECT }),
    ),
    shotDuration: 4,
    ...(frameRate === null ? {} : { frameRate }),
  })!;
}

/**
 * Pins that eased camera moves keep the ease's own speed at every delivered
 * frame and that a move abutting the next entry ends at its own end pose.
 *
 * Scenarios:
 *
 * 1. `push-in`, `orbit` and `truck` over 0 to 2 s at 30 fps move between every
 *    pair of adjacent frames exactly as far as the closed-form eased path does,
 *    so no frame's speed changes by sampling alone.
 * 2. Without a stated frame rate the push-in is keyed at 24 fps and matches the
 *    eased path on that grid.
 * 3. `follow` of a subject accelerating as x = t² places the camera on the
 *    subject's position at every delivered frame.
 * 4. `push-in` at `"auto"` followed by `static` never moves away from the aim, and
 *    the hold keeps the push-in's end distance of 0.8 times the framed
 *    distance.
 * 5. `orbit` at `"auto"` followed by `static` swings monotonically and holds the
 *    full 45 degrees.
 * 6. `static` at `"auto"` followed by `push-in` holds the framed distance, then
 *    dollies in from it to the push-in's own end of 0.8 times it without
 *    backing off first.
 * 7. A push-in that ends at 1.5 s before a static at 2 s re-frames back out across
 *    the authored gap, so a reversal remains available when written.
 * 8. `static` wide followed by `push-in` close starts the dolly where the wide
 *    hold stands, never backs away from the close aim, and ends framed close at
 *    0.8 times the close distance.
 * 9. `static` wide followed by `static` close keeps the wide pose up to 1e-5 s
 *    before the boundary and shows the close framing from the boundary on, a
 *    step rather than a ramp over the wide hold.
 * 10. A chain of `"auto"` entries, static wide, push-in medium, orbit close and
 *     static full, reaches every entry's own framing: wide during the first,
 *     0.8 times medium, close and full at the ends of the others.
 *
 */
export function test_unit_engine_film_camera_move_continuity(): void {
  const frames: number[] = Array.from(
    { length: 61 },
    (_: unknown, k: number): number => k / 30,
  );

  // 1. Every adjacent-frame step equals the eased path's step.
  const travel: Array<[string, IAutoMovieClip, (p: number) => number]> = [
    [
      "push-in",
      compile([{ action: frame("push-in", 0, 2) }]),
      (p: number): number => D * (1.25 - 0.45 * easeInOut(p)),
    ],
    [
      "orbit",
      compile([{ action: frame("orbit", 0, 2) }]),
      (p: number): number => (Math.PI / 4) * easeInOut(p),
    ],
    [
      "truck",
      compile([{ action: frame("truck", 0, 2) }]),
      (p: number): number => D * easeInOut(p),
    ],
  ];
  for (const [name, clip, path] of travel) {
    const measure: (t: number) => number =
      name === "push-in"
        ? (t: number): number => reach(clip, t)
        : name === "orbit"
          ? (t: number): number => swing(clip, t)
          : (t: number): number => -at(clip, t).x;
    const mismatched: number[] = [];
    for (let k: number = 1; k < frames.length; ++k) {
      const played: number = Math.abs(
        measure(frames[k]!) - measure(frames[k - 1]!),
      );
      const eased: number = Math.abs(path(k / 60) - path((k - 1) / 60));
      if (!nclose(played / eased, 1, 1e-6)) mismatched.push(k);
    }
    TestValidator.equals(
      `${name} keeps the eased speed at every frame`,
      mismatched,
      [],
    );
  }

  // 2. The fallback rate is 24 fps.
  const fallback: IAutoMovieClip = compile(
    [{ action: frame("push-in", 0, 2) }],
    null,
  );
  TestValidator.equals(
    "an unstated rate keys at 24 fps",
    fallback.tracks[0]!.times.length,
    49,
  );
  TestValidator.predicate(
    "the 24 fps keys sit on the eased path",
    fallback.tracks[0]!.times.every((t: number): boolean =>
      nclose(reach(fallback, t), D * (1.25 - 0.45 * easeInOut(t / 2)), 1e-9),
    ),
  );

  // 3. Follow tracks an accelerating subject at every frame.
  const followed: IAutoMovieClip = compile([
    {
      action: frame("follow", 0, 2),
      subject: {
        ...SUBJECT,
        at: (t: number): IAutoMovieVector3 => ({ x: t * t, y: 0, z: 0 }),
      },
    },
  ]);
  TestValidator.equals(
    "follow sits on the subject at every frame",
    frames.filter((t: number): boolean => !nclose(at(followed, t).x, t * t)),
    [],
  );

  // 4. Push-in, then hold.
  const pushHold: IAutoMovieClip = compile([
    { action: frame("push-in", 0) },
    { action: frame("static", 2) },
  ]);
  const shot: number[] = Array.from(
    { length: 121 },
    (_: unknown, k: number): number => k / 30,
  );
  TestValidator.equals(
    "push-in then static never backs away from the aim",
    shot.filter(
      (t: number, k: number): boolean =>
        k > 0 && reach(pushHold, t) > reach(pushHold, shot[k - 1]!) + 1e-12,
    ),
    [],
  );
  TestValidator.predicate(
    "the hold keeps the push-in's end distance",
    shot
      .filter((t: number): boolean => t >= 2)
      .every((t: number): boolean => nclose(reach(pushHold, t), D * 0.8)),
  );

  // 5. Orbit, then hold.
  const orbitHold: IAutoMovieClip = compile([
    { action: frame("orbit", 0) },
    { action: frame("static", 2) },
  ]);
  TestValidator.equals(
    "orbit then static swings one way",
    shot.filter(
      (t: number, k: number): boolean =>
        k > 0 && swing(orbitHold, t) < swing(orbitHold, shot[k - 1]!) - 1e-12,
    ),
    [],
  );
  TestValidator.predicate(
    "the hold keeps the full swing at the framed distance",
    nclose(swing(orbitHold, 4), Math.PI / 4) && nclose(reach(orbitHold, 4), D),
  );

  // 6. Hold, then push in from where the camera stands.
  const holdPush: IAutoMovieClip = compile([
    { action: frame("static", 0) },
    { action: frame("push-in", 2) },
  ]);
  TestValidator.equals(
    "static then push-in never backs away from the aim",
    shot.filter(
      (t: number, k: number): boolean =>
        k > 0 && reach(holdPush, t) > reach(holdPush, shot[k - 1]!) + 1e-12,
    ),
    [],
  );
  TestValidator.predicate(
    "the hold stays framed and the push-in ends at 0.8 of it",
    nclose(reach(holdPush, 1), D) &&
      nclose(reach(holdPush, 2), D) &&
      nclose(reach(holdPush, 4), D * 0.8),
  );

  // 7. An authored gap still re-frames outward.
  const gap: IAutoMovieClip = compile([
    { action: frame("push-in", 0, 1.5) },
    { action: frame("static", 2) },
  ]);
  TestValidator.predicate(
    "a gap re-frames from the push-in's end to the static framing",
    nclose(reach(gap, 1.5), D * 0.8) &&
      nclose(reach(gap, 1.75), D * 0.9) &&
      nclose(reach(gap, 2), D),
  );

  // 8. A wide hold, then a push-in framed close.
  const widePush: IAutoMovieClip = compile([
    { action: frame("static", 0, "auto", "wide") },
    { action: frame("push-in", 2, "auto", "close") },
  ]);
  const wideStand: IAutoMovieVector3 = at(widePush, 1);
  TestValidator.predicate(
    "the close push-in starts where the wide hold stands",
    nclose(reachOf(widePush, 1, "wide"), FRAMED.wide.distance) &&
      [2 - 1 / 30, 2].every((t: number): boolean =>
        nclose(
          Math.hypot(
            at(widePush, t).x - wideStand.x,
            at(widePush, t).y - wideStand.y,
            at(widePush, t).z - wideStand.z,
          ),
          0,
        ),
      ),
  );
  TestValidator.equals(
    "the close push-in never backs away from the close aim",
    shot.filter(
      (t: number, k: number): boolean =>
        t > 2 &&
        reachOf(widePush, t, "close") >
          reachOf(widePush, shot[k - 1]!, "close") + 1e-12,
    ),
    [],
  );
  TestValidator.predicate(
    "the close push-in ends framed close",
    nclose(reachOf(widePush, 4, "close"), FRAMED.close.distance * 0.8),
  );

  // 9. A wide hold, then a close hold, steps at the boundary.
  const wideClose: IAutoMovieClip = compile([
    { action: frame("static", 0, "auto", "wide") },
    { action: frame("static", 2, "auto", "close") },
  ]);
  TestValidator.predicate(
    "the wide pose holds up to the boundary",
    [0, 1, 2 - 1 / 30, 2 - 1e-5].every((t: number): boolean =>
      nclose(reachOf(wideClose, t, "wide"), FRAMED.wide.distance),
    ),
  );
  TestValidator.predicate(
    "the close framing holds from the boundary on",
    [2, 2 + 1 / 30, 3, 4].every((t: number): boolean =>
      nclose(reachOf(wideClose, t, "close"), FRAMED.close.distance),
    ),
  );

  // 10. A chain of auto entries reaches every framing.
  const chain: IAutoMovieClip = compile([
    { action: frame("static", 0, "auto", "wide") },
    { action: frame("push-in", 1, "auto", "medium") },
    { action: frame("orbit", 2, "auto", "close") },
    { action: frame("static", 3, "auto", "full") },
  ]);
  TestValidator.predicate(
    "every entry of an auto chain reaches its own framing",
    nclose(reachOf(chain, 0.5, "wide"), FRAMED.wide.distance) &&
      nclose(reachOf(chain, 2, "medium"), FRAMED.medium.distance * 0.8) &&
      nclose(reachOf(chain, 3 - 1e-5, "close"), FRAMED.close.distance) &&
      nclose(reachOf(chain, 3, "full"), FRAMED.full.distance) &&
      nclose(reachOf(chain, 4, "full"), FRAMED.full.distance),
  );
}

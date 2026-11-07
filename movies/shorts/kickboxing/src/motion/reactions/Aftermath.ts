import { AutoMovieEnvelope as Ease } from "@automovie/engine";

import { BoutScript } from "../../shots/kickboxing/ring-bout/BoutScript";
import { Blocking } from "../defense/Blocking";
import type { Fighter } from "../fighter/Fighter";
import type { FighterBody } from "../fighter/FighterBody";
import { FilmVector as Vec3 } from "../rig/FilmVector";

/**
 * Places everything after the knockout: where B falls, A's route to the
 * farthest neutral corner and A's celebration.
 *
 * @evidence contracts/common.md#implementation-and-ownership Landmarks derive once from the bout geometry at the knockout second, so changing the exchanges moves the aftermath consistently. The farthest neutral corner is chosen by distance from B's fall, as the adopted rules require. A's route bends away from B so he never crosses the fallen fighter.
 * @evidence contracts/common.md#authoring-interface World X/Z metres and radians. `stance` covers A from the end of the finishing kick to 180 s; `apply` adds A's lowered guard, gaze and celebration arms.
 */
export namespace Aftermath {
  /** Corner holding points of the ring (neutral corners only), world X/Z. */
  const NEUTRAL: readonly (readonly [number, number])[] = [
    [-2.35, -2.35],
    [2.35, 2.35],
  ];

  /** Farthest camera offset from ring centre that stays inside the ropes, metres. */
  const INSIDE: number = 2.9;

  /** Knockout second. */
  const KO: number = BoutScript.finish.at;

  /** End of the finishing kick (A's kicking foot is down). */
  export const kickEnd: number =
    KO + 0.05 + BoutScript.specs[BoutScript.finish.technique].recovery;

  /** A starts walking to the corner. */
  export const walkStart: number = 152.3;

  /** A is inside the corner, facing ring centre. */
  export const cornerArrival: number = 156.8;

  /** Fight geometry frozen at the knockout. */
  export const pair: Blocking.Pair = Blocking.pair(KO);

  /** Direction B falls toward (his right, turned toward his back), world unit. */
  export const fallDirection: Vec3.Value = Vec3.normalize(
    Vec3.add(
      Vec3.rotateY([0, 0, -1], pair.b.heading),
      Vec3.scale(Vec3.rotateY([1, 0, 0], pair.b.heading), -0.55),
    ),
  );

  /** Where B's hips come to rest, world X/Z. */
  export const fallenHips: readonly [number, number] = [
    pair.b.origin[0] + fallDirection[0] * 0.3,
    pair.b.origin[1] + fallDirection[2] * 0.3,
  ];

  /** Where B's head comes to rest, world X/Z. */
  export const fallenHead: readonly [number, number] = [
    fallenHips[0] + fallDirection[0] * 0.85,
    fallenHips[1] + fallDirection[2] * 0.85,
  ];

  /** A's standing point in the neutral corner farthest from B. */
  export const corner: readonly [number, number] = [...NEUTRAL].sort(
    (x: readonly [number, number], y: readonly [number, number]): number =>
      Math.hypot(y[0] - fallenHips[0], y[1] - fallenHips[1]) -
      Math.hypot(x[0] - fallenHips[0], x[1] - fallenHips[1]),
  )[0]!;

  /** A's celebration spot: out of the corner along his own side, clear of B. */
  export const celebration: readonly [number, number] = [
    corner[0] * 0.62,
    corner[1] * 0.35,
  ];

  /**
   * Side-on view of the knockout, the fall, the neutral corner and the count: framed on a
   * point 42% of the way from B's fall to A's corner (the referee works on B's far side)
   * from the side of that line facing the bout
   * camera, so both men stand at a similar depth and neither shrinks into the distance.
   * Kept inside the ropes. World metres; FilmPlan eases into it from 143 s.
   */
  export const wideCamera: { position: Vec3.Value; target: Vec3.Value } =
    (() => {
      const focus: Vec3.Value = [
        Ease.lerp(fallenHips[0], corner[0], 0.42),
        0.75,
        Ease.lerp(fallenHips[1], corner[1], 0.42),
      ];
      const line: Vec3.Value = Vec3.normalize([
        corner[0] - fallenHips[0],
        0,
        corner[1] - fallenHips[1],
      ]);
      const across: Vec3.Value = [-line[2], 0, line[0]];
      const bout: Vec3.Value = Vec3.rotateY([0, 0, 1], pair.axis);
      const toward: Vec3.Value =
        Vec3.dot(across, bout) >= 0 ? across : Vec3.scale(across, -1);
      const inside = (value: number): number =>
        Math.max(-INSIDE, Math.min(INSIDE, value));
      return {
        position: [
          inside(focus[0] + toward[0] * 3),
          focus[1] + 1.7,
          inside(focus[2] + toward[2] * 3),
        ],
        target: focus,
      };
    })();

  /**
   * A's stance after the finishing kick.
   *
   * @evidence contracts/common.md#implementation-and-ownership Closed-form route: a smooth step back off B, a quadratic path bent away from the fall line to the farthest neutral corner, a held corner stance, then celebration steps; heading blends between facing B, walking and facing centre so feet never flip direction in one frame.
   * @evidence contracts/common.md#authoring-interface Film seconds after the finishing kick; returns world X/Z metres, heading radians and walk weight for the footstep generator.
   */
  export function stance(t: number): Fighter.Stance {
    const start: readonly [number, number] = pair.a.origin;
    const facingB: number = pair.a.heading;
    if (t < walkStart) {
      // Step back off B, still in stance, then stand.
      const back: number = 0.35 * Ease.smooth((t - kickEnd) / 1.0);
      const offset: Vec3.Value = Vec3.rotateY([-back, 0, 0], facingB);
      return {
        origin: [start[0] + offset[0], start[1] + offset[2]],
        heading: facingB,
        walk: Ease.ramp(t, kickEnd + 0.6, walkStart),
      };
    }
    const from: Vec3.Value = Vec3.rotateY([-0.35, 0, 0], facingB);
    const p0: readonly [number, number] = [
      start[0] + from[0],
      start[1] + from[2],
    ];

    // Bend the route away from B with a quadratic control point.
    const away: readonly [number, number] = [
      (p0[0] + corner[0]) / 2 - fallDirection[0] * 0.5,
      (p0[1] + corner[1]) / 2 - fallDirection[2] * 0.5,
    ];
    const route = (u: number): readonly [number, number] => [
      (1 - u) * (1 - u) * p0[0] + 2 * u * (1 - u) * away[0] + u * u * corner[0],
      (1 - u) * (1 - u) * p0[1] + 2 * u * (1 - u) * away[1] + u * u * corner[1],
    ];
    const centreHeading: number = Vec3.heading([-corner[0], 0, -corner[1]]);
    if (t < cornerArrival) {
      const u: number = Ease.smooth(
        (t - walkStart) / (cornerArrival - walkStart),
      );
      const here = route(u);
      const ahead = route(Math.min(1, u + 0.05));
      const walking: number = Vec3.heading([
        ahead[0] - here[0],
        0,
        ahead[1] - here[1],
      ]);
      // Turn from B toward the walking direction over the first steps, and toward ring centre on arrival.
      const leaving: number = Ease.angle(
        facingB,
        walking,
        Ease.ramp(t, walkStart, walkStart + 0.8),
      );
      return {
        origin: here,
        heading: Ease.angle(
          leaving,
          centreHeading,
          Ease.ramp(t, cornerArrival - 0.7, cornerArrival),
        ),
        walk: 1,
      };
    }
    if (t < 168.4) return { origin: corner, heading: centreHeading, walk: 1 };

    // Celebration: quick steps out along his side, turning toward the audience.
    const audience: number = Vec3.heading([0, 0, 1]);
    const u: number = Ease.smooth((t - 168.4) / 4.2);
    const v: number = Ease.smooth((t - 173.5) / 3.0);
    const x: number = Ease.lerp(
      Ease.lerp(corner[0], celebration[0], u),
      corner[0] * 0.8,
      v * 0.4,
    );
    const z: number = Ease.lerp(
      Ease.lerp(corner[1], celebration[1], u),
      celebration[1] - 0.25,
      v,
    );
    return {
      origin: [x, z],
      heading: Ease.angle(centreHeading, audience, Ease.ramp(t, 168.4, 171.5)),
      walk: 1,
    };
  }

  /**
   * A's arms, gaze and breath after the knockout.
   *
   * @evidence contracts/common.md#implementation-and-ownership Overrides A's hands with point goals blended from the guard (relaxed at chest height, then overhead with a pumping right glove) and turns trunk and neck toward B's head while he walks and waits.
   * @evidence contracts/common.md#authoring-interface Mutates A's frame at film second t; `head` returns B's head in world metres. No effect before the kick has finished.
   */
  export function apply(
    frame: FighterBody.Frame,
    t: number,
    head: (t: number) => Vec3.Value,
  ): void {
    if (t < kickEnd) return;
    const lowered: number = Ease.ramp(t, kickEnd + 0.2, walkStart);

    frame.jaw = Math.max(frame.jaw, 6 + 4 * Math.sin(t * 5));

    // Gaze toward B while walking and waiting.
    if (t < 168.1) {
      const target: Vec3.Value = head(t);
      const desired: number = Vec3.heading([
        target[0] - frame.origin[0],
        0,
        target[2] - frame.origin[1],
      ]);
      let delta: number =
        (frame.heading + frame.turn - desired) % (2 * Math.PI);
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;
      const degrees: number =
        Math.max(-75, Math.min(75, (delta * 180) / Math.PI)) * lowered;
      frame.thoracic.rotation += degrees * 0.25;
      frame.cervical.rotation += Math.max(-20, Math.min(20, degrees * 0.3));
      frame.atlas.rotation += Math.max(-40, Math.min(40, degrees * 0.45));
    }
    frame.hands.left = handsDown(frame, "left", lowered, t);
    frame.hands.right = handsDown(frame, "right", lowered, t);
  }

  /** Hands relaxed at the sides, then thrown overhead in celebration. */
  function handsDown(
    frame: FighterBody.Frame,
    side: "left" | "right",
    lowered: number,
    t: number,
  ): FighterBody.Hand {
    if (lowered <= 0) return frame.hands[side];
    const sign: number = side === "left" ? 1 : -1;
    const yaw: number = frame.heading;
    const raise: number = Ease.plateau(t, 168.1, 168.6, 180, 181);
    const pump: number =
      side === "right"
        ? Ease.pulse((((t - 172.0) % 1.1) + 1.1) % 1.1, 0, 0.3, 0.6) *
          (t > 172.0 && t < 174.2 ? 1 : 0)
        : 0;
    const relaxed: Vec3.Value = Vec3.rotateY([0.18, 1.08, 0.24 * sign], yaw);
    const overhead: Vec3.Value = Vec3.rotateY(
      [0.12 + 0.1 * pump, 2.12 - 0.3 * pump, 0.28 * sign],
      yaw,
    );
    const local: Vec3.Value = Vec3.lerp(relaxed, overhead, raise);
    return {
      kind: "point",
      point: [
        frame.origin[0] + local[0],
        local[1] - frame.drop,
        frame.origin[1] + local[2],
      ],
      amount: lowered,
    };
  }
}

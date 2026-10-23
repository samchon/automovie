import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";

/**
 * Joint centres of the stickman skeleton, derived by rule from the body
 * calibration's chain axes, branch events and poles, in calibration
 * millimetres (forward +X, up +Y, left +Z, floor at y = 0).
 *
 * Every rule reads the chain tree, the eye globes and the stature, never a
 * person-indexed table. Vertical placements use the ANSUR II joint-centre
 * stature fractions of `docs/anatomy/skeleton.md` (female and male means
 * averaged, because the generator receives no sex input); lateral and fore-aft
 * placements come from the chain axes at those heights. Limbs that do not hang
 * vertically (the A-posed arms, fingers and toes) are divided along their own
 * axes, so a raised or bent limb keeps its proportions. The rules are listed
 * in `docs/anatomy/joint-range.md`; those marked there as conventions have no
 * measured source.
 */
export namespace AutoMovieHumanJointCentres {
  /** One joint: a bone's origin, parent, segment direction and girth. */
  export interface IJoint {
    /** Bone id; humanoid names where the engine vocabulary has one. */
    bone: string;

    /** Parent bone, or null for the root `hips`. */
    parent: string | null;

    /** Joint centre in mm. */
    position: [number, number, number];

    /** Point the bone's segment points to at rest, defining its long axis, mm. */
    toward: [number, number, number];

    /** End of a leaf bone's drawn segment in mm, null for a bone whose children end it. */
    tip: [number, number, number] | null;

    /** Skin girth radius of the segment leaving this joint, mm: perimeter / 2pi at its middle. */
    radius: number;
  }

  /**
   * Derive every joint of the stickman skeleton.
   *
   * @param calibration Body calibration whose chains, events, poles and eyes define the body.
   * @returns Joints in parent-before-child order, root first.
   */
  export function derive(
    calibration: IAutoMovieHumanBodyCalibration,
  ): IJoint[] {
    const S: number = calibration.stature;
    const chain: (name: string) => IAutoMovieHumanLoftChain = (
      name: string,
    ): IAutoMovieHumanLoftChain => {
      const found: IAutoMovieHumanLoftChain | undefined =
        calibration.chains.find(
          (c: IAutoMovieHumanLoftChain): boolean => c.name === name,
        );
      if (found === undefined)
        throw new Error(`Stickman skeleton needs the ${name} chain`);
      return found;
    };
    const pole: (name: string) => [number, number, number] = (
      name: string,
    ): [number, number, number] => {
      const found: IAutoMovieHumanBodyCalibration.IPole | undefined =
        calibration.poles.find(
          (p: IAutoMovieHumanBodyCalibration.IPole): boolean =>
            p.chain === name,
        );
      if (found === undefined)
        throw new Error(`Stickman skeleton needs the ${name} pole`);
      return found.point;
    };
    const joints: IJoint[] = [];
    const add: (
      bone: string,
      parent: string | null,
      position: [number, number, number],
      toward: [number, number, number],
      radius: number,
      tip?: [number, number, number] | null,
    ) => void = (
      bone: string,
      parent: string | null,
      position: [number, number, number],
      toward: [number, number, number],
      radius: number,
      tip: [number, number, number] | null = null,
    ): void => {
      joints.push({ bone, parent, position, toward, tip, radius });
    };

    // Trunk column: hip centres, de Leva trunk boundaries, neck base.
    const trunk: IAutoMovieHumanLoftChain = chain("trunk");
    const upper: IAutoMovieHumanLoftChain = chain("upper");
    const head: IAutoMovieHumanLoftChain = chain("head");
    const hipY: number = 0.518 * S;
    const hipCentre: (side: string) => [number, number, number] = (
      side: string,
    ): [number, number, number] => {
      const leg: IAutoMovieHumanLoftChain = chain(`leg.${side}`);
      const top: [number, number, number] = end(leg, "top");
      const knee: [number, number, number] = axis(leg, 0.2865 * S);
      return lerp(knee, top, (hipY - knee[1]) / (top[1] - knee[1]));
    };
    const pelvis: [number, number, number] = lerp(
      hipCentre("left"),
      hipCentre("right"),
      0.5,
    );
    const span: number = 0.3425 * S;
    const lumbar: [number, number, number] = axis(trunk, hipY + 0.245 * span);
    const thoracic: [number, number, number] = axis(trunk, hipY + 0.617 * span);
    const neckBase: [number, number, number] = end(upper, "top");
    const neckRadius: number = girth(head, (start(head) + stop(head)) / 2);
    const lobe: (side: string) => [number, number, number] = (
      side: string,
    ): [number, number, number] => end(chain(`ear.lobe.${side}`), "bottom");
    const occiput: [number, number, number] = lerp(
      lobe("left"),
      lobe("right"),
      0.5,
    );
    const atlas: [number, number, number] = lerp(neckBase, occiput, 0.85);
    const crown: [number, number, number] = pole("head.upper");
    const headRadius: number = girth(
      chain("head.middle"),
      start(chain("head.middle")),
    );

    add("hips", null, pelvis, lumbar, girth(trunk, hipY));
    add("spine", "hips", lumbar, thoracic, girth(trunk, lumbar[1]));
    add("chest", "spine", thoracic, neckBase, girth(trunk, stop(trunk)));
    add("neck", "chest", neckBase, atlas, neckRadius);
    add("atlas", "neck", atlas, occiput, neckRadius);
    add("head", "atlas", occiput, crown, headRadius, crown);

    // Jaw and eyes (conventional facial placements, see the joint-range note).
    const eyes: IAutoMovieHumanBodyCalibration.IEye[] = calibration.eyes;
    const eyeMid: [number, number, number] = [0, 1, 2].map(
      (i: number): number =>
        eyes.reduce(
          (a: number, e: IAutoMovieHumanBodyCalibration.IEye): number =>
            a + e.centre[i]!,
          0,
        ) / Math.max(1, eyes.length),
    ) as [number, number, number];
    const tmj: [number, number, number] = [
      occiput[0] + 0.006 * S,
      occiput[1] + 0.008 * S,
      0,
    ];
    const chin: [number, number, number] = [
      eyeMid[0],
      eyeMid[1] - 0.068 * S,
      0,
    ];
    add("jaw", "head", tmj, chin, headRadius * 0.12, chin);
    for (const eye of eyes) {
      const gaze: [number, number, number] = [
        eye.centre[0] + 0.03 * S,
        eye.centre[1],
        eye.centre[2],
      ];
      add(`${eye.side}Eye`, "head", eye.centre, gaze, eye.radius, gaze);
    }

    for (const side of ["left", "right"] as const) {
      const s: number = side === "left" ? 1 : -1;

      // Shoulder girdle and arm.
      const arm: IAutoMovieHumanLoftChain = chain(`arm.${side}`);
      const armRadius: number = girth(arm, stop(arm));
      const shoulderY: number = Math.min(0.8 * S, stop(upper));
      const cap: [number, number, number][] = AutoMovieHumanLoftChain.ring(
        upper,
        shoulderY,
        PHASES,
      ).filter((p: [number, number, number]): boolean => s * p[2] > 0);
      const lateral: number = Math.max(
        ...cap.map((p: [number, number, number]): number => s * p[2]),
      );
      const capX: number[] = cap
        .filter(
          (p: [number, number, number]): boolean =>
            s * p[2] > lateral - armRadius,
        )
        .map((p: [number, number, number]): number => p[0]);
      const glenohumeral: [number, number, number] = [
        capX.reduce((a: number, b: number): number => a + b, 0) / capX.length,
        shoulderY,
        s * (lateral - armRadius),
      ];
      const sternoclavicular: [number, number, number] = [
        axis(upper, shoulderY)[0],
        shoulderY,
        s * neckRadius,
      ];
      const wrist: [number, number, number] = end(arm, "bottom");
      const elbow: [number, number, number] = along(
        [glenohumeral, ...stations(arm, stop(arm), start(arm))],
        0.162 / (0.162 + 0.151),
      );
      const digit: (
        name: string,
        units: number[],
      ) => [number, number, number][] = (
        name: string,
        units: number[],
      ): [number, number, number][] =>
        phalanges(chain(name), pole(name), units);
      const middle: [number, number, number][] = digit(
        `finger.${side}.middle`,
        FINGER,
      );
      add(
        `${side}Shoulder`,
        "chest",
        sternoclavicular,
        glenohumeral,
        neckRadius * 0.5,
      );
      add(`${side}Scapula`, `${side}Shoulder`, glenohumeral, elbow, armRadius);
      add(`${side}UpperArm`, `${side}Scapula`, glenohumeral, elbow, armRadius);
      add(
        `${side}LowerArm`,
        `${side}UpperArm`,
        elbow,
        wrist,
        girth(arm, (elbow[1] + wrist[1]) / 2),
      );
      const hand: IAutoMovieHumanLoftChain = chain(`hand.${side}.1`);
      add(
        `${side}Hand`,
        `${side}LowerArm`,
        wrist,
        middle[0]!,
        girth(hand, (start(hand) + stop(hand)) / 2),
      );

      // Thumb: CMC halfway from the wrist to the branch, MCP at the branch,
      // IP halfway to the tip (convention).
      const thumb: IAutoMovieHumanLoftChain = chain(`thumb.${side}`);
      const thumbBase: [number, number, number] = end(thumb, "top");
      const thumbTip: [number, number, number] = pole(`thumb.${side}`);
      const thumbRadius: number = girth(
        thumb,
        (start(thumb) + stop(thumb)) / 2,
      );
      const ip: [number, number, number] = lerp(thumbBase, thumbTip, 0.5);
      add(
        `${side}ThumbMetacarpal`,
        `${side}Hand`,
        lerp(wrist, thumbBase, 0.5),
        thumbBase,
        thumbRadius,
      );
      add(
        `${side}ThumbProximal`,
        `${side}ThumbMetacarpal`,
        thumbBase,
        ip,
        thumbRadius,
      );
      add(
        `${side}ThumbDistal`,
        `${side}ThumbProximal`,
        ip,
        thumbTip,
        thumbRadius * 0.9,
        thumbTip,
      );
      for (const [name, key] of [
        ["Index", "index"],
        ["Middle", "middle"],
        ["Ring", "ring"],
        ["Little", "little"],
      ] as const) {
        const finger: IAutoMovieHumanLoftChain = chain(`finger.${side}.${key}`);
        const r: number = girth(finger, (start(finger) + stop(finger)) / 2);
        const [mcp, pip, dip, tip]: [number, number, number][] =
          key === "middle" ? middle : digit(`finger.${side}.${key}`, FINGER);
        add(`${side}${name}Proximal`, `${side}Hand`, mcp!, pip!, r);
        add(
          `${side}${name}Intermediate`,
          `${side}${name}Proximal`,
          pip!,
          dip!,
          r,
        );
        add(
          `${side}${name}Distal`,
          `${side}${name}Intermediate`,
          dip!,
          tip!,
          r * 0.9,
          tip!,
        );
      }

      // Leg, foot and the five toes.
      const leg: IAutoMovieHumanLoftChain = chain(`leg.${side}`);
      const knee: [number, number, number] = axis(leg, 0.2865 * S);
      const legBottom: [number, number, number] = end(leg, "bottom");
      const ankle: [number, number, number] = [
        legBottom[0],
        0.0405 * S,
        legBottom[2],
      ];
      const foot: IAutoMovieHumanLoftChain = chain(`foot.${side}`);
      const footRadius: number =
        girth(foot, (start(foot) + stop(foot)) / 2) * 0.6;
      const toes: [number, number, number][][] = [1, 2, 3, 4, 5].map(
        (k: number): [number, number, number][] =>
          digit(`toe.${side}.${k}`, k === 1 ? HALLUX : FINGER),
      );
      const ball: [number, number, number] = [0, 1, 2].map(
        (i: number): number =>
          toes.reduce(
            (a: number, t: [number, number, number][]): number => a + t[0]![i]!,
            0,
          ) / toes.length,
      ) as [number, number, number];
      const midfoot: [number, number, number] = lerp(ankle, ball, 0.4);
      add(
        `${side}UpperLeg`,
        "hips",
        hipCentre(side),
        knee,
        girth(leg, (knee[1] + stop(leg)) / 2),
      );
      add(
        `${side}LowerLeg`,
        `${side}UpperLeg`,
        knee,
        ankle,
        girth(leg, (knee[1] + start(leg)) / 2),
      );
      add(`${side}Foot`, `${side}LowerLeg`, ankle, ball, footRadius);
      add(`${side}Subtalar`, `${side}Foot`, ankle, midfoot, footRadius);
      add(`${side}Midfoot`, `${side}Subtalar`, midfoot, ball, footRadius * 0.8);
      toes.forEach((t: [number, number, number][], i: number): void => {
        const toe: IAutoMovieHumanLoftChain = chain(`toe.${side}.${i + 1}`);
        const r: number = girth(toe, (start(toe) + stop(toe)) / 2);
        if (i === 0) {
          add(`${side}HalluxProximal`, `${side}Midfoot`, t[0]!, t[1]!, r);
          add(
            `${side}HalluxDistal`,
            `${side}HalluxProximal`,
            t[1]!,
            t[2]!,
            r,
            t[2]!,
          );
          return;
        }
        const n: string = `${side}Toe${i + 1}`;
        add(`${n}Proximal`, `${side}Midfoot`, t[0]!, t[1]!, r);
        add(`${n}Intermediate`, `${n}Proximal`, t[1]!, t[2]!, r);
        add(`${n}Distal`, `${n}Intermediate`, t[2]!, t[3]!, r * 0.9, t[3]!);
      });
    }
    return joints;
  }
}

/**
 * Phalanx units of a finger or lesser toe: a conventional 2:1:1 split with
 * the web halfway along the proximal phalanx, so the joints sit one unit
 * before the web and one and two units after it, the tip three after.
 */
const FINGER: number[] = [-1, 1, 2, 3];

/** Hallux: two equal phalanges with the web halfway along the first (convention). */
const HALLUX: number[] = [-0.5, 0.5, 1.5];

/** Phases sampling a section for perimeters and extremities. */
const PHASES: number[] = Array.from(
  { length: 96 },
  (_: unknown, i: number): number => (2 * Math.PI * i) / 96,
);

/**
 * Joints of one digit from its chain: the web is the chain's top, the tip its
 * pole, and `units` places each joint in units of the visible length divided
 * by the last unit, negative units extending back along the digit's axis.
 */
function phalanges(
  chain: IAutoMovieHumanLoftChain,
  tip: [number, number, number],
  units: number[],
): [number, number, number][] {
  const path: [number, number, number][] = [
    ...stations(chain, stop(chain), start(chain)),
    tip,
  ];
  const unit: number = length(path) / units[units.length - 1]!;
  const web: [number, number, number] = path[0]!;
  const back: [number, number, number] = unitVector(sub(path[0]!, path[1]!));
  return units.map((u: number): [number, number, number] =>
    u < 0
      ? [
          web[0] - back[0] * u * unit,
          web[1] - back[1] * u * unit,
          web[2] - back[2] * u * unit,
        ]
      : along(path, u / units[units.length - 1]!),
  );
}

/** First station of a chain. */
function start(chain: IAutoMovieHumanLoftChain): number {
  return chain.layers[0]!.y;
}

/** Last station of a chain. */
function stop(chain: IAutoMovieHumanLoftChain): number {
  return chain.layers[chain.layers.length - 1]!.y;
}

/** Axis point at a station, clamped into the chain. */
function axis(
  chain: IAutoMovieHumanLoftChain,
  s: number,
): [number, number, number] {
  return AutoMovieHumanLoftChain.axis(
    chain,
    Math.min(stop(chain), Math.max(start(chain), s)),
  );
}

/** Axis point at a chain end. */
function end(
  chain: IAutoMovieHumanLoftChain,
  which: "top" | "bottom",
): [number, number, number] {
  return axis(chain, which === "top" ? stop(chain) : start(chain));
}

/** Girth radius, perimeter / 2pi, of the section at a station clamped into the chain. */
function girth(chain: IAutoMovieHumanLoftChain, s: number): number {
  const ring: [number, number, number][] = AutoMovieHumanLoftChain.ring(
    chain,
    Math.min(stop(chain), Math.max(start(chain), s)),
    PHASES,
  );
  let perimeter: number = 0;
  ring.forEach((p: [number, number, number], i: number): void => {
    perimeter += Math.hypot(...sub(ring[(i + 1) % ring.length]!, p));
  });
  return perimeter / (2 * Math.PI);
}

/** Axis polyline from station `from` to station `to` in 24 even steps. */
function stations(
  chain: IAutoMovieHumanLoftChain,
  from: number,
  to: number,
): [number, number, number][] {
  return Array.from(
    { length: 25 },
    (_: unknown, i: number): [number, number, number] =>
      axis(chain, from + ((to - from) * i) / 24),
  );
}

/** Polyline length. */
function length(path: [number, number, number][]): number {
  let total: number = 0;
  for (let i: number = 1; i < path.length; i++)
    total += Math.hypot(...sub(path[i]!, path[i - 1]!));
  return total;
}

/** Point at a fraction of a polyline's length. */
function along(
  path: [number, number, number][],
  fraction: number,
): [number, number, number] {
  let remaining: number = fraction * length(path);
  for (let i: number = 1; i < path.length; i++) {
    const step: number = Math.hypot(...sub(path[i]!, path[i - 1]!));
    if (remaining <= step && step > 0)
      return lerp(path[i - 1]!, path[i]!, remaining / step);
    remaining -= step;
  }
  return path[path.length - 1]!;
}

/** Difference a - b. */
function sub(
  a: [number, number, number],
  b: [number, number, number],
): [number, number, number] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** Unit vector of v. */
function unitVector(v: [number, number, number]): [number, number, number] {
  const n: number = Math.hypot(...v);
  return [v[0] / n, v[1] / n, v[2] / n];
}

/** Linear interpolation a + (b - a) t. */
function lerp(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

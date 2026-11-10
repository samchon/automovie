import {
  AutoMovieLoftChain,
  type IAutoMovieLoftChain,
} from "@automovie/engine";

import type { AutoMovieHumanSkeletonLaw } from "../generation/AutoMovieHumanSkeletonLaw";
import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";

/**
 * The stickman skeleton of a generated body: the bind skeleton the body was
 * lofted on, read from its calibration, with each segment's skin girth.
 *
 * The joints are placed before the limbs' skin by `AutoMovieHumanSkeletonLaw`;
 * this reader only measures the finished skin around them. The rules are listed
 * in `docs/anatomy/joint-range.md`.
 */
export namespace AutoMovieHumanJointCentres {
  /** One joint: a bone's origin, parent, segment direction and girth. */
  export interface IJoint extends AutoMovieHumanSkeletonLaw.IBone {
    /** Skin girth radius of the segment leaving this joint, mm: perimeter / 2pi at its middle. */
    radius: number;
  }

  /**
   * Every joint of the stickman skeleton.
   *
   * @param calibration Body calibration carrying its bind skeleton and skin.
   * @returns Joints in parent-before-child order, root first.
   */
  export function derive(
    calibration: IAutoMovieHumanBodyCalibration,
  ): IJoint[] {
    const skeleton: AutoMovieHumanSkeletonLaw.IBone[] | undefined =
      calibration.skeleton;
    if (skeleton === undefined)
      throw new Error("The calibration carries no skeleton");
    const S: number = calibration.stature;
    // A part's chain, or its host's where the realization left the part out
    // (a digit onto its hand or foot): the host's girth nearest the bone
    // stands for it, so the rig still binds and the missing part is the
    // realization's diagnostic, not the rig's failure.
    const HOSTS: Readonly<Record<string, string>> = {
      finger: "arm",
      thumb: "arm",
      toe: "foot",
    };
    const chain = (name: string): IAutoMovieLoftChain => {
      const find = (n: string): IAutoMovieLoftChain | undefined =>
        calibration.chains.find(
          (c: IAutoMovieLoftChain): boolean => c.name === n,
        );
      const found: IAutoMovieLoftChain | undefined = find(name);
      if (found !== undefined) return found;
      const [kind, side] = name.split(".");
      const host: IAutoMovieLoftChain | undefined =
        HOSTS[kind!] !== undefined
          ? find(`${HOSTS[kind!]}.${side}`)
          : undefined;
      if (host === undefined)
        throw new Error(`Stickman skeleton needs the ${name} chain`);
      return host;
    };
    const byBone = new Map<string, AutoMovieHumanSkeletonLaw.IBone>(
      skeleton.map(
        (
          b: AutoMovieHumanSkeletonLaw.IBone,
        ): [string, AutoMovieHumanSkeletonLaw.IBone] => [b.bone, b],
      ),
    );
    // A bone's segment middle: its joint and its leaf tip, or the joint and
    // the point it points to.
    const middleOf = (bone: string): [number, number, number] => {
      const b: AutoMovieHumanSkeletonLaw.IBone = byBone.get(bone)!;
      const end: [number, number, number] = b.tip ?? b.toward;
      return [
        (b.position[0] + end[0]) / 2,
        (b.position[1] + end[1]) / 2,
        (b.position[2] + end[2]) / 2,
      ];
    };
    // A chain's girth at the section whose axis point stands nearest a bone's
    // segment middle: the view parts' stations run along their own axes, so
    // a bone is found by place, not by height.
    const around = (c: IAutoMovieLoftChain, bone: string): number =>
      girth(c, nearest(c, middleOf(bone)));
    const trunk: IAutoMovieLoftChain = chain("trunk");

    // The head mass when the realization kept it; without it the neck takes
    // the trunk's top ring (the neck seat) and the head the sphere through
    // its own segment, half the segment's length.
    const head: IAutoMovieLoftChain | undefined = calibration.chains.find(
      (c: IAutoMovieLoftChain): boolean => c.name === "head.mass",
    );
    const segment = (bone: string): number => {
      const b: AutoMovieHumanSkeletonLaw.IBone = byBone.get(bone)!;
      const end: [number, number, number] = b.tip ?? b.toward;
      return (
        Math.hypot(
          end[0] - b.position[0],
          end[1] - b.position[1],
          end[2] - b.position[2],
        ) / 2
      );
    };
    const headRadius: number =
      head !== undefined ? around(head, "head") : segment("head");

    // A limb the realization has not lofted yet takes its girth from stature:
    // typical adult circumference over
    // stature (thigh 0.30, calf 0.21, foot 0.14, hallux 0.04, lesser toe 0.03,
    // finger 0.03; ANSUR II order of magnitude) as a radius, so the rig and its
    // blockout keep body proportions until the part is lofted.
    const STATURE_GIRTH: Readonly<Record<string, number>> = {
      UpperLeg: 0.3,
      LowerLeg: 0.21,
      Foot: 0.14,
      Subtalar: 0.14,
      Midfoot: 0.14,
      Hallux: 0.04,
      Toe: 0.03,
      Finger: 0.03,
    };
    const limb = (name: string, bone: string): number => {
      // Only the part's own chain measures it: a digit's host (the arm's
      // mitten or the foot) is the whole hand or forefoot there, so its
      // nearest ring gave a palm-wide proximal phalanx and a needle-thin
      // distal one instead of a digit's girth.
      const lofted: boolean = calibration.chains.some(
        (c: IAutoMovieLoftChain): boolean => c.name === name,
      );
      if (lofted) return around(chain(name), bone);
      const part: string = bone.replace(/^(left|right)/u, "");
      const key: string =
        Object.keys(STATURE_GIRTH).find((prefix: string): boolean =>
          part.startsWith(prefix),
        ) ?? "Finger";
      return (STATURE_GIRTH[key]! * S) / (2 * Math.PI);
    };

    const radius = (bone: string): number => {
      if (bone === "hips") return girth(trunk, 0.518 * S);
      if (bone === "spine")
        return girth(trunk, byBone.get("spine")!.position[1]);
      // The chest segment's girth at its middle, as every segment's: the
      // trunk's top ring is the neck seat, a neck girth, not the thorax.
      if (bone === "chest") return girth(trunk, middleOf("chest")[1]);
      if (bone === "neck" || bone === "atlas")
        return head !== undefined
          ? around(head, bone)
          : girth(trunk, stop(trunk));
      if (bone === "head") return headRadius;
      if (bone === "jaw") return headRadius * 0.12;
      if (bone.endsWith("Eye"))
        return calibration.eyes.find(
          (e: IAutoMovieHumanBodyCalibration.IEye): boolean =>
            `${e.side}Eye` === bone,
        )!.radius;
      const side: "left" | "right" = bone.startsWith("left") ? "left" : "right";
      const part: string = bone.slice(side.length);
      // The girdle's bones and the humerus take the arm's girth at the
      // shoulder centre, the arm's top ring, as the shoulder's skin around
      // them (the deltoid's breadth), so their reach covers the axilla.
      if (part === "Shoulder" || part === "Scapula" || part === "UpperArm") {
        const arm: IAutoMovieLoftChain = chain(`arm.${side}`);
        return girth(
          arm,
          nearest(arm, byBone.get(`${side}UpperArm`)!.position),
        );
      }
      if (part === "LowerArm" || part === "Hand")
        return around(chain(`arm.${side}`), bone);
      if (part.startsWith("Thumb")) return limb(`thumb.${side}`, bone);
      for (const [name, key] of FINGERS)
        if (part.startsWith(name)) return limb(`finger.${side}.${key}`, bone);
      if (part === "UpperLeg" || part === "LowerLeg")
        return limb(`leg.${side}`, bone);
      if (part === "Foot" || part === "Subtalar" || part === "Midfoot")
        return (
          limb(`foot.${side}`, bone) * 0.6 * (part === "Midfoot" ? 0.8 : 1)
        );
      if (part.startsWith("Hallux")) return limb(`toe.${side}.1`, bone);
      const toe: RegExpExecArray | null = /^Toe(\d)/.exec(part);
      if (toe !== null) return limb(`toe.${side}.${toe[1]}`, bone);
      throw new Error(`Stickman skeleton has no girth rule for ${bone}`);
    };
    return skeleton.map(
      (b: AutoMovieHumanSkeletonLaw.IBone): IJoint => ({
        ...b,
        radius: radius(b.bone),
      }),
    );
  }
}

/** Finger bone names and their chains. */
const FINGERS: readonly (readonly [string, string])[] = [
  ["Index", "index"],
  ["Middle", "middle"],
  ["Ring", "ring"],
  ["Little", "little"],
];

/** Phases sampling a section for perimeters. */
const PHASES: number[] = Array.from(
  { length: 96 },
  (_: unknown, i: number): number => (2 * Math.PI * i) / 96,
);

/** First station of a chain. */
function start(chain: IAutoMovieLoftChain): number {
  return chain.layers[0]!.y;
}

/** Last station of a chain. */
function stop(chain: IAutoMovieLoftChain): number {
  return chain.layers[chain.layers.length - 1]!.y;
}

/** The chain's layer station whose axis point stands nearest a point. */
function nearest(
  chain: IAutoMovieLoftChain,
  p: readonly [number, number, number],
): number {
  let best: number = start(chain);
  let least: number = Infinity;
  for (const layer of chain.layers) {
    const a: [number, number, number] = AutoMovieLoftChain.axis(chain, layer.y);
    const d: number = Math.hypot(a[0] - p[0], a[1] - p[1], a[2] - p[2]);
    if (d < least) {
      least = d;
      best = layer.y;
    }
  }
  return best;
}

/** Girth radius, perimeter / 2pi, of the section at a station clamped into the chain. */
function girth(chain: IAutoMovieLoftChain, s: number): number {
  const ring: [number, number, number][] = AutoMovieLoftChain.ring(
    chain,
    Math.min(stop(chain), Math.max(start(chain), s)),
    PHASES,
  );
  let perimeter: number = 0;
  ring.forEach((p: [number, number, number], i: number): void => {
    const q: [number, number, number] = ring[(i + 1) % ring.length]!;
    perimeter += Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
  });
  return perimeter / (2 * Math.PI);
}

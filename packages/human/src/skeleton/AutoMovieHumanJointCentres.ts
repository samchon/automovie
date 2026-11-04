import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieLoftChain, type IAutoMovieLoftChain } from "@automovie/engine";
import type { AutoMovieHumanSkeletonLaw } from "../generation/AutoMovieHumanSkeletonLaw";

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
    const chain = (name: string): IAutoMovieLoftChain => {
      const found: IAutoMovieLoftChain | undefined =
        calibration.chains.find(
          (c: IAutoMovieLoftChain): boolean => c.name === name,
        );
      if (found === undefined)
        throw new Error(`Stickman skeleton needs the ${name} chain`);
      return found;
    };
    const byBone = new Map<string, AutoMovieHumanSkeletonLaw.IBone>(
      skeleton.map(
        (
          b: AutoMovieHumanSkeletonLaw.IBone,
        ): [string, AutoMovieHumanSkeletonLaw.IBone] => [b.bone, b],
      ),
    );
    const at = (bone: string): [number, number, number] => byBone.get(bone)!.position;
    const middle = (c: IAutoMovieLoftChain): number =>
      girth(c, (start(c) + stop(c)) / 2);

    // The neck read a third of the way up: lower it flares into the shoulders
    // and higher it meets the jaw.
    const neckBase: [number, number, number] = at("neck");
    const occiput: [number, number, number] = at("head");
    const neckRadius: number = girth(
      chain("head.lower"),
      neckBase[1] + (occiput[1] - neckBase[1]) / 3,
    );
    const headRadius: number = girth(
      chain("head.middle"),
      start(chain("head.middle")),
    );
    const trunk: IAutoMovieLoftChain = chain("trunk");
    const radius = (bone: string): number => {
      if (bone === "hips") return girth(trunk, 0.518 * S);
      if (bone === "spine") return girth(trunk, at("spine")[1]);
      if (bone === "chest") return girth(trunk, stop(trunk));
      if (bone === "neck" || bone === "atlas") return neckRadius;
      if (bone === "head") return headRadius;
      if (bone === "jaw") return headRadius * 0.12;
      if (bone.endsWith("Eye"))
        return calibration.eyes.find(
          (e: IAutoMovieHumanBodyCalibration.IEye): boolean =>
            `${e.side}Eye` === bone,
        )!.radius;
      const side: "left" | "right" = bone.startsWith("left") ? "left" : "right";
      const part: string = bone.slice(side.length);
      if (part === "Shoulder" || part === "Scapula" || part === "UpperArm") {
        const arm: IAutoMovieLoftChain = chain(`arm.${side}`);
        return girth(arm, stop(arm));
      }
      if (part === "LowerArm")
        return girth(
          chain(`arm.${side}`),
          (at(`${side}LowerArm`)[1] + at(`${side}Hand`)[1]) / 2,
        );
      if (part === "Hand") return middle(chain(`hand.${side}.1`));
      if (part.startsWith("Thumb"))
        return (
          middle(chain(`thumb.${side}`)) * (part === "ThumbDistal" ? 0.9 : 1)
        );
      for (const [name, key] of FINGERS)
        if (part.startsWith(name))
          return (
            middle(chain(`finger.${side}.${key}`)) *
            (part.endsWith("Distal") ? 0.9 : 1)
          );
      if (part === "UpperLeg") {
        const leg: IAutoMovieLoftChain = chain(`leg.${side}`);
        return girth(leg, (at(`${side}LowerLeg`)[1] + stop(leg)) / 2);
      }
      if (part === "LowerLeg") {
        const leg: IAutoMovieLoftChain = chain(`leg.${side}`);
        return girth(leg, (at(`${side}LowerLeg`)[1] + start(leg)) / 2);
      }
      if (part === "Foot" || part === "Subtalar" || part === "Midfoot")
        return (
          middle(chain(`foot.${side}`)) * 0.6 * (part === "Midfoot" ? 0.8 : 1)
        );
      if (part.startsWith("Hallux")) return middle(chain(`toe.${side}.1`));
      const toe: RegExpExecArray | null = /^Toe(\d)/.exec(part);
      if (toe !== null)
        return (
          middle(chain(`toe.${side}.${toe[1]}`)) *
          (part.endsWith("Distal") ? 0.9 : 1)
        );
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

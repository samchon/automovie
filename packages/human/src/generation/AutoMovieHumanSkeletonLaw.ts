import { AutoMovieHumanArmConstruction } from "./AutoMovieHumanArmConstruction";
import { AutoMovieHumanFootConstruction } from "./AutoMovieHumanFootConstruction";
import type { AutoMovieHumanLegConstruction } from "./AutoMovieHumanLegConstruction";
import { AutoMovieHumanLegPrior } from "./AutoMovieHumanLegPrior";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanNaturalSpline } from "../lofting/AutoMovieHumanNaturalSpline";
import { AutoMovieHumanPolarSection } from "../lofting/AutoMovieHumanPolarSection";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";

/**
 * The bind skeleton, placed by rule before any limb is lofted, in calibration
 * millimetres (forward +X, up +Y, left +Z, floor at y = 0).
 *
 * The body is generated from the top down: the head, the neck and the trunk
 * are the root, and the limbs hang from it. The skeleton stands in that root,
 * reading only its landmarks (the ear lobes, the eye globes and the crown, the
 * neck's ring, the trunk's sections, its shoulder and crotch rings) and the
 * feet made in their own frame, and places every limb by the limbs' own laws
 * from the public inputs:
 *
 * - Arm: the arm's walk turns at the elbow, and the hand's section at the wrist
 *   crease gives the wrist. The shoulder stands one humerus above the elbow,
 *   the humerus `0.162 / 0.151` of the forearm (the ANSUR II joint-centre
 *   means of `docs/anatomy/skeleton.md`), where the deltoid's skin is one arm
 *   radius outside it.
 * - Hand: each digit's centre line by the hand's map. The thumb's metacarpal is
 *   `0.711` of the third (Reddy 2024), the third `0.774` of the wrist centre to
 *   the third metacarpale (de Leva 1996 against Reddy), and that distance
 *   `0.459` of the wrist centre to the middle fingertip, the wrist centre lying
 *   2.3 mm distal of the crease's stylion (de Leva 1996).
 * - Leg: the leg prior's line, the same line its skin is lofted about: the
 *   stance at the ankle, the knee at its stature fraction, and the hip centre on
 *   the chord from the knee through the thigh's top section, the crotch ring
 *   read about the centre the leg prior puts beside it.
 * - Foot and toes: the foot's own chains, moved under the stance.
 *
 * The limbs' skins then read their joints from here, so the skeleton comes
 * before the skin. Rules marked as conventions in `docs/anatomy/joint-range.md`
 * have no measured source.
 */
export namespace AutoMovieHumanSkeletonLaw {
  /** One bone of the bind skeleton. */
  export interface IBone {
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
  }

  /** What the skeleton reads besides the root. */
  export interface IInputs {
    /** The arms' lengths, tapes and hands. */
    arms: AutoMovieHumanArmConstruction.IInputs;

    /** The feet's dimensions. */
    feet: AutoMovieHumanFootConstruction.IInputs;

    /** The legs' tapes and controls. */
    legs: AutoMovieHumanLegConstruction.IInputs;
  }

  /**
   * Place every bone.
   *
   * @param root Calibration holding the head, the neck (`head`), the trunk
   *   (`trunk`, `upper`) and their events, with no limb.
   * @param inputs The limbs' inputs in calibration millimetres.
   * @returns Bones in parent-before-child order, root first.
   */
  export function derive(
    root: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
  ): IBone[] {
    const S: number = root.stature;
    const footed: IAutoMovieHumanBodyCalibration =
      AutoMovieHumanFootConstruction.add(root, inputs.feet);
    const chain = (name: string): IAutoMovieHumanLoftChain => {
      const found: IAutoMovieHumanLoftChain | undefined = footed.chains.find(
        (c: IAutoMovieHumanLoftChain): boolean => c.name === name,
      );
      if (found === undefined)
        throw new Error(`The skeleton needs the ${name} chain`);
      return found;
    };
    const pole = (name: string): Vec3 => {
      const found: IAutoMovieHumanBodyCalibration.IPole | undefined =
        footed.poles.find(
          (p: IAutoMovieHumanBodyCalibration.IPole): boolean =>
            p.chain === name,
        );
      if (found === undefined)
        throw new Error(`The skeleton needs the ${name} pole`);
      return found.point;
    };
    const bones: IBone[] = [];
    const add = (
      bone: string,
      parent: string | null,
      position: Vec3,
      toward: Vec3,
      tip: Vec3 | null = null,
    ): void => {
      bones.push({ bone, parent, position, toward, tip });
    };

    // The legs' lines, first: the hips stand on them.
    const legs: Record<"left" | "right", ILeg> = {
      left: leg(footed, inputs.legs, "left"),
      right: leg(footed, inputs.legs, "right"),
    };

    // Trunk column: hip centres, de Leva trunk boundaries, neck base.
    const trunk: IAutoMovieHumanLoftChain = chain("trunk");
    const upper: IAutoMovieHumanLoftChain = chain("upper");
    const hipY: number = HIP * S;
    const pelvis: Vec3 = lerp(legs.left.hip, legs.right.hip, 0.5);
    const span: number = CERVICALE * S;
    const lumbar: Vec3 = axis(trunk, hipY + OMPHALION * span);
    const thoracic: Vec3 = axis(trunk, hipY + XIPHION * span);

    // The neck owns the ring it shares with the shoulders.
    const neck: IAutoMovieHumanLoftChain = chain("head");
    const neckBase: Vec3 = end(neck, "bottom");
    const lobe = (side: string): Vec3 =>
      end(chain(`ear.lobe.${side}`), "bottom");
    const occiput: Vec3 = lerp(lobe("left"), lobe("right"), 0.5);
    const neckRadius: number = girth(
      chain("head.lower"),
      neckBase[1] + (occiput[1] - neckBase[1]) / 3,
    );
    const atlas: Vec3 = lerp(neckBase, occiput, 0.85);
    const crown: Vec3 = pole("head.upper");

    add("hips", null, pelvis, lumbar);
    add("spine", "hips", lumbar, thoracic);
    add("chest", "spine", thoracic, neckBase);
    add("neck", "chest", neckBase, atlas);
    add("atlas", "neck", atlas, occiput);
    add("head", "atlas", occiput, crown, crown);

    // Jaw and eyes (conventional facial placements, see the joint-range note).
    const eyes: IAutoMovieHumanBodyCalibration.IEye[] = footed.eyes;
    const eyeMid: Vec3 = [0, 1, 2].map(
      (i: number): number =>
        eyes.reduce(
          (a: number, e: IAutoMovieHumanBodyCalibration.IEye): number =>
            a + e.centre[i]!,
          0,
        ) / Math.max(1, eyes.length),
    ) as Vec3;
    const tmj: Vec3 = [occiput[0] + 0.006 * S, occiput[1] + 0.008 * S, 0];
    const chin: Vec3 = [eyeMid[0], eyeMid[1] - 0.068 * S, 0];
    add("jaw", "head", tmj, chin, chin);
    for (const eye of eyes) {
      const gaze: Vec3 = [eye.centre[0] + 0.03 * S, eye.centre[1], eye.centre[2]];
      add(`${eye.side}Eye`, "head", eye.centre, gaze, gaze);
    }

    const arms: Record<"left" | "right", AutoMovieHumanArmConstruction.IBones> =
      AutoMovieHumanArmConstruction.bones(footed, inputs.arms);
    for (const side of ["left", "right"] as const) {
      const s: number = side === "left" ? 1 : -1;

      // Shoulder girdle and arm.
      const bones_: AutoMovieHumanArmConstruction.IBones = arms[side];
      const elbow: Vec3 = bones_.elbow;
      const wrist: Vec3 = bones_.crease;
      const glenohumeral: Vec3 = shoulder(
        upper,
        footed,
        side,
        elbow,
        (UPPER_ARM / FOREARM) * distance(elbow, wrist),
      );
      const sternoclavicular: Vec3 = [
        axis(upper, glenohumeral[1])[0],
        glenohumeral[1],
        s * neckRadius * 0.5,
      ];
      const digit = (
        line: AutoMovieHumanArmConstruction.IDigitLine,
        units: number[],
      ): Vec3[] => phalanges([...line.line, line.tip], units);
      const lines: AutoMovieHumanArmConstruction.IDigitLine[] = bones_.digits;
      const named = (name: string): AutoMovieHumanArmConstruction.IDigitLine =>
        lines.find(
          (l: AutoMovieHumanArmConstruction.IDigitLine): boolean =>
            l.name === name,
        )!;
      const middle: Vec3[] = digit(named(`finger.${side}.middle`), FINGER);
      add(`${side}Shoulder`, "chest", sternoclavicular, glenohumeral);
      add(`${side}Scapula`, `${side}Shoulder`, glenohumeral, elbow);
      add(`${side}UpperArm`, `${side}Scapula`, glenohumeral, elbow);
      add(`${side}LowerArm`, `${side}UpperArm`, elbow, wrist);
      add(`${side}Hand`, `${side}LowerArm`, wrist, middle[0]!);

      // Thumb: the carpometacarpal joint halfway from the wrist crease to the
      // branch, at the trapezium (convention); the metacarpal's measured share
      // of the hand along the line to the branch; IP halfway to the tip
      // (convention).
      const thumb: AutoMovieHumanArmConstruction.IDigitLine = named(
        `thumb.${side}`,
      );
      const branch: Vec3 = thumb.line[0]!;
      const cmc: Vec3 = lerp(wrist, branch, 0.5);
      const metacarpal: number =
        THUMB_METACARPAL *
        THIRD_METACARPAL *
        KNUCKLE *
        (bones_.length - STYLION);
      const mcp: Vec3 = along2(cmc, branch, metacarpal);
      const ip: Vec3 = lerp(mcp, thumb.tip, 0.5);
      add(`${side}ThumbMetacarpal`, `${side}Hand`, cmc, mcp);
      add(`${side}ThumbProximal`, `${side}ThumbMetacarpal`, mcp, ip);
      add(`${side}ThumbDistal`, `${side}ThumbProximal`, ip, thumb.tip, thumb.tip);
      for (const [name, key] of [
        ["Index", "index"],
        ["Middle", "middle"],
        ["Ring", "ring"],
        ["Little", "little"],
      ] as const) {
        const [mcp_, pip, dip, tip]: Vec3[] =
          key === "middle" ? middle : digit(named(`finger.${side}.${key}`), FINGER);
        add(`${side}${name}Proximal`, `${side}Hand`, mcp_!, pip!);
        add(`${side}${name}Intermediate`, `${side}${name}Proximal`, pip!, dip!);
        add(`${side}${name}Distal`, `${side}${name}Intermediate`, dip!, tip!, tip!);
      }

      // Leg, foot and the five toes, the foot moved under the stance.
      const own: ILeg = legs[side];
      const moved = (p: Vec3): Vec3 => [
        p[0] + own.shift[0],
        p[1],
        p[2] + own.shift[1],
      ];
      const toes: Vec3[][] = [1, 2, 3, 4, 5].map((k: number): Vec3[] =>
        phalanges(
          [
            ...stations(chain(`toe.${side}.${k}`)),
            pole(`toe.${side}.${k}`),
          ],
          k === 1 ? HALLUX : FINGER,
        ).map(moved),
      );
      const ball: Vec3 = [0, 1, 2].map(
        (i: number): number =>
          toes.reduce((a: number, t: Vec3[]): number => a + t[0]![i]!, 0) /
          toes.length,
      ) as Vec3;
      const midfoot: Vec3 = lerp(own.ankle, ball, 0.4);
      add(`${side}UpperLeg`, "hips", own.hip, own.knee);
      add(`${side}LowerLeg`, `${side}UpperLeg`, own.knee, own.ankle);
      add(`${side}Foot`, `${side}LowerLeg`, own.ankle, ball);
      add(`${side}Subtalar`, `${side}Foot`, own.ankle, midfoot);
      add(`${side}Midfoot`, `${side}Subtalar`, midfoot, ball);
      toes.forEach((t: Vec3[], i: number): void => {
        if (i === 0) {
          add(`${side}HalluxProximal`, `${side}Midfoot`, t[0]!, t[1]!);
          add(`${side}HalluxDistal`, `${side}HalluxProximal`, t[1]!, t[2]!, t[2]!);
          return;
        }
        const n: string = `${side}Toe${i + 1}`;
        add(`${n}Proximal`, `${side}Midfoot`, t[0]!, t[1]!);
        add(`${n}Intermediate`, `${n}Proximal`, t[1]!, t[2]!);
        add(`${n}Distal`, `${n}Intermediate`, t[2]!, t[3]!, t[3]!);
      });
    }
    return bones;
  }
}

type Vec3 = [number, number, number];

/** One leg's bones on the leg prior's line. */
interface ILeg {
  /** Hip centre. */
  hip: Vec3;

  /** Knee centre. */
  knee: Vec3;

  /** Ankle centre. */
  ankle: Vec3;

  /** The foot's move from its own frame to the stance, `[x, z]`. */
  shift: [number, number];
}

/**
 * A leg on the leg prior's line: the line the leg's skin is lofted about,
 * without the skin's own terms (the thighs' contact at the midline and their
 * lean onto the crotch ring).
 *
 * The leg runs from the foot's ankle ring to the trunk's crotch ring. Its
 * forward place follows the ankle by the prior's forward curve in leg lengths,
 * and its lateral place is a line in the leg's length, the hip tape and the
 * masculine-feminine control at every fraction; the stance is that line at the
 * ankle. The knee and the ankle stand at their ANSUR II stature fractions on it,
 * and the hip centre on the chord from the knee through the centre of the
 * thigh's top section, at its own fraction.
 */
function leg(
  footed: IAutoMovieHumanBodyCalibration,
  inputs: AutoMovieHumanLegConstruction.IInputs,
  side: "left" | "right",
): ILeg {
  const sign: 1 | -1 = side === "left" ? 1 : -1;
  const S: number = footed.stature;
  const prior: AutoMovieHumanLegPrior.IPrior = AutoMovieHumanLegPrior.PRIOR;
  const foot: IAutoMovieHumanLoftChain = footed.chains.find(
    (c: IAutoMovieHumanLoftChain): boolean => c.name === `foot.${side}`,
  )!;
  const ankleRing: Vec3[] = AutoMovieHumanLoftChain.ring(
    foot,
    foot.layers[foot.layers.length - 1]!.y,
    LEG_PHASES,
  );
  const crotch: Vec3[] = crotchRing(footed, side);
  const bottom: number = level(ankleRing);
  const length: number = level(crotch) - bottom;
  const spline = (values: readonly number[]): AutoMovieHumanNaturalSpline.ISpline =>
    AutoMovieHumanNaturalSpline.create(prior.stations, values);
  const lateral: AutoMovieHumanNaturalSpline.ISpline[] = [
    prior.lateral.offset,
    prior.lateral.leg,
    prior.lateral.hip,
    prior.lateral.sex,
  ].map(spline);
  const forward: AutoMovieHumanNaturalSpline.ISpline = spline(prior.forward);
  const read = (s: AutoMovieHumanNaturalSpline.ISpline, u: number): number =>
    AutoMovieHumanNaturalSpline.evaluate(s, u);
  const stance: [number, number] = [
    (prior.ankle.offset +
      prior.ankle.fat * inputs.fat +
      prior.ankle.muscularity * inputs.muscularity) *
      inputs.scale,
    read(lateral[0]!, 0) * inputs.scale +
      read(lateral[1]!, 0) * length +
      read(lateral[2]!, 0) * inputs.hip +
      read(lateral[3]!, 0) * inputs.sex * inputs.scale,
  ];
  const line = (y: number): Vec3 => {
    const u: number = (y - bottom) / length;
    return [
      stance[0] + length * read(forward, u),
      y,
      sign *
        (read(lateral[0]!, u) * inputs.scale +
          read(lateral[1]!, u) * length +
          read(lateral[2]!, u) * inputs.hip +
          read(lateral[3]!, u) * inputs.sex * inputs.scale),
    ];
  };
  const knee: Vec3 = line(KNEE * S);

  // The thigh's top section: the crotch ring read about the section centre the
  // leg prior puts beside the ring's own area centre, since the ring is tilted
  // and its projection is not a section.
  const canonical: [number, number][] = crotch.map(
    (p: Vec3): [number, number] => [p[0], sign * p[2]],
  );
  const area: [number, number] =
    AutoMovieHumanPolarSection.measure(canonical).centre;
  const centre: [number, number] = [
    area[0] + prior.ring.forward * length,
    area[1] + prior.ring.lateral * length,
  ];
  let sx: number = 0;
  let sz: number = 0;
  for (let m: number = 0; m < TOP_PHASES; m++) {
    const t: number = (2 * Math.PI * m) / TOP_PHASES;
    const r: number = AutoMovieHumanPolarSection.radius(canonical, centre, t);
    sx += centre[0] + r * Math.cos(t);
    sz += centre[1] + r * Math.sin(t);
  }
  const top: Vec3 = [sx / TOP_PHASES, level(crotch), (sign * sz) / TOP_PHASES];
  const hip: Vec3 = lerp(knee, top, (HIP * S - knee[1]) / (top[1] - knee[1]));
  const at: [number, number] = AutoMovieHumanPolarSection.measure(
    ankleRing.map((p: Vec3): [number, number] => [p[0], p[2]]),
  ).centre;
  return {
    hip,
    knee,
    ankle: [stance[0], ANKLE * S, sign * stance[1]],
    shift: [stance[0] - at[0], sign * stance[1] - at[1]],
  };
}

/** The arc of the trunk's bottom ring that a leg takes. */
function crotchRing(
  calibration: IAutoMovieHumanBodyCalibration,
  side: "left" | "right",
): Vec3[] {
  const trunk: IAutoMovieHumanLoftChain = calibration.chains.find(
    (c: IAutoMovieHumanLoftChain): boolean => c.name === "trunk",
  )!;
  const event: IAutoMovieHumanBodyCalibration.IEvent = calibration.events.find(
    (e: IAutoMovieHumanBodyCalibration.IEvent): boolean =>
      e.parent === "trunk" && e.direction === "down",
  )!;
  const split: IAutoMovieHumanBodyCalibration.ISplit | undefined =
    event.splits.find(
      (s: IAutoMovieHumanBodyCalibration.ISplit): boolean =>
        s.child === `leg.${side}`,
    );
  if (split === undefined)
    throw new Error(`The trunk's bottom ring gives no arc to leg.${side}`);
  return split.arcs.flatMap(([from, to]: [number, number]): Vec3[] => {
    const span: number = to >= from ? to - from : to + 2 * Math.PI - from;
    return AutoMovieHumanLoftChain.ring(
      trunk,
      trunk.layers[0]!.y,
      Array.from(
        { length: RING },
        (_: unknown, i: number): number => from + (span * i) / (RING - 1),
      ),
    );
  });
}

/**
 * The glenohumeral joint: one humerus from the elbow, where the deltoid's skin
 * stands one arm radius outside it.
 *
 * At a height the shoulder's section has its lateral extremity, and the joint
 * lies the arm root's girth radius inside it, fore and aft among the points
 * that near the extremity. The height is the one at which that point lies the
 * humerus' length from the elbow. A height read as a fraction of stature would
 * not follow the shoulders, which the construction places from the head down.
 */
function shoulder(
  upper: IAutoMovieHumanLoftChain,
  calibration: IAutoMovieHumanBodyCalibration,
  side: "left" | "right",
  elbow: Vec3,
  humerus: number,
): Vec3 {
  const s: number = side === "left" ? 1 : -1;
  const radius: number = rootRadius(upper, calibration, side);
  const deltoid = (y: number): Vec3 => {
    const cap: Vec3[] = AutoMovieHumanLoftChain.ring(
      upper,
      Math.min(stop(upper), Math.max(start(upper), y)),
      PHASES,
    ).filter((p: Vec3): boolean => s * p[2] > 0);
    const lateral: number = Math.max(...cap.map((p: Vec3): number => s * p[2]));
    const xs: number[] = cap
      .filter((p: Vec3): boolean => s * p[2] > lateral - radius)
      .map((p: Vec3): number => p[0]);
    return [
      xs.reduce((a: number, b: number): number => a + b, 0) / xs.length,
      y,
      s * (lateral - radius),
    ];
  };
  // Going up, the point rises and the shoulder narrows, so its distance from
  // the elbow only grows: bisect for the height. Shoulders that end first keep
  // the joint at their top.
  let low: number = Math.max(start(upper), elbow[1]);
  let high: number = stop(upper);
  if (distance(deltoid(high), elbow) <= humerus) return deltoid(high);
  for (let i: number = 0; i < SHOULDER_STEPS; i++) {
    const mid: number = (low + high) / 2;
    if (distance(deltoid(mid), elbow) < humerus) low = mid;
    else high = mid;
  }
  return deltoid((low + high) / 2);
}

/** Girth radius of the arm's root: its arc of the shoulder ring, closed. */
function rootRadius(
  upper: IAutoMovieHumanLoftChain,
  calibration: IAutoMovieHumanBodyCalibration,
  side: "left" | "right",
): number {
  const event: IAutoMovieHumanBodyCalibration.IEvent = calibration.events.find(
    (e: IAutoMovieHumanBodyCalibration.IEvent): boolean =>
      e.parent === "upper" && e.direction === "down",
  )!;
  const ring: Vec3[] = event.splits
    .find(
      (sp: IAutoMovieHumanBodyCalibration.ISplit): boolean =>
        sp.child === `arm.${side}`,
    )!
    .arcs.flatMap(([from, to]: [number, number]): Vec3[] => {
      const span: number = to >= from ? to - from : to + 2 * Math.PI - from;
      return AutoMovieHumanLoftChain.ring(
        upper,
        upper.layers[0]!.y,
        Array.from(
          { length: RING },
          (_: unknown, i: number): number => from + (span * i) / RING,
        ),
      );
    });
  let perimeter: number = 0;
  ring.forEach((p: Vec3, i: number): void => {
    perimeter += distance(ring[(i + 1) % ring.length]!, p);
  });
  return perimeter / (2 * Math.PI);
}

/**
 * Phalanx units of a finger or lesser toe: a conventional 2:1:1 split with
 * the web halfway along the proximal phalanx, so the joints sit one unit
 * before the web and one and two units after it, the tip three after.
 */
const FINGER: number[] = [-1, 1, 2, 3];

/** Hallux: two equal phalanges with the web halfway along the first (convention). */
const HALLUX: number[] = [-0.5, 0.5, 1.5];

/**
 * ANSUR II joint-centre stature fractions, sexes averaged
 * (`docs/anatomy/skeleton.md`): hip, knee and lateral malleolus.
 */
const HIP: number = 0.518;
const KNEE: number = 0.2865;
const ANKLE: number = 0.0405;

/** Mid-hip to cervicale as a fraction of stature, and de Leva's omphalion and xiphion fractions of it. */
const CERVICALE: number = 0.3425;
const OMPHALION: number = 0.245;
const XIPHION: number = 0.617;

/** ANSUR II women's upper arm and forearm joint-centre lengths as fractions of stature. */
const UPPER_ARM: number = 0.162;
const FOREARM: number = 0.151;

/** Thumb metacarpal over the third (Reddy 2024, sexes pooled). */
const THUMB_METACARPAL: number = 0.711;

/** Third metacarpal over de Leva's wrist centre to third metacarpale. */
const THIRD_METACARPAL: number = 0.774;

/** De Leva's wrist centre to third metacarpale over wrist centre to third dactylion. */
const KNUCKLE: number = 0.459;

/** De Leva's wrist centre distal of stylion, sexes averaged, mm (Table 2, from stylion-3rd metacarpale). */
const STYLION: number = 2.3;

/** Phases sampling a section for perimeters and extremities. */
const PHASES: number[] = Array.from(
  { length: 96 },
  (_: unknown, i: number): number => (2 * Math.PI * i) / 96,
);

/** Phases of a leg's end ring. */
const LEG_PHASES: number[] = Array.from(
  { length: 256 },
  (_: unknown, i: number): number => (2 * Math.PI * i) / 256,
);

/** Samples of a ring's arc. */
const RING: number = 512;

/** Phases of the thigh's top section, as the leg samples it. */
const TOP_PHASES: number = 256;

/** Bisections of the shoulder's height. */
const SHOULDER_STEPS: number = 30;

/**
 * Joints of one digit from its centre line, root first and tip last: the web
 * is the line's start, and `units` places each joint in units of the line's
 * length divided by the last unit, negative units extending back along the
 * digit's axis.
 */
function phalanges(path: Vec3[], units: number[]): Vec3[] {
  const unit: number = length(path) / units[units.length - 1]!;
  const web: Vec3 = path[0]!;
  const back: Vec3 = unitVector(sub(path[0]!, path[1]!));
  return units.map((u: number): Vec3 =>
    u < 0
      ? [
          web[0] - back[0] * u * unit,
          web[1] - back[1] * u * unit,
          web[2] - back[2] * u * unit,
        ]
      : along(path, u / units[units.length - 1]!),
  );
}

/** A chain's axis from its top to its bottom in 24 even steps. */
function stations(chain: IAutoMovieHumanLoftChain): Vec3[] {
  const from: number = stop(chain);
  const to: number = start(chain);
  return Array.from(
    { length: 25 },
    (_: unknown, i: number): Vec3 => axis(chain, from + ((to - from) * i) / 24),
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
function axis(chain: IAutoMovieHumanLoftChain, s: number): Vec3 {
  return AutoMovieHumanLoftChain.axis(
    chain,
    Math.min(stop(chain), Math.max(start(chain), s)),
  );
}

/** Axis point at a chain end. */
function end(chain: IAutoMovieHumanLoftChain, which: "top" | "bottom"): Vec3 {
  return axis(chain, which === "top" ? stop(chain) : start(chain));
}

/** Girth radius, perimeter / 2pi, of the section at a station clamped into the chain. */
function girth(chain: IAutoMovieHumanLoftChain, s: number): number {
  const ring: Vec3[] = AutoMovieHumanLoftChain.ring(
    chain,
    Math.min(stop(chain), Math.max(start(chain), s)),
    PHASES,
  );
  let perimeter: number = 0;
  ring.forEach((p: Vec3, i: number): void => {
    perimeter += distance(ring[(i + 1) % ring.length]!, p);
  });
  return perimeter / (2 * Math.PI);
}

/** Mean height of a ring. */
function level(ring: Vec3[]): number {
  return mean(ring, 1);
}

/** Mean of one coordinate of points. */
function mean(points: Vec3[], c: number): number {
  return points.reduce((s: number, p: Vec3): number => s + p[c]!, 0) / points.length;
}

/** Polyline length. */
function length(path: Vec3[]): number {
  let total: number = 0;
  for (let i: number = 1; i < path.length; i++)
    total += distance(path[i]!, path[i - 1]!);
  return total;
}

/** Point at a fraction of a polyline's length. */
function along(path: Vec3[], fraction: number): Vec3 {
  let remaining: number = fraction * length(path);
  for (let i: number = 1; i < path.length; i++) {
    const step: number = distance(path[i]!, path[i - 1]!);
    if (remaining <= step && step > 0)
      return lerp(path[i - 1]!, path[i]!, remaining / step);
    remaining -= step;
  }
  return path[path.length - 1]!;
}

/** The point a distance from `a` toward `b`, on past it when farther. */
function along2(a: Vec3, b: Vec3, d: number): Vec3 {
  const u: Vec3 = unitVector(sub(b, a));
  return [a[0] + d * u[0], a[1] + d * u[1], a[2] + d * u[2]];
}

/** Euclidean distance. */
function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** Difference a - b. */
function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** Unit vector of v. */
function unitVector(v: Vec3): Vec3 {
  const n: number = Math.hypot(...v);
  return [v[0] / n, v[1] / n, v[2] / n];
}

/** Linear interpolation a + (b - a) t. */
function lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

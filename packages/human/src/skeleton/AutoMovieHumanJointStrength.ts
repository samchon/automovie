import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * A sex-specific peak-torque regression: intercept, age, height and mass
 * coefficients.
 */
type Model = readonly [number, number, number, number];

/** One motion's male and female models. */
interface IMotion {
  /** Men. */
  male: Model;
  /** Women. */
  female: Model;
}

/**
 * Peak joint torque models of Harbo, Brincks and Andersen (2012), "Maximal
 * isokinetic and isometric muscle strength of major muscle groups related to
 * age, body mass, height, and sex in 178 healthy subjects", Eur J Appl Physiol
 * 112:267-275, Tables 1 and 2: torque (N m) = intercept + b1 age (y) + b2
 * height (m) + b3 mass (kg). The paper's "ankle flexion" is plantar flexion and
 * its "ankle extension" dorsiflexion. An isometric model, measured at the
 * neutral joint position, is used where the paper gives one; otherwise its
 * isokinetic one, which the paper reports no stronger than isometric except for
 * shoulder abduction in women and elbow flexion.
 */
const HARBO: Readonly<Record<string, IMotion>> = {
  // Isometric.
  shoulderAbduction: {
    male: [-30.8, -0.24, 36, 0.49],
    female: [-28.2, -0.21, 35, 0.29],
  },
  // Isokinetic only.
  shoulderAdduction: {
    male: [-72.9, -0.06, 72, 0.38],
    female: [-24.5, -0.15, 40, 0.18],
  },
  // Isometric.
  elbowFlexion: {
    male: [-23.8, -0.13, 22, 0.51],
    female: [6.9, -0.13, 9, 0.18],
  },
  // Isokinetic only.
  elbowExtension: {
    male: [-4.4, -0.07, 12, 0.42],
    female: [6.4, -0.1, 5, 0.27],
  },
  // Isometric.
  wristFlexion: {
    male: [-6.9, -0.07, 10, 0.21],
    female: [-22.2, -0.04, 23, 0.0],
  },
  // Isokinetic only.
  wristExtension: {
    male: [-11.1, -0.02, 12, 0.03],
    female: [-9.0, -0.01, 9, 0.01],
  },
  // Isometric.
  hipFlexion: {
    male: [37.6, -0.72, 36, 1.12],
    female: [-72.4, -0.2, 78, 0.89],
  },
  // Isokinetic only.
  hipExtension: {
    male: [-49.8, -0.97, 103, 1.14],
    female: [-108.7, -0.87, 147, 0.5],
  },
  // Isokinetic only.
  kneeFlexion: {
    male: [-90.8, -0.49, 80, 0.82],
    female: [-40.2, -0.48, 57, 0.46],
  },
  // Isometric.
  kneeExtension: {
    male: [-107.9, -1.4, 158, 1.75],
    female: [-201.0, -0.96, 216, 0.88],
  },
  // Isometric ("ankle extension").
  ankleDorsiflexion: {
    male: [-88.9, -0.04, 68, 0.16],
    female: [-37.8, -0.04, 35, 0.16],
  },
  // Isokinetic only ("ankle flexion").
  anklePlantarflexion: {
    male: [97.7, -0.72, 4, 0.52],
    female: [33.2, -0.68, 24, 0.59],
  },
};

/**
 * The clinical channels the models cover, by the bone the joint moves: the
 * motion toward the channel's clinical maximum, then toward its minimum. The
 * rig's clinical signs (`DEFAULT_HUMANOID_ROM`) put flexion positive at the
 * hip, knee and elbow, abduction positive at the shoulder, dorsiflexion
 * positive at the ankle and extension positive at the wrist.
 */
const COVERED: Readonly<
  Record<
    string,
    Partial<Record<"flexion" | "abduction" | "twist", [string, string]>>
  >
> = {
  UpperLeg: { flexion: ["hipFlexion", "hipExtension"] },
  LowerLeg: { flexion: ["kneeFlexion", "kneeExtension"] },
  Foot: { flexion: ["ankleDorsiflexion", "anklePlantarflexion"] },
  UpperArm: { abduction: ["shoulderAbduction", "shoulderAdduction"] },
  LowerArm: { flexion: ["elbowFlexion", "elbowExtension"] },
  Hand: { flexion: ["wristExtension", "wristFlexion"] },
};

/**
 * The strength the canonical Human's joints have: a person's peak joint torques
 * by sex, height and mass at the stated adult age.
 */
export namespace AutoMovieHumanJointStrength {
  /**
   * The adult age the canonical profile represents, years, stated rather than
   * measured.
   */
  export const AGE: number = 40;

  /** The person the strength is evaluated for. */
  export interface IPerson {
    /** True for a man. */
    male: boolean;
    /** Stature, metres. */
    height: number;
    /** Body mass, kilograms. */
    mass: number;
  }

  /**
   * A clinical channel's peak torques toward its clinical maximum and minimum,
   * N m, or undefined where Harbo et al. measured neither motion.
   *
   * @param person The person.
   * @param bone The bone the joint moves.
   * @param channel The clinical channel.
   * @returns The two peak torques, or undefined.
   */
  export function of(
    person: IPerson,
    bone: AutoMovieHumanoidBone,
    channel: "flexion" | "abduction" | "twist",
  ): { toMaximum: number; toMinimum: number } | undefined {
    const motions: [string, string] | undefined =
      COVERED[bone.replace(/^(left|right)/, "")]?.[channel];
    if (motions === undefined) return undefined;
    const torque = (name: string): number => {
      const [intercept, age, height, mass] = person.male
        ? HARBO[name]!.male
        : HARBO[name]!.female;
      return Math.max(
        0,
        intercept + age * AGE + height * person.height + mass * person.mass,
      );
    };
    return { toMaximum: torque(motions[0]), toMinimum: torque(motions[1]) };
  }
}

import { AutoMovieHumanWebPatch } from "./AutoMovieHumanWebPatch";

/** Carry a parent's boundary jets into a limb without changing its distant tapes. */
export namespace AutoMovieHumanArmCollar {
  /** Common Cartesian millimetres. */
  export type Vec3 = [number, number, number];

  /** The unmodified surface and the parent's local continuation at its root. */
  export interface IInput {
    /** Parameter of the shared root; increasing parameter runs toward the parent. */
    root: number;

    /** Largest permitted collar run in that same millimetre parameter. */
    reach: number;

    /** Largest displacement of this correction, mm. */
    bulge: number;

    /** Uniform phases of the emitted section's control samples. */
    phases: number;

    /** Existing section family, evaluated without this correction. */
    surface: (station: number, phase: number) => Vec3;

    /** Parent continuation following the existing surface's angular correspondence. */
    parent: (station: number, phase: number) => Vec3;
  }

  /** Corrected family and the run its boundary constraints require. */
  export interface IOutput {
    /** Run below the shared root occupied by the correction, mm. */
    reach: number;

    /** Existing family with a zero-jet-ended quintic correction. */
    point: (station: number, phase: number) => Vec3;
  }

  /**
   * Match the parent's value, tangent and curvature at the root and leave all
   * three unchanged at the inner end. Four one-sided observations recover the
   * local residual jets; the cubic error is far below the emitted layer pitch.
   * A common run bounds the norm of both derivative terms by their quintic
   * extrema, avoiding a phase-dependent reach that could crease a section.
   */
  export function create(input: IInput): IOutput {
    if (![input.root, input.reach, input.bulge, input.phases].every(Number.isFinite) || !Number.isInteger(input.phases) || input.phases < 3)
      throw new Error("A shoulder collar needs finite dimensions and at least three phases");
    const jets: Map<number, AutoMovieHumanWebPatch.IJet> = new Map();
    const zero: AutoMovieHumanWebPatch.IJet = { value: [0, 0, 0], first: [0, 0, 0], second: [0, 0, 0] };
    const at: (phase: number) => AutoMovieHumanWebPatch.IJet = (phase: number): AutoMovieHumanWebPatch.IJet => {
      let jet: AutoMovieHumanWebPatch.IJet | undefined = jets.get(phase);
      if (jet !== undefined) return jet;
      const values: Vec3[] = [0, 1, 2, 3].map((i: number): Vec3 => {
        const q: number = input.root - i * STEP;
        return difference(input.parent(q, phase), input.surface(q, phase));
      });
      const first: Vec3 = [0, 1, 2].map((k: number): number =>
        (-11 * values[0]![k]! + 18 * values[1]![k]! - 9 * values[2]![k]! + 2 * values[3]![k]!) / (6 * STEP),
      ) as Vec3;
      const second: Vec3 = [0, 1, 2].map((k: number): number =>
        (2 * values[0]![k]! - 5 * values[1]![k]! + 4 * values[2]![k]! - values[3]![k]!) / (STEP * STEP),
      ) as Vec3;
      jet = { value: values[0]!, first, second };
      jets.set(phase, jet);
      return jet;
    };
    let value: number = 0;
    let first: number = 0;
    let second: number = 0;
    for (let i: number = 0; i < input.phases; i++) {
      const jet: AutoMovieHumanWebPatch.IJet = at((2 * Math.PI * i) / input.phases);
      value = Math.max(value, Math.hypot(...jet.value));
      first = Math.max(first, Math.hypot(...jet.first));
      second = Math.max(second, Math.hypot(...jet.second));
    }
    if (!(input.reach > 0 && input.bulge > value))
      throw new Error("The shoulder boundary must fit inside its collar displacement bound");

    // H10 peaks at 1/3 with 16/81; H20 peaks at 2/5 with 54/3125.
    // Triangle inequality therefore bounds every correction by value+aL+bL².
    const a: number = (16 / 81) * first;
    const b: number = (54 / 3125) * second;
    const remaining: number = input.bulge - value;
    const bound: number = b > 0 ? 2 * remaining / (a + Math.sqrt(a * a + 4 * b * remaining)) : a > 0 ? remaining / a : input.reach;
    const reach: number = Math.min(input.reach, bound);
    return {
      reach,
      point: (station: number, phase: number): Vec3 => {
        const base: Vec3 = input.surface(station, phase);
        const depth: number = input.root - station;
        if (depth >= reach) return base;
        const jet: AutoMovieHumanWebPatch.IJet = at(phase);
        const correction: Vec3 = AutoMovieHumanWebPatch.curve({
          value: jet.value,
          first: multiply(jet.first, reach),
          second: multiply(jet.second, reach * reach),
        }, zero, depth / reach);
        return [base[0] + correction[0], base[1] + correction[1], base[2] + correction[2]];
      },
    };
  }
}

/** One-sided jet observation step, in the arm's millimetre parameter. */
const STEP: number = 0.05;

/** Difference of two Cartesian values. */
function difference(a: AutoMovieHumanArmCollar.Vec3, b: AutoMovieHumanArmCollar.Vec3): AutoMovieHumanArmCollar.Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** Scale a Cartesian derivative into its normalized Hermite parameter. */
function multiply(a: AutoMovieHumanArmCollar.Vec3, factor: number): AutoMovieHumanArmCollar.Vec3 {
  return [factor * a[0], factor * a[1], factor * a[2]];
}

import { AutoMovieHumanBodyLaw } from "../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanRig } from "../../../../packages/human/src/skeleton/AutoMovieHumanRig";
import { AutoMovieHumanSkeleton } from "../../../../packages/human/src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import {
  f1,
  f2,
  m1,
  m2,
} from "../../../../packages/playground/src/human-parameters/index";

/**
 * The people the Human tests read, each generated once per run and only when a
 * test first asks for them. Nothing generated here may be modified.
 */
export namespace HumanPeople {
  /** A generated person. */
  export interface IPerson {
    /** Name in findings. */
    name: string;

    /** Public inputs. */
    params: IAutoMovieHumanParameters;

    /** The generated body. */
    body: IAutoMovieHumanBodyCalibration;
  }

  /** A generated person with a rig and a pose evaluator. */
  export interface IRigged extends IPerson {
    /** Metres per calibration millimetre. */
    scale: number;

    /** The body's rig. */
    rig: AutoMovieHumanRig.IRig;

    /** The body's clinical pose evaluator. */
    evaluate: AutoMovieHumanSkeleton.PoseEvaluator;
  }

  /** Every person's name, without generating anyone. */
  export function names(): string[] {
    return [...inputs().keys()];
  }

  /** One person, generated on first use. */
  export function person(name: string): IPerson {
    const found: IPerson | undefined = persons.get(name);
    if (found !== undefined) return found;
    const params: IAutoMovieHumanParameters = inputs().get(name)!;
    const made: IPerson = {
      name,
      params,
      body: AutoMovieHumanBodyLaw.calibrate(params).body,
    };
    persons.set(name, made);
    return made;
  }

  /** One person with a rig and pose evaluator, prepared on first use. */
  export function rigged(name: string): IRigged {
    const found: IRigged | undefined = riggeds.get(name);
    if (found !== undefined) return found;
    const own: IPerson = person(name);
    const scale: number =
      0.001 * (own.params.body.controls.height.value! / own.body.stature);
    const made: IRigged = {
      ...own,
      scale,
      rig: AutoMovieHumanRig.prepare(own.body, scale),
      evaluate: AutoMovieHumanSkeleton.prepare(own.params, {
        calibration: own.body,
      }),
    };
    riggeds.set(name, made);
    return made;
  }
}

const persons: Map<string, HumanPeople.IPerson> = new Map();
const riggeds: Map<string, HumanPeople.IRigged> = new Map();
let table: Map<string, IAutoMovieHumanParameters> | null = null;

/** Every person's inputs. */
function inputs(): Map<string, IAutoMovieHumanParameters> {
  table ??= new Map<string, IAutoMovieHumanParameters>([
    ["f1", f1],
    ["f2", f2],
    ["m1", m1],
    ["m2", m2],
    ...extremes(),
  ]);
  return table;
}

/**
 * People at the ends of the public controls, from one person's inputs. Each is
 * a whole person: tapes move together, as a body's do, since a chest of 1300 mm
 * over an underbust of 740 mm is no body at all.
 */
function extremes(): [string, IAutoMovieHumanParameters][] {
  const change = (
    label: string,
    edits: Record<string, number>,
  ): [string, IAutoMovieHumanParameters] => {
    const out: IAutoMovieHumanParameters = structuredClone(f1);
    const controls = out.body.controls as unknown as Record<
      string,
      { value: number | null }
    >;
    for (const [key, value] of Object.entries(edits))
      controls[key]!.value = value;
    return [label, out];
  };
  return [
    change("tall", { height: 2000, inseam: 920 }),
    change("short", { height: 1450, inseam: 640 }),
    change("wide", {
      hip: 1250,
      highHip: 1180,
      waist: 1100,
      underbust: 1100,
      chest: 1200,
      thigh: 720,
      knee: 450,
      calf: 480,
      bicep: 400,
      elbow: 310,
      forearm: 320,
      wrist: 185,
      neck: 420,
      neckBase: 460,
      acrossShoulder: 340,
      frontInterscyeLength: 370,
    }),
    change("narrow", {
      hip: 800,
      highHip: 690,
      waist: 560,
      underbust: 640,
      chest: 720,
      thigh: 440,
      knee: 295,
      calf: 285,
      bicep: 215,
      elbow: 195,
      forearm: 195,
      wrist: 130,
      neck: 295,
      neckBase: 320,
      acrossShoulder: 270,
      frontInterscyeLength: 290,
    }),
    change("masculine", { masculineFeminine: -1 }),
  ];
}

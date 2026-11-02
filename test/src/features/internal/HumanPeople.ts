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
 * over an underbust of 740 mm is no body at all. The head, hands and feet move
 * with the body to the ends of their populations, so every extreme has a head,
 * hands and feet of its own.
 */
function extremes(): [string, IAutoMovieHumanParameters][] {
  const change = (
    label: string,
    edits: Record<string, number>,
    part: IPart = {},
  ): [string, IAutoMovieHumanParameters] => {
    const out: IAutoMovieHumanParameters = structuredClone(f1);
    const controls = out.body.controls as unknown as Record<
      string,
      { value: number | null }
    >;
    for (const [key, value] of Object.entries(edits))
      controls[key]!.value = value;
    resize(out, part);
    return [label, out];
  };
  return [
    change("tall", { height: 2000, inseam: 920 }, LONG(+1)),
    change("short", { height: 1450, inseam: 640 }, LONG(-1)),
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
    }, BROAD(+1)),
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
    }, BROAD(-1)),
    change("masculine", { masculineFeminine: -1 }, MALE),
  ];
}

/**
 * Factors on a person's head, hand and foot inputs, each named after the input
 * it scales; a missing factor leaves its input.
 */
interface IPart {
  /** Head length; the head's height moves by the face height's change. */
  headLength?: number;

  /** Head breadth, through the cephalic index. */
  headBreadth?: number;

  /** Morphological face height. */
  faceHeight?: number;

  /** Face width. */
  faceWidth?: number;

  /** Mandibular width. */
  mandibularWidth?: number;

  /** Minimum frontal width. */
  minimumFrontalWidth?: number;

  /** Intercanthal width. */
  intercanthalWidth?: number;

  /** Palpebral fissure length. */
  fissure?: number;

  /** Nasal width. */
  noseWidth?: number;

  /** Nasal height. */
  noseHeight?: number;

  /** Nasal protrusion. */
  noseProtrusion?: number;

  /** Mouth width. */
  mouthWidth?: number;

  /** Vermilion heights. */
  vermilion?: number;

  /** Ear length. */
  earLength?: number;

  /** Ear breadth. */
  earBreadth?: number;

  /** Hand, palm and thumb lengths. */
  handLength?: number;

  /** Hand breadth, and the hand circumference with it. */
  handBreadth?: number;

  /** Foot length. */
  footLength?: number;

  /** Foot breadth. */
  footBreadth?: number;

  /** Lateral malleolus height. */
  ankleHeight?: number;
}

/** Normal deviate of the 1st and 99th percentiles. */
const Z99: number = 2.326;

/**
 * Lengths at the 99th (+1) or 1st (-1) percentile: each factor is 1 plus or
 * minus 2.326 coefficients of variation of the adult women's measurement in
 * the 3D Facial Norms database (Weinberg 2016, ages 20 to 40) and ANSUR II
 * (Gordon 2014), the sex of the person it scales. Ears follow the head length.
 */
function LONG(sign: 1 | -1): IPart {
  const at = (cv: number): number => 1 + sign * Z99 * cv;
  return {
    headLength: at(6.3 / 187.3),
    faceHeight: at(6.1 / 118.6),
    fissure: at(2.0 / 27.8),
    noseHeight: at(3.9 / 54.7),
    noseProtrusion: at(1.9 / 20.2),
    vermilion: at(1.4 / 7.4),
    earLength: at(6.3 / 187.3),
    handLength: at(10.1 / 181.1),
    footLength: at(12.4 / 246.3),
    ankleHeight: at(5.1 / 62.7),
  };
}

/** Breadths at the 99th (+1) or 1st (-1) percentile, by the same sources. */
function BROAD(sign: 1 | -1): IPart {
  const at = (cv: number): number => 1 + sign * Z99 * cv;
  return {
    headBreadth: at(5.3 / 145.8),
    faceWidth: at(5.4 / 129.8),
    mandibularWidth: at(7.0 / 97.0),
    minimumFrontalWidth: at(8.0 / 105.5),
    intercanthalWidth: at(2.8 / 31.3),
    noseWidth: at(2.3 / 32.6),
    mouthWidth: at(3.5 / 48.1),
    earBreadth: at(5.4 / 129.8),
    handBreadth: at(3.8 / 78.2),
    footBreadth: at(4.8 / 92.7),
  };
}

/**
 * Men's over women's means: the 3D Facial Norms database for the face and
 * head, Cho 2025 for the ears, and ANSUR II for hands, feet and the lateral
 * malleolus height.
 */
const MALE: IPart = {
  headLength: 198.3 / 187.3,
  headBreadth: 152.3 / 145.8,
  faceHeight: 127.2 / 118.6,
  faceWidth: 137.6 / 129.8,
  mandibularWidth: 104.5 / 97.0,
  minimumFrontalWidth: 111.4 / 105.5,
  intercanthalWidth: 32.7 / 31.3,
  fissure: 28.8 / 27.8,
  noseWidth: 36.1 / 32.6,
  noseHeight: 56.6 / 54.7,
  noseProtrusion: 21.0 / 20.2,
  mouthWidth: 50.9 / 48.1,
  vermilion: 8.1 / 7.95,
  earLength: 66.95 / 64.5,
  earBreadth: 29.05 / 27.4,
  handLength: 193.3 / 181.1,
  handBreadth: 88.3 / 78.2,
  footLength: 271.2 / 246.3,
  footBreadth: 101.9 / 92.7,
  ankleHeight: 72.9 / 62.7,
};

/** Apply head, hand and foot factors to a person's inputs, keeping them consistent. */
function resize(out: IAutoMovieHumanParameters, part: IPart): void {
  const h = out.head;
  const L: number = h.length * (part.headLength ?? 1);
  const B: number = ((h.length * h.cephalicIndex) / 100) * (part.headBreadth ?? 1);
  // The circumference keeps its ratio to the perimeter of the ellipse of head
  // length and breadth (Ramanujan's approximation).
  const ellipse = (a: number, b: number): number =>
    Math.PI * (3 * (a + b) / 2 - Math.sqrt(((3 * a + b) / 2) * ((a + 3 * b) / 2)));
  h.circumference *= ellipse(L / 2, B / 2) / ellipse(h.length / 2, (h.length * h.cephalicIndex) / 200);
  const face: number = h.faceHeight * (part.faceHeight ?? 1);
  h.height += face - h.faceHeight;
  h.faceHeight = face;
  h.length = L;
  h.cephalicIndex = (100 * B) / L;
  h.faceWidth *= part.faceWidth ?? 1;
  h.mandibularWidth *= part.mandibularWidth ?? 1;
  h.minimumFrontalWidth *= part.minimumFrontalWidth ?? 1;
  h.face.intercanthalWidth *= part.intercanthalWidth ?? 1;
  for (const eye of [h.face.eyePair.left, h.face.eyePair.right])
    eye.palpebralFissureLength *= part.fissure ?? 1;
  h.face.nose.width *= part.noseWidth ?? 1;
  h.face.nose.height *= part.noseHeight ?? 1;
  h.face.nose.protrusion *= part.noseProtrusion ?? 1;
  h.face.mouth.width *= part.mouthWidth ?? 1;
  h.face.mouth.upperVermilionHeight *= part.vermilion ?? 1;
  h.face.mouth.lowerVermilionHeight *= part.vermilion ?? 1;
  for (const ear of [h.earPair.left, h.earPair.right]) {
    ear.length *= part.earLength ?? 1;
    ear.breadth *= part.earBreadth ?? 1;
  }
  const hands = out.extremities?.hands;
  if (hands !== undefined)
    for (const hand of [hands.left, hands.right]) {
      hand.handLength *= part.handLength ?? 1;
      hand.palmLength *= part.handLength ?? 1;
      hand.thumbLength *= part.handLength ?? 1;
      hand.handBreadth *= part.handBreadth ?? 1;
    }
  const circumference = out.body.controls.handCircumference;
  if (circumference.value !== null) circumference.value *= part.handBreadth ?? 1;
  const feet = out.extremities?.feet;
  if (feet !== undefined)
    for (const foot of [feet.left, feet.right]) {
      foot.footLength *= part.footLength ?? 1;
      foot.footBreadth *= part.footBreadth ?? 1;
      foot.ankleHeight *= part.ankleHeight ?? 1;
    }
}

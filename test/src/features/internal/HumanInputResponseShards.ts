import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanAnatomyCourse } from "./HumanAnatomyCourse";
import { HumanAnatomyShared } from "./HumanAnatomyShared";
import { HumanInputResponse } from "./HumanInputResponse";
import type { HumanInputResponseReadings } from "./HumanInputResponseReadings";
import { HumanInputResponseSupplement } from "./HumanInputResponseSupplement";

type IParams = IAutoMovieHumanParameters;
type IPerturbation = HumanInputResponse.IPerturbation;
const { LARGE, SMALL, HEAD, HAND, FOOT } = HumanAnatomyShared;
const E: typeof HumanAnatomyCourse.ERROR = HumanAnatomyCourse.ERROR;
const { control, siteless } = HumanInputResponse;

/**
 * Every public input of each region, as the perturbations the input response
 * runs. A known change is three times its reading's allowable error, so a
 * reading that does not move misses it by twice that error, and the change
 * stays within about one population SD of the input.
 */
export namespace HumanInputResponseShards {
  /** One region's perturbations and the reading groups read on each. */
  export interface IShard {
    /** Reading groups: the region's own and its neighbours', whose inputs are held. */
    groups: HumanInputResponseReadings.Group[];

    /** Every public input of the region, each moved alone. */
    perturbations: IPerturbation[];
  }

  /**
   * Each region's inputs. Paired inputs move on the left only, so the right
   * side's reading is held. The shape coordinates have no declared range (the
   * public type declares none) and no unit; each moves by 0.3, about a third
   * of f1's own distance from zero in masculineFeminine (0.945) and fat
   * (-0.650), enough to change any construction that reads it. The inseam
   * moves 30 mm, three times the crotch height's 10 mm allowable error;
   * stature 18 mm, three times its 6.
   */
  export const SHARDS: Record<"trunk" | "limbs" | "head" | "face" | "extremities" | "shape" | "negative", IShard> = {
    trunk: {
      groups: ["stature", "trunk", "course", "arm"],
      perturbations: [
        control("chest", 3 * LARGE, { chest: 3 * LARGE }),
        control("underbust", 3 * LARGE, { underbust: 3 * LARGE }),
        control("waist", 3 * LARGE, { waist: 3 * LARGE }),
        control("highHip", 3 * LARGE, { highHip: 3 * LARGE }),
        control("hip", 3 * LARGE, { hip: 3 * LARGE }),
        control("neck", 3 * SMALL, { neck: 3 * SMALL }),
        control("neckBase", 3 * SMALL, { neckBase: 3 * SMALL }),
        control("bustSpan", 3 * E.bustPointWidth, { bustSpan: 3 * E.bustPointWidth }),
        control("acrossShoulder", 3 * E.acrossShoulder, { acrossShoulder: 3 * E.acrossShoulder }),
        siteless("frontInterscyeLength", 30, "ISO 8559-1 5.4.7's armpit front fold points are set by a rule pressed under the arm, a contact the skin alone does not fix (test_human_anatomy_course)"),
        control("neckToWaist", 3 * E.backNeckToWaist, { neckToWaist: 3 * E.backNeckToWaist }),
        control("shoulderToApex", 3 * E.sideNeckToBust, { "shoulderToApex left": 3 * E.sideNeckToBust, "shoulderToApex right": 3 * E.sideNeckToBust }),
        siteless("neckLength", 15, "neither ISO 8559-1 nor ANSUR II defines a neck length, and the type names no endpoints"),
      ],
    },
    limbs: {
      groups: ["stature", "trunk", "course", "arm", "leg"],
      perturbations: [
        control("upperArmLength", 3 * E.acromionRadiale, { "upperArmLength left": 3 * E.acromionRadiale, "upperArmLength right": 3 * E.acromionRadiale }),
        control("lowerArmLength", 3 * E.radialeStylion, { "lowerArmLength left": 3 * E.radialeStylion, "lowerArmLength right": 3 * E.radialeStylion }),
        control("bicep", 3 * SMALL, { "bicep left": 3 * SMALL, "bicep right": 3 * SMALL }),
        control("elbow", 3 * SMALL, { "elbow left": 3 * SMALL, "elbow right": 3 * SMALL }),
        control("forearm", 3 * SMALL, { "forearm left": 3 * SMALL, "forearm right": 3 * SMALL }),
        control("wrist", 3 * SMALL, { "wrist left": 3 * SMALL, "wrist right": 3 * SMALL }),
        control("inseam", 30, { inseam: 30 }),
        control("thigh", 3 * LARGE, { "thigh left": 3 * LARGE, "thigh right": 3 * LARGE }),
        control("knee", 3 * SMALL, { "knee left": 3 * SMALL, "knee right": 3 * SMALL }),
        control("calf", 3 * SMALL, { "calf left": 3 * SMALL, "calf right": 3 * SMALL }),
      ],
    },
    head: {
      groups: ["head", "trunk"],
      perturbations: [
        {
          input: "head.length",
          edit: (q: IParams): void => {
            q.head.length += 3 * HEAD;
          },

          // Breadth is length times the cephalic index over 100, which is held.
          expect: { "head length": 3 * HEAD, "head breadth": (3 * HEAD * baseHead().cephalicIndex) / 100 },
        },
        {
          input: "head.cephalicIndex",

          // Index = 100 breadth / length, so a breadth change of 3 HEAD at the
          // held length is an index change of 100 (3 HEAD) / length.
          edit: (q: IParams): void => {
            q.head.cephalicIndex += (100 * 3 * HEAD) / q.head.length;
          },
          expect: { "head breadth": 3 * HEAD },
        },
        head("circumference", 3 * SMALL, "head circumference"),
        head("height", 3 * HEAD, "head height"),
        head("faceHeight", 3 * HEAD, "face height"),
        head("faceWidth", 3 * HEAD, "face width"),
        head("mandibularWidth", 3 * HEAD, "mandibular width"),
        {
          input: "head.minimumFrontalWidth",
          edit: (q: IParams): void => {
            q.head.minimumFrontalWidth += 3 * HEAD;
          },
          expect: {},
          reason: "the temporal crests that bound ft-ft lie under the skin, not on it (test_human_anatomy_head)",
        },
        {
          input: "head.mouthOpening",
          edit: (q: IParams): void => {
            q.head.mouthOpening += 5;
          },
          expect: {},
          reason: "the largest incisal opening limits the jaw's pose; the lips are closed at rest",
          rest: false,
        },
        {
          input: "head.mandibularLaterotrusion",
          edit: (q: IParams): void => {
            q.head.mandibularLaterotrusion += 2;
          },
          expect: {},
          reason: "the largest lateral excursion limits the jaw's pose; the jaw is centred at rest",
          rest: false,
        },
      ],
    },
    face: {
      groups: ["head"],
      perturbations: [
        face("intercanthalWidth", (q: IParams): void => void (q.head.face.intercanthalWidth += 3 * HEAD), { "intercanthal width": 3 * HEAD }),
        face("eyePair.left.palpebralFissureLength", (q: IParams): void => void (q.head.face.eyePair.left.palpebralFissureLength += 3 * HEAD), { "fissure length left": 3 * HEAD }),
        face("eyePair.left.palpebralFissureHeight", (q: IParams): void => void (q.head.face.eyePair.left.palpebralFissureHeight += 3 * HEAD), { "fissure height left": 3 * HEAD }),
        face("nose.width", (q: IParams): void => void (q.head.face.nose.width += 3 * HEAD), { "nose width": 3 * HEAD }),
        face("nose.height", (q: IParams): void => void (q.head.face.nose.height += 3 * HEAD), { "nose height": 3 * HEAD }),
        face("nose.protrusion", (q: IParams): void => void (q.head.face.nose.protrusion += 3 * HEAD), { "nose protrusion": 3 * HEAD }),
        face("mouth.width", (q: IParams): void => void (q.head.face.mouth.width += 3 * HEAD), { "mouth width": 3 * HEAD }),
        face("mouth.upperVermilionHeight", (q: IParams): void => void (q.head.face.mouth.upperVermilionHeight += 3 * HEAD), { "upper vermilion": 3 * HEAD }),
        face("mouth.lowerVermilionHeight", (q: IParams): void => void (q.head.face.mouth.lowerVermilionHeight += 3 * HEAD), { "lower vermilion": 3 * HEAD }),
        ear("length"),
        ear("breadth"),
        ear("protrusion"),
      ],
    },
    extremities: {
      groups: ["hand", "foot", "arm"],
      perturbations: [
        hand("handLength", "hand length"),
        hand("handBreadth", "hand breadth"),
        hand("palmLength", "palm length"),
        hand("thumbLength", "thumb length"),
        control("handCircumference", 3 * SMALL, { "handCircumference left": 3 * SMALL, "handCircumference right": 3 * SMALL }),
        foot("footLength", "foot length"),
        foot("footBreadth", "foot breadth"),
        {
          input: "extremities.feet.left.ankleHeight",
          edit: (q: IParams): void => {
            q.extremities!.feet!.left.ankleHeight += 3 * FOOT;
          },
          expect: {},
          reason: "the lateral malleolus shows no prominence of its own on two of the four references (test_human_anatomy_foot)",
        },
      ],
    },
    shape: {
      groups: ["stature", "trunk", "course", "arm", "leg", "head"],
      perturbations: [
        control("height", 18, { stature: 18 }),
        siteless("fat", 0.3, "a unitless coordinate of the reference source's authoring model, not body fat; the tapes it would move are held"),
        siteless("masculineFeminine", -0.3, "a unitless coordinate that selects no sex table; the tapes it would move are held"),
        siteless("muscularity", 0.3, "a unitless coordinate, not a lean-mass index; the tapes it would move are held"),
        {
          input: "supplement",
          edit: (q: IParams): void => {
            q.supplement = structuredClone(HumanInputResponseSupplement);
          },
          expect: {},
          reason: "a record of further measured dimensions, each of its own site; a figure that reads none of them is unchanged",
        },
        {
          input: "body.measurements",

          // Every observation set 3 percent above its control (100 where the
          // control is unknown), so any reading of them changes the figure.
          edit: (q: IParams): void => {
            const m: Record<string, number | null> = q.body.measurements as unknown as Record<string, number | null>;
            const c: Record<string, { value: number | null }> = q.body.controls as unknown as Record<string, { value: number | null }>;
            for (const key of Object.keys(m)) m[key] = (c[key]?.value ?? 100) * 1.03;
          },
          expect: {},
          reason: "independent observations of the person, each 3 percent above its control here; the type says they are never inferred from targets",
        },
        {
          input: "body.diagnostics",
          edit: (q: IParams): void => {
            q.body.diagnostics.rise = 800;
            q.body.diagnostics.shoulderHeight = 1400;
          },
          expect: {},
          reason: "read-only floor-relative heights; a figure that reads them is changed",
        },
      ],
    },

    // IR-21: the girth tapes moved the other way by the same three errors, so
    // an honoured input answers a decrease as it answers an increase; a
    // construction that clamps, saturates or only grows with an input fails
    // here while passing its positive shard.
    negative: {
      groups: ["stature", "trunk", "arm", "leg"],
      perturbations: [
        control("chest", -3 * LARGE, { chest: -3 * LARGE }),
        control("waist", -3 * LARGE, { waist: -3 * LARGE }),
        control("hip", -3 * LARGE, { hip: -3 * LARGE }),
        control("neck", -3 * SMALL, { neck: -3 * SMALL }),
        control("bicep", -3 * SMALL, { "bicep left": -3 * SMALL, "bicep right": -3 * SMALL }),
        control("wrist", -3 * SMALL, { "wrist left": -3 * SMALL, "wrist right": -3 * SMALL }),
        control("knee", -3 * SMALL, { "knee left": -3 * SMALL, "knee right": -3 * SMALL }),
        control("calf", -3 * SMALL, { "calf left": -3 * SMALL, "calf right": -3 * SMALL }),
      ],
    },
  };
}

/** The base person's head inputs. */
function baseHead(): IParams["head"] {
  return HumanAnatomyAudit.subject(HumanInputResponse.BASE).params.head;
}

/** A head input moved by a known amount, mm. */
function head(name: "circumference" | "height" | "faceHeight" | "faceWidth" | "mandibularWidth", delta: number, reading: string): IPerturbation {
  return {
    input: `head.${name}`,
    edit: (q: IParams): void => {
      q.head[name] += delta;
    },
    expect: { [reading]: delta },
  };
}

/** A face input moved by a known amount, at a path below `head.face`. */
function face(path: string, edit: (q: IParams) => void, expect: Record<string, number>): IPerturbation {
  return { input: `head.face.${path}`, edit, expect };
}

/** The left ear's input moved by three head errors. */
function ear(name: "length" | "breadth" | "protrusion"): IPerturbation {
  return {
    input: `head.earPair.left.${name}`,
    edit: (q: IParams): void => {
      q.head.earPair.left[name] += 3 * HEAD;
    },
    expect: { [`ear ${name} left`]: 3 * HEAD },
  };
}

/** The left hand's input moved by three hand errors. */
function hand(name: "handLength" | "handBreadth" | "palmLength" | "thumbLength", reading: string): IPerturbation {
  return {
    input: `extremities.hands.left.${name}`,
    edit: (q: IParams): void => {
      q.extremities!.hands!.left[name] += 3 * HAND;
    },
    expect: { [`${reading} left`]: 3 * HAND },
  };
}

/** The left foot's input moved by three foot errors. */
function foot(name: "footLength" | "footBreadth", reading: string): IPerturbation {
  return {
    input: `extremities.feet.left.${name}`,
    edit: (q: IParams): void => {
      q.extremities!.feet!.left[name] += 3 * FOOT;
    },
    expect: { [`${reading} left`]: 3 * FOOT },
  };
}

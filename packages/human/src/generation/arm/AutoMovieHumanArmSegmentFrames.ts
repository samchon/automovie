import type { AutoMovieHumanArmConstruction } from "../AutoMovieHumanArmConstruction";
import { AutoMovieHumanArmBones } from "./AutoMovieHumanArmBones";
import { AutoMovieHumanArmCurveSpec } from "./AutoMovieHumanArmCurveSpec";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;
type ITransform = AutoMovieHumanArmCurveSpec.ITransform;
type IFrame = AutoMovieHumanArmCurveSpec.ISegmentFrame;

/**
 * L0 of the arm experiment: the humerus, forearm, hand (third metacarpal),
 * metacarpal and phalanx frames, each a rigid transform relative to its
 * parent, with the joint centres they are built on.
 *
 * Axes follow ISB (Wu et al. 2005, J Biomech 38:981-992, opened pp. 984-990):
 * humerus 2.3.4 option 1 (origin GH, Y from the EL/EM midpoint to GH, X normal
 * to the EL-EM-GH plane forward, Z right), forearm 2.3.6 (origin US, Y from US
 * to the EL/EM midpoint, X normal to the US-RS-midpoint plane forward, Z
 * right), metacarpals and phalanges 4.3.4/4.3.5 (origin midway between base
 * and head, Y from the head centre to the base midpoint, X volar in the bone's
 * mirror plane, Z right). ISB 4.3 writes a left hand with Y distal and X
 * dorsal; that frame is the one used here turned 180 degrees about Z, so this
 * slice keeps X forward/volar, Y proximal and Z to the subject's right on
 * every bone of both sides, and only the medial sign of Z changes (+Z medial
 * on the left). Elbow flexion turns the forearm about the humerus Z through
 * the elbow centre (ISB 3.4.1 e1); wrist flexion turns the hand about the
 * forearm Z through the wrist centre (ISB 4.4.1 e1).
 *
 * Joint centres from public lengths (de Leva 1996, J Biomech 29:1223-1230,
 * Table 2, repo note `docs/sources/de-leva-1996.md`): GH lies 0.1044 AR below
 * the acromion, the elbow centre 0.0432 AR proximal of radiale, the wrist
 * centre 1.5 mm distal of stylion (`AutoMovieHumanArmBones`). The elbow centre
 * is the EL/EM midpoint, so the ISB humerus Y passes through it by
 * definition. The wrist centre stays on the humerus line at zero flexion: the
 * carrying angle (ISB 3.4.1 beta, "a passive response ... rarely reported")
 * is an input gap, so no lateral lean is authored.
 *
 * Bony breadths: humerus biepicondylar and bistyloid breadths by Heinz et al.
 * 2003 (J Stat Educ 11(2), repo note `heinz-2003-body-dimensions.md`, per-sex
 * OLS on the forearm and wrist girths of the same 507 adults). The person's own
 * caliper breadths are input gaps (ISAK humerus and wrist breadth).
 *
 * Hand: palm length (stylion to digit III base crease) and hand length
 * (stylion to dactylion III) place the MCP III head centre with Buryanov and
 * Kotiuk 2010 (Int J Morphol 28(3), Tables I and III, repo note): the web of
 * digit III stands 15.33 % of the external finger length (web to tip) beyond
 * the MCP joint, and the base crease is taken at the web (declared). Every
 * metacarpal and phalanx length is Buryanov Table I scaled by the person's
 * digit III MCP-to-tip length over Buryanov's (92.31 mm). Metacarpal heads II
 * to V divide the hand breadth into four equal intervals and the metacarpals
 * stand parallel from a common carpometacarpal line (declared conventions; the
 * head spacing, divergence and CMC line are input gaps). The thumb follows
 * the neutral-zero method (DGUV F 4030, repo note): metacarpal adducted beside
 * the second in both planes, its volar face turned toward the palm (Gray 1918:
 * the first metacarpal's palmar surface faces medially).
 */
export namespace AutoMovieHumanArmSegmentFrames {
  /** Public inputs and joint rotations. */
  export interface IInput {
    /** Side; selects the medial sign of Z. */
    side: "left" | "right";

    /** Public arm and hand dimensions, calibration mm. */
    arms: AutoMovieHumanArmConstruction.IInputs;

    /** Elbow and wrist flexion, radians, about the proximal segment's Z (zero is the anatomical position, palm forward). */
    pose: { elbow: number; wrist: number };
  }

  /** The frames, joint centres and dimensions, every point in the humerus frame unless named otherwise. */
  export interface IOutput {
    /** Humerus frame (root; receives the thorax-to-humerus transform). */
    humerus: IFrame;

    /** Forearm frame, parent humerus. */
    forearm: IFrame;

    /** Hand frame: the third metacarpal's ISB frame, parent forearm. */
    hand: IFrame;

    /** Metacarpal frames 1 to 5 (index 0 is the thumb's), parent hand. */
    metacarpals: IFrame[];

    /** Phalanx frames per digit 1 to 5, proximal first (thumb two, fingers three), each parented on the bone before it. */
    phalanges: IFrame[][];

    /** +1 when medial is +Z (left arm), -1 when medial is -Z. */
    medial: 1 | -1;

    /** Joint centres and bony landmarks, humerus frame, calibration mm. */
    points: IPoints;

    /** Lengths, calibration mm. */
    lengths: ILengths;

    /** Bony breadths, calibration mm: humerus biepicondylar, bistyloid, hand breadth. */
    breadths: { elbow: number; wrist: number; hand: number };

    /** Compose a named frame into the frame above the humerus. */
    chain(name: string, root: ITransform): ITransform;
  }

  /** Joint centres and bony landmarks, humerus frame. */
  export interface IPoints {
    /** Acromion projected on the humerus axis. */
    acromion: Vec3;

    /** Glenohumeral centre (origin). */
    gh: Vec3;

    /** Elbow centre, the EL/EM midpoint. */
    elbow: Vec3;

    /** Lateral and medial epicondyles. */
    epicondyles: { lateral: Vec3; medial: Vec3 };

    /** Wrist centre. */
    wrist: Vec3;

    /** Radial (stylion) and ulnar styloids. */
    styloids: { radial: Vec3; ulnar: Vec3 };

    /** Metacarpal bases and head centres, digits 1 to 5. */
    metacarpals: { base: Vec3; head: Vec3 }[];

    /** Each digit's joint centres after its MCP head (thumb: IP; fingers: PIP, DIP) and its skin apex. */
    digits: Vec3[][];

    /** The digit III web, where the palm's distal pole stands. */
    web: Vec3;
  }

  /** Lengths, calibration mm. */
  export interface ILengths {
    /** Acromion to GH along the humerus. */
    acromion: number;

    /** GH to the elbow centre. */
    humerus: number;

    /** Elbow centre to the wrist centre. */
    forearm: number;

    /** Wrist centre to the MCP III head centre. */
    palm: number;

    /** MCP III head centre to the web of digit III. */
    web: number;

    /** Metacarpals 1 to 5. */
    metacarpals: number[];

    /** Phalanges per digit, proximal first; the last includes the tip soft tissue. */
    phalanges: number[][];
  }

  /** Build the frames from public inputs and the pose only. */
  export function create(input: IInput): IOutput {
    const medial: 1 | -1 = input.side === "left" ? 1 : -1;
    const arms: AutoMovieHumanArmConstruction.IInputs = input.arms;
    const hand: AutoMovieHumanArmConstruction.IHand = input.side === "left" ? arms.left : arms.right;
    const female: boolean = arms.sex > 0;

    // Longitudinal joint centres along the adducted segment axes (de Leva).
    const ar: number = arms.upper;
    const acromion: number = AutoMovieHumanArmBones.ACROMION * ar;
    const humerus: number = ar - acromion - AutoMovieHumanArmBones.RADIALE * ar;
    const forearm: number = AutoMovieHumanArmBones.RADIALE * ar + arms.lower + AutoMovieHumanArmBones.STYLION_WRIST;

    // Heinz 2003 per-sex OLS, per-side breadth in mm on the girth in mm.
    const elbowBreadth: number = female ? 23.05 + 0.1633 * arms.forearm : 29.23 + 0.1525 * arms.forearm;
    const wristBreadth: number = female ? 5.41 + 0.2919 * arms.wrist : 18.2 + 0.2213 * arms.wrist;

    // Buryanov scale: the person's digit III MCP-to-tip over Buryanov's.
    const external: number = hand.length - hand.palm;
    const web: number = WEB_III * external;
    const scale: number = (external + web) / BURYANOV_III;
    const metacarpals: number[] = BURYANOV.map((row: readonly number[]): number => row[0]! * scale);
    const phalanges: number[][] = BURYANOV.map((row: readonly number[]): number[] => {
      const bones: number[] = row.slice(1, -1).map((x: number): number => x * scale);
      bones[bones.length - 1] = bones[bones.length - 1]! + row[row.length - 1]! * scale;
      return bones;
    });
    const palm: number = hand.palm - AutoMovieHumanArmBones.STYLION_WRIST - web;

    // Humerus frame points; the forearm and hand turn rigidly with their joints.
    const ez: Vec3 = [0, 0, 1];
    const elbow: Vec3 = [0, -humerus, 0];
    const turnElbow: (p: Vec3) => Vec3 = (p: Vec3): Vec3 => add(elbow, rotate(ez, input.pose.elbow, p));
    const wrist: Vec3 = turnElbow([0, -forearm, 0]);
    const stylionLevel: number = -forearm + AutoMovieHumanArmBones.STYLION_WRIST;
    const ulnar: Vec3 = turnElbow([0, stylionLevel, (medial * wristBreadth) / 2]);
    const radial: Vec3 = turnElbow([0, stylionLevel, (-medial * wristBreadth) / 2]);

    // ISB forearm frame from US, RS and the EL/EM midpoint.
    const fy: Vec3 = unit(sub(elbow, ulnar));
    const forward: Vec3 = rotate(ez, input.pose.elbow, [1, 0, 0]);
    const normal: Vec3 = unit(cross(sub(radial, ulnar), sub(elbow, ulnar)));
    const fx: Vec3 = dot(normal, forward) >= 0 ? normal : scale3(normal, -1);
    const forearmAbs: ITransform = { origin: ulnar, axes: [fx, fy, cross(fx, fy)] };

    // Hand long axes: the forearm's long axis turned by wrist flexion about the forearm Z.
    const long: [Vec3, Vec3, Vec3] = [forward, rotate(ez, input.pose.elbow, [0, 1, 0]), ez];
    const handAxes: [Vec3, Vec3, Vec3] = long.map((a: Vec3): Vec3 => rotate(forearmAbs.axes[2], input.pose.wrist, a)) as [Vec3, Vec3, Vec3];
    const [, hy, hz]: [Vec3, Vec3, Vec3] = handAxes;
    const at: (o: Vec3, along: number, across: number) => Vec3 = (o: Vec3, along: number, across: number): Vec3 =>
      add(o, add(scale3(hy, along), scale3(hz, across)));

    // Metacarpals: heads II-V at quarter intervals of the hand breadth, bases
    // on the line through MC3's base. The thumb's carpometacarpal joint (the
    // trapezium) stands at the carpus' radial border, taken at half the
    // bistyloid breadth radial of the MC3 line on that base line; its head
    // lies beside the second metacarpal, one head spacing radial of MC2
    // (neutral zero: the thumb adducted beside the index ray; declared
    // convention, the CMC position and the thumb ray's angle are input gaps).
    const spacing: number = hand.breadth / 4;
    const head3: Vec3 = at(wrist, -palm, 0);
    const base3: Vec3 = at(head3, metacarpals[2]!, 0);
    // f1's thumb CMC (the trapezium) stands volar of the metacarpal bases' plane, under the thenar mass: 8 mm toward the palm (the owner's f1 authoring; a declared convention).
    const thumbBase: Vec3 = add(at(base3, 0, (-medial * wristBreadth) / 2), scale3(handAxes[0], THUMB_CMC_VOLAR));
    const thumbRay: Vec3 = unit(sub(at(base3, -metacarpals[0]!, -medial * spacing * 2), thumbBase));
    const bones: { base: Vec3; head: Vec3 }[] = [1, 2, 3, 4, 5].map((k: number): { base: Vec3; head: Vec3 } => {
      if (k === 1) return { base: thumbBase, head: add(thumbBase, scale3(thumbRay, metacarpals[0]!)) };
      const base: Vec3 = at(base3, 0, medial * spacing * (k - 3));
      // The knuckles on an arc: each head stands KNUCKLE_ARC[k] mm proximal of MC3's head along the hand axis, at its quarter-breadth interval.
      return { base, head: at(head3, KNUCKLE_ARC[k - 2]!, medial * spacing * (k - 3)) };
    });

    // Digit joint centres straight along each metacarpal's axis (the thumb along its ray).
    const digits: Vec3[][] = phalanges.map((lengths: number[], k: number): Vec3[] => {
      const out: Vec3[] = [];
      let p: Vec3 = bones[k]!.head;
      for (const l of lengths) {
        p = k === 0 ? add(p, scale3(thumbRay, l)) : at(p, -l, 0);
        out.push(p);
      }
      return out;
    });

    // Absolute frames in the humerus frame. The thumb's Y runs head to base
    // along its ray, its X (volar) faces the palm (Gray 1918: the first
    // metacarpal's palmar surface faces medially).
    const hand3: ITransform = { origin: mid(bones[2]!.base, bones[2]!.head), axes: handAxes };
    const thumbY: Vec3 = scale3(thumbRay, -1);
    const thumbX: Vec3 = unit(sub(scale3(hz, medial), scale3(thumbY, dot(scale3(hz, medial), thumbY))));
    const thumbAxes: [Vec3, Vec3, Vec3] = [thumbX, thumbY, cross(thumbX, thumbY)];
    const boneFrame: (a: Vec3, b: Vec3, axes: [Vec3, Vec3, Vec3]) => ITransform = (a: Vec3, b: Vec3, axes: [Vec3, Vec3, Vec3]): ITransform => ({ origin: mid(a, b), axes });
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const relative: (parent: ITransform, child: ITransform) => ITransform = (parent: ITransform, child: ITransform): ITransform =>
      S.compose(S.inverse(parent), child);

    const humerusFrame: IFrame = {
      name: `humerus.${input.side}`,
      parent: null,
      basis: { kind: "published", citation: "Wu et al. 2005, J Biomech 38:981-992, 2.3.4 option 1", detail: "Origin GH; Y from the EL/EM midpoint to GH; X normal to the EL-EM-GH plane, forward; Z right." },
      relative: S.IDENTITY,
    };
    const forearmFrame: IFrame = {
      name: `forearm.${input.side}`,
      parent: humerusFrame.name,
      basis: { kind: "published", citation: "Wu et al. 2005, 2.3.6 and 3.4.1", detail: "Origin US; Y from US to the EL/EM midpoint; X normal to the US-RS-midpoint plane, forward; Z right. Elbow flexion about the humerus Z (e1)." },
      relative: forearmAbs,
    };
    const handFrame: IFrame = {
      name: `hand.${input.side}`,
      parent: forearmFrame.name,
      basis: { kind: "published", citation: "Wu et al. 2005, 4.3.4 (third metacarpal) and 4.4.1", detail: "Origin midway between MC3 base and head; Y head to base; X volar; Z right; wrist flexion about the forearm Z (e1)." },
      relative: relative(forearmAbs, hand3),
    };
    const absolute: Map<string, ITransform> = new Map([
      [humerusFrame.name, S.IDENTITY],
      [forearmFrame.name, forearmAbs],
      [handFrame.name, hand3],
    ]);
    const metacarpalFrames: IFrame[] = bones.map((b: { base: Vec3; head: Vec3 }, k: number): IFrame => {
      const frame: ITransform = boneFrame(b.base, b.head, k === 0 ? thumbAxes : handAxes);
      const name: string = `metacarpal.${k + 1}.${input.side}`;
      absolute.set(name, frame);
      return {
        name,
        parent: handFrame.name,
        basis: { kind: "published", citation: "Wu et al. 2005, 4.3.4; Buryanov and Kotiuk 2010 Table I", detail: k === 0 ? "Thumb metacarpal at neutral zero, volar face toward the palm (Gray 1918)." : "Head on the knuckle line at a quarter of the hand breadth per interval; parallel to MC3." },
        relative: relative(hand3, frame),
      };
    });
    const phalanxFrames: IFrame[][] = digits.map((joints: Vec3[], k: number): IFrame[] => {
      const axes: [Vec3, Vec3, Vec3] = k === 0 ? thumbAxes : handAxes;
      let parent: string = metacarpalFrames[k]!.name;
      let proximal: Vec3 = bones[k]!.head;
      return joints.map((distal: Vec3, j: number): IFrame => {
        const frame: ITransform = boneFrame(proximal, distal, axes);
        const name: string = `phalanx.${k + 1}.${j + 1}.${input.side}`;
        const parentFrame: ITransform = absolute.get(parent)!;
        absolute.set(name, frame);
        const out: IFrame = {
          name,
          parent,
          basis: { kind: "published", citation: "Wu et al. 2005, 4.3.5; Buryanov and Kotiuk 2010 Table I", detail: "Straight digit at the anatomical position; the distal phalanx carries the tip soft tissue." },
          relative: relative(parentFrame, frame),
        };
        parent = name;
        proximal = distal;
        return out;
      });
    });
    const frames: Map<string, IFrame> = new Map(
      [humerusFrame, forearmFrame, handFrame, ...metacarpalFrames, ...phalanxFrames.flat()].map((f: IFrame): [string, IFrame] => [f.name, f]),
    );

    return {
      humerus: humerusFrame,
      forearm: forearmFrame,
      hand: handFrame,
      metacarpals: metacarpalFrames,
      phalanges: phalanxFrames,
      medial,
      points: {
        acromion: [0, acromion, 0],
        gh: [0, 0, 0],
        elbow,
        epicondyles: { lateral: [0, -humerus, (-medial * elbowBreadth) / 2], medial: [0, -humerus, (medial * elbowBreadth) / 2] },
        wrist,
        styloids: { radial, ulnar },
        metacarpals: bones,
        digits,
        web: at(head3, -web, 0),
      },
      lengths: { acromion, humerus, forearm, palm, web, metacarpals, phalanges },
      breadths: { elbow: elbowBreadth, wrist: wristBreadth, hand: hand.breadth },
      chain(name: string, root: ITransform): ITransform {
        const frame: IFrame | undefined = frames.get(name);
        if (frame === undefined) throw new Error(`Unknown arm frame ${name}`);
        const parent: ITransform = frame.parent === null ? root : this.chain(frame.parent, root);
        return S.compose(parent, frame.relative);
      },
    };
  }

  /**
   * Buryanov and Kotiuk 2010 Table I, mm (means; interarticular lengths, the
   * tip soft tissue last): per digit I to V, metacarpal then phalanges
   * proximal to distal, then the tip soft tissue.
   */
  export const BURYANOV: readonly (readonly number[])[] = [
    [46.22, 31.57, 21.67, 5.67],
    [68.12, 39.78, 22.38, 15.82, 3.84],
    [64.6, 44.63, 26.33, 17.4, 3.95],
    [58.0, 41.37, 25.65, 17.3, 3.95],
    [53.69, 32.74, 18.11, 15.96, 3.73],
  ];

  /** Digit III MCP-to-tip in Buryanov Table I: proximal + middle + distal + tip soft tissue, mm. */
  export const BURYANOV_III: number = 44.63 + 26.33 + 17.4 + 3.95;

  /** Buryanov Table III: the web of digit III above its MCP joint, share of the web-to-tip length. */
  export const WEB_III: number = 0.1533;

  /**
   * f1's knuckle arc: how far each metacarpal head II to V stands proximal of
   * MC3's along the hand axis, mm. The middle knuckle is the most distal and
   * the little one the most proximal, so the knuckles lie on an arc (authored
   * for f1; the follow-up algorithmization relates it to the hand breadth).
   */
  export const KNUCKLE_ARC: readonly number[] = [3, 0, 3.5, 9];

  /** f1's thumb CMC, volar of the metacarpal bases' plane, mm (authored for f1). */
  export const THUMB_CMC_VOLAR: number = 8;}

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale3(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function mid(a: Vec3, b: Vec3): Vec3 {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function unit(a: Vec3): Vec3 {
  const n: number = Math.hypot(a[0], a[1], a[2]);
  if (!(n > 0)) throw new Error("Zero direction in an arm frame");
  return [a[0] / n, a[1] / n, a[2] / n];
}

/** Rodrigues rotation of `v` about the unit `axis` by `angle` radians. */
function rotate(axis: Vec3, angle: number, v: Vec3): Vec3 {
  const c: number = Math.cos(angle);
  const s: number = Math.sin(angle);
  const k: Vec3 = unit(axis);
  return add(add(scale3(v, c), scale3(cross(k, v), s)), scale3(k, dot(k, v) * (1 - c)));
}

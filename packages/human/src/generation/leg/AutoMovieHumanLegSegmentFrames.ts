import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;
type ITransform = AutoMovieHumanArmCurveSpec.ITransform;
type IFrame = AutoMovieHumanArmCurveSpec.ISegmentFrame;

/**
 * L0 of the leg view-curve construction: the femur, tibia/fibula and
 * calcaneus (foot) frames of one leg, each a rigid transform relative to its
 * parent, with the joint centres and bony landmarks they are built on.
 *
 * Axes follow ISB Part I (Wu et al. 2002, J Biomech 35:543-548, opened here,
 * pp. 544-546): femur 4.4 (origin the hip centre; y from the midpoint of the
 * femoral epicondyles FE to the origin, cranial; z normal to y in the plane of
 * the origin and both FE, to the right; x anterior); tibia/fibula 3.3 (origin
 * IM midway between the malleoli MM and LM; Z along MM-LM to the right; X
 * normal to the torsional plane of IC, MM and LM, anterior; Y their common
 * normal, cranial); calcaneus 3.4 (origin at IM in the neutral
 * configuration; y along the tibia/fibula's long axis IC-IM, cranial; x
 * normal to the tibia/fibula's frontal plane of IM, MC and LC, anterior; z
 * their common normal). The tibia/fibula Z follows MM-LM and so leans with
 * the medial malleolus' greater height, while the calcaneus axes stay with
 * the long axis: ISB defines the two differently. Every frame here keeps X
 * forward, Y up and Z to the subject's right on both sides; only the medial
 * sign of Z changes (+Z medial on the left), as in the arm frames.
 *
 * Knee flexion turns the tibia about the femur Z through the knee centre
 * (ISB knee e1, Grood and Suntay 1983, cited by ISB 2002 p. 543), positive
 * flexion moving the shank backward; ankle dorsiflexion turns the calcaneus
 * about the tibia Z through IM (ISB 3.5 e1, alpha positive dorsiflexion).
 *
 * Heights over the standing surface, calibration mm (ANSUR II OLS on stature
 * per sex, repo note `docs/sources/ansur-ii.md`; de Leva 1996 Table 2 offsets,
 * `de-leva-1996.md`):
 * - hip centre: owned by the trunk's pelvis port
 *   (`AutoMovieHumanTrunkJointDatums.hips[side]`, trochanterion by the ANSUR
 *   II line plus de Leva's 2.8 / 3.2 mm, lateral place by Hara 2016); the
 *   femur root receives that port's world transform and this file reads only
 *   its height over the standing surface (`IInput.hip`, the port's world
 *   origin Y, whose world origin stands on the floor);
 * - knee centre = tibiale height + 29.4 (F) / 33.5 (M) mm (the thigh row),
 *   tibiale = -103.6 + 0.3325 S (F) / -119.1 + 0.3344 S (M). The knee centre
 *   is the FE midpoint: the transepicondylar line approximates the knee's
 *   flexion axis, and ANSUR II's lateral femoral epicondyle height fraction
 *   (0.286 F / 0.280 M) agrees with this sum within 2 mm on the means;
 * - IC (tibial condyle border midpoint) at the tibiale height (ANSUR II
 *   tibiale: the superior palpable point of the medial tibial condyle);
 * - LM at the person's lateral malleolus height (the `ankleHeight` input);
 *   MM higher by the medial-over-lateral ratio (debt: Gray 1918 states only
 *   that the medial malleolus stands higher; the 1.1 is the foot prior's
 *   convention, `AutoMovieHumanFootPrior.malleoli`).
 *
 * Breadths: FE apart by the person's femur biepicondylar breadth (ISAK femur
 * breadth, the `kneeBreadth` input) and the malleoli by the bimalleolar
 * breadth (ANSUR, the `bimalleolarBreadth` input). Input gaps, declared: the
 * hip-knee-ankle angle is zero (Neutral-0 extended knee, DGUV F 4030, the
 * mechanical axes collinear in both planes); tibial torsion is zero (MM-LM
 * parallel to the FE line); the medial and lateral malleoli stand at one
 * antero-posterior place.
 */
export namespace AutoMovieHumanLegSegmentFrames {
  /** Public inputs and joint rotations, calibration mm. */
  export interface IInput {
    /** Side; selects the medial sign of Z. */
    side: "left" | "right";

    /** Stature. */
    stature: number;

    /** Hip centre height over the standing surface: the trunk's hip port world origin Y. */
    hip: number;

    /** Sex control; positive selects the women's survey rows. */
    sex: number;

    /** Lateral malleolus height (the foot's `ankleHeight`). */
    ankleHeight: number;

    /** Femur biepicondylar breadth (ISAK femur breadth). */
    kneeBreadth: number;

    /** Bimalleolar breadth (ANSUR). */
    bimalleolarBreadth: number;

    /** Knee flexion and ankle dorsiflexion, radians (zero is the anatomical position). */
    pose: { knee: number; ankle: number };

    /**
     * Authored joint centres in the femur frame at neutral: present, the knee
     * centre (the epicondyles' midpoint) and IM (the malleoli's midpoint)
     * stand there instead of on the femur's long axis at the height laws'
     * levels (f1: her own joint centres in her stance, the ones her lines were
     * re-based by, `AutoMovieHumanLegF1World.LANDMARKS`).
     */
    joints?: { knee: Vec3; im: Vec3 };
  }

  /** The frames, joint centres and dimensions; points in the femur frame. */
  export interface IOutput {
    /** Femur frame (root; receives the pelvis-to-femur transform). */
    femur: IFrame;

    /** Tibia/fibula frame, parent femur. */
    tibia: IFrame;

    /** Calcaneus (foot) frame, parent tibia. */
    foot: IFrame;

    /** +1 when medial is +Z (left leg), -1 when medial is -Z. */
    medial: 1 | -1;

    /** Joint centres and bony landmarks, femur frame. */
    points: IPoints;

    /** Heights over the standing surface at neutral, calibration mm. */
    heights: { hip: number; knee: number; tibiale: number; lateralMalleolus: number; medialMalleolus: number; im: number };

    /** Lengths, calibration mm. */
    lengths: { femur: number; tibia: number; icToKnee: number };

    /**
     * The neutral walk of a level: the distance from the hip centre along the
     * neutral bone axes (the femur's hip centre to knee centre, then the
     * shank's knee centre to IM) to the axis point standing at `height` over
     * the floor. It is the walk the re-based lines are measured in
     * (`AutoMovieHumanLegF1Rebase`: each knot's `at` runs along her own
     * hip-knee and knee-IM lines from the segment's zero), so the knee centre
     * stands at the femur's length and IM at the femur's plus the shank's.
     * With the joints on one vertical (no authored joints) it is the drop
     * below the hip centre.
     */
    walk(height: number): number;

    /** Compose a named frame into the frame above the femur. */
    chain(name: string, root: ITransform): ITransform;
  }

  /** Joint centres and bony landmarks, femur frame. */
  export interface IPoints {
    /** Hip centre (origin). */
    hip: Vec3;

    /** Knee centre, the FE midpoint. */
    knee: Vec3;

    /** Femoral epicondyles. */
    epicondyles: { lateral: Vec3; medial: Vec3 };

    /** Inter-condylar point IC of the tibia. */
    ic: Vec3;

    /** Inter-malleolar point IM, the ankle centre. */
    im: Vec3;

    /** Malleolus tips. */
    malleoli: { lateral: Vec3; medial: Vec3 };
  }

  /** Medial over lateral malleolus height (debt, foot prior convention). */
  export const MEDIAL_MALLEOLUS: number = 1.1;

  /** Build the frames from public inputs and the pose only. */
  export function create(input: IInput): IOutput {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const medial: 1 | -1 = input.side === "left" ? 1 : -1;
    const female: boolean = input.sex > 0;
    const s: number = input.stature;

    // Heights: the hip from the trunk's port; the knee by ANSUR II OLS on stature and de Leva 1996 Table 2.
    const tibiale: number = female ? -103.6 + 0.3325 * s : -119.1 + 0.3344 * s;
    const hipY: number = input.hip;
    const kneeY: number = tibiale + (female ? 29.4 : 33.5);
    const lateralY: number = input.ankleHeight;
    const medialY: number = MEDIAL_MALLEOLUS * lateralY;
    const imY: number = (lateralY + medialY) / 2;
    if (!(hipY > kneeY && kneeY > tibiale && tibiale > imY && imY > 0))
      throw new Error("The hip, knee, tibial condyles and ankle must stand one above the other");

    // Femur frame points (Neutral-0: the mechanical axes are one line), or the authored joint centres: the shank then runs from the knee centre to IM, IC on it at the condyles' drop, the malleoli across it.
    const icDrop: number = kneeY - tibiale;
    const ez: Vec3 = [0, 0, 1];
    const knee: Vec3 = input.joints?.knee ?? [0, -(hipY - kneeY), 0];
    const femurLength: number = Math.hypot(knee[0], knee[1], knee[2]);
    const shankRel: Vec3 = input.joints === undefined ? [0, -(kneeY - imY), 0] : sub(input.joints.im, knee);
    const down: Vec3 = S.unit(shankRel);
    const across: Vec3 = S.unit(sub(ez, scale(down, S.dot(ez, down))));
    const tibiaLength: number = Math.hypot(shankRel[0], shankRel[1], shankRel[2]) - icDrop;
    const turnKnee: (p: Vec3) => Vec3 = (p: Vec3): Vec3 => add(knee, rotate(ez, -input.pose.knee, p));
    const ic: Vec3 = turnKnee(scale(down, icDrop));
    const im: Vec3 = turnKnee(shankRel);
    const mmLevel: number = (medialY - imY);
    const mm: Vec3 = turnKnee(add(add(shankRel, scale(down, -mmLevel)), scale(across, (medial * input.bimalleolarBreadth) / 2)));
    const lm: Vec3 = turnKnee(add(add(shankRel, scale(down, mmLevel)), scale(across, (-medial * input.bimalleolarBreadth) / 2)));

    // ISB tibia/fibula frame from IM, MM, LM and IC.
    const zRight: Vec3 = S.unit(medial > 0 ? sub(mm, lm) : sub(lm, mm));
    const forward: Vec3 = rotate(ez, -input.pose.knee, [1, 0, 0]);
    const torsional: Vec3 = S.unit(S.cross(sub(lm, ic), sub(mm, ic)));
    const tx: Vec3 = S.dot(torsional, forward) >= 0 ? torsional : scale(torsional, -1);
    const tz: Vec3 = S.unit(sub(zRight, scale(tx, S.dot(zRight, tx))));
    const tibiaAbs: ITransform = { origin: im, axes: [tx, S.cross(tz, tx), tz] };

    // Calcaneus (ISB 3.4): y along the tibia's long axis IM-IC, x normal to
    // the tibia's frontal plane (IM, MC, LC; the condyles stand across Z at
    // IC, so that plane holds the long axis and the knee's Z), z their common
    // normal; then dorsiflexion about the tibia Z through IM (e1).
    const cy: Vec3 = S.unit(sub(ic, im));
    const cx: Vec3 = S.unit(S.cross(cy, rotate(ez, -input.pose.knee, [0, 0, 1])));
    const neutralFoot: [Vec3, Vec3, Vec3] = [cx, cy, S.cross(cx, cy)];
    const footAbs: ITransform = {
      origin: im,
      axes: neutralFoot.map((a: Vec3): Vec3 => rotate(tibiaAbs.axes[2], input.pose.ankle, a)) as [Vec3, Vec3, Vec3],
    };
    const relative: (parent: ITransform, child: ITransform) => ITransform = (parent: ITransform, child: ITransform): ITransform => S.compose(S.inverse(parent), child);

    // Heights of the joint centres over the floor: the authored joints' own (the femur frame keeps the pelvis axes at neutral, so its Y is the world vertical and its origin stands hipY over the floor), else the laws'. IC stands icDrop down the shank from the knee centre, so its height is the knee's less that drop's vertical part (the tibiale law's own height on a vertical shank).
    const kneeHeight: number = input.joints === undefined ? kneeY : hipY + knee[1];
    const imHeight: number = input.joints === undefined ? imY : hipY + input.joints.im[1];
    const icHeight: number = kneeHeight + down[1] * icDrop;
    // The neutral bone axes the walk runs along: the femur's from the hip centre (the origin) to the knee centre, the shank's from the knee centre to IM (`down`, before any knee turn).
    const femurDown: Vec3 = S.unit(knee);
    const walk: (height: number) => number = (height: number): number => (height >= kneeHeight ? (height - hipY) / femurDown[1] : femurLength + (height - kneeHeight) / down[1]);

    const femurFrame: IFrame = {
      name: `femur.${input.side}`,
      parent: null,
      basis: { kind: "published", citation: "Wu et al. 2002, J Biomech 35:543-548, 4.4", detail: "Origin the hip centre; y from the FE midpoint to the origin, cranial; z normal to y in the origin-FE plane, right; x anterior." },
      relative: S.IDENTITY,
    };
    const tibiaFrame: IFrame = {
      name: `tibia.${input.side}`,
      parent: femurFrame.name,
      basis: { kind: "published", citation: "Wu et al. 2002, 3.3", detail: "Origin IM; Z along MM-LM, right; X normal to the IC-MM-LM torsional plane, anterior; Y cranial. Knee flexion about the femur z through the knee centre." },
      relative: relative(S.IDENTITY, tibiaAbs),
    };
    const footFrame: IFrame = {
      name: `foot.${input.side}`,
      parent: tibiaFrame.name,
      basis: { kind: "published", citation: "Wu et al. 2002, 3.4 and 3.5", detail: "Calcaneus frame: origin IM, axes coincident with the tibia/fibula's at neutral; dorsiflexion about the tibia Z (e1)." },
      relative: relative(tibiaAbs, footAbs),
    };
    const frames: Map<string, IFrame> = new Map([femurFrame, tibiaFrame, footFrame].map((f: IFrame): [string, IFrame] => [f.name, f]));
    const breadth: number = input.kneeBreadth / 2;
    return {
      femur: femurFrame,
      tibia: tibiaFrame,
      foot: footFrame,
      medial,
      points: {
        hip: [0, 0, 0],
        knee,
        epicondyles: { lateral: [knee[0], knee[1], knee[2] - medial * breadth], medial: [knee[0], knee[1], knee[2] + medial * breadth] },
        ic,
        im,
        malleoli: { lateral: lm, medial: mm },
      },
      heights: { hip: hipY, knee: kneeHeight, tibiale: icHeight, lateralMalleolus: lateralY, medialMalleolus: medialY, im: imHeight },
      lengths: { femur: femurLength, tibia: tibiaLength, icToKnee: icDrop },
      walk,
      chain(name: string, root: ITransform): ITransform {
        const frame: IFrame | undefined = frames.get(name);
        if (frame === undefined) throw new Error(`Unknown leg frame ${name}`);
        const parent: ITransform = frame.parent === null ? root : this.chain(frame.parent, root);
        return S.compose(parent, frame.relative);
      },
    };
  }
}

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

/** Rodrigues rotation of `v` about the unit `axis` by `angle` radians. */
function rotate(axis: Vec3, angle: number, v: Vec3): Vec3 {
  const c: number = Math.cos(angle);
  const s: number = Math.sin(angle);
  const k: Vec3 = AutoMovieHumanArmCurveSpec.unit(axis);
  return add(add(scale(v, c), scale(AutoMovieHumanArmCurveSpec.cross(k, v), s)), scale(k, AutoMovieHumanArmCurveSpec.dot(k, v) * (1 - c)));
}

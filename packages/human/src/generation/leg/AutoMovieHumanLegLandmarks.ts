import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanFootToeRoots } from "../foot/AutoMovieHumanFootToeRoots";
import type { AutoMovieHumanLegSegmentFrames } from "./AutoMovieHumanLegSegmentFrames";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * L1 of the leg view-curve construction: the published leg and foot
 * landmarks and measurement levels of one leg, each in its own segment frame,
 * with its station on the neutral leg walk. The walk runs from the hip
 * centre's level (walk zero) down the straight Neutral-0 mechanical axis
 * through the knee centre to IM, then along the foot course from IM to the
 * toe-web pole; its station is the arclength of that polyline, calibration mm.
 * A `point` landmark is a bony or skin point; a `level` landmark is a plane
 * normal to its segment axis, written as its point on the axis.
 *
 * Sources: ANSUR II (`docs/sources/ansur-ii.md`: midpatella height fraction,
 * ball-of-foot length, the thigh tape at the gluteal furrow, the lower thigh
 * tape at suprapatella, the ankle tape at its minimum); ANSUR 1988 (29) calf
 * height, the level of the maximum calf circumference (summary report
 * TR-89/027 p. 28, opened here); ISO 8559-1 5.3.22 knee girth at
 * mid-patella; ISB 2002 for MM, LM, IM, IC and FE; the toe roots of
 * `AutoMovieHumanFootToeRoots` (Maestro's metatarsal cascade for the heads,
 * the breadth's ends about the long axis through the second toe, the toes'
 * web stations by Gray 1918, the web-fold caps that set the closing pole);
 * Williams and McClay 2000 (`williams-mcclay-2000-arch-height.md`) for the
 * dorsum height at half the foot length.
 *
 * Debts and input gaps, each named in {@link IOutput.gaps}: the calf height
 * and the ankle minimum's level are not public inputs; the heel-to-IM length
 * and the pole's height are the foot prior's reference medians; the
 * suprapatella level stands half a patella length over mid-patella with an
 * unsourced patella length.
 */
export namespace AutoMovieHumanLegLandmarks {
  /** One landmark. */
  export interface ILandmark {
    /** Landmark name, such as `gluteal furrow`. */
    name: string;

    /** `point`: a bony or skin point; `level`: a plane normal to the segment axis, given by its axis point. */
    kind: "point" | "level";

    /** Segment frame the point is written in. */
    frame: string;

    /** Coordinates in that frame, calibration mm. */
    point: Vec3;

    /** Station on the neutral leg walk from the hip centre's level, calibration mm. */
    walk: number;

    /** Published definition the landmark satisfies. */
    definition: string;

    /** Basis of the placement. */
    source: AutoMovieHumanArmCurveSpec.ISource;
  }

  /** A landmark or quantity whose published definition needs an input the person does not supply. */
  export interface IGap {
    /** Landmark or quantity. */
    name: string;

    /** Its published definition. */
    definition: string;

    /** The input proposed to close the gap. */
    proposed: string;

    /** What stands in for it meanwhile. */
    interim: string;
  }

  /** The leg's published inputs, calibration mm. */
  export interface IInputs {
    /** Stature. */
    stature: number;

    /** Sex control; positive selects the women's rows. */
    sex: number;

    /** Crotch height (inseam plus lateral malleolus height). */
    crotch: number;

    /** Gluteal furrow height (ANSUR 1988). */
    furrow: number;

    /** Foot length, heel to the longest toe (ISO 8559-1 5.5.5). */
    footLength: number;

    /** Foot breadth across the metatarsal heads. */
    footBreadth: number;

    /** Ball-of-foot length, heel to the first metatarsal head (ANSUR II). */
    ballLength: number;

    /** The person's mid-patella height (ISO 8559-1 5.3.22's level); absent, ANSUR II's relation on stature. */
    midpatella?: number;

    /** The person's calf height (ANSUR 1988 (29)); absent, the fibular relation {@link CALF}. */
    calf?: number;

    /**
     * The host's loop plane the thigh starts on, femur frame: a point of the
     * plane, its normal and the loop's reach (its largest distance from that
     * point, mm), read live from S00's half loop (`AutoMovieHumanLegBuild.body`).
     * Absent, the crotch level's horizontal plane with no reach.
     */
    port?: { point: Vec3; normal: Vec3; reach: number };
  }

  /** The landmarks, the course and the gaps. */
  export interface IOutput {
    /** Every landmark, proximal to distal. */
    list: ILandmark[];

    /** Neutral walk stations of the course: the port (crotch level), the knee centre, IM, the ball and the toe-web pole. */
    course: { port: number; knee: number; im: number; ball: number; web: number };

    /** Course points in the femur frame: the port centre, the ball centre and the toe-web pole. */
    points: { port: Vec3; ball: Vec3; web: Vec3 };

    /** The femur's lead-in turn: the course leaves the port along the host loop's normal and turns at this centre (on the femur axis, femur frame) into the femur axis; its neutral walk and the inner half extent its turn length was sized by, mm. */
    bend: { walk: number; point: Vec3; inner: number };

    /** Foot points in the foot frame: the heel back line at the floor, first and fifth metatarsal heads, longest toe tip at the floor, the floor height. */
    foot: { heel: Vec3; first: Vec3; fifth: Vec3; tip: Vec3; floor: number };

    /** The toes' roots and web stations in the foot frame, hallux first. */
    roots: AutoMovieHumanFootToeRoots.IRoot[];

    /** Input gaps and debts. */
    gaps: IGap[];
  }

  /** ANSUR II midpatella height over stature, women and men. */
  export const MIDPATELLA: { female: number; male: number } = { female: 0.276, male: 0.278 };

  /** Debt: half the patella's proximo-distal length, mm (no source opened; a typical adult patella is about 45 mm long). */
  export const PATELLA_HALF: number = 22;

  /**
   * Debt: the heel-to-IM length over foot length, the foot prior's reference
   * median of the ankle centre's place (`AutoMovieHumanFootPrior.ankle`,
   * 0.211), awaiting a published heel-to-malleolus length.
   */
  export const HEEL_TO_IM: number = 0.211;

  /** Debt: the web pole's height over the floor as a share of the foot breadth: half the second toe's depth in the foot prior (0.177 breadths times 0.95, halved). */
  export const WEB_HEIGHT: number = (0.177 * 0.95) / 2;

  /**
   * The maximum calf circumference's level as a share of the fibula's length
   * measured down from the lower margin of the fibular head: 22.4 % (SD 2.5,
   * 95 % CI 21.9-23.0) in 81 adults, 40 men and 41 women (Shimura, Kubo and
   * Nishida 2016, Bulletin of the International University of Health and
   * Welfare 22(1):8-12; read at abstract level, the full text being
   * unreachable). Morikami and Nishida 2013 (Rigakuryoho Kagaku 28(1):21-26,
   * doi 10.1589/rika.28.21, 50 Japanese adults, abstract) report 26 % from the
   * fibular head, a population difference the authors name. The fibular
   * head's lower margin and the fibula's distal end are read at the tibiale
   * level and the lateral malleolus tip (input gap: fibular head height; Gray
   * 1918 places the head slightly above the tibial tuberosity). This places
   * the ANSUR 1988 (29) calf height, which is not a public input.
   */
  export const CALF: number = 0.224;

  /** Input gap interim: the ankle minimum's level over the floor in lateral malleolus heights (no source). */
  export const ANKLE_MINIMUM: number = 2;

  /** Build the landmarks from the frames and the public inputs. */
  export function create(frames: AutoMovieHumanLegSegmentFrames.IOutput, inputs: IInputs): IOutput {
    const H: AutoMovieHumanLegSegmentFrames.IOutput["heights"] = frames.heights;
    const P: AutoMovieHumanLegSegmentFrames.IPoints = frames.points;
    const F: string = frames.femur.name;
    const T: string = frames.tibia.name;
    const Ft: string = frames.foot.name;
    const female: boolean = inputs.sex > 0;
    const toTibia: (p: Vec3) => Vec3 = (p: Vec3): Vec3 => inverseApply(frames.tibia.relative, p);

    // Neutral walk stations along the bone axes from the hip centre (the femur's to the knee centre, then the shank's to IM): the walk the re-based lines are measured in (`AutoMovieHumanLegSegmentFrames.IOutput.walk`; the drop below the hip centre when the joints stand on one vertical).
    const drop: (height: number) => number = frames.walk;
    // The femur axis from the hip centre to the knee centre (the knee centre does not move with the knee turn), and the posed shank axis from the knee centre to IM: a level's point stands on its segment's axis at its walk.
    const femurDown: Vec3 = AutoMovieHumanArmCurveSpec.unit(P.knee);
    const shankDown: Vec3 = AutoMovieHumanArmCurveSpec.unit(sub(P.im, P.knee));
    const onShank: (walk: number) => Vec3 = (walk: number): Vec3 => add(P.knee, [shankDown[0] * (walk - drop(H.knee)), shankDown[1] * (walk - drop(H.knee)), shankDown[2] * (walk - drop(H.knee))]);
    // The person's own levels when given (f1's are read on her reference by their definitions, with receipts); else the sourced relations.
    const midpatella: number = inputs.midpatella ?? (female ? MIDPATELLA.female : MIDPATELLA.male) * inputs.stature;
    const kneeWalk: number = drop(H.knee);
    const imWalk: number = drop(H.im);
    const calfWalk: number = drop(inputs.calf ?? H.tibiale - CALF * (H.tibiale - H.lateralMalleolus));
    const ankleMinimumWalk: number = drop(ANKLE_MINIMUM * H.lateralMalleolus);

    // The port: the thigh's first section lies in the host loop's own plane (S00's half loop read live, whatever its tilt), so the course leaves the port along that plane's normal n and turns into the femur axis at the bend. The bend stands on the femur axis at walk w, its depth below the plane along n L(w) = w (n . d) - (q . n) (d the femur axis, q the plane's point); the port is the bend less L n, the foot of its perpendicular on the plane. The turn of angle theta between n and d takes the half length h = 1.875 theta r / (2 * 0.8), r the loop's reach over cos(theta / 2) (AutoMovieHumanLegCourse's k r <= 0.8 rule), and must fit inside the stub: the bend stands at the gluteal furrow, or deeper when L would fall short of h plus 1 mm of straight run at the port.
    const plane: { point: Vec3; normal: Vec3; reach: number } = inputs.port ?? { point: [0, inputs.crotch - H.hip, 0], normal: [0, -1, 0], reach: 0 };
    const n0: Vec3 = AutoMovieHumanArmCurveSpec.unit(plane.normal);
    const n: Vec3 = AutoMovieHumanArmCurveSpec.dot(n0, femurDown) >= 0 ? n0 : [-n0[0], -n0[1], -n0[2]];
    const cosTurn: number = AutoMovieHumanArmCurveSpec.dot(n, femurDown);
    const turn: number = Math.acos(Math.max(-1, Math.min(1, cosTurn)));
    const turnHalf: number = (1.875 * turn * (plane.reach / Math.cos(turn / 2))) / (2 * 0.8);
    const qn: number = AutoMovieHumanArmCurveSpec.dot(plane.point, n);
    const bendWalk: number = Math.max(drop(inputs.furrow), (turnHalf + 1 + qn) / cosTurn);
    const stub: number = bendWalk * cosTurn - qn;
    const bendPoint: Vec3 = [femurDown[0] * bendWalk, femurDown[1] * bendWalk, femurDown[2] * bendWalk];
    const portPoint: Vec3 = [bendPoint[0] - n[0] * stub, bendPoint[1] - n[1] * stub, bendPoint[2] - n[2] * stub];

    // Foot points in the foot frame (origin IM, X anterior, Y up, Z right; zero yaw; the long axis through the second toe).
    const L: number = inputs.footLength;
    const floor: number = -H.im;
    const heelBack: number = -HEEL_TO_IM * L;
    const m: 1 | -1 = frames.medial;
    const rootInput: AutoMovieHumanFootToeRoots.IInput = { sex: inputs.sex, footLength: L, footBreadth: inputs.footBreadth, ballLength: inputs.ballLength, heel: heelBack, medial: m };
    const roots: AutoMovieHumanFootToeRoots.IRoot[] = AutoMovieHumanFootToeRoots.roots(rootInput);
    const edges: { medial: number; lateral: number } = AutoMovieHumanFootToeRoots.edges(rootInput);
    const fifthLag: number = roots[0]!.x - roots[4]!.x;
    const first: Vec3 = [roots[0]!.x, floor, edges.medial];
    const fifth: Vec3 = [roots[4]!.x, floor, edges.lateral];
    // The closing pole stands distal of the most distal web station (head +
    // half the proximal phalanx, Gray 1918) by the widest web-fold cap plus
    // the fold radius (half the nearest root gap plus FOLD, declared in
    // AutoMovieHumanFootToeRoots): every toe's footprint and fold then lie on
    // the forefoot's regular surface. Across, it stands on the long axis,
    // which passes through the second toe, so it closes inside that toe (on
    // the old midline between toes II and III f1's pole measured 10.54 mm
    // from toe II's axis against its 7.82 mm half-breadth, outside it).
    const beyond: number = AutoMovieHumanFootToeRoots.poleBeyond(roots);
    const web: Vec3 = [AutoMovieHumanFootToeRoots.pole(roots), floor + WEB_HEIGHT * inputs.footBreadth, roots[1]!.z];
    const course: Vec3 = sub(web, [0, 0, 0]);
    const courseLength: number = Math.hypot(...course);
    const t: Vec3 = [course[0] / courseLength, course[1] / courseLength, course[2] / courseLength];
    const ballX: number = (first[0] + fifth[0]) / 2;
    // The ball plane's station on the foot course: the projection of the heads' mean along it.
    const ballAlong: number = ballX * t[0];
    const ball: Vec3 = [t[0] * ballAlong, t[1] * ballAlong, t[2] * ballAlong];

    // Femur-frame course points through the posed foot frame.
    const foot: AutoMovieHumanArmCurveSpec.ITransform = frames.chain(Ft, AutoMovieHumanArmCurveSpec.IDENTITY);
    const footToFemur: (p: Vec3) => Vec3 = (p: Vec3): Vec3 => AutoMovieHumanArmCurveSpec.apply(foot, p);
    const list: ILandmark[] = [
      level("hip centre", F, 0, "Hip joint centre (ISB 2002 4.2.2), the femur origin; its level is the walk's zero.", { kind: "derived", rule: "trunk pelvis port (AutoMovieHumanTrunkJointDatums.hips)" }, femurDown),
      level("crotch", F, drop(inputs.crotch), "Crotch level: the lower edge of the pubis (ANSUR II); the leg's open port to the pelvis band stands here (pending f1_trunk's hip port band).", { kind: "input", field: "inseam + ankleHeight" }, femurDown),
      level("gluteal furrow", F, drop(inputs.furrow), "Thigh circumference site: at the gluteal furrow point, perpendicular to the thigh axis (ANSUR II), just below the gluteal fold (ISO 8559-1 5.3.20).", { kind: "input", field: "glutealFurrowHeight" }, femurDown),
      level("suprapatella", F, drop(midpatella + PATELLA_HALF), "Lower thigh circumference site: at suprapatella, the upper border of the patella (ANSUR II).", { kind: "debt", reason: `mid-patella plus ${PATELLA_HALF} mm, half an unsourced patella length` }, femurDown),
      { name: "FE lateral", kind: "point", frame: F, point: P.epicondyles.lateral, walk: kneeWalk, definition: "Lateral femoral epicondyle (ISB 2002 FE).", source: { kind: "input", field: "kneeBreadth / 2 lateral of the knee centre" } },
      { name: "FE medial", kind: "point", frame: F, point: P.epicondyles.medial, walk: kneeWalk, definition: "Medial femoral epicondyle (ISB 2002 FE).", source: { kind: "input", field: "kneeBreadth / 2 medial of the knee centre" } },
      level("knee centre", F, kneeWalk, "Knee centre, the FE midpoint: tibiale plus de Leva's offset (the femur's distal datum and the tibia's proximal datum).", { kind: "published", citation: "ANSUR II tibiale line; de Leva 1996 Table 2", detail: "tibiale + 29.4 (F) / 33.5 (M) mm" }, femurDown),
      level("midpatella", F, drop(midpatella), "Knee girth site: horizontal at the centre point of the kneecap (ISO 8559-1 5.3.22); ANSUR II midpatella height.", { kind: "published", citation: "ANSUR II midpatella height over stature", detail: `${female ? MIDPATELLA.female : MIDPATELLA.male} S` }, femurDown),
      { name: "IC", kind: "level", frame: T, point: toTibia(P.ic), walk: drop(H.tibiale), definition: "Inter-condylar point midway between the tibial condyles' borders (ISB 2002 3.2.2), at the tibiale height.", source: { kind: "published", citation: "ANSUR II tibiale line", detail: "-103.6 + 0.3325 S (F) / -119.1 + 0.3344 S (M)" } },
      { name: "calf maximum", kind: "level", frame: T, point: toTibia(onShank(calfWalk)), walk: calfWalk, definition: "Calf height: the level of the maximum circumference of the calf (ANSUR 1988 (29)); calf girth there (ISO 8559-1 5.3.24).", source: { kind: "published", citation: "Shimura, Kubo and Nishida 2016 (abstract); Morikami and Nishida 2013", detail: "22.4 % of the fibula below the fibular head (read at the tibiale level) toward the lateral malleolus tip; calf height itself is an input gap" } },
      { name: "ankle minimum", kind: "level", frame: T, point: toTibia(onShank(ankleMinimumWalk)), walk: ankleMinimumWalk, definition: "Ankle circumference site: the minimum horizontal girth of the leg above the malleoli (ANSUR II).", source: { kind: "debt", reason: `level not an input; ${ANKLE_MINIMUM} lateral malleolus heights over the floor` } },
      { name: "LM", kind: "point", frame: T, point: toTibia(P.malleoli.lateral), walk: imWalk, definition: "Tip of the lateral malleolus (ISB 2002 LM); its height is the ankleHeight input.", source: { kind: "input", field: "ankleHeight; bimalleolarBreadth / 2" } },
      { name: "MM", kind: "point", frame: T, point: toTibia(P.malleoli.medial), walk: imWalk, definition: "Tip of the medial malleolus (ISB 2002 MM), higher than LM (Gray 1918).", source: { kind: "debt", reason: "height ratio 1.1 of LM (foot prior convention)" } },
      { name: "IM", kind: "level", frame: T, point: [0, 0, 0], walk: imWalk, definition: "Inter-malleolar point (ISB 2002), the tibia and calcaneus origin and the ankle joint corner of the course; the heel-ankle girth stands on its bisection plane.", source: { kind: "published", citation: "Wu et al. 2002, 3.2.2", detail: "midway between MM and LM" } },
      { name: "heel", kind: "point", frame: Ft, point: [heelBack, floor, 0], walk: imWalk, definition: "Pternion, the posterior point of the heel (ANSUR 1988 landmarks), the start of foot length; written at the floor on its back line (its height is an input gap).", source: { kind: "debt", reason: `heel back ${HEEL_TO_IM} foot lengths behind IM (foot prior reference median)` } },
      { name: "metatarsal head I", kind: "point", frame: Ft, point: first, walk: imWalk + first[0] * t[0], definition: "First metatarsal head, the end of ball-of-foot length (ANSUR II), the medial skin end of the foot breadth.", source: { kind: "input", field: "ballOfFootLength from the heel; the foot breadth's medial end about the long axis through the second toe (AutoMovieHumanFootToeRoots.edges)" } },
      { name: "metatarsal head V", kind: "point", frame: Ft, point: fifth, walk: imWalk + fifth[0] * t[0], definition: "Fifth metatarsal head, the lateral skin end of the foot breadth; behind the first by Maestro's cascade.", source: { kind: "published", citation: "Maestro cascade (foot prior)", detail: `${fifthLag.toFixed(2)} mm behind head I` } },
      { name: "ball", kind: "level", frame: Ft, point: ball, walk: imWalk + ballAlong, definition: "Ball girth and foot breadth plane over the first and fifth metatarsal heads (ANSUR II, ISO 8559-1 5.5.6), normal to the foot course at the heads' mean station.", source: { kind: "derived", rule: "mean station of heads I and V on the foot course" } },
      { name: "dorsum", kind: "level", frame: Ft, point: [heelBack + 0.5 * L, 0, 0], walk: imWalk + (heelBack + 0.5 * L) * t[0], definition: "Dorsum height station: half the foot length (Williams and McClay 2000).", source: { kind: "published", citation: "Williams and McClay 2000, Table 2", detail: "dorsum height at 50 % foot length" } },
      { name: "toe tip", kind: "point", frame: Ft, point: [heelBack + L, floor + WEB_HEIGHT * inputs.footBreadth, 0], walk: imWalk + courseLength, definition: "Tip of the longest toe, the end of foot length (ISO 8559-1 5.5.5); reached by the toe digits, not the foot walk.", source: { kind: "input", field: "footLength" } },
      { name: "web", kind: "level", frame: Ft, point: web, walk: imWalk + courseLength, definition: "Toe-web pole: the foot walk's distal closure, distal of the most distal toe web station by the widest web-fold cap plus the fold radius, on the long axis through the second toe, inside that toe; the toes' folds meet the forefoot's regular surface proximal of it.", source: { kind: "derived", rule: `most distal web station (head + half the proximal phalanx, Gray 1918) plus ${beyond.toFixed(2)} mm: the widest cap (half the nearest toe-root gap) plus the ${AutoMovieHumanFootToeRoots.FOLD} mm fold (debt); height ${WEB_HEIGHT.toFixed(4)} breadths (foot prior reference median, debt)` } },
    ];
    const gaps: IGap[] = [
      { name: "calf height", definition: "ANSUR 1988 (29): vertical distance from the standing surface to the level of the maximum circumference of the right calf, heels together", proposed: "calfHeight as a public input, or the ANSUR 1988 calf height regression on stature", interim: "22.4 % of tibiale to the lateral malleolus tip below tibiale (Shimura et al. 2016; fibular head read at tibiale)" },
      { name: "ankle minimum level", definition: "ANSUR II ankle circumference: the minimum horizontal girth above the malleoli; its level is not reported", proposed: "the level of the minimum girth as an input", interim: `${ANKLE_MINIMUM} lateral malleolus heights` },
      { name: "suprapatella level", definition: "ISO 7250-1 5.17 / ANSUR II suprapatella, the upper border of the patella", proposed: "suprapatella height, or a published patella length", interim: `mid-patella + ${PATELLA_HALF} mm` },
      { name: "heel to IM", definition: "Heel-to-lateral-malleolus length along the Brannock axis (foot surveys)", proposed: "heel-to-malleolus length input or published ratio", interim: `${HEEL_TO_IM} foot lengths (reference median)` },
      { name: "toe-web height and toe breadths", definition: "The webs' height over the floor; each toe's breadth at its root", proposed: "published toe-web heights and toe breadths", interim: `${WEB_HEIGHT.toFixed(4)} breadths high (reference median); roots tiling the breadth by Patil 2017 shaft widths` },
      { name: "tibial torsion and foot yaw", definition: "Transmalleolar axis against the knee axis; foot axis against forward", proposed: "published adult tibial torsion and stance foot progression", interim: "zero" },
      { name: "thigh, knee, calf and ankle section boxes", definition: "Skin breadth and depth at each girth site", proposed: "thigh, knee, calf and ankle breadths and depths", interim: "circle of the tape (null law)" },
      { name: "ball height", definition: "Dorsal height over the metatarsal heads", proposed: "ball height input", interim: "the ball tape as an ellipse on the foot breadth (null law)" },
    ];
    return {
      list,
      // The port's walk is the bend's less the stub, so the station map keeps the stub's true length.
      course: { port: bendWalk - stub, knee: kneeWalk, im: imWalk, ball: imWalk + ballAlong, web: imWalk + courseLength },
      points: { port: portPoint, ball: footToFemur(ball), web: footToFemur(web) },
      bend: { walk: bendWalk, point: bendPoint, inner: plane.reach },
      foot: { heel: [heelBack, floor, 0], first, fifth, tip: [heelBack + L, floor, 0], floor },
      roots,
      gaps,
    };
  }

  /** The named landmark; throws on an unknown name. */
  export function get(output: IOutput, name: string): ILandmark {
    const found: ILandmark | undefined = output.list.find((l: ILandmark): boolean => l.name === name);
    if (found === undefined) throw new Error(`Unknown leg landmark ${name}`);
    return found;
  }

  /** A level on the femur: its point the femur axis' own at its walk, `down` the unit axis from the hip centre to the knee centre (the walk runs along it, `AutoMovieHumanLegSegmentFrames.IOutput.walk`). */
  function level(name: string, frame: string, walk: number, definition: string, source: AutoMovieHumanArmCurveSpec.ISource, down: Vec3): ILandmark {
    return { name, kind: "level", frame, point: [down[0] * walk, down[1] * walk, down[2] * walk], walk, definition, source };
  }
}

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** Child coordinates of a parent point under a rigid relative transform. */
function inverseApply(t: AutoMovieHumanArmCurveSpec.ITransform, p: Vec3): Vec3 {
  const d: Vec3 = [p[0] - t.origin[0], p[1] - t.origin[1], p[2] - t.origin[2]];
  return [0, 1, 2].map((k: number): number => t.axes[k]![0] * d[0] + t.axes[k]![1] * d[1] + t.axes[k]![2] * d[2]) as Vec3;
}

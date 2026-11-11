import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { AutoMovieLoftChain, type AutoMovieLoftFrame, AutoMovieLoftRelief, AutoMovieViewAxis, type AutoMovieViewLoft as L, AutoMovieViewChain as Q, type IAutoMovieLoftRelief } from "@automovie/engine";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import { FamilyConicFit as F } from "./FamilyConicFit";
import { FamilyConicLoft as K } from "./FamilyConicLoft";
import { FamilyConicRelief as H } from "./FamilyConicRelief";
import { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicSource as R } from "./FamilyConicSource";

/**
 * Whole-part conic families on the f1 reference: each part is cut along its
 * own jointed course, fitted on a sparse shared knot vector, stored as plain
 * numbers, regenerated from that stored text through the engine's view loft,
 * measured against the cuts and rendered beside the reference.
 */
namespace FamilyConicBody {
  /** Sampled position target of campaign 1, mm. */
  const TARGET_MM: number = 0.5;

  /** Least distance between two station knots, mm. */
  const GAP_MM: number = 12;

  /** Spacing of the fitting sections, mm; the withheld sections stand midway. */
  const STEP_MM: number = 4;

  /** The limb layouts of 4 and 8 conics; the 16 conic layout fitted worse from the same start on the arm and is left out until that is understood. */
  const LIMB: { layout: C.ILayout; depth: number }[] = [0, 1].map((depth: number): { layout: C.ILayout; depth: number } => ({ layout: C.limb(depth), depth }));

  /** Height of the armpit's crease, mm: `AutoMovieHumanF1Joints.armpit[1]`. */
  const ARMPIT_Y_MM: number = 1276;

  /**
   * Side distance of the armpit's crease from the median plane, mm: `AutoMovieHumanF1Joints.armpit[2]`. The armscye is the sagittal plane at
   * this distance, up to the shoulder's top: the trunk leaves out everything lateral of it inside the arm's tube, and the arm what lies medial.
   * Under an earlier division, a plane square to the upper arm through the crease, the trunk kept a stump of arm: the tape bridged from the
   * breast to the stump, which a relief either creased or turned into a flap, and a step ran across the back where the stump began.
   */
  const ARMPIT_MM: number = 151;

  /**
   * Where the arm's course starts and where it turns down the arm, mm: `AutoMovieHumanF1Joints.armRoot` and `armTurn`.
   *
   * The course leaves the trunk square to the armscye's sagittal plane, so the arm's first sections lie in planes beside that plane and the
   * trunk's port loop stands round a ring of the arm a few millimetres off it. It then turns round the shoulder to the elbow, its sections
   * fanning about the armpit as the leg's fan about the instep, so the shoulder's cap is lofted. The height is 35 mm above the armpit's
   * crease: the turn's tightest radius, 2 h / (1.875 angle) = 69 mm with h = 65 mm, must stay beyond the skin on the turn's inner side,
   * which is that crease at first and the inner arm, about 57 mm off the course, further on. The turn begins about 10 mm inside the plane;
   * its angle rises as the quintic smoothstep, so the section 5 mm past the plane is still within 3 degrees of it.
   *
   * With the course straight from the shoulder joint down the arm the first whole section was a slanted plane 40 mm below the joint. The
   * shoulder's cap above it belonged to no part: the port's band spanned up to 113 mm across it, and 20 of its 96 columns reached the arm's
   * ring against the arm's own direction under the armpit, where the band folded and slit.
   */
  const ARM_ROOT: R.V = [-12, 1300, 121];
  const ARM_TURN: R.V = [-12, 1300, 203];

  /** Half length of the shoulder's turn, mm. */
  const SHOULDER_HALF_MM: number = 65;

  /** Radius about the upper arm's axis inside which skin past the armscye plane is the arm's, mm; the hips, as far to the side, lie outside it. */
  const ARM_TUBE_MM: number = 75;

  /**
   * The ear's box, mm: lateral of the sagittal plane the auricle leaves the skull at, and inside the auricle's extent fore and aft and in height,
   * read off `FamilyConicScan.ts ear`. Positive inside the box on either side of the head.
   */
  function ear(p: R.V): number {
    return Math.min(Math.abs(p[2]) - 77, p[0] + 10, 26 - p[0], p[1] - 1538, 1602 - p[1]);
  }

  /**
   * The nose's box, mm: in front of the frontal plane the nose stands free of the lips and cheeks at, and inside its extent across and in
   * height, read off `FamilyConicScan.ts nose`. Positive inside the box.
   */
  function nose(p: R.V): number {
    return Math.min(p[0] - 122, 19 - Math.abs(p[2]), p[1] - 1540, 1582 - p[1]);
  }

  /** One part to fit. */
  interface IPart {
    /** Chain name. */
    name: string;

    /** Course centres, mm. */
    centres: R.V[];

    /** The same centres as the authored module writes them: an expression over `AutoMovieHumanF1Joints`, here abbreviated `J`. */
    course: string;

    /** Turn half lengths at the interior centres, mm. */
    halves: number[];

    /** Chart `u` seed. */
    up: R.V;

    /** Fitted station interval, mm of course arclength; `auto` takes the longest run of single loops round the course whose area stays near the part's own. */
    domain: [number, number] | "auto";

    /** Cut the body and head skins together instead of the body alone. */
    whole?: boolean;

    /** Spacing of the fitting sections, mm; absent, `STEP_MM`. */
    step?: number;

    /** Least distance between two station knots, mm; absent, `GAP_MM`. */
    gap?: number | ((s: number) => number);

    /** Cut the head skin alone. */
    head?: boolean;

    /** The part's loop need not wind round its course: of each plane's closed loops the clip leaves, the largest whose hull holds the course is taken, and the family is measured against that hull. */
    loose?: boolean;

    /**
     * With `loose`: the part runs on past where its branches part. From station `from` each section is the curve that surrounds every loop lying
     * wholly within `reach` of the course, mm, their common hull; before it the section is the loop round the course as for any part. It is the
     * surrounding curve of one-to-many branching (Gabrielides, Ginnis and Kaklis, Smooth branching surface construction from cross sections,
     * 2007): the single contour is skinned to it and each branch joins through it.
     */
    surround?: { from: number; reach: number };

    /**
     * Skin that belongs to a neighbouring part: a world point where this is positive is left out of every section, and the section is closed by
     * the straight chord between the two places its loop crosses zero. The family is free along that chord, which lies inside the neighbour's port.
     */
    clip?: (p: R.V) => number;

    /**
     * The part closes in a point past its last fitted section. With `true` the tip is the station where the reference's loop vanishes; a number
     * is a tip placed by anatomy instead, the level of the digit webs for a hand or a foot, whose loop runs on into one digit.
     */
    tip?: boolean | number;

    /** Station where the cap starts when the wall is not followed to its last fitted section, mm; absent, the domain's end. */
    cap?: number;

    /** Also emitted mirrored in the median plane `z = 0`. */
    mirrored: boolean;

    /** Limb layouts to try in order of median depth, each starting from the previous one's result. */
    layouts: { layout: C.ILayout; depth: number }[];

    /** Relief windows for what lies inside the tape wall, or `auto` to place one over every hollow deeper than the target. */
    reliefs: H.IWindow[] | "auto";
  }

  /** Run every part and write the receipt and the renders. */
  export async function main(): Promise<void> {
    const started: number = performance.now();
    const root: string = path.resolve(process.cwd(), "..");
    const out: string = path.join(root, "test/.shots/family-conic-body", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const log = (event: string, detail: object): void => void process.stdout.write(JSON.stringify({ event, ...detail, elapsedMs: Math.round(performance.now() - started) }) + "\n");
    const source: R.ISource = await R.load(root);
    const joint = (name: string): R.V => source.joints.get(name)!;
    const only: string[] = process.argv.slice(2).filter((argument: string): boolean => !argument.startsWith("--"));
    if (process.argv.includes("--emit-joints")) await fs.writeFile(path.join(root, "packages/human/src/generation/f1/AutoMovieHumanF1Joints.ts"), joints(source));
    // A digit's course runs through its joints and on past the last one by the length of its distal segment.
    const beyond = (a: R.V, b: R.V, length: number): R.V => {
      const d: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      return [b[0] + ((b[0] - a[0]) * length) / d, b[1] + ((b[1] - a[1]) * length) / d, b[2] + ((b[2] - a[2]) * length) / d];
    };
    const digit = (name: string, joints: string[], tip: number, up: R.V): IPart => {
      const centres: R.V[] = joints.map(joint);
      centres.push(beyond(centres.at(-2)!, centres.at(-1)!, tip));
      const keys: string[] = joints.map((j: string): string => "J." + j.replace("_0", "").replace("_r", ""));
      return { name, centres, course: "[" + [...keys, "J.beyond(" + keys.at(-2) + ", " + keys.at(-1) + ", " + tip + ")"].join(", ") + "]", halves: centres.slice(1, -1).map((): number => 5), up, domain: "auto", step: 2, gap: 6, tip: true, mirrored: true, layouts: LIMB, reliefs: [] };
    };

    // The arm's course past the elbow is the line it was first fitted on, from the shoulder joint straight down. Its stations there are the
    // earlier ones moved by `shift`, and `up` is turned about the first segment so the chart there is the earlier chart: the hand end of that
    // earlier fit, which every finger was sewn on, can then be spliced in unchanged (`--splice=<directory>@<station>+<shift>`).
    const armCentres: R.V[] = [ARM_ROOT, ARM_TURN, joint("lowerarm_r"), joint("hand_r"), joint("middle_01_r")];
    const armHalves: number[] = [SHOULDER_HALF_MM, 30, 10];
    const arm: { shift: number; up: R.V; plane: number; turned: number } = ((): { shift: number; up: R.V; plane: number; turned: number } => {
      const formerCentres: R.V[] = [joint("upperarm_r"), ...armCentres.slice(2)];
      const former: AutoMovieViewAxis.IRun[] = AutoMovieViewAxis.runs(formerCentres, [30, 10]) as AutoMovieViewAxis.IRun[];
      const next: AutoMovieViewAxis.IRun[] = AutoMovieViewAxis.runs(armCentres, armHalves) as AutoMovieViewAxis.IRun[];
      const shift: number = round(next[2]!.start - next[2]!.from - (former[1]!.start - former[1]!.from));
      const at: number = (former[1]!.start + former[1]!.end) / 2;
      const old: AutoMovieLoftFrame.IFrame = (AutoMovieViewAxis.jointed(formerCentres, [30, 10], [1, 0, 0]) as AutoMovieViewAxis.IAxis).at(at);
      const roll = (up: R.V): number => {
        const now: AutoMovieLoftFrame.IFrame = (AutoMovieViewAxis.jointed(armCentres, armHalves, up) as AutoMovieViewAxis.IAxis).at(at + shift);
        return Math.atan2(old.u[0] * now.v[0] + old.u[1] * now.v[1] + old.u[2] * now.v[2], old.u[0] * now.u[0] + old.u[1] * now.u[1] + old.u[2] * now.u[2]);
      };
      // The first segment runs along +Z, so turning `up` about it by an angle turns every later chart by the same angle about its tangent.
      const first: number = roll([1, 0, 0]);
      const candidates: R.V[] = [1, -1].map((sign: number): R.V => [round4(Math.cos(first)), round4(sign * Math.sin(first)), 0]);
      const up: R.V = Math.abs(roll(candidates[0]!)) < Math.abs(roll(candidates[1]!)) ? candidates[0]! : candidates[1]!;
      log("family-body-arm-course", { shift, up, rollBefore: first, rollAfter: roll(up), runs: next, formerRuns: former });
      return { shift, up, plane: ARMPIT_MM - ARM_ROOT[2], turned: next[1]!.start };
    })();
    const parts: IPart[] = (
      [
        ...["index", "middle", "ring", "pinky"].map((finger: string): IPart => digit("finger." + finger, [finger + "_01_r", finger + "_02_r", finger + "_03_r"], finger === "pinky" ? 22 : 26, [1, 0, 0])),
        digit("finger.thumb", ["thumb_01_r", "thumb_02_r", "thumb_03_r"], 30, [0, 1, 0]),
        ...["bigtoe", "indextoe", "middletoe", "ringtoe", "littletoe"].map((toe: string): IPart => digit("toe." + toe.replace("toe", ""), [toe + "_01_r", toe + "_02_r"], toe === "bigtoe" ? 28 : toe === "littletoe" ? 14 : 18, [0, 1, 0])),
        // The arm runs on through the wrist to the knuckles, so the wrist is no seam.
        // A course that leaves the wrist square to the row of knuckles, with the hand read on to the finger webs as the curve round all the
        // fingers (`surround`), was fitted to 588 numbers at a mean of 0.34 mm, but the engine refused it as a face: between its stations a
        // section's chain lost an arc. Until that is understood the hand keeps this course and closes at the webs.
        // It starts 2 mm past the armscye's plane and fans round the shoulder (`ARM_ROOT`); round that turn the cap's top sweeps about 2.5
        // times faster than the station, so its knots may stand 6 mm apart, as round the ankle.
        { name: "arm", centres: armCentres, course: "[J.armRoot, J.armTurn, J.lowerarm, J.hand, J.middle1]", halves: armHalves, up: arm.up, domain: [arm.plane + 2, round(570 + arm.shift)], gap: (s: number): number => (s < arm.turned ? 6 : GAP_MM), tip: round(600 + arm.shift), mirrored: true, layouts: LIMB, reliefs: "auto", clip: (p: R.V): number => {
          // The thumb past where it stands free of the palm is not the hand's: inside 16 mm of its course from 40 mm past its first joint.
          // Left in, the hand's wall and the thumb's lay within half a millimetre of each other for 10 mm, and a merge traces no such meeting.
          const a: R.V = joint("thumb_01_r");
          const b: R.V = joint("thumb_03_r");
          const length: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
          const along: number = ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1]) + (p[2] - a[2]) * (b[2] - a[2])) / length;
          const thumb: number = Math.min(along - 40, 16 - Math.hypot(p[0] - a[0] - (along * (b[0] - a[0])) / length, p[1] - a[1] - (along * (b[1] - a[1])) / length, p[2] - a[2] - (along * (b[2] - a[2])) / length));

          // The arm owns the shoulder's cap as well, the skin lateral of the armpit's sagittal plane, and gives up what lies medial.
          return Math.max(thumb, ARMPIT_MM - p[2]);
        } },

        // The leg turns at the ankle and runs on to the ball of the foot, its sections fanning round the instep, so the heel is lofted and the ankle
        // is no seam. The ankle's turn is long enough that its tightest radius, 2 h / (1.875 angle) = 46 mm, stays outside the instep. Round the
        // turn the heel sweeps about 2.7 times faster than the station, so its knots may stand 6 mm apart.
        // A course that leaves the ankle square to the row of toe joints, with the forefoot read as the curve round all the toes, was tried;
        // its wall stalled above 3 mm, so the foot keeps this course and closes at the toe webs, and the toes are merged onto that cap.
        { name: "leg", centres: [joint("thigh_r"), joint("calf_r"), joint("foot_r"), [133, 20, 157]], course: "[J.thigh, J.calf, J.foot, J.footBall]", halves: [40, 62], up: [1, 0, 0], domain: [104, 956], gap: 6, tip: 990, mirrored: true, layouts: LIMB, reliefs: "auto" },
        // The auricle as a short loft out of the side of the head: its course runs straight to the side from under its root, and of each plane's
        // loops inside the ear's box it reads the hull, so it is the ear's outer form without the concha's hollow.
        { name: "ear", centres: [[3, 1579, 74], [3, 1579, 100]], course: "[J.earRoot, J.earTip]", halves: [], up: [0, 1, 0], domain: [4, 18], head: true, loose: true, step: 1, gap: 3, tip: 23, mirrored: true, layouts: LIMB, clip: (p: R.V): number => -ear(p), reliefs: [] },

        // The nose's free end as a short loft straight forward out of the face, closed at its tip.
        { name: "nose", centres: [[118, 1561, 0], [140, 1561, 0]], course: "[J.noseRoot, J.noseTip]", halves: [], up: [0, 1, 0], domain: [5, 14], head: true, loose: true, step: 1, gap: 3, tip: 18, mirrored: false, layouts: LIMB, clip: (p: R.V): number => -nose(p), reliefs: [] },

        // The trunk from the crotch to the crown as one wall. Knots 4 mm apart from the neck up followed every step of the face's hull and left
        // the wall streaked, so they keep 8 mm and the face is the reliefs'. The ears are left out of its sections. It owns the shoulders down to the armscye plane through the armpit's
        // crease; past that plane, lateral of the crease and inside the arm's own tube, the skin is the arm's and is left out of the trunk's sections.
        { name: "trunk", centres: [[0, 780, 0], [0, 1705, 0]], course: "[J.axisFloor, J.axisCrown]", halves: [], up: [1, 0, 0], domain: [40, 912], whole: true, step: 2, gap: (s: number): number => (process.argv.includes("--jaw") && s >= 692 && s <= 732 ? 3 : 8), tip: true, cap: 896, mirrored: false, layouts: LIMB, clip: (p: R.V): number => Math.max(ear(p), nose(p), ...[1, -1].map((side: number): number => {
          const a: R.V = joint("upperarm_r");
          const b: R.V = joint("lowerarm_r");
          const length: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
          const d: R.V = [(b[0] - a[0]) / length, (b[1] - a[1]) / length, (b[2] - a[2]) / length];
          const q: R.V = [p[0] - a[0], p[1] - a[1], side * p[2] - a[2]];
          const along: number = q[0] * d[0] + q[1] * d[1] + q[2] * d[2];
          return Math.min(side * p[2] - ARMPIT_MM, ARM_TUBE_MM - Math.hypot(q[0] - along * d[0], q[1] - along * d[1], q[2] - along * d[2]));
        })), reliefs: [
          // Every window stays within 1.2 rad of its axis. Farther round, a height along the axis slides a point along the wall instead of
          // moving it in or out, which folded the skin at the sides of the head and the shoulders; there the wall stands alone.
          { name: "trunk.low.back", stations: [-20, 470], phases: [Math.PI - 1.2, Math.PI + 1.2], axis: [1, 0, 0], rows: 51, columns: 31, mirror: true },
          { name: "trunk.low.front", stations: [-20, 470], phases: [-1.2, 1.2], axis: [-1, 0, 0], rows: 51, columns: 31, mirror: true },
          // Over the chest and the shoulders the windows stop at 1.0 rad, short of the fold beside the armpit. While the trunk kept a stump of
          // arm the tape bridged from the breast to it, with the skin deep inside that bridge from about 0.6 to 1.3 rad: a window ending there
          // creased the whole chest and back along its edge, and one reaching 1.45 rad left a thin flap in the fold beside the armpit.
          { name: "trunk.chest.back", stations: [420, 680], phases: [Math.PI - 1.0, Math.PI + 1.0], axis: [1, 0, 0], rows: 53, columns: 35, mirror: true },
          { name: "trunk.chest.front", stations: [420, 680], phases: [-1.0, 1.0], axis: [-1, 0, 0], rows: 53, columns: 35, mirror: true },
          // The upper windows end at the crown's tip, 918.88 mm: a relief's height and its two derivatives vanish at its window's edge, which the engine requires of a pole.
          { name: "trunk.high.back", stations: [640, 918.88], phases: [Math.PI - 1.2, Math.PI + 1.2], axis: [1, 0, 0], rows: 57, columns: 33, mirror: true },
          { name: "trunk.high.front", stations: [640, 918.88], phases: [-1.2, 1.2], axis: [-1, 0, 0], rows: 57, columns: 49, mirror: true },
          // The front and back windows end 1.2 rad round, where the skin in front of the ear and behind the jaw's angle still lies inside the
          // tape, so a seam runs down the cheek. Two more windows cast straight in from each side over the neck and head were tried twice.
          // Reaching 1.0 rad either way, a cast from the front of the cheek ran along the face and landed on its far side (heights up to
          // 81 mm on withheld sections) and casts landed on the chord closing the ear's cut: the cheek and the ear's root streaked. Reaching
          // 0.7 rad, with casts onto a cut's chord no longer observed, the two sides came out alike (14 mm deepest) and the cheek's seam
          // softened, but the skin under the ear and along the jaw's angle gouged. Neither is kept: the jaw is not a relief's to make.
          // The face: a finer net, 2.5 mm apart, over what the upper front window leaves between the throat and the brow.
          { name: "trunk.face", stations: [690, 890], phases: [-1.2, 1.2], axis: [-1, 0, 0], rows: 81, columns: 69, mirror: true },
        ] },
      ] satisfies IPart[]
    ).filter((part: IPart): boolean => only.length === 0 || only.includes(part.name));
    // `--head=<heightMm>,<degrees>,<halfMm>`: a trial of the trunk's course turning backward at that height by that angle, to read (with
    // `--observe`) how its tilted planes cut the jaw and the skin under it. Turned at 1,430 mm by 30, 45 and 60 degrees, a plane takes
    // in the chin and the throat together and the tape bridges them: hollows of 46 to 81 mm against 4 mm on level planes, and no loop
    // round the course above the mouth. Level planes are the head's; only the 25 mm under the jaw change fast along them.
    const head: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--head="))?.slice(7);
    if (head !== undefined)
      for (const part of parts)
        if (part.name === "trunk") {
          const [height, degrees, half]: number[] = head.split(",").map(Number);
          const angle: number = (degrees! * Math.PI) / 180;
          part.centres = [[0, 780, 0], [0, height!, 0], [-400 * Math.sin(angle), height! + 400 * Math.cos(angle), 0]];
          part.halves = [half!];
          part.domain = [40, 1100];
          part.clip = undefined;
        }
    const meshes: N.Mesh[] = [];
    const curves: N.Curve[] = [];
    const receipt: unknown[] = [];
    for (const part of parts) {
      const axis: AutoMovieViewAxis.IAxis = K.axis(part);

      // Observe: exact native cuts on the course's own planes, fitting sections every STEP_MM and withheld sections midway.
      const rows: F.IRow[] = [];
      const skipped: number[] = [];
      const hollows: string[] = [];
      const skins: C.P[][] = [];
      const step: number = part.step ?? STEP_MM;
      const gap = (s: number): number => (typeof part.gap === "function" ? part.gap(s) : (part.gap ?? GAP_MM));
      const skin: R.ISource["body"] = part.head === true ? source.head : part.whole === true ? source.all : source.body;

      // A plane's loop for the part: the one round the course, or for a `loose` part the largest closed loop the clip leaves whose hull holds the course.
      const cut = (frame: AutoMovieLoftFrame.IFrame, s: number): C.P[] | null => {
        if (part.loose !== true || (part.surround !== undefined && s < part.surround.from)) {
          const whole: C.P[] | null = R.cut(skin, frame).loop;
          return whole === null || part.clip === undefined ? whole : without(whole, frame, part.clip);
        }
        const inside = (hull: readonly C.P[]): boolean => hull.every((p: C.P, i: number): boolean => p[0] * hull[(i + 1) % hull.length]![1] - p[1] * hull[(i + 1) % hull.length]![0] > 0);
        const clipped: C.P[][] = R.loops(skin, frame)
          .map((loop: C.P[]): C.P[] | null => (part.clip === undefined ? loop : without(loop, frame, part.clip)))
          .filter((loop: C.P[] | null): loop is C.P[] => loop !== null && loop.length >= 3);

        // A part that surrounds its branches reads the curve round every loop within its reach of the course: the hull of them all.
        if (part.surround !== undefined) {
          const near: C.P[] = clipped.filter((loop: C.P[]): boolean => loop.every((p: C.P): boolean => Math.hypot(p[0], p[1]) < part.surround!.reach)).flat();
          const around: C.P[] = near.length < 3 ? [] : R.hull(near);
          return around.length >= 3 && inside(around) ? around : null;
        }
        const kept: C.P[][] = clipped.filter((loop: C.P[]): boolean => inside(R.hull(loop)));
        return kept.length === 0 ? null : kept.reduce((a: C.P[], b: C.P[]): C.P[] => (Math.abs(R.area(b)) > Math.abs(R.area(a)) ? b : a));
      };
      // `--to=<station>`: fit only up to that station, for the head of a wall whose far end is spliced in from another fit. Fitted whole, a
      // wall's growth goes to its worst sections, and the arm's are in the hand, which left the shoulder with ten knots at a mean of 0.7 mm.
      const to: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--to="))?.slice(5);
      const whole: [number, number] = part.domain === "auto" ? span(skin, axis, part.centres) : part.domain;
      const domain: [number, number] = to === undefined ? whole : [whole[0], Number(to)];
      log("family-body-domain", { part: part.name, domain });

      // The tip: the last station, searched a quarter millimetre at a time past the domain, whose plane still cuts a loop round the course, and half a step on.
      let tip: number | null = null;
      if (part.tip !== undefined) {
        if (typeof part.tip === "number") tip = part.tip;
        else {
          tip = domain[1];
          while (tip < domain[1] + 80 && cut(axis.at(tip + 0.25), tip + 0.25) !== null) tip += 0.25;
          tip = Math.round((tip + 0.125) * 100) / 100;
        }
        log("family-body-tip", { part: part.name, tip, pastDomainMm: tip - domain[1] });
        if (process.argv.includes("--tips")) continue;
      }
      for (let s: number = domain[0], i: number = 0; s <= domain[1] + 1e-9; s += step / 2, ++i) {
        const frame: AutoMovieLoftFrame.IFrame = axis.at(s);
        const loop: C.P[] | null = cut(frame, s);
        if (loop === null) skipped.push(s);
        else {
          // The family is the tape wall: it reads the section's convex hull. How far the skin lies inside that hull is measured apart, as relief.
          // A loose part is measured against that hull as well: its loop need not be star-shaped about the course.
          const wall: C.P[] = R.hull(loop);
          rows.push({ s, points: wall, heldout: i % 2 === 1 });
          skins.push(part.loose === true && (part.surround === undefined || s >= part.surround.from) ? wall : loop);
          let deepest: number = 0;
          let where: number = 0;
          for (const p of loop) {
            const phi: number = Math.atan2(p[1], p[0]);
            const depth: number = C.radius(wall, phi) - Math.hypot(p[0], p[1]);
            if (depth > deepest) {
              deepest = depth;
              where = phi;
            }
          }
          hollows.push(s.toFixed(0) + ":" + deepest.toFixed(1) + "@" + ((where * 180) / Math.PI).toFixed(0));
        }
      }
      log("family-body-hollows", { part: part.name, deepestMmAtDegrees: hollows.filter((_: string, i: number): boolean => i % 6 === 0).join(" ") });
      log("family-body-observed", { part: part.name, sections: rows.length, skipped });

      // `--observe`: the sections alone, every fourth one's extents in its chart and how near its hull comes to the course, and no fit.
      if (process.argv.includes("--observe")) {
        log("family-body-sections", { part: part.name, rows: rows.filter((_: F.IRow, i: number): boolean => i % 4 === 0).map((row: F.IRow): string => row.s.toFixed(0) + " u " + Math.min(...row.points.map((p: C.P): number => p[0])).toFixed(0) + ".." + Math.max(...row.points.map((p: C.P): number => p[0])).toFixed(0) + " v " + Math.min(...row.points.map((p: C.P): number => p[1])).toFixed(0) + ".." + Math.max(...row.points.map((p: C.P): number => p[1])).toFixed(0) + " near " + Math.min(...Array.from({ length: 72 }, (_: unknown, j: number): number => C.radius(row.points, (Math.PI * j) / 36))).toFixed(0)) });
        continue;
      }

      // Fit: grow the shared knot vector at the worst open fitting sections until the target holds or no section is open.
      let best: F.IResult | null = null;

      // The other wall of a splice and its station, kept so its reliefs past that station come with its knots.
      let spliced: { tail: K.IStored; at: number; head: IAutoMovieLoftRelief[] } | null = null;
      const trail: unknown[] = [];
      const attempt = (knots: number[], layout: C.ILayout, initial: number[][] | undefined, note: string, power: number = 4): F.IResult => {
        const result: F.IResult = F.fit(rows, knots, layout, power, initial);
        const row = { note, fields: result.layout.anchors.length === 0 ? 0 : C.units(layout).length, knots: knots.length, scalars: knots.length * (1 + C.units(layout).length), trainMaxMm: round(result.training.maximumMm), trainMeanMm: round(result.training.meanMm), heldMaxMm: round(result.heldout.maximumMm), heldMeanMm: round(result.heldout.meanMm), fault: result.fault, ms: Math.round(result.milliseconds) };
        trail.push(row);
        log("family-body-candidate", { part: part.name, ...row });
        return result;
      };
      // With `--wall=<directory>` the wall of an earlier run is taken as it was stored and only its reliefs are fitted again.
      const reuse: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--wall="))?.slice(7);
      if (reuse !== undefined) {
        const wall: K.IStored = JSON.parse(await fs.readFile(path.join(reuse, part.name + ".family.json"), "utf8")) as K.IStored;

        // `--splice=<directory>@<station>`: from that station on, the knots and values of another stored wall of the same part, course and
        // layout replace this one's. A limb refitted for one end keeps the other end of the fit its neighbours were sewn on.
        const splice: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--splice="))?.slice(9);
        if (splice !== undefined) {
          const [other, where]: string[] = splice.split("@");
          const [at, moved]: string[] = where!.split("+");
          const tail: K.IStored = JSON.parse(await fs.readFile(path.join(other!, part.name + ".family.json"), "utf8")) as K.IStored;
          if (tail.values.length !== wall.values.length) throw new Error("splice: the two walls of " + part.name + " have different layouts");

          // `+<shift>`: the other wall was fitted on a course whose stations past the splice are this one's less the shift.
          const shift: number = Number(moved ?? 0);
          tail.knots = tail.knots.map((k: number): number => round(k + shift));
          tail.reliefs = (tail.reliefs ?? []).map((relief: IAutoMovieLoftRelief): IAutoMovieLoftRelief => ({ ...relief, stations: [round(relief.stations[0] + shift), round(relief.stations[1] + shift)] }));
          spliced = { tail, at: Number(at), head: wall.reliefs ?? [] };
          const head: number[] = wall.knots.map((_: number, k: number): number => k).filter((k: number): boolean => wall.knots[k]! < Number(at));
          const rest: number[] = tail.knots.map((_: number, k: number): number => k).filter((k: number): boolean => tail.knots[k]! >= Number(at));
          wall.values = wall.values.map((field: number[], f: number): number[] => [...head.map((k: number): number => field[k]!), ...rest.map((k: number): number => tail.values[f]![k]!)]);
          wall.knots = [...head.map((k: number): number => wall.knots[k]!), ...rest.map((k: number): number => tail.knots[k]!)];
        }
        best = { layout: wall.layout, knots: wall.knots, values: wall.values, rows: [], training: { maximumMm: NaN, meanMm: NaN }, heldout: { maximumMm: NaN, meanMm: NaN }, fault: null, milliseconds: 0 } as unknown as F.IResult;
      }
      for (const { layout, depth } of reuse === undefined ? part.layouts : []) {
        // A deeper layout starts from the shallower one's final knots and values, cut exactly at every arc's median.
        const knots0: number[] = best === null ? [domain[0], (domain[0] + domain[1]) / 2, domain[1]] : [...best.knots];
        let result: F.IResult = attempt(knots0, layout, best === null ? undefined : F.refine(best.values, depth - 1), "depth " + depth);

        // Growth always starts from the family of least mean so far. A round that lowers that mean by 3 % is kept; one that does not is dropped
        // and its stations are not offered again, so the next round tries the next worst rows. Three dropped rounds in a row end the growth.
        // Going on from a dropped round instead carried a failed solve into every later one and left the trunk and the leg above 2 mm.
        const refused: Set<number> = new Set();
        let idle: number = 0;
        while (result.fault === null && result.training.maximumMm > 0.9 * TARGET_MM && idle < 3) {
          const held: F.IResult = result;
          const open: F.IResult["rows"] = held.rows.filter((r: F.IResult["rows"][number]): boolean => !r.heldout && !refused.has(r.s) && r.maximumMm > 0.9 * TARGET_MM && held.knots.every((k: number): boolean => Math.abs(k - r.s) >= gap(r.s))).sort((a, b) => b.maximumMm - a.maximumMm);
          const added: number[] = [];
          for (const r of open) if (added.length < 4 && added.every((s: number): boolean => Math.abs(s - r.s) >= 2 * gap(r.s))) added.push(r.s);
          if (added.length === 0) break;
          const next: number[] = [...held.knots, ...added].sort((a: number, b: number): number => a - b);
          const trial: F.IResult = attempt(next, layout, F.resample(held.values, held.knots, next), "grow");
          if (trial.fault === null && trial.training.meanMm < 0.97 * held.training.meanMm) {
            result = trial;
            idle = 0;
          } else {
            for (const s of added) refused.add(s);
            ++idle;
          }
        }
        if (result.fault === null && (best === null || result.training.maximumMm < 0.97 * best.training.maximumMm || result.training.meanMm < 0.9 * best.training.meanMm)) best = result;
        if (best !== null && best.training.maximumMm <= 0.9 * TARGET_MM) break;
      }

      // Prune: drop every knot whose removal keeps the maximum and the mean within 3 % and 5 % of the grown family.
      if (best !== null && reuse === undefined) {
        // The limits are read from the grown family under the same plain pass the trials run, so a trial is compared like for like. The grown
        // family itself stays: the thinned one replaces it only if, refitted with the reweighted passes, its mean is within 10 % of the grown one's.
        const base: F.IResult = attempt(best.knots, best.layout, best.values, "prune base", 2);
        if (base.fault === null) {
          let thinned: F.IResult = base;
          const limitMax: number = Math.max(0.9 * TARGET_MM, 1.03 * base.training.maximumMm);
          const limitMean: number = 1.05 * base.training.meanMm;
          for (let k: number = thinned.knots.length - 2; k >= 1; --k) {
            const next: number[] = thinned.knots.filter((_: number, i: number): boolean => i !== k);
            const trial: F.IResult = attempt(next, thinned.layout, F.resample(thinned.values, thinned.knots, next), "prune", 2);
            if (trial.fault === null && trial.training.maximumMm <= limitMax && trial.training.meanMm <= limitMean) thinned = trial;
          }
          if (thinned.knots.length < best.knots.length) {
            const polished: F.IResult = attempt(thinned.knots, thinned.layout, thinned.values, "polish");
            if (polished.fault === null && polished.training.meanMm <= 1.1 * best.training.meanMm) best = polished;
            else if (thinned.training.meanMm <= 1.1 * best.training.meanMm) best = thinned;
          }
        }
      }
      if (best === null) {
        receipt.push({ part: part.name, trail, fault: "no admissible family" });
        continue;
      }
      log("family-body-rows", { part: part.name, worst: best.rows.filter((r) => r.maximumMm > TARGET_MM).map((r) => r.s.toFixed(0) + (r.heldout ? "h" : "t") + ":" + r.maximumMm.toFixed(2) + "@" + ((r.phase * 180) / Math.PI).toFixed(0)).join(" ") });

      // Store as rounded text, then regenerate from that text alone through the engine.
      const stored: string = JSON.stringify({ name: part.name, centres: part.centres.map((c: R.V): number[] => c.map(round)), halves: part.halves, up: part.up, layout: best.layout, knots: best.knots.map(round), values: best.values.map((field: number[], f: number): number[] => field.map(C.units(best!.layout)[f] === "mm" ? round : round4)) });
      await fs.writeFile(path.join(out, part.name + ".family.json"), stored);
      const definition: K.IStored = JSON.parse(stored) as K.IStored;

      // Reliefs: fitted on the stored wall, so they also absorb what the wall leaves inside their windows.
      {
        const read: (s: number) => number[] = K.reader(definition);
        const course: AutoMovieViewAxis.IAxis = K.axis(definition);
        const windows: H.IWindow[] = part.reliefs === "auto" ? hollowWindows(part.name, rows, skins, course) : part.reliefs;
        definition.reliefs = [];
        for (const window of windows) {
          // Each window is fitted over the wall with every earlier relief already on it, as the engine composes them, so a later window takes only what the earlier ones left.
          const earlier: IAutoMovieLoftRelief[] = [...definition.reliefs];
          const fitted: H.IResult = H.fit(window, rows.map((row: F.IRow, i: number): H.IRow => {
            const section: Q.ISection = C.chain(read(row.s), definition.layout);
            const frame: AutoMovieLoftFrame.IFrame = course.at(row.s);
            const inChart = (axis: readonly number[]): C.P => [axis[0]! * frame.u[0] + axis[1]! * frame.u[1] + axis[2]! * frame.u[2], axis[0]! * frame.v[0] + axis[1]! * frame.v[1] + axis[2]! * frame.v[2]];
            // A cast that lands on the chord closing a neighbour's cut (the ear's, the nose's, the arm's) has found no skin: inside the cut the clip is positive.
            const open = part.clip === undefined ? undefined : (p: C.P): boolean => part.clip!([frame.origin[0] + p[0] * frame.u[0] + p[1] * frame.v[0], frame.origin[1] + p[0] * frame.u[1] + p[1] * frame.v[1], frame.origin[2] + p[0] * frame.u[2] + p[1] * frame.v[2]]) > 0.05;
            return { s: row.s, skin: skins[i]!, heldout: row.heldout, ...(open === undefined ? {} : { open }), wall: (phi: number): C.P => {
              const r: number = Q.radius(section, phi);
              const p: C.P = [r * Math.cos(phi), r * Math.sin(phi)];
              for (const relief of earlier) {
                const height: number = AutoMovieLoftRelief.height(relief, row.s, phi)[0];
                const along: C.P = inChart(relief.axis);
                p[0] += height * along[0];
                p[1] += height * along[1];
              }
              return p;
            }, axis: [window.axis[0] * frame.u[0] + window.axis[1] * frame.u[1] + window.axis[2] * frame.u[2], window.axis[0] * frame.v[0] + window.axis[1] * frame.v[1] + window.axis[2] * frame.v[2]] };
          }));
          // A window placed by the hollow search is kept only when its net takes away at least half of its deepest hollow on the withheld
          // sections. Round a turn a section's hollow lies across the cast's axis, and a net that cannot reach it leaves scratches instead.
          const kept: boolean = part.reliefs !== "auto" || fitted.heldMaxMm <= 0.5 * fitted.deepestMm;
          if (kept) definition.reliefs.push(fitted.relief);
          log("family-body-relief", { part: part.name, relief: window.name, kept, scalars: fitted.scalars, deepestMm: round(fitted.deepestMm), trainMaxMm: round(fitted.trainMaxMm), heldMaxMm: round(fitted.heldMaxMm) });
        }

        // A spliced wall takes the reliefs as it takes the knots: each wall's own stored ones on its side of the station, since those were
        // fitted on the very values the splice keeps there. Fitted again over the whole spliced wall, the hollow search placed other windows
        // and the keep rule dropped the one over the hollow in front of the shoulder, which left the skin 8 mm inside the wall there.
        if (spliced !== null) {
          const { tail, at, head }: { tail: K.IStored; at: number; head: IAutoMovieLoftRelief[] } = spliced;
          definition.reliefs = [...head.filter((relief: IAutoMovieLoftRelief): boolean => relief.stations[1] <= at), ...(tail.reliefs ?? []).filter((relief: IAutoMovieLoftRelief): boolean => relief.stations[0] >= at)].map((relief: IAutoMovieLoftRelief, i: number): IAutoMovieLoftRelief => ({ ...relief, name: part.name + ".hollow." + i }));
          log("family-body-spliced", { part: part.name, at, reliefs: definition.reliefs.map((relief: IAutoMovieLoftRelief): string => relief.name + " " + relief.stations.join("..")) });
        }
        await fs.writeFile(path.join(out, part.name + ".family.json"), JSON.stringify(definition));
      }
      const stations: number[] = rows.map((row: F.IRow): number => row.s);
      const lofted: number = performance.now();
      const loft: L.IResult = K.create(definition, stations);
      const loftMs: number = performance.now() - lofted;
      if (loft.chain === null) {
        receipt.push({ part: part.name, trail, engineFault: loft.diagnostics });
        log("family-body-engine", { part: part.name, fault: loft.diagnostics });
        continue;
      }
      const chain: NonNullable<L.IResult["chain"]> = loft.chain;
      const stage: AutoMovieViewAxis.IAxis = K.axis(definition);
      let maximum: number = 0;
      let sum: number = 0;
      let n: number = 0;
      const worstRows: string[] = [];
      rows.forEach((row: F.IRow, i: number): void => {
        // The regenerated section as a dense chart polyline; every observed skin vertex is measured to it.
        const frame: AutoMovieLoftFrame.IFrame = stage.at(row.s);
        const ring: C.P[] = Array.from({ length: 512 }, (_: unknown, j: number): C.P => {
          const p: R.V = AutoMovieLoftChain.point(chain, row.s, (2 * Math.PI * j) / 512) as R.V;
          const d: R.V = [p[0] - frame.origin[0], p[1] - frame.origin[1], p[2] - frame.origin[2]];
          return [d[0] * frame.u[0] + d[1] * frame.u[1] + d[2] * frame.u[2], d[0] * frame.v[0] + d[1] * frame.v[1] + d[2] * frame.v[2]];
        });
        let rowMaximum: number = 0;
        let rowPhase: number = 0;
        for (const vertex of skins[i]!) {
          const e: number = distance(vertex, ring);
          if (e > rowMaximum) {
            rowMaximum = e;
            rowPhase = Math.atan2(vertex[1], vertex[0]);
          }
          sum += e;
          ++n;
        }
        maximum = Math.max(maximum, rowMaximum);
        if (rowMaximum > TARGET_MM && i % 4 === 0) worstRows.push(row.s.toFixed(0) + ":" + rowMaximum.toFixed(1) + "@" + ((rowPhase * 180) / Math.PI).toFixed(0));
      });
      log("family-body-skin", { part: part.name, over: worstRows.join(" ") });
      const engine = { storedBytes: Buffer.byteLength(stored), fields: best.values.length, knots: best.knots.length, scalars: best.knots.length * (1 + best.values.length), fitTrainMaxMm: round(best.training.maximumMm), fitHeldMaxMm: round(best.heldout.maximumMm), engineMaxMm: round(maximum), engineMeanMm: round(sum / n), loftMs: Math.round(loftMs), diagnostics: loft.diagnostics };
      log("family-body-engine", { part: part.name, ...engine });
      receipt.push({ part: part.name, domainMm: domain, sections: rows.length, skipped, trail, engine });

      // Display grid: every observed station by 128 phases, mirrored when the part has a twin.
      const rings: R.V[][] = stations.map((s: number): R.V[] => Array.from({ length: 128 }, (_: unknown, j: number): R.V => AutoMovieLoftChain.point(chain, s, (2 * Math.PI * j) / 128) as R.V));
      for (const sign of part.mirrored ? [1, -1] : [1]) {
        const positions: number[] = [];
        const indices: number[] = [];
        for (const ring of rings) for (const p of ring) positions.push(p[0] / 1000, p[1] / 1000, (sign * p[2]) / 1000);
        for (let i: number = 0; i + 1 < rings.length; ++i)
          for (let j: number = 0; j < 128; ++j) {
            const a: number = i * 128 + j;
            const b: number = i * 128 + ((j + 1) % 128);
            if (sign > 0) indices.push(a, a + 128, b, b, a + 128, b + 128);
            else indices.push(a, b, a + 128, b, b + 128, a + 128);
          }
        meshes.push({ id: part.name + (sign > 0 ? "" : ".mirror"), positions, indices, colour: [0.64, 0.65, 0.67] });
        for (const m of definition.knots.map((k: number): number => stations.reduce((a: number, b: number): number => (Math.abs(b - k) < Math.abs(a - k) ? b : a))))
          curves.push({ id: part.name + ".knot." + m + "." + sign, points: rings[stations.indexOf(m)]!.map((p: R.V): N.Point => [p[0] / 1000, p[1] / 1000, (sign * p[2]) / 1000]), closed: true, colour: "b84b29" });
      }
      await fs.writeFile(path.join(out, "receipt.json"), JSON.stringify({ schema: "f1-family-conic-body-v1", targetMm: TARGET_MM, parts: receipt, milliseconds: performance.now() - started }, null, 2));

      // The authored module: the same definition as TypeScript, written beside the receipt and, with --emit, into the Human package.
      if (tip !== null) definition.tips = [null, { from: part.cap ?? domain[1], tip }];
      const moduleText: string = emit({ ...part, domain }, definition, C.units(definition.layout).length === C.units(C.limb(0)).length ? 0 : 1, engine, rows.length);
      await fs.writeFile(path.join(out, moduleName(part.name) + ".ts"), moduleText);
      if (process.argv.includes("--emit")) await fs.writeFile(path.join(root, "packages/human/src/generation/f1", moduleName(part.name) + ".ts"), moduleText);
    }

    // Same cameras for the reference and the regenerated parts, framed on the reference.
    const reference: N.Mesh = { id: "reference.body", positions: Array.from(source.body.positions, (x: number): number => x / 1000), indices: Array.from(source.body.indices), colour: [0.64, 0.65, 0.67] };
    const bounds: N.Point[] = [];
    for (let i: number = 0; i < reference.positions.length; i += 3) bounds.push([reference.positions[i]!, reference.positions[i + 1]!, reference.positions[i + 2]!]);
    NodeCanvasRaster.initialize();
    const frames: { file: string; sha256: string }[] = [];
    for (const view of ["front", "back", "left", "right", "high-oblique", "low-oblique"]) {
      const camera: N.Camera = NodeCanvasCamera.fit(view, bounds, 900, 1500);
      for (const [stage, shown, lines] of [["reference", [reference], []], ["family-clay", meshes, []], ["family-knots", meshes, curves]] as [string, N.Mesh[], N.Curve[]][]) {
        const file: string = "body." + view + "." + stage + ".png";
        const png: Buffer = NodeCanvasRaster.render(camera, shown, lines, "depth", "f1 | " + stage + " | " + view).png;
        await fs.writeFile(path.join(out, file), png);
        frames.push({ file, sha256: createHash("sha256").update(png).digest("hex") });
      }
    }
    await fs.writeFile(path.join(out, "receipt.json"), JSON.stringify({ schema: "f1-family-conic-body-v1", targetMm: TARGET_MM, parts: receipt, frames, milliseconds: performance.now() - started }, null, 2));
    log("family-body-complete", { out });
  }

  /**
   * Relief windows over every run of sections where the skin lies deeper
   * inside the stored wall than the target: the run's stations and the
   * phases of its deep vertices, each widened so the net's three zero rings
   * stand on skin that needs no height, with the axis the inward radial
   * direction at the run's middle.
   */
  function hollowWindows(name: string, rows: readonly F.IRow[], skins: readonly C.P[][], course: AutoMovieViewAxis.IAxis): H.IWindow[] {
    const deep: { s: number; phases: number[] }[] = rows.map((row: F.IRow, i: number): { s: number; phases: number[] } => {
      // Depth below the tape hull, not below the fitted wall: the wall's own misfit is not a hollow.
      return { s: row.s, phases: skins[i]!.map((p: C.P): number => Math.atan2(p[1], p[0])).filter((phi: number, k: number): boolean => C.radius(row.points, phi) - Math.hypot(skins[i]![k]![0], skins[i]![k]![1]) > 0.6 * TARGET_MM) };
    });
    // Deep vertices are first split round the section: phases farther apart than a radian belong to different hollows (a spine groove and a cleavage share stations but not a window).
    const every: number[] = deep.flatMap((row: { s: number; phases: number[] }): number[] => row.phases).sort((a: number, b: number): number => a - b);
    const windows: H.IWindow[] = [];
    if (every.length === 0) return windows;
    let widest: number = every[0]! + 2 * Math.PI - every.at(-1)!;
    let start: number = 0;
    for (let k: number = 1; k < every.length; ++k)
      if (every[k]! - every[k - 1]! > widest) {
        widest = every[k]! - every[k - 1]!;
        start = k;
      }
    const turned: number[] = [...every.slice(start), ...every.slice(0, start).map((phi: number): number => phi + 2 * Math.PI)];
    const clusters: [number, number][] = [];
    let first: number = turned[0]!;
    for (let k: number = 1; k <= turned.length; ++k)
      if (k === turned.length || turned[k]! - turned[k - 1]! > 1) {
        clusters.push([first, turned[k - 1]!]);
        if (k < turned.length) first = turned[k]!;
      }
    const within = (phi: number, cluster: [number, number]): boolean => {
      let value: number = phi;
      while (value < cluster[0] - 1e-9) value += 2 * Math.PI;
      return value <= cluster[1] + 1e-9;
    };

    // Within each phase cluster, every run of stations with deep vertices gets one window.
    for (const cluster of clusters) {
      let run: number[] = [];
      const close = (): void => {
        if (run.length >= 2) {
          const centre: number = (cluster[0] + cluster[1]) / 2;
          const from: number = cluster[0] - 0.45;
          const to: number = cluster[1] + 0.45;
          const stations: [number, number] = [run[0]! - 30, run.at(-1)! + 30];
          const frame: AutoMovieLoftFrame.IFrame = course.at((stations[0] + stations[1]) / 2);
          const axis: [number, number, number] = [0, 1, 2].map((c: number): number => -(Math.cos(centre) * frame.u[c]! + Math.sin(centre) * frame.v[c]!)) as [number, number, number];
          windows.push({ name: name + ".hollow." + windows.length, stations, phases: [from, to], axis, rows: Math.max(7, Math.ceil((stations[1] - stations[0]) / 10) + 3), columns: Math.max(7, Math.ceil((to - from) / 0.15) + 3), mirror: false });
        }
        run = [];
      };
      for (const row of deep) {
        if (row.phases.some((phi: number): boolean => within(phi, cluster))) run.push(row.s);
        else if (run.length > 0 && row.s - run.at(-1)! > 16) close();
      }
      close();
    }
    return windows;
  }

  /** Reference joints the families' courses run through, by the name the datum module gives each. */
  const JOINTS: readonly [string, string][] = [
    ["upperarm", "upperarm_r"], ["lowerarm", "lowerarm_r"], ["hand", "hand_r"],
    ["thigh", "thigh_r"], ["calf", "calf_r"], ["foot", "foot_r"],
    ...["index", "middle", "ring", "pinky", "thumb"].flatMap((finger: string): [string, string][] => [1, 2, 3].map((k: number): [string, string] => [finger + k, finger + "_0" + k + "_r"])),
    ...["bigtoe", "indextoe", "middletoe", "ringtoe", "littletoe"].flatMap((toe: string): [string, string][] => [1, 2].map((k: number): [string, string] => [toe + k, toe + "_0" + k + "_r"])),
  ];

  /** The datum module: every joint centre the authored courses use, once, by name. */
  function joints(source: R.ISource): string {
    const lines: string[] = [
      "/**",
      " * f1's joint centres on the +Z side in its reference pose: the datums every authored course of the figure runs through.",
      " *",
      " * Frame: millimetres, forward +X, up +Y, +Z the reference's left. The values are the reference rig's bind joint centres,",
      " * read once offline by `test/src/reference-conics/FamilyConicBody.ts --emit-joints`. A family names its course by these",
      " * datums and holds no joint coordinate of its own, so a law that places the joints from a person's measurements replaces",
      " * this table and every course follows.",
      " */",
      "export namespace AutoMovieHumanF1Joints {",
      "  /** A point in the figure's frame, mm. */",
      "  export type V3 = [number, number, number];",
      "",
    ];
    for (const [name, joint] of JOINTS) lines.push("  /** Reference joint `" + joint + "`. */", "  export const " + name + ": V3 = " + JSON.stringify(source.joints.get(joint)!.map(round)).replaceAll(",", ", ") + ";", "");
    lines.push(
      "  /** Foot of the vertical axis the trunk is read about, below the crotch on the median line. */",
      "  export const axisFloor: V3 = [0, 780, 0];",
      "",
      "  /** Top of the trunk's axis, above the crown. */",
      "  export const axisCrown: V3 = [0, 1705, 0];",
      "",
      "  /** Where the leg's course ends past the ankle, in the ball of the foot. */",
      "  export const footBall: V3 = [133, 20, 157];",
      "",
      "  /** The armpit's crease, where the arm's inner side meets the trunk's side. */",
      "  export const armpit: V3 = [-25, " + ARMPIT_Y_MM + ", " + ARMPIT_MM + "];",
      "",
      "  /**",
      "   * Where the arm's course starts, inside the trunk beside the armscye's plane, 35 mm above the armpit's crease and midway between the",
      "   * shoulder's fore and aft edges. The course leaves it straight to the side, so the arm's first sections lie beside that plane.",
      "   */",
      "  export const armRoot: V3 = " + JSON.stringify(ARM_ROOT).replaceAll(",", ", ") + ";",
      "",
      "  /** The corner the arm's course turns at, round the shoulder, from straight to the side to the line down to the elbow. */",
      "  export const armTurn: V3 = " + JSON.stringify(ARM_TURN).replaceAll(",", ", ") + ";",
      "",
      "  /**",
      "   * The shoulder's section in the armscye, the sagittal plane at the armpit's side distance: the heights of the arm's underside and of the",
      "   * shoulder's top just beside it, and its fore and aft edges forward of the median axis. The trunk owns the skin medial of the plane, the arm",
      "   * the rest.",
      "   */",
      "  export const armscye: { bottom: number; top: number; fore: number; aft: number } = { bottom: 1258, top: 1404, fore: 47, aft: -70 };",
      "",
      "  /** Where the ear's course starts, under its root in the side of the head. */",
      "  export const earRoot: V3 = [3, 1579, 74];",
      "",
      "  /** Where the ear's course ends, straight to the side past the auricle's rim. */",
      "  export const earTip: V3 = [3, 1579, 100];",
      "",
      "  /** Centre of the auricle's root on the sagittal plane it leaves the skull at. */",
      "  export const earBase: V3 = [9.5, 1572, 77];",
      "",
      "  /** Half extents of the auricle's root in height and fore and aft. */",
      "  export const earHalf: [number, number] = [29, 10.5];",
      "",
      "  /** Where the nose's course starts, inside the face behind the nose's free end. */",
      "  export const noseRoot: V3 = [118, 1561, 0];",
      "",
      "  /** Where the nose's course ends, straight forward past its tip. */",
      "  export const noseTip: V3 = [140, 1561, 0];",
      "",
      "  /** Centre of the nose's root on the frontal plane it stands free of the lips and cheeks at. */",
      "  export const noseBase: V3 = [122, 1561, 0];",
      "",
      "  /** Half extents of the nose's root in height and across. */",
      "  export const noseHalf: [number, number] = [21, 18];",
      "",
      "  /** The point `length` millimetres past `b` on the line from `a` through `b`: where a digit's course ends beyond its last joint. */",
      "  export function beyond(a: V3, b: V3, length: number): V3 {",
      "    const d: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);",
      "    return [b[0] + ((b[0] - a[0]) * length) / d, b[1] + ((b[1] - a[1]) * length) / d, b[2] + ((b[2] - a[2]) * length) / d];",
      "  }",
      "}",
      "",
    );
    return lines.join("\n");
  }

  /** Module and constant name of a part's authored family. */
  function moduleName(part: string): string {
    return "AutoMovieHumanF1" + part.split(".").map((word: string): string => word[0]!.toUpperCase() + word.slice(1)).join("");
  }

  /**
   * The station interval a part can be fitted on: the longest run of stations, 1 mm apart along the course, whose cut is one
   * loop round the course with an area at most twice the median of the course's outer half. Where the part runs into its
   * parent the loop takes the parent in and its area jumps, which ends the run.
   */
  function span(mesh: R.ISource["body"], axis: AutoMovieViewAxis.IAxis, centres: readonly R.V[]): [number, number] {
    let length: number = 0;
    for (let i: number = 1; i < centres.length; ++i) length += Math.hypot(centres[i]![0] - centres[i - 1]![0], centres[i]![1] - centres[i - 1]![1], centres[i]![2] - centres[i - 1]![2]);
    const areas: (number | null)[] = [];
    for (let s: number = 0; s <= length; ++s) {
      const loop: C.P[] | null = R.cut(mesh, axis.at(s)).loop;
      areas.push(loop === null ? null : R.area(loop));
    }
    const outer: number[] = areas.slice(Math.floor(areas.length / 2)).filter((a: number | null): a is number => a !== null).sort((a: number, b: number): number => a - b);
    const limit: number = 2 * (outer[Math.floor(outer.length / 2)] ?? Infinity);
    let best: [number, number] = [0, 0];
    let from: number = -1;
    for (let s: number = 0; s <= areas.length; ++s) {
      const good: boolean = s < areas.length && areas[s] !== null && areas[s]! <= limit;
      if (good && from < 0) from = s;
      if (!good && from >= 0) {
        if (s - 1 - from > best[1] - best[0]) best = [from, s - 1];
        from = -1;
      }
    }

    // Stand off both ends: the parent's blend at the root and the vanishing loop at the tip are not the tube's.
    return [best[0] + 2, best[1] - 3];
  }

  /** What each field of a layout holds, in field order, for the authored table's row comments. */
  function labels(layout: C.ILayout): string[] {
    const out: string[] = [];
    const guides: string[] = ["front (+u)", "side (+v)", "back (-u)", "side (-v)"];
    let guide: number = 0;
    layout.anchors.forEach((anchor: C.IAnchor, k: number): void => {
      if (anchor.kind === "m") out.push("median fullness f of the arc pair around anchor " + k + ", share");
      else if (anchor.kind === "i") out.push("inflection place t on its chord, share", "inflection tangent turn from the chord, rad");
      else {
        const name: string = anchor.guide === true ? guides[guide++ % 4]! + " extreme" : "anchor " + k;
        out.push(name + ": u, mm");
        if (anchor.mid !== true) out.push(name + ": v, mm");
      }
    });
    const arcs: number = layout.mirror ? layout.anchors.length - 1 : layout.anchors.length;
    for (let k: number = 0; k < arcs; ++k) out.push("shoulder rho of the arc after anchor " + k + ", share");
    return out;
  }

  /** The authored TypeScript module of a fitted family, with its frame, units, source and measured receipt in its comment. */
  function emit(part: IPart & { domain: [number, number] }, family: K.IStored, depth: number, engine: { engineMaxMm: number; engineMeanMm: number; scalars: number }, sections: number): string {
    const name: string = moduleName(part.name);
    const names: string[] = labels(family.layout);
    const lines: string[] = [
      "import type { AutoMovieHumanConicLoft } from \"../conic/AutoMovieHumanConicLoft\";",
      "import { AutoMovieHumanConicSection } from \"../conic/AutoMovieHumanConicSection\";",
      "import { AutoMovieHumanF1Joints } from \"./AutoMovieHumanF1Joints\";",
      "",
      "/**",
      " * f1's " + part.name + " tape wall" + (part.mirrored ? " on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly" : "") + ".",
      " *",
      " * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs",
      " * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each",
      " * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.",
      " *",
      " * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between",
      " * them: the section is a chain of conics through its four extremes" + (depth > 0 ? " and one median point per quarter" : "") + ", fitted to the convex hull of the reference skin",
      " * (the path of a taut tape).",
      " *",
      " * Source: the f1 reference " + (part.head === true ? "head" : part.whole === true ? "body and head" : "body") + " cut by this course's own planes over stations " + part.domain[0] + " to " + part.domain[1] + " mm, " + sections + " sections " + (part.step ?? STEP_MM) / 2 + " mm apart, every",
      " * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over",
      " * all sections). Regenerated through the engine's view loft from these numbers alone, " + (part.loose === true ? "the vertices of each section's hull lie" : "the reference skin's cut vertices lie"),
      " * " + engine.engineMeanMm + " mm from it on average and at most " + engine.engineMaxMm + " mm" + (part.loose === true ? "; what lies inside that hull is not modelled" : "") + ". " + engine.scalars + " independent numbers.",
      " */",
      "export const " + name + ": AutoMovieHumanConicLoft.IFamily = {",
      "  name: " + JSON.stringify(family.name) + ",",
      "  centres: " + part.course.replaceAll("J.", "AutoMovieHumanF1Joints.") + ",",
      "  halves: " + JSON.stringify(family.halves) + ",",
      "  up: " + JSON.stringify(family.up).replaceAll(",", ", ") + ",",
      "  layout: AutoMovieHumanConicSection.limb(" + depth + "),",
      "  knots: " + JSON.stringify(family.knots).replaceAll(",", ", ") + ",",
      "  values: [",
    ];
    family.values.forEach((field: number[], f: number): void => {
      lines.push("    // " + names[f], "    " + JSON.stringify(field).replaceAll(",", ", ") + ",");
    });
    lines.push("  ],");
    if (family.tips !== undefined) lines.push("", "  // The part closes in a point at `tip`, " + (typeof part.tip === "number" ? "a station placed by anatomy" : "the station where the reference's own loop vanishes") + "; its cap starts at `from`.", "  tips: " + JSON.stringify(family.tips).replaceAll("\"", "").replaceAll(",", ", ").replaceAll(":", ": ") + ",");
    if (family.reliefs !== undefined && family.reliefs.length > 0) {
      lines.push("", "  // Reliefs: heights in mm of a uniform cubic B-spline net over a window of the wall's chart, moved along `axis`; they carry the skin that lies inside the tape wall.", "  reliefs: [");
      for (const relief of family.reliefs) lines.push("    " + JSON.stringify({ ...relief, phases: relief.phases.map(round4), axis: relief.axis.map((x: number): number => Math.round(x * 1e5) / 1e5) }).replaceAll(",", ", ") + ",");
      lines.push("  ],");
    }
    lines.push("};", "");
    return lines.join("\n");
  }

  /**
   * A section loop without the stretch a neighbouring part owns: the vertices where `outside` is positive are dropped and each crossing of zero,
   * found by bisection on its edge, becomes a vertex, so the loop closes by a straight chord from where it leaves to where it returns.
   */
  function without(loop: readonly C.P[], frame: AutoMovieLoftFrame.IFrame, outside: (p: R.V) => number): C.P[] | null {
    const g = (p: C.P): number => outside([frame.origin[0] + p[0] * frame.u[0] + p[1] * frame.v[0], frame.origin[1] + p[0] * frame.u[1] + p[1] * frame.v[1], frame.origin[2] + p[0] * frame.u[2] + p[1] * frame.v[2]]);
    const values: number[] = loop.map(g);
    if (values.every((value: number): boolean => value <= 0)) return [...loop];
    const out: C.P[] = [];
    for (let i: number = 0; i < loop.length; ++i) {
      const j: number = (i + 1) % loop.length;
      if (values[i]! <= 0) out.push(loop[i]!);
      if (values[i]! <= 0 === values[j]! <= 0) continue;
      let inside: C.P = values[i]! <= 0 ? loop[i]! : loop[j]!;
      let beyond: C.P = values[i]! <= 0 ? loop[j]! : loop[i]!;
      for (let k: number = 0; k < 30; ++k) {
        const middle: C.P = [(inside[0] + beyond[0]) / 2, (inside[1] + beyond[1]) / 2];
        if (g(middle) <= 0) inside = middle;
        else beyond = middle;
      }
      out.push(inside);
    }
    return out.length < 3 ? null : out;
  }

  /** Distance from a chart point to a closed polyline, mm. */
  function distance(p: C.P, ring: readonly C.P[]): number {
    let best: number = Infinity;
    for (let i: number = 0; i < ring.length; ++i) {
      const a: C.P = ring[i]!;
      const b: C.P = ring[(i + 1) % ring.length]!;
      const dx: number = b[0] - a[0];
      const dy: number = b[1] - a[1];
      const t: number = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
      best = Math.min(best, Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy));
    }
    return best;
  }

  /** Round to a hundredth: the stored precision of a length in millimetres. */
  function round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /** Round to four decimals: the stored precision of a share. */
  function round4(value: number): number {
    return Math.round(value * 1e4) / 1e4;
  }
}
void FamilyConicBody.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});

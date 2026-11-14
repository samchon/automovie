import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { AutoMovieLoftChain, type AutoMovieLoftFrame, AutoMovieLoftRelief, AutoMovieNaturalSpline, AutoMovieViewAxis, type AutoMovieViewLoft as L, AutoMovieViewChain as Q, type IAutoMovieLoftRelief } from "@automovie/engine";
import { AutoMovieHumanConicSection as S, AutoMovieHumanF1 } from "@automovie/human";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import { FamilyConicFit as F } from "./FamilyConicFit";
import { FamilyConicLoft as K } from "./FamilyConicLoft";
import { FamilyConicRelief as H } from "./FamilyConicRelief";
import { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { FamilyConicExcursion as X } from "./FamilyConicExcursion";
import { FamilyConicLoop } from "./FamilyConicLoop";

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

  /** Rays a skin-fitted section is read along (`IPart.skin`): 0.5 degree apart, a sample every 0.2 mm on a section 25 mm across. */
  const SKIN_RAYS: number = 720;

  /** Spacing of the fitting sections, mm; the withheld sections stand midway. */
  const STEP_MM: number = 4;

  /** The limb layouts of 4 and 8 conics; the 16 conic layout fitted worse from the same start on the arm and is left out until that is understood. */
  const LIMB: { layout: C.ILayout; depth: number }[] = [0, 1].map((depth: number): { layout: C.ILayout; depth: number } => ({ layout: C.limb(depth), depth }));

  /** A part symmetric about the median plane: front and back on the median line, the half reflected; fitted at depth 1 from each section's own reading. */
  const BILATERAL: { layout: C.ILayout; depth: number }[] = [{ layout: C.bilateral(1), depth: 1 }];


  /**
   * `--trunk-lines`: the trunk fitted to its skin with the median lines as feature lines (`FamilyConicSection.featured`): after the front
   * extreme an inflection and a crest, so the front median may stand in a groove (the crotch's notch, the linea alba, the navel, the
   * sternal groove, the suprasternal notch), then the off-axis groove between the front and the side as an inflection, a floor and an
   * inflection (the inguinal crease, the lateral chest pocket and the supraclavicular hollow, the hollows under the jaw), after the side
   * extreme the same groove behind it (the posterior axillary fold, the latissimus's edge where the arm's opening meets the back: on f1 at
   * 1,308 mm a pair of inflections at 110 and 116 degrees bending 25 degrees, the counterpart of the anterior fold's pair at 74 and 82, which
   * the back's single line could not both hold), and before the back extreme a crest and an inflection (the natal cleft, the spinal furrow).
   * Where a groove fades its anchors lie on a smooth stretch.
   */
  const TRUNK_LINES: boolean = process.argv.includes("--trunk-lines");
  //
  // Both medians of `bilateral(1)` stand as feature anchors (`AutoMovieHumanConicSection.featured`, `freed`): a median beside inserted
  // features re-resolves on them and moves (the stored bilateral wall converted with its medians kept stood 4.9 mm off itself there,
  // `test_human_conic_featured`), so the trunk's stored wall converts onto this layout and its features are fitted on it. A feature's
  // `window` is a share of its run's arclength where its observation is sought when a section seeds it (`FamilyConicSection`), not a
  // stored field; the freed medians' windows stay inside the model's share bounds (0.03, 0.97) all the same.
  const TRUNK_RUNS: S.IFeatureRun[] = [
    { after: 0, anchors: [{ kind: "f", feature: "inflection", window: [0.02, 0.25] }, { kind: "f", feature: "convex", window: [0.05, 0.4] }, { kind: "f", feature: "inflection", window: [0.2, 0.6] }, { kind: "f", feature: "concave", window: [0.3, 0.8] }, { kind: "f", feature: "inflection", window: [0.45, 0.95] }] },
    { after: 2, anchors: [{ kind: "f", feature: "inflection", window: [0.02, 0.35] }, { kind: "f", feature: "concave", window: [0.05, 0.45] }, { kind: "f", feature: "inflection", window: [0.1, 0.55] }] },
    { after: 3, anchors: [{ kind: "f", feature: "convex", window: [0.3, 0.9] }, { kind: "f", feature: "inflection", window: [0.6, 0.97] }] },
  ];
  const TRUNK_LINED: { layout: C.ILayout; depth: number }[] = [{ layout: ((layout: C.ILayout): C.ILayout => ({ ...layout, anchors: layout.anchors.map((anchor: C.IAnchor, k: number): C.IAnchor => (anchor.kind === "f" && anchor.window === undefined ? { ...anchor, window: k < 7 ? [0.6, 0.95] : [0.05, 0.5] } : anchor)) }))(S.featured(C.bilateral(1), TRUNK_RUNS, process.argv.includes("--kept-medians") ? [] : [1, 3])), depth: 1 }];
  // `--kept-medians`: the same runs with both medians kept as medians, the layout `--trunk-lines` had before the medians were freed, to
  // compare the two on one target.

  /** `--concha-course=<x,y,z>/<x,y,z>`, `--concha-domain=<from>,<to>`, `--concha-tip=<station>`: a trial course, domain and tip for the ear's hollow. */
  const CONCHA_TRIAL: R.V[] | undefined = process.argv
    .find((argument: string): boolean => argument.startsWith("--concha-course="))
    ?.slice("--concha-course=".length)
    .split("/")
    .map((centre: string): R.V => centre.split(",").map(Number) as R.V);
  const CONCHA_DOMAIN: [number, number] = (process.argv.find((argument: string): boolean => argument.startsWith("--concha-domain="))?.slice("--concha-domain=".length).split(",").map(Number) ?? [11.5, 23]) as [number, number];
  /** `--concha-floor=<mm>`: how near the median plane the trial cutter's sections may read, in place of the ear's box (77). `--concha-up=x,y,z`: its chart's up. */
  const CONCHA_FLOOR: number = Number(process.argv.find((argument: string): boolean => argument.startsWith("--concha-floor="))?.slice("--concha-floor=".length) ?? 77);
  const CONCHA_UP: R.V = (process.argv.find((argument: string): boolean => argument.startsWith("--concha-up="))?.slice("--concha-up=".length).split(",").map(Number) ?? [0, 1, 0]) as R.V;
  /** `--concha-box=<x0>,<x1>,<y0>,<y1>`: the trial cutter's sections are read inside this box, mm (no bound). */
  const CONCHA_BOX: number[] = process.argv.find((argument: string): boolean => argument.startsWith("--concha-box="))?.slice("--concha-box=".length).split(",").map(Number) ?? [-Infinity, Infinity, -Infinity, Infinity];
  /** `--concha-depth=<half width>`: the trial cutter's sections are read from the skin's depth along its course (see `depthLoop`). */
  const CONCHA_DEPTH: number | undefined = ((d: string | undefined): number | undefined => (d === undefined ? undefined : Number(d)))(process.argv.find((argument: string): boolean => argument.startsWith("--concha-depth="))?.slice("--concha-depth=".length));
  /** `--concha-lead=<mm>`: how far the trial cutter is carried straight back from its first section (12). */
  const CONCHA_LEAD: number = Number(process.argv.find((argument: string): boolean => argument.startsWith("--concha-lead="))?.slice("--concha-lead=".length) ?? 12);
  const CONCHA_TIP: number = Number(process.argv.find((argument: string): boolean => argument.startsWith("--concha-tip="))?.slice("--concha-tip=".length) ?? 24.5);

  /** The ear's phase pitch (`--ear-pitch=<mm>`): at the model's 4 mm the rim's top drew a row of teeth. */
  const EAR_PITCH: number = Number(process.argv.find((argument: string): boolean => argument.startsWith("--ear-pitch="))?.slice("--ear-pitch=".length) ?? 1.5);

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

  /**
   * The arm's course past the middle finger's first joint, mm: on toward the four fingers' mean first-segment direction by `reach`, turned
   * there over `half` on either side of the joint. The turn is 24 degrees (from the line from the wrist to the middle finger's first joint),
   * so its radius is `2 half / 0.41`: a course folds where its turn's radius is smaller than the section it carries. At 12 mm, a radius of
   * 59 mm, the hand's sections crossed at its ulnar edge from 581 to 588 mm (each phase's point advancing along the course between rings
   * 1 mm apart, down to -0.21 mm at [155, 914, 462]: the edge stands about 69 mm inside the turn), a fold of 168 degrees and the ragged
   * patch beside the little finger; at 16 mm, 78 mm, the least advance is 0.09 mm. At 10 mm the thumb's merge held and at 14 mm it was
   * lost on a wall refitted there; on the wall fitted at 12 mm the thumb merges at 16. On that course the hand is one loop round it to 596 mm, the little finger parts at 597, the index
   * finger at 601 and the ring and middle fingers at 603 (every plane's loops 2 mm apart), so the hand's sections run to `end` and its end
   * is split there into the fingers. Its reliefs end at `relief`, before the turn: the net round the hand, the knuckles' cast and a hollow
   * window carried on to the end each drew a jagged band across the knuckles, which the wall alone draws smooth.
   */
  const KNUCKLE: { half: number; reach: number; end: number; relief: number } = { half: 16, reach: 40, end: 595, relief: 575 };

  /**
   * The hand's own family (part `hand`): from `HAND_FROM` mm on the arm's course, the arm's end left open 3 mm before it and joined by
   * a band, on a knuckle turn of `HAND_KNUCKLE_HALF` mm a side (radius about 107 mm against the ulnar edge's 69 mm inside the turn).
   * Refitted from 470 mm on this turn the end fitted at 0.35 mm mean and 3.6 at most against 0.48 and 6.5 on the arm's 16 mm turn.
   */
  const HAND_FROM: number = 448;
  const HAND_KNUCKLE_HALF: number = 22;

  /**
   * The net over the palm on to the hand's end, mm and radians of the arm's chart. Past `KNUCKLE.relief` the arm's wall alone is the taut
   * tape across the palm's hollow and the bases of the middle and ring fingers: read every 2.5 mm from 550 to 595 mm at 32 phases (the
   * wall's signed distance to the reference's nearest triangle), the bare wall stands 8 to 15 mm proud at phases 0.8 to 2.4 rad, the palm
   * side, and with the hand's net, which falls to nothing before 575 mm, it was still 7 to 13 mm proud from 570 mm to the end ring, whose
   * bands carried 4 to 6 mm of it on to the fingers, the worst cells on the whole skin's map. Only the palm is netted to the end, so
   * the knuckles keep the wall the jagged band was taken from. The window runs on to the fitted cap's tip, 15 mm past the end, since a
   * net's last three rows are zero and a relief must vanish at a pole, and fades in over 20 mm across the hand's net and over 0.4 rad at each side; 16 by 16 heights are about 5 mm along and 7 mm round.
   */
  const PALM: { stations: [number, number]; phases: [number, number]; fade: [number, number]; fadePhase: [number, number]; rows: number; columns: number } = { stations: [545, 610], phases: [0.3, 2.8], fade: [20, 0], fadePhase: [0.4, 0.4], rows: 16, columns: 16 };

  /**
   * The leg's course past the ball of the foot, mm, as the arm's past the knuckles (`KNUCKLE`): on toward the five toes' mean first-segment
   * direction, a turn of 15 degrees from the line from the ankle to the ball of the foot, over `half` on either side (radius 79 mm, outside
   * the forefoot's half thickness of about 20 mm). On that course the foot is one loop to 976 mm, the little toe parts at 977, the ring toe at
   * 987, the big toe at 991 and the middle and index toes at 993 (every plane's loops 2 mm apart). Its reliefs end at `relief`, before the
   * turn.
   */
  const TOE_TURN: { half: number; reach: number; end: number; relief: number } = { half: 10, reach: 40, end: 975, relief: 960 };

  /**
   * A trial stretch of the leg fitted to its skin with grooves (`--segment`), or none. `--segment-features=<after>:<from>:<to>;...` puts a
   * groove of three feature anchors (an inflection, the concave floor, an inflection) after a limb anchor, inside the share `[from, to]`
   * of the arclength to the next one (`FamilyConicSection.featured`), where `inflected` seats a groove only after a `u` extreme.
   */
  const SEGMENT: { domain: [number, number]; grooves: number[]; features: { after: number; anchors: C.IAnchor[] }[]; up: R.V; gap: number } | undefined = ((arg: string | undefined): { domain: [number, number]; grooves: number[]; features: { after: number; anchors: C.IAnchor[] }[]; up: R.V; gap: number } | undefined =>
    arg === undefined
      ? undefined
      : {
          domain: arg.split(",").map(Number) as [number, number],
          features: (process.argv.find((a: string): boolean => a.startsWith("--segment-features="))?.slice("--segment-features=".length) ?? "").split(";").filter((x: string): boolean => x.length > 0).map((spec: string): { after: number; anchors: C.IAnchor[] } => {
            const [after, from, to] = spec.split(":").map(Number) as [number, number, number];
            const w: number = to - from;
            return { after, anchors: [{ kind: "f", feature: "inflection", window: [from, from + 0.55 * w] }, { kind: "f", feature: "concave", window: [from + 0.2 * w, to - 0.2 * w] }, { kind: "f", feature: "inflection", window: [from + 0.45 * w, to] }] as C.IAnchor[] };
          }),
          grooves: (process.argv.find((a: string): boolean => a.startsWith("--segment-grooves="))?.slice("--segment-grooves=".length) ?? "").split(",").filter((x: string): boolean => x.length > 0).map(Number),
          up: (process.argv.find((a: string): boolean => a.startsWith("--segment-up="))?.slice("--segment-up=".length) ?? "1,0,0").split(",").map(Number) as R.V,
          gap: Number(process.argv.find((a: string): boolean => a.startsWith("--segment-gap="))?.slice("--segment-gap=".length) ?? 6),
        })(process.argv.find((a: string): boolean => a.startsWith("--segment="))?.slice("--segment=".length));

  /**
   * Where the breast's course starts and ends, mm: `AutoMovieHumanF1Joints.breastRoot` and `breastTip`. The course runs through the dome's
   * top along the skin's normal there, from 30 mm behind the top to 8 mm past it. The top, [126.8, 1261.2, 70.4], is the skin's point
   * farthest along that normal within 60 mm of the foremost point, and the normal, [0.9801, 0.093, 0.1753], is the vector area of the skin
   * within 12 mm of the top; the two agree with each other from the first pass on (`dometop`, a scratch probe). The course first tried ran
   * through the skin's foremost point along the vector area of the skin within 70 mm, [0.9793, 0.0502, 0.1961]: the dome's top lay 7.6 mm
   * above and 10 mm lateral of that course, every section near the front stood off it by as much, and the cap, which shrinks a section
   * toward the course, drew a rim where it started.
   */
  const BREAST_ROOT: R.V = [97.4, 1258.41, 65.14];
  const BREAST_TIP: R.V = [134.64, 1261.94, 71.8];

  /**
   * Radius of the cylinder about the breast's course inside which its sections read the skin, mm. From 11 mm along the course the skin
   * there is one loop inside 58 mm at every phase, the upper slope's widest; the fold under the breast stands 48 to 52 mm out
   * (`breastaxis`, a scratch survey of the skin's profile in half-planes about the course).
   */
  const BREAST_RADIUS_MM: number = 62;

  /** How far a point stands outside the breast's cylinder, mm; negative inside it. */
  function breast(p: R.V): number {
    return breastFrame(p)[1] - BREAST_RADIUS_MM;
  }

  /**
   * How far from the breast's course the trunk's sections leave the skin out, mm, at the clocks `2 pi j / 8` round it: 0 up, a quarter turn
   * to the side, a half turn down, three quarters toward the median line. The trunk's sections leave the breast out as they leave out the
   * arms and the nose, so that the trunk's skin round the port is its own: with the breast in them, the reliefs drew the fold as a soft
   * shelf. Under the breast, down and down inward, it is 1.5 mm inside the fold's foot, where the chest begins
   * (`AutoMovieHumanF1.BREAST_CHEST_MM`; the skin's profile about the course, `breastaxis`: straight down the chest stands level 24 to
   * 26 mm behind the top from 52 mm out, down and inward 21 mm behind it from 50 mm out), so the breast's underside is left out down to
   * the fold's foot and the band spans the fold. Elsewhere it is 1 mm inside
   * the breast's ring at its rail (56.5 mm up, 46.5 to the side, 49 inward, 42 down and to the side, read off the breast's fitted wall at
   * 12 mm), so the trunk's reliefs see the skin up to the ring and the band joins two walls that agree: left out to 1.5 mm inside the
   * loop, they fell away inside it and drew a groove along the loop over the upper inner slope on `fold.front`.
   */
  const BREAST_CLIP_MM: number[] = [55.5, 51, 45.5, 41, 50.5, 48.5, 48, 52];

  /**
   * How far a point stands inside the skin either breast leaves to the trunk, mm, positive inside: nearer either breast's course than
   * `BREAST_CLIP_MM`, and in front of the course's root.
   */
  function breasts(p: R.V): number {
    return Math.max(
      ...[1, -1].map((side: number): number => {
        const [along, r, psi]: [number, number, number] = breastFrame([p[0], p[1], side * p[2]]);
        return Math.min(along, BREAST_CLIP(psi) - r);
      }),
    );
  }

  /** `BREAST_CLIP_MM` round the clock, by the periodic cubic. */
  const BREAST_CLIP: (psi: number) => number = AutoMovieNaturalSpline.periodic(BREAST_CLIP_MM);

  /**
   * The breast's last fitted section and the station its cap starts at, mm along its course; the top is 30 mm along it and the loop
   * vanishes at 29.88 (`--breast=<to>,<cap>` for a trial). Within 2 mm of the top the sections are 16 to 22 mm across over a dome less than
   * a millimetre high, and fitted to 29.5 mm they missed by 4.1 mm there; to 28 mm the wall is 105 numbers at 0.12 mm, and the cap from
   * 26 mm, 3.9 mm long, continues the dome with no rim on `fold.front`.
   */
  const [BREAST_TO, BREAST_CAP]: number[] = (process.argv.find((argument: string): boolean => argument.startsWith("--breast="))?.slice(9) ?? "28,26").split(",").map(Number);

  /**
   * A +Z point's station along the breast's course from its root, its distance from that course, mm, and its clock about the course,
   * radians: 0 up, a quarter turn to +Z.
   */
  function breastFrame(p: R.V): [number, number, number] {
    const d: R.V = [BREAST_TIP[0] - BREAST_ROOT[0], BREAST_TIP[1] - BREAST_ROOT[1], BREAST_TIP[2] - BREAST_ROOT[2]];
    const length: number = Math.hypot(d[0], d[1], d[2]);
    const w: R.V = [d[0] / length, d[1] / length, d[2] / length];
    const q: R.V = [p[0] - BREAST_ROOT[0], p[1] - BREAST_ROOT[1], p[2] - BREAST_ROOT[2]];
    const along: number = q[0] * w[0] + q[1] * w[1] + q[2] * w[2];
    const off: R.V = [q[0] - along * w[0], q[1] - along * w[1], q[2] - along * w[2]];
    const up: R.V = [-w[1] * w[0], 1 - w[1] * w[1], -w[1] * w[2]];
    const side: R.V = [w[1] * up[2] - w[2] * up[1], w[2] * up[0] - w[0] * up[2], w[0] * up[1] - w[1] * up[0]];
    const psi: number = Math.atan2(off[0] * side[0] + off[1] * side[1] + off[2] * side[2], off[0] * up[0] + off[1] * up[1] + off[2] * up[2]);
    return [along, Math.hypot(off[0], off[1], off[2]), psi < 0 ? psi + 2 * Math.PI : psi];
  }

  /** Half length of the shoulder's turn, mm. */
  const SHOULDER_HALF_MM: number = 65;

  /** Radius about the upper arm's axis inside which skin past the armscye plane is the arm's, mm; the hips, as far to the side, lie outside it. */
  const ARM_TUBE_MM: number = 75;

  /** How far proximal of the shoulder joint the arm's ISB course starts, mm, on the humerus's axis: past the armscye loop's most proximal point, 44 mm. */
  const ISB_PROXIMAL_MM: number = 60;

  /** The least shoulder of a closure across an opening (`without`): the model's share bound (`AutoMovieHumanConicSection`'s `EDGE`). */
  const CLOSURE_LEAST: number = 0.03;

  /**
   * The ear's box, mm: lateral of the sagittal plane the auricle leaves the skull at, and inside the auricle's extent fore and aft and in height,
   * read off `FamilyConicScan.ts ear`. Positive inside the box on either side of the head.
   */
  function ear(p: R.V): number {
    return Math.min(Math.abs(p[2]) - 77, p[0] + 10, 26 - p[0], p[1] - 1538, 1602 - p[1]);
  }

  /** The plate's course, halves, fitted stations and thickness (`--plate=<json>`, `--plate-halves`, `--plate-domain`, `--plate-thickness`). */
  const PLATE: R.V[] = JSON.parse(process.argv.find((a: string): boolean => a.startsWith("--plate="))?.slice("--plate=".length) ?? "[[12,1538,80],[12,1604,80]]");
  const PLATE_HALVES: number[] = JSON.parse(process.argv.find((a: string): boolean => a.startsWith("--plate-halves="))?.slice("--plate-halves=".length) ?? "[]");
  const PLATE_DOMAIN: number[] = (process.argv.find((a: string): boolean => a.startsWith("--plate-domain="))?.slice("--plate-domain=".length) ?? "6,58").split(",").map(Number);
  const PLATE_THICKNESS: number = Number(process.argv.find((a: string): boolean => a.startsWith("--plate-thickness="))?.slice("--plate-thickness=".length) ?? 4);
  /**
   * The plate's limb depth (`--plate-depth`). Four anchors: a lens is two ends and two faces, and with a median on each quarter the
   * medians ran into the lens's corners and wandered along its flat faces between stations, where the construction refused the chain
   * between them; four conics fit each lens alone to 0.03 to 0.1 mm mean.
   */
  const PLATE_DEPTH: number = Number(process.argv.find((a: string): boolean => a.startsWith("--plate-depth="))?.slice("--plate-depth=".length) ?? 0);
  /**
   * The plate read in the lens layout (`--plate-lens`, `AutoMovieHumanConicSection.lens`): its chart turned a further quarter turn, so the
   * lens's length lies along `v`, its faces' extremes on the median line where the course crosses it. On four free extremes the face's
   * extreme still wandered from end to end of the flat face between stations (bowed 1 mm), and the construction refused the chain there.
   */
  const PLATE_LENS: boolean = process.argv.includes("--plate-lens");
  /** How far short of the outermost skin the plate stops, under the helix's tube, mm (`--plate-rim`, `FamilyConicExcursion.plate`). */
  const PLATE_RIM: number = Number(process.argv.find((a: string): boolean => a.startsWith("--plate-rim="))?.slice("--plate-rim=".length) ?? 3);
  /** The plate's deepest floor, mm (`--plate-deepest`, `FamilyConicExcursion.plate`). */
  const PLATE_DEEPEST: number = Number(process.argv.find((a: string): boolean => a.startsWith("--plate-deepest="))?.slice("--plate-deepest=".length) ?? 2 * PLATE_THICKNESS);
  /**
   * The lobule's depth (`--plate-lobe=<deepest>,<to>,<from>`): up to station `to` the plate's floor may lie `deepest` mm inside its
   * cranial skin, falling smoothly to `PLATE_DEEPEST` at station `from`, so the plate is the whole lobule, whose lens has no hollows,
   * and no second family shares its cranial face (an earlobe of its own, merged on the plate, met it along that face and the merge's
   * walk was lost there).
   */
  const PLATE_LOBE: number[] | undefined = process.argv.find((a: string): boolean => a.startsWith("--plate-lobe="))?.slice("--plate-lobe=".length).split(",").map(Number);
  // The fall is the smoothstep `3 x^2 - 2 x^3` of the share `x` between the two stations, so the floor's slope along the course does not
  // jump at either end: a linear fall left a crease across the plate's face at each of its ends.
  const plateDeepest = (s: number): number => {
    if (PLATE_LOBE === undefined) return PLATE_DEEPEST;
    const x: number = Math.min(1, Math.max(0, (s - PLATE_LOBE[1]!) / (PLATE_LOBE[2]! - PLATE_LOBE[1]!)));
    return PLATE_LOBE[0]! + (PLATE_DEEPEST - PLATE_LOBE[0]!) * x * x * (3 - 2 * x);
  };
  /** The plate's roll (`--plate-roll=<station>:<radians>,...`), laid through its lenses' `principal` angles; absent, none. */
  const PLATE_ROLL: K.IStored["roll"] = ((text: string | undefined): K.IStored["roll"] => {
    if (text === undefined) return undefined;
    const pairs: number[][] = text.split(",").map((pair: string): number[] => pair.split(":").map(Number));
    // In the lens layout the chart turns a further quarter turn, so the lens's length, read at these angles along `u`, lies along `v`.
    return { knots: pairs.map((pair: number[]): number => pair[0]!), values: pairs.map((pair: number[]): number => Math.round((pair[1]! + (PLATE_LENS ? Math.PI / 2 : 0)) * 1e4) / 1e4) };
  })(process.argv.find((a: string): boolean => a.startsWith("--plate-roll="))?.slice("--plate-roll=".length));

  /** The pinna's course (`--pinna=<json>`), through the root of each section, so its course point lies inside every section and its rays see the skin. */
  const PINNA: R.V[] = JSON.parse(process.argv.find((a: string): boolean => a.startsWith("--pinna="))?.slice("--pinna=".length) ?? "[[16,1540,70],[5,1560,69],[4,1575,70],[10,1590,73],[11,1604,75]]");
  const PINNA_HALVES: number[] = JSON.parse(process.argv.find((a: string): boolean => a.startsWith("--pinna-halves="))?.slice("--pinna-halves=".length) ?? "[4,4,4]");
  /**
   * The pinna's fitted stations (`--pinna-domain`), mm along its course, its least knot gap, its limb depth and its grooves
   * (`--pinna-grooves=<anchor indices>`, `FamilyConicSection.inflected`).
   *
   * Where a groove may stand, measured on the pinna's upper sections with `limb(1)` (anchors `+u, m, +v, m, -u, m, -v, m`): after a `u`
   * guide (anchors 0 and 4) the projected seed is an admissible chain; after a `v` guide or a median (1, 2, 3, 5, 6, 7) it is not, since the
   * groove's first inflection then stands on the chord from a median to the next guide, an arc already halved, whose end tangents leave the
   * inflection's tangent no room to turn back and keep both arcs' tangent lines meeting ahead. Place a groove after the guide whose arc the
   * section bends inward on, and read where that is with `--kernels` and the sections' sign changes (`FamilyConicExcursion.inflections`).
   */
  const PINNA_DOMAIN: number[] = (process.argv.find((a: string): boolean => a.startsWith("--pinna-domain="))?.slice("--pinna-domain=".length) ?? "6,58").split(",").map(Number);
  const PINNA_GAP: number = Number(process.argv.find((a: string): boolean => a.startsWith("--pinna-gap="))?.slice("--pinna-gap=".length) ?? 4);
  const PINNA_DEPTH: number = Number(process.argv.find((a: string): boolean => a.startsWith("--pinna-depth="))?.slice("--pinna-depth=".length) ?? 1);
  /**
   * `--arm-grooves=<anchor indices>`: the arm fitted with a groove `[i, m, i]` after each listed anchor of `limb(1)`
   * (`FamilyConicSection.inflected`), for the hand end's dorsal valleys; with `--arm-skin` to the skin itself rather than its hull. A trial;
   * the stored arm uses neither.
   */
  const ARM_GROOVES: number[] = (process.argv.find((a: string): boolean => a.startsWith("--arm-grooves="))?.slice("--arm-grooves=".length) ?? "").split(",").filter((x: string): boolean => x.length > 0).map(Number);
  /** `--arm-features=<anchor indices>`: the arm fitted with a groove of three feature anchors (`FamilyConicSection.featured`) after each listed anchor of `limb(1)`; a trial. */
  const ARM_FEATURES: number[] = (process.argv.find((a: string): boolean => a.startsWith("--arm-features="))?.slice("--arm-features=".length) ?? "").split(",").filter((x: string): boolean => x.length > 0).map(Number);
  /** `--hand-features=<anchor indices>`, as `--arm-features` on the hand's own family, with `--hand-skin` fitted to the skin; a trial. */
  const HAND_FEATURES: number[] = (process.argv.find((a: string): boolean => a.startsWith("--hand-features="))?.slice("--hand-features=".length) ?? "").split(",").filter((x: string): boolean => x.length > 0).map(Number);
  /** A `limb(1)` layout with a groove of three feature anchors, an inflection, a concave floor and an inflection, after each listed anchor. */
  const featureGrooves = (after: number[]): { layout: C.ILayout; depth: number }[] => [
    {
      layout: C.featured(
        C.limb(1),
        after.map((anchor: number) => ({
          after: anchor,
          anchors: [
            { kind: "f" as const, feature: "inflection" as const, window: [0.15, 0.45] as [number, number] },
            { kind: "f" as const, feature: "concave" as const, window: [0.3, 0.7] as [number, number] },
            { kind: "f" as const, feature: "inflection" as const, window: [0.55, 0.85] as [number, number] },
          ],
        })),
      ),
      depth: 1,
    },
  ];
  const PINNA_GROOVES: number[] = (process.argv.find((a: string): boolean => a.startsWith("--pinna-grooves="))?.slice("--pinna-grooves=".length) ?? "").split(",").filter((x: string): boolean => x.length > 0).map(Number);

  /**
   * The nose's box, mm. Positive inside the box.
   *
   * Its frontal plane stands just in front of the alar groove, the crease round each wing, so the wings are the nose's own sections and
   * not the port's band. Level sections of the reference head (`FamilyConicScan.ts alar`, 2 mm apart) put that crease at 110.2 to 111.6 mm forward
   * and 18.2 to 20 mm to the side from 1,546 to 1,558 mm, and the wing's outer face beside it nearly sagittal, 17.6 to 18.5 mm out from
   * 112 to 120 mm forward; the plane at 113 mm crosses that face 1.5 to 3 mm in front of the crease. Under the wings the alar base meets
   * the lip at 1,544 to 1,545 mm and the columella meets it at 1,542.5 mm (the subnasale), so the box starts at 1,543 mm. Across and at
   * the top it keeps the earlier extent read off `FamilyConicScan.ts nose`: the wings stand within 18.5 mm of the median plane, and above
   * 1,582 mm the dorsum is the face's. Before this the plane stood at 122 mm, in front of the wings, which the band then had to span.
   *
   */
  function nose(p: R.V): number {
    return Math.min(p[0] - 113, 19 - Math.abs(p[2]), p[1] - 1543, 1582 - p[1]);
  }

  /**
   * What the trunk leaves to the nose, mm, positive inside: the nose's box, less the sidewalls above the wings. There the sidewall runs
   * into the cheek with no crease (from 1,566 mm the level loops slope on smoothly from it to the cheek, `FamilyConicScan.ts alar`), so the
   * face keeps it as before: the front rises from 113 mm at the wings' top, 1,562 mm, to 122 mm at 1,572 mm by the smooth step. The nose's
   * own sections still read the sidewalls from 113 mm (with a front that rises there, its first sections were wide slabs whose top climbed
   * 20 mm in 9 mm of station, which no fit of 8 conics held); its band lands far enough in there to leave them to the face.
   */
  function noseCut(p: R.V): number {
    const t: number = Math.min(1, Math.max(0, (p[1] - 1562) / 10));
    // The box's floor fades into the face: over the first `NOSE_FLOOR_MM[1]` mm above it the frontal plane stands up to `NOSE_FLOOR_MM[0]`
    // mm farther forward, so the trunk's sections leave out less of the nose's base the nearer they are to the floor. Cut level at
    // 1,543 mm, the nets over the face observed below it and not above, and the upper lip and the cheeks beside the wings turned by 6
    // degrees in one level line there (`mouth.front` px 0..240 x 240).
    const f: number = Math.min(1, Math.max(0, (p[1] - 1543) / NOSE_FLOOR_MM[1]));
    return Math.min(nose(p), p[0] - (113 + 9 * t * t * (3 - 2 * t) + NOSE_FLOOR_MM[0] * (1 - f * f * (3 - 2 * f))));
  }

  /**
   * How far forward the nose's frontal plane stands at its box's floor, mm, and over how much height it comes back, mm (`noseCut`). At 12 mm
   * the plane stood at 125 mm at the floor and still cut the columella and the wings (to 131.9 mm), and a level line stayed across the upper
   * lip at 1,543 mm; at 20 mm nothing of the nose is cut at the floor.
   */
  const NOSE_FLOOR_MM: [number, number] = [20, 8];

  /**
   * Where the head's nets are held on the wall under the ear, mm, positive inside: the ear's cut (`ear`) less the concha's bowl. Held over
   * the whole cut, the head's skin under the bowl stood up to 8.3 mm farther out ([10.5, 1566, 77.9]), past the rail the concha's cutter
   * trims on the antihelix, and its cut kept neither side; the bowl, x 5 to 23, 1,557 to 1,569 mm high on the merged ear, keeps its nets.
   */
  function earHeld(p: R.V): number {
    return Math.min(ear(p), -Math.min(p[0] - 2, 26 - p[0], p[1] - 1554, 1572 - p[1]));
  }

  /**
   * The net over the nose's sidewalls (`nose.side`), as `rows,columns,from,to,phase,reach,fade,fadePhase,top[,fadeIn[,held]]`: mirrored
   * across the dorsum to `phase` rad either side and cast inward round the course, the skin above `top` mm (the box's chord under the
   * dorsum) left unobserved, faded in over `fadeIn` mm and held at zero up to `held` mm past the rail curve; `--side-net=` overrides it.
   * It carries the supra-alar hollow, 1.4 to 1.5 mm under the hull from 114 to 120 mm forward. It starts at 3 mm, before the nose's first
   * section (rays are cast from 5.5 mm, `observe`), so it is whole where the band lands and the band takes the dented ring; zero at 5.5 mm,
   * faded in, or held at zero past the rail, its edge drew a line along the rail. The band carries the hollow on behind the rail by its own
   * cross profile (`AutoMovieHumanF1.ts`, `NOSE_PROFILES`); without that profile the dented ring left a valley along the rail.
   */
  const SIDE_NET: number[] = (process.argv.find((a: string): boolean => a.startsWith("--side-net="))?.slice(11) ?? "19,41,3,20,2,3,4,0.25,1576").split(",").map(Number);

  /**
   * `--nose-grooves=<anchors>`: the nose fitted to its skin (`IPart.skin`, outermost crossing) with a groove of two inflection lines after
   * each listed anchor of the depth-1 limb layout (`inflected`), its nostrils' pits left out so the cutters keep them, and no cast nets.
   */
  /** `--feature-knot=<mm>`: a family with feature lines starts from knots this far apart; absent, from the domain's ends and middle. */
  const FEATURE_KNOT_MM: number | undefined = ((value: string | undefined): number | undefined => (value === undefined ? undefined : Number(value)))(process.argv.find((a: string): boolean => a.startsWith("--feature-knot="))?.slice(15));
  /** A feature's depth, mm, past which it counts as present (`--feature-knots`). */
  const FEATURE_DEPTH_MM: number = 0.3;
  /** Sections in the running median a feature's depth is read through (`--feature-knots`): 5, two either side, at 1 mm steps. */
  const FEATURE_MEDIAN: number = 5;

  const NOSE_FEATURES: boolean = process.argv.includes("--nose-features");
  const NOSE_VERTICAL: boolean = process.argv.includes("--nose-vertical");
  const NOSE_DEPTH: number = Number(process.argv.find((a: string): boolean => a.startsWith("--nose-depth="))?.slice(13) ?? 1);
  /**
   * `--nose-wing`: the vertical nose's half section on all its feature lines, read from the turning along the excursion's level sections
   * (scratch probe over `FamilyConicExcursion.ts nose`, turning over 1.5 mm either side, as `FamilyConicSection.feature` reads it). From the
   * front's extreme round to the root, where the skin meets the excursion's closing cubic in a convex corner of 0.9 to 1.7 rad at every
   * level (the side extreme, `v` max, 17 to 20 mm out): the tip's convexity; from 1544 to 1550 mm the alar crease, concave by 0.3 to 0.97
   * rad, 6 to 7 mm forward of the course and 8 to 11 out; the wing's crest, convex by 0.5 to 1.2 rad, 9 to 14 mm forward and 11 to 14 out;
   * then at every level a shallow concave turn of 0.06 to 0.25 rad 3 to 4 mm forward of the root, the alar-facial turn on the wing's levels
   * and the nasofacial one above them. So the half is the front, an inflection, the crease's floor, an inflection, the crest, an inflection
   * and the alar-facial turn, then the root's corner. Each window is a share of the stretch from the anchor placed before it to the root's
   * corner (`FamilyConicSection.feature`), read off those turnings: on the wing's levels the crease stands at about 0.55 of the front-to-root
   * arclength, the crest at 0.8 and the turn at 0.95. The trial before it (`--nose-root-groove`) put the turn after the side extreme, on the
   * closing cubic inside the face, and fitted at 2.24 mm. The alar rim, nearly level, crosses the level sections rather than running along
   * them, so it is not a feature line of this course but the stations where the crease and the crest fade (`--feature-knots`).
   */
  const NOSE_WING_LINES: boolean = process.argv.includes("--nose-wing");
  /**
   * The vertical nose's admissibility margin (`IPart.margin`, `FamilyConicFit.ADMISSIBLE_MARGIN`): at the default 0.1 of each arc's chord
   * its fit came to 2.41 mm against 0.86 without one, since a fading feature's arcs lie nearly on their chords. What a margin must cover is
   * the drift of `a` and `b` between the fitted and the stored, realized family: the stored rounding (0.01 mm over the shortest feature
   * arcs, about 1 mm, is 0.01 of the chord; 1e-4 rad of heading is less) and the engine's spline between the 0.25 mm stations the fit
   * checks. 0.02 is twice the rounding's worst.
   */
  const NOSE_MARGIN: number = Number(process.argv.find((a: string): boolean => a.startsWith("--nose-margin="))?.slice(14) ?? 0.02);
  const NOSE_WING: C.ILayout = C.featured(C.bilateral(NOSE_DEPTH), [
    {
      after: 0,
      anchors: [
        { kind: "f", feature: "inflection", window: [0.15, 0.6] },
        { kind: "f", feature: "concave", window: [0.05, 0.5] },
        { kind: "f", feature: "inflection", window: [0.05, 0.6] },
        { kind: "f", feature: "convex", window: [0.1, 0.8] },
        { kind: "f", feature: "inflection", window: [0.2, 0.8] },
        { kind: "f", feature: "concave", window: [0.3, 0.95] },
        // The skin's corner into the guided closure (`FamilyConicExcursion.IPart.guided`): the closure leaves the skin along its direction
        // and bends outward to its side extreme, so the corner is an inflection with its own tangent, between the turn and the guide.
        { kind: "f", feature: "inflection", window: [0.2, 1] },
      ],
    },
  ]);
  const NOSE_GROOVES: number[] | undefined = process.argv.find((a: string): boolean => a.startsWith("--nose-grooves="))?.slice(15).split(",").filter((x: string): boolean => x.length > 0).map(Number);

  /** Where the nose's band lands on it at a phase, mm from its first station (`AutoMovieHumanF1.NOSE_RAILS_MM`). */
  const NOSE_RAIL: (phi: number) => number = AutoMovieNaturalSpline.periodic(AutoMovieHumanF1.NOSE_RAILS_MM);

  /**
   * `--mouth-net=<rows>,<columns>`: the mouth's net's control points (`trunk.mouth`); absent, 21 by 37, about 1.8 mm a row and 2.8 mm a
   * column. At 27 by 67, 1.5 mm each way, it fitted the sections seen by its fit to 0.53 mm and the withheld ones to 2.11: it followed the
   * reference's facets, and sampled along a level line every 0.6 mm the lips turned by 0 to 5 degrees and back between samples, a ripple
   * that flat shading drew as blocks of light and dark (mouth.front px 200..720 x 330..640). At 21 by 37 the turns run smoothly (1.1 mm
   * fitted, 2.07 withheld, the slit between the lips); at 15 by 37 the slit stood wider in profile.
   */
  const MOUTH_NET: [number, number] = (process.argv.find((a: string): boolean => a.startsWith("--mouth-net="))?.slice(12).split(",").map(Number) as [number, number] | undefined) ?? [21, 37];

  /** `--floor-net=<rows>,<columns>`: the nose's floor net's control points; absent, 15 by 17 (about 1.3 mm along by 1.8 mm round). */
  const FLOOR_NET: [number, number] = (process.argv.find((a: string): boolean => a.startsWith("--floor-net="))?.slice(12).split(",").map(Number) as [number, number] | undefined) ?? [15, 17];

  /**
   * A nostril's pit and its blended rim, mm: 10 inside, -10 outside. A level plane cuts the +Z pit at 1,552 mm in a loop from 117.6 to
   * 127.7 mm forward and 3.0 to 11.1 mm across (`FamilyConicScan.ts nostril`), and the nostril's course leans 8 mm back over 20 mm up
   * from [127.1, 1540.4] (`AutoMovieHumanF1Joints.nostrilRoot`). The region is that loop's ellipse, wider all round by the rim's blend
   * (`AutoMovieHumanF1.ts`, `NOSTRIL_RIM_MM`, 1.5 mm), carried along the course from 1,541 mm up: what the nostril's cut takes.
   */
  function nostrilPit(p: R.V): number {
    const forward: number = 127.1 - (8 * (p[1] - 1540.4)) / 20 + 0.2;
    const inside: boolean = p[1] > 1541 && ((p[0] - forward) / 6.55) ** 2 + ((Math.abs(p[2]) - 7.05) / 5.55) ** 2 < 1;
    return inside ? 10 : -10;
  }

  /**
   * The chin's cone, mm: about the trunk's course, from the throat's radius at the height the chin starts, widening by `slope` for each
   * millimetre up, which brings it to the fold under the lower lip at 1,503 mm. On the median line the skin goes forward from 58 to 107 mm
   * within 4 mm of height there, read off `FamilyConicBody.ts trunk --casts`: a level section jumps by the chin's whole depth, and the skin
   * under the chin lies between two sections. What stands outside the cone is left out of the trunk's sections, whose front then grows by
   * the slope, and is carried by a relief cast across the cone (`casts`).
   */
  const CHIN: { y: number; radius: number; slope: number } = { y: 1476, radius: 58, slope: 1.9 };

  /**
   * A digit's pad: how far from the line of its last segment the pad's far point is looked for, mm, which keeps the search inside the digit
   * and off its neighbours, and how far past that point the course runs on, mm.
   */
  const PAD: { reach: number; past: number } = { reach: 6, past: 4 };

  /** The far point of a digit's pad: the skin's vertex farthest along the line from `a` through `b`, among those within `PAD.reach` of it. */
  function pad(skin: R.ISource["body"], a: R.V, b: R.V): R.V {
    const length: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const d: R.V = [(b[0] - a[0]) / length, (b[1] - a[1]) / length, (b[2] - a[2]) / length];
    let best: R.V = b;
    let far: number = 0;
    for (let i: number = 0; i + 2 < skin.positions.length; i += 3) {
      const q: R.V = [skin.positions[i]! - b[0], skin.positions[i + 1]! - b[1], skin.positions[i + 2]! - b[2]];
      const along: number = q[0] * d[0] + q[1] * d[1] + q[2] * d[2];
      if (along <= far || Math.hypot(q[0] - along * d[0], q[1] - along * d[1], q[2] - along * d[2]) > PAD.reach) continue;
      far = along;
      best = [Math.round(skin.positions[i]! * 100) / 100, Math.round(skin.positions[i + 1]! * 100) / 100, Math.round(skin.positions[i + 2]! * 100) / 100];
    }
    return best;
  }

  /**
   * Least area of a connected piece of the reference mesh for a cast to land on it, mm2. The head's skin and each eyeball are pieces of
   * their own; so are the eyelashes and the brows' hairs, which are no skin and are not modelled, and a cast that landed on them stood the
   * upper lids out as shelves. An eyeball is 2,800 mm2; a lash strip a few hundred.
   */
  const SOLID_MM2: number = 1500;

  /** For each triangle of a mesh, 1 when its connected piece (by shared vertices) is at least `SOLID_MM2` in area, else 0; kept per mesh. */
  const solidCache: WeakMap<object, Uint8Array> = new WeakMap();
  function solids(mesh: R.ISource["body"]): Uint8Array {
    const known: Uint8Array | undefined = solidCache.get(mesh);
    if (known !== undefined) return known;
    const count: number = mesh.positions.length / 3;
    const parent: Int32Array = new Int32Array(count).map((_: number, i: number): number => i);
    const find = (i: number): number => {
      while (parent[i] !== i) {
        parent[i] = parent[parent[i]!]!;
        i = parent[i]!;
      }
      return i;
    };
    for (let t: number = 0; t + 2 < mesh.indices.length; t += 3) {
      const a: number = find(mesh.indices[t]!);
      for (const k of [1, 2]) {
        const b: number = find(mesh.indices[t + k]!);
        if (a !== b) parent[b] = a;
      }
    }
    const area: Map<number, number> = new Map();
    const at = (v: number): R.V => [mesh.positions[v * 3]!, mesh.positions[v * 3 + 1]!, mesh.positions[v * 3 + 2]!];
    for (let t: number = 0; t + 2 < mesh.indices.length; t += 3) {
      const [a, b, c]: R.V[] = [0, 1, 2].map((k: number): R.V => at(mesh.indices[t + k]!));
      const u: R.V = [b![0] - a![0], b![1] - a![1], b![2] - a![2]];
      const w: R.V = [c![0] - a![0], c![1] - a![1], c![2] - a![2]];
      const root: number = find(mesh.indices[t]!);
      area.set(root, (area.get(root) ?? 0) + Math.hypot(u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]) / 2);
    }
    const out: Uint8Array = new Uint8Array(mesh.indices.length / 3);
    for (let t: number = 0; t + 2 < mesh.indices.length; t += 3) out[t / 3] = (area.get(find(mesh.indices[t]!)) ?? 0) >= SOLID_MM2 ? 1 : 0;
    solidCache.set(mesh, out);
    log0("family-body-solids", { pieces: area.size, kept: [...area.values()].filter((a: number): boolean => a >= SOLID_MM2).map((a: number): number => Math.round(a)) });
    return out;
  }
  let log0: (event: string, detail: object) => void = (): void => undefined;

  /** How far a cutter's pocket is drawn in from the loop it is read between, at its farthest point, mm. */
  const POCKET_INSET_MM: number = 1.5;

  /**
   * How far a slit cutter's floor (`IPart.air`) bows down under its course point, mm, in the section's chart, so the bottom guide stands
   * there at every station. The floor lies in the air under the band it cuts, so the bow changes nothing the cut leaves; flat, the vault's
   * bottom guide jumped between the floor's two ends and the engine refused the family.
   */
  const AIR_SAG_MM: number = 1.5;

  /**
   * The armpit slit cutter's course, mm: low in the slit, about 4 mm over its floor and midway between its walls there, where each
   * section's kernel is (the reference's planes x = const and the course's own planes, `sect` and `airsect`, scratch plots), from the
   * anterior fold, where the arm's band stands 1,284 mm high against the fold's 1,305, to x -56, closing inside the slit. Run on out
   * through the posterior fold to x -66, no fit or construction of it was cut (the doc's armpit record), so the course is the stored
   * cutter's (`AutoMovieHumanF1Axilla`).
   */
  const AXILLA: R.V[] = [[16, 1287, 147.5], [-25, 1262, 150.5], [-45, 1269.5, 151], [-56, 1283, 151.5]];

  /** The slit cutter's fitted stations, mm along its course (`--axilla-domain=<from>,<to>`): x 16 is station 0, the crease about 48, x -62 about 97. */
  const AXILLA_DOMAIN: [number, number] = (process.argv.find((a: string): boolean => a.startsWith("--axilla-domain="))?.slice("--axilla-domain=".length) ?? "25,78").split(",").map(Number) as [number, number];

  /** `--construct`: how far from where invented points meet skin a corner is looked for, and the span its sides' directions are read over, mm. */
  const CONSTRUCT_SEARCH_MM: number = 3;
  const CONSTRUCT_SPAN_MM: number = 2.5;

  /**
   * The armpit cutters' constructed rounds, mm. Each floor-wall corner is invented by the air provider, and its fitted radii of 0.07 to
   * 0.22 mm stood where the band crosses (`corner`, a scratch probe), under the cuts' 0.25 mm blends, which reversed there; drawn round
   * by four times the blend, its tangent points stand at least 4.2 mm from the band on the vault and 1.2 mm on the slit (`construct`,
   * a scratch probe of the dumped sections against the band). The slit's top is a cusp of 20 to 54 degrees, which a G1 chain closes
   * only by a degenerate arc; drawn round by the blend's width it is closed by up to 1.22 mm (station 74), 0.3 to 0.9 mm mostly.
   */
  const CONSTRUCT_CORNER_MM: number = 1;
  const CONSTRUCT_APEX_MM: number = 0.25;

  /** How a fit candidate the construction's own path refused is marked (`attempt`). */
  const NATIVE_REFUSAL: string = "refused on the construction's path: ";

  /** Whether a candidate holds a fit and was refused only on the construction's path. */
  function refusedNative(result: F.IResult): boolean {
    return result.fault !== null && result.fault.startsWith(NATIVE_REFUSAL) && result.values.length > 0;
  }

  /** Length of the station bands `--decompose` tabulates, mm. */
  const DECOMPOSE_BAND_MM: number = 5;

  /**
   * How far under the arm band the slit cutter's floor stands, `[x, mm]`: 3 mm under the crease, deepening behind x -56, where the band
   * rises over the back of the shoulder (1,294 mm at x -60 and 1,308 at -65, `AXILLA_BAND`) while the slit's apex stays at 1,299.
   */
  const AXILLA_FLOOR: [number, number][] = [[-56, 3], [-62, 8], [-68, 12]];

  /**
   * How far the slit cutter is drawn in from the slit's walls, mm, at its floor and at its apex: the stored cutter's 1.5 and 0.8, the
   * one whose cut the body carries. Drawn in 0.8 at the floor and 0.3 at the apex the cutter keeps more of the slit (its band stubs 1.5 mm
   * wide read as a white sliver along the slit's foot, and at 0.8 its top 2 to 5 mm stays closed), but at 0.3 the plain fit was refused
   * between its fitted stations (the apex's arc did not advance in phase at station 55.8) and the barrier fit on the native path (the arc
   * after a groove's inflection met behind its end, b -0.006 of its chord).
   */
  const AXILLA_INSET: [number, number] = [1.5, 0.8];

  /** How far the vault cutter is drawn in from the vault's walls, mm, at its floor and at its apex (its constructed form, `AutoMovieHumanF1Vault`, not in the body). */
  const VAULT_INSET: [number, number] = [0.8, 0.3];

  /**
   * The least share of its chord at which each arc's tangent lines may meet in the slit cutter's fit (`IPart.margin`). An inflection's
   * tangent points almost at its neighbour, so in the barrier fit the arcs beside the groove's inflections met at 0.000 to 0.05 of their
   * chords all along the cutter, and the engine's spline between stations dipped to -0.006 (`meetcheck`, a scratch probe). Under the
   * default 0.1, which forbids the groove itself, the fit stayed at its seed, 2.19 mm mean, standing up to 5.9 mm past the air (2.32 mm
   * with the apex drawn in 0.8 mm), and its cut left the band onto the trunk. At 0.02, on the corrected trunk, the arcs either side of
   * the cusp held it on 7 to 10 of every 10 sections from 35 to 65 mm and the fit stood 1.5 to 4.1 mm past the air, its cut reaching onto
   * the arm's and the trunk's faces (`--decompose`, `isect`). The stored cutter, whose cut crosses the band alone, was fitted with none:
   * so is this one, the native chain's admission and every share held inside (0, 1) guarding it.
   */
  const AXILLA_MARGIN: number = 0;

  /**
   * How much further the slit cutter is drawn in on its arm side (+v), mm, at a ray square to the course on that side. Its cut crossed the
   * arm band 0.0 to 0.3 mm from the band's seam with the arm at stations 25 to 35 and 0.5 to 1.0 mm at 55 to 75, on both sides (`isect`,
   * a scratch probe), and the twin's host rail, 0.25 mm off the cut, found no band there ("no rail at t 2.618"). The band leaves the arm at
   * a shallow angle, so the crossing moves along the band several times as far as the wall moves in. Drawn in 2.5 mm at the floor on both
   * sides, or 1 mm on the arm side at every height or fading to the apex, the slit's sections pinched and every candidate was refused on the
   * construction's path. The rail's own refusal there was then read (`AutoMovieSolidRail.explain`): the twin's host rail, not its seam
   * distance, failed, its host normal-section solve alternating across one seam of an asymmetric trunk. So it is 0.
   */
  const AXILLA_ARM_SIDE_MM: number = 0;

  /**
   * How far the slit cutter closes past its first and last fitted sections, mm. Closed 4 and 3 mm past them, each end was a short steep cone
   * whose face stood upright at the slit's lower ends and caught the light, a shard on `shoulder.front` (px 520, 620) and on `shoulder.back`
   * (px 375, 605): the owner pick there found the cutter's own face (`ownerbox`, a scratch probe).
   */
  const AXILLA_CAPS_MM: [number, number] = [10, 8];

  /**
   * How far the vault cutter's floor stands under the arm band, mm. Its floor meets its walls in corners of 0.07 to 0.22 mm radius, 1 to 5
   * mm above the section's lowest point (`corner`, a scratch probe); at 3 mm the band crossed the cutter through them, and the 0.25 mm blend
   * reversed there ("the blend's normal reverses") and the cutter's face did not triangulate; constructed, its corners are drawn round by
   * 1 mm (`CONSTRUCT_CORNER_MM`). At 8 mm the floor reached under the trunk's port loop on the trunk side, and the cutter crossed the
   * trunk's own face in three small loops besides its crossing of the band (229 to 251 degrees, `isect`, a scratch probe).
   */
  const VAULT_FLOOR_MM: number = 3;

  /**
   * The vault cutter's course, mm: under the reference's vault in front of the crease (its apex at 1,300 mm at x 14, 1,297 at 10, 1,294 at 6
   * and 1,290 at 2, z 145 to 151, `sect`, a scratch plot), 7 to 8 mm over the floor, ending at x -1, clear of the slit cutter's front tip.
   */
  const VAULT: R.V[] = [[16, 1290, 149.5], [-1, 1276, 148.5]];

  /**
   * The slit cutter's layouts by `--axilla-layout`: `groove` (the default), the 8-conic limb with a groove after its apex, the `u` extreme
   * whose arm-side flank is concave; `limb1` and `limb2`, the plain 8- and 16-conic limbs; `grooves`, a groove after both `u` extremes.
   */
  const AXILLA_LAYOUTS: Record<string, { layout: C.ILayout; depth: number }[]> = {
    groove: [{ layout: C.inflected(1, [0]), depth: 1 }],
    grooves: [{ layout: C.inflected(1, [0, 4]), depth: 1 }],
    limb1: [{ layout: C.limb(1), depth: 1 }],
    limb2: [{ layout: C.limb(1), depth: 1 }, { layout: C.limb(2), depth: 2 }],
    // The groove after the apex as three feature anchors (`FamilyConicSection.featured`), which fade onto a smooth stretch over the vault in
    // front of the crease, where no section bends inward and an `i` would force an S.
    featured: [{ layout: C.featured(C.limb(1), [{ after: 0, anchors: [{ kind: "f", feature: "inflection", window: [0.15, 0.55] }, { kind: "f", feature: "concave", window: [0.3, 0.75] }, { kind: "f", feature: "inflection", window: [0.5, 0.9] }] }]), depth: 1 }],
  };

  /**
   * The generated arm band's lowest height in planes x = const, `[x, y]` mm, read off the figure's mesh with every band column at its own
   * ribbon scale (`bandlevel`, a scratch probe of the dumped body): 1,261 mm under the crease, rising to 1,289 at x 20 and to 1,308 at -65.
   */
  const AXILLA_BAND: [number, number][] = [[20, 1288.5], [15, 1283.6], [10, 1279.6], [5, 1274.5], [0, 1270.8], [-5, 1267.7], [-10, 1265.1], [-15, 1262.8], [-20, 1261.6], [-25, 1261.4], [-30, 1261.7], [-35, 1263.2], [-40, 1265.7], [-45, 1269], [-50, 1274.4], [-55, 1281.5], [-60, 1294.3], [-65, 1307.8]];

  /** `--chinless`: the trunk's sections keep the chin and no relief is cast for it, as in the walls stored before the cone. */
  const CHINLESS: boolean = process.argv.includes("--chinless");

  /**
   * Least distance between two of the trunk's knots above the jaw, mm (`--face-gap=<mm>`). The face's hull steps at the brow, the eyes, the
   * nose and the mouth, and knots that follow each step streak the wall across the face; the face's form is its nets'.
   */
  const FACE_GAP_MM: number = Number(process.argv.find((argument: string): boolean => argument.startsWith("--face-gap="))?.slice("--face-gap=".length) ?? 8);

  /** `--bare`: the wall alone, with no relief of any kind fitted on it. */
  const BARE: boolean = process.argv.includes("--bare");

  /** How far a point stands outside the chin's cone, mm; negative inside it, behind the course or below its start. */
  function chin(p: R.V): number {
    return CHINLESS || p[0] <= 0 || p[1] < CHIN.y ? -1 : (Math.hypot(p[0], p[2]) - CHIN.radius - CHIN.slope * (p[1] - CHIN.y)) / Math.hypot(1, CHIN.slope);
  }

  /** A relief for skin that faces along the course, where a section's plane only grazes it. */
  interface ICast {
    /** The relief's name after the part's. */
    name: string;

    /** Station range of the window, mm, or `cap` for the part's closed end, from half a millimetre past its last section to its tip. */
    stations: [number, number] | "cap";

    /** Phase range of the window, radians; absent, the window goes once round and its net closes on itself. */
    phases?: [number, number];

    /** Unit direction of the height, or `course` for back along the part's course. */
    axis: R.V | "course";

    /** With it, the direction turns with the phase as a relief's does: `axis` at the window's middle phase, `turn` a quarter turn on. */
    turn?: R.V;

    /** The reference skin the rays may meet, positive where it is left out; absent, the part's own clip. */
    skin?: (p: R.V) => number;

    /** Control points along the station and round the phase. */
    rows: number;
    columns: number;

    /** Farthest a ray may land from the surface and still be observed, mm. */
    reach: number;

    /** Least cosine between a reference triangle's normal and the axis for the triangle to be met; absent, any. */
    facing?: number;

    /** Take the nearest triangle either way instead of the outermost against the axis. */
    nearest?: boolean;

    /** The window is centred on the median line and its net is tied symmetric across it. */
    mirror?: boolean;

    /** How far in from its first and last station, mm, and its first and last phase, radians, the window takes less than the whole height (`H.IWindow`). */
    fade?: [number, number];
    fadePhase?: [number, number];

    /**
     * The first station a ray is cast from, mm; absent, the window's first. A window may start before the part's first section, where no
     * point of the part stands, so that its zero edge lies under the band that replaces the part's first stations and the net is whole where
     * the band lands.
     */
    observe?: number;

    /** The cast stands to one side of a part that is its own mirror image, and its net is written a second time reflected (`<name>.twin`). */
    twin?: boolean;

    /** Where the net is held at zero instead of cast: by station, mm, and phase, radians. */
    held?: (s: number, phi: number) => boolean;
  }

  /** A relief window of a part. */
  interface IWindow extends H.IWindow {
    /**
     * The window stands to one side of a part that is its own mirror image, and the relief fitted in it is written a second time reflected
     * across the median plane, as `<name>.twin`.
     */
    twin?: boolean;

    /**
     * The window reads each section whole, with the skin of the neighbours the part's clip leaves out. Round a neighbour's cut the part's wall
     * turns into the chord that closes the cut, and a relief that sees only the part's own skin leaves it turned there; one that sees the
     * neighbour's skin as far as its reach carries the wall on past the cut the way the skin goes, which is the direction a band to that
     * neighbour leaves in.
     */
    uncut?: boolean;

    /**
     * A cast that lands on the chord closing a neighbour's cut is observed like one on skin, so the net holds the wall on that chord. Where a
     * part is merged, it comes out through the chord's flat face and crosses it squarely; left unobserved there, the fairest net sank the face
     * along the skin beside it and the thumb's merge lost its trace.
     */
    chord?: boolean;

    /**
     * Where the net is held at zero, positive inside: skin that a merged part runs along. The thumb's skin lies within 2 mm of the web's for
     * 15 mm, and with the web brought home a merge traces no crossing there; held, the hand's wall stays the tape's across the web beside
     * the thumb, which the thumb crosses squarely.
     */
    hold?: (p: R.V) => number;
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

    /** The chart's roll about the course (`AutoMovieHumanConicLoft.IFamily.roll`), read off `--kernels`' `principal` angles; absent, none. */
    roll?: K.IStored["roll"];

    /**
     * Fit the sections to the skin itself instead of its hull (the tape): each section is read along rays from the course point, keeping
     * the innermost or outermost crossing, so it is star-shaped about the course as the fit's one radius a phase needs, and its concavities
     * are the wall's own inward arcs between inflection anchors (`inflected`). Sections whose rays crossed the skin more than once are
     * reported by station (`family-body-star`). Absent, the hull.
     */
    skin?: "inner" | "outer";

    /** With `skin`: a section whose rays fold is fitted as its hull instead of being skipped. */
    folded?: "hull";

    /** With `skin`: the station from which every section is fitted as its hull, the stretch whose detail its reliefs own. */
    hullFrom?: number;

    /** Of `clip`, the part of it that is an opening another part fills: across it each section closes by the opening's closure (`without`). */
    opening?: (p: R.V) => number;

    /** The name of an excursion (`FamilyConicExcursion.PARTS`) the sections are cut as, out of the reference head's level planes. */
    excursion?: string;

    /**
     * Of an excursion, only its base plate (`FamilyConicExcursion.plate`): its cranial skin and a floor `thickness` to `deepest` mm inside
     * it, carried `into` mm into the host. A plane whose piece is a loop of its own has none.
     */
    plate?: { thickness: number; into: number; deepest: number | ((s: number) => number); rim?: number };

    /** Fitted station interval, mm of course arclength; `auto` takes the longest run of single loops round the course whose area stays near the part's own. */
    domain: [number, number] | "auto";

    /** Where the part's reliefs end, mm: its hollow windows are cut there; absent, at its tip. */
    reliefEnd?: number;

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
     * Part of `clip` that a window reading each section whole (`IWindow.uncut`) leaves out as well: a neighbour on a port whose skin the
     * window must not carry, as the breasts are to the side windows, where the arm's is the skin a band to the arm leaves along.
     */
    kept?: (p: R.V) => number;

    /**
     * Part of `clip` whose boundary is a surface of revolution about the course, positive outside it: where it alone cuts a stretch out, the
     * loop closes along that surface's circle instead of the chord.
     */
    round?: (p: R.V) => number;

    /**
     * The part closes in a point past its last fitted section. With `true` the tip is the station where the reference's loop vanishes; a number
     * is a tip placed by anatomy instead, the level of the digit webs for a hand or a foot, whose loop runs on into one digit.
     */
    tip?: boolean | number;

    /**
     * How the part is constructed by rule with `--construct` (`FamilyConicFit.construct`), in its first layout: the knots its fields are
     * carried on, the radius, mm, each corner between invented points and skin is drawn round by before the section is read (a corner the
     * air provider makes, not the skin), and the radius its top is drawn round by. A part without it is not constructed.
     */
    construct?: { knots: number[]; corner: number; apex: number };

    /**
     * The part also closes in a point this far before its first fitted section, mm: the ear's plate at the lobule's free lower edge, below
     * which the reference's loops are the lobule's own (1,542 mm) and then none (1,540.5).
     */
    foot?: number;

    /** The part closes in a point before its first fitted section too, at this station, its cap starting at that section; a cutter wholly inside its host closes at both ends. */
    first?: number;

    /** The closed end is covered by the digits merged onto it, not the figure's skin (`AutoMovieHumanConicLoft.ITip.covered`). */
    covered?: boolean;

    /** Station where the cap starts when the wall is not followed to its last fitted section, mm; absent, the domain's end. */
    cap?: number;

    /** The chart point the cap's sections gather about while it closes (`AutoMovieHumanConicLoft.ITip.centre`), mm; absent, the course. */
    centre?: [number, number];

    /** Each coordinate of the cap takes its own outline's taper and bend (`AutoMovieHumanConicLoft.ITip.own`). */
    own?: boolean;

    /** Also emitted mirrored in the median plane `z = 0`. */
    mirrored: boolean;

    /** Largest distance between neighbouring phases, mm, written into the module (`AutoMovieHumanConicLoft.IFamily.pitch`); absent, the model's default. */
    pitch?: number;

    /** Limb layouts to try in order of median depth, each starting from the previous one's result. */
    layouts: { layout: C.ILayout; depth: number }[];

    /** Relief windows for what lies inside the tape wall, or `auto` to place one over every hollow deeper than the target. */
    reliefs: IWindow[] | "auto";

    /**
     * For a cutter of an open hollow: each section is not the skin's loop but the largest pocket between that loop and its hull, with the
     * hull edge that closes the pocket pushed out by this many mm.
     */
    pocket?: number;

    /** The least share of its chord at which every arc's tangent lines must meet in the fit (`FamilyConicFit.ADMISSIBLE_MARGIN`); absent, that default. A tight groove may need less. */
    margin?: number;

    /**
     * For a cutter of a slit between two parts: each section is the air round the course point, read along rays to the nearest crossing of
     * the plane's skin, capped below by a floor `floor` mm under a band of the figure (both `[x, value]` in planes x = const, joined
     * linearly: the band's height, and the floor's depth under it, negative above it) and at `reach` mm from the course, and drawn in along
     * its own normal from `inset[0]` mm at the floor to `inset[1]` mm at its top. The course must lie in each section's kernel; the section
     * is then star-shaped about it, and `skin: "inner"` reads it.
     */
    air?: { band: [number, number][]; floor: [number, number][]; reach: number; inset: [number, number]; sag?: number; side?: number };

    /** For a cutter, a hollow's own loft that is cut from its host: how far before its first section it is carried straight back, mm. */
    lead?: number;

    /** Reliefs whose heights are cast in space instead of in the section planes, fitted in order over the surface with every earlier relief on it. */
    casts?: ICast[];

    /**
     * Relief nets that go once round the part over a run of its stations, fitted after its windows: each takes what the wall and the windows
     * leave, outside the wall as well as inside it, cast toward the course all the way round. Its two directions are the chart's at the middle
     * of the run, so the run should be one the course does not turn much along. With `window` it covers only those phases, still cast toward
     * the course at every phase, and fades over its edges (`FamilyConicRelief.IWindow.fade`, `fadePhase`). Without `window`, `fade` alone
     * hands its first and last stations over, mm.
     */
    rounds?: { name: string; stations: [number, number]; rows: number; columns: number; reach: number; hold?: (p: R.V) => number; fade?: [number, number]; window?: { phases: [number, number]; fade: [number, number]; fadePhase: [number, number] } }[];
  }

  /** Run every part and write the receipt and the renders. */
  export async function main(): Promise<void> {
    const started: number = performance.now();
    const root: string = path.resolve(process.cwd(), "..");
    const out: string = path.join(root, "test/.shots/family-conic-body", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const log = (event: string, detail: object): void => void process.stdout.write(JSON.stringify({ event, ...detail, elapsedMs: Math.round(performance.now() - started) }) + "\n");
    log0 = log;
    const source: R.ISource = await R.load(root);
    const joint = (name: string): R.V => source.joints.get(name)!;
    // The armscye's landmark loop on the skin (`FamilyConicLoop`), which divides the shoulder's skin between the trunk and the arm.
    const armscye: FamilyConicLoop.ILoop = FamilyConicLoop.build(source);
    // The arm's opening in the trunk, either side: past the loop's swept surface and inside the arm's tube.
    const armHole = (p: R.V): number => Math.max(...[1, -1].map((side: number): number => {
      const a: R.V = joint("upperarm_r");
      const b: R.V = joint("lowerarm_r");
      const length: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const d: R.V = [(b[0] - a[0]) / length, (b[1] - a[1]) / length, (b[2] - a[2]) / length];
      const q: R.V = [p[0] - a[0], p[1] - a[1], side * p[2] - a[2]];
      const along: number = q[0] * d[0] + q[1] * d[1] + q[2] * d[2];
      return Math.min(armscye.side([p[0], p[1], side * p[2]]), ARM_TUBE_MM - Math.hypot(q[0] - along * d[0], q[1] - along * d[1], q[2] - along * d[2]));
    }));    const only: string[] = process.argv.slice(2).filter((argument: string): boolean => !argument.startsWith("--"));
    if (process.argv.includes("--emit-joints")) await fs.writeFile(path.join(root, "packages/human/src/generation/f1/AutoMovieHumanF1Joints.ts"), joints(source));
    // A digit's course runs through its joints and on past the last one by the length of its distal segment.
    const beyond = (a: R.V, b: R.V, length: number): R.V => {
      const d: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      return [b[0] + ((b[0] - a[0]) * length) / d, b[1] + ((b[1] - a[1]) * length) / d, b[2] + ((b[2] - a[2]) * length) / d];
    };
    const digit = (name: string, joints: string[], up: R.V): IPart => {
      const centres: R.V[] = joints.map(joint);

      // Past its last joint the course aims at the pad's far point and runs on through it. Carried straight on along the last segment it
      // left the pad through its side before the pad ended, and the tip stood 2 to 4 mm short.
      const far: R.V = pad(source.body, centres.at(-2)!, centres.at(-1)!);
      centres.push(beyond(centres.at(-1)!, far, PAD.past));
      const keys: string[] = joints.map((j: string): string => "J." + j.replace("_0", "").replace("_r", ""));
      log("family-body-pad", { part: name, pad: far });
      return { name, centres, course: "[" + [...keys, "J.beyond(" + keys.at(-1) + ", J." + joints[0]!.replace("_01_r", "") + "Pad, " + PAD.past + ")"].join(", ") + "]", halves: centres.slice(1, -1).map((): number => 5), up, domain: "auto", step: 2, gap: 6, tip: true, mirrored: true, layouts: LIMB, reliefs: [] };
    };
    // A net over a digit's dome, cast back along the digit as the crown's is, did not mend the short tips: the dome is 3 to 4 mm long and
    // the casts of a toe land on its neighbours; the thumb's net came out at heights of -8 to 8 mm.

    // The arm's course past the elbow is the line it was first fitted on, from the shoulder joint straight down. Its stations there are the
    // earlier ones moved by `shift`, and `up` is turned about the first segment so the chart there is the earlier chart: the hand end of that
    // earlier fit, which every finger was sewn on, can then be spliced in unchanged (`--splice=<directory>@<station>+<shift>`).
    // Past the knuckles the course turns toward the fingers (`KNUCKLE`), so the hand's end faces them: the end is split into the fingers
    // (`IAutoMovieConstructionSplit.outer`), and a band that leaves an end facing along the hand's own line turned 24 degrees as it left and
    // folded there.
    const fingers: [R.V, R.V][] = ["index", "middle", "ring", "pinky"].map((f: string): [R.V, R.V] => [joint(f + "_01_r"), joint(f + "_02_r")]);
    const toward = (from: R.V, segments: [R.V, R.V][], length: number): R.V => {
      const sum: number[] = [0, 0, 0];
      for (const [a, b] of segments) {
        const d: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
        for (let c: number = 0; c < 3; ++c) sum[c] = sum[c]! + (b[c]! - a[c]!) / d;
      }
      const l: number = Math.hypot(sum[0]!, sum[1]!, sum[2]!);
      return [from[0] + (sum[0]! * length) / l, from[1] + (sum[1]! * length) / l, from[2] + (sum[2]! * length) / l];
    };
    const toes: [R.V, R.V][] = ["bigtoe", "indextoe", "middletoe", "ringtoe", "littletoe"].map((f: string): [R.V, R.V] => [joint(f + "_01_r"), joint(f + "_02_r")]);
    // Within 15 mm of the thumb's course from 30 mm past its first joint: the web beside the thumb and the face the thumb comes out of, where
    // the hand's nets hold the wall so the thumb's merge finds its meeting.
    const thumbHold = (p: R.V): number => {
      const a: R.V = joint("thumb_01_r");
      const b: R.V = joint("thumb_03_r");
      const length: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const along: number = ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1]) + (p[2] - a[2]) * (b[2] - a[2])) / length;
      return Math.min(along - 30, 15 - Math.hypot(p[0] - a[0] - (along * (b[0] - a[0])) / length, p[1] - a[1] - (along * (b[1] - a[1])) / length, p[2] - a[2] - (along * (b[2] - a[2])) / length));
    };
    const armCentres: R.V[] = [ARM_ROOT, ARM_TURN, joint("lowerarm_r"), joint("hand_r"), joint("middle_01_r"), toward(joint("middle_01_r"), fingers, KNUCKLE.reach)];
    const armHalves: number[] = [SHOULDER_HALF_MM, 30, 10, KNUCKLE.half];
    const arm: { shift: number; up: R.V; plane: number; turned: number } = ((): { shift: number; up: R.V; plane: number; turned: number } => {
      const formerCentres: R.V[] = [joint("upperarm_r"), ...armCentres.slice(2, 5)];
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
    const handHalves: number[] = [SHOULDER_HALF_MM, 30, 10, HAND_KNUCKLE_HALF];
    // The arm on the ISB humerus course (Wu et al., ISB recommendation on definitions of joint coordinate systems, Part II: shoulder,
    // elbow, wrist and hand, J Biomech 38, 2005: the humerus's long axis from the glenohumeral rotation centre toward the elbow), its first
    // centre `ISB_PROXIMAL_MM` proximal of the shoulder joint on that axis, so the field reaches past the armscye's landmark loop, which
    // spans 44 mm proximal to 76.5 mm distal of the joint along the axis. From the elbow on it is the arm's former course, so every
    // station there is the current course's plus `delta`. Its `up` keeps the forearm's chart where the current course has it, so the wrist's
    // band meets the hand's ring at the same phases.
    const isbCentres: R.V[] = [toward(joint("upperarm_r"), [[joint("lowerarm_r"), joint("upperarm_r")]], ISB_PROXIMAL_MM), joint("lowerarm_r"), joint("hand_r"), joint("middle_01_r"), toward(joint("middle_01_r"), fingers, KNUCKLE.reach)];
    const isbHalves: number[] = [30, 10, KNUCKLE.half];
    const isb: { delta: number; up: R.V } = ((): { delta: number; up: R.V } => {
      const now: AutoMovieViewAxis.IRun[] = AutoMovieViewAxis.runs(armCentres, armHalves) as AutoMovieViewAxis.IRun[];
      const next: AutoMovieViewAxis.IRun[] = AutoMovieViewAxis.runs(isbCentres, isbHalves) as AutoMovieViewAxis.IRun[];
      const delta: number = round(next[1]!.start - next[1]!.from - (now[2]!.start - now[2]!.from));
      const at: number = (now[2]!.start + now[2]!.end) / 2;
      const old: AutoMovieLoftFrame.IFrame = (AutoMovieViewAxis.jointed(armCentres, armHalves, arm.up) as AutoMovieViewAxis.IAxis).at(at);
      const d: R.V = [isbCentres[1]![0] - isbCentres[0]![0], isbCentres[1]![1] - isbCentres[0]![1], isbCentres[1]![2] - isbCentres[0]![2]];
      const l: number = Math.hypot(d[0], d[1], d[2]);
      const t: R.V = [d[0] / l, d[1] / l, d[2] / l];
      // Two directions square to the first segment, and the up among them, by the angle, whose forearm chart turns least from the old one.
      const e1: R.V = ((): R.V => { const x: R.V = [1 - t[0] * t[0], -t[0] * t[1], -t[0] * t[2]]; const n: number = Math.hypot(x[0], x[1], x[2]); return [x[0] / n, x[1] / n, x[2] / n]; })();
      const e2: R.V = [t[1] * e1[2] - t[2] * e1[1], t[2] * e1[0] - t[0] * e1[2], t[0] * e1[1] - t[1] * e1[0]];
      const roll = (theta: number): number => {
        const up: R.V = [Math.cos(theta) * e1[0] + Math.sin(theta) * e2[0], Math.cos(theta) * e1[1] + Math.sin(theta) * e2[1], Math.cos(theta) * e1[2] + Math.sin(theta) * e2[2]];
        const frame: AutoMovieLoftFrame.IFrame = (AutoMovieViewAxis.jointed(isbCentres, isbHalves, up) as AutoMovieViewAxis.IAxis).at(at + delta);
        return Math.atan2(old.u[0] * frame.v[0] + old.u[1] * frame.v[1] + old.u[2] * frame.v[2], old.u[0] * frame.u[0] + old.u[1] * frame.u[1] + old.u[2] * frame.u[2]);
      };
      let best: number = 0;
      for (let k: number = 0; k < 720; ++k) if (Math.abs(roll((2 * Math.PI * k) / 720)) < Math.abs(roll(best))) best = (2 * Math.PI * k) / 720;
      let [lo, hi]: number[] = [best - Math.PI / 360, best + Math.PI / 360];
      for (let k: number = 0; k < 40; ++k) {
        const [a, b]: number[] = [lo! + (hi! - lo!) / 3, hi! - (hi! - lo!) / 3];
        if (Math.abs(roll(a!)) < Math.abs(roll(b!))) hi = b;
        else lo = a;
      }
      const theta: number = (lo! + hi!) / 2;
      const up: R.V = [0, 1, 2].map((c: number): number => round4(Math.cos(theta) * e1[c]! + Math.sin(theta) * e2[c]!)) as R.V;
      log("family-body-arm-isb", { delta, up, rollAfter: roll(theta) });
      return { delta, up };
    })();
    // The arm's sections keep the skin on the arm's side of the armscye's landmark loop (`FamilyConicLoop`), the thumb past where it stands
    // free of the palm left out as before; across the trunk's side each section closes by the shared opening closure (`without`).
    const armOpening = (p: R.V): number => -armscye.side(p);    // The arm's sections leave out the thumb past where it stands free of the palm, and the trunk's side medial of the armpit's plane.
    // The thumb past where it stands free of the palm is not the hand's: inside 16 mm of its course from 40 mm past its first joint.
    // Left in, the hand's wall and the thumb's lay within half a millimetre of each other for 10 mm, and a merge traces no such meeting.
    const thumbOut = (p: R.V): number => {
      const a: R.V = joint("thumb_01_r");
      const b: R.V = joint("thumb_03_r");
      const length: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const along: number = ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1]) + (p[2] - a[2]) * (b[2] - a[2])) / length;
      return Math.min(along - 40, 16 - Math.hypot(p[0] - a[0] - (along * (b[0] - a[0])) / length, p[1] - a[1] - (along * (b[1] - a[1])) / length, p[2] - a[2] - (along * (b[2] - a[2])) / length));
    };
    // The hand owns the shoulder's cap as well, the skin lateral of the armpit's sagittal plane, and gives up what lies medial.
    const armClip: (p: R.V) => number = (p: R.V): number => Math.max(thumbOut(p), ARMPIT_MM - p[2]);
    const parts: IPart[] = (
      [
        ...["index", "middle", "ring", "pinky"].map((finger: string): IPart => digit("finger." + finger, [finger + "_01_r", finger + "_02_r", finger + "_03_r"], [1, 0, 0])),
        digit("finger.thumb", ["thumb_01_r", "thumb_02_r", "thumb_03_r"], [0, 1, 0]),
        ...["bigtoe", "indextoe", "middletoe", "ringtoe", "littletoe"].map((toe: string): IPart => digit("toe." + toe.replace("toe", ""), [toe + "_01_r", toe + "_02_r"], [0, 1, 0])),
        // The arm runs on through the wrist to the knuckles, so the wrist is no seam.
        // A course that leaves the wrist square to the row of knuckles, with the hand read on to the finger webs as the curve round all the
        // fingers (`surround`), was fitted to 588 numbers at a mean of 0.34 mm, but the engine refused it as a face: between its stations a
        // section's chain lost an arc. Until that is understood the hand keeps this course and closes at the webs.
        // It starts 2 mm past the armscye's plane and fans round the shoulder (`ARM_ROOT`); round that turn the cap's top sweeps about 2.5
        // times faster than the station, so its knots may stand 6 mm apart, as round the ankle.
        { name: "arm", centres: isbCentres, course: "[J.toward(J.upperarm, [[J.lowerarm, J.upperarm]], " + ISB_PROXIMAL_MM + "), J.lowerarm, J.hand, J.middle1, J.toward(J.middle1, [[J.index1, J.index2], [J.middle1, J.middle2], [J.ring1, J.ring2], [J.pinky1, J.pinky2]], " + KNUCKLE.reach + ")]", halves: isbHalves, up: isb.up, domain: [ISB_PROXIMAL_MM - 46, KNUCKLE.end + isb.delta], gap: (s: number): number => (s < ISB_PROXIMAL_MM + 80 ? 6 : GAP_MM), tip: KNUCKLE.end + 15 + isb.delta, cap: 570.45 + isb.delta, covered: true, mirrored: true, layouts: ARM_FEATURES.length > 0 ? featureGrooves(ARM_FEATURES) : ARM_GROOVES.length === 0 ? LIMB : [{ layout: C.inflected(1, ARM_GROOVES), depth: 1 }], ...(process.argv.includes("--arm-skin") ? { skin: "outer" as const } : {}), reliefs: "auto", rounds: [
          // The forearm and the hand: the wall of two conics a quarter left the ulna's head 2 to 4 mm inside the skin at the wrist, the web
          // between the thumb and the hand up to 11 mm full and stripes of 1 to 4 mm along the forearm (`FamilyConicDeviation.ts`), which
          // are not hollows under the tape but the wall's own misfit, on both sides of it. A net round each run takes them. Meeting in three
          // zero rows each at 425 to 440 mm they drew an oval ring with level bars round the forearm above the wrist and a ring across the
          // wrist (`hand.high-oblique` px 360..415 x 150..215, `figure.left` px 455..470 x 615..640), gone with both nets off. The forearm's
          // now hands over (`fade`) over its last 40 mm and the hand's starts at 400 mm and fades in over 30; faded over 15 mm each the
          // oval stayed.
          { name: "fore", stations: [300 + isb.delta, 440 + isb.delta], rows: 19, columns: 26, reach: 10, fade: [0, 40] },
          { name: "hand", stations: [400 + isb.delta, KNUCKLE.relief + isb.delta], rows: 36, columns: 38, reach: 14, hold: thumbHold, fade: [30, 0] },
          // The palm on to the hand's end (`PALM`): past `KNUCKLE.relief` the wall alone is the tape across the palm's hollow.
          { name: "palm", stations: [PALM.stations[0] + isb.delta, PALM.stations[1] + isb.delta], rows: PALM.rows, columns: PALM.columns, reach: 14, hold: thumbHold, window: { phases: PALM.phases, fade: PALM.fade, fadePhase: PALM.fadePhase } },
        ], clip: (p: R.V): number => Math.max(thumbOut(p), armOpening(p)), opening: armOpening, reliefEnd: KNUCKLE.relief + isb.delta },
        // The hand from the wrist on, its own family on the arm's course with a wider knuckle turn (`HAND_KNUCKLE_HALF`), continued from the
        // arm's open end by a band (`IAutoMovieConstructionContinuation.band`): on the arm's turn of 16 mm a side (radius 78 mm) the hand's
        // ulnar edge stands 69 mm inside the turn and its sections nearly cross there, a crease along the palm side of the little finger's root.
        { name: "hand", centres: armCentres, course: "[J.armRoot, J.armTurn, J.lowerarm, J.hand, J.middle1, J.toward(J.middle1, [[J.index1, J.index2], [J.middle1, J.middle2], [J.ring1, J.ring2], [J.pinky1, J.pinky2]], " + KNUCKLE.reach + ")]", halves: handHalves, up: arm.up, domain: [HAND_FROM, KNUCKLE.end], gap: GAP_MM, tip: KNUCKLE.end + 15, cap: 570.45, covered: true, mirrored: true, layouts: HAND_FEATURES.length > 0 ? featureGrooves(HAND_FEATURES) : LIMB, ...(process.argv.includes("--hand-skin") ? { skin: "outer" as const } : {}), reliefs: "auto", rounds: [
          { name: "hand", stations: [HAND_FROM + 4, KNUCKLE.relief], rows: 31, columns: 38, reach: 14, hold: thumbHold, fade: [15, 25] },
          { name: "palm", stations: PALM.stations, rows: PALM.rows, columns: PALM.columns, reach: 14, hold: thumbHold, window: { phases: PALM.phases, fade: PALM.fade, fadePhase: PALM.fadePhase } },
        ], clip: armClip, reliefEnd: KNUCKLE.relief },


        // The leg turns at the ankle and runs on to the ball of the foot, its sections fanning round the instep, so the heel is lofted and the ankle
        // is no seam. The ankle's turn is long enough that its tightest radius, 2 h / (1.875 angle) = 46 mm, stays outside the instep. Round the
        // turn the heel sweeps about 2.7 times faster than the station. Knots 6 mm apart there stood in a cluster of nine from 776 to 856 mm,
        // and their cubics drew a level ring above the ankle; at least 12 mm apart the ring is gone and the wall is 693 numbers at the same mean.
        // A course that leaves the ankle square to the row of toe joints, with the forefoot read as the curve round all the toes, was tried;
        // its wall stalled above 3 mm, so the foot keeps this course and closes at the toe webs, and the toes are merged onto that cap.
        { name: "leg", centres: [joint("thigh_r"), joint("calf_r"), joint("foot_r"), [133, 20, 157], toward([133, 20, 157], toes, TOE_TURN.reach)], course: "[J.thigh, J.calf, J.foot, J.footBall, J.toward(J.footBall, [[J.bigtoe1, J.bigtoe2], [J.indextoe1, J.indextoe2], [J.middletoe1, J.middletoe2], [J.ringtoe1, J.ringtoe2], [J.littletoe1, J.littletoe2]], " + TOE_TURN.reach + ")]", halves: [40, 62, TOE_TURN.half], up: [1, 0, 0], domain: [104, TOE_TURN.end], gap: 12, tip: TOE_TURN.end + 15, covered: true, mirrored: true, layouts: LIMB, reliefs: "auto", reliefEnd: TOE_TURN.relief, casts: [{ name: "sole", stations: [930, TOE_TURN.relief], axis: [0, 1, 0], rows: 16, columns: 35, reach: 6, facing: 0.8, nearest: true }] },

        // A stretch of the leg as a family of its own on the leg's course, fitted to its skin with grooves carried by inflection lines
        // (`FamilyConicSection.inflected`): `--segment=<from>,<to>`, `--segment-grooves=<anchors>`, `--segment-up=<x,y,z>` (the chart's seed,
        // turned so a hollow falls after a `u` extreme), `--segment-gap=<mm>`. A trial for the foot's end before its split and the heel.
        ...(SEGMENT === undefined ? [] : [{ name: "segment", centres: [joint("thigh_r"), joint("calf_r"), joint("foot_r"), [133, 20, 157], toward([133, 20, 157], toes, TOE_TURN.reach)] as R.V[], course: "[J.thigh, J.calf, J.foot, J.footBall, J.toward(J.footBall, [[J.bigtoe1, J.bigtoe2], [J.indextoe1, J.indextoe2], [J.middletoe1, J.middletoe2], [J.ringtoe1, J.ringtoe2], [J.littletoe1, J.littletoe2]], " + TOE_TURN.reach + ")]", halves: [40, 62, TOE_TURN.half], up: SEGMENT.up, domain: SEGMENT.domain, gap: SEGMENT.gap, mirrored: true, layouts: [{ layout: SEGMENT.features.length > 0 ? C.featured(C.limb(1), SEGMENT.features) : SEGMENT.grooves.length === 0 ? C.limb(1) : C.inflected(1, SEGMENT.grooves), depth: 1 }], reliefs: [] as IWindow[], skin: "inner" as const }]),
        // The auricle as a conic family of its own skin: level sections straight up through the shell, each the excursion of the head's level
        // cut out of the head's line, closed across the root 4 mm inside the head (`FamilyConicExcursion.ts auricle`), read along rays from
        // the course and fitted to that skin, its grooves (`--pinna-grooves`, anchor indices of the limb layout) carried by inflection lines.
        { name: "pinna", centres: PINNA, course: "J.pinna", halves: PINNA_HALVES, up: [0, 0, 1], domain: [PINNA_DOMAIN[0]!, PINNA_DOMAIN[1]!], head: true, step: 1, gap: PINNA_GAP, tip: true, mirrored: true, excursion: "auricle", skin: process.argv.includes("--pinna-outer") ? "outer" : "inner", layouts: [{ layout: PINNA_GROOVES.length === 0 ? C.limb(PINNA_DEPTH) : C.inflected(PINNA_DEPTH, PINNA_GROOVES), depth: PINNA_DEPTH }], reliefs: [], pitch: EAR_PITCH },

        // The auricle's base plate: the sheet it is folded from, its cranial skin and that skin moved inside by its thickness, read from the
        // same excursion as the pinna, on a course along the auricle's long axis through the plates' middles; the helix and the antihelix
        // are tubes merged on it and the hollows are the spaces between them.
        { name: "plate", centres: PLATE, course: "J.plate", halves: PLATE_HALVES, up: [0, 0, 1], ...(PLATE_ROLL === undefined ? {} : { roll: PLATE_ROLL }), domain: [PLATE_DOMAIN[0]!, PLATE_DOMAIN[1]!], head: true, step: 1, gap: PINNA_GAP, tip: true, foot: 3, mirrored: true, excursion: "auricle", plate: { thickness: PLATE_THICKNESS, into: 6, deepest: plateDeepest, rim: PLATE_RIM }, skin: "inner", layouts: [{ layout: PLATE_LENS ? C.lens(PLATE_DEPTH) : C.limb(PLATE_DEPTH), depth: PLATE_DEPTH }], reliefs: [], pitch: EAR_PITCH },

        // The nose's free end as a short loft straight forward out of the face, closed at its tip.
        // Its course starts 5 mm behind the box's frontal plane, so its first section, half a millimetre into the box, lies on the wings.
        // `--nose-vertical`: the nose cut out of the face's level sections as an excursion (`FamilyConicExcursion.ts nose`), on a course down
        // the median plane 11 mm in front of x 100, which every level section but the nostrils' is star-shaped about (scratch kernel probe),
        // fitted to its skin as a half with the supra-alar crease as a groove after the tip's extreme, and closed under the columella.
        ...(NOSE_VERTICAL ? [{ name: "nose", centres: [[111, 1590, 0], [111, 1536, 0]] as R.V[], course: "[J.noseTop, J.noseBottom]", halves: [], up: [1, 0, 0] as R.V, domain: [8.5, 47.5] as [number, number], head: true, step: 1, gap: 3, tip: 50, covered: true, mirrored: false, excursion: "nose", skin: "outer" as const, margin: NOSE_MARGIN, layouts: [{ layout: NOSE_WING_LINES ? NOSE_WING : NOSE_FEATURES ? C.featured(C.bilateral(NOSE_DEPTH), [{ after: 0, anchors: [{ kind: "f", feature: "inflection", window: [0.15, 0.55] }, { kind: "f", feature: "concave", window: [0.3, 0.75] }, { kind: "f", feature: "inflection", window: [0.5, 0.9] }] }, ...(process.argv.includes("--nose-root-groove") ? [{ after: 2, anchors: [{ kind: "f" as const, feature: "inflection" as const, window: [0.1, 0.45] as [number, number] }, { kind: "f" as const, feature: "concave" as const, window: [0.25, 0.65] as [number, number] }, { kind: "f" as const, feature: "inflection" as const, window: [0.45, 0.85] as [number, number] }] }] : [])]) : C.inflected(NOSE_DEPTH, NOSE_GROOVES ?? [0], C.bilateral(NOSE_DEPTH)), depth: NOSE_DEPTH }], reliefs: [] as IWindow[] }] : []),
        { name: "nose", centres: [[108, 1556, 0], [140, 1556, 0]], course: "[J.noseRoot, J.noseTip]", halves: [], up: [0, 1, 0], domain: [5.5, 24], head: true, loose: true, step: 1, gap: 3, tip: 28, mirrored: false, layouts: NOSE_GROOVES === undefined ? LIMB : [{ layout: C.inflected(NOSE_DEPTH, NOSE_GROOVES, process.argv.includes("--nose-half") ? C.bilateral(NOSE_DEPTH) : C.limb(NOSE_DEPTH)), depth: NOSE_DEPTH }], ...(NOSE_GROOVES === undefined ? {} : { skin: "outer" as const }), clip: (p: R.V): number => (NOSE_GROOVES === undefined ? -nose(p) : Math.max(-nose(p), nostrilPit(p))), reliefs: [], casts: NOSE_GROOVES !== undefined ? [] : [
          // The floor behind the lobule. The sections close it along the box's floor, so between each wing's outer rim and the columella
          // the hull is one flat chord at 1,543 mm, 1 to 3 mm below the reference's wing round each nostril (rays going up from below, the
          // first downward-facing skin each meets). Cast straight up from the band's rail behind the nostrils (station 8.5) to the lobule,
          // whose own finer net starts inside this one's whole part. What each nostril's cut takes is left unobserved (`nostrilPit`), so the
          // net bridges it with the fairest surface and the cutter meets a smooth floor; a coarse net, since a fine one followed the pits'
          // rims into spikes. Skin below 1,542.5 mm is the lip's turn into the subnasale, which the band spans: observed, it drew the
          // floor's middle down into a beak where the band lands.
          { name: "floor", stations: [8.5, 25], phases: [Math.PI - 1.1, Math.PI + 1.1], axis: [0, 1, 0], skin: (p: R.V): number => Math.max(-nose(p), nostrilPit(p), p[1] < 1542.5 ? 10 : -10), rows: FLOOR_NET[0], columns: FLOOR_NET[1], reach: 3, facing: 0.3, mirror: true, fade: [1.5, 2], fadePhase: [0.35, 0.35] },
          // The lobule's underside. Its net asked for the whole height up to its edges stood 2.4 to 4.4 mm deep one column from its zero
          // edge columns, and the cliff showed as upright slivers on either side of the tip in profile; it hands its edges over (`fade`).
          { name: "under", stations: [22.5, 27], phases: [Math.PI - 1.1, Math.PI + 1.1], axis: [0, 1, 0], rows: 31, columns: 39, reach: 2.5, mirror: true, fade: [1, 1.5], fadePhase: [0.35, 0.35] },
          ...[{ name: "side", stations: [SIDE_NET[2]!, SIDE_NET[3]!] as [number, number], phases: [-SIDE_NET[4]!, SIDE_NET[4]!] as [number, number], axis: [0, -1, 0] as R.V, turn: [0, 0, 1] as R.V, skin: (p: R.V): number => Math.max(-nose(p), p[1] - SIDE_NET[8]!), rows: SIDE_NET[0]!, columns: SIDE_NET[1]!, reach: SIDE_NET[5]!, mirror: true, fade: [SIDE_NET[9] ?? 0, SIDE_NET[6]!] as [number, number], fadePhase: [SIDE_NET[7]!, SIDE_NET[7]!] as [number, number], observe: Math.max(5.5, SIDE_NET[2]!), ...(SIDE_NET[10] === undefined ? {} : { held: (s: number, phi: number): boolean => s < 5.5 + NOSE_RAIL(phi) + SIDE_NET[10]! }) }],
        ] },
        // The breast as a loft of its own through its dome's top (`BREAST_ROOT`), attached at a port on the chest that the trunk's sections
        // leave out (`breasts`), so the fold under it is the band's short side. Its sections read the skin inside a cylinder about the course
        // (`BREAST_RADIUS_MM`). They start 19 mm behind the top: straight down the chest stands 24 to 26 mm behind it, down and inward 21 mm,
        // so the first plane cuts the breast's underside clear of the chest at every phase.
        { name: "breast", centres: [BREAST_ROOT, BREAST_TIP], course: "[J.breastRoot, J.breastTip]", halves: [], up: [0, 1, 0], domain: [11, BREAST_TO], loose: true, step: 1, gap: 3, tip: true, cap: BREAST_CAP, mirrored: true, layouts: LIMB, clip: breast, round: breast, reliefs: [] },
        // The ear's hollow as a loft of its own. The auricle is a thin shell: a sagittal plane cuts it in one loop shaped like a C, and what
        // the C stands round, the concha and the scapha, is the pocket between that loop and its hull, open to the front
        // (`FamilyConicScan.ts concha`: 435 mm2 at 78 mm out, 33 at 94). The loft runs out through those pockets.
        { name: "concha", centres: CONCHA_TRIAL ?? [[-0.7, 1580, 99.5], [15, 1580, 77.5]], course: CONCHA_TRIAL === undefined ? "[J.conchaRoot, J.conchaTip]" : JSON.stringify(CONCHA_TRIAL).replaceAll(",", ", "), halves: [], up: CONCHA_UP, domain: CONCHA_DOMAIN, head: !process.argv.includes("--concha-body"), loose: true, step: 0.5, gap: 3, tip: CONCHA_TIP, lead: CONCHA_LEAD, pocket: 5, mirrored: true, layouts: [LIMB[0]!], clip: (p: R.V): number => -Math.min(ear(p) + 77 - Math.min(77, CONCHA_FLOOR), Math.abs(p[2]) - CONCHA_FLOOR, p[0] - CONCHA_BOX[0], CONCHA_BOX[1] - p[0], p[1] - CONCHA_BOX[2], CONCHA_BOX[3] - p[1]), reliefs: [] },
        // A nostril as a hollow of its own: level planes cut one closed loop of it from 1,551 to 1,555 mm, 10 by 8 mm at its mouth
        // (`FamilyConicScan.ts nostril`). Its loft runs straight up through that loop, closes where the loop vanishes and is carried 8 mm
        // down out of the nose, to be cut from the head (`diff`).
        { name: "nostril", centres: [[127.1, 1540.4, 7.7], [119.1, 1560.4, 7.7]], course: "[J.nostrilRoot, J.nostrilTip]", halves: [], up: [1, 0, 0], domain: [9, 13], head: true, loose: true, step: 0.5, gap: 1.5, tip: 16, lead: 9, mirrored: true, layouts: LIMB, clip: (p: R.V): number => -Math.min(p[0] - 114, 130 - p[0], p[2] - 1, 13 - p[2]), reliefs: [] },
        // The armpit's slit as a cutter of its own (G11, G12). The slit between the trunk's side and the arm's inner side is not star-shaped
        // about the trunk's course (the conic audit: y 1,280 mm, 92 to 105 degrees, a gap of 6.6 mm), and the arm's band closes it 12 to 17 mm
        // under its apex. Each section is the air round a course laid low in the slit, in its kernel (`air`): capped under the generated band
        // (`AXILLA_FLOOR`) and drawn in from the walls (`AXILLA_INSET`); its arm-side reach is 12 mm, short of the band's ring end. Its
        // arm-side flank is concave under the apex: a groove after the apex (`inflected(1, [0])`; on the 8-conic layout a groove seeds only
        // after a `u` extreme). Both ends close inside the slit, as the stored cutter's (`AutoMovieHumanF1Axilla`): refitted on the same course and insets whenever the band it is capped under moves (`AXILLA_BAND`).
        { name: "axilla", centres: AXILLA, course: JSON.stringify(AXILLA).replaceAll(",", ", "), halves: [8, 5], up: [0, 1, 0], domain: AXILLA_DOMAIN, step: 1, gap: 4, first: AXILLA_DOMAIN[0] - AXILLA_CAPS_MM[0], tip: AXILLA_DOMAIN[1] + AXILLA_CAPS_MM[1], mirrored: true, skin: "inner", margin: AXILLA_MARGIN, construct: { knots: [25, 34, 43, 52, 61, 70, 78], corner: CONSTRUCT_CORNER_MM, apex: CONSTRUCT_APEX_MM }, air: { band: AXILLA_BAND, floor: AXILLA_FLOOR, reach: 12, inset: AXILLA_INSET, sag: 0, side: AXILLA_ARM_SIDE_MM }, layouts: AXILLA_LAYOUTS[process.argv.find((a: string): boolean => a.startsWith("--axilla-layout="))?.slice("--axilla-layout=".length) ?? "groove"]!, reliefs: [] },
        // The vault in front of the armpit as a cutter of its own (G11): the arm's band crosses it flat, 12 to 16 mm under the reference's
        // vault, its columns running aslant to the vault's planes. Every section of the vault is convex, so the plain 8-conic limb carries it
        // (0.56 mm on the same sections, where the slit's groove stalled at 1.67 mm). Its sections are the vault's air, read as the slit's
        // are, with a reach of 20 mm, since the vault is up to 28 mm wide. Both ends close: its back tip at x about 0, clear of the slit
        // cutter's front tip at x -1.9.
        { name: "vault", centres: VAULT, course: JSON.stringify(VAULT).replaceAll(",", ", "), halves: [], up: [0, 1, 0], domain: [2, 18], step: 1, gap: 4, first: -1, tip: 20, mirrored: true, skin: "inner", construct: { knots: [2, 10, 18], corner: CONSTRUCT_CORNER_MM, apex: CONSTRUCT_APEX_MM }, air: { band: AXILLA_BAND, floor: [[0, VAULT_FLOOR_MM]], reach: 20, inset: VAULT_INSET }, layouts: [{ layout: C.limb(1), depth: 1 }], reliefs: [] },
        // The nostrils open downward, and a frontal section shows only the nose's outline round them. A net over the nose's underside, cast
        // straight up, reads the first skin a ray from below meets, and found them: 3 to 5 mm deep and more, from 124 to 128 mm forward
        // (`--casts`). That is where a band 2 mm in landed: with the dimples in it the rail's ring was no longer star-shaped and the port
        // refused the nose. The nostrils are now cutters of their own and the net covers the lobule alone; the band lands on a curve round
        // the nose (`AutoMovieHumanF1.ts`, `NOSE_RAILS_MM`).

        // The trunk from the crotch to the crown as one wall. Knots 4 mm apart from the neck up followed every step of the face's hull and left
        // the wall streaked, so they keep 8 mm and the face is the reliefs'. Under the jaw alone, stations 692 to 732, they may stand 3 mm
        // apart: there a level section goes from the neck's round to the chin's keyhole within 25 mm, and at 8 mm the wall smeared that step
        // into flaps along the jaw. Fitted whole with those knots the chest's reliefs came out worse (882 numbers, 0.74 mm), so the wall
        // kept is the earlier one below station 640 and this one above it, with every relief fitted again over the splice
        // (`--wall=<earlier> --splice=<this>@640 --refit`): 693 numbers at 0.66 mm. The ears are left out of its sections. It owns the shoulders down to the armscye plane through the armpit's
        // crease. The skin past the armscye's landmark loop (construction.md, Ports: "The loop passes through the landmarks that define it by
        // their published definitions"), on the arm's side of the surface its lifted rays sweep (`FamilyConicLoop`), and inside the arm's own
        // tube is the arm's and is left out of the trunk's sections. Cut by the sagittal plane through the crease instead, the chest's sections
        // turned 50 to 79 degrees within 2 mm where the plane met the skin, a corner the fairing rang round. The tube still bounds the loop's
        // side: the surface swept from the loop is a graph over its plane and reaches the hip's side, 32 of f1's vertices at 758 to 884 mm
        // up standing up to 4.7 mm past it.
        // With feature lines (`--trunk-lines`) the arm's opening is closed across by its own closure, not the clip's chord (`IPart.opening`),
        // and from the chin's start (`CHIN.y`, 1,476 mm, station 696) to the crown each section is its hull: the face's pairs of inflections,
        // 10 to 56 degrees, outnumber any trunk layout's lines, and the face's detail is its reliefs' (face, mouth, eyes, chin), refitted on
        // the new wall (construction.md, Repair).
        // The front arcs' shoulders at knot 792 are laid from their neighbours (`--relay=792,814,834:6 --relay-stored=792:6,7`): the face's refit
        // without the nose stored -0.20, 0.03 and 1.17 there, out of the model's bounds, and the curvature match then held both arcs either side
        // of the front median at 0.09 to 0.14, near-chords that turned within 0.26 mm and drew an upright slash down each cheek (`head.front`
        // px 288..300 x 440..525). Laid as the natural cubic through 740, 814 to 912, they stand at 0.48 to 0.49 and the turn's radius at 9 mm.
        { name: "trunk", centres: [[0, 780, 0], [0, 1705, 0]], course: "[J.axisFloor, J.axisCrown]", halves: [], up: [1, 0, 0], domain: [28, 912], whole: true, step: 2, gap: (s: number): number => (s >= 692 && s <= 732 ? Number(process.argv.find((argument: string): boolean => argument.startsWith("--jaw="))?.slice(6) ?? 3) : s > 740 ? FACE_GAP_MM : 12), tip: true, cap: 906, centre: [16, 0], own: true, mirrored: false, layouts: TRUNK_LINES ? TRUNK_LINED : BILATERAL, ...(TRUNK_LINES ? { skin: "outer" as const, folded: "hull" as const, hullFrom: CHIN.y - 780 } : {}), opening: armHole, round: chin, kept: breasts, clip: (p: R.V): number => Math.max(ear(p), noseCut(p), chin(p), breasts(p), armHole(p)), reliefs: [
          // Every window's cast turns with the phase (`turn`), so it is square to the wall across its whole width. On fixed axes the windows
          // had to stop at 1.0 to 1.2 rad: farther round a height slid a point along the wall instead of moving it in or out, which folded
          // the skin at the sides of the head and the shoulders.
          // Below the chest one net goes once round the trunk. As a window to the front and one to the back, 1.5 rad to either side, the two
          // met in a seam down each hip, a line from the waist to the thigh.
          { name: "trunk.low", stations: [-40, 520], phases: [0, 2 * Math.PI], axis: [1, 0, 0], turn: [0, 0, 1], rows: 59, columns: 83, mirror: false, periodic: true, reach: 70, fade: [0, 60] },
          // The trunk's end, where the crotch's band leaves it for the thighs: the wall there is the tape across the thighs' fronts, up to
          // 6 mm outside the skin, and the net round the trunk, 10 mm a row, brought it home but curled its last 3 mm (the normal's rise
          // from 0.05 to 0.12 at [87..132, 806..810], a level line across each thigh's front on `hip.high-oblique`). A net 3 mm a row and
          // 0.04 rad a column over each thigh's side, from below the end so no zero row lies on it, fitted after the round net, takes the
          // rest. It stops 0.3 rad short of the median line and hands its edges over there: carried round the whole end it carved the notch
          // between the thighs' fronts 20 mm deep, moved the front fork and shortened the crotch's chord from 71 to 51 mm.
          { name: "trunk.crotch", stations: [-12, 88], phases: [0.3, 2.0], axis: [-0.4085, 0, -0.9128], turn: [0.9128, 0, -0.4085], rows: 36, columns: 46, mirror: false, twin: true, reach: 30, fade: [0, 30], fadePhase: [0.3, 0.3] },
          // Over the chest and the shoulders the windows stop at 1.0 rad, short of the fold beside the armpit. While the trunk kept a stump of
          // arm the tape bridged from the breast to it, with the skin deep inside that bridge from about 0.6 to 1.3 rad: a window ending there
          // creased the whole chest and back along its edge, and one reaching 1.45 rad left a thin flap in the fold beside the armpit.
          { name: "trunk.chest.back", stations: [380, 680], phases: [Math.PI - 1.2, Math.PI + 1.2], axis: [1, 0, 0], turn: [0, 0, 1], rows: 63, columns: 41, mirror: true, reach: 40, fade: [30, 25], fadePhase: [0.3, 0.3] },
          { name: "trunk.chest.front", stations: [380, 680], phases: [-1.2, 1.2], axis: [-1, 0, 0], turn: [0, 0, -1], rows: 63, columns: 41, mirror: true, reach: 40, fade: [30, 25], fadePhase: [0.3, 0.3] },
          // The side, from the breast's edge round under the arm to the shoulder blade's: the front and back windows end 1.2 rad from the
          // median line, and between them the wall stood as the tape left it, 7 to 10 mm outside the skin in the hollow over the collar
          // bone and in the fold in front of the armpit (`FamilyConicDeviation.ts`). One window spans the whole side, so its edges lie on
          // skin the front and back windows have already brought home and it has nothing to take there; across the arm's cut it reads the
          // arm's own skin as far as its reach (`uncut`). Each side is fitted on its own skin: the trunk is fitted whole, not as a half and
          // its image, and one side's net reflected onto the other left patches 2 to 4 mm full over one shoulder.
          // Over the shoulder's top, from 610 mm up, the skin faces up and a height square to the side slides along it: there the window
          // dug a notch beside the neck at [8..28, 1391..1413, 85..101] on `shoulder.high-oblique`, gone with this window taken off and only
          // softened with the shoulder's casts taken off. It hands that skin over to the casts straight down (`shoulder`) over its last 90 mm; over its last 70 the notch was softened but still there.
          { name: "trunk.chest.side", stations: [400, 680], phases: [Math.PI / 2 - 0.82, Math.PI / 2 + 0.82], axis: [0, 0, -1], turn: [1, 0, 0], rows: 59, columns: 53, mirror: false, twin: true, uncut: true, reach: 25, fade: [30, 90] },
          // The fold under each breast, from the sternum round to the side, where the reference's skin turns from the breast's underside
          // to the chest within a few millimetres. The chest's nets are 5 mm a row, and a cubic net that coarse rounded the fold over 10 to
          // 15 mm, a soft shelf drawn in level bands 4 mm tall. A net 3 mm a row over the fold's stations lets the crease turn within two
          // rows (its heights reach only 0.3 mm: the sections already fit there), and the layers inside it are cut as fine (`leaf`). The
          // sections are 2 mm apart and every other one is withheld, so a net 2 mm a row, and one 0.016 or 0.024 rad a column, had rows the
          // fit saw once and drew the reference's facets as a mottle; 3 mm and 0.035 rad, 5 mm at the breast, see each row twice. Cast
          // square to the wall about its middle phase, 0.75 rad, as the chest's windows are, and fitted after them.
          { name: "trunk.fold", stations: [400, 490], phases: [0.05, 1.45], axis: [-0.7317, 0, -0.6816], turn: [0.6816, 0, -0.7317], rows: 33, columns: 43, mirror: false, twin: true, reach: 25, fade: [15, 15], fadePhase: [0.15, 0.15] },
          // The neck and head: windows whose cast turns with the phase (`turn`), square to the wall all the way round. One net goes round the
          // whole head with its seam down the back, and ends at the crown's tip, 918.88 mm, where a relief must vanish for the pole. With
          // fixed axes the head took four windows, front, back and two sides, whose edges met in a seam down the cheek and over the skull
          // and whose casts grazed the jaw's side; cast round, the cheek, the jaw's side, the temple and the ear's root are one smooth net
          // of fewer heights. A cast that lands farther than `reach` is not observed: between the lips one slipped through to what lies
          // behind, 78 mm on, and dug a pit in the mouth.
          // Both head nets end where the crown's cap starts and hand over to it over their last 30 mm (over 12 they still bent the wall just
          // below the cap, which continues the plain wall's slope: a flat crown with a corner at the back of it, [-25, 1687, 31]): carried on over the cap, which is
          // meshed in rings round its pole, they drew concentric rings and a mottled ridge round the crown (folds of 13 degrees, none without
          // them). Over the ear's footprint (`ear`) both are held on the wall: casts there land in the ear's cut and are not observed, and the
          // nets carried the heights round it (up to 17 mm) under the ear, fitted for the old ear's band. With the hold the concha's cut on the
          // new ear loses its kept side (`cut.concha` trim), to be fixed on the held skin with the ear's owner.
          { name: "trunk.head", stations: [620, 906], phases: [-Math.PI + 0.15, Math.PI - 0.15], axis: [-1, 0, 0], turn: [0, 0, -1], rows: 59, columns: 109, mirror: true, reach: 35, fade: [30, 30], hold: earHeld },
          // The head's net is zero along its seam down the back, where the skin still lies inside the tape and a ridge stood; this window
          // over the back takes what the first leaves there. Its edges round the head hand over (`fadePhase`): with hard edges at 2.14 rad
          // they drew upright lines down the back of the head and behind each ear (`figure.back` px 400..500 x 160..230, `head.left` px 270..290).
          { name: "trunk.head.back", stations: [620, 906], phases: [Math.PI - 1.0, Math.PI + 1.0], axis: [1, 0, 0], turn: [0, 0, 1], rows: 60, columns: 39, mirror: true, reach: 20, fade: [30, 30], fadePhase: [0.3, 0.3], hold: earHeld },
          // The crown's own net, over the cap to its pole, fitted after the head's two nets so their rows below stay as they were (the concha's
          // rails stand on them). The head's nets end at the cap's base and leave the plain wall's misfit there, 2.3 mm inside the skull at
          // x -34 (the hull wall on convex skin), from which the cap rose 1.4 mm proud by x -24, a corner at the crown's back. Its rows are
          // 1 mm apart, the cap's own ring spacing near its base, and it vanishes with zero slope over the cap's last third (`fade`), where a
          // height that varied with the phase would draw rings round the pole.
          { name: "trunk.crown", stations: [886, 918.88], phases: [0, 2 * Math.PI], axis: [1, 0, 0], turn: [0, 0, 1], rows: 36, columns: 83, mirror: false, periodic: true, reach: 10, fade: [12, 4.3] },
          // Under the jaw the wall's knots stand 3 mm apart for the chin's step, and every field rippled with them: a ring 1.5 mm high
          // stood round the whole neck at that level, the nape included. A band 1.4 mm apart along the station, round the neck and again
          // over its back for the seam, takes the ring and follows the jaw's line where it rises to the sides. What stays is in front,
          // under the chin: that skin is level, a level section cannot sample it and a cast round the axis only grazes it.
          { name: "trunk.collar", stations: [680, 734], phases: [-Math.PI + 0.15, Math.PI - 0.15], axis: [-1, 0, 0], turn: [0, 0, -1], rows: 39, columns: 131, mirror: true, reach: 30, fade: [8, 8] },
          // The face: a finer net, 2.6 mm apart, between the throat and the brow.
          { name: "trunk.face", stations: [690, 890], phases: [-1.2, 1.2], axis: [-1, 0, 0], turn: [0, 0, -1], rows: 81, columns: 69, mirror: true, reach: 30, fade: [15, 15] },
          // The mouth: a net 1.5 mm apart over its band of the face, which the face's net left a block.
          { name: "trunk.mouth", stations: [722, 758], phases: [-0.5, 0.5], axis: [-1, 0, 0], turn: [0, 0, -1], rows: MOUTH_NET[0], columns: MOUTH_NET[1], mirror: true, reach: 12, fade: [5, 5] },
          // The navel: the round net, 9.5 mm a row, left a soft dimple where the reference has a pit. A net 2 mm apart over it, cast as the
          // belly's is and handing its edges over.
          { name: "trunk.navel", stations: [258, 290], phases: [-0.3, 0.3], axis: [-1, 0, 0], turn: [0, 0, -1], rows: 19, columns: 23, mirror: true, reach: 20, fade: [8, 8], fadePhase: [0.12, 0.12] },
        ], casts: [
          // The eyes: a net 1.5 mm apart over their band, cast in space onto the outermost skin. The reference's eyeball is a closed
          // surface of its own behind the lids (`FamilyConicScan.ts eye`), which no section of the trunk holds: cast in the section
          // planes, the eyes' net ran past the lids into the socket and drew a dark slit. Cast in space, between the lids it lands on the
          // eyeball and over them on the lids.
          // At 1.3 mm a row (26 by 105) the net turned within one row where its cast jumps from the lid to the eyeball and drew a hard
          // crease along each upper lid; at 2 mm the lid rolls into the socket.
          { name: "eyes", stations: [792, 826], phases: [-0.8, 0.8], axis: [-1, 0, 0], turn: [0, 0, -1], rows: 20, columns: 73, reach: 12, mirror: true },
          // The chin, which the sections leave out (`CHIN`): cast from the cone's wall forward and down at 45 degrees on the median line,
          // so the chin's front and the level skin under it are both seen at 45 degrees and the chin is one height over the wall. 1.4 mm a
          // row: at 0.95 (47 by 57) it drew the reference's facets over the chin as a checker.
          { name: "chin", stations: [690, 734], phases: [-0.8, 0.8], axis: [-Math.SQRT1_2, Math.SQRT1_2, 0], turn: [0, 0, -1], skin: (p: R.V): number => Math.max(ear(p), noseCut(p)), rows: 33, columns: 41, reach: 30, mirror: true, fade: [6, 6], fadePhase: [0.15, 0.15] },
          // The top of each shoulder, between the neck's muscle and the shoulder's point: the skin there faces up, a cast round the axis
          // grazes it, and it stood 2 to 4 mm full on both sides (`FamilyConicDeviation.ts`). A coarse net cast straight down takes it.
          // It lands only on skin that faces up within 37 degrees, as the sole's does: toward the window's sides the skin turns to face
          // outward and a height straight down slides the wall along itself. Landing anywhere, the -Z net left the slope streaked with
          // folds of 44 degrees; landing on skin that faces up, 33.
          // Its edges hand over (`fade`, 12 mm and 0.2 rad): the side window now leaves it the shoulder's top, and a net asked for the
          // whole height right up to its zero edge falls off within two rows.
          { name: "shoulder", stations: [596, 664], phases: [0.95, 1.95], axis: [0, -1, 0], rows: 17, columns: 27, reach: 8, facing: 0.8, twin: true, nearest: true, fade: [12, 12], fadePhase: [0.2, 0.2] },
          // No net over the crown. The conic cap stood 3 to 4 mm under the skull and a coarse net cast along the course lifted it; the cap
          // that bends as the wall does is full enough, and meshed in rings the net drew rings round the pole.
        ] },
      ] satisfies IPart[]
    ).filter((part: IPart, i: number, all: IPart[]): boolean => (only.length === 0 || only.includes(part.name)) && all.findIndex((other: IPart): boolean => other.name === part.name) === i);
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

      // Each section's own loop as it was cut, which for a loose part is not the hull its wall is measured against.
      const loops: C.P[][] = [];
      const step: number = part.step ?? STEP_MM;
      const gap = (s: number): number => (typeof part.gap === "function" ? part.gap(s) : (part.gap ?? GAP_MM));
      const skin: R.ISource["body"] = part.head === true ? source.head : part.whole === true ? source.all : source.body;
      // `--air-skin=<directory>`: an air part's walls are the reference's skin and the generated trunk's together (a `zone` dump:
      // `mesh.positions.bin` in metres, `mesh.indices.bin`, `mesh.owners.json`, its faces owned by `trunk`), the nearest crossing along
      // each ray kept. A cutter must stay inside the walls it cuts: the stored slit cutter, read from the reference's walls alone, lost its
      // walk where the generated trunk's wall stands 10 mm inside the reference's air. The generated body alone has no slit to read (its
      // armpit, slit and vault included, is the arm band), and with the generated arm's faces as walls too the cutter hugged the arm's own
      // face 1.5 mm inside it and its walk was lost on that face at the cutter's front end.
      const airFrom: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--air-skin="))?.slice(11);
      const generated: { positions: Float64Array; indices: Uint32Array } | null = part.air === undefined || airFrom === undefined ? null : await (async () => {
        const pb: Buffer = await fs.readFile(path.join(airFrom, "mesh.positions.bin"));
        const ib: Buffer = await fs.readFile(path.join(airFrom, "mesh.indices.bin"));
        const owners: { owners: string[]; triangle: number[] } = JSON.parse(await fs.readFile(path.join(airFrom, "mesh.owners.json"), "utf8"));
        const metres: Float64Array = new Float64Array(pb.buffer, pb.byteOffset, pb.length / 8);
        const all: Uint32Array = new Uint32Array(ib.buffer, ib.byteOffset, ib.length / 4);
        const offset: number = skin.positions.length / 3;
        const kept: number[] = Array.from(skin.indices);
        for (let t: number = 0; t < all.length / 3; ++t) if (owners.owners[owners.triangle[t]!] === "trunk") kept.push(offset + all[3 * t]!, offset + all[3 * t + 1]!, offset + all[3 * t + 2]!);
        return { positions: Float64Array.from([...Array.from(skin.positions), ...Array.from(metres, (x: number): number => x * 1000)]), indices: Uint32Array.from(kept) };
      })();

      // `--concha-depth=<half width>`: a hollow read from the depth of the skin along the course instead of from plane cuts. Over the square
      // of that half width round the course's first centre, in the plane square to the course, the first skin met along the course is
      // sampled every quarter millimetre (the least station over each point); a section at station `s` is the region round the course
      // where that skin lies past `s`, walked out ray by ray from the course. A dip whose sides open toward skin barely higher than its
      // floor, as the concha does toward the cheek and a valley between two fingers toward their backs, has no loop of its own in any
      // plane cut. The course must be straight.
      let depthGrid: { n: number; w: Float64Array; o: R.V; u: R.V; v: R.V; t: R.V; half: number } | null = null;
      const depthAt = (a: number, b: number): number => {
        if (depthGrid === null) {
          const half: number = CONCHA_DEPTH!;
          const f0: AutoMovieLoftFrame.IFrame = axis.at(0);
          const o: R.V = [f0.origin[0], f0.origin[1], f0.origin[2]];
          const u: R.V = [f0.u[0], f0.u[1], f0.u[2]];
          const v: R.V = [f0.v[0], f0.v[1], f0.v[2]];
          const t: R.V = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
          const ahead: R.V = axis.at(1).origin as R.V;
          if ((ahead[0] - o[0]) * t[0] + (ahead[1] - o[1]) * t[1] + (ahead[2] - o[2]) * t[2] < 0) t.forEach((_: number, i: number): void => void (t[i] = -t[i]!));
          const n: number = Math.round((2 * half) / 0.25) + 1;
          const w: Float64Array = new Float64Array(n * n).fill(Infinity);
          const local = (i: number): R.V => {
            const d: R.V = [skin.positions[i * 3]! - o[0], skin.positions[i * 3 + 1]! - o[1], skin.positions[i * 3 + 2]! - o[2]];
            return [d[0] * u[0] + d[1] * u[1] + d[2] * u[2], d[0] * v[0] + d[1] * v[1] + d[2] * v[2], d[0] * t[0] + d[1] * t[1] + d[2] * t[2]];
          };
          for (let k: number = 0; k + 2 < skin.indices.length; k += 3) {
            const [p, q, r]: R.V[] = [local(skin.indices[k]!), local(skin.indices[k + 1]!), local(skin.indices[k + 2]!)];
            if (Math.max(p[0], q[0], r[0]) < -half || Math.min(p[0], q[0], r[0]) > half || Math.max(p[1], q[1], r[1]) < -half || Math.min(p[1], q[1], r[1]) > half) continue;
            const d: number = (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
            if (d === 0) continue;
            for (let i: number = Math.max(0, Math.ceil((Math.min(p[0], q[0], r[0]) + half) / 0.25)); i < n && -half + i * 0.25 <= Math.max(p[0], q[0], r[0]); ++i)
              for (let j: number = Math.max(0, Math.ceil((Math.min(p[1], q[1], r[1]) + half) / 0.25)); j < n && -half + j * 0.25 <= Math.max(p[1], q[1], r[1]); ++j) {
                const [x, y]: number[] = [-half + i * 0.25, -half + j * 0.25];
                const s: number = ((x - p[0]) * (r[1] - p[1]) - (y - p[1]) * (r[0] - p[0])) / d;
                const g: number = ((q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0])) / d;
                if (s < 0 || g < 0 || s + g > 1) continue;
                w[i * n + j] = Math.min(w[i * n + j]!, p[2] + s * (q[2] - p[2]) + g * (r[2] - p[2]));
              }
          }
          depthGrid = { n, w, o, u, v, t, half };
        }
        const g = depthGrid;
        const i: number = Math.round((a + g.half) / 0.25);
        const j: number = Math.round((b + g.half) / 0.25);
        return i < 0 || j < 0 || i >= g.n || j >= g.n ? -Infinity : g.w[i * g.n + j]!;
      };
      const depthLoop = (s: number): C.P[] | null => {
        // Every frame's chart axes are the first frame's on a straight course; a section's point (a, b) is the grid's (a, b).
        if (!(depthAt(0, 0) > s)) return null;
        const loop: C.P[] = [];
        for (let k: number = 0; k < 96; ++k) {
          const phi: number = (2 * Math.PI * k) / 96;
          let r: number = 0;
          while (r < 40 && depthAt((r + 0.1) * Math.cos(phi), (r + 0.1) * Math.sin(phi)) > s) r += 0.1;
          if (r >= 40) return null;
          loop.push([r * Math.cos(phi), r * Math.sin(phi)]);
        }
        return loop;
      };

      // By ray of the last air section read, whether the floor or the reach stopped it; and by observed row, which of its points are invented.
      let airInvented: boolean[] | null = null;
      const invented: (boolean[] | null)[] = [];
      const inventedOf = (loop: C.P[]): boolean[] | null => {
        const flags: boolean[] | null = airInvented;
        if (flags === null) return null;
        return loop.map((p: C.P): boolean => flags[Math.round(((Math.atan2(p[1], p[0]) + 2 * Math.PI) / (2 * Math.PI)) * flags.length) % flags.length]!);
      };

      // The air round the course point in the frame's plane (`IPart.air`): the skin's crossings with the plane near the course, read along
      // 360 rays to the nearest, the floor and the reach, then drawn in along the polygon's normal. A plane's cut through the body mesh
      // alone is open where it meets the head mesh, so the rays read the crossing segments, not closed loops.
      const air = (frame: AutoMovieLoftFrame.IFrame, spec: NonNullable<IPart["air"]>): C.P[] | null => {
        airInvented = null;
        const o: number[] = [...frame.origin];
        const n: number[] = [frame.u[1] * frame.v[2] - frame.u[2] * frame.v[1], frame.u[2] * frame.v[0] - frame.u[0] * frame.v[2], frame.u[0] * frame.v[1] - frame.u[1] * frame.v[0]];
        const segments: [number, number, number, number][] = [];
        const walls: { positions: ArrayLike<number>; indices: ArrayLike<number> } = generated ?? skin;
        const at = (k: number): number[] => [0, 1, 2].map((a: number): number => walls.positions[3 * k + a]! - o[a]!);
        for (let t: number = 0; t + 2 < walls.indices.length; t += 3) {
          const q: number[][] = [at(walls.indices[t]!), at(walls.indices[t + 1]!), at(walls.indices[t + 2]!)];
          if (q.some((p: number[]): boolean => Math.hypot(p[0]!, p[1]!, p[2]!) > 2 * spec.reach)) continue;
          const d: number[] = q.map((p: number[]): number => p[0]! * n[0]! + p[1]! * n[1]! + p[2]! * n[2]!);
          const ends: C.P[] = [];
          for (let e: number = 0; e < 3; ++e) {
            const [a, b]: [number, number] = [e, (e + 1) % 3];
            if (d[a]! > 0 === d[b]! > 0) continue;
            const f: number = d[a]! / (d[a]! - d[b]!);
            const p: number[] = [0, 1, 2].map((k: number): number => q[a]![k]! + f * (q[b]![k]! - q[a]![k]!));
            ends.push([p[0]! * frame.u[0] + p[1]! * frame.u[1] + p[2]! * frame.u[2], p[0]! * frame.v[0] + p[1]! * frame.v[1] + p[2]! * frame.v[2]]);
          }
          if (ends.length === 2) segments.push([ends[0]![0], ends[0]![1], ends[1]![0], ends[1]![1]]);
        }
        const line = (knots: [number, number][], x: number): number => {
          for (let i: number = 0; i + 1 < knots.length; ++i) {
            const [a, b]: [number, number][] = [knots[i]!, knots[i + 1]!];
            if ((x - a[0]) * (x - b[0]) <= 0) return a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]);
          }
          return Math.abs(x - knots[0]![0]) < Math.abs(x - knots.at(-1)![0]) ? knots[0]![1] : knots.at(-1)![1];
        };
        const floor: number = line(spec.band, o[0]!) - line(spec.floor, o[0]!);
        const rays: number = 360;
        const wall = (dir: C.P): number => {
          let r: number = spec.reach;
          for (const [ax, ay, bx, by] of segments) {
            const [ex, ey]: [number, number] = [bx - ax, by - ay];
            const den: number = dir[0] * ey - dir[1] * ex;
            if (Math.abs(den) < 1e-12) continue;
            const t: number = (ax * ey - ay * ex) / den;
            const s: number = (ax * dir[1] - ay * dir[0]) / den;
            if (t > 0 && s >= 0 && s <= 1) r = Math.min(r, t);
          }
          return r;
        };
        // The floor, a level line in the world, is a line of constant `u` in the chart, since `v` runs across the level: a flat bottom whose
        // lowest point the fit may put at either end, and the vault's bottom guide jumped between them from station to station, which the
        // engine's spline through its stations read as a chain running back past a turn. The floor is bowed in the chart instead, its
        // lowest point under the course point: `u0 - AIR_SAG (1 - (v / W)^2)`, `W` the floor's half width read on the level line.
        const u0: number = (floor - o[1]!) / frame.u[1];
        const directions: C.P[] = Array.from({ length: rays }, (_: unknown, j: number): C.P => [Math.cos((2 * Math.PI * j) / rays), Math.sin((2 * Math.PI * j) / rays)]);
        const level: number[] = directions.map((dir: C.P): number => (dir[0] < 0 ? Math.min(wall(dir), u0 / dir[0]) : wall(dir)));
        const width: number = Math.max(1e-6, ...directions.map((dir: C.P, j: number): number => (dir[0] < 0 && Math.abs(level[j]! * dir[0] - u0) < 1e-6 ? Math.abs(level[j]! * dir[1]) : 0)));
        const hits: { p: C.P; y: number; invented: boolean }[] = directions.map((dir: C.P): { p: C.P; y: number; invented: boolean } => {
          const skinR: number = wall(dir);
          let r: number = skinR;
          if (dir[0] < 0) {
            // The bowed floor along the ray, by a fixed point from the level line's crossing: the bow is shallow, so it converges at once.
            let reach: number = u0 / dir[0];
            for (let i: number = 0; i < 8; ++i) reach = (u0 - (spec.sag ?? AIR_SAG_MM) * (1 - Math.min(1, ((reach * dir[1]) / width) ** 2))) / dir[0];
            r = Math.min(r, reach);
          }
          const lift: number = dir[0] * frame.u[1] + dir[1] * frame.v[1];
          // Invented where the floor or the reach stops the ray, not the skin (`--decompose`'s data weighting).
          return { p: [r * dir[0], r * dir[1]], y: o[1]! + r * lift, invented: r < skinR || skinR >= spec.reach };
        });
        airInvented = hits.map((h): boolean => h.invented);
        if (!(Math.min(...hits.map((h): number => Math.hypot(h.p[0], h.p[1]))) > Math.max(spec.inset[0], spec.inset[1]))) return null;
        const top: number = Math.max(...hits.map((h): number => h.y));
        // Drawn in along the normal, the polygon crosses itself at its corners; read along the same rays again, the innermost crossing kept.
        const drawn: C.P[] = hits.map((h, j: number): C.P => {
          const [a, b]: C.P[] = [hits[(j + rays - 2) % rays]!.p, hits[(j + 2) % rays]!.p];
          const l: number = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
          const share: number = Math.max(0, Math.min(1, (h.y - floor) / Math.max(1e-6, top - floor)));
          // `side`: drawn in further on the +v side, by the ray's `v` share of it and fading from the floor to the apex as the inset does,
          // so a cut crossing a band near where that band meets the wall on that side stands clear of the seam; at every height, it pinched
          // the slit's arm-side flank under its apex and the fit was refused.
          const d: number = spec.inset[0] + (spec.inset[1] - spec.inset[0]) * share + (spec.side ?? 0) * Math.max(0, directions[j]![1]) * (1 - share);
          return [h.p[0] - (d * (b[1] - a[1])) / l, h.p[1] + (d * (b[0] - a[0])) / l];
        });
        return X.star(drawn, rays, "inner")?.points ?? null;
      };

      // A plane's loop for the part: the one round the course, or for a `loose` part the largest closed loop the clip leaves whose hull holds the course.
      // The clipped skin piece behind the last section a surrounding part read: the largest of the pieces whose hull it is.
      let piece: C.P[] | null = null;
      // A part cut out of its host as an excursion of the reference head's sections (`IPart.excursion`), in the course's own planes and chart.
      let excursion: ((y: number) => X.ISection | null) | null = null;
      // The skin's two ends of the last guided excursion cut (`X.ISection.ends`): its invented closure lies behind both.
      let ends: [C.P, C.P] | null = null;
      // Each section's closure across its part's opening (`IPart.opening`), by station: one conic, an S of two, or the chord where neither is admissible.
      const closures: { s: number; kind: "conic" | "s" | "chord" | "short" | "outside"; detail?: string; span?: [number, number]; rho?: { side: number; most: number; used: number } }[] = [];
      // Each side's closure shoulder smoothed along the stations (set before the sections are read): the largest contained at each station,
      // fitted by least squares on natural cubic splines with knots every `GAP_MM`, as the fields are projected onto their knots.
      let closureCap: ((side: number, s: number) => number | undefined) | undefined;
      const cut = (frame: AutoMovieLoftFrame.IFrame, s: number): C.P[] | null => {
        piece = null;
        if (part.air !== undefined) return air(frame, part.air);
        ends = null;
        if (part.excursion !== undefined) {
          const entry: X.IPart | undefined = X.PARTS.find((p: X.IPart): boolean => p.name === part.excursion);
          if (entry === undefined) throw new Error("No excursion " + part.excursion);
          // The excursion is cut in the course's own chart, whose `u` stands out of the head as its box and its host line beside the box
          // assume, and only then turned into the part's rolled chart (`IPart.roll`): cut in the rolled chart the box lay along the wrong
          // axis and most sections came out as other pieces or none.
          const plain: AutoMovieViewAxis.IAxis = part.roll === undefined ? axis : K.axis({ centres: part.centres, halves: part.halves, up: part.up });
          excursion ??= X.along(source, entry, (t: number) => plain.at(t), domain[0] - 6, domain[1] + 6, 1.5);
          const section: X.ISection | null = excursion(s);
          ends = section?.ends ?? null;
          // The nostrils open into the levels from 1,546 to 1,551.5 mm: there the vertical nose bridges them by its hull, as the floor's
          // net bridged the pits, so the cutters keep them.
          if (section !== null && NOSE_VERTICAL && part.name === "nose" && frame.origin[1] > 1545.9 && frame.origin[1] < 1551.6) return R.hull(section.points).flatMap((p: C.P, k: number, hull: C.P[]): C.P[] => {
            const q: C.P = hull[(k + 1) % hull.length]!;
            const pieces: number = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1])));
            return Array.from({ length: pieces }, (_: unknown, i: number): C.P => [p[0] + ((q[0] - p[0]) * i) / pieces, p[1] + ((q[1] - p[1]) * i) / pieces]);
          });
          // A plate is read only off a piece closed across its root: a free loop (the lobule's free edge, the helix's top over the head) has
          // no cranial face, and the plate ends where the pieces do.
          const read: C.P[] | null = section === null ? null : part.plate === undefined ? section.points : section.kind === "excursion" ? X.plate(section.points, part.plate.thickness, part.plate.into, typeof part.plate.deepest === "number" ? part.plate.deepest : part.plate.deepest(s), part.plate.rim ?? 0) : null;
          if (read === null || part.roll === undefined) return read;
          const angle: number = AutoMovieNaturalSpline.evaluate(AutoMovieNaturalSpline.create(part.roll.knots, part.roll.values), s);
          const [c, n]: [number, number] = [Math.cos(angle), Math.sin(angle)];
          return read.map((p: C.P): C.P => [c * p[0] + n * p[1], c * p[1] - n * p[0]]);
        }
        if (part.name === "concha" && CONCHA_DEPTH !== undefined) return depthLoop(s);
        if (part.loose !== true || (part.surround !== undefined && s < part.surround.from)) {
          const whole: C.P[] | null = R.cut(skin, frame).loop;
          return whole === null || part.clip === undefined ? whole : without(whole, frame, part.clip, part.round, part.opening, (kind: "conic" | "s" | "chord" | "short" | "outside", detail?: string, span?: [number, number], rho?: { side: number; most: number; used: number }): void => void closures.push({ s, kind, ...(detail === undefined ? {} : { detail }), ...(span === undefined ? {} : { span }), ...(rho === undefined ? {} : { rho }) }), (side: number): number | undefined => closureCap?.(side, s));
        }
        const inside = (hull: readonly C.P[]): boolean => hull.every((p: C.P, i: number): boolean => p[0] * hull[(i + 1) % hull.length]![1] - p[1] * hull[(i + 1) % hull.length]![0] > 0);
        const clipped: C.P[][] = R.loops(skin, frame)
          .map((loop: C.P[]): C.P[] | null => (part.clip === undefined ? loop : without(loop, frame, part.clip)))
          .filter((loop: C.P[] | null): loop is C.P[] => loop !== null && loop.length >= 3);

        // A part that surrounds its branches reads the curve round every loop within its reach of the course: the hull of them all.
        if (part.surround !== undefined) {
          const pieces: C.P[][] = clipped.filter((loop: C.P[]): boolean => loop.every((p: C.P): boolean => Math.hypot(p[0], p[1]) < part.surround!.reach));
          piece = pieces.length === 0 ? null : pieces.reduce((a: C.P[], b: C.P[]): C.P[] => (Math.abs(R.area(b)) > Math.abs(R.area(a)) ? b : a));
          const near: C.P[] = pieces.flat();
          const around: C.P[] = near.length < 3 ? [] : R.hull(near);
          return around.length >= 3 && inside(around) ? around : null;
        }
        const kept: C.P[][] = clipped.filter((loop: C.P[]): boolean => inside(R.hull(loop)));
        const chosen: C.P[] | null = kept.length === 0 ? null : kept.reduce((a: C.P[], b: C.P[]): C.P[] => (Math.abs(R.area(b)) > Math.abs(R.area(a)) ? b : a));
        if (chosen === null || part.pocket === undefined) return chosen;

        // The pocket: the largest region between the loop and its hull, closed along one hull edge. That edge is pushed out by
        // `pocket` mm, so the cutter stands clear of the wall it is cut from along the pocket's mouth.
        const hull: C.P[] = R.hull(chosen);
        const at = (p: C.P): number => chosen.findIndex((q: C.P): boolean => q[0] === p[0] && q[1] === p[1]);
        const onHull = (p: C.P): boolean => hull.some((q: C.P): boolean => q[0] === p[0] && q[1] === p[1]);
        let best: C.P[] = [];
        for (let h: number = 0; h < hull.length; ++h) {
          const [i, j]: [number, number] = [at(hull[h]!), at(hull[(h + 1) % hull.length]!)];
          if (i < 0 || j < 0) continue;
          for (const step of [1, -1]) {
            const run: C.P[] = [];
            for (let k: number = i; ; k = (k + step + chosen.length) % chosen.length) {
              run.push(chosen[k]!);
              if (k === j) break;
            }
            if (run.length >= 3 && !run.slice(1, -1).some(onHull) && (best.length < 3 || Math.abs(R.area(run)) > Math.abs(R.area(best)))) best = run;
          }
        }
        if (best.length < 3) return null;
        // The pocket is drawn in toward its middle by `POCKET_INSET_MM` at its farthest point, so the rim round it keeps a thickness. At
        // its own size its two ends lie on the hull, where the cutter's wall and the host's would meet at no angle.
        const middle: C.P = [best.reduce((sum: number, p: C.P): number => sum + p[0], 0) / best.length, best.reduce((sum: number, p: C.P): number => sum + p[1], 0) / best.length];
        const reach: number = Math.max(...best.map((p: C.P): number => Math.hypot(p[0] - middle[0], p[1] - middle[1])));
        // `--pocket-inset=<mm>`: a trial inset in place of `POCKET_INSET_MM`, for a pocket whose ends come near the rim.
        const inset: number = Number(process.argv.find((argument: string): boolean => argument.startsWith("--pocket-inset="))?.slice("--pocket-inset=".length) ?? POCKET_INSET_MM);
        best = best.map((p: C.P): C.P => [middle[0] + (p[0] - middle[0]) * (1 - inset / reach), middle[1] + (p[1] - middle[1]) * (1 - inset / reach)]);
        const [a, b]: [C.P, C.P] = [best[0]!, best.at(-1)!];
        const length: number = Math.hypot(b[0] - a[0], b[1] - a[1]);
        let normal: C.P = [(b[1] - a[1]) / length, -(b[0] - a[0]) / length];
        if ((middle[0] - a[0]) * normal[0] + (middle[1] - a[1]) * normal[1] > 0) normal = [-normal[0], -normal[1]];
        // Pushed out as a bow, deepest at the edge's middle: pushed out square, the pocket had two parallel sides, and an arc between
        // parallel tangents is the one a conic chain cannot close.
        const bow: C.P[] = Array.from({ length: 9 }, (_: unknown, k: number): C.P => {
          const t: number = (k + 1) / 10;
          const out: number = part.pocket! * 4 * t * (1 - t);
          return [b[0] + (a[0] - b[0]) * t + out * normal[0], b[1] + (a[1] - b[1]) * t + out * normal[1]];
        });
        const pocket: C.P[] = [...best, ...bow];
        return inside(R.hull(pocket)) ? pocket : null;
      };
      // `--to=<station>`: fit only up to that station, for the head of a wall whose far end is spliced in from another fit. Fitted whole, a
      // wall's growth goes to its worst sections, and the arm's are in the hand, which left the shoulder with ten knots at a mean of 0.7 mm.
      const to: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--to="))?.slice(5);
      const whole: [number, number] = part.domain === "auto" ? span(skin, axis, part.centres) : part.domain;

      // `--from=<station>`: fit only from that station on, for the far end of a wall whose head is another fit's.
      const from: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--from="))?.slice(7);
      const domain: [number, number] = [from === undefined ? whole[0] : Number(from), to === undefined ? whole[1] : Number(to)];
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
      // A family fitted to its skin (`IPart.skin`): every section must be star-shaped about the course point, since the fit reads one radius
      // a phase. The skin is read along rays from the course, the innermost or outermost crossing kept, and each section whose rays crossed
      // its skin more than once, or missed it, is reported by station.
      const star: { s: number; folds: number }[] = [];
      const dumped: { s: number; loop: C.P[] | null }[] = [];
      // `--plain=<directory> --skin-range=<from>-<to>`: outside that station range the sections fitted are another stored wall's own, read
      // round its course every quarter degree, so a layout with feature lines refitted to the skin over a range keeps that wall elsewhere,
      // its features at no depth there. The trunk's median and off-axis lines live where its sections are star-shaped about the course,
      // 810 to 1,270 mm high (stations 30 to 490); above that, under the arms, the chin and the face, the sections fold.
      const plain: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--plain="))?.slice(8);
      const plainWall: K.IStored | null = plain === undefined ? null : (JSON.parse(await fs.readFile(path.join(plain, part.name + ".family.json"), "utf8")) as K.IStored);
      const plainRead: ((s: number) => number[]) | null = plainWall === null ? null : K.reader(plainWall);
      const skinRange: number[] = process.argv.find((argument: string): boolean => argument.startsWith("--skin-range="))?.slice(13).split("-").map(Number) ?? [-Infinity, Infinity];
      const own = (s: number): C.P[] => {
        const section: Q.ISection = C.chain(plainRead!(s), plainWall!.layout);
        return Array.from({ length: 1440 }, (_: unknown, j: number): C.P => {
          const phi: number = (2 * Math.PI * j) / 1440;
          const r: number = Q.radius(section, phi);
          return [r * Math.cos(phi), r * Math.sin(phi)];
        });
      };
      if (part.opening !== undefined) {
        for (let s: number = domain[0]; s <= domain[1] + 1e-9; s += step / 2) cut(axis.at(s), s);
        const bySide: Map<number, { s: number; most: number }[]> = new Map();
        for (const record of closures) if (record.rho !== undefined) bySide.set(record.rho.side, [...(bySide.get(record.rho.side) ?? []), { s: record.s, most: record.rho.most }]);
        closures.length = 0;
        const smoothed: Map<number, { from: number; to: number; at: (s: number) => number }> = new Map();
        for (const [side, points] of bySide) {
          const from: number = Math.min(...points.map((p) => p.s)), to: number = Math.max(...points.map((p) => p.s));
          const count: number = Math.max(2, Math.round((to - from) / GAP_MM) + 1);
          const knots: number[] = Array.from({ length: count }, (_: unknown, k: number): number => from + ((to - from) * k) / (count - 1));
          const cardinals = knots.map((_: number, m: number) => AutoMovieNaturalSpline.create(knots, knots.map((__: number, k: number): number => (k === m ? 1 : 0))));
          const rows: number[][] = points.map((p) => cardinals.map((spline): number => AutoMovieNaturalSpline.evaluate(spline, p.s)));
          const gram: number[][] = knots.map((_: number, m: number): number[] => knots.map((__: number, n: number): number => rows.reduce((sum: number, r: number[]): number => sum + r[m]! * r[n]!, 0)));
          const right: number[] = knots.map((_: number, m: number): number => rows.reduce((sum: number, r: number[], i: number): number => sum + r[m]! * points[i]!.most, 0));
          const values: number[] | null = F.solve(gram, right);
          if (values === null) continue;
          const spline = AutoMovieNaturalSpline.create(knots, values);
          smoothed.set(side, { from, to, at: (s: number): number => AutoMovieNaturalSpline.evaluate(spline, s) });
        }
        closureCap = (side: number, s: number): number | undefined => {
          const fitted = smoothed.get(side);
          return fitted === undefined || s < fitted.from || s > fitted.to ? undefined : fitted.at(s);
        };
      }      const targetDir: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--target-wall="))?.slice("--target-wall=".length);
      const targetStored: K.IStored | null = targetDir === undefined ? null : (JSON.parse(await fs.readFile(path.join(targetDir, part.name + ".family.json"), "utf8")) as K.IStored);
      const targetWall: { read: (s: number) => number[]; layout: C.ILayout } | null = targetStored === null ? null : { read: K.reader(targetStored), layout: targetStored.layout };      for (let s: number = domain[0], i: number = 0; s <= domain[1] + 1e-9; s += step / 2, ++i) {
        const frame: AutoMovieLoftFrame.IFrame = axis.at(s);
        if (plainRead !== null && (s < skinRange[0]! || s > skinRange[1]!)) {
          const points: C.P[] = own(s);
          rows.push({ s, points, heldout: i % 2 === 1 });
          skins.push(points);
          loops.push(points);
          invented.push(null);
          continue;
        }
        const cutLoop: C.P[] | null = cut(frame, s);
        const starred: { points: C.P[]; folds: number } | null = part.skin === undefined || cutLoop === null ? null : X.star(cutLoop, SKIN_RAYS, part.skin);
        if (part.skin !== undefined && cutLoop !== null) star.push({ s, folds: starred === null ? -1 : starred.folds });
        // `--kernels`: each section's kernel point (the centre of its largest inscribed circle) in the world, and how many of 720 rays from
        // it and from the course point cross the section more than once, to lay a course through the kernels before fitting the skin.
        if (process.argv.includes("--kernels") && cutLoop !== null) {
          const core: { point: C.P; clearance: number } = X.kernel(cutLoop);
          const world: number[] = [0, 1, 2].map((k: number): number => frame.origin[k]! + core.point[0] * frame.u[k]! + core.point[1] * frame.v[k]!);
          const shifted: C.P[] = cutLoop.map((p: C.P): C.P => [p[0] - core.point[0], p[1] - core.point[1]]);
          // And its area centroid, steadier than the kernel along a long thin section whose inscribed circles all touch both faces.
          let area: number = 0;
          const sum: C.P = [0, 0];
          cutLoop.forEach((p: C.P, k: number): void => {
            const q: C.P = cutLoop[(k + 1) % cutLoop.length]!;
            const cross: number = p[0] * q[1] - q[0] * p[1];
            area += cross;
            sum[0] += (p[0] + q[0]) * cross;
            sum[1] += (p[1] + q[1]) * cross;
          });
          const centre: C.P = [sum[0] / (3 * area), sum[1] / (3 * area)];
          const centroid: number[] = [0, 1, 2].map((k: number): number => frame.origin[k]! + centre[0] * frame.u[k]! + centre[1] * frame.v[k]!);
          const around: C.P[] = cutLoop.map((p: C.P): C.P => [p[0] - centre[0], p[1] - centre[1]]);
          // The angle of its long axis from the chart's `u` toward `v`, radians: the principal axis of its vertices' second moments about the
          // centroid, read on (-pi/2, pi/2]; a part's roll (`IPart.roll`) is laid through these.
          let [xx, yy, xy]: number[] = [0, 0, 0];
          for (const p of around) {
            xx! += p[0] * p[0];
            yy! += p[1] * p[1];
            xy! += p[0] * p[1];
          }
          const principal: number = 0.5 * Math.atan2(2 * xy!, xx! - yy!);
          log("family-body-kernel", { part: part.name, s, kernel: world.map(round), clearanceMm: round(core.clearance), foldsFromKernel: X.star(shifted, SKIN_RAYS, "inner")?.folds ?? -1, centroid: centroid.map(round), centroidInChart: centre.map(round), principal: round(principal), foldsFromCentroid: X.star(around, SKIN_RAYS, "inner")?.folds ?? -1, foldsFromCourse: X.star(cutLoop, SKIN_RAYS, "inner")?.folds ?? -1 });
        }
        // `--dump-sections=<file>`: every station's section in its chart, as the fit would read it, to draw.
        if (process.argv.some((a: string): boolean => a.startsWith("--dump-sections="))) dumped.push({ s, loop: cutLoop });
        // A section whose rays fold (`IPart.folded` `hull`) is fitted as its hull, the tape, and its folds are left to the reliefs: on the trunk the
        // armpit, the shoulders' tops, under the chin, the lip's corners, the ear's root and the lids, 91 of 885 sections; skipped, the face had
        // no section from 750 to 830 mm.
        const loop: C.P[] | null = part.skin === undefined ? cutLoop : part.hullFrom !== undefined && s >= part.hullFrom && cutLoop !== null ? R.hull(cutLoop) : (starred?.points ?? (part.folded === "hull" && cutLoop !== null ? R.hull(cutLoop) : null));
        // `--seeds` with `--seed-stations=<s>,<s>...`: at those stations, the outer-skin reading and the hull along the front and back
        // median rays (phases 0 and pi), how many rays fold, and which of the two the fitted section is.
        const seedStations: number[] = (process.argv.find((a: string): boolean => a.startsWith("--seed-stations="))?.slice("--seed-stations=".length) ?? "").split(",").filter((x: string): boolean => x.length > 0).map(Number);
        if (process.argv.includes("--seeds") && cutLoop !== null && seedStations.some((x: number): boolean => Math.abs(x - s) < 0.26)) {
          const outer: { points: C.P[]; folds: number } | null = X.star(cutLoop, SKIN_RAYS, "outer");
          const hull: C.P[] = R.hull(cutLoop);
          const along = (points: readonly C.P[] | undefined, phi: number): string => (points === undefined ? "-" : C.radius(points, phi).toFixed(1));
          process.stderr.write(`station ${s}: outer reading ${outer === null ? "none" : `folds ${outer.folds}`}; front median (phase 0) outer ${along(outer?.points, 0)} hull ${along(hull, 0)}; back median (phase pi) outer ${along(outer?.points, Math.PI)} hull ${along(hull, Math.PI)}; fitted as ${starred !== null ? "the outer reading" : loop === null ? "nothing" : "its hull"}\n`);
        }
        if (loop === null) skipped.push(s);
        else if (part.skin !== undefined) {
          // Fitted to the skin itself: its concavities are the wall's own inward arcs, between inflection anchors (`inflected`). A guided
          // excursion's invented closure, every point behind both of the skin's ends, is not skin (`F.IRow.free`).
          const cutEnds: [C.P, C.P] | null = ends as [C.P, C.P] | null;
          const behind: number | null = cutEnds === null ? null : Math.min(cutEnds[0][0], cutEnds[1][0]);
          // A plate is a long thin lens, read square to its wall (`FamilyConicFit.IRow.normal`).
          // The phases a closure across the part's opening spans at this station (`without`): not skin, so no extreme is read there.
          const opening: [number, number][] = closures.filter((c): boolean => c.s === s && c.span !== undefined).map((c): [number, number] => c.span!);
          rows.push({ s, points: loop, heldout: i % 2 === 1, ...(behind === null ? {} : { free: (p: C.P): boolean => p[0] < behind - 0.01 }), ...(part.plate === undefined ? {} : { normal: true }), ...(opening.length === 0 ? {} : { opening }) });
          invented.push(part.air === undefined ? null : inventedOf(loop));
          skins.push(loop);
          loops.push(loop);
        } else {
          // The family is the tape wall: it reads the section's convex hull. How far the skin lies inside that hull is measured apart, as relief.
          // A loose part is measured against that hull as well: its loop need not be star-shaped about the course.
          // A loose part's section is closed by its clip's straight chords, and a hull edge carries no vertex between its ends, so a wall
          // fitted to the vertices alone bulged past a long chord unseen: the nose's, closed at the top of its box, stood 10 mm above it.
          // Along a loose part's hull every edge carries a point at least every millimetre.
          const wall: C.P[] = part.loose === true ? R.hull(loop).flatMap((p: C.P, k: number, hull: C.P[]): C.P[] => {
            const q: C.P = hull[(k + 1) % hull.length]!;
            const pieces: number = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1])));
            return Array.from({ length: pieces }, (_: unknown, t: number): C.P => [p[0] + ((q[0] - p[0]) * t) / pieces, p[1] + ((q[1] - p[1]) * t) / pieces]);
          }) : R.hull(loop);
          // `--target-wall=<directory>`: the section fitted is the stored wall's own outside the part's opening at this station (its
          // closures' phase spans, `without`) and the cut section only inside it, so a window refit reproduces the stored wall on visible
          // skin and changes only the opening (construction.md, Repair: a region's fix stays within the region).
          const spans: [number, number][] = closures.filter((c): boolean => c.s === s && c.span !== undefined).map((c): [number, number] => c.span!);
          const within = (phi: number): boolean => spans.some(([a, b]: [number, number]): boolean => {
            const span: number = (((b - a) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
            const off: number = (((phi - a) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
            return off > 1e-9 && off < span - 1e-9;
          });
          const targetSection: Q.ISection | null = targetWall === null ? null : C.chain(targetWall.read(s), targetWall.layout);
          const fitted: C.P[] = targetSection === null || targetSection.fault !== null ? wall : Array.from({ length: SKIN_RAYS }, (_: unknown, k: number): C.P => {
            const phi: number = (2 * Math.PI * k) / SKIN_RAYS;
            const r: number = within(phi) ? C.radius(wall, phi) : Q.radius(targetSection, phi);
            return [r * Math.cos(phi), r * Math.sin(phi)];
          });
          rows.push({ s, points: fitted, heldout: i % 2 === 1 });
          invented.push(null);
          // A loose part's wall is its section's hull, and so was its skin, which left the hollow search nothing to find. Where hollow
          // windows are asked for (`reliefs: "auto"`), the skin is the clipped loop itself, or for a part that surrounds its pieces the
          // largest piece, and a hollow's depth is read in the section's plane along the tape's inward normal, the distance to the hull:
          // a C-shaped section's hollows open along the C, not toward its course.
          const own: C.P[] = part.loose === true && part.reliefs === "auto" ? (piece ?? loop) : loop;
          skins.push(part.loose === true && (part.surround === undefined || s >= part.surround.from) && part.reliefs !== "auto" ? wall : own);
          loops.push(loop);
          let deepest: number = 0;
          let where: number = 0;
          for (const p of own) {
            const phi: number = Math.atan2(p[1], p[0]);
            const depth: number = part.loose === true && part.reliefs === "auto" ? inward(wall, p) : C.radius(wall, phi) - Math.hypot(p[0], p[1]);
            if (depth > deepest) {
              deepest = depth;
              where = phi;
            }
          }
          hollows.push(s.toFixed(0) + ":" + deepest.toFixed(1) + "@" + ((where * 180) / Math.PI).toFixed(0));
        }
      }
      // A plate's lens is read off each section's landmarks, and where a plane also cuts a limb of the rim (the helix's front limb near its
      // top) the outermost point jumps to it and the lens is three times as long as its neighbours'. Such a section is no reading of the
      // plate: a row whose lens's area stands more than a third off the median of the rows within 4 mm either side is withheld.
      if (part.plate !== undefined) {
        const area = (loop: readonly C.P[]): number => Math.abs(loop.reduce((sum: number, p: C.P, k: number): number => sum + p[0] * loop[(k + 1) % loop.length]![1] - loop[(k + 1) % loop.length]![0] * p[1], 0)) / 2;
        const areas: number[] = rows.map((row: F.IRow): number => area(row.points));
        const odd: Set<number> = new Set(
          rows
            .map((row: F.IRow, k: number): [number, number] => {
              const near: number[] = rows.map((other: F.IRow, j: number): number => (Math.abs(other.s - row.s) <= 4 ? areas[j]! : NaN)).filter(Number.isFinite).sort((a: number, b: number): number => a - b);
              return [k, Math.abs(areas[k]! / near[Math.floor(near.length / 2)]! - 1)];
            })
            .filter(([, off]: [number, number]): boolean => off > 1 / 3)
            .map(([k]: [number, number]): number => k),
        );
        if (odd.size > 0) log("family-body-plate-odd", { part: part.name, withheld: [...odd].map((k: number): number => rows[k]!.s) });
        // The skin and loop lists run beside the rows, one entry each.
        for (const list of [rows, skins, loops] as unknown[][]) {
          const kept: unknown[] = list.filter((_: unknown, k: number): boolean => !odd.has(k));
          list.length = 0;
          list.push(...kept);
        }
      }
      const dump: string | undefined = process.argv.find((a: string): boolean => a.startsWith("--dump-sections="))?.slice("--dump-sections=".length);
      if (dump !== undefined) await fs.writeFile(dump, JSON.stringify(dumped));
      if (part.skin !== undefined) log("family-body-star", { part: part.name, sections: star.length, refused: star.filter((r): boolean => r.folds !== 0).map((r): string => r.s.toFixed(1) + (r.folds < 0 ? ":outside" : ":" + r.folds)) });
      if (part.opening !== undefined) log("family-body-opening", { part: part.name, sections: new Set(closures.map((c): number => c.s)).size, from: closures[0]?.s ?? null, to: closures.at(-1)?.s ?? null, conic: closures.filter((c): boolean => c.kind === "conic").length, s: closures.filter((c): boolean => c.kind === "s").length, chord: closures.filter((c): boolean => c.kind === "chord").map((c): number => c.s), short: closures.filter((c): boolean => c.kind === "short").map((c): number => c.s), outside: closures.filter((c): boolean => c.kind === "outside").map((c): string => `${c.s} ${c.detail ?? ""}`), shoulders: closures.filter((c): boolean => c.rho !== undefined).map((c): string => `${c.s}${c.rho!.side > 0 ? "+" : "-"}:${c.rho!.most.toFixed(2)}/${c.rho!.used.toFixed(2)}`) });
      log("family-body-hollows", { part: part.name, deepestMmAtDegrees: hollows.filter((_: string, i: number): boolean => i % 6 === 0).join(" ") });
      log("family-body-observed", { part: part.name, sections: rows.length, skipped });

      // `--diagnose`: a fit that misses, decomposed instead of retried. For the part's first layout:
      // - layout capacity: every tenth fitting section fitted alone (two knots 1 mm apart on the same section), its misfit and fault;
      // - admissibility: how many sections' own seeds are no conic chain, and the first refusal;
      // - longitudinal capacity: the joint fit on the seed's knots (`--seed`), then on twice and four times as many (each interval halved);
      // - weighting: each fit's misfit by 50 mm band of stations, and training against withheld.
      if (process.argv.includes("--diagnose") || process.argv.includes("--diagnose-alone")) {
        const layout: C.ILayout = part.layouts[0]!.layout;
        const train: F.IRow[] = rows.filter((row: F.IRow): boolean => !row.heldout);
        const alone = train.filter((_: F.IRow, i: number): boolean => i % 10 === 0).map((row: F.IRow): string => {
          const result: F.IResult = F.fit([row, { ...row, s: row.s + 1 }], [row.s, row.s + 1], layout, 4);
          return row.s.toFixed(0) + ":" + (result.fault === null ? result.training.maximumMm.toFixed(2) + "/" + result.training.meanMm.toFixed(2) : "fault(" + String(result.fault).slice(0, 90) + ")");
        });
        log("family-body-diagnose-alone", { part: part.name, sections: alone.join(" ") });
        const refusals: string[] = train.map((row: F.IRow): string | null => C.chain(C.seed(row.points, layout), layout).fault).filter((x: string | null): x is string => x !== null);
        log("family-body-diagnose-seeds", { part: part.name, refused: refusals.length, of: train.length, first: refusals[0] ?? null });
        const seedDir: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--seed="))?.slice(7);
        const wall: K.IStored | null = seedDir === undefined ? null : (JSON.parse(await fs.readFile(path.join(seedDir, part.name + ".family.json"), "utf8")) as K.IStored);
        let knots: number[] = wall === null ? [domain[0], (domain[0] + domain[1]) / 2, domain[1]] : [domain[0], ...wall.knots.filter((k: number): boolean => k > domain[0] + 1 && k < domain[1] - 1), domain[1]];
        for (const times of process.argv.includes("--diagnose-alone") ? [] : [1, 2, 4]) {
          const result: F.IResult = F.fit(rows, knots, layout, 4);
          const bands: Map<number, number[]> = new Map();
          for (const r of result.rows) bands.set(Math.floor(r.s / 50) * 50, [...(bands.get(Math.floor(r.s / 50) * 50) ?? []), r.maximumMm]);
          log("family-body-diagnose-knots", { part: part.name, times, knots: knots.length, fault: result.fault, trainMaxMm: round(result.training.maximumMm), trainMeanMm: round(result.training.meanMm), heldMeanMm: round(result.heldout.meanMm), byBand: [...bands].map(([s, m]: [number, number[]]): string => s + ":" + (m.reduce((a: number, b: number): number => a + b, 0) / m.length).toFixed(1)).join(" "), ms: Math.round(result.milliseconds) });
          knots = knots.flatMap((k: number, i: number): number[] => (i === 0 ? [k] : [(knots[i - 1]! + k) / 2, k]));
        }
        continue;
      }
      // `--observe`: the sections alone, every fourth one's extents in its chart and how near its hull comes to the course, and no fit.
      if (process.argv.includes("--observe")) {
        log("family-body-sections", { part: part.name, rows: rows.filter((_: F.IRow, i: number): boolean => i % 4 === 0).map((row: F.IRow): string => row.s.toFixed(0) + " u " + Math.min(...row.points.map((p: C.P): number => p[0])).toFixed(0) + ".." + Math.max(...row.points.map((p: C.P): number => p[0])).toFixed(0) + " v " + Math.min(...row.points.map((p: C.P): number => p[1])).toFixed(0) + ".." + Math.max(...row.points.map((p: C.P): number => p[1])).toFixed(0) + " near " + Math.min(...Array.from({ length: 72 }, (_: unknown, j: number): number => C.radius(row.points, (Math.PI * j) / 36))).toFixed(0)) });
        continue;
      }

      // `--decompose=<directory>`: where the stored wall of an earlier run misses, by source (`FamilyConicFit.decompose`), in bands of
      // `DECOMPOSE_BAND_MM` along the course, and no fit: its own miss; each section fitted alone (the layout's capacity); those fits carried
      // on 1, 2 and 4 times its knots (the knots' capacity), with how many stations are then inadmissible; the constraints active at it; and
      // its miss at invented points against skin points, with the invented points' share of the weight.
      // `--dump=<file>`: the observed sections as JSON, each with its station, its frame (origin, `u`, `v`), its points in that chart and
      // which of them are invented, and no fit: the input a section is constructed from by rule.
      const dumpTo: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--dump="))?.slice(7);
      if (dumpTo !== undefined) {
        await fs.writeFile(dumpTo, JSON.stringify({ part: part.name, rows: rows.map((row: F.IRow, i: number) => { const frame: AutoMovieLoftFrame.IFrame = axis.at(row.s); return { s: row.s, origin: [...frame.origin], u: [...frame.u], v: [...frame.v], points: row.points, invented: invented[i] ?? null }; }) }));
        log("family-body-dump", { part: part.name, sections: rows.length, file: dumpTo });
        continue;
      }
      const decomposeFrom: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--decompose="))?.slice(12);
      if (decomposeFrom !== undefined) {
        const wall: K.IStored = JSON.parse(await fs.readFile(path.join(decomposeFrom, part.name + ".family.json"), "utf8")) as K.IStored;
        const margin: number = part.margin ?? F.ADMISSIBLE_MARGIN;
        const d: F.IDecomposition = F.decompose(rows, wall, wall.layout, margin, invented);
        const bands: Map<number, F.IDecomposition["rows"]> = new Map();
        for (const row of d.rows) {
          const key: number = Math.floor(row.s / DECOMPOSE_BAND_MM) * DECOMPOSE_BAND_MM;
          bands.set(key, [...(bands.get(key) ?? []), row]);
        }
        const most = (values: number[]): number => round(Math.max(...values));
        const mean = (values: number[]): number => round(values.reduce((a: number, b: number): number => a + b, 0) / Math.max(1, values.length));
        for (const [from, band] of bands) {
          const worst = band.reduce((a, b) => (b.joint.maximumMm > a.joint.maximumMm ? b : a));
          const weighted = band.filter((r) => r.weighting !== null);
          const binding = d.binding.filter((b) => b.s >= from && b.s < from + DECOMPOSE_BAND_MM);
          log("family-body-decompose", {
            part: part.name,
            stations: [from, from + DECOMPOSE_BAND_MM],
            joint: { maxMm: most(band.map((r) => r.joint.maximumMm)), meanMm: mean(band.map((r) => r.joint.meanMm)), worstAtDegrees: Math.round((worst.joint.phase * 180) / Math.PI) },
            alone: { maxMm: most(band.map((r) => r.alone?.maximumMm ?? Infinity)), meanMm: mean(band.map((r) => r.alone?.meanMm ?? Infinity)), refused: band.filter((r) => r.alone === null).length, atMargin: band.filter((r) => r.alone !== null && r.alone.least < margin + 0.005).length },
            knots: [1, 2, 4].map((times: number, v: number) => ({ times, maxMm: most(band.map((r) => r.longitudinal[v]!.maximumMm)), meanMm: mean(band.map((r) => r.longitudinal[v]!.meanMm)), inadmissible: band.filter((r) => !r.longitudinal[v]!.admissible).length })),
            binding: { meeting: [...new Set(binding.filter((b) => b.kind === "meeting").map((b) => b.index))].map((j: number) => "arc " + j + " " + round(Math.min(...binding.filter((b) => b.kind === "meeting" && b.index === j).map((b) => b.value)))), share: [...new Set(binding.filter((b) => b.kind === "share").map((b) => b.index))].map((f: number) => "field " + f) },
            weighting: weighted.length === 0 ? null : { inventedMm: mean(weighted.map((r) => r.weighting!.inventedMm)), skinMm: mean(weighted.map((r) => r.weighting!.skinMm)), inventedShare: mean(weighted.map((r) => r.weighting!.share)) },
          });
        }
        continue;
      }

      // Fit: grow the shared knot vector at the worst open fitting sections until the target holds or no section is open.
      let best: F.IResult | null = null;

      // The other wall of a splice and its station, kept so its reliefs past that station come with its knots.
      let spliced: { tail: K.IStored; at: number; head: IAutoMovieLoftRelief[]; window?: [number, number]; tips?: K.IStored["tips"] } | null = null;
      const trail: unknown[] = [];
      const attempt = (knots: number[], layout: C.ILayout, initial: number[][] | undefined, note: string, power: number = 4): F.IResult => {
        const fitted: F.IResult = F.fit(rows, knots, layout, power, initial, part.margin);
        // A candidate the construction's own path refuses is no candidate: the fit's admissibility reads the fields at each station, the
        // engine reads the derived numbers between stations by its own spline, and the slit cutter refitted on the corrected trunk, held
        // admissible every 0.25 mm, was refused there (arc 5's tangent lines meeting behind its end, b -0.227).
        const native: string[] = fitted.fault !== null ? [] : K.refusals({ name: part.name, centres: part.centres.map((c: R.V): number[] => c.map(round)), halves: part.halves, up: part.up, ...(part.roll === undefined ? {} : { roll: part.roll }), layout: fitted.layout, knots: fitted.knots.map(round), values: fitted.values.map((field: number[], f: number): number[] => field.map(C.units(fitted.layout)[f] === "mm" ? round : round4)) } as unknown as K.IStored);
        const result: F.IResult = native.length === 0 ? fitted : { ...fitted, fault: NATIVE_REFUSAL + native[0]!.slice(0, 200) };
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
          // `--splice=<directory>@<from>..<to>`: a window refitted on its own (`--from`, `--to`, `--seed --held` on this wall's knots): the
          // other wall's knots strictly inside the window replace this one's, and this wall's values at the window's end knots and every knot
          // outside it are carried unchanged, held there in value and first and second derivative (below). Its reliefs: every stored one is
          // carried in its stored order, and only one wholly inside the window is fitted again (construction.md, Repair: a region's fix stays
          // within the region).
          if (at!.includes("..")) {
            const [from, to]: number[] = at!.split("..").map(Number) as [number, number];
            const inside: number[] = tail.knots.map((_: number, k: number): number => k).filter((k: number): boolean => tail.knots[k]! > from + 1e-9 && tail.knots[k]! < to - 1e-9);
            const kept: number[] = wall.knots.map((_: number, k: number): number => k).filter((k: number): boolean => wall.knots[k]! <= from + 1e-9 || wall.knots[k]! >= to - 1e-9);
            const merged: { k: number; from: "wall" | "tail"; s: number }[] = [...kept.map((k: number) => ({ k, from: "wall" as const, s: wall.knots[k]! })), ...inside.map((k: number) => ({ k, from: "tail" as const, s: tail.knots[k]! }))].sort((a, b): number => a.s - b.s);
            const storedKnots: number[] = [...wall.knots];
            const storedValues: number[][] = wall.values.map((field: number[]): number[] => [...field]);
            wall.values = wall.values.map((field: number[], f: number): number[] => merged.map((m): number => (m.from === "wall" ? field[m.k]! : tail.values[f]![m.k]!)));
            wall.knots = merged.map((m): number => m.s);
            // Held at both ends: a natural cubic's piece on each interval is fixed by the values and second derivatives (moments) at its two
            // knots, so with the stored values kept at and outside the window's end knots and the stored moments set there, every interval
            // outside the window is the stored wall's exactly, and the window meets it with equal value, first and second derivative. The
            // window's interior values take the least change (in their sum of squares) that sets the two moments: two linear conditions
            // per field. Spliced on values alone, the natural cubic carried the window's change 0.49 mm into the trunk at 200 mm.
            const moments = (x: readonly number[], y: readonly number[]): number[] => {
              const n: number = x.length;
              const a: number[] = new Array<number>(n).fill(0), b: number[] = new Array<number>(n).fill(1), cc: number[] = new Array<number>(n).fill(0), r: number[] = new Array<number>(n).fill(0);
              for (let i: number = 1; i + 1 < n; ++i) {
                const h0: number = x[i]! - x[i - 1]!, h1: number = x[i + 1]! - x[i]!;
                a[i] = h0;
                b[i] = 2 * (h0 + h1);
                cc[i] = h1;
                r[i] = 6 * ((y[i + 1]! - y[i]!) / h1 - (y[i]! - y[i - 1]!) / h0);
              }
              for (let i: number = 1; i < n; ++i) {
                const w: number = a[i]! / b[i - 1]!;
                b[i]! -= w * cc[i - 1]!;
                r[i]! -= w * r[i - 1]!;
              }
              const m: number[] = new Array<number>(n).fill(0);
              m[n - 1] = r[n - 1]! / b[n - 1]!;
              for (let i: number = n - 2; i >= 0; --i) m[i] = (r[i]! - cc[i]! * m[i + 1]!) / b[i]!;
              return m;
            };
            const ends: [number, number] = [wall.knots.findIndex((k: number): boolean => Math.abs(k - from!) < 1e-9), wall.knots.findIndex((k: number): boolean => Math.abs(k - to!) < 1e-9)];
            const free: number[] = merged.map((m, k: number): number => (m.from === "tail" ? k : -1)).filter((k: number): boolean => k >= 0);
            let worst: number = 0;
            wall.values = wall.values.map((field: number[], f: number): number[] => {
              const target: number[] = moments(storedKnots, storedValues[f]!);
              const want: [number, number] = [target[storedKnots.findIndex((k: number): boolean => Math.abs(k - from!) < 1e-9)]!, target[storedKnots.findIndex((k: number): boolean => Math.abs(k - to!) < 1e-9)]!];
              const at = (y: number[]): [number, number] => {
                const m: number[] = moments(wall.knots, y);
                return [m[ends[0]]!, m[ends[1]]!];
              };
              const base: [number, number] = at(field);
              const columns: [number, number][] = free.map((k: number): [number, number] => {
                const y: number[] = [...field];
                y[k]! += 1;
                const g: [number, number] = at(y);
                return [g[0] - base[0], g[1] - base[1]];
              });
              const [p, q, rr] = [columns.reduce((s: number, g) => s + g[0] * g[0], 0), columns.reduce((s: number, g) => s + g[0] * g[1], 0), columns.reduce((s: number, g) => s + g[1] * g[1], 0)];
              const det: number = p * rr - q * q;
              const need: [number, number] = [want[0] - base[0], want[1] - base[1]];
              const lambda: [number, number] = [(rr * need[0] - q * need[1]) / det, (p * need[1] - q * need[0]) / det];
              const out: number[] = [...field];
              free.forEach((k: number, j: number): void => {
                out[k]! += columns[j]![0] * lambda[0] + columns[j]![1] * lambda[1];
              });
              const check: [number, number] = at(out);
              worst = Math.max(worst, Math.abs(check[0] - want[0]), Math.abs(check[1] - want[1]));
              return out;
            });
            log("family-body-window-held", { part: part.name, window: [from, to], momentMiss: worst });
            spliced = { tail, at: from!, head: wall.reliefs ?? [], window: [from!, to!], ...(wall.tips === undefined ? {} : { tips: wall.tips }) };
            log("family-body-window-splice", { part: part.name, window: [from, to], replaced: inside.map((k: number): number => tail.knots[k]!), knots: wall.knots.length });
          } else {

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
        }

        // `--graft=<directory>:<field>,<field>...`: at every knot the two walls share, the listed fields of another stored wall of the same part
        // and layout replace this one's. The trunk's face was refitted without the nose on its own knots (`--seed --held`), and only the
        // section's front half is taken from it (on `bilateral(1)`, fields 0, 1, 6 and 7: the front extreme, the front median and the two
        // arcs between them): the whole refit moved the wall under the ears' roots and the engine refused the lobule's cuts.
        const graft: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--graft="))?.slice(8);
        if (graft !== undefined) {
          const colon: number = graft.lastIndexOf(":");
          const donor: K.IStored = JSON.parse(await fs.readFile(path.join(graft.slice(0, colon), part.name + ".family.json"), "utf8")) as K.IStored;
          const fields: number[] = graft.slice(colon + 1).split(",").map(Number);
          wall.values = wall.values.map((field: number[], f: number): number[] =>
            !fields.includes(f) ? field : field.map((x: number, k: number): number => {
              const j: number = donor.knots.indexOf(wall.knots[k]!);
              return j < 0 ? x : donor.values[f]![j]!;
            }),
          );
        }
        // `--relay=<knot>,<knot>...:<field>,<field>...[;...]`: the listed fields at the listed knots are laid again from their sound neighbours,
        // the natural cubic through the field's other knots evaluated there, where a stored value is broken and its neighbours are not.
        const relay: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--relay="))?.slice(8);
        for (const group of relay === undefined ? [] : relay.split(";")) {
          const [knotText, fieldText]: string[] = group.split(":");
          const broken: number[] = knotText!.split(",").map(Number);
          for (const f of fieldText!.split(",").map(Number)) {
            const keep: number[] = wall.knots.map((_: number, k: number): number => k).filter((k: number): boolean => !broken.includes(wall.knots[k]!));
            const laid: number[] = F.resample([keep.map((k: number): number => wall.values[f]![k]!)], keep.map((k: number): number => wall.knots[k]!), wall.knots)[0]!;
            wall.values[f] = wall.values[f]!.map((x: number, k: number): number => (broken.includes(wall.knots[k]!) ? laid[k]! : x));
          }
        }
        best = { layout: wall.layout, knots: wall.knots, values: wall.values, rows: [], training: { maximumMm: NaN, meanMm: NaN }, heldout: { maximumMm: NaN, meanMm: NaN }, fault: null, milliseconds: 0 } as unknown as F.IResult;
      }
      // `--deepen=<directory>`: the stored wall of an earlier run is cut once more, every arc at its median, and fitted again on the same knots,
      // with no growth and no pruning: twice the conics round each section for the same stations.
      const deepen: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--deepen="))?.slice(9);
      let deeper: number = 0;
      if (deepen !== undefined) {
        const wall: K.IStored = JSON.parse(await fs.readFile(path.join(deepen, part.name + ".family.json"), "utf8")) as K.IStored;
        deeper = Math.round(Math.log2(wall.layout.anchors.length / 4)) + 1;
        best = { layout: wall.layout, knots: wall.knots, values: wall.values, rows: [], training: { maximumMm: NaN, meanMm: NaN }, heldout: { maximumMm: NaN, meanMm: NaN }, fault: null, milliseconds: 0 } as unknown as F.IResult;
      }
      // `--least=<shoulder>`: the wall is fitted with every arc's shoulder held at that or more (`ILayout.least`), and stored with its shoulder
      // values raised to it and the layout without it, so a wall spliced onto another fitted without the bound keeps one layout: the leg's
      // knee, fitted at 0.3 and spliced into the stored wall, loses the crease its arcs of 0.06 to 0.14 drew while the foot keeps its own.
      const least: number | undefined = ((value: string | undefined): number | undefined => (value === undefined ? undefined : Number(value)))(process.argv.find((argument: string): boolean => argument.startsWith("--least="))?.slice(8));
      // `--construct`: the part's sections read by rule and carried on its own knots, with no fit (`IPart.construct`). Each corner between
      // invented points and skin, the sharpest convex turn within `CONSTRUCT_SEARCH_MM` of where the two meet, is drawn round by its
      // `corner` radius, and the section's top, its skin point farthest along `u`, by its `apex` radius; the section is then read along its
      // rays again. A refused section or station is reported and nothing is stored.
      let constructed: boolean = false;
      if (process.argv.includes("--construct") && part.construct !== undefined) {
        const spec: NonNullable<IPart["construct"]> = part.construct;
        const closings: { s: number; closed: number }[] = [];
        const rounded: F.IRow[] = rows.map((row: F.IRow, i: number): F.IRow => {
          const flags: boolean[] | null = invented[i] ?? null;
          const n: number = row.points.length;
          const turn = (points: readonly C.P[], k: number): number => {
            const m: number = points.length;
            const [a, p, b] = [points[(k - 3 + m) % m]!, points[k]!, points[(k + 3) % m]!];
            const d: number = Math.atan2(b[1] - p[1], b[0] - p[0]) - Math.atan2(p[1] - a[1], p[0] - a[0]);
            return Math.atan2(Math.sin(d), Math.cos(d));
          };
          const corners: C.P[] = [];
          if (flags !== null)
            for (let k: number = 0; k < n; ++k) {
              if (flags[k] === flags[(k + 1) % n]) continue;
              let best: number = k;
              for (let j: number = 0; j < n; ++j) {
                const q: number = (k + j) % n;
                const back: number = (k - j + n) % n;
                const near = (x: number): boolean => Math.hypot(row.points[x]![0] - row.points[k]![0], row.points[x]![1] - row.points[k]![1]) <= CONSTRUCT_SEARCH_MM;
                if (!near(q) && !near(back)) break;
                for (const x of [q, back]) if (near(x) && turn(row.points, x) > turn(row.points, best)) best = x;
              }
              corners.push(row.points[best]!);
            }
          let points: C.P[] = [...row.points];
          const nearest = (q: C.P): number => points.reduce((b: number, p: C.P, k: number): number => (Math.hypot(p[0] - q[0], p[1] - q[1]) < Math.hypot(points[b]![0] - q[0], points[b]![1] - q[1]) ? k : b), 0);
          for (const corner of corners) points = C.fillet(points, nearest(corner), spec.corner, CONSTRUCT_SPAN_MM).points;
          const top: number = row.points.reduce((b: number, p: C.P, k: number): number => ((flags === null || !flags[k]) && p[0] > row.points[b]![0] ? k : b), flags === null ? 0 : Math.max(0, flags.indexOf(false)));
          const apex = C.fillet(points, nearest(row.points[top]!), spec.apex, CONSTRUCT_SPAN_MM);
          closings.push({ s: row.s, closed: apex.closed });
          return { ...row, points: X.star(apex.points, n, "inner")?.points ?? apex.points };
        });
        const layout: C.ILayout = part.layouts[0]!.layout;
        const built: F.IConstruction = F.construct(rounded, spec.knots, layout, part.margin ?? F.CONSTRUCT_MARGIN);
        const closedMost: { s: number; closed: number } = closings.reduce((a, b) => (b.closed > a.closed ? b : a), { s: NaN, closed: 0 });
        log("family-body-construct", { part: part.name, knots: spec.knots, sectionsRefused: built.sections.map(round), stationsRefused: built.stations.length, firstRefused: built.stations[0] ?? null, fault: built.result.fault, trainMaxMm: round(built.result.training.maximumMm), trainMeanMm: round(built.result.training.meanMm), heldMaxMm: round(built.result.heldout.maximumMm), heldMeanMm: round(built.result.heldout.meanMm), apexClosedMostMm: round(closedMost.closed), apexClosedMostAt: closedMost.s, reasons: built.reasons });
        if (built.result.fault !== null) {
          receipt.push({ part: part.name, trail, fault: built.result.fault });
          continue;
        }
        best = built.result;
        constructed = true;
      }
      // `--seed=<directory>`: the first layout's fit starts from a stored wall of the same part and layout, its knots inside the domain and
      // its values resampled there, and grows and prunes as usual. Started from three knots, the trunk's head refitted alone (`--from=600`)
      // stayed at 58 mm with every growth round refused; a wall refitted over changed sections starts near the wall it replaces.
      const seed: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--seed="))?.slice(7);
      const seeded: { knots: number[]; values: number[][] } | null = await (async (): Promise<{ knots: number[]; values: number[][] } | null> => {
        if (seed === undefined) return null;
        const wall: K.IStored = JSON.parse(await fs.readFile(path.join(seed, part.name + ".family.json"), "utf8")) as K.IStored;
        const knots: number[] = [domain[0], ...wall.knots.filter((k: number): boolean => k > domain[0] + gap(domain[0]) && k < domain[1] - gap(domain[1])), domain[1]];
        return { knots, values: wall.values.length === C.units(part.layouts[0]!.layout).length ? F.resample(wall.values, wall.knots, knots) : [] };
      })();
      // `--held`: with `--seed`, the seed's knots are kept as they are, neither grown nor pruned, so a wall refitted over changed sections keeps
      // the knots its neighbours were sewn on.
      const seedHeld: boolean = seeded !== null && process.argv.includes("--held");
      for (const { layout: plain, depth } of reuse !== undefined || constructed ? [] : deepen !== undefined ? [{ layout: C.limb(deeper), depth: deeper }] : part.layouts) {
        const layout: C.ILayout = least === undefined ? plain : { ...plain, least };
        // A deeper layout starts from the shallower one's final knots and values, cut exactly at every arc's median.
        // A layout with feature lines starts from knots every `FEATURE_KNOT_MM`, so its lines can follow where each feature appears and fades.
        const lined: boolean = FEATURE_KNOT_MM !== undefined && layout.anchors.some((anchor: C.IAnchor): boolean => anchor.kind === "f");
        const spaced: number = Math.max(2, Math.round((domain[1] - domain[0]) / (FEATURE_KNOT_MM ?? 1)) + 1);
        // `--feature-knots`: knots also where a feature appears or fades, the stations where a convex or concave feature's depth (its
        // distance from the chord of the feature anchors either side of it, read on each section's own seed) crosses `FEATURE_DEPTH_MM`, so a fading feature
        // ends on a knot as a shallow S and not between knots. Each section's seed reads its depth with a few tenths of a millimetre of
        // noise: read raw, the nose's groove crossed 0.3 mm at ten stations in five adjacent pairs (9 and 10, 18 and 19, ...). The depths are
        // read through a running median of `FEATURE_MEDIAN` sections and with a hysteresis (Canny's): a feature appears where its depth rises
        // past the threshold and fades only where it falls below half of it. The knots go in after the first fit, as knot insertion
        // (`F.resample` keeps the fitted fields), not as the first fit's knots: started from all of them, the nose's fit stalled at 6.0 mm.
        const fading: number[] = [];
        if (best === null && process.argv.includes("--feature-knots")) {
          // Every convex or concave feature between two feature anchors, read against the chord of those two.
          const runs: number[][] = layout.anchors
            .map((_: C.IAnchor, k: number): number => k)
            .filter((k: number): boolean => layout.anchors[k]!.kind === "f" && layout.anchors[k]!.feature !== "inflection" && layout.anchors[k - 1]?.kind === "f" && layout.anchors[k + 1]?.kind === "f")
            .map((k: number): number[] => [k - 1, k, k + 1]);
          const fitted: F.IRow[] = rows.filter((row: F.IRow): boolean => !row.heldout);
          const seeds: number[][][] = fitted.map((row: F.IRow): number[][] => C.resolve(C.seed(row.points, layout), layout).input.points as number[][]);
          for (const run of runs) {
            const depthAt = (_: F.IRow, i: number): number => {
              const [a, m, b] = [run[0]!, run[1]!, run[2]!].map((k: number): number[] => seeds[i]![k]!);
              const c: number[] = [b![0]! - a![0]!, b![1]! - a![1]!];
              return Math.abs(c[0]! * (m![1]! - a![1]!) - c[1]! * (m![0]! - a![0]!)) / (Math.hypot(c[0]!, c[1]!) || 1);
            };
            const raw: number[] = fitted.map(depthAt);
            const half: number = Math.floor(FEATURE_MEDIAN / 2);
            const depths: number[] = raw.map((_: number, i: number): number => {
              const window: number[] = raw.slice(Math.max(0, i - half), i + half + 1).sort((a: number, b: number): number => a - b);
              return window[Math.floor(window.length / 2)]!;
            });
            let present: boolean = depths[0]! > FEATURE_DEPTH_MM;
            for (let i: number = 1; i < fitted.length; ++i) {
              const now: boolean = present ? depths[i]! > FEATURE_DEPTH_MM / 2 : depths[i]! > FEATURE_DEPTH_MM;
              if (now !== present) fading.push(round((fitted[i - 1]!.s + fitted[i]!.s) / 2));
              present = now;
            }
          }
          fading.sort((a: number, b: number): number => a - b);
          log("family-body-fading", { part: part.name, stations: fading });
        }
        const base: number[] = lined ? Array.from({ length: spaced }, (_: unknown, k: number): number => domain[0] + ((domain[1] - domain[0]) * k) / (spaced - 1)) : [domain[0], (domain[0] + domain[1]) / 2, domain[1]];
        const knots0: number[] = best === null ? (seeded?.knots ?? base) : [...best.knots];
        let result: F.IResult = attempt(knots0, layout, best === null ? (seeded !== null && seeded.values.length > 0 ? seeded.values.map((field: number[], f: number): number[] => (least !== undefined && f >= C.units(layout).length - (layout.mirror ? layout.anchors.length - 1 : layout.anchors.length) ? field.map((x: number): number => Math.max(least, x)) : field)) : undefined) : F.refine(best.values, depth - 1), "depth " + depth);
        // The feature knots inserted into the first fit, one trial, kept as any growth round is.
        const inserted: number[] = fading.filter((s: number, i: number): boolean => s > domain[0] && s < domain[1] && result.knots.every((k: number): boolean => Math.abs(k - s) >= gap(s)) && fading.slice(0, i).every((t: number): boolean => Math.abs(t - s) >= gap(s)));
        if (result.fault === null && inserted.length > 0) {
          const next: number[] = [...result.knots, ...inserted].sort((a: number, b: number): number => a - b);
          const trial: F.IResult = attempt(next, layout, F.resample(result.values, result.knots, next), "feature knots");
          if (trial.fault === null && trial.training.meanMm < result.training.meanMm) result = trial;
        }

        // Growth always starts from the family of least mean so far. A round that lowers that mean by 3 % is kept; one that does not is dropped
        // and its stations are not offered again, so the next round tries the next worst rows. Three dropped rounds in a row end the growth.
        // Going on from a dropped round instead carried a failed solve into every later one and left the trunk and the leg above 2 mm.
        const refused: Set<number> = new Set();
        let idle: number = 0;
        // A candidate the construction's path refused still carries its fit, so growth goes on from it: the slit cutter's first candidate on
        // its corrected walls was refused there while finer ones had been admitted.
        while (deepen === undefined && !seedHeld && (result.fault === null || refusedNative(result)) && result.training.maximumMm > 0.9 * TARGET_MM && idle < 3) {
          const held: F.IResult = result;
          const open: F.IResult["rows"] = held.rows.filter((r: F.IResult["rows"][number]): boolean => !r.heldout && !refused.has(r.s) && r.maximumMm > 0.9 * TARGET_MM && held.knots.every((k: number): boolean => Math.abs(k - r.s) >= gap(r.s))).sort((a, b) => b.maximumMm - a.maximumMm);
          const added: number[] = [];
          for (const r of open) if (added.length < 4 && added.every((s: number): boolean => Math.abs(s - r.s) >= 2 * gap(r.s))) added.push(r.s);
          if (added.length === 0) break;
          const next: number[] = [...held.knots, ...added].sort((a: number, b: number): number => a - b);
          const trial: F.IResult = attempt(next, layout, F.resample(held.values, held.knots, next), "grow");
          if (trial.fault === null && (held.fault !== null || trial.training.meanMm < 0.97 * held.training.meanMm)) {
            result = trial;
            idle = 0;
          } else {
            for (const s of added) refused.add(s);
            ++idle;
          }
        }
        if (result.fault === null && (best === null || deepen !== undefined || result.training.maximumMm < 0.97 * best.training.maximumMm || result.training.meanMm < 0.9 * best.training.meanMm)) best = result;
        if (best !== null && best.training.maximumMm <= 0.9 * TARGET_MM) break;
      }

      // Prune: drop every knot whose removal keeps the maximum and the mean within 3 % and 5 % of the grown family.
      if (best !== null && reuse === undefined && deepen === undefined && !constructed && !seedHeld) {
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
      // A cutter is carried straight back from its first section by `lead`: three knots more with that section's values, so it comes out
      // of the skin it is cut from with the girth of its mouth. One knot alone let the fields' cubics swing between it and the first
      // section, and the engine lost an arc of the chain there.

      // `--raise=<shoulder>`: every shoulder of the wall raised to that least as it is stored, the reliefs then fitted over it, for a wall
      // whose fit under the bound stalls. The leg's ankle, refitted under 0.3 from 640 or 740 to 900 or 880 mm, stopped at 7 and 10 knots
      // and 1.4 and 0.26 mm, since the heel sweeps faster than knots 12 mm apart follow; its arcs of 0.11 to 0.24 drew a crescent round the
      // lateral malleolus.
      const raise: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--raise="))?.slice(8);
      if (raise !== undefined) best = { ...best, layout: { ...best.layout, least: Math.max(best.layout.least ?? 0, Number(raise)) } };
      if (best.layout.least !== undefined) {
        const bound: number = best.layout.least;
        const unbounded: C.ILayout = { anchors: best.layout.anchors, mirror: best.layout.mirror };
        const first: number = C.units(unbounded).length - (unbounded.mirror ? unbounded.anchors.length - 1 : unbounded.anchors.length);
        best = { ...best, layout: unbounded, values: best.values.map((field: number[], f: number): number[] => (f >= first ? field.map((x: number): number => Math.max(bound, x)) : field)) };
      }

      // Every shoulder is stored as the model reads it (`AutoMovieHumanConicSection.shoulder`), so the stored wall is the one generated. The
      // trunk's face refitted without the nose stored -0.20 at 792 mm and 1.17 at 834 mm; the model reads 0.03 and 0.85 at those knots, and
      // between them the field's cubic crossed the bound, where its arc held still while its neighbours moved. Stored bounded, with curvature
      // matched over the whole trunk, the wall under the armpit moved by up to 10 mm (1,250 to 1,300 mm high, 60 to 85 degrees), so the
      // reliefs are refitted on it and the armpit's slit cutter, fitted to the earlier wall, is refitted on it as well.
      {
        const arcs: number = best.layout.mirror ? best.layout.anchors.length - 1 : best.layout.anchors.length;
        const first: number = C.units(best.layout).length - arcs;
        const layout: C.ILayout = best.layout;
        best = { ...best, values: best.values.map((field: number[], f: number): number[] => (f >= first ? field.map((x: number): number => C.shoulder(x, layout)) : field)) };
      }
      // `--g2=<anchor>@<from>-<to>`: at every knot from `from` to `to` mm the two arcs meeting at that anchor take the shoulders that make
      // the section's curvature continuous there (`AutoMovieHumanConicSection.continuous`), before the reliefs are fitted over the wall.
      // The trunk's first median over the hips met with curvatures of 1.2 and 308 per metre, an upright line down each hip.
      // Several anchors may be named, `--g2=1,2,3@28-912`, each made continuous in turn at every knot of the range.
      const g2: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--g2="))?.slice(5);
      if (g2 !== undefined) {
        const [anchors, ranges]: string[] = g2.split("@");
        // Several ranges may be given, `28-740+800-912`.
        const spans: number[][] = ranges!.split("+").map((range: string): number[] => range.split("-").map(Number));
        const fields: number[][] = best.values.map((field: number[]): number[] => [...field]);
        best.knots.forEach((s: number, j: number): void => {
          if (!spans.some(([from, to]: number[]): boolean => s >= from! && s <= to!)) return;
          // Neighbouring anchors share an arc, so the matches are repeated until each holds with the others (Gauss-Seidel sweeps).
          for (let sweep: number = 0; sweep < 8; ++sweep)
            for (const anchor of anchors!.split(",").map(Number)) {
              const smooth: number[] = C.continuous(fields.map((field: number[]): number => field[j]!), best!.layout, anchor);
              smooth.forEach((x: number, f: number): void => void (fields[f]![j] = x));
            }
        });
        best = { ...best, values: fields };
      }
      // `--relay-stored=<knot>,...:<field>,...[;...]`: as `--relay`, on the wall as stored, after the curvature match: where the match itself
      // drew a field's knot out of its neighbours' flow (the trunk's front arcs at 792 mm, both held to a shoulder of 0.14 by matching the
      // curvature of a section whose front stood on the nose's clip), the knot is laid from the field's other knots.
      const relayStored: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--relay-stored="))?.slice(15);
      if (relayStored !== undefined) {
        const values: number[][] = best.values.map((field: number[]): number[] => [...field]);
        for (const group of relayStored.split(";")) {
          const [knotText, fieldText]: string[] = group.split(":");
          const broken: number[] = knotText!.split(",").map(Number);
          const keep: number[] = best.knots.map((_: number, k: number): number => k).filter((k: number): boolean => !broken.includes(best!.knots[k]!));
          for (const f of fieldText!.split(",").map(Number)) {
            const laid: number[] = F.resample([keep.map((k: number): number => values[f]![k]!)], keep.map((k: number): number => best!.knots[k]!), best.knots)[0]!;
            values[f] = values[f]!.map((x: number, k: number): number => (broken.includes(best!.knots[k]!) ? laid[k]! : x));
          }
        }
        best = { ...best, values };
      }
      const led: { knots: number[]; values: number[][] } = part.lead === undefined ? { knots: best.knots, values: best.values } :{ knots: [...[3, 2, 1].map((k: number): number => best!.knots[0]! - (part.lead! * k) / 3), ...best.knots], values: best.values.map((field: number[]): number[] => [field[0]!, field[0]!, field[0]!, ...field]) };
      const stored: string = JSON.stringify({ name: part.name, centres: part.centres.map((c: R.V): number[] => c.map(round)), halves: part.halves, up: part.up, ...(part.roll === undefined ? {} : { roll: part.roll }), layout: best.layout, knots: led.knots.map(round), values: led.values.map((field: number[], f: number): number[] => field.map(C.units(best!.layout)[f] === "mm" ? round : round4)) });
      await fs.writeFile(path.join(out, part.name + ".family.json"), stored);
      const definition: K.IStored = JSON.parse(stored) as K.IStored;

      // Reliefs: fitted on the stored wall, so they also absorb what the wall leaves inside their windows.
      {
        const read: (s: number) => number[] = K.reader(definition);
        const course: AutoMovieViewAxis.IAxis = K.axis(definition);
        // A window the hollow search places ends at the part's tip at the latest: a relief must vanish at the pole.
        // It hands its edges over as an authored window may (`fade`): the search widens it by 30 mm and 0.45 rad past its hollow, and asked
        // for the whole height from its first free row it drew its outline on the ankle as level wrinkles.
        // `--coarse=<share>`: every authored window's rows and columns scaled by that share, at least 7, to read how fine a net must be.
        const coarse: number = Number(process.argv.find((argument: string): boolean => argument.startsWith("--coarse="))?.slice(9) ?? 1);
        const below: number = Number(process.argv.find((argument: string): boolean => argument.startsWith("--coarse-below="))?.slice(15) ?? Infinity);
        const scaled = (window: IWindow): IWindow => (coarse === 1 || window.stations[1] > below ? window : { ...window, rows: Math.max(7, Math.round(window.rows * coarse)), columns: Math.max(7, Math.round(window.columns * coarse)) });
        // `--bare`: the wall alone, no relief of any kind, for a wall that is spliced and given its reliefs in a later run (`--wall`).
        const windows: IWindow[] = BARE ? [] : part.reliefs === "auto" ?hollowWindows(part.name, rows, skins, course, part.loose === true).map((window: H.IWindow): IWindow => ({ ...window, stations: [part.name === "auricle" ? Math.max(window.stations[0], domain[0]) : window.stations[0], Math.min(window.stations[1], part.reliefEnd ?? tip ?? Infinity)], fade: [50, 50], fadePhase: [0.6, 0.6] })) : part.reliefs.map(scaled);

        // Phases from 0 to a whole turn have their middle at pi, where the inward radial direction is +u, and a quarter turn on it is +v. A
        // net over a window of phases with middle `c` casts toward the course as well: `cos(t - c) A + sin(t - c) T` is the inward radial
        // direction `-(cos t u + sin t v)` at every phase `t` for `A = -(cos c u + sin c v)` and `T = sin c u - cos c v` (at `c = pi`, `u`
        // and `v`).
        const rounds: IWindow[] = (BARE ? [] : part.rounds ?? []).map((net): IWindow => {
          const frame: AutoMovieLoftFrame.IFrame = course.at((net.stations[0] + net.stations[1]) / 2);
          const phases: [number, number] = net.window?.phases ?? [0, 2 * Math.PI];
          const c: number = (phases[0] + phases[1]) / 2;
          const axis: R.V = net.window === undefined ? [frame.u[0], frame.u[1], frame.u[2]] : ([0, 1, 2].map((k: number): number => -(Math.cos(c) * frame.u[k]! + Math.sin(c) * frame.v[k]!)) as R.V);
          const turn: R.V = net.window === undefined ? [frame.v[0], frame.v[1], frame.v[2]] : ([0, 1, 2].map((k: number): number => Math.sin(c) * frame.u[k]! - Math.cos(c) * frame.v[k]!) as R.V);
          return { name: part.name + "." + net.name, stations: net.stations, phases, axis, turn, rows: net.rows, columns: net.columns, mirror: false, ...(net.window === undefined ? { periodic: true, ...(net.fade === undefined ? {} : { fade: net.fade }) } : { fade: net.window.fade, fadePhase: net.window.fadePhase }), chord: true, reach: net.reach, ...(net.hold === undefined ? {} : { hold: net.hold }) };
        });
        // A window splice carries every stored relief in its stored order and fits again only those wholly inside its window: a relief that
        // straddles the window's edge, fitted again from scratch, moved the trunk's head and breasts up to 13 mm away from the window.
        const touching = (stations: readonly [number, number] | readonly number[]): boolean => spliced?.window === undefined || (stations[0]! >= spliced.window[0] && stations[1]! <= spliced.window[1]);
        definition.reliefs = spliced?.window === undefined ? [] : spliced.head.filter((relief: IAutoMovieLoftRelief): boolean => !touching(relief.stations));
        const fitAll = (list: readonly IWindow[], judged: boolean): void => {
         for (const window of list) {
          // Each window is fitted over the wall with every earlier relief already on it, as the engine composes them, so a later window takes only what the earlier ones left.
          const earlier: IAutoMovieLoftRelief[] = [...(definition.reliefs ?? [])];
          const fitted: H.IResult = H.fit(window, rows.map((row: F.IRow, i: number): H.IRow => {
            const section: Q.ISection = C.chain(read(row.s), definition.layout);
            const frame: AutoMovieLoftFrame.IFrame = course.at(row.s);
            const inChart = (axis: readonly number[]): C.P => [axis[0]! * frame.u[0] + axis[1]! * frame.u[1] + axis[2]! * frame.u[2], axis[0]! * frame.v[0] + axis[1]! * frame.v[1] + axis[2]! * frame.v[2]];
            // A cast that lands on the chord closing a neighbour's cut (the ear's, the nose's, the arm's) has found no skin: inside the cut the clip is positive.
            const left: ((p: R.V) => number) | undefined = window.uncut === true ? part.kept : window.chord === true ? undefined : part.clip;
            const open = left === undefined ? undefined : (p: C.P): boolean => left([frame.origin[0] + p[0] * frame.u[0] + p[1] * frame.v[0], frame.origin[1] + p[0] * frame.u[1] + p[1] * frame.v[1], frame.origin[2] + p[0] * frame.u[2] + p[1] * frame.v[2]]) > 0.05;
            const hold = window.hold === undefined ? undefined : (p: C.P): boolean => window.hold!([frame.origin[0] + p[0] * frame.u[0] + p[1] * frame.v[0], frame.origin[1] + p[0] * frame.u[1] + p[1] * frame.v[1], frame.origin[2] + p[0] * frame.u[2] + p[1] * frame.v[2]]) > 0;
            const own: C.P[] = window.chord === true ? loops[i]! : skins[i]!;
            const uncut: C.P[] | null = window.uncut === true && row.s > window.stations[0] && row.s < window.stations[1] ? R.cut(skin, frame).loop : null;
            const whole: C.P[] | null = uncut === null || part.kept === undefined ? uncut : without(uncut, frame, part.kept);
            return { s: row.s, ...(hold === undefined ? {} : { hold }), skin: whole ?? own, heldout: row.heldout, ...(open === undefined ? {} : { open }), wall: (phi: number): C.P => {
              const r: number = Q.radius(section, phi);
              const p: C.P = [r * Math.cos(phi), r * Math.sin(phi)];
              for (const relief of earlier) {
                const height: number = AutoMovieLoftRelief.height(relief, row.s, phi)[0];
                const along: C.P = inChart(AutoMovieLoftRelief.direction(relief, phi)[0]);
                p[0] += height * along[0];
                p[1] += height * along[1];
              }
              return p;
            }, axis: inChart(window.axis), ...(window.turn === undefined ? {} : { turn: inChart(window.turn) }) };
          }));
          // A window placed by the hollow search is kept only when its net takes away at least half of its deepest hollow on the withheld
          // sections. Round a turn a section's hollow lies across the cast's axis, and a net that cannot reach it leaves scratches instead.
          // Nor is one kept whose deepest hollow is shallower than half the fit's target: the leg's window over the foot's end (924 to
          // 960 mm) stored 473 heights for a hollow 0.11 mm deep, which is the wall's own misfit (the conic audit's leg rows).
          const kept: boolean = !judged || (fitted.heldMaxMm <= 0.5 * fitted.deepestMm && fitted.deepestMm >= 0.5 * TARGET_MM);
          definition.reliefs ??= [];
          if (kept) definition.reliefs.push(fitted.relief);

          // The twin: the same heights with their columns in the other order, over the reflected phases, cast along the reflected directions.
          if (kept && window.twin === true) {
            const { relief }: H.IResult = fitted;
            const flip = (v: readonly number[]): [number, number, number] => [v[0]!, v[1]!, -v[2]!];
            definition.reliefs.push({ ...relief, name: relief.name + ".twin", phases: [-relief.phases[1], -relief.phases[0]], axis: flip(relief.axis), ...(relief.turn === undefined ? {} : { turn: flip(relief.turn).map((x: number): number => -x || 0) as [number, number, number] }), heights: relief.heights.map((_: number, i: number): number => relief.heights[i - (i % relief.columns) + (relief.columns - 1 - (i % relief.columns))]!) });
          }
          log("family-body-relief", { part: part.name, relief: window.name, kept, scalars: fitted.scalars, deepestMm: round(fitted.deepestMm), trainMaxMm: round(fitted.trainMaxMm), heldMaxMm: round(fitted.heldMaxMm) });
         }
        };
        // `--keep-windows`: every window the hollow search places is kept whatever the keep rule says, to read what it does.
        fitAll(windows.filter((window: IWindow): boolean => touching(window.stations)), part.reliefs === "auto" && !process.argv.includes("--keep-windows"));

        // A spliced wall takes the reliefs as it takes the knots: each wall's own stored ones on its side of the station, since those were
        // fitted on the very values the splice keeps there. Fitted again over the whole spliced wall, the hollow search placed other windows
        // and the keep rule dropped the one over the hollow in front of the shoulder, which left the skin 8 mm inside the wall there.
        // `--refit` keeps the reliefs fitted just above over the whole spliced wall instead: for a splice inside a window both walls share.
        if (spliced !== null && spliced.window === undefined && !process.argv.includes("--refit")) {
          const { tail, at, head }: { tail: K.IStored; at: number; head: IAutoMovieLoftRelief[] } = spliced;
          // A stored net that goes once round the part is left behind: those are fitted again below, over the spliced wall.
          const window = (relief: IAutoMovieLoftRelief): boolean => relief.phases[1] - relief.phases[0] < 2 * Math.PI - 1e-9;
          definition.reliefs = [...head.filter((relief: IAutoMovieLoftRelief): boolean => window(relief) && relief.stations[1] <= at), ...(tail.reliefs ?? []).filter((relief: IAutoMovieLoftRelief): boolean => window(relief) && relief.stations[0] >= at)].map((relief: IAutoMovieLoftRelief, i: number): IAutoMovieLoftRelief => ({ ...relief, name: part.name + ".hollow." + i }));
          log("family-body-spliced", { part: part.name, at, reliefs: definition.reliefs.map((relief: IAutoMovieLoftRelief): string => relief.name + " " + relief.stations.join("..")) });
        }

        // The nets round the part come last, over whichever reliefs the wall has kept.
        fitAll(rounds.filter((window: IWindow): boolean => touching(window.stations)), false);
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
      // A window splice keeps the stored wall's ends: recomputed from the cut, the trunk's crown cap moved up to 4 mm at 908 to 912 mm.
      if (spliced?.window !== undefined && spliced.tips !== undefined) definition.tips = spliced.tips;
      else if (tip !== null) definition.tips = [part.first !== undefined ? { from: domain[0], tip: part.first } : part.foot !== undefined ? { from: domain[0], tip: domain[0] - part.foot } : null, { from: part.cap ?? domain[1], tip, ...(part.covered === true ? { covered: true } : {}), ...(part.centre === undefined ? {} : { centre: part.centre }), ...(part.own === true ? { own: true } : {}) }];

      // Cast reliefs: skin that faces along the course, which no section sees. From points of the finished surface, by station and phase,
      // a ray runs along the relief's axis, and its distance to the reference triangle it meets is the height there. The ear's outer face
      // lies under its closed end and is cast back along the course on one net that closes on itself round the tip.
      // A window splice (`--splice=<directory>@<from>..<to>`) carries the stored casts whose stations miss the window, as its other reliefs.
      for (const face of tip === null || BARE ? [] : (part.casts ?? []).filter((cast: ICast): boolean => !(CHINLESS && cast.name === "chin") && (spliced?.window === undefined || (Number(cast.stations[0]) >= spliced.window[0] && Number(cast.stations[1]) <= spliced.window[1])))) {
        const capped: L.IResult = K.create(definition, stations);
        if (capped.chain === null) throw new Error(part.name + ": the capped part does not loft");
        const first: R.V = part.centres[0]!;
        const last: R.V = part.centres.at(-1)!;
        const span: number = Math.hypot(last[0] - first[0], last[1] - first[1], last[2] - first[2]);
        const axis: R.V = face.axis === "course" ? [(first[0] - last[0]) / span, (first[1] - last[1]) / span, (first[2] - last[2]) / span] : face.axis;
        const window: H.IWindow = { name: part.name + "." + face.name, stations: face.stations === "cap" ? [(part.cap ?? domain[1]) + 0.5, tip!] : face.stations, phases: face.phases ?? [0, 2 * Math.PI], axis, rows: face.rows, columns: face.columns, mirror: face.mirror === true, ...(face.phases === undefined ? { periodic: true } : {}), ...(face.turn === undefined ? {} : { turn: face.turn }), ...(face.fade === undefined ? {} : { fade: face.fade }), ...(face.fadePhase === undefined ? {} : { fadePhase: face.fadePhase }) };
        const middle: number = (window.phases[0] + window.phases[1]) / 2;
        const toward = (phi: number): R.V => (face.turn === undefined ? axis : [0, 1, 2].map((c: number): number => Math.cos(phi - middle) * axis[c]! + Math.sin(phi - middle) * face.turn![c]!) as R.V);
        const outside: ((p: R.V) => number) | undefined = face.skin ?? part.clip;
        const along: number = 4 * (window.rows - 3);
        const about: number = 4 * (window.columns - 3);
        const bases: { s: number; phi: number; p: R.V; heldout: boolean }[] = [];
        for (let i: number = 1; i < along; ++i)
          for (let j: number = face.phases === undefined ? 0 : 1; j < about; ++j) {
            const s: number = window.stations[0] + ((window.stations[1] - window.stations[0]) * i) / along;
            const phi: number = window.phases[0] + ((window.phases[1] - window.phases[0]) * j) / about;
            if (face.observe !== undefined && s < face.observe) continue;
            bases.push({ s, phi, p: AutoMovieLoftChain.point(capped.chain, s, phi) as R.V, heldout: i % 2 === 1 });
          }

        // The reference triangles a ray can meet: the part's own skin within the reach of the points' box.
        const box: [R.V, R.V] = [[0, 1, 2].map((c: number): number => Math.min(...bases.map((b): number => b.p[c]!)) - face.reach) as R.V, [0, 1, 2].map((c: number): number => Math.max(...bases.map((b): number => b.p[c]!)) + face.reach) as R.V];
        const triangles: [R.V, R.V, R.V][] = [];
        const solid: Uint8Array = solids(skin);
        for (let t: number = 0; t + 2 < skin.indices.length; t += 3) {
          if (solid[t / 3] === 0) continue;
          const corners: R.V[] = [0, 1, 2].map((k: number): R.V => [skin.positions[skin.indices[t + k]! * 3]!, skin.positions[skin.indices[t + k]! * 3 + 1]!, skin.positions[skin.indices[t + k]! * 3 + 2]!]);
          if (corners.some((p: R.V): boolean => p.every((x: number, c: number): boolean => x >= box[0][c]! && x <= box[1][c]!)) && (outside === undefined || corners.some((p: R.V): boolean => outside(p) <= 3))) triangles.push(corners as [R.V, R.V, R.V]);
        }
        const cross = (a: R.V, b: R.V): R.V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
        const dot = (a: R.V, b: R.V): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
        const sub = (a: R.V, b: R.V): R.V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

        // The signed distance along the axis from a point to the triangles (Moeller and Trumbore), within the reach either way: the least,
        // which is the outermost skin seen against the axis, or the nearest. A triangle that does not face the axis is passed over.
        // Each triangle's centre and the radius of the ball about it that holds the triangle: a ray that passes the ball misses the triangle.
        const balls: { centre: R.V; radius: number }[] = triangles.map(([a, b, c]: [R.V, R.V, R.V]): { centre: R.V; radius: number } => {
          const centre: R.V = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
          return { centre, radius: Math.max(...[a, b, c].map((p: R.V): number => Math.hypot(p[0] - centre[0], p[1] - centre[1], p[2] - centre[2]))) };
        });
        const cast = (p: R.V, axis: R.V): number | null => {
          let best: number | null = null;
          for (let k: number = 0; k < triangles.length; ++k) {
            const ball: { centre: R.V; radius: number } = balls[k]!;
            const w: R.V = sub(ball.centre, p);
            const ahead: number = dot(w, axis);
            if (Math.abs(ahead) > face.reach + ball.radius || dot(w, w) - ahead * ahead > ball.radius * ball.radius) continue;
            const [a, b, c]: [R.V, R.V, R.V] = triangles[k]!;
            const e1: R.V = sub(b, a);
            const e2: R.V = sub(c, a);
            if (face.facing !== undefined) {
              const n: R.V = cross(e1, e2);
              if (Math.abs(dot(n, axis)) < face.facing * Math.hypot(n[0], n[1], n[2])) continue;
            }
            const h: R.V = cross(axis, e2);
            const det: number = dot(e1, h);
            if (Math.abs(det) < 1e-12) continue;
            const s: R.V = sub(p, a);
            const u: number = dot(s, h) / det;
            if (u < 0 || u > 1) continue;
            const q: R.V = cross(s, e1);
            const v: number = dot(axis, q) / det;
            if (v < 0 || u + v > 1) continue;
            const t: number = dot(e2, q) / det;
            if (Math.abs(t) > face.reach) continue;
            if (best === null || (face.nearest === true ? Math.abs(t) < Math.abs(best) : t < best)) best = t;
          }
          return best;
        };
        const observed: H.IObserved[] = [];
        for (const base of bases) {
          const target: number | null = face.held?.(base.s, base.phi) === true ? 0 : cast(base.p, toward(base.phi));
          if (target !== null) observed.push({ s: base.s, phi: base.phi, target, heldout: base.heldout });
        }
        // `--casts`: the cast heights as a table, one row per station step and eleven phases across, each with its point's forward and
        // upward position, and a dot where no ray landed.
        if (process.argv.includes("--casts")) {
          const cell = (i: number, j: number): string => {
            const s: number = window.stations[0] + ((window.stations[1] - window.stations[0]) * i) / along;
            const phi: number = window.phases[0] + ((window.phases[1] - window.phases[0]) * j) / about;
            if (face.observe !== undefined && s < face.observe) return "".padStart(15);
            const hit: H.IObserved | undefined = observed.find((o: H.IObserved): boolean => Math.abs(o.s - s) < 1e-9 && Math.abs(o.phi - phi) < 1e-9);
            const p: R.V = AutoMovieLoftChain.point(capped.chain!, s, phi) as R.V;
            return (hit === undefined ? "." : hit.target.toFixed(1)).padStart(6) + ("@" + p[0].toFixed(0) + "," + p[1].toFixed(0)).padStart(9);
          };
          for (let i: number = 2; i < along; i += 4) process.stdout.write((window.stations[0] + ((window.stations[1] - window.stations[0]) * i) / along).toFixed(1).padStart(7) + Array.from({ length: 11 }, (_: unknown, k: number): string => cell(i, Math.round((about * (k + 0.5)) / 11))).join("") + "\n");
        }
        const faced: H.IResult = H.fit(window, [], observed);
        definition.reliefs = [...(definition.reliefs ?? []), faced.relief];
        // A cast's twin, as a window's (`IWindow.twin`): the same heights with their columns reversed, over the reflected phases and directions.
        if (face.twin === true) {
          const relief: IAutoMovieLoftRelief = faced.relief;
          const flip = (v: readonly number[]): [number, number, number] => [v[0]!, v[1]!, -v[2]!];
          definition.reliefs.push({ ...relief, name: relief.name + ".twin", phases: [-relief.phases[1], -relief.phases[0]], axis: flip(relief.axis), ...(relief.turn === undefined ? {} : { turn: flip(relief.turn).map((x: number): number => -x || 0) as [number, number, number] }), heights: relief.heights.map((_: number, i: number): number => relief.heights[i - (i % relief.columns) + (relief.columns - 1 - (i % relief.columns))]!) });
        }
        log("family-body-face", { part: part.name, relief: window.name, triangles: triangles.length, observed: observed.length, scalars: faced.scalars, deepestMm: round(faced.deepestMm), trainMaxMm: round(faced.trainMaxMm), heldMaxMm: round(faced.heldMaxMm) });
        await fs.writeFile(path.join(out, part.name + ".family.json"), JSON.stringify(definition));
      }
      // A limb layout has 4 times 2^depth anchors round the section, a bilateral one 2 times 2^depth arcs over its half.
      const anchors: number = definition.layout.anchors.length;
      const moduleText: string = emit({ ...part, domain }, definition, Math.round(Math.log2(definition.layout.mirror ? (anchors - 1) / 2 : anchors / 4)), engine, rows.length);
      await fs.writeFile(path.join(out, moduleName(part.name) + ".ts"), moduleText);

      // The construction's own path must admit the family too; a refused one is written beside the receipt but not into the package.
      const refused: string[] = K.refusals(definition);
      log("family-body-native", { part: part.name, admitted: refused.length === 0, refusals: refused.map((text: string): string => text.slice(0, 300)) });
      if (process.argv.includes("--emit") && refused.length === 0) await fs.writeFile(path.join(root, "packages/human/src/generation/f1", moduleName(part.name) + ".ts"), moduleText);
    }

    // Same cameras for the reference and the regenerated parts, framed on the reference.
    const reference: N.Mesh = { id: "reference.body", positions: Array.from(source.body.positions, (x: number): number => x / 1000), indices: Array.from(source.body.indices), colour: [0.64, 0.65, 0.67] };
    // `--frame=<from>,<to>`: the cameras framed on the reference's skin between those heights, mm (a close-up such as the face's), instead
    // of on the whole body; the frames are named for the band.
    const band: number[] | undefined = process.argv.find((a: string): boolean => a.startsWith("--frame="))?.slice("--frame=".length).split(",").map(Number);
    const bounds: N.Point[] = [];
    for (let i: number = 0; i < reference.positions.length; i += 3)
      if (band === undefined || (reference.positions[i + 1]! * 1000 >= band[0]! && reference.positions[i + 1]! * 1000 <= band[1]!)) bounds.push([reference.positions[i]!, reference.positions[i + 1]!, reference.positions[i + 2]!]);
    NodeCanvasRaster.initialize();
    const frames: { file: string; sha256: string }[] = [];
    for (const view of ["front", "back", "left", "right", "high-oblique", "low-oblique"]) {
      const camera: N.Camera = NodeCanvasCamera.fit(view, bounds, 900, 1500);
      for (const [stage, shown, lines] of [["reference", [reference], []], ["family-clay", meshes, []], ["family-knots", meshes, curves]] as [string, N.Mesh[], N.Curve[]][]) {
        const file: string = "body." + (band === undefined ? "" : "band" + band.join("-") + ".") + view + "." + stage + ".png";
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
  /** How far a point of a section lies inside its convex hull, mm: its distance to the nearest hull edge, or 0 outside. */
  function inward(hull: readonly C.P[], p: C.P): number {
    let least: number = Infinity;
    let inside: boolean = true;
    for (let i: number = 0; i < hull.length; ++i) {
      const a: C.P = hull[i]!;
      const b: C.P = hull[(i + 1) % hull.length]!;
      const e: C.P = [b[0] - a[0], b[1] - a[1]];
      const length2: number = e[0] * e[0] + e[1] * e[1];
      if (length2 === 0) continue;
      if (e[0] * (p[1] - a[1]) - e[1] * (p[0] - a[0]) < 0) inside = false;
      const t: number = Math.max(0, Math.min(1, ((p[0] - a[0]) * e[0] + (p[1] - a[1]) * e[1]) / length2));
      least = Math.min(least, Math.hypot(p[0] - a[0] - t * e[0], p[1] - a[1] - t * e[1]));
    }
    return inside ? least : 0;
  }

  function hollowWindows(name: string, rows: readonly F.IRow[], skins: readonly C.P[][], course: AutoMovieViewAxis.IAxis, normal: boolean = false): H.IWindow[] {
    const deep: { s: number; phases: number[] }[] = rows.map((row: F.IRow, i: number): { s: number; phases: number[] } => {
      // Depth below the tape hull, not below the fitted wall: the wall's own misfit is not a hollow. Toward the course, or for a loose
      // part (`normal`) in the section's plane along the hull's inward normal.
      return { s: row.s, phases: skins[i]!.map((p: C.P): number => Math.atan2(p[1], p[0])).filter((phi: number, k: number): boolean => (normal ? inward(row.points, skins[i]![k]!) : C.radius(row.points, phi) - Math.hypot(skins[i]![k]![0], skins[i]![k]![1])) > 0.6 * TARGET_MM) };
    });
    // Deep vertices are first split round the section: phases farther apart than a radian belong to different hollows (a spine groove and a cleavage share stations but not a window).
    const every: number[] = deep.flatMap((row: { s: number; phases: number[] }): number[] => row.phases).sort((a: number, b: number): number => a - b);
    const windows: H.IWindow[] = [];
    log0?.("family-body-hollow-search", { part: name, deep: every.length, rows: rows.length });
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
          // Widened by 0.45 rad on either side, but never to a whole turn: a window whose edges overlapped round the part drew a slit
          // along the overlap (the leg's over the instep, after its foot was refitted on the turned course), so 0.4 rad stays between them.
          const pad: number = Math.max(0, Math.min(0.45, (2 * Math.PI - 0.4 - (cluster[1] - cluster[0])) / 2));
          const from: number = cluster[0] - pad;
          const to: number = cluster[1] + pad;
          const stations: [number, number] = [run[0]! - 30, run.at(-1)! + 30];
          const frame: AutoMovieLoftFrame.IFrame = course.at((stations[0] + stations[1]) / 2);
          const axis: [number, number, number] = [0, 1, 2].map((c: number): number => -(Math.cos(centre) * frame.u[c]! + Math.sin(centre) * frame.v[c]!)) as [number, number, number];

          // The cast turns with the phase about the window's middle, so a wide hollow is met square all the way across it.
          const turn: [number, number, number] = [0, 1, 2].map((c: number): number => -(-Math.sin(centre) * frame.u[c]! + Math.cos(centre) * frame.v[c]!)) as [number, number, number];
          windows.push({ name: name + ".hollow." + windows.length, stations, phases: [from, to], axis, turn, rows: Math.max(7, Math.ceil((stations[1] - stations[0]) / 10) + 3), columns: Math.max(7, Math.ceil((to - from) / 0.15) + 3), mirror: false });
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
    for (const [digit, last] of [...["index", "middle", "ring", "pinky", "thumb"].map((finger: string): [string, number] => [finger, 3]), ...["bigtoe", "indextoe", "middletoe", "ringtoe", "littletoe"].map((toe: string): [string, number] => [toe, 2])] as [string, number][])
      lines.push(
        "  /** The far point of the " + (digit.endsWith("toe") ? digit.replace("toe", " toe") : digit === "thumb" ? digit : digit + " finger") + "'s pad: the skin's farthest point along its last segment, within " + PAD.reach + " mm of that segment's line. Its course aims at it. */",
        "  export const " + digit + "Pad: V3 = " + JSON.stringify(pad(source.body, source.joints.get(digit + "_0" + (last - 1) + "_r")!, source.joints.get(digit + "_0" + last + "_r")!)).replaceAll(",", ", ") + ";",
        "",
      );
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
      "  /**",
      "   * The armpit's crease, where the arm's inner side meets the trunk's side. The armscye is the sagittal plane at its side distance: the trunk",
      "   * owns the skin medial of that plane, the arm the rest.",
      "   */",
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
      "   * The helix's course, along the rim's crest from the front limb over the top and down the back to the lobule. Each inner centre is the",
      "   * crest read by `FamilyConicScan.ts helix` at 70, 90, 110, 130, 160, 200, 240 and 270 degrees round the ear's middle, sunk 1.8 mm toward",
      "   * the head; the two ends lie inside the ear's plate, in front under the front limb and in the lobule.",
      "   *",
      "   * Over the top, the crests at 70, 90 and 110 degrees are carried out from the ear's middle ([9, 1576] in the side view) by 1.3, 1.0 and",
      "   * 1.2 mm and 0.4 to 0.5 mm farther toward the head. Read along rays from that middle (a scratch probe of the leaf with the tube merged, the",
      "   * farthest vertex of each face within 0.6 mm of the ray), the leaf's rim reached 0.6 to 1.4 mm past the tube there, and from above its",
      "   * rim stood behind the tube as a lip of thin facets, the slivers on `ear.high-oblique`; carried out, the tube reaches past the leaf",
      "   * within 0.3 mm all over the top and the lip is gone.",
      "   *",
      "   * On the plate (`plate`) the front limb and the top stood 1.3 to 5.7 mm outside the plate's face (a scratch probe, the signed distance from",
      "   * the course to the plate every millimetre), so the tube hung free over the top with a gap under it and its front end was a capped tube",
      "   * in the air. The two top centres are moved 1.2 mm toward the plate's nearest point, so the tube crosses the plate along the top; the",
      "   * front limb is sunk 2 mm and carried on down the helix's crus into the head, its first centre [16, 1578, 72] under the crus's skin,",
      "   * so its front end is buried in the head. Its lower limb from 1,570 to 1,555 mm stands 1 mm farther out, clear of the antihelix (below).",
      "   */",
      "  export const helix: V3[] = [[16, 1578, 72], [17, 1586, 77], [15.61, 1596.61, 82.01], [6.56, 1598.26, 88.17], [-1.09, 1593.75, 93.0], [-3.8, 1584.8, 94.6], [-3.8, 1575.9, 92.6], [-0.8, 1569.2, 91.9], [2.3, 1563.8, 90.2], [7, 1555.5, 86.3], [13, 1551, 81]];",
      "",
      "  /**",
      "   * The ear's plate's course, along the auricle's long axis from below the lobule to above the helix's top, through the middle of the plate's",
      "   * lens at each station: the lens is the auricle's cranial skin and the floor of its hollows, read off the reference's sections square",
      "   * to the course (`FamilyConicBody.ts plate --kernels`, which also gives each lens's centroid in its chart). Laid through those centroids",
      "   * where it can be, with the turn at 1,566 mm 2 mm farther back than they stand, since there the lens is 4 mm thin and the course fell",
      "   * on its floor, and its last leg aimed 5 mm behind the top lenses' centroids: on the leg through them (to [13, 1600, 80.5]) the planes",
      "   * leaned 30 degrees forward and three of them cut the helix's front limb with the plate, a lens three times as long. The last centre",
      "   * stands under the helix's top (its course 88.6 mm out at 1,599.3 mm), so the plate's top cap closes into the tube: ended at",
      "   * [8, 1602, 80.5] the cap closed 8 mm inside the tube's line and its square end showed under the helix's arch (`ear.left`). Every",
      "   * section holds the course.",
      "   */",
      "  export const plate: V3[] = [[22.5, 1538, 69.8], [16, 1550, 72], [-1, 1566, 77.5], [1.5, 1580, 79.5], [7.5, 1605, 87]];",
      "",
      "  /**",
      "   * The antihelix's course, along its crest from its lower end at the antitragus up its body and on along its superior crus to the",
      "   * helix's top. Each centre is a crest read by `FamilyConicScan.ts helix 79 7 ridges` (side distance over the auricle's least-squares plane",
      "   * `z = 26.36 - 0.651 x + 0.041 y`, from the concha's middle [13, 1568] and the fossa's [9, 1587]), sunk 2.2 mm, the tube's radius, along",
      "   * that plane's normal `(0.545, -0.034, 0.838)` toward the head, so the tube's top stands on the crest. The upper end stops 3 mm short",
      "   * of the crest's last reading, sunk 1.5 mm more, inside the plate and more than 2.5 mm clear of the helix's tube and blend: carried into",
      "   * the helix's tube, the antihelix's merge curve crossed the helix's blend and no rail stood beside it, so the two tubes' blends must not",
      "   * meet. The lower two are sunk 2 and 1.5 mm more: measured against the plate (a scratch probe, the signed distance from the course to",
      "   * the plate's surface every millimetre), the course runs 0 to 1.2 mm outside the plate's face along the body and 0.1 mm inside it at its",
      "   * lower end, where the merge's walk was lost; sunk, the end stands 2 mm inside. Measured along both whole courses (a scratch probe), the",
      "   * antihelix's body overlapped the helix's lower limb by up to 0.7 mm at 1,563 to 1,570 mm and stood within 2.5 mm of it from 1,561 to",
      "   * 1,577 mm, so their blends met: the lower four centres stand 2 mm farther in along the plate and the helix's lower limb 1 mm farther",
      "   * out, the antihelix 1.5 mm and the helix's limb 2 mm round there, and the two tubes stay at least 2.95 mm apart everywhere.",
      "   */",
      "  export const antihelix: V3[] = [[6.2, 1559.8, 76.9], [6.3, 1562.6, 80.2], [4.6, 1568.1, 85.8], [3.4, 1574.6, 86.8], [3.2, 1582.1, 87.7], [4.8, 1588.1, 85.0], [4.6, 1590.0, 83.4]];",
      "",
      "  /** Where the nose's course starts, inside the face 5 mm behind the frontal plane through the alar grooves. */",
      "  export const noseRoot: V3 = [108, 1556, 0];",
      "",
      "  /** Where the nose's course ends, straight forward past its tip. */",
      "  export const noseTip: V3 = [140, 1556, 0];",
      "",
      "  /**",
      "   * Where the course of the concha's bowl starts, over the bowl's deepest point, 6 mm deeper than read off the leaf: the cutter stood",
      "   * 6 mm shallower than the reference's floor and closed in a rounded cap at 71 mm (EA2), and its walls met the head only inside that cap,",
      "   * where no seed is sought (a scratch probe along its four quarter lines).",
      "   */",
      "  export const conchaRoot: V3 = [16.5, 1563, 84];",
      "",
      "  /** Where it ends, square into the head under the bowl. */",
      "  export const conchaTip: V3 = [16.5, 1563, 54];",
      "",
      "  /**",
      "   * Where the breast's course starts, inside the chest 30 mm behind the dome's top along the skin's normal there: the top is the skin's",
      "   * point farthest along that normal, and the normal the vector area of the skin within 12 mm of the top.",
      "   */",
      "  export const breastRoot: V3 = " + JSON.stringify(BREAST_ROOT).replaceAll(",", ", ") + ";",
      "",
      "  /** Where the breast's course ends, along the same normal 8 mm past the top. */",
      "  export const breastTip: V3 = " + JSON.stringify(BREAST_TIP).replaceAll(",", ", ") + ";",
      "",
      "  /** Where a nostril's course starts, below the nose under the middle of the nostril's mouth. */",
      "  export const nostrilRoot: V3 = [127.1, 1540.4, 7.7];",
      "",
      "  /** Where a nostril's course ends, straight up inside the nose. */",
      "  export const nostrilTip: V3 = [119.1, 1560.4, 7.7];",
      "",
      "  /** The point `length` millimetres past `b` on the line from `a` through `b`: where a digit's course ends beyond its last joint. */",
      "  export function beyond(a: V3, b: V3, length: number): V3 {",
      "    const d: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);",
      "    return [b[0] + ((b[0] - a[0]) * length) / d, b[1] + ((b[1] - a[1]) * length) / d, b[2] + ((b[2] - a[2]) * length) / d];",
      "  }",
      "",
      "  /** The point `length` millimetres past `from` along the mean of the unit directions of `segments`: where a limb's course runs on past its knuckles toward its digits. */",
      "  export function toward(from: V3, segments: [V3, V3][], length: number): V3 {",
      "    const sum: number[] = [0, 0, 0];",
      "    for (const [a, b] of segments) {",
      "      const d: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);",
      "      for (let c: number = 0; c < 3; ++c) sum[c] = sum[c]! + (b[c]! - a[c]!) / d;",
      "    }",
      "    const l: number = Math.hypot(sum[0]!, sum[1]!, sum[2]!);",
      "    return [from[0] + (sum[0]! * length) / l, from[1] + (sum[1]! * length) / l, from[2] + (sum[2]! * length) / l];",
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
      ...(family.layout.anchors.some((anchor: C.IAnchor): boolean => anchor.kind === "f") ? [] : ["import { AutoMovieHumanConicSection } from \"../conic/AutoMovieHumanConicSection\";"]),
      // The joints are imported only when the course names them; a course written as numbers leaves the import unused.
      ...(part.course.includes("J.") ? ["import { AutoMovieHumanF1Joints } from \"./AutoMovieHumanF1Joints\";"] : []),
      "",
      "/**",
      " * f1's " + part.name + " tape wall" + (part.mirrored ? " on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly" : "") + ".",
      " *",
      " * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs",
      " * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each",
      " * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.",
      " *",
      " * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between",
      " * them: the section is a chain of conics through its four extremes" + (depth > 0 ? " and one median point per quarter" : "") + (grooves(family.layout).length > 0 ? ", with a groove of two inflections and its floor after anchors " + grooves(family.layout).join(" and ") : "") + (part.skin === undefined ? ", fitted to the convex hull of the reference skin" : ", fitted to the section itself"),
      (part.skin === undefined ? " * (the path of a taut tape)." : part.air !== undefined ? " * read along rays from the course: the air round the course point, capped under the band it cuts and drawn in from the walls." : " * read along rays from the course, so it is star-shaped about it.") + (family.layout.mirror ? " Its front and back extremes stand on the median line and its +v half is reflected in it." : ""),
      " *",
      " * Source: the f1 reference " + (part.head === true ? "head" : part.whole === true ? "body and head" : "body") + " cut by this course's own planes over stations " + part.domain[0] + " to " + part.domain[1] + " mm, " + sections + " sections " + (part.step ?? STEP_MM) / 2 + " mm apart, every",
      " * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over",
      " * all sections). Regenerated through the engine's view loft from these numbers alone, " + (part.loose === true ? "the vertices of each section's hull lie" : "the reference skin's cut vertices lie"),
      " * " + engine.engineMeanMm + " mm from it on average and at most " + engine.engineMaxMm + " mm" + (part.loose === true ? "; what lies inside that hull is not modelled" : "") + ". " + engine.scalars + " independent numbers.",
      " */",
      "export const " + name + ": AutoMovieHumanConicLoft.IFamily = {",
      "  name: " + JSON.stringify(family.name) + ",",
      "  centres: " + part.course.replaceAll("J.", "AutoMovieHumanF1Joints.") + ",",
      "  halves: " + JSON.stringify(family.halves).replaceAll(",", ", ") + ",",
      "  up: " + JSON.stringify(family.up).replaceAll(",", ", ") + ",",
      ...(family.roll === undefined ? [] : ["  // The chart's roll about the course, radians at its own knots (`AutoMovieHumanConicLoft.IFamily.roll`).", "  roll: { knots: " + JSON.stringify(family.roll.knots).replaceAll(",", ", ") + ", values: " + JSON.stringify(family.roll.values).replaceAll(",", ", ") + " },"]),
      // A layout with feature anchors has no constructor of its own in the model, so it is written out.
      family.layout.anchors.some((anchor: C.IAnchor): boolean => anchor.kind === "f")
        ? "  layout: " + JSON.stringify({ mirror: family.layout.mirror, anchors: family.layout.anchors.map((anchor: C.IAnchor): C.IAnchor => ({ kind: anchor.kind, ...(anchor.guide === true ? { guide: true } : {}), ...(anchor.level === undefined ? {} : { level: anchor.level }), ...(anchor.feature === undefined ? {} : { feature: anchor.feature }) })) }).replaceAll(",", ", ").replaceAll(":", ": ") + ","
        : "  layout: AutoMovieHumanConicSection." + (family.layout.mirror ? "bilateral(" + depth + ")" : family.layout.anchors[0]?.mid === true ? "lens(" + depth + ")" : grooves(family.layout).length > 0 ? "inflected(" + depth + ", " + JSON.stringify(grooves(family.layout)).replaceAll(",", ", ") + ")" : "limb(" + depth + ")") + ",",
      "  knots: " + JSON.stringify(family.knots).replaceAll(",", ", ") + ",",
      "  values: [",
    ];
    family.values.forEach((field: number[], f: number): void => {
      lines.push("    // " + names[f], "    " + JSON.stringify(field).replaceAll(",", ", ") + ",");
    });
    lines.push("  ],");
    if (part.pitch !== undefined) lines.push("", "  // Phases round the part stand at most this far apart, mm (`AutoMovieHumanConicLoft.IFamily.pitch`).", "  pitch: " + part.pitch + ",");
    if (family.tips !== undefined) lines.push("", "  // The part closes in a point at `tip`, " + (typeof part.tip === "number" ? "a station placed by anatomy" : "the station where the reference's own loop vanishes") + "; its cap starts at `from`.", "  tips: " + JSON.stringify(family.tips).replaceAll("\"", "").replaceAll(",", ", ").replaceAll(":", ": ") + ",");
    if (family.reliefs !== undefined && family.reliefs.length > 0) {
      lines.push("", "  // Reliefs: heights in mm of a uniform cubic B-spline net over a window of the wall's chart, moved along `axis`; they carry the skin that lies inside the tape wall.", "  reliefs: [");
      for (const relief of family.reliefs) lines.push("    " + JSON.stringify({ ...relief, phases: Math.abs(relief.phases[1] - relief.phases[0] - 2 * Math.PI) < 1e-9 ? relief.phases : relief.phases.map(round4), axis: relief.axis.map((x: number): number => Math.round(x * 1e5) / 1e5) }).replaceAll(",", ", ") + ",");
      lines.push("  ],");
    }
    lines.push("};", "");
    return lines.join("\n");
  }

  /**
   * The anchors of the limb layout after which a grooved layout (`AutoMovieHumanConicSection.inflected`) stands a groove `[i, m, i]`: each
   * `i` that starts such a triple follows the base anchor counted before it.
   */
  function grooves(layout: C.ILayout): number[] {
    const out: number[] = [];
    let base: number = -1;
    layout.anchors.forEach((anchor: C.IAnchor, k: number): void => {
      if (anchor.kind === "i" && layout.anchors[k + 1]?.kind === "m" && layout.anchors[k + 2]?.kind === "i") out.push(base);
      else if (anchor.kind !== "i" && !(anchor.kind === "m" && layout.anchors[k - 1]?.kind === "i" && layout.anchors[k + 1]?.kind === "i")) ++base;
    });
    return out;
  }

  /**
   * A section loop without the stretch a neighbouring part owns: the vertices where `outside` is positive are dropped and each crossing of zero,
   * found by bisection on its edge, becomes a vertex, so the loop closes by a straight chord from where it leaves to where it returns.
   */
  function without(loop: readonly C.P[], frame: AutoMovieLoftFrame.IFrame, outside: (p: R.V) => number, round?: (p: R.V) => number, opening?: (p: R.V) => number, report?: (kind: "conic" | "s" | "chord" | "short" | "outside", detail?: string, span?: [number, number], rho?: { side: number; most: number; used: number }) => void, cap?: (side: number) => number | undefined): C.P[] | null {
    const world = (p: C.P): R.V => [frame.origin[0] + p[0] * frame.u[0] + p[1] * frame.v[0], frame.origin[1] + p[0] * frame.u[1] + p[1] * frame.v[1], frame.origin[2] + p[0] * frame.u[2] + p[1] * frame.v[2]];
    const g = (p: C.P): number => outside(world(p));
    const values: number[] = loop.map(g);
    if (values.every((value: number): boolean => value <= 0)) return [...loop];
    const out: C.P[] = [];
    // Each kept point: a vertex of the loop, or the crossing where the loop leaves the kept skin, or where it comes back.
    const kinds: ("vertex" | "exit" | "entry")[] = [];
    // Whether each exit leaves the skin into the opening (`opening`): the first vertex it drops is that clip's.
    const opened: boolean[] = [];
    for (let i: number = 0; i < loop.length; ++i) {
      const j: number = (i + 1) % loop.length;
      if (values[i]! <= 0) {
        out.push(loop[i]!);
        kinds.push("vertex");
      }
      if (values[i]! <= 0 === values[j]! <= 0) continue;
      let inside: C.P = values[i]! <= 0 ? loop[i]! : loop[j]!;
      let beyond: C.P = values[i]! <= 0 ? loop[j]! : loop[i]!;
      for (let k: number = 0; k < 30; ++k) {
        const middle: C.P = [(inside[0] + beyond[0]) / 2, (inside[1] + beyond[1]) / 2];
        if (g(middle) <= 0) inside = middle;
        else beyond = middle;
      }
      out.push(inside);
      kinds.push(values[i]! <= 0 ? "exit" : "entry");
      opened[out.length - 1] = values[i]! <= 0 && opening !== undefined && opening(world(loop[j]!)) > 0;
    }
    if (out.length < 3) return null;
    if (round === undefined && opening === undefined) return out;

    // Across a part's opening (`opening`) the loop closes by the opening's own closure through its two ends, with the skin's values and
    // tangents there (construction.md, Ports: the parent's field across the hole is its own extension, which the port removes), not by the
    // chord: the chord's two corners and its straight run were read as skin, inflections of 8 to 31 degrees round f1's arm opening. One conic
    // where the ends' tangent lines meet ahead of both; otherwise two, through a point on the chord with one inflection between them, at
    // the share and turn nearest the chord's middle and direction that admit both (the pre-check's closure); the chord where neither does.
    const step = (k: number, by: 1 | -1): C.P => {
      let run: number = 0, m: number = k;
      while (run < 2) {
        const n: number = (m + by + out.length) % out.length;
        if (n === k) break;
        run += Math.hypot(out[n]![0] - out[m]![0], out[n]![1] - out[m]![1]);
        m = n;
      }
      return out[m]!;
    };
    const unit = (a: C.P, b: C.P): C.P => {
      const l: number = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
    };
    const meet = (p: C.P, d: C.P, q: C.P, e: C.P): { a: number; b: number; X: C.P } => {
      const den: number = d[0] * e[1] - d[1] * e[0];
      const w: C.P = [q[0] - p[0], q[1] - p[1]];
      const a: number = (w[0] * e[1] - w[1] * e[0]) / den;
      return { a, b: (w[0] * d[1] - w[1] * d[0]) / den, X: [p[0] + a * d[0], p[1] + a * d[1]] };
    };
    // A conic arc of shoulder `rho` from p0 to p2 under its corner (its middle weight rho / (1 - rho)), one point a millimetre of its chord,
    // ends excluded.
    const arc = (p0: C.P, corner: C.P, p2: C.P, rho: number): C.P[] => {
      const w: number = rho / (1 - rho);
      const n: number = Math.max(2, Math.ceil(Math.hypot(p2[0] - p0[0], p2[1] - p0[1])));
      return Array.from({ length: n - 1 }, (_: unknown, i: number): C.P => {
        const t: number = (i + 1) / n;
        const [b0, b1, b2] = [(1 - t) ** 2, 2 * t * (1 - t) * w, t * t];
        const d: number = b0 + b1 + b2;
        return [(b0 * p0[0] + b1 * corner[0] + b2 * p2[0]) / d, (b0 * p0[1] + b1 * corner[1] + b2 * p2[1]) / d];
      });
    };
    // The fullest closure the opening allows: its shoulder the largest, from one half (a parabola) down in hundredths, with which every
    // point stays inside the reference's cut-away region; a parabola through f1's shoulder at 1,356 mm stood a few millimetres outside the
    // skin there. Where none does, the shoulder goes on down to the model's lower share bound (`CLOSURE_LEAST`), a conic close to its chord,
    // never the chord itself: a closure that switched between a conic and its chord from one station to the next moved the side extreme
    // 30 to 47 mm (f1 at 1,330 mm). The shoulder used is the smoothed one along the stations (`cap`) where that is smaller.
    const fullest = (side: number, build: (rho: number) => C.P[]): { points: C.P[]; most: number; used: number } => {
      let most: number = CLOSURE_LEAST;
      for (let rho: number = 0.5; rho > CLOSURE_LEAST; rho -= 0.01)
        if (contained(build(rho))) {
          most = rho;
          break;
        }
      const used: number = Math.max(CLOSURE_LEAST, Math.min(most, cap?.(side) ?? most));
      return { points: build(used), most, used };
    };
    // A closure stays within the part of the section the port removes: inside the reference's own cut and on the opening's side (`opening`
    // at least -0.5 mm). Where the opening's ends nearly meet at the armpit's crease (f1 at 1,279 mm, 2.5 mm above the saddle) their skin
    // tangents point almost opposite ways, their tangent lines meet far off, and a parabola through them ran out 200 mm either side, off
    // both skins, crossing 103 of the section's rays more than once; its shoulder is lowered until it stays inside (`fullest`).
    const insideLoop = (p: C.P): boolean => {
      let inside: boolean = false;
      for (let i: number = 0, j: number = loop.length - 1; i < loop.length; j = i++) {
        const [a, b] = [loop[i]!, loop[j]!];
        if (a[1] > p[1] !== b[1] > p[1] && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
      }
      return inside;
    };
    const contained = (points: readonly C.P[]): boolean => points.every((p: C.P): boolean => insideLoop(p) && opening!(world(p)) >= -0.5);
    const leaves = (points: readonly C.P[]): string => `${points.filter((p: C.P): boolean => !insideLoop(p)).length} of ${points.length} off the cut, opening down to ${Math.min(...points.map((p: C.P): number => opening!(world(p)))).toFixed(1)} mm`;
    const closure = (k: number): C.P[] | null => {
      const e1: C.P = out[k]!, e2: C.P = out[(k + 1) % out.length]!;
      const side: number = Math.sign(e1[1] + e2[1]) || 1;

      const t1: C.P = unit(step(k, -1), e1), t2: C.P = unit(e2, step((k + 1) % out.length, 1));
      const plain = meet(e1, t1, e2, [-t2[0], -t2[1]]);
      if (plain.a > 0 && plain.b > 0) {
        const single = fullest(side, (rho: number): C.P[] => arc(e1, plain.X, e2, rho));
        report?.(contained(single.points) ? "conic" : "outside", contained(single.points) ? undefined : `conic: ${leaves(single.points)}`, [Math.atan2(e1[1], e1[0]), Math.atan2(e2[1], e2[0])], { side, most: single.most, used: single.used });
        return single.points;
      }
      const chord: C.P = unit(e1, e2);
      let best: { t: number; d: number; A1: C.P; A2: C.P; I: C.P } | null = null;
      for (let t: number = 0.2; t <= 0.801; t += 0.05)
        for (let d: number = -85; d <= 85; ++d) {
          const I: C.P = [e1[0] + t * (e2[0] - e1[0]), e1[1] + t * (e2[1] - e1[1])];
          const r: number = (d * Math.PI) / 180;
          const tau: C.P = [chord[0] * Math.cos(r) - chord[1] * Math.sin(r), chord[0] * Math.sin(r) + chord[1] * Math.cos(r)];
          const m1 = meet(e1, t1, I, [-tau[0], -tau[1]]);
          const m2 = meet(I, tau, e2, [-t2[0], -t2[1]]);
          if (m1.a > 0 && m1.b > 0 && m2.a > 0 && m2.b > 0 && (best === null || Math.abs(t - 0.5) + Math.abs(d) / 90 < Math.abs(best.t - 0.5) + Math.abs(best.d) / 90)) best = { t, d, A1: m1.X, A2: m2.X, I };
        }
      if (best === null) {
        report?.("chord");
        return null;
      }
      const pick = best;
      const twin = fullest(side, (rho: number): C.P[] => [...arc(e1, pick.A1, pick.I, rho), pick.I, ...arc(pick.I, pick.A2, e2, rho)]);
      report?.(contained(twin.points) ? "s" : "outside", contained(twin.points) ? undefined : `s: ${leaves(twin.points)}`, [Math.atan2(e1[1], e1[0]), Math.atan2(e2[1], e2[0])], { side, most: twin.most, used: twin.used });
      return twin.points;
    };
    // Where the stretch left out was cut away by `round`, a surface of revolution about the course, the loop closes along that surface's
    // circle instead of the chord: the circle is the wall there, and a chord across it leaves the hull a corner where the chord meets the
    // skin. One point every 2 degrees, its radius running from the exit's to the entry's.
    const closed: C.P[] = [];
    out.forEach((p: C.P, k: number): void => {
      closed.push(p);
      const next: C.P = out[(k + 1) % out.length]!;
      if (kinds[k] === "exit" && kinds[(k + 1) % out.length] === "entry" && opened[k] === true) {
        closed.push(...(closure(k) ?? []));
        return;
      }
      if (round === undefined || kinds[k] !== "exit" || kinds[(k + 1) % out.length] !== "entry" || Math.abs(round(world(p))) > 0.5 || Math.abs(round(world(next))) > 0.5) return;
      const [a, b]: number[] = [Math.atan2(p[1], p[0]), Math.atan2(next[1], next[0])];
      const sweep: number = Math.atan2(Math.sin(b - a), Math.cos(b - a));
      const [ra, rb]: number[] = [Math.hypot(p[0], p[1]), Math.hypot(next[0], next[1])];
      const steps: number = Math.ceil(Math.abs(sweep) / ((2 * Math.PI) / 180));
      for (let i: number = 1; i < steps; ++i) {
        const t: number = i / steps;
        const r: number = ra + (rb - ra) * t;
        closed.push([r * Math.cos(a + sweep * t), r * Math.sin(a + sweep * t)]);
      }
    });
    return closed;
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

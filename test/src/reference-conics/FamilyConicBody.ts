import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { AutoMovieLoftChain, type AutoMovieLoftFrame, AutoMovieLoftRelief, AutoMovieNaturalSpline, AutoMovieViewAxis, type AutoMovieViewLoft as L, AutoMovieViewChain as Q, type IAutoMovieLoftRelief } from "@automovie/engine";
import { AutoMovieHumanF1 } from "@automovie/human";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import { FamilyConicFit as F } from "./FamilyConicFit";
import { FamilyConicLoft as K } from "./FamilyConicLoft";
import { FamilyConicRelief as H } from "./FamilyConicRelief";
import { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { FamilyConicExcursion as X } from "./FamilyConicExcursion";

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
   * Where the ear's course starts and ends, mm: `AutoMovieHumanF1Joints.earRoot` and `earTip`.
   *
   * The auricle is a shell that leans back from the head: sagittal planes cut it 21 mm fore and aft at 78 mm out (x -2..21, y 1543..1597)
   * and 8 mm at 94 mm out (x -6..2, y 1574..1596), and its outermost skin is the helix's back, 96 mm out at x -4 (`FamilyConicScan.ts ear`,
   * `FamilyConicEar.ts --map`). A course straight out to the side left the sections' hulls at 92 mm out, so its wall closed in a dome round
   * the whole root and stood out as a slab from the front. A course leaning back 20 degrees and up 9 from the root's middle all the way cut
   * the root in tilted planes: where they crossed the ear's box 77 mm out, the first ring stood 84 mm out in front and under the lobule, and
   * the port's band owned the auricle's front third and the lobule's lower half (owner-coloured frames).
   *
   * This course runs straight out of the head to `EAR_TURN`, so its sections to 78 mm out stand in sagittal planes and the first ring is the
   * auricle's whole footprint, then turns over 6 mm either side of that corner to the same lean, its pole on the helix's back. The turn is
   * 31 degrees, so its tightest radius is 2 h / (1.875 angle) = 12 mm, beyond the 9 to 11 mm the sections reach on its inner side, the back
   * and top behind and above the course. Every section from 4 to 22 mm holds the course (`--observe`). Its chart's `u` leans 17 degrees
   * forward (`EAR_UP`): straight up, the front (+v) extreme lay anywhere along the hull's straight front edge over the concha's mouth and its
   * fitted height swung to 43 mm, past the section, which the native chain refused; leaning back it was refused as well.
   */
  const EAR_ROOT: R.V = [5, 1582, 74];
  const EAR_TURN: R.V = [5, 1582, 82];
  const EAR_TIP: R.V = [-4, 1586, 98];
  const EAR_HALF_MM: number = 6;

  /** `--ear-course=<x,y,z>/<x,y,z>/...`: a trial course for the ear through those centres, turning at each inner one by `--ear-half=<mm>` (4). */
  const EAR_TRIAL: R.V[] | undefined = process.argv
    .find((argument: string): boolean => argument.startsWith("--ear-course="))
    ?.slice("--ear-course=".length)
    .split("/")
    .map((centre: string): R.V => centre.split(",").map(Number) as R.V);
  const EAR_TRIAL_HALF: number = Number(process.argv.find((argument: string): boolean => argument.startsWith("--ear-half="))?.slice("--ear-half=".length) ?? 4);
  /** `--ear-up=x,y,z`: the ear chart's `u` seed (see `EAR_ROOT`). */
  const EAR_UP: R.V = (process.argv.find((argument: string): boolean => argument.startsWith("--ear-up="))?.slice("--ear-up=".length).split(",").map(Number) ?? [0.3, 0.95, 0]) as R.V;

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

  /**
   * The relief over the ear's outer face (`--ear-face=<s0>,<s1>,<phase0>,<phase1>,<rows>,<columns>,<reach>[,<facing>]`), cast along
   * `--ear-axis=x,y,z`; fitted only when asked for. On the course that runs straight out before it leans, its net converged with the dome's
   * phases on the upper inner face and drew a fan of creases there, and the outer face is left as the hull for the helix and the hollows.
   * Its last settings, kept as the flag's values:
   *
   * - Stations 6.5 to 23.6 mm: from 2 mm past the band's rail (4.5 mm), its first three rows zero and its first 2 mm faded, to just short of
   *   the pole; started at 8 mm it left the hull's bridge over the notch in front of the lobe uncarved.
   * - Phases 0.15 to 3.3 rad: the forward half of the wall from its top round past its bottom to the lobe, which is the shell's outer face;
   *   the back half is the auricle's posterior skin, along which a cast slides.
   * - 13 by 11 control heights, about 1.7 mm by 0.32 rad, faded over its first 2 mm, its last 2.5 mm and 0.3 rad at each phase edge. At 17
   *   by 17 with a reach of 8 mm the net cut the cymba and the fossa as one deep trench with sharp walls down the ear's upper half, where
   *   the reference has a broad plateau 88 to 91 mm out (the antihelix) falling off at the concha's edge; unfaded, the net overshot to
   *   11 mm in its last free row beside the pole.
   * - Reach 5 mm, facing 0.3: the scapha and the fossa lie within 5 mm of the hull (`--casts`); deeper casts, the cymba and the concha, are
   *   left to the net's fairness, and the concha is its own cut.
   * - Axis (-0.6, 0, -0.8), 37 degrees back from straight in: the shell's outer normal, between its rim's plane (31 degrees off the sagittal,
   *   `FamilyConicEar.ts --map`: rim 96 mm out at the back, 82 to 84 in front) and its hull's front edge, which recedes 1.15 mm forward for
   *   each millimetre out (`FamilyConicScan.ts ear`).
   */
  const EAR_FACE: number[] = process.argv.find((argument: string): boolean => argument.startsWith("--ear-face="))?.slice("--ear-face=".length).split(",").map(Number) ?? [6.5, 23.6, 0.15, 3.3, 13, 11, 5, 0.3];
  const EAR_FACE_AXIS: R.V = ((a: number[]): R.V => { const n: number = Math.hypot(a[0]!, a[1]!, a[2]!); return [a[0]! / n, a[1]! / n, a[2]! / n]; })(process.argv.find((argument: string): boolean => argument.startsWith("--ear-axis="))?.slice("--ear-axis=".length).split(",").map(Number) ?? [-0.6, 0, -0.8]);

  /**
   * The face relief's fades (`--ear-fade=<first>,<last>,<firstPhase>,<lastPhase>`), mm and radians. Faded, the net is gentle at its edges;
   * the ear's band, which the concha's cut crosses, failed to triangulate under a faded net until the engine read a face's membership
   * beside any edge of its walk (`probeAutoMovieSolidMesh`).
   */
  const EAR_FADE: number[] = process.argv.find((argument: string): boolean => argument.startsWith("--ear-fade="))?.slice("--ear-fade=".length).split(",").map(Number) ?? [2, 2.5, 0.3, 0.3];

  /** The ear's phase pitch (`--ear-pitch=<mm>`): at the model's 4 mm the rim's top drew a row of teeth. */
  const EAR_PITCH: number = Number(process.argv.find((argument: string): boolean => argument.startsWith("--ear-pitch="))?.slice("--ear-pitch=".length) ?? 1.5);

  /** `--ear-to=<station>`: the last station the ear's wall is fitted to, mm (22, 94 mm out, where the course still lies 2 mm inside the hull). */
  const EAR_TRIAL_TO: number = Number(process.argv.find((argument: string): boolean => argument.startsWith("--ear-to="))?.slice("--ear-to=".length) ?? 22);

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

  /**
   * The ear's box, mm: lateral of the sagittal plane the auricle leaves the skull at, and inside the auricle's extent fore and aft and in height,
   * read off `FamilyConicScan.ts ear`. Positive inside the box on either side of the head.
   */
  function ear(p: R.V): number {
    return Math.min(Math.abs(p[2]) - 77, p[0] + 10, 26 - p[0], p[1] - 1538, 1602 - p[1]);
  }

  /**
   * The auricle's course along its long axis, mm, and its turns' half lengths: from above the helix's top, through the shell's middle at
   * each height, down to below the lobule. Read by scanning the reference's sections along trial courses: each centre stands in the middle of that height's piece of
   * the shell, so every section's hull holds it. `--auricle=<json>` and `--auricle-halves=<json>` try another.
   */
  const AURICLE: R.V[] = JSON.parse(process.argv.find((a: string): boolean => a.startsWith("--auricle="))?.slice("--auricle=".length) ?? "[[9,1606,86],[7,1590,86],[2,1572,85],[5,1558,83],[15.5,1542,78.5],[18,1534,77]]");
  const AURICLE_HALVES: number[] = JSON.parse(process.argv.find((a: string): boolean => a.startsWith("--auricle-halves="))?.slice("--auricle-halves=".length) ?? "[4,5,5,3]");
  const AURICLE_DOMAIN: number[] = (process.argv.find((a: string): boolean => a.startsWith("--auricle-domain="))?.slice("--auricle-domain=".length) ?? "6,68").split(",").map(Number);
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
  const PINNA_GROOVES: number[] = (process.argv.find((a: string): boolean => a.startsWith("--pinna-grooves="))?.slice("--pinna-grooves=".length) ?? "").split(",").filter((x: string): boolean => x.length > 0).map(Number);

  /**
   * The auricle's clip, `--auricle-root=<x>,<y>,<semi y>,<semi x>,<level>` and `--auricle-level=<level>`: inside the ellipse about the
   * root in the side view the head's skin is left out under its own level, elsewhere under the other. Both at 76.5 the sections are the
   * helix's crescent and the C opens over the bowl; with the root at 70 and the rest at 77.5 they run from the rim over the antihelix to
   * the crus and the tragus, but split round the concha's floor below 1,566 mm. `--auricle-surround=<reach>` then takes each section as
   * the hull of every piece within that reach (`IPart.surround`), which closes the C over the bowl.
   */
  const AURICLE_ROOT: number[] = (process.argv.find((a: string): boolean => a.startsWith("--auricle-root="))?.slice("--auricle-root=".length) ?? "9.5,1572,31,12.5,76.5").split(",").map(Number);
  const AURICLE_LEVEL: number = Number(process.argv.find((a: string): boolean => a.startsWith("--auricle-level="))?.slice("--auricle-level=".length) ?? 76.5);
  const AURICLE_SURROUND: number | undefined = ((s: string | undefined): number | undefined => (s === undefined ? undefined : Number(s)))(process.argv.find((a: string): boolean => a.startsWith("--auricle-surround="))?.slice("--auricle-surround=".length));
  const AURICLE_GAP: number = Number(process.argv.find((a: string): boolean => a.startsWith("--auricle-gap="))?.slice("--auricle-gap=".length) ?? 6);

  /**
   * What the auricle leaves to the head, mm, positive outside the auricle: skin under a side distance of 76.5 mm, the level the head's own
   * wall bridges the ear's root at (74 to 77 mm, the trunk realized alone), rising by 0.45 mm a millimetre above 1,596 mm, where the head
   * stands 77 to 78 mm out round the helix's top; and everything outside the ear's box.
   */
  function auricle(p: R.V): number {
    const root: boolean = ((p[0] - AURICLE_ROOT[0]!) / AURICLE_ROOT[3]!) ** 2 + ((p[1] - AURICLE_ROOT[1]!) / AURICLE_ROOT[2]!) ** 2 < 1;
    return -Math.min(p[2] - (root ? AURICLE_ROOT[4]! : AURICLE_LEVEL + Math.max(0, (p[1] - 1596) * 0.45)), p[0] + 10, 28 - p[0], p[1] - 1534, 1603 - p[1]);
  }

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
    return Math.min(nose(p), p[0] - (113 + 9 * t * t * (3 - 2 * t)));
  }

  /**
   * `--side-net=rows,columns,from,to,phase,reach,fade,fadePhase,top[,fadeIn[,held]]`: a trial net over the nose's sidewalls, mirrored across
   * the dorsum to `phase` rad either side and cast inward round the course, the skin above `top` mm left unobserved, faded in over `fadeIn`
   * mm and held at zero up to `held` mm past the rail curve. Not kept (`docs/work/f1-conic-families.md`, Open): its edge drew a line along
   * the rail however it was placed, since the supra-alar hollow's deepest part lies on the band.
   */
  const SIDE_NET: number[] | undefined = process.argv.find((a: string): boolean => a.startsWith("--side-net="))?.slice(11).split(",").map(Number);

  /** Where the nose's band lands on it at a phase, mm from its first station (`AutoMovieHumanF1.NOSE_RAILS_MM`). */
  const NOSE_RAIL: (phi: number) => number = AutoMovieNaturalSpline.periodic(AutoMovieHumanF1.NOSE_RAILS_MM);

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

    /**
     * Fit the sections to the skin itself instead of its hull (the tape): each section is read along rays from the course point, keeping
     * the innermost or outermost crossing, so it is star-shaped about the course as the fit's one radius a phase needs, and its concavities
     * are the wall's own inward arcs between inflection anchors (`inflected`). Sections whose rays crossed the skin more than once are
     * reported by station (`family-body-star`). Absent, the hull.
     */
    skin?: "inner" | "outer";

    /** The name of an excursion (`FamilyConicExcursion.PARTS`) the sections are cut as, out of the reference head's level planes. */
    excursion?: string;

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

    /** The closed end is covered by the digits merged onto it, not the figure's skin (`AutoMovieHumanConicLoft.ITip.covered`). */
    covered?: boolean;

    /** Station where the cap starts when the wall is not followed to its last fitted section, mm; absent, the domain's end. */
    cap?: number;

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
    const only: string[] = process.argv.slice(2).filter((argument: string): boolean => !argument.startsWith("--"));
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
        { name: "arm", centres: armCentres, course: "[J.armRoot, J.armTurn, J.lowerarm, J.hand, J.middle1, J.toward(J.middle1, [[J.index1, J.index2], [J.middle1, J.middle2], [J.ring1, J.ring2], [J.pinky1, J.pinky2]], " + KNUCKLE.reach + ")]", halves: armHalves, up: arm.up, domain: [arm.plane + 2, KNUCKLE.end], gap: (s: number): number => (s < arm.turned ? 6 : GAP_MM), tip: KNUCKLE.end + 15, cap: 570.45, covered: true, mirrored: true, layouts: ARM_GROOVES.length === 0 ? LIMB : [{ layout: C.inflected(1, ARM_GROOVES), depth: 1 }], ...(process.argv.includes("--arm-skin") ? { skin: "outer" as const } : {}), reliefs: "auto", rounds: [
          // The forearm and the hand: the wall of two conics a quarter left the ulna's head 2 to 4 mm inside the skin at the wrist, the web
          // between the thumb and the hand up to 11 mm full and stripes of 1 to 4 mm along the forearm (`FamilyConicDeviation.ts`), which
          // are not hollows under the tape but the wall's own misfit, on both sides of it. A net round each run takes them. They meet in
          // three zero rows each, 425 to 440 mm, and drew an oval ring with level bars round the forearm above the wrist (`hand.high-oblique`
          // px 360..415 x 150..215), gone with both nets off. Handed over (`fade`), the forearm's over its last 40 mm and the hand's from
          // 400 mm over 30, the oval is gone, but the -Z little finger's band then fails its face triangulation ("unavailable source
          // physical2"); faded over 15 mm each the band is admitted and the oval stays. Not kept: the nets stand as they were emitted.
          { name: "fore", stations: [300, 440], rows: 19, columns: 26, reach: 10 },
          { name: "hand", stations: [425, KNUCKLE.relief], rows: 34, columns: 38, reach: 14, hold: thumbHold },
          // The palm on to the hand's end (`PALM`): past `KNUCKLE.relief` the wall alone is the tape across the palm's hollow.
          { name: "palm", stations: PALM.stations, rows: PALM.rows, columns: PALM.columns, reach: 14, hold: thumbHold, window: { phases: PALM.phases, fade: PALM.fade, fadePhase: PALM.fadePhase } },
        ], clip: (p: R.V): number => {
          // The thumb past where it stands free of the palm is not the hand's: inside 16 mm of its course from 40 mm past its first joint.
          // Left in, the hand's wall and the thumb's lay within half a millimetre of each other for 10 mm, and a merge traces no such meeting.
          const a: R.V = joint("thumb_01_r");
          const b: R.V = joint("thumb_03_r");
          const length: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
          const along: number = ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1]) + (p[2] - a[2]) * (b[2] - a[2])) / length;
          const thumb: number = Math.min(along - 40, 16 - Math.hypot(p[0] - a[0] - (along * (b[0] - a[0])) / length, p[1] - a[1] - (along * (b[1] - a[1])) / length, p[2] - a[2] - (along * (b[2] - a[2])) / length));

          // The arm owns the shoulder's cap as well, the skin lateral of the armpit's sagittal plane, and gives up what lies medial.
          return Math.max(thumb, ARMPIT_MM - p[2]);
        }, reliefEnd: KNUCKLE.relief },

        // The leg turns at the ankle and runs on to the ball of the foot, its sections fanning round the instep, so the heel is lofted and the ankle
        // is no seam. The ankle's turn is long enough that its tightest radius, 2 h / (1.875 angle) = 46 mm, stays outside the instep. Round the
        // turn the heel sweeps about 2.7 times faster than the station. Knots 6 mm apart there stood in a cluster of nine from 776 to 856 mm,
        // and their cubics drew a level ring above the ankle; at least 12 mm apart the ring is gone and the wall is 693 numbers at the same mean.
        // A course that leaves the ankle square to the row of toe joints, with the forefoot read as the curve round all the toes, was tried;
        // its wall stalled above 3 mm, so the foot keeps this course and closes at the toe webs, and the toes are merged onto that cap.
        { name: "leg", centres: [joint("thigh_r"), joint("calf_r"), joint("foot_r"), [133, 20, 157], toward([133, 20, 157], toes, TOE_TURN.reach)], course: "[J.thigh, J.calf, J.foot, J.footBall, J.toward(J.footBall, [[J.bigtoe1, J.bigtoe2], [J.indextoe1, J.indextoe2], [J.middletoe1, J.middletoe2], [J.ringtoe1, J.ringtoe2], [J.littletoe1, J.littletoe2]], " + TOE_TURN.reach + ")]", halves: [40, 62, TOE_TURN.half], up: [1, 0, 0], domain: [104, TOE_TURN.end], gap: 12, tip: TOE_TURN.end + 15, covered: true, mirrored: true, layouts: LIMB, reliefs: "auto", reliefEnd: TOE_TURN.relief, casts: [{ name: "sole", stations: [930, TOE_TURN.relief], axis: [0, 1, 0], rows: 16, columns: 35, reach: 6, facing: 0.8, nearest: true }] },
        // The auricle as a short loft straight out of the side of the head, then turning to lean back with the shell (`EAR_ROOT`). Of each
        // plane's loops inside the ear's box a section reads the hull, so the wall is the auricle's outline at every depth and its outer face is
        // the hull's, which recedes toward the helix's back as the sections go out. It is fitted to 22 mm along, 94 mm out, and closes where
        // the last plane still cuts the skin, in a dome whose pole stands on the helix's back. What lies inside that hull on the outer face, the scapha, the fossa and the
        // antihelix, a relief carves (`face`, `EAR_FACE`); the concha's bowl is a cut of its own.
        { name: "ear", centres: EAR_TRIAL ?? [EAR_ROOT, EAR_TURN, EAR_TIP], course: EAR_TRIAL === undefined ? "[J.earRoot, J.earTurn, J.earTip]" : JSON.stringify(EAR_TRIAL).replaceAll(",", ", "), halves: EAR_TRIAL === undefined ? [EAR_HALF_MM] : EAR_TRIAL.slice(1, -1).map((): number => EAR_TRIAL_HALF), up: EAR_UP, domain: [4, EAR_TRIAL_TO], head: true, loose: true, step: 1, gap: 3, tip: process.argv.some((a: string): boolean => a.startsWith("--ear-tip=")) ? Number(process.argv.find((a: string): boolean => a.startsWith("--ear-tip="))!.slice(10)) : true, mirrored: true, layouts: process.argv.includes("--ear-deep") ? LIMB : [LIMB[0]!], clip: (p: R.V): number => -ear(p), reliefs: [], casts: !process.argv.some((a: string): boolean => a.startsWith("--ear-face=")) ? [] : [{ name: "face", stations: [EAR_FACE[0]!, EAR_FACE[1]!], phases: [EAR_FACE[2]!, EAR_FACE[3]!], axis: EAR_FACE_AXIS, rows: EAR_FACE[4]!, columns: EAR_FACE[5]!, reach: EAR_FACE[6]!, ...(EAR_FACE[7] === undefined ? {} : { facing: EAR_FACE[7] }), fade: [EAR_FADE[0]!, EAR_FADE[1]!], fadePhase: [EAR_FADE[2]!, EAR_FADE[3]!] }], pitch: EAR_PITCH },

        // The auricle as a loft along its own long axis, from above the helix's top down through the shell's middle to below the lobule
        // (read by scanning the reference's sections along it): each plane square to that course cuts the shell in one C-shaped piece, the head's skin left out under
        // a side distance of 76.5 mm (rising toward the helix's top, where the head stands 77 to 78 mm out), so the helix's curl, the scapha,
        // the antihelix and the lobule are each section's own skin and the fossa and the concha are its hollows. Its medial side, closed along
        // that level, is sunk into the head when it is merged.
        { name: "auricle", centres: AURICLE, course: "J.auricle", halves: AURICLE_HALVES, up: JSON.parse(process.argv.find((a: string): boolean => a.startsWith("--auricle-up="))?.slice("--auricle-up=".length) ?? "[0, 0, 1]"), domain: [AURICLE_DOMAIN[0]!, AURICLE_DOMAIN[1]!], head: true, loose: true, step: 1, gap: AURICLE_GAP, tip: true, mirrored: true, layouts: process.argv.includes("--ear-deep") ? LIMB : [LIMB[0]!], clip: auricle, ...(AURICLE_SURROUND === undefined ? {} : { surround: { from: AURICLE_DOMAIN[0]!, reach: AURICLE_SURROUND } }), reliefs: process.argv.includes("--auricle-auto") ? "auto" : [], pitch: EAR_PITCH },

        // The auricle as a conic family of its own skin: level sections straight up through the shell, each the excursion of the head's level
        // cut out of the head's line, closed across the root 4 mm inside the head (`FamilyConicExcursion.ts auricle`), read along rays from
        // the course and fitted to that skin, its grooves (`--pinna-grooves`, anchor indices of the limb layout) carried by inflection lines.
        { name: "pinna", centres: PINNA, course: "J.pinna", halves: PINNA_HALVES, up: [0, 0, 1], domain: [PINNA_DOMAIN[0]!, PINNA_DOMAIN[1]!], head: true, step: 1, gap: PINNA_GAP, tip: true, mirrored: true, excursion: "auricle", skin: process.argv.includes("--pinna-outer") ? "outer" : "inner", layouts: [{ layout: PINNA_GROOVES.length === 0 ? C.limb(PINNA_DEPTH) : C.inflected(PINNA_DEPTH, PINNA_GROOVES), depth: PINNA_DEPTH }], reliefs: [], pitch: EAR_PITCH },

        // The nose's free end as a short loft straight forward out of the face, closed at its tip.
        // Its course starts 5 mm behind the box's frontal plane, so its first section, half a millimetre into the box, lies on the wings.
        { name: "nose", centres: [[108, 1556, 0], [140, 1556, 0]], course: "[J.noseRoot, J.noseTip]", halves: [], up: [0, 1, 0], domain: [5.5, 24], head: true, loose: true, step: 1, gap: 3, tip: 28, mirrored: false, layouts: LIMB, clip: (p: R.V): number => -nose(p), reliefs: [], casts: [
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
          ...(SIDE_NET === undefined ? [] : [{ name: "side", stations: [SIDE_NET[2]!, SIDE_NET[3]!] as [number, number], phases: [-SIDE_NET[4]!, SIDE_NET[4]!] as [number, number], axis: [0, -1, 0] as R.V, turn: [0, 0, 1] as R.V, skin: (p: R.V): number => Math.max(-nose(p), p[1] - SIDE_NET[8]!), rows: SIDE_NET[0]!, columns: SIDE_NET[1]!, reach: SIDE_NET[5]!, mirror: true, fade: [SIDE_NET[9] ?? 0, SIDE_NET[6]!] as [number, number], fadePhase: [SIDE_NET[7]!, SIDE_NET[7]!] as [number, number], observe: Math.max(5.5, SIDE_NET[2]!), ...(SIDE_NET[10] === undefined ? {} : { held: (s: number, phi: number): boolean => s < 5.5 + NOSE_RAIL(phi) + SIDE_NET[10]! }) }]),
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
        // crease; past that plane, lateral of the crease and inside the arm's own tube, the skin is the arm's and is left out of the trunk's sections.
        { name: "trunk", centres: [[0, 780, 0], [0, 1705, 0]], course: "[J.axisFloor, J.axisCrown]", halves: [], up: [1, 0, 0], domain: [28, 912], whole: true, step: 2, gap: (s: number): number => (s >= 692 && s <= 732 ? Number(process.argv.find((argument: string): boolean => argument.startsWith("--jaw="))?.slice(6) ?? 3) : s > 740 ? FACE_GAP_MM : 12), tip: true, cap: 906, mirrored: false, layouts: BILATERAL, round: chin, kept: breasts, clip: (p: R.V): number => Math.max(ear(p), noseCut(p), chin(p), breasts(p), ...[1, -1].map((side: number): number => {
          const a: R.V = joint("upperarm_r");
          const b: R.V = joint("lowerarm_r");
          const length: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
          const d: R.V = [(b[0] - a[0]) / length, (b[1] - a[1]) / length, (b[2] - a[2]) / length];
          const q: R.V = [p[0] - a[0], p[1] - a[1], side * p[2] - a[2]];
          const along: number = q[0] * d[0] + q[1] * d[1] + q[2] * d[2];
          return Math.min(side * p[2] - ARMPIT_MM, ARM_TUBE_MM - Math.hypot(q[0] - along * d[0], q[1] - along * d[1], q[2] - along * d[2]));
        })), reliefs: [
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
          { name: "trunk.crotch", stations: [-12, 88], phases: [0.3, 2.0], axis: [-0.4085, 0, -0.9128], turn: [0.9128, 0, -0.4085], rows: 36, columns: 46, mirror: false, reach: 30, fade: [0, 30], fadePhase: [0.3, 0.3] },
          { name: "trunk.crotch.twin", stations: [-12, 88], phases: [-2.0, -0.3], axis: [-0.4085, 0, 0.9128], turn: [-0.9128, 0, -0.4085], rows: 36, columns: 46, mirror: false, reach: 30, fade: [0, 30], fadePhase: [0.3, 0.3] },
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
          { name: "trunk.chest.side", stations: [400, 680], phases: [Math.PI / 2 - 0.82, Math.PI / 2 + 0.82], axis: [0, 0, -1], turn: [1, 0, 0], rows: 59, columns: 53, mirror: false, uncut: true, reach: 25, fade: [30, 90] },
          { name: "trunk.chest.side.twin", stations: [400, 680], phases: [-Math.PI / 2 - 0.82, -Math.PI / 2 + 0.82], axis: [0, 0, 1], turn: [-1, 0, 0], rows: 59, columns: 53, mirror: false, uncut: true, reach: 25, fade: [30, 90] },
          // The fold under each breast, from the sternum round to the side, where the reference's skin turns from the breast's underside
          // to the chest within a few millimetres. The chest's nets are 5 mm a row, and a cubic net that coarse rounded the fold over 10 to
          // 15 mm, a soft shelf drawn in level bands 4 mm tall. A net 3 mm a row over the fold's stations lets the crease turn within two
          // rows (its heights reach only 0.3 mm: the sections already fit there), and the layers inside it are cut as fine (`leaf`). The
          // sections are 2 mm apart and every other one is withheld, so a net 2 mm a row, and one 0.016 or 0.024 rad a column, had rows the
          // fit saw once and drew the reference's facets as a mottle; 3 mm and 0.035 rad, 5 mm at the breast, see each row twice. Cast
          // square to the wall about its middle phase, 0.75 rad, as the chest's windows are, and fitted after them.
          { name: "trunk.fold", stations: [400, 490], phases: [0.05, 1.45], axis: [-0.7317, 0, -0.6816], turn: [0.6816, 0, -0.7317], rows: 33, columns: 43, mirror: false, reach: 25, fade: [15, 15], fadePhase: [0.15, 0.15] },
          { name: "trunk.fold.twin", stations: [400, 490], phases: [-1.45, -0.05], axis: [-0.7317, 0, 0.6816], turn: [-0.6816, 0, -0.7317], rows: 33, columns: 43, mirror: false, reach: 25, fade: [15, 15], fadePhase: [0.15, 0.15] },
          // The neck and head: windows whose cast turns with the phase (`turn`), square to the wall all the way round. One net goes round the
          // whole head with its seam down the back, and ends at the crown's tip, 918.88 mm, where a relief must vanish for the pole. With
          // fixed axes the head took four windows, front, back and two sides, whose edges met in a seam down the cheek and over the skull
          // and whose casts grazed the jaw's side; cast round, the cheek, the jaw's side, the temple and the ear's root are one smooth net
          // of fewer heights. A cast that lands farther than `reach` is not observed: between the lips one slipped through to what lies
          // behind, 78 mm on, and dug a pit in the mouth.
          { name: "trunk.head", stations: [620, 918.88], phases: [-Math.PI + 0.15, Math.PI - 0.15], axis: [-1, 0, 0], turn: [0, 0, -1], rows: 61, columns: 109, mirror: true, reach: 35, fade: [30, 0] },
          // The head's net is zero along its seam down the back, where the skin still lies inside the tape and a ridge stood; this window
          // over the back takes what the first leaves there.
          { name: "trunk.head.back", stations: [620, 918.88], phases: [Math.PI - 1.0, Math.PI + 1.0], axis: [1, 0, 0], turn: [0, 0, 1], rows: 61, columns: 39, mirror: true, reach: 20, fade: [30, 0] },
          // Under the jaw the wall's knots stand 3 mm apart for the chin's step, and every field rippled with them: a ring 1.5 mm high
          // stood round the whole neck at that level, the nape included. A band 1.4 mm apart along the station, round the neck and again
          // over its back for the seam, takes the ring and follows the jaw's line where it rises to the sides. What stays is in front,
          // under the chin: that skin is level, a level section cannot sample it and a cast round the axis only grazes it.
          { name: "trunk.collar", stations: [680, 734], phases: [-Math.PI + 0.15, Math.PI - 0.15], axis: [-1, 0, 0], turn: [0, 0, -1], rows: 39, columns: 131, mirror: true, reach: 30, fade: [8, 8] },
          { name: "trunk.collar.back", stations: [680, 734], phases: [Math.PI - 0.8, Math.PI + 0.8], axis: [1, 0, 0], turn: [0, 0, 1], rows: 39, columns: 37, mirror: true, reach: 10, fade: [8, 8] },
          // The face: a finer net, 2.6 mm apart, between the throat and the brow.
          { name: "trunk.face", stations: [690, 890], phases: [-1.2, 1.2], axis: [-1, 0, 0], turn: [0, 0, -1], rows: 81, columns: 69, mirror: true, reach: 30, fade: [15, 15] },
          // The mouth: a net 1.5 mm apart over its band of the face, which the face's net left a block.
          { name: "trunk.mouth", stations: [722, 758], phases: [-0.5, 0.5], axis: [-1, 0, 0], turn: [0, 0, -1], rows: 27, columns: 67, mirror: true, reach: 12, fade: [5, 5] },
        ], casts: [
          // The eyes: a net 1.5 mm apart over their band, cast in space onto the outermost skin. The reference's eyeball is a closed
          // surface of its own behind the lids (`FamilyConicScan.ts eye`), which no section of the trunk holds: cast in the section
          // planes, the eyes' net ran past the lids into the socket and drew a dark slit. Cast in space, between the lids it lands on the
          // eyeball and over them on the lids.
          { name: "eyes", stations: [792, 826], phases: [-0.8, 0.8], axis: [-1, 0, 0], turn: [0, 0, -1], rows: 26, columns: 105, reach: 12, mirror: true },
          // The chin, which the sections leave out (`CHIN`): cast from the cone's wall forward and down at 45 degrees on the median line,
          // so the chin's front and the level skin under it are both seen at 45 degrees and the chin is one height over the wall.
          { name: "chin", stations: [690, 734], phases: [-0.8, 0.8], axis: [-Math.SQRT1_2, Math.SQRT1_2, 0], turn: [0, 0, -1], skin: (p: R.V): number => Math.max(ear(p), noseCut(p)), rows: 47, columns: 57, reach: 30, mirror: true },
          // The top of each shoulder, between the neck's muscle and the shoulder's point: the skin there faces up, a cast round the axis
          // grazes it, and it stood 2 to 4 mm full on both sides (`FamilyConicDeviation.ts`). A coarse net cast straight down takes it.
          // It lands only on skin that faces up within 37 degrees, as the sole's does: toward the window's sides the skin turns to face
          // outward and a height straight down slides the wall along itself. Landing anywhere, the -Z net left the slope streaked with
          // folds of 44 degrees; landing on skin that faces up, 33.
          // Its edges hand over (`fade`, 12 mm and 0.2 rad): the side window now leaves it the shoulder's top, and a net asked for the
          // whole height right up to its zero edge falls off within two rows.
          { name: "shoulder", stations: [596, 664], phases: [0.95, 1.95], axis: [0, -1, 0], rows: 17, columns: 27, reach: 8, facing: 0.8, nearest: true, fade: [12, 12], fadePhase: [0.2, 0.2] },
          { name: "shoulder.twin", stations: [596, 664], phases: [-1.95, -0.95], axis: [0, -1, 0], rows: 17, columns: 27, reach: 8, facing: 0.8, nearest: true, fade: [12, 12], fadePhase: [0.2, 0.2] },
          // No net over the crown. The conic cap stood 3 to 4 mm under the skull and a coarse net cast along the course lifted it; the cap
          // that bends as the wall does is full enough, and meshed in rings the net drew rings round the pole.
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

      // Each section's own loop as it was cut, which for a loose part is not the hull its wall is measured against.
      const loops: C.P[][] = [];
      const step: number = part.step ?? STEP_MM;
      const gap = (s: number): number => (typeof part.gap === "function" ? part.gap(s) : (part.gap ?? GAP_MM));
      const skin: R.ISource["body"] = part.head === true ? source.head : part.whole === true ? source.all : source.body;

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

      // A plane's loop for the part: the one round the course, or for a `loose` part the largest closed loop the clip leaves whose hull holds the course.
      // The clipped skin piece behind the last section a surrounding part read: the largest of the pieces whose hull it is.
      let piece: C.P[] | null = null;
      // A part cut out of its host as an excursion of the reference head's sections (`IPart.excursion`), in the course's own planes and chart.
      let excursion: ((y: number) => X.ISection | null) | null = null;
      const cut = (frame: AutoMovieLoftFrame.IFrame, s: number): C.P[] | null => {
        piece = null;
        if (part.excursion !== undefined) {
          const entry: X.IPart | undefined = X.PARTS.find((p: X.IPart): boolean => p.name === part.excursion);
          if (entry === undefined) throw new Error("No excursion " + part.excursion);
          excursion ??= X.along(source, entry, (t: number) => axis.at(t), domain[0] - 6, domain[1] + 6, 1.5);
          return excursion(s)?.points ?? null;
        }
        if (part.name === "concha" && CONCHA_DEPTH !== undefined) return depthLoop(s);
        if (part.loose !== true || (part.surround !== undefined && s < part.surround.from)) {
          const whole: C.P[] | null = R.cut(skin, frame).loop;
          return whole === null || part.clip === undefined ? whole : without(whole, frame, part.clip, part.round);
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
      for (let s: number = domain[0], i: number = 0; s <= domain[1] + 1e-9; s += step / 2, ++i) {
        const frame: AutoMovieLoftFrame.IFrame = axis.at(s);
        const cutLoop: C.P[] | null = cut(frame, s);
        const starred: { points: C.P[]; folds: number } | null = part.skin === undefined || cutLoop === null ? null : X.star(cutLoop, SKIN_RAYS, part.skin);
        if (part.skin !== undefined && cutLoop !== null) star.push({ s, folds: starred === null ? -1 : starred.folds });
        // `--kernels`: each section's kernel point (the centre of its largest inscribed circle) in the world, and how many of 720 rays from
        // it and from the course point cross the section more than once, to lay a course through the kernels before fitting the skin.
        if (process.argv.includes("--kernels") && cutLoop !== null) {
          const core: { point: C.P; clearance: number } = X.kernel(cutLoop);
          const world: number[] = [0, 1, 2].map((k: number): number => frame.origin[k]! + core.point[0] * frame.u[k]! + core.point[1] * frame.v[k]!);
          const shifted: C.P[] = cutLoop.map((p: C.P): C.P => [p[0] - core.point[0], p[1] - core.point[1]]);
          log("family-body-kernel", { part: part.name, s, kernel: world.map(round), clearanceMm: round(core.clearance), foldsFromKernel: X.star(shifted, SKIN_RAYS, "inner")?.folds ?? -1, foldsFromCourse: X.star(cutLoop, SKIN_RAYS, "inner")?.folds ?? -1 });
        }
        const loop: C.P[] | null = part.skin === undefined ? cutLoop : (starred?.points ?? null);
        if (loop === null) skipped.push(s);
        else if (part.skin !== undefined) {
          // Fitted to the skin itself: its concavities are the wall's own inward arcs, between inflection anchors (`inflected`).
          rows.push({ s, points: loop, heldout: i % 2 === 1 });
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
          rows.push({ s, points: wall, heldout: i % 2 === 1 });
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
      if (part.skin !== undefined) log("family-body-star", { part: part.name, sections: star.length, refused: star.filter((r): boolean => r.folds !== 0).map((r): string => r.s.toFixed(1) + (r.folds < 0 ? ":outside" : ":" + r.folds)) });
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
      for (const { layout: plain, depth } of reuse !== undefined ? [] : deepen !== undefined ? [{ layout: C.limb(deeper), depth: deeper }] : part.layouts) {
        const layout: C.ILayout = least === undefined ? plain : { ...plain, least };
        // A deeper layout starts from the shallower one's final knots and values, cut exactly at every arc's median.
        const knots0: number[] = best === null ? [domain[0], (domain[0] + domain[1]) / 2, domain[1]] : [...best.knots];
        let result: F.IResult = attempt(knots0, layout, best === null ? undefined : F.refine(best.values, depth - 1), "depth " + depth);

        // Growth always starts from the family of least mean so far. A round that lowers that mean by 3 % is kept; one that does not is dropped
        // and its stations are not offered again, so the next round tries the next worst rows. Three dropped rounds in a row end the growth.
        // Going on from a dropped round instead carried a failed solve into every later one and left the trunk and the leg above 2 mm.
        const refused: Set<number> = new Set();
        let idle: number = 0;
        while (deepen === undefined && result.fault === null && result.training.maximumMm > 0.9 * TARGET_MM && idle < 3) {
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
        if (result.fault === null && (best === null || deepen !== undefined || result.training.maximumMm < 0.97 * best.training.maximumMm || result.training.meanMm < 0.9 * best.training.meanMm)) best = result;
        if (best !== null && best.training.maximumMm <= 0.9 * TARGET_MM) break;
      }

      // Prune: drop every knot whose removal keeps the maximum and the mean within 3 % and 5 % of the grown family.
      if (best !== null && reuse === undefined && deepen === undefined) {
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
      if (best.layout.least !== undefined) {
        const bound: number = best.layout.least;
        const unbounded: C.ILayout = { anchors: best.layout.anchors, mirror: best.layout.mirror };
        const first: number = C.units(unbounded).length - (unbounded.mirror ? unbounded.anchors.length - 1 : unbounded.anchors.length);
        best = { ...best, layout: unbounded, values: best.values.map((field: number[], f: number): number[] => (f >= first ? field.map((x: number): number => Math.max(bound, x)) : field)) };
      }

      // `--g2=<anchor>@<from>-<to>`: at every knot from `from` to `to` mm the two arcs meeting at that anchor take the shoulders that make
      // the section's curvature continuous there (`AutoMovieHumanConicSection.continuous`), before the reliefs are fitted over the wall.
      // The trunk's first median over the hips met with curvatures of 1.2 and 308 per metre, an upright line down each hip.
      const g2: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--g2="))?.slice(5);
      if (g2 !== undefined) {
        const [anchor, range]: string[] = g2.split("@");
        const [from, to]: number[] = range!.split("-").map(Number);
        const fields: number[][] = best.values.map((field: number[]): number[] => [...field]);
        best.knots.forEach((s: number, j: number): void => {
          if (s < from! || s > to!) return;
          const smooth: number[] = C.continuous(fields.map((field: number[]): number => field[j]!), best!.layout, Number(anchor));
          smooth.forEach((x: number, f: number): void => void (fields[f]![j] = x));
        });
        best = { ...best, values: fields };
      }
      const led: { knots: number[]; values: number[][] } = part.lead === undefined ? { knots: best.knots, values: best.values } :{ knots: [...[3, 2, 1].map((k: number): number => best!.knots[0]! - (part.lead! * k) / 3), ...best.knots], values: best.values.map((field: number[]): number[] => [field[0]!, field[0]!, field[0]!, ...field]) };
      const stored: string = JSON.stringify({ name: part.name, centres: part.centres.map((c: R.V): number[] => c.map(round)), halves: part.halves, up: part.up, layout: best.layout, knots: led.knots.map(round), values: led.values.map((field: number[], f: number): number[] => field.map(C.units(best!.layout)[f] === "mm" ? round : round4)) });
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
        definition.reliefs = [];
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
          const kept: boolean = !judged || fitted.heldMaxMm <= 0.5 * fitted.deepestMm;
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
        fitAll(windows, part.reliefs === "auto" && !process.argv.includes("--keep-windows"));

        // A spliced wall takes the reliefs as it takes the knots: each wall's own stored ones on its side of the station, since those were
        // fitted on the very values the splice keeps there. Fitted again over the whole spliced wall, the hollow search placed other windows
        // and the keep rule dropped the one over the hollow in front of the shoulder, which left the skin 8 mm inside the wall there.
        // `--refit` keeps the reliefs fitted just above over the whole spliced wall instead: for a splice inside a window both walls share.
        if (spliced !== null && !process.argv.includes("--refit")) {
          const { tail, at, head }: { tail: K.IStored; at: number; head: IAutoMovieLoftRelief[] } = spliced;
          // A stored net that goes once round the part is left behind: those are fitted again below, over the spliced wall.
          const window = (relief: IAutoMovieLoftRelief): boolean => relief.phases[1] - relief.phases[0] < 2 * Math.PI - 1e-9;
          definition.reliefs = [...head.filter((relief: IAutoMovieLoftRelief): boolean => window(relief) && relief.stations[1] <= at), ...(tail.reliefs ?? []).filter((relief: IAutoMovieLoftRelief): boolean => window(relief) && relief.stations[0] >= at)].map((relief: IAutoMovieLoftRelief, i: number): IAutoMovieLoftRelief => ({ ...relief, name: part.name + ".hollow." + i }));
          log("family-body-spliced", { part: part.name, at, reliefs: definition.reliefs.map((relief: IAutoMovieLoftRelief): string => relief.name + " " + relief.stations.join("..")) });
        }

        // The nets round the part come last, over whichever reliefs the wall has kept.
        fitAll(rounds, false);
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
      if (tip !== null) definition.tips = [null, { from: part.cap ?? domain[1], tip, ...(part.covered === true ? { covered: true } : {}) }];

      // Cast reliefs: skin that faces along the course, which no section sees. From points of the finished surface, by station and phase,
      // a ray runs along the relief's axis, and its distance to the reference triangle it meets is the height there. The ear's outer face
      // lies under its closed end and is cast back along the course on one net that closes on itself round the tip.
      for (const face of tip === null || BARE ? [] : (part.casts ?? []).filter((cast: ICast): boolean => !(CHINLESS && cast.name === "chin"))) {
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
      "  /** Where the ear's course starts, in the side of the head under the middle of the auricle's root. */",
      "  export const earRoot: V3 = " + JSON.stringify(EAR_ROOT).replaceAll(",", ", ") + ";",
      "",
      "  /**",
      "   * Where the ear's course turns from straight out of the head to leaning back with the auricle's shell: the root's sections up to 78 mm out",
      "   * stand in sagittal planes, so the root's ring holds the auricle's whole footprint, the front and the lobule included.",
      "   */",
      "  export const earTurn: V3 = " + JSON.stringify(EAR_TURN).replaceAll(",", ", ") + ";",
      "",
      "  /**",
      "   * Where the ear's course ends, leaning back and up with the auricle's shell past the helix's back: the pole of its closed end stands on",
      "   * the helix's back, the auricle's outermost skin.",
      "   */",
      "  export const earTip: V3 = " + JSON.stringify(EAR_TIP).replaceAll(",", ", ") + ";",
      "",
      "  /**",
      "   * The helix's course, along the rim's crest from the front limb over the top and down the back to the lobule. Each inner centre is the",
      "   * crest read by `FamilyConicScan.ts helix` at 70, 90, 110, 130, 160, 200, 240 and 270 degrees round the ear's middle, sunk 1.8 mm toward",
      "   * the head; the two ends lie inside the ear's leaf, in front under the front limb and in the lobule.",
      "   */",
      "  export const helix: V3[] = [[17, 1586, 79], [15.8, 1596.2, 83.1], [7, 1598.3, 89.1], [-0.5, 1592.7, 93.4], [-3.8, 1584.8, 94.6], [-3.8, 1575.9, 92.6], [-0.8, 1569.2, 90.9], [2.3, 1563.8, 89.2], [7, 1555.5, 85.3], [13, 1551, 81]];",
      "",
      "  /** Centre of the auricle's root on the sagittal plane it leaves the skull at. */",
      "  export const earBase: V3 = [9.5, 1572, 77];",
      "",
      "  /** Half extents of the auricle's root in height and fore and aft. */",
      "  export const earHalf: [number, number] = [29, 10.5];",
      "",
      "  /** Where the nose's course starts, inside the face 5 mm behind the frontal plane through the alar grooves. */",
      "  export const noseRoot: V3 = [108, 1556, 0];",
      "",
      "  /** Where the nose's course ends, straight forward past its tip. */",
      "  export const noseTip: V3 = [140, 1556, 0];",
      "",
      "  /** Where the course of the concha's bowl starts, out past the auricle over the bowl's deepest point. */",
      "  export const conchaRoot: V3 = [16.5, 1563, 90];",
      "",
      "  /** Where it ends, square into the head under the bowl. */",
      "  export const conchaTip: V3 = [16.5, 1563, 60];",
      "",
      "  /** Where the course of the trough above the concha starts, the cymba's floor behind the helix's crus. */",
      "  export const fossaRoot: V3 = [13.5, 1574, 84];",
      "",
      "  /** Where it ends, straight up the triangular fossa under the helix's front limb. */",
      "  export const fossaTip: V3 = [13.5, 1594, 84];",
      "",
      "  /**",
      "   * Where the course of the gap under the lobule starts, below the lobule's free edge and in front of the gap's middle, in the air beside the",
      "   * skull: the gap, read in frontal planes (`FamilyConicScan.ts lobule`), is widest at x 14 to 18 low down and narrows back and up to its apex.",
      "   */",
      "  export const lobuleRoot: V3 = [14, 1530, 68];",
      "",
      "  /** Where it ends, at the apex of the gap under the lobule's attachment crease (x 6 to 8, 1,555 mm, between the skull at 65 mm and the lobule). */",
      "  export const lobuleTip: V3 = [7.5, 1555.5, 65.5];",
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
      " * (the path of a taut tape)." + (family.layout.mirror ? " Its front and back extremes stand on the median line and its +v half is reflected in it." : ""),
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
      "  layout: AutoMovieHumanConicSection." + (family.layout.mirror ? "bilateral" : "limb") + "(" + depth + "),",
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
   * A section loop without the stretch a neighbouring part owns: the vertices where `outside` is positive are dropped and each crossing of zero,
   * found by bisection on its edge, becomes a vertex, so the loop closes by a straight chord from where it leaves to where it returns.
   */
  function without(loop: readonly C.P[], frame: AutoMovieLoftFrame.IFrame, outside: (p: R.V) => number, round?: (p: R.V) => number): C.P[] | null {
    const world = (p: C.P): R.V => [frame.origin[0] + p[0] * frame.u[0] + p[1] * frame.v[0], frame.origin[1] + p[0] * frame.u[1] + p[1] * frame.v[1], frame.origin[2] + p[0] * frame.u[2] + p[1] * frame.v[2]];
    const g = (p: C.P): number => outside(world(p));
    const values: number[] = loop.map(g);
    if (values.every((value: number): boolean => value <= 0)) return [...loop];
    const out: C.P[] = [];
    // Each kept point: a vertex of the loop, or the crossing where the loop leaves the kept skin, or where it comes back.
    const kinds: ("vertex" | "exit" | "entry")[] = [];
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
    }
    if (out.length < 3) return null;
    if (round === undefined) return out;

    // Where the stretch left out was cut away by `round`, a surface of revolution about the course, the loop closes along that surface's
    // circle instead of the chord: the circle is the wall there, and a chord across it leaves the hull a corner where the chord meets the
    // skin. One point every 2 degrees, its radius running from the exit's to the entry's.
    const closed: C.P[] = [];
    out.forEach((p: C.P, k: number): void => {
      closed.push(p);
      const next: C.P = out[(k + 1) % out.length]!;
      if (kinds[k] !== "exit" || kinds[(k + 1) % out.length] !== "entry" || Math.abs(round(world(p))) > 0.5 || Math.abs(round(world(next))) > 0.5) return;
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

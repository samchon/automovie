import { FamilyConicClosure } from "./FamilyConicClosure";
import { FamilyConicDivide } from "./FamilyConicDivide";
import { FamilyConicExcursion as X } from "./FamilyConicExcursion";
import { FamilyConicFairing as Fairing } from "./FamilyConicFairing";
import { FamilyConicJunction as Junction } from "./FamilyConicJunction";
import { FamilyConicFit as F } from "./FamilyConicFit";
import { FamilyConicLoft as K } from "./FamilyConicLoft";
import { FamilyConicLoop } from "./FamilyConicLoop";
import { FamilyConicRelief as H } from "./FamilyConicRelief";
import { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { FamilyConicValley } from "./FamilyConicValley";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import {
  AutoMovieConstructionComposedEnd,
  AutoMovieConstructionSplitCompose,
  AutoMovieConstructionViews,
  AutoMovieLoftFrame,
  AutoMovieLoftViewFullSource,
  AutoMovieSolidSharedCurve,
  AutoMovieSolidVector as V,
  AutoMovieViewLoft,
  orientAutoMovieSolidChart,
  AutoMovieLoftChain,
  AutoMovieLoftRelief,
  AutoMovieNaturalSpline,
  AutoMovieViewAxis,
  AutoMovieViewChain as Q,
} from "@automovie/engine";
import {
  AutoMovieHumanConicLoft,
  AutoMovieHumanJoinLoop,
  AutoMovieHumanConicSection as S,
  AutoMovieHumanCourseRuns,
  AutoMovieHumanF1,
} from "@automovie/human";
import type {
  IAutoMovieConstructionComposedEnd,
  IAutoMovieConstructionNode,
  IAutoMovieConstructionSplit,
  IAutoMovieConstructionSkinCut,
  IAutoMovieConstructionSplitCompose,
  IAutoMovieLoftViewFullSource,
  IAutoMovieSolidSurface,
  IAutoMovieViewPart,
  IAutoMovieHumanConicSection,
  IAutoMovieHumanF1,
  IAutoMovieLoftRelief,
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewAxis,
  IAutoMovieViewChain,
  IAutoMovieViewLoft,
} from "@automovie/interface";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Whole-part conic families on the f1 reference: each part is cut along its
 * own jointed course, fitted on a sparse shared knot vector, stored as plain
 * numbers, regenerated from that stored text through the engine's view loft,
 * measured against the cuts and rendered beside the reference.
 */
export namespace FamilyConicBody {
  /** Sampled position target of campaign 1, mm. */
  const TARGET_MM: number = 0.5;

  /** Least distance between two station knots, mm. */
  const GAP_MM: number = 12;

  /**
   * Whether a joint group fits by fairing (the default, the owner's order of 2026-11-22: deviation from the reference does not matter,
   * naturalness does) or reproduces the reference's forks, host ring and held sections (`--reproduce`). Fairing minimizes the
   * junction window's curvature variation (`FamilyConicFairing`) under the form and topology constraints alone, and reports every
   * deviation from the reference as a diagnostic.
   */
  const FAIR: boolean = !process.argv.includes("--reproduce");

  /** Phase lines a fairing window reads along the stations: the four section extremes and the four quarter shoulders. */
  const FAIR_LINES: number = 8;

  /**
   * The fairing fit's convergence: the share of the objective below which an accepted step's change, and its predicted change, no
   * longer count (`FamilyConicFit.fitGroup`'s relative test). The fairing rows are second differences round rings of at least 48 points
   * (`AutoMovieHumanConicLoft.phaseCount`); on a circle a second difference reads the curvature times `1 - h^2 / 12 + O(h^4)` with
   * `h = 2 pi / n` (Taylor expansion of `cos`), so the energy itself is resolved only to about `h^2 / 12` = 1.4e-3 at `n` = 48, and a
   * smaller change of it is below its own resolution.
   */
  const FAIR_CONVERGED: number = (2 * Math.PI / 48) ** 2 / 12;

  /** Successive accepted steps that must each fall under `FAIR_CONVERGED`, so one damped short step does not end the fit. ESTIMATE. */
  const FAIR_CONVERGED_STEPS: number = 3;

  /** Samples round a ring a fairing window first reads its girth on; the ring is then read at the figure's phase count for that girth. */
  const FAIR_RING: number = 64;

  /** Rays a skin-fitted section is read along (`IPart.skin`): 0.5 degree apart, a sample every 0.2 mm on a section 25 mm across. */
  const SKIN_RAYS: number = 720;

  /** Spacing of the fitting sections, mm; the withheld sections stand midway. */
  const STEP_MM: number = 4;

  /** The limb layouts of 4 and 8 conics; the 16 conic layout fitted worse from the same start on the arm and is left out until that is understood. */
  const LIMB: { layout: C.ILayout; depth: number }[] = [0, 1].map(
    (depth: number): { layout: C.ILayout; depth: number } => ({
      layout: C.limb(depth),
      depth,
    }),
  );

  /** A part symmetric about the median plane: front and back on the median line, the half reflected; fitted at depth 1 from each section's own reading. */
  const BILATERAL: { layout: C.ILayout; depth: number }[] = [
    { layout: C.bilateral(1), depth: 1 },
  ];


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
  const TRUNK_RUNS: IAutoMovieHumanConicSection.IFeatureRun[] = [
    {
      after: 0,
      anchors: [
        { kind: "f", feature: "inflection", window: [0.02, 0.25] },
        { kind: "f", feature: "convex", window: [0.05, 0.4] },
        { kind: "f", feature: "inflection", window: [0.2, 0.6] },
        { kind: "f", feature: "concave", window: [0.3, 0.8] },
        { kind: "f", feature: "inflection", window: [0.45, 0.95] },
      ],
    },
    {
      after: 2,
      anchors: [
        { kind: "f", feature: "inflection", window: [0.02, 0.35] },
        { kind: "f", feature: "concave", window: [0.05, 0.45] },
        { kind: "f", feature: "inflection", window: [0.1, 0.55] },
      ],
    },
    {
      after: 3,
      anchors: [
        { kind: "f", feature: "convex", window: [0.3, 0.9] },
        { kind: "f", feature: "inflection", window: [0.6, 0.97] },
      ],
    },
  ];
  const TRUNK_LINED: { layout: C.ILayout; depth: number }[] = [
    {
      layout: ((layout: C.ILayout): C.ILayout => ({
        ...layout,
        anchors: layout.anchors.map(
          (anchor: C.IAnchor, k: number): C.IAnchor =>
            anchor.kind === "f" && anchor.window === undefined
              ? { ...anchor, window: k < 7 ? [0.6, 0.95] : [0.05, 0.5] }
              : anchor,
        ),
      }))(
        S.featured(
          C.bilateral(1),
          TRUNK_RUNS,
          process.argv.includes("--kept-medians") ? [] : [1, 3],
        ),
      ),
      depth: 1,
    },
  ];
  // `--kept-medians`: the same runs with both medians kept as medians, the layout `--trunk-lines` had before the medians were freed, to
  // compare the two on one target.

  /** `--concha-course=<x,y,z>/<x,y,z>`, `--concha-domain=<from>,<to>`, `--concha-tip=<station>`: a trial course, domain and tip for the ear's hollow. */
  const CONCHA_TRIAL: R.V[] | undefined = process.argv
    .find((argument: string): boolean =>
      argument.startsWith("--concha-course="),
    )
    ?.slice("--concha-course=".length)
    .split("/")
    .map((centre: string): R.V => centre.split(",").map(Number) as R.V);
  const CONCHA_DOMAIN: [number, number] = (process.argv
    .find((argument: string): boolean =>
      argument.startsWith("--concha-domain="),
    )
    ?.slice("--concha-domain=".length)
    .split(",")
    .map(Number) ?? [11.5, 23]) as [number, number];
  /** `--concha-floor=<mm>`: how near the median plane the trial cutter's sections may read, in place of the ear's box (77). `--concha-up=x,y,z`: its chart's up. */
  const CONCHA_FLOOR: number = Number(
    process.argv
      .find((argument: string): boolean =>
        argument.startsWith("--concha-floor="),
      )
      ?.slice("--concha-floor=".length) ?? 77,
  );
  const CONCHA_UP: R.V = (process.argv
    .find((argument: string): boolean => argument.startsWith("--concha-up="))
    ?.slice("--concha-up=".length)
    .split(",")
    .map(Number) ?? [0, 1, 0]) as R.V;
  /** `--concha-box=<x0>,<x1>,<y0>,<y1>`: the trial cutter's sections are read inside this box, mm (no bound). */
  const CONCHA_BOX: number[] = process.argv
    .find((argument: string): boolean => argument.startsWith("--concha-box="))
    ?.slice("--concha-box=".length)
    .split(",")
    .map(Number) ?? [-Infinity, Infinity, -Infinity, Infinity];
  /** `--concha-depth=<half width>`: the trial cutter's sections are read from the skin's depth along its course (see `depthLoop`). */
  const CONCHA_DEPTH: number | undefined = ((
    d: string | undefined,
  ): number | undefined => (d === undefined ? undefined : Number(d)))(
    process.argv
      .find((argument: string): boolean =>
        argument.startsWith("--concha-depth="),
      )
      ?.slice("--concha-depth=".length),
  );
  /** `--concha-lead=<mm>`: how far the trial cutter is carried straight back from its first section (12). */
  const CONCHA_LEAD: number = Number(
    process.argv
      .find((argument: string): boolean =>
        argument.startsWith("--concha-lead="),
      )
      ?.slice("--concha-lead=".length) ?? 12,
  );
  const CONCHA_TIP: number = Number(
    process.argv
      .find((argument: string): boolean => argument.startsWith("--concha-tip="))
      ?.slice("--concha-tip=".length) ?? 24.5,
  );

  /** The ear's phase pitch (`--ear-pitch=<mm>`): at the model's 4 mm the rim's top drew a row of teeth. */
  const EAR_PITCH: number = Number(
    process.argv
      .find((argument: string): boolean => argument.startsWith("--ear-pitch="))
      ?.slice("--ear-pitch=".length) ?? 1.5,
  );

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
  const KNUCKLE: { half: number; reach: number; end: number; relief: number } =
    { half: 16, reach: 40, end: 595, relief: 575 };

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
  const PALM: {
    stations: [number, number];
    phases: [number, number];
    fade: [number, number];
    fadePhase: [number, number];
    rows: number;
    columns: number;
  } = {
    stations: [545, 610],
    phases: [0.3, 2.8],
    fade: [20, 0],
    fadePhase: [0.4, 0.4],
    rows: 16,
    columns: 16,
  };

  /**
   * The leg's course past the ball of the foot, mm, as the arm's past the knuckles (`KNUCKLE`): on toward the five toes' mean first-segment
   * direction, a turn of 15 degrees from the line from the ankle to the ball of the foot, over `half` on either side (radius 79 mm, outside
   * the forefoot's half thickness of about 20 mm). On that course the foot is one loop to 976 mm, the little toe parts at 977, the ring toe at
   * 987, the big toe at 991 and the middle and index toes at 993 (every plane's loops 2 mm apart). Its reliefs end at `relief`, before the
   * turn.
   */
  const TOE_TURN: { half: number; reach: number; end: number; relief: number } =
    { half: 10, reach: 40, end: 975, relief: 960 };

  /**
   * A trial stretch of the leg fitted to its skin with grooves (`--segment`), or none. `--segment-features=<after>:<from>:<to>;...` puts a
   * groove of three feature anchors (an inflection, the concave floor, an inflection) after a limb anchor, inside the share `[from, to]`
   * of the arclength to the next one (`FamilyConicSection.featured`), where `inflected` seats a groove only after a `u` extreme.
   */
  const SEGMENT:
    | {
        domain: [number, number];
        grooves: number[];
        features: { after: number; anchors: C.IAnchor[] }[];
        up: R.V;
        gap: number;
      }
    | undefined = ((
    arg: string | undefined,
  ):
    | {
        domain: [number, number];
        grooves: number[];
        features: { after: number; anchors: C.IAnchor[] }[];
        up: R.V;
        gap: number;
      }
    | undefined =>
    arg === undefined
      ? undefined
      : {
          domain: arg.split(",").map(Number) as [number, number],
          features: (
            process.argv
              .find((a: string): boolean => a.startsWith("--segment-features="))
              ?.slice("--segment-features=".length) ?? ""
          )
            .split(";")
            .filter((x: string): boolean => x.length > 0)
            .map((spec: string): { after: number; anchors: C.IAnchor[] } => {
              const [after, from, to] = spec.split(":").map(Number) as [
                number,
                number,
                number,
              ];
              const w: number = to - from;
              return {
                after,
                anchors: [
                  {
                    kind: "f",
                    feature: "inflection",
                    window: [from, from + 0.55 * w],
                  },
                  {
                    kind: "f",
                    feature: "concave",
                    window: [from + 0.2 * w, to - 0.2 * w],
                  },
                  {
                    kind: "f",
                    feature: "inflection",
                    window: [from + 0.45 * w, to],
                  },
                ] as C.IAnchor[],
              };
            }),
          grooves: (
            process.argv
              .find((a: string): boolean => a.startsWith("--segment-grooves="))
              ?.slice("--segment-grooves=".length) ?? ""
          )
            .split(",")
            .filter((x: string): boolean => x.length > 0)
            .map(Number),
          up: (
            process.argv
              .find((a: string): boolean => a.startsWith("--segment-up="))
              ?.slice("--segment-up=".length) ?? "1,0,0"
          )
            .split(",")
            .map(Number) as R.V,
          gap: Number(
            process.argv
              .find((a: string): boolean => a.startsWith("--segment-gap="))
              ?.slice("--segment-gap=".length) ?? 6,
          ),
        })(
    process.argv
      .find((a: string): boolean => a.startsWith("--segment="))
      ?.slice("--segment=".length),
  );

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
        const [along, r, psi]: [number, number, number] = breastFrame([
          p[0],
          p[1],
          side * p[2],
        ]);
        return Math.min(along, BREAST_CLIP(psi) - r);
      }),
    );
  }

  /** `BREAST_CLIP_MM` round the clock, by the periodic cubic. */
  const BREAST_CLIP: (psi: number) => number =
    AutoMovieNaturalSpline.periodic(BREAST_CLIP_MM);

  /**
   * The breast's last fitted section and the station its cap starts at, mm along its course; the top is 30 mm along it and the loop
   * vanishes at 29.88 (`--breast=<to>,<cap>` for a trial). Within 2 mm of the top the sections are 16 to 22 mm across over a dome less than
   * a millimetre high, and fitted to 29.5 mm they missed by 4.1 mm there; to 28 mm the wall is 105 numbers at 0.12 mm, and the cap from
   * 26 mm, 3.9 mm long, continues the dome with no rim on `fold.front`.
   */
  const [BREAST_TO, BREAST_CAP]: number[] = (
    process.argv
      .find((argument: string): boolean => argument.startsWith("--breast="))
      ?.slice(9) ?? "28,26"
  )
    .split(",")
    .map(Number);

  /**
   * A +Z point's station along the breast's course from its root, its distance from that course, mm, and its clock about the course,
   * radians: 0 up, a quarter turn to +Z.
   */
  function breastFrame(p: R.V): [number, number, number] {
    const d: R.V = [
      BREAST_TIP[0] - BREAST_ROOT[0],
      BREAST_TIP[1] - BREAST_ROOT[1],
      BREAST_TIP[2] - BREAST_ROOT[2],
    ];
    const length: number = Math.hypot(d[0], d[1], d[2]);
    const w: R.V = [d[0] / length, d[1] / length, d[2] / length];
    const q: R.V = [
      p[0] - BREAST_ROOT[0],
      p[1] - BREAST_ROOT[1],
      p[2] - BREAST_ROOT[2],
    ];
    const along: number = q[0] * w[0] + q[1] * w[1] + q[2] * w[2];
    const off: R.V = [
      q[0] - along * w[0],
      q[1] - along * w[1],
      q[2] - along * w[2],
    ];
    const up: R.V = [-w[1] * w[0], 1 - w[1] * w[1], -w[1] * w[2]];
    const side: R.V = [
      w[1] * up[2] - w[2] * up[1],
      w[2] * up[0] - w[0] * up[2],
      w[0] * up[1] - w[1] * up[0],
    ];
    const psi: number = Math.atan2(
      off[0] * side[0] + off[1] * side[1] + off[2] * side[2],
      off[0] * up[0] + off[1] * up[1] + off[2] * up[2],
    );
    return [
      along,
      Math.hypot(off[0], off[1], off[2]),
      psi < 0 ? psi + 2 * Math.PI : psi,
    ];
  }

  /** Half length of the shoulder's turn, mm. */
  const SHOULDER_HALF_MM: number = 65;


  /** How far proximal of the shoulder joint the arm's ISB course starts, mm, on the humerus's axis: past the armscye loop's most proximal point, 44 mm. */
  const ISB_PROXIMAL_MM: number = 60;

  /**
   * The arm's first station on its ISB course, mm, 36 mm proximal of the shoulder joint: the first whose closed section (`IPart.around`)
   * surrounds the course point by 10 mm or more (10.56 mm), read on the body's skin. At 20 mm and above it nothing lies on the arm's side.
   */
  const ARM_FIRST_MM: number = 24;

  /** Longest gap a part closed round its course bridges in the body's cut, mm: the neck's open seam, 175 mm across where the arm's planes pass it. */
  const NECK_BRIDGE_MM: number = 200;

  /** The least shoulder of a closure across an opening (`without`): the model's share bound (`AutoMovieHumanConicSection`'s `EDGE`). */
  const CLOSURE_LEAST: number = 0.03;

  /**
   * The least circumferential part of the skin's unit direction at which a kept skin's end still advances round its course
   * (`without`): the premise of `FamilyConicClosure.continued`, which refuses a part of 1e-9 or less; a hundredth, about half a
   * degree off the radius, keeps the continuation's rate of radius in phase under a hundred.
   */
  const ADVANCE_LEAST: number = 0.01;


  /**
   * The ear's box, mm: lateral of the sagittal plane the auricle leaves the skull at, and inside the auricle's extent fore and aft and in height,
   * read off `FamilyConicScan.ts ear`. Positive inside the box on either side of the head.
   */
  function ear(p: R.V): number {
    return Math.min(
      Math.abs(p[2]) - 77,
      p[0] + 10,
      26 - p[0],
      p[1] - 1538,
      1602 - p[1],
    );
  }

  /** The plate's course, halves, fitted stations and thickness (`--plate=<json>`, `--plate-halves`, `--plate-domain`, `--plate-thickness`). */
  const PLATE: R.V[] = JSON.parse(
    process.argv
      .find((a: string): boolean => a.startsWith("--plate="))
      ?.slice("--plate=".length) ?? "[[12,1538,80],[12,1604,80]]",
  );
  const PLATE_HALVES: number[] = JSON.parse(
    process.argv
      .find((a: string): boolean => a.startsWith("--plate-halves="))
      ?.slice("--plate-halves=".length) ?? "[]",
  );
  const PLATE_DOMAIN: number[] = (
    process.argv
      .find((a: string): boolean => a.startsWith("--plate-domain="))
      ?.slice("--plate-domain=".length) ?? "6,58"
  )
    .split(",")
    .map(Number);
  const PLATE_THICKNESS: number = Number(
    process.argv
      .find((a: string): boolean => a.startsWith("--plate-thickness="))
      ?.slice("--plate-thickness=".length) ?? 4,
  );
  /**
   * The plate's limb depth (`--plate-depth`). Four anchors: a lens is two ends and two faces, and with a median on each quarter the
   * medians ran into the lens's corners and wandered along its flat faces between stations, where the construction refused the chain
   * between them; four conics fit each lens alone to 0.03 to 0.1 mm mean.
   */
  const PLATE_DEPTH: number = Number(
    process.argv
      .find((a: string): boolean => a.startsWith("--plate-depth="))
      ?.slice("--plate-depth=".length) ?? 0,
  );
  /**
   * The plate read in the lens layout (`--plate-lens`, `AutoMovieHumanConicSection.lens`): its chart turned a further quarter turn, so the
   * lens's length lies along `v`, its faces' extremes on the median line where the course crosses it. On four free extremes the face's
   * extreme still wandered from end to end of the flat face between stations (bowed 1 mm), and the construction refused the chain there.
   */
  const PLATE_LENS: boolean = process.argv.includes("--plate-lens");
  /** How far short of the outermost skin the plate stops, under the helix's tube, mm (`--plate-rim`, `FamilyConicExcursion.plate`). */
  const PLATE_RIM: number = Number(
    process.argv
      .find((a: string): boolean => a.startsWith("--plate-rim="))
      ?.slice("--plate-rim=".length) ?? 3,
  );
  /** The plate's deepest floor, mm (`--plate-deepest`, `FamilyConicExcursion.plate`). */
  const PLATE_DEEPEST: number = Number(
    process.argv
      .find((a: string): boolean => a.startsWith("--plate-deepest="))
      ?.slice("--plate-deepest=".length) ?? 2 * PLATE_THICKNESS,
  );
  /**
   * The lobule's depth (`--plate-lobe=<deepest>,<to>,<from>`): up to station `to` the plate's floor may lie `deepest` mm inside its
   * cranial skin, falling smoothly to `PLATE_DEEPEST` at station `from`, so the plate is the whole lobule, whose lens has no hollows,
   * and no second family shares its cranial face (an earlobe of its own, merged on the plate, met it along that face and the merge's
   * walk was lost there).
   */
  const PLATE_LOBE: number[] | undefined = process.argv
    .find((a: string): boolean => a.startsWith("--plate-lobe="))
    ?.slice("--plate-lobe=".length)
    .split(",")
    .map(Number);
  /**
   * The floor over the auricle's top (`--plate-top=<deepest>,<from>,<to>`): from station `from` the plate's floor may lie only `deepest` mm
   * inside its cranial skin, reached at station `to` by the same smoothstep. There the antihelix and its crura are families of their own
   * merged on the plate, and the plate is the sheet under them: f1's sheet is 1.8 to 4.1 mm thick over the scapha (stations 46 to 64),
   * where the floor held at 8 mm let the lens's hull span the antihelix's fold (9 to 11 mm) and stand 9.5 to 10 mm thick.
   */
  const PLATE_TOP: number[] | undefined = process.argv
    .find((a: string): boolean => a.startsWith("--plate-top="))
    ?.slice("--plate-top=".length)
    .split(",")
    .map(Number);
  // The fall is the smoothstep `3 x^2 - 2 x^3` of the share `x` between the two stations, so the floor's slope along the course does not
  // jump at either end: a linear fall left a crease across the plate's face at each of its ends.
  const plateDeepest = (s: number): number => {
    const rise = (from: number, to: number): number => {
      const x: number = Math.min(1, Math.max(0, (s - from) / (to - from)));
      return x * x * (3 - 2 * x);
    };
    const lobe: number =
      PLATE_LOBE === undefined
        ? PLATE_DEEPEST
        : PLATE_LOBE[0]! +
          (PLATE_DEEPEST - PLATE_LOBE[0]!) *
            rise(PLATE_LOBE[1]!, PLATE_LOBE[2]!);
    return PLATE_TOP === undefined
      ? lobe
      : lobe + (PLATE_TOP[0]! - lobe) * rise(PLATE_TOP[1]!, PLATE_TOP[2]!);
  };
  /** The plate's roll (`--plate-roll=<station>:<radians>,...`), laid through its lenses' `principal` angles; absent, none. */
  const PLATE_ROLL: K.IStored["roll"] = ((
    text: string | undefined,
  ): K.IStored["roll"] => {
    if (text === undefined) return undefined;
    const pairs: number[][] = text
      .split(",")
      .map((pair: string): number[] => pair.split(":").map(Number));
    // In the lens layout the chart turns a further quarter turn, so the lens's length, read at these angles along `u`, lies along `v`.
    return {
      knots: pairs.map((pair: number[]): number => pair[0]!),
      values: pairs.map(
        (pair: number[]): number =>
          Math.round((pair[1]! + (PLATE_LENS ? Math.PI / 2 : 0)) * 1e4) / 1e4,
      ),
    };
  })(
    process.argv
      .find((a: string): boolean => a.startsWith("--plate-roll="))
      ?.slice("--plate-roll=".length),
  );

  /** The pinna's course (`--pinna=<json>`), through the root of each section, so its course point lies inside every section and its rays see the skin. */
  const PINNA: R.V[] = JSON.parse(
    process.argv
      .find((a: string): boolean => a.startsWith("--pinna="))
      ?.slice("--pinna=".length) ??
      "[[16,1540,70],[5,1560,69],[4,1575,70],[10,1590,73],[11,1604,75]]",
  );
  const PINNA_HALVES: number[] = JSON.parse(
    process.argv
      .find((a: string): boolean => a.startsWith("--pinna-halves="))
      ?.slice("--pinna-halves=".length) ?? "[4,4,4]",
  );
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
  const PINNA_DOMAIN: number[] = (
    process.argv
      .find((a: string): boolean => a.startsWith("--pinna-domain="))
      ?.slice("--pinna-domain=".length) ?? "6,58"
  )
    .split(",")
    .map(Number);
  const PINNA_GAP: number = Number(
    process.argv
      .find((a: string): boolean => a.startsWith("--pinna-gap="))
      ?.slice("--pinna-gap=".length) ?? 4,
  );
  const PINNA_DEPTH: number = Number(
    process.argv
      .find((a: string): boolean => a.startsWith("--pinna-depth="))
      ?.slice("--pinna-depth=".length) ?? 1,
  );
  /**
   * `--arm-grooves=<anchor indices>`: the arm fitted with a groove `[i, m, i]` after each listed anchor of `limb(1)`
   * (`FamilyConicSection.inflected`), for the hand end's dorsal valleys; with `--arm-skin` to the skin itself rather than its hull. A trial;
   * the stored arm uses neither.
   */
  const ARM_GROOVES: number[] = (
    process.argv
      .find((a: string): boolean => a.startsWith("--arm-grooves="))
      ?.slice("--arm-grooves=".length) ?? ""
  )
    .split(",")
    .filter((x: string): boolean => x.length > 0)
    .map(Number);
  /** `--arm-features=<anchor indices>`: the arm fitted with a groove of three feature anchors (`FamilyConicSection.featured`) after each listed anchor of `limb(1)`; a trial. */
  const ARM_FEATURES: number[] = (
    process.argv
      .find((a: string): boolean => a.startsWith("--arm-features="))
      ?.slice("--arm-features=".length) ?? ""
  )
    .split(",")
    .filter((x: string): boolean => x.length > 0)
    .map(Number);
  /**
   * `--skin-held`: log every observed section's worst skin vertex with its world point and how far inside each round's hold it lies, mm
   * (`IPart.rounds[].hold`, positive inside), event `family-body-skin-held`. Measurement only.
   */
  const SKIN_HELD: boolean = process.argv.includes("--skin-held");
  /** `--hand-features=<anchor indices>`, as `--arm-features` on the hand's own family, with `--hand-skin` fitted to the skin; a trial. */
  const HAND_FEATURES: number[] = (
    process.argv
      .find((a: string): boolean => a.startsWith("--hand-features="))
      ?.slice("--hand-features=".length) ?? ""
  )
    .split(",")
    .filter((x: string): boolean => x.length > 0)
    .map(Number);
  /** A `limb(1)` layout with a groove of three feature anchors, an inflection, a concave floor and an inflection, after each listed anchor. */
  const featureGrooves = (
    after: number[],
  ): { layout: C.ILayout; depth: number }[] => [
    {
      layout: C.featured(
        C.limb(1),
        after.map((anchor: number) => ({
          after: anchor,
          anchors: [
            {
              kind: "f" as const,
              feature: "inflection" as const,
              window: [0.15, 0.45] as [number, number],
            },
            {
              kind: "f" as const,
              feature: "concave" as const,
              window: [0.3, 0.7] as [number, number],
            },
            {
              kind: "f" as const,
              feature: "inflection" as const,
              window: [0.55, 0.85] as [number, number],
            },
          ],
        })),
      ),
      depth: 1,
    },
  ];
  const PINNA_GROOVES: number[] = (
    process.argv
      .find((a: string): boolean => a.startsWith("--pinna-grooves="))
      ?.slice("--pinna-grooves=".length) ?? ""
  )
    .split(",")
    .filter((x: string): boolean => x.length > 0)
    .map(Number);

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
    const f: number = Math.min(
      1,
      Math.max(0, (p[1] - 1543) / NOSE_FLOOR_MM[1]),
    );
    return Math.min(
      nose(p),
      p[0] -
        (113 +
          9 * t * t * (3 - 2 * t) +
          NOSE_FLOOR_MM[0] * (1 - f * f * (3 - 2 * f))),
    );
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
    return Math.min(
      ear(p),
      -Math.min(p[0] - 2, 26 - p[0], p[1] - 1554, 1572 - p[1]),
    );
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
  const SIDE_NET: number[] = (
    process.argv
      .find((a: string): boolean => a.startsWith("--side-net="))
      ?.slice(11) ?? "19,41,3,20,2,3,4,0.25,1576"
  )
    .split(",")
    .map(Number);

  /**
   * `--nose-grooves=<anchors>`: the nose fitted to its skin (`IPart.skin`, outermost crossing) with a groove of two inflection lines after
   * each listed anchor of the depth-1 limb layout (`inflected`), its nostrils' pits left out so the cutters keep them, and no cast nets.
   */
  /** `--feature-knot=<mm>`: a family with feature lines starts from knots this far apart; absent, from the domain's ends and middle. */
  const FEATURE_KNOT_MM: number | undefined = ((
    value: string | undefined,
  ): number | undefined => (value === undefined ? undefined : Number(value)))(
    process.argv
      .find((a: string): boolean => a.startsWith("--feature-knot="))
      ?.slice(15),
  );
  /** A feature's depth, mm, past which it counts as present (`--feature-knots`). */
  const FEATURE_DEPTH_MM: number = 0.3;
  /** Sections in the running median a feature's depth is read through (`--feature-knots`): 5, two either side, at 1 mm steps. */
  const FEATURE_MEDIAN: number = 5;

  const NOSE_FEATURES: boolean = process.argv.includes("--nose-features");
  const NOSE_VERTICAL: boolean = process.argv.includes("--nose-vertical");
  const NOSE_DEPTH: number = Number(
    process.argv
      .find((a: string): boolean => a.startsWith("--nose-depth="))
      ?.slice(13) ?? 1,
  );
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
  const NOSE_MARGIN: number = Number(
    process.argv
      .find((a: string): boolean => a.startsWith("--nose-margin="))
      ?.slice(14) ?? 0.02,
  );
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
  const NOSE_GROOVES: number[] | undefined = process.argv
    .find((a: string): boolean => a.startsWith("--nose-grooves="))
    ?.slice(15)
    .split(",")
    .filter((x: string): boolean => x.length > 0)
    .map(Number);

  /** Where the nose's band lands on it at a phase, mm from its first station (`AutoMovieHumanF1.NOSE_RAILS_MM`). */
  const NOSE_RAIL: (phi: number) => number = AutoMovieNaturalSpline.periodic(
    AutoMovieHumanF1.NOSE_RAILS_MM,
  );

  /**
   * `--mouth-net=<rows>,<columns>`: the mouth's net's control points (`trunk.mouth`); absent, 21 by 37, about 1.8 mm a row and 2.8 mm a
   * column. At 27 by 67, 1.5 mm each way, it fitted the sections seen by its fit to 0.53 mm and the withheld ones to 2.11: it followed the
   * reference's facets, and sampled along a level line every 0.6 mm the lips turned by 0 to 5 degrees and back between samples, a ripple
   * that flat shading drew as blocks of light and dark (mouth.front px 200..720 x 330..640). At 21 by 37 the turns run smoothly (1.1 mm
   * fitted, 2.07 withheld, the slit between the lips); at 15 by 37 the slit stood wider in profile.
   */
  const MOUTH_NET: [number, number] = (process.argv
    .find((a: string): boolean => a.startsWith("--mouth-net="))
    ?.slice(12)
    .split(",")
    .map(Number) as [number, number] | undefined) ?? [21, 37];

  /** `--floor-net=<rows>,<columns>`: the nose's floor net's control points; absent, 15 by 17 (about 1.3 mm along by 1.8 mm round). */
  const FLOOR_NET: [number, number] = (process.argv
    .find((a: string): boolean => a.startsWith("--floor-net="))
    ?.slice(12)
    .split(",")
    .map(Number) as [number, number] | undefined) ?? [15, 17];

  /**
   * A nostril's pit and its blended rim, mm: 10 inside, -10 outside. A level plane cuts the +Z pit at 1,552 mm in a loop from 117.6 to
   * 127.7 mm forward and 3.0 to 11.1 mm across (`FamilyConicScan.ts nostril`), and the nostril's course leans 8 mm back over 20 mm up
   * from [127.1, 1540.4] (`AutoMovieHumanF1Joints.nostrilRoot`). The region is that loop's ellipse, wider all round by the rim's blend
   * (`AutoMovieHumanF1.ts`, `NOSTRIL_RIM_MM`, 1.5 mm), carried along the course from 1,541 mm up: what the nostril's cut takes.
   */
  function nostrilPit(p: R.V): number {
    const forward: number = 127.1 - (8 * (p[1] - 1540.4)) / 20 + 0.2;
    const inside: boolean =
      p[1] > 1541 &&
      ((p[0] - forward) / 6.55) ** 2 + ((Math.abs(p[2]) - 7.05) / 5.55) ** 2 <
        1;
    return inside ? 10 : -10;
  }

  /**
   * The chin's cone, mm: about the trunk's course, from the throat's radius at the height the chin starts, widening by `slope` for each
   * millimetre up, which brings it to the fold under the lower lip at 1,503 mm. On the median line the skin goes forward from 58 to 107 mm
   * within 4 mm of height there, read off `FamilyConicBody.ts trunk --casts`: a level section jumps by the chin's whole depth, and the skin
   * under the chin lies between two sections. What stands outside the cone is left out of the trunk's sections, whose front then grows by
   * the slope, and is carried by a relief cast across the cone (`casts`).
   */
  const CHIN: { y: number; radius: number; slope: number } = {
    y: 1476,
    radius: 58,
    slope: 1.9,
  };

  /**
   * A digit's pad: how far from the line of its last segment the pad's far point is looked for, mm, which keeps the search inside the digit
   * and off its neighbours, and how far past that point the course runs on, mm.
   */
  const PAD: { reach: number; past: number } = { reach: 6, past: 4 };

  /** The far point of a digit's pad: the skin's vertex farthest along the line from `a` through `b`, among those within `PAD.reach` of it. */
  function pad(skin: R.ISource["body"], a: R.V, b: R.V): R.V {
    const length: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const d: R.V = [
      (b[0] - a[0]) / length,
      (b[1] - a[1]) / length,
      (b[2] - a[2]) / length,
    ];
    let best: R.V = b;
    let far: number = 0;
    for (let i: number = 0; i + 2 < skin.positions.length; i += 3) {
      const q: R.V = [
        skin.positions[i]! - b[0],
        skin.positions[i + 1]! - b[1],
        skin.positions[i + 2]! - b[2],
      ];
      const along: number = q[0] * d[0] + q[1] * d[1] + q[2] * d[2];
      if (
        along <= far ||
        Math.hypot(
          q[0] - along * d[0],
          q[1] - along * d[1],
          q[2] - along * d[2],
        ) > PAD.reach
      )
        continue;
      far = along;
      best = [
        Math.round(skin.positions[i]! * 100) / 100,
        Math.round(skin.positions[i + 1]! * 100) / 100,
        Math.round(skin.positions[i + 2]! * 100) / 100,
      ];
    }
    return best;
  }

  /**
   * Least area of a connected piece of the reference mesh for a cast to land on it, mm2. The head's skin and each eyeball are pieces of
   * their own; so are the eyelashes and the brows' hairs, which are no skin and are not modelled, and a cast that landed on them stood the
   * upper lids out as shelves. An eyeball is 2,800 mm2; a lash strip a few hundred.
   */
  const SOLID_MM2: number = 1500;

  /** For each triangle of a casting mesh, 1 when its piece (by shared vertices) is at least `SOLID_MM2` in area. */
  function solids(mesh: R.ISource["body"]): Uint8Array {
    const count: number = mesh.positions.length / 3;
    const parent: Int32Array = new Int32Array(count).map(
      (_: number, i: number): number => i,
    );
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
    const at = (v: number): R.V => [
      mesh.positions[v * 3]!,
      mesh.positions[v * 3 + 1]!,
      mesh.positions[v * 3 + 2]!,
    ];
    for (let t: number = 0; t + 2 < mesh.indices.length; t += 3) {
      const [a, b, c]: R.V[] = [0, 1, 2].map(
        (k: number): R.V => at(mesh.indices[t + k]!),
      );
      const u: R.V = [b![0] - a![0], b![1] - a![1], b![2] - a![2]];
      const w: R.V = [c![0] - a![0], c![1] - a![1], c![2] - a![2]];
      const root: number = find(mesh.indices[t]!);
      area.set(
        root,
        (area.get(root) ?? 0) +
          Math.hypot(
            u[1] * w[2] - u[2] * w[1],
            u[2] * w[0] - u[0] * w[2],
            u[0] * w[1] - u[1] * w[0],
          ) /
            2,
      );
    }
    const out: Uint8Array = new Uint8Array(mesh.indices.length / 3);
    for (let t: number = 0; t + 2 < mesh.indices.length; t += 3)
      out[t / 3] = (area.get(find(mesh.indices[t]!)) ?? 0) >= SOLID_MM2 ? 1 : 0;
    log0("family-body-solids", {
      pieces: area.size,
      kept: [...area.values()]
        .filter((a: number): boolean => a >= SOLID_MM2)
        .map((a: number): number => Math.round(a)),
    });
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
  const AXILLA: R.V[] = [
    [16, 1287, 147.5],
    [-25, 1262, 150.5],
    [-45, 1269.5, 151],
    [-56, 1283, 151.5],
  ];

  /** The slit cutter's fitted stations, mm along its course (`--axilla-domain=<from>,<to>`): x 16 is station 0, the crease about 48, x -62 about 97. */
  const AXILLA_DOMAIN: [number, number] = (
    process.argv
      .find((a: string): boolean => a.startsWith("--axilla-domain="))
      ?.slice("--axilla-domain=".length) ?? "25,78"
  )
    .split(",")
    .map(Number) as [number, number];

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
    return (
      result.fault !== null &&
      result.fault.startsWith(NATIVE_REFUSAL) &&
      result.values.length > 0
    );
  }

  /** Length of the station bands `--decompose` tabulates, mm. */
  const DECOMPOSE_BAND_MM: number = 5;

  /**
   * How far under the arm band the slit cutter's floor stands, `[x, mm]`: 3 mm under the crease, deepening behind x -56, where the band
   * rises over the back of the shoulder (1,294 mm at x -60 and 1,308 at -65, `AXILLA_BAND`) while the slit's apex stays at 1,299.
   */
  const AXILLA_FLOOR: [number, number][] = [
    [-56, 3],
    [-62, 8],
    [-68, 12],
  ];

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
  const VAULT: R.V[] = [
    [16, 1290, 149.5],
    [-1, 1276, 148.5],
  ];

  /**
   * The slit cutter's layouts by `--axilla-layout`: `groove` (the default), the 8-conic limb with a groove after its apex, the `u` extreme
   * whose arm-side flank is concave; `limb1` and `limb2`, the plain 8- and 16-conic limbs; `grooves`, a groove after both `u` extremes.
   */
  const AXILLA_LAYOUTS: Record<string, { layout: C.ILayout; depth: number }[]> =
    {
      groove: [{ layout: C.inflected(1, [0]), depth: 1 }],
      grooves: [{ layout: C.inflected(1, [0, 4]), depth: 1 }],
      limb1: [{ layout: C.limb(1), depth: 1 }],
      limb2: [
        { layout: C.limb(1), depth: 1 },
        { layout: C.limb(2), depth: 2 },
      ],
      // The groove after the apex as three feature anchors (`FamilyConicSection.featured`), which fade onto a smooth stretch over the vault in
      // front of the crease, where no section bends inward and an `i` would force an S.
      featured: [
        {
          layout: C.featured(C.limb(1), [
            {
              after: 0,
              anchors: [
                { kind: "f", feature: "inflection", window: [0.15, 0.55] },
                { kind: "f", feature: "concave", window: [0.3, 0.75] },
                { kind: "f", feature: "inflection", window: [0.5, 0.9] },
              ],
            },
          ]),
          depth: 1,
        },
      ],
    };

  /**
   * The generated arm band's lowest height in planes x = const, `[x, y]` mm, read off the figure's mesh with every band column at its own
   * ribbon scale (`bandlevel`, a scratch probe of the dumped body): 1,261 mm under the crease, rising to 1,289 at x 20 and to 1,308 at -65.
   */
  const AXILLA_BAND: [number, number][] = [
    [20, 1288.5],
    [15, 1283.6],
    [10, 1279.6],
    [5, 1274.5],
    [0, 1270.8],
    [-5, 1267.7],
    [-10, 1265.1],
    [-15, 1262.8],
    [-20, 1261.6],
    [-25, 1261.4],
    [-30, 1261.7],
    [-35, 1263.2],
    [-40, 1265.7],
    [-45, 1269],
    [-50, 1274.4],
    [-55, 1281.5],
    [-60, 1294.3],
    [-65, 1307.8],
  ];

  /** `--chinless`: the trunk's sections keep the chin and no relief is cast for it, as in the walls stored before the cone. */
  const CHINLESS: boolean = process.argv.includes("--chinless");

  /**
   * Least distance between two of the trunk's knots above the jaw, mm (`--face-gap=<mm>`). The face's hull steps at the brow, the eyes, the
   * nose and the mouth, and knots that follow each step streak the wall across the face; the face's form is its nets'.
   */
  const FACE_GAP_MM: number = Number(
    process.argv
      .find((argument: string): boolean => argument.startsWith("--face-gap="))
      ?.slice("--face-gap=".length) ?? 8,
  );

  /** `--bare`: the wall alone, with no relief of any kind fitted on it. */
  const BARE: boolean = process.argv.includes("--bare");

  /** How far a point stands outside the chin's cone, mm; negative inside it, behind the course or below its start. */
  function chin(p: R.V): number {
    return CHINLESS || p[0] <= 0 || p[1] < CHIN.y
      ? -1
      : (Math.hypot(p[0], p[2]) - CHIN.radius - CHIN.slope * (p[1] - CHIN.y)) /
          Math.hypot(1, CHIN.slope);
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

    /**
     * The net rests on the wall where no ray lands: a point no ray lands from is observed at zero height, and the seen skin's edge hands
     * over as a window's edge does (`fade`), each landing taking the share of its height that rises from none beside a missed point to
     * all of it one control spacing away. A relief carries only skin its cast sees, and its target is built from C2 functions (lofting.md,
     * Composition before lofting). Without it the fit's fairness alone, a penalty on second differences, carries the slope of the seen
     * skin on across an unseen stretch: the shoulder's net, which sees a fifth of its window (1,033 of 5,225 rays, skin facing up within
     * 37 degrees), stored controls of +4.47 and -2.56 mm side by side at 620 to 625 mm and 1.45 to 1.49 rad, where no ray lands and the
     * heights seen round it run from -0.9 to 3.1 mm: the bump on the front of each shoulder (`shoulder.front`). Rested at zero with the
     * seen heights whole up to their edge, 2.6 to 3.1 mm there, the net stood a step along that edge instead (+3.59 beside -2.13 mm).
     */
    rest?: boolean;
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

    /**
     * How far inside the held region the hold becomes whole, mm, or `span` for the control spacing of the net that reads it (C4a); absent, the
     * hold is whole right up to its edge. Held at zero inside and asked for the whole depth just outside, the net turned within one row
     * along the edge: `trunk.head` drew creases of 41 to 44 deg/mm round the ear's bowl (lofting.md: targets from C2 functions).
     */
    holdWidth?: number | "span";
  }

  /** One part to fit. */
  export interface IPart {
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

    /**
     * With `opening`, for a child whose field extends past its root rail (construction.md, Ports): across the opening each section closes
     * round its course point instead of across the opening's chord, by two conic arcs through the kept skin's ends and a far point square
     * to the radius at the opening's middle direction, at this share of the kept skin's mean radius (raised by 0.05 up to 0.25 more until
     * both arcs' corners lie ahead; where none does, across the chord as without it). Near its root a limb's course runs inside the parent, and the skin on its side of the root is an arc
     * beside the course: closed across its chord, the section left the course point up to 24 mm outside (f1's arm on the ISB course).
     */
    around?: number;

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
     * Skin a neighbour owns, mm, positive inside, that the part's nets do not observe even where its `clip` lets the sections keep it: a
     * neighbour on a port whose own sections carry that skin, as the nose's box is, whose floor fades for the sections alone (`noseCut`).
     */
    unseen?: (p: R.V) => number;

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

    /** The fairing cutoff its sections are converted at to seed the fit, mm (`FamilyConicFit.IRow.fairMm`); set by `--bridge`. */
    fairMm?: number;

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
     * hands its first and last stations over, mm. With `graze` a cast that meets the skin within that many degrees of running along it is
     * left unobserved (`FamilyConicRelief.IWindow.graze`, lofting.md: a height along a ray that runs along the skin measures where an edge-on
     * face begins, not how deep the skin lies).
     */
    rounds?: { name: string; stations: [number, number]; rows: number; columns: number; reach: number; hold?: (p: R.V) => number; fade?: [number, number]; graze?: number; window?: { phases: [number, number]; fade: [number, number]; fadePhase: [number, number] } }[];
  }

  /** Explicit owner and predeclared fit/hold pairs for an entire composed end. */
  function groupRequest(args: readonly string[]) {
    const named = args.filter((arg): boolean => arg.startsWith("--joint-group="));
    if (named.length === 0) return undefined;
    const outputs = args.filter((arg): boolean => arg.startsWith("--out="));
    const modes: string[] = args.filter((arg): boolean => arg === "--observe-only");
    if (named.length !== 1 || outputs.length !== 1 || modes.length > 1 || named[0] === "--joint-group=" ||
        args.some((arg): boolean => arg !== "--observe-only" && arg !== "--reproduce" && arg !== "--emit" && !arg.startsWith("--joint-group=") && !arg.startsWith("--member=") && !arg.startsWith("--out=") && !arg.startsWith("--readings=")))
      throw new Error("a grouped fit needs one actual composer, explicit members and one fresh output");
    const members = new Map<string, { to: number; mark: number }>();
    for (const option of args.filter((arg): boolean => arg.startsWith("--member="))) {
      const [name, end, keep, ...extra] = option.slice("--member=".length).split("@");
      const to = Number(end), mark = Number(keep);
      if (extra.length !== 0 || !name || !end || !keep || !Number.isFinite(to) || !Number.isFinite(mark) ||
          !(to >= mark) || members.has(name)) throw new Error("a group member needs unique name@measurement-end@protected-station");
      members.set(name, { to, mark });
    }
    if (members.size === 0) throw new Error("a grouped fit requires its complete authored stock list");
    return { name: named[0]!.slice("--joint-group=".length), out: outputs[0]!.slice("--out=".length), members, observeOnly: modes.length === 1 };
  }

  interface IGroupMember {
    family: K.IStored;
    tail: K.ITailFit;
    observed: F.IRow[];
    kept: ReadonlyMap<number, IMeasuredCut>;
    axis: IAutoMovieViewAxis.IAxis;
    whole: (station: number) => boolean;
    outside?: (p: R.V) => number;
    margin?: number;
    fault?: ReturnType<typeof F.prepareGroupMember>["fault"];
    raw?: ReturnType<typeof F.prepareGroupMember>["raw"];
  }

  /** Read the independent retained parent skin on fixed world sections within the original terminal material span. */
  function endParent(plan: ReturnType<typeof FamilyConicDivide.composition>, original: ReturnType<typeof R.prepare>, envelope: ReturnType<typeof rootEnvelope>) {
    if (envelope.parentRefusal === null) return undefined;
    const face = plan.owner.hostFace;
    const family = plan.figure.reference(plan.originalOf(face));
    const law = K.endMaterial(family, envelope.station);
    const grid = [law.left, envelope.station];
    for (let s = law.left + STEP_MM; s < envelope.station; s += STEP_MM) grid.splice(-1, 0, s);
    const held = grid.slice(1).map((s, i): number => (s + grid[i]!) / 2);
    const sample = (s: number, terminal: boolean) => {
      const frame = envelope.host.axis.at(s);
      const pieces = original.chains(frame).filter((p): boolean => p.closed && winding(p.points, [0, 0]) === 1);
      if (pieces.length !== 1) throw new Error(face + " has no single observed retained parent wall at " + s + " mm");
      const point = (p: C.P): R.V => V.add(frame.origin, V.add(V.scale(frame.u, p[0]), V.scale(frame.v, p[1])));
      const chart = (p: R.V): C.P => { const q = V.sub(p, frame.origin); return [V.dot(q, frame.u), V.dot(q, frame.v)]; };
      const observed = envelope.authored === undefined ? pieces[0]!.points :
        authoredEnvelope(pieces[0]!.points, [p => point(p)[2]], 1, point, chart).points;
      const ring = K.measuredRing(observed, pieces[0]!.closed);
      if (typeof ring === "string") throw new Error(face + " at " + s + " mm: " + ring);
      const witnesses = K.parentWitnesses(ring, frame,
        envelope.authored === undefined ? undefined : (a, b): boolean => a[2] + b[2] > 0);
      return { s, terminal, ring, witnesses };
    };
    return { face, family, law, training: grid.slice(1).map((s) => sample(s, s === envelope.station)), held: held.map((s) => sample(s, false)) };
  }

  /** Wrap the existing phase owner in bounded progress without reevaluating its geometry. */
  function groupPhase<T>(log: (event: string, detail: object) => void, owner: string, phase: string, run: () => T): T {
    const started: number = performance.now();
    log("family-body-group-phase", { owner, phase, state: "start" });
    let completed: boolean = false;
    try {
      const value: T = run();
      completed = true;
      return value;
    } finally {
      log("family-body-group-phase", { owner, phase, state: completed ? "returned" : "threw",
        phaseMs: Math.round(performance.now() - started) });
    }
  }

  /** Compare the registered plane to the same actual engine cut used by the eventual fit. */
  function observeTerminal(plan: ReturnType<typeof FamilyConicDivide.composition>, envelope: ReturnType<typeof rootEnvelope>) {
    const owner = plan.owner;
    const plane = AutoMovieConstructionSplitCompose.plane(owner.compose!.plane, envelope.basis);
    if (plane === null) throw new Error("the original group has no terminal plane");
    const cuts = owner.children.map((entry) => {
      try {
        const into: 1 | -1 = entry.partEnd === "top" ? -1 : 1;
        const face = endFace(plan.source(entry.partFace), into === -1, into);
        const cut = AutoMovieConstructionSplitCompose.section(plane,
          { ...face, into, name: entry.partFace, rail: AutoMovieConstructionViews.SCALE * entry.rail }, owner.count);
        if (typeof cut === "string") return { name: entry.partFace, refusal: cut } as const;
        return { name: entry.partFace, cut, envelope: cut.cut.reach } as const;
      } catch (error: unknown) {
        return { name: entry.partFace, refusal: error instanceof Error ? error.message : String(error) } as const;
      }
    });
    const prepared: IAutoMovieConstructionSplitCompose.ISection[] = cuts.flatMap((row) => "cut" in row ? [row.cut!] : []);
    const actual = () => {
      if (prepared.length !== owner.children.length) return { refusal: "one or more original child cuts were refused" };
      try {
        const top: boolean = owner.hostEnd === "top";
        const host = endFace(envelope.host, top, top ? 1 : -1);
        const derived: ReturnType<typeof composeGroup> = composeGroup(owner, host, prepared);
        return typeof derived === "string" ? { refusal: derived } : terminalIncidence(plane, host, prepared, derived, owner.count);
      } catch (error: unknown) {
        return { refusal: error instanceof Error ? error.message : String(error) };
      }
    };
    return { cuts: cuts.map((row) => "cut" in row ? { name: row.name, range: row.envelope, refusal: null } : row), actual: actual() };
  }

  /** Inspect actual source regularity independently of the registered contour and keep the two sorts of forks distinct. */
  function terminalIncidence(
    plane: IAutoMovieConstructionSkinCut.IPlane,
    host: ReturnType<typeof endFace>,
    prepared: readonly IAutoMovieConstructionSplitCompose.ISection[],
    derived: IAutoMovieConstructionSplitCompose.IDerived,
    count: number,
  ) {
    const turn: number = 2 * Math.PI;
    const chart = (point: R.V): C.P => {
      const delta: R.V = V.sub(point, plane.point);
      return [V.dot(delta, host.basis.x), V.dot(delta, host.basis.y)];
    };
    const sections = prepared.map((row) => {
      const polygon: C.P[] = [];
      let leastStationSlope: number = Infinity, leastTangent: number = Infinity, offPlane: number = 0;
      for (let k: number = 0; k < 2 * count; ++k) {
        const phase: number = turn * k / (2 * count);
        const [s]: [number, number, number] = row.cut.at(phase);
        const cut = row.section.at(phase);
        polygon.push(chart(cut.point));
        leastStationSlope = Math.min(leastStationSlope, row.child.into * V.dot(plane.normal, row.child.surface.jet(s, phase).u));
        leastTangent = Math.min(leastTangent, V.norm(cut.first));
        offPlane = Math.max(offPlane, Math.abs(V.dot(plane.normal, V.sub(cut.point, plane.point))));
      }
      if (!(leastStationSlope > 0 && leastTangent > 0 && offPlane <= AutoMovieSolidSharedCurve.ROUNDING * (1 + V.norm(plane.point))))
        throw new Error(row.child.name + " terminal cut lost actual transverse station advance, regularity or plane incidence");
      return { name: row.child.name, leastStationSlope, leastTangent, offPlane, polygon };
    });

    // The interleaved source polygons give an independent bounded check on unrelated children.
    const nonNeighbours: { first: string; second: string }[] = [];
    const sign = orientAutoMovieSolidChart;
    const edgesMeet = (a: C.P, b: C.P, c: C.P, d: C.P): boolean => {
      for (const k of [0, 1] as const)
        if (Math.max(a[k], b[k]) < Math.min(c[k], d[k]) || Math.max(c[k], d[k]) < Math.min(a[k], b[k])) return false;
      return sign(a, b, c) * sign(a, b, d) <= 0 && sign(c, d, a) * sign(c, d, b) <= 0;
    };
    for (const [i, a] of sections.entries())
      for (let j: number = i + 2; j < sections.length; ++j) {
        const b = sections[j]!;
        if (winding(a.polygon, b.polygon[0]!) !== 0 || winding(b.polygon, a.polygon[0]!) !== 0 ||
            a.polygon.some((p, k): boolean => b.polygon.some((q, l): boolean =>
              edgesMeet(p, a.polygon[(k + 1) % a.polygon.length]!, q, b.polygon[(l + 1) % b.polygon.length]!))))
          throw new Error(a.name + " and " + b.name + " have non-neighbour overlap on the interleaved actual cuts");
        nonNeighbours.push({ first: a.name, second: b.name });
      }
    const seams = derived.composition.seams.map((seam, i: number) => {
      const crossings: number[] = seam.forks.map((fork): number => V.dot(plane.normal, V.cross(
        prepared[i]!.section.at(fork.phases[0]).first,
        prepared[i + 1]!.section.at(fork.phases[1]).first,
      )));
      if (!(Math.sign(crossings[0]!) * Math.sign(crossings[1]!) < 0))
        throw new Error("adjacent sections " + i + " and " + (i + 1) + " do not cross in opposite regular directions");
      const parent = derived.seams[i]!.map((phase: number) => ({
        phase, station: host.station, point: host.surface.jet(host.station, phase).p,
      }));
      return { children: seam.forks, parent, crossings, valley: derived.valleys[i]! };
    });
    return { scope: "actual engine crossings and interleaved source polygon observations",
      sections: sections.map(({ polygon, ...receipt }) => receipt), seams, nonNeighbours,
      hostDistance: derived.host, railRanges: derived.cuts.map((cut) => cut.reach) };
  }

  /** Capture all measured authored stock before one physical group solve; twins have no independent field vector. */
  function collectGroup(
    owner: IAutoMovieConstructionSplit,
    observations: ReadonlyMap<string, IGroupMember>,
    originalOf: (face: string) => string,
    parent: ReturnType<typeof endParent>,
  ) {
    const members = new Map<string, IGroupMember>();
    const children: { face: string; stock: string; band: string }[] = [];
    for (const entry of owner.children) {
      const name: string = originalOf(entry.partFace);
      const row = observations.get(name);
      if (row === undefined)
        throw new Error(owner.name + " lacks the independently measured authored stock " + name);
      if (!members.has(name)) {
        if (row.family.name !== name || row.observed.some(({ s }): boolean => s >= row.tail.mark))
          throw new Error(owner.name + " has mismatched stock identity or training across the protected tail");
        members.set(name, row);
      }
      children.push({ face: entry.partFace, stock: name, band: entry.band });
    }
    const offsets = new Map<string, number>();
    const vector: number[] = [];
    for (const [name, member] of members) {
      offsets.set(name, vector.length);
      for (const field of member.tail.initial)
        vector.push(...member.tail.free.map((index: number): number => field[index]!));
    }
    const parentOffset = vector.length;
    if (parent !== undefined) vector.push(...parent.family.values.map((): number => 0));
    const stock = (candidate: readonly number[], name: string): K.IStored => {
      const member: IGroupMember | undefined = members.get(name);
      if (member !== undefined) {
        const n: number = member.tail.free.length;
        const base: number = offsets.get(name)!;
        const values: number[][] = member.tail.initial.map((_, f: number): number[] =>
          member.tail.expand(f, candidate.slice(base + f * n, base + (f + 1) * n)));
        const family: K.IStored = { ...member.family, knots: member.tail.knots, values };
        const fault: string | null = member.tail.check(family);
        if (fault !== null) throw new Error(name + ": " + fault);
        return family;
      }
      if (parent === undefined || parent.family.name !== name)
        throw new Error("the coupled material vector has no stock " + name);
      const family: K.IStored = parent.law.expand(candidate.slice(parentOffset, parentOffset + parent.family.values.length));
      const fault: string | null = parent.law.check(family);
      if (fault !== null) throw new Error(fault);
      return family;
    };
    const names: string[] = [...members.keys()];
    if (parent !== undefined) names.push(parent.family.name);
    const expand = (candidate: readonly number[]): Map<string, K.IStored> => new Map(
      names.map((name: string): [string, K.IStored] => [name, stock(candidate, name)]),
    );
    return { owner, members, children, offsets, vector, stock, expand, parent };
  }

  /** A composed end's own faces: its host and its children. */
  function groupFaces(owner: IAutoMovieConstructionSplit): Set<string> {
    return new Set([owner.hostFace, ...owner.children.map((entry): string => entry.partFace)]);
  }

  /** Declare the varied stock once. The original declaration's host belongs to the same neutral stock if it is fixed. */
  function groupSources(values: ReadonlyMap<string, K.IStored>, plan: ReturnType<typeof FamilyConicDivide.composition>) {
    const figure = [...values.values()].reduce((placed, family) => AutoMovieHumanF1.replaceNeutralOriginal(placed, family), plan.figure);
    const name: string = plan.owner.name;
    const host: string = plan.owner.hostFace;
    const faces: Set<string> = groupFaces(plan.owner);
    const fixedHost: boolean = !values.has(plan.originalOf(host));
    if (fixedHost) faces.delete(host);
    const declared = AutoMovieHumanF1.constructionOf(figure, faces);
    const visit = (node: IAutoMovieConstructionNode): IAutoMovieConstructionSplit | undefined => {
      if (node.name === name && node.type === "split") return node;
      if ("host" in node) {
        const found = visit(node.host);
        if (found !== undefined) return found;
      }
      if ("part" in node) return visit(node.part);
      if (node.type === "split") for (const entry of node.children) {
        const found = visit(entry.part);
        if (found !== undefined) return found;
      }
      return undefined;
    };
    const owner = visit(declared.root);
    if (owner === undefined || owner.compose === undefined) throw new Error("missing registered composed owner " + name);
    const view = (face: string): IAutoMovieViewPart => {
      if (face === host && fixedHost) return plan.source(host);
      const source = declared.sources.get(face);
      if (source === undefined) throw new Error("missing source chart " + face);
      return source;
    };
    const prepareCharts = (requested: readonly string[]) => {
      const charts = new Map(requested.map((face) => {
        const part: IAutoMovieViewPart = view(face);
        return [face, { view: part, source: AutoMovieLoftViewFullSource.create(part) }] as const;
      }));
      return (face: string) => {
        const chart = charts.get(face);
        if (chart === undefined) throw new Error("missing prepared source chart " + face);
        return chart;
      };
    };
    return { figure, owner, view, prepareCharts };
  }

  /** Registered host stations induce material sections on the child's unchanged first straight. */
  function proximalSections(
    host: IAutoMovieViewPart,
    plane: IAutoMovieConstructionSplitCompose.IBasis,
    child: K.IStored,
    exposed: number,
  ): { parentStation: number; station: number }[] | string {
    const p = child.centres[0]!, q = child.centres[1]!;
    if (p === undefined || q === undefined) return "the source has no first course segment";
    const tangent = V.unit(V.sub(q, p));
    if (tangent === null) return "the first physical course segment has zero length";
    const speed = V.dot(tangent, plane.z);
    if (!(speed > 0)) return "the child's first course does not advance through the positive host plane";
    const base = V.dot(V.sub(p, plane.origin), plane.z);
    const straight = AutoMovieViewAxis.runs(child.centres, child.halves);
    if (typeof straight === "string") return straight;
    const rows = host.stations.flatMap((parentStation: number) => {
      const height = V.dot(V.sub(host.axis.at(parentStation).origin, plane.origin), plane.z);
      const station = (height - base) / speed;
      return height < 0 && station < exposed && station <= straight[0]!.end
        ? [{ parentStation, station }] : [];
    });
    return rows.sort((a, b): number => b.station - a.station);
  }

  /** Admit a true hidden source ring on the first unrotated material run, checked separately from observations. */
  function hiddenPrefix(
    name: string, member: IGroupMember, plan: ReturnType<typeof FamilyConicDivide.composition>,
    envelope: ReturnType<typeof rootEnvelope>,
  ): { tail: K.ITailFit; required: { face: string; partition: number; edge: number; t: number; s: number; phi: number }[];
    physical: [number, number, number]; similar: ReturnType<typeof F.similarStart> } {
    const plane = envelope.basis;
    const choices = proximalSections(envelope.host, plane, member.family, member.tail.knots[0]!);
    if (typeof choices === "string") throw new Error(choices);
    const lower = Math.min(member.tail.knots[0]!, ...choices.map((row): number => row.station));
    const required: { face: string; partition: number; edge: number; t: number; s: number; phi: number }[] = [];
    for (const [i, pair] of envelope.forks.entries()) {
      for (const node of plan.owner.children.slice(i, i + 2)) {
        if (plan.originalOf(node.partFace) !== name) continue;
        if (envelope.authored !== undefined && node.partFace !== name) continue;
        const view = plan.source(node.partFace);
        const family = node.partFace === name ? member.family : AutoMovieHumanConicLoft.mirror(member.family, node.partFace);
        const at = member.tail.mark;
        const shift = V.sub(view.axis.at(at).origin, AutoMovieHumanConicLoft.axis(family).at(at).origin);
        const address = AutoMovieHumanJoinLoop.certifiedAddresses(view, [lower, member.tail.mark], family, shift);
        for (const fork of pair) {
          const rows = address(envelope.world(fork.point));
          if (rows.length !== 1 || !(rows[0]![0] < member.tail.mark))
            throw new Error(node.partFace + " measured fork edge " + fork.edge + " has " + JSON.stringify(rows) +
              " in the physically supported material chart " + JSON.stringify([lower, member.tail.mark]));
          required.push({ face: node.partFace, partition: i, edge: fork.edge, t: fork.t, s: rows[0]![0], phi: rows[0]![1] });
        }
      }
    }
    if (required.length === 0) throw new Error(name + " has no registered adjacent fork");
    const stations = [...new Set([member.tail.knots[0]!, ...choices.map((row): number => row.station)])];
    const missed: string[] = [];
    for (const station of stations) {
      const fork = K.enclosesForks(station, member.tail.mark, required.map((q): number => q.s));
      if (fork !== null) { missed.push(fork); continue; }
      const carried = station === member.tail.knots[0] ? member.tail : K.continueBefore(member.tail, station);
      if (typeof carried === "string") { missed.push(carried); continue; }
      const tail = carried === member.tail ? member.tail :
        K.constrainTail(member.family, member.tail.mark, [station, ...member.tail.knots.filter((s): boolean => s < member.tail.mark)]);
      if (typeof tail === "string") { missed.push(tail); continue; }
      const frame = member.axis.at(station);
      const physical: [number, number, number] = [V.dot(V.sub(frame.origin, plane.origin), plane.z), V.dot(frame.u, plane.z), V.dot(frame.v, plane.z)];
      const first = K.beforePlane(C.chain(carried.initial.map((field): number => field[0]!), member.family.layout), ...physical);
      const similar = F.similarStart(tail, member.family, physical);
      if (typeof similar === "string" && first !== null) { missed.push(station + " mm: " + first + ", " + similar); continue; }
      return { tail, required, physical, similar };
    }
    throw new Error("no named station has an admissible buried root before the registered forks: " + missed.join("; "));
  }

  function winding(polygon: readonly C.P[], p: C.P): 0 | 1 | null {
    let crossings = 0;
    for (const [i, a] of polygon.entries()) {
      const b: C.P = polygon[(i + 1) % polygon.length]!;
      const direction = orientAutoMovieSolidChart(a, b, p);
      if (direction === 0 && p[0] >= Math.min(a[0], b[0]) && p[0] <= Math.max(a[0], b[0]) &&
          p[1] >= Math.min(a[1], b[1]) && p[1] <= Math.max(a[1], b[1])) return null;
      if ((a[1] > p[1]) !== (b[1] > p[1]) && (direction > 0) === (b[1] > a[1])) crossings++;
    }
    return crossings % 2 === 1 ? 1 : 0;
  }
  function finiteEdgeDistance(p: C.P, a: C.P, b: C.P): number {
    const u = b[0] - a[0], v = b[1] - a[1], length = u * u + v * v;
    const t = length === 0 ? 0 : Math.min(1, Math.max(0, ((p[0] - a[0]) * u + (p[1] - a[1]) * v) / length));
    return Math.hypot(p[0] - a[0] - t * u, p[1] - a[1] - t * v);
  }

  /** Split one measured closed owner envelope at the actual affine partitions, preserving polygon order. */
  function envelopeForks(
    polyline: readonly C.P[],
    partitions: readonly ((p: C.P) => number)[],
  ): { edge: number; t: number; point: C.P }[][] | string {
    if (polyline.length < 3) return "the owner envelope needs three distinct vertices";
    const result: { edge: number; t: number; point: C.P }[][] = [];
    for (const [index, side] of partitions.entries()) {
      const values = polyline.map(side);
      if (!values.every(Number.isFinite)) return "a divider is not finite on the owner envelope";
      const hits: { edge: number; t: number; point: C.P }[] = [];
      for (let edge: number = 0; edge < values.length; ++edge) {
        const next: number = (edge + 1) % values.length;
        const a: number = values[edge]!, b: number = values[next]!;
        if (a === 0) {
          const before: number = values[(edge + values.length - 1) % values.length]!;
          if (before === 0 || b === 0) return `divider ${index} overlaps an envelope edge`;
          if ((before < 0) === (b < 0)) return `divider ${index} touches an envelope vertex without crossing`;
          hits.push({ edge, t: 0, point: polyline[edge]! });
        } else if (b !== 0 && (a < 0) !== (b < 0)) {
          const t: number = a / (a - b);
          const p: C.P = polyline[edge]!, q: C.P = polyline[next]!;
          hits.push({ edge, t, point: [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])] });
        }
      }
      if (hits.length !== 2) return `divider ${index} has ${hits.length} crossings on the observed envelope`;
      result.push(hits);
    }
    return result;
  }

  /** Keep each nonempty subedge of the measured envelope with exactly one anatomically ordered child. */
  function ownedEnvelope(
    polygon: readonly C.P[],
    sides: readonly ((p: C.P) => number)[],
  ): { child: number; points: C.P[] }[] | string {
    const forks = envelopeForks(polygon, sides);
    if (typeof forks === "string") return forks;
    const hits = forks.flat();
    const arcs: { child: number; points: C.P[] }[] = [];
    for (const [edge, a] of polygon.entries()) {
      const b: C.P = polygon[(edge + 1) % polygon.length]!;
      const stops = [{ t: 0, point: a }, ...hits.filter((hit): boolean => hit.edge === edge && hit.t > 0),
        { t: 1, point: b }].sort((p, q): number => p.t - q.t);
      for (let k: number = 1; k < stops.length; k++) {
        const left = stops[k - 1]!, right = stops[k]!;
        if (!(left.t < right.t)) return "two adjacent partitions meet on the same envelope point";
        const midpoint: C.P = [(left.point[0] + right.point[0]) / 2, (left.point[1] + right.point[1]) / 2];
        const signs = sides.map((side): number => side(midpoint));
        if (!signs.every((s: number): boolean => Number.isFinite(s) && s !== 0))
          return "an envelope subedge has no strict owner";
        const stop = signs.findIndex((s: number): boolean => s < 0);
        const child = stop < 0 ? signs.length : stop;
        if (signs.some((s: number, j: number): boolean => (s > 0) !== (j < child)))
          return "the measured ownership cells do not nest in the physical sibling order";
        const last = arcs.at(-1);
        if (last?.child === child) last.points.push(right.point);
        else arcs.push({ child, points: [left.point, right.point] });
      }
    }
    const first = arcs[0]!, last = arcs.at(-1)!;
    if (first !== last && first.child === last.child) {
      first.points = [...last.points, ...first.points.slice(1)];
      arcs.pop();
    }
    if (arcs.some((arc, i): boolean => Math.abs(arc.child - arcs[(i + 1) % arcs.length]!.child) !== 1))
      return "the owner word skips a child at an observed endpoint";
    return arcs;
  }

  /** The engine samples this host terminal ring 8*count times. A measured outline and a band imply this necessary bound. */
  function authoredEnvelope(
    points: C.P[], partitions: readonly ((p: C.P) => number)[], primary: number,
    world: (p: C.P) => R.V, chart: (p: R.V) => C.P,
  ) {
    const forks = envelopeForks(points, partitions), owned = ownedEnvelope(points, partitions);
    if (typeof forks === "string" || typeof owned === "string") throw new Error(typeof forks === "string" ? forks : String(owned));
    const runs = owned.filter((arc) => arc.child === primary);
    if (partitions.length !== 1 || runs.length !== 1 || owned.length !== 2)
      throw new Error("the authored half lacks one ordered indexed lobe with two actual median endpoints");
    const run = runs[0]!.points;
    const median = (p: C.P): C.P => { const q = world(p); return chart([q[0], q[1], 0]); };
    const reflected = (p: C.P): C.P => { const q = world(p); return chart([q[0], q[1], -q[2]]); };
    const end = run.length - 1, fixed = [median(run[0]!), ...run.slice(1, end), median(run[end]!)];
    if (fixed.slice(1, end).some((p): boolean => !(world(p)[2] > 0)))
      throw new Error("an indexed interior source vertex lies outside the authored world half");
    const twin = [fixed[end]!, ...fixed.slice(1, end).reverse().map(reflected), fixed[0]!];
    return { points: [...fixed.slice(0, -1), ...twin.slice(0, -1)],
      forks: [forks[0]!.map((hit) => ({ ...hit, point: median(hit.point) }))],
      arcs: [{ child: primary, points: fixed }, { child: 1 - primary, points: twin }],
    };
  }

  /** Separate the registered authored reference outline from the actual two-sided physical composition. */
  function rootEnvelope(
    plan: ReturnType<typeof FamilyConicDivide.composition>, original: ReturnType<typeof R.prepare>,
    divides: readonly FamilyConicDivide.ISurface[], tolerance: number,
  ) {
    const node = plan.owner;
    const host = plan.source(node.hostFace);
    const station = host.stations[node.hostEnd === "top" ? host.stations.length - 1 : 0]!;
    const frame = host.axis.at(station);
    const basis = AutoMovieConstructionSplitCompose.basis(frame, node.hostEnd === "top" ? 1 : -1);
    if (basis === null) throw new Error(node.name + " has no physical host chart");
    const world = (p: C.P): R.V => V.add(basis.origin, V.add(V.scale(basis.x, p[0]), V.scale(basis.y, p[1])));
    const chart = (p: R.V): C.P => { const v = V.sub(p, basis.origin); return [V.dot(v, basis.x), V.dot(v, basis.y)]; };
    const names = node.children.map(({ partFace }) => plan.originalOf(partFace));
    const authored = names.length === 2 && names[0] === names[1] ? node.children.findIndex(({ partFace }, i) => partFace === names[i]) : undefined;
    if (authored !== undefined && (authored < 0 || basis.z[2] !== 0))
      throw new Error("the reflected declared siblings do not share a reflection-invariant parent plane");
    const centres = node.children.map((entry): C.P => {
      const registered = plan.originalOf(entry.partFace);
      const authored = plan.figure.families.find((member): boolean => member.name === registered);
      if (authored === undefined) throw new Error("missing registered original " + registered);
      const family = registered === entry.partFace ? authored : AutoMovieHumanConicLoft.mirror(authored, entry.partFace);
      const a = family.centres[0]!, b = family.centres[1]!;
      const advance = V.sub(b, a), speed = V.dot(advance, basis.z);
      if (!(speed > 0)) throw new Error("the registered first course does not enter " + node.name);
      return chart(V.add(a, V.scale(advance, -V.dot(V.sub(a, basis.origin), basis.z) / speed)));
    });
    const partitions = node.children.slice(1).map((entry, i) => {
      const a = node.children[i]!.partFace, b = entry.partFace;
      const rows = divides.filter((d): boolean => (d.near.includes(a) && d.far.includes(b)) || (d.near.includes(b) && d.far.includes(a)));
      if (rows.length !== 1) throw new Error("the adjacent sources do not have one registered physical partition: " + a + ", " + b);
      const divider = rows[0]!, sign: number = divider.near.includes(a) ? 1 : -1;
      return (point: C.P): number => sign * divider.side(world(point));
    });
    const loops = original.chains({ origin: basis.origin, u: basis.x, v: basis.y });
    const observedCentres = authored === undefined ? centres : [centres[authored]!];
    const candidates = loops.filter((loop): boolean => loop.closed && observedCentres.every((p): boolean => winding(loop.points, p) === 1));
    if (candidates.length !== 1) throw new Error(node.name + " has no unique independent envelope around all registered child courses");
    const observed = candidates[0]!.points;
    const carried = authored === undefined ? undefined : authoredEnvelope(observed, partitions, authored, world, chart);
    const points = carried?.points ?? observed;
    const forks = carried?.forks ?? envelopeForks(points, partitions);
    const arcs = carried?.arcs ?? ownedEnvelope(points, partitions);
    if (typeof forks === "string" || typeof arcs === "string") throw new Error(typeof forks === "string" ? forks : String(arcs));
    const observedRing = K.measuredRing(points, true);
    if (typeof observedRing === "string") throw new Error("the independent envelope loses its directed cycle: " + observedRing);
    const first = observedRing.edges[0]!;
    const observedWinding = first.a === points[first.index] ? 1 : -1;
    const reader = AutoMovieLoftViewFullSource.create(host);
    const shortest = Math.min(...node.children.map((child): number => 1000 * child.rail));
    let greatest = { distance: 0, phase: 0, owner: -1 };
    for (let k = 0; k < node.count * 8; k++) {
      const phase = 2 * Math.PI * k / (node.count * 8);
      const p = chart(reader.point(station, phase));
      let least = Infinity, own = -1;
      for (const arc of arcs) for (let j = 1; j < arc.points.length; ++j) {
        const d = finiteEdgeDistance(p, arc.points[j - 1]!, arc.points[j]!);
        if (d < least) { least = d; own = arc.child; }
      }
      if (least > greatest.distance) greatest = { distance: least, phase, owner: own };
    }
    return { basis, host, station, points, forks, arcs, world, chart, shortest, greatest, authored, winding: observedWinding,
      parentRefusal: greatest.distance > shortest + tolerance ? "the registered parent ring exceeds its named shortest rail and the entire measured union allowance" : null };
  }

  /** The acquisition owns every incident face/cut-edge pair before a physical candidate is prepared. */
  function forkSeeds(
    envelope: ReturnType<typeof rootEnvelope>, group: ReturnType<typeof collectGroup>,
    required: ReadonlyMap<string, readonly { face: string; partition: number; edge: number; t: number; s: number; phi: number }[]>,
  ) {
    for (const child of group.owner.children)
      if (child.partEnd !== "bottom") throw new Error("a grouped fork needs a proximal attachment");
    return envelope.forks.flatMap((pair, k) => pair.map((hit) => {
      const faces = [group.children[k]!, group.children[k + 1]!] as const;
      const addresses = faces.map((face): [number, number] => {
        const proofFace = envelope.authored === undefined ? face.face : face.stock;
        const proofs = required.get(face.stock)?.filter((proof): boolean => proof.face === proofFace && proof.partition === k && proof.edge === hit.edge && proof.t === hit.t);
        const member = group.members.get(face.stock);
        if (proofs === undefined || proofs.length !== 1 || member === undefined)
          throw new Error(face.face + " lacks one measured chart address for edge " + hit.edge);
        const proof = proofs[0]!;
        if (!(proof.s > member.tail.knots[0]! && proof.s < member.tail.mark))
          throw new Error(face.face + " does not strictly contain the independently measured fork");
        return [proof.s, proofFace === face.face ? proof.phi : -proof.phi];
      });
      return { faces, observed: hit.point, edge: hit.edge, variables: [...hit.point, ...addresses[0]!, ...addresses[1]!] };
    }));
  }

  /** Two independently evaluated chart points share one moving point in the fixed parent plane. */
  function forkRows(
    basis: IAutoMovieConstructionSplitCompose.IBasis,
    planePoint: readonly [number, number],
    left: IAutoMovieSolidSurface.IJet,
    right: IAutoMovieSolidSurface.IJet,
  ): { residual: number[]; differential: number[][]; orientedCrossing: number } {
    const target = V.add(basis.origin, V.add(V.scale(basis.x, planePoint[0]), V.scale(basis.y, planePoint[1])));
    const residual: number[] = [...V.sub(left.p, target), ...V.sub(right.p, target)];
    // Columns are the two master coordinates, then each child's station and phase.
    const differential: number[][] = [left, right].flatMap((jet, child: number) =>
      [0, 1, 2].map((k: number): number[] => [
        -basis.x[k]!, -basis.y[k]!,
        child === 0 ? jet.u[k]! : 0, child === 0 ? jet.v[k]! : 0,
        child === 1 ? jet.u[k]! : 0, child === 1 ? jet.v[k]! : 0,
      ]),
    );
    const tangent = (jet: IAutoMovieSolidSurface.IJet) => V.sub(
      V.scale(jet.v, V.dot(basis.z, jet.u)), V.scale(jet.u, V.dot(basis.z, jet.v)),
    );
    const a = tangent(left), b = tangent(right);
    const orientedCrossing = V.dot(basis.z, V.cross(a, b));
    if (![...a, ...b, orientedCrossing].every(Number.isFinite) || !(V.norm(a) > 0 && V.norm(b) > 0))
      throw new Error("the common plane lacks two regular material chart tangents");
    return { residual, differential, orientedCrossing };
  }

  type MaterialPoint = { face: string; station: number; phase: number; point: R.V };
  type MaterialColumn = {
    reader: (face: string) => IAutoMovieLoftViewFullSource.IReader;
    step: number;
    velocity: (site: MaterialPoint) => R.V;
  };
  type MaterialQuery = {
    value: number;
    stocks: readonly string[];
    sites?: readonly MaterialPoint[];
    change: (column: MaterialColumn) => number;
  };

  type MaterialCosts = { columns: number; heldFaces: number; ordinaryFaces: number; directReaders: number; assembledWalls: number; columnSourceMs: number;
    directSites: number; scalarCapSites: number; retainedCapSites: number; authoredCapSites: number; uncertainSites: number };

  /** Read one changed original stock at the base material addresses of its physical points. */
  function materialColumns(
    state: readonly number[], fields: readonly { stock: string; step: number }[],
    group: ReturnType<typeof collectGroup>, roots: ReturnType<typeof groupSources>,
    chart: ReturnType<ReturnType<typeof groupSources>["prepareCharts"]>,
    base: readonly MaterialQuery[], ends: ReadonlyMap<string, ReturnType<typeof endFace>>,
    derivatives: boolean, costs: MaterialCosts,
    notice: (event: string, detail: object) => void,
  ): { value: number; gradient: Map<number, number> }[] {
    const rows = base.map(({ value }) => ({ value, gradient: new Map<number, number>() }));
    if (!derivatives) return rows;
    const byStock = new Map<string, number[]>();
    base.forEach(({ stocks }, index): void => {
      for (const name of new Set(stocks)) {
        const rows = byStock.get(name);
        if (rows === undefined) byStock.set(name, [index]);
        else rows.push(index);
      }
    });
    const within = (station: number, [first, last]: readonly [number, number]): boolean => station >= first && station <= last;
    const allSites = new Set(base.flatMap(({ sites }) => sites ?? []));
    const originalPoints = new Map([...allSites].flatMap((site) => {
      const end = ends.get(site.face);
      if (end?.direct !== true || !within(site.station, end.principal)) return [];
      if (site.face === group.owner.hostFace && group.parent === undefined) return [];
      const { source } = chart(site.face);
      if (source.regular === null || !within(site.station, source.regular)) return [];
      return [[site, source.point(site.station, site.phase)] as const];
    }));
    const scope = new Map([...byStock].map(([stock, queries]) => {
      const faces = new Set(group.children.filter((child): boolean => child.stock === stock).map((child): string => child.face));
      if (group.parent?.family.name === stock) faces.add(group.parent.face);
      const sites = [...new Set(queries.flatMap((index): readonly MaterialPoint[] => base[index]!.sites ?? []))]
        .filter(({ face }): boolean => faces.has(face));
      return [stock, { faces, queries, sites }] as const;
    }));
    const reported = new Set<string>();
    for (const [index, field] of fields.entries()) {
      const current = scope.get(field.stock);
      if (current === undefined) continue;
      const { faces: selected, queries, sites } = current;
      costs.columns++;
      const changed = [...state]; changed[index]! += field.step;
      const placed = AutoMovieHumanF1.replaceNeutralOriginal(roots.figure, group.stock(changed, field.stock));
      const firstSource: boolean = !reported.has(field.stock);
      const prepareStart: number = performance.now();
      if (firstSource) {
        reported.add(field.stock);
        notice("column source start", { stock: field.stock, column: index, faces: [...selected] });
      }
      // A column is a derivative of the smooth source at the base state's discrete structure: each selected face is resolved at the base
      // source's own stations. A face whose held resolution does not emit the base's station array takes the ordinary path.
      const held: Map<string, readonly number[]> = new Map([...selected].map((face: string): [string, readonly number[]] =>
        [face, chart(face).view.stations]));
      const sources: ReadonlyMap<string, IAutoMovieViewPart> = AutoMovieHumanF1.originalSources(placed, selected, undefined, held);
      for (const face of selected) {
        const moved: readonly number[] | undefined = sources.get(face)?.stations, base: readonly number[] = held.get(face)!;
        const same: boolean = moved !== undefined && moved.length === base.length && moved.every((s, i): boolean => s === base[i]);
        costs[same ? "heldFaces" : "ordinaryFaces"]++;
      }
      costs.columnSourceMs += performance.now() - prepareStart;
      if (firstSource) notice("column source returned", { stock: field.stock, column: index,
        elapsedMs: performance.now() - prepareStart });
      const readers = new Map([...sources].map(([face, view]) => [face, AutoMovieLoftViewFullSource.create(view)] as const));
      const reader = (face: string): IAutoMovieLoftViewFullSource.IReader => readers.get(face) ?? chart(face).source;
      costs.directReaders += readers.size;
      type DirectRoute = {
        moved: IAutoMovieLoftViewFullSource.IReader;
        regular: readonly [number, number];
        principal: readonly [number, number];
        declared: readonly [number, number];
        authored: readonly [number, number];
      };
      const originalStock = roots.figure.families.find((f): boolean => f.name === field.stock);
      const movedStock = placed.families.find((f): boolean => f.name === field.stock);
      const routes = new Map([...selected].map((face): readonly [string, DirectRoute | null] => {
        const original = chart(face);
        const baseEnd = ends.get(face);
        const regular = original.source.regular, moved = sources.get(face);
        let prepared: DirectRoute | null = null;
        if (baseEnd?.direct === true && regular !== null && moved !== undefined && sameMaterialRole(original.view, moved)) {
          const changed = reader(face);
          // The cap bridge can only extend the positive declared rows. An admitted direct chain retains them all.
          const bottom: boolean = moved.pole === "bottom" || moved.pole === "both";
          const top: boolean = moved.pole === "top" || moved.pole === "both";
          const declared: [number, number] = [moved.stations[bottom ? 1 : 0]!, moved.stations.at(top ? -2 : -1)!];
          const oldTips = originalStock?.tips, newTips = movedStock?.tips;
          const low = newTips?.[0], high = newTips?.[1];
          const authored: [number, number] = [bottom ? low?.from ?? NaN : changed.domain[0],
            top ? high?.from ?? NaN : changed.domain[1]];
          const sameCaps: boolean =
            (!bottom || (low?.tip === changed.domain[0] && oldTips?.[0]?.tip === original.source.domain[0] &&
              low?.from === oldTips?.[0]?.from)) &&
            (!top || (high?.tip === changed.domain[1] && oldTips?.[1]?.tip === original.source.domain[1] &&
              high?.from === oldTips?.[1]?.from));
          if (sameCaps && declared[0] < declared[1] && authored[0] < authored[1] &&
              sameInterval(original.source.domain, changed.domain) && sameInterval(regular, changed.regular))
            prepared = { moved: changed, regular, principal: baseEnd.principal, declared, authored };
        }
        return [face, prepared];
      }));
      const addressed = sites.map((site) => {
        const native = routes.get(site.face) ?? null;
        const role: "uncertainSites" | "scalarCapSites" | "retainedCapSites" | "authoredCapSites" | "directSites" =
          native === null ? "uncertainSites" : !within(site.station, native.regular) ? "scalarCapSites"
          : !within(site.station, native.principal) ? "retainedCapSites" : !within(site.station, native.declared) ? "uncertainSites"
          : !within(site.station, native.authored) ? "authoredCapSites" : "directSites";
        return { site, native, role };
      });
      const needsWall = new Set(addressed.filter(({ role }): boolean => role !== "directSites").map(({ site }): string => site.face));
      const walls = new Map([...needsWall].map((face) => {
        const host: boolean = face === group.owner.hostFace;
        const top: boolean = host ? group.owner.hostEnd === "top" :
          group.owner.children.find((child): boolean => child.partFace === face)!.partEnd === "top";
        return [face, endFace(sources.get(face)!, top, top === host ? 1 : -1).surface] as const;
      }));
      costs.assembledWalls += walls.size;
      const velocities = new Map(addressed.map(({ site, native, role }): readonly [MaterialPoint, R.V] => {
        costs[role]++;
        let difference: R.V;
        if (native !== null && role === "directSites") {
          difference = V.sub(native.moved.point(site.station, site.phase), originalPoints.get(site)!);
        } else {
          const wall = walls.get(site.face)!;
          if (!within(site.station, wall.domain!))
            throw new Error(site.face + " has no actual material differential at the registered cut station");
          difference = V.sub(wall.jet(site.station, site.phase).p, site.point);
        }
        return [site, V.scale(difference, 1 / field.step)];
      }));
      const velocity = (site: MaterialPoint): R.V => {
        if (!selected.has(site.face)) return [0, 0, 0];
        const value = velocities.get(site);
        if (value === undefined) throw new Error("a material row did not register its differential site on " + site.face);
        return value;
      };
      const column: MaterialColumn = { reader, step: field.step, velocity };
      for (const j of queries) {
        const derivative = base[j]!.change(column);
        if (!Number.isFinite(derivative)) throw new Error("physical material differential leaves its source chart");
        rows[j]!.gradient.set(index, derivative);
      }
    }
    return rows;
  }

  /**
   * The fairing reading on the junction's own curves (`FamilyConicJunction`; joints-one-shot.md, "2026-11-23: the fairing fit's cost,
   * measured, and its redesign"), with no declaration and no loft in a trial or a column:
   *
   * - the fairing residuals on each authored child's root rings and guide lines, a ring only on its visible arc: the phases whose cut lies
   *   inside a neighbour's cut at the end plane are trimmed by the compose and are never skin, so rounding them is meaningless (and was
   *   what pulled pinky and ring apart, readings 3 to 5 of 2026-11-23);
   * - each neighbour pair's overlap depth in the end plane kept non-negative (the signed-distance row of sequential convex collision
   *   avoidance, Schulman et al., IJRR 33(9), 2014, with the opposite sign: there the bodies stay apart, here neighbours stay crossed);
   * - each neighbour's cut kept partly outside the other's (one point on or outside it), so a neighbour pair cannot nest instead of cross;
   * - each non-neighbour pair's signed separation kept non-negative;
   * - the host's end ring within the shortest rail of the composed outline (the children's cuts outside every other cut);
   * - each seam's host-ring phases enclosing the seam before it, the split's nesting test as three margin rows per seam
   *   (`FamilyConicJunction.seams`; the leg's emit of 2026-11-23 was refused at admission on it);
   * - an outline refused when a neighbour pair's cuts do not cross exactly twice, or a seam plane does not cross the host's ring twice.
   *
   * Derivatives group the columns (Curtis, Powell and Reid, J Inst Math Appl 13:117-119, 1974; Nocedal and Wright, Numerical Optimization,
   * 2006, ch. 8): a member's rows read its own values only, so one value of every member is moved in each grouped column, and the pair
   * and host rows take their rates from the members' own point velocities by the chain rule.
   */
  function junctionModel(
    group: ReturnType<typeof collectGroup>, envelope: ReturnType<typeof rootEnvelope>,
    fields: readonly { stock: string; step: number }[], roots: ReturnType<typeof groupSources>,
    log: (event: string, detail: object) => void,
  ) {
    type P = [number, number];
    const plane: Junction.IPlane = { origin: [...envelope.basis.origin] as R.V, x: [...envelope.basis.x] as R.V, y: [...envelope.basis.y] as R.V, z: [...envelope.basis.z] as R.V };
    const family = (families: ReadonlyMap<string, K.IStored>, face: string, stock: string): K.IStored => {
      const own = families.get(stock) ?? (group.parent?.family.name === stock ? group.parent.family : undefined);
      if (own === undefined) throw new Error("the junction has no family for " + stock);
      return face === stock ? own : AutoMovieHumanConicLoft.mirror(own, face);
    };
    // The stations each child is read at, fixed from the base sources: its rings over its root stretch, its lines two stations past
    // it, and the four stations of its base view that bracket the end plane (the course point's height over the plane changes sign).
    const height = (p: readonly number[]): number => V.dot(V.sub(p as R.V, plane.origin), plane.z);
    const layout = group.children.map((child) => {
      const view = roots.view(child.face);
      const member = group.members.get(child.stock)!;
      const stations: number[] = view.stations.filter((s: number): boolean => s >= member.tail.knots[0]!);
      const rings: number[] = child.face === child.stock ? stations.filter((s: number): boolean => s <= member.tail.mark) : [];
      // The cut's bracket: from the last station whose whole ring lies on the plane's near side to the first whose whole ring lies past
      // it, one more each way, read once on the base sections. A splayed digit's section lines cross the plane far from where its course
      // does, so four stations about the course's own crossing left lateral phases without a crossing (the hand's start read pinky and
      // ring 8.91 mm apart where the lofted end composes them).
      const all: number[] = view.stations;
      const own = family(new Map([[child.stock, member.family]]), child.face, child.stock);
      const probe = Junction.read({ face: child.face, family: own, rings: all, lines: [], guides: [], bracket: [], cut: [],
        phases: Array.from({ length: FAIR_RING }, (_, j: number): number => (2 * Math.PI * j) / FAIR_RING) }, plane, Junction.sections());
      const sides = probe.rings.map((ringPoints: R.V[]): number => {
        const h = ringPoints.map(height);
        return Math.max(...h) < 0 ? -1 : Math.min(...h) > 0 ? 1 : 0;
      });
      const below: number = sides.lastIndexOf(-1), above: number = sides.indexOf(1);
      const bracket: number[] = all.slice(Math.max(0, below - 1), above < 0 ? all.length : Math.min(all.length, above + 2));
      const coarse = Junction.read({ face: child.face, family: own,
        rings: [rings.length > 0 ? rings[0]! : bracket[0]!], lines: [], phases: Array.from({ length: FAIR_RING }, (_, j: number): number => (2 * Math.PI * j) / FAIR_RING),
        guides: [], bracket: [], cut: [] }, plane, Junction.sections());
      const girth: number = coarse.rings[0]!.reduce((sum: number, p: R.V, j: number, ring: R.V[]): number => sum + V.norm(V.sub(ring[(j + 1) % ring.length]!, p)), 0);
      const count: number = AutoMovieHumanConicLoft.phaseCount(member.family, girth);
      const phases: number[] = Array.from({ length: count }, (_, j: number): number => (2 * Math.PI * j) / count);
      const span: number = rings.length < 2 ? 1 : rings.at(-1)! - rings[0]!;
      const weights: number[] = rings.map((_, i: number): number => rings.length < 2 ? 1 : ((rings[Math.min(i + 1, rings.length - 1)]! - rings[Math.max(i - 1, 0)]!) / 2) / span);
      // The cut at twice the owner's count, as the seal reads the actual cuts (`terminalIncidence`: non-neighbour overlap and the forks'
      // crossing directions on 2 x count-gons), finer than the composition's count; the wedge's lines through every station of the
      // child's view from the bracket's start to its domain's end, as the skin cut walks them.
      const declared = group.owner.children.find(({ partFace }): boolean => partFace === child.face);
      const childRail: number = (declared?.rail ?? 0) * 1000;
      // The wedge's stations end one past the first whose whole ring stands past the end plane by more than the rail: the planes move
      // by the rail along the child's axis, so rise at most the rail over the end plane, and a line that enters the moved wedge at all
      // enters it by there. A later entry is not seen, so the row is conservative (2026-11-24: walking the whole domain made a derivative
      // reading 53 to 74 s).
      const past: number = probe.rings.findIndex((ringPoints: R.V[]): boolean => Math.min(...ringPoints.map(height)) > childRail);
      return { child, rings, lines: stations.slice(0, rings.length + 2), phases, weights, bracket,
        guides: Array.from({ length: FAIR_LINES }, (_, j: number): number => (2 * Math.PI * j) / FAIR_LINES),
        cutPhases: Array.from({ length: 2 * group.owner.count }, (_, j: number): number => (2 * Math.PI * j) / (2 * group.owner.count)),
        wedge: all.slice(Math.max(0, below - 1), past < 0 ? all.length : Math.min(all.length, past + 2)), railMm: childRail };
    });
    const railMm: number = Math.min(...group.owner.children.map((entry): number => entry.rail * 1000));
    const hostFace: string = group.owner.hostFace;
    const hostStock: string = group.parent?.family.name ?? hostFace.replace(/\.mirror$/, "");
    const hostFamily = (families: ReadonlyMap<string, K.IStored>): K.IStored => {
      const own = group.parent !== undefined ? family(families, hostFace, hostStock)
        : roots.figure.families.find((f): boolean => f.name === hostStock);
      if (own === undefined) throw new Error("the junction has no host family " + hostStock);
      return hostFace === own.name || group.parent !== undefined ? own : AutoMovieHumanConicLoft.mirror(own, hostFace);
    };
    const hostCount: number = group.owner.count;
    // The host's end ring at eight times the owner's count, as the split samples it for the seams' crossings and for its rail.
    const hostPhases: number[] = Array.from({ length: 8 * hostCount }, (_, j: number): number => (2 * Math.PI * j) / (8 * hostCount));
    // The children's direction into themselves: the composed end's section axis is signed by it; the seams' normals do not change with
    // a sign common to every child (`FamilyConicJunction.seams`), but the axes are given as the split gives them.
    const into: number[] = layout.map((entry): number =>
      group.owner.children.find(({ partFace }): boolean => partFace === entry.child.face)?.partEnd === "top" ? -1 : 1);
    const byStock = new Map<string, number[]>();
    fields.forEach(({ stock }, index): void => { const list = byStock.get(stock); if (list === undefined) byStock.set(stock, [index]); else list.push(index); });
    const columnGroups: number = Math.max(0, ...[...byStock.values()].map((list): number => list.length));

    // The reduced prefix basis is fixed at the fit's knot addresses. At and beyond the protected mark its influence is zero.
    const seeds = group.expand(group.vector);
    const scopes = layout.map((entry) => {
      const { face, stock } = entry.child;
      const tail = group.members.get(stock)!.tail;
      const cardinal = F.basisOf(tail.knots);
      const held: number[] = tail.free.map((): number => 0);
      const controls = (byStock.get(stock) ?? []).map((i: number, k: number) => (
        { field: Math.floor(k / tail.free.length), knot: k % tail.free.length, step: fields[i]!.step }));
      // A mirrored feature run can change several fields together by the nonlinear chord address. Keep its exact construction.
      return Junction.prepareMember({ face, family: family(seeds, face, stock), rings: entry.rings,
        lines: entry.rings.length > 0 ? entry.lines : [], phases: entry.phases, guides: entry.rings.length > 0 ? entry.guides : [],
        bracket: entry.bracket, cut: entry.cutPhases, wedge: entry.wedge }, plane,
      face === stock && tail.free.length > 0 ? { controls, weights: (s: number): number[] => s < tail.mark ? tail.basis(cardinal(s)) : held } : undefined);
    });
    const hostScope = Junction.prepareMember({ face: hostFace, family: hostFamily(seeds), rings: [envelope.station], lines: [], phases: hostPhases,
      guides: [], bracket: [], cut: [] }, plane);
    const hostCurves = (families: ReadonlyMap<string, K.IStored>, provider: Junction.ISections) => {
      const ring: R.V[] = hostScope.read(hostFamily(families), provider).rings[0]!;
      // One host-rail row per ring point, all eight times the owner's count, as the split's admission samples the ring: rows at every eighth
      // point let the ring stand 2.46 mm from the leg's outline between them against a 2.13 mm rail (refused at admission, 2026-11-24).
      const host: P[] = ring.map((p: R.V): P => { const q = V.sub(p, plane.origin); return [V.dot(q, plane.x), V.dot(q, plane.y)]; });
      return { ring, host };
    };
    const readChild = (families: ReadonlyMap<string, K.IStored>, provider: Junction.ISections, c: number): Junction.IRead => {
      const { face, stock } = layout[c]!.child;
      return scopes[c]!.read(family(families, face, stock), provider);
    };
    const polygon = (cut: readonly (P | null)[]): P[] => cut.filter((p): p is P => p !== null);
    /**
     * Each child's rail wedge depth by cut phase as rows, minus (`Junction.wedge`): the end plane and the child's seam planes, turned
     * toward the child, moved along its axis by its rail, as the split cuts its rail (`derive`, "the child face's rail"); the rail's
     * wedge lies inside the unshifted one, so its row implies the boundary's ("the child face's boundary in the composition"). No rows
     * stand while the seams are refused.
     */
    const wedgeOf = (r: Junction.IRead, seams: Junction.ISeams, c: number): number[] => {
      if (r.axis === null) return r.wedgeLines.map((): number => 0);
      const planes: { point: R.V; normal: R.V }[] = [{ point: plane.origin, normal: plane.z }];
      if (c > 0) planes.push(seams.planes[c - 1]!);
      if (c < seams.planes.length) planes.push({ point: seams.planes[c]!.point, normal: V.scale(seams.planes[c]!.normal, -1) });
      return Junction.wedge(r.wedgeLines, planes, V.scale(r.axis, into[c]! * layout[c]!.railMm)).map((depth: number): number => -depth);
    };
    /** The seams on the host's end ring from members' cuts, axes and the host ring, as the split derives them. */
    const axisOf = (r: Junction.IRead, i: number): R.V | null => r.axis === null ? null : V.scale(r.axis, into[i]!);
    const seamsOf = (children: readonly Junction.IRead[], ring: readonly R.V[]) => Junction.prepareSeams({ plane,
      cuts: children.map((r) => r.cut), axes: children.map(axisOf), host: ring });

    // The rows of one reading of the curves, with the visible-arc masks of the base (held for its columns).
    type Rows = { fairing: number[]; fairingOwner: number[]; pairs: { value: number; a: number; b: number; ia: number; ib: number; seg: number; t: number; u: P; kind: "overlap" | "clearance" | "exclusion"; inA: boolean }[];
      host: { value: number; c: number; k: number; k1: number; t: number; u: P; h: number }[]; crossing: string | null;
      nesting: { model: ReturnType<typeof seamsOf>; radius: number; values: number[] };
      transversal: { value: number; c: number; k: number }[]; wedges: number[] };
    type Curves = ReturnType<typeof hostCurves> & { children: Junction.IRead[] };
    const visible = (read: Curves): boolean[][] => layout.map((entry, i): boolean[] => {
      const own = read.children[i]!.cut, n = own.length;
      const others: P[][] = [i - 1, i + 1].filter((j) => j >= 0 && j < layout.length).map((j) => polygon(read.children[j]!.cut));
      // A ring phase's cut point is the cut phase nearest it (the cut is read at 2 x count phases, the ring at the figure's count).
      return entry.phases.map((_, k: number): boolean => {
        const p = own[Math.round((k * n) / entry.phases.length) % n];
        return p === null || p === undefined || !others.some((o) => o.length > 2 && Junction.inside(p, o));
      });
    });
    /** The fairing residuals of one reading, each with its owner: all a grouped column needs of its moved reading. */
    const fairingOf = (read: Curves, masks: boolean[][]): { fairing: number[]; fairingOwner: number[] } => {
      const fairing: number[] = [], fairingOwner: number[] = [];
      layout.forEach((entry, i): void => {
        const r = read.children[i]!, mask = masks[i]!;
        const before: number = fairing.length;
        r.rings.forEach((ring: R.V[], j: number): void => {
          if (mask.every(Boolean)) { fairing.push(...Fairing.residuals(ring, true, r.normals[j], entry.weights[j])); return; }
          // Each visible run of the ring, open, in phase order round the ring.
          const start = mask.findIndex((m) => !m);
          let run: R.V[] = [];
          for (let n = 1; n <= mask.length; ++n) {
            const k = (start + n) % mask.length;
            if (mask[k]) run.push(ring[k]!);
            if (!mask[k] || n === mask.length) { if (run.length >= 4) fairing.push(...Fairing.residuals(run, false, r.normals[j], entry.weights[j])); run = []; }
          }
        });
        r.lines.forEach((line: R.V[], g: number): void => {
          const k = Math.round((entry.guides[g]! / (2 * Math.PI)) * mask.length) % mask.length;
          if (mask[k]) fairing.push(...Fairing.residuals(line, false));
        });
        for (let n = before; n < fairing.length; ++n) fairingOwner.push(i);
      });
      return { fairing, fairingOwner };
    };
    const rowsOf = (read: Curves, masks: boolean[][]): Rows => {
      const { fairing, fairingOwner } = fairingOf(read, masks);
      const cuts: P[][] = read.children.map((r) => polygon(r.cut));
      const seamModel = seamsOf(read.children, read.ring);
      const pairs: Rows["pairs"] = [];
      let crossing: string | null = null;
      for (let a = 0; a < cuts.length; ++a) for (let b = a + 1; b < cuts.length; ++b) {
        const [A, B] = [cuts[a]!, cuts[b]!];
        if (A.length < 3 || B.length < 3) { crossing = group.children[a]!.face + " or " + group.children[b]!.face + " has no closed cut in the end plane"; continue; }
        const neighbours: boolean = b === a + 1;
        if (neighbours) {
          const n: number = seamModel.crossings[a]!;
          if (n !== 2 && crossing === null) crossing = "the sections of " + group.children[a]!.face + " and " + group.children[b]!.face + " cross " + n + " times in the end plane, not twice";
        }
        // The deepest point of either inside the other (penetration), else the closest approach (separation, negative depth).
        // Neighbours also keep each cut partly outside the other: a cut wholly inside its neighbour satisfies the overlap row and crosses
        // it no time (the leg's toe.middle held 16.5 mm of overlap over toe.index and the outline was refused, 2026-11-24). That row is the
        // least depth of one cut's points in the other, at most zero when one point stands on or outside it, with the clearance row's rate.
        const ways = [[A, B, true], [B, A, false]] as const;
        const both = ways.map(([P0, Q0, inA]) => ({ inA, ...Junction.depths(P0, Q0) }));
        const deepest = both[0]!.deepest.depth >= both[1]!.deepest.depth ? both[0]! : both[1]!;
        const d = deepest.deepest;
        pairs.push({ value: neighbours ? -d.depth : d.depth, a, b, ia: d.k, ib: -1, seg: d.segment, t: d.t, u: d.u,
          kind: neighbours ? "overlap" : "clearance", inA: deepest.inA });
        if (neighbours) for (const way of both)
          pairs.push({ value: way.least.depth, a, b, ia: way.least.k, ib: -1, seg: way.least.segment, t: way.least.t, u: way.least.u, kind: "exclusion", inA: way.inA });
        // One overlap interval per neighbour pair and direction (`Junction.secondRun`): two cuts that cross four times hold the overlap
        // and non-containment rows and are refused by the composition (the hand's ring and middle, 2026-11-24). The row is the active
        // point's depth with its sign, so its rate is a depth row's: a maximum's like the non-containment row, a minimum's like overlap.
        if (neighbours) for (const [P0, Q0, inA] of ways) {
          const run = Junction.secondRun(P0, Q0);
          pairs.push({ value: run.value, a, b, ia: run.at.k, ib: -1, seg: run.at.segment, t: run.at.t, u: run.at.u,
            kind: run.sign > 0 ? "exclusion" : "overlap", inA });
        }
      }
      // The composed outline as the compose makes it: each cut's segments outside every other cut, a segment that enters another cut
      // clipped at the fork where it crosses that cut's boundary. The host ring's distance to it less the shortest rail; the row's rate
      // follows the nearest point along its segment, so it stays smooth across a fork (the nearest sample jumped there, and the hand's
      // fit stalled on that row, 2026-11-23 18:0x).
      // One row per host ring point, each linearized on its active segment (as sequential convex collision avoidance does per active
      // pair, Schulman et al. 2014), so a fork switch changes which segment is active instead of making a row jump.
      const segments = Junction.outline(read.children.map((r) => r.cut));
      const host: Rows["host"] = read.host.map((h: P, index: number) => {
        const near = Junction.onOutline(h, segments), g = near.segment;
        const u: P = near.distance > 0 ? [(h[0] - near.at[0]) / near.distance, (h[1] - near.at[1]) / near.distance] : [0, 0];
        return { value: near.distance - railMm, c: g?.c ?? -1, k: g?.k0 ?? -1, k1: g?.k1 ?? -1, t: near.t, u, h: index };
      });
      // The seams' nesting on the host's end ring, the split's own test (`AutoMovieConstructionSplitCompose.derive`), as rows: each margin
      // in mm along the ring at its mean radius (its girth over the turn), minus, so a row is satisfied at or below zero as the others.
      const seams: Junction.ISeams = seamModel.base;
      if (seams.refusal !== null && crossing === null) crossing = seams.refusal;
      const radius: number = read.ring.reduce((sum: number, p: R.V, k: number, all: R.V[]): number => sum + V.norm(V.sub(all[(k + 1) % all.length]!, p)), 0) / (2 * Math.PI);
      // Each cut phase's line crosses the end plane transversally (the skin cut's "tangent to the cut" and the seal's station advance):
      // the unit station tangent's rate across the plane, kept positive.
      const transversal = read.children.flatMap((r, c: number) => r.crossing.flatMap((x, k: number) => (x === null ? [] : [{ value: -x, c, k }])));
      return { fairing, fairingOwner, pairs, host, crossing, nesting: { model: seamModel, radius, values: seams.margins.flat().map((x: number): number => -x * radius) },
        transversal, wedges: seams.refusal === null ? read.children.flatMap((r, c: number): number[] => wedgeOf(r, seams, c)) : [] };
    };

    /** The model's own reading of the host ring, the cuts and the composed outline, for comparison with the split's admission. */
    const probe = (families: ReadonlyMap<string, K.IStored>) => {
      const provider = Junction.sections();
      const read = { ...hostCurves(families, provider), children: scopes.map((_, c: number) => readChild(families, provider, c)) };
      return { ring: read.ring, host: read.host, segments: Junction.outline(read.children.map((r) => r.cut)), railMm, station: envelope.station, plane };
    };

    /** One reading: the rows and, with derivatives, their rates from the grouped columns. */
    return Object.assign((state: readonly number[], derivatives: boolean, candidates: ReadonlyMap<string, K.IStored>, hard: F.IGroupRow[], inside: F.IGroupRow[]) => {
      const started: number = performance.now();
      const provider = Junction.sections();
      const readings = layout.map(({ child }, c: number) => derivatives
        ? scopes[c]!.reading(family(candidates, child.face, child.stock), provider)
        : { base: readChild(candidates, provider, c), moved: null });
      const base: Curves = { ...hostCurves(candidates, provider), children: readings.map(({ base }): Junction.IRead => base) };
      const masks = visible(base);
      const rows = rowsOf(base, masks);
      const knotColumn: number[] = fields.map((): number => -1);
      for (const order of byStock.values()) order.forEach((index: number, k: number): void => { knotColumn[index] = k; });
      const expanded = new Set(layout.flatMap(({ child }, c: number): string[] => readings[c]!.moved === null ? [child.stock] : []));
      expanded.add(hostStock);
      const cutPhases = base.children.map(({ cut }): number[] => cut.flatMap((p, k: number): number[] => p === null ? [] : [k]));
      const wedgeFirst: number[] = [];
      let wedgeCount: number = 0;
      for (const { wedgeLines } of base.children) {
        wedgeFirst.push(wedgeCount);
        wedgeCount += wedgeLines.length;
      }
      const gradients = {
        fairing: rows.fairing.map(() => new Map<number, number>()),
        pairs: rows.pairs.map(() => new Map<number, number>()),
        host: rows.host.map(() => new Map<number, number>()),
        nesting: rows.nesting.values.map(() => new Map<number, number>()),
        transversal: rows.transversal.map(() => new Map<number, number>()),
        wedges: rows.wedges.map(() => new Map<number, number>()),
      };
      if (derivatives) for (let g = 0; g < columnGroups; ++g) {
        const changed = [...state];
        const moved = new Map<string, number>();
        for (const [stock, list] of byStock) if (g < list.length) { const index = list[g]!; changed[index]! += fields[index]!.step; moved.set(stock, index); }
        // Only sources outside the reduced field model need a new family. Every other column touches its own member's station data.
        const families = new Map([...moved.keys()].filter((stock: string): boolean => expanded.has(stock))
          .map((stock: string): [string, K.IStored] => [stock, group.stock(changed, stock)]));
        const children = layout.map(({ child }, c: number): Junction.IRead => {
          const index: number | undefined = moved.get(child.stock);
          if (index === undefined) return base.children[c]!;
          const column = readings[c]!.moved;
          return column === null ? readChild(families, provider, c) : column(knotColumn[index]!);
        });
        const hostIndex: number | undefined = moved.get(hostStock);
        const next: Curves = { ...(hostIndex === undefined ? { ring: base.ring, host: base.host } : hostCurves(families, provider)), children };
        // Fairing rows belong to one member's curves; their order follows the members, so each member's rows are read with only its
        // own values moved, all members at once.
        // A member's fairing rows depend on its own curves only, so with every member moved at once each row's change is its own
        // member's: the row's rate goes to that member's moved column.
        const residuals = fairingOf(next, masks).fairing;
        rows.fairing.forEach((value: number, r: number): void => {
          const member = rows.fairingOwner[r]!;
          const index = moved.get(layout[member]!.child.stock);
          if (index !== undefined) gradients.fairing[r]!.set(index, (residuals[r]! - value) / fields[index]!.step);
        });
        // The pair and host rows by the chain rule from the members' own point velocities.
        const velocity = (c: number, k: number): P | null => {
          const index = moved.get(layout[c]!.child.stock);
          const p = base.children[c]!.cut[k], q = next.children[c]!.cut[k];
          if (index === undefined || p === null || p === undefined || q === null || q === undefined) return null;
          return [(q[0] - p[0]) / fields[index]!.step, (q[1] - p[1]) / fields[index]!.step];
        };
        rows.pairs.forEach((row, r: number): void => {
          const [own, other] = row.inA ? [row.a, row.b] : [row.b, row.a];
          // Polygon indices back to cut phases: a polygon holds a cut's crossing phases in order.
          const vOwn = velocity(own, cutPhases[own]![row.ia]!);
          const others: number[] = cutPhases[other]!;
          const k0 = others[row.seg]!, k1 = others[(row.seg + 1) % others.length]!;
          const v0 = velocity(other, k0), v1 = velocity(other, k1);
          // `u` is minus the depth's rate in the own point and its rate in the boundary point: the overlap row (minus the depth) moves
          // by `u` in the own point, the clearance row (the depth) by minus `u`, and the boundary point the other way.
          const sign = row.kind === "overlap" ? 1 : -1;
          const add = (c: number, v: P | null, weight: number): void => {
            const index = moved.get(layout[c]!.child.stock);
            if (index === undefined || v === null) return;
            const d = (v[0] * row.u[0] + v[1] * row.u[1]) * weight;
            gradients.pairs[r]!.set(index, (gradients.pairs[r]!.get(index) ?? 0) + sign * d);
          };
          add(own, vOwn, 1);
          add(other, v0, -(1 - row.t));
          add(other, v1, -row.t);
        });
        rows.host.forEach((row, r: number): void => {
          if (row.c < 0) return;
          const v0 = velocity(row.c, row.k), v1 = velocity(row.c, row.k1);
          const index = moved.get(layout[row.c]!.child.stock);
          const gradient = gradients.host[r]!;
          if (index !== undefined && v0 !== null && v1 !== null) {
            const v: P = [(1 - row.t) * v0[0] + row.t * v1[0], (1 - row.t) * v0[1] + row.t * v1[1]];
            gradient.set(index, -(v[0] * row.u[0] + v[1] * row.u[1]));
          }
          if (hostIndex !== undefined) {
            const a: P = base.host[row.h]!, b: P = next.host[row.h]!;
            const rate: number = ((b[0] - a[0]) * row.u[0] + (b[1] - a[1]) * row.u[1]) / fields[hostIndex]!.step;
            gradient.set(hostIndex, (gradient.get(hostIndex) ?? 0) + rate);
          }
        });
        // A stock moves its own faces together. When its neighbours hold, only the incident seam pairs and the children meeting
        // those planes can change their wedge rows. The host ring changes nesting phases but leaves the wedge planes fixed.
        if (rows.nesting.model.base.refusal === null) for (const [stock, index] of moved) {
          const affected: number[] = layout.flatMap(({ child }, c: number): number[] => child.stock === stock ? [c] : []);
          const changes = affected.map((c: number) => ({ index: c, cut: next.children[c]!.cut, axis: axisOf(next.children[c]!, c) }));
          const seams: Junction.ISeams = rows.nesting.model.moved(changes, stock === hostStock ? next.ring : base.ring);
          if (seams.refusal !== null) continue;
          seams.margins.flat().forEach((x: number, r: number): void => {
            const d: number = (-x * rows.nesting.radius - rows.nesting.values[r]!) / fields[index]!.step;
            if (d !== 0) gradients.nesting[r]!.set(index, d);
          });
          if (rows.wedges.length > 0) layout.forEach((_, c: number): void => {
            if (!affected.some((j: number): boolean => Math.abs(c - j) <= 1)) return;
            const child: Junction.IRead = affected.includes(c) ? next.children[c]! : base.children[c]!;
            wedgeOf(child, seams, c).forEach((v: number, k: number): void => {
              const r: number = wedgeFirst[c]! + k;
              const d: number = (v - rows.wedges[r]!) / fields[index]!.step;
              if (d !== 0) gradients.wedges[r]!.set(index, d);
            });
          });
        }
        // A transversality row reads one member's own line, so its rate goes to that member's moved column.
        rows.transversal.forEach((row, r: number): void => {
          const index = moved.get(layout[row.c]!.child.stock), x = next.children[row.c]!.crossing[row.k];
          if (index !== undefined && x !== null && x !== undefined) gradients.transversal[r]!.set(index, (-x - row.value) / fields[index]!.step);
        });
      }
      log("family-body-junction-cost", { owner: group.owner.name, derivatives, sections: provider.count, columnGroups: derivatives ? columnGroups : 0,
        fairingRows: rows.fairing.length, pairRows: rows.pairs.length, hostRows: rows.host.length,
        pairs: rows.pairs.map((row) => ({ kind: row.kind, a: group.children[row.a]!.face, b: group.children[row.b]!.face, value: row.value })),
        worstHost: Math.max(-Infinity, ...rows.host.map((row) => row.value)), crossing: rows.crossing,
        seams: rows.nesting.model.base.seams, nested: rows.nesting.model.base.nested, nestingRows: rows.nesting.values,
        nestingRates: gradients.nesting.map((g): number => Math.max(0, ...[...g.values()].map(Math.abs))),
        worstTransversal: Math.max(-Infinity, ...rows.transversal.map((row) => row.value)), worstWedge: Math.max(-Infinity, ...rows.wedges),
        wedgeRows: rows.wedges.length,
        pairRates: gradients.pairs.map((g): number => Math.max(0, ...[...g.values()].map(Math.abs))), elapsedMs: performance.now() - started });
      const measured: F.IGroupRow[] = rows.fairing.map((value, r) => ({ value, gradient: gradients.fairing[r]! }));
      const pairRows: F.IGroupRow[] = rows.pairs.map((row, r) => ({ value: row.value, gradient: gradients.pairs[r]! }));
      const hostRows: F.IGroupRow[] = rows.host.map((row, r) => ({ value: row.value, gradient: gradients.host[r]! }));
      const nestingRows: F.IGroupRow[] = rows.nesting.values.map((value, r) => ({ value, gradient: gradients.nesting[r]! }));
      const transversalRows: F.IGroupRow[] = rows.transversal.map((row, r) => ({ value: row.value, gradient: gradients.transversal[r]! }));
      const wedgeRows: F.IGroupRow[] = rows.wedges.map((value, r) => ({ value, gradient: gradients.wedges[r]! }));
      const key: string = group.owner.name + "/junction";
      // The host-rail rows are read on every state as inside rows: the ring's distance to the cuts' outline is defined while a pair
      // crosses wrongly too, and as outline rows they vanished at a refused outline, so the recovery accepted trials by the common rows
      // alone and the hand formed its outline 5.03 mm off the rail, where no trial improved it (2026-11-24, run 132428).
      const outline: F.IGroupOutline = rows.crossing !== null ? { kind: "refused", key, detail: rows.crossing } : { kind: "formed", key, rows: [] };
      // The pair rows are restorable as the ownership rows are (a start may hold a non-neighbour overlap, as the foot's does), and once
      // satisfied they are kept with them (`preservation`).
      const preservation: F.IGroupPreservation[] = outline.kind === "formed" ? [
        { name: "child ownership", rows: inside }, { name: "neighbour overlap and separation", rows: pairRows },
        { name: "host outline rail", rows: hostRows }, { name: "seam nesting", rows: nestingRows },
        { name: "cut transversality", rows: transversalRows }, { name: "child rail wedge", rows: wedgeRows }] : [];
      return F.readGroup(state, derivatives, [{ rows: () => ({ measured, incidence: [],
        inside: [...inside, ...pairRows, ...nestingRows, ...hostRows, ...transversalRows, ...wedgeRows], hard }) }], outline, preservation);
    }, { probe });
  }

  /** Equal physical bounds establish the same admitted station and cap roles. */
  function sameInterval(a: readonly [number, number], b: readonly [number, number] | null): boolean {
    return b !== null && a[0] === b[0] && a[1] === b[1];
  }

  /** A changed raw point keeps the regular original role and the same ordered features. */
  function sameMaterialRole(base: IAutoMovieViewPart, moved: IAutoMovieViewPart): boolean {
    if (base.name !== moved.name || base.order !== moved.order || base.pole !== moved.pole ||
        base.fullness.kind !== moved.fullness.kind || base.originalSection !== undefined || moved.originalSection !== undefined)
      return false;
    const original = base.reliefs ?? [], changed = moved.reliefs ?? [];
    return original.length === changed.length && original.every((r, i): boolean =>
      r.name === changed[i]!.name && sameInterval(r.stations, changed[i]!.stations));
  }

  /** A full family owns a radial occupancy on a registered section only when no active relief displaces that transverse ray. */
  function ownershipAt(
    view: IAutoMovieViewPart, family: K.IStored, f: IAutoMovieLoftViewFullSource.IReader,
  ): (point: R.V) => { inside: number; s: number; phi: number }[] {
    const first = view.stations[0]!;
    const zero = V.sub(view.axis.at(first).origin, AutoMovieHumanConicLoft.axis(family).at(first).origin);
    const addresses = AutoMovieHumanJoinLoop.certifiedAddresses(view, f.domain, family, zero);
    return (point) => addresses(point).map(([s, phi]) => {
      if ((view.reliefs ?? []).some((relief): boolean => s > relief.stations[0] && s < relief.stations[1]))
        throw new Error("the active physical relief does not certify radial occupancy for " + view.name);
      const centre = view.axis.at(s).origin, wall = f.point(s, phi);
      const inside = V.norm(V.sub(wall, centre)) - V.norm(V.sub(point, centre));
      return { inside, s, phi };
    });
  }

  /** Prepare the engine's ordered end-plane cuts for a registered source bank. */
  function prepareEndSections(
    basis: IAutoMovieConstructionSplitCompose.IBasis, group: ReturnType<typeof collectGroup>, count: number,
  ) {
    const compose = group.owner.compose!;
    const plane = AutoMovieConstructionSplitCompose.plane(compose.plane, compose.frame === "tree" ? null : basis);
    if (plane === null) throw new Error("the actual composed owner lacks a numerical end plane");
    const children = group.owner.children.map((child) => ({ face: child.partFace,
      into: child.partEnd === "bottom" ? 1 as const : -1 as const, rail: AutoMovieConstructionViews.SCALE * child.rail }));
    const top: boolean = group.owner.hostEnd === "top";
    const hostFace: string = group.owner.hostFace;
    return (source: (face: string) => IAutoMovieViewPart) => {
      const host = endFace(source(hostFace), top, top ? 1 : -1);
      const walls = new Map<string, ReturnType<typeof endFace>>([[hostFace, host]]);
      const actual = children.map(({ face, into, rail }) => {
        const view: IAutoMovieViewPart = source(face);
        if (view.name !== face)
          throw new Error("the actual child source belongs to " + view.name + " rather than " + face);
        const physical = endFace(view, into < 0, into);
        const section = AutoMovieConstructionSplitCompose.section(plane, { ...physical, name: face, into, rail }, count);
        if (typeof section === "string") throw new Error(section);
        walls.set(face, physical);
        return section;
      });
      return { host, actual, walls };
    };
  }

  /** The fixed host probes for one formed outline, read only after its leading rows admit the trial. */
  function sampleHostOutline(
    created: IAutoMovieConstructionComposedEnd.IComposition, host: ReturnType<typeof endFace>, count: number,
  ) {
    return Array.from({ length: 8 * count }, (_, k) => {
      const phase: number = 2 * Math.PI * k / (8 * count);
      const point: R.V = host.surface.jet(host.station, phase).p;
      let evidence: readonly IAutoMovieConstructionComposedEnd.IOutlineDistanceSite[] = [];
      const distance: number = created.outline.distance(point, (value): void => { evidence = value; });
      return { phase, point, distance, evidence };
    });
  }

  /** Reopen the actual directed fork, including its two original SkinCut addresses and their physical orientation. */
  function actualForks(
    envelope: ReturnType<typeof rootEnvelope>, group: ReturnType<typeof collectGroup>,
    actual: readonly IAutoMovieConstructionSplitCompose.ISection[],
    made: IAutoMovieConstructionComposedEnd.IComposition, tolerance: number,
  ) {
    const plane = actual[0]!.plane;
    const normal = V.cross(envelope.basis.x, envelope.basis.y);
    if (!(V.norm(V.cross(plane.normal, normal)) <= AutoMovieSolidSharedCurve.ROUNDING &&
          Math.abs(V.dot(plane.normal, V.sub(envelope.basis.origin, plane.point))) <= tolerance))
      return "the independent envelope and actual cuts do not lie on their registered common plane";
    const winding = made.outline.pieces.map((piece): number => {
      const row = actual[piece.section]!, phase = (piece.from + piece.to) / 2;
      const jet = row.child.surface.jet(row.cut.at(phase)[0], phase);
      const outward = V.scale(V.cross(jet.u, jet.v), row.child.surface.orientation);
      const tangent = V.scale(row.section.at(phase).first, Math.sign(piece.to - piece.from));
      return Math.sign(V.dot(normal, V.cross(outward, tangent)));
    });
    if (!winding.every((sign): boolean => sign !== 0 && sign === winding[0]))
      return "the actual outline has no common co-oriented boundary traversal";
    const observedWinding: number = envelope.winding;
    const mapped = F.directedForks(made, envelope.arcs, observedWinding === winding[0]);
    if (typeof mapped === "string") return mapped;
    const crossings: number[][] = made.seams.map(() => []);
    for (const site of mapped) {
      const branches = site.fork.phases.map((phase, j) => {
        const cut = actual[site.pair + j]!, member = group.members.get(group.children[site.pair + j]!.stock)!;
        const station: number = cut.cut.at(phase)[0];
        const wall = cut.child.surface, jet = wall.jet(station, phase);
        if (!(station > wall.domain![0] && station < Math.min(wall.domain![1], member.tail.mark) &&
              cut.child.into * V.dot(plane.normal, jet.u) > 0 &&
              Math.abs(V.dot(plane.normal, V.sub(jet.p, plane.point))) <= tolerance &&
              V.norm(V.sub(jet.p, site.fork.point)) <= tolerance))
          return null;
        return cut.section.at(phase).first;
      });
      if (branches[0] === null || branches[0] === undefined || branches[1] === null || branches[1] === undefined)
        return "an actual directed fork leaves its bounded original chart or loses common world and plane incidence";
      crossings[site.pair]!.push(V.dot(plane.normal, V.cross(branches[0], branches[1])));
    }
    if (crossings.some((pair): boolean => pair.length !== 2 || !(Math.sign(pair[0]!) * Math.sign(pair[1]!) < 0)))
      return "the two original directed forks do not cross transversely in opposite directions";
    return mapped;
  }

  type GroupCosts = MaterialCosts & { rawMs: number; stockMs: number; cutsMs: number; addressMs: number; outlineMs: number;
    columnsMs: number; coldOutlineMs: number; warmOutlineMs: number; witnessMs: number };
  type GroupFurthest = {
    fork: { value: number; signed: number; pair: number; fork: number; component: number; faces: readonly string[] } | null;
    side: F.IGroupSideSite | null;
    host: { value: number; owner: string; station: number; phaseIndex: number; phase: number; piece: number | null } | null;
    mappedFork: { value: number; pair: number; fork: number; observed: C.P; phases: readonly [number, number] } | null;
  };
  type GroupMeasure = <T>(key: "rawMs" | "stockMs" | "cutsMs" | "addressMs" | "outlineMs" | "columnsMs",
    read: () => T, stage?: string) => T;

  /** Correspond the measured envelope to the registered sections on the actual plane, retaining its order and anatomical owner. */
  function endMaterialRows(
    group: ReturnType<typeof collectGroup>, envelope: ReturnType<typeof rootEnvelope>,
    roots: ReturnType<typeof groupSources>, chart: ReturnType<ReturnType<typeof groupSources>["prepareCharts"]>,
    candidates: ReadonlyMap<string, K.IStored>,
    state: readonly number[], fields: readonly { stock: string; step: number }[], derivatives: boolean,
    ends: ReturnType<ReturnType<typeof prepareEndSections>>,
    sites: readonly {stock: string; face: string; s: number; phi: number; point: R.V}[],
    formed: { made: IAutoMovieConstructionComposedEnd.IComposition; forks: Exclude<ReturnType<typeof actualForks>, string> } | string,
    recovery: boolean, measure: GroupMeasure, costs: GroupCosts, furthest: GroupFurthest, scope: string,
    notice: (event: string, detail: object) => void,
  ) {
    const { actual, host } = ends;
    const sections = actual.map((row) => row.section);
    const queries: MaterialQuery[] = [];
    const skin = (index: number, phase: number) => {
      const entry = actual[index]!, station: number = entry.cut.at(phase)[0];
      const jet = entry.child.surface.jet(station, phase);
      const site: MaterialPoint = { face: entry.child.name, station, phase, point: jet.p };
      return {
        site,
        change: (column: MaterialColumn): R.V => F.planeVelocity(envelope.basis.z, jet.u, column.velocity(site)),
      };
    };
    for (const site of sites) {
      const fixed: MaterialPoint = { face: site.face, station: site.s, phase: site.phi, point: site.point };
      for (const axis of [0, 1, 2])
        queries.push({ value: site.point[axis]!, stocks: [site.stock], sites: [fixed],
          change: (column): number => column.velocity(fixed)[axis]! });
    }
    const forks = queries.length;
    measure("addressMs", () => {
      for (const arc of envelope.arcs) {
        if (envelope.authored !== undefined && arc.child !== envelope.authored) continue;
        const owner = group.children[arc.child]!;
        const { view, source } = chart(owner.face);
        const stock = candidates.get(owner.stock)!;
        const family = owner.face === owner.stock ? stock : AutoMovieHumanConicLoft.mirror(stock, owner.face);
        const address = ownershipAt(view, family, source);
        for (const point of arc.points) {
          const observed = envelope.world(point);
          const addresses = address(observed);
          if (addresses.length !== 1) throw new Error("the measured terminal lobe has no single registered material chart on " + owner.face);
          const phi = addresses[0]!.phi;
          const location = envelope.chart(sections[arc.child]!.at(phi).point);
          const local = derivatives ? skin(arc.child, phi) : undefined;
          for (const k of [0, 1])
            queries.push({ value: location[k]! - point[k]!, stocks: [owner.stock], sites: local === undefined ? [] : [local.site], change: (column): number =>
              V.dot(k === 0 ? envelope.basis.x : envelope.basis.y, local!.change(column)) });
        }
      }
      if (group.parent !== undefined) {
        const parent = group.parent;
        const { view: physical, source } = chart(parent.face);
        for (const row of parent.training) {
          const paired = K.parentCorrespondence(physical, row.s, row.ring, group.owner.count, false, TARGET_MM,
            undefined, row.witnesses);
          for (const target of paired.targets) for (const component of [0, 1, 2]) {
            // Hold the registered phase in this local field model. The nonlinear read rebinds the same fixed observed witness.
            const evaluate = (reader: IAutoMovieLoftViewFullSource.IReader): number =>
              target.weight * (reader.point(row.s, target.phi)[component]! - target.point[component]!);
            const value: number = evaluate(source);
            queries.push({ value, stocks: [parent.family.name],
              change: (column): number => (evaluate(column.reader(parent.face)) - value) / column.step });
          }
        }
      }
    });
    const split = queries.length;
    const forkAllowance: MaterialQuery[] = [], measuredForks: MaterialQuery[] = [];
    const refusal = measure("outlineMs", () => {
      if (typeof formed === "string") return formed;
      const created = formed.made;
      const sampleStart: number = performance.now();
      const ring = sampleHostOutline(created, host, group.owner.count);
      costs.coldOutlineMs += performance.now() - sampleStart;
      const witnesses: number = performance.now();
      try {
        const flat = (point: R.V): C.P => [V.dot(point, envelope.basis.x), V.dot(point, envelope.basis.y)];
        const forks = derivatives ? created.seams.flatMap(({ forks }, index) => forks.map(({ phases: [pa, pb] }) => {
          const a = skin(index, pa), b = skin(index + 1, pb);
          const da = sections[index]!.at(pa).first, db = sections[index + 1]!.at(pb).first;
          const stocks = [group.children[index]!.stock, group.children[index + 1]!.stock];
          const change = (column: MaterialColumn) => F.forkVelocity(envelope.basis.x, envelope.basis.y, da, db, a.change(column), b.change(column));
          return { stocks, sites: [a.site, b.site], change };
        })) : [];
        if (!recovery) for (const site of formed.forks) {
          const fork = forks[site.pair * 2 + site.index];
          const gap: R.V = V.sub(site.fork.point, envelope.world(site.observed));
          const length: number = V.norm(gap), value: number = length - TARGET_MM;
          if (furthest.mappedFork === null || value > furthest.mappedFork.value)
            furthest.mappedFork = { value, pair: site.pair, fork: site.index, observed: site.observed, phases: site.fork.phases };
          const stocks = fork?.stocks ?? [];
          for (const axis of [envelope.basis.x, envelope.basis.y]) measuredForks.push({
            value: V.dot(gap, axis), stocks, sites: fork?.sites, change: (column): number => V.dot(fork!.change(column).point, axis),
          });
          // At a coincident point the norm is strictly inside this positive allowance, and has no unique gradient.
          forkAllowance.push({ value, stocks: length === 0 ? [] : stocks, sites: length === 0 ? [] : fork?.sites,
            change: (column): number => V.dot(gap, fork!.change(column).point) / length });
        }
        for (const [phaseIndex, sample] of ring.entries()) {
          const { phase, point: wall, distance, evidence } = sample;
          const value: number = distance - envelope.shortest;
          if (furthest.host === null || value > furthest.host.value)
            furthest.host = { value, owner: group.owner.hostFace, station: host.station, phaseIndex, phase, piece: evidence[0]?.piece ?? null };
          const hostAt: MaterialPoint = { face: group.owner.hostFace, station: host.station, phase, point: wall };
          const stocks = new Set<string>();
          if (group.parent !== undefined) stocks.add(group.parent.family.name);
          const candidates = (derivatives ? evidence.slice(0, 1) : []).map((hit) => {
            const piece = created.outline.pieces[hit.piece]!;
            const phase: number = piece.from + (piece.to - piece.from) * hit.share;
            const onCut = skin(piece.section, phase);
            stocks.add(group.children[piece.section]!.stock);
            const fixed = hit.share === 0 ? forks[hit.forks[0]] : hit.share === 1 ? forks[hit.forks[1]] : undefined;
            const [p, q] = fixed !== undefined || hit.settled ? [undefined, undefined] :
              [forks[hit.forks[0]], forks[hit.forks[1]]];
            for (const end of [fixed, p, q]) if (end !== undefined)
              for (const stock of end.stocks) stocks.add(stock);
            const gap = flat(V.sub(onCut.site.point, wall));
            const gapLength: number = Math.hypot(...gap);
            const first = p === undefined ? undefined : sections[piece.section]!.at(phase).first;
            const change = (column: MaterialColumn): number => {
              let moving = fixed === undefined ? onCut.change(column) : fixed.change(column).point;
              if (p !== undefined && q !== undefined) {
                // A sampled minimum supplies a physical witness at its fixed piece share, rather than a stationary envelope.
                const branch = (id: number): number => piece.section === Math.floor(id / 2) ? 0 : 1;
                const from = p.change(column).rates[branch(hit.forks[0])]!;
                const to = q.change(column).rates[branch(hit.forks[1])]!;
                moving = V.add(moving, V.scale(first!, (1 - hit.share) * from + hit.share * to));
              }
              const delta = flat(V.sub(moving, column.velocity(hostAt)));
              return gapLength === 0 ? Math.hypot(...delta) : (gap[0] * delta[0] + gap[1] * delta[1]) / gapLength;
            };
            const sites: MaterialPoint[] = [hostAt];
            if (fixed === undefined) sites.push(onCut.site);
            for (const dependency of [fixed, p, q]) if (dependency !== undefined) sites.push(...dependency.sites);
            return { change, sites };
          });
          if (derivatives && candidates.length === 0)
            throw new Error("the actual outline distance supplies no material witness");
          queries.push({ value, stocks: [...stocks], sites: candidates[0]?.sites,
            // One actual closest branch supplies the whole affine row. At ties it is a local upper witness to the minimum.
            change: (column): number => candidates[0]!.change(column) });
        }
        return null;
      } finally { costs.witnessMs += performance.now() - witnesses; }
    });
    const hostEnd: number = queries.length;

    // Each non-neighbour pair of actual cuts keeps its in-plane separation in the affine model: one hard row at its sampled closest
    // pair, linearized by the two material velocities along the pair's normal. The nonlinear compose stays the authority.
    const clearanceRows: MaterialQuery[] = [];
    if (!recovery && typeof formed !== "string") {
      const samples: number = 2 * group.owner.count;
      const phases: number[] = Array.from({ length: samples }, (_, k: number): number => 2 * Math.PI * k / samples);
      for (let i: number = 0; i < actual.length; ++i)
        for (let j: number = i + 2; j < actual.length; ++j) {
          const near: ReturnType<typeof F.clearance> = F.clearance(phases.map((p): R.V => actual[i]!.section.at(p).point),
            phases.map((p): R.V => actual[j]!.section.at(p).point));
          const left: ReturnType<typeof skin> | undefined = derivatives ? skin(i, phases[near.pair[0]]!) : undefined;
          const right: ReturnType<typeof skin> | undefined = derivatives ? skin(j, phases[near.pair[1]]!) : undefined;
          clearanceRows.push({ value: -near.distance, stocks: [group.children[i]!.stock, group.children[j]!.stock],
            sites: left === undefined || right === undefined ? [] : [left.site, right.site],
            change: (column): number => -V.dot(near.normal, V.sub(left!.change(column), right!.change(column))) });
        }
    }
    queries.push(...measuredForks, ...forkAllowance, ...clearanceRows);
    notice("outline result", { kind: refusal === null ? "formed" : "refused", outlineRows: hostEnd - split, refusal,
      forkRows: forkAllowance.length, measuredRows: split - forks + measuredForks.length, furthest });
    const rows = measure("columnsMs", () => materialColumns(state, fields, group, roots, chart, queries, ends.walls, derivatives, costs, notice));
    const boundsEnd: number = hostEnd + measuredForks.length + forkAllowance.length;
    const forkBounds: F.IGroupRow[] = rows.slice(hostEnd + measuredForks.length, boundsEnd);
    const clearance: F.IGroupRow[] = rows.slice(boundsEnd);
    const outline: F.IGroupOutline = refusal === null
      ? { kind: "formed", key: scope, rows: rows.slice(split, hostEnd) }
      : { kind: "refused", key: scope, detail: refusal };
    return { forks: rows.slice(0, forks), measured: [...rows.slice(forks, split), ...rows.slice(hostEnd, hostEnd + measuredForks.length)],
      outline, forkBounds, clearance };
  }

  function groupPhysics(
    group: ReturnType<typeof collectGroup>, envelope: ReturnType<typeof rootEnvelope>,
    forks: ReturnType<typeof forkSeeds>, fields: readonly { stock: string; step: number }[],
    plan: ReturnType<typeof FamilyConicDivide.composition>, originalSources: ReturnType<typeof groupSources>, originalState: readonly number[],
    log: (event: string, detail: object) => void,
  ) {
    const sections = prepareEndSections(envelope.basis, group, group.owner.count);
    const junction = junctionModel(group, envelope, fields, originalSources, log);
    const tolerance = AutoMovieSolidSharedCurve.ROUNDING * (1 + V.norm(envelope.basis.origin));
    const scope: string = JSON.stringify([envelope.basis, group.owner.hostFace, group.owner.hostEnd, group.owner.count,
      group.children.map(({ face, stock }) => [face, stock])]);
    const readStock = (candidates: ReadonlyMap<string, K.IStored>, derivatives: boolean) => {
      const hard: F.IGroupRow[] = [];
      for (const [name, member] of group.members) {
        const family = candidates.get(name)!;
        if (member.fault === undefined || member.raw === undefined)
          return name + " has no prepared original material gate";
        const fault: string | null = member.fault(family.values);
        if (fault !== null) return fault;
        const first = family.knots[0]!, frame = member.axis.at(first);
        const plane: [number, number, number] = [V.dot(V.sub(frame.origin, envelope.basis.origin), envelope.basis.z),
          V.dot(frame.u, envelope.basis.z), V.dot(frame.v, envelope.basis.z)];
        const hidden = K.beforePlane(C.chain(family.values.map((v): number => v[0]!), family.layout), ...plane);
        if (hidden !== null) return name + " first ring: " + hidden;
        const raw = member.raw(family.values, group.offsets.get(name)!, derivatives, plane, true);
        if (typeof raw === "string") return name + ": " + raw;
        if (raw.fault !== null) return name + ": " + raw.fault;
        const invalid = raw.margins.find((row): boolean => row.closed ? row.value < 0 : row.value <= 0);
        if (invalid !== undefined) return name + " " + invalid.label + ": " + invalid.value;
        for (const row of raw.margins) hard.push({ value: -row.value / row.scale,
          gradient: new Map([...row.gradient].map(([k, d]): [number, number] => [k, -d / row.scale])) });
      }
      return hard;
    };
    const preparePhysical = (roots: ReturnType<typeof groupSources>) => {
      const ends = sections(roots.view);
      const plane = ends.actual[0]!.plane;
      const made = AutoMovieConstructionComposedEnd.create({ point: plane.point, normal: plane.normal,
        sections: ends.actual.map((row) => row.section), samples: group.owner.count });
      const formed = typeof made === "string" ? made : (() => {
        const mapped = actualForks(envelope, group, ends.actual, made, tolerance);
        return typeof mapped === "string" ? mapped : { made, forks: mapped };
      })();
      const faces: string[] = group.children.map(({ face }): string => face);
      if (group.parent !== undefined) faces.push(group.parent.face);
      return { ends, chart: roots.prepareCharts(faces), formed, roots };
    };
    let index: number = 0;

    /** Both the plain and differentiated readings borrow the state already screened for its raw material. */
    const prepare = (state: readonly number[], starting?: ReturnType<typeof groupSources>): string | (() => F.GroupTrial) => {
      try {
        const candidates = group.expand(state);
        const known = readStock(candidates, false);
        if (typeof known === "string") return known;
        return () => {
          try {
            const physical = FAIR ? undefined : groupPhase(log, group.owner.name, "prepare physical trial sources", () =>
              preparePhysical(starting ?? groupSources(candidates, plan)));
            return (derivatives, ceiling) => read(state, candidates, known, physical, derivatives, ceiling);
          } catch (error: unknown) { return () => error instanceof Error ? error.message : String(error); }
        };
      } catch (error: unknown) { return error instanceof Error ? error.message : String(error); }
    };

    const read = (
      state: readonly number[], candidates: ReadonlyMap<string, K.IStored>, known: F.IGroupRow[],
      physical: ReturnType<typeof preparePhysical> | undefined, derivatives: boolean, ceiling?: F.IGroupCeiling,
    ): ReturnType<F.GroupTrial> => {
      ++index;
      const costs: GroupCosts = { rawMs: 0, stockMs: 0, cutsMs: 0, addressMs: 0, outlineMs: 0, columnsMs: 0,
        columns: 0, heldFaces: 0, ordinaryFaces: 0, directReaders: 0, assembledWalls: 0, columnSourceMs: 0, directSites: 0, scalarCapSites: 0,
        retainedCapSites: 0, authoredCapSites: 0, uncertainSites: 0, coldOutlineMs: 0, warmOutlineMs: 0, witnessMs: 0 };
      const furthest: GroupFurthest = { fork: null, side: null, host: null, mappedFork: null };
      let outline: F.IGroupOutline | undefined;
      const notice = (stage: string, detail: object): void => log("family-body-group-material-phase",
        { owner: group.owner.name, index, derivatives, stage, ...detail });
      const measure: GroupMeasure = (key, operation, stage = key) => {
        const start: number = performance.now();
        notice(stage, { state: "start" });
        try { return operation(); }
        finally {
          const elapsed: number = performance.now() - start;
          costs[key] += elapsed;
          notice(stage, { state: "exit", elapsedMs: elapsed });
        }
      };
      try {
        const hard = measure("rawMs", () => derivatives ? readStock(candidates, true) : known, "raw stock");
        if (typeof hard === "string") return hard;
        const measured: F.IGroupRow[] = [], master: F.IGroupRow[] = [], inside: F.IGroupRow[] = [];
        const rawFault = measure("rawMs", () => {
          for (const [name, member] of group.members) {
            const family = candidates.get(name)!;
            const rows = F.sectionGroupRows(member, family.values, group.offsets.get(name)!, derivatives, member.whole,
              F.sectionSteps(family.layout), (s, pt): number => member.outside?.(chartToWorld(member.axis.at(s), pt)) ?? -Infinity);
            if (typeof rows === "string") return name + ": " + rows;
            if (rows.side !== null && (furthest.side === null || rows.side.value > furthest.side.value)) furthest.side = rows.side;
            if (!FAIR) measured.push(...rows.measured);
            inside.push(...rows.inside);
          }
          return null;
        }, "owned raw sections");
        if (rawFault !== null) return rawFault;
        // Fairing reads the junction on its own curves (`junctionModel`): no declaration and no loft in a reading.
        if (physical === undefined) return measure("addressMs", () => junction(state, derivatives, candidates, hard, inside), "junction");
        const { roots, chart, ends, formed } = physical;
        const { actual, host } = ends;
        const recovery: boolean = state.length !== group.vector.length;
        const sites = recovery ? forks.flatMap((fork, i) => {
          const at = group.vector.length + 6 * i;
          return fork.faces.map((entry, side) => {
            const s = state[at + 2 + 2 * side]!, phi = state[at + 3 + 2 * side]!;
            const wall = actual.find(({ child }): boolean => child.name === entry.face)!.child.surface;
            if (!(s > wall.domain![0] && s < wall.domain![1])) throw new Error(entry.face + " fork leaves the bounded source wall");
            const jet = wall.jet(s, phi);
            return { stock: entry.stock, face: entry.face, s, phi, point: jet.p, jet };
          });
        }) : [];
        const footprints = recovery ? forks.map((fork, i) => {
          const at = group.vector.length + 6 * i;
          const footprint = forkRows(envelope.basis, [state[at]!, state[at + 1]!], sites[2 * i]!.jet, sites[2 * i + 1]!.jet);
          for (const [k, value] of footprint.residual.entries())
            if (furthest.fork === null || Math.abs(value) > furthest.fork.value)
              furthest.fork = { value: Math.abs(value), signed: value, pair: Math.floor(i / 2), fork: i % 2,
                component: k, faces: fork.faces.map(({ face }) => face) };
          return footprint;
        }) : [];
        // A trial whose child ownership or mapped fork allowance already reaches the acceptance ceiling is refused before the host ring,
        // whose cold search is the dearest part of a reading and can only raise the trial's largest row.
        if (!derivatives && !recovery && typeof formed !== "string") {
          const forkValues: number[] = formed.forks.map((site): number =>
            V.norm(V.sub(site.fork.point, envelope.world(site.observed))) - TARGET_MM);
          const partial: string | null = F.partialRefusal(ceiling, [
            { family: "child ownership", values: inside.map((row): number => row.value) },
            { family: "observed fork allowance", values: forkValues },
          ], ["host outline rail (" + 8 * group.owner.count + " rows)", "non-neighbour clearance"]);
          if (partial !== null) return { refusal: partial, inside: [...inside.map((row): number => row.value), ...forkValues] };
        }
        const owned = endMaterialRows(group, envelope, roots, chart, candidates, state, fields, derivatives, ends,
          sites, formed, recovery, measure, costs, furthest, scope, notice);
        outline = owned.outline;
        for (const [i, footprint] of footprints.entries()) {
          const fork = forks[i]!, at = group.vector.length + 6 * i;
          for (const [k, value] of footprint.residual.entries()) {
            const gradient = new Map<number, number>();
            if (derivatives) {
              footprint.differential[k]!.forEach((d, j): void => { gradient.set(at + j, d); });
              for (const [column, change] of owned.forks[6 * i + k]!.gradient) gradient.set(column, change);
            }
            master.push({ value, gradient });
          }
          measured.push({ value: state[at]! - fork.observed[0], gradient: new Map([[at, 1]]) },
            { value: state[at + 1]! - fork.observed[1], gradient: new Map([[at + 1, 1]]) });
        }
        measured.push(...owned.measured);
        const preservation: F.IGroupPreservation[] = !recovery && outline.kind === "formed" ? [
          { name: "child ownership", rows: inside },
          { name: "observed fork allowance", rows: owned.forkBounds },
          { name: "host outline rail", rows: outline.rows },
        ] : [];
        const result = F.readGroup(state, derivatives, [{ rows: () => ({
          measured, incidence: master, inside: [...inside, ...owned.forkBounds], hard: [...hard, ...owned.clearance],
        }) }], outline, preservation);
        if (typeof result !== "string" && !derivatives && !recovery && outline.kind === "formed" && result.incidence <= tolerance) {
          const derived = measure("outlineMs", () => composeGroup(roots.owner, host, actual), "complete compose");
          if (typeof derived === "string") return "the complete physical composed owner refuses this trial: " + derived;
        }
        return result;
      } catch (error: unknown) { return error instanceof Error ? error.message : String(error); }
      finally {
        log("family-body-group-material-cost", { owner: group.owner.name, index, derivatives, ...costs, furthest,
          outline: outline?.kind ?? null, outlineRows: outline?.kind === "formed" ? outline.rows.length : 0,
          outlineRefusal: outline?.kind === "refused" ? outline.detail : null });
      }
    };
    const transfer = (state: readonly number[]): number[] | null =>
      state.length === group.vector.length ? null : state.slice(0, group.vector.length);
    const initial = prepare(originalState, originalSources);
    return { tolerance, initial: typeof initial === "string" ? (): string => initial : initial(),
      read: (state: readonly number[], derivatives: boolean, ceiling?: F.IGroupCeiling): ReturnType<F.GroupTrial> => {
        const scoped = prepare(state);
        return typeof scoped === "string" ? scoped : scoped()(derivatives, ceiling);
      }, screen: prepare, transfer, probe: junction.probe };
  }

  /** Match both endpoints of each observed lobe to the unique physical fork on its known neighbouring pair. */
  function sealedLobes(
    envelope: ReturnType<typeof rootEnvelope>, group: ReturnType<typeof collectGroup>,
    made: IAutoMovieConstructionSplitCompose.IDerived,
    sections: readonly IAutoMovieConstructionComposedEnd.ISection[],
  ) {
    const turn = 2 * Math.PI;
    const samePhase = (a: number, b: number): boolean =>
      Math.abs((a - b) - turn * Math.round((a - b) / turn)) <= 64 * Number.EPSILON * (1 + Math.abs(a) + Math.abs(b));
    const equal = (a: C.P, b: C.P): boolean => a[0] === b[0] && a[1] === b[1];
    const actual = made.composition;
    const lobes = envelope.arcs.map((arc) => {
      const ends = [arc.points[0]!, arc.points.at(-1)!].map((p) => {
        const hits = envelope.forks.flatMap((pair, pairIndex) => pair.flatMap((hit, forkIndex) =>
          equal(hit.point, p) ? [{ pair: pairIndex, index: forkIndex }] : []));
        if (hits.length !== 1) throw new Error("the measured lobe endpoint lacks a single independent neighbouring partition");
        const id = hits[0]!, slot = arc.child - id.pair;
        if (slot !== 0 && slot !== 1) throw new Error("the measured lobe endpoint belongs to another adjacent pair");
        const at = envelope.world(p);
        // Fairing takes the pair's fork by its index, topology alone: the distance to the reference's endpoint is a diagnostic, never a
        // gate (the acceptance principle of #3151; the supervisor's ruling of 2026-11-24 on the seal's lobe premises). Reproduction keeps
        // the allowance.
        if (FAIR) {
          const fork = actual.seams[id.pair]!.forks[id.index]!;
          process.stdout.write(JSON.stringify({ event: "family-body-seal-fork-distance", owner: group.owner.name, pair: id.pair, index: id.index,
            distanceMm: V.norm(V.sub(fork.point, at)), allowanceMm: TARGET_MM }) + "\n");
          return { ...id, phase: fork.phases[slot], point: fork.point };
        }
        const forks = actual.seams[id.pair]!.forks.filter((fork): boolean => V.norm(V.sub(fork.point, at)) <= TARGET_MM);
        if (forks.length !== 1) throw new Error("the actual pair lacks one fork within the measured lobe endpoint allowance");
        return { ...id, phase: forks[0]!.phases[slot], point: forks[0]!.point };
      });
      const pieces = actual.outline.pieces.filter((piece): boolean => piece.section === arc.child &&
        ((samePhase(piece.from, ends[0]!.phase) && samePhase(piece.to, ends[1]!.phase)) ||
          (samePhase(piece.from, ends[1]!.phase) && samePhase(piece.to, ends[0]!.phase))));
      if (pieces.length !== 1) throw new Error("the retained composed outline lacks the observed material lobe between those two forks");
      const piece = pieces[0]!;
      return { original: arc, child: group.children[arc.child]!, ends, piece,
        section: sections[arc.child]!, source: group.members.get(group.children[arc.child]!.stock)!.family.name };
    });
    const used = new Set(lobes.map((lobe) => lobe.piece));
    if (used.size !== lobes.length || used.size !== actual.outline.pieces.length)
      throw new Error("the observed and actually retained terminal lobes do not correspond one to one");
    if (envelope.authored !== undefined) {
      const original = lobes.find((lobe) => lobe.original.child === envelope.authored)!;
      const twin = lobes.find((lobe) => lobe.original.child !== envelope.authored)!;
      const reflect = ([x, y, z]: R.V): R.V => [x, y, -z];
      const close = (a: R.V, b: R.V): boolean =>
        V.norm(V.sub(a, b)) <= AutoMovieSolidSharedCurve.ROUNDING * (1 + Math.max(V.norm(a), V.norm(b)));
      for (const end of original.ends) {
        const reflected = twin.ends.find((e) => e.pair === end.pair && e.index === end.index);
        if (reflected === undefined || !samePhase(reflected.phase, -end.phase) || !close(end.point, reflect(reflected.point)))
          throw new Error("the actual reflected seam lost its original indexed fork or chart reflection");
      }
      const [from, to] = [original.piece.from, original.piece.to];
      for (let k = 0; k < group.owner.count; ++k) {
        const phase = from + (to - from) * (k + 0.5) / group.owner.count;
        if (!close(original.section.at(phase).point, reflect(twin.section.at(-phase).point)))
          throw new Error("the actual reflected lobe lost original physical custody at phase " + phase);
      }
    }
    return lobes;
  }

  /** Prepare the same actual chain, regular side and bound station set the ordinary split uses. */
  function endFace(view: IAutoMovieViewPart, top: boolean, sign: 1 | -1) {
    const loft = AutoMovieViewLoft.create(view);
    if (loft.chain === null || loft.surface?.domain === undefined)
      throw new Error(view.name + ": " + loft.diagnostics.map((row) => row.detail).join(", "));
    const chain = loft.chain, surface = loft.surface, domain = loft.surface.domain;
    const layer = chain.layers[top ? chain.layers.length - 1 : 0]!;
    const basis = AutoMovieConstructionSplitCompose.basis(layer.frame ?? AutoMovieLoftFrame.horizontal(layer.y), sign);
    if (basis === null) throw new Error(view.name + " has no facing end frame");
    const direct: boolean = chain.nativeSource !== undefined &&
      sameInterval(domain, chain.nativeSource.data.domain) &&
      chain.originalSection === undefined && (chain.sectionSpans ?? []).length === 0 &&
      chain.reliefs === view.reliefs && chain.layers.every((row): boolean =>
        row.frameSource?.axis === view.axis && row.sectionSource === undefined && row.lift === undefined);
    const principal: readonly [number, number] = [chain.layers[0]!.y, chain.layers.at(-1)!.y];
    return { surface, station: layer.y, basis, direct, principal, stations: chain.layers.map((row): number => row.y)
      .filter((s: number): boolean => s >= domain[0] && s <= domain[1]) };
  }

  /** Source admission for the full ordered family set, using the same bound plane sections as the material read. */
  function composeGroup(
    owner: IAutoMovieConstructionSplit,
    host: ReturnType<typeof endFace>,
    prepared: readonly IAutoMovieConstructionSplitCompose.ISection[],
  ): IAutoMovieConstructionSplitCompose.IDerived | string {
    const compose = owner.compose;
    if (compose === undefined) return owner.name + " has no declared composed end";
    try {
      if (prepared.length !== owner.children.length ||
          prepared.some(({ child }, i): boolean => child.name !== owner.children[i]!.partFace))
        return "the physical source bank and actual child sections have different ownership";
      return AutoMovieConstructionSplitCompose.derive({ compose, host, children: prepared.map((row) => row.child), count: owner.count }, prepared);
    } catch (error: unknown) {
      return error instanceof Error ? error.message : String(error);
    }
  }

  function lobeReceipt(
    owner: IAutoMovieConstructionSplit,
    plane: IAutoMovieConstructionSplitCompose.IBasis,
    derived: IAutoMovieConstructionSplitCompose.IDerived,
    sourceId: ReadonlyMap<string, string>,
  ) {
    const pieces = derived.composition.outline.pieces.map(({ section, from, to }) => {
      const child = owner.children[section]!;
      const pin = sourceId.get(child.partFace);
      if (pin === undefined) throw new Error("the composed outline lacks a sealed source identity for " + child.partFace);
      return { section, child: child.partFace, band: child.band, source: pin, from, to };
    });
    return { owner: owner.name, host: owner.hostFace, hostEnd: owner.hostEnd, plane,
      hostSource: sourceId.get(owner.hostFace), pieces, seams: derived.composition.seams, hostDistance: derived.host };
  }

  function sealComposed(
    group: ReturnType<typeof collectGroup>, actual: ReturnType<typeof groupSources>, canonical: ReadonlyMap<string, K.IStored>,
    reference: ReturnType<typeof rootEnvelope>, derived: IAutoMovieConstructionSplitCompose.IDerived,
    prepared: readonly IAutoMovieConstructionSplitCompose.ISection[],
  ) {
    const read = actual.view;
    const sections = prepared.map((row) => row.section);
    const lobes = sealedLobes(reference, group, derived, sections);
    const pins = new Map<string, string>();
    const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
    const receipts = [...group.members].map(([name, member]) => {
      const family = canonical.get(name)!;
      const fault = member.tail.check(family) ?? K.tailPolicyFault(family, member.family);
      const lineage = fault ?? (JSON.stringify(family.reliefs) === JSON.stringify(member.family.reliefs) ? null : "canonical relief ownership differs");
      const native = K.refusals(family, 4, member.observed.map((row): number => row.s))[0] ?? null;
      const bound = prepared.find(({ child }): boolean => child.name === name);
      if (bound === undefined) throw new Error("the authored child has no bound actual cut: " + name);
      const view = read(name), placed = K.placedSections(view);
      const exposure = F.verifyOwned(member, family, TARGET_MM, (s) => {
        if ((view.reliefs ?? []).some((relief): boolean => relief.stations[0] < s && s < relief.stations[1]))
          throw new Error("the held owned arc has an unresolved active relief at " + s + " mm");
        const frame = view.axis.at(s), reference = member.axis.at(s);
        return {
          section: placed(s),
          frameGap: (q): number => V.norm(V.sub(chartToWorld(frame, q), chartToWorld(reference, q))),
          distance: (q, fitted): number => V.norm(V.sub(bound.child.surface.jet(s, Math.atan2(fitted[1], fitted[0])).p, chartToWorld(reference, q))),
        };
      });
      // Fairing reports the held exposure as a deviation; only reproduction refuses on it.
      return { name, sha256: hash(family), material: { mark: member.tail.mark, knots: family.knots, tips: family.tips }, exposure,
        refusal: lineage ?? native ?? (FAIR || exposure.supported ? null : "independent owned material or support refused") };
    });
    for (const child of group.children) {
      const source = actual.figure.reference(child.stock);
      pins.set(child.face, hash({ author: canonical.get(child.stock), active: source, face: child.face, stations: read(child.face).stations }));
    }
    pins.set(actual.owner.hostFace, hash({ material: actual.figure.reference(actual.owner.hostFace), stations: read(actual.owner.hostFace).stations }));
    const parent = group.parent;
    const retained = parent === undefined ? undefined : FAIR ? (() => {
      // The parent's deviation from the reference's held rings, reported only; a missing correspondence is reported, not thrown.
      try {
        const physical = read(parent.face);
        const greatest = Math.max(...parent.held.map((row): number => K.parentCorrespondence(physical, row.s, row.ring,
          group.owner.count, true, TARGET_MM, reference.authored === undefined ? undefined : (a, b): boolean => a[2] + b[2] > 0).upper));
        return { face: parent.face, sha256: hash(canonical.get(parent.family.name)!), greatest, covers: [],
          refusal: parent.law.check(canonical.get(parent.family.name)!) };
      } catch (error: unknown) {
        return { face: parent.face, sha256: "", greatest: NaN, covers: [], deviation: error instanceof Error ? error.message : String(error),
          refusal: parent.law.check(canonical.get(parent.family.name)!) };
      }
    })() : (() => {
      const physical = read(parent.face);
      const material = canonical.get(parent.family.name)!;
      const fault = parent.law.check(material);
      const covers = parent.held.map((row) => {
        const proof = K.parentCorrespondence(physical, row.s, row.ring, group.owner.count, true, TARGET_MM,
          reference.authored === undefined ? undefined : (a, b): boolean => a[2] + b[2] > 0);
        if (proof.pieces === 0) throw new Error("no held parent intervals owned by the authored half");
        return { station: row.s, lower: proof.lower, upper: proof.upper, pieces: proof.pieces };
      });
      const greatest = Math.max(...covers.map((row): number => row.upper));
      return { face: parent.face, sha256: hash(material), greatest, covers,
        refusal: fault ?? (greatest <= TARGET_MM ? null : "independent directed retained parent skin exceeds the measured allowance") };
    })();
    const rejected = receipts.filter((row): boolean => row.refusal !== null);
    return { retained, refusal: retained?.refusal ?? (rejected.length === 0 ? null : rejected.map((row): string => row.name + ": " + row.refusal).join(", ")), receipts, source: lobeReceipt(actual.owner, reference.basis, derived, pins),
      correspondence: lobes.map(({ child, ends, piece }) => ({ child, ends, piece })) };
  }

  /** One declared parent and all its physical children. Every trial starts from the same immutable measured observations. */
  function fitComposed(
    plan: ReturnType<typeof FamilyConicDivide.composition>, original: ReturnType<typeof R.prepare>,
    dividers: readonly FamilyConicDivide.ISurface[], collected: ReadonlyMap<string, IGroupMember>, missing: readonly unknown[],
    log: (event: string, detail: object) => void, observeOnly: boolean,
  ) {
    const phase = <T>(name: string, run: () => T): T => groupPhase(log, plan.owner.name, name, run);
    const stage: { name: string; detail: unknown }[] = [];
    const refuse = (reason: string) => ({ owner: plan.owner.name, admitted: false, refusal: reason, stage });
    try {
      stage.push({ name: "independent indexed cuts and protected material", detail: [...collected].map(([name, member]) => ({
        name, mark: member.tail.mark, knots: member.tail.knots, tips: member.family.tips,
        observed: member.observed.map((row) => {
          const cut: IMeasuredCut | undefined = member.kept.get(row.s);
          return { station: row.s, held: row.heldout, measuredEdges: cut?.measured.filter(Boolean).length ?? 0,
            measuredRuns: cut?.runs.map((run): number => run.length - 1) ?? [],
            sourceSHA: cut === undefined ? null : createHash("sha256").update(JSON.stringify(cut)).digest("hex") };
        }),
      })) });
      if (missing.length > 0) stage.push({ name: "missing source observations", detail: missing });
      const envelope = phase("independent terminal envelope", () => rootEnvelope(plan, original, dividers, TARGET_MM));
      stage.push({ name: "independent terminal envelope", detail: { host: envelope.host.name, station: envelope.station,
        greatest: envelope.greatest, shortest: envelope.shortest, forks: envelope.forks, owners: envelope.arcs.map((a) => a.child),
        plane: envelope.basis, sourceSHA: createHash("sha256").update(JSON.stringify(envelope.arcs)).digest("hex") } });
      if (observeOnly) {
        stage.push({ name: "actual original terminal source", detail: phase("actual original terminal source", () => observeTerminal(plan, envelope)) });
      }
      const parent = phase("independent retained parent", () => endParent(plan, original, envelope));
      if (parent !== undefined) stage.push({ name: "independent retained parent end", detail: {
        face: parent.face, span: [parent.law.left, parent.law.last], fixedEnd: envelope.station,
        training: parent.training.map((row) => row.s), held: parent.held.map((row) => row.s) } });
      if (missing.length > 0) return refuse("one or more declared members lack independent observations");
      if (observeOnly) return { owner: plan.owner.name, admitted: false, refusal: null, stage };
      const ready = new Map<string, IGroupMember>();
      const required = new Map<string, ReturnType<typeof hiddenPrefix>["required"]>();
      const refusals: { name: string; detail: string }[] = [];
      for (const [name, member] of collected) {
        try {
          const selected = phase("bounded proximal support " + name, () => hiddenPrefix(name, member, plan, envelope));
          const seed = phase("canonical material " + name, () => F.prepareGroupMember(member.observed, selected.tail, member.family, member.margin));
          required.set(name, selected.required);
          const quality = (values: number[][]) => {
            const raw = seed.raw(values, 0, false, selected.physical);
            if (typeof raw === "string") return { low: -Infinity, failure: raw };
            const low = raw.margins.reduce((a, q) => a.value / a.scale <= q.value / q.scale ? a : q);
            return { low: low.value / low.scale, row: low.label, raw: low.value, failure: raw.fault };
          };
          const stock = quality(seed.tail.initial);
          const trial = typeof selected.similar === "string" ? undefined : quality(selected.similar.values);
          // Fairing starts every root stretch as its own tube continued along its first tangent (the canonical initializer); the
          // reproduction route chose the start nearest the reference's sections instead.
          const useTrial = !FAIR && trial !== undefined && (trial.low > stock.low || trial.low === stock.low && trial.failure === null && stock.failure !== null);
          const tail = useTrial && typeof selected.similar !== "string" ? { ...seed.tail, initial: selected.similar.values } : seed.tail;
          ready.set(name, { ...member, tail, fault: seed.fault, raw: seed.raw });
          stage.push({ name: "canonical and similar buried start " + name, detail: { stock, trial, selected: useTrial ? "similar" : "canonical",
            similarity: typeof selected.similar === "string" ? selected.similar : { scale: selected.similar.scale, supportMm: selected.similar.support } } });
          stage.push({ name: "material support " + name, detail: { domain: [seed.tail.knots[0], seed.tail.mark],
            forks: selected.required } });
        } catch (error: unknown) { refusals.push({ name, detail: error instanceof Error ? error.message : String(error) }); }
      }
      stage.push({ name: "independent canonical starts", detail: { prepared: [...ready.keys()], refusals } });
      if (refusals.length > 0) return refuse("the complete sibling group lacks an admitted start for every named stock");
      const group = collectGroup(plan.owner, ready, plan.originalOf, parent);
      // Fairing has no observed forks to recover toward: the composed end's own crossings are the forks.
      const forks = FAIR ? [] : forkSeeds(envelope, group, required);
      const initial = [...group.vector, ...forks.flatMap((site) => site.variables)];
      const rawStart = performance.now();
      const restored = phase("physical prefix restoration", () => F.restoreGroup(initial, (state, derivatives) => {
        const raw = group.expand(state);
        const margins: F.IStartMargin[] = [];
        let fault: string | null = null;
        for (const [name, member] of group.members) {
          if (member.raw === undefined) return name + " lacks its bounded raw material reader";
          const chart = raw.get(name)!;
          const s: number = chart.knots[0]!;
          const frame = member.axis.at(s);
          const shape = member.raw(chart.values, group.offsets.get(name)!, derivatives,
            [V.dot(V.sub(frame.origin, envelope.basis.origin), envelope.basis.z),
             V.dot(frame.u, envelope.basis.z), V.dot(frame.v, envelope.basis.z)]);
          if (typeof shape === "string") return name + ": " + shape;
          margins.push(...shape.margins.map((row) => ({ ...row, label: name + " " + row.label })));
          if (shape.fault !== null && fault === null) fault = name + ": " + shape.fault;
        }
        return { margins, fault };
      }, 60, (detail) => log("family-body-group-iteration", { owner: plan.owner.name, phase: "restore", ...detail })));
      stage.push({ name: "common reduced material feasibility", detail: { elapsedMs: performance.now() - rawStart,
        iteration: restored.iteration, stopped: restored.stopped, steps: restored.receipts } });
      if (restored.stopped !== null) return refuse(restored.stopped);
      const restoredStock = group.expand(restored.values);
      const nativeStart = performance.now();
      const native: { name: string; failure: string | null }[] = [];
      for (const [name, stock] of restoredStock) {
        const member = group.members.get(name);
        if (member === undefined) continue;
        const failure = K.refusals(stock, 4, member.observed.filter((row): boolean => !row.heldout).map((row): number => row.s))[0];
        native.push({ name, failure: failure ?? null });
      }
      stage.push({ name: "restored native source admission", detail: { elapsedMs: performance.now() - nativeStart, members: native } });
      const refused = native.filter((row) => row.failure !== null);
      if (refused.length > 0) return refuse(refused.map((row) => row.name + ": restored material is unavailable to the native source: " + row.failure).join(", "));
      const initialSources = phase("initial actual chart stock", () => groupSources(restoredStock, plan));
      const fields = [...group.members].flatMap(([stock, member]) => C.units(member.family.layout).flatMap((unit) =>
        member.tail.free.map(() => ({ stock, step: unit === "mm" ? 1e-4 : 1e-6 }))));
      if (parent !== undefined) fields.push(...C.units(parent.family.layout).map((unit) => ({
        stock: parent.family.name, step: unit === "mm" ? 1e-4 : 1e-6 })));
      const seal = (state: readonly number[]) => {
        const stock = group.expand(state);
        const canonical = new Map([...stock].map(([name, value]) => [name, JSON.parse(JSON.stringify(value)) as K.IStored] as const));
        const source = groupSources(canonical, plan);
        const { actual: sections, host } = prepareEndSections(envelope.basis, group, source.owner.count)(source.view);
        const actual = phase("actual all-child compose and rails", () => composeGroup(source.owner, host, sections));
        // A host-ring refusal is compared with the junction model's reading of the same state at the same host points (2026-11-24: the
        // model read the leg feasible and the split refused it): both rings, both outlines' distances, both stations, planes and rails.
        if (typeof actual === "string" && /from the composed outline/.test(actual)) {
          const model = physics.probe(canonical), count = source.owner.count, m = 8 * count;
          const plane = sections[0]!.plane;
          const composition = AutoMovieConstructionComposedEnd.create({ point: plane.point, normal: plane.normal,
            sections: sections.map((s) => s.section), samples: count });
          const rows = typeof composition === "string" ? [] : Array.from({ length: m }, (_, k: number) => {
            const phi = (2 * Math.PI * k) / m, p = host.surface.jet(host.station, phi).p, q = model.ring[k]!;
            const loft: R.V = [p[0]!, p[1]!, p[2]!];
            return { k, ringGap: V.norm(V.sub(loft, q)), split: composition.outline.distance(loft),
              model: Junction.onOutline(model.host[k]!, model.segments).distance };
          });
          const worst = rows.reduce((a, b) => (b.split > a.split ? b : a), rows[0] ?? { k: -1, ringGap: NaN, split: NaN, model: NaN });
          log("family-body-junction-admission-probe", { owner: group.owner.name, refusal: actual, composition: typeof composition === "string" ? composition : "formed",
            hostStation: host.station, modelStation: model.station, splitPlane: plane, modelPlane: model.plane,
            splitRail: Math.min(...sections.map((s) => s.child.rail)), modelRail: model.railMm, points: m, modelPoints: model.ring.length,
            maxRingGap: Math.max(...rows.map((r) => r.ringGap)), maxDistanceGap: Math.max(...rows.map((r) => Math.abs(r.split - r.model))),
            worst, worstModel: rows.reduce((a, b) => (b.model > a.model ? b : a), rows[0] ?? worst) });
        }
        if (typeof actual === "string") return actual;
        const terminal = phase("actual terminal incidence", () => terminalIncidence(sections[0]!.plane, host, sections, actual, source.owner.count));
        const proof = phase("original held contour and material ownership", () => sealComposed(group, source, canonical, envelope, actual, sections));
        return { canonical, terminal, proof };
      };
      const physics = groupPhysics(group, envelope, forks, fields, plan, initialSources, restored.values, log);
      const fit = phase("actual geometry and coupled solve", () => F.fitGroup(
        restored.values, physics.read, physics.tolerance, 60 - restored.iteration,
        (detail) => log("family-body-group-iteration", { owner: plan.owner.name, phase: "coupled", ...detail }), physics.screen,
        { transfer: physics.transfer, initial: physics.initial, certify: (state) => {
          try {
            const result = seal(state);
            if (typeof result === "string" || result.proof.refusal !== null) {
              log("family-body-exact-state-seal", { owner: plan.owner.name, refusal: typeof result === "string" ? result : result.proof.refusal });
              return { admitted: false, receipt: result };
            }
            return { admitted: FAIR || result.proof.receipts.every(({ exposure }): boolean => exposure.held > 0), receipt: result };
          } catch (error: unknown) {
            const refusal: string = error instanceof Error ? error.message : String(error);
            log("family-body-exact-state-seal", { owner: plan.owner.name, refusal });
            return { admitted: false, receipt: refusal };
          }
        } }, FAIR ? { tolerance: FAIR_CONVERGED, steps: FAIR_CONVERGED_STEPS } : undefined,
      ));
      if (typeof fit === "string") return refuse(fit);
      stage.push({ name: "coupled nonlinear solve", detail: { iteration: fit.iteration, incidence: fit.incidence,
        objective: fit.objective, stopped: fit.stopped, timings: fit.timings, steps: fit.steps, outlineRefusal: fit.outlineRefusal } });
      if (fit.outlineRefusal !== null) return refuse(fit.outlineRefusal);
      if (fit.incidence > physics.tolerance) return refuse("registered physical incidence remained outside the source tolerance");
      const sealed = fit.seal;
      if (sealed === undefined) return refuse("the final coupled source did not reach its admitted exact-state seal");
      if (typeof sealed === "string") return refuse(sealed);
      stage.push({ name: "actual terminal incidence, rails and valleys", detail: sealed.terminal });
      stage.push({ name: "actual all-child composition and independent held material", detail: sealed.proof });
      if (sealed.proof.refusal !== null) return refuse(sealed.proof.refusal);
      return { owner: plan.owner.name, admitted: true, refusal: null, stage, families: Object.fromEntries(sealed.canonical) };
    } catch (error: unknown) { return refuse(error instanceof Error ? error.message : String(error)); }
  }

  /** Run every part and write the receipt and the renders. */
  export async function main(): Promise<void> {
    const started: number = performance.now();
    const args: string[] = process.argv.slice(2);
    const group = groupRequest(args);
    const jointRoots: string[] = args.filter((argument: string): boolean => argument.startsWith("--joint-root="));
    const jointRoot: string | undefined = jointRoots[0]?.slice("--joint-root=".length);
    const rootParts: string[] = args.filter((argument: string): boolean => !argument.startsWith("--"));
    const rootFit: boolean = group !== undefined || (jointRoot !== undefined && args.includes("--fit-retained"));
    if (jointRoots.length !== 0) {
      const allowed = rootFit
        ? /^(--joint-root=|--to=|--seed-tail=stored@|--out=|--fit-retained$)/
        : /^(--joint-root=|--wall=|--splice=stored@|--out=)/;
      const required: readonly string[] = rootFit
        ? ["--to=", "--seed-tail=stored@"]
        : ["--wall=", "--splice=stored@"];
      if (jointRoots.length !== 1 || !["fan.hand", "fan.leg", "crotch"].includes(jointRoot!) ||
          rootParts.length !== 1 || ![...required, "--out="].every((flag: string): boolean =>
            args.filter((argument: string): boolean => argument.startsWith(flag)).length === 1) ||
          args.some((argument: string): boolean => argument.startsWith("--") && !allowed.test(argument)))
        throw new Error("--joint-root needs one authored child, one actual composer, an explicit output, and either the retained fit or the exact stored splice");
    }

    // A run names what it does: one or more parts, a reading that takes none (`--divides`, `--emit-joints`), or `--all` for every part.
    // With no argument the tool used to fit every part, an hour of work that a launcher which lost its arguments started twice.
    const prefixFlag: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--verify-prefix="));
    if (group === undefined && prefixFlag === undefined && !process.argv.slice(2).some((argument: string): boolean => !argument.startsWith("--") || ["--divides", "--emit-joints", "--all"].includes(argument)))
      throw new Error("FamilyConicBody: name a part to fit (for instance `arm --to=376.55 --out=<directory>`), a reading (`--divides`, `--emit-joints`), or `--all` to fit every part; nothing was run");
    const root: string = path.resolve(process.cwd(), "..");
    // `--out=<directory>`: the run's receipt, families and frames go to that directory (a named round under the Human package's shots)
    // instead of a dated one under the test package's.
    const out: string = process.argv.find((argument: string): boolean => argument.startsWith("--out="))?.slice("--out=".length) ?? path.join(root, "test/.shots/family-conic-body", new Date().toISOString().replaceAll(":", "-"));
    if (group !== undefined || jointRoot !== undefined) {
      const directory: string = await fs.realpath(path.dirname(out));
      const evidence: string = await fs.realpath(path.join(root, "packages/human/.shots/joints-batch-20261117"));
      const relative: string = path.relative(evidence, directory);
      if (!path.isAbsolute(out) || path.isAbsolute(relative) || relative === ".." || relative.startsWith(".." + path.sep))
        throw new Error("--joint-root needs a fresh explicit output under " + evidence);
      await fs.mkdir(out);
    } else await fs.mkdir(out, { recursive: true });
    // `--readings=<n>`: a measurement bound. The run exits normally after the group fit's n-th returned geometry reading (1 the start,
    // 2 its first derivative, 3 the first trial), so `node --cpu-prof` writes its profile of exactly those readings. Nothing is emitted.
    const readings: number = Number(args.find((arg: string): boolean => arg.startsWith("--readings="))?.slice("--readings=".length) ?? Infinity);
    let readingsSeen: number = 0;
    const log = (event: string, detail: object): void => {
      process.stdout.write(JSON.stringify({ event, ...detail, elapsedMs: Math.round(performance.now() - started) }) + "\n");
      const d = detail as { action?: string; state?: string };
      if (event === "family-body-group-iteration" && d.action === "geometry" && d.state === "returned" && ++readingsSeen >= readings) process.exit(0);
    };
    log0 = log;
    if (prefixFlag !== undefined) {
      if (process.argv.slice(2).some((argument: string): boolean => argument !== prefixFlag && !argument.startsWith("--out=")))
        throw new Error("--verify-prefix only accepts an additional output directory");
      await replayPrefixes(prefixFlag.slice("--verify-prefix=".length), out, log);
      return;
    }
    const source: R.ISource = await R.load(root);
    const groupPlan = group === undefined ? undefined : groupPhase(log, group.name, "original group declaration",
      () => FamilyConicDivide.composition(group.name));
    if (group !== undefined && groupPlan !== undefined) {
      const declared = new Set(groupPlan.owner.children.map((entry): string => groupPlan.originalOf(entry.partFace)));
      if (declared.size !== group.members.size || [...declared].some((part): boolean => !group.members.has(part)))
        throw new Error("the explicit group roster differs from its actual composed source owners");
    }
    const singlePlan = jointRoot === undefined ? undefined : FamilyConicDivide.composed(jointRoot, rootParts[0]!);
    const rootPlan = singlePlan;
    if (rootPlan !== undefined) {
      log("family-body-actual-compose-entrance", { owner: jointRoot, requested: rootParts[0], sourceFirst: rootPlan.first, cuts: rootPlan.cuts });
      if (rootFit && rootPlan.cuts.find((cut): boolean => cut.name === rootParts[0])?.refusal === null) {
        log("family-body-root-support", { part: rootParts[0], kept: "the original already crosses the actual end plane" });
        return;
      }
    }
    const joint = (name: string): R.V => source.joints.get(name)!;
    // The armscye's landmark loop on the skin (`FamilyConicLoop`), which divides the shoulder's skin between the trunk and the arm.
    const armscye: FamilyConicLoop.ILoop = FamilyConicLoop.build(source);
    // Every surface two neighbouring parts divide the skin by, declared once (`FamilyConicDivide`): a part's clip is its side of each,
    // so no two parts fit the same skin. The trunk's foot stands at 808 mm, its course's floor (780) plus its first station (28).
    const divides: FamilyConicDivide.ISurface[] = [];
    const divided = (name: string): ((p: R.V) => number) => FamilyConicDivide.outside(divides, name);
    // The trunk holds both sides: its side of each surface and of each surface's image in the median plane.
    const trunkDivided = (p: R.V): number => Math.max(divided("trunk")(p), divided("trunk")([p[0], p[1], -p[2]]));
    const only: string[] = group === undefined ? rootParts : [...group.members.keys()];
    if (process.argv.includes("--emit-joints")) {
      const emitted: { text: string; world: Record<string, R.V> } = joints(source);
      await fs.writeFile(path.join(root, "packages/human/src/generation/f1/AutoMovieHumanF1Joints.ts"), emitted.text);
      await fs.writeFile(path.join(out, "joints.world.json"), JSON.stringify({ points: emitted.world }));
    }
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
      return { name, centres, course: "[" + [...keys, "J." + joints[0]!.replace("_01_r", "") + "End"].join(", ") + "]", halves: centres.slice(1, -1).map((): number => 5), up, domain: "auto", step: 2, gap: 6, tip: true, mirrored: true, layouts: LIMB, reliefs: [], clip: divided(name), opening: divided(name), around: 1 };
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
    // Within 15 mm of the thumb's course from 42 mm past its first joint: the face the thumb comes out of, where the hand's nets hold the
    // wall so the thumb's merge finds its meeting. Read on the reference (`FamilyConicScan.ts thumbweb`): toward the index finger the thumb's
    // skin first stands free at 42 mm along (11.8 mm from the line, then the web's air; before that the ray runs through the hand's flesh
    // to 48 to 51 mm), and from there it lies at most 14.0 mm from the line in any of five directions, so 15 mm holds it with 1 mm to spare.
    // Held from 30 mm, the hold also took the hand's own skin over the thumb's base, 32 to 37 mm along and 13.0 to 14.0 mm from the line,
    // where the hand's wall laid on its sound neighbours stood 2 to 4 mm proud and the nets could not take it back (`--skin-held`, hold
    // depths 0.47 to 1.99 mm at 556 to 564 mm on the hand).
    const thumbHold = (p: R.V): number => {
      const a: R.V = joint("thumb_01_r");
      const b: R.V = joint("thumb_03_r");
      const length: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const along: number = ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1]) + (p[2] - a[2]) * (b[2] - a[2])) / length;
      return Math.min(along - 42, 15 - Math.hypot(p[0] - a[0] - (along * (b[0] - a[0])) / length, p[1] - a[1] - (along * (b[1] - a[1])) / length, p[2] - a[2] - (along * (b[2] - a[2])) / length));
    };
    const armCentres: R.V[] = [ARM_ROOT, ARM_TURN, joint("lowerarm_r"), joint("hand_r"), joint("middle_01_r"), toward(joint("middle_01_r"), fingers, KNUCKLE.reach)];
    const armHalves: number[] = [SHOULDER_HALF_MM, 30, 10, KNUCKLE.half];
    const arm: { shift: number; up: R.V; plane: number; turned: number } = ((): { shift: number; up: R.V; plane: number; turned: number } => {
      const formerCentres: R.V[] = [joint("upperarm_r"), ...armCentres.slice(2, 5)];
      const former: IAutoMovieViewAxis.IRun[] = AutoMovieViewAxis.runs(formerCentres, [30, 10]) as IAutoMovieViewAxis.IRun[];
      const next: IAutoMovieViewAxis.IRun[] = AutoMovieViewAxis.runs(armCentres, armHalves) as IAutoMovieViewAxis.IRun[];
      const shift: number = round(next[2]!.start - next[2]!.from - (former[1]!.start - former[1]!.from));
      const at: number = (former[1]!.start + former[1]!.end) / 2;
      const old: IAutoMovieLoftSectionFrame = (AutoMovieViewAxis.jointed(formerCentres, [30, 10], [1, 0, 0]) as IAutoMovieViewAxis.IAxis).at(at);
      const roll = (up: R.V): number => {
        const now: IAutoMovieLoftSectionFrame = (AutoMovieViewAxis.jointed(armCentres, armHalves, up) as IAutoMovieViewAxis.IAxis).at(at + shift);
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
      const now: IAutoMovieViewAxis.IRun[] = AutoMovieViewAxis.runs(armCentres, armHalves) as IAutoMovieViewAxis.IRun[];
      const next: IAutoMovieViewAxis.IRun[] = AutoMovieViewAxis.runs(isbCentres, isbHalves) as IAutoMovieViewAxis.IRun[];
      const delta: number = round(next[1]!.start - next[1]!.from - (now[2]!.start - now[2]!.from));
      const at: number = (now[2]!.start + now[2]!.end) / 2;
      const old: IAutoMovieLoftSectionFrame = (AutoMovieViewAxis.jointed(armCentres, armHalves, arm.up) as IAutoMovieViewAxis.IAxis).at(at);
      const d: R.V = [isbCentres[1]![0] - isbCentres[0]![0], isbCentres[1]![1] - isbCentres[0]![1], isbCentres[1]![2] - isbCentres[0]![2]];
      const l: number = Math.hypot(d[0], d[1], d[2]);
      const t: R.V = [d[0] / l, d[1] / l, d[2] / l];
      // Two directions square to the first segment, and the up among them, by the angle, whose forearm chart turns least from the old one.
      const e1: R.V = ((): R.V => { const x: R.V = [1 - t[0] * t[0], -t[0] * t[1], -t[0] * t[2]]; const n: number = Math.hypot(x[0], x[1], x[2]); return [x[0] / n, x[1] / n, x[2] / n]; })();
      const e2: R.V = [t[1] * e1[2] - t[2] * e1[1], t[2] * e1[0] - t[0] * e1[2], t[0] * e1[1] - t[1] * e1[0]];
      const roll = (theta: number): number => {
        const up: R.V = [Math.cos(theta) * e1[0] + Math.sin(theta) * e2[0], Math.cos(theta) * e1[1] + Math.sin(theta) * e2[1], Math.cos(theta) * e1[2] + Math.sin(theta) * e2[2]];
        const frame: IAutoMovieLoftSectionFrame = (AutoMovieViewAxis.jointed(isbCentres, isbHalves, up) as IAutoMovieViewAxis.IAxis).at(at + delta);
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
    // The hand's and the leg's section planes at their courses' stations for the third metacarpal's head and the ball of the foot
    // (`AutoMovieHumanCourseRuns.joints`: the middle of each turn), where the fingers and the toes part from them.
    const sectionAt = (centres: R.V[], halves: number[], up: R.V, index: number): FamilyConicDivide.IEnd => {
      const frame: IAutoMovieLoftSectionFrame = (AutoMovieViewAxis.jointed(centres, halves, up) as IAutoMovieViewAxis.IAxis).at(AutoMovieHumanCourseRuns.joints(centres, halves)[index]!);
      return { point: [frame.origin[0], frame.origin[1], frame.origin[2]], normal: [frame.v[1] * frame.u[2] - frame.v[2] * frame.u[1], frame.v[2] * frame.u[0] - frame.v[0] * frame.u[2], frame.v[0] * frame.u[1] - frame.v[1] * frame.u[0]] };
    };
    const legCentres: R.V[] = [joint("thigh_r"), joint("calf_r"), joint("foot_r"), [133, 20, 157], toward([133, 20, 157], toes, TOE_TURN.reach)];
    const wrist = AutoMovieHumanF1.wristPlane(K.axis({ centres: armCentres, halves: handHalves, up: arm.up }));
    divides.push(...FamilyConicDivide.build(source, armscye, groupPlan?.foot ?? rootPlan?.foot ?? 808, groupPlan?.ends ?? rootPlan?.ends ?? {
      hand: sectionAt(armCentres, handHalves, arm.up, 4),
      foot: sectionAt(legCentres, [40, 62, TOE_TURN.half], [1, 0, 0], 3),
      wrist,
    }));
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
        { name: "arm", centres: isbCentres, course: "[J.toward(J.upperarm, [[J.lowerarm, J.upperarm]], " + ISB_PROXIMAL_MM + "), J.lowerarm, J.hand, J.middle1, J.handEnd]", halves: isbHalves, up: isb.up, domain: [ARM_FIRST_MM, KNUCKLE.end + isb.delta], gap: (s: number): number => (s < ISB_PROXIMAL_MM + 80 ? 6 : GAP_MM), tip: KNUCKLE.end + 15 + isb.delta, cap: 570.45 + isb.delta, covered: true, mirrored: true, layouts: ARM_FEATURES.length > 0 ? featureGrooves(ARM_FEATURES) : ARM_GROOVES.length === 0 ? LIMB : [{ layout: C.inflected(1, ARM_GROOVES), depth: 1 }], ...(process.argv.includes("--arm-skin") ? { skin: "outer" as const } : {}), reliefs: "auto", rounds: [
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
        ], clip: divided("arm"), opening: divided("arm"), around: 1, reliefEnd: KNUCKLE.relief + isb.delta },
        // The hand from the wrist on, its own family on the arm's course with a wider knuckle turn (`HAND_KNUCKLE_HALF`), continued from the
        // arm's open end by a band (`IAutoMovieConstructionContinuation.band`): on the arm's turn of 16 mm a side (radius 78 mm) the hand's
        // ulnar edge stands 69 mm inside the turn and its sections nearly cross there, a crease along the palm side of the little finger's root.
        { name: "hand", centres: armCentres, course: "[J.armRoot, J.armTurn, J.lowerarm, J.hand, J.middle1, J.handEnd]", halves: handHalves, up: arm.up, domain: [HAND_FROM, KNUCKLE.end], gap: GAP_MM, tip: KNUCKLE.end + 15, cap: 570.45, covered: true, mirrored: true, layouts: HAND_FEATURES.length > 0 ? featureGrooves(HAND_FEATURES) : LIMB, ...(process.argv.includes("--hand-skin") ? { skin: "outer" as const } : {}), reliefs: "auto", rounds: [
          { name: "hand", stations: [HAND_FROM + 4, KNUCKLE.relief], rows: 31, columns: 38, reach: 14, hold: thumbHold, fade: [15, 25] },
          // Casts that run along the skin are left unobserved (`graze`, 20 degrees as the chest's side): stored without it, the palm's net
          // alternated row by row over its 5 mm rows (+5.8, -9.0, +6.9 mm at rows 4 to 6) and drew four ridges across the palm
          // (`hand.low-oblique`, `hand.roots.low-oblique`).
          { name: "palm", stations: PALM.stations, rows: PALM.rows, columns: PALM.columns, reach: 14, hold: thumbHold, graze: 20, window: { phases: PALM.phases, fade: PALM.fade, fadePhase: PALM.fadePhase } },
        ], clip: divided("hand"), opening: divided("hand"), around: 1, reliefEnd: KNUCKLE.relief },


        // The leg turns at the ankle and runs on to the ball of the foot, its sections fanning round the instep, so the heel is lofted and the ankle
        // is no seam. The ankle's turn is long enough that its tightest radius, 2 h / (1.875 angle) = 46 mm, stays outside the instep. Round the
        // turn the heel sweeps about 2.7 times faster than the station. Knots 6 mm apart there stood in a cluster of nine from 776 to 856 mm,
        // and their cubics drew a level ring above the ankle; at least 12 mm apart the ring is gone and the wall is 693 numbers at the same mean.
        // A course that leaves the ankle square to the row of toe joints, with the forefoot read as the curve round all the toes, was tried;
        // its wall stalled above 3 mm, so the foot keeps this course and closes at the toe webs, and the toes are merged onto that cap.
        // The leg's end turns from the sole round the forefoot's lateral edge within one arc, the one after anchor 5 (from the sole's
        // lateral median to the lateral side extreme, about 230 to 245 degrees). On the refined limb(1) start of the foot end that arc's end
        // tangent meets its chord at 0.051 to 0.078 of the chord's length at every station from 880 to 975 mm, so the default margin of 0.1
        // refused all 762 readings (the start's margins under --seeds). A conic arc is admissible for any meeting strictly inside its
        // chord's ends; the margin guards the engine's spline between stations, and the armpit's vault was admitted on the native path at
        // 0.072. 0.04 holds the least measured meeting, 0.051, with the spread between stations.
        { name: "leg", centres: [joint("thigh_r"), joint("calf_r"), joint("foot_r"), [133, 20, 157], toward([133, 20, 157], toes, TOE_TURN.reach)], course: "[J.thigh, J.calf, J.foot, J.footBall, J.footEnd]", halves: [40, 62, TOE_TURN.half], up: [1, 0, 0], domain: [104, TOE_TURN.end], gap: 12, tip: TOE_TURN.end + 15, covered: true, mirrored: true, layouts: LIMB, reliefs: "auto", reliefEnd: TOE_TURN.relief, margin: 0.04, clip: divided("leg"), opening: divided("leg"), around: 1, casts: [{ name: "sole", stations: [930, TOE_TURN.relief], axis: [0, 1, 0], rows: 16, columns: 35, reach: 6, facing: 0.8, nearest: true }] },

        // A stretch of the leg as a family of its own on the leg's course, fitted to its skin with grooves carried by inflection lines
        // (`FamilyConicSection.inflected`): `--segment=<from>,<to>`, `--segment-grooves=<anchors>`, `--segment-up=<x,y,z>` (the chart's seed,
        // turned so a hollow falls after a `u` extreme), `--segment-gap=<mm>`. A trial for the foot's end before its split and the heel.
        ...(SEGMENT === undefined ? [] : [{ name: "segment", centres: [joint("thigh_r"), joint("calf_r"), joint("foot_r"), [133, 20, 157], toward([133, 20, 157], toes, TOE_TURN.reach)] as R.V[], course: "[J.thigh, J.calf, J.foot, J.footBall, J.footEnd]", halves: [40, 62, TOE_TURN.half], up: SEGMENT.up, domain: SEGMENT.domain, gap: SEGMENT.gap, mirrored: true, layouts: [{ layout: SEGMENT.features.length > 0 ? C.featured(C.limb(1), SEGMENT.features) : SEGMENT.grooves.length === 0 ? C.limb(1) : C.inflected(1, SEGMENT.grooves), depth: 1 }], reliefs: [] as IWindow[], skin: "inner" as const }]),
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
          // 16 by 21: the survey of issue #3197 (stage B2) projected the stored 31 by 39 net onto this grid within 0.027 mm of its own
          // surface, under the 0.1 mm bound of a net that carries the nose (`FamilyConicCoarse.ts --plan`).
          { name: "under", stations: [22.5, 27], phases: [Math.PI - 1.1, Math.PI + 1.1], axis: [0, 1, 0], rows: 16, columns: 21, reach: 2.5, mirror: true, fade: [1, 1.5], fadePhase: [0.35, 0.35] },
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
        { name: "axilla", centres: AXILLA, course: "J.axilla", halves: [8, 5], up: [0, 1, 0], domain: AXILLA_DOMAIN, step: 1, gap: 4, first: AXILLA_DOMAIN[0] - AXILLA_CAPS_MM[0], tip: AXILLA_DOMAIN[1] + AXILLA_CAPS_MM[1], mirrored: true, skin: "inner", margin: AXILLA_MARGIN, construct: { knots: [25, 34, 43, 52, 61, 70, 78], corner: CONSTRUCT_CORNER_MM, apex: CONSTRUCT_APEX_MM }, air: { band: AXILLA_BAND, floor: AXILLA_FLOOR, reach: 12, inset: AXILLA_INSET, sag: 0, side: AXILLA_ARM_SIDE_MM }, layouts: AXILLA_LAYOUTS[process.argv.find((a: string): boolean => a.startsWith("--axilla-layout="))?.slice("--axilla-layout=".length) ?? "groove"]!, reliefs: [] },
        // The vault in front of the armpit as a cutter of its own (G11): the arm's band crosses it flat, 12 to 16 mm under the reference's
        // vault, its columns running aslant to the vault's planes. Every section of the vault is convex, so the plain 8-conic limb carries it
        // (0.56 mm on the same sections, where the slit's groove stalled at 1.67 mm). Its sections are the vault's air, read as the slit's
        // are, with a reach of 20 mm, since the vault is up to 28 mm wide. Both ends close: its back tip at x about 0, clear of the slit
        // cutter's front tip at x -1.9.
        { name: "vault", centres: VAULT, course: "J.vault", halves: [], up: [0, 1, 0], domain: [2, 18], step: 1, gap: 4, first: -1, tip: 20, mirrored: true, skin: "inner", construct: { knots: [2, 10, 18], corner: CONSTRUCT_CORNER_MM, apex: CONSTRUCT_APEX_MM }, air: { band: AXILLA_BAND, floor: [[0, VAULT_FLOOR_MM]], reach: 20, inset: VAULT_INSET }, layouts: [{ layout: C.limb(1), depth: 1 }], reliefs: [] },
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
        { name: "trunk", centres: [[0, 780, 0], [0, 1705, 0]], course: "[J.axisFloor, J.axisCrown]", halves: [], up: [1, 0, 0], domain: [28, 912], whole: true, step: 2, gap: (s: number): number => (s >= 692 && s <= 732 ? Number(process.argv.find((argument: string): boolean => argument.startsWith("--jaw="))?.slice(6) ?? 3) : s > 740 ? FACE_GAP_MM : 12), tip: true, cap: 906, centre: [16, 0], own: true, mirrored: false, layouts: TRUNK_LINES ? TRUNK_LINED : BILATERAL, ...(TRUNK_LINES ? { skin: "outer" as const, folded: "hull" as const, hullFrom: CHIN.y - 780 } : {}), opening: trunkDivided, round: chin, kept: breasts, unseen: nose, clip: (p: R.V): number => Math.max(ear(p), noseCut(p), chin(p), breasts(p), trunkDivided(p)), reliefs: [
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
          // Over the shoulder's up-facing slope the window's casts, square to the side in the section planes, met the skin 4 to 13 degrees
          // from its plane, nearly along it, with heights of 8 to 23 mm, and drew the notch over each collar bone ([30, 1388, +-103], 14.1
          // deg/mm against 1.6) and the crumple on the shoulder's top toward the neck ([2, 1411, +-97], 2.8 against 0.5). Casts within 20
          // degrees of the skin's plane, judged on its 3D normal, are left to the shoulder's casts straight down (`graze`, lofting.md).
          // The side's net sees the trunk's own skin only (no `uncut`). While it read the arm's skin 25 mm past the cut, so that a port's band
          // had two walls that agreed, the trunk's surface beside the armscye was the arm's skin fitted a second time: the two fits stood
          // 0.1 to 1.0 mm apart over the shoulder's cap and wove through each other, and under the arm the trunk's own net held the fold's
          // floor on a radius of 4.06 mm, which no fold of a larger radius can roll on (`packages/human/docs/techniques/joints-one-shot.md`,
          // the armscye's premises). Each skin is fitted once: the trunk on its side of the armscye's surface (`armHole`), the arm on the
          // other. Inside the arm's opening the trunk has no skin and its surface is its wall, so the net is held there (`hold`), rising
          // from the opening's edge over one control spacing: left to its fairness alone, it carried the shoulder's slope on past the cut
          // and stood a rounded stump out to the deltoid's side, a hood over the arm on the joint realized alone (`armscye.front`
          // px 260..460 x 290..440).
          { name: "trunk.chest.side", stations: [400, 680], phases: [Math.PI / 2 - 0.82, Math.PI / 2 + 0.82], axis: [0, 0, -1], turn: [1, 0, 0], rows: 59, columns: 53, mirror: false, twin: true, reach: 25, fade: [30, 90], graze: 20, hold: trunkDivided, holdWidth: "span" },
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
          // The ear's hold is judged where a cast lands (`holdLanding`) and spans the net's control spacing at its edge (`holdWidth: "span"`): held
          // where its wall point stood in the ear's box, the net left the head 4 to 7 mm proud of the skin round the bowl (s 796, x 4 to 24, the
          // skin 72.5 to 75.5 mm out against the wall's 77 to 80), a shelf the helix's crus and the inferior crus sink into (E4). Its edges down
          // the back hand over to `trunk.head.back` (`fadePhase`): whole up to them, it drew an upright pair 0.115 rad inside them, 10.09
          // against 0.94 deg/mm at s 880 (lofting.md: "A relief's window must contain the whole region where its height is nonzero").
          { name: "trunk.head", stations: [620, 906], phases: [-Math.PI + 0.15, Math.PI - 0.15], axis: [-1, 0, 0], turn: [0, 0, -1], rows: 59, columns: 109, mirror: true, reach: 35, fade: [30, 30], fadePhase: [0.3, 0.3], hold: earHeld, holdLanding: true, holdWidth: "span" },
          // The head's net is zero along its seam down the back, where the skin still lies inside the tape and a ridge stood; this window
          // over the back takes what the first leaves there. Its edges round the head hand over (`fadePhase`): with hard edges at 2.14 rad
          // they drew upright lines down the back of the head and behind each ear (`figure.back` px 400..500 x 160..230, `head.left` px 270..290).
          { name: "trunk.head.back", stations: [620, 906], phases: [Math.PI - 1.0, Math.PI + 1.0], axis: [1, 0, 0], turn: [0, 0, 1], rows: 60, columns: 39, mirror: true, reach: 20, fade: [30, 30], fadePhase: [0.3, 0.3], hold: earHeld, holdLanding: true, holdWidth: "span" },
          // The crown's own net, over the cap to its pole, fitted after the head's two nets so their rows below stay as they were (the concha's
          // rails stand on them). The head's nets end at the cap's base and leave the plain wall's misfit there, 2.3 mm inside the skull at
          // x -34 (the hull wall on convex skin), from which the cap rose 1.4 mm proud by x -24, a corner at the crown's back. Its rows are
          // 1 mm apart, the cap's own ring spacing near its base, and it vanishes with zero slope over the cap's last third (`fade`), where a
          // height that varied with the phase would draw rings round the pole.
          // At 36 rows, 1 mm apart, every other row lay between the fitting sections, 2 mm apart, and was seen by none: the net zigzagged
          // row to row and drew rings round the crown on its row knots (887.0, 896.0, 898.0, 899.95, 902.0, 903.9, 905.9 mm; 4.4 to 5.3
          // deg/mm against 0.65 to 1.2). At 12 rows, about 3 mm apart, each row is seen by two sections, as the fold's net is.
          { name: "trunk.crown", stations: [886, 918.88], phases: [0, 2 * Math.PI], axis: [1, 0, 0], turn: [0, 0, 1], rows: 12, columns: 83, mirror: false, periodic: true, reach: 10, fade: [12, 4.3] },
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
          // It rests on the wall where it sees no skin (`rest`): the skin that faces forward or outward on the shoulder's front is not this
          // net's, and carried across it by fairness alone the net stood a bump there (`ICast.rest`).
          { name: "shoulder", stations: [596, 664], phases: [0.95, 1.95], axis: [0, -1, 0], rows: 17, columns: 27, reach: 8, facing: 0.8, twin: true, nearest: true, fade: [12, 12], fadePhase: [0.2, 0.2], rest: true },
          // No net over the crown. The conic cap stood 3 to 4 mm under the skull and a coarse net cast along the course lifted it; the cap
          // that bends as the wall does is full enough, and meshed in rings the net drew rings round the pole.
        ] },
      ] satisfies IPart[]
    ).filter((part: IPart, i: number, all: IPart[]): boolean => (only.length === 0 || only.includes(part.name)) && all.findIndex((other: IPart): boolean => other.name === part.name) === i).map((part: IPart): IPart => {
      const registered = groupPlan?.member(part.name).family ?? rootPlan?.family;
      return registered === undefined ? part : { ...part, centres: registered.centres, halves: registered.halves, up: registered.up, roll: registered.roll };
    });
    if (rootPlan !== undefined && parts.length !== 1)
      throw new Error("the fitting instrument does not declare the selected authored child");
    // `--head=<heightMm>,<degrees>,<halfMm>`: a trial of the trunk's course turning backward at that height by that angle, to read (with
    // `--observe`) how its tilted planes cut the jaw and the skin under it. Turned at 1,430 mm by 30, 45 and 60 degrees, a plane takes
    // in the chin and the throat together and the tape bridges them: hollows of 46 to 81 mm against 4 mm on level planes, and no loop
    // round the course above the mouth. Level planes are the head's; only the 25 mm under the jaw change fast along them.
    // `--frames-of=<directory>`: rendering only. For each named part whose fitted family stands in the directory (`<part>.family.json`),
    // the part alone framed on its own box from six sides: its kept skin in clay and its free closure (where its face stands on a
    // neighbour's side of a dividing surface, `IPart.clip` positive) in a darker shade, beside the reference's skin cut to the same box
    // and a frame with both, the reference lighter. A digit's root, its closure and its splice cannot be judged on a whole-figure frame,
    // where a finger is 60 px long.
    const framesOf: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--frames-of="))?.slice("--frames-of=".length);
    if (framesOf !== undefined) {
      NodeCanvasRaster.initialize();
      for (const part of parts) {
        const file: string = path.join(framesOf, part.name + ".family.json");
        const definition: K.IStored | null = await fs.readFile(file, "utf8").then((text: string): K.IStored | null => JSON.parse(text) as K.IStored).catch((): null => null);
        if (definition === null) continue;
        const [first, last]: [number, number] = [definition.knots[0]!, definition.knots.at(-1)!];
        const stations: number[] = Array.from({ length: Math.ceil(last - first) + 1 }, (_: unknown, i: number): number => Math.min(last, first + i));
        const loft: IAutoMovieViewLoft.IResult = K.create({ ...definition, tips: undefined }, stations);
        if (loft.chain === null) {
          log("family-body-frames", { part: part.name, refused: loft.diagnostics });
          continue;
        }
        const chain: NonNullable<IAutoMovieViewLoft.IResult["chain"]> = loft.chain;
        const rings: R.V[][] = stations.map((s: number): R.V[] => Array.from({ length: 128 }, (_: unknown, j: number): R.V => AutoMovieLoftChain.point(chain, s, (2 * Math.PI * j) / 128) as R.V));
        const positions: number[] = rings.flatMap((ring: R.V[]): number[] => ring.flatMap((p: R.V): number[] => [p[0] / 1000, p[1] / 1000, p[2] / 1000]));
        const [kept, closed]: number[][] = [[], []];
        let [free, all]: [number, number] = [0, 0];
        for (let i: number = 0; i + 1 < rings.length; ++i)
          for (let j: number = 0; j < 128; ++j) {
            const [a, b]: [number, number] = [i * 128 + j, i * 128 + ((j + 1) % 128)];
            const middle: R.V = [0, 1, 2].map((k: number): number => (rings[i]![j]![k]! + rings[i + 1]![j]![k]! + rings[i]![(j + 1) % 128]![k]! + rings[i + 1]![(j + 1) % 128]![k]!) / 4) as R.V;
            const invented: boolean = part.clip !== undefined && part.clip(middle) > 0;
            (invented ? closed : kept)!.push(a, a + 128, b, b, a + 128, b + 128);
            ++all;
            if (invented) ++free;
          }
        // The part's box, 8 mm wider each way, and the reference's triangles with a corner inside it.
        const low: number[] = [0, 1, 2].map((k: number): number => Math.min(...rings.flat().map((p: R.V): number => p[k]!)) - 8);
        const high: number[] = [0, 1, 2].map((k: number): number => Math.max(...rings.flat().map((p: R.V): number => p[k]!)) + 8);
        const inside = (v: number): boolean => [0, 1, 2].every((k: number): boolean => source.all.positions[3 * v + k]! >= low[k]! && source.all.positions[3 * v + k]! <= high[k]!);
        const cut: number[] = [];
        for (let i: number = 0; i + 2 < source.all.indices.length; i += 3) if (inside(source.all.indices[i]!) || inside(source.all.indices[i + 1]!) || inside(source.all.indices[i + 2]!)) cut.push(source.all.indices[i]!, source.all.indices[i + 1]!, source.all.indices[i + 2]!);
        const reference: N.Mesh = { id: "reference", positions: Array.from(source.all.positions, (x: number): number => x / 1000), indices: cut, colour: [0.64, 0.65, 0.67] };
        const fitted: N.Mesh[] = [
          { id: part.name, positions, indices: kept!, colour: [0.64, 0.65, 0.67] },
          { id: part.name + ".closure", positions, indices: closed!, colour: [0.3, 0.42, 0.62] },
        ];
        const bounds: N.Point[] = rings.flat().map((p: R.V): N.Point => [p[0] / 1000, p[1] / 1000, p[2] / 1000]);
        for (const view of ["front", "back", "left", "right", "high-oblique", "low-oblique"]) {
          const camera: N.Camera = NodeCanvasCamera.fit(view, bounds, 900, 900);
          for (const [stage, shown] of [["reference", [reference]], ["family", fitted], ["both", [...fitted, { ...reference, id: "reference.light", colour: [0.86, 0.8, 0.62] }]]] as [string, N.Mesh[]][])
            await fs.writeFile(path.join(framesOf, `${part.name}.own.${view}.${stage}.png`), NodeCanvasRaster.render(camera, shown, [], "depth", `f1 | ${part.name} alone, ${stage}; closure blue | ${view}`).png);
        }
        log("family-body-frames", { part: part.name, stations: [first, last], closureShare: Math.round((1000 * free) / all) / 1000, box: [low.map(Math.round), high.map(Math.round)] });
      }
      return;
    }
    // `--divides`: the complement check of every dividing surface, and nothing else. For each surface, over the reference's vertices
    // within 30 mm of it, inside its region and within its reach of the joint it belongs to: how many no part of that joint keeps (skin
    // left out) and how many more than one keeps (skin fitted twice), read on the parts' own declared clips. A mirrored part is the
    // stored part read at the mirrored point. The joint's parts are complements when both counts are 0.
    if (process.argv.includes("--divides")) {
      const vertices: R.V[] = [];
      for (let i: number = 0; i + 2 < source.all.positions.length; i += 3) vertices.push([source.all.positions[i]!, source.all.positions[i + 1]!, source.all.positions[i + 2]!]);
      const clipOf = (name: string): ((p: R.V) => number) | null | undefined => {
        const base: string = name.replace(/\.mirror$/, "");
        const found: IPart | undefined = parts.find((part: IPart): boolean => part.name === base);
        if (found === undefined) return undefined;
        if (found.clip === undefined) return null;
        return name.endsWith(".mirror") ? (p: R.V): number => found.clip!([p[0], p[1], -p[2]]) : found.clip;
      };
      const lines: string[] = ["surface | parts that meet at its joint | vertices read | kept by none | kept by more than one (which)"];
      for (const surface of divides) {
        // Every part of the surface's joint: the parts of every surface in its group.
        const names: string[] = [...new Set(divides.filter((other: FamilyConicDivide.ISurface): boolean => other.group === surface.group).flatMap((other: FamilyConicDivide.ISurface): string[] => [...other.near, ...other.far]))];
        const clips: { name: string; clip: (p: R.V) => number }[] = [];
        const absent: string[] = [];
        for (const name of names) {
          const clip = clipOf(name);
          if (clip === undefined || clip === null) absent.push(name + (clip === null ? " (no clip)" : " (not declared)"));
          else clips.push({ name, clip });
        }
        if (absent.length > 0) {
          lines.push(`${surface.name} | ${names.join(", ")} | refused: ${absent.join(", ")}`);
          continue;
        }
        let [read, none]: [number, number] = [0, 0];
        const shared: Map<string, number> = new Map();
        for (const p of vertices) {
          if (Math.abs(surface.side(p)) > 30 || (surface.within !== undefined && !surface.within(p)) || Math.hypot(p[0] - surface.anchor[0], p[1] - surface.anchor[1], p[2] - surface.anchor[2]) > surface.reach) continue;
          ++read;
          const keepers: string[] = clips.filter(({ clip }: { clip: (q: R.V) => number }): boolean => clip(p) <= 0).map(({ name }: { name: string }): string => name);
          if (keepers.length === 0) ++none;
          if (keepers.length > 1) shared.set(keepers.join(" + "), (shared.get(keepers.join(" + ")) ?? 0) + 1);
        }
        lines.push(`${surface.name} | ${names.join(", ")} | ${read} | ${none} | ${[...shared.values()].reduce((sum: number, x: number): number => sum + x, 0)}${shared.size === 0 ? "" : " (" + [...shared].map(([k, v]: [string, number]): string => `${k}: ${v}`).join("; ") + ")"}`);
      }
      // Where each row's parent ends against its children's valleys (`FamilyConicValley`): on the parent's section planes about the
      // heads' plane, each pair of neighbouring digits as one chain with its valley's two depths, or apart with their gap. A composed
      // end's host ring stands within a child's rail of the children's outline only where the valleys are within the rails (half the
      // gap at which a pair first stands apart), so the heads' plane is read here against both.
      const outline = R.prepare(source.all);
      const valleys = (label: string, centres: R.V[], halves: number[], up: R.V, index: number, digits: readonly string[]): void => {
        const course: IAutoMovieViewAxis.IAxis = AutoMovieViewAxis.jointed(centres, halves, up) as IAutoMovieViewAxis.IAxis;
        const station: number = AutoMovieHumanCourseRuns.joints(centres, halves)[index]!;
        lines.push("", `${label}: the heads' plane stands at station ${station.toFixed(2)} mm of its parent's course; valleys left / right of each pair's line, mm`);
        for (const d of [-8, -4, 0, 4, 8, 12, 16, 20]) {
          const frame: IAutoMovieLoftSectionFrame = course.at(station + d);
          const normal: R.V = [frame.v[1] * frame.u[2] - frame.v[2] * frame.u[1], frame.v[2] * frame.u[0] - frame.v[0] * frame.u[2], frame.v[0] * frame.u[1] - frame.v[1] * frame.u[0]];
          const pierced: ([number, number] | null)[] = digits.map((name: string): [number, number] | null => {
            const [first, second]: R.V[] = [joint(name + "_01_r"), joint(name + "_02_r")];
            const along: R.V = [second![0] - first![0], second![1] - first![1], second![2] - first![2]];
            const rate: number = along[0] * normal[0] + along[1] * normal[1] + along[2] * normal[2];
            if (Math.abs(rate) < 1e-9) return null;
            const t: number = ((frame.origin[0] - first![0]) * normal[0] + (frame.origin[1] - first![1]) * normal[1] + (frame.origin[2] - first![2]) * normal[2]) / rate;
            const q: R.V = [first![0] + t * along[0] - frame.origin[0], first![1] + t * along[1] - frame.origin[1], first![2] + t * along[2] - frame.origin[2]];
            return [q[0] * frame.u[0] + q[1] * frame.u[1] + q[2] * frame.u[2], q[0] * frame.v[0] + q[1] * frame.v[1] + q[2] * frame.v[2]];
          });
          const pairs: FamilyConicValley.IPair[] = FamilyConicValley.pairs(outline.chains(frame), pierced);
          lines.push(`${d >= 0 ? "+" : ""}${d} mm | ` + pairs.map((pair: FamilyConicValley.IPair, i: number): string => `${digits[i]}-${digits[i + 1]} ${pair.kind === "one" ? `${pair.depths![0].toFixed(2)} / ${pair.depths![1].toFixed(2)}` : pair.kind === "apart" ? `apart ${pair.gap!.toFixed(2)}` : "no closed chain"}`).join(" | "));
        }
      };
      valleys("hand", armCentres, handHalves, arm.up, 4, FamilyConicDivide.FINGERS);
      valleys("foot", legCentres, [40, 62, TOE_TURN.half], [1, 0, 0], 3, FamilyConicDivide.TOES);
      process.stdout.write(lines.join("\n") + "\n");
      return;
    }
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
    // `--bridge=<file>`: a region's bridge from the convert tool (`FamilyConicConvert.IBridge`): the named part is fitted as one featured
    // family over the bridge's domain, its sections read on the skin and seeded at the region's own fairing cutoff, its layout one groove
    // run per converted line with each feature's window measured, so its lines appear and fade along the part (`FamilyConicSection.seedAll`)
    // and the region is split only where its topology is.
    const bridgeFile: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--bridge="))?.slice("--bridge=".length);
    if (bridgeFile !== undefined) {
      const bridged: { part: string; domain: [number, number]; fairMm: number; layout: C.ILayout } = JSON.parse(await fs.readFile(bridgeFile, "utf8"));
      for (const part of parts)
        if (part.name === bridged.part) {
          part.layouts = [{ layout: bridged.layout, depth: 1 }];
          part.domain = bridged.domain;
          part.skin = part.skin ?? "outer";
          part.fairMm = bridged.fairMm;
        }
    }
    const meshes: N.Mesh[] = [];
    const curves: N.Curve[] = [];
    const receipt: unknown[] = [];
    const collected = new Map<string, IGroupMember>();
    const meshName = (part: IPart): "head" | "all" | "body" => part.head === true ? "head" : part.whole === true ? "all" : "body";
    const selections = new Set(parts.map(meshName));
    if (group !== undefined) selections.add("all");
    const outlines = new Map([...selections].map((name) => [name, R.prepare(source[name])] as const));
    for (const part of parts) {
      const rootPlan = groupPlan?.member(part.name) ?? singlePlan;
      const setting = group?.members.get(part.name);
      const axis: IAutoMovieViewAxis.IAxis = K.axis(part);

      // Observe: exact native cuts on the course's own planes, fitting sections every STEP_MM and withheld sections midway.
      const rows: F.IRow[] = [];
      const skipped: number[] = [];
      // Why a skipped station has no section, where the cut knows.
      const missed: Map<number, string> = new Map();
      const hollows: string[] = [];
      const skins: C.P[][] = [];

      // Each section's own loop as it was cut, which for a loose part is not the hull its wall is measured against.
      const loops: C.P[][] = [];
      const step: number = part.step ?? STEP_MM;
      const gap = (s: number): number => (typeof part.gap === "function" ? part.gap(s) : (part.gap ?? GAP_MM));
      const skin: R.ISource["body"] = source[meshName(part)];
      const outline = outlines.get(meshName(part))!;
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
      const depthAt = part.name !== "concha" || CONCHA_DEPTH === undefined ? undefined : (() => {
          const half: number = CONCHA_DEPTH;
          const f0: IAutoMovieLoftSectionFrame = axis.at(0);
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
          return (a: number, b: number): number => {
            const i: number = Math.round((a + half) / 0.25);
            const j: number = Math.round((b + half) / 0.25);
            return i < 0 || j < 0 || i >= n || j >= n ? -Infinity : w[i * n + j]!;
          };
      })();
      const depthLoop = (sample: NonNullable<typeof depthAt>, s: number): C.P[] | null => {
        // Every frame's chart axes are the first frame's on a straight course; a section's point (a, b) is the grid's (a, b).
        if (!(sample(0, 0) > s)) return null;
        const loop: C.P[] = [];
        for (let k: number = 0; k < 96; ++k) {
          const phi: number = (2 * Math.PI * k) / 96;
          let r: number = 0;
          while (r < 40 && sample((r + 0.1) * Math.cos(phi), (r + 0.1) * Math.sin(phi)) > s) r += 0.1;
          if (r >= 40) return null;
          loop.push([r * Math.cos(phi), r * Math.sin(phi)]);
        }
        return loop;
      };

      // By ray of the last air section read, whether the floor or the reach stopped it; and by observed row, which of its points are invented.
      let airInvented: boolean[] | null = null;
      const invented: (boolean[] | null)[] = [];
      const provenance: IClosureProvenance = { points: new WeakSet<C.P>(), next: new WeakMap<C.P, C.P>() };
      const retainedPath = process.argv.find((a: string): boolean => a.startsWith("--dump-retained="))?.slice("--dump-retained=".length);
      const fitRetained: boolean = group !== undefined || process.argv.includes("--fit-retained");
      const initialWall: string | undefined = process.argv.find((a: string): boolean => a.startsWith("--initial-wall="))?.slice("--initial-wall=".length);
      const measuredCuts: Map<number, IMeasuredCut> = new Map();
      let readRetained: ((station: number) => boolean) | undefined;
      const mixedEdges: WeakMap<C.P, C.P> = new WeakMap();
      const retained = (a: C.P, b: C.P): boolean => provenance.next.get(a) !== b;
      const retainedHull = (a: C.P, b: C.P): boolean => mixedEdges.get(a) !== b;
      const observedDepth = (hull: readonly C.P[], p: C.P, normal: boolean): number => {
        if (provenance.points.has(p)) return NaN;
        if (normal) return inward(hull, p, retainedHull);
        const phase: number = Math.atan2(p[1], p[0]);
        return C.radius(hull, phase, undefined, retainedHull) - Math.hypot(...p);
      };
      const inventedOf = (loop: C.P[]): boolean[] | null => {
        const flags: boolean[] | null = airInvented;
        if (flags === null) return null;
        return loop.map((p: C.P): boolean => flags[Math.round(((Math.atan2(p[1], p[0]) + 2 * Math.PI) / (2 * Math.PI)) * flags.length) % flags.length]!);
      };

      // The air round the course point in the frame's plane (`IPart.air`): the skin's crossings with the plane near the course, read along
      // 360 rays to the nearest, the floor and the reach, then drawn in along the polygon's normal. A plane's cut through the body mesh
      // alone is open where it meets the head mesh, so the rays read the crossing segments, not closed loops.
      const air = (frame: IAutoMovieLoftSectionFrame, spec: NonNullable<IPart["air"]>): C.P[] | null => {
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
      // The skin's two ends of the last guided excursion cut (`X.ISection.ends`): its invented closure lies behind both.
      let ends: [C.P, C.P] | null = null;
      // Each section's closure across its part's opening (`IPart.opening`), by station: one conic, an S of two, two round the course
      // (`IPart.around`), or the chord where none is admissible.
      const closures: { s: number; kind: Closure; detail?: string; span?: [number, number]; rho?: { side: number; most: number; used: number } }[] = [];
      // Each side's closure shoulder smoothed along the stations (set before the sections are read): the largest contained at each station,
      // fitted by least squares on natural cubic splines with knots every `GAP_MM`, as the fields are projected onto their knots.
      let closureCap: ((side: number, s: number) => number | undefined) | undefined;
      // The part's whole sections by station, read in the first pass over its stations, and the tube a buried section continues: the
      // radius about the course of the whole section nearest its station (`FamilyConicClosure.continued`). Before that pass there is
      // none, and the pass's own closures, which only its count of whole sections is read from, fall to their chords.
      const trainingStations = new Set<number>();
      const wholes: Map<number, C.P[]> = new Map();
      let tubed: boolean = false;
      const tubeAt = (s: number): C.P[] | undefined => {
        if (!tubed || wholes.size === 0) return undefined;
        const nearest: number = [...wholes.keys()].reduce((best: number, k: number): number => (Math.abs(k - s) < Math.abs(best - s) ? k : best));
        return wholes.get(nearest);
      };
      const cut = (frame: IAutoMovieLoftSectionFrame, s: number): C.P[] | null => {
        piece = null;
        if (part.air !== undefined) return air(frame, part.air);
        ends = null;
        if (excursion !== undefined) {
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
        if (depthAt !== undefined) return depthLoop(depthAt, s);
        if (part.loose !== true || (part.surround !== undefined && s < part.surround.from)) {
          // A part closed round its course (`IPart.around`) reads its skin across the body's open seam at the neck, where the head's mesh
          // takes over: there the body's cut is one open chain whose ends stand 17 to 175 mm apart across the neck (f1's arm planes 16 to
          // 46 mm above the shoulder joint), and that chord lies on the parent's side, which the clip drops.
          const sourceCut = outline.cut(frame, part.around === undefined ? 3 : NECK_BRIDGE_MM, rootFit || readRetained?.(s) === true);
          const whole: C.P[] | null = sourceCut.loop;
          if (whole !== null && sourceCut.measured !== undefined) {
            const signs: number[] = whole.map((p: C.P): number => part.clip?.(chartToWorld(frame, p)) ?? -Infinity);
            measuredCuts.set(s, { frame, points: whole, measured: sourceCut.measured, signs, runs: K.measuredRuns(whole, sourceCut.measured, signs) });
          }
          if (whole === null) missed.set(s, "no loop round the course");
          if (whole === null || part.clip === undefined) return whole;
          const recorded: number = closures.length;
          const clipped: C.P[] | null = without(whole, frame, part.clip, part.round, part.opening, (kind: Closure, detail?: string, span?: [number, number], rho?: { side: number; most: number; used: number }): void => void closures.push({ s, kind, ...(detail === undefined ? {} : { detail }), ...(span === undefined ? {} : { span }), ...(rho === undefined ? {} : { rho }) }), (side: number): number | undefined => closureCap?.(side, s), tubed ? part.around : undefined, tubeAt(s), part.around === undefined ? undefined : provenance);
          // A section no surface cuts is the part's whole section there: the tube its buried sections continue.
          if (clipped !== null && closures.length === recorded && clipped.length === whole.length &&
              (!rootFit || (trainingStations.has(s) && sourceCut.measured?.every(Boolean) === true))) wholes.set(s, whole);
          if (clipped === null) missed.set(s, retainedRuns(provenance) === undefined ? "under three points kept" : "the retained skin has no supported complete contour");
          return clipped;
        }
        const inside = (hull: readonly C.P[]): boolean => hull.every((p: C.P, i: number): boolean => p[0] * hull[(i + 1) % hull.length]![1] - p[1] * hull[(i + 1) % hull.length]![0] > 0);
        const clipped: C.P[][] = outline.loops(frame)
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
      const to: string | undefined = setting === undefined ? process.argv.find((argument: string): boolean => argument.startsWith("--to="))?.slice(5) : String(setting.to);
      const whole: [number, number] = part.domain === "auto" ? span(outline, axis, part.centres) : part.domain;

      // `--from=<station>`: fit only from that station on, for the far end of a wall whose head is another fit's.
      const from: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--from="))?.slice(7);
      // `--from=kept`: from the first station, one fitting step past it, at which the part's own course point lies on the part's side of
      // every surface that divides it from a neighbour (`IPart.clip`): where a part that starts inside its neighbour first has skin of its
      // own round its course.
      const kept = (): number => {
        if (part.clip === undefined) throw new Error("--from=kept: " + part.name + " declares no clip");
        for (let s: number = 0; s <= whole[1]; s += 0.5) {
          const o: readonly number[] = axis.at(s).origin;
          if (part.clip([o[0]!, o[1]!, o[2]!]) <= 0) return s + (part.step ?? STEP_MM);
        }
        throw new Error("--from=kept: the course of " + part.name + " never reaches its own side");
      };
      const reuse: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--wall="))?.slice(7);
      const splice: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--splice="))?.slice(9);
      const reused: K.IStored | null = reuse === undefined ? null : await storedWall(reuse, part.name);
      const pureTail: boolean = splice !== undefined && !splice.split("@")[1]!.includes("..");
      const spliceAt: number = pureTail ? Number(splice!.split("@")[1]!.split("+")[0]) : -Infinity;
      const rootStation: number = pureTail && reused !== null ? reused.knots[0]! : whole[0];
      const domain: [number, number] = [rootFit ? 0 : from === undefined ? rootStation : from === "kept" ? kept() : Number(from), to === undefined ? whole[1] : Number(to)];
      if (rootFit && !(Number.isFinite(domain[1]) && domain[1] > domain[0]))
        throw new Error("the composed root's far measurement station must be finite and positive");
      // The head excursion reads the fixed unrolled course and is turned into the part's rolled chart by each section.
      const excursion = part.excursion === undefined || part.air !== undefined ? undefined : (() => {
        const entry: X.IPart | undefined = X.PARTS.find((p: X.IPart): boolean => p.name === part.excursion);
        if (entry === undefined) throw new Error("No excursion " + part.excursion);
        const plain: IAutoMovieViewAxis.IAxis = part.roll === undefined ? axis : K.axis({ centres: part.centres, halves: part.halves, up: part.up });
        return X.along(source, entry, plain.at, domain[0] - 6, domain[1] + 6, 1.5);
      })();
      const seedTail: string | undefined = setting === undefined ? process.argv.find((argument: string): boolean => argument.startsWith("--seed-tail="))?.slice("--seed-tail=".length) : "stored@" + setting.mark;
      const inherited = seedTail === undefined ? null : await (async () => {
        const [other, where]: string[] = seedTail.split("@");
        const [mark, move] = where!.split("+").map(Number);
        const family: K.IStored = await storedWall(other!, part.name);
        return { family, mark: mark!, shift: move ?? 0, read: K.reader(family), axis: K.axis(family) };
      })();
      const inheritedAt = (s: number): number[] | null => {
        if (inherited === null) return null;
        const at: number = s - inherited.shift;
        if (at < inherited.family.knots[0]! || at > inherited.family.knots.at(-1)!) return null;
        const frame: IAutoMovieLoftSectionFrame = axis.at(s);
        const prior: IAutoMovieLoftSectionFrame = inherited.axis.at(at);
        if (![frame.origin, frame.u, frame.v].every((v, j): boolean =>
          v.every((x: number, k: number): boolean => Math.abs(x - [prior.origin, prior.u, prior.v][j]![k]!) <=
            Number.EPSILON * Math.max(1, Math.abs(x)) * 32),
        )) return null;
        const fields: number[] = inherited.read(at);
        return C.chain(fields, inherited.family.layout).fault === null ? fields : null;
      };
      if (initialWall !== undefined && !fitRetained) throw new Error("--initial-wall needs --fit-retained");
      if (fitRetained && (reuse !== undefined || part.around === undefined))
        throw new Error("--fit-retained needs a part with directly observed retained sections and no reused wall");
      const initialization: K.IStored | null = initialWall === undefined ? null : await storedWall(initialWall, part.name);
      const retainedLayout: C.ILayout | undefined = fitRetained ? inherited?.family.layout ?? initialization?.layout ?? part.layouts[0]?.layout : undefined;
      if (retainedLayout !== undefined && !part.layouts.some(({ layout }): boolean => K.sameAnchors(layout, retainedLayout)))
        throw new Error(part.name + ": no declared retained-fit anchor layout");
      const registered = initialization === null ? null : K.registeredInitializer(initialization, part, retainedLayout!, round);
      if (typeof registered === "string") throw new Error(part.name + ": " + registered);
      if (initialization !== null)
        log("family-body-initial-wall", { part: part.name, directory: initialWall, knots: [initialization.knots[0], initialization.knots.at(-1)], anchors: initialization.layout.anchors.length });
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
        const section: IAutoMovieViewChain.ISection = C.chain(plainRead!(s), plainWall!.layout);
        return Array.from({ length: 1440 }, (_: unknown, j: number): C.P => {
          const phi: number = (2 * Math.PI * j) / 1440;
          const r: number = Q.radius(section, phi);
          return [r * Math.cos(phi), r * Math.sin(phi)];
        });
      };
      const sampleStations: number[] = [];
      for (let s: number = domain[0]; s <= domain[1] + 1e-9; s += step / 2) sampleStations.push(s);
      if (fitRetained && sampleStations.at(-1) !== domain[1]) {
        if (sampleStations.at(-1)! > domain[1]) sampleStations.pop();
        sampleStations.push(domain[1]);
      }
      const heldStations: Set<number> = new Set(sampleStations.filter((_: number, i: number): boolean => i % 2 === 1));
      for (let i: number = 0; i < sampleStations.length; i += 2) trainingStations.add(sampleStations[i]!);
      if (part.opening !== undefined) {
        for (const s of sampleStations) if (!rootFit || !heldStations.has(s)) cut(axis.at(s), s);
        const bySide: Map<number, { s: number; most: number }[]> = new Map();
        for (const record of closures) if (record.rho !== undefined) bySide.set(record.rho.side, [...(bySide.get(record.rho.side) ?? []), { s: record.s, most: record.rho.most }]);
        closures.length = 0;
        tubed = true;
        log("family-body-tube", { part: part.name, wholeSections: wholes.size, from: wholes.size === 0 ? null : Math.min(...wholes.keys()), to: wholes.size === 0 ? null : Math.max(...wholes.keys()) });
        const smoothed: Map<number, { from: number; to: number; at: (s: number) => number }> = new Map();
        for (const [side, raw] of bySide) {
          // A closure round the course (`IPart.around`, side 0, or 2 and -2 where a section has two) is smoothed under its lower envelope over `GAP_MM` either side: smoothed as
          // read, a station whose fullest shoulder fell to 0.04 between neighbours at 0.5 kept its own (the smaller is used) and its closed
          // section's area dipped by 1,200 mm2 (f1's arm at 100 mm).
          const points: { s: number; most: number }[] = Math.abs(side) === 1 ? raw : raw.map((p) => ({ s: p.s, most: Math.min(...raw.filter((q): boolean => Math.abs(q.s - p.s) <= GAP_MM).map((q): number => q.most)) }));
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
      const targetStored: K.IStored | null = targetDir === undefined ? null : await storedWall(targetDir, part.name);
      const targetWall: { read: (s: number) => number[]; layout: C.ILayout } | null = targetStored === null ? null : { read: K.reader(targetStored), layout: targetStored.layout };      if (retainedPath !== undefined || pureTail || fitRetained)
        readRetained = (s: number): boolean => fitRetained || retainedPath !== undefined || s < spliceAt;
      const retainedStations: { s: number; heldout: boolean; cut: "closed" | "open" | "absent" }[] = [];

      const seedMargin: number = part.margin ?? F.ADMISSIBLE_MARGIN;
      const admitSeed = (fields: number[]): boolean => C.chain(fields, retainedLayout!).fault === null &&
        F.leastMeetings(fields, retainedLayout!).every((x: number): boolean => x >= seedMargin);
      const completeSeeds = !fitRetained || rootFit ? [] : [...wholes].flatMap(([station, points]) => {
        if (heldStations.has(station)) return [];
        const fields: number[] = F.ownSeeds([{ s: station, heldout: false, points }], retainedLayout!, seedMargin)[0]!;
        return admitSeed(fields) ? [{ station, fields, source: "whole-section" as const }] : [];
      });
      const seedAt = (s: number): { station: number; fields: number[]; source: "archive" | "inherited" | "whole-section" | "directed-continuation" } | null => {
        const warm: number[] | null = registered?.(s) ?? null;
        if (warm !== null && admitSeed(warm)) return { station: s, fields: warm, source: "archive" };
        const carried: number[] | null = inheritedAt(s);
        if (carried !== null && admitSeed(carried)) return { station: s, fields: carried, source: "inherited" };
        return completeSeeds.reduce<(typeof completeSeeds)[number] | null>((nearest, current) =>
          nearest === null || Math.abs(current.station - s) < Math.abs(nearest.station - s) ? current : nearest, null);
      };
      for (const [i, s] of sampleStations.entries()) {
        const frame: IAutoMovieLoftSectionFrame = axis.at(s);
        if (plainRead !== null && (s < skinRange[0]! || s > skinRange[1]!)) {
          const points: C.P[] = own(s);
          rows.push({ s, points, heldout: i % 2 === 1 });
          skins.push(points);
          loops.push(points);
          invented.push(null);
          continue;
        }
        provenance.runs = undefined;
        const beforeCut: number = closures.length;
        const cutLoop: C.P[] | null = cut(frame, s);
        const runs: C.P[][] | undefined = retainedRuns(provenance);
        if (readRetained?.(s) === true)
          retainedStations.push({ s, heldout: i % 2 === 1, cut: cutLoop !== null ? "closed" : runs !== undefined ? "open" : "absent" });
        if (fitRetained) {
          const kept: C.P[][] = measuredCuts.get(s)?.runs ?? [];
          const points: C.P[] = kept.flat();
          let seed = points.length === 0 || rootFit ? null : seedAt(s);
          if (rootFit && cutLoop !== null && kept.length > 0 && !heldStations.has(s)) {
            const closure = closures.slice(beforeCut);
            const actual = measuredCuts.get(s)!;
            const whole: boolean = closure.length === 0 && actual.measured.every((edge: boolean): boolean => edge) &&
              actual.signs.every((signed: number): boolean => signed <= 0);
            const measuredKept: boolean = actual.measured.every((edge: boolean, i: number): boolean =>
              edge || (actual.signs[i]! > 0 && actual.signs[(i + 1) % actual.signs.length]! > 0));
            const continued: boolean = measuredKept && closure.length > 0 && closure.every((arc): boolean => arc.kind === "around");
            if (whole || continued) {
              const margin: number = part.margin ?? F.ADMISSIBLE_MARGIN;
              const layout: C.ILayout = retainedLayout!;
              try {
                const fields: number[] = F.ownSeeds([{ s, heldout: false, points: cutLoop }], layout, margin)[0]!;
                if (C.chain(fields, layout).fault === null && F.leastMeetings(fields, layout).every((value: number): boolean => value >= margin) &&
                    C.units(layout).every((unit: C.Unit, k: number): boolean => unit !== "share" || (fields[k]! > 0 && fields[k]! < 1)))
                  seed = { station: s, fields, source: whole ? "whole-section" : "directed-continuation" };
              } catch (error: unknown) {
                log("family-body-root-guide-refused", { part: part.name, s, reason: String(error) });
              }
            }
          }
          log("family-body-retained-row", { part: part.name, s, heldout: i % 2 === 1, runs: kept.length, observed: points.length, initializer: seed === null ? null : { s: seed.station, source: seed.source } });
          if (rootFit ? kept.length === 0 : seed === null) skipped.push(s);
          else {
            rows.push({ s, points, runs: kept, ...(seed === null ? {} : { seed: [...seed.fields] }), heldout: i % 2 === 1 });
            skins.push(points);
            loops.push(points);
            invented.push(null);
          }
          continue;
        }
        if (cutLoop === null && runs !== undefined) {
          const count: number = runs.reduce((sum: number, run: C.P[]): number => sum + run.length, 0);
          const seed: number[] | null = inheritedAt(s);
          log("family-body-open-row", { part: part.name, s, runs: runs.length, points: count, observed: seed !== null && count > 0, heldout: i % 2 === 1 });
          if (seed !== null && count > 0) {
            const points: C.P[] = runs.flat();
            rows.push({ s, points, runs, seed, heldout: i % 2 === 1 });
            skins.push(points);
            loops.push(points);
            invented.push(null);
            missed.delete(s);
            continue;
          }
        }
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
          rows.push({ s, points: loop, heldout: i % 2 === 1, ...(behind === null ? {} : { free: (p: C.P): boolean => p[0] < behind - 0.01 }), ...(part.plate === undefined ? {} : { normal: true }), ...(opening.length === 0 ? {} : { opening }), ...(part.fairMm === undefined ? {} : { fairMm: part.fairMm }) });
          invented.push(part.air === undefined ? null : inventedOf(loop));
          skins.push(loop);
          loops.push(loop);
        } else {
          // The family is the tape wall: it reads the section's convex hull. How far the skin lies inside that hull is measured apart, as relief.
          // A loose part is measured against that hull as well: its loop need not be star-shaped about the course.
          // A loose part's section is closed by its clip's straight chords, and a hull edge carries no vertex between its ends, so a wall
          // fitted to the vertices alone bulged past a long chord unseen: the nose's, closed at the top of its box, stood 10 mm above it.
          // Along a loose part's hull every edge carries a point at least every millimetre. So does a part's closed across an opening
          // (`IPart.around`): where its closed loop is hollow between two closures the hull bridges it by one edge, and the seed's arc
          // across that edge had no point on it for 9.8 to 10.2 mm (f1's middle finger at 14.5 and 16.5 mm, meetings 0.082 to 0.095).
          const synthetic: Set<C.P> = new Set();
          const indices: Map<C.P, number> = new Map(loop.map((point: C.P, i: number): [C.P, number] => [point, i]));
          const step: number = R.area(loop) < 0 ? -1 : 1;
          const wall: C.P[] = part.loose === true || part.around !== undefined ? R.hull(loop).flatMap((p: C.P, k: number, hull: C.P[]): C.P[] => {
            const q: C.P = hull[(k + 1) % hull.length]!;
            const pieces: number = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1])));
            const mixed: boolean = part.around !== undefined && hullContainsClosure(loop, indices, p, q, step, provenance);
            const dense: C.P[] = Array.from({ length: pieces }, (_, t): C.P => {
              const sample: C.P = t === 0 ? p : [p[0] + ((q[0] - p[0]) * t) / pieces, p[1] + ((q[1] - p[1]) * t) / pieces];
              if (t === 0 ? provenance.points.has(p) : mixed) synthetic.add(sample);
              return sample;
            });
            if (mixed)
              dense.forEach((a: C.P, t: number): void => { mixedEdges.set(a, dense[t + 1] ?? q); });
            return dense;
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
          const targetSection: IAutoMovieViewChain.ISection | null = targetWall === null ? null : C.chain(targetWall.read(s), targetWall.layout);
          const fitted: C.P[] = targetSection === null || targetSection.fault !== null ? wall : Array.from({ length: SKIN_RAYS }, (_: unknown, k: number): C.P => {
            const phi: number = (2 * Math.PI * k) / SKIN_RAYS;
            const r: number = within(phi) ? C.radius(wall, phi) : Q.radius(targetSection, phi);
            return [r * Math.cos(phi), r * Math.sin(phi)];
          });
          // A part closed round its course (`IPart.around`): its closure is invented, not skin, so its points are no observations; the wall
          // across them is held only to stay on the parent's side of the opening (`F.IRow.side`). Its extremes may still be read on the
          // closure for the start: with none read there (`F.IRow.opening`), the closure's 274 to 303 degrees left the first sections' seeds
          // with phases that did not advance round the turn, refused at every station from 24 to 103 mm. Fitted as
          // data, the closure filled 274 to 303 degrees of the arm's first sections, and the joint fit pinned a shoulder at the first
          // station to 5e-5 to follow it, every step that would move it refused (18 mm at 11 knots, against 6.2 mm on skin alone).
          const physicalSide = (p: C.P): number => part.opening!(chartToWorld(frame, p));
          const closing = (p: C.P): boolean => synthetic.has(p) || provenance.points.has(p) ||
            (fitted !== wall && within(Math.atan2(p[1], p[0])));
          rows.push({
            s, points: fitted, heldout: i % 2 === 1,
            ...(part.around === undefined || spans.length === 0 ? {} : {
              free: closing,
              buried: (p: C.P): boolean => {
                if (!provenance.points.has(p)) return false;
                const side: number = physicalSide(p);
                return side >= 0 && Number.isFinite(side);
              },
              side: physicalSide,
            }),
          });
          invented.push(part.around === undefined ? null : fitted.map(closing));
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
            const depth: number = observedDepth(wall, p, part.loose === true && part.reliefs === "auto");
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
      if (retainedPath !== undefined) {
        const surfaces = divides.filter((surface): boolean => surface.near.includes(part.name) || surface.far.includes(part.name));
        const sign = (side: number): number | "inapplicable-far" | "no-cut" | "nonfinite" =>
          Number.isFinite(side) ? side : side === Infinity ? "inapplicable-far" : side === -Infinity ? "no-cut" : "nonfinite";
        await fs.writeFile(retainedPath, JSON.stringify({
          part: part.name,
          domain,
          units: "mm",
          rows: retainedStations.map((row) => {
            const measured = measuredCuts.get(row.s);
            const frame: IAutoMovieLoftSectionFrame = measured?.frame ?? axis.at(row.s);
            return {
              ...row,
              frame,
              ...(measured === undefined ? {} : {
                points: measured.points,
                measuredEdges: measured.measured,
                runs: measured.runs,
                ownership: measured.points.map((point: C.P, i: number) => {
                  const world: R.V = chartToWorld(frame, point);
                  return {
                    side: sign(measured.signs[i]!),
                    scopes: surfaces.map((surface) => {
                      const within: boolean = surface.within?.(world) ?? true;
                      return { name: surface.name, within, ...(within ? { side: sign(surface.side(world)) } : {}) };
                    }),
                  };
                }),
              }),
            };
          }),
        }));
      }
      if (part.skin !== undefined) log("family-body-star", { part: part.name, sections: star.length, refused: star.filter((r): boolean => r.folds !== 0).map((r): string => r.s.toFixed(1) + (r.folds < 0 ? ":outside" : ":" + r.folds)) });
      if (part.opening !== undefined) log("family-body-opening", { part: part.name, sections: new Set(closures.map((c): number => c.s)).size, from: closures[0]?.s ?? null, to: closures.at(-1)?.s ?? null, conic: closures.filter((c): boolean => c.kind === "conic").length, s: closures.filter((c): boolean => c.kind === "s").length, around: closures.filter((c): boolean => c.kind === "around").length, chord: closures.filter((c): boolean => c.kind === "chord").map((c): number => c.s), short: closures.filter((c): boolean => c.kind === "short").map((c): number => c.s), outside: closures.filter((c): boolean => c.kind === "outside").map((c): string => `${c.s} ${c.detail ?? ""}`), shoulders: closures.filter((c): boolean => c.rho !== undefined).map((c): string => `${c.s}${c.rho!.side > 0 ? "+" : "-"}:${c.rho!.most.toFixed(2)}/${c.rho!.used.toFixed(2)}`) });
      // A part closed round its course (`IPart.around`): every fitted section's closure, how far inside its hull the course point stands
      // (the tape wall reads radii round it), how many of its points step back in polar angle about it, and whether its own seed is a conic
      // chain the fit admits.
      if (part.around !== undefined && !rootFit) {
        // The seeds are read as the fit reads them (`F.ownSeeds`, on these very rows with their openings, at every layout the part is
        // fitted with) and judged as the fit judges a start: a conic chain whose tangents meet at the fit's margin or more. Read alone and
        // without the rows' openings, they were reported admitted while the run's start was refused at every station from 24 to 103 mm.
        const fitting: F.IRow[] = rows.filter((row: F.IRow): boolean => !row.heldout);
        const judged: Map<number, string> = new Map(fitting.map((row: F.IRow): [number, string] => [row.s, "yes"]));
        // Of each refused row, the first layout's seed that refused it: its anchors, their tangents and each arc's meeting, to be drawn and
        // read by arc (`--draw-closed`), since "least meeting" alone does not say whether the arc lies on the closure, on the skin or on
        // an edge of the hull between them.
        const refusedSeeds: Map<number, { fields: number; points: number[][]; tangents: number[][]; meetings: number[] }> = new Map();
        const layouts: C.ILayout[] = inherited === null ? part.layouts.map(({ layout }): C.ILayout => layout) : [inherited.family.layout];
        for (const layout of layouts) {
          let own: number[][];
          try {
            own = F.ownSeeds(fitting, layout, part.margin ?? F.ADMISSIBLE_MARGIN);
          } catch (error: unknown) {
            for (const row of fitting) if (judged.get(row.s) === "yes") judged.set(row.s, `${C.units(layout).length} fields: ${error instanceof Error ? error.message : String(error)}`.slice(0, 100));
            continue;
          }
          fitting.forEach((row: F.IRow, i: number): void => {
            const fault: string | null = C.chain(own[i]!, layout).fault;
            const least: number = fault === null ? Math.min(...F.leastMeetings(own[i]!, layout)) : -Infinity;
            if (judged.get(row.s) === "yes" && (fault !== null || !(least >= (part.margin ?? F.ADMISSIBLE_MARGIN)))) {
              judged.set(row.s, `${C.units(layout).length} fields: ${fault ?? "least meeting " + least.toFixed(4)}`.slice(0, 100));
              if (fault === null) {
                const input = C.resolve([...own[i]!], layout).input;
                refusedSeeds.set(row.s, { fields: C.units(layout).length, points: input.points as number[][], tangents: input.tangents as number[][], meetings: F.leastMeetings(own[i]!, layout) });
              }
            }
          });
        }
        // `--draw-closed=<directory>`: every refused fitting section drawn in its chart, one frame a station (`<part>.closed.<s>.png`):
        // the closed loop as cut (grey), the points the fit reads (the tape wall's, black where they are skin and blue where they are the
        // invented closure), the refused seed's anchors with their tangents (green ticks, 3 mm) and each arc under the margin as its
        // chord (red); a 5 mm tick from the course point along the chart's +u (orange). And by arc under the margin: its ends' phases,
        // its chord, its meeting, how many of the fit's points lie between its ends and how many of those are closure - so a refusal
        // is read as the closure's, the skin's, or a hull edge's between them.
        const drawClosed: string | undefined = process.argv.find((a: string): boolean => a.startsWith("--draw-closed="))?.slice("--draw-closed=".length);
        if (drawClosed !== undefined) {
          NodeCanvasRaster.initialize();
          const degrees = (p: readonly number[]): number => Math.round((((Math.atan2(p[1]!, p[0]!) * 180) / Math.PI) % 360 + 360) % 360);
          const metre = (p: readonly number[]): N.Point => [0, p[1]! / 1000, p[0]! / 1000];
          for (const row of fitting) {
            const seed = refusedSeeds.get(row.s);
            if (seed === undefined) continue;
            const margin: number = part.margin ?? F.ADMISSIBLE_MARGIN;
            const under: number[] = seed.meetings.map((m: number, j: number): number => (m >= margin ? -1 : j)).filter((j: number): boolean => j >= 0);
            const between = (j: number): { all: number; closure: number; longestGapMm: number } => {
              const [a, b]: number[] = [Math.atan2(seed.points[j]![1]!, seed.points[j]![0]!), Math.atan2(seed.points[(j + 1) % seed.points.length]![1]!, seed.points[(j + 1) % seed.points.length]![0]!)];
              const span: number = (((b - a) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
              const inside: C.P[] = row.points.filter((p: C.P): boolean => (((Math.atan2(p[1], p[0]) - a) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) < span).sort((p: C.P, q: C.P): number => ((((Math.atan2(p[1], p[0]) - a) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - ((((Math.atan2(q[1], q[0]) - a) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)));
              const chain: number[][] = [seed.points[j]!, ...inside, seed.points[(j + 1) % seed.points.length]!];
              return { all: inside.length, closure: inside.filter((p: C.P): boolean => row.free?.(p) === true).length, longestGapMm: round(Math.max(...chain.slice(1).map((p: number[], k: number): number => Math.hypot(p[0]! - chain[k]![0]!, p[1]! - chain[k]![1]!)))) };
            };
            log("family-body-refused-arcs", { part: part.name, s: row.s, fields: seed.fields, arcs: under.map((j: number): { arc: number; fromDeg: number; toDeg: number; chordMm: number; meeting: number; all: number; closure: number; longestGapMm: number } => ({ arc: j, fromDeg: degrees(seed.points[j]!), toDeg: degrees(seed.points[(j + 1) % seed.points.length]!), chordMm: round(Math.hypot(seed.points[(j + 1) % seed.points.length]![0]! - seed.points[j]![0]!, seed.points[(j + 1) % seed.points.length]![1]! - seed.points[j]![1]!)), meeting: Math.round(seed.meetings[j]! * 1e4) / 1e4, ...between(j) })) });
            const whole: C.P[] = loops[rows.indexOf(row)]!;
            const dots = (points: readonly C.P[], id: string, colour: string): N.Curve[] => points.map((p: C.P, k: number): N.Curve => ({ id: `${id}.${k}`, points: [metre([p[0] - 0.12, p[1]]), metre([p[0] + 0.12, p[1]]), metre([p[0], p[1] + 0.12]), metre([p[0], p[1] - 0.12])], closed: true, colour }));
            const curves: N.Curve[] = [
              { id: "loop", points: whole.map(metre), closed: true, colour: "9a9a9a" },
              ...dots(row.points.filter((p: C.P): boolean => row.free?.(p) !== true), "skin", "202020"),
              ...dots(row.points.filter((p: C.P): boolean => row.free?.(p) === true), "closure", "2f62c8"),
              ...seed.points.map((p: number[], j: number): N.Curve => {
                const n: number = Math.hypot(seed.tangents[j]![0]!, seed.tangents[j]![1]!) || 1;
                return { id: `anchor.${j}`, points: [metre([p[0]! - (1.5 * seed.tangents[j]![0]!) / n, p[1]! - (1.5 * seed.tangents[j]![1]!) / n]), metre([p[0]! + (1.5 * seed.tangents[j]![0]!) / n, p[1]! + (1.5 * seed.tangents[j]![1]!) / n])], closed: false, colour: "1f9d3a" };
              }),
              ...under.map((j: number): N.Curve => ({ id: `under.${j}`, points: [metre(seed.points[j]!), metre(seed.points[(j + 1) % seed.points.length]!)], closed: false, colour: "d02020" })),
              { id: "u", points: [metre([0, 0]), metre([5, 0])], closed: false, colour: "e08a1c" },
            ];
            const camera: N.Camera = NodeCanvasCamera.fit("front", [...whole, ...row.points].map(metre), 900, 900);
            await fs.writeFile(path.join(drawClosed, `${part.name}.closed.${row.s}.png`), NodeCanvasRaster.render(camera, [], curves, "xray", `f1 | ${part.name} section at ${row.s} mm in its chart; skin black, closure blue, seed green, arcs under the margin red, +u orange`).png);
          }
        }
        for (const row of rows) {
          if (row.heldout) continue;
          const hull: C.P[] = row.runs === undefined ? R.hull(row.points) : [];
          const clearance: number = Math.min(...hull.map((p: C.P, k: number): number => {
            const q: C.P = hull[(k + 1) % hull.length]!;
            return (p[0] * q[1] - p[1] * q[0]) / (Math.hypot(q[0] - p[0], q[1] - p[1]) || 1);
          }));
          const index: number = rows.indexOf(row);
          const loop: C.P[] = loops[index]!;
          let against: number = 0;
          loop.forEach((p: C.P, k: number): void => {
            const q: C.P = loop[(k + 1) % loop.length]!;
            if (p[0] * q[1] - p[1] * q[0] <= 0) ++against;
          });
          const admitted: string = judged.get(row.s) ?? "yes";
          const closure = closures.find((c): boolean => c.s === row.s && c.kind !== "short");
          // The closure's span in the chart, from the skin's exit to its entry, degrees counter-clockwise from +u.
          const spanDeg: number[] | null = closure?.span === undefined ? null : closure.span.map((a: number): number => Math.round((((a * 180) / Math.PI) % 360 + 360) % 360));
          log("family-body-closed", { part: part.name, s: row.s, closure: closure === undefined ? "none" : (closure.detail ?? closure.kind), spanDeg, clearanceMm: round(clearance), against, admitted });
        }
      }
      log("family-body-hollows", { part: part.name, deepestMmAtDegrees: hollows.filter((_: string, i: number): boolean => i % 6 === 0).join(" ") });
      log("family-body-observed", { part: part.name, sections: rows.length, skipped, ...(missed.size === 0 ? {} : { missed: [...missed.entries()].map(([s, why]: [number, string]): string => `${s}: ${why}`) }) });
      // `--precheck`: the sections and their tables alone, no fit.
      if (process.argv.includes("--precheck")) continue;

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
        await fs.writeFile(dumpTo, JSON.stringify({ part: part.name, rows: rows.map((row: F.IRow, i: number) => { const frame: IAutoMovieLoftSectionFrame = axis.at(row.s); return { s: row.s, origin: [...frame.origin], u: [...frame.u], v: [...frame.v], points: row.points, invented: invented[i] ?? null }; }) }));
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
      let tailTrace: ((wall: K.IStored) => string | null) | null = null;
      let changedPrefix: number[] = [];
      // The stored wall's own reliefs and ends as read (`--wall`), for `--refit-reliefs`.
      let carried: { reliefs: IAutoMovieLoftRelief[]; tips: K.IStored["tips"] } | null = null;
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
      // With `--wall=<directory>` the wall of an earlier run is taken as it was stored and only its reliefs are fitted again; a directory
      // `stored`, here and in `--splice`, is the family the Human package holds (`storedWall`).
      if (reused !== null) {
        const wall: K.IStored = reused;
        carried ={ reliefs: [...(wall.reliefs ?? [])], tips: wall.tips };

        // `--splice=<directory>@<station>`: from that station on, the knots and values of another stored wall of the same part, course and
        // layout replace this one's. A limb refitted for one end keeps the other end of the fit its neighbours were sewn on.
        if (splice !== undefined) {
          const [other, where]: string[] = splice.split("@");
          const [at, moved]: string[] = where!.split("+");
          const tail: K.IStored = await storedWall(other!, part.name);
          if (!K.sameAnchors(tail.layout, wall.layout) || tail.values.length !== wall.values.length)
            throw new Error("splice: the two walls of " + part.name + " have different anchor declarations");
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
          tail.knots = tail.knots.map((k: number): number => k + shift);
          tail.reliefs = (tail.reliefs ?? []).map((relief: IAutoMovieLoftRelief): IAutoMovieLoftRelief => ({ ...relief, stations: [round(relief.stations[0] + shift), round(relief.stations[1] + shift)] }));
          // The far end is the tail's, so its end record is the tail's as stored (its cap's start, its pole and whether the family owns
          // it), moved along with its knots; the near end's stays this wall's. Emitted from the refitted stretch's own domain instead, a
          // digit's root piece put its cap's start at its last root knot (the index finger's at 38 mm for a pole at 84.38) and lost `own`.
          const far = tail.tips?.[1] ?? null;
          spliced = { tail, at: Number(at), head: wall.reliefs ?? [], tips: [wall.tips?.[0] ?? null, far === null ? null : { ...far, from: far.from + shift, tip: far.tip + shift }] };
          const head: number[] = wall.knots.map((_: number, k: number): number => k).filter((k: number): boolean => wall.knots[k]! < Number(at));
          const rest: number[] = tail.knots.map((_: number, k: number): number => k).filter((k: number): boolean => tail.knots[k]! >= Number(at));
          wall.values = wall.values.map((field: number[], f: number): number[] => [...head.map((k: number): number => field[k]!), ...rest.map((k: number): number => tail.values[f]![k]!)]);
          wall.knots = [...head.map((k: number): number => wall.knots[k]!), ...rest.map((k: number): number => tail.knots[k]!)];
          const held = K.holdTail(wall, tail, Number(at));
          if (typeof held === "string") throw new Error("splice: " + held);
          wall.values = held.values;
          wall.layout = tail.layout;
          tailTrace = held.check;
          changedPrefix = held.changed;
          log("family-body-splice-held", { part: part.name, at: Number(at), changedPrefix, orders: [0, 1, 2] });
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
      // `--least=<a>,<b>,...`: one least per arc, in the order of the shoulders (`ILayout.least`), so the bound holds only the arcs that need
      // it. f1's foot end was fitted under 0.3 for the two arcs at its top, whose corner drew a slot at the big toe's root; the same bound held
      // the sole's arc at 0.3 from 896 to 960 mm, where each section fitted alone without it came within 0.4 to 0.85 mm and the bounded wall
      // stood 1.0 to 1.7 mm under the sole.
      const least: number | number[] | undefined = ((value: string | undefined): number | number[] | undefined => (value === undefined ? undefined : value.includes(",") ? value.split(",").map(Number) : Number(value)))(process.argv.find((argument: string): boolean => argument.startsWith("--least="))?.slice(8));
      // A part is fitted at each depth of its layouts in turn (`LIMB`: 4 arcs, then 8), every arc of a depth halved by the next, so a list
      // given for one depth is read at another by its arcs: a coarser arc takes the largest least of the finer arcs it covers, a finer arc
      // its coarser arc's.
      const leastAt = (layout: C.ILayout): number | number[] | undefined => {
        if (least === undefined || typeof least === "number") return least;
        const arcs: number = layout.mirror ? layout.anchors.length - 1 : layout.anchors.length;
        if (least.length % arcs === 0) return Array.from({ length: arcs }, (_: unknown, arc: number): number => Math.max(...least.slice((arc * least.length) / arcs, ((arc + 1) * least.length) / arcs)));
        if (arcs % least.length === 0) return Array.from({ length: arcs }, (_: unknown, arc: number): number => least[Math.floor((arc * least.length) / arcs)]!);
        throw new Error(`--least: ${part.name}'s layout has ${arcs} arcs, which the list of ${least.length} does not divide`);
      };
      if (least !== undefined && typeof least === "object" && least.some((x: number): boolean => !Number.isFinite(x))) throw new Error(`--least: ${least.join(",")} is not a list of shoulders`);
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
      // `--seed-tail=<directory>@<at>+<shift>`: the start is another stored wall from `at` on, its stations this one's less the shift (the
      // course past `at` is that wall's course moved along by the shift), and before `at` each fitting section's own seed at knots every
      // `GAP_MM` on the same layout, so the fit starts at that wall's layout. The arm on its ISB course is the stored arm's from the elbow
      // turn's end on: fitted from three knots, its window's free far end ran a shoulder to 5e-5 and every step that would move it was
      // refused (11.8 mm at 11 knots), where the stored wall is real, admitted field.
      if (rootFit) {
        const first: number | undefined = rows[0]?.s;
        const earlier = rows.filter((row: F.IRow): boolean => row.s < rootPlan!.first);
        const admitted: boolean = first !== undefined && first < rootPlan!.first &&
          earlier.some((row: F.IRow): boolean => row.heldout) &&
          earlier.some((row: F.IRow): boolean => !row.heldout);
        log("family-body-root-owned-support", {
          part: part.name, scanned: [...domain], firstObserved: first ?? null,
          originalFirst: rootPlan!.first, priorRows: earlier.length, admitted,
        });
        if (!admitted || first === undefined) {
          receipt.push({ part: part.name, fault: "no earlier independently supported training and held source at the actual composed end" });
          continue;
        }
        domain[0] = first;
      }
      if (fitRetained && (rows[0]?.s !== domain[0] || rows.at(-1)?.s !== domain[1] ||
          !rows.some((row: F.IRow): boolean => row.heldout))) {
        const fault: string = "the requested retained domain lacks an observed endpoint or independent held section";
        log("family-body-root-support", { part: part.name, required: domain, observed: [rows[0]?.s, rows.at(-1)?.s], fault });
        receipt.push({ part: part.name, fault });
        continue;
      }
      if (inherited !== null && !rows.some((row: F.IRow): boolean => row.s === domain[0])) {
        const fault: string = "the requested root section has no independent fitting support";
        log("family-body-root-support", { part: part.name, station: domain[0], fault });
        receipt.push({ part: part.name, fault });
        continue;
      }
      if (rootFit) {
        if (inherited === null || inherited.shift !== 0 || part.lead !== undefined)
          throw new Error("the root fit needs the canonical family on its actual unshifted course");
        const { family: tail, mark } = inherited;
        const inspect = <T>(phase: string, run: () => T): T => groupPlan === undefined ? run() :
          groupPhase(log, groupPlan.owner.name, part.name + " " + phase, run);
        const registeredTail = inspect("registered original initializer", () =>
          K.registeredInitializer(tail, rootPlan!.family, retainedLayout!, (value: number): number => value));
        if (typeof registeredTail === "string") {
          const fault: string = "the composed root: " + registeredTail;
          receipt.push({ part: part.name, fault });
          log("family-body-root-support", { part: part.name, mark, fault });
          continue;
        }
        const observed = rows.filter((row: F.IRow): boolean => row.s < mark);
        if (domain[1] < mark || !observed.some((row: F.IRow): boolean => row.heldout) ||
            !observed.some((row: F.IRow): boolean => !row.heldout)) {
          const fault: string = "the observed composed prefix lacks an independent training and held section";
          receipt.push({ part: part.name, fault });
          log("family-body-root-support", { part: part.name, mark, fault });
          continue;
        }
        const head: number[] = [domain[0]];
        for (const row of observed) {
          const last: number = head.at(-1)!;
          if (!row.heldout && row.s - last >= gap(last) && mark - row.s >= gap(row.s) / 2)
            head.push(row.s);
        }
        const constrained = inspect("protected tail", () => K.constrainTail(tail, mark, head));
        if (typeof constrained === "string") {
          receipt.push({ part: part.name, fault: constrained });
          log("family-body-root-support", { part: part.name, mark, fault: constrained });
          continue;
        }
        const physicalPrefix: number[] = constrained.knots.filter((s: number): boolean => s < mark);
        const absentHeld: number[] = [];
        inspect("independent held index cuts", () => {
          for (const s of K.heldPrefixStations(physicalPrefix, mark, retainedStations)) {
            provenance.runs = undefined;
            const loop: C.P[] | null = cut(axis.at(s), s);
            const runs: C.P[][] = measuredCuts.get(s)?.runs ?? [];
            retainedStations.push({ s, heldout: true, cut: loop !== null ? "closed" : runs.length > 0 ? "open" : "absent" });
            if (runs.length > 0) observed.push({ s, points: runs.flat(), runs, heldout: true });
            else absentHeld.push(s);
          }
        });
        if (absentHeld.length > 0) {
          const fault: string = "declared interior held cuts have no measured skin at " + absentHeld.join(", ") + " mm";
          receipt.push({ part: part.name, fault });
          log("family-body-root-support", { part: part.name, mark, fault });
          continue;
        }
        observed.sort((a: F.IRow, b: F.IRow): number => a.s - b.s);
        if (groupPlan !== undefined) {
          const kept = new Map<number, IMeasuredCut>(measuredCuts);
          collected.set(part.name, { family: tail, tail: constrained, observed, kept, axis,
            outside: part.clip, margin: part.margin, whole: (s: number): boolean => {
              const cut = kept.get(s);
              return cut !== undefined && cut.measured.length >= 3 && cut.measured.every(Boolean) && cut.signs.every((v): boolean => v <= 0);
            } });
          continue;
        }
        const fit: F.IResult = F.fit(observed, constrained.knots, tail.layout, 4, undefined, part.margin, true, constrained,
          (values: number[][]): string | null => {
            const refuses: string[] = K.refusals({ ...tail, knots: constrained.knots, values }, 4,
              observed.filter((row: F.IRow): boolean => !row.heldout).map((row: F.IRow): number => row.s));
            return refuses.length === 0 ? null : "the restored root continuation is not admitted by the native source: " + refuses[0]!;
          });
        log("family-body-root-constrained", {
          part: part.name, mark, measure: [...domain], knots: constrained.knots, free: constrained.free.map((k: number): number => constrained.knots[k]!),
          training: observed.filter((row: F.IRow): boolean => !row.heldout).length,
          held: observed.filter((row: F.IRow): boolean => row.heldout).length,
          iterations: fit.iterations, fitTrainingMm: round(fit.training.maximumMm), fitHeldMm: round(fit.heldout.maximumMm), fault: fit.fault,
        });
        if (fit.fault !== null) {
          receipt.push({ part: part.name, fault: fit.fault });
          continue;
        }
        best = fit;
        tailTrace = constrained.check;
        changedPrefix = fit.knots.filter((s: number, k: number): boolean =>
          s < mark && fit.values.some((field: number[], f: number): boolean => field[k] !== constrained.initial[f]![k]));
        spliced = { tail, at: mark, head: [], ...(tail.tips === undefined ? {} : { tips: tail.tips }) };
      }
      const seeded: { knots: number[]; values: number[][] } | null = rootFit ? null : await (async (): Promise<{ knots: number[]; values: number[][] } | null> => {
        if (inherited !== null) {
          const { family: tail, mark: at, shift, read } = inherited;
          const layout: C.ILayout | undefined = part.layouts.find((entry: { layout: C.ILayout }): boolean => K.sameAnchors(entry.layout, tail.layout)) === undefined ? undefined : tail.layout;
          if (layout === undefined) throw new Error("--seed-tail: no layout of " + part.name + " has the stored wall's fields");
          const fitting: F.IRow[] = rows.filter((row: F.IRow): boolean => !row.heldout && row.s > domain[0] && row.s < at);
          const head: number[] = [];
          // The root stretch's knots: one at its start whenever it has a stretch of its own before the tail, then one a gap. Laid only
          // where half a gap remained before the tail, a root 4.5 mm long got no knot (f1's little finger, whose first joint stands
          // 11.5 mm proximal of the heads' plane: its "root fit" was the tail's own three knots from 16 mm, read as fitted).
          if (domain[0] < at) head.push(domain[0]);
          if (fitting.length > 0)
            for (let s: number = domain[0] + (fitRetained ? gap(domain[0]) : GAP_MM); s < at - (fitRetained ? gap(s) : GAP_MM) / 2; s += fitRetained ? gap(s) : GAP_MM) {
              const nearest: F.IRow = fitting.reduce((b: F.IRow, row: F.IRow): F.IRow => Math.abs(row.s - s) < Math.abs(b.s - s) ? row : b);
              if (nearest.s > head.at(-1)!) head.push(nearest.s);
            }
          const own: number[][] = head.map((s: number): number[] => {
            const row: F.IRow = rows.find((entry: F.IRow): boolean => entry.s === s)!;
            const placed: number[] | null = inheritedAt(s);
            if (placed !== null) return placed;
            return F.ownSeeds([row], layout, part.margin ?? F.ADMISSIBLE_MARGIN)[0]!;
          });
          const tailKnots: number[] = tail.knots.map((k: number): number => k + shift).filter((k: number): boolean => k >= Math.max(at, domain[0]) && k <= domain[1]);
          const knots: number[] = [...head, ...tailKnots];
          if (knots.at(-1) !== domain[1]) knots.push(domain[1]);
          if (knots[0] !== domain[0]) knots.unshift(domain[0]);
          const start: number[][] = knots.map((s: number): number[] => {
            const i: number = head.indexOf(s);
            if (i >= 0) return own[i]!;
            return fitRetained ? (seedAt(s)?.fields ?? read(s - shift)) : read(s - shift);
          });
          const values: number[][] = tail.values.map((_: number[], f: number): number[] => start.map((vector: number[]): number => vector[f]!));
          log("family-body-seed-tail", { part: part.name, at, shift, headKnots: head, tailKnots, knots });
          return { knots, values };
        }
        if (fitRetained) {
          const fixed: F.IRow[] = rows.filter((row: F.IRow): boolean => !row.heldout);
          const knots: number[] = [domain[0]];
          for (const row of fixed.slice(1)) {
            const last: number = knots.at(-1)!;
            if (row.s - last >= gap(last) && domain[1] - row.s >= gap(row.s) / 2) knots.push(row.s);
          }
          knots.push(domain[1]);
          const samples: number[][] = knots.map((s: number): number[] => rows.find((row: F.IRow): boolean => row.s === s)!.seed!.slice());
          return { knots, values: samples[0]!.map((_: number, f: number): number[] => samples.map((fields: number[]): number => fields[f]!)) };
        }
        if (seed === undefined) return null;
        const wall: K.IStored = await storedWall(seed, part.name);
        const knots: number[] = [domain[0], ...wall.knots.filter((k: number): boolean => k > domain[0] + gap(domain[0]) && k < domain[1] - gap(domain[1])), domain[1]];
        return { knots, values: F.resample(wall.values, wall.knots, knots) };
      })();
      // The seed starts the layout whose fields it has, and the shallower layouts are not fitted: a stored `limb(1)` wall is the start of
      // the `limb(1)` fit itself. Read only by the first layout, f1's foot end refitted from 880 to 975 mm on its stored `limb(1)` wall
      // started from scratch at `limb(0)` (3.55 mm at most), and that fit cut at its medians was no admissible chain on every section, so
      // the `limb(1)` fit was refused and the coarse wall kept.
      const seedLayout: number = seeded === null ? -1 : part.layouts.findIndex((entry: { layout: C.ILayout }): boolean => C.units(entry.layout).length === seeded.values.length);
      // `--held`: with `--seed`, the seed's knots are kept as they are, neither grown nor pruned, so a wall refitted over changed sections keeps
      // the knots its neighbours were sewn on.
      const seedHeld: boolean = seeded !== null && process.argv.includes("--held");
      // With `--seed-tail` the fit stays on the tail's layout: the tail is the stored wall the head is spliced onto (`--splice`), and a
      // splice joins two walls of one layout. Left to deepen, the toes' and the little finger's roots, seeded on stored `limb(0)` walls,
      // came out as `limb(1)` (20 fields against the stored 12), and the big toe's deeper fit left the model's bounds (a shoulder of
      // -0.0074).
      for (const { layout: plain, depth } of rootFit || reuse !== undefined || constructed ? [] : deepen !== undefined ? [{ layout: C.limb(deeper), depth: deeper }] : seedTail !== undefined || fitRetained ? [part.layouts[Math.max(0, seedLayout)]!] : part.layouts.slice(Math.max(0, seedLayout))) {
        const declared: C.ILayout = retainedLayout ?? inherited?.family.layout ?? plain;
        const layout: C.ILayout = least === undefined ? declared : { ...declared, least: leastAt(declared)! };
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
        let result: F.IResult = attempt(knots0, layout, best === null ? (seeded !== null && seeded.values.length === C.units(layout).length ? seeded.values.map((field: number[], f: number): number[] => {
          const first: number = C.units(layout).length - (layout.mirror ? layout.anchors.length - 1 : layout.anchors.length);
          return least !== undefined && f >= first ? field.map((x: number): number => Math.max(C.leastOf(layout, f - first) ?? 0, x)) : field;
        }) : undefined) : F.refine(best.values, depth - 1), "depth " + depth);
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
      if (!rootFit && best !== null && reuse === undefined && deepen === undefined && !constructed && !seedHeld) {
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
      // A least per arc is raised arc by arc, each shoulder field to its own arc's least.
      if ((tailTrace !== null || inherited !== null) && (raise !== undefined || least !== undefined))
        throw new Error(part.name + ": a carried layout cannot take a temporary shoulder bound");
      if (raise !== undefined) {
        const held: C.ILayout = best.layout;
        const arcs: number = held.mirror ? held.anchors.length - 1 : held.anchors.length;
        best = { ...best, layout: { ...held, least: held.least === undefined || typeof held.least === "number" ? Math.max(held.least ?? 0, Number(raise)) : Array.from({ length: arcs }, (_: unknown, arc: number): number => Math.max(C.leastOf(held, arc) ?? 0, Number(raise))) } };
      }
      if (tailTrace === null && inherited === null && best.layout.least !== undefined) {
        const bounded: C.ILayout = best.layout;
        const unbounded: C.ILayout = { anchors: best.layout.anchors, mirror: best.layout.mirror };
        const first: number = C.units(unbounded).length - (unbounded.mirror ? unbounded.anchors.length - 1 : unbounded.anchors.length);
        best = { ...best, layout: unbounded, values: best.values.map((field: number[], f: number): number[] => (f >= first ? field.map((x: number): number => Math.max(C.leastOf(bounded, f - first) ?? 0, x)) : field)) };
      }

      // Every shoulder is stored as the model reads it (`AutoMovieHumanConicSection.shoulder`), so the stored wall is the one generated. The
      // trunk's face refitted without the nose stored -0.20 at 792 mm and 1.17 at 834 mm; the model reads 0.03 and 0.85 at those knots, and
      // between them the field's cubic crossed the bound, where its arc held still while its neighbours moved. Stored bounded, with curvature
      // matched over the whole trunk, the wall under the armpit moved by up to 10 mm (1,250 to 1,300 mm high, 60 to 85 degrees), so the
      // reliefs are refitted on it and the armpit's slit cutter, fitted to the earlier wall, is refitted on it as well.
      if (tailTrace === null && inherited === null) {
        const arcs: number = best.layout.mirror ? best.layout.anchors.length - 1 : best.layout.anchors.length;
        const first: number = C.units(best.layout).length - arcs;
        const layout: C.ILayout = best.layout;
        best = { ...best, values: best.values.map((field: number[], f: number): number[] => (f >= first ? field.map((x: number): number => C.shoulder(x, layout, f - first)) : field)) };
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
      const tailPolicy: K.IStored | undefined = tailTrace === null ? inherited?.family : spliced?.tail;
      const stored: string = JSON.stringify({
        name: part.name, centres: rootPlan === undefined ? part.centres.map((c: R.V): number[] => c.map(round)) : part.centres, halves: part.halves, up: part.up,
        ...(part.roll === undefined ? {} : { roll: part.roll }),
        layout: best.layout,
        knots: tailTrace === null ? led.knots.map(round) : led.knots,
        values: tailTrace === null ? led.values.map((field: number[], f: number): number[] => field.map(C.units(best!.layout)[f] === "mm" ? round : round4)) : led.values,
        ...(tailPolicy === undefined ? { pitch: part.pitch } : {
          pitch: tailPolicy.pitch,
          phase: tailPolicy.phase,
          turn: tailPolicy.turn,
        }),
      });
      const definition: K.IStored = JSON.parse(stored) as K.IStored;
      const traceFault: string | null = tailTrace?.(definition) ?? null;
      if (traceFault !== null) throw new Error("serialized splice: " + traceFault);
      if (tailTrace === null)
        await fs.writeFile(path.join(out, part.name + ".family.json"), stored);

      if (rootFit) definition.reliefs = spliced!.tail.reliefs;
      // Reliefs: fitted on the stored wall, so they also absorb what the wall leaves inside their windows.
      else {
        const read: (s: number) => number[] = K.reader(definition);
        const course: IAutoMovieViewAxis.IAxis = K.axis(definition);
        // A window the hollow search places ends at the part's tip at the latest: a relief must vanish at the pole.
        // It hands its edges over as an authored window may (`fade`): the search widens it by 30 mm and 0.45 rad past its hollow, and asked
        // for the whole height from its first free row it drew its outline on the ankle as level wrinkles.
        // `--coarse=<share>`: every authored window's rows and columns scaled by that share, at least 7, to read how fine a net must be.
        const coarse: number = Number(process.argv.find((argument: string): boolean => argument.startsWith("--coarse="))?.slice(9) ?? 1);
        const below: number = Number(process.argv.find((argument: string): boolean => argument.startsWith("--coarse-below="))?.slice(15) ?? Infinity);
        const scaled = (window: IWindow): IWindow => (coarse === 1 || window.stations[1] > below ? window : { ...window, rows: Math.max(7, Math.round(window.rows * coarse)), columns: Math.max(7, Math.round(window.columns * coarse)) });
        // `--bare`: the wall alone, no relief of any kind, for a wall that is spliced and given its reliefs in a later run (`--wall`).
        const windows: IWindow[] = BARE ? [] : part.reliefs === "auto" ?hollowWindows(part.name, rows, skins, course, (hull, p) => observedDepth(hull, p, part.loose === true)).map((window: H.IWindow): IWindow => ({ ...window, stations: [part.name === "auricle" ? Math.max(window.stations[0], domain[0]) : window.stations[0], Math.min(window.stations[1], part.reliefEnd ?? tip ?? Infinity)], fade: [50, 50], fadePhase: [0.6, 0.6] })) : part.reliefs.map(scaled);

        // Phases from 0 to a whole turn have their middle at pi, where the inward radial direction is +u, and a quarter turn on it is +v. A
        // net over a window of phases with middle `c` casts toward the course as well: `cos(t - c) A + sin(t - c) T` is the inward radial
        // direction `-(cos t u + sin t v)` at every phase `t` for `A = -(cos c u + sin c v)` and `T = sin c u - cos c v` (at `c = pi`, `u`
        // and `v`).
        const rounds: IWindow[] = (BARE ? [] : part.rounds ?? []).map((net): IWindow => {
          const frame: IAutoMovieLoftSectionFrame = course.at((net.stations[0] + net.stations[1]) / 2);
          const phases: [number, number] = net.window?.phases ?? [0, 2 * Math.PI];
          const c: number = (phases[0] + phases[1]) / 2;
          const axis: R.V = net.window === undefined ? [frame.u[0], frame.u[1], frame.u[2]] : ([0, 1, 2].map((k: number): number => -(Math.cos(c) * frame.u[k]! + Math.sin(c) * frame.v[k]!)) as R.V);
          const turn: R.V = net.window === undefined ? [frame.v[0], frame.v[1], frame.v[2]] : ([0, 1, 2].map((k: number): number => Math.sin(c) * frame.u[k]! - Math.cos(c) * frame.v[k]!) as R.V);
          return { name: part.name + "." + net.name, stations: net.stations, phases, axis, turn, rows: net.rows, columns: net.columns, mirror: false, ...(net.window === undefined ? { periodic: true, ...(net.fade === undefined ? {} : { fade: net.fade }) } : { fade: net.window.fade, fadePhase: net.window.fadePhase }), chord: true, reach: net.reach, ...(net.hold === undefined ? {} : { hold: net.hold }), ...(net.graze === undefined ? {} : { graze: net.graze }) };
        });
        // A window splice carries every stored relief in its stored order and fits again only those wholly inside its window: a relief that
        // straddles the window's edge, fitted again from scratch, moved the trunk's head and breasts up to 13 mm away from the window.
        const touching = (stations: readonly [number, number] | readonly number[]): boolean => spliced?.window === undefined || (stations[0]! >= spliced.window[0] && stations[1]! <= spliced.window[1]);
        const refitted: string[] | null = carried === null ? null : (process.argv.find((argument: string): boolean => argument.startsWith("--refit-reliefs="))?.slice("--refit-reliefs=".length).split(",") ?? null);
        definition.reliefs = spliced?.window === undefined ? [] : spliced.head.filter((relief: IAutoMovieLoftRelief): boolean => !touching(relief.stations));
        const fitAll = (list: readonly IWindow[], judged: boolean): void => {
         for (const window of list) {
          // Each window is fitted over the wall with every earlier relief already on it, as the engine composes them, so a later window takes only what the earlier ones left.
          const earlier: IAutoMovieLoftRelief[] = [...(definition.reliefs ?? [])];
          const fitted: H.IResult = H.fit(window, rows.map((row: F.IRow, i: number): H.IRow => {
            const section: IAutoMovieViewChain.ISection = C.chain(read(row.s), definition.layout);
            const frame: IAutoMovieLoftSectionFrame = course.at(row.s);
            const inChart = (axis: readonly number[]): C.P => [axis[0]! * frame.u[0] + axis[1]! * frame.u[1] + axis[2]! * frame.u[2], axis[0]! * frame.v[0] + axis[1]! * frame.v[1] + axis[2]! * frame.v[2]];
            // A cast that lands on the chord closing a neighbour's cut (the ear's, the nose's, the arm's) has found no skin: inside the cut the clip is positive.
            const left: ((p: R.V) => number) | undefined = window.uncut === true ? part.kept : window.chord === true ? undefined : part.clip;
            // C4a: an observed region's edge, an unseen footprint (`IPart.unseen`) or a hold (`holdWidth: "span"`), spans at least the control
            // spacing of the net that reads it: its row pitch along the station or its column pitch round the section at the landing's radius,
            // the larger (lofting.md: an edge is resolved only when every sampling across it is at most a quarter of its roll). At 3 mm the nose
            // box's unseen edge stood under `trunk.head`'s 6.2 mm column and drew a line round the section, 5.97 against 1.36 deg/mm at s 771.
            const span = (p: C.P): number => Math.max((window.stations[1] - window.stations[0]) / (window.rows - 3), ((window.phases[1] - window.phases[0]) / (window.columns - 3)) * Math.hypot(p[0], p[1]));
            const quintic = (x: number): number => x * x * x * (10 - 15 * x + 6 * x * x);
            // Skin a neighbour owns (`IPart.unseen`) weighs less the nearer a landing is to it, from a span outside it to its edge, by the quintic
            // smooth step (`H.IRow.open`). The nose box's floor fades into the face for the sections alone (`noseCut`): between 1,544 and
            // 1,550 mm its receding front let the face's nets land on the nose's own base, and at 0.15 rad the face net's targets swung from
            // 1.21 to -4.71 to 0.02 mm over s 764 to 770 and the head net's from 9.63 to 5.10 to 9.47, every landing inside the box.
            const unseen: ((p: R.V) => number) | undefined = window.uncut === true || window.chord === true ? undefined : part.unseen;
            const open = left === undefined ? undefined : (p: C.P): boolean | number => {
              const q: R.V = [frame.origin[0] + p[0] * frame.u[0] + p[1] * frame.v[0], frame.origin[1] + p[0] * frame.u[1] + p[1] * frame.v[1], frame.origin[2] + p[0] * frame.u[2] + p[1] * frame.v[2]];
              if (left(q) > 0.05) return true;
              if (unseen === undefined) return false;
              const width: number = span(p);
              return quintic(Math.min(1, Math.max(0, (unseen(q) + width) / width)));
            };
            // With `holdWidth` the hold is a share that rises from none at the held region's edge to all of it that far inside, by the quintic
            // smooth step, so the target is C2 across the edge (`H.IRow.hold`).
            const hold = window.hold === undefined ? undefined : (p: C.P): boolean | number => {
              const inside: number = window.hold!([frame.origin[0] + p[0] * frame.u[0] + p[1] * frame.v[0], frame.origin[1] + p[0] * frame.u[1] + p[1] * frame.v[1], frame.origin[2] + p[0] * frame.u[2] + p[1] * frame.v[2]]);
              if (window.holdWidth === undefined) return inside > 0;
              return quintic(Math.min(1, Math.max(0, inside / (window.holdWidth === "span" ? span(p) : window.holdWidth))));
            };
            // A window that leaves grazing casts unobserved (`graze`) reads the skin's rise along the station from the uncut reference sections
            // 1 mm either side, along the in-plane normal where the cast lands.
            const slope = window.graze === undefined ? undefined : ((): ((p: C.P, normal: C.P) => number | null) => {
              const below: C.P[] | null = outline.cut(course.at(row.s - 1)).loop;
              const above: C.P[] | null = outline.cut(course.at(row.s + 1)).loop;
              return (p: C.P, normal: C.P): number | null => {
                const a: number | null = below === null ? null : H.cast(below, p, normal);
                const b: number | null = above === null ? null : H.cast(above, p, normal);
                return a === null || b === null ? null : (b - a) / 2;
              };
            })();
            const own: C.P[] = window.chord === true ? loops[i]! : skins[i]!;
            const uncut: C.P[] | null = window.uncut === true && row.s > window.stations[0] && row.s < window.stations[1] ? outline.cut(frame).loop : null;
            const whole: C.P[] | null = uncut === null || part.kept === undefined ? uncut : without(uncut, frame, part.kept);
            const blocked: H.IRow["blocked"] = part.around === undefined || part.clip === undefined || whole !== null
              ? undefined
              : (() => {
                  const actual = outline.chains(frame);
                  return (from, direction, along): boolean => actual.some(({ points, closed }): boolean => {
                    const crossing = H.crossing(points, from, direction, undefined, closed);
                    if (crossing === null || !(Math.abs(crossing.along) < Math.abs(along))) return false;
                    const p: C.P = [from[0] + crossing.along * direction[0], from[1] + crossing.along * direction[1]];
                    return part.clip!(chartToWorld(frame, p)) > 0;
                  });
                })();
            return { s: row.s, ...(hold === undefined ? {} : { hold }), ...(slope === undefined ? {} : { slope }), skin: whole ?? (row.runs === undefined ? own : []),
              ...(part.around === undefined || whole !== null ? {} : { retained }),
              ...(blocked === undefined ? {} : { blocked }),
              heldout: row.heldout, ...(open === undefined ? {} : { open }), wall: (phi: number): C.P => {
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
        // `--refit-reliefs=<name>,...` with `--wall`: the stored wall and every stored relief and cast are carried in their stored order, and
        // only the named ones are fitted again, each over the carried reliefs stored before it, with its twin written by reflection. A region's
        // fix stays within the region on the stored representation around it (construction.md, Repair); a relief that is not named is never
        // fitted again, whatever it straddles.
        if (refitted !== null && carried !== null) {
          definition.reliefs = [];
          for (const relief of carried.reliefs) {
            if (!refitted.includes(relief.name)) {
              if (!refitted.some((name: string): boolean => relief.name === name + ".twin")) definition.reliefs.push(relief);
              continue;
            }
            const window: IWindow | undefined = windows.find((candidate: IWindow): boolean => candidate.name === relief.name);
            if (window !== undefined) fitAll([window], false);
          }
        }
        // `--keep-windows`: every window the hollow search places is kept whatever the keep rule says, to read what it does.
        else fitAll(windows.filter((window: IWindow): boolean => touching(window.stations)), part.reliefs === "auto" && !process.argv.includes("--keep-windows"));

        // A spliced wall takes the reliefs as it takes the knots: each wall's own stored ones on its side of the station, since those were
        // fitted on the very values the splice keeps there. Fitted again over the whole spliced wall, the hollow search placed other windows
        // and the keep rule dropped the one over the hollow in front of the shoulder, which left the skin 8 mm inside the wall there.
        // `--refit` keeps the reliefs fitted just above over the whole spliced wall instead: for a splice inside a window both walls share.
        if (spliced !== null && spliced.window === undefined && !process.argv.includes("--refit")) {
          const { tail, at, head }: { tail: K.IStored; at: number; head: IAutoMovieLoftRelief[] } = spliced;
          // A stored net that goes once round the part is left behind: those are fitted again below, over the spliced wall.
          const window = (relief: IAutoMovieLoftRelief): boolean => relief.phases[1] - relief.phases[0] < 2 * Math.PI - 1e-9;
          // A net round the part's runs (`IPart.rounds`) is fitted again below even where it spans less than a turn (the palm's), so a stored
          // one is not carried as a hollow as well.
          const round = (relief: IAutoMovieLoftRelief): boolean => rounds.some((window: IWindow): boolean => window.name === relief.name);
          // The other wall's nets round the part wholly past `at` (the arm's forearm, hand and palm nets) are carried as stored, on the very
          // wall the held splice keeps there: fitted again over it, the hand's net moved the skin up to 2.4 mm at 600 to 640 mm.
          let hollow: number = 0;
          const hollowName = (relief: IAutoMovieLoftRelief): IAutoMovieLoftRelief => ({ ...relief, name: part.name + ".hollow." + hollow++ });
          // A wall's hollow goes with the wall it starts on: the arm's elbow hollow, fitted on the head, runs 10 mm past the splice into the
          // forearm net's first stations, as the stored arm's own elbow hollow did.
          definition.reliefs = [...head.filter((relief: IAutoMovieLoftRelief): boolean => window(relief) && !round(relief) && relief.stations[0] < at).map(hollowName), ...(tail.reliefs ?? []).filter((relief: IAutoMovieLoftRelief): boolean => relief.stations[0] >= at && (round(relief) || window(relief))).map((relief: IAutoMovieLoftRelief): IAutoMovieLoftRelief => (round(relief) ? relief : hollowName(relief)))];
          log("family-body-spliced", { part: part.name, at, reliefs: definition.reliefs.map((relief: IAutoMovieLoftRelief): string => relief.name + " " + relief.stations.join("..")) });
        }

        // The nets round the part come last, over whichever reliefs the wall has kept.
        fitAll(rounds.filter((window: IWindow): boolean => touching(window.stations) && (refitted === null || refitted.includes(window.name)) && !(spliced !== null && spliced.window === undefined && !process.argv.includes("--refit") && (definition.reliefs ?? []).some((relief: IAutoMovieLoftRelief): boolean => relief.name === window.name))), false);
        await fs.writeFile(path.join(out, part.name + ".family.json"), JSON.stringify(definition));
      }
      // `--against=<directory>[+<shift>]`: how far the part's skin, reliefs on and caps off, moved from another stored wall's (`stored` for
      // the Human package's), read at the same phases every 2 mm where both have fields, that wall's stations being this one's less the
      // shift; the largest move over every 20 mm stretch. A splice or a window refit shows here whether the skin outside it stayed put.
      const against: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--against="))?.slice("--against=".length);
      if (against !== undefined) {
        // `@<from>`: both lofted from that station on only, so a move that the engine carries along its stations from a change before it is
        // told from a change of the walls themselves.
        const [otherDir, shiftText]: string[] = against.split("@")[0]!.split("+");
        const lofted: number = Number(against.split("@")[1] ?? -Infinity);
        const other: K.IStored = await storedWall(otherDir!, part.name);
        const shift: number = Number(shiftText ?? 0);
        const low: number = Math.max(definition.knots[0]!, other.knots[0]! + shift, lofted);
        const high: number = Math.min(definition.knots.at(-1)!, other.knots.at(-1)! + shift);
        const at: number[] = Array.from({ length: Math.floor((high - low) / 2) + 1 }, (_: unknown, i: number): number => low + 2 * i);
        // Both lofted on 1,024 phases (`IFamily.phase`): each part's own count follows its girth and its finest net, and the arm spliced
        // onto a new head took another count than the stored arm, which alone read as 0.05 to 0.2 mm of skin moved past the splice.
        const fine: number = (2 * Math.PI) / 1024;
        // The skin with its reliefs, and the wall alone (no reliefs), so a move is placed on the wall or on a net.
        const moved = (bare: boolean): string[] => {
          const strip = (family: K.IStored): K.IStored => ({ ...family, tips: undefined, phase: fine, ...(bare ? { reliefs: undefined } : {}) });
          const mine = K.create(strip(definition), at).chain;
          const theirs = K.create(strip(other), at.map((s: number): number => s - shift)).chain;
          if (mine === null || theirs === null) throw new Error("--against: a wall does not loft");
          const stretches: Map<number, number> = new Map();
          // Each of 128 points of this ring to the nearest of 2,048 points of the other's: the two walls' phases are spaced by each part's own
          // girth (`AutoMovieHumanConicLoft.part`), so a point at the same phase on each is not the same point of the skin.
          for (const s of at) {
            let most: number = 0;
            const ring: number[][] = Array.from({ length: 2048 }, (_: unknown, j: number): number[] => AutoMovieLoftChain.point(theirs, s - shift, (2 * Math.PI * j) / 2048));
            for (let j: number = 0; j < 128; ++j) {
              const p: number[] = AutoMovieLoftChain.point(mine, s, (2 * Math.PI * j) / 128);
              most = Math.max(most, Math.min(...ring.map((q: number[]): number => Math.hypot(p[0]! - q[0]!, p[1]! - q[1]!, p[2]! - q[2]!))));
            }
            const key: number = Math.floor(s / 20) * 20;
            stretches.set(key, Math.max(stretches.get(key) ?? 0, most));
          }
          return [...stretches.entries()].map(([from, most]: [number, number]): string => `${from}..${from + 20}: ${most.toFixed(3)}`);
        };
        // How far the two courses' points and charts stand apart at the shared stations: a shift that is not the courses' own leaves a
        // whole ring moved along the course, which reads above as skin moved wherever the part tapers.
        const courses = at.filter((_: number, i: number): boolean => i % 20 === 0).map((s: number): string => {
          const [a, b] = [K.axis(definition).at(s), K.axis(other).at(s - shift)];
          const gap: number = Math.hypot(a.origin[0]! - b.origin[0]!, a.origin[1]! - b.origin[1]!, a.origin[2]! - b.origin[2]!);
          const angle = (p: readonly number[], q: readonly number[]): number => (Math.acos(Math.max(-1, Math.min(1, (p[0]! * q[0]! + p[1]! * q[1]! + p[2]! * q[2]!) / (Math.hypot(p[0]!, p[1]!, p[2]!) * Math.hypot(q[0]!, q[1]!, q[2]!))))) * 180) / Math.PI;
          // The plane's normal, the course's tangent: u x v.
          const normal = (f: IAutoMovieLoftSectionFrame): number[] => [f.u[1]! * f.v[2]! - f.u[2]! * f.v[1]!, f.u[2]! * f.v[0]! - f.u[0]! * f.v[2]!, f.u[0]! * f.v[1]! - f.u[1]! * f.v[0]!];
          return `${s}: ${gap.toFixed(3)} mm, u ${angle(a.u, b.u).toFixed(3)} v ${angle(a.v, b.v).toFixed(3)} tangent ${angle(normal(a), normal(b)).toFixed(3)} deg`;
        });
        log("family-body-against", { part: part.name, against, shift, movedMmByStretch: moved(false), wallMovedMmByStretch: moved(true), courses });
      }
      const actualStart: number = definition.knots[0]!;
      const actualEnd: number = definition.knots.at(-1)!;
      const physicalRows: F.IRow[] = rows.filter((row: F.IRow): boolean => row.s >= actualStart && row.s <= actualEnd);
      if (inherited !== null && (actualStart !== domain[0] || (rootFit ? actualEnd < domain[1] : actualEnd !== domain[1]) || physicalRows.length !== rows.length)) {
        const fault: string = "open wall does not own the full requested measured domain";
        receipt.push({ part: part.name, trail, fault, actual: [actualStart, actualEnd], requested: domain });
        log("family-body-engine", { part: part.name, fault, actual: [actualStart, actualEnd], requested: domain });
        continue;
      }
      const stations: number[] = tailTrace !== null || inherited !== null
        ? [...new Set([actualStart, ...physicalRows.map((row: F.IRow): number => row.s), actualEnd])]
        : rows.map((row: F.IRow): number => row.s);
      const lofted: number = performance.now();
      const loft: IAutoMovieViewLoft.IResult = K.create(definition, stations);
      const loftMs: number = performance.now() - lofted;
      if (loft.chain === null) {
        receipt.push({ part: part.name, trail, engineFault: loft.diagnostics });
        log("family-body-engine", { part: part.name, fault: loft.diagnostics });
        continue;
      }
      const chain: NonNullable<IAutoMovieViewLoft.IResult["chain"]> = loft.chain;
      const stage: IAutoMovieViewAxis.IAxis = K.axis(definition);
      let maximum: number = 0;
      let sum: number = 0;
      let n: number = 0;
      const worstRows: string[] = [];
      const heldRows: { s: number; worstMm: number; phaseDeg: number; world: number[]; held: Record<string, number> }[] = [];
      rows.forEach((row: F.IRow, i: number): void => {
        if (tailTrace !== null && (row.s < actualStart || row.s > actualEnd)) return;
        // The regenerated section as a dense chart polyline; every observed skin vertex is measured to it.
        const frame: IAutoMovieLoftSectionFrame = stage.at(row.s);
        const ring: C.P[] = Array.from({ length: 512 }, (_: unknown, j: number): C.P => {
          const p: R.V = AutoMovieLoftChain.point(chain, row.s, (2 * Math.PI * j) / 512) as R.V;
          const d: R.V = [p[0] - frame.origin[0], p[1] - frame.origin[1], p[2] - frame.origin[2]];
          return [d[0] * frame.u[0] + d[1] * frame.u[1] + d[2] * frame.u[2], d[0] * frame.v[0] + d[1] * frame.v[1] + d[2] * frame.v[2]];
        });
        let rowMaximum: number = 0;
        let rowPhase: number = 0;
        let rowVertex: C.P = [0, 0];
        for (const vertex of skins[i]!) {
          // An invented point (`F.IRow.free`, a closure) is no skin, and no misfit is read there.
          if (row.free?.(vertex) === true) continue;
          const e: number = distance(vertex, ring);
          if (e > rowMaximum) {
            rowMaximum = e;
            rowPhase = Math.atan2(vertex[1], vertex[0]);
            rowVertex = vertex;
          }
          sum += e;
          ++n;
        }
        maximum = Math.max(maximum, rowMaximum);
        if (rowMaximum > TARGET_MM && i % 4 === 0) worstRows.push(row.s.toFixed(0) + ":" + rowMaximum.toFixed(1) + "@" + ((rowPhase * 180) / Math.PI).toFixed(0));
        // `--skin-held`: every section's worst skin vertex with how far inside each round's hold it lies, mm (positive: held), so a misfit
        // the part's nets leave can be told from one their hold keeps them off.
        if (SKIN_HELD) {
          const world: R.V = [0, 1, 2].map((c: number): number => frame.origin[c]! + rowVertex[0] * frame.u[c]! + rowVertex[1] * frame.v[c]!) as R.V;
          heldRows.push({ s: row.s, worstMm: round(rowMaximum), phaseDeg: Math.round((rowPhase * 180) / Math.PI), world: world.map(round), held: Object.fromEntries((part.rounds ?? []).filter((net): boolean => net.hold !== undefined && row.s > net.stations[0] && row.s < net.stations[1]).map((net): [string, number] => [net.name, round(net.hold!(world))])) });
        }
      });
      log("family-body-skin", { part: part.name, over: worstRows.join(" ") });
      if (SKIN_HELD) log("family-body-skin-held", { part: part.name, rows: heldRows });
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
      if (spliced?.tips !== undefined) definition.tips = spliced.tips;
      else if (tip !== null && inherited === null) definition.tips = [part.first !== undefined ? { from: domain[0], tip: part.first } : part.foot !== undefined ? { from: domain[0], tip: domain[0] - part.foot } : null, { from: part.cap ?? domain[1], tip, ...(part.covered === true ? { covered: true } : {}), ...(part.centre === undefined ? {} : { centre: part.centre }), ...(part.own === true ? { own: true } : {}) }];

      // Cast reliefs: skin that faces along the course, which no section sees. From points of the finished surface, by station and phase,
      // a ray runs along the relief's axis, and its distance to the reference triangle it meets is the height there. The ear's outer face
      // lies under its closed end and is cast back along the course on one net that closes on itself round the tip.
      // A window splice (`--splice=<directory>@<from>..<to>`) carries the stored casts whose stations miss the window, as its other reliefs.
      // `--refit-reliefs`: only the named casts are fitted again; the others are carried as stored.
      const recast: string[] | null = carried === null ? null : (process.argv.find((argument: string): boolean => argument.startsWith("--refit-reliefs="))?.slice("--refit-reliefs=".length).split(",") ?? null);
      if (recast !== null && carried !== null) definition.tips = carried.tips;
      const faces: ICast[] = tip === null || BARE || inherited !== null ? [] : (part.casts ?? []).filter((cast: ICast): boolean =>
        !(CHINLESS && cast.name === "chin") && (recast === null || recast.includes(part.name + "." + cast.name)) &&
        (spliced?.window === undefined || (Number(cast.stations[0]) >= spliced.window[0] && Number(cast.stations[1]) <= spliced.window[1])));
      const solid: Uint8Array | undefined = faces.length > 0 ? solids(skin) : undefined;
      for (const face of faces) {
        const capped: IAutoMovieViewLoft.IResult = K.create(definition, stations);
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
        for (let t: number = 0; t + 2 < skin.indices.length; t += 3) {
          if (solid![t / 3] === 0) continue;
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
        const missed: { s: number; phi: number; heldout: boolean }[] = [];
        for (const base of bases) {
          const target: number | null = face.held?.(base.s, base.phi) === true ? 0 : cast(base.p, toward(base.phi));
          if (target !== null) observed.push({ s: base.s, phi: base.phi, target, heldout: base.heldout });
          else missed.push({ s: base.s, phi: base.phi, heldout: base.heldout });
        }
        // `ICast.rest`: every missed point rests on the wall, and a landing takes the share of its height that rises from none beside a
        // missed point to all of it one control spacing away (the larger of its distances in row and in column spacings), by the quintic
        // smooth step.
        if (face.rest === true) {
          const rowSpan: number = (window.stations[1] - window.stations[0]) / (window.rows - 3);
          const columnSpan: number = (window.phases[1] - window.phases[0]) / (window.columns - 3);
          const quintic = (x: number): number => x * x * x * (10 - 15 * x + 6 * x * x);
          let whole: number = 0;
          for (const seen of observed) {
            const clear: number = missed.reduce((least: number, base: { s: number; phi: number }): number => Math.min(least, Math.max(Math.abs(seen.s - base.s) / rowSpan, Math.abs(seen.phi - base.phi) / columnSpan)), 1);
            if (clear >= 1) ++whole;
            seen.target *= quintic(clear);
          }
          const landed: number = observed.length;
          for (const base of missed) observed.push({ s: base.s, phi: base.phi, target: 0, heldout: base.heldout });
          log("family-body-rest", { part: part.name, relief: window.name, rays: bases.length, landed, whole, rested: missed.length });
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
      // `--refit-reliefs`: the reliefs and casts in their stored order, so a refitted cast stands where it stood.
      if (recast !== null && carried !== null) {
        const order: Map<string, number> = new Map(carried.reliefs.map((relief: IAutoMovieLoftRelief, i: number): [string, number] => [relief.name, i]));
        definition.reliefs = [...(definition.reliefs ?? [])].sort((a: IAutoMovieLoftRelief, b: IAutoMovieLoftRelief): number => (order.get(a.name) ?? Infinity) - (order.get(b.name) ?? Infinity));
        await fs.writeFile(path.join(out, part.name + ".family.json"), JSON.stringify(definition));
      }
      // A limb layout has 4 times 2^depth anchors round the section, a bilateral one 2 times 2^depth arcs over its half.
      const encoded: string = JSON.stringify(definition);
      const final: K.IStored = JSON.parse(encoded) as K.IStored;
      if (tailTrace !== null && spliced !== null) {
        const failure: string | null = tailTrace(final) ?? K.tailPolicyFault(final, { ...spliced.tail, tips: spliced.tips }) ??
          (rootFit && JSON.stringify(final.reliefs) !== JSON.stringify(spliced.tail.reliefs) ? "the canonical relief suite changed" : null);
        if (failure !== null) throw new Error("serialized splice: " + failure);
      }
      const anchors: number = final.layout.anchors.length;
      const moduleText: string = emit({ ...part, domain }, final, Math.round(Math.log2(final.layout.mirror ? (anchors - 1) / 2 : anchors / 4)), engine, rows.length);
      await fs.writeFile(path.join(out, moduleName(part.name) + ".ts"), moduleText);
      await fs.writeFile(path.join(out, moduleName(part.name) + ".placing.json"), JSON.stringify(placing(final)));

      const mark: number = tailTrace === null || spliced === null ? -Infinity : spliced.at;
      const prefix: number[] = final.knots.filter((s: number): boolean => s < mark);
      const measuredStations = retainedStations.filter(({ s }): boolean => s < mark && (measuredCuts.get(s)?.runs.length ?? 0) > 0);
      const required: number[] = inherited === null && tailTrace === null ? [] : [...stations, ...measuredStations.map(({ s }): number => s)];
      const native: string[] = K.refusals(final, 4, required);
      const refused: string[] = [...native];
      if (prefix.length > 0) {
        const cuts = measuredStations.map(({ s, heldout }): K.IPrefixCut => {
          const record: IMeasuredCut = measuredCuts.get(s)!;
          return {
            s, heldout,
            world: record.runs.flat().map((point: C.P): R.V => chartToWorld(record.frame, point)),
          };
        });
        const { evidence, observations, viewRefusals } = K.verifyPrefix(final, required, mark, cuts, TARGET_MM);
        log("family-body-splice-root", { part: part.name, changedPrefix, targetMm: TARGET_MM, ...evidence, observations, viewRefusals });
        if (evidence === null) refused.push("the sealed splice view could not read the measured stations");
        else if (!evidence.supported) refused.push(evidence.missing.length > 0 ? "the splice prefix has an interval without exposed observations" : "the splice prefix exceeds the declared fit target");
      }
      if (spliced !== null) {
        await fs.writeFile(path.join(out, part.name + ".family.json"), encoded);
        log("family-body-splice-custody", {
          part: part.name, at: spliced.at, tips: final.tips ?? null,
          tailTips: spliced.tips ?? null, admitted: refused.length === 0,
        });
      }
      log("family-body-native", { part: part.name, scope: rootFit || inherited === null ? "family" : "open-wall", cappedAdmitted: native.length === 0, admitted: refused.length === 0, refusals: refused.map((text: string): string => text.slice(0, 300)) });
      if (process.argv.includes("--emit") && inherited === null && refused.length === 0) await fs.writeFile(path.join(root, "packages/human/src/generation/f1", moduleName(part.name) + ".ts"), moduleText);
    }

    if (groupPlan !== undefined && group !== undefined) {
      const result = fitComposed(groupPlan, outlines.get("all")!, divides, collected, receipt, log, group.observeOnly);
      await fs.writeFile(path.join(out, group.observeOnly ? "observations.json" : "coupled-root.json"), JSON.stringify(result), { flag: "wx" });
      // `--emit`: an admitted group's families written into their stored modules, so the figure and its frames read the fitted joint.
      if (process.argv.includes("--emit") && result.admitted && "families" in result && result.families !== undefined)
        for (const [name, family] of Object.entries(result.families as Record<string, K.IStored>)) {
          const file: string = path.join(root, "packages/human/src/generation/f1", moduleName(name) + ".ts");
          const text: string | null = await fs.readFile(file, "utf8").catch((): null => null);
          if (text === null) { log("family-body-group-emit", { family: name, refusal: "no stored module " + file }); continue; }
          const written: string | string[] = restored(text, family);
          if (typeof written !== "string") { log("family-body-group-emit", { family: name, refusal: written.join("; ") }); continue; }
          // The pre-emit snapshot: the module as it stood, with its SHA-256, in the run's folder. The tree's modules carry uncommitted
          // work, so an emit is undone by copying this snapshot back, never from git.
          const snapshot: string = path.join(out, "pre-emit", moduleName(name) + ".ts");
          await fs.mkdir(path.dirname(snapshot), { recursive: true });
          await fs.writeFile(snapshot, text, { flag: "wx" });
          const before: string = createHash("sha256").update(text).digest("hex");
          await fs.writeFile(file, written);
          log("family-body-group-emit", { family: name, file, snapshot, snapshotSha256: before,
            writtenSha256: createHash("sha256").update(written).digest("hex"), knots: family.knots.length });
        }
      log(group.observeOnly ? "family-body-joint-observations" : "family-body-coupled-root",
        { owner: groupPlan.owner.name, admitted: result.admitted, refusal: result.refusal });
      return;
    }
    if (rootFit || (process.argv.includes("--precheck") && process.argv.some((a: string): boolean => a.startsWith("--dump-retained=")))) return;

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
  function inward(hull: readonly C.P[], p: C.P, retained?: (a: C.P, b: C.P) => boolean): number {
    let least: number = Infinity;
    let observed: boolean = true;
    let inside: boolean = true;
    for (let i: number = 0; i < hull.length; ++i) {
      const a: C.P = hull[i]!;
      const b: C.P = hull[(i + 1) % hull.length]!;
      const e: C.P = [b[0] - a[0], b[1] - a[1]];
      const length2: number = e[0] * e[0] + e[1] * e[1];
      if (length2 === 0) continue;
      if (e[0] * (p[1] - a[1]) - e[1] * (p[0] - a[0]) < 0) inside = false;
      const t: number = Math.max(
        0,
        Math.min(1, ((p[0] - a[0]) * e[0] + (p[1] - a[1]) * e[1]) / length2),
      );
      const depth: number = Math.hypot(p[0] - a[0] - t * e[0], p[1] - a[1] - t * e[1]);
      if (depth < least) {
        least = depth;
        observed = retained?.(a, b) ?? true;
      }
    }
    return !observed ? NaN : inside ? least : 0;
  }

  function hollowWindows(
    name: string,
    rows: readonly F.IRow[],
    skins: readonly C.P[][],
    course: IAutoMovieViewAxis.IAxis,
    depth: (hull: readonly C.P[], p: C.P) => number,
  ): H.IWindow[] {
    const deep: { s: number; phases: number[] }[] = rows.map(
      (row: F.IRow, i: number): { s: number; phases: number[] } => {
        // Depth below the tape hull, not below the fitted wall: the wall's own misfit is not a hollow. Toward the course, or for a loose
        // part (`normal`) in the section's plane along the hull's inward normal.
        return {
          s: row.s,
          phases: (row.runs === undefined ? skins[i]! : []).map((p: C.P): number =>
            Math.atan2(p[1], p[0]),
          ).filter((_: number, k: number): boolean =>
            depth(row.points, skins[i]![k]!) > 0.6 * TARGET_MM,
          ),
        };
      },
    );
    // Deep vertices are first split round the section: phases farther apart than a radian belong to different hollows (a spine groove and a cleavage share stations but not a window).
    const every: number[] = deep
      .flatMap((row: { s: number; phases: number[] }): number[] => row.phases)
      .sort((a: number, b: number): number => a - b);
    const windows: H.IWindow[] = [];
    log0?.("family-body-hollow-search", {
      part: name,
      deep: every.length,
      rows: rows.length,
    });
    if (every.length === 0) return windows;
    let widest: number = every[0]! + 2 * Math.PI - every.at(-1)!;
    let start: number = 0;
    for (let k: number = 1; k < every.length; ++k)
      if (every[k]! - every[k - 1]! > widest) {
        widest = every[k]! - every[k - 1]!;
        start = k;
      }
    const turned: number[] = [
      ...every.slice(start),
      ...every.slice(0, start).map((phi: number): number => phi + 2 * Math.PI),
    ];
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
          const pad: number = Math.max(
            0,
            Math.min(0.45, (2 * Math.PI - 0.4 - (cluster[1] - cluster[0])) / 2),
          );
          const from: number = cluster[0] - pad;
          const to: number = cluster[1] + pad;
          const stations: [number, number] = [run[0]! - 30, run.at(-1)! + 30];
          const frame: IAutoMovieLoftSectionFrame = course.at(
            (stations[0] + stations[1]) / 2,
          );
          const axis: [number, number, number] = [0, 1, 2].map(
            (c: number): number =>
              -(
                Math.cos(centre) * frame.u[c]! +
                Math.sin(centre) * frame.v[c]!
              ),
          ) as [number, number, number];

          // The cast turns with the phase about the window's middle, so a wide hollow is met square all the way across it.
          const turn: [number, number, number] = [0, 1, 2].map(
            (c: number): number =>
              -(
                -Math.sin(centre) * frame.u[c]! +
                Math.cos(centre) * frame.v[c]!
              ),
          ) as [number, number, number];
          windows.push({
            name: name + ".hollow." + windows.length,
            stations,
            phases: [from, to],
            axis,
            turn,
            rows: Math.max(7, Math.ceil((stations[1] - stations[0]) / 10) + 3),
            columns: Math.max(7, Math.ceil((to - from) / 0.15) + 3),
            mirror: false,
          });
        }
        run = [];
      };
      for (const row of deep) {
        if (row.phases.some((phi: number): boolean => within(phi, cluster)))
          run.push(row.s);
        else if (run.length > 0 && row.s - run.at(-1)! > 16) close();
      }
      close();
    }
    return windows;
  }

  /** Reference joints the families' courses run through, by the name the datum module gives each. */
  const JOINTS: readonly [string, string][] = [
    ["upperarm", "upperarm_r"],
    ["lowerarm", "lowerarm_r"],
    ["hand", "hand_r"],
    ["thigh", "thigh_r"],
    ["calf", "calf_r"],
    ["foot", "foot_r"],
    ...["index", "middle", "ring", "pinky", "thumb"].flatMap(
      (finger: string): [string, string][] =>
        [1, 2, 3].map((k: number): [string, string] => [
          finger + k,
          finger + "_0" + k + "_r",
        ]),
    ),
    ...["bigtoe", "indextoe", "middletoe", "ringtoe", "littletoe"].flatMap(
      (toe: string): [string, string][] =>
        [1, 2].map((k: number): [string, string] => [
          toe + k,
          toe + "_0" + k + "_r",
        ]),
    ),
  ];

  /**
   * The datum module, every joint centre the authored courses use, once, by name, and the world values read for it. The module holds no
   * coordinate: each datum reads the re-based table (`AutoMovieHumanF1Placing.POINTS`) by its own name, and the values written below
   * go to `FamilyConicRebase.ts --tables --world=<out>/joints.world.json`, which enters them in their segments' frames and builds the
   * course ends from them.
   */
  function joints(source: R.ISource): {
    text: string;
    world: Record<string, R.V>;
  } {
    const lines: string[] = [
      'import { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";',
      "",
      "/**",
      " * f1's joint centres on the +Z side in its reference pose: the datums every authored course of the figure runs through.",
      " *",
      " * Frame: millimetres, forward +X, up +Y, +Z the stored side. Each value is stored in the frame of the segment it belongs to",
      " * (`AutoMovieHumanF1Placing.POINTS`) and read here through the chain at the reference pose (`AutoMovieHumanF1Placement.point`), so this",
      " * module holds no coordinate. The joint centres are the reference rig's bind joint centres, read once offline by",
      " * `test/src/reference-conics/FamilyConicBody.ts --emit-joints` and re-based by `FamilyConicRebase.ts --tables`. A family names its",
      " * course by these datums and holds no joint coordinate of its own, so a law that places the joints from a person's measurements",
      " * replaces the table and every course follows.",
      " */",
      "export namespace AutoMovieHumanF1Joints {",
      "  /** A point in the figure's frame, mm. */",
      "  export type V3 = [number, number, number];",
      "",
    ];
    for (const [name, joint] of JOINTS)
      lines.push(
        "  /** Reference joint `" + joint + "`. */",
        "  export const " +
          name +
          ": V3 = " +
          JSON.stringify(source.joints.get(joint)!.map(round)).replaceAll(
            ",",
            ", ",
          ) +
          ";",
        "",
      );
    for (const [digit, last] of [
      ...["index", "middle", "ring", "pinky", "thumb"].map(
        (finger: string): [string, number] => [finger, 3],
      ),
      ...["bigtoe", "indextoe", "middletoe", "ringtoe", "littletoe"].map(
        (toe: string): [string, number] => [toe, 2],
      ),
    ] as [string, number][])
      lines.push(
        "  /** The far point of the " +
          (digit.endsWith("toe")
            ? digit.replace("toe", " toe")
            : digit === "thumb"
              ? digit
              : digit + " finger") +
          "'s pad: the skin's farthest point along its last segment, within " +
          PAD.reach +
          " mm of that segment's line. Its course aims at it. */",
        "  export const " +
          digit +
          "Pad: V3 = " +
          JSON.stringify(
            pad(
              source.body,
              source.joints.get(digit + "_0" + (last - 1) + "_r")!,
              source.joints.get(digit + "_0" + last + "_r")!,
            ),
          ).replaceAll(",", ", ") +
          ";",
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
      "  export const armpit: V3 = [-25, " +
        ARMPIT_Y_MM +
        ", " +
        ARMPIT_MM +
        "];",
      "",
      "  /**",
      "   * Where the arm's course starts, inside the trunk beside the armscye's plane, 35 mm above the armpit's crease and midway between the",
      "   * shoulder's fore and aft edges. The course leaves it straight to the side, so the arm's first sections lie beside that plane.",
      "   */",
      "  export const armRoot: V3 = " +
        JSON.stringify(ARM_ROOT).replaceAll(",", ", ") +
        ";",
      "",
      "  /** The corner the arm's course turns at, round the shoulder, from straight to the side to the line down to the elbow. */",
      "  export const armTurn: V3 = " +
        JSON.stringify(ARM_TURN).replaceAll(",", ", ") +
        ";",
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
      "  export const breastRoot: V3 = " +
        JSON.stringify(BREAST_ROOT).replaceAll(",", ", ") +
        ";",
      "",
      "  /** Where the breast's course ends, along the same normal 8 mm past the top. */",
      "  export const breastTip: V3 = " +
        JSON.stringify(BREAST_TIP).replaceAll(",", ", ") +
        ";",
      "",
      "  /** Where a nostril's course starts, below the nose under the middle of the nostril's mouth. */",
      "  export const nostrilRoot: V3 = [127.1, 1540.4, 7.7];",
      "",
      "  /** Where a nostril's course ends, straight up inside the nose. */",
      "  export const nostrilTip: V3 = [119.1, 1560.4, 7.7];",
      "",
      "  /**",
      "   * Where the arm's and the hand's courses end: 40 mm past the middle finger's first joint along the mean direction of the four fingers'",
      "   * first segments (`toward(middle1, [[index1, index2], [middle1, middle2], [ring1, ring2], [pinky1, pinky2]], 40)` at the reference",
      "   * pose), a point of the hand, about which the palm's sections past the knuckles are read.",
      "   */",
      '  export const handEnd: V3 = AutoMovieHumanF1Placement.point("handEnd");',
      "",
      "  /**",
      "   * Where the leg's course ends: 40 mm past the ball of the foot along the mean direction of the five toes' first segments",
      "   * (`toward(footBall, [[bigtoe1, bigtoe2], ..., [littletoe1, littletoe2]], 40)` at the reference pose), a point of the foot.",
      "   */",
      '  export const footEnd: V3 = AutoMovieHumanF1Placement.point("footEnd");',
      "",
      "  /** Where the index finger's course ends: 4 mm past its pad's far point on the line from its last joint (`beyond(index3, indexPad, 4)`), a point of its distal phalanx. */",
      '  export const indexEnd: V3 = AutoMovieHumanF1Placement.point("indexEnd");',
      "",
      "  /** Where the middle finger's course ends: `beyond(middle3, middlePad, 4)`, a point of its distal phalanx. */",
      '  export const middleEnd: V3 = AutoMovieHumanF1Placement.point("middleEnd");',
      "",
      "  /** Where the ring finger's course ends: `beyond(ring3, ringPad, 4)`, a point of its distal phalanx. */",
      '  export const ringEnd: V3 = AutoMovieHumanF1Placement.point("ringEnd");',
      "",
      "  /** Where the pinky finger's course ends: `beyond(pinky3, pinkyPad, 4)`, a point of its distal phalanx. */",
      '  export const pinkyEnd: V3 = AutoMovieHumanF1Placement.point("pinkyEnd");',
      "",
      "  /** Where the thumb's course ends: `beyond(thumb3, thumbPad, 4)`, a point of its distal phalanx. */",
      '  export const thumbEnd: V3 = AutoMovieHumanF1Placement.point("thumbEnd");',
      "",
      "  /** Where the big toe's course ends: `beyond(bigtoe2, bigtoePad, 4)`, a point of its distal segment. */",
      '  export const bigtoeEnd: V3 = AutoMovieHumanF1Placement.point("bigtoeEnd");',
      "",
      "  /** Where the index toe's course ends: `beyond(indextoe2, indextoePad, 4)`, a point of its distal segment. */",
      '  export const indextoeEnd: V3 = AutoMovieHumanF1Placement.point("indextoeEnd");',
      "",
      "  /** Where the middle toe's course ends: `beyond(middletoe2, middletoePad, 4)`, a point of its distal segment. */",
      '  export const middletoeEnd: V3 = AutoMovieHumanF1Placement.point("middletoeEnd");',
      "",
      "  /** Where the ring toe's course ends: `beyond(ringtoe2, ringtoePad, 4)`, a point of its distal segment. */",
      '  export const ringtoeEnd: V3 = AutoMovieHumanF1Placement.point("ringtoeEnd");',
      "",
      "  /** Where the little toe's course ends: `beyond(littletoe2, littletoePad, 4)`, a point of its distal segment. */",
      '  export const littletoeEnd: V3 = AutoMovieHumanF1Placement.point("littletoeEnd");',
      "",
      "  /**",
      "   * The course of the armpit's slit cutter (`AutoMovieHumanF1Axilla`), through the slit's air from under the crease's front to the cusp",
      "   * behind it, as `test/src/reference-conics/FamilyConicBody.ts` laid it (`AXILLA`); points of the thorax, on whose side the slit was read.",
      "   */",
      '  export const axilla: V3[] = AutoMovieHumanF1Placement.points("axilla");',
      "",
      "  /** The course of the vault cutter (`AutoMovieHumanF1Vault`, a constructed form outside the body), as `FamilyConicBody.ts` laid it (`VAULT`); points of the thorax. */",
      '  export const vault: V3[] = AutoMovieHumanF1Placement.points("vault");',
      "",
      "  /**",
      "   * Where the breast's band fans against the trunk below the breast's side (`AutoMovieHumanF1.BREAST_FAN_FILL_MM` fairs the skin about",
      "   * it): a dark dash on `fold.left` (px 600..640 x 335..345), folds of 14 degrees in the band's own triangles at",
      "   * [98..101, 1243..1247, 109..111] in the reference pose, where the port loop's distance falls from 56 to 47 mm within an eighth of a",
      "   * turn. A point of the thorax.",
      "   */",
      '  export const breastFan: V3 = AutoMovieHumanF1Placement.point("breastFan");',
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
    const world: Record<string, R.V> = {};
    const text: string[] = lines.map((line: string): string => {
      const one: RegExpMatchArray | null = line.match(
        /^(\s*export const (\w+): V3 = )(\[[^\]]*\]);$/,
      );
      const many: RegExpMatchArray | null = line.match(
        /^(\s*export const (\w+): V3\[\] = )(\[\[.*\]\]);$/,
      );
      if (one !== null) {
        world[one[2]!] = JSON.parse(one[3]!) as R.V;
        return (
          one[1]! +
          "AutoMovieHumanF1Placement.point(" +
          JSON.stringify(one[2]) +
          ");"
        );
      }
      if (many !== null) {
        (JSON.parse(many[3]!) as R.V[]).forEach(
          (p: R.V, k: number): void => void (world[many[2]! + "." + k] = p),
        );
        return (
          many[1]! +
          "AutoMovieHumanF1Placement.points(" +
          JSON.stringify(many[2]) +
          ");"
        );
      }
      return line;
    });
    return { text: text.join("\n"), world };
  }

  /**
   * A stored module's text with its family's knots and field rows replaced by a fitted family's, in place: the knots' line, and each
   * row of `values` in order. A module whose rows differ in count from the family's, or with no knots' line, is refused with the reason.
   * Its doc comment gains one line naming the fit, once.
   */
  function restored(text: string, family: K.IStored): string | string[] {
    const lines: string[] = text.split("\n");
    const problems: string[] = [];
    const knots: number = lines.findIndex((line: string): boolean => /^\s+knots: \[.*\],\s*$/.test(line));
    if (knots < 0) problems.push("no knots line");
    const start: number = lines.findIndex((line: string): boolean => /^\s+values: \[\s*$/.test(line));
    const rows: number[] = [];
    if (start < 0) problems.push("no values block");
    else for (let i: number = start + 1; i < lines.length && !/^\s+\],\s*$/.test(lines[i]!); ++i)
      if (/^\s+\[[-0-9.eE, ]+\],\s*$/.test(lines[i]!)) rows.push(i);
    if (rows.length !== family.values.length) problems.push(`${rows.length} stored rows against ${family.values.length} fitted`);
    if (problems.length > 0) return problems;
    lines[knots] = lines[knots]!.replace(/knots: \[.*\]/, "knots: " + JSON.stringify(family.knots).replaceAll(",", ", "));
    rows.forEach((i: number, k: number): void => {
      lines[i] = lines[i]!.replace(/\[.*\]/, JSON.stringify(family.values[k]).replaceAll(",", ", "));
    });
    const note: string = " * The root stretch is the junction's fairing fit (`FamilyConicBody --joint-group=... --emit`; joints-one-shot.md, \"Amendments, decided 2026-11-22\").";
    const close: number = lines.findIndex((line: string, i: number): boolean => line === " */" && /^export const /.test(lines[i + 1] ?? ""));
    if (close >= 0 && !lines.includes(note)) lines.splice(close, 0, " *", note);
    return lines.join("\n");
  }

  /** Module and constant name of a part's authored family. */
  function moduleName(part: string): string {
    return (
      "AutoMovieHumanF1" +
      part
        .split(".")
        .map((word: string): string => word[0]!.toUpperCase() + word.slice(1))
        .join("")
    );
  }

  /**
   * The station interval a part can be fitted on: the longest run of stations, 1 mm apart along the course, whose cut is one
   * loop round the course with an area at most twice the median of the course's outer half. Where the part runs into its
   * parent the loop takes the parent in and its area jumps, which ends the run.
   */
  function span(
    outline: ReturnType<typeof R.prepare>,
    axis: IAutoMovieViewAxis.IAxis,
    centres: readonly R.V[],
  ): [number, number] {
    let length: number = 0;
    for (let i: number = 1; i < centres.length; ++i)
      length += Math.hypot(
        centres[i]![0] - centres[i - 1]![0],
        centres[i]![1] - centres[i - 1]![1],
        centres[i]![2] - centres[i - 1]![2],
      );
    const areas: (number | null)[] = [];
    for (let s: number = 0; s <= length; ++s) {
      const loop: C.P[] | null = outline.cut(axis.at(s)).loop;
      areas.push(loop === null ? null : R.area(loop));
    }
    const outer: number[] = areas
      .slice(Math.floor(areas.length / 2))
      .filter((a: number | null): a is number => a !== null)
      .sort((a: number, b: number): number => a - b);
    const limit: number = 2 * (outer[Math.floor(outer.length / 2)] ?? Infinity);
    let best: [number, number] = [0, 0];
    let from: number = -1;
    for (let s: number = 0; s <= areas.length; ++s) {
      const good: boolean =
        s < areas.length && areas[s] !== null && areas[s]! <= limit;
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
    const guides: string[] = [
      "front (+u)",
      "side (+v)",
      "back (-u)",
      "side (-v)",
    ];
    let guide: number = 0;
    layout.anchors.forEach((anchor: C.IAnchor, k: number): void => {
      if (anchor.kind === "m")
        out.push(
          "median fullness f of the arc pair around anchor " + k + ", share",
        );
      else if (anchor.kind === "i")
        out.push(
          "inflection place t on its chord, share",
          "inflection tangent turn from the chord, rad",
        );
      else {
        const name: string =
          anchor.guide === true
            ? guides[guide++ % 4]! + " extreme"
            : "anchor " + k;
        out.push(name + ": u, mm");
        if (anchor.mid !== true) out.push(name + ": v, mm");
      }
    });
    const arcs: number = layout.mirror
      ? layout.anchors.length - 1
      : layout.anchors.length;
    for (let k: number = 0; k < arcs; ++k)
      out.push("shoulder rho of the arc after anchor " + k + ", share");
    return out;
  }

  /** The authored TypeScript module of a fitted family, with its frame, units, source and measured receipt in its comment. */
  function emit(
    part: IPart & { domain: [number, number] },
    family: K.IStored,
    depth: number,
    engine: { engineMaxMm: number; engineMeanMm: number; scalars: number },
    sections: number,
  ): string {
    const name: string = moduleName(part.name);
    const names: string[] = labels(family.layout);
    const explicit: boolean = family.layout.least !== undefined || family.layout.anchors.some((anchor: C.IAnchor): boolean => anchor.kind === "f");
    const lines: string[] = [
      'import type { IAutoMovieHumanConicLoft } from "@automovie/interface";',
      ...(explicit
        ? []
        : [
            'import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";',
          ]),
      // The joints are imported only when the course names them; a course written as numbers leaves the import unused.
      ...(part.course.includes("J.")
        ? ['import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";']
        : []),
      // The placing fields read the re-based table (`AutoMovieHumanF1Placing`), which `FamilyConicRebase.ts --tables` writes; their world
      // values go to it by name through `placing`.
      'import { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";',
      "",
      "/**",
      " * f1's " +
        part.name +
        " tape wall" +
        (part.mirrored
          ? " on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly"
          : "") +
        ".",
      " *",
      " * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs",
      " * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each",
      " * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.",
      " *",
      " * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between",
      " * them: the section is a chain of conics through its four extremes" +
        (depth > 0 ? " and one median point per quarter" : "") +
        (grooves(family.layout).length > 0
          ? ", with a groove of two inflections and its floor after anchors " +
            grooves(family.layout).join(" and ")
          : "") +
        (part.skin === undefined
          ? ", fitted to the convex hull of the reference skin"
          : ", fitted to the section itself"),
      (part.skin === undefined
        ? " * (the path of a taut tape)."
        : part.air !== undefined
          ? " * read along rays from the course: the air round the course point, capped under the band it cuts and drawn in from the walls."
          : " * read along rays from the course, so it is star-shaped about it.") +
        (family.layout.mirror
          ? " Its front and back extremes stand on the median line and its +v half is reflected in it."
          : ""),
      " *",
      " * Source: the f1 reference " +
        (part.head === true
          ? "head"
          : part.whole === true
            ? "body and head"
            : "body") +
        " cut by this course's own planes over stations " +
        part.domain[0] +
        " to " +
        part.domain[1] +
        " mm, " +
        sections +
        " sections " +
        (part.step ?? STEP_MM) / 2 +
        " mm apart, every",
      " * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over",
      " * all sections). Regenerated through the engine's view loft from these numbers alone, " +
        (part.loose === true
          ? "the vertices of each section's hull lie"
          : "the reference skin's cut vertices lie"),
      " * " +
        engine.engineMeanMm +
        " mm from it on average and at most " +
        engine.engineMaxMm +
        " mm" +
        (part.loose === true
          ? "; what lies inside that hull is not modelled"
          : "") +
        ". " +
        engine.scalars +
        " independent numbers.",
      " */",
      "export const " + name + ": IAutoMovieHumanConicLoft.IFamily = {",
      "  name: " + JSON.stringify(family.name) + ",",
      "  centres: " +
        part.course.replaceAll("J.", "AutoMovieHumanF1Joints.") +
        ",",
      "  halves: " + JSON.stringify(family.halves).replaceAll(",", ", ") + ",",
      "  up: AutoMovieHumanF1Placement.direction(" +
        JSON.stringify(family.name + ".up") +
        "),",
      ...(family.roll === undefined
        ? []
        : [
            "  // The chart's roll about the course, radians at its own knots (`AutoMovieHumanConicLoft.IFamily.roll`).",
            "  roll: { knots: " +
              JSON.stringify(family.roll.knots).replaceAll(",", ", ") +
              ", values: " +
              JSON.stringify(family.roll.values).replaceAll(",", ", ") +
              " },",
          ]),
      // A layout with feature anchors has no constructor of its own in the model, so it is written out.
      explicit
        ? "  layout: " +
          JSON.stringify(family.layout)
            .replaceAll(",", ", ")
            .replaceAll(":", ": ") +
          ","
        : "  layout: AutoMovieHumanConicSection." +
          (family.layout.mirror
            ? "bilateral(" + depth + ")"
            : family.layout.anchors[0]?.mid === true
              ? "lens(" + depth + ")"
              : grooves(family.layout).length > 0
                ? "inflected(" +
                  depth +
                  ", " +
                  JSON.stringify(grooves(family.layout)).replaceAll(",", ", ") +
                  ")"
                : "limb(" + depth + ")") +
          ",",
      "  knots: " + JSON.stringify(family.knots).replaceAll(",", ", ") + ",",
      "  values: [",
    ];
    family.values.forEach((field: number[], f: number): void => {
      lines.push(
        "    // " + names[f],
        "    " + JSON.stringify(field).replaceAll(",", ", ") + ",",
      );
    });
    lines.push("  ],");
    if (family.pitch !== undefined)
      lines.push(
        "",
        "  // Phases round the part stand at most this far apart, mm (`AutoMovieHumanConicLoft.IFamily.pitch`).",
        "  pitch: " + family.pitch + ",",
      );
    if (family.phase !== undefined) lines.push("  phase: " + family.phase + ",");
    if (family.turn !== undefined) lines.push("  turn: " + family.turn + ",");
    if (family.tips !== undefined)
      lines.push(
        "",
        "  // The part closes in a point at `tip`, " +
          (typeof part.tip === "number"
            ? "a station placed by anatomy"
            : "the station where the reference's own loop vanishes") +
          "; its cap starts at `from`.",
        "  tips: " +
          JSON.stringify(family.tips)
            .replaceAll('"', "")
            .replaceAll(",", ", ")
            .replaceAll(":", ": ") +
          ",",
      );
    if (family.reliefs !== undefined && family.reliefs.length > 0) {
      // Each independent height is written once (`AutoMovieHumanConicRelief`): a net its part declares mirrored (`mirror: true`) that
      // equals its own column reversal is written as its half, and a declared twin (`<name>.twin`) that is its original with the columns
      // reversed as that original's name, with its own window and directions. A net that fails its check is written whole.
      const declared: Set<string> = new Set(
        [
          ...(part.reliefs === "auto" ? [] : part.reliefs),
          ...(part.casts ?? []),
        ]
          .filter(
            (window: { mirror?: boolean }): boolean => window.mirror === true,
          )
          .flatMap((window: { name: string }): string[] => [
            window.name,
            part.name + "." + window.name,
          ]),
      );
      const reversed = (
        one: IAutoMovieLoftRelief,
        other: IAutoMovieLoftRelief,
      ): boolean =>
        one.rows === other.rows &&
        one.columns === other.columns &&
        one.heights.every(
          (h: number, i: number): boolean =>
            h ===
            other.heights[
              i - (i % one.columns) + (one.columns - 1 - (i % one.columns))
            ],
        );
      const placed = (relief: IAutoMovieLoftRelief, text: string): string =>
        text
          .replaceAll(",", ", ")
          .replace(
            /"axis":\[[^\]]*\]/,
            '"axis":AutoMovieHumanF1Placement.direction(' +
              JSON.stringify(relief.name + ".axis") +
              ")",
          )
          .replace(
            /"turn":\[[^\]]*\]/,
            '"turn":AutoMovieHumanF1Placement.direction(' +
              JSON.stringify(relief.name + ".turn") +
              ")",
          );
      let twins: number = 0;
      let halves: number = 0;
      const entries: string[] = family.reliefs.map(
        (relief: IAutoMovieLoftRelief, index: number): string => {
          const phases: number[] =
            Math.abs(relief.phases[1] - relief.phases[0] - 2 * Math.PI) < 1e-9
              ? relief.phases
              : relief.phases.map(round4);
          const axis: number[] = relief.axis.map(
            (x: number): number => Math.round(x * 1e5) / 1e5,
          );
          const original: IAutoMovieLoftRelief | undefined =
            relief.name.endsWith(".twin")
              ? family
                  .reliefs!.slice(0, index)
                  .find(
                    (other: IAutoMovieLoftRelief): boolean =>
                      other.name === relief.name.slice(0, -5),
                  )
              : undefined;
          if (
            original !== undefined &&
            reversed(relief, original) &&
            relief.stations[0] === original.stations[0] &&
            relief.stations[1] === original.stations[1] &&
            (relief.turn === undefined) === (original.turn === undefined)
          ) {
            ++twins;
            return placed(
              relief,
              JSON.stringify({
                name: relief.name,
                twin: original.name,
                phases,
                axis,
                ...(relief.turn === undefined ? {} : { turn: relief.turn }),
              }),
            );
          }
          const whole: string = placed(
            relief,
            JSON.stringify({ ...relief, phases, axis }),
          );
          if (
            !declared.has(relief.name) ||
            relief.columns % 2 !== 1 ||
            !reversed(relief, relief)
          )
            return whole;
          ++halves;
          const kept: number = (relief.columns + 1) / 2;
          return whole.replace(
            /"heights":\[[^\]]*\]/,
            '"heights":AutoMovieHumanConicRelief.mirrored(' +
              relief.rows +
              ", " +
              relief.columns +
              ", " +
              JSON.stringify(
                relief.heights.filter(
                  (_: number, i: number): boolean => i % relief.columns < kept,
                ),
              ).replaceAll(",", ", ") +
              ")",
          );
        },
      );
      if (twins + halves > 0)
        lines.splice(
          1,
          0,
          'import { AutoMovieHumanConicRelief } from "../conic/AutoMovieHumanConicRelief";',
        );
      lines.push(
        "",
        "  // Reliefs: heights in mm of a uniform cubic B-spline net over a window of the wall's chart, moved along `axis`; they carry the skin that lies inside the tape wall.",
        twins > 0
          ? "  reliefs: AutoMovieHumanConicRelief.list(["
          : "  reliefs: [",
      );
      for (const entry of entries) lines.push("    " + entry + ",");
      lines.push(twins > 0 ? "  ])," : "  ],");
    }
    lines.push("};", "");
    return lines.join("\n");
  }

  /**
   * The world values of a fitted family's placing directions by their names in the re-based table (`AutoMovieHumanF1Placing.DIRECTIONS`):
   * its `up`, and each relief's `axis`, rounded as `emit` rounded it before the module read the table, and `turn`. The module `emit`
   * writes holds none of them; `FamilyConicRebase.ts --tables --world=<file>` enters them in their segments' frames.
   */
  function placing(family: K.IStored): {
    directions: Record<string, number[]>;
  } {
    const directions: Record<string, number[]> = {
      [family.name + ".up"]: family.up,
    };
    for (const relief of family.reliefs ?? []) {
      directions[relief.name + ".axis"] = relief.axis.map(
        (x: number): number => Math.round(x * 1e5) / 1e5,
      );
      if (relief.turn !== undefined)
        directions[relief.name + ".turn"] = relief.turn;
    }
    return { directions };
  }

  /**
   * The anchors of the limb layout after which a grooved layout (`AutoMovieHumanConicSection.inflected`) stands a groove `[i, m, i]`: each
   * `i` that starts such a triple follows the base anchor counted before it.
   */
  function grooves(layout: C.ILayout): number[] {
    const out: number[] = [];
    let base: number = -1;
    layout.anchors.forEach((anchor: C.IAnchor, k: number): void => {
      if (
        anchor.kind === "i" &&
        layout.anchors[k + 1]?.kind === "m" &&
        layout.anchors[k + 2]?.kind === "i"
      )
        out.push(base);
      else if (
        anchor.kind !== "i" &&
        !(
          anchor.kind === "m" &&
          layout.anchors[k - 1]?.kind === "i" &&
          layout.anchors[k + 1]?.kind === "i"
        )
      )
        ++base;
    });
    return out;
  }

  /**
   * A stored wall: `<directory>/<part>.family.json` of an earlier run, or with `stored` the family the Human package holds now
   * (`AutoMovieHumanF1.BODY`), so a wall emitted long ago can be spliced or refitted on without its run's directory. Read so by `--wall`,
   * `--splice`, `--seed`, `--seed-tail`, `--target-wall` and `--against`.
   */
  async function storedWall(directory: string, name: string): Promise<K.IStored> {
    if (directory !== "stored") return JSON.parse(await fs.readFile(path.join(directory, name + ".family.json"), "utf8")) as K.IStored;
    const family: K.IStored | undefined =
      AutoMovieHumanF1.PRE_DOME_DIGITS.find(({ family }): boolean => family.name === name)?.family ??
      AutoMovieHumanF1.FAMILIES.map((member: IAutoMovieHumanF1.IMember): K.IStored => member.family)
        .find((candidate: K.IStored): boolean => candidate.name === name);
    if (family === undefined) throw new Error("no stored family " + name);
    return JSON.parse(JSON.stringify(family)) as K.IStored;
  }

  /** A section chart's point in the world, mm. */
  function chartToWorld(frame: IAutoMovieLoftSectionFrame, p: C.P): R.V {
    return [0, 1, 2].map(
      (k: number): number =>
        frame.origin[k]! + p[0] * frame.u[k]! + p[1] * frame.v[k]!,
    ) as R.V;
  }

  /** Re-read stored walls and directed source cuts without starting a fit or rasterizer. */
  async function replayPrefixes(
    manifest: string,
    out: string,
    log: (event: string, detail: object) => void,
  ): Promise<void> {
    const inputs = JSON.parse(await fs.readFile(manifest, "utf8")) as {
      part: string;
      wall: { file: string; sha256: string };
      measured: { file: string; sha256: string };
      mark: number;
    }[];
    if (inputs.length === 0 || new Set(inputs.map(({ part }): string => part)).size !== inputs.length)
      throw new Error("prefix replay needs distinct named input records");
    const read = async ({ file, sha256 }: { file: string; sha256: string }): Promise<string> => {
      const contents: Buffer = await fs.readFile(file);
      if (createHash("sha256").update(contents).digest("hex") !== sha256.toLowerCase())
        throw new Error("prefix replay input changed: " + file);
      return contents.toString("utf8");
    };
    const receipts: unknown[] = [];
    for (const input of inputs) {
      const final = JSON.parse(await read(input.wall)) as K.IStored;
      const measured = JSON.parse(await read(input.measured)) as {
        part: string;
        domain: [number, number];
        units: "mm";
        rows: { s: number; heldout: boolean; frame: IAutoMovieLoftSectionFrame; runs?: C.P[][] }[];
      };
      if (final.name !== input.part || measured.part !== input.part || measured.units !== "mm" ||
          measured.domain[0] !== final.knots[0] || input.mark <= measured.domain[0] ||
          input.mark > measured.domain[1] || !final.knots.includes(input.mark))
        throw new Error("prefix replay source, station or units mismatch: " + input.part);
      const cuts = measured.rows.filter(({ s, runs }): boolean => s < input.mark && (runs?.length ?? 0) > 0)
        .map(({ s, heldout, frame, runs }): K.IPrefixCut => ({
          s, heldout, world: runs!.flat().map((point: C.P): R.V => chartToWorld(frame, point)),
        }));
      const checked = K.verifyPrefix(final, final.knots, input.mark, cuts, TARGET_MM);
      const receipt = { ...input, targetMm: TARGET_MM, ...checked };
      receipts.push(receipt);
      log("family-body-prefix-replay", receipt);
    }
    await fs.writeFile(path.join(out, "prefix-replay.json"), JSON.stringify(receipts));
  }

  /** A direct cut and the vertices on each of its measured, owned runs. */
  interface IMeasuredCut {
    frame: IAutoMovieLoftSectionFrame;
    points: C.P[];
    measured: boolean[];
    signs: number[];
    runs: C.P[][];
  }



  /** How a section closed across its part's opening (`without`), or why it did not. */
  type Closure = "conic" | "s" | "around" | "chord" | "short" | "outside";

  /** Point and directed edge custody of a generated closure in a measured cut. */
  interface IClosureProvenance {
    points: WeakSet<C.P>;
    next: WeakMap<C.P, C.P>;
    runs?: C.P[][];
  }

  function retainedRuns(provenance: IClosureProvenance): C.P[][] | undefined {
    return provenance.runs;
  }

  /**
   * The convex tape can skip measured vertices. Its edge is still supported
   * by retained skin if the source arc contains only retained points and edges.
   */
  function hullContainsClosure(
    loop: readonly C.P[],
    indices: ReadonlyMap<C.P, number>,
    p: C.P,
    q: C.P,
    step: number,
    provenance: IClosureProvenance,
  ): boolean {
    if (provenance.points.has(p) || provenance.points.has(q)) return true;
    let k: number = indices.get(p)!;
    const last: number = indices.get(q)!;
    while (k !== last) {
      const next: number = (k + step + loop.length) % loop.length;
      const [a, b]: [C.P, C.P] = step > 0 ? [loop[k]!, loop[next]!] : [loop[next]!, loop[k]!];
      if (provenance.points.has(loop[next]!) || provenance.next.get(a) === b) return true;
      k = next;
    }
    return false;
  }

  /**
   * A section loop without the stretch a neighbouring part owns: the vertices where `outside` is positive are dropped and each crossing of zero,
   * found by bisection on its edge, becomes a vertex, so the loop closes by a straight chord from where it leaves to where it returns.
   */
  function without(loop: readonly C.P[], frame: IAutoMovieLoftSectionFrame, outside: (p: R.V) => number, round?: (p: R.V) => number, opening?: (p: R.V) => number, report?: (kind: Closure, detail?: string, span?: [number, number], rho?: { side: number; most: number; used: number }) => void, cap?: (side: number) => number | undefined, around?: number, tube?: readonly C.P[], provenance?: IClosureProvenance): C.P[] | null {
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
    if (around !== undefined && provenance !== undefined)
      provenance.runs = kinds.flatMap((kind, i: number): C.P[][] => {
        if (kind !== "entry") return [];
        const run: C.P[] = [];
        for (let j: number = (i + 1) % out.length; kinds[j] === "vertex"; j = (j + 1) % out.length)
          run.push(out[j]!);
        return run.length < 2 ? [] : [run];
      });
    if (out.length < 3) return null;
    const generated = (from: C.P, made: readonly C.P[], to: C.P): void => {
      if (provenance === undefined) return;
      const arc: C.P[] = [from, ...made, to];
      made.forEach((point: C.P): void => { provenance.points.add(point); });
      arc.slice(1).forEach((point: C.P, i: number): void => { provenance.next.set(arc[i]!, point); });
    };
    if (round === undefined && opening === undefined) {
      out.forEach((p: C.P, k: number): void => {
        const n: number = (k + 1) % out.length;
        if (kinds[k] === "exit" && kinds[n] === "entry") generated(p, [], out[n]!);
      });
      return out;
    }

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
    const fullest = (side: number, build: (rho: number) => C.P[], holds: (points: readonly C.P[]) => boolean = contained): { points: C.P[]; most: number; used: number } => {
      let most: number = CLOSURE_LEAST;
      for (let rho: number = 0.5; rho > CLOSURE_LEAST; rho -= 0.01)
        if (holds(build(rho))) {
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
    let trimmed: [number, number] = [0, 0];
    // The first kept point after the last closure's entry: a later closure takes its exit back no farther.
    let low: number = 0;
    const closure = (k: number): C.P[] | null => {
      const e1: C.P = out[k]!, e2: C.P = out[(k + 1) % out.length]!;
      const side: number = Math.sign(e1[1] + e2[1]) || 1;

      const t1: C.P = unit(step(k, -1), e1), t2: C.P = unit(e2, step((k + 1) % out.length, 1));
      // Round the course (`IPart.around`): two arcs through a far point M at the opening's middle direction from the course point, its
      // tangent square to the radius there, at a share of the kept skin's mean radius.
      // Round the course (`IPart.around`): the buried arc is the part's own tube continued (`FamilyConicClosure.continued`), the
      // radius of its nearest whole section at each phase of the opening, brought to the kept skin's radius and direction at both
      // ends. A far point scaled to the kept skin's mean radius, which this replaces, knew neither the part's own section nor its
      // neighbour: it turned corners at parting planes (f1's toes, its middle finger), swung out through the host's skin where the
      // kept skin's ends diverge (the arm's root, a horn in front of the chest), and each rule added to it moved the refusal to
      // another arc. Where the continuation's premises fail the opening is named in the report and closed across its chord below.
      if (around !== undefined) {
        // A ray's kept skin ends where it stops advancing round its course. At a web's floor, and where two digits are pressed on each
        // other, the skin before the parting plane turns back toward the neighbour and runs into the groove between them: that
        // stretch is the web's, which a composed end reads as the valley of the two walls' union and gives to its bands, and no
        // child's round. So each end of the kept skin is taken back to its last point that still advances (the skin's direction
        // there has a circumferential part in the loop's sense), within this opening's own neighbours in the loop, and the tube is
        // continued from there. Left on, f1's pressed toes and its middle finger at the web's floor had no continuation at all.
        const advancing = (at: C.P, along: C.P): boolean => (along[1] * at[0] - along[0] * at[1]) / (Math.hypot(at[0], at[1]) || 1) > ADVANCE_LEAST;
        let [a, b]: [number, number] = [k, (k + 1) % out.length];
        while (a > low && kinds[a - 1] === "vertex" && !advancing(out[a]!, unit(step(a, -1), out[a]!))) --a;
        while (b + 1 < out.length && kinds[b + 1] === "vertex" && b !== 0 && !advancing(out[b]!, unit(out[b]!, step(b, 1)))) ++b;
        const [x1, x2]: C.P[] = [out[a]!, out[b]!];
        const span: [number, number] = [Math.atan2(x1![1], x1![0]), Math.atan2(x2![1], x2![0])];
        if (tube === undefined) {
          report?.("outside", "continued: no whole tube supports this opening", span);
          return null;
        }
        const made: C.P[] | string = FamilyConicClosure.continued(
          x1!, unit(step(a, -1), x1!), x2!, unit(x2!, step(b, 1)),
          (phase: number): number => C.radius(tube, phase),
          { section: loop, tube },
        );
        if (typeof made !== "string") {
          trimmed = [k - a, b === 0 ? 0 : b - (k + 1)];
          report?.("around", `continued${trimmed[0] + trimmed[1] > 0 ? ` (kept skin taken back ${trimmed[0]} and ${trimmed[1]} points)` : ""}: opening down to ${Math.min(...made.map((p: C.P): number => opening!(world(p)))).toFixed(1)} mm`, span);
          return made;
        }
        report?.("outside", `continued: ${made}`, span);
        return null;
      }
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
    // The kept points a continued closure replaces at its two ends (`trimmed`, set by `closure`): the last of them before the exit
    // are taken off again, and the first after the entry are passed over.
    let skip: number = 0;
    let refused: boolean = false;
    out.forEach((p: C.P, k: number): void => {
      if (refused) return;
      if (skip > 0) {
        --skip;
        return;
      }
      closed.push(p);
      const next: C.P = out[(k + 1) % out.length]!;
      if (kinds[k] === "exit" && kinds[(k + 1) % out.length] === "entry" && opened[k] === true) {
        trimmed = [0, 0];
        const result: C.P[] | null = closure(k);
        if (result === null && around !== undefined) {
          refused = true;
          return;
        }
        const made: C.P[] = result ?? [];
        closed.splice(closed.length - trimmed[0], trimmed[0]);
        const entry: C.P = out[(k + 1 + trimmed[1]) % out.length]!;
        generated(closed.at(-1)!, made, entry);
        closed.push(...made);
        skip = trimmed[1];
        low = k + 1 + trimmed[1];
        return;
      }
      if (kinds[k] !== "exit" || kinds[(k + 1) % out.length] !== "entry") return;
      if (round === undefined || Math.abs(round(world(p))) > 0.5 || Math.abs(round(world(next))) > 0.5) {
        generated(p, [], next);
        return;
      }
      const [a, b]: number[] = [Math.atan2(p[1], p[0]), Math.atan2(next[1], next[0])];
      const sweep: number = Math.atan2(Math.sin(b - a), Math.cos(b - a));
      const [ra, rb]: number[] = [Math.hypot(p[0], p[1]), Math.hypot(next[0], next[1])];
      const steps: number = Math.ceil(Math.abs(sweep) / ((2 * Math.PI) / 180));
      const arc: C.P[] = [];
      for (let i: number = 1; i < steps; ++i) {
        const t: number = i / steps;
        const r: number = ra + (rb - ra) * t;
        arc.push([r * Math.cos(a + sweep * t), r * Math.sin(a + sweep * t)]);
      }
      generated(p, arc, next);
      closed.push(...arc);
    });
    return refused ? null : closed;
  }

  /** Distance from a chart point to a closed polyline, mm. */
  function distance(p: C.P, ring: readonly C.P[]): number {
    let best: number = Infinity;
    for (let i: number = 0; i < ring.length; ++i) {
      const a: C.P = ring[i]!;
      const b: C.P = ring[(i + 1) % ring.length]!;
      const dx: number = b[0] - a[0];
      const dy: number = b[1] - a[1];
      const t: number = Math.max(
        0,
        Math.min(
          1,
          ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1),
        ),
      );
      best = Math.min(
        best,
        Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy),
      );
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
  process.stderr.write(
    (error instanceof Error ? (error.stack ?? error.message) : String(error)) +
      "\n",
  );
  process.exitCode = 1;
});

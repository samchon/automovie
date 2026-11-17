import { AutoMovieHumanConicLoft as H } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection as S } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanCourseRuns as Runs } from "../conic/AutoMovieHumanCourseRuns";
import { AutoMovieHumanSegmentFrame as F } from "../frame/AutoMovieHumanSegmentFrame";
import { AutoMovieHumanF1Arm } from "./AutoMovieHumanF1Arm";
import { AutoMovieHumanF1Breast } from "./AutoMovieHumanF1Breast";
import { AutoMovieHumanF1FingerMiddle } from "./AutoMovieHumanF1FingerMiddle";
import { AutoMovieHumanF1Hand } from "./AutoMovieHumanF1Hand";
import { AutoMovieHumanF1Leg } from "./AutoMovieHumanF1Leg";
import { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";
import { AutoMovieHumanF1Placing as T } from "./AutoMovieHumanF1Placing";
import { AutoMovieHumanF1RootControls } from "./AutoMovieHumanF1RootControls";
import { AutoMovieHumanF1ToeBig } from "./AutoMovieHumanF1ToeBig";
import { AutoMovieHumanF1Trunk } from "./AutoMovieHumanF1Trunk";
import {
  AutoMovieConstructionPortCurve,
  AutoMovieLoftRelief,
  AutoMovieLoftViewFullSource,
  AutoMovieLoftViewRead,
  AutoMovieLoftViewSource,
  AutoMovieViewChain,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionPortLoop,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanConicSection,
  IAutoMovieHumanSegmentFrame,
  IAutoMovieLoftRelief,
  IAutoMovieLoftViewFullSource,
  IAutoMovieViewAxis,
  IAutoMovieViewChain,
} from "@automovie/interface";

/**
 * The one owner of the native path's measurement sites: where each tissue field is read on its family's course, by the site's published
 * definition (ISO 8559-1:2017, ISO 7250-1:2017, ANSUR II), evaluated on f1's stored families, frames, datums and port loops.
 *
 * Every site is a course station, mm, with the run of its course that carries it to another person: the stretch between two course
 * centres (a limb's joints) or, on the trunk's one straight course, between the segment origins (the hip centres' midpoint, suprasternale,
 * the bitragion midpoint). A person's site keeps its run and its tau (`AutoMovieHumanCourseRuns.map`), so the site follows the person's
 * segment lengths and is the reference station exactly at f1's.
 *
 * A definition is evaluated on the reference, never on the person's generated wall: a site such as the widest calf read on a wall that its
 * own caliper generates would be circular. Sites whose definition f1's skin cannot show (the thyroid cartilage, the head's own boundary)
 * are `provisional`: f1's authored station, carried by its run and tau, until a definition is readable.
 *
 * Findings against the stations the native path held before this owner (2026-11-17), kept as the definitions give them:
 * - the hand's site stands at 579.37 mm, 39.37 mm past the former 540: 540 was a mid-palm proxy, and ISO 7250-1 6.3.3 and ANSUR II take
 *   the hand's breadth and circumference at the metacarpal heads;
 * - the foot's site stands at 964.21 mm, 16.21 mm past the former 948: 948 was a forefoot knot, and ANSUR II takes the ball of the foot
 *   over the first and fifth metatarsal heads;
 * - omphalion stands at 267.42 mm against 268.6 (the navel net's pit on the bare wall), the hip level at 105 against 104 (the scan's
 *   1 mm grid) and the bust point at 474.65 against 475.16 (the apex scan's 128 phases); every other site agrees within 0.003 mm.
 * A consumer that still anchors a profile or a tape at a former station reads another section than the calibration's caliper.
 */
export namespace AutoMovieHumanF1NativeSites {
  /** A course station's run: its course centres or segment origins, its index on the course and its normalized place. */
  export interface IRun {
    /** The run's first end: a course centre or segment origin by name. */
    from: string;

    /** The run's last end. */
    to: string;

    /** The run's index among the course's runs. */
    index: number;

    /** `(s - start) / (end - start)` on the reference course. */
    tau: number;
  }

  /** One measurement site on a family's course. */
  export interface ISite {
    /** The family whose course holds the site. */
    family: "trunk" | "arm" | "hand" | "leg";

    /** The site's course station, mm, arclength from the course's first centre. */
    station: number;

    /** The written definition the station is read by, with its standard. */
    definition: string;

    /** `definition`: read by its definition on the reference; `provisional`: f1's authored station of an unreadable definition. */
    basis: "definition" | "provisional";

    /** The run that carries the site to another person. */
    run: IRun;

    /** The bind segment whose length or frame carries the run (`SEGMENTS`), by its chain name. */
    segment: string;
  }

  /** A digit's measurement site on its own course. */
  export interface IDigitSite {
    /** The digit family whose course holds the site, by its name. */
    family: string;

    /** The site's station on that course, mm, arclength from its first centre (the digit's first joint). */
    station: number;

    /** The written definition the station is read by. */
    definition: string;
  }

  /** Every site of the native path. */
  export interface ISites {
    /** The trunk's wall sites, the trunk course's stations. */
    wall: Record<"hip" | "omphalion" | "underbust" | "bust" | "neck" | "head", ISite>;

    /** The arm's sites on its course; the wrist lies on the hand family's domain of the same course. */
    arm: Record<"upperArm" | "elbow" | "forearm" | "wrist", ISite>;

    /** The leg's sites on its course. */
    leg: Record<"thigh" | "knee" | "calf" | "ankle", ISite>;

    /** The hand's metacarpal site on the hand family and the foot's ball site on the leg family. */
    extremities: Record<"hand" | "foot", ISite>;

    /**
     * The representative finger's and toe's caliper sites, each a station of that digit's own course, mm. A digit's girth has no field of
     * its own yet (one finger and one toe stand for theirs), so the site is the representative digit's; the station is a material
     * station of the digit's course and is carried to a person by that course's own map.
     */
    digits: Record<"finger" | "toe", IDigitSite>;

    /** The run ends of each course, mm: trunk by segment origins, limbs by course centres. */
    runs: Record<"trunk" | "arm" | "hand" | "leg", number[]>;

    /** The blend window's half length at each interior run end of each course, mm (`windows`); absent, every window is zero. */
    windows?: Record<"trunk" | "arm" | "hand" | "leg", number[]>;
  }

  /** What a site reads: the person's frames, datums, families and the mammary port loops, as one assembly holds them. */
  export interface IInput {
    /** Every segment's frame at the pose, in the figure's frame. */
    frames: ReadonlyMap<string, IAutoMovieHumanSegmentFrame>;

    /** A stored datum in the figure's frame, mm. */
    point: (name: string) => AutoMovieVector3Tuple;

    /** The families whose courses hold sites. */
    body: Record<"trunk" | "arm" | "hand" | "leg" | "breast", IAutoMovieHumanConicLoft.IFamily>;

    /** The breast's port loops on the trunk's chart (`AutoMovieHumanF1RootControls.breast`); the first is the stored side's. */
    roots: { breast: readonly IAutoMovieConstructionPortLoop[] };

    /** The representative finger's and toe's families, the digits whose calipers stand for their hand's and foot's digits. */
    digits: Record<"finger" | "toe", IAutoMovieHumanConicLoft.IFamily>;
  }

  /** Angular samples of a section's girth: the limb law's 360, under 0.1 % short of the curve for a 100 mm limb. */
  const GIRTH_PHASES: number = 360;

  /** Grid of the extreme scans, mm: the limb law's 1 mm from the run's start, so f1's argmax sites are reproduced. */
  const STEP_MM: number = 1;

  /**
   * Grid of the navel pit's scan, mm: the navel net's control rows stand 2 mm apart (a 32 mm window over 16 spans), so a hundredth of a
   * millimetre resolves the pit of its cubic field two hundred times finer than the field can turn.
   */
  const PIT_STEP_MM: number = 0.01;

  /**
   * The names of each course's run ends: the trunk's two course centres around the three segment origins that divide it, and each limb's
   * course centres as `AutoMovieHumanF1Placing.COURSES` names them (the arm and the hand share one course).
   */
  const ENDS: Record<ISite["family"], readonly string[]> = {
    trunk: [T.COURSES["trunk"]![0]!, "pelvis", "thorax", "head", T.COURSES["trunk"]![1]!],
    arm: T.COURSES["arm"]!,
    hand: T.COURSES["hand"]!,
    leg: T.COURSES["leg"]!,
  };

  /**
   * The bind segment that carries each run of each course, by run index: the segment whose length moves the run's far end, or, for a run
   * between two datums of one segment, that segment. The trunk's runs lie between the segment origins of the chain's pelvis, thorax and
   * head, whose offsets are the trunk lengths (`AutoMovieHumanF1SegmentLengths`); the limbs' between the course centres of
   * `AutoMovieHumanF1Placing.COURSES`: the arm leaves the thorax (its first two centres are thorax datums), then follows the humerus, the
   * forearm and the hand; the leg follows the femur, the tibia and the foot.
   */
  const SEGMENTS: Record<ISite["family"], readonly string[]> = {
    trunk: ["pelvis", "pelvis", "thorax", "head"],
    arm: ["thorax", "humerus", "forearm", "hand", "hand"],
    hand: ["thorax", "humerus", "forearm", "hand", "hand"],
    leg: ["femur", "tibia", "foot", "foot"],
  };

  /**
   * f1's authored neck-skin site on the trunk course, mm: the native path's tape proxy for ISO 8559-1 5.3.2 neck girth ("just below the
   * bulge at the thyroid cartilage, perpendicular to the longitudinal axis of the neck"). The thyroid cartilage does not show on f1's skin,
   * so the definition is unreadable; the station is carried by its tau in the suprasternale-to-bitragion run. Provisional, f1 only.
   */
  const NECK_F1_MM: number = 690.26;

  /**
   * f1's authored head-skin site, mm: the trunk knot where the head's own sections begin, 9 mm above the bitragion midpoint (the head
   * frame's origin). No published measure names this boundary; carried by its tau in the bitragion-to-crown run. Provisional, f1 only.
   */
  const HEAD_F1_MM: number = 792;

  /**
   * The run ends of a person's four courses, mm. The trunk's course is straight, so its run ends are the projections of the pelvis's, the
   * thorax's and the head's frame origins on it, between 0 and its length; a limb's are its course's nearest approaches to its centres.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The trunk's runs end at the segment origins whose offsets are the trunk lengths; the limbs' at their course centres, the limb law's joints.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One projection per trunk origin and one `AutoMovieHumanCourseRuns.ends` per limb course.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An absent segment frame is refused; non-increasing run ends are refused by the limb reader and by the map that consumes them.
   * @evidence contracts/development/implementation.md#efficient-algorithms One millimetre scan of each limb course per interior centre.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `evaluate`, `carry` and `maps` all read their runs here.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns four fresh arrays.
   */
  export function runs(input: IInput): ISites["runs"] {
    const { trunk, arm, hand, leg } = input.body;
    const trunkAxis: IAutoMovieViewAxis.IAxis = H.axis(trunk);
    const trunkLength: number = Runs.length(trunk.centres);
    const foot0: AutoMovieVector3Tuple = [...trunkAxis.at(0).origin] as AutoMovieVector3Tuple;
    const tangent: AutoMovieVector3Tuple = F.unit(F.sub([...trunkAxis.at(trunkLength).origin] as AutoMovieVector3Tuple, foot0));
    const origin = (name: string): number => {
      const found: IAutoMovieHumanSegmentFrame | undefined = input.frames.get(name);
      if (found === undefined) throw new Error("native sites need the segment frame " + name);
      return F.dot(F.sub(found.origin, foot0), tangent);
    };
    return {
      trunk: [0, origin("pelvis"), origin("thorax"), origin("head"), trunkLength],
      arm: Runs.joints(arm.centres, arm.halves),
      hand: Runs.joints(hand.centres, hand.halves),
      leg: Runs.joints(leg.centres, leg.halves),
    };
  }

  /**
   * The half length of the blend window at every interior run end of a person's four courses, mm, for the smooth material map
   * (`AutoMovieHumanCourseRuns.smooth`). A limb's are its turns' own half lengths: the stretch of course the joint already bends over.
   * The trunk's course has no turn, so each of its windows is the wall's mean guide reach at that run end (a change of length at a
   * segment origin spreads over about the wall's own radius there), held to half of each neighbouring run so no two windows overlap.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A limb's window is its joint's turn; the trunk's is the section's own size at the segment origin, bounded by the runs it lies between.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The limbs' halves are borrowed; the trunk takes one section read per origin.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A run end outside the trunk's knots takes no window rather than an extrapolated section.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three section reads.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the runs once through `runs`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns four fresh arrays.
   */
  export function windows(input: IInput): ISites["runs"] {
    const { trunk, arm, hand, leg } = input.body;
    const ends: number[] = runs(input).trunk;
    const read: (s: number) => number[] = H.reader(trunk);
    const reach = (s: number): number => {
      if (!(s >= trunk.knots[0]! && s <= trunk.knots.at(-1)!)) return 0;
      const chain: IAutoMovieHumanConicSection.IChain = S.resolve(read(s), trunk.layout);
      return chain.guides.reduce((sum: number, k: number): number => sum + Math.hypot(chain.input.points[k]![0], chain.input.points[k]![1]), 0) / chain.guides.length;
    };
    return {
      trunk: [1, 2, 3].map((k: number): number => Math.min(reach(ends[k]!), (ends[k]! - ends[k - 1]!) / 2, (ends[k + 1]! - ends[k]!) / 2)),
      arm: [...arm.halves],
      hand: [...hand.halves],
      leg: [...leg.halves],
    };
  }

  /**
   * The material station map of each course from the reference to a person: every knot, tip, window and site of a family is carried by
   * its run, each run end going to its run end, with the two neighbouring runs' ratios blended over each run end's window
   * (`AutoMovieHumanCourseRuns.smooth`, `windows`), so the map and its first two derivatives are continuous and a source function composed
   * with it keeps its own continuity. A station inside a window is carried by the blended map; outside the windows by its run's ratio. A
   * person whose run ends are the reference's numbers gets the shared identity, which returns its input bit for bit.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The limb law's station law (a segment's length moves its run's far end, the run's stations follow and the next run translates), made twice differentiable across each joint's own turn.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One map per course from the two run tables.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Mismatched or non-increasing runs are refused by the map; nothing is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms One run evaluation of the person and four constant-size closures.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The reference's runs are read from its one evaluation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each closure retains two run arrays.
   */
  export function maps(reference: ISites, person: IInput): Record<keyof ISites["runs"], Runs.IMap> {
    const own: ISites["runs"] = runs(person);
    const map = (course: keyof ISites["runs"]): Runs.IMap =>
      Runs.smooth(reference.runs[course], own[course], reference.windows?.[course] ?? reference.runs[course].slice(2).map((): number => 0));
    return { trunk: map("trunk"), arm: map("arm"), hand: map("hand"), leg: map("leg") };
  }

  /**
   * The ANSUR II and ISO 8559-1 sites of the native path read by their definitions on `input` itself.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each site is its standard's definition on the stored families, frames, datums and loops: course stations nearest joint centres and landmark midpoints, girth extrema in their runs, the lowest station of the mammary landmark loop, the breast's most anterior point and the navel net's pit on the median line.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One evaluation per site, all sharing one run table per course.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No station is a stored material address except the two provisional sites, named as such; an unreadable section is skipped, never zero-filled.
   * @evidence contracts/development/implementation.md#efficient-algorithms Course scans every millimetre, three girth scans over parts of two runs at 360 phases and one 65 by 128 breast scan; no loft or skin is built.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The reference evaluation is done once at load (`REFERENCE`) and every person is carried from it.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns plain site records; readers and sources are released with the call.
   */
  export function evaluate(input: IInput): ISites {
    const { trunk, arm, hand, leg, breast } = input.body;
    const point = (name: string): AutoMovieVector3Tuple => input.point(name);

    // The trunk course is straight: a point's station is its projection on the course from its first centre.
    const trunkAxis: IAutoMovieViewAxis.IAxis = H.axis(trunk);
    const trunkLength: number = Runs.length(trunk.centres);
    const foot0: AutoMovieVector3Tuple = [...trunkAxis.at(0).origin] as AutoMovieVector3Tuple;
    const tangent: AutoMovieVector3Tuple = F.unit(F.sub([...trunkAxis.at(trunkLength).origin] as AutoMovieVector3Tuple, foot0));
    const trunkStation = (p: AutoMovieVector3Tuple): number => F.dot(F.sub(p, foot0), tangent);
    const courses: ISites["runs"] = runs(input);
    const trunkRuns: number[] = courses.trunk;
    const armRuns: number[] = courses.arm;
    const legRuns: number[] = courses.leg;
    const armAxis: IAutoMovieViewAxis.IAxis = H.axis(arm);
    const handAxis: IAutoMovieViewAxis.IAxis = H.axis(hand);
    const legAxis: IAutoMovieViewAxis.IAxis = H.axis(leg);
    const site = (family: ISite["family"], station: number, definition: string, basis: ISite["basis"]): ISite => {
      const ends: number[] = courses[family];
      const names: readonly string[] = ENDS[family];
      const { run, tau } = Runs.place(station, ends);
      return { family, station, definition, basis, run: { from: names[run]!, to: names[run + 1]!, index: run, tau }, segment: SEGMENTS[family][run]! };
    };

    // ISO 8559-1 5.3.13 hip level, the buttocks' greatest posterior projection: the largest bare posterior reach of the trunk's side
    // outline from its first knot up to midway between the hip centres' midpoint and suprasternale (above it the back's kyphosis and
    // scapulae project farther, outside the pelvis). The bare wall excludes the `trunk.low` net, as the calipers it locates do.
    const trunkSource: ReturnType<typeof AutoMovieLoftViewSource.create> = AutoMovieLoftViewSource.create(H.source(trunk));
    if (trunkSource === null || trunkSource.source === null) throw new Error("native sites need the trunk's bare source");
    const bare = trunkSource.source;
    const posterior = (s: number): number => {
      const values = AutoMovieLoftViewRead.values(bare, s);
      return typeof values === "string" ? NaN : values.extents[2]!;
    };
    const hip: number = Runs.extreme(posterior, trunk.knots[0]!, (trunkRuns[1]! + trunkRuns[2]!) / 2, STEP_MM, 1);

    // ANSUR II omphalion, the centre of the navel: the pit of the `trunk.navel` net, the net that draws the umbilicus. The net is its own
    // mirror image about its middle phase (the median line), so the pit lies on that phase, at the station where the net's height is
    // largest in magnitude. The window's middle is not the navel: the net also carries the skin above and below the pit.
    const navel: IAutoMovieLoftRelief | undefined = (trunk.reliefs ?? []).find((relief: IAutoMovieLoftRelief): boolean => relief.name === "trunk.navel");
    if (navel === undefined) throw new Error("native sites need the trunk's navel net");
    const median: number = navel.phases[0] + AutoMovieLoftRelief.width(navel) / 2;
    const omphalion: number = Runs.extreme(
      (s: number): number => Math.abs(AutoMovieLoftRelief.height(navel, s, median)[0]),
      navel.stations[0],
      navel.stations[1],
      PIT_STEP_MM,
      1,
    );

    // ISO 8559-1 5.3.8 under bust level, "directly below breast": the lowest trunk station of the stored side's mammary landmark loop.
    const loop: IAutoMovieConstructionPortLoop | undefined = input.roots.breast[0];
    if (loop?.shape === undefined) throw new Error("native sites need the mammary loop's column controls");
    const underbust: number = Math.min(
      ...AutoMovieConstructionPortCurve.chart(loop, loop.shape.length).addresses.map(([s]: [number, number]): number => s),
    );

    // ISO 8559-1 5.3.4 bust point level, the bust's most anterior point (on the bare breast, not in a bra): the breast source's
    // farthest-forward point over 65 stations by 128 phases, on the trunk course.
    const breastReader: IAutoMovieLoftViewFullSource.IReader = AutoMovieLoftViewFullSource.create(H.source(breast));
    let apex: AutoMovieVector3Tuple | null = null;
    for (let i: number = 0; i <= 64; ++i) {
      const s: number = breastReader.domain[0] + ((breastReader.domain[1] - breastReader.domain[0]) * i) / 64;
      for (let k: number = 0; k < 128; ++k) {
        const p: readonly number[] = breastReader.point(s, (2 * Math.PI * k) / 128);
        if (apex === null || p[0]! > apex[0]) apex = [p[0]!, p[1]!, p[2]!];
      }
    }
    const bust: number = trunkStation(apex!);

    // The limbs: ANSUR II and ISO 8559-1 girth sites by their landmarks (the limb law's `sites`).
    const girth = (family: IAutoMovieHumanConicLoft.IFamily): ((s: number) => number) => {
      const read: (s: number) => number[] = H.reader(family);
      return (s: number): number => {
        const section: IAutoMovieViewChain.ISection = S.chain(read(s), family.layout);
        if (section.fault !== null) return NaN;
        let total: number = 0;
        let previous: [number, number] | null = null;
        let first: [number, number] | null = null;
        for (let j: number = 0; j < GIRTH_PHASES; ++j) {
          const phi: number = (2 * Math.PI * j) / GIRTH_PHASES;
          const r: number = AutoMovieViewChain.radius(section, phi);
          const q: [number, number] = [r * Math.cos(phi), r * Math.sin(phi)];
          if (previous !== null) total += Math.hypot(q[0] - previous[0], q[1] - previous[1]);
          first ??= q;
          previous = q;
        }
        return total + Math.hypot(first![0] - previous![0], first![1] - previous![1]);
      };
    };
    const armLength: number = armRuns.at(-1)!;
    const handLength: number = courses.hand.at(-1)!;
    const legLength: number = legRuns.at(-1)!;
    const armGirth = girth(arm);
    const legGirth = girth(leg);
    const crotchHeight: number = trunkAxis.at(trunk.knots[0]!).origin[1]!;
    let thigh: number = 0;
    while (thigh < legRuns[1]! && legAxis.at(thigh).origin[1]! > crotchHeight) thigh += 0.25;

    // A digit's site: ISO 7250-1 takes a finger's breadth at a named joint (the proximal one between the proximal and the middle
    // phalanx), so the site is the station of the digit's course at its second centre, the first joint along it past its root. A digit's
    // first knot, where the caliper stood before, is where its fitted skin begins: no joint, and inside the palm's or the foot's envelope
    // once a digit's family starts at its root joint.
    const digit = (family: IAutoMovieHumanConicLoft.IFamily, what: string): IDigitSite => ({
      family: family.name,
      station: Runs.joints(family.centres, family.halves)[1]!,
      definition: what,
    });

    return {
      runs: courses,
      windows: windows(input),
      digits: {
        finger: digit(input.digits.finger, "ISO 7250-1 finger breadth, proximal: across the joint between the proximal and the middle phalanx, the station of the finger's course at that joint's centre"),
        toe: digit(input.digits.toe, "toe breadth across its interphalangeal joint (no ISO or ANSUR II measure names a toe's breadth): the station of the toe's course at that joint's centre"),
      },
      wall: {
        hip: site("trunk", hip, "ISO 8559-1 5.3.13 hip level: the buttocks' greatest posterior projection, the largest bare posterior reach of the trunk's side outline below midway from the hip centres' midpoint to suprasternale", "definition"),
        omphalion: site("trunk", omphalion, "ANSUR II omphalion: the centre of the navel, the pit of the `trunk.navel` net on the median line", "definition"),
        underbust: site("trunk", underbust, "ISO 8559-1 5.3.8 under bust level, directly below the breast: the lowest trunk station of the mammary landmark loop", "definition"),
        bust: site("trunk", bust, "ISO 8559-1 5.3.4 bust point level: the bare breast's most anterior point", "definition"),
        neck: site("trunk", NECK_F1_MM, "ISO 8559-1 5.3.2 neck girth just below the thyroid cartilage: unreadable on f1's skin; f1's authored neck-skin station, carried in the suprasternale-to-bitragion run", "provisional"),
        head: site("trunk", HEAD_F1_MM, "the head's own sections: no published measure; f1's authored head knot, 9 mm above the bitragion midpoint, carried in the bitragion-to-crown run", "provisional"),
      },
      arm: {
        upperArm: site("arm", Runs.nearest(armAxis, armLength, F.mid(point("upperarm"), point("lowerarm"))), "ISO 8559-1 upper arm girth at mid upper arm, midway between the acromion and the olecranon (ISAK mid-acromiale-radiale); the shoulder and elbow joint centres stand in for the acromion and olecranon", "definition"),
        elbow: site("arm", Runs.nearest(armAxis, armLength, point("lowerarm")), "elbow girth at the elbow joint centre, the epicondyles' level (ISO 7250-1 elbow breadth's landmarks)", "definition"),
        forearm: site("arm", Runs.extreme(armGirth, armRuns[2]!, (armRuns[2]! + armRuns[3]!) / 2, STEP_MM, 1), "ISO 8559-1 forearm girth, the forearm's maximum relaxed girth: the largest wall girth in the forearm run's proximal half", "definition"),
        wrist: site("hand", Runs.nearest(handAxis, handLength, F.mid(point("styloidRadial"), point("styloidUlnar"))), "ANSUR II wrist circumference over stylion: the station nearest the radial and ulnar styloids' midpoint", "definition"),
      },
      leg: {
        thigh: site("leg", thigh, "ANSUR II thigh circumference at the gluteal furrow, perpendicular to the thigh: the furrow does not show on f1, so the crotch's height (the trunk's first knot) stands in for it", "definition"),
        knee: site("leg", Runs.nearest(legAxis, legLength, point("calf")), "knee girth at the knee joint centre, the femoral epicondyles' level (ISO 8559-1 5.3.22 takes the patella's centre)", "definition"),
        calf: site("leg", Runs.extreme(legGirth, legRuns[1]!, legRuns[2]!, STEP_MM, 1), "ISO 8559-1 5.3.24 and ANSUR II calf circumference: the widest girth of the shank run", "definition"),
        ankle: site("leg", Runs.extreme(legGirth, (legRuns[1]! + legRuns[2]!) / 2, legRuns[2]!, STEP_MM, -1), "ANSUR II ankle circumference, the minimum: the least girth of the shank run's distal half", "definition"),
      },
      extremities: {
        hand: site("hand", Runs.nearest(handAxis, handLength, F.mid(point("index1"), point("pinky1"))), "ISO 7250-1 6.3.3 hand breadth at the metacarpals and ANSUR hand circumference at metacarpale: the station nearest the second and fifth metacarpal heads' midpoint", "definition"),
        foot: site("leg", Runs.nearest(legAxis, legLength, point("footBall")), "ANSUR II ball of foot circumference over the first and fifth metatarsal heads: the station nearest the ball-of-foot datum", "definition"),
      },
    };
  }

  /**
   * The reference sites carried to a person by their runs: each keeps its run and tau on the person's course. A person whose run ends are
   * the reference's numbers keeps every station bit for bit.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A site moves with its run (`AutoMovieHumanCourseRuns.map`), so a segment length moves its sites and the next run's sites translate.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One material map per course, applied to every site of that course.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Definitions are not re-read on the person's generated wall, which would be circular; mismatched run counts are refused by the map.
   * @evidence contracts/development/implementation.md#efficient-algorithms One run evaluation per course of the person and one map read per site.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the reference evaluation and its definitions' text.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh site records only.
   */
  export function carry(reference: ISites, person: IInput): ISites {
    const own: ISites["runs"] = runs(person);
    const forward: Record<keyof ISites["runs"], Runs.IMap> = maps(reference, person);
    const moved = <K extends string>(group: Record<K, ISite>): Record<K, ISite> =>
      Object.fromEntries(
        (Object.entries(group) as [K, ISite][]).map(([key, value]: [K, ISite]): [K, ISite] => [
          key,
          { ...value, station: forward[value.family](value.station) },
        ]),
      ) as Record<K, ISite>;
    return {
      runs: own,
      windows: windows(person),
      digits: reference.digits,
      wall: moved(reference.wall),
      arm: moved(reference.arm),
      leg: moved(reference.leg),
      extremities: moved(reference.extremities),
    };
  }

  /** f1 as stored, at the reference pose: the families of `AutoMovieHumanF1.BODY`, the placing table and the stored mammary loops. */
  export const F1: IInput = {
    frames: AutoMovieHumanF1Placement.REFERENCE,
    point: (name: string): AutoMovieVector3Tuple => AutoMovieHumanF1Placement.point(name),
    body: {
      trunk: AutoMovieHumanF1Trunk,
      arm: AutoMovieHumanF1Arm,
      hand: AutoMovieHumanF1Hand,
      leg: AutoMovieHumanF1Leg,
      breast: AutoMovieHumanF1Breast,
    },
    roots: { breast: AutoMovieHumanF1RootControls.breast },
    digits: { finger: AutoMovieHumanF1FingerMiddle, toe: AutoMovieHumanF1ToeBig },
  };

  /** f1's sites by their definitions, evaluated once. */
  export const REFERENCE: ISites = evaluate(F1);

  /**
   * A person's sites: the reference's carried by the person's runs.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to `carry` from the one reference evaluation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is re-fitted to the person.
   * @evidence contracts/development/implementation.md#efficient-algorithms As `carry`.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares `REFERENCE`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources As `carry`.
   */
  export function resolve(person: IInput): ISites {
    return carry(REFERENCE, person);
  }
}

import type { AutoMovieHumanLoftFrame } from "../lofting/AutoMovieHumanLoftFrame";
import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanMonotoneCubic } from "../lofting/AutoMovieHumanMonotoneCubic";
import { AutoMovieHumanNaturalSpline } from "../lofting/AutoMovieHumanNaturalSpline";
import { AutoMovieHumanPolarSection } from "../lofting/AutoMovieHumanPolarSection";

import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { AutoMovieHumanSkeletonLaw } from "./AutoMovieHumanSkeletonLaw";
import { AutoMovieHumanArmPrior } from "./AutoMovieHumanArmPrior";
import { AutoMovieHumanLimbFrame } from "./AutoMovieHumanLimbFrame";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Both arms and hands generated from the shoulder ring and public lengths and
 * tapes, by one construction on the left side and a reflection, each part lofted
 * in its own bone frame.
 *
 * The arm is a walk along two bones. The heading runs along the upper arm to
 * the elbow, turns over a length scaled by the elbow's radius and runs along the
 * forearm to the wrist, and every point of the axis follows from the one before
 * it and the heading, so the axis has no breaks. The walk starts on the trunk's
 * shoulder ring, the elbow and wrist standing where the arm length inputs reach;
 * that is where {@link bones} reads them for the skeleton, and the arm is then
 * lofted on the skeleton, its walk turning at the skeleton's elbow.
 *
 * About that axis a section is an ellipse in the plane across the bone. Its
 * size is a natural spline through the shoulder ring's size and the circles of
 * the biceps, elbow, forearm and wrist tapes, and its aspect runs from the
 * wrist's flat oval to the nearly round arm. A layer is that tube cut by the
 * plane square to the bone: the plane's normal is the bone's heading, which
 * turns with the walk at the elbow, turns onto the hand's own axis over the
 * wrist, and lies level at the shoulder, where the arm meets the trunk's level
 * ring. The section frames are carried down the arm by the least rotation
 * between neighbouring planes ({@link AutoMovieHumanLimbFrame}), so they turn
 * only as the bones bend. The shoulder ring's difference from the tube fades in
 * over the top of the arm.
 *
 * The hand is one form in its own axes, and every person's hand is that form
 * through one map. The heel, and the palm past the thumb's branch, are each a
 * radius about an inner point, read in the section's own half extents so a flat
 * section keeps its ends. The thenar is a section of its own: at the branch the
 * arm's last ring is the palm's curve and the thenar's ellipse joined by a soft
 * maximum along each point's own ray, and the heel above becomes that ring by a
 * target that travels with the heel. Its sections lie square to the hand's axis.
 *
 * Each digit is a curved tube of elliptical sections square to its own line,
 * lofted in frames carried along that line, closed where its radius equals its
 * distance from the tip's apex; its width stops changing there, so the rounded
 * tip leaves the tube tangent. A digit starts from a round section a little past
 * its web, and the skin between the palm's last ring and the digits' first ones
 * is the webs' own surface, built by the body's surface on events marked as webs
 * (`AutoMovieHumanBodyWeb`): each web there is a saddle, so no digit's section
 * carries its parent's corners. Valleys run back from each web between the
 * knuckles.
 *
 * The thumb leaves at its metacarpophalangeal crease: its metacarpal stands in
 * the thenar, and its phalanges run the thumb length input from that joint. The
 * finger joints at the knuckles stand where the metacarpals reach, by de Leva's
 * wrist-to-knuckle share of the hand and the measured metacarpal proportions.
 *
 * Along the hand the palm and the fingers scale apart with a smooth change at
 * the finger roots; across it the breadth and through it the hand girth scale
 * it. Reflection reverses phase: the right side's point at phase t is the mirror
 * of the left's at -t, and its frames are the mirror of the left's with `v`
 * turned over.
 */
export namespace AutoMovieHumanArmConstruction {
  /** One hand's measures, in the same millimetres as the calibration. */
  export interface IHand {
    /** Wrist to the tip of the middle finger. */
    length: number;

    /** Wrist to the root of the middle finger. */
    palm: number;

    /** Breadth across the palm. */
    breadth: number;

    /** Length of the thumb from its metacarpophalangeal joint. */
    thumb: number;
  }

  /** What an arm reads. */
  export interface IInputs {
    /** Upper arm length. */
    upper: number;

    /** Lower arm length. */
    lower: number;

    /** Biceps tape. */
    bicep: number;

    /** Elbow tape. */
    elbow: number;

    /** Forearm tape. */
    forearm: number;

    /** Wrist tape. */
    wrist: number;

    /** Hand tape. */
    circumference: number;

    /** Masculine-feminine control. */
    sex: number;

    /** Left hand. */
    left: IHand;

    /** Right hand. */
    right: IHand;

    /** Calibration millimetres per world millimetre. */
    scale: number;
  }

  /**
   * Calibration with both arms and hands, their events and poles added.
   *
   * @param skeleton The bind skeleton the arms are lofted on: each walk turns
   *   at its elbow. Absent, the walks start on the shoulder rings.
   */
  export function add(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
    skeleton?: readonly AutoMovieHumanSkeletonLaw.IBone[],
  ): IAutoMovieHumanBodyCalibration {
    const limbs: ILimb[] = (["left", "right"] as const).map(
      (side: "left" | "right"): ILimb => limb(calibration, inputs, side, skeleton),
    );
    return {
      ...calibration,
      chains: [
        ...calibration.chains,
        ...limbs.flatMap((l: ILimb): IAutoMovieHumanLoftChain[] => l.chains),
      ],
      events: [...calibration.events, ...events()],
      poles: [
        ...calibration.poles,
        ...limbs.flatMap((l: ILimb): IAutoMovieHumanBodyCalibration.IPole[] => l.poles),
      ],
    };
  }

  /** Whether a chain belongs to an arm. */
  export function owns(name: string): boolean {
    return OWNED.test(name);
  }

  /**
   * Hand measures of a person whose hands are not measured, world
   * millimetres: lines in `[1, stature, hand tape]`.
   */
  export function expected(stature: number, tape: number, scale: number): IHand {
    const line = (w: readonly number[]): number =>
      (w[0]! + w[1]! * stature + w[2]! * tape) * scale;
    const prior: AutoMovieHumanArmPrior.IExpected =
      AutoMovieHumanArmPrior.PRIOR.expected;
    return {
      length: line(prior.length),
      palm: line(prior.palm),
      breadth: line(prior.breadth),
      thumb: line(prior.thumb),
    };
  }

  /**
   * One side's bone landmarks by the arm's law, in world millimetres, before
   * any arm skin exists: what a skeleton stands its arm and hand on.
   */
  export interface IBones {
    /** Where the walk turns from the upper arm to the forearm. */
    elbow: Vec3;

    /**
     * Centre of the hand's section at the wrist crease. Hand length runs from
     * the crease, and the hand's origin-to-tip measure is `lengthRatio` of it,
     * so the crease lies the rest of that length behind the origin.
     */
    crease: Vec3;

    /** Hand length the hand was made to, from the crease. */
    length: number;

    /** The thumb's carpometacarpal and metacarpophalangeal joints. */
    thumb: { cmc: Vec3; mcp: Vec3 };

    /** Each digit's centre line from its web to its tip, thumb first. */
    digits: IDigitLine[];
  }

  /** A digit's centre line. */
  export interface IDigitLine {
    /** Chain name. */
    name: string;

    /** Points of the digit's centre line from its root at the web to its tip. */
    line: Vec3[];

    /** The tip's apex. */
    tip: Vec3;

    /** The metacarpophalangeal joint, where the metacarpal ends. */
    joint: Vec3;
  }

  /**
   * Both arms' bone landmarks from the shoulder rings and the inputs, before
   * the arms are lofted: the same walk, crease, joints and digit lines the
   * skin is built on.
   *
   * @param calibration Calibration holding `upper` and its event.
   * @param inputs Lengths in calibration millimetres.
   */
  export function bones(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
  ): Record<"left" | "right", IBones> {
    return {
      left: limb(calibration, inputs, "left", undefined, false).bones,
      right: limb(calibration, inputs, "right", undefined, false).bones,
    };
  }

  /** One side's chains, poles and bone landmarks. */
  interface ILimb {
    chains: IAutoMovieHumanLoftChain[];
    poles: IAutoMovieHumanBodyCalibration.IPole[];
    bones: IBones;
  }

  /**
   * One side: the walk and the hand's map in the left frame, and from them the
   * chains in their bone frames, the poles and the landmarks, reflected for the
   * right side.
   *
   * @param lofted Whether to build the chains; the skeleton needs only bones.
   */
  function limb(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
    side: "left" | "right",
    skeleton?: readonly AutoMovieHumanSkeletonLaw.IBone[],
    lofted: boolean = true,
  ): ILimb {
    const prior: AutoMovieHumanArmPrior.IPrior = AutoMovieHumanArmPrior.PRIOR;
    const sign: 1 | -1 = side === "left" ? 1 : -1;
    const given: IHand = inputs[side];
    const hand: IForm = form();
    const ring: IRing = shoulder(calibration, side, sign);
    const elbow: Vec3 | undefined = elbowOf(skeleton, side, sign);

    // The crease and the hand's origin stand on the tube, whatever the hand's
    // breadth, so a first build places the knuckles the breadth is read on.
    const first: IArm = arm(ring, inputs, { ...given, across: 1 }, elbow);
    const measures: IShaped = {
      ...given,
      across: acrossOf(hand, given, inputs, first.wrist, first.crease),
    };
    const law: IArm = arm(ring, inputs, measures, elbow);
    const map = (q: readonly [number, number, number]): Vec3 =>
      handPoint(q, measures, inputs.circumference, inputs.scale, law.wrist);

    // Joints at the knuckles and the thumb's base, by the hand's anatomy.
    const roots: Vec3[] = hand.digits.map((d: IDigit): Vec3 => map(linePoint(d, 0)));
    const joints: IJoints = knuckles(law.crease, measures.length, roots);

    // The thumb runs the thumb length from its joint.
    const thumb: IStretch = stretch(hand.digits[0]!, joints.mcps[0]!, measures, inputs, law.wrist);
    const lines: IDigitLine[] = hand.digits.map((d: IDigit, i: number): IDigitLine => {
      const at = (s: number): Vec3 => map(i === 0 ? stretched(d, thumb, s) : linePoint(d, s));
      const last: number = d.cap;
      const count: number = Math.max(2, Math.ceil(last / LINE_STEP));
      return {
        name: prior.hand.digits[i]!.name.replace("{side}", side),
        line: Array.from({ length: count + 1 }, (_: unknown, k: number): Vec3 =>
          sided(at((last * k) / count), sign),
        ),
        tip: sided(map(i === 0 ? stretchedPole(d, thumb) : d.pole), sign),
        joint: sided(joints.mcps[i]!, sign),
      };
    });
    const bones_: IBones = {
      elbow: sided(law.elbow, sign),
      crease: sided(law.crease, sign),
      length: measures.length,
      thumb: { cmc: sided(joints.cmc, sign), mcp: sided(joints.mcps[0]!, sign) },
      digits: lines,
    };
    if (!lofted) return { chains: [], poles: [], bones: bones_ };

    const armChain: IAutoMovieHumanLoftChain = armOf(law, side, sign);
    const palm: IAutoMovieHumanLoftChain = palmOf(hand, map, side, sign);
    const digits: IAutoMovieHumanLoftChain[] = hand.digits.map(
      (d: IDigit, i: number): IAutoMovieHumanLoftChain =>
        digitOf(d, i, i === 0 ? thumb : null, map, side, sign),
    );
    return {
      chains: [armChain, ...digits.slice(0, 1), palm, ...digits.slice(1)],
      poles: hand.digits.map(
        (d: IDigit, i: number): IAutoMovieHumanBodyCalibration.IPole => ({
          chain: prior.hand.digits[i]!.name.replace("{side}", side),
          end: "bottom",
          critical: true,
          point: sided(map(i === 0 ? stretchedPole(d, thumb) : d.pole), sign),
        }),
      ),
      bones: bones_,
    };
  }

  /** A side's elbow from a skeleton, in the left frame. */
  function elbowOf(
    skeleton: readonly AutoMovieHumanSkeletonLaw.IBone[] | undefined,
    side: "left" | "right",
    sign: 1 | -1,
  ): Vec3 | undefined {
    if (skeleton === undefined) return undefined;
    const bone: AutoMovieHumanSkeletonLaw.IBone | undefined = skeleton.find(
      (b: AutoMovieHumanSkeletonLaw.IBone): boolean =>
        b.bone === `${side}LowerArm`,
    );
    if (bone === undefined)
      throw new Error(`The skeleton lacks the ${side} elbow`);
    return sided(bone.position, sign);
  }

  /** Read a world point's mirror on a side. */
  function sided(p: readonly [number, number, number], sign: 1 | -1): Vec3 {
    return [p[0], p[1], sign * p[2]];
  }

  /** A side's frame from the left frame's. */
  function sidedFrame(
    f: AutoMovieHumanLoftFrame.IFrame,
    sign: 1 | -1,
  ): AutoMovieHumanLoftFrame.IFrame {
    return sign === 1 ? f : AutoMovieHumanLimbFrame.mirror(f);
  }

  /** The arm's arc of the shoulder ring, left frame. */
  function shoulder(
    calibration: IAutoMovieHumanBodyCalibration,
    side: "left" | "right",
    sign: 1 | -1,
  ): IRing {
    const upper: IAutoMovieHumanLoftChain = calibration.chains.find(
      (c: IAutoMovieHumanLoftChain): boolean => c.name === "upper",
    )!;
    const event: IAutoMovieHumanBodyCalibration.IEvent =
      calibration.events.find(
        (e: IAutoMovieHumanBodyCalibration.IEvent): boolean =>
          e.parent === "upper" && e.direction === "down",
      )!;
    const ring: Vec3[] = event.splits
      .find(
        (s: IAutoMovieHumanBodyCalibration.ISplit): boolean =>
          s.child === `arm.${side}`,
      )!
      .arcs.flatMap(([from, to]: [number, number]): Vec3[] => {
        const span: number = to >= from ? to - from : to + TWO_PI - from;
        return AutoMovieHumanLoftChain.ring(
          upper,
          upper.layers[0]!.y,
          Array.from(
            { length: RING },
            (_: unknown, i: number): number => from + (span * i) / RING,
          ),
        );
      })
      .map((p: Vec3): Vec3 => sided(p, sign));
    const centre: Vec3 = [mean(ring, 0), mean(ring, 1), mean(ring, 2)];
    const radius: number =
      ring.reduce(
        (s: number, p: Vec3): number =>
          s + Math.hypot(p[0] - centre[0], p[1] - centre[1], p[2] - centre[2]),
        0,
      ) / ring.length;
    const outline: [number, number][] = ring.map((p: Vec3): [number, number] => [p[0], p[2]]);
    const area: number = Math.abs(
      outline.reduce(
        (s: number, p: [number, number], i: number): number => {
          const q: [number, number] = outline[(i + 1) % outline.length]!;
          return s + p[0] * q[1] - q[0] * p[1];
        },
        0,
      ) / 2,
    );
    return { centre, radius, area, outline };
  }

  /** The shoulder ring's place, size and outline `[x, z]`. */
  interface IRing {
    centre: Vec3;
    radius: number;

    /** Area the ring encloses in its level plane, mm^2. */
    area: number;
    outline: [number, number][];
  }

  /**
   * The arm's sections for one side, in the left frame: a one-parameter family
   * of planes from the hand's branch (low parameter) to the shoulder.
   */
  interface IArm {
    /** Hand origin, in world millimetres. */
    wrist: Vec3;

    /** Where the walk turns from the upper arm to the forearm. */
    elbow: Vec3;

    /** Centre of the section at the wrist crease. */
    crease: Vec3;

    /** Layer parameters from the bottom. */
    layers: number[];

    /** Normal of the section plane at a parameter, toward the shoulder. */
    normal(q: number): Vec3;

    /** A point the section plane passes through. */
    anchor(q: number): Vec3;

    /** Point of the section at a parameter and phase. */
    point(q: number, t: number): Vec3;
  }

  /**
   * Walk the bones and build the tube and its section planes.
   *
   * The parameter is the hand's station `-a` up to the wrist crease, and past it
   * the walk's distance back toward the shoulder, so it rises from the hand to
   * the shoulder. The tube runs down to the crease, where the wrist tape is
   * taken and the arm is narrowest, and hands over to the hand's skin across
   * the heel, from the crease to the branch: a handover reaching above the
   * crease swells the wrist toward the heel's girth, and one ending at the
   * thenar steps out of the wrist. Toward the wrist the tube's long axis lies
   * along the hand's breadth, so the wrist is flat where the radius and ulna
   * lie side by side.
   *
   * @param elbow The skeleton's elbow in the left frame; the walk turns there.
   *   Absent, the walk starts on the shoulder ring.
   */
  function arm(
    ring: IRing,
    inputs: IInputs,
    hand: IShaped,
    elbow?: Vec3,
  ): IArm {
    const prior: AutoMovieHumanArmPrior.IArm = AutoMovieHumanArmPrior.PRIOR.arm;
    if (
      !(inputs.upper > 0) ||
      !(inputs.lower > 0) ||
      !(inputs.bicep > 0) ||
      !(inputs.elbow > 0) ||
      !(inputs.forearm > 0) ||
      !(inputs.wrist > 0)
    )
      throw new Error("An arm needs positive lengths and tapes");
    const upper: number =
      (prior.upperLength[0]! + prior.upperLength[2]! * inputs.sex) * inputs.scale +
      prior.upperLength[1]! * inputs.upper;
    const lower: number =
      (prior.lowerLength[0]! + prior.lowerLength[2]! * inputs.sex) * inputs.scale +
      prior.lowerLength[1]! * inputs.lower;
    const total: number = upper + lower;
    const soft: number = (prior.softness * inputs.elbow) / (2 * Math.PI);

    // The walk: each step follows the heading from the point before it, and
    // runs on past the wrist through the heel, whose cuts meet it up to where
    // the thenar starts.
    const count: number = Math.ceil((total + RUN_ON * inputs.scale) / WALK) + 1;
    const start: Vec3 = [
      ring.centre[0],
      ring.centre[1] + SEAT * inputs.scale,
      ring.centre[2],
    ];
    const axis: Vec3[] = [
      [
        start[0] + prior.bias[0]! * inputs.scale,
        start[1] + prior.bias[1]! * inputs.scale,
        start[2] + prior.bias[2]! * inputs.scale,
      ],
    ];
    for (let i: number = 1; i < count; i++) {
      const h: Vec3 = heading(prior, (i - 0.5) * WALK, upper, soft);
      const p: Vec3 = axis[i - 1]!;
      axis.push([p[0] + WALK * h[0], p[1] + WALK * h[1], p[2] + WALK * h[2]]);
    }

    // A skeleton's elbow places the walk: the bones stand where it says, and
    // the walk's own lengths and headings run from there.
    if (elbow !== undefined) {
      const x: number = upper / WALK;
      const i: number = Math.floor(x);
      const f: number = x - i;
      const turn: Vec3 = [0, 1, 2].map(
        (c: number): number =>
          axis[i]![c]! + f * (axis[i + 1]![c]! - axis[i]![c]!),
      ) as Vec3;
      const shift: Vec3 = sub(elbow, turn);
      for (const p of axis) {
        p[0] += shift[0];
        p[1] += shift[1];
        p[2] += shift[2];
      }
    }

    // Size through the tapes, and aspect, by the walk's fraction of the arm.
    const keys: AutoMovieHumanArmPrior.IKey[] = [
      prior.bicep,
      prior.elbow,
      prior.forearm,
      prior.wrist,
    ];
    const tapes: number[] = [
      inputs.bicep,
      inputs.elbow,
      inputs.forearm,
      inputs.wrist,
    ];
    const stations: number[] = [
      0,
      ...keys.map((k: AutoMovieHumanArmPrior.IKey): number => k.station),
    ];
    // The shoulder ring is a level cut of the arm, which leaves it at an angle
    // to the vertical, so it encloses the area of the section square to the
    // bone over the cosine of that angle; the tube starts from that section.
    // Taken as square, the level ring's size swells the arm's root into a cap
    // over a narrower arm.
    const rise: number = Math.abs(heading(prior, 0, upper, soft)[1]);
    const size: AutoMovieHumanNaturalSpline.ISpline =
      AutoMovieHumanNaturalSpline.create(stations, [
        Math.log(Math.sqrt((ring.area * rise) / Math.PI)),
        ...keys.map((k: AutoMovieHumanArmPrior.IKey, i: number): number =>
          Math.log((tapes[i]! * k.ratio) / (2 * Math.PI)),
        ),
      ]);
    const round: AutoMovieHumanNaturalSpline.ISpline =
      AutoMovieHumanNaturalSpline.create(stations, [
        prior.aspect[3]!,
        prior.aspect[3]!,
        prior.aspect[2]!,
        prior.aspect[1]!,
        prior.aspect[0]!,
      ]);
    const before: Vec3 = heading(prior, 0, upper, soft);
    const at = (s: number): Vec3 => {
      // Above the shoulder the bone runs on: the top layers' cuts reach it.
      if (s < 0)
        return [
          axis[0]![0] + s * before[0],
          axis[0]![1] + s * before[1],
          axis[0]![2] + s * before[2],
        ];
      const x: number = Math.min(count - 1.001, s / WALK);
      const i: number = Math.floor(x);
      const f: number = x - i;
      const a: Vec3 = axis[i]!;
      const b: Vec3 = axis[i + 1]!;
      return [
        a[0] + f * (b[0] - a[0]),
        a[1] + f * (b[1] - a[1]),
        a[2] + f * (b[2] - a[2]),
      ];
    };
    const surface = (s: number, theta: number): Vec3 => {
      const u: number = Math.max(0, s / total);
      const r: number = Math.exp(AutoMovieHumanNaturalSpline.evaluate(size, u));
      const aspect: number = Math.max(
        1,
        AutoMovieHumanNaturalSpline.evaluate(round, u),
      );
      const c: Vec3 = at(s);
      const t: Vec3 = heading(prior, s, upper, soft);
      const f: Vec3 = across([1, 0, 0], t);
      const g: Vec3 = cross(t, f);
      // Toward the wrist the long axis turns onto the hand's breadth, where
      // the radius and ulna lie side by side.
      const breadth: Vec3 = across([...AutoMovieHumanArmPrior.PRIOR.hand.across], t);
      let lie: number = Math.atan2(dot(breadth, g), dot(breadth, f));
      if (lie > Math.PI / 2) lie -= Math.PI;
      if (lie <= -Math.PI / 2) lie += Math.PI;
      const turn: number = lie * smooth((u - 0.6) / 0.4);
      const a: number = r * Math.sqrt(aspect) * Math.cos(theta - turn);
      const b: number = (r / Math.sqrt(aspect)) * Math.sin(theta - turn);
      const x: number = a * Math.cos(turn) - b * Math.sin(turn);
      const z: number = a * Math.sin(turn) + b * Math.cos(turn);
      return [
        c[0] + x * f[0] + z * g[0],
        c[1] + x * f[1] + z * g[1],
        c[2] + x * f[2] + z * g[2],
      ];
    };

    // A plane's cut: the tube passes through it along the walk at any phase.
    const cut = (point: Vec3, normal: Vec3, theta: number): Vec3 => {
      let lo: number = -ring.radius * 2;
      let hi: number = (count - 1) * WALK;
      for (let i: number = 0; i < 40; i++) {
        const mid: number = (lo + hi) / 2;
        if (dot(sub(surface(mid, theta), point), normal) > 0) lo = mid;
        else hi = mid;
      }
      return surface((lo + hi) / 2, theta);
    };
    const wrist: Vec3 = at(prior.wrist.station * total);
    const top: number = ring.centre[1];
    const angle = (t: number): number => prior.phase + prior.sense * t;

    // The walk's distance at which it stands at a height, and at which it
    // crosses a plane.
    const heightAt = (y: number): number => {
      let lo: number = 0;
      let hi: number = (count - 1) * WALK;
      for (let i: number = 0; i < 40; i++) {
        const mid: number = (lo + hi) / 2;
        if (at(mid)[1] > y) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    };
    const crossing = (point: Vec3, normal: Vec3): number => {
      let lo: number = 0;
      let hi: number = (count - 1) * WALK;
      for (let i: number = 0; i < 40; i++) {
        const mid: number = (lo + hi) / 2;
        if (dot(sub(at(mid), point), normal) > 0) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    };

    // The hand's map from the wrist; its axes are the arm's lower end.
    const unit_: number =
      (inputs.circumference * prior.heelUnit) / (2 * Math.PI);
    const origin: Vec3 = [
      wrist[0] + unit_ * prior.heelOffset[0]!,
      wrist[1] + unit_ * prior.heelOffset[1]!,
      wrist[2] + unit_ * prior.heelOffset[2]!,
    ];
    const handPrior: AutoMovieHumanArmPrior.IHandPrior =
      AutoMovieHumanArmPrior.PRIOR.hand;
    const square: Vec3 = [
      -handPrior.along[0],
      -handPrior.along[1],
      -handPrior.along[2],
    ];
    const map = (q: readonly [number, number, number]): Vec3 =>
      handPoint(q, hand, inputs.circumference, inputs.scale, origin);
    const bowl: number = omega();

    // The crease: hand length runs from it, and the origin-to-tip measure is
    // `lengthRatio` of that length, read in the mean hand's units.
    const creaseAt: number =
      -handPrior.size.length * (1 / handPrior.lengthRatio - 1);
    const branchAt: number = handPrior.branch;

    // A section of the heel at station a: the bone's tube up to the crease,
    // handing over to the hand's skin across the whole heel, from the crease
    // to the branch where the palm and thumb part, in the plane square to the
    // hand.
    const heel = (a: number, t: number): Vec3 => {
      const shape: IForm = form();
      const whole: Vec3 = wholeSkin(shape.whole, a, bowl - t);
      const closing: number = smooth(
        (a - handPrior.branch + handPrior.thenar.reach) /
          handPrior.thenar.reach,
      );
      const opening: Vec3 = shape.opening(a, t);
      const skin: Vec3 = map([
        a,
        whole[1] + closing * (opening[1] - whole[1]),
        whole[2] + closing * (opening[2] - whole[2]),
      ]);
      const v: number = smoother((a - creaseAt) / (branchAt - creaseAt));
      if (v === 1) return skin;
      const bone: Vec3 = cut(map([a, 0, 0]), square, angle(t));
      return [
        bone[0] + v * (skin[0] - bone[0]),
        bone[1] + v * (skin[1] - bone[1]),
        bone[2] + v * (skin[2] - bone[2]),
      ];
    };

    // Above the crease the planes leave the hand's axis and follow the walk:
    // the parameter runs on as the walk's distance back.
    const join: number = -creaseAt;
    const joinWalk: number = crossing(map([creaseAt, 0, 0]), square);
    const topWalk: number = heightAt(top);
    const walkOf = (q: number): number => joinWalk - (q - join);
    const normal = (q: number): Vec3 => {
      if (q <= join) return square;
      const s: number = walkOf(q);
      const bone: Vec3 = scale(heading(prior, s, upper, soft), -1);
      const w: number = smooth((q - join) / (WRIST_TURN * inputs.scale));
      const body: Vec3 = unit([
        square[0] + w * (bone[0] - square[0]),
        square[1] + w * (bone[1] - square[1]),
        square[2] + w * (bone[2] - square[2]),
      ]);
      const level: number = 1 - smooth((s - topWalk) / (REACH * inputs.scale));
      return unit([
        body[0] * (1 - level),
        body[1] * (1 - level) + level,
        body[2] * (1 - level),
      ]);
    };
    const anchor = (q: number): Vec3 => (q <= join ? map([-q, 0, 0]) : at(walkOf(q)));
    const point = (q: number, t: number): Vec3 => {
      if (q <= join) return heel(-q, t);
      const c: Vec3 = at(walkOf(q));
      const p: Vec3 = cut(c, normal(q), angle(t));
      const fade: number = smooth(
        (c[1] - top + REACH * inputs.scale) / (REACH * inputs.scale),
      );
      if (fade === 0) return p;
      const o: Vec3 = cut([0, top, 0], [0, 1, 0], angle(t));
      const d: number = Math.atan2(o[2] - ring.centre[2], o[0] - ring.centre[0]);
      const gap: number =
        AutoMovieHumanPolarSection.radius(
          ring.outline,
          [ring.centre[0], ring.centre[2]],
          d,
        ) - Math.hypot(o[0] - ring.centre[0], o[2] - ring.centre[2]);
      return [
        p[0] + fade * gap * Math.cos(d),
        p[1],
        p[2] + fade * gap * Math.sin(d),
      ];
    };

    // Layers: the heel's own stations in the hand, then the forearm's above
    // the join, then the tube's heights up to the shoulder's level ring.
    const layers: number[] = prior.heel
      .filter((a: number): boolean => a > creaseAt)
      .map((a: number): number => -a)
      .sort((p: number, q: number): number => p - q);
    for (const step of FOREARM_LAYERS) layers.push(join + step * inputs.scale);
    const qTop: number = join + (joinWalk - topWalk);
    for (const h of prior.heights) {
      const q: number = join + (joinWalk - heightAt(wrist[1] + h * (top - wrist[1])));
      if (q >= qTop - 1e-6) continue;
      if (q - layers[layers.length - 1]! > LAYER_GAP * inputs.scale) layers.push(q);
    }
    layers.push(qTop);

    const creaseRing: Vec3[] = Array.from(
      { length: CREASE_PHASES },
      (_: unknown, i: number): Vec3 =>
        heel(creaseAt, (TWO_PI * i) / CREASE_PHASES),
    );
    return {
      wrist: origin,
      elbow: at(upper),
      crease: [mean(creaseRing, 0), mean(creaseRing, 1), mean(creaseRing, 2)],
      layers,
      normal,
      anchor,
      point,
    };
  }

  /** The heading of the walk: the upper arm, a turn, then the forearm. */
  function heading(
    prior: AutoMovieHumanArmPrior.IArm,
    s: number,
    upper: number,
    soft: number,
  ): Vec3 {
    const w: number = smooth((s - upper + soft) / (2 * soft));
    const d: number[] = [0, 1, 2].map(
      (c: number): number =>
        prior.upper[c]! + w * (prior.lower[c]! - prior.upper[c]!),
    );
    const l: number = Math.hypot(d[0]!, d[1]!, d[2]!);
    return [d[0]! / l, d[1]! / l, d[2]! / l];
  }

  /** A hand's measures with the scale across its form that its breadth takes. */
  interface IShaped extends IHand {
    /** World millimetres per unit across the form. */
    across: number;
  }

  /** A hand's map from the prior's axes to the left frame. */
  function handPoint(
    q: readonly [number, number, number],
    hand: IShaped,
    tape: number,
    scale: number,
    wrist: readonly [number, number, number],
  ): Vec3 {
    const prior: AutoMovieHumanArmPrior.IHandPrior =
      AutoMovieHumanArmPrior.PRIOR.hand;
    const length: number = hand.length * prior.lengthRatio;
    const palm: number = hand.palm * prior.palmRatio;
    const inPalm: number = palm / prior.size.palm;
    const inFingers: number =
      (length - palm) / (prior.size.length - prior.size.palm);
    const through: number = tape / scale / prior.size.circumference;
    const a: number =
      inPalm * q[0] +
      (inFingers - inPalm) *
        prior.handover *
        softplus((q[0] - prior.size.palm) / prior.handover);
    const b: number = q[1] * hand.across;
    const c: number = q[2] * through * scale;
    return [
      wrist[0] + a * prior.along[0] + b * prior.across[0] + c * prior.through[0],
      wrist[1] + a * prior.along[1] + b * prior.across[1] + c * prior.through[1],
      wrist[2] + a * prior.along[2] + b * prior.across[2] + c * prior.through[2],
    ];
  }

  /** The prior's axes of a world point, the inverse of {@link handPoint}. */
  function handLocal(
    p: Vec3,
    hand: IShaped,
    tape: number,
    scale: number,
    wrist: Vec3,
  ): Vec3 {
    const prior: AutoMovieHumanArmPrior.IHandPrior =
      AutoMovieHumanArmPrior.PRIOR.hand;
    const d: Vec3 = sub(p, wrist);
    const a: number = dot(d, [...prior.along]);
    const b: number = dot(d, [...prior.across]);
    const c: number = dot(d, [...prior.through]);
    let lo: number = -1000;
    let hi: number = 1000;
    for (let i: number = 0; i < 60; i++) {
      const mid: number = (lo + hi) / 2;
      if (handPoint([mid, 0, 0], hand, tape, scale, [0, 0, 0]).reduce(
        (s: number, v: number, k: number): number => s + v * prior.along[k]!,
        0,
      ) < a)
        lo = mid;
      else hi = mid;
    }
    const through: number = tape / scale / prior.size.circumference;
    return [(lo + hi) / 2, b / hand.across, c / (through * scale)];
  }

  /**
   * World millimetres per unit across the hand's form for the palm's section
   * through knuckles II and V to span the hand breadth along them, as ANSUR II
   * measures it: in the plane through the knuckles' midpoint that holds the
   * line from II to V and stands square to the hand's axis from the wrist to
   * knuckle III. The knuckles stand on the fingers' roots and move with the
   * scale, so it is solved in rounds from the palm's widest section.
   *
   * @param origin The hand map's origin.
   * @param crease Centre of the hand's section at the wrist crease.
   */
  function acrossOf(
    shape: IForm,
    hand: IHand,
    inputs: IInputs,
    origin: Vec3,
    crease: Vec3,
  ): number {
    const widest: number = Math.max(
      ...shape.palmRings.map((ring: readonly Vec3[]): number =>
        Math.max(...ring.map((q: Vec3): number => q[1])) -
        Math.min(...ring.map((q: Vec3): number => q[1])),
      ),
    );
    let k: number = hand.breadth / widest;
    for (let round: number = 0; round < ACROSS_ROUNDS; round++) {
      const shaped: IShaped = { ...hand, across: k };
      const map = (q: readonly [number, number, number]): Vec3 =>
        handPoint(q, shaped, inputs.circumference, inputs.scale, origin);
      const roots: Vec3[] = shape.digits.map((d: IDigit): Vec3 => map(linePoint(d, 0)));
      const mcps: Vec3[] = knuckles(crease, hand.length, roots).mcps;
      k *= hand.breadth / knuckleBreadth(shape, map, crease, mcps);
    }
    return k;
  }

  /** The palm's breadth along knuckles II to V in the plane through them. */
  function knuckleBreadth(
    shape: IForm,
    map: (q: readonly [number, number, number]) => Vec3,
    crease: Vec3,
    mcps: readonly Vec3[],
  ): number {
    const middle: Vec3 = scale(plus(mcps[1]!, mcps[4]!), 0.5);
    const axis: Vec3 = unit(sub(mcps[2]!, crease));
    const line: Vec3 = unit(sub(mcps[4]!, mcps[1]!));
    const normal: Vec3 = unit(sub(axis, scale(line, dot(axis, line))));
    const rings: Vec3[][] = shape.palmRings.map((ring: readonly Vec3[]): Vec3[] =>
      ring.map((q: Vec3): Vec3 => map(q)),
    );
    const count: number = Math.min(...rings.map((ring: Vec3[]): number => ring.length));
    let lo: number = Infinity;
    let hi: number = -Infinity;
    for (let j: number = 0; j < count; j++)
      for (let k: number = 1; k < rings.length; k++) {
        const p: Vec3 = rings[k - 1]![j]!;
        const q: Vec3 = rings[k]![j]!;
        const fp: number = dot(sub(p, middle), normal);
        const fq: number = dot(sub(q, middle), normal);
        if (fp === fq || fp * fq > 0) continue;
        const s: number = dot(plus(p, scale(sub(q, p), fp / (fp - fq))), line);
        lo = Math.min(lo, s);
        hi = Math.max(hi, s);
      }
    if (!(hi > lo)) throw new Error("The knuckles' plane misses the palm");
    return hi - lo;
  }

  /** The thumb's stretch past its joint. */
  interface IStretch {
    /** Station of the thumb's line nearest its joint, in the form. */
    from: number;

    /** Share by which the thumb's shaft past that station grows. */
    factor: number;

    /** First station of the thumb's own sections. */
    first: number;
  }

  /**
   * The thumb's phalanges, run from its metacarpophalangeal joint to the
   * thumb length: the form's thumb past its joint grows along its own line until
   * its apex stands that far from the joint, its sections and its rounded tip
   * kept, so a long thumb is not a fat one.
   */
  function stretch(
    d: IDigit,
    mcp: Vec3,
    hand: IShaped,
    inputs: IInputs,
    wrist: Vec3,
  ): IStretch {
    const local: Vec3 = handLocal(mcp, hand, inputs.circumference, inputs.scale, wrist);
    let from: number = 0;
    let best: number = Infinity;
    for (let s: number = 0; s <= d.cap; s += 0.05) {
      const e: number = norm(sub(linePoint(d, s), local));
      if (e < best) {
        best = e;
        from = s;
      }
    }
    const reach = (k: number): number =>
      norm(
        sub(
          handPoint(
            stretchedPole(d, { from, factor: k, first: from }),
            hand,
            inputs.circumference,
            inputs.scale,
            wrist,
          ),
          mcp,
        ),
      );
    let lo: number = 0.3;
    let hi: number = 6;
    for (let i: number = 0; i < 60; i++) {
      const mid: number = (lo + hi) / 2;
      if (reach(mid) < hand.thumb) lo = mid;
      else hi = mid;
    }
    const factor: number = (lo + hi) / 2;
    // A thumb shorter than the form's draws its shaft back toward the joint,
    // and with it a first section past the joint, so that section is found
    // again on the drawn line: it must still clear what it cleared in the form.
    const grown = (s: number): Vec3 => stretched(d, { from, factor, first: from }, s);
    let first: number = d.first;
    while (
      first < d.cap - 3 &&
      !d.clear.every(
        (x: IClear): boolean => dot(sub(x.point, grown(first)), lineTangent(d, first)) <= -x.margin,
      )
    )
      first += 0.05;
    return { from, factor, first: Math.max(from, first) };
  }

  /** The thumb's line at a station of the form, grown past its joint. */
  function stretched(d: IDigit, s: IStretch | null, at: number): Vec3 {
    if (s === null || at <= s.from) return linePoint(d, at);
    const base: Vec3 = linePoint(d, s.from);
    const p: Vec3 = linePoint(d, at);
    return [
      base[0] + s.factor * (p[0] - base[0]),
      base[1] + s.factor * (p[1] - base[1]),
      base[2] + s.factor * (p[2] - base[2]),
    ];
  }

  /** The thumb's apex, carried with its last section. */
  function stretchedPole(d: IDigit, s: IStretch): Vec3 {
    const end: Vec3 = stretched(d, s, d.cap);
    const own: Vec3 = linePoint(d, d.cap);
    return [
      end[0] + d.pole[0] - own[0],
      end[1] + d.pole[1] - own[1],
      end[2] + d.pole[2] - own[2],
    ];
  }

  /** The joints the metacarpals end at, in the left frame. */
  interface IJoints {
    /** The thumb's carpometacarpal joint. */
    cmc: Vec3;

    /** Each digit's metacarpophalangeal joint, thumb first. */
    mcps: Vec3[];
  }

  /**
   * The knuckles and the thumb's base by the hand's anatomy
   * (`docs/anatomy/hand.md`): the third metacarpal's head stands de Leva's
   * {@link KNUCKLE} of the wrist centre to the middle fingertip from the wrist
   * centre, that centre {@link STYLION} distal of the crease; the third
   * metacarpal is {@link THIRD_METACARPAL} of that reach; the bases stand level
   * across the hand, and each metacarpal reaches its measured share of the
   * third toward its finger's root. The thumb's carpometacarpal joint stands
   * halfway from the crease to the thumb's branch, at the trapezium
   * (convention), its metacarpal {@link METACARPALS}[0] of the third.
   *
   * @param crease Centre of the hand's section at the wrist crease.
   * @param length Hand length from the crease.
   * @param roots Each digit's root at its web, thumb first.
   */
  function knuckles(crease: Vec3, length: number, roots: Vec3[]): IJoints {
    const along: Vec3 = [...AutoMovieHumanArmPrior.PRIOR.hand.along];
    const centre: Vec3 = plus(crease, scale(along, STYLION));
    const reach: number = KNUCKLE * (length - STYLION);
    const third: number = THIRD_METACARPAL * reach;
    const middle: Vec3 = roots[2]!;
    const toward: Vec3 = unit(sub(middle, centre));
    const head: Vec3 = plus(centre, scale(toward, reach));
    const base: Vec3 = sub(head, scale(toward, third));
    const mcps: Vec3[] = roots.map((root: Vec3, i: number): Vec3 => {
      if (i === 0) return [0, 0, 0];
      const offset: Vec3 = sub(root, middle);
      const level: Vec3 = sub(offset, scale(along, dot(offset, along)));
      const own: Vec3 = plus(base, level);
      return plus(own, scale(unit(sub(root, own)), METACARPALS[i]! * third));
    });
    const cmc: Vec3 = scale(plus(crease, roots[0]!), 0.5);
    mcps[0] = plus(cmc, scale(unit(sub(roots[0]!, cmc)), METACARPALS[0]! * third));
    return { cmc, mcps };
  }

  /** The arm's chain in its bone frames, for one side. */
  function armOf(law: IArm, side: "left" | "right", sign: 1 | -1): IAutoMovieHumanLoftChain {
    const prior: AutoMovieHumanArmPrior.IArm = AutoMovieHumanArmPrior.PRIOR.arm;
    const order: number = prior.order;
    const phases: number[] = Array.from(
      { length: order },
      (_: unknown, m: number): number => (TWO_PI * m) / order,
    );
    const ring = (q: number): Vec3[] =>
      phases.map((t: number): Vec3 => law.point(q, t));

    // The in-plane axis carried down from the level shoulder ring.
    const layers: number[] = law.layers;
    const top: number = layers[layers.length - 1]!;
    const bottom: number = layers[0]!;
    const grid: { q: number; n: Vec3; u: Vec3 }[] = [
      { q: top, n: law.normal(top), u: [1, 0, 0] },
    ];
    for (let q: number = top - CARRY; q > bottom - 2 * CARRY; q -= CARRY) {
      const last = grid[grid.length - 1]!;
      const n: Vec3 = law.normal(q);
      grid.push({ q, n, u: AutoMovieHumanLimbFrame.carry(last.u, last.n, n) });
    }
    const axisAt = (q: number): Vec3 => {
      const i: number = Math.min(grid.length - 1, Math.max(0, Math.floor((top - q) / CARRY)));
      const g = grid[i]!;
      return AutoMovieHumanLimbFrame.carry(g.u, g.n, law.normal(q));
    };

    // A section in its own frame, its origin the centre of its ring.
    const sample = (q: number): { ring: Vec3[]; frame: AutoMovieHumanLoftFrame.IFrame } => {
      const points: Vec3[] = ring(q);
      const n: Vec3 = law.normal(q);
      const c: Vec3 = [mean(points, 0), mean(points, 1), mean(points, 2)];
      const o: Vec3 = sub(c, scale(n, dot(sub(c, law.anchor(q)), n)));
      return { ring: points, frame: AutoMovieHumanLimbFrame.frame(o, n, axisAt(q)) };
    };
    const samples = layers.map(sample);
    const stations: number[] = [0];
    for (let k: number = 1; k < samples.length; k++)
      stations.push(stations[k - 1]! + norm(sub(samples[k]!.frame.origin, samples[k - 1]!.frame.origin)));
    const made: IAutoMovieHumanLoftChain.ILayer[] = layers.map(
      (q: number, k: number): IAutoMovieHumanLoftChain.ILayer => {
        const own = samples[k]!;
        const at = (dq: number): AutoMovieHumanLimbFrame.ISample => {
          const s = sample(q + dq);
          const step: number = norm(sub(s.frame.origin, own.frame.origin));
          return {
            station: stations[k]! + Math.sign(dq) * step,
            frame: sidedFrame(s.frame, sign),
            ring: reflect(s.ring, sign),
          };
        };
        return AutoMovieHumanLimbFrame.layer(
          { station: stations[k]!, frame: sidedFrame(own.frame, sign), ring: reflect(own.ring, sign) },
          at(-SLOPE_STEP),
          at(SLOPE_STEP),
          order,
        );
      },
    );
    return {
      name: `arm.${side}`,
      basis: "spline",
      order,
      samples: prior.samples,
      rule: prior.rule,
      layers: made,
    };
  }

  /**
   * A ring of one side from the left frame's: mirrored, its phase reversed so
   * the right side's point at phase t is the mirror of the left's at -t.
   */
  function reflect(ring: readonly Vec3[], sign: 1 | -1): Vec3[] {
    if (sign === 1) return [...ring];
    const n: number = ring.length;
    return ring.map((_: Vec3, m: number): Vec3 => sided(ring[(n - m) % n]!, -1));
  }

  /** The palm's chain, its sections square to the hand's axis. */
  function palmOf(
    hand: IForm,
    map: (q: readonly [number, number, number]) => Vec3,
    side: "left" | "right",
    sign: 1 | -1,
  ): IAutoMovieHumanLoftChain {
    const prior: AutoMovieHumanArmPrior.IHandPrior = AutoMovieHumanArmPrior.PRIOR.hand;
    const along: Vec3 = [...prior.along];
    const normal: Vec3 = scale(along, -1);
    const samples: AutoMovieHumanLimbFrame.ISample[] = hand.palmRings.map(
      (ring: readonly Vec3[]): AutoMovieHumanLimbFrame.ISample => {
        const points: Vec3[] = ring.map((q: Vec3): Vec3 => map(q));
        const c: Vec3 = [mean(points, 0), mean(points, 1), mean(points, 2)];
        const frame: AutoMovieHumanLoftFrame.IFrame = AutoMovieHumanLimbFrame.frame(
          c,
          normal,
          [...prior.through],
        );
        return { station: -dot(c, along), frame: sidedFrame(frame, sign), ring: reflect(points, sign) };
      },
    );
    const first: number = samples[0]!.station;
    return {
      name: `hand.${side}.1`,
      basis: "spline",
      order: prior.palmSection.order,
      samples: prior.palmSection.samples,
      rule: "arclength",
      layers: AutoMovieHumanLimbFrame.layers(
        samples.map((s: AutoMovieHumanLimbFrame.ISample): AutoMovieHumanLimbFrame.ISample => ({
          ...s,
          station: s.station - first,
        })),
        prior.palmSection.order,
      ),
    };
  }

  /**
   * A digit's chain, its sections square to its own line and their frames
   * carried along it from the root, from the tip up.
   */
  function digitOf(
    d: IDigit,
    index: number,
    grow: IStretch | null,
    map: (q: readonly [number, number, number]) => Vec3,
    side: "left" | "right",
    sign: 1 | -1,
  ): IAutoMovieHumanLoftChain {
    const prior: AutoMovieHumanArmPrior.IHandPrior = AutoMovieHumanArmPrior.PRIOR.hand;
    const source: AutoMovieHumanArmPrior.IDigit = prior.digits[index]!;
    const order: number = d.angles.length;
    const first: number = grow === null ? d.first : grow.first;
    const stations: number[] = digitStations(d, first, grow === null ? 1 : grow.factor);

    // World centre, normal toward the root, and ring at a station of the form.
    const centre = (s: number): Vec3 => map(stretched(d, grow, s));
    const normalAt = (s: number): Vec3 =>
      unit(sub(centre(Math.max(0, s - STEP)), centre(Math.min(d.cap, s + STEP))));
    const ringAt = (s: number): Vec3[] =>
      digitRing(d, grow, s).map((q: Vec3): Vec3 => map(q));

    // The in-plane axis carried from the root toward the tip.
    const root: number = stations[0]!;
    const grid: { s: number; n: Vec3; u: Vec3 }[] = [
      { s: root, n: normalAt(root), u: [...prior.through] },
    ];
    for (let s: number = root + DIGIT_CARRY; s < d.cap + DIGIT_CARRY; s += DIGIT_CARRY) {
      const last = grid[grid.length - 1]!;
      const n: Vec3 = normalAt(Math.min(d.cap, s));
      grid.push({ s, n, u: AutoMovieHumanLimbFrame.carry(last.u, last.n, n) });
    }
    const axisAt = (s: number): Vec3 => {
      const i: number = Math.min(grid.length - 1, Math.max(0, Math.floor((s - root) / DIGIT_CARRY)));
      const g = grid[i]!;
      return AutoMovieHumanLimbFrame.carry(g.u, g.n, normalAt(s));
    };
    const sample = (s: number): { ring: Vec3[]; frame: AutoMovieHumanLoftFrame.IFrame } => ({
      ring: ringAt(s),
      frame: AutoMovieHumanLimbFrame.frame(centre(s), normalAt(s), axisAt(s)),
    });

    // Stations from the tip up: the length of the centre line.
    const ordered: number[] = [...stations].reverse();
    const own = ordered.map(sample);
    const along: number[] = [0];
    for (let k: number = 1; k < own.length; k++)
      along.push(along[k - 1]! + norm(sub(own[k]!.frame.origin, own[k - 1]!.frame.origin)));
    const layers: IAutoMovieHumanLoftChain.ILayer[] = ordered.map(
      (s: number, k: number): IAutoMovieHumanLoftChain.ILayer => {
        const here = own[k]!;
        const mine: AutoMovieHumanLimbFrame.ISample = {
          station: along[k]!,
          frame: sidedFrame(here.frame, sign),
          ring: reflect(here.ring, sign),
        };
        // Toward the tip the chain's station falls; the tip itself is read on
        // one side.
        const at = (ds: number): AutoMovieHumanLimbFrame.ISample => {
          const t = sample(s + ds);
          return {
            station: along[k]! - Math.sign(ds) * norm(sub(t.frame.origin, here.frame.origin)),
            frame: sidedFrame(t.frame, sign),
            ring: reflect(t.ring, sign),
          };
        };
        return AutoMovieHumanLimbFrame.layer(
          mine,
          s + SLOPE_STEP <= d.cap ? at(SLOPE_STEP) : mine,
          at(-SLOPE_STEP),
          order,
        );
      },
    );
    return {
      name: source.name.replace("{side}", side),
      basis: "spline",
      order: source.order,
      samples: source.samples,
      rule: "polar",
      layers,
    };
  }

  /** Both hands' events: the form's for the left, reflected for the right. */
  function events(): IAutoMovieHumanBodyCalibration.IEvent[] {
    return form().events.flatMap(
      (e: IEvent): IAutoMovieHumanBodyCalibration.IEvent[] => [
        {
          parent: e.parent.replace("{side}", "left"),
          direction: "down",
          web: true,
          splits: e.splits.map(
            (s: ISplit): IAutoMovieHumanBodyCalibration.ISplit => ({
              child: s.child.replace("{side}", "left"),
              arcs: s.arcs.map(
                (a: [number, number]): [number, number] => [a[0], a[1]],
              ),
            }),
          ),
        },
        {
          parent: e.parent.replace("{side}", "right"),
          direction: "down",
          web: true,
          splits: [...e.splits].reverse().map(
            (s: ISplit): IAutoMovieHumanBodyCalibration.ISplit => ({
              child: s.child.replace("{side}", "right"),
              arcs: [...s.arcs]
                .reverse()
                .map(
                  (a: [number, number]): [number, number] => [
                    TWO_PI - a[1],
                    TWO_PI - a[0],
                  ],
                ),
            }),
          ),
        },
      ],
    );
  }

  /** Mean of a coordinate of a ring. */
  function mean(ring: Vec3[], c: number): number {
    return (
      ring.reduce((s: number, p: Vec3): number => s + p[c]!, 0) / ring.length
    );
  }
}

/** A point or direction. */
type Vec3 = [number, number, number];

/** A share of a parent's ring. */
interface ISplit {
  child: string;
  arcs: [number, number][];
}

/** A branch at a chain's bottom. */
interface IEvent {
  parent: string;
  splits: ISplit[];
}

/** A star read at any station. */
interface IStarField {
  stations: readonly number[];
  splines: AutoMovieHumanNaturalSpline.ISpline[];
}

/** A digit's law, in the hand's axes. */
interface IDigit {
  /** Centre of its root at the web, where its line starts. */
  centre: Vec3;
  line: AutoMovieHumanNaturalSpline.ISpline[];
  width: [number, number][];
  depth: [number, number][];

  /** Section angle of each control point, turning one way round the digit. */
  angles: number[];

  /** Station of its first own section, past its webs' crests. */
  first: number;

  /** What its first section must clear: its arcs of the parent's ring and its webs' crests. */
  clear: IClear[];

  /** Station where the rounded tip starts. */
  cap: number;
  pole: Vec3;
}

/** The whole hand in its own axes. */
interface IForm {
  whole: IStarField;
  palm: IStarField;
  opening: (a: number, t: number) => Vec3;
  palmRings: Vec3[][];
  digits: IDigit[];
  events: IEvent[];
}

let built: IForm | null = null;

/** The hand's form, made once: no person enters it. */
function form(): IForm {
  built ??= make();
  return built;
}

/**
 * Phase on the hand's star of the arm's phase zero. The tube's phase runs from
 * across the hand toward its back, the star's the other way.
 */
function omega(): number {
  const prior: AutoMovieHumanArmPrior.IPrior = AutoMovieHumanArmPrior.PRIOR;
  const t: Vec3 = unit([
    prior.arm.lower[0]!,
    prior.arm.lower[1]!,
    prior.arm.lower[2]!,
  ]);
  const seed: Vec3 = [1, 0, 0];
  const k: number = dot(seed, t);
  const f: Vec3 = unit([seed[0] - k * t[0], seed[1] - k * t[1], seed[2] - k * t[2]]);
  return (
    Math.atan2(
      dot(f, [...prior.hand.through]),
      dot(f, [...prior.hand.across]),
    ) - prior.arm.phase
  );
}

/** Compile a star. */
function star(field: AutoMovieHumanArmPrior.IStar): IStarField {
  const count: number = field.series[0]!.length;
  return {
    stations: field.stations,
    splines: Array.from(
      { length: count },
      (_: unknown, k: number): AutoMovieHumanNaturalSpline.ISpline =>
        AutoMovieHumanNaturalSpline.create(
          field.stations,
          field.series.map((row: readonly number[]): number => row[k]!),
        ),
    ),
  };
}

/** A star's `[b, c]` at a station and polar angle, held past its ends. */
function starPoint(
  field: IStarField,
  a: number,
  theta: number,
): [number, number] {
  const held: number = Math.min(
    field.stations[field.stations.length - 1]!,
    Math.max(field.stations[0]!, a),
  );
  const v: number[] = field.splines.map(
    (s: AutoMovieHumanNaturalSpline.ISpline): number =>
      AutoMovieHumanNaturalSpline.evaluate(s, held),
  );
  let r: number = v[4]!;
  for (let k: number = 1; 4 + 2 * k < v.length; k++)
    r += v[3 + 2 * k]! * Math.cos(k * theta) + v[4 + 2 * k]! * Math.sin(k * theta);
  return [
    v[0]! + v[2]! * r * Math.cos(theta),
    v[1]! + v[3]! * r * Math.sin(theta),
  ];
}

/** Skin drawn in toward a web through the hand, in a valley that deepens up to it. */
function webbed(
  p: [number, number],
  a: number,
  web: AutoMovieHumanArmPrior.IWeb,
): [number, number] {
  const g: number =
    web.depth *
    Math.exp(-0.5 * ((p[0] - web.b) / web.width) ** 2) *
    smoother((a - web.a + web.reach) / web.reach);
  return [p[0], web.c + (p[1] - web.c) * (1 - g)];
}

/** Heel skin at a station and angle. */
function wholeSkin(field: IStarField, a: number, theta: number): Vec3 {
  const [b, c] = starPoint(field, a, theta);
  return [a, b, c];
}

/** Palm skin at a station and angle, with the valleys between the knuckles. */
function palmSkin(field: IStarField, a: number, theta: number): Vec3 {
  let p: [number, number] = starPoint(field, a, theta);
  for (const web of AutoMovieHumanArmPrior.PRIOR.hand.webs)
    p = webbed(p, a, web);
  return [a, p[0], p[1]];
}

/** The finger roots' curve: its station at each place across the hand. */
function knuckle(b: number): number {
  const prior: AutoMovieHumanArmPrior.IHandPrior =
    AutoMovieHumanArmPrior.PRIOR.hand;
  return AutoMovieHumanMonotoneCubic.interpolate(
    [
      [prior.ends[0]![0]!, prior.ends[0]![1]!],
      [prior.ends[1]![0]!, prior.ends[1]![1]!],
      ...prior.webs.map(
        (w: AutoMovieHumanArmPrior.IWeb): [number, number] => [w.b, w.a],
      ),
    ],
    b,
  );
}

/** Palm skin on the family from the thumb's branch (0) to the finger roots (1). */
function palmPoint(field: IStarField, u: number, theta: number): Vec3 {
  const from: number = AutoMovieHumanArmPrior.PRIOR.hand.branch;
  let a: number = from + u * (knuckle(0) - from);
  for (let i: number = 0; i < 3; i++)
    a = from + u * (knuckle(starPoint(field, a, theta)[0]) - from);
  return palmSkin(field, a, theta);
}

/** A digit's first ring at its web: its arcs of the parent's ring, closed by bridges. */
function rootOf(
  order: number,
  arcs: readonly [number, number][],
  read: (t: number) => Vec3,
): Vec3[] {
  const span = ([from, to]: [number, number]): number =>
    to >= from ? to - from : to + TWO_PI - from;
  const points: Vec3[] = [];
  arcs.forEach((arc: [number, number], i: number): void => {
    const next: [number, number] = arcs[(i + 1) % arcs.length]!;
    const share: number = Math.max(4, Math.round(order / (2 * arcs.length)));
    for (let j: number = 0; j < share; j++)
      points.push(read(arc[0] + (span(arc) * j) / share));
    const from: Vec3 = read(arc[0] + span(arc));
    const to: Vec3 = read(next[0]);
    for (let j: number = 0; j < 3; j++) {
      const f: number = j / 3;
      points.push([
        from[0] + f * (to[0] - from[0]),
        from[1] + f * (to[1] - from[1]),
        from[2] + f * (to[2] - from[2]),
      ]);
    }
  });
  return points;
}

/** A digit's line at a length from its root. */
function linePoint(d: IDigit, s: number): Vec3 {
  return [
    AutoMovieHumanNaturalSpline.evaluate(d.line[0]!, s),
    AutoMovieHumanNaturalSpline.evaluate(d.line[1]!, s),
    AutoMovieHumanNaturalSpline.evaluate(d.line[2]!, s),
  ];
}

/** A digit's unit tangent toward its tip. */
function lineTangent(d: IDigit, s: number): Vec3 {
  return unit(sub(linePoint(d, s + 0.05), linePoint(d, s - 0.05)));
}

/** Axes across a digit's line: toward the thumb's side and through the hand. */
function digitAxes(t: Vec3): [Vec3, Vec3] {
  const k: number = t[1];
  const b: Vec3 = unit([-k * t[0], 1 - k * t[1], -k * t[2]]);
  return [b, cross(t, b)];
}

/**
 * A digit's section at a station, square to its line, one point per control
 * point; a thumb's line grown past its joint by its stretch.
 */
function digitRing(
  d: IDigit,
  grow: { from: number; factor: number } | null,
  s: number,
): Vec3[] {
  const c: Vec3 =
    grow === null || s <= grow.from
      ? linePoint(d, s)
      : (() => {
          const base: Vec3 = linePoint(d, grow.from);
          const p: Vec3 = linePoint(d, s);
          return [
            base[0] + grow.factor * (p[0] - base[0]),
            base[1] + grow.factor * (p[1] - base[1]),
            base[2] + grow.factor * (p[2] - base[2]),
          ] as Vec3;
        })();
  const [b, n] = digitAxes(lineTangent(d, s));
  const w: number = AutoMovieHumanMonotoneCubic.interpolate(d.width, s);
  const h: number = AutoMovieHumanMonotoneCubic.interpolate(d.depth, s);
  return d.angles.map((phi: number): Vec3 => [
    c[0] + w * Math.cos(phi) * b[0] + h * Math.sin(phi) * n[0],
    c[1] + w * Math.cos(phi) * b[1] + h * Math.sin(phi) * n[1],
    c[2] + w * Math.cos(phi) * b[2] + h * Math.sin(phi) * n[2],
  ]);
}

/**
 * A digit's layer stations from its first own section to its tip, at even
 * steps of the grown length along its shaft and close together where it rounds.
 */
function digitStations(d: IDigit, first: number, factor: number): number[] {
  const step: number = DIGIT_STEP / factor;
  const out: number[] = [first];
  for (let s: number = first + step; s < d.cap - 2.5; s += step) out.push(s);
  out.push(d.cap - 1.2, d.cap - 0.3, d.cap);
  return out.filter((s: number, i: number): boolean => i === 0 || s > out[i - 1]! + 0.1);
}

/**
 * A digit's law from its anchors and its root.
 *
 * @param root Its first ring at the web, for its centre and the sense its phase
 *   turns.
 */
function digit(
  source: AutoMovieHumanArmPrior.IDigit,
  root: Vec3[],
  start: { centre: Vec3; width: number; depth: number } | null = null,
): IDigit {
  const n: number = source.order;
  const centre: Vec3 =
    start?.centre ??
    ([0, 1, 2].map(
      (c: number): number =>
        root.reduce((s: number, p: Vec3): number => s + p[c]!, 0) / root.length,
    ) as Vec3);
  const sizes: number[] = source.anchors
    .map((r: readonly number[]): number => Math.sqrt(r[3]! * r[4]!))
    .sort((a: number, b: number): number => a - b);
  const middle: number = sizes[sizes.length >> 1]!;
  const kept: (readonly number[])[] = source.anchors
    .filter(
      (r: readonly number[]): boolean =>
        Math.sqrt(r[3]! * r[4]!) >= 0.5 * middle &&
        r[0]! >= centre[0] + source.blend,
    )
    .reverse();
  const points: Vec3[] = [
    centre,
    ...kept.map((r: readonly number[]): Vec3 => [r[0]!, r[1]!, r[2]!]),
  ];
  const lengths: number[] = [0];
  for (let i: number = 1; i < points.length; i++)
    lengths.push(lengths[i - 1]! + norm(sub(points[i]!, points[i - 1]!)));
  const line: AutoMovieHumanNaturalSpline.ISpline[] = [0, 1, 2].map(
    (c: number): AutoMovieHumanNaturalSpline.ISpline =>
      AutoMovieHumanNaturalSpline.create(
        lengths,
        points.map((p: Vec3): number => p[c]!),
      ),
  );
  const tube: IDigit = {
    centre,
    line,
    width: [],
    depth: [],
    angles: [],
    first: 0,
    clear: [],
    cap: 0,
    pole: [0, 0, 0],
  };

  // The tip closes where the radius reaches the distance to the apex.
  const size = (s: number, c: number): number => {
    let i: number = 0;
    while (i + 2 < lengths.length && lengths[i + 1]! < s) i++;
    const low: number = i === 0 ? kept[0]![c]! : kept[i - 1]![c]!;
    const high: number = kept[i]![c]!;
    const f: number = (s - lengths[i]!) / (lengths[i + 1]! - lengths[i]!);
    return low + Math.min(1, Math.max(0, f)) * (high - low);
  };
  const last: number = lengths[lengths.length - 1]!;
  const apex: Vec3 = [source.pole[0], source.pole[1], source.pole[2]];
  let cap: number = last;
  for (let s: number = lengths[1]!; s < last; s += 0.25)
    if (Math.sqrt(size(s, 3) * size(s, 4)) >= norm(sub(apex, linePoint(tube, s)))) {
      cap = s;
      break;
    }
  const knots = (c: number): [number, number][] => [
    [
      0,
      start === null ? kept[0]![c]! : c === 3 ? start.width : start.depth,
    ],
    ...lengths
      .slice(1)
      .filter((s: number): boolean => s < cap - 1)
      .map((s: number, i: number): [number, number] => [s, kept[i]![c]!]),
    [cap, size(cap, c)],
  ];
  tube.width = knots(3);
  tube.depth = knots(4);
  tube.cap = cap;
  const tip: Vec3 = lineTangent(tube, cap - 0.05);
  const reach: number = norm(sub(apex, linePoint(tube, cap)));
  const end: Vec3 = linePoint(tube, cap);
  tube.pole = [
    end[0] + reach * tip[0],
    end[1] + reach * tip[1],
    end[2] + reach * tip[2],
  ];

  // The section turns the way its parent's ring runs round it, so a ring's
  // phase keeps the sense of the rings it joins.
  const [b, c] = digitAxes(lineTangent(tube, 0.1));
  const plain: [number, number][] = root.map(
    (p: Vec3): [number, number] => {
      const v: Vec3 = sub(p, centre);
      return [dot(v, b), dot(v, c)];
    },
  );
  const area: number = plain.reduce(
    (s: number, p: [number, number], m: number): number => {
      const q: [number, number] = plain[(m + 1) % plain.length]!;
      return s + p[0] * q[1] - q[0] * p[1];
    },
    0,
  );
  const turn: number = area >= 0 ? TWO_PI : -TWO_PI;
  tube.angles = Array.from({ length: n }, (_: unknown, m: number): number => (turn * m) / n);

  return tube;
}

/** A point the web's skin leaves behind, and how far past it a first section must stand. */
interface IClear {
  point: Vec3;
  margin: number;
}

/**
 * A web's crest in the form, as the surface builds it: a round margin half its
 * pinches' chord past their middle, along the parent's own surface there.
 */
function crestOf(
  ring: (t: number) => Vec3,
  outward: (t: number) => Vec3,
  from: number,
  to: number,
): IClear {
  const A: Vec3 = ring(from);
  const B: Vec3 = ring(to);
  const xi: Vec3 = unit(sub(B, A));
  const mean: Vec3 = plus(outward(from), outward(to));
  const ea: Vec3 = unit(sub(mean, scale(xi, dot(mean, xi))));
  const rho: number = norm(sub(B, A)) / 2;
  return { point: plus(scale(plus(A, B), 0.5), scale(ea, rho)), margin: rho + CREST_CLEARANCE };
}

/** A child's arcs of its parent's ring, sampled, each to stand behind its first section. */
function arcPoints(ring: (t: number) => Vec3, arcs: readonly [number, number][]): IClear[] {
  return arcs.flatMap(([from, to]: [number, number]): IClear[] => {
    const span: number = to >= from ? to - from : to + TWO_PI - from;
    return Array.from({ length: ARC_SAMPLES + 1 }, (_: unknown, i: number): IClear => ({
      point: ring(from + (span * i) / ARC_SAMPLES),
      margin: ARC_CLEARANCE,
    }));
  });
}

/**
 * The first station of a digit whose section, square to its line, has every
 * point it must clear behind it by that point's margin: its arcs of the
 * parent's ring and its webs' crests, so every column of the web descends.
 */
function firstOf(d: IDigit, clear: readonly IClear[]): number {
  for (let s: number = 0; s < d.cap - 3; s += 0.05) {
    const c: Vec3 = linePoint(d, s);
    const t: Vec3 = lineTangent(d, s);
    if (clear.every((x: IClear): boolean => dot(sub(x.point, c), t) <= -x.margin)) return s;
  }
  return d.cap - 3;
}

/** The hand. */
function make(): IForm {
  const prior: AutoMovieHumanArmPrior.IHandPrior =
    AutoMovieHumanArmPrior.PRIOR.hand;
  const whole: IStarField = star(prior.whole);
  const palm: IStarField = star(prior.palm);
  const bowl: number = omega();
  const wrap = (t: number): number => ((t % TWO_PI) + TWO_PI) % TWO_PI;

  // The arm's last ring: the palm's star and the thenar's ellipse, which cross
  // at the branch's two ends. Each keeps its own skin outside the other.
  const thenar: AutoMovieHumanArmPrior.IThenar = prior.thenar;
  const inside = (b: number, c: number): number =>
    ((b - thenar.b) / thenar.width) ** 2 + ((c - thenar.c) / thenar.depth) ** 2 - 1;
  const ends: number[] = [];
  for (let i: number = 0; i < 2880; i++) {
    const from: number = (TWO_PI * i) / 2880;
    const to: number = (TWO_PI * (i + 1)) / 2880;
    const p: [number, number] = starPoint(palm, prior.branch, from);
    const q: [number, number] = starPoint(palm, prior.branch, to);
    const u: number = inside(p[0], p[1]);
    const v: number = inside(q[0], q[1]);
    if (u * v <= 0) ends.push(from + (to - from) * (u / (u - v)));
  }
  if (ends.length !== 2)
    throw new Error("The thenar must cross the palm's ring twice");

  // Phase runs against the star's angle; the ring's arc inside the thenar is
  // the one between the crossings whose middle lies in the ellipse.
  const between: number = (ends[0]! + ends[1]!) / 2;
  const mid: [number, number] = starPoint(palm, prior.branch, between);
  const [enter, leave]: [number, number] =
    inside(mid[0], mid[1]) < 0
      ? [ends[1]!, ends[0]!]
      : [ends[0]! + TWO_PI, ends[1]!];
  // The chord between the crossings lies inside both curves, so near the
  // crossings each is one radius at an angle from its middle, and their soft
  // maximum gives the union one tangent. Each point takes that maximum along its
  // own ray: seen from here the long flat palm is not one radius, and far from
  // the thumb the ellipse is nowhere near it, so its skin stays as it is.
  const first_: [number, number] = starPoint(palm, prior.branch, enter);
  const last_: [number, number] = starPoint(palm, prior.branch, leave);
  const seat: [number, number] = [
    (first_[0] + last_[0]) / 2,
    (first_[1] + last_[1]) / 2,
  ];
  const outline_: [number, number][] = Array.from(
    { length: 720 },
    (_: unknown, i: number): [number, number] =>
      starPoint(palm, prior.branch, (TWO_PI * i) / 720),
  );
  const palmRadius = (phi: number): number => {
    const dx: number = Math.cos(phi);
    const dy: number = Math.sin(phi);
    let most: number = 0;
    outline_.forEach((p: [number, number], i: number): void => {
      const q: [number, number] = outline_[(i + 1) % outline_.length]!;
      const ex: number = q[0] - p[0];
      const ey: number = q[1] - p[1];
      const denominator: number = dx * ey - dy * ex;
      if (Math.abs(denominator) < 1e-12) return;
      const r: number =
        ((p[0] - seat[0]) * ey - (p[1] - seat[1]) * ex) / denominator;
      const u: number =
        ((p[0] - seat[0]) * dy - (p[1] - seat[1]) * dx) / denominator;
      if (r > 0 && u >= 0 && u <= 1) most = Math.max(most, r);
    });
    return most;
  };
  const thenarRadius = (phi: number): number => {
    const x: number = (seat[0] - thenar.b) / thenar.width;
    const y: number = (seat[1] - thenar.c) / thenar.depth;
    const dx: number = Math.cos(phi) / thenar.width;
    const dy: number = Math.sin(phi) / thenar.depth;
    const a: number = dx * dx + dy * dy;
    const b: number = x * dx + y * dy;
    const c: number = x * x + y * y - 1;
    return (-b + Math.sqrt(Math.max(0, b * b - a * c))) / a;
  };
  const ringRadii: number[] = Array.from(
    { length: RADII },
    (_: unknown, i: number): number => {
      const phi: number = (TWO_PI * i) / RADII;
      return softMax(palmRadius(phi), thenarRadius(phi), thenar.soft);
    },
  );
  const ringAt = (phi: number): Vec3 => {
    const x: number = (wrap(phi) / TWO_PI) * RADII;
    const i: number = Math.floor(x) % RADII;
    const f: number = x - Math.floor(x);
    const r: number =
      ringRadii[i]! + f * (ringRadii[(i + 1) % RADII]! - ringRadii[i]!);
    return [
      prior.branch,
      seat[0] + r * Math.cos(phi),
      seat[1] + r * Math.sin(phi),
    ];
  };

  // Phase runs against the angle, so the thumb's arc sweeps from where the ring
  // enters the thenar to where it leaves, the long way out past the thumb.
  const angleOf = (p: [number, number]): number =>
    Math.atan2(p[1] - seat[1], p[0] - seat[0]);
  const fromAngle: number = angleOf(first_);
  const toAngle: number = angleOf(last_);
  const direct: number = wrap(toAngle - fromAngle);
  const middleOf = (turned: number): number =>
    thenarRadius(fromAngle + turned / 2) - palmRadius(fromAngle + turned / 2);
  const turn: number =
    middleOf(direct) > middleOf(direct - TWO_PI) ? direct : direct - TWO_PI;
  const palmArc: number = enter - leave;
  const lengthOf = (read: (f: number) => Vec3): number => {
    let sum: number = 0;
    let last: Vec3 = read(0);
    for (let i: number = 1; i <= 256; i++) {
      const p: Vec3 = read(i / 256);
      sum += norm(sub(p, last));
      last = p;
    }
    return sum;
  };
  const palmAt = (f: number): Vec3 => {
    const q: Vec3 = palmSkin(
      palm,
      prior.branch,
      leave - f * (TWO_PI - palmArc),
    );
    const phi: number = Math.atan2(q[2] - seat[1], q[1] - seat[0]);
    const r: number = softMax(
      Math.hypot(q[1] - seat[0], q[2] - seat[1]),
      thenarRadius(phi),
      thenar.soft,
    );
    return [
      prior.branch,
      seat[0] + r * Math.cos(phi),
      seat[1] + r * Math.sin(phi),
    ];
  };
  const thenarLength: number = lengthOf(
    (f: number): Vec3 => ringAt(fromAngle + f * turn),
  );
  const palmLength: number = lengthOf(palmAt);
  const inner: number =
    (TWO_PI * thenarLength) / (thenarLength + palmLength);
  const middlePhase: number = bowl - (enter + leave) / 2;
  const palmar: number = wrap(middlePhase - inner / 2);
  const dorsal: number = wrap(middlePhase + inner / 2);
  const bridge: [number, number] = [
    last_[0] - first_[0],
    last_[1] - first_[1],
  ];
  const bridgeLength: number = Math.hypot(bridge[0], bridge[1]);
  const lineAlong: [number, number] = [
    bridge[0] / bridgeLength,
    bridge[1] / bridgeLength,
  ];
  const armRing = (t: number): Vec3 => {
    const along: number = wrap(t - palmar);
    const p: Vec3 =
      along >= inner
        ? palmAt((along - inner) / (TWO_PI - inner))
        : ringAt(fromAngle + (turn * along) / inner);
    const db: number = p[1] - seat[0];
    const dc: number = p[2] - seat[1];
    const y: number = db * lineAlong[0] + dc * lineAlong[1];
    const x: number = db * lineAlong[1] - dc * lineAlong[0];
    const g: number =
      thenar.valley *
      Math.exp(
        -0.5 * (x / thenar.valleyWidth) ** 2 -
          0.5 * (y / thenar.valleySpan) ** 2,
      );
    return [
      p[0],
      seat[0] + x * lineAlong[1] + y * (1 - g) * lineAlong[0],
      seat[1] - x * lineAlong[0] + y * (1 - g) * lineAlong[1],
    ];
  };

  // Web phases on the palm's last ring: its back runs with phase from the
  // thumb's side, its front back again.
  const toward: number = knuckle(0) - prior.branch;
  const fingerRing = (t: number): Vec3 => palmPoint(palm, 1, -t);
  const column = (b: number, from: number, to: number): number => {
    let lo: number = from;
    let hi: number = to;
    const rising: boolean = fingerRing(to)[1] > fingerRing(from)[1];
    for (let i: number = 0; i < 40; i++) {
      const mid: number = (lo + hi) / 2;
      if (fingerRing(mid)[1] < b === rising) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };
  const back: number[] = prior.webs.map(
    (w: AutoMovieHumanArmPrior.IWeb): number => column(w.b, 0, Math.PI),
  );
  const front: number[] = prior.webs.map(
    (w: AutoMovieHumanArmPrior.IWeb): number =>
      column(w.b, Math.PI, TWO_PI),
  );
  const arcs: [number, number][][] = [
    [[palmar, dorsal]],
    [[front[0]!, back[0]!]],
    [
      [back[0]!, back[1]!],
      [front[1]!, front[0]!],
    ],
    [
      [back[1]!, back[2]!],
      [front[2]!, front[1]!],
    ],
    [[back[2]!, front[2]!]],
  ];
  const digits: IDigit[] = prior.digits.map(
    (d: AutoMovieHumanArmPrior.IDigit, i: number): IDigit =>
      i === 0
        ? digit(d, rootOf(d.order, arcs[0]!, armRing), {
            centre: [prior.branch, thenar.b, thenar.c],
            width: thenar.width,
            depth: thenar.depth,
          })
        : digit(d, rootOf(d.order, arcs[i]!, fingerRing)),
  );
  const opening = (a: number, t: number): Vec3 => {
    const along: number = wrap(t - palmar);
    const own: number =
      along < inner
        ? smooth(along / OWN_FADE) * smooth((inner - along) / OWN_FADE)
        : 0;
    const line: Vec3 = lineTangent(digits[0]!, 0.1);
    const here: Vec3 = palmSkin(palm, a, bowl - t);
    const there: Vec3 = palmSkin(palm, prior.branch, bowl - t);
    const run: number = a - prior.branch;
    const ring: Vec3 = armRing(t);
    return [
      a,
      ring[1] +
        (1 - own) * (here[1] - there[1]) +
        (own * run * line[1]) / line[0],
      ring[2] +
        (1 - own) * (here[2] - there[2]) +
        (own * run * line[2]) / line[0],
    ];
  };

  // Every child's first own section stands past its arcs of its parent's ring
  // and its webs' crests, each read with the parent's own surface there, so
  // every column of the webs descends from the ring to the child.
  const armOutward = (t: number): Vec3 =>
    unit(sub(opening(prior.branch, t), opening(prior.branch - OUTWARD_STEP, t)));
  const palmOutward = (t: number): Vec3 =>
    unit(sub(fingerRing(t), palmPoint(palm, 1 - OUTWARD_STEP / toward, -t)));
  const thumbCrest: IClear = crestOf(armRing, armOutward, palmar, dorsal);
  const crests: IClear[] = prior.webs.map(
    (_: AutoMovieHumanArmPrior.IWeb, i: number): IClear =>
      crestOf(fingerRing, palmOutward, back[i]!, front[i]!),
  );
  const webs: IClear[][] = [[thumbCrest], [crests[0]!], [crests[0]!, crests[1]!], [crests[1]!, crests[2]!], [crests[2]!]];
  digits.forEach((d: IDigit, i: number): void => {
    d.clear = [...arcPoints(i === 0 ? armRing : fingerRing, arcs[i]!), ...webs[i]!];
    d.first = firstOf(d, d.clear);
  });

  // The palm from past the thumb's web to the finger roots, each section the
  // palm's own skin: every point to clear has the section's nearest point past
  // it along the hand.
  const section: AutoMovieHumanArmPrior.ISection = prior.palmSection;
  const order: number = section.order;
  const ringOf = (d: number): Vec3[] =>
    Array.from({ length: order }, (_: unknown, m: number): Vec3 =>
      palmPoint(palm, d / toward, (-TWO_PI * m) / order),
    );
  const palmClear: IClear[] = [...arcPoints(armRing, [[dorsal, palmar]]), thumbCrest];
  let start: number = 0;
  for (; start < toward - PALM_STEP; start += 0.25) {
    const ring: Vec3[] = ringOf(start);
    const clear: boolean = palmClear.every((x: IClear): boolean => {
      let near: Vec3 = ring[0]!;
      let best: number = Infinity;
      for (const p of ring) {
        const e: number = Math.hypot(p[1] - x.point[1], p[2] - x.point[2]);
        if (e < best) {
          best = e;
          near = p;
        }
      }
      return near[0] - x.point[0] >= x.margin;
    });
    if (clear) break;
  }
  const distances: number[] = [start];
  for (let d: number = start + PALM_STEP; d < toward - 2; d += PALM_STEP) distances.push(d);
  distances.push(toward - 1.2, toward);
  const palmRings: Vec3[][] = [...distances].reverse().map(ringOf);
  return {
    whole,
    palm,
    opening,
    palmRings,
    digits,
    events: [
      {
        parent: "hand.{side}.1",
        splits: prior.digits.slice(1).map(
          (d: AutoMovieHumanArmPrior.IDigit, i: number): ISplit => ({
            child: d.name,
            arcs: arcs[i + 1]!,
          }),
        ),
      },
      {
        parent: "arm.{side}",
        splits: [
          { child: prior.digits[0]!.name, arcs: [[palmar, dorsal]] },
          { child: "hand.{side}.1", arcs: [[dorsal, palmar]] },
        ],
      },
    ],
  };
}

/** Difference. */
function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** Sum. */
function plus(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

/** Scalar multiple. */
function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

/** Dot product. */
function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** Euclidean length. */
function norm(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]);
}

/** Unit vector; zero stays zero. */
function unit(a: Vec3): Vec3 {
  const l: number = norm(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

/** The part of a vector across a unit heading, as a unit vector. */
function across(v: Vec3, t: Vec3): Vec3 {
  const k: number = dot(v, t);
  return unit([v[0] - k * t[0], v[1] - k * t[1], v[2] - k * t[2]]);
}

/** Cross product. */
function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/** Smoothstep clamped to [0, 1]. */
function smooth(x: number): number {
  const t: number = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

/** Quintic smoothstep clamped to [0, 1]: no curvature at either end. */
function smoother(x: number): number {
  const t: number = Math.min(1, Math.max(0, x));
  return t * t * t * (t * (6 * t - 15) + 10);
}

/** Maximum with one tangent: exact where the two differ by more than k. */
function softMax(a: number, b: number, k: number): number {
  const h: number = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.max(a, b) + (h * h * k) / 4;
}

/** `log(1 + e^x)` without overflow. */
function softplus(x: number): number {
  return Math.max(x, 0) + Math.log1p(Math.exp(-Math.abs(x)));
}

/** Chains an arm owns. */
const OWNED: RegExp = /^(arm|hand|thumb|finger)\./;

/** Samples of the shoulder ring's arc. */
const RING: number = 128;

/** Height over which the shoulder ring's difference fades in, and the arm's sections turn level, world mm. */
const REACH: number = 70;

/** The arm's top ring above the mean height of its arc, which dips at the armpit, world mm. */
const SEAT: number = 8.5;

/** Step of the walk along the bones, mm. */
const WALK: number = 1;

/** Length of the walk past the wrist, world mm: beyond the heel's last cut. */
const RUN_ON: number = 120;

/** A whole turn. */
const TWO_PI: number = 2 * Math.PI;

/** Length past the heel's join over which the sections turn from the hand's axis onto the forearm's, world mm. */
const WRIST_TURN: number = 50;

/** The forearm's layers past the heel's join, world mm. */
const FOREARM_LAYERS: readonly number[] = [8, 22, 38, 56, 76];

/** Least spacing of the tube's layers past those, world mm. */
const LAYER_GAP: number = 12;

/** Parameter step of the arm's carried frame. */
const CARRY: number = 0.5;

/** Station step of a digit's carried frame, mm of the form. */
const DIGIT_CARRY: number = 0.25;

/** Parameter step of a layer's slopes. */
const SLOPE_STEP: number = 0.05;

/** Phase over which the heel's target hands from the palm's run to the thumb's. */
const OWN_FADE: number = 0.6;

/** Angles at which the arm's last ring holds its radius. */
const RADII: number = 720;

/** Step of a tube's tangent, mm. */
const STEP: number = 0.2;

/** Phases averaged for the centre of the section at the wrist crease. */
const CREASE_PHASES: number = 256;

/** How far a part's first own section stands past its webs' crests, beyond the margin's radius, mm of the form. */
const CREST_CLEARANCE: number = 2;

/** How far it stands past every point of its arcs, mm of the form. */
const ARC_CLEARANCE: number = 2;

/** Samples of each arc read for that clearance. */
const ARC_SAMPLES: number = 32;

/** Station step of a parent's outward direction at its ring, mm of the form. */
const OUTWARD_STEP: number = 0.05;

/** Spacing of the palm's sections, mm of the form. */
const PALM_STEP: number = 4;

/** Spacing of a digit's sections along its grown shaft, mm of the form. */
const DIGIT_STEP: number = 5;

/** Spacing of a digit's centre line handed to the skeleton, mm of the form. */
const LINE_STEP: number = 2;

/**
 * Rounds of the across scale's solve: each moves the knuckles less than a
 * twentieth of a millimetre past the third.
 */
const ACROSS_ROUNDS: number = 4;

/** De Leva's wrist centre to third metacarpale over wrist centre to third dactylion. */
const KNUCKLE: number = 0.459;

/** Third metacarpal over de Leva's wrist centre to third metacarpale. */
const THIRD_METACARPAL: number = 0.774;

/** De Leva's wrist centre distal of stylion, sexes averaged, mm. */
const STYLION: number = 2.3;

/**
 * Metacarpal lengths over the third, thumb to little (Reddy 2024, sexes
 * pooled; `docs/anatomy/hand.md`).
 */
const METACARPALS: readonly number[] = [0.711, 1.039, 1, 0.883, 0.797];

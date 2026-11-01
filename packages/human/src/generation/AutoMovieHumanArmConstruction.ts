import { AutoMovieHumanHorizontalChain } from "../lofting/AutoMovieHumanHorizontalChain";
import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanMonotoneCubic } from "../lofting/AutoMovieHumanMonotoneCubic";
import { AutoMovieHumanNaturalSpline } from "../lofting/AutoMovieHumanNaturalSpline";
import { AutoMovieHumanPolarSection } from "../lofting/AutoMovieHumanPolarSection";

import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanArmPrior } from "./AutoMovieHumanArmPrior";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Both arms and hands generated from the shoulder ring and public lengths and
 * tapes, by one construction on the left side and a reflection.
 *
 * The arm is a walk along two bones. The trunk places the shoulder; from there
 * the heading runs along the upper arm to the elbow, turns over a short length
 * and runs along the forearm to the wrist. The elbow and wrist stand where the
 * arm length inputs reach, and every point of the axis follows from the one
 * before it and the heading, so the axis has no breaks.
 *
 * About that axis a section is an ellipse in the plane across the bone. Its
 * size is a natural spline through the shoulder ring's size and the circles of
 * the biceps, elbow, forearm and wrist tapes, and its aspect runs from the
 * wrist's flat oval to the nearly round arm. A layer is that tube cut by a
 * plane: level at the shoulder, turning down the forearm until it stands across
 * the hand, so the arm reaches the hand square on. The shoulder ring's
 * difference from the tube fades in over the top of the arm.
 *
 * The hand is one form in its own axes, and every person's hand is that form
 * through one map. The heel, and the palm past the thumb's branch, are each a
 * radius about an inner point, read in the section's own half extents so a flat
 * section keeps its ends. The thenar is a section of its own: at the branch the
 * arm's last ring is the palm's curve and the thenar's ellipse, which cross at
 * the branch's two ends, and the heel above becomes that ring. Each digit is a
 * curved tube of elliptical sections that start in the branch's plane and turn
 * square to the digit's line, closed where its radius equals its distance from
 * the tip's apex; its width stops changing there, so the rounded tip leaves the
 * tube tangent. Valleys run back from each web between the knuckles, so a web is
 * a thin bridge and not a cut through the palm.
 *
 * A child leaves its parent by one rule. Its first ring is its arc of the
 * parent's ring closed by a bridge. To the plain tube each point runs a cubic
 * that starts along the child's own axis on the arc and sideways on the bridge,
 * which rounds the floor of the web, and `AutoMovieHumanEventJoin` makes the
 * arc tangent to the parent. A ring's phase follows its length, so no arc is
 * starved of points.
 *
 * Along the hand the palm and the fingers scale apart with a smooth change at
 * the finger roots; across it the breadth and through it the hand girth scale
 * it; the thumb scales about its root. Sections stay horizontal chains: a layer
 * sits at its ring's mean height and `lift` carries the rest. Reflection
 * reverses phase: the right side's point at phase t is the mirror of the left's
 * at -t.
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

    /** Length of the thumb. */
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
   * Calibration whose arms and hands are generated from its own shoulders.
   *
   * @param calibration Calibration holding `upper` and those chains, whose
   *   rows are replaced; not modified.
   * @param inputs Lengths in calibration millimetres.
   */
  export function apply(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
  ): IAutoMovieHumanBodyCalibration {
    const generated: Map<string, IAutoMovieHumanLoftChain> = new Map(
      chains(calibration, inputs).map(
        (c: IAutoMovieHumanLoftChain): [string, IAutoMovieHumanLoftChain] => [
          c.name,
          c,
        ],
      ),
    );
    return {
      ...calibration,
      chains: calibration.chains.map(
        (c: IAutoMovieHumanLoftChain): IAutoMovieHumanLoftChain =>
          generated.get(c.name) ?? c,
      ),
      poles: [
        ...calibration.poles.filter(
          (p: IAutoMovieHumanBodyCalibration.IPole): boolean => !owns(p.chain),
        ),
        ...poles(calibration, inputs),
      ],
    };
  }

  /** Calibration with both arms and hands, their events and poles added. */
  export function add(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
  ): IAutoMovieHumanBodyCalibration {
    return {
      ...calibration,
      chains: [...calibration.chains, ...chains(calibration, inputs)],
      events: [...calibration.events, ...events()],
      poles: [...calibration.poles, ...poles(calibration, inputs)],
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

  /** Read a world point's mirror on a side. */
  function sided(p: readonly [number, number, number], sign: 1 | -1): Vec3 {
    return [p[0], p[1], sign * p[2]];
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
    return {
      centre,
      radius,
      outline: ring.map((p: Vec3): [number, number] => [p[0], p[2]]),
    };
  }

  /** The shoulder ring's place, size and outline `[x, z]`. */
  interface IRing {
    centre: Vec3;
    radius: number;
    outline: [number, number][];
  }

  /** The arm's tube for one side, in the left frame. */
  interface IArm {
    /** Hand origin, in world millimetres. */
    wrist: Vec3;

    /** Point of layer k at phase t. */
    point(k: number, t: number): Vec3;
  }

  /** Walk the bones and build the tube. */
  function arm(ring: IRing, inputs: IInputs, hand: IHand): IArm {
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

    // The walk: each step follows the heading from the point before it.
    const count: number = Math.ceil((total + 40 * inputs.scale) / WALK) + 1;
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
    const size: AutoMovieHumanNaturalSpline.ISpline =
      AutoMovieHumanNaturalSpline.create(stations, [
        Math.log(ring.radius),
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
      const turn: number = prior.wristTurn * smooth((u - 0.6) / 0.4);
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
      for (let i: number = 0; i < 30; i++) {
        const mid: number = (lo + hi) / 2;
        if (dot(sub(surface(mid, theta), point), normal) > 0) lo = mid;
        else hi = mid;
      }
      return surface((lo + hi) / 2, theta);
    };
    const wrist: Vec3 = at(prior.wrist.station * total);
    const top: number = ring.centre[1];
    const angle = (t: number): number => prior.phase + prior.sense * t;

    // The bone's own point at a height, for a tilted plane's place.
    const level = (y: number): Vec3 => {
      let lo: number = 0;
      let hi: number = (count - 1) * WALK;
      for (let i: number = 0; i < 30; i++) {
        const mid: number = (lo + hi) / 2;
        if (at(mid)[1] > y) lo = mid;
        else hi = mid;
      }
      return at((lo + hi) / 2);
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
    const heelLayers: number = prior.heel.length;
    const bowl: number = omega();

    const tube = (k: number, t: number): Vec3 => {
      const h: number = prior.heights[k - heelLayers]!;
      const y: number = wrist[1] + h * (top - wrist[1]);
      const w: number =
        1 - smooth((h - prior.tilt[0]!) / (prior.tilt[1]! - prior.tilt[0]!));
      const normal: Vec3 = unit([
        w * square[0],
        1 - w + w * square[1],
        w * square[2],
      ]);
      const p: Vec3 = cut(level(y), normal, angle(t));
      const fade: number = smooth(
        (y - top + REACH * inputs.scale) / (REACH * inputs.scale),
      );
      if (fade === 0) return p;
      const q: Vec3 = cut([0, top, 0], [0, 1, 0], angle(t));
      const d: number = Math.atan2(q[2] - ring.centre[2], q[0] - ring.centre[0]);
      const gap: number =
        AutoMovieHumanPolarSection.radius(
          ring.outline,
          [ring.centre[0], ring.centre[2]],
          d,
        ) - Math.hypot(q[0] - ring.centre[0], q[2] - ring.centre[2]);
      return [
        p[0] + fade * gap * Math.cos(d),
        p[1],
        p[2] + fade * gap * Math.sin(d),
      ];
    };
    return {
      wrist: origin,
      point: (k: number, t: number): Vec3 => {
        if (k >= heelLayers) return tube(k, t);
        const a: number = prior.heel[k]!;
        const shape: IForm = form();
        const heel: Vec3 = wholeSkin(shape.whole, a, bowl - t);
        const closing: number = smooth(
          (a - handPrior.branch + handPrior.thenar.reach) /
            handPrior.thenar.reach,
        );
        const ring: Vec3 = shape.opening(a, t);
        const skin: Vec3 = map([
          a,
          heel[1] + closing * (ring[1] - heel[1]),
          heel[2] + closing * (ring[2] - heel[2]),
        ]);
        const v: number = smoother(
          (a - prior.blend[0]!) / (prior.blend[1]! - prior.blend[0]!),
        );
        if (v === 1) return skin;
        const bone: Vec3 = cut(map([a, 0, 0]), square, angle(t));
        return [
          bone[0] + v * (skin[0] - bone[0]),
          bone[1] + v * (skin[1] - bone[1]),
          bone[2] + v * (skin[2] - bone[2]),
        ];
      },
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

  /** A hand's map from the prior's axes to the left frame. */
  function handPoint(
    q: readonly [number, number, number],
    hand: IHand,
    tape: number,
    scale: number,
    wrist: readonly [number, number, number],
  ): Vec3 {
    const prior: AutoMovieHumanArmPrior.IHandPrior =
      AutoMovieHumanArmPrior.PRIOR.hand;
    const length: number = hand.length * prior.lengthRatio;
    const palm: number = hand.palm * prior.palmRatio;
    const breadth: number = hand.breadth * prior.breadthRatio;
    const inPalm: number = palm / prior.size.palm;
    const inFingers: number =
      (length - palm) / (prior.size.length - prior.size.palm);
    const through: number = tape / scale / prior.size.circumference;
    const a: number =
      inPalm * q[0] +
      (inFingers - inPalm) *
        prior.handover *
        softplus((q[0] - prior.size.palm) / prior.handover);
    const b: number = (q[1] * breadth) / prior.size.breadth;
    const c: number = q[2] * through * scale;
    return [
      wrist[0] + a * prior.along[0] + b * prior.across[0] + c * prior.through[0],
      wrist[1] + a * prior.along[1] + b * prior.across[1] + c * prior.through[1],
      wrist[2] + a * prior.along[2] + b * prior.across[2] + c * prior.through[2],
    ];
  }

  /** How much longer a person's thumb is than the mean, past the palm's own scale. */
  function thumbGrowth(hand: IHand): number {
    const prior: AutoMovieHumanArmPrior.IHandPrior =
      AutoMovieHumanArmPrior.PRIOR.hand;
    const inPalm: number = (hand.palm * prior.palmRatio) / prior.size.palm;
    return (hand.thumb * prior.thumbRatio) / prior.size.thumb / inPalm;
  }

  /** A horizontal chain from a point function of station and phase. */
  function build(
    shape: AutoMovieHumanHorizontalChain.IShape,
    stations: readonly number[],
    read: (s: number, t: number) => Vec3,
    sign: 1 | -1,
  ): IAutoMovieHumanLoftChain {
    return AutoMovieHumanHorizontalChain.build(
      shape,
      stations.map((s: number): Vec3[] =>
        Array.from(
          { length: shape.order },
          (_: unknown, m: number): Vec3 =>
            sided(read(s, (sign * 2 * Math.PI * m) / shape.order), sign),
        ),
      ),
    );
  }

  /** A chain from the hand's own rings, from the bottom, through a person's map. */
  function placed(
    shape: AutoMovieHumanHorizontalChain.IShape,
    rings: readonly (readonly Vec3[])[],
    map: (q: readonly [number, number, number]) => Vec3,
    sign: 1 | -1,
  ): IAutoMovieHumanLoftChain {
    const n: number = shape.order;
    return AutoMovieHumanHorizontalChain.build(
      shape,
      rings.map((ring: readonly Vec3[]): Vec3[] =>
        Array.from(
          { length: n },
          (_: unknown, m: number): Vec3 =>
            sided(map(ring[sign === 1 ? m : (n - m) % n]!), sign),
        ),
      ),
    );
  }

  /** Both sides' chains. */
  function chains(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
  ): IAutoMovieHumanLoftChain[] {
    const prior: AutoMovieHumanArmPrior.IPrior = AutoMovieHumanArmPrior.PRIOR;
    const hand: IForm = form();
    return (["left", "right"] as const).flatMap(
      (side: "left" | "right"): IAutoMovieHumanLoftChain[] => {
        const sign: 1 | -1 = side === "left" ? 1 : -1;
        const measures: IHand = inputs[side];
        const law: IArm = arm(
          shoulder(calibration, side, sign),
          inputs,
          measures,
        );
        const map = (q: readonly [number, number, number]): Vec3 =>
          handPoint(q, measures, inputs.circumference, inputs.scale, law.wrist);
        const armChain: IAutoMovieHumanLoftChain = build(
          {
            name: `arm.${side}`,
            order: prior.arm.order,
            samples: prior.arm.samples,
            rule: prior.arm.rule,
          },
          Array.from(
            { length: prior.arm.heel.length + prior.arm.heights.length },
            (_: unknown, k: number): number => k,
          ),
          (k: number, t: number): Vec3 => law.point(k, t),
          sign,
        );
        const palm: IAutoMovieHumanLoftChain = placed(
          {
            name: `hand.${side}.1`,
            order: prior.hand.palmSection.order,
            samples: prior.hand.palmSection.samples,
            rule: "arclength",
          },
          hand.palmRings,
          map,
          sign,
        );
        const digits: IAutoMovieHumanLoftChain[] = hand.digits.map(
          (d: IDigit, i: number): IAutoMovieHumanLoftChain => {
            const source: AutoMovieHumanArmPrior.IDigit = prior.hand.digits[i]!;
            return placed(
              {
                name: source.name.replace("{side}", side),
                order: source.order,
                samples: source.samples,
                rule: "polar",
              },
              i === 0 ? digitRings(d, thumbGrowth(measures)) : d.rings,
              map,
              sign,
            );
          },
        );
        return [armChain, ...digits.slice(0, 1), palm, ...digits.slice(1)];
      },
    );
  }

  /** Both hands' poles. */
  function poles(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
  ): IAutoMovieHumanBodyCalibration.IPole[] {
    const prior: AutoMovieHumanArmPrior.IPrior = AutoMovieHumanArmPrior.PRIOR;
    return (["left", "right"] as const).flatMap(
      (side: "left" | "right"): IAutoMovieHumanBodyCalibration.IPole[] => {
        const sign: 1 | -1 = side === "left" ? 1 : -1;
        const law: IArm = arm(
          shoulder(calibration, side, sign),
          inputs,
          inputs[side],
        );
        return form().digits.map(
          (d: IDigit, i: number): IAutoMovieHumanBodyCalibration.IPole => ({
            chain: prior.hand.digits[i]!.name.replace("{side}", side),
            end: "bottom",
            critical: true,
            point: sided(
              handPoint(
                i === 0 ? grown(d.pole, thumbGrowth(inputs[side])) : d.pole,
                inputs[side],
                inputs.circumference,
                inputs.scale,
                law.wrist,
              ),
              sign,
            ),
          }),
        );
      },
    );
  }

  /** Both hands' events: the form's for the left, reflected for the right. */
  function events(): IAutoMovieHumanBodyCalibration.IEvent[] {
    return form().events.flatMap(
      (e: IEvent): IAutoMovieHumanBodyCalibration.IEvent[] => [
        {
          parent: e.parent.replace("{side}", "left"),
          direction: "down",
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

/** A child's first ring and how each of its points leaves it. */
interface IRoot {
  /** Points of the first ring, one per control point. */
  points: Vec3[];

  /** 1 on the bridge, falling to 0 on the arc. */
  bridge: number[];

  /** Length of its longest bridge. */
  span: number;
}

/** A digit's law and rings, in the hand's axes. */
interface IDigit {
  root: IRoot;
  centre: Vec3;
  line: AutoMovieHumanNaturalSpline.ISpline[];
  width: [number, number][];
  depth: [number, number][];
  angles: number[];
  blend: number;
  stations: number[];
  pole: Vec3;
  rings: Vec3[][];
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

/** A digit's first ring: its arcs of the parent's ring, closed by bridges. */
function rootOf(
  order: number,
  arcs: readonly [number, number][],
  read: (t: number) => Vec3,
): IRoot {
  const span = ([from, to]: [number, number]): number =>
    to >= from ? to - from : to + TWO_PI - from;
  const walk = (arc: [number, number]): number[] => {
    const sums: number[] = [0];
    let last: Vec3 = read(arc[0]);
    for (let i: number = 1; i <= WALKED; i++) {
      const p: Vec3 = read(arc[0] + (span(arc) * i) / WALKED);
      sums.push(sums[i - 1]! + norm(sub(p, last)));
      last = p;
    }
    return sums;
  };
  const length = (arc: [number, number]): number => walk(arc)[WALKED]!;
  const phaseAt = (arc: [number, number], sums: number[], f: number): number => {
    const goal: number = f * sums[WALKED]!;
    let i: number = 0;
    while (i + 1 < WALKED && sums[i + 1]! < goal) i++;
    const piece: number = sums[i + 1]! - sums[i]!;
    const part: number = piece > 0 ? (goal - sums[i]!) / piece : 0;
    return arc[0] + (span(arc) * (i + part)) / WALKED;
  };
  const pieces: { arc: [number, number] | null; from: Vec3; to: Vec3; size: number }[] =
    arcs.flatMap((arc: [number, number], i: number) => {
      const next: [number, number] = arcs[(i + 1) % arcs.length]!;
      const from: Vec3 = read(arc[0] + span(arc));
      const to: Vec3 = read(next[0]);
      return [
        { arc, from: read(arc[0]), to: from, size: length(arc) },
        { arc: null, from, to, size: norm(sub(to, from)) },
      ];
    });
  const whole: number = pieces.reduce(
    (s: number, p): number => s + p.size,
    0,
  );
  const shares: number[] = pieces.map((p): number =>
    Math.max(p.arc === null ? 3 : 4, Math.round((order * p.size) / whole)),
  );
  const longest: number = shares.indexOf(Math.max(...shares));
  shares[longest]! += order - shares.reduce((s: number, v: number): number => s + v, 0);
  const points: Vec3[] = [];
  const open: boolean[] = [];
  pieces.forEach((p, i: number): void => {
    const sums: number[] = p.arc === null ? [] : walk(p.arc);
    for (let j: number = 0; j < shares[i]!; j++) {
      const f: number = j / shares[i]!;
      if (p.arc !== null) {
        const t: number = phaseAt(p.arc, sums, f);
        points.push(read(t));
        open.push(j === 0);
      } else {
        points.push([
          p.from[0] + f * (p.to[0] - p.from[0]),
          p.from[1] + f * (p.to[1] - p.from[1]),
          p.from[2] + f * (p.to[2] - p.from[2]),
        ]);
        open.push(true);
      }
    }
  });
  return {
    points,
    bridge: bridgeWeights(open),
    span: Math.max(
      ...pieces.map((p): number => (p.arc === null ? p.size : 0)),
    ),
  };
}

/** A weight 1 on bridge nodes that falls to 0 within a few nodes of the arc. */
function bridgeWeights(open: readonly boolean[]): number[] {
  const n: number = open.length;
  return open.map((_: boolean, m: number): number => {
    let near: number = n;
    for (let i: number = 0; i < n; i++)
      if (open[i]!) {
        const d: number = Math.abs(i - m);
        near = Math.min(near, Math.min(d, n - d));
      }
    return near >= FALL ? 0 : 1 - smooth(near / FALL);
  });
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

/**
 * Normal of a digit's section plane. It starts as the branch's plane, across the
 * hand, and turns square to the digit's line: square at the root, a digit that
 * leaves at a slant would swing its near side back into its parent.
 */
function sectionNormal(d: IDigit, s: number): Vec3 {
  const t: Vec3 = lineTangent(d, s);
  const w: number = smooth(s / TURN);
  return unit([1 - w + w * t[0], w * t[1], w * t[2]]);
}

/** Axes across a digit's line: toward the thumb's side and through the hand. */
function digitAxes(t: Vec3): [Vec3, Vec3] {
  const k: number = t[1];
  const b: Vec3 = unit([-k * t[0], 1 - k * t[1], -k * t[2]]);
  return [b, cross(t, b)];
}

/** The plain tube of a digit at a length and section angle. */
function digitTube(d: IDigit, s: number, phi: number): Vec3 {
  const c: Vec3 = linePoint(d, s);
  const [b, n] = digitAxes(sectionNormal(d, s));
  const w: number =
    AutoMovieHumanMonotoneCubic.interpolate(d.width, s) * Math.cos(phi);
  const h: number =
    AutoMovieHumanMonotoneCubic.interpolate(d.depth, s) * Math.sin(phi);
  return [
    c[0] + w * b[0] + h * n[0],
    c[1] + w * b[1] + h * n[1],
    c[2] + w * b[2] + h * n[2],
  ];
}

/** A point about the thumb's root at a person's growth. */
function grown(q: Vec3, k: number): Vec3 {
  const r: readonly [number, number, number] =
    AutoMovieHumanArmPrior.PRIOR.hand.thumbRoot;
  return [
    r[0] + k * (q[0] - r[0]),
    r[1] + k * (q[1] - r[1]),
    r[2] + k * (q[2] - r[2]),
  ];
}

/**
 * Cubic from a root point to the tube: its start runs along the tube's own
 * tangent, so skin the parent and child share stays that skin, or sideways
 * toward the child's middle on a bridge, its end along the tube.
 */
function handover(
  root: IRoot,
  m: number,
  middle: Vec3,
  flow: Vec3,
  end: Vec3,
  after: Vec3,
  x: number,
): Vec3 {
  const start: Vec3 = root.points[m]!;
  const reach: number = norm(sub(end, start));
  const side: Vec3 = unit(sub(middle, start));
  const k: number = root.bridge[m]!;
  const lead: Vec3 = unit([
    (1 - k) * flow[0] + k * side[0],
    (1 - k) * flow[1] + k * side[1],
    (1 - k) * flow[2] + k * side[2],
  ]);
  const h00: number = 2 * x * x * x - 3 * x * x + 1;
  const h10: number = x * x * x - 2 * x * x + x;
  const h01: number = 3 * x * x - 2 * x * x * x;
  const h11: number = x * x * x - x * x;
  return [0, 1, 2].map(
    (c: number): number =>
      h00 * start[c]! +
      h10 * reach * lead[c]! +
      h01 * end[c]! +
      h11 * after[c]!,
  ) as Vec3;
}

/** A digit's rings from its tip, at a growth about the thumb's root. */
function digitRings(d: IDigit, k: number): Vec3[][] {
  const order: number = d.root.points.length;
  const grow = (q: Vec3): Vec3 => (k === 1 ? q : grown(q, k));
  return [...d.stations].reverse().map((s: number): Vec3[] =>
    Array.from({ length: order }, (_: unknown, m: number): Vec3 => {
      const phi: number = d.angles[m]!;
      if (s >= d.blend) return grow(digitTube(d, s, phi));
      if (s === 0) return d.root.points[m]!;
      const end: Vec3 = grow(digitTube(d, d.blend, phi));
      const on: Vec3 = grow(digitTube(d, d.blend + STEP, phi));
      return handover(
        d.root,
        m,
        d.centre,
        unit(sub(grow(digitTube(d, 0.5, phi)), grow(digitTube(d, 0, phi)))),
        end,
        [
          ((on[0] - end[0]) / STEP) * d.blend,
          ((on[1] - end[1]) / STEP) * d.blend,
          ((on[2] - end[2]) / STEP) * d.blend,
        ],
        s / d.blend,
      );
    }),
  );
}

/** A digit's law from its first ring and its anchors. */
function digit(
  source: AutoMovieHumanArmPrior.IDigit,
  root: IRoot,
  start: { centre: Vec3; width: number; depth: number } | null = null,
): IDigit {
  const n: number = root.points.length;
  const centre: Vec3 =
    start?.centre ??
    ([0, 1, 2].map(
      (c: number): number =>
        root.points.reduce((s: number, p: Vec3): number => s + p[c]!, 0) / n,
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
    root,
    centre,
    line,
    width: [],
    depth: [],
    angles: [],
    blend: source.blend,
    stations: [],
    pole: [0, 0, 0],
    rings: [],
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
  const tip: Vec3 = lineTangent(tube, cap - 0.05);
  const reach: number = norm(sub(apex, linePoint(tube, cap)));
  const end: Vec3 = linePoint(tube, cap);
  tube.pole = [
    end[0] + reach * tip[0],
    end[1] + reach * tip[1],
    end[2] + reach * tip[2],
  ];

  // Section angles step with length round the first ring, from the middle of
  // a bridge, so they always turn one way and no point slides round the digit.
  const [b, c] = digitAxes(sectionNormal(tube, 0.1));
  const plain: [number, number][] = root.points.map(
    (p: Vec3): [number, number] => {
      const v: Vec3 = sub(p, centre);
      return [dot(v, b) / tube.width[0]![1], dot(v, c) / tube.depth[0]![1]];
    },
  );
  const area: number = plain.reduce(
    (s: number, p: [number, number], m: number): number => {
      const q: [number, number] = plain[(m + 1) % n]!;
      return s + p[0] * q[1] - q[0] * p[1];
    },
    0,
  );
  const turn: number = area >= 0 ? TWO_PI : -TWO_PI;
  const steps: number[] = root.points.map((p: Vec3, m: number): number =>
    norm(sub(root.points[(m + 1) % n]!, p)),
  );
  const around: number = steps.reduce(
    (s: number, v: number): number => s + v,
    0,
  );
  const anchor: number = root.bridge.indexOf(Math.max(...root.bridge));
  const face: number = Math.atan2(plain[anchor]![1], plain[anchor]![0]);
  let walked: number = 0;
  tube.angles = new Array<number>(n).fill(0);
  for (let i: number = 0; i < n; i++) {
    const m: number = (anchor + i) % n;
    tube.angles[m] = face + (turn * walked) / around;
    walked += steps[m]!;
  }
  // The first layer stands clear of a bridge's corners by the bridge's own
  // size: nearer, a corner's quads fold under one of the mirrored diagonals.
  const clear: number = Math.max(FIRST, CLEAR * root.span);
  const stations: number[] = [
    0,
    ...[clear, 5, 7, 10, 13].filter(
      (s: number): boolean => s >= clear && s < source.blend,
    ),
  ];
  for (let s: number = source.blend; s < cap - 2.5; s += 5) stations.push(s);
  stations.push(cap - 1.2, cap - 0.3, cap);
  tube.stations = stations;
  tube.rings = digitRings(tube, 1);
  return tube;
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

  // The palm's first ring: each ray from the palm's middle to the arm's ring.
  const section: AutoMovieHumanArmPrior.ISection = prior.palmSection;
  const order: number = section.order;
  const near: number = wrap(dorsal);
  const away: number = wrap(palmar);
  const span: number = away >= near ? away - near : away + TWO_PI - near;
  const outline: { p: Vec3; t: number | null }[] = [
    ...Array.from({ length: 360 }, (_: unknown, i: number) => {
      const t: number = near + (span * i) / 359;
      return { p: armRing(t), t };
    }),
    ...Array.from({ length: 40 }, (_: unknown, i: number) => {
      const a: Vec3 = armRing(near + span);
      const b: Vec3 = armRing(near);
      const f: number = (i + 1) / 41;
      return {
        p: [
          a[0] + f * (b[0] - a[0]),
          a[1] + f * (b[1] - a[1]),
          a[2] + f * (b[2] - a[2]),
        ] as Vec3,
        t: null,
      };
    }),
  ];
  const middle: [number, number] = [
    AutoMovieHumanNaturalSpline.evaluate(palm.splines[0]!, prior.branch),
    AutoMovieHumanNaturalSpline.evaluate(palm.splines[1]!, prior.branch),
  ];
  const extent: [number, number] = [
    AutoMovieHumanNaturalSpline.evaluate(palm.splines[2]!, prior.branch),
    AutoMovieHumanNaturalSpline.evaluate(palm.splines[3]!, prior.branch),
  ];
  const hits = outline.map((o) =>
    wrap(
      Math.atan2(
        (o.p[2] - middle[1]) / extent[1],
        (o.p[1] - middle[0]) / extent[0],
      ),
    ),
  );
  const firstPoints: Vec3[] = [];
  const open: boolean[] = [];
  for (let m: number = 0; m < order; m++) {
    const theta: number = wrap((-TWO_PI * m) / order);
    let best: number = 0;
    let least: number = Infinity;
    hits.forEach((h: number, i: number): void => {
      const d: number = Math.abs(Math.atan2(Math.sin(h - theta), Math.cos(h - theta)));
      if (d < least) {
        least = d;
        best = i;
      }
    });
    const o = outline[best]!;
    const off: number = Math.atan2(
      Math.sin(hits[best]! - theta),
      Math.cos(hits[best]! - theta),
    );
    const side: number = off > 0 ? -1 : 1;
    const other = outline[(best + side + outline.length) % outline.length]!;
    const gap: number = Math.abs(
      Math.atan2(
        Math.sin(hits[(best + side + hits.length) % hits.length]! - hits[best]!),
        Math.cos(hits[(best + side + hits.length) % hits.length]! - hits[best]!),
      ),
    );
    const f: number = gap > 0 ? Math.min(1, least / gap) : 0;
    firstPoints.push([
      o.p[0] + f * (other.p[0] - o.p[0]),
      o.p[1] + f * (other.p[1] - o.p[1]),
      o.p[2] + f * (other.p[2] - o.p[2]),
    ]);
    open.push(o.t === null);
  }
  const first: IRoot = {
    points: firstPoints,
    bridge: bridgeWeights(open),
    span: 0,
  };

  // The palm from that ring to the finger roots.
  const toward: number = knuckle(0) - prior.branch;
  const distances: number[] = [0, 1.5, 3, 5, 7.5, 10];
  for (let d: number = section.blend; d < toward - 2; d += 4) distances.push(d);
  distances.push(toward - 1.2, toward);
  const centre: Vec3 = [prior.branch, middle[0], middle[1]];
  const palmRings: Vec3[][] = [...distances].reverse().map((d: number): Vec3[] =>
    Array.from({ length: order }, (_: unknown, m: number): Vec3 => {
      const theta: number = (-TWO_PI * m) / order;
      if (d >= section.blend) return palmPoint(palm, d / toward, theta);
      if (d === 0) return first.points[m]!;
      const end: Vec3 = palmPoint(palm, section.blend / toward, theta);
      const on: Vec3 = palmPoint(palm, (section.blend + STEP) / toward, theta);
      return handover(
        first,
        m,
        centre,
        unit(
          sub(palmPoint(palm, 0.5 / toward, theta), palmPoint(palm, 0, theta)),
        ),
        end,
        [
          ((on[0] - end[0]) / STEP) * section.blend,
          ((on[1] - end[1]) / STEP) * section.blend,
          ((on[2] - end[2]) / STEP) * section.blend,
        ],
        d / section.blend,
      );
    }),
  );

  // Web phases on the palm's last ring: its back runs with phase from the
  // thumb's side, its front back again.
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
  return {
    whole,
    palm,
    opening: (a: number, t: number): Vec3 => {
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
    },
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

/** Height over which the shoulder ring's difference fades in, world mm. */
const REACH: number = 70;

/** The arm's top ring above the mean height of its arc, which dips at the armpit, world mm. */
const SEAT: number = 8.5;

/** Step of the walk along the bones, mm. */
const WALK: number = 1;

/** A whole turn. */
const TWO_PI: number = 2 * Math.PI;

/** Nodes of a ring over which a bridge's sideways start fades into the arc. */
const FALL: number = 5;

/** Length along a digit over which its section turns square to its line, mm. */
const TURN: number = 20;

/** Phase over which the heel's target hands from the palm's run to the thumb's. */
const OWN_FADE: number = 0.6;

/** Angles at which the arm's last ring holds its radius. */
const RADII: number = 720;

/** Least distance of a digit's first layer from its root, mm. */
const FIRST: number = 2.5;

/** That distance per unit of the digit's bridge. */
const CLEAR: number = 0.8;

/** Steps of an arc when it is walked by length. */
const WALKED: number = 64;

/** Step of a tube's tangent past its handover, mm. */
const STEP: number = 0.2;

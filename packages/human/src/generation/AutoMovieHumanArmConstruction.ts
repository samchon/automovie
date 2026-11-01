import { AutoMovieHumanHorizontalChain } from "../lofting/AutoMovieHumanHorizontalChain";
import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanNaturalSpline } from "../lofting/AutoMovieHumanNaturalSpline";
import { AutoMovieHumanPolarSection } from "../lofting/AutoMovieHumanPolarSection";
import { AutoMovieHumanSectionField } from "../lofting/AutoMovieHumanSectionField";

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
 * wrist's flat oval to the nearly round arm. The layers stay at their heights:
 * each one is the horizontal cut of that tube, found per phase. The shoulder
 * ring's difference from the tube fades in over the top of the arm.
 *
 * The hand's heel keeps its sections, sized by the hand tape, because the
 * thumb and palm leave it; the tube blends into them past the wrist.
 *
 * The hand is the population's hand from the wrist, in axes along it, across
 * it and through it. Along it the palm and the fingers scale apart with a
 * smooth change at the finger roots; across it the breadth and through it the
 * hand girth scale it; the thumb scales about its root.
 *
 * Sections stay horizontal chains: a layer sits at its ring's mean height and
 * `lift` carries the rest. Reflection reverses phase: the right side's point
 * at phase t is the mirror of the left's at -t.
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
  function sided(
    p: readonly [number, number, number],
    sign: 1 | -1,
  ): [number, number, number] {
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
    const ring: [number, number, number][] = event.splits
      .find(
        (s: IAutoMovieHumanBodyCalibration.ISplit): boolean =>
          s.child === `arm.${side}`,
      )!
      .arcs.flatMap(
        ([from, to]: [number, number]): [number, number, number][] => {
          const span: number = to >= from ? to - from : to + 2 * Math.PI - from;
          return AutoMovieHumanLoftChain.ring(
            upper,
            upper.layers[0]!.y,
            Array.from(
              { length: RING },
              (_: unknown, i: number): number => from + (span * i) / RING,
            ),
          );
        },
      )
      .map((p: [number, number, number]): [number, number, number] =>
        sided(p, sign),
      );
    const centre: [number, number, number] = [
      mean(ring, 0),
      mean(ring, 1),
      mean(ring, 2),
    ];
    const radius: number =
      ring.reduce(
        (s: number, p: [number, number, number]): number =>
          s +
          Math.hypot(p[0] - centre[0], p[1] - centre[1], p[2] - centre[2]),
        0,
      ) / ring.length;
    return {
      centre,
      radius,
      outline: ring.map((p: [number, number, number]): [number, number] => [
        p[0],
        p[2],
      ]),
    };
  }

  /** The shoulder ring's place, size and outline `[x, z]`. */
  interface IRing {
    centre: [number, number, number];
    radius: number;
    outline: [number, number][];
  }

  /** The arm's tube for one side, in the left frame. */
  interface IArm {
    /** Hand origin, the bottom layer's centre. */
    wrist: [number, number, number];

    /** Point of layer k at phase t. */
    point(k: number, t: number): [number, number, number];
  }

  /** Walk the bones and build the tube. */
  function arm(ring: IRing, inputs: IInputs): IArm {
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
      prior.upperLength[0]! * inputs.scale +
      prior.upperLength[1]! * inputs.upper;
    const lower: number =
      prior.lowerLength[0]! * inputs.scale +
      prior.lowerLength[1]! * inputs.lower;
    const total: number = upper + lower;
    const soft: number = prior.softness * inputs.scale;

    // The walk: each step follows the heading from the point before it.
    const count: number = Math.ceil((total + 40 * inputs.scale) / WALK) + 1;
    const shoulder: Vec3 = [
      ring.centre[0],
      ring.centre[1] + SEAT * inputs.scale,
      ring.centre[2],
    ];
    const axis: Vec3[] = [
      [
        shoulder[0] + prior.bias[0]! * inputs.scale,
        shoulder[1] + prior.bias[1]! * inputs.scale,
        shoulder[2] + prior.bias[2]! * inputs.scale,
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
    const at = (s: number, list: readonly Vec3[]): Vec3 => {
      // Above the shoulder the bone runs on: the top layers' cuts reach it.
      if (s < 0)
        return [
          list[0]![0] + s * before[0],
          list[0]![1] + s * before[1],
          list[0]![2] + s * before[2],
        ];
      const x: number = Math.min(count - 1.001, s / WALK);
      const i: number = Math.floor(x);
      const f: number = x - i;
      const a: Vec3 = list[i]!;
      const b: Vec3 = list[i + 1]!;
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
      const c: Vec3 = at(s, axis);
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

    // A horizontal cut: the tube's height falls along the walk at any phase.
    const cut = (y: number, theta: number): Vec3 => {
      let lo: number = -ring.radius * 2;
      let hi: number = (count - 1) * WALK;
      for (let i: number = 0; i < 30; i++) {
        const mid: number = (lo + hi) / 2;
        if (surface(mid, theta)[1] > y) lo = mid;
        else hi = mid;
      }
      return surface((lo + hi) / 2, theta);
    };
    const wrist: Vec3 = at(prior.wrist.station * total, axis);
    const top: number = ring.centre[1];
    const height = (k: number): number =>
      wrist[1] + prior.heights[k]! * (top - wrist[1]);
    const angle = (t: number): number => prior.phase + prior.sense * t;

    // Size of the hand's heel, which keeps its own sections.
    const unit: number = (inputs.circumference * prior.heelUnit) / (2 * Math.PI);
    const field: AutoMovieHumanSectionField.ICompiled =
      AutoMovieHumanSectionField.compile(prior);
    const heel = (k: number, t: number): Vec3 => {
      const q: Vec3 = AutoMovieHumanSectionField.point(
        AutoMovieHumanSectionField.section(field, k),
        field.width,
        t,
      );
      const o: readonly number[] = prior.heelOffset[k]!;
      return [
        wrist[0] + unit * (o[0]! + q[0]),
        wrist[1] + unit * (o[1]! + q[1]),
        wrist[2] + unit * (o[2]! + q[2]),
      ];
    };
    const tube = (k: number, t: number): Vec3 => {
      const y: number = height(k);
      const p: Vec3 = cut(y, angle(t));
      const w: number = smooth((y - top + REACH * inputs.scale) / (REACH * inputs.scale));
      if (w === 0) return p;
      const q: Vec3 = cut(top, angle(t));
      const d: number = Math.atan2(q[2] - ring.centre[2], q[0] - ring.centre[0]);
      const gap: number =
        AutoMovieHumanPolarSection.radius(
          ring.outline,
          [ring.centre[0], ring.centre[2]],
          d,
        ) - Math.hypot(q[0] - ring.centre[0], q[2] - ring.centre[2]);
      return [
        p[0] + w * gap * Math.cos(d),
        p[1],
        p[2] + w * gap * Math.sin(d),
      ];
    };
    const place: number = prior.heelOffset.length - 1;
    return {
      wrist: [
        wrist[0] + unit * prior.heelOffset[0]![0]!,
        wrist[1] + unit * prior.heelOffset[0]![1]!,
        wrist[2] + unit * prior.heelOffset[0]![2]!,
      ],
      point: (k: number, t: number): Vec3 => {
        if (k < place - 2) return heel(k, t);
        const p: Vec3 = tube(k, t);
        if (k >= place) return p;
        const h: Vec3 = heel(k, t);
        const w: number = (k - (place - 3)) / 3;
        return [
          h[0] + w * (p[0] - h[0]),
          h[1] + w * (p[1] - h[1]),
          h[2] + w * (p[2] - h[2]),
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

  /** The part of a vector across a unit heading, as a unit vector. */
  function across(v: Vec3, t: Vec3): Vec3 {
    const k: number = v[0] * t[0] + v[1] * t[1] + v[2] * t[2];
    const a: Vec3 = [v[0] - k * t[0], v[1] - k * t[1], v[2] - k * t[2]];
    const l: number = Math.hypot(a[0], a[1], a[2]);
    return [a[0] / l, a[1] / l, a[2] / l];
  }

  /** Cross product. */
  function cross(a: Vec3, b: Vec3): Vec3 {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  /** A hand's map from the prior's axes to the left frame. */
  function handPoint(
    q: readonly [number, number, number],
    hand: IHand,
    tape: number,
    scale: number,
    wrist: readonly [number, number, number],
    root: readonly [number, number, number] | null,
  ): [number, number, number] {
    const prior: AutoMovieHumanArmPrior.IHandPrior =
      AutoMovieHumanArmPrior.PRIOR.hand;
    const length: number = hand.length * prior.lengthRatio;
    const palm: number = hand.palm * prior.palmRatio;
    const breadth: number = hand.breadth * prior.breadthRatio;
    const inPalm: number = palm / prior.size.palm;
    const inFingers: number =
      (length - palm) / (prior.size.length - prior.size.palm);
    const through: number = tape / scale / prior.size.circumference;
    const out = (p: readonly [number, number, number]): [number, number, number] => {
      const a: number =
        inPalm * p[0] +
        (inFingers - inPalm) *
          prior.handover *
          softplus((p[0] - prior.size.palm) / prior.handover);
      const b: number = (p[1] * breadth) / prior.size.breadth;
      const c: number = p[2] * through * scale;
      return [
        wrist[0] + a * prior.along[0] + b * prior.across[0] + c * prior.through[0],
        wrist[1] + a * prior.along[1] + b * prior.across[1] + c * prior.through[1],
        wrist[2] + a * prior.along[2] + b * prior.across[2] + c * prior.through[2],
      ];
    };
    if (root === null) return out(q);

    // The thumb scales about its root, on top of the hand's own map.
    const k: number =
      (hand.thumb * prior.thumbRatio) / prior.size.thumb / inPalm;
    return out([
      root[0] + k * (q[0] - root[0]),
      root[1] + k * (q[1] - root[1]),
      root[2] + k * (q[2] - root[2]),
    ]);
  }

  /** A horizontal chain from a point function of station and phase. */
  function build(
    shape: AutoMovieHumanHorizontalChain.IShape,
    stations: readonly number[],
    read: (s: number, t: number) => [number, number, number],
    sign: 1 | -1,
  ): IAutoMovieHumanLoftChain {
    return AutoMovieHumanHorizontalChain.build(
      shape,
      stations.map((s: number): [number, number, number][] =>
        Array.from(
          { length: shape.order },
          (_: unknown, m: number): [number, number, number] =>
            sided(read(s, (sign * 2 * Math.PI * m) / shape.order), sign),
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
    return (["left", "right"] as const).flatMap(
      (side: "left" | "right"): IAutoMovieHumanLoftChain[] => {
        const sign: 1 | -1 = side === "left" ? 1 : -1;
        const law: IArm = arm(shoulder(calibration, side, sign), inputs);
        const hand: IHand = inputs[side];
        const armChain: IAutoMovieHumanLoftChain = build(
          {
            name: `arm.${side}`,
            order: prior.arm.order,
            samples: prior.arm.samples,
            rule: prior.arm.rule,
          },
          prior.arm.heights.map((_: number, k: number): number => k),
          (k: number, t: number): [number, number, number] => law.point(k, t),
          sign,
        );
        const fingers: IAutoMovieHumanLoftChain[] = prior.hand.chains.map(
          (c: AutoMovieHumanArmPrior.IChain): IAutoMovieHumanLoftChain => {
            const field: AutoMovieHumanSectionField.ICompiled =
              AutoMovieHumanSectionField.compile(c);
            return build(
              {
                name: c.name.replace("{side}", side),
                order: c.order,
                samples: c.samples,
                rule: c.rule,
              },
              c.layers,
              (s: number, t: number): [number, number, number] =>
                handPoint(
                  AutoMovieHumanSectionField.point(
                    AutoMovieHumanSectionField.section(field, s),
                    field.width,
                    t,
                  ),
                  hand,
                  inputs.circumference,
                  inputs.scale,
                  law.wrist,
                  c.name.startsWith("thumb.") ? prior.hand.thumbRoot : null,
                ),
              sign,
            );
          },
        );
        return [armChain, ...fingers];
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
        const law: IArm = arm(shoulder(calibration, side, sign), inputs);
        return prior.hand.poles.map(
          (
            p: AutoMovieHumanArmPrior.IPole,
          ): IAutoMovieHumanBodyCalibration.IPole => ({
            chain: p.chain.replace("{side}", side),
            end: "bottom",
            critical: p.critical,
            point: sided(
              handPoint(
                p.point,
                inputs[side],
                inputs.circumference,
                inputs.scale,
                law.wrist,
                p.chain.startsWith("thumb.") ? prior.hand.thumbRoot : null,
              ),
              sign,
            ),
          }),
        );
      },
    );
  }

  /** Both hands' events: the prior's for the left, reflected for the right. */
  function events(): IAutoMovieHumanBodyCalibration.IEvent[] {
    return AutoMovieHumanArmPrior.PRIOR.hand.events.flatMap(
      (
        e: AutoMovieHumanArmPrior.IEvent,
      ): IAutoMovieHumanBodyCalibration.IEvent[] => [
        {
          parent: e.parent.replace("{side}", "left"),
          direction: "down",
          splits: e.splits.map(
            (
              s: AutoMovieHumanArmPrior.ISplit,
            ): IAutoMovieHumanBodyCalibration.ISplit => ({
              child: s.child.replace("{side}", "left"),
              arcs: s.arcs.map(
                (a: readonly [number, number]): [number, number] => [a[0], a[1]],
              ),
            }),
          ),
        },
        {
          parent: e.parent.replace("{side}", "right"),
          direction: "down",
          splits: [...e.splits].reverse().map(
            (
              s: AutoMovieHumanArmPrior.ISplit,
            ): IAutoMovieHumanBodyCalibration.ISplit => ({
              child: s.child.replace("{side}", "right"),
              arcs: [...s.arcs].reverse().map(
                (a: readonly [number, number]): [number, number] =>
                  a[0] === 0 && a[1] === TWO_PI
                    ? [0, TWO_PI]
                    : [TWO_PI - a[1], TWO_PI - a[0]],
              ),
            }),
          ),
        },
      ],
    );
  }

  /** Mean of a coordinate of a ring. */
  function mean(ring: [number, number, number][], c: number): number {
    return (
      ring.reduce(
        (s: number, p: [number, number, number]): number => s + p[c]!,
        0,
      ) / ring.length
    );
  }
}

/** A point or direction. */
type Vec3 = [number, number, number];

/** Smoothstep clamped to [0, 1]. */
function smooth(x: number): number {
  const t: number = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
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

import { AutoMovieHumanSectionField } from "../lofting/AutoMovieHumanSectionField";
import { AutoMovieHumanSplineCurve } from "../lofting/AutoMovieHumanSplineCurve";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanFootPrior } from "./AutoMovieHumanFootPrior";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Both feet generated from the population's foot and three dimensions, by one
 * construction in the left foot's frame and a reflection.
 *
 * The prior holds the mean foot of people in the declared domain as a section
 * field per chain, in axes from the ankle centre: forward along the foot, up
 * from the floor, and across it. A person's foot is that field under a map:
 *
 * - Forward, the toes and the heel scale apart, with a smooth change at the
 *   ankle, because the ankle's place along the foot differs between people.
 * - Up, heights scale with the ankle; the floor stays.
 * - Across, widths scale with the foot breadth.
 *
 * The chains keep their section planes: planes across the foot under the
 * forefoot and toes, and a fan about an axis over the ball that turns up to
 * the horizontal ankle ring. The map moves points out of those planes, and
 * `lift` carries the difference, so every chain stays an ordinary chain for
 * the surface, the skin and the event join.
 *
 * The ankle centre stands at the origin here; the stance belongs to
 * `AutoMovieHumanLegConstruction.stand`.
 *
 * Reflection reverses phase: the right foot's point at phase t is the mirror
 * of the left field's point at -t, and its in-plane axis `v` turns over so
 * that sections keep their sense round the chain.
 */
export namespace AutoMovieHumanFootConstruction {
  /** One foot's public dimensions, in the same millimetres as the calibration. */
  export interface IDimensions {
    /** Back of the heel to the tip of the longest toe. */
    length: number;

    /** Greatest breadth across the metatarsal heads. */
    breadth: number;

    /** Height of the lateral malleolus. */
    ankle: number;
  }

  /** What a foot reads. */
  export interface IInputs {
    /** Left foot. */
    left: IDimensions;

    /** Right foot. */
    right: IDimensions;

    /** Fat control. */
    fat: number;

    /** Muscularity control. */
    muscularity: number;

    /** Calibration millimetres per world millimetre. */
    scale: number;
  }

  /**
   * Calibration whose feet are generated.
   *
   * @param calibration Calibration holding foot chains, whose rows are
   *   replaced; not modified.
   * @param inputs Dimensions in calibration millimetres.
   */
  export function apply(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
  ): IAutoMovieHumanBodyCalibration {
    const generated: Map<string, IAutoMovieHumanLoftChain> = new Map(
      chains(inputs).map(
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
          (p: IAutoMovieHumanBodyCalibration.IPole): boolean =>
            !OWNED.test(p.chain),
        ),
        ...poles(inputs),
      ],
    };
  }

  /** Calibration with both feet, their events and their poles added. */
  export function add(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
  ): IAutoMovieHumanBodyCalibration {
    return {
      ...calibration,
      chains: [...calibration.chains, ...chains(inputs)],
      events: [...calibration.events, ...events()],
      poles: [...calibration.poles, ...poles(inputs)],
    };
  }

  /**
   * Dimensions of a person whose feet are not measured.
   *
   * @param stature Stature in world millimetres.
   * @param sex Masculine-feminine control.
   * @param fat Fat control.
   * @param muscularity Muscularity control.
   * @param scale Calibration millimetres per world millimetre.
   */
  export function expected(
    stature: number,
    sex: number,
    fat: number,
    muscularity: number,
    scale: number,
  ): IDimensions {
    const line = (w: readonly number[]): number =>
      (w[0]! + w[1]! * stature + w[2]! * sex + w[3]! * fat + w[4]! * muscularity) *
      scale;
    const prior: AutoMovieHumanFootPrior.IExpected =
      AutoMovieHumanFootPrior.PRIOR.expected;
    return {
      length: line(prior.length),
      breadth: line(prior.breadth),
      ankle: line(prior.ankle),
    };
  }

  /** Whether a chain belongs to a foot. */
  export function owns(name: string): boolean {
    return OWNED.test(name);
  }

  /** The foot's own measures from its inputs, in calibration millimetres. */
  interface IMap {
    toe: number;
    heel: number;
    height: number;
    breadth: number;
    sign: 1 | -1;
  }

  /** A side's map from the prior's axes to the calibration's. */
  function mapOf(
    dimensions: IDimensions,
    inputs: IInputs,
    sign: 1 | -1,
  ): IMap {
    if (
      !(dimensions.length > 0) ||
      !(dimensions.breadth > 0) ||
      !(dimensions.ankle > 0)
    )
      throw new Error("A foot needs positive dimensions");
    const prior: AutoMovieHumanFootPrior.IPrior = AutoMovieHumanFootPrior.PRIOR;

    // A very short foot would take the line past the ankle.
    const heel: number = Math.max(
      MINIMUM_HEEL * dimensions.length,
      prior.heel.offset * inputs.scale +
        prior.heel.length * dimensions.length +
        (prior.heel.fat * inputs.fat +
          prior.heel.muscularity * inputs.muscularity) *
          inputs.scale,
    );
    return {
      heel,
      toe: dimensions.length - heel,
      height: prior.ankleRatio * dimensions.ankle,
      breadth: dimensions.breadth,
      sign,
    };
  }

  /** A point of the prior's axes in the calibration. */
  function world(
    q: readonly [number, number, number],
    map: IMap,
  ): [number, number, number] {
    const prior: AutoMovieHumanFootPrior.IPrior = AutoMovieHumanFootPrior.PRIOR;
    const toe: number = map.toe / prior.size.toe;
    const heel: number = map.heel / prior.size.heel;
    const along: number =
      q[0] * (toe + (heel - toe) * 0.5 * (1 - Math.tanh(q[0] / prior.handover)));
    const across: number = (q[2] * map.breadth) / prior.size.breadth;
    const c: number = Math.cos(prior.yaw);
    const s: number = Math.sin(prior.yaw);
    return [
      along * c - across * s,
      (q[1] * map.height) / prior.size.height,
      map.sign * (along * s + across * c),
    ];
  }

  /** Plane of a station in the prior's chain. */
  interface IPlane {
    origin: [number, number, number];
    u: [number, number, number];
    v: [number, number, number];
  }

  /** The section plane at a station. */
  function plane(
    field: AutoMovieHumanFootPrior.IChain,
    station: number,
    map: IMap,
  ): IPlane {
    const prior: AutoMovieHumanFootPrior.IPrior = AutoMovieHumanFootPrior.PRIOR;
    const c: number = Math.cos(prior.frameYaw);
    const s: number = Math.sin(prior.frameYaw);
    const pivot: readonly [number, number, number] = prior.pivot;

    // The fan turns about the axis over the ball; every other chain runs
    // forward from it in planes across the foot.
    const turn: number = field.fan ? station / prior.lever : 0;
    const reach: number = field.fan ? 0 : station;
    const relative: number = prior.frameYaw - prior.yaw;
    return {
      origin: world(
        [
          pivot[0] - reach * Math.cos(relative),
          pivot[1],
          pivot[2] - reach * Math.sin(relative),
        ],
        map,
      ),
      u: [Math.sin(turn) * c, Math.cos(turn), map.sign * Math.sin(turn) * s],
      v: [-map.sign * s, 0, c],
    };
  }

  /** Coordinates of a side's section in its plane, `[u, v, normal]` per sample. */
  function section(
    field: AutoMovieHumanSectionField.ICompiled,
    chain: AutoMovieHumanFootPrior.IChain,
    station: number,
    map: IMap,
    count: number,
  ): [number, number, number][] {
    const frame: IPlane = plane(chain, station, map);
    const series: number[] = AutoMovieHumanSectionField.section(field, station);
    const n: [number, number, number] = cross(frame.v, frame.u);
    return Array.from(
      { length: count },
      (_: unknown, m: number): [number, number, number] => {
        const t: number = (2 * Math.PI * m) / count;
        const p: [number, number, number] = world(
          AutoMovieHumanSectionField.point(series, field.width, map.sign * t),
          map,
        );
        const d: [number, number, number] = [
          p[0] - frame.origin[0],
          p[1] - frame.origin[1],
          p[2] - frame.origin[2],
        ];
        return [dot(d, frame.u), dot(d, frame.v), dot(d, n)];
      },
    );
  }

  /** Control values of a section. */
  function controls(
    samples: [number, number, number][],
    order: number,
  ): { coefficients: number[]; lift: number[] } {
    return {
      coefficients: AutoMovieHumanSplineCurve.interpolate(
        samples.map(
          (s: [number, number, number]): [number, number] => [s[0], s[1]],
        ),
      ),
      lift: AutoMovieHumanSplineCurve.interpolate(
        samples.map(
          (s: [number, number, number]): [number, number] => [s[2], 0],
        ),
      ).slice(0, order),
    };
  }

  /** One side's chain. */
  function chain(
    prior: AutoMovieHumanFootPrior.IChain,
    map: IMap,
    side: "left" | "right",
  ): IAutoMovieHumanLoftChain {
    const field: AutoMovieHumanSectionField.ICompiled =
      AutoMovieHumanSectionField.compile(prior);
    const count: number = prior.order;
    const last: number = prior.layers.length - 1;
    return {
      name: nameOf(prior.name, side),
      basis: "spline",
      order: prior.order,
      rule: prior.rule,
      samples: prior.samples,
      layers: prior.layers.map(
        (station: number, k: number): IAutoMovieHumanLoftChain.ILayer => {
          const here = controls(
            section(field, prior, station, map, count),
            prior.order,
          );
          const a: number = k === 0 ? station : station - STEP;
          const b: number = k === last ? station : station + STEP;
          const before = controls(section(field, prior, a, map, count), prior.order);
          const after = controls(section(field, prior, b, map, count), prior.order);
          const slope = (
            lo: readonly number[],
            hi: readonly number[],
          ): number[] => lo.map((v: number, i: number): number => (hi[i]! - v) / (b - a));
          return {
            y: station,
            frame: plane(prior, station, map),
            coefficients: here.coefficients,
            slopes: slope(before.coefficients, after.coefficients),
            lift: here.lift,
            liftSlopes: slope(before.lift, after.lift),
          };
        },
      ),
    };
  }

  /** Both feet's chains. */
  function chains(inputs: IInputs): IAutoMovieHumanLoftChain[] {
    const left: IMap = mapOf(inputs.left, inputs, 1);
    const right: IMap = mapOf(inputs.right, inputs, -1);
    return AutoMovieHumanFootPrior.PRIOR.chains.flatMap(
      (c: AutoMovieHumanFootPrior.IChain): IAutoMovieHumanLoftChain[] => [
        chain(c, left, "left"),
        chain(c, right, "right"),
      ],
    );
  }

  /** Both feet's poles. */
  function poles(inputs: IInputs): IAutoMovieHumanBodyCalibration.IPole[] {
    const left: IMap = mapOf(inputs.left, inputs, 1);
    const right: IMap = mapOf(inputs.right, inputs, -1);
    return AutoMovieHumanFootPrior.PRIOR.poles.flatMap(
      (p: AutoMovieHumanFootPrior.IPole): IAutoMovieHumanBodyCalibration.IPole[] =>
        (
          [
            [left, "left"],
            [right, "right"],
          ] as const
        ).map(
          ([map, side]): IAutoMovieHumanBodyCalibration.IPole => ({
            chain: nameOf(p.chain, side),
            end: "bottom",
            point: world(p.point, map),
            critical: p.critical,
          }),
        ),
    );
  }

  /** Both feet's events: the prior's for the left, reflected for the right. */
  function events(): IAutoMovieHumanBodyCalibration.IEvent[] {
    return AutoMovieHumanFootPrior.PRIOR.events.flatMap(
      (
        e: AutoMovieHumanFootPrior.IEvent,
      ): IAutoMovieHumanBodyCalibration.IEvent[] => [
        {
          parent: nameOf(e.parent, "left"),
          direction: "down",
          splits: e.splits.map(
            (
              s: AutoMovieHumanFootPrior.ISplit,
            ): IAutoMovieHumanBodyCalibration.ISplit => ({
              child: nameOf(s.child, "left"),
              arcs: s.arcs.map(
                (a: readonly [number, number]): [number, number] => [a[0], a[1]],
              ),
            }),
          ),
        },
        {
          parent: nameOf(e.parent, "right"),
          direction: "down",
          splits: [...e.splits].reverse().map(
            (
              s: AutoMovieHumanFootPrior.ISplit,
            ): IAutoMovieHumanBodyCalibration.ISplit => ({
              child: nameOf(s.child, "right"),
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


  /** A prior's chain name on a side. */
  function nameOf(name: string, side: "left" | "right"): string {
    return name.replace("{side}", side);
  }

  /** Cross product. */
  function cross(
    a: readonly [number, number, number],
    b: readonly [number, number, number],
  ): [number, number, number] {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  /** Dot product. */
  function dot(
    a: readonly [number, number, number],
    b: readonly [number, number, number],
  ): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
}

/** Chains a foot owns. */
const OWNED: RegExp = /^(foot|forefoot|toe)\./;


/** Station step of the slope differences, mm. */
const STEP: number = 0.02;

/** Shortest heel behind the ankle, as a share of the foot's length. */
const MINIMUM_HEEL: number = 0.1;

/** A whole turn. */
const TWO_PI: number = 2 * Math.PI;

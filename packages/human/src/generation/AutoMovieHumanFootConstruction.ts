import { AutoMovieHumanNaturalSpline } from "../lofting/AutoMovieHumanNaturalSpline";
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
 * A parent reads its end section from its children's rings, by {@link adopt},
 * the ball of the foot is one plantar surface, by {@link padded}, and a toe
 * closes on its pole by its own cap, by {@link capped}: all three follow from
 * the prior, with no number of a person.
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

  /** A side's skin at a station: `count` world points of the field. */
  function tube(
    field: AutoMovieHumanSectionField.ICompiled,
    station: number,
    map: IMap,
    count: number,
  ): [number, number, number][] {
    const series: number[] = AutoMovieHumanSectionField.section(field, station);
    return Array.from(
      { length: count },
      (_: unknown, m: number): [number, number, number] =>
        world(
          padded(
            AutoMovieHumanSectionField.point(
              series,
              field.width,
              (map.sign * TWO_PI * m) / count,
            ),
          ),
          map,
        ),
    );
  }

  /** The ball's one plantar surface. */
  interface IBall {
    /** Lower ends of the webs, `[across, forward]`. */
    webs: [number, number][];

    /** Height of the pad at a place on the sole. */
    height: (forward: number, across: number) => number;
  }

  /**
   * A point of the prior's axes with the ball's skin on the ball.
   *
   * A web's pinch belongs to the web and the top of the foot, but the sections
   * that lead to it lift the plantar skin with it, in a groove back into the
   * ball. Keeping the web where it is and pressing the skin behind it down
   * only makes a cliff beside a fixed point, so the web comes down too: low
   * skin near a web's lower end is drawn toward the pad, by {@link BALL_WEB} at
   * the web and wholly past {@link BALL_CREASE} behind it, which leaves a toe's
   * crease short and the ball one surface. The test reads only position, so a
   * parent, its children and the chord between them move alike, and skin above
   * {@link BALL_LOW} is left to the web and the top of the foot.
   */
  function padded(
    q: readonly [number, number, number],
  ): [number, number, number] {
    const ball: IBall = ballOf();
    const height: number = q[1] - ball.height(q[0], q[2]);
    if (height >= BALL_LOW + BALL_EASE) return [q[0], q[1], q[2]];
    let open: number = 1;
    for (const web of ball.webs) {
      const behind: number = web[1] - q[0];
      const across: number = q[2] - web[0];
      const away: number = Math.hypot(
        behind > 0
          ? Math.max(0, behind - BALL_REACH) / BALL_WIDTH
          : behind / BALL_AHEAD,
        across / BALL_WIDTH,
      );
      if (away >= 1) continue;
      const depth: number =
        BALL_WEB + (1 - BALL_WEB) * smooth(behind / BALL_CREASE);
      open *= 1 - (1 - away * away) ** 3 * depth;
    }
    const share: number =
      (1 - open) * (1 - smooth((height - BALL_LOW) / BALL_EASE));
    return [q[0], q[1] - share * height, q[2]];
  }

  /** The ball, read once from the prior's own flat plantar skin. */
  function ballOf(): IBall {
    if (BALL !== null) return BALL;
    const prior: AutoMovieHumanFootPrior.IPrior = AutoMovieHumanFootPrior.PRIOR;
    const webs: [number, number][] = [];
    for (const event of prior.events) {
      const parent: AutoMovieHumanFootPrior.IChain | undefined =
        prior.chains.find(
          (c: AutoMovieHumanFootPrior.IChain): boolean =>
            c.name === event.parent,
        );
      if (parent === undefined) continue;
      const field: AutoMovieHumanSectionField.ICompiled =
        AutoMovieHumanSectionField.compile(parent);
      const series: number[] = AutoMovieHumanSectionField.section(
        field,
        parent.stations[0]!,
      );
      for (const split of event.splits) {
        if (split.arcs.length !== 1 || !split.child.startsWith("toe.")) continue;
        const ends: [number, number, number][] = split.arcs[0]!.map(
          (t: number): [number, number, number] =>
            AutoMovieHumanSectionField.point(series, field.width, t),
        );
        const low: [number, number, number] =
          ends[0]![1] < ends[1]![1] ? ends[0]! : ends[1]!;
        webs.push([low[2], low[0]]);
      }
    }

    // The pad is a cubic in place through skin that lies flat: a groove stands
    // above that and leaves the fit by itself.
    const terms = (x: number, z: number): number[] => {
      const u: number = x / BALL_UNIT;
      const v: number = z / BALL_UNIT;
      return [1, u, v, u * u, u * v, v * v, u * u * u, u * u * v, u * v * v, v * v * v];
    };
    const size: number = terms(0, 0).length;
    const A: number[][] = Array.from(
      { length: size },
      (): number[] => new Array<number>(size + 1).fill(0),
    );
    for (const chain of prior.chains) {
      if (isToe(chain)) continue;
      const field: AutoMovieHumanSectionField.ICompiled =
        AutoMovieHumanSectionField.compile(chain);
      const low: number = chain.layers[0]!;
      const high: number = Math.min(
        chain.layers[chain.layers.length - 1]!,
        low + BALL_SPAN,
      );
      for (let s: number = low; s < high; s += BALL_SKIP) {
        const series: number[] = AutoMovieHumanSectionField.section(field, s);
        for (let m: number = 0; m < 256; m++) {
          const p: [number, number, number] = AutoMovieHumanSectionField.point(
            series,
            field.width,
            (TWO_PI * m) / 256,
          );
          if (p[1] > BALL_FLAT) continue;
          const row: number[] = terms(p[0], p[2]);
          for (let i: number = 0; i < size; i++) {
            for (let k: number = 0; k < size; k++)
              A[i]![k]! += row[i]! * row[k]!;
            A[i]![size]! += row[i]! * p[1];
          }
        }
      }
    }
    for (let i: number = 0; i < size; i++) {
      let pivot: number = i;
      for (let r: number = i + 1; r < size; r++)
        if (Math.abs(A[r]![i]!) > Math.abs(A[pivot]![i]!)) pivot = r;
      [A[i], A[pivot]] = [A[pivot]!, A[i]!];
      for (let r: number = 0; r < size; r++) {
        if (r === i) continue;
        const f: number = A[r]![i]! / A[i]![i]!;
        for (let k: number = i; k <= size; k++) A[r]![k]! -= f * A[i]![k]!;
      }
    }
    const weights: number[] = A.map(
      (row: number[], i: number): number => row[size]! / row[i]!,
    );
    BALL = {
      webs,
      height: (forward: number, across: number): number =>
        terms(forward, across).reduce(
          (sum: number, t: number, i: number): number => sum + t * weights[i]!,
          0,
        ),
    };
    return BALL;
  }

  /**
   * A toe's skin past its cap's start: a quarter ellipse from each point of the
   * base section to the pole, `c + (B - c) cos(a) + (p - c) sin(a)`, with `a`
   * running evenly over the stations left to the chain's end.
   *
   * The ellipse alone leaves the base along `p - c`, which is the rim of a dome
   * laid on a tapering tube. The last term carries the difference from the
   * tube's own tangent `T`, so skin leaves the base with the tube's tangent at
   * every phase. Its weight `sin(a) (1 - sin(a))^2` has no value or slope at the
   * pole, so all phases still close on one point with one tangent plane.
   */
  function capped(
    field: AutoMovieHumanSectionField.ICompiled,
    cap: ICap,
    station: number,
    map: IMap,
    count: number,
  ): [number, number, number][] {
    const base: [number, number, number][] = tube(field, cap.from, map, count);
    const above: [number, number, number][] = tube(
      field,
      cap.from + STEP,
      map,
      count,
    );
    const centre: [number, number, number] = [0, 1, 2].map(
      (k: number): number =>
        base.reduce(
          (sum: number, p: [number, number, number]): number => sum + p[k]!,
          0,
        ) / count,
    ) as [number, number, number];
    const pole: [number, number, number] = world(cap.pole, map);
    const reach: number = cap.from - cap.end;
    const a: number = ((cap.from - station) / reach) * (Math.PI / 2);
    const sine: number = Math.sin(a);
    const cosine: number = Math.cos(a);
    const weight: number = sine * (1 - sine) ** 2;
    return base.map(
      (b: [number, number, number], m: number): [number, number, number] =>
        [0, 1, 2].map((k: number): number => {
          const axis: number = pole[k]! - centre[k]!;
          const tangent: number =
            (((b[k]! - above[m]![k]!) / STEP) * reach * 2) / Math.PI;
          return (
            centre[k]! +
            (b[k]! - centre[k]!) * cosine +
            axis * sine +
            (tangent - axis) * weight
          );
        }) as [number, number, number],
    );
  }

  /** What a parent's section takes from its children's rings. */
  interface IAdoption {
    /** World move of each sample of the parent's end section. */
    moves: [number, number, number][];

    /** Share of those moves at a station: the end row's reach along the chain. */
    reach: AutoMovieHumanNaturalSpline.ISpline;
  }

  /**
   * A parent's end section read from its children.
   *
   * A pinch is a cusp, which no cut series carries: the end row's plantar line
   * rings at the series' last harmonic, 0.4 mm about 13 mm apart, far from any
   * pinch, and cutting the series lower rings harder. A child's end ring runs
   * along the same skin without the cusp, so it is the clean copy of the shared
   * ring. Each point of the parent's end section therefore moves to its nearest
   * point on its children's rings, unless it lies too far to be the same skin.
   * The move fades exactly as the end row's own influence does, its cardinal
   * spline over the chain's anchors: that cancels the ripple where the row
   * carries it, and is zero on every other anchor, so the far ring stays.
   */
  function adopt(
    prior: AutoMovieHumanFootPrior.IChain,
    field: AutoMovieHumanSectionField.ICompiled,
    map: IMap,
    count: number,
  ): IAdoption | null {
    const all: AutoMovieHumanFootPrior.IPrior = AutoMovieHumanFootPrior.PRIOR;
    const event: AutoMovieHumanFootPrior.IEvent | undefined = all.events.find(
      (e: AutoMovieHumanFootPrior.IEvent): boolean => e.parent === prior.name,
    );
    if (event === undefined) return null;
    const rings: [number, number, number][] = event.splits.flatMap(
      (s: AutoMovieHumanFootPrior.ISplit): [number, number, number][] => {
        const child: AutoMovieHumanFootPrior.IChain = all.chains.find(
          (c: AutoMovieHumanFootPrior.IChain): boolean => c.name === s.child,
        )!;
        return tube(
          AutoMovieHumanSectionField.compile(child),
          child.layers[child.layers.length - 1]!,
          map,
          ADOPTED_RING,
        );
      },
    );
    return {
      moves: tube(field, prior.layers[0]!, map, count).map(
        (p: [number, number, number]): [number, number, number] => {
          let best: number = Infinity;
          let near: [number, number, number] = p;
          for (const q of rings) {
            const d: number =
              (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;
            if (d < best) {
              best = d;
              near = q;
            }
          }
          const w: number =
            1 - smooth((Math.sqrt(best) - ADOPTED_NEAR) / ADOPTED_FADE);
          return [
            w * (near[0] - p[0]),
            w * (near[1] - p[1]),
            w * (near[2] - p[2]),
          ];
        },
      ),
      reach: AutoMovieHumanNaturalSpline.create(
        prior.stations,
        prior.stations.map((_: number, i: number): number => (i === 0 ? 1 : 0)),
      ),
    };
  }

  /** Coordinates of a side's section in its plane, `[u, v, normal]` per sample. */
  function section(
    field: AutoMovieHumanSectionField.ICompiled,
    chain: AutoMovieHumanFootPrior.IChain,
    cap: ICap | null,
    adoption: IAdoption | null,
    station: number,
    map: IMap,
    count: number,
  ): [number, number, number][] {
    const frame: IPlane = plane(chain, station, map);
    const n: [number, number, number] = cross(frame.v, frame.u);
    const share: number =
      adoption === null
        ? 0
        : AutoMovieHumanNaturalSpline.evaluate(adoption.reach, station);
    return (
      cap !== null && station < cap.from
        ? capped(field, cap, station, map, count)
        : tube(field, station, map, count)
    ).map((q: [number, number, number], m: number): [number, number, number] =>
      adoption === null
        ? q
        : [
            q[0] + share * adoption.moves[m]![0],
            q[1] + share * adoption.moves[m]![1],
            q[2] + share * adoption.moves[m]![2],
          ],
    ).map(
      (p: [number, number, number]): [number, number, number] => {
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

  /** A toe's closing: where it starts, where its stations end, and its pole. */
  interface ICap {
    /** Station of the base section. */
    from: number;

    /** Station at the pole. */
    end: number;

    /** The pole in the prior's axes. */
    pole: readonly [number, number, number];
  }

  /** A toe's cap: its base is the prior's, and it closes on the toe's pole. */
  function capOf(prior: AutoMovieHumanFootPrior.IChain): ICap | null {
    const pole: AutoMovieHumanFootPrior.IPole | undefined =
      AutoMovieHumanFootPrior.PRIOR.poles.find(
        (p: AutoMovieHumanFootPrior.IPole): boolean => p.chain === prior.name,
      );
    return pole === undefined
      ? null
      : { from: pole.cap, end: prior.layers[0]!, pole: pole.point };
  }

  /** A chain's layers: the prior's, and even turns of a cap in place of its tip. */
  function stationsOf(
    prior: AutoMovieHumanFootPrior.IChain,
    cap: ICap | null,
  ): number[] {
    if (cap === null) return [...prior.layers];
    return [
      ...Array.from(
        { length: CAP_LAYERS },
        (_: unknown, i: number): number =>
          cap.end + ((cap.from - cap.end) * i) / CAP_LAYERS,
      ),
      cap.from,
      ...prior.layers.slice(1),
    ];
  }

  /** One side's chain. */
  function chain(
    prior: AutoMovieHumanFootPrior.IChain,
    map: IMap,
    side: "left" | "right",
  ): IAutoMovieHumanLoftChain {
    const field: AutoMovieHumanSectionField.ICompiled =
      AutoMovieHumanSectionField.compile(prior);
    const cap: ICap | null = capOf(prior);
    const count: number = prior.order;
    const adoption: IAdoption | null = adopt(prior, field, map, count);
    const stations: number[] = stationsOf(prior, cap);
    const last: number = stations.length - 1;
    return {
      name: nameOf(prior.name, side),
      basis: "spline",
      order: prior.order,
      rule: prior.rule,
      samples: prior.samples,
      ...(cap === null
        ? {}
        : { pole: { end: "bottom" as const, point: world(cap.pole, map) } }),
      layers: stations.map(
        (station: number, k: number): IAutoMovieHumanLoftChain.ILayer => {
          const here = controls(
            section(field, prior, cap, adoption, station, map, count),
            prior.order,
          );
          const a: number = k === 0 ? station : station - STEP;
          const b: number = k === last ? station : station + STEP;
          const before = controls(
            section(field, prior, cap, adoption, a, map, count),
            prior.order,
          );
          const after = controls(
            section(field, prior, cap, adoption, b, map, count),
            prior.order,
          );
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

            // A toe closes by its own cap, so the surface adds no dome.
            critical: false,
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
          ...filletOf(e),
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
          ...filletOf(e),
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

  /**
   * A branch's fillet, where every child has the length for it. A forefoot
   * chain is shorter than its own radius, so a turn spread over it has no room:
   * a shorter fillet raised its ribs from 282 to 433 degrees per radius.
   */
  function filletOf(
    event: AutoMovieHumanFootPrior.IEvent,
  ): { fillet?: number } {
    return event.splits.every((s: AutoMovieHumanFootPrior.ISplit): boolean =>
      s.child.startsWith("toe."),
    )
      ? { fillet: 1 }
      : {};
  }

  /** Whether a prior's chain is a toe. */
  function isToe(prior: AutoMovieHumanFootPrior.IChain): boolean {
    return prior.name.startsWith("toe.");
  }

  /** Smoothstep on [0, 1], clamped. */
  function smooth(x: number): number {
    const t: number = Math.min(1, Math.max(0, x));
    return t * t * (3 - 2 * t);
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

/** Distance behind a web over which the ball takes its skin, a toe's crease, mm. */
const BALL_CREASE: number = 8;

/** Length behind a web over which the ball holds its skin, mm. */
const BALL_REACH: number = 14;

/** Share of a web's lower end drawn to the pad. */
const BALL_WEB: number = 0.55;

/** Radius ahead of a web over which that fades, mm. */
const BALL_AHEAD: number = 12;

/** Half width of the skin the ball holds behind a web, mm. */
const BALL_WIDTH: number = 9;

/** Height over the pad under which skin belongs to the ball, mm. */
const BALL_LOW: number = 4;

/** Height past that over which skin leaves the ball, mm. */
const BALL_EASE: number = 10;

/** Height of plantar skin the pad is fitted through, mm. */
const BALL_FLAT: number = 1.5;

/** Station span and step of the skin the pad is fitted through, mm. */
const BALL_SPAN: number = 90;
const BALL_SKIP: number = 6;

/** Length that scales the pad's terms, mm. */
const BALL_UNIT: number = 100;

/** The ball, read once. */
let BALL: { webs: [number, number][]; height: (forward: number, across: number) => number } | null = null;

/** Samples of a child's ring a parent reads. */
const ADOPTED_RING: number = 720;

/** Distance from a child's ring within which a parent's point is the same skin, mm. */
const ADOPTED_NEAR: number = 1;

/** Distance past that over which a point stops being the same skin, mm. */
const ADOPTED_FADE: number = 1;

/** Layers of a toe's cap. */
const CAP_LAYERS: number = 6;

/** A whole turn. */
const TWO_PI: number = 2 * Math.PI;

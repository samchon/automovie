import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanNaturalSpline } from "../lofting/AutoMovieHumanNaturalSpline";
import { AutoMovieHumanPolarSection } from "../lofting/AutoMovieHumanPolarSection";
import { AutoMovieHumanSplineCurve } from "../lofting/AutoMovieHumanSplineCurve";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanLegPrior } from "./AutoMovieHumanLegPrior";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Both legs generated from the ankle ring, the crotch ring, the calf, knee,
 * thigh and hip tapes and the masculine-feminine control, by one construction
 * in the left leg's frame and a reflection.
 *
 * The foot places the ankle ring and the trunk places the crotch ring; the
 * leg starts on one and ends on the other, and the event join settles the
 * shared rings afterwards. Between them a section at leg fraction u, 0 at the ankle and
 * 1 at the crotch, is `C(u) + R(u) rho(u, theta)` in its horizontal plane:
 *
 * - `rho` is the prior's area-normalized radial shape.
 * - `R` is the prior's log-radius profile, in leg lengths, shifted through
 *   the ankle ring's radius, the calf, knee and thigh tapes and the crotch
 *   ring's radius. A tape's radius is solved against the hull of the prior
 *   section it wraps, because that hull, not a circle, is what the tape
 *   measures.
 * - `C` is the leg's axis, the same curve for every person: forward it
 *   follows the ankle by the prior's forward curve in leg lengths, and
 *   laterally it stands off the midline by a line in the leg's length, the
 *   hip tape and the masculine-feminine control at every fraction, so that
 *   wider hips spread the legs and a feminine figure brings the knees in.
 *   The stance is that line's value at the ankle.
 *   The trunk places the crotch ring, so the thigh leans onto that place.
 * - The inner edges of the two thighs meet at the midline and do not pass
 *   it, by a smooth maximum against the midline, since no later rule may
 *   repair a generated section.
 *
 * The prior's shape at an end differs from the neighbour's ring, so that
 * difference fades into the leg from each end instead of creasing it.
 *
 * Reflection reverses polar phase: the right leg's radius at phase t is the
 * canonical radius at -t, with its centre's lateral coordinate negated. The
 * ankle and crotch keys are read in the canonical frame through the same
 * reflection, so both legs come from one family.
 */
export namespace AutoMovieHumanLegConstruction {
  /** Tape measures a leg reads, in the same millimetres as the calibration. */
  export interface IInputs {
    /** Calf tape. */
    calf: number;

    /** Knee tape. */
    knee: number;

    /** Thigh tape. */
    thigh: number;

    /** Hip tape, which spreads the legs. */
    hip: number;

    /** Masculine-feminine control, which brings the knees in as it rises. */
    sex: number;

    /** Fat control. */
    fat: number;

    /** Muscularity control. */
    muscularity: number;

    /** Calibration millimetres per world millimetre. */
    scale: number;
  }

  /**
   * Calibration whose legs are generated from its own foot and trunk.
   *
   * @param calibration Calibration holding `trunk`, `foot.*` and leg chains,
   *   whose rows are replaced; not modified.
   * @param inputs Tape measures in calibration millimetres.
   */
  export function apply(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
  ): IAutoMovieHumanBodyCalibration {
    return {
      ...calibration,
      chains: calibration.chains.map(
        (c: IAutoMovieHumanLoftChain): IAutoMovieHumanLoftChain =>
          c.name === "leg.left"
            ? generate(calibration, "left", inputs)
            : c.name === "leg.right"
              ? generate(calibration, "right", inputs)
              : c,
      ),
    };
  }

  /**
   * Calibration with the feet moved rigidly under the stance.
   *
   * @param calibration Calibration holding the foot family and trunk; not
   *   modified.
   * @param inputs Tape measures in calibration millimetres.
   */
  export function stand(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
  ): IAutoMovieHumanBodyCalibration {
    const axis: AutoMovieHumanNaturalSpline.ISpline[] = axisCurves();
    const moves: Map<"left" | "right", [number, number]> = new Map(
      (["left", "right"] as const).map(
        (side: "left" | "right"): ["left" | "right", [number, number]] => {
          const sign: 1 | -1 = side === "left" ? 1 : -1;
          const ankle: [number, number, number][] = ankleRing(calibration, side);
          const at: [number, number] = AutoMovieHumanPolarSection.measure(
            ankle.map((p: [number, number, number]): [number, number] => [p[0], p[2]]),
          ).centre;
          const length: number =
            level(crotchRing(calibration, side)) - level(ankle);
          return [
            side,
            [
              forward(inputs) - at[0],
              sign * lateral(axis, 0, length, inputs) - at[1],
            ],
          ];
        },
      ),
    );
    const owner = (name: string): "left" | "right" | null =>
      !/^(foot|forefoot|toe)\./.test(name)
        ? null
        : name.includes("left")
          ? "left"
          : "right";
    const shift = (
      p: readonly [number, number, number],
      d: readonly [number, number],
    ): [number, number, number] => [p[0] + d[0], p[1], p[2] + d[1]];
    return {
      ...calibration,
      chains: calibration.chains.map(
        (c: IAutoMovieHumanLoftChain): IAutoMovieHumanLoftChain => {
          const side: "left" | "right" | null = owner(c.name);
          if (side === null) return c;
          const d: [number, number] = moves.get(side)!;
          return {
            ...c,
            ...(c.pole === undefined
              ? {}
              : { pole: { ...c.pole, point: shift(c.pole.point, d) } }),
            layers: c.layers.map(
              (
                l: IAutoMovieHumanLoftChain.ILayer,
              ): IAutoMovieHumanLoftChain.ILayer =>
                l.frame === undefined
                  ? l
                  : { ...l, frame: { ...l.frame, origin: shift(l.frame.origin, d) } },
            ),
          };
        },
      ),
      poles: calibration.poles.map(
        (
          p: IAutoMovieHumanBodyCalibration.IPole,
        ): IAutoMovieHumanBodyCalibration.IPole => {
          const side: "left" | "right" | null = owner(p.chain);
          return side === null
            ? p
            : { ...p, point: shift(p.point, moves.get(side)!) };
        },
      ),
    };
  }

  /** Calibration with both legs added, for a region merge that holds none. */
  export function add(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
  ): IAutoMovieHumanBodyCalibration {
    return {
      ...calibration,
      chains: [
        ...calibration.chains,
        generate(calibration, "right", inputs),
        generate(calibration, "left", inputs),
      ],
    };
  }

  /** One leg's chain. */
  function generate(
    calibration: IAutoMovieHumanBodyCalibration,
    side: "left" | "right",
    inputs: IInputs,
  ): IAutoMovieHumanLoftChain {
    const sign: 1 | -1 = side === "left" ? 1 : -1;
    const family: IFamily = prepare(calibration, side, sign, inputs);
    const stations: number[] = LAYERS.map(
      (u: number): number => family.bottom + u * family.length,
    );
    const interior: number = stations.length - 1;
    const layers: IAutoMovieHumanLoftChain.ILayer[] = stations
      .slice(0, interior)
      .map((y: number, k: number): IAutoMovieHumanLoftChain.ILayer => {
        const u: number = LAYERS[k]!;
        const a: number[] = coefficients(family, u, sign);
        const lo: number[] = coefficients(family, Math.max(0, u - STEP), sign);
        const hi: number[] = coefficients(family, u + STEP, sign);
        const h: number = (u + STEP - Math.max(0, u - STEP)) * family.length;
        const slopes: number[] = a.map(
          (_: number, i: number): number => (hi[i]! - lo[i]!) / h,
        );

        // The ankle layer is the foot's ring, so it also carries the height
        // the ring keeps off its plane.
        return k === 0
          ? { y, coefficients: a, slopes, ...lifted(family.ankleLift) }
          : { y, coefficients: a, slopes };
      });

    // The crotch layer is the trunk's ring, reached across the last interval
    // that closes the gap between the thighs.
    const last: IAutoMovieHumanLoftChain.ILayer = layers[layers.length - 1]!;
    const top: number[] = project(family.crotch, sign, family.crotchCentre);
    const reach: number = stations[interior]! - last.y;

    // The ring's pinches are corners, which a leg has no use for: the interval
    // reaches the ring's plain form, and the corners come in over its last half.
    const plain: number[] = process.env.HIP_X === "raw" ? [...top] : softened(top);

    // The last interior layer sees the ring above it, or the last interval
    // starts with a corner.
    const lower: IAutoMovieHumanLoftChain.ILayer = layers[layers.length - 2]!;
    const below: number = last.y - lower.y;
    last.slopes = last.coefficients.map(
      (v: number, i: number): number =>
        (((plain[i]! - v) / reach) * below + ((v - lower.coefficients[i]!) / below) * reach) /
        (below + reach),
    );
    const end: number[] = plain.map(
      (v: number, i: number): number => (v - last.coefficients[i]!) / reach,
    );
    const ring: IAutoMovieHumanLoftChain.ILayer = {
      y: stations[interior]!,
      coefficients: top,
      slopes: end.map(
        (v: number, i: number): number =>
          v + (2 * (top[i]! - plain[i]!)) / reach,
      ),
      ...lifted(family.crotchLift),
    };

    // A layer at the middle halves the span an end slope acts over, so where
    // the gluteal fold lies close under the ring the turn stays beside it, and
    // the join may take all of it instead of leaving a corner on the ring.
    const middle: IAutoMovieHumanLoftChain.ILayer = inside(
      last,
      { ...ring, coefficients: plain, slopes: end },
      last.y + reach / 2,
    );
    layers.push(middle);

    // Layers beside the ring change no skin. The surface's rows follow the
    // layers, and the ring's normals blend with their mesh neighbours, so rows
    // far apart on one side drag the blend across the ring as a line.
    for (const away of RING_ROWS)
      if (away < reach / 2)
        layers.push(inside(middle, ring, ring.y - away));
    layers.push(ring);
    return {
      name: `leg.${side}`,
      basis: "spline",
      order: ORDER,
      rule: "polar",
      samples: SAMPLES,
      layers,
    };
  }

  /** The layer at station y on the Hermite span between two layers. */
  function inside(
    a: IAutoMovieHumanLoftChain.ILayer,
    b: IAutoMovieHumanLoftChain.ILayer,
    y: number,
  ): IAutoMovieHumanLoftChain.ILayer {
    const h: number = b.y - a.y;
    const u: number = (y - a.y) / h;
    const value = (
      p: readonly number[],
      m: readonly number[],
      q: readonly number[],
      n: readonly number[],
    ): number[] =>
      p.map(
        (v: number, i: number): number =>
          (2 * u ** 3 - 3 * u ** 2 + 1) * v +
          (u ** 3 - 2 * u ** 2 + u) * h * m[i]! +
          (3 * u ** 2 - 2 * u ** 3) * q[i]! +
          (u ** 3 - u ** 2) * h * n[i]!,
      );
    const rate = (
      p: readonly number[],
      m: readonly number[],
      q: readonly number[],
      n: readonly number[],
    ): number[] =>
      p.map(
        (v: number, i: number): number =>
          ((6 * u ** 2 - 6 * u) * (v - q[i]!)) / h +
          (3 * u ** 2 - 4 * u + 1) * m[i]! +
          (3 * u ** 2 - 2 * u) * n[i]!,
      );
    const none: number[] = new Array<number>(ORDER).fill(0);
    const al: readonly number[] = a.lift ?? none;
    const am: readonly number[] = a.liftSlopes ?? none;
    const bl: readonly number[] = b.lift ?? none;
    const bm: readonly number[] = b.liftSlopes ?? none;
    return {
      y,
      coefficients: value(a.coefficients, a.slopes, b.coefficients, b.slopes),
      slopes: rate(a.coefficients, a.slopes, b.coefficients, b.slopes),
      lift: value(al, am, bl, bm),
      liftSlopes: rate(al, am, bl, bm),
    };
  }

  /** Control points with what is narrower than {@link SOFTEN} controls taken out. */
  function softened(controls: readonly number[]): number[] {
    const reach: number = 3 * SOFTEN;
    const weights: number[] = Array.from(
      { length: 2 * reach + 1 },
      (_: unknown, k: number): number =>
        Math.exp(-(((k - reach) / SOFTEN) ** 2) / 2),
    );
    const total: number = weights.reduce(
      (s: number, w: number): number => s + w,
      0,
    );
    return controls.map((_: number, i: number): number => {
      const block: number = i < ORDER ? 0 : ORDER;
      const at: number = i - block;
      return (
        weights.reduce(
          (s: number, w: number, k: number): number =>
            s + w * controls[block + ((at + k - reach + ORDER) % ORDER)]!,
          0,
        ) / total
      );
    });
  }

  /** Lift of an end layer, flat along the leg. */
  function lifted(lift: number[]): {
    lift: number[];
    liftSlopes: number[];
  } {
    return {
      lift,
      liftSlopes: new Array<number>(ORDER).fill(0),
    };
  }

  /** The fitted law's channels with one person's keys. */
  interface IFamily {
    bottom: number;
    length: number;
    ankle: [number, number];
    ankleLift: number[];
    crotch: [number, number][];
    crotchOffset: [number, number];
    crotchCentre: [number, number];
    crotchLift: number[];
    inputs: IInputs;
    profile: AutoMovieHumanNaturalSpline.ISpline;
    forward: AutoMovieHumanNaturalSpline.ISpline;
    axis: AutoMovieHumanNaturalSpline.ISpline[];
    shape: AutoMovieHumanNaturalSpline.ISpline[];
    correction: AutoMovieHumanNaturalSpline.ISpline;
    ankleResidual: number[];
  }

  /** Read the neighbours' keys and solve this person's radius correction. */
  function prepare(
    calibration: IAutoMovieHumanBodyCalibration,
    side: "left" | "right",
    sign: 1 | -1,
    inputs: IInputs,
  ): IFamily {
    const prior: AutoMovieHumanLegPrior.IPrior = AutoMovieHumanLegPrior.PRIOR;

    // Keys in the canonical frame.
    const ankleWorld: [number, number, number][] = ankleRing(calibration, side);
    const crotchWorld: [number, number, number][] = crotchRing(calibration, side);
    const planar = (
      ring: [number, number, number][],
    ): [number, number][] =>
      ring.map(
        (p: [number, number, number]): [number, number] => [p[0], sign * p[2]],
      );
    const ankle: [number, number][] = planar(ankleWorld);
    const crotch: [number, number][] = planar(crotchWorld);
    const ankleSection: AutoMovieHumanPolarSection.ISection =
      AutoMovieHumanPolarSection.measure(ankle);
    const crotchSection: AutoMovieHumanPolarSection.ISection =
      AutoMovieHumanPolarSection.measure(crotch);
    const bottom: number = level(ankleWorld);
    const length: number = level(crotchWorld) - bottom;
    if (
      !(length > 0) ||
      !(inputs.calf > 0) ||
      !(inputs.knee > 0) ||
      !(inputs.thigh > 0)
    )
      throw new Error("A leg needs a positive length and positive tapes");

    // The prior's channels.
    const spline = (values: readonly number[]): AutoMovieHumanNaturalSpline.ISpline =>
      AutoMovieHumanNaturalSpline.create(prior.stations, values);
    const shape: AutoMovieHumanNaturalSpline.ISpline[] = prior.shape[0]!.map(
      (_: number, k: number): AutoMovieHumanNaturalSpline.ISpline =>
        spline(prior.shape.map((row: readonly number[]): number => row[k]!)),
    );
    const profile: AutoMovieHumanNaturalSpline.ISpline = spline(prior.profile);

    // Radius keys: the ankle ring's own radius, then each tape against the
    // hull of the section it wraps.
    const key = (u: number, girth: number, ratio: number): [number, number] => {
      const hull: number = AutoMovieHumanPolarSection.girth(unit(shape, u));
      return [
        u,
        Math.log((girth * ratio) / hull / length) -
          AutoMovieHumanNaturalSpline.evaluate(profile, u),
      ];
    };
    // Above its tape the thigh keeps the tape's correction on the prior's own
    // flare: the crotch ring is the skin's way into the trunk, not a section of
    // the thigh, and only the last interval reaches it.
    const thigh: [number, number] = key(
      prior.thigh.station,
      inputs.thigh,
      prior.thigh.ratio,
    );
    const keys: [number, number][] = [
      [
        0,
        Math.log(ankleSection.radius / length) -
          AutoMovieHumanNaturalSpline.evaluate(profile, 0),
      ],
      key(prior.calf.station, inputs.calf, prior.calf.ratio),
      key(prior.knee.station, inputs.knee, prior.knee.ratio),
      thigh,
      [LAST_INTERIOR, thigh[1]],
    ];
    const family: IFamily = {
      bottom,
      length,
      ankle: ankleSection.centre,
      ankleLift: liftOf(ankle, ankleSection.centre, ankleWorld, bottom, sign),
      crotch,
      crotchOffset: [0, 0],
      crotchCentre: crotchSection.centre,
      crotchLift: liftOf(crotch, crotchSection.centre, crotchWorld, bottom + length, sign),
      inputs,
      profile,
      forward: spline(prior.forward),
      axis: axisCurves(),
      shape,
      correction: AutoMovieHumanNaturalSpline.create(
        keys.map((k: [number, number]): number => k[0]),
        keys.map((k: [number, number]): number => k[1]),
      ),
      ankleResidual: [],
    };


    // The trunk owns the crotch ring's place, so the thigh leans onto it over
    // the same kind of reach.
    const reached: IBare = bare(family, LAST_INTERIOR);
    family.crotchOffset = [
      crotchSection.centre[0] + prior.ring.forward * length - reached.centre[0],
      crotchSection.centre[1] + prior.ring.lateral * length - reached.centre[1],
    ];

    // End residuals against the bare law.
    const start: IBare = bare(family, 0);
    family.ankleResidual = PHASES.map(
      (t: number, j: number): number =>
        AutoMovieHumanPolarSection.radius(ankle, start.centre, t) -
        start.radii[j]!,
    );
    const end: IBare = bare(family, LAST_INTERIOR);

    // The crotch ring is read about the law's own last centre: read about its
    // own, a phase would slide round the outline over the last interval.
    family.crotchCentre = end.centre;
    family.crotchLift = liftOf(crotch, end.centre, crotchWorld, bottom + length, sign);
    return family;
  }

  /** The foot's top ring. */
  function ankleRing(
    calibration: IAutoMovieHumanBodyCalibration,
    side: "left" | "right",
  ): [number, number, number][] {
    const foot: IAutoMovieHumanLoftChain = calibration.chains.find(
      (c: IAutoMovieHumanLoftChain): boolean => c.name === `foot.${side}`,
    )!;
    return AutoMovieHumanLoftChain.ring(
      foot,
      foot.layers[foot.layers.length - 1]!.y,
      PHASES,
    );
  }

  /** The arc of the trunk's bottom ring that a leg takes. */
  function crotchRing(
    calibration: IAutoMovieHumanBodyCalibration,
    side: "left" | "right",
  ): [number, number, number][] {
    const trunk: IAutoMovieHumanLoftChain = calibration.chains.find(
      (c: IAutoMovieHumanLoftChain): boolean => c.name === "trunk",
    )!;
    const event: IAutoMovieHumanBodyCalibration.IEvent =
      calibration.events.find(
        (e: IAutoMovieHumanBodyCalibration.IEvent): boolean =>
          e.parent === "trunk" && e.direction === "down",
      )!;
    return event.splits
      .find(
        (s: IAutoMovieHumanBodyCalibration.ISplit): boolean =>
          s.child === `leg.${side}`,
      )!
      .arcs.flatMap(
        ([from, to]: [number, number]): [number, number, number][] => {
          const span: number = to >= from ? to - from : to + 2 * Math.PI - from;
          return AutoMovieHumanLoftChain.ring(
            trunk,
            trunk.layers[0]!.y,
            Array.from(
              { length: RING },
              (_: unknown, i: number): number =>
                from + (span * i) / (RING - 1),
            ),
          );
        },
      );
  }

  /** Mean height of a ring. */
  function level(ring: [number, number, number][]): number {
    return (
      ring.reduce(
        (s: number, p: [number, number, number]): number => s + p[1],
        0,
      ) / ring.length
    );
  }

  /** The ankle centre ahead of the origin, calibration mm. */
  function forward(inputs: IInputs): number {
    const line: AutoMovieHumanLegPrior.IAnkle =
      AutoMovieHumanLegPrior.PRIOR.ankle;
    return (
      (line.offset +
        line.fat * inputs.fat +
        line.muscularity * inputs.muscularity) *
      inputs.scale
    );
  }

  /** The axis's lateral curves, one per term of the prior's line. */
  function axisCurves(): AutoMovieHumanNaturalSpline.ISpline[] {
    const prior: AutoMovieHumanLegPrior.IPrior = AutoMovieHumanLegPrior.PRIOR;
    return [
      prior.lateral.offset,
      prior.lateral.leg,
      prior.lateral.hip,
      prior.lateral.sex,
    ].map(
      (values: readonly number[]): AutoMovieHumanNaturalSpline.ISpline =>
        AutoMovieHumanNaturalSpline.create(prior.stations, values),
    );
  }

  /** The axis's place off the midline at fraction u, calibration mm. */
  function lateral(
    axis: AutoMovieHumanNaturalSpline.ISpline[],
    u: number,
    length: number,
    inputs: IInputs,
  ): number {
    const value = (i: number): number =>
      AutoMovieHumanNaturalSpline.evaluate(axis[i]!, u);
    return (
      value(0) * inputs.scale +
      value(1) * length +
      value(2) * inputs.hip +
      value(3) * inputs.sex * inputs.scale
    );
  }

  /** A ring's height off its plane as lift control values. */
  function liftOf(
    ring: readonly [number, number][],
    centre: readonly [number, number],
    world: readonly [number, number, number][],
    level: number,
    sign: 1 | -1,
  ): number[] {
    // The height at a phase is read off the ring's nearest edge, the closing
    // chord on the midline included, so it runs between the pinches.
    return Array.from({ length: ORDER }, (_: unknown, j: number): number => {
      const t: number = (2 * Math.PI * j) / ORDER;
      const a: number = sign * t;
      const r: number = AutoMovieHumanPolarSection.radius(ring, centre, a);
      const x: number = centre[0] + r * Math.cos(a);
      const z: number = centre[1] + r * Math.sin(a);
      let best: number = Infinity;
      let height: number = level;
      ring.forEach((p: readonly [number, number], i: number): void => {
        const k: number = (i + 1) % ring.length;
        const q: readonly [number, number] = ring[k]!;
        const ex: number = q[0] - p[0];
        const ez: number = q[1] - p[1];
        const f: number = Math.min(
          1,
          Math.max(
            0,
            ((x - p[0]) * ex + (z - p[1]) * ez) / (ex * ex + ez * ez || 1),
          ),
        );
        const d: number =
          (p[0] + f * ex - x) ** 2 + (p[1] + f * ez - z) ** 2;
        if (d < best) {
          best = d;
          height = world[i]![1] + f * (world[k]![1] - world[i]![1]);
        }
      });
      return height - level;
    });
  }

  /** Radii of the area-normalized prior shape at uniform phases. */
  function unit(
    shape: AutoMovieHumanNaturalSpline.ISpline[],
    u: number,
  ): number[] {
    const f: number[] = shape.map(
      (s: AutoMovieHumanNaturalSpline.ISpline): number =>
        AutoMovieHumanNaturalSpline.evaluate(s, u),
    );
    const raw: number[] = PHASES.map((t: number): number => {
      let v: number = f[0]!;
      for (let k: number = 1; 2 * k < f.length; k++)
        v += f[2 * k - 1]! * Math.cos(k * t) + f[2 * k]! * Math.sin(k * t);
      return v;
    });
    const area: number =
      raw.reduce((s: number, v: number): number => s + v * v, 0) *
      (Math.PI / raw.length);
    const k: number = Math.sqrt(Math.PI / area);
    return raw.map((v: number): number => v * k);
  }

  /** Section of the law before any end residual. */
  interface IBare {
    centre: [number, number];
    radii: number[];
  }

  /** The law's centre and radii at fraction u, canonical frame. */
  function bare(family: IFamily, u: number): IBare {
    const value = (s: AutoMovieHumanNaturalSpline.ISpline): number =>
      AutoMovieHumanNaturalSpline.evaluate(s, u);
    const L: number = family.length;
    const radii: number[] = unit(family.shape, u);
    const R: number =
      L * Math.exp(value(family.profile) + value(family.correction));
    const inner: number = R * radii[(3 * RING_PHASES) / 4]!;
    const lean: number = smooth(
      (u - THIGH_FROM) / (LAST_INTERIOR - THIGH_FROM),
    );
    const axis: number =
      lateral(family.axis, u, L, family.inputs) + family.crotchOffset[1] * lean;

    // The inner edge meets the midline and stays on its own side.
    const edge: number = axis - inner;
    const contact: number =
      Math.max(edge, 0) +
      CONTACT * Math.log1p(Math.exp(-Math.abs(edge) / CONTACT));
    return {
      centre: [
        family.ankle[0] + L * value(family.forward) + family.crotchOffset[0] * lean,
        contact + inner,
      ],
      radii: radii.map((v: number): number => R * v),
    };
  }

  /** Control points of the section at fraction u, in the side's own frame. */
  function coefficients(family: IFamily, u: number, sign: 1 | -1): number[] {
    const b: IBare = bare(family, u);
    const low: number = 1 - smooth(u / ANKLE_REACH);
    const samples: [number, number][] = [];
    for (let m: number = 0; m < ORDER; m++) {
      const t: number = (2 * Math.PI * m) / ORDER;

      // A side's phase t reads the canonical function at sign * t.
      const a: number = sign * t;
      const r: number =
        periodic(b.radii, a) + low * periodic(family.ankleResidual, a);
      samples.push([
        b.centre[0] + r * Math.cos(t),
        sign * b.centre[1] + r * Math.sin(t),
      ]);
    }
    return AutoMovieHumanSplineCurve.interpolate(samples);
  }

  /** Control points of a ring keyed in the canonical frame. */
  function project(
    ring: readonly [number, number][],
    sign: 1 | -1,
    centre: readonly [number, number],
  ): number[] {
    const samples: [number, number][] = [];
    for (let m: number = 0; m < ORDER; m++) {
      const t: number = (2 * Math.PI * m) / ORDER;
      const r: number = AutoMovieHumanPolarSection.radius(ring, centre, sign * t);
      samples.push([
        centre[0] + r * Math.cos(t),
        sign * centre[1] + r * Math.sin(t),
      ]);
    }
    return AutoMovieHumanSplineCurve.interpolate(samples);
  }


  /** Linear reading of a uniform periodic table at an angle. */
  function periodic(values: readonly number[], angle: number): number {
    const n: number = values.length;
    const x: number = (((angle / (2 * Math.PI)) % 1) + 1) % 1;
    const i: number = Math.floor(x * n) % n;
    const f: number = x * n - Math.floor(x * n);
    return values[i]! * (1 - f) + values[(i + 1) % n]! * f;
  }
}

/** Smoothstep clamped to [0, 1]. */
function smooth(x: number): number {
  const t: number = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

/** Control points of a leg section, as the rows carried. */
const ORDER: number = 256;

/** Uniform phases of a leg ring. */
const SAMPLES: number = 256;


/** Phases of the radial tables. */
const RING_PHASES: number = 256;

/** Samples of a neighbour's ring arc. */
const RING: number = 512;

/** Uniform phases of the radial tables, radians. */
const PHASES: number[] = Array.from(
  { length: RING_PHASES },
  (_: unknown, j: number): number => (2 * Math.PI * j) / RING_PHASES,
);

/** Spread of what the ring's plain form keeps, in control points. */
const SOFTEN: number = 3;

/** Distances under the ring of the rows beside it, mm. */
const RING_ROWS: number[] = [14, 7, 3.4];

/** Fraction step of the station differences. */
const STEP: number = 0.001;

/**
 * Last fraction the law holds; the final interval rises under the buttock and
 * closes the crotch, a rise of some 60 mm on a body of average height.
 */
const LAST_INTERIOR: number = 0.92;

/** Softness of the thighs' contact at the midline, mm. */
const CONTACT: number = 1.5;

/** Fraction over which the ankle ring's difference from the law fades. */
const ANKLE_REACH: number = 0.12;

/** Fraction where the thigh starts to lean onto the crotch ring's place. */
const THIGH_FROM: number = 0.6;

/** Layer fractions: more sections than the rows carried, then the crotch. */
const LAYERS: number[] = [
  ...Array.from(
    { length: 29 },
    (_: unknown, i: number): number => (i / 28) * LAST_INTERIOR,
  ),
  1,
];

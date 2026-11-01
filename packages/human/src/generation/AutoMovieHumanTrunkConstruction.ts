import { AutoMovieHumanHorizontalChain } from "../lofting/AutoMovieHumanHorizontalChain";
import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanNaturalSpline } from "../lofting/AutoMovieHumanNaturalSpline";

import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanTrunkPrior } from "./AutoMovieHumanTrunkPrior";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * The trunk and shoulders generated as one column from the crotch to the neck.
 *
 * A column stands on the midline. At a height its section is one closed form,
 * mirror-symmetric across the midline: a super-ellipse from its widest point
 * forward to the front and backward to the back, with its depth pulled in
 * toward the midline by a groove of its own width on either side. The groove
 * is what parts the breasts, the buttocks and the thighs, closing to a pinch
 * at the crotch; at the bust it deepens with the chest over the underbust.
 * The navel is a pit of its own on the belly's midline.
 *
 * Every measure of the section runs up the column as a natural spline through
 * a local linear regression, so one height leads into the next whatever the
 * tapes do. Width, front and back follow the hip, high hip, waist, underbust
 * and chest tapes each at its own measured rate: a slim waist narrows far more
 * than it flattens. A height between two tapes reads both by its place between
 * them.
 *
 * The ends belong to the neighbours. The crotch's height comes from the leg
 * law, and the column leans over its top to stand under the neck. Across the
 * shoulders an ellipse, the arm's root, joins the column's section: the ring
 * runs down the torso to where the ellipse leaves it, round the outside of the
 * arm and back to the torso, so that the arm and the trunk share one seam. The
 * ellipse keeps its outer edge where the shoulder puts it and always runs back
 * into the torso. Above the armpit the valleys beside it fill in, until the
 * ring is convex across the shoulder.
 */
export namespace AutoMovieHumanTrunkConstruction {
  /** What a trunk reads, in the same millimetres as the calibration. */
  export interface IInputs {
    /** Hip tape. */
    hip: number;

    /** High hip tape. */
    highHip: number;

    /** Waist tape. */
    waist: number;

    /** Underbust tape. */
    underbust: number;

    /** Chest tape. */
    chest: number;

    /** Bust span. */
    bustSpan: number;

    /** Neck base tape. */
    neckBase: number;

    /** Across-shoulder input. */
    acrossShoulder: number;

    /** Biceps tape. */
    bicep: number;

    /** Masculine-feminine control. */
    sex: number;

    /** Calibration millimetres per world millimetre. */
    scale: number;
  }

  /**
   * Calibration with the trunk's rows replaced, or added when it holds none.
   *
   * @param calibration Calibration holding the neck.
   * @param inputs Tapes in calibration millimetres.
   * @param floor Height of the crotch in calibration millimetres.
   */
  export function apply(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
    floor: number,
  ): IAutoMovieHumanBodyCalibration {
    const made: IAutoMovieHumanLoftChain[] = generate(calibration, inputs, floor);
    const others: IAutoMovieHumanLoftChain[] = calibration.chains.filter(
      (c: IAutoMovieHumanLoftChain): boolean =>
        c.name !== "trunk" && c.name !== "upper",
    );

    // The column is mirror-symmetric, so the legs part exactly on the midline.
    return {
      ...calibration,
      chains: [...made, ...others],
      events: calibration.events.map(
        (
          e: IAutoMovieHumanBodyCalibration.IEvent,
        ): IAutoMovieHumanBodyCalibration.IEvent =>
          e.parent === "trunk" && e.direction === "down"
            ? {
                ...e,
                splits: [
                  { child: "leg.right", arcs: [[Math.PI, 2 * Math.PI]] },
                  { child: "leg.left", arcs: [[0, Math.PI]] },
                ],
              }
            : e,
      ),
    };
  }

  /** One height's measures. */
  interface ISection {
    /** Half width. */
    width: number;

    /** Forward place of the widest point. */
    middle: number;

    /** Forward-most place. */
    front: number;

    /** Rearmost place. */
    back: number;

    /** Super-ellipse power. */
    power: number;

    /** Midline pull at the front, a share of the depth. */
    frontPull: number;

    /** Half width of the front groove. */
    frontGroove: number;

    /** Midline pull at the back, a share of the depth. */
    backPull: number;

    /** Half width of the back groove. */
    backGroove: number;

    /** Depth of the navel's pit at this height. */
    pit: number;

    /** Half width of the navel's pit. */
    pitWidth: number;

    /** The breast's rise at this height. */
    bust: number;

    /** The breast's place off the midline. */
    bustPlace: number;

    /** The breast's half width. */
    bustWidth: number;
  }

  /** The chain. */
  function generate(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
    floor: number,
  ): IAutoMovieHumanLoftChain[] {
    const prior: AutoMovieHumanTrunkPrior.IPrior = AutoMovieHumanTrunkPrior.PRIOR;
    const tapes: number[] = [
      inputs.hip,
      inputs.highHip,
      inputs.waist,
      inputs.underbust,
      inputs.chest,
      inputs.neckBase,
    ];
    for (const tape of tapes)
      if (!(tape > 0)) throw new Error("A trunk needs positive tapes");
    const logs: number[] = tapes.map((v: number): number =>
      Math.log(v / inputs.scale),
    );
    const tape = (share: readonly number[]): number =>
      share.reduce(
        (s: number, w: number, i: number): number => s + w * logs[i]!,
        0,
      );
    const curve = (values: readonly number[]): AutoMovieHumanNaturalSpline.ISpline =>
      AutoMovieHumanNaturalSpline.create(prior.stations, values);
    const size = (measure: AutoMovieHumanTrunkPrior.ISize): number[] =>
      measure.level.map((v: number, k: number): number =>
        Math.exp(
          v +
            measure.sex[k]! * inputs.sex +
            measure.gain[k]! * tape(prior.shares[k]!),
        ),
      );
    const fairly = (values: readonly number[]): number[] =>
      fair(prior.stations, values);

    // Above the crotch every measure runs fairly up the column; at the crotch
    // the pulls close to a pinch over a few layers, which must stay sharp.
    const above = (values: readonly number[]): number[] => {
      const faired: number[] = fairly(values);
      return values.map((v: number, k: number): number => {
        const w: number = smooth(
          (prior.stations[k]! - FAIR_FROM) / FAIR_RUN,
        );
        return v + w * (faired[k]! - v);
      });
    };

    // The front and back are carried as places, not as depths from the widest
    // point: that point wanders with what a ring's sides happen to do, and a
    // depth smoothed apart from it would print the wander on the skin.
    const width = curve(fairly(size(prior.width).map(Math.log)));
    const front = curve(
      fairly(
        size(prior.front).map(
          (v: number, k: number): number => prior.middle[k]! + v,
        ),
      ),
    );
    const back = curve(
      fairly(
        size(prior.back).map(
          (v: number, k: number): number => prior.middle[k]! - v,
        ),
      ),
    );
    const middle = curve(fair(prior.stations, prior.middle, MIDDLE_REACH));
    const power = curve(fairly(prior.power));
    const frontPull = curve(
      above(
        prior.frontPull.level.map(
          (v: number, k: number): number =>
            v +
            prior.frontPull.sex[k]! * inputs.sex +
            prior.frontPull.bust[k]! *
              Math.log(inputs.chest / inputs.underbust),
        ),
      ),
    );
    const backPull = curve(above(prior.backPull));
    const frontGroove = curve(above(prior.frontGroove));
    const backGroove = curve(above(prior.backGroove));
    const read = (s: AutoMovieHumanNaturalSpline.ISpline, u: number): number =>
      AutoMovieHumanNaturalSpline.evaluate(s, u);
    const b: AutoMovieHumanTrunkPrior.IBust = prior.bust;
    const excess: number =
      ((b.rise + b.sex * inputs.sex) * (inputs.chest - inputs.underbust)) /
      (2 * Math.PI);
    const soft: number = b.soft * inputs.scale;
    const bust: number = soft * Math.log1p(Math.exp(excess / soft));
    const section = (u: number): ISection => {
      const m: number = read(middle, u) * inputs.scale;
      return {
        width: Math.exp(read(width, u)) * inputs.scale,
        middle: m,
        front: Math.max(m + 1, read(front, u) * inputs.scale),
        back: Math.min(m - 1, read(back, u) * inputs.scale),
        power: read(power, u),
        frontPull: Math.max(0, read(frontPull, u)),
        frontGroove: Math.max(1, read(frontGroove, u)) * inputs.scale,
        backPull: Math.max(0, read(backPull, u)),
        backGroove: Math.max(1, read(backGroove, u)) * inputs.scale,
        pit:
          prior.navel.depth *
          inputs.scale *
          Math.exp(-(((u - prior.navel.station) / prior.navel.height) ** 2)),
        pitWidth: prior.navel.width * inputs.scale,
        bust: bust * Math.exp(-(((u - b.station) / b.height) ** 2)),
        bustPlace: b.place * inputs.bustSpan,
        bustWidth: b.width * inputs.bustSpan,
      };
    };

    const seat: INeck = neckRing(calibration, prior.shoulderOrder);
    const top: number = prior.layers.length - 1;
    const roofSection: ISection = section(1);
    const lift: number = seat.x - (roofSection.front + roofSection.back) / 2;
    const place = (u: number): number => lift * smooth((u - LEAN) / (1 - LEAN));
    const height = (u: number): number => floor + u * (seat.y - floor);
    const column = (u: number): [number, number, number][] => {
      const half: [number, number][] = outline(section(u));
      const d: number = place(u);
      return steady(half, prior.order).map(
        (p: [number, number]): [number, number, number] => [
          p[0] + d,
          height(u),
          p[1],
        ],
      );
    };
    const trunk: IAutoMovieHumanLoftChain = AutoMovieHumanHorizontalChain.build(
      {
        name: "trunk",
        order: prior.order,
        samples: prior.samples,
        rule: prior.rule,
      },
      prior.layers.slice(0, prior.joint + 1).map(column),
      column(prior.layers[prior.joint + JOINT_REACH]!),
    );
    const shoulders: IAutoMovieHumanLoftChain =
      AutoMovieHumanHorizontalChain.build(
        {
          name: "upper",
          order: prior.shoulderOrder,
          samples: prior.shoulderSamples,
          rule: prior.shoulderRule,
        },
        prior.layers
          .slice(prior.joint, top + 1)
          .map((u: number, q: number): [number, number, number][] => {
            const l: AutoMovieHumanTrunkPrior.ILobe = prior.lobes[q]!;
            const d: number = place(u);
            const lobe: IOval = {
              x: l.x * inputs.scale,
              z:
                l.z[0]! * inputs.scale +
                l.z[1]! * inputs.acrossShoulder,
              rx: Math.exp(l.sizeX) * inputs.bicep,
              rz: Math.exp(l.sizeZ) * inputs.bicep,
            };
            return joined(
              outline(section(u)),
              lobe,
              prior.arm,
              prior.shoulderOrder,
              1 - smooth((u - prior.layers[prior.joint]!) / PARTING),
              smooth((u - prior.layers[prior.joint]!) / (2 * PARTING)),
              KEEP * (1 - smooth((u - prior.layers[prior.joint]!) / KEEP_RUN)),
              smooth((u - prior.layers[prior.joint]! - FILL_FROM) / FILL_RUN),
            ).map((p: [number, number], m: number): [number, number, number] => {
              // The top of the column settles onto the neck's ring, phase by
              // phase: the ring is not star-shaped about any centre here. Its
              // height stays the layer's own and only takes the ring's tilt,
              // or the last layers would bunch up under the neck.
              const w: number = smooth((u - SETTLE) / (1 - SETTLE));
              const on: [number, number, number] = seat.ring[m]!;
              const x: number = p[0] + d;
              return [
                x + w * (on[0] - x),
                height(u) + w * (on[1] - seat.y),
                p[1] + w * (on[2] - p[1]),
              ];
            });
          }),
      );
    return [trunk, shoulders];
  }

  /** The neck's bottom ring. */
  interface INeck {
    /** Forward centre. */
    x: number;

    /** Mean height. */
    y: number;

    /** The ring at the shoulders' uniform phases. */
    ring: [number, number, number][];
  }

  /** The neck's bottom. */
  function neckRing(
    calibration: IAutoMovieHumanBodyCalibration,
    order: number,
  ): INeck {
    const neck: IAutoMovieHumanLoftChain = calibration.chains.find(
      (c: IAutoMovieHumanLoftChain): boolean => c.name === "head",
    )!;
    const ring: [number, number, number][] = AutoMovieHumanLoftChain.ring(
      neck,
      neck.layers[0]!.y,
      Array.from(
        { length: order },
        (_: unknown, i: number): number => (2 * Math.PI * i) / order,
      ),
    );
    const mean = (c: number): number =>
      ring.reduce(
        (s: number, p: [number, number, number]): number => s + p[c]!,
        0,
      ) / ring.length;
    return { x: mean(0), y: mean(1), ring };
  }

  /** An ellipse in a horizontal plane. */
  interface IOval {
    x: number;
    z: number;
    rx: number;
    rz: number;
  }

  /**
   * The torso's half outline joined with the arm's circle, at uniform phases
   * round the whole ring: the torso from the front to where the circle leaves
   * it, the outer way round the circle, and the torso on to the back.
   */
  function joined(
    half: [number, number][],
    root: IOval,
    arm: readonly [number, number],
    order: number,
    pinch: number,
    free: number,
    keep: number,
    fill: number,
  ): [number, number][] {
    // The arm's root keeps its outer edge where the shoulder puts it, and runs
    // back into the torso however far out that is, so the two always cross.
    const side: number = Math.max(
      ...half.map((p: [number, number]): number => p[1]),
    );
    const outer: number = Math.max(root.z + root.rz, side + keep * root.rz);
    const inner: number = Math.min(root.z - root.rz, side - EMBED * root.rz);
    const lobe: IOval = {
      ...root,
      z: (outer + inner) / 2,
      rz: (outer - inner) / 2,
    };
    const gap = (p: [number, number]): number =>
      Math.hypot((p[0] - lobe.x) / lobe.rx, (p[1] - lobe.z) / lobe.rz) - 1;

    const enter: number = half.findIndex(
      (p: [number, number]): boolean => gap(p) < 0,
    );
    let leave: number = half.length - 1;
    while (leave > 0 && gap(half[leave]!) >= 0) leave--;


    // Toward the neck the circle lies inside the torso and adds nothing.
    if (enter <= 0 || leave >= half.length - 1)
      return uniform(fill > 0 ? filled(half, side) : half, order);
    // Places along the torso's outline, fractional so that a crossing moves
    // smoothly from one layer to the next.
    const place = (i: number, j: number): number => {
      const f: number = gap(half[i]!) / (gap(half[i]!) - gap(half[j]!));
      return i + f * (j - i);
    };
    const widest: number = half.reduce(
      (b: number, p: [number, number], i: number): number =>
        p[1] > half[b]![1] ? i : b,
      0,
    );

    // At the armpit the two crossings are one point, the torso's widest, which
    // they leave slowly going up: a sudden parting would turn into a steep
    // station slope.
    const at0: number = place(enter - 1, enter);
    const at1: number = place(leave, leave + 1);
    const from: number = at0 + pinch * (widest - at0);
    const to: number = at1 + pinch * (widest - at1);
    const read = (x: number): [number, number] => {
      const i: number = Math.min(half.length - 2, Math.floor(x));
      const f: number = x - i;
      return [
        half[i]![0] + f * (half[i + 1]![0] - half[i]![0]),
        half[i]![1] + f * (half[i + 1]![1] - half[i]![1]),
      ];
    };
    const start: [number, number] = read(from);
    const end: [number, number] = read(to);
    const a0: number = Math.atan2(
      (start[1] - lobe.z) / lobe.rz,
      (start[0] - lobe.x) / lobe.rx,
    );
    let a1: number = Math.atan2(
      (end[1] - lobe.z) / lobe.rz,
      (end[0] - lobe.x) / lobe.rx,
    );

    // Front to back past the outside of the arm: the angle rises through +z.
    while (a1 <= a0) a1 += 2 * Math.PI;
    const reach0: number = gap(start);
    const reach1: number = gap(end);
    const front: [number, number][] = [
      ...half.slice(0, Math.ceil(from)),
      start,
    ];
    const back: [number, number][] = [end, ...half.slice(Math.floor(to) + 1)];
    const round: [number, number][] = Array.from(
      { length: RING + 1 },
      (_: unknown, i: number): [number, number] => {
        // The arc starts and ends exactly on the seam's two points.
        const f: number = i / RING;
        const a: number = a0 + (a1 - a0) * f;
        const d: number = 1 + reach0 * (1 - f) ** 6 + reach1 * f ** 6;
        const x: number = lobe.x + d * lobe.rx * Math.cos(a);
        const z: number = lobe.z + d * lobe.rz * Math.sin(a);

        // Where the circle would dip into the torso it runs along its side.
        const side: number = sideAt(half, x);

        // Past the torso's front or back there is no side to stay clear of.
        if (side === -Infinity) return [x, z];
        const floor: number = side + pinch * CLEARANCE;
        const over: number = z - floor;
        return [
          x,
          floor +
            Math.max(over, 0) +
            EASE * Math.log1p(Math.exp(-Math.abs(over) / EASE)),
        ];
      },
    );
    const length = (line: [number, number][]): number =>
      line.reduce(
        (s: number, p: [number, number], i: number): number =>
          i === 0
            ? s
            : s + Math.hypot(p[0] - line[i - 1]![0], p[1] - line[i - 1]![1]),
        0,
      );
    const lengths: number[] = [length(front), length(round), length(back)];
    const total: number = lengths[0]! + lengths[1]! + lengths[2]!;
    const whole: [number, number][] = [...front, ...round, ...back];

    // Above the armpit the valleys between the arm and the torso fill in,
    // until the ring is convex across the shoulder.
    const top: [number, number][] | null =
      fill > 0 ? filled(whole, side) : null;

    // Low on the shoulders the arm's arc keeps its phases, where the arm's
    // chain takes them; toward the neck the ring runs by plain arclength, as
    // the neck's does.
    return Array.from(
      { length: order },
      (_: unknown, m: number): [number, number] => {
        const t: number = (2 * Math.PI * m) / order;
        const s: number = t <= Math.PI ? t : 2 * Math.PI - t;
        const fixed: number =
          s <= arm[0]
            ? (s / arm[0]) * lengths[0]!
            : s <= arm[1]
              ? lengths[0]! +
                ((s - arm[0]) / (arm[1] - arm[0])) * lengths[1]!
              : lengths[0]! +
                lengths[1]! +
                ((s - arm[1]) / (Math.PI - arm[1])) * lengths[2]!;
        const on: [number, number] = along(
          whole,
          (fixed + free * ((s / Math.PI) * total - fixed)) / total,
        );
        const over: [number, number] =
          top === null ? on : along(top, s / Math.PI);
        const p: [number, number] = [
          on[0] + fill * (over[0] - on[0]),
          on[1] + fill * (over[1] - on[1]),
        ];
        return t <= Math.PI ? p : [p[0], -p[1]];
      },
    );
  }

  /** The hull's side away from the midline of points in descending forward place. */
  function upperHull(points: [number, number][]): [number, number][] {
    const hull: [number, number][] = [];
    for (const p of points) {
      while (hull.length >= 2) {
        const o: [number, number] = hull[hull.length - 2]!;
        const c: [number, number] = hull[hull.length - 1]!;
        const turn: number =
          (c[0] - o[0]) * (p[1] - c[1]) - (c[1] - o[1]) * (p[0] - c[0]);
        if (turn > 0) break;
        hull.pop();
      }
      hull.push(p);
    }
    return hull;
  }

  /**
   * A half outline with its lateral run replaced by the convex hull of that
   * run. The midline's grooves stay: the run starts and ends where the outline
   * has left them.
   */
  function filled(line: [number, number][], side: number): [number, number][] {
    const from: number = HULL_FROM * side;
    const first: number = line.findIndex(
      (p: [number, number]): boolean => p[1] > from,
    );
    let last: number = line.length - 1;
    while (last > 0 && line[last]![1] <= from) last--;
    if (first < 0 || last <= first) return line;
    const a: [number, number] = line[first]!;
    const b: [number, number] = line[last]!;
    const run: [number, number][] = line
      .slice(first, last + 1)
      .filter(
        (p: [number, number]): boolean => p[0] <= a[0] && p[0] >= b[0],
      )
      .sort((p: [number, number], q: [number, number]): number => q[0] - p[0]);
    return [
      ...line.slice(0, first),
      ...upperHull(run),
      ...line.slice(last + 1),
    ];
  }

  /** The torso's side at a forward place: the half outline's largest z there. */
  function sideAt(half: [number, number][], x: number): number {
    let z: number = -Infinity;
    for (let i: number = 0; i + 1 < half.length; i++) {
      const a: [number, number] = half[i]!;
      const b: [number, number] = half[i + 1]!;
      if ((a[0] - x) * (b[0] - x) > 0) continue;
      const f: number = (x - a[0]) / (b[0] - a[0] || 1);
      z = Math.max(z, a[1] + f * (b[1] - a[1]));
    }
    return z;
  }

  /** Point at a fraction of a polyline's length. */
  function along(line: [number, number][], f: number): [number, number] {
    if (line.length < 2) return line[0]!;
    const lengths: number[] = [0];
    for (let i: number = 1; i < line.length; i++)
      lengths.push(
        lengths[i - 1]! +
          Math.hypot(
            line[i]![0] - line[i - 1]![0],
            line[i]![1] - line[i - 1]![1],
          ),
      );
    const d: number = f * lengths[lengths.length - 1]!;
    let i: number = 0;
    while (i < line.length - 2 && lengths[i + 1]! < d) i++;
    const w: number =
      (d - lengths[i]!) / Math.max(1e-9, lengths[i + 1]! - lengths[i]!);
    return [
      line[i]![0] + w * (line[i + 1]![0] - line[i]![0]),
      line[i]![1] + w * (line[i + 1]![1] - line[i]![1]),
    ];
  }

  /** One section's left half, from the front on the midline to the back. */
  function outline(s: ISection): [number, number][] {
    return Array.from(
      { length: RING + 1 },
      (_: unknown, i: number): [number, number] => {
        const a: number = (Math.PI * i) / RING;
        const c: number = Math.cos(a);
        const e: number = 2 / s.power;
        const z: number = s.width * Math.sin(a) ** e;
        const forward: boolean = c >= 0;
        const depth: number = forward ? s.front - s.middle : s.middle - s.back;
        const pull: number = forward ? s.frontPull : s.backPull;
        const groove: number = forward ? s.frontGroove : s.backGroove;
        const x: number =
          depth *
            Math.abs(c) ** e *
            (1 - pull * Math.exp(-((z / groove) ** 2))) +
          (forward
            ? s.bust * Math.exp(-(((z - s.bustPlace) / s.bustWidth) ** 2)) -
              s.pit * Math.exp(-((z / s.pitWidth) ** 2))
            : 0);
        return [s.middle + (forward ? x : -x), z];
      },
    );
  }

  /**
   * A half outline as a whole ring with its phases held to the section's own
   * angle. Where a ring's length changes fast, as the crotch opens, arclength
   * phases slide round the ring from layer to layer and shear the skin.
   */
  function steady(half: [number, number][], order: number): [number, number][] {
    const last: number = half.length - 1;
    return Array.from(
      { length: order },
      (_: unknown, m: number): [number, number] => {
        const t: number = (2 * m) / order;
        const x: number = (t <= 1 ? t : 2 - t) * last;
        const i: number = Math.min(last - 1, Math.floor(x));
        const f: number = x - i;
        const p: [number, number] = [
          half[i]![0] + f * (half[i + 1]![0] - half[i]![0]),
          half[i]![1] + f * (half[i + 1]![1] - half[i]![1]),
        ];
        return t <= 1 ? p : [p[0], -p[1]];
      },
    );
  }

  /** A half outline as a whole ring at uniform sagittal phases. */
  function uniform(half: [number, number][], order: number): [number, number][] {
    return Array.from(
      { length: order },
      (_: unknown, m: number): [number, number] => {
        const t: number = (2 * m) / order;
        const p: [number, number] = along(half, t <= 1 ? t : 2 - t);
        return t <= 1 ? p : [p[0], -p[1]];
      },
    );
  }
}

/**
 * One person's measure run up the column by local linear regression, each
 * station weighted by the span it stands for. Whatever the tapes do, the skin
 * gets no stripe from where the anchors happen to fall, and unlike a plain mean
 * the ends keep their slope.
 */
function fair(
  stations: readonly number[],
  values: readonly number[],
  reach: number = FAIR,
): number[] {
  const last: number = stations.length - 1;
  return stations.map((s: number): number => {
    let s0: number = 0;
    let s1: number = 0;
    let s2: number = 0;
    let t0: number = 0;
    let t1: number = 0;
    stations.forEach((t: number, j: number): void => {
      const span: number =
        (stations[Math.min(last, j + 1)]! - stations[Math.max(0, j - 1)]!) / 2;
      const d: number = t - s;
      const w: number = span * Math.exp(-((d / reach) ** 2));
      s0 += w;
      s1 += w * d;
      s2 += w * d * d;
      t0 += w * values[j]!;
      t1 += w * d * values[j]!;
    });
    return (s2 * t0 - s1 * t1) / (s0 * s2 - s1 * s1);
  });
}

/** Smoothstep clamped to [0, 1]. */
function smooth(x: number): number {
  const t: number = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

/** Samples of a half section or a ring's arc. */
const RING: number = 240;

/**
 * How far the arm's root stands from having its centre at the torso's side,
 * in half widths, at the armpit: the arm stays on the body however wide the
 * chest, and the margin runs out toward the neck.
 */
const KEEP: number = 1.3;

/** Fraction of the column above the armpit over which that margin runs out. */
const KEEP_RUN: number = 0.15;

/** Softness of the arc's rise off the torso's side, mm. */
const EASE: number = 3;

/** Gap kept between the arm's root and the torso's side at the armpit, mm. */
const CLEARANCE: number = 1;

/** How far inside the torso's side the arm's root runs, in its half widths. */
const EMBED: number = 0.25;

/** Fraction of the column where it starts to settle onto the neck's ring. */
const SETTLE: number = 0.93;

/** Layers above the joint of the ring that gives the trunk's top its slope. */
const JOINT_REACH: number = 4;

/** Reach of a measure's regression up the column, in fractions of it. */
const FAIR: number = 0.05;

/** Reach for the widest point's place, which only shapes the section. */
const MIDDLE_REACH: number = 0.1;

/** Fraction of the column where the pulls start to run fairly. */
const FAIR_FROM: number = 0.05;

/** Fraction of the column over which they come to. */
const FAIR_RUN: number = 0.1;

/** Fraction of the column above the armpit where the valleys start to fill. */
const FILL_FROM: number = 0.03;

/** Fraction of the column over which they fill. */
const FILL_RUN: number = 0.1;

/** Share of the torso's half width where the hull's run starts. */
const HULL_FROM: number = 0.5;

/** Fraction of the column over which the armpit's two crossings part. */
const PARTING: number = 0.1;

/** Fraction of the column where it starts to lean under the neck. */
const LEAN: number = 0.8;

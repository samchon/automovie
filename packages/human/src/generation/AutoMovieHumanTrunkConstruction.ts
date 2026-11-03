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
 * The rear under the lumbar is the seat's instead: a parabola about the buttock's
 * crest, placed by the hip tape, running into the column's own rear by the
 * lumbar. A single super-ellipse closed on the hip tape stands short of that
 * crest, and no tape reads the crest's place.
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

    /** Neck to waist. */
    neckToWaist: number;

    /** Shoulder to bust apex. */
    shoulderToApex: number;

    /** Front interscye length. */
    frontInterscyeLength: number;

    /** Masculine-feminine control. */
    sex: number;

    /** Fat control. */
    fat: number;

    /** Muscularity control. */
    muscularity: number;

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
                shared: true,
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

    /** The crotch's pull at the front's midline, a share of the depth. */
    crotch: number;

    /** Half width of that pull's flat core, mm: the height above the ring. */
    crotchCore: number;

    /** Softness of the fold at that core's edge, mm. */
    foldSoft: number;

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
            measure.gain[k]! * tape(prior.shares[k]!) +
            measure.fat[k]! * inputs.fat +
            measure.muscularity[k]! * inputs.muscularity,
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
    // The fit read these two places off a different part of the section above
    // the joint, where the arm's arc is left out, so the tables turn at the
    // joint for no anatomical reason, and the more so the further a person's
    // tapes stand from the mean. The wider reach keeps the anatomy's own run
    // and leaves that turn out.
    const width = curve(fairly(size(prior.width).map(Math.log)));
    const front = curve(
      fair(
        prior.stations,
        size(prior.front).map(
          (v: number, k: number): number => prior.middle[k]! + v,
        ),
        MIDDLE_REACH,
      ),
    );
    const back = curve(
      fair(
        prior.stations,
        size(prior.back).map(
          (v: number, k: number): number => prior.middle[k]! - v,
        ),
        MIDDLE_REACH,
      ),
    );
    const middle = curve(fair(prior.stations, prior.middle, MIDDLE_REACH));
    const power = curve(fairly(prior.power));
    // Under the belly the crotch's own law owns the front's pull, so the fitted
    // pull counts only where the measures run fairly. The fit read the pull at
    // the midline, where the male references carry their genitals, which the
    // modelled skin leaves out.
    const pulls: number[] = prior.frontPull.level.map(
      (v: number, k: number): number =>
        v +
        prior.frontPull.sex[k]! * inputs.sex +
        prior.frontPull.bust[k]! * Math.log(inputs.chest / inputs.underbust),
    );
    const frontPull = curve(
      above(pulls).map(
        (v: number, k: number): number =>
          v * smooth((prior.stations[k]! - FAIR_FROM) / FAIR_RUN),
      ),
    );

    // At the crotch the thighs part from the midline: the front stands back by
    // the ring's pull, falling exponentially with the groove's width across
    // the body, and the midline's core widens as fast as the height rises, so
    // the fold runs out from the pubis toward the hip at 45 degrees while the
    // pull further out stays. Measured on f1, the midline's pull reads 1.07,
    // 0.88, 0.70, 0.45 and 0.32 at 0, 5, 10, 20 and 30 mm above the ring, and
    // this law gives 1.07, 0.89, 0.73, 0.51 and 0.35 from the first alone.
    const crotchPull: number = pulls[0]!;

    // The fold's softness, set once the section is known: the larger of the
    // ring's control pitch at the crotch and the rows' spacing where the fold
    // runs, which it crosses at one millimetre out per millimetre up.
    let foldSoft: number = 1;
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
    const seat: INeck = neckRing(calibration, prior.shoulderOrder);
    const span: number = seat.y - floor;
    const lengths: AutoMovieHumanTrunkPrior.IBodyLengths = prior.bodyLengths;

    // A height is read at the column's own proportions: a longer neck-to-waist
    // lowers the waist, the crotch and the neck staying where they are.
    const waistAt: number = prior.stations[prior.shares.findIndex(
      (s: readonly number[]): boolean => s[WAIST_TAPE] === 1,
    )]!;
    const drop: number = Math.max(
      -MAX_WAIST_DROP,
      Math.min(
        MAX_WAIST_DROP,
        (inputs.neckToWaist - lengths.neckToWaist * inputs.scale) / span,
      ),
    );

    // Two straight runs from the column's ends to the waist, their meeting
    // rounded over the column's fairing reach: left a corner, every measure
    // turned at that one row and printed a line round the waist.
    const sum: number = 1 / waistAt + 1 / (1 - waistAt);
    const difference: number = 1 / (1 - waistAt) - 1 / waistAt;
    const eased = (u: number): number =>
      u +
      drop *
        (1 -
          (sum / 2) * rounded(u - waistAt, FAIR) -
          (difference / 2) * (u - waistAt));

    // Under the lumbar the rear is the seat's own parabola about the buttock's
    // crest, which the hip tape places, and it runs into the column's own rear
    // by the lumbar. Every derivative up to the second is continuous there.
    const seated: AutoMovieHumanTrunkPrior.ISeat = prior.seat;
    const share: number = calibration.stature / span;
    const crestAt: number = share * seated.crest;
    const lumbarAt: number = share * seated.lumbar;
    const rear = (v: number): number => {
      const seat: number =
        ((-seated.depth + seated.bend * ((v - crestAt) / share) ** 2) *
          inputs.hip) /
        inputs.scale;
      return (
        seat +
        fifth((v - crestAt) / (lumbarAt - crestAt)) * (read(back, v) - seat)
      );
    };

    // A longer shoulder-to-apex lowers the breast's apex; a wider front
    // interscye sets the arm's root further back, since that length is the
    // chest between the arms' front creases.
    const apex: number =
      b.station -
      (inputs.shoulderToApex - lengths.shoulderToApex * inputs.scale) / span;
    const rootBack: number =
      INTERSCYE *
      (inputs.frontInterscyeLength -
        lengths.frontInterscyeLength * inputs.scale);
    const measures = (raw: number, scale: number): ISection => {
      const u: number = eased(raw);
      const m: number = read(middle, u) * inputs.scale;
      const f: number = read(front, u) * inputs.scale;
      const a: number = rear(u) * inputs.scale;
      const rise: number = raw * span;
      const groove: number = Math.max(1, read(frontGroove, u)) * inputs.scale;
      return {
        crotch: crotchPull * Math.exp(-rise / groove),
        crotchCore: rise,
        foldSoft,
        width: scale * Math.exp(read(width, u)) * inputs.scale,
        middle: m,
        front: Math.max(m + 1, m + scale * (f - m)),
        back: Math.min(m - 1, m + scale * (a - m)),
        power: read(power, u),
        frontPull: Math.max(0, read(frontPull, u)),
        frontGroove: groove,
        backPull: Math.max(0, read(backPull, u)),
        backGroove: Math.max(1, read(backGroove, u)) * inputs.scale,

        // The pit is read at the rows' own height, which stand close round it,
        // so that a moved waist cannot carry it into a long span.
        pit:
          prior.navel.depth *
          inputs.scale *
          Math.exp(-(((raw - prior.navel.station) / prior.navel.height) ** 2)),
        pitWidth: prior.navel.width * inputs.scale,
        bust: bust * Math.exp(-(((u - apex) / b.height) ** 2)),
        bustPlace: b.place * inputs.bustSpan,
        bustWidth: b.width * inputs.bustSpan,
      };
    };

    // A tape is what it says: width and depth together close each tape around
    // the hull a tape wraps. A girth is linear in that shared scale, so a tape
    // and a ring that disagree by a few percent move the skin by a few percent.
    const closure: [number, number][] = prior.closure.map(
      (ratio: number, i: number): [number, number] => {
        // The hip's share is whole from the crotch up to the hip itself.
        const u: number =
          prior.stations[
            prior.shares
              .map((s: readonly number[]): boolean => s[i] === 1)
              .lastIndexOf(true)
          ]!;
        let low: number = 0.5;
        let high: number = 1.8;
        for (let k: number = 0; k < CLOSURE_STEPS; k++) {
          const mid: number = (low + high) / 2;
          if (girth(outline(measures(u, mid))) < tapes[i]! * ratio) low = mid;
          else high = mid;
        }
        return [u, Math.log((low + high) / 2)];
      },
    );
    const keyed: AutoMovieHumanNaturalSpline.ISpline =
      AutoMovieHumanNaturalSpline.create(
        [0, ...closure.map((c: [number, number]): number => c[0]), 1],
        [
          closure[0]![1],
          ...closure.map((c: [number, number]): number => c[1]),
          0,
        ],
      );
    const closing: AutoMovieHumanNaturalSpline.ISpline = curve(
      fair(
        prior.stations,
        prior.stations.map((u: number): number => read(keyed, u)),
        CLOSURE_REACH,
      ),
    );
    const section = (u: number): ISection =>
      measures(u, Math.exp(read(closing, u)));
    {
      const pitch: number = girth(outline(section(0))) / prior.order;
      const reach: number =
        FOLD_REACH * Math.max(1, read(frontGroove, eased(0))) * inputs.scale;
      const rows: number[] = prior.layers
        .slice(0, prior.joint + 1)
        .map((u: number): number => u * span);
      let gap: number = 0;
      for (let k: number = 1; k < rows.length && rows[k - 1]! < reach; k++)
        gap = Math.max(gap, rows[k]! - rows[k - 1]!);
      foldSoft = FOLD_SAMPLES * Math.max(pitch, gap);
    }

    const top: number = prior.layers.length - 1;
    const roofSection: ISection = section(1);
    const lift: number = seat.x - (roofSection.front + roofSection.back) / 2;
    const place = (u: number): number => lift * smooth((u - LEAN) / (1 - LEAN));
    const height = (u: number): number => floor + u * (seat.y - floor);
    const column = (u: number): [number, number, number][] => {
      const own: ISection = section(u);
      const half: [number, number][] = outline(own);
      const hull: [number, number][] = outline({
        ...own,
        frontPull: 0,
        backPull: 0,
        crotch: 0,
        bust: 0,
        pit: 0,
      });
      const d: number = place(u);
      return steady(half, hull, prior.order).map(
        (p: [number, number]): [number, number, number] => [
          p[0] + d,
          height(u),
          p[1],
        ],
      );
    };
    const trunk: IAutoMovieHumanLoftChain = continuous(
      AutoMovieHumanHorizontalChain.build(
        {
          name: "trunk",
          order: prior.order,
          samples: prior.samples,
          rule: prior.rule,
        },
        prior.layers.slice(0, prior.joint + 1).map(column),
        column(prior.layers[prior.joint + JOINT_REACH]!),
      ),
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
              x: l.x * inputs.scale - rootBack,
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

  /** Length of a tape round a section: the hull of its half outline, doubled. */
  function girth(half: [number, number][]): number {
    const hull: [number, number][] = upperHull(
      [...half].sort(
        (p: [number, number], q: [number, number]): number => q[0] - p[0],
      ),
    );
    let length: number = hull[0]![1] + hull[hull.length - 1]![1];
    for (let i: number = 1; i < hull.length; i++)
      length += Math.hypot(
        hull[i]![0] - hull[i - 1]![0],
        hull[i]![1] - hull[i - 1]![1],
      );
    return 2 * length;
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
        // The rational form of the super-ellipse. Its trigonometric form runs
        // through the midline with an infinite speed, which left a groove a
        // single span of the ring and ended the crotch's ring in a sharp V.
        const f: number = (2 * i) / RING;
        const forward: boolean = f <= 1;
        const q: number = forward ? f : 2 - f;
        const depth: number = forward ? s.front - s.middle : s.middle - s.back;
        const pull: number = forward ? s.frontPull : s.backPull;
        const groove: number = forward ? s.frontGroove : s.backGroove;
        const n: number = (q ** s.power + (1 - q) ** s.power) ** (1 / s.power);
        const z: number = (s.width * q) / n;
        // The fitted grooves keep the Gaussian they were fitted as. The
        // crotch's front falls away exponentially instead: it stands back from
        // its full depth by 1.07, 0.55, 0.27 and 0.13 of it at 0, 20, 40 and
        // 60 mm, a decay length of 29 mm, where a Gaussian of that width dies
        // by 50 mm and set the front at full depth there, a lobe across the
        // ring. Used for the spine's groove, that profile printed a crease
        // down the whole back.
        // Inside the fold the front is flat across, as the reference's is: a
        // rounded core sloped toward the midline all the way out and made a
        // trough whose wall faced the midline, a dark lobe under raking light.
        // The fold is as soft as the sampling needs: a fold narrower than the
        // ring's pitch or the rows' run printed teeth along it.
        const soft: number = s.foldSoft;
        const away: number = Math.hypot(z, soft) - soft - s.crotchCore;
        const crotch: number = forward
          ? s.crotch *
            Math.exp(-((Math.hypot(away, soft) + away) / 2) / groove)
          : 0;
        const x: number =
          depth *
            ((1 - q) / n) *
            (1 - pull * Math.exp(-((z / groove) ** 2)) - crotch) +
          // The two breasts, so that the relief is even across the midline: one
          // alone keeps its slope there, and the mirror folds it into a corner
          // that runs from the neck to the belly as a stripe.
          (forward
            ? s.bust *
                (Math.exp(-(((z - s.bustPlace) / s.bustWidth) ** 2)) +
                  Math.exp(-(((z + s.bustPlace) / s.bustWidth) ** 2))) -
              s.pit * Math.exp(-((z / s.pitWidth) ** 2))
            : 0);
        return [s.middle + (forward ? x : -x), z];
      },
    );
  }

  /**
   * A half outline as a whole ring, each named place at a fixed phase and the
   * points between them spaced by arclength: the front midline at 0, the
   * widest point at a quarter turn and the rear midline at a half, where the
   * crotch's pinches lie. Arclength round the whole ring slid the phases from
   * layer to layer as the crotch opened; the section's own parameter crowded
   * them at the tip or slid them as the width changed. Anchors hold the places
   * and arclength holds the spacing.
   */
  function steady(
    half: [number, number][],
    hull: [number, number][],
    order: number,
  ): [number, number][] {
    // The spacing is the hull's, without the grooves: a notch closing over a
    // few millimetres changes the outline's length fast, and spacing by it
    // slid the points sideways between rows. The hull changes slowly, and the
    // grooves then move each point only where it already is.
    const widest: number = (half.length - 1) / 2;
    const lengths: number[] = [0];
    for (let i: number = 1; i < hull.length; i++)
      lengths.push(
        lengths[i - 1]! +
          Math.hypot(hull[i]![0] - hull[i - 1]![0], hull[i]![1] - hull[i - 1]![1]),
      );
    const index = (d: number): number => {
      let i: number = 0;
      while (i < hull.length - 2 && lengths[i + 1]! < d) i++;
      return (
        i + (d - lengths[i]!) / Math.max(1e-9, lengths[i + 1]! - lengths[i]!)
      );
    };
    const total: number = lengths[lengths.length - 1]!;
    const middle: number = lengths[widest]!;
    return Array.from(
      { length: order },
      (_: unknown, m: number): [number, number] => {
        const t: number = (2 * m) / order;
        const s: number = t <= 1 ? t : 2 - t;
        const x: number = index(
          s <= 0.5 ? 2 * s * middle : middle + (2 * s - 1) * (total - middle),
        );
        const i: number = Math.min(half.length - 2, Math.floor(x));
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

/** Absolute value with its corner rounded over a half width, to the second derivative. */
function rounded(x: number, half: number): number {
  const t: number = x / half;
  if (Math.abs(t) >= 1) return Math.abs(x);
  return (
    half *
    (5 / 16 + (15 / 8) * (t ** 2 / 2 - t ** 4 / 6 + t ** 6 / 30))
  );
}

/** Smootherstep clamped to [0, 1], flat to the second derivative at both ends. */
function fifth(x: number): number {
  const t: number = Math.min(1, Math.max(0, x));
  return t * t * t * (t * (6 * t - 15) + 10);
}

/**
 * A chain's slopes solved so that each coefficient's curvature carries across
 * its rows, its end slopes kept. Three-point slopes leave the Hermite spans
 * meeting at a corner in curvature, which shades as a line at every row and
 * shows at the rows where the skin bends most, the waist first.
 */
function continuous(chain: IAutoMovieHumanLoftChain): IAutoMovieHumanLoftChain {
  const rows: readonly IAutoMovieHumanLoftChain.ILayer[] = chain.layers;
  const last: number = rows.length - 1;
  const solved = (
    pick: (l: IAutoMovieHumanLoftChain.ILayer) => readonly number[],
    ends: (l: IAutoMovieHumanLoftChain.ILayer) => readonly number[],
  ): number[][] => {
    const slopes: number[][] = rows.map((l: IAutoMovieHumanLoftChain.ILayer) => [
      ...ends(l),
    ]);
    const sweep: number[] = new Array<number>(rows.length).fill(0);
    const right: number[][] = rows.map((): number[] => []);
    for (let k: number = 1; k < last; k++) {
      const h0: number = rows[k]!.y - rows[k - 1]!.y;
      const h1: number = rows[k + 1]!.y - rows[k]!.y;
      const lower: number = 1 / h0;
      const upper: number = 1 / h1;
      const pivot: number =
        2 * (lower + upper) - (k > 1 ? lower * sweep[k - 1]! : 0);
      sweep[k] = upper / pivot;
      const here: readonly number[] = pick(rows[k]!);
      const below: readonly number[] = pick(rows[k - 1]!);
      const above: readonly number[] = pick(rows[k + 1]!);
      right[k] = here.map((v: number, i: number): number => {
        const b: number =
          3 * ((v - below[i]!) / (h0 * h0) + (above[i]! - v) / (h1 * h1)) -
          (k === 1 ? lower * slopes[0]![i]! : 0) -
          (k === last - 1 ? upper * slopes[last]![i]! : 0);
        return (b - (k > 1 ? lower * right[k - 1]![i]! : 0)) / pivot;
      });
    }
    for (let k: number = last - 1; k >= 1; k--)
      slopes[k] = right[k]!.map((v: number, i: number): number =>
        k === last - 1 ? v : v - sweep[k]! * slopes[k + 1]![i]!,
      );
    return slopes;
  };
  const section: number[][] = solved(
    (l: IAutoMovieHumanLoftChain.ILayer): readonly number[] => l.coefficients,
    (l: IAutoMovieHumanLoftChain.ILayer): readonly number[] => l.slopes,
  );
  const raised: number[][] = solved(
    (l: IAutoMovieHumanLoftChain.ILayer): readonly number[] => l.lift!,
    (l: IAutoMovieHumanLoftChain.ILayer): readonly number[] => l.liftSlopes!,
  );
  return {
    ...chain,
    layers: rows.map(
      (
        l: IAutoMovieHumanLoftChain.ILayer,
        k: number,
      ): IAutoMovieHumanLoftChain.ILayer => ({
        ...l,
        slopes: section[k]!,
        liftSlopes: raised[k]!,
      }),
    ),
  };
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
const SETTLE: number = 0.96;

/** Index of the waist among the tapes. */
const WAIST_TAPE: number = 2;

/** Largest move of the waist up the column, a fraction of it. */
const MAX_WAIST_DROP: number = 0.08;

/** How far the arm's root moves back per unit of the front interscye. */
const INTERSCYE: number = 0.25;

/**
 * Reach of the closure's regression up the column. Two tapes a hand apart may
 * ask different scales, and a closer reach prints that as a ledge.
 */
const CLOSURE_REACH: number = 0.1;

/** Bisections of a section's scale against its tape. */
const CLOSURE_STEPS: number = 12;

/**
 * Layers above the joint of the ring that gives the trunk's top its slope. The
 * next layer: a further one averages the skin's curvature into that slope, and
 * the join then turns the difference back as a line across the back.
 */
const JOINT_REACH: number = 1;

/**
 * The crotch fold's softness in sampling pitches: a band about two and a half
 * samples wide, so that each ring and each row carries it whole.
 */
const FOLD_SAMPLES: number = 1.25;

/**
 * Height over which the fold runs, in widths of the front groove: there its
 * pull has fallen to a twentieth.
 */
const FOLD_REACH: number = 3;

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

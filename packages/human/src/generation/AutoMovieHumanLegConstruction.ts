import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { AutoMovieHumanLoftFrame } from "../lofting/AutoMovieHumanLoftFrame";
import { AutoMovieHumanNaturalSpline } from "../lofting/AutoMovieHumanNaturalSpline";
import { AutoMovieHumanPolarSection } from "../lofting/AutoMovieHumanPolarSection";
import { AutoMovieHumanSplineCurve } from "../lofting/AutoMovieHumanSplineCurve";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { AutoMovieHumanSkeletonLaw } from "./AutoMovieHumanSkeletonLaw";
import { AutoMovieHumanLegPrior } from "./AutoMovieHumanLegPrior";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Both legs generated on their own bones, from the ankle ring, the crotch
 * ring, the calf, knee, thigh and hip tapes and the masculine-feminine
 * control, by one construction in the left leg's frame and a reflection.
 *
 * The foot places the ankle ring, the trunk places the crotch ring, and the
 * skeleton places the hip, the knee and the ankle before any limb. The leg
 * starts on the one ring and ends on the other.
 *
 * ## Frames
 *
 * A station is the height of its section's origin, which runs along the bone:
 * up the shank from the ankle, round the knee and up the thigh toward the hip,
 * its tangent the section's normal, so every section is square to its bone.
 * The leg is built straight in its own frame, and the bind posture is the
 * rotation that places it: the section normal turns from the ankle ring's
 * vertical to the shank, from the shank to the thigh across the knee, and from
 * the thigh back to the crotch ring's vertical, each a turn about one fixed
 * axis square to both directions, eased so that it starts and ends without
 * angular velocity. A turn about a fixed axis carries the in-plane axes without
 * twist; the three turns together leave a residual twist about the vertical,
 * which runs out evenly along the leg so both end rings keep their own axes.
 * The knee turns over as many skin depths as a joint's bend spreads over, and
 * the end rings over the reaches their differences fade over.
 *
 * ## Sections
 *
 * Between its ends a section at leg fraction u, 0 at the ankle and 1 at the
 * crotch, is `C(u) + R(u) rho(u, theta)` in its bone's plane:
 *
 * - `rho` is the prior's area-normalized radial shape.
 * - `R` is the prior's log-radius profile, in leg lengths, shifted through
 *   the ankle ring's radius and the calf, knee and thigh tapes. A tape's radius
 *   is solved against the hull of the prior section it wraps, because that
 *   hull, not a circle, is what the tape measures, and the section is square to
 *   the limb as a tape is.
 * - `C` is the prior's centre line, read in the bone's plane: forward it
 *   follows the ankle by the prior's forward curve in leg lengths, and
 *   laterally it stands off the midline by a line in the leg's length, the hip
 *   tape and the masculine-feminine control, so that wider hips spread the
 *   legs and a feminine figure brings the knees in. The thigh leans onto the
 *   crotch ring's place, and the inner edges of the two thighs meet at the
 *   midline and do not pass it, by a smooth maximum against the midline.
 *
 * The ankle ring's difference from the law fades into the leg over its reach.
 *
 * ## The crotch
 *
 * Over the last part of the leg the section hands over to the crotch ring. The
 * ring the leg takes is the trunk's arc closed by the slit between the thighs,
 * so it has a corner at each pinch. The leg starts from that ring as a rounded
 * loop: each corner is a fillet whose sides grow as fast as the depth under the
 * ring, the rate at which the trunk's own fold leaves the midline, so the
 * contact between the thighs shortens downward and the leg's own sections never
 * keep the root's corner. The loop leaves the ring straight down and hands over
 * to the law at an even rate, eased at both ends. On top of that the trunk's own
 * station derivative at the ring is carried into the leg: each point of the ring
 * leaves it with the trunk's outward slope there, by a quintic that meets the
 * leg's own surface with neither place, slope nor curvature, over the longest
 * reach that keeps its lump within the event join's bound. The two chains
 * therefore share one tangent plane on the open arc by construction, and the
 * join has nothing left to bend there. Within a taper of each pinch the trunk's
 * slope is its fold opening, which a rounded corner cannot share, so it fades
 * there, read over the taper's length of ring so the fade turns no section.
 *
 * ## Layers
 *
 * Layers are spaced by one rule: no spacing coarser than the prior's finest
 * knot pitch; within a joint's bend, close enough that a row turns by no more
 * than {@link ROW_TURN} under the joint's whole range of motion; and under the
 * crotch ring, doubling from the trunk's first row, so the rows either side of
 * the ring match.
 *
 * Reflection reverses polar phase: the right leg's point at phase t is the
 * mirror of the canonical point at -t, its in-plane axis `v` turned over so
 * that sections keep their sense round the chain. The ankle and crotch keys are
 * read in the canonical frame through the same reflection, so both legs come
 * from one family.
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
   * @param skeleton The bind skeleton the legs are lofted on.
   */
  export function apply(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
    skeleton: readonly AutoMovieHumanSkeletonLaw.IBone[],
  ): IAutoMovieHumanBodyCalibration {
    return {
      ...calibration,
      chains: calibration.chains.map(
        (c: IAutoMovieHumanLoftChain): IAutoMovieHumanLoftChain =>
          c.name === "leg.left"
            ? generate(calibration, "left", inputs, skeleton)
            : c.name === "leg.right"
              ? generate(calibration, "right", inputs, skeleton)
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
   * @param skeleton The bind skeleton: each foot stands under its ankle.
   *   Absent, the stance is read from the prior's line here.
   */
  export function stand(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
    skeleton?: readonly AutoMovieHumanSkeletonLaw.IBone[],
  ): IAutoMovieHumanBodyCalibration {
    const axis: AutoMovieHumanNaturalSpline.ISpline[] = axisCurves();
    const moves: Map<"left" | "right", [number, number]> = new Map(
      (["left", "right"] as const).map(
        (side: "left" | "right"): ["left" | "right", [number, number]] => {
          const sign: 1 | -1 = side === "left" ? 1 : -1;
          const ankle: Vec3[] = ankleRing(calibration, side);
          const at: [number, number] = AutoMovieHumanPolarSection.measure(
            ankle.map((p: Vec3): [number, number] => [p[0], p[2]]),
          ).centre;
          const joint: AutoMovieHumanSkeletonLaw.IBone | undefined =
            skeleton?.find(
              (b: AutoMovieHumanSkeletonLaw.IBone): boolean =>
                b.bone === `${side}Foot`,
            );
          if (skeleton !== undefined && joint === undefined)
            throw new Error(`The skeleton lacks the ${side} ankle`);
          if (joint !== undefined)
            return [
              side,
              [joint.position[0] - at[0], joint.position[2] - at[1]],
            ];
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
    ): Vec3 => [p[0] + d[0], p[1], p[2] + d[1]];
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

  /**
   * Calibration with both legs added, for a body that holds none.
   *
   * @param calibration Calibration holding `trunk` and the feet, stood.
   * @param inputs Tape measures in calibration millimetres.
   * @param skeleton The bind skeleton the legs are lofted on.
   */
  export function add(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
    skeleton: readonly AutoMovieHumanSkeletonLaw.IBone[],
  ): IAutoMovieHumanBodyCalibration {
    return {
      ...calibration,
      chains: [
        ...calibration.chains,
        generate(calibration, "right", inputs, skeleton),
        generate(calibration, "left", inputs, skeleton),
      ],
    };
  }

  /** One leg's chain. */
  function generate(
    calibration: IAutoMovieHumanBodyCalibration,
    side: "left" | "right",
    inputs: IInputs,
    skeleton: readonly AutoMovieHumanSkeletonLaw.IBone[],
  ): IAutoMovieHumanLoftChain {
    const sign: 1 | -1 = side === "left" ? 1 : -1;
    const family: IFamily = prepare(calibration, side, sign, inputs);
    const bones: IJoints = jointsOf(skeleton, side, sign);
    const root: IRoot = rootOf(calibration, side, sign, family);
    const s0: number = family.bottom;
    const s1: number = family.bottom + family.length;

    // Skin depths at the joints: the distance from each joint to the skin
    // nearest it there.
    const kneeDepth: number = Math.min(
      ...lawPoints(family, bones.knee[1], null).map(
        (p: Vec3): number => norm(sub(p, bones.knee)),
      ),
    );
    const ankleDepth: number = Math.min(
      ...family.ankleWorld.map((p: Vec3): number => norm(sub(p, bones.ankle))),
    );
    const hipDepth: number = Math.min(
      ...root.arc.map((p: Vec3): number => norm(sub(p, bones.hip))),
      ...[0, 0.25, 0.5, 0.75, 1].map((f: number): number =>
        norm(sub(lerp(root.arc[root.arc.length - 1]!, root.arc[0]!, f), bones.hip)),
      ),
    );
    const frames: IFrames = framesOf(
      bones,
      s0,
      s1,
      BEND * kneeDepth,
      ANKLE_REACH * family.length,
      reachOf(family),
    );
    const trunk: IAutoMovieHumanLoftChain = calibration.chains.find(
      (c: IAutoMovieHumanLoftChain): boolean => c.name === "trunk",
    )!;
    const stations: number[] = stationsOf(
      s0,
      s1,
      [
        { at: bones.ankle[1], half: BEND * ankleDepth, range: range("ankle.dorsiflexion") },
        { at: bones.knee[1], half: BEND * kneeDepth, range: range("knee.flexion") },
        { at: bones.hip[1], half: BEND * hipDepth, range: range("hip.flexion") },
      ],
      trunk.layers[1]!.y - trunk.layers[0]!.y,
      family.length * coarsest(),
    );
    const section = (s: number): ISection =>
      sectionOf(family, frames, root, s);
    const last: number = stations.length - 1;
    const layers: IAutoMovieHumanLoftChain.ILayer[] = stations.map(
      (s: number, k: number): IAutoMovieHumanLoftChain.ILayer => {
        // Central differences inside, one-sided of second order at the ends:
        // nothing exists past the rings.
        const here: ISection = section(s);
        const rate: Vec3[] =
          k === 0 || k === last
            ? ((): Vec3[] => {
                const d: number = k === 0 ? STEP : -STEP;
                const a: ISection = section(s + d);
                const b: ISection = section(s + 2 * d);
                return here.local.map((p: Vec3, m: number): Vec3 =>
                  [0, 1, 2].map(
                    (c: number): number =>
                      (-3 * p[c]! + 4 * a.local[m]![c]! - b.local[m]![c]!) /
                      (2 * d),
                  ) as Vec3,
                );
              })()
            : ((): Vec3[] => {
                const a: ISection = section(s - STEP);
                const b: ISection = section(s + STEP);
                return here.local.map((_: Vec3, m: number): Vec3 =>
                  [0, 1, 2].map(
                    (c: number): number =>
                      (b.local[m]![c]! - a.local[m]![c]!) / (2 * STEP),
                  ) as Vec3,
                );
              })();
        const values = sided(here.local, sign);
        const slopes = sided(rate, sign);
        return {
          y: s,
          frame: placed(here.frame, sign),
          frameSlopes: placed(
            frameRate(frames, s, k === 0 ? 1 : k === last ? -1 : 0),
            sign,
          ),
          coefficients: values.coefficients,
          slopes: slopes.coefficients,
          lift: values.lift,
          liftSlopes: slopes.lift,
        };
      },
    );
    return {
      name: `leg.${side}`,
      basis: "spline",
      order: ORDER,
      rule: "polar",
      samples: SAMPLES,
      layers,
    };
  }

  /** The fitted law's channels with one person's keys. */
  interface IFamily {
    bottom: number;
    length: number;
    ankle: [number, number];
    ankleWorld: Vec3[];
    ankleLift: number[];
    crotchOffset: [number, number];
    crotchCentre: [number, number];
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
    const ankleWorld: Vec3[] = ankleRing(calibration, side).map(
      (p: Vec3): Vec3 => [p[0], p[1], sign * p[2]],
    );
    const crotchWorld: Vec3[] = crotchRing(calibration, side);
    const planar = (ring: readonly Vec3[]): [number, number][] =>
      ring.map((p: Vec3): [number, number] => [p[0], p[2]]);
    const ankle: [number, number][] = planar(ankleWorld);
    const crotch: [number, number][] = crotchWorld.map(
      (p: Vec3): [number, number] => [p[0], sign * p[2]],
    );
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
    // the thigh, and only the last reach hands over to it.
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
      ankleWorld,
      ankleLift: [],
      crotchOffset: [0, 0],
      crotchCentre: crotchSection.centre,
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

    // The trunk owns the crotch ring's place, so the thigh leans onto it.
    const reached: IBare = bare(family, LAST_INTERIOR);
    family.crotchOffset = [
      crotchSection.centre[0] + prior.ring.forward * length - reached.centre[0],
      crotchSection.centre[1] + prior.ring.lateral * length - reached.centre[1],
    ];

    // The ankle ring against the bare law, read about the law's own centre:
    // its radius and its height off its plane.
    const start: IBare = bare(family, 0);
    family.ankleResidual = PHASES.map(
      (t: number, j: number): number =>
        AutoMovieHumanPolarSection.radius(ankle, start.centre, t) -
        start.radii[j]!,
    );
    family.ankleLift = liftOf(ankle, start.centre, ankleWorld, bottom);

    // The crotch ring is read about the law's own last centre: read about its
    // own, a phase would slide round the outline over the last reach.
    family.crotchCentre = bare(family, LAST_INTERIOR).centre;
    return family;
  }

  /** The foot's top ring, world. */
  function ankleRing(
    calibration: IAutoMovieHumanBodyCalibration,
    side: "left" | "right",
  ): Vec3[] {
    const foot: IAutoMovieHumanLoftChain = calibration.chains.find(
      (c: IAutoMovieHumanLoftChain): boolean => c.name === `foot.${side}`,
    )!;
    return AutoMovieHumanLoftChain.ring(
      foot,
      foot.layers[foot.layers.length - 1]!.y,
      PHASES,
    );
  }

  /** The arc of the trunk's bottom ring that a leg takes, world, in its own phase order. */
  function crotchRing(
    calibration: IAutoMovieHumanBodyCalibration,
    side: "left" | "right",
  ): Vec3[] {
    const { trunk, arcs } = crotchArcs(calibration, side);
    return arcs.flatMap(([from, to]: [number, number]): Vec3[] =>
      AutoMovieHumanLoftChain.ring(trunk, trunk.layers[0]!.y, arcPhases(from, to)),
    );
  }

  /** The trunk and the arcs of its bottom ring a leg takes. */
  function crotchArcs(
    calibration: IAutoMovieHumanBodyCalibration,
    side: "left" | "right",
  ): { trunk: IAutoMovieHumanLoftChain; arcs: [number, number][] } {
    const trunk: IAutoMovieHumanLoftChain = calibration.chains.find(
      (c: IAutoMovieHumanLoftChain): boolean => c.name === "trunk",
    )!;
    const event: IAutoMovieHumanBodyCalibration.IEvent =
      calibration.events.find(
        (e: IAutoMovieHumanBodyCalibration.IEvent): boolean =>
          e.parent === "trunk" && e.direction === "down",
      )!;
    return {
      trunk,
      arcs: event.splits.find(
        (s: IAutoMovieHumanBodyCalibration.ISplit): boolean =>
          s.child === `leg.${side}`,
      )!.arcs,
    };
  }

  /** Phases along an arc, both ends included. */
  function arcPhases(from: number, to: number): number[] {
    const span: number = to >= from ? to - from : to + 2 * Math.PI - from;
    return Array.from(
      { length: RING },
      (_: unknown, i: number): number => from + (span * i) / (RING - 1),
    );
  }

  /** Mean height of a ring. */
  function level(ring: readonly Vec3[]): number {
    return (
      ring.reduce((s: number, p: Vec3): number => s + p[1], 0) / ring.length
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

  /** A ring's height off its plane at each canonical phase, read off its nearest edge. */
  function liftOf(
    ring: readonly [number, number][],
    centre: readonly [number, number],
    world: readonly Vec3[],
    level: number,
  ): number[] {
    return PHASES.map((t: number): number => {
      const r: number = AutoMovieHumanPolarSection.radius(ring, centre, t);
      const x: number = centre[0] + r * Math.cos(t);
      const z: number = centre[1] + r * Math.sin(t);
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
        const d: number = (p[0] + f * ex - x) ** 2 + (p[1] + f * ez - z) ** 2;
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
    const inner: number = R * radii[(3 * ORDER) / 4]!;
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

  /**
   * World points of the law's section at station s, canonical: in the bone's
   * plane when a frame is given, about the prior's centre at that height, with
   * the ankle ring's difference fading in. Without a frame, the horizontal
   * section at that height.
   */
  function lawPoints(
    family: IFamily,
    s: number,
    frame: IFrame | null,
  ): Vec3[] {
    const u: number = (s - family.bottom) / family.length;
    const b: IBare = bare(family, u);
    const low: number = 1 - smooth(u / ANKLE_REACH);
    const f: IFrame = frame ?? {
      origin: [b.centre[0], s, b.centre[1]],
      u: [1, 0, 0],
      v: [0, 0, 1],
      n: [0, 1, 0],
    };
    const centre: Vec3 = [b.centre[0], s, b.centre[1]];
    const cx: number = dot(sub(centre, f.origin), f.u);
    const cz: number = dot(sub(centre, f.origin), f.v);
    return PHASES.map((t: number, m: number): Vec3 => {
      const r: number = b.radii[m]! + low * family.ankleResidual[m]!;
      const h: number = low * family.ankleLift[m]!;
      const x: number = cx + r * Math.cos(t);
      const z: number = cz + r * Math.sin(t);
      return [0, 1, 2].map(
        (c: number): number =>
          f.origin[c]! + x * f.u[c]! + z * f.v[c]! + h * f.n[c]!,
      ) as Vec3;
    });
  }

  /** A side's bones, canonical. */
  interface IJoints {
    hip: Vec3;
    knee: Vec3;
    ankle: Vec3;
  }

  /** The hip, knee and ankle of a side, read in the canonical frame. */
  function jointsOf(
    skeleton: readonly AutoMovieHumanSkeletonLaw.IBone[],
    side: "left" | "right",
    sign: 1 | -1,
  ): IJoints {
    const at = (name: string): Vec3 => {
      const bone: AutoMovieHumanSkeletonLaw.IBone | undefined = skeleton.find(
        (b: AutoMovieHumanSkeletonLaw.IBone): boolean => b.bone === `${side}${name}`,
      );
      if (bone === undefined)
        throw new Error(`The skeleton lacks the ${side} ${name}`);
      return [bone.position[0], bone.position[1], sign * bone.position[2]];
    };
    return { hip: at("UpperLeg"), knee: at("LowerLeg"), ankle: at("Foot") };
  }

  /** A section plane, canonical, with its normal. */
  interface IFrame {
    origin: Vec3;
    u: Vec3;
    v: Vec3;
    n: Vec3;
  }

  /** One eased turn of the section normal about a fixed axis. */
  interface ITurn {
    from: number;
    span: number;
    axis: Vec3;
    angle: number;
  }

  /** The leg's frames along its stations. */
  interface IFrames {
    s0: number;
    s1: number;
    turns: ITurn[];
    twist: number;
    knee: Vec3;
    origins: Vec3[];
  }

  /**
   * The frames: vertical at the ankle ring, square to the shank, turned to the
   * thigh across the knee, and vertical again at the crotch ring.
   *
   * @param bones The side's joints, canonical.
   * @param s0 Station of the ankle ring.
   * @param s1 Station of the crotch ring.
   * @param knee Half of the knee's turn.
   * @param ankle Reach of the turn off the ankle ring.
   * @param crotch Reach of the turn onto the crotch ring.
   */
  function framesOf(
    bones: IJoints,
    s0: number,
    s1: number,
    knee: number,
    ankle: number,
    crotch: number,
  ): IFrames {
    const Y: Vec3 = [0, 1, 0];
    const shank: Vec3 = normalize(sub(bones.knee, bones.ankle));
    const thigh: Vec3 = normalize(sub(bones.hip, bones.knee));
    const turn = (a: Vec3, b: Vec3, from: number, span: number): ITurn => {
      const axis: Vec3 = cross(a, b);
      const sine: number = norm(axis);
      return {
        from,
        span,
        axis: sine > 1e-12 ? scale(axis, 1 / sine) : [1, 0, 0],
        angle: Math.atan2(sine, dot(a, b)),
      };
    };
    const frames: IFrames = {
      s0,
      s1,
      turns: [
        turn(Y, shank, s0, ankle),
        turn(shank, thigh, bones.knee[1] - knee, 2 * knee),
        turn(thigh, Y, s1 - crotch, crotch),
      ],
      twist: 0,
      knee: bones.knee,
      origins: [],
    };

    // The three turns leave a twist about the vertical, which runs out evenly.
    const end: Vec3 = rotated(frames, s1, [1, 0, 0], false);
    frames.twist = Math.atan2(-end[2], end[0]);

    // The origin runs along the section normal, through the knee.
    const n = (s: number): Vec3 => {
      const d: Vec3 = rotated(frames, s, Y, false);
      return scale(d, 1 / d[1]);
    };
    const count: number = Math.ceil(s1 - s0 + 2 * PAD);
    const origins: Vec3[] = [[0, s0 - PAD, 0]];
    for (let i: number = 0; i < count; i++) {
      const a: number = s0 - PAD + i;
      const p: Vec3 = origins[i]!;
      const q: Vec3 = plus(
        p,
        scale(plus(plus(n(a), scale(n(a + 0.5), 4)), n(a + 1)), 1 / 6),
      );
      origins.push([q[0], a + 1, q[2]]);
    }
    const anchor: Vec3 = interpolated(origins, n, s0 - PAD, bones.knee[1]);
    frames.origins = origins.map((p: Vec3): Vec3 => [
      p[0] - anchor[0] + bones.knee[0],
      p[1],
      p[2] - anchor[2] + bones.knee[2],
    ]);
    return frames;
  }

  /** A vector of the leg's straight frame carried to station s. */
  function rotated(frames: IFrames, s: number, x: Vec3, twisted: boolean = true): Vec3 {
    let out: Vec3 = twisted
      ? rotate(x, [0, 1, 0], -frames.twist * fifth((s - frames.s0) / (frames.s1 - frames.s0)))
      : x;
    for (const t of frames.turns)
      out = rotate(out, t.axis, t.angle * fifth((s - t.from) / t.span));
    return out;
  }

  /** A table's value at s by cubic Hermite, with derivatives from `rate`. */
  function interpolated(
    table: readonly Vec3[],
    rate: (s: number) => Vec3,
    first: number,
    s: number,
  ): Vec3 {
    const i: number = Math.max(
      0,
      Math.min(table.length - 2, Math.floor(s - first)),
    );
    const f: number = s - first - i;
    const a: Vec3 = table[i]!;
    const b: Vec3 = table[i + 1]!;
    const ma: Vec3 = rate(first + i);
    const mb: Vec3 = rate(first + i + 1);
    return [0, 1, 2].map(
      (c: number): number =>
        (2 * f ** 3 - 3 * f ** 2 + 1) * a[c]! +
        (f ** 3 - 2 * f ** 2 + f) * ma[c]! +
        (3 * f ** 2 - 2 * f ** 3) * b[c]! +
        (f ** 3 - f ** 2) * mb[c]!,
    ) as Vec3;
  }

  /** The frame at station s, canonical. */
  function frameAt(frames: IFrames, s: number): IFrame {
    const n: Vec3 = rotated(frames, s, [0, 1, 0], false);
    const origin: Vec3 = interpolated(
      frames.origins,
      (q: number): Vec3 => {
        const d: Vec3 = rotated(frames, q, [0, 1, 0], false);
        return scale(d, 1 / d[1]);
      },
      frames.s0 - PAD,
      s,
    );
    return {
      origin: [origin[0], s, origin[2]],
      u: rotated(frames, s, [1, 0, 0]),
      v: rotated(frames, s, [0, 0, 1]),
      n,
    };
  }

  /** The frame's station derivative at s; one-sided toward `side` when it is not 0. */
  function frameRate(frames: IFrames, s: number, side: 1 | -1 | 0): IFrame {
    const n: Vec3 = rotated(frames, s, [0, 1, 0], false);
    const derive = (pick: (f: IFrame) => Vec3): Vec3 => {
      if (side === 0) {
        const a: Vec3 = pick(frameAt(frames, s - FRAME_STEP));
        const b: Vec3 = pick(frameAt(frames, s + FRAME_STEP));
        return scale(sub(b, a), 1 / (2 * FRAME_STEP));
      }
      const d: number = side * FRAME_STEP;
      const p: Vec3 = pick(frameAt(frames, s));
      const a: Vec3 = pick(frameAt(frames, s + d));
      const b: Vec3 = pick(frameAt(frames, s + 2 * d));
      return [0, 1, 2].map(
        (c: number): number => (-3 * p[c]! + 4 * a[c]! - b[c]!) / (2 * d),
      ) as Vec3;
    };
    return {
      origin: scale(n, 1 / n[1]),
      u: derive((f: IFrame): Vec3 => f.u),
      v: derive((f: IFrame): Vec3 => f.v),
      n: derive((f: IFrame): Vec3 => f.n),
    };
  }

  /**
   * A canonical frame, or its station derivative, on a side: the origin and `u`
   * mirrored, and `v` mirrored and turned over, a linear map either way.
   */
  function placed(f: IFrame, sign: 1 | -1): AutoMovieHumanLoftFrame.IFrame {
    return {
      origin: [f.origin[0], f.origin[1], sign * f.origin[2]],
      u: [f.u[0], f.u[1], sign * f.u[2]],
      v: [sign * f.v[0], sign * f.v[1], f.v[2]],
    };
  }

  /** The crotch ring a leg takes, canonical: the trunk's arc, front pinch first. */
  interface IRoot {
    /** The arc from the front pinch round the outside to the rear pinch. */
    arc: Vec3[];

    /** The trunk's station derivative at each point of the arc, per mm up. */
    rates: Vec3[];

    /** Station of the ring. */
    y: number;

    /** Centre the ring's phases are read about, `[x, z]`. */
    centre: [number, number];

    /** The ring at depth 0 at the leg's phases, with its normals and outward slopes. */
    ring: ILoop;

    /** Corner size at the ring. */
    corner: number;

    /** The trunk's outward slope at each of the leg's phases, per mm down. */
    slopes: number[];

    /** Reach of each phase's slope into the leg, mm. */
    spans: number[];
  }

  /** The leg's start at a depth under the ring, at the leg's phases. */
  interface ILoop {
    points: Vec3[];
    normals: Vec3[];
    rates: Vec3[];

    /** Distance along the trunk's arc to the nearer pinch; 0 off the arc. */
    edges: number[];
  }

  /** The crotch ring a leg takes, with the trunk's own derivative along it. */
  function rootOf(
    calibration: IAutoMovieHumanBodyCalibration,
    side: "left" | "right",
    sign: 1 | -1,
    family: IFamily,
  ): IRoot {
    const { trunk, arcs } = crotchArcs(calibration, side);
    const y: number = trunk.layers[0]!.y;
    const phases: number[] = arcs.flatMap(([from, to]: [number, number]): number[] =>
      arcPhases(from, to),
    );
    const at = (s: number): Vec3[] =>
      AutoMovieHumanLoftChain.ring(trunk, s, phases).map(
        (p: Vec3): Vec3 => [p[0], p[1], sign * p[2]],
      );
    const here: Vec3[] = at(y);
    const a: Vec3[] = at(y + TRUNK_STEP);
    const b: Vec3[] = at(y + 2 * TRUNK_STEP);
    const rates: Vec3[] = here.map((p: Vec3, i: number): Vec3 =>
      [0, 1, 2].map(
        (c: number): number =>
          (-3 * p[c]! + 4 * a[i]![c]! - b[i]![c]!) / (2 * TRUNK_STEP),
      ) as Vec3,
    );

    // Front pinch first: the front pinch stands ahead of the rear one.
    const forward: boolean = here[0]![0] >= here[here.length - 1]![0];
    const arc: Vec3[] = forward ? here : [...here].reverse();
    const ordered: Vec3[] = forward ? rates : [...rates].reverse();
    let perimeter: number = norm(sub(arc[0]!, arc[arc.length - 1]!));
    for (let i: number = 1; i < arc.length; i++)
      perimeter += norm(sub(arc[i]!, arc[i - 1]!));
    const root: IRoot = {
      arc,
      rates: ordered,
      y,
      centre: family.crotchCentre,
      ring: { points: [], normals: [], rates: [], edges: [] },
      corner: (CORNER * perimeter) / ORDER,
      slopes: [],
      spans: [],
    };
    root.ring = loopOf(root, 0);

    // The trunk's outward slope at each phase. Near a pinch it is the fold
    // opening, which the leg's rounded corner does not share; it fades there
    // over the join's taper.
    root.slopes = root.ring.rates.map(
      (rate: Vec3, m: number): number =>
        (smooth(root.ring.edges[m]! / TAPER) * dot(rate, root.ring.normals[m]!)) /
        rate[1],
    );

    // Each phase's reach is the longest whose lump stays within the bound, for
    // the steepest slope near it, read over the ring's own length so that the
    // reach changes along the ring no faster than the slopes do.
    const ring: Vec3[] = root.ring.points;
    const along: number[] = [0];
    for (let m: number = 1; m <= ORDER; m++)
      along.push(along[m - 1]! + norm(sub(ring[m % ORDER]!, ring[m - 1]!)));
    const whole: number = along[ORDER]!;
    const apart = (a: number, b: number): number => {
      const d: number = Math.abs(along[a]! - along[b]!);
      return Math.min(d, whole - d);
    };
    // The fade at a pinch is as fast as the join's, a few of the leg's
    // controls; carried into the skin it would turn the ring there, so the
    // slopes are read over a taper's length of ring, which leaves the open arc
    // as it is and widens only the fade.
    const blurred: number[] = ring.map((_: Vec3, m: number): number => {
      let weight: number = 0;
      let sum: number = 0;
      for (let k: number = 0; k < ORDER; k++) {
        const d: number = apart(m, k);
        if (d > 3 * TAPER) continue;
        const w: number = Math.exp(-((d / TAPER) ** 2) / 2);
        weight += w;
        sum += w * root.slopes[k]!;
      }
      return sum / weight;
    });
    root.slopes = blurred;
    const steepest: number[] = ring.map((_: Vec3, m: number): number => {
      let most: number = 0;
      for (let k: number = 0; k < ORDER; k++)
        if (apart(m, k) <= 2 * TAPER) most = Math.max(most, Math.abs(root.slopes[k]!));
      return most;
    });
    const reach: number = reachOf(family);
    root.spans = ring.map((_: Vec3, m: number): number => {
      let weight: number = 0;
      let sum: number = 0;
      for (let k: number = 0; k < ORDER; k++) {
        const d: number = apart(m, k);
        if (d > 3 * TAPER) continue;
        const w: number = Math.exp(-((d / TAPER) ** 2) / 2);
        weight += w;
        sum += w * steepest[k]!;
      }
      return 1 / (1 / reach + (HUMP * (sum / weight)) / BULGE);
    });
    return root;
  }

  /**
   * The ring at a depth under it, rounded: each pinch's corner is a fillet whose
   * sides run {@link GROWTH} mm along the arc and the slit per mm of depth,
   * read at the leg's phases about the ring's centre.
   */
  function loopOf(root: IRoot, depth: number): ILoop {
    const arc: Vec3[] = root.arc;
    const n: number = arc.length;
    const front: Vec3 = arc[0]!;
    const rear: Vec3 = arc[n - 1]!;
    const slit: number = norm(sub(front, rear));
    const lengths: number[] = [0];
    for (let i: number = 1; i < n; i++)
      lengths.push(lengths[i - 1]! + norm(sub(arc[i]!, arc[i - 1]!)));
    const total: number = lengths[n - 1]!;
    // The corner opens from rest, so the ring's own derivative stays the
    // trunk's, and then at the fold's rate.
    const size: number = Math.min(
      root.corner + GROWTH * (Math.hypot(depth, root.corner) - root.corner),
      CORNER_SHARE * slit,
      CORNER_SHARE * total,
    );

    // A point of the arc at a length from its start, with its rate and tangent.
    const along = (s: number): { p: Vec3; d: Vec3; t: Vec3 } => {
      let i: number = 1;
      while (i < n - 1 && lengths[i]! < s) i++;
      const f: number = (s - lengths[i - 1]!) / (lengths[i]! - lengths[i - 1]! || 1);
      return {
        p: lerp(arc[i - 1]!, arc[i]!, f),
        d: lerp(root.rates[i - 1]!, root.rates[i]!, f),
        t: normalize(sub(arc[i]!, arc[i - 1]!)),
      };
    };

    // The slit carries the pinches' rates, on the midline.
    const slitRate = (f: number): Vec3 => {
      const r: Vec3 = lerp(root.rates[n - 1]!, root.rates[0]!, f);
      return [r[0], r[1], 0];
    };
    const start = along(size);
    const end = along(total - size);
    const toFront: Vec3 = normalize(sub(front, rear));
    const nearRear: Vec3 = plus(rear, scale(toFront, size));
    const nearFront: Vec3 = sub(front, scale(toFront, size));
    const fillet = (
      p: Vec3,
      tp: Vec3,
      q: Vec3,
      tq: Vec3,
      dp: Vec3,
      dq: Vec3,
      ep: number,
      eq: number,
    ): { points: Vec3[]; rates: Vec3[]; edges: number[] } => {
      const lambda: number = norm(sub(q, p));
      const points: Vec3[] = [];
      const rates: Vec3[] = [];
      const edges: number[] = [];
      for (let k: number = 1; k < FILLET; k++) {
        const x: number = k / FILLET;
        edges.push(ep + (eq - ep) * x);
        points.push(
          [0, 1, 2].map(
            (c: number): number =>
              (2 * x ** 3 - 3 * x ** 2 + 1) * p[c]! +
              (x ** 3 - 2 * x ** 2 + x) * lambda * tp[c]! +
              (3 * x ** 2 - 2 * x ** 3) * q[c]! +
              (x ** 3 - x ** 2) * lambda * tq[c]!,
          ) as Vec3,
        );
        rates.push(lerp(dp, dq, x));
      }
      return { points, rates, edges };
    };

    // Round the loop: the arc, the rear fillet, the slit, the front fillet.
    // Each point keeps its distance along the arc from the nearer pinch.
    const points: Vec3[] = [];
    const rates: Vec3[] = [];
    const edges: number[] = [];
    points.push(start.p);
    rates.push(start.d);
    edges.push(size);
    for (let i: number = 1; i < n - 1; i++)
      if (lengths[i]! > size && lengths[i]! < total - size) {
        points.push(arc[i]!);
        rates.push(root.rates[i]!);
        edges.push(Math.min(lengths[i]!, total - lengths[i]!));
      }
    points.push(end.p);
    rates.push(end.d);
    edges.push(size);
    const back = fillet(
      end.p,
      end.t,
      nearRear,
      toFront,
      end.d,
      slitRate(size / slit),
      size,
      0,
    );
    points.push(...back.points);
    rates.push(...back.rates);
    edges.push(...back.edges);
    for (let k: number = 0; k <= SLIT; k++) {
      const f: number = (size + ((slit - 2 * size) * k) / SLIT) / slit;
      points.push(lerp(rear, front, f));
      rates.push(slitRate(f));
      edges.push(0);
    }
    const fore = fillet(
      nearFront,
      toFront,
      start.p,
      start.t,
      slitRate(1 - size / slit),
      start.d,
      0,
      size,
    );
    points.push(...fore.points);
    rates.push(...fore.rates);
    edges.push(...fore.edges);

    // Outward normals at the loop's vertices, horizontal.
    const count: number = points.length;
    let area: number = 0;
    points.forEach((p: Vec3, i: number): void => {
      const q: Vec3 = points[(i + 1) % count]!;
      area += p[0] * q[2] - q[0] * p[2];
    });
    const turn: number = area >= 0 ? 1 : -1;
    const normals: Vec3[] = points.map((_: Vec3, i: number): Vec3 => {
      const t: Vec3 = sub(points[(i + 1) % count]!, points[(i + count - 1) % count]!);
      return normalize([turn * t[2], 0, -turn * t[0]]);
    });

    // Read at the leg's phases: the farthest crossing of each ray.
    const out: ILoop = { points: [], normals: [], rates: [], edges: [] };
    for (const t of PHASES) {
      const dx: number = Math.cos(t);
      const dz: number = Math.sin(t);
      let best: number = -1;
      let at: number = 0;
      let share: number = 0;
      for (let i: number = 0; i < count; i++) {
        const a: Vec3 = points[i]!;
        const b: Vec3 = points[(i + 1) % count]!;
        const ex: number = b[0] - a[0];
        const ez: number = b[2] - a[2];
        const det: number = ez * dx - ex * dz;
        if (Math.abs(det) < 1e-12) continue;
        const sx: number = a[0] - root.centre[0];
        const sz: number = a[2] - root.centre[1];
        const r: number = (ez * sx - ex * sz) / det;
        const f: number = (dz * sx - dx * sz) / det;
        if (r > best && f >= 0 && f < 1) {
          best = r;
          at = i;
          share = f;
        }
      }
      const j: number = (at + 1) % count;
      out.points.push(lerp(points[at]!, points[j]!, share));
      out.normals.push(normalize(lerp(normals[at]!, normals[j]!, share)));
      out.rates.push(lerp(rates[at]!, rates[j]!, share));
      out.edges.push(edges[at]! + share * (edges[j]! - edges[at]!));
    }
    return out;
  }

  /** Reach under the crotch ring over which the leg hands over to it. */
  function reachOf(family: IFamily): number {
    return (1 - LAST_INTERIOR) * family.length;
  }

  /** One station's section: its frame and its points in it, `[x, z, lift]`. */
  interface ISection {
    frame: IFrame;
    local: Vec3[];
  }

  /** The section at station s, canonical. */
  function sectionOf(
    family: IFamily,
    frames: IFrames,
    root: IRoot,
    s: number,
  ): ISection {
    const frame: IFrame = frameAt(frames, s);
    const law: Vec3[] = lawPoints(family, s, frame);
    const reach: number = reachOf(family);
    const depth: number = Math.max(0, root.y - s);
    let world: Vec3[] = law;
    if (depth < reach) {
      // The ring leaves straight down and hands over to the law at an even
      // rate, so the difference between them turns the skin no more than it
      // must.
      const w: number = 1 - handover(depth / reach);
      const loop: ILoop = loopOf(root, depth);
      world = law.map((p: Vec3, m: number): Vec3 => {
        const q: Vec3 = loop.points[m]!;
        const ring: Vec3 = [q[0], q[1] - root.y + s, q[2]];
        const base: Vec3 = lerp(p, ring, w);

        // The trunk's outward slope at the ring, carried in by a quintic that
        // meets the leg's own surface with neither place, slope nor curvature,
        // over the longest reach that keeps its lump within the join's bound.
        // Near a pinch the trunk's slope is its fold opening, which the leg's
        // rounded corner does not share; it fades there over the join's taper.
        // The skin moves along the ring's own ray, a field as smooth as the
        // phases, by what moves it along its normal as far.
        const at: Vec3 = root.ring.points[m]!;
        const normal: Vec3 = root.ring.normals[m]!;
        const slope: number = root.slopes[m]!;
        const span: number = root.spans[m]!;
        const x: number = Math.min(1, depth / span);
        const ray: Vec3 = normalize([at[0] - root.centre[0], 0, at[2] - root.centre[1]]);
        const facing: number = Math.max(FACING, dot(ray, normal));
        const lever: number = x - 6 * x ** 3 + 8 * x ** 4 - 3 * x ** 5;
        return plus(base, scale(ray, (-slope * span * lever) / facing));
      });
    }

    // The thighs meet at the midline and do not pass it.
    const local: Vec3[] = world.map((p: Vec3): Vec3 => {
      const z: number = p[2] >= 0 ? p[2] : CONTACT * Math.tanh(p[2] / CONTACT);
      const d: Vec3 = sub([p[0], p[1], z], frame.origin);
      return [dot(d, frame.u), dot(d, frame.v), dot(d, frame.n)];
    });
    return { frame, local };
  }

  /** Control values of canonical in-plane samples on a side. */
  function sided(
    local: readonly Vec3[],
    sign: 1 | -1,
  ): { coefficients: number[]; lift: number[] } {
    const read = (m: number): Vec3 =>
      local[sign === 1 ? m : (ORDER - m) % ORDER]!;
    const samples: Vec3[] = local.map((_: Vec3, m: number): Vec3 => read(m));
    return {
      coefficients: AutoMovieHumanSplineCurve.interpolate(
        samples.map((p: Vec3): [number, number] => [p[0], sign * p[1]]),
      ),
      lift: AutoMovieHumanSplineCurve.interpolate(
        samples.map((p: Vec3): [number, number] => [p[2], 0]),
      ).slice(0, ORDER),
    };
  }

  /** A joint's bend, along the leg. */
  interface IBend {
    /** Station of the joint. */
    at: number;

    /** Half of the bend's length, mm. */
    half: number;

    /** The joint's whole range of motion, radians. */
    range: number;
  }

  /**
   * Stations of the layers, by equidistribution of one density: at least one
   * layer per coarsest spacing; within a joint's bend, one per
   * {@link ROW_TURN} of the turn the joint's whole range puts there; under the
   * crotch ring, doubling from the trunk's first row.
   */
  function stationsOf(
    s0: number,
    s1: number,
    bends: readonly IBend[],
    first: number,
    coarsest: number,
  ): number[] {
    const density = (s: number): number => {
      let m: number = 1 / coarsest;
      for (const b of bends) {
        const x: number = (s - b.at) / b.half;
        if (Math.abs(x) >= 1) continue;
        const y: number = (x + 1) / 2;
        const rate: number = (30 * y * y * (1 - y) * (1 - y)) / (2 * b.half);
        m = Math.max(m, (b.range * rate) / ROW_TURN);
      }
      return Math.max(m, 1 / (Math.LN2 * (first + (s1 - s))));
    };
    const steps: number = Math.ceil((s1 - s0) / DENSITY_STEP);
    const h: number = (s1 - s0) / steps;
    const sums: number[] = [0];
    for (let i: number = 0; i < steps; i++) {
      const a: number = s0 + i * h;
      sums.push(
        sums[i]! +
          ((density(a) + 4 * density(a + h / 2) + density(a + h)) * h) / 6,
      );
    }
    const count: number = Math.ceil(sums[steps]! - 1e-9);
    const out: number[] = [s0];
    let i: number = 0;
    for (let k: number = 1; k < count; k++) {
      const goal: number = (sums[steps]! * k) / count;
      while (sums[i + 1]! < goal) i++;
      const f: number = (goal - sums[i]!) / (sums[i + 1]! - sums[i]!);
      out.push(s0 + (i + f) * h);
    }
    out.push(s1);
    return out;
  }

  /** A leg joint's whole range of motion along its flexion channel, radians. */
  function range(channel: keyof typeof RANGES): number {
    const [low, high] = RANGES[channel];
    return ((high - low) * Math.PI) / 180;
  }

  /** The prior's finest knot pitch, in leg lengths. */
  function coarsest(): number {
    const s: readonly number[] = AutoMovieHumanLegPrior.PRIOR.stations;
    let least: number = Infinity;
    for (let i: number = 1; i < s.length; i++)
      least = Math.min(least, s[i]! - s[i - 1]!);
    return least;
  }
}

type Vec3 = [number, number, number];

function plus(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function sub(a: readonly number[], b: readonly number[]): Vec3 {
  return [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function dot(a: readonly number[], b: readonly number[]): number {
  return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function norm(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]);
}

function normalize(a: Vec3): Vec3 {
  return scale(a, 1 / (norm(a) || 1));
}

function lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/** A vector turned about a unit axis (Rodrigues). */
function rotate(v: Vec3, axis: Vec3, angle: number): Vec3 {
  if (angle === 0) return v;
  const c: number = Math.cos(angle);
  const s: number = Math.sin(angle);
  const k: Vec3 = cross(axis, v);
  const d: number = dot(axis, v) * (1 - c);
  return [
    v[0] * c + k[0] * s + axis[0] * d,
    v[1] * c + k[1] * s + axis[1] * d,
    v[2] * c + k[2] * s + axis[2] * d,
  ];
}

/** Smoothstep clamped to [0, 1]. */
function smooth(x: number): number {
  const t: number = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

/** Smootherstep clamped to [0, 1], flat to the second derivative at both ends. */
function fifth(x: number): number {
  const t: number = Math.min(1, Math.max(0, x));
  return t * t * t * (t * (6 * t - 15) + 10);
}

/**
 * A step from 0 to 1 at an even rate, its rate eased in and out by the
 * smootherstep over {@link EASE} of its length at each end, so it is flat to
 * the second derivative at both ends and its steepest rate is `1 / (1 - EASE)`.
 */
function handover(x: number): number {
  const t: number = Math.min(1, Math.max(0, x));
  const k: number = 1 / (1 - EASE);
  const eased = (y: number): number => EASE * (y ** 6 - 3 * y ** 5 + 2.5 * y ** 4);
  if (t <= EASE) return k * eased(t / EASE);
  if (t >= 1 - EASE) return 1 - k * eased((1 - t) / EASE);
  return k * (EASE / 2 + (t - EASE));
}

/** Control points of a leg section. */
const ORDER: number = 256;

/** Uniform phases of a leg ring. */
const SAMPLES: number = 256;

/** Samples of a neighbour's ring arc. */
const RING: number = 512;

/** Uniform phases of the radial tables, radians, one per control point. */
const PHASES: number[] = Array.from(
  { length: ORDER },
  (_: unknown, j: number): number => (2 * Math.PI * j) / ORDER,
);

/** Station step of the section differences, mm. */
const STEP: number = 0.05;

/** Station step of the frame differences, mm. */
const FRAME_STEP: number = 0.01;

/** Height step of the trunk's derivative at its ring, mm. */
const TRUNK_STEP: number = 0.02;

/** Margin of the origin's table past the rings, mm. */
const PAD: number = 2;

/** Integration step of the layer density, mm. */
const DENSITY_STEP: number = 0.25;

/**
 * Last fraction the law holds alone; over the rest the leg hands over to the
 * crotch ring, a rise of some 60 mm on a body of average height.
 */
const LAST_INTERIOR: number = 0.92;

/** Softness of the thighs' contact at the midline, mm. */
const CONTACT: number = 1.5;

/** Fraction over which the ankle ring's difference from the law fades. */
const ANKLE_REACH: number = 0.12;

/** Fraction where the thigh starts to lean onto the crotch ring's place. */
const THIGH_FROM: number = 0.6;

/**
 * Skin depths either side of a joint over which its bend spreads, as the
 * rig's cut does: the knee's frames turn over it, and its rows are spaced in it.
 */
const BEND: number = 1.5;

/**
 * The leg joints' flexion ranges in degrees, the pose channels'
 * `legs.<side>.*` rows (`AutoMovieHumanPoseChannels`, sourced in
 * `docs/anatomy/joint-range.md`), which generation may not import.
 */
const RANGES: Readonly<
  Record<"ankle.dorsiflexion" | "knee.flexion" | "hip.flexion", readonly [number, number]>
> = {
  "ankle.dorsiflexion": [-58.35, 13.25],
  "knee.flexion": [-1.3, 139.8],
  "hip.flexion": [-17.75, 132.1],
};

/** Largest turn of a row under a joint's whole range of motion, radians. */
const ROW_TURN: number = (12 * Math.PI) / 180;

/**
 * The corner's size at the ring, in the leg's control pitches: two, the
 * narrowest turn its controls carry.
 */
const CORNER: number = 2;

/**
 * Growth of the corner's sides per mm of depth: the trunk's crotch fold leaves
 * the midline as fast as it rises, and the leg's corner opens at that rate.
 */
const GROWTH: number = 1;

/** Largest share of the slit or the arc a corner may take. */
const CORNER_SHARE: number = 0.45;

/** Samples of a fillet. */
const FILLET: number = 24;

/** Samples of the slit. */
const SLIT: number = 32;

/** Largest lump the trunk's slope may raise off the leg's own surface, as the event join's, mm. */
const BULGE: number = 4;

/** Arc length from a pinch over which the trunk's slope comes in, as the event join's, mm. */
const TAPER: number = 6;

/** Highest point of the quintic `x - 6x^3 + 8x^4 - 3x^5`, at a third. */
const HUMP: number = 16 / 81;

/** Least cosine between a ring's ray and its normal a slope is carried along. */
const FACING: number = 0.3;

/** Share of the crotch's handover at each end over which its rate eases. */
const EASE: number = 0.25;

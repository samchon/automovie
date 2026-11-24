import {
  AutoMovieLoftContract,
  AutoMovieLoftSectionNative,
  AutoMovieLoftViewRead,
  AutoMovieViewOutline,
} from "@automovie/engine";
import type {
  IAutoMovieHumanHeadLayout,
  IAutoMovieHumanHeadLipContact,
  IAutoMovieLoftSectionConnect,
  IAutoMovieLoftSectionFrame,
  IAutoMovieLoftSectionJet,
  IAutoMovieLoftSectionPhase,
  IAutoMovieLoftViewRead,
  IAutoMovieViewAxisJet,
  IAutoMovieViewOutline,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanLoftStations } from "../../lofting/AutoMovieHumanLoftStations";
import { AutoMovieHumanHeadLipContact } from "./AutoMovieHumanHeadLipContact";
import { AutoMovieHumanHeadLipJet } from "./AutoMovieHumanHeadLipJet";

/** Value, station, phase, station², station-phase and phase². */
type Jet = AutoMovieHumanHeadLipJet.Jet;

/** Scalar operations shared by the lip and adjacent folds. */
const { add, chord, compose, multiply, quotient, subtract } =
  AutoMovieHumanHeadLipJet;

/**
 * Neutral lip skin in the face's own regular level chart. The two source chords
 * still locate the outer vermilion, resting line and shared cheilia. A forward
 * height over that chart gives each region its authored relief. All three named
 * boundaries inherit the face's position and its first two derivatives,
 * including the mouth corners where the chord width collapses.
 *
 * @evidence contracts/common.md#principled-implementation Uses the original Euclidean chord and shared parent field, with an exact second-order continuation at the source boundaries.
 * @evidence contracts/common.md#clear-and-simple-design One forward graph covers both opposed lips and their common resting line.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Never traces a transverse crossing at a collapsed lip pole, reads a fitted mesh or alters a landmark.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes the authored border and relief from the estimated transverse shape and rendering density.
 * @evidence contracts/performance.md#efficient-algorithms Preparation admits one parent and two one-dimensional outline curves. Queries reject the other hemisphere and exterior lateral and station bounds before inverting the prepared resting section.
 * @evidence contracts/performance.md#reuse-equivalent-work Each region reuses the exact support knots of its original lip and both regions share the resting section preparation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains one invocation-owned parent and its prepared native section readers.
 */
export namespace AutoMovieHumanHeadLipSkin {
  /**
   * Uniform drawing intervals over each estimated lobe, independent of its
   * analytic field.
   */
  const INTERVALS: number = 8;

  /** ESTIMATE: less than half a pixel at the 68 mm, 560-pixel close-up. */
  const CHORD: number = 0.05;

  /** The original skin landmark and transverse dimensions of a lip neighbor. */
  export interface INeighbor {
    /** Distal skin plane in world millimetres. */
    station: number;
    /** The outer reach of the lateral field in world millimetres. */
    width: number;
    /** The original depression's positive depth, millimetres. */
    depth: number;
    /** Lateral distance of the two philtral columns from the median plane. */
    crest?: number;
  }

  /**
   * Extend the exact same call-owned head mass with its two neutral lip
   * regions.
   */
  export function of(
    mass: IAutoMovieViewPart,
    plan: Pick<IAutoMovieHumanHeadLayout, "mouthWidth" | "stomion" | "lips">,
    upper: IAutoMovieViewPart,
    lower: IAutoMovieViewPart,
    neighbors?: readonly [INeighbor | undefined, INeighbor | undefined],
  ): IAutoMovieViewPart {
    if (mass.originalSection !== undefined)
      throw new Error("Lip skin needs the head's original level sections");
    const resting: IAutoMovieHumanHeadLipContact.IContact =
      AutoMovieHumanHeadLipContact.create(mass, plan.stomion);
    const read: ReturnType<typeof AutoMovieLoftViewRead.prepare> =
      AutoMovieLoftViewRead.prepare(resting.source);
    const half: number = plan.mouthWidth;
    const regions = [upper, lower].map((part, index) => {
      const outline = AutoMovieViewOutline.create(part.front.positive, {
        bottom: -half,
        top: half,
      });
      if ("detail" in outline) throw new Error(outline.detail);
      const maximum: number =
        2 *
        Math.max(
          ...outline.knots.map(({ value }) => value),
          ...AutoMovieViewOutline.criticalStations(outline).map((z) =>
            value(outline, z),
          ),
        );
      const relief: number = plan.lips[index]!;
      const height: number = 2 * value(outline, 0);
      // The original lip section is an ellipse. At its contact end the
      // osculating circle has radius b²/a. Its 45° sagitta sets the inward roll
      // scale. The half-chord bound retains the point of maximum source relief.
      const contactRoll: number = Math.min(
        0.5,
        (1 - Math.SQRT1_2) * 2 * (relief / height) ** 2,
      );
      const neighbor: INeighbor | undefined = neighbors?.[index];
      return {
        outline,
        maximum,
        relief,
        height,
        contactRoll,
        adjacent:
          neighbor === undefined
            ? undefined
            : {
                ...neighbor,
                at: resting.level(neighbor.station),
              },
      };
    });
    const domain: [number, number] = [
      Math.min(
        plan.stomion - regions[1]!.maximum,
        regions[1]!.adjacent?.station ?? plan.stomion,
      ),
      Math.max(
        plan.stomion + regions[0]!.maximum,
        regions[0]!.adjacent?.station ?? plan.stomion,
      ),
    ];

    /** Read only the conditioned part of the original stationary footprint. */
    const displacement = (
      y: number,
      phase: number,
      x: Jet,
      z: Jet,
      heights: boolean,
    ): Jet | null => {
      const dy: number = y - plan.stomion;
      if (dy === 0 || Math.cos(phase) <= 0 || Math.abs(z[0]) >= half)
        return null;
      const { outline, maximum, relief, contactRoll, adjacent } =
        regions[dy > 0 ? 0 : 1]!;
      const withinNeighbor =
        adjacent !== undefined &&
        Math.abs(z[0]) < adjacent.width &&
        Math.abs(dy) < Math.abs(adjacent.station - plan.stomion)
          ? adjacent
          : undefined;
      if (
        (Math.abs(dy) >= maximum || relief === 0) &&
        withinNeighbor === undefined
      )
        return null;
      const height: IAutoMovieViewOutline.IReading | string | null = heights
        ? AutoMovieViewOutline.at(outline, z[0])
        : null;
      if (
        typeof height === "string" ||
        (height !== null && height.stationJet === null)
      )
        throw new Error("Lip skin needs a regular interior border reading");
      const h: number = 2 * (height?.value ?? value(outline, z[0]));
      if (Math.abs(dy) >= h && withinNeighbor === undefined) return null;
      const rest: IAutoMovieHumanHeadLipContact.IReading = resting.at(z[0]);
      if (rest.forwardJet === null)
        throw new Error("Lip skin needs a regular stomion line");
      const dx: Jet = subtract(
        x,
        compose(z, rest.point[0], ...rest.forwardJet),
      );
      const distance: number = Math.hypot(dx[0], dy);
      const distanceJet: Jet = chord(dx, [dy, 1, 0, 0, 0, 0], distance);
      const [dh, ddh] = height?.stationJet ?? [0, 0];
      const size: Jet = compose(z, h, 2 * dh, 2 * ddh);
      if (distance >= h) {
        if (withinNeighbor === undefined) return null;
        const end: IAutoMovieHumanHeadLipContact.IReading = withinNeighbor.at(
          z[0],
        );
        if (end.forwardJet === null)
          throw new Error("Lip neighbor needs a regular end line");
        const delta: Jet = compose(
          z,
          end.point[0] - rest.point[0],
          end.forwardJet[0] - rest.forwardJet[0],
          end.forwardJet[1] - rest.forwardJet[1],
        );
        const vertical: number = withinNeighbor.station - plan.stomion;
        const extent: Jet = chord(
          delta,
          [vertical, 0, 0, 0, 0, 0],
          Math.hypot(delta[0], vertical),
        );
        if (extent[0] <= size[0]) return null;
        const progress: Jet = quotient(
          subtract(distanceJet, size),
          subtract(extent, size),
        );
        const q: number = progress[0];
        if (!(q > 0 && q < 1)) return null;
        const cross: number = 4 * q * (1 - q);
        const bump: Jet = compose(
          compose(progress, cross, 4 - 8 * q, -8),
          cross ** 3,
          3 * cross ** 2,
          6 * cross,
        );
        return multiply(bump, neighboringProfile(z, withinNeighbor));
      }
      if (relief === 0) return null;
      const progress: Jet = quotient(distanceJet, size);
      const q: number = progress[0];
      const lateralDistance: number = Math.abs(z[0]);
      const w: number =
        ((half - lateralDistance) * (half + lateralDistance)) / half ** 2;
      // Perlin's C2 endpoint polynomial in squared lateral radius. The third
      // order zero dominates the width's square-root pole and its derivatives.
      const taper: number = w ** 3 * (10 + w * (-15 + 6 * w));
      // The original side relief grows as sin(theta) from each cheilion.
      const nativeRelief: number = Math.sqrt(w);
      // Preserve the source half-ellipse away from the two end transitions.
      // The contact uses the osculating roll; the outer half fades into skin.
      const cross: [number, number, number] = sectionProfile(q, contactRoll);
      if (height === null)
        return [relief * nativeRelief * taper * cross[0], 0, 0, 0, 0, 0];

      const bump: Jet = compose(progress, ...cross);
      const lateral: Jet = compose(
        z,
        w,
        (-2 * z[0]) / half ** 2,
        -2 / half ** 2,
      );
      const original: Jet = compose(
        lateral,
        relief * nativeRelief,
        relief / (2 * nativeRelief),
        -relief / (4 * nativeRelief ** 3),
      );
      return multiply(multiply(bump, original), fade(lateral));
    };

    const section: IAutoMovieLoftSectionConnect.IOriginal = {
      name: "head.mass.perioral",
      domain,
      point(y, phase) {
        return pointAt(y)(phase);
      },
      phase(y, phase) {
        const local: IAutoMovieLoftSectionPhase =
          AutoMovieLoftSectionNative.phase(values(y))(phase);
        const frame = mass.axis.at(y);
        const delta: Jet | null = displacement(
          y,
          phase,
          [frame.origin[0] + local.p[0], 0, local.t[0], 0, 0, local.tt[0]],
          [frame.origin[2] + local.p[1], 0, local.t[1], 0, 0, local.tt[1]],
          true,
        );
        if (delta !== null) {
          local.p[0] += delta[0];
          local.t[0] += delta[2];
          local.tt[0] += delta[5];
        }
        return local;
      },
      jet(y, phase) {
        const scalars = read.jets(y);
        if (typeof scalars === "string") throw new Error(scalars);
        const local: IAutoMovieLoftSectionJet =
          AutoMovieLoftSectionNative.jet(scalars)(phase);
        const frame: IAutoMovieViewAxisJet.IJet | null =
          mass.axis.jet?.(y) ?? null;
        if (frame === null)
          throw new Error("Lip skin needs the level frame jet");
        const world = (axis: 0 | 2, coordinate: 0 | 1): Jet => [
          frame.value.origin[axis] + local.p[coordinate],
          frame.first.origin[axis] + local.s[coordinate],
          local.t[coordinate],
          frame.second.origin[axis] + local.ss[coordinate],
          local.st[coordinate],
          local.tt[coordinate],
        ];
        const delta: Jet | null = displacement(
          y,
          phase,
          world(0, 0),
          world(2, 1),
          true,
        );
        if (delta !== null) {
          local.p[0] += delta[0];
          local.s[0] += delta[1];
          local.t[0] += delta[2];
          local.ss[0] += delta[3];
          local.st[0] += delta[4];
          local.tt[0] += delta[5];
        }
        return local;
      },
    };

    function values(y: number): IAutoMovieLoftViewRead.IValues {
      const result: IAutoMovieLoftViewRead.IValues | string = read.values(y);
      if (typeof result === "string") throw new Error(result);
      return result;
    }

    /** Prepare the original scalar and frame readers once per sampled ring. */
    function pointAt(
      y: number,
      frame: IAutoMovieLoftSectionFrame = mass.axis.at(y),
    ): (phase: number) => [number, number] {
      const at: ReturnType<typeof AutoMovieLoftSectionNative.point> =
        AutoMovieLoftSectionNative.point(values(y));
      return (phase: number): [number, number] => {
        const local: [number, number] = at(phase);
        const delta: Jet | null = displacement(
          y,
          phase,
          [frame.origin[0] + local[0], 0, 0, 0, 0, 0],
          [frame.origin[2] + local[1], 0, 0, 0, 0, 0],
          false,
        );
        if (delta !== null) local[0] += delta[0];
        return local;
      };
    }

    const stations: number[] = [...mass.stations];
    const gap: number = AutoMovieLoftContract.splineGap(stations);
    for (const [index, region] of regions.entries()) {
      const sign = index === 0 ? 1 : -1;
      const fractions: number[] = Array.from(
        { length: INTERVALS + 1 },
        (_, i) => i / INTERVALS,
      );
      for (const fraction of fractions)
        addStation(plan.stomion + sign * region.maximum * fraction);
      for (const fraction of fractions.slice(1))
        addStation(
          resting.section(
            0,
            region.height * region.contactRoll * fraction,
            sign,
            null,
          ).border[1],
        );
      if (region.adjacent !== undefined) {
        const border: number = resting.section(0, region.height, sign, null)
          .border[1];
        for (const fraction of fractions)
          addStation(border + (region.adjacent.station - border) * fraction);
      }
    }
    function addStation(s: number): void {
      if (stations.every((station) => Math.abs(station - s) >= gap))
        stations.push(s);
    }
    const retained: number[] = stations.filter(
      (s) => s > domain[0] && s < domain[1],
    );
    const refined: number[] = AutoMovieHumanLoftStations.bisectRings(
      [domain[0], ...retained.sort((a, b) => a - b), domain[1]],
      (phases) => {
        // The face uses only the forward semicircle. Interleave both halves of
        // each original phase interval there to resolve the philtral columns.
        const halfPitch: number = (phases[1]! - phases[0]!) / 2;
        const forward: number[] = phases
          .flatMap((phase) => [phase, phase + halfPitch])
          .filter((phase) => Math.cos(phase) > 0);
        return (s) => {
          const frame: IAutoMovieLoftSectionFrame = mass.axis.at(s);
          const at = pointAt(s, frame);
          return forward.map((phase): [number, number, number] => {
            const [x, z] = at(phase);
            return [frame.origin[0] + x, s, frame.origin[2] + z];
          });
        };
      },
      CHORD,
    );
    for (const station of refined) addStation(station);
    return {
      ...mass,
      stations: [...new Set(stations)].sort((a, b) => a - b),
      originalSection: section,
    };
  }

  /** Philtral trough and twin columns, or the broad mentolabial depression. */
  function neighboringProfile(z: Jet, { width, depth, crest }: INeighbor): Jet {
    if (crest === undefined) {
      const w: number = 1 - (z[0] / width) ** 2;
      const radial: Jet = compose(
        z,
        w,
        (-2 * z[0]) / width ** 2,
        -2 / width ** 2,
      );
      return multiply(fade(radial), [-depth, 0, 0, 0, 0, 0]);
    }
    const distance: number = Math.abs(z[0]);
    const direction: number = Math.sign(z[0]);
    if (distance >= crest) {
      const length: number = width - crest;
      const flank: Jet = compose(
        z,
        (width - distance) / length,
        -direction / length,
        0,
      );
      return multiply(fade(flank), [depth, 0, 0, 0, 0, 0]);
    }
    // Equal crest and valley excursions about the surrounding skin are an
    // ESTIMATE where the original groove gives only depth and width.
    const inward: Jet = compose(z, distance / crest, direction / crest, 0);
    return add(multiply(fade(inward), [2 * depth, 0, 0, 0, 0, 0]), [
      -depth,
      0,
      0,
      0,
      0,
      0,
    ]);
  }

  /** Perlin's quintic endpoint fade and its analytic pullback. */
  function fade(u: Jet): Jet {
    const t: number = u[0];
    if (t >= 1) return [1, 0, 0, 0, 0, 0];
    const rest: number = 1 - t;
    return compose(
      u,
      t ** 3 * (10 + t * (-15 + 6 * t)),
      30 * t ** 2 * rest ** 2,
      60 * t * rest * (1 - 2 * t),
    );
  }

  /** One normalized half-ellipse with C2 contact and outer transitions. */
  function sectionProfile(
    q: number,
    contactRoll: number,
  ): [number, number, number] {
    const shape: number = 2 * Math.sqrt(q * (1 - q));
    const first: number = (2 - 4 * q) / shape;
    const second: number = -4 / shape - first ** 2 / shape;
    const section: Jet = multiply(
      [shape, first, 0, second, 0, 0],
      multiply(
        fade([q / contactRoll, 1 / contactRoll, 0, 0, 0, 0]),
        fade([2 * (1 - q), -2, 0, 0, 0, 0]),
      ),
    );
    return [section[0], section[1], section[3]];
  }

  /** Read the exact scalar support of the authored lip outline. */
  function value(outline: IAutoMovieViewOutline.IOutline, z: number): number {
    const result: number | string = AutoMovieViewOutline.value(outline, z);
    if (typeof result === "string") throw new Error(result);
    return result;
  }
}

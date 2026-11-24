import {
  AutoMovieGravity,
  Quaternion,
  createAutoMovieRandom,
  deriveAutoMovieSeed,
} from "@automovie/engine";
import type {
  IAutoMovieRandom,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "./AutoMovieArchetypeFrame";
import { AutoMovieArchetypeRefusal } from "./AutoMovieArchetypeRefusal";
import type { AutoMovieArchetypeRide } from "./AutoMovieArchetypeRide";
import { AutoMovieArchetypeUnits } from "./AutoMovieArchetypeUnits";

/**
 * A seeded swell: the sea surface as a sum of sinusoids drawn from a measured
 * wave spectrum, and a water-borne ride heaving, pitching and rolling on it.
 *
 * The surface is long-crested: every component travels the one `heading`, its
 * frequencies spread over the Pierson-Moskowitz spectrum of a fully developed
 * sea of the stated significant height (WMO, Guide to Wave Analysis and
 * Forecasting, WMO-No. 702, 1998, eqs. 1.28 to 1.30, pp. 13-14), each
 * component's amplitude the spectrum's energy in its band and its phase drawn
 * from the seed. A boat on it follows the surface: it heaves with the elevation
 * under its root and pitches and rolls with the surface's slope along and
 * across it, which holds while the waves are long beside the hull. The same
 * seed and second always give the same sea.
 */
export namespace AutoMovieArchetypeSea {
  /** What a sea is drawn from. */
  export interface IOptions {
    /**
     * The significant wave height, metres: the WMO sea state code 3700's bands
     * (0 to 0.1 m calm-rippled, 0.1 to 0.5 smooth, 0.5 to 1.25 slight, 1.25 to
     * 2.5 moderate).
     */
    height: number;

    /**
     * The finite direction the waves travel, degrees about `+Y` from `+Z`;
     * drawn from the seed when absent. Full turns leave the surface unchanged.
     */
    heading?: number;

    /** The seed the phases and an absent heading are drawn from. */
    seed: number;
  }

  /** One sinusoid of the surface. */
  export interface IComponent {
    /** Its frequency, hertz. */
    frequency: number;

    /** Its wavenumber, radians per metre, from deep-water dispersion. */
    wavenumber: number;

    /** Its amplitude, metres. */
    amplitude: number;

    /** Its phase, radians. */
    phase: number;
  }

  /** A sea. */
  export interface ISea {
    /** The direction the waves travel, degrees about `+Y` from `+Z`. */
    heading: number;

    /** Its sinusoids. */
    components: readonly IComponent[];

    /**
     * The greatest elevation the components can reach together, metres: the sum
     * of their amplitudes.
     */
    crest: number;

    /**
     * The greatest rise per horizontal metre they can reach together: the sum
     * of each wavenumber times its amplitude.
     */
    steepest: number;

    /**
     * The surface's elevation above still water at a point and second.
     *
     * @param x The point's `X`, metres.
     * @param z The point's `Z`, metres.
     * @param seconds The film second.
     * @returns The elevation, metres.
     */
    elevation(x: number, z: number, seconds: number): number;

    /**
     * The surface's slope at a point and second: its rise per metre along `X`
     * and along `Z`.
     *
     * @param x The point's `X`, metres.
     * @param z The point's `Z`, metres.
     * @param seconds The film second.
     * @returns The two slopes.
     */
    slope(x: number, z: number, seconds: number): { x: number; z: number };
  }

  /**
   * How many components a sea sums: enough that no one dominates, few enough to
   * sample every frame.
   */
  export const COMPONENTS: number = 24;

  /**
   * The spectrum's band, as multiples of its peak frequency: below half the
   * peak and above three times it, the Pierson-Moskowitz spectrum holds under a
   * thousandth of its energy per band.
   */
  export const BAND: readonly [number, number] = [0.5, 3];

  /**
   * A sea from its significant height, heading and seed.
   *
   * @param options The significant height, the heading and the seed.
   * @returns The sea.
   * @throws {AutoMovieArchetypeRefusal} When the height is negative or not
   *   finite, the heading is not finite, or the height's spectrum and bounds
   *   cannot be represented by finite positive numbers.
   */
  export function of(options: IOptions): ISea {
    const height: number = options.height;
    if (!(height >= 0))
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: "sea",
        axis: "height",
        value: height,
        feasible: { kind: "range", minimum: 0, maximum: null, unit: "m" },
        reason: `a significant wave height of ${height} m is no sea`,
        fix: "give the significant height in metres, 0 or more",
      });
    const random: IAutoMovieRandom = createAutoMovieRandom(
      deriveAutoMovieSeed(String(options.seed), "archetype", "sea"),
    );
    const heading: number =
      options.heading === undefined ? random.float(0) * 360 : options.heading;
    const components: IComponent[] = [];
    if (height > 0) {
      const peak: number =
        (0.877 * AutoMovieGravity.STANDARD * Math.sqrt(0.0246)) /
        (2 * Math.PI * 1.075 * Math.sqrt(height));
      const width: number = (BAND[1] - BAND[0]) / COMPONENTS;
      const scale: number =
        (1.075 * 1.075) / (0.0246 * AutoMovieGravity.STANDARD);

      // E(f) df becomes u19.5^4/g^2 times a dimensionless function of r=f/peak.
      // Taking its square root first leaves H as one final linear factor.
      for (let k: number = 0; k < COMPONENTS; k++) {
        const relative: number = BAND[0] + (k + 0.5) * width;
        const frequency: number = peak * relative;
        const amplitude: number =
          height *
          (scale *
            Math.sqrt(
              ((2 * 0.0081 * width) / (0.877 ** 4 * relative ** 5)) *
                Math.exp(-0.74 / (0.877 * relative) ** 4),
            ));
        const wave: number =
          ((2 * Math.PI) / Math.sqrt(AutoMovieGravity.STANDARD)) * frequency;
        components.push({
          frequency,
          wavenumber: wave * wave,
          amplitude,
          phase: random.float(k + 1) * 2 * Math.PI,
        });
      }
    }
    const crest: number = components.reduce(
      (sum: number, c: IComponent): number => sum + c.amplitude,
      0,
    );
    const steepest: number = components.reduce(
      (sum: number, c: IComponent): number => sum + c.amplitude * c.wavenumber,
      0,
    );
    if (
      crest === Infinity ||
      steepest === Infinity ||
      components.some(
        (c: IComponent): boolean =>
          ![c.frequency, c.wavenumber, c.amplitude].every(
            (value: number): boolean => value > 0,
          ),
      )
    )
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: "sea",
        axis: "height",
        value: height,
        feasible: null,
        reason: `the spectrum at ${height} m has an unrepresentable component or summed bound`,
        fix: "choose a height whose frequencies, wavenumbers, amplitudes and summed bounds are representable",
      });

    // Reduce whole turns before trigonometry so large headings retain angular periodicity.
    const radians: number = (heading % 360) * AutoMovieArchetypeUnits.DEGREE;
    const headingX: number = Math.sin(radians);
    const headingZ: number = Math.cos(radians);
    const along: (x: number, z: number) => number = (
      x: number,
      z: number,
    ): number => x * headingX + z * headingZ;
    return {
      heading,
      components,
      crest,
      steepest,
      elevation: (x: number, z: number, seconds: number): number => {
        const distance: number = along(x, z);
        return components.reduce(
          (sum: number, c: IComponent): number =>
            sum +
            c.amplitude *
              Math.cos(
                c.wavenumber * distance -
                  2 * Math.PI * c.frequency * seconds +
                  c.phase,
              ),
          0,
        );
      },
      slope: (
        x: number,
        z: number,
        seconds: number,
      ): { x: number; z: number } => {
        const distance: number = along(x, z);
        const rise: number = components.reduce(
          (sum: number, c: IComponent): number =>
            sum -
            c.amplitude *
              c.wavenumber *
              Math.sin(
                c.wavenumber * distance -
                  2 * Math.PI * c.frequency * seconds +
                  c.phase,
              ),
          0,
        );
        return { x: rise * headingX, z: rise * headingZ };
      },
    };
  }

  /** How a floating root moves on the sea at a second. */
  export interface IMotion {
    /** The rise above still water, metres. */
    heave: number;

    /** The bow's rise, radians about the support's own `-X`. */
    pitch: number;

    /**
     * The roll applied before pitch, radians about the support's own `+Z`,
     * raising its `+X` side.
     */
    roll: number;
  }

  /**
   * How a support level on still water moves on the sea at a second: the
   * elevation under its root and the coupled pitch and roll matching the
   * surface normal.
   *
   * @param sea The sea.
   * @param placement The support's placement on still water.
   * @param seconds The film second.
   * @returns Its heave, pitch and roll.
   */
  export function motion(
    sea: ISea,
    placement: IAutoMovieTransform,
    seconds: number,
  ): IMotion {
    const at: IAutoMovieVector3 = placement.translation;
    const slope: { x: number; z: number } = sea.slope(at.x, at.z, seconds);
    const forward: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
      placement,
      "z",
    );
    const left: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
      placement,
      "x",
    );
    const fore: number = slope.x * forward.x + slope.z * forward.z;
    const across: number = slope.x * left.x + slope.z * left.z;
    return {
      heave: sea.elevation(at.x, at.z, seconds),
      pitch: Math.atan(fore),
      roll: Math.atan2(across, Math.hypot(1, fore)),
    };
  }

  /**
   * Place a level support on the sampled sea tangent, without posing the
   * support's own parts.
   */
  export function floated(
    sea: ISea,
    level: IAutoMovieTransform,
    seconds: number,
  ): IAutoMovieTransform {
    const moved: IMotion = motion(sea, level, seconds);
    const tilt: IAutoMovieTransform["rotation"] = Quaternion.multiply(
      Quaternion.fromAxisAngle(
        { x: -1, y: 0, z: 0 },
        moved.pitch / AutoMovieArchetypeUnits.DEGREE,
      ),
      Quaternion.fromAxisAngle(
        { x: 0, y: 0, z: 1 },
        moved.roll / AutoMovieArchetypeUnits.DEGREE,
      ),
    );
    return {
      translation: {
        ...level.translation,
        y: level.translation.y + moved.heave,
      },
      rotation: Quaternion.multiply(level.rotation, tilt),
      scale: { ...AutoMovieArchetypeFrame.UNIT },
    };
  }

  /**
   * A ride level on still water, heaved and turned onto the sea's tangent plane
   * at each root sample.
   *
   * @param ride The ride on still water.
   * @param sea The sea.
   * @returns The ride on the sea, with the same plan, duration and instants.
   */
  export function float<Id extends string, Dimension extends string>(
    ride: AutoMovieArchetypeRide.IRide<Id, Dimension>,
    sea: ISea,
  ): AutoMovieArchetypeRide.IRide<Id, Dimension> {
    const at: (
      seconds: number,
    ) => AutoMovieArchetypeRide.ISample<Id, Dimension> = (
      seconds: number,
    ): AutoMovieArchetypeRide.ISample<Id, Dimension> => {
      const sample: AutoMovieArchetypeRide.ISample<Id, Dimension> =
        ride.at(seconds);
      const placement: IAutoMovieTransform = floated(
        sea,
        sample.placement,
        seconds,
      );
      return { ...sample, placement, course: { ...sample.course, placement } };
    };
    return {
      plan: ride.plan,
      duration: ride.duration,
      instants: ride.instants,
      at,
      frame: (id: Id, seconds: number): IAutoMovieTransform => {
        const sample: AutoMovieArchetypeRide.ISample<Id, Dimension> =
          at(seconds);
        return AutoMovieArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance(id).frame,
        );
      },
    };
  }
}

import {
  type IAutoMovieRandom,
  Quaternion,
  createAutoMovieRandom,
  deriveAutoMovieSeed,
} from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ArchetypeCourse } from "./ArchetypeCourse";
import { ArchetypeFrame } from "./ArchetypeFrame";
import { ArchetypeRefusal } from "./ArchetypeRefusal";
import type { ArchetypeRide } from "./ArchetypeRide";
import { ArchetypeUnits } from "./ArchetypeUnits";

/**
 * A seeded swell: the sea surface as a sum of sinusoids drawn from a measured wave spectrum, and a water-borne ride heaving, pitching and rolling on it.
 *
 * The surface is long-crested: every component travels the one `heading`, its frequencies spread over the Pierson-Moskowitz spectrum of a fully developed sea of the stated significant height (WMO, Guide to Wave Analysis and Forecasting, WMO-No. 702, 1998, eqs. 1.28 to 1.30, pp. 13-14), each component's amplitude the spectrum's energy in its band and its phase drawn from the seed. A boat on it follows the surface: it heaves with the elevation under its root and pitches and rolls with the surface's slope along and across it, which holds while the waves are long beside the hull. The same seed and second always give the same sea.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the surface model, the spectrum and its source, the boat's following and when it holds, and determinism.
 * @evidence contracts/development/design.md#principled-representation A sea is its components (frequency, wavenumber, amplitude, phase) and the heading they travel, from which elevation and slope are closed-form at any point and second.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `of` builds a sea and `float` puts any ride on it, the `sea` option every water-borne ride takes (#3497).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No random source but the seed's counter stream; no frame grid enters the surface.
 */
export namespace ArchetypeSea {
  /**
   * What a sea is drawn from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation A significant height in metres, a heading in degrees and a seed.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; read by `of`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IOptions {
    /** The significant wave height, metres: the WMO sea state code 3700's bands (0 to 0.1 m calm-rippled, 0.1 to 0.5 smooth, 0.5 to 1.25 slight, 1.25 to 2.5 moderate). */
    height: number;

    /** The direction the waves travel, degrees about `+Y` from `+Z`; drawn from the seed when absent. */
    heading?: number;

    /** The seed the phases and an absent heading are drawn from. */
    seed: number | string;
  }

  /**
   * One sinusoid of the surface.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation Frequency in hertz, wavenumber in radians a metre, amplitude in metres and phase in radians.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; made by `of` and read by its readers and the swell test.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
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

  /**
   * A sea.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation Its components and heading with the two closed-form readers and their bounds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; made by `of` and read by `motion`, `float` and the swell test.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ISea {
    /** The direction the waves travel, degrees about `+Y` from `+Z`. */
    heading: number;

    /** Its sinusoids. */
    components: readonly IComponent[];

    /** The greatest elevation the components can reach together, metres: the sum of their amplitudes. */
    crest: number;

    /** The greatest slope they can reach together, radians: the sum of each wavenumber times its amplitude. */
    steepest: number;

    /**
     * The surface's elevation above still water at a point and second.
     *
     * @param x The point's `X`, metres.
     * @param z The point's `Z`, metres.
     * @param seconds The film second.
     * @returns The elevation, metres.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the inputs' units and the result.
     * @evidence contracts/development/implementation.md#principled-implementation Each component a cosine of its wavenumber times the distance along the heading less its angular frequency times the second, plus its phase.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One sum over the components.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
     * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the components.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its arguments.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
     */
    elevation(x: number, z: number, seconds: number): number;

    /**
     * The surface's slope at a point and second: its rise per metre along `X` and along `Z`.
     *
     * @param x The point's `X`, metres.
     * @param z The point's `Z`, metres.
     * @param seconds The film second.
     * @returns The two slopes.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the inputs' units and the result.
     * @evidence contracts/development/implementation.md#principled-implementation The elevation's gradient: each component's derivative along the heading, resolved on X and Z.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One sum over the components.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
     * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the components.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its arguments.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
     */
    slope(x: number, z: number, seconds: number): { x: number; z: number };
  }

  /** How many components a sea sums: enough that no one dominates, few enough to sample every frame. */
  export const COMPONENTS: number = 24;

  /** The spectrum's band, as multiples of its peak frequency: below half the peak and above three times it, the Pierson-Moskowitz spectrum holds under a thousandth of its energy per band. */
  export const BAND: readonly [number, number] = [0.5, 3];

  /**
   * A sea from its significant height, heading and seed.
   *
   * @param options The significant height, the heading and the seed.
   * @returns The sea.
   * @throws {ArchetypeRefusal} When the height is negative or not finite.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is drawn and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation WMO-No. 702: a fully developed sea of significant height H has the wind at 10 m u10 = (H / 0.0246) ^ 0.5 (eq. 1.30), the wind at 19.5 m 1.075 times that (the eq. 1.28 note), the peak frequency 0.877 g / (2 pi u19.5) (eq. 1.29), and the spectrum E(f) = 0.0081 g^2 (2 pi)^-4 f^-5 exp(-0.74 (g / (2 pi u19.5 f))^4) (eq. 1.28). Each component takes the energy of an equal band of the spectrum, its amplitude the root of twice that energy, so the components' variance is the spectrum's; the wavenumber is (2 pi f)^2 / g for deep water.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The wind, the peak, the bands, then the two closed-form readers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Long-crested: the directional spread no source here gives is left out; a calm sea of zero height has no components.
   * @evidence contracts/development/implementation.md#efficient-algorithms `COMPONENTS` cosines per reading.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent sea.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The sea holds its components for as long as its caller keeps it.
   */
  export function of(options: IOptions): ISea {
    if (!(Number.isFinite(options.height) && options.height >= 0))
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype: "sea",
        axis: "height",
        value: options.height,
        feasible: { kind: "range", minimum: 0, maximum: null, unit: "m" },
        reason: `a significant wave height of ${options.height} m is no sea`,
        fix: "give the significant height in metres, 0 or more",
      });
    const random: IAutoMovieRandom = createAutoMovieRandom(
      deriveAutoMovieSeed(String(options.seed), "archetype", "sea"),
    );
    const heading: number = options.heading ?? random.float(0) * 360;
    const components: IComponent[] = [];
    if (options.height > 0) {
      const wind: number = 1.075 * Math.sqrt(options.height / 0.0246);
      const peak: number = (0.877 * ArchetypeCourse.GRAVITY) / (2 * Math.PI * wind);
      const low: number = BAND[0] * peak;
      const width: number = ((BAND[1] - BAND[0]) * peak) / COMPONENTS;
      for (let k: number = 0; k < COMPONENTS; k++) {
        const frequency: number = low + (k + 0.5) * width;
        const energy: number =
          ((0.0081 * ArchetypeCourse.GRAVITY * ArchetypeCourse.GRAVITY) / ((2 * Math.PI) ** 4 * frequency ** 5)) *
          Math.exp(-0.74 * (ArchetypeCourse.GRAVITY / (2 * Math.PI * wind * frequency)) ** 4);
        components.push({
          frequency,
          wavenumber: (2 * Math.PI * frequency) ** 2 / ArchetypeCourse.GRAVITY,
          amplitude: Math.sqrt(2 * energy * width),
          phase: random.float(k + 1) * 2 * Math.PI,
        });
      }
    }
    const radians: number = heading * ArchetypeUnits.DEGREE;
    const along = (x: number, z: number): number =>
      x * Math.sin(radians) + z * Math.cos(radians);
    return {
      heading,
      components,
      crest: components.reduce(
        (sum: number, c: IComponent): number => sum + c.amplitude,
        0,
      ),
      steepest: components.reduce(
        (sum: number, c: IComponent): number =>
          sum + c.amplitude * c.wavenumber,
        0,
      ),
      elevation: (x: number, z: number, seconds: number): number =>
        components.reduce(
          (sum: number, c: IComponent): number =>
            sum +
            c.amplitude *
              Math.cos(
                c.wavenumber * along(x, z) -
                  2 * Math.PI * c.frequency * seconds +
                  c.phase,
              ),
          0,
        ),
      slope: (
        x: number,
        z: number,
        seconds: number,
      ): { x: number; z: number } => {
        const rise: number = components.reduce(
          (sum: number, c: IComponent): number =>
            sum -
            c.amplitude *
              c.wavenumber *
              Math.sin(
                c.wavenumber * along(x, z) -
                  2 * Math.PI * c.frequency * seconds +
                  c.phase,
              ),
          0,
        );
        return { x: rise * Math.sin(radians), z: rise * Math.cos(radians) };
      },
    };
  }

  /**
   * How a floating root moves on the sea at a second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation Heave in metres, pitch and roll in radians about the support's own axes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; made by `motion` and read by `float`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IMotion {
    /** The rise above still water, metres. */
    heave: number;

    /** The bow's rise, radians about the support's own `-X`. */
    pitch: number;

    /** The roll, radians about the support's own `+Z`, raising its `+X` side. */
    roll: number;
  }

  /**
   * How a support placed on the sea moves there at a second: the elevation under its root, and the surface's slope along and across its heading.
   *
   * @param sea The sea.
   * @param placement The support's placement on still water.
   * @param seconds The film second.
   * @returns Its heave, pitch and roll.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each motion is.
   * @evidence contracts/development/implementation.md#principled-implementation The surface under the root and its gradient resolved on the support's own forward and left axes; the angle is the arctangent of the slope.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One elevation, one slope, two projections.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The hull follows the surface at its root, its own response to waves of its length's order left out, as `ArchetypeSea` states.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two sums over the components.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the sea's readers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function motion(
    sea: ISea,
    placement: IAutoMovieTransform,
    seconds: number,
  ): IMotion {
    const at: IAutoMovieVector3 = placement.translation;
    const slope: { x: number; z: number } = sea.slope(at.x, at.z, seconds);
    const forward: IAutoMovieVector3 = ArchetypeFrame.axis(placement, "z");
    const left: IAutoMovieVector3 = ArchetypeFrame.axis(placement, "x");
    return {
      heave: sea.elevation(at.x, at.z, seconds),
      pitch: Math.atan(slope.x * forward.x + slope.z * forward.z),
      roll: Math.atan(slope.x * left.x + slope.z * left.z),
    };
  }

  /**
   * A ride on the sea: every sample's placement heaved, pitched and rolled by the sea under it.
   *
   * @param ride The ride on still water.
   * @param sea The sea.
   * @returns The ride on the sea, with the same plan, duration and instants.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what changes and what is kept.
   * @evidence contracts/development/implementation.md#principled-implementation Each sample's placement is raised by the heave and turned by the pitch about its own `-X` and the roll about its own `+Z` (`motion`), the course state's placement replaced likewise, so what is carried reads the moving deck.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One sampler wrapping the ride's.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing beyond `motion`.
   * @evidence contracts/development/implementation.md#efficient-algorithms One motion per sample.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the ride's own sampler.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the ride and the sea for as long as its caller keeps the result.
   */
  export function float<Id extends string, Dimension extends string>(
    ride: ArchetypeRide.IRide<Id, Dimension>,
    sea: ISea,
  ): ArchetypeRide.IRide<Id, Dimension> {
    const at = (seconds: number): ArchetypeRide.ISample<Id, Dimension> => {
      const sample: ArchetypeRide.ISample<Id, Dimension> = ride.at(seconds);
      const moved: IMotion = motion(sea, sample.placement, seconds);
      const tilt: IAutoMovieTransform["rotation"] = Quaternion.multiply(
        Quaternion.fromAxisAngle(
          { x: -1, y: 0, z: 0 },
          moved.pitch / ArchetypeUnits.DEGREE,
        ),
        Quaternion.fromAxisAngle(
          { x: 0, y: 0, z: 1 },
          moved.roll / ArchetypeUnits.DEGREE,
        ),
      );
      const placement: IAutoMovieTransform = {
        translation: {
          ...sample.placement.translation,
          y: sample.placement.translation.y + moved.heave,
        },
        rotation: Quaternion.multiply(sample.placement.rotation, tilt),
        scale: { ...ArchetypeFrame.UNIT },
      };
      return { ...sample, placement, course: { ...sample.course, placement } };
    };
    return {
      plan: ride.plan,
      duration: ride.duration,
      instants: ride.instants,
      at,
      frame: (id: Id, seconds: number): IAutoMovieTransform => {
        const sample: ArchetypeRide.ISample<Id, Dimension> = at(seconds);
        return ArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance(id).frame,
        );
      },
    };
  }
}


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
 * @evidence contracts/development/design.md#minimal-and-owned-surface `of` builds a sea and `float` carries a level still-water ride on it, the `sea` option water-borne rides take (#3497).
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

    /** The finite direction the waves travel, degrees about `+Y` from `+Z`; drawn from the seed when absent. Full turns leave the surface unchanged. */
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

    /** The greatest rise per horizontal metre they can reach together: the sum of each wavenumber times its amplitude. */
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
   * @throws {ArchetypeRefusal} When the height is negative or not finite, the heading is not finite, or the height's spectrum and bounds cannot be represented by finite positive numbers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the measured spectrum, angular periodicity and scalar or derived-representation refusals.
   * @evidence contracts/development/implementation.md#principled-implementation WMO-No. 702: a fully developed sea of significant height H has the wind at 10 m u10 = (H / 0.0246) ^ 0.5 (eq. 1.30), the wind at 19.5 m 1.075 times that (the eq. 1.28 note), the peak frequency 0.877 g / (2 pi u19.5) (eq. 1.29), and the spectrum E(f) = 0.0081 g^2 (2 pi)^-4 f^-5 exp(-0.74 (g / (2 pi u19.5 f))^4) (eq. 1.28). Substituting r=f/peak before taking the amplitude avoids dimensional fifth powers and H squared; each amplitude is H times a dimensionless factor. Deep-water wavenumber is (2 pi f / sqrt(g)) squared. Only representable components and summed bounds are admitted.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit scalar inputs, form the peak-relative components and their bounds, then expose the two closed-form readers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Long-crested: the directional spread no source here gives is left out; a calm sea of zero height has no components.
   * @evidence contracts/development/implementation.md#efficient-algorithms `COMPONENTS` cosines per reading.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent sea.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The sea holds its components for as long as its caller keeps it.
   */
  export function of(options: IOptions): ISea {
    const height: number = options.height;
    if (!(Number.isFinite(height) && height >= 0))
      throw new ArchetypeRefusal({
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
    if (!Number.isFinite(heading))
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype: "sea",
        axis: "heading",
        value: heading,
        feasible: null,
        reason: `a wave heading of ${heading} degrees is not finite`,
        fix: "give a finite heading in degrees or leave it to the seed",
      });
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
      !Number.isFinite(crest) ||
      !Number.isFinite(steepest) ||
      components.some(
        (c: IComponent): boolean =>
          ![c.frequency, c.wavenumber, c.amplitude].every(
            (value: number): boolean => Number.isFinite(value) && value > 0,
          ),
      )
    )
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype: "sea",
        axis: "height",
        value: height,
        feasible: null,
        reason: `the spectrum at ${height} m has an unrepresentable component or summed bound`,
        fix: "choose a height whose frequencies, wavenumbers, amplitudes and summed bounds are representable",
      });

    // Reduce whole turns before trigonometry so large headings retain angular periodicity.
    const radians: number = (heading % 360) * ArchetypeUnits.DEGREE;
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

    /** The roll applied before pitch, radians about the support's own `+Z`, raising its `+X` side. */
    roll: number;
  }

  /**
   * How a support level on still water moves on the sea at a second: the elevation under its root and the coupled pitch and roll matching the surface normal.
   *
   * @param sea The sea.
   * @param placement The support's placement on still water.
   * @param seconds The film second.
   * @returns Its heave, pitch and roll.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the level-support premise, axes and order of the coupled rotations.
   * @evidence contracts/development/implementation.md#principled-implementation Resolve the gradient along the level support's forward and left axes as f and l. Rx(-p)Rz(r) maps up to (-sin(r),cos(p)cos(r),-sin(p)cos(r)); matching the plane normal (-l,1,-f) gives p=atan(f) and r=atan2(l,hypot(1,f)), including oblique waves. Heave is the elevation under the root.
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
    const fore: number = slope.x * forward.x + slope.z * forward.z;
    const across: number = slope.x * left.x + slope.z * left.z;
    return {
      heave: sea.elevation(at.x, at.z, seconds),
      pitch: Math.atan(fore),
      roll: Math.atan2(across, Math.hypot(1, fore)),
    };
  }

  /**
   * Place a level support on the sampled sea tangent, without posing the support's own parts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Returns the root world frame from the sea, level course placement and film second.
   * @evidence contracts/development/implementation.md#principled-implementation Apply heave, pitch about local minus X and roll about local Z from the same motion reader as a floating ride.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One sea motion and one transform.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts All headings use the same tangent-plane construction.
   * @evidence contracts/development/implementation.md#efficient-algorithms One sea evaluation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by floating whole rides and selected sockets.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
        moved.pitch / ArchetypeUnits.DEGREE,
      ),
      Quaternion.fromAxisAngle(
        { x: 0, y: 0, z: 1 },
        moved.roll / ArchetypeUnits.DEGREE,
      ),
    );
    return {
      translation: {
        ...level.translation,
        y: level.translation.y + moved.heave,
      },
      rotation: Quaternion.multiply(level.rotation, tilt),
      scale: { ...ArchetypeFrame.UNIT },
    };
  }

  /**
   * A ride level on still water, heaved and turned onto the sea's tangent plane at each root sample.
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
    const at: (seconds: number) => ArchetypeRide.ISample<Id, Dimension> = (
      seconds: number,
    ): ArchetypeRide.ISample<Id, Dimension> => {
      const sample: ArchetypeRide.ISample<Id, Dimension> = ride.at(seconds);
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
        const sample: ArchetypeRide.ISample<Id, Dimension> = at(seconds);
        return ArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance(id).frame,
        );
      },
    };
  }
}

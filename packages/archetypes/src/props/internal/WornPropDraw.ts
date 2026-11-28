import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import { WornPropDrawData } from "./WornPropDrawData";

/**
 * Admits four wearable measurement records and prepares their geometry builders.
 */
export namespace WornPropDraw {
  /** Saved watch, hat, spectacles and cycling helmet selectors. */
  export type Kind = "watch" | "hat" | "spectacles" | "helmet";

  /** The four accepted selectors in gallery order. */
  export const KINDS: readonly Kind[] = [
    "watch",
    "hat",
    "spectacles",
    "helmet",
  ];

  /** Estimated foam offset below the cycling helmet's top, 0.02 metres. */
  export const SHELL: number = 0.02;

  /**
   * Authored thickness of the watch strap, hat brim and spectacles front, 0.004 metres.
   */
  export const THIN: number = 0.004;

  /** Estimated width of the watch's straight strap, 0.02 metres. */
  export const STRAP: number = 0.02;

  /**
   * A hold and wear site for all four props, and an upward dial face on the wristwatch.
   */
  export type Affordance = "hold" | "wear" | "face";

  /**
   * Width, depth and height describe each form's selected geometry in
   * metres. Mass records kilograms. The band table specifies the physical
   * meaning of each value for the kind.
   */
  export type Dimension = "width" | "depth" | "height" | "mass";

  /** Shared physical units for the four wearable dimension records. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    depth: "m",
    height: "m",
    mass: "kg",
  };

  /**
   * Saved selector, optional scene ID and finite per-form measurement settings.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Selects the physical wearable and its measurement ranges. */
    kind: Kind;

    /** Scene object ID, defaulting to `wearable`. */
    id?: string;
  }

  /**
   * Ranges for the watch case and strap, hat brim and crown, spectacle
   * frame and temples, and helmet shell. Each kind also records its mass.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = {
    watch: {
      width: AutoMovieArchetypeBand.metres(0.0352, 0.0382, WornPropDrawData.CASIO),
      depth: AutoMovieArchetypeBand.metres(
        0.2,
        0.24,
        `the strap's length: ${WornPropDrawData.UNREAD}`,
        true,
      ),
      height: AutoMovieArchetypeBand.metres(0.0085, 0.0085, WornPropDrawData.CASIO),
      mass: AutoMovieArchetypeBand.of("kg", 0.021, 0.021, WornPropDrawData.CASIO),
    },
    hat: {
      width: AutoMovieArchetypeBand.metres(
        (20.25 * AutoMovieArchetypeUnits.INCH) / Math.PI +
          2 * 2 * AutoMovieArchetypeUnits.INCH,
        (22.25 * AutoMovieArchetypeUnits.INCH) / Math.PI +
          2 * 4.125 * AutoMovieArchetypeUnits.INCH,
        `${WornPropDrawData.STETSON}: a head's round as a circle's across and a brim on either side`,
      ),
      depth: AutoMovieArchetypeBand.metres(
        (20.25 * AutoMovieArchetypeUnits.INCH) / Math.PI,
        (22.25 * AutoMovieArchetypeUnits.INCH) / Math.PI,
        `${WornPropDrawData.STETSON}: the head's round as a circle's across`,
      ),
      height: AutoMovieArchetypeBand.metres(
        3.75 * AutoMovieArchetypeUnits.INCH,
        4.5 * AutoMovieArchetypeUnits.INCH,
        WornPropDrawData.STETSON,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.08,
        0.2,
        `the hat's weight: ${WornPropDrawData.UNREAD}`,
        true,
      ),
    },
    spectacles: {
      width: AutoMovieArchetypeBand.metres(
        0.122,
        0.122,
        `${WornPropDrawData.RAYBAN}: two lenses and the bridge; the rims' width outside them ${WornPropDrawData.UNREAD}`,
      ),
      depth: AutoMovieArchetypeBand.metres(0.15, 0.15, WornPropDrawData.RAYBAN),
      height: AutoMovieArchetypeBand.metres(0.041, 0.041, WornPropDrawData.RAYBAN),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.02,
        0.04,
        `the frame's weight: ${WornPropDrawData.UNREAD}`,
        true,
      ),
    },
    helmet: {
      width: AutoMovieArchetypeBand.metres(0.2, 0.22, WornPropDrawData.HELMET, true),
      depth: AutoMovieArchetypeBand.metres(0.26, 0.28, WornPropDrawData.HELMET, true),
      height: AutoMovieArchetypeBand.metres(0.14, 0.16, WornPropDrawData.HELMET, true),
      mass: AutoMovieArchetypeBand.of("kg", 0.22, 0.3, WornPropDrawData.HELMET, true),
    },
  };

  /**
   * Prepared geometry builder and complete admitted measure record from one draw.
   */
  export interface IPrepareResult<Id extends Affordance> {
    /**
     * Empty wearable builder carrying the scene ID and shared draw provenance.
     */
    builder: AutoMovieArchetypeBuilder<Id, Dimension>;

    /**
     * Complete finite width, depth, height and mass used by the named producer.
     */
    d: Record<Dimension, number>;
  }

  /**
   * Admit the dimensions for one saved wearable shape.
   *
   * @param kind Selector for the applicable measurement record.
   * @param params Optional ID and finite fixed values accepted by that record.
   * @param seed Numeric seed or undefined for the original band defaults.
   * @returns The four admitted dimensions and a builder using the same draw.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function prepare<Id extends Affordance>(
    kind: Kind,
    params: Omit<IParams, "kind">,
    seed?: number,
  ): IPrepareResult<Id> {
    const draw: AutoMovieArchetypeDrawSession<Dimension> =
      new AutoMovieArchetypeDrawSession<Dimension>(
        "wearable",
        UNITS,
        seed,
        params,
      );
    const d: Record<Dimension, number> = draw.dimensions(BANDS[kind]);
    const builder: AutoMovieArchetypeBuilder<Id, Dimension> =
      new AutoMovieArchetypeBuilder({
        material: "composite",
        id: params.id,
        name: kind,
        draw,
      });
    return { builder, d };
  }
}

import { IPortraitHairCard } from "./IPortraitHairCard";

/**
 * A bounded population of surface locks. Empty cards remove the hairstyle.
 * Sampling changes geometry cost without changing the guide population. The
 * material names a resident finish; construction supplies its procedural mask.
 * This is static groom authoring, not strand simulation or a hairstyle preset.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Keeps authored lock arrays replaceable as one independent numerical profile.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Separates complete card replacement from width, taper and tessellation controls.
 * @author Samchon
 */
export interface IPortraitHairShape {
  /** Resident base finish id, shared across the generated locks. */
  material: string;
  /** Zero through 1024 independently authored curved locks. */
  cards: readonly IPortraitHairCard[];
  /** Integral segments per card from 2 through 64. */
  segments: number;
  /** Shared width multiplier in [0.1,4]. One preserves authored widths. */
  widthScale: number;
  /** Tip/root width ratio in [0.05,1]; positive tips avoid collapsed triangles. */
  tipWidth: number;
  /**
   * Root-to-tip fraction in [0,0.95] where width starts narrowing. Omission is
   * zero, preserving the original full-length taper. A later start retains
   * scalp coverage and the body of a long lock without widening its root.
   */
  taperStart?: number;
  /** Deterministic texture seed, an unsigned 32-bit integer. */
  seed: number;
  /** Number of painted fibres per lock, from 1 through 32. These are not meshes. */
  fibres: number;
  /** Fractional fibre coverage in [0.1,1]; larger fills gaps between painted fibres. */
  coverage: number;
  /**
   * Procedural RGB modulation strength in [0,1]. Omission or one retains the
   * original shaded fibres; zero uses white RGB so only the base finish sets
   * pigment. Intermediate values interpolate encoded texture RGB towards white.
   * Alpha, normals and geometry are independent of this raster control.
   */
  fibreShadeStrength?: number;
  /**
   * Generated fibre-normal strength in [0,1]. Omission or zero leaves the base
   * finish's normal binding unchanged. Positive values replace that binding
   * on the owned card finish, never on other users of the base material.
   * One uses the full circular fibre cross-section, not a physical diameter.
   */
  fibreNormalScale?: number;
  /**
   * Optional complete curled-fibre pattern. It changes the resident alpha and
   * normal maps, not the guide geometry. Omission preserves the legacy mask.
   * These normalized pattern controls do not measure biological hair diameter.
   */
  fibreCurl?: {
    /** Maximum transverse excursion as a fraction of card UV width, in [0,0.5]. */
    amplitude: number;
    /** Nominal turns along UV length, in [0,16], with seeded 20 percent variation. */
    cycles: number;
    /** Nominal card width/length ratio in [0.01,100], used for the curl-normal direction. */
    aspectRatio: number;
  };
}

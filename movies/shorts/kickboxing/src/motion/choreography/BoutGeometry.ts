import type { BoutTechnique } from "./BoutTechnique";

/**
 * Extents the outcome resolver measures against: receiver regions, striking
 * surfaces, answering limbs and evasion reach. Production measures them from
 * the prepared figures' actual colliders and ROM; the anthropometric estimate
 * exists for pure units and for authoring before the figures are prepared.
 */
export namespace BoutGeometry {
  /** Lengths in metres along the axis on which an answer meets or leaves the weapon line. */
  export interface IExtents {
    /** Receiver region extent. */ readonly region: Readonly<Record<BoutTechnique.Target, number>>;
    /** Narrower receiver feature extent. */ readonly feature: Readonly<Record<BoutTechnique.Feature, number>>;
    /** Contact patch breadth of each striking surface. */ readonly surface: Readonly<Record<BoutTechnique.Surface, number>>;
    /** Breadth an answering limb spans when set: glove, forearm, or shin. */ readonly guard: Readonly<Record<"glove" | "forearm" | "shin", number>>;
    /** Head travel a fully set evasion achieves from the trunk's ROM. */ readonly evasion: Readonly<Record<"lateral" | "vertical" | "backward", number>>;
  }

  /**
   * Estimate from stature with Drillis and Contini's segment ratios
   * (Drillis, Contini and Bluestein 1964, Artificial Limbs 8(1)) and the
   * AAOS normal trunk ROM of 25° lateral flexion and 25° extension. A padded
   * glove's palm spans two hand breadths and its striking face one and a half.
   */
  export function anthropometric(height: number): IExtents {
    const handBreadth: number = 0.055 * height;
    const footBreadth: number = 0.055 * height;
    // Hip to the head centre is the evasion lever: shoulder (0.818 H) minus
    // greater trochanter (0.530 H), plus half the head height (0.130 H).
    const lever: number = (0.818 - 0.53 + 0.065) * height;
    const degrees: number = Math.PI / 180;
    return {
      region: { head: 0.13 * height, body: 0.288 * height, leg: 0.245 * height },
      feature: { "jaw-neck": 0.065 * height },
      surface: {
        fist: 1.5 * handBreadth,
        shin: footBreadth,
        instep: footBreadth,
        sole: footBreadth,
        knee: footBreadth,
      },
      guard: { glove: 2 * handBreadth, forearm: 0.146 * height, shin: 0.246 * height },
      evasion: {
        lateral: lever * Math.sin(25 * degrees),
        // A weave lowers the head by trunk flexion and by a symmetric squat in
        // which thigh (0.245 H) and shank (0.246 H) each tilt 30 degrees, half
        // of the 60 degree knee flexion inside the AAOS 0–135 degree range.
        vertical: lever * (1 - Math.cos(25 * degrees)) + (0.245 + 0.246) * height * (1 - Math.cos(30 * degrees)),
        backward: lever * Math.sin(25 * degrees),
      },
    };
  }
}

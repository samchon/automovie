import { interpolateAutoMovieSpline } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One height-and-angle family for the trunk's horizontal source sections.
 *
 * Every meridian is a fixed-angle evaluation of the same section state. The
 * centre and five positive shape dimensions share one ordered set of anatomical
 * heights. Positive dimensions interpolate their dimensionless logarithms
 * relative to the first section, so front/back supports are derived from one
 * centre and positive half-depths instead of clipped independent coordinates.
 * Independent measured sections remain exact interpolation keys. The engine's
 * sampled-tension C2 policy permits bounded sampled overshoot; it establishes
 * neither monotonicity nor a final subdivision-skin bound.
 *
 * @param keys Shared-axis centres, half dimensions and exponents, millimetres
 * @returns The section evaluator and its polar-angle guide family
 */
export function interpolateAutoMovieHumanTrunkSection(
  keys: readonly interpolateAutoMovieHumanTrunkSection.ISection[],
): interpolateAutoMovieHumanTrunkSection.IFamily {
  const ordered: interpolateAutoMovieHumanTrunkSection.ISection[] = [
    ...keys,
  ].sort(
    (
      a: interpolateAutoMovieHumanTrunkSection.ISection,
      b: interpolateAutoMovieHumanTrunkSection.ISection,
    ): number => a.height - b.height,
  );
  const knots: number[] = ordered.map(
    (key: interpolateAutoMovieHumanTrunkSection.ISection): number => key.height,
  );
  const centre: (height: number) => number = channel("centre");
  const forward: (height: number) => number = positive("forward");
  const backward: (height: number) => number = positive("backward");
  const half: (height: number) => number = positive("half");
  const front: (height: number) => number = positive("frontExponent");
  const back: (height: number) => number = positive("backExponent");
  function channel(
    name: keyof interpolateAutoMovieHumanTrunkSection.ISection,
  ): (height: number) => number {
    return interpolateAutoMovieSpline({
      knots,
      values: ordered.map(
        (key: interpolateAutoMovieHumanTrunkSection.ISection): number =>
          key[name],
      ),
    });
  }
  function positive(
    name: keyof interpolateAutoMovieHumanTrunkSection.ISection,
  ): (height: number) => number {
    const reference: number = ordered[0]![name];
    if (!(reference > 0) || !Number.isFinite(reference))
      throw new Error("trunk section dimensions must be positive and finite");
    const values: number[] = ordered.map(
      (key: interpolateAutoMovieHumanTrunkSection.ISection): number => {
        if (!(key[name] > 0) || !Number.isFinite(key[name]))
          throw new Error(
            "trunk section dimensions must be positive and finite",
          );
        return Math.log(key[name] / reference);
      },
    );
    const curve: (height: number) => number = interpolateAutoMovieSpline({
      knots,
      values,
    });
    return (height: number): number => reference * Math.exp(curve(height));
  }
  function at(height: number): interpolateAutoMovieHumanTrunkSection.ISection {
    return {
      height,
      centre: centre(height),
      forward: forward(height),
      backward: backward(height),
      half: half(height),
      frontExponent: front(height),
      backExponent: back(height),
    };
  }
  return {
    heights: Object.freeze([...knots]),
    at,
    point: (height: number, angle: number): IAutoMovieVector3 => {
      const section: interpolateAutoMovieHumanTrunkSection.ISection =
        at(height);
      const c: number = Math.cos(angle);
      const s: number = Math.sin(angle);
      const depth: number = c >= 0 ? section.forward : section.backward;
      const exponent: number =
        c >= 0 ? section.frontExponent : section.backExponent;
      const radius: number = Math.pow(
        Math.pow(Math.abs(c) / depth, exponent) +
          Math.pow(Math.abs(s) / section.half, exponent),
        -1 / exponent,
      );
      return { x: radius * s, y: height, z: section.centre + radius * c };
    },
  };
}

/** Anatomical section state and its generating family. */
export namespace interpolateAutoMovieHumanTrunkSection {
  /** One horizontal closed section in the shared model frame, millimetres. */
  export interface ISection {
    /** Shared physical Y plane above the standing surface. */
    height: number;

    /** Z position of the section's widest pair, derived from the spinal axis. */
    centre: number;

    /** Positive distance from that axis to the anterior support. */
    forward: number;

    /** Positive distance from that axis to the posterior support. */
    backward: number;

    /** Positive lateral half breadth; bilateral mirroring uses this one value. */
    half: number;

    /** Positive exponent of the anterior superellipse half. */
    frontExponent: number;

    /** Positive exponent of the posterior superellipse half. */
    backExponent: number;
  }

  /** All longitudinal guides are evaluations of this one source family. */
  export interface IFamily {
    /** Anatomical source knot heights, shared by section emission and every guide. */
    heights: readonly number[];

    /** Evaluate the shared section state at a physical Y plane, millimetres. */
    at: (height: number) => ISection;

    /** Intersect its source section with a polar ray, 0 forward, pi/2 left. */
    point: (height: number, angle: number) => IAutoMovieVector3;
  }
}

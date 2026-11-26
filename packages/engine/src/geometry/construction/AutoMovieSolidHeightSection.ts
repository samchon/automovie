import { AutoMovieBernstein64 as Bernstein } from "../curve/AutoMovieBernstein64";

/**
 * A physical cross-section of a first-order height surface. The cubic Hermite
 * part takes both positions and slopes from its actual boundaries. Its single
 * quartic term vanishes with its first derivative at both ends.
 *
 * @see https://www.farinhansford.com/gerald/papers/CAD_article.pdf Farin, geometric Hermite boundary interpolation.
 */
export namespace AutoMovieSolidHeightSection {
  /** Position, physical slope and their rates along one section boundary. */
  export interface IBoundary {
    /** Transverse coordinate. */
    x: number;

    /** Height. */
    height: number;

    /** Transverse coordinate derivative with respect to the section coordinate. */
    xRate: number;

    /**
     * Height derivative along the boundary with respect to the section
     * coordinate.
     */
    heightRate: number;

    /** Height derivative with respect to the transverse coordinate. */
    slope: number;

    /** Boundary slope derivative with respect to the section coordinate. */
    slopeRate: number;
  }

  /** Prepared control hull and derivatives in fixed orthonormal coordinates. */
  export interface ISection {
    /** Heights of the five Bernstein controls at equally spaced x coordinates. */
    controls: readonly number[];

    /**
     * Height and first derivatives with respect to section and width
     * coordinates.
     */
    at(x: number): { height: number; longitudinal: number; transverse: number };

    /** Prepare the second transverse derivative within this single section. */
    transverseSecond(): (x: number) => number;
  }

  /**
   * Prepare one section. The quartic coefficient and its rate are taken from
   * the containing surface's physical boundary compatibility. Width is
   * positive; a contracted boundary belongs to its own original first jet.
   */
  export function prepare(
    left: IBoundary,
    right: IBoundary,
    coefficient: number,
    coefficientRate: number,
  ): ISection {
    const { x: origin, xRate: originRate } = left;
    const width = right.x - origin;
    const widthRate = right.xRate - originRate;
    const controls = Bernstein.elevateScalar(
      [
        left.height,
        left.height + (width * left.slope) / 3,
        right.height - (width * right.slope) / 3,
        right.height,
      ],
      4,
    );
    const rates = Bernstein.elevateScalar(
      [
        left.heightRate,
        left.heightRate + (widthRate * left.slope + width * left.slopeRate) / 3,
        right.heightRate -
          (widthRate * right.slope + width * right.slopeRate) / 3,
        right.heightRate,
      ],
      4,
    );
    // t²(1−t)² is B(2,4)/6, and each physical width factor contributes width.
    controls[2]! += (coefficient * width ** 4) / 6;
    rates[2]! +=
      (coefficientRate * width ** 4 +
        4 * coefficient * width ** 3 * widthRate) /
      6;
    const derivative = Bernstein.dScalar(controls);
    return {
      controls,
      at(x) {
        const t = (x - origin) / width;
        const transverse = Bernstein.scalar(derivative, t) / width;
        return {
          height: Bernstein.scalar(controls, t),
          longitudinal:
            Bernstein.scalar(rates, t) -
            transverse * (originRate + t * widthRate),
          transverse,
        };
      },
      transverseSecond() {
        const second = Bernstein.dScalar(derivative);
        const denominator = width ** 2;
        return (x) =>
          Bernstein.scalar(second, (x - origin) / width) / denominator;
      },
    };
  }
}

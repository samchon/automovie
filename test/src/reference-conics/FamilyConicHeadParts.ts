/** Ownership at the supplied head partition's shared surfaces. */
export namespace FamilyConicHeadParts {
  /** A point in the supplied sagittally centred world frame. */
  export type V = [number, number, number];

  /** A signed cut with the kept side at nonpositive values. */
  type Cut = (point: V) => number;

  /** Signed fields from one placed head. */
  export interface ICuts {
    /** The wall's base ring, positive below the ring. */
    ring: Cut;
    /** The nasal cut. */
    nose: Cut;
    /** The authored eye's orbit. */
    orbit: Cut;
    /** The mouth wedge. */
    lips: Cut;
  }

  /** A face's region and its source-field measure. */
  export interface IPart {
    /** The named surface region. */
    name: "head" | "nose" | "eye" | "lips";
    /** Whether this part owns the supplied point, including its own boundary. */
    keeps: (point: V) => boolean;
    /** The part's original cut measure, positive outside. */
    outside: Cut;
  }

  /**
   * Apply the compositor's ownership order to actual supplied fields. The
   * nasal boundary owns its contact with the orbit or mouth. On the rest of
   * the skin the orbit owns its boundary, then the mouth owns its boundary.
   * The wall accounts for the reflected orbit in the shared frame.
   */
  export function build(cuts: ICuts): IPart[] {
    const symmetricOrbit: Cut = ([x, y, z]) => cuts.orbit([x, y, Math.abs(z)]);
    return [
      {
        name: "head",
        keeps: (point) =>
          cuts.ring(point) <= 0 &&
          cuts.nose(point) > 0 &&
          symmetricOrbit(point) > 0 &&
          cuts.lips(point) > 0,
        outside: (point) =>
          Math.max(
            cuts.ring(point),
            -cuts.nose(point),
            -symmetricOrbit(point),
            -cuts.lips(point),
          ),
      },
      { name: "nose", keeps: (point) => cuts.nose(point) <= 0, outside: cuts.nose },
      {
        name: "eye",
        keeps: (point) => cuts.nose(point) > 0 && cuts.orbit(point) <= 0,
        outside: (point) => Math.max(cuts.orbit(point), -cuts.nose(point)),
      },
      {
        name: "lips",
        keeps: (point) =>
          cuts.nose(point) > 0 &&
          symmetricOrbit(point) > 0 &&
          cuts.lips(point) <= 0,
        outside: (point) => Math.max(cuts.lips(point), -cuts.nose(point)),
      },
    ];
  }
}

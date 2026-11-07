/**
 * De Leva (1996) segment data, transcribed from Tables 4-6 of Brubaker,
 * Sigal and Fleet (2009), https://www.cs.toronto.edu/~ls/iccv2009tutorial/physTutReport.pdf.
 * Centres and gyration use that table's joint-centre segment endpoints.
 * Internal head/trunk/foot subdivisions retain only the published group mass;
 * their geometry-based allocation is a separate approximation in the provider.
 */
export namespace AutoMovieHumanSegmentInertia {
  /** Main anatomical regions, with sides supplied by the skeleton. */
  export type Region =
    | "head"
    | "trunk"
    | "UpperArm"
    | "LowerArm"
    | "Hand"
    | "UpperLeg"
    | "LowerLeg"
    | "Foot";
  /** Dimensionless mass fraction and optional joint-centre limb measurements. */
  export interface IRecord {
    /** Fraction of total body mass for one side, except head/trunk. */ mass: number;
    /** Centre distance from proximal endpoint, divided by segment length. */ center?: number;
    /** Sagittal, transverse and longitudinal radii divided by segment length. */ gyration?: readonly [
      number,
      number,
      number,
    ];
  }
  /** Male young-adult reference population; not an individual measurement. */
  export const male: Readonly<Record<Region, IRecord>> = {
    head: { mass: 0.0694 },
    trunk: { mass: 0.4346 },
    Foot: { mass: 0.0137 },
    UpperArm: { mass: 0.0271, center: 0.5772, gyration: [0.285, 0.269, 0.158] },
    LowerArm: { mass: 0.0162, center: 0.4574, gyration: [0.276, 0.265, 0.121] },
    Hand: { mass: 0.0061, center: 0.79, gyration: [0.628, 0.513, 0.401] },
    UpperLeg: { mass: 0.1416, center: 0.4095, gyration: [0.329, 0.329, 0.149] },
    LowerLeg: { mass: 0.0433, center: 0.4459, gyration: [0.255, 0.249, 0.103] },
  };
  /** Female young-adult reference population; not an individual measurement. */
  export const female: Readonly<Record<Region, IRecord>> = {
    head: { mass: 0.0668 },
    trunk: { mass: 0.4257 },
    Foot: { mass: 0.0129 },
    UpperArm: { mass: 0.0255, center: 0.5754, gyration: [0.278, 0.26, 0.148] },
    LowerArm: { mass: 0.0138, center: 0.4559, gyration: [0.261, 0.257, 0.094] },
    Hand: { mass: 0.0056, center: 0.7474, gyration: [0.531, 0.454, 0.335] },
    UpperLeg: { mass: 0.1478, center: 0.3612, gyration: [0.369, 0.364, 0.162] },
    LowerLeg: { mass: 0.0481, center: 0.4416, gyration: [0.271, 0.267, 0.093] },
  };
}

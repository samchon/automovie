/**
 * One shape basis of the body calibration: the displacement of every
 * calibrated quantity per unit of one public control.
 *
 * Its arrays follow the calibration they displace
 * ({@link IAutoMovieHumanBodyCalibration} and the vermilion boundary): chains
 * by name with one entry per principal layer, apertures by name, eyes by
 * side, poles by chain end and vermilion spans in order. Section
 * displacements live in each layer's frame and are stored on a coarser
 * periodic cubic B-spline than the chain's own sections, because a body
 * shape difference is smooth over phase; `AutoMovieHumanBodyLaw` samples it
 * at the chain's control points.
 */
export interface IAutoMovieHumanBodyMorph {
  /** Value of the driving control for the calibration specimen, where the basis contributes nothing. */
  reference: number;

  /** Section displacement of every chain. */
  chains: IAutoMovieHumanBodyMorph.IChain[];

  /** Displacement of every aperture's Fourier coefficients, mm, in the aperture's own layout. */
  apertures: IAutoMovieHumanBodyMorph.IAperture[];

  /** Displacement of every eyeball globe centre, mm. */
  eyes: IAutoMovieHumanBodyMorph.IEye[];

  /** Displacement of every pole point, mm. */
  poles: IAutoMovieHumanBodyMorph.IPole[];

  /** Displacement of both endpoints of every vermilion span, mm, in span order. */
  vermilion: IAutoMovieHumanBodyMorph.ISpan[];
}
export namespace IAutoMovieHumanBodyMorph {
  /** Section displacement of one chain. */
  export interface IChain {
    /** Calibration chain name. */
    name: string;

    /** Number of control points M of the displacement spline. */
    order: number;

    /** One entry per principal layer of the chain, in layer order. */
    layers: ILayer[];
  }

  /** Displacement of one principal layer, mm per unit control. */
  export interface ILayer {
    /** In-plane displacement control points `[dx_0..dx_{M-1}, dz_0..dz_{M-1}]` along the frame's u and v. */
    coefficients: number[];

    /** Station derivative of `coefficients`, per mm. */
    slopes: number[];

    /** Out-of-plane displacement control points along the frame normal `v x u`. */
    lift: number[];

    /** Station derivative of `lift`, per mm. */
    liftSlopes: number[];
  }

  /** Coefficient displacement of one aperture. */
  export interface IAperture {
    /** Aperture name. */
    name: string;

    /** Displacement of the aperture's x, y and z Fourier series. */
    coefficients: number[];
  }

  /** Displacement of one globe centre. */
  export interface IEye {
    /** Anatomical side. */
    side: "left" | "right";

    /** Centre displacement. */
    centre: [number, number, number];
  }

  /** Displacement of one pole. */
  export interface IPole {
    /** Chain the pole closes. */
    chain: string;

    /** Which end of the chain. */
    end: "top" | "bottom";

    /** Point displacement. */
    point: [number, number, number];
  }

  /** Displacement of one vermilion span's endpoints. */
  export interface ISpan {
    /** First endpoint displacement. */
    start: [number, number, number];

    /** Last endpoint displacement. */
    end: [number, number, number];
  }
}

/**
 * Named constants of the neck construction: a ring per layer as harmonics, and
 * how its size follows the tapes.
 *
 * Derivation: each of the four layers (bottom to top, `drop` millimetres under
 * the top one) is a least-squares regression over the reference source's neck
 * sections (f1, f2, m1, m2). A layer's half width and half depth are
 * log-linear, `log(size / tape) = level + sex * s + gain * log(tape)`, in the
 * neck tape read at that layer and the masculine-feminine control `s`; its
 * forward centre is linear in `s`; its ring, normalized by those sizes, is the
 * truncated Fourier series of the section's forward place, lateral place and
 * height off the layer's mean over the uniform phase (20 harmonics). The values
 * are fitted observations of four people, not a published population law; the
 * fitting program is no longer kept, and a law that replaces them reads the
 * neck at its ISO 8559-1 sites instead.
 */
export namespace AutoMovieHumanNeckPrior {
  /** A size per layer. */
  export interface ISize {
    /** Log of the size over the tape read there. */
    level: readonly number[];

    /** Per unit of the masculine-feminine control. */
    sex: readonly number[];

    /** Per unit of the log of the tape read there. */
    gain: readonly number[];
  }

  /** A place per layer. */
  export interface IPlace {
    /** Forward place, mm. */
    level: readonly number[];

    /** Per unit of the masculine-feminine control. */
    sex: readonly number[];
  }

  /** One layer's ring as harmonics of its phase. */
  export interface IRing {
    /** Forward place over the depth: cosines from the constant term. */
    x: readonly number[];

    /** Lateral place over the width: sines from the first. */
    z: readonly number[];

    /** Height off the ring's mean, mm: cosines from the constant term. */
    y: readonly number[];
  }

  /** The prior. */
  export interface IPrior {
    /** Control points of a section. */
    order: number;

    /** Uniform phases of the rings. */
    samples: number;

    /** Half width per layer, from the bottom. */
    width: ISize;

    /** Half depth per layer. */
    depth: ISize;

    /** Forward centre per layer. */
    place: IPlace;

    /** Mean height of each layer off the top layer's, mm. */
    drop: readonly number[];

    /** Normalized ring per layer. */
    rings: readonly IRing[];
  }

  /** The law's constants. */
  export const PRIOR: IPrior = {order: 256,samples: 280,width: {level: [3.8507,2.988,1.8418,0.1298],sex: [-0.037,-0.039,-0.034,-0.024],gain: [0.212,0.335,0.509,0.78]},depth: {level: [0.7847,-0.5693,-2.2833,-4.5175],sex: [-0.025,-0.015,0,0.014],gain: [0.581,0.802,1.085,1.46]},place: {level: [-20.6,-22.65,-23.34,-23.1],sex: [0.66,0.16,-0.07,-0.26]},drop: [-20.93,-13.95,-6.98,0],rings: [{x: [0,1.02546,0.01243,-0.05818,0.10917,0.00408,-0.02053,-0.03668,0.00579,0.01319,0.00868,-0.01241,-0.01146,-0.00566,0.00147,-0.00181,-0.0025,-0.0026,-0.0008,-0.00215,-0.00163],z: [0.87015,-0.01927,-0.0801,0.00489,0.02557,0.00823,-0.0122,-0.00699,0.00482,0.00415,-0.00131,-0.00185,0.00128,0.0008,-0.00112,-0.0012,0.0005,0.00076,-0.00006,-0.00052],y: [0,-3.47325,-0.49779,-0.2462,-0.8164,-0.32075,0.26297,0.19236,-0.05139,-0.09319,0.10374,0.11988,0.01865,0.02264,-0.01023,0.00428,0.00538,0.00795,0.02327,0.02074,-0.00544]},{x: [0,0.98103,0.05566,0.01139,0.09637,-0.02098,-0.01061,-0.0119,0.00575,0.00118,0.00333,-0.00928,-0.00729,-0.00353,-0.00004,-0.00198,-0.00154,-0.00236,-0.00151,-0.00195,-0.00221],z: [0.92916,-0.03353,-0.05803,0.00828,0.01039,0.00563,0.00145,-0.00173,-0.0002,0.0001,-0.00021,0.0002,0.0019,0.00044,-0.00102,-0.00041,0.00083,0.00029,-0.00061,-0.00064],y: [0,-3.24011,-0.97174,-0.27854,-0.52689,-0.10855,0.17947,0.12735,0.0854,-0.00485,0.06096,0.05257,-0.00096,0.01611,-0.00379,0.02548,0.00137,0.00346,0.00181,0.01061,0.00879]},{x: [0,0.94548,0.09842,0.06925,0.08068,-0.03004,-0.00337,-0.00362,0.00431,-0.00186,-0.00062,-0.00615,-0.00418,-0.00343,-0.00139,-0.0011,-0.00066,-0.0014,-0.00183,-0.00222,-0.00203],z: [0.97494,-0.04206,-0.03035,0.00715,-0.00202,0.00585,0.00982,0.00084,-0.0011,-0.00219,-0.00085,0.00076,0.00187,0.00078,0.00008,-0.00001,0.00016,-0.00029,-0.00079,-0.0005],y: [0,-2.89036,-1.22692,-0.22865,-0.27962,0.0577,0.17997,0.10632,0.12837,0.0442,0.03323,0.02803,-0.01336,0.0141,0.00467,0.023,-0.00497,0.0024,-0.00441,0.0088,0.00836]},{x: [0,0.91175,0.14099,0.11901,0.06315,-0.02641,0.00115,-0.00769,0.00198,0.00139,-0.00296,-0.00264,-0.0026,-0.00437,-0.00234,0.00015,0.00041,-0.00008,-0.00185,-0.00249,-0.00155],z: [1.01697,-0.04507,0.00339,0.00143,-0.01153,0.00896,0.01297,0.00133,0.00185,-0.00339,-0.00277,-0.00006,0.00109,0.00211,0.0017,-0.00002,-0.00118,-0.0011,-0.00047,-0.00023],y: [0,-2.48082,-1.30451,-0.10608,-0.08502,0.17191,0.24878,0.1249,0.10112,0.0601,0.01558,0.03011,-0.02383,0.02336,0.01949,0.00203,-0.01593,0.00603,0.00727,0.01311,-0.0054]}]};
}

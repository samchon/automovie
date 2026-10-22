import type { IAutoMovieMaterial, IAutoMovieMesh } from "@automovie/interface";

import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";
import { AutoMovieHumanRevolution } from "./AutoMovieHumanRevolution";
import type { IAutoMovieHumanAppearanceBody } from "./IAutoMovieHumanAppearanceBody";

/**
 * Eye globe of sclera, iris with pupil, and cornea, built from adult ocular
 * biometry about the visual axis.
 *
 * Representation: three surfaces of revolution about the globe's gaze axis
 * (see {@link AutoMovieHumanRevolution}). The sclera is an ellipsoid of
 * revolution; the cornea is a spherical cap whose rim meets the sclera
 * exactly at the limbus; the iris is a shallow cone at the anterior chamber
 * depth behind the corneal apex, joined to the limbus by a short dark
 * angle wall so no gap opens between iris and sclera when seen through the
 * cornea. The pupil is a black disc recessed onto the lens plane.
 *
 * Dimensions are biometric means, the same for every person: adult globe
 * size varies little with sex, age or ancestry (Bekerman et al. 2014 found
 * no significant difference by those factors) and no Human parameter
 * describes it. Derived quantities (the scleral axial semi-axis and the
 * apex position) follow from those means by the stated geometry, not by
 * fitting. The globe is not scaled with stature.
 *
 * Optics: the cornea is a thin-walled transmissive dielectric of the
 * corneal refractive index, so the iris shows through it with the full
 * Fresnel highlight on top. This costs the renderer's transmission pass
 * (one extra opaque-scene render per frame while a cornea is visible);
 * refraction of the iris image is not modelled (zero thickness).
 */
export namespace AutoMovieHumanEyeball {
  /**
   * Biometric means in millimetres, with their basis.
   *
   * - `radial`: half the mean of the transverse 24.16/24.32 and vertical
   *   23.80/23.75 globe diameters (Bekerman 2014, Table 1, CT, n = 250);
   *   measured.
   * - `axialLength`: corneal apex to posterior pole, 23.48 (Chen 2016,
   *   IOLMaster, n = 1015); measured.
   * - `cornealRadius`: 337.5 / 44.20 D = 7.64 (Chen 2016, keratometric
   *   index 1.3375); derived from measured keratometry.
   * - `limbusRadius`: half the horizontal visible iris diameter, 11.7 mm
   *   (white-to-white, Rüfer et al. 2005, J Cataract Refract Surg
   *   31(1):107-112: 11.71 +/- 0.42); measured, relayed.
   * - `anteriorChamberDepth`: corneal apex to the lens face on which the
   *   pupillary iris rests, 3.03 (Chen 2016); measured.
   * - `pupilRadius`: 1.75, a 3.5 mm photopic pupil; conventional, since no
   *   lighting or expression input sets it.
   * - `irisRecession`: 0.5, how far the iris root lies behind its
   *   pupillary margin (the iris is a shallow cone over the lens);
   *   conventional.
   */
  export const dimensions: {
    radial: number;
    axialLength: number;
    cornealRadius: number;
    limbusRadius: number;
    anteriorChamberDepth: number;
    pupilRadius: number;
    irisRecession: number;
  } = {
    radial: 12.0,
    axialLength: 23.48,
    cornealRadius: 7.64,
    limbusRadius: 5.85,
    anteriorChamberDepth: 3.03,
    pupilRadius: 1.75,
    irisRecession: 0.5,
  };

  /**
   * Quantities derived from {@link dimensions}, millimetres along the gaze
   * axis from the globe centre.
   *
   * The scleral ellipsoid has radial semi-axis `a_r` and axial semi-axis
   * `a_x`; the limbus circle of radius `rho_L` lies on it at
   * `x_L = a_x k`, `k = sqrt(1 - rho_L^2 / a_r^2)`. The corneal sphere of
   * radius `r_c` passes through that circle, so its sagittal height above
   * the limbus plane is `s = r_c - sqrt(r_c^2 - rho_L^2)` and the apex is at
   * `x_A = x_L + s`. With the posterior pole at `-a_x`, the axial length is
   * `L = x_A + a_x`, hence `a_x = (L - s) / (1 + k)`.
   */
  export interface IDerived {
    /** Axial semi-axis of the scleral ellipsoid. */
    axial: number;

    /** Limbus plane position. */
    limbus: number;

    /** Corneal sphere centre position. */
    cornealCentre: number;

    /** Corneal apex position. */
    apex: number;

    /** Pupillary iris margin position, on the lens face. */
    pupil: number;
  }

  /**
   * Evaluate {@link IDerived} from {@link dimensions}.
   *
   * @returns Derived axial positions in millimetres
   */
  export function derive(): IDerived {
    const d: typeof dimensions = dimensions;
    const k: number = Math.sqrt(1 - (d.limbusRadius / d.radial) ** 2);
    const capOffset: number = Math.sqrt(
      d.cornealRadius ** 2 - d.limbusRadius ** 2,
    );
    const sag: number = d.cornealRadius - capOffset;
    const axial: number = (d.axialLength - sag) / (1 + k);
    const limbus: number = axial * k;
    const apex: number = limbus + sag;
    return {
      axial,
      limbus,
      cornealCentre: limbus - capOffset,
      apex,
      pupil: apex - d.anteriorChamberDepth,
    };
  }

  /** Generated meshes of one eye, in model metres. */
  export interface IOutput {
    /** Visible scleral ellipsoid from the limbus back past the equator. */
    sclera: IAutoMovieMesh;

    /** Pupil, iris and limbal angle wall, with UV0 over the iris image. */
    iris: IAutoMovieMesh;

    /** Corneal cap from apex to limbus. */
    cornea: IAutoMovieMesh;
  }

  /**
   * Build one eye.
   *
   * @param props.eye Globe frame from the body generator
   * @param props.uvTurn Rotation of the iris image about the pupil, in turns; a different value per side keeps the two irises from repeating each other
   * @returns Sclera, iris and cornea meshes
   */
  export function generate(props: {
    eye: IAutoMovieHumanAppearanceBody.IEye;
    uvTurn: number;
  }): IOutput {
    const d: typeof dimensions = dimensions;
    const g: IDerived = derive();
    const frame: AutoMovieHumanRevolution.IFrame = {
      origin: props.eye.centre,
      axis: props.eye.forward,
      up: props.eye.up,
    };

    // Angular resolution: 64 segments keep the 5.85 mm limbus polygon
    // within 0.007 mm of its circle (rho (1 - cos(pi / 64))), below a
    // pixel even in a full-screen eye close-up of 1200 pixels.
    const segments: number = 64;

    // Sclera from the limbus (polar angle phi_L on the ellipsoid) to 120
    // degrees from the gaze axis, past the equator, which the lids and
    // socket always hide.
    const phiL: number = Math.asin(d.limbusRadius / d.radial);
    const phiEnd: number = (120 * Math.PI) / 180;
    const sclera: Array<[number, number]> = [];
    for (let i: number = 0; i <= 24; ++i) {
      const phi: number = phiL + ((phiEnd - phiL) * i) / 24;
      sclera.push([g.axial * Math.cos(phi), d.radial * Math.sin(phi)]);
    }

    // Corneal cap from the apex (rho = 0) to the limbus circle.
    const phiC: number = Math.asin(d.limbusRadius / d.cornealRadius);
    const cornea: Array<[number, number]> = [];
    for (let i: number = 0; i <= 12; ++i) {
      const phi: number = (phiC * i) / 12;
      cornea.push([
        g.cornealCentre + d.cornealRadius * Math.cos(phi),
        d.cornealRadius * Math.sin(phi),
      ]);
    }

    // Iris: the pupil disc lies 0.3 mm behind the pupillary margin (the
    // pigmented iris border thickness over the lens, conventional), then a
    // short margin wall, the iris cone and the angle wall up to the limbus.
    const lens: number = g.pupil - 0.3;
    const root: number = d.limbusRadius - 0.1;
    const rootX: number = g.pupil - d.irisRecession;
    const iris: Array<[number, number]> = [];
    for (let i: number = 0; i <= 10; ++i) {
      const t: number = i / 10;
      iris.push([
        g.pupil - d.irisRecession * t * t,
        d.pupilRadius + (root - d.pupilRadius) * t,
      ]);
    }

    // The iris image covers the limbus disc; u and v span its diameter so
    // the image's inscribed circle is the limbus. Row zero samples v = 0.
    const turn: number = 2 * Math.PI * props.uvTurn;
    const cosT: number = Math.cos(turn);
    const sinT: number = Math.sin(turn);
    const irisUv: (x: number, y: number, z: number) => [number, number] = (
      _x: number,
      y: number,
      z: number,
    ): [number, number] => {
      const ry: number = (y * cosT + z * sinT) / d.limbusRadius;
      const rz: number = (z * cosT - y * sinT) / d.limbusRadius;
      return [0.5 + 0.5 * rz, 0.5 - 0.5 * ry];
    };

    return {
      sclera: AutoMovieHumanRevolution.mesh({
        strips: [{ profile: sclera, segments }],
        frame,
        uv: null,
        color: (x: number, y: number, z: number): [number, number, number] =>
          scleraColor(x, y, z, g.limbus),
      }),
      iris: AutoMovieHumanRevolution.mesh({
        strips: [
          {
            profile: [
              [lens, 0],
              [lens, d.pupilRadius],
            ],
            segments,
          },
          {
            profile: [
              [lens, d.pupilRadius],
              [g.pupil, d.pupilRadius],
            ],
            segments,
          },
          { profile: iris, segments },
          {
            profile: [
              [rootX, root],
              [g.limbus, d.limbusRadius],
            ],
            segments,
          },
        ],
        frame,
        uv: irisUv,
        color: null,
      }),
      cornea: AutoMovieHumanRevolution.mesh({
        strips: [{ profile: cornea, segments }],
        frame,
        uv: null,
        color: null,
      }),
    };
  }

  /**
   * Materials of both eyes: ids `human.eye.sclera`, `human.eye.iris` and
   * `human.eye.cornea`.
   *
   * Sclera: white base multiplied by vertex colour, roughness 0.3 for the
   * tear-filmed conjunctiva (conventional). Iris: the generated image in
   * sRGB, roughness 0.6, since its gloss comes from the cornea above it.
   * Cornea: thin-walled transmission 1 with index 1.376 (Gullstrand
   * schematic eye cornea; conventional), roughness 0.02 for the tear film's
   * sharp highlight, opaque alpha as transmission requires.
   *
   * @param irisImage Id of the iris image the model carries
   * @returns The three materials
   */
  export function materials(irisImage: string): IAutoMovieMaterial[] {
    const white: { r: number; g: number; b: number; a: number; hex: null } =
      { r: 1, g: 1, b: 1, a: 1, hex: null };
    return [
      {
        id: "human.eye.sclera",
        name: "eye sclera",
        baseColor: white,
        metallic: 0,
        roughness: 0.3,
        emissive: null,
        opacity: 1,
        baseColorTexture: null,
      },
      {
        id: "human.eye.iris",
        name: "eye iris",
        baseColor: white,
        metallic: 0,
        roughness: 0.6,
        emissive: null,
        opacity: 1,
        baseColorTexture: {
          asset: irisImage,
          texCoord: 0,
          colorSpace: "srgb",
          sampler: {
            wrapS: "clamp",
            wrapT: "clamp",
            minFilter: "linearMipmapLinear",
            magFilter: "linear",
          },
        },
      },
      {
        id: "human.eye.cornea",
        name: "eye cornea",
        baseColor: white,
        metallic: 0,
        roughness: 0.02,
        emissive: null,
        opacity: 1,
        baseColorTexture: null,
        alphaMode: "opaque",
        transmission: 1,
        ior: 1.376,
        thickness: 0,
      },
    ];
  }
}

/**
 * Linear RGB multiplier of the sclera at a local point.
 *
 * Base: sRGB (238, 232, 226), a slightly warm white (conventional). Toward
 * the canthi the exposed bulbar conjunctiva shows its vessels, so the
 * horizontal sides blend toward sRGB (214, 168, 160) with a faint
 * low-frequency mottling; near the limbus the thinning sclera reads
 * greyer, blending toward sRGB (196, 198, 204). All three are artistic
 * conventions, not colorimetric measurements.
 *
 * @param x Local axial position, millimetres
 * @param y Local vertical position, millimetres
 * @param z Local horizontal position, millimetres
 * @param limbus Axial position of the limbus plane, millimetres
 * @returns Linear RGB in `[0, 1]`
 */
function scleraColor(
  x: number,
  y: number,
  z: number,
  limbus: number,
): [number, number, number] {
  const rho: number = Math.hypot(y, z) || 1;

  // Horizontal share of the direction around the axis: one at the canthi,
  // zero above and below the cornea.
  const horizontal: number = (z / rho) ** 2;

  // Distance behind the limbus along the axis; vessels thicken away from it.
  const behind: number = limbus - x;
  // Twelve lattice cells around the axis, periodic so the field closes.
  const mottle: number = AutoMovieHumanAppearanceNoise.value2(
    0x5c1e,
    (Math.atan2(y, z) / (2 * Math.PI)) * 12,
    behind * 0.6,
    12,
  );
  const vessel: number =
    0.55 *
    horizontal *
    AutoMovieHumanAppearanceNoise.smoothstep(0.5, 7, behind) *
    (0.6 + 0.4 * mottle);
  const grey: number =
    0.5 * (1 - AutoMovieHumanAppearanceNoise.smoothstep(0, 1.6, behind));

  const out: [number, number, number] = [0, 0, 0];
  const base: [number, number, number] = [238, 232, 226];
  const red: [number, number, number] = [214, 168, 160];
  const limbal: [number, number, number] = [196, 198, 204];
  for (let a: number = 0; a < 3; ++a) {
    const srgb: number =
      base[a]! + (red[a]! - base[a]!) * vessel + (limbal[a]! - base[a]!) * grey;
    out[a] = srgbToLinear(srgb / 255);
  }
  return out;
}

/**
 * sRGB transfer function inverse (IEC 61966-2-1).
 *
 * @param c Encoded component in `[0, 1]`
 * @returns Linear component in `[0, 1]`
 */
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

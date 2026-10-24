import type { IAutoMovieMaterial, IAutoMovieMesh } from "@automovie/interface";

import { AutoMovieHumanEyeGlobe } from "../generation/AutoMovieHumanEyeGlobe";
import type { AutoMovieHumanEyelid } from "../generation/AutoMovieHumanEyelid";
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
 * Dimensions are the biometric means of {@link AutoMovieHumanEyeGlobe},
 * the same for every person and shared with the body generator, which
 * rests the lid margins on the same anterior surface. These dimensions
 * are in calibration millimetres; the body and all eye tissue use one
 * conversion to model metres, including the current stature scale.
 *
 * Lid shading: the renderer casts no shadows, yet the lids shade the eye
 * they rest on, most visibly the upper lid's band across the top of the
 * iris and sclera. Given the lid margin, the sclera and iris vertex colours
 * carry that occlusion as a falloff with the depth inside the opening below
 * the upper lid and above the lower lid (see {@link occlusion}).
 *
 * Optics: the cornea is a thin glossy shell over the iris that adds the
 * tear film's sharp highlight and slightly veils the iris (see
 * {@link AutoMovieHumanEyeball.materials}); refraction by the anterior
 * chamber is not modelled. The sclera carries a clear-coat tear film over
 * a rougher base and a procedural vessel image.
 */
export namespace AutoMovieHumanEyeball {
  /**
   * Biometric globe dimensions in millimetres, shared with the body
   * generator; see {@link AutoMovieHumanEyeGlobe.dimensions}.
   */
  export const dimensions: typeof AutoMovieHumanEyeGlobe.dimensions =
    AutoMovieHumanEyeGlobe.dimensions;

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
   * @param props.mirror Whether the sclera image is mirrored left to right (z to -z), so both eyes keep its vessels on the same anatomical sides
   * @param props.lid Lid margin of this eye, which shades the globe; null leaves it unshaded
   * @returns Sclera, iris and cornea meshes
   */
  export function generate(props: {
    eye: IAutoMovieHumanAppearanceBody.IEye;
    uvTurn: number;
    mirror: boolean;
    lid: AutoMovieHumanEyelid.ILid | null;
    /** Calibration millimetres to model metres, as used by the skin. */
    scale: number;
  }): IOutput {
    const d: typeof dimensions = dimensions;
    const g: AutoMovieHumanEyeGlobe.IDerived = AutoMovieHumanEyeGlobe.derive();
    // Seat the globe on the observed eye surface when the body gives it.
    const shift: number =
      props.eye.radius === undefined
        ? 0
        : AutoMovieHumanEyeGlobe.seat(props.eye.radius / props.scale);
    const frame: AutoMovieHumanRevolution.IFrame = {
      // The actual seated lid frame owns contact. Re-seating a scaled
      // sphere against unscaled biometric dimensions changes that contact.
      origin:
        props.lid === null
          ? ([0, 1, 2].map(
              (a: number): number =>
                props.eye.centre[a]! +
                props.eye.forward[a]! * shift * props.scale,
            ) as [number, number, number])
          : (props.lid.globe.centre.map(
              (v: number): number => v * props.scale,
            ) as [number, number, number]),
      axis: props.lid?.globe.forward ?? props.eye.forward,
      up: props.lid?.globe.up ?? props.eye.up,
    };
    const shade: (y: number, z: number) => number =
      props.lid === null ? (): number => 1 : occlusion(props.lid);

    // Angular resolution: 128 segments keep the 5.85 mm limbus polygon
    // within 0.002 mm of its circle (rho (1 - cos(pi / 128))) and resolve
    // the lid shading, whose falloff spans about a millimetre.
    const segments: number = 128;

    // Sclera from the limbus (polar angle phi_L on the ellipsoid) to 120
    // degrees from the gaze axis, past the equator, which the lids and
    // socket always hide.
    const phiL: number = Math.asin(d.limbusRadius / d.radial);
    const phiEnd: number = (120 * Math.PI) / 180;
    const sclera: Array<[number, number]> = [];
    for (let i: number = 0; i <= 48; ++i) {
      const phi: number = phiL + ((phiEnd - phiL) * i) / 48;
      sclera.push([g.axial * Math.cos(phi), d.radial * Math.sin(phi)]);
    }

    // Corneal cap from the apex (rho = 0) to the limbus circle.
    const phiC: number = Math.asin(d.limbusRadius / d.cornealRadius);
    const cornea: Array<[number, number]> = [];
    for (let i: number = 0; i <= 16; ++i) {
      const phi: number = (phiC * i) / 16;
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
    for (let i: number = 0; i <= 12; ++i) {
      const t: number = i / 12;
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
        scale: props.scale,

        // u once around the axis, v from the limbus to the hidden edge, the
        // layout of AutoMovieHumanScleraImage; mirroring maps theta to
        // pi - theta (z to -z) and relies on the repeating sampler.
        uv: (
          _x: number,
          _y: number,
          _z: number,
          theta: number,
          along: number,
        ): [number, number] => {
          const u: number = theta / (2 * Math.PI);
          return [props.mirror ? 0.5 - u : u, along];
        },
        color: (x: number, y: number, z: number): [number, number, number] => {
          const k: number = shade(y, z);
          const base: [number, number, number] = scleraColor(x, y, z, g.limbus);
          return [base[0] * k, base[1] * k, base[2] * k];
        },
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
        scale: props.scale,
        uv: irisUv,
        color: (_x: number, y: number, z: number): [number, number, number] => {
          const k: number = shade(y, z);
          return [k, k, k];
        },
      }),
      cornea: AutoMovieHumanRevolution.mesh({
        strips: [{ profile: cornea, segments }],
        frame,
        scale: props.scale,
        uv: null,
        color: null,
      }),
    };
  }

  /**
   * Materials of both eyes: ids `human.eye.sclera`, `human.eye.iris` and
   * `human.eye.cornea`.
   *
   * Sclera: white base multiplied by vertex colour and the vessel image.
   * The wet look is two layers: the conjunctiva and sclera beneath scatter
   * broadly (roughness 0.45), and the tear film over them is a smooth
   * clear coat (clearcoat 1, the renderer's default coat roughness 0) that
   * carries the sharp highlight, as a dielectric film over a rough base
   * does. Iris: the generated image in sRGB times the lid shading in the
   * vertex colours, roughness 0.6, since its gloss comes from the cornea
   * above it. Cornea: a black, alpha-blended shell of opacity 0.2 with
   * index 1.376 (Gullstrand schematic eye cornea; conventional) and
   * roughness 0.02, so it contributes only its specular reflection: the key
   * light's highlight is far brighter than the display range and stays
   * white after the 0.2 blend, while the iris and sclera beneath show at 80
   * percent. A transmissive cornea would keep the full Fresnel response,
   * but its separate opaque-scene pass did not show the iris in the PNG
   * service's renders (2026-10-22, the iris read as the background), and it
   * costs an extra scene render per frame. The blend writes no depth; the
   * cornea is the outermost eye surface, so nothing of the eye needs
   * sorting behind it.
   *
   * @param irisImage Id of the iris image the model carries
   * @param scleraImage Id of the sclera vessel image the model carries
   * @returns The three materials
   */
  export function materials(
    irisImage: string,
    scleraImage: string,
  ): IAutoMovieMaterial[] {
    const white: { r: number; g: number; b: number; a: number; hex: null } = {
      r: 1,
      g: 1,
      b: 1,
      a: 1,
      hex: null,
    };
    return [
      {
        id: "human.eye.sclera",
        name: "eye sclera",
        baseColor: white,
        metallic: 0,
        roughness: 0.45,
        emissive: null,
        opacity: 1,
        baseColorTexture: {
          asset: scleraImage,
          texCoord: 0,
          colorSpace: "srgb",
          sampler: {
            wrapS: "repeat",
            wrapT: "clamp",
            minFilter: "linearMipmapLinear",
            magFilter: "linear",
          },
        },
        clearcoat: 1,
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
        baseColor: { r: 0, g: 0, b: 0, a: 1, hex: null },
        metallic: 0,
        roughness: 0.02,
        emissive: null,
        opacity: 0.2,
        baseColorTexture: null,
        alphaMode: "blend",
        ior: 1.376,
      },
    ];
  }

  /**
   * Lid shading of the globe: a multiplier of a point's colour from its
   * position across the gaze, in the globe's frame.
   *
   * The margin is projected along the gaze into the globe's (lateral, up)
   * plane. A point inside the opening at depth `delta` from the nearest
   * margin point keeps `1 - k exp(-delta / lambda)` of its light: the upper
   * lid, thick and overhanging with its lashes, shades a band of about two
   * millimetres (k 0.55, lambda 1.6 mm); the lower lid, thin and below the
   * light, a narrow one (k 0.3, lambda 0.7 mm). Points outside the opening
   * lie under the lids and take the margin value. These are conventions
   * that stand in for the shadow and ambient occlusion the renderer does
   * not compute, not measurements.
   *
   * @param lid Lid margin, in the frame of its own seated globe
   * @returns Multiplier of a local point's colour given its up `y` and
   *   lateral `z` coordinates in millimetres
   */
  export function occlusion(
    lid: AutoMovieHumanEyelid.ILid,
  ): (y: number, z: number) => number {
    const c: [number, number, number] = lid.globe.centre;
    const plane: Array<[number, number]> = lid.samples.map(
      (s: AutoMovieHumanEyelid.ISample): [number, number] => {
        const d: number[] = [0, 1, 2].map(
          (a: number): number => s.contact[a]! - c[a]!,
        );
        return [
          d[0]! * lid.globe.lateral[0] +
            d[1]! * lid.globe.lateral[1] +
            d[2]! * lid.globe.lateral[2],
          d[0]! * lid.globe.up[0] +
            d[1]! * lid.globe.up[1] +
            d[2]! * lid.globe.up[2],
        ];
      },
    );
    return (y: number, z: number): number => {
      let nearest: number = Infinity;
      let owner: number = 0;
      let inside: boolean = false;
      for (
        let i: number = 0, j: number = plane.length - 1;
        i < plane.length;
        j = i++
      ) {
        const a: [number, number] = plane[j]!;
        const b: [number, number] = plane[i]!;
        const dl: number = b[0] - a[0];
        const du: number = b[1] - a[1];
        const l: number = dl * dl + du * du;
        const w: number =
          l > 0
            ? Math.min(1, Math.max(0, ((z - a[0]) * dl + (y - a[1]) * du) / l))
            : 0;
        const e: number = (a[0] + w * dl - z) ** 2 + (a[1] + w * du - y) ** 2;
        if (e < nearest) {
          nearest = e;
          owner = w < 0.5 ? j : i;
        }
        if (a[1] > y !== b[1] > y && z < (dl * (y - a[1])) / du + a[0])
          inside = !inside;
      }
      const delta: number = inside ? Math.sqrt(nearest) : 0;
      const upper: boolean = lid.samples[owner]!.upper;
      const k: number = upper ? 0.55 : 0.3;
      const lambda: number = upper ? 1.6 : 0.7;
      return 1 - k * Math.exp(-delta / lambda);
    };
  }
}

/**
 * Linear RGB multiplier of the sclera at a local point.
 *
 * Base: sRGB (246, 242, 236), a slightly warm white (conventional). Toward
 * the canthi the exposed bulbar conjunctiva shows its vessels, so the
 * horizontal sides blend toward sRGB (226, 190, 180) with a faint
 * low-frequency mottling; near the limbus the thinning sclera reads
 * greyer, blending toward sRGB (205, 206, 210). All three are artistic
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
    0.35 *
    horizontal ** 2 *
    AutoMovieHumanAppearanceNoise.smoothstep(2, 8, behind) *
    (0.6 + 0.4 * mottle);
  const grey: number =
    0.35 * (1 - AutoMovieHumanAppearanceNoise.smoothstep(0, 1.2, behind));

  const out: [number, number, number] = [0, 0, 0];
  const base: [number, number, number] = [246, 242, 236];
  const red: [number, number, number] = [226, 190, 180];
  const limbal: [number, number, number] = [205, 206, 210];
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

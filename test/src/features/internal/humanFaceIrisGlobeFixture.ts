import {
  type IAutoMovieHumanFaceBasis,
  createPortraitMaterials,
  encodePortraitPng,
} from "@automovie/human";

/**
 * Analytic textured globes for the iris pigment rule, with every answer known
 * by construction.
 *
 * Each eye is a latitude-longitude sphere of radius 12 mm (rings every 5
 * degrees of polar angle from the +Z pole, 24 meridians), centred at
 * (+-0.032, 0.03, 0.1). Vertices within 30 degrees of +Z stand out by a
 * corneal bulge `0.8 mm * cos(3 theta)`, so the optical axis is exactly +Z by
 * symmetry. The UV map is azimuthal: `u = centre_u + 0.2 * theta/pi * cos phi`,
 * `v = 0.5 + 0.2 * theta/pi * sin phi`, the left eye's disc centred at
 * u = 0.25 and the right eye's at u = 0.75, so the pole is the disc centre and
 * texture radius grows linearly with polar angle; a 256-texel texture puts
 * the anatomical limbus (28.9 degrees) about 8 texels from the centre, and
 * the two discs (radius 0.2) do not overlap. The
 * texture is uniformly white (255) and opaque. Every globe vertex is bound to
 * its eye owner with weight one. Options change the radius and texture
 * size, paint a grey iris into the texture and leave out a band of rings. Articulation lists `leftEye` and
 * `rightEye`; the jaw fields are inert here because the pigment rule reads
 * only the eye ids.
 */
export function humanFaceIrisGlobeFixture(
  options: {
    /** Sclera radius, metres (12 mm when omitted). */
    radius?: number;
    /** Texture size in texels (256 when omitted). */
    size?: number;
    /** Paint the texture grey (64) within this polar angle, degrees. */
    painted?: number;
    /** Leave out the triangles whose rings lie in this polar band, degrees. */
    gap?: [number, number];
  } = {},
): IAutoMovieHumanFaceBasis {
  const size = options.size ?? 256;
  const rgba = new Uint8Array(size * size * 4).fill(255);
  if (options.painted !== undefined)
    for (const centreU of [0.25, 0.75])
      for (let y = 0; y < size; ++y)
        for (let x = 0; x < size; ++x) {
          const degrees =
            (Math.hypot((x + 0.5) / size - centreU, (y + 0.5) / size - 0.5) /
              0.2) *
            180;
          if (degrees <= options.painted)
            rgba.fill(64, 4 * (y * size + x), 4 * (y * size + x) + 3);
        }
  const texture = encodePortraitPng({ width: size, height: size, rgba });
  const positions: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  const attachments: { owner: string; rows: number[] }[] = [];
  const rings = 36;
  const meridians = 24;
  for (const [eye, centreX, centreU] of [
    ["leftEye", 0.032, 0.25],
    ["rightEye", -0.032, 0.75],
  ] as const) {
    const first = positions.length / 3;
    const vertex = (ring: number, meridian: number): number =>
      ring === 0
        ? first
        : ring === rings
          ? first + 1 + (rings - 1) * meridians
          : first + 1 + (ring - 1) * meridians + (meridian % meridians);
    for (let ring = 0; ring <= rings; ++ring)
      for (
        let meridian = 0;
        meridian < (ring === 0 || ring === rings ? 1 : meridians);
        ++meridian
      ) {
        const theta = (ring * Math.PI) / rings;
        const phi = (2 * Math.PI * meridian) / meridians;
        const bulge = theta < Math.PI / 6 ? 0.0008 * Math.cos(3 * theta) : 0;
        const radius = (options.radius ?? 0.012) + bulge;
        positions.push(
          centreX + radius * Math.sin(theta) * Math.cos(phi),
          0.03 + radius * Math.sin(theta) * Math.sin(phi),
          0.1 + radius * Math.cos(theta),
        );
      }
    const uv = (ring: number, meridian: number): [number, number] => {
      const r = (0.2 * ring) / rings;
      const phi = (2 * Math.PI * meridian) / meridians;
      return [centreU + r * Math.cos(phi), 0.5 + r * Math.sin(phi)];
    };
    for (let ring = 0; ring < rings; ++ring)
      for (let meridian = 0; meridian < meridians; ++meridian) {
        const degrees = (180 * ring) / rings;
        if (
          options.gap !== undefined &&
          degrees + 5 > options.gap[0] &&
          degrees < options.gap[1]
        )
          continue;
        const corners: [number, number][] = [
          [ring, meridian],
          [ring + 1, meridian],
          [ring + 1, meridian + 1],
          [ring, meridian + 1],
        ];
        for (const triangle of [
          [0, 1, 2],
          [0, 2, 3],
        ]) {
          const picked = triangle.map((k) => corners[k]);
          const ids = picked.map(([r, m]) => vertex(r, m));
          if (new Set(ids).size < 3) continue;
          indices.push(...ids);
          for (const [r, m] of picked) uvs.push(...uv(r, m));
        }
      }
    const count = positions.length / 3 - first;
    attachments.push({
      owner: eye,
      rows: Array.from({ length: count }, (_, k) => [first + k, 1]).flat(),
    });
  }
  const skin = createPortraitMaterials().find(
    (material) => material.id === "skin",
  )!;
  return {
    id: "analytic-globes/1",
    channels: [],
    surfaces: [
      {
        id: "globes",
        positions,
        indices,
        targets: {},
        attachments,
        regions: [{ id: "globes/all", material: "eye", indices, uvs }],
      },
    ],
    materials: [
      skin,
      {
        ...skin,
        id: "eye",
        name: "eye",
        baseColor: { r: 1, g: 1, b: 1, a: 1, hex: null },
        baseColorTexture: texture,
      },
    ],
    articulation: {
      jaw: {
        pivot: "jaw",
        axisOffset: [0, 0, 0],
        axis: [1, 0, 0],
        opening: { channel: "open", degrees: 0, translation: [0, 0, 0] },
        protrusion: { channel: "forward", translation: [0, 0, 0] },
        laterotrusion: {
          left: { channel: "left", translation: [0, 0, 0] },
          right: { channel: "right", translation: [0, 0, 0] },
        },
        translationLimitMetres: 0,
      },
      eyes: [
        { id: "leftEye", center: "left-eye", gaze: [] },
        { id: "rightEye", center: "right-eye", gaze: [] },
      ],
    },
  };
}

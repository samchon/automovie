import {
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanBodyUnderwear,
  createPortraitMaterials,
} from "@automovie/human";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Three flat skin panels and hand-placed landmarks for the underwear's
 * coverage rules, with a test table whose every cut falls strictly between
 * two grid rows or columns, so each expected crossing is an exact number.
 *
 * - `front`: x from -0.2 to 0.2 and y from -1 to 0 in 0.02 m steps at
 *   z = 0.1, wound to face +Z.
 * - `back`: the same grid at z = -0.1, wound to face -Z.
 * - `crown`: a patch at x within 0.04 of the midline and y from 0.5 to 0.6,
 *   above the waistband and between the bra's straps, so nothing covers it.
 *
 * Landmarks (metres): the pelvis at (0, -0.5, 0) and the lumbar landmark
 * 0.1 above it; hip joints at x = ±0.1 on the pelvis's height with knees
 * 0.4 below them (thigh 0.4, half distance 0.1, depth 0); the lower chest at
 * (0, -0.4, 0); the clavicle at (0.02, 0, 0) and the shoulder at
 * (0.22, 0, 0). The nipple is the front vertex at (0.1, -0.2, 0.1).
 *
 * Every vertex is bound to `hips`, except that `armFrom` binds the vertices
 * at or beyond that X wholly to `leftLowerArm`, a child of the uncovered
 * `leftUpperArm`. The rest surfaces double as the posed ones with the panel
 * normals, unless a scenario moves them.
 */
export function humanBodyUnderwearFixture(armFrom = Infinity): {
  basis: IAutoMovieHumanBodyBasis;
  table: IAutoMovieHumanBodyUnderwear.ITable;
  rest: { surfaces: number[][]; landmarks: Record<string, IAutoMovieVector3> };
  posed: { positions: number[]; normals: number[] }[];
  nipple: number;
} {
  const grid = (
    xs: [number, number],
    ys: [number, number],
    z: number,
    facing: 1 | -1,
  ) => {
    const columns = Math.round((xs[1] - xs[0]) / 0.02) + 1;
    const rows = Math.round((ys[1] - ys[0]) / 0.02) + 1;
    const positions: number[] = [];
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < columns; i++)
        positions.push(xs[0] + i * 0.02, ys[0] + j * 0.02, z);
    const indices: number[] = [];
    for (let j = 0; j + 1 < rows; j++)
      for (let i = 0; i + 1 < columns; i++) {
        const a = j * columns + i;
        const [b, c, d] = [a + 1, a + columns + 1, a + columns];
        indices.push(
          ...(facing === 1 ? [a, b, c, a, c, d] : [a, c, b, a, d, c]),
        );
      }
    return {
      positions,
      indices,
      normals: positions.map((_, k) => (k % 3 === 2 ? facing : 0)),
    };
  };
  const panels = {
    front: grid([-0.2, 0.2], [-1, 0], 0.1, 1),
    back: grid([-0.2, 0.2], [-1, 0], -0.1, -1),
    crown: grid([-0.04, 0.04], [0.5, 0.6], 0.1, 1),
  };
  const joint = (
    bone: AutoMovieHumanoidBone,
    parent: AutoMovieHumanoidBone | null,
    head: string,
    tail: string,
  ): IAutoMovieHumanBodyBasis["joints"][number] => ({
    bone,
    parent,
    head,
    tail,
    reference: [0, 0, 1],
    signs: { flexion: 1, abduction: -1, twist: 1 },
    neutral: { flexion: 0, abduction: 0, twist: 0 },
    constraint: null,
  });
  const landmarks: Record<string, IAutoMovieVector3> = {
    pelvis: { x: 0, y: -0.5, z: 0 },
    lumbar: { x: 0, y: -0.4, z: 0 },
    lowerChest: { x: 0, y: -0.4, z: 0 },
    clavicle: { x: 0.02, y: 0, z: 0 },
    shoulder: { x: 0.22, y: 0, z: 0 },
    hipLeft: { x: 0.1, y: -0.5, z: 0 },
    hipRight: { x: -0.1, y: -0.5, z: 0 },
    kneeLeft: { x: 0.1, y: -0.9, z: 0 },
    kneeRight: { x: -0.1, y: -0.9, z: 0 },
  };
  const ids = Object.keys(landmarks);
  const basis: IAutoMovieHumanBodyBasis = {
    id: "underwear-panels/1",
    channels: [],
    landmarks: {
      ids,
      positions: ids.flatMap((id) => [
        landmarks[id]!.x,
        landmarks[id]!.y,
        landmarks[id]!.z,
      ]),
      targets: {},
    },
    joints: [
      joint("hips", null, "pelvis", "lumbar"),
      joint("leftUpperArm", "hips", "clavicle", "shoulder"),
      joint("leftLowerArm", "leftUpperArm", "shoulder", "clavicle"),
    ],
    surfaces: Object.entries(panels).map(([id, panel]) => {
      const count = panel.positions.length / 3;
      const arm = (v: number) => panel.positions[v * 3]! >= armFrom - 1e-9;
      return {
        id,
        positions: panel.positions,
        indices: panel.indices,
        targets: {},
        regions: [
          {
            id: id + "/skin",
            material: "skin",
            indices: panel.indices,
            uvs: null,
          },
        ],
        skin: {
          joints: ["hips", "leftLowerArm"],
          boneIndices: Array.from({ length: count }, (_, v) => [
            arm(v) ? 1 : 0,
            0,
            0,
            0,
          ]).flat(),
          weights: Array.from({ length: count }, () => [1, 0, 0, 0]).flat(),
        },
      };
    }),
    materials: createPortraitMaterials().filter(
      (material) => material.id === "skin",
    ),
  };
  const table: IAutoMovieHumanBodyUnderwear.ITable = {
    material: "underwear",
    color: { r: 0.5, g: 0.4, b: 0.3 },
    roughness: 0.8,
    offsetMetres: 0.004,
    uncovered: ["leftUpperArm"],
    landmarks: {
      pelvis: "pelvis",
      lumbar: "lumbar",
      lowerChest: "lowerChest",
      clavicle: "clavicle",
      shoulder: "shoulder",
      hips: { left: "hipLeft", right: "hipRight" },
      knees: { left: "kneeLeft", right: "kneeRight" },
    },
    briefs: {
      // a hem 0.122 below the hip joints, the waistband 0.05 above them
      "boxer-briefs": {
        waist: 0.5,
        crotch: 0.305,
        front: 0.305,
        back: 0.305,
        gusset: 0.5,
        outer: 2,
      },
      // the crotch at -0.624 within 0.05 of the midline, rising to -0.458
      // in front and -0.582 behind at 0.2, the waistband at -0.41
      "bra-and-briefs": {
        waist: 0.9,
        crotch: 0.31,
        front: -0.105,
        back: 0.205,
        gusset: 0.5,
        outer: 2,
      },
    },
    // the band from -0.29 to -0.11 in front (-0.15 behind), the straps
    // 0.07 to 0.17 from the midline
    bra: {
      nipple: { surface: 0, vertex: 0 },
      bottom: 0.45,
      front: 0.45,
      back: 0.25,
      strap: 0.5,
      strapHalfWidth: 0.25,
    },
  };
  const front = panels.front.positions;
  const nipple = [...new Array(front.length / 3).keys()].find(
    (v) =>
      Math.abs(front[v * 3]! - 0.1) < 1e-9 &&
      Math.abs(front[v * 3 + 1]! + 0.2) < 1e-9,
  )!;
  table.bra.nipple.vertex = nipple;
  return {
    basis,
    table,
    rest: { surfaces: basis.surfaces.map((s) => s.positions), landmarks },
    posed: Object.values(panels).map((panel) => ({
      positions: panel.positions,
      normals: panel.normals,
    })),
    nipple,
  };
}

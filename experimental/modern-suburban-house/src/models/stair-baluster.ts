/**
 * Stair guard infill from docs/models/04-stair-members.md. The stair space
 * owns treads, posts and handrails; this model supplies only black infill and
 * the upper-hall bottom rail. Coordinates are Y-up metres in the house frame.
 */
import type {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

type FaceId = "baluster" | "bottom-rail";
type Bounds = readonly [number, number, number, number, number, number];

const boxMesh = (bounds: Bounds, vertical: boolean): IAutoMovieMesh => {
  const [x0, x1, y0, y1, z0, z1] = bounds;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const face = (
    corners: readonly (readonly [number, number, number])[],
    normal: readonly [number, number, number],
  ): void => {
    const offset = positions.length / 3;
    for (const [x, y, z] of corners) {
      positions.push(x, y, z);
      normals.push(...normal);
      // Height/length is U. The other coordinate is distance around section.
      if (vertical) {
        const width = x1 - x0;
        const depth = z1 - z0;
        const around =
          normal[2] === 1
            ? x - x0
            : normal[0] === 1
              ? width + z1 - z
              : normal[2] === -1
                ? width + depth + x1 - x
                : normal[0] === -1
                  ? 2 * width + depth + z - z0
                  : x - x0;
        uvs.push(y - y0, around);
      } else {
        const height = y1 - y0;
        const depth = z1 - z0;
        const around =
          normal[2] === 1
            ? y - y0
            : normal[1] === 1
              ? height + z1 - z
              : normal[2] === -1
                ? height + depth + y1 - y
                : normal[1] === -1
                  ? 2 * height + depth + z - z0
                  : y - y0;
        uvs.push(x - x0, around);
      }
    }
    indices.push(
      offset,
      offset + 1,
      offset + 2,
      offset,
      offset + 2,
      offset + 3,
    );
  };
  face(
    [
      [x0, y0, z1],
      [x1, y0, z1],
      [x1, y1, z1],
      [x0, y1, z1],
    ],
    [0, 0, 1],
  );
  face(
    [
      [x1, y0, z0],
      [x0, y0, z0],
      [x0, y1, z0],
      [x1, y1, z0],
    ],
    [0, 0, -1],
  );
  face(
    [
      [x1, y0, z1],
      [x1, y0, z0],
      [x1, y1, z0],
      [x1, y1, z1],
    ],
    [1, 0, 0],
  );
  face(
    [
      [x0, y0, z0],
      [x0, y0, z1],
      [x0, y1, z1],
      [x0, y1, z0],
    ],
    [-1, 0, 0],
  );
  face(
    [
      [x0, y1, z1],
      [x1, y1, z1],
      [x1, y1, z0],
      [x0, y1, z0],
    ],
    [0, 1, 0],
  );
  face(
    [
      [x0, y0, z0],
      [x1, y0, z0],
      [x1, y0, z1],
      [x0, y0, z1],
    ],
    [0, -1, 0],
  );
  return { positions, normals, uvs, indices, skin: null };
};

/** Deterministic stair infill whose repeated members meet the existing stair. */
export class StairBaluster {
  /** Build all lower-flight, upper-flight and hall infill in house metres. */
  public build(): {
    model: IAutoMovieModel;
    faceByPart: Readonly<Record<string, FaceId>>;
  } {
    const parts: IAutoMovieModelPart[] = [];
    const faceByPart: Record<string, FaceId> = {};
    const add = (id: string, face: FaceId, bounds: Bounds): void => {
      parts.push({
        id,
        name: id,
        geometry: { type: "mesh", mesh: boxMesh(bounds, face === "baluster") },
        material: null,
        attachedBone: null,
        transform: null,
      });
      faceByPart[id] = face;
    };
    // Lower posts occupy Z [-1.525,-1.45] and [-3.485,-3.41].
    const lowerLength = 3.41 - 1.525;
    const lowerCount = Math.ceil((lowerLength - 0.1) / 0.12);
    const lowerGap = (lowerLength - 0.02 * lowerCount) / (lowerCount + 1);
    for (let i = 0; i < lowerCount; i++) {
      const z = -1.525 - lowerGap - 0.01 - i * (0.02 + lowerGap);
      const tread = Math.min(7, Math.floor((-z - 1.45) / 0.28) + 1);
      const bottom = 0.17 * tread;
      const top =
        0.17 + 0.9 - 0.075 + ((-z - 1.45) * (1.36 - 0.17)) / (3.41 - 1.45);
      add(`lower-${i + 1}`, "baluster", [
        -0.6975,
        -0.6775,
        bottom,
        top,
        z - 0.01,
        z + 0.01,
      ]);
    }
    // The upper rail meets the wall at Y=2.75; the ninth tread begins above it.
    for (let j = 1; j <= 8; j++) {
      const start = -0.65 + 0.28 * (j - 1);
      const bottom = 1.36 + 0.17 * j;
      for (let k = 0; k < 4; k++) {
        const x = start + 0.05 + 0.06 * k;
        const top = Math.min(2.75, 2.43 + ((x + 0.65) * 1.53) / 2.52 - 0.075);
        add(`upper-${j}-${k + 1}`, "baluster", [
          x - 0.01,
          x + 0.01,
          bottom,
          top,
          -3.4575,
          -3.4375,
        ]);
      }
    }
    add(
      "hall-bottom-rail",
      "bottom-rail",
      [-1.725, 1.795, 3.11, 3.15, -4.655, -4.615],
    );
    const hallLength = 3.52;
    const hallCount = Math.ceil((hallLength - 0.1) / 0.12);
    const hallGap = (hallLength - 0.02 * hallCount) / (hallCount + 1);
    for (let i = 0; i < hallCount; i++) {
      const x = -1.725 + hallGap + 0.01 + i * (0.02 + hallGap);
      add(`hall-${i + 1}`, "baluster", [
        x - 0.01,
        x + 0.01,
        3.15,
        4.035,
        -4.645,
        -4.625,
      ]);
    }
    const model: IAutoMovieModel = {
      id: "stair-infill",
      name: "stair-infill",
      origin: "generated",
      parts,
      skeleton: null,
      body: null,
      materials: [],
      asset: null,
    };
    return { model, faceByPart };
  }
}

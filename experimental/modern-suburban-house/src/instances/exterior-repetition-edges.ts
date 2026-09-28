/** Roof-edge and wall-corner members derived from the current space owners. */
import type { IAutoMovieMeshTransform } from "@automovie/engine";

import { EaveDrainage } from "../models/exterior/drainage";
import { AsphaltShingle } from "../models/exterior/shingle";
import { ExteriorCornerTrim } from "../models/exterior/trim";
import { GARAGE, MAIN } from "../spaces/building";
import { EXTERIOR_PLINTH_TOP } from "../spaces/envelope/finish-boundary";
import type { IHouse } from "../spaces/house";
import {
  GABLE_CORNERS,
  GARAGE_RIDGE_Z,
  LEFT_EAVE_X,
  MAIN_RIDGE_Z,
  OVERHANG,
  RIGHT_EAVE_X,
  ROOF_THICKNESS,
  SPLIT_X,
  gBack,
  gFront,
  gable,
  mBack,
  mFront,
  rBack,
  rFront,
} from "../spaces/roof/junctions";
import {
  type Instance,
  type Model,
  type Vec,
  collect,
  identity,
  roofTriangles,
  rotationOf,
} from "./exterior-repetition-geometry";

/** Exposed convex corner intersections, with their two inward wall directions. */
const corners = [
  {
    id: "main-front-left",
    x: MAIN.outer.x[0],
    z: MAIN.outer.z[1],
    sx: 1,
    sz: -1,
    top: gable(MAIN.outer.x[0]) - ROOF_THICKNESS,
  },
  {
    id: "main-front-right",
    x: MAIN.outer.x[1],
    z: MAIN.outer.z[1],
    sx: -1,
    sz: -1,
    top: rFront(MAIN.outer.z[1]) - ROOF_THICKNESS,
  },
  {
    id: "main-rear-left",
    x: MAIN.outer.x[0],
    z: MAIN.outer.z[0],
    sx: 1,
    sz: 1,
    top: mBack(MAIN.outer.z[0]) - ROOF_THICKNESS,
  },
  {
    id: "main-rear-right",
    x: MAIN.outer.x[1],
    z: MAIN.outer.z[0],
    sx: -1,
    sz: 1,
    top: rBack(MAIN.outer.z[0]) - ROOF_THICKNESS,
  },
  {
    id: "garage-front-right",
    x: GARAGE.outer.x[1],
    z: GARAGE.outer.z[1],
    sx: -1,
    sz: -1,
    top: gFront(GARAGE.outer.z[1]) - ROOF_THICKNESS,
  },
  {
    id: "garage-rear-right",
    x: GARAGE.outer.x[1],
    z: GARAGE.outer.z[0],
    sx: -1,
    sz: 1,
    top: gBack(GARAGE.outer.z[0]) - ROOF_THICKNESS,
  },
] as const;

/** Deterministic trim around the exposed convex mass corners. */
export class ExteriorEdges {
  /** Place open gutters on the actual horizontal free weather eaves. */
  public buildGutters(house: IHouse): {
    models: Model[];
    instances: Instance[];
  } {
    const builder = new EaveDrainage();
    const models: Model[] = [],
      instances: Instance[] = [];
    for (const roof of house.parts.filter((part) => part.role === "roof")) {
      const triangles = roofTriangles(roof.mesh);
      const minY = Math.min(
        ...triangles.flatMap((triangle) => triangle.vertices.map((p) => p[1])),
      );
      const candidates = triangles.flatMap((triangle) => {
        const [a, b, c] = triangle.vertices;
        return [
          [a, b],
          [b, c],
          [c, a],
        ].flatMap(([start, end]) =>
          Math.abs(start![1] - end![1]) < 1e-7 &&
          Math.abs(start![2] - end![2]) < 1e-7 &&
          Math.abs(start![1] - minY) < 1e-7 &&
          Math.abs(start![0] - end![0]) > 0.08
            ? [
                {
                  left: Math.min(start![0], end![0]),
                  right: Math.max(start![0], end![0]),
                  y: start![1],
                  z: start![2],
                  outward: Math.sign(triangle.normal[2]),
                },
              ]
            : [],
        );
      });
      candidates.sort((a, b) => a.z - b.z || a.left - b.left);
      const eaves: typeof candidates = [];
      for (const edge of candidates) {
        const last = eaves[eaves.length - 1];
        if (
          last &&
          Math.abs(last.y - edge.y) < 1e-7 &&
          Math.abs(last.z - edge.z) < 1e-7 &&
          edge.left <= last.right + 1e-7
        )
          last.right = Math.max(last.right, edge.right);
        else eaves.push({ ...edge });
      }
      for (const [index, eave] of eaves.entries()) {
        // This front interval has less than the required 0.15 m trim clearance
        // at both ends; the roof/elevation owners have not assigned an outlet.
        if (
          roof.id === "roof-main-front" &&
          eave.left >= GABLE_CORNERS.rightFoot.x - 1e-7
        )
          continue;
        const direction: Vec = eave.outward > 0 ? [1, 0, 0] : [-1, 0, 0];
        const normal: Vec = [0, 0, eave.outward];
        const id = `${roof.id}-gutter-${index}`;
        const built = builder.buildGutter({
          id,
          length: eave.right - eave.left,
        });
        models.push(built);
        instances.push({
          id,
          modelId: built.model.id,
          transform: {
            translation: {
              x: eave.outward > 0 ? eave.left : eave.right,
              y: eave.y,
              z: eave.z,
            },
            rotation: rotationOf(direction, [0, 1, 0], normal),
          },
        });
      }
    }
    return { models, instances };
  }
  /** Fold overlapping cap strips across each shared pitched roof ridge. */
  public buildRidgeCaps(): { models: Model[]; instances: Instance[] } {
    const builder = new AsphaltShingle();
    const models: Model[] = [],
      instances: Instance[] = [];
    const mainPitch = Math.atan(8 / 12),
      rightPitch = Math.atan(7 / 12);
    const garagePitch = Math.atan(5 / 12),
      gablePitch = Math.atan(9 / 12);
    const ridges: readonly {
      id: string;
      start: Vec;
      end: Vec;
      transverse: Vec;
      pitch: number;
    }[] = [
      {
        id: "main",
        start: [LEFT_EAVE_X, mFront(MAIN_RIDGE_Z), MAIN_RIDGE_Z],
        end: [SPLIT_X, mFront(MAIN_RIDGE_Z), MAIN_RIDGE_Z],
        transverse: [0, 0, -1],
        pitch: mainPitch,
      },
      {
        id: "right",
        start: [SPLIT_X, rFront(MAIN_RIDGE_Z), MAIN_RIDGE_Z],
        end: [RIGHT_EAVE_X, rFront(MAIN_RIDGE_Z), MAIN_RIDGE_Z],
        transverse: [0, 0, -1],
        pitch: rightPitch,
      },
      {
        id: "garage",
        start: [GARAGE.inner.x[0], gBack(GARAGE_RIDGE_Z), GARAGE_RIDGE_Z],
        end: [
          GARAGE.outer.x[1] + OVERHANG.garage,
          gBack(GARAGE_RIDGE_Z),
          GARAGE_RIDGE_Z,
        ],
        transverse: [0, 0, -1],
        pitch: garagePitch,
      },
      {
        id: "front-gable",
        start: [
          GABLE_CORNERS.apex.x,
          gable(GABLE_CORNERS.apex.x),
          GABLE_CORNERS.apex.z,
        ],
        end: [
          GABLE_CORNERS.ridgeFront.x,
          gable(GABLE_CORNERS.ridgeFront.x),
          GABLE_CORNERS.ridgeFront.z,
        ],
        transverse: [1, 0, 0],
        pitch: gablePitch,
      },
    ];
    for (const ridge of ridges) {
      const dx = ridge.end[0] - ridge.start[0],
        dz = ridge.end[2] - ridge.start[2];
      const length = Math.hypot(dx, dz);
      const direction: Vec = [dx / length, 0, dz / length];
      const rotation = rotationOf(direction, ridge.transverse, [0, 1, 0]);
      const members: { built: Model; transform: IAutoMovieMeshTransform }[] =
        [];
      for (let j = 0; 0.14 * j < length - 1e-8; j++) {
        const distance = 0.14 * j;
        const segment = Math.min(0.3, length - distance);
        const id = `${ridge.id}-shingle-ridge-${j}`;
        members.push({
          built: builder.buildRidgeCap({
            id,
            leftPitch: ridge.pitch,
            rightPitch: ridge.pitch,
            length: segment,
          }),
          transform: {
            translation: {
              x: ridge.start[0] + direction[0] * distance,
              y: ridge.start[1],
              z: ridge.start[2] + direction[2] * distance,
            },
            rotation,
          },
        });
      }
      const id = `${ridge.id}-shingle-ridge`;
      const built = collect(id, members);
      models.push(built);
      instances.push({ id, modelId: built.model.id, transform: identity });
    }
    return { models, instances };
  }
  /** End six vertical L members exactly at their roof underside junctions. */
  public buildCornerTrim(): { models: Model[]; instances: Instance[] } {
    const builder = new ExteriorCornerTrim();
    const models: Model[] = [],
      instances: Instance[] = [];
    for (const corner of corners) {
      const id = `exterior-corner-${corner.id}`;
      const built = builder.build({
        id,
        height: corner.top - EXTERIOR_PLINTH_TOP,
      });
      const transform: IAutoMovieMeshTransform = {
        translation: { x: corner.x, y: EXTERIOR_PLINTH_TOP, z: corner.z },
        scale: { x: corner.sx, y: 1, z: corner.sz },
      };
      const placed = collect(id, [{ built, transform }]);
      models.push(placed);
      instances.push({ id, modelId: placed.model.id, transform: identity });
    }
    return { models, instances };
  }
}

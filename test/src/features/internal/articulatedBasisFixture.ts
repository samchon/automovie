import { Quaternion, Vector3 } from "@automovie/engine";
import { createPortraitMaterials } from "@automovie/human";
import { createHash } from "node:crypto";

import type { IArticulatedBasisInput } from "../../../scripts/face-review/prepareArticulatedBasis";

/**
 * Analytic legacy basis for the articulated preparation, in metres, with
 * every fit's answer known by construction. The `arch` surface is a
 * tetrahedron whose legacy `mandibular` group turns 30 degrees about the
 * line (y, z) = (0.5, 0.2) parallel to +X under `open` (a pure screw, no
 * slide), translates (0, 0, 0.4) under `forward` and (±0.3, 0, 0) under
 * `left`/`right`. The `globe` surface is a tetrahedron whose `leftGlobe`
 * group turns 20 degrees about +Y through the `joint-l-eye` landmark under
 * `gazeIn`. The `skin` surface is a unit square whose `forward`, `left` and
 * `right` endpoints move vertex 3 by the whole arch translation and vertex 2
 * by half of it, so the implied weights are exactly 1 and 0.5, and whose
 * `open` endpoint is the rigid image of those weighted vertices plus one
 * authored tissue offset on vertex 0, so the residual is exactly that offset.
 * `carry` carries `open` whole, tissue offset included, plus its own row on
 * vertex 1. One corrective on `open x forward` moves
 * vertex 1 of the skin and vertex 0 of the arch by 0.05. Nothing personal
 * enters; the two documents only name the basis.
 */
export function articulatedBasisFixture(): IArticulatedBasisInput {
  const rotate = (
    positions: number[],
    vertices: number[],
    rotation: ReturnType<typeof Quaternion.fromAxisAngle>,
    pivot: ReturnType<typeof Vector3.create>,
    translation: ReturnType<typeof Vector3.create>,
    weights?: number[],
  ): number[] => {
    const rows: number[] = [];
    vertices.forEach((v, at) => {
      const p = Vector3.create(
        positions[3 * v],
        positions[3 * v + 1],
        positions[3 * v + 2],
      );
      const moved = Vector3.add(
        Vector3.add(
          Quaternion.rotateVector(rotation, Vector3.subtract(p, pivot)),
          pivot,
        ),
        translation,
      );
      const w = weights?.[at] ?? 1;
      rows.push(
        v,
        w * (moved.x - p.x),
        w * (moved.y - p.y),
        w * (moved.z - p.z),
      );
    });
    return rows;
  };
  const shift = (
    vertices: number[],
    t: [number, number, number],
    weights?: number[],
  ): number[] =>
    vertices.flatMap((v, at) => {
      const w = weights?.[at] ?? 1;
      return [v, w * t[0], w * t[1], w * t[2]];
    });
  const archPositions = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];
  const openTurn = Quaternion.fromAxisAngle(Vector3.create(1, 0, 0), 30);
  const screwPivot = Vector3.create(0, 0.5, 0.2);
  const globePositions = [2, 0, 0, 3, 0, 0, 2, 1, 0, 2, 0, 1];
  const gazeTurn = Quaternion.fromAxisAngle(Vector3.create(0, 1, 0), 20);
  const eyeCenter = Vector3.create(2, 0, 0);
  const skinPositions = [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0];
  const skinOpen = rotate(
    skinPositions,
    [2, 3],
    openTurn,
    screwPivot,
    Vector3.create(),
    [0.5, 1],
  );
  const expression = (id: string) => ({
    id,
    kind: "expression" as const,
    minimum: 0,
    maximum: 1,
    positive: id + "Target",
    negative: null,
  });
  const basis: IArticulatedBasisInput["basis"] = {
    id: "analytic-legacy/1",
    channels: [
      {
        id: "width",
        kind: "shape",
        minimum: -1,
        maximum: 1,
        positive: "wide",
        negative: "narrow",
      },
      expression("open"),
      expression("forward"),
      expression("left"),
      expression("right"),
      expression("gazeIn"),
      expression("carry"),
    ],
    correctives: [
      {
        id: "openForward",
        inputs: [
          { channel: "open", side: "positive" },
          { channel: "forward", side: "positive" },
        ],
        weight: 1,
        target: "openForwardTarget",
      },
    ],
    surfaces: [
      {
        id: "skin",
        positions: skinPositions,
        indices: [0, 1, 2, 0, 2, 3],
        targets: {
          wide: [1, 0.5, 0, 0, 2, 0.5, 0, 0],
          narrow: [1, -0.25, 0, 0, 2, -0.25, 0, 0],
          openTarget: [0, 0, 0, 0.07, ...skinOpen],
          forwardTarget: shift([2, 3], [0, 0, 0.4], [0.5, 1]),
          leftTarget: shift([2, 3], [0.3, 0, 0], [0.5, 1]),
          rightTarget: shift([2, 3], [-0.3, 0, 0], [0.5, 1]),
          gazeInTarget: [0, 0, 0.02, 0],
          carryTarget: [0, 0, 0, 0.07, 1, 0, 0, 0.09, ...skinOpen],
          openForwardTarget: [1, 0, 0.05, 0],
        },
        regions: [
          {
            id: "skin/all",
            material: "skin",
            indices: [0, 1, 2, 0, 2, 3],
            uvs: null,
          },
        ],
      },
      {
        id: "arch",
        positions: archPositions,
        indices: [0, 1, 2, 0, 3, 1, 1, 3, 2, 0, 2, 3],
        targets: {
          openTarget: rotate(
            archPositions,
            [0, 1, 2, 3],
            openTurn,
            screwPivot,
            Vector3.create(),
          ),
          forwardTarget: shift([0, 1, 2, 3], [0, 0, 0.4]),
          leftTarget: shift([0, 1, 2, 3], [0.3, 0, 0]),
          rightTarget: shift([0, 1, 2, 3], [-0.3, 0, 0]),
          carryTarget: rotate(
            archPositions,
            [0, 1, 2, 3],
            openTurn,
            screwPivot,
            Vector3.create(),
          ),
          openForwardTarget: [0, 0, 0.05, 0],
        },
        rigidGroups: [
          { id: "mandibular", vertices: [0, 1, 2, 3], motion: "fit" },
        ],
        regions: [
          {
            id: "arch/all",
            material: "lips",
            indices: [0, 1, 2, 0, 3, 1, 1, 3, 2, 0, 2, 3],
            uvs: null,
          },
        ],
      },
      {
        id: "globe",
        positions: globePositions,
        indices: [0, 1, 2, 0, 3, 1, 1, 3, 2, 0, 2, 3],
        targets: {
          gazeInTarget: rotate(
            globePositions,
            [0, 1, 2, 3],
            gazeTurn,
            eyeCenter,
            Vector3.create(),
          ),
        },
        rigidGroups: [
          { id: "leftGlobe", vertices: [0, 1, 2, 3], motion: "fit" },
        ],
        regions: [
          {
            id: "globe/all",
            material: "skin",
            indices: [0, 1, 2, 0, 3, 1, 1, 3, 2, 0, 2, 3],
            uvs: null,
          },
        ],
      },
    ],
    materials: createPortraitMaterials().filter(
      (material) => material.id === "skin" || material.id === "lips",
    ),
  };
  const bytes = Buffer.alloc(skinPositions.length * 8);
  skinPositions.forEach((value, index) =>
    bytes.writeDoubleLE(value, index * 8),
  );
  return {
    basis,
    attachments: {
      basis: basis.id,
      surface: "skin",
      neutralFloat64LESha256: createHash("sha256").update(bytes).digest("hex"),
      landmarks: {
        ids: ["joint-mouth", "joint-l-eye"],
        positions: [0, 0.5, 0.2, 2, 0, 0],
        targets: { wide: [1, 0.5, 0, 0] },
      },
    },
    jaw: {
      pivot: "joint-mouth",
      opening: "open",
      protrusion: "forward",
      left: "left",
      right: "right",
      surface: "arch",
      group: "mandibular",
      couplingPerDegree: [0, -0.001, 0.002],
      translationLimitMetres: 0.5,
    },
    eyes: [
      {
        id: "leftEye",
        center: "joint-l-eye",
        surface: "globe",
        group: "leftGlobe",
        gaze: ["gazeIn"],
      },
    ],
    attachedSurfaces: ["skin"],
    carriers: [{ channel: "carry", carried: "open" }],
    tolerances: {
      rotationDegrees: 0.01,
      slideMetres: 0.0001,
      gazeCenterMetres: 0.001,
      replayMetres: 1e-9,
    },
    revision: "analytic-articulated/1",
    documents: [
      {
        id: "one",
        name: "One",
        basis: basis.id,
        shape: { width: 0.5 },
        expression: { open: 0.5 },
      },
      { id: "two", name: "Two", basis: basis.id, shape: {}, expression: {} },
    ],
    controls: {
      basis: basis.id,
      groups: [
        {
          id: "width",
          label: "Width",
          description: "Narrow to wide.",
          channels: ["width"],
        },
      ],
    },
  };
}

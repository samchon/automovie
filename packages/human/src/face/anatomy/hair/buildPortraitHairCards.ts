import { Vector3, mergeAutoMovieMeshes } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";
import { portraitPoint } from "../../mesh/portraitPoint";
import { portraitNormals } from "../../mesh/portraitNormals";
import { portraitPart } from "../../mesh/portraitPart";
import { portraitSpline } from "../../mesh/portraitSpline";
import { assertPortraitHairFibreCurl } from "./assertPortraitHairFibreCurl";
import { IPortraitHairShape } from "./IPortraitHairShape";

/**
 * Tessellate cubic guide strips with root-to-tip UVs. Each row has two vertices
 * and each interval two triangles, independent of painted fibre count. Normals
 * come from the emitted triangles. No camera-facing rotation or random state
 * enters the construction. Caller guides and profiles remain unchanged.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Constructs curved surface hair locks from named guide and width controls.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Emits metric strips with shared sampling, deterministic UVs and finite nondegenerate frames.
 */
export function buildPortraitHairCards(
  shape: IPortraitHairShape,
): IAutoMovieModelPart[] {
  if (shape.fibreCurl !== undefined)
    assertPortraitHairFibreCurl(shape.fibreCurl);
  if (
    shape.material.trim().length === 0 ||
    shape.cards.length > 1024 ||
    !Number.isInteger(shape.segments) ||
    shape.segments < 2 ||
    shape.segments > 64 ||
    !Number.isFinite(shape.widthScale) ||
    shape.widthScale < 0.1 ||
    shape.widthScale > 4 ||
    !Number.isFinite(shape.tipWidth) ||
    shape.tipWidth < 0.05 ||
    shape.tipWidth > 1 ||
    (shape.taperStart !== undefined &&
      (!Number.isFinite(shape.taperStart) ||
        shape.taperStart < 0 ||
        shape.taperStart > 0.95)) ||
    !Number.isInteger(shape.seed) ||
    shape.seed < 0 ||
    shape.seed > 0xffffffff ||
    !Number.isInteger(shape.fibres) ||
    shape.fibres < 1 ||
    shape.fibres > 32 ||
    !Number.isFinite(shape.coverage) ||
    shape.coverage < 0.1 ||
    shape.coverage > 1 ||
    (shape.fibreShadeStrength !== undefined &&
      (!Number.isFinite(shape.fibreShadeStrength) ||
        shape.fibreShadeStrength < 0 ||
        shape.fibreShadeStrength > 1)) ||
    (shape.fibreNormalScale !== undefined &&
      (!Number.isFinite(shape.fibreNormalScale) ||
        shape.fibreNormalScale < 0 ||
        shape.fibreNormalScale > 1))
  )
    throw new Error(
      "Hair cards need bounded finite widths, sampling, coverage and an unsigned seed.",
    );
  const meshes: IAutoMovieMesh[] = [];
  const taperStart = shape.taperStart ?? 0;
  for (const card of shape.cards) {
    if (
      card.guide.length < 2 ||
      card.guide.length > 32 ||
      card.across.length !== card.guide.length ||
      !Number.isFinite(card.width) ||
      card.width <= 0 ||
      card.width > 40 ||
      [...card.guide, ...card.across].some(
        (p) => p.length !== 3 || !p.every(Number.isFinite),
      )
    )
      throw new Error(
        "Each hair card needs paired finite guide/frame stations and a positive bounded width.",
      );
    const guide = card.guide.map((p) => portraitPoint(...p));
    const across = card.across.map((p) => portraitPoint(...p));
    const mesh: IAutoMovieMesh = {
      positions: [],
      indices: [],
      normals: null,
      uvs: [],
      skin: null,
    };
    for (let row = 0; row <= shape.segments; row++) {
      const t = row / shape.segments;
      const center = portraitSpline(guide, t),
        frame = portraitSpline(across, t);
      const direction = Vector3.normalize(frame);
      if (
        ![direction.x, direction.y, direction.z].every(Number.isFinite) ||
        Vector3.length(direction) === 0
      )
        throw new Error(
          "Hair width frames must remain finite and nonzero between stations.",
        );
      const radius =
        (card.width *
          shape.widthScale *
          (1 -
            (Math.max(0, t - taperStart) / (1 - taperStart)) *
              (1 - shape.tipWidth))) /
        2;
      for (const side of [-1, 1]) {
        const point = Vector3.add(
          center,
          Vector3.scale(direction, side * radius),
        );
        mesh.positions.push(point.x, point.y, point.z);
        mesh.uvs!.push((side + 1) / 2, t);
      }
      if (row > 0) {
        const a = 2 * (row - 1);
        mesh.indices!.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    for (let i = 0; i < mesh.indices!.length; i += 3) {
      const [a, b, c] = mesh
        .indices!.slice(i, i + 3)
        .map((id) =>
          portraitPoint(
            mesh.positions[id * 3],
            mesh.positions[id * 3 + 1],
            mesh.positions[id * 3 + 2],
          ),
        );
      const area = Vector3.length(
        Vector3.cross(Vector3.subtract(b, a), Vector3.subtract(c, a)),
      );
      if (!(area > 1e-8) || !Number.isFinite(area))
        throw new Error(
          "Hair card guides and width frames must produce finite nondegenerate triangles.",
        );
    }
    mesh.normals = portraitNormals(mesh.positions, mesh.indices!);
    meshes.push(mesh);
  }
  return meshes.length === 0
    ? []
    : [
        portraitPart(
          "scalp-hair-cards",
          mergeAutoMovieMeshes(meshes),
          shape.material,
        ),
      ];
}

import {
  inspectAutoMovieMeshTopology,
  markAutoMovieConstructionCurves,
  realizeAutoMovieConstruction,
  sampleAutoMovieConstructionCurves,
} from "@automovie/engine";
import type {
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionView,
  IAutoMovieMark,
} from "@automovie/interface";
import * as THREE from "three";

import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

/**
 * Carry a made upper-arm envelope from a declared view through the existing
 * engine and the capture scene. Its two dimensions use ANSUR II's women's
 * acromion-radiale and flexed biceps means, used here only as a geometry
 * fixture. The straight course and circular section give independent scene
 * bounds and a known section mark in metres. The named geometry must be
 * watertight.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Admits a real conic loft, lowers its triangle and curve paths into the capture scene and verifies names and metre bounds.
 * @evidence contracts/development/testing.md#independent-expectations The declared tip height follows the published acromion-radiale dimension. The midsection extrema follow from the independently derived circle radius.
 * @evidence contracts/development/testing.md#distinguishing-cases Lower and upper poles, an interior circle and three distinct mark kinds exercise both drawing and overlay frames.
 * @evidence contracts/development/testing.md#execution-ownership Builds one small envelope in CPU memory using public ANSUR II dimensions and actual engine code. It performs no asset or browser I/O.
 * @evidence contracts/development/common.md#meaningful-documentation Names the fixture's dimensions, units and expected observations.
 */
export function test_human_generic_surface_capture(): void {
  const length: number = 0.3112;
  const radius: number = 0.3056 / (2 * Math.PI);
  const middle: number = length / 2;
  const original: IAutoMovieConstructionView = ConstructionShapes.part(
    "upperarm",
    {
      origin: { x: 0, y: 0, z: 0 },
      u: { x: 1, y: 0, z: 0 },
      v: { x: 0, y: 0, z: 1 },
    },
    [0, radius, middle, length - radius, length],
    (station: number): [number, number, number, number] => {
      const extent: number = Math.min(station, radius, length - station);
      return [extent, extent, extent, extent];
    },
    "both",
  );
  const realized: IAutoMovieConstructionRealization.IRealization =
    realizeAutoMovieConstruction(
      { name: original.name, root: original },
      { chord: 0.001 },
    );
  const capture: ReturnType<typeof buildHumanSurfaceCapture> =
    buildHumanSurfaceCapture("survey", realized);
  const errors: string[] = [];
  try {
    const entry: THREE.Object3D | undefined = capture.object.getObjectByName(
      original.name,
    );
    const bounds: THREE.Box3 = new THREE.Box3().setFromObject(capture.object);
    if (
      !(entry instanceof THREE.Mesh) ||
      Math.abs(bounds.min.y) > 1e-7 ||
      Math.abs(bounds.max.y - length) > 1e-7
    )
      errors.push("survey loft does not expose the named geometry in metres");
    if (
      !inspectAutoMovieMeshTopology({
        positions: realized.mesh.positions,
        indices: realized.mesh.indices,
        normals: null,
        uvs: null,
        skin: null,
      }).watertight
    )
      errors.push("survey loft is not watertight");
    const kinds: Set<string> = new Set(
      capture.marks.map(({ kind }): string => kind),
    );
    if (
      !["axis", "section", "guide"].every((kind: string): boolean =>
        kinds.has(`curve/${kind}`),
      )
    )
      errors.push(
        "survey loft does not expose all three original curve mark kinds",
      );
    const addedMidsection: boolean = capture.marks.some(
      (mark): boolean =>
        mark.anchor === capture.object.name &&
        mark.path.startsWith(`survey/${original.name}/section/`) &&
        mark.shape.type === "polyline" &&
        mark.shape.points.some(
          (x: number, index: number, points: number[]): boolean =>
            index % 3 === 0 &&
            Math.abs(points[index + 1]! - middle) < 1e-9 &&
            Math.abs(Math.hypot(x, points[index + 2]!) - radius) < 1e-9,
        ),
    );
    if (!addedMidsection)
      errors.push(
        "survey loft lost its circular section mark in the registered frame",
      );
    if (errors.length !== 0) throw new Error(errors.join("\n"));
  } finally {
    capture.dispose();
  }
}

/**
 * Borrow the realization's scene-local metres and curve names for one capture
 * subject.
 */
function buildHumanSurfaceCapture(
  subject: string,
  realization: IAutoMovieConstructionRealization.IRealization,
): { object: THREE.Group; marks: IAutoMovieMark[]; dispose: () => void } {
  if (realization.diagnostics.length !== 0)
    throw new Error(
      `${realization.name}: ${realization.diagnostics.map(({ node, detail }) => `${node}: ${detail}`).join("\n")}`,
    );
  if (realization.mesh.indices.length === 0)
    throw new Error(`${realization.name} has no drawable surface`);

  const marks: IAutoMovieMark[] = markAutoMovieConstructionCurves(
    sampleAutoMovieConstructionCurves(realization),
    subject,
  );
  const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(realization.mesh.positions, 3),
  );
  geometry.setIndex(realization.mesh.indices);
  geometry.computeVertexNormals();
  const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
    color: 0xd9b8a3,
    roughness: 0.8,
    side: THREE.DoubleSide,
  });
  const mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
  mesh.name = realization.name;
  const object: THREE.Group = new THREE.Group();
  object.name = subject;
  // Turn the +X anatomical front toward the inspector's +Z front camera.
  object.rotation.y = -Math.PI / 2;
  object.add(mesh);
  object.updateMatrixWorld(true);
  return {
    object,
    marks,
    dispose: (): void => {
      geometry.dispose();
      material.dispose();
    },
  };
}

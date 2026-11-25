import type { IAutoMovieShot } from "@automovie/interface";
import {
  type IAutoMovieModelObject,
  applyPracticalSurfaceMaterials,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { Group, Material, Mesh, MeshBasicMaterial, Object3D } from "three";

import { throwsError } from "../../internal/predicates";

/**
 * Practical surface changes resolve all borrowed meshes and materials before
 * publishing any assignment.
 *
 * Scenarios:
 *
 * 1. At a half-second key, only its selected part changes material.
 * 2. An unavailable material on a later part leaves every earlier candidate
 *    unchanged. Two ids resolving to one native target also refuse.
 * 3. The shot end is outside the authored interval and refuses before lookup.
 */
export function test_render_scene_practical_surface_materials(): void {
  const initial: Material = new MeshBasicMaterial();
  const active: Material = new MeshBasicMaterial();
  const panel: Mesh = new Mesh(undefined, initial);
  const frame: Mesh = new Mesh(undefined, initial);
  const parts: ReadonlyMap<string, Object3D> = new Map([
    ["panel", panel],
    ["frame", frame],
    ["alias", panel],
  ]);
  const model: IAutoMovieModelObject = {
    object: new Group(),
    parts,
    bones: new Map(),
  };
  const original: IAutoMovieShot = {
    id: "shot",
    name: null,
    scene: "set",
    camera: "fixed",
    cameraMotion: null,
    duration: 1,
    performances: [],
    objectMotions: [],
    practicalSurfaces: [
      {
        node: "display",
        part: "panel",
        keys: [
          { time: 0, material: "idle" },
          { time: 0.5, material: "active" },
        ],
      },
    ],
  };
  const resolveNode = (id: string): IAutoMovieModelObject | undefined =>
    id === "display" ? model : undefined;
  const resolveMaterial = (
    _node: string,
    _part: string,
    id: string,
  ): Material | undefined =>
    id === "active" ? active : id === "idle" ? initial : undefined;
  applyPracticalSurfaceMaterials(original, 0.5, resolveNode, resolveMaterial);
  TestValidator.predicate(
    "only the tracked part receives the prepared reference",
    panel.material === active && frame.material === initial,
  );

  const demanded: IAutoMovieShot = {
    ...original,
    practicalSurfaces: [
      { node: "display", part: "panel", keys: [{ time: 0, material: "idle" }] },
      {
        node: "display",
        part: "frame",
        keys: [{ time: 0, material: "missing" }],
      },
    ],
  };
  TestValidator.predicate(
    "later material is refused by name",
    throwsError(
      () =>
        applyPracticalSurfaceMaterials(
          demanded,
          0.5,
          resolveNode,
          resolveMaterial,
        ),
      ['part "frame"', 'material "missing"'],
    ),
  );
  TestValidator.predicate(
    "the earlier candidate was not published",
    panel.material === active && frame.material === initial,
  );

  const aliases: IAutoMovieShot = {
    ...original,
    practicalSurfaces: [
      { node: "display", part: "panel", keys: [{ time: 0, material: "idle" }] },
      {
        node: "display",
        part: "alias",
        keys: [{ time: 0, material: "active" }],
      },
    ],
  };
  TestValidator.predicate(
    "duplicate native target is refused",
    throwsError(
      () =>
        applyPracticalSurfaceMaterials(
          aliases,
          0.5,
          resolveNode,
          resolveMaterial,
        ),
      "no distinct single-material mesh",
    ),
  );
  TestValidator.predicate(
    "duplicate target leaves prior material",
    panel.material === active,
  );
  TestValidator.predicate(
    "shot end is excluded",
    throwsError(
      () =>
        applyPracticalSurfaceMaterials(
          original,
          1,
          (): never => {
            throw new Error("lookup called");
          },
          resolveMaterial,
        ),
      "inside the shot",
    ),
  );
}

import { autoMovieModelColumns } from "../../../../packages/engine/src/validation/autoMovieModelColumns";
import { tessellate } from "../../../../packages/engine/src/geometry/tessellate";
import { validateModel } from "../../../../packages/engine/src/validation/validateModel";
import { IAutoMovieModel, IAutoMovieGeometry, IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { createFormationOverlapScenario } from "../internal/createFormationOverlapScenario";
import { namedFacts, nclose } from "../internal/predicates";
import { IAutoMovieModelColumn } from "../../../../packages/engine/src/validation/IAutoMovieModelColumn";
import { ITessellation } from "../../../../packages/engine/src/geometry/ITessellation";
/**
 * Filled columns stay inside actual tessellated primitive faces and omit unmeasurable ancestry or arithmetic.
 *
 * Scenarios:
 * 1. Face-plane support independently bounds every measured sphere, capsule,
 *    cylinder, cone and box core; radial facet apothems replace outer vertex radii.
 * 2. Keep rest-chain, offset, rotation, mirrored part-scale and erased-column cases.
 * 3. Nonunit ancestral scale omits its subtree; overflowed primitive/scaled outer envelopes and intervals are omitted
 *    while ordinary dense unit-scale ancestry remains measurable.
 * 4. Admitted near-unit yaw shrinkage/expansion is omitted for both part and
 *    ancestral frames; an exact half-turn remains horizontally isometric.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual column outputs are checked against every nondegenerate face halfspace of actual primitive tessellation, plus explicit interval, omission and rest-chain cases. The old full sphere cylinder and radial vertex radii protrude past these faces.
 * @evidence contracts/testing.md#independent-expectations A cylinder's maximum face-normal projection is r*hypot(nx,nz)+h*abs(ny)+centre*ny; triangle vertices define its independent supporting plane. Expected dimensions follow regular-polygon apothems and an inscribed ball. The authored yaw's TRS matrix has horizontal gain hypot(1-2*y*y,2*y*w), so a near-unit norm is not an isometry certificate; an exact half-turn has gain one.
 * @evidence contracts/testing.md#distinguishing-cases Sphere and radial solids face all planes, while box, mirrored part scale, unit rest chains, off-axis and unsupported parts retain their original cases. Nonunit ancestry, summed rest height and actual/scaled/translated outer overflow add omissions after scalar admission, with admitted near-unit shrink/expand part yaw and a shrinking ancestor contrasted against an exact isometric half-turn.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit discovered as test_production_formation_overlap_columns; this exported function owns all numeric assertions using existing authored model seams, without a native renderer, browser or GPU claim.
 */
export function test_production_formation_overlap_columns(): void {
  const scenario: ReturnType<typeof createFormationOverlapScenario> = createFormationOverlapScenario();
  const { post }: typeof scenario = scenario;
  const wide: IAutoMovieModel = post({ id: "post", radius: 0.4 });

  const { at, bone }: typeof scenario = scenario;
  const shapes: IAutoMovieModel = {
    ...wide,
    id: "shapes",
    parts: [
      { type: "sphere" as const, radius: 0.5 },
      { type: "capsule" as const, radius: 0.3, height: 2 },
      { type: "cylinder" as const, radius: 0.2, height: 4 },
      { type: "cone" as const, radius: 0.8, height: 4 },
      { type: "box" as const, width: 3, height: 6, depth: 1 },
      { type: "plane" as const, width: 3, depth: 3 },
      { type: "sphere" as const, radius: Number.POSITIVE_INFINITY },
      { type: "box" as const, width: 1, height: 0, depth: 1 },
    ].map((shape: { type: "sphere"; radius: number; height?: undefined; width?: undefined; depth?: undefined; } | { type: "capsule"; radius: number; height: number; width?: undefined; depth?: undefined; } | { type: "cylinder"; radius: number; height: number; width?: undefined; depth?: undefined; } | { type: "cone"; radius: number; height: number; width?: undefined; depth?: undefined; } | { type: "box"; width: number; height: number; depth: number; radius?: undefined; } | { type: "plane"; width: number; depth: number; radius?: undefined; height?: undefined; }, index: number): { id: string; name: null; geometry: { type: "primitive"; shape: { type: "sphere"; radius: number; height?: undefined; width?: undefined; depth?: undefined; } | { type: "capsule"; radius: number; height: number; width?: undefined; depth?: undefined; } | { type: "cylinder"; radius: number; height: number; width?: undefined; depth?: undefined; } | { type: "cone"; radius: number; height: number; width?: undefined; depth?: undefined; } | { type: "box"; width: number; height: number; depth: number; radius?: undefined; } | { type: "plane"; width: number; depth: number; radius?: undefined; height?: undefined; }; }; material: null; attachedBone: null; transform: null; } => ({
      id: `part-${index}`,
      name: null,
      geometry: { type: "primitive" as const, shape },
      material: null,
      attachedBone: null,
      transform: null,
    })),
  };
  shapes.parts.push({
    id: "imported",
    name: null,
    geometry: {
      type: "mesh",
      mesh: {
        positions: [],
        normals: null,
        uvs: null,
        indices: null,
        skin: null,
      },
    },
    material: null,
    attachedBone: null,
    transform: null,
  });
  const measured: IAutoMovieModelColumn[] = autoMovieModelColumns(shapes);
  for (let shapeIndex: number = 0; shapeIndex < 5; ++shapeIndex) {
    const geometry: IAutoMovieGeometry = shapes.parts[shapeIndex]!.geometry;
    if (geometry.type !== "primitive") throw new Error("expected an authored primitive");
    const mesh: ITessellation = tessellate(geometry.shape);
    const column: IAutoMovieModelColumn = measured[shapeIndex]!;
    const centre: number = (column.bottom + column.top) / 2;
    const half: number = (column.top - column.bottom) / 2;
    for (let face: number = 0; face < mesh.indices.length; face += 3) {
      const a: number = mesh.indices[face]! * 3;
      const b: number = mesh.indices[face + 1]! * 3;
      const c: number = mesh.indices[face + 2]! * 3;
      const ux: number = mesh.positions[b]! - mesh.positions[a]!;
      const uy: number = mesh.positions[b + 1]! - mesh.positions[a + 1]!;
      const uz: number = mesh.positions[b + 2]! - mesh.positions[a + 2]!;
      const vx: number = mesh.positions[c]! - mesh.positions[a]!;
      const vy: number = mesh.positions[c + 1]! - mesh.positions[a + 1]!;
      const vz: number = mesh.positions[c + 2]! - mesh.positions[a + 2]!;
      let nx: number = uy * vz - uz * vy;
      let ny: number = uz * vx - ux * vz;
      let nz: number = ux * vy - uy * vx;
      const norm: number = Math.hypot(nx, ny, nz);
      if (norm === 0) continue;
      nx /= norm;
      ny /= norm;
      nz /= norm;
      let distance: number = nx * mesh.positions[a]! + ny * mesh.positions[a + 1]! + nz * mesh.positions[a + 2]!;
      if (distance < 0) { nx = -nx; ny = -ny; nz = -nz; distance = -distance; }
      const support: number = column.radius * Math.hypot(nx, nz) + half * Math.abs(ny) + centre * ny;
      TestValidator.predicate(`primitive ${shapeIndex} column fits face ${face / 3}`, support <= distance || nclose(support, distance, 1e-12));
    }
  }
  TestValidator.equals(
    "every primitive states the disc inside it and nothing states one it has not got",
    namedFacts([
      // Sphere, capsule, cylinder, cone and box; the plane, the mesh, the
      // infinite radius and the flattened box hold no column at all.
      ["five", (): boolean => measured.length === 5],
      [
        "sphere",
        (): boolean =>
          nclose(measured[0]!.radius, 0.5 * Math.cos(Math.PI / 16) * Math.cos(Math.PI / 24) / Math.SQRT2) &&
          nclose(measured[0]!.bottom, -measured[0]!.radius) &&
          nclose(measured[0]!.top, measured[0]!.radius),
      ],
      // The current capsule producer is a bounding cylinder; this core stays
      // within its shaft interval without claiming the rounded silhouette.
      [
        "capsule",
        (): boolean =>
          nclose(measured[1]!.radius, 0.3 * Math.cos(Math.PI / 16)) &&
          nclose(measured[1]!.bottom, -1) &&
          nclose(measured[1]!.top, 1),
      ],
      [
        "cylinder",
        (): boolean =>
          nclose(measured[2]!.radius, 0.2 * Math.cos(Math.PI / 16)) &&
          nclose(measured[2]!.bottom, -2) &&
          nclose(measured[2]!.top, 2),
      ],
      // A cone is wide at the top and a point at the bottom, so the disc of
      // half its base radius is filled through its upper half and nowhere else.
      [
        "cone",
        (): boolean =>
          nclose(measured[3]!.radius, 0.4 * Math.cos(Math.PI / 16)) &&
          nclose(measured[3]!.bottom, 0) &&
          nclose(measured[3]!.top, 2),
      ],
      // A box turned to any heading still holds the disc of its narrower side.
      [
        "box",
        (): boolean =>
          nclose(measured[4]!.radius, 0.5) &&
          nclose(measured[4]!.bottom, -3) &&
          nclose(measured[4]!.top, 3),
      ],
    ]),
    {
      five: true,
      sphere: true,
      capsule: true,
      cylinder: true,
      cone: true,
      box: true,
    },
  );

  // A chain listed child before parent, one bone off the axis carrying another
  // that is on it, and four parts: one on the root, one up the chain, one on
  // the off-axis branch, and one riding nothing at all.
  const rigged: IAutoMovieModel = {
    ...wide,
    id: "rigged",
    skeleton: {
      id: "rig",
      bones: [
        bone("head", "spine", at(0, 0.4, 0)),
        bone("spine", "hips", at(0, 0.6, 0)),
        bone("hips", null, at(0, 1, 0)),
        bone("leftUpperArm", "spine", at(0.3, 0, 0)),
        bone("leftLowerArm", "leftUpperArm", at(0, -0.2, 0)),
        // On the axis in translation and turned off the vertical in rotation,
        // so the column of anything riding it is no longer vertical either.
        bone("neck", "spine", {
          ...at(0, 0.2, 0),
          rotation: { x: 0.7071, y: 0, z: 0, w: 0.7071 },
        }),
      ],
    },
    parts: [
      {
        id: "pelvis",
        name: null,
        geometry: {
          type: "primitive",
          shape: { type: "box", width: 0.4, height: 0.2, depth: 0.3 },
        },
        material: null,
        attachedBone: "hips",
        transform: at(0, 0, 0),
      },
      {
        id: "crown",
        name: null,
        geometry: { type: "primitive", shape: { type: "sphere", radius: 0.1 } },
        material: null,
        attachedBone: "head",
        transform: null,
      },
      {
        id: "forearm",
        name: null,
        geometry: {
          type: "primitive",
          shape: { type: "capsule", radius: 0.05, height: 0.3 },
        },
        material: null,
        attachedBone: "leftLowerArm",
        transform: null,
      },
      {
        id: "aside",
        name: null,
        geometry: { type: "primitive", shape: { type: "sphere", radius: 0.2 } },
        material: null,
        attachedBone: null,
        transform: at(0.5, 0, 0),
      },
      {
        id: "behind",
        name: null,
        geometry: { type: "primitive", shape: { type: "sphere", radius: 0.2 } },
        material: null,
        attachedBone: null,
        transform: at(0, 0, 0.5),
      },
      {
        id: "tipped",
        name: null,
        geometry: { type: "primitive", shape: { type: "sphere", radius: 0.2 } },
        material: null,
        attachedBone: null,
        transform: {
          ...at(0, 0, 0),
          rotation: { x: 0.7071, y: 0, z: 0, w: 0.7071 },
        },
      },
      {
        id: "rolled",
        name: null,
        geometry: { type: "primitive", shape: { type: "sphere", radius: 0.2 } },
        material: null,
        attachedBone: null,
        transform: {
          ...at(0, 0, 0),
          rotation: { x: 0, y: 0, z: 0.7071, w: 0.7071 },
        },
      },
      {
        id: "shrunk",
        name: null,
        geometry: {
          type: "primitive",
          shape: { type: "box", width: 2, height: 2, depth: 1 },
        },
        material: null,
        attachedBone: null,
        transform: { ...at(0, 1, 0), scale: { x: 3, y: -2, z: 4 } },
      },
      {
        id: "erased",
        name: null,
        geometry: { type: "primitive", shape: { type: "sphere", radius: 0.2 } },
        material: null,
        attachedBone: null,
        transform: { ...at(0, 0, 0), scale: { x: 0, y: 1, z: 1 } },
      },
      // Riding a bone that is itself turned off the vertical. Its own transform
      // is identity and its bone stands on the axis, so only the bone's own
      // rotation can leave it out; the radius is distinct from every measured
      // column so its absence is readable rather than merely a count.
      {
        id: "collar",
        name: null,
        geometry: {
          type: "primitive",
          shape: { type: "sphere", radius: 0.33 },
        },
        material: null,
        attachedBone: "neck",
        transform: null,
      },
    ],
  };
  const chained: IAutoMovieModelColumn[] = autoMovieModelColumns(rigged);
  TestValidator.equals(
    "a part is measured up its own chain, and left out wherever that chain leaves the axis",
    namedFacts([
      // The pelvis, the crown and the scaled box. The forearm rides a branch
      // that left the axis, and the four beside it are displaced or tipped off
      // it themselves; the last is scaled to nothing across.
      ["three", (): boolean => chained.length === 3],
      [
        "pelvis",
        (): boolean =>
          nclose(chained[0]!.radius, 0.15) &&
          nclose(chained[0]!.bottom, 0.9) &&
          nclose(chained[0]!.top, 1.1),
      ],
      // Hips one metre up, spine six tenths above it, head four tenths above
      // that: two metres, whatever order the bones were listed in.
      [
        "crown",
        (): boolean =>
          nclose(chained[1]!.radius, 0.1 * Math.cos(Math.PI / 16) * Math.cos(Math.PI / 24) / Math.SQRT2) &&
          nclose(chained[1]!.bottom, 2 - 0.1 * Math.cos(Math.PI / 16) * Math.cos(Math.PI / 24) / Math.SQRT2) &&
          nclose(chained[1]!.top, 2 + 0.1 * Math.cos(Math.PI / 16) * Math.cos(Math.PI / 24) / Math.SQRT2),
      ],
      // A box 2 m across and 1 m deep, scaled by 3 and 4, is 6 m across and 4 m
      // deep, and the disc inside it is half the narrower of those. Mirrored
      // vertically it fills exactly what its unmirrored twin did, one metre up.
      [
        "scaled",
        (): boolean =>
          nclose(chained[2]!.radius, 2) &&
          nclose(chained[2]!.bottom, -1) &&
          nclose(chained[2]!.top, 3),
      ],
      // The collar rides a bone that stands on the axis and is turned off the
      // vertical, so its column is not vertical and is not measured. Its expected
      // inscribed core radius is unique, so absence is a fact about that part
      // rather than a count that happens to agree.
      [
        "theTurnedBoneCarriesNothing",
        (): boolean => chained.every((column: IAutoMovieModelColumn): boolean => nclose(column.radius, 0.33 * Math.cos(Math.PI / 16) * Math.cos(Math.PI / 24) / Math.SQRT2) === false),
      ],
    ]),
    {
      three: true,
      pelvis: true,
      crown: true,
      scaled: true,
      theTurnedBoneCarriesNothing: true,
    },
  );
  const ancestorModel: IAutoMovieModel = {
    ...wide,
    skeleton: { id: "ancestor-rig", bones: [bone("hips", null, at(0, 0, 0)), bone("spine", "hips", at(0, 0, 0))] },
    parts: [{ ...wide.parts[0]!, attachedBone: "spine" }],
  };
  TestValidator.equals("unit-scale ancestor chain preserves its column", autoMovieModelColumns(ancestorModel).length, 1);
  const scaledAncestor: IAutoMovieModel = { ...ancestorModel, skeleton: { ...ancestorModel.skeleton!, bones: [bone("hips", null, { ...at(0, 0, 0), scale: { x: 2, y: 1, z: 1 } }), bone("spine", "hips", at(0, 0, 0))] } };
  TestValidator.equals("nonunit ancestor scale omits its otherwise axial child", autoMovieModelColumns(scaledAncestor).length, 0);
  const overflowed: IAutoMovieModel = { ...ancestorModel, skeleton: { ...ancestorModel.skeleton!, bones: [bone("hips", null, at(0, Number.MAX_VALUE, 0)), bone("spine", "hips", at(0, Number.MAX_VALUE, 0))] } };
  TestValidator.equals("finite authored transforms pass the current model admission", validateModel({ model: overflowed }).success, true);
  TestValidator.equals("overflowed summed rest height does not claim infinite occupancy", autoMovieModelColumns(overflowed).length, 0);
  const hugeCapsule: IAutoMovieModel = { ...wide, parts: [{ ...wide.parts[0]!, geometry: { type: "primitive", shape: { type: "capsule", radius: Number.MAX_VALUE / 4, height: Number.MAX_VALUE } } }] };
  TestValidator.equals("finite capsule dimensions pass scalar model admission", validateModel({ model: hugeCapsule }).success, true);
  TestValidator.equals("overflowed actual capsule cylinder height has no measurable filled core", autoMovieModelColumns(hugeCapsule).length, 0);
  const hugeScaled: IAutoMovieModel = { ...wide, parts: [{ ...wide.parts[0]!, geometry: { type: "primitive", shape: { type: "cylinder", radius: Number.MAX_VALUE, height: 2 } }, transform: { ...at(0, 0, 0), scale: { x: 2, y: 1, z: 1 } } }] };
  TestValidator.equals("finite primitive and part scale pass scalar model admission", validateModel({ model: hugeScaled }).success, true);
  TestValidator.equals("a finite core minimum cannot hide overflowed scaled outer coordinates", autoMovieModelColumns(hugeScaled).length, 0);
  const hugeOuterInterval: IAutoMovieModel = { ...wide, parts: [{ ...wide.parts[0]!, geometry: { type: "primitive", shape: { type: "sphere", radius: 1e308 } }, transform: at(0, 1e308, 0) }] };
  TestValidator.equals("finite sphere dimensions and base pass scalar model admission", validateModel({ model: hugeOuterInterval }).success, true);
  TestValidator.equals("finite inscribed endpoints cannot hide an overflowed outer Y end", autoMovieModelColumns(hugeOuterInterval).length, 0);
  for (const factor of [1 - 5e-7, 1 + 5e-7]) {
    const rotation: IAutoMovieQuaternion = { x: 0, y: Math.SQRT1_2 * factor, z: 0, w: Math.SQRT1_2 * factor };
    const gain: number = Math.hypot(1 - 2 * rotation.y * rotation.y, 2 * rotation.y * rotation.w);
    const yawed: IAutoMovieModel = { ...wide, parts: [{ ...wide.parts[0]!, transform: { ...at(0, 0, 0), rotation } }] };
    TestValidator.equals("near-unit axial part yaw passes current scalar admission", validateModel({ model: yawed }).success, true);
    TestValidator.predicate("the admitted yaw matrix changes horizontal lengths", factor < 1 ? gain < 1 : gain > 1);
    TestValidator.equals("a nonisometric axial part frame cannot certify its unchanged core", autoMovieModelColumns(yawed).length, 0);
    const yawAncestor: IAutoMovieModel = { ...ancestorModel, skeleton: { ...ancestorModel.skeleton!, bones: [bone("hips", null, { ...at(0, 0, 0), rotation }), bone("spine", "hips", at(0, 0, 0))] } };
    TestValidator.equals("near-unit axial ancestor yaw passes current scalar admission", validateModel({ model: yawAncestor }).success, true);
    TestValidator.equals("a nonisometric ancestor omits its otherwise axial subtree", autoMovieModelColumns(yawAncestor).length, 0);
  }
  const halfTurn: IAutoMovieModel = { ...wide, parts: [{ ...wide.parts[0]!, transform: { ...at(0, 0, 0), rotation: { x: 0, y: 1, z: 0, w: 0 } } }] };
  TestValidator.equals("an exact isometric half-turn remains admitted", validateModel({ model: halfTurn }).success, true);
  const halfTurnColumns: IAutoMovieModelColumn[] = autoMovieModelColumns(halfTurn);
  TestValidator.equals("an exact isometric half-turn preserves its column", halfTurnColumns.length, 1);
  TestValidator.predicate("the preserved half-turn core keeps its polygon apothem", nclose(halfTurnColumns[0]!.radius, 0.4 * Math.cos(Math.PI / 16)));
}

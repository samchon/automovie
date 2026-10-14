import {
  lowerSoftFurnishing,
  simulateSoftBody,
  softBodySurfaceGeometry,
} from "@automovie/engine";
import { buildSoftBodyObject } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { namedFacts, nclose } from "../internal/predicates";
import { observeThrownValue } from "../internal/observeThrownValue";
import { softFurnishing, softPanel } from "../internal/softFixtures";

/** A hanging panel and its derived surface at one step. */
const drape: (step: number) => ReturnType<typeof softBodySurfaceGeometry> = (step: number) : ReturnType<typeof softBodySurfaceGeometry> => {
  const domain: ReturnType<typeof softPanel> = softPanel({
    columns: 4,
    rows: 4,
    overrides: {
      id: "drape",
      anchors: [
        { id: "left", particle: 0, position: null },
        { id: "right", particle: 3, position: null },
      ],
    },
  });
  return softBodySurfaceGeometry({
    domain,
    state: simulateSoftBody(domain, step),
  });
};

/**
 * The viewer uploads the engine's cloth panel and contributes no geometry of
 * its own.
 *
 * A viewer that built its own mesh would be a second opinion about where the
 * fabric is, and a second opinion can disagree with the field the constraints
 * were proven against. Every attribute therefore comes straight from
 * `softBodySurfaceGeometry`, including the bounding sphere: measuring the
 * vertex buffer would report a cord as a surface and give a camera a volume no
 * triangle supports.
 *
 * The analysis status rides along on the object, because a panel drawn in its
 * rest shape under an `unsupported` status must be distinguishable in the scene
 * graph from one that was actually solved.
 *
 * Scenarios:
 *
 * 1. Every buffer attribute matches the engine surface element for element, and
 *    the index buffer matches its length and its first triangle.
 * 2. The bounding sphere is the engine's own extent — centre and radius derived
 *    from the reported bounds — rather than a recomputed one.
 * 3. `update` re-uploads a newly solved step: the positions change, the step in
 *    `userData` follows, and the vertex count does not.
 * 4. A cord carries no triangle, so the object is hidden and its bounding sphere
 *    collapses to a point rather than culling against an invented volume, and a
 *    surface carrying no normals, UVs or indices at all uploads empty buffers
 *    rather than failing on the missing attribute.
 * 5. Cloth is drawn double-sided by default, and a supplied material is used as-is
 *    and not disposed by the object that borrowed it, while the default
 *    material is.
 * 6. The analysis status is recorded and is a required argument, so each of
 *    `solved`, `rest`, `not-run` and `unsupported` is identifiable from the
 *    scene graph alone.
 * 7. Same-size updates retain actual attribute/array identity; shape changes
 *    transfer to a fresh geometry and retire its predecessor once.
 * 8. Failed old-geometry retirement preserves its cause, blocks another update
 *    and cannot skip independent current-geometry/default-material close.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls production cloth construction/update/disposal with actual Engine surfaces and Three objects, comparing uploaded values, Engine-bound sphere, status, wrapper/array reuse and real disposal-event attempts; failed prior retirement must refuse further update and retain its original error through repeat close.
 * @evidence contracts/testing.md#independent-expectations Canonical Engine surface values and bounds define upload expectations with independent float comparisons; identity and manually counted own dispose events define retention/ownership. This unit proves CPU projection and event requests, not solved physical validity, native same-frame uploads, visible cloth or GPU/kernel release.
 * @evidence contracts/testing.md#distinguishing-cases Covers solved steps, same-size identity, changed topology, cord/null bounds, missing normal/UV/index buffers, borrowed/default material and rest/not-run/unsupported status transitions; prior retirement failure contrasts healthy transfer and verifies independent final owners plus sticky refusal. Engine solver admission is owned by its own units.
 * @evidence contracts/testing.md#execution-ownership The named unit entry invokes the real Engine solver/surface and viewer APIs without a renderer or native host; existing portable fixtures own the inputs and the original sparse triangle is extracted once for reuse, with no Human model, new driver or dynamically registered case.
 */
export function test_viewer_soft_body_panel(): void {
  const surface: ReturnType<typeof softBodySurfaceGeometry> = drape(64);
  const object: ReturnType<typeof buildSoftBodyObject> = buildSoftBodyObject({ surface, status: "solved" });
  const geometry: THREE.BufferGeometry = object.object.geometry;
  TestValidator.equals(
    "every attribute is the engine's own",
    namedFacts([
      [
        "positions",
        () : boolean =>
          Array.from(geometry.getAttribute("position").array).every(
            (value: number, index: number) : boolean =>
              nclose(value, surface.mesh.positions[index], 1e-5),
          ),
      ],
      [
        "normals",
        () : boolean =>
          geometry.getAttribute("normal").count ===
          surface.mesh.positions.length / 3 &&
          Array.from(geometry.getAttribute("normal").array).every(
            (value: number, index: number): boolean => nclose(value, (surface.mesh.normals ?? [])[index], 1e-5),
          ),
      ],
      [
        "uvs",
        () : boolean =>
          Array.from(geometry.getAttribute("uv").array).every((value: number, index: number) : boolean =>
            nclose(value, (surface.mesh.uvs ?? [])[index], 1e-5),
          ),
      ],
      [
        "indices",
        () : boolean =>
          geometry.getIndex()?.count === (surface.mesh.indices ?? []).length,
      ],
      [
        "firstTriangle",
        () : boolean =>
          geometry.getIndex()?.getX(0) === (surface.mesh.indices ?? [])[0] &&
          geometry.getIndex()?.getX(1) === (surface.mesh.indices ?? [])[1] &&
          geometry.getIndex()?.getX(2) === (surface.mesh.indices ?? [])[2],
      ],
      ["name", () : boolean => object.object.name === "soft:drape"],
      ["domain", () : boolean => object.object.userData.domain === "drape"],
      ["step", () : boolean => object.object.userData.step === 64],
    ]),
    {
      positions: true,
      normals: true,
      uvs: true,
      indices: true,
      firstTriangle: true,
      name: true,
      domain: true,
      step: true,
    },
  );

  const bounds: ReturnType<typeof softBodySurfaceGeometry>["bounds"] = surface.bounds;
  TestValidator.equals(
    "the bounding sphere is the engine's extent, not a recomputed one",
    namedFacts([
      ["present", () : boolean => bounds !== null && geometry.boundingSphere !== null],
      [
        "centre",
        () : boolean =>
          bounds !== null &&
          nclose(
            geometry.boundingSphere?.center.y ?? NaN,
            (bounds.min.y + bounds.max.y) / 2,
          ) &&
          nclose(geometry.boundingSphere?.center.x ?? NaN, (bounds.min.x + bounds.max.x) / 2) &&
          nclose(geometry.boundingSphere?.center.z ?? NaN, (bounds.min.z + bounds.max.z) / 2),
      ],
      [
        "radius",
        () : boolean =>
          bounds !== null &&
          nclose(
            geometry.boundingSphere?.radius ?? NaN,
            new THREE.Vector3(
              bounds.min.x,
              bounds.min.y,
              bounds.min.z,
            ).distanceTo(
              new THREE.Vector3(bounds.max.x, bounds.max.y, bounds.max.z),
            ) / 2,
          ),
      ],
      ["visible", () : boolean => object.object.visible === true],
    ]),
    { present: true, centre: true, radius: true, visible: true },
  );

  const before: number = geometry.getAttribute("position").getY(15);
  const beforeAttributes: Array<THREE.BufferAttribute | THREE.InterleavedBufferAttribute> = [
    geometry.getAttribute("position"), geometry.getAttribute("normal"), geometry.getAttribute("uv"), geometry.getIndex()!,
  ];
  const beforeArrays: Array<THREE.BufferAttribute["array"]> = beforeAttributes.map((attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute): THREE.BufferAttribute["array"] => attribute.array);
  object.update({ surface: drape(128), status: "solved" });
  const afterAttributes: typeof beforeAttributes = [geometry.getAttribute("position"), geometry.getAttribute("normal"), geometry.getAttribute("uv"), geometry.getIndex()!];
  TestValidator.predicate("same-size updates retain the actual wrappers and array storage",
    object.object.geometry === geometry && afterAttributes.every((attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, index: number): boolean => attribute === beforeAttributes[index] && attribute.array === beforeArrays[index]));
  TestValidator.equals(
    "update re-uploads a newly solved step",
    namedFacts([
      ["moved", () : boolean => geometry.getAttribute("position").getY(15) !== before],
      ["step", () : boolean => object.object.userData.step === 128],
      ["count", () : boolean => geometry.getAttribute("position").count === 16],
      ["status", () : boolean => object.object.userData.status === "solved"],
    ]),
    { moved: true, step: true, count: true, status: true },
  );

  const cord: ReturnType<typeof softPanel> = softPanel({ columns: 1, rows: 4, overrides: { id: "cord" } });
  const thread: ReturnType<typeof buildSoftBodyObject> = buildSoftBodyObject({
    surface: softBodySurfaceGeometry({
      domain: cord,
      state: simulateSoftBody(cord, 0),
    }),
    status: "rest",
  });
  const sparse: ReturnType<typeof buildSoftBodyObject> = buildSoftBodyObject({
    surface: sparseSurface(),
    status: "not-run",
  });
  TestValidator.equals(
    "a cord is hidden, and an attribute-less surface uploads empty buffers",
    namedFacts([
      ["hidden", () : boolean => thread.object.visible === false],
      ["radius", () : boolean => thread.object.geometry.boundingSphere?.radius === 0],
      [
        "normals",
        () : boolean => sparse.object.geometry.getAttribute("normal").count === 0,
      ],
      ["uvs", () : boolean => sparse.object.geometry.getAttribute("uv").count === 0],
      ["indices", () : boolean => sparse.object.geometry.getIndex()?.count === 0],
      [
        "positions",
        () : boolean => sparse.object.geometry.getAttribute("position").count === 3,
      ],
    ]),
    {
      hidden: true,
      radius: true,
      normals: true,
      uvs: true,
      indices: true,
      positions: true,
    },
  );
  sparse.dispose();

  const borrowed: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial();
  let borrowedDisposals: number = 0;
  borrowed.addEventListener("dispose", (): void => { ++borrowedDisposals; });
  const lent: ReturnType<typeof buildSoftBodyObject> = buildSoftBodyObject({
    surface,
    material: borrowed,
    status: "solved",
  });
  const owned: THREE.Material = object.object.material as THREE.Material;
  let defaultDisposals: number = 0;
  owned.addEventListener("dispose", (): void => { ++defaultDisposals; });
  lent.dispose();
  object.dispose();
  object.dispose();
  thread.dispose();
  TestValidator.equals(
    "material ownership decides what is disposed",
    namedFacts([
      [
        "doubleSided",
        () : boolean => (owned as THREE.MeshStandardMaterial).side === THREE.DoubleSide,
      ],
      ["used", () : boolean => lent.object.material === borrowed],
      ["borrowedNotDisposed", () : boolean => borrowedDisposals === 0],
      ["defaultDisposedOnce", () : boolean => defaultDisposals === 1],
    ]),
    { doubleSided: true, used: true, borrowedNotDisposed: true, defaultDisposedOnce: true },
  );
  borrowed.dispose();

  const unsupported: ReturnType<typeof lowerSoftFurnishing> = lowerSoftFurnishing({
    furnishing: softFurnishing({ domain: "self" }),
    domain: softPanel({
      columns: 3,
      rows: 3,
      overrides: { id: "self", selfCollision: true },
    }),
    time: 0.25,
  });
  const flagged: ReturnType<typeof buildSoftBodyObject> = buildSoftBodyObject({
    surface: unsupported.surface ?? surface,
    status: unsupported.analysis.status,
  });
  TestValidator.equals(
    "an unsupported panel is identifiable from the scene graph",
    namedFacts([
      ["status", () : boolean => flagged.object.userData.status === "unsupported"],
      ["solved", () : boolean => object.object.userData.status === "solved"],
      ["rest", () : boolean => thread.object.userData.status === "rest"],
      ["notRun", () : boolean => sparse.object.userData.status === "not-run"],
      [
        "restGeometry",
        () : boolean => unsupported.state?.step === 0 && unsupported.surface !== null,
      ],
    ]),
    {
      status: true,
      solved: true,
      rest: true,
      notRun: true,
      restGeometry: true,
    },
  );

  flagged.update({ surface, status: "solved" });
  TestValidator.equals(
    "an update carries the status of the analysis that produced it",
    namedFacts([
      ["followed", () : boolean => flagged.object.userData.status === "solved"],
      ["step", () : boolean => flagged.object.userData.step === surface.step],
      [
        "back",
        () : boolean => {
          flagged.update({
            surface: unsupported.surface ?? surface,
            status: "unsupported",
          });
          return flagged.object.userData.status === "unsupported";
        },
      ],
    ]),
    { followed: true, step: true, back: true },
  );
  flagged.dispose();
  const resized: ReturnType<typeof buildSoftBodyObject> = buildSoftBodyObject({ surface, status: "solved" });
  const replaced: THREE.BufferGeometry = resized.object.geometry;
  let replacedAttempts: number = 0;
  replaced.addEventListener("dispose", (): void => { ++replacedAttempts; });
  resized.update({ surface: sparseSurface(), status: "not-run" });
  TestValidator.predicate("changed shape transfers to a new geometry and retires the prior owner once",
    resized.object.geometry !== replaced && replacedAttempts === 1 && resized.object.geometry.getAttribute("position").count === 3);
  resized.dispose();

  const failedResize: ReturnType<typeof buildSoftBodyObject> = buildSoftBodyObject({ surface, status: "solved" });
  let priorAttempts: number = 0;
  let currentAttempts: number = 0;
  let materialAttempts: number = 0;
  const retirementFailure: Error = new Error("cloth old geometry retirement");
  failedResize.object.geometry.addEventListener("dispose", (): void => { ++priorAttempts; throw retirementFailure; });
  const failedUpdate: ReturnType<typeof observeThrownValue> = observeThrownValue((): void => failedResize.update({ surface: sparseSurface(), status: "not-run" }));
  TestValidator.predicate("failed old geometry retirement keeps its original cause", failedUpdate.threw && failedUpdate.error === retirementFailure);
  failedResize.object.geometry.addEventListener("dispose", (): void => { ++currentAttempts; });
  (failedResize.object.material as THREE.Material).addEventListener("dispose", (): void => { ++materialAttempts; });
  const refusedUpdate: ReturnType<typeof observeThrownValue> = observeThrownValue((): void => failedResize.update({ surface, status: "solved" }));
  TestValidator.predicate("failed owner refuses another update without repeating old disposal", refusedUpdate.threw && refusedUpdate.error === retirementFailure && priorAttempts === 1);
  const failedClose: ReturnType<typeof observeThrownValue> = observeThrownValue(failedResize.dispose);
  const repeatedClose: ReturnType<typeof observeThrownValue> = observeThrownValue(failedResize.dispose);
  TestValidator.predicate("independent final owners retire once while repeat retains old uncertainty",
    failedClose.threw && failedClose.error === retirementFailure && repeatedClose.threw && repeatedClose.error === retirementFailure &&
    priorAttempts === 1 && currentAttempts === 1 && materialAttempts === 1);
}

/** The existing sparse triangle case expressed for geometry-shape transitions. */
function sparseSurface(): ReturnType<typeof softBodySurfaceGeometry> {
  return { domain: "sparse", step: 0, mesh: { positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], normals: null, uvs: null, indices: null, skin: null }, bounds: null };
}

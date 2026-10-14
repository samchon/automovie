import type { IAutoMovieConstraintViolation, IAutoMovieLight, IAutoMovieScene, IAutoMovieSpace, IAutoMovieTransform, IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validateSceneArtifact } from "../../../../packages/production/src/validators/artifacts/validateSceneArtifact";
import { nclose } from "../internal/nclose";
type SceneModels = Parameters<typeof validateSceneArtifact>[1];

/**
 * Exercise collective portable-scene admission for registry, nodes, camera/light parameters, ground and atmosphere before any renderer consumes them.
 *
 * Scenarios:
 *
 * 1. A resolved node, perspective camera and all four supported light kinds accept their adjacent supported ranges without mutating input records.
 * 2. Malformed registry rows, scene arrays and unresolved node references are refused with their original field and row identities.
 * 3. Camera clip spans, punctual ranges, spot cones, panel extents and shadow settings each accept supported neighbors and refuse their boundaries.
 * 4. Declared ground and atmosphere are checked independently; physical space findings are re-rooted once and point VSM retains its light-row address.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateSceneArtifact and checks admitted neighbors, exact refusal addresses and unchanged authored input, catching omitted field gates or mis-rooted space/environment findings.
 * @evidence contracts/testing.md#independent-expectations Literal registry identities and declared finite/open camera, light, shadow and atmosphere domains determine each expected path. Input preservation compares the pre-call caller record, not a prior validator output; no pixel or GPU result is an oracle.
 * @evidence contracts/testing.md#distinguishing-cases Retains malformed object/row/reference, supported and boundary camera/light/shadow, ground/fog/environment and point-VSM cases. Renderer effects and actual depth precision are tested by their respective owners.
 * @evidence contracts/testing.md#execution-ownership The named unit directly invokes portable production admission with caller-created scene/registry records; it starts no host, scene renderer or dynamic test population.
 */
export function test_validation_scene_artifact(): void {
  const transform: IAutoMovieTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const common: Pick<IAutoMovieLight, "transform" | "color" | "intensity"> = { transform, color: { r: 1, g: 1, b: 1, a: null, hex: null }, intensity: 1 };
  const lights: IAutoMovieLight[] = [
    { ...common, id: "sun", type: "directional" },
    { ...common, id: "bulb", type: "point", range: 0 },
    { ...common, id: "spot", type: "spot", range: 10, coneAngle: 30 },
    { ...common, id: "panel", type: "area", width: 1, height: 2 },
  ];
  const scene: IAutoMovieScene = {
    id: "stage", name: null,
    nodes: [{ id: "prop", model: "mesh", transform, motion: null, pose: null }],
    cameras: [{ id: "camera", transform, fovY: 50, near: 0.1, far: 100,
      depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 0.1 },
    }],
    lights,
  };
  const models: SceneModels = [{ id: "mesh", skeleton: null }];
  const paths: (patch?: Record<string, unknown>, registry?: unknown) => string[] = (patch: Record<string, unknown> = {}, registry: unknown = models): string[] => {
    const result: IAutoMovieValidation = validateSceneArtifact({ ...scene, ...patch } as IAutoMovieScene, registry as SceneModels);
    TestValidator.predicate("refusal retains a finding", result.success || result.violations.length > 0);
    return result.success ? [] : result.violations.map((item: IAutoMovieConstraintViolation) : string => item.path);
  };
  const cameraPaths: (patch: Record<string, unknown>) => string[] = (patch: Record<string, unknown>): string[] => paths({ cameras: [{ ...scene.cameras[0], ...patch }] });
  const lightPaths: (light: unknown) => string[] = (light: unknown): string[] => paths({ lights: [light] });
  const before: IAutoMovieScene = structuredClone(scene);
  TestValidator.equals("supported scene", paths(), []);
  const unchanged: (value: unknown, expected: unknown) => boolean = (value: unknown, expected: unknown): boolean => {
    if (typeof value === "number" && typeof expected === "number")
      return nclose(value, expected, 0);
    if (Array.isArray(value) !== Array.isArray(expected)) return false;
    if (Array.isArray(value) && Array.isArray(expected) && value.length !== expected.length) return false;
    if (typeof value === "object" && value !== null && typeof expected === "object" && expected !== null) {
      const observed: Record<string, unknown> = value as Record<string, unknown>;
      const reference: Record<string, unknown> = expected as Record<string, unknown>;
      const keys: string[] = Object.keys(observed);
      return keys.length === Object.keys(reference).length && keys.every((key: string): boolean => Object.prototype.hasOwnProperty.call(reference, key) && unchanged(observed[key], reference[key]));
    }
    return value === expected;
  };
  TestValidator.predicate("authored scene remains owned", unchanged(scene, before));
  const malformed: IAutoMovieValidation = validateSceneArtifact(null as unknown as IAutoMovieScene, models);
  TestValidator.predicate("scene object", !malformed.success && malformed.violations.some((item: IAutoMovieConstraintViolation) : boolean => item.path === "$input"));
  TestValidator.predicate("registry array", paths({}, null).includes("$models"));
  TestValidator.predicate("registry object", paths({}, [null, ...models]).includes("$models[0]"));
  TestValidator.predicate("registry identity", paths({}, [{ id: 1, skeleton: null }, ...models]).includes("$models[0].id"));
  TestValidator.predicate("unknown model", paths({ nodes: [{ ...scene.nodes[0], model: "absent" }] }).includes("$input.nodes[0].model"));
  TestValidator.predicate("model reference type", paths({ nodes: [{ ...scene.nodes[0], model: 1 }] }).includes("$input.nodes[0].model"));
  for (const field of ["nodes", "cameras", "lights"])
    TestValidator.predicate("row object", paths({ [field]: [null] }).includes(`$input.${field}[0]`));
  for (const far of [0.1, NaN, Infinity, "100"])
    TestValidator.predicate("camera far", cameraPaths({ far }).includes("$input.cameras[0].far"));
  TestValidator.predicate("camera near type", cameraPaths({ near: "0.1" }).includes("$input.cameras[0].near"));
  for (const fovY of [0, 180])
    TestValidator.predicate("camera field", cameraPaths({ fovY }).includes("$input.cameras[0].fovY"));
  const point: IAutoMovieLight | undefined = lights[1];
  const spot: IAutoMovieLight | undefined = lights[2];
  const panel: IAutoMovieLight | undefined = lights[3];
  TestValidator.predicate("unknown light kind", lightPaths({ ...point, type: "unknown" }).includes("$input.lights[0].type"));
  TestValidator.predicate("negative point range", lightPaths({ ...point, range: -1 }).includes("$input.lights[0].range"));
  TestValidator.equals("spot hemisphere boundary", lightPaths({ ...spot, coneAngle: 90 }), []);
  for (const coneAngle of [0, 90.001])
    TestValidator.predicate("spot cone", lightPaths({ ...spot, coneAngle }).includes("$input.lights[0].coneAngle"));
  for (const axis of ["width", "height"])
    TestValidator.predicate("panel extent", lightPaths({ ...panel, [axis]: 0 }).includes(`$input.lights[0].${axis}`));
  TestValidator.predicate("shadow flag", lightPaths({ ...point, castShadow: "yes" }).includes("$input.lights[0].castShadow"));
  TestValidator.predicate("panel shadow", lightPaths({ ...panel, castShadow: true }).includes("$input.lights[0].castShadow"));
  TestValidator.equals("noncasting panel", lightPaths({ ...panel, castShadow: false }), []);
  TestValidator.predicate("required shadow", lightPaths({ ...point, castShadow: true }).includes("$input.lights[0].shadow"));
  const shadow: NonNullable<IAutoMovieLight["shadow"]> = { mapSize: 256, bias: -0.001, normalBias: 0, near: 0.1, far: 100 };
  TestValidator.equals("supported point shadow", lightPaths({ ...point, castShadow: true, shadow }), []);
  TestValidator.predicate("noncaster settings", lightPaths({ ...point, castShadow: false, shadow }).includes("$input.lights[0].shadow"));
  TestValidator.predicate("shadow shape", lightPaths({ ...point, castShadow: true, shadow: null }).includes("$input.lights[0].shadow"));
  for (const mapSize of [0, 1.5, Infinity, "256"])
    TestValidator.predicate("shadow map extent", lightPaths({ ...point, castShadow: true, shadow: { ...shadow, mapSize } }).includes("$input.lights[0].shadow.mapSize"));
  for (const key of ["bias", "normalBias"])
    TestValidator.predicate("finite shadow bias", lightPaths({ ...point, castShadow: true, shadow: { ...shadow, [key]: NaN } }).includes(`$input.lights[0].shadow.${key}`));
  TestValidator.predicate("shadow near type", lightPaths({ ...point, castShadow: true, shadow: { ...shadow, near: "0.1" } }).includes("$input.lights[0].shadow.near"));
  for (const far of [0.1, NaN, "100"])
    TestValidator.predicate("shadow clip span", lightPaths({ ...point, castShadow: true, shadow: { ...shadow, far } }).includes("$input.lights[0].shadow.far"));
  const space: IAutoMovieSpace = {
    id: "floor", walkable: ["floor"],
    surfaces: [{ id: "floor", kind: "floor", rampTo: null,
      anchor: { x: 0, y: 0, z: 0 },
      polygon: [{ x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }, { x: 2, y: 0, z: 2 }, { x: 0, y: 0, z: 2 }],
    }],
  };
  TestValidator.equals("supported ground", paths({ space }), []);
  TestValidator.predicate("ground shape", paths({ space: 1 }).includes("$input.space"));
  TestValidator.predicate("ground physics address", paths({ space: { ...space, walkable: ["absent"] } }).some((path: string) : boolean => path.startsWith("$input.space.walkable")));
  const fog: NonNullable<IAutoMovieScene["fog"]> = { density: 0.01, color: common.color };
  TestValidator.equals("supported fog", paths({ fog }), []);
  TestValidator.predicate("fog shape", paths({ fog: 1 }).includes("$input.fog"));
  TestValidator.predicate("fog density", paths({ fog: { ...fog, density: -1 } }).includes("$input.fog.density"));
  const environment: NonNullable<IAutoMovieScene["environment"]> = { image: null, background: null, intensity: 1, rotationDeg: 0, exposure: 1, toneMapping: "none", shadows: { enabled: true, type: "pcf" } };
  TestValidator.equals("supported environment", paths({ environment }), []);
  TestValidator.predicate("environment address", paths({ environment: { ...environment, exposure: -1 } }).some((path: string) : boolean => path.startsWith("$input.environment")));
  TestValidator.predicate("point VSM row", paths({ environment: { ...environment, shadows: { enabled: true, type: "vsm" } }, lights: [{ ...point, castShadow: true, shadow }] }).includes("$input.lights[0].castShadow"));
}

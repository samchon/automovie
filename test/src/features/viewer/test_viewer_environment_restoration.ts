import type { IAutoMovieSceneEnvironment } from "@automovie/interface";
import { applyRendererEnvironment, renderAutoMovieScenePass, attachAutoMovieSemanticMask } from "@automovie/viewer";
import { deriveAutoMovieSemanticMask } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { sceneFixture, modelsFixture, buildingFixture } from "../internal/renderFixtures";
import { nclose } from "../internal/predicates";

const environment: IAutoMovieSceneEnvironment = { image: null, background: null, intensity: 1, rotationDeg: 0, exposure: 1.25, toneMapping: "acesFilmic", shadows: { enabled: true, type: "pcf" } };

/** Four mutable policy values observed through the renderer's supplied property port. */
interface IEnvironmentState {
  /** Native tone curve enumeration. */
  tone: THREE.ToneMapping;
  /** Scalar exposure multiplier. */
  exposure: number;
  /** Shadow-policy enablement. */
  enabled: boolean;
  /** Native shadow-filter enumeration. */
  type: THREE.ShadowMapType;
}

/** Existing local policy seam; failures and attempts expose independent setter behavior. */
interface IEnvironmentHost {
  /** Structural port supplied to the actual viewer coordinator. */
  renderer: THREE.WebGLRenderer;
  /** Current observable property values. */
  values: IEnvironmentState;
  /** Independently authored values before policy application. */
  initial: IEnvironmentState;
  /** Failure identities keyed by the existing apply/restore/draw operations. */
  failures: Map<string, Error>;
  /** Ordered property-setting attempts. */
  attempts: string[];
}

/** Build the existing local setter seam, admitting the draw callback at construction instead of replacing a renderer method. */
const createHost: (onDraw?: (input: THREE.Object3D) => void) => IEnvironmentHost = (onDraw?: (input: THREE.Object3D) => void): IEnvironmentHost => {
  const initial: IEnvironmentState = { tone: THREE.LinearToneMapping, exposure: 3, enabled: false, type: THREE.BasicShadowMap };
  const values: IEnvironmentState = { ...initial };
  const failures: Map<string, Error> = new Map<string, Error>();
  const attempts: string[] = [];
  const set: <Key extends keyof IEnvironmentState>(key: Key, value: IEnvironmentState[Key]) => void = <Key extends keyof IEnvironmentState>(key: Key, value: IEnvironmentState[Key]): void => {
    const operation: string = (value === initial[key] ? "restore:" : "apply:") + key;
    attempts.push(operation);
    const error: Error | undefined = failures.get(operation);
    if (error !== undefined) throw error;
    values[key] = value;
  };
  const renderer: THREE.WebGLRenderer = {
    getRenderTarget: (): null => null,
    get toneMapping(): THREE.ToneMapping { return values.tone; },
    set toneMapping(value: THREE.ToneMapping) { set("tone", value); },
    get toneMappingExposure(): number { return values.exposure; },
    set toneMappingExposure(value: number) { set("exposure", value); },
    shadowMap: {
      get enabled(): boolean { return values.enabled; },
      set enabled(value: boolean) { set("enabled", value); },
      get type(): THREE.ShadowMapType { return values.type; },
      set type(value: THREE.ShadowMapType) { set("type", value); },
    },
    render: (input: THREE.Object3D): void => {
      const error: Error | undefined = failures.get("draw");
      if (error !== undefined) throw error;
      onDraw?.(input);
    },
  } as unknown as THREE.WebGLRenderer;
  return { renderer, values, initial, failures, attempts };
};

/** Observe a synchronous operation's thrown identity without substituting its implementation. */
const caught: (operation: () => unknown) => unknown = (operation: () => unknown): unknown => {
  try { operation(); return undefined; } catch (error) { return error; }
};

/** Compare the native policy enums and exact assigned exposure scalar. */
const sameState: (actual: IEnvironmentState, expected: IEnvironmentState) => boolean = (actual: IEnvironmentState, expected: IEnvironmentState): boolean => actual.tone === expected.tone && actual.enabled === expected.enabled && actual.type === expected.type && nclose(actual.exposure, expected.exposure, 0);

/**
 * Source-local view policy restores independently of drawing and failed setters.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual environment application and scene-pass coordination through an owned property/draw port. It observes reversible policy, retry after failed restoration, all independent setter attempts and primary/rollback/draw/mode error identities rather than silently replacing one failure with another.
 * @evidence contracts/testing.md#independent-expectations Authored initial linear curve, exposure 3, disabled basic shadows and declared ACES exposure 1.25/PCF shadows supply the state oracle. Explicit Error objects and operation order supply failure expectations; native disposal events expose restoration errors but establish no GPU or kernel release.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts successful/repeated restoration, each independently failing setter, multiple and empty nested aggregates, partial setup plus rollback, successful/refused drawing, missing semantic structure and mode disposal failure. Legacy and delivery fallback calls remain present; pixel output and real renderer lifetime belong to host integration.
 * @evidence contracts/testing.md#execution-ownership This named portable unit invokes product coordinators with the existing local renderer seam and native Three metadata objects. The draw callback is supplied during seam construction, with no live renderer/prototype replacement, browser, GPU or dynamic test registration.
 */
export function test_viewer_environment_restoration(): void {
  const positive: IEnvironmentHost = createHost();
  const handle: ReturnType<typeof applyRendererEnvironment> = applyRendererEnvironment(positive.renderer, environment, "beauty");
  TestValidator.predicate("authored beauty policy is applied", sameState(positive.values,
    { tone: THREE.ACESFilmicToneMapping, exposure: 1.25, enabled: true, type: THREE.PCFShadowMap }));
  handle.restore(); handle.restore();
  TestValidator.predicate("positive reversible policy", sameState(positive.values, positive.initial));
  const legacy: ReturnType<typeof applyRendererEnvironment> = applyRendererEnvironment(positive.renderer, undefined, "beauty");
  TestValidator.predicate("omitted policy preserves host state", sameState(positive.values, positive.initial));
  legacy.restore();
  const delivered: ReturnType<typeof applyRendererEnvironment> = applyRendererEnvironment(positive.renderer, undefined, "beauty", "none");
  TestValidator.predicate("delivery curve changes only its owned field", sameState(positive.values,
    { tone: THREE.NoToneMapping, exposure: 3, enabled: false, type: THREE.BasicShadowMap }));
  delivered.restore();
  for (const key of ["tone", "exposure", "enabled", "type"]) {
    const host: IEnvironmentHost = createHost();
    const failure: Error = new Error(key);
    const owner: ReturnType<typeof applyRendererEnvironment> = applyRendererEnvironment(host.renderer, environment, "beauty");
    host.failures.set("restore:" + key, failure);
    TestValidator.predicate("single restoration failure retains identity", caught((): void => owner.restore()) === failure);
    TestValidator.predicate("all independent restoration setters attempted", ["tone", "exposure", "enabled", "type"].every((name: string): boolean => host.attempts.includes("restore:" + name)));
    host.failures.clear(); owner.restore(); owner.restore();
    TestValidator.predicate("recovery retries failed ownership", sameState(host.values, host.initial));
  }
  const multiple: IEnvironmentHost = createHost();
  const first: Error = new Error("first");
  const second: Error = new Error("second");
  const owner: ReturnType<typeof applyRendererEnvironment> = applyRendererEnvironment(multiple.renderer, environment, "beauty");
  multiple.failures.set("restore:tone", first); multiple.failures.set("restore:exposure", second);
  const aggregate: unknown = caught((): void => owner.restore());
  TestValidator.predicate("restoration aggregates every failure", aggregate instanceof AggregateError && aggregate.errors[0] === first && aggregate.errors[1] === second);
  const partial: IEnvironmentHost = createHost();
  partial.failures.set("apply:exposure", first);
  TestValidator.predicate("configuration rollback preserves primary", caught((): ReturnType<typeof applyRendererEnvironment> => applyRendererEnvironment(partial.renderer, environment, "beauty")) === first);
  TestValidator.predicate("partial configuration restores other fields", sameState(partial.values, partial.initial));
  const combined: IEnvironmentHost = createHost();
  combined.failures.set("apply:exposure", first); combined.failures.set("restore:tone", second);
  const combinedError: unknown = caught((): ReturnType<typeof applyRendererEnvironment> => applyRendererEnvironment(combined.renderer, environment, "beauty"));
  TestValidator.predicate("configuration and rollback aggregate", combinedError instanceof AggregateError && combinedError.errors[0] === first && combinedError.errors[1] === second);
  const combinedMultiple: IEnvironmentHost = createHost();
  combinedMultiple.failures.set("apply:exposure", first); combinedMultiple.failures.set("restore:tone", second); combinedMultiple.failures.set("restore:type", second);
  const many: unknown = caught((): ReturnType<typeof applyRendererEnvironment> => applyRendererEnvironment(combinedMultiple.renderer, environment, "beauty"));
  TestValidator.predicate("aggregate rollback remains flat", many instanceof AggregateError && many.errors.length === 3);
  const opaque: IEnvironmentHost = createHost();
  const emptyAggregate: AggregateError = new AggregateError([], "opaque restoration");
  opaque.failures.set("apply:exposure", first); opaque.failures.set("restore:tone", emptyAggregate);
  const opaqueError: unknown = caught((): ReturnType<typeof applyRendererEnvironment> => applyRendererEnvironment(opaque.renderer, environment, "beauty"));
  TestValidator.predicate("empty rollback aggregate retains its own identity", opaqueError instanceof AggregateError && opaqueError.errors[0] === first && opaqueError.errors[1] === emptyAggregate);
  const scene: THREE.Scene = new THREE.Scene();
  const camera: THREE.Camera = new THREE.Camera();
  const draw: IEnvironmentHost = createHost();
  renderAutoMovieScenePass(draw.renderer, scene, camera, environment, "beauty");
  TestValidator.predicate("scene source pass restores policy", sameState(draw.values, draw.initial));
  draw.failures.set("draw", first);
  TestValidator.predicate("draw failure identity", caught((): void => renderAutoMovieScenePass(draw.renderer, scene, camera, environment, "beauty")) === first);
  draw.failures.set("restore:tone", second);
  const drawError: unknown = caught((): void => renderAutoMovieScenePass(draw.renderer, scene, camera, environment, "beauty"));
  TestValidator.predicate("draw and restore retain both errors", drawError instanceof AggregateError && drawError.errors[0] === first && drawError.errors[1] === second);
  const refused: IEnvironmentHost = createHost();
  const design: ReturnType<typeof sceneFixture> = sceneFixture();
  const mask: ReturnType<typeof deriveAutoMovieSemanticMask> = deriveAutoMovieSemanticMask({ scene: design, models: modelsFixture(), environments: [buildingFixture()], instanceSets: [] });
  attachAutoMovieSemanticMask(scene, { design, mask });
  TestValidator.predicate("missing semantic scene refuses its structural setup", caught((): void => renderAutoMovieScenePass(refused.renderer, scene, camera, environment, "mask")) instanceof Error);
  TestValidator.predicate("structural setup refusal restores renderer policy", sameState(refused.values, refused.initial));
  const modeFailure: IEnvironmentHost = createHost((input: THREE.Object3D): void => {
    const override: THREE.Material = (input.children[0] as THREE.Mesh).material as THREE.Material;
    override.addEventListener("dispose", (): never => { throw first; });
  });
  const plain: THREE.Scene = new THREE.Scene();
  const geometry: THREE.BoxGeometry = new THREE.BoxGeometry();
  const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial();
  plain.add(new THREE.Mesh(geometry, material));
  TestValidator.predicate("mode restore failure remains visible", caught((): void => renderAutoMovieScenePass(modeFailure.renderer, plain, camera, environment, "mask")) === first);
  TestValidator.predicate("mode failure still restores environment policy", sameState(modeFailure.values, modeFailure.initial));
  geometry.dispose(); material.dispose();
}

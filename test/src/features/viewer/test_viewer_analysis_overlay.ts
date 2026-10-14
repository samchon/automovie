import {
  IAutoMovieDaylightRequest,
  analyzeAutoMovieAcoustics,
  analyzeAutoMovieDaylight,
  sealAutoMovieAnalysisRun,
} from "@automovie/engine";
import { IAutoMovieAnalysisRun } from "@automovie/interface";
import {
  autoMovieAnalysisRampColor,
  buildAnalysisOverlayObject,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { analysisContext, boxSolid } from "../internal/analysisFixtures";
import { namedFacts, nclose, throwsError } from "../internal/predicates";

/**
 * The viewer draws the numerical field carried by the reported artifact and refuses inputs without that field.
 *
 * Overlay admission requires a solved numerical run with a present metric value and spatial field. Unsupported, not-run, unknown, gapped and fieldless inputs refuse with their own reason; a numerical artifact is not a physical measurement or evidence of a completed rendered picture.
 *
 * The pure color ramp follows authored blue/green/red endpoints, linear intermediate stops and outside clamping, checked through finite scalar predicates.
 *
 * Scenarios:
 *
 * 1. A solved two-cell study becomes two points at the field positions,
 *    coloured by the ends of the ramp, carrying the run identity and unit in
 *    `userData`.
 * 2. The ramp is its own definition at both ends, the middle, both quarters and
 *    outside the range in both directions.
 * 3. A pinned domain rescales the same field, and a field with no spread is drawn
 *    at the middle of the ramp instead of dividing by zero.
 * 4. A default material is disposed with the overlay; a caller's material is left
 *    alone.
 * 5. An unsupported run, a not-run run, an unknown metric, a gapped metric and a
 *    solved metric with no field are each refused with the reason attached.
 * 6. A non-positive point size and an inverted or non-finite ramp domain are
 *    refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds actual overlay point buffers from solved analysis fields, observes ramp/domain/identity metadata and native disposal events, and refuses unsupported, absent, gapped or fieldless results plus invalid presentation operands. A numerical run without usable spatial samples cannot become an apparent field through this adapter.
 * @evidence contracts/testing.md#independent-expectations Authored workplane cell centers give X=-0.5/0.5 at Y=Z=0; the unblocked 900-intensity luminaire three metres above the first cell gives 100 under the solver's inverse-square model, while the second cell is shaded. Explicit blue/green/red ramp stops and affine midpoint values define colors independently of overlay output; run digest is borrowed input identity, and neither numerical analysis nor disposal events certify physical measurement or GPU release.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts solved field endpoints, quarter/midpoint/outside ramp values, pinned and zero-spread domains, owned versus borrowed material, unsupported/not-run/unknown/gapped/fieldless results and invalid size/domain operands. Solver calibration and rendered pixels belong to their owners; this entry owns field-to-native metadata realization and refusal.
 * @evidence contracts/testing.md#execution-ownership This named portable unit directly invokes numerical analysis and overlay construction with existing authored context/solid fixtures, then observes native metadata/dispose events. It starts no viewer, browser or GPU and all local predicate callbacks belong to this entry.
 */
export function test_viewer_analysis_overlay(): void {
  const context: ReturnType<typeof analysisContext> = analysisContext();
  const request: (overrides?: Partial<IAutoMovieDaylightRequest>) => IAutoMovieDaylightRequest = (
    overrides: Partial<IAutoMovieDaylightRequest> = {},
  ): IAutoMovieDaylightRequest => ({
    id: "hall-daylight",
    subject: "space:hall",
    inputRevision: "r7",
    context,
    instant: null,
    workplane: {
      origin: { x: -1, y: 0, z: 1 },
      axisU: { x: 1, y: 0, z: 0 },
      axisV: { x: 0, y: 0, z: -1 },
      sizeU: 2,
      sizeV: 2,
      countU: 2,
      countV: 1,
    },
    shades: [boxSolid("beam", { x: 0, y: 1, z: -1 }, { x: 2, y: 2, z: 1 })],
    luminaires: [
      { id: "downlight", position: { x: -0.5, y: 3, z: 0 }, intensity: 900 },
    ],
    sky: "isotropic",
    diffuseSamples: 16,
    targets: [],
    ...overrides,
  });
  const run: IAutoMovieAnalysisRun = analyzeAutoMovieDaylight({ request: request() });
  const overlay: ReturnType<typeof buildAnalysisOverlayObject> = buildAnalysisOverlayObject({
    run,
    metric: "workplane.total.illuminance",
  });
  const positions: ReturnType<typeof overlay.object.geometry.getAttribute> = overlay.object.geometry.getAttribute("position");
  const colors: ReturnType<typeof overlay.object.geometry.getAttribute> = overlay.object.geometry.getAttribute("color");
  const sameNumbers: (actual: ArrayLike<number>, expected: readonly number[]) => boolean = (actual: ArrayLike<number>, expected: readonly number[]): boolean => actual.length === expected.length && Array.from(actual).every((value: number, index: number): boolean => nclose(value, expected[index]!));
  const identity: Record<string, unknown> = overlay.object.userData.autoMovieAnalysis as Record<string, unknown>;
  const range: ReturnType<typeof overlay.range> = overlay.range();
  TestValidator.equals(
    "a solved study becomes one coloured point per numerical cell",
    {
      type: overlay.object.type,
      name: overlay.object.name,
      count: overlay.count(),
      bounded: overlay.object.geometry.boundingSphere !== null,
      userData: { run: identity.run, domain: identity.domain, metric: identity.metric, unit: identity.unit, status: identity.status, digest: identity.digest },
    },
    {
      type: "Points",
      name: "analysis:hall-daylight:workplane.total.illuminance",
      count: 2,
      bounded: true,
      userData: {
        run: "hall-daylight",
        domain: "artificial-light",
        metric: "workplane.total.illuminance",
        unit: "lx",
        status: "untargeted",
        digest: run.digest,
      },
    },
  );
  TestValidator.predicate("authored field positions and color endpoints are realized",
    sameNumbers(positions.array, [-0.5, 0, 0, 0.5, 0, 0]) &&
      sameNumbers(colors.array, [1, 0, 0, 0, 0, 1]) &&
      nclose(range.min, 0) && nclose(range.max, 100) &&
      typeof identity.min === "number" && nclose(identity.min, 0) &&
      typeof identity.max === "number" && nclose(identity.max, 100));
  overlay.dispose();

  const rampCases: Array<[number, ReturnType<typeof autoMovieAnalysisRampColor>]> = [
    [0, { r: 0, g: 0, b: 1 }], [0.25, { r: 0, g: 0.5, b: 0.5 }],
    [0.5, { r: 0, g: 1, b: 0 }], [0.75, { r: 0.5, g: 0.5, b: 0 }],
    [1, { r: 1, g: 0, b: 0 }], [-2, { r: 0, g: 0, b: 1 }],
    [3, { r: 1, g: 0, b: 0 }],
  ];
  for (const [value, expected] of rampCases) {
    const actual: ReturnType<typeof autoMovieAnalysisRampColor> = autoMovieAnalysisRampColor(value);
    TestValidator.predicate("authored ramp stop " + value,
      nclose(actual.r, expected.r) && nclose(actual.g, expected.g) && nclose(actual.b, expected.b));
  }

  const pinned: ReturnType<typeof buildAnalysisOverlayObject> = buildAnalysisOverlayObject({
    run,
    metric: "workplane.total.illuminance",
    domain: { min: 0, max: 200 },
    size: 0.25,
  });
  const flatRun: IAutoMovieAnalysisRun = analyzeAutoMovieDaylight({
    request: request({ shades: [] }),
  });
  const flat: ReturnType<typeof buildAnalysisOverlayObject> = buildAnalysisOverlayObject({
    run: flatRun,
    metric: "workplane.total.illuminance",
    domain: { min: 5, max: 5 },
  });
  const pinnedRange: ReturnType<typeof pinned.range> = pinned.range();
  TestValidator.predicate(
    "a pinned domain rescales the field and a flat one sits at the middle",
    nclose(pinnedRange.min, 0) && nclose(pinnedRange.max, 200) &&
      sameNumbers(pinned.object.geometry.getAttribute("color").array, [0, 1, 0, 0, 0, 1]) &&
      nclose((pinned.object.material as THREE.PointsMaterial).size, 0.25) &&
      sameNumbers(flat.object.geometry.getAttribute("color").array, [0, 1, 0, 0, 1, 0]),
  );
  pinned.dispose();
  flat.dispose();

  let ownedDisposed: number = 0;
  let borrowedDisposed: number = 0;
  const defaulted: ReturnType<typeof buildAnalysisOverlayObject> = buildAnalysisOverlayObject({
    run,
    metric: "workplane.total.illuminance",
  });
  (defaulted.object.material as THREE.PointsMaterial).addEventListener(
    "dispose",
    (): void => {
      ownedDisposed += 1;
    },
  );
  const borrowed: THREE.PointsMaterial = new THREE.PointsMaterial({ size: 1, vertexColors: true });
  borrowed.addEventListener("dispose", (): void => {
    borrowedDisposed += 1;
  });
  const lent: ReturnType<typeof buildAnalysisOverlayObject> = buildAnalysisOverlayObject({
    run,
    metric: "workplane.total.illuminance",
    material: borrowed,
  });
  defaulted.dispose();
  lent.dispose();
  TestValidator.equals(
    "the overlay disposes the material it created and never the one it was lent",
    {
      ownedDisposed,
      borrowedDisposed,
      lentMaterial: lent.object.material === borrowed,
    },
    { ownedDisposed: 1, borrowedDisposed: 0, lentMaterial: true },
  );
  borrowed.dispose();

  const unsupported: IAutoMovieAnalysisRun = analyzeAutoMovieDaylight({
    request: request({ sky: "perez-all-weather" }),
  });
  const skipped: IAutoMovieAnalysisRun = sealAutoMovieAnalysisRun({
    id: "skipped",
    domain: "air",
    subject: "space:hall",
    inputRevision: "r7",
    solver: { id: "s", version: "1", model: "m" },
    settings: "none",
    outcome: {
      status: "not-run",
      reason: "no supply flow declared",
      remedy: "declare the supply flow",
    },
  });
  const acoustics: IAutoMovieAnalysisRun = analyzeAutoMovieAcoustics({
    request: {
      id: "hall-acoustics",
      subject: "space:hall",
      inputRevision: "r7",
      volume: 100,
      surfaces: [{ id: "boundaries", area: 100, absorption: 0.5 }],
      partitions: [],
      sources: [],
      receivers: [],
      targets: [],
    },
  });
  const draw: (target: IAutoMovieAnalysisRun, metric: string, fragment: string) => boolean = (
    target: IAutoMovieAnalysisRun,
    metric: string,
    fragment: string,
  ): boolean =>
    throwsError(
      (): ReturnType<typeof buildAnalysisOverlayObject> => buildAnalysisOverlayObject({ run: target, metric }),
      fragment,
    );
  TestValidator.equals(
    "inputs without an admitted numerical field refuse overlay construction",
    namedFacts([
      [
        "an unsupported run",
        (): boolean =>
          draw(
            unsupported,
            "workplane.total.illuminance",
            'is "unsupported", so it has no field to draw',
          ),
      ],
      [
        "a not-run run",
        (): boolean => draw(skipped, "space.airChangeRate", "no supply flow declared"),
      ],
      [
        "an unknown metric",
        (): boolean => draw(run, "room.clarity", 'carries no metric "room.clarity"'),
      ],
      [
        "a gapped metric",
        (): boolean =>
          draw(
            run,
            "workplane.groundReflected.illuminance",
            "models the sky vault only",
          ),
      ],
      [
        "a measurement with no field",
        (): boolean =>
          draw(
            acoustics,
            "room.absorptionArea",
            "recorded no spatial samples of it",
          ),
      ],
      [
        "a non-positive point size",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof buildAnalysisOverlayObject> =>
              buildAnalysisOverlayObject({
                run,
                metric: "workplane.total.illuminance",
                size: 0,
              }),
            "point size must be a finite number above zero",
          ),
      ],
      [
        "an inverted ramp domain",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof buildAnalysisOverlayObject> =>
              buildAnalysisOverlayObject({
                run,
                metric: "workplane.total.illuminance",
                domain: { min: 10, max: 1 },
              }),
            "max at or above min",
          ),
      ],
      [
        "a non-finite ramp domain",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof buildAnalysisOverlayObject> =>
              buildAnalysisOverlayObject({
                run,
                metric: "workplane.total.illuminance",
                domain: { min: Number.NaN, max: 1 },
              }),
            "finite range",
          ),
      ],
    ]),
    {
      "an unsupported run": true,
      "a not-run run": true,
      "an unknown metric": true,
      "a gapped metric": true,
      "a measurement with no field": true,
      "a non-positive point size": true,
      "an inverted ramp domain": true,
      "a non-finite ramp domain": true,
    },
  );
}

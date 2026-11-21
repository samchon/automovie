import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";
import {
  type ISelectAutoMoviePlacedChecks,
  observeAutoMoviePlacedScene,
  reduceAutoMovieInspectionEpisodes,
  selectAutoMoviePlacedChecks,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { Group, type Object3D, PerspectiveCamera, Scene } from "three";

import { IDENTITY_TRANSFORM } from "../internal/fixtures";
import { nclose } from "../internal/predicates";

type IReport = Pick<IAutoMovieInspectionDiagnostics, "findings" | "coverage">;

/**
 * Observe a planted foot on a moving deck, a rolling sole, a held cup and a
 * handoff through the production rule supplier at exact output frames.
 *
 * Scenarios:
 * 1. A foot planted on a deck moving at 2 m/s passes, an honest 3 cm lift and a 4 cm slip in the deck frame fail with their measured values.
 * 2. At the roll boundary the toe phase owns the instant, so the lifted heel is legal.
 * 3. A cup drifting 3 cm inside a closed grip fails, and the grip moves to the receiving hand at the authored handoff frame.
 * 4. A handoff reparented on its authored frame passes custody, and one reparented a frame late fails.
 * 5. Received contact evidence is reported as measured, absent under complete observation or unobservable without changing the measurement.
 * 6. The displayed world matrix is read, a stale local edit is ignored, and every frame gives the same report forward and in reverse.
 * 7. A corrupt ancestor is reported at each displayed descendant, and two same-named invalid children get distinct identities that the episode reducer folds into separate episodes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the seven numbered scenarios and the outcome each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Places a real Three graph per frame and runs the public rule supplier into the public observer, so selection, measurement and reporting are exercised together.
 * @evidence contracts/development/testing.md#independent-expectations The deck sits at x = 2t, the heel anchor is 0.1 m along it, the lift is 0.03 m, the slip 0.04 m and the cup drift 0.03 m, all stated in the placement function.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts a moving support with its world-fixed reading, the heel before and at the roll boundary, an on-time and a late handoff, and a stale local edit with the displayed matrix.
 * @evidence contracts/development/testing.md#execution-ownership The synchronous unit owns its scene graph, clocks and declarations and starts no renderer, solver or browser.
 */
export function test_inspection_placed_contact_checks(): void {
  const scene = new Scene();
  const camera = new PerspectiveCamera();
  const deck = named(new Group(), "deck");
  const heel = named(new Group(), "heel");
  const toe = named(new Group(), "toe");
  const left = named(new Group(), "left-hand");
  const right = named(new Group(), "right-hand");
  const cup = named(new Group(), "cup");
  scene.add(deck, heel, toe, left, right);
  left.position.set(0, 1, 0);
  right.position.set(0.5, 1, 0);

  const place = (seconds: number, handoff: number = 2): void => {
    deck.position.set(2 * seconds, 0.5, 0);
    heel.position.set(
      2 * seconds + 0.1,
      0.5 + (seconds === 0.5 ? 0.03 : seconds >= 1 ? 0.05 : 0),
      seconds === 0.7 ? 0.04 : 0,
    );
    toe.position.set(2 * seconds + 0.3, seconds >= 1 ? 0.5 : 0.52, 0);
    (seconds < handoff ? left : right).add(cup);
    cup.position.set(0, 0, seconds === 1.5 ? 0.08 : 0.05);
    scene.updateMatrixWorld();
  };
  const evidence: ISelectAutoMoviePlacedChecks.IRule["contact"] = (seconds) =>
    seconds === 0.5
      ? { status: "absent", seconds }
      : seconds === 0.7
        ? { status: "unobservable", seconds, reason: "sole camera occluded" }
        : seconds === 0.9
          ? { status: "measured", seconds, separation: 0.001, impulse: null }
          : undefined;
  const expected = {
    position: { x: 0, y: 0, z: 0.05 },
    rotation: IDENTITY_TRANSFORM.rotation,
  };
  const observe = (seconds: number): IReport => {
    const time = {
      filmSeconds: seconds,
      outputFrame: Math.round(seconds * 10),
    };
    return observeAutoMoviePlacedScene({
      scene,
      camera,
      time,
      checks: selectAutoMoviePlacedChecks({
        scene,
        time,
        fps: 10,
        supports: [
          {
            key: "rook:left-foot",
            required: true,
            path: "rook.foot",
            maxGap: 0.01,
            maxSlip: 0.02,
            contact: evidence,
            phases: [
              {
                from: 0,
                to: 1,
                socket: heel,
                support: deck,
                anchor: { x: 0.1, y: 0, z: 0 },
              },
              {
                from: 1,
                to: 2,
                socket: toe,
                support: deck,
                anchor: { x: 0.3, y: 0, z: 0 },
              },
            ],
          },
        ],
        grips: [
          {
            key: "cup:grip",
            required: true,
            path: "cup.grip",
            maxDistance: 0.01,
            maxAngle: 0.05,
            windows: [
              { from: 0, to: 2, hand: left, prop: cup, expected },
              {
                from: 2,
                to: 3,
                hand: right,
                prop: cup,
                expected: () => expected,
              },
            ],
          },
        ],
        custody: [
          {
            key: "cup:custody",
            required: true,
            path: "cup.custody",
            prop: cup,
            holders: { left, right },
            schedule: [
              { from: 0, holder: "left" },
              { from: 2, holder: "right" },
            ],
          },
        ],
      }),
    });
  };
  const at = (seconds: number, handoff?: number): IReport => {
    place(seconds, handoff);
    return observe(seconds);
  };
  const failing = (report: IReport, check: string) =>
    report.findings.filter((finding) => finding.check === check);
  const measured = (report: IReport, check: string, name: string) =>
    failing(report, check)
      .flatMap(({ witness }) => witness.measurements ?? [])
      .find((measure) => measure.name === name)?.value;

  const planted = at(0.9);
  TestValidator.predicate(
    "a planted foot follows the moving deck",
    () => planted.findings.length === 0,
  );
  const lifted = at(0.5);
  const slipped = at(0.7);
  const gap = measured(lifted, "support", "gap");
  const slip = measured(slipped, "support", "slip");
  TestValidator.predicate(
    "an honest lift and slip fail with measured values in the deck frame",
    () =>
      typeof gap === "number" &&
      nclose(gap, 0.03) &&
      failing(lifted, "support")[0]?.paths.includes(
        "rook.foot.phases[0].gap",
      ) === true &&
      typeof slip === "number" &&
      nclose(slip, 0.04),
  );
  TestValidator.predicate(
    "the toe phase owns the roll boundary",
    () => failing(at(1), "support").length === 0,
  );
  const drift = measured(at(1.5), "grip", "distance");
  const handed = at(2);
  TestValidator.predicate(
    "a drifting cup fails and the grip follows the receiving hand",
    () =>
      typeof drift === "number" &&
      nclose(drift, 0.03) &&
      handed.findings.length === 0,
  );
  const late = at(2, 2.1);
  TestValidator.predicate(
    "a handoff reparented a frame late fails custody at the authored frame",
    () =>
      failing(late, "custody").some((finding) =>
        finding.paths.includes("cup.custody.holder"),
      ) && failing(at(1.9), "custody").length === 0,
  );

  const received = (report: IReport) =>
    report.coverage.find((row) => row.check === "received-contact");
  TestValidator.predicate(
    "received contact evidence keeps three classes",
    () =>
      received(lifted)?.status === "checked" &&
      measured(lifted, "support", "received-contacts") === 0 &&
      received(slipped)?.status === "unsupported" &&
      (received(slipped) as { reason?: string }).reason ===
        "sole camera occluded" &&
      received(planted)?.status === "checked" &&
      received(at(1.5)) === undefined,
  );

  place(0.9);
  heel.position.y += 1;
  TestValidator.predicate(
    "a stale local edit does not change the displayed support",
    () => failing(observe(0.9), "support").length === 0,
  );

  const frames: number[] = [0.5, 0.7, 0.9, 1, 1.5, 1.9, 2];
  const forward: string[] = frames.map((seconds) =>
    JSON.stringify(at(seconds)),
  );
  const reverse: string[] = [...frames]
    .reverse()
    .map((seconds) => JSON.stringify(at(seconds)))
    .reverse();
  TestValidator.equals(
    "reverse seeks give the forward reports",
    reverse,
    forward,
  );

  const rig = named(new Group(), "rig");
  rig.matrixWorldAutoUpdate = false;
  rig.matrixWorld.elements[12] = NaN;
  const arm = named(new Group(), "arm");
  const pad = new Group();
  rig.add(arm, named(new Group(), "finger"), named(new Group(), "finger"));
  arm.add(pad);
  const broken = new Scene();
  broken.add(rig);
  broken.updateMatrixWorld();
  const packet = (frame: number): IAutoMovieInspectionDiagnostics => ({
    scope: "rig",
    time: { filmSeconds: frame / 10, outputFrame: frame },
    ...observeAutoMoviePlacedScene({ scene: broken, camera }),
  });
  const native = packet(0).findings.map(({ paths }) => paths[0]);
  TestValidator.equals(
    "a corrupt ancestor is reported once at each displayed node",
    native.sort(
      (left: string | undefined, right: string | undefined): number =>
        String(left) < String(right)
          ? -1
          : String(left) > String(right)
            ? 1
            : 0,
    ),
    [
      "rig.matrixWorld",
      "rig/arm.children[0].matrixWorld",
      "rig/arm.matrixWorld",
      "rig/finger#0.matrixWorld",
      "rig/finger#1.matrixWorld",
    ],
  );
  const audit = reduceAutoMovieInspectionEpisodes([packet(0), packet(1)], 2);
  TestValidator.predicate(
    "same-named invalid nodes fold into separate episodes",
    audit.hasBlockingFinding &&
      audit.episodes.filter(
        ({ first }) =>
          first.finding.paths[0]?.startsWith("rig/finger#") === true,
      ).length === 2 &&
      audit.episodes.every(({ samples }) => samples === 2),
  );
}

function named<T extends Object3D>(object: T, name: string): T {
  object.name = name;
  return object;
}

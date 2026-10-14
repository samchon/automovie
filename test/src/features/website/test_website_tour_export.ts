import {
  type AncientSource,
  type FutureSource,
  type ModernSource,
  exportTourData,
} from "@automovie/website/tour-export";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";
import type { TourView } from "@automovie/website/tour-data";

/**
 * Public camera choices come from native poses, preserving their lens and metres.
 * Scenarios:
 * 1. Temple cameras omit unavailable and section poses and place the authored default first; empty and nonempty lists without that default refuse export.
 * 2. Modern cameras retain the default lens and observation lens independently.
 * 3. Future room cameras preserve namespaced ids; null/section stations stay out of the tour.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls exportTourData for each native shape, observing usable-view filtering, authored initial ordering, camera/lens projection, namespaced ids and native object identity; swapped lenses, invented missing poses or lost source ids fail.
 * @evidence contracts/testing.md#independent-expectations Independently authored coordinates and distinct source/observation lenses determine every expected tuple; metadata labels follow separator/title rules, and the existing exact structural predicate checks each numeric leaf through zero-tolerance nclose while preserving field and array structure.
 * @evidence contracts/testing.md#distinguishing-cases Covers ancient valid/missing/section poses and absent initial view, modern exterior plus differently lensed observations and slash/dot names, and future valid/null/section stations; numeric pose admission and duplicate ids are not checked here.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_website_tour_export entry owns the actual build-time exporter calls with resident transport literals; no experimental scene producer, file, browser, renderer or GPU is executed.
 */
export function test_website_tour_export(): void {
  const p: { x: number; y: number; z: number } = { x: 1, y: 2, z: 3 },
    t: { x: number; y: number; z: number } = { x: 4, y: 5, z: 6 };
  const ancient: AncientSource = {
    lens: { verticalDegrees: 50, near: 0.05, far: 400 },
    observations: [
      {
        id: "room.center",
        group: "space",
        space: "Reading-room",
        position: p,
        target: t,
      },
      { id: "exterior.setting", group: "exterior", position: p, target: t },
      { id: "no-eye", group: "space", position: null, target: t },
      { id: "no-target", group: "space", position: p, target: null },
      { id: "section", group: "space", position: p, target: t, view: {} },
    ],
  };
  const temple: ReturnType<typeof exportTourData> = exportTourData({ building: "ancient", native: ancient });
  TestValidator.predicate(
    "temple native eyes",
    test12ValuesClose(temple.views.map((v: TourView): [string, string, TourView["position"], TourView["target"], number, number, number] => [
      v.id,
      v.group,
      v.position,
      v.target,
      v.fov,
      v.near,
      v.far,
    ]),
    [
      ["exterior.setting", "Exterior", [1, 2, 3], [4, 5, 6], 50, 0.05, 400],
      ["room.center", "Reading Room", [1, 2, 3], [4, 5, 6], 50, 0.05, 400],
    ]),
  );
  TestValidator.predicate("native source kept", temple.native === ancient);
  TestValidator.predicate(
    "missing authored default refuses export",
    throwsError((): ReturnType<typeof exportTourData> =>
      exportTourData({
        building: "ancient",
        native: { ...ancient, observations: [] },
      }), "The building's 3D data is incomplete",
    ),
  );
  TestValidator.predicate(
    "usable room without authored default refuses export",
    throwsError((): ReturnType<typeof exportTourData> =>
      exportTourData({
        building: "ancient",
        native: { ...ancient, observations: [ancient.observations[0]!] },
      }), "The building's 3D data is incomplete",
    ),
  );
  const modern: ModernSource = {
    camera: {
      position: [7, 8, 9],
      target: [1, 2, 3],
      fovDeg: 45,
      near: 0.1,
      far: 300,
    },
    observations: ["lounge.center", "living-room/center-x-minus", "door"].map(
      (id: string): ModernSource["observations"][number] => ({
        id,
        position: [2, 3, 4],
        target: [3, 3, 4],
        fovDeg: 60,
        near: 0.05,
      }),
    ),
  };
  const house: ReturnType<typeof exportTourData> = exportTourData({ building: "modern", native: modern });
  TestValidator.predicate(
    "native modern lens",
    test12ValuesClose(house.views.map((v: TourView): [string, TourView["position"], number, number, number] => [v.id, v.position, v.fov, v.near, v.far]),
    [
      ["exterior", [7, 8, 9], 45, 0.1, 300],
      ...["lounge.center", "living-room/center-x-minus", "door"].map((id: string): [string, TourView["position"], number, number, number] => [
        id,
        [2, 3, 4] as [number, number, number],
        60,
        0.05,
        300,
      ]),
    ]),
  );
  TestValidator.equals(
    "room namespaces",
    house.views.map((v: TourView): string => v.group),
    ["Exterior", "Lounge", "Living Room", "Door"],
  );
  TestValidator.equals(
    "view labels",
    house.views.map((v: TourView): string => v.label),
    ["Whole house", "Center", "Center X Minus", "Door"],
  );
  const future: FutureSource = {
    stations: [
      {
        space: "common-room",
        id: "center",
        pose: { position: p, target: t },
        fov: 55,
      },
      {
        space: "references",
        id: "01-exterior",
        pose: { position: p, target: t },
        fov: 50,
      },
      { space: "room", id: "blocked", pose: null, fov: 50 },
      {
        space: "room",
        id: "plan",
        pose: { position: p, target: t },
        section: {},
        fov: 50,
      },
    ],
  };
  TestValidator.predicate(
    "future usable native poses",
    test12ValuesClose(exportTourData({ building: "future", native: future }).views.map((v: TourView): [string, number] => [
      v.id,
      v.fov,
    ]),
    [
      ["references/01-exterior", 50],
      ["common-room/center", 55],
    ]),
  );
}

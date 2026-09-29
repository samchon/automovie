import {
  type AncientSource,
  type FutureSource,
  type ModernSource,
  exportTourData,
} from "@automovie/website/tour-export";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Public camera choices come from native poses, preserving their lens and metres.
 * Scenarios:
 * 1. Temple cameras omit unavailable and section poses and place the authored default first.
 * 2. Modern cameras retain the default lens and observation lens independently.
 * 3. Future room cameras preserve namespaced ids; null/section stations stay out of the tour.
 */
export const test_website_tour_export = (): void => {
  const p = { x: 1, y: 2, z: 3 },
    t = { x: 4, y: 5, z: 6 };
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
  const temple = exportTourData({ building: "ancient", native: ancient });
  TestValidator.equals(
    "temple native eyes",
    temple.views.map((v) => [
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
    ],
  );
  TestValidator.predicate("native source kept", temple.native === ancient);
  TestValidator.predicate(
    "missing authored default refuses export",
    throwsError(() =>
      exportTourData({
        building: "ancient",
        native: { ...ancient, observations: [] },
      }),
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
      (id): ModernSource["observations"][number] => ({
        id,
        position: [2, 3, 4],
        target: [3, 3, 4],
        fovDeg: 60,
        near: 0.05,
      }),
    ),
  };
  const house = exportTourData({ building: "modern", native: modern });
  TestValidator.equals(
    "native modern lens",
    house.views.map((v) => [v.id, v.position, v.fov, v.near, v.far]),
    [
      ["exterior", [7, 8, 9], 45, 0.1, 300],
      ...["lounge.center", "living-room/center-x-minus", "door"].map((id) => [
        id,
        [2, 3, 4] as [number, number, number],
        60,
        0.05,
        300,
      ]),
    ],
  );
  TestValidator.equals(
    "room namespaces",
    house.views.map((v) => v.group),
    ["Exterior", "Lounge", "Living Room", "Door"],
  );
  TestValidator.equals(
    "view labels",
    house.views.map((v) => v.label),
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
  TestValidator.equals(
    "future usable native poses",
    exportTourData({ building: "future", native: future }).views.map((v) => [
      v.id,
      v.fov,
    ]),
    [
      ["references/01-exterior", 50],
      ["common-room/center", 55],
    ],
  );
};

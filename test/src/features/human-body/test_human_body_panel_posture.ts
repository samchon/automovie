import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodySimpleShape,
} from "@automovie/human";
import type { IAutoMovieJointPose } from "@automovie/interface";
import { mountConnectedBodyPanel } from "@automovie/playground/src/human/connectedBodyPanel";
import { TestValidator } from "@nestia/e2e";
import { JSDOM } from "jsdom";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose } from "../internal/predicates";

/**
 * Applying the simple body stands it in the posture its age implies.
 *
 * The analytic box has no thoracic joints, so the basis the panel reads the
 * posture from carries three more, copies of its spine joint named as the
 * posture table names them; the viewport is a stub, so nothing builds them.
 *
 * Scenarios:
 * 1. A body of 72 applied through the simple controls takes the chest,
 *    upper chest and neck rows of its age, and keeps the document's other
 *    joint rows.
 * 2. Applying a body of 30 drops the posture rows and keeps the others.
 */
export const test_human_body_panel_posture = async (): Promise<void> => {
  const fixture = humanBodyBasisFixture();
  const spine = fixture.basis.joints.find((one) => one.bone === "spine")!;
  const basis: IAutoMovieHumanBodyBasis = {
    ...fixture.basis,
    joints: [
      ...fixture.basis.joints,
      ...["chest", "upperChest", "neck"].map((bone) => ({
        ...spine,
        bone: bone as typeof spine.bone,
      })),
    ],
  };
  const kept: IAutoMovieJointPose = {
    bone: "spine",
    flexion: 5,
    abduction: null,
    twist: null,
  };
  const initial = { ...fixture.document, pose: [kept] };
  const dom = new JSDOM("<!doctype html><main id='app'></main>").window
    .document;
  const app = dom.querySelector<HTMLElement>("#app")!;
  const simple = (): IAutoMovieHumanBodySimpleShape => ({
    sex: -1,
    ageYears: 72,
    statureMetres: 1.6,
    massKilograms: 60,
    muscle: 0,
  });
  const panel = mountConnectedBodyPanel(app, {
    basis,
    initial,
    shapes: [],
    poses: [],
    viewport: () => ({
      build: async () => ({ parts: 1, crossings: null, extras: {} }),
      cancel: () => {},
      publish: () => {},
      dispose: () => {},
      export: async () => new Uint8Array(),
      fitView: () => {},
      cameraView: () => {},
      setClay: () => {},
      setShadows: () => {},
    }),
    seat: () => {},
    simple: {
      expand: async () => ({}),
      project: async () => simple(),
    },
    download: () => {},
  });
  await panel.ready;
  const settle = async (): Promise<void> => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  };
  const apply = async (): Promise<IAutoMovieJointPose[]> => {
    app.querySelector<HTMLButtonElement>("#simple-apply")!.click();
    await settle();
    return panel.snapshot()!.document.pose ?? [];
  };
  const old = await apply();
  const flexion = (rows: IAutoMovieJointPose[], bone: string) =>
    rows.find((one) => one.bone === bone)?.flexion;
  TestValidator.predicate(
    "a body of 72 stands in its age's posture",
    old.some((one) => one.bone === "spine" && one.flexion === 5) &&
      nclose(flexion(old, "chest")!, 5.75, 1e-9) &&
      nclose(flexion(old, "upperChest")!, 5.75, 1e-9) &&
      nclose(flexion(old, "neck")!, -11.5, 1e-9),
  );
  // the user types an age of 30 over the body's own reading
  const input = app.querySelector<HTMLInputElement>("#simple-ageYears")!;
  input.value = "30";
  input.dispatchEvent(new dom.defaultView!.Event("input"));
  const young = await apply();
  TestValidator.equals("a body of 30 stands upright", young, [kept]);
};

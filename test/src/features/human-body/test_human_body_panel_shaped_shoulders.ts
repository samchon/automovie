import { createHumanBodyBasisBuilder, type IAutoMovieHumanBodyBasisDocument, type IAutoMovieHumanBodySimpleShape } from "@automovie/human";
import { mountConnectedBodyPanel } from "@automovie/playground/src/human/body/connectedBodyPanel";
import { TestValidator } from "@nestia/e2e";
import { JSDOM } from "jsdom";

import { humanBodyShoulderFixture } from "../internal/humanBodyShoulderFixture";
import { nclose } from "../internal/predicates";

/**
 * The actual panel composes shoulder edits with the latest shape and commits
 * them through an independent analytic body builder.
 *
 * Scenarios:
 * 1. A pending one-sided elbow lift changes the first axial edit's default
 *    coordinates while a later elevation edit retains that authored axial.
 * 2. Rest returns to omission, coupling labels read the shape's own rest,
 *    and save/reload preserves shape and independent left/right goals.
 * 3. Pending invalid shapes are refused during picker, axis, Rest and coupling
 *    events without a DOM error or authored goal, retaining the last valid
 *    document/model and recovering through the next supported edit.
 * 4. Refused TT goals, undo, redo and reset retain transactional behavior.
 */
export const test_human_body_panel_shaped_shoulders = async (): Promise<void> => {
  const { basis, document: initial } = humanBodyShoulderFixture(true);
  const elbow = basis.landmarks.ids.indexOf("left-elbow");
  basis.channels.push({ id: "elbow", kind: "shape", group: "arms", mirror: null, minimum: -1, maximum: 1, positive: "lift", negative: "lower" });
  basis.landmarks.targets.lift = [elbow, 0, 0.1, 0];
  basis.landmarks.targets.lower = [elbow, 0, -0.1, 0];
  const evaluate = createHumanBodyBasisBuilder(basis);
  const dom = new JSDOM("<!doctype html><main id='app'></main>").window.document;
  const app = dom.querySelector<HTMLElement>("#app")!;
  const eventErrors: unknown[] = [];
  dom.defaultView!.addEventListener("error", (event) => {
    event.preventDefault();
    eventErrors.push(event.error);
  });
  const simple: IAutoMovieHumanBodySimpleShape = { sex: 1, ageYears: 30, statureMetres: 1.75, massKilograms: 75, muscle: 0 };
  let saved = "";
  let delay = false;
  let release!: () => void;
  const panel = mountConnectedBodyPanel(app, {
    basis, initial, poses: [],
    viewport: () => ({
      build: async (document: IAutoMovieHumanBodyBasisDocument) => {
        const built = evaluate(document);
        if (delay) {
          delay = false;
          await new Promise<undefined>((resolve) => { release = () => resolve(undefined); });
        }
        return { parts: built.model.parts.length, crossings: null, extras: { bones: built.bones } };
      },
      cancel: () => {}, publish: () => {}, dispose: () => {}, export: async () => new Uint8Array(),
      fitView: () => {}, cameraView: () => {}, setClay: () => {}, setShadows: () => {},
    }),
    seat: () => {},
    simple: { expand: async () => ({}), project: async () => simple, solveMeasurement: async (shape, _channel, targetMetres) => ({ shape, actualMetres: targetMetres }) },
    download: (_filename, bytes) => { saved = String(bytes); },
  });
  await panel.ready;
  const settle = async (): Promise<void> => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
  const select = (id: string, value: string): void => {
    const one = app.querySelector<HTMLSelectElement>("#" + id)!;
    one.value = value;
    one.dispatchEvent(new dom.defaultView!.Event("change"));
  };
  const input = (side: string, axis: string): HTMLInputElement => app.querySelector<HTMLInputElement>(`#shoulder-${side}UpperArm-${axis}`)!;
  const write = (side: string, axis: string, value: string): void => {
    const one = input(side, axis);
    one.value = value;
    one.dispatchEvent(new dom.defaultView!.Event("change"));
  };
  const rest = (axis: string): void => input("left", axis).parentElement!.querySelector<HTMLButtonElement>("button")!.click();
  select("control-kind", "pose");
  delay = true;
  const old = panel.change({ ...initial, shape: { elbow: 1 } });
  write("left", "axialRotation", "5");
  write("left", "elevation", "100");
  await settle();
  release();
  await old;
  const goal = panel.snapshot()!.document.shoulders![0];
  TestValidator.equals("newer axis edits retain latest shape and both authored axes", [panel.snapshot()!.document.shape, goal.plane, goal.elevation, goal.axialRotation], [{ elbow: 1 }, 0, 100, 5]);
  rest("elevation");
  await settle();
  TestValidator.predicate("Rest uses shape's independently calculated elevation", nclose(panel.snapshot()!.document.shoulders![0].elevation, Math.atan(2) * 180 / Math.PI, 1e-9));
  rest("axialRotation");
  await settle();
  TestValidator.equals("final Rest omits the arm", panel.snapshot()!.document.shoulders, []);
  select("pose-bone", "leftShoulder");
  const addition = (Math.atan(2) * 180 / Math.PI - 45) * 11 / 135;
  TestValidator.predicate("coupling label reflects shaped omitted goal", app.querySelector<HTMLOutputElement>("#pose-leftShoulder-abduction-coupled")!.textContent!.includes(`+${addition.toFixed(1)}°`));
  select("pose-bone", "rightUpperArm");
  TestValidator.predicate("other side omitted rest stays45 degrees", nclose(Number(input("right", "elevation").value), 45, 1e-9));
  write("right", "axialRotation", "-5");
  await settle();
  select("pose-bone", "leftUpperArm");
  write("left", "axialRotation", "5");
  await settle();
  const valid = panel.snapshot()!;
  app.querySelector<HTMLButtonElement>("#body-save")!.click();
  TestValidator.equals("saved document retains both independently authored sides", JSON.parse(saved), valid.document);
  const text = app.querySelector<HTMLTextAreaElement>("#document-json")!;
  text.value = saved;
  app.querySelector<HTMLButtonElement>("#document-apply")!.click();
  await settle();
  TestValidator.equals("reload retains same shape and goals", panel.snapshot()!.document, valid.document);
  let lastModel = panel.snapshot()!.model;
  const invalidPending = panel.change({ ...valid.document, shape: { elbow: 2 } });
  select("pose-bone", "rightUpperArm");
  await invalidPending;
  TestValidator.equals("pending invalid shape events use transactional refusal", eventErrors, []);
  select("pose-bone", "leftUpperArm");
  for (const axis of ["plane", "elevation", "axialRotation"] as const) {
    await panel.change(valid.document);
    const axisModel = panel.snapshot()!.model;
    const pending = panel.change({ ...valid.document, shape: { elbow: 2 } });
    write("left", axis, axis === "elevation" ? "70" : "10");
    await pending;
    TestValidator.equals("invalid pending axis event retains document", panel.snapshot()!.document, valid.document);
    TestValidator.predicate("axis refusal retains last valid model", panel.snapshot()!.model === axisModel);
    await panel.change(valid.document);
    const pendingRest = panel.change({ ...valid.document, shape: { elbow: 2 } });
    rest(axis);
    await pendingRest;
    TestValidator.equals("invalid pending Rest retains document", panel.snapshot()!.document, valid.document);
  }
  await panel.change(valid.document);
  const pendingCoupling = panel.change({ ...valid.document, shape: { elbow: 2 } });
  select("pose-bone", "leftShoulder");
  await pendingCoupling;
  TestValidator.equals("invalid pending coupling paint stays within refusal", eventErrors, []);
  await panel.change(valid.document);
  select("pose-bone", "leftUpperArm");
  lastModel = panel.snapshot()!.model;
  for (const next of [
    { ...valid.document, shape: { elbow: 2 } },
    { ...valid.document, shoulders: [{ bone: "leftUpperArm" as const, plane: 180, elevation: 60, axialRotation: 0 }] },
  ]) {
    TestValidator.equals("invalid edit refused", await panel.change(next), false);
    TestValidator.equals("last valid document retained", panel.snapshot()!.document, valid.document);
    TestValidator.predicate("last valid model retained", panel.snapshot()!.model === lastModel);
  }
  for (const action of ["undo", "redo"] as const) {
    app.querySelector<HTMLButtonElement>(`#body-${action}`)!.click();
    await settle();
    TestValidator.equals("history restores saved shape and goals", panel.snapshot()!.document, valid.document);
  }
  app.querySelector<HTMLButtonElement>("#body-reset")!.click();
  await settle();
  TestValidator.equals("reset returns to initial document", panel.snapshot()!.document, initial);
};

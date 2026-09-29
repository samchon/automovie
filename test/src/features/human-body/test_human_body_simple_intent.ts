import { type IAutoMovieHumanBodySimpleShape } from "@automovie/human";
import { renderBodySimpleControls } from "@automovie/playground/src/human/bodySimpleControls";
import { createBodyIntentGate } from "@automovie/playground/src/human/createBodyIntentGate";
import { TestValidator } from "@nestia/e2e";
import { JSDOM } from "jsdom";

const deferred = <T>() => {
  let fulfill!: (value: T) => void;
  let fail!: (reason: Error) => void;
  const promise = new Promise<T>((resolve, reject) => {
    fulfill = resolve;
    fail = reject;
  });
  return { promise, resolve: fulfill, reject: fail };
};

/**
 * Simple body expansion shares the panel's intent order with shape, pose,
 * history, and load. Projection observes only the detailed rest shape and
 * protects typed fields while filling the other inputs.
 *
 * Scenarios:
 * 1. A newer pose edit retires old expansion success and failure without changing shape.
 * 2. A later typed edit retires the expansion launched by an earlier Apply;
 *    two Apply clicks commit only the last result.
 * 3. A changed shape retires an expansion even without a new ticket.
 * 4. A newer non-shape intent keeps a valid projection and shares a pending
 *    request; typed input preserves its field while other fields fill. A
 *    newer shape retires the old projection, and obsolete errors stay silent.
 * 5. A pose-only commit keeps a typed simple draft and reuses its exact rest
 *    shape reading; a changed shape still asks the worker to read again.
 */
export const test_human_body_simple_intent = async (): Promise<void> => {
  const dom = new JSDOM("<!doctype html><main id='app'></main>").window
    .document;
  const container = dom.querySelector<HTMLElement>("#app")!;
  const gate = createBodyIntentGate();
  const simple: IAutoMovieHumanBodySimpleShape = {
    sex: 0,
    ageYears: 30,
    statureMetres: 1.7,
    massKilograms: 70,
    muscle: 0,
  };
  let shape: Record<string, number> = {};
  let projected = () => Promise.resolve(simple);
  let projectionRequests = 0;
  let expansion = () => Promise.resolve<Record<string, number>>({ waist: 1 });
  let applied = 0;
  let appliedTicket = 0;
  const refusals: string[] = [];
  let draftChanged = 0;
  const controls = renderBodySimpleControls({
    dom,
    container,
    expand: () => expansion(),
    project: () => {
      projectionRequests++;
      return projected();
    },
    current: () => shape,
    reserveIntent: gate.reserve,
    currentIntent: gate.currentTicket,
    isCurrentIntent: gate.isCurrent,
    onApply: (next, ticket) => {
      appliedTicket = ticket;
      shape = next;
      applied++;
    },
    onRefuse: (error) => refusals.push(String(error)),
    onBusy: () => {},
    onDraftChanged: () => { draftChanged++; },
  });
  const apply = dom.querySelector<HTMLButtonElement>("#simple-apply")!;
  const input = dom.querySelector<HTMLInputElement>("#simple-ageYears")!;
  await controls.refresh(shape);
  TestValidator.equals("projection filled the input", input.value, "30");

  const oldSuccess = deferred<Record<string, number>>();
  expansion = () => oldSuccess.promise;
  apply.click();
  TestValidator.equals(
    "Apply reserves before the solve",
    gate.currentTicket(),
    1,
  );
  gate.reserve(); // a pose-only edit leaves the shape unchanged
  input.dispatchEvent(new dom.defaultView!.Event("input"));
  TestValidator.equals("old solve cannot rename a later edit's status", draftChanged, 0);
  oldSuccess.resolve({ waist: 1 });
  await Promise.resolve();
  TestValidator.equals("pose edit retires old expansion", applied, 0);
  TestValidator.equals("pose edit leaves shape unchanged", shape, {});

  const changedDraft = deferred<Record<string, number>>();
  expansion = () => changedDraft.promise;
  apply.click();
  input.value = "31";
  input.dispatchEvent(new dom.defaultView!.Event("input"));
  TestValidator.equals("typed draft clears current solve status", draftChanged, 1);
  changedDraft.resolve({ waist: 1 });
  await Promise.resolve();
  TestValidator.equals("typed input retires earlier Apply", applied, 0);

  const oldFailure = deferred<Record<string, number>>();
  expansion = () => oldFailure.promise;
  apply.click();
  gate.reserve(); // a later pose preset
  oldFailure.reject(new Error("stale expansion"));
  await Promise.resolve();
  TestValidator.equals("pose edit retires old failure", refusals, []);

  const first = deferred<Record<string, number>>();
  const second = deferred<Record<string, number>>();
  expansion = () => first.promise;
  apply.click();
  expansion = () => second.promise;
  apply.click();
  second.resolve({ waist: 2 });
  await Promise.resolve();
  first.resolve({ waist: 1 });
  await Promise.resolve();
  TestValidator.equals("last Apply wins", shape, { waist: 2 });
  TestValidator.equals("only last Apply commits", applied, 1);
  await controls.refresh(shape); // the panel reads each newly committed rest shape

  expansion = () => Promise.resolve({ waist: 3 });
  apply.click();
  await Promise.resolve();
  TestValidator.equals("sole Apply commits", shape, { waist: 3 });
  await controls.refresh(shape);
  TestValidator.predicate(
    "Apply carries its reserved ticket",
    gate.isCurrent(appliedTicket),
  );
  expansion = () => Promise.reject(new Error("unreachable girth"));
  apply.click();
  await Promise.resolve();
  TestValidator.equals("sole failure preserves shape", shape, { waist: 3 });
  TestValidator.equals("sole failure reports", refusals, [
    "Error: unreachable girth",
  ]);

  const changedShape = deferred<Record<string, number>>();
  expansion = () => changedShape.promise;
  apply.click();
  shape = { waist: 4 }; // a caller-side change without a ticket
  changedShape.resolve({ waist: 5 });
  await Promise.resolve();
  TestValidator.equals("changed shape prevents stale Apply", shape, {
    waist: 4,
  });
  await controls.refresh(shape);

  const changedShapeFailure = deferred<Record<string, number>>();
  expansion = () => changedShapeFailure.promise;
  apply.click();
  shape = { waist: 4, hips: 1 }; // a changed key population is also stale
  changedShapeFailure.reject(new Error("obsolete girth"));
  await Promise.resolve();
  TestValidator.equals("changed shape suppresses old failure", refusals, [
    "Error: unreachable girth",
  ]);

  const staleProjection = deferred<IAutoMovieHumanBodySimpleShape>();
  projected = () => staleProjection.promise;
  const beforePending = projectionRequests;
  const staleRefresh = controls.refresh(shape);
  const samePending = controls.refresh(shape);
  gate.reserve(); // explicit contact reading, same detailed shape
  staleProjection.resolve({ ...simple, ageYears: 50 });
  await Promise.all([staleRefresh, samePending]);
  TestValidator.equals(
    "non-shape intent keeps a correct rest projection",
    input.value,
    "50",
  );
  TestValidator.equals("same pending shape has one worker request", projectionRequests, beforePending + 1);

  const staleProjectionFailure = deferred<IAutoMovieHumanBodySimpleShape>();
  projected = () => staleProjectionFailure.promise;
  shape = { ...shape, chest: 1 };
  const staleFailureRefresh = controls.refresh(shape);
  gate.reserve();
  staleProjectionFailure.reject(new Error("stale projection"));
  await staleFailureRefresh;
  TestValidator.equals(
    "newer intent keeps old projection error out",
    refusals,
    ["Error: unreachable girth"],
  );

  const typedProjection = deferred<IAutoMovieHumanBodySimpleShape>();
  projected = () => typedProjection.promise;
  const typedRefresh = controls.refresh(shape);
  input.value = "42";
  input.dispatchEvent(new dom.defaultView!.Event("input"));
  typedProjection.resolve({ ...simple, ageYears: 50, statureMetres: 1.8 });
  await typedRefresh;
  TestValidator.equals(
    "typed value survives old projection",
    input.value,
    "42",
  );
  TestValidator.equals(
    "other simple fields fill while age remains typed",
    dom.querySelector<HTMLInputElement>("#simple-statureMetres")!.value,
    "180",
  );

  const typedProjectionFailure = deferred<IAutoMovieHumanBodySimpleShape>();
  projected = () => typedProjectionFailure.promise;
  shape = { ...shape, chest: 2 };
  const typedFailureRefresh = controls.refresh(shape);
  input.dispatchEvent(new dom.defaultView!.Event("input"));
  typedProjectionFailure.reject(new Error("obsolete projection"));
  await typedFailureRefresh;
  TestValidator.equals(
    "typed input suppresses old projection error",
    refusals,
    ["Error: unreachable girth"],
  );

  projected = () => Promise.resolve({ ...simple, ageYears: 45 });
  await controls.refresh(shape);
  TestValidator.equals("retry preserves a typed age", input.value, "42");
  const oldShapeProjection = deferred<IAutoMovieHumanBodySimpleShape>();
  projected = () => oldShapeProjection.promise;
  shape = { ...shape, chest: 3 };
  const obsolete = controls.refresh(shape);
  const newShapeProjection = deferred<IAutoMovieHumanBodySimpleShape>();
  projected = () => newShapeProjection.promise;
  shape = { ...shape, chest: 4 };
  const newest = controls.refresh(shape);
  oldShapeProjection.resolve({ ...simple, ageYears: 60 });
  await obsolete;
  TestValidator.equals("superseded shape leaves current field", input.value, "42");
  newShapeProjection.resolve({ ...simple, ageYears: 55 });
  await newest;
  TestValidator.equals("new shape projection wins", input.value, "55");
  const acceptedShape = { ...shape };
  const undoProjection = deferred<IAutoMovieHumanBodySimpleShape>();
  projected = () => undoProjection.promise;
  shape = { ...shape, chest: 5 };
  const undone = controls.refresh(shape);
  input.value = "48";
  input.dispatchEvent(new dom.defaultView!.Event("input"));
  shape = acceptedShape;
  await controls.refresh(shape);
  TestValidator.equals("undo restores the prior shape reading", input.value, "55");
  undoProjection.resolve({ ...simple, ageYears: 60 });
  await undone;
  TestValidator.equals("obsolete shape cannot replace the undo reading", input.value, "55");
  shape = { ...shape, hips: 2 };
  projected = () => Promise.reject(new Error("current projection failed"));
  await controls.refresh(shape);
  TestValidator.equals("current projection failure reports", refusals, [
    "Error: unreachable girth",
    "Error: current projection failed",
  ]);

  shape = acceptedShape;
  await controls.refresh(shape); // history restores the accepted body first
  input.value = "46";
  input.dispatchEvent(new dom.defaultView!.Event("input"));
  const beforePose = projectionRequests;
  gate.reserve(); // a pose-only commit keeps the measured rest shape
  await controls.refresh(shape);
  TestValidator.equals(
    "pose does not reread identical rest shape",
    projectionRequests,
    beforePose,
  );
  TestValidator.equals(
    "pose preserves the unfinished simple input",
    input.value,
    "46",
  );
};

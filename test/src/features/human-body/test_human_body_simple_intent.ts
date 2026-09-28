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
 * history, and load. Projection also observes that order before touching inputs.
 *
 * Scenarios:
 * 1. A newer pose edit retires old expansion success and failure without changing shape.
 * 2. Two Apply clicks commit only the last result; a sole success and failure settle.
 * 3. A changed shape retires an expansion even without a new ticket.
 * 4. Newer intent or typed input retires projection success and failure.
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
  let expansion = () => Promise.resolve<Record<string, number>>({ waist: 1 });
  let applied = 0;
  let appliedTicket = 0;
  const refusals: string[] = [];
  const controls = renderBodySimpleControls({
    dom,
    container,
    expand: () => expansion(),
    project: () => projected(),
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
  oldSuccess.resolve({ waist: 1 });
  await Promise.resolve();
  TestValidator.equals("pose edit retires old expansion", applied, 0);
  TestValidator.equals("pose edit leaves shape unchanged", shape, {});

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

  expansion = () => Promise.resolve({ waist: 3 });
  apply.click();
  await Promise.resolve();
  TestValidator.equals("sole Apply commits", shape, { waist: 3 });
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
  const staleRefresh = controls.refresh(shape);
  gate.reserve();
  staleProjection.resolve({ ...simple, ageYears: 50 });
  await staleRefresh;
  TestValidator.equals(
    "newer intent keeps old projected input out",
    input.value,
    "30",
  );

  const staleProjectionFailure = deferred<IAutoMovieHumanBodySimpleShape>();
  projected = () => staleProjectionFailure.promise;
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
  typedProjection.resolve({ ...simple, ageYears: 50 });
  await typedRefresh;
  TestValidator.equals(
    "typed value survives old projection",
    input.value,
    "42",
  );

  const typedProjectionFailure = deferred<IAutoMovieHumanBodySimpleShape>();
  projected = () => typedProjectionFailure.promise;
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
  TestValidator.equals("current projection updates input", input.value, "45");
  projected = () => Promise.reject(new Error("current projection failed"));
  await controls.refresh(shape);
  TestValidator.equals("current projection failure reports", refusals, [
    "Error: unreachable girth",
    "Error: current projection failed",
  ]);
};

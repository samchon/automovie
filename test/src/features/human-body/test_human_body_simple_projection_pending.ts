import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";
import { renderBodySimpleControls } from "@automovie/playground/src/human/body/bodySimpleControls";
import { createBodyIntentGate } from "@automovie/playground/src/human/body/createBodyIntentGate";
import { TestValidator } from "@nestia/e2e";
import { JSDOM } from "jsdom";

import { nclose } from "../internal/predicates";

/**
 * A pending rest-shape reading must not lend old exact values to a new body.
 *
 * Scenarios:
 * 1. An untouched required field refuses Apply until the current shape has
 *    been read, even while an older body's number remains visible.
 * 2. A user who types all required anatomical values can apply directly
 *    while the worker still projects the current body; the old result cannot
 *    overwrite those typed inputs after that edit changes shape.
 */
export const test_human_body_simple_projection_pending =
  async (): Promise<void> => {
    const dom = new JSDOM("<!doctype html><main id='app'></main>").window
      .document;
    const gate = createBodyIntentGate();
    let shape: Record<string, number> = {};
    const simple: IAutoMovieHumanBodySimpleShape = {
      sex: 0,
      ageYears: 30,
      statureMetres: 1.7,
      massKilograms: 70,
      muscle: 0,
    };
    let project: () => Promise<IAutoMovieHumanBodySimpleShape> = async () =>
      simple;
    let resolvePending!: (value: IAutoMovieHumanBodySimpleShape) => void;
    const calls: IAutoMovieHumanBodySimpleShape[] = [];
    const refusals: string[] = [];
    const controls = renderBodySimpleControls({
      dom,
      container: dom.querySelector<HTMLElement>("#app")!,
      project: () => project(),
      expand: async (values) => {
        calls.push(values);
        return { waist: (shape.waist ?? 0) + 1 };
      },
      current: () => shape,
      reserveIntent: gate.reserve,
      currentIntent: gate.currentTicket,
      isCurrentIntent: gate.isCurrent,
      onApply: (next) => {
        shape = next;
      },
      onRefuse: (error) => {
        refusals.push(String(error));
      },
      onBusy: () => {},
      onDraftChanged: () => {},
    });
    const input = (key: string) =>
      dom.querySelector<HTMLInputElement>("#simple-" + key)!;
    const apply = dom.querySelector<HTMLButtonElement>("#simple-apply")!;
    await controls.refresh(shape);
    shape = { waist: 1 };
    project = () =>
      new Promise((resolve) => {
        resolvePending = resolve;
      });
    const reading = controls.refresh(shape);
    TestValidator.equals(
      "old age remains visible while next shape is read",
      input("ageYears").value,
      "30",
    );
    apply.click();
    await Promise.resolve();
    TestValidator.equals(
      "pending body does not reuse old required values",
      calls.length,
      0,
    );
    TestValidator.predicate(
      "pending body explains the refusal",
      refusals[0]?.includes("has not been read from the current body yet.") ===
        true,
    );
    resolvePending({ ...simple, ageYears: 35 });
    await reading;
    TestValidator.equals(
      "current projection fills age",
      input("ageYears").value,
      "35",
    );
    apply.click();
    await Promise.resolve();
    TestValidator.equals("Apply works after current reading", calls.length, 1);

    shape = { waist: 3 };
    project = () =>
      new Promise((resolve) => {
        resolvePending = resolve;
      });
    const pendingDirect = controls.refresh(shape);
    for (const [key, value] of [
      ["sex", "-1"],
      ["ageYears", "40"],
      ["statureMetres", "172"],
      ["massKilograms", "70"],
      ["muscle", "1"],
    ]) {
      input(key).value = value;
      input(key).dispatchEvent(new dom.defaultView!.Event("input"));
    }
    apply.click();
    await Promise.resolve();
    TestValidator.equals(
      "typed identity forms a body without waiting",
      [
        calls[1].sex,
        calls[1].ageYears,
        calls[1].massKilograms,
        calls[1].muscle,
      ],
      [-1, 40, 70, 1],
    );
    TestValidator.predicate(
      "typed centimetres reach metres",
      nclose(calls[1].statureMetres, 1.72),
    );
    resolvePending({ ...simple, ageYears: 55 });
    await pendingDirect;
    TestValidator.equals(
      "superseded projection preserves typed age",
      input("ageYears").value,
      "40",
    );
  };

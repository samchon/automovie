import { HUMAN_BODY_EXTERIOR_TARGETS } from "@automovie/human/body/anatomy/surface/HUMAN_BODY_EXTERIOR_TARGETS";
import { HUMAN_BODY_MEASUREMENTS } from "@automovie/human/body/constants/HUMAN_BODY_MEASUREMENTS";
import type { IAutoMovieHumanBodyBasis } from "@automovie/human";

import type { IConnectedBodyExteriorTargetsProps } from "./IConnectedBodyExteriorTargetsProps";
import { createConnectedDisabledRow } from "./createConnectedDisabledRow";
import { readConnectedBodyAnatomyTarget } from "./readConnectedBodyAnatomyTarget";
import { writeConnectedBodyAnatomyTarget } from "./writeConnectedBodyAnatomyTarget";

/**
 * Render one row per anatomical surface target the body can answer (`HUMAN_BODY_EXTERIOR_TARGETS`), labelled by its request path, such as `surface.rightUpperLimb.upperArm.midUpperArmGirth`.
 *
 * Millimetre targets are stored in metres at their authored anatomy request paths. Human owns the side-bound channel inverse and its rest-skin rule; this row shows only the stated document target and supplied protocol qualification, with no independent achieved readback. Blank clears the target. Missing evaluable channels receive disabled rows. The shared person consumer can publish a labelled refused construction draft, while cleanup refusal can follow publication; parent state identifies accepted history and recovery. Uncommitted text remains parent-owned across redraw.
 *
 * @evidence contracts/common.md#principled-implementation Authored catalogue paths bind metre targets to supported channels, millimetre entry crosses that unit boundary once, and current tickets gate successful text-draft clearing and transaction reports.
 * @evidence contracts/common.md#clear-and-simple-design The renderer owns target text and conversion, shared path helpers own leaf editing, Human owns anatomy inversion, and the parent owns document admission and persistent draft text.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing solving channels receive disabled rows, nonfinite entry refuses, and stated targets do not claim clinical observation or overwrite last-valid state after a failed build.
 * @evidence contracts/common.md#meaningful-documentation The comment explains metre storage, side-bound solving, clearing, source protocol departures, unavailable channels, refusal and parent-owned unfinished text.
 * @evidence contracts/performance.md#efficient-algorithms One c-channel id set avoids rescanning channels for each of t target rows; filtering and constant set lookup cost O(c+t) plus path text, and a mounted rows retain O(a) DOM while each Apply clones and admits its current document through the shared path editor and builder.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The renderer reuses parent-owned text drafts across redraw but coordinates no numerical cache; each Apply reserves a distinct intent and the transaction owns any model reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Rows and listeners remain parent-container-owned until replacement or close, path drafts remain parent-owned until successful current clearing or owner teardown, and worker or GPU requests belong to the transaction.
 */
export function renderConnectedBodyExteriorTargets(
  props: IConnectedBodyExteriorTargetsProps,
): void {
  const mm: (metres: number) => string = (metres: number): string => (metres * 1000).toFixed(1) + " mm";
  const channels: Set<string> = new Set(props.basis.channels.map((channel: IAutoMovieHumanBodyBasis["channels"][number]): string => channel.id));
  for (const target of HUMAN_BODY_EXTERIOR_TARGETS) {
    if (!target.path.toLowerCase().includes(props.query)) continue;
    const kind: string = Object.hasOwn(HUMAN_BODY_MEASUREMENTS, target.rule)
      ? HUMAN_BODY_MEASUREMENTS[target.rule].kind
      : "measurement";
    if (!channels.has(target.channel)) {
      props.container.append(
        createConnectedDisabledRow(
          props.dom,
          target.path,
          `Its solving channel ${target.channel} cannot be evaluated on this generation.`,
        ),
      );
      continue;
    }
    const row: HTMLDivElement = props.dom.createElement("div");
    const label: HTMLLabelElement = props.dom.createElement("label");
    const entry: HTMLDivElement = props.dom.createElement("div");
    const number: HTMLInputElement = props.dom.createElement("input");
    const apply: HTMLButtonElement = props.dom.createElement("button");
    const note: HTMLElement = props.dom.createElement("small");
    row.className = "row";
    label.textContent = `${target.path} (${kind}, mm)`;
    number.id = "body-target-" + target.path.replace(/\./gu, "-");
    number.type = "number";
    number.step = "0.1";
    number.placeholder = "Target mm";
    const stated: number | undefined = readConnectedBodyAnatomyTarget(props.current(), target.path);
    number.value =
      props.drafts.get(target.path) ??
      (stated === undefined ? "" : (stated * 1000).toFixed(1));
    number.oninput = (): void => { props.drafts.set(target.path, number.value); };
    label.htmlFor = number.id;
    apply.type = "button";
    apply.textContent = "Set or clear";
    apply.onclick = async (): Promise<void> => {
      props.drafts.set(target.path, number.value);
      const ticket: number = props.reserve();
      const requested: string = number.value.trim();
      if (requested !== "" && !Number.isFinite(Number(requested))) {
        props.refuse(
          `${target.path}: a finite measurement in millimetres, or an empty entry to clear it, is required.`,
        );
        return;
      }
      const metres: number | undefined = requested === "" ? undefined : Number(requested) / 1000;
      props.busy(`Building the body with ${target.path}…`);
      try {
        const success: boolean = await props.change(
          writeConnectedBodyAnatomyTarget(props.current(), target.path, metres),
          ticket,
        );
        if (success && props.isCurrent(ticket)) {
          props.drafts.delete(target.path);
          props.report(
            metres === undefined
              ? `${target.path}: cleared.`
              : `${target.path}: ${mm(metres)} stated in the displayed document; binding channel ${target.channel}.`,
          );
        }
      } catch (error) {
        if (props.isCurrent(ticket))
          props.refuse(
            `${target.path}: ${error instanceof Error ? error.message : String(error)}`,
          );
      }
    };
    entry.append(number, apply);
    note.textContent = `${target.protocol} Solved along ${target.channel}; read by ${target.rule}${target.side === undefined ? "" : " on the " + target.side}.`;
    row.append(label, entry, note);
    props.container.append(row);
  }
}

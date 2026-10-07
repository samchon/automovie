import { HUMAN_BODY_EXTERIOR_TARGETS } from "@automovie/human/body/anatomy/surface/HUMAN_BODY_EXTERIOR_TARGETS";
import { HUMAN_BODY_MEASUREMENTS } from "@automovie/human/body/constants/HUMAN_BODY_MEASUREMENTS";

import type { IConnectedBodyExteriorTargetsProps } from "./IConnectedBodyExteriorTargetsProps";
import { createConnectedDisabledRow } from "./createConnectedDisabledRow";
import { readConnectedBodyAnatomyTarget } from "./readConnectedBodyAnatomyTarget";
import { writeConnectedBodyAnatomyTarget } from "./writeConnectedBodyAnatomyTarget";

/**
 * Render one row per anatomical surface target the body can answer
 * (`HUMAN_BODY_EXTERIOR_TARGETS`), labelled by its request path, such as
 * `surface.rightUpperLimb.upperArm.midUpperArmGirth`.
 *
 * The row is the anatomical name of a measurement, not a morph slider: a
 * target in millimetres is written to the body document's `anatomy` at its
 * request path (`writeConnectedBodyAnatomyTarget`), the document's only
 * record of it, and the builder solves the binding's channel so the
 * binding's rule, oriented to its side, reads the target on the rest skin;
 * the right arm's girth moves only the right arm. An empty entry clears the
 * target. The row shows the document's stated value, and the binding's
 * protocol sentence states how the instrument departs from the survey
 * definition. A binding whose channel the generation cannot evaluate is
 * listed disabled with that channel named; a target the builder cannot meet
 * is refused with the path named and the last committed person stays. The
 * parent owns uncommitted text by path so a redraw cannot erase a value being
 * typed.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Offers each anatomical surface target as a measured control in millimetres on the body the editor commits.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Labels each row by its request path, states its protocol, lists an unevaluable binding disabled and keeps the committed body on refusal.
 * @author Samchon
 */
export function renderConnectedBodyExteriorTargets(
  props: IConnectedBodyExteriorTargetsProps,
): void {
  const mm = (metres: number): string => (metres * 1000).toFixed(1) + " mm";
  for (const target of HUMAN_BODY_EXTERIOR_TARGETS) {
    if (!target.path.toLowerCase().includes(props.query)) continue;
    const kind = Object.hasOwn(HUMAN_BODY_MEASUREMENTS, target.rule)
      ? HUMAN_BODY_MEASUREMENTS[target.rule].kind
      : "measurement";
    if (
      !props.basis.channels.some((channel) => channel.id === target.channel)
    ) {
      props.container.append(
        createConnectedDisabledRow(
          props.dom,
          target.path,
          `Its solving channel ${target.channel} cannot be evaluated on this generation.`,
        ),
      );
      continue;
    }
    const row = props.dom.createElement("div");
    const label = props.dom.createElement("label");
    const entry = props.dom.createElement("div");
    const number = props.dom.createElement("input");
    const apply = props.dom.createElement("button");
    const note = props.dom.createElement("small");
    row.className = "row";
    label.textContent = `${target.path} (${kind}, mm)`;
    number.id = "body-target-" + target.path.replace(/\./gu, "-");
    number.type = "number";
    number.step = "0.1";
    number.placeholder = "Target mm";
    const stated = readConnectedBodyAnatomyTarget(props.current(), target.path);
    number.value =
      props.drafts.get(target.path) ??
      (stated === undefined ? "" : (stated * 1000).toFixed(1));
    number.oninput = () => props.drafts.set(target.path, number.value);
    label.htmlFor = number.id;
    apply.type = "button";
    apply.textContent = "Set or clear";
    apply.onclick = async (): Promise<void> => {
      props.drafts.set(target.path, number.value);
      const ticket = props.reserve();
      const requested = number.value.trim();
      if (requested !== "" && !Number.isFinite(Number(requested))) {
        props.refuse(
          `${target.path}: a finite measurement in millimetres, or an empty entry to clear it, is required.`,
        );
        return;
      }
      const metres = requested === "" ? undefined : Number(requested) / 1000;
      props.busy(`Building the body with ${target.path}…`);
      try {
        const success = await props.change(
          writeConnectedBodyAnatomyTarget(props.current(), target.path, metres),
          ticket,
        );
        if (success && props.isCurrent(ticket)) {
          props.drafts.delete(target.path);
          props.report(
            metres === undefined
              ? `${target.path}: cleared.`
              : `${target.path}: ${mm(metres)} stated in the document and solved along ${target.channel}.`,
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

import type { IAutoMovieHumanBodyToePose } from "@automovie/human";
import { HUMAN_BODY_TOE_RANGE } from "@automovie/human/body/constants/HUMAN_BODY_TOE_RANGE";

import type { IBodyToeRayControlsProps } from "./IBodyToeRayControlsProps";

/**
 * Toe ray phalanx controls for one foot, under its humanoid toes bone.
 *
 * A basis that declares toe rays gets one flexion input per phalanx of the
 * selected side, and a splay input at each proximal phalanx, bounded by
 * `HUMAN_BODY_TOE_RANGE` (a stated convention). Each value is relative to
 * the bone the phalanx hangs from and composes on the toes bone's rotation;
 * ray flexion is positive toward the sole, the toes bone's is the opposite.
 * An emptied input removes that phalanx's row, so the document only keeps
 * phalanges the author moved. A basis without rays shows a named gap instead.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Lets an author pose each toe ray phalanx in clinical degrees.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Bounds each phalanx input by the admitted convention range and states it.
 * @author Samchon
 */
export function renderBodyToeRayControls(props: IBodyToeRayControlsProps): void {
  const { dom, container, basis, side } = props;
  const heading = dom.createElement("h3");
  heading.textContent = "Toe rays (relative to the toes bone)";
  container.append(heading);
  const rays = basis.toeRays?.filter((ray) => ray.bone.startsWith(side)) ?? [];
  if (rays.length === 0) {
    const gap = dom.createElement("small");
    gap.textContent = "This basis declares no toe rays: the toes move as one bone (#2711).";
    container.append(gap);
    return;
  }
  const note = dom.createElement("small");
  note.textContent = "Ranges are a stated convention without a clinical source yet: flexion is positive toward the sole (the toes bone above uses the source's opposite sign); proximal −70° to 45°, interphalangeal 0° to 60°, proximal splay −10° to 10°.";
  container.append(note);
  for (const ray of rays) {
    const proximal = ray.parent === "leftToes" || ray.parent === "rightToes";
    const axes: ("flexion" | "abduction")[] = proximal ? ["flexion", "abduction"] : ["flexion"];
    for (const axis of axes) {
      const range =
        axis === "abduction"
          ? HUMAN_BODY_TOE_RANGE.proximal.abduction
          : proximal
            ? HUMAN_BODY_TOE_RANGE.proximal.flexion
            : HUMAN_BODY_TOE_RANGE.interphalangeal.flexion;
      const row = dom.createElement("div");
      row.className = "row";
      const label = dom.createElement("label");
      const input = dom.createElement("input");
      input.type = "number";
      input.id = `toe-${ray.bone}-${axis}`;
      input.min = String(range[0]);
      input.max = String(range[1]);
      input.step = "1";
      label.htmlFor = input.id;
      label.textContent = `${ray.bone} ${axis} (°)`;
      const current = props.toes().find((one) => one.bone === ray.bone);
      const value = axis === "flexion" ? current?.flexion : current?.abduction;
      input.value = value === undefined ? "" : String(value);
      input.placeholder = "rest";
      input.onchange = () => {
        const text = input.value.trim();
        const rows = props.toes().filter((one) => one.bone !== ray.bone);
        const before = props.toes().find((one) => one.bone === ray.bone);
        const flexion = axis === "flexion" ? (text === "" ? undefined : Number(text)) : before?.flexion;
        const abduction = axis === "abduction" ? (text === "" ? undefined : Number(text)) : before?.abduction;
        if (flexion !== undefined || abduction !== undefined) {
          const next: IAutoMovieHumanBodyToePose = { bone: ray.bone, flexion: flexion ?? 0 };
          if (abduction !== undefined) next.abduction = abduction;
          rows.push(next);
        }
        props.onChange(rows);
      };
      const small = dom.createElement("small");
      small.textContent = `${range[0]}° to ${range[1]}°`;
      row.append(label, input, small);
      container.append(row);
    }
  }
}

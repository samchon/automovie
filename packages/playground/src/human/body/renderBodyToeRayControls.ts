import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyToePose,
} from "@automovie/human";
import { HUMAN_BODY_TOE_RANGE } from "@automovie/human/body/constants/HUMAN_BODY_TOE_RANGE";

import type { IBodyToeRayControlsProps } from "./IBodyToeRayControlsProps";

/**
 * Toe ray phalanx controls for one foot, under its humanoid toes bone.
 *
 * A basis that declares toe rays gets one flexion input per phalanx of the selected side, and a splay input at each proximal phalanx, bounded by `HUMAN_BODY_TOE_RANGE` (a stated convention). Each value is relative to the bone the phalanx hangs from and composes on the toes bone's rotation; ray flexion is positive toward the sole, the toes bone's is the opposite. An emptied coordinate removes that value; a row remains while its other coordinate is authored, with zero flexion required for a splay-only row. A basis without rays shows a named gap instead. DOM bounds guide entry; the parent builder owns final finite-value and range admission.
 *
 * @evidence contracts/common.md#principled-implementation Source rays select the foot and parent-relative axes, conventional degree bounds guide the inputs, and each event reads latest sparse rows before replacing one phalanx while preserving its other coordinate.
 * @evidence contracts/common.md#clear-and-simple-design The renderer owns toe input conversion and sparse row assembly while the parent owns complete document admission, history and numerical rig composition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing rays display a gap, conventional limits are not presented as clinical capacity, and number input bounds do not substitute for builder admission of nonfinite or out-of-range authored values.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies parent-relative degrees and sign, conventional limits, empty-coordinate and splay-only row behavior, missing-source gaps and admission ownership.
 * @evidence contracts/performance.md#efficient-algorithms Mount filters r source rays and scans t authored toe rows for each of at most two axes per selected ray in O(r+rt) time with O(r) DOM and filtered references; each edit scans t rows to preserve neighboring phalanges.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This renderer shares no resolved rig or numerical reading; latest authored rows are deliberately reread at event time to preserve edits after paint.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The parent container retains at most two inputs and listeners per selected ray until redraw or close; no independent numerical request, worker or GPU handle is acquired.
 */
export function renderBodyToeRayControls(
  props: IBodyToeRayControlsProps,
): void {
  const dom: Document = props.dom;
  const container: HTMLElement = props.container;
  const basis: IAutoMovieHumanBodyBasis = props.basis;
  const side: IBodyToeRayControlsProps["side"] = props.side;
  const heading: HTMLHeadingElement = dom.createElement("h3");
  heading.textContent = "Toe rays (relative to the toes bone)";
  container.append(heading);
  const rays: NonNullable<IAutoMovieHumanBodyBasis["toeRays"]> =
    basis.toeRays?.filter(
      (
        ray: NonNullable<IAutoMovieHumanBodyBasis["toeRays"]>[number],
      ): boolean => ray.bone.startsWith(side),
    ) ?? [];
  if (rays.length === 0) {
    const gap: HTMLElement = dom.createElement("small");
    gap.textContent =
      "This basis declares no toe rays: the toes move as one bone (#2711).";
    container.append(gap);
    return;
  }
  const note: HTMLElement = dom.createElement("small");
  note.textContent =
    "Ranges are a stated convention without a clinical source yet: flexion is positive toward the sole (the toes bone above uses the source's opposite sign); proximal −70° to 45°, interphalangeal 0° to 60°, proximal splay −10° to 10°.";
  container.append(note);
  for (const ray of rays) {
    const proximal: boolean =
      ray.parent === "leftToes" || ray.parent === "rightToes";
    const axes: ("flexion" | "abduction")[] = proximal
      ? ["flexion", "abduction"]
      : ["flexion"];
    for (const axis of axes) {
      const range: readonly [number, number] =
        axis === "abduction"
          ? HUMAN_BODY_TOE_RANGE.proximal.abduction
          : proximal
            ? HUMAN_BODY_TOE_RANGE.proximal.flexion
            : HUMAN_BODY_TOE_RANGE.interphalangeal.flexion;
      const row: HTMLDivElement = dom.createElement("div");
      row.className = "row";
      const label: HTMLLabelElement = dom.createElement("label");
      const input: HTMLInputElement = dom.createElement("input");
      input.type = "number";
      input.id = `toe-${ray.bone}-${axis}`;
      input.min = String(range[0]);
      input.max = String(range[1]);
      input.step = "1";
      label.htmlFor = input.id;
      label.textContent = `${ray.bone} ${axis} (°)`;
      const current: IAutoMovieHumanBodyToePose | undefined = props
        .toes()
        .find(
          (one: IAutoMovieHumanBodyToePose): boolean => one.bone === ray.bone,
        );
      const value: number | undefined =
        axis === "flexion" ? current?.flexion : current?.abduction;
      input.value = value === undefined ? "" : String(value);
      input.placeholder = "rest";
      input.onchange = (): void => {
        const text: string = input.value.trim();
        const rows: IAutoMovieHumanBodyToePose[] = props
          .toes()
          .filter(
            (one: IAutoMovieHumanBodyToePose): boolean => one.bone !== ray.bone,
          );
        const before: IAutoMovieHumanBodyToePose | undefined = props
          .toes()
          .find(
            (one: IAutoMovieHumanBodyToePose): boolean => one.bone === ray.bone,
          );
        const flexion: number | undefined =
          axis === "flexion"
            ? text === ""
              ? undefined
              : Number(text)
            : before?.flexion;
        const abduction: number | undefined =
          axis === "abduction"
            ? text === ""
              ? undefined
              : Number(text)
            : before?.abduction;
        if (flexion !== undefined || abduction !== undefined) {
          const next: IAutoMovieHumanBodyToePose = {
            bone: ray.bone,
            flexion: flexion ?? 0,
          };
          if (abduction !== undefined) next.abduction = abduction;
          rows.push(next);
        }
        props.onChange(rows);
      };
      const small: HTMLElement = dom.createElement("small");
      small.textContent = `${range[0]}° to ${range[1]}°`;
      row.append(label, input, small);
      container.append(row);
    }
  }
}

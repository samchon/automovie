import type { IAutoMovieHumanPose } from "../../../human/src/structures/pose/IAutoMovieHumanPose";
import type { HumanStickmanController } from "./HumanStickmanController";

/** Attach explicit gaze/jaw and whole-character placement inputs to the existing page.
 *
 * @evidence contracts/common.md#principled-implementation Head controls call the existing public setPose in clinical degrees/millimetres; root controls change only the facade's actual position, Euler rotation or scale, which its existing binding refresh consumes.
 * @evidence contracts/common.md#clear-and-simple-design Owns bounded DOM controls only; the Human evaluator owns ROM and the facade owns pose/FK/time.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejects nonfinite input and singular root scale rather than moving anatomical points or adding a second evaluator.
 * @evidence contracts/common.md#meaningful-documentation Labels distinguish clinical degrees, jaw millimetres, root metres/degrees and dimensionless scale; head edits stop playback through setPose.
 * @evidence contracts/performance.md#efficient-algorithms Sixteen fixed numeric controls read scalar state; geometry and body preparation never run in update.
 * @evidence contracts/performance.md#reuse-equivalent-work The same controls observe the existing controller and refresh after UI or public API changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned disposer removes owned nodes and listeners; no clock, renderer or retained pose snapshot is acquired.
 */
export function attachHumanMannequinPoseControls(
  bar: HTMLElement | null,
  controller: HumanStickmanController,
  changed: () => void,
): { update: () => void; dispose: () => void } {
  let current: HumanStickmanController.IState = controller.state;
  const fields: {
    input: HTMLInputElement;
    label: HTMLLabelElement;
    read: () => number;
    listener: () => void;
  }[] = [];

  /** One numeric editor delegates meaning and admission to its existing owner. */
  function add(
    label: string,
    read: () => number,
    write: (value: number) => void,
  ): void {
    const wrapper: HTMLLabelElement = document.createElement("label");
    wrapper.textContent = label;
    const input: HTMLInputElement = document.createElement("input");
    input.type = "number";
    input.step = "any";
    input.style.width = "58px";
    input.setAttribute("aria-label", label);
    const listener: () => void = (): void => {
      try {
        const value: number = input.valueAsNumber;
        if (!Number.isFinite(value))
          throw new Error("유한한 수치를 입력하세요");
        write(value);
        input.setCustomValidity("");
        changed();
      } catch (error: unknown) {
        input.setCustomValidity(
          error instanceof Error ? error.message : String(error),
        );
        input.reportValidity();
      }
    };
    input.addEventListener("change", listener);
    wrapper.appendChild(input);
    bar?.appendChild(wrapper);
    fields.push({ input, label: wrapper, read, listener });
  }
  for (const side of ["left", "right"] as const)
    for (const axis of ["horizontal", "vertical"] as const)
      add(
        `${side === "left" ? "왼눈" : "오른눈"} ${axis === "horizontal" ? "좌우" : "상하"}°`,
        (): number => current.pose.head?.eyes?.[side]?.[axis] ?? 0,
        (value: number): void => {
          const pose: IAutoMovieHumanPose = controller.state.pose;
          controller.setPose({
            ...pose,
            head: {
              ...pose.head,
              eyes: {
                left: pose.head?.eyes?.left ?? {},
                right: pose.head?.eyes?.right ?? {},
                [side]: { ...pose.head?.eyes?.[side], [axis]: value },
              },
            },
          });
        },
      );
  for (const key of ["opening", "protrusion", "lateralExcursion"] as const)
    add(
      `턱 ${{ opening: "열림", protrusion: "전진", lateralExcursion: "좌우" }[key]} mm`,
      (): number => current.pose.head?.jaw?.[key] ?? 0,
      (value: number): void => {
        const pose: IAutoMovieHumanPose = controller.state.pose;
        controller.setPose({
          ...pose,
          head: { ...pose.head, jaw: { ...pose.head?.jaw, [key]: value } },
        });
      },
    );
  for (const kind of ["position", "rotation", "scale"] as const)
    for (const axis of ["x", "y", "z"] as const)
      add(
        `전체 ${{ position: "위치", rotation: "회전", scale: "크기" }[kind]} ${axis}${kind === "position" ? " m" : kind === "rotation" ? "°" : ""}`,
        (): number =>
          controller.object[kind][axis] *
          (kind === "rotation" ? 180 / Math.PI : 1),
        (value: number): void => {
          if (kind === "scale" && value === 0)
            throw new Error("전체 크기는 0일 수 없습니다");
          controller.object[kind][axis] =
            value * (kind === "rotation" ? Math.PI / 180 : 1);
        },
      );
  return {
    update: (): void => {
      current = controller.state;
      for (const field of fields)
        if (document.activeElement !== field.input)
          field.input.value = String(field.read());
    },
    dispose: (): void => {
      for (const field of fields) {
        field.input.removeEventListener("change", field.listener);
        field.label.remove();
      }
      fields.length = 0;
    },
  };
}

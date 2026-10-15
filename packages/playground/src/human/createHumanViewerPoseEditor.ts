import { IAutoMovieHumanPose } from "@automovie/human";
import {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieBone,
  IAutoMovieSkeleton,
} from "@automovie/interface";

/** Axes of one pose joint, in document order. */
const AXES: readonly ("flexion" | "abduction" | "twist")[] = [
  "flexion",
  "abduction",
  "twist",
];

/**
 * Build the editor of a pose document: one row per listed joint with a slider per clinical axis, and a picker that lists a further bone of the person's skeleton.
 *
 * Each slider spans the bone's declared range for that axis on the person's skeleton, or -180 to 180 degrees where the skeleton declares none, so the reachable values are offered first; the typed number beside it accepts any value, so an out-of-range angle can still be proposed and the caller shows the admission error. A change passes a fresh pose to `onChange` without admitting it, and removing a row drops that joint, returning it to rest.
 *
 * @param props Skeleton whose bones and ranges are offered, current pose and change callback
 * @returns A detached element holding the editor
 *
 * @evidence contracts/common.md#principled-implementation Rows mirror the document's joints and slider bounds read the skeleton's own constraints, the ranges admission enforces.
 * @evidence contracts/common.md#clear-and-simple-design The editor proposes candidates; admission and posing stay with the page and the package.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Values are not clamped to the slider range, so a refused angle reaches admission and its error rather than being silently changed.
 * @evidence contracts/common.md#meaningful-documentation States slider bounds, the unbounded number entry, removal meaning and the admission boundary.
 * @evidence contracts/performance.md#efficient-algorithms Builds one row per listed joint and one option per unlisted bone; a lookup map makes each row's range constant time.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The editor is rebuilt from each accepted pose; nothing is shared between builds.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Inputs and listeners belong to the returned element and are released with it.
 */
export function createHumanViewerPoseEditor(props: {
  skeleton: IAutoMovieSkeleton;
  pose: IAutoMovieHumanPose;
  onChange: (candidate: IAutoMovieHumanPose) => void;
}): HTMLElement {
  const root: HTMLDivElement = document.createElement("div");
  root.className = "pose-editor";
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieBone> = new Map(
    props.skeleton.bones.map(
      (bone: IAutoMovieBone): [AutoMovieHumanoidBone, IAutoMovieBone] => [
        bone.bone,
        bone,
      ],
    ),
  );
  const emit: (joints: IAutoMovieHumanPose.IJoint[]) => void = (
    joints: IAutoMovieHumanPose.IJoint[],
  ): void => props.onChange({ version: props.pose.version, joints });

  props.pose.joints.forEach(
    (joint: IAutoMovieHumanPose.IJoint, index: number): void => {
      const row: HTMLFieldSetElement = document.createElement("fieldset");
      const legend: HTMLLegendElement = document.createElement("legend");
      legend.textContent = joint.bone;
      const remove: HTMLButtonElement = document.createElement("button");
      remove.type = "button";
      remove.textContent = "rest";
      remove.title = "Remove this joint, returning it to rest";
      remove.addEventListener("click", (): void =>
        emit(
          props.pose.joints.filter(
            (_j: IAutoMovieHumanPose.IJoint, i: number): boolean => i !== index,
          ),
        ),
      );
      legend.appendChild(remove);
      row.appendChild(legend);
      for (const axis of AXES) {
        const range: IAutoMovieAngleRange | null =
          bones.get(joint.bone)?.constraint?.[axis] ?? null;
        const label: HTMLLabelElement = document.createElement("label");
        label.className = "field";
        const name: HTMLSpanElement = document.createElement("span");
        name.textContent =
          range === null
            ? axis
            : `${axis} [${+range.min.toFixed(1)}, ${+range.max.toFixed(1)}]`;
        const slider: HTMLInputElement = document.createElement("input");
        slider.type = "range";
        slider.min = String(range?.min ?? -180);
        slider.max = String(range?.max ?? 180);
        slider.step = "0.5";
        slider.value = String(joint[axis]);
        slider.disabled = range !== null && range.min === range.max;
        const number: HTMLInputElement = document.createElement("input");
        number.type = "number";
        number.step = "any";
        number.value = String(joint[axis]);
        const commit: (value: number) => void = (value: number): void =>
          emit(
            props.pose.joints.map(
              (
                j: IAutoMovieHumanPose.IJoint,
                i: number,
              ): IAutoMovieHumanPose.IJoint =>
                i === index ? { ...j, [axis]: value } : j,
            ),
          );
        slider.addEventListener("input", (): void => {
          number.value = slider.value;
        });
        slider.addEventListener("change", (): void =>
          commit(Number(slider.value)),
        );
        number.addEventListener("change", (): void =>
          commit(Number(number.value)),
        );
        label.append(name, slider, number);
        row.appendChild(label);
      }
      root.appendChild(row);
    },
  );

  const listed: Set<string> = new Set(
    props.pose.joints.map((j: IAutoMovieHumanPose.IJoint): string => j.bone),
  );
  const add: HTMLSelectElement = document.createElement("select");
  add.add(new Option("+ articulate a joint", ""));
  for (const bone of props.skeleton.bones)
    if (bone.parent !== null && !listed.has(bone.bone))
      add.add(new Option(bone.bone, bone.bone));
  add.addEventListener("change", (): void => {
    if (add.value === "") return;
    emit([
      ...props.pose.joints,
      {
        bone: add.value as AutoMovieHumanoidBone,
        flexion: 0,
        abduction: 0,
        twist: 0,
      },
    ]);
  });
  root.appendChild(add);
  return root;
}

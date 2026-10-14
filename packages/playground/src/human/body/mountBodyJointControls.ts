import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanBodyShoulderPose,
  IAutoMovieHumanBodyToePose,
} from "@automovie/human";
import { resolveHumanBodyCouplings } from "@automovie/human/body/basis/resolveHumanBodyCouplings";
import { resolveHumanBodyDocumentPose } from "@automovie/human/body/basis/resolveHumanBodyDocumentPose";
import { resolveHumanBodyShapeShoulderRest } from "@automovie/human/body/basis/resolveHumanBodyShapeShoulderRest";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
} from "@automovie/interface";

import type { IBodyJointControlsProps } from "./IBodyJointControlsProps";
import { renderBodyAtlasInspectionControls } from "./renderBodyAtlasInspectionControls";
import { renderBodyGroundPlacementControl } from "./renderBodyGroundPlacementControl";
import { renderBodyPoseControls } from "./renderBodyPoseControls";
import { renderBodyShoulderControls } from "./renderBodyShoulderControls";
import { renderBodyToeRayControls } from "./renderBodyToeRayControls";

/**
 * Bind the body's joint picker and its current document's numerical controls.
 *
 * Shape-only rest comes from the builder's shared owner on every paint and shoulder event. An invalid pending shape withdraws that event through the panel's existing refusal owner; no stale rest or partially authored goal is substituted. The panel still owns draft, history and model publication. Generic joint rows read that draft through the builder's rig-only pose resolver, so the three clinical coordinates follow its actual post-pelvis parent frames. A range refusal uses the same transaction refusal path. Ranges describe admission of this source rig and establish no clinical bone frame or measured personal motion capacity.
 *
 * @evidence contracts/common.md#principled-implementation The builder's shared shape-rest and document-pose resolvers provide the loaded rig frames, and event-time getters preserve newer draft edits before emitting replacement authored coordinates.
 * @evidence contracts/common.md#clear-and-simple-design This mount selects the joint and delegates shoulder, pose and toe rows to their renderers; the parent keeps refusal, document transactions and publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A rest or document-pose refusal stops row construction, and a missing upper-arm shoulder declaration refuses instead of substituting a generic joint frame.
 * @evidence contracts/common.md#meaningful-documentation The comment assigns draft and publication ownership, distinguishes current shape rest from stale painted data and identifies rig admission rather than clinical range evidence.
 * @evidence contracts/performance.md#efficient-algorithms Picker construction scans j joints and checks p pose and s shoulder rows per admitted option in O(j(p+s)) time; shared rest, pose and coupling resolvers supply their numerical costs, and selected-row DOM scales with the rig's authored controls.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The mount coordinates no numerical request cache; current rest is resolved at each edit because pending shape changes can invalidate the painted frame.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The container owns the picker, selected rows and event listeners until replacement or parent close; this mount borrows basis and draft data and acquires no worker or GPU handle.
 */
export function mountBodyJointControls(props: IBodyJointControlsProps): void {
  const dom: Document = props.dom;
  const container: HTMLElement = props.container;
  const basis: IAutoMovieHumanBodyBasis = props.basis;
  const draft: IAutoMovieHumanBodyBasisDocument = props.current();
  renderBodyGroundPlacementControl(props);
  renderBodyAtlasInspectionControls(props);
  let bone: AutoMovieHumanoidBone = props.bone;
  const rest: () =>
    | ReturnType<typeof resolveHumanBodyShapeShoulderRest>
    | undefined = ():
    | ReturnType<typeof resolveHumanBodyShapeShoulderRest>
    | undefined => {
    try {
      return resolveHumanBodyShapeShoulderRest(basis, props.current().shape);
    } catch (error) {
      props.refuse(error);
      return undefined;
    }
  };
  const picker: HTMLSelectElement = dom.createElement("select");
  picker.id = "pose-bone";
  picker.setAttribute("aria-label", "Joint");
  for (const joint of basis.joints)
    if (joint.bone.toLowerCase().includes(props.query)) {
      const option: HTMLOptionElement = dom.createElement("option");
      option.value = joint.bone;
      option.textContent =
        joint.bone +
        (draft.pose?.some(
          (one: IAutoMovieJointPose): boolean => one.bone === joint.bone,
        ) ||
        draft.shoulders?.some(
          (one: IAutoMovieHumanBodyShoulderPose): boolean =>
            one.bone === joint.bone,
        )
          ? " ●"
          : "");
      picker.append(option);
    }
  picker.value = bone;
  if (picker.value !== bone && picker.options.length > 0) {
    bone = picker.options[0].value as AutoMovieHumanoidBone;
    picker.value = bone;
    props.select(bone);
  }
  picker.onchange = (): void => {
    props.select(picker.value as AutoMovieHumanoidBone);
    props.redraw();
  };
  const rows: HTMLDivElement = dom.createElement("div");
  container.append(picker, rows);
  const shapedRest: ReturnType<typeof rest> = rest();
  if (shapedRest === undefined) return;
  let clinical: ReturnType<typeof resolveHumanBodyDocumentPose>;
  try {
    clinical = resolveHumanBodyDocumentPose(basis, draft);
  } catch (error) {
    props.refuse(error);
    return;
  }
  if (bone === "leftUpperArm" || bone === "rightUpperArm") {
    const shoulderBone: IAutoMovieHumanBodyShoulderPose["bone"] = bone;
    const joint: IAutoMovieHumanBodyBasis["joints"][number] = basis.joints.find(
      (one: IAutoMovieHumanBodyBasis["joints"][number]): boolean =>
        one.bone === bone,
    )!;
    if (joint.shoulder === undefined) {
      props.refuse(
        new Error("An upper arm needs thorax-relative shoulder coordinates."),
      );
      return;
    }
    renderBodyShoulderControls({
      dom,
      container: rows,
      bone,
      shoulder: joint.shoulder,
      rest: shapedRest.get(bone)!,
      currentRest: (): IAutoMovieHumanBodyShoulderPose | undefined =>
        rest()?.get(shoulderBone),
      shoulders: draft.shoulders ?? [],
      currentShoulders: (): readonly IAutoMovieHumanBodyShoulderPose[] =>
        props.current().shoulders ?? [],
      onChange: (shoulders: IAutoMovieHumanBodyShoulderPose[]): void => {
        props.change({ ...structuredClone(props.current()), shoulders });
      },
    });
    return;
  }
  renderBodyPoseControls({
    dom,
    container: rows,
    basis,
    bone,
    pose: draft.pose ?? [],
    currentPose: (): readonly IAutoMovieJointPose[] =>
      props.current().pose ?? [],
    clinical,
    coupled: resolveHumanBodyCouplings(
      basis,
      draft.pose ?? [],
      draft.shoulders ?? [],
      shapedRest,
    ).contributions,
    onChange: (pose: IAutoMovieJointPose[]): void => {
      props.change({ ...structuredClone(props.current()), pose });
    },
  });
  // the toe rays hang from the toes bone, so they are posed under it
  if (bone === "leftToes" || bone === "rightToes")
    renderBodyToeRayControls({
      dom,
      container: rows,
      basis,
      side: bone === "leftToes" ? "left" : "right",
      toes: (): readonly IAutoMovieHumanBodyToePose[] =>
        props.current().toes ?? [],
      onChange: (toes: IAutoMovieHumanBodyToePose[]): void => {
        const next: IAutoMovieHumanBodyBasisDocument = {
          ...structuredClone(props.current()),
        };
        if (toes.length === 0) delete next.toes;
        else next.toes = toes;
        props.change(next);
      },
    });
}

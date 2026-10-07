import { resolveHumanBodyCouplings } from "@automovie/human/body/basis/resolveHumanBodyCouplings";
import { resolveHumanBodyDocumentPose } from "@automovie/human/body/basis/resolveHumanBodyDocumentPose";
import { resolveHumanBodyShapeShoulderRest } from "@automovie/human/body/basis/resolveHumanBodyShapeShoulderRest";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IBodyJointControlsProps } from "./IBodyJointControlsProps";
import { renderBodyPoseControls } from "./bodyPoseControls";
import { renderBodyShoulderControls } from "./bodyShoulderControls";
import { renderBodyAtlasInspectionControls } from "./renderBodyAtlasInspectionControls";
import { renderBodyGroundPlacementControl } from "./renderBodyGroundPlacementControl";
import { renderBodyToeRayControls } from "./renderBodyToeRayControls";

/**
 * Bind the body's joint picker and its current document's numerical controls.
 *
 * Shape-only rest comes from the builder's shared owner on every paint and
 * shoulder event. An invalid pending shape withdraws that event through the
 * panel's existing refusal owner; no stale rest or partially authored goal is
 * substituted. The panel still owns draft, history and model publication.
 * Generic joint rows read that draft through the builder's rig-only pose
 * resolver, so the three clinical coordinates follow its actual post-pelvis
 * parent frames. A range refusal uses the same transaction refusal path.
 * Ranges describe admission of this source rig and establish no clinical bone
 * frame or measured personal motion capacity.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Binds named joint inputs to the latest body draft and returns unsupported pending shapes to the panel's transaction refusal.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Displays the current shape's TT rest and the same coupling additions the builder consumes, while keeping bone selection outside the document.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Leaves draft publication and last-valid recovery with the injected panel refusal and change owners.
 */
export function mountBodyJointControls(props: IBodyJointControlsProps): void {
  const { dom, container, basis } = props;
  const draft = props.current();
  renderBodyGroundPlacementControl(props);
  renderBodyAtlasInspectionControls(props);
  let bone = props.bone;
  const rest = () => {
    try {
      return resolveHumanBodyShapeShoulderRest(basis, props.current().shape);
    } catch (error) {
      props.refuse(error);
      return undefined;
    }
  };
  const picker = dom.createElement("select");
  picker.id = "pose-bone";
  picker.setAttribute("aria-label", "Joint");
  for (const joint of basis.joints)
    if (joint.bone.toLowerCase().includes(props.query)) {
      const option = dom.createElement("option");
      option.value = joint.bone;
      option.textContent =
        joint.bone +
        (draft.pose?.some((one) => one.bone === joint.bone) ||
        draft.shoulders?.some((one) => one.bone === joint.bone)
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
  picker.onchange = () => {
    props.select(picker.value as AutoMovieHumanoidBone);
    props.redraw();
  };
  const rows = dom.createElement("div");
  container.append(picker, rows);
  const shapedRest = rest();
  if (shapedRest === undefined) return;
  let clinical;
  try {
    clinical = resolveHumanBodyDocumentPose(basis, draft);
  } catch (error) {
    props.refuse(error);
    return;
  }
  if (bone === "leftUpperArm" || bone === "rightUpperArm") {
    const shoulderBone = bone;
    const joint = basis.joints.find((one) => one.bone === bone)!;
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
      currentRest: () => rest()?.get(shoulderBone),
      shoulders: draft.shoulders ?? [],
      currentShoulders: () => props.current().shoulders ?? [],
      onChange: (shoulders) => {
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
    currentPose: () => props.current().pose ?? [],
    clinical,
    coupled: resolveHumanBodyCouplings(
      basis,
      draft.pose ?? [],
      draft.shoulders ?? [],
      shapedRest,
    ).contributions,
    onChange: (pose) => {
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
      toes: () => props.current().toes ?? [],
      onChange: (toes) => {
        const next = { ...structuredClone(props.current()) };
        if (toes.length === 0) delete next.toes;
        else next.toes = toes;
        props.change(next);
      },
    });
}

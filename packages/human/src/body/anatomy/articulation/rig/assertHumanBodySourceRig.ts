import type { IAutoMovieHumanBodyBoneWorldRest } from "../../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";
import type { IAutoMovieHumanBodySourceRig } from "./IAutoMovieHumanBodySourceRig";
import { readHumanBodySourceProfile } from "./readHumanBodySourceProfile";

/** Admit a common-neutral source graph before evaluating any motion or exposing a partial assembly. */
export function assertHumanBodySourceRig(
  rig: IAutoMovieHumanBodySourceRig,
): void {
  if (rig.generation.trim().length === 0 || rig.nodes.length === 0)
    throw new Error(
      "An anatomical source graph needs a generation and actual nodes.",
    );
  const bones = new Set<string>();
  const projections = new Set<string>();
  const toeProjections = new Set<string>();
  const frame = (
    one: IAutoMovieHumanBodyBoneWorldRest,
    address: string,
  ): void => {
    const q = one.rotation;
    if (
      ![
        one.position.x,
        one.position.y,
        one.position.z,
        q.x,
        q.y,
        q.z,
        q.w,
      ].every(Number.isFinite) ||
      Math.abs(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w - 1) > 1e-6
    )
      throw new Error(
        "Anatomical source frame is not finite metres/unit rotation: " +
          address,
      );
  };
  const toeBases = new Set<string>();
  for (const base of rig.toeBases ?? []) {
    if (
      toeBases.has(base.side) ||
      base.goal.bone !== `${base.side}Toes` ||
      base.account.trim().length === 0 ||
      new Set(base.goal.supportedAxes).size !==
        base.goal.supportedAxes.length ||
      base.goal.supportedAxes.some(
        (one) => one !== "flexion" && one !== "abduction" && one !== "twist",
      )
    )
      throw new Error(
        "Source aggregate toe frame needs one named public goal account per foot: " +
          base.side,
      );
    if (
      !rig.nodes.some(
        (node) =>
          node.joint.kind === "toe-ray" && node.joint.base === base.side,
      )
    )
      throw new Error(
        "Source aggregate toe goal has no actual proximal phalanx consumer: " +
          base.side,
      );
    frame(base.rest, base.side + ".commonMtp");
    toeBases.add(base.side);
    projections.add(base.goal.bone);
  }
  for (const node of rig.nodes) {
    if (bones.has(node.id) || (node.parent !== null && !bones.has(node.parent)))
      throw new Error(
        "Anatomical source nodes need unique parent-before-child identities: " +
          node.id,
      );
    if (
      node.account.trim().length === 0 ||
      node.qualification.trim().length === 0
    )
      throw new Error(
        "Anatomical source node lacks its source account: " + node.id,
      );
    frame(node.rest, node.id);
    const sites = new Set<string>();
    for (const site of node.sites) {
      if (
        site.id.trim().length === 0 ||
        sites.has(site.id) ||
        ![site.position.x, site.position.y, site.position.z].every(
          Number.isFinite,
        ) ||
        site.account.trim().length === 0 ||
        site.qualification.trim().length === 0
      )
        throw new Error(
          "Anatomical source site lacks a unique finite local account: " +
            node.id +
            "." +
            site.id,
        );
      sites.add(site.id);
    }
    for (const projection of node.projections) {
      if (
        projections.has(projection.bone) ||
        (projection.site !== undefined && !sites.has(projection.site))
      )
        throw new Error(
          "Anatomical public projection is duplicated or lacks its source site: " +
            projection.bone,
        );
      frame(
        { position: node.rest.position, rotation: projection.rotation },
        projection.bone,
      );
      projections.add(projection.bone);
    }
    for (const projection of node.toeProjections ?? []) {
      if (
        toeProjections.has(projection.bone) ||
        (projection.site !== undefined && !sites.has(projection.site))
      )
        throw new Error(
          "Anatomical toe projection is duplicated or lacks its source site: " +
            projection.bone,
        );
      frame(
        { position: node.rest.position, rotation: projection.rotation },
        projection.bone,
      );
      toeProjections.add(projection.bone);
    }
    if (node.joint.kind === "public-pose") {
      const joint = node.joint;
      if (
        new Set(joint.supportedAxes).size !== joint.supportedAxes.length ||
        joint.supportedAxes.some(
          (one) => one !== "flexion" && one !== "abduction" && one !== "twist",
        )
      )
        throw new Error(
          "Anatomical public pose needs unique supported named axes: " +
            node.id,
        );
      const reference =
        joint.reference ??
        node.projections.find((one) => one.bone === joint.bone);
      if (
        reference === undefined ||
        reference.bone !== joint.bone ||
        (reference.site !== undefined && !sites.has(reference.site))
      )
        throw new Error(
          "Anatomical public pose requires its same-node clinical conversion reference: " +
            node.id,
        );
      frame(
        { position: node.rest.position, rotation: reference.rotation },
        node.id + ".clinicalReference",
      );
      const output = node.projections.find((one) => one.bone === joint.bone);
      if (
        output !== undefined &&
        joint.reference !== undefined &&
        (output.site !== reference.site ||
          Math.abs(
            Math.abs(
              output.rotation.x * reference.rotation.x +
                output.rotation.y * reference.rotation.y +
                output.rotation.z * reference.rotation.z +
                output.rotation.w * reference.rotation.w,
            ) - 1,
          ) > 1e-6)
      )
        throw new Error(
          "Anatomical public output and input conversion disagree on their shared frame: " +
            node.id,
        );
      if ((joint.localAxes === undefined) !== (joint.localFrame === undefined))
        throw new Error(
          "Anatomical local alternatives need both their source axes and source frame: " +
            node.id,
        );
      if (joint.localFrame !== undefined)
        frame(joint.localFrame, node.id + ".localJoint");
    }
    if (
      node.joint.kind === "axes" ||
      node.joint.kind === "humerothoracic" ||
      node.joint.kind === "toe-ray"
    )
      frame(node.joint.frame, node.id + ".joint");
    if (node.joint.kind === "toe-ray") {
      const joint = node.joint;
      const base = rig.toeBases?.find((one) => one.side === joint.base);
      if (base === undefined || !bones.has(base.parent) || node.parent === null)
        throw new Error(
          "Source proximal toe needs its preceding actual foot and common MTP account: " +
            node.id,
        );
    }
    if (node.joint.kind === "humerothoracic" && !bones.has(node.joint.thorax))
      throw new Error(
        "Anatomical TT joint needs its previously resolved thorax: " + node.id,
      );
    const jointAxes =
      node.joint.kind === "axes" || node.joint.kind === "toe-ray"
        ? node.joint.axes
        : node.joint.kind === "humerothoracic" ||
            node.joint.kind === "public-pose"
          ? node.joint.localAxes
          : undefined;
    if (jointAxes !== undefined) {
      const axes = new Set<string>();
      for (const axis of jointAxes) {
        if (
          (node.joint.kind === "humerothoracic" ||
            node.joint.kind === "public-pose") &&
          axis.driver.kind !== "anatomical"
        )
          throw new Error(
            "Anatomical local alternatives need a distinct internal authority: " +
              node.id,
          );
        if (
          node.joint.kind === "toe-ray" &&
          axis.driver.kind !== "public-toe" &&
          axis.driver.kind !== "anatomical"
        )
          throw new Error(
            "Source relative toe axes cannot duplicate their aggregate public authority: " +
              node.id,
          );
        const d = axis.direction;
        if (
          axes.has(axis.id) ||
          ![
            d.x,
            d.y,
            d.z,
            axis.neutral,
            ...axis.range,
            axis.driver.neutral,
          ].every(Number.isFinite) ||
          Math.abs(d.x * d.x + d.y * d.y + d.z * d.z - 1) > 1e-6 ||
          axis.range[0] > axis.range[1] ||
          axis.neutral < axis.range[0] ||
          axis.neutral > axis.range[1] ||
          axis.account.trim().length === 0 ||
          axis.qualification.trim().length === 0
        )
          throw new Error(
            "Anatomical source axis lacks a unique finite unit/range account: " +
              node.id +
              "." +
              axis.id,
          );
        axes.add(axis.id);
        if (
          axis.origin !== undefined &&
          ![axis.origin.x, axis.origin.y, axis.origin.z].every(Number.isFinite)
        )
          throw new Error(
            "Anatomical source axis pivot is not finite joint-local metres: " +
              node.id +
              "." +
              axis.id,
          );
        let previous = -Infinity;
        for (const knot of axis.profile ?? []) {
          if (
            !Number.isFinite(knot.input) ||
            !Number.isFinite(knot.output) ||
            knot.input <= previous ||
            knot.output < axis.range[0] ||
            knot.output > axis.range[1]
          )
            throw new Error(
              "Anatomical source profile is not ordered inside its supported range: " +
                node.id +
                "." +
                axis.id,
            );
          previous = knot.input;
        }
        if (
          readHumanBodySourceProfile(axis, axis.driver.neutral) !== axis.neutral
        )
          throw new Error(
            "Anatomical source driver neutral disagrees with its joint neutral: " +
              node.id +
              "." +
              axis.id,
          );
      }
    }
    bones.add(node.id);
  }
  const pelvis = rig.pelvicRhythm;
  if (
    pelvis !== undefined &&
    (new Set(pelvis.members).size !== pelvis.members.length ||
      !pelvis.members.includes(pelvis.pelvis) ||
      pelvis.members.some((bone) => !bones.has(bone)) ||
      pelvis.account.trim().length === 0)
  )
    throw new Error(
      "Anatomical pelvic rhythm needs an acquired, unique complete pelvic member account.",
    );
}

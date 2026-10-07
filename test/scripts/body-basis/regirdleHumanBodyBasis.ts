import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

import { bodyCorrectiveBasisDigest } from "./bodyCorrectiveBasisDigest";
import { reweightHumanBodyShoulderSkin } from "./reweightHumanBodyShoulderSkin";

/**
 * Construct a review candidate with the admitted basis's shoulder skin reweighted.
 * The actual sidecar command calls this pure producer. Joint-head landmarks
 * supply the two centres; no coordinate is invented or read from a photograph.
 * Unchanged geometry, rig, channels and target arrays remain borrowed read-only
 * data. Changed skins own their arrays and the input is never mutated.
 *
 * Every corrective target touching changed bindings is recorded for subsequent
 * verification. Its rows are retained, not declared valid under the new skin.
 * Input/output payload hashes identify data, not source code, biomechanics or
 * acceptable geometry. The caller admits the candidate and writes a new sidecar;
 * this function neither publishes nor overwrites an asset.
 *
 * @evidence contracts/common.md#principled-implementation The candidate changes only named skin bindings and its revision, records the exact input/output payloads and identifies every affected corrective target without hiding stale derivatives.
 * @evidence contracts/common.md#clear-and-simple-design The producer resolves two rig landmarks and delegates the one reweight formula to its existing owner, then records changes per surface.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No preset, photograph or side-specific coordinate bypasses the admitted rig; no inherited corrective is silently treated as regenerated.
 * @evidence contracts/common.md#meaningful-documentation Identifies the actual sidecar caller, borrowed geometry versus owned skin, unchanged rows and the remaining admission/geometry/provenance obligations.
 */
export function regirdleHumanBodyBasis(props: {
  input: IAutoMovieHumanBodyBasis;
  revision: string;
  expectedSha256: string;
  onsetDegrees: number;
  fullDegrees: number;
}) {
  const inputSha256 = bodyCorrectiveBasisDigest(props.input);
  if (inputSha256 !== props.expectedSha256)
    throw new Error("The sidecar input payload differs from its expected digest.");
  if (props.revision.length === 0 || props.revision === props.input.id)
    throw new Error("A sidecar needs a new nonempty basis revision.");
  const headOf = (bone: "leftUpperArm" | "rightUpperArm") => {
    const joint = props.input.joints.find((one) => one.bone === bone);
    if (joint === undefined) throw new Error("The rig has no joint " + bone + ".");
    const index = props.input.landmarks.ids.indexOf(joint.head);
    if (index < 0) throw new Error("The basis has no landmark " + joint.head + ".");
    const [x, y, z] = props.input.landmarks.positions.slice(3 * index, 3 * index + 3);
    return { x, y, z };
  };
  const centres = { leftUpperArm: headOf("leftUpperArm"), rightUpperArm: headOf("rightUpperArm") };
  const correctiveTargets = new Set((props.input.correctives ?? []).map((one) => one.target));
  const changes: { id: string; changed: number; correctiveRows: Record<string, number> }[] = [];
  const surfaces = props.input.surfaces.map((surface) => {
    const { skin, changed } = reweightHumanBodyShoulderSkin({
      positions: surface.positions, skin: surface.skin, centres,
      onsetDegrees: props.onsetDegrees, fullDegrees: props.fullDegrees,
    });
    const moved = new Set<number>();
    for (let v = 0; v < surface.positions.length / 3; ++v)
      for (let k = 0; k < 4; ++k)
        if (surface.skin.boneIndices[4 * v + k] !== skin.boneIndices[4 * v + k] || surface.skin.weights[4 * v + k] !== skin.weights[4 * v + k]) {
          moved.add(v);
          break;
        }
    const correctiveRows: Record<string, number> = {};
    for (const [name, rows] of Object.entries(surface.targets))
      if (correctiveTargets.has(name)) {
        let count = 0;
        for (let i = 0; i < rows.length; i += 4) if (moved.has(rows[i])) ++count;
        if (count !== 0) correctiveRows[name] = count;
      }
    changes.push({ id: surface.id, changed, correctiveRows });
    return { ...surface, skin };
  });
  const basis: IAutoMovieHumanBodyBasis = { ...props.input, id: props.revision, surfaces };
  return {
    basis,
    receipt: {
      basis: props.revision, supersedes: props.input.id,
      inputSha256, outputSha256: bodyCorrectiveBasisDigest(basis),
      onsetDegrees: props.onsetDegrees, fullDegrees: props.fullDegrees,
      status: "review-candidate" as const,
      surfaces: changes,
    },
  };
}

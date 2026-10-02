import { createAutoMovieSignedMeshQuery, validateModel } from "@automovie/engine";
import { type IAutoMovieHumanFaceBasis, type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceBasisBuilder } from "@automovie/human";
import { buildPortraitEyebrow } from "@automovie/human/face/anatomy/brow/buildPortraitEyebrow";
import type { IPortraitEyebrowProfile } from "@automovie/human/face/anatomy/brow/IPortraitEyebrowProfile";
import { createHumanFaceBasisPoseEvaluator } from "@automovie/human/face/basis/createHumanFaceBasisPoseEvaluator";
import { humanFaceBasisWeights } from "@automovie/human/face/basis/humanFaceBasisWeights";
import { createHash } from "node:crypto";
import type { IAutoMovieMesh } from "@automovie/interface";

import { certifyFaceBrowShaftClearance } from "./certifyFaceBrowShaftClearance";
import { faceBrowAttachmentFrame } from "./faceBrowAttachmentFrame";
import { faceBrowTubeStations } from "./faceBrowTubeStations";

/**
 * Prepare an explicit conventional brow probe through the connected face and
 * existing fibre consumers. This internal preparation record is derived source
 * data, not a new user channel for editing vertices or individual hairs.
 *
 * The connected pose owner supplies current resident positions, including its
 * actual contact refusals. A chart maps these metres to the fibre builder's
 * millimetres, then restores emitted metre buffers and normals to the head
 * frame. The caller supplies every placement/profile convention explicitly.
 * Carrier vertices never become follicles and no anatomical default is added.
 *
 * The raw host compiles as an open sheet: only its unsigned metric distance is
 * used. No collision cap, exterior registration, geometry correction or root
 * tissue-clearance rule is invented. A certificate applies to the enclosing
 * exposed-shaft balls, not to a biological follicle. The output model retains
 * the original face and adds the labelled probe; it replaces no default brow.
 *
 * Every invocation owns a new host/frame/query. Its derivative digest includes
 * the basis, full shape/expression state, evaluated host positions/topology and
 * attachment/binding/profile/count/finish/query budget of this probe.
 * A changed pose cannot inherit an old frame or certificate. Source objects are
 * copied, and the final composite takes the real engine model gate.
 */
export function prepareFaceBrowFibres(props: {
  basis: IAutoMovieHumanFaceBasis;
  document: IAutoMovieHumanFaceBasisDocument;
  host: string;
  attachment: Parameters<typeof faceBrowAttachmentFrame>[1];
  binding: { side: "left" | "right"; upper: number[]; lower: number[] };
  fibres: number;
  profile: IPortraitEyebrowProfile;
  finish: string;
  convention: string;
  maxQueries: number;
}) {
  if (props.document.basis !== props.basis.id)
    throw new Error("Brow preparation document must name its host basis.");
  if (props.convention.trim() === "")
    throw new Error("Brow preparation must identify its authored probe convention.");
  if (props.profile.representation !== undefined || props.profile.rootBand === undefined ||
      (props.profile.flow === undefined && props.profile.span === undefined) ||
      props.profile.endFade === undefined || props.profile.densitySeed === undefined)
    throw new Error("Brow preparation needs an explicit tube placement profile without implicit defaults.");
  const basis = structuredClone(props.basis), document = structuredClone(props.document);
  const surface = basis.surfaces.find((one) => one.id === props.host);
  if (surface === undefined)
    throw new Error("Brow preparation needs its named connected host surface.");
  const model = createHumanFaceBasisBuilder(basis)(document);
  const pose = createHumanFaceBasisPoseEvaluator(basis)(humanFaceBasisWeights(basis, document), document.shape);
  const positions = [...pose.positions.get(surface.id)!];
  const mesh = { positions, indices: [...surface.indices], normals: null, uvs: null, skin: null };
  const frame = faceBrowAttachmentFrame(mesh, props.attachment);
  const query = createAutoMovieSignedMeshQuery(mesh, { boundary: "open" });
  const skin = {
    positions: Array.from({ length: positions.length / 3 }, (_, vertex) => frame.intoMillimetres(positions.slice(3 * vertex, 3 * vertex + 3))),
    indices: [...surface.indices], groups: new Array(surface.indices.length / 3).fill(0),
  };
  const parts = buildPortraitEyebrow(skin, structuredClone(props.binding), props.fibres, props.profile).map((part) => {
    // This consumer's tube branch emits the shared metric mesh lattice.
    const original = (part.geometry as { type: "mesh"; mesh: IAutoMovieMesh }).mesh;
    const worldPositions = Array.from({ length: original.positions.length / 3 }, (_, vertex) => frame.outOfMetres(original.positions.slice(3 * vertex, 3 * vertex + 3))).flat();
    const normals = Array.from({ length: original.normals!.length / 3 }, (_, vertex) => frame.directionOut(original.normals!.slice(3 * vertex, 3 * vertex + 3))).flat();
    return { ...part, material: props.finish, geometry: { type: "mesh" as const, mesh: { ...original, positions: worldPositions, normals } } };
  });
  const certificates = parts.map((part) => ({ part: part.id,
    ...certifyFaceBrowShaftClearance({ stations: faceBrowTubeStations(part.geometry.mesh, props.profile.segments), query, maxQueries: props.maxQueries }) }));
  const composite = { ...model, parts: [...model.parts, ...parts] };
  const validation = validateModel({ model: composite });
  if (!validation.success)
    throw new Error(`Prepared brow probe violates the model gate: ${JSON.stringify(validation)}`);
  const derivative = createHash("sha256").update(JSON.stringify({ basis: basis.id, host: surface.id,
    shape: document.shape, expression: document.expression, positions, indices: surface.indices,
    attachment: props.attachment, binding: props.binding, profile: props.profile, fibres: props.fibres,
    finish: props.finish, maxQueries: props.maxQueries })).digest("hex");
  return { model: composite, parts, certificates, frame,
    provenance: { basis: basis.id, host: surface.id, derivative, convention: props.convention,
      rootDistribution: "explicit authored probe; no biological distribution inferred",
      contact: "unsigned surface separation only; exterior and follicle tissue unregistered" } };
}

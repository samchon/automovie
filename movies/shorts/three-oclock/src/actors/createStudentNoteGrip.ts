import { AutoMovieHumanClinicalIk, AutoMovieHumanRigControls, type AutoMovieHumanSkeleton, type IAutoMovieHumanHandPose, type IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import { createFinitePaperInspection } from "./createFinitePaperInspection";
import type { createHumanActor } from "./createHumanActor";
import { measurePaperContact } from "./measurePaperContact";
import { selectFingerPad } from "./selectFingerPad";

/** A genuine original distal palmar patch, away from either joint seam. */
type Pad = ReturnType<typeof selectFingerPad> & { bone: "rightIndexDistal" | "rightThumbDistal"; site: "palmar-pulp" };
/** One complete bounded preparation request, never repaired by moving its plane. */
type Native = { error: number; iterations: number; seed: IAutoMovieHumanPose; request: AutoMovieHumanClinicalIk.IRequest; pose: IAutoMovieHumanPose; constraintsSatisfied: boolean; targetRole: "stationary-hand"; constraintValues?: AutoMovieHumanClinicalIk.IResult["constraintValues"]; errorMessage?: string };
/** Every fixed rectangle retains its actual contact and complete original-skin result. */
type Attempt = { paperFrame: number[]; normalFamily: string; seedIndex: number; angle: number; corner: number; contact: ReturnType<typeof measurePaperContact>; normalDot: number; originalRom: boolean; physical: ReturnType<ReturnType<typeof createFinitePaperInspection>>; native?: Native; accepted: boolean };

/**
 * Prepare this actual student's short-edge pinch for the full-size finite note.
 *
 * @evidence contracts/common.md#implementation-and-ownership Harry retains his previously observed fixed distal-palmar pose and exact36-layout population. Carina uses two explicit straight-distal starts, index MCP60/80degrees, and at most two bounded public finger fits. A Hand-fixed plane is frozen before each fit; signed normal intervals place the pads0.5–1.5mm outside its2mm faces without imposing coincident tangential coordinates. Nine selected index/thumb channels allow mild PIP0–35/DIP0–15degree correction within original ROM. Direction cones aim past the physical0.25 threshold. The required stationary-Hand target has zero finger sensitivity: its native error is explicitly NOT finger-contact precision. Constraint feasibility and actual3mm finite-face/point, opposite normals, ROM and original-triangle/solid tests own admission. Twenty-four predefined angle/corner alternatives place the finite rectangle along the final tangential span, leaving the original plane/normal untouched even after failure. No anatomy, mesh, physical allowance or historical proof changes; no global grasp feasibility is claimed.
 * @evidence contracts/common.md#authoring-interface Supply the actual named actor and lower/upper short-edge role. The admitted hand, Hand-local frame and source witnesses belong only to this model. guideX is the actual finite positive face plus1mm, separately owned by the note geometry. Attempts retain all requests/failures and predefined rectangles; an explicitly unadmitted best diagnostic profile still permits collecting later failures, but may not acquire custody or pass preparation/export. outside tests original displayed skin against the finite paper, not a convex hand hull. Temporary note geometry/material is disposed; all model resources remain borrowed. Coarse grasp excludes force/friction and swept collision.
 */
export function createStudentNoteGrip(actor: ReturnType<typeof createHumanActor>, person: "carina" | "harry", edge: "lower" | "upper"): {
  admitted: boolean; hand: IAutoMovieHumanHandPose; frameInHand: THREE.Matrix4; guideX: number; anchor: { bone: "rightHand"; localPoint: [number, number, number] }; index: Pad; thumb: Pad; attempts: readonly Attempt[];
  worldFrame: () => THREE.Matrix4;
  place: (paper: THREE.Mesh, attachment?: THREE.Matrix4) => ReturnType<typeof measurePaperContact>;
  measure: (paper: THREE.Mesh) => ReturnType<typeof measurePaperContact>;
  outside: (paper: THREE.Mesh) => { certified: boolean; queryWork: number; intersections: number; containments: number; error?: string };
} {
  if (actor.object.name !== person) throw new Error("Grip identity differs from its actual actor");
  const at: (bone: string) => AutoMovieHumanSkeleton.IBone = (bone: string): AutoMovieHumanSkeleton.IBone => {
    const value: AutoMovieHumanSkeleton.IBone | undefined = actor.neutral.bones.find((row: AutoMovieHumanSkeleton.IBone): boolean => row.bone === bone);
    if (value === undefined) throw new Error("Missing actual grip bone:" + bone);
    return value;
  };
  const forward: THREE.Vector3 = new THREE.Vector3(...at("rightMiddleProximal").position).sub(new THREE.Vector3(...at("rightHand").position)).normalize();
  const radial: THREE.Vector3 = new THREE.Vector3(...at("rightIndexProximal").position).sub(new THREE.Vector3(...at("rightLittleProximal").position)).normalize();
  const palmar: THREE.Vector3 = radial.clone().cross(forward).negate().normalize();
  /** Read one anatomical patch from unchanged original triangles. */
  function pad(bone: Pad["bone"], fraction: number, degrees: number): Pad {
    const source: AutoMovieHumanSkeleton.IBone = at(bone);
    const mesh: THREE.Mesh | undefined = actor.drawing.parts.get(bone);
    const end: [number, number, number] | undefined = source.tip ?? actor.neutral.bones.find((row: AutoMovieHumanSkeleton.IBone): boolean => row.parent === bone)?.position;
    if (end === undefined || mesh === undefined) throw new Error("Missing actual finger end/skin:" + bone);
    return { ...selectFingerPad(mesh, new THREE.Vector3(...end).sub(new THREE.Vector3(...source.position)), palmar, fraction, degrees), bone, site: "palmar-pulp" };
  }
  const index: Pad = pad("rightIndexDistal", 0.83, 0);
  const thumb: Pad = pad("rightThumbDistal", 0.67, 45);
  const parts: { name: string; geometry: THREE.BufferGeometry }[] = [...actor.drawing.parts].filter((entry: [string, THREE.Mesh]): boolean => actor.rightHandParts.includes(entry[1])).map(([name, mesh]: [string, THREE.Mesh]): { name: string; geometry: THREE.BufferGeometry } => ({ name, geometry: mesh.geometry }));
  const inspect: ReturnType<typeof createFinitePaperInspection> = createFinitePaperInspection(parts);
  const box: THREE.BoxGeometry = new THREE.BoxGeometry(0.002, 0.15, 0.1);
  box.computeBoundingBox();
  const guideX: number = box.boundingBox!.max.x + 0.001;
  const sheet: THREE.Mesh = new THREE.Mesh(box);
  const attempts: Attempt[] = [];
  let chosen: { frame: THREE.Matrix4; handFrame: THREE.Matrix4; centre: THREE.Vector3; hand: IAutoMovieHumanHandPose; score: number; admitted: boolean } | undefined;

  /** Transform the actual material point and normal through one exact public FK. */
  function material(output: AutoMovieHumanSkeleton.IOutput, address: Pad): { point: THREE.Vector3; normal: THREE.Vector3 } {
    const row: AutoMovieHumanSkeleton.IPlacement = output.posed.find((entry: AutoMovieHumanSkeleton.IPlacement): boolean => entry.bone === address.bone)!;
    const matrix: THREE.Matrix4 = new THREE.Matrix4().compose(new THREE.Vector3(...row.position), new THREE.Quaternion(...row.rotation), new THREE.Vector3(1, 1, 1));
    return { point: address.point.clone().applyMatrix4(matrix), normal: address.normal.clone().transformDirection(matrix) };
  }
  /** The SDK's direction interval supplements, never replaces, physical normals. */
  function direction(address: Pad, axis: THREE.Vector3, sign: number): NonNullable<AutoMovieHumanClinicalIk.IRequest["constraints"]>[number] {
    const tangent: THREE.Vector3 = address.normal.clone().cross(Math.abs(address.normal.x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)).normalize();
    return { kind: "line-offset", point: { bone: address.bone, localPoint: address.point.clone().addScaledVector(address.normal, 0.01).toArray() as [number, number, number] },
      line: { origin: { bone: address.bone, localPoint: address.point.toArray() as [number, number, number] }, end: { bone: address.bone, localPoint: address.point.clone().addScaledVector(tangent, 0.01).toArray() as [number, number, number] } },
      normal: axis.toArray() as [number, number, number], ...(sign < 0 ? { maximum: -0.003 } : { minimum: 0.003 }) };
  }

  try {
    for (const [seedIndex, mcp] of (person === "carina" ? [60, 80] : [60]).entries()) {
      const hand: IAutoMovieHumanHandPose = {
        index: { mcpFlexion: mcp, mcpAbduction: 20, pipFlexion: 0, dipFlexion: 0 },
        thumb: { cmcFlexion: 0, cmcAbduction: 15, cmcOpposition: 45, mcpFlexion: 20, ipFlexion: 80 },
        middle: { mcpFlexion: 25, pipFlexion: 30, dipFlexion: 15 }, ring: { mcpFlexion: 25, pipFlexion: 30, dipFlexion: 15 }, little: { mcpFlexion: 25, pipFlexion: 30, dipFlexion: 15 },
      };
      const seed: IAutoMovieHumanPose = { arms: { left: {}, right: { hand } } };
      const initial: AutoMovieHumanSkeleton.IOutput = actor.evaluate(seed);
      const ia: ReturnType<typeof material> = material(initial, index);
      const ib: ReturnType<typeof material> = material(initial, thumb);
      const carrier: AutoMovieHumanSkeleton.IPlacement = initial.posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === "rightHand")!;
      const handFrame: THREE.Matrix4 = new THREE.Matrix4().compose(new THREE.Vector3(...carrier.position), new THREE.Quaternion(...carrier.rotation), new THREE.Vector3(1, 1, 1));
      const layouts: { frame: THREE.Matrix4; axis: THREE.Vector3; normalFamily: string; angle: number; corner: number }[] = [];
      let output: AutoMovieHumanSkeleton.IOutput = initial;
      let fittedHand: IAutoMovieHumanHandPose = hand;
      let native: Native | undefined;
      if (person === "carina") {
        const x: THREE.Vector3 = ib.normal.clone().sub(ia.normal).normalize();
        const centre: THREE.Vector3 = ia.point.clone().add(ib.point).multiplyScalar(0.5);
        const outward: THREE.Vector3 = centre.clone().sub(new THREE.Vector3(...carrier.position));
        outward.addScaledVector(x, -outward.dot(x)).normalize();
        const inverseHand: THREE.Matrix4 = handFrame.clone().invert();
        const line: NonNullable<AutoMovieHumanClinicalIk.IRequest["constraints"]>[number] & { kind: "line-offset" } = {
          kind: "line-offset", point: { bone: index.bone, localPoint: index.point.toArray() as [number, number, number] },
          line: { origin: { bone: "rightHand", localPoint: centre.clone().applyMatrix4(inverseHand).toArray() as [number, number, number] },
            end: { bone: "rightHand", localPoint: centre.clone().addScaledVector(outward, 0.01).applyMatrix4(inverseHand).toArray() as [number, number, number] } },
          normal: x.toArray() as [number, number, number], minimum: 0.0015, maximum: 0.0025,
        };
        const request: AutoMovieHumanClinicalIk.IRequest = {
          channels: [...AutoMovieHumanRigControls.chain({ region: "finger", side: "right", digit: "index" }), ...AutoMovieHumanRigControls.chain({ region: "finger", side: "right", digit: "thumb" })],
          targets: [{ bone: "rightHand", position: [...carrier.position] }],
          constraints: [line, { ...line, point: { bone: thumb.bone, localPoint: thumb.point.toArray() as [number, number, number] }, minimum: -0.0025, maximum: -0.0015 },
            direction(index, x, -1), direction(thumb, x, 1),
            { kind: "channel", channel: AutoMovieHumanRigControls.channel("arms.right.hand.index.pipFlexion"), minimum: 0, maximum: 35 },
            { kind: "channel", channel: AutoMovieHumanRigControls.channel("arms.right.hand.index.dipFlexion"), minimum: 0, maximum: 15 }], iterations: 16, tolerance: 0.001,
        };
        try {
          const fit: AutoMovieHumanClinicalIk.IResult = AutoMovieHumanClinicalIk.solve(actor.evaluate, seed, request);
          output = fit.output; fittedHand = fit.pose.arms!.right.hand!;
          native = { error: fit.error, iterations: fit.iterations, seed, request, pose: fit.pose, constraintsSatisfied: fit.constraintsSatisfied, targetRole: "stationary-hand", constraintValues: fit.constraintValues };
        } catch (error) { native = { error: Infinity, iterations: 0, seed, request, pose: seed, constraintsSatisfied: false, targetRole: "stationary-hand", errorMessage: error instanceof Error ? error.message : String(error) }; }

        // Only tangential placement follows the final pads; the requested plane
        // and its normal stay fixed, including when that request failed.
        const finalIndex: THREE.Vector3 = material(output, index).point.clone().sub(centre);
        const finalThumb: THREE.Vector3 = material(output, thumb).point.clone().sub(centre);
        for (const angle of [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]) for (const corner of [-1, 1]) {
          const y: THREE.Vector3 = outward.clone().applyAxisAngle(x, THREE.MathUtils.degToRad(angle)).multiplyScalar(edge === "lower" ? 1 : -1);
          const z: THREE.Vector3 = x.clone().cross(y).normalize();
          const along: number = edge === "lower" ? Math.min(finalIndex.dot(y), finalThumb.dot(y)) + 0.074 : Math.max(finalIndex.dot(y), finalThumb.dot(y)) - 0.074;
          const across: number = corner === -1 ? Math.min(finalIndex.dot(z), finalThumb.dot(z)) + 0.049 : Math.max(finalIndex.dot(z), finalThumb.dot(z)) - 0.049;
          const origin: THREE.Vector3 = centre.clone().addScaledVector(y, along).addScaledVector(z, across);
          layouts.push({ frame: new THREE.Matrix4().makeBasis(x, y, z).setPosition(origin), axis: x, normalFamily: "fixed-normal-plane-free-tangential-pads", angle, corner });
        }
      } else {
        const centre: THREE.Vector3 = ia.point.clone().add(ib.point).multiplyScalar(0.5);
        for (const [normalFamily, x] of [["opposed-source-normals", ib.normal.clone().sub(ia.normal).normalize()], ["material-gap", ia.point.clone().sub(ib.point).normalize()]] as const) {
          const outward: THREE.Vector3 = centre.clone().sub(new THREE.Vector3(...carrier.position));
          outward.addScaledVector(x, -outward.dot(x)).normalize();
          for (const angle of [0, -20, 20, -40, 40, -60, 60, -80, 80]) for (const corner of [-1, 1]) {
            const y: THREE.Vector3 = outward.clone().applyAxisAngle(x, THREE.MathUtils.degToRad(angle)).multiplyScalar(edge === "lower" ? 1 : -1);
            const z: THREE.Vector3 = x.clone().cross(y).normalize();
            const da: THREE.Vector3 = ia.point.clone().sub(centre); const db: THREE.Vector3 = ib.point.clone().sub(centre);
            const along: number = edge === "lower" ? Math.min(da.dot(y), db.dot(y)) + 0.075 : Math.max(da.dot(y), db.dot(y)) - 0.075;
            const across: number = corner === -1 ? Math.min(da.dot(z), db.dot(z)) + 0.05 : Math.max(da.dot(z), db.dot(z)) - 0.05;
            layouts.push({ frame: new THREE.Matrix4().makeBasis(x, y, z).setPosition(centre.clone().addScaledVector(y, along).addScaledVector(z, across)), axis: x, normalFamily, angle, corner });
          }
        }
      }
      const a: ReturnType<typeof material> = material(output, index);
      const b: ReturnType<typeof material> = material(output, thumb);
      const transforms: Map<string, THREE.Matrix4> = new Map(output.posed.map((row: AutoMovieHumanSkeleton.IPlacement): [string, THREE.Matrix4] => [row.bone, new THREE.Matrix4().compose(new THREE.Vector3(...row.position), new THREE.Quaternion(...row.rotation), new THREE.Vector3(1, 1, 1))]));
      for (const layout of layouts) {
        layout.frame.decompose(sheet.position, sheet.quaternion, sheet.scale); sheet.updateMatrixWorld(true);
        const contact: ReturnType<typeof measurePaperContact> = measurePaperContact(sheet, b.point, a.point, 0.003);
        const physical: ReturnType<typeof inspect> = inspect(box, layout.frame, transforms);
        const normalDot: number = a.normal.dot(b.normal);
        const originalRom: boolean = output.clamped.length === 0;
        const anatomical: boolean = [index, thumb].every((address: Pad): boolean => address.fraction >= 0.65 && address.fraction <= 0.85 && address.surfaceAgreement > 0.25);
        const nativeAdmitted: boolean = native === undefined || native.error <= 0.003 && native.constraintsSatisfied;
        const accepted: boolean = nativeAdmitted && contact.admitted && normalDot < -0.25 && a.normal.dot(layout.axis) < -0.25 && b.normal.dot(layout.axis) > 0.25 && originalRom && anatomical && physical.certified;
        attempts.push({ paperFrame: layout.frame.toArray(), normalFamily: layout.normalFamily, seedIndex, angle: layout.angle, corner: layout.corner, contact, normalDot, originalRom, physical, ...(native === undefined ? {} : { native }), accepted });
        const score: number = physical.intersections * 0.01 + physical.containments * 0.01 + physical.errors.length + contact.error + (contact.oppositeExteriorSides && contact.insideFiniteFaces && normalDot < -0.25 && a.normal.dot(layout.axis) < -0.25 && b.normal.dot(layout.axis) > 0.25 ? 0 : 1);
        if (chosen === undefined || accepted && !chosen.admitted || accepted === chosen.admitted && score < chosen.score) chosen = { frame: layout.frame.clone(), handFrame, centre: a.point.clone().add(b.point).multiplyScalar(0.5), hand: structuredClone(fittedHand), score, admitted: accepted };
      }
    }
  } finally { box.dispose(); for (const material of Array.isArray(sheet.material) ? sheet.material : [sheet.material]) material.dispose(); }
  if (chosen === undefined) throw new Error("No finite short-edge layout was evaluated");
  const selected: NonNullable<typeof chosen> = chosen;
  const inverseHand: THREE.Matrix4 = selected.handFrame.clone().invert();
  const frameInHand: THREE.Matrix4 = inverseHand.clone().multiply(selected.frame);
  /** Actual three-millimetre contact remains independent of the native fit. */
  function measure(paper: THREE.Mesh): ReturnType<typeof measurePaperContact> { return measurePaperContact(paper, actor.point(thumb.bone, thumb.point), actor.point(index.bone, index.point), 0.003); }
  return { admitted: selected.admitted, hand: selected.hand, frameInHand, guideX, anchor: { bone: "rightHand", localPoint: selected.centre.applyMatrix4(inverseHand).toArray() as [number, number, number] }, index, thumb, attempts,
    worldFrame: (): THREE.Matrix4 => { const bone: THREE.Group = actor.drawing.bones.get("rightHand")!; bone.updateWorldMatrix(true, false); return bone.matrixWorld.clone().multiply(frameInHand); },
    place: (paper: THREE.Mesh, attachment: THREE.Matrix4 = frameInHand): ReturnType<typeof measurePaperContact> => { const bone: THREE.Group = actor.drawing.bones.get("rightHand")!; bone.updateWorldMatrix(true, false); bone.matrixWorld.clone().multiply(attachment).decompose(paper.position, paper.quaternion, paper.scale); paper.updateMatrixWorld(true); return measure(paper); },
    measure,
    outside: (paper: THREE.Mesh): { certified: boolean; queryWork: number; intersections: number; containments: number; error?: string } => {
      const matrices: Map<string, THREE.Matrix4> = new Map();
      for (const [name, mesh] of actor.drawing.parts) if (actor.rightHandParts.includes(mesh)) { mesh.updateWorldMatrix(true, false); matrices.set(name, mesh.matrixWorld.clone()); }
      paper.updateWorldMatrix(true, false);
      const result: ReturnType<typeof inspect> = inspect(paper.geometry, paper.matrixWorld, matrices);
      return { certified: result.certified, queryWork: result.testedTriangles, intersections: result.intersections, containments: result.containments, ...(result.errors.length === 0 ? {} : { error: result.errors.join("\n") }) };
    } };
}

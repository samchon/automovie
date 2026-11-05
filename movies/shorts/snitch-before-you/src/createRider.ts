import {
  AutoMovieHumanClinicalIk, AutoMovieHumanSkeleton, AutoMovieHumanRigControls,
  type IAutoMovieHumanParameters, type IAutoMovieHumanPose,
} from "@automovie/human";
import * as THREE from "three";
import { riderMassProxy } from "./riderMassProxy";

/** One low-cost polygon rider driven by the public Human clinical skeleton. */
interface Rider {
  /** Owned display root, with +X forward, +Y up and +Z the person's left. */
  object: THREE.Group;
  /** Evaluate an absolute pose with parent-local pelvis and world contacts. */
  update: (pose: IAutoMovieHumanPose, pelvis: THREE.Vector3, contacts?: Partial<Record<"left" | "right", THREE.Vector3>>, bank?: number, options?: Controls) => { error: number; supportErrors: { name: string; error: number }[]; clamps: string[] };
  /** World joint point from the last actual FK evaluation. */
  point: (name: string, offset?: THREE.Vector3) => THREE.Vector3;
  /** Declared unit-mass approximation of the displayed world FK points. */
  proxy: () => ReturnType<typeof riderMassProxy>;
  /** Retire this rider's geometry and materials. */
  dispose: () => void;
}

/** Explicit coarse support points and absolute hand appearance for this frame. */
interface Controls {
  hands?: Partial<Record<"left" | "right", "open" | "shaft" | "fist">>;
  supports?: { name: string; bone: AutoMovieHumanRigControls.Joint; localPoint?: [number, number, number]; towards?: string; position: THREE.Vector3; region: "body" | "left"; amount: number; slideOnShaft?: boolean }[];
  shaftPitch?: number;
  shaftQuaternion?: THREE.Quaternion;
  orientation?: THREE.Quaternion;
  shaftFrames?: Partial<Record<"left" | "right", THREE.Quaternion>>;
}

/**
 * Build a coarse clothed figure from Human joint positions and clinical FK.
 * Surface parts are project-owned six-sided polygons; their centres and motion
 * derive from Human, not a separate hand-authored skeleton. No photographic
 * likeness, cloth simulation or full Human skin is claimed.
 *
 * @evidence contracts/common.md#implementation-and-ownership Prepares the public Human evaluator once, solves explicit wrist contacts with Human ClinicalIk, and displays its actual resulting joint positions. The caller retains contact targets; residuals and ROM clamps are returned without suppression. Absolute inputs avoid playback-history state.
 * @evidence contracts/common.md#authoring-interface Parameters use Human units. Pelvis is parent-local metres; wrist/support targets are world metres. Bank is radians about parent-local forward +X. Owns meshes/materials and must be disposed after removal. Independent hair colour/tie controls describe coarse identity, not portrait recovery; explicit chest breadth controls the coarse clothed silhouette without scaling the Human rig.
 */
export function createRider(parameters: IAutoMovieHumanParameters, team: number, blond: boolean, glasses: boolean, evaluate: AutoMovieHumanSkeleton.PoseEvaluator = AutoMovieHumanSkeleton.prepare(parameters), appearance: { hairColour?: number; hairTied?: boolean } = {}): Rider {
  const neutral: AutoMovieHumanSkeleton.IOutput = evaluate({});
  const object: THREE.Group = new THREE.Group();
  const points: Map<string, THREE.Vector3> = new Map();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const limbs: { mesh: THREE.Mesh; from: string; to: string; radius: number }[] = [];
  const dark: THREE.MeshStandardMaterial = material(0x242831);
  const skin: THREE.MeshStandardMaterial = material(0xe6bd9a);
  const colour: THREE.MeshStandardMaterial = material(team);
  const hair: THREE.MeshStandardMaterial = material(appearance.hairColour ?? (blond ? 0xdcc995 : 0x17191b));
  const torsoRadius: number = parameters.body.anatomy.chestBreadth === undefined ? 0.165 : parameters.body.anatomy.chestBreadth / 2000 + 0.015;
  const surfaceShift: number = torsoRadius - 0.165;
  const white: THREE.MeshStandardMaterial = material(0xe9e6d8);
  const grey: THREE.MeshStandardMaterial = material(0x646b72);
  const up: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  const initialHip: THREE.Vector3 = new THREE.Vector3(...joint(neutral, "hips").position);
  let output: AutoMovieHumanSkeleton.IOutput = neutral;

  // Each visible limb uses the same two actual Human joints for every pose.
  for (const side of ["left", "right"] as const) {
    segment(`${side}UpperArm`, `${side}LowerArm`, 0.065, dark);
    segment(`${side}LowerArm`, `${side}Hand`, 0.048, dark);
    segment(`${side}UpperLeg`, `${side}LowerLeg`, 0.085, dark);
    segment(`${side}LowerLeg`, `${side}Foot`, 0.060, dark);
  }
  segment("hips", "neck", torsoRadius, grey);
  const head: THREE.Mesh = mesh(new THREE.IcosahedronGeometry(0.115, 1), skin);
  head.scale.set(0.9, 1.22, 0.92);
  const hairCap: THREE.Mesh = mesh(new THREE.IcosahedronGeometry(0.118, 1), hair);
  hairCap.scale.set(0.94, 0.75, 0.97);
  const tie: THREE.Mesh = mesh(new THREE.BoxGeometry(0.035, 0.19, 0.09), colour);
  const shirt: THREE.Mesh = mesh(new THREE.BoxGeometry(0.045, 0.22, 0.14), white);
  const badge: THREE.Mesh = mesh(new THREE.BoxGeometry(0.045, 0.08, 0.065), colour);
  const collar: THREE.Mesh = mesh(new THREE.ConeGeometry(0.14, 0.10, 4), white);
  const robe: THREE.Mesh = mesh(new THREE.CylinderGeometry(0.215, 0.18, 0.42, 6, 1, true, 0, Math.PI), dark);
  robe.scale.set(torsoRadius / 0.165, 1, torsoRadius / 0.165);
  const stripes: THREE.Mesh[] = [0, 1, 2].map((): THREE.Mesh => mesh(new THREE.BoxGeometry(0.048, 0.015, 0.095), white));
  const palms: Map<string, THREE.Mesh> = new Map();
  const fingers: Map<string, THREE.Mesh[]> = new Map();
  const grips: Map<string, THREE.Mesh> = new Map();
  const boots: Map<string, THREE.Mesh> = new Map();
  for (const side of ["left", "right"] as const) {
    palms.set(side, mesh(new THREE.IcosahedronGeometry(0.048, 0), skin));
    fingers.set(side, [-1, 0, 1].map((): THREE.Mesh => mesh(new THREE.BoxGeometry(0.105, 0.016, 0.017), skin)));
    grips.set(side, mesh(new THREE.TorusGeometry(0.036, 0.014, 4, 10), skin));
    boots.set(side, mesh(new THREE.BoxGeometry(0.23, 0.10, 0.095), dark));
  }
  const spectacle: THREE.Group = new THREE.Group();
  if (glasses) {
    for (const z of [-0.047, 0.047]) {
      const ring: THREE.Mesh = mesh(new THREE.TorusGeometry(0.038, 0.006, 4, 12), dark);
      ring.rotation.y = Math.PI / 2;
      ring.position.set(0, 0, z);
      object.remove(ring);
      spectacle.add(ring);
    }
    object.add(spectacle);
  }
  const tail: THREE.Mesh | null = (appearance.hairTied ?? blond) ? mesh(new THREE.ConeGeometry(0.06, 0.25, 5), hair) : null;
  const eyes: THREE.Mesh[] = [-1, 1].map((): THREE.Mesh => mesh(new THREE.IcosahedronGeometry(0.009, 0), dark));
  const mouth: THREE.Mesh = mesh(new THREE.BoxGeometry(0.008, 0.006, 0.045), dark);
  const skirts: THREE.Mesh[] = parameters.body.anatomy.sex === "female" ? [0, 1].map((): THREE.Mesh => mesh(new THREE.CylinderGeometry(0.11, 0.16, 0.22, 6, 1, true), dark)) : [];
  const pelvisSkin: THREE.Mesh = mesh(new THREE.IcosahedronGeometry(0.12, 0), dark);
  pelvisSkin.scale.set(1, 0.45, 1.4);

  return { object, update, point, proxy: (): ReturnType<typeof riderMassProxy> => riderMassProxy(point), dispose };

  /** Allocate one matte polygon material owned by this figure. */
  function material(value: number): THREE.MeshStandardMaterial {
    const result: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: value, flatShading: true, roughness: 0.9 });
    materials.push(result);
    return result;
  }

  /** Register mesh resources at allocation for deterministic disposal. */
  function mesh(geometry: THREE.BufferGeometry, surface: THREE.Material): THREE.Mesh {
    geometries.push(geometry);
    const result: THREE.Mesh = new THREE.Mesh(geometry, surface);
    object.add(result);
    return result;
  }

  /** Add a metre-length cylinder whose endpoints will follow actual FK. */
  function segment(from: string, to: string, radius: number, surface: THREE.Material): void {
    limbs.push({ mesh: mesh(new THREE.CylinderGeometry(1, 1, 1, 6), surface), from, to, radius });
  }

  /** Fail explicitly if the installed Human vocabulary omits a needed joint. */
  function joint(value: AutoMovieHumanSkeleton.IOutput, name: string): AutoMovieHumanSkeleton.IPlacement {
    const result: AutoMovieHumanSkeleton.IPlacement | undefined = value.posed.find((p: AutoMovieHumanSkeleton.IPlacement): boolean => p.bone === name);
    if (!result) throw new Error(`Human rig omits required joint ${name}`);
    return result;
  }

  /** Read a last-evaluated local joint, refusing use before placement. */
  function local(name: string): THREE.Vector3 {
    const result: THREE.Vector3 | undefined = points.get(name);
    if (!result) throw new Error(`Unplaced Human joint ${name}`);
    return result;
  }

  /** Expose the actual displayed joint point for contact measurements. */
  function point(name: string, offset: THREE.Vector3 = new THREE.Vector3()): THREE.Vector3 {
    const at: AutoMovieHumanSkeleton.IPlacement = joint(output, name);
    return object.localToWorld(offset.clone().applyQuaternion(new THREE.Quaternion(...at.rotation)).add(local(name)));
  }

  /** Place one absolute pose, returning all fitted-contact and limit feedback. */
  function update(pose: IAutoMovieHumanPose, pelvis: THREE.Vector3, contacts: Partial<Record<"left" | "right", THREE.Vector3>> = {}, bank: number = 0, options: Controls = {}): { error: number; supportErrors: { name: string; error: number }[]; clamps: string[] } {
    object.quaternion.copy(options.orientation ?? new THREE.Quaternion()).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), bank));
    object.position.copy(pelvis).sub(initialHip.clone().applyQuaternion(object.quaternion));
    object.updateMatrixWorld(true);
    let fitted: IAutoMovieHumanPose = pose;
    let error: number = 0;
    const bodySupport: NonNullable<Controls["supports"]>[number] | undefined = options.supports?.find((s: NonNullable<Controls["supports"]>[number]): boolean => s.region === "body");
    if (bodySupport) {

      // The actual FK surface point locates the root during supported bearing;
      // a prescribed root must not fight an impossible rib contact target.
      const at: THREE.Vector3 = object.localToWorld(supportPoint(evaluate(pose), { bone: bodySupport.bone, localPoint: bodySupport.localPoint, position: [0, 0, 0] }));
      const rootWorld: THREE.Vector3 = object.getWorldPosition(new THREE.Vector3()).addScaledVector(bodySupport.position.clone().sub(at), bodySupport.amount);
      object.position.copy(object.parent ? object.parent.worldToLocal(rootWorld) : rootWorld);
      object.updateMatrixWorld(true);
    }
    const supports: { name: string; target: AutoMovieHumanClinicalIk.ITarget; region: "body" | "left"; amount: number }[] = (options.supports ?? []).map((support: NonNullable<Controls["supports"]>[number]): { name: string; target: AutoMovieHumanClinicalIk.ITarget; region: "body" | "left"; amount: number } => {
      let localPoint: [number, number, number] | undefined = support.localPoint;
      if (support.towards) {
        const a: AutoMovieHumanSkeleton.IBone | undefined = neutral.bones.find((b: AutoMovieHumanSkeleton.IBone): boolean => b.bone === support.bone);
        const b: AutoMovieHumanSkeleton.IBone | undefined = neutral.bones.find((b: AutoMovieHumanSkeleton.IBone): boolean => b.bone === support.towards);
        if (!a || !b) throw new Error("Missing support-point bind joint");
        localPoint = [(b.position[0] - a.position[0]) * 0.5, (b.position[1] - a.position[1]) * 0.5, (b.position[2] - a.position[2]) * 0.5];
      }
      const worldTarget: THREE.Vector3 = support.position.clone();
      if (support.slideOnShaft) {
        const wrist: THREE.Vector3 | undefined = contacts.left;
        if (!wrist || !localPoint) throw new Error("Sliding forearm support needs its wrist and rigid bind point");
        const axis: THREE.Vector3 = new THREE.Vector3(1, 0, 0).applyQuaternion(options.shaftQuaternion ?? new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), options.shaftPitch ?? 0));
        const perpendicular: THREE.Vector3 = worldTarget.clone().sub(wrist);
        perpendicular.addScaledVector(axis, -perpendicular.dot(axis));
        const remaining: number = new THREE.Vector3(...localPoint).lengthSq() - perpendicular.lengthSq();
        if (remaining <= 0) throw new Error("The requested forearm support exceeds its measured rigid span");

        // Contact may slide along the same shaft; actual Human bone length
        // determines its longitudinal point, not an unrelated guessed offset.
        worldTarget.copy(wrist).add(perpendicular).addScaledVector(axis, -Math.sqrt(remaining));
      }
      const target: THREE.Vector3 = object.worldToLocal(worldTarget);
      return { name: support.name, target: { bone: support.bone, localPoint, position: [target.x, target.y, target.z] }, region: support.region, amount: support.amount };
    });
    for (const side of ["left", "right"] as const) {
      const target: THREE.Vector3 | undefined = contacts[side];
      if (!target) continue;
      if (fitted.arms?.[side]?.elbow?.flexion === undefined) {

        // A slightly bent starting elbow avoids the straight-chain singularity
        // when a contact asks an extended arm to shorten. Authored bends win.
        fitted = { ...fitted, arms: { left: fitted.arms?.left ?? {}, right: fitted.arms?.right ?? {}, [side]: { ...fitted.arms?.[side], elbow: { ...fitted.arms?.[side]?.elbow, flexion: 40 } } } };
      }
      const position: THREE.Vector3 = object.worldToLocal(target.clone());
      let residual: number = Number.POSITIVE_INFINITY;
      const targets: AutoMovieHumanClinicalIk.ITarget[] = [{ bone: `${side}Hand`, position: [position.x, position.y, position.z] }];
      if (side === "left") for (const support of supports.filter((s: { region: string }): boolean => s.region === "left")) {
        const target: THREE.Vector3 = supportPoint(evaluate(fitted), support.target).lerp(new THREE.Vector3(...support.target.position), support.amount);
        targets.push({ ...support.target, position: [target.x, target.y, target.z] });
      }

      // Bounded refinement uses the same frame's solved pose, never the previous
      // displayed frame. The public solver's per-call budget is sixteen updates.
      for (let pass: number = 0; pass < 4 && residual > 0.004; pass++) {
        const solved: AutoMovieHumanClinicalIk.IResult = AutoMovieHumanClinicalIk.solve(evaluate, fitted, {
          chain: { region: "arm", side }, targets, iterations: 16, tolerance: 0.004,
        });
        fitted = solved.pose;
        residual = solved.error;
      }
      if (targets.length > 1) {

        // Grasp support has priority while the forearm approaches or leaves its
        // bearing surface. Keep the actual remaining forearm error separately.
        for (let polish: number = 0; polish < 2; polish++) {
          const at: THREE.Vector3 = supportPoint(evaluate(fitted), targets[0]!);
          if (at.distanceTo(position) <= 0.004) break;
          fitted = AutoMovieHumanClinicalIk.solve(evaluate, fitted, { chain: { region: "arm", side }, targets: [targets[0]!], iterations: 16, tolerance: 0.004 }).pose;
        }
      }
    }
    output = evaluate(fitted);
    for (const side of ["left", "right"] as const) {
      if (contacts[side]) error = Math.max(error, object.localToWorld(new THREE.Vector3(...joint(output, `${side}Hand`).position)).distanceTo(contacts[side]!));
    }
    points.clear();
    for (const p of output.posed) points.set(p.bone, new THREE.Vector3(...p.position));
    for (const limb of limbs) {
      const a: THREE.Vector3 = local(limb.from);
      const b: THREE.Vector3 = local(limb.to);
      const delta: THREE.Vector3 = b.clone().sub(a);
      limb.mesh.position.copy(a).add(b).multiplyScalar(0.5);
      limb.mesh.quaternion.setFromUnitVectors(up, delta.clone().normalize());
      limb.mesh.scale.set(limb.radius, delta.length(), limb.radius);
    }
    const skull: THREE.Vector3 = local("head").clone().add(new THREE.Vector3(0, 0.08, 0));
    const headTurn: THREE.Quaternion = new THREE.Quaternion(...joint(output, "head").rotation);
    head.position.copy(skull);
    head.quaternion.copy(headTurn);
    hairCap.position.copy(skull).add(new THREE.Vector3(-0.01, 0.08, 0).applyQuaternion(headTurn));
    hairCap.quaternion.copy(headTurn);
    spectacle.position.copy(skull).add(new THREE.Vector3(0.105, 0.015, 0).applyQuaternion(headTurn));
    spectacle.quaternion.copy(headTurn);
    eyes.forEach((eye: THREE.Mesh, i: number): void => { eye.position.copy(skull).add(new THREE.Vector3(0.105, 0.035, (i === 0 ? -1 : 1) * 0.045).applyQuaternion(headTurn)); });
    mouth.position.copy(skull).add(new THREE.Vector3(0.103, -0.035, 0).applyQuaternion(headTurn));
    mouth.quaternion.copy(headTurn);
    const chest: THREE.Vector3 = local("neck").clone().lerp(local("hips"), 0.28);
    const torsoTurn: THREE.Quaternion = new THREE.Quaternion().setFromUnitVectors(up, local("neck").clone().sub(local("hips")).normalize());
    shirt.position.copy(chest).add(new THREE.Vector3(0.155 + surfaceShift, 0, 0).applyQuaternion(torsoTurn)); shirt.quaternion.copy(torsoTurn);
    tie.position.copy(chest).add(new THREE.Vector3(0.185 + surfaceShift, -0.03, 0).applyQuaternion(torsoTurn)); tie.quaternion.copy(torsoTurn);
    badge.position.copy(chest).add(new THREE.Vector3(0.17 + surfaceShift, 0.01, 0.10).applyQuaternion(torsoTurn)); badge.quaternion.copy(torsoTurn);
    collar.position.copy(local("neck")).add(new THREE.Vector3(0.02, -0.035, 0).applyQuaternion(torsoTurn));
    collar.quaternion.copy(torsoTurn).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI));
    robe.position.copy(chest).add(new THREE.Vector3(-0.025, -0.02, 0).applyQuaternion(torsoTurn));
    robe.quaternion.copy(torsoTurn).multiply(new THREE.Quaternion().setFromAxisAngle(up, Math.PI));
    stripes.forEach((stripe: THREE.Mesh, i: number): void => { stripe.position.copy(tie.position).add(new THREE.Vector3(0.005, 0.06 - i * 0.055, 0).applyQuaternion(torsoTurn)); stripe.quaternion.copy(torsoTurn); });
    pelvisSkin.position.copy(local("hips"));
    if (tail) {
      tail.position.copy(skull).add(new THREE.Vector3(-0.15, -0.07, 0).applyQuaternion(headTurn));
      tail.quaternion.copy(headTurn).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -0.9));
    }
    skirts.forEach((skirt: THREE.Mesh, i: number): void => {
      const side: string = i === 0 ? "left" : "right";
      const a: THREE.Vector3 = local(`${side}UpperLeg`);
      const direction: THREE.Vector3 = local(`${side}LowerLeg`).clone().sub(a).normalize();
      skirt.position.copy(a).addScaledVector(direction, 0.08);
      skirt.quaternion.setFromUnitVectors(up, direction);
    });
    for (const side of ["left", "right"] as const) {
      palms.get(side)!.position.copy(local(`${side}Hand`));
      const mode: "open" | "shaft" | "fist" = options.hands?.[side] ?? (contacts[side] ? "shaft" : "fist");
      palms.get(side)!.scale.setScalar(mode === "open" ? 0.8 : 1);
      fingers.get(side)!.forEach((finger: THREE.Mesh, i: number): void => { finger.visible = mode === "open"; finger.position.copy(local(`${side}Hand`)).add(new THREE.Vector3(0.065, 0, (i - 1) * 0.025)); });
      const grip: THREE.Mesh = grips.get(side)!;
      grip.visible = mode === "shaft";
      const shaftFrame: THREE.Quaternion = options.shaftFrames?.[side] ?? object.getWorldQuaternion(new THREE.Quaternion());
      grip.position.copy(object.worldToLocal(point(`${side}Hand`).sub(new THREE.Vector3(0, 0.04, 0).applyQuaternion(shaftFrame))));
      grip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0).applyQuaternion(shaftFrame).applyQuaternion(object.getWorldQuaternion(new THREE.Quaternion()).invert()));
      const footRotation: THREE.Quaternion = new THREE.Quaternion(...joint(output, `${side}Foot`).rotation);
      boots.get(side)!.position.copy(local(`${side}Foot`)).add(new THREE.Vector3(0.065, 0, 0).applyQuaternion(footRotation));
      boots.get(side)!.quaternion.copy(footRotation);
    }
    object.updateMatrixWorld(true);
    return { error, supportErrors: supports.map((s: { name: string; target: AutoMovieHumanClinicalIk.ITarget }): { name: string; error: number } => ({ name: s.name, error: supportPoint(output, s.target).distanceTo(new THREE.Vector3(...s.target.position)) })), clamps: output.clamped.map((c: AutoMovieHumanSkeleton.IClamp): string => `${c.path}: ${c.requested} -> ${c.applied}`) };
  }

  /** Resolve the same admitted Human bone-bound point used by clinical IK. */
  function supportPoint(value: AutoMovieHumanSkeleton.IOutput, target: AutoMovieHumanClinicalIk.ITarget): THREE.Vector3 {
    const at: AutoMovieHumanSkeleton.IPlacement = joint(value, target.bone);
    return new THREE.Vector3(target.localPoint?.[0] ?? 0, target.localPoint?.[1] ?? 0, target.localPoint?.[2] ?? 0).applyQuaternion(new THREE.Quaternion(...at.rotation)).add(new THREE.Vector3(...at.position));
  }

  /** Retire only resources allocated by this figure. */
  function dispose(): void {
    geometries.forEach((g: THREE.BufferGeometry): void => g.dispose());
    materials.forEach((m: THREE.Material): void => m.dispose());
    object.clear();
  }
}

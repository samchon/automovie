import { AutoMovieHumanSkeleton, type IAutoMovieHumanParameters, type IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import { createBroom } from "./createBroom";
import { createRider } from "./createRider";
import { humanParameters } from "./humanParameters";
import { sampleFlight } from "./sampleFlight";
import { sampleWholeFlight } from "./sampleWholeFlight";
import { motionPhase } from "./motionPhase";
import { supportingPlayerDesign } from "./supportingPlayerDesign";
import { sampleSupportingPath } from "./sampleSupportingPath";
import { createBallFlights } from "./createBallFlights";

/** One background player's actual mesh, supporting broom and stable role. */
interface Player {
  id: string; frame: THREE.Group; rider: ReturnType<typeof createRider>; broom: ReturnType<typeof createBroom>; bat: THREE.Mesh | null;
  design: ReturnType<typeof supportingPlayerDesign>;
  last: { error: number; clamps: string[] };
}

/**
 * Assemble the actual polygon pitch and central rescue segment.
 * Source: settings/{arena,goals,players,east-keeper,brooms,bats,quaffle,
 * bludgers,snitch}.md and screenplay#airborne-race. Public Human joints drive
 * every person; simple primitives describe the static environment and props.
 *
 * @evidence contracts/common.md#implementation-and-ownership Invokes the complete absolute-time controller and both solved hero rigs, twelve background Human figures with their own brooms, six goals, four bats and four distinct balls. Actual FK residuals and support ownership are exposed. Background passing, marking, striking, hold-play and approach continue through the rescue; the final black cut belongs to this scene.
 * @evidence contracts/common.md#authoring-interface Returns the Viewer scene/camera/seek/dispose contract in metres/seconds; +X east,+Y up,+Z north. Pure absolute frame sampling permits seeking. Owns all created scene resources and borrows no generated image textures. Portraits guide identity, not billboard people.
 */
export function createFlightScene(): {
  scene: THREE.Scene; camera: THREE.PerspectiveCamera; seek: (seconds: number) => void; dispose: () => void;
} {
  const scene: THREE.Scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb9d9e6);
  scene.fog = new THREE.Fog(0xb9d9e6, 400, 1000);
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(43, 9 / 16, 0.1, 1000);
  scene.add(new THREE.HemisphereLight(0xf1f8ff, 0x5e7645, 2.0));
  const sun: THREE.DirectionalLight = new THREE.DirectionalLight(0xfff0d2, 2.0);
  sun.position.set(-80, 160, -90); scene.add(sun);
  const ownedGeometry: THREE.BufferGeometry[] = [];
  const ownedMaterial: THREE.Material[] = [];
  const female: IAutoMovieHumanParameters = humanParameters(1.72, true);
  const male: IAutoMovieHumanParameters = humanParameters(1.78, false);
  const femaleFK: AutoMovieHumanSkeleton.PoseEvaluator = AutoMovieHumanSkeleton.prepare(female);
  const maleFK: AutoMovieHumanSkeleton.PoseEvaluator = AutoMovieHumanSkeleton.prepare(male);
  const bodyModels: Map<string, { parameters: IAutoMovieHumanParameters; evaluate: AutoMovieHumanSkeleton.PoseEvaluator }> = new Map([["standard", { parameters: male, evaluate: maleFK }]]);
  const carina: ReturnType<typeof createRider> = createRider(female, 0x2e624b, true, false, femaleFK);
  const harry: ReturnType<typeof createRider> = createRider(male, 0x8d2e37, false, true, maleFK);
  const entry: ReturnType<typeof sampleFlight> = sampleFlight(23);
  harry.update(entry.harry.pose, entry.harry.pelvis, entry.harry.wrists, entry.harry.bank, { hands: entry.harry.hands });
  const reachAtEntry: THREE.Vector3 = harry.point("leftHand").sub(entry.harryBroom.position);
  const hangingEntry: ReturnType<typeof sampleFlight> = sampleFlight(26);
  harry.update(hangingEntry.harry.pose, hangingEntry.harry.pelvis, hangingEntry.harry.wrists, hangingEntry.harry.bank, { orientation: hangingEntry.harry.orientation, reachSupport: hangingEntry.harry.reachSupport });
  const hangingLength: number = harry.point("rightHand").distanceTo(harry.proxy().centre);
  const approachEntry: ReturnType<typeof sampleFlight> = sampleFlight(40 - 1e-7, { hangingLength });
  harry.update(approachEntry.harry.pose, approachEntry.harry.pelvis, approachEntry.harry.wrists, approachEntry.harry.bank, { orientation: approachEntry.harry.orientation, reachSupport: approachEntry.harry.reachSupport });
  const leftAt40: THREE.Vector3 = harry.point("leftHand").sub(new THREE.Vector3(approachEntry.harryBroom.position.x, 0, 0));
  const calibration: { hangingLength: number; leftAt40: THREE.Vector3 } = { hangingLength, leftAt40 };
  const carinaBroom: ReturnType<typeof createBroom> = createBroom();
  const harryBroom: ReturnType<typeof createBroom> = createBroom();
  scene.add(carina.object, harry.object, carinaBroom.object, harryBroom.object);
  const grass: THREE.MeshStandardMaterial = material(0x6a8a48);
  const lawn: THREE.Mesh = mesh(new THREE.PlaneGeometry(650, 200), grass);
  lawn.rotation.x = -Math.PI / 2; lawn.position.set(60, 0, 0);
  const stripeSurface: THREE.MeshStandardMaterial = material(0x718f4f);
  for (let x: number = -180; x < 340; x += 40) {
    const stripe: THREE.Mesh = mesh(new THREE.PlaneGeometry(20, 180), stripeSurface);
    stripe.rotation.x = -Math.PI / 2; stripe.position.set(x, 0.008, 0);
  }
  const field: THREE.Mesh = mesh(new THREE.CircleGeometry(1, 64), material(0x5c8240));
  field.rotation.x = -Math.PI / 2; field.scale.set(110, 50, 1); field.position.set(-80, 0.015, 0);
  const goalMaterial: THREE.MeshStandardMaterial = material(0xc6c5ad);
  for (const x of [-160, 0]) {
    for (const z of [-12, 0, 12]) {
      const pole: THREE.Mesh = mesh(new THREE.CylinderGeometry(0.11, 0.18, 42, 7), goalMaterial);
      pole.position.set(x, 21, z);
      const hoop: THREE.Mesh = mesh(new THREE.TorusGeometry(3.14, 0.14, 6, 32), goalMaterial);
      hoop.rotation.y = Math.PI / 2; hoop.position.set(x, 45, z);
    }
  }
  const snitch: THREE.Group = new THREE.Group();
  const gold: THREE.MeshStandardMaterial = material(0xf4d14f);
  gold.emissive = new THREE.Color(0x6d4d0c);
  const orb: THREE.Mesh = mesh(new THREE.IcosahedronGeometry(0.02, 1), gold);
  scene.remove(orb); snitch.add(orb);
  const wings: THREE.Mesh[] = [];
  for (const sign of [-1, 1]) {
    const wing: THREE.Mesh = mesh(new THREE.BoxGeometry(0.012, 0.004, 0.05), material(0xf2ecd2));
    wing.position.z = sign * 0.035; scene.remove(wing); snitch.add(wing); wings.push(wing);
  }
  scene.add(snitch);
  const glowCanvas: HTMLCanvasElement = document.createElement("canvas");
  glowCanvas.width = glowCanvas.height = 32;
  const glowContext: CanvasRenderingContext2D = glowCanvas.getContext("2d")!;
  const gradient: CanvasGradient = glowContext.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, "rgba(255,220,40,1)"); gradient.addColorStop(1, "rgba(255,190,20,0)");
  glowContext.fillStyle = gradient; glowContext.fillRect(0, 0, 32, 32);
  const glowTexture: THREE.CanvasTexture = new THREE.CanvasTexture(glowCanvas);
  const glowMaterial: THREE.SpriteMaterial = new THREE.SpriteMaterial({ map: glowTexture, transparent: true, depthWrite: false });
  const glow: THREE.Sprite = new THREE.Sprite(glowMaterial); glow.scale.set(0.12, 0.12, 1); snitch.add(glow);
  const players: Player[] = [];
  const riding: IAutoMovieHumanPose = {
    spine: { lumbar: { flexion: 30 }, thoracic: { flexion: 8 } },
    legs: { left: { hip: { flexion: 78, abduction: 25 }, knee: { flexion: 95 } }, right: { hip: { flexion: 78, abduction: 25 }, knee: { flexion: 95 } } },
    arms: { left: { shoulder: { flexion: 40 }, elbow: { flexion: 75 } }, right: { shoulder: { flexion: 40 }, elbow: { flexion: 75 } } },
  };
  for (const team of ["G", "R"] as const) {
    for (const role of ["C1", "C2", "C3", "B1", "B2", "K"]) {
      const id: string = `${team}-${role}`;
      const frame: THREE.Group = new THREE.Group(); frame.name = id;
      const design: ReturnType<typeof supportingPlayerDesign> = supportingPlayerDesign(id);
      if (!bodyModels.has(design.body)) bodyModels.set(design.body, { parameters: design.parameters, evaluate: AutoMovieHumanSkeleton.prepare(design.parameters) });
      const model = bodyModels.get(design.body)!;
      const rider: ReturnType<typeof createRider> = createRider(model.parameters, team === "G" ? 0x2e624b : 0x8d2e37, false, false, model.evaluate, { hairColour: design.hairColour, hairTied: design.hairTied });
      const last = rider.update(riding, new THREE.Vector3(0, 0.08, 0), role === "C2" && team === "G" ? { left: new THREE.Vector3(0.35, 0.45, 0.1), right: new THREE.Vector3(0.23, 0.04, -0.035) } : { left: new THREE.Vector3(0.18, 0.04, 0.035) });
      const broom: ReturnType<typeof createBroom> = createBroom();
      frame.add(rider.object, broom.object); scene.add(frame);
      const bat: THREE.Mesh | null = role.startsWith("B") ? mesh(new THREE.CylinderGeometry(0.055, 0.023, 0.6, 6), material(0x8c6139)) : null;
      players.push({ id, frame, rider, broom, bat, design, last });
    }
  }
  const quaffle: THREE.Mesh = mesh(new THREE.IcosahedronGeometry(0.125, 1), material(0xa8382d));
  const bludgers: THREE.Mesh[] = [0, 1].map((): THREE.Mesh => mesh(new THREE.IcosahedronGeometry(0.1, 1), material(0x343a40)));
  // Event acquisition measures the unperturbed incoming action. Afterwards the
  // same frozen impulse response owns the displayed receiver/Beater hands.
  let responseAt: ReturnType<typeof createBallFlights>["response"] = (): ReturnType<ReturnType<typeof createBallFlights>["response"]> => ({ offset: new THREE.Vector3(), velocity: new THREE.Vector3(), acceleration: new THREE.Vector3() });
  const ballFlights: ReturnType<typeof createBallFlights> = freezeBallEvents();
  responseAt = ballFlights.response;
  return { scene, camera, seek, dispose };

  /** Retain one scalar matte material under scene disposal. */
  function material(colour: number): THREE.MeshStandardMaterial {
    const value: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.95, flatShading: true }); ownedMaterial.push(value); return value;
  }

  /** Retain actual project-authored prop geometry. */
  function mesh(geometry: THREE.BufferGeometry, surface: THREE.Material): THREE.Mesh {
    ownedGeometry.push(geometry); const value: THREE.Mesh = new THREE.Mesh(geometry, surface); scene.add(value); return value;
  }

  /** Place one shared broom frame rather than an unrelated hand-contact prop. */
  function placeBroom(target: THREE.Group, source: ReturnType<typeof sampleFlight>["carinaBroom"]): void {
    target.position.copy(source.position); target.quaternion.copy(source.quaternion);
  }

  /** Evaluate the implemented core and its continuing distant field state. */
  function seek(seconds: number): void {
    const state: ReturnType<typeof sampleFlight> = sampleWholeFlight(seconds, reachAtEntry, calibration);
    scene.background = new THREE.Color(seconds >= 59.8 ? 0x000000 : 0xb9d9e6);
    for (const child of scene.children) if (!(child instanceof THREE.Light)) child.visible = seconds < 59.8;
    placeBroom(carinaBroom.object, state.carinaBroom); placeBroom(harryBroom.object, state.harryBroom);
    const c: ReturnType<typeof carina.update> = carina.update(state.carina.pose, state.carina.pelvis, state.carina.wrists, state.carina.bank, { hands: state.carina.hands, orientation: state.carina.orientation, shaftFrames: { left: state.carinaBroom.quaternion, right: state.carinaBroom.quaternion } });
    const h: ReturnType<typeof harry.update> = harry.update(state.harry.pose, state.harry.pelvis, state.harry.wrists, state.harry.bank, { ...state.harry.supports, reachSupport: state.harry.reachSupport, hands: state.harry.hands, orientation: state.harry.orientation, shaftFrames: { left: seconds < 23 ? state.harryBroom.quaternion : state.carinaBroom.quaternion, right: seconds < 45.2 ? state.harryBroom.quaternion : state.carinaBroom.quaternion } });
    snitch.position.copy(state.snitch);
    const perspectiveGlow: boolean = !(seconds < 3.5 || (seconds >= 53.1 && seconds < 53.8));
    if (glowMaterial.sizeAttenuation !== perspectiveGlow) { glowMaterial.sizeAttenuation = perspectiveGlow; glowMaterial.needsUpdate = true; }
    glow.scale.setScalar(perspectiveGlow ? 0.12 : 0.03);
    wings.forEach((wing: THREE.Mesh, i: number): void => { wing.rotation.x = (i === 0 ? 1 : -1) * Math.sin(seconds * 75) * 0.7; });
    background(seconds);
    if (seconds >= 18 && seconds < 19.2) { state.target.copy(quaffle.position).add(new THREE.Vector3(0, 0.15, 0)); state.camera.copy(state.target).add(new THREE.Vector3(5, 2, -7)); }
    if (seconds >= 19.2 && seconds < 20.2) {
      const batter: Player = players.find((p: Player): boolean => p.id === "G-B2")!;
      state.target.copy(batter.rider.point("rightHand")).add(new THREE.Vector3(0.15, 0.15, 0));
      state.camera.copy(state.target).add(new THREE.Vector3(1.8, 1.2, -3.6));
    }
    camera.position.copy(state.camera); camera.lookAt(state.target);
    camera.updateMatrixWorld(true);
    scene.updateMatrixWorld(true);
    const seatDelta: THREE.Vector3 = carinaBroom.object.worldToLocal(harry.point("hips"));
    const rearBrush: THREE.Line3 = new THREE.Line3(new THREE.Vector3(-1.25, 0, 0), new THREE.Vector3(-0.65, 0, 0));
    const bootClearances: number[] = ["left", "right"].map((side: string): number => {
      const boot: THREE.Vector3 = carinaBroom.object.worldToLocal(harry.point(`${side}Foot`, new THREE.Vector3(0.065, 0, 0)));
      return boot.distanceTo(rearBrush.closestPointToPoint(boot, true, new THREE.Vector3())) - 0.264;
    });
    Object.assign(window, { __motionDiagnostics: {
      seconds, implementationRevision: "visible-action-completion-held-root-clearance", scope: "whole 0–60 second motion hint", requestedSupport: state.support,
      carinaErrorMetres: c.error, harryErrorMetres: h.error, clamps: [...c.clamps, ...h.clamps],
      supportErrors: h.supportErrors, seatCentreDelta: seatDelta.toArray(), bootBristleClearanceMetres: bootClearances,
      supportAmounts: state.harry.supports?.supports?.map((s: { name: string; amount: number }): { name: string; amount: number } => ({ name: s.name, amount: s.amount })) ?? [],
      harryLeftKnee: harry.point("leftLowerLeg").toArray(), harryLeftFoot: harry.point("leftFoot").toArray(), harryRightFoot: harry.point("rightFoot").toArray(),
      seatedOnNewGeometry: Math.abs(seatDelta.y - 0.08) < 0.015 && Math.abs(seatDelta.z) < 0.04 && carinaBroom.object.worldToLocal(harry.point("leftFoot")).z > 0 && carinaBroom.object.worldToLocal(harry.point("rightFoot")).z < 0,
      carinaLeft: carina.point("leftHand").toArray(), harryLeft: harry.point("leftHand").toArray(), harryRight: harry.point("rightHand").toArray(),
      carinaBroom: state.carinaBroom.position.toArray(), harryBroom: state.harryBroom.position.toArray(),
      riders: players.length + 2, brooms: players.length + 2, bats: players.filter((p: Player): boolean => p.bat !== null).length, hoops: 6, quaffles: 1, bludgers: bludgers.length, snitches: 1,
      quafflePosition: quaffle.position.toArray(), snitchPosition: snitch.position.toArray(), black: seconds >= 59.8,
      snitchProjection: snitch.position.clone().project(camera).toArray(),
      dynamics: { controller: "force-capable magical broom; mass-normalized proxies, not human strength", calibration: { hangingLength, leftAt40: leftAt40.toArray() }, support: state.dynamics, carinaPath: pathData(state.carinaBroom), oldPath: pathData(state.harryBroom), carinaProxy: proxyData(carina), harryProxy: proxyData(harry), oldShaftHeadClearance: [carina, harry].map((r: ReturnType<typeof createRider>): number => {
        const head: THREE.Vector3 = harryBroom.object.worldToLocal(bodyData(r).headCentre);
        return head.distanceTo(new THREE.Line3(new THREE.Vector3(-0.65, 0, 0), new THREE.Vector3(1.15, 0, 0)).closestPointToPoint(head, true, new THREE.Vector3())) - 0.166;
      }), bodies: [carina, harry].map((r: ReturnType<typeof createRider>): object => { const body: ReturnType<typeof bodyData> = bodyData(r); return { hips: body.hips.toArray(), neck: body.neck.toArray(), head: body.headCentre.toArray(), headForward: body.headForward.toArray() }; }), gazeTargets: { harryPrize: snitch.position.toArray(), carinaHarry: bodyData(harry).headCentre.toArray(), harryOffer: state.harry.wrists.left?.toArray() }, harryRib: harry.point("chest", new THREE.Vector3(0.165, 0, 0)).toArray(), harryForearm: harry.point("leftLowerArm").lerp(harry.point("leftHand"), 0.5).toArray(), ballEvents: ballFlights.events, supportingPaths: players.map((p: Player): object => ({ id: p.id, ...pathData(sampleSupportingPath(p.id, seconds)) })) },
      batsWorld: players.filter((p: Player): boolean => p.bat !== null).map((p: Player): { id: string; position: number[]; tip: number[] } => ({ id: p.id, position: p.bat!.position.toArray(), tip: p.bat!.localToWorld(new THREE.Vector3(0, 0.30, 0)).toArray() })),
      responseApplications: players.map((p: Player): object => ({ id: p.id, left: p.rider.point("leftHand").toArray(), right: p.rider.point("rightHand").toArray(), offset: responseAt(p.id, seconds).offset.toArray() })),
      humanInputs: { female, male, supportingFamilies: Object.fromEntries([...bodyModels].map(([name, model]): [string, IAutoMovieHumanParameters] => [name, model.parameters])) },
      supportingPlayers: players.map((p: Player): { id: string; body: string; hairColour: number; hairTied: boolean; error: number; clamps: string[] } => ({ id: p.id, body: p.design.body, hairColour: p.design.hairColour, hairTied: p.design.hairTied, error: p.last.error, clamps: p.last.clamps })),
    } });
  }

  /** Maintain the same supporting population and held ball through the rescue. */
  function updatePlayers(seconds: number): void {
    for (const p of players) {
      const green: boolean = p.id.startsWith("G");
      const role: string = p.id.slice(2);
      const path: ReturnType<typeof sampleSupportingPath> = sampleSupportingPath(p.id, seconds);
      p.frame.position.copy(path.position); p.frame.quaternion.copy(path.quaternion);
      p.frame.updateMatrixWorld(true);
      if (p.id === "G-K") {
        const signal: number = motionPhase(seconds, 38.3, 39.6) * (1 - motionPhase(seconds, 49, 51));
        p.last = p.rider.update({ ...riding, arms: { left: riding.arms!.left, right: { shoulder: { flexion: 40 + 115 * signal }, elbow: { flexion: 75 - 55 * signal } } } }, new THREE.Vector3(0, 0.08, 0), { left: p.frame.localToWorld(new THREE.Vector3(0.18, 0.04, 0.035)) });
      }
      if (role.startsWith("C") && green) {
        const hug: number = p.id === "G-C2" ? motionPhase(seconds, 38.6, 40.6) : 0;
        const left: THREE.Vector3 = new THREE.Vector3(0.35, 0.45, 0.1).lerp(new THREE.Vector3(0.27, 0.55, 0.16), hug);
        const right: THREE.Vector3 = new THREE.Vector3(0.23, 0.04, -0.035).lerp(new THREE.Vector3(0.27, 0.55, -0.16), hug);
        const catchBall: number = p.id === "G-C1" ? motionPhase(seconds, 1.8, 2.3) * (1 - motionPhase(seconds, 18, 18.3)) : p.id === "G-C2" ? motionPhase(seconds, 18.7, 19) * (1 - hug) : 0;
        right.lerp(new THREE.Vector3(0.35, 0.45, -0.15), catchBall);
        if (p.id === "G-C3") left.x += 0.15 * motionPhase(seconds, 0.2, 0.4) * (1 - motionPhase(seconds, 0.4, 1));
        const recoil: THREE.Vector3 = responseAt(p.id, seconds).offset;
        p.last = p.rider.update({ ...riding, neck: { cervical: { rotation: -20 * hug, flexion: -20 } } }, new THREE.Vector3(0, 0.08, 0), { left: p.frame.localToWorld(left).add(recoil), right: p.frame.localToWorld(right).add(recoil) }, 0, { hands: { left: "fist", right: hug > 0 || catchBall > 0.1 ? "fist" : "shaft" } });
      }
      if (p.bat) {
        const strike: number = p.id === "G-B1" ? 2.8 : p.id === "G-B2" ? 19.6 : 10 + Number(role[1]) * 2;
        const swing: number = motionPhase(seconds, strike - 0.45, strike + 0.2) - motionPhase(seconds, strike + 0.2, strike + 0.85);
        const pose: IAutoMovieHumanPose = { ...riding, arms: { left: riding.arms!.left, right: { shoulder: { flexion: 40 + 55 * swing, abduction: 25 }, elbow: { flexion: 75 - 40 * swing } } } };
        const left: THREE.Vector3 = p.frame.localToWorld(new THREE.Vector3(0.18, 0.04, 0.035));
        p.last = p.rider.update(pose, new THREE.Vector3(0, 0.08, 0), { left });
        const recoil: THREE.Vector3 = responseAt(p.id, seconds).offset;
        if (recoil.lengthSq() > 1e-16) p.last = p.rider.update(pose, new THREE.Vector3(0, 0.08, 0), { left, right: p.rider.point("rightHand").add(recoil) }, 0, { hands: { left: "shaft", right: "fist" } });
        p.bat.quaternion.copy(p.frame.getWorldQuaternion(new THREE.Quaternion())).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.3 - 1.7 * swing));
        p.bat.position.copy(p.rider.point("rightHand")).add(new THREE.Vector3(0, 0.25, 0).applyQuaternion(p.bat.quaternion));
        p.bat.updateMatrixWorld(true);
      }
    }
  }

  /** Capture event-space contacts once; later bat/hand motion cannot drag a free ball. */
  function freezeBallEvents(): ReturnType<typeof createBallFlights> {
    const passes: Parameters<typeof createBallFlights>[0][number][] = [];
    for (const [release, caught, from, to] of [[0.4, 2.3, "G-C3", "G-C1"], [18, 19, "G-C1", "G-C2"]] as const) {
      updatePlayers(release); const origin: THREE.Vector3 = heldBall(from);
      updatePlayers(caught); const target: THREE.Vector3 = heldBall(to);
      updatePlayers(caught - 0.001); const before: THREE.Vector3 = heldBall(to);
      updatePlayers(caught + 0.001); const receiverVelocity: THREE.Vector3 = heldBall(to).sub(before).divideScalar(0.002);
      passes.push({ release, catch: caught, origin, target, receiver: to, receiverVelocity });
    }
    const strikes: Parameters<typeof createBallFlights>[1][number][] = [];
    for (const [time, id] of [[2.8, "G-B1"], [19.6, "G-B2"]] as const) {
      const bat: THREE.Mesh = players.find((p: Player): boolean => p.id === id)!.bat!;
      updatePlayers(time - 0.001); const before: THREE.Vector3 = bat.localToWorld(new THREE.Vector3(0, 0.30, 0));
      updatePlayers(time + 0.001); const after: THREE.Vector3 = bat.localToWorld(new THREE.Vector3(0, 0.30, 0));
      const batVelocity: THREE.Vector3 = after.sub(before).divideScalar(0.002);
      if (batVelocity.length() < 0.1) throw new Error("A strike has no moving bat contact");
      const normal: THREE.Vector3 = batVelocity.clone().normalize();
      updatePlayers(time); const position: THREE.Vector3 = bat.localToWorld(new THREE.Vector3(0, 0.30, 0)).addScaledVector(normal, 0.1);
      strikes.push({ actor: id, time, position, normal, batVelocity });
    }
    updatePlayers(0);
    return createBallFlights(passes, strikes);
  }

  /** Place the ball against the real displayed holding fingers, not an abstract actor root. */
  function heldBall(id: string): THREE.Vector3 {
    const p: Player = players.find((item: Player): boolean => item.id === id)!;
    return id === "G-C3" ? p.rider.point("leftHand").add(new THREE.Vector3(0, 0, -0.125).applyQuaternion(p.frame.quaternion)) : p.rider.point("leftHand").lerp(p.rider.point("rightHand"), 0.5);
  }

  /** Update players, then consume independent projectile/impact state or current holding contact. */
  function background(seconds: number): void {
    updatePlayers(seconds);
    const balls: ReturnType<ReturnType<typeof createBallFlights>["sample"]> = ballFlights.sample(seconds);
    quaffle.position.copy(balls.quaffle ?? heldBall(seconds < 0.4 ? "G-C3" : seconds < 18 ? "G-C1" : "G-C2"));
    bludgers.forEach((ball: THREE.Mesh, i: number): void => { ball.position.copy(balls.bludgers[i]!.position); });
  }

  /** Serialize the analytic platform law without conflating it with joint-force proof. */
  function pathData(path: { position: THREE.Vector3; velocity: THREE.Vector3; acceleration: THREE.Vector3; quaternion: THREE.Quaternion }): object {
    return { position: path.position.toArray(), velocity: path.velocity.toArray(), acceleration: path.acceleration.toArray(), quaternion: path.quaternion.toArray() };
  }

  /** Retain actual pose mass points for an offline derivative/reaction audit. */
  function proxyData(rider: ReturnType<typeof createRider>): object {
    const proxy: ReturnType<ReturnType<typeof createRider>["proxy"]> = rider.proxy();
    return { centre: proxy.centre.toArray(), secondMoment: proxy.secondMoment, points: proxy.points.map((p: { weight: number; position: THREE.Vector3 }): object => ({ weight: p.weight, position: p.position.toArray() })) };
  }

  /** Match the visible torso cylinder and skull centre, not an unobserved skin mesh. */
  function bodyData(rider: ReturnType<typeof createRider>): { hips: THREE.Vector3; neck: THREE.Vector3; headCentre: THREE.Vector3; headForward: THREE.Vector3 } {
    const headLocal: THREE.Vector3 = rider.object.worldToLocal(rider.point("head")).add(new THREE.Vector3(0, 0.08, 0));
    return { hips: rider.point("hips"), neck: rider.point("neck"), headCentre: rider.object.localToWorld(headLocal), headForward: rider.point("head", new THREE.Vector3(1, 0, 0)).sub(rider.point("head")).normalize() };
  }

  /** Release every owned figure, prop and surface after the Viewer is stopped. */
  function dispose(): void {
    carina.dispose(); harry.dispose(); carinaBroom.dispose(); harryBroom.dispose();
    players.forEach((p: Player): void => { p.rider.dispose(); p.broom.dispose(); });
    ownedGeometry.forEach((g: THREE.BufferGeometry): void => g.dispose()); ownedMaterial.forEach((m: THREE.Material): void => m.dispose()); scene.clear();
    glowTexture.dispose(); glowMaterial.dispose();
  }
}

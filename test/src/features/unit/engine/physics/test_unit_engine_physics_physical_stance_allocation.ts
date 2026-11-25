import {
  AutoMoviePhysicalBalance,
  AutoMovieXpbdBody,
  physicalStanceAllocation,
  physicalStanceBalance,
  physicalStanceHip,
  physicalStanceSupport,
  physicalStanceSwing,
  trackPhysicalRoot,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMoviePhysicalProfile,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The stance's centre-of-pressure law and its support's shrinking match their
 * closed forms without a simulation:
 *
 * 1. The command is u = xi + k (xi - xi_ref) plus the integral's bias (Hof et al.
 *    2005; Stephens 2011, Eq. 5.31). The support is shared capture first, trunk
 *    second, convergence last (Lee and Goswami 2012): along one axis of a
 *    shrunken extent [-0.10, 0.38] within a support reaching 0.40, a capture
 *    point at 0.29 with the trunk asking 0.05 m of offset gives p = 0.38 and u
 *    = 0.33; at 0.31, 7 cm inside the shrunken edge as the quadruped's 0.75x
 *    push stands, and at 0.36, the same; and p never falls behind xi. Past the
 *    support p sits at its edge and the pivot takes the hip strategy's offset,
 *    or the trunk's without one. In the band past the shrunken edge convergence
 *    comes first as far as the hip strategy reaches: at 0.39 with -0.02, p =
 *    0.40 and u = u_law under a strategy reaching that far, u = p + 0.05 under
 *    one reaching 0.05, and u = p - delta = 0.42 without one; with u_law inside
 *    the support the trunk's offset is trimmed to the room left. Without a
 *    strategy the pivot never falls inside the capture point along the outward
 *    normal: at 0.387 a 3 cm trunk offset is cut to 1.3 cm, about 10 N m under
 *    760 N (Hof et al. 2005). 1e. The pivot stays within the stance hips' room
 *    of the centre of pressure: a diagonal pair of hips holding 100 N m each
 *    about the pitch axis, whose feet each carry 300 N 0.1 m ahead of them,
 *    keep 70 N m each, and a trunk asking 0.5 m of offset under 600 N gets 140
 *    / 600 m (design-4017-edge, E1, rule 2; Herzog et al. 2016, Section 2.1).
 *    1d. In single support the stance bears the trunk's roll and pitch and the
 *    swinging hip's torque, the hip's whole (Yin, Loken and van de Panne 2007,
 *    Section 3.2): on one sole the offset is served on the centre of pressure
 *    within the sole's room and through the pivot beyond it.
 */
export function test_unit_engine_physics_physical_stance_allocation(): void {
  const failures: string[] = [];
  const near = (name: string, actual: number, expected: number): void => {
    if (
      !(Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(expected)))
    )
      failures.push(`${name}: ${actual} against ${expected}`);
  };
  const k: number = physicalStanceBalance.GAIN;
  const square: IAutoMovieVector3[] = [
    { x: -0.1, y: 0, z: -0.1 },
    { x: 0.1, y: 0, z: -0.1 },
    { x: 0.1, y: 0, z: 0.1 },
    { x: -0.1, y: 0, z: 0.1 },
  ];
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

  // 1. The command with a bias.
  const biased: IAutoMovieVector3 = physicalStanceAllocation.law(
    { x: 0, y: 0, z: 0.03 },
    origin,
    { x: 0.01, z: -0.01 },
  );
  near("biased u.x", biased.x, 0.01);
  near("biased u.z", biased.z, 0.03 + k * 0.03 - 0.01);

  // 1b. The allocation along one axis: a wide strip whose shrunken extent is
  // [-0.10, 0.38] and whose support reaches 0.40 forward, the reference at
  // the origin.
  const strip = (back: number, front: number): IAutoMovieVector3[] => [
    { x: -0.5, y: 0, z: back },
    { x: 0.5, y: 0, z: back },
    { x: 0.5, y: 0, z: front },
    { x: -0.5, y: 0, z: front },
  ];
  const allocate = (
    xi: number,
    delta: number,
    hip?: number,
  ): ReturnType<typeof physicalStanceAllocation.allocate> =>
    physicalStanceAllocation.allocate({
      capture: { x: 0, y: 0, z: xi },
      reference: origin,
      command: { x: 0, y: 0, z: xi * (1 + k) },
      offset: { x: 0, y: 0, z: delta },
      shrunken: strip(-0.1, 0.38),
      support: strip(-0.12, 0.4),
      ...(hip !== undefined ? { hip: (): number => hip } : {}),
    });
  const cases: [string, ReturnType<typeof allocate>, number, number][] = [
    // The trunk is served and the braking trimmed.
    ["trunk served", allocate(0.29, 0.05), 0.38, 0.33],
    // The quadruped's 0.75x push: xi 7 cm inside the shrunken edge keeps
    // the trunk before convergence.
    ["inside the band", allocate(0.31, 0.05), 0.38, 0.33],
    // Capture holds: the centre of pressure is not behind the capture point.
    ["capture held", allocate(0.36, 0.05), 0.38, 0.33],
    // A large backward offset still keeps the centre of pressure at xi.
    ["never behind", allocate(0.2, -0.3), 0.2, 0.5],
    // Past the support: the hip strategy's offset out, then back, and the
    // trunk's moment without one.
    ["hip out", allocate(0.45, 0.05, 0.1), 0.4, 0.5],
    ["hip back", allocate(0.45, 0.05, -0.1), 0.4, 0.3],
    ["no hip", allocate(0.45, 0.05), 0.4, 0.35],
  ];
  for (const [name, result, p, u] of cases) {
    near(`${name} p`, result.pressure.z, p);
    near(`${name} u`, result.pivot.z, u);
    near(
      `${name} lateral`,
      Math.abs(result.pressure.x) + Math.abs(result.pivot.x),
      0,
    );
    if (!result.clamped) failures.push(`${name} was not trimmed`);
  }
  // Room enough: the command itself, untrimmed.
  const free = allocate(0.05, 0.02);
  near("free u", free.pivot.z, 0.05 * (1 + k));
  near("free p", free.pressure.z, 0.05 * (1 + k) + 0.02);
  if (free.clamped) failures.push("a command with room was trimmed");
  // 1c. In the band, past the shrunken edge and inside the support,
  // convergence comes before the trunk as far as the hip strategy toward the
  // excess reaches: at 0.39 with -0.02 the centre of pressure takes the
  // support's edge, and the pivot goes past it to u_law = 0.39 (1 + k) under
  // a strategy reaching that far, 0.05 past it under one reaching 0.05, 0.02
  // inside it under one braking, and keeps the order inside, u = p - delta
  // = 0.42, without one, as a Human's side-by-side feet against a lateral
  // push have none.
  for (const [name, strategy, u] of [
    ["band reaching", 0.5, 0.39 * (1 + k)],
    ["band sagittal reach", 0.05, 0.45],
    ["band braking", -0.02, 0.38],
    ["band lateral without a strategy", undefined, 0.42],
  ] as const) {
    const band = allocate(0.39, -0.02, strategy);
    near(`${name} p`, band.pressure.z, 0.4);
    near(`${name} u`, band.pivot.z, u);
  }
  // Without a hip strategy the trunk's offset in the band keeps the pivot on
  // the capture point's outer side, u . n >= xi . n (Hof et al. 2005): at
  // 0.387, 0.7 cm past the shrunken edge, a trunk asking 3 cm of offset gets
  // p = 0.40 and u = 0.387, 1.3 cm, about 10 N m under 760 N.
  const lateral = allocate(0.387, 0.03);
  near("band lateral p", lateral.pressure.z, 0.4);
  near("band lateral u at xi", lateral.pivot.z, 0.387);
  near(
    "band lateral trunk moment",
    (lateral.pressure.z - lateral.pivot.z) * 760,
    0.013 * 760,
  );
  for (const delta of [0.01, 0.03, 0.08])
    if (!(allocate(0.387, delta).pivot.z >= 0.387 - 1e-12))
      failures.push(`a trunk asking ${delta} m pulls the pivot inside xi`);
  // With the reference at the shrunken edge, u_law = 0.385 + k 0.005 lies
  // inside the support and the trunk's 0.03 is trimmed to the 0.011 left.
  const trimmed = physicalStanceAllocation.allocate({
    capture: { x: 0, y: 0, z: 0.385 },
    reference: { x: 0, y: 0, z: 0.38 },
    command: { x: 0, y: 0, z: 0.385 + k * 0.005 },
    offset: { x: 0, y: 0, z: 0.03 },
    shrunken: strip(-0.1, 0.38),
    support: strip(-0.12, 0.4),
    hip: (): number => 0.1,
  });
  near("band trimmed p", trimmed.pressure.z, 0.4);
  near("band trimmed u", trimmed.pivot.z, 0.385 + k * 0.005);
  near(
    "band trunk left",
    trimmed.pressure.z - trimmed.pivot.z,
    0.4 - (0.385 + k * 0.005),
  );

  // 1e. The pivot lies within the stance hips' room of the centre of
  // pressure: a four-legged body's diagonal pair of hips, each holding 100 N m
  // either way about x and z at 0.5 m over its foot, whose feet stand 0.1 m
  // ahead of the hips, carry 300 N each: the floor's force turns each hip by
  // f (p - o) x n . x = -0.1 f, which its motor holds forward, leaving 100 -
  // 30 = 70 N m of the 100 about x (tau = J^T f; Herzog et al. 2016, Section
  // 2.1). A trunk asking 0.5 m of pivot offset under 600 N gets 140 / 600 m.
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const body = (
    position: IAutoMovieVector3,
  ): Pick<AutoMovieXpbdBody, "translation" | "rotation"> => ({
    translation: (): IAutoMovieVector3 => position,
    rotation: (): IAutoMovieQuaternion => identity,
  });
  const axis = (name: "x" | "z"): IAutoMoviePhysicalJointAxis => ({
    axis: name,
    minimum: -Math.PI,
    maximum: Math.PI,
    stiffness: 0,
    damping: 0,
    maximumTorque: 100,
    reverseTorque: 100,
    channel: name === "x" ? "flexion" : "abduction",
  });
  const hipJoint = (
    child: string,
    at: IAutoMovieVector3,
  ): IAutoMoviePhysicalJoint => ({
    id: child,
    parent: "trunk",
    child,
    parentFrame: { position: at, rotation: identity },
    childFrame: { position: { x: 0, y: 0, z: 0 }, rotation: identity },
    axes: [axis("x"), axis("z")],
  });
  const quad: Pick<IAutoMoviePhysicalProfile, "joints"> = {
    joints: [
      hipJoint("frontLeft", { x: 0.35, y: 0, z: 0.3 }),
      hipJoint("backRight", { x: -0.35, y: 0, z: -0.3 }),
    ],
  };
  const trunk: ReadonlyMap<
    string,
    Pick<AutoMovieXpbdBody, "translation" | "rotation">
  > = new Map([["trunk", body({ x: 0, y: 0.5, z: 0 })]]);
  const diagonal = (force: number) =>
    (["frontLeft", "backRight"] as const).map((bone) => ({
      limb: {
        bone,
        chain: [bone],
        phase: 0,
        duty: 0.5,
        offset: { forward: 0, left: 0 },
        stride: [{ speed: 0, length: 0 }],
      },
      point: {
        x: bone === "frontLeft" ? 0.35 : -0.35,
        y: 0,
        z: (bone === "frontLeft" ? 0.3 : -0.3) + 0.1,
      },
      force,
    }));
  const pitch: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const raw: number = physicalStanceHip.hipRoom({
    profile: quad,
    segments: trunk,
    stance: diagonal(0),
    axis: pitch,
  });
  const room: number = physicalStanceHip.hipRoom({
    profile: quad,
    segments: trunk,
    stance: diagonal(300),
    axis: pitch,
  });
  near("unloaded hips' room", raw, 200);
  near("loaded hips' room", room, 140);
  const weighed = physicalStanceAllocation.allocate({
    capture: { x: 0, y: 0, z: 0.1 },
    reference: origin,
    command: { x: 0, y: 0, z: 0.1 * (1 + k) },
    offset: { x: 0, y: 0, z: 0.5 },
    shrunken: strip(-0.1, 0.38),
    support: strip(-0.12, 0.4),
    bound: (): number => room / 600,
  });
  near("bounded p", weighed.pressure.z, 0.38);
  near(
    "bounded |u - p| F_y",
    Math.abs(weighed.pressure.z - weighed.pivot.z) * 600,
    140,
  );

  // 1d. Single support: the trunk's servo moment, its roll and pitch
  // included, and the swinging hip's torque on its thigh are the stance's
  // moment together, the hip's carried whole (Yin, Loken and van de Panne
  // 2007, Section 3.2: tau_stance = -tau_torso - tau_swing). On one sole,
  // shrunken to x in [-0.03, 0.03], z in [-0.03, 0.18], it is borne as the
  // centre of pressure's offset from the pivot, (M_z, -M_x) / F_y, kept on the
  // sole.
  const hip: IAutoMovieVector3 = { x: 3, y: 0, z: 0 };
  const sole = (back: number, front: number, side: number) => [
    { x: -side, y: 0, z: back },
    { x: side, y: 0, z: back },
    { x: side, y: 0, z: front },
    { x: -side, y: 0, z: front },
  ];
  const lift: number = 700;
  const single = (trunk: IAutoMovieVector3) => {
    const moment: IAutoMovieVector3 = trackPhysicalRoot.moment({
      trunk,
      swings: [hip],
    });
    return {
      moment,
      allocated: physicalStanceAllocation.allocate({
        capture: { x: 0, y: 0, z: 0.05 },
        reference: { x: 0, y: 0, z: 0.05 },
        command: { x: 0, y: 0, z: 0.05 },
        offset: { x: moment.z / lift, y: 0, z: -moment.x / lift },
        shrunken: sole(-0.03, 0.18, 0.03),
        support: sole(-0.05, 0.2, 0.05),
      }),
    };
  };
  const held = single({ x: -7, y: 2, z: 14 });
  near("single moment x", held.moment.x, -7 + 3);
  near("single moment z", held.moment.z, 14);
  near("single moment y", held.moment.y, 2);
  near("single served p.x", held.allocated.pressure.x, 14 / lift);
  near("single served p.z", held.allocated.pressure.z, 0.05 + 4 / lift);
  near("single served u.x", held.allocated.pivot.x, 0);
  near("single served u.z", held.allocated.pivot.z, 0.05);
  // A trunk asking 5 cm of roll room gets the sole's 3 cm on the centre of
  // pressure, the rest through the pivot; the swing hip's torque is still
  // carried whole.
  const large = single({ x: -3, y: 0, z: 35 });
  near("single room p.x", large.allocated.pressure.x, 0.03);
  near("single room u.x", large.allocated.pivot.x, 0.03 - 35 / lift);
  near("single hip whole", large.moment.x - -3, hip.x);

  TestValidator.equals("stance pressure law", failures, []);
}

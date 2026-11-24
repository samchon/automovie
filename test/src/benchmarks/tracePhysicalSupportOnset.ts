import {
  AutoMoviePhysicalBalance,
  AutoMoviePhysicalSimulation,
  Quaternion,
  Vector3,
  measurePhysicalJointLimits,
  physicalShapeBounds,
  physicalSupportPoint,
} from "@automovie/engine";
import type {
  IAutoMovieContactReceipt,
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePhysicalSupportPatch,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/** One solver receipt at its enclosing output instant, with its collider sides. */
type Contact = {
  a: IAutoMovieContactReceipt["a"];
  b: IAutoMovieContactReceipt["b"];
  sample: NonNullable<IAutoMovieContactReceipt["samples"]>[number];
};

/** A declared endpoint and any colliders that can support it. */
type Limb = IAutoMovieFootfallPattern["limbs"][number];

/**
 * Geometry and measurement shared by quiet qualification and the short onset
 * diagnostic.
 */
export namespace tracePhysicalSupportOnset {
  /** Measure the lowest world point across a declared patch's actual colliders. */
  export function patchHeight(
    profile: IAutoMoviePhysicalProfile,
    limb: Limb,
    poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
  ): number {
    return Math.min(
      ...(limb.contacts ?? [limb.bone]).map((bone: string): number =>
        carrierHeight(profile, bone, poses),
      ),
    );
  }

  /**
   * Run the exact first eighteen target intervals and publish every completed
   * frame.
   */
  export async function run(
    input: IAutoMoviePhysicalSimulationInput.IInput,
    floorOffset: number,
    reactionSeconds: number | undefined,
  ): Promise<void> {
    const steps: number = 18;
    const prefix: IAutoMoviePhysicalSimulationInput.IInput =
      structuredClone(input);
    const body: IAutoMoviePhysicalSimulationInput.IBody = prefix.bodies[0]!;
    prefix.duration = steps / input.rate;
    prefix.checkpointEvery = 1;
    body.targets.length = steps + 1;
    if (reactionSeconds !== undefined)
      body.balance!.reactionSeconds = reactionSeconds;

    const started: number = performance.now();
    const result: IAutoMoviePhysicalSimulation =
      await AutoMoviePhysicalSimulation.compute(prefix);
    const integrationMs: number = performance.now() - started;
    const contacts: Contact[][] = indexContacts(result);
    const label: string =
      reactionSeconds === undefined ? "quiet-prefix" : "delayed-reaction";
    console.log(
      JSON.stringify({
        event: "support-onset",
        provider: body.id,
        condition: label,
        mass: body.profile.mass,
        floor: prefix.floor,
        floorOffset,
        weight: -prefix.gravity.y * body.profile.mass,
        rate: prefix.rate,
        substeps: prefix.substeps,
        reactionSeconds: body.balance!.reactionSeconds ?? 0,
        recomputedSteps: result.recomputedSteps,
        integrationMs,
        firstSupportObservation:
          "Frame zero has no completed solver contacts; runtime state first published after interval one.",
        contactGeometry:
          "One representative point per collider pair and completed cache interval. Raw manifold hulls and individual native substep poses are not retained here.",
      }),
    );
    for (const [step, frame] of result.cache.frames.entries())
      console.log(
        JSON.stringify({
          event: "support-onset-frame",
          provider: body.id,
          condition: label,
          step,
          ...observeFrame(result, body, frame, step, contacts[step]!),
        }),
      );
  }
}

/**
 * Read completed native pose, causal controller state, and distinct support
 * measurements.
 */
function observeFrame(
  result: IAutoMoviePhysicalSimulation,
  body: IAutoMoviePhysicalSimulationInput.IBody,
  frame: IAutoMoviePhysicalFrame,
  step: number,
  contacts: readonly Contact[],
) {
  const { cache }: IAutoMoviePhysicalSimulation = result;
  const { profile, id }: IAutoMoviePhysicalSimulationInput.IBody = body;
  const { floor, gravity }: IAutoMoviePhysicalSimulationInput.IInput =
    result.input;
  const policy: NonNullable<
    IAutoMoviePhysicalSimulationInput.IBody["balance"]
  > = body.balance!;
  const poses: IAutoMoviePhysicalFrame["bodies"][string] = frame.bodies[id]!;
  const root: string = profile.segments[0]!.bone;
  const center: ReturnType<typeof centerOfMass> = centerOfMass(profile, poses);
  const recovery = cache.balanceCheckpoints.get(step)?.[id];
  const controller = cache.controllerCheckpoints.get(step);
  const fit = controller?.balanceTargets?.[id];
  const floorContacts = contacts.flatMap(({ a, b, sample }: Contact) => {
    const bodyIsA: boolean = a.body === id && b.body === "floor";
    const bodyIsB: boolean = b.body === id && a.body === "floor";
    if (!bodyIsA && !bodyIsB) return [];
    const { bone, shape }: IAutoMovieContactReceipt["a"] = bodyIsA ? a : b;
    const up: number = sample.normal.y * (bodyIsA ? -1 : 1);
    const impulse: number =
      sample.appliedImpulse?.[bodyIsA ? "a" : "b"] ?? sample.impulse;
    return [
      {
        bone,
        shape,
        point: sample.point,
        separation: sample.separation,
        verticalForce: (impulse * up) / sample.duration,
        touching: up > 0.5 && sample.separation <= 0,
      },
    ];
  });
  const supports: IAutoMoviePhysicalSupportPatch[] = [];
  const patches = policy.pattern.limbs.map((limb: Limb) => {
    const bones: readonly string[] = limb.contacts ?? [limb.bone];
    const samples: typeof floorContacts = floorContacts.filter(
      (contact: (typeof floorContacts)[number]): boolean =>
        bones.includes(contact.bone) && contact.touching,
    );
    const endpoint: IAutoMovieVector3 = physicalSupportPoint(
      poses[limb.bone]!,
      limb.localPoint,
    );
    if (samples.length && recovery?.swing?.bone !== limb.bone)
      supports.push({
        bone: limb.bone,
        position: endpoint,
        points: samples.map(
          (contact: (typeof floorContacts)[number]): IAutoMovieVector3 =>
            contact.point,
        ),
      });
    return {
      bone: limb.bone,
      endpoint,
      carrierGaps: Object.fromEntries(
        bones.map((bone: string) => [
          bone,
          carrierHeight(profile, bone, poses) - floor,
        ]),
      ),
      authoredGap:
        tracePhysicalSupportOnset.patchHeight(
          profile,
          limb,
          body.targets[step]!.segments,
        ) - floor,
      fittedGap: fit
        ? tracePhysicalSupportOnset.patchHeight(profile, limb, fit.targets) -
          floor
        : null,
      fitResidual: fit?.residuals[limb.bone] ?? null,
      floorLoad: samples.reduce(
        (sum: number, contact: (typeof floorContacts)[number]): number =>
          sum + contact.verticalForce,
        0,
      ),
    };
  });
  const receiptPlane: number = supports.length
    ? Math.min(
        ...supports.flatMap(
          (support: IAutoMoviePhysicalSupportPatch): number[] =>
            support.points.map((point: IAutoMovieVector3): number => point.y),
        ),
      )
    : floor;
  const receiptAssessment = AutoMoviePhysicalBalance.assess({
    ...center,
    floor: receiptPlane,
    gravity: Math.abs(gravity.y),
    supports,
    pattern: policy.pattern,
    maximumStep: policy.maximumStep,
    margin: policy.margin,
    unavailable: recovery?.swing ? [recovery.swing.bone] : [],
  });
  let anchorError: number = 0;
  let romViolation: number = 0;
  const limitViolations = profile.joints.flatMap(
    (joint: IAutoMoviePhysicalProfile["joints"][number]) => {
      const parent: IAutoMovieRigidTransform = poses[joint.parent]!;
      const child: IAutoMovieRigidTransform = poses[joint.child]!;
      anchorError = Math.max(
        anchorError,
        Vector3.length(
          Vector3.subtract(
            physicalSupportPoint(parent, joint.parentFrame.position),
            physicalSupportPoint(child, joint.childFrame.position),
          ),
        ),
      );
      return measurePhysicalJointLimits(joint, parent, child).flatMap(
        (coordinate: ReturnType<typeof measurePhysicalJointLimits>[number]) => {
          romViolation = Math.max(romViolation, coordinate.violation);
          return coordinate.violation > 0.0001
            ? [{ joint: joint.id, ...coordinate }]
            : [];
        },
      );
    },
  );
  return {
    seconds: frame.seconds,
    root: poses[root],
    center,
    patches,
    floorContacts,
    otherContacts: contacts.filter(
      ({ a, b }: Contact): boolean => a.body !== "floor" && b.body !== "floor",
    ),
    receiptAssessment: {
      plane: receiptPlane,
      capture: receiptAssessment.capturePoint,
      hull: receiptAssessment.polygon,
      outside: receiptAssessment.outside,
      state: receiptAssessment.state,
    },
    wrench:
      cache.supportWrenches.find(
        (
          value: IAutoMoviePhysicalSimulation["cache"]["supportWrenches"][number],
        ): boolean => value.body === id && value.seconds === frame.seconds,
      ) ?? null,
    anchorError,
    romViolation,
    limitViolations,
    preSolveTracking: result.tracking.filter(
      (value: IAutoMoviePhysicalSimulationInput.IDiagnostic): boolean =>
        value.body === id && value.seconds === frame.seconds,
    ),
    fit: fit
      ? { start: fit.start, revision: fit.revision, rootDrop: fit.rootDrop }
      : null,
    released: controller?.released?.includes(id) ?? null,
    softened: controller?.softened ?? null,
    recovery: recovery ?? null,
  };
}

/**
 * Group stored solver receipts by their completed output step without reading
 * future samples.
 */
function indexContacts(result: IAutoMoviePhysicalSimulation): Contact[][] {
  const contacts: Contact[][] = Array.from(
    { length: result.cache.frames.length },
    (): Contact[] => [],
  );
  for (const { a, b, samples } of result.cache.contacts)
    for (const sample of samples ?? [])
      contacts[Math.round(sample.seconds * result.cache.rate)]!.push({
        a,
        b,
        sample,
      });
  return contacts;
}

/**
 * Independently combine each segment's world mass center and transport
 * velocity.
 */
function centerOfMass(
  profile: IAutoMoviePhysicalProfile,
  poses: IAutoMoviePhysicalFrame["bodies"][string],
): { center: IAutoMovieVector3; velocity: IAutoMovieVector3 } {
  let center: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  let velocity: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const segment of profile.segments) {
    const pose: IAutoMoviePhysicalFrame["bodies"][string][string] =
      poses[segment.bone]!;
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(
      pose.rotation,
      segment.centerOfMass,
    );
    const fraction: number = segment.mass / profile.mass;
    center = Vector3.add(
      center,
      Vector3.scale(Vector3.add(pose.position, offset), fraction),
    );
    velocity = Vector3.add(
      velocity,
      Vector3.scale(
        Vector3.add(pose.velocity, Vector3.cross(pose.angularVelocity, offset)),
        fraction,
      ),
    );
  }
  return { center, velocity };
}

/**
 * Read the minimum world Y of one declared contact carrier from its measured
 * pose.
 */
function carrierHeight(
  profile: IAutoMoviePhysicalProfile,
  bone: string,
  poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
): number {
  const segment: IAutoMoviePhysicalProfile["segments"][number] | undefined =
    profile.segments.find(
      (part: IAutoMoviePhysicalProfile["segments"][number]): boolean =>
        part.bone === bone,
    );
  const pose: IAutoMovieRigidTransform | undefined = poses[bone];
  if (!segment || !pose)
    throw new Error(`Missing support geometry for ${bone}`);
  return Math.min(
    ...segment.shapes.map(
      (shape: (typeof segment.shapes)[number]): number =>
        physicalShapeBounds(pose, shape).min.y,
    ),
  );
}

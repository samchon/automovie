import type { AutoMoviePhysicsCache } from "@automovie/engine";
import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalProfile,
} from "@automovie/interface";
import * as THREE from "three";

/**
 * Review-only bones, joints and mean contact force vectors from actual physical
 * state. It is hidden initially and owns all of its GPU resources. Enabling
 * it never changes bodies, the film clock, camera or delivered render settings.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Review-only bones, joints and mean contact force vectors from actual physical state) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Review-only bones, joints and mean contact force vectors from actual physical state) directly over its typed inputs (`options`) as nested iteration of depth 2 (flatMap over options.bodies; map over body.profile.joints; flatMap over options.bodies), delegating to `Number.isSafeInteger`, `Number.isFinite`, `bonesGeometry.setAttribute`, `pointsGeometry.setAttribute`, `contactsGeometry.setAttribute`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (6 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 6, 3, 16766042, 16777215, 5, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 200 lines and 21 top-level statements that reuses `Number.isSafeInteger`, `Number.isFinite`, `bonesGeometry.setAttribute`, `pointsGeometry.setAttribute`, `contactsGeometry.setAttribute` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 3 type assertion(s), 3 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `options`; the dominant cost is nested iteration of depth 2 (flatMap over options.bodies; map over body.profile.joints; flatMap over options.bodies), performed once per call with 34 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 34 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function createAutoMoviePerformanceOverlay(options: {
  /** Scene body ids and their admitted physical descriptions. */
  bodies: { id: string; profile: IAutoMoviePhysicalProfile }[];
  /** Maximum simultaneously displayed contact episodes. */
  maximumContacts: number;
  /** Vector display length per newton of step-mean force, impulse / duration. */
  metresPerNewton: number;
}): {
  /** Hidden review group; the caller may attach it to the existing scene. */
  object: THREE.Group;
  /** Update from the same cached state the delivered figure uses. */
  update: (
    frame: AutoMoviePhysicsCache.IFrame,
    contacts: readonly IAutoMovieContactReceipt[],
  ) => void;
  /** Show bones/points and contacts independently, with no clock mutation. */
  show: (skeleton: boolean, contacts: boolean) => void;
  /** Detach and release only this overlay's resources, idempotently. */
  dispose: () => void;
} {
  if (
    !Number.isSafeInteger(options.maximumContacts) ||
    options.maximumContacts < 1 ||
    !(options.metresPerNewton > 0) ||
    !Number.isFinite(options.metresPerNewton)
  )
    throw new Error("Invalid performance overlay budgets or scale");
  const group: THREE.Group = new THREE.Group();
  group.name = "physical-performance-review";
  group.visible = false;
  const pairs: { body: string; parent: string; child: string }[] =
    options.bodies.flatMap(
      (
        body: (typeof options.bodies)[number],
      ): { body: string; parent: string; child: string }[] =>
        body.profile.joints.map(
          (
            joint: (typeof body.profile.joints)[number],
          ): { body: string; parent: string; child: string } => ({
            body: body.id,
            parent: joint.parent,
            child: joint.child,
          }),
        ),
    );
  const points: { body: string; bone: string }[] = options.bodies.flatMap(
    (body: (typeof options.bodies)[number]): { body: string; bone: string }[] =>
      body.profile.segments.map(
        (
          segment: (typeof body.profile.segments)[number],
        ): { body: string; bone: string } => ({
          body: body.id,
          bone: segment.bone,
        }),
      ),
  );
  const bonesGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
  const pointsGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
  const contactsGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
  bonesGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(pairs.length * 6), 3),
  );
  pointsGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(points.length * 3), 3),
  );
  contactsGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(options.maximumContacts * 6), 3),
  );
  const bonesMaterial: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({
    color: 0xffd45a,
    depthTest: false,
    transparent: true,
  });
  const pointsMaterial: THREE.PointsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 5,
    sizeAttenuation: false,
    depthTest: false,
    transparent: true,
  });
  const contactsMaterial: THREE.LineBasicMaterial = new THREE.LineBasicMaterial(
    { color: 0xff3860, depthTest: false, transparent: true },
  );
  const bones: THREE.LineSegments = new THREE.LineSegments(
    bonesGeometry,
    bonesMaterial,
  );
  const joints: THREE.Points = new THREE.Points(pointsGeometry, pointsMaterial);
  const impulses: THREE.LineSegments = new THREE.LineSegments(
    contactsGeometry,
    contactsMaterial,
  );
  for (const object of [bones, joints, impulses]) {
    object.frustumCulled = false;
    object.renderOrder = 10000;
    group.add(object);
  }
  let disposed: boolean = false;
  return {
    object: group,
    update: (
      frame: AutoMoviePhysicsCache.IFrame,
      contacts: readonly IAutoMovieContactReceipt[],
    ): void => {
      if (disposed) throw new Error("Performance overlay is disposed");
      const bonePositions: THREE.BufferAttribute = bonesGeometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      const jointPositions: THREE.BufferAttribute = pointsGeometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      const contactPositions: THREE.BufferAttribute =
        contactsGeometry.getAttribute("position") as THREE.BufferAttribute;
      pairs.forEach((pair: (typeof pairs)[number], index: number): void => {
        const parent: AutoMoviePhysicsCache.ISegment | undefined =
          frame.bodies[pair.body]?.[pair.parent];
        const child: AutoMoviePhysicsCache.ISegment | undefined =
          frame.bodies[pair.body]?.[pair.child];
        if (!parent || !child)
          throw new Error(`Overlay missing ${pair.body}/${pair.child}`);
        bonePositions.setXYZ(
          index * 2,
          parent.position.x,
          parent.position.y,
          parent.position.z,
        );
        bonePositions.setXYZ(
          index * 2 + 1,
          child.position.x,
          child.position.y,
          child.position.z,
        );
      });
      points.forEach((point: (typeof points)[number], index: number): void => {
        const state: AutoMoviePhysicsCache.ISegment | undefined =
          frame.bodies[point.body]?.[point.bone];
        if (!state)
          throw new Error(`Overlay missing ${point.body}/${point.bone}`);
        jointPositions.setXYZ(
          index,
          state.position.x,
          state.position.y,
          state.position.z,
        );
      });
      const active: NonNullable<IAutoMovieContactReceipt["samples"]>[number][] =
        contacts.flatMap(
          (
            receipt: (typeof contacts)[number],
          ): NonNullable<IAutoMovieContactReceipt["samples"]> => {
            if (receipt.source !== "solver") return [];
            let sample:
              | NonNullable<IAutoMovieContactReceipt["samples"]>[number]
              | undefined;
            for (
              let index: number = (receipt.samples?.length ?? 0) - 1;
              index >= 0;
              index--
            )
              if (receipt.samples![index]!.seconds <= frame.seconds + 1e-9) {
                sample = receipt.samples![index];
                break;
              }
            return sample &&
              sample.impulse > 0 &&
              Number.isFinite(sample.impulse) &&
              sample.separation <= 0 &&
              frame.seconds - sample.seconds < sample.duration
              ? [sample]
              : [];
          },
        );
      if (active.length > options.maximumContacts)
        throw new Error("Performance overlay contact budget exceeded");
      active.forEach(
        (receipt: (typeof active)[number], index: number): void => {
          if (!(receipt.duration > 0))
            throw new Error("Contact force needs a positive measured duration");
          const length: number =
            (receipt.impulse / receipt.duration) * options.metresPerNewton;
          contactPositions.setXYZ(
            index * 2,
            receipt.point.x,
            receipt.point.y,
            receipt.point.z,
          );
          contactPositions.setXYZ(
            index * 2 + 1,
            receipt.point.x + receipt.normal.x * length,
            receipt.point.y + receipt.normal.y * length,
            receipt.point.z + receipt.normal.z * length,
          );
        },
      );
      contactsGeometry.setDrawRange(0, active.length * 2);
      bonePositions.needsUpdate = true;
      jointPositions.needsUpdate = true;
      contactPositions.needsUpdate = true;
    },
    show: (skeleton: boolean, contacts: boolean): void => {
      group.visible = skeleton || contacts;
      bones.visible = skeleton;
      joints.visible = skeleton;
      impulses.visible = contacts;
    },
    dispose: (): void => {
      if (disposed) return;
      disposed = true;
      group.removeFromParent();
      for (const geometry of [bonesGeometry, pointsGeometry, contactsGeometry])
        geometry.dispose();
      for (const material of [bonesMaterial, pointsMaterial, contactsMaterial])
        material.dispose();
    },
  };
}

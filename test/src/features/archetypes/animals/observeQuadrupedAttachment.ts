import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeQuadrupedBody as Body,
  AutoMovieArchetypeQuadrupedJoints,
  type createQuadruped,
} from "@automovie/archetypes";
import { QuadrupedRidePose as Pose } from "@automovie/archetypes/internal";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieTransform, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { animalAttachmentObserver as observe } from "../../internal/animalAttachmentObserver";
import { nclose } from "../../internal/nclose";

/** The attachment observer uses a 1 nm budget for chained rigid arithmetic. */
const GEOMETRY_ROUNDOFF: number = 1e-9;

/** Compare real posed parts against the given floor and independent rigid geometry. */
export function observeQuadrupedAttachment<Id extends string, Dimension extends string>(
  animal: AutoMovieArchetype<Id, Dimension>,
  species: createQuadruped.ISpecies,
  label: string,
  findings: string[],
  height: number,
  nod: number = 2,
  handContacts: readonly string[] = [],
): void {
  const source: string = JSON.stringify(animal);
  const rig: ReturnType<typeof AutoMovieArchetypeQuadrupedJoints.read> =
    AutoMovieArchetypeQuadrupedJoints.read(animal.parts);
  const prepared: Pose.IPrepared<Id, Dimension> =
    Pose.prepare(animal, species, rig);
  const placement: IAutoMovieTransform = {
    translation: { x: 2, y: 0, z: -3 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 29),
    scale: { x: 1, y: 1, z: 1 },
  };
  const goal = (limb: Body.Limb): Pose.IGoal => {
    const endpoint: IAutoMovieVector3 = rig.limbs[limb][4]!;
    return { x: endpoint.x, z: endpoint.z, lift: 0, fold: 0 };
  };
  const grounded: Record<Body.Limb, Pose.IGoal> = {
    leftFore: goal("leftFore"),
    rightFore: goal("rightFore"),
    leftHind: goal("leftHind"),
    rightHind: goal("rightHind"),
  };
  const lift: number = height / 128;
  const raised: Record<Body.Limb, Pose.IGoal> = {
    ...grounded,
    leftFore: { ...grounded.leftFore, lift, load: 0 },
  };
  const settled: ReturnType<typeof prepared.sample> = prepared.sample(grounded, 0, 0);
  const snapshot: string = JSON.stringify(settled);
  const posed: ReturnType<typeof prepared.sample> = prepared.sample(raised, nod, 0);
  for (const [name, model, goals] of [
    ["grounded", settled, grounded],
    ["raised", posed, raised],
  ] as const) {
    const feet: ReturnType<typeof observe> = observe(
      animal,
      { archetype: model, placement },
      `${label}/${name}`,
      findings,
      handContacts,
    );
    for (const limb of Body.LIMBS) {
      const foot: observe.IFoot = feet.get(limb)!;
      const neutral: IAutoMovieVector3 = rig.limbs[limb][4]!;
      const expected: IAutoMovieVector3 = Vector3.add(
        placement.translation,
        Quaternion.rotateVector(placement.rotation, { ...neutral, y: 0 }),
      );
      TestValidator.predicate(
        `${label}/${name}/${limb} solid clearance and footprint`,
        nclose(foot.soleY, goals[limb].lift, GEOMETRY_ROUNDOFF) &&
          nclose(foot.point.x, expected.x, GEOMETRY_ROUNDOFF) &&
          nclose(foot.point.z, expected.z, GEOMETRY_ROUNDOFF),
      );
    }
  }
  const before: IAutoMovieTransform = settled.parts.find((p) => p.id === "head")!.transform!;
  const after: IAutoMovieTransform = posed.parts.find((p) => p.id === "head")!.transform!;
  const dot: number = before.rotation.x * after.rotation.x + before.rotation.y * after.rotation.y +
    before.rotation.z * after.rotation.z + before.rotation.w * after.rotation.w;
  TestValidator.predicate(`${label} requested nod moves the head`, Math.abs(dot) < 1 - 1e-8);

  for (const contact of posed.affordances) {
    const actual: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(placement, contact.frame);
    const expected: IAutoMovieVector3 = Vector3.add(
      placement.translation,
      Quaternion.rotateVector(placement.rotation, contact.frame.translation),
    );
    TestValidator.predicate(`${label}/${contact.id} world placement`,
      Vector3.length(Vector3.subtract(actual.translation, expected)) <= GEOMETRY_ROUNDOFF,
    );
    if (contact.id !== "seat" && contact.id !== "hitch" && contact.id !== "leftLoad" && contact.id !== "rightLoad") continue;
    const frame: IAutoMovieTransform | undefined = prepared.frame(raised, nod, 0, contact.id);
    TestValidator.predicate(`${label}/${contact.id} carrier-only projection`,
      frame !== undefined &&
        Vector3.length(Vector3.subtract(frame.translation, contact.frame.translation)) <= GEOMETRY_ROUNDOFF &&
        nclose(Math.abs(frame.rotation.x * contact.frame.rotation.x + frame.rotation.y * contact.frame.rotation.y +
          frame.rotation.z * contact.frame.rotation.z + frame.rotation.w * contact.frame.rotation.w), 1, GEOMETRY_ROUNDOFF),
    );
  }
  posed.parts[0]!.transform!.translation.x += 10;
  posed.affordances[0]!.frame.translation.z += 10;
  TestValidator.predicate(`${label} out-of-order sample ownership`,
    JSON.stringify(animal) === source && JSON.stringify(prepared.sample(grounded, 0, 0)) === snapshot,
  );
}

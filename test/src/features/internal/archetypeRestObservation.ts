import {
  type AutoMovieArchetype,
  AutoMovieArchetypeQuadrupedBody,
  AutoMovieArchetypeQuadrupedRest,
  type AutoMovieArchetypeQuadrupedRestPlan,
} from "@automovie/archetypes";
import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "./nclose";
import { qclose } from "./qclose";
import { vclose } from "./vclose";

/**
 * Actual-geometry observations shared by the rest unit's two source bodies.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Exposes the bounded authored cycle observation, source endpoint measurement and typed negative-case refusal; their members state metre frames, ownership and expected outcomes.
 * @evidence contracts/development/design.md#principled-representation Current actual archetypes and primitive transforms are observed directly in model metres; the existing rest plan and model types remain their owners.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only verify, endpoint and refuses are exported because the rest unit consumes those operations; sole, mesh and local-frame arithmetic stay private here.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No fixture-specific expected pose, species dispatch, widened contact identity or implementation patch is represented; the explicit two/one/two-second test clock is documented on verify.
 */
export namespace archetypeRestObservation {
  /**
   * Observe the authored two/one/two-second cycle through actual model data.
   *
   * @param name Specimen name included in each diagnostic.
   * @param animal Actual independent primitive source model, metres.
   * @param params The test's explicit supported clock, floor and carriers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the authored clock, actual primitive source, metre frame and per-specimen diagnostics; observations cover bar lengths, support, contacts, recovery and deterministic independent results.
   * @evidence contracts/development/implementation.md#principled-implementation Measure current bar endpoints, renderer-owned primitive vertices and carrier-local contacts against the original actual model. Exact terminal rim and torso capsule support supplement polygon sampling without allowing a physical gap.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare source observations once, sweep the bounded cycle and events, then compare standing recovery, unordered seeking and source immutability.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every success invokes the actual public sampler; no fallback, runtime replacement, measured-clinical claim or implementation-produced expected pose is used.
   * @evidence contracts/development/implementation.md#efficient-algorithms A fixed sample count visits all P parts and V primitive vertices per sample; source tessellations are prepared once, giving O(P+V) retained observation data.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Original bar records and local tessellations serve every current transform; each sample remains a fresh public-law evaluation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources All source maps, meshes and sampled models are call-local and released after the assertion pass; no host, process, file or global cache is acquired.
   */
  export function verify(
    name: string,
    animal: AutoMovieArchetype,
    params: AutoMovieArchetypeQuadrupedRestPlan.IParams,
  ): void {
    const original: string = JSON.stringify(animal);
    const clip: AutoMovieArchetypeQuadrupedRestPlan.IClip<string, string> =
      AutoMovieArchetypeQuadrupedRest.plan(animal, params);
    const source: Map<string, IAutoMovieModelPart> = new Map(
      animal.parts.map(
        (part: IAutoMovieModelPart): [string, IAutoMovieModelPart] => [
          part.id,
          part,
        ],
      ),
    );
    const vertices: Map<string, readonly number[]> = new Map(
      animal.parts.map(
        (part: IAutoMovieModelPart): [string, readonly number[]] => {
          if (part.geometry.type !== "primitive")
            throw new Error("The actual specimen must be primitive");
          return [part.id, AutoMovieEngineGeometry.tessellate(part.geometry.shape).positions];
        },
      ),
    );
    const times: number[] = [
      ...new Set([
        ...Array.from(
          { length: 33 },
          (_: unknown, index: number): number => (clip.duration * index) / 32,
        ),
        clip.events.bellyOn,
        clip.events.riseStart,
        2.5,
        clip.events.bellyOff,
        clip.events.standing,
      ]),
    ].sort((a: number, b: number): number => a - b);
    TestValidator.predicate(
      `${name} authored duration`,
      nclose(clip.duration, 5, 1e-12),
    );
    for (const time of times) {
      const sample: AutoMovieArchetypeQuadrupedRestPlan.ISample<
        string,
        string
      > = clip.sample(time);
      const current: Map<string, IAutoMovieModelPart> = new Map(
        sample.animal.parts.map(
          (part: IAutoMovieModelPart): [string, IAutoMovieModelPart] => [
            part.id,
            part,
          ],
        ),
      );
      for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
        const chain: readonly AutoMovieArchetypeQuadrupedBody.Bone[] =
          AutoMovieArchetypeQuadrupedBody.BONES[limb];
        const top: IAutoMovieVector3 = endpoint(source.get(chain[0]!)!, -1);
        TestValidator.predicate(
          `${name} ${time} ${limb} shares one root`,
          vclose(
            endpoint(current.get(chain[0]!)!, -1),
            placed(sample.root, top),
            1e-9,
          ),
        );
        for (let index: number = 0; index < chain.length; index++) {
          const bone: AutoMovieArchetypeQuadrupedBody.Bone = chain[index]!;
          const part: IAutoMovieModelPart = current.get(bone)!;
          const length: number = AutoMovieEngineVector3.length(
            AutoMovieEngineVector3.subtract(endpoint(part, 1), endpoint(part, -1)),
          );
          const old: number = AutoMovieEngineVector3.length(
            AutoMovieEngineVector3.subtract(
              endpoint(source.get(bone)!, 1),
              endpoint(source.get(bone)!, -1),
            ),
          );
          TestValidator.predicate(
            `${name} ${time} ${bone} keeps actual length`,
            nclose(length, old, 1e-9),
          );
          if (index !== chain.length - 1)
            TestValidator.predicate(
              `${name} ${time} ${bone} keeps its child joint`,
              vclose(
                endpoint(part, 1),
                endpoint(current.get(chain[index + 1]!)!, -1),
                1e-9,
              ),
            );
        }
        const terminal: IAutoMovieModelPart = current.get(chain[3]!)!;
        const foot: IAutoMovieVector3 = endpoint(terminal, 1);
        const oldFoot: IAutoMovieVector3 = endpoint(source.get(chain[3]!)!, 1);
        TestValidator.predicate(
          `${name} ${time} fixed terminal X/Z`,
          nclose(foot.x, oldFoot.x, 1e-9) && nclose(foot.z, oldFoot.z, 1e-9),
        );
        TestValidator.predicate(
          `${name} ${time} exact actual sole on floor`,
          nclose(sole(terminal), params.floorY, 1e-9),
        );
      }
      for (const part of sample.animal.parts) {
        const low: number = minimumVertex(
          part.transform!,
          vertices.get(part.id)!,
        );
        TestValidator.predicate(
          `${name} ${time} rendered ${part.id} stays above floor`,
          low >= params.floorY - 1e-9,
        );
      }
      if (time >= 2 && time <= 3) {
        const trunk: IAutoMovieModelPart = current.get("trunk")!;
        if (
          trunk.geometry.type !== "primitive" ||
          trunk.geometry.shape.type !== "capsule"
        )
          throw new Error("The source torso must remain its actual capsule");

        // A pitched capsule's analytic lowest point can lie between renderer
        // lattice vertices. Its spherical end radius fixes actual support;
        // the separate vertex pass above still checks the drawn surface.
        const belly: number =
          Math.min(endpoint(trunk, -1).y, endpoint(trunk, 1).y) -
          trunk.geometry.shape.radius;
        TestValidator.predicate(
          `${name} ${time} actual belly support`,
          sample.bellySupported && nclose(belly, params.floorY, 1e-9),
        );
      }
      TestValidator.equals(
        `${name} source contact identities`,
        sample.animal.affordances.map(
          (contact: IAutoMovieAffordance): string => contact.id,
        ),
        animal.affordances.map(
          (contact: IAutoMovieAffordance): string => contact.id,
        ),
      );
      for (const old of animal.affordances) {
        const contact: IAutoMovieAffordance = sample.animal.affordances.find(
          (item: IAutoMovieAffordance): boolean => item.id === old.id,
        )!;
        const carrier: AutoMovieArchetypeQuadrupedBody.Bone =
          params.contacts[old.id]!;
        const oldFrame: IAutoMovieTransform = local(
          source.get(carrier)!.transform!,
          old.frame,
        );
        const newFrame: IAutoMovieTransform = local(
          current.get(carrier)!.transform!,
          contact.frame,
        );
        TestValidator.predicate(
          `${name} ${time} carried contact ${old.id}`,
          vclose(newFrame.translation, oldFrame.translation, 1e-9) &&
            qclose(newFrame.rotation, oldFrame.rotation, 1e-9),
        );
        const { frame: oldPosition, ...oldMeaning }: IAutoMovieAffordance = old;
        const { frame: newPosition, ...newMeaning }: IAutoMovieAffordance =
          contact;
        TestValidator.equals(
          `${name} ${time} contact semantics`,
          oldMeaning,
          newMeaning,
        );
        if (time === 2.5)
          TestValidator.predicate(
            `${name} ${old.id} current world frame moved`,
            !vclose(oldPosition.translation, newPosition.translation, 1e-3),
          );
      }
    }
    const first: AutoMovieArchetypeQuadrupedRestPlan.ISample<string, string> =
      clip.sample(0);
    const recovered: AutoMovieArchetypeQuadrupedRestPlan.ISample<
      string,
      string
    > = clip.sample(clip.duration);
    for (let index: number = 0; index < first.animal.parts.length; index++) {
      const a: IAutoMovieTransform = first.animal.parts[index]!.transform!;
      const b: IAutoMovieTransform = recovered.animal.parts[index]!.transform!;
      TestValidator.predicate(
        `${name} standing recovers actual part`,
        vclose(a.translation, b.translation, 1e-9) &&
          qclose(a.rotation, b.rotation, 1e-9),
      );
    }
    const beforeSeek: string = JSON.stringify(clip.sample(2.5).animal);
    for (const time of [5, 0, 4.5, 1, 3]) clip.sample(time);
    TestValidator.equals(
      `${name} sample order cannot change actual geometry`,
      JSON.stringify(clip.sample(2.5).animal),
      beforeSeek,
    );
    first.animal.parts[0]!.transform!.translation.x += 1;
    TestValidator.equals(
      `${name} source model remains immutable`,
      JSON.stringify(animal),
      original,
    );
    TestValidator.equals(
      `${name} independent sample transforms`,
      JSON.stringify(clip.sample(2.5).animal),
      beforeSeek,
    );
  }

  /**
   * Measure an actual bar endpoint from its primitive transform, metres.
   *
   * @param part The actual transformed cylinder or capsule.
   * @param side Minus one selects its upper joint; plus one selects its lower.
   * @returns The endpoint in the model's current frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States primitive admission, signed endpoint convention, metre output and current-frame interpretation.
   * @evidence contracts/development/implementation.md#principled-implementation Rotate the signed local half-height about the actual centre and translate; this is the producer's bar endpoint convention.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the bar shape and delegate the one rigid point placement to this observation owner's helper.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads actual geometry and current transforms without a species table, fitted point, padded extent or rest-law helper.
   * @evidence contracts/development/implementation.md#efficient-algorithms One quaternion/vector placement takes constant work and one returned point.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each current part determines its own endpoint; a completed point from another transform is not reused.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the returned point; no state or external resource is retained.
   */
  export function endpoint(
    part: IAutoMovieModelPart,
    side: -1 | 1,
  ): IAutoMovieVector3 {
    if (
      part.geometry.type !== "primitive" ||
      (part.geometry.shape.type !== "cylinder" &&
        part.geometry.shape.type !== "capsule")
    )
      throw new Error("Expected an actual bar");
    return placed(part.transform!, {
      x: 0,
      y: (side * part.geometry.shape.height) / 2,
      z: 0,
    });
  }

  /** Exact lower terminal rim or capsule end, independently measured from the actual pose. */
  function sole(part: IAutoMovieModelPart): number {
    if (
      part.geometry.type !== "primitive" ||
      (part.geometry.shape.type !== "cylinder" &&
        part.geometry.shape.type !== "capsule")
    )
      throw new Error("Expected an actual terminal bar");
    const axis: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      part.transform!.rotation,
      { x: 0, y: 1, z: 0 },
    );
    return (
      endpoint(part, 1).y -
      part.geometry.shape.radius *
        (part.geometry.shape.type === "capsule"
          ? 1
          : Math.hypot(axis.x, axis.z))
    );
  }

  /** A direct transformed-vertex observation follows the same primitive geometry the renderer consumes. */
  function minimumVertex(
    frame: IAutoMovieTransform,
    positions: readonly number[],
  ): number {
    let lowest: number = Infinity;
    for (let index: number = 0; index < positions.length; index += 3)
      lowest = Math.min(
        lowest,
        placed(frame, {
          x: positions[index]!,
          y: positions[index + 1]!,
          z: positions[index + 2]!,
        }).y,
      );
    return lowest;
  }

  /** Rigid point placement is independent of the rest law's skeleton/IK helpers. */
  function placed(
    frame: IAutoMovieTransform,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return AutoMovieEngineVector3.add(
      frame.translation,
      AutoMovieEngineQuaternion.rotateVector(frame.rotation, point),
    );
  }

  /** Carrier-local contact coordinates must remain invariant under the current rigid pose. */
  function local(
    carrier: IAutoMovieTransform,
    contact: IAutoMovieTransform,
  ): IAutoMovieTransform {
    return {
      translation: AutoMovieEngineQuaternion.rotateVector(
        AutoMovieEngineQuaternion.inverse(carrier.rotation),
        AutoMovieEngineVector3.subtract(contact.translation, carrier.translation),
      ),
      rotation: AutoMovieEngineQuaternion.multiply(
        AutoMovieEngineQuaternion.inverse(carrier.rotation),
        contact.rotation,
      ),
      scale: { x: 1, y: 1, z: 1 },
    };
  }

  /**
   * Require a bounded RangeError instead of a fallback or unrelated failure.
   *
   * @param run One synchronous negative public-API case.
   * @returns Whether that case threw RangeError.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the expected exception class, synchronous callback ownership and false result for success or another failure.
   * @evidence contracts/development/implementation.md#principled-implementation Execute the supplied negative case once and distinguish its exception through the language's instanceof operator.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One try/catch and one false return expose all three outcomes directly.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No foreign method replacement, retry, swallowed success or broad any-error acceptance can satisfy the expected refusal.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant wrapper work beyond the one supplied callback; no traversal or result table is created.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each negative input is executed independently because its actual failure is the observation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The callback and exception remain call-local; no task, handle, cache or model is retained.
   */
  export function refuses(run: () => void): boolean {
    try {
      run();
    } catch (error) {
      return error instanceof RangeError;
    }
    return false;
  }
}

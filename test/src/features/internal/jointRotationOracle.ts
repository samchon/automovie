import {
  Quaternion,
  clampJointRom,
  jointRomOvershoot,
  jointToQuaternion,
  normalizeJointAxes,
  prepareJointRotationProjection,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "./nclose";
import { qclose } from "./qclose";

/**
 * Independent expectations and observations shared by the box, degeneracy and
 * actual-Human regressions. Expected rotations follow the documented axis-angle
 * convention, never producer candidates.
 */
export namespace jointRotationOracle {
  /**
   * The unchanged joint contract for projection and recomposition.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the bone, normalized axes, clinical domain and optional rest map.
   * @evidence contracts/development/design.md#principled-representation Existing engine/interface records preserve units and the matching-clamp premise.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Every input is consumed by projection, its clamp or expected composition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the actual domain and affine rest records without a duplicate numerical model.
   */
  export interface IRig {
    /** Joint named by every result. */
    bone: AutoMovieHumanoidBone;

    /** Normalized axes and factor order. */
    basis: IAutoMovieJointAxes;

    /** Clinical degree intervals and optional coupled gate. */
    constraint: IAutoMovieJointConstraint;

    /** Clinical-to-rig affine map; absent is identity. */
    frame?: IAutoMovieRestFrame | undefined;
  }

  /**
   * One test entry's observations, retaining each failed case's name.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Methods collect predicates, isolate exceptions, observe both signs and finish an entry.
   * @evidence contracts/development/design.md#principled-representation Typed observations and joint results remain separate from expected geometry.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Each operation is consumed by the three coherent regression entries.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No foreign method or global is replaced to observe a query.
   */
  export interface IChecks {
    /**
     * Retain a failed observable predicate for this entry's final assertion.
     * The collector returned by of() owns the diagnostics; a false predicate
     * records its label without ending the other cases.
     *
     * @param label The failed observation's diagnostic name.
     * @param condition The already measured observable predicate.
     * @evidence contracts/development/common.md#meaningful-documentation States the predicate input, deferred failure and diagnostic ownership.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This signature has no body; of() implements conditional diagnostic collection.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This contract declares no control flow; of() owns the failure list and append.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This signature performs no computation; of() records the supplied predicate without changing an expectation.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms No algorithm is implemented here; of().check appends once only when the predicate fails.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no work; of() binds observations to one entry without a query cache.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No resource is acquired by the signature; of() owns the entry-local diagnostic lifetime.
     */
    check(label: string, condition: boolean): void;

    /**
     * Run one synchronous scenario and collect its unexpected exception's
     * diagnostic under the supplied label. The of() collector lets the entry
     * continue other scenarios before its final assertion.
     *
     * @param label The scenario's diagnostic name.
     * @param task The synchronous test case to observe.
     * @evidence contracts/development/common.md#meaningful-documentation States synchronous execution, exception collection and the final-assertion boundary.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This signature has no body; of() owns the synchronous try/catch and diagnostic conversion.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The contract contains no execution flow; of().scenario implements the isolated case boundary.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No callback or foreign method is replaced here; of() directly invokes the supplied test case.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms No algorithm is implemented by the signature; of() invokes the task once and records a caught diagnostic.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This contract shares no scenario execution; of() invokes every declared task independently.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature retains no task or handle; of() owns only this entry's collected diagnostic strings.
     */
    scenario(label: string, task: () => void): void;

    /**
     * Observe both signs of a target through one prepared projector whose
     * normalized basis, rest map and actual clamp share the unchanged rig.
     * Domain checks always apply; optional physical rotation and unitless
     * half-angle-cosine expectations add their existing precision checks.
     * Projection errors propagate to the caller's scenario boundary.
     *
     * @param label The query's diagnostic name.
     * @param rig The matching immutable joint domain and composition inputs.
     * @param target The requested bone-local articulation quaternion.
     * @param expected Optional independently expected physical rotation.
     * @param expectedScore Optional independently expected normalized score.
     * @returns The actual joint returned for the positive-sign target.
     * @evidence contracts/development/common.md#meaningful-documentation States rig equivalence, both-sign queries, optional expectations, score units and returned joint.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This signature has no solver body; of().run owns matching public clamp/projection calls and actual recomposition.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The signature only declares the query contract; of() implements preparation, both observations and result return.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No expectation or domain is altered here; of().run checks actual outputs against caller-supplied independent geometry.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms No algorithm runs in the signature; of().run makes exactly two queries of one prepared projector.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reuse is implemented in of().run, which shares preparation only while the supplied rig contract remains unchanged.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature owns no prepared closure; of().run keeps it query-local and of() retains only entry diagnostics.
     */
    run(
      label: string,
      rig: IRig,
      target: IAutoMovieQuaternion,
      expected?: IAutoMovieQuaternion,
      expectedScore?: number,
    ): IAutoMovieJointPose;

    /**
     * Assert all observations accumulated by this collector. The of()
     * implementation returns normally when no diagnostic was recorded and
     * raises the TestValidator failure otherwise.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the aggregate assertion and its normal/failure outcomes.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This signature has no assertion body; of().assert delegates the final failure predicate to TestValidator.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This contract declares only the entry boundary; of() constructs the diagnostic message and final predicate.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No failure is filtered by this signature; of().assert judges the complete collected list.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms No algorithm is implemented here; of().assert assembles the finite entry's diagnostic message once per call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The signature performs no cached work; of().assert reads the collector's current observations.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resource; of() owns diagnostics until the entry releases its collector after return or failure.
     */
    assert(): void;
  }

  /**
   * Clinical field order, used only for coordinates and domains.
   *
   * Names the degree-valued coordinates in their tuple order.
   */
  export const AXES: readonly ("flexion" | "abduction" | "twist")[] = [
    "flexion",
    "abduction",
    "twist",
  ];

  /**
   * Absolute score precision exposing the near-equal case's 1e-8 improvement;
   * this numerical comparison is not a physical angular allowance.
   *
   * Distinguishes normalized-score precision from physical angles.
   */
  export const SCORE_PRECISION: number = 1e-12;

  /**
   * Immutable normalized F=X, A=Y, T=Z fixture shared by the three entries.
   *
   * States the fixed orthonormal axis convention and record lifetime.
   */
  export const CANONICAL: IAutoMovieJointAxes = normalizeJointAxes(
    {
      flexion: { x: 1, y: 0, z: 0 },
      abduction: { x: 0, y: 1, z: 0 },
      twist: { x: 0, y: 0, z: 1 },
    },
    "test rotation basis",
  );

  /**
   * Bind a mathematical test joint without altering its domain.
   *
   * @param constraint Clinical degree domain.
   * @param basis Admitted normalized axes; canonical by default.
   * @param frame Optional affine clinical rest convention.
   * @returns Matching projector and quaternion inputs.
   * @evidence contracts/development/common.md#meaningful-documentation States inputs, defaults and the matching-contract result.
   * @evidence contracts/development/implementation.md#principled-implementation Retains the supplied rig records unchanged in one typed fixture.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record holds inputs shared by the observer and expected composition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No domain or precision is inferred from an observed result.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant-size fixture construction has no algorithmic choice.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Tests use this same unchanged contract for clamp, projection and composition.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a record and retains no state.
   */
  export function rig(
    constraint: IAutoMovieJointConstraint,
    basis: IAutoMovieJointAxes = CANONICAL,
    frame?: IAutoMovieRestFrame,
  ): IRig {
    return { bone: "leftHand", constraint, basis, frame };
  }

  /**
   * Compose expected clinical coordinates by documented rigid factors.
   *
   * @param angles Flexion, abduction and twist, clinical degrees.
   * @param input Axis order and affine rest convention.
   * @returns Expected bone-local articulation.
   * @evidence contracts/development/common.md#meaningful-documentation States tuple order, degree units and the local quaternion frame.
   * @evidence contracts/development/implementation.md#principled-implementation Explicitly inverts clinical=sign*rig+neutral and composes the declared proximal or distal axis-angle factors.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three affine conversions feed one ordered rigid composition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads no projector candidate, inverse output or fitted snapshot.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Three factors and two quaternion products are constant-size work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The three test responsibilities share one expected-geometry convention.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a quaternion without retaining inputs.
   */
  export function compose(
    angles: readonly [number, number, number],
    input: IRig,
  ): IAutoMovieQuaternion {
    const parts: IAutoMovieQuaternion[] = AXES.map(
      (
        axis: "flexion" | "abduction" | "twist",
        index: number,
      ): IAutoMovieQuaternion => {
        const frame: IAutoMovieRestFrame[typeof axis] = input.frame?.[axis];
        const value: number =
          frame === undefined
            ? angles[index]!
            : (angles[index]! - frame.neutral) / frame.sign;
        return Quaternion.fromAxisAngle(input.basis[axis], value);
      },
    );
    return input.basis.twistPlacement === "distal"
      ? Quaternion.multiply(
          parts[1]!,
          Quaternion.multiply(parts[0]!, parts[2]!),
        )
      : Quaternion.multiply(
          parts[2]!,
          Quaternion.multiply(parts[1]!, parts[0]!),
        );
  }

  /**
   * Read cosine of half the physical rotation distance, invariant under q sign.
   *
   * @param actual Recomposed actual articulation.
   * @param target Requested articulation.
   * @returns Unitless normalized physical score.
   * @evidence contracts/development/common.md#meaningful-documentation Names the quaternion inputs and half-distance cosine's units.
   * @evidence contracts/development/implementation.md#principled-implementation Reads geodesic angle and cos(theta/2) instead of copying the producer's four-term dot comparison.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Normalize both rotations, read the angle and halve it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No matrix, rank classification or candidate bookkeeping supplies the score.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant-size quaternion distance and one cosine.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Degeneracy and fallback checks share this physical observation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no query state.
   */
  export function score(
    actual: IAutoMovieQuaternion,
    target: IAutoMovieQuaternion,
  ): number {
    return Math.cos(
      Quaternion.angle(
        Quaternion.normalize(actual),
        Quaternion.normalize(target),
      ) / 2,
    );
  }

  /**
   * Collect an entry's complete observations before its final assertion.
   *
   * @returns A fresh collector with unchanged quaternion/domain checks.
   * @evidence contracts/development/common.md#meaningful-documentation States failure accumulation, scenario isolation and actual recomposition for both signs.
   * @evidence contracts/development/implementation.md#principled-implementation Calls the public projector with its matching clamp and independently observes axis intervals, actual ROM and expected physical rotation or score.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One local failure list supports predicates, scenarios, real queries and a final assertion.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Replaces no foreign method and accepts neither producer candidates nor relaxed domains as expectations.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each run makes two bounded real queries; diagnostics grow only with the entry's finite declared cases.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both sign queries share one prepared projector with unchanged rig inputs.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each entry owns local diagnostics until assert returns or throws; no global query history or external resource is retained.
   */
  export function of(): IChecks {
    const failures: string[] = [];
    const check: (label: string, condition: boolean) => void = (
      label: string,
      condition: boolean,
    ): void => {
      if (!condition) failures.push(label);
    };
    return {
      check,
      scenario(label: string, task: () => void): void {
        try {
          task();
        } catch (error) {
          failures.push(`${label}: ${String(error)}`);
        }
      },
      run(
        label: string,
        input: IRig,
        target: IAutoMovieQuaternion,
        expected?: IAutoMovieQuaternion,
        expectedScore?: number,
      ): IAutoMovieJointPose {
        const clamp: (joint: IAutoMovieJointPose) => IAutoMovieJointPose = (
          joint: IAutoMovieJointPose,
        ): IAutoMovieJointPose =>
          clampJointRom(joint, input.constraint, {
            axes: input.basis,
            frame: input.frame,
          });
        const project: (rotation: IAutoMovieQuaternion) => IAutoMovieJointPose =
          prepareJointRotationProjection({
            domain: { bone: input.bone, constraint: input.constraint },
            basis: input.basis,
            frame: input.frame,
            clamp,
          });
        let positive: IAutoMovieJointPose | undefined;
        for (const sign of [1, -1]) {
          const wanted: IAutoMovieQuaternion = {
            x: target.x * sign,
            y: target.y * sign,
            z: target.z * sign,
            w: target.w * sign,
          };
          const result: IAutoMovieJointPose = project(wanted);
          if (sign === 1) positive = result;
          const actual: IAutoMovieQuaternion = Quaternion.normalize(
            jointToQuaternion(result, input.basis, input.frame),
          );
          check(
            `${label} sign ${sign}: bone identity`,
            result.bone === input.bone,
          );
          check(
            `${label} sign ${sign}: finite legal axes`,
            AXES.every((axis: "flexion" | "abduction" | "twist"): boolean => {
              const value: number = result[axis] ?? 0;
              const range: IAutoMovieJointConstraint[typeof axis] =
                input.constraint[axis];
              return range === null
                ? value === 0
                : value >= range.min && value <= range.max;
            }),
          );
          check(
            `${label} sign ${sign}: actual ROM gate`,
            nclose(
              jointRomOvershoot(result, input.constraint, {
                axes: input.basis,
                frame: input.frame,
              }),
              0,
            ),
          );
          if (expected !== undefined)
            check(
              `${label} sign ${sign}: actual nearest quaternion`,
              qclose(actual, expected) &&
                nclose(Quaternion.angle(actual, expected), 0),
            );
          if (expectedScore !== undefined)
            check(
              `${label} sign ${sign}: analytic maximum ${expectedScore}, read ${score(actual, wanted)}`,
              nclose(score(actual, wanted), expectedScore, SCORE_PRECISION),
            );
        }
        if (positive === undefined)
          throw new Error("The positive quaternion query was not evaluated");
        return positive;
      },
      assert(): void {
        TestValidator.predicate(
          `joint rotation projection: ${failures.join("\n")}`,
          (): boolean => failures.length === 0,
        );
      },
    };
  }
}

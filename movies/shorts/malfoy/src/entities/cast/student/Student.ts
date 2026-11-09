import { AutoMovieComposition } from "@automovie/engine";

import type { IBodyMeasure } from "../../../laws/body/IBodyMeasure";
import type { IStudentProfile } from "./IStudentProfile";
import { StudentBody } from "./StudentBody";
import { StudentChain } from "./StudentChain";
import { StudentHuman } from "./StudentHuman";

/**
 * A student of the films, built from a settings record: identity, the body
 * lengths the laws scale from, and every capability of `StudentChain` as a
 * method that starts a new chain, so a scene writes
 * `carina.walkTo("benchFront").offer(note, harry)`. The student holds no
 * pose, position or time; the stage resolves those from the chained intents.
 * Its Human body and polygon figure are built by the stage when it mounts
 * (`StudentBody`, `StudentFigure`), so laws and tests use the student alone.
 *
 * ```ts
 * const carina = new Student(carinaMalfoy);
 * const harry = new Student(harryPotter);
 * then(carina.enter("startingPlace", { facing: "bench.centre", holds: { right: "note" } }), harry.walkTo(carina, { distance: "conversation" }));
 * ```
 *
 * @evidence docs/body/settings/cast/carina-malfoy.md#measures The stature the measures scale from.
 * @evidence docs/body/settings/cast/harry-potter.md#measures The stature the measures scale from.
 * @evidence docs/body/settings/crowds/practice-teams.md#players Each player's stature.
 * @evidence contracts/development/entities.md#settings-realization Measures are read from the student's Human body built from the record's parameters and stature; habits come from the record.
 * @evidence contracts/development/entities.md#object-shape A frozen class constructed only from its record, whose capabilities return intent chains.
 * @evidence contracts/development/entities.md#controls-and-source Controls are the record's Human parameters, rebuilt by the stage from the same source.
 * @evidence contracts/development/common.md#meaningful-documentation States what the student holds and what it leaves to the stage.
 * @evidence contracts/development/design.md#principled-representation Identity, record and measures in metres; no mutable state.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The chain methods are the vocabulary's own, delegated, so one owner defines each verb.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No scene is named.
 */
export class Student {
  /** Stable subject id. */
  public readonly id: string;

  /** The settings record. */
  public readonly profile: IStudentProfile;

  /** Body lengths the motion laws scale from. */
  public readonly measure: IBodyMeasure;

  /** The student's Human skeleton segments, which `body()` solves with. */
  public readonly skeleton: StudentHuman.ISkeletonPoints;

  /**
   * Build a student.
   *
   * @param profile The settings record.
   */
  public constructor(profile: IStudentProfile) {
    this.id = profile.id;
    this.profile = profile;
    // Measured on the student's own Human body, so laws scale from the body that is drawn.
    this.measure = StudentHuman.measure(profile);
    this.skeleton = StudentHuman.points(profile);
    Object.freeze(this);
  }

  /** @returns The student's solver on its own Human skeleton, so solved and drawn joints coincide. */
  public body(): StudentBody {
    return new StudentBody(this.measure, this.skeleton);
  }

  /** @returns An empty chain of this student. */
  public chain(): StudentChain {
    return new StudentChain(AutoMovieComposition.sequence(), this.id);
  }

  /** @returns Whether the student's settings carry a habit. */
  public has(habit: string): boolean {
    return this.profile.habits.includes(habit);
  }
}

/** Every capability of a student's chain, started from the student itself. */
export interface Student
  extends Omit<StudentChain, "node" | "subject" | "next" | "with"> {}

// Each vocabulary method of the chain classes is also a method of the
// student that starts an empty chain and calls it, so the verb has one owner.
for (
  let proto: object | null = StudentChain.prototype;
  proto !== null && proto !== Object.prototype;
  proto = Object.getPrototypeOf(proto) as object | null
)
  for (const name of Object.getOwnPropertyNames(proto)) {
    if (
      ["constructor", "derive", "next", "with"].includes(name) ||
      name in Student.prototype
    )
      continue;
    Object.defineProperty(Student.prototype, name, {
      value: function (this: Student, ...args: unknown[]): unknown {
        const chain: StudentChain = this.chain();
        const method = (chain as unknown as Record<string, (...a: unknown[]) => unknown>)[name]!;
        return method.apply(chain, args);
      },
      writable: false,
      enumerable: false,
    });
  }

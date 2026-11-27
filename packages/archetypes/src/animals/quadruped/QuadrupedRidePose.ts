import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieAffordance, IAutoMovieModelPart, IAutoMovieTransform, IAutoMovieVector3 } from "@automovie/interface";
import { type AutoMovieArchetype, AutoMovieArchetypeFrame, type AutoMovieArchetypeSpan } from "../../core";
import { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import type { AutoMovieArchetypeQuadrupedFooting } from "../AutoMovieArchetypeQuadrupedFooting";
import type { AutoMovieArchetypeQuadrupedJoints } from "../AutoMovieArchetypeQuadrupedJoints";
import type { AutoMovieArchetypeQuadrupedLimb } from "../AutoMovieArchetypeQuadrupedLimb";
import { AutoMovieArchetypeQuadrupedRootRange } from "../AutoMovieArchetypeQuadrupedRootRange";
import { PrepareQuadrupedPose } from "./PrepareQuadrupedPose";
import { QuadrupedCarriage } from "./QuadrupedCarriage";
import { QuadrupedPelvis } from "./QuadrupedPelvis";
import type { QuadrupedPosePlan } from "./QuadrupedPosePlan";
import { QuadrupedRestFloor } from "./QuadrupedRestFloor";
import { QuadrupedRideTerminal } from "./QuadrupedRideTerminal";
import { QuadrupedRigDelta } from "./QuadrupedRigDelta";
import { QuadrupedScapula } from "./QuadrupedScapula";
import { chooseQuadrupedBodyRoot } from "./chooseQuadrupedBodyRoot";
import type { AutoMovieArchetypeQuadruped } from "../AutoMovieArchetypeQuadruped";
import { QuadrupedRidePoseTypes } from "./QuadrupedRidePoseTypes";
import type { QuadrupedRidePoseGoals } from "./QuadrupedRidePoseGoals";

const { HINDS } = QuadrupedRidePoseTypes;
/** Fixed-attachment locomotion lowered through the animal's shared rig. */
export namespace QuadrupedRidePose {
  /** The moved type {@link QuadrupedRidePoseGoals.IGoal}. */
  export type IGoal = QuadrupedRidePoseGoals.IGoal;
  /** The moved type {@link QuadrupedRidePoseGoals.IPrepared}. */
  export type IPrepared<
    Id extends string,
    Dimension extends string,
  > = QuadrupedRidePoseGoals.IPrepared<Id, Dimension>;

  /**
   * Prepare lengths, terminal solids, carrier policy and shared FK once.
   *
   * @param animal The neutral model, never changed by preparation or sampling.
   * @param species Declared carriage selectors of this ride's producer.
   * @param source Admitted independent joints and attachments read from that
   *   same model.
   * @returns A sampler retaining no caller-owned goal or returned-frame state.
   * @throws {RangeError} For unsupported terminal solids, malformed neutral
   *   chains/carriers or physically incompatible current goals.
   */
  export function prepare<Id extends string, Dimension extends string>(
    animal: AutoMovieArchetype<Id, Dimension>,
    species: AutoMovieArchetypeQuadruped.ISpecies,
    source: ReturnType<typeof AutoMovieArchetypeQuadrupedJoints.read>,
  ): IPrepared<Id, Dimension> {
    const bindings: ReturnType<typeof QuadrupedCarriage.of> =
      QuadrupedCarriage.of(animal, species);
    const pose: PrepareQuadrupedPose.IPrepared<Id, Dimension> =
      PrepareQuadrupedPose.ride(animal, bindings.parts, bindings.contacts);
    const neutral: QuadrupedPosePlan.IState = pose.read();
    const parts: Map<string, IAutoMovieModelPart> = new Map(
      animal.parts.map(
        (part: IAutoMovieModelPart): [string, IAutoMovieModelPart] => [
          part.id,
          part,
        ],
      ),
    );
    const end = (
      limb: AutoMovieArchetypeQuadrupedBody.Limb,
    ): QuadrupedRideTerminal.Binding =>
      QuadrupedRideTerminal.of(
        limb,
        source.limbs[limb],
        parts.get(AutoMovieArchetypeQuadrupedBody.BONES[limb][3]!),
      );
    const ends: Readonly<
      Record<
        AutoMovieArchetypeQuadrupedBody.Limb,
        QuadrupedRideTerminal.Binding
      >
    > = {
      leftFore: end("leftFore"),
      rightFore: end("rightFore"),
      leftHind: end("leftHind"),
      rightHind: end("rightHind"),
    };
    const sourceScale: number = Math.max(
      1,
      ...AutoMovieArchetypeQuadrupedBody.LIMBS.flatMap(
        (limb: AutoMovieArchetypeQuadrupedBody.Limb): number[] =>
          source.limbs[limb].flatMap((point: IAutoMovieVector3): number[] => [
            Math.abs(point.x),
            Math.abs(point.y),
            Math.abs(point.z),
          ]),
      ),
    );
    const limbBones: Set<string> = new Set(
      AutoMovieArchetypeQuadrupedBody.LIMBS.flatMap(
        (
          limb: AutoMovieArchetypeQuadrupedBody.Limb,
        ): AutoMovieArchetypeQuadrupedBody.Bone[] => [
          ...AutoMovieArchetypeQuadrupedBody.BONES[limb],
        ],
      ),
    );

    // The contacts a body bone carries, which the root, the pelvis and the
    // axial goals place alone: not one a limb or a shoulder blade carries,
    // whose chain only the full sample solves, nor the grip a held line turns.
    const blades: ReadonlySet<string> = new Set(
      Object.values(QuadrupedScapula.BONES),
    );
    const held: ReadonlySet<string> = new Set(
      animal.spans.flatMap((span: AutoMovieArchetypeSpan.ISpan): string[] =>
        [span.from, span.to].flatMap(
          (end: AutoMovieArchetypeSpan.IEnd): string[] =>
            end.affordance !== undefined && end.overhang !== undefined
              ? [end.affordance]
              : [],
        ),
      ),
    );
    const carried: ReadonlyMap<string, ICarried> = new Map(
      animal.affordances.flatMap(
        (contact: IAutoMovieAffordance): [string, ICarried][] => {
          const bone: AutoMovieArchetypeQuadrupedBody.Bone | undefined =
            bindings.contacts[contact.id];
          return bone === undefined ||
            limbBones.has(bone) ||
            blades.has(bone) ||
            held.has(contact.id)
            ? []
            : [[contact.id, { bone, frame: contact.frame }]];
        },
      ),
    );
    return { sample, frame };

    /**
     * The root range four goals admit under one nod, before any chain is
     * solved: the axial goals, the previewed frames, each limb's target and its
     * root constraint relaxed against the body's floor, and how the pelvis and
     * an axial bar turn.
     */
    function settle(
      goals: Readonly<Record<AutoMovieArchetypeQuadrupedBody.Limb, IGoal>>,
      nod: number,
    ): ISettled {
      const axial: Map<QuadrupedPosePlan.Axial, QuadrupedPosePlan.Goal> =
        new Map([
          [
            "neck",
            {
              kind: "rotation",
              rotation: Quaternion.multiply(
                Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, nod),
                neutral.frames.get("neck")!.rotation,
              ),
            },
          ],
        ]);
      const preview: QuadrupedPosePlan.IState = pose.read(undefined, axial);
      const targets: Map<AutoMovieArchetypeQuadrupedBody.Limb, Target> =
        new Map();
      const constraints: Readonly<
        Record<
          AutoMovieArchetypeQuadrupedBody.Limb,
          AutoMovieArchetypeQuadrupedRootRange.IConstraint
        >
      > = {
        leftFore: constraint("leftFore"),
        rightFore: constraint("rightFore"),
        leftHind: constraint("leftHind"),
        rightHind: constraint("rightHind"),
      };
      // Spans and any old source effects remain live on every call. Only the
      // geometry following this floor observation can share exact work.
      const floor: number = -pose.bodyFloor(preview.frames);
      const coordinateScale: number = Math.max(
        sourceScale,
        ...[...targets.values()].flatMap((target: Target): number[] => [
          Math.abs(target.endpoint.x),
          Math.abs(target.endpoint.y),
          Math.abs(target.endpoint.z),
        ]),
      );
      // A swinging limb unfolds only as far as the common root requires, keeping twice the root chooser's roundoff erosion of reach.
      const settled: AutoMovieArchetypeQuadrupedRootRange.IRelaxed =
        AutoMovieArchetypeQuadrupedRootRange.relax(
          constraints,
          floor,
          (
            limb: AutoMovieArchetypeQuadrupedBody.Limb,
            fold: number,
          ): AutoMovieArchetypeQuadrupedLimb.IRange =>
            targets.get(limb)!.solver.range(fold),
          512 * Number.EPSILON * Math.max(1, coordinateScale, Math.abs(floor)),
        );
      for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
        const target: Target = targets.get(limb)!;
        target.constraint = settled.constraints[limb];
        target.fold = target.constraint.fold ?? target.fold;
      }
      return {
        axial,
        preview,
        targets,
        floor,
        coordinateScale,
        range: settled.range,
        bar,
        pelvis,
      };

      /**
       * An axial bar's goal turned by an angle about model X from its previewed
       * direction.
       */
      function bar(
        bone: QuadrupedPosePlan.Axial,
        angle: number,
      ): QuadrupedPosePlan.Goal {
        const axis: IAutoMovieVector3 = Quaternion.rotateVector(
          preview.frames.get(bone)!.rotation,
          { x: 0, y: 1, z: 0 },
        );
        return {
          kind: "direction",
          direction: {
            x: axis.x,
            y: axis.y * Math.cos(angle) - axis.z * Math.sin(angle),
            z: axis.y * Math.sin(angle) + axis.z * Math.cos(angle),
          },
        };
      }

      /**
       * The pelvis's turn at a root height: as far as the hind needing it most
       * requires.
       */
      function pelvis(height: number): number {
        return QuadrupedPelvis.turn(
          HINDS.map(
            (
              limb: AutoMovieArchetypeQuadrupedBody.Limb,
            ): QuadrupedPelvis.IHip => {
              const constraint: AutoMovieArchetypeQuadrupedRootRange.IConstraint =
                targets.get(limb)!.constraint;
              return {
                joint: constraint.pelvis!,
                goal: constraint.goal,
                reach: constraint.reach,
              };
            },
          ),
          height,
          256 * Number.EPSILON * coordinateScale,
        );
      }
      /** Convert one solid's lift to an exact endpoint/ankle constraint. */
      function constraint(
        limb: AutoMovieArchetypeQuadrupedBody.Limb,
      ): AutoMovieArchetypeQuadrupedRootRange.IConstraint {
        const goal: IGoal | undefined = goals?.[limb];
        if (goal === undefined || goal === null || goal.lift < 0)
          throw new RangeError(
            `The ${limb} footprint goal must be finite with nonnegative lift`,
          );
        const attachment: IAutoMovieVector3 = preview.frames.get(
          AutoMovieArchetypeQuadrupedBody.BONES[limb][0]!,
        )!.translation;
        const surface: AutoMovieArchetypeQuadrupedFooting.ISurface | undefined =
          goal.surface;
        const normal: IAutoMovieVector3 | undefined = surface?.normal;
        const support: QuadrupedRideTerminal.IEnd = ends[limb](
          goal.orientation,
          goal.x !== undefined,
          normal,
        );
        const x: number = goal.x ?? attachment.x;
        const offset: number = goal.lift + support.clearance;
        let endpoint: IAutoMovieVector3 = { x, y: offset, z: goal.z };
        if (surface !== undefined) {
          const { normal, point } = surface;
          if (!(normal.y > 0))
            throw new RangeError(`The ${limb} support plane faces down`);
          const run: number =
            normal.x * (x - point.x) + normal.z * (goal.z - point.z);
          endpoint = Vector3.addScaled(
            { x, y: point.y - run / normal.y, z: goal.z },
            normal,
            offset,
          );
        }
        const blade: QuadrupedScapula.Bone | undefined =
          limb === "leftFore" || limb === "rightFore"
            ? QuadrupedScapula.BONES[limb]
            : undefined;
        const result: AutoMovieArchetypeQuadrupedRootRange.IConstraint = {
          attachment,
          goal: support.solver.target(endpoint),
          reach: support.solver.range(goal.fold),
          fold: goal.fold,
          ...(goal.load === undefined ? {} : { load: goal.load }),
          ...(blade === undefined
            ? {
                pelvis: {
                  pivot: preview.frames.get(QuadrupedPelvis.BONE)!.translation,
                  glenoid: attachment,
                },
              }
            : {
                scapula: {
                  pivot: preview.frames.get(blade)!.translation,
                  glenoid: attachment,
                },
              }),
        };
        targets.set(limb, {
          endpoint,
          fold: goal.fold,
          attachment,
          solver: support.solver,
          ...(blade === undefined ? {} : { blade }),
          constraint: result,
        });
        return result;
      }
    }

    /**
     * Achieve four unchanged foot poses with one explicit whole-body
     * trajectory.
     */
    function sample(
      goals: Readonly<Record<AutoMovieArchetypeQuadrupedBody.Limb, IGoal>>,
      nod: number,
      preferredRoot: number,
    ): AutoMovieArchetype<Id, Dimension> {
      const {
        axial,
        targets,
        coordinateScale,
        range,
        bar,
        pelvis: turn,
      }: ISettled = settle(goals, nod);
      /** Solve the shared-root limbs and prove their canonical FK. */
      const geometry = (): ReturnType<typeof pose.position> => {
        const height: number = chooseQuadrupedBodyRoot(
          range,
          preferredRoot,
          coordinateScale,
        );
        const root: IAutoMovieTransform = AutoMovieArchetypeFrame.upright({
          x: 0,
          y: height,
          z: 0,
        });
        const solved: Map<
          AutoMovieArchetypeQuadrupedBody.Limb,
          readonly IAutoMovieVector3[]
        > = new Map();
        const turned: Map<QuadrupedPosePlan.Axial, QuadrupedPosePlan.Goal> =
          new Map(axial);
        // Both hips ride one pelvis, turned as far as the hind needing it most requires.
        const pelvis: number = turn(height);
        if (pelvis !== 0)
          turned.set(QuadrupedPelvis.BONE, bar(QuadrupedPelvis.BONE, pelvis));
        for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
          const target: Target = targets.get(limb)!;
          const hip: QuadrupedScapula.IJoint | undefined =
            target.constraint.pelvis;
          const attachment: IAutoMovieVector3 =
            hip === undefined
              ? shoulder(target, height, turned)
              : QuadrupedScapula.glenoid(hip, pelvis);
          const joint: IAutoMovieVector3 = {
            ...attachment,
            y: attachment.y + height,
          };
          solved.set(
            limb,
            target.solver.solve(joint, short(target, joint), target.fold),
          );
        }
        return pose.position(solved, root, turned);
      };

      /**
       * A swinging hoof's endpoint where its leg reaches at the chosen root:
       * its goal where the leg reaches it, otherwise raised under the joint
       * (its forward place kept, or drawn in as far as the leg's reach
       * requires) until the leg just reaches, as a swinging foot adapts to the
       * body the planted ones carry. A loaded hoof keeps its goal: its leg's
       * reach capped the root.
       */
      function short(
        target: Target,
        joint: IAutoMovieVector3,
      ): IAutoMovieVector3 {
        if ((target.constraint.load ?? 1) >= 1) return target.endpoint;
        const goal: IAutoMovieVector3 = target.constraint.goal;
        const reach: number =
          target.constraint.reach.maximum -
          512 * Number.EPSILON * Math.max(1, coordinateScale);
        const dx: number = goal.x - joint.x;
        const dy: number = goal.y - joint.y;
        const dz: number = goal.z - joint.z;
        if (Math.hypot(dx, dy, dz) <= reach) return target.endpoint;
        const across: number = Math.max(0, reach * reach - dx * dx);
        const forward: number =
          dz * dz <= across ? dz : Math.sign(dz) * Math.sqrt(across);
        const down: number = -Math.sqrt(
          Math.max(0, across - forward * forward),
        );
        return {
          x: target.endpoint.x,
          y: target.endpoint.y + (down - dy),
          z: target.endpoint.z + (forward - dz),
        };
      }
      const prepared: ReturnType<typeof geometry> = geometry();
      // Current metadata, model/carrier emission and the final solid floor
      // check always execute, even when the admitted numerical geometry matches.
      const result: AutoMovieArchetype<Id, Dimension> = prepared.emit();

      // Terminal support alone cannot admit an elbow or folded lower bar
      // below the same floor. Verify those solids after exact FK.
      const roundoff: number = 256 * Number.EPSILON * coordinateScale;
      for (const part of result.parts)
        if (goals.leftFore.surface === undefined && limbBones.has(part.id)) {
          const lowest: number = QuadrupedRestFloor(part);
          if (lowest < -roundoff)
            throw new RangeError(
              `Quadruped ${part.id} penetrates its local floor by ${-lowest} m`,
            );
        }
      return result;

      /**
       * A fore limb's shoulder joint at the chosen root: its blade turns only
       * as far as reach needs, and the turn joins the axial goals.
       */
      function shoulder(
        target: Target,
        height: number,
        turned: Map<QuadrupedPosePlan.Axial, QuadrupedPosePlan.Goal>,
      ): IAutoMovieVector3 {
        const joint: QuadrupedScapula.IJoint | undefined =
          target.constraint.scapula;
        const blade: QuadrupedScapula.Bone | undefined = target.blade;
        if (joint === undefined || blade === undefined)
          return target.attachment;
        const angle: number = QuadrupedScapula.least(
          joint,
          target.constraint.goal,
          target.constraint.reach,
          height,
          256 * Number.EPSILON * coordinateScale,
        );
        if (angle === 0) return target.attachment;
        turned.set(blade, bar(blade, angle));
        return QuadrupedScapula.glenoid(joint, angle);
      }
    }

    /**
     * One contact's frame at the root and axial pose `sample` reaches, read
     * from its carrier's chain alone: the root and the turns the four goals
     * settle, the body's frames lowered from them, and the contact carried by
     * its bone's motion from neutral, as the full emission carries it.
     */
    function frame(
      goals: Readonly<Record<AutoMovieArchetypeQuadrupedBody.Limb, IGoal>>,
      nod: number,
      preferredRoot: number,
      id: string,
    ): IAutoMovieTransform | undefined {
      const contact: ICarried | undefined = carried.get(id);
      if (contact === undefined) return undefined;
      const settled: ISettled = settle(goals, nod);
      const height: number = chooseQuadrupedBodyRoot(
        settled.range,
        preferredRoot,
        settled.coordinateScale,
      );
      const turned: Map<QuadrupedPosePlan.Axial, QuadrupedPosePlan.Goal> =
        new Map(settled.axial);
      const pelvis: number = settled.pelvis(height);
      if (pelvis !== 0)
        turned.set(
          QuadrupedPelvis.BONE,
          settled.bar(QuadrupedPelvis.BONE, pelvis),
        );
      const frames: QuadrupedPosePlan.IState = pose.read(
        AutoMovieArchetypeFrame.upright({ x: 0, y: height, z: 0 }),
        turned,
      );
      return QuadrupedRigDelta.move(
        contact.frame,
        contact.bone,
        QuadrupedRigDelta.between(neutral.frames, frames.frames),
        id,
      );
    }
  }
}
type Target = QuadrupedRidePoseTypes.Target;
type ICarried = QuadrupedRidePoseTypes.ICarried;

type ISettled = QuadrupedRidePoseTypes.ISettled;

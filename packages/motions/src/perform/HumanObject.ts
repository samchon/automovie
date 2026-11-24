import { Quaternion, RigidCarrierSample, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSeated,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { HumanObjectCord } from "./HumanObjectCord";

/**
 * Attach actions to an object: an object says where a person meets it through
 * its affordances (a seat, a handle, a surface), and this gives the actions
 * what they read of it, placed in the world.
 *
 * The object is any model that declares affordances in its own space, such as
 * an archetype; nothing here depends on how it was made. Its place is where the
 * scene puts it. A sitting action then sits on the seat the chair declares, at
 * the height and depth the chair has, and a grasp, a touch or a look goes to
 * the contact the object names instead of to coordinates written by hand.
 */
export namespace HumanObject {
  /**
   * A placement as a rigid world frame.
   *
   * @param placement The placement.
   * @returns The frame.
   */
  export function frame(
    placement: IAutoMovieMotionHumanObject.Placement,
  ): IAutoMovieRigidTransform {
    return "position" in placement
      ? { position: placement.position, rotation: placement.rotation }
      : {
          position: placement.at,
          rotation: Quaternion.fromAxisAngle(
            { x: 0, y: 1, z: 0 },
            placement.yaw,
          ),
        };
  }

  /**
   * An object as a prop of a performance: actions aim at its contacts by their
   * ids, hands grasp its handles, and it rides the hand that holds it.
   *
   * Every affordance is also a named point of the prop, at the contact with the
   * contact's `+Y` as its outward normal, so `{ kind: "prop", subject, point:
   * "pull" }` is a target.
   *
   * @param subject The prop's subject id in the performance.
   * @param model The object.
   * @param placement Where it rests before any hand takes it.
   * @param motion Where it is at a film second, for an object that moves by
   *   itself, such as a vehicle on its course; it stays at its placement when
   *   absent.
   * @param contact The world frame of one of its contacts at a film second, for
   *   an object whose parts move within it, such as a pedal on its crank (an
   *   archetype ride's `frame`); each contact moves rigidly with the object
   *   when absent.
   * @param tracks The object's own movements after a trigger, each an
   *   articulation's travel from its start (`IHumanProp.tracks`); none when
   *   absent.
   * @returns The prop with any declared articulation capability, and with its
   *   pose reader for drives and tracks when the model supplies one.
   */
  export function prop(
    subject: string,
    model: IAutoMovieMotionHumanObject.IModel,
    placement: IAutoMovieMotionHumanObject.Placement,
    motion?: (seconds: number) => IAutoMovieMotionHumanObject.Placement,
    contact?: (id: string, seconds: number) => IAutoMovieTransform,
    tracks?: readonly IAutoMovieMotionHumanProp.ITrack[],
  ): IAutoMovieMotionHumanProp {
    const affordances: readonly IAutoMovieAffordance[] =
      model.affordances ?? [];
    const ids: ReadonlySet<string> = new Set(
      affordances.map(
        (affordance: IAutoMovieAffordance): string => affordance.id,
      ),
    );
    const shapes: IAutoMoviePhysicalShape[] | undefined = model.shapes?.();
    const prop: IAutoMovieMotionHumanProp = {
      subject,
      frame: frame(placement),
      points: Object.fromEntries(
        affordances.map((affordance: IAutoMovieAffordance) => [
          affordance.id,
          {
            point: affordance.frame.translation,
            normal: Quaternion.rotateVector(affordance.frame.rotation, {
              x: 0,
              y: 1,
              z: 0,
            }),
          },
        ]),
      ),
      affordances,
      ...(placement.fixed === true ? { fixed: true } : {}),
      ...(shapes === undefined ? {} : { shapes }),
      ...(tracks === undefined || tracks.length === 0 ? {} : { tracks }),
      ...(model.body === undefined || model.body === null
        ? {}
        : { body: model.body }),

      ...(model.hasArticulations === undefined
        ? {}
        : { hasArticulations: model.hasArticulations }),
      // An object whose parts move is posed by the performance's state.
      ...(model.articulate === undefined
        ? {}
        : {
            articulate: (
              state: Readonly<Record<string, number>>,
            ): IAutoMovieMotionHumanProp.IPosed => {
              const posed: IAutoMovieMotionHumanObject.IModel =
                model.articulate!(state);
              const moved: IAutoMoviePhysicalShape[] | undefined =
                posed.shapes?.();
              return {
                affordances: posed.affordances ?? [],
                ...(moved === undefined ? {} : { shapes: moved }),
                ...(posed.span === undefined
                  ? {}
                  : { span: posed.span.bind(posed) }),
              };
            },
          }),
      ...(motion === undefined
        ? {}
        : {
            motion: (seconds: number): IAutoMovieRigidTransform =>
              frame(motion(seconds)),
          }),
      ...(contact === undefined
        ? {}
        : {
            point: (
              id: string,
              seconds: number,
            ): IAutoMovieMotionHumanProp.IPlacedPoint | undefined => {
              if (!ids.has(id)) return undefined;
              const at: IAutoMovieTransform = contact(id, seconds);
              return {
                point: at.translation,
                rotation: at.rotation,
                normal: Quaternion.rotateVector(at.rotation, {
                  x: 0,
                  y: 1,
                  z: 0,
                }),
              };
            },
          }),
    };
    RigidCarrierSample.adapt(prop, model, motion, contact);
    return prop;
  }

  /**
   * Create a soft cord on a model span's own endpoints and rest length. The
   * owning prop and returned cord both belong in the performance props.
   */
  export function cord(
    model: IAutoMovieMotionHumanObject.ISpanModel,
    span: string,
    props: IAutoMovieMotionHumanObject.ICord,
  ): IAutoMovieMotionHumanProp {
    return HumanObjectCord(model, span, props);
  }

  /**
   * An object's seat in the world, for the actions that sit on one: the middle
   * of its front edge, the heading a sitter faces, and the depth and backrest
   * it declares.
   *
   * @param model The object.
   * @param placement Where the scene puts it.
   * @param id The seat's affordance id; the object's only seat when absent.
   * @param carrier The subject of the prop the object is, when it may move, so
   *   a sit follows the seat in its frame and the seat's own contact within it
   *   (`IAutoMovieMotionHumanSeated.ISeat.carrier` and `point`); absent for a
   *   seat in the world.
   * @returns The seat.
   * @throws {HumanRefusal} When the object has no such seat, or several and
   *   none is named, listing its seats.
   */
  export function seat(
    model: IAutoMovieMotionHumanObject.IModel,
    placement: IAutoMovieMotionHumanObject.Placement,
    id?: string,
    carrier?: string,
  ): IAutoMovieMotionHumanSeated.ISeat {
    const seats: IAutoMovieAffordance[] = (model.affordances ?? []).filter(
      (affordance: IAutoMovieAffordance): boolean => affordance.kind === "seat",
    );
    const found: IAutoMovieAffordance | undefined =
      id === undefined
        ? seats.length === 1
          ? seats[0]
          : undefined
        : seats.find(
            (affordance: IAutoMovieAffordance): boolean => affordance.id === id,
          );
    if (found === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "seat",
        value: id,
        feasible: {
          kind: "alternatives",
          values: seats.map(
            (affordance: IAutoMovieAffordance): string => affordance.id,
          ),
        },
        reason:
          id !== undefined
            ? `the object has no seat named ${id}`
            : seats.length === 0
              ? "the object declares no seat"
              : `the object has ${seats.length} seats, and none is named`,
        fix: "name one of the object's seats, or sit on an object that has one",
      });
    const world: IAutoMovieRigidTransform = frame(placement);
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.multiply(world.rotation, found.frame.rotation),
      { x: 0, y: 0, z: 1 },
    );
    const rests: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> =
      footrests(model.affordances ?? [], found, world);
    return {
      at: Vector3.add(
        world.position,
        Quaternion.rotateVector(world.rotation, found.frame.translation),
      ),
      yaw: (Math.atan2(forward.x, forward.z) * 180) / Math.PI,
      ...tilted(Quaternion.multiply(world.rotation, found.frame.rotation)),
      ...(found.depth === undefined ? {} : { depth: found.depth }),
      ...(found.back === undefined ? {} : { back: found.back }),
      ...(found.workingSeat === undefined
        ? {}
        : { workingSeat: found.workingSeat }),
      ...(found.astride === undefined ? {} : { astride: found.astride }),
      ...(found.mount === undefined ? {} : { mount: found.mount }),
      ...(Object.keys(rests).length === 0 ? {} : { footrests: rests }),
      ...(carrier === undefined ? {} : { carrier, point: found.id }),
    };
  }

  /**
   * Where the feet rest on an object while its seat is sat on: the tread
   * nearest the seat on each side among the object's pedals and stirrups, or,
   * when it has none below the seat, two points of the nearest bar below it, a
   * quarter of the bar's length to each side of its middle.
   *
   * A point counts as below the seat when it lies under the sitting surface in
   * the seat's own frame, whose `+X` is the sitter's left. Whether a leg
   * reaches a rest is the sitting law's to judge on the body that sits.
   */
  function footrests(
    affordances: readonly IAutoMovieAffordance[],
    seat: IAutoMovieAffordance,
    world: IAutoMovieRigidTransform,
  ): Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> {
    const inverse: IAutoMovieTransform["rotation"] = Quaternion.inverse(
      seat.frame.rotation,
    );
    const seated = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        inverse,
        Vector3.subtract(point, seat.frame.translation),
      );
    const placed = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(
        world.position,
        Quaternion.rotateVector(world.rotation, point),
      );
    const below = (kinds: readonly string[]): IAutoMovieAffordance[] =>
      affordances
        .filter(
          (affordance: IAutoMovieAffordance): boolean =>
            kinds.includes(affordance.kind) &&
            seated(affordance.frame.translation).y < 0,
        )
        .sort(
          (a: IAutoMovieAffordance, b: IAutoMovieAffordance): number =>
            Vector3.length(seated(a.frame.translation)) -
            Vector3.length(seated(b.frame.translation)),
        );
    const out: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> = {};

    // The nearest tread on each side comes first in the sorted list.
    for (const tread of below(["pedal", "stirrup"])) {
      const side: AutoMovieHumanSide =
        seated(tread.frame.translation).x > 0 ? "left" : "right";
      out[side] ??= placed(tread.frame.translation);
    }
    if (Object.keys(out).length !== 0) return out;
    const bar: IAutoMovieAffordance | undefined = below(["bar"])[0];
    if (bar === undefined || bar.length === undefined) return out;
    const reach: IAutoMovieVector3 = Quaternion.rotateVector(
      bar.frame.rotation,
      { x: bar.length / 4, y: 0, z: 0 },
    );
    const ends: IAutoMovieVector3[] = [
      Vector3.add(bar.frame.translation, reach),
      Vector3.subtract(bar.frame.translation, reach),
    ].sort(
      (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
        seated(b).x - seated(a).x,
    );
    return { left: placed(ends[0]!), right: placed(ends[1]!) };
  }
}
/** The alternatives of `TiltedResult`'s site. */
type TiltedResult = "pitch" | "roll";

/**
 * A seat's pitch and roll in the world, as a posture's, when the seat is not
 * level.
 *
 * @param rotation The seat's world rotation.
 * @returns The tilt, empty for a level seat.
 */
function tilted(
  rotation: IAutoMovieQuaternion,
): Pick<IAutoMovieMotionHumanSeated.ISeat, TiltedResult> {
  const angles: ReturnType<typeof humanPostureHeading.angles> =
    humanPostureHeading.angles(rotation);
  return Math.abs(angles.pitch) < 1e-6 && Math.abs(angles.roll) < 1e-6
    ? {}
    : { pitch: angles.pitch, roll: angles.roll };
}

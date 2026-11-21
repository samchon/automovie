import { createHorse, rideHorse } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanFrame,
  HumanHand,
  HumanMounted,
  HumanObject,
  HumanPerformance,
  HumanRide,
  HumanSignature,
} from "@automovie/motions";

/**
 * A rider staged on a tacked horse that stands while the rider sits and then
 * goes along a straight course: the shared scene of the alternative mounted
 * support specs, with readers of the horse's actual moving contacts and the
 * rider's displayed landmarks in a contact's own frame.
 */
export namespace mountedHorseScene {
  /** The horse producer's model. */
  export type Horse = ReturnType<typeof createHorse>;

  /** A horse's ride along a course. */
  export type Ride = ReturnType<typeof rideHorse>;

  /** The rider's chain once seated. */
  export type Seated = ReturnType<ReturnType<typeof HumanChain.subject>["sit"]>;

  /** A staged take and its readers. */
  export interface IScene {
    /** The horse. */
    horse: Horse;

    /** The horse's ride, which begins `wait` seconds into the film. */
    ride: Ride;

    /** The film. */
    film: HumanPerformance;

    /** The rider's body. */
    body: IAutoMovieMotionHumanBody;

    /** The rider's displayed landmarks. */
    reader: IAutoMovieMotionHumanSignature.IReader;

    /** The seat the rider sat on. */
    seat: IAutoMovieMotionHumanSeated.ISeat;

    /** A horse contact's world frame at a film second. */
    part(id: string, at: number): IAutoMovieTransform;

    /** The horse's root placement at a film second. */
    place(at: number): IAutoMovieRigidTransform;

    /** The rider's segments. */
    segments: readonly IAutoMovieMotionHumanSegment[];
  }

  /** The scene's inputs. */
  export interface IProps {
    /** The tacked horse. */
    horse: Horse;

    /** The rider's body. */
    body: IAutoMovieMotionHumanBody;

    /** The gait. */
    gait: "walk" | "trot" | "canter" | "gallop";

    /** Seconds the horse stands before it goes. */
    wait: number;

    /** Where the rider stands before sitting, in the seat's frame, metres. */
    from: IAutoMovieVector3;

    /** The horse's own ride, which begins `wait` seconds into the film; a steady straight course at the gait when absent. */
    course?: Ride;

    /** The performance's cue tracks; none when absent. */
    cues?: ConstructorParameters<typeof HumanPerformance>[0]["cues"];

    /** The acts after sitting. */
    acts: (seated: Seated) => Seated;
  }

  /**
   * Stage the scene: the horse stands for `wait` seconds and then goes at a steady speed of its gait along a straight course.
   *
   * @param props The inputs.
   * @returns The scene.
   */
  export function build(props: IProps): IScene {
    const { horse, body, gait, wait } = props;
    const ride: Ride = props.course ?? course(horse, gait);
    const local = (at: number): number =>
      Math.max(0, Math.min(ride.duration, at - wait));
    const place = (at: number): IAutoMovieRigidTransform => {
      const frame: IAutoMovieTransform = ride.at(local(at)).placement;
      return { position: frame.translation, rotation: frame.rotation };
    };
    const part = (id: string, at: number): IAutoMovieTransform =>
      ride.frame(id as Parameters<Ride["frame"]>[0], local(at));
    const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
      ride.at(0).archetype,
      place(0),
    );
    const film: HumanPerformance = new HumanPerformance({
      seed: "equine-mounted-supports",
      props: [HumanObject.prop("horse", horse, place(0), place, part)],
      laws: [HumanRide.ride, HumanMounted],
      ...(props.cues === undefined ? {} : { cues: props.cues }),
      performers: [
        {
          subject: "rider",
          body,
          at: HumanFrame.point(
            { origin: { ...seat.at, y: 0 }, yaw: seat.yaw },
            props.from,
          ),
          yaw: seat.yaw,
          proficiency: { level: "trained" },
        },
      ],
      composition: props.acts(
        HumanChain.subject("rider").sit({ seat, seconds: 0.5 }),
      ).node,
    });
    return {
      horse,
      ride,
      film,
      body,
      reader: HumanSignature.of(film, "rider", body, 0),
      seat,
      part,
      place,
      segments: film.segments("rider"),
    };
  }

  /**
   * The horse's ride: a straight course of twelve seconds at its gait's steady speed, scaled by the square root of its height at the withers (Froude similarity).
   *
   * @param horse The horse.
   * @param gait The gait.
   * @returns The ride.
   */
  export function course(horse: Horse, gait: IProps["gait"]): Ride {
    const scale: number = Math.sqrt(horse.dimensions.withersHeight! / 1.38);
    const speed: number =
      ({ walk: 1.4, trot: 3, canter: 5, gallop: 8 } as const)[gait] * scale;
    return rideHorse(
      horse,
      {
        start: { x: 0, z: 0, heading: 0 },
        cruise: speed,
        startSpeed: speed,
        endSpeed: speed,
        legs: [{ kind: "straight", length: speed * 12 }],
      },
      gait,
    );
  }

  /**
   * A world point in a frame.
   *
   * @param frame The frame.
   * @param point The world point.
   * @returns The point in the frame, metres.
   */
  export function local(
    frame: IAutoMovieTransform,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(
      Quaternion.inverse(frame.rotation),
      Vector3.subtract(point, frame.translation),
    );
  }

  /**
   * A world direction in a frame's axes.
   *
   * @param frame The frame.
   * @param direction The world direction.
   * @returns The direction in the frame's axes.
   */
  export function turned(
    frame: IAutoMovieTransform,
    direction: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(
      Quaternion.inverse(frame.rotation),
      direction,
    );
  }

  /**
   * How far the displayed palm centre lies from a held contact's skin: the contact's point raised along its frame's `+Y` by half its aperture.
   *
   * @param scene The scene.
   * @param side The hand.
   * @param id The held contact.
   * @param at Film seconds.
   * @returns Metres.
   */
  export function palm(
    scene: IScene,
    side: "left" | "right",
    id: string,
    at: number,
  ): number {
    const hand = scene.film.bones("rider", at).get(`${side}Hand`)!;
    const offset = HumanHand.offset(scene.body, side, "palm");
    const actual: IAutoMovieVector3 = Vector3.add(
      hand.worldPosition,
      Quaternion.rotateVector(hand.worldRotation, offset.point),
    );
    const contact: IAutoMovieTransform = scene.part(id, at);
    const radius: number =
      (scene.horse.affordances.find(
        (a: IAutoMovieAffordance): boolean => a.id === id,
      )!.aperture ?? 0) / 2;
    return Vector3.distance(
      actual,
      Vector3.addScaled(
        contact.translation,
        Quaternion.rotateVector(contact.rotation, { x: 0, y: 1, z: 0 }),
        radius,
      ),
    );
  }

  /**
   * The displayed joint centre of a bone at a film second.
   *
   * @param scene The scene.
   * @param bone The bone.
   * @param at Film seconds.
   * @returns World metres.
   */
  export function joint(
    scene: IScene,
    bone: Parameters<typeof HumanSignature.joint>[2],
    at: number,
  ): IAutoMovieVector3 {
    return HumanSignature.joint(scene.reader, at, bone);
  }
}

import { createHorse, rideHorse } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanMount,
  AutoMovieMotionHumanSignature,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanFrame, HumanHand } from "@automovie/motions/internal";

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

  /** A rider's chain before sitting on. */
  export type Chain = ReturnType<typeof HumanChain.subject>;

  /** Acts on the ground before sitting on. */
  export type Before = (chain: Chain) => Chain;

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

  /**
   * A further performer: its subject, body, where it starts in the seat's frame
   * and its acts.
   */
  export interface IPartner {
    /** The subject id. */
    subject: string;

    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** Where it stands at the start, in the seat's frame on the floor, metres. */
    from: IAutoMovieVector3;

    /** Its acts. */
    acts: (chain: ReturnType<typeof HumanChain.subject>) => {
      node: ReturnType<typeof HumanChain.subject>["node"];
    };
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

    /**
     * The horse's own ride, which begins `wait` seconds into the film; a steady
     * straight course at the gait when absent.
     */
    course?: Ride;

    /** The performance's cue tracks; none when absent. */
    cues?: ConstructorParameters<typeof HumanPerformance>[0]["cues"];

    /** The acts after sitting. */
    acts: (seated: Seated) => Seated;

    /**
     * Acts the rider does on the ground before sitting on, as picking up a
     * sabre; none when absent.
     */
    before?: Before;

    /**
     * Whether the rider sits on the seat before the acts; false leaves the
     * rider standing where `from` places it, for a performer who boards the
     * seat itself. True when absent.
     */
    seated?: boolean;

    /** Further performers beside the rider. */
    partners?: IPartner[];

    /** Further laws the acts use, beside the ride and the mounted law. */
    laws?: ConstructorParameters<typeof HumanPerformance>[0]["laws"];

    /** Further props, beside the horse. */
    props?: ConstructorParameters<typeof HumanPerformance>[0]["props"];

    /**
     * The grade the horse stands and goes on, degrees, nose up; level when
     * absent: the whole ride turned about the world's lateral axis through the
     * origin.
     */
    grade?: number;
  }

  /**
   * Stage the scene: the horse stands for `wait` seconds and then goes at a
   * steady speed of its gait along a straight course.
   *
   * @param props The inputs.
   * @returns The scene.
   */
  export function build(props: IProps): IScene {
    const { horse, body, gait, wait } = props;
    const ride: Ride = props.course ?? course(horse, gait);
    const local = (at: number): number =>
      Math.max(0, Math.min(ride.duration, at - wait));
    // A forward axis turned up by the grade: a turn of minus the grade about +X.
    const tilt: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 1, y: 0, z: 0 },
      -(props.grade ?? 0),
    );
    const graded = (frame: IAutoMovieTransform): IAutoMovieTransform => ({
      ...frame,
      translation: Quaternion.rotateVector(tilt, frame.translation),
      rotation: Quaternion.multiply(tilt, frame.rotation),
    });
    const place = (at: number): IAutoMovieRigidTransform => {
      const frame: IAutoMovieTransform = graded(ride.at(local(at)).placement);
      return { position: frame.translation, rotation: frame.rotation };
    };
    const part = (id: string, at: number): IAutoMovieTransform =>
      graded(ride.frame(id as Parameters<Ride["frame"]>[0], local(at)));
    // The saddle is the horse's: a sit on it is carried with the horse.
    const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
      ride.at(0).archetype,
      place(0),
      "seat",
      "horse",
    );
    // The rider's chain to the acts: the acts before, then the sit unless the rider boards the seat itself.
    const mounted = (): Chain => {
      const ground: Chain = (props.before ?? ((c: Chain): Chain => c))(
        HumanChain.subject("rider"),
      );
      return props.seated === false ? ground : ground.sit({ seat, hold: 0.5 });
    };
    const film: HumanPerformance = new HumanPerformance({
      seed: "equine-mounted-supports",
      props: [
        HumanObject.prop("horse", horse, place(0), place, part),
        ...(props.props ?? []),
      ],
      laws: [
        AutoMovieMotionHumanMount.rideHorse.ride,
        AutoMovieMotionHumanMount.mounted,
        ...(props.laws ?? []),
      ],
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
        ...(props.partners ?? []).map((partner: IPartner) => ({
          subject: partner.subject,
          body: partner.body,
          at: HumanFrame.point(
            { origin: { ...seat.at, y: 0 }, yaw: seat.yaw },
            partner.from,
          ),
          yaw: seat.yaw,
          proficiency: { level: "trained" as const },
        })),
      ],
      composition:
        props.partners === undefined || props.partners.length === 0
          ? props.acts(mounted()).node
          : {
              type: "parallel",
              parts: [
                props.acts(mounted()).node,
                ...props.partners.map(
                  (partner: IPartner) =>
                    partner.acts(HumanChain.subject(partner.subject)).node,
                ),
              ],
            },
    });
    return {
      horse,
      ride,
      film,
      body,
      reader: AutoMovieMotionHumanSignature.read(film, "rider", body, 0),
      seat,
      part,
      place,
      segments: film.segments("rider"),
    };
  }

  /**
   * Where a prop waits for the rider to pick it up on the ground before sitting
   * on: a little in front of and above where the standing rider's right hand
   * hangs, so the reach is a clear one.
   *
   * @param horse The horse.
   * @param body The rider's body.
   * @param from Where the rider stands, in the seat's frame on the floor.
   * @returns The right hand's grip target, world metres.
   */
  export function rack(
    horse: Horse,
    body: IAutoMovieMotionHumanBody,
    from: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const dry: IScene = build({
      horse,
      body,
      gait: "walk",
      wait: 2,
      from,
      acts: (seated) => seated,
    });
    const hangs = dry.film.bones("rider", 0.01);
    const ahead: IAutoMovieVector3 = Quaternion.rotateVector(
      hangs.get("hips")!.worldRotation,
      { x: 0, y: 0, z: 1 },
    );
    return Vector3.add(
      HumanHand.frame(body, hangs, "right", "grip").point,
      Vector3.add(Vector3.scale(Vector3.normalize({ ...ahead, y: 0 }), 0.3), {
        x: 0,
        y: 0.15,
        z: 0,
      }),
    );
  }

  /**
   * The horse's ride: a straight course of twelve seconds at its gait's steady
   * speed, scaled by the square root of its height at the withers (Froude
   * similarity).
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
   * How far the displayed palm centre lies from a held contact's skin: the
   * contact's point raised along its frame's `+Y` by half its aperture.
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
    bone: Parameters<typeof AutoMovieMotionHumanSignature.joint>[2],
    at: number,
  ): IAutoMovieVector3 {
    return AutoMovieMotionHumanSignature.joint(scene.reader, at, bone);
  }
}

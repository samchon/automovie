import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A high jump in the Fosbury flop: a one-foot take-off, a half turn that puts
 * the back to the bar, a backward lay-out over it with the back arched, the
 * legs lifted after the hips pass, and a landing on the back.
 *
 * The take-off is the jump's push-off (`GymnasticsTakeoff`), aimed so the
 * centre of mass peaks at the bar axis plus the authored reserve. It comes down
 * at the landing place at the height it has lying on its back there. The flight
 * is ballistic in the centre of mass (`GymnasticsFlight`), and its rotation
 * runs through the whole flight from the take-off, as the angular momentum a
 * flop builds during the take-off (Dapena 1980, "Mechanics of rotation in the
 * Fosbury-flop", Med Sci Sports Exerc 12:45-53: most of the somersault's
 * angular momentum is made on the ground) is kept in the air: the half turn
 * about the vertical eased over the whole rise, so the back is to the bar at
 * the apex, and the backward somersault about the body's left axis eased in
 * over the first half of the rise and then at a constant rate, level at the
 * apex and kept to the touchdown. The two overlap from the take-off on; turning
 * them one after the other, each in a fraction of the rise, spun the body
 * upright to inverted in a frame or two. The arch is keyed: the joints go from
 * the take-off's to `arched` at the apex and to `piked`, the legs lifted, after
 * it. The body comes down when the lowest of its shapes reaches the landing
 * surface, and lies on its back there (`GymnasticsMat`).
 *
 * The bar is the scene's high jump, a prop whose `bar` affordance is the
 * crossbar (`createHighJump`'s). The law reads its axis where the prop stands
 * at the action's start. The requested apex must exceed the take-off centre and
 * fit within the vertical take-off speed bound `RISE`. The horizontal take-off
 * speed is not stated: it follows from the landing place the author gives,
 * which world-class finalists reach leaving the floor at 4.14 ± 0.37 m/s (the
 * same table of Nicholson et al. 2022).
 *
 * A run-up is a `run`, curved by its `via` points, cut at the take-off foot's
 * footfall. The take-off foot must then be the planted one and the foot farther
 * from the bar, and the landing place may ask for no more horizontal take-off
 * speed than the run-up brings.
 *
 * First pass: no lean into the curve or the take-off; the arms do not lead; the
 * angular momentum appears at the take-off instead of being built over the
 * push; the apex falls where the landing place puts it, the crossbar's
 * horizontal position can differ from that apex. `barCrossing` marks a passage
 * of the centre through the crossbar's plane within its span when the authored
 * flight crosses it. The push-off's own flight, which aims the take-off, leaves
 * 20 to 24 mm from its take-off pose, so the flight starts from that pose's
 * centre with the vertical speed that reaches the requested apex, and the body
 * does not step at the take-off.
 *
 * Events: `takeoff`, `apex`, optional `barCrossing`, `touchdown`, `settled`,
 * `relax`.
 */
export namespace IAutoMovieMotionHumanHighJump {
  /** Parameters. */
  export interface IParams {
    /**
     * Where the body comes down on its back, world metres: its height is the
     * landing surface's, the floor's 0 or a mat's top.
     */
    to: IAutoMovieVector3;

    /** The prop landed on, its subject id; the floor when absent. */
    on?: string;

    /**
     * The high jump's prop subject. Its `bar` affordance supplies the
     * crossbar's world axis and span.
     */
    bar: string;

    /**
     * The centre-of-mass apex above the crossbar's axis, in metres. Defaults to
     * zero. The vertical take-off speed is bounded by 5.05 m/s
     * (`highJump.RISE`), so the apex above take-off is at most 1.30 m (`v^2 /
     * 2g`, g 9.80665 m/s2); the flight time is the ballistic fall from that
     * apex to the landing surface. The high-jump law requires a finite
     * non-negative value and bounds the combined apex by the takeoff's vertical
     * speed.
     */
    apexReserve?: number;

    /**
     * The planted foot that pushes off. Omitted uses the foot a cut run-up has
     * planted, otherwise the incoming stance's leading support.
     */
    takeoffFoot?: "left" | "right";
  }
}

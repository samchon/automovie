import { AutoMovieEngineGravity, AutoMovieEngineAir } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanThrowObjectLaunch,
  IAutoMovieMotionPropLaunch,
  IAutoMovieProjectile,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * A thrown object's launch and the drag-free path it flies afterwards. Written
 * by the throw's plan (`throwObject`) and read by a catcher and the capture.
 */
export namespace throwObjectLaunch {
  /*
   * The grip window that carries a thrown prop in the throwing hand from the
   * throw's start to its release; none for an empty-handed throw.
   * Parameter prop: The thrown prop, or undefined.
   * Parameter side: The throwing hand.
   * Parameter release: The release's share of the throw.
   * Returns: The window, or none.
   */
  export function held(
    prop: string | undefined,
    side: AutoMovieHumanSide,
    release: number,
  ): IAutoMovieMotionHumanContactWindow[] {
    return prop === undefined
      ? []
      : [
          {
            part: `${side}Hand`,
            kind: "grip",
            from: 0,
            to: release,
            support: { kind: "prop", subject: prop },
          },
        ];
  }

  /*
   * The launch a throw publishes for its prop (`IHumanActionPlan.launches`),
   * the same release point and velocity the catcher reads; none for an
   * empty-handed throw.
   * Parameter prop: The thrown prop, or undefined.
   * Parameter attitude: How it turns in flight; its release rotation kept when
   * absent.
   * Parameter launch: The throw's launch.
   * Returns: The published launches.
   */
  export function launches(
    prop: string | undefined,
    attitude: IAutoMovieProjectile.Attitude | undefined,
    launch: IAutoMovieMotionHumanThrowObjectLaunch.ILaunch,
  ): IAutoMovieMotionPropLaunch[] {
    return prop === undefined
      ? []
      : [
          {
            prop,
            seconds: launch.seconds,
            point: launch.point,
            velocity: launch.velocity,
            ...(attitude === undefined ? {} : { attitude }),
          },
        ];
  }

  /*
   * The launch velocity whose drag-free path from a release passes through a
   * target, rising at a given angle: the range equation solved for the speed,
   * `v^2 = g d^2 / (2 cos^2(a) (d tan(a) - h))` over the horizontal distance
   * `d` and the target's height `h` above the release.
   * Parameter release: The release point, world metres.
   * Parameter target: The target point, world metres.
   * Parameter degrees: The release's rise above the horizontal, degrees.
   * Returns: The velocity, world metres per second, or undefined when no path
   * at that angle reaches the target (it lies straight above, or above the
   * line the angle rises along).
   */
  export function aimed(
    release: IAutoMovieVector3,
    target: IAutoMovieVector3,
    degrees: number,
  ): IAutoMovieVector3 | undefined {
    const dx: number = target.x - release.x;
    const dz: number = target.z - release.z;
    const d: number = Math.hypot(dx, dz);
    const angle: number = (degrees * Math.PI) / 180;
    const lift: number = d * Math.tan(angle) - (target.y - release.y);
    if (!(d > 1e-6 && lift > 0)) return undefined;
    const speed: number = Math.sqrt(
      (AutoMovieEngineGravity.STANDARD * d * d) / (2 * Math.cos(angle) ** 2 * lift),
    );
    return {
      x: (dx / d) * speed * Math.cos(angle),
      y: speed * Math.sin(angle),
      z: (dz / d) * speed * Math.cos(angle),
    };
  }

  /*
   * A point of a launch's drag-free path.
   * Parameter launch: The launch.
   * Parameter seconds: Seconds after the release.
   * Returns: World metres.
   */
  export function path(
    launch: IAutoMovieMotionHumanThrowObjectLaunch.ILaunch,
    seconds: number,
  ): IAutoMovieVector3 {
    return AutoMovieEngineAir.projectileAt(
      {
        origin: launch.point,
        velocity: launch.velocity,
        gravity: AutoMovieEngineGravity.DOWN,
      },
      seconds,
    ).position;
  }
}

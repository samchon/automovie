import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * What a `frame` action points the camera at, resolved by the caller: the
 * subject's base (ground) point, its measured height, and, when the subject has
 * an actor or effective object motion, its animated base over shot time. `at:
 * null` means the subject holds still; a `follow` move on it degenerates to a
 * static framing.
 *
 * @evidence requirements/camera/framing-and-shot-size.md#camera-landmark-framing IAutoMovieFramedSubject drives required-landmark framing: What a `frame` action points the camera at, resolved by the caller: the subject's base (ground) point, its measured height, and, when the subject has an actor or effective object motion, its animated base over shot time. `at: null` means the subject holds still; a `follow` move on it degenerates to a static framing.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-framing-landmark-relations IAutoMovieFramedSubject realizes landmark-based framing: What a `frame` action points the camera at, resolved by the caller: the subject's base (ground) point, its measured height, and, when the subject has an actor or effective object motion, its animated base over shot time. `at: null` means the subject holds still; a `follow` move on it degenerates to a static framing.
 * @author Samchon
 */
export interface IAutoMovieFramedSubject {
  /**
   * Base (ground) point at the move's start.
   *
   * @evidence requirements/camera/framing-and-shot-size.md#camera-landmark-framing IAutoMovieFramedSubject.base drives required-landmark framing: Base (ground) point at the move's start.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-framing-landmark-relations IAutoMovieFramedSubject.base realizes landmark-based framing: Base (ground) point at the move's start.
   */
  base: IAutoMovieVector3;

  /**
   * Subject height in meters (drives framing distance and aim height).
   *
   * @evidence requirements/camera/framing-and-shot-size.md#camera-landmark-framing IAutoMovieFramedSubject.height drives required-landmark framing: Subject height in meters (drives framing distance and aim height).
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-framing-landmark-relations IAutoMovieFramedSubject.height realizes landmark-based framing: Subject height in meters (drives framing distance and aim height).
   */
  height: number;

  /**
   * Half the subject's widest horizontal span about {@link base}, in meters.
   *
   * Measured from what the subject draws, on every subject that draws anything:
   * a mass from its members' union, a single node from its model's own rest box
   * ({@link computeModelRestExtent}). Height alone decides a distance only when
   * nothing horizontal could be measured, which is what an absent or zero value
   * states.
   *
   * The fit is `max(vertical, horizontal)`, so a measured width changes a
   * framing only where it demands the further stand: for a raster of aspect `a`
   * that is `width > height * a`. A figure never reaches it — it is taller than
   * it is wide at every shot size — which is why solving a person from height
   * alone was right and stays byte-identical. A mass and a building both do
   * reach it: two thousand figures on a field are a hundred meters across and
   * one and a half tall, and a 60 m facade is 24 m high, and framing either from
   * height alone puts the camera where one person would fill the frame while the
   * subject runs off both edges.
   *
   * @evidence requirements/camera/framing-and-shot-size.md#camera-landmark-framing IAutoMovieFramedSubject.radius supplies the horizontal half-span the framing solve must contain when subject width demands more distance than height.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-framing-landmark-relations IAutoMovieFramedSubject.radius realizes landmark-based framing: Half the subject's widest horizontal span about {@link base}, in meters. Measured from what the subject draws, on every subject that draws anything: a mass from its members' union, a single node from its model's own rest box. Height alone decides a distance only when nothing horizontal could be measured, which is what an absent or zero value states. The fit is max(vertical, horizontal), so a measured width changes a framing only where it demands the further stand: for a raster of aspect a that is width > height * a. A figure never reaches it — it is taller than it is wide at every shot size — which is why solving a person from height alone was right and stays byte-identical. A mass and a building both do reach it: two thousand figures on a field are a hundred meters across and one and a half tall, and a 60 m facade is 24 m high, and framing either from height alone puts the camera where one person would fill the frame while the subject runs off both edges.
   */
  radius?: number;

  /**
   * Animated base over shot-local seconds, or null when static.
   *
   * @evidence requirements/camera/framing-and-shot-size.md#camera-landmark-framing IAutoMovieFramedSubject.at drives required-landmark framing: Animated base over shot-local seconds, or null when static.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-framing-landmark-relations IAutoMovieFramedSubject.at realizes landmark-based framing: Animated base over shot-local seconds, or null when static.
   */
  at: ((seconds: number) => IAutoMovieVector3) | null;
}

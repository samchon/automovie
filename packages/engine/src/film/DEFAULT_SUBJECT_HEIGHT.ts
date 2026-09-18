/**
 * Stand-in height when the subject has no skeleton to measure.
 *
 * @evidence requirements/camera/framing-and-shot-size.md#camera-landmark-framing DEFAULT_SUBJECT_HEIGHT drives required-landmark framing: Stand-in height when the subject has no skeleton to measure.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-framing-landmark-relations DEFAULT_SUBJECT_HEIGHT realizes landmark-based framing: Stand-in height when the subject has no skeleton to measure.
 */
export const DEFAULT_SUBJECT_HEIGHT = 1.7;

/** A whip pan snaps to its new aim in this many seconds. */
const WHIP_SECONDS = 0.2;

/** An orbit sweeps this arc over its span, sampled at this many segments. */
const ORBIT_DEGREES = 45;
const ORBIT_SEGMENTS = 8;

/** A push-in dollies from this to this multiple of the framed distance. */
const PUSH_IN_FROM = 1.25;
const PUSH_IN_TO = 0.8;

/** A push-in eases in/out over this many segments (a smooth dolly, not a ramp). */
const PUSH_IN_SEGMENTS = 8;

/** A truck crosses one solved framing distance along the camera's screen-left. */
const TRUCK_DISTANCE = 1;
const TRUCK_SEGMENTS = 8;

/** Follow moves sample the subject's animated base at this rate (Hz). */
const FOLLOW_HZ = 4;

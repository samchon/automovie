import type { IAutoMovieColor } from "../color/IAutoMovieColor";

/**
 * A flame burning at a placed prop's flame frame for one shot: a candle's, a
 * lantern's, a torch's or a lighter's flame, a campfire, or a cigarette's
 * glowing end.
 *
 * The flame stands on the emitter affordance's frame with `+Y` up the flame, so
 * it follows the prop's placement, object motion and carriage. `engine`
 * computes its shape and flicker as closed forms of shot time with no state
 * between samples, seeded by `seed`, so a seek, a split render and a sequential
 * run give the same flame at every time; `render` draws it.
 *
 * With `light`, the named practical light binding stays authoritative: its
 * intensity track carries the flicker, and the flame's luminance and colour
 * follow from that light's on-state intensity and colour. Without it,
 * `emission` gives them.
 *
 * `engine` admission refuses a duplicate id within the shot, a node that is not
 * staged or an emitter that is not a fixed affordance of its model, a
 * nonpositive or non-finite size, an open fire whose Heskestad flame height is
 * not positive or whose puffing frequency exceeds 7.5 Hz (a diameter below 0.04
 * m), a `light` that names no binding of the shot or a binding on another node
 * or emitter, a binding two cues name, and an `emission` given together with
 * `light` or missing without it.
 */
export interface IAutoMovieFlameCue {
  /** Id unique within the shot; the mask names the flame `flame:<node>/<id>`. */
  id: string;

  /** Stable id of the placed prop in the shot's scene. */
  node: string;

  /**
   * Id of a fixed affordance on the prop's model whose frame is the flame's
   * base, `+Y` up the flame.
   */
  emitter: string;

  /** Nonnegative safe integer seeding the flame's noise. */
  seed: number;

  /**
   * The flame's shape and size.
   *
   * `small`: a candle, lighter, torch or lantern flame of the given height and
   * widest radius, metres, which sways slightly but does not pulse. `open`: a
   * fire of heat release `heatRelease` in kW over a fuel bed of `diameter`
   * metres, whose luminous height and puffing frequency follow from them.
   * `ember`: a glowing disc of `radius` metres, such as a cigarette's end.
   */
  size:
    | {
        /** Discriminant. */
        kind: "small";

        /** Flame height above the emitter, metres, positive. */
        height: number;

        /** Widest flame radius, metres, positive. */
        radius: number;
      }
    | {
        /** Discriminant. */
        kind: "open";

        /** Heat release rate, kW, positive. */
        heatRelease: number;

        /** Fuel bed diameter, metres, at least 0.04. */
        diameter: number;
      }
    | {
        /** Discriminant. */
        kind: "ember";

        /** Disc radius, metres, positive. */
        radius: number;
      };

  /**
   * Shot-local `[start, end)` seconds the flame burns, as a practical light
   * binding's `on`; omitted, it burns for the whole shot.
   */
  on?: readonly [number, number];

  /** Id of the shot's practical light binding this flame motivates. */
  light?: string;

  /**
   * Luminance of the flame's surface, cd/m², and its linear colour; required
   * exactly when `light` is absent.
   */
  emission?: {
    /** Surface luminance, cd/m², finite and positive. */
    luminance: number;

    /** Linear chromaticity; alpha is ignored. */
    color: IAutoMovieColor;
  };
}

import { AutoMovieArchetypeDevice } from "../AutoMovieArchetypeDevice";
import {
  type AutoMovieArchetype,
} from "../../core/index";
import {
  ArchetypeDraw,
} from "../../core/internal/ArchetypeDraw";
import { AutoMovieArchetypeCamera } from "../AutoMovieArchetypeCamera";
import { AutoMovieArchetypePhone } from "../AutoMovieArchetypePhone";
import { AutoMovieArchetypeRemote } from "../AutoMovieArchetypeRemote";
import { AutoMovieArchetypeTablet } from "../AutoMovieArchetypeTablet";
import "./HandheldDevice";
import { AutoMovieArchetypeRadio } from "../AutoMovieArchetypeRadio";

/*
 * Reads a saved handheld device recipe and calls the producer for its kind.
 * Parameter params: The saved kind, dimensions, model and optional identifier.
 * Parameter seed: The seed used by the selected device.
 * Returns: The selected device in its original coordinate frame.
 * When the kind, model or dimension is
 * refused.
 */
export function createDevice(
  params: AutoMovieArchetypeDevice.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeDevice.Affordance, AutoMovieArchetypeDevice.Dimension> {
  const kind: AutoMovieArchetypeDevice.Kind = ArchetypeDraw.choice(
    "device",
    "kind",
    params.kind,
    AutoMovieArchetypeDevice.KINDS,
  );

  // Saved model inputs are a wider union. The selected draw checks them with the selected kind's table.
  // The saved input spans every variant, so each variant narrows its own kind
  // and model against the lists it makes before it draws.
  const variants: Readonly<
    Record<
      AutoMovieArchetypeDevice.Kind,
      (
        params: AutoMovieArchetypeDevice.IParams,
        seed?: number,
      ) => AutoMovieArchetype<AutoMovieArchetypeDevice.Affordance, AutoMovieArchetypeDevice.Dimension>
    >
  > = {
    phone: ({ model: _model, ...rest }, s) =>
      AutoMovieArchetypePhone.create(rest, s),
    camera: (p, s) =>
      AutoMovieArchetypeCamera.create(
        {
          ...p,
          model: ArchetypeDraw.admit("device", "model", p.model, [
            "grIII",
            "x100vi",
          ] as const),
        },
        s,
      ),
    remote: ({ model: _model, ...rest }, s) =>
      AutoMovieArchetypeRemote.create(rest, s),
    tablet: (p, s) =>
      AutoMovieArchetypeTablet.create(
        {
          ...p,
          model: ArchetypeDraw.admit("device", "model", p.model, [
            "wifi",
            "cellular",
          ] as const),
        },
        s,
      ),
    walkieTalkie: (p, s) =>
      AutoMovieArchetypeRadio.create(
        {
          ...p,
          model: ArchetypeDraw.admit("device", "model", p.model, [
            "nimh1400",
            "liIon1600",
            "liIon2250",
            "liIon2900",
          ] as const),
        },
        s,
      ),
  };
  return variants[kind](params, seed);
}

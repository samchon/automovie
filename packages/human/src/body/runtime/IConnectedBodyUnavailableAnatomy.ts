/**
 * A preview whose anatomy could not be read, with the named reason.
 *
 * `skin-crossing` means the shaped skin crosses itself, so inside and outside
 * are undefined; `ct-domain` means the requested body is outside the adult
 * CT prior's age and stature range, so no head radius is inferred.
 *
 * @author Samchon
 */
export interface IConnectedBodyUnavailableAnatomy {
  /** No anatomy reading was produced. */
  status: "unavailable";

  /** Why the reading is unavailable. */
  reason: "skin-crossing" | "ct-domain";
}

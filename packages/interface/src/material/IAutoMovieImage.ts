/**
 * An image a model carries inside itself, for pixels that code generated together with the model rather than a project asset the host loads.
 *
 * It follows the glTF 2.0 `images` model with the bytes embedded: a texture binding whose `asset` equals this `id` samples these pixels, and the model's images are searched before any project asset of the same name. The viewer decodes the PNG itself, without the host's texture loader and without a vertical flip, so the first PNG row samples at texture coordinate `v = 0`, glTF's convention. Within one shot an id names one image: a second model that cites the same id with different bytes, or as a project asset, is refused when its textures are prepared.
 *
 * Reference: glTF 2.0 images (https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#images), PNG (W3C, 2nd edition), base64 (RFC 4648 section 4).
 *
 * @evidence contracts/common.md#principled-implementation The glTF image record joins an id to typed encoded bytes; engine model admission reads the PNG header to require the subset the viewer decodes, and the viewer resolves bindings against these ids before calling the host loader.
 * @evidence contracts/common.md#clear-and-simple-design One record owns identity and bytes, the model owns the list, and sampling stays on the binding that cites the id, so an image is not tied to one material slot.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only PNG is declared because only PNG is decoded; an image is not resized, recompressed or colour-managed, and an id collision is refused rather than resolved by order.
 * @evidence contracts/common.md#meaningful-documentation States the glTF origin, resolution precedence, row orientation, shot-wide identity, the admitted PNG subset, the base64 form and the edge bound.
 * @author Samchon
 */
export interface IAutoMovieImage {
  /**
   * Id a texture binding's `asset` cites; nonblank and unique within the model.
   */
  id: string;

  /** Media type of {@link data}; PNG is the one decoded format. */
  mimeType: "image/png";

  /**
   * Standard-alphabet padded base64 of the PNG file, without a `data:` prefix. Admission requires a non-interlaced 8-bit greyscale, greyscale-alpha, RGB or RGBA image whose edges are positive and at most 8192 pixels; colour-space intent comes from the binding, and the bytes are not colour-managed.
   */
  data: string;
}

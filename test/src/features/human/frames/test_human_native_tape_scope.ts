import {
  AutoMovieHumanF1,
  AutoMovieHumanF1NativeLaw,
  AutoMovieHumanNativeSourceLaw,
} from "@automovie/human";
import type {
  IAutoMovieConstructionPortLoop,
  IAutoMovieHumanF1,
  IAutoMovieHumanF1NativeLaw,
  IAutoMovieViewPart,
} from "@automovie/interface";

/**
 * Tape-only preparation reads the same calibrated fields without preparing
 * the nose contact, which a complete native assembly needs.
 *
 * Scenarios:
 * 1. The complete original bank provides raw arm and breast controls for
 *    both sides. Native target preparation reads their scalar fields and
 *    finds no attachment wrapper.
 * 2. F1's original source bank provides its named calipers and projection.
 * 3. A sentinel nose loop reports if either preparation reads the contact.
 *    The tape path keeps the read count at zero and returns the two sources.
 *    Complete preparation reads the original loop exactly once.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Uses the complete source bank for actual native target adaptation and both law preparations. Eager attachment wrappers or a tape-path nose contact fail.
 * @evidence contracts/development/testing.md#independent-expectations The original bank names and one declared nose loop determine the expected family names and contact read count independently of the preparation implementation.
 * @evidence contracts/development/testing.md#distinguishing-cases Tape-only and complete preparations borrow the same fields and original bank, with a side effect only when the nose contact is touched.
 * @evidence contracts/development/testing.md#execution-ownership Builds F1's authored source definitions for the sites and the tape candidate using the ordinary source producer. No reference mesh, renderer or native whole body is realized.
 * @evidence contracts/development/common.md#meaningful-documentation States the exact source scope and what each law preparation reads.
 */
export function test_human_native_tape_scope(): void {
  const original: IAutoMovieHumanF1.IAssembly = AutoMovieHumanF1.assemble();
  const { trunk, arm, breast } = original.body;
  const originals: ReadonlyMap<string, IAutoMovieViewPart> = AutoMovieHumanF1.originalSources(original);
  for (const name of [arm.name, arm.name + ".mirror", breast.name, breast.name + ".mirror"]) {
    const stock: IAutoMovieViewPart | undefined = originals.get(name);
    if (stock === undefined) throw new Error("original target is absent: " + name);
    const target: IAutoMovieViewPart = AutoMovieHumanNativeSourceLaw(stock, stock.axis, [1, 1], []);
    if (target.originalSection !== undefined)
      throw new Error("the native target inherited an attachment wrapper: " + name);
  }
  let contactReads: number = 0;
  const scoped: IAutoMovieHumanF1.IAssembly = {
    ...original,
    roots: {
      ...original.roots,
      get nose(): IAutoMovieConstructionPortLoop {
        contactReads++;
        throw new Error("the original nose port is unavailable in this fixture");
      },
    },
  };
  const tapes: ReturnType<typeof AutoMovieHumanF1NativeLaw.prepareTapes> =
    AutoMovieHumanF1NativeLaw.prepareTapes(scoped, originals);
  const pair: ReturnType<typeof tapes.tapeFamilies> = tapes.tapeFamilies({
    wall: tapes.fields.wall,
    roots: { arm: tapes.fields.roots.arm, breast: tapes.fields.roots.breast },
    breastProjection: tapes.fields.breastProjection,
  });
  const tapeReads: number = contactReads;
  const complete: IAutoMovieHumanF1NativeLaw.IPrepared = AutoMovieHumanF1NativeLaw.prepare(scoped, originals);
  if (tapeReads !== 0 || contactReads !== 1 ||
      pair.trunk.name !== trunk.name || pair.breast.name !== breast.name ||
      complete.calibration.nativeSourceReadAttempts !== tapes.calibration.nativeSourceReadAttempts)
    throw new Error("the tape and complete preparation scopes disagreed about their original source reads");
}

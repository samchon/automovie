/**
 * Whether one entry directly inside a production output root is state some
 * production owns rather than the documentation the scaffold ships.
 *
 * `renders/README.md` is a tracked project document. The scaffold ships it and
 * the generated ignore rules cover `renders/<production>/` rather than the file
 * itself, so version control is where it lives and no production namespace
 * claims it. Every other entry is output a production owns, including a
 * directory or a link that borrows that name, because a name alone is not what
 * makes an entry documentation.
 *
 * One rule answers both questions asked of this judgment: whether a first
 * initialization would strand a namespace that already owns output, and whether
 * a legacy layout migration may carry an entry into the production namespace. A
 * second copy would let those two answers disagree, which is how a migration
 * came to move the one document the namespace resolver had already ruled out.
 */
export const isAutoMovieProductionArtifactEntry = (props: {
  /** Output root the entry sits directly inside. */
  directory: "productions" | "generated" | "renders";
  /** Entry name exactly as the directory reports it. */
  name: string;
  /** Whether the entry is a regular file. */
  isFile: boolean;
}): boolean =>
  props.directory !== "renders" ||
  props.name !== "README.md" ||
  props.isFile === false;

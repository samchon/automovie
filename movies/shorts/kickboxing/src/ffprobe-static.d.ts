/** Types of the installed `ffprobe-static` package, which ships none: its default export holds the bundled executable's path. */
declare module "ffprobe-static" {
  /** The bundled FFprobe executable. */
  const ffprobe: { path: string };
  export default ffprobe;
}

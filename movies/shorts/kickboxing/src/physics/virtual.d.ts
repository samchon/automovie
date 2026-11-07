declare module "virtual:bout-physical-source" {
  /** SHA-256 of the current numerical source, computed independently by the build host. */
  const identity: string;
  export default identity;
}

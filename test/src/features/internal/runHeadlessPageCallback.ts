import { runInContext, type Context } from "node:vm";
/** Execute an existing self-contained page callback in the supplied page instance's isolated JavaScript context. Its global references resolve in that context, while the argument and hook closures remain the test's supplied values; Node globals and foreign methods are never replaced. This observes callback semantics only, without DOM, screenshot decoding, navigation, browser serialization or GPU execution. */
export function runHeadlessPageCallback<T>(
  context: Context,
  task: (arg: T) => unknown,
  arg: T,
): unknown {
  const callback: (arg: T) => unknown = runInContext(`(${task.toString()})`, context) as (arg: T) => unknown;
  return callback(arg);
}

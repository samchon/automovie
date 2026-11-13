"use client";

import { type ReactElement, useEffect, useId, useState } from "react";

/**
 * A text field that edits one JSON object.
 *
 * The field keeps the text being typed and hands a value up only while the
 * text parses to an object, so a half-typed value never reaches the
 * composition. An empty field is no value when `optional`. A text that does
 * not parse is said so under the field, which the field is described by.
 *
 * @param props The label, the value, whether it may be absent, and the listener.
 * @returns The field.
 */
export function PlaygroundJsonField(props: {
  /** What the field edits, shown above it. */
  label: string;

  /** The current value; undefined shows an empty field. */
  value: Record<string, unknown> | undefined;

  /** Whether an empty field means no value. */
  optional: boolean;

  /** A sample shown while the field is empty. */
  placeholder?: string;

  /** Hear each value that parses; undefined for an empty optional field. */
  onChange: (value: Record<string, unknown> | undefined) => void;
}): ReactElement {
  const id: string = useId();
  const written: string =
    props.value === undefined ? "" : JSON.stringify(props.value);
  const [text, setText] = useState<string>(written);
  const [error, setError] = useState<string | null>(null);

  // A value set from outside (a preset, an applied fix) replaces the text,
  // unless the text already says the same thing.
  useEffect((): void => {
    setText((current: string): string => {
      try {
        if (
          current.trim() !== "" &&
          JSON.stringify(JSON.parse(current)) === written
        )
          return current;
      } catch {
        // The text does not parse, so the outside value wins.
      }
      return written;
    });
    setError(null);
  }, [written]);

  const change = (next: string): void => {
    setText(next);
    if (next.trim() === "") {
      if (props.optional) {
        setError(null);
        props.onChange(undefined);
      } else setError("Write a JSON object, such as {}");
      return;
    }
    try {
      const value: unknown = JSON.parse(next);
      if (typeof value !== "object" || value === null || Array.isArray(value))
        setError("Write a JSON object, such as {}");
      else {
        setError(null);
        props.onChange(value as Record<string, unknown>);
      }
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : String(thrown));
    }
  };

  return (
    <label className="am-field">
      <span className="am-label">{props.label}</span>
      <textarea
        rows={2}
        spellCheck={false}
        value={text}
        placeholder={props.placeholder}
        aria-invalid={error !== null}
        aria-describedby={error === null ? undefined : id}
        onChange={(event): void => change(event.target.value)}
      />
      {error === null ? null : (
        <span id={id} className="am-field-error">
          {error}
        </span>
      )}
    </label>
  );
}

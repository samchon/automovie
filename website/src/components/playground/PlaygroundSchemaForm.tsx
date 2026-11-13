"use client";

import type { ReactElement } from "react";

import type { IPlaygroundVocabulary } from "../../playground/structures/IPlaygroundVocabulary";
import { PlaygroundJsonField } from "./PlaygroundJsonField";

/**
 * A row's parameters as fields generated from its schema: a select for a
 * closed set, a number input within its bounds, a text input, a switch.
 * Members a field cannot take, and any member the schema does not list,
 * stay in one JSON field under them, so nothing the composition carries is
 * lost. An empty field leaves the member out, so the row takes its default.
 *
 * @param props The fields, the parameters and the listener.
 * @returns The form.
 */
export function PlaygroundSchemaForm(props: {
  /** The row's fields. */
  fields: IPlaygroundVocabulary.IParameter[];

  /** The parameters being edited. */
  value: Record<string, unknown>;

  /** Hear the changed parameters. */
  onChange: (value: Record<string, unknown>) => void;
}): ReactElement {
  const { fields, value } = props;
  const simple: IPlaygroundVocabulary.IParameter[] = fields.filter(
    (f: IPlaygroundVocabulary.IParameter): boolean => f.kind !== "json",
  );
  const named: Set<string> = new Set(
    simple.map((f: IPlaygroundVocabulary.IParameter): string => f.name),
  );
  const rest: Record<string, unknown> = Object.fromEntries(
    Object.entries(value).filter(([key]: [string, unknown]): boolean => !named.has(key)),
  );
  const set = (name: string, member: unknown): void => {
    const next: Record<string, unknown> = { ...value };
    if (member === undefined) delete next[name];
    else next[name] = member;
    props.onChange(next);
  };

  return (
    <div className="am-stack">
      <div className="am-row">
        {simple.map((field: IPlaygroundVocabulary.IParameter): ReactElement => {
          const label: ReactElement = (
            <span className="am-label" title={field.description}>
              {field.name}
              {field.required ? " *" : ""}
            </span>
          );
          const current: unknown = value[field.name];
          if (field.kind === "choice")
            return (
              <label key={field.name} className="am-field am-medium">
                {label}
                <select
                  value={typeof current === "string" ? current : ""}
                  onChange={(event): void =>
                    set(field.name, event.target.value === "" ? undefined : event.target.value)
                  }
                >
                  <option value="">{field.required ? "choose" : "default"}</option>
                  {field.values.map(
                    (v: string): ReactElement => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ),
                  )}
                </select>
              </label>
            );
          if (field.kind === "switch")
            return (
              <label key={field.name} className="am-check">
                <input
                  type="checkbox"
                  checked={current === true}
                  onChange={(event): void => set(field.name, event.target.checked ? true : undefined)}
                />
                {label}
              </label>
            );
          return (
            <label key={field.name} className="am-field am-narrow">
              {label}
              <input
                type={field.kind === "number" ? "number" : "text"}
                value={typeof current === "number" || typeof current === "string" ? String(current) : ""}
                min={field.minimum}
                max={field.maximum}
                step={field.integer === true ? 1 : "any"}
                placeholder={
                  field.kind === "number" && field.minimum !== undefined && field.maximum !== undefined
                    ? `${field.minimum} to ${field.maximum}`
                    : undefined
                }
                onChange={(event): void =>
                  set(
                    field.name,
                    event.target.value === ""
                      ? undefined
                      : field.kind === "number"
                        ? Number(event.target.value)
                        : event.target.value,
                  )
                }
              />
            </label>
          );
        })}
      </div>
      {simple.length === fields.length && Object.keys(rest).length === 0 ? null : (
        <PlaygroundJsonField
          label="Other parameters (JSON)"
          value={rest}
          optional={false}
          onChange={(next: Record<string, unknown> | undefined): void => {
            const kept: Record<string, unknown> = Object.fromEntries(
              Object.entries(value).filter(([key]: [string, unknown]): boolean => named.has(key)),
            );
            props.onChange({ ...kept, ...(next ?? {}) });
          }}
        />
      )}
    </div>
  );
}

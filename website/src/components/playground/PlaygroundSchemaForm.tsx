"use client";

import { type ChangeEvent, type ReactElement, useId } from "react";

import type { IPlaygroundVocabulary } from "../../playground/structures/IPlaygroundVocabulary";
import { PlaygroundJsonField } from "./PlaygroundJsonField";

/**
 * An action's or a row's parameters as fields generated from its schema: a
 * select for a closed set, a number input within its bounds, a text input,
 * a switch, each described to assistive technology by its meaning.
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
  const { fields, value }: typeof props = props;
  const id: string = useId();
  const simple: IPlaygroundVocabulary.IParameter[] = fields.filter(
    (f: IPlaygroundVocabulary.IParameter): boolean => f.kind !== "json",
  );
  const named: Set<string> = new Set(
    simple.map((f: IPlaygroundVocabulary.IParameter): string => f.name),
  );
  const rest: Record<string, unknown> = Object.fromEntries(
    Object.entries(value).filter(
      ([key]: [string, unknown]): boolean => !named.has(key),
    ),
  );
  const set: (name: string, member: unknown) => void = (
    name: string,
    member: unknown,
  ): void => {
    const next: Record<string, unknown> = { ...value };
    if (member === undefined) delete next[name];
    else next[name] = member;
    props.onChange(next);
  };

  return (
    <div className="am-stack">
      <div className="am-row">
        {simple.map((field: IPlaygroundVocabulary.IParameter): ReactElement => {
          // The description is read with the control through
          // `aria-describedby`, and shown on hover through `title`. It is
          // hidden, so the label's own text stays the control's name; a
          // reference still reads hidden text.
          const described: string | undefined =
            field.description === ""
              ? undefined
              : `${id}-${field.name}-description`;
          const label: ReactElement = (
            <>
              <span className="am-label" title={field.description}>
                {field.name}
                {field.required ? " *" : ""}
              </span>
              {described === undefined ? null : (
                <span id={described} hidden>
                  {field.description}
                </span>
              )}
            </>
          );
          const current: unknown = value[field.name];
          if (field.kind === "choice")
            return (
              <label key={field.name} className="am-field am-medium">
                {label}
                <select
                  aria-describedby={described}
                  value={typeof current === "string" ? current : ""}
                  onChange={(event: ChangeEvent<HTMLSelectElement>): void =>
                    set(
                      field.name,
                      event.target.value === ""
                        ? undefined
                        : event.target.value,
                    )
                  }
                >
                  <option value="">
                    {field.required ? "choose" : "default"}
                  </option>
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
          // A switch has three states: the default, on and off, so a member
          // whose default is on can still be turned off.
          if (field.kind === "switch")
            return (
              <label key={field.name} className="am-field am-narrow">
                {label}
                <select
                  aria-describedby={described}
                  value={typeof current === "boolean" ? String(current) : ""}
                  onChange={(event: ChangeEvent<HTMLSelectElement>): void =>
                    set(
                      field.name,
                      event.target.value === ""
                        ? undefined
                        : event.target.value === "true",
                    )
                  }
                >
                  <option value="">default</option>
                  <option value="true">on</option>
                  <option value="false">off</option>
                </select>
              </label>
            );
          return (
            <label key={field.name} className="am-field am-narrow">
              {label}
              <input
                aria-describedby={described}
                type={field.kind === "number" ? "number" : "text"}
                value={
                  typeof current === "number" || typeof current === "string"
                    ? String(current)
                    : ""
                }
                min={field.minimum}
                max={field.maximum}
                step={field.integer === true ? 1 : "any"}
                placeholder={
                  field.kind === "number" &&
                  field.minimum !== undefined &&
                  field.maximum !== undefined
                    ? `${field.minimum} to ${field.maximum}`
                    : undefined
                }
                onChange={(event: ChangeEvent<HTMLInputElement>): void =>
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
      {simple.length === fields.length &&
      Object.keys(rest).length === 0 ? null : (
        <PlaygroundJsonField
          label="Other parameters (JSON)"
          value={rest}
          optional={false}
          onChange={(next: Record<string, unknown> | undefined): void => {
            const kept: Record<string, unknown> = Object.fromEntries(
              Object.entries(value).filter(
                ([key]: [string, unknown]): boolean => named.has(key),
              ),
            );
            props.onChange({ ...kept, ...(next ?? {}) });
          }}
        />
      )}
    </div>
  );
}

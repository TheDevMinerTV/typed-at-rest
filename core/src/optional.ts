/* eslint-disable @typescript-eslint/no-explicit-any */

import * as S from "@effect/schema/Schema";

export const FilledOptionalSchema = <A, I>(schema: S.Schema<A, I>) =>
	S.struct({ filled: S.literal(true), value: schema });
export type FilledOptional<A> = S.Schema.To<ReturnType<typeof FilledOptionalSchema<A, any>>>;
export const newFilledOptional = <T>(value: T) => ({ filled: true, value }) as const satisfies FilledOptional<T>;

export const EmptyOptionalSchema = S.struct({ filled: S.literal(false), value: S.null });
export type EmptyOptional = S.Schema.To<typeof EmptyOptionalSchema>;
export const newEmptyOptional = () => ({ filled: false, value: null }) as const satisfies EmptyOptional;

export const OptionalSchema = <A, I>(schema: S.Schema<A, I>) =>
	S.union(FilledOptionalSchema(schema), EmptyOptionalSchema);
export type Optional<A, I> = S.Schema.To<ReturnType<typeof OptionalSchema<A, I>>>;
export const optionalFromNullable = <T>(value: T | null | undefined) =>
	value === null || value === undefined ? newEmptyOptional() : newFilledOptional(value);

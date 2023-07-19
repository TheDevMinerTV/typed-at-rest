import * as S from "@effect/schema/Schema";
import * as Fn from "effect/Function";

export const DateSchema = Fn.pipe(S.string, S.dateFromString);
export const BigintFromString = S.transform(
	S.string,
	S.bigint,
	(a1) => BigInt(a1),
	(a1) => a1.toString()
);

export const FilledOptionalSchema = <In, Out>(schema: S.Schema<In, Out>) =>
	S.struct({ filled: S.literal(true), value: schema });
export const newFilledOptional = <T>(value: T) => ({ filled: true, value } as const);
export const EmptyOptionalSchema = S.struct({
	filled: S.literal(false),
	value: S.null,
});
export const newEmptyOptional = () => ({ filled: false, value: null } as const);

export const OptionalSchema = <In, Out>(schema: S.Schema<In, Out>) =>
	S.union(FilledOptionalSchema(schema), EmptyOptionalSchema);
export type Optional<In, Out> = S.To<ReturnType<typeof OptionalSchema<In, Out>>>;
export const optionalFromNullable = <T>(value: T | null | undefined) =>
	value === null || value === undefined ? newEmptyOptional() : newFilledOptional(value);

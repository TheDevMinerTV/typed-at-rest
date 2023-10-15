import * as S from "@effect/schema/Schema";

export const FilledOptionalSchema = <In, Out>(schema: S.Schema<In, Out>) =>
	S.struct({ filled: S.literal(true), value: schema });
export const newFilledOptional = <T>(value: T) => ({ filled: true, value }) as const;
export const EmptyOptionalSchema = S.struct({
	filled: S.literal(false),
	value: S.null,
});
export const newEmptyOptional = () => ({ filled: false, value: null }) as const;

export const OptionalSchema = <In, Out>(schema: S.Schema<In, Out>) =>
	S.union(FilledOptionalSchema(schema), EmptyOptionalSchema);
export type Optional<In, Out> = S.Schema.To<ReturnType<typeof OptionalSchema<In, Out>>>;
export const optionalFromNullable = <T>(value: T | null | undefined) =>
	value === null || value === undefined ? newEmptyOptional() : newFilledOptional(value);

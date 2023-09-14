/* eslint-disable @typescript-eslint/no-explicit-any */

import * as S from "@effect/schema/Schema";

export const OkResultSchema = <T>(inner: S.Schema<any, T>) => S.struct({ ok: S.literal(true), data: inner });
export type OkResult<T> = S.Schema.To<ReturnType<typeof OkResultSchema<T>>>;
export const makeOkResult = <T>(inner: T) => ({ ok: true, data: inner } as const);
export type inferOkResult<R> = R extends OkResult<infer Res> ? Res : never;

export const ErrResultSchema = <T>(inner: S.Schema<any, T>) => S.struct({ ok: S.literal(false), error: inner });
export type ErrResult<T> = S.Schema.To<ReturnType<typeof ErrResultSchema<T>>>;
export const makeErrResult = <T>(inner: T) => ({ ok: false, error: inner } as const);
export type inferErrResult<R> = R extends ErrResult<infer Res> ? Res : never;

export const ResultSchema = <DIn, DOut, EIn, EOut>(ok: S.Schema<DIn, DOut>, err: S.Schema<EIn, EOut>) =>
	S.union(OkResultSchema(ok), ErrResultSchema(err));
export type Result<DIn, DOut, EIn, EOut> = S.Schema.To<ReturnType<typeof ResultSchema<DIn, DOut, EIn, EOut>>>;

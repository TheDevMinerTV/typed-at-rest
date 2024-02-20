/* eslint-disable @typescript-eslint/no-explicit-any */

import * as S from "@effect/schema/Schema";

export const OkResultSchema = <A>(inner: S.Schema<A, any>) => S.struct({ ok: S.literal(true), data: inner });
export type OkResult<A> = S.Schema.To<ReturnType<typeof OkResultSchema<A>>>;
export const makeOkResult = <A>(inner: A) => ({ ok: true, data: inner }) as const satisfies OkResult<A>;
export type inferOkResult<R> = R extends OkResult<infer Res> ? Res : never;

export const ErrResultSchema = <A>(inner: S.Schema<A, any>) => S.struct({ ok: S.literal(false), error: inner });
export type ErrResult<A> = S.Schema.To<ReturnType<typeof ErrResultSchema<A>>>;
export const makeErrResult = <A>(inner: A) => ({ ok: false, error: inner }) as const satisfies ErrResult<A>;
export type inferErrResult<R> = R extends ErrResult<infer Res> ? Res : never;

export const ResultSchema = <AOk, IOk, AErr, IErr>(ok: S.Schema<AOk, IOk>, err: S.Schema<AErr, IErr>) =>
	S.union(OkResultSchema(ok), ErrResultSchema(err));
export type Result<AOk, IOk, AErr, IErr> = S.Schema.To<ReturnType<typeof ResultSchema<AOk, IOk, AErr, IErr>>>;

export class WrappedError<E> extends Error {
	constructor(
		error: string,
		public readonly inner: E
	) {
		super(error);
	}
}

export const unwrapResult = <Data, Error>(a: Result<Data, unknown, Error, unknown>) => {
	if (!a.ok) throw new WrappedError("Called unwrapError() on a ErrResult", a.error);

	return a.data;
};

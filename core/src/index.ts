/* eslint-disable @typescript-eslint/no-explicit-any */

import * as S from "@effect/schema/Schema";
import { Result, ResultSchema, WrappedError, inferOkResult, makeErrResult } from "./result";

export * from "./optional";
export * from "./result";

export const APIErrorSchema = S.struct({
	code: S.number,
	message: S.string,
});
export type APIError = S.Schema.To<typeof APIErrorSchema>;
export const makeAPIError = (code: number, message: string): APIError =>
	({ code, message }) as const satisfies APIError;
export const makeAPIErrResult = (code: number, message: string) => makeErrResult(makeAPIError(code, message));

export const APIResultSchema = <A, I>(inner: S.Schema<A, I>) => ResultSchema(inner, APIErrorSchema);
export type APIResult<A, I> = S.Schema.To<ReturnType<typeof APIResultSchema<A, I>>>;

export class TypedError extends WrappedError<APIError> {
	readonly code: number;

	constructor(inner: APIError) {
		super(inner.message, inner);
		this.code = inner.code;
	}
}

export const unwrapAPIResult = <T>(a: Result<T, unknown, APIError, unknown>) => {
	if (!a.ok) throw new TypedError(a.error);

	return a.data;
};

export type HTTPMethod = "GET" | "DELETE" | "POST" | "PATCH" | "PUT";

export type Path<Params> = {
	schema: S.Schema<Params, any>;
	encode: Resolver<Params>;
};
export type inferParams<MD> = MD extends EndpointDefinition<infer Params> ? Params : never;
type Resolver<S> = (s: S) => string;

export const makePathResolver = <Params>(schema: S.Schema<Params, any>, s: Resolver<Params>): Path<Params> => ({
	schema,
	encode: s,
});

// TODO: Allow passing in custom extractors for authentication
type RouteAuth = { auth: boolean };

export type WithResponse<A, I> = { response: S.Schema<A, I> };
export type inferResponse<M> = M extends WithResponse<infer Res, any> ? APIResult<Res, any> : never;
export type inferSuccessResponse<D extends EndpointDefinition<any>, M extends keyof D["methods"]> = inferOkResult<
	D["methods"][M]
>;

export type WithRequest<A, I> = { request: S.Schema<A, I> };
export type inferRequest<M> = M extends WithRequest<infer Req, any> ? Req : never;

export type Route<Method extends HTTPMethod> = (Method extends "GET" | "DELETE"
	? WithResponse<any, any>
	: WithResponse<any, any> | (WithRequest<any, any> & WithResponse<any, any>)) &
	RouteAuth;
export type inferRouteOkResponse<R> = R extends WithResponse<infer Res, any> ? Res : never;

export type EndpointDefinition<Params> = {
	path: Path<Params>;
	methods: {
		[K in HTTPMethod]?: Route<K>;
	};
};

export type Endpoint = EndpointDefinition<any>;

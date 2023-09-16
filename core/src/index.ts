/* eslint-disable @typescript-eslint/no-explicit-any */

import * as S from "@effect/schema/Schema";
import { Result, ResultSchema, WrappedError, inferOkResult, makeErrResult } from "./result";

export * from "./optional";
export * from "./result";
export * from "./utils";

export const APIErrorSchema = S.struct({
	code: S.number,
	message: S.string,
});
export type APIError = S.Schema.To<typeof APIErrorSchema>;
export const makeAPIError = (code: number, message: string): APIError => ({ code, message }) as const;
export const makeAPIErrResult = (code: number, message: string) => makeErrResult(makeAPIError(code, message));

export const APIResultSchema = <In, Out>(inner: S.Schema<In, Out>) => ResultSchema(inner, APIErrorSchema);
export type APIResult<In, Out> = S.Schema.To<ReturnType<typeof APIResultSchema<In, Out>>>;

export class TypedError extends WrappedError<APIError> {
	readonly code: number;

	constructor(inner: APIError) {
		super(inner.message, inner);
		this.code = inner.code;
	}
}

export const unwrapAPIResult = <T>(a: Result<unknown, T, unknown, APIError>) => {
	if (!a.ok) throw new TypedError(a.error);

	return a.data;
};

export type HTTPMethod = "GET" | "DELETE" | "POST" | "PATCH" | "PUT";

export type Path<Params> = {
	schema: S.Schema<any, Params>;
	encode: Resolver<Params>;
};
export type inferParams<MD> = MD extends EndpointDefinition<infer Params> ? Params : never;
type Resolver<S> = (s: S) => string;

export const makePathResolver = <Params>(schema: S.Schema<any, Params>, s: Resolver<Params>): Path<Params> => ({
	schema,
	encode: s,
});

type RouteAuth = { auth: boolean };

export type WithResponse<In, Out> = { response: S.Schema<In, Out> };
export type inferResponse<M> = M extends WithResponse<any, infer Res> ? APIResult<any, Res> : never;
export type inferSuccessResponse<D extends EndpointDefinition<any>, M extends keyof D["methods"]> = inferOkResult<
	D["methods"][M]
>;

export type WithRequest<In, Out> = { request: S.Schema<In, Out> };
export type inferRequest<M> = M extends WithRequest<any, infer Req> ? Req : never;

export type Route<Method extends HTTPMethod> = (Method extends "GET" | "DELETE"
	? WithResponse<any, any>
	: WithResponse<any, any> | (WithRequest<any, any> & WithResponse<any, any>)) &
	RouteAuth;
export type inferRouteOkResponse<R> = R extends WithResponse<any, infer Res> ? Res : never;

export type EndpointDefinition<Params> = {
	path: Path<Params>;
	methods: {
		[K in HTTPMethod]?: Route<K>;
	};
};

export type Endpoint = EndpointDefinition<any>;

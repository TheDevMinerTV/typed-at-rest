/* eslint-disable @typescript-eslint/no-explicit-any */

import * as S from "@effect/schema/Schema";

export * from "./utils";

export const APIErrorSchema = S.struct({
	code: S.number,
	message: S.string,
});
export type APIError = S.To<typeof APIErrorSchema>;
export const makeAPIError = (code: number, message: string): APIError => ({ code, message });

export const APIOkResult = <T>(data: S.Schema<any, T>) => S.struct({ ok: S.literal(true), data });
export const makeAPIOkResult = <T>(data: T) => ({ ok: true, data } as const);

export const APIErrResult = S.struct({ ok: S.literal(false), error: APIErrorSchema });
export const makeAPIErrResult = (code: number, message: string) =>
	({ ok: false, error: makeAPIError(code, message) } as const);

export const APIResultSchema = <In, Out>(inner: S.Schema<In, Out>) => S.union(APIOkResult(inner), APIErrResult);
export type APIResult<In, Out> = S.To<ReturnType<typeof APIResultSchema<In, Out>>>;

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
export type inferResponse<M> = M extends WithResponse<any, infer Res> ? Res : never;

export type WithRequest<In, Out> = { request: S.Schema<In, Out> };
export type inferRequest<M> = M extends WithRequest<any, infer Req> ? Req : never;

export type Route<Method extends HTTPMethod> = (Method extends "GET" | "DELETE"
	? WithResponse<any, any>
	: WithResponse<any, any> | (WithRequest<any, any> & WithResponse<any, any>)) &
	RouteAuth;

export type EndpointDefinition<Params> = {
	path: Path<Params>;
	methods: {
		[K in HTTPMethod]?: Route<K>;
	};
};

export type Endpoint = EndpointDefinition<any>;

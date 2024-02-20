/* eslint-disable @typescript-eslint/no-explicit-any */

import * as S from "@effect/schema/Schema";
import { formatError } from "@effect/schema/TreeFormatter";
import {
	APIResult,
	APIResultSchema,
	EndpointDefinition,
	inferOkResult,
	inferParams,
	inferRequest,
	inferResponse,
	makeAPIErrResult,
} from "@typed-at-rest/core";
import { Effect } from "effect";

type MethodResult<MD> = Promise<inferResponse<MD>>;

type createAuthedMethodFn<MD, Params> = MD extends { request: any }
	? (token: string, params: Params, body: inferRequest<MD>) => MethodResult<MD>
	: (token: string, params: Params) => MethodResult<MD>;

type createAnonMethodFn<MD, Params> = MD extends { request: any }
	? (params: Params, body: inferRequest<MD>) => MethodResult<MD>
	: (params: Params) => MethodResult<MD>;

type createMethodFn<MD, Params> = MD extends { auth: true }
	? createAuthedMethodFn<MD, Params>
	: createAnonMethodFn<MD, Params>;

export type EndpointClient<D extends EndpointDefinition<any>> = {
	[M in keyof D["methods"]]: createMethodFn<D["methods"][M], inferParams<D>>;
};

export type inferSuccessResponse<D extends EndpointClient<any>, M extends keyof D> = inferOkResult<
	Awaited<ReturnType<D[M]>>
>;

export const makeClient = <D extends EndpointDefinition<any>>(base: string, endpoint: D): EndpointClient<D> => {
	const client: Partial<EndpointClient<D>> = {};

	for (const method of Object.keys(endpoint.methods)) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const def = endpoint.methods[method as keyof typeof endpoint.methods]!;

		// @ts-expect-error these signatures match
		client[method] = async function (...args: any[]) {
			const v = Effect.gen(function* (_) {
				const opts: RequestInit = { method: method };

				let token: string | undefined;
				if (def.auth) token = args.shift();

				const params = args.shift() as inferParams<D>;
				const path = endpoint.path.encode(params);
				const url = new URL(path, base);

				const shouldBeBodyless = method === "GET" || method === "DELETE";

				if (!shouldBeBodyless && "request" in def) {
					opts.body = yield* _(
						args.shift(),
						S.encode(def.request),
						Effect.mapError((errors) =>
							makeAPIErrResult(4000, `Could not encode request body with schema: ${formatError(errors)}`)
						),
						Effect.map((encoded) => JSON.stringify(encoded))
					);

					opts.headers = {
						...(def.auth ? { Cookie: `token=${token}` } : {}),
						...opts.headers,
						"Content-Type": "application/json",
					};
				}

				const response = yield* _(Effect.promise(() => fetch(url, opts)));
				const raw = yield* _(Effect.promise(() => response.text()));

				const v = yield* _(
					Effect.try({
						try: () => JSON.parse(raw) as unknown,
						catch: () => makeAPIErrResult(5000, `Could not parse json: ${raw}`),
					}),
					Effect.flatMap(S.validate(APIResultSchema(def.response))),
					Effect.mapError((errors) =>
						"_tag" in errors && errors._tag === "ParseError"
							? makeAPIErrResult(5000, `Could not parse json with schema: ${formatError(errors)}`)
							: (errors as APIResult<any, any>)
					)
				);

				return v;
			}).pipe(Effect.merge, Effect.runPromise);

			return v;
		};
	}

	return client as EndpointClient<D>;
};

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as S from "@effect/schema/Schema";
import { formatErrors } from "@effect/schema/TreeFormatter";
import {
	APIResult,
	APIResultSchema,
	EndpointDefinition,
	inferParams,
	inferRequest,
	inferResponse,
	makeAPIErrResult,
} from "@typed-at-rest/core";
import { Effect } from "effect";
import * as Either from "effect/Either";
import * as Fn from "effect/Function";

type MethodResult<MD> = Promise<APIResult<any, inferResponse<MD>>>;

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

export const makeClient = <D extends EndpointDefinition<any>>(base: string, endpoint: D): EndpointClient<D> => {
	const client: Partial<EndpointClient<D>> = {};

	for (const method of Object.keys(endpoint.methods)) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const def = endpoint.methods[method as keyof typeof endpoint.methods]!;

		// @ts-expect-error these signatures match
		client[method] = async function (...args: any[]) {
			const opts: RequestInit = {
				method: method,
			};

			let token: string | undefined;

			if (def.auth) {
				token = args.shift();
			}

			const params = args.shift() as inferParams<D>;
			const path = endpoint.path.encode(params);
			const url = new URL(path, base);

			const shouldBeBodyless = method === "GET" || method === "DELETE";

			if (!shouldBeBodyless && "request" in def) {
				const rawBody = args.shift();

				const body = Fn.pipe(
					rawBody,
					S.encodeEither(def.request),
					Either.mapRight(
						(errors) => `Could not encode request body with schema: ${formatErrors(errors.errors)}`
					),
					Either.mapLeft((encoded) => JSON.stringify(encoded))
				);

				if (Either.isLeft(body)) return makeAPIErrResult(4000, body.left);

				opts.body = body.right;
				opts.headers = {
					...(def.auth ? { Cookie: `token=${token}` } : {}),
					...opts.headers,
					"Content-Type": "application/json",
				};
			}

			const response = await fetch(url, opts);
			const raw = await response.text();

			const v = Effect.runSync(
				Fn.pipe(
					Effect.try({
						try: () => JSON.parse(raw) as unknown,
						catch: () => makeAPIErrResult(5000, `Could not parse json: ${raw}`),
					}),
					Effect.tap((v) => Effect.log(JSON.stringify(v))),
					Effect.flatMap(S.parse(APIResultSchema(def.response))),
					Effect.mapError((errors) =>
						"_tag" in errors && errors._tag === "ParseError"
							? makeAPIErrResult(5000, `Could not parse json with schema: ${formatErrors(errors.errors)}`)
							: (errors as APIResult<any, any>)
					),
					Effect.merge
				)
			);

			return v;
		};
	}

	return client as EndpointClient<D>;
};

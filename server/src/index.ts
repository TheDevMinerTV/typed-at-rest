/* eslint-disable @typescript-eslint/no-explicit-any */

import * as S from "@effect/schema/Schema";
import { formatErrors } from "@effect/schema/TreeFormatter";
import {
	APIResult,
	APIResultSchema,
	EndpointDefinition,
	HTTPMethod,
	WithRequest,
	inferParams,
	inferRequest,
	inferRouteOkResponse,
	makeAPIErrResult,
} from "@typed-at-rest/core";
import { Effect } from "effect";

type Handler<Params extends Record<string, any>, Body, ResponseData, Request> = (
	request: Request,
	params: Params,
	body: Body
) => Promise<APIResult<any, ResponseData>>;

type createHandlerFn<RD, Params extends Record<string, any>, Request> = RD extends WithRequest<any, any>
	? Handler<Params, inferRequest<RD>, inferRouteOkResponse<RD>, Request>
	: Handler<Params, never, inferRouteOkResponse<RD>, Request>;

export type EndpointHandlers<ED extends EndpointDefinition<any>, Request> = {
	[Method in keyof ED["methods"]]: createHandlerFn<ED["methods"][Method], inferParams<ED>, Request>;
};

export const handleCoreRequest = async <ED extends EndpointDefinition<any>>(
	endpoint: ED,
	handlers: EndpointHandlers<ED, any>,
	method: HTTPMethod,
	rawUrl: string,
	body: unknown,
	request: any
) =>
	Effect.gen(function* (_) {
		type Body = inferRequest<ED["methods"][typeof method]>;
		type Params = inferParams<ED>;

		const url = new URL(rawUrl, "http://localhost");
		const query = Object.fromEntries(url.searchParams);

		const r = endpoint.methods[method];
		if (!r) {
			console.warn(`Received ${method} request on ${url}, but it's schema doesn't support that method`);
			return yield* _(Effect.fail(makeAPIErrResult(405, "Method not allowed")));
		}

		const handler = handlers[method];
		if (!handler) {
			console.warn(`Received ${method} request on ${url}, but no handler is attached to that method`);
			return yield* _(Effect.fail(makeAPIErrResult(500, "No handler attached to method")));
		}

		const params: Params = yield* _(
			query,
			S.parse(endpoint.path.schema),
			Effect.mapError((errors) =>
				makeAPIErrResult(400, `Could not parse query params with schema: ${formatErrors(errors.errors)}`)
			)
		);

		let validated: Body | undefined = undefined;
		if ("request" in r) {
			validated = yield* _(
				body,
				S.parse(r.request),
				Effect.mapError((errors) =>
					makeAPIErrResult(400, `Could not parse json with schema: ${formatErrors(errors.errors)}`)
				)
			);
		}

		const res = yield* _(
			Effect.promise(() =>
				handler(
					request,
					params,
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					validated
				)
			),
			Effect.flatMap(S.encode(APIResultSchema(r.response))),
			Effect.mapError((e) =>
				makeAPIErrResult(500, `Could not encode response with schema: ${formatErrors(e.errors)}`)
			)
		);

		return res;
	}).pipe(Effect.merge, Effect.runPromise);

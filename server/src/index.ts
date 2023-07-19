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
	inferResponse,
	makeAPIErrResult,
} from "@typed-at-rest/core";
import { Effect } from "effect";
import * as Either from "effect/Either";
import * as Fn from "effect/Function";

export type APIRequest = {
	TYPEDATREST_internal: {
		body: unknown;
		method: HTTPMethod;
		url: URL;
		query: Record<string, string | string[] | undefined>;
	};
};

export type APIResponse = {
	TYPEDATREST_internal: {
		status(code: number): APIResponse;
		json(data: unknown): unknown;
	};
};

type Handler<Params extends Record<string, any>, Body, ResponseData, Request, Response> = (
	request: Request,
	response: Response,
	params: Params,
	body: Body
) => Promise<APIResult<any, ResponseData>>;

type createHandlerFn<MD, Params extends Record<string, any>, Request, Response> = MD extends WithRequest<any, any>
	? Handler<Params, inferRequest<MD>, inferResponse<MD>, Request, Response>
	: Handler<Params, never, inferResponse<MD>, Request, Response>;

export type EndpointHandlers<ED extends EndpointDefinition<any>, Request, Response> = {
	[Method in keyof ED["methods"]]: createHandlerFn<ED["methods"][Method], inferParams<ED>, Request, Response>;
};

export const makeCoreHandler = <
	ED extends EndpointDefinition<any>,
	Request extends APIRequest,
	Response extends APIResponse
>(
	endpoint: ED,
	handlers: EndpointHandlers<ED, Request, Response>
) => {
	return async (req: Request, res: Response) => {
		const r = endpoint.methods[req.TYPEDATREST_internal.method];
		const handler = handlers[req.TYPEDATREST_internal.method];

		console.log("req.TYPEDATREST_internal.method", req.TYPEDATREST_internal.method);

		if (!r) {
			console.warn(
				`Received ${req.TYPEDATREST_internal.method} request on ${req.TYPEDATREST_internal.url}, but it's schema doesn't support that method`
			);

			return res.TYPEDATREST_internal.status(405).TYPEDATREST_internal.json({
				ok: false,
				error: {
					code: 405,
					message: "Method not allowed",
				},
			});
		}
		if (!handler) {
			console.warn(
				`Received ${req.TYPEDATREST_internal.method} request on ${req.TYPEDATREST_internal.url}, but no handler is attached to that method`
			);

			return res.TYPEDATREST_internal.status(405).TYPEDATREST_internal.json({
				ok: false,
				error: {
					code: 405,
					message: "Method not allowed",
				},
			});
		}

		const params = Fn.pipe(
			req.TYPEDATREST_internal.query,
			S.parseEither(endpoint.path.schema),
			Either.mapLeft((errors) => ({
				code: 400,
				message: `Could not parse path params with schema: ${formatErrors(errors.errors)}`,
			}))
		);
		if (Either.isLeft(params)) {
			return res.TYPEDATREST_internal.status(params.left.code).TYPEDATREST_internal.json({
				ok: false,
				error: params.left,
			});
		}

		let validated: inferRequest<ED["methods"][typeof req.TYPEDATREST_internal.method]> | undefined = undefined;

		if ("request" in r) {
			const json = Fn.pipe(
				req.TYPEDATREST_internal.body,
				S.parseEither(r.request),
				Either.mapLeft((errors) => ({
					code: 400,
					message: `Could not parse json with schema: ${formatErrors(errors.errors)}`,
				}))
			);
			if (Either.isLeft(json)) {
				return res.TYPEDATREST_internal.status(json.left.code).TYPEDATREST_internal.json({
					ok: false,
					error: json.left,
				});
			}

			validated = json.right;
		}

		const v = await Effect.runPromise(
			Fn.pipe(
				Effect.promise(() => {
					// @ts-expect-error these signatures match
					const r = handler(req, res, params.right, validated);

					return r;
				}),
				Effect.tap((r) => Effect.log(JSON.stringify(r))),
				Effect.flatMap(S.encode(APIResultSchema(r.response))),
				Effect.mapError((errors) =>
					makeAPIErrResult(500, `Could not encode response with schema: ${formatErrors(errors.errors)}`)
				),
				Effect.merge
			)
		);

		return res.TYPEDATREST_internal.status(v.ok ? 200 : v.error.code).TYPEDATREST_internal.json(v);
	};
};

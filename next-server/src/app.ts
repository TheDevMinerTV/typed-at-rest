/* eslint-disable @typescript-eslint/no-explicit-any */

import { APIResult, EndpointDefinition, HTTPMethod, makeAPIErrResult } from "@typed-at-rest/core";
import { EndpointHandlers, handleCoreRequest } from "@typed-at-rest/server";
import { NextRequest } from "next/server";

export type createNextAppHandlers<ED extends EndpointDefinition<any>> = {
	[M in keyof ED["methods"]]: (request: NextRequest) => Promise<Response>;
};

export const makeNextAppHandler = <ED extends EndpointDefinition<any>>(
	endpoint: ED,
	handlers: EndpointHandlers<ED, NextRequest>
) => {
	const h = {} as createNextAppHandlers<ED>;

	for (const method of Object.keys(endpoint.methods)) {
		const m = method as HTTPMethod;
		const def = endpoint.methods[m]!;

		h[m] = async (req: NextRequest) => {
			if (req.method !== method) {
				return new Response(
					JSON.stringify(
						makeAPIErrResult(405, `Method ${req.method} not allowed`) satisfies APIResult<any, any>
					),
					{ status: 405, headers: { Allow: method } }
				);
			}

			const bodyIn = "request" in def ? await req.json() : undefined;

			// TODO: Handle error
			const handlerResponse = await handleCoreRequest(endpoint, handlers, m, req.url, bodyIn, req);

			console.log(handlerResponse);
			const body = JSON.stringify(handlerResponse);

			return new Response(body, {
				status: handlerResponse.ok ? 200 : handlerResponse.error.code,
				headers: {
					"Content-Type": "application/json",
				},
			});
		};
	}

	return h;
};

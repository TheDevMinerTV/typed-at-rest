/* eslint-disable @typescript-eslint/no-explicit-any */

import { EndpointDefinition } from "@typed-at-rest/core";
import { APIRequest, APIResponse, EndpointHandlers, makeCoreHandler } from "@typed-at-rest/server";
import { NextApiRequest, NextApiResponse } from "next";

type Request = NextApiRequest & APIRequest;
type Response = NextApiResponse & APIResponse;

const transformRequest = (req: NextApiRequest): Request => {
	const url = new URL(req.url!, "http://localhost");

	const r = req as Request;

	r.TYPEDATREST_internal = {
		body: req.body,
		method: req.method as any,
		url: url,
		query: req.query,
	};

	return r;
};

const transformResponse = (res: NextApiResponse): Response => {
	const r = res as Response;

	r.TYPEDATREST_internal = {
		status: (code: number) => transformResponse(r.status(code)),
		json: (data: unknown) => r.json(data),
	};

	return r;
};

export const makeNextPagesHandler = <ED extends EndpointDefinition<any>>(
	endpoint: ED,
	handlers: EndpointHandlers<ED, NextApiRequest & APIRequest, NextApiResponse & APIResponse>
) => {
	const h = makeCoreHandler(endpoint, handlers);

	return (req: NextApiRequest, res: NextApiResponse) => {
		const apiReq = transformRequest(req);
		const apiRes = transformResponse(res);

		return h(apiReq, apiRes);
	};
};

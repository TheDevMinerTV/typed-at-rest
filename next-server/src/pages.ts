/* eslint-disable @typescript-eslint/no-explicit-any */

import { EndpointDefinition, HTTPMethod } from "@typed-at-rest/core";
import { EndpointHandlers, handleCoreRequest, } from "@typed-at-rest/server";
import { NextApiRequest, NextApiResponse } from "next";

export const makeNextPagesHandler = <ED extends EndpointDefinition<any>>(
	endpoint: ED,
	handlers: EndpointHandlers<ED, NextApiRequest>
) => {
	return async (req: NextApiRequest, res: NextApiResponse) => {
		const handlerResponse = await handleCoreRequest(
			endpoint,
			handlers,
			req.method as HTTPMethod,
			req.url!,
			req.body,
			req
		);

		return res.status(handlerResponse.ok ? 200 : handlerResponse.error.code).json(handlerResponse);
	};
};

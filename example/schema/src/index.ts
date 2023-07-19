import * as S from "@effect/schema/Schema";
import { Endpoint, makePathResolver } from "@typed-at-rest/core";

export const DemoEndpoint = {
	path: makePathResolver(S.struct({}), () => "/api/demo"),
	methods: {
		GET: {
			auth: false,
			response: S.struct({
				message: S.string,
			}),
		},
	},
} as const satisfies Endpoint;

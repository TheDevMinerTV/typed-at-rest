import * as S from "@effect/schema/Schema";
import { Endpoint, makePathResolver } from "@typed-at-rest/core";

export const PagesDemoEndpoint = {
	path: makePathResolver(S.struct({}), () => "/api/pages-demo"),
	methods: {
		GET: {
			auth: false,
			response: S.struct({
				message: S.string,
			}),
		},
	},
} as const satisfies Endpoint;

export const AppDirDemoEndpoint = {
	path: makePathResolver(S.struct({}), () => "/api/app-dir-demo"),
	methods: {
		GET: {
			auth: false,
			response: S.struct({
				message: S.string,
			}),
		},
	},
} as const satisfies Endpoint;

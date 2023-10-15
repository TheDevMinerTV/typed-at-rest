import { makeOkResult } from "@typed-at-rest/core";
import { AppDirDemoEndpoint } from "@typed-at-rest/example-schema";
import { makeNextAppHandler } from "@typed-at-rest/next-server";

const handlers = makeNextAppHandler(AppDirDemoEndpoint, {
	async GET() {
		return makeOkResult({
			message: "Hello from the app dir!",
		});
	},
});

export const GET = handlers.GET;

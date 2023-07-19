import { makeAPIOkResult } from "@typed-at-rest/core";
import { DemoEndpoint } from "@typed-at-rest/example-schema";
import { makeNextPagesHandler } from "@typed-at-rest/next-server";

export default makeNextPagesHandler(DemoEndpoint, {
	async GET() {
		return makeAPIOkResult({
			message: "Hello world",
		});
	},
});

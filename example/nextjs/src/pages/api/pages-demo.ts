import { makeOkResult } from "@typed-at-rest/core";
import { PagesDemoEndpoint } from "@typed-at-rest/example-schema";
import { makeNextPagesHandler } from "@typed-at-rest/next-server";

export default makeNextPagesHandler(PagesDemoEndpoint, {
	async GET() {
		return makeOkResult({
			message: "Hello world from the pages dir",
		});
	},
});

import { makeClient } from "@typed-at-rest/client";
import { AppDirDemoEndpoint } from "@typed-at-rest/example-schema";

async function main() {
	const c = makeClient("http://localhost:3000", AppDirDemoEndpoint);

	const v = await c.GET({});
	console.log(v);
}

main();

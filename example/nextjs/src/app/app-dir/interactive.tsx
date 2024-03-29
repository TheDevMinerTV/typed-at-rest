"use client";

import { makeClient, type inferSuccessResponse } from "@typed-at-rest/client";
import { AppDirDemoEndpoint } from "@typed-at-rest/example-schema";
import Link from "next/link";
import { useEffect, useState } from "react";

export function AppDirDemo() {
	const client = makeClient(typeof window === "undefined" ? "" : window.location.origin, AppDirDemoEndpoint);
	const [res, setRes] = useState<inferSuccessResponse<typeof client, "GET"> | null>(null);

	useEffect(() => {
		client.GET({}).then((res) => {
			if (res.ok) setRes(res.data);
		});
	}, []);

	return (
		<>
			<Link href="/">Back</Link>

			{res && <pre>{res.message}</pre>}
		</>
	);
}

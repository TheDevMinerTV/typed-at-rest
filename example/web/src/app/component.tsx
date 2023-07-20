"use client";

import { inferSuccessResponse, makeClient } from "@typed-at-rest/client";
import { DemoEndpoint } from "@typed-at-rest/example-schema";
import { useEffect, useState } from "react";

export function Demo() {
	const client = makeClient(window.location.origin, DemoEndpoint);
	const [res, setRes] = useState<inferSuccessResponse<typeof client, "GET"> | null>(null);

	useEffect(() => {
		client.GET({}).then((res) => {
			if (res.ok) setRes(res.data);
		});
	}, []);

	return <div>{res?.message}</div>;
}

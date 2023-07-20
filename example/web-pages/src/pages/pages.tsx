import { inferSuccessResponse, makeClient } from "@typed-at-rest/client";
import { PagesDemoEndpoint } from "@typed-at-rest/example-schema";
import { useEffect, useState } from "react";

export function PagesDemo() {
	const client = makeClient(typeof window === "undefined" ? "" : window.location.origin, PagesDemoEndpoint);
	const [res, setRes] = useState<inferSuccessResponse<typeof client, "GET"> | null>(null);

	useEffect(() => {
		client.GET({}).then((res) => {
			if (res.ok) setRes(res.data);
		});
	}, []);

	return <div>{res?.message}</div>;
}

export default function PagesDemoPage() {
	return (
		<main>
			<PagesDemo />
		</main>
	);
}

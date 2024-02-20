import { inferSuccessResponse, makeClient } from "@typed-at-rest/client";
import { PagesDemoEndpoint } from "@typed-at-rest/example-schema";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PagesDemo() {
	const client = makeClient(typeof window === "undefined" ? "" : window.location.origin, PagesDemoEndpoint);
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

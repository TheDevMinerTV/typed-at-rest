import Link from "next/link";

export default function Home() {
	return (
		<nav style={{ display: "flex", gap: "1rem" }}>
			<Link href="/app-dir">AppDir Demo</Link>
			<Link href="/pages">Pages Demo</Link>
		</nav>
	);
}

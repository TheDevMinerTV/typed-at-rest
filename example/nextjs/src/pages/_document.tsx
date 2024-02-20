import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
	return (
		<Html lang="en" style={{ minHeight: "100vh" }}>
			<Head />
			<body style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
